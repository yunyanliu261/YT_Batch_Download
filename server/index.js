const { createApp } = require('./src/app');
const { HOST, PORT } = require('./src/config');
const ytdlp = require('./src/ytdlp');

ytdlp.startUpdate();

createApp().listen(PORT, HOST, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
