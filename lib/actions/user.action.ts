"use server";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.model";

export async function getUserById(params: any) {
  try {
    await connectToDatabase();
    const { userId } = params;
    return await User.findOne({ clerkId: userId });
  } catch (e) {
    console.log(e);
    throw e;
  }
}
