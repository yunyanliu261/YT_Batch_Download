const express = require('express');
const { parseVideoUrl, parseBrowser } = require('../validation');
const { createCookieFile, removeFile, cookieFlags } = require('../cookies');
const { resolveTarget, listEntries } = require('../library');
const { DEFAULT_DOWNLOAD_DIR } = require('../config');
const ytdlp = require('../ytdlp');

const router = express.Router();

/**
 * Get video / playlist / channel info (title, uploader, video count) without downloading
 */
router.post('/get-info', async (req, res) => {
  const url = parseVideoUrl(req.body.url);
  if (!url) {
    return res.status(400).json({ error: 'A valid http(s) URL is required' });
  }

  await ytdlp.waitForUpdate();

  let cookieFilePath = null;
  try {
    if (req.body.cookieContent) cookieFilePath = createCookieFile(req.body.cookieContent);
    const info = await ytdlp.fetchInfo(url, cookieFlags({ cookieFilePath, browser: parseBrowser(req.body.browser) }));
    const { kind } = resolveTarget(info, DEFAULT_DOWNLOAD_DIR);

    res.json({
      title: info.title,
      uploader: info.channel || info.uploader,
      kind,
      is_playlist: info._type === 'playlist',
      video_count: info._type === 'playlist' ? (info.playlist_count ?? listEntries(info).length) : 1,
      thumbnail: info.thumbnail,
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch info: ${err.stderr || err.message}` });
  } finally {
    removeFile(cookieFilePath);
  }
});

module.exports = router;
