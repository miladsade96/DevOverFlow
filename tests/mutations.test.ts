import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => {
  const model = () => ({
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    updateMany: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    exists: vi.fn(),
  });
  return {
    auth: vi.fn(),
    connect: vi.fn(),
    user: model(),
    question: model(),
    answer: model(),
    interaction: model(),
    tag: model(),
    revalidate: vi.fn(),
  };
});
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/mongoose", () => ({ connectToDatabase: mocks.connect }));
vi.mock("@/database/user.model", () => ({ default: mocks.user }));
vi.mock("@/database/question.model", () => ({ default: mocks.question }));
vi.mock("@/database/answer.model", () => ({ default: mocks.answer }));
vi.mock("@/database/interaction.model", () => ({ default: mocks.interaction }));
vi.mock("@/database/tag.model", () => ({ default: mocks.tag }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/server/transaction", () => ({
  inTransaction: (work: (session: object) => unknown) => work({}),
}));
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
  upvoteAnswer,
  downvoteAnswer,
} from "@/lib/actions/answer.action";
import {
  updateUser,
  toggleSaveQuestion,
  getSavedQuestions,
} from "@/lib/actions/user.action";

const actorId = "a".repeat(24),
  authorId = "b".repeat(24),
  id = "c".repeat(24);
const actor = { _id: actorId, clerkId: "signed-in", saved: [] };
const vote = {
  questionId: id,
  answerId: id,
  userId: authorId,
  hasupVoted: true,
  hasdownVoted: true,
  path: "/",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "signed-in" });
  mocks.user.findOne.mockResolvedValue(actor);
});
describe("server-side authorization", () => {
  const actions = [
    () =>
      createQuestion({
        title: "A valid question",
        content: "x".repeat(110),
        tags: ["javascript"],
        author: authorId as never,
        path: "/",
      }),
    () =>
      createAnswer({
        content: "x".repeat(110),
        author: authorId,
        question: id,
        path: "/",
      }),
    () =>
      editQuestion({
        questionId: id,
        title: "A valid question",
        content: "x".repeat(110),
        path: "/",
      }),
    () => deleteQuestion({ questionId: id, path: "/" }),
    () => deleteAnswer({ answerId: id, path: "/" }),
    () => upvoteQuestion(vote),
    () => downvoteQuestion(vote),
    () => upvoteAnswer(vote),
    () => downvoteAnswer(vote),
    () => updateUser({ clerkId: "other", updateData: {}, path: "/" }),
    () => toggleSaveQuestion({ userId: authorId, questionId: id, path: "/" }),
    () => getSavedQuestions({ clerkId: "other" }),
  ];
  it.each(actions.map((action, index) => [index, action] as const))(
    "rejects signed-out mutation/read %s before database access",
    async (_, action) => {
      mocks.auth.mockResolvedValue({ userId: null });
      await expect(action()).rejects.toThrow("sign in");
      expect(mocks.connect).not.toHaveBeenCalled();
      expect(mocks.question.create).not.toHaveBeenCalled();
    },
  );
  it("denies editing another user's question", async () => {
    mocks.question.findById.mockResolvedValue({ author: authorId });
    await expect(
      editQuestion({
        questionId: id,
        title: "A valid question",
        content: "x".repeat(110),
        path: "/",
      }),
    ).rejects.toThrow("permission");
    expect(mocks.question.updateOne).not.toHaveBeenCalled();
  });
  it.each(["question", "answer"])(
    "denies deleting another user's %s before any deletion",
    async (kind) => {
      const model = kind === "question" ? mocks.question : mocks.answer;
      model.findById.mockReturnValue({
        session: vi.fn().mockResolvedValue({ author: authorId }),
      });
      await expect(
        kind === "question"
          ? deleteQuestion({ questionId: id, path: "/" })
          : deleteAnswer({ answerId: id, path: "/" }),
      ).rejects.toThrow("permission");
      expect(model.deleteOne).not.toHaveBeenCalled();
    },
  );
  it("ignores a forged answer author and writes the authenticated actor", async () => {
    mocks.question.findById.mockReturnValue({
      session: vi.fn().mockResolvedValue({ tags: [] }),
    });
    mocks.answer.create.mockResolvedValue([{ _id: id }]);
    await createAnswer({
      content: "A".repeat(110),
      author: authorId,
      question: id,
      path: "/",
    });
    expect(mocks.answer.create.mock.calls[0][0][0].author).toBe(actorId);
    expect(mocks.user.updateOne.mock.calls[0][0]).toEqual({ _id: actorId });
  });
  it("prevents another profile being edited", async () => {
    await expect(
      updateUser({ clerkId: "other", updateData: {}, path: "/" }),
    ).rejects.toThrow("another user");
    expect(mocks.user.updateOne).not.toHaveBeenCalled();
  });
  it("saves questions to the authenticated user's collection", async () => {
    mocks.question.exists.mockResolvedValue({ _id: id });
    await toggleSaveQuestion({ userId: authorId, questionId: id, path: "/" });
    expect(mocks.user.updateOne).toHaveBeenCalledWith(
      { _id: actorId },
      { $addToSet: { saved: id } },
    );
  });
});
describe("persisted voting state", () => {
  it.each(["question", "answer"])(
    "ignores forged vote flags and decreases the %s author's reputation",
    async (kind) => {
      const item = {
        author: authorId,
        upvotes: [],
        downvotes: [],
        save: vi.fn(),
      };
      (kind === "question"
        ? mocks.question
        : mocks.answer
      ).findById.mockReturnValue({ session: vi.fn().mockResolvedValue(item) });
      await (kind === "question"
        ? downvoteQuestion(vote)
        : downvoteAnswer(vote));
      expect(item.downvotes).toEqual([actorId]);
      expect(mocks.user.updateOne).toHaveBeenCalledWith(
        { _id: authorId },
        { $inc: { reputation: -2 } },
        expect.anything(),
      );
      await (kind === "question"
        ? downvoteQuestion(vote)
        : downvoteAnswer(vote));
      expect(item.downvotes).toEqual([]);
      expect(mocks.user.updateOne).toHaveBeenLastCalledWith(
        { _id: authorId },
        { $inc: { reputation: 2 } },
        expect.anything(),
      );
    },
  );
  it("blocks self-voting", async () => {
    const save = vi.fn();
    mocks.question.findById.mockReturnValue({
      session: vi.fn().mockResolvedValue({ author: actorId, save }),
    });
    await expect(upvoteQuestion(vote)).rejects.toThrow("own post");
    expect(save).not.toHaveBeenCalled();
    expect(mocks.user.updateOne).not.toHaveBeenCalled();
  });
});
