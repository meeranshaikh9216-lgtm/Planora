@echo off
title Planora Launcher
color 0b

echo ===================================================
echo             PLANORA - AI STUDY COACH
echo         Launching on Windows Environment
echo ===================================================
echo.

:: Ensure Node.js is on PATH
set "PATH=C:\Program Files\nodejs;C:\Users\waris\AppData\Local\Programs\nodejs;%PATH%"

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found on your system PATH!
    echo Please install Python 3.10+ or add it to PATH.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system PATH!
    pause
    exit /b 1
)

echo [1/3] Starting Python Flask Backend on http://127.0.0.1:5000 ...
cd /d "%~dp0backend"
start "Planora Backend (Flask)" cmd /k "title Planora Backend && color 0a && python run.py"

echo [2/3] Starting React Vite Frontend on http://localhost:3000 ...
cd /d "%~dp0frontend"
start "Planora Frontend (React)" cmd /k "title Planora Frontend && color 09 && set PATH=C:\Program Files\nodejs;C:\Users\waris\AppData\Local\Programs\nodejs;%PATH% && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening Planora in default web browser...
start http://localhost:3000/login

echo.
echo ===================================================
echo  Planora is now RUNNING!
echo  - Frontend UI: http://localhost:3000
echo  - Backend API: http://127.0.0.1:5000
echo  - Admin Login: admin@planora.ai / Admin@123456
echo  - Demo Student: demo@planora.ai / password123
echo ===================================================
echo.
echo (You can close this launcher window. The server windows will stay active.)
timeout /t 5 >nul
exit
