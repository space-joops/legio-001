import type { SVGProps } from "react";
import { IconBase } from "./IconBase";

export function AspirationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3l1.6 3.8L17.5 8l-3.9 1.2L12 13l-1.6-3.8L6.5 8l3.9-1.2z" />
      <path d="M5 16l.8 1.9L7.7 18l-1.9.8L5 20.7l-.8-1.9L2.3 18l1.9-.8z" />
      <path d="M19 15l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L17 17l1.4-.6z" />
    </IconBase>
  );
}
