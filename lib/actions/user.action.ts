"use server";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.model";
import {
  CreateUserParams,
  DeleteUserParams,
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "@/lib/actions/shared.types";
import { revalidatePath } from "next/cache";
import Question from "@/database/question.model";
import { FilterQuery } from "mongoose";
import Tag from "@/database/tag.model";
import Answer from "@/database/answer.model";

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

export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDatabase();
    // const { page = 1, pageSize = 20, filter, searchQuery } = params;
    return User.find({}).sort({ createdAt: -1 });
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
  try {
    await connectToDatabase();
    const { userId, questionId, path } = params;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found!");
    }
    const isQuestionSaved = await user.saved.includes(questionId);
    if (isQuestionSaved) {
      await User.findByIdAndUpdate(
        userId,
        { $pull: { saved: questionId } },
        { new: true },
      );
    } else {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { saved: questionId } },
        { new: true },
      );
    }
    revalidatePath(path);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  try {
    await connectToDatabase();
    const { clerkId, searchQuery } = params;
    const query: FilterQuery<typeof Question> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};
    const user = await User.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: { sort: { createdAt: -1 } },
      populate: [
        { path: "tags", model: Tag, select: "_id name" },
        { path: "author", model: User, select: "_id clerkId name picture" },
      ],
    });
    if (!user) {
      throw new Error("User not found!");
    }
    const savedQuestions = user.saved;
    return { questions: savedQuestions };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found!");
    }
    const totalQuestions = await Question.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({ author: user._id });
    return { user, totalQuestions, totalAnswers };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const totalQuestions = await Question.countDocuments({ author: userId });
    const userQuestions = await Question.find({ author: userId })
      .sort({
        views: -1,
        upvotes: -1,
      })
      .populate("tags", "_id name")
      .populate("author", "_id clerkId name picture");
    return { totalQuestions, questions: userQuestions };
  } catch (e) {
    console.log(e);
    throw e;
  }
}
