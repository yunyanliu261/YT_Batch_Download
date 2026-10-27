// Shared helpers for the start/stop scripts (Node.js built-ins only, so they work before npm install)
const http = require('http');

const DEFAULT_PORT = 3000;

// Port from the command line (used by tests), otherwise the app's port
const portFromArgs = () => Number(process.argv[2]) || DEFAULT_PORT;

// Call the app's API on 127.0.0.1; resolves { status, json } or null if nothing answers
const request = (port, method, path, timeoutMs = 2000) => new Promise((resolve) => {
  const req = http.request({ host: '127.0.0.1', port, method, path, timeout: timeoutMs }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      let json = null;
      try { json = JSON.parse(body); } catch (e) {}
      resolve({ status: res.statusCode, json });
    });
  });
  req.on('timeout', () => { req.destroy(); resolve(null); });
  req.on('error', () => resolve(null));
  req.end();
});

// true when the app (this version or newer, which serves the web page) answers on the port
const isAppRunning = async (port) => {
  const res = await request(port, 'GET', '/api/health');
  return Boolean(res && res.status === 200 && res.json && res.json.status === 'ok' && res.json.ui);
};

module.exports = { DEFAULT_PORT, portFromArgs, request, isAppRunning };
