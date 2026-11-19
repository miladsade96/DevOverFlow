// @vitest-environment node
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
const session = vi.hoisted(() => ({ userId: "user_actor" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: session.userId }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import User from "@/database/user.model";
import Question from "@/database/question.model";
import Answer from "@/database/answer.model";
import Tag from "@/database/tag.model";
import Interaction from "@/database/interaction.model";
import {
  createQuestion,
  editQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
} from "@/lib/actions/question.action";
import {
  createAnswer,
  deleteAnswer,
  downvoteAnswer,
  getAnswers,
} from "@/lib/actions/answer.action";
import {
  getSavedQuestions,
  getUserById,
  toggleSaveQuestion,
  updateUser,
} from "@/lib/actions/user.action";
import { getQuestionsByTagId, getAllTags } from "@/lib/actions/tag.actions";
import { syncClerkUser } from "@/lib/server/user-sync";
import { inTransaction } from "@/lib/server/transaction";
import { viewQuestion } from "@/lib/actions/interaction.action";

let server: MongoMemoryReplSet;
let actor: mongoose.Document & { _id: mongoose.Types.ObjectId };
let author: mongoose.Document & { _id: mongoose.Types.ObjectId };
beforeAll(async () => {
  server = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "8.0.20" },
  });
  vi.stubEnv("MONGODB_URL", server.getUri());
  await mongoose.connect(server.getUri(), { dbName: "offline-integration" });
  await Promise.all([User.init(), Tag.init()]);
}, 180000);
afterAll(async () => {
  await mongoose.disconnect();
  await server?.stop();
  vi.unstubAllEnvs();
}, 30000);
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Question.deleteMany({}),
    Answer.deleteMany({}),
    Tag.deleteMany({}),
    Interaction.deleteMany({}),
  ]);
  session.userId = "user_actor";
  actor = await User.create({
    clerkId: "user_actor",
    name: "Actor",
    username: "actor",
    email: "actor@example.test",
    picture: "https://example.test/a.png",
  });
  author = await User.create({
    clerkId: "user_author",
    name: "Author",
    username: "author",
    email: "author@example.test",
    picture: "https://example.test/b.png",
  });
});
async function existingQuestion() {
  return Question.create({
    title: "A programming question",
    content: "x".repeat(110),
    author: author._id,
  });
}
describe("ephemeral MongoDB replica set: real queries and transactions", () => {
  it("records concurrent views once and ignores a forged viewer ID", async () => {
    const question = await existingQuestion();
    const params = {
      questionId: String(question._id),
      userId: String(author._id),
    };
    await Promise.all([viewQuestion(params), viewQuestion(params)]);
    expect(
      await Interaction.countDocuments({
        question: question._id,
        action: "view",
      }),
    ).toBe(1);
    expect(String((await Interaction.findOne({ action: "view" })).user)).toBe(
      String(actor._id),
    );
    expect((await Question.findById(question._id)).views).toBe(1);
  });
  it("ranks answers by vote count instead of by the IDs inside the vote array", async () => {
    const question = await existingQuestion();
    const low = await Answer.create({
      author: actor._id,
      question: question._id,
      content: "low",
      upvotes: [new mongoose.Types.ObjectId("ffffffffffffffffffffffff")],
    });
    const high = await Answer.create({
      author: actor._id,
      question: question._id,
      content: "high",
      upvotes: [
        new mongoose.Types.ObjectId("000000000000000000000001"),
        new mongoose.Types.ObjectId("000000000000000000000002"),
      ],
    });
    const result = await getAnswers({
      questionId: String(question._id),
      sortBy: "highestUpvotes",
    });
    expect(result.answers.map((answer) => String(answer._id))).toEqual([
      String(high._id),
      String(low._id),
    ]);
  });
  it("ranks popular tags by the number of associated questions", async () => {
    await Tag.create({
      name: "one",
      description: "One",
      questions: [new mongoose.Types.ObjectId("ffffffffffffffffffffffff")],
    });
    await Tag.create({
      name: "two",
      description: "Two",
      questions: [
        new mongoose.Types.ObjectId("000000000000000000000001"),
        new mongoose.Types.ObjectId("000000000000000000000002"),
      ],
    });
    expect(
      (await getAllTags({ filter: "popular" })).tags.map((tag) => tag.name),
    ).toEqual(["two", "one"]);
  });
  it("creates a question, literal tags and interaction atomically using the session actor", async () => {
    await createQuestion({
      title: "How do async functions work?",
      content: "x".repeat(110),
      tags: ["C++", "c++"],
      author: author._id as never,
      path: "/",
    });
    const question = await Question.findOne({});
    const tags = await Tag.find({});
    expect(String(question.author)).toBe(String(actor._id));
    expect(tags.map((tag) => tag.name)).toEqual(["c++"]);
    expect(tags[0].questions.map(String)).toEqual([String(question._id)]);
    expect(
      await Interaction.countDocuments({
        user: actor._id,
        action: "ask_question",
      }),
    ).toBe(1);
    expect((await User.findById(actor._id)).reputation).toBe(5);
  });
  it("rolls back the entire database operation on failure", async () => {
    await expect(
      inTransaction(async (transaction) => {
        await Question.create(
          [{ title: "Rolled back", content: "x", author: actor._id }],
          { session: transaction },
        );
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");
    expect(await Question.countDocuments()).toBe(0);
  });
  it("changes and removes votes without duplicate IDs or reputation drift", async () => {
    const question = await existingQuestion();
    const params = {
      questionId: String(question._id),
      userId: String(author._id),
      hasupVoted: true,
      hasdownVoted: true,
      path: "/",
    };
    await upvoteQuestion(params);
    await downvoteQuestion(params);
    expect((await User.findById(author._id)).reputation).toBe(-2);
    expect((await User.findById(actor._id)).reputation).toBe(-1);
    await downvoteQuestion(params);
    const saved = await Question.findById(question._id);
    expect(saved.upvotes).toHaveLength(0);
    expect(saved.downvotes).toHaveLength(0);
    expect((await User.findById(author._id)).reputation).toBe(0);
    expect((await User.findById(actor._id)).reputation).toBe(0);
  });
  it("serializes concurrent vote toggles through transaction retries", async () => {
    const question = await existingQuestion();
    const params = {
      questionId: String(question._id),
      userId: "forged",
      hasupVoted: false,
      hasdownVoted: false,
      path: "/",
    };
    await Promise.all([upvoteQuestion(params), upvoteQuestion(params)]);
    expect((await Question.findById(question._id)).upvotes).toHaveLength(0);
    expect((await User.findById(author._id)).reputation).toBe(0);
    expect((await User.findById(actor._id)).reputation).toBe(0);
  });
  it("rejects editing/deleting someone else's post with the database unchanged", async () => {
    const question = await existingQuestion();
    await expect(
      editQuestion({
        questionId: String(question._id),
        title: "A changed title",
        content: "x".repeat(110),
        path: "/",
      }),
    ).rejects.toThrow("permission");
    await expect(
      deleteQuestion({ questionId: String(question._id), path: "/" }),
    ).rejects.toThrow("permission");
    expect((await Question.findById(question._id)).title).toBe(
      "A programming question",
    );
  });
  it("creates answers with the session actor and removes their references on deletion", async () => {
    const question = await existingQuestion();
    await createAnswer({
      content: "x".repeat(110),
      author: String(author._id),
      question: String(question._id),
      path: "/",
    });
    const answer = await Answer.findOne({});
    expect(String(answer.author)).toBe(String(actor._id));
    expect((await Question.findById(question._id)).answers.map(String)).toEqual(
      [String(answer._id)],
    );
    await deleteAnswer({ answerId: String(answer._id), path: "/" });
    expect((await Question.findById(question._id)).answers).toHaveLength(0);
    expect(await Interaction.countDocuments({ answer: answer._id })).toBe(0);
  });
  it("deletes an owned question's answers, tags, interactions and saved references", async () => {
    const question = await Question.create({
      title: "Owned question",
      content: "x",
      author: actor._id,
    });
    const answer = await Answer.create({
      author: author._id,
      question: question._id,
      content: "answer",
    });
    await Tag.create({
      name: "js",
      description: "JavaScript",
      questions: [question._id],
    });
    await User.updateOne(
      { _id: author._id },
      { $push: { saved: question._id } },
    );
    await Interaction.create({
      user: actor._id,
      question: question._id,
      answer: answer._id,
      action: "view",
    });
    await deleteQuestion({ questionId: String(question._id), path: "/" });
    expect(await Question.countDocuments()).toBe(0);
    expect(await Answer.countDocuments()).toBe(0);
    expect(await Interaction.countDocuments()).toBe(0);
    expect((await Tag.findOne({})).questions).toHaveLength(0);
    expect((await User.findById(author._id)).saved).toHaveLength(0);
  });
  it("paginates the actor's saved questions without leaking another user's collection", async () => {
    const questions = await Question.create(
      Array.from({ length: 11 }, (_, i) => ({
        title: `Question number ${i}`,
        content: "x",
        author: author._id,
        createdAt: new Date(2026, 0, i + 1),
      })),
    );
    await User.updateOne(
      { _id: actor._id },
      { $set: { saved: questions.map((question) => question._id) } },
    );
    const first = await getSavedQuestions({ clerkId: "user_author", page: 1 });
    const second = await getSavedQuestions({ clerkId: "user_author", page: 2 });
    expect(first.questions).toHaveLength(10);
    expect(first.isNext).toBe(true);
    expect(second.questions).toHaveLength(1);
    expect(second.isNext).toBe(false);
    expect(first.questions[0].title).toBe("Question number 10");
  });
  it("returns one tag page without repeating the lookahead row", async () => {
    const questions = await Question.create(
      Array.from({ length: 3 }, (_, i) => ({
        title: `Question ${i}`,
        content: "x",
        author: actor._id,
      })),
    );
    const tag = await Tag.create({
      name: "test",
      description: "Test",
      questions: questions.map((question) => question._id),
    });
    const first = await getQuestionsByTagId({
      tagId: String(tag._id),
      pageSize: 2,
    });
    expect(first.questions).toHaveLength(2);
    expect(first.isNext).toBe(true);
  });
  it("keeps public profiles private and rejects protected-field updates", async () => {
    await User.updateOne(
      { _id: author._id },
      {
        $set: {
          password: "legacy-hash",
          saved: [new mongoose.Types.ObjectId()],
        },
      },
    );
    const profile = await getUserById({ userId: "user_author" });
    expect(profile.email).toBeUndefined();
    expect(profile.password).toBeUndefined();
    expect(profile.saved).toBeUndefined();
    await updateUser({
      clerkId: "user_actor",
      updateData: {
        name: "Updated",
        username: "actor",
        bio: "",
        location: "",
        portfolioWebsite: "",
        reputation: 9000,
      } as never,
      path: "/",
    });
    expect((await User.findById(actor._id)).reputation).toBe(0);
  });
  it("handles replayed creation webhooks without duplicate users", async () => {
    const event = {
      type: "user.created",
      data: {
        id: "webhook_user",
        first_name: null,
        last_name: null,
        username: null,
        image_url: "https://example.test/avatar.png",
        email_addresses: [
          { id: "email_1", email_address: "webhook@example.test" },
        ],
        primary_email_address_id: "email_1",
      },
    } as never;
    await syncClerkUser(event);
    await syncClerkUser(event);
    expect(await User.countDocuments({ clerkId: "webhook_user" })).toBe(1);
    expect((await User.findOne({ clerkId: "webhook_user" })).name).toBe(
      "Community member",
    );
  });
  it("removes a deleted Clerk user's data and cross-references", async () => {
    const question = await existingQuestion();
    const answer = await Answer.create({
      author: actor._id,
      question: question._id,
      content: "x",
    });
    await Question.updateOne(
      { _id: question._id },
      { $push: { answers: answer._id } },
    );
    await syncClerkUser({
      type: "user.deleted",
      data: { id: "user_actor" },
    } as never);
    expect(await User.findById(actor._id)).toBeNull();
    expect(await Answer.countDocuments()).toBe(0);
    expect((await Question.findById(question._id)).answers).toHaveLength(0);
  });
});
