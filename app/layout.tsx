import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";
import "../styles/prism.css";
import React from "react";
import { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; // eslint-disable-line
import { ThemeProvider } from "@/context/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-spaceGrotesk",
});

export const metadata: Metadata = {
  title: "DevOverFlow",
  description:
    "The community-driven platform for asking and answering programming questions.",
  icons: { icon: "/assets/images/site-logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // @ts-ignore
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ClerkProvider
          appearance={{
            elements: {
              formButtonPrimary: "primary-gradient",
              footerActionLink: "primary-text-gradient hover:text-primary-500",
            },
          }}
        >
          <ThemeProvider> {children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
