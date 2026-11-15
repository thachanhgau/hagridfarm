// Coordinate-locked 3D block-in for texture-only redraw; not a runtime asset.
import fs from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
let cells='';const views=[];
for(let row=0;row<2;row++)for(let column=0;column<2;column++){
 const right=row===1,cols=right?2:1,rows=right?1:2,unit=88/(cols+rows),origin=[64,116-(cols+rows)*unit/4],tx=column*384,ty=row*384;
 const project=([c,r,z=0])=>[origin[0]+(c-r)*unit,origin[1]+(c+r)*unit/2-z];
 const points=p=>p.map(q=>project(q).map((v,i)=>Math.round(v*3)+(i===0?tx:ty)).join(',')).join(' ');
 let svg='';const polygon=(p,fill,stroke='#231F2E')=>{svg+=`<polygon points="${points(p)}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="miter"/>`;};
 const a=-cols/2,b=cols/2,d=-rows/2,e=rows/2,h=38;
 polygon([[a,d,0],[b,d,0],[b,e,0],[a,e,0]],'#735044');
 polygon([[a,d,0],[b,d,0],[b,d,h],[a,d,h]],'#735044');
 polygon([[a,d,0],[a,e,0],[a,e,h],[a,d,h]],'#4A3042');
 const box=(c,r,w,l,z,h,colors)=>{const a=c-w/2,b=c+w/2,d=r-l/2,e=r+l/2;polygon([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],colors[0]);polygon([[b,d,z],[b,e,z],[b,e,z+h],[b,d,z+h]],colors[1]);polygon([[a,d,z+h],[b,d,z+h],[b,e,z+h],[a,e,z+h]],colors[2]);};
 box(-cols*.12,-rows*.16,cols*.5,rows*.28,8,54,['#C75B4B','#874056','#ED8A45']);
 box(cols*.2,rows*.14,cols*.3,rows*.3,8,44,['#71934B','#24483F','#B0BD67']);
 box(-cols*.16,rows*.2,cols*.42,rows*.3,8,38,['#C97952','#8B4A3F','#F5D69A']);
 polygon([[a,e,0],[b,e,0],[b,e,h],[a,e,h]],'#A57554');
 polygon([[b,d,0],[b,e,0],[b,e,h],[b,d,h]],'#735044');
 for(const z of [12,24]){svg+=`<polyline points="${points([[a,e,z],[b,e,z],[b,d,z]])}" fill="none" stroke="#4A3042" stroke-width="3"/>`;}
 svg+=`<polyline points="${points([[a,e,h],[b,e,h],[b,d,h]])}" fill="none" stroke="#D6D8BF" stroke-width="6"/>`;
 cells+=svg;views.push({view:right?'right':'default',cell:[column,row],frontBaseEdge:[project([a,e,0]),project([b,e,0])],sideBaseEdge:[project([b,e,0]),project([b,d,0])]});
}
await fs.mkdir('garden-v05/noel-50-assets/coordinate-locks/solid',{recursive:true});
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768">${cells}</svg>`)).png().toFile('garden-v05/noel-50-assets/coordinate-locks/solid/nx_hagrid_gift_crate.png');
await fs.writeFile('garden-v05/noel-50-assets/coordinate-locks/solid/nx_hagrid_gift_crate.json',JSON.stringify({axes:{column:[32,16],row:[-32,16]},modelUnit:88/3,views},null,2)+'\n');
