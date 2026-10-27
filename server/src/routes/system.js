const express = require('express');
const fs = require('fs');
const { execFile } = require('child_process');
const { DEFAULT_DOWNLOAD_DIR } = require('../config');
const { isValidDownloadPath } = require('../validation');
const ytdlp = require('../ytdlp');

const router = express.Router();

const commandWorks = (cmd, args) =>
  new Promise((resolve) => execFile(cmd, args, (err) => resolve(!err)));

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.3.0' });
});

/**
 * Check that yt-dlp, FFmpeg (and Python where needed) are available
 */
router.get('/check-dependencies', async (req, res) => {
  await ytdlp.waitForUpdate();

  // The Windows yt-dlp.exe is standalone; the macOS/Linux build is a zipapp that needs python3
  const python = process.platform === 'win32' ? true : await commandWorks('python3', ['--version']);
  const ytDlpVersion = await ytdlp.getVersion();
  const ffmpeg = ytdlp.hasFfmpeg();

  res.json({
    // Node.js 22+ is needed for downloads with cookies (see jsRuntimeFlags); not required otherwise
    node: { version: process.versions.node, supported: ytdlp.isNodeSupported(), minMajor: ytdlp.MIN_NODE_MAJOR },
    ytDlp: Boolean(ytDlpVersion),
    ytDlpVersion,
    python,
    ffmpeg,
    ready: Boolean(ytDlpVersion) && python && ffmpeg,
  });
});

/**
 * Check if the download path exists (creating it if needed) and is writable
 */
router.post('/check-path', (req, res) => {
  const { downloadPath } = req.body;
  if (!isValidDownloadPath(downloadPath)) {
    return res.json({ valid: false, error: 'Path must be an absolute path' });
  }
  const targetPath = downloadPath || DEFAULT_DOWNLOAD_DIR;

  try {
    fs.mkdirSync(targetPath, { recursive: true });
    fs.accessSync(targetPath, fs.constants.W_OK);
    res.json({ valid: true, path: targetPath });
  } catch (err) {
    res.json({ valid: false, error: `Path is invalid or not writable: ${err.message}` });
  }
});

module.exports = router;
