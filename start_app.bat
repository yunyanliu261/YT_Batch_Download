@echo off
:: Run from the folder this script is in
cd /d "%~dp0"
echo Starting YouTube Downloader...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Stop if another copy of the app (for example an older version) is still using the ports
node scripts\check-ports.js
if %errorlevel% neq 0 (
    pause
    exit /b 1
)

:: Install server dependencies if missing (also after updating from a version that used yt-dlp-exec)
:: The Windows yt-dlp.exe does not need Python, so skip youtube-dl-exec's Python check
if not exist "server\node_modules\youtube-dl-exec" (
    echo Installing server dependencies...
    cd server
    set YOUTUBE_DL_SKIP_PYTHON_CHECK=1
    call npm install
    cd ..
)

:: Install dependencies if node_modules is missing in client
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo Starting Backend Server...
:: cmd /k keeps the window open so startup errors stay readable
start "YouTube Downloader Backend" cmd /k "cd server && node index.js"

echo Starting Frontend Client...
:: Wait a moment for backend to initialize
timeout /t 2 >nul
cd client
:: Start Vite and open the browser automatically (--strictPort: fail instead of silently using another port)
start "YouTube Downloader Frontend" cmd /k "npm run dev -- --open --strictPort"

echo.
echo Application started!
echo Please check the opened browser window.
echo Do not close the backend/frontend terminal windows while using the app.
echo.
pause
