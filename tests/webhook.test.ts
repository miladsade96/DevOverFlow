// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const sync = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/user-sync", () => ({ syncClerkUser: sync }));
import { POST } from "@/app/api/webhook/route";
const key = Buffer.from("offline-test-signing-key");
beforeEach(() => {
  vi.stubEnv("CLERK_WEBHOOK_SECRET", `whsec_${key.toString("base64")}`);
  sync.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
function request(valid: boolean) {
  const body = '{ "type": "user.created", "data": { "id": "test-user" } }';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", key)
    .update(`test-id.${timestamp}.${body}`)
    .digest("base64");
  return new Request("http://localhost/api/webhook", {
    method: "POST",
    body,
    headers: {
      "svix-id": "test-id",
      "svix-timestamp": timestamp,
      "svix-signature": valid ? `v1,${signature}` : "v1,invalid",
    },
  });
}
it("verifies the exact raw body, including its whitespace", async () => {
  expect((await POST(request(true))).status).toBe(200);
  expect(sync).toHaveBeenCalledWith({
    type: "user.created",
    data: { id: "test-user" },
  });
});
it("rejects forged webhook signatures before user synchronization", async () => {
  expect((await POST(request(false))).status).toBe(400);
  expect(sync).not.toHaveBeenCalled();
});
it("rejects missing signature headers", async () => {
  expect(
    (
      await POST(
        new Request("http://localhost", { method: "POST", body: "{}" }),
      )
    ).status,
  ).toBe(400);
  expect(sync).not.toHaveBeenCalled();
});
it("reports missing webhook setup without throwing", async () => {
  vi.stubEnv("CLERK_WEBHOOK_SECRET", "");
  vi.stubEnv("NEXT_CLERK_WEBHOOK_SECRET", "");
  expect((await POST(request(true))).status).toBe(503);
});
it("asks Clerk to retry when processing fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  sync.mockRejectedValueOnce(new Error("Offline database"));
  expect((await POST(request(true))).status).toBe(500);
  vi.restoreAllMocks();
});
