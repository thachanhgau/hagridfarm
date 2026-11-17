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

export const TITLE_MAX=40,STORY_MAX=280;
/**
 * «Nộp bài dự thi»: title ≤ 40, story ≤ 280, and a tick that the garden locks for good. `onSubmit({title,story})`
 * resolves when the server took it; a refusal stays in the dialog so the member can try again.
 */
export function openContestSubmit({onSubmit,returnFocus=document.activeElement}){
 const dialog=el('dialog',{class:'contest-submit',id:'contestSubmit','aria-labelledby':'contestSubmitTitle'});
 const title=el('input',{id:'contestTitle',name:'title',maxlength:String(TITLE_MAX),required:'',autocomplete:'off',placeholder:'Ví dụ: Đêm tuyết bên lều bác Hagrid'});
 const story=el('textarea',{id:'contestStory',name:'story',maxlength:String(STORY_MAX),rows:'4',placeholder:'Kể ngắn về khu vườn của con (không bắt buộc)'});
 const sure=el('input',{type:'checkbox',id:'contestSure',required:''});
 const count=(input,max)=>{const out=el('small',{class:'contest-count',text:`0/${max}`});input.addEventListener('input',()=>{out.textContent=`${[...input.value].length}/${max}`;});return out;};
 const status=el('p',{class:'contest-status',role:'status'});
 const send=button('Nộp bài',null,{type:'submit',class:'primary',id:'contestSend'});
 const cancel=button('Để sau',()=>dialog.close(),{type:'button'});
 const form=el('form',{method:'dialog'},[
  el('h2',{id:'contestSubmitTitle',text:'Nộp bài dự thi'}),
  el('label',{for:'contestTitle',text:'Tên khu vườn'}),title,count(title,TITLE_MAX),
  el('label',{for:'contestStory',text:'Lời kể'}),story,count(story,STORY_MAX),
  el('label',{class:'contest-sure',for:'contestSure'},[sure,el('span',{text:'Con hiểu: nộp xong, vườn dự thi khóa lại và không sửa được nữa.'})]),
  status,el('div',{class:'contest-actions'},[cancel,send]),
 ]);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!title.value.trim()){title.focus();return;}
  send.disabled=cancel.disabled=true;status.textContent='Đang chụp vườn và gửi bài…';
  try{await onSubmit({title:title.value.trim(),story:story.value.trim()});dialog.close();}
  catch(e){status.textContent=e?.message||'Chưa gửi được bài; thử lại nhé.';}
  finally{send.disabled=cancel.disabled=false;}
 });
 dialog.addEventListener('close',()=>{dialog.remove();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 dialog.append(form);document.body.append(dialog);dialog.showModal();title.focus();
 return dialog;
}
