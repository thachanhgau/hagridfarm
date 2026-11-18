// Owner 18/11/2026 «hình rất nhỏ, ko có chức năng preview thì ko xem được hình»: tapping a picture in the store or the
// Trang trí tab opens it large; a decoration shows both of its drawn angles side by side.
import {el,button} from './ui-utils.mjs?v=26.25';

/** Opens a modal with `title` and the nodes `makeViews(size)` returns, drawn at `size` px; `actions(close)` adds buttons
 *  beside «Đóng» (the store's «Mua» and «Mua cả lễ hội», owner 18/11/2026). */
export function openArtPreview(title,makeViews,count=1,actions=null){
 const size=Math.floor(Math.min(260,(Math.min(innerWidth,560)-64-12*(count-1))/count));
 const d=el('dialog',{class:'art-preview','aria-label':title});
 const close=()=>d.close();
 d.append(el('strong',{text:title}),el('div',{class:'art-preview-views'},makeViews(size)),el('div',{class:'art-preview-actions'},[...(actions?.(close)??[]),button('Đóng',close,{class:'art-preview-close'})]));
 d.addEventListener('click',e=>{if(e.target===d)close();});
 d.addEventListener('close',()=>d.remove());
 (document.getElementById('gameShell')||document.body).append(d);
 d.showModal();
 return d;
}

/** Makes `art` (a tile's picture box) open the preview on tap or Enter/Space. */
export function previewable(art,title,makeViews,count=1,actions=null){
 art.classList.add('is-previewable');
 art.setAttribute('role','button');art.tabIndex=0;art.setAttribute('aria-label','Xem lớn '+title);art.title='Xem lớn';
 const open=e=>{e.preventDefault();e.stopPropagation();openArtPreview(title,makeViews,count,actions);};
 art.addEventListener('click',open);
 art.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open(e);});
 return art;
}
