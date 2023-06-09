@echo off
echo "Starting installation..."

setlocal

rem Check if Node.js is installed
where node > nul 2>&1
if %errorlevel% equ 0 (
  rem Node.js is installed, start index.js
  start node index.js
) else (
  rem Node.js is not installed, show error message
  echo Error: Node.js is not installed.
  START	https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi
  pause
)