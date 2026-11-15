# SPHEREx Time-Domain Sky Explorer PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SPHEREx Time-Domain Sky Explorer - NASA Space Apps" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$env:PATH = "$env:LOCALAPPDATA\Programs\nodejs;$env:LOCALAPPDATA\Programs\Python\Python313;$env:LOCALAPPDATA\Programs\Python\Python313\Scripts;$env:PATH"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "[1/2] Starting Backend (FastAPI on port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Write-Host "[2/2] Starting Frontend (Vite React on port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$env:LOCALAPPDATA\Programs\nodejs;' + `$env:PATH; cd '$projectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Waiting 3 seconds for servers to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Opening http://localhost:5173 in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host "Done! Keep the opened terminal windows running." -ForegroundColor Cyan
