# YouTube Downloader Web Application

A lightweight, local web-based tool to download YouTube videos or entire channels with a simple UI. Built with Node.js (Express), Vite, TypeScript, and Tailwind CSS.

[Repository Link: https://github.com/yunyanliu261/YT_Batch_Download](https://github.com/yunyanliu261/YT_Batch_Download)

## Features

- **Dual-Language UI**: Seamlessly switch between English and Traditional Chinese (繁體中文). Your preference is saved automatically.
- **Download Channels, Playlists or Single Videos**: Paste a YouTube URL and downloads are organized automatically:
  - Video or channel → `<download path>/<channel>/`
  - Playlist → `<download path>/<channel>/<playlist title>/`
- **Pre-Download Checks**: Built-in verification to check URL validity, display video counts, and ensure the target download path exists and is writable.
- **Smart Duplicate Prevention**: Automatically tracks downloaded videos using an archive file (`download_archive.txt`). If you restart a channel download, it instantly skips videos you already have. The archive is kept per channel, so a video found again in another playlist of the same channel is not downloaded twice.
- **Select Quality**: Choose from Best (default), 1080p, 720p, 480p, or Audio Only (MP3).
- **Granular Metadata Control**: Optionally download extra files alongside your video. You can select all or pick individually:
  - Subtitles (`.vtt`)
  - Thumbnails (saved as `.jpg` next to the video)
  - Info JSON (video description, tags, etc.)
- **Custom Download Path**: Specify exactly where files should be saved on your machine.
- **Real-time Progress**: Progress bars for the current file and the whole playlist/channel, plus the download log. Downloads can be cancelled at any time.
- **Clear Error Explanations**: When a download finishes, a summary shows how many videos were downloaded, skipped or failed, and why (members-only, age-restricted, bot check, private, region-blocked, DRM). If signing in would help, the Cookies option is highlighted.
- **Rate Limit Protection**: When downloading a playlist or channel, the app waits a random 5–30 seconds before each video to avoid being blocked by YouTube. Single videos start immediately.
- **Always Up to Date**: The bundled `yt-dlp` is updated automatically every time the server starts.

## Prerequisites

To run this application, you must have the following installed on your system:

1.  [Node.js](https://nodejs.org/) v18 or higher.
2.  **macOS / Linux only:** [Python 3.9+](https://www.python.org/downloads/) (`python3` must be on your PATH; the `yt-dlp` build for these systems runs on Python). Windows does not need Python.

`yt-dlp` and FFmpeg are downloaded automatically by `npm install` (via `youtube-dl-exec` and `ffmpeg-static`).

## Installation & Running (Windows)

For Windows users, starting the app is completely automated.

1.  Clone or download this repository to your local machine.
2.  Double-click the `start_app.bat` file in the root directory.
3.  The script will automatically:
    - Check if Node.js is installed.
    - Check that ports 3000 and 5173 are free. If another copy of the app (for example an older version) is still running, it tells you how to stop it instead of starting.
    - Install all necessary dependencies for the server and client (if missing).
    - Start the backend server (Port 3000) and frontend UI server in the background.
    - Open your default web browser to the application page.
4.  To stop the application, close the "YouTube Downloader Backend" and "YouTube Downloader Frontend" windows. Startup errors stay visible in these windows.

## Installation & Running (Mac/Linux)

Run the start script from the project folder:

```bash
./start_app.sh
```

It installs missing dependencies, starts the backend in the background and the frontend in the foreground, and opens your browser. Press `Ctrl+C` to stop both.

To start things manually instead:

1.  **Install Backend Dependencies:**
    ```bash
    cd server
    npm install
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

3.  **Start the Application:**
    You will need two terminal windows.

    *Terminal 1 (Backend):*
    ```bash
    cd server
    node index.js
    ```

    *Terminal 2 (Frontend):*
    ```bash
    cd client
    npm run dev
    ```
    Click the local link provided in Terminal 2 (usually `http://localhost:5173`) to open the UI.

## Usage Guide

1.  **Language Selection**: Use the toggle at the top right to select your preferred language.
2.  **System Check**: Upon opening the page, look for the "System Check" indicator at the bottom. It should say "Ready" and show the detected yt-dlp version. The server checks for yt-dlp updates every time it starts.
3.  **YouTube URL**: Paste the link to a video or a channel main page.
3.  **Check URL**: Click this button *before* downloading. It will query YouTube and display the video title, uploader name, and how many videos will be downloaded (useful for channels).
4.  **Download Path**: (Optional) Enter an absolute path on your machine (e.g., `C:\Users\You\Downloads` or `/home/user/downloads`). If left empty, files will be saved in `server/downloads`.
5.  **Quality**: Select your desired resolution.
6.  **Download Metadata**: Use the checkboxes to select extra files you want saved alongside the video. Hover over the `?` icon for more information.
7.  Click **Start Download**. The "Progress Log" will display real-time updates as `yt-dlp` processes your request.

## Troubleshooting

-   **"Port 3000/5173 is already in use"** or **the page looks like an older version**: another copy of the app is still running. Close its "YouTube Downloader Backend/Frontend" windows. If you cannot find them, run `netstat -ano | findstr ":3000 :5173"` (Windows) or `lsof -i :3000 -i :5173` (macOS/Linux) and stop the listed PID with `taskkill /PID <PID> /F` or `kill <PID>`. Then start the app again.

-   **Members-only or age-restricted videos** ("This video is not available", "Sign in to confirm your age"): these need a signed-in account. Members-only videos need an account that has joined the channel's membership; age-restricted videos need an age-verified account. Upload a `cookies.txt` exported from that account (see the [yt-dlp guide on exporting YouTube cookies](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies)) or choose the browser you are signed in with. Keep `cookies.txt` private: it works like your login.

-   **"System Check Failed"**: Run `npm install` again in the `server` folder so the yt-dlp binary is downloaded (on Windows, run `set YOUTUBE_DL_SKIP_PYTHON_CHECK=1` first if Python is not installed). On macOS/Linux, also make sure `python3` (3.9+) is installed.
-   **403 Forbidden / Sign in to confirm your age**: Some videos are age-restricted. You can bypass this by using the "Browser Cookies" dropdown in the UI to authenticate using your local browser session.
-   **Files missing audio/video**: Ensure FFmpeg is available on your system so the tool can merge the best video and best audio streams together.
-   **"Requested format is not available"**: If you see this error (often on official music videos or premium content), it means the video is protected by DRM (Digital Rights Management). `yt-dlp` cannot download DRM-protected content.
-   **"Could not copy Chrome cookie database"**: If you selected Chrome in the Browser Cookies dropdown and see this error, it means Chrome is currently running and has locked its cookie file. You must completely close Chrome (including background processes via the system tray or Task Manager) before attempting the download again, or choose a different browser like Firefox or Edge.

## Tech Stack

-   **Backend**: Node.js, Express, `youtube-dl-exec` (wrapper for the powerful `yt-dlp` binary), `ffmpeg-static`.
-   **Frontend**: Vite, Vanilla TypeScript, Tailwind CSS.

## Security Notes

-   The backend only listens on `127.0.0.1:3000` and only accepts requests from the local frontend (`localhost` / `127.0.0.1`). Other websites and other machines on your network cannot use it.
-   Only `http://` and `https://` URLs are accepted, and the download path must be an absolute path.

## Development

-   Run the backend tests: `cd server && npm test`
-   Set `SKIP_YTDLP_UPDATE=1` to skip the yt-dlp update check on server start.
