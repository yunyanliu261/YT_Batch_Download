const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytDlp = require('yt-dlp-exec');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { YOUTUBE_DL_PATH } = require('yt-dlp-exec/src/constants');

const app = express();
const PORT = 3000;
// Only listen on loopback so other machines on the network cannot drive the downloader
const HOST = '127.0.0.1';

// Only the local frontend (any port on localhost / 127.0.0.1) may call this API
const isAllowedOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// Reject requests whose Host header is not local (defends against DNS rebinding)
app.use((req, res, next) => {
  const host = (req.headers.host || '').replace(/:\d+$/, '');
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return res.status(403).json({ error: 'Forbidden host' });
  }
  next();
});

// Browsers still send "simple" cross-site requests even when CORS headers are missing,
// so block any request that carries a foreign Origin instead of relying on CORS alone
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  next();
});

app.use(cors({ origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)) }));
app.use(bodyParser.json());

/**
 * Only accept http(s) URLs. yt-dlp-exec puts the URL first on the command line without a
 * "--" separator, so a value such as "--exec=..." would otherwise be parsed as a yt-dlp option.
 */
const parseVideoUrl = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  } catch (e) {
    return null;
  }
};

// Download path must be empty (use default) or an absolute path
const isValidDownloadPath = (value) =>
  value === undefined || value === null || value === '' ||
  (typeof value === 'string' && path.isAbsolute(value));

const removeFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {}
  }
};

/**
 * Keep yt-dlp current: YouTube changes often break old versions, and the binary is
 * otherwise only fetched once at `npm install` time. Requests wait for this to finish.
 */
let updatePromise = Promise.resolve();
const updateYtDlp = () => {
  if (process.env.SKIP_YTDLP_UPDATE) return Promise.resolve();
  if (!fs.existsSync(YOUTUBE_DL_PATH)) {
    console.error(`yt-dlp binary not found at ${YOUTUBE_DL_PATH}. Run "npm install" in the server folder.`);
    return Promise.resolve();
  }
  console.log('Checking for yt-dlp updates...');
  return ytDlp.exec(undefined, { update: true })
    .then(({ stdout }) => console.log(stdout.trim()))
    .catch((err) => console.error(`yt-dlp update failed (continuing with current version): ${err.message}`));
};

