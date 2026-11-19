// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  quota: vi.fn(),
  generate: vi.fn(),
}));
vi.mock("@/lib/server/auth", () => ({ requireActor: mocks.actor }));
vi.mock("@/lib/server/rate-limit", () => ({ consumeAiQuota: mocks.quota }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mocks.generate };
  },
}));
import { generateGeminiAnswer } from "@/lib/api/google";
beforeEach(() => {
  mocks.actor.mockResolvedValue({ _id: "actor" });
  vi.stubEnv("GOOGLE_API_KEY", "offline-test-key");
  vi.stubEnv("GOOGLE_AI_MODEL", "offline-test-model");
});
afterEach(() => vi.unstubAllEnvs());
it("requires authentication before asking the AI service", async () => {
  mocks.actor.mockRejectedValueOnce(new Error("sign in"));
  await expect(generateGeminiAnswer("How do promises work?")).rejects.toThrow(
    "sign in",
  );
  expect(mocks.generate).not.toHaveBeenCalled();
});
it("requires a configured model and key", async () => {
  vi.stubEnv("GOOGLE_AI_MODEL", "");
  await expect(generateGeminiAnswer("How do promises work?")).rejects.toThrow(
    "not configured",
  );
  expect(mocks.generate).not.toHaveBeenCalled();
});
it.each(["short", "x".repeat(2001)])(
  "bounds the question before using the service",
  async (input) => {
    await expect(generateGeminiAnswer(input)).rejects.toThrow(
      "between 10 and 2000",
    );
    expect(mocks.quota).not.toHaveBeenCalled();
  },
);
it("enforces the authenticated account's quota", async () => {
  mocks.quota.mockRejectedValueOnce(new Error("limit reached"));
  await expect(generateGeminiAnswer("How do promises work?")).rejects.toThrow(
    "limit reached",
  );
  expect(mocks.generate).not.toHaveBeenCalled();
});
it("sanitizes generated HTML before it reaches the editor", async () => {
  mocks.generate.mockResolvedValueOnce({
    text: "<p>Use await</p><script>alert(1)</script>",
  });
  expect(await generateGeminiAnswer("How do promises work?")).toBe(
    "<p>Use await</p>",
  );
  expect(mocks.quota).toHaveBeenCalledWith("actor");
});
it("turns provider failures into a recoverable error", async () => {
  mocks.generate.mockRejectedValueOnce(new Error("private provider details"));
  await expect(generateGeminiAnswer("How do promises work?")).rejects.toThrow(
    "try again later",
  );
});
