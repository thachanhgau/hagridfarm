import {el,button} from './ui-utils.mjs?v=24.9.61';
import {pixelIcon,iconUrl} from './pixel-icons.mjs?v=24.9.61';
import {HAGRID_LETTER} from './garden-tutorial.mjs?v=24.9.61';

// Hagrid's welcome letter (docs/core-design.md section 6). 'welcome' arrives sealed: tap the
// envelope, read, press Bắt đầu. 'keepsake' (Hồ sơ) opens straight on the parchment.
// Esc or a tap outside counts as the button, so the tutorial can never be left half-open.
export function showHagridLetter({greeting,mode='welcome',onDone}){
 const keepsake=mode==='keepsake';
 const dialog=el('dialog',{class:'hagrid-letter','aria-label':'Thư của bác Hagrid','data-stage':keepsake?'open':'sealed'});
 const envelope=button('',()=>open(),{class:'hagrid-envelope','aria-label':'Mở thư của bác Hagrid'});
 envelope.append(el('img',{src:iconUrl('envelope'),alt:'',width:128,height:88,draggable:'false'}),el('span',{class:'hagrid-envelope-hint'},[pixelIcon('letter',1),el('span',{text:'Chạm để mở'})]));
 const done=button('',()=>close(),{class:'primary hagrid-letter-start'});
 done.append(pixelIcon(keepsake?'letter':'sow',1),el('span',{text:keepsake?'Cất thư':'Bắt đầu'}));
 const parchment=el('article',{class:'hagrid-parchment',hidden:!keepsake},[
  el('p',{class:'hagrid-letter-greeting',text:greeting}),
  ...HAGRID_LETTER.paragraphs.map(text=>el('p',{text})),
  el('p',{class:'hagrid-letter-ps',text:HAGRID_LETTER.postscript}),
  el('div',{class:'hagrid-letter-foot'},[el('span',{class:'hagrid-letter-signature',text:HAGRID_LETTER.signature}),done]),
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
