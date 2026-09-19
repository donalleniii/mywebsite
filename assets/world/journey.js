const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createJourney(eras){
 const visited=new Set(),made=new Set(),root=document.querySelector('#journey-keepsake');
 function draw(){if(!root)return;root.querySelector('#journey-count').textContent=`${visited.size} of ${eras.length} worlds explored`;root.querySelector('#journey-stamps').innerHTML=eras.map(e=>`<span class="journey-stamp ${visited.has(e.id)?'collected':''}"><b aria-hidden="true">${e.icon}</b>${escape(e.name)}${made.has(e.id)?' · made by you':''}</span>`).join('');}
 root?.querySelector('#save-postcard').addEventListener('click',()=>{
  const c=document.createElement('canvas');c.width=1500;c.height=1000;const ctx=c.getContext('2d');ctx.fillStyle='#eee9df';ctx.fillRect(0,0,1500,1000);ctx.fillStyle='#333c39';ctx.font='bold 24px sans-serif';ctx.fillText('A SMALL JOURNEY WITH DON ALLEN III',85,95);ctx.font='bold 73px sans-serif';ctx.fillText('Same human.',85,205);ctx.fillStyle='#886547';ctx.fillText('New possibilities.',85,290);ctx.font='24px sans-serif';ctx.fillStyle='#565f58';ctx.fillText('Stay adaptable. Make room for possibility.',85,355);
  eras.forEach((e,i)=>{const x=85+i%3*450,y=425+Math.floor(i/3)*135;ctx.fillStyle=visited.has(e.id)?e.accent:'#e0dbd0';ctx.fillRect(x,y,420,112);ctx.fillStyle=visited.has(e.id)?'#303634':'#73796f';ctx.font='bold 23px sans-serif';ctx.fillText(e.name,x+20,y+44);ctx.font='17px monospace';ctx.fillText(visited.has(e.id)?made.has(e.id)?'EXPLORED / MADE BY YOU':'EXPLORED':'STILL TO DISCOVER',x+20,y+82);});
  ctx.font='22px sans-serif';ctx.fillStyle='#333c39';ctx.fillText(`${visited.size} worlds explored · donalleniii.me`,85,916);ctx.fillText('What could we build together?',1000,916);
  c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='a-little-journey-with-don.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 });
 // An integration event describes an outbound click, never a completed form or meeting.
 // Only fixed UI placement and world IDs are included; no answers or personal data.
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||!a.href.startsWith('https://forms.gle/QVLGQnNdkHDoeVA77'))return;const detail={name:'collaboration_form_open',placement:a.dataset.collaborate||'portfolio',world:document.body.dataset.era||'handheld'};window.dispatchEvent(new CustomEvent('don:conversion',{detail}));if(typeof window.va==='function')window.va('event',{name:detail.name,data:{placement:detail.placement,world:detail.world}});});
 draw();return{visit(id){visited.add(id);draw();},mark(id){made.add(id);draw();}};
}
