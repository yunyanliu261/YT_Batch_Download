const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytDlp = require('yt-dlp-exec');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

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

  const hasPython = await checkCommand('python3 --version') || await checkCommand('python --version');
  // ffmpeg-static provides the binary path, so we check if it exists
  const hasFfmpeg = fs.existsSync(ffmpegStatic);

  res.json({
    python: hasPython,
    ffmpeg: hasFfmpeg,
    ready: hasPython && hasFfmpeg
  });
});

/**
 * Validate Path Endpoint
 * Requirement 2: Check if download path exists and is writable
 */
app.post('/api/check-path', (req, res) => {
  const { downloadPath } = req.body;
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
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // fetching info without downloading
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      flatPlaylist: true, // Don't list all videos in detail, just the playlist/channel meta
      noWarnings: true,
    });

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
  }
});

// Download endpoint with Server-Sent Events (SSE) for real-time progress updates
app.post('/api/download', async (req, res) => {
  const { url, downloadPath, quality, metadata } = req.body;

  // Validate that a URL is provided
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Set up SSE headers to keep the connection open and stream data
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Ensure headers are sent immediately

  // Helper function to send SSE events to the client
  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Determine the base output directory (user-provided or default)
  let baseOutputDir = downloadPath || DEFAULT_DOWNLOAD_DIR;

  // Requirement: Create a subfolder based on the Channel Name
  // We'll fetch the channel info first using a quick probe
  let channelFolder = '';
  try {
    sendEvent('info', { message: 'Fetching channel info to create folder...' });
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true
    });

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

  // Create the final directory (Base + Channel Name) if it doesn't exist
  if (!fs.existsSync(finalOutputDir)) {
    try {
      fs.mkdirSync(finalOutputDir, { recursive: true });
    } catch (err) {
      sendEvent('error', { message: `Failed to create directory: ${err.message}` });
      return res.end();
    }
  }

  // Configure yt-dlp arguments
  const flags = {
    output: path.join(finalOutputDir, '%(title)s.%(ext)s'), // Save inside the channel folder
    ffmpegLocation: ffmpegStatic, // Use the static FFmpeg binary
    noWarnings: true,
    preferFreeFormats: true,
  };

  // Configure Quality settings based on user selection
  if (quality === 'audio') {
    // Audio-only mode (MP3)
    flags.extractAudio = true;
    flags.audioFormat = 'mp3';
  } else {
    // Video quality selection
    if (quality === '1080p') {
      flags.format = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
    } else if (quality === '720p') {
      flags.format = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
    } else if (quality === '480p') {
      flags.format = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
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
    if (metadata.thumbnail) flags.writeThumbnail = true;
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
    const subprocess = ytDlp.exec(url, flags);

    subprocess.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
        // Requirement 4: Enhanced status reporting
        let status = 'downloading';
        if (line.includes('[download]')) status = 'downloading';
        if (line.includes('[info]')) status = 'info';

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

    subprocess.on('close', (code) => {
      if (code === 0) {
        sendEvent('complete', { message: 'Download completed successfully!' });
      } else {
        sendEvent('error', { message: `Process exited with code ${code}` });
      }
      res.end();
    });

    subprocess.on('error', (err) => {
       sendEvent('error', { message: `Spawn error: ${err.message}` });
       res.end();
    });

  } catch (error) {
    sendEvent('error', { message: `Execution error: ${error.message}` });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
