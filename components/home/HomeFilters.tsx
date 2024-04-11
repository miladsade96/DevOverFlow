"use client";

import { HomePageFilters } from "@/constants/filters";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formUrlQuery } from "@/lib/utils";

export default function HomeFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState("");

  function handleTypeClick(item: string) {
    if (active === item) {
      setActive("");
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "filter",
        value: null,
      });
      router.push(newUrl, { scroll: false });
    } else {
      setActive(item);
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "filter",
        value: item.toLowerCase(),
      });
      router.push(newUrl, { scroll: false });
    }
  }

  return (
    <div className="mt-10 hidden flex-wrap gap-3 md:flex">
      {HomePageFilters.map((item) => {
        return (
          <Button
            key={item.value}
            onClick={() => handleTypeClick(item.value)}
            className={`body-medium rounded-lg px-6 py-3 capitalize shadow-none 
            ${active === item.value ? "bg-primary-100 text-primary-500" : "bg-light-800 text-light-500"}`}
          >
            {item.name}
          </Button>
        );
      })}
    </div>
  );
}
