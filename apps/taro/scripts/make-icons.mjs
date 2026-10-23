#!/usr/bin/env node
/**
 * apps/taro/scripts/make-icons.mjs — 配方引擎 FormulaLab 应用图标生成器
 * ============================================================================
 * 为什么需要这个脚本:
 *   1. RN 官方模板的 iOS AppIcon.appiconset 里 **一张图都没有** (只有 Contents.json),
 *      编译出来连 Assets.car 都没有 —— 提交 App Store 会因为缺 1024×1024 图标被拒。
 *   2. Android 侧是 RN 默认的绿色机器人 logo, 和「配方引擎」品牌完全不搭。
 *   3. `setup-native.js` 会用 `rmrf + copyDir` **整体重建** android/ 和 ios/,
 *      所以图标不能手工放进原生目录 —— 必须在生成原生外壳的同时注入。
 *
 * 所以: 图标由脚本现画, 不依赖任何图形库。
 *   - 纯 Node (只用内置 zlib 做 PNG 的 deflate), 不装 sharp / canvas
 *   - 自己实现 PNG 编码 (IHDR + IDAT + IEND + CRC32)
 *   - 通用多边形扫描线光栅化 (even-odd 填充) + 超采样抗锯齿
 *
 * 设计:
 *   深墨蓝 → 靛紫 → 品红 → 玫瑰 的对角渐变底,
 *   中间一枚白色水滴 (化妆品直觉), 水滴里嵌一个三节点分子结构 (配方/化学直觉)。
 *   水滴 = 大圆 + 顶端小圆的**凸包** (两圆外公切线相连), 圆头不尖角。
 *
 * 用法:
 *   node scripts/make-icons.mjs                 # 画到 ../ios 与 ../android (存在才画)
 *   node scripts/make-icons.mjs --out <dir>    # 只导出预览图到指定目录
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// PNG 编码 (无依赖)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

/** colorType: 6 = RGBA, 2 = RGB (iOS 图标不允许带 alpha 通道) */
function encodePNG(width, height, rgba, colorType = 6) {
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      const d = y * (stride + 1) + 1 + x * channels;
      raw[d] = rgba[s];
      raw[d + 1] = rgba[s + 1];
      raw[d + 2] = rgba[s + 2];
      if (channels === 4) raw[d + 3] = rgba[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// 通用多边形光栅化 (even-odd 扫描线填充)
// ---------------------------------------------------------------------------
/**
 * 把多边形填进一张 W×H 的 0/1 掩膜。
 * @param {Uint8Array} mask
 * @param {Array<[number,number]>} pts  闭合多边形顶点 (像素坐标)
 */
function fillPolygon(mask, W, H, pts) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(H - 1, Math.ceil(maxY));
  const xs = [];
  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5;
    xs.length = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ay = a[1];
      const by = b[1];
      if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) {
        const t = (sy - ay) / (by - ay);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k] - 0.5));
      const xb = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = xa; x <= xb; x++) mask[y * W + x] = 1;
    }
  }
}

const circlePoly = (cx, cy, r, steps = 96) => {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};

const roundedRectPoly = (x0, y0, x1, y1, r, steps = 24) => {
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(x1 - r, y0 + r, -Math.PI / 2);
  corner(x1 - r, y1 - r, 0);
  corner(x0 + r, y1 - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  return pts;
};

/**
 * 两圆的凸包 —— 得到一个圆头水滴。
 * 大圆在下, 小圆在上, 两条外公切线相连。
 */
function convexHullTwoCircles(c1, r1, c2, r2, steps = 96) {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  const theta = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));
  const a1 = theta + alpha; // 右侧切点角
  const a2 = theta - alpha; // 左侧切点角

  const pts = [];
  // 大圆: 从 a1 逆时针(角度递增)绕到底部再到 a2+2π
  for (let i = 0; i <= steps; i++) {
    const a = a1 + ((a2 + Math.PI * 2 - a1) * i) / steps;
    pts.push([c1[0] + r1 * Math.cos(a), c1[1] + r1 * Math.sin(a)]);
  }
  // 小圆: 从 a2 绕到 a1 (经过顶点方向 theta)
  for (let i = 0; i <= steps; i++) {
    const a = a2 + ((a1 - a2) * i) / steps;
    pts.push([c2[0] + r2 * Math.cos(a), c2[1] + r2 * Math.sin(a)]);
  }
  return pts;
}

/** 粗线段 -> 四边形 */
const thickSegmentPoly = (ax, ay, bx, by, half) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * half;
  const ny = (dx / len) * half;
  return [
    [ax + nx, ay + ny],
    [bx + nx, by + ny],
    [bx - nx, by - ny],
    [ax - nx, ay - ny],
  ];
};

// ---------------------------------------------------------------------------
// 图标设计 (归一化坐标 0..1, y 轴向下)
// ---------------------------------------------------------------------------
const DROP_BIG = { c: [0.5, 0.638], r: 0.216 };
const DROP_TIP = { c: [0.5, 0.168], r: 0.028 };

