// Plays the first three minutes on a brand-new garden in WebKit (Safari's
// engine) on several screens and checks every pointer the player needs can be
// seen and tapped. Usage (server on 62795): node qa-v19/ftue-smoke.mjs [baseUrl]
// Writes qa-v19/ftue-smoke/report.json and one screenshot per step and device.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'ftue-smoke');
const base = process.argv[2] || 'http://127.0.0.1:62795';
const url = `${base}/garden-v05/index.html?playtest=1&smoke=${Date.now()}`;

const SCREENS = [
  ['iphone-se-320', devices['iPhone SE']],
  ['iphone-13-390', devices['iPhone 13']],
  ['iphone-13-landscape', devices['iPhone 13 landscape']],
  ['ipad-mini-768', devices['iPad Mini']],
  ['desktop-1280', {viewport: {width: 1280, height: 720}, deviceScaleFactor: 1}],
];

// In-page helpers: tutorial step, world→screen, and "can the player see and tap this point".
const PAGE_HELPERS = () => {
  window.__smoke = {
    step() {
      try { return JSON.parse(JSON.parse(localStorage.getItem('hagrid-garden-v05-play-v23-save'))['hagrid-tutorial-v1']).step; } catch { return null; }
    },
    toScreen([x, y]) {
      const c = document.getElementById('world'), r = c.getBoundingClientRect();
      return [r.left + x * r.width / c.width, r.top + y * r.height / c.height];
    },
    iso(col, row) { return [1120 + (col - row) * 32, 300 + (col + row) * 16]; },
    open([x, y]) {
      if (x < 4 || y < 4 || x > innerWidth - 4 || y > innerHeight - 4) return 'off-screen';
      const hit = document.elementFromPoint(x, y);
      return hit && (hit.id === 'world' || hit.closest('#cameraViewport') && hit.tagName === 'CANVAS') ? 'ok' : `covered by ${hit?.id || hit?.className || hit?.tagName}`;
    },
    rectInView(el) {
      if (!el || el.hidden || !el.getClientRects().length) return 'missing';
      const r = el.getBoundingClientRect();
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return `outside ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit === el || el.contains(hit) ? 'ok' : `covered by ${hit?.id || hit?.className}`;
    },
    line() { // Hagrid's tutorial line: on screen, readable, not hiding the button to press.
      const el = document.querySelector('.tutorial-bubble');
      if (!el || el.hidden) return 'missing';
      const r = el.getBoundingClientRect(), px = parseFloat(getComputedStyle(el).fontSize);
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return `outside ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`;
      if (px < 12) return `text ${px}px`;
      const p = document.querySelector('.tutorial-pulse')?.getBoundingClientRect();
      return p && r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top ? 'covers the glowing button' : 'ok';
    },
    bubble(xy, width = 230) { // Hagrid's bubble ends 94 px above his feet and grows with the tutorial speech scale.
      const c = document.getElementById('world'), k = Number(c.dataset.speechScale) || 1;
      const left = k > 1 || c.dataset.speechScale ? xy[0] - 24 * k : xy[0] - width / 2; // tutorial bubbles grow rightwards
      const [l, t] = this.toScreen([left, xy[1] - 94 - 24 * k]), [rr, b] = this.toScreen([left + width * k, xy[1] - 94]);
      if (!(l >= 0 && t >= 0 && rr <= innerWidth && b <= innerHeight)) return `cut ${Math.round(l)},${Math.round(t)},${Math.round(rr)},${Math.round(b)}`;
      const px = 11 * k * c.getBoundingClientRect().width / c.width; // on-screen font size
      return px >= 11.5 ? 'ok' : `text ${px.toFixed(1)}px`;
    },
  };
};

async function waitStep(page, step, ms = 8000) {
  await page.waitForFunction((s) => window.__smoke?.step() === s, step, {timeout: ms});
}

async function run(name, device) {
  const browser = await webkit.launch(process.env.WEBKIT_PATH ? {executablePath: process.env.WEBKIT_PATH} : {});
  const context = await browser.newContext({...device});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const checks = [];
  const check = (label, value) => checks.push({label, ok: value === 'ok', value});
  const shot = (step) => page.screenshot({path: path.join(out, `${name}-${step}.png`)});
  try {
    await page.goto(url);
    await page.evaluate(PAGE_HELPERS);
    await waitStep(page, 'plant');
    await page.waitForTimeout(1800); // camera glide
    await shot('plant');
    check('plant: Hagrid line visible', await page.evaluate(() => __smoke.line()));
    check('plant: plot 1 visible', await page.evaluate(() => __smoke.open(__smoke.toScreen(__smoke.iso(3, 4)))));
    check('plant: glowing button', await page.evaluate(() => __smoke.rectInView(document.querySelector('.tutorial-pulse'))));
    check('plant: skip chip', await page.evaluate(() => __smoke.rectInView(document.querySelector('.tutorial-skip'))));
    await page.click('.tutorial-pulse');
    await waitStep(page, 'harvest');
    await page.waitForTimeout(300);
    await shot('harvest');
    check('harvest: glowing button', await page.evaluate(() => __smoke.rectInView(document.querySelector('.tutorial-pulse'))));
    check('harvest: button enabled within 300 ms', await page.evaluate(() => (document.querySelector('.tutorial-pulse')?.disabled ? 'disabled' : 'ok')));
    await page.click('.tutorial-pulse');
    await waitStep(page, 'feed');
    if (await page.isVisible('#closeCelebration')) {
      check('level-up: close button', await page.evaluate(() => __smoke.rectInView(document.getElementById('closeCelebration'))));
      await page.click('#closeCelebration');
    }
    await page.waitForTimeout(1500); // camera glide to the visiting Puffskein
    await shot('feed');
    check('feed: Hagrid line visible', await page.evaluate(() => __smoke.line()));
    const guest = await page.evaluate(() => { const [x, y] = __smoke.toScreen(__smoke.iso(1.2, 7)); return [x, y - 6]; });
    check('feed: Puffskein visible and tappable', await page.evaluate((p) => __smoke.open(p), guest));
    if (device.hasTouch) await page.touchscreen.tap(guest[0], guest[1]); else await page.mouse.click(guest[0], guest[1]);
    await waitStep(page, 'owl', 4000);
    await waitStep(page, 'done', 5000);
    await page.waitForTimeout(400);
    check('owl: letter opened', await page.evaluate(() => (document.getElementById('owlLetter')?.open ? 'ok' : 'closed')));
    await shot('done');
  } catch (error) {
    checks.push({label: `stopped at ${await page.evaluate(() => window.__smoke?.step()).catch(() => '?')}`, ok: false, value: String(error.message).split('\n')[0]});
    await shot('failed').catch(() => {});
  }
  if (errors.length) checks.push({label: 'console/page errors', ok: false, value: errors.slice(0, 3).join(' | ')});
  await browser.close();
  return {screen: name, viewport: device.viewport, ok: checks.every((c) => c.ok), checks};
}

await fs.mkdir(out, {recursive: true});
const results = [];
for (const [name, device] of SCREENS) results.push(await run(name, device));
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify({url: url.replace(/smoke=\d+/, 'smoke=…'), date: new Date().toISOString().slice(0, 10), results}, null, 2) + '\n');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.screen} ${r.viewport.width}x${r.viewport.height}`);
  for (const c of r.checks) if (!c.ok) console.log(`  ✗ ${c.label}: ${c.value}`);
}
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
