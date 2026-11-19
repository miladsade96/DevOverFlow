"use server";
import { ViewQuestionParams } from "@/lib/actions/shared.types";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/database/question.model";
import Interaction from "@/database/interaction.model";
import User from "@/database/user.model";
import { objectId } from "@/lib/query";
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { inTransaction } from "@/lib/server/transaction";

export async function viewQuestion(params: ViewQuestionParams) {
  const id = objectId(params.questionId);
  await connectToDatabase();
  const question = await Question.findById(id).select("tags");
  if (!question) return;
  const { userId } = await auth();
  const user = userId
    ? await User.findOne({ clerkId: userId }).select("_id")
    : null;
  if (user) {
    await inTransaction(async (session) => {
      const existing = await Interaction.findOne({
        user: user._id,
        question: id,
        action: "view",
      }).session(session);
      if (existing) return;
      // A deterministic primary key also prevents duplicate inserts from concurrent requests.
      const interactionId = new Types.ObjectId(
        createHash("sha256")
          .update(`${user._id}:${id}:view`)
          .digest("hex")
          .slice(0, 24),
      );
      const result = await Interaction.updateOne(
        { _id: interactionId },
        {
          $setOnInsert: {
            user: user._id,
            question: id,
            action: "view",
            tags: question.tags,
          },
        },
        { upsert: true, session },
      );
      if (result.upsertedCount) {
        const update = await Question.updateOne(
          { _id: id },
          { $inc: { views: 1 } },
          { session },
        );
        if (!update.matchedCount) throw new Error("Question not found.");
      }
    });
    return;
  }
  await Question.updateOne({ _id: id }, { $inc: { views: 1 } });
}
