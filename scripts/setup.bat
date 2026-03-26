@echo off
chcp 65001 >nul
title Nexus Inspiration - Full Setup

echo ============================================
echo   Nexus Inspiration - Full Setup
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node -v

:: Check Git
where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git is not installed!
    echo Please download and install from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git found:
git --version

echo.

:: Clone or pull
if exist "C:\Users\admin\Nexus-Inspiration" (
    echo [OK] Project folder exists, pulling latest code...
    cd /d C:\Users\admin\Nexus-Inspiration
    git pull
) else (
    echo [*] Cloning project...
    cd /d C:\Users\admin
    git clone https://github.com/Yalexyo/Nexus-Inspiration.git
    cd Nexus-Inspiration
)

echo.

:: Install dependencies
echo [*] Installing dependencies...
cd /d C:\Users\admin\Nexus-Inspiration
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Create .env.local
if not exist ".env.local" (
    echo [*] Creating .env.local...
    echo DB_HOST=172.20.58.37> .env.local
    echo DB_PORT=5432>> .env.local
    echo DB_NAME=mydb>> .env.local
    echo DB_USER=postgreadmin>> .env.local
    echo DB_PASSWORD=PostGre@123>> .env.local
    echo [OK] .env.local created
) else (
    echo [OK] .env.local already exists
)

:: Build
echo [*] Building project...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Build complete

:: Firewall rule
echo [*] Adding firewall rule for port 3000...
netsh advfirewall firewall delete rule name="Nexus3000" >nul 2>nul
netsh advfirewall firewall add rule name="Nexus3000" dir=in action=allow protocol=tcp localport=3000 >nul 2>nul
echo [OK] Firewall rule added

echo.
echo ============================================
echo   Setup complete! Starting server...
echo   Local:   http://localhost:3000
echo   Network: http://172.20.58.61:3000
echo.
echo   Press Ctrl+C to stop
echo ============================================
echo.

npx next start -H 0.0.0.0 -p 3000

pause
