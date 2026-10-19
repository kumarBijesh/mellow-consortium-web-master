import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        darkbg: "#0a0e13",
        navy: "#092B4C",
        "navy-2": "#0c3661",
        blue: "#006EB6",
        teal: "#15A8A0",
        lightblue: "#E9F5FA",
        gold: "#D9B447",
        ink: "#162435",
        muted: "#5b6b7b",
        line: "#e2e9ef",
        division: {
          consortium: "#006EB6",
          age: "#15A8A0",
          jlive: "#6B4EC7",
          conferences: "#D9B447",
          news: "#E8735A",
        },
        // MELLOW brand v2 — homepage/header/footer redesign palette
        // (dashboards keep the navy/blue/teal system above; unaffected).
        richblack: "#021B1A",
        darkgreen: "#032221",
        bangladesh: "#03624C",
        meadow: "#2CC295",
        caribbean: "#00DF81",
        flashwhite: "#F1F7F6",
        pine: "#06302B",
        basil: "#0B453A",
        forest: "#095544",
        frog: "#17876D",
        mint: "#2FA98C",
        stone: "#707D7D",
        pistachio: "#AACBC4",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        // Brand v2 heading font. Falls back to Sora until the licensed
        // Axiforma files are dropped into public/fonts/axiforma/ (see the
        // @font-face block in globals.css) — no code change needed then.
        brand: ["Axiforma", "Sora", "sans-serif"],
      },
      maxWidth: {
        wrap: "1240px",
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 18px 50px -22px rgba(9,43,76,.45)",
        "card-sm": "0 8px 24px -14px rgba(9,43,76,.4)",
        "card-green": "0 18px 50px -20px rgba(3,98,76,.5)",
        "card-green-sm": "0 8px 24px -14px rgba(3,98,76,.45)",
      },
    },
  },
  plugins: [],
};

export default config;
