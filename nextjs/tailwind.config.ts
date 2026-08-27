import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Brand color palette (Barakah Finance) ──
      colors: {
        gold: {
          50:  "#fffdf0",
          100: "#fffbcc",
          200: "#fff599",
          300: "#ffec66",
          400: "#ffe033",
          500: "#F5D061", // primary brand gold
          600: "#d4a017",
          700: "#a67c00",
          800: "#7a5c00",
          900: "#4d3a00",
        },
        islamic: {
          green:  "#1a7a4a", // deep Islamic green
          light:  "#2ecc71",
          dark:   "#0f4c2a",
        },
        brand: {
          bg:       "#0f172a", // dark mode background
          surface:  "#1e293b",
          border:   "#334155",
          muted:    "#64748b",
          text:     "#f1f5f9",
        },
      },
      // ── Bengali font stack ──
      fontFamily: {
        sans: [
          "Noto Sans Bengali",
          "Noto Serif Bengali",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "Noto Serif Bengali",
          "Georgia",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      // ── Layout ──
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ── Animation ──
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "marquee": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "marquee":         "marquee 30s linear infinite",
        "fade-in":         "fade-in 0.3s ease-out",
        "slide-in-left":   "slide-in-left 0.25s ease-out",
        "blink":           "blink 1.5s step-start infinite",
      },
      // ── Print utilities ──
      screens: {
        print: { raw: "print" },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
