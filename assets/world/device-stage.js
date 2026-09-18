import * as THREE from './vendor/three.module.min.js';

export function createDeviceStage(container,game,{onFailure,onReady,onFocus,onScreenBounds,ambient=true,theme='light'}){
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  container.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','group');renderer.domElement.setAttribute('aria-label','Playable 3D device. Use WASD or arrow keys to move little Don, and Enter to select. Tap screen portals to travel.');
  const camera=new THREE.OrthographicCamera(-6,6,5.6,-5.6,.1,100);camera.position.set(0,0,22);camera.lookAt(0,0,0);
  const hemisphere=new THREE.HemisphereLight(0xfff9e8,0xb1a1b7,2.1);scene.add(hemisphere);
  const key=new THREE.DirectionalLight(0xfff5e9,3.5);key.position.set(-8,12,14);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:9,bottom:-8,near:.5,far:45});key.shadow.normalBias=.02;scene.add(key);
  const fill=new THREE.DirectionalLight(0xc8d8ff,1.5);fill.position.set(8,3,4);scene.add(fill);
  const stageRoot=new THREE.Group();scene.add(stageRoot);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-4.9;ground.receiveShadow=true;scene.add(ground);
  const screenTexture=new THREE.CanvasTexture(game.canvas);screenTexture.colorSpace=THREE.SRGBColorSpace;screenTexture.minFilter=THREE.NearestFilter;screenTexture.magFilter=THREE.NearestFilter;screenTexture.generateMipmaps=false;
  const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false});
  const materials=new Map(),decalTextures=[];
  function mat(color,rough=.64,metal=.05){const k=`${color}/${rough}/${metal}`;if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}));return materials.get(k);}
  function mesh(geometry,color,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function rounded(w,h,d,r,color,parent,x=0,y=0,z=0){const shape=new THREE.Shape(),a=-w/2,b=-h/2;shape.moveTo(a+r,b);shape.lineTo(a+w-r,b);shape.quadraticCurveTo(a+w,b,a+w,b+r);shape.lineTo(a+w,b+h-r);shape.quadraticCurveTo(a+w,b+h,a+w-r,b+h);shape.lineTo(a+r,b+h);shape.quadraticCurveTo(a,b+h,a,b+h-r);shape.lineTo(a,b+r);shape.quadraticCurveTo(a,b,a+r,b);const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:6});geo.translate(0,0,-d/2);return mesh(geo,color,parent,x,y,z);}
  function box(w,h,d,color,parent,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),color,parent,x,y,z);}
  function disc(r,depth,color,parent,x,y,z){const o=mesh(new THREE.CylinderGeometry(r,r,depth,40),color,parent,x,y,z);o.rotation.x=Math.PI/2;return o;}
  function text(label,w,h,parent,x,y,z,{color='#4e4558',bg=null,font='bold 38px monospace',align='center'}={}){const c=document.createElement('canvas');c.width=label.length<4?128:label.length<12?384:768;c.height=Math.round(c.width*h/w);const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.font=font.replace(/\d+px/,`${Math.min(c.height*.68,c.width/(label.length*.62))}px`);ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(label,align==='center'?c.width/2:12,c.height/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;decalTextures.push(t);const material=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false});return mesh(new THREE.PlaneGeometry(w,h),material,parent,x,y,z);}
  const built=new Map();let current=null,currentIndex=0,outgoing=null,transition=1,time=0,last=0,raf=0,visible=true,focus=false,paused=!ambient,drag=null,activeControl=null,controlStart=0,targetYaw=-.22,targetPitch=.06;
  let width=1,height=1,hoverYaw=0,hoverPitch=0,reading=false,readingBeforeFocus=false,cameraSettling=false;
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  function setTheme(value){const dark=value==='dark';hemisphere.color.set(dark?'#c4c5ff':'#fff9e8');hemisphere.groundColor.set(dark?'#44355e':'#b1a1b7');hemisphere.intensity=dark?1.35:2.1;key.color.set(dark?'#e8ddff':'#fff5e9');key.intensity=dark?2.7:3.5;fill.color.set(dark?'#a09aff':'#c8d8ff');fill.intensity=dark?2.3:1.5;renderer.toneMappingExposure=dark?.93:1.18;ground.material.opacity=dark?.25:.12;}
  setTheme(theme);
  function screen(parent,w,h,x,y,z,controls){const m=mesh(new THREE.PlaneGeometry(w,h),screenMaterial,parent,x,y,z);m.castShadow=false;m.userData.screen=true;controls.push(m);return m;}
  function physicalButton(parent,name,x,y,z,r,color,controls){const b=disc(r,.16,color,parent,x,y,z);b.userData.control=name;controls.push(b);return b;}
  function handheld(){const root=new THREE.Group(),controls=[];
    const shell=new THREE.MeshPhysicalMaterial({color:'#6352c3',roughness:.26,metalness:.05,clearcoat:1,transparent:true,opacity:.74,depthWrite:false});
    // The wide Advance silhouette, with translucent indigo grips and visible internals.
    rounded(9.2,4.75,.8,1.1,shell,root);rounded(6.1,4.95,.77,.72,shell,root,0,.05,-.08);
    rounded(7.85,3.66,.13,.4,'#647d87',root,0,0,-.23);
    for(const x of [-3.68,3.68]){box(.62,1.0,.16,'#364852',root,x,.1,-.1);for(let i=0;i<5;i++)box(.55,.025,.03,'#c4bfb2',root,x,-.28+i*.16,0);}
    rounded(5.85,4.2,.17,.44,'#292c46',root,0,.12,.48);rounded(5.03,3.39,.06,.13,'#121e30',root,0,.28,.60);
    const display=screen(root,4.8,3.2,0,.28,.74,controls);
    text('GAME BOY ADVANCE',3.8,.27,root,0,-1.7,.64,{color:'#d8d8ee',font:'italic bold 42px sans-serif'});
    text('DON / III',1.1,.19,root,0,2.03,.59,{color:'#afafd6',font:'bold 28px monospace'});
    for(const x of [-3.45,3.45])rounded(1.85,.32,.65,.13,'#a8a6d5',root,x,2.25,-.01);
    const cross=new THREE.Group();cross.position.set(-3.53,.05,.60);root.add(cross);
    disc(.91,.055,'#6359a1',cross,0,0,-.06);rounded(.5,1.56,.21,.04,'#32364f',cross);rounded(1.56,.5,.21,.04,'#32364f',cross);disc(.2,.24,'#242b40',cross,0,0,.04);
    for(const [name,x,y]of [['up',0,.52],['down',0,-.52],['left',-.52,0],['right',.52,0]]){const hit=box(.48,.48,.05,new THREE.MeshBasicMaterial({visible:false}),cross,x,y,.22);hit.userData.control=name;controls.push(hit);}
    physicalButton(root,'interact',3.84,.42,.6,.43,'#aeb4d0',controls);physicalButton(root,'interact',3.04,-.16,.6,.43,'#aeb4d0',controls);
    text('A',.26,.27,root,3.84,.42,.71,{color:'#505a80'});text('B',.26,.27,root,3.04,-.16,.71,{color:'#505a80'});
    for(const [x,y,label]of [[-3.66,-1.37,'SELECT'],[-3.1,-1.71,'START']]){const button=rounded(.44,.14,.12,.06,'#a5a9cc',root,x,y,.53);button.rotation.z=-.3;button.userData.control='interact';controls.push(button);text(label,.59,.13,root,x+.07,y-.23,.55,{color:'#dbdbef'});}
    for(let i=0;i<6;i++)rounded(.07,.55,.035,.02,'#333858',root,2.95+i*.16,-1.39,.50);
    disc(.065,.04,'#8ce29e',root,4.02,1.27,.48);text('POWER',.65,.12,root,3.95,1.5,.49,{color:'#d6d9ef'});
    for(const x of [-4,4])disc(.055,.025,'#b5b9d6',root,x,-1.89,.42);
    rounded(4.8,2.5,.26,.18,'#535393',root,0,-.3,-.57);
    return{root,display,controls,width:4.8};
  }
  function desktop(){const root=new THREE.Group(),controls=[];
    rounded(6.65,4.96,2.65,.23,'#c9bfa8',root,0,.8,-.25);rounded(6.53,4.84,.26,.15,'#e2d6bb',root,0,.8,1.2);
    rounded(5.85,3.98,.12,.2,'#7b766b',root,0,.99,1.38);rounded(5.4,3.61,.08,.25,'#292e2d',root,0,1.01,1.48);const display=screen(root,5.08,3.386,0,1.01,1.59,controls);
    text('CURIOUS COMPUTING',2.23,.22,root,-1.75,-1.33,1.41,{color:'#756e5d',font:'bold 27px monospace'});text('III',.6,.25,root,2.62,-1.27,1.41,{color:'#918571',font:'bold 72px monospace'});disc(.07,.04,'#98b26b',root,2.01,-1.24,1.38);
    const stand=mesh(new THREE.CylinderGeometry(.8,.96,.75,24),'#b6ac94',root,0,-2.06,-.12);rounded(3.52,.42,2.1,.22,'#cfc4ab',root,0,-2.58,.2);
    for(let i=0;i<9;i++)box(.04,.72,.03,'#a29983',root,2.72+i*.043,.3,1.38);
    const keyboard=new THREE.Group();keyboard.position.set(0,-3.45,2.0);keyboard.rotation.x=-.32;root.add(keyboard);rounded(6.35,1.56,.28,.12,'#d9cdb3',keyboard);
    for(let row=0;row<4;row++)for(let col=0;col<14;col++){const cap=rounded(.35,.235,.08,.025,(row+col)%9===0?'#b4aa94':'#e7dcc5',keyboard,-2.73+col*.418,.51-row*.3,.2);if(row<3)text(['Q','W','E','R','T','Y'][col%6],.16,.12,keyboard,cap.position.x,cap.position.y,.30,{font:'bold 58px monospace',color:'#8b806b'});}
    rounded(2.2,.2,.09,.025,'#dcd0b9',keyboard,0,-.45,.22);
    return{root,display,controls,width:5.08};
  }
  function flip(){const root=new THREE.Group(),controls=[];
    const bottom=new THREE.Group();bottom.position.y=-1.55;bottom.rotation.x=.16;root.add(bottom);rounded(3.36,3.75,.58,.42,mat('#657c9b',.3,.55),bottom);rounded(3.02,3.32,.07,.22,'#bfc5cc',bottom,0,0,.35);
    const lid=new THREE.Group();lid.position.y=2;lid.rotation.x=-.13;root.add(lid);rounded(3.36,3.69,.4,.4,mat('#8194b1',.28,.6),lid);rounded(2.91,2.3,.06,.15,'#373d50',lid,0,-.05,.255);const display=screen(lid,2.64,1.76,0,-.05,.35,controls);
    rounded(.8,.075,.03,.025,'#374252',lid,0,1.26,.255);disc(.06,.03,'#253042',lid,-.6,1.26,.25);text('DON / CONNECT',2,.23,lid,0,-1.49,.252,{color:'#34405a',font:'bold 32px monospace'});
    const hinge=mesh(new THREE.CylinderGeometry(.24,.24,3.26,32),mat('#647588',.22,.7),root,0,.3,0);hinge.rotation.z=Math.PI/2;
    disc(.58,.05,'#8492a6',bottom,0,.88,.415);disc(.35,.12,'#dce1e5',bottom,0,.88,.46);text('OK',.42,.24,bottom,0,.88,.53,{font:'bold 61px sans-serif',color:'#38445c'});
    for(const [name,x,y] of [['up',0,1.33],['down',0,.43],['left',-.45,.88],['right',.45,.88]]){const hit=box(.32,.3,.04,new THREE.MeshBasicMaterial({visible:false}),bottom,x,y,.5);hit.userData.control=name;controls.push(hit);}const ok=box(.5,.5,.025,new THREE.MeshBasicMaterial({visible:false}),bottom,0,.88,.58);ok.userData.control='interact';controls.push(ok);
    for(let row=0;row<4;row++)for(let col=0;col<3;col++){const x=(col-1)*.85,y=.03-row*.44;const button=rounded(.7,.3,.1,.1,'#e2e4e6',bottom,x,y,.405);button.userData.control='interact';controls.push(button);text(row===3?['*','0','#'][col]:String(row*3+col+1),.3,.21,bottom,x,y,.51,{font:'bold 58px sans-serif',color:'#536178'});}
    const antenna=rounded(.22,.7,.2,.07,'#344056',lid,1.2,2.04,-.13);root.scale.setScalar(1.06);
    return{root,display,controls,width:2.64};
  }
  function modern(){const root=new THREE.Group(),controls=[];
    rounded(7.56,5.45,.2,.35,mat('#bfc5cd',.25,.78),root,0,.2,0);
    rounded(7.42,5.31,.045,.31,'#12151e',root,0,.2,.14);
    const display=screen(root,6.95,4.633,0,.2,.235,controls);
    disc(.05,.013,'#313f54',root,0,2.73,.23);disc(.022,.014,'#121d2c',root,0,2.73,.24);
    rounded(.06,.43,.055,.018,'#aab3bf',root,-3.81,2.02,0);rounded(.43,.06,.07,.02,'#aab3bf',root,2.92,2.94,0);
    for(const x of [-2.95,-2.65,2.65,2.95])for(let i=0;i<4;i++)disc(.012,.012,'#4e5662',root,x+i*.045,-2.54,.105);
    rounded(.36,.04,.08,.012,'#333b47',root,0,-2.55,0);
    const pencil=new THREE.Group();pencil.position.set(4.15,.35,.18);pencil.rotation.z=-.12;root.add(pencil);
    mesh(new THREE.CylinderGeometry(.095,.095,4.1,24),'#f4f2ee',pencil,0,0,0);
    rounded(.095,3.85,.045,.015,'#fffdf9',pencil,0,.06,.079);
    const tip=mesh(new THREE.ConeGeometry(.085,.35,24),'#dddcd7',pencil,0,-2.22,0);tip.rotation.z=Math.PI;
    mesh(new THREE.SphereGeometry(.095,16,12),'#f4f2ee',pencil,0,2.05,0);
    mesh(new THREE.CylinderGeometry(.098,.098,.045,24),mat('#b8bdc5',.2,.65),pencil,0,-1.83,0);
    text('Pencil',.12,.55,pencil,0,.95,.099,{color:'#a5a6a8',font:'32px sans-serif'});
    return{root,display,controls,width:6.95};
  }
  function future(){const root=new THREE.Group(),controls=[];
    const geo=new THREE.SphereGeometry(3.5,48,32),base=geo.attributes.position.array.slice();
    const blob=mesh(geo,new THREE.MeshPhysicalMaterial({color:'#b69cdc',metalness:.28,roughness:.18,transparent:true,opacity:.48,clearcoat:1,side:THREE.DoubleSide,depthWrite:false}),root,0,.1,0);blob.scale.set(1.14,1,.58);blob.userData.base=base;
    const inner=mesh(new THREE.IcosahedronGeometry(2.9,2),new THREE.MeshBasicMaterial({color:'#d3a4ed',wireframe:true,transparent:true,opacity:.22}),root,0,.1,-.2);inner.scale.set(1.18,1,.65);
    rounded(5.58,3.89,.05,.18,mat('#a977cf',.22,.45),root,0,.5,2.17);const display=screen(root,5.28,3.52,0,.5,2.26,controls);
    const ring=mesh(new THREE.TorusGeometry(3.95,.025,6,100),new THREE.MeshBasicMaterial({color:'#af86ce'}),root,0,.1,0);ring.rotation.set(.5,.5,.2);const ring2=mesh(new THREE.TorusGeometry(4.1,.018,6,100),new THREE.MeshBasicMaterial({color:'#b4c3a2'}),root,0,.1,0);ring2.rotation.set(-.4,-.7,-.2);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(new THREE.IcosahedronGeometry(.075,1),'#d2a4d7',root,Math.cos(a)*4.2,Math.sin(a)*4.2,.4);}
    return{root,display,controls,width:5.28,blob,inner};
  }
  function book(){const root=new THREE.Group(),controls=[];
    // Layered cream leaves, cloth cover, stitched binding and a ribbon bookmark.
    rounded(8.9,6.2,.22,.12,'#704b40',root,0,0,-.35);
    rounded(8.65,6.02,.12,.08,'#ba9569',root,0,0,-.18);
    for(let i=0;i<7;i++){
      const z=-.10+i*.055,w=4.13-i*.012;
      rounded(w,5.82-i*.013,.028,.035,i%2?'#f0e2c1':'#d6c4a0',root,-2.14,0,z);
      rounded(w,5.82-i*.013,.028,.035,i%2?'#f0e2c1':'#d6c4a0',root,2.14,0,z);
    }
    rounded(4.16,5.79,.09,.025,'#f3e7c9',root,-2.14,0,.3);
    rounded(4.16,5.79,.09,.025,'#f3e7c9',root,2.14,0,.3);
    const display=screen(root,7.98,5.32,0,0,.4,controls);
    rounded(.10,5.82,.07,.03,'#ac9571',root,0,0,.32);
    const ribbon=box(.22,1.15,.035,'#a54e43',root,2.2,-3.08,.04);ribbon.rotation.z=-.1;
    text('THE UNWRITTEN',3,.16,root,-2.15,2.78,.37,{font:'italic 32px serif',color:'#8d7358'});
    text('DON ALLEN III',2.4,.16,root,2.15,2.78,.37,{font:'32px serif',color:'#8d7358'});
    return{root,display,controls,width:7.98};
  }
  let woodMaterial=null;
  function wood(){if(woodMaterial)return woodMaterial;const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#d6aa72';ctx.fillRect(0,0,128,256);for(let i=0;i<40;i++){ctx.strokeStyle=i%3?'#b8884b55':'#f6dab080';ctx.beginPath();for(let y=0;y<=256;y+=8){const x=i*3.3+Math.sin(y*.035+i)*2;y?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;decalTextures.push(texture);woodMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.78});materials.set('wood',woodMaterial);return woodMaterial;}
  function triangle(w,h,d,parent,x,y,z,material=wood()){const shape=new THREE.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(0,h/2);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,bevelSize:.045,bevelThickness:.04,steps:1});geo.translate(0,0,-d/2);return mesh(geo,material,parent,x,y,z);}
  function blocks(){const root=new THREE.Group(),controls=[],pieces=[];
    rounded(9.2,.4,3.1,.13,wood(),root,0,-2.6,0);
    rounded(5.85,4.04,.28,.08,wood(),root,0,.05,.10);
    const display=screen(root,5.35,3.567,0,.05,.33,controls);
    for(const x of [-3.67,3.67]){
      const pillar=mesh(new THREE.CylinderGeometry(.62,.62,2.1,32),wood(),root,x,-1.34,.1);pieces.push(pillar);
      const roof=triangle(1.8,1.35,1.2,root,x,.42,.1);pieces.push(roof);
      rounded(1.2,.55,1.2,.05,wood(),root,x,-2.1,.1);
    }
    const wedge=triangle(1.5,.9,1.15,root,2.5,-2.09,1.03);wedge.rotation.z=Math.PI/2;
    rounded(1.0,.65,.9,.06,wood(),root,-2.6,-2.12,1.18);
    triangle(1.7,.85,.85,root,-.8,2.52,0);mesh(new THREE.CylinderGeometry(.44,.44,.85,32),wood(),root,1.05,2.49,0);
    const base=pieces.map(p=>p.position.clone());let arrangement=0;
    function apply(){pieces.forEach((p,i)=>{const step=arrangement%3;p.position.x=base[i].x+(i<2?-1:1)*(step===1?.32:0);p.position.y=base[i].y+(i%2&&step===2?-.16:0);p.rotation.z=i%2?(step===2?Math.PI:0):(step===1?Math.PI/2:0);});}
    return{root,display,controls,width:5.35,onAction(count){arrangement=count;apply();}};
  }
  function stone(parent,x,y,z,sx,sy,sz,seed){
    const geo=new THREE.SphereGeometry(1,16,10),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),r=1+.09*Math.sin(px*4+py*3+pz*5+seed);p.setXYZ(i,px*r,py*r,pz*r);}geo.computeVertexNormals();
    const rock=mesh(geo,mat(['#747c79','#949892','#626f73','#adb0a6'][seed%4],.98,0),parent,x,y,z);rock.scale.set(sx,sy,sz);rock.rotation.y=seed*.7;return rock;
  }
  function shore(){const root=new THREE.Group(),controls=[],stack=[];
    const beach=mesh(new THREE.CylinderGeometry(4.65,4.7,.24,64),'#c5b89a',root,0,-2.92,0);beach.scale.z=.55;
    rounded(6.25,4.22,.08,.32,'#759f9e',root,.8,.2,-.05);
    const display=screen(root,5.85,3.9,.8,.2,.07,controls);
    for(let j=0;j<3;j++){const points=[];for(let i=0;i<=40;i++)points.push(new THREE.Vector3(-4.4+i*.22,-2.72+j*.16,1.35+Math.sin(i*.22+j)*.23));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.026,5,false),j===1?'#d9e8da':'#7caaa8',root,0,0,0);}
    for(let i=0;i<6;i++){const rock=stone(root,-3.40+Math.sin(i*2)*.10,-2.43+i*.57-i*i*.012,.44,1.08-i*.105,.36-i*.012,.75-i*.06,i);stack.push(rock);}
    stone(root,3.74,-2.34,.82,.78,.38,.66,7);stone(root,2.55,-2.54,1.1,.53,.24,.43,8);stone(root,-1.9,-2.57,1.15,.44,.2,.4,9);
    let count=0,landing=1;function show(){stack.forEach((r,i)=>r.visible=i<3+count%4);}show();
    return{root,display,controls,width:5.85,onAction(value,instant){count=value;landing=instant?1:0;show();stack.forEach((r,j)=>{r.position.y=-2.43+j*.57-j*j*.012+(j===2+count%4?(1-landing)*1.4:0);});},animate(t,dt){if(landing<1)landing=Math.min(1,landing+dt*1.9);const i=2+count%4;stack.forEach((r,j)=>{r.position.y=-2.43+j*.57-j*j*.012+(j===i?(1-landing)*1.4:0);});}};
  }
  function robot(){const root=new THREE.Group(),controls=[];
    rounded(3.05,.5,2.7,.2,mat('#858f97',.45,.55),root,-2.4,-3.05,0);
    mesh(new THREE.CylinderGeometry(.86,.96,.55,32),'#454f5b',root,-2.4,-2.6,0);
    const shoulder=new THREE.Group();shoulder.position.set(-2.4,-2.34,0);root.add(shoulder);
    disc(.57,.85,'#b97542',shoulder,0,0,0);disc(.29,.91,'#ccd4d6',shoulder,0,0,.04);
    const upper=rounded(.73,2.1,.78,.21,'#dadfdc',shoulder,-.3,1.10,0);upper.rotation.z=-.28;
    const elbow=new THREE.Group();elbow.position.set(-.58,2.05,0);shoulder.add(elbow);disc(.49,.86,'#b97542',elbow,0,0,0);disc(.24,.91,'#626f7a',elbow,0,0,.04);
    const forearm=rounded(2.25,.62,.67,.18,'#d6dddc',elbow,1.05,.28,0);forearm.rotation.z=.25;
    const wrist=new THREE.Group();wrist.position.set(2.13,.54,0);elbow.add(wrist);disc(.32,.77,'#566574',wrist,0,0,0);
    for(const y of [-.35,.35]){rounded(.9,.15,.22,.05,'#abb5bc',wrist,.46,y,.18);rounded(.15,.37,.22,.04,'#566574',wrist,.88,y*.68,.18);}
    rounded(5.15,3.60,.20,.2,'#586c76',root,1.07,.6,.61);const display=screen(root,4.82,3.213,1.07,.6,.80,controls);
    text('HUMAN IN THE LOOP',2.8,.19,root,1.07,2.30,.80,{color:'#bfe8d7'});disc(.065,.02,'#a8e8ce',root,3.28,2.28,.80);
    const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.9,-2.5,-.2),new THREE.Vector3(-3.7,-.7,-.2),new THREE.Vector3(-3.6,.3,-.2),new THREE.Vector3(-1.0,.65,-.2)]);mesh(new THREE.TubeGeometry(cable,30,.07,8,false),'#343f4d',root,0,0,0);
    let wave=0;return{root,display,controls,width:4.82,onAction(count,instant){wave=instant?0:3.6;wrist.rotation.z=instant?-.18:0;},animate(t,dt){wave=Math.max(0,wave-dt);shoulder.rotation.z=wave?Math.sin(wave*5)*.13:Math.sin(t*.65)*.018;elbow.rotation.z=wave?Math.sin(wave*5+.7)*.19:Math.sin(t*.85)*.025;wrist.rotation.z=wave?Math.sin(wave*9)*.30:Math.sin(t*.9)*.04;}};
  }
  const factories=[handheld,desktop,flip,modern,future,book,blocks,shore,robot];
  function setDevice(index,immediate=false){if(currentIndex===index&&current)return;currentIndex=index;if(outgoing)stageRoot.remove(outgoing.root);outgoing=current;if(!built.has(index))built.set(index,factories[index]());current=built.get(index);stageRoot.add(current.root);transition=immediate||paused?1:0;targetYaw=index===4?-.1:-.22;targetPitch=.06;hoverYaw=hoverPitch=0;current.root.rotation.set(targetPitch,targetYaw-(1-transition)*1.65,0);if(transition===1&&outgoing){stageRoot.remove(outgoing.root);outgoing=null;}current.root.scale.setScalar(index===2?1.06:1);resize();onReady?.();}
  const cameraCenter=new THREE.Vector3(),cameraPosition=new THREE.Vector3(),cameraRotation=new THREE.Quaternion();
  const screenCorners=[new THREE.Vector3(),new THREE.Vector3()];
  function frameCamera(snap=false,dt=.04){
    let zoom=1;cameraPosition.set(0,0,22);cameraRotation.identity();
    if((focus||reading)&&current){
      stageRoot.updateMatrixWorld(true);current.display.getWorldPosition(cameraCenter);
      if(reading){
        current.display.getWorldQuaternion(cameraRotation);
        cameraPosition.set(0,0,22).applyQuaternion(cameraRotation).add(cameraCenter);
        const w=current.width*(currentIndex===2?1.06:1),h=w/1.5;
        const fitWidth=(camera.right-camera.left)*.91/w,fitHeight=(camera.top-camera.bottom)*.87/h;
        zoom=width/height<1?fitHeight:Math.min(fitWidth,fitHeight);
      }else{zoom=Math.min(3.5,(camera.right-camera.left)/(current.width*1.25));cameraPosition.set(cameraCenter.x,cameraCenter.y,22);}
    }
    const blend=snap||paused?1:Math.min(1,dt*7);
    camera.position.lerp(cameraPosition,blend);camera.quaternion.slerp(cameraRotation,blend);camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoom,blend);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    if(camera.position.distanceTo(cameraPosition)<.01&&Math.abs(camera.zoom-zoom)<.01)cameraSettling=false;
    if(reading&&current){
      const w=current.width,h=w/1.5;
      screenCorners[0].set(-w/2,h/2,0).applyMatrix4(current.display.matrixWorld).project(camera);
      screenCorners[1].set(w/2,-h/2,0).applyMatrix4(current.display.matrixWorld).project(camera);
      const left=Math.max(12,(screenCorners[0].x+1)*width/2+2),top=Math.max(12,(1-screenCorners[0].y)*height/2+2);
      const right=Math.min(width-12,(screenCorners[1].x+1)*width/2-2),bottom=Math.min(height-12,(1-screenCorners[1].y)*height/2-2);
      onScreenBounds?.({left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)});
      container.parentElement.dataset.readerReady=String(Math.abs(camera.zoom-zoom)<.08);
    }
  }
  function resize(){const r=container.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);const aspect=width/height,half=Math.max(5.25,5/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;frameCamera(!reading&&!cameraSettling);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/width*2-1,-(e.clientY-r.top)/height*2+1);raycaster.setFromCamera(pointer,camera);return current?raycaster.intersectObjects(current.controls,false)[0]:null;}
  function releaseControl(allowNudge=false){if(activeControl&&activeControl!=='interact'){game.move(activeControl,false);if(allowNudge===true&&performance.now()-controlStart<120)game.nudge(activeControl);}activeControl=null;}
  renderer.domElement.addEventListener('pointerdown',e=>{if(reading||e.button!==0)return;const h=hit(e);renderer.domElement.focus({preventScroll:true});renderer.domElement.setPointerCapture(e.pointerId);if(h?.object.userData.control){e.preventDefault();activeControl=h.object.userData.control;controlStart=performance.now();if(activeControl==='interact')game.interact();else game.move(activeControl,true);return;}drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,screen:!!h?.object.userData.screen,moved:false};});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!drag){if(finePointer.matches&&e.pointerType==='mouse'&&!paused&&!focus&&!activeControl){const r=renderer.domElement.getBoundingClientRect();hoverYaw=((e.clientX-r.left)/r.width-.5)*.3;hoverPitch=((e.clientY-r.top)/r.height-.5)*.16;}return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>8)drag.moved=true;if(!drag.screen&&drag.moved){targetYaw=THREE.MathUtils.clamp(drag.yaw+dx*.004,-.7,.7);targetPitch=THREE.MathUtils.clamp(drag.pitch+dy*.002,-.25,.25);}});
  renderer.domElement.addEventListener('pointerup',e=>{releaseControl(true);if(drag?.screen&&!drag.moved){if(width<600&&!focus){focus=true;frameCamera();onFocus?.(true);drag=null;return;}const h=hit(e);if(h?.object.userData.screen)game.tap(h.uv.x*480,(1-h.uv.y)*320);}drag=null;});
  renderer.domElement.addEventListener('pointerleave',()=>{hoverYaw=hoverPitch=0;});
  renderer.domElement.addEventListener('pointercancel',()=>{releaseControl();drag=null;});renderer.domElement.addEventListener('lostpointercapture',releaseControl);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  function visibility(){visible=!document.hidden;last=performance.now();game.clearKeys();releaseControl();}document.addEventListener('visibilitychange',visibility);
  function frame(now){raf=requestAnimationFrame(frame);if(!visible)return;const elapsed=(now-last)/1000;if(elapsed<1/30)return;last=now;const dt=Math.min(elapsed,.05);game.update(dt);screenTexture.needsUpdate=true;if(!paused)time+=dt;
    if(current){transition=paused?1:Math.min(1,transition+dt*.85);const t=1-Math.pow(1-transition,3);current.root.position.x=(1-t)*3;current.root.position.y=paused||reading?0:Math.sin(time*.8)*.07;
      const yaw=reading?0:targetYaw+(!paused&&!focus?hoverYaw:0),pitch=reading?0:targetPitch+(!paused&&!focus?hoverPitch:0);
      if(transition<1){current.root.rotation.y=yaw-(1-t)*1.65;current.root.rotation.x=pitch+(1-t)*.16;}else{current.root.rotation.y=paused?yaw:THREE.MathUtils.lerp(current.root.rotation.y,yaw,Math.min(dt*6,1));current.root.rotation.x=paused?pitch:THREE.MathUtils.lerp(current.root.rotation.x,pitch,Math.min(dt*6,1));}
      current.root.rotation.z=paused||reading?0:Math.sin(time*.5)*.007;const scale=(currentIndex===2?1.06:1)*(.78+.22*t);current.root.scale.setScalar(scale);
      if(outgoing){outgoing.root.position.x=-t*6;outgoing.root.scale.setScalar(1-t*.45);if(transition===1){stageRoot.remove(outgoing.root);outgoing=null;}}
      if(current.animate&&!paused&&!reading&&!focus)current.animate(time,dt);
      if(current.blob&&!paused){const attr=current.blob.geometry.attributes.position,base=current.blob.userData.base;for(let i=0;i<attr.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2],wave=1+.045*Math.sin(x*1.3+time)+.035*Math.cos(y*1.5-time*.8);attr.setXYZ(i,x*wave,y*wave,z*wave);}attr.needsUpdate=true;current.blob.geometry.computeVertexNormals();current.inner.rotation.y=time*.07;}
    }frameCamera(false,dt);renderer.render(scene,camera);
  }
  setDevice(0);raf=requestAnimationFrame(frame);
  return{setDevice,setTheme,objectAction(count){current?.onAction?.(count,paused||focus||reading);},readContent(value){
      if(value===reading)return;if(value)readingBeforeFocus=focus;
      reading=value;cameraSettling=true;container.parentElement.dataset.readerReady=String(!value||paused);focus=value||readingBeforeFocus;hoverYaw=hoverPitch=0;drag=null;releaseControl();
      if(value){transition=1;if(outgoing){stageRoot.remove(outgoing.root);outgoing=null;}}
      resize();
    },focusScreen(value){focus=value;frameCamera();onFocus?.(value);},pause(value){paused=value;game.setAmbient(!value);},canvas:renderer.domElement,
    dispose(){cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);for(const {root}of built.values())root.traverse(o=>{o.geometry?.dispose();if(o.material?.map&&o.material!==screenMaterial)o.material.dispose();});materials.forEach(m=>m.dispose());decalTextures.forEach(t=>t.dispose());screenMaterial.dispose();screenTexture.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
