# 代码与设计审查报告（2026-10-28）

审查对象：`AndyZhuang/opencosmetics` @ `40b2d03`（配方引擎 FormulaLab）
审查面：`lib/` 核心引擎 + `apps/taro/` 三端 + 工程化/CI + Web 端
方法：静态阅读 + **生产环境端到端复现**（`https://opencosmetics.top`）+ 规则数据逐条仿真
结论口径：**只写有复现证据的问题**；推测性意见单独标注。

---

## 总览

| 面 | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| 核心引擎（`lib/`） | 3 | 5 | 7 | 0 |
| Taro 三端（`apps/taro/src`） | 2 | 4 | 5 | 4 |
| 工程化 / CI | 3 | 9 | 8 | 5 |
| MCP server | 1 | 0 | 0 | 0 |
| Web 端（`app/`、`components/`） | 2 | 9 | 5 | 3 |
| **合计** | **11** | **27** | **25** | **12** |

> 计数口径：按**正文中实际编号的条目**统计（`P<级别>-<序号>` 全局唯一）。
> 总览里 MCP server 原本记的「P2=1」在正文中没有对应编号条目，故计 0。

**一句话总判断**：工程基建（行尾钉死、产物目录隔离、token 单一真源、失败不吞退出码）做得比同规模项目好得多；
但**核心业务逻辑的正确性没被测试兜住** —— 风险引擎拿不到浓度数据、别名层会误判合法原料、
人群规则因下划线永远不触发、独立 MCP server 还是一份劣化副本。
这批问题里，**P0 会直接给出错误的合规结论**，对一个「给配方师做决策」的工具来说，代价最高。

Web 端另有两类系统性问题：
一是**「数据有了但没接上」** —— 欧盟禁用状态、法规规则数、语言切换、已存配方回填，
后端都具备，但前端/接口没消费，用户只能看到错的或空的；
二是**「内容有了但引擎没建」** —— 258 个 URL 的站点只有 1 个页面有 `<title>`，
243 个原料页在 sitemap 里却没有任何标题和描述。

---

# 一、核心引擎（`lib/`）

## P0-1 浓度上限规则从不比对浓度（14 条规则全部退化）

- **位置**：`app/api/workbench/analyze/route.js:59` → `lib/formula_analyzer.js:565` → `lib/db.js:186-189`
- **根因**：`checkFormulaRisk(ingredients, ctx)` 的 `ingredients` 是**字符串数组**。
  `lib/formula_analyzer.js:565` 调的是 `checkFormulaRisk(ingredients, ...)`，
  百分比在进引擎前就被丢掉了；`lib/db.js:228-242` 的浓度分支只做
  `matchRuleIngredient(r.ingredient, ingSet)`（成分存在性），**从不比较 `max_pct` / `leave_on_max_pct`**。
- **复现**（生产环境）：
  ```
  POST /api/workbench/analyze
  lines: [{AQUA, 99.5}, {RETINOL, 0.001}]     # 视黄醇 0.001%，远低于 EU 0.05% 上限
  → findings: [{ rule_id: "CONC-001", severity: "info", matched: ["RETINOL"] }]
  ```
  规则照样命中。
- **后果**：14 条 `concentration_limits` 规则退化成「成分存在即命中」。
  任何含视黄醇的合法配方都会收到一条命中项；反过来说，**真正超限的情况也没有被单独标记**，
  用户看不出「这个成分命中了哪条上限规则」。规则名叫「浓度上限」，行为却是「成分存在」。
- **修法**：
  1. `checkFormulaRisk` 的入参改为 `[{ inci_name, pct }]`；
  2. 浓度分支改成 `if (pct > limit) findings.push({ ..., over_by: pct - limit })`，
     并在未提供 pct 时明确标注 `needs_concentration: true` 而不是照命中；
  3. `pickFindingText`（`lib/formula_analyzer.js:533`）补 `max_pct` 分支。

## P0-2 合法原料被误判为「禁用」→ 整张配方被判 REJECT

- **位置**：`lib/rule_aliases.js:96-105`
- **根因**：token 回退匹配用**子串包含**而非词边界：
  ```js
  for (const ing of ingSet) if (toks.every((t) => ing.includes(t))) return ing;
  ```
  `RETINOIC_ACID` → tokens `["RETINOIC","ACID"]` →
  `"HYDROXYRETINOIC ACID".includes("RETINOIC")` 且 `.includes("ACID")` → 命中。
- **复现**（生产环境）：
  ```
  POST /api/risk/check
  ingredients: ["AQUA","HYDROXYRETINOIC ACID","GLYCERIN"]
  → summary = REJECT   block = 1
    [block] REG-CN-002  ingredient="RETINOIC_ACID"  matched="HYDROXYRETINOIC ACID"
            文本="禁用 (2021 年第 74 号公告)"
  ```
  羟基维A酸（HPR，合法抗皱原料）被判成「维A酸禁用」。
- **后果**：**对合法配方给出阻断结论**。合规工具给错阻断，用户要么改用不正规原料、要么不再信工具。
- **修法**：token 匹配改成词边界（`\b`）或直接要求展开候选精确命中；
  第 3 段「首个 token 子串匹配」改为词首匹配（`ing.startsWith(token)`）。
  修完需回归：`HYDROXYRETINOIC ACID` / `TITANIUM DIOXIDE CI 77891` / `PHENOXYETHANOL (AND) ETHYLHEXYLGLYCERIN`
  三个已知边界样本。

## P0-3 特殊人群规则因下划线不还原而漏报（3 条完全失效 + 3 条部分失效）

