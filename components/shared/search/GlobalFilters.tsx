"use client";

import { GlobalSearchFilters } from "@/constants/filters";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { formUrlQuery } from "@/lib/utils";

export default function GlobalFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParams = searchParams.get("type");
  const active = typeParams || "";

  function handleTypeClick(type: string) {
    if (active === type) {
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "type",
        value: null,
      });
      router.push(newUrl, { scroll: false });
    } else {
      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: "type",
        value: type.toLowerCase(),
      });
      router.push(newUrl, { scroll: false });
    }
  }

  return (
    <div className="flex items-center gap-5 px-5">
      <p className="text-dark400_light900 body-medium">Type:</p>
      <div className="flex gap-3">
        {GlobalSearchFilters.map((item) => (
          <Button
            type="button"
            key={item.value}
            aria-pressed={active === item.value}
            onClick={() => handleTypeClick(item.value)}
            className={`light-border-2 small-medium rounded-2xl px-5 py-2 capitalize dark:text-light-800 
            dark:hover:text-primary-500 ${
              active === item.value
                ? "bg-primary-500 text-light-900"
                : "bg-light-700 text-dark-400 hover:text-primary-500 dark:bg-dark-500"
            }`}
          >
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
