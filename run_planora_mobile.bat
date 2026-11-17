@echo off
title Planora Mobile PWA Server Launcher
color 0b

echo ========================================================
echo       PLANORA -- AI STUDY COACH MOBILE PWA
echo ========================================================
echo.

:: Detect current active IPv4 Address
for /f "tokens=4" %%a in ('route print 0.0.0.0 ^| findstr 0.0.0.0 ^| findstr /v "Default"') do set IP=%%a
if "%IP%"=="" set IP=127.0.0.1

echo [1/3] Starting Backend API Server (Port 5000)...
start "Planora Backend (Port 5000)" /min cmd /c "cd /d %~dp0backend && python run.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Frontend PWA Dev Server (Port 3000)...
start "Planora Frontend (Port 3000)" /min cmd /c "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Mobile PWA Servers are ACTIVE!
echo.
echo ========================================================
echo   ACCESS URLS FOR YOUR MOBILE PHONE:
echo ========================================================
echo   Local Wi-Fi URL:  http://%IP%:3000
echo   Public HTTPS URL: https://planora-study.loca.lt
echo ========================================================
echo.
echo Leave this window open while testing on your phone.
echo Press any key to stop all Planora services...
pause >nul

echo Stopping Planora services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo Done!
