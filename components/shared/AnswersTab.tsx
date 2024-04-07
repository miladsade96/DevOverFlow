import { SearchParamsProps } from "@/types";
import { getUserAnswers } from "@/lib/actions/user.action";
import AnswerCard from "@/components/cards/AnswerCard";

interface AnswersTabProps extends SearchParamsProps {
  userId: string;
  clerkId?: string;
}

export default async function AnswersTab({ userId, clerkId }: AnswersTabProps) {
  const result = await getUserAnswers({ userId });
  return (
    <>
      {result.answers.map((answer) => (
        <AnswerCard
          key={answer._id}
          _id={answer._id}
          clerkId={clerkId}
          question={answer.question}
          author={answer.author}
          upvotes={answer.upvotes.length}
          createdAt={answer.createdAt}
        />
      ))}
    </>
  );
}
