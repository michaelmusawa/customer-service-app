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
        background: "var(--background)",
        foreground: "var(--foreground)",
        countyGreen: {
          DEFAULT: "var(--countyGreen)",
        },
        countyYellow: {
          DEFAULT: "var(--countyYellow)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-lusitana)"],
      },
    },
  },
  plugins: [],
};
export default config;
