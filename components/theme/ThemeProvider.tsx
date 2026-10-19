"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "mellow-theme";

// Kill switch, flipped off while the header and ~35 unstyled form inputs
// (invisible text: white-on-white in dark mode) were found and fixed.
// Re-enabled after a full screenshot pass confirmed marketing pages,
// signin/signup/apply forms, and login pages render correctly in both themes.
export const DARK_MODE_ENABLED = true;

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Pick up whatever the no-FOUC boot script already decided, then sync
  // with the signed-in user's saved preference (which may differ from
  // what this particular browser has in localStorage).
  useEffect(() => {
    if (!DARK_MODE_ENABLED) {
      document.documentElement.setAttribute("data-theme", "light");
      return;
    }

    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    setResolvedTheme(applyTheme(stored));

    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled || !prefs?.theme) return;
      const remote = prefs.theme as Theme;
      setThemeState(remote);
      setResolvedTheme(applyTheme(remote));
      localStorage.setItem(STORAGE_KEY, remote);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!DARK_MODE_ENABLED || theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyTheme("system"));
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolvedTheme(applyTheme(next));
    localStorage.setItem(STORAGE_KEY, next);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("user_preferences").upsert({ id: data.user.id, theme: next, updated_at: new Date().toISOString() }).then();
    });
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// Inline, runs before hydration so the correct theme paints on first frame
// instead of flashing light-then-dark. Kept as a string so it can be
// dropped straight into a <script dangerouslySetInnerHTML> in <head>.
export const THEME_BOOT_SCRIPT = DARK_MODE_ENABLED
  ? `
(function () {
  try {
    var stored = localStorage.getItem("${STORAGE_KEY}");
    var theme = stored === "light" || stored === "dark" ? stored : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`
  : `document.documentElement.setAttribute("data-theme", "light");`;
