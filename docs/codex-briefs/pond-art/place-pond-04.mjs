// Placement and review only; no painting, palette reduction or runtime export.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const jobs = JSON.parse(await fs.readFile(new URL('pond-04-records.json', import.meta.url), 'utf8'));
const finalPath = 'garden-v05/environment/pond/masters/pond-3.png';
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const finalHash = hash(await fs.readFile(finalPath));
assert.equal(finalHash, 'b61e127c20d76ef51cbd6bf9503a8ba31c2869102310f4d28a28094906634654');
for (const job of jobs) {
  await sharp(job.generatedFile).resize(1440, 894, {fit:'fill', kernel:'nearest'}).png().toFile(job.master);
}
const layers = [], checks = [];
for (let i = 1; i <= 3; i++) {
  const master = `garden-v05/environment/pond/masters/pond-${i}.png`;
  const bytes = await fs.readFile(master);
  const {data, info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width, 1440); assert.equal(info.height, 894);
  let transparent = 0, opaque = 0, partial = 0;
  const colours = new Set();
  for (let p = 0; p < data.length; p += 4) {
    const a = data[p+3];
    if (a === 0) transparent++; else {
      if (a === 255) opaque++; else partial++;
      colours.add(`${data[p]},${data[p+1]},${data[p+2]}`);
    }
  }
  assert(transparent > 0 && opaque + partial > 0, 'Real alpha and visible artwork required');
  checks.push({master, width:info.width, height:info.height, transparent, opaque, partial, visibleRGB:colours.size, sha256:hash(bytes)});
  layers.push({input:await sharp(bytes).resize(480, 298, {kernel:'nearest'}).png().toBuffer(), left:24+(i-1)*504, top:24});
}
await sharp({create:{width:1536,height:346,channels:4,background:'#5E7B3B'}}).composite(layers).png().toFile('docs/codex-briefs/pond-art-04-preview.png');
assert.equal(hash(await fs.readFile(finalPath)), finalHash);
await fs.writeFile(new URL('pond-04-checks.json', import.meta.url), JSON.stringify(checks, null, 2)+'\n');
console.log(JSON.stringify(checks, null, 2));
