import {WOODLAND_ART} from './pond-woodland-art.mjs?v=25.1.3';

// Fixed scenery outside the lake/paddies; the south bank's col-20.5 approach stays open.
export const SHORE_THICKETS=Object.freeze([[11,-8],[15,-11],[19,-13],[23,-13],[26,-10],[27,-7]].map(Object.freeze));
export const WOODLAND_FILES=Object.freeze([WOODLAND_ART.thicket.file]);
export function pondWoodlandObjects(iso){
 return SHORE_THICKETS.map(([col,row],i)=>({kind:'asset',type:'prop',id:`pond-thicket-${i}`,species:'pond-thicket',asset:{...WOODLAND_ART.thicket,noSnowCap:true},xy:iso(col,row)}));
}
