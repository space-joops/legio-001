with open('src/components/RosaryGuide.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for full screen image
state_insert = """  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");"""
new_state_insert = """  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, title: string, explanation: string[]} | null>(null);"""
content = content.replace(state_insert, new_state_insert)

# When clicking on the image, open full screen
# We need to get the mystery explanation. The mystery explanation is in `step.lines` when `step.decade` is true and it's the announcement screen.
# Wait, the announcement screen has `step.image`, and its `lines` are empty right now.
# Ah, the `buildRosarySteps` for announcement screen:
# { title: mystery.lines[d], lines: [], decade: d + 1, image: `/images/rosary/${id}-${d + 1}.jpeg` }
# Let's change `buildRosarySteps` first to include the full text for the popup.
