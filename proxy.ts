import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { missingSettings } from "@/lib/config";
const publicPage = (path: string) =>
  path === "/" ||
  /^\/(sign-in|sign-up|setup)(\/|$)/.test(path) ||
  /^\/(tags|community)(\/|$)/.test(path) ||
  (/^\/(question|profile)\/[^/]+$/.test(path) && !path.endsWith("/edit")) ||
  path === "/api/webhook";
const authenticated = clerkMiddleware(async (auth, request) => {
  if (!publicPage(request.nextUrl.pathname)) await auth.protect();
});
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (missingSettings().length) {
    if (request.nextUrl.pathname === "/setup" && request.method === "GET")
      return NextResponse.next();
    if (
      (request.method !== "GET" && request.method !== "HEAD") ||
      request.nextUrl.pathname.startsWith("/api/")
    )
      return NextResponse.json(
        { error: "Services are not configured." },
        { status: 503 },
      );
    return NextResponse.redirect(new URL("/setup", request.url));
  }
  return authenticated(request, event);
}
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|map|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
