@echo off
TITLE PowerConnect - Electricity Theft Intelligence Platform
echo =====================================================================
echo  POWERCONNECT - ELECTRICITY THEFT INTELLIGENCE PLATFORM (PHASE 7)
echo =====================================================================
echo.
echo [1/3] Verifying Python Environment...
python --version
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

echo [2/3] Verifying Node.js Environment...
node --version
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Services:
echo   - FastAPI Backend: http://127.0.0.1:8000
echo   - Swagger Docs:    http://127.0.0.1:8000/docs
echo   - Health Check:    http://127.0.0.1:8000/api/health
echo   - Vite Frontend:   http://localhost:5173
echo.
echo Default Seed Accounts (Password: Utility@2026):
echo   - Employee:    emp001
echo   - Consumer:    cons_01
echo   - Board Admin: board_admin
echo =====================================================================
echo.

start "PowerConnect Backend (Port 8000)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

cd frontend
start "PowerConnect Frontend (Port 5173)" cmd /k "npm run dev"
cd ..

echo.
echo Both services launched in dedicated terminal windows.
echo To access the platform, open your browser to: http://localhost:5173
echo.
pause
