import {createGarden,iso} from './scene-renderer.mjs?v=24.5';
import {newGame} from './game-engine.mjs';
(async () => {
'use strict';
const $=id=>document.getElementById(id),data=window.FARM_MOTION;
const stage=$('motionCanvas'),ctx=stage.getContext('2d'),garden=$('gardenCanvas');
const images=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let species=0,clipName='idle',position=0,playing=false,speed=1,elapsed=0,last=0,clock=0,loops=0,onion=false,grid=false,occlusion=true;
let loaded=false,scenePosition='lawn';
const item=()=>data.items[species],clip=()=>item().clips[clipName],frame=()=>item().frames[clip().frames[position]];
const plots=Array.from({length:6},(_,i)=>iso(5,6));
const sceneRenderer=await createGarden(garden),sceneState=newGame(Date.now());
function load(file){if(images.has(file))return Promise.resolve(images.get(file));return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(file,im);resolve(im);};im.onerror=()=>reject(Error('Không tải được '+file));im.src=file;});}
function controls(){const end=!clip().loop&&position===clip().frames.length-1;$('playButton').textContent=end?'↻ Phát lại':playing?'❚❚ Tạm dừng':'▶ Phát';$('nextButton').disabled=end;$('nextButton').textContent=end?'Đã trưởng thành':'Bước frame';$('playButton').disabled=!loaded;}
function reset(){position=0;elapsed=0;loops=0;last=performance.now();playing=loaded&&!reduced;controls();render();}
function step(){if(position<clip().frames.length-1)position++;else if(clip().loop){position=0;loops++;}if(!clip().loop&&position===clip().frames.length-1)playing=false;elapsed=0;controls();render();}
function info(){const a=item();$('itemTitle').textContent=a.label;$('notesList').replaceChildren(...a.notes.map(t=>{const l=document.createElement('li');l.textContent=t;return l;}));$('unlockNote').hidden=!a.unlock;$('sourceLink').href=a.source;$('originalLink').href=a.originalSource;$('status').textContent=`${a.label} · PNG 1× đã tải`;$('speciesSelect').value=String(species);}
function drawFrame(c,it,index,x,y){const f=it.frames[index],im=images.get(f.file);if(im)c.drawImage(im,Math.round(x-f.pivotX),Math.round(y-f.pivotY));}
function sceneAnchor(){return item().kind==='crop'?plots[species]:scenePosition==='behind'?iso(11.8,12.8):scenePosition==='front'?iso(12.3,13.3):iso(12,7);}
function drawGarden(){sceneRenderer.render(sceneState,{clock,propsVisible:occlusion,grid,selectedPlot:-1,line:[],qaActor:{species:item().id,frame:clip().frames[position],position:scenePosition,...(item().kind==='crop'?{col:5,row:6}:{})}});$('sceneCaption').textContent=`${item().label} · tilemap 64 × 32 · lớp vật thể độc lập · thứ tự theo chân sprite`;}
function render(){if(!data?.items.length)return;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,256,256);ctx.fillStyle='#a57554';ctx.fillRect(119,200,19,1);ctx.fillRect(128,191,1,19);
 if(onion&&position>0){ctx.globalAlpha=.25;drawFrame(ctx,item(),clip().frames[position-1],128,200);ctx.globalAlpha=1;}
 drawFrame(ctx,item(),clip().frames[position],128,200);
 const f=frame();$('frameReadout').textContent=`Frame nguồn ${f.sourceFrame+1}/12 · clip ${position+1}/${clip().frames.length} · ${f.width} × ${f.height}px · pivot ${f.pivotX},${f.pivotY}`;
 $('growthReadout').textContent=clipName==='growth'?item().growth[position]:item().actionLabel;
 $('nativeLink').href=f.file;$('sheetImage').src=clip().sheet?.file||f.file;
 drawGarden();
}
function resize(){const n=Math.max(1,Math.min(2,Math.floor($('stageWrap').clientWidth/256)));stage.style.width=256*n+'px';stage.style.height=256*n+'px';$('scaleReadout').textContent=`Zoom ${n}× nguyên · neo sân khấu 128,200 · alpha cứng`;}
function focus(){const xy=sceneAnchor(),z=Number($('sceneZoom').value),v=$('sceneViewport');v.scrollLeft=Math.max(0,xy[0]*z-v.clientWidth/2);v.scrollTop=Math.max(0,xy[1]*z-v.clientHeight/2);}
data.items.forEach((it,i)=>{const o=document.createElement('option');o.value=i;o.textContent=it.label;$('speciesSelect').append(o);});
data.palette.forEach(p=>{const s=document.createElement('span');s.className='swatch';s.style.background=p;s.title=p;$('palette').append(s);});
$('speciesSelect').onchange=e=>{species=Number(e.target.value);clipName=$('clipSelect').value;info();reset();focus();};
$('clipSelect').onchange=e=>{clipName=e.target.value;reset();};
$('playButton').onclick=()=>{if(!clip().loop&&position===clip().frames.length-1){position=0;loops=0;elapsed=0;playing=true;}else playing=!playing;last=performance.now();controls();render();};
$('nextButton').onclick=()=>{playing=false;step();};$('restartButton').onclick=()=>{reset();playing=false;controls();};
$('speedSelect').onchange=e=>speed=Number(e.target.value);
$('backgroundButton').onclick=()=>{const dark=$('stageWrap').classList.toggle('dark');$('backgroundButton').textContent=dark?'Nền sáng':'Nền tối';$('backgroundButton').setAttribute('aria-pressed',dark);};
$('onionButton').onclick=()=>{onion=!onion;$('onionButton').setAttribute('aria-pressed',onion);render();};
$('positionSelect').onchange=e=>{scenePosition=e.target.value;render();focus();};
$('gridButton').onclick=()=>{grid=!grid;$('gridButton').setAttribute('aria-pressed',grid);render();};
$('occlusionButton').onclick=()=>{occlusion=!occlusion;$('occlusionButton').setAttribute('aria-pressed',occlusion);$('occlusionButton').textContent=occlusion?'Cảnh vật bật':'Cảnh vật tắt';render();};
$('sceneZoom').onchange=e=>{const n=Number(e.target.value);garden.style.width=1152*n+'px';garden.style.height=720*n+'px';focus();};$('focusButton').onclick=focus;
new ResizeObserver(resize).observe($('stageWrap'));resize();
function tick(now){const dt=last?Math.min(now-last,100):0;last=now;if(playing&&!document.hidden){elapsed+=dt*speed;clock+=dt*speed;if(elapsed>=clip().durations[position])step();else drawGarden();}requestAnimationFrame(tick);}
// Read-only diagnostics used by browser evidence; controls remain the only mutation API.
window.motionState=()=>({species:item().id,clip:clipName,position,playing,loops,elapsed,loaded,frame:frame(),sceneAnchor:sceneAnchor(),occlusion,scenePosition});
Promise.all(data.items.flatMap(it=>it.frames.map(f=>load(f.file)))).then(()=>{loaded=true;info();reset();requestAnimationFrame(tick);}).catch(e=>{$('error').textContent=e.message;controls();});
})();
