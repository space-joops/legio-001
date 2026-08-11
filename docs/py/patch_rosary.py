import json

with open('src/lib/meditations.json', 'r', encoding='utf-8') as f:
    meditations = json.load(f)

with open('src/lib/rosaryMysteries.ts', 'r', encoding='utf-8') as f:
    content = f.read()

meditations_code = f"""
export const MYSTERY_MEDITATIONS: Record<MysteryId, Record<number, string[]>> = {json.dumps(meditations, ensure_ascii=False, indent=2)};
"""

if "export const MYSTERY_MEDITATIONS" not in content:
    content = content.replace("export function getMysteryIdForDate", meditations_code + "\nexport function getMysteryIdForDate")

old_hailmarys = """  const hailMarys = (count: number, decade?: number): RosaryStep[] =>
    Array.from({ length: count }, (_, i) => ({
      title: labels.hailMary,
      ordinal: `${i + 1} / ${count}`,
      lines: hailMary,
      decade,
    }));"""

new_hailmarys = """  const hailMarys = (count: number, decade?: number): RosaryStep[] =>
    Array.from({ length: count }, (_, i) => {
      let stepLines = hailMary;
      if (ko && decade && MYSTERY_MEDITATIONS[id]?.[decade]?.[i]) {
        stepLines = [MYSTERY_MEDITATIONS[id][decade][i], ...hailMary];
      }
      return {
        title: labels.hailMary,
        ordinal: `${i + 1} / ${count}`,
        lines: stepLines,
        decade,
      };
    });"""

content = content.replace(old_hailmarys, new_hailmarys)

with open('src/lib/rosaryMysteries.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched src/lib/rosaryMysteries.ts")
