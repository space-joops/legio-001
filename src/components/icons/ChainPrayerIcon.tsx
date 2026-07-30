import type { SVGProps } from "react";
import { IconBase } from "./IconBase";

export function ChainPrayerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3" y="8" width="7" height="8" rx="3.5" />
      <rect x="14" y="8" width="7" height="8" rx="3.5" />
      <path d="M9.5 12h5" />
    </IconBase>
  );
}
