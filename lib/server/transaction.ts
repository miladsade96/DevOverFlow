import "server-only";
import mongoose, { ClientSession } from "mongoose";

export async function inTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}
