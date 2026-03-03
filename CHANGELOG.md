# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-03

### Added
- **Dual-Language Support (i18n)**: Implemented full language switching between English and Traditional Chinese (繁體中文). The preference is saved locally.
- **"Remember Path" Feature**: Added a checkbox to save the user's preferred download path to browser `localStorage`, automatically filling it in upon the next visit.
- **Smart Duplicate Prevention**: Implemented `yt-dlp` archive tracking (`download_archive.txt`) within channel folders. It automatically skips previously downloaded videos, making channel syncing significantly faster and safer.
- **Channel-based Folder Organization**: The backend now automatically fetches the uploader/channel name before downloading and creates a dedicated subfolder to keep files organized.
- **Granular Metadata Controls**: Replaced the single metadata toggle with specific options for Subtitles (`.vtt`), Thumbnails (`.jpg`/`.webp`), and Info JSON files.
- **System Pre-checks**: Added UI and backend logic to verify Python and FFmpeg are installed and accessible before allowing a download to start.
- **URL Inspector**: Added a "Check URL" button to fetch video count and channel names without starting the download.
- **Windows Automation**: Created `start_app.bat` to seamlessly install dependencies, start both backend and frontend servers in a single terminal window, and close them cleanly.
- **Real-time Logging**: Integrated Server-Sent Events (SSE) to stream `yt-dlp` output directly to the browser UI.
- **Footer Link**: Added a GitHub icon and source code link to the bottom of the UI.

### Changed
- **Dynamic Metadata Toggle**: Refined the "Select All" button to dynamically change to "取消全部 (Clear All)" when any sub-options are active, acting as a true "Clear All" action rather than just a passive state indicator.

### Fixed
- Fixed an issue where the download path would not default correctly if left empty.
- Corrected package.json versions to use stable release channels.

## [1.0.0] - 2026-02-16
### Added
- Basic Node.js Express backend integrating `yt-dlp-exec`.
- Vanilla TypeScript + Vite + Tailwind CSS frontend.
- Core UI for inputting URL, selecting quality (Best, 1080p, 720p, 480p, Audio), and showing download progress logs.
