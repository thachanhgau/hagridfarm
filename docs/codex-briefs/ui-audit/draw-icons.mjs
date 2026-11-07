// Pixel-authored icons. No generated portrait images or game code involved.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const icons={};let a;
const blank=()=>a=Array.from({length:16},()=>Array(16).fill('.'));
const pixel=(x,y,c)=>{if(x>=0&&x<16&&y>=0&&y<16)a[y][x]=c;};
function rect(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)pixel(i,j,c);}
function poly(points,c){for(let y=0;y<16;y++)for(let x=0;x<16;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y+.5)!==(yj>y+.5)&&x+.5<(xj-xi)*(y+.5-yi)/(yj-yi)+xi)inside=!inside;}if(inside)pixel(x,y,c);}}
function oval(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(((i+.5-x-w/2)/(w/2))**2+((j+.5-y-h/2)/(h/2))**2<=1)pixel(i,j,c);}
const save=id=>{icons[id]=a.map(r=>r.join(''));assert.equal(icons[id].length,16);assert(icons[id].every(r=>r.length===16&&/^[.kp bws glcGmnyrotuPROYivaq]+$/.test(r)));};
const starShape=[[8,1],[10,5],[15,5],[12,9],[13,14],[8,11],[3,14],[4,9],[1,5],[6,5]];
blank();poly(starShape,'k');poly([[8,3],[9,6],[13,6],[10,9],[11,12],[8,10],[5,12],[6,9],[3,6],[7,6]],'Y');rect(7,4,1,5,'u');pixel(10,9,'O');save('star');
blank();poly(starShape,'k');poly([[8,3],[9,6],[13,6],[10,9],[11,12],[8,10],[5,12],[6,9],[3,6],[7,6]],'.');save('star_empty');
blank();poly([[3,3],[6,3],[8,5],[10,3],[13,3],[15,5],[15,8],[8,15],[1,8],[1,5]],'k');poly([[3,5],[5,4],[8,7],[11,4],[13,5],[13,8],[8,13],[3,8]],'.');save('heart_empty');
blank();poly([[4,8],[12,8],[13,15],[8,13],[3,15]],'k');poly([[5,9],[11,9],[11,13],[8,11],[5,13]],'m');rect(5,12,1,2,'Y');rect(10,12,1,2,'Y');poly([[8,1],[10,4],[14,5],[11,8],[12,12],[8,10],[4,12],[5,8],[2,5],[6,4]],'k');poly([[8,3],[9,5],[12,6],[9,8],[10,10],[8,9],[6,10],[7,7],[4,6],[7,5]],'Y');rect(7,4,1,4,'u');save('tansuc');
blank();oval(3,1,10,11,'k');oval(4,2,8,9,'w');oval(5,3,6,8,'.');rect(1,6,14,3,'k');rect(2,7,12,1,'t');poly([[2,9],[14,9],[12,15],[4,15]],'k');poly([[3,9],[13,9],[11,14],[5,14]],'w');rect(4,10,8,1,'t');rect(5,12,6,1,'b');rect(5,9,1,5,'o');rect(9,9,1,5,'t');save('work');
blank();rect(2,1,11,14,'k');rect(3,2,9,11,'G');rect(3,13,10,1,'c');rect(3,2,1,11,'m');rect(5,4,5,1,'y');rect(5,6,4,1,'y');oval(7,8,8,7,'k');oval(8,9,6,5,'Y');rect(10,9,1,4,'b');rect(9,10,3,1,'b');pixel(11,12,'O');save('acp');
blank();poly([[4,10],[11,10],[13,15],[8,13],[3,15]],'k');poly([[5,10],[10,10],[11,13],[8,12],[5,13]],'P');oval(1,1,14,13,'k');oval(2,2,12,11,'P');oval(3,3,9,8,'R');rect(5,3,3,1,'t');poly([[8,4],[9,6],[11,7],[9,8],[8,11],[7,8],[5,7],[7,6]],'P');pixel(7,6,'o');save('seal');
function portrait(){blank();oval(1,1,14,14,'k');oval(2,2,12,12,'Y');oval(3,3,10,10,'b');}
portrait();oval(3,2,10,11,'p');oval(5,4,6,7,'t');rect(4,3,7,3,'b');rect(5,6,1,1,'k');rect(9,6,1,1,'k');rect(7,7,2,2,'o');poly([[4,7],[6,9],[9,9],[12,7],[11,12],[8,14],[5,12]],'b');rect(6,10,4,1,'w');pixel(7,9,'k');pixel(8,9,'k');save('guest_hagrid');
portrait();poly([[7,0],[9,1],[11,6],[14,7],[14,9],[2,9],[2,7],[5,6]],'k');poly([[7,2],[8,2],[10,6],[5,6]],'m');rect(7,4,2,2,'w');pixel(8,4,'t');rect(4,6,8,1,'b');rect(3,7,10,1,'m');rect(5,9,6,4,'t');rect(4,9,1,4,'l');rect(11,9,1,4,'l');pixel(6,10,'k');pixel(9,10,'k');rect(7,12,2,1,'o');save('guest_sprout');
portrait();rect(5,3,6,3,'w');pixel(4,4,'w');rect(5,6,6,4,'t');pixel(6,7,'k');pixel(9,7,'k');rect(7,9,2,1,'o');poly([[4,10],[7,10],[8,12],[9,10],[11,10],[13,14],[3,14]],'a');rect(9,11,5,4,'k');rect(10,12,3,2,'w');pixel(11,12,'t');rect(10,10,3,1,'k');pixel(12,14,'b');save('guest_newt');
portrait();poly([[4,4],[5,2],[9,2],[12,4],[11,7],[5,7]],'R');rect(5,5,6,5,'t');rect(4,4,7,2,'O');pixel(6,7,'k');pixel(9,7,'k');rect(7,9,2,1,'o');rect(4,10,8,4,'G');poly([[10,8],[12,7],[13,9],[14,10],[13,14],[9,14],[9,11]],'k');rect(10,10,3,3,'w');rect(11,8,1,3,'t');pixel(12,12,'b');save('guest_charlie');
assert.equal(Object.keys(icons).length,11);
await fs.writeFile('docs/codex-briefs/ui-audit/pixel-icons-new.mjs','// 16×16, INK keys from garden-v05/pixel-icons.mjs; sprite24 only.\nexport const NEW_ICONS = {\n'+Object.entries(icons).map(([id,rows])=>` ${id}: [\n${rows.map(r=>`  '${r}',`).join('\n')}\n ],`).join('\n')+'\n};\n');
console.log('Authored 11 grids; all 16×16.');
