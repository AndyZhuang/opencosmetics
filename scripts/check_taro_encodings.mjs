// scripts/check_taro_encodings.mjs — 校验 apps/taro 源码的编码 (BOM / UTF-8 合法性)
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || "apps/taro/src";
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".scss", ".css", ".json", ".html"]);

let bad = 0;
let files = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".swc") continue;
      walk(fp);
      continue;
    }
    if (!exts.has(path.extname(entry.name))) continue;
    files++;
    const buf = fs.readFileSync(fp);
    const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    const text = buf.toString("utf8");
    // 检测替换字符 U+FFFD (真实乱码)
    const hasReplacement = text.includes("\uFFFD");
    // 抽几个常见中文 token 验证
    const zhOk = /[\u4e00-\u9fa5]/.test(text) || !/[^\x00-\x7f]/.test(text);
    if (hasBom || hasReplacement) {
      bad++;
      console.log(
        `BAD  ${fp}${hasBom ? "  [BOM]" : ""}${hasReplacement ? "  [U+FFFD]" : ""}${zhOk ? "" : "  [no-CJK]"}`
      );
    }
  }
}

walk(root);
console.log(`\nchecked ${files} files, bad=${bad}`);
process.exit(bad ? 1 : 0);
