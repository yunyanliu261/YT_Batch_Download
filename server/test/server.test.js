const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { createApp } = require('../src/app');
const { parseVideoUrl, isValidDownloadPath } = require('../src/validation');

let server;
let port;

test.before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  port = server.address().port;
});

test.after(() => server.close());

// Raw request so the Host and Origin headers can be set freely
const request = (method, urlPath, { body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      method,
      path: urlPath,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

test('parseVideoUrl accepts only http(s) URLs', () => {
  assert.strictEqual(parseVideoUrl(' https://www.youtube.com/watch?v=abc '), 'https://www.youtube.com/watch?v=abc');
  assert.strictEqual(parseVideoUrl('http://youtu.be/abc'), 'http://youtu.be/abc');
  assert.strictEqual(parseVideoUrl('--exec=calc.exe'), null);
  assert.strictEqual(parseVideoUrl('--config-locations=/tmp/x'), null);
  assert.strictEqual(parseVideoUrl('file:///etc/passwd'), null);
  assert.strictEqual(parseVideoUrl(''), null);
  assert.strictEqual(parseVideoUrl(undefined), null);
  assert.strictEqual(parseVideoUrl({}), null);
});

test('isValidDownloadPath requires empty or absolute path', () => {
  assert.ok(isValidDownloadPath(undefined));
  assert.ok(isValidDownloadPath(''));
  assert.ok(isValidDownloadPath(process.cwd()));
  assert.ok(!isValidDownloadPath('relative/dir'));
  assert.ok(!isValidDownloadPath(123));
});

test('health check works from the local frontend', async () => {
  const res = await request('GET', '/api/health', { headers: { Origin: 'http://localhost:5173' } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:5173');
});

test('requests from a foreign origin are rejected', async () => {
  const res = await request('POST', '/api/check-path', {
    body: { downloadPath: '/tmp/should-not-be-created' },
    headers: { Origin: 'https://evil.example' },
  });
  assert.strictEqual(res.status, 403);
});

test('CORS preflight from a foreign origin is rejected', async () => {
  const res = await request('OPTIONS', '/api/download', {
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
  });
  assert.strictEqual(res.status, 403);
});

test('requests with a non-local Host header are rejected (DNS rebinding)', async () => {
  const res = await request('GET', '/api/health', { headers: { Host: 'evil.example:3000' } });
  assert.strictEqual(res.status, 403);
});

test('get-info rejects option-like and non-http URLs', async () => {
  for (const url of ['--exec=calc.exe', 'file:///etc/passwd', '']) {
    const res = await request('POST', '/api/get-info', { body: { url } });
    assert.strictEqual(res.status, 400, url);
  }
});

test('download rejects option-like URLs and relative paths before starting', async () => {
  let res = await request('POST', '/api/download', { body: { url: '--exec=calc.exe' } });
  assert.strictEqual(res.status, 400);
  res = await request('POST', '/api/download', {
    body: { url: 'https://www.youtube.com/watch?v=abc', downloadPath: 'relative/dir' },
  });
  assert.strictEqual(res.status, 400);
});

test('check-path rejects relative paths', async () => {
  const res = await request('POST', '/api/check-path', { body: { downloadPath: 'relative/dir' } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.json.valid, false);
});
