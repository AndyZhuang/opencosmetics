// app/bench/page.js — 配方构建器
import Link from "next/link";
import FormulaBuilder from "../../components/FormulaBuilder";

export const dynamic = "force-dynamic";

export default function BenchPage() {
  return (
    <>
      <div className="page-title" style={{ marginTop: 28 }}>配方构建器</div>
      <p className="page-lede">
        逐行录入 INCI、浓度与相位, 右侧实时给出成本结构、法规状态与 65 条风险规则的命中情况。
        不用注册, 草稿存在你自己这台设备上。
      </p>
      <FormulaBuilder />
      <div style={{ marginTop: 20, fontSize: 12.5, color: "var(--muted)" }}>
        想从成品反推? 用 <Link href="/formula">配方反查</Link> · 想从功效出发? 用 <Link href="/claim">目标反推</Link> · 需要现成骨架? 看 <Link href="/reference">参考配方库</Link>
      </div>
    </>
  );
}
