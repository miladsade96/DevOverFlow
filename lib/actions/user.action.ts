"use server";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.model";
import {
  CreateUserParams,
  DeleteUserParams,
  UpdateUserParams,
} from "@/lib/actions/shared.types";
import { revalidatePath } from "next/cache";
import Question from "@/database/question.model";

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

export async function createUser(userData: CreateUserParams) {
  try {
    await connectToDatabase();
    return User.create(userData);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function updateUser(params: UpdateUserParams) {
  try {
    await connectToDatabase();
    const { clerkId, updateData, path } = params;
    await User.findOneAndUpdate({ clerkId }, updateData, { new: true });
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function deleteUser(params: DeleteUserParams) {
  try {
    await connectToDatabase();
    const { clerkId } = params;
    const user = User.findOneAndDelete({ clerkId });
    if (!user) {
      throw new Error("User not found!");
    }
    // @ts-ignore
    await Question.find({ author: user._id }).distinct("_id");
    // @ts-ignore
    await Question.deleteMany({ author: user._id });
    // @ts-ignore
    return await User.findByIdAndDelete(user._id);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
