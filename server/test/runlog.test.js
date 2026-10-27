const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRunLog, fileStamp, formatTime } = require('../src/runlog');

test('fileStamp and formatTime use local time', () => {
  const d = new Date(2026, 9, 27, 8, 5, 9);
  assert.strictEqual(formatTime(d), '2026-10-27 08:05:09');
  assert.strictEqual(fileStamp(d), '20261027-080509');
});

test('run log buffers lines until opened, then writes them all to the file', async () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ytbd-log-')), 'logs');
  const log = createRunLog(new Date(2026, 9, 27, 20, 30, 1));
  log.write('[request] before folder exists');
  const filePath = log.open(dir);
  assert.strictEqual(filePath, path.join(dir, '20261027-203001.log'));
  log.write('[info] after open');
  await new Promise((resolve) => log.close(resolve));
  log.write('[info] ignored after close');

  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 2);
  assert.match(lines[0], /^\[\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\] \[request\] before folder exists$/);
  assert.match(lines[1], /\[info\] after open$/);
});

test('closing a run log that was never opened is safe', async () => {
  const log = createRunLog();
  log.write('nothing to write');
  await new Promise((resolve) => log.close(resolve));
  assert.strictEqual(log.path, null);
});
