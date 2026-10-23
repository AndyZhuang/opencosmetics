#!/usr/bin/env bash
# ============================================================================
# 配方引擎 FormulaLab — 生产部署远端脚本 (在 207.148.66.81 上执行)
#
# 关键设计: 整个部署过程 **只开 1 个 SSH 连接**。
# 这台 VPS 的 fail2ban 对 sshd 极度激进 (历史上 30+ 次封禁, 10 分钟解封),
# 任何"循环式"多次 SSH 都会立刻触发 IP 封禁。
# 所以: 所有远端操作都收敛到这个脚本里跑, 校验走 HTTPS 在本地做。
#
# 用法 (本地): python scripts/deploy.py
# 远端: bash /tmp/deploy_remote.sh
# ============================================================================
set -uo pipefail

REMOTE_DIR=/var/www/opencosmetics
REMOTE_DIR_OLD=/var/www/opencosmetics_v1
TARBALL=/tmp/opencosmetics_upload.tar.gz

log() { echo "[remote] $*"; }
fail() { echo "[remote] FATAL: $*"; exit 1; }

log "1/8 stop service"
systemctl stop opencosmetics 2>/dev/null || true
pkill -9 -f next-server 2>/dev/null || true
sleep 2

log "2/8 backup current release"
rm -rf "$REMOTE_DIR_OLD"
if [ -d "$REMOTE_DIR" ]; then mv "$REMOTE_DIR" "$REMOTE_DIR_OLD"; fi
mkdir -p "$REMOTE_DIR"

log "3/8 extract new release"
[ -f "$TARBALL" ] || fail "tarball not found: $TARBALL"
rm -rf /opencosmetics
tar xzf "$TARBALL" -C / || fail "tar extract failed"
[ -d /opencosmetics ] || fail "unexpected tarball layout (expected /opencosmetics/*)"
cp -a /opencosmetics/. "$REMOTE_DIR/"
rm -rf /opencosmetics

log "4/8 restore persistent DuckDB from backup"
mkdir -p "$REMOTE_DIR/data"
if [ -f "$REMOTE_DIR_OLD/data/bebd.duckdb" ]; then
  cp "$REMOTE_DIR_OLD/data/bebd.duckdb" "$REMOTE_DIR/data/bebd.duckdb"
  log "    restored from backup"
else
  log "    no backup found, using shipped db"
fi

log "5/8 reuse node_modules (package.json unchanged)"
OLD_LOCK_HASH=""
if [ -f "$REMOTE_DIR_OLD/package-lock.json" ]; then
  OLD_LOCK_HASH=$(md5sum "$REMOTE_DIR_OLD/package-lock.json" | cut -d' ' -f1)
fi
NEW_LOCK_HASH=""
if [ -f "$REMOTE_DIR/package-lock.json" ]; then
  NEW_LOCK_HASH=$(md5sum "$REMOTE_DIR/package-lock.json" | cut -d' ' -f1)
fi
if [ -n "$OLD_LOCK_HASH" ] && [ "$OLD_LOCK_HASH" = "$NEW_LOCK_HASH" ] && [ -d "$REMOTE_DIR_OLD/node_modules" ]; then
  cp -a "$REMOTE_DIR_OLD/node_modules" "$REMOTE_DIR/node_modules"
  log "    reused node_modules (lock file unchanged)"
else
  log "    lock file changed -> npm install"
  cd "$REMOTE_DIR" && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -5
  # 服务器到 npm 源可能不通, 装不上就退回旧 node_modules (至少能起来)
  if [ ! -d "$REMOTE_DIR/node_modules/next" ] && [ -d "$REMOTE_DIR_OLD/node_modules" ]; then
    log "    npm install failed, falling back to previous node_modules"
    cp -a "$REMOTE_DIR_OLD/node_modules" "$REMOTE_DIR/node_modules"
  fi
fi

log "6/8 build Next.js"
cd "$REMOTE_DIR" || fail "cd $REMOTE_DIR failed"
NODE_ENV=production npm run build 2>&1 | tail -25
[ -d "$REMOTE_DIR/.next" ] || fail "build produced no .next"

log "7/8 start service"
systemctl daemon-reload
systemctl start opencosmetics
sleep 10

log "8/8 in-server smoke test"
for p in / /bench /formulas /ingredients /risk /api/stats; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$p" || echo 000)
  echo "[remote]   $p -> $code"
done
ACTIVE=$(systemctl is-active opencosmetics 2>/dev/null || echo unknown)
echo "[remote] service=$ACTIVE"
ps aux | grep -E 'next-server' | grep -v grep | head -2
echo "[remote] DONE"
