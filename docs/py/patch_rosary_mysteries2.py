with open('src/lib/rosaryMysteries.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Modify buildRosarySteps to add explanation to the step
# { title: mystery.lines[d], lines: [], decade: d + 1, image: `/images/rosary/${id}-${d + 1}.jpeg` },
old_mystery_step = "{ title: mystery.lines[d], lines: [], decade: d + 1, image: `/images/rosary/${id}-${d + 1}.jpeg` }"
new_mystery_step = "{ title: mystery.lines[d], lines: [], decade: d + 1, image: `/images/rosary/${id}-${d + 1}.jpeg`, explanation: ko && MYSTERY_MEDITATIONS[id]?.[d + 1] ? MYSTERY_MEDITATIONS[id][d + 1] : [] }"
content = content.replace(old_mystery_step, new_mystery_step)

# Also update RosaryStep interface
old_interface = """  /** The path to an optional image for this step */
  image?: string;
}"""
new_interface = """  /** The path to an optional image for this step */
  image?: string;
  /** Full explanation for the mystery popup */
  explanation?: string[];
}"""
content = content.replace(old_interface, new_interface)

with open('src/lib/rosaryMysteries.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated src/lib/rosaryMysteries.ts")
