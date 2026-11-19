"use server";

import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/database/question.model";
import Tag from "@/database/tag.model";
import User from "@/database/user.model";
import {
  CreateQuestionParams,
  DeleteQuestionParams,
  EditQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
  RecommendedParams,
} from "./shared.types";
import { revalidatePath } from "next/cache";
import Answer from "@/database/answer.model";
import Interaction from "@/database/interaction.model";
import { FilterQuery } from "mongoose";
import { requireActor, assertOwner } from "@/lib/server/auth";
import { inTransaction } from "@/lib/server/transaction";
import { castVote } from "@/lib/server/voting";
import { escapeRegex, objectId, pagination } from "@/lib/query";
import { cleanHtml } from "@/lib/html";
import { questionsSchema } from "@/lib/validations";

export async function getQuestions(params: GetQuestionsParams) {
  try {
    await connectToDatabase();
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const { skipAmount, limit } = pagination(page, pageSize);
    const query: FilterQuery<typeof Question> = {};
    if (searchQuery) {
      query.$or = [
        { title: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { content: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
      ];
    }

    let sortOptions = {};
    switch (filter) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "frequent":
        sortOptions = { views: -1 };
        break;
      case "unanswered":
        query.answers = { $size: 0 };
        break;
      default:
        break;
    }

    const questions = await Question.find(query)
      .populate({
        path: "tags",
        model: Tag,
      })
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      })
      .skip(skipAmount)
      .limit(limit)
      .sort(sortOptions);

    const totalQuestions = await Question.countDocuments(query);
    const isNext = totalQuestions > skipAmount + questions.length;

    return { questions, isNext };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function createQuestion(params: CreateQuestionParams) {
  const actor = await requireActor();
  const values = questionsSchema.parse({
    title: params.title,
    explanation: cleanHtml(params.content),
    tags: params.tags.map((tag) => tag.trim().toLowerCase()),
  });
  const names = [...new Set(values.tags)];
  await inTransaction(async (session) => {
    const [question] = await Question.create(
      [{ title: values.title, content: values.explanation, author: actor._id }],
      { session },
    );
    const tags = [];
    for (const name of names) {
      const tag = await Tag.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${escapeRegex(name)}$`, "i") } },
        {
          $setOnInsert: { name, description: `Questions about ${name}.` },
          $addToSet: { questions: question._id },
        },
        { upsert: true, new: true, session },
      );
      tags.push(tag._id);
    }
    question.tags = tags;
    await question.save({ session });
    await Interaction.create(
      [
        {
          user: actor._id,
          action: "ask_question",
          question: question._id,
          tags,
        },
      ],
      { session },
    );
    await User.updateOne(
      { _id: actor._id },
      { $inc: { reputation: 5 } },
      { session },
    );
  });
  revalidatePath("/");
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    await connectToDatabase();
    const { questionId } = params;
    if (!/^[a-f\d]{24}$/i.test(questionId)) return null;
    return await Question.findById(questionId)
      .populate({
        path: "tags",
        model: Tag,
        select: "_id name",
      })
      .populate({
        path: "author",
        model: User,
        select: "_id clerkId name picture",
      });
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function upvoteQuestion(params: QuestionVoteParams) {
  await castVote("question", params.questionId, "up");
  revalidatePath(`/question/${params.questionId}`);
}

export async function downvoteQuestion(params: QuestionVoteParams) {
  await castVote("question", params.questionId, "down");
  revalidatePath(`/question/${params.questionId}`);
}

export async function deleteQuestion(params: DeleteQuestionParams) {
  const actor = await requireActor();
  const id = objectId(params.questionId);
  await inTransaction(async (session) => {
    const question = await Question.findById(id).session(session);
    if (!question) throw new Error("Question not found.");
    assertOwner(question.author, actor);
    await Question.deleteOne({ _id: id }, { session });
    await Answer.deleteMany({ question: id }, { session });
    await Interaction.deleteMany({ question: id }, { session });
    await Tag.updateMany(
      { questions: id },
      { $pull: { questions: id } },
      { session },
    );
    await User.updateMany({ saved: id }, { $pull: { saved: id } }, { session });
  });
  revalidatePath("/", "layout");
}

export async function editQuestion(params: EditQuestionParams) {
  const actor = await requireActor();
  const id = objectId(params.questionId);
  const values = questionsSchema
    .pick({ title: true, explanation: true })
    .parse({ title: params.title, explanation: cleanHtml(params.content) });
  const question = await Question.findById(id);
  if (!question) throw new Error("Question not found.");
  assertOwner(question.author, actor);
  await Question.updateOne(
    { _id: id, author: actor._id },
    { $set: { title: values.title, content: values.explanation } },
    { runValidators: true },
  );
  revalidatePath(`/question/${id}`);
}

export async function getTopQuestions() {
  try {
    await connectToDatabase();
    return await Question.aggregate([
      { $addFields: { voteCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { views: -1, voteCount: -1, createdAt: -1, _id: -1 } },
      { $limit: 5 },
      { $project: { _id: 1, title: 1 } },
    ]);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getRecommendedQuestions(params: RecommendedParams) {
  const actor = await requireActor();
  const { skipAmount, limit } = pagination(params.page, params.pageSize);
  const tags = await Interaction.distinct("tags", { user: actor._id });
  const query: FilterQuery<typeof Question> = { author: { $ne: actor._id } };
  if (tags.length) query.tags = { $in: tags };
  if (params.searchQuery)
    query.title = { $regex: escapeRegex(params.searchQuery), $options: "i" };
  const questions = await Question.find(query)
    .populate("tags", "_id name")
    .populate("author", "_id clerkId name picture")
    .sort({ createdAt: -1 })
    .skip(skipAmount)
    .limit(limit + 1);
  return {
    questions: questions.slice(0, limit),
    isNext: questions.length > limit,
  };
}
