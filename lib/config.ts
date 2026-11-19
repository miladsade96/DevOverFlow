export function missingSettings() {
  const settings = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    MONGODB_URL: process.env.MONGODB_URL,
  };
  return Object.entries(settings)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
}
