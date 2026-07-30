import type { SVGProps } from "react";
import { IconBase } from "./IconBase";

export function RosaryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="10" r="7" strokeDasharray="2.2 3.2" />
      <path d="M12 17v5" />
      <path d="M10.5 22h3" />
    </IconBase>
  );
}
