// Maximum vertical raster residual from an axis-parallel line, in native pixels.
// This matches the existing Noel native-axis audit's one-pixel tolerance.
// The fitted offset permits translation/elevation, never a camera-angle change.
export function axisLineEvidence(points,axis,density=1){
 if(!['column','row'].includes(axis)||!Number.isFinite(density)||density<=0||points.length<8)throw Error('Insufficient observed axis evidence');
 const slope=axis==='column'?.5:-.5,offsets=points.map(([x,y])=>y-slope*x),low=Math.min(...offsets),high=Math.max(...offsets),intercept=(low+high)/2,span=(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])))/density;
 return {axis,slope,intercept,span,maxDistance:(high-low)/2/density,samples:points.length};
}
export function circularFrontEvidence(points,diameter,density=1){
 if(points.length<8||diameter[1]<=diameter[0])throw Error('Insufficient observed circular contour');
 const cx=(diameter[0]+diameter[1])/2,r=(diameter[1]-diameter[0])/2,offsets=points.map(([x,y])=>y-Math.sqrt(Math.max(0,r*r-(x-cx)**2))/2),low=Math.min(...offsets),high=Math.max(...offsets);
 return {centerX:cx,centerY:(low+high)/2,radius:r,density,maxDistance:(high-low)/2/density,samples:points.length};
}
