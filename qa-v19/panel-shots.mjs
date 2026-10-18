// Every panel, the level-up card and the night scene, in WebKit, for before/after review.
// Usage: node qa-v19/panel-shots.mjs <baseUrl> <outDir> — prints panels that overflow sideways,
// show a native <select>, or use buttons smaller than 44 px.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {webkit} = require(process.env.PLAYWRIGHT_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [base = 'http://127.0.0.1:62801', out = 'panel-shots'] = process.argv.slice(2);
const phone = (width, height) => ({viewport: {width, height}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
const SCREENS = [
  ['390x664', phone(390, 664)],
  ['1280x720', {viewport: {width: 1280, height: 720}, deviceScaleFactor: 1}],
  ['320x568', phone(320, 568)],
];
// [file, how to open]; the 320 px pass only shoots the shop and Hồ sơ.
const PANELS = [
  ['1-ho-so', (qa) => qa.openPanel('achievements')],
  ['2-so-tay', (qa) => qa.openPanel('almanac')],
  ['3-luu-but', (qa) => qa.openPanel('guestbook')],
  ['4-lo-trinh', (qa) => qa.openPanel('roadmap')],
  ['5-trang-tri', (qa) => qa.openPanel('collection')],
  ['6-cua-hang', (qa) => qa.openStore()],
  ['8-le-hoi', (qa) => qa.openEvents()],
];
const AUDIT = () => {
  const box = document.querySelector('.store-overlay .popover') || document.getElementById('panel');
  const issues = [];
  if (box.scrollWidth > box.clientWidth + 1) issues.push('sideways overflow');
  if (box.querySelector('select')) issues.push('native select');
  for (const b of box.querySelectorAll('button')) {
    const r = b.getBoundingClientRect();
    if (r.width && (r.width < 43.5 || r.height < 43.5)) issues.push(`small ${(b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return [...new Set(issues)];
};
const closeAll = (page) => page.evaluate(() => { document.getElementById('closePanel')?.click(); document.querySelector('.store-overlay')?.remove(); });

await fs.mkdir(out, {recursive: true});
for (const [label, device] of SCREENS) {
  const browser = await webkit.launch(process.env.WEBKIT_PATH ? {executablePath: process.env.WEBKIT_PATH} : {});
  const errors = [];
  // Panels: QA session (own storage), tutorial skipped.
  const page = await (await browser.newContext({...device})).newPage();
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.goto(`${base}/garden-v05/index.html?qa=1&shots=${Date.now()}`);
  await page.waitForSelector('.tutorial-skip:not([hidden])', {timeout: 8000}).then(() => page.click('.tutorial-skip')).catch(() => {});
  await page.waitForTimeout(1800);
  if (await page.isVisible('#owlLetter[open]')) await page.click('#closeLetter').catch(() => {});
  for (const [name, open] of PANELS) {
    if (label === '320x568' && !['1-ho-so', '6-cua-hang'].includes(name)) continue;
    await page.evaluate(`(${open})(window.__HAGRID_GARDEN_QA__)`);
    await page.waitForTimeout(700);
    await page.screenshot({path: path.join(out, `${label}-${name}.png`)});
    const issues = await page.evaluate(AUDIT);
    console.log(`${label}-${name}: ${issues.length ? issues.join('; ') : 'ok'}`);
    await closeAll(page);
    await page.waitForTimeout(200);
  }
  // Level-up card and night scene: the real first minutes on a fresh garden at night.
  if (label !== '320x568') {
    const night = await (await browser.newContext({...device})).newPage();
    night.on('pageerror', (e) => errors.push(String(e.message || e)));
    await night.goto(`${base}/garden-v05/index.html?atmo=night&shots=${Date.now()}`);
    try {
      await night.waitForSelector('.tutorial-pulse', {timeout: 10000});
      await night.waitForTimeout(1800);
      await night.click('.tutorial-pulse');
      await night.waitForFunction(() => document.querySelector('.tutorial-pulse') && !document.querySelector('.tutorial-pulse').disabled && document.querySelector('.tutorial-pulse').id !== 'plantButton', null, {timeout: 9000});
      await night.waitForTimeout(400);
      await night.click('.tutorial-pulse');
      await night.waitForSelector('#closeCelebration', {state: 'visible', timeout: 6000});
      await night.waitForTimeout(900);
      await night.screenshot({path: path.join(out, `${label}-7-len-cap.png`)});
      console.log(`${label}-7-len-cap: ok`);
      await night.click('#closeCelebration');
      await night.waitForTimeout(2200);
      await night.screenshot({path: path.join(out, `${label}-9-dem.png`)});
      const goal = await night.evaluate(() => { const g = document.getElementById('nextGoal'); if (!g || g.hidden) return 'hidden'; const r = g.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth ? 'ok' : `goal chip ${Math.round(r.left)}..${Math.round(r.right)}`; });
      console.log(`${label}-9-dem: ${goal}`);
    } catch (e) {
      await night.screenshot({path: path.join(out, `${label}-night-failed.png`)});
      console.log(`${label}-night: failed ${String(e.message).split('\n')[0]}`);
    }
  }
  if (errors.length) console.log(`${label} errors: ${[...new Set(errors)].join(' | ')}`);
  await browser.close();
}
