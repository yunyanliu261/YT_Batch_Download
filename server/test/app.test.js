const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { createApp } = require('../src/app');

const listen = (app) => new Promise((resolve) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
});

const call = (server, method, urlPath) => new Promise((resolve, reject) => {
  const req = http.request({ host: '127.0.0.1', port: server.address().port, method, path: urlPath }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }));
  });
  req.on('error', reject);
  req.end();
});

const makeDist = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ytbd-dist-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>YouTube Downloader</title>');
  return dir;
};

test('serves the built page and reports ui in the health check', async () => {
  const server = await listen(createApp({ clientDist: makeDist() }));
  try {
    const page = await call(server, 'GET', '/');
    assert.strictEqual(page.status, 200);
    assert.match(page.type, /text\/html/);
    assert.match(page.body, /YouTube Downloader/);
    const health = JSON.parse((await call(server, 'GET', '/api/health')).body);
    assert.strictEqual(health.ui, true);
  } finally {
    server.close();
  }
});

test('explains how to build when the page is missing', async () => {
  const server = await listen(createApp({ clientDist: path.join(os.tmpdir(), 'ytbd-no-such-dist') }));
  try {
    const page = await call(server, 'GET', '/');
    assert.strictEqual(page.status, 503);
    assert.match(page.body, /npm run build/);
    assert.strictEqual(JSON.parse((await call(server, 'GET', '/api/health')).body).ui, false);
  } finally {
    server.close();
  }
});

test('shutdown answers first, then calls the shutdown handler', async () => {
  let called = false;
  const server = await listen(createApp({ clientDist: makeDist(), shutdown: () => { called = true; } }));
  try {
    const res = await call(server, 'POST', '/api/shutdown');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(JSON.parse(res.body).status, 'stopping');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.strictEqual(called, true);
  } finally {
    server.close();
  }
});

test('shutdown is unavailable without a handler', async () => {
  const server = await listen(createApp({ clientDist: makeDist() }));
  try {
    assert.strictEqual((await call(server, 'POST', '/api/shutdown')).status, 503);
  } finally {
    server.close();
  }
});
