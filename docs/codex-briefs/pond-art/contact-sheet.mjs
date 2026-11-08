// Contact sheet of the pond natives at 3× nearest-neighbour on #D6D8BF (rows: pond tiers + bed, items + habitat +
// keepsake + 16×16 icons, grindylow left frames, grindylow right frames). Usage (repo root):
// node docs/codex-briefs/pond-art/contact-sheet.mjs
import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const g='garden-v05/',S=3,GAP=12;
const {POND_SCENERY,POND_ART}=await import('../../../'+g+'pond-art.mjs');
const {ICONS}=await import('../../../'+g+'pixel-icons.mjs'),INK=Object.fromEntries([...(await fs.readFile(g+'pixel-icons.mjs','utf8')).match(/const INK = Object\.freeze\(\{([\s\S]*?)\}\);/)[1].matchAll(/(\w): '(#\w{6})'/g)].map(m=>[m[1],m[2]]));
const pond=JSON.parse(await fs.readFile(g+'creature-motion-assets/pond-creatures.json','utf8')).items[0];
const icon16=async grid=>{const buf=Buffer.alloc(16*16*4);grid.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;const h=INK[ch];buf.set([1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).concat(255),(y*16+x)*4);}));return sharp(buf,{raw:{width:16,height:16,channels:4}}).png().toBuffer();};
const rows=[
 Object.values(POND_SCENERY).map(s=>g+s.file),
 [...Object.values(POND_ART).map(s=>g+s.file),g+'native-complete-objects/habitat_grindylow/frame-01.png',g+'native-complete-objects/keepsake_grindylow/frame-01.png'],
 pond.frames.left.map(f=>g+'creature-motion-assets/'+f.file),
 pond.frames.right.map(f=>g+'creature-motion-assets/'+f.file),
];
rows[1].push(...await Promise.all(['pond','net','rod','algae'].filter(id=>ICONS[id]).map(id=>icon16(ICONS[id]))));
const layers=[];let y=GAP,width=0;
for(const row of rows){let x=GAP,h=0;for(const input of row){const m=await sharp(input).metadata(),w=m.width*S;layers.push({input:await sharp(input).resize(w,m.height*S,{kernel:'nearest'}).png().toBuffer(),left:x,top:y});x+=w+GAP;h=Math.max(h,m.height*S);if(x>1800){width=Math.max(width,x);x=GAP;y+=h+GAP;h=0;}}width=Math.max(width,x);y+=h+GAP;}
await sharp({create:{width,height:y,channels:4,background:'#D6D8BF'}}).composite(layers).png().toFile('docs/codex-briefs/pond-art-01-preview.png');
console.log('docs/codex-briefs/pond-art-01-preview.png',width+'×'+y);
