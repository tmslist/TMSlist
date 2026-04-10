/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C3AED", // Violet — matches brand logo
          light: "#A78BFA",
          dark: "#6D28D9",
          accent: "#8B5CF6",
        },
        secondary: {
          DEFAULT: "#0891B2", // Clean Cyan
          light: "#06B6D4",
          dark: "#0E7490",
        },
        accent: {
          DEFAULT: "#10B981", // Emerald Green
          hover: "#059669",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#F8FAFC",
        },
        navy: {
          DEFAULT: "#0F172A", // Dark backgrounds
          light: "#1E293B",
          dark: "#020617",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
