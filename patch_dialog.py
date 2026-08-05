with open('src/components/RosaryGuide.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a full screen image dialog to RosaryGuide
# We can use a simple state to track if an image is clicked and open a full-screen overlay

old_imports = """import { useEffect, useMemo, useRef, useState } from "react";"""
new_imports = """import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'; // Just an example, let's use a native dialog instead
"""

# Let's write a simpler native overlay in RosaryGuide directly

# Before:
#         {step.image && (
#           <div className={styles.imageWrapper}>
#              {/* eslint-disable-next-line @next/next/no-img-element */}
#             <img
#               src={step.image}

# After:
#  (Add a state `const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);`)
