const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Ad blockers' cookie-banner filter lists (e.g. EasyList Cookie: ###cookie-section, ###cookie-hint)
// hide elements by id or class, which made the Cookies option disappear for users with a blocker
test('client page has no ids or classes containing "cookie"', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'index.html'), 'utf8');
  const attrs = [...html.matchAll(/\s(id|class)="([^"]*)"/g)]
    .filter(([, , value]) => /cookie/i.test(value))
    .map(([, name, value]) => `${name}="${value}"`);
  assert.deepStrictEqual(attrs, []);
});
