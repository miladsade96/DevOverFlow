"use client";

import Image from "next/image";
import { formatAndDivideNumber } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import {
  downvoteQuestion,
  upvoteQuestion,
} from "@/lib/actions/question.action";
import { downvoteAnswer, upvoteAnswer } from "@/lib/actions/answer.action";
import { toggleSaveQuestion } from "@/lib/actions/user.action";
import { useEffect, useRef, useState } from "react";
import { viewQuestion } from "@/lib/actions/interaction.action";
import { toast } from "@/components/ui/use-toast";

interface VotesProps {
  type: string;
  itemId: string;
  userId: string;
  upvotes: number;
  hasupVoted: boolean;
  downvotes: number;
  hasdownVoted: boolean;
  hasSaved?: boolean;
}

export default function Votes({
  type,
  itemId,
  userId,
  upvotes,
  hasupVoted,
  downvotes,
  hasdownVoted,
  hasSaved,
}: VotesProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const actorId = userId ? JSON.parse(userId) : null;
  const id = JSON.parse(itemId);
  async function act(action: "save" | "up" | "down") {
    if (!actorId) {
      toast({ title: "Please sign in to continue." });
      return;
    }
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      if (action === "save")
        await toggleSaveQuestion({
          questionId: id,
          userId: actorId,
          path: pathname,
        });
      else {
        const vote =
          type === "Question"
            ? action === "up"
              ? upvoteQuestion
              : downvoteQuestion
            : action === "up"
              ? upvoteAnswer
              : downvoteAnswer;
        await vote({
          questionId: id,
          answerId: id,
          userId: actorId,
          hasupVoted,
          hasdownVoted,
          path: pathname,
        });
      }
      router.refresh();
      toast({
        title:
          action === "save"
            ? hasSaved
              ? "Removed from your collection"
              : "Saved to your collection"
            : "Vote updated",
      });
    } catch {
      toast({
        title: "Could not save your change. Please try again.",
        variant: "destructive",
      });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  useEffect(() => {
    if (type === "Question")
      void viewQuestion({ questionId: id, userId: undefined }).catch(
        () => undefined,
      );
  }, [type, id]);
  return (
    <div className="flex gap-5" aria-busy={pending}>
      <div className="flex-center gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => act("up")}
          aria-label="Upvote"
          aria-pressed={hasupVoted}
          className="flex-center gap-1.5 rounded p-1 focus-visible:outline focus-visible:outline-2"
        >
          <Image
            src={
              hasupVoted
                ? "/assets/icons/upvoted.svg"
                : "/assets/icons/upvote.svg"
            }
            alt=""
            width={18}
            height={18}
          />
          <span className="text-dark400_light900">
            {formatAndDivideNumber(upvotes)}
          </span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => act("down")}
          aria-label="Downvote"
          aria-pressed={hasdownVoted}
          className="flex-center gap-1.5 rounded p-1 focus-visible:outline focus-visible:outline-2"
        >
          <Image
            src={
              hasdownVoted
                ? "/assets/icons/downvoted.svg"
                : "/assets/icons/downvote.svg"
            }
            alt=""
            width={18}
            height={18}
          />
          <span className="text-dark400_light900">
            {formatAndDivideNumber(downvotes)}
          </span>
        </button>
      </div>
      {type === "Question" && (
        <button
          type="button"
          disabled={pending}
          aria-label="Save question"
          aria-pressed={!!hasSaved}
          onClick={() => act("save")}
          className="rounded p-1 focus-visible:outline focus-visible:outline-2"
        >
          <Image
            src={
              hasSaved
                ? "/assets/icons/star-filled.svg"
                : "/assets/icons/star-red.svg"
            }
            alt=""
            width={18}
            height={18}
          />
        </button>
      )}
    </div>
  );
}
