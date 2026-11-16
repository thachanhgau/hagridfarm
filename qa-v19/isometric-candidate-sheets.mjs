import fs from 'node:fs/promises';import {createRequire}from'node:module';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),pack=process.argv[2]||'isometric-hd-assets',root='garden-v05/',out='docs/isometric-hd-audit-20261115',data=JSON.parse(await fs.readFile(root+pack+'/candidates.json','utf8'));
for(let page=0;page<Math.ceil(data.items.length/10);page++){
 const layers=[];for(const [slot,item]of data.items.slice(page*10,page*10+10).entries()){
  for(const [view,index]of [0,4].entries()){const f=item.previewHD?.[view]||item.frames[index],b=await sharp(root+f.file).resize({width:210,height:190,fit:'inside',kernel:'nearest'}).png().toBuffer(),m=await sharp(b).metadata();layers.push({input:b,left:slot%5*240+Math.floor((240-m.width)/2),top:Math.floor(slot/5)*430+view*190+190-m.height});}
  layers.push({input:Buffer.from(`<svg width="240" height="32"><text x="120" y="22" font-size="11" font-family="sans-serif" text-anchor="middle" fill="#F5D69A">${page*10+slot+1}. ${item.id}</text></svg>`),left:slot%5*240,top:Math.floor(slot/5)*430+380});
 }
 await sharp({create:{width:1200,height:860,channels:4,background:'#24483F'}}).composite(layers).webp({lossless:true}).toFile(`${out}/${pack}-candidate-${page+1}.webp`);
}
console.log({pack,items:data.items.length});
