// Pack authored catalog additions and the fence-free pasture, preserving native anchors.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {authoredCells} from './authored-atlas.mjs';
import {quantize} from './build-pond-art.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=new URL('./',import.meta.url),manifest=new URL('masters-items/catalog-completion-20261108/provenance.json',root),p=JSON.parse(await fs.readFile(manifest,'utf8'));
const ids={ 'food-sheet':['recipe_grindylow_feed','recipe_grindylow_flux','recipe_crup_knotgrass','recipe_knarl_sunflower','recipe_salamander_knotgrass','recipe_kappa_fish','recipe_porlock_apple','grindylow_feed'],'build-sheet':['edge_1','edge_2','edge_3','pen_ext_1','pen_ext_2','pen_ext_3']},art={};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const asset of p.assets){
 const bytes=await fs.readFile(new URL(asset.master,root));if(asset.sha256&&hash(bytes)!==asset.sha256)throw Error('Changed master '+asset.id);asset.sha256=hash(bytes);
 const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const floor=asset.id==='pasture-floor',poses=authoredCells(raw,floor?[1]:asset.id==='food-sheet'?[4,4]:[3,3]);asset.outputs=[];
 for(const [i,pose]of poses.entries()){
  const W=floor?288:64,H=floor?157:64,scale=Math.min((floor?286:52)/pose.width,(floor?143:48)/pose.height),w=floor?286:Math.round(pose.width*scale),h=floor?143:Math.round(pose.height*scale),x=Math.floor((W-w)/2),y=floor?13:56-h;
  const ink=quantize(await sharp(pose.data,{raw:{width:pose.width,height:pose.height,channels:4}}).resize(w,h,{kernel:'nearest',fit:'fill'}).raw().toBuffer());
  const out=Buffer.alloc(W*H*4);for(let row=0;row<h;row++)ink.copy(out,((y+row)*W+x)*4,row*w*4,(row+1)*w*4);
  const id=floor?'pasture':ids[asset.id][i],file=floor?'environment/edge/pasture.png':`native-items/${id}.png`;
  const png=await sharp(out,{raw:{width:W,height:H,channels:4}}).resize(floor?576:64,floor?314:64,{kernel:'nearest'}).png().toBuffer();await fs.writeFile(new URL(file,root),png);
  let bx=W,by=H,br=0,bb=0;for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(out[(yy*W+xx)*4+3]){bx=Math.min(bx,xx);by=Math.min(by,yy);br=Math.max(br,xx);bb=Math.max(bb,yy);}
  const bounds={x:bx*(floor?2:1),y:by*(floor?2:1),w:(br-bx+1)*(floor?2:1),h:(bb-by+1)*(floor?2:1)};
  asset.outputs.push({id,file,sha256:hash(png),bounds});
  if(!floor)art[id]={file,width:64,height:64,pivotX:32,pivotY:56,bounds};
  else {const u=new URL('edge-art.mjs',root),s=await fs.readFile(u,'utf8');await fs.writeFile(u,s.replace(/( "pasture": )(\{[^\n]+\})(,)/,(_,a,b,c)=>a+JSON.stringify({...JSON.parse(b),bounds})+c));}
 }
}
await fs.writeFile(new URL('catalog-art.mjs',root),'// Authored catalog additions; rebuild with build-catalog-completion.mjs.\nexport const CATALOG_ART=Object.freeze('+JSON.stringify(art,null,2)+');\n');
await fs.writeFile(manifest,JSON.stringify(p,null,2)+'\n');
