"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center"
    >
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p>This page could not be loaded. Please try again.</p>
      <button
        className="rounded-lg bg-blue-700 px-6 py-3 text-white"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
