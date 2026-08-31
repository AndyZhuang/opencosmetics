// DuckDB singleton with persistent connection for Next.js API routes.
// Server-only — never import in client components.
import { DuckDBInstance } from "@duckdb/node-api";
import path from "node:path";

let _conn = null;
let _initPromise = null;

async function init() {
  if (_conn) return _conn;
  const dbPath = path.join(process.cwd(), "..", "bebd_sample", "bebd_v3.duckdb");
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
