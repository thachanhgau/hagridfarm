// Filled block-ins keep the actual garden camera visible while textures are authored.
import fs from 'node:fs/promises';import {createRequire} from 'node:module';
import {ISO_TILE} from '../garden-v05/garden-grid.mjs';import {orientedFootprint} from '../garden-v05/decor-runtime.mjs';
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const pack=process.argv[2]||'noel-50-assets';
const specs=JSON.parse(await fs.readFile(`garden-v05/${pack}/specs.json`,'utf8'));
const out=`garden-v05/${pack}/coordinate-locks/solid`;await fs.mkdir(out,{recursive:true});
const kinds={tent:['elf_yule_tent'],roof:['fang_biscuit_kennel','gingerbread_hagrids_hut','gingerbread_greenhouse','fairy_pine_log'],gazebo:['yule_dance_gazebo'],table:['enchanted_cracker_table','wizard_chess_christmas','badger_cookie_table'],bench:['raven_ice_bench'],rack:['weasley_knit_rack','lion_firewood_rack','holly_broom_fence'],arch:['mistletoe_gate'],cart:['hippogriff_gift_sleigh','hogwarts_express_parcels','mince_pie_cart'],crate:['hagrid_gift_crate'],bed:['frosted_dittany_bed'],lamp:['snitch_lamp_post','platform_clock','enchanted_violin_stand','owl_parcel_roost'],pot:['hagrid_boot_planter','mandrake_earmuff_planter','glowing_mistletoe_pot','serpent_holly_urn'],castle:['snow_hogwarts_castle']};
const records=[];
for(const item of specs){
 const short=item.id.slice(3),kind=item.guideKind||Object.keys(kinds).find(k=>kinds[k].includes(short))||'plinth';
 const W=(item.footprint[0]+item.footprint[1])*ISO_TILE.width/2,B=Math.min(item.maxInkWidth??W-8,W-8),H=Math.round(kind==='tent'?W*.55:kind==='gazebo'?W*.7:kind==='roof'?W*.45:kind==='lamp'?W*1.1:W*.42);
 const cellW=Math.max(256,W*3+64),cellH=Math.max(320,(H+W*.8+30)*3),zoom=3,views=[];let svg='';
 for(let row=0;row<2;row++)for(let column=0;column<2;column++){
  const facing=row?'right':'default',[cols,rows]=orientedFootprint(item.footprint,facing),unit=B/(cols+rows),cx=cellW/2,cy=cellH-45-(cols+rows)*unit*zoom/4,tx=column*cellW,ty=row*cellH;
  const project=([c,r,z=0])=>[cx+(c-r)*unit*zoom,cy+(c+r)*unit*zoom/2-z*zoom];
  const points=p=>p.map(q=>project(q).map((v,i)=>Math.round(v)+(i===0?tx:ty)).join(',')).join(' ');
  const polygon=(p,fill,stroke='#231F2E')=>{svg+=`<polygon points="${points(p)}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="miter"/>`;};
  const line=(p,color='#231F2E',w=3)=>{svg+=`<polyline points="${points(p)}" fill="none" stroke="${color}" stroke-width="${w}"/>`;};
  const a=-cols/2,b=cols/2,d=-rows/2,e=rows/2;
  const wood=['#A57554','#735044','#C97952'],stone=['#A6B1AE','#687486','#D6D8BF'];
  const box=(c,r,w,l,z,h,colors=wood)=>{const a=c-w/2,b=c+w/2,d=r-l/2,e=r+l/2;polygon([[a,e,z],[b,e,z],[b,e,z+h],[a,e,z+h]],colors[0]);polygon([[b,d,z],[b,e,z],[b,e,z+h],[b,d,z+h]],colors[1]);polygon([[a,d,z+h],[b,d,z+h],[b,e,z+h],[a,e,z+h]],colors[2]);};
  const roof=(z,ridge)=>{
   if(!row){const front=[0,e,ridge],back=[0,d,ridge];polygon([[a,d,z],[a,e,z],front,back],'#735044');polygon([[b,d,z],[b,e,z],front,back],'#D6D8BF');polygon([[a,e,z],[b,e,z],front],'#A57554');}
   else {const front=[b,0,ridge],back=[a,0,ridge];polygon([[a,d,z],[b,d,z],front,back],'#735044');polygon([[a,e,z],[b,e,z],front,back],'#D6D8BF');polygon([[b,d,z],[b,e,z],front],'#A57554');}
  };
  if(kind==='tent'){roof(0,H);if(!row)polygon([[-cols*.22,e,0],[cols*.22,e,0],[0,e,H*.72]],'#231F2E');else polygon([[b,-rows*.22,0],[b,rows*.22,0],[b,0,H*.72]],'#231F2E');}
  else if(kind==='roof'){box(0,0,cols,rows,0,H);roof(H,H+W*.35);}
  else if(kind==='gazebo'){
   box(0,0,cols,rows,0,7,stone);
   for(const [c,r]of [[a+.09,d+.09],[b-.09,d+.09],[a+.09,e-.09],[b-.09,e-.09]])box(c,r,.16,.16,7,H);
   const z=H+7,peak=[0,0,H+W*.38];polygon([[a,d,z],[a,e,z],peak],'#687486');polygon([[a,e,z],[b,e,z],peak],'#D6D8BF');polygon([[b,e,z],[b,d,z],peak],'#A6B1AE');
  }else if(['table','bench'].includes(kind)){
   for(const[c,r]of [[a+.12,d+.12],[b-.12,d+.12],[a+.12,e-.12],[b-.12,e-.12]])box(c,r,.16,.16,0,H);
   box(0,0,cols,rows,H,7,kind==='bench'?stone:wood);
   if(kind==='bench')box(0,d+.08,cols,.16,H+7,H*.55,stone);
  }else if(kind==='rack'||kind==='arch'){
   if(!row){for(const r of [d+.1,e-.1])box(0,r,.16,.16,0,H);box(0,0,.16,rows,H-8,8);}
   else{for(const c of[a+.1,b-.1])box(c,0,.16,.16,0,H);box(0,0,cols,.16,H-8,8);}
  }else if(kind==='crate'||kind==='cart'||kind==='bed'){
   const h=kind==='bed'?H*.45:H;box(0,0,cols,rows,0,h);
   for(const z of[h/3,2*h/3])line([[a,e,z],[b,e,z],[b,d,z]],'#4A3042');
   if(kind!=='bed'){box(-cols*.15,-rows*.2,cols*.45,rows*.3,h,22,['#C75B4B','#874056','#ED8A45']);box(cols*.18,rows*.12,cols*.35,rows*.35,h,15,['#71934B','#24483F','#B0BD67']);}
   if(kind==='cart'&&(short==='mince_pie_cart'||item.canopy)){for(const[c,r]of [[a,d],[b,d],[a,e],[b,e]])box(c*.85,r*.85,.08,.08,h,42);roof(h+42,h+62);}
  }else if(kind==='lamp'){
   box(0,0,cols,rows,0,7,stone);box(0,0,.14,.14,7,H,wood);box(0,0,.5,.5,H+7,20,['#E7AE73','#C97952','#F5D69A']);
  }else if(kind==='pot'){
   box(0,0,cols*.9,rows*.9,0,H,stone);
  }else if(kind==='castle'){
   box(0,0,cols,rows,0,H,stone);for(const[c,r]of[[a+.25,d+.25],[b-.25,d+.25],[a+.25,e-.25],[b-.25,e-.25]])box(c,r,.5,.5,H,H*.7,stone);
  }else{box(0,0,cols,rows,0,9,stone);line([[0,0,9],[0,0,H]],'#A6B1AE',3);}
  views.push({facing,cell:[column,row],baseCorners:[[a,d,0],[b,d,0],[b,e,0],[a,e,0]].map(project),axisColumn:[unit*zoom,unit*zoom/2],axisRow:[-unit*zoom,unit*zoom/2]});
 }
 const file=`${out}/${item.id}.png`;
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cellW*2}" height="${cellH*2}">${svg}</svg>`)).png().toFile(file);
 records.push({id:item.id,kind,guide:file,width:cellW*2,height:cellH*2,views});
}
await fs.writeFile(`${out}/manifest.json`,JSON.stringify(records,null,2)+'\n');console.log(`Wrote ${records.length} filled 2:1 camera block-ins.`);
