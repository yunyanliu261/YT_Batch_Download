@echo off
setlocal
:: Usage:
::   start_app.bat              Install if needed, build the page, start the server in one window
::                              and open http://localhost:3000 in the browser
::   start_app.bat background   Same, but the server runs without a window (used by
::                              "YouTube Downloader.vbs"); its output goes to server\server.log
::   start_app.bat install      Only install dependencies and build the page (used by the .vbs
::                              on first run, so the progress is visible)

:: Run from the folder this script is in
cd /d "%~dp0"
set "MODE=%~1"
set "URL=http://localhost:3000"

node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is not installed. Please install Node.js 22 or newer from https://nodejs.org/
    if /i not "%MODE%"=="background" pause
    exit /b 1
)

:: yt-dlp needs Node.js 22+ for downloads with cookies (members-only / age-restricted videos)
node -e "process.exit(Number(process.versions.node.split('.')[0]) < 22 ? 1 : 0)"
if errorlevel 1 (
    echo.
    echo [!] Node.js 22 or newer is recommended. Downloads with cookies ^(members-only / age-restricted videos^) need it.
    echo     Current version:
    node --version
    echo     Update from https://nodejs.org/ ^(LTS^). Public videos still work.
    echo.
)

if /i "%MODE%"=="install" goto install

:: Already running: just open the page. Port used by something else: explain and stop.
node scripts\check-ports.js
if errorlevel 2 (
    start "" %URL%
    exit /b 0
)
if errorlevel 1 (
    if /i not "%MODE%"=="background" pause
    exit /b 1
)

:install
:: Install server dependencies if missing (also after updating from a version that used yt-dlp-exec)
:: The Windows yt-dlp.exe does not need Python, so skip youtube-dl-exec's Python check
if not exist "server\node_modules\youtube-dl-exec" (
    echo Installing server dependencies...
    cd server
    set YOUTUBE_DL_SKIP_PYTHON_CHECK=1
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

:: Build the web page every time, so it always matches the current code (takes a few seconds)
echo Building the page...
cd client
call npm run build
if errorlevel 1 (
    cd ..
    echo [!] Building the page failed. See the messages above.
    if /i not "%MODE%"=="background" pause
    exit /b 1
)
cd ..

if /i "%MODE%"=="install" exit /b 0

echo Starting YouTube Downloader...
if /i "%MODE%"=="background" (
    rem /b: no window. ">nul" keeps the server from holding the launcher's log file open.
    start "" /b cmd /c "cd server && node index.js > server.log 2>&1" >nul 2>&1
) else (
    rem cmd /k keeps the window open so startup errors stay readable
    start "YouTube Downloader" cmd /k "cd server && node index.js"
)

node scripts\wait-for-server.js
if errorlevel 1 (
    if /i not "%MODE%"=="background" pause
    exit /b 1
)

start "" %URL%
if /i not "%MODE%"=="background" (
    echo.
    echo YouTube Downloader is running at %URL%
    echo To stop it, press "Quit" on the page or close the "YouTube Downloader" window.
    timeout /t 5 >nul
)
exit /b 0
