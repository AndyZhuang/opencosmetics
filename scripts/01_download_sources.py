"""
01_download_sources.py

下载 open-cosmetics 项目的 5 个公开源。
所有源都是公开 / 公共领域 / robots.txt 允许, 0 法律风险。

输出: data/raw/*.csv
"""
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
os.makedirs(RAW, exist_ok=True)

UA = "Mozilla/5.0 (open-cosmetics research; +https://github.com/AndyZhuang/opencosmetics)"

SOURCES = [
    # (filename, jsDelivr CDN URL)
    (
        "beauteeru_ingredients.csv",
        "https://cdn.jsdelivr.net/gh/beauteeru/cosmetic-ingredients-dataset@main/ingredients.csv",
        "beauteeru EU CosIng 28K (PubChem CID)",
    ),
    (
        "walkowskis_cosing.csv",
        "https://cdn.jsdelivr.net/gh/walkowskis/CosIng_database_finder@main/testowa.db",
        "walkowskis EU CosIng SQLite 26K (Function/Restriction)",
    ),
    (
        "obf_annex_ii.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Annex.II_v2.csv",
        "EU 禁用 1,378",
    ),
    (
        "obf_annex_iii.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Annex.III_v2.csv",
        "EU 限用 307",
    ),
    (
        "obf_annex_iv.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Annex.IV_v2.csv",
        "EU 着色剂 153",
    ),
    (
        "obf_annex_v.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Annex.V_v2.csv",
        "EU 防腐剂 61",
    ),
    (
        "obf_annex_vi.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Annex.VI_v2.csv",
        "EU 防晒剂 28",
    ),
    (
        "obf_cosing_full_ingredients.csv",
        "https://cdn.jsdelivr.net/gh/openfoodfacts/openbeautyfacts@develop/cosing/COSING_Ingredients-Fragrance.Inventory_v2.csv",
        "OBF CosIng full 24K (Function/Restriction full)",
    ),
    (
        "incidb_free_samples.zip",
        "https://raw.githubusercontent.com/INCIDB/cosmetics-skincare-inci-database/main/samples/incidb_free_samples.zip",
        "INCIDB 公开样本 (130 成分 + 10 商品 + 191 配方)",
    ),
]


def fetch(url, dest, timeout=120):
    """Download with progress logging."""
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        dt = time.time() - t0
        return len(data), dt
    except Exception as e:
        return None, str(e)


def main():
    print("=" * 64)
    print("  open-cosmetics  data source downloader")
    print("=" * 64)
    print(f"\nOutput dir: {RAW}\n")

    total = 0
    for fname, url, desc in SOURCES:
        dest = os.path.join(RAW, fname)
        size, dt = fetch(url, dest)
        if size:
            print(f"  ✓ {fname:42s} {size/1024:>8.1f} KB  ({dt:.1f}s)  — {desc}")
            total += size
        else:
            print(f"  ✗ {fname:42s} FAIL: {dt}")
    print(f"\nTotal: {total/1024/1024:.2f} MB downloaded to {RAW}")
    print("\nNext step: python scripts/02_merge_duckdb.py")


if __name__ == "__main__":
    main()