- **位置**：`lib/db.js:217`
  ```js
  const matched = r.ingredients ? r.ingredients.filter((i) => ingSet.has(i.toUpperCase())) : [];
  ```
  纯精确匹配，**不走** `lib/rule_aliases.js` 的别名层与下划线还原 —— 与其它规则类别不一致。
- **数据事实**：`data/rules.json` 的 10 条人群规则里 6 条的成分名带下划线
  （`SALICYLIC_ACID` / `IODOPROPYNYL_BUTYLCARBAMATE` / `DENATURED_ALCOHOL` / `FORMALDEHYDE_RELEASERS` …），
  而配方里写的是空格形式（`SALICYLIC ACID`）。
- **复现**（生产环境）：
  | 配方（population=pregnant） | 实际 | 应有 |
  |---|---|---|
  | `AQUA + SALICYLIC ACID` | POP-004 未命中 | warn 孕妇慎用水杨酸 |
  | `AQUA + IODOPROPYLENYL BUTYLCARBAMATE` | POP-006 未命中 | **block 孕妇禁用** |
  | `AQUA + DENATURED ALCOHOL` | 结论 PASS，零命中 | warn 孕妇慎用 |
  | `AQUA + RETINOL`（对照，规则名无下划线） | POP-001 block ✅ | — |
- **后果**：**2 条 block 级 + 3 条 warn 级规则实际从不生效**；含禁用物的孕妇配方反而「通过」。
- **修法**：`special_populations` 分支改用 `matchRuleIngredient`（已支持别名与下划线还原）。

## P1-1 成本不按配方总量归一化，配平不足时定价被系统性低估

- **位置**：`lib/cost_engine.js:104-113`
  ```js
  const rawPerKg = norm.reduce((s, l) => s + l.cost_per_kg, 0);   // 没有除以 totalPct
  ```
- **复现**：`AQUA 70 + NIACINAMIDE 4 + GLYCERIN 3`（总浓度只有 77%）
  → 报 `total_per_kg = 8.691`、建议零售价 `¥7.43`；
  归一化到 100% 应为 **11.24**，零售价 **¥9.61**，即**低估 22.7%**。
- **现状**：`quality.balanced` 已经是 `false`，但**定价结论照报**，而界面顶部展示的就是这个价。
- **修法**：`rawPerKg` 按 `totalPct / 100` 归一；或未配平时把零售价标为「不可用，配方未配平」。

## P1-2 部分成分缺用量时静默按 0 算成本

- **位置**：`app/api/workbench/analyze/route.js:92-102`
  只有**全部**无 pct 时才用骨架估算并加提示；**部分**缺失时直接用原始 lines，缺失项按 0 参与计算。
- **复现**：`AQUA 70 + NIACINAMIDE 4 + 透明质酸(无 pct)` → `estimated_from_typical_levels = false`，
  `note_zh` 仍写「全部成分命中价格库」，但透明质酸（1800–5200 CNY/kg，1% 就是 18–52 CNY/kg）的成本按 0 算。
- **修法**：部分缺失时对缺失项按典型用量补齐，输出 `estimated_rows` 数组，界面单独标注。

## P1-3 API 输入不校验：`ingredients` 传对象数组静默产出垃圾

- **位置**：`app/api/workbench/analyze/route.js:43`
  ```js
  lines = body.ingredients.map((n) => ({ inci_name: String(n).toUpperCase().trim(), pct: 0, phase: null }));
  ```
- **复现**：`ingredients: [{inci_name:"AQUA", pct:70}]` → **HTTP 200**，
  `lines` 解析成 `[OBJECT OBJECT]`，成本按“[OBJECT OBJECT]”估算并返回一份看起来正常的响应。
- **后果**：客户端字段名拼错 → 200 + 完整但完全错误的成本/风险结论，**没有任何报错**。
- **修法**：`ingredients` 数组元素必须是 string，否则 400；或同时接受 `{inci_name,pct}` 并转成 `lines`。

## P1-4 规则数据里混进了「非成分」字符串，这些规则永远不可能命中

- **位置**：`data/rules.json`
- **事实**（拿 243 条原料库当全集逐条仿真）：
  | 规则 | ingredient | 问题 |
  |---|---|---|
  | REG-US-001 | `11_INGREDIENTS` | 是数量不是成分 |
  | REG-ASEAN-001 | `1,870_substances` | 是数量不是成分 |
  | FDA-002/003/004/005 | `CLEANSER_AND_SOAP` / `MOISTURIZER` / `HAIR_CARE` / `MAKEUP_FOUNDRY` | 是产品类目 |
  | REG-US-003 | `PFAS_PFOA` | 化学类别，无对应 INCI |
  | SYB-003 | `RH-OVIDUCAL_POTEIN` | **两处拼写错误**（应为 OVI**DUC**AL PRO**TEIN**） |
  | SYB-005 | `SYNBIO_NMN_NR_NMN` | 无对应 INCI |
- **后果**：这 10 条规则**在任何配方下都不可能命中**，却计入「65 条规则」并在界面上显示规则总数。
- **修法**：给规则加 `kind: "ingredient" | "category" | "threshold"`，只有 ingredient 类才进匹配；
  类目类规则改为「按产品类型命中」。同步修 SYB-003 的拼写。

## P2 级（引擎层）

