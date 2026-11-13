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

test('dragging a decoration keeps the camera still and a second pointer changes to pinch',()=>{
 const oldDocument=globalThis.document,oldObserver=globalThis.ResizeObserver;
 try{
  const buttons=new Map(),calls={move:0,cancel:0,end:0,pick:0};
  globalThis.document={querySelectorAll:()=>[],getElementById:id=>{if(id==='playDock')return null;if(!buttons.has(id))buttons.set(id,{setAttribute(){}});return buttons.get(id);},addEventListener(){}};
  globalThis.ResizeObserver=class{observe(){}};
  const viewport={clientWidth:800,clientHeight:600,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:0,left:0,width:800,height:600}),setPointerCapture(){},addEventListener(){},classList:{add(){},remove(){}}};
  const drag={hit:()=>true,move(){calls.move++;},cancel(){calls.cancel++;},end(){calls.end++;}};
  const camera=setupCamera({viewport,canvas:{style:{}},map:{width:2560,height:1440,objects:[],props:[]},iso:()=>[0,0],getRenderer:()=>({growthBounds:()=>({left:0,top:0,right:2560,bottom:1440})}),onPick:()=>calls.pick++,getDragTarget:()=>drag});
  camera.overview();camera.zoom(2);const before=viewport.dataset.camera;
  const e=(id,x,y,type='pointermove')=>({pointerId:id,clientX:x,clientY:y,button:0,type});
  viewport.onpointerdown(e(1,200,200,'pointerdown'));viewport.onpointermove(e(1,235,225));
  assert.equal(calls.move,1);assert.equal(viewport.dataset.camera,before);
  viewport.onpointerdown(e(2,300,225,'pointerdown'));viewport.onpointermove(e(2,350,225));
  assert.ok(calls.cancel>0);assert.notEqual(viewport.dataset.camera,before,'pinch still zooms while placing');
  viewport.onpointerup(e(2,350,225,'pointerup'));viewport.onpointerup(e(1,235,225,'pointerup'));
  assert.equal(calls.pick,0,'finishing a pinch never activates the garden underneath');
 }finally{globalThis.document=oldDocument;globalThis.ResizeObserver=oldObserver;}
});

test('overview includes expanded scenery on phones and desktop',()=>{
 const oldDocument=globalThis.document,oldObserver=globalThis.ResizeObserver,asked=[];
 try{
  const buttons=new Map();
  globalThis.document={querySelectorAll:()=>[],getElementById:id=>{if(id==='playDock')return null;if(!buttons.has(id))buttons.set(id,{setAttribute(){}});return buttons.get(id);},addEventListener(){}};
  globalThis.ResizeObserver=class{observe(){}};
  for(const width of [600,1200]){
   const viewport={clientWidth:width,clientHeight:600,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:0,left:0,width,height:600}),setPointerCapture(){},addEventListener(){},classList:{add(){},remove(){}}};
   const b={left:0,top:0,right:2560,bottom:1440};
   setupCamera({viewport,canvas:{style:{}},map:{width:2560,height:1440,objects:[],props:[]},iso:()=>[0,0],getRenderer:()=>({growthBounds:()=>b,fitBounds:narrow=>{asked.push(narrow);return b;}})}).overview();
  }
  assert.ok(asked.length>0&&asked.every(narrow=>narrow===false));
 }finally{globalThis.document=oldDocument;globalThis.ResizeObserver=oldObserver;}
});

test('a garden corner at the map edge can be dragged out from under the dock and the side tools',()=>{
 const oldDocument=globalThis.document,oldObserver=globalThis.ResizeObserver;
 try{
  const width=390,height=844,b={left:0,top:0,right:2560,bottom:1440},button=()=>({onclick:null,setAttribute(){}}),buttons=new Map();
  const el=r=>({hidden:false,getClientRects:()=>[1],getBoundingClientRect:()=>r});
  const hud=el({top:8,bottom:96,left:0,right:width,width}),dock=el({top:height-330,bottom:height-10,left:0,right:width,width}),tools=el({top:200,bottom:400,left:width-60,right:width-10,width:50});
  globalThis.document={querySelectorAll:s=>s.includes('hud')?[hud]:s.includes('playDock')?[dock]:s.includes('camera-tools')?[tools]:[],getElementById:id=>{if(id==='playDock')return dock;if(!buttons.has(id))buttons.set(id,button());return buttons.get(id);},addEventListener(){}};
  globalThis.ResizeObserver=class{observe(){}};
  const viewport={clientWidth:width,clientHeight:height,dataset:{},style:{setProperty(){}},getBoundingClientRect:()=>({top:0,left:0,width,height}),addEventListener(){},classList:{add(){},remove(){}}};
  const camera=setupCamera({viewport,canvas:{style:{}},map:{width:2560,height:1440,plots:[{col:0,row:0}],creatureSpots:[[0,0]],objects:[],props:[]},iso:()=>[0,0],plotCorners:()=>[],getRenderer:()=>({growthBounds:()=>b}),getSelectedPlot:()=>0,notify(){},onPick(){}});
  camera.centerAt(2560,1440,2.4);
  const c=JSON.parse(viewport.dataset.camera);
  assert.ok(1440*c.scale+c.y<=height-330,'bottom edge rises above the tall dock');
  assert.ok(2560*c.scale+c.x<=width-60,'right edge clears the side tools');
  camera.centerAt(0,0,2.4);
  const d=JSON.parse(viewport.dataset.camera);
  assert.ok(d.y>=96&&d.x>=0,'top edge comes down below the HUD');
 }finally{globalThis.document=oldDocument;globalThis.ResizeObserver=oldObserver;}
});
