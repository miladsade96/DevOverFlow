"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";

interface localSearchbarProps {
  route: string;
  iconPosition: string;
  imgSrc: string;
  placeHolder: string;
  otherClasses: string;
}

export default function LocalSearchbar({
  route,
  iconPosition,
  imgSrc,
  placeHolder,
  otherClasses,
}: localSearchbarProps) {
  return (
    <div
      className={`background-light800_darkgradient flex min-h-[56px] grow items-center gap-4
       rounded-[10px] px-4 ${otherClasses}`}
    >
      {iconPosition === "left" && (
        <Image
          src={imgSrc}
          alt="Search icon"
          width={24}
          height={24}
          className="cursor-pointer"
        />
      )}
      <Input
        type="text"
        placeholder={placeHolder}
        value=""
        onChange={() => {}}
        className="paragraph-regular no-focus placeholder background-light800_darkgradient border-none shadow-none outline-none"
      />
      {iconPosition === "right" && (
        <Image
          src={imgSrc}
          alt="Search icon"
          width={24}
          height={24}
          className="cursor-pointer"
        />
      )}
    </div>
  );
}