| # | 位置 | 问题 |
|---|---|---|
| P2-1 | `lib/db.js:146-414` | 文件名叫 db.js，里面 230 行是风险引擎；`lib/formula_analyzer.js` 26KB 只有 2 个导出却要 import 它。应拆成 `lib/risk_engine.js` |
| P2-2 | `lib/translate.js:9,26-41` | `lib/inci_zh_map.json` 不存在 → `loadInciToZh()` **永远走 catch 分支**，每次进程启动从 587KB 正向表重建反向表 |
| P2-3 | `lib/zh_inci_list.json` | 745 KB，**全仓无人引用**的孤儿文件 |
| P2-4 | `lib/db.js:155-162` | `inferSeverity` 靠正则匹配中文文案（`/禁用|不得|禁/`）推断严重度。71 条规则里只有 33 条有显式 `severity` 字段，**改一个字的 status 文案就会把 block 变成 info** |
| P2-5 | `lib/ph_estimate.js:70-75` | 关键词兜底里 `if (acids.length \|\| bases.length) break;` 导致「未收录的酸 + 未收录的碱」只识别出第一个 → 返回估算 pH 而不是「必须实测」 |
| P2-6 | `lib/ph_estimate.js:47-52` | `CLEANSING_SURFACTANTS` 里混了 `MINERAL OIL`、`ISODECANOL`（不是表活）→ 矿物油面部油会被判成淋洗类 → 用错 pH 规则集 |
| P2-7 | `lib/formula_store.js:31-54` | 单变量 `_cache` + mtime 判活：**多设备并发时缓存反复失效**；read-modify-write **非原子**，同设备并发保存会丢记录。文件写在 `data/saved_formulas/`（已 gitignore ✅），但**该目录不在 `scripts/deploy.py` 的排除列表里**，本机草稿会被传到生产机 |

## P1-5（产品层）合规关键成分大面积缺席原料画像库

- **事实**：把规则集里出现过的「禁用/限用/特殊人群」成分拿去比对 243 条画像库，
  **28 个里 24 个不在库里**：
  `HYDROQUINONE` / `TRICLOSAN` / `FORMALDEHYDE` / `MINOXIDIL` / `OXYBENZONE` / `LILIAL` /
  `CANNABIDIOL` / `BENZOYL PEROXIDE` / `ALLANTOIN` / `PFOA` / `FORMALDEHYDE RELEASERS` /
  `DENATURED ALCOHOL` / `RECOMBINANT COLLAGEN` / `TRETINOIN` / `ADAPALENE` / `TAZAROTENE` /
  `CITRONELLOL` / `GERANIOL` / `EUGENOL` / `CINNAMAL` / `LINALOOL` / `D-LIMONENE` / `BENZYL SALICYLATE`
- **后果**：配方师最需要检索的恰恰是这些 —— 现在
  ①成分库搜不到它们；②成本引擎对它们只能走角色估值；
  ③监管结论只能靠用户手打 INCI 才会触发。
- **建议**：把「**法规重点管控成分**」从「常用配方原料」里拆出来，做成独立的**管控成分表**
  （含地区、限量、依据、生效日期），在成分库里作为一等公民展示。
  原料画像表回答「怎么用」，管控成分表回答「能不能用」，两者是不同的问题。

---

# 二、Taro 三端（`apps/taro/src`）

## P0-4 三处跳构建器的深链参数全部无人消费，打开的永远是空构建器

- **位置**：`apps/taro/src/pages/formulas/index.tsx:124`、`pages/ingredients/detail.tsx:125`、
  `pages/claim/index.tsx:132`（接收端 `pages/bench/index.tsx`）
- **复现**：`bench/index.tsx` 全文 grep `params|router|useRouter|getCurrentInstance|search` → **零命中**。
  三处分别传 `?id=` / `?name=` / `?actives=`，接收端一个都不读。
- **后果**：「我的配方→打开草稿」「成分详情→在构建器试用」「目标反推→拉进构建器」
  三条主链路**全部打开空构建器**，配方师必须手工重敲 INCI。
  对照 Web 端 `app/formulas/page.js:44-52` 有完整的 `openInBench` 实现 —— 三端功能不对齐。
- **修法**：在 `bench/index.tsx` 顶部解析 `Taro.getCurrentInstance().router.params`，
  `?id=` 走 `getFormula(id)` 异步还原，`?name=` 填一行，`?actives=` 拆多行。

## P0-5 本地草稿模块是死代码 + `reLaunch` 导航，配方内容必然丢失

- **位置**：`apps/taro/src/store/drafts.ts:19-47`、`apps/taro/src/components/BottomNav.tsx:29`
- **复现**：`saveLocalDraft` / `loadLocalDraft` / `clearLocalDraft` 全仓**只出现在定义处，无任何 import**；
  `BottomNav` 用 `Taro.reLaunch({url})` 切页。
- **后果**：构建器的配方只存在 `bench/index.tsx:63` 的 `useState` 里。
  配方师敲了 20 行成分，点一下底部导航 → `reLaunch` 销毁整个页面栈 → **内容全没**，
  本地也无备份（草稿模块没接）。服务端草稿只有点「保存草稿」才写入。
- **修法**：(a) `bench/index.tsx` 加 `useEffect` 自动 `saveLocalDraft` + 进页 `loadLocalDraft` 回填；
  (b) `BottomNav` 改 `Taro.redirectTo` 保留页面栈。

## P1 级（三端）

