// Tests for the launcher helper scripts in ../../scripts, run against fake servers on random ports
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const { execFile } = require('child_process');

const SCRIPTS = path.join(__dirname, '..', '..', 'scripts');

const run = (script, port, env = {}) => new Promise((resolve) => {
  execFile(process.execPath, [path.join(SCRIPTS, script), String(port)], { env: { ...process.env, ...env } },
    (err, stdout, stderr) => resolve({ code: err ? err.code : 0, out: stdout + stderr }));
});

// handler(req, res) -> fake server; returns { port, close }
const fakeServer = (handler) => new Promise((resolve) => {
  const server = http.createServer(handler).listen(0, '127.0.0.1', () => {
    resolve({ port: server.address().port, close: () => new Promise((r) => server.close(r)) });
  });
});

const freePort = async () => {
  const s = await fakeServer(() => {});
  await s.close();
  return s.port;
};

const appLike = (req, res) => {
  if (req.url === '/api/health') return res.end(JSON.stringify({ status: 'ok', ui: true }));
  if (req.url === '/api/shutdown' && req.method === 'POST') return res.end('{"status":"stopping"}');
  res.statusCode = 404;
  res.end();
};

const otherProgram = (req, res) => { res.statusCode = 404; res.end('not here'); };

test('check-ports: free port -> 0, running app -> 2, other program -> 1', async () => {
  assert.strictEqual((await run('check-ports.js', await freePort())).code, 0);

  const app = await fakeServer(appLike);
  const r2 = await run('check-ports.js', app.port);
  await app.close();
  assert.strictEqual(r2.code, 2);
  assert.match(r2.out, /already running/);

  const other = await fakeServer(otherProgram);
  const r1 = await run('check-ports.js', other.port);
  await other.close();
  assert.strictEqual(r1.code, 1);
  assert.match(r1.out, new RegExp(`Port ${other.port} is already in use`));
});

test('wait-for-server: ready -> 0, nothing -> 1 after the timeout', async () => {
  const app = await fakeServer(appLike);
  assert.strictEqual((await run('wait-for-server.js', app.port)).code, 0);
  await app.close();

  const r = await run('wait-for-server.js', await freePort(), { WAIT_TIMEOUT_MS: '1200' });
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /did not start/);
});

test('stop-server: stops the app, tolerates not running, fails on other programs', async () => {
  const app = await fakeServer(appLike);
  const stopped = await run('stop-server.js', app.port);
  await app.close();
  assert.strictEqual(stopped.code, 0);
  assert.match(stopped.out, /has been stopped/);

  const none = await run('stop-server.js', await freePort());
  assert.strictEqual(none.code, 0);
  assert.match(none.out, /not running/);

  const other = await fakeServer(otherProgram);
  const failed = await run('stop-server.js', other.port);
  await other.close();
  assert.strictEqual(failed.code, 1);
});
