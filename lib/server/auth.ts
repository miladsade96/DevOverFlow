import "server-only";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";

export async function requireActor() {
  const { userId } = await auth();
  if (!userId) throw new Error("Please sign in to continue.");
  await connectToDatabase();
  const user = await User.findOne({ clerkId: userId });
  if (!user)
    throw new Error("Your profile is still syncing. Please try again shortly.");
  return user;
}

export function assertOwner(author: unknown, actor: { _id: unknown }) {
  if (String(author) !== String(actor._id))
    throw new Error("You do not have permission to change this item.");
}
