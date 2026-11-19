import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("@/lib/actions/question.action", () => ({
  createQuestion: mocks.create,
  editQuestion: vi.fn(),
}));
vi.mock("@/context/ThemeProvider", () => ({
  useTheme: () => ({ mode: "light" }),
}));
vi.mock("@/components/ui/use-toast", () => ({ toast: mocks.toast }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/ask-question",
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("next/image", () => ({ default: () => null }));
import Question from "@/components/forms/Question";
beforeEach(() => mocks.create.mockResolvedValue(undefined));
function fillQuestion() {
  fireEvent.change(screen.getByLabelText(/Question Title/), {
    target: { value: "How do async functions work?" },
  });
  fireEvent.change(screen.getByLabelText("Question details"), {
    target: { value: "A".repeat(110) },
  });
  addTag("react");
}
function addTag(value: string) {
  const input = screen.getByLabelText(/Tags/);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter" });
}
it("exposes accessible controls when the rich editor service is absent", () => {
  render(<Question mongoUserId={JSON.stringify("a".repeat(24))} />);
  expect(screen.getByLabelText("Question details")).toBeInstanceOf(
    HTMLTextAreaElement,
  );
  expect(screen.getByLabelText(/Tags/)).toBeEnabled();
});
it("deduplicates tags regardless of case and supports keyboard-accessible removal", () => {
  render(<Question mongoUserId={JSON.stringify("a".repeat(24))} />);
  addTag("React");
  addTag("react");
  expect(
    screen.getAllByRole("button", { name: /Remove react tag/ }),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Remove react tag" }));
  expect(
    screen.queryByRole("button", { name: "Remove react tag" }),
  ).not.toBeInTheDocument();
});
it("enforces the three-tag limit before adding a fourth tag", () => {
  render(<Question mongoUserId={JSON.stringify("a".repeat(24))} />);
  for (const tag of ["react", "node", "css", "html"]) addTag(tag);
  expect(
    screen.queryByRole("button", { name: "Remove html tag" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("You can add up to 3 tags.")).toBeVisible();
});
it("submits valid data and navigates only after success", async () => {
  render(<Question mongoUserId={JSON.stringify("a".repeat(24))} />);
  fillQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Ask a Question" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
  expect(mocks.push).toHaveBeenCalledWith("/");
});
it("shows a failed submission and keeps the form available for retry", async () => {
  mocks.create.mockRejectedValueOnce(new Error("Could not save the question"));
  render(<Question mongoUserId={JSON.stringify("a".repeat(24))} />);
  fillQuestion();
  fireEvent.click(screen.getByRole("button", { name: "Ask a Question" }));
  await waitFor(() =>
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not save the question" }),
    ),
  );
  expect(mocks.push).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Ask a Question" })).toBeEnabled();
});
