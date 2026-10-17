// Technical sprite extraction from the new ImageGen atlas. Original art is
// retained; exports use nearest sampling and the garden's existing palette.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.dirname(fileURLToPath(import.meta.url));
const source = 'masters-forest/forest-atlas-v06.png';
const palette = ['231F2E','4A3042','735044','A57554','41465C','687486','A6B1AE','D6D8BF','24483F','3F6A45','71934B','B0BD67','8B4A3F','C97952','E7AE73','F5D69A','874056','C75B4B','ED8A45','FFC36B','3E3B70','6961A6','70A8B6','B7DEE0'].map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
const specs = [
  {id:'oak',rect:[0,0,850,575],width:190,height:176},
  {id:'pine',rect:[850,0,686,595],width:104,height:196},
  {id:'grove',rect:[0,575,850,449],width:190,height:136},
  {id:'log',rect:[850,595,686,429],width:144,height:88},
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const result=[];
await fs.mkdir(path.join(root,'environment/forest-v06'),{recursive:true});
for(const spec of specs){
  const [left,top,width,height]=spec.rect;
  const {data,info}=await sharp(path.join(root,source)).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let minX=width,minY=height,maxX=-1,maxY=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=(y*width+x)*4+3;
    data[a]=data[a]>=192?255:0;
    if(data[a]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    else data.fill(0,a-3,a+1);
  }
  if(maxX<0)throw Error('Empty forest sprite '+spec.id);
  const native=await sharp(data,{raw:info}).extract({left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1}).resize(spec.width-4,spec.height-4,{fit:'inside',kernel:'nearest'}).raw().toBuffer({resolveWithObject:true});
  const cache=new Map();
  for(let i=0;i<native.data.length;i+=4){
    if(!native.data[i+3])continue;
    const key=native.data.readUIntBE(i,3);
    let color=cache.get(key);
    if(!color){let best=Infinity;for(const p of palette){const distance=2*(p[0]-native.data[i])**2+3*(p[1]-native.data[i+1])**2+(p[2]-native.data[i+2])**2;if(distance<best){best=distance;color=p;}}cache.set(key,color);}
    native.data.set(color,i);
  }
  const file=`environment/forest-v06/${spec.id}.png`;
  await sharp({create:{width:spec.width,height:spec.height,channels:4,background:'#00000000'}}).composite([{input:await sharp(native.data,{raw:native.info}).png().toBuffer(),left:Math.floor((spec.width-native.info.width)/2),top:spec.height-2-native.info.height}]).png().toFile(path.join(root,file));
  result.push({...spec,file,pivotX:Math.floor(spec.width/2),pivotY:spec.height-2,sourceRect:spec.rect,sha256:hash(await fs.readFile(path.join(root,file)))});
}
await fs.writeFile(path.join(root,'forest-assets.json'),JSON.stringify({version:6,source,sourceSha256:hash(await fs.readFile(path.join(root,source))),method:'Built-in ImageGen; technical panel extraction, alpha threshold 192, nearest-neighbor native export, existing 24-color palette',assets:result},null,2)+'\n');
console.log(JSON.stringify(result));
