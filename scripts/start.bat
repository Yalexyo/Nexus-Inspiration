@echo off
chcp 65001 >nul
title Nexus Inspiration Server

echo ============================================
echo   Nexus Inspiration - Starting Server...
echo ============================================
echo.

cd /d C:\Users\admin\Nexus-Inspiration

:: Pull latest code from GitHub
echo [1/4] Pulling latest code from GitHub...
git pull
if errorlevel 1 (
    echo [WARN] git pull failed, continuing with local code...
)
echo.

:: Install dependencies
if not exist "node_modules" (
    echo [2/4] node_modules not found, running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo [2/4] node_modules OK
)

:: Create .env.local if missing
if not exist ".env.local" (
    echo [3/4] .env.local not found, creating...
    echo DB_HOST=172.20.58.37> .env.local
    echo DB_PORT=5432>> .env.local
    echo DB_NAME=mydb>> .env.local
    echo DB_USER=postgreadmin>> .env.local
    echo DB_PASSWORD=PostGre@123>> .env.local
    echo [OK] .env.local created
) else (
    echo [3/4] .env.local OK
)

:: Always rebuild to ensure latest code is compiled
echo [4/4] Building project...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Server starting on port 3000
echo   Local:   http://localhost:3000
echo   Network: http://172.20.58.61:3000
echo.
echo   Press Ctrl+C to stop
echo ============================================
echo.

npx next start -H 0.0.0.0 -p 3000

pause
