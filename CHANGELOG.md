# Changelog

All notable changes to this project will be documented in this file.

## [2024-05-18]
- Created `PROJECT_STRUCTURE.md` to provide detailed documentation on the project architecture and the purpose of each file and directory.
- Updated the repository link in the UI footer to point to `https://github.com/yunyanliu261/YT_Batch_Download`.
- Updated `README.md` to reflect the new repository URL.
- Added comprehensive troubleshooting documentation in `README.md` to explain common `yt-dlp` errors:
  - Explained `Requested format is not available` as a DRM restriction mechanism by YouTube.
  - Explained `Could not copy Chrome cookie database` and provided instructions on how to resolve browser cookie locking issues by fully closing Chrome or using an alternative browser.

## [1.1.0] - 2026-03-03

### Added
- **[2026-03-03] Dual-Language Support (i18n)**: Implemented full language switching between English and Traditional Chinese (繁體中文). The preference is saved locally.
- **[2026-03-03] "Remember Path" Feature**: Added a checkbox to save the user's preferred download path to browser `localStorage`, automatically filling it in upon the next visit.
- **[2026-03-03] Smart Duplicate Prevention**: Implemented `yt-dlp` archive tracking (`download_archive.txt`) within channel folders. It automatically skips previously downloaded videos, making channel syncing significantly faster and safer.
- **[2026-03-03] Channel-based Folder Organization**: The backend now automatically fetches the uploader/channel name before downloading and creates a dedicated subfolder to keep files organized.
- **[2026-03-03] Granular Metadata Controls**: Replaced the single metadata toggle with specific options for Subtitles (`.vtt`), Thumbnails (`.jpg`/`.webp`), and Info JSON files.
- **[2026-03-03] System Pre-checks**: Added UI and backend logic to verify Python and FFmpeg are installed and accessible before allowing a download to start.
- **[2026-03-03] URL Inspector**: Added a "Check URL" button to fetch video count and channel names without starting the download.
- **[2026-03-03] Windows Automation**: Created `start_app.bat` to seamlessly install dependencies, start both backend and frontend servers in a single terminal window, and close them cleanly.
- **[2026-03-03] Footer Link**: Added a GitHub icon and source code link to the bottom of the UI.
- **[2026-02-16] Real-time Logging**: Integrated Server-Sent Events (SSE) to stream `yt-dlp` output directly to the browser UI.

### Changed
- **[2026-03-03] Dynamic Metadata Toggle**: Refined the "Select All" button to dynamically change to "取消全部 (Clear All)" when any sub-options are active, acting as a true "Clear All" action rather than just a passive state indicator.

### Fixed
- **[2026-03-03] Config Setup**: Corrected package.json versions to use stable release channels.
- **[2026-02-16] Default Path**: Fixed an issue where the download path would not default correctly if left empty.

## [1.0.0] - Initial Release
### Added
- **[2026-02-16] Backend Architecture**: Basic Node.js Express backend integrating `yt-dlp-exec`.
- **[2026-02-16] Frontend Framework**: Vanilla TypeScript + Vite + Tailwind CSS frontend.
- **[2026-02-16] Core UI**: Core UI for inputting URL, selecting quality (Best, 1080p, 720p, 480p, Audio), and showing download progress logs.
