const { createApp } = require('./src/app');
const { HOST, PORT } = require('./src/config');
const ytdlp = require('./src/ytdlp');
const { stopAllDownloads } = require('./src/routes/download');

ytdlp.startUpdate();

let server;

// Quit button, stop_app.bat, Ctrl+C: stop downloads in progress, then exit
const shutdown = () => {
  const stopped = stopAllDownloads();
  console.log(`Shutting down${stopped ? ` (stopped ${stopped} download(s) in progress)` : ''}...`);
  server.close();
  // Give yt-dlp a moment to exit and log files to flush
  setTimeout(() => process.exit(0), 1000);
};

server = createApp({ shutdown }).listen(PORT, HOST, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Another copy of YouTube Downloader (possibly an older version) may still be running. Close it and start again.`);
    console.error(`連接埠 ${PORT} 已被佔用，可能是舊版本仍在執行。請先關閉後再重新啟動。`);
  } else {
    console.error(`Server failed to start: ${err.message}`);
  }
  process.exit(1);
});
