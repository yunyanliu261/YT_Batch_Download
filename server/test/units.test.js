const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseBrowser, parseQuality, sanitizeFolderName } = require('../src/validation');
const { resolveTarget, listEntries, readArchiveIds, buildPlan } = require('../src/library');
const { buildDownloadFlags, parseProgressLine, SLEEP_INTERVAL } = require('../src/ytdlp');
const { cookieFlags } = require('../src/cookies');

const base = path.join(os.tmpdir(), 'ytbd-base');

test('parseBrowser and parseQuality only allow known values', () => {
  assert.strictEqual(parseBrowser('firefox'), 'firefox');
  assert.strictEqual(parseBrowser('none'), null);
  assert.strictEqual(parseBrowser('chrome:/etc'), null);
  assert.strictEqual(parseQuality('720p'), '720p');
  assert.strictEqual(parseQuality('--exec'), 'best');
});

test('sanitizeFolderName strips characters that are invalid on Windows', () => {
  assert.strictEqual(sanitizeFolderName('A/B:C*?"<>|D'), 'A_B_C_D');
  assert.strictEqual(sanitizeFolderName('Name. '), 'Name');
  assert.strictEqual(sanitizeFolderName(''), 'Unknown');
  assert.strictEqual(sanitizeFolderName('x'.repeat(300)).length, 100);
});

test('resolveTarget: single video goes to the channel folder', () => {
  const t = resolveTarget({ _type: 'video', id: 'abc', channel: 'Chan' }, base);
  assert.strictEqual(t.kind, 'video');
  assert.strictEqual(t.outputDir, path.join(base, 'Chan'));
  assert.strictEqual(t.archivePath, path.join(base, 'Chan', 'download_archive.txt'));
});

test('resolveTarget: channel goes to the channel folder', () => {
  const t = resolveTarget({ _type: 'playlist', id: 'UC123', channel_id: 'UC123', channel: 'Chan', title: 'Chan - Videos' }, base);
  assert.strictEqual(t.kind, 'channel');
  assert.strictEqual(t.outputDir, path.join(base, 'Chan'));
});

test('resolveTarget: playlist gets its own folder but shares the channel archive', () => {
  const t = resolveTarget({ _type: 'playlist', id: 'PL1', channel_id: 'UC123', channel: 'Chan', title: 'My: List' }, base);
  assert.strictEqual(t.kind, 'playlist');
  assert.strictEqual(t.outputDir, path.join(base, 'Chan', 'My_ List'));
  assert.strictEqual(t.archivePath, path.join(base, 'Chan', 'download_archive.txt'));
});

test('listEntries, readArchiveIds and buildPlan', () => {
  const entries = listEntries({ entries: [{ id: 'a' }, null, { id: 'b' }, { id: 'c' }] });
  assert.deepStrictEqual(entries.map((e) => e.id), ['a', 'b', 'c']);
  assert.deepStrictEqual(listEntries({ id: 'v', title: 'T' }), [{ id: 'v', title: 'T' }]);

  const archive = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ytbd-')), 'download_archive.txt');
  fs.writeFileSync(archive, 'youtube a\r\nyoutube c\n\n');
  const ids = readArchiveIds(archive);
  assert.ok(ids.has('a') && ids.has('c') && !ids.has('b'));
  assert.deepStrictEqual(buildPlan(entries, ids), { total: 3, downloaded: 2, pending: 1 });
  assert.strictEqual(readArchiveIds(archive + '.missing').size, 0);
});

test('buildDownloadFlags', () => {
  const common = { outputDir: '/out', archivePath: '/out/download_archive.txt' };

  const single = buildDownloadFlags({ ...common, quality: '720p', metadata: { thumbnail: true } });
  assert.match(single.format, /height<=720/);
  assert.strictEqual(single.mergeOutputFormat, 'mp4');
  assert.strictEqual(single.minSleepInterval, undefined, 'no sleep for a single video');
  assert.strictEqual(single.writeThumbnail, true);
  assert.strictEqual(single.embedThumbnail, undefined, 'embedding needs ffprobe');
  assert.strictEqual(single.newline, true);
  assert.match(single.output, /\[%\(id\)s\]/);

  const multi = buildDownloadFlags({ ...common, quality: 'audio', multipleVideos: true, extraFlags: cookieFlags({ browser: 'firefox' }) });
  assert.strictEqual(multi.minSleepInterval, SLEEP_INTERVAL.min);
  assert.strictEqual(multi.maxSleepInterval, SLEEP_INTERVAL.max);
  assert.strictEqual(multi.extractAudio, true);
  assert.strictEqual(multi.format, undefined);
  assert.strictEqual(multi.cookiesFromBrowser, 'firefox');
});

test('cookieFlags prefers the uploaded file', () => {
  assert.deepStrictEqual(cookieFlags({ cookieFilePath: '/tmp/c.txt', browser: 'chrome' }), { cookies: '/tmp/c.txt' });
  assert.deepStrictEqual(cookieFlags({}), {});
});

test('parseProgressLine', () => {
  assert.deepStrictEqual(
    parseProgressLine('[download]  12.6% of  218.53KiB at    2.97MiB/s ETA 00:05'),
    { type: 'progress', percent: 12.6, size: '218.53KiB', speed: '2.97MiB/s', eta: '00:05' },
  );
  assert.deepStrictEqual(
    parseProgressLine('[download]   0.0% of ~  1.20GiB at  Unknown B/s ETA Unknown'),
    { type: 'progress', percent: 0, size: '1.20GiB', speed: null, eta: null },
  );
  assert.strictEqual(parseProgressLine('[download] 100% of  218.53KiB in 00:00:00 at 2.66MiB/s').percent, 100);
  assert.deepStrictEqual(parseProgressLine('[download] Downloading item 3 of 10'), { type: 'item', index: 3, total: 10 });
  assert.deepStrictEqual(parseProgressLine('[download] Sleeping 12.50 seconds ...'), { type: 'sleep', seconds: 12.5 });
  assert.strictEqual(parseProgressLine('[youtube] abc: Downloading webpage'), null);
});

test('jsRuntimeFlags points yt-dlp at Node.js 22+ only', () => {
  const { jsRuntimeFlags, isNodeSupported } = require('../src/ytdlp');
  assert.deepStrictEqual(jsRuntimeFlags('22.0.0', 'C:\\Program Files\\nodejs\\node.exe'), { jsRuntimes: 'node:C:\\Program Files\\nodejs\\node.exe' });
  assert.deepStrictEqual(jsRuntimeFlags('24.20.0', '/usr/bin/node'), { jsRuntimes: 'node:/usr/bin/node' });
  assert.deepStrictEqual(jsRuntimeFlags('20.18.0', '/usr/bin/node'), {});
  assert.strictEqual(isNodeSupported('21.9.9'), false);

  // Download flags include it for the Node.js running the tests (CI and dev use 22+)
  const flags = buildDownloadFlags({ outputDir: '/out', archivePath: '/out/a.txt', quality: 'best' });
  if (isNodeSupported()) assert.strictEqual(flags.jsRuntimes, `node:${process.execPath}`);
});
