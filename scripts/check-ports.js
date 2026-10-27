// Run by start_app.bat / start_app.sh before starting the server.
// Exit codes: 0 = port is free, 2 = YouTube Downloader is already running (just open the browser),
//             1 = the port is used by something else, e.g. an older version (explains what to do)
const net = require('net');
const { portFromArgs, isAppRunning } = require('./lib');

// Old versions listened on all IPv4 interfaces; check IPv6 loopback too
const HOSTS = ['127.0.0.1', '::1'];

const isListening = (port, host) => new Promise((resolve) => {
  const socket = net.connect({ port, host });
  socket.setTimeout(1000);
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('timeout', () => { socket.destroy(); resolve(false); });
  socket.once('error', () => resolve(false));
});

const main = async () => {
  const port = portFromArgs();
  let busy = false;
  for (const host of HOSTS) {
    if (await isListening(port, host)) { busy = true; break; }
  }
  if (!busy) return;

  if (await isAppRunning(port)) {
    console.log('YouTube Downloader is already running.');
    process.exitCode = 2;
    return;
  }

  const isWindows = process.platform === 'win32';
  console.error('');
  console.error(`[!] Port ${port} is already in use.`);
  console.error('Another program, or an older version of YouTube Downloader, is still running.');
  console.error('Close its windows, or find and stop it:');
  if (isWindows) {
    console.error(`    netstat -ano | findstr ":${port}"`);
    console.error('    taskkill /PID <PID from the last column> /F');
  } else {
    console.error(`    lsof -i :${port}`);
    console.error('    kill <PID>');
  }
  console.error('Then start the app again.');
  console.error('');
  console.error(`[!] 連接埠 ${port} 已被佔用：可能是舊版本或其他程式仍在執行。請關閉相關視窗，或用上面的指令結束該程式後再重新啟動。`);
  process.exitCode = 1;
};

main();
