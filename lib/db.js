// DuckDB singleton with persistent connection for Next.js API routes.
// Server-only — never import in client components.
//
// ── 三层防锁设计 (Windows 上 DuckDB 单写锁) ──────────────────────────────
// 1) @duckdb/node-api 在 next.config.js 的 serverExternalPackages 里,
//    不会被 webpack 打包 → 它的模块级实例缓存能跨 Next dev 热重载存活。
// 2) 再叠一层 globalThis 缓存连接, 覆盖"同一进程不同模块实例"的场景。
// 3) 以 READ_ONLY 打开, 允许本机 dev worker / next start / 脚本多进程并发读。
// 本项目只读不写, 无功能损失。
import { DuckDBInstance, DuckDBInstanceCache } from "@duckdb/node-api";
import path from "node:path";
import fs from "node:fs";
import { readJsonFirst, dataPath } from "./json_io";
import { estimatePh, inferProductContext, phContextApplies } from "./ph_estimate";
import { matchRuleIngredient, matchRulePair } from "./rule_aliases";

const G = /** @type {any} */ (globalThis);
const DB_KEY = "__opencosmetics_db_state__";

function state() {
  if (!G[DB_KEY]) G[DB_KEY] = { conn: null, initPromise: null, rules: null, companies: null };
  return G[DB_KEY];
}

function resolveDbPath() {
  const localV4 = path.join(process.cwd(), "data", "bebd.duckdb");
  const localV3 = path.join(process.cwd(), "data", "bebd_v3.duckdb");
  const siblingV4 = path.join(process.cwd(), "..", "bebd_sample", "bebd_v4.duckdb");
  const siblingV3 = path.join(process.cwd(), "..", "bebd_sample", "bebd_v3.duckdb");
  const found = [localV4, localV3, siblingV4, siblingV3].find((p) => fs.existsSync(p));
  if (!found) throw new Error("No DuckDB file found in data/ or ../bebd_sample/");
  return found;
}

