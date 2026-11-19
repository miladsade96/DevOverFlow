"use server";

import {
  AnswerVoteParams,
  CreateAnswerParams,
  DeleteAnswerParams,
  GetAnswersParams,
} from "@/lib/actions/shared.types";
import { connectToDatabase } from "@/lib/mongoose";
import Answer from "@/database/answer.model";
import Question from "@/database/question.model";
import { revalidatePath } from "next/cache";
import Interaction from "@/database/interaction.model";
import User from "@/database/user.model";
import { Types } from "mongoose";
import { requireActor, assertOwner } from "@/lib/server/auth";
import { inTransaction } from "@/lib/server/transaction";
import { castVote } from "@/lib/server/voting";
import { objectId, pagination } from "@/lib/query";
import { cleanHtml } from "@/lib/html";
import { AnswerSchema } from "@/lib/validations";

export async function createAnswer(params: CreateAnswerParams) {
  const actor = await requireActor();
  const questionId = objectId(params.question);
  const { answer: content } = AnswerSchema.parse({
    answer: cleanHtml(params.content),
  });
  await inTransaction(async (session) => {
    const question = await Question.findById(questionId).session(session);
    if (!question) throw new Error("Question not found.");
    const [answer] = await Answer.create(
      [{ content, author: actor._id, question: questionId }],
      { session },
    );
    await Question.updateOne(
      { _id: questionId },
      { $addToSet: { answers: answer._id } },
      { session },
    );
    await Interaction.create(
      [
        {
          user: actor._id,
          action: "answer",
          question: questionId,
          answer: answer._id,
          tags: question.tags,
        },
      ],
      { session },
    );
    await User.updateOne(
      { _id: actor._id },
      { $inc: { reputation: 10 } },
      { session },
    );
  });
  revalidatePath(`/question/${questionId}`);
}

export async function getAnswers(params: GetAnswersParams) {
  try {
    await connectToDatabase();
    const { questionId, sortBy, page = 1, pageSize = 10 } = params;

    objectId(questionId);
    const { skipAmount, limit } = pagination(page, pageSize);

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1, _id: -1 };
    switch (sortBy) {
      case "highestUpvotes":
        sortOptions = { voteCount: -1, createdAt: -1, _id: -1 };
        break;
      case "lowestUpvotes":
        sortOptions = { voteCount: 1, createdAt: -1, _id: -1 };
        break;
      case "recent":
        sortOptions = { createdAt: -1 };
        break;
      case "old":
        sortOptions = { createdAt: 1 };
        break;
      default:
        break;
    }

    const answers = await Answer.aggregate([
      { $match: { question: new Types.ObjectId(questionId) } },
      { $addFields: { voteCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: sortOptions },
      { $skip: skipAmount },
      { $limit: limit },
      { $project: { voteCount: 0 } },
    ]);
    await Answer.populate(answers, {
      path: "author",
      select: "_id clerkId name picture",
    });

    const totalAnswers = await Answer.countDocuments({ question: questionId });
    const isNextAnswers = totalAnswers > skipAmount + answers.length;

    return { answers, isNextAnswers };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function upvoteAnswer(params: AnswerVoteParams) {
  await castVote("answer", params.answerId, "up");
  revalidatePath("/", "layout");
}

export async function downvoteAnswer(params: AnswerVoteParams) {
  await castVote("answer", params.answerId, "down");
  revalidatePath("/", "layout");
}

export async function deleteAnswer(params: DeleteAnswerParams) {
  const actor = await requireActor();
  const id = objectId(params.answerId);
  await inTransaction(async (session) => {
    const answer = await Answer.findById(id).session(session);
    if (!answer) throw new Error("Answer not found.");
    assertOwner(answer.author, actor);
    await Answer.deleteOne({ _id: id }, { session });
    await Question.updateOne(
      { _id: answer.question },
      { $pull: { answers: id } },
      { session },
    );
    await Interaction.deleteMany({ answer: id }, { session });
  });
  revalidatePath("/", "layout");
}
