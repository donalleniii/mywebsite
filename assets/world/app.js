import { destinations } from './content.js';
const $=s=>document.querySelector(s);
const storageKey='don-world-principles-v1';
let collected=new Set();
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(saved))collected=new Set(saved.filter(id=>destinations.some(d=>d.id===id)));}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,world=null,selectionTimer,toastTimer,lastFocus=null;
const dialog=$('#detail');
function escape(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function link(label,url){const external=/^https:/.test(url);return `<a href="${escape(url)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)} <span aria-hidden="true">↗</span></a>`;}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify([...collected]));return true;}catch{return false;}}
function updateProgress(){
  $('#quest-count').textContent=`${collected.size}/6`;$('#progress-fill').style.width=`${collected.size/6*100}%`;
  $('#quest-title').textContent=collected.size===6?'You made a seat. What’s next?':'Collect a little perspective.';
  destinations.forEach(d=>{const done=collected.has(d.id);const label=$(`[data-island="${d.id}"]`);label.classList.toggle('collected',done);label.querySelector('.island-number').textContent=done?'✓':d.number;$(`[data-destination="${d.id}"] .check`).textContent=done?'✓':'';});
  world?.collect(collected);
}
function showDialog(){lastFocus=document.activeElement;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#close-detail').focus();}
function closeDialog(){dialog.close();lastFocus?.focus();}
function detail(id){
  const d=destinations.find(d=>d.id===id);if(!d)return;
  $('#detail-tag').textContent=`${d.number} / ${d.name}`;dialog.style.setProperty('--island-color',d.color);dialog.style.setProperty('--island-tint',d.tint);
  $('#detail-content').innerHTML=`<h2 id="detail-title">${escape(d.title)}</h2><p class="eyebrow">${escape(d.kicker)}</p><p class="lead">${escape(d.lead)}</p><p class="body">${escape(d.body)}</p><div class="principle"><small>A PRINCIPLE TO TAKE WITH YOU</small><strong>${escape(d.principle)}</strong><button class="collect" id="collect" ${collected.has(id)?'disabled':''}>${collected.has(id)?'✓ Added to your perspective':'✳ Collect this principle'}</button></div>${d.cards.map(c=>`<article class="content-card">${c.image?`<img src="${escape(c.image)}" alt="Don Allen III at Meta Connect" loading="lazy" width="480" height="360">`:''}${c.tag?`<small>${escape(c.tag)}</small>`:''}<h3>${escape(c.title)}</h3><p>${escape(c.text)}</p>${c.url?link(c.action,c.url):''}</article>`).join('')}<div class="detail-links">${d.links.map(([label,url])=>link(label,url)).join('')}</div><button class="next-island" id="next-island">Next island: ${escape(destinations[(destinations.indexOf(d)+1)%6].short)} →</button>`;
  $('#collect').addEventListener('click',()=>{collected.add(id);const saved=persist();updateProgress();$('#collect').textContent='✓ Added to your perspective';$('#collect').disabled=true;toast(collected.size===6?'All six perspectives found. A seat is waiting at the center of your world.':`${d.principle} ${collected.size}/6 collected.${saved?'':' Progress lasts for this visit.'}`);});
  $('#next-island').addEventListener('click',()=>{closeDialog();select(destinations[(destinations.indexOf(d)+1)%6].id);});
  showDialog();
}
function select(id){clearTimeout(selectionTimer);world?.travelTo(id);selectionTimer=setTimeout(()=>detail(id),world&&!paused?650:0);}
$('#destinations').innerHTML=destinations.map(d=>`<button class="destination" data-destination="${d.id}" style="--island-color:${d.color};--island-tint:${d.tint}" aria-label="Explore ${escape(d.short)}"><span class="nav-icon" aria-hidden="true">${d.icon}</span><span><small>ISLAND ${d.number}</small><strong>${escape(d.short)}</strong></span><span class="check" aria-hidden="true"></span></button>`).join('');
$('#island-labels').innerHTML=destinations.map(d=>`<button class="island-label" data-island="${d.id}" style="--island-color:${d.color}" aria-label="Visit ${escape(d.name)}"><span class="island-number" aria-hidden="true">${d.number}</span><strong>${escape(d.name)}</strong></button>`).join('');
for(const b of document.querySelectorAll('[data-destination],[data-island]'))b.addEventListener('click',()=>select(b.dataset.destination||b.dataset.island));
$('#begin').addEventListener('click',()=>select(destinations.find(d=>!collected.has(d.id))?.id||'connect'));
$('#close-detail').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
dialog.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll('button:not([disabled]), a[href]')];
  const first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
