import "server-only";
import { WebhookEvent } from "@clerk/nextjs/server";
import User from "@/database/user.model";
import Question from "@/database/question.model";
import Answer from "@/database/answer.model";
import Tag from "@/database/tag.model";
import Interaction from "@/database/interaction.model";
import { connectToDatabase } from "@/lib/mongoose";
import { inTransaction } from "./transaction";

// This module is deliberately not a Server Action. Only verified webhooks call it.
export async function syncClerkUser(event: WebhookEvent) {
  if (!["user.created", "user.updated", "user.deleted"].includes(event.type))
    return;
  await connectToDatabase();
  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data;
    const email =
      data.email_addresses.find(
        (entry) => entry.id === data.primary_email_address_id,
      )?.email_address || data.email_addresses[0]?.email_address;
    if (!email) throw new Error("User has no email address.");
    await User.findOneAndUpdate(
      { clerkId: data.id },
      {
        $set: {
          clerkId: data.id,
          name:
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            data.username ||
            "Community member",
          username: data.username || data.id,
          email,
          picture: data.image_url,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
  } else if (event.type === "user.deleted" && event.data.id) {
    await inTransaction(async (session) => {
      const user = await User.findOne({ clerkId: event.data.id }).session(
        session,
      );
      if (!user) return;
      const questions = await Question.find({ author: user._id })
        .distinct("_id")
        .session(session);
      const answers = await Answer.find({
        $or: [{ author: user._id }, { question: { $in: questions } }],
      })
        .distinct("_id")
        .session(session);
      await Question.updateMany(
        {},
        {
          $pull: {
            answers: { $in: answers },
            upvotes: user._id,
            downvotes: user._id,
          },
        },
        { session },
      );
      await Answer.updateMany(
        {},
        { $pull: { upvotes: user._id, downvotes: user._id } },
        { session },
      );
      await Tag.updateMany(
        {},
        { $pull: { questions: { $in: questions }, followers: user._id } },
        { session },
      );
      await User.updateMany(
        {},
        { $pull: { saved: { $in: questions } } },
        { session },
      );
      await Interaction.deleteMany(
        {
          $or: [
            { user: user._id },
            { question: { $in: questions } },
            { answer: { $in: answers } },
          ],
        },
        { session },
      );
      await Answer.deleteMany({ _id: { $in: answers } }, { session });
      await Question.deleteMany({ _id: { $in: questions } }, { session });
      await User.deleteOne({ _id: user._id }, { session });
    });
  }
}
