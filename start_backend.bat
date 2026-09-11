@echo off
title Mini ERP - Backend Server (Port 5000)
cd /d "%~dp0\backend"
echo ====================================================
echo Starting Mini ERP + CRM Backend Server...
echo ====================================================
node dist/index.js
pause
