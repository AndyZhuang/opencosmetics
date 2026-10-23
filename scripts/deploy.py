#!/usr/bin/env python3
"""Deploy open-cosmetics to production (149.28.145.15).

Usage:
  python scripts/deploy.py          # full deploy
  python scripts/deploy.py status   # just check
  python scripts/deploy.py rollback # restore v1 backup

The deploy:
  1. Builds a local tarball (excludes node_modules, .next, .git, scripts, tests)
  2. SCPs to /tmp on server
  3. Stops systemd service opencosmetics
  4. Backs up /var/www/opencosmetics -> /var/www/opencosmetics_v1
  5. Extracts new code to /var/www/opencosmetics
  6. Restores DuckDB from v1 backup (data is local-only)
  7. Reuses node_modules from v1 (no npm install needed)
  8. Runs npm run build
  9. Starts systemd service
  10. Verifies via 10 endpoints

nginx vhost already set up at /etc/nginx/sites-enabled/opencosmetics
  (proxies https://opencosmetics.top -> http://127.0.0.1:3000)
systemd service at /etc/systemd/system/opencosmetics.service
  (Type=simple, ExecStart=/usr/bin/npm start, Restart=always)

[TECHNICAL LESSONS]
- Tar paths in tarball are 'opencosmetics/...' so must extract with
  `tar xzf X.tar.gz -C /` (NOT -C /var/www/) to land in /opencosmetics,
  then move /opencosmetics/* -> /var/www/opencosmetics/.
  OR: tar with `arcname='opencosmetics/'` so extract directly to /var/www/.
- node_modules is heavy (500MB+) and reuses — don't npm install unless
  package.json changed.
- DuckDB is in data/bebd.duckdb (14MB) and must be preserved across deploys
  (it's the persistent DB; rebuilding loses ingested data).
- Build takes ~1 minute; restart takes ~3 seconds.
"""
import os
import sys
import io
import subprocess
import tarfile
import fnmatch
import time
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

LOCAL_REPO = Path("D:/minimax/serverM/opencosmetics")
TARBALL = Path("D:/minimax/serverM/opencosmetics_deploy.tar.gz")
SERVER = "root@149.28.145.15"
REMOTE_TMP = "/tmp/opencosmetics_upload.tar.gz"
REMOTE_DIR = "/var/www/opencosmetics"
REMOTE_DIR_OLD = "/var/www/opencosmetics_v1"

EXCLUDE_DIRS = ("node_modules", ".next", ".git", "dist", ".taro", ".rnbundle", "apps")
EXCLUDE_PATTERNS = (
    "scripts", "test_*.py", "demo_*.py", "show_*.py", "list_*.py",
    "fix_*.py", "check_*.py", "claim_*.json", "*.out",
    "*.tsbuildinfo", "*.err", "*.log", "*.tar.gz",
)
EXCLUDE_SUFFIXES = (".err", ".log")


