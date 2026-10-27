@echo off
:: Stop YouTube Downloader (for example when it was started with "YouTube Downloader.vbs"
:: and the page is already closed). Downloads in progress are stopped.
cd /d "%~dp0"
node scripts\stop-server.js
if errorlevel 1 pause
timeout /t 3 >nul
