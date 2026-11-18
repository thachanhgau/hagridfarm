import {createGardenClient} from './garden-emulator-client.mjs?v=26.17';
import {baseDecorId,withDecorCopies} from './decor-runtime.mjs?v=26.17';
import {el,button} from './ui-utils.mjs?v=26.17';

// Cuộc thi Trang Trí Vườn Hagrid · Giáng Sinh 2026 (owner 17/11/2026). ?contest=xmas2026 opens the member's contest
// garden (HPVN callable hagridContest), never the real garden: no wallet, no prices, every decoration owned, copies of a
// piece allowed. &entry=<uid> shows one submitted entry, read only.
export const CONTEST_ID='xmas2026';
const UID=/^[A-Za-z0-9_-]{1,128}$/;
export function contestQuery(search){
 const q=new URLSearchParams(search||'');
 if(q.get('contest')!==CONTEST_ID)return null;
 const entry=q.get('entry');
 return {id:CONTEST_ID,entry:entry&&UID.test(entry)?entry:null};
}

// Copies `<baseId>~<n>` (n 2–20, server nextCopyId): decor-runtime.mjs baseDecorId / withDecorCopies.
export {baseDecorId,withDecorCopies};

const NO_SUPPLIES=Object.freeze({water:0,boost:0,seeds:{}});
// Taps the contest garden does not keep (pet, guide, owl note): answered with the last snapshot, never sent.
const LOCAL_ACTIONS=new Set(['freeAction','guideDone','duty']);
const refusal=(message,reason)=>Object.assign(Error(message),{definitive:true,reason,details:{}});
function closedText(contest){
 if(contest?.phase==='before')return 'Cuộc thi Trang Trí Vườn Giáng Sinh mở từ 01/12.';
 if(contest?.phase==='decorate'&&!contest.eligible)return 'Tài khoản cần tham gia HPVN ít nhất 7 ngày để dự thi.';
 return 'Phần trang trí của cuộc thi đã đóng.';
}
// The shape of a getHagridGarden answer, so the game draws it as it draws a real garden.
const snapshotOf=(garden,extra)=>({...extra,garden:{supplies:NO_SUPPLIES,...garden},wallet:{spendable:0},catalog:[]});

/**
 * The garden client over hagridContest: read = status (joins once while decorating), act = act, plus the contest's own
 * commands as actions: {action:'addCopy',itemId}, {action:'submit',title,story,image}. `entry`: read that entry only.
 * `demoCover`: the cover path sent instead of the picture on a local emulator (HPVN uploads the picture itself).
 */
export function createContestClient(transport,{entry=null,demoCover=null}={}){
 let last=null;
 const ask=data=>transport('hagridContest',data);
 const own=reply=>last=snapshotOf(reply.garden,{contest:reply.contest,serverNow:reply.serverNow,copyId:reply.copyId,profile:{username:'Vườn dự thi Giáng Sinh'}});
 const client=createGardenClient(async(name,data)=>{
  if(name==='getHagridGarden'){
   if(entry){
    const {entry:e}=await ask({mode:'entry',entryUid:entry});
    return last=snapshotOf({progression:e.progression,decorations:e.decorations},{entry:e,contest:{id:CONTEST_ID,status:'locked',no:e.no},profile:{username:e.username||'Thành viên',avatarUrl:e.avatarUrl}});
   }
   let reply=await ask({mode:'status'});
   if(!reply.garden&&reply.contest?.phase==='decorate'&&reply.contest.eligible)reply=await ask({mode:'join'});
   if(!reply.garden)throw refusal(closedText(reply.contest),'contest-not-joined');
   return own(reply);
  }
  if(name!=='performHagridGardenAction'||entry)throw refusal('Vườn dự thi không dùng thao tác này.','contest-action');
  const {catalogHash,...command}=data;
  if(LOCAL_ACTIONS.has(command.action))return last;
  if(command.action==='addCopy')return own(await ask({mode:'addCopy',itemId:baseDecorId(command.itemId)}));
  if(command.action==='submit'){
   const {title,story,image}=command;
   return own(await ask({mode:'submit',title,story,...(demoCover?{cover:demoCover}:{image})}));
  }
  return own(await ask({...command,mode:'act'}));
 });
 return client;
}

/** Locked (submitted), past the deadline, or someone's entry: the garden is shown, never edited. */
export const contestReadOnly=snapshot=>Boolean(snapshot?.entry||snapshot?.contest?.status==='locked'||(snapshot?.contest?.phase&&snapshot.contest.phase!=='decorate'));