| # | 位置 | 问题 |
|---|---|---|
| P1-6 | `pages/workbench/index.tsx:84` | `debounce` 裸赋值，每次渲染新建实例、各自持 timer → **输入 5 个字符发 5 次请求**。同项目 `bench/index.tsx:87`、`ingredients/index.tsx:59` 都正确用了 `useMemo` |
| P1-7 | `pages/ingredients/index.tsx:59-81` | 缺请求竞态守卫，旧响应覆盖新响应。项目已有现成模式（`bench` 的 `seq` ref）与现成工具（`utils/index.ts:26` 的 `createRequestGuard()`，目前无人调用） |
| P1-8 | `src/styles/pages.scss:23,54,73,78,206,212` | 6 条 `> view` 元素选择器在 **RN 端被静默丢弃**（实测 `rn-style-transformer.transform()` 产出空 `StyleSheet`）。H5 被 postcss 改写成 `taro-view-core` 所以 H5/小程序正常，**只有 App 端失效** → 按钮间距与双列栅格塌陷且零报错。stylelint 只 warning 不 error |
| P1-9 | `apps/taro/scripts/fix-rn-line-height.mjs`、`fix-scss-imports.mjs`、`package.json:12-21` | 这两个脚本解决的是「RN 直接构建失败/文字塌陷」，但**没有任何 npm script 会调用它们**，`build.mjs` 也不调。任何人新写一个 scss 或一条无单位 `line-height`，CI 全绿直到 RN 出包才炸。`stylelint@16.10.0` 装了却无 lint 脚本 |

## P2 / P3 级（三端，摘要）

- **P2-10** 9 个页面各自重写 loading/error/empty 三态，`bench` 单页 12 个 `useState`；`ApiError.status` 完全没被利用 → 抽 `useAsync<T>()` 统一入口。
- **P2-11** `pages/ingredients/index.tsx:68` 只取前 60 条且无分页，接口层 `offset` 参数已存在但没用 → 顶部显示「243 条」而列表只有 60 条。
- **P2-12** `api/client.ts:120` `x-device-id` 为空时**直接不发这个头**，服务端回落 `"anonymous"` → 所有匿名设备共用一个桶，草稿串号。`app-init.ts` 用 `useLaunch` 赋值时序上安全，但**代码层零兜底**。
- **P2-13** `api/client.ts:125-150` 丢弃 `RequestTask` 句柄，页面无法取消在途请求；`debounce` 提供了 `cancel()` 但全仓无人调用。
- **P2-14** `pages/bench/index.tsx:219-225` 「实测 pH」输入框是**死的**（`value=""` `onInput={() => {}}`），值既不保存也不进 `context` → 配方师以为录了 pH，实际 pH 规则仍按估算走。
- **P3-15** `components/ui.tsx:399` `HScroll` 的 `enhanced` / `showScrollbar` 是 weapp 专属 props，会原样透传到 RN 原生 ScrollView → RN 告警且 `showScrollbar` 不生效。
- **P3-16** `styles/pages.scss:59` `.bn-actions-sticky` 名不副实（无 sticky）。
- **P3-17** `pages/bench/index.tsx:63` `useState<Row[]>([newRow(), newRow(), newRow()])` 每次渲染都求值 → 每次渲染多造 3 个对象并让模块级 `rowSeq` +3。
- **P3-18** `package.json:16` `build:all` 不含 RN，脚本名有歧义。

---

# 三、工程化 / CI

## P0-6 部署失败 / 站点坏掉时 CI 仍然绿灯

- **位置**：`deploy_remote.sh:13`、`deploy_remote.sh:73-85`、`scripts/deploy.py:203,239-242`
- **根因**：
  1. `deploy_remote.sh` 只有 `set -uo pipefail`（**没有 `-e`**）→ `npm run build` 失败不中断；
  2. 构建结果用 `[ -d .next ]` 判定 → Next 构建失败时 `.next` **目录仍然存在** → 判定通过 → 用坏构建启动服务；
  3. 冒烟测试只 `echo` 状态码（`deploy_remote.sh:83-84`），**永不失败**；
  4. `deploy.py` 的 `verify()` 返回异常端点数 `bad`，`main()` 只打印、不据此退出非零。
- **后果**：生产构建挂了 / 页面 500，`Deploy` 步骤仍 exit 0，Actions 显示绿色，**无人察觉**。
  CI 完全失去门禁作用。
- **修法**：`set -euo pipefail`；构建后校验 `.next/BUILD_ID` 存在且 mtime 新于本次部署；
  冒烟 `code != 200` 即 `fail`；`deploy.py` 末尾 `sys.exit(1 if bad else 0)`。

## P0-7 部署中途失败会把生产留在「已停机 + 半部署」状态，且无自动回滚

- **位置**：`deploy_remote.sh:22-25`（先停服务）、`:71-79`（之后才构建/启动）、
  `scripts/deploy.py:215-222`（`rollback()` 存在但**从未被调用**）、`scripts/deploy.py:88`（ssh 超时未捕获）
- **根因**：
  1. 服务在第 1 步就被 stop，构建失败没有任何 `trap`/回滚把 `_v1` 换回来；
  2. `rollback()` 写成 `rm -rf $REMOTE_DIR && mv $REMOTE_DIR_OLD $REMOTE_DIR && systemctl start`，
     一旦 `_v1` 不存在，`mv` 失败会截断 `&&` 链，**`systemctl start` 永不执行**，返回码取了不用；
  3. `subprocess.run(..., timeout=900)` 抛 `TimeoutExpired` 未捕获 → 本地 ssh 被杀但**远端脚本仍在跑**。
- **修法**：加 `trap ... EXIT` 回滚；`rollback()` 里 `mv` 失败也要尝试 `systemctl start`；
  `ssh()` 捕获 `TimeoutExpired` 并提示「远端可能仍在执行，请先 ssh 检查」。

