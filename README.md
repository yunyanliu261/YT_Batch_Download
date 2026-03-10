# YouTube Downloader Web Application

A lightweight, local web-based tool to download YouTube videos or entire channels with a simple UI. Built with Node.js (Express), Vite, TypeScript, and Tailwind CSS.

[Repository Link: https://github.com/yunyanliu261/YT_Batch_Download](https://github.com/yunyanliu261/YT_Batch_Download)

## Features

- **Dual-Language UI**: Seamlessly switch between English and Traditional Chinese (繁體中文). Your preference is saved automatically.
- **Download Channels or Single Videos**: Paste a YouTube URL and automatically organize downloads into subfolders named after the channel/uploader.
- **Pre-Download Checks**: Built-in verification to check URL validity, display video counts, and ensure the target download path exists and is writable.
- **Smart Duplicate Prevention**: Automatically tracks downloaded videos using an archive file (`download_archive.txt`). If you restart a channel download, it instantly skips videos you already have.
- **Select Quality**: Choose from Best (default), 1080p, 720p, 480p, or Audio Only (MP3).
- **Granular Metadata Control**: Optionally download extra files alongside your video. You can select all or pick individually:
  - Subtitles (`.vtt`)
  - Thumbnails (`.jpg`/`.webp`)
  - Info JSON (video description, tags, etc.)
- **Custom Download Path**: Specify exactly where files should be saved on your machine.
- **Real-time Progress**: View download logs, status, and progress directly in the browser UI.

## Prerequisites

To run this application, you must have the following installed on your system:

1.  [Node.js](https://nodejs.org/) (v18 or higher recommended)
2.  [Python 3](https://www.python.org/downloads/) (Required by the underlying `yt-dlp` engine. Ensure it is added to your system PATH during installation).
3.  [FFmpeg](https://ffmpeg.org/) (The app attempts to use a bundled `ffmpeg-static` version automatically, but having it installed globally is recommended as a fallback for merging video/audio streams).

## Installation & Running (Windows)

For Windows users, starting the app is completely automated.

1.  Clone or download this repository to your local machine.
2.  Double-click the `start_app.bat` file in the root directory.
3.  The script will automatically:
    - Check if Node.js is installed.
    - Install all necessary dependencies for the server and client (if missing).
    - Start the backend server (Port 3000) and frontend UI server in the background.
    - Open your default web browser to the application page.
4.  To stop the application, simply press any key in the command prompt window that opened, and it will safely terminate the background processes.

## Installation & Running (Mac/Linux)

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
2.  **System Check**: Upon opening the page, look for the "System Check" indicator at the bottom. It should say "Ready" and confirm Python and FFmpeg are detected.
3.  **YouTube URL**: Paste the link to a video or a channel main page.
3.  **Check URL**: Click this button *before* downloading. It will query YouTube and display the video title, uploader name, and how many videos will be downloaded (useful for channels).
4.  **Download Path**: (Optional) Enter an absolute path on your machine (e.g., `C:\Users\You\Downloads` or `/home/user/downloads`). If left empty, files will be saved in `server/downloads`.
5.  **Quality**: Select your desired resolution.
6.  **Download Metadata**: Use the checkboxes to select extra files you want saved alongside the video. Hover over the `?` icon for more information.
7.  Click **Start Download**. The "Progress Log" will display real-time updates as `yt-dlp` processes your request.

## Troubleshooting

-   **"System Check Failed"**: Ensure Python 3 is installed and added to your system's Environment Variables (PATH).
-   **403 Forbidden / Sign in to confirm your age**: Some videos are age-restricted. You can bypass this by using the "Browser Cookies" dropdown in the UI to authenticate using your local browser session.
-   **Files missing audio/video**: Ensure FFmpeg is available on your system so the tool can merge the best video and best audio streams together.
-   **"Requested format is not available"**: If you see this error (often on official music videos or premium content), it means the video is protected by DRM (Digital Rights Management). `yt-dlp` cannot download DRM-protected content.
-   **"Could not copy Chrome cookie database"**: If you selected Chrome in the Browser Cookies dropdown and see this error, it means Chrome is currently running and has locked its cookie file. You must completely close Chrome (including background processes via the system tray or Task Manager) before attempting the download again, or choose a different browser like Firefox or Edge.

## Tech Stack

-   **Backend**: Node.js, Express, `yt-dlp-exec` (wrapper for the powerful `yt-dlp` binary).
-   **Frontend**: Vite, Vanilla TypeScript, Tailwind CSS.
