export type Vote = "up" | "down" | "none";
export function voteTransition(
  previous: Vote,
  clicked: Exclude<Vote, "none">,
  voterReward: number,
) {
  const next: Vote = previous === clicked ? "none" : clicked;
  const authorScore = { none: 0, up: 10, down: -2 };
  const voterScore = { none: 0, up: voterReward, down: -1 };
  return {
    next,
    authorDelta: authorScore[next] - authorScore[previous],
    voterDelta: voterScore[next] - voterScore[previous],
  };
}
