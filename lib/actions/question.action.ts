"use server";

import { connectToDatabase } from "@/lib/mongoose";

export async function createQuestion(params: any) {
  try {
    await connectToDatabase();
  } catch (e) {}
}
