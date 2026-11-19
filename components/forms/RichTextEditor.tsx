"use client";
import { ComponentProps } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "@/context/ThemeProvider";

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  label,
  ...controlProps
}: Pick<
  ComponentProps<"textarea">,
  "id" | "aria-describedby" | "aria-invalid" | "className"
> & {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  label: string;
}) {
  const { mode } = useTheme();
  const key = process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY;
  if (!key)
    return (
      <textarea
        {...controlProps}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`no-focus light-border-2 background-light800_dark300 text-dark300_light700 min-h-[350px] w-full rounded-md border p-4 ${controlProps.className || ""}`}
      />
    );
  return (
    <Editor
      id={controlProps.id}
      apiKey={key}
      value={value}
      onBlur={onBlur}
      onEditorChange={onChange}
      init={{
        height: 350,
        iframe_aria_text: label,
        menubar: false,
        plugins: [
          "lists",
          "link",
          "image",
          "charmap",
          "searchreplace",
          "visualblocks",
          "codesample",
          "fullscreen",
          "table",
          "code",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | codesample | bold italic | bullist numlist | link code",
        skin: mode === "dark" ? "oxide-dark" : "oxide",
        content_css: mode === "dark" ? "dark" : "default",
      }}
    />
  );
}
