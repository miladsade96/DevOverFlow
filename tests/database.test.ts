// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const database = vi.hoisted(() => ({
  set: vi.fn(),
  connect: vi.fn(),
  connection: { readyState: 0 },
}));
vi.mock("mongoose", () => ({ default: database }));
import { connectToDatabase } from "@/lib/mongoose";
beforeEach(() => {
  delete (globalThis as { mongoConnection?: unknown }).mongoConnection;
  database.connection.readyState = 0;
  vi.stubEnv("MONGODB_URL", "mongodb://offline.invalid/test");
});
afterEach(() => vi.unstubAllEnvs());
it("rejects missing configuration before connecting", async () => {
  vi.stubEnv("MONGODB_URL", "");
  await expect(connectToDatabase()).rejects.toThrow("not configured");
  expect(database.connect).not.toHaveBeenCalled();
});
it("shares one pending connection across simultaneous requests", async () => {
  database.connect.mockResolvedValue(database);
  await Promise.all([
    connectToDatabase(),
    connectToDatabase(),
    connectToDatabase(),
  ]);
  expect(database.connect).toHaveBeenCalledTimes(1);
});
it("permits a retry after a failed connection and hides database details", async () => {
  database.connect
    .mockRejectedValueOnce(new Error("private URI"))
    .mockResolvedValueOnce(database);
  await expect(connectToDatabase()).rejects.toThrow("database is unavailable");
  await expect(connectToDatabase()).resolves.toBe(database);
  expect(database.connect).toHaveBeenCalledTimes(2);
});
it("reuses an already connected database", async () => {
  database.connection.readyState = 1;
  await connectToDatabase();
  expect(database.connect).not.toHaveBeenCalled();
});
it("reconnects after a previously established connection is lost", async () => {
  database.connect.mockResolvedValue(database);
  await connectToDatabase();
  database.connection.readyState = 0;
  await connectToDatabase();
  expect(database.connect).toHaveBeenCalledTimes(2);
});
