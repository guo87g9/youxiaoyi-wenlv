#!/usr/bin/env -S bash
# 邮小驿 · GitHub 推送脚本
# ---------------------------------------------------------------
# 用法：
#   bash tools/push_github.sh <仓库地址> [token]
#   或先 export GITHUB_TOKEN=<PAT>，再 bash tools/push_github.sh <仓库地址>
#
# 三种仓库地址都支持：
#   git@github.com:guo87g9l/yxy.git
#   https://github.com/guo87g9l/yxy.git
#   guo87g9l/yxy                       （简写，默认走 HTTPS）
#
# Token 说明：优先取第 2 个参数，其次取环境变量 GITHUB_TOKEN。
# 脚本不会把 token 写进 git config，也不会打印；推送时临时注入 URL。
# 需要权限：repo（public/private 仓库都是）。
set -euo pipefail

ARG_URL="${1:-}"
ARG_TOKEN="${2:-}"
TOKEN="${ARG_TOKEN:-${GITHUB_TOKEN:-}}"

die() { echo "✗ $*" >&2; exit 1; }

[ -n "$ARG_URL" ] || {
  echo "用法: bash tools/push_github.sh <仓库地址> [token]"
  echo "示例: bash tools/push_github.sh guo87g9l/youxiaoyi"
  exit 1
}

cd "$(dirname "$0")/.."
git rev-parse --git-dir >/dev/null 2>&1 || die "当前目录不是 git 仓库"

# ---------- 安全检查：含天地图 key 的 config.js 不能入库 ----------
if git ls-files --error-unmatch app/config.js >/dev/null 2>&1; then
  die "app/config.js 已被 git 跟踪（含天地图 key）。先执行：git rm --cached app/config.js"
fi

# ---------- 归一化仓库地址 ----------
case "$ARG_URL" in
  *://*|git@*) REPO_URL="$ARG_URL" ;;
  */*)         REPO_URL="https://github.com/${ARG_URL}.git" ;;
  *)           die "仓库地址格式不对：$ARG_URL" ;;
esac
REPO_URL="${REPO_URL%.git}.git"
SLUG="${REPO_URL#https://github.com/}"; SLUG="${SLUG#git@github.com:}"; SLUG="${SLUG%.git}"
echo "→ 仓库：$SLUG"

# ---------- 推送地址（HTTPS 时注入 token，但不落到 config） ----------
case "$REPO_URL" in
  https://*)
    [ -n "$TOKEN" ] || die "HTTPS 推送需要 token：bash tools/push_github.sh $SLUG <你的 PAT>"
    PUSH_URL="https://oauth2:${TOKEN}@github.com/${SLUG}.git"
    ;;
  *) PUSH_URL="$REPO_URL" ;;
esac

# ---------- 校验 token 有效性与账号 ----------
if [ -n "$TOKEN" ]; then
  RESP=$(curl -s --max-time 15 -H "Authorization: Bearer $TOKEN" \
         -H "Accept: application/vnd.github+json" https://api.github.com/user || true)
  OWNER=$(printf '%s' "$RESP" | grep -o '"login"[[:space:]]*:[[:space:]]*"[^"]*' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)
  if [ -z "$OWNER" ]; then
    die "token 无效或已过期（GitHub 返回：$(printf '%s' "$RESP" | head -c 80)）。请重新生成 PAT，勾选 repo 权限。"
  fi
  echo "→ 账号：$OWNER（token 有效）"
fi

# ---------- 推送 ----------
git remote remove origin 2>/dev/null || true
git remote add origin "$PUSH_URL"
echo "→ 推送 main ..."
if ! git push -u origin main 2>&1 | sed "s|${TOKEN:-__none__}|***|g"; then
  echo "" >&2
  echo "推送失败，常见原因：" >&2
  echo "  1) 远端仓库不存在 → 先在 GitHub 网页建一个空仓库（不要勾 README/gitignore）" >&2
  echo "  2) token 无 repo 权限 → 重新生成 PAT 并勾选 repo" >&2
  echo "  3) 远端已有 main 且历史不同 → git push -u origin main --force（确认远端是空仓库再用）" >&2
  git remote set-url origin "$REPO_URL"
  exit 1
fi

git remote set-url origin "$REPO_URL"   # 推完把 token 从 config 里摘掉
echo "→ 回读远端："
git ls-remote --heads origin main
echo "✓ 完成：https://github.com/${SLUG}"
