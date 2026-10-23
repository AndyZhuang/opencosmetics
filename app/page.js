// app/page.js — 配方引擎工作台首页
// 定位: 工具优先。不是宣传页, 是干活的地方。
import Link from "next/link";
import { cookies } from "next/headers";
import { getLangFromCookies } from "../lib/i18n";
import { query } from "../lib/db";
import QuickAnalyze from "../components/QuickAnalyze";
import { profileMeta } from "../lib/ingredient_profiles";

export const dynamic = "force-dynamic";

const TOOLS = [
  { href: "/bench", tag: "BUILD", title: "配方构建器", desc: "逐行录入 INCI + 用量 + 相位, 实时出成本、法规状态与 65 条风险规则命中。", flag: "核心" },
  { href: "/risk", tag: "CHECK", title: "风险审查", desc: "兼容性 / pH / 浓度上限 / 特殊人群 / 区域法规 / 合成生物 / FDA 事件, 7 类 65 条规则。" },
  { href: "/substitute", tag: "SWAP", title: "成分替代", desc: "被禁、太贵、断货或法规不过, 找同功能位替代原料。" },
  { href: "/claim", tag: "BRIEF", title: "目标反推", desc: "从功效诉求反推活性物组合、建议浓度与基质结构。" },
  { href: "/reference", tag: "LIB", title: "参考配方库", desc: "20 个经典商业配方的完整 INCI 表, 可直接拉进构建器改。" },
  { href: "/formula", tag: "REVERSE", title: "配方反查", desc: "给一段成品成分表, 反推品类、活性、基质、价位带与目标人群。" },
  { href: "/ingredients", tag: "SEARCH", title: "成分库", desc: "5 万条 CosIng + 9000 条 IECIC, 带角色、典型用量与价格区间检索。" },
  { href: "/trends", tag: "MARKET", title: "行业趋势", desc: "跨数据源的热门成分与功效方向, 供选品立项参考。" },
  { href: "/china", tag: "CN", title: "中国 IECIC", desc: "NMPA 现行目录 + 2025 调整段落 + 合成生物备案要点。" },
  { href: "/fda", tag: "US", title: "FDA 事件库", desc: "8.5 万条 FDA 化妆品事件, 4 维聚合, 查某成分的黑历史。" },
];

async function liveCounts() {
  const out = { cosing: null, iecic: null, fda: 85511, rules: 65, profiles: 0 };
  try {
    const [a, b] = await Promise.all([
      query("SELECT COUNT(*) AS n FROM cosing"),
      query("SELECT COUNT(*) AS n FROM cn_iecic_i"),
    ]);
    out.cosing = Number(a?.[0]?.n || 0);
    out.iecic = Number(b?.[0]?.n || 0);
  } catch { /* DB 不可用时退回静态值 */ }
  try {
    const meta = profileMeta();
    out.profiles = meta?.count || 0;
  } catch { /* ignore */ }
  return out;
}

export default async function Home() {
  const lang = await getLangFromCookies(await cookies());
  const isZh = lang !== "en";
  const c = await liveCounts();

  const trust = [
    { n: c.cosing?.toLocaleString() ?? "50,169", l: isZh ? "EU CosIng 成分条目" : "EU CosIng entries", s: "EU 现行化妆品目录" },
    { n: c.iecic?.toLocaleString() ?? "8,985", l: isZh ? "中国 IECIC 现行成分" : "CN IECIC ingredients", s: "NMPA 2025-06-23 公告" },
    { n: c.fda.toLocaleString(), l: isZh ? "FDA 化妆品事件" : "FDA cosmetic events", s: "openFDA 全量" },
    { n: String(c.rules), l: isZh ? "条风险规则" : "risk rules", s: "7 大类别" },
    { n: String(c.profiles), l: isZh ? "项原料画像" : "material profiles", s: "角色 / 用量 / 价格" },
  ];

  return (
    <>
      {/* ---------- Hero: 工具优先 ---------- */}
      <section className="wb-hero">
        <div className="wb-hero-grid">
          <div>
            <div className="wb-eyebrow">Formulation Workbench</div>
            <h1 className="wb-title">
              把一个配方<br />算到<em>能上市</em>的程度
            </h1>
            <p className="wb-lede">
              配方师真正要花时间的是交叉核对: 这个成分能不能卖、成本多少、会不会打架。
              配方引擎把这三件事放进同一个工作台 —— 边建边算, 一次给出结论, 不再开五个网页。
            </p>
            <div className="wb-cta-row">
              <Link className="oc-btn" href="/bench">开始建配方</Link>
              <Link className="oc-btn oc-btn-ghost" href="/ingredients">查成分库</Link>
              <Link className="oc-btn oc-btn-ghost" href="/formulas">我的配方</Link>
            </div>
            <div className="wb-proof">
              <span><b>CN</b> / <b>EU</b> / <b>US</b> 三区法规同步</span>
              <span><b>65</b> 条风险规则</span>
              <span><b>247</b> 项原料价格画像</span>
              <span>无需注册, 免费调用</span>
            </div>
          </div>
          <QuickAnalyze />
        </div>
      </section>

      {/* ---------- 快捷入口 ---------- */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">三步开工</div>
          <div className="section-sub">不需要写代码, 不需要注册</div>
        </div>
        <div className="wb-quick">
          <Link className="wb-quick-card" href="/bench">
            <span className="k">STEP 01</span>
            <h3>建配方</h3>
            <p>逐行填 INCI、浓度、相位。边填边看角色识别、浓度是否超限、成本怎么分布。</p>
            <span className="go">打开构建器 →</span>
          </Link>
          <Link className="wb-quick-card" href="/risk">
            <span className="k">STEP 02</span>
            <h3>过规则</h3>
            <p>65 条规则扫一遍: 成分打架、pH 不对、浓度超标、孕妇禁用、某区禁用, 全部列出来。</p>
            <span className="go">跑风险审查 →</span>
          </Link>
          <Link className="wb-quick-card" href="/substitute">
            <span className="k">STEP 03</span>
            <h3>换掉问题成分</h3>
            <p>被禁的、太贵的、断货的, 找同功能位的替代原料, 直接带用量和价格回配方。</p>
            <span className="go">找替代 →</span>
          </Link>
        </div>
      </section>

      {/* ---------- 工具矩阵 ---------- */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">
            全部工具
            <span className="badge">10</span>
          </div>
          <Link className="section-link" href="/api/stats">数据接口 →</Link>
        </div>
        <div className="wb-tools">
          {TOOLS.map((t) => (
            <Link className="wb-tool" key={t.href} href={t.href}>
              <div className="wb-tool-top">
                <h3>{t.title}</h3>
                {t.flag && <span className="flag">{t.flag}</span>}
              </div>
              <p>{t.desc}</p>
              <span className="tag">{t.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- 数据可信度 ---------- */}
      <section className="section">
        <div className="section-header">
          <div className="section-title">数据底座</div>
          <div className="section-sub">全部可追溯到官方来源</div>
        </div>
        <div className="wb-trust">
          {trust.map((t) => (
            <div className="wb-trust-cell" key={t.l}>
              <div className="n">{t.n}</div>
              <div className="l">{t.l}</div>
              <div className="s">{t.s}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
