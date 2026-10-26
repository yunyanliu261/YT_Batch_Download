const test = require('node:test');
const assert = require('node:assert');
const { classifyError, parseErrorLine, createFailureTracker } = require('../src/errors');

// Real messages reported by yt-dlp
const NOT_AVAILABLE = 'ERROR: [youtube] w-8_4JU5VWA: This video is not available.';
const AGE = 'ERROR: [youtube] 8cBZxnY23wo: Sign in to confirm your age. This video may be inappropriate for some users. Use --cookies-from-browser or --cookies for the authentication.';
const BOT = "ERROR: [youtube] abcdefghijk: Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.";
const MEMBERS = 'ERROR: [youtube] abcdefghijk: Join this channel to get access to members-only content like this video, and other exclusive perks.';

test('parseErrorLine extracts the video id', () => {
  assert.deepStrictEqual(parseErrorLine(NOT_AVAILABLE), { id: 'w-8_4JU5VWA', message: 'This video is not available.' });
  assert.deepStrictEqual(parseErrorLine('ERROR: something broke'), { id: null, message: 'something broke' });
});

test('classifyError', () => {
  const msg = (line) => parseErrorLine(line).message;
  assert.strictEqual(classifyError(msg(AGE)), 'age');
  assert.strictEqual(classifyError(msg(BOT)), 'bot');
  assert.strictEqual(classifyError(msg(MEMBERS)), 'members');
  assert.strictEqual(classifyError('Private video. Sign in if you\'ve been granted access to this video'), 'private');
  assert.strictEqual(classifyError('The uploader has not made this video available in your country'), 'geo');
  assert.strictEqual(classifyError(msg(NOT_AVAILABLE)), 'unavailable');
  assert.strictEqual(classifyError('Requested format is not available. Use --list-formats for a list of available formats'), 'format');
  assert.strictEqual(classifyError('Unable to write file'), 'other');
});

test('"not available" with a members-only title is classified as members', () => {
  const message = parseErrorLine(NOT_AVAILABLE).message;
  assert.strictEqual(classifyError(message, '【ASMR | 會限、メン限】♡時長♡生乳心音'), 'members');
  assert.strictEqual(classifyError(message, 'Members Only stream'), 'members');
  assert.strictEqual(classifyError(message, 'Normal video'), 'unavailable');
});

test('failure tracker builds a summary and suggests cookies only when missing', () => {
  const titles = new Map([['w-8_4JU5VWA', '【會限】test']]);
  const tracker = createFailureTracker(titles);
  assert.strictEqual(tracker.add(NOT_AVAILABLE), 'members');
  assert.strictEqual(tracker.add(NOT_AVAILABLE), 'members', 'same video counted once');
  assert.strictEqual(tracker.add(AGE), 'age');
  tracker.add('ERROR: unknown failure');

  const summary = tracker.summary({ total: 10, downloaded: 5, skipped: 2, usedCookies: false });
  assert.deepStrictEqual(summary, {
    total: 10,
    downloaded: 5,
    skipped: 2,
    failed: 3,
    categories: { members: 1, age: 1, other: 1 },
    usedCookies: false,
    suggestCookies: true,
  });
  assert.strictEqual(tracker.summary({ total: 10, downloaded: 5, skipped: 2, usedCookies: true }).suggestCookies, false);

  const unavailableOnly = createFailureTracker();
  unavailableOnly.add(NOT_AVAILABLE);
  assert.strictEqual(unavailableOnly.summary({ total: 1, downloaded: 0, skipped: 0, usedCookies: false }).suggestCookies, true);

  const geoOnly = createFailureTracker();
  geoOnly.add('ERROR: [youtube] abcdefghijk: The uploader has not made this video available in your country');
  assert.strictEqual(geoOnly.summary({ total: 1, downloaded: 0, skipped: 0, usedCookies: false }).suggestCookies, false);
});
