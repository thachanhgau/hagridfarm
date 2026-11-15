// Measure actual raster contact edges; do not derive measured points from expected guide vertices.
import fs from 'node:fs/promises';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),sharp=require('/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
export function pixelAxisError(points,expectedSlope){
 if(points.length<2)throw new Error('An axis needs measured pixels');
 const residuals=points.map(([x,y])=>y-expectedSlope*x),lo=Math.min(...residuals),hi=Math.max(...residuals);
 return {axisIntercept:(lo+hi)/2,maxPixelError:(hi-lo)/2};
}
export async function auditNativeAxes(ids){
const source=JSON.parse(await fs.readFile(new URL('noel-50-assets/manifest.json',import.meta.url)));
if(!ids.length)ids.push('nx_hagrid_gift_crate');
const rows=[];
for(const id of ids){const item=source.items.find(i=>i.id===id);if(!item)throw Error(id);
 for(const[index,frame]of item.frames.entries()){
  const {data,info}=await sharp(new URL(frame.file,import.meta.url).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const boundary=[];for(let x=0;x<info.width;x++){let y=-1;for(let r=0;r<info.height;r++)if(data[(r*info.width+x)*4+3])y=r;if(y>=0)boundary.push([x,y]);}
  const y=Math.max(...boundary.map(p=>p[1])),front=boundary.filter(p=>p[1]===y),fx=front.reduce((s,p)=>s+p[0],0)/front.length;
  const sides=[boundary.filter(p=>p[0]>boundary[0][0]+4&&p[0]<fx-4),boundary.filter(p=>p[0]>fx+4&&p[0]<boundary.at(-1)[0]-4)];
  const edges=sides.map((points,i)=>{if(points.length<6)throw Error(id+': not enough actual boundary pixels for edge');const mx=points.reduce((s,p)=>s+p[0],0)/points.length,my=points.reduce((s,p)=>s+p[1],0)/points.length,slope=points.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/points.reduce((s,p)=>s+(p[0]-mx)**2,0),span=points.at(-1)[0]-points[0][0],error=Math.abs(slope-(i===0?.5:-.5))*span,expectedSlope=i===0?.5:-.5,measurement=pixelAxisError(points,expectedSlope);return{actualPixels:points,slope,expectedSlope,endError:error,...measurement,passed:measurement.maxPixelError<=1};});
  rows.push({id,frame:index,facing:index<2?'default':'right',file:frame.file,edges,passed:edges.every(e=>e.passed)});
 }
}
const report={method:'maximum actual pixel residual to the exact ±0.5 axis line, excluding 4px corner caps; fitted-slope end error retained as diagnostic only; hard rectangular base edges only',toleranceNativePixels:1,rows};
await fs.writeFile(new URL('../docs/noel-native-axis-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(rows.map(r=>({id:r.id,frame:r.frame,errors:r.edges.map(e=>+e.maxPixelError.toFixed(3)),passed:r.passed}))));
return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=await auditNativeAxes(process.argv.slice(2));if(report.rows.some(r=>!r.passed))process.exitCode=1;}
