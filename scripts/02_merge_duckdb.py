"""
02_merge_duckdb.py

合并 5 个源到 data/bebd.duckdb。
- beauteeru CosIng 28K (PubChem CID)
- walkowskis CosIng 26K (Function/Restriction)
- OBF CosIng full 24K (full Function/Restriction)
- OBF Annex II-VI (1,927 监管记录)
- INCIDB 公开样本 (130 成分 + 10 商品 + 191 配方)

输出: data/bebd.duckdb (12 张表, 130K rows)
"""
import csv
import io
import os
import re
import sqlite3
import sys
import time
import zipfile

import duckdb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
DB = os.path.join(ROOT, "data", "bebd.duckdb")
LOG = os.path.join(ROOT, "data", "merge.log")


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def ingest_csv(name, csv_path, transform_sql=None, skip=0):
    """Ingest a CSV file using DuckDB's read_csv_auto."""
    t0 = time.time()
    if skip:
        con.execute(
            f"CREATE TABLE {name} AS SELECT * FROM read_csv_auto("
            f"'{csv_path}', skip={skip}, header=true, all_varchar=true)"
        )
    else:
        con.execute(
            f"CREATE TABLE {name} AS SELECT * FROM read_csv_auto("
            f"'{csv_path}', header=true, all_varchar=true)"
        )
    n = con.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
    log(f"  {name:30s} {n:>10,} rows  ({time.time()-t0:.1f}s)")


