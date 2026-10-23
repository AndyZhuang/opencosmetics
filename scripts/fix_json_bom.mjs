// scripts/fix_json_bom.mjs — 去掉 data/*.json 的 UTF-8 BOM, 并校验可解析
// Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 BOM, 导致 JSON.parse 失败。
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
let fixed = 0, checked = 0;

for (const f of files) {
  const fp = path.join(dir, f);
  const buf = fs.readFileSync(fp);
  const hadBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  try {
    JSON.parse(text);
    checked++;
  } catch (e) {
    console.log(`SKIP (not valid JSON) ${f}: ${e.message}`);
    continue;
  }
  if (hadBom) {
    fs.writeFileSync(fp, text, "utf8");
    console.log(`FIXED BOM: ${f}`);
    fixed++;
  } else {
    console.log(`ok: ${f}`);
  }
}
console.log(`\nchecked=${checked} fixed=${fixed}`);
