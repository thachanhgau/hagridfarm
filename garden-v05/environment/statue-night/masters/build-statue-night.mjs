// ImageGen master reduction only. No procedural statue art. Run from repository root.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {PALETTE} from '../../../palette.mjs';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir='garden-v05/environment/statue-night/', W=128,H=176;
const rgb=PALETTE.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const lum=c=>c[0]*.3+c[1]*.59+c[2]*.11;
function nearest(c){let best=0,d=Infinity;rgb.forEach((p,i)=>{const m=(c[0]+p[0])/2,v=(2+m/256)*(c[0]-p[0])**2+4*(c[1]-p[1])**2+(2+(255-m)/256)*(c[2]-p[2])**2;if(v<d){d=v;best=i;}});return best;}
function box(a){const xs=[],ys=[];for(let i=0;i<W*H;i++)if(a[i*4+3]){xs.push(i%W);ys.push(Math.floor(i/W));}return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
const rows=[],comps=[];
const previewW=2540,previewH=2*800;
const text=[];
// Approved dark Dobby is deliberately never opened for writing.
for(const [s,id] of [[1,'ev_dobby_spring_rider']]){
 const {data:master}=await sharp(dir+'masters/'+id+'.png').resize(1536,1408,{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let facing=0;facing<2;facing++){
  const suffix=facing?'_right':'',originalFile=`garden-v05/event-assets/native/${id}${suffix}${s===0?'_f0':''}.png`;
  const original=await sharp(originalFile).ensureAlpha().raw().toBuffer();
  // Exact 4x4 area averages of the normalized master, with flat-background keying before averaging.
  const raw=new Float32Array(W*H*3),valid=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   let n=0,r=0,g=0,b=0;
   for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
    const k=(((facing*704+y*4+dy)*1536)+x*4+dx)*4;
    const rr=master[k],gg=master[k+1],bb=master[k+2];
    if(rr<24&&gg<32&&bb<40)continue;
    n++;r+=rr;g+=gg;b+=bb;
   }
   const i=y*W+x;if(n){raw.set([r/n,g/n,b/n],i*3);valid[i]=n>=8?1:0;}
  }
  const bodyAlpha=Buffer.alloc(W*H*4),alpha=new Uint8Array(W*H),indices=new Int16Array(W*H).fill(-1);
  let repaired=0;
  for(let y=1;y<H-1;y++)for(let x=4;x<=123;x++){
   const i=y*W+x,c=Array.from(raw.slice(i*3,i*3+3));
   // Separate reduction of generated halo/pool from generated body paint.
   // Master halo is already sized to include both ears; preserve its native registration.
   const rx=x,ry=y;
   const ri=ry*W+rx,rc=Array.from(raw.slice(ri*3,ri*3+3));
   const ring=Math.abs(Math.hypot(x-62,y-48)-46)<6;
   const diamond=Math.abs(x-64)/64+Math.abs(y-128)/32<=1;
   const poolX=x,poolY=Math.min(H-1,Math.round(144+(y-128)*.75)),pi=poolY*W+poolX,pc=Array.from(raw.slice(pi*3,pi*3+3));
   const halo=ring&&valid[ri]&&rc[1]>80&&rc[2]>90&&rc[0]<rc[2]*1.15;
   const pool=y>=115&&diamond&&poolY>=161-Math.abs(poolX-64)*.40&&valid[pi]&&pc[1]>65&&pc[1]>pc[0]*1.4&&pc[2]>pc[0]*1.5;
   const sampleY=Math.round(14+(y-10)*146/149),sample=Math.max(0,Math.min(H-1,sampleY))*W+x;
   let nearOriginal=false;
   if(valid[sample]&&lum(Array.from(raw.slice(sample*3,sample*3+3)))>65&&y>=8&&y<112)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(original[((y+dy)*W+x+dx)*4+3])nearOriginal=true;
   if(!original[i*4+3]&&!nearOriginal&&!halo&&!pool)continue;
   alpha[i]=1;
   if(original[i*4+3]||nearOriginal){
    bodyAlpha[i*4+3]=255;
    c.splice(0,3,...raw.slice(sample*3,sample*3+3));
    if(!valid[sample]){
     // Cover repair samples nearest generated body paint, never repaints day pixels.
     let found=-1,dist=Infinity;
     for(let yy=Math.max(1,sampleY-12);yy<=Math.min(H-2,sampleY+12);yy++)for(let xx=Math.max(4,x-12);xx<=Math.min(123,x+12);xx++){
      const j=yy*W+xx,d=(xx-x)**2+(yy-sampleY)**2;
      if(valid[j]&&original[j*4+3]&&d<dist){dist=d;found=j;}
     }
     assert(found>=0,'no generated paint for cover repair');c.splice(0,3,...raw.slice(found*3,found*3+3));repaired++;
    }
   }else{
    // Quantize generated ground illumination in its cyan ramp, avoiding grey stone colours.
    const light=pc.map(v=>Math.min(255,v*1.3));
    const poolColour=lum(light)>190?rgb[PALETTE.indexOf('#B7DEE0')]:rgb[PALETTE.indexOf('#70A8B6')];
    c.splice(0,3,...(halo?rc:poolColour));
   }
   indices[i]=nearest(c);
  }
  // Absorb isolated averaging colours, retaining strongly contrasting eyes/cores/sparkles.
  const tidy=indices.slice();
  for(let y=1;y<H-1;y++)for(let x=4;x<=123;x++){
   const i=y*W+x,c=indices[i];if(c<0)continue;
   const near=[-W-1,-W,-W+1,-1,1,W-1,W,W+1].map(d=>indices[i+d]).filter(v=>v>=0);
   if(near.length<5||near.includes(c))continue;
   const avg=near.reduce((a,v)=>a+lum(rgb[v]),0)/near.length;if(Math.abs(lum(rgb[c])-avg)>60)continue;
   const counts=new Map();near.forEach(v=>counts.set(v,(counts.get(v)||0)+1));tidy[i]=[...counts].sort((a,b)=>b[1]-a[1])[0][0];
  }
  const frames=[];
  for(let n=0;n<3;n++){
   const out=Buffer.alloc(W*H*4);let uncovered=0;
   for(let i=0;i<W*H;i++)if(alpha[i]){
    let c=rgb[tidy[i]],l=lum(c);
    // Fixed geometry; only generated halo, lit planes and glowing accents breathe.
    if(n&&l>95&&(!bodyAlpha[i*4+3]||(l>150&&c[2]>=c[0]))){const f=n===1?1.13:.87;c=rgb[nearest(c.map(v=>Math.min(255,v*f)))];}
    out.set([...c,255],i*4);
   }
   for(let i=0;i<W*H;i++)if(original[i*4+3]&&!out[i*4+3])uncovered++;
   assert.equal(uncovered,0);const bounds=box(out);assert(bounds[0]>=4&&bounds[2]<=123&&bounds[1]>=1&&bounds[3]<=174);
   const file=`${id}${suffix}-n${n}.png`,png=await sharp(out,{raw:{width:W,height:H,channels:4}}).png().toBuffer();await fs.writeFile(dir+file,png);
   const colours=[...new Set(Array.from({length:W*H},(_,i)=>out[i*4+3]?PALETTE[nearest(Array.from(out.slice(i*4,i*4+3)))]:null).filter(Boolean))].sort();
   rows.push({file,bytes:png.length,original:box(original),body:box(bodyAlpha),ink:bounds,uncovered,colours,coverRepairs:repaired,verdict:'PASS'});frames.push(png);
  }
  const row=facing,top=row*800;
  text.push(`<text x="16" y="${top+27}" fill="#E8F0ED" font-size="19">${id}${suffix} — 1× above / 3× below</text>`);
  for(let col=0;col<6;col++){
   const scene=Buffer.alloc(W*H*4);
   for(let i=0;i<W*H;i++){
    let c=original[i*4+3]?Array.from(original.slice(i*4,i*4+3)):[63,106,69];
    if(col>0)c=c.map((v,k)=>Math.round(v*.56+[10,18,34][k]*.44));
    scene.set([...c,255],i*4);
   }
   let cell=await sharp(scene,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
   if(col>=2){
    // Night frames sit over empty night grass, without a second copy of the day statue.
    const grass=[63,106,69].map((v,k)=>Math.round(v*.56+[10,18,34][k]*.44));
    cell=await sharp({create:{width:W,height:H,channels:3,background:{r:grass[0],g:grass[1],b:grass[2]}}}).composite([{input:col===5?dir+`ev_dark_dobby_red${suffix}-n0.png`:frames[col-2]}]).png().toBuffer();
   }
   const left=16+col*420;text.push(`<text x="${left}" y="${top+57}" fill="#E8F0ED" font-size="17">${['Day','Night fill','Night n0','Night n1','Night n2','Approved dark n0'][col]}</text>`);
   comps.push({input:cell,left:left+128,top:top+75});comps.push({input:await sharp(cell).resize(384,528,{kernel:'nearest'}).toBuffer(),left,top:top+260});
  }
 }
}
await sharp({create:{width:previewW,height:previewH,channels:3,background:'#182328'}}).composite([...comps,{input:Buffer.from(`<svg width="${previewW}" height="${previewH}">${text.join('')}</svg>`),left:0,top:0}]).png().toFile('docs/codex-briefs/statue-night-rider-preview.png');
await fs.writeFile(dir+'masters/rider-metrics.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.map(({file,ink,original,uncovered,colours,coverRepairs})=>({file,ink,original,uncovered,colours:colours.length,coverRepairs})),null,2));
