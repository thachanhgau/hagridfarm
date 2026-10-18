// Connected mode on the in-memory fixture wallet (server rules), iPhone 390x664, in WebKit:
// owl quests + chest, a claim, the festival panel with free-tap caps, a bond gift, a pet, a decoration turned in place, an achievement,
// and builds the server refuses.
// Usage: node qa-v19/server-daily-shots.mjs <baseUrl> <outDir>
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const [base = 'http://127.0.0.1:62795', out = 'server-daily-shots'] = process.argv.slice(2);
const device = {...devices['iPhone 13'], viewport: {width: 390, height: 664}};
const page0 = `${base}/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=100&day=2026-10-25`;
await fs.mkdir(out, {recursive: true});
const browser = await webkit.launch(process.env.WEBKIT_PATH ? {executablePath: process.env.WEBKIT_PATH} : {});
const results = [];

async function open(query) {
  const page = await (await browser.newContext(device)).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.goto(`${page0}&${query}`);
  await page.waitForFunction(() => window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady, null, {timeout: 15000});
  await page.waitForTimeout(800);
  return {page, errors};
}
async function shot(page, name, errors, check) {
  await page.screenshot({path: path.join(out, name + '.png')});
  const ok = await check();
  results.push({name, ok: Boolean(ok), errors: [...errors]});
  console.log(`${name}: ${ok ? 'ok' : 'FAIL'}${errors.length ? ' | errors: ' + errors.join(' | ') : ''}`);
}
const toast = (page) => page.evaluate(() => ({text: document.querySelector('#toast').textContent, reason: document.querySelector('#toast').dataset.reason || '', icon: Boolean(document.querySelector('#toast .toast-icon'))}));

{
  const {page, errors} = await open('quests=done&points=480');
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.openOwlMail());
  await page.waitForTimeout(400);
  await shot(page, '1-owl-quests-ready', errors, () => page.evaluate(() => document.querySelectorAll('[data-claim-owl-quest]').length === 3 && !document.querySelector('[data-letter-grand-chest]').disabled));
  await page.click('[data-claim-owl-quest]');
  await page.waitForTimeout(500);
  await shot(page, '2-owl-quest-claimed', errors, () => page.evaluate(() => document.querySelectorAll('.owl-quest-card.is-claimed').length === 1));
  for (const id of await page.$$eval('[data-claim-owl-quest]', (b) => b.map((n) => n.dataset.claimOwlQuest))) { await page.click(`[data-claim-owl-quest="${id}"]`); await page.waitForTimeout(300); }
  await page.click('[data-letter-grand-chest]');
  await page.waitForTimeout(500);
  await shot(page, '3-chest-opened', errors, () => page.evaluate(() => document.querySelector('[data-letter-grand-chest]').disabled && window.__HAGRID_GARDEN_QA__.getSnapshot().supplies.boost === 3));
  await page.click('#closeLetter');
  for (let i = 0; i < 4; i++) { await page.evaluate(() => window.__HAGRID_GARDEN_QA__.petCreature('puffskein')); await page.waitForTimeout(150); }
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.openEvents());
  await page.waitForTimeout(500);
  // 480 + 3 quests (45) + chest (20) + 2 pets (10+10, the free cap of 20) = 565.
  await shot(page, '4-festival-panel', errors, () => page.evaluate(() => /565 \/ 1000/.test(document.querySelector('.v24-event-progress h3')?.textContent || '') && document.querySelector('[data-free-kind=pet]')?.textContent === '3/3'));
  await page.click('[data-claim-milestone="hal_m1@2026"]');
  await page.waitForTimeout(500);
  await shot(page, '5-festival-milestone-claimed', errors, () => page.evaluate(() => document.querySelector('[data-claim-milestone="hal_m1@2026"]').disabled));
  await page.context().close();
}
{
  // Bonding and achievements: claims go to the server (claimBondGift, claimAchievement); cards re-render from the response.
  const {page, errors} = await open('simulate=1');
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.openPanel('affinity'));
  await page.waitForTimeout(400);
  await page.click('[data-claim-affinity-gift="puffskein:lv2"]');
  await page.waitForTimeout(600);
  await shot(page, '8-bond-gift-claimed', errors, async () => { const t = await toast(page); console.log('  toast:', JSON.stringify(t)); return /Cấp 2/.test(t.text) && await page.evaluate(() => Boolean(document.querySelector('[data-claim-affinity-gift="puffskein:lv3"]'))); });
  await page.click('[data-affinity-pet="puffskein"]');
  await page.waitForTimeout(600);
  await shot(page, '9-bond-pet', errors, async () => { const t = await toast(page); console.log('  toast:', JSON.stringify(t)); return /Cấp 4/.test(t.text); });
  // Turn the placed lantern in place: placeDecoration on its own slot with a new facing, stored by the server.
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.openPanel('collection'));
  await page.waitForTimeout(400);
  await page.getByRole('button', {name: 'Xoay sang ↗ Góc phải'}).first().click();
  await page.waitForTimeout(600);
  await shot(page, '11-decor-turned-in-place', errors, async () => { const s = await page.evaluate(() => window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations); console.log('  decorations:', JSON.stringify({placements: s.placements, rotations: s.rotations})); return s.placements[0] === 'decor_pumpkin_lantern' && s.rotations.decor_pumpkin_lantern === 'right'; });
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.openAchievements());
  await page.waitForTimeout(400);
  await page.click('[data-claim-achievement="ach_sprout_apprentice"]');
  await page.waitForTimeout(600);
  await shot(page, '10-achievement-claimed', errors, async () => { const t = await toast(page); console.log('  toast:', JSON.stringify(t)); return /Tập Sự Thảo Dược/.test(t.text) && await page.evaluate(() => !document.querySelector('[data-claim-achievement="ach_sprout_apprentice"]')); });
  await page.context().close();
}
for (const [name, query, reason] of [['6-build-missing-crops', 'scenario=missing&simulate=1&galleons=0', 'missing-crops'], ['7-build-missing-galleons', 'simulate=1&galleons=100', 'insufficient-galleons']]) {
  const {page, errors} = await open(query);
  await page.click('#buildTool');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__HAGRID_GARDEN_QA__.serverAct({action: 'build', expansionId: 'plot_12'}));
  await page.waitForTimeout(500);
  await shot(page, name, errors, async () => { const t = await toast(page); console.log('  toast:', JSON.stringify(t)); return t.reason === reason && t.icon; });
  await page.context().close();
}
await browser.close();
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(results, null, 2) + '\n');
const failed = results.filter((r) => !r.ok || r.errors.length);
console.log(`${results.length - failed.length}/${results.length} ok`);
process.exit(failed.length ? 1 : 0);