## P0-8 Android 正式签名密钥与明文口令文件不在 `.gitignore` 内

- **位置**：`.gitignore:102`（只有 `apps/taro/*.keystore`）、`.github/workflows/android.yml:99-105`、
  `docs/APP-BUILD.md:154-163`
- **复现**（`git check-ignore` 实测）：
  ```
  apps/taro/android/app/fl-release.keystore    → ❌ 未忽略
  apps/taro/android/keystore.properties       → ❌ 未忽略
  apps/taro/fl-release.keystore                → ✅ 已忽略（只覆盖 apps/taro 根目录）
  ```
- **后果**：开发者照文档配置正式签名后，一次 `git add .` 就把**上架密钥和明文口令**提交进公开仓库。
  应用商店签名密钥泄露不可撤回。
- **修法**：`.gitignore` 追加 `apps/taro/android/**/*.keystore`、`apps/taro/android/keystore.properties`；
  放一份 `keystore.properties.example`。

## P1 级（工程化，摘要）

| # | 位置 | 问题 |
|---|---|---|
| P1-10 | `.github/workflows/ios.yml:36-38` | `concurrency` 组只有 ref，`workflow_dispatch` 的签名出包和 push 撞同一组 → **实测 3/3 次手动出包被后续 push 取消**。修法：group 加上 `github.event_name` 与 `inputs.build_device` |
| P1-11 | `package.json:11-15`、三个 workflow、`deploy_remote.sh:63` | 根依赖全写 `latest` + 全链路 `npm install` 而非 `npm ci` → **构建不可复现**，部署当天可能装到 next 大版本 |
| P1-12 | `apps/taro/.npmrc:1` | 项目级 `.npmrc` 把 **CI 的 npm 源也钉到 npmmirror** → 出包产物走第三方镜像且不受 lockfile 约束 |
| P1-13 | `.github/workflows/ios.yml:83,96` | `Podfile.lock` 不入库 → `hashFiles(...)` 恒为空 → **DerivedData 缓存 key 形同虚设**，且 pod 版本每次重解析 |
| P1-14 | `.github/workflows/weapp.yml:17-21` | `paths` 漏掉 `apps/taro/scripts/**`（正是 weapp/h5 的产物生成入口）、`package-lock.json`、`babel/metro/project.config.json` → 改了构建脚本不会重建 |
| P1-15 | `weapp.yml` / `android.yml` / `deploy-web.yml` | **三个 workflow 都缺 `timeout-minutes`**（只有 iOS 有 45）→ 卡死会占满默认 360 分钟 |
| P1-16 | `scripts/deploy.py:67-72,104-111,45-52` | `EXCLUDE_PATTERNS` 全是 glob，但 `is_excluded()` 用字面比较 → **这些模式对任何路径都匹配不上**；且 CI 上 `TARBALL` 落到仓库目录内，`os.walk` 会把**正在写入的自身**打进包 |
| P1-17 | `deploy_remote.sh:61-68` | 远端 `npm install` 失败被静默回退成旧 `node_modules` → 本次「部署成功」用的其实是上一版依赖 |
| P1-18 | `scripts/deploy.py:85-91,137-144` | ssh 超时抛 `TimeoutExpired` 未捕获 → CI 报看不懂的 traceback，远端却还在执行 |

## P2 / P3 级（工程化，摘要）

- **P2-15** `apps/taro/scripts/setup-native.js:20,331` —— ESM 语法却是 `.js`，`apps/taro/package.json` 无 `"type": "module"` → Node 22.7+ 默认开 module detection 侥幸能跑，**Node 20 上直接 SyntaxError**。改名为 `.mjs`（不要给 package.json 加 `"type": "module"`，`metro.config.js` 等必须是 CJS）。
- **P2-16** 文档与实际不一致三处：workflow 注释写 `DEPLOY_SSH_KEY` 但代码读 `DEPLOY_SSH_KEY_B64`；README 说「13 个 API 路由」实际 **17 个**；README 让用户指向 `mcp-server/dist/index.js` 但该目录被 gitignore 且没写构建步骤。
- **P2-17** `scripts/fix_json_bom.mjs:6-7` 依赖 cwd，目录不存在时静默 `checked=0` exit 0。
- **P2-18** `scripts/_duck_probe.mjs:4`、`scripts/test_claim_fn.js:3,7` 硬编码本机绝对路径与过期 chunk 名（`../.next/server/chunks/318.js`）。
- **P2-19** `ios.yml:180-183,190,205` 签名 secret 缺空值校验 → `IOS_TEAM_ID` 为空时 sed 会写出 `DEVELOPMENT_TEAM = ;`，排查方向被带偏。
- **P2-20** `scripts/deploy.py:40-52` 硬编码 `D:/minimax/serverM/opencosmetics`，cwd 兜底时不校验是不是仓库根。
- **P2-21** `scripts/deploy.py:77-82` `_ssh_opts()` 默认 `StrictHostKeyChecking=no` → 本地手动部署接受任意主机密钥。改成 `accept-new`。
- **P2-22** `apps/taro/android/settings.gradle:1` `rootProject.name = 'HelloWorld'` —— `setup-native.js` 的替换只覆盖 `android/app/src`，漏了顶层。
- **P3-23** `.gitattributes` 缺 `*.jar` / `*.duckdb` / `*.aar` / `*.zip` 的 binary 声明。
- **P3-24** `.gitignore` 有重复条目，且 `:103` 的 `!apps/taro/android/app/debug.keystore` 是空操作（没任何模式会忽略它）。
- **P3-25** `data/bebd.duckdb` 21.7 MB 入库；`deploy_remote.sh:40-47` 每次部署都用它覆盖生产库 → 有「把生产数据当代码发布」的风险，应在文档里写清这是首次启动种子。
- **P3-26** `weapp.yml:49` 用 `npx tsc --noEmit` 而 `apps/taro/package.json:20` 已有 `typecheck` script → 两处定义易漂移。
- **P3-27** `apps/taro/ios/_xcode.env` 与 `.xcode.env` 双份入库 → 每次跑 `setup-native.js` 都产生一个无意义的删除 diff。

