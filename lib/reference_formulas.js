// lib/reference_formulas.js — Curated reference formulas library
// 20 classic commercial formulas for formulator reference

import fs from "node:fs";
import path from "node:path";

let _formulas = null;

function load() {
  if (_formulas) return _formulas;
  const candidates = [
    path.join(process.cwd(), "data", "reference_formulas.json"),
    path.join(process.cwd(), "..", "data", "reference_formulas.json"),
  ];
  const fp = candidates.find(p => fs.existsSync(p));
  if (!fp) return [];
  _formulas = JSON.parse(fs.readFileSync(fp, "utf-8")).formulas || [];
  return _formulas;
}

export function listReferenceFormulas() {
  return load().map(f => ({
    id: f.id,
    name_zh: f.name_zh,
    name_en: f.name_en,
    brand: f.brand,
    year: f.year,
    category: f.category,
    category_en: f.category_en,
    tag: f.tag,
    price_tier: f.price_tier,
    actives_count: f.key_actives?.length || 0,
  }));
}

export function getReferenceFormula(id) {
  return load().find(f => f.id === id);
}

export function searchReferenceFormulas(query) {
  const all = load();
  if (!query) return all;
  const lower = String(query).toLowerCase();
  return all.filter(f => {
    return (
      f.name_zh?.toLowerCase().includes(lower) ||
      f.name_en?.toLowerCase().includes(lower) ||
      f.brand?.toLowerCase().includes(lower) ||
      f.tag?.toLowerCase().includes(lower) ||
      f.inci?.toLowerCase().includes(lower) ||
      f.key_actives?.some(a => a.toLowerCase().includes(lower))
    );
  });
}

export function filterByCategory(category) {
  return load().filter(f => f.category === category || f.category_en === category);
}

export function filterByPriceTier(tier) {
  return load().filter(f => f.price_tier === tier);
}
