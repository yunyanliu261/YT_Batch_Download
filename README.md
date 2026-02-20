# YouTube Downloader Web Application

A lightweight, web-based tool to download YouTube videos or entire channels with a simple UI. Built with Node.js (Express), Vite, TypeScript, and Tailwind CSS.

## Features

- **Download Entire Channels or Single Videos**: Just paste the URL.
- **Select Quality**: Choose from Best (default), 1080p, 720p, 480p, or Audio Only (MP3).
- **Metadata Support**: Optionally download thumbnails, subtitles, and JSON info.
- **Custom Download Path**: Specify where files should be saved (absolute path).
- **Real-time Progress**: View download logs and progress directly in the browser.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python 3](https://www.python.org/) (required by `yt-dlp`)
- [FFmpeg](https://ffmpeg.org/) (optional, but recommended for merging video/audio streams; the app uses `ffmpeg-static` automatically if available).

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

## Running the Application

You need to run both the backend server and the frontend client.

1.  **Start the Backend Server:**
    Open a terminal in the root directory:
    ```bash
    cd server
    node index.js
    ```
    The server will start on `http://localhost:3000`.

2.  **Start the Frontend Client:**
    Open a second terminal in the root directory:
    ```bash
    cd client
    npm run dev
    ```
    Click the link provided (usually `http://localhost:5173`) to open the UI in your browser.

## Usage

1.  Open the web interface.
2.  **YouTube URL**: Paste the link to a video or a channel main page.
3.  **Download Path**: (Optional) Enter an absolute path on your machine (e.g., `C:\Users\You\Downloads` or `/home/user/downloads`). If left empty, files will be saved in `server/downloads`.
4.  **Quality**: Select your desired resolution or "Audio Only".
5.  **Metadata**: Check the box if you want subtitles and thumbnails.
6.  Click **Start Download**.
7.  Watch the "Progress Log" for real-time updates.

## Troubleshooting

-   **403 Forbidden Error**: YouTube often blocks cloud server IPs (like AWS, Azure, Replit). This tool is designed to run on a **local machine** (your home PC/laptop) where such blocks are less common.
-   **FFmpeg Error**: If merging formats fails, ensure you have FFmpeg installed or that `ffmpeg-static` (included in dependencies) is working correctly on your OS.

## Tech Stack

-   **Backend**: Node.js, Express, `yt-dlp-exec` (wrapper for `yt-dlp`).
-   **Frontend**: Vite, TypeScript, Tailwind CSS.
