// A right-facing creature is an authored view, including its growth ages.
export function creatureView(item,facing='default'){
 return item?.kind==='creature'&&facing==='right'&&item.rightCreatureMotion?item.rightCreatureMotion:item;
}
export function creatureViewFrames(item){return [...(item?.frames||[]),...(item?.rightCreatureMotion?.frames||[])];}
