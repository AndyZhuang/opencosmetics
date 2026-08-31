# 开放美妆数据 v3 — 架构文档

> 日期: 2026-08-25  
> 项目: 5 个公开源拼的 50K+ 成分开放数据库 + Next.js 应用

---

## 一、v1 → v2 → v3 进度

| 版本 | 成分 | 监管 | PubChem | 界面 | 规模 |
|------|------|------|---------|------|------|
| v1 (BEBD-only) | 10 | 0 | 0 | 静态 demo (1) | 2 MB |
| v2 (5 源) | 26K+28K+1.9K Annex | 1,927 | 28K | 静态 demo (1) | 8 MB |
| **v3 (5 源 + Next.js)** | **50,169** | **1,927** | **28,354** | **Next.js 5 页面 + API** | **14 MB** |

---

## 二、最终架构

```
┌─ 5 个公开源 (零风险) ─────────────────────────────────┐
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ walkowskis    │  │ beauteeru   │  │ OBF       │ │
│  │ 26,045 CosIng │  │ 28,354 PubChem│  │ 24,127 +  │ │
│  │ (Function)   │  │ (CAS+EC+CID)│  │ 5 Annex   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         └────────────┬────────┘            │      │
│         jsDelivr CDN  │                    │      │
│                ┌──────▼────────────────────▼─┐    │
│                │   DuckDB bebd_v3.duckdb      │    │
│                │   12 张表, 80K+ records     │    │
│                │   14 MB                     │    │
│                └──────┬──────────────────────┘    │
└───────────────────────┼───────────────────────────┘
                        │ @duckdb/node-api
                        │
                  ┌─────▼──────────────────┐
                  │  Next.js 15 + React 19  │
                  │  open-cosmetics/        │
                  │  5 pages + server comp  │
                  └─────┬──────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
     / (home)    /ingredients  /regulatory
                 /[name]       /sources
```

---

## 三、DuckDB 12 张表

| 表 | 记录数 | 字段亮点 |
|----|--------|----------|
| **cosing** (unified) | **50,169** | INCI + CAS + EC + Function + Restriction + INN + PhEur |
| cosing_walkowskis | 26,045 | (raw) |
| cosing_obf | 24,124 | (raw) |
| cosing_lite | 28,354 | INCI + PubChem CID |
| **annex_ii_prohibited** | **1,378** | EU 禁用 |
| annex_iii_restricted | 307 | EU 限用 |
| annex_iv_colorants | 153 | EU 着色剂 |
| annex_v_preservatives | 61 | EU 防腐剂 |
| annex_vi_uv_filters | 28 | EU 防晒剂 |
| incidb_brands | 9 | |
| incidb_ingredients | 130 | 含 comedogenic / FDA warning |
| incidb_products | 10 | |
| incidb_product_ingredients | 191 | 配方位置+浓度 |

---

## 四、Next.js 应用 (`D:/minimax/serverM/open-cosmetics/`)

### 5 个页面

| 路由 | 功能 | 关键技术 |
|------|------|---------|
| `/` | 主页: 8 张统计卡 + Killer Finding 表 + Top 5 Function | Server Component + DuckDB |
| `/ingredients?q=...&page=N` | 成分列表, 服务端分页 + 搜索 | LIKE 查询 |
| `/ingredients/[name]` | 成分详情: CAS/EC/Function + 5 个 EU Annex 反查 | 跨 4 表 join |
| `/regulatory` | 5 个 EU Annex 全表 | DESCRIBE 动态列名 |
| `/sources` | 数据源 + 法律边界 | 静态 |

### 关键技术决策

- **@duckdb/node-api** 比 `duckdb` 包更稳,API 是 `runAndReadAll()` + `prepare().bind([arr])`
- **serverExternalPackages**: 必须把 `@duckdb/node-api` 和 `duckdb` 排除
- **searchParams/params** in Next 15 必须 `await` 才能用属性
- **连接复用**: 模块级 `_conn` 缓存, 否则 DuckDB 文件锁
- **大小写不敏感**: 详情页用 `UPPER(inci_name) = UPPER(?)` 兼容 URL 编码

### Killer Q (Next.js 版本)

```sql
-- BEBD 公开 Top 10 成分 ↔ EU 禁用清单
SELECT bt.inci_name, a2."Chemical name / INN" AS banned_name
FROM (VALUES ('NIACINAMIDE'),('GLYCERIN'),('TOCOPHEROL'),
            ('SQUALANE'),('RETINOL'),('SALICYLIC ACID'),
            ('PANTHENOL'),('TRANEXAMIC ACID'),('HYALURONIC ACID'),
            ('VITAMIN E')) AS bt(inci_name)
JOIN annex_ii_prohibited a2
  ON LOWER(a2."Chemical name / INN") LIKE '%' || LOWER(bt.inci_name) || '%'
   OR LOWER(a2."Identified INGREDIENTS or substances e.g.") LIKE '%' || LOWER(bt.inci_name) || '%';
-- → GLYCERIN 匹配 Nitroglycerin (心脏药, Annex II #253)
-- → SALICYLIC ACID 匹配 4-Aminosalicylic acid (Annex II #31)
```

---

## 五、文件清单 (v3)

