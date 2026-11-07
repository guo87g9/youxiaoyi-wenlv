@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo   邮小驿 · 现场演示模式
echo   --------------------------------------------

where node >nul 2>nul
if errorlevel 1 (
  echo   [X] 没找到 node，先装 Node 18 或更高版本: https://nodejs.org/
  pause
  exit /b 1
)

if "%DEEPSEEK_API_KEY%"=="" (
  set /p DEEPSEEK_API_KEY=  粘贴 DeepSeek API Key（直接回车则只跑离线模式）:
)

if not exist "dist\index.html" (
  echo   产物不存在，先构建一次...
  python tools\build.py
  if errorlevel 1 (
    echo   [X] 构建失败
    pause
    exit /b 1
  )
)

echo.
node tools\proxy.mjs --lan
pause
