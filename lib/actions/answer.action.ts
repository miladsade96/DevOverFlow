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

export async function createAnswer(params: CreateAnswerParams) {
  try {
    await connectToDatabase();
    const { content, author, question, path } = params;
    const newAnswer = await Answer.create({ content, author, question });
    await Question.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id },
    });
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getAnswers(params: GetAnswersParams) {
  try {
    await connectToDatabase();
    const { questionId } = params;
    const answers = await Answer.find({ question: questionId })
      .populate("author", "_id clerkId name picture")
      .sort({ createdAt: -1 });
    return { answers };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function upvoteAnswer(params: AnswerVoteParams) {
  try {
    await connectToDatabase();
    const { answerId, userId, hasupVoted, hasdownVoted, path } = params;
    let updateQuery;
    if (hasupVoted) {
      updateQuery = { $pull: { upvotes: userId } };
    } else if (hasdownVoted) {
      updateQuery = {
        $pull: { downvotes: userId },
        $push: { upvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { upvotes: userId } };
    }
    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });
    if (!answer) {
      throw new Error("Answer not found!");
    }
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function downvoteAnswer(params: AnswerVoteParams) {
  try {
    await connectToDatabase();
    const { answerId, userId, hasupVoted, hasdownVoted, path } = params;
    let updateQuery;
    if (hasdownVoted) {
      updateQuery = { $pull: { downvotes: userId } };
    } else if (hasupVoted) {
      updateQuery = {
        $pull: { upvotes: userId },
        $push: { downvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { downvotes: userId } };
    }
    const answer = await Answer.findByIdAndUpdate(answerId, updateQuery, {
      new: true,
    });
    if (!answer) {
      throw new Error("Answer not found!");
    }
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function deleteAnswer(params: DeleteAnswerParams) {
  try {
    await connectToDatabase();
    const { answerId, path } = params;
    const answer = await Answer.findById(answerId);
    if (!answer) {
      throw new Error("Answer not found!");
    }
    await answer.deleteOne({ _id: answerId });
    await Question.updateMany(
      { _id: answer.question },
      { $pull: { answers: answerId } },
    );
    await Interaction.deleteMany({ answer: answerId });
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
