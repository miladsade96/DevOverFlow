import { Button } from "@/components/ui/button";
import Link from "next/link";
import LocalSearchbar from "@/components/shared/search/LocalSearchbar";
import Filter from "@/components/shared/Filter";
import { HomePageFilters } from "@/constants/filters";
import HomeFilters from "@/components/home/HomeFilters";
import NoResult from "@/components/shared/NoResult";
import QuestionCard from "@/components/cards/QuestionCard";

const questions = [
  {
    _id: "1",
    title: "How to build a functional component in react?",
    tags: [
      { _id: "1", name: "javascript" },
      { _id: "2", name: "react" },
    ],
    author: { _id: "1", name: "Milad Sadeghi", picture: "default.png" },
    upvotes: 200300,
    views: 1358993,
    answers: [],
    createdAt: new Date("2024-03-11"),
  },
  {
    _id: "2",
    title: "What is nextJS?",
    tags: [
      { _id: "1", name: "react" },
      { _id: "2", name: "nextjs" },
    ],
    author: { _id: "2", name: "John Smith", picture: "default.png" }, // Added picture property with default value
    upvotes: 233222,
    views: 23009883,
    answers: [],
    createdAt: new Date("2024-03-10"),
  },
];

export default function Home() {
  return (
    <>
      <div className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="h1-bold text-dark100_light900">All Questions</h1>
        <Link href="/ask-question" className="flex justify-end max-sm:w-full">
          <Button className="primary-gradient min-h-[46px] px-4 py-3 !text-light-900">
            Ask a question
          </Button>
        </Link>
      </div>
      <div className="mt-11 flex justify-between gap-5 max-sm:flex-col sm:items-center">
        <LocalSearchbar
          route="/"
          iconPosition="left"
          imgSrc="/assets/icons/search.svg"
          placeHolder="Search for questios"
          otherClasses="flex-1"
        />
        <Filter
          filters={HomePageFilters}
          otherClasses="min-h-[56px] sm:min-w-[170px]"
          containerClasses="hidden max-md:flex"
        />
      </div>
      <HomeFilters />
      <div className="mt-10 flex w-full flex-col gap-6">
        {questions.length > 0 ? (
          questions.map((question) => (
            <QuestionCard
              key={question._id}
              _id={question._id}
              title={question.title}
              tags={question.tags}
              author={question.author}
              upvotes={question.upvotes}
              views={question.views}
              answers={question.answers}
              createdAt={question.createdAt}
            />
          ))
        ) : (
          <NoResult
            title="There is no question to show"
            description="Be the first to break the silence! 🚀 Ask a question and kickstart the
        discussion. Out query could be the next big thing others learn from. Get
        involved! 🪔"
            link="/ask-question"
            linkTitle="Ask a Question"
          />
        )}
      </div>
    </>
  );
}
