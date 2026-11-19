"use server";
import { GoogleGenAI } from "@google/genai";
import { requireActor } from "@/lib/server/auth";
import { consumeAiQuota } from "@/lib/server/rate-limit";
import { cleanHtml } from "@/lib/html";

export async function generateGeminiAnswer(question: string) {
  const actor = await requireActor();
  if (
    typeof question !== "string" ||
    question.trim().length < 10 ||
    question.length > 2000
  )
    throw new Error("Enter a question between 10 and 2000 characters.");
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GOOGLE_AI_MODEL;
  if (!apiKey || !model) throw new Error("AI answers are not configured yet.");
  await consumeAiQuota(String(actor._id));
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 30000 } });
    const response = await ai.models.generateContent({
      model,
      contents: question,
      config: {
        systemInstruction:
          "Answer the programming question accurately. Return only safe HTML using paragraphs, lists, pre and code. Do not include scripts, embedded media, or Markdown fences.",
        maxOutputTokens: 2048,
      },
    });
    const result = cleanHtml(response.text || "");
    if (!result.trim()) throw new Error("Empty answer.");
    return result;
  } catch {
    throw new Error(
      "The AI service could not generate an answer. Please try again later.",
    );
  }
}
