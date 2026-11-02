@echo off
cd /d "%~dp0"
echo ========================================================
echo  AICTE SD/FDR Portal - Pushing to YashGarg1638/SIH26265
echo  Team Yash
echo ========================================================
echo.

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH!
    echo Please install Git from: https://git-scm.com/download/win
    echo After installing, run this file again.
    pause
    exit /b 1
)

echo Initializing Git repository...
if not exist ".git" (
    git init
    git branch -M main
)

echo Adding all updated files...
git add .

echo Creating commit...
git commit -m "feat: AICTE SD/FDR Portal by Team Yash - Obsidian Dark Theme & Command Center"

echo Setting remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/YashGarg1638/SIH26265.git

echo Pushing to GitHub (main branch)...
git push -u origin main --force

echo.
echo ========================================================
echo  SUCCESS: Code pushed to https://github.com/YashGarg1638/SIH26265
echo ========================================================
pause
