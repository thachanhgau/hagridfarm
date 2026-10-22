import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const execFileAsync=promisify(execFile);
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const here=path.dirname(fileURLToPath(import.meta.url));

function frame(index){
  const row=Math.floor(index/4), col=index%4;
  const left=col*32+4, top=row*32+4;
  return {x:left,y:top,w:16,h:16,pivotX:8,pivotY:16,sourceCell:[col*32,row*32,(col+1)*32,(row+1)*32]};
}

test('scoped white dog export preserves other records and emits eat/care from rows 3/4', async()=>{
  const analyzer=await fs.readFile(path.join(here,'analyze-sources.py'),'utf8');
  assert.match(analyzer,/--only=three-headed-dog/);
  assert.match(analyzer,/rows = 4 if item\['id'\] == TARGET_ID/);
  assert.match(analyzer,/TARGET_WHITE_MASTER = 'masters\/three-headed-dog-white-v01\.png'/);
  assert.match(analyzer,/'three-headed-dog':'three-headed-dog-white-v01\.png'/);

  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'garden-dog-pipeline-'));
  try{
    await fs.mkdir(path.join(temp,'masters'),{recursive:true});
    const pixels=Buffer.alloc(128*128*4);
    for(let i=0;i<16;i++){
      const f=frame(i);
      for(let y=f.y;y<f.y+f.h;y++) for(let x=f.x;x<f.x+f.w;x++){
        const p=(y*128+x)*4;
        pixels[p]=i+1; pixels[p+1]=96; pixels[p+2]=160; pixels[p+3]=255;
      }
    }
    await sharp(pixels,{raw:{width:128,height:128,channels:4}})
      .png().toFile(path.join(temp,'masters/three-headed-dog-white-v01.png'));

    const dogId='three-headed-dog';
    const dogSource={
      id:dogId,label:'Bạch Tam Đầu',kind:'creature',growth:['Gieo','Nở','Lớn','Trưởng thành'],
      actionLabel:'Tam đầu chăm sóc',file:'masters/three-headed-dog-white-v01.png',
      originalFile:'masters/three-headed-dog.png',width:128,height:128,sourceRows:4,sourceColumns:4,
      sourceSha256:'fixture',frames:Array.from({length:16},(_,i)=>frame(i))
    };
    await fs.writeFile(path.join(temp,'source-data.json'),JSON.stringify({items:[dogSource]},null,2));
    const sentinel={id:'sentinel',frames:[{file:'native/sentinel/frame-01.png'}],clips:{idle:{frames:[0]}},keep:'exact'};
    const oldDog={id:dogId,frames:[{file:'native/three-headed-dog/frame-01.png'}],clips:{action:{frames:[8]}}};
    await fs.writeFile(path.join(temp,'motion-data.json'),JSON.stringify({version:3,items:[sentinel,oldDog],keep:'top-level'}));
    const sentinelReport={id:'sentinel',frames:1,custom:'exact'};
    await fs.writeFile(path.join(temp,'native-build-report.json'),JSON.stringify([sentinelReport,{id:dogId,frames:12}]));
    await fs.copyFile(path.join(here,'build-native.mjs'),path.join(temp,'build-native.mjs'));

    await execFileAsync(process.execPath,['build-native.mjs','--only=three-headed-dog'],{
      cwd:temp,env:{...process.env,SHARP_MODULE:process.env.SHARP_MODULE || '/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'}
    });

    const motion=JSON.parse(await fs.readFile(path.join(temp,'motion-data.json'),'utf8'));
    const report=JSON.parse(await fs.readFile(path.join(temp,'native-build-report.json'),'utf8'));
    assert.deepEqual(motion.items.map(item=>item.id),['sentinel',dogId]);
    assert.deepEqual(motion.items.find(item=>item.id==='sentinel'),sentinel);
    assert.equal(motion.keep,'top-level');
    assert.deepEqual(report.find(item=>item.id==='sentinel'),sentinelReport);
    const dog=motion.items.find(item=>item.id===dogId);
    assert.ok(dog);
    assert.equal(dog.frames.length,16);
    assert.deepEqual(dog.clips.action.frames,[8,9,10,11,10,9]);
    assert.deepEqual(dog.clips.action.durations,[320,180,240,220,240,180]);
    assert.deepEqual(dog.clips.eat.frames,[8,9,10,11]);
    assert.deepEqual(dog.clips.eat.durations,[300,420,340,820]);
    assert.deepEqual(dog.clips.care.frames,[12,13,14,15]);
    assert.deepEqual(dog.clips.care.durations,[260,620,260,820]);
    assert.equal(dog.clips.eat.sheet.file,'native/three-headed-dog/eat.png');
    assert.equal(dog.clips.care.sheet.file,'native/three-headed-dog/care.png');
    for(let i=1;i<=16;i++) await fs.access(path.join(temp,'native/three-headed-dog',`frame-${String(i).padStart(2,'0')}.png`));
    await fs.access(path.join(temp,'native/three-headed-dog/eat.png'));
    await fs.access(path.join(temp,'native/three-headed-dog/care.png'));
    await assert.rejects(fs.access(path.join(temp,'environment/garden-native.png')));
  }finally{
    await fs.rm(temp,{recursive:true,force:true});
  }
});
