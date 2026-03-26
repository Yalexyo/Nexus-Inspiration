@echo off
chcp 65001 >nul
title Nexus Inspiration Server

echo ============================================
echo   Nexus Inspiration - Starting Server...
echo ============================================
echo.

cd /d C:\Users\admin\Nexus-Inspiration

if not exist "node_modules" (
    echo [!] node_modules not found, running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

if not exist ".env.local" (
    echo [!] .env.local not found, creating...
    echo DB_HOST=172.20.58.37> .env.local
    echo DB_PORT=5432>> .env.local
    echo DB_NAME=mydb>> .env.local
    echo DB_USER=postgreadmin>> .env.local
    echo DB_PASSWORD=PostGre@123>> .env.local
    echo [OK] .env.local created
)

if not exist ".next" (
    echo [!] Build not found, building project...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
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
