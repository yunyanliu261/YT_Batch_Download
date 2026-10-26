const { createApp } = require('./src/app');
const { HOST, PORT } = require('./src/config');
const ytdlp = require('./src/ytdlp');

ytdlp.startUpdate();

const server = createApp().listen(PORT, HOST, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Another copy of YouTube Downloader (possibly an older version) may still be running. Close it and start again.`);
    console.error(`連接埠 ${PORT} 已被佔用，可能是舊版本仍在執行。請先關閉後再重新啟動。`);
  } else {
    console.error(`Server failed to start: ${err.message}`);
  }
  process.exit(1);
});
