"use server";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.model";
import {
  GetAllUsersParams,
  GetSavedQuestionsParams,
  GetUserByIdParams,
  GetUserStatsParams,
  ToggleSaveQuestionParams,
  UpdateUserParams,
} from "@/lib/actions/shared.types";
import { revalidatePath } from "next/cache";
import Question from "@/database/question.model";
import { FilterQuery, Types } from "mongoose";
import Answer from "@/database/answer.model";
import { BadgeCriteriaType } from "@/types";
import { assignBadges } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { requireActor } from "@/lib/server/auth";
import { ProfileSchema } from "@/lib/validations";
import {
  escapeRegex,
  objectId,
  pagination,
  clerkId as validateClerkId,
} from "@/lib/query";

export async function getUserById(params: GetUserByIdParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    validateClerkId(userId);
    const { userId: viewer } = await auth();
    return await User.findOne({ clerkId: userId }).select(
      viewer === userId ? "-password -email" : "-password -email -saved",
    );
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function updateUser(params: UpdateUserParams) {
  const actor = await requireActor();
  if (actor.clerkId !== params.clerkId)
    throw new Error("You cannot edit another user's profile.");
  const values = ProfileSchema.parse(params.updateData);
  await User.updateOne(
    { _id: actor._id },
    { $set: values },
    { runValidators: true },
  );
  revalidatePath(`/profile/${actor.clerkId}`);
}

export async function getAllUsers(params: GetAllUsersParams) {
  try {
    await connectToDatabase();
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const { skipAmount, limit } = pagination(page, pageSize);

    const query: FilterQuery<typeof User> = {};
    if (searchQuery) {
      query.$or = [
        { name: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
        { username: { $regex: new RegExp(escapeRegex(searchQuery), "i") } },
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
      .select("-password -email -saved")
      .skip(skipAmount)
      .limit(limit)
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
  const actor = await requireActor();
  const id = objectId(params.questionId);
  if (!(await Question.exists({ _id: id })))
    throw new Error("Question not found.");
  const saved = actor.saved.some((value: unknown) => String(value) === id);
  await User.updateOne(
    { _id: actor._id },
    saved ? { $pull: { saved: id } } : { $addToSet: { saved: id } },
  );
  revalidatePath("/", "layout");
}

export async function getSavedQuestions(params: GetSavedQuestionsParams) {
  const actor = await requireActor();
  const { skipAmount, limit } = pagination(params.page, params.pageSize);
  const query: FilterQuery<typeof Question> = { _id: { $in: actor.saved } };
  if (params.searchQuery)
    query.title = { $regex: escapeRegex(params.searchQuery), $options: "i" };
  const sorts: Record<string, Record<string, 1 | -1>> = {
    most_recent: { createdAt: -1 },
    oldest: { createdAt: 1 },
    most_viewed: { views: -1 },
    most_voted: { voteCount: -1, createdAt: -1 },
    most_answered: { answerCount: -1, createdAt: -1 },
  };
  const questions = await Question.aggregate([
    { $match: query },
    {
      $addFields: {
        voteCount: { $size: { $ifNull: ["$upvotes", []] } },
        answerCount: { $size: { $ifNull: ["$answers", []] } },
      },
    },
    {
      $sort: {
        ...(sorts[params.filter || "most_recent"] || sorts.most_recent),
        _id: -1,
      },
    },
    { $skip: skipAmount },
    { $limit: limit + 1 },
    { $project: { voteCount: 0, answerCount: 0 } },
  ]);
  await Question.populate(questions, [
    { path: "tags", select: "_id name" },
    { path: "author", select: "_id clerkId name picture" },
  ]);

  return {
    questions: questions.slice(0, limit),
    isNext: questions.length > limit,
  };
}

export async function getUserInfo(params: GetUserByIdParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    validateClerkId(userId);
    const user = await User.findOne({ clerkId: userId }).select(
      "-password -email -saved",
    );
    if (!user) {
      throw new Error("User not found!");
    }
    const totalQuestions = await Question.countDocuments({ author: user._id });
    const totalAnswers = await Answer.countDocuments({ author: user._id });

    const [questionUpvotes] = await Question.aggregate([
      { $match: { author: user._id } },
      { $project: { _id: 0, upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);

    const [questionViews] = await Question.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    const [answerUpvotes] = await Answer.aggregate([
      { $match: { author: user._id } },
      { $project: { _id: 0, upvotes: { $size: "$upvotes" } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotes" } } },
    ]);

    const criteria = [
      { type: "QUESTION_COUNT" as BadgeCriteriaType, count: totalQuestions },
      { type: "ANSWER_COUNT" as BadgeCriteriaType, count: totalAnswers },
      {
        type: "QUESTION_UPVOTES" as BadgeCriteriaType,
        count: questionUpvotes?.totalUpvotes || 0,
      },
      {
        type: "ANSWER_UPVOTES" as BadgeCriteriaType,
        count: answerUpvotes?.totalUpvotes || 0,
      },
      {
        type: "TOTAL_VIEWS" as BadgeCriteriaType,
        count: questionViews?.totalViews || 0,
      },
    ];

    const badgeCounts = assignBadges({ criteria });

    return { user, totalQuestions, totalAnswers, badgeCounts };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getUserQuestions(params: GetUserStatsParams) {
  try {
    await connectToDatabase();
    const { userId, page = 1, pageSize = 10 } = params;
    objectId(userId);
    const { skipAmount, limit } = pagination(page, pageSize);
    const totalQuestions = await Question.countDocuments({ author: userId });
    const userQuestions = await Question.find({ author: userId })
      .sort({ createdAt: -1, views: -1, upvotes: -1 })
      .skip(skipAmount)
      .limit(limit)
      .populate("tags", "_id name")
      .populate("author", "_id clerkId name picture");

    const isNextQuestions = totalQuestions > skipAmount + userQuestions.length;

    return { totalQuestions, questions: userQuestions, isNextQuestions };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getUserAnswers(params: GetUserStatsParams) {
  try {
    await connectToDatabase();
    const { userId, page = 1, pageSize = 10 } = params;
    objectId(userId);
    const { skipAmount, limit } = pagination(page, pageSize);
    const totalAnswers = await Answer.countDocuments({ author: userId });
    const userAnswers = await Answer.aggregate([
      { $match: { author: new Types.ObjectId(userId) } },
      { $addFields: { voteCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $sort: { voteCount: -1, createdAt: -1, _id: -1 } },
      { $skip: skipAmount },
      { $limit: limit },
      { $project: { voteCount: 0 } },
    ]);
    await Answer.populate(userAnswers, [
      { path: "question", select: "_id title" },
      { path: "author", select: "_id clerkId name picture" },
    ]);

    const isNextAnswers = totalAnswers > skipAmount + userAnswers.length;

    return { totalAnswers, answers: userAnswers, isNextAnswers };
  } catch (e) {
    console.log(e);
    throw e;
  }
}
