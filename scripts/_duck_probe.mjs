// 临时探针: 验证 DuckDB READ_ONLY 下同进程二次打开的行为
import { DuckDBInstance } from "@duckdb/node-api";

const p = "D:/minimax/serverM/opencosmetics/data/bebd.duckdb";

async function tryOpen(label, opts) {
  try {
    const inst = await DuckDBInstance.create(p, opts);
    const conn = await inst.connect();
    const res = await conn.runAndReadAll("SELECT count(*) AS c FROM cosing");
    console.log(label, "OK ->", JSON.stringify(res.getRows()));
    return { inst, conn };
  } catch (e) {
    console.log(label, "FAIL ->", String(e.message).split("\n")[0]);
    return null;
  }
}

const a = await tryOpen("first (READ_ONLY)", { access_mode: "READ_ONLY" });
if (a) {
  const b = await tryOpen("second (READ_ONLY, same process)", { access_mode: "READ_ONLY" });
  const c = await tryOpen("third (no opts, same process)", undefined);
  console.log("---- result:", { a: !!a, b: !!b, c: !!c });
}
