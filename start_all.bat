@echo off
echo ====================================================
echo Launching Mini ERP + CRM Portal (Backend + Frontend)
echo ====================================================

start "Mini ERP Backend (Port 5000)" cmd /k "cd /d %~dp0\backend && node dist/index.js"
start "Mini ERP Frontend (Port 5173)" cmd /k "cd /d %~dp0\frontend && npm.cmd run dev -- --host"

echo.
echo Both servers have been launched in separate windows!
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:5173
echo.
timeout /t 5 >nul
start http://localhost:5173
