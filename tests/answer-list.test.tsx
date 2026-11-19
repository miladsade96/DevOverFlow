import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
const data = vi.hoisted(() => ({ getAnswers: vi.fn() }));
vi.mock("@/lib/actions/answer.action", () => ({ getAnswers: data.getAnswers }));
vi.mock("@/components/shared/Votes", () => ({
  default: (props: { itemId: string; hasupVoted: boolean }) => (
    <div
      data-testid="vote"
      data-id={JSON.parse(props.itemId)}
      data-upvoted={String(props.hasupVoted)}
    />
  ),
}));
vi.mock("@/components/shared/ParseHTML", () => ({
  default: ({ data }: { data: string }) => <p>{data}</p>,
}));
vi.mock("@/components/shared/Filter", () => ({ default: () => null }));
vi.mock("@/components/shared/Pagination", () => ({ default: () => null }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
import AllAnswers from "@/components/shared/AllAnswers";
it("passes the aggregate answer's real ID and matches vote IDs by value", async () => {
  const answerId = "b".repeat(24),
    userId = "a".repeat(24);
  data.getAnswers.mockResolvedValue({
    answers: [
      {
        _id: { toString: () => answerId },
        author: {
          name: "Sample",
          clerkId: "user_sample",
          picture: "/avatar.svg",
        },
        content: "Answer text",
        upvotes: [{ toString: () => userId }],
        downvotes: [],
        createdAt: new Date(),
      },
    ],
    isNextAnswers: false,
  });
  render(
    await AllAnswers({ questionId: "c".repeat(24), userId, totalAnswers: 1 }),
  );
  expect(screen.getByTestId("vote")).toHaveAttribute("data-id", answerId);
  expect(screen.getByTestId("vote")).toHaveAttribute("data-upvoted", "true");
});
