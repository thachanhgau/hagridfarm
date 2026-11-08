// Placement/contact sheet only; no painting, palette reduction or game export.
// Run from repository root: node docs/codex-briefs/pond-art/place-pond-03.mjs
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const jobs = JSON.parse(await fs.readFile(new URL('pond-03-records.json', import.meta.url), 'utf8'));
const layers = [], checks = [];
let left = 24;
for (const job of jobs.filter(j => j.kept)) {
  const [width, height] = job.size;
  const placed = await sharp(job.generatedFile).resize(width, height, {fit:'fill', kernel:'nearest'}).png().toBuffer();
  await fs.writeFile(job.master, placed);
  const {data, info} = await sharp(placed).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width, width); assert.equal(info.height, height);
  let transparent = 0, opaque = 0, partial = 0;
  for (let p = 3; p < data.length; p += 4) {
    if (data[p] === 0) transparent++; else if (data[p] === 255) opaque++; else partial++;
  }
  assert(transparent > 0 && opaque > 0, 'Must have real alpha and visible artwork');
  checks.push({id:job.id, master:job.master, width, height, transparent, opaque, partial});
  layers.push({input:await sharp(placed).resize(width/job.scale, height/job.scale, {kernel:'nearest'}).png().toBuffer(), left, top:24 + 298 - height/job.scale});
  left += width/job.scale + 24;
}
assert.equal(layers.length, 3);
await sharp({create:{width:left, height:346, channels:4, background:'#5E7B3B'}}).composite(layers).png().toFile('docs/codex-briefs/pond-art-03-preview.png');
console.log(JSON.stringify(checks, null, 2));