---

# 四、MCP server（独立 stdio 版）

## P0-9 `mcp-server/src/index.ts:82` 是风险引擎的**劣化副本**，与 Web 端结论不一致

- **位置**：`mcp-server/src/index.ts:82-116`（注释写「matches lib/db.js checkFormulaRisk」，实际不匹配）
- **劣化点**：
  | 能力 | `lib/db.js` | `mcp-server/src/index.ts` |
  |---|---|---|
  | 规则类别 | 7 类 | **4 类**（`RuleSet` 接口只声明 compatibility / special_populations / concentration_limits / regulatory_region；**ph_safety、synbio_collagen、fda_event_red_flags 完全没实现**） |
  | 别名层 | `matchRuleIngredient` | **无**，纯 `ingSet.has()` 精确匹配 |
  | 严重度推断 | `inferSeverity()` | **无** → `f.severity === "block"` 恒不成立，**禁用成分不会计入 block** |
  | 人群匹配 | `populationApplies()`（正则匹配「孕妇/儿童」） | `r.context.includes(pop)` —— `context` 是中文、`pop` 是 `"pregnant"`，**永远不匹配 → 所有带 context 的人群规则被跳过** |
  | 浓度比对 | 无（见 P0-1） | 无，且连别名都没有 |
- **后果**：AI 客户端（Claude Desktop 等）通过 stdio MCP 查询「配方引擎」时，
  **禁用成分不报阻断、孕妇规则不触发、pH 规则不存在** —— 而工具描述对外宣称「65 规则审查」。
  这条链路正是 `public/llms.txt` + `app/sitemap.js` 明确要喂给 AI 的入口。
- **对照**：`https://opencosmetics.top/api/mcp`（HTTP 版）实测与 Web 端**结论完全一致**，
  因为它复用 `lib/db.js`。**问题只在独立 stdio 版**。
- **修法**：`mcp-server` 改为直接 import 共享引擎（把 `lib/risk_engine.js` 抽出来后
  以 TS 可用的方式导出），或者让 stdio server **只做代理**，全部转给 HTTP 端点。

---

# 五、Web 端（`app/`、`components/`、`lib/i18n.js`）

> 本节全部结论均由**生产环境实测**或**源码逐行核对**得出，命令与返回片段见各条。

## P0-10 生产站 16 个页面里 15 个没有 `<title>`，也没有 meta description

- **位置**：`app/layout.js`（根布局，**没有 `export const metadata`**）
- **实测**（`https://opencosmetics.top`）：

  | 路径 | `<title>` | `<meta name="description">` |
  |---|---|---|
  | `/` | **无** | **无** |
  | `/bench` | **无** | **无** |
  | `/ingredients/RETINOL` | **无** | **无** |
  | `/china` | 有 | 有 |

  逐页扫描 16 个 `page.js`，**只有 `app/china/page.js` 一个导出了 `export const metadata`**；
  根布局也没有 → Next.js 对其余页面**不生成任何 title 标签**（不是空字符串，是根本没有这个标签）。
- **后果**（这条直接打在商业模式上）：
  - `app/sitemap.js` 提交了 **258 个 URL，其中 243 个是原料详情页**，这 243 页**全部无标题无描述** ——
    等于给爬虫递了 243 张白纸。
  - 首页在搜索结果里只能显示裸域名 `opencosmetics.top`。
  - 无 OpenGraph / Twitter card → 微信、微博、X 分享链接**没有预览图和摘要**。
  - 无 `metadataBase` → 后续任何 `openGraph.images` 相对路径都会解析失败。
- **修法**：`app/layout.js` 补 `export const metadata`（`metadataBase` + `title.template` + `description` + `openGraph`）；
  `app/ingredients/[name]/page.js` 补 `generateMetadata`（按原料生成「INCI / 中文名 / 用途 / 法规状态」标题）。
  这是**改动量最小、收益最大**的一条：不动任何业务逻辑，SEO 立竿见影。

## P0-11 EU 禁用状态在搜索接口里恒为 `allowed`，`only=banned` 过滤器永远返回 0

- **位置**：`app/api/ingredients/search/route.js:105`（`eu_status: "allowed"` 硬编码）、`:135`（`only === "banned"` 过滤）
- **实测**：

  ```
  /api/ingredients/search?q=HYDROQUINONE
    HYDROQUINONE                          eu_status=allowed
    2-ACETYLHYDROQUINONE                  eu_status=allowed
    ... 共 7 条，全部 allowed
  /api/ingredients/search?q=HYDROQUINONE&only=banned
    total=0
  ```

  而 `/ingredients/HYDROQUINONE` **详情页正确显示「EU 禁用」** —— 同一份数据，两个接口结论相反。
- **根因**：搜索接口对所有 DB 行直接写死 `eu_status: "allowed"`，**从不 join `annex_ii_prohibited` /
  `annex_iii_restricted` 两张表**；`only=banned` 于是永远筛不出东西。数据库里这两张表是有的
  （`/api/stats` 实测 `eu_annex_ii = 1378`、`eu_annex_iii = 307` 条）。
