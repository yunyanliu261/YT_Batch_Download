// Exit with code 1 (and explain what to do) if the backend or frontend port is already in use,
// for example by an older copy of the app that is still running. Used by start_app.bat / start_app.sh.
const net = require('net');

const PORTS = [
  { port: 3000, name: 'Backend' },
  { port: 5173, name: 'Frontend' },
];
// Old versions listened on all IPv4 interfaces, Vite may listen on IPv6 only
const HOSTS = ['127.0.0.1', '::1'];

const isListening = (port, host) => new Promise((resolve) => {
  const socket = net.connect({ port, host });
  socket.setTimeout(1000);
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('timeout', () => { socket.destroy(); resolve(false); });
  socket.once('error', () => resolve(false));
});

const main = async () => {
  const busy = [];
  for (const entry of PORTS) {
    for (const host of HOSTS) {
      if (await isListening(entry.port, host)) {
        busy.push(entry);
        break;
      }
    }
  }
  if (busy.length === 0) return;

  const ports = busy.map((b) => b.port);
  const isWindows = process.platform === 'win32';
  console.error('');
  for (const { port, name } of busy) {
    console.error(`[!] Port ${port} (${name}) is already in use.`);
  }
  console.error('Another copy of YouTube Downloader (possibly an older version) or another program is still running.');
  console.error('Close its "YouTube Downloader Backend/Frontend" windows, or find and stop it:');
  if (isWindows) {
    console.error(`    netstat -ano | findstr "${ports.map((p) => `:${p}`).join(' ')}"`);
    console.error('    taskkill /PID <PID from the last column> /F');
  } else {
    console.error(`    lsof -i ${ports.map((p) => `:${p}`).join(' -i ')}`);
    console.error('    kill <PID>');
  }
  console.error('Then run this script again.');
  console.error('');
  console.error(`[!] 連接埠 ${ports.join('、')} 已被佔用：可能是舊版本或其他程式仍在執行。請關閉相關視窗，或用上面的指令結束該程式後再重新啟動。`);
  process.exitCode = 1;
};

main();
