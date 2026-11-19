export function escapeRegex(value: string) {
  return value
    .trim()
    .slice(0, 200)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pagination(page = 1, pageSize = 10) {
  const safePage = Number.isFinite(page)
    ? Math.min(10000, Math.max(1, Math.floor(page)))
    : 1;
  const limit = Number.isFinite(pageSize)
    ? Math.min(50, Math.max(1, Math.floor(pageSize)))
    : 10;
  return { skipAmount: (safePage - 1) * limit, limit };
}

export function objectId(value: string) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value))
    throw new Error("Invalid item ID.");
  return value;
}

export function clerkId(value: string) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    throw new Error("Invalid user ID.");
  return value;
}
