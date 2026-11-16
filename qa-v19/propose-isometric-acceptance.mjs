// Creates review proposals from observed image pixels. It never publishes or approves art.
import fs from'node:fs/promises';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{circularFrontEvidence}from'../garden-v05/isometric-art-validation.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),root='garden-v05/',read=async f=>JSON.parse(await fs.readFile(root+f,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const foot=new Set(['decor_floating_candles','sp_hand_glory','sp_cursed_opal_necklace','hw_wooden_black_cat']);
const rim=new Set(['decor_mandrake_planter','earned_decoration_decoration-51','decor_cauldron','hw_monster_candy_barrel','hw_candy_cauldron','habitat_diricawl','habitat_dragon','habitat_thestral']);
function contour(raw,b,mode,id){const{data,info:{width:w}}=raw;let y0=Math.floor(b.y+b.h*.82),y1=b.y+b.h,x0=b.x,x1=b.x+b.w-1,mask=(x,y)=>data[(y*w+x)*4+3]>0;
 if(mode==='rim'){
  const gray=new Set(id==='decor_cauldron'?['165,117,84','201,121,82','231,174,115','245,214,154']:['166,177,174','214,216,191','183,222,224']);mask=(x,y)=>{const i=(y*w+x)*4;return data[i+3]>0&&gray.has(data[i]+','+data[i+1]+','+data[i+2]);};
  const rows=[];for(let y=b.y;y<b.y+b.h;y++){let lo=w,hi=-1,n=0;for(let x=b.x;x<b.x+b.w;x++)if(mask(x,y)){lo=Math.min(lo,x);hi=Math.max(hi,x);n++;}rows.push({y,lo,hi,n,span:hi-lo});}
  const widest=Math.max(...rows.map(r=>r.span)),first=rows.findIndex(r=>r.span>=widest*.7&&r.n>=Math.max(3,widest*.08));if(first<0)return null;
  let end=first,gaps=0;for(let k=first;k<rows.length;k++){const r=rows[k];if(r.n>=Math.max(3,widest*.08)&&r.span>=widest*.35){end=k;gaps=0;}else if(++gaps>1)break;}
  y0=Math.max(b.y,rows[first].y-3);y1=rows[end].y+1;x0=Math.min(...rows.slice(first,end+1).filter(r=>r.n).map(r=>r.lo));x1=Math.max(...rows.slice(first,end+1).filter(r=>r.n).map(r=>r.hi));
 }else{const xs=[];for(let x=b.x;x<b.x+b.w;x++)for(let y=y0;y<y1;y++)if(mask(x,y)){xs.push(x);break;}if(!xs.length)return null;x0=Math.min(...xs);x1=Math.max(...xs);}
 const points=[],cap=Math.max(2,Math.min(4,Math.floor((x1-x0)*.06)));for(let x=x0+cap;x<=x1-cap;x++){for(let y=y1-1;y>=y0;y--)if(mask(x,y)){points.push([x,y]);break;}}
 if(points.length<8)return null;return{points,diameter:[x0,x1],region:{x0,x1,y0,y1},...circularFrontEvidence(points,[x0,x1],2)};
}
const proposals=[];
for(const pack of['isometric-hd-assets','isometric-extra-assets']){const candidates=await read(pack+'/candidates.json'),observed=await read(pack+'/observed-hd-edges.json');for(const c of candidates.items){const seen=observed.items.find(i=>i.id===c.id),views={};for(const [vi,v]of seen.views.entries()){
 const name=vi?(c.fixedCamera?(c.winter?'winter':'idle'):'right'):'default',f=c.previewHD[vi],bytes=await fs.readFile(root+f.file),base={file:f.file,sha256:sha(bytes),density:2,frame:v.frame};
 if(foot.has(c.id)||rim.has(c.id)){const raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),arc=contour(raw,f.bounds,rim.has(c.id)?'rim':'foot',c.id);views[name]={...base,method:'circular-front',plane:rim.has(c.id)?'horizontal rim':'circular foot',...arc,passed:!!arc&&arc.maxDistance<=1};continue;}
 const chosen=[];for(const axis of['column','row']){const passing=v.edges.filter(e=>e.axis===axis&&e.axisFit?.maxDistance<=1&&e.axisFit.span>=6);if(passing.length){const e=passing[0];chosen.push({axis,points:e.interiorPoints,density:2,plane:'visible structural edge in the recorded image region',...e.axisFit});}}
 views[name]={...base,method:chosen.length?'measured':'unresolved',edges:chosen,region:v.region,passed:chosen.length>0};
 }
 proposals.push({id:c.id,masterSha256:c.masterSha256,identityReviewed:false,allFramesReviewed:false,views,passed:Object.values(views).every(v=>v.passed)});
}}
await fs.writeFile(root+'isometric-hd-review-proposals.json',JSON.stringify({version:1,approved:false,items:proposals},null,2)+'\n');console.log({proposed:proposals.length,measurable:proposals.filter(p=>p.passed).length,unresolved:proposals.filter(p=>!p.passed).map(p=>({id:p.id,views:Object.entries(p.views).filter(([,v])=>!v.passed).map(([k,v])=>[k,v.method,v.maxDistance])}))});
