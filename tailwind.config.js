import nativewindPreset from "nativewind/preset";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors: {
        background: "#14161A",
        foreground: "#FAFAFA",
        card: "#1C1F24",
        primary: {
          DEFAULT: "#4ADE80",
          foreground: "#14161A",
        },
        secondary: {
          DEFAULT: "#282C34",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#2D3139",
          foreground: "#8B8F96",
        },
        border: "#2D3139",
        status: {
          online: "#4ADE80",
          offline: "#808080",
        },
      },
      fontFamily: {
        rubik: ["Rubik_400Regular"],
        "rubik-medium": ["Rubik_500Medium"],
        "rubik-semibold": ["Rubik_600SemiBold"],
        "rubik-bold": ["Rubik_700Bold"],
      },
    },
  },
  plugins: [],
};