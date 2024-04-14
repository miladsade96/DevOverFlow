"use server";

import {
  GetAllTagsParams,
  GetQuestionsByTagIdParams,
  GetTopInteractedTagsParams,
} from "@/lib/actions/shared.types";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/database/user.model";
import Question from "@/database/question.model";
import Tag, { ITag } from "@/database/tag.model";
import { FilterQuery } from "mongoose";

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
  try {
    await connectToDatabase();
    const { userId } = params;
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found!");
    // It is not completed yet
    return [
      { _id: "1", name: "tag1" },
      { _id: "2", name: "tag2" },
      { _id: "3", name: "tag3" },
    ];
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getAllTags(params: GetAllTagsParams) {
  try {
    await connectToDatabase();
    const { searchQuery, filter, page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;
    const query: FilterQuery<typeof Tag> = {};
    if (searchQuery) {
      query.$or = [{ name: { $regex: new RegExp(searchQuery, "i") } }];
    }

    let sortOptions = {};
    switch (filter) {
      case "popular":
        sortOptions = { questions: -1 };
        break;
      case "recent":
        sortOptions = { createdOn: -1 };
        break;
      case "name":
        sortOptions = { name: 1 };
        break;
      case "old":
        sortOptions = { createdOn: 1 };
        break;
      default:
        break;
    }

    const tags = await Tag.find(query)
      .skip(skipAmount)
      .limit(pageSize)
      .sort(sortOptions);

    const totalTags = await Tag.countDocuments(query);
    const isNext = totalTags > skipAmount + tags.length;

    return { tags, isNext };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getQuestionsByTagId(params: GetQuestionsByTagIdParams) {
  try {
    await connectToDatabase();
    const { tagId, searchQuery, page = 1, pageSize = 10 } = params;
    const skipAmount = (page - 1) * pageSize;
    const tagFilter: FilterQuery<ITag> = { _id: tagId };
    const tag = await Tag.findOne(tagFilter).populate({
      path: "questions",
      model: Question,
      match: searchQuery
        ? { title: { $regex: searchQuery, $options: "i" } }
        : {},
      options: {
        sort: { createdAt: -1 },
        skip: skipAmount,
        limit: pageSize + 1, // +1 to check if there is the next page or not
      },
      populate: [
        { path: "tags", model: Tag, select: "_id name" },
        { path: "author", model: User, select: "_id clerkId name picture" },
      ],
    });
    if (!tag) {
      throw new Error("Tag not found!");
    }

    const isNext = tag.questions.length > pageSize;
    const questions = tag.questions;
    return { tagTitle: tag.name, questions, isNext };
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export async function getPopularTags() {
  try {
    await connectToDatabase();
    return await Tag.aggregate([
      { $project: { name: 1, numberOfQuestions: { $size: "$questions" } } },
      { $sort: { numberOfQuestions: -1 } },
      { $limit: 5 },
    ]);
  } catch (e) {
    console.log(e);
    throw e;
  }
}
