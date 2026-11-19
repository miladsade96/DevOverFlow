"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
interface ThemeContextProps {
  mode: string;
  setMode: (mode: string) => void;
}
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
function storedTheme() {
  try {
    return localStorage.getItem("theme") || "system";
  } catch {
    return "system";
  }
}
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("theme-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("theme-change", notify);
  };
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(
    subscribe,
    storedTheme,
    () => "system",
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        preference === "dark" || (preference === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);
  function setMode(value: string) {
    if (!["light", "dark", "system"].includes(value)) return;
    try {
      if (value === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", value);
    } catch {
      /* Storage may be disabled. */
    }
    document.documentElement.classList.toggle(
      "dark",
      value === "dark" ||
        (value === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
    window.dispatchEvent(new Event("theme-change"));
  }
  return (
    <ThemeContext.Provider value={{ mode: preference, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
