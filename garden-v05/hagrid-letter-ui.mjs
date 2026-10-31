import {el,button} from './ui-utils.mjs?v=24.9.91';
import {pixelIcon,iconUrl} from './pixel-icons.mjs?v=24.9.91';
import {HAGRID_LETTER} from './garden-tutorial.mjs?v=24.9.91';

// Hagrid's welcome letter (docs/core-design.md section 6). 'welcome' arrives sealed: tap the
// envelope, read, press Bắt đầu. 'keepsake' (Hồ sơ) opens straight on the parchment.
// Esc or a tap outside counts as the button, so the tutorial can never be left half-open.
// 'gift' (festival secret present, event gift) arrives sealed with its own `letter`, signed by its sender, and closes
// with Cất thư; an empty greeting or postscript is left out.
export function showHagridLetter({greeting,mode='welcome',onDone,letter=HAGRID_LETTER}){
 const keepsake=mode==='keepsake',welcome=mode==='welcome',from=mode==='gift'?letter.signature:'bác Hagrid';
 const dialog=el('dialog',{class:'hagrid-letter','aria-label':'Thư của '+from,'data-stage':keepsake?'open':'sealed'});
 const envelope=button('',()=>open(),{class:'hagrid-envelope','aria-label':'Mở thư của '+from});
 envelope.append(el('img',{src:iconUrl('envelope'),alt:'',width:128,height:88,draggable:'false'}),el('span',{class:'hagrid-envelope-hint'},[pixelIcon('letter',1),el('span',{text:'Chạm để mở'})]));
 const done=button('',()=>close(),{class:'primary hagrid-letter-start'});
 done.append(pixelIcon(welcome?'sow':'letter',1),el('span',{text:welcome?'Bắt đầu':'Cất thư'}));
 const parchment=el('article',{class:'hagrid-parchment',hidden:!keepsake},[
  greeting?el('p',{class:'hagrid-letter-greeting',text:greeting}):null,
  ...letter.paragraphs.map(text=>el('p',{text})),
  letter.postscript?el('p',{class:'hagrid-letter-ps',text:letter.postscript}):null,
  el('div',{class:'hagrid-letter-foot'},[el('span',{class:'hagrid-letter-signature',text:letter.signature}),done]),
 ]);
 dialog.append(envelope,parchment);
 envelope.hidden=keepsake;
 let closed=false;
 function open(){dialog.dataset.stage='open';envelope.hidden=true;parchment.hidden=false;done.focus();}
 function close(){if(closed)return;closed=true;dialog.close();dialog.remove();onDone?.();}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{if(e.target===dialog&&dialog.dataset.stage==='open')close();});
 document.body.append(dialog);dialog.showModal();
 (keepsake?done:envelope).focus();
 return {dialog,open,close};
}
