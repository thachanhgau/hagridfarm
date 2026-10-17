// Low, native pixel-art habitat details. Paint the whole layer below actors.
const styles={
 clear:{ground:'#777044',shade:'#4a3c2c',grass:'#71934b',wood:'#8b4a3f',cap:'#b49a66',dark:'#4a3c2c',stone:'#777044',water:'#687486',hay:'#b49a66',moss:'#3f6a45'},
 rain:{ground:'#5d6046',shade:'#24483f',grass:'#777044',wood:'#735044',cap:'#b49a66',dark:'#24483f',stone:'#687486',water:'#70a8b6',hay:'#b49a66',moss:'#3f6a45'},
 autumn:{ground:'#777044',shade:'#4a3c2c',grass:'#a57554',wood:'#a57554',cap:'#b49a66',dark:'#4a3c2c',stone:'#777044',water:'#687486',hay:'#e7ae73',moss:'#777044'},
 snow:{ground:'#e8f0ed',shade:'#a6b1ae',grass:'#d6d8bf',wood:'#777044',cap:'#e8f0ed',dark:'#5d6046',stone:'#687486',water:'#b7dee0',hay:'#b49a66',moss:'#a6b1ae'},
};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function line(c,a,b,color,width=2){const n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))));for(let i=0;i<=n;i++){const p=mix(a,b,i/n);rect(c,p[0]-width/2,p[1]-width/2,width,width,color);}}
function diamond(c,points,color){
 const min=Math.ceil(Math.min(...points.map(p=>p[1]))),max=Math.floor(Math.max(...points.map(p=>p[1])));
 for(let y=min;y<=max;y++){
  const xs=[];for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
  if(xs.length>=2)rect(c,Math.min(...xs),y,Math.max(...xs)-Math.min(...xs),1,color);
 }
}
export function penDetailAnchors(pen,iso){
 return {water:iso(pen.col+pen.width*.55,pen.row+pen.height*.22),straw:iso(pen.col+pen.width*.52,pen.row+pen.height*.77),gate:iso(pen.col,pen.row+pen.height*.5)};
}
export function drawPenHabitat(c,{corners,pen,iso,weatherMode='clear',personalized=false}){
 const p=styles[weatherMode]||styles.clear;const [n,e,s,w]=corners;
 c.save();c.imageSmoothingEnabled=false;
 diamond(c,corners,p.ground);
 // Small turf flecks; no tall grass, objects or opaque overlay above a creature.
 for(let r=1;r<9;r++)for(let q=1;q<14;q++){
  const xy=iso(pen.col+pen.width*q/14,pen.row+pen.height*r/9),seed=q*17+r*13;
  rect(c,xy[0],xy[1],2+seed%3,1,seed%3?p.grass:p.shade);
 }
 for(const [i,a,b] of [[0,n,e],[1,e,s],[2,s,w],[3,w,n]]){
  const segments=i===3?[[0,.37],[.63,1]]:[[0,1]]; // Open entrance faces the path.
  for(const [from,to] of segments){
   const x=mix(a,b,from),y=mix(a,b,to);
   line(c,[x[0],x[1]+3],[y[0],y[1]+3],p.dark,5);
   line(c,x,y,i%2?p.stone:p.wood,4);line(c,[x[0],x[1]-1],[y[0],y[1]-1],p.cap,1);
   const length=Math.hypot(y[0]-x[0],y[1]-x[1]);
   for(let t=18;t<length;t+=20){const joint=mix(x,y,t/length);rect(c,joint[0],joint[1],2,3,p.dark);}
  }
 }
 // Rear posts are a mere 12px high, and remain underneath all actor sprites.
 for(const at of [n,e,w]){rect(c,at[0]-3,at[1]-11,6,12,p.dark);rect(c,at[0]-2,at[1]-10,3,10,p.wood);rect(c,at[0]-3,at[1]-12,6,2,p.cap);}
 const {water,straw,gate}=penDetailAnchors(pen,iso);
 // Low trough and bedding in the empty middle, between the two animal anchors.
 if(!personalized){
 rect(c,water[0]-11,water[1]-3,22,7,p.dark);rect(c,water[0]-9,water[1]-5,18,7,p.stone);rect(c,water[0]-7,water[1]-4,14,4,p.water);rect(c,water[0]-5,water[1]-4,6,1,'#d6d8bf');
 for(let i=0;i<18;i++){const dx=(i*13)%31-15,dy=(i*7)%11-5;rect(c,straw[0]+dx,straw[1]+dy,4+i%4,1,i%4?p.hay:p.wood);}
 }
 for(const off of [-6,4]){rect(c,gate[0]+off,gate[1]+off*.5,7,3,p.stone);rect(c,gate[0]+off,gate[1]+off*.5,6,1,p.cap);}
 for(const t of [.24,.76]){const a=mix(n,e,t);rect(c,a[0]+3,a[1]-2,5,2,p.moss);rect(c,a[0]+5,a[1]-4,2,3,p.grass);}
 c.restore();return {gate,water,straw};
}
