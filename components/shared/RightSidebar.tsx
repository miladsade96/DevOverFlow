import Link from "next/link";
import Image from "next/image";
import RenderTag from "@/components/shared/RenderTag";
import { getTopQuestions } from "@/lib/actions/question.action";

  const popularTags = [
    { _id: "1", name: "javascript", totalQuestions: 6 },
    { _id: "2", name: "typescript", totalQuestions: 9 },
    { _id: "3", name: "react", totalQuestions: 12 },
    { _id: "4", name: "next", totalQuestions: 20 },
    { _id: "5", name: "vue", totalQuestions: 10 },
  ];

export default async function RightSidebar() {
  const topQuestions = await getTopQuestions();

  return (
    <section
      className="background-light900_dark200 light-border custom-scrollbar sticky right-0 top-0 flex h-screen
     w-[350px] flex-col overflow-y-auto border-l p-6 pt-36 shadow-light-300 dark:shadow-none
     max-xl:hidden"
    >
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>
        <div className="mt-7 flex w-full flex-col gap-[30px]">
          {topQuestions.map((question) => {
            return (
              <Link
                href={`/question/${question._id}`}
                key={question._id}
                className="flex cursor-pointer items-center justify-between gap-7"
              >
                <p className="body-medium text-dark500_light700">
                  {question.title}
                </p>
                <Image
                  src="/assets/icons/chevron-right.svg"
                  alt="Chevron right"
                  height={20}
                  width={20}
                  className="invert-colors"
                />
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
        <div className="mt-7 flex flex-col gap-4">
          {popularTags.map((tag) => (
            <RenderTag
              key={tag._id}
              _id={tag._id}
              name={tag.name}
              totalQuestions={tag.totalQuestions}
              showCount={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
