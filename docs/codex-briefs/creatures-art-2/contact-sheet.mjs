// Usage (repo root): node docs/codex-briefs/creatures-art-2/contact-sheet.mjs garden-v05 docs/codex-briefs/creatures-art-02-preview.png
// Contact sheet: per species 2 rows (left, right) × 20 frames at 2×, plus habitats/keepsakes/icons at 3×, on a grass tint.
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const [,,g,out]=process.argv,S=2,F=96*S,comps=[];let y=8;
const clips=['growth','idle','action','eat','care'];
const up=async(f,k)=>{const m=await sharp(g+'/'+f).metadata();return {buf:await sharp(g+'/'+f).resize(m.width*k,m.height*k,{kernel:'nearest'}).png().toBuffer(),w:m.width*k,h:m.height*k};};
for(const s of ['grindylow','crup','knarl','salamander'])for(const v of ['left','right']){let x=8;
 for(const c of clips)for(let i=1;i<=4;i++){const r=await up(`creature-motion-assets/native/${s}/${v}-${c}-0${i}.png`,S);comps.push({input:r.buf,left:x,top:y});x+=F+(i===4?12:0);}y+=F;}
y+=12;let x=8;
for(const s of ['crup','knarl','salamander'])for(const k of ['habitat','keepsake']){const r=await up(`native-complete-objects/${k}_${s}/frame-01.png`,3);comps.push({input:r.buf,left:x,top:y});x+=r.w+16;}
x+=16;for(const id of ['produce_crup','produce_knarl','produce_salamander','crup_feed','knarl_feed','salamander_feed']){const r=await up(`native-items/${id}.png`,3);comps.push({input:r.buf,left:x,top:y});x+=r.w+8;}
await sharp({create:{width:Math.max(8+20*F+60,x+8),height:y+200,channels:4,background:'#9fb877'}}).composite(comps).png().toFile(out);
