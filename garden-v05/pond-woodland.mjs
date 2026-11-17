import {WOODLAND_ART} from './pond-woodland-art.mjs?v=26.12';

// Fixed scenery outside the lake/paddies; the south bank's col-20.5 approach stays open.
export const SHORE_THICKETS=Object.freeze([[14,-12],[18,-13],[22,-13],[26,-12],[28,-9],[28,-5]].map(Object.freeze));
export const WOODLAND_FILES=Object.freeze([WOODLAND_ART.thicket.file]);
export function pondWoodlandObjects(iso){
 return SHORE_THICKETS.map(([col,row],i)=>({kind:'asset',type:'prop',id:`pond-thicket-${i}`,species:'pond-thicket',asset:{...WOODLAND_ART.thicket,noSnowCap:true},xy:iso(col,row)}));
}
