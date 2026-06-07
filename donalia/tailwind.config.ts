import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4EEE3",
        ink: { DEFAULT: "#16403B", 2: "#1E5A52" },
        green: "#4E9C7F",
        gold: "#C2A14E",
        card: "#FFFFFF",
        line: "#E7DECB",
        muted: "#7A7264",
        text: "#23201A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-mulish)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "22px",
      },
      boxShadow: {
        soft: "0 14px 34px -18px rgba(22,64,59,.35)",
      },
      maxWidth: {
        content: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
