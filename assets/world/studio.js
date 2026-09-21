// The names and media references come from classic.html, the original portfolio.
export const collaborators=['Apple','Meta','Adobe','OpenAI','NVIDIA','Universal','Snap Inc.','TED','MasterClass','DreamWorks','Instagram','TikTok','R/GA','DRESSX','Canon','Warner Music Group','[adult swim]','Columbia','Asteria'];
export const projectPreviews={FormWright:'formwright',GLYPH:'glyph','G-Splat':'gsplat',Kinesis:'kinesis',SharpSplat:'sharpsplat','Lingbot-Desktop':'lingbot','Piano Courts':'piano','Phantom Grid':'phantom'};
export const videos={
 'On stage with Zuckerberg':{id:'yaeazIA5np8',label:'META CONNECT'},
 'Unlock Your Creative Superpowers':{id:'Ja-MTe1VkfM',label:'SXSW × MASTERCLASS'},
 'Beyond Our Reality':{id:'ObUBUKOn-bo',label:'OPENAI / SORA'}
};
export function collaboratorWall(){return `<section class="collaborator-wall" aria-labelledby="collaborator-title"><div class="collection-heading"><span>THE PEOPLE PART</span><h3 id="collaborator-title">Advisor & Collaborator</h3><p>Good work happens in good company.</p></div><ul class="collaborator-stamps">${collaborators.map((name,i)=>`<li style="--stamp:${i%5};--tilt:${i%3-1}deg"><span class="stamp-number">${String(i+1).padStart(2,'0')}</span><strong>${name}</strong><span class="stamp-mark" aria-hidden="true">✳</span></li>`).join('')}</ul></section>`;}
// Small visual studies echo the original site's animated project cards. They are
// previews, not embedded apps: no camera permissions, audio or third-party code.
export function mountProjectPreviews(root,{isPaused=()=>false}={}){
 const canvases=[...root.querySelectorAll('canvas[data-preview]')],visible=new Set();let raf=0,last=0,time=0;
 function draw(c,t){const ctx=c.getContext('2d'),kind=c.dataset.preview,w=640,h=360;c.width=w;c.height=h;
  ctx.fillStyle=kind==='kinesis'?'#e9e0cb':kind==='glyph'?'#211337':'#101321';ctx.fillRect(0,0,w,h);
  if(kind==='piano'){
   ctx.fillStyle='#bdacf2';ctx.font='18px monospace';ctx.fillText('Cmaj7     Am7     Dm7     G7',54,76);
   for(let i=0;i<14;i++){ctx.fillStyle=[0,2,4,6].includes((i+Math.floor(t/2))%14)?'#c3a8ff':'#f3eadd';ctx.fillRect(53+i*38,120,35,154);}
   for(let i=0;i<13;i++)if(![2,6].includes(i%7)){ctx.fillStyle='#232132';ctx.fillRect(80+i*38,120,20,94);}
  }else if(kind==='phantom'){
   ctx.font='14px monospace';for(let x=20;x<w;x+=20)for(let y=30;y<h;y+=22){ctx.fillStyle=`rgba(105,240,160,${.12+(Math.sin(x+y+t*2)+1)*.16})`;ctx.fillText((x+y)%3?'1':'0',x,y);}
   ctx.fillStyle='#0b171be8';ctx.fillRect(40,84,560,185);ctx.fillStyle='#a7f2bc';ctx.font='18px monospace';['PHANTOM GRID','> autonomous output','> two machines / one experiment','> explore the feed ↗'].forEach((line,i)=>ctx.fillText(line,62,121+i*37));
  }else{
   const glyph=kind==='glyph',cloud=kind==='lingbot',warm=kind==='sharpsplat',paper=kind==='kinesis';
   for(let i=0;i<650;i++){
    const a=i*2.39996+t*.22,z=1-2*i/650,r=Math.sqrt(1-z*z);
    let x=Math.cos(a)*r,y=z,depth=Math.sin(a)*r;
    if(cloud){x=(i%26-13)/11;y=(Math.floor(i/26)%25-12)/13;depth=Math.sin(i*3.1)*.4;}
    if(paper){x=Math.cos(a)*(.25+i/800);y=Math.sin(a)*(.25+i/800);depth=Math.sin(i+t);}
    const px=w/2+x*(cloud?220:145)*(1+depth*.16),py=h/2+y*125;
    ctx.fillStyle=paper?'#3b493b':warm?`hsl(${20+depth*20} 85% ${58+depth*15}%)`:`hsl(${260+depth*45} 80% ${70+depth*15}%)`;
    if(glyph){ctx.font='12px monospace';ctx.fillText('.:+*#@'[i%6],px,py);}else{ctx.globalAlpha=.45+(depth+1)*.25;ctx.fillRect(px,py,cloud?3:2.5,cloud?3:2.5);}
   }ctx.globalAlpha=1;
  }
 }
 function tick(now){raf=0;if(document.hidden)return;if(now-last>1000/24){const paused=isPaused();if(!paused)time+=Math.min((now-last)/1000,.05);last=now;for(const c of visible)if(!c.closest('[inert]')&&(!paused||!c.dataset.drawn)){draw(c,time);c.dataset.drawn='true';}}if(visible.size)raf=requestAnimationFrame(tick);}
 const observer=new IntersectionObserver(entries=>{for(const e of entries)e.isIntersecting?visible.add(e.target):visible.delete(e.target);if(visible.size&&!raf){last=performance.now();raf=requestAnimationFrame(tick);}}, {root:root.closest('#reader-scroll'),threshold:.05});
 for(const c of canvases){draw(c,0);c.dataset.drawn='true';observer.observe(c);}
 function resume(){if(!document.hidden&&visible.size&&!raf){last=performance.now();raf=requestAnimationFrame(tick);}}document.addEventListener('visibilitychange',resume);
 return()=>{cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',resume);};
}
export function bindImageFallbacks(root){
 for(const img of root.querySelectorAll('img[data-fallback]')){
  function fallback(){if(img.dataset.fallback){const next=img.dataset.fallback;img.dataset.fallback='';img.src=next;}else{img.hidden=true;img.closest('.studio-media')?.classList.add('media-unavailable');}}
  img.addEventListener('error',fallback);
  // YouTube also returns a 120px placeholder with HTTP 200 for missing sizes.
  img.addEventListener('load',()=>{if(img.naturalWidth<=120)fallback();});
  if(img.complete&&img.naturalWidth<=120)fallback();
 }
}
