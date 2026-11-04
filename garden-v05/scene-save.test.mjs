// Bug 04/11/2026: «Khung cảnh» lived only on the device (the shell's localStorage), so a reload or another
// device lost it, and a visit drew the visitor's own weather. Now it is kept with the garden (server setScene)
// and a visit draws the host's.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createFixtureServer} from '../qa-v19/fixture-wallet.mjs';
import {createGardenClient} from './garden-emulator-client.mjs';
import {buildVisitSnapshot, visitBannerParts} from './garden-visits-ui.mjs';

const SNOW_NIGHT = {weather: 'snow', atmosphere: 'night', event: 'event_yule'};

test('the scene is saved with the garden, without a revision, and a fresh client reads it back', async () => {
  const server = createFixtureServer({simulate: true});
  const client = createGardenClient(async (name, data) => server.handle(name, data));
  const revision = (await client.read()).garden.progression.revision;
  const saved = await client.scene({weather: 'rain', atmosphere: 'dusk', event: 'event_halloween'});
  assert.deepEqual(saved.garden.decorations.scene, {weather: 'rain', atmosphere: 'dusk', event: 'event_halloween'});
  assert.equal(saved.garden.progression.revision, revision);
  const reload = createGardenClient(async (name, data) => server.handle(name, data));
  assert.equal((await reload.read()).garden.decorations.scene.weather, 'rain');
  await assert.rejects(client.scene({...SNOW_NIGHT, weather: 'fog'}), e => e.reason === 'invalid-action-input');
});

test('a visit draws the host scene, never the visitor one', async () => {
  const server = createFixtureServer({simulate: true});
  const client = createGardenClient(async (name, data) => server.handle(name, data));
  await client.read();
  await client.scene({weather: 'rain', atmosphere: 'day', event: 'event_halloween'});
  const host = buildVisitSnapshot((await client.visit({hostUid: 'm1'})).visit);
  assert.deepEqual([host.weatherMode, host.atmosphereMode, host.eventMode], ['snow', 'night', 'event_yule']);
  const unset = buildVisitSnapshot((await client.visit({hostUid: 'm2'})).visit);
  assert.deepEqual([unset.weatherMode, unset.atmosphereMode, unset.eventMode], ['clear', 'day', null]);
});

test('the visit banner has no empty parts (they printed as «nullnull»)', () => {
  globalThis.document ??= {createElement: () => ({append() {}, setAttribute() {}, addEventListener() {}, classList: {add() {}}, style: {}, dataset: {}}), createElementNS: () => ({append() {}, setAttribute() {}, setAttributeNS() {}, style: {}, dataset: {}}), createTextNode: () => ({})};
  const parts = visitBannerParts({tour: {uid: 'h', ownerName: 'Hermione', level: 30}, visit: {helped: false, hostHelpsLeft: 3}, helpsLeft: 3, onHelp() {}, onHome() {}});
  assert.ok(parts.every(Boolean));
});

test('the game adopts the server scene once, pushes changes, and draws a visit with the host event', () => {
  const src = fs.readFileSync(new URL('./mobile-game.mjs', import.meta.url), 'utf8');
  assert.match(src, /const first=!walletReady;walletReady=true;if\(first\)adoptServerScene\(\);/);
  assert.match(src, /function persistPrefs\(\)\{[^\n]*pushScene\(\);\}/);
  assert.doesNotMatch(src, /buildVisitSnapshot\(res\.visit,/);
  assert.match(src, /eventMode:activeTourSnapshot\?\.eventMode\|\|eventMode/);
});
