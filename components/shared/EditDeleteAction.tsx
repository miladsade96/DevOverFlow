"use client";

import { deleteAnswer } from "@/lib/actions/answer.action";
import { deleteQuestion } from "@/lib/actions/question.action";
import { useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  type: string;
  itemId: string;
}

const EditDeleteAction = ({ type, itemId }: Props) => {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/question/edit/${JSON.parse(itemId)}`);
  };

  const handleDelete = async () => {
    if (
      pendingRef.current ||
      !window.confirm("Delete this post? This cannot be undone.")
    )
      return;
    pendingRef.current = true;
    setPending(true);
    try {
      if (type === "Question") {
        // Delete question
        await deleteQuestion({
          questionId: JSON.parse(itemId),
          path: pathname,
        });
      } else if (type === "Answer") {
        // Delete answer
        await deleteAnswer({
          answerId: JSON.parse(itemId),
          path: pathname,
        });
      }
      if (type === "Question" && pathname.startsWith("/question/"))
        router.push("/");
      else router.refresh();
    } catch {
      toast({
        title: "Could not delete the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 max-sm:w-full">
      {type === "Question" && (
        <button
          type="button"
          aria-label="Edit question"
          disabled={pending}
          onClick={handleEdit}
        >
          <Image
            src="/assets/icons/edit.svg"
            alt="Edit"
            width={14}
            height={14}
            className="cursor-pointer object-contain"
          />
        </button>
      )}

      <button
        type="button"
        aria-label="Delete post"
        disabled={pending}
        onClick={handleDelete}
      >
        <Image
          src="/assets/icons/trash.svg"
          alt="Delete"
          width={14}
          height={14}
          className="cursor-pointer object-contain"
        />
      </button>
    </div>
  );
};

export default EditDeleteAction;
