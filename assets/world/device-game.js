// A single player and game loop persist while the surrounding device changes.
// This canvas is a live texture on the 3D screen, with a 2D fallback.
export const WIDTH=480,HEIGHT=320;
const TILE=32,OX=16,OY=34;
export function drawDon(ctx,x,y,{ink='#332039',skin='#a96946',shirt='#ffb636',light='#fff6da',mono=false,step=0,scale=1}={}){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  rect(-9,10,18,3,mono?ink:'#00000024');
  rect(-5,3,4,8,ink);rect(2,3,4,8,ink);rect(-6,10+(step%2),5,3,light);rect(2,11-(step%2),5,3,light);
  rect(-7,-6,14,12,shirt);rect(-10,-4+(step%2),3,8,skin);rect(7,-4-(step%2),3,8,skin);
  rect(-6,-18,12,13,skin);rect(-4,-20,8,2,skin);
  rect(-7,-15,6,5,ink);rect(1,-15,6,5,ink);rect(-1,-14,2,1,ink);rect(-5,-14,3,2,light);rect(3,-14,3,2,light);
  rect(-5,-8,10,3,ink);rect(-3,-5,6,2,ink);rect(-1,-9,2,1,light);
  rect(-2,-3,4,2,light);ctx.restore();
}
export function createGame({onAction,onHint,onCollect,onMove}){
  const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
  canvas.setAttribute('aria-label','Little Don’s playable world');canvas.setAttribute('role','img');
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const player={id:'little-don',x:6.5,y:6,steps:0};
  const collected=new Set(),keys=new Set();let era=null,index=0,target=null,paused=false,ambient=true,near=null,lastHint='',time=0;
  const portals=[{x:2.1,y:2,label:'',type:'content',slot:0},{x:7,y:2,label:'',type:'content',slot:1},{x:11.5,y:5,label:'NEXT DEVICE',type:'next'}];
  const chips=[{x:3.5,y:5.6},{x:9.5,y:6.6},{x:10.5,y:1.5}];
  function setEra(next,nextIndex){era=next;index=nextIndex;target=null;keys.clear();near=null;lastHint='';portals[0].label=era.portals[0];portals[1].label=era.portals[1];render();}
  function action(p=near){if(paused)return;if(!p){onHint('Move closer to a portal, or tap one on the screen.');return;}target=null;keys.clear();onAction(p.type==='next'?'next':era.content[p.slot]);}
  function move(direction,down){down?keys.add(direction):keys.delete(direction);if(down)target=null;}
  function nudge(direction){if(paused)return;target=null;const delta={up:[0,-.35],down:[0,.35],left:[-.35,0],right:[.35,0]}[direction];if(!delta)return;player.x=Math.max(.65,Math.min(13.35,player.x+delta[0]));player.y=Math.max(.6,Math.min(7.15,player.y+delta[1]));player.steps++;onMove?.(player);}
  function tap(px,py){if(paused)return;const x=(px-OX)/TILE,y=(py-OY)/TILE;const p=portals.find(p=>Math.hypot(p.x-x,p.y-y)<1.4);target={x:p?p.x:Math.max(.6,Math.min(13.4,x)),y:p?p.y:Math.max(.6,Math.min(7.2,y)),portal:p||null};}
  function update(dt){if(!era)return;if(ambient)time+=dt;if(!paused){
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up'));
    if(target&&!dx&&!dy){const distance=Math.hypot(target.x-player.x,target.y-player.y);if(distance<.1){const portal=target.portal;target=null;if(portal)action(portal);}else{dx=(target.x-player.x)/distance;dy=(target.y-player.y)/distance;}}
    const length=Math.hypot(dx,dy);if(length){const speed=Math.min(dt*3.6,target?Math.hypot(target.x-player.x,target.y-player.y):1);player.x=Math.max(.65,Math.min(13.35,player.x+dx/length*speed));player.y=Math.max(.6,Math.min(7.15,player.y+dy/length*speed));player.steps+=dt*9;onMove?.(player);}
    chips.forEach((c,i)=>{const key=`${era.id}:${i}`;if(!collected.has(key)&&Math.hypot(player.x-c.x,player.y-c.y)<.5){collected.add(key);onCollect(collected.size);}});
    near=portals.find(p=>Math.hypot(p.x-player.x,p.y-player.y)<1.25)||null;
    const hint=near?`A / Enter: ${near.type==='next'?era.next:near.label}`:'Walk to a portal. Follow your curiosity.';if(hint!==lastHint){lastHint=hint;onHint(hint);}
  }render();}
  function render(){if(!era)return;const e=era,mono=e.id==='handheld';ctx.fillStyle=e.screen;ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle=e.ink;ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillText(`${mono?'DON-BOY':e.id==='desktop'?'DON.EXE':e.id==='flip'?'DON / ONLINE':e.id==='modern'?'DON OS':'HUMAN SIGNAL'}  ${String(index+1).padStart(2,'0')}/05`,16,19);ctx.textAlign='right';ctx.fillText(`✦ ${collected.size}`,464,19);
    ctx.fillStyle=e.floor;ctx.fillRect(OX,OY,448,250);
    for(let row=0;row<8;row++)for(let col=0;col<14;col++){ctx.fillStyle=(row+col)%2?e.floor:e.screen;ctx.globalAlpha=.35;ctx.fillRect(OX+col*TILE,OY+row*TILE,31,31);}ctx.globalAlpha=1;
    ctx.strokeStyle=e.ink;ctx.lineWidth=2;ctx.strokeRect(OX,OY,448,250);
    // A compact overhead studio: framed diagrams, shelves, and soft pixel shadows.
    // The muted, slightly worn room language follows the supplied game reference.
    ctx.fillStyle=e.subtle;ctx.fillRect(16,34,448,29);ctx.fillRect(16,34,7,249);ctx.fillRect(457,34,7,249);
    const accent=mono?e.ink:index===1?'#8d7889':index===2?'#70639c':index===3?'#ae8064':'#b183c2';
    for(const x of [37,165,293]){ctx.fillStyle=e.ink;ctx.fillRect(x,38,70,21);ctx.fillStyle=e.screen;ctx.fillRect(x+3,41,64,15);ctx.fillStyle=accent;ctx.fillRect(x+7,44,29,3);ctx.fillRect(x+7,50,19,3);ctx.beginPath();ctx.moveTo(x+47,52);ctx.lineTo(x+54,44);ctx.lineTo(x+61,52);ctx.closePath();ctx.fill();}
    ctx.fillStyle=e.subtle;ctx.fillRect(29,185,52,63);ctx.fillStyle=e.ink;ctx.fillRect(32,186,42,3);ctx.fillRect(32,211,42,3);ctx.fillRect(32,237,42,3);
    for(let i=0;i<6;i++){ctx.fillStyle=i%2?accent:e.ink;ctx.fillRect(34+i*6,192,4,16);ctx.fillRect(34+i*6,219,4,15);}
    ctx.globalAlpha=.16;ctx.fillStyle=e.ink;ctx.fillRect(202,208,58,43);ctx.globalAlpha=1;
    ctx.fillStyle=e.screen;ctx.fillRect(194,201,58,37);ctx.strokeStyle=e.subtle;ctx.strokeRect(194,201,58,37);ctx.fillStyle=accent;ctx.fillRect(205,211,20,3);ctx.fillRect(205,219,31,3);
    // Objects change with the medium; the player's identity and coordinates do not.
    for(const [x,y] of [[1,6],[12,1],[5,4]]){const xx=OX+x*TILE,yy=OY+y*TILE;ctx.fillStyle=e.subtle;ctx.fillRect(xx-7,yy-7,19,19);ctx.fillStyle=e.ink;if(index===0){ctx.fillRect(xx-2,yy-3,8,11);ctx.fillRect(xx-5,yy-8,14,9);}else if(index===1){ctx.fillRect(xx-6,yy-8,18,12);ctx.fillRect(xx,yy+4,6,3);}else if(index===2){ctx.fillRect(xx-3,yy-8,10,17);ctx.fillStyle=e.screen;ctx.fillRect(xx-1,yy-5,6,7);}else if(index===3){ctx.fillRect(xx-7,yy-7,20,14);ctx.fillStyle=e.screen;ctx.fillRect(xx-4,yy-4,14,8);}else{ctx.beginPath();ctx.arc(xx+2,yy,10,0,Math.PI*2);ctx.fill();}}
    portals.forEach((p,i)=>{const x=OX+p.x*TILE,y=OY+p.y*TILE;ctx.fillStyle=e.subtle;ctx.fillRect(x-20,y-18,40,39);ctx.strokeStyle=e.ink;ctx.strokeRect(x-19,y-19,38,36);ctx.fillStyle=e.ink;if(i===2){ctx.fillRect(x-7,y-8,8,18);ctx.fillRect(x+1,y-4,5,10);ctx.fillRect(x+6,y-1,4,4);}else{ctx.fillRect(x-10,y-7,20,15);ctx.fillRect(x-8,y-11,9,4);ctx.fillStyle=e.screen;ctx.fillRect(x-6,y-2,12,2);}ctx.fillStyle=e.ink;ctx.textAlign='center';ctx.font='bold 11px monospace';ctx.fillText(p.label,x,y+33);if(p===near){ctx.strokeStyle=e.ink;ctx.lineWidth=2;ctx.strokeRect(x-24,y-24,48,47);}});
    chips.forEach((c,i)=>{if(collected.has(`${era.id}:${i}`))return;const x=OX+c.x*TILE,y=OY+c.y*TILE+(ambient?Math.sin(time*3+i)*2:0);ctx.fillStyle=mono?e.ink:'#e29a11';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();});
    drawDon(ctx,OX+player.x*TILE,OY+player.y*TILE,{ink:mono?e.ink:'#302336',skin:mono?e.ink:'#a66b46',shirt:mono?e.ink:'#f4a731',light:mono?e.screen:'#fff5cd',mono,step:Math.floor(player.steps)});
    ctx.fillStyle=e.ink;ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillText(near?`[ A ] ${near.type==='next'?'NEXT DEVICE':near.label}`:'WASD / ARROWS  •  ENTER: SELECT',WIDTH/2,306);
    if(mono){ctx.fillStyle=e.ink;ctx.globalAlpha=.06;for(let y=0;y<HEIGHT;y+=3)ctx.fillRect(0,y,WIDTH,1);ctx.globalAlpha=1;}
  }
  return {canvas,player,portals,setEra,update,move,nudge,tap,interact:()=>action(),suspend(value){paused=value;keys.clear();},setAmbient(value){ambient=value;},clearKeys(){keys.clear();},get collected(){return collected.size;}};
}
