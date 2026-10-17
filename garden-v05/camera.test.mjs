import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCamera} from './camera.mjs';

test('overview fits the entire active garden and zoom-out stops at that frame',()=>{
 const oldDocument=globalThis.document,oldObserver=globalThis.ResizeObserver;
 try {
  for(const [width,height] of [[320,720],[390,844],[667,375],[1280,720]]){
   const b={left:170,top:70,right:2230,bottom:1240};
   let resize;
   const button=()=>({onclick:null,setAttribute(){}}),buttons=new Map();
   const rect=(top,bottom)=>({top,bottom,left:0,right:width,width,height:bottom-top});
   const hud={hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(8,96)};
   const dock={hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>rect(height-142,height-10)};
   globalThis.document={querySelectorAll:s=>s.includes('hud')?[hud]:s.includes('playDock')?[dock]:[],getElementById:id=>{if(id==='playDock')return dock;if(!buttons.has(id))buttons.set(id,button());return buttons.get(id);},addEventListener(){}};
   globalThis.ResizeObserver=class{constructor(callback){resize=callback;}observe(){}};
   const viewport={clientWidth:width,clientHeight:height,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:0,left:0,width,height}),addEventListener(){},classList:{add(){},remove(){}}};
   const canvas={style:{}};
   const camera=setupCamera({viewport,canvas,map:{width:2560,height:1440,plots:[{col:0,row:0}],creatureSpots:[[0,0]],objects:[],props:[]},iso:()=>[500,500],plotCorners:()=>[],getRenderer:()=>({growthBounds:()=>b}),getSelectedPlot:()=>0,notify(){},onPick(){}});
   camera.overview();
   const initial=JSON.parse(viewport.dataset.camera);
   for(const [x,y] of [[b.left,b.top],[b.right,b.bottom]]){
    assert.ok(x*initial.scale+initial.x>=0&&x*initial.scale+initial.x<=width,'horizontal fit');
    assert.ok(y*initial.scale+initial.y>=96&&y*initial.scale+initial.y<=height-142,'vertical fit');
   }
   camera.zoom(.01);assert.deepEqual(JSON.parse(viewport.dataset.camera),initial,'zoom-out must not shrink below the fitted garden');
   camera.focusPlot(0);assert.deepEqual(JSON.parse(viewport.dataset.camera),initial,'selection keeps the overview');
   camera.focusCreature(0);assert.deepEqual(JSON.parse(viewport.dataset.camera),initial,'creature selection keeps overview');
   camera.zoom(1.25);assert.ok(JSON.parse(viewport.dataset.camera).scale>initial.scale,'explicit zoom-in remains available');
   camera.overview();resize();viewport.clientWidth+=40;resize();
   assert.ok(Number.isFinite(JSON.parse(viewport.dataset.camera).scale));
  }
 } finally {globalThis.document=oldDocument;globalThis.ResizeObserver=oldObserver;}
});
