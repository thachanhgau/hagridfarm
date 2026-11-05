// Free taps count on the real thing (owner 05/11/2026, audit J): the server cannot see these three, so the client must not
// send them on merely opening a panel or asking for a share that went nowhere.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const fn = (src, name) => src.split('\n').find((line) => line.startsWith(`function ${name}(`));

test('postcard counts on a saved image, not on opening the tab', () => {
  const game = read('./mobile-game.mjs'), card = read('./garden-postcard.mjs');
  assert.doesNotMatch(fn(game, 'postcardOptions').replace(/onSaved:[^,]+,/, ''), /'postcard'/);
  assert.match(fn(game, 'postcardOptions'), /onSaved:\(\)=>countTap\('postcard'\)/);
  assert.match(card, /link\.click\(\);\s*onSaved\?\.\(\);/);
});

test('shareFloo counts once the line reached Floo or the clipboard', () => {
  const share = fn(read('./mobile-game.mjs'), 'shareToFloo');
  assert.match(share, /\.then\(r=>\{if\(r\?\.floo\|\|r\?\.copied\)countTap\('shareFloo'\);return r;\}\)/);
  assert.doesNotMatch(share.slice(0, share.indexOf('.then(')), /'shareFloo'/);
});