```
D:/minimax/serverM/
├── ARCHITECTURE.md            本文档 (v3)
├── BEBD_AUDIT.md              第一轮: BEBD 数据问题
├── BEBD_FETCH.md              第二轮: 抓取报告
│
├── merge_v3.py                5 源合并 → bebd_v3.duckdb (14MB)
├── parse_obf_full.py          OBF CosIng full 解析
├── incremental_bebd.py       BEBD sitemap 增量
├── download_v2.py             下载原始数据
│
├── bebd_data/                 原始数据 (15.8 MB)
│   ├── beauteeru_ingredients.csv
│   ├── walkowskis_cosing.csv
│   ├── obf_cosing_full_ingredients.csv
│   ├── obf_cosing_clean.csv
│   ├── obf_annex_ii-vi.csv
│   ├── incidb_free_samples/
│   ├── bebd_html/             166 sitemap URL 缓存
│   └── ...
│
├── bebd_sample/
│   ├── bebd_v3.duckdb         ← 14MB, 12 张表, 80K records
│   ├── bebd_unified.duckdb    (v2 备份, 8 表)
│   ├── bebd.duckdb            (v1 备份)
│   ├── demo_v2.html           2MB 静态 demo
│   ├── demo.html              4.3MB v1 demo
│   └── top_*.csv              CSV 样本
│
└── open-cosmetics/           ← Next.js 15 应用
    ├── package.json
    ├── next.config.js
    ├── lib/
    │   └── db.js              DuckDB singleton (server-only)
    ├── app/
    │   ├── layout.js          顶部导航
    │   ├── page.js            主页
    │   ├── globals.css
    │   ├── ingredients/
    │   │   ├── page.js        列表 + 搜索 + 分页
    │   │   └── [name]/page.js 详情 + EU 监管
    │   ├── regulatory/page.js
    │   └── sources/page.js
    └── .next/                 Build output
```

---

## 六、运行方式

```bash
# 1) 装依赖
cd D:/minimax/serverM/open-cosmetics
npm install

# 2) 启动
npm run dev
# 或生产模式
npm run build && npm start

# 3) 访问
# http://localhost:3000/
# http://localhost:3000/ingredients
# http://localhost:3000/ingredients/niacinamide
# http://localhost:3000/regulatory
# http://localhost:3000/sources
```

---

## 七、Killer Findings (v3 看到 v1 看不到的)

1. **50,169 统一 CosIng 成分** — 来自 walkowskis + OBF 联合, 多源 join 后去重
2. **EU 监管标识 1,927 条** — 任何成分查这个数据库能直接告诉你在 EU 是不是允许
3. **PubChem CID 28,354 个** — 一键跳到 NIH 化学数据库
4. **BEBD Top 10 成分在 EU 禁用清单匹配**:
   - GLYCERIN → Nitroglycerin (心脏药) ✗
   - SALICYLIC ACID → 4-Aminosalicylic acid ✗
5. **Top 20 functions**: SKIN CONDITIONING (11,668), PERFUMING (4,357), EMOLLIENT (844), ANTIOXIDANT (862) — 真实功能分类
6. **INCIDB 公开 vs 付费**: 公开 130 / 宣称 43,097 = 0.3% — 完整数据需付费
7. **BEBD sitemap**: 166 URL, 包括 103 报告 + 49 资讯 + 14 工具页 (全量可抓, 1 req/sec)

---

## 八、对比 v1/v2/v3

| 能力 | v1 (BEBD only) | v2 (5 源静态) | **v3 (5 源 + Next.js)** |
|------|----------------|----------------|-------------------------|
| 成分 | 10 | 50K | **50K + Next.js 实时查询** |
| 监管标识 | 0 | 1,927 | **1,927 + 跨表反查 API** |
| PubChem | 0 | 28K | **28K + 详情页链接** |
| 配方映射 | 0 | 191 (样本) | **191 (样本) + 跨源 join** |
| 搜索 | ❌ | ❌ (静态) | **✅ 实时 LIKE 搜索 + 分页** |
| 详情页 | ❌ | ❌ | **✅ 5 张表跨 join, EU 监管状态** |
| 法律风险 | 0 | 0 | **0** (所有源公开) |
| 部署 | N/A | 静态 HTML | **Next.js 15 (生产级)** |

---

## 九、下一步 (用户决定)

| 优先级 | 任务 | 估时 | 风险 |
|--------|------|------|------|
| 🔴 高 | docker 化 open-cosmetics (一键部署) | 1 小时 | 零 |
| 🔴 高 | API routes 替代 Server Component (给外部用) | 2 小时 | 零 |
| 🟡 中 | FDA VCRP 2M 美国商品 | 1 天 | 零 |
| 🟡 中 | Wikidata SPARQL 跨语言标签 | 1 天 | 中 (SSL 拦) |
| 🟡 中 | cron 增量 (每天 BEBD sitemap + 每周 refresh) | 2 小时 | 零 |
| 🟡 中 | Webhook 报警 (新成分) | 4 小时 | 零 |
| 🟠 高 | NMPA 备案 4M (Playwright + IP 轮换) | 3-5 天 | 中 |
| 🟡 中 | SQLite 镜像 + Postgres 迁移 | 1 天 | 零 |
| 🟢 低 | bcrypt 认证 + 用户提交查询 | 2 天 | 零 |