const NODES = {
  n0: { x: 0.5, y: 0.603, r: 0.043 },
  n1: { x: 0.5 - 0.104, y: 0.697, r: 0.032 },
  n2: { x: 0.5 + 0.104, y: 0.697, r: 0.032 },
};
const BOND_HALF = 0.0135;

const STOPS = [
  { t: 0.0, c: [12, 17, 48] },
  { t: 0.42, c: [59, 44, 143] },
  { t: 0.74, c: [142, 53, 151] },
  { t: 1.0, c: [224, 101, 127] },
];

const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function gradientAt(t) {
  t = clamp01(t);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (t <= b.t) {
      const k = (t - a.t) / (b.t - a.t || 1);
      return [
        Math.round(mix(a.c[0], b.c[0], k)),
        Math.round(mix(a.c[1], b.c[1], k)),
        Math.round(mix(a.c[2], b.c[2], k)),
      ];
    }
  }
  return STOPS[STOPS.length - 1].c;
}

const GLOW = { x: 0.82, y: 0.14, r: 0.68, strength: 0.16 };

/**
 * variant:
 *   'square'  全出血正方形, 不透明 (iOS —— 系统自己切圆角)
 *   'rounded' 圆角方块, 角外透明 (Android 传统 ic_launcher)
 *   'circle'  圆形, 角外透明 (Android ic_launcher_round)
 */
function renderIcon(size, variant) {
  const SS = size <= 256 ? 4 : 2;
  const W = size * SS;
  const H = W;

  const designScale = variant === 'circle' ? 0.88 : variant === 'rounded' ? 0.96 : 1.0;
  const S = (v) => v * W; // 归一化 -> 设备像素

  // ---- 形状掩膜 ----
  const maskBg = new Uint8Array(W * H);
  const maskDrop = new Uint8Array(W * H);
  const maskMol = new Uint8Array(W * H);

  if (variant === 'square') {
    maskBg.fill(1);
  } else if (variant === 'circle') {
    fillPolygon(maskBg, W, H, circlePoly(W / 2, H / 2, W / 2, 256));
  } else {
    const r = 0.222 * W;
    fillPolygon(maskBg, W, H, roundedRectPoly(0, 0, W, H, r, 32));
  }

  // 水滴 (大圆 + 圆头小圆的凸包)
  const dropPoly = convexHullTwoCircles(
    [S(DROP_BIG.c[0]), S(DROP_BIG.c[1])],
    S(DROP_BIG.r),
    [S(DROP_TIP.c[0]), S(DROP_TIP.c[1])],
    S(DROP_TIP.r),
    128
  );
  fillPolygon(maskDrop, W, H, dropPoly);

  // 分子结构: 三个节点 + 两条化学键
  for (const n of Object.values(NODES)) {
    fillPolygon(maskMol, W, H, circlePoly(S(n.x), S(n.y), S(n.r), 64));
  }
  fillPolygon(maskMol, W, H, thickSegmentPoly(S(NODES.n0.x), S(NODES.n0.y), S(NODES.n1.x), S(NODES.n1.y), S(BOND_HALF)));
  fillPolygon(maskMol, W, H, thickSegmentPoly(S(NODES.n0.x), S(NODES.n0.y), S(NODES.n2.x), S(NODES.n2.y), S(BOND_HALF)));

  // ---- 合成 ----
  const buf = new Uint8ClampedArray(W * H * 4);
  const inv = 1 / designScale;
  for (let py = 0; py < H; py++) {
    const v = (py + 0.5) / H;
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const idx = py * W + px;

      const t = clamp01((u * 0.55 + v * 0.62) / 1.05);
      let [r, g, b] = gradientAt(t);

      const gd = Math.hypot(u - GLOW.x, v - GLOW.y) / GLOW.r;
      if (gd < 1) {
        const k = (1 - gd) * (1 - gd) * GLOW.strength;
        r = Math.round(mix(r, 255, k));
        g = Math.round(mix(g, 255, k));
        b = Math.round(mix(b, 255, k));
      }

      // 前景按设计坐标系取样 (不同 variant 缩放不同)
      const du = (u - 0.5) * inv + 0.5;
      const dv = (v - 0.5) * inv + 0.5;
      if (du >= 0 && du <= 1 && dv >= 0 && dv <= 1) {
        const di = Math.min(H - 1, Math.floor(dv * H)) * W + Math.min(W - 1, Math.floor(du * W));
        if (maskDrop[di]) {
          r = 255;
          g = 255;
          b = 255;
          if (maskMol[di]) {
            r = 22;
            g = 20;
            b = 62;
          }
        }
      }

      const o = idx * 4;
      buf[o] = r;
      buf[o + 1] = g;
      buf[o + 2] = b;
      buf[o + 3] = maskBg[idx] ? 255 : 0;
    }
  }

  // ---- 下采样 (alpha 预乘的盒式滤波, 避免边缘黑边) ----
  const out = new Uint8ClampedArray(size * size * 4);
  const n = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const o = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          const al = buf[o + 3] / 255;
          r += buf[o] * al;
          g += buf[o + 1] * al;
          b += buf[o + 2] * al;
          a += al;
        }
      }
      const o = (y * size + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
const IOS_SIZES = [
  { name: 'icon-20@2x.png', px: 40 },
  { name: 'icon-20@3x.png', px: 60 },
  { name: 'icon-29@2x.png', px: 58 },
  { name: 'icon-29@3x.png', px: 87 },
  { name: 'icon-40@2x.png', px: 80 },
  { name: 'icon-40@3x.png', px: 120 },
  { name: 'icon-60@2x.png', px: 120 },
  { name: 'icon-60@3x.png', px: 180 },
  { name: 'icon-1024.png', px: 1024 },
];

const ANDROID_DENSITIES = [
  { dir: 'mipmap-mdpi', px: 48 },
  { dir: 'mipmap-hdpi', px: 72 },
  { dir: 'mipmap-xhdpi', px: 96 },
  { dir: 'mipmap-xxhdpi', px: 144 },
  { dir: 'mipmap-xxxhdpi', px: 192 },
];

function writeIOS(iosDir) {
  if (!fs.existsSync(path.join(iosDir, 'FormulaLab'))) return false;
  const setDir = path.join(iosDir, 'FormulaLab', 'Images.xcassets', 'AppIcon.appiconset');
  fs.mkdirSync(setDir, { recursive: true });

  for (const s of IOS_SIZES) {
    const rgba = renderIcon(s.px, 'square');
    // iOS 不允许图标带 alpha 通道 —— 用 RGB (colorType 2) 输出
    fs.writeFileSync(path.join(setDir, s.name), encodePNG(s.px, s.px, rgba, 2));
  }

  // 重写 Contents.json, 带上 filename —— 不写 filename actool 不会编译出任何图标
  const images = [
    { idiom: 'iphone', size: '20x20', scale: '2x', filename: 'icon-20@2x.png' },
    { idiom: 'iphone', size: '20x20', scale: '3x', filename: 'icon-20@3x.png' },
    { idiom: 'iphone', size: '29x29', scale: '2x', filename: 'icon-29@2x.png' },
    { idiom: 'iphone', size: '29x29', scale: '3x', filename: 'icon-29@3x.png' },
    { idiom: 'iphone', size: '40x40', scale: '2x', filename: 'icon-40@2x.png' },
    { idiom: 'iphone', size: '40x40', scale: '3x', filename: 'icon-40@3x.png' },
    { idiom: 'iphone', size: '60x60', scale: '2x', filename: 'icon-60@2x.png' },
    { idiom: 'iphone', size: '60x60', scale: '3x', filename: 'icon-60@3x.png' },
    { idiom: 'ios-marketing', size: '1024x1024', scale: '1x', filename: 'icon-1024.png' },
  ];
  fs.writeFileSync(
    path.join(setDir, 'Contents.json'),
    JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2) + '\n',
    'utf8'
  );
  return true;
}

