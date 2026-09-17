// A single player and game loop persist while the surrounding device changes.
// This canvas is a live texture on the 3D screen, with a 2D fallback.
export const WIDTH=480,HEIGHT=320;
const TILE=32,OX=16,OY=34;
export function drawDon(ctx,x,y,{ink='#302637',skin='#ad7651',shirt='#fff2d7',light='#fff6da',mono=false,step=0,scale=1}={}){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  const rect=(x,y,w,h,color=ink)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const face=mono?light:skin,jacket=mono?light:'#d8b575',tee=mono?light:shirt;
  const stride=step%2,denim=mono?ink:'#59526e';
  rect(-11,13,24,2,mono?ink:'#30263725');
  // Sneakers and alternating trouser legs give the same little human a walk cycle.
  rect(-8,3,7,10+stride,ink);rect(3,3,7,11-stride,ink);
  rect(-6,5,4,6+stride,denim);rect(4,5,4,7-stride,denim);
  rect(-10,11+stride,9,4);rect(3,12-stride,10,3);
  rect(-9,12+stride,7,2,light);rect(5,12-stride,7,2,light);
  // Open jacket, light button-down, bent arms.
  rect(-10,-8,21,14);rect(-8,-7,17,12,jacket);
  rect(-3,-7,7,13,tee);rect(-5,-5,2,10);rect(4,-5,2,10);
  rect(0,-2,1,1);rect(0,2,1,1);
  rect(-14,-6+stride,5,9);rect(-13,-5+stride,3,6,jacket);
  rect(-14,1+stride,5,4);rect(-13,2+stride,3,2,face);
  rect(10,-8-stride,5,9);rect(11,-7-stride,3,6,jacket);
  rect(12,-11-stride,5,5);rect(13,-10-stride,3,3,face);
  // Tied-up locs: stepped silhouette, visible tie and a few light ridges.
  rect(-15,-32,9,3);rect(-18,-29,13,4);rect(-20,-25,13,4);
  rect(-18,-21,11,4);rect(-15,-18,7,3);
  rect(-14,-30,5,1,mono?light:'#746354');rect(-17,-26,7,1,mono?light:'#746354');
  rect(-15,-22,5,1,mono?light:'#746354');rect(-9,-23,4,5,mono?light:'#d7ae69');
  // Large head, swept hairline, ears, brows and oversized square glasses.
  rect(-8,-24,16,3);rect(-10,-21,21,16);rect(-8,-19,18,13,face);
  rect(-11,-17,3,5);rect(-10,-16,2,3,face);
  rect(-7,-22,16,4);rect(-3,-22,2,3,mono?light:'#65534c');rect(2,-21,2,2,mono?light:'#65534c');
  rect(-5,-18,4,1);rect(5,-18,4,1);
  rect(-8,-16,9,8);rect(4,-16,9,8);rect(1,-14,3,2);
  rect(-6,-14,5,4,light);rect(6,-14,5,4,light);
  rect(-3,-13,1,3);rect(8,-13,1,3);
  rect(1,-11,3,3,face);
  // Full beard, smiling mouth and a small chin highlight.
  rect(-7,-8,18,4);rect(-5,-4,14,3);rect(-2,-1,8,2);
  rect(-3,-7,10,3,light);rect(-1,-7,6,1);rect(1,-3,3,1,mono?light:'#b48a65');
  ctx.restore();
}
export function createGame({onAction,onHint,onCollect,onMove}){
  const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
  canvas.setAttribute('aria-label','Little Don’s playable world');canvas.setAttribute('role','img');
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const player={id:'little-don',x:6.5,y:6,steps:0};
  const collected=new Set(),keys=new Set();let era=null,index=0,eraCount=6,target=null,paused=false,reading=false,ambient=true,near=null,lastHint='',time=0;
  const portals=[{x:2.1,y:2,label:'',type:'content',slot:0},{x:7,y:2,label:'',type:'content',slot:1},{x:11.5,y:5,label:'NEXT DEVICE',type:'next'}];
  const chips=[{x:3.5,y:5.6},{x:9.5,y:6.6},{x:10.5,y:1.5}];
  function setEra(next,nextIndex,total=6){era=next;index=nextIndex;eraCount=total;portals[1].x=era.id==='book'?8.5:7;target=null;keys.clear();near=null;lastHint='';portals[0].label=era.portals[0];portals[1].label=era.portals[1];render();}
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
  function render(){if(!era)return;const e=era,paper=e.id==='book',mono=e.id==='handheld'||paper;ctx.fillStyle=e.screen;ctx.fillRect(0,0,WIDTH,HEIGHT);if(reading)return;
    ctx.fillStyle=e.ink;ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillText(`${paper?'THE UNWRITTEN':mono?'DON-BOY':e.id==='desktop'?'DON.EXE':e.id==='flip'?'DON / ONLINE':e.id==='modern'?'DON OS':'HUMAN SIGNAL'}  ${String(index+1).padStart(2,'0')}/${String(eraCount).padStart(2,'0')}`,16,19);ctx.textAlign='right';ctx.fillText(`✦ ${collected.size}`,464,19);
    if(!paper){
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
    }else{
      // Two paper leaves: a stitched gutter, ink rules, little marginalia.
      ctx.fillStyle='#e5d5b3';ctx.fillRect(236,29,8,257);
      ctx.strokeStyle=e.subtle;ctx.lineWidth=1;
      for(let y=48;y<275;y+=17){for(const x of [30,264]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+183,y+.5);ctx.stroke();}}
      ctx.strokeStyle=e.ink;ctx.strokeRect(23,32,204,250);ctx.strokeRect(253,32,204,250);
      for(let y=48;y<275;y+=20){ctx.beginPath();ctx.moveTo(237,y);ctx.lineTo(243,y+5);ctx.stroke();}
      ctx.font='italic 12px Georgia';ctx.textAlign='left';ctx.fillStyle=e.ink;
      ctx.fillText('a little room for possibility',38,174);ctx.fillText('follow the unfinished idea →',266,255);
      ctx.font='11px monospace';ctx.fillText('01 / THE HUMAN',38,272);ctx.fillText('02 / WHAT COMES NEXT',265,272);
      ctx.beginPath();ctx.moveTo(60,203);ctx.lineTo(80,185);ctx.lineTo(100,203);ctx.closePath();ctx.stroke();ctx.strokeRect(65,203,31,30);
      for(let i=0;i<4;i++){ctx.strokeRect(143+i*12,205-i*4,8,28+i*4);}
    }
    portals.forEach((p,i)=>{const x=OX+p.x*TILE,y=OY+p.y*TILE;ctx.fillStyle=e.subtle;ctx.fillRect(x-20,y-18,40,39);ctx.strokeStyle=e.ink;ctx.strokeRect(x-19,y-19,38,36);ctx.fillStyle=e.ink;if(i===2){ctx.fillRect(x-7,y-8,8,18);ctx.fillRect(x+1,y-4,5,10);ctx.fillRect(x+6,y-1,4,4);}else{ctx.fillRect(x-10,y-7,20,15);ctx.fillRect(x-8,y-11,9,4);ctx.fillStyle=e.screen;ctx.fillRect(x-6,y-2,12,2);}ctx.fillStyle=e.ink;ctx.textAlign='center';ctx.font='bold 11px monospace';ctx.fillText(p.label,x,y+33);if(p===near){ctx.strokeStyle=e.ink;ctx.lineWidth=2;ctx.strokeRect(x-24,y-24,48,47);}});
    chips.forEach((c,i)=>{if(collected.has(`${era.id}:${i}`))return;const x=OX+c.x*TILE,y=OY+c.y*TILE+(ambient?Math.sin(time*3+i)*2:0);ctx.fillStyle=mono?e.ink:'#e29a11';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();});
    drawDon(ctx,OX+player.x*TILE,OY+player.y*TILE,{ink:mono?e.ink:'#302336',skin:mono?e.ink:'#a66b46',shirt:mono?e.screen:'#fff2d7',light:mono?e.screen:'#fff5cd',mono,step:Math.floor(player.steps)});
    ctx.fillStyle=e.ink;ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillText(near?`[ A ] ${near.type==='next'?'NEXT DEVICE':near.label}`:'WASD / ARROWS  •  ENTER: SELECT',WIDTH/2,306);
    if(mono&&!paper){ctx.fillStyle=e.ink;ctx.globalAlpha=.06;for(let y=0;y<HEIGHT;y+=3)ctx.fillRect(0,y,WIDTH,1);ctx.globalAlpha=1;}
  }
  return {canvas,player,portals,setEra,update,move,nudge,tap,interact:()=>action(),suspend(value){paused=value;keys.clear();},setReading(value){reading=value;render();},setAmbient(value){ambient=value;},clearKeys(){keys.clear();},get collected(){return collected.size;}};
}
