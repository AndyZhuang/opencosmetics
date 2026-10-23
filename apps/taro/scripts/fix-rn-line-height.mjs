#!/usr/bin/env node
/**
 * apps/taro/scripts/fix-rn-line-height.mjs — 把无单位 line-height 改成带单位
 * ============================================================================
 * 为什么需要:
 *   RN 的 lineHeight 是**绝对像素**, 没有倍数值语义。
 *   CSS 里写 `line-height: 1.5` 在 RN 会被转成 lineHeight: 1.5 (≈1.5px),
 *   行高直接塌掉 —— 视觉上就是所有文字挤成一行。
 *   Taro 的 RN stylelint 规则 (taro-rn/line-height-no-value-without-unit)
 *   也会对无单位值报警告。
 *
 *   做法: 用 SCSS 的乘法把倍数换算成绝对值, 例如
 *     font-size: $fs-body;      /* 28px = 14pt * /
 *     line-height: 1.5;         ->  line-height: 1.5 * $fs-body;   /* 42px * /
 *   这样字号改了行高自动跟着走, 三端 (weapp/h5 的 CSS 也认 px) 表现一致。
 *
 * 幂等: 已经带单位的不会被再次处理。
 *
 * 用法: node scripts/fix-rn-line-height.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '..', 'src');

let changed = 0;
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fp);
      continue;
    }
    if (!fp.endsWith('.scss')) continue;
    scanned++;
    const original = fs.readFileSync(fp, 'utf8');
    const lines = original.split('\n');
    let lastFontSize = null;
    let touched = false;
    for (let i = 0; i < lines.length; i++) {
      const fsMatch = lines[i].match(/font-size:\s*\$([a-z0-9-]+)\s*;/i);
      if (fsMatch) {
        lastFontSize = fsMatch[1];
        continue;
      }
      const lhMatch = lines[i].match(/^(\s*line-height:\s*)([0-9]*\.?[0-9]+)\s*;\s*$/);
      if (!lhMatch) continue;
      if (!lastFontSize) {
        console.warn(`  ! ${path.relative(srcRoot, fp)}:${i + 1} 无单位 line-height 但同规则内没有 font-size token, 跳过`);
        continue;
      }
      lines[i] = `${lhMatch[1]}${lhMatch[2]} * $${lastFontSize};`;
      touched = true;
    }
    if (touched) {
      fs.writeFileSync(fp, lines.join('\n'), 'utf8');
      changed++;
      console.log(`  + ${path.relative(srcRoot, fp)}`);
    }
  }
}

walk(srcRoot);
console.log(`\nscanned ${scanned} files, changed ${changed}`);
