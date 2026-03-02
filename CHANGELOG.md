# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2024-02-26

### Added
- **"Remember Path" Feature**: Added a checkbox to save the user's preferred download path to browser `localStorage`, automatically filling it in upon the next visit.
- **Smart Duplicate Prevention**: Implemented `yt-dlp` archive tracking (`download_archive.txt`) within channel folders. It automatically skips previously downloaded videos, making channel syncing significantly faster and safer.
- **Channel-based Folder Organization**: The backend now automatically fetches the uploader/channel name before downloading and creates a dedicated subfolder to keep files organized.
- **Granular Metadata Controls**: Replaced the single metadata toggle with specific options for Subtitles (`.vtt`), Thumbnails (`.jpg`/`.webp`), and Info JSON files.
- **Dynamic Metadata Toggle**: The "Select All" button now dynamically changes to "取消全部 (Clear All)" and manages the state of all sub-checkboxes intelligently.
- **System Pre-checks**: Added UI and backend logic to verify Python and FFmpeg are installed and accessible before allowing a download to start.
- **URL Inspector**: Added a "Check URL" button to fetch video count and channel names without starting the download.
- **Windows Automation**: Created `start_app.bat` to seamlessly install dependencies, start both backend and frontend servers in a single terminal window, and close them cleanly.
- **Real-time Logging**: Integrated Server-Sent Events (SSE) to stream `yt-dlp` output directly to the browser UI.

### Fixed
- Fixed an issue where the download path would not default correctly if left empty.
- Corrected package.json versions to use stable release channels.

## [1.0.0] - Initial Setup
### Added
- Basic Node.js Express backend integrating `yt-dlp-exec`.
- Vanilla TypeScript + Vite + Tailwind CSS frontend.
- Core UI for inputting URL, selecting quality (Best, 1080p, 720p, 480p, Audio), and showing download progress logs.
