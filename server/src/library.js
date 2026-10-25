const fs = require('fs');
const path = require('path');
const { ARCHIVE_FILE_NAME } = require('./config');
const { sanitizeFolderName } = require('./validation');

const isChannelInfo = (info) =>
  info._type === 'playlist' && Boolean(info.channel_id) && info.id === info.channel_id;

/**
 * Decide where a download goes, based on the info returned by yt-dlp:
 *   video / channel  -> <base>/<channel>/
 *   playlist         -> <base>/<channel>/<playlist title>/
 * The archive always lives in the channel folder, so a video is only downloaded once per
 * channel no matter which playlist it was found in (and existing archives keep working).
 */
const resolveTarget = (info, baseDir) => {
  const channel = sanitizeFolderName(info.channel || info.uploader || 'UnknownChannel');
  const channelDir = path.join(baseDir, channel);
  const isPlaylist = info._type === 'playlist' && !isChannelInfo(info);
  const outputDir = isPlaylist
    ? path.join(channelDir, sanitizeFolderName(info.title || info.playlist_title || info.id))
    : channelDir;

  return {
    kind: isPlaylist ? 'playlist' : (info._type === 'playlist' ? 'channel' : 'video'),
    outputDir,
    archivePath: path.join(channelDir, ARCHIVE_FILE_NAME),
  };
};

// List of { id, title } for every video the URL points to
const listEntries = (info) => {
  if (Array.isArray(info.entries)) {
    return info.entries.filter(Boolean).map((e) => ({ id: e.id, title: e.title }));
  }
  return info.id ? [{ id: info.id, title: info.title }] : [];
};

// Video IDs recorded in a yt-dlp archive file ("<extractor> <id>" per line)
const readArchiveIds = (archivePath) => {
  const ids = new Set();
  if (!fs.existsSync(archivePath)) return ids;
  for (const line of fs.readFileSync(archivePath, 'utf8').split('\n')) {
    const parts = line.trim().split(' ');
    if (parts.length >= 2) ids.add(parts[1]);
  }
  return ids;
};

// How many of the entries are already downloaded vs still pending
const buildPlan = (entries, archivedIds) => {
  const downloaded = entries.filter((e) => e.id && archivedIds.has(e.id)).length;
  return { total: entries.length, downloaded, pending: entries.length - downloaded };
};

module.exports = { resolveTarget, listEntries, readArchiveIds, buildPlan };
