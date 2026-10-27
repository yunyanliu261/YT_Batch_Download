// Stop a running YouTube Downloader (used by stop_app.bat). Downloads in progress are stopped.
// Exit code 0 when stopped or not running, 1 on errors.
const { portFromArgs, request } = require('./lib');

const main = async () => {
  const port = portFromArgs();
  const res = await request(port, 'POST', '/api/shutdown');
  if (!res) {
    console.log('YouTube Downloader is not running.');
  } else if (res.status === 200) {
    console.log('YouTube Downloader has been stopped.');
  } else {
    console.error(`Could not stop the server on port ${port} (HTTP ${res.status}). It may be another program or an older version.`);
    process.exitCode = 1;
  }
};

main();