$('#journal').addEventListener('click',()=>{
  $('#detail-tag').textContent='YOUR FIELD NOTES';dialog.style.setProperty('--island-tint','#e8ecd8');
  $('#detail-content').innerHTML=`<h2 id="detail-title">${collected.size===6?'You don’t need an invitation.':'A little more perspective.'}</h2><p class="lead">${collected.size===6?'You explored, collected, and made a seat. Now bring your own idea to the table.':'Visit the islands and collect six principles. There’s no right order. Follow what interests you.'}</p><ul class="journal-list">${destinations.map(d=>`<li><span aria-hidden="true">${collected.has(d.id)?'✳':'○'}</span><div>${collected.has(d.id)?escape(d.principle):`Still to discover: ${escape(d.short)}`}</div></li>`).join('')}</ul><p class="journal-note">Your collection is saved only in this browser. Every project, resource, and contact link is available from the start.</p>${collected.size===6?`<div class="detail-links">${link('Let’s make something','https://forms.gle/QVLGQnNdkHDoeVA77')}</div>`:''}<button class="reset-progress" id="reset-progress">Start a fresh exploration</button>`;
  $('#reset-progress').addEventListener('click',()=>{collected.clear();persist();updateProgress();closeDialog();toast('A fresh path. All six principles are ready to discover again.');});showDialog();
});
function motionState(){const b=$('#motion');b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'Resume world animation':'Pause world animation');b.textContent=paused?'▷':'Ⅱ';world?.pause(paused);}
$('#motion').addEventListener('click',()=>{paused=!paused;motionState();});reduced.addEventListener('change',e=>{paused=e.matches;motionState();});
$('#rotate-left').addEventListener('click',()=>world?.rotate(-Math.PI/6));$('#rotate-right').addEventListener('click',()=>world?.rotate(Math.PI/6));$('#reset-view').addEventListener('click',()=>world?.reset());
// Arrow keys move focus through the destination strip; Enter/Space activate
// native buttons. This avoids global shortcuts interfering with page scrolling.
$('#destinations').addEventListener('keydown',e=>{const buttons=[...$('#destinations').querySelectorAll('button')];const index=buttons.indexOf(document.activeElement);if(index<0)return;const delta={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(delta){e.preventDefault();buttons[(index+delta+6)%6].focus();}});
function fallback(){world?.dispose();world=null;$('#world').classList.add('fallback');$('#world-message').hidden=false;$('#world-message').textContent='Explore at your own pace. Every island is available below.';}
updateProgress();motionState();
try{const { createWorld }=await import('./world.js');world=createWorld($('#scene'),destinations,{onSelect:select,onFailure:fallback,reducedMotion:paused});$('#world-message').hidden=true;updateProgress();document.body.dataset.worldReady='true';}catch(error){console.warn('3D view unavailable; using accessible destinations.',error);fallback();document.body.dataset.worldReady='fallback';}

// Existing section bookmarks still lead to their corresponding content.
function openHash(){
  const aliases={podcast:'resources',services:'connect',book:'resources'};
  const hash=location.hash.slice(1);const id=aliases[hash]||hash;
  if(destinations.some(d=>d.id===id))select(id);
}
addEventListener('hashchange',openHash);openHash();
