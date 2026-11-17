@echo off
title Planora AI Study Coach - Startup
color 0A

echo.
echo  ================================================================
echo   PLANORA AI STUDY COACH - Starting All Services
echo   Plan. Learn. Revise. Improve.
echo  ================================================================
echo.

:: Set paths
set "PLANORA_DIR=%~dp0"
set "BACKEND_DIR=%PLANORA_DIR%backend"
set "FRONTEND_DIR=%PLANORA_DIR%frontend"
set "DB_PATH=%BACKEND_DIR%\instance\planora.db"
set "NODE_PATH=C:\Program Files\nodejs"
set "NODE_PATH2=C:\Users\%USERNAME%\AppData\Local\Programs\nodejs"

:: Add node to PATH
set "PATH=%NODE_PATH%;%NODE_PATH2%;%PATH%"

echo  [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)
echo  [OK] Python found.

echo.
echo  [2/4] Backing up database...
if exist "%DB_PATH%" (
    python "%BACKEND_DIR%\backup_db.py" backup
    echo  [OK] Database backed up.
) else (
    echo  [INFO] No existing database - will create fresh one.
)

echo.
echo  [3/4] Starting Flask Backend on http://localhost:5000 ...
start "Planora Backend" cmd /k "cd /d "%BACKEND_DIR%" && python run.py"
timeout /t 3 /nobreak >nul

echo.
echo  [4/4] Starting React Frontend on http://localhost:3000 ...
start "Planora Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && set "PATH=%NODE_PATH%;%NODE_PATH2%;%PATH%" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo  ================================================================
echo   All services started!
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000
echo   API Health: http://localhost:5000/api/health
echo.
echo   Database:  %DB_PATH%
echo.
echo   CLOSE THIS WINDOW ONLY AFTER STOPPING THE OTHER WINDOWS.
echo  ================================================================
echo.
start "" "http://localhost:3000"
pause