/** The visit view (buildVisitSnapshot's shape) for a contest garden: drawn like a member's garden, read only. */
export function contestVisit(snapshot){
 const e=snapshot.entry,p=snapshot.garden.progression,d=snapshot.garden.decorations,scene=d?.scene,no=e?.no??snapshot.contest?.no;
 const owner=e?(e.username||'Thành viên'):'Vườn dự thi của con';
 return {
  tour:{id:'contest:'+(e?.uid||'own'),contest:true,uid:e?.uid||'own',ownerName:owner,level:p.level,title:e?.title||owner,no,story:e?.story||''},
  visit:{uid:e?.uid||'own',username:owner,avatarUrl:e?.avatarUrl,progression:p,decorations:d},
  state:p,decorations:d,decorationRotations:p?.decorationRotations||{},creatureFacings:{},
  atmosphereMode:scene?.atmosphere||'day',weatherMode:scene?.weather||'clear',eventMode:scene?.event||null,
 };
}

/** The banner over a contest garden in the visit view: entry number, title, owner; no help or home buttons. */
export function contestBannerParts(tour,{locked=false}={}){
 const sub=[tour.no?`Bài số ${tour.no}`:null,tour.title!==tour.ownerName?tour.ownerName:null,locked?'Đã nộp · vườn đã khóa':null].filter(Boolean).join(' · ');
 return [el('div',{class:'tour-banner-copy'},[el('strong',{text:tour.title}),el('small',{class:'visit-sub',text:sub||'Cuộc thi Trang Trí Vườn Giáng Sinh'})])];
}


// The entry cover (owner 18/11/2026: «cho user chụp góc đẹp nhất của vườn làm cover»): the member frames a 16:10 part of
// the garden, no postcard frame or stats. HPVN Storage takes webp or png up to 2 MB (Safari writes PNG for 'image/webp').
export const COVER_RATIO=1.6,COVER_MAX=1600,COVER_BYTES=2e6;
const COVER_STEPS=[[1,.85],[1,.7],[.75,.7],[.5,.7],[.35,.7]];
export function centeredFrame(width,height,ratio=COVER_RATIO){const w=Math.min(width,height*ratio),h=w/ratio;return {left:(width-w)/2,top:(height-h)/2,width:w,height:h};}
export function coverSize(width,height,max=COVER_MAX){const k=Math.min(1,max/Math.max(width,height));return [Math.max(1,Math.round(width*k)),Math.max(1,Math.round(height*k))];}
/** `encode(scale,quality)` → Blob; the first one under 2 MB, or null. */
export async function encodeCover(encode,maxBytes=COVER_BYTES){for(const [scale,quality] of COVER_STEPS){const blob=await encode(scale,quality);if(blob&&blob.size<=maxBytes)return blob;}return null;}
export function coverBlob(canvas){
 return encodeCover((scale,quality)=>{
  let c=canvas;
  if(scale<1){c=document.createElement('canvas');[c.width,c.height]=coverSize(canvas.width*scale,canvas.height*scale);const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(canvas,0,0,c.width,c.height);}
  return new Promise(resolve=>c.toBlob(resolve,'image/webp',quality));
 });
}
const loadImage=url=>{const img=new Image();img.src=url;return img.decode().then(()=>img,()=>null);};
/**
 * What the camera shows inside `frame` (client px; null = the centred 16:10 of the viewport) as a canvas. The world
 * canvas holds the garden, creatures and weather; past the map edge the viewport's own backdrop shows
 * (scene-renderer publishBackdrop: colour, the forest tiles with the west strip, the tints over them), so it is painted too.
 */
export async function captureView(viewport,world,frame=null){
 const vr=viewport.getBoundingClientRect(),cr=world.getBoundingClientRect(),st=getComputedStyle(viewport);
 // As sharp as the screen or the canvas's own pixels under the frame, whichever is finer (capped at 1600 px by coverSize).
 const density=Math.max(globalThis.devicePixelRatio||1,cr.width?world.width/cr.width:1);
 if(!frame){const f=centeredFrame(vr.width,vr.height);frame={...f,left:vr.left+f.left,top:vr.top+f.top};}
 const out=document.createElement('canvas');[out.width,out.height]=coverSize(frame.width*density,frame.height*density);
 const x=out.getContext('2d');x.imageSmoothingQuality='high';
 x.scale(out.width/frame.width,out.height/frame.height);x.translate(-frame.left,-frame.top);
 x.fillStyle=st.backgroundColor;x.fillRect(vr.left,vr.top,vr.width,vr.height);
 const urls=[...st.backgroundImage.matchAll(/url\("?([^")]+)"?\)/g)].map(m=>m[1]);
 if(urls.length>=2&&cr.width>0&&cr.height>0){
  const [west,forest]=await Promise.all(urls.slice(-2).map(loadImage));
  if(forest)for(let y=cr.top-Math.ceil((cr.top-vr.top)/cr.height)*cr.height;y<vr.bottom;y+=cr.height)for(let l=cr.left-Math.ceil((cr.left-vr.left)/cr.width)*cr.width;l<vr.right;l+=cr.width)x.drawImage(forest,l,y,cr.width,cr.height);
  if(west)x.drawImage(west,cr.left-cr.width,cr.top,cr.width,cr.height);
 }
 for(const [,tint] of [...st.backgroundImage.matchAll(/linear-gradient\((rgba?\([^)]*\)|[^,)]+)/g)].reverse()){x.fillStyle=tint;x.fillRect(vr.left,vr.top,vr.width,vr.height);}
 x.drawImage(world,cr.left,cr.top,cr.width,cr.height);
 return out;
}
/** «Chọn góc chụp»: a 16:10 frame over the game, the rest dimmed and the HUD hidden; the garden pans and zooms as usual. Resolves the frame's client rect, or null on «Huỷ». */
export function frameCover(){
 return new Promise(resolve=>{
  const box=el('div',{class:'cover-frame'});
  const done=ok=>{const r=box.getBoundingClientRect();document.body.classList.remove('framing-cover');layer.remove();resolve(ok?r:null);};
  const shoot=button('Chụp',()=>done(true),{class:'primary',id:'coverShoot'});
  const layer=el('div',{class:'cover-framing',role:'dialog','aria-label':'Chọn góc chụp ảnh bìa'},[box,el('div',{class:'contest-actions'},[button('Huỷ',()=>done(false),{id:'coverCancel'}),shoot])]);
  layer.addEventListener('keydown',e=>{if(e.key==='Escape')done(false);});
  document.body.classList.add('framing-cover');document.body.append(layer);shoot.focus({preventScroll:true});
 });
}

