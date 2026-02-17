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

// Download endpoint with SSE
app.post('/api/download', async (req, res) => {
  const { url, downloadPath, quality, metadata } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const outputDir = downloadPath || DEFAULT_DOWNLOAD_DIR;

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      sendEvent('error', { message: `Failed to create directory: ${err.message}` });
      return res.end();
    }
  }

  const flags = {
    output: path.join(outputDir, '%(title)s.%(ext)s'),
    ffmpegLocation: ffmpegStatic,
    noWarnings: true,
    preferFreeFormats: true,
  };

  // Quality settings
  if (quality === 'audio') {
    flags.extractAudio = true;
    flags.audioFormat = 'mp3';
  } else {
    // Video quality
    if (quality === '1080p') {
      flags.format = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
    } else if (quality === '720p') {
      flags.format = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
    } else if (quality === '480p') {
      flags.format = 'bestvideo[height<=480]+bestaudio/best[height<=480]';
    } else {
      // Default to best
      flags.format = 'bestvideo+bestaudio/best';
    }
    // Merge output format to mp4/mkv if needed, but usually default is fine.
    // Ensure we merge to mp4 for better compatibility if possible
    flags.mergeOutputFormat = 'mp4';
  }

  // Metadata settings
  if (metadata) {
    flags.writeThumbnail = true;
    flags.writeSubs = true;
    flags.writeInfoJson = true;
    flags.addMetadata = true;
  }

  sendEvent('info', { message: `Starting download for: ${url}` });
  sendEvent('info', { message: `Output directory: ${outputDir}` });

  try {
    const subprocess = ytDlp.exec(url, flags);

    subprocess.stdout.on('data', (data) => {
      const output = data.toString();
      // Parse progress if possible, or just send raw lines
      // yt-dlp outputs lines like: [download]  23.5% of 10.00MiB at 2.00MiB/s ETA 00:05

      const lines = output.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
        sendEvent('progress', { raw: line });
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
