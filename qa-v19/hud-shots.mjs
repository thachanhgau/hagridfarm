// Main screen after skipping the tutorial, on five screens, in WebKit.
// Usage: node qa-v19/hud-shots.mjs <baseUrl> <outDir> — also prints overlap/off-screen problems.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [base = 'http://127.0.0.1:62797', out = 'hud-shots'] = process.argv.slice(2);
const SCREENS = [
  ['320x568', devices['iPhone SE']],
  ['390x664', {...devices['iPhone 13'], viewport: {width: 390, height: 664}}],
  ['750x342', {...devices['iPhone 13 landscape'], viewport: {width: 750, height: 342}}],
  ['768x1024', devices['iPad Mini']],
  ['1280x720', {viewport: {width: 1280, height: 720}, deviceScaleFactor: 1}],
];
// Visible HUD controls that leave the screen, overlap each other, or clip their text.
const AUDIT = () => {
  const sel = '.hud button, .hud [role=status], .next-goal, .camera-tools button, .play-dock button:not([hidden]), .speech-bar, .hagrid-speech';
  const els = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'));
  const issues = [];
  const rects = els.map((e) => [e, e.getBoundingClientRect()]);
  const name = (e) => e.id || e.className || e.tagName;
  for (const [e, r] of rects) {
    if (r.width < 1) continue;
    if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) issues.push(`off-screen ${name(e)}`);
    if (e.scrollWidth > e.clientWidth + 1 && ['hidden', 'clip'].includes(getComputedStyle(e).overflowX)) issues.push(`clipped ${name(e)}`);
    if (e.matches('button') && (r.width < 43.5 || r.height < 43.5) && !e.closest('.seed-tray,.item-tray')) issues.push(`small ${name(e)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [b, rb] = rects[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 2 && oy > 2) issues.push(`overlap ${name(a)} × ${name(b)}`);
  }
  return issues;
};

await fs.mkdir(out, {recursive: true});
for (const [label, device] of SCREENS) {
  const browser = await webkit.launch(process.env.WEBKIT_PATH ? {executablePath: process.env.WEBKIT_PATH} : {});
  const page = await (await browser.newContext({...device})).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.goto(`${base}/garden-v05/index.html?playtest=1&shots=${Date.now()}`);
  await page.waitForSelector('.tutorial-skip:not([hidden])', {timeout: 8000}).then(() => page.click('.tutorial-skip')).catch(() => {});
  await page.waitForTimeout(2200);
  if (await page.isVisible('#owlLetter[open]')) await page.click('#closeLetter').catch(() => {});
  await page.waitForTimeout(600);
  for (const state of ['default', 'toggled']) {
    if (state === 'toggled') { await page.click('#hudToggle'); await page.waitForTimeout(300); }
    const folded = await page.evaluate(() => document.body.classList.contains('hud-compact'));
    const name = `${label}-${folded ? 'gon' : 'mo'}`;
    await page.screenshot({path: path.join(out, `${name}.png`)});
    const issues = await page.evaluate(AUDIT);
    console.log(`${name}: ${issues.length ? issues.join('; ') : 'ok'}${errors.length ? ' | errors: ' + errors.join(' | ') : ''}`);
  }
  await browser.close();
}
