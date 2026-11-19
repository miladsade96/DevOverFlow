"use client";
import React, { useState } from "react";
import RichTextEditor from "./RichTextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import { toast } from "@/components/ui/use-toast";
import { questionsSchema } from "@/lib/validations";
import Image from "next/image";
import { createQuestion, editQuestion } from "@/lib/actions/question.action";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  type?: string;
  mongoUserId: string;
  questionDetails?: string;
}

const Question = ({ type, mongoUserId, questionDetails }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const parsedQuestionDetails =
    questionDetails && JSON.parse(questionDetails || "");

  const groupedTags = parsedQuestionDetails?.tags.map((tag: any) => tag.name);

  // 1. Define your form.
  const form = useForm<z.infer<typeof questionsSchema>>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      title: parsedQuestionDetails?.title || "",
      explanation: parsedQuestionDetails?.content || "",
      tags: groupedTags || [],
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof questionsSchema>) {
    setIsSubmitting(true);

    try {
      if (type === "Edit") {
        await editQuestion({
          questionId: parsedQuestionDetails._id,
          title: values.title,
          content: values.explanation,
          path: pathname,
        });

        router.push(`/question/${parsedQuestionDetails._id}`);
      } else {
        await createQuestion({
          title: values.title,
          content: values.explanation,
          tags: values.tags,
          author: JSON.parse(mongoUserId),
          path: pathname,
        });

        router.push("/");
      }
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Could not save your question.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: any,
  ) => {
    if (e.key === "Enter" && field.name === "tags") {
      e.preventDefault();

      const tagInput = e.target as HTMLInputElement;
      const tagValue = tagInput.value.trim().toLowerCase();

      if (tagValue !== "") {
        if (tagValue.length > 15) {
          return form.setError("tags", {
            type: "required",
            message: "Tag must be less than 15 characters.",
          });
        }

        if (field.value.length >= 3 && !field.value.includes(tagValue)) {
          return form.setError("tags", {
            message: "You can add up to 3 tags.",
          });
        }
        if (!field.value.includes(tagValue as never)) {
          form.setValue("tags", [...field.value, tagValue]);
          tagInput.value = "";
          form.clearErrors("tags");
        }
      } else {
        form.trigger();
      }
    }
  };

  const handleTagRemove = (tag: string, field: any) => {
    const newTags = field.value.filter((t: string) => t !== tag);

    form.setValue("tags", newTags);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-10"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Question Title <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl className="mt-3.5">
                <Input
                  className="no-focus paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 min-h-[56px] border"
                  {...field}
                />
              </FormControl>
              <FormDescription className="body-regular mt-2.5 text-light-500">
                Be specific and imagine you&apos;re asking a question to another
                person.
              </FormDescription>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Detailed explanation of your problem{" "}
                <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl className="mt-3.5">
                <RichTextEditor
                  label="Question details"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription className="body-regular mt-2.5 text-light-500">
                Introduce the problem and expand on what you put in the title.
                Minimum 100 characters.
              </FormDescription>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel className="paragraph-semibold text-dark400_light800">
                Tags <span className="text-primary-500">*</span>
              </FormLabel>
              <FormControl className="mt-3.5">
                <Input
                  disabled={type === "Edit"}
                  className="no-focus paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 min-h-[56px] border"
                  placeholder="Add tags..."
                  onKeyDown={(event) => handleInputKeyDown(event, field)}
                />
              </FormControl>
              {field.value.length > 0 && (
                <div className="flex-start mt-2.5 flex-wrap gap-2.5">
                  {field.value.map((tag: string) => (
                    <button
                      key={tag}
                      type="button"
                      disabled={type === "Edit"}
                      aria-label={`Remove ${tag} tag`}
                      className="subtle-medium background-light800_dark300 text-light400_light500 flex items-center justify-center gap-2 rounded-md border-none px-4 py-2"
                      onClick={() => handleTagRemove(tag, field)}
                    >
                      {tag}
                      {type !== "Edit" && (
                        <Image
                          src="/assets/icons/close.svg"
                          alt=""
                          width={12}
                          height={12}
                          className="object-contain invert-0 dark:invert"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
              <FormDescription className="body-regular mt-2.5 text-light-500">
                Add up to 3 tags to describe what your question is about. You
                need to press enter to add a tag.
              </FormDescription>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="primary-gradient w-fit !text-light-900"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>{type === "Edit" ? "Editing..." : "Posting..."}</>
          ) : (
            <>{type === "Edit" ? "Edit Question" : "Ask a Question"}</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default Question;
