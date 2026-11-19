"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import z from "zod";
import { AnswerSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import RichTextEditor from "./RichTextEditor";
import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { createAnswer } from "@/lib/actions/answer.action";
import { usePathname } from "next/navigation";
import { generateGeminiAnswer } from "@/lib/api/google";
import { toast } from "@/components/ui/use-toast";

interface AnswerProps {
  question: string;
  questionId: string;
  authorId: string;
}

export default function Answer({
  question,
  questionId,
  authorId,
}: AnswerProps) {
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAI, setIsSubmittingAI] = useState(false);

  const form = useForm<z.infer<typeof AnswerSchema>>({
    resolver: zodResolver(AnswerSchema),
    defaultValues: { answer: "" },
  });

  async function handleCreateAnswer(values: z.infer<typeof AnswerSchema>) {
    setIsSubmitting(true);
    try {
      await createAnswer({
        content: values.answer,
        author: JSON.parse(authorId),
        question: JSON.parse(questionId),
        path: pathname,
      });
      form.reset();

      return toast({ title: "Your answer is successfully submitted" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Could not submit your answer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function generateAIAnswer() {
    if (!authorId) return;
    setIsSubmittingAI(true);
    try {
      const answer = await generateGeminiAnswer(question);
      form.setValue("answer", answer, {
        shouldValidate: true,
        shouldDirty: true,
      });

      return toast({ title: "The answer has been generated successfully" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Could not generate an answer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAI(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
        <h4 className="paragraph-semibold text-dark400_light800">
          Write your answer here
        </h4>
        <Button
          disabled={isSubmittingAI || isSubmitting || !authorId}
          onClick={() => generateAIAnswer()}
          className="btn light-border-2 gap-1.5 rounded-md px-4 py-2.5 text-primary-500 shadow-none dark:text-primary-500"
        >
          {isSubmittingAI ? (
            <>Generating the answer</>
          ) : (
            <>
              <Image
                src="/assets/icons/stars.svg"
                alt="Star"
                width={12}
                height={12}
                className="object-contain"
              />
              Generate AI answer
            </>
          )}
        </Button>
      </div>
      <Form {...form}>
        <form
          className="mt-6 flex w-full flex-col gap-10"
          onSubmit={form.handleSubmit(handleCreateAnswer)}
        >
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-3">
                <FormControl className="mt-3.5">
                  <RichTextEditor
                    label="Your answer"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="primary-gradient w-fit text-white"
              disabled={isSubmitting || isSubmittingAI || !authorId}
            >
              {isSubmitting ? "Submitting" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
