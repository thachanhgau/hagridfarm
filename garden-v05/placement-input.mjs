import {el,button} from './ui-utils.mjs?v=24.9.90';
import {worldToGrid} from './garden-grid.mjs?v=24.9.90';
export function previewHit(point,at,item,facing,project){
 if(!point||!at)return false;
 const [x,y]=project(...at),b=(facing==='right'?item.rightBounds:null)||item.bounds||{x:0,y:0,w:item.width,h:item.height};
 const left=x-(item.pivotX??item.width/2)+b.x,top=y-(item.pivotY??item.height)+b.y;
 return point.x>=left-6&&point.x<=left+b.w+6&&point.y>=top-6&&point.y<=top+b.h+8;
}
// Owner 27/10/2026: a piece moves whole cells only; `snap` puts its footprint edges on the cell lines.
export function createPlacementInput({map,item,project,toWorld,getAt,getFacing,getPending,moveAt,snap,rotate,commit,close}){
 let grab=null,disposed=false;
 const tools=el('div',{class:'placement-motion',role:'group','aria-label':'Dịch vị trí trang trí'});
 function nudge(dc,dr){if(getPending()||disposed)return;const at=getAt();if(at)moveAt(snap([at[0]+dc,at[1]+dr]),'nudge');}
 const directions=[[-1,0,'↖','Dịch lên trái'],[0,-1,'↗','Dịch lên phải'],[0,1,'↙','Dịch xuống trái'],[1,0,'↘','Dịch xuống phải']];
 for(const [dc,dr,glyph,label]of directions)tools.append(button(glyph,()=>nudge(dc,dr),{class:'placement-nudge','aria-label':label}));
 function refresh(){for(const b of tools.children)b.disabled=getPending();}
 function onTap(x,y){if(disposed||getPending())return true;const p=toWorld(x,y);if(p)moveAt(snap(worldToGrid(p.x,p.y,map)),'tap');return true;}
 onTap.drag={
  hit(x,y){
   if(disposed||getPending())return false;
   const p=toWorld(x,y),at=getAt();if(!previewHit(p,at,item,getFacing(),project))return false;
   const grid=worldToGrid(p.x,p.y,map);grab=[grid[0]-at[0],grid[1]-at[1]];return true;
  },
  move(x,y){if(!grab||disposed||getPending())return;const p=toWorld(x,y);if(!p)return;const grid=worldToGrid(p.x,p.y,map);moveAt(snap([grid[0]-grab[0],grid[1]-grab[1]]),'drag');},
  end(){grab=null;},cancel(){grab=null;},
 };
 function onKey(e){
  if(disposed||getPending()||e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;
  const moves={ArrowLeft:[-1,1],ArrowRight:[1,-1],ArrowUp:[-1,-1],ArrowDown:[1,1]};
  if(moves[e.key]){e.preventDefault();e.stopPropagation();nudge(...moves[e.key]);}
  else if(e.key.toLowerCase()==='r'){e.preventDefault();e.stopPropagation();rotate();}
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
  else if(e.key==='Enter'&&e.target?.tagName!=='BUTTON'){e.preventDefault();e.stopPropagation();commit();}
 }
 document.addEventListener('keydown',onKey,true);refresh();
 return {tools,onTap,refresh,dispose(){disposed=true;grab=null;document.removeEventListener('keydown',onKey,true);}};
}
