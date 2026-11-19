import { ComponentProps } from "react";
import { useRouter } from "./router";
export default function Link({ href, onClick, ...props }: ComponentProps<"a">) {
  const router = useRouter();
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (href?.startsWith("/") && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          router.push(href);
        }
      }}
    />
  );
}
