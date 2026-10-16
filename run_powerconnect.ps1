# PowerConnect - Electricity Theft Intelligence Platform (Phase 7)
# PowerShell Development Startup Script

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " POWERCONNECT - ELECTRICITY THEFT INTELLIGENCE PLATFORM (PHASE 7)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify Python
try {
    $pyVersion = python --version 2>&1
    Write-Host "[1/3] Python environment verified: $pyVersion" -ForegroundColor Green
} catch {
    Write-Error "Python is not installed or not in PATH."
    exit 1
}

# Verify Node
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[2/3] Node.js environment verified: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "Node.js is not installed or not in PATH."
    exit 1
}

Write-Host ""
Write-Host "[3/3] Launching PowerConnect services:" -ForegroundColor Yellow
Write-Host "  - FastAPI Backend: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - Swagger Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Health Check:    http://127.0.0.1:8000/api/health" -ForegroundColor White
Write-Host "  - Vite Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Default Seed Accounts (Password: Utility@2026):" -ForegroundColor Magenta
Write-Host "  - Employee:    emp001" -ForegroundColor Gray
Write-Host "  - Consumer:    cons_01" -ForegroundColor Gray
Write-Host "  - Board Admin: board_admin" -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "Services started! Open http://localhost:5173 in your browser." -ForegroundColor Green
