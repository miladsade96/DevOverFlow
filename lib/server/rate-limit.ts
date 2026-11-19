import "server-only";
// MongoDB-backed counter works across serverless instances. No in-memory quotas.
import mongoose from "mongoose";
const schema = new mongoose.Schema({
  _id: String,
  count: Number,
  expiresAt: Date,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Quota = mongoose.models.AiQuota || mongoose.model("AiQuota", schema);

export async function consumeAiQuota(userId: string) {
  const hour = Math.floor(Date.now() / 3600000);
  const quota = await Quota.findOneAndUpdate(
    { _id: `${userId}:${hour}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((hour + 2) * 3600000) },
    },
    { upsert: true, new: true },
  );
  if (quota.count > 10)
    throw new Error("AI answer limit reached. Please try again next hour.");
}
