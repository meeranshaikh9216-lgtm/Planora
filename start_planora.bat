@echo off
echo ========================================================
echo               STARTING PLANORA AI STUDY COACH
echo ========================================================
echo.

set PATH=C:\Users\waris\AppData\Local\Programs\nodejs;%PATH%

echo [1/2] Starting Flask Backend (Port 5000)...
start "Planora Backend (Flask)" cmd /k "cd /d %~dp0backend && python run.py"

echo [2/2] Starting React Frontend (Port 3000)...
start "Planora Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo Planora is starting!
echo Frontend: http://localhost:3000
echo Backend API: http://127.0.0.1:5000/api
echo Demo Login: demo@planora.ai / password123
echo ========================================================
pause
