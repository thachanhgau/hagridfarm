// Authoring export for the dense Forbidden Lake oak; original placement/canvas/pivot are retained.
import fs from'node:fs/promises';import path from'node:path';import{fileURLToPath}from'node:url';import{createRequire}from'node:module';import{createHash}from'node:crypto';import{SPRITE_PALETTE}from'./palette.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),dir='environment/forest-v06/masters/lake-ring-20261116',sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),sha=b=>createHash('sha256').update(b).digest('hex'),read=async f=>JSON.parse(await fs.readFile(path.join(root,f))),write=(f,v)=>fs.writeFile(path.join(root,f),JSON.stringify(v,null,2)+'\n');
const colors=[...SPRITE_PALETTE,'#E8F0ED'].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
export async function forestOakPixels(winter=false,density=1){
 const config=await read(dir+'/export.json'),f=config.frames[winter?1:0],bytes=await fs.readFile(path.join(root,f.master));if(sha(bytes)!==f.masterSha256)throw Error('Changed forest master');const b=config.placement,W=b.width*density,H=b.height*density;
 const raw=await sharp(bytes).extract(config.crop).resize(W,H,{kernel:'nearest'}).ensureAlpha().raw().toBuffer(),cache=new Map();
 for(let i=0;i<raw.length;i+=4){if(raw[i+3]<192){raw.fill(0,i,i+4);continue;}const key=raw.readUIntBE(i,3);if(!cache.has(key)){let score=Infinity,hit;for(const c of colors){const d=2*(raw[i]-c[0])**2+3*(raw[i+1]-c[1])**2+(raw[i+2]-c[2])**2;if(d<score){score=d;hit=c;}}cache.set(key,hit);}raw.set(cache.get(key),i);raw[i+3]=255;}
 const out=Buffer.alloc(190*176*density*density*4);for(let y=0;y<H;y++)raw.copy(out,(((b.top*density+y)*190*density)+b.left*density)*4,y*W*4,(y+1)*W*4);return out;
}
export async function publishForestOak(){
 const config=await read(dir+'/export.json'),frames=[];
 for(const [index,f]of config.frames.entries()){
  const raw=await forestOakPixels(index===1),HD=await forestOakPixels(index===1,2),png=await sharp(raw,{raw:{width:190,height:176,channels:4}}).png().toBuffer(),hdFile=dir+`/published-${index}.png`,hd=await sharp(HD,{raw:{width:380,height:352,channels:4}}).png().toBuffer();let x0=190,y0=176,x1=-1,y1=-1;for(let y=0;y<176;y++)for(let x=0;x<190;x++)if(raw[(y*190+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x0<1||y0<1||x1>188||y1>174)throw Error('Forest sprite touches canvas border');
  await fs.writeFile(path.join(root,f.file),png);await fs.writeFile(path.join(root,hdFile),hd);frames.push({...f,sourceRect:config.crop,width:190,height:176,pivotX:95,pivotY:174,bounds:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1},sha256:sha(png),hdFile,hdSha256:sha(hd)});
 }
 await write('forest-coordinate-art.json',{version:1,items:[{id:'lake-forest-oak-20261116',targetKind:'forest',master:frames[0].master,masterSha256:frames[0].masterSha256,frameRecords:frames}]});
 const forest=await read('forest-assets.json'),oak=forest.assets.find(a=>a.id==='oak');Object.assign(oak,frames[0],{replacement:'lake-ring-20261116'});await write('forest-assets.json',forest);
 const winter=await read('environment/winter/provenance.json'),snow=winter.assets.find(a=>a.file==='oak.png');Object.assign(snow,{master:frames[1].master,masterSha256:frames[1].masterSha256,sha256:frames[1].sha256,replacement:'lake-ring-20261116',inkBox:[frames[1].bounds.x,frames[1].bounds.y,frames[1].bounds.x+frames[1].bounds.w,frames[1].bounds.y+frames[1].bounds.h]});await write('environment/winter/provenance.json',winter);return oak;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await publishForestOak());
