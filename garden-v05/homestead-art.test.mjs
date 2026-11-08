import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import scene from './scene-data.json' with {type:'json'};
test('browser cottage canvas and anchor match the authored scene and preserve its logical position',async()=>{
 const window={};vm.runInNewContext(await fs.readFile(new URL('scene-data.js',import.meta.url),'utf8'),{window});
 const hut=window.FARM_SCENE.props.find(p=>p.id==='hut');
 assert.equal(JSON.stringify(hut),JSON.stringify(scene.props.find(p=>p.id==='hut')));
 assert.deepEqual([hut.width,hut.height,hut.pivotX,hut.pivotY],[256,224,128,216]);
 assert.deepEqual(JSON.parse(JSON.stringify(window.FARM_SCENE.objects.find(p=>p.id==='hut'))),{id:'hut',col:0,row:4});
});
