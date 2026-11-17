@echo off
title Open Planora Database in DB Browser for SQLite
color 0B

echo.
echo ================================================================
echo  PLANORA - OPEN IN DB BROWSER FOR SQLITE
echo ================================================================
echo.

set "DB_PATH=%~dp0backend\instance\planora.db"
set "DB_BROWSER=C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"
set "DB_BROWSER_X86=C:\Program Files (x86)\DB Browser for SQLite\DB Browser for SQLite.exe"

if not exist "%DB_PATH%" (
    echo [ERROR] Database file not found at:
    echo         %DB_PATH%
    echo.
    echo Trying fallback: %~dp0planora.db
    set "DB_PATH=%~dp0planora.db"
)

if not exist "%DB_PATH%" (
    echo [ERROR] No database file found to open.
    pause
    exit /b 1
)

echo [INFO] Target Database:
echo        %DB_PATH%
echo.

if exist "%DB_BROWSER%" (
    echo [OK] Launching DB Browser for SQLite...
    start "" "%DB_BROWSER%" "%DB_PATH%"
    goto :done
)

if exist "%DB_BROWSER_X86%" (
    echo [OK] Launching DB Browser for SQLite (x86)...
    start "" "%DB_BROWSER_X86%" "%DB_PATH%"
    goto :done
)

echo [WARNING] DB Browser for SQLite was not found in Program Files.
echo Opening the folder containing the database file instead...
explorer /select,"%DB_PATH%"
echo.
echo You can open this file in DB Browser for SQLite manually.
echo Download if needed: https://sqlitebrowser.org/dl/

:done
echo.
echo ================================================================
echo  Done!
echo ================================================================
ping 127.0.0.1 -n 3 >nul
