import {eras} from './device-data.js';
import {destinations} from './content.js';
import {collaboratorWall,projectPreviews,videos,mountProjectPreviews,bindImageFallbacks} from './studio.js';
import {createGame,drawDon,WIDTH,HEIGHT} from './device-game.js';
const $=s=>document.querySelector(s),dialog=$('#detail');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const objectCounts=new Map(),objectLabels={blocks:"Build again",shore:"Stack a stone",robot:"Say hello"};
let index=0,stage=null,paused=reduce.matches,sound=false,audio=null,lastFocus=null,toastTimer,fallbackFrame=0;
const colorScheme=matchMedia('(prefers-color-scheme: dark)');
let theme=document.documentElement.dataset.theme||'light',themeChosen=false;
try{themeChosen=['light','dark'].includes(localStorage.getItem('don-theme'));}catch{}
function setTheme(next,persist=false){
  theme=next;document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#171822':'#eee9df';
  $('#theme-toggle').setAttribute('aria-pressed',String(theme==='dark'));
  $('#theme-toggle').setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} mode`);
  $('#theme-toggle').innerHTML=`<span aria-hidden="true">${theme==='dark'?'☀':'☾'}</span><span class="theme-label">${theme==='dark'?'Light':'Dark'} mode</span>`;
  stage?.setTheme(theme);
  if(persist){themeChosen=true;try{localStorage.setItem('don-theme',theme);}catch{}}
}
$('#theme-toggle').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark',true));
colorScheme.addEventListener('change',e=>{if(!themeChosen)setTheme(e.matches?'dark':'light');});
setTheme(theme);
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function link(label,url){return `<a href="${escape(url)}"${url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)} ↗</a>`;}
function tone(note=440){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type=index===0?'square':'sine';o.frequency.setValueAtTime(note,audio.currentTime);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.17);}catch{sound=false;$('#sound').setAttribute('aria-pressed','false');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
const game=createGame({onAction(action){tone(500);action==='next'?setEra((index+1)%eras.length):openContent(action);},onHint(hint){$('#interaction-hint').textContent=hint;},onCollect(total){$('#curiosity').textContent=`✦ ${total}`;$('#announcement').textContent=`Curiosity found. ${total} collected across your journey.`;tone(760);if(total===eras.length*3)toast('Every interface explored. The curious human was you all along.');},onMove(player){$('#device-stage').dataset.playerX=player.x.toFixed(3);$('#device-stage').dataset.playerY=player.y.toFixed(3);}});
$('#device-stage').dataset.playerId=game.player.id;
$('#device-stage').dataset.playerX=String(game.player.x);$('#device-stage').dataset.playerY=String(game.player.y);
const portrait=$('#portrait').getContext('2d');portrait.imageSmoothingEnabled=false;drawDon(portrait,33,53,{scale:1.5});
$('#devices').innerHTML=eras.map((e,i)=>`<button data-era="${i}" aria-label="Visit ${e.name}" aria-current="${i===0?'step':'false'}"><span class="device-symbol" aria-hidden="true">${e.icon}</span><span><small>${e.label}</small><strong>${e.name}</strong></span><b>${String(i+1).padStart(2,'0')}</b></button>`).join('');
$('#content-shortcuts').innerHTML=`<span>TAKE A SHORTCUT</span>${destinations.map(d=>`<button data-content="${d.id}">${escape(d.short)}</button>`).join('')}`;
for(const b of document.querySelectorAll('[data-era]'))b.addEventListener('click',()=>setEra(Number(b.dataset.era)));
for(const b of document.querySelectorAll('[data-content]'))b.addEventListener('click',()=>openContent(b.dataset.content,b));
function setEra(next){index=next;const e=eras[index];document.body.dataset.era=e.id;document.body.dataset.worldAction=String(!!objectLabels[e.id]);$('#object-action').hidden=!objectLabels[e.id];$('#object-action').textContent=objectLabels[e.id]||'';document.body.style.setProperty('--era-color',e.color);document.body.style.setProperty('--era-accent',e.accent);$('#era-number').textContent=`${String(index+1).padStart(2,'0')} / ${String(eras.length).padStart(2,'0')}`;$('#era-title').textContent=e.title;$('#era-description').textContent=e.description;$('#device-caption').textContent=e.caption;$('#next-device').innerHTML=`${e.next} <span>→</span>`;$('#chapter-links').innerHTML=e.content.map(id=>{const d=destinations.find(d=>d.id===id);return `<button data-chapter="${id}">${escape(d.short)} <span>↗</span></button>`;}).join('');for(const b of document.querySelectorAll('[data-chapter]'))b.addEventListener('click',()=>openContent(b.dataset.chapter,b));for(const b of document.querySelectorAll('[data-era]'))b.setAttribute('aria-current',Number(b.dataset.era)===index?'step':'false');game.setEra(e,index,eras.length);game.setObjectState(objectCounts.get(e.id)||0);stage?.setDevice(index);$('#announcement').textContent=`${e.name}. ${e.title} Little Don continues in this device.`;tone(300+index*90);}
for(const b of document.querySelectorAll('[data-studio]'))b.addEventListener('click',()=>openContent(b.dataset.studio,b));
bindImageFallbacks($('.studio-shelf'));
$('#next-device').addEventListener('click',()=>setEra((index+1)%eras.length));
// Content lives on the projected device screen. Keep semantic HTML for reading,
// links, selection and assistive technology while the actual camera moves in.
const outsideReader=()=>document.querySelectorAll('.header,.intro,.playbar,.device-timeline,.content-shortcuts,footer,.view-tools,.skip,.studio-shelf');
let reading=false,readerScrollY=0,disposePreviews=()=>{};
function closeContent(){
  if(!reading)return;disposePreviews();reading=false;dialog.hidden=true;document.body.dataset.reading='false';
  document.documentElement.classList.remove('is-reading');outsideReader().forEach(el=>el.inert=false);
  stage?.readContent(false);game.setReading(false);game.suspend(false);$('#device-stage canvas')?.removeAttribute('inert');
  window.scrollTo({top:readerScrollY,behavior:"instant"});lastFocus?.focus({preventScroll:true});
}
function renderCard(c,section){
 const video=videos[c.title],preview=section==='systems'?projectPreviews[c.title]:null;
 let media='';
 if(video)media=`<a class="studio-media video-poster" href="${escape(c.url)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escape(c.title)} on YouTube"><span class="media-placeholder" aria-hidden="true">${escape(video.label)}<strong>${escape(c.title)}</strong></span><img src="https://img.youtube.com/vi/${video.id}/maxresdefault.jpg" data-fallback="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" alt="${escape(c.title)} — video thumbnail" loading="lazy" width="1280" height="720"><span class="play-disc" aria-hidden="true">▶</span><span class="media-caption">WATCH ON YOUTUBE ↗</span></a>`;
 else if(preview)media=`<a class="studio-media project-poster" href="${escape(c.url)}"${c.url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''} aria-label="Open ${escape(c.title)} project">${preview==='formwright'?'<img src="assets/formwright/painted-texture.jpg" alt="Painted FormWright 3D texture artwork" loading="lazy" width="640" height="360">':`<canvas data-preview="${preview}" aria-hidden="true" width="640" height="360"></canvas>`}<span class="project-name">${escape(c.title)}</span><span class="preview-caption">${preview==='formwright'?'3D / TEXTURE PAINTING':'ANIMATED STUDY'} <b>↗</b></span></a>`;
 return `<article class="content-card${media?' has-media':''}" data-card="${escape(c.title)}">${media}<div class="card-copy">${c.tag?`<small>${escape(c.tag)}</small>`:''}<h3>${escape(c.title)}</h3><p>${escape(c.text)}</p>${c.url?link(c.action,c.url):''}</div></article>`;
}
function openContent(id,opener=document.activeElement){
  const d=destinations.find(d=>d.id===id);if(!d)return;
  if(!reading){lastFocus=opener===document.body?$('#device-stage canvas'):opener;readerScrollY=window.scrollY;}
  reading=true;game.suspend(true);game.setReading(true);document.body.dataset.reading='true';document.documentElement.classList.add('is-reading');
  outsideReader().forEach(el=>el.inert=true);$('#device-stage canvas')?.setAttribute('inert','');
  const e=eras[index];dialog.style.setProperty('--screen-paper',e.screen);dialog.style.setProperty('--screen-ink',e.ink);
  $('#detail-tag').textContent=d.short.toUpperCase();$('#reader-medium').textContent=e.id==='book'?'INK ON PAPER / TURN AN IDEA INTO SOMETHING':`${e.name.toUpperCase()} / DON OS`;
  const hashes={connect:'services'};$('#classic-content').href=`classic.html#${hashes[id]||id}`;
  $('#reader-nav').innerHTML=destinations.map(item=>`<button data-read="${item.id}" aria-current="${item.id===id?'page':'false'}">${escape(item.short)}</button>`).join('');
  $('#reader-nav').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>openContent(button.dataset.read)));
  disposePreviews();
  const gallery=['systems','keynotes'].includes(id);
  const principle=`<div class="principle"><small>THE HUMAN PART</small><strong>${escape(d.principle)}</strong></div>`;
  $('#detail-content').dataset.section=id;
  $('#detail-content').innerHTML=`<p class="reader-kicker">${id==='systems'?'SYSTEMS I BUILD':escape(d.kicker)}</p><h2 id="detail-title">${escape(d.title)}</h2><p class="lead">${escape(d.lead)}</p>${gallery?'':`<p class="body-copy">${escape(d.body)}</p>`}${['about','connect'].includes(id)?collaboratorWall():''}${gallery?'':principle}<div class="content-collection ${id==='systems'?'project-gallery':id==='keynotes'?'video-gallery':''}">${d.cards.map(c=>renderCard(c,id)).join('')}</div>${gallery?`<p class="body-copy">${escape(d.body)}</p>${principle}`:''}<div class="detail-links">${d.links.map(([label,url])=>link(label,url)).join('')}</div><button class="back-to-device" id="back-to-device">Back to Little Don →</button>`;
  bindImageFallbacks($('#detail-content'));
  disposePreviews=mountProjectPreviews($('#detail-content'),{isPaused:()=>paused});
  dialog.hidden=false;$('#reader-scroll').scrollTop=0;
  stage?.readContent(true);$('#close-detail').focus({preventScroll:true});$('#back-to-device').addEventListener('click',closeContent);
}
$('#close-detail').addEventListener('click',closeContent);
// Keep keyboard paging inside the screen even when the outer page is locked.
$('#reader-scroll').addEventListener('keydown',e=>{
  if(e.target!==e.currentTarget)return;const pane=e.currentTarget;
  const positions={Home:0,End:pane.scrollHeight,PageDown:pane.scrollTop+pane.clientHeight*.9,PageUp:pane.scrollTop-pane.clientHeight*.9};
  if(e.key in positions){e.preventDefault();pane.scrollTop=positions[e.key];}
});
dialog.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();closeContent();return;}
  if(e.key!=='Tab')return;const elements=[...dialog.querySelectorAll('button,a[href],[tabindex="0"]')];
  if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===elements.at(-1)){e.preventDefault();elements[0].focus();}
});
const keyMap={w:'up',W:'up',ArrowUp:'up',a:'left',A:'left',ArrowLeft:'left',s:'down',S:'down',ArrowDown:'down',d:'right',D:'right',ArrowRight:'right'};
function typingOrControl(target){return target instanceof Element&&!!target.closest('button,a,input,textarea,select,dialog');}
window.addEventListener('keydown',e=>{if(reading||e.metaKey||e.ctrlKey||e.altKey||(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]')))return;if(keyMap[e.key]){e.preventDefault();game.move(keyMap[e.key],true);}else if(!typingOrControl(e.target)&&['Enter',' ','e','E'].includes(e.key)){e.preventDefault();if(!e.repeat)game.interact();}});
window.addEventListener('keyup',e=>{if(keyMap[e.key])game.move(keyMap[e.key],false);});window.addEventListener('blur',()=>game.clearKeys());document.addEventListener('visibilitychange',()=>game.clearKeys());
for(const button of document.querySelectorAll('[data-move]')){
 const direction=button.dataset.move;let began=0,active=false;
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);began=performance.now();active=true;game.move(direction,true);});
 button.addEventListener('pointerup',()=>{if(!active)return;active=false;game.move(direction,false);if(performance.now()-began<120)game.nudge(direction);});
 for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,()=>{active=false;game.move(direction,false);});
 button.addEventListener('click',e=>{if(e.detail===0)game.nudge(direction);});
}
$('#object-action').addEventListener('click',()=>{
 const id=eras[index].id,count=(objectCounts.get(id)||0)+1;objectCounts.set(id,count);game.setObjectState(count);stage?.objectAction(count);
 const message=id==='blocks'?`A new arrangement. Build ${count}.`:id==='shore'?`${3+count%4} stones, a little more balance.`:'Hello from the other side of the interface.';
 $('#announcement').textContent=message;toast(message);tone(id==='shore'?280:480);
});
$('#interact').addEventListener('click',()=>game.interact());
$('#sound').addEventListener('click',()=>{sound=!sound;$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').setAttribute('aria-label',sound?'Mute sound effects':'Enable sound effects');tone();});
function setMotion(){game.setAmbient(!paused);stage?.pause(paused);$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').setAttribute('aria-label',paused?'Resume ambient animation':'Pause ambient animation');$('#motion').textContent=paused?'▷':'Ⅱ';}
$('#motion').addEventListener('click',()=>{paused=!paused;setMotion();});reduce.addEventListener('change',e=>{paused=e.matches;setMotion();});
$('#focus-screen').addEventListener('click',()=>{const next=$('#focus-screen').getAttribute('aria-pressed')!=='true';$('#focus-screen').setAttribute('aria-pressed',String(next));$('#focus-screen').innerHTML=next?'↙ <span>Whole device</span>':'⌕ <span>Focus screen</span>';stage?.focusScreen(next);});
function fallback(){stage?.dispose();stage=null;document.body.dataset.renderer='2d';$('#stage-message').hidden=true;$('#device-stage').append(game.canvas);game.canvas.tabIndex=0;game.canvas.setAttribute('role','group');game.canvas.setAttribute('aria-label','Playable world. Use WASD or arrow keys to move, and Enter to select.');game.canvas.className='fallback-game';$('#focus-screen').hidden=true;$('.model-hint').textContent='Your playable world. Tap a portal or use the controls below.';game.canvas.addEventListener('pointerup',e=>{game.canvas.focus({preventScroll:true});const r=game.canvas.getBoundingClientRect();game.tap((e.clientX-r.left)/r.width*WIDTH,(e.clientY-r.top)/r.height*HEIGHT);});let last=0;function frame(now){fallbackFrame=requestAnimationFrame(frame);if(document.hidden){last=now;return;}if(now-last<1000/30)return;game.update(Math.min((now-last)/1000,.05));last=now;}cancelAnimationFrame(fallbackFrame);fallbackFrame=requestAnimationFrame(frame);document.body.dataset.ready='true';}
setEra(0);setMotion();
try{const {createDeviceStage}=await import('./device-stage.js');stage=createDeviceStage($('#device-stage'),game,{onFailure:fallback,ambient:!paused,theme,onScreenBounds(bounds){
  if(!reading)return;for(const [name,value]of Object.entries(bounds))dialog.style.setProperty(`--reader-${name}`,`${value}px`);
},onFocus(value){document.body.dataset.screenFocus=String(value);$('#focus-screen').setAttribute('aria-pressed',String(value));$('#focus-screen').innerHTML=value?'↙ <span>Whole device</span>':'⌕ <span>Focus screen</span>';}});$('#stage-message').hidden=true;document.body.dataset.renderer='3d';document.body.dataset.ready='true';}catch(error){console.warn('Using the playable 2D fallback.',error);fallback();}
function openHash(){const aliases={podcast:'resources',services:'connect',book:'resources'};const id=aliases[location.hash.slice(1)]||location.hash.slice(1);if(destinations.some(d=>d.id===id))openContent(id);}
addEventListener('hashchange',openHash);openHash();