export const TITLE_MAX=40,STORY_MAX=280;
/**
 * «Nộp bài dự thi»: title ≤ 40, story ≤ 280, the cover (`capture(frame|null)` → canvas, see captureView) and a tick
 * that the garden locks for good. `onSubmit({title,story,cover})` resolves when the server took it; a refusal stays in
 * the dialog so the member can try again.
 */
export function openContestSubmit({onSubmit,capture,returnFocus=document.activeElement}){
 const dialog=el('dialog',{class:'contest-submit',id:'contestSubmit','aria-labelledby':'contestSubmitTitle'});
 const title=el('input',{id:'contestTitle',name:'title',maxlength:String(TITLE_MAX),required:'',autocomplete:'off',placeholder:'Ví dụ: Đêm tuyết bên lều bác Hagrid'});
 const story=el('textarea',{id:'contestStory',name:'story',maxlength:String(STORY_MAX),rows:'4',placeholder:'Kể ngắn về khu vườn của con (không bắt buộc)'});
 const sure=el('input',{type:'checkbox',id:'contestSure',required:''});
 const count=(input,max)=>{const out=el('small',{class:'contest-count',text:`0/${max}`});input.addEventListener('input',()=>{out.textContent=`${[...input.value].length}/${max}`;});return out;};
 const status=el('p',{class:'contest-status',role:'status'});
 let cover=null,framing=false;
 const preview=el('div',{class:'contest-cover'});
 const shoot=async frame=>{try{const c=await capture(frame);if(c){cover=c;c.setAttribute('aria-label','Ảnh bìa bài dự thi');preview.replaceChildren(c);}}catch{status.textContent='Không chụp được khu vườn; thử lại nhé.';}};
 const pick=button('Chọn góc chụp',async()=>{
  framing=true;dialog.close();const frame=await frameCover();framing=false;dialog.showModal();
  if(frame){await shoot(frame);pick.textContent='Chụp lại';}
  pick.focus();
 },{id:'contestCoverPick'});
 const send=button('Nộp bài',null,{type:'submit',class:'primary',id:'contestSend'});
 const cancel=button('Để sau',()=>dialog.close(),{type:'button'});
 const form=el('form',{method:'dialog'},[
  el('h2',{id:'contestSubmitTitle',text:'Nộp bài dự thi'}),
  el('label',{for:'contestTitle',text:'Tên khu vườn'}),title,count(title,TITLE_MAX),
  el('label',{for:'contestStory',text:'Lời kể'}),story,count(story,STORY_MAX),
  el('span',{class:'contest-label',text:'Ảnh bìa'}),preview,pick,
  el('label',{class:'contest-sure',for:'contestSure'},[sure,el('span',{text:'Con hiểu: nộp xong, vườn dự thi khóa lại và không sửa được nữa.'})]),
  status,el('div',{class:'contest-actions'},[cancel,send]),
 ]);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!title.value.trim()){title.focus();return;}
  send.disabled=cancel.disabled=pick.disabled=true;status.textContent='Đang gửi bài…';
  try{if(!cover)await shoot(null);await onSubmit({title:title.value.trim(),story:story.value.trim(),cover});dialog.close();}
  catch(e){status.textContent=e?.message||'Chưa gửi được bài; thử lại nhé.';}
  finally{send.disabled=cancel.disabled=pick.disabled=false;}
 });
 dialog.addEventListener('close',()=>{if(framing)return;dialog.remove();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 dialog.append(form);document.body.append(dialog);dialog.showModal();title.focus();shoot(null);
 return dialog;
}
