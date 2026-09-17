import * as THREE from './vendor/three.module.min.js';

export function createDeviceStage(container,game,{onFailure,onReady,onFocus,ambient=true,theme='light'}){
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
  let width=1,height=1,hoverYaw=0,hoverPitch=0;
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  function setTheme(value){const dark=value==='dark';hemisphere.color.set(dark?'#c4c5ff':'#fff9e8');hemisphere.groundColor.set(dark?'#44355e':'#b1a1b7');hemisphere.intensity=dark?1.35:2.1;key.color.set(dark?'#e8ddff':'#fff5e9');key.intensity=dark?2.7:3.5;fill.color.set(dark?'#a09aff':'#c8d8ff');fill.intensity=dark?2.3:1.5;renderer.toneMappingExposure=dark?.93:1.18;ground.material.opacity=dark?.25:.12;}
  setTheme(theme);
  function screen(parent,w,h,x,y,z,controls){const m=mesh(new THREE.PlaneGeometry(w,h),screenMaterial,parent,x,y,z);m.castShadow=false;m.userData.screen=true;controls.push(m);return m;}
  function physicalButton(parent,name,x,y,z,r,color,controls){const b=disc(r,.16,color,parent,x,y,z);b.userData.control=name;controls.push(b);return b;}
  function handheld(){const root=new THREE.Group(),controls=[];
    rounded(5.05,8,.72,.38,'#c7c2ca',root,0,0,0);rounded(4.99,7.95,.15,.35,'#afaab5',root,0,0,-.34);
    rounded(4.48,3.77,.15,.28,'#575363',root,0,1.36,.47);rounded(3.98,2.75,.055,.04,'#252e28',root,.16,1.33,.57);
    const display=screen(root,3.79,2.53,.16,1.33,.67,controls);
    text('DOT MATRIX WITH HUMAN CURIOSITY',3.73,.22,root,.14,3.02,.61,{color:'#c8c0d0',font:'bold 23px monospace'});
    disc(.065,.04,'#ce6555',root,-1.94,1.64,.58);text('POWER',.47,.15,root,-1.91,1.35,.62,{color:'#d7ccda',font:'bold 32px monospace'});
    text('DON—BOY',2.62,.45,root,-.64,-.83,.424,{color:'#514b73',font:'italic bold 78px sans-serif'});text('CREATIVE SYSTEM / III',2.65,.2,root,-.66,-1.18,.424,{color:'#766c84',font:'24px monospace'});
    disc(.83,.035,'#aaa4af',root,-1.32,-2.05,.4);
    const cross=new THREE.Group();cross.position.set(-1.32,-2.05,.49);root.add(cross);rounded(.48,1.48,.2,.04,'#302c37',cross);rounded(1.48,.48,.2,.04,'#302c37',cross);disc(.18,.23,'#26252e',cross,0,0,.07);
    for(const [name,x,y] of [['up',0,.5],['down',0,-.5],['left',-.5,0],['right',.5,0]]){const hit=box(.48,.48,.05,new THREE.MeshBasicMaterial({visible:false}),cross,x,y,.22);hit.userData.control=name;controls.push(hit);}
    physicalButton(root,'interact',1.62,-1.65,.48,.36,'#953b6b',controls);physicalButton(root,'interact',.67,-2.09,.48,.36,'#953b6b',controls);text('A',.3,.24,root,1.94,-1.98,.43,{color:'#615477',font:'bold 65px sans-serif'});text('B',.3,.24,root,.95,-2.48,.43,{color:'#615477',font:'bold 65px sans-serif'});
    for(const [x,label] of [[-.38,'SELECT'],[.36,'START']]){const b=rounded(.57,.17,.1,.07,'#8f8997',root,x,-3.13,.43);b.rotation.z=.17;b.userData.control='interact';controls.push(b);text(label,.65,.17,root,x,-3.46,.42,{font:'bold 28px monospace',color:'#71667d'});}
    for(let i=0;i<5;i++){const slit=rounded(.065,.83,.035,.025,'#8c8592',root,1.12+i*.18,-3.08,.42);slit.rotation.z=-.3;}
    for(const x of [-2.28,2.28])disc(.05,.02,'#9b97a4',root,x,3.75,.43);
    return{root,display,controls,width:3.79};
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
    rounded(7.45,5.3,.31,.37,mat('#676174',.24,.7),root,0,.5,0);rounded(7.27,5.12,.07,.31,'#191b25',root,0,.5,.2);const display=screen(root,6.78,4.52,0,.5,.3,controls);disc(.055,.018,'#3d4561',root,0,2.93,.258);
    rounded(.07,.5,.065,.025,'#93909d',root,-3.77,1.91,0);rounded(.43,.06,.08,.02,'#8f8b99',root,2.82,3.19,0);
    const stand=rounded(3.2,1.55,.16,.2,mat('#8f899c',.26,.65),root,0,-2.64,-.4);stand.rotation.x=-.5;rounded(4,.22,1.6,.18,mat('#7a7685',.26,.65),root,0,-3.38,0);
    // A stylus and a small spatial puck establish a current creative workstation.
    const pen=mesh(new THREE.CylinderGeometry(.08,.08,4.6,16),'#e6ded9',root,4.2,-.25,.2);pen.rotation.z=-.15;
    const puck=mesh(new THREE.CylinderGeometry(.68,.7,.28,48),mat('#d0c6ce',.22,.55),root,-2.7,-3.56,1.3);
    return{root,display,controls,width:6.78};
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
  const factories=[handheld,desktop,flip,modern,future];
  function setDevice(index,immediate=false){if(currentIndex===index&&current)return;currentIndex=index;if(outgoing)stageRoot.remove(outgoing.root);outgoing=current;if(!built.has(index))built.set(index,factories[index]());current=built.get(index);stageRoot.add(current.root);transition=immediate||paused?1:0;targetYaw=index===4?-.1:-.22;targetPitch=.06;hoverYaw=hoverPitch=0;current.root.rotation.set(targetPitch,targetYaw-(1-transition)*1.65,0);if(transition===1&&outgoing){stageRoot.remove(outgoing.root);outgoing=null;}current.root.scale.setScalar(index===2?1.06:1);resize();onReady?.();}
  function frameCamera(){let center=new THREE.Vector3();if(focus&&current){stageRoot.updateMatrixWorld(true);current.display.getWorldPosition(center);const baseWidth=camera.right-camera.left;camera.zoom=Math.min(3.5,baseWidth/(current.width*1.25));camera.position.set(center.x,center.y,22);camera.lookAt(center.x,center.y,0);}else{camera.zoom=1;camera.position.set(0,0,22);camera.lookAt(0,0,0);}camera.updateProjectionMatrix();}
  function resize(){const r=container.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);const aspect=width/height,half=Math.max(5.25,5/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;frameCamera();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/width*2-1,-(e.clientY-r.top)/height*2+1);raycaster.setFromCamera(pointer,camera);return current?raycaster.intersectObjects(current.controls,false)[0]:null;}
  function releaseControl(allowNudge=false){if(activeControl&&activeControl!=='interact'){game.move(activeControl,false);if(allowNudge===true&&performance.now()-controlStart<120)game.nudge(activeControl);}activeControl=null;}
  renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;const h=hit(e);renderer.domElement.focus({preventScroll:true});renderer.domElement.setPointerCapture(e.pointerId);if(h?.object.userData.control){e.preventDefault();activeControl=h.object.userData.control;controlStart=performance.now();if(activeControl==='interact')game.interact();else game.move(activeControl,true);return;}drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,screen:!!h?.object.userData.screen,moved:false};});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!drag){if(finePointer.matches&&e.pointerType==='mouse'&&!paused&&!focus&&!activeControl){const r=renderer.domElement.getBoundingClientRect();hoverYaw=((e.clientX-r.left)/r.width-.5)*.3;hoverPitch=((e.clientY-r.top)/r.height-.5)*.16;}return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>8)drag.moved=true;if(!drag.screen&&drag.moved){targetYaw=THREE.MathUtils.clamp(drag.yaw+dx*.004,-.7,.7);targetPitch=THREE.MathUtils.clamp(drag.pitch+dy*.002,-.25,.25);}});
  renderer.domElement.addEventListener('pointerup',e=>{releaseControl(true);if(drag?.screen&&!drag.moved){if(width<600&&!focus){focus=true;frameCamera();onFocus?.(true);drag=null;return;}const h=hit(e);if(h?.object.userData.screen)game.tap(h.uv.x*480,(1-h.uv.y)*320);}drag=null;});
  renderer.domElement.addEventListener('pointerleave',()=>{hoverYaw=hoverPitch=0;});
  renderer.domElement.addEventListener('pointercancel',()=>{releaseControl();drag=null;});renderer.domElement.addEventListener('lostpointercapture',releaseControl);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  function visibility(){visible=!document.hidden;last=performance.now();game.clearKeys();releaseControl();}document.addEventListener('visibilitychange',visibility);
  function frame(now){raf=requestAnimationFrame(frame);if(!visible)return;const elapsed=(now-last)/1000;if(elapsed<1/30)return;last=now;const dt=Math.min(elapsed,.05);game.update(dt);screenTexture.needsUpdate=true;if(!paused)time+=dt;
    if(current){transition=paused?1:Math.min(1,transition+dt*.85);const t=1-Math.pow(1-transition,3);current.root.position.x=(1-t)*3;current.root.position.y=paused?0:Math.sin(time*.8)*.07;
      const yaw=targetYaw+(!paused&&!focus?hoverYaw:0),pitch=targetPitch+(!paused&&!focus?hoverPitch:0);
      if(transition<1){current.root.rotation.y=yaw-(1-t)*1.65;current.root.rotation.x=pitch+(1-t)*.16;}else{current.root.rotation.y=paused?yaw:THREE.MathUtils.lerp(current.root.rotation.y,yaw,Math.min(dt*6,1));current.root.rotation.x=paused?pitch:THREE.MathUtils.lerp(current.root.rotation.x,pitch,Math.min(dt*6,1));}
      current.root.rotation.z=paused?0:Math.sin(time*.5)*.007;const scale=(currentIndex===2?1.06:1)*(.78+.22*t);current.root.scale.setScalar(scale);
      if(outgoing){outgoing.root.position.x=-t*6;outgoing.root.scale.setScalar(1-t*.45);if(transition===1){stageRoot.remove(outgoing.root);outgoing=null;}}
      if(current.blob&&!paused){const attr=current.blob.geometry.attributes.position,base=current.blob.userData.base;for(let i=0;i<attr.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2],wave=1+.045*Math.sin(x*1.3+time)+.035*Math.cos(y*1.5-time*.8);attr.setXYZ(i,x*wave,y*wave,z*wave);}attr.needsUpdate=true;current.blob.geometry.computeVertexNormals();current.inner.rotation.y=time*.07;}
    }if(focus)frameCamera();renderer.render(scene,camera);
  }
  setDevice(0);raf=requestAnimationFrame(frame);
  return{setDevice,setTheme,focusScreen(value){focus=value;frameCamera();onFocus?.(value);},pause(value){paused=value;game.setAmbient(!value);},canvas:renderer.domElement,
    dispose(){cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);for(const {root}of built.values())root.traverse(o=>{o.geometry?.dispose();if(o.material?.map&&o.material!==screenMaterial)o.material.dispose();});materials.forEach(m=>m.dispose());decalTextures.forEach(t=>t.dispose());screenMaterial.dispose();screenTexture.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
