"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") ?? "light";
    setIsDark(stored === "dark");
    document.documentElement.dataset.theme = stored;
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return { isDark, toggle };
}
