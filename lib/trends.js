// lib/trends.js — Industry trends feed
// Scaffold for future automated trend collection

import fs from "node:fs";
import path from "node:path";

let _trends = null;
let _meta = null;

function load() {
  if (_trends && _meta) return { trends: _trends, meta: _meta };
  const candidates = [
    path.join(process.cwd(), "data", "trends.json"),
    path.join(process.cwd(), "..", "data", "trends.json"),
  ];
  const fp = candidates.find(p => fs.existsSync(p));
  if (!fp) return { trends: [], meta: {} };
  const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
  _trends = data.trends || [];
  _meta = {
    version: data.version,
    last_updated: data.last_updated,
    note: data.note,
  };
  return { trends: _trends, meta: _meta };
}

export function listTrends() {
  return load().trends;
}

export function getTrend(id) {
  return load().trends.find(t => t.id === id);
}

export function getTrendsMeta() {
  return load().meta;
}

export function getTrendActivesSummary() {
  const all = load().trends;
  const byInci = {};
  for (const trend of all) {
    for (const ai of trend.active_ingredients || []) {
      const key = ai.inci;
      if (!byInci[key]) {
        byInci[key] = { inci: key, mentions: 0, trends: [], max_growth: "0%" };
      }
      byInci[key].mentions++;
      byInci[key].trends.push(trend.id);
      // Keep highest growth
      const g = parseInt(ai.growth.replace(/[^-\d]/g, "")) || 0;
      const maxG = parseInt(byInci[key].max_growth.replace(/[^-\d]/g, "")) || 0;
      if (Math.abs(g) > Math.abs(maxG)) byInci[key].max_growth = ai.growth;
    }
  }
  return Object.values(byInci).sort((a, b) => b.mentions - a.mentions);
}
