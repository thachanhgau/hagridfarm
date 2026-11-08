// Placement and preview only. Run from repository root; no native sprite export.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const sharp = createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const [job] = JSON.parse(await fs.readFile(new URL('pond-05-records.json', import.meta.url), 'utf8'));
const pondPath = 'garden-v05/environment/pond/masters/pond-3.png';
const pond = await fs.readFile(pondPath);
const hash = b => createHash('sha256').update(b).digest('hex');
// Remove only transparent bottom margin, then fit the ground: lateral corners
// around (4,792)/(764,792), front tip (384,984), implied rear (384,600).
const art = await sharp(job.generatedFile).extract(job.placement.extract)
  .resize(...job.placement.resize, {fit:'fill', kernel:'nearest'}).png().toBuffer();
await sharp({create:{width:768,height:992,channels:4,background:'#00000000'}})
  .composite([{input:art,left:0,top:141}]).png().toFile(job.master);
const bytes = await fs.readFile(job.master);
const {data,info} = await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,768); assert.equal(info.height,992);
let transparent=0, opaque=0, partial=0;
const colours=new Set();
for(let p=0;p<data.length;p+=4) {
  if(data[p+3]===0) transparent++;
  else { if(data[p+3]===255) opaque++; else partial++; colours.add(`${data[p]},${data[p+1]},${data[p+2]}`); }
}
assert(transparent>0 && opaque>0,'Real alpha and visible artwork required');
const nookPreview = await sharp(bytes).resize(192,248,{kernel:'nearest'}).png().toBuffer();
const pondPreview = await sharp(pond).resize(480,298,{kernel:'nearest'}).png().toBuffer();
await sharp({create:{width:744,height:346,channels:4,background:'#5E7B3B'}})
  .composite([{input:nookPreview,left:24,top:74},{input:pondPreview,left:240,top:24}])
  .png().toFile('docs/codex-briefs/pond-art-05-preview.png');
assert.equal(hash(await fs.readFile(pondPath)),hash(pond),'Pond reference must remain unchanged');
const check={master:job.master,width:info.width,height:info.height,transparent,opaque,partial,visibleRGB:colours.size,sha256:hash(bytes),pond3sha256:hash(pond),preview:[744,346]};
await fs.writeFile(new URL('pond-05-checks.json',import.meta.url),JSON.stringify(check,null,2)+'\n');
console.log(JSON.stringify(check,null,2));
