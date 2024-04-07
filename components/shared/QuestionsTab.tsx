import { SearchParamsProps } from "@/types";
import { getUserQuestions } from "@/lib/actions/user.action";
import QuestionCard from "@/components/cards/QuestionCard";

interface QuestionsTabProps extends SearchParamsProps {
  userId: string;
  clerkId?: string | undefined;
}

export default async function QuestionsTab({
  searchParams,
  userId,
  clerkId,
}: QuestionsTabProps) {
  const result = await getUserQuestions({ userId });
  return (
    <>
      {result.questions.map((question) => {
        return (
          <QuestionCard
            key={question._id}
            _id={question._id}
            clerkId={clerkId}
            title={question.title}
            tags={question.tags}
            author={question.author}
            upvotes={question.upvotes}
            views={question.views}
            answers={question.answers}
            createdAt={question.createdAt}
          />
        );
      })}
    </>
  );
}
