// lib/json_io.js — 安全的 JSON 读取 (去 BOM / 容错)
//
// 背景: Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会在文件开头写
// UTF-8 BOM (EF BB BF)。Node 的 JSON.parse 遇到 BOM 会直接抛
// "Unexpected token \uFEFF", 表现为整个数据文件"神秘消失"。
// 所有读本地 JSON 的地方都走这里。

import fs from "node:fs";
import path from "node:path";

export function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[json_io] failed to read ${filePath}: ${e.message}`);
    return null;
  }
}

// 在若干候选路径里找到第一个可解析的 JSON
export function readJsonFirst(candidates) {
  for (const fp of candidates) {
    const j = readJsonSafe(fp);
    if (j) return j;
  }
  return null;
}

export function dataPath(name) {
  return [
    path.join(process.cwd(), "data", name),
    path.join(process.cwd(), "..", "data", name),
  ];
}
