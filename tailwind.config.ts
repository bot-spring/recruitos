import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          surface: "#d3dbed",      // Designated surface / accent panel color
          surfaceDark: "#b8c5e3",  // Slightly deeper tone for active/border accents
          surfaceLight: "#edf2fa", // Light tint for cards and inner containers
          yellow: "#FFD400",       // Botspring Action Highlight Yellow
          yellowHover: "#E6BF00",
          dark: "#0F172A",         // High-contrast text
          slate: "#64748B",
          bgLight: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};

export default config;

