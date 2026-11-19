/* eslint-disable @next/next/no-img-element -- This fixture replaces Next Image only in the offline test preview. */
import { ComponentProps } from "react";
export default function Image({
  priority: _priority,
  fill: _fill,
  alt = "",
  ...props
}: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) {
  return <img alt={alt} {...props} />;
}
