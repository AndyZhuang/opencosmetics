# 配方引擎 FormulaLab

> **美妆配方师的工作台** — 法规 · 成本 · 风险, 一处算清
>
> B2B 化妆品配方工具: EU CosIng + CN IECIC + FDA 事件 + 65 条风险规则 + 247 项原料画像 · Web / 微信小程序 / iOS / Android 同源

[![Next.js](https://img.shields.io/badge/Next.js-15-black)]()
[![Taro](https://img.shields.io/badge/Taro-4.3-000)]()
[![DuckDB](https://img.shields.io/badge/DuckDB-v4.0-yellow)]()
[![MCP](https://img.shields.io/badge/MCP-v0.2-green)]()
[![License: CC-BY 4.0](https://img.shields.io/badge/License-CC--BY%204.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)

---

## 为什么是这个产品

一个配方师真正花时间的地方不是"查成分叫什么",而是**交叉核对**:

- 这个成分在我们卖的市场合法吗?(CN / EU / US 三区不一致)
- 加进去多少钱?成本结构里排第几?
- 跟配方里已有的东西冲不冲?
- 浓度是不是超了上限?

配方引擎把这四件事放进同一个工作台:边建边算,一次给出结论,不用开五个网页。

---

## 三端形态

| 端 | 形态 | 位置 | 说明 |
|---|---|---|---|
| **Web** | Next.js 15 (App Router) | `app/` | 工作台 / 构建器 / 我的配方 / 10 个专业工具 |
| **微信小程序** | Taro 4 (React) | `apps/taro/` → `dist/weapp/` | 测试号即可预览,填 AppID 后可发布 |
| **H5** | Taro 4 (React) | `apps/taro/` → `dist/h5/` | 同一套组件,移动端浏览器直接用 |
| **iOS** | Taro RN → Xcode | `apps/taro/` → `dist/rn/` | 云端 CI 一键出 `.ipa` |
| **Android** | Taro RN → Gradle | `apps/taro/` → `dist/rn/` | 云端 CI 出 `.apk` / `.aab` |

小程序 / H5 / iOS / Android **共用同一份 Taro 组件代码**,后端 API 一份。

> 三端产物是三个**平级**目录(`dist/weapp` / `dist/h5` / `dist/rn`)。
> Taro 每次构建会清空 `outputRoot` 本身,若嵌套成 `dist/` 与 `dist/h5/`,
> 重建小程序会把 H5 产物一起删掉。

---

## 核心能力

### 1. 配方构建器 `/bench`
逐行录入 INCI + 用量 + 相位(A相水相 / B相油相 / C相乳化分散),右侧实时给出:

- **角色画像** — 每个成分被识别为溶剂 / 保湿剂 / 乳化剂 / 防腐剂 / UV 吸收剂 …(247 项人工画像 + 未知成分模式推断)
- **成本结构** — 单公斤成本、单支成本、出厂价、建议零售价、Top5 成本构成条
- **法规状态** — EU 禁用 / 限用、CN IECIC 未收录标记
- **65 条风险规则命中** — 兼容性 / pH / 浓度上限 / 特殊人群 / 区域法规 / 合成生物 / FDA 事件
- **用量骨架** — 只给 INCI 不给浓度时,按各成分典型用量自动生成一版骨架并估算成本

### 2. 原料画像与成本库 `data/ingredient_profiles.json`
247 项常用原料的:中文名、配方角色、典型使用浓度区间、市场价格区间(CNY/kg)。

> 价格是 **2025–2026 国内散装/大货市场估算参考价**,不是报价。落地前须按实际供应商报价校准。
> 引擎会明确标出哪些成分没命中价格库(按角色估值),以及价格覆盖率是多少。

### 3. 规则引擎(7 类 65 条)
| 类别 | 条数 | 说明 |
|---|---|---|
| 兼容性 | 15 | 成分配伍冲突(视黄醇 × 维C、AHA × BHA …) |
| pH 安全 | 8 | 人群/品类 pH 允许区间 + 活性物 pH 有效窗口 |
| 浓度上限 | 14 | 驻留/淋洗最大使用浓度 |
| 特殊人群 | 10 | 孕妇 / 儿童 / 敏感肌 |
| 区域法规 | 13 | CN / EU / US 禁用限用 |
| 合成生物 | 5 | 重组胶原蛋白标签与备案 |
| FDA 事件 | 6 | 高发事件成分红旗 |

**引擎的三条原则**:
1. **成分门控** — 区域/合成生物/FDA 规则只在配方真的含有该成分时才下发(否则任何配方都会凭空多出 4~8 条命中)。
2. **别名映射** — 规则里的简写(`VITAMIN_C` `AHA` `BHA`)会映射到真实 INCI(`ASCORBIC ACID` `SALICYLIC ACID` …)。
3. **估算不阻断** — pH 只能估算时,只给提示不判阻断;填入实测 pH 后才按规则判 `block`。

### 4. 其余工具
风险审查 · 成分替代 · 目标反推 · 配方反查 · 参考配方库 · 成分库 · 行业趋势 · 中国 IECIC · FDA 事件库 · 法规地图 · 30 秒扫成分

---

## 快速开始

### Web
```bash
git clone git@github.com:AndyZhuang/opencosmetics.git
cd opencosmetics
npm install
npm run dev      # http://localhost:3000
```

### 小程序 / H5
见 [`docs/APP-BUILD.md`](docs/APP-BUILD.md)。

### MCP server(Claude / GPT 可直接调用)
```json
{
  "mcpServers": {
    "opencosmetics": {
      "command": "node",
      "args": ["/path/to/opencosmetics/mcp-server/dist/index.js"]
    }
  }
}
```

---

## 数据规模

| 表 | 记录数 | 来源 |
|---|---|---|
| `cosing` | 50,169 | EU CosIng |
| `annex_ii/iii/iv/v/vi` | 1,980 | EU 禁用 / 限用 / 着色剂 / 防腐剂 / 紫外线吸收剂 |
| `cn_iecic_i` / `cn_iecic_ii` | 8,967 | NMPA 现行 + 新原料 |
| `cn_iecic_adjustments` | 113 段 | NMPA 2025-06-23 公告 |
| `fda_cosmetic_events_*` | 85,511 | openFDA |
| `rules.json` | 65 条 | 7 类规则 |
| `ingredient_profiles.json` | 247 项 | 人工维护的配方画像 |

---

## API

所有接口免注册、免 key。完整说明见 [`docs/API.md`](docs/API.md)。

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/workbench/analyze` | POST | 一次调用出全量结论(结构 + 角色 + 相位 + 成本 + 法规 + 风险) |
| `/api/ingredients/search` | GET | 成分检索(CosIng + IECIC + 画像库三源合并,分级排序) |
| `/api/formula/cost` | POST | 成本单算 |
| `/api/formula/compare` | POST | 两版配方差异(成分 + 成本) |
| `/api/formula/export` | POST | 导出 CSV / Markdown / HTML |
| `/api/formulas` · `/api/formulas/[id]` | GET POST PUT DELETE | 设备维度配方草稿 |
| `/api/formula/analyze` | POST | 经典配方反查 |
| `/api/risk/check` | POST | 65 条规则明细 |
| `/api/substitute` · `/api/claim` · `/api/reference` · `/api/trends` · `/api/stats` | | 既有工具 |

---

## 工程约定(踩过的坑)

- **DuckDB 以 READ_ONLY 打开**。Next dev 热重载会重载模块,旧实例仍持有文件锁,第二次 open 直接 500。用 `serverExternalPackages` 把 `@duckdb/node-api` 排除在打包外,其模块级实例缓存可跨 HMR 存活,再叠一层 `globalThis` 缓存连接。
- **Windows PowerShell 5.1 的 `Set-Content -Encoding UTF8` 会写 BOM**,`JSON.parse` 遇到 `\uFEFF` 直接抛错,表现为"数据文件神秘消失"。所有本地 JSON 读取统一走 `lib/json_io.js`。
- **APIRoute 的相对导入层级**:4 层用 `../../../../lib`,3 层用 `../../../lib`。
- **Next 15 production build 后必须 `next build` → `next start`**,改源码不会热更新。
- **不写 `document` / `window` / `localStorage`**,小程序无 DOM;统一用 `Taro.*`。
- **API 必须开 CORS**。H5 版跑在浏览器里,带 `x-device-id` + `Content-Type: application/json`
  属于非简单请求,浏览器必然先发 OPTIONS 预检;`next.config.js` 的 `headers()` 已对
  `/api/:path*` 配好 ACAO / ACAM / ACAH,改配置时别把这块弄丢。

---

## 目录

```
app/                    Next.js 页面与 API
  api/                  13 个 API 路由
  bench/                配方构建器
  formulas/             我的配方
  globals.css           设计系统
components/             TopNav / FormulaBuilder / QuickAnalyze
lib/                    领域逻辑 (成本 / 画像 / 规则 / pH / 草稿)
data/                   DuckDB + 画像库 + 规则库
apps/taro/              微信小程序 + H5 + React Native 同源工程
mcp-server/             MCP server
docs/                   架构 / API / 出包手册
```

---

## License

数据: CC-BY 4.0 · 代码: MIT
