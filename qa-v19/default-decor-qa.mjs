// Strict intercepted fixture in an opaque iframe; no real account, wallet or services.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const game = path.resolve(process.argv[2] || path.join(sourceRoot, 'garden-v05'));
const output = path.resolve(process.argv[3] || path.join(sourceRoot, 'qa-v19/default-decor-qa.json'));
const require = createRequire(import.meta.url);
const deps = '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium, webkit} = require(deps + 'playwright'), sharp = require(deps + 'sharp');
const origin = 'http://127.0.0.1:3026', reports = [];
const variants = [{width:1280,height:800}, {width:375,height:812}, {width:812,height:375}];
for (const [browserName, type] of [['Chrome', chromium], ['WebKit', webkit]]) {
  const browser = await type.launch(browserName === 'Chrome' ? {channel:'chrome',headless:true} : {headless:true});
  try {
    for (const viewport of variants) {
      const phone = viewport.width !== 1280;
      const context = await browser.newContext({viewport, hasTouch:phone, isMobile:phone, deviceScaleFactor:1});
      const errors = [], external = [];
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (['data:', 'blob:'].includes(url.protocol)) return route.continue();
        if (url.origin !== origin) {external.push(url.href); return route.abort();}
        try {
          let body, contentType;
          if (url.pathname === '/host') {
            body = '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><iframe title="Garden fixture" sandbox="allow-scripts" style="display:block;border:0;width:100vw;height:100vh" src="/qa-v19/ui-fixture.html?wallet=emulator&amp;qa=1&amp;level=100&amp;scenario=removable-decor&amp;simulate=1&amp;view=overview"></iframe></body></html>';
            contentType = 'text/html';
          } else if (url.pathname === '/qa-v19/ui-fixture.html') {
            body = (await fs.readFile(path.join(game,'index.html'),'utf8')).replace('<html lang="vi">','<html lang="vi" data-wallet="fixture">').replace('<head>','<head><base href="/garden-v05/">');
            contentType = 'text/html';
          } else {
            const pathname = decodeURIComponent(url.pathname);
            const file = pathname.startsWith('/garden-v05/') ? path.resolve(game,pathname.slice(12)) : path.resolve(sourceRoot,pathname.slice(1));
            if (!file.startsWith(game + path.sep) && !file.startsWith(path.join(sourceRoot,'qa-v19') + path.sep)) throw Error('Unsafe fixture path');
            body = await fs.readFile(file);
            contentType = {'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)];
          }
          await route.fulfill({body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
        } catch (error) {errors.push(url.pathname + ': ' + error.message); await route.fulfill({status:404,body:'missing'});}
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/host');
      const frame = page.frames().find(f => f !== page.mainFrame());
      await frame.waitForFunction(() => window.__HAGRID_GARDEN_QA__?.getSnapshot().loaded && window.__HAGRID_GARDEN_QA__?.getSnapshot().walletReady);
      assert.equal(await frame.evaluate(() => window.origin), 'null');
      const snapshot = () => frame.evaluate(() => window.__HAGRID_GARDEN_QA__.getSnapshot());
      const before = await snapshot();
      const press = locator => phone ? locator.tap() : locator.click();
      const toggle = async (id, hidden) => {
        const control = frame.locator(`[data-default-decor-toggle="${id}"]`);
        await press(control);
        await frame.waitForFunction(({id,hidden}) => (window.__HAGRID_GARDEN_QA__.getSnapshot().state.decorations.hiddenDefaults ?? []).includes(id) === hidden, {id,hidden});
        assert.equal(await control.innerText(), hidden ? 'Đặt lại' : 'Cất');
        assert.equal(await control.getAttribute('aria-pressed'), String(!hidden));
        assert.equal(await control.evaluate(e => document.activeElement === e), true, 'focus returns to the same toggle');
      };
      const worldHas = id => frame.evaluate(id => window.__HAGRID_GARDEN_QA__.getWorldSnapshot().order.some(o => o.id === id), id);
      await frame.evaluate(() => window.__HAGRID_GARDEN_QA__.openPanel('collection'));
      for (const [id,worldId] of [['decoration-7','decoration-7'], ['scene:pond','pond'], ['keepsake:puffskein','keepsake:puffskein']]) {
        assert.equal(await worldHas(worldId), true);
        await toggle(id, true);
        assert.equal(await worldHas(worldId), false, id + ' no longer painted or picked');
        await toggle(id, false);
        assert.equal(await worldHas(worldId), true, id + ' can return without buying it again');
      }
      await toggle('scene:pond', true);
      await press(frame.locator('#closePanel'));
      const replacementProblem = await frame.evaluate(async () => {
        const {decorSpotProblem} = await import('/garden-v05/decor-placement-ui.mjs');
        const {iso} = await import('/garden-v05/scene-renderer.mjs');
        const qa = window.__HAGRID_GARDEN_QA__, snap = qa.getSnapshot();
        const manifest = window.FARM_DECOR_MANIFEST ?? await fetch('/garden-v05/decor-assets-manifest.json').then(r=>r.json());
        const assetOf = id => manifest.items.find(a=>a.id===id);
        return decorSpotProblem(13,22,{map:window.FARM_SCENE,stage:qa.getWorldSnapshot().stage,state:{...snap.state,decorations:['decoration-7']},decorations:snap.state.decorations,itemId:'decor_pumpkin_lantern',asset:assetOf('decor_pumpkin_lantern'),assetOf,iso});
      });
      assert.equal(replacementProblem, '', 'bought lantern fits the freed pond ground');
      await frame.evaluate(() => window.__HAGRID_GARDEN_QA__.serverAct({action:'placeDecoration',itemId:'decor_pumpkin_lantern',at:[13,22],facing:'default'}));
      assert.deepEqual((await snapshot()).state.decorations.positions.decor_pumpkin_lantern,[13,22]);
      await frame.evaluate(() => window.__HAGRID_GARDEN_QA__.openPanel('collection'));
      await press(frame.locator('[data-default-decor-toggle="scene:pond"]'));
      await frame.waitForFunction(() => document.querySelector('.toast')?.textContent.includes('Vị trí cũ đang có món đã mua'));
      assert.ok((await snapshot()).state.decorations.hiddenDefaults.includes('scene:pond'), 'blocked restore does not overwrite the replacement');
      if (browserName === 'Chrome' && viewport.width === 375) await sharp(await page.screenshot()).resize({width:188}).png().toFile(output.replace(/\.json$/,'-phone.png'));
      await press(frame.locator('#closePanel'));
      await frame.evaluate(() => window.__HAGRID_GARDEN_QA__.openDecorPlacement('decor_pumpkin_lantern'));
      await press(frame.locator('.decor-bar-stash'));
      await frame.locator('.decor-bar').waitFor({state:'detached'});
      await frame.evaluate(() => window.__HAGRID_GARDEN_QA__.openPanel('collection'));
      await toggle('scene:pond', false);
      const after = await snapshot();
      assert.deepEqual(after.state.inventory,before.state.inventory);
      assert.deepEqual(after.state.keepsakes,before.state.keepsakes);
      assert.deepEqual(after.state.decorations.owned,before.state.decorations.owned);
      assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
      assert.deepEqual(errors,[]); assert.deepEqual(external,[]);
      reports.push({browser:browserName,viewport,touch:phone,opaque:true,hiddenAndRestored:['decoration-7','scene:pond','keepsake:puffskein'],paintAndPickRemoved:true,replacementAt:[13,22],restoreBlockedWhileOccupied:true,restoreAfterStashing:true,inventoryAndOwnershipUnchanged:true,network:'all intercepted, in-memory wallet fixture',errors});
      await context.close();
    }
  } finally {await browser.close();}
}
await fs.writeFile(output,JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports,null,2));
