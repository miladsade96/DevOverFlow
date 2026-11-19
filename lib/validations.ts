import { z } from "zod";

export const questionsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters for the title.")
    .max(130, "Keep the title under 130 characters."),
  explanation: z
    .string()
    .trim()
    .min(100, "Add at least 100 characters to explain the problem.")
    .max(50000, "Keep the explanation under 50,000 characters."),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Enter a tag name.")
        .max(15, "Keep each tag under 15 characters."),
    )
    .min(1, "Add at least one tag.")
    .max(3, "Add up to three tags."),
});

export const AnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(100, "Write at least 100 characters for your answer.")
    .max(50000, "Keep your answer under 50,000 characters."),
});

export const ProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter a name with at least 2 characters.")
    .max(50, "Keep your name under 50 characters."),
  username: z
    .string()
    .trim()
    .min(2, "Enter a username with at least 2 characters.")
    .max(50, "Keep your username under 50 characters."),
  bio: z.string().trim().max(150, "Keep your bio under 150 characters."),
  portfolioWebsite: z.union([
    z.literal(""),
    z
      .string()
      .url("Enter a valid website address.")
      .refine(
        (url) => /^https?:\/\//i.test(url),
        "Use an HTTP or HTTPS website address.",
      ),
  ]),
  location: z
    .string()
    .trim()
    .max(50, "Keep your location under 50 characters."),
});
