import json

def update_rosary_mysteries():
    with open('src/lib/meditations.json', 'r', encoding='utf-8') as f:
        meditations = json.load(f)

    with open('src/lib/rosaryMysteries.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Create the meditations object
    meditations_str = "export const MYSTERY_MEDITATIONS: Record<MysteryId, Record<number, string[]>> = "
    meditations_str += json.dumps(meditations, ensure_ascii=False, indent=2)
    meditations_str += ";\n"

    # Insert it before getMysteryIdForDate
    if "export const MYSTERY_MEDITATIONS" not in content:
        content = content.replace("export function getMysteryIdForDate", meditations_str + "\nexport function getMysteryIdForDate")

    # Update buildRosarySteps to include meditations

    # In buildRosarySteps we need to modify this part:
    # { title: labels.ourFather, lines: ourFather, decade: d + 1 },
    # ...hailMarys(HAIL_MARYS_PER_DECADE, d + 1),

    search_str = "const hailMarys = (count: number, decade?: number): RosaryStep[] =>"
    replacement = """
  const hailMarys = (count: number, decade?: number, mysteryId?: MysteryId): RosaryStep[] =>
    Array.from({ length: count }, (_, i) => {
      let lines = hailMary;
      if (ko && mysteryId && decade && MYSTERY_MEDITATIONS[mysteryId]?.[decade]?.[i]) {
        lines = [MYSTERY_MEDITATIONS[mysteryId][decade][i], ...hailMary];
      }
      return {
        title: labels.hailMary,
        ordinal: `${i + 1} / ${count}`,
        lines: lines,
        decade,
      };
    });
"""
    if search_str in content:
        start_idx = content.find(search_str)
        end_idx = content.find("];", start_idx)
        # We need to replace the hailMarys function but keep the rest
        pass

    print("Please use manual string replacements for TS files")

update_rosary_mysteries()
