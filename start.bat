@echo off
title SPHEREx Time-Domain Sky Explorer Launcher
color 0B
echo ========================================================
echo   SPHEREx Time-Domain Sky Explorer - NASA Space Apps
echo ========================================================
echo.

:: Ensure Python and Node.js are on PATH
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%LOCALAPPDATA%\Programs\Python\Python313;%LOCALAPPDATA%\Programs\Python\Python313\Scripts;%PATH%"

echo Checking environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not detected in default path.
) else (
    echo [OK] Node.js is ready.
)

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python not detected in default path.
) else (
    echo [OK] Python is ready.
)
echo.

echo [1/2] Launching Backend Server (FastAPI on port 8000)...
start "SPHEREx Backend (FastAPI)" cmd /k "title SPHEREx Backend && set PATH=%LOCALAPPDATA%\Programs\Python\Python313;%LOCALAPPDATA%\Programs\Python\Python313\Scripts;%PATH% && cd /d %~dp0backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend Server (Vite React on port 5173)...
start "SPHEREx Frontend (Vite)" cmd /k "title SPHEREx Frontend && set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH% && cd /d %~dp0frontend && npm run dev"

echo.
echo Waiting for servers to initialize...
ping 127.0.0.1 -n 4 >nul

echo.
echo ========================================================
echo   Servers are running!
echo   Local App: http://localhost:5173
echo   API Docs:  http://localhost:8000/docs
echo ========================================================
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo Giu cua so nay de xem trang thai. Nhan phim bat ky de thoat launcher...
pause >nul
