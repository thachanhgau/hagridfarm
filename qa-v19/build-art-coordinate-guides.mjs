// Geometry-only authoring reference, never game artwork. Uses the actual renderer axes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {ISO_TILE} from '../garden-v05/garden-grid.mjs';
import {orientedFootprint,footLift} from '../garden-v05/decor-runtime.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const folder=process.argv[2]||'noel-50-assets';
const specs=JSON.parse(await fs.readFile(path.join(root,'garden-v05',folder,'specs.json')));
const output=path.join(root,'garden-v05',folder,'coordinate-locks');await fs.mkdir(output,{recursive:true});
const records=[];
for(const item of specs){
 const width=(item.footprint[0]+item.footprint[1])*ISO_TILE.width/2;
 const height=Math.ceil((Math.min(width*2,224)+20)/16)*16,pivot=[width/2,height-16];
 const directions={};let svg='';
 const cellW=640,cellH=800,zoom=3;
 for(const [row,facing]of ['default','right'].entries()){
  const [cols,rows]=orientedFootprint(item.footprint,facing);
  const center=[pivot[0],pivot[1]-ISO_TILE.height*footLift(item.footprint)];
  const project=([col,r,z=0])=>[center[0]+(col-r)*ISO_TILE.width/2,center[1]+(col+r)*ISO_TILE.height/2-z];
  const corners=[[-cols/2,-rows/2],[cols/2,-rows/2],[cols/2,rows/2],[-cols/2,rows/2]].map(project);
  // Inset plane stays entirely inside the locked footprint, its front vertex at the foot pivot row.
  const inset=.82,baseCenterY=pivot[1]-(cols+rows)*ISO_TILE.height/4*inset;
  const base=corners.map(([x,y])=>[pivot[0]+(x-pivot[0])*inset,baseCenterY+(y-center[1])*inset]);
  const roofHeight=Math.round(Math.min(width*(item.id==='nx_elf_yule_tent'?.55: ['nx_hagrid_gift_crate','nx_wizard_chess_christmas'].includes(item.id)?.4:1.1),160)),top=base.map(([x,y])=>[x,y-roofHeight]);
  const frontPair=facing==='default'?[3,2]:[1,2],backPair=facing==='default'?[0,1]:[0,3];
  const ridge=pair=>[(base[pair[0]][0]+base[pair[1]][0])/2,(base[pair[0]][1]+base[pair[1]][1])/2-roofHeight];
  const roofRidge=[ridge(backPair),ridge(frontPair)];
  directions[facing]={orientedFootprint:[cols,rows],floorCorners:corners,baseCorners:base,topCorners:top,roofRidge};
  for(let column=0;column<2;column++){
   const tx=column*cellW+(cellW-width*zoom)/2,ty=row*cellH+cellH-height*zoom;
   const points=points=>points.map(([x,y])=>`${(x*zoom+tx).toFixed(2)},${(y*zoom+ty).toFixed(2)}`).join(' ');
   svg+=`<polygon points="${points(corners)}" fill="#24483F" fill-opacity=".16" stroke="#70A8B6" stroke-width="3"/>`;
   for(let c=1;c<cols;c++)svg+=`<polyline points="${points([project([-cols/2+c,-rows/2]),project([-cols/2+c,rows/2])])}" fill="none" stroke="#70A8B6" stroke-width="2"/>`;
   for(let r=1;r<rows;r++)svg+=`<polyline points="${points([project([-cols/2,-rows/2+r]),project([cols/2,-rows/2+r])])}" fill="none" stroke="#70A8B6" stroke-width="2"/>`;
   svg+=`<polygon points="${points(base)}" fill="#A57554" fill-opacity=".3" stroke="#F5D69A" stroke-width="4"/>`;
   if(item.id==='nx_elf_yule_tent'){
    svg+=`<polyline points="${points([base[frontPair[0]],roofRidge[1],base[frontPair[1]]])}" fill="none" stroke="#C75B4B" stroke-width="4"/>`;
    svg+=`<polyline points="${points([base[backPair[0]],roofRidge[0],base[backPair[1]]])}" fill="none" stroke="#C75B4B" stroke-width="3"/>`;
    svg+=`<polyline points="${points(roofRidge)}" stroke="#C75B4B" stroke-width="4"/>`;
   }else{
    svg+=`<polygon points="${points(top)}" fill="none" stroke="#C75B4B" stroke-width="3"/>`;
    for(let i=0;i<4;i++)svg+=`<polyline points="${points([base[i],top[i]])}" stroke="#A6B1AE" stroke-width="2"/>`;
   }
   for(const p of base)svg+=`<circle cx="${p[0]*zoom+tx}" cy="${p[1]*zoom+ty}" r="5" fill="#FFC36B"/>`;
  }
 }
 const guide=`${item.id}-guide.png`;
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1600">${svg}</svg>`)).png().toFile(path.join(output,guide));
 records.push({id:item.id,version:1,projectionOwner:'garden-grid.mjs ISO_TILE / iso',tile:ISO_TILE,axes:{column:[ISO_TILE.width/2,ISO_TILE.height/2],row:[-ISO_TILE.width/2,ISO_TILE.height/2],height:[0,-1]},canvas:{width,height},pivot,footprint:item.footprint,directions,guide,guideScale:zoom,measuredEdges:null,acceptance:'unreviewed: footprint acceptance does not prove camera/edge alignment'});
}
await fs.writeFile(path.join(output,'locks.json'),JSON.stringify(records,null,2)+'\n');console.log(`Wrote ${records.length} geometry locks and 2×2 guide sheets.`);
