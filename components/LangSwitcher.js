"use client";
import { useEffect, useState } from "react";
import { LANGUAGES, LANG_LABELS } from "../lib/i18n";

// 2-state cycle: zh → en → zh
const NEXT = { zh: "en", en: "zh" };

export default function LangSwitcher() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("opencosmetics_lang");
    if (stored && LANGUAGES.includes(stored)) {
      setLang(stored);
    }
  }, []);

  // Persist on change
  function cycle() {
    const next = NEXT[lang] || "zh";
    setLang(next);
    localStorage.setItem("opencosmetics_lang", next);
    // Set cookie for SSR detection
    document.cookie = `opencosmetics_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // Update html lang attribute
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    // Soft refresh (reload but keep scroll)
    if (typeof window !== "undefined") {
      const y = window.scrollY;
      window.location.reload();
      window.addEventListener("load", () => window.scrollTo(0, y));
    }
  }

  const label = LANG_LABELS[lang] || LANG_LABELS.zh;
  const displayText = lang === "en" ? label.en : label.zh;

  return (
    <button
      onClick={cycle}
      title="Toggle language / 切换语言"
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: "12px",
        color: "var(--text)",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: "14px" }}>{label.icon}</span>
      <span>{displayText}</span>
    </button>
  );
}