// Default download directory
const DEFAULT_DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DEFAULT_DOWNLOAD_DIR)) {
  fs.mkdirSync(DEFAULT_DOWNLOAD_DIR);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

/**
 * Check Dependencies Endpoint
 * Requirement 1: Verify installed dependencies (ffmpeg, python)
 */
app.get('/api/check-dependencies', async (req, res) => {
  const checkCommand = (cmd) => {
    return new Promise((resolve) => {
      require('child_process').exec(cmd, (err) => resolve(!err));
    });
  };

  await updatePromise;

  // The Windows yt-dlp.exe is standalone; the Unix build is a zipapp that needs python3
  const hasPython = process.platform === 'win32'
    ? true
    : await checkCommand('python3 --version');

  let ytDlpVersion = null;
  if (fs.existsSync(YOUTUBE_DL_PATH)) {
    try {
      const { stdout } = await ytDlp.exec(undefined, { version: true });
      ytDlpVersion = stdout.trim();
    } catch (e) {}
  }

  // ffmpeg-static provides the binary path (null on unsupported platforms), so we check if it exists
  const hasFfmpeg = Boolean(ffmpegStatic) && fs.existsSync(ffmpegStatic);

  res.json({
    ytDlp: Boolean(ytDlpVersion),
    ytDlpVersion,
    python: hasPython,
    ffmpeg: hasFfmpeg,
    ready: Boolean(ytDlpVersion) && hasPython && hasFfmpeg
  });
});

/**
 * Validate Path Endpoint
 * Requirement 2: Check if download path exists and is writable
 */
app.post('/api/check-path', (req, res) => {
  const { downloadPath } = req.body;
  if (!isValidDownloadPath(downloadPath)) {
    return res.json({ valid: false, error: 'Path must be an absolute path' });
  }
  const targetPath = downloadPath || DEFAULT_DOWNLOAD_DIR;

  try {
    if (!fs.existsSync(targetPath)) {
      // Try to create it to see if we can
      fs.mkdirSync(targetPath, { recursive: true });
    }
    // Check write permission
    fs.accessSync(targetPath, fs.constants.W_OK);
    res.json({ valid: true, path: targetPath });
  } catch (err) {
    res.json({ valid: false, error: `Path is invalid or not writable: ${err.message}` });
  }
});

/**
 * Get Video/Channel Info Endpoint
 * Requirement 3: Check website URL and get video count
 */
app.post('/api/get-info', async (req, res) => {
  const { browser, cookieContent } = req.body;
  const url = parseVideoUrl(req.body.url);

  if (!url) {
    return res.status(400).json({ error: 'A valid http(s) URL is required' });
  }

  await updatePromise;

  let cookieFilePath = null;
  try {
    const flags = {
      dumpSingleJson: true,
      flatPlaylist: true, // Don't list all videos in detail, just the playlist/channel meta
      noWarnings: true,
    };

    if (cookieContent) {
      cookieFilePath = path.join(os.tmpdir(), `temp_cookie_${crypto.randomUUID()}.txt`);
      fs.writeFileSync(cookieFilePath, cookieContent);
      flags.cookies = cookieFilePath;
    } else if (browser && browser !== 'none') {
       flags.cookiesFromBrowser = browser;
    }

    // fetching info without downloading
    const info = await ytDlp(url, flags);

    const isPlaylist = info._type === 'playlist';

    res.json({
      title: info.title,
      uploader: info.uploader,
      is_playlist: isPlaylist,
      video_count: isPlaylist ? info.playlist_count : 1,
      thumbnail: info.thumbnail
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch info: ${err.message}` });
  } finally {
    removeFile(cookieFilePath);
  }
});

// Download endpoint with Server-Sent Events (SSE) for real-time progress updates
app.post('/api/download', async (req, res) => {
  const { downloadPath, quality, metadata, browser, cookieContent } = req.body;
  const url = parseVideoUrl(req.body.url);

  // Validate that a usable URL and path are provided
  if (!url) {
    return res.status(400).json({ error: 'A valid http(s) URL is required' });
  }
  if (!isValidDownloadPath(downloadPath)) {
    return res.status(400).json({ error: 'Download path must be an absolute path' });
  }

  // Set up SSE headers to keep the connection open and stream data
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Ensure headers are sent immediately

  // Helper function to send SSE events to the client
  const sendEvent = (type, data) => {
    if (res.writableEnded || res.destroyed) return;
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Determine the base output directory (user-provided or default)
  let baseOutputDir = downloadPath || DEFAULT_DOWNLOAD_DIR;

  // Requirement: Create a subfolder based on the Channel Name
  // We'll fetch the channel info first using a quick probe
  let channelFolder = '';
  let cookieFilePath = null;
  let allEntries = [];
  let subprocess = null;
  let clientGone = false;

  // res 'close' fires when the response finishes or the client disconnects. (req 'close'
  // fires once the request body has been read, so it cannot be used to detect a disconnect.)
  res.on('close', () => {
    clientGone = !res.writableFinished;
    if (subprocess && subprocess.exitCode === null) {
      // Client cancelled or closed the page: stop yt-dlp instead of downloading in the background
      subprocess.kill();
    } else {
      removeFile(cookieFilePath);
    }
  });

  if (cookieContent) {
    cookieFilePath = path.join(os.tmpdir(), `temp_cookie_${crypto.randomUUID()}.txt`);
    try {
      fs.writeFileSync(cookieFilePath, cookieContent);
    } catch (err) {
      sendEvent('error', { message: `Failed to write cookies file: ${err.message}` });
      return res.end();
    }
  }

  await updatePromise;

  try {
    sendEvent('info', { message: 'Fetching channel info to create folder...' });
    const infoFlags = {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true
    };

    if (cookieFilePath) {
      infoFlags.cookies = cookieFilePath;
      sendEvent('info', { message: `Using provided cookies.txt file` });
    } else if (browser && browser !== 'none') {
       infoFlags.cookiesFromBrowser = browser;
    }

    const info = await ytDlp(url, infoFlags);

    if (info.entries && Array.isArray(info.entries)) {
      allEntries = info.entries.map(e => ({ id: e.id, title: e.title }));
    } else if (info.id) {
      allEntries = [{ id: info.id, title: info.title }];
    }

    // Use 'uploader' (channel name) or 'playlist_title' (if playlist) or fallback to 'UnknownChannel'
    // Sanitize the name to be safe for file systems
    const rawName = info.uploader || info.playlist_title || info.channel || 'UnknownChannel';
    const sanitizedName = rawName.replace(/[<>:"/\\|?*]+/g, '_').trim();
    channelFolder = sanitizedName;

    sendEvent('info', { message: `Target Folder: ${channelFolder}` });
  } catch (err) {
    sendEvent('error', { message: `Warning: Could not detect channel name. using default. (${err.message})` });
    channelFolder = 'Downloads';
  }

  const finalOutputDir = path.join(baseOutputDir, channelFolder);

  // Requirement: Check downloaded archive and emit a download-plan event
  try {
    let downloadedIds = new Set();
    const archivePath = path.join(finalOutputDir, 'download_archive.txt');
    if (fs.existsSync(archivePath)) {
      const content = fs.readFileSync(archivePath, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split(' ');
        if (parts.length >= 2) {
           downloadedIds.add(parts[1].trim());
        }
      });
    }

    let downloadedCount = 0;
    let pendingCount = 0;
    if (allEntries.length > 0) {
      allEntries.forEach(e => {
        if (e.id && downloadedIds.has(e.id)) {
          downloadedCount++;
        } else {
          pendingCount++;
        }
      });
      sendEvent('download-plan', { 
        total: allEntries.length, 
        downloaded: downloadedCount, 
        pending: pendingCount 
      });
    }
  } catch (err) {
    // Ignore errors if archive parsing fails
    console.error('Error analyzing archive:', err);
  }

  // Create the final directory (Base + Channel Name) if it doesn't exist
  if (!fs.existsSync(finalOutputDir)) {
    try {
      fs.mkdirSync(finalOutputDir, { recursive: true });
    } catch (err) {
      sendEvent('error', { message: `Failed to create directory: ${err.message}` });
      return res.end();
    }
  }

  // The client may have disconnected while channel info was being fetched
  if (clientGone) {
    removeFile(cookieFilePath);
    return;
  }

  // Configure yt-dlp arguments
  const flags = {
    // Save inside the channel folder; the video ID avoids collisions between identical titles
    // and the byte limit keeps paths under the Windows length limit
    output: path.join(finalOutputDir, '%(title).150B [%(id)s].%(ext)s'),
    ffmpegLocation: ffmpegStatic, // Use the static FFmpeg binary
    noWarnings: true,
    preferFreeFormats: true,
    // Prevent duplicate downloads using an archive file
    downloadArchive: path.join(finalOutputDir, 'download_archive.txt'),
    minSleepInterval: 5,
    maxSleepInterval: 30,
  };

  if (cookieFilePath) {
    flags.cookies = cookieFilePath;
  } else if (browser && browser !== 'none') {
    flags.cookiesFromBrowser = browser;
    sendEvent('info', { message: `Using cookies from browser: ${browser}` });
  }

  // Configure Quality settings based on user selection
  if (quality === 'audio') {
    // Audio-only mode (MP3)
    flags.extractAudio = true;
    flags.audioFormat = 'mp3';
  } else {
    // Video quality selection
    if (quality === '1080p') {
      flags.format = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/bestvideo+bestaudio/best';
    } else if (quality === '720p') {
      flags.format = 'bestvideo[height<=720]+bestaudio/best[height<=720]/bestvideo+bestaudio/best';
    } else if (quality === '480p') {
      flags.format = 'bestvideo[height<=480]+bestaudio/best[height<=480]/bestvideo+bestaudio/best';
    } else {
      // Default to best available quality
      flags.format = 'bestvideo+bestaudio/best';
    }
    // Ensure we merge video+audio into a single MP4 file for compatibility
    flags.mergeOutputFormat = 'mp4';
  }

  // Metadata settings based on object
  // Expecting: { subs: boolean, thumbnail: boolean, json: boolean }
  if (metadata) {
    if (metadata.thumbnail) {
      // Save the thumbnail as a .jpg next to the video. Embedding is not used because it needs
      // ffprobe, which ffmpeg-static does not ship; the failure made yt-dlp exit with an error
      // and skipped writing download_archive.txt
      flags.writeThumbnail = true;
      flags.convertThumbnails = 'jpg';
    }
    if (metadata.subs) flags.writeSubs = true;
    if (metadata.json) flags.writeInfoJson = true;

    // Always embed metadata if any of the above are selected, or if asked explicitly
    if (metadata.thumbnail || metadata.subs || metadata.json) {
       flags.addMetadata = true;
    }
  }

  sendEvent('info', { message: `Starting download for: ${url}` });
  sendEvent('info', { message: `Output directory: ${finalOutputDir}` });

  try {
    subprocess = ytDlp.exec(url, flags);

    subprocess.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
        // Requirement 4: Enhanced status reporting
        let status = 'downloading';
        if (line.includes('[download]')) status = 'downloading';
        if (line.includes('[info]')) status = 'info';

        if (line.includes('Sleeping') || line.includes('sleep')) {
          console.log(`[Wait] ${line}`);
          sendEvent('info', { message: line.trim() });
        }

        sendEvent('progress', { raw: line, status });
      });
    });

    subprocess.stderr.on('data', (data) => {
      const output = data.toString();
      // stderr often contains progress info too in some versions/configs, or errors
      const lines = output.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
         // Some "errors" are just warnings or info
         if (line.includes('ERROR:')) {
            sendEvent('error', { message: line });
         } else {
            sendEvent('progress', { raw: line });
         }
      });
    });

    // execa rejects when the process fails or is killed; results are handled via events below
    subprocess.catch(() => {});

    subprocess.on('close', (code) => {
      removeFile(cookieFilePath);
      if (clientGone) return;
      if (code === 0) {
        sendEvent('complete', { message: 'Download completed successfully!' });
      } else {
        sendEvent('error', { message: `Process exited with code ${code}` });
      }
      res.end();
    });

    subprocess.on('error', (err) => {
      removeFile(cookieFilePath);
      if (clientGone) return;
      sendEvent('error', { message: `Spawn error: ${err.message}` });
      res.end();
    });

  } catch (error) {
    removeFile(cookieFilePath);
    sendEvent('error', { message: `Execution error: ${error.message}` });
    res.end();
  }
});

if (require.main === module) {
  updatePromise = updateYtDlp();
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { app, parseVideoUrl, isValidDownloadPath };
