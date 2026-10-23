#!/usr/bin/env node
/**
 * apps/taro/scripts/fix-scss-imports.mjs — 给 @use / @forward 的路径补上 .scss 扩展名
 * ============================================================================
 * 为什么需要:
 *   Taro 的 RN 样式转换器 (@tarojs/rn-style-transformer) 用 dart-sass 的 **legacy render API**
 *   编译样式, 且刻意不传 `file` 选项 (源码里注释写着 "with file option, dart-sass importer
 *   donot execute")。于是:
 *     - sass 的 import 基准目录只能由转换器自己猜 (basedir = 当前 scss 文件所在目录);
 *     - 找不到扩展名时它只会在 ['.rn', '', ''] 里找, 找不到 'xxx.scss'。
 *   结果: `@use "../../styles/pages"` 在 RN 下必然报
 *     "样式文件没有找到，请检查文件路径: styles/pages"。
 *
 *   小程序 / H5 走 webpack 的 sass-loader，基准目录由 loader 自己处理，写不写扩展名都行，
 *   但统一写上扩展名对三端都安全 (Sass 官方推荐显式扩展名)。
 *
 * 幂等: 已带 .scss 的不会重复追加。
 *
 * 用法: node scripts/fix-scss-imports.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '..', 'src');

const SCSS_EXTS = ['.scss', '.sass'];

let changed = 0;
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fp);
      continue;
    }
    if (!fp.endsWith('.scss') && !fp.endsWith('.sass')) continue;
    scanned++;
    const original = fs.readFileSync(fp, 'utf8');
    const next = original.replace(
      /(@(?:use|forward)\s+['"])([^'"]+)(['"])/g,
      (all, head, target, tail) => {
        if (SCSS_EXTS.some((e) => target.endsWith(e))) return all;
        return `${head}${target}.scss${tail}`;
      }
    );
    if (next !== original) {
      fs.writeFileSync(fp, next, 'utf8');
      changed++;
      console.log(`  + ${path.relative(path.resolve(__dirname, '..'), fp)}`);
    }
  }
}

walk(srcRoot);
console.log(`\nscanned ${scanned} files, changed ${changed}`);