function writeAndroid(androidDir) {
  const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
  if (!fs.existsSync(resDir)) return false;
  for (const d of ANDROID_DENSITIES) {
    const dir = path.join(resDir, d.dir);
    fs.mkdirSync(dir, { recursive: true });
    const sq = renderIcon(d.px, 'rounded');
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), encodePNG(d.px, d.px, sq, 6));
    const rd = renderIcon(d.px, 'circle');
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), encodePNG(d.px, d.px, rd, 6));
  }
  return true;
}

// ---------------------------------------------------------------------------
// 对外接口
// ---------------------------------------------------------------------------
/**
 * 生成 iOS + Android 全套图标。
 * @param {string} iosDir     ios/ 目录 (不存在则跳过 iOS)
 * @param {string} androidDir android/ 目录 (不存在则跳过 Android)
 */
export function generateIcons(iosDir, androidDir) {
  const ios = writeIOS(iosDir);
  const android = writeAndroid(androidDir);
  return { ios, android };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  if (outIdx >= 0) {
    const dir = path.resolve(args[outIdx + 1]);
    fs.mkdirSync(dir, { recursive: true });
    const rgba = renderIcon(1024, 'square');
    fs.writeFileSync(path.join(dir, 'icon-1024.png'), encodePNG(1024, 1024, rgba, 2));
    const rd = renderIcon(512, 'rounded');
    fs.writeFileSync(path.join(dir, 'preview-rounded.png'), encodePNG(512, 512, rd, 6));
    const ci = renderIcon(512, 'circle');
    fs.writeFileSync(path.join(dir, 'preview-circle.png'), encodePNG(512, 512, ci, 6));
    console.log(`[make-icons] 预览已导出 -> ${dir}`);
  } else {
    const iosDir = path.join(projectRoot, 'ios');
    const androidDir = path.join(projectRoot, 'android');
    const res = generateIcons(iosDir, androidDir);
    console.log(
      `[make-icons] ios=${res.ios ? 'ok' : 'skip'} android=${res.android ? 'ok' : 'skip'} ` +
        `(${IOS_SIZES.length} 个 iOS 尺寸 / ${ANDROID_DENSITIES.length} 档 Android 密度)`
    );
  }
}
