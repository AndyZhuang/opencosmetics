#!/usr/bin/env python3
"""Deploy open-cosmetics (配方引擎 FormulaLab) to production (207.148.66.81).

Usage:
    python scripts/deploy.py          # full deploy
    python scripts/deploy.py status   # service status (1 ssh)
    python scripts/deploy.py rollback # restore previous release (1 ssh)

[连接次数纪律 —— 重要]
    生产机是 207.148.66.81 (域名 opencosmetics.top 的 A 记录指向它)。
    注意: 早期脚本里写的 149.28.145.15 是**旧 IP**, 现在那条 IP 的 22 端口
    从公网不通 (表现为连接超时), 曾被误判成 fail2ban 封禁。
    这台 VPS 的 fail2ban 对 sshd 也确实激进, 所以整个部署 **只允许 3 次 SSH 连接**:
        1) scp  代码包
        2) scp  远端脚本
        3) ssh  执行远端脚本 (远端内部做 stop/backup/extract/build/start/smoke)
    部署后的校验全部走公网 HTTPS, **不再开 SSH**。

[The deploy]
    1. 本地打 tarball (排除 node_modules/.next/.git/apps/dist)
    2. scp tarball + deploy_remote.sh
    3. 一次 ssh 跑完远端全部步骤
    4. 本地用 HTTPS 校验 20+ 端点 (含一次 POST)

nginx vhost: /etc/nginx/sites-enabled/opencosmetics
systemd:     /etc/systemd/system/opencosmetics.service
"""
import io
import json
import os
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

LOCAL_REPO_DEFAULT = Path("D:/minimax/serverM/opencosmetics")
LOCAL_REPO = Path(
    os.environ.get("DEPLOY_LOCAL_REPO")
    or (LOCAL_REPO_DEFAULT if LOCAL_REPO_DEFAULT.exists() else Path.cwd())
)
TARBALL = Path(
    os.environ.get(
        "DEPLOY_TARBALL",
        str(LOCAL_REPO.parent / "opencosmetics_deploy.tar.gz")
        if LOCAL_REPO == LOCAL_REPO_DEFAULT
        else str(LOCAL_REPO / "opencosmetics_deploy.tar.gz"),
    )
)
REMOTE_SCRIPT_LOCAL = LOCAL_REPO / "deploy_remote.sh"
SERVER = os.environ.get("DEPLOY_SERVER", "root@207.148.66.81")
REMOTE_TMP = "/tmp/opencosmetics_upload.tar.gz"
REMOTE_SCRIPT = "/tmp/deploy_remote.sh"
REMOTE_DIR = "/var/www/opencosmetics"
REMOTE_DIR_OLD = "/var/www/opencosmetics_v1"
PUBLIC = os.environ.get("DEPLOY_PUBLIC", "https://opencosmetics.top")

# CI 用: 私钥与 known_hosts 由仓库 Secrets 注入
SSH_IDENTITY = os.environ.get("DEPLOY_SSH_KEY")
SSH_KNOWN_HOSTS = os.environ.get("DEPLOY_KNOWN_HOSTS")

EXCLUDE_DIRS = ("node_modules", ".next", ".git", "dist", ".taro", ".rnbundle", "apps", "build")
EXCLUDE_NAMES = ("deploy_remote.sh",)
EXCLUDE_PATTERNS = (
    "scripts", "test_*.py", "demo_*.py", "show_*.py", "list_*.py",
    "fix_*.py", "check_*.py", "claim_*.json", "*.out",
    "*.tsbuildinfo", "*.err", "*.log", "*.tar.gz",
)
EXCLUDE_SUFFIXES = (".err", ".log")


def _ssh_opts():
    """SSH/scp 公共参数: CI 场景下用注入的私钥 + 固定的 known_hosts。"""
    opts = ["-o ConnectTimeout=15", "-o StrictHostKeyChecking=no"]
    if SSH_IDENTITY:
        opts += ["-i", SSH_IDENTITY]
    if SSH_KNOWN_HOSTS:
        opts += ["-o", f"UserKnownHostsFile={SSH_KNOWN_HOSTS}", "-o", "StrictHostKeyChecking=yes"]
    return " ".join(opts)


def ssh(cmd, timeout=900):
    full = f'ssh {_ssh_opts()} {SERVER} "{cmd}"'
    r = subprocess.run(full, shell=True, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=timeout)
    if r.returncode != 0:
        print(f"  SSH STDERR: {r.stderr[:600]}")
    return r.stdout, r.returncode


def scp_upload(local, remote):
    cmd = f'scp {_ssh_opts()} "{local}" {SERVER}:"{remote}"'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=600)
    if r.returncode != 0:
        print(f"  SCP STDERR: {r.stderr[:600]}")
        raise RuntimeError(f"SCP failed: {local}")
    print(f"  uploaded {Path(local).name}")


