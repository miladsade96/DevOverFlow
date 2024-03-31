"use server";

import { CreateAnswerParams } from "@/lib/actions/shared.types";
import { connectToDatabase } from "@/lib/mongoose";
import Answer from "@/database/answer.model";
import Question from "@/database/question.model";
import { revalidatePath } from "next/cache";

export async function createAnswer(params: CreateAnswerParams) {
  try {
    await connectToDatabase();
    const { content, author, question, path } = params;
    const newAnswer = new Answer({ content, author, question });
    await Question.findByIdAndUpdate(question, {
      $push: { answers: newAnswer._id },
    });
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
