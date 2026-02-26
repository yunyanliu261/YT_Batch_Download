@echo off
echo Starting YouTube Downloader...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: Install dependencies if node_modules is missing in server
if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
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
start "YouTube Downloader Backend" cmd /c "cd server && node index.js"

echo Starting Frontend Client...
:: Wait a moment for backend to initialize
timeout /t 2 >nul
cd client
:: Start Vite and open the browser automatically
start "YouTube Downloader Frontend" cmd /c "npm run dev -- --open"

echo.
echo Application started!
echo Please check the opened browser window.
echo Do not close the backend/frontend terminal windows while using the app.
echo.
pause
