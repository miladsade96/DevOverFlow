import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="jus flex min-h-screen w-full items-center justify-center">
      {children}
    </main>
  );
}
