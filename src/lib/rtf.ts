import type { dictionaries } from "@/i18n/dictionaries";
import type { Language } from "./types";

/**
 * Minimal RTF writer shared by the monthly and annual report builders.
 *
 * RTF is what 한글 and Word both open natively and stay editable in, needs no
 * library, and — unlike a real .hwp, which is an OLE container of zlib'd binary
 * records — can be produced from a backend-less app and verified with
 * `soffice --headless --convert-to txt`.
 */

/** RTF is 7-bit; every non-ASCII character goes out as a \uN escape. */
export function esc(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\\") out += "\\\\";
    else if (ch === "{" || ch === "}") out += `\\${ch}`;
    else if (ch === "\n") out += "\\line ";
    else if (code < 128) out += ch;
    // RTF's \u takes a signed 16-bit value, and the trailing "?" is the
    // fallback glyph for readers that can't handle the escape.
    else if (code <= 0xffff) out += `\\u${code < 32768 ? code : code - 65536}?`;
    else out += "?";
  }
  return out;
}

export function para(
  text: string,
  opts: { bold?: boolean; align?: "l" | "c" | "r"; size?: number } = {}
) {
  const align = `\\q${opts.align ?? "l"}`;
  const size = opts.size ? `\\fs${opts.size}` : "";
  const bold = opts.bold ? "\\b" : "";
  return `{\\pard${align}${bold}${size} ${esc(text)}\\par}`;
}

/** One table row. `widths` are cumulative-independent column widths in twips. */
export function row(cells: string[], widths: number[], opts: { bold?: boolean } = {}): string {
  let x = 0;
  const borders = "\\clbrdrt\\brdrs\\clbrdrl\\brdrs\\clbrdrb\\brdrs\\clbrdrr\\brdrs";
  const defs = widths.map((w) => {
    x += w;
    return `${borders}\\cellx${x}`;
  });
  const body = cells
    .map((c) => `{\\intbl\\qc${opts.bold ? "\\b" : ""} ${esc(c)}\\cell}`)
    .join("");
  return `\\trowd\\trgaph60${defs.join("")}${body}\\row`;
}

/** Resolves a dotted dictionary key the same way useTranslation does. */
export function lookup(dict: (typeof dictionaries)[Language], key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], dict);
  return typeof value === "string" ? value : key;
}

/** fcharset129 = Hangul, so 한글 picks a Korean face even without Malgun Gothic. */
export function wrapDocument(body: string[]): string {
  return (
    `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}}` +
    `\\viewkind4\\uc1\\f0\\fs22\n${body.join("\n")}\n}`
  );
}
