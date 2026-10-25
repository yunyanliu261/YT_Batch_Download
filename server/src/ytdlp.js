const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');
const ffmpegStatic = require('ffmpeg-static');

const YTDLP_PATH = youtubedl.constants.YOUTUBE_DL_PATH;

const FORMATS = {
  best: 'bestvideo+bestaudio/best',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/bestvideo+bestaudio/best',
  '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]/bestvideo+bestaudio/best',
  '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]/bestvideo+bestaudio/best',
};

// Random wait between videos of a playlist/channel to avoid YouTube rate limits
const SLEEP_INTERVAL = { min: 5, max: 30 };

const hasBinary = () => fs.existsSync(YTDLP_PATH);

// ffmpeg-static provides the binary path (null on unsupported platforms)
const hasFfmpeg = () => Boolean(ffmpegStatic) && fs.existsSync(ffmpegStatic);

/**
 * Keep yt-dlp current: YouTube changes often break old versions, and the binary is
 * otherwise only fetched once at `npm install` time. Requests wait for this to finish.
 */
let updatePromise = Promise.resolve();

const startUpdate = () => {
  if (process.env.SKIP_YTDLP_UPDATE) return updatePromise;
  if (!hasBinary()) {
    console.error(`yt-dlp binary not found at ${YTDLP_PATH}. Run "npm install" in the server folder.`);
    return updatePromise;
  }
  console.log('Checking for yt-dlp updates...');
  updatePromise = youtubedl.update()
    .then(({ stdout }) => console.log(stdout))
    .catch((err) => console.error(`yt-dlp update failed (continuing with current version): ${err.stderr || err.message}`));
  return updatePromise;
};

const waitForUpdate = () => updatePromise;

const getVersion = async () => {
  if (!hasBinary()) return null;
  try {
    const { stdout } = await youtubedl.exec(undefined, { version: true });
    return stdout.trim() || null;
  } catch (e) {
    return null;
  }
};

// Fetch video / playlist / channel info without downloading (entries are not expanded)
const fetchInfo = (url, extraFlags = {}) =>
  youtubedl(url, {
    dumpSingleJson: true,
    flatPlaylist: true,
    noWarnings: true,
    ...extraFlags,
  });

/**
 * Build yt-dlp flags for a download.
 * metadata: { subs, thumbnail, json } booleans
 */
const buildDownloadFlags = ({ outputDir, archivePath, quality, metadata, multipleVideos, extraFlags = {} }) => {
  const flags = {
    // The video ID avoids collisions between identical titles and the byte limit keeps
    // paths under the Windows length limit
    output: path.join(outputDir, '%(title).150B [%(id)s].%(ext)s'),
    ffmpegLocation: ffmpegStatic,
    noWarnings: true,
    preferFreeFormats: true,
    // One progress update per line so it can be parsed reliably
    newline: true,
    // Prevent duplicate downloads using an archive file
    downloadArchive: archivePath,
    ...extraFlags,
  };

  // A single video does not need a rate-limit pause before it starts
  if (multipleVideos) {
    flags.minSleepInterval = SLEEP_INTERVAL.min;
    flags.maxSleepInterval = SLEEP_INTERVAL.max;
  }

  if (quality === 'audio') {
    // Audio-only mode (MP3)
    flags.extractAudio = true;
    flags.audioFormat = 'mp3';
  } else {
    flags.format = FORMATS[quality] || FORMATS.best;
    // Merge video+audio into a single MP4 file for compatibility
    flags.mergeOutputFormat = 'mp4';
  }

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

    if (metadata.thumbnail || metadata.subs || metadata.json) {
      flags.addMetadata = true;
    }
  }

  return flags;
};

/**
 * Turn one line of yt-dlp output into a structured event, or null for a plain log line.
 *   { type: 'progress', percent, size, speed, eta }
 *   { type: 'item', index, total }       (playlist/channel position)
 *   { type: 'sleep', seconds }           (rate-limit pause)
 */
const parseProgressLine = (line) => {
  let m = line.match(/^\[download\]\s+([\d.]+)% of\s+~?\s*(\S+)(?:\s+at\s+(Unknown B\/s|\S+))?(?:\s+ETA\s+(\S+))?/);
  if (m) {
    return {
      type: 'progress',
      percent: Number(m[1]),
      size: m[2],
      speed: m[3] && !m[3].startsWith('Unknown') ? m[3] : null,
      eta: m[4] && m[4] !== 'Unknown' ? m[4] : null,
    };
  }
  m = line.match(/^\[download\] Downloading (?:item|video) (\d+) of (\d+)/);
  if (m) return { type: 'item', index: Number(m[1]), total: Number(m[2]) };
  m = line.match(/^\[download\] Sleeping ([\d.]+) seconds/);
  if (m) return { type: 'sleep', seconds: Number(m[1]) };
  return null;
};

module.exports = {
  YTDLP_PATH,
  SLEEP_INTERVAL,
  youtubedl,
  hasBinary,
  hasFfmpeg,
  startUpdate,
  waitForUpdate,
  getVersion,
  fetchInfo,
  buildDownloadFlags,
  parseProgressLine,
};
