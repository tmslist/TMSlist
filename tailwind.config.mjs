/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5F00C2", // User Requested Purple
          light: "#7C3AED",
          dark: "#4C1D95",
        },
        secondary: {
          DEFAULT: "#2a9d8f", // Calming Teal
          light: "#3eccbc",
          dark: "#1e756a",
        },
        accent: {
          DEFAULT: "#e76f51", // Alert Orange
          hover: "#d65a3b",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8f9fa",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
