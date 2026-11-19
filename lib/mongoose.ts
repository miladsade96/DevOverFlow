import mongoose from "mongoose";

const cache = globalThis as typeof globalThis & {
  mongoConnection?: Promise<typeof mongoose>;
};

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is not configured.");
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cache.mongoConnection) {
    mongoose.set("strictQuery", true);
    cache.mongoConnection = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || "First",
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        cache.mongoConnection = undefined;
        return connection;
      })
      .catch(() => {
        cache.mongoConnection = undefined;
        throw new Error("The database is unavailable. Please try again later.");
      });
  }
  return cache.mongoConnection;
}
