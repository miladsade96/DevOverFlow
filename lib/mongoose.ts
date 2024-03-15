import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase() {
  mongoose.set("strictQuery", true);
  if (!process.env.MONGODB_URL) {
    console.log("Missing mongoDB url!");
    return;
  }
  if (isConnected) {
    console.log("MongoDB is already connected.");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, { dbName: "First" });
    isConnected = true;
    console.log("MongoDB is connected");
  } catch (e) {
    console.log("MongoDB connection failed: ", e);
  }
}
