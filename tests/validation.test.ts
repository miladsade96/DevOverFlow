import { describe, expect, it } from "vitest";
import { cleanHtml } from "@/lib/html";
import { escapeRegex, objectId, pagination } from "@/lib/query";
import { ProfileSchema } from "@/lib/validations";
import { voteTransition, Vote } from "@/lib/vote";

describe("safe community input", () => {
  it("keeps code and paragraphs while removing executable content, SVG and unsafe links", () => {
    const html = cleanHtml(
      '<p onclick="evil()">Hello</p><script>alert(1)</script><svg onload="evil()"></svg><a href="javascript:evil()">bad</a><img src="x" onerror="evil()"><pre><code class="language-js">const x = 1;</code></pre>',
    );
    expect(html).toContain('<code class="language-js">const x = 1;</code>');
    expect(html).toContain("<p>Hello</p>");
    expect(html).not.toMatch(/onclick|onerror|script|svg|javascript:/);
  });
  it("rejects protocol-relative links and preserves ordinary HTTPS links", () => {
    expect(cleanHtml('<a href="//evil.test">x</a>')).not.toContain("href=");
    expect(cleanHtml('<a href="https://example.com">x</a>')).toContain(
      'rel="nofollow noopener noreferrer"',
    );
  });
  it("searches punctuation literally, bounds query length and rejects malformed IDs", () => {
    expect(new RegExp(escapeRegex("[a-z]+(.*)"))).toEqual(/\[a-z\]\+\(\.\*\)/);
    expect(escapeRegex("a".repeat(1000))).toHaveLength(200);
    expect(() => objectId("bad")).toThrow("Invalid item ID");
  });
  it.each([
    [NaN, NaN, 0, 10],
    [-8, 0, 0, 1],
    [2, 10, 10, 10],
    [1, 100000, 0, 50],
  ])("bounds pagination %s/%s", (page, size, skip, limit) => {
    expect(pagination(page, size)).toEqual({ skipAmount: skip, limit });
  });
  it("allows empty optional profile fields and strips attempts to change protected fields", () => {
    const result = ProfileSchema.parse({
      name: "Jo",
      username: "jo_dev",
      bio: "",
      location: "",
      portfolioWebsite: "",
      reputation: 10000,
      clerkId: "other",
    });
    expect(result).not.toHaveProperty("reputation");
    expect(result).not.toHaveProperty("clerkId");
    expect(
      ProfileSchema.safeParse({
        ...result,
        portfolioWebsite: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});

describe("reputation transitions", () => {
  const scores = { none: 0, up: 10, down: -2 };
  for (const reward of [1, 2])
    for (const previous of ["none", "up", "down"] as Vote[])
      for (const clicked of ["up", "down"] as const) {
        it(`${previous} -> ${clicked}, voter reward ${reward}`, () => {
          const result = voteTransition(previous, clicked, reward);
          const next = previous === clicked ? "none" : clicked;
          expect(result.next).toBe(next);
          expect(result.authorDelta).toBe(scores[next] - scores[previous]);
          if (previous !== "none") {
            const back = voteTransition(next, previous, reward);
            if (next !== "none")
              expect(back.authorDelta + result.authorDelta).toBe(0);
          }
        });
      }
  it("does not earn reputation through repeated up/down vote cycles", () => {
    let state: Vote = "none";
    let total = 0;
    for (const click of ["up", "down", "up", "up"] as const) {
      const change = voteTransition(state, click, 1);
      total += change.voterDelta;
      state = change.next;
    }
    expect(state).toBe("none");
    expect(total).toBe(0);
  });
});
