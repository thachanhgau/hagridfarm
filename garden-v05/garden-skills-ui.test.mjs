// Season 2 skill UI (garden-skills-ui.mjs, garden-skills-card.mjs): targets, marks, receipt lines and passive diffs read the server views only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {skillOf, isReady, skillTargets, sceneMarks, passiveRuns} from './garden-skills-ui.mjs';
import {SKILL_ORDER, todoLines, skillText} from './garden-skills-card.mjs';
import {CREATURE} from './progression-engine.mjs';

const H = 3_600_000, now = 100 * H;
const crop = (plantedAt, growMs = H) => ({type: 'crop', species: 'pumpkin', plantedAt, growMs});
const skill = (species, more = {}) => ({species, name: species, passive: false, rank: 1, cap: 1, left: 1, blocked: null, ...more});
const snap = (more = {}) => ({
  garden: {progression: {offsetMs: 0, level: 140, plots: [{slots: [crop(now - 2 * H)]}, {slots: [crop(now - 10 * 60_000)]}, {slots: [null, null]}],
    creatures: [{species: 'puffskein'}, {species: 'kneazle', meal: {readyAt: now - 1}}, {species: 'grindylow'}]}},
  duty: {on: true, since: 0, dead: [{plot: 1, slot: 0}], gnomes: [{plot: 2}], sick: [{species: 'puffskein'}], fled: [{species: 'thestral'}], clocks: {sick: {species: 'kneazle', at: now + H}}},
  soil: [null, {tired: 0.75}, {tired: 1}],
  skills: {dayKey: '2026-11-13', creatures: [skill('puffskein'), skill('kneazle', {passive: true, cap: 0, left: 0, rank: 2}), skill('hippogriff', {left: 0, cap: 2})]},
  ...more,
});

test('the atlas holds every species once, in the brief order', () => {
  assert.equal(SKILL_ORDER.length, 18);
  assert.equal(new Set(SKILL_ORDER).size, 18);
  for (const sp of SKILL_ORDER) assert.ok(CREATURE[sp], sp);
});

test('targets follow the server checks: ripe, growing, empty, dead or ma lùm, tired, sick', () => {
  const s = snap();
  assert.deepEqual(skillTargets('puffskein', s, now), [0]);
  assert.deepEqual(skillTargets('bowtruckle', s, now), [1]);
  assert.deepEqual(skillTargets('niffler', s, now), [2]);
  assert.deepEqual(skillTargets('dragon', s, now), [1, 2]);
  assert.deepEqual(skillTargets('knarl', s, now), [1]);
  assert.deepEqual(skillTargets('unicorn', s, now), ['puffskein']);
  assert.deepEqual(skillTargets('unicorn', snap({duty: {on: false}}), now), ['puffskein', 'kneazle']); // pond ones live apart
  assert.equal(skillTargets('hippogriff', s, now), null);
});

test('a fled creature shows as blocked; ready needs an active skill with a charge', () => {
  const s = snap();
  assert.equal(skillOf(s, 'thestral').blocked, 'fled');
  assert.equal(isReady(skillOf(s, 'puffskein')), true);
  assert.equal(isReady(skillOf(s, 'hippogriff')), false);
  assert.equal(isReady(skillOf(s, 'kneazle')), false);
});

test('marks: a star on a ready skill with a target, Kneazle meal-done and sick-soon, wilting plots', () => {
  const s = snap(), wilting = snap();
  wilting.garden.progression.plots[0].slots[0] = crop(now - 23 * H); // ripe 22 h ago: wilts in 2 h
  const m = sceneMarks(wilting, now);
  assert.deepEqual(m.pens.get('puffskein'), ['star']);
  assert.deepEqual(m.pens.get('kneazle'), ['feed', 'heart_empty']);
  assert.deepEqual([...m.plots.keys()], [0]);
  assert.equal(sceneMarks(s, now).plots.size, 0);
  assert.deepEqual(todoLines(wilting, now), ['Thửa 1 sắp héo', `${CREATURE.kneazle.label} xong bữa`, `${CREATURE.kneazle.label} sắp ốm`]);
  const sleepy = snap({skills: {...s.skills, creatures: s.skills.creatures.map(c => c.species === 'kneazle' ? {...c, blocked: 'sad'} : c)}});
  assert.equal(sceneMarks(sleepy, now).pens.get('kneazle'), undefined);
});

test('receipt and passive lines', () => {
  assert.match(skillText({species: 'hippogriff', water: 10, left: 1}), /\+10 Nước · còn 1 lượt hôm nay\.$/);
  assert.match(skillText({species: 'mooncalf', plotIndex: 2, crops: 3, cutMs: 1_800_000, left: 0}), /thửa 3: 3 cây chín sớm 30 phút/);
  assert.match(skillText({species: 'dragon', plotIndex: 0, gnome: true, left: 1}), /ma lùm chạy mất/);
  const day = creatures => ({skills: {dayKey: 'd', creatures}});
  const before = day([skill('crup', {passive: true, left: 3}), skill('kappa', {passive: true})]);
  assert.deepEqual(passiveRuns(before, day([skill('crup', {passive: true, left: 2}), skill('kappa', {passive: true})])).map(r => r[0]), ['crup']);
  assert.deepEqual(passiveRuns({skills: {...before.skills, dayKey: 'old'}}, day([skill('crup', {passive: true, left: 0})])), []);
});
