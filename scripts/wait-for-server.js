// Wait until the server answers (used by the start scripts before opening the browser).
// Exit code 0 when ready, 1 after the timeout.
const { portFromArgs, isAppRunning } = require('./lib');

const TIMEOUT_MS = Number(process.env.WAIT_TIMEOUT_MS) || 60000;

const main = async () => {
  const port = portFromArgs();
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isAppRunning(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.error(`The server did not start on port ${port}. See server/server.log, or run start_app.bat / start_app.sh to see the error.`);
  process.exitCode = 1;
};

main();
