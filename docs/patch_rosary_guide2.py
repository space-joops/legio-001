with open('src/components/RosaryGuide.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
state_insert = """  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");"""
new_state_insert = """  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, title: string, explanation: string[]} | null>(null);"""
content = content.replace(state_insert, new_state_insert)

# Modify image rendering
old_img = """        {step.image && (
          <div className={styles.imageWrapper}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.title}
              className={styles.mysteryImage}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}"""

new_img = """        {step.image && (
          <div className={styles.imageWrapper}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.title}
              className={styles.mysteryImage}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              onClick={() => {
                if (step.explanation && step.explanation.length > 0) {
                  setFullScreenImage({ src: step.image!, title: step.title, explanation: step.explanation });
                }
              }}
              style={{ cursor: step.explanation && step.explanation.length > 0 ? 'pointer' : 'default' }}
            />
          </div>
        )}"""
content = content.replace(old_img, new_img)

# Add Full Screen Dialog at the end of the component
old_end = """    </section>
  );
}"""

new_end = """      {fullScreenImage && (
        <dialog
          className={styles.fullScreenDialog}
          ref={(el) => {
            if (el && !el.open) {
              el.showModal();
            }
          }}
          onCancel={(e) => {
            e.preventDefault();
            setFullScreenImage(null);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFullScreenImage(null);
            }
          }}
        >
          <div className={styles.fullScreenContent}>
            <button
              className={styles.closeFullScreenBtn}
              onClick={() => setFullScreenImage(null)}
              aria-label={t("common.close")}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <div className={styles.fullScreenScroll}>
              <h2 className={styles.fullScreenTitle}>{fullScreenImage.title}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullScreenImage.src}
                alt={fullScreenImage.title}
                className={styles.fullScreenImg}
              />
              <div className={styles.fullScreenText}>
                {fullScreenImage.explanation.map((line, i) => (
                  <p key={i} className={styles.fullScreenLine}>
                    {i + 1}. {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}"""
content = content.replace(old_end, new_end)

with open('src/components/RosaryGuide.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated src/components/RosaryGuide.tsx")
