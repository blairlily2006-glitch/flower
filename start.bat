@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  node server.mjs
) else (
  "C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1119-907-0_26.1119.907.0_x64__3k8sg7r9htsxt\dependencies\node\bin\node.exe" server.mjs
)
pause