def is_excluded(rel_path):
    rel_str = str(rel_path).replace("\\", "/")
    if rel_str in EXCLUDE_NAMES:
        return True
    for pat in EXCLUDE_PATTERNS:
        if rel_str == pat or rel_str.endswith("/" + pat) or rel_str.startswith(pat + "/"):
            return True
    return any(rel_str.endswith(s) for s in EXCLUDE_SUFFIXES)


def build_tarball():
    print("[1/4] Building local tarball...")
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
                tar.add(fp, arcname=Path("opencosmetics") / rel)
    size_mb = TARBALL.stat().st_size / 1024 / 1024
    print(f"  Tarball: {TARBALL} ({size_mb:.1f} MB)")


def upload():
    print("[2/4] Uploading (2 scp)...")
    scp_upload(str(TARBALL), REMOTE_TMP)
    scp_upload(str(REMOTE_SCRIPT_LOCAL), REMOTE_SCRIPT)


def run_remote():
    print("[3/4] Running remote deploy (1 ssh)...")
    out, rc = ssh(f"bash {REMOTE_SCRIPT}", timeout=900)
    print(out)
    if rc != 0:
        raise RuntimeError("Remote deploy returned non-zero")
    if "[remote] FATAL" in out or "[remote] DONE" not in out:
        raise RuntimeError("Remote deploy did not complete cleanly")


def verify():
    print("[4/4] Verifying over public HTTPS (no ssh)...")
    paths = [
        "/", "/bench", "/formulas", "/china", "/ingredients", "/risk", "/regulatory",
        "/fda", "/sources", "/formula", "/substitute", "/claim", "/reference", "/scan",
        "/trends", "/api/mcp", "/api/stats",
        "/api/ingredients/search?q=niacinamide", "/api/formulas",
    ]
    bad = 0
    for p in paths:
        try:
            r = urllib.request.urlopen(f"{PUBLIC}{p}", timeout=20)
            code = r.status
        except Exception as e:
            code = getattr(e, "code", f"ERR {e}")
        flag = "OK" if code == 200 else "!!"
        if code != 200:
            bad += 1
        print(f"  {flag} {p:<40} -> {code}")

    print("\n  POST /api/workbench/analyze:")
    try:
        req = urllib.request.Request(
            f"{PUBLIC}/api/workbench/analyze",
            data=json.dumps({"ingredients": "AQUA, GLYCERIN, NIACINAMIDE, SQUALANE"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=40) as r:
            body = json.loads(r.read().decode("utf-8"))
        cost = body.get("cost", {}).get("totals", {}).get("total_per_kg")
        risk = body.get("risk", {}).get("summary")
        ok = bool(body.get("ok")) and cost is not None
        if not ok:
            bad += 1
        print(f"  {'OK' if ok else '!!'} status={r.status} risk={risk} cost_per_kg={cost}")
    except Exception as e:
        bad += 1
        print(f"  !! {e}")

    print("\n  POST /api/formula/cost:")
    try:
        req = urllib.request.Request(
            f"{PUBLIC}/api/formula/cost",
            data=json.dumps({"lines": [{"inci_name": "AQUA", "pct": 70},
                                       {"inci_name": "NIACINAMIDE", "pct": 4}]}).encode("utf-8"),
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=40) as r:
            body = json.loads(r.read().decode("utf-8"))
        per_kg = body.get("totals", {}).get("total_per_kg")
        ok = per_kg is not None
        if not ok:
            bad += 1
        print(f"  {'OK' if ok else '!!'} per_kg={per_kg}")
    except Exception as e:
        bad += 1
        print(f"  !! {e}")

    return bad


def status():
    print("=== SERVICE ===")
    out, _ = ssh("systemctl status opencosmetics --no-pager 2>&1 | head -10")
    print(out)
    print("=== PORT ===")
    out, _ = ssh("ss -tlnp 2>/dev/null | grep ':3000' || echo 'no port 3000'")
    print(out)


def rollback():
    print("=== ROLLBACK ===")
    out, rc = ssh(
        f"systemctl stop opencosmetics 2>/dev/null; pkill -9 -f next-server 2>/dev/null; "
        f"rm -rf {REMOTE_DIR} && mv {REMOTE_DIR_OLD} {REMOTE_DIR} && "
        f"systemctl start opencosmetics && sleep 6 && systemctl is-active opencosmetics"
    )
    print(out)


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            return status()
        if cmd == "rollback":
            return rollback()

    print("=" * 62)
    print("DEPLOY 配方引擎 FormulaLab -> 207.148.66.81 (opencosmetics.top)")
    print("=" * 62)
    build_tarball()
    upload()
    run_remote()
    bad = verify()
    print("\n" + "=" * 62)
    print(f"DEPLOY COMPLETE — {PUBLIC}   (异常端点: {bad})")
    print("=" * 62)


if __name__ == "__main__":
    main()
