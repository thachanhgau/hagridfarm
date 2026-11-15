import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
// /game/** is cached for an hour: a module or JSON fetched without the release stamp keeps running last release's code
// (Hagrid 21/10, Vua Đầu Bếp 26/10/2026). Walks index.html's graph like scripts/sync-hagrid-garden.mjs in HPVNN.
test('every module, style and JSON the page loads carries the release stamp shown in the title',()=>{
 const read=f=>fs.readFileSync(new URL('./'+f,import.meta.url),'utf8');
 const html=read('index.html'),version=/<title>Khu Vườn Hagrid · V([\d.]+)<\/title>/.exec(html)?.[1];
 assert.ok(version,'title carries the version');
 const seen=new Set(),bad=[];
 const visit=file=>{
  if(seen.has(file))return;seen.add(file);const text=read(file);
  const refs=file.endsWith('.html')?[...text.matchAll(/\b(?:src|href)="([\w./-]+\.(?:m?js|css))(\?[^"]*)?"/g)]:[...text.matchAll(/['"](\.\/[\w./-]+\.(?:m?js|json))(\?[^'"]*)?['"]/g)];
  for(const [,ref,query] of refs){
   // index.html tags left bare are hash-stamped by the HPVNN sync (stampAssetVersions); everything else needs the release stamp.
   if(query!==`?v=${version}`&&!(file==='index.html'&&!query))bad.push(`${file} → ${ref}${query||''}`);
   visit(ref.replace(/^\.\//,''));
  }
 };
 visit('index.html');
 assert.ok(seen.size>100,`walked ${seen.size} files`);
 assert.deepEqual(bad,[]);
});
