// translate.js — Chinese <-> INCI translation helpers
// Auto-loaded from cn_iecic_i table on first import (cached)
// For zh mode, translate user input to INCI for risk engine matching.
// For en mode, no translation needed (INCI is already in English).
import fs from "node:fs";
import path from "node:path";

const MAP_PATH = path.join(process.cwd(), "lib", "zh_inci_map.json");
const REVERSE_PATH = path.join(process.cwd(), "lib", "inci_zh_map.json");

let _zhToInci = null;
let _inciToZh = null;

function loadZhToInci() {
  if (!_zhToInci) {
    try {
      _zhToInci = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));
    } catch (e) {
      console.warn("[translate] Failed to load zh_inci_map.json:", e.message);
      _zhToInci = {};
    }
  }
  return _zhToInci;
}

function loadInciToZh() {
  if (!_inciToZh) {
    try {
      _inciToZh = JSON.parse(fs.readFileSync(REVERSE_PATH, "utf-8"));
    } catch (e) {
      // Auto-build reverse map on first use
      const forward = loadZhToInci();
      _inciToZh = {};
      for (const [zh, inci] of Object.entries(forward)) {
        if (!_inciToZh[inci]) _inciToZh[inci] = [];
        _inciToZh[inci].push(zh);
      }
    }
  }
  return _inciToZh;
}

/**
 * Translate user input ingredients from Chinese to INCI.
 * When lang=zh, users may type "视黄醇" and we translate to "RETINOL".
 * When lang=en, no translation (already in INCI).
 *
 * @param {string[]} ingredients
 * @param {"zh"|"en"} lang
 * @returns {{ translated: string[], unknown: string[] }}
 */
export function translateIngredients(ingredients, lang = "zh") {
  if (lang === "en") {
    return { translated: ingredients, unknown: [] };
  }
  const map = loadZhToInci();
  const translated = [];
  const unknown = [];
  for (const ing of ingredients) {
    const key = String(ing || "").trim().toUpperCase();
    if (!key) continue;
    if (map[key]) {
      translated.push(map[key]);
    } else {
      // Not in Chinese map; check if it's already INCI (uppercase, contains letters)
      // Keep as-is (might be INCI or unknown)
      translated.push(ing);
      unknown.push(ing);
    }
  }
  return { translated, unknown };
}

/**
 * Translate INCI name to Chinese (for display purposes).
 * When lang=zh, show "视黄醇" instead of "RETINOL".
 *
 * @param {string} inci
 * @returns {string} Chinese name if found, else original
 */
export function inciToChinese(inci) {
  if (!inci) return inci;
  const map = loadInciToZh();
  const key = String(inci).trim().toUpperCase();
  const list = map[key];
  if (list && list.length > 0) return list[0]; // Return first (most common) Chinese name
  return inci;
}
