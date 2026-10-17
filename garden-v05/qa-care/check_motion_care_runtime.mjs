#!/usr/bin/env node
// Filesystem/runtime-contract check only. This loads the generated data files
// in a VM; it never opens a browser or executes the garden page.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || path.join(import.meta.dirname, '..'));
const context = {window: {}, console};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'level-assets.js'), 'utf8'), context, {filename: 'level-assets.js'});
vm.runInContext(fs.readFileSync(path.join(root, 'motion-care-data.js'), 'utf8'), context, {filename: 'motion-care-data.js'});
const expectedIds = ['mooncalf', 'kneazle', 'diricawl', 'fwooper', 'thestral', 'unicorn'];
const expected = {
  idle: [4, 5, 4],
  eat: [6, 6, 4, 6],
  care: [7, 4, 7, 4]
};
const durationsFinite = (clip) => Array.isArray(clip?.durations)
  && clip.durations.length === clip.frames.length
  && clip.durations.every((value) => Number.isFinite(value) && value > 0);
const report = expectedIds.map((id) => {
  const level = context.window.FARM_LEVEL_ASSETS?.items?.find((item) => item.id === id);
  const motion = context.window.FARM_MOTION?.items?.find((item) => item.id === id);
  const clips = Object.fromEntries(Object.keys(expected).map((name) => [name, {
    frames: level?.clips?.[name]?.frames,
    durations: level?.clips?.[name]?.durations,
    loop: level?.clips?.[name]?.loop,
    framesMatch: JSON.stringify(level?.clips?.[name]?.frames) === JSON.stringify(expected[name]),
    durationsFinite: durationsFinite(level?.clips?.[name])
  }]));
  return {
    id,
    levelFrames: level?.frames?.length,
    motionFrames: motion?.frames?.length,
    growthFrames: level?.clips?.growth?.frames,
    clips,
    pass: level?.frames?.length === 8
      && motion?.frames?.length === 8
      && JSON.stringify(level?.clips?.growth?.frames) === '[0,1,2,3]'
      && Object.values(clips).every((clip) => clip.framesMatch && clip.durationsFinite)
  };
});
const result = {
  status: report.every((entry) => entry.pass) && context.window.FARM_CARE_ASSETS?.items?.length === 6 ? 'PASS' : 'FAIL',
  scope: 'VM data contract only; no browser claim',
  careManifestItems: context.window.FARM_CARE_ASSETS?.items?.length,
  items: report
};
const output = path.join(root, 'qa-care', 'runtime-contract-check.json');
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
