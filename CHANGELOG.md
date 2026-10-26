# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-10-26

### Security
- Backend now listens on `127.0.0.1` only (was all network interfaces).
- Requests from other websites are rejected (Origin check + restricted CORS), and non-local `Host` headers are rejected to block DNS rebinding. Previously any web page could start downloads or create folders.
- URLs must be `http(s)://`. Values starting with `--` were passed to yt-dlp as command-line options.
- Download path must be absolute.
- Video titles in the URL check panel are rendered as text instead of HTML.

### Fixed
- Downloads with "Thumbnail" checked always ended with `ffprobe not found` and did not record `download_archive.txt`. Thumbnails are now saved as `.jpg` files next to the video instead of being embedded.
- Closing the page or cancelling now stops yt-dlp instead of letting it keep downloading in the background.
- Uploaded cookie files are now cleaned up when the client disconnects.
- `npm install` no longer fails on systems without a `python` command (Ubuntu ships only `python3`).

### Added
- Cancel button while a download is running.
- Progress bars for the current file and for the whole playlist/channel (yt-dlp output is now parsed on the server).
- Playlists are saved to `<channel>/<playlist title>/`. The download archive stays in the channel folder, so videos already downloaded with earlier versions are still skipped.
- `start_app.sh` for macOS / Linux.
- Start scripts check that ports 3000 and 5173 are free first. Before, if an older copy was still running, the new backend failed silently and the page kept talking to the old one (downloads went to the old folder). The backend also prints a clear message when its port is taken, Vite no longer switches to another port silently (`--strictPort`), and the Windows server windows stay open so errors can be read.
- Download summary when a download finishes (downloaded / skipped / failed) with an explanation for each failure type: members-only, age-restricted, bot check, private, region-blocked, DRM/format, unavailable. When the failures could be fixed by signing in and no cookies were given, the Cookies option is highlighted.
- Random 5–30 second wait before each video of a playlist/channel to avoid YouTube rate limits (PR #2). Single videos start right away.
- yt-dlp is updated automatically when the server starts; the system check shows the yt-dlp version and checks the yt-dlp binary instead of only Python.
- Backend tests (`cd server && npm test`).

### Changed
- Replaced the unmaintained `yt-dlp-exec` (last release 2022) with `youtube-dl-exec`. It passes the URL after `--`, so it can never be read as a yt-dlp option. On Windows, `start_app.bat` skips its Python check because `yt-dlp.exe` does not need Python. Existing installs pick up the new package automatically through `start_app.bat` / `start_app.sh`.
- Backend split from a single `index.js` into modules under `server/src/` (see `PROJECT_STRUCTURE.md`).
- Removed unused Vite template files (`counter.ts`, `typescript.svg`).
- File names now include the video ID (`Title [id].mp4`) and titles are limited to 150 bytes to avoid name collisions and Windows path length errors. Previously downloaded videos are still skipped via `download_archive.txt`.
- The progress log keeps the latest 2000 lines.

## [2026-03-11]
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
