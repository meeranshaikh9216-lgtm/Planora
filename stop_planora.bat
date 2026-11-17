@echo off
title Stop Planora
color 0c

echo ===================================================
echo             PLANORA - STOP SERVERS
echo ===================================================
echo.

echo Stopping any running Flask Backend on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Killing Backend PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping any running Vite Frontend on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Killing Frontend PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All Planora servers have been stopped.
timeout /t 3 >nul
exit