- **后果**：法规库搜索页是用户查「这个成分能不能用」的主入口，而它对 **1378 个欧盟禁用 + 307 个限量成分
  一律显示「允许」**；唯一能筛禁用成分的 UI 按钮恒返回空集。
- **修法**：`eu_status` 改为从 annex 表 join 得出（`banned` / `restricted` / `allowed` / `unknown`），
  顺便把详情页已有的判定逻辑抽到 `lib/` 共享，两边共用一份。

## P1 级（Web 端）

- **P1-19 「我的配方」编辑链路断在最后一跳** —— `app/formulas/page.js:49` 写
  `sessionStorage.setItem("fl_open_formula", ...)`，**全仓无任何读取方**（grep 只有这一处写入）。
  点开一条已存配方 → 跳转构建器 → 构建器读不到任何东西 → **永远是空配方**。
  这条链路的前半段（列表、删除、导出）都是好的，只有最后一步没接上。
- **P1-20 界面上没有任何语言切换入口** —— `app/layout.js:5` `import LangSwitcher`，但 JSX 里**从未渲染**
  `<LangSwitcher>`（全仓 `<LangSwitcher` 零命中）。于是：
  - 服务端页面读 cookie（`getLangFromCookies`），客户端页面读 `localStorage`（`localStorage.getItem("opencosmetics_lang") || "zh"`）；
  - 而 `LangSwitcher` 是**唯一**会同时写 cookie 和 localStorage 的地方 —— 它不渲染，两边都永远是默认中文。
  - 实测：`Cookie: opencosmetics_lang=en` 时，`/risk`、`/claim`、`/trends`、`/ingredients`、`/formulas`、
    `/substitute`、`/scan`、`/reference`、`/` **仍全部输出中文**。
  - 更糟的是这构成**水合不一致**：服务端按 cookie 渲染英文，客户端按 localStorage 渲染中文。
- **P1-21 `/api/ingredients/search` 的 `total` 被 500 行窗口截断** —— `route.js:83` 的
  `[like, cnLike, 500, 0]` 把 DB 拉取量硬编码为 500 行 / offset 0；`route.js:142` 的 `total = items.length`
  因此是**截断后的数量**，而真实总数在 `total_in_db`。页面 `app/ingredients/page.js:193` 显示的正是 `data.total`。

  | 查询 | 页面显示 `total` | 真实 `total_in_db` | 偏差 |
  |---|---|---|---|
  | `q=水` | 255 | 661 | 低报 61% |
  | `q=a` | 466 | 44,033 | **低报 89 倍** |

  并且 offset 分页只在被截断的 743 条内生效，**第 501 条以后永远翻不到**。
- **P1-22 `/api/stats` 13 个 COUNT 串行执行** —— `app/api/stats/route.js` 在 `for` 循环里逐个 `await query(...)`。
  实测 6 次：0.74 s / 1.05 s / 1.55 s / 1.93 s / 2.89 s / **6.88 s**、另一次 **15.90 s**。
  页脚和首页都把它当「数据接口」直接链出去，用户一点就可能等十几秒。应改为 `Promise.all` 并发。
- **P1-23 对外宣称 65 条风险规则，实际 71 条 —— 而且是硬编码的** ——
  `app/api/stats/route.js` 里 `sources` 数组写死 `{ name: "rules.json", n: 65, ... }`，
  `app/layout.js` 页脚也写死「65 条风险规则」。而 `data/rules.json` 实测 **71 条**。
  更麻烦的是 **`rules.json` 自身也自相矛盾**：

  | 字段 | 值 | 实际 |
  |---|---|---|
  | `rule_stats.total_rules` | 65 | **71** |
  | `rule_stats.by_category` | 15+8+14+10+13+5+6 = **71** | 71 ✅ 各类都对得上 |
  | `rule_stats.block_severity` | 14 | **15** |
  | `rule_stats.warn_severity` | 33 | **18** |
  | 有 `severity` 字段的规则 | — | **33 / 71**，其余 38 条靠 `inferSeverity()` 猜 |

  连带影响：`mcp-server` 的工具描述也宣称「65 规则审查」（见 P0-9）。
- **P1-24 `/api/trends` 失败即白屏，且不报错** —— `app/trends/page.js:55-60`
  `Promise.all([fetch(...), fetch(...)])` **没有 `.catch`**。任一请求失败 → `data` 永远是 `null` →
  `trends = []`、`summary = []` → 页面渲染成**一片空白**，用户完全不知道发生了什么。
- **P1-25 `app/ingredients/page.js` 无请求序号守卫** —— `load()`（`:41-59`）有 try/catch，
  但**没有「只接受最后一次请求结果」的序号判断**（对比 `components/FormulaBuilder.js` 里的 `seq` ref）。
  搜索框 280ms 防抖下快速输入时，**先发后到的旧响应会覆盖新结果**，表现为「输入变了但列表不跟着变」。
- **P1-26 `t()` 不支持 `"both"`，与 API 契约声明不符** —— `lib/i18n.js` 里 `t(key, lang)` 只有
  `if (lang === "en") return en;` 一个分支，**`"both"` 会静默回落成纯中文**；而同文件的 `pickLang()`
  是支持 `"both"`（返回 `zh / en`）。`/api/mcp` 的契约却对外声明 `lang: "zh" | "en" | "both"`。
  同一个语言参数在两个函数里语义不一致。
