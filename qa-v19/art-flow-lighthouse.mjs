// Mobile fixture measurements only; all network traffic is fulfilled from local files.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const game=path.resolve(process.argv[2]||path.join(root,'garden-v05'));
const output=path.resolve(process.argv[3]||path.join(root,'qa-v19/art-flow-lighthouse.json'));
const dependencies=process.env.HAGRID_LIGHTHOUSE_NODE_MODULES||'/Users/thachanh/.npm/_npx/0f94ee7615faf582/node_modules';
const {default:lighthouse}=await import(pathToFileURL(path.join(dependencies,'lighthouse/core/index.js')));
const {default:puppeteer}=await import(pathToFileURL(path.join(dependencies,'puppeteer-core/lib/puppeteer/puppeteer-core.js')));
const origin='http://127.0.0.1:3026',runs=[];
for(let run=0;run<3;run++){
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--disable-background-networking']});
 const page=await browser.newPage();let bytes=0;const errors=[];
 try{
  await page.setRequestInterception(true);
  page.on('request',async request=>{
   if(request.isInterceptResolutionHandled())return;
   const url=new URL(request.url());if(['data:','blob:'].includes(url.protocol))return request.continue();
   if(url.origin!==origin){errors.push('external request '+url.href);return request.abort();}
   const pathname=decodeURIComponent(url.pathname);let file;
   try{
    let body,contentType;
    if(pathname==='/qa-v19/ui-fixture.html'){
     body=Buffer.from((await fs.readFile(path.join(game,'index.html'),'utf8')).replace('<html lang="vi">','<html lang="vi" data-wallet="fixture">').replace('<head>','<head><base href="/garden-v05/">'));
     contentType='text/html';
    }else{
     file=pathname.startsWith('/garden-v05/')?path.resolve(game,pathname.slice(12)):path.resolve(root,pathname.slice(1));
     if(!file.startsWith(game+path.sep)&&!file.startsWith(path.join(root,'qa-v19')+path.sep))throw Error('unsafe fixture path');
     body=await fs.readFile(file);contentType={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)];
    }
    bytes+=body.length;await request.respond({status:200,body,contentType,headers:{'Access-Control-Allow-Origin':'*'}});
   }catch(error){errors.push(pathname+': '+error.message);await request.respond({status:404,body:'missing'});}
  });
  const result=await lighthouse(origin+'/qa-v19/ui-fixture.html?wallet=emulator&qa=1&level=500&scenario=habitats&view=overview&simulate=1',{onlyCategories:['performance'],formFactor:'mobile',throttlingMethod:'simulate',disableStorageReset:true,screenEmulation:{mobile:true,width:375,height:812,deviceScaleFactor:1,disabled:false},logLevel:'error'},undefined,page);
  if(errors.length)throw Error(errors.join('\n'));if(result.lhr.runtimeError)throw Error(JSON.stringify(result.lhr.runtimeError));
  const audits=result.lhr.audits;
  const record={performance:Math.round(result.lhr.categories.performance.score*100),fcpMs:audits['first-contentful-paint'].numericValue,lcpMs:audits['largest-contentful-paint'].numericValue,tbtMs:audits['total-blocking-time'].numericValue,bytes};
  runs.push(record);console.log(JSON.stringify({run:run+1,...record}));
 }finally{await browser.close();}
}
const median=key=>runs.map(r=>r[key]).sort((a,b)=>a-b)[1];
await fs.writeFile(output,JSON.stringify({tool:'Lighthouse13.5.0',scope:'local intercepted level500 fixture,375px mobile simulated throttling; no server/Firebase/real wallet',game,runs,median:Object.fromEntries(Object.keys(runs[0]).map(k=>[k,median(k)]))},null,2)+'\n');
