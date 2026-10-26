const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Write uploaded cookies.txt content to a uniquely named temp file
const createCookieFile = (content) => {
  const filePath = path.join(os.tmpdir(), `temp_cookie_${crypto.randomUUID()}.txt`);
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  return filePath;
};

const removeFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {}
  }
};

// yt-dlp flags for the chosen cookie source (uploaded file wins over browser)
const cookieFlags = ({ cookieFilePath, browser }) => {
  if (cookieFilePath) return { cookies: cookieFilePath };
  if (browser) return { cookiesFromBrowser: browser };
  return {};
};

module.exports = { createCookieFile, removeFile, cookieFlags };
