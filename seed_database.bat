@echo off
echo ========================================================
echo               SEEDING PLANORA DATABASE
echo ========================================================
echo.

cd /d %~dp0backend
python seed_data.py

echo.
echo Database seeded successfully!
pause
