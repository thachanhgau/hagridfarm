import fs from'node:fs/promises';import{createRequire}from'node:module';import{buildAnimatedFrames}from'../garden-v05/generate-decor-assets.mjs';
const sharp=createRequire(import.meta.url)('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),root='garden-v05/',m=JSON.parse(await fs.readFile(root+'decor-assets-manifest.json','utf8'));let frames=0;
for(const item of m.items.filter(i=>/^decor_(pumpkin_lantern|broom_rack|cauldron|mandrake_planter|floating_candles|vine_arch)$/.test(i.id)))for(const right of[false,true]){
 const base=await sharp(root+(right?item.rightFile:item.file)).ensureAlpha().raw().toBuffer(),rendered=buildAnimatedFrames(base,{id:item.id,width:item.width,height:item.height},right);
 for(let i=0;i<4;i++){const file=(right?item.rightFrames:item.frames)[i],raw=await sharp(root+file).ensureAlpha().raw().toBuffer();if(!rendered[i].equals(raw))throw Error('Legacy motion changed '+item.id+' '+right+' '+i);frames++;}
}
console.log({unchangedAnimationFrames:frames});
