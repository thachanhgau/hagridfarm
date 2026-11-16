// Filled block-ins keep the actual garden camera visible while textures are authored.
import fs from 'node:fs/promises';import {createRequire} from 'node:module';
import {ISO_TILE} from '../garden-v05/garden-grid.mjs';import {orientedFootprint} from '../garden-v05/decor-runtime.mjs';
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const pack=process.argv[2]||'noel-50-assets',columns=Number(process.argv[3]||2);
const specs=JSON.parse(await fs.readFile(`garden-v05/${pack}/specs.json`,'utf8'));
const out=`garden-v05/${pack}/coordinate-locks/solid`;await fs.mkdir(out,{recursive:true});
const kinds={tent:['elf_yule_tent'],roof:['fang_biscuit_kennel','gingerbread_hagrids_hut','gingerbread_greenhouse','fairy_pine_log'],gazebo:['yule_dance_gazebo'],table:['enchanted_cracker_table','wizard_chess_christmas','badger_cookie_table'],bench:['raven_ice_bench'],rack:['weasley_knit_rack','lion_firewood_rack','holly_broom_fence'],arch:['mistletoe_gate'],cart:['hippogriff_gift_sleigh','hogwarts_express_parcels','mince_pie_cart'],crate:['hagrid_gift_crate'],bed:['frosted_dittany_bed'],lamp:['snitch_lamp_post','platform_clock','enchanted_violin_stand','owl_parcel_roost'],pot:['hagrid_boot_planter','mandrake_earmuff_planter','glowing_mistletoe_pot','serpent_holly_urn'],castle:['snow_hogwarts_castle']};
const records=[];
for(const item of specs){
 const short=item.id.slice(3),kind=item.guideKind||Object.keys(kinds).find(k=>kinds[k].includes(short))||'plinth';
 const W=(item.footprint[0]+item.footprint[1])*ISO_TILE.width/2,B=Math.min(item.maxInkWidth??W-8,W-8),H=Math.round(item.guideHeight??(kind==='tent'?W*.55:kind==='gazebo'?W*.7:kind==='roof'?W*.45:['lamp','cabinet','bus'].includes(kind)?W*1.1:W*.42));
 const maxZ=kind==='roof'?H+W*.35:kind==='gazebo'?H+7+W*.38:kind==='cart'&&item.canopy?H+62:kind==='diary'?H+15+W*.65:kind==='castle'?H*1.7:H+30;
 const layout=item.guideLayout==='poses'?(item.poseLayout||[2]):[columns,columns],cellW=384,cellH=512,zoom=Math.min(3,(cellW-80)/B,(cellH-100)/(maxZ+B*.5)),views=[];let svg='';
 for(let rowIndex=0;rowIndex<layout.length;rowIndex++)for(let column=0;column<layout[rowIndex];column++){
  const row=item.fixedCamera?0:layout.length===1?Number(column>0):rowIndex;
  const facing=row?'right':'default',[cols,rows]=orientedFootprint(item.footprint,facing),unit=B/(cols+rows),cx=cellW/2,cy=cellH-45-(cols+rows)*unit*zoom/4,tx=column*cellW,ty=rowIndex*cellH;
  const project=([c,r,z=0])=>[cx+(c-r)*unit*zoom,cy+(c+r)*unit*zoom/2-z*zoom];
  const points=p=>p.map(q=>project(q).map((v,i)=>Math.round(v)+(i===0?tx:ty)).join(',')).join(' ');
  const polygon=(p,fill,stroke='#231F2E')=>{svg+=`<polygon points="${points(p)}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="miter"/>`;};
  const line=(p,color='#231F2E',w=3)=>{svg+=`<polyline points="${points(p)}" fill="none" stroke="${color}" stroke-width="${w}"/>`;};
  const a=-cols/2,b=cols/2,d=-rows/2,e=rows/2;
  const wood=['#A57554','#735044','#C97952'],stone=item.guideMaterial==='wood'?wood:['#A6B1AE','#687486','#D6D8BF'];
  const box=(c,r,w,l,z,h,colors=wood)=>{const a=c-w/2,b=c+w/2,d=r-l/2,e=r+l/2;polygon([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],colors[0]);polygon([[b,d,z],[b,e,z],[b,e,z+h],[b,d,z+h]],colors[1]);polygon([[a,d,z+h],[b,d,z+h],[b,e,z+h],[a,e,z+h]],colors[2]);};
  const roof=(z,ridge)=>{
   if(!row){const front=[0,e,ridge],back=[0,d,ridge];polygon([[a,d,z],[a,e,z],front,back],'#735044');polygon([[b,d,z],[b,e,z],front,back],'#D6D8BF');polygon([[a,e,z],[b,e,z],front],'#A57554');}
   else {const front=[b,0,ridge],back=[a,0,ridge];polygon([[a,d,z],[b,d,z],front,back],'#735044');polygon([[a,e,z],[b,e,z],front,back],'#D6D8BF');polygon([[b,d,z],[b,e,z],front],'#A57554');}
  };
  if(['round','roundbase'].includes(kind)){
   const radius=Math.min(cols,rows)*(kind==='round'?.6:.44),ring=(rad,z)=>Array.from({length:49},(_,i)=>{const t=i/48*Math.PI*2;return [Math.cos(t)*rad,Math.sin(t)*rad,z];});
   if(kind==='round'){
    const front=(rad,z)=>Array.from({length:25},(_,i)=>{const t=-Math.PI/4+i/24*Math.PI;return [Math.cos(t)*rad,Math.sin(t)*rad,z];});
    const footHeight=item.footHeight??8;
    polygon([...front(radius*.72,footHeight),...front(radius,H).reverse()],item.guideMaterial==='iron'?'#41465C':'#735044');polygon(ring(radius,H),item.guideMaterial==='iron'?'#687486':'#D6D8BF');polygon(ring(radius*.76,H+1),'#231F2E');
    if(!item.noFeet)for(const t of[.2,2.3,4.4])box(Math.cos(t)*radius*.55,Math.sin(t)*radius*.55,.12,.12,0,footHeight+2,item.guideMaterial==='iron'?['#41465C','#231F2E','#687486']:wood);
   }else{polygon(ring(radius,0),'#41465C');polygon(ring(radius,6),'#D6D8BF');if(item.water)polygon(ring(radius*.8,7),'#70A8B6');if(!item.noPost)box(0,0,.1,.1,6,H);}
  }else if(kind==='bike'){
   const span=(row?cols:rows)*.3;
   for(const u of[-span,span]){const pts=Array.from({length:33},(_,i)=>{const t=i/32*Math.PI*2,v=u+Math.cos(t)*.45;return row?[v,0,14+Math.sin(t)*14]:[0,v,14+Math.sin(t)*14];});polygon(pts,'#41465C');}
   line(row?[[-span,0,14],[0,0,H],[span,0,14],[-span,0,14]]:[[0,-span,14],[0,0,H],[0,span,14],[0,-span,14]],'#A57554',8);
  }else if(['box','cabinet','bus'].includes(kind)){box(0,0,cols,rows,0,H,kind==='cabinet'?wood:kind==='bus'?['#3E3B70','#231F2E','#6961A6']:stone);if(kind==='bus')for(const z of[H/3,H*2/3])line([[a,e,z],[b,e,z],[b,d,z]],'#231F2E');}
  else if(kind==='tent'){roof(0,H);if(!row)polygon([[-cols*.22,e,0],[cols*.22,e,0],[0,e,H*.72]],'#231F2E');else polygon([[b,-rows*.22,0],[b,rows*.22,0],[b,0,H*.72]],'#231F2E');}
  else if(kind==='roof'){box(0,0,cols,rows,0,H);roof(H,H+W*.35);}
  else if(kind==='hexgazebo'){
   const vertices=[[a,d/2],[0,d],[b,d/2],[b,e/2],[0,e],[a,e/2]];
   for(let i=2;i<6;i++){const p=vertices[i],q=vertices[(i+1)%6];polygon([[...p,0],[...q,0],[...q,6],[...p,6]],'#687486');}
   polygon(vertices.map(p=>[...p,6]),'#D6D8BF');for(const[c,r]of vertices)box(c*.92,r*.92,.1,.1,6,H,['#D6D8BF','#A6B1AE','#F5D69A']);
   for(let i=0;i<6;i++)polygon([[...vertices[i],H+6],[...vertices[(i+1)%6],H+6],[0,0,H+W*.35]],i<3?'#A6B1AE':'#687486');
  }else if(kind==='bridge'){
   const alongC=cols>=rows,length=alongC?cols:rows,short=alongC?rows:cols,at=(u,v,z)=>alongC?[u,v,z]:[v,u,z];
   for(let i=0;i<5;i++){const u=-length/2+(i+.5)*length/5,z=H+8*Math.sin(Math.PI*(i+.5)/5);if(alongC)box(u,0,length/5,short,z,3);else box(0,u,short,length/5,z,3);}
   for(const v of[-short/2,short/2]){for(const u of[-length/2,length/2]){const[c,r]=at(u,v,0);box(c,r,.12,.12,0,H+16);}line(Array.from({length:17},(_,i)=>at(-length/2+i/16*length,v,H+16+8*Math.sin(Math.PI*i/16))),'#A57554',8);}
  }else if(kind==='gazebo'){
   box(0,0,cols,rows,0,7,stone);
   for(const [c,r]of [[a+.09,d+.09],[b-.09,d+.09],[a+.09,e-.09],[b-.09,e-.09]])box(c,r,.16,.16,7,H);
   const z=H+7,peak=[0,0,H+W*.38];polygon([[a,d,z],[a,e,z],peak],'#687486');polygon([[a,e,z],[b,e,z],peak],'#D6D8BF');polygon([[b,e,z],[b,d,z],peak],'#A6B1AE');
  }else if(['table','bench','diary'].includes(kind)){
   for(const[c,r]of [[a+.12,d+.12],[b-.12,d+.12],[a+.12,e-.12],[b-.12,e-.12]])box(c,r,.16,.16,0,H);
   box(0,0,cols,rows,H,7,kind==='bench'?stone:wood);
   if(item.bookOnTable)box(0,0,cols*.9,rows*.9,H+7,16,['#735044','#4A3042','#A57554']);
   if(kind==='bench')box(0,d+.08,cols,.16,H+7,H*.55,stone);
   if(kind==='diary'){
    const z=H+15;box(0,0,cols*.7,rows*.75,H+7,4,['#4A3042','#231F2E','#735044']);
    polygon((row?[[rows*.32,-cols*.32,z+9],[rows*.32,0,z],[-rows*.32,0,z],[-rows*.32,-cols*.32,z+9]]:[[-cols*.32,-rows*.32,z+9],[0,-rows*.32,z],[0,rows*.32,z],[-cols*.32,rows*.32,z+9]]),'#D6D8BF');
    polygon((row?[[rows*.32,0,z],[rows*.32,cols*.32,z+9],[-rows*.32,cols*.32,z+9],[-rows*.32,0,z]]:[[0,-rows*.32,z],[cols*.32,-rows*.32,z+9],[cols*.32,rows*.32,z+9],[0,rows*.32,z]]),'#F5D69A');
    polygon((row?[[0,-rows*.08,z+2],[0,rows*.05,z+W*.55],[0,rows*.18,z+W*.65],[0,rows*.16,z+W*.35]]:[[-cols*.08,0,z+2],[cols*.05,0,z+W*.55],[cols*.18,0,z+W*.65],[cols*.16,0,z+W*.35]]),'#F5D69A');
   }
  }else if(kind==='bottle'){
   box(0,0,cols,rows,0,7,wood);box(0,0,cols*.65,rows*.65,7,H,['#70A8B6','#687486','#B7DEE0']);box(0,0,cols*.25,rows*.25,H+7,10,['#A57554','#735044','#C97952']);
  }else if(kind==='goblet'){
   const ring=(radius,z)=>Array.from({length:49},(_,i)=>{const t=i/48*Math.PI*2;return[Math.cos(t)*radius,Math.sin(t)*radius,z];}),radius=Math.min(cols,rows)*.44;
   polygon(ring(radius*.45,0),'#735044');box(0,0,.15,.15,0,H*.5);polygon([...ring(radius*.22,H*.5).slice(0,25),...ring(radius,H).slice(0,25).reverse()],'#735044');polygon(ring(radius,H),'#C97952');polygon(ring(radius*.8,H+1),'#231F2E');
  }else if(kind==='tripod'){
   for(const t of[0,Math.PI*2/3,Math.PI*4/3])line([[Math.cos(t)*cols*.35,Math.sin(t)*rows*.35,0],[0,0,H]],'#735044',8);box(0,0,cols*.5,rows*.5,H,12,stone);
  }else if(kind==='pumpkinpost'){
   box(0,0,.16,.16,0,H,wood);box(0,0,cols*.65,rows*.65,H,3,wood);
  }else if(kind==='logbase'){
   const radius=Math.min(cols,rows)*.6,ring=z=>Array.from({length:49},(_,i)=>{const t=i/48*Math.PI*2;return [Math.cos(t)*radius,Math.sin(t)*radius,z];});polygon(ring(0),'#735044');polygon(ring(6),'#A57554');
  }else if(kind==='owlpost'){
   box(0,0,.17,.17,0,H);if(!row)box(0,0,.16,rows,H-8,8);else box(0,0,cols,.16,H-8,8);
  }else if(kind==='roundhut'){
   const radius=Math.min(cols,rows)*.47,ring=z=>Array.from({length:49},(_,i)=>{const t=i/48*Math.PI*2;return [Math.cos(t)*radius,Math.sin(t)*radius,z];});
   const front=z=>Array.from({length:25},(_,i)=>{const t=-Math.PI/4+i/24*Math.PI;return [Math.cos(t)*radius,Math.sin(t)*radius,z];});
   polygon([...front(0),...front(H).reverse()],'#A6B1AE');polygon(ring(H),'#687486');
   const rim=ring(H);for(let i=0;i<48;i++)polygon([rim[i],rim[i+1],[0,0,H+W*.42]],i<24?'#687486':'#41465C');
   if(item.porch){const pw=cols*.32,pl=rows*.23,pr=radius+pl*.35,ph=H*.72,fa=pr+pl/2,back=pr-pl/2;
    for(const c of[-pw/2,pw/2])box(c,fa,.1,.1,0,ph,wood);
    polygon([[-pw*.34,radius*.98,0],[pw*.34,radius*.98,0],[pw*.34,radius*.98,ph],[-pw*.34,radius*.98,ph]],'#735044');
    polygon([[-pw/2,back,ph],[-pw/2,fa,ph],[0,fa,ph+W*.14],[0,back,ph+W*.14]],'#41465C');polygon([[pw/2,back,ph],[pw/2,fa,ph],[0,fa,ph+W*.14],[0,back,ph+W*.14]],'#687486');polygon([[-pw/2,fa,ph],[pw/2,fa,ph],[0,fa,ph+W*.14]],'#A57554');
    box(-cols*.22,-rows*.1,.25,.25,H,H+W*.14,stone);
   }
  }else if(kind==='marketstall'){
   const counter=H*.46;for(const[c,r]of[[a,d],[b,d],[a,e],[b,e]])box(c*.93,r*.93,.09,.09,0,H,wood);box(0,0,cols,rows,counter,4,wood);box(0,0,cols*.92,rows*.92,6,4,wood);roof(H,H+W*.25);
  }else if(kind==='organic'){
   line([[a,e,0],[b,e,0],[b,d,0]],'#A6B1AE',2);
  }else if(kind==='rack'||kind==='arch'){
   if(!row){for(const r of [d+.1,e-.1])box(0,r,.16,.16,0,H);box(0,0,.16,rows,H-8,8);}
   else{for(const c of[a+.1,b-.1])box(c,0,.16,.16,0,H);box(0,0,cols,.16,H-8,8);}
  }else if(kind==='crate'||kind==='cart'||kind==='bed'){
   const h=kind==='bed'?H*.45:H;box(0,0,cols,rows,0,h);
   for(const z of[h/3,2*h/3])line([[a,e,z],[b,e,z],[b,d,z]],'#4A3042');
   if(kind!=='bed'&&!pack.startsWith('isometric-')){box(-cols*.15,-rows*.2,cols*.45,rows*.3,h,22,['#C75B4B','#874056','#ED8A45']);box(cols*.18,rows*.12,cols*.35,rows*.35,h,15,['#71934B','#24483F','#B0BD67','#B0BD67']);}
   if(kind==='cart'&&(short==='mince_pie_cart'||item.canopy)){for(const[c,r]of [[a,d],[b,d],[a,e],[b,e]])box(c*.85,r*.85,.08,.08,h,42);roof(h+42,h+62);}
  }else if(kind==='lamp'){
   if(!item.noPlinth)box(0,0,cols,rows,0,7,stone);box(0,0,.14,.14,item.noPlinth?0:7,H,wood);box(0,0,.5,.5,H+7,20,['#E7AE73','#C97952','#F5D69A']);
  }else if(kind==='pot'){
   box(0,0,cols*.9,rows*.9,0,H,stone);
  }else if(kind==='castle'){
   box(0,0,cols,rows,0,H,stone);for(const[c,r]of[[a+.25,d+.25],[b-.25,d+.25],[a+.25,e-.25],[b-.25,e-.25]])box(c,r,.5,.5,H,H*.7,stone);
  }else{box(0,0,cols,rows,0,9,stone);if(!item.plinthOnly)line([[0,0,9],[0,0,H]],'#A6B1AE',3);}
  views.push({facing,cell:[column,row],baseCorners:[[a,d,0],[b,d,0],[b,e,0],[a,e,0]].map(project),axisColumn:[unit*zoom,unit*zoom/2],axisRow:[-unit*zoom,unit*zoom/2]});
 }
 const file=`${out}/${item.id}.png`;
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW*Math.max(...layout)}" height="${cellH*layout.length}">${svg}</svg>`)).png().toFile(file);
 records.push({id:item.id,kind,guide:file,width:cellW*Math.max(...layout),height:cellH*layout.length,views});
}
await fs.writeFile(`${out}/manifest.json`,JSON.stringify(records,null,2)+'\n');console.log(`Wrote ${records.length} filled 2:1 camera block-ins.`);
