const path = require('path');

module.exports = {
  PORT: 3000,
  // Only listen on loopback so other machines on the network cannot drive the downloader
  HOST: '127.0.0.1',
  // Default download directory (server/downloads)
  DEFAULT_DOWNLOAD_DIR: path.join(__dirname, '..', 'downloads'),
  ARCHIVE_FILE_NAME: 'download_archive.txt',
  // Built web page (client: npm run build), served by this server so only one process is needed
  CLIENT_DIST_DIR: path.join(__dirname, '..', '..', 'client', 'dist'),
};
