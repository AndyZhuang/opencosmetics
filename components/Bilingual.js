"use client";
import { useEffect, useState } from "react";

// Read language from localStorage client-side
function readLang() {
  if (typeof window === "undefined") return "both";
  return localStorage.getItem("opencosmetics_lang") || "both";
}

export function Bilingual({ zh, en, separator = " / " }) {
  const [lang, setLang] = useState("both");

  useEffect(() => {
    setLang(readLang());
    const handler = () => setLang(readLang());
    window.addEventListener("storage", handler);
    // Also poll for cookie changes
    const interval = setInterval(() => {
      const l = readLang();
      if (l !== lang) setLang(l);
    }, 500);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [lang]);

  if (!zh && !en) return null;
  if (lang === "en") return <>{en || zh}</>;
  if (lang === "zh") return <>{zh || en}</>;
  if (!zh || zh === en) return <>{en}</>;
  if (!en) return <>{zh}</>;
  return <>{zh}{separator}{en}</>;
}

// Field picker for data with Chinese + English values
export function LangField({ zh, en, fallback }) {
  return <Bilingual zh={zh} en={en || fallback} />;
}
