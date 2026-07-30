import type { SVGProps } from "react";
import { IconBase } from "./IconBase";

export function MassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M8 3v4a4 4 0 0 0 8 0V3" />
      <path d="M12 11v7" />
      <path d="M8.5 21h7" />
      <path d="M6 3h4M14 3h4" />
    </IconBase>
  );
}
