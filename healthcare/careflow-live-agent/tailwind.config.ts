import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        // Soft, professional clinical blue + slate grays.
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd6ff",
          300: "#8ebcff",
          400: "#5b97fb",
          500: "#3a74f0",
          600: "#2457d6",
          700: "#1f45ad",
          800: "#1f3c89",
          900: "#1e376e",
        },
        ink: {
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          400: "#94a3b8",
          200: "#e2e8f0",
          100: "#f1f5f9",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 10px 30px -12px rgba(15,23,42,0.12)",
        lift: "0 2px 6px rgba(15,23,42,0.06), 0 24px 48px -20px rgba(15,23,42,0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "live-pulse": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "halo": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(220,38,38,0.25)" },
          "50%": { boxShadow: "0 0 0 8px rgba(220,38,38,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22,0.61,0.36,1) both",
        "pop-in": "pop-in 0.35s cubic-bezier(0.22,0.61,0.36,1) both",
        "live-pulse": "live-pulse 1.2s ease-in-out infinite",
        halo: "halo 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
