import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const navigation = vi.hoisted(() => ({
  query: "page=4&q=react",
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("next/image", () => ({ default: () => null }));
import LocalSearchbar from "@/components/shared/search/LocalSearchbar";
import HomeFilters from "@/components/home/HomeFilters";
const props = {
  route: "/",
  iconPosition: "left",
  imgSrc: "/search.svg",
  placeHolder: "Search questions",
  otherClasses: "",
};
beforeEach(() => {
  vi.useFakeTimers();
  navigation.query = "page=4&q=react";
});
afterEach(() => vi.useRealTimers());
it("does not navigate again when mounting with the current search", () => {
  render(<LocalSearchbar {...props} />);
  act(() => vi.advanceTimersByTime(1000));
  expect(navigation.push).not.toHaveBeenCalled();
});
it("resets pagination when changing or clearing a search", () => {
  render(<LocalSearchbar {...props} />);
  fireEvent.change(screen.getByLabelText("Search questions"), {
    target: { value: "typescript" },
  });
  act(() => vi.advanceTimersByTime(350));
  expect(navigation.push).toHaveBeenLastCalledWith("/?q=typescript", {
    scroll: false,
  });
  fireEvent.change(screen.getByLabelText("Search questions"), {
    target: { value: "" },
  });
  act(() => vi.advanceTimersByTime(350));
  expect(navigation.push).toHaveBeenLastCalledWith("/", { scroll: false });
});
it("follows the search query when browser history changes", () => {
  const { rerender } = render(<LocalSearchbar {...props} />);
  navigation.query = "q=javascript";
  rerender(<LocalSearchbar {...props} />);
  expect(screen.getByLabelText("Search questions")).toHaveValue("javascript");
  act(() => vi.advanceTimersByTime(350));
  expect(navigation.push).not.toHaveBeenCalled();
});
it("highlights the URL filter and resets the page when it changes", () => {
  navigation.query = "filter=frequent&page=8";
  render(<HomeFilters />);
  expect(screen.getByRole("button", { name: "Frequent" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Newest" }));
  expect(navigation.push).toHaveBeenCalledWith("/?filter=newest", {
    scroll: false,
  });
});
