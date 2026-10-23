import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runtimeImageUrl,WEBP_REVISION} from './runtime-image-url.mjs';

test('published PNG art loads its versioned WebP counterpart, including both decoration views',()=>{
 for(const path of ['native/three-headed-dog/frame-16.png','native-items/decoration-3_right.png','decor-assets/native/decor_pumpkin_lantern.png','world-v242/cottage-corner.png']){
  const url=runtimeImageUrl(path+'?v=old');
  assert.equal(url,`runtime-webp/${path.replace(/\.png$/,'.webp')}?v=${WEBP_REVISION}`);
  assert.ok(fs.existsSync(new URL(url.split('?')[0],import.meta.url)),url);
  assert.equal(runtimeImageUrl(url),url);
 }
});
test('remote avatars, authored masters, SVG/data/blob images and existing WebP keep their URL',()=>{
 for(const path of ['https://example.test/avatar.png','masters/three-headed-dog.png','data:image/png;base64,abc','blob:local-image','v24-art/weather-clear.webp','icon.svg',null])assert.equal(runtimeImageUrl(path),path);
});
test('every converted image has a WebP container and its original source remains available',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('./runtime-webp-manifest.json',import.meta.url)));
 assert.ok(manifest.images.length>0);assert.equal(manifest.images.length,manifest.totals.converted);
 for(const image of manifest.images){
  assert.equal(runtimeImageUrl(image.source).split('?')[0],image.file);
  assert.ok(fs.existsSync(new URL(image.source,import.meta.url)),image.source);
  const bytes=fs.readFileSync(new URL(image.file,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 }
});
