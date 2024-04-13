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
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;

    const query: FilterQuery<typeof User> = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(searchQuery, "i") } },
        { username: { $regex: new RegExp(searchQuery, "i") } },
      ];
    }

    let sortOptions = {};
    switch (filter) {
      case "new_users":
        sortOptions = { joinedAt: -1 };
        break;
      case "old_users":
        sortOptions = { joinedAt: 1 };
        break;
      case "top_contributors":
        sortOptions = { reputation: -1 };
        break;
      default:
        break;
    }

    const users = await User.find(query)
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalUsers = await User.countDocuments(query);
    const isNext = totalUsers > skipAmount + users.length;

    return { users, isNext };
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
    const { clerkId, searchQuery, filter } = params;
    const query: FilterQuery<typeof Question> = searchQuery
      ? { title: { $regex: new RegExp(searchQuery, "i") } }
      : {};

    let sortOptions = {};
    switch (filter) {
      case "most_recent":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { views: -1 };
        break;
      case "most_voted":
        sortOptions = { upvotes: -1 };
        break;
      case "most_viewed":
        sortOptions = { views: -1 };
        break;
      case "most_answered":
        sortOptions = { answers: -1 };
        break;
      default:
        break;
    }

    const user = await User.findOne({ clerkId }).populate({
      path: "saved",
      match: query,
      options: { sort: sortOptions },
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

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const totalAnswers = await Answer.countDocuments({ author: userId });
    const userAnswers = await Answer.find({ author: userId })
      .sort({
        upvotes: -1,
      })
      .populate("question", "_id title")
      .populate("author", "_id clerkId name picture");
    return { totalAnswers, answers: userAnswers };
  } catch (e) {
    console.log(e);
    throw e;
  }
}
