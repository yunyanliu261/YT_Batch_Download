const express = require('express');
const fs = require('fs');
const { DEFAULT_DOWNLOAD_DIR } = require('../config');
const { parseVideoUrl, isValidDownloadPath, parseBrowser, parseQuality } = require('../validation');
const { createCookieFile, removeFile, cookieFlags } = require('../cookies');
const { resolveTarget, listEntries, readArchiveIds, buildPlan } = require('../library');
const ytdlp = require('../ytdlp');

const router = express.Router();

// Call onLine for every complete line in a stream (progress updates may end with \r)
const forEachLine = (stream, onLine) => {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r\n|\r|\n/);
    buffer = lines.pop();
    lines.filter((line) => line.trim()).forEach(onLine);
  });
  stream.on('end', () => {
    if (buffer.trim()) onLine(buffer);
  });
};

/**
 * Download endpoint. Streams progress back with Server-Sent Events:
 *   info / error / complete   { message }
 *   download-plan             { total, downloaded, pending }
 *   progress                  { percent, size, speed, eta }   current file
 *   item                      { index, total }                position in playlist/channel
 *   log                       { raw }                          other yt-dlp output
 */
router.post('/download', async (req, res) => {
  const { downloadPath, metadata, cookieContent } = req.body;
  const url = parseVideoUrl(req.body.url);
  const quality = parseQuality(req.body.quality);
  const browser = parseBrowser(req.body.browser);

  if (!url) {
    return res.status(400).json({ error: 'A valid http(s) URL is required' });
  }
  if (!isValidDownloadPath(downloadPath)) {
    return res.status(400).json({ error: 'Download path must be an absolute path' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    if (res.writableEnded || res.destroyed) return;
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let cookieFilePath = null;
  let subprocess = null;
  let finished = false;
  let clientGone = false;

  // res 'close' fires when the response finishes or the client disconnects. (req 'close'
  // fires once the request body has been read, so it cannot be used to detect a disconnect.)
  res.on('close', () => {
    clientGone = !res.writableFinished;
    if (subprocess && !finished) {
      // Client cancelled or closed the page: stop yt-dlp instead of downloading in the background
      subprocess.kill();
    } else {
      removeFile(cookieFilePath);
    }
  });

  const fail = (message) => {
    removeFile(cookieFilePath);
    sendEvent('error', { message });
    res.end();
  };

  if (cookieContent) {
    try {
      cookieFilePath = createCookieFile(cookieContent);
    } catch (err) {
      return fail(`Failed to write cookies file: ${err.message}`);
    }
  }
  const cookies = cookieFlags({ cookieFilePath, browser });

  await ytdlp.waitForUpdate();

  // Look up the channel / playlist first to decide the folder and show what is pending
  const baseDir = downloadPath || DEFAULT_DOWNLOAD_DIR;
  let target;
  let entries = [];
  try {
    sendEvent('info', { message: 'Fetching channel info to create folder...' });
    if (cookieFilePath) sendEvent('info', { message: 'Using provided cookies.txt file' });
    else if (browser) sendEvent('info', { message: `Using cookies from browser: ${browser}` });

    const info = await ytdlp.fetchInfo(url, cookies);
    target = resolveTarget(info, baseDir);
    entries = listEntries(info);
    sendEvent('info', { message: `Target Folder: ${target.outputDir}` });
  } catch (err) {
    sendEvent('error', { message: `Warning: Could not detect channel name. using default. (${err.stderr || err.message})` });
    target = resolveTarget({ channel: 'Downloads' }, baseDir);
  }

  if (clientGone) return removeFile(cookieFilePath);

  try {
    if (entries.length > 0) {
      sendEvent('download-plan', buildPlan(entries, readArchiveIds(target.archivePath)));
    }
  } catch (err) {
    // A broken archive file only affects the plan summary
    console.error('Error analyzing archive:', err);
  }

  try {
    fs.mkdirSync(target.outputDir, { recursive: true });
  } catch (err) {
    return fail(`Failed to create directory: ${err.message}`);
  }

  const flags = ytdlp.buildDownloadFlags({
    outputDir: target.outputDir,
    archivePath: target.archivePath,
    quality,
    metadata,
    multipleVideos: entries.length > 1,
    extraFlags: cookies,
  });

  sendEvent('info', { message: `Starting download for: ${url}` });
  sendEvent('info', { message: `Output directory: ${target.outputDir}` });

  const handleLine = (line) => {
    const parsed = ytdlp.parseProgressLine(line);
    if (!parsed) return sendEvent('log', { raw: line });
    const { type, ...data } = parsed;
    if (type === 'sleep') {
      sendEvent('info', { message: `Waiting ${data.seconds}s before downloading (rate limit protection)` });
    } else {
      sendEvent(type, data);
    }
  };

  try {
    subprocess = ytdlp.youtubedl.exec(url, flags);

    forEachLine(subprocess.stdout, handleLine);
    forEachLine(subprocess.stderr, (line) => {
      if (line.includes('ERROR:')) sendEvent('error', { message: line });
      else sendEvent('log', { raw: line });
    });

    // The promise rejects when yt-dlp fails or is killed; results are handled via events below
    subprocess.catch(() => {});

    subprocess.on('close', (code) => {
      finished = true;
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
      finished = true;
      if (clientGone) return removeFile(cookieFilePath);
      fail(`Spawn error: ${err.message}`);
    });
  } catch (err) {
    finished = true;
    fail(`Execution error: ${err.message}`);
  }
});

module.exports = router;
