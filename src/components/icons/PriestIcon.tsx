import type { SVGProps } from "react";
import { IconBase } from "./IconBase";

export function PriestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 21v-4a6 6 0 0 1 12 0v4" />
      <path d="M10 12.5l1 2 1-2" />
    </IconBase>
  );
}
