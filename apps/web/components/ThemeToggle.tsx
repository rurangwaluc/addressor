"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("addressor-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = saved ? saved === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";

    setDark(shouldUseDark);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = !dark;

    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("addressor-theme", next ? "dark" : "light");

    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="group grid h-10 w-10 place-items-center rounded-full border transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 sm:h-11 sm:w-11"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 34px rgba(0,0,0,0.1)",
      }}
    >
      <span className="relative grid h-5 w-5 place-items-center overflow-hidden">
        <Sun
          aria-hidden="true"
          className={`absolute h-4.5 w-4.5 transition duration-300 ${
            ready && dark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`absolute h-4.5 w-4.5 transition duration-300 ${
            ready && dark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
