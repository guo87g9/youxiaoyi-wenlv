#!/usr/bin/env bash
# 邮小驿 · GitHub 推送脚本
# ---------------------------------------------------------------
# 用法（沙箱/本机均可）：
#   1) 先在 GitHub 建好空仓库（不要勾选 README/.gitignore，保持全空）
#   2) 运行： bash tools/push_github.sh git@github.com:<你的账号>/<仓库名>.git
#      或 HTTPS：bash tools/push_github.sh https://github.com/<账号>/<仓库名>.git
#
# Token 处理：
#   - SSH 方式：用你本机的 ~/.ssh 私钥，无需 token
#   - HTTPS 方式：脚本从环境变量 GITHUB_TOKEN 读取（不会打印、不会写盘）
#     若未设置，会提示你 export GITHUB_TOKEN=<personal access token> 后重跑
#
# 脚本只做三件事：设置 remote → 推送 main → 回读远端分支确认
set -euo pipefail

REPO_URL="${1:-}"
if [ -z "$REPO_URL" ]; then
  echo "用法: bash tools/push_github.sh <仓库地址>"
  echo "示例: bash tools/push_github.sh git@github.com:yourname/youxiaoyi.git"
  exit 1
fi

cd "$(dirname "$0")/.."

# config.js 含天地图 key，确认没被误提交
if git ls-files --error-unmatch app/config.js >/dev/null 2>&1; then
  echo "✗ app/config.js 已被 git 跟踪（含 key），先执行： git rm --cached app/config.js"
  exit 1
fi

# HTTPS 地址自动注入 token（用环境变量，不落盘、不回显）
PUSH_URL="$REPO_URL"
case "$REPO_URL" in
  https://*)
    if [ -z "${GITHUB_TOKEN:-}" ]; then
      echo "✗ HTTPS 推送需要 token：export GITHUB_TOKEN=<你的 PAT> 后重跑"
      echo "  （或改用 SSH：bash tools/push_github.sh git@github.com:账号/仓库.git）"
      exit 1
    fi
    PUSH_URL="https://oauth2:${GITHUB_TOKEN}@${REPO_URL#https://}"
    ;;
esac

git remote remove origin 2>/dev/null || true
git remote add origin "$PUSH_URL"

echo "→ 推送 main 到 $REPO_URL"
git push -u origin main

echo "→ 回读远端"
git ls-remote --heads origin main

echo "✓ 完成。仓库地址： ${REPO_URL%.git}"
