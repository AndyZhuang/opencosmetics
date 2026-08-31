// DuckDB singleton with persistent connection for Next.js API routes.
// Server-only — never import in client components.
import { DuckDBInstance } from "@duckdb/node-api";
import path from "node:path";
import fs from "node:fs";

let _conn = null;
let _initPromise = null;
let _v4Tables = null;
let _rules = null;
let _companies = null;

async function init() {
  if (_conn) return _conn;
  // Try v4 first, fallback to v3
  // CWD is D:/minimax/serverM/opencosmetics (when running `npx next start`)
  // Try local data/ first, then ../bebd_sample
  const localV4 = path.join(process.cwd(), "data", "bebd.duckdb");
  const localV3 = path.join(process.cwd(), "data", "bebd_v3.duckdb");
  const siblingV4 = path.join(process.cwd(), "..", "bebd_sample", "bebd_v4.duckdb");
  const siblingV3 = path.join(process.cwd(), "..", "bebd_sample", "bebd_v3.duckdb");
  let dbPath = [localV4, localV3, siblingV4, siblingV3].find(p => fs.existsSync(p));
  if (!dbPath) throw new Error("No DuckDB file found in data/ or ../bebd_sample/");
  console.log("[db] opening", dbPath);
  const inst = await DuckDBInstance.create(dbPath);
  const conn = await inst.connect();
  _conn = conn;
  return conn;
}

async function ensure() {
  if (_conn) return _conn;
  if (!_initPromise) _initPromise = init();
  return _initPromise;
}

export async function query(sql, params = []) {
  const conn = await ensure();
  const stmt = await conn.prepare(sql);
  try {
    if (params.length) await stmt.bind(params);
    const reader = await stmt.runAndReadAll();
    const rows = reader.getRows();
    const cols = reader.columnNames();
    return rows.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
  } finally {
    if (typeof stmt.dispose === "function") await stmt.dispose();
    else if (typeof stmt.release === "function") await stmt.release();
    else if (typeof stmt.close === "function") await stmt.close();
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

// =====================================================================
// Static JSON loaders (companies.json + rules.json)
// =====================================================================
export function loadCompanies() {
  if (_companies) return _companies;
  const candidates = [
    path.join(process.cwd(), "data", "companies.json"),
    path.join(process.cwd(), "..", "data", "companies.json"),
  ];
  const fp = candidates.find(p => fs.existsSync(p));
  if (!fp) return null;
  _companies = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return _companies;
}

export function loadRules() {
  if (_rules) return _rules;
  const candidates = [
    path.join(process.cwd(), "data", "rules.json"),
    path.join(process.cwd(), "..", "data", "rules.json"),
  ];
  const fp = candidates.find(p => fs.existsSync(p));
  if (!fp) return null;
  _rules = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return _rules;
}

// =====================================================================
// Risk engine (pure function on rules + ingredients)
// Bilingual: pass lang="zh"|"en"|"both" (default: both) to localize fields
// =====================================================================
function pickL10n(value, lang = "both") {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value === "object" && ("zh" in value || "en" in value)) {
    if (lang === "en") return value.en ?? value.zh ?? "";
    if (lang === "zh") return value.zh ?? value.en ?? "";
    // both: show both if they differ
    const z = value.zh ?? "";
    const e = value.en ?? "";
    if (!z) return e;
    if (!e || z === e) return z;
    return `${z} / ${e}`;
  }
  if (Array.isArray(value)) {
    return value.map(v => pickL10n(v, lang));
  }
  return value;
}

export function checkFormulaRisk(ingredients, context = {}) {
  const rules = loadRules();
  if (!rules) return { error: "rules.json not loaded" };
  const ingSet = new Set(ingredients.map(i => (i || "").toUpperCase().trim()));
  const lang = context.lang || "both";
  const findings = [];
  // Compatibility
  for (const r of rules.rule_categories.compatibility.rules) {
    const overlap = r.ingredients.filter(i => ingSet.has(i.toUpperCase()));
    if (overlap.length >= 2) {
      const localized = { ...r };
      if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
      if (r.alternatives) localized.alternatives = pickL10n(r.alternatives, lang);
      if (r.context) localized.context = pickL10n(r.context, lang);
      findings.push({ category: "compatibility", ...localized, matched: overlap });
    }
  }
  // Special populations
  const pop = context.population || "adult";
  if (rules.rule_categories.special_populations) {
    for (const r of rules.rule_categories.special_populations.rules) {
      // Context match (use zh if present, fall back to en)
      const ctxStr = r.context ? pickL10n(r.context, "zh") : null;
      if (ctxStr && !ctxStr.includes(pop)) continue;
      const matched = r.ingredients ? r.ingredients.filter(i => ingSet.has(i.toUpperCase())) : [];
      if (matched.length > 0) {
        const localized = { ...r };
        if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
        if (r.context) localized.context = pickL10n(r.context, lang);
        findings.push({ category: "special_population", ...localized, matched });
      }
    }
  }
  // Concentration
  if (rules.rule_categories.concentration_limits) {
    for (const r of rules.rule_categories.concentration_limits.rules) {
      if (ingSet.has(r.ingredient.toUpperCase())) {
        const localized = { ...r };
        if (r.note) localized.note = pickL10n(r.note, lang);
        if (r.label) localized.label = pickL10n(r.label, lang);
        findings.push({ category: "concentration", ...localized, matched: [r.ingredient] });
      }
    }
  }
  // Regulatory region
  if (rules.rule_categories.regulatory_region) {
    for (const r of rules.rule_categories.regulatory_region.rules) {
      if (context.region && r.region && r.region !== context.region) continue;
      // No ingredient match needed for region — but we should only surface if user has relevant ingredient
      const localized = { ...r };
      if (r.status) localized.status = pickL10n(r.status, lang);
      findings.push({ category: "regulatory", ...localized });
    }
  }
  // Synbio
  if (rules.rule_categories.synbio_collagen) {
    for (const r of rules.rule_categories.synbio_collagen.rules) {
      const localized = { ...r };
      if (r.label_requirement) localized.label_requirement = pickL10n(r.label_requirement, lang);
      findings.push({ category: "synbio", ...localized });
    }
  }
  // FDA
  if (rules.rule_categories.fda_event_red_flags) {
    for (const r of rules.rule_categories.fda_event_red_flags.rules) {
      const localized = { ...r };
      if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
      findings.push({ category: "fda_event", ...localized });
    }
  }
  const block = findings.filter(f => f.severity === "block").length;
  const warn = findings.filter(f => f.severity === "warn").length;
  return {
    ingredients: [...ingSet],
    context,
    block_count: block,
    warn_count: warn,
    findings,
    summary: block > 0 ? "REJECT" : (warn > 0 ? "REVIEW" : "PASS"),
    lang,
  };
}