- **P1-27 a11y：11 处 `<label>` 没有 `htmlFor`、对应控件没有 `id`** ——
  `app/risk/page.js:172/178/187`、`app/claim/page.js:174/183`、`app/formula/page.js:243/252/261`、
  `app/scan/page.js:282`、`app/substitute/page.js:159`、`components/FormulaBuilder.js:295`。
  读屏软件无法把标签和输入框关联（WCAG 1.3.1 / 4.1.2）。

## P2 级（Web 端）

- **P2-23** `next.config.js` **无任何安全响应头** —— 没有 `X-Frame-Options` / `Content-Security-Policy` /
  `Referrer-Policy`，`poweredByHeader` 未关（响应里带 `X-Powered-By: Next.js`）。
- **P2-24** `package.json` 里的 legacy `duckdb` 依赖**从未被 import** —— 实际用的是 `@duckdb/node-api`。
  但它仍留在 `package.json` 和 `next.config.js` 的 `serverExternalPackages` 里，
  实测 `node_modules/duckdb` 占 **89.3 MB**（整个 `node_modules` 440.8 MB，`@duckdb` 36.8 MB）。
- **P2-25** 依赖版本浮动 —— `package.json` 里 `"next": "latest"`、`"react": "latest"`、`"react-dom": "latest"`、
  `"@duckdb/node-api": "latest"`。一次 `npm install` 就能把生产依赖换掉。（已装：next 15.5.23 / react 19.2.8）
- **P2-26** `/api/stats` 的 `by_region.US = 85511` 是**硬编码**，不查 `fda_events` 表 ——
  数据源换了这个数字不会跟着变。
- **P2-27** Web 端死代码 —— `components/Bilingual.js`（含一个 500ms 轮询定时器）**全仓无人 import**；
  `lib/i18n.js` 的 `DICT` 约 339 个 key 里约 195 个（58%）是 v0.x 重设计前的遗留（`nav.*` / `home.*` / `site.*`），
  现已被 `TopNav` 里的硬编码数组取代。

## P3 级（Web 端）

- **P3-28** 页脚把 `/api/stats` 当「API」链接直接给用户 → 用户点进去看到一坨裸 JSON。
- **P3-29** `app/layout.js` import 了 `t` 但全文未使用。
- **P3-30** 多个客户端页维护了 `mounted` 状态却没有实际消费。

---

# 六、优先级建议

> 编号为全局唯一，格式 `P<级别>-<序号>`。括号里是所属章节，便于定位。

**第一批（会让用户拿到错误结论，建议立刻修）**
1. **P0-1**（引擎）浓度上限接上浓度数据 —— `analyze/route.js:59` 把 `pct` 整个丢掉了
2. **P0-2**（引擎）别名层改词边界匹配 —— HYDROXYRETINOIC ACID 不该被当成维 A 酸禁用
3. **P0-3**（引擎）人群规则走别名层 —— 3 条完全死 + 3 条部分死
4. **P0-9**（MCP）stdio server 改共享引擎 —— 现在是个劣化副本
5. **P0-11**（Web）EU 禁用状态改成查 annex 表 —— 法规库现在对 1378 个禁用成分一律说「允许」
6. **P0-10**（Web）补 `metadata` / `generateMetadata` —— 改框架代码即可，SEO 立竿见影

**第二批（部署可信度 / 安全）**
7. **P0-6**（CI）部署失败必须红
8. **P0-8**（CI）签名密钥进 .gitignore
9. **P0-7**（CI）部署回滚

**第三批（Web 端可用性）**
10. **P1-20** 渲染 `LangSwitcher` 并统一 cookie / localStorage 单一真源
11. **P1-19** 补 `fl_open_formula` 的读取方，「我的配方 → 编辑」接通
12. **P1-21** 搜索 `total` 用真实总数 + 修 `LIMIT 500`
13. **P1-22** `/api/stats` 改并发
14. **P1-24** `/api/trends` 补 `.catch` 与错误态
15. **P1-25** 搜索页补请求序号守卫
16. **P1-23** 规则数改成实际统计（顺手修 `rules.json` 内部的 `rule_stats`）

**第四批（App 端可用性）**
17. **P0-4**（Taro）深链参数
18. **P0-5**（Taro）草稿自动保存 + 导航方式
19. **P1-8**（Taro）`> view` → 类选择器（App 端布局目前是塌的）

**第五批（结构性）**
20. **P1-4**（引擎）规则数据分层（ingredient / category / threshold）
21. **P1-5**（引擎）合规重点管控成分独立成表
22. `lib/db.js` 拆出 `lib/risk_engine.js`
23. 依赖钉版本 + 全链路 `npm ci` + `Podfile.lock` 入库
24. **P2-24**（Web）删掉 legacy `duckdb` 依赖（省 89 MB）+ **P2-27** 清理 Web 端死代码

**一条建议：补最小回归测试集。**
11 条 P0 里有 **5 条（P0-1 / P0-2 / P0-3 / P0-11 / P0-9）属于「规则引擎或规则数据写错了，
但没有任何测试网兜住」** —— 它们不是「代码难懂」，是**没人断言过结果**。
最划算的一步不是逐条改，而是先给风险引擎补一组**断言型测试**：
给定「配方 + 人群 + 区域」必须产出哪些 finding、必须**不**产出哪些 finding。
只要有这层网，后面所有规则数据调整都不会再悄悄把结论改反 ——
`rules.json` 里 `total_rules=65` 与实际 71 条长期对不上而无人发现，就是同一个症状。
