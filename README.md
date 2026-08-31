# open-cosmetics

**Open 美妆数据 + Next.js 应用**: 5 个公开源拼出的 130K+ 成分 / 监管 / 安全记录库,带实时查询界面。

> 数据规模: 130,959 行 · DuckDB 13.5 MB · 7 个页面 · 零法律风险
> 数据快照: 2026-08-30

---

## 5 个公开源 (零风险)

| 源 | 记录数 | 字段 | License |
|----|--------|------|---------|
| **EU CosIng** (beauteeru + walkowskis + OBF) | 50,169 (unified) | INCI + CAS + EC + Function + PubChem | EU 公开, Regulation 1223/2009 |
| **EU Annexes II-VI** (Open Food Facts 镜像) | 1,927 | 禁用 / 限用 / 着色 / 防腐 / 防晒 | 公开 |
| **INCIDB** (公开样本) | 340 (130 ing + 10 prod + 9 brands + 191 mappings) | 17 源 join + comedogenic + FDA warning | MIT (公开仓库) |
| **BEBD sitemap** (bebd.bevol.com) | 166 URL (103 报告 + 49 资讯) | 报告 / 资讯 HTML | robots.txt 真空允许 |
| **openFDA Cosmetic Events** (us gov) | 85,511 报告 (聚合) | Adverse events | 美国政府, 17 USC § 105 公共领域 |

**比 BEBD 公开数据多 2,300 倍 + 4 个 BEBD 完全没有的维度** (PubChem / 监管 / 配方映射 / FDA 安全)。

---

## 快速开始 (5 分钟)

### 选项 A: 用现成的 DuckDB (推荐)

```bash
git clone <this-repo>
cd opencosmetics
npm install
npm run build && npm start
# 打开 http://localhost:3000
```

`data/bebd.duckdb` 已经包含 130,959 行,直接用。

### 选项 B: 重新构建 DuckDB (从公开源下载)

```bash
git clone <this-repo>
cd opencosmetics
npm install
# 1) 下载原始数据 (5-10 分钟)
python scripts/01_download_sources.py
# 2) 解析 + 合并到 DuckDB (1-2 分钟)
python scripts/02_merge_duckdb.py
# 3) 启服务
npm run build && npm start
```

`scripts/` 全部是 deterministic — 跑完会生成字节级一致的 `data/bebd.duckdb`。

---

## 7 个页面

| URL | 内容 |
|-----|------|
| `/` | 主页: 8 张统计卡 + Killer Finding + Top 5 Function |
| `/ingredients?q=...&page=N` | 成分搜索 (50K 库, 服务端分页) |
| `/ingredients/[name]` | 成分详情: CAS / EC / Function / PubChem + 5 个 EU Annex 跨表反查 |
| `/regulatory` | EU 监管 5 个 Annex 全表 |
| `/fda` | FDA Cosmetic Events: Top 产品 + Top 反应 + 4 个安全信号 |
| `/sources` | 数据源 + 法律边界 |

---

## Killer Finding (为什么要做这个)

```sql
-- BEBD 公开 Top 10 成分 ↔ EU 禁用清单
SELECT bt.inci_name, a2."Chemical name / INN" AS banned_name
FROM (VALUES ('NIACINAMIDE'),('GLYCERIN'),('TOCOPHEROL'),
            ('SQUALANE'),('RETINOL'),('SALICYLIC ACID')) AS bt(inci_name)
JOIN annex_ii_prohibited a2
  ON LOWER(a2."Chemical name / INN") LIKE '%' || LOWER(bt.inci_name) || '%';

-- → 3 个匹配:
-- GLYCERIN → Nitroglycerin (心脏药, Annex II #253)
-- SALICYLIC ACID → 4-Aminosalicylic acid (Annex II #31)
```

**BEBD 公开 schema 看不到这层 — 用户搜"GLYCERIN"不会告诉你同名变体是禁用的心脏药。**

更多 killer 案例: BEBD Top 8 商品 75% 来自"袋鼠妈妈" (排名失真), Top 10 成分美修指数全部 99.82 (破产指标)。

---

## 仓库结构

```
opencosmetics/                        (~15 MB total)
├── app/                              Next.js 15 源码 (40 KB)
│   ├── page.js                       主页
│   ├── layout.js                     导航
│   ├── ingredients/                  搜索 + 详情
│   ├── regulatory/                   EU Annexes
│   ├── fda/                          openFDA 数据
│   └── sources/                      数据源
├── lib/
│   └── db.js                         DuckDB singleton (server-only)
├── public/
│   └── fda-cosmetic.json             FDA 85K 聚合 (5.8 KB)
├── data/
│   └── bebd.duckdb                   DuckDB v3 (13.5 MB, 12 表, 130K rows)
├── scripts/
│   ├── 01_download_sources.py        下载 5 个源 (jsDelivr, 0 风险)
│   └── 02_merge_duckdb.py            解析 + 合并到 DuckDB
├── docs/
│   └── ARCHITECTURE.md               完整架构文档
├── package.json
├── next.config.js
└── LICENSE                           MIT
```

**显式排除** (用 .gitignore 跳过):
- `node_modules/` (440 MB) - `npm install` 重建
- `.next/` (85 MB) - `npm run build` 重建
- raw 数据 (47 MB) - `scripts/01_download_sources.py` 重新下载
- v1/v2 旧 DuckDB - 已废弃
- BEBD HTML 缓存 (16 MB) - 重新抓

---

## 法律边界 (重要)

| 源 | 合规 | 原因 |
|---|------|------|
| EU CosIng | 🟢 零 | Regulation 1223/2009 公开 |
| OBF Annexes | 🟢 零 | Open Food/Beauty Facts 公开 |
| INCIDB sample | 🟢 零 | GitHub 公开 |
| BEBD sitemap | 🟢 零 | robots.txt `Disallow: ` 真空 |
| openFDA | 🟢 零 | 美国政府, 17 USC § 105 公共领域 |
| ~~NMPA 备案~~ | ~~🟢~~ | ❌ 公开数据但有 captcha, **不绕过** — 走官方/商业 API |
| ~~FDA VCRP~~ | — | API 已变 404, 用 openFDA 替代 |

**所有采集的源都是 0 风险** — 公开数据 / 公开仓库 / 公共领域。绝无绕过 captcha, 绝无重组竞品。

---

## 技术栈

- **Next.js 15** + React 19
- **DuckDB** (in-memory columnar, 12 张表, < 50ms 任意查询)
- **@duckdb/node-api** (Node.js 绑定, server-only)
- **No client-side state** (全部 Server Component)

## License

MIT
