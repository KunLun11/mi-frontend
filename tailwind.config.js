/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        "surface-blue": "var(--surface-blue)",
        "surface-sand": "var(--surface-sand)",
        ink: "var(--fg)",
        "ink-soft": "var(--fg-soft)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-ink": "var(--accent-ink)",
        "accent-tint": "var(--accent-tint)",
        "blue-ink": "var(--blue-ink)",
        "blue-tint": "var(--blue-tint)",
        "warn-ink": "var(--warn-ink)",
        "warn-tint": "var(--warn-tint)",
        danger: "var(--danger)",
        "danger-tint": "var(--danger-tint)",
      },
      fontFamily: {
        display: ['"Golos Text"', '"Segoe UI"', "sans-serif"],
        body: ['"Inter"', '"Segoe UI"', "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        pill: "var(--pill)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
      maxWidth: {
        container: "var(--container)",
      },
    },
  },
  plugins: [],
};
