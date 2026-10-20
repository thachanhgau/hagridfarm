import {GARDEN_STAGES,stageWorldBounds} from './garden-growth.mjs?v=24.9.55';
import {createGarden} from './scene-renderer.mjs?v=24.9.55';
import * as E from './progression-engine.mjs';
const $=id=>document.getElementById(id),canvas=$('stageCanvas'),viewport=$('stageViewport'),scene=window.FARM_SCENE;
let renderer,state,index=0;
for(const [i,stage] of GARDEN_STAGES.entries()){
 const b=document.createElement('button');b.type='button';b.textContent='Cấp '+stage.level;const small=document.createElement('small');small.textContent=stage.name;b.append(small);b.onclick=()=>show(i);document.querySelector('.steps').append(b);
}
function fit(){if(!renderer)return;const stage=$('sameScale').checked?GARDEN_STAGES.at(-1):GARDEN_STAGES[index],b=stageWorldBounds(scene,stage),scale=Math.min((viewport.clientWidth-24)/(b.right-b.left),(viewport.clientHeight-24)/(b.bottom-b.top));canvas.style.transform=`translate(${(viewport.clientWidth-(b.left+b.right)*scale)/2}px,${(viewport.clientHeight-(b.top+b.bottom)*scale)/2}px) scale(${scale})`;}
function show(i){index=i;const stage=GARDEN_STAGES[i],now=Date.now();state=E.testProfile(stage.level,now);if(stage.level===100){state=E.build(state,'plot_12',now);state=E.claimBuildings(state,now+25*3600000);}document.querySelectorAll('.steps button').forEach((b,j)=>b.setAttribute('aria-pressed',i===j));$('stageName').textContent=(i+1)+'/6 · '+stage.name;$('stageDescription').textContent=stage.description;$('stageStats').textContent=state.plots.length+' thửa · '+state.built.filter(id=>id.startsWith('pen_')).length+' chuồng';if(renderer){renderer.render(state,{clock:0,now,propsVisible:true,selectedPlot:-1});fit();}}
$('sameScale').onchange=fit;new ResizeObserver(fit).observe(viewport);show(0);
fetch('./decor-assets-manifest.json').then(r=>r.json()).then(manifest=>createGarden(canvas,{decorAssets:manifest.items})).then(r=>{renderer=r;show(0);}).catch(e=>{$('stageDescription').textContent='Không tải được cảnh: '+e.message;console.error(e);});
