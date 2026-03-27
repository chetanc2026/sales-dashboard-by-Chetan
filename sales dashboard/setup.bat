@echo off
REM Sales Dashboard - Quick Setup Script for Windows

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Sales Dashboard Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: PostgreSQL might not be in PATH
    echo Make sure PostgreSQL server is running
)

echo Checking Node.js and npm versions...
node -v
npm -v
echo.

REM Setup Backend
echo Setting up Backend...
cd backend
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit backend\.env and set your DATABASE_URL
    echo Example: postgresql://postgres:password@localhost:5432/sales_dashboard
    echo.
)

echo Installing backend dependencies...
call npm install

REM Run migrations
echo.
echo Setting up database...
call node scripts/migrate.js

REM Optional: Seed data
echo.
echo Would you like to seed sample data? (Y/N)
set /p seed_choice="Enter choice: "
if /i "!seed_choice!"=="Y" (
    call node scripts/seed.js
)

cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend

if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo Make sure REACT_APP_API_URL matches your backend URL
    echo Default: http://localhost:5000/api
    echo.
)

echo Installing frontend dependencies...
call npm install

cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with correct DATABASE_URL
echo 2. Edit frontend\.env with correct REACT_APP_API_URL
echo 3. Start backend: cd backend && npm run dev
echo 4. Start frontend: cd frontend && npm start
echo.
echo Demo Credentials:
echo   Email: admin@dashboards.com
echo   Password: admin123
echo.
pause
