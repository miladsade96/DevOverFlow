import { URLProps } from "@/types";
import { getUserInfo } from "@/lib/actions/user.action";
import Image from "next/image";
import { auth, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJoinedDate } from "@/lib/utils";
import ProfileLink from "@/components/shared/ProfileLink";
import Stats from "@/components/shared/Stats";
import QuestionsTab from "@/components/shared/QuestionsTab";
import AnswersTab from "@/components/shared/AnswersTab";
import { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { user } = await getUserInfo({ userId: params.id });
  return {
    title: `${user.name}'s Profile`,
    description: `The profile page of ${user.name}`,
  };
}

export default async function Page({ params, searchParams }: URLProps) {
  const { userId: clerkId } = auth();
  const { user, totalQuestions, totalAnswers, badgeCounts } = await getUserInfo(
    {
      userId: params.id,
    },
  );
  return (
    <>
      <div className="flex flex-col-reverse items-start justify-between sm:flex-row">
        <div className="flex flex-col items-start gap-4 lg:flex-row">
          <Image
            src={user?.picture}
            alt="Profile picture"
            width={140}
            height={140}
            className="rounded-full object-cover"
          />
          <div className="mt-3">
            <h2 className="h2-bold text-dark100_light900">{user.name}</h2>
            <p className="paragraph-regular text-dark200_light800">
              @{user.username}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
              {user.portfolioWebsite && (
                <ProfileLink
                  imgUrl="/assets/icons/link.svg"
                  title="Portfolio"
                  href={user.portfolioWebsite}
                />
              )}
              {user.location && (
                <ProfileLink
                  imgUrl="/assets/icons/location.svg"
                  title={user.location}
                />
              )}
              <ProfileLink
                imgUrl="/assets/icons/calendar.svg"
                title={getJoinedDate(user.joinedAt)}
              />
            </div>
            {user.bio && (
              <p className="paragraph-regular text-dark400_light800 mt-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end max-sm:mb-5 max-sm:w-full sm:mt-3">
          <SignedIn>
            {clerkId === user.clerkId && (
              <Link href="/profile/edit">
                <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-[46px] min-w-[175px] px-4 py-3">
                  Edit profile
                </Button>
              </Link>
            )}
          </SignedIn>
        </div>
      </div>
      <Stats
        totalQuestions={totalQuestions}
        totalAnswers={totalAnswers}
        badgeCounts={badgeCounts}
      />
      <div className="mt-10 flex gap-10">
        <Tabs defaultValue="top-posts" className="flex-1">
          <TabsList className="background-light800_dark400 min-h-[42px] p-1">
            <TabsTrigger value="top-posts" className="tab">
              Your Questions
            </TabsTrigger>
            <TabsTrigger value="answers" className="tab">
              Your Answers
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="top-posts"
            className="mt-5 flex w-full flex-col gap-6"
          >
            <QuestionsTab
              searchParams={searchParams}
              userId={user._id}
              // @ts-ignore
              clerkId={clerkId}
            />
          </TabsContent>
          <TabsContent value="answers" className="flex w-full flex-col gap-6">
            <AnswersTab
              searchParams={searchParams}
              userId={user._id}
              // @ts-ignore
              clerkId={clerkId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
