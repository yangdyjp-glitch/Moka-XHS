/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:       "var(--color-paper)",
        "paper-alt": "var(--color-paper-alt)",
        card:        "var(--color-card)",
        ink:         "var(--color-ink)",
        "ink-soft":  "var(--color-ink-soft)",
        muted:       "var(--color-muted)",
        hairline:    "var(--color-hairline)",
        accent:      "var(--color-accent)",
        "accent-deep": "var(--color-accent-deep)",
      },
      fontFamily: {
        serif:  ["Noto Serif SC", "Georgia", "Times New Roman", "serif"],
        sans:   ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
        mono:   ["JetBrains Mono", "SF Mono", "Cascadia Code", "monospace"],
      },
      maxWidth: {
        content: "1400px",
      },
      spacing: {
        section: "40px",
        group:   "24px",
      },
    },
  },
  plugins: [],
};
