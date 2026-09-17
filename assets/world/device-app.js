import {eras} from './device-data.js';
import {destinations} from './content.js';
import {createGame,drawDon,WIDTH,HEIGHT} from './device-game.js';
const $=s=>document.querySelector(s),dialog=$('#detail');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
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
const game=createGame({onAction(action){tone(500);action==='next'?setEra((index+1)%eras.length):openContent(action);},onHint(hint){$('#interaction-hint').textContent=hint;},onCollect(total){$('#curiosity').textContent=`✦ ${total}`;$('#announcement').textContent=`Curiosity found. ${total} collected across your journey.`;tone(760);if(total===15)toast('Every interface explored. The curious human was you all along.');},onMove(player){$('#device-stage').dataset.playerX=player.x.toFixed(3);$('#device-stage').dataset.playerY=player.y.toFixed(3);}});
$('#device-stage').dataset.playerId=game.player.id;
$('#device-stage').dataset.playerX=String(game.player.x);$('#device-stage').dataset.playerY=String(game.player.y);
const portrait=$('#portrait').getContext('2d');portrait.imageSmoothingEnabled=false;drawDon(portrait,33,53,{scale:1.5});
$('#devices').innerHTML=eras.map((e,i)=>`<button data-era="${i}" aria-label="Visit ${e.name}" aria-current="${i===0?'step':'false'}"><span class="device-symbol" aria-hidden="true">${e.icon}</span><span><small>${e.label}</small><strong>${e.name}</strong></span><b>${String(i+1).padStart(2,'0')}</b></button>`).join('');
$('#content-shortcuts').innerHTML=`<span>TAKE A SHORTCUT</span>${destinations.map(d=>`<button data-content="${d.id}">${escape(d.short)}</button>`).join('')}`;
for(const b of document.querySelectorAll('[data-era]'))b.addEventListener('click',()=>setEra(Number(b.dataset.era)));
for(const b of document.querySelectorAll('[data-content]'))b.addEventListener('click',()=>openContent(b.dataset.content));
function setEra(next){index=next;const e=eras[index];document.body.dataset.era=e.id;document.body.style.setProperty('--era-color',e.color);document.body.style.setProperty('--era-accent',e.accent);$('#era-number').textContent=`${String(index+1).padStart(2,'0')} / 05`;$('#era-title').textContent=e.title;$('#era-description').textContent=e.description;$('#device-caption').textContent=e.caption;$('#next-device').innerHTML=`${e.next} <span>→</span>`;$('#chapter-links').innerHTML=e.content.map(id=>{const d=destinations.find(d=>d.id===id);return `<button data-chapter="${id}">${escape(d.short)} <span>↗</span></button>`;}).join('');for(const b of document.querySelectorAll('[data-chapter]'))b.addEventListener('click',()=>openContent(b.dataset.chapter));for(const b of document.querySelectorAll('[data-era]'))b.setAttribute('aria-current',Number(b.dataset.era)===index?'step':'false');game.setEra(e,index);stage?.setDevice(index);$('#announcement').textContent=`${e.name}. ${e.title} Little Don continues in this device.`;tone(300+index*90);}
$('#next-device').addEventListener('click',()=>setEra((index+1)%eras.length));
function closeContent(){dialog.close();game.suspend(false);lastFocus?.focus();}
function openContent(id){const d=destinations.find(d=>d.id===id);if(!d)return;lastFocus=document.activeElement;game.suspend(true);$('#detail-tag').textContent=`DON ALLEN III / ${d.short.toUpperCase()}`;$('#detail-content').innerHTML=`<h2 id="detail-title">${escape(d.title)}</h2><p class="lead">${escape(d.lead)}</p><p class="body-copy">${escape(d.body)}</p><div class="principle"><small>THE HUMAN PART</small><strong>${escape(d.principle)}</strong></div>${d.cards.map(c=>`<article class="content-card">${c.tag?`<small>${escape(c.tag)}</small>`:''}<h3>${escape(c.title)}</h3><p>${escape(c.text)}</p>${c.url?link(c.action,c.url):''}</article>`).join('')}<div class="detail-links">${d.links.map(([label,url])=>link(label,url)).join('')}</div><button class="back-to-device" id="back-to-device">Return to ${eras[index].name.toLowerCase()} →</button>`;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#close-detail').focus();$('#back-to-device').addEventListener('click',closeContent);}
$('#close-detail').addEventListener('click',closeContent);dialog.addEventListener('cancel',e=>{e.preventDefault();closeContent();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeContent();}});dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const elements=[...dialog.querySelectorAll('button,a[href]')];if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===elements.at(-1)){e.preventDefault();elements[0].focus();}});
const keyMap={w:'up',W:'up',ArrowUp:'up',a:'left',A:'left',ArrowLeft:'left',s:'down',S:'down',ArrowDown:'down',d:'right',D:'right',ArrowRight:'right'};
function typingOrControl(target){return target instanceof Element&&!!target.closest('button,a,input,textarea,select,dialog');}
window.addEventListener('keydown',e=>{if(dialog.open||e.metaKey||e.ctrlKey||e.altKey||(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]')))return;if(keyMap[e.key]){e.preventDefault();game.move(keyMap[e.key],true);}else if(!typingOrControl(e.target)&&['Enter',' ','e','E'].includes(e.key)){e.preventDefault();if(!e.repeat)game.interact();}});
window.addEventListener('keyup',e=>{if(keyMap[e.key])game.move(keyMap[e.key],false);});window.addEventListener('blur',()=>game.clearKeys());document.addEventListener('visibilitychange',()=>game.clearKeys());
for(const button of document.querySelectorAll('[data-move]')){
 const direction=button.dataset.move;let began=0,active=false;
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);began=performance.now();active=true;game.move(direction,true);});
 button.addEventListener('pointerup',()=>{if(!active)return;active=false;game.move(direction,false);if(performance.now()-began<120)game.nudge(direction);});
 for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,()=>{active=false;game.move(direction,false);});
 button.addEventListener('click',e=>{if(e.detail===0)game.nudge(direction);});
}
$('#interact').addEventListener('click',()=>game.interact());
$('#sound').addEventListener('click',()=>{sound=!sound;$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').setAttribute('aria-label',sound?'Mute sound effects':'Enable sound effects');tone();});
function setMotion(){game.setAmbient(!paused);stage?.pause(paused);$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').setAttribute('aria-label',paused?'Resume ambient animation':'Pause ambient animation');$('#motion').textContent=paused?'▷':'Ⅱ';}
$('#motion').addEventListener('click',()=>{paused=!paused;setMotion();});reduce.addEventListener('change',e=>{paused=e.matches;setMotion();});
$('#focus-screen').addEventListener('click',()=>{const next=$('#focus-screen').getAttribute('aria-pressed')!=='true';$('#focus-screen').setAttribute('aria-pressed',String(next));$('#focus-screen').innerHTML=next?'↙ <span>Whole device</span>':'⌕ <span>Focus screen</span>';stage?.focusScreen(next);});
function fallback(){stage?.dispose();stage=null;document.body.dataset.renderer='2d';$('#stage-message').hidden=true;$('#device-stage').append(game.canvas);game.canvas.tabIndex=0;game.canvas.setAttribute('role','group');game.canvas.setAttribute('aria-label','Playable world. Use WASD or arrow keys to move, and Enter to select.');game.canvas.className='fallback-game';$('#focus-screen').hidden=true;$('.model-hint').textContent='Your playable world. Tap a portal or use the controls below.';game.canvas.addEventListener('pointerup',e=>{game.canvas.focus({preventScroll:true});const r=game.canvas.getBoundingClientRect();game.tap((e.clientX-r.left)/r.width*WIDTH,(e.clientY-r.top)/r.height*HEIGHT);});let last=0;function frame(now){fallbackFrame=requestAnimationFrame(frame);if(document.hidden){last=now;return;}if(now-last<1000/30)return;game.update(Math.min((now-last)/1000,.05));last=now;}cancelAnimationFrame(fallbackFrame);fallbackFrame=requestAnimationFrame(frame);document.body.dataset.ready='true';}
setEra(0);setMotion();
try{const {createDeviceStage}=await import('./device-stage.js');stage=createDeviceStage($('#device-stage'),game,{onFailure:fallback,ambient:!paused,theme,onFocus(value){document.body.dataset.screenFocus=String(value);$('#focus-screen').setAttribute('aria-pressed',String(value));$('#focus-screen').innerHTML=value?'↙ <span>Whole device</span>':'⌕ <span>Focus screen</span>';}});$('#stage-message').hidden=true;document.body.dataset.renderer='3d';document.body.dataset.ready='true';}catch(error){console.warn('Using the playable 2D fallback.',error);fallback();}
function openHash(){const aliases={podcast:'resources',services:'connect',book:'resources'};const id=aliases[location.hash.slice(1)]||location.hash.slice(1);if(destinations.some(d=>d.id===id))openContent(id);}
addEventListener('hashchange',openHash);openHash();
