// Pond phase-1 art (plan §6): reduce the Codex masters to native PNGs and write pond-art.mjs.
// Nearest-neighbour + the 24-colour snap of build-scene.mjs, binary alpha (192). Masters stay untouched.
// Usage: node build-pond-art.mjs
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {SPRITE_PALETTE} from './palette.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.dirname(fileURLToPath(import.meta.url));

// Ground = footprint [long, short] in the default (left) view: cols = short, rows = long, leaning like every store
// decoration. groundCentre = centre of that parallelogram in the image; pivot = decoration foot = groundCentre +
// (0, 32·footLift), so decorFootprintRect(foot col,row, footprint) lies exactly under the art. The right view is the
// exact horizontal mirror (same canvas, pivotX unchanged).
const footLift=(a,b)=>Math.ceil((a+b)/2-1)/2;
function spec(id,long,short,headroom,masterScale){
 const a=short,b=long,width=(a+b)*32,H=(a+b)*16,height=headroom+H+2,groundCentre={x:width/2,y:height-2-H/2},lift=footLift(a,b);
 return {id,file:`environment/pond/${id}.png`,master:`environment/pond/masters/${id}.png`,footprint:[long,short],width,height,pivotX:groundCentre.x,pivotY:groundCentre.y+32*lift,groundCentre,footLift:lift,masterScale};
}
// 08/11 owner: ponds bigger than a 3×3 plot, on their own shore land (Bờ hồ, cols 33.5–45.5 × rows 25.5–36.5).
export const POND_SPECS=[spec('pond-1',5,4,40,4),spec('pond-2',7,5,48,3),spec('pond-3',9,6,56,3),spec('pond-bed',3,1,22,8)];
// Master sheets, row-major cells. Supply-size icons: ink ≤ 40×40 in 64×64, base on row 56 (art bible §8, V24.9.73).
export const POND_ITEMS=['fry_carp','fry_goldfish','goldfish','produce_grindylow'];
// Phase 2 (plan §9): produce and feed of crup, knarl, salamander, on a 3×2 sheet (v2: produce_crup, salamander_feed redrawn, creatures-art-02b).
export const CREATURE_2_ITEMS=['produce_crup','produce_knarl','produce_salamander','crup_feed','knarl_feed','salamander_feed'];
const ITEM_SHEETS=[{file:'masters-items/pond/items-sheet.png',cols:2,rows:2,ids:POND_ITEMS},{file:'masters-items/creatures-2/items-sheet-v2.png',cols:3,rows:2,ids:CREATURE_2_ITEMS}],ICON={size:64,base:56,max:40};export const ICON_BOX=ICON;

const palette=SPRITE_PALETTE.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),cache=new Map();
function snap(r,g,b){const key=(r<<16)|(g<<8)|b;if(!cache.has(key)){let d=Infinity,c;for(const p of palette){const n=2*(r-p[0])**2+3*(g-p[1])**2+(b-p[2])**2;if(n<d){d=n;c=p;}}cache.set(key,c);}return cache.get(key);}
export function inkBox(data,w,h){let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<0)throw Error('empty master');return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};}
export const quantize=buf=>{for(let i=0;i<buf.length;i+=4){if(buf[i+3]<192){buf.fill(0,i,i+4);continue;}buf.set(snap(buf[i],buf[i+1],buf[i+2]),i);buf[i+3]=255;}return buf;};
// Nearest-resize the ink of `raw` to w×h and drop it on a transparent W×H canvas at (left, top).
export async function place(raw,box,w,h,W,H,left,top){
 const ink=quantize(await sharp(raw.data,{raw:raw.info}).extract({left:box.x,top:box.y,width:box.w,height:box.h}).resize(w,h,{kernel:'nearest',fit:'fill'}).raw().toBuffer());
 const out=Buffer.alloc(W*H*4);for(let y=0;y<h;y++)ink.copy(out,((top+y)*W+left)*4,y*w*4,(y+1)*w*4);return out;
}
export async function write(file,data,W,H){
 const b=inkBox(data,W,H);if(b.x<1||b.y<1||b.x+b.w>W-1||b.y+b.h>H-1)throw Error(file+': ink touches the canvas edge');
 await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await sharp(data,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,file));return b;
}
export const load=async file=>sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});

async function main(){
 const scenery={},items={};
 for(const s of POND_SPECS){
  const raw=await load(s.master),box=inkBox(raw.data,raw.info.width,raw.info.height),k=s.masterScale;
  // A master drawn on its guide canvas keeps the guide's geometry: plain ÷k. Otherwise fit the ink to the ground width.
  const exact=raw.info.width===s.width*k&&raw.info.height===s.height*k;
  const w=exact?Math.round(box.w/k):s.width-2,h=Math.round(box.h*w/box.w);
  const left=exact?Math.round(box.x/k):1,top=exact?Math.round(box.y/k):s.height-2-h;
  if(left+w>s.width-1||top<1||top+h>s.height-1)throw Error(`${s.id}: ${w}×${h} ink does not fit ${s.width}×${s.height}`);
  const bounds=await write(s.file,await place(raw,box,w,h,s.width,s.height,left,top),s.width,s.height);
  const {id,master,masterScale,...runtime}=s;scenery[id]={...runtime,bounds};
 }
 for(const {file:sheetFile,cols,rows,ids}of ITEM_SHEETS){const sheet=await load(sheetFile),cw=sheet.info.width/cols,ch=sheet.info.height/rows;
 for(const [i,id]of ids.entries()){
  const cell={info:{width:Math.round(cw),height:Math.round(ch),channels:4}};cell.data=await sharp(sheet.data,{raw:sheet.info}).extract({left:Math.round(i%cols*cw),top:Math.round(Math.floor(i/cols)*ch),width:cell.info.width,height:cell.info.height}).raw().toBuffer();
  const box=inkBox(cell.data,cell.info.width,cell.info.height),scale=Math.min(ICON.max/box.w,ICON.max/box.h),w=Math.round(box.w*scale),h=Math.round(box.h*scale);
  const file=`native-items/${id}.png`,bounds=await write(file,await place(cell,box,w,h,ICON.size,ICON.size,Math.floor((ICON.size-w)/2),ICON.base-h),ICON.size,ICON.size);
  items[id]={file,width:ICON.size,height:ICON.size,pivotX:ICON.size/2,pivotY:ICON.base,bounds};
 }}
 const rows=entries=>Object.entries(entries).map(([id,v])=>` ${JSON.stringify(id)}: ${JSON.stringify(v)},`).join('\n');
 await fs.writeFile(path.join(root,'pond-art.mjs'),`// Generated by build-pond-art.mjs (pond phase 1, plan §6). Masters: environment/pond/masters/, ${ITEM_SHEETS.map(s=>s.file).join(', ')}.
// POND_ART: item icons (pond §6 + phase-2 creatures §9), same shape as ITEM_ART / UI_AUDIT_ART (flow-item-ui.mjs falls back to it).
export const POND_ART = Object.freeze({\n${rows(items)}\n});
// POND_SCENERY: pond tiers and the shore bed. footprint [long, short] runs its long side along the rows (default view),
// pivot = decoration foot (decorFootprintRect), groundCentre = the footprint's centre in the image. Mirror for the right view.
export const POND_SCENERY = Object.freeze({\n${rows(scenery)}\n});\n`);
 console.log(JSON.stringify({scenery:Object.fromEntries(Object.entries(scenery).map(([k,v])=>[k,[v.width,v.height,v.pivotX,v.pivotY,v.bounds]])),items:Object.fromEntries(Object.entries(items).map(([k,v])=>[k,v.bounds]))}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.stack);process.exitCode=1;});
