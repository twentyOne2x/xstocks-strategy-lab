import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#080808",
          dot: "#1a1a1a",
        },
        surface: {
          0: "#0a0a0a",
          1: "#0f0f0f",
          2: "#151515",
          3: "#1a1a1a",
        },
        border: {
          subtle: "#1a1a1a",
          default: "#252525",
          strong: "#333333",
        },
        accent: {
          DEFAULT: "#E8652C",
          hover: "#F07A45",
          muted: "#E8652C22",
        },
        node: {
          trigger: "#E8652C",
          action: "#444444",
          empty: "#10B981",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
