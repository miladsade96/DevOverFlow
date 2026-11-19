"use client";

import Image from "next/image";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Link from "next/link";
import { Show, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { sidebarLinks } from "@/constants";
import { usePathname } from "next/navigation";

function NavContent() {
  const { userId } = useAuth();
  const pathName = usePathname();
  return (
    <section className="flex h-full flex-col gap-6 pt-16">
      {sidebarLinks.map((item) => {
        if (item.route === "/profile" && !userId) return null;
        const route =
          item.route === "/profile" ? `/profile/${userId}` : item.route;
        const isActive =
          pathName === route ||
          (route !== "/" && pathName.startsWith(`${route}/`));
        return (
          <SheetClose asChild key={route}>
            <Link
              href={route}
              className={`${isActive ? "primary-gradient rounded-lg text-light-900" : "text-dark300_light900"} flex items-center justify-start gap-4 bg-transparent p-4`}
            >
              <Image
                src={item.imgURL}
                alt={item.label}
                width={20}
                height={20}
                className={`${isActive ? "" : "invert-colors"}`}
              />
              <p className={`${isActive ? "base-bold" : "base-medium"}`}>
                {item.label}
              </p>
            </Link>
          </SheetClose>
        );
      })}
    </section>
  );
}

export default function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="rounded p-1 sm:hidden"
        >
          <Image
            src="/assets/icons/hamburger.svg"
            alt="Menu"
            width={36}
            height={36}
            className="invert-colors sm:hidden"
          />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="background-light900_dark200 border-none"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Choose a page to open.
        </SheetDescription>
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/assets/images/site-logo.svg"
            alt="DevOverFlow Logo"
            width={23}
            height={23}
          />
          <p className="h2-bold text-dark100_light900 font-spaceGrotesk">
            Dev<span className="text-primary-500">OverFlow</span>
          </p>
        </Link>
        <div>
          <SheetClose asChild>
            <NavContent />
          </SheetClose>
          <Show when="signed-out">
            <div className="flex flex-col gap-3">
              <SheetClose asChild>
                <Link href="/sign-in">
                  <Button className="small-medium btn-secondary min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
                    <span className="primary-text-gradient">Log in</span>
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/sign-up">
                  <Button className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none">
                    Sign Up
                  </Button>
                </Link>
              </SheetClose>
            </div>
          </Show>
        </div>
      </SheetContent>
    </Sheet>
  );
}