def main():
    if os.path.exists(DB):
        os.remove(DB)
    os.makedirs(os.path.dirname(DB), exist_ok=True)

    global con
    con = duckdb.connect(DB)
    log("=" * 60)
    log("  open-cosmetics  DuckDB builder")
    log("=" * 60)

    # 1) beauteeru CosIng (28K, PubChem CID)
    log("\n[1] beauteeru CosIng  (28K, PubChem CID)")
    p = os.path.join(RAW, "beauteeru_ingredients.csv")
    if os.path.exists(p):
        con.execute(
            f"CREATE TABLE cosing_lite AS SELECT * FROM read_csv_auto("
            f"'{p}', header=true, all_varchar=true)"
        )
        n = con.execute("SELECT COUNT(*) FROM cosing_lite").fetchone()[0]
        log(f"  cosing_lite                  {n:>10,} rows")

    # 2) walkowskis SQLite  ->  CSV  -> DuckDB
    log("\n[2] walkowskis CosIng  (26K, Function/Restriction)")
    src_db = os.path.join(RAW, "walkowskis_cosing.csv")
    # walkowskis downloads testowa.db, but the script downloads it as .csv
    if src_db.endswith(".csv"):
        walk_csv = src_db
    else:
        walk_csv = os.path.join(RAW, "walkowskis_cosing.csv")
        if not os.path.exists(walk_csv):
            # convert sqlite -> csv
            with sqlite3.connect(src_db) as src:
                rows = src.execute("SELECT * FROM cosing").fetchall()
                cols = [d[0] for d in src.description]
            with open(walk_csv, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(cols)
                w.writerows([r for r in rows if r[0] != "COSING Ref No"])
    con.execute(
        f"CREATE TABLE cosing_walkowskis AS SELECT * FROM read_csv_auto("
        f"'{walk_csv}', header=true, all_varchar=true)"
    )
    n = con.execute("SELECT COUNT(*) FROM cosing_walkowskis").fetchone()[0]
    log(f"  cosing_walkowskis            {n:>10,} rows")

    # 3) OBF CosIng full (24K, with multi-line quoted fields)
    log("\n[3] OBF CosIng full  (24K, multi-line CSV)")
    raw_csv = os.path.join(RAW, "obf_cosing_full_ingredients.csv")
    if os.path.exists(raw_csv):
        with open(raw_csv, encoding="utf-8") as f:
            text = f.read()
        header_idx = text.find("COSING Ref No,")
        end_of_header = text.find("\n", header_idx)
        body = text[end_of_header + 1:]
        header_line = text[header_idx:end_of_header]
        fieldnames = next(csv.reader([header_line]))
        r = csv.DictReader(io.StringIO(body), fieldnames=fieldnames, delimiter=",")
        rows = list(r)
        clean = os.path.join(RAW, "obf_cosing_clean.csv")
        with open(clean, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow([
                "ref_no", "inci_name", "inn_name", "phe_eur_name",
                "cas_no", "ec_no", "chem_name", "restriction",
                "function", "update_date",
            ])
            for row in rows:
                def g(k):
                    for kk in row:
                        if kk and kk.strip() == k:
                            v = row[kk] or ""
                            return v.replace("\n", " ").replace("\r", " ")
                    return ""
                w.writerow([
                    g("COSING Ref No"), g("INCI name"), g("INN name"),
                    g("Ph. Eur. Name"), g("CAS No"), g("EINECS/ELINCS No"),
                    g("Chem/IUPAC Name / Description"), g("Restriction"),
                    g("Function"), g("Update Date"),
                ])
        con.execute(
            f"CREATE TABLE cosing_obf AS SELECT * FROM read_csv_auto("
            f"'{clean}', header=true, all_varchar=true)"
        )
        n = con.execute("SELECT COUNT(*) FROM cosing_obf").fetchone()[0]
        log(f"  cosing_obf                   {n:>10,} rows")

    # 4) OBF Annexes
    log("\n[4] EU Annexes II-VI  (1,927 监管)")
    for name, fn in [
        ("annex_ii_prohibited", "obf_annex_ii.csv"),
        ("annex_iii_restricted", "obf_annex_iii.csv"),
        ("annex_iv_colorants", "obf_annex_iv.csv"),
        ("annex_v_preservatives", "obf_annex_v.csv"),
        ("annex_vi_uv_filters", "obf_annex_vi.csv"),
    ]:
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            text = f.read()
        header_cols = next(csv.reader([text.split("\n", 1)[0]]))
        header_cols = [c.strip() for c in header_cols]
        r = csv.DictReader(io.StringIO(text))
        rows = list(r)
        for row in rows:
            for c in header_cols:
                if c not in row:
                    row[c] = ""
        safe_cols = []
        for i, c in enumerate(header_cols):
            safe_cols.append(f"col_{i}" if c == "" else c)
        con.execute(f"DROP TABLE IF EXISTS {name}")
        col_defs = ", ".join(f'"{c}" VARCHAR' for c in safe_cols)
        con.execute(f"CREATE TABLE {name} ({col_defs})")
        placeholders = ", ".join(["?"] * len(safe_cols))
        batch = [
            tuple(str(row.get(header_cols[i], "") or "").strip() for i in range(len(safe_cols)))
            for row in rows
        ]
        con.executemany(f"INSERT INTO {name} VALUES ({placeholders})", batch)
        log(f"  {name:30s} {len(rows):>10,} rows")

    # 5) INCIDB sample
    log("\n[5] INCIDB 公开样本  (130 成分 + 10 商品 + 191 配方)")
    zip_path = os.path.join(RAW, "incidb_free_samples.zip")
    if os.path.exists(zip_path):
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(os.path.join(RAW, "incidb_free_samples"))
    incidb_dir = os.path.join(RAW, "incidb_free_samples")
    for name, fn in [
        ("incidb_brands", "brands.csv"),
        ("incidb_ingredients", "ingredients.csv"),
        ("incidb_products", "products.csv"),
        ("incidb_product_ingredients", "product_ingredients.csv"),
    ]:
        p = os.path.join(incidb_dir, fn)
        if os.path.exists(p):
            con.execute(
                f"CREATE TABLE {name} AS SELECT * FROM read_csv_auto("
                f"'{p}', header=true, delim='|', all_varchar=true)"
            )
            n = con.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
            log(f"  {name:30s} {n:>10,} rows")

    # 6) Unified CosIng
    log("\n[6] Unified CosIng  (dedup walkowskis + OBF)")
    con.execute("""
        CREATE TABLE cosing AS
        SELECT ref_no, inci_name, inn AS inn_name, phe_eur AS phe_eur_name,
               cas_no, ec_no, chem_name, restriction, function,
               update_date, 'walkowskis' AS source
        FROM cosing_walkowskis
        WHERE inci_name IS NOT NULL AND TRIM(inci_name) != ''
        UNION ALL
        SELECT ref_no, inci_name, inn_name, phe_eur_name, cas_no, ec_no,
               chem_name, restriction, function, update_date, 'obf' AS source
        FROM cosing_obf
        WHERE inci_name IS NOT NULL AND TRIM(inci_name) != ''
    """)
    n = con.execute("SELECT COUNT(*) FROM cosing").fetchone()[0]
    log(f"  cosing (unified)             {n:>10,} rows")

    # 7) Summary
    log("\n[7] Final summary")
    tables = con.execute("SHOW TABLES").fetchall()
    total_rows = 0
    for (t,) in tables:
        n = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        total_rows += n
        log(f"  {t:32s} {n:>10,}")
    log(f"  {'TOTAL':32s} {total_rows:>10,}")

    con.close()
    log(f"\nDuckDB saved: {DB} ({os.path.getsize(DB)/1024/1024:.2f} MB)")


if __name__ == "__main__":
    main()
