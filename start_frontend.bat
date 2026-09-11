@echo off
title Mini ERP - Frontend Web Portal (Port 5173)
cd /d "%~dp0\frontend"
echo ====================================================
echo Starting Mini ERP + CRM Frontend Portal...
echo ====================================================
npm.cmd run dev -- --host
pause
