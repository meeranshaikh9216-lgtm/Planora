@echo off
title Planora - Stopping Services
echo.
echo  Stopping Planora services...
echo.

:: Kill processes on port 5000 (Flask backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " ^| findstr "LISTEN"') do (
    echo  Stopping backend (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes on port 3000 (Vite frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTEN"') do (
    echo  Stopping frontend (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  All Planora services stopped.
echo.
timeout /t 2 /nobreak >nul
