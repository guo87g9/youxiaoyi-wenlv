#!/usr/bin/env bash
# ============================================================================
# 邮小驿 · 现场演示一键启动（macOS / Linux）
# ----------------------------------------------------------------------------
# 做三件事：
#   1. 缺产物就先构建
#   2. 用局域网模式起代理（同源托管 dist + /ask）
#   3. 打印手机该访问的地址
#
# 用法：
#   export DEEPSEEK_API_KEY=sk-xxxx     # 或者直接跑，脚本会提示你粘贴
#   bash tools/demo.sh
# ============================================================================
set -e
cd "$(dirname "$0")/.."

echo ""
echo "  邮小驿 · 现场演示模式"
echo "  --------------------------------------------"

if ! command -v node >/dev/null 2>&1; then
  echo "  ✗ 没找到 node，先装 Node 18 或更高版本：https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ✗ Node 版本太低（当前 $(node -v)），需要 18+"
  exit 1
fi

if [ -z "$DEEPSEEK_API_KEY" ]; then
  printf "  粘贴 DeepSeek API Key（直接回车则只跑离线模式）："
  read -r DEEPSEEK_API_KEY
  export DEEPSEEK_API_KEY
fi

if [ ! -f dist/index.html ]; then
  echo "  产物不存在，先构建一次…"
  python3 tools/build.py >/dev/null 2>&1 || { echo "  ✗ 构建失败，手动跑 python3 tools/build.py 看报错"; exit 1; }
  echo "  构建完成"
fi

echo ""
exec node tools/proxy.mjs --lan
