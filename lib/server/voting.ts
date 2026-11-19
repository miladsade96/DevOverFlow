import "server-only";
import Question from "@/database/question.model";
import Answer from "@/database/answer.model";
import User from "@/database/user.model";
import { requireActor } from "./auth";
import { inTransaction } from "./transaction";
import { objectId } from "@/lib/query";
import { voteTransition } from "@/lib/vote";

export async function castVote(
  kind: "question" | "answer",
  id: string,
  clicked: "up" | "down",
) {
  const actor = await requireActor();
  objectId(id);
  const Model = kind === "question" ? Question : Answer;
  await inTransaction(async (session) => {
    const item = await Model.findById(id).session(session);
    if (!item) throw new Error("Item not found.");
    if (String(item.author) === String(actor._id))
      throw new Error("You cannot vote on your own post.");
    const includesActor = (values: unknown[]) =>
      values.some((v) => String(v) === String(actor._id));
    const previous = includesActor(item.upvotes)
      ? "up"
      : includesActor(item.downvotes)
        ? "down"
        : "none";
    const change = voteTransition(
      previous,
      clicked,
      kind === "question" ? 1 : 2,
    );
    item.upvotes = item.upvotes.filter(
      (v: unknown) => String(v) !== String(actor._id),
    );
    item.downvotes = item.downvotes.filter(
      (v: unknown) => String(v) !== String(actor._id),
    );
    if (change.next === "up") item.upvotes.push(actor._id);
    if (change.next === "down") item.downvotes.push(actor._id);
    await item.save({ session });
    await User.updateOne(
      { _id: actor._id },
      { $inc: { reputation: change.voterDelta } },
      { session },
    );
    await User.updateOne(
      { _id: item.author },
      { $inc: { reputation: change.authorDelta } },
      { session },
    );
  });
}
