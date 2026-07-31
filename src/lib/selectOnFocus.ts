import type { FocusEvent } from "react";

export function selectOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.target.select();
}
