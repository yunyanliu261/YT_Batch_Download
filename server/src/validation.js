const path = require('path');

const SUPPORTED_BROWSERS = ['chrome', 'edge', 'firefox', 'opera', 'safari', 'brave', 'chromium', 'vivaldi'];
const SUPPORTED_QUALITIES = ['best', '1080p', '720p', '480p', 'audio'];

/**
 * Only accept http(s) URLs so a value such as "--exec=..." can never reach yt-dlp as an option.
 * (youtube-dl-exec also puts "--" before the URL; this is the first line of defence.)
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

// Browser name for --cookies-from-browser, or null for "no browser cookies"
const parseBrowser = (value) => (SUPPORTED_BROWSERS.includes(value) ? value : null);

const parseQuality = (value) => (SUPPORTED_QUALITIES.includes(value) ? value : 'best');

// Make a channel / playlist name safe to use as a folder name on Windows, macOS and Linux
const sanitizeFolderName = (name) => {
  const cleaned = String(name || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '_')
    .replace(/[. ]+$/, '') // Windows does not allow trailing dots or spaces
    .trim()
    .slice(0, 100);
  return cleaned || 'Unknown';
};

module.exports = {
  SUPPORTED_BROWSERS,
  parseVideoUrl,
  isValidDownloadPath,
  parseBrowser,
  parseQuality,
  sanitizeFolderName,
};