def ssh(cmd, timeout=180):
    full = f'ssh -o ConnectTimeout=8 -o StrictHostKeyChecking=no {SERVER} "{cmd}"'
    r = subprocess.run(full, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    if r.returncode != 0:
        print(f"  STDERR: {r.stderr[:500]}")
    return r.stdout, r.returncode


def scp_upload(local, remote):
    cmd = f'scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no "{local}" {SERVER}:"{remote}"'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
    if r.returncode != 0:
        print(f"  SCP STDERR: {r.stderr[:500]}")
        raise RuntimeError(f"SCP failed")
    return r.stdout


def is_excluded(rel_path):
    rel_str = str(rel_path).replace("\\", "/")
    for pat in EXCLUDE_PATTERNS:
        if fnmatch.fnmatch(rel_str, pat) or fnmatch.fnmatch(rel_str, f"*/{pat}"):
            return True
    return any(rel_str.endswith(s) for s in EXCLUDE_SUFFIXES)


def build_tarball():
    print("[1/9] Building local tarball...")
    if TARBALL.exists():
        TARBALL.unlink()
    with tarfile.open(TARBALL, "w:gz") as tar:
        for root, dirs, files in os.walk(LOCAL_REPO):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                fp = Path(root) / f
                rel = fp.relative_to(LOCAL_REPO)
                if is_excluded(rel):
                    continue
                # Strip LOCAL_REPO prefix, add to /opencosmetics/ arcname
                tar.add(fp, arcname=Path("opencosmetics") / rel)
    size_mb = TARBALL.stat().st_size / 1024 / 1024
    print(f"  Tarball: {TARBALL} ({size_mb:.1f} MB)")


def upload_tarball():
    print("[2/9] Uploading tarball...")
    scp_upload(str(TARBALL), REMOTE_TMP)
    print("  Uploaded.")


def stop_service():
    print("[3/9] Stopping systemd service...")
    ssh("systemctl stop opencosmetics || true")
    ssh("sleep 2; pkill -9 -f next-server || true; sleep 1")
    print("  Stopped.")


def backup_and_swap():
    print("[4/9] Backup + extract...")
    ssh(f"rm -rf {REMOTE_DIR_OLD}")
    ssh(f"mv {REMOTE_DIR} {REMOTE_DIR_OLD} 2>/dev/null || true")
    ssh(f"mkdir -p {REMOTE_DIR}")
    # Extract to /opencosmetics/ then copy into REMOTE_DIR
    ssh("rm -rf /opencosmetics")
    ssh(f"tar xzf {REMOTE_TMP} -C /")
    ssh(f"cp -a /opencosmetics/. {REMOTE_DIR}/")
    ssh(f"rm -rf /opencosmetics")
    print("  Swapped.")


def restore_data():
    print("[5/9] Restoring DuckDB from v1 backup...")
    ssh(f"mkdir -p {REMOTE_DIR}/data")
    # If v1 backup has the file, copy it. Otherwise the new deploy's tarball has it.
    out, _ = ssh(f"ls {REMOTE_DIR_OLD}/data/bebd.duckdb 2>/dev/null && echo EXISTS || echo MISSING")
    if "EXISTS" in out:
        ssh(f"cp {REMOTE_DIR_OLD}/data/bebd.duckdb {REMOTE_DIR}/data/bebd.duckdb")
        print("  Restored from v1 backup.")
    else:
        print("  Using new deploy's DuckDB (v1 missing).")


def copy_node_modules():
    print("[6/9] Copying node_modules from v1 backup...")
    out, _ = ssh(f"ls {REMOTE_DIR_OLD}/node_modules 2>/dev/null | wc -l")
    n = int(out.strip()) if out.strip().isdigit() else 0
    if n > 100:
        ssh(f"cp -a {REMOTE_DIR_OLD}/node_modules {REMOTE_DIR}/node_modules")
        print(f"  Reused v1's node_modules ({n} entries).")
    else:
        print(f"  v1 has no node_modules ({n} entries), running npm install...")
        ssh(f"cd {REMOTE_DIR} && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -3", timeout=300)


def build():
    print("[7/9] Building Next.js...")
    out, rc = ssh(f"cd {REMOTE_DIR} && NODE_ENV=production npm run build 2>&1 | tail -10", timeout=300)
    if rc != 0:
        print("  BUILD FAILED:")
        print(out)
        raise RuntimeError("Build failed")
    print("  Build done.")


def start_service():
    print("[8/9] Starting systemd service...")
    ssh("systemctl start opencosmetics")
    time.sleep(8)
    out, _ = ssh("systemctl is-active opencosmetics; ps aux | grep -E 'next-server' | grep -v grep | head -2")
    print(out)


def verify():
    print("[9/9] Verifying endpoints...")
    paths = [
        "/", "/bench", "/formulas", "/china", "/ingredients", "/risk", "/regulatory",
        "/fda", "/sources", "/formula", "/substitute", "/claim", "/reference", "/scan",
        "/trends", "/api/mcp", "/api/stats",
        "/api/workbench/analyze", "/api/ingredients/search", "/api/formula/cost",
        "/api/formulas", "/api/formula/compare", "/api/formula/export",
    ]
    for p in paths:
        code, _ = ssh(f"curl -s -o /dev/null -w '%{{http_code}}' http://127.0.0.1:3000{p}", timeout=10)
        flag = "OK" if code == "200" else "!!"
        print(f"  {flag} {p:<28} -> {code}")
    # POST 冒烟: 工作台分析 + 成本
    post = (
        "curl -s -X POST http://127.0.0.1:3000/api/workbench/analyze "
        "-H 'Content-Type: application/json' "
        "-d '{\"ingredients\":\"AQUA, GLYCERIN, NIACINAMIDE\"}' "
        "-o /dev/null -w '%{http_code}'"
    )
    code, _ = ssh(post, timeout=30)
    print(f"  {'OK' if code.strip() == '200' else '!!'} POST /api/workbench/analyze -> {code.strip()}")
    # Test public HTTPS too
    print("\n  Public HTTPS:")
    import urllib.request
    for p in ["/", "/bench", "/formulas", "/formula", "/api/mcp"]:
        try:
            r = urllib.request.urlopen(f"https://opencosmetics.top{p}", timeout=15)
            print(f"  OK https://opencosmetics.top{p:<14} -> {r.status}")
        except Exception as e:
            print(f"  !! https://opencosmetics.top{p:<14} -> {e}")


def status():
    print("=== SERVICE ===")
    out, _ = ssh("systemctl status opencosmetics --no-pager 2>&1 | head -8")
    print(out)
    print("\n=== PROCS ===")
    out, _ = ssh("ps aux | grep -E 'next-server' | grep -v grep | head -2")
    print(out or "(none)")
    print("\n=== PORT ===")
    out, _ = ssh("ss -tlnp 2>/dev/null | grep ':3000' || echo 'no port 3000'")
    print(out)


def rollback():
    print("=== ROLLBACK ===")
    ssh("systemctl stop opencosmetics || true")
    ssh("pkill -9 -f next-server || true")
    ssh(f"rm -rf {REMOTE_DIR} && mv {REMOTE_DIR_OLD} {REMOTE_DIR}")
    ssh("systemctl start opencosmetics")
    time.sleep(5)
    out, _ = ssh("systemctl is-active opencosmetics")
    print(f"  Status: {out.strip()}")


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            return status()
        if cmd == "rollback":
            return rollback()

    print("=" * 60)
    print("DEPLOY open-cosmetics -> 149.28.145.15 (opencosmetics.top)")
    print("=" * 60)
    build_tarball()
    upload_tarball()
    stop_service()
    backup_and_swap()
    restore_data()
    copy_node_modules()
    build()
    start_service()
    verify()
    print("\n" + "=" * 60)
    print("DEPLOY COMPLETE")
    print("=" * 60)
    print("Live: https://opencosmetics.top")
    print("Rollback: python scripts/deploy.py rollback")


if __name__ == "__main__":
    main()