async function openWithRetry(dbPath, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      // 走 node-api 自身的实例缓存: 该包在 webpack 之外, 缓存可跨 HMR 存活
      return await DuckDBInstanceCache.singleton.getOrCreateInstance(dbPath, {
        access_mode: "READ_ONLY",
      });
    } catch (e) {
      lastErr = e;
      // 若已被同进程旧实例占用, 退回直接 create (新实例)
      try {
        return await DuckDBInstance.create(dbPath, { access_mode: "READ_ONLY" });
      } catch (e2) {
        lastErr = e2;
      }
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function init() {
  const st = state();
  if (st.conn) return st.conn;
  const dbPath = resolveDbPath();
  console.log("[db] opening (read-only)", dbPath);
  const inst = await openWithRetry(dbPath);
  const conn = await inst.connect();
  st.conn = conn;
  return conn;
}

async function ensure() {
  const st = state();
  if (st.conn) return st.conn;
  if (!st.initPromise) {
    st.initPromise = init().catch((e) => {
      // 失败后清掉 promise, 允许下次重试
      st.initPromise = null;
      throw e;
    });
  }
  return st.initPromise;
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
  const st = state();
  if (st.companies) return st.companies;
  const j = readJsonFirst(dataPath("companies.json"));
  if (!j) return null;
  st.companies = j;
  return st.companies;
}

export function loadRules() {
  const st = state();
  if (st.rules) return st.rules;
  const j = readJsonFirst(dataPath("rules.json"));
  if (!j) return null;
  st.rules = j;
  return st.rules;
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

// =====================================================================
// 规则成分匹配 —— 委托给 lib/rule_aliases.js
// 区域法规 / 合成生物 / FDA 三类规则的 ingredient 字段写的是"类目"而非精确
// INCI (例: TALC_BASED_POWDER, RETINOIC_ACID, VITAMIN_C), 需要别名 + 模糊匹配。
// 关键修正: 这三类规则**只在配方真的含有对应成分时才下发**, 否则任何配方
// 都会凭空多出 4~8 条命中, 直接毁掉风险审查的可信度。
// =====================================================================

/** 规则没有 severity 字段时按语义推断 */
function inferSeverity(rule) {
  if (rule.severity) return rule.severity;
  const s = pickL10n(rule.status || rule.label_requirement || rule.note || rule.label || "", "zh");
  const t = String(s);
  if (/禁用|不得|禁/.test(t)) return "block";
  if (/限用|限量|注意|标注/.test(t)) return "warn";
  return "info";
}

/** 人群匹配: 规则 context 指明了适用人群时, 只有该人群才命中 */
function populationApplies(ruleContext, population) {
  const ctx = String(ruleContext || "");
  if (/孕妇|妊娠|备孕/.test(ctx)) return population === "pregnant";
  if (/儿童|婴幼儿/.test(ctx)) return population === "child";
  if (/敏感肌/.test(ctx)) return population === "sensitive";
  return true;
}

/** 说明文案回退链: rationale → label_requirement → status → note → label → source */
function ruleText(rule, lang) {
  for (const k of ["rationale", "label_requirement", "status", "note", "label", "requirement"]) {
    if (rule[k] != null) return pickL10n(rule[k], lang);
  }
  if (rule.leave_on_max_pct != null) {
    return `驻留上限 ${rule.leave_on_max_pct}% / 淋洗上限 ${rule.rinse_off_max_pct ?? "—"}%`;
  }
  if (rule.pH_min != null) return `允许 pH ${rule.pH_min}–${rule.pH_max}`;
  if (rule.event_count_2024 != null) return `2024 年 ${rule.event_count_2024} 起事件`;
  return null;
}

export function checkFormulaRisk(ingredients, context = {}) {
  const rules = loadRules();
  if (!rules) return { error: "rules.json not loaded" };
  const ingSet = new Set(ingredients.map((i) => (i || "").toUpperCase().trim()));
  const lang = context.lang || "both";
  const pop = context.population || "adult";
  const findings = [];

  // ---- 兼容性 (简写成分名经别名层映射到真实 INCI) ----
  for (const r of rules.rule_categories.compatibility.rules) {
    // 带人群 context 的规则 (如 COMP-014 孕妇) 只对对应人群生效
    if (r.context && !populationApplies(pickL10n(r.context, "zh"), pop)) continue;
    const hits = matchRulePair(r.ingredients, ingSet);
    if (hits.length >= 2) {
      const localized = { ...r };
      if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
      if (r.alternatives) localized.alternatives = pickL10n(r.alternatives, lang);
      if (r.context) localized.context = pickL10n(r.context, lang);
      findings.push({
        category: "compatibility",
        ...localized,
        matched: hits.map((h) => h.matched),
        matched_map: hits,
      });
    }
  }

  // ---- 特殊人群 ----
  if (rules.rule_categories.special_populations) {
    for (const r of rules.rule_categories.special_populations.rules) {
      if (!populationApplies(pickL10n(r.context, "zh"), pop)) continue;
      const matched = r.ingredients ? r.ingredients.filter((i) => ingSet.has(i.toUpperCase())) : [];
      if (matched.length > 0) {
        const localized = { ...r };
        if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
        if (r.context) localized.context = pickL10n(r.context, lang);
        findings.push({ category: "special_population", ...localized, matched });
      }
    }
  }

  // ---- 浓度上限 ----
  if (rules.rule_categories.concentration_limits) {
    for (const r of rules.rule_categories.concentration_limits.rules) {
      const hit = matchRuleIngredient(r.ingredient, ingSet);
      if (!hit) continue;
      const localized = { ...r };
      if (r.note) localized.note = pickL10n(r.note, lang);
      if (r.label) localized.label = pickL10n(r.label, lang);
      findings.push({
        category: "concentration",
        ...localized,
        severity: inferSeverity(r),
        matched: [hit],
      });
    }
  }

  // ---- 区域法规 (成分门控) ----
  if (rules.rule_categories.regulatory_region) {
    for (const r of rules.rule_categories.regulatory_region.rules) {
      if (context.region && r.region && r.region !== context.region) continue;
      const hit = matchRuleIngredient(r.ingredient, ingSet);
      if (!hit) continue;
      const localized = { ...r };
      if (r.status) localized.status = pickL10n(r.status, lang);
      findings.push({
        category: "regulatory",
        ...localized,
        severity: inferSeverity(r),
        matched: [hit],
      });
    }
  }

  // ---- 合成生物 (成分门控) ----
  if (rules.rule_categories.synbio_collagen) {
    for (const r of rules.rule_categories.synbio_collagen.rules) {
      const hit = matchRuleIngredient(r.ingredient, ingSet);
      if (!hit) continue;
      const localized = { ...r };
      if (r.label_requirement) localized.label_requirement = pickL10n(r.label_requirement, lang);
      findings.push({
        category: "synbio",
        ...localized,
        severity: inferSeverity(r),
        matched: [hit],
      });
    }
  }

  // ---- FDA 事件红旗 (成分门控) ----
  if (rules.rule_categories.fda_event_red_flags) {
    for (const r of rules.rule_categories.fda_event_red_flags.rules) {
      const hit = matchRuleIngredient(r.ingredient, ingSet);
      if (!hit) continue;
      const localized = { ...r };
      if (r.rationale) localized.rationale = pickL10n(r.rationale, lang);
      findings.push({
        category: "fda_event",
        ...localized,
        severity: inferSeverity(r),
        matched: [hit],
      });
    }
  }

  // ---- pH 安全 ----
  // 规则分两族:
  //   A) 人群/品类 pH 允许区间 (pH_min / pH_max)  —— PH-001..005
  //   B) 活性物 pH 有效窗口 (pH_required_min / pH_required_max + ingredient) —— PH-006..008
  let phReport = null;
  if (rules.rule_categories.ph_safety) {
    const productCtx = context.product_context || inferProductContext(ingredients);
    const estimated = estimatePh(ingredients);
    const hasMeasuredPh = context.pH != null && Number.isFinite(Number(context.pH));
    const ph = hasMeasuredPh ? Number(context.pH) : estimated.ph;
    phReport = {
      ph,
      estimated_ph: estimated.ph,
      confidence: estimated.confidence,
      basis: estimated.basis,
      note_zh: estimated.note_zh,
      product_context: productCtx.kind,
      product_context_zh: productCtx.label_zh,
    };

    const all = rules.rule_categories.ph_safety.rules;

    // A) 允许区间
    const limitRules = all.filter(
      (r) => r.pH_min != null || r.pH_max != null
    );
    const applicable = limitRules.filter((r) =>
      phContextApplies(pickL10n(r.context, "zh"), { productKind: productCtx.kind, population: pop })
    );

    if (ph == null) {
      if (applicable.length) {
        findings.push({
          category: "ph_safety",
          id: "PH-000",
          severity: "info",
          needs_measurement: true,
          context: pickL10n(applicable[0].context, lang),
          rationale:
            lang === "en"
              ? `${applicable.length} pH limit rule(s) applicable but pH cannot be estimated (acid+base buffer). Measure pH to verify.`
              : `适用 ${applicable.length} 条 pH 区间规则, 但配方酸碱共存无法估算 pH, 需实测后核对。`,
          matched: [],
        });
      }
    } else {
      for (const r of applicable) {
        const lo = r.pH_min ?? -Infinity;
        const hi = r.pH_max ?? Infinity;
        if (ph >= lo && ph <= hi) continue;
        // 只有用户提供的实测 pH 才按规则原severity 阻断; 估算值降级为警告
        const sev = hasMeasuredPh ? (r.severity || "block") : (r.severity === "block" ? "warn" : r.severity || "warn");
        const tail = hasMeasuredPh ? "" : " (估算值, 以实测 pH 为准)";
        findings.push({
          category: "ph_safety",
          ...r,
          severity: sev,
          estimated: !hasMeasuredPh,
          rationale:
            lang === "en"
              ? `Estimated pH ${ph} is outside the allowed range ${r.pH_min ?? "−∞"}–${r.pH_max ?? "+∞"}.${tail}`
              : `估算 pH ${ph} 超出允许区间 ${r.pH_min ?? "−∞"}–${r.pH_max ?? "+∞"}。${tail}`,
          matched: [],
        });
      }
    }

    // B) 活性物 pH 有效窗口
    const activeRules = all.filter(
      (r) => r.pH_required_min != null || r.pH_required_max != null
    );
    for (const r of activeRules) {
      const hit = matchRuleIngredient(r.ingredient, ingSet);
      if (!hit) continue;
      if (ph == null) {
        findings.push({
          category: "ph_safety",
          ...r,
          severity: "info",
          needs_measurement: true,
          rationale:
            lang === "en"
              ? `${hit} present; effective window pH ${r.pH_required_min}–${r.pH_required_max} cannot be verified without a measured pH.`
              : `配方含 ${hit}, 有效 pH 窗口 ${r.pH_required_min}–${r.pH_required_max} 需实测 pH 后核对。`,
          matched: [hit],
        });
        continue;
      }
      const lo = r.pH_required_min ?? -Infinity;
      const hi = r.pH_required_max ?? Infinity;
      if (ph >= lo && ph <= hi) continue;
      const sev = hasMeasuredPh ? (r.severity || "warn") : (r.severity === "block" ? "warn" : r.severity || "warn");
      const tail = hasMeasuredPh ? "" : " (估算值, 以实测 pH 为准)";
      findings.push({
        category: "ph_safety",
        ...r,
        severity: sev,
        estimated: !hasMeasuredPh,
        rationale:
          lang === "en"
            ? `${hit} present; estimated pH ${ph} is outside the effective window ${r.pH_required_min}–${r.pH_required_max}.${tail}`
            : `配方含 ${hit}, 估算 pH ${ph} 不在有效窗口 ${r.pH_required_min}–${r.pH_required_max} 内, 会影响活性或稳定性。${tail}`,
        matched: [hit],
      });
    }
  }

  const block = findings.filter((f) => f.severity === "block").length;
  const warn = findings.filter((f) => f.severity === "warn").length;
  const info = findings.filter((f) => f.severity === "info" || !f.severity).length;
  return {
    ingredients: [...ingSet],
    context,
    block_count: block,
    warn_count: warn,
    info_count: info,
    ph_report: phReport,
    findings,
    summary: block > 0 ? "REJECT" : (warn > 0 ? "REVIEW" : "PASS"),
    lang,
  };
}
