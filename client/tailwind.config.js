/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#05060A",
        panel: "#0B0E14",
        line: "rgba(255,255,255,0.1)",
        muted: "#A4A9B6",
        neon: "#3B82F6",
        cyan: "#22D3EE",
        violet: "#8B5CF6",
      },
      boxShadow: {
        glow: "0 0 60px rgba(59,130,246,0.22)",
        glass: "0 24px 80px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
}
