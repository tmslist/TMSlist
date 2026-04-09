/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A", // Deep Navy
          light: "#1E293B",
          dark: "#020617",
          accent: "#2563EB", // Clean Blue
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
      },
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
