import * as THREE from './vendor/three.module.min.js';

// All geometry is local and procedural: no model downloads, textures, or trackers.
export function createWorld(container, destinations, { onSelect, onFailure, reducedMotion, onSpark, onGameTick }) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.append(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-12,12,10,-10,.1,100);
  const root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xe9e4ff,0x45346f,1.8));
  const sun = new THREE.DirectionalLight(0xfffaf0,2.2);
  sun.position.set(-9,18,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50});
  sun.shadow.normalBias=.04;scene.add(sun);
  const fill = new THREE.DirectionalLight(0x89ddff,1.4);fill.position.set(9,8,-10);scene.add(fill);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.085}));
  shadowPlane.rotation.x=-Math.PI/2;shadowPlane.position.y=-2;shadowPlane.receiveShadow=true;scene.add(shadowPlane);
  const materials=new Map();
  function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.06}));return materials.get(color)}
  function mesh(geometry,color,x=0,y=0,z=0,parent=root){const o=new THREE.Mesh(geometry,material(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  function box(w,h,d,color,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent)}
  function sphere(r,color,x,y,z,parent,detail=1){return mesh(new THREE.IcosahedronGeometry(r,detail),color,x,y,z,parent)}
  function cylinder(top,bottom,h,color,x,y,z,parent,segments=48){return mesh(new THREE.CylinderGeometry(top,bottom,h,segments),color,x,y,z,parent)}
  function torus(r,t,color,x,y,z,parent){return mesh(new THREE.TorusGeometry(r,t,8,64),color,x,y,z,parent)}
  const floats=[],islands=[],hitTargets=[],sparks=[];
  function tree(parent,x,z,size=1,color='#2bebb2'){
    cylinder(.065,.09,.8*size,'#b957bc',x,.5*size,z,parent,8);
    sphere(.43*size,color,x,1.07*size,z,parent,1);
    sphere(.31*size,color,x+.24*size,.89*size,z,parent,1);
  }
  function plant(parent,x,z){const leaf=mesh(new THREE.ConeGeometry(.18,.58,5),'#7aff4f',x,.35,z,parent);leaf.rotation.z=.2}
  function island(x,z,r,color){
    const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
    cylinder(r,r*.91,.65,color,0,-.33,0,g,6);
    cylinder(r*.92,r*.3,.65,'#6339a1',0,-.95,0,g,5);
    cylinder(r*.99,r,.13,color,0,.04,0,g,6);
    cylinder(r*.9,r*.62,.3,'#4b227f',0,-.62,0,g,6);
    const ring=torus(r*.85,.016,'#fef8a0',0,.13,0,g);ring.rotation.x=Math.PI/2;
    return g;
  }
  const home=island(0,1,2.05,'#a4fd50');
  cylinder(1.15,1.25,.22,'#7951dd',0,.25,0,home);
  cylinder(.84,.9,.17,'#d88dff',0,.44,0,home);
  // A sculptural, welcoming sun at the center of the world.
  const sculpture=new THREE.Group();sculpture.position.y=1.8;home.add(sculpture);
  const core=sphere(.7,'#ffb000',0,0,0,sculpture,3);
  const orbit=torus(1.15,.043,'#ff54cb',0,0,0,sculpture);orbit.rotation.set(.55,.25,-.35);
  const orbit2=torus(.94,.023,'#6efbff',0,0,0,sculpture);orbit2.rotation.set(-.7,1,.4);
  sphere(.115,'#e7ff43',1.05,.42,0,sculpture,2);
  floats.push({object:sculpture,base:1.8,phase:0,rotate:true});
  tree(home,-1.1,.5,.55);plant(home,1.2,.3);plant(home,-.7,-.9);
  // The last collectible grows a seat in the shared central space.
  const seat=new THREE.Group();seat.visible=false;seat.position.set(0,.6,0);home.add(seat);
  box(1,.18,1,'#ff44ad',0,.48,0,seat);box(1,1,.16,'#ff44ad',0,1,-.42,seat);
  for(const x of [-.36,.36])for(const z of [-.34,.34])box(.12,.48,.12,'#943cfa',x,.17,z,seat);
  destinations.forEach((d,i)=>{
    const [x,z]=d.position;const g=island(x,z,1.55,d.tint);g.userData.id=d.id;islands.push(g);
    // Hidden generous hit volumes make small objects easy to select with touch.
    const hit=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,3.2,12),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=1;hit.userData.id=d.id;g.add(hit);hitTargets.push(hit);
    if(i===0){
      tree(g,0,0,1.5,'#41e765');tree(g,-.85,.35,.65,'#b8ff2f');tree(g,.8,.65,.5,'#10cba0');
      sphere(.22,'#ff9243',.55,.3,-.65,g);box(.65,.1,.26,'#994def',-.55,.3,.85,g);
    }else if(i===1){
      box(1.6,.2,1.2,'#8248dd',0,.22,0,g);
      const b=box(.85,.85,.85,'#954bff',-.35,.76,0,g);b.rotation.y=.3;
      const b2=box(.64,.64,.64,'#fa77ff',.55,1.3,-.2,g);b2.rotation.set(.2,-.25,.15);
      const wire=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8,.8,.8)),new THREE.LineBasicMaterial({color:'#4cfffd'}));wire.position.set(.3,2,.1);wire.rotation.set(.1,.4,.1);g.add(wire);floats.push({object:wire,base:2,phase:1,rotate:true});
      sphere(.25,'#ffde38',-.8,.48,.66,g);plant(g,.9,.7);
    }else if(i===2){
      cylinder(.95,1.1,.22,'#fd745a',0,.3,0,g);
      const portal=torus(.84,.18,'#ff8800',0,1.28,0,g);portal.rotation.y=-.2;
      const inner=torus(.61,.035,'#fff541',0,1.28,.04,g);inner.rotation.y=-.2;
      for(let j=0;j<5;j++)box(.16,.12+.15*j,.14,'#ff397e',-.42+j*.21,.6,0,g);
      sphere(.14,'#fff043',1,.3,.4,g);plant(g,-1,.5);
    }else if(i===3){
      cylinder(1.05,1.1,.23,'#e535aa',0,.27,0,g);
      cylinder(.8,.9,.2,'#ff88d5',0,.48,0,g);
      const arch=torus(.92,.12,'#fc37a5',0,1.17,-.35,g);arch.rotation.y=.2;
      cylinder(.065,.08,1.1,'#ffc425',.15,1,0,g,12);
      const mic=box(.21,.38,.23,'#663dff',.15,1.56,0,g);mic.rotation.z=.3;
      for(let j=0;j<3;j++)box(.27,.23,.27,'#ffba3f',-.55+j*.48,.27,.9,g);
    }else if(i===4){
      const colors=['#29cccf','#ffb800','#fc4f6e'];
      for(let j=0;j<3;j++){const book=box(1.4-j*.1,.23,.8,colors[j],0,.35+j*.27,0,g);book.rotation.y=(j-1)*.22;box(1.25-j*.1,.13,.72,'#f4f0d6',0,.38+j*.27,.04,g).rotation.y=(j-1)*.22;}
      const upright=box(.25,1.1,.75,'#9251ff',.7,.83,-.4,g);upright.rotation.z=-.22;
      tree(g,-.85,-.5,.58,'#b8f426');plant(g,.75,.75);
    }else{
      tree(g,-.7,-.5,.95,'#18dca7');tree(g,.8,-.3,.7,'#6bedff');
      cylinder(.64,.64,.14,'#fff141',0,.8,.15,g);
      cylinder(.08,.17,.65,'#e433a4',0,.42,.15,g,10);
      for(const a of [0,2.1,4.2]){const xx=Math.cos(a)*.92,zz=Math.sin(a)*.92+.15;cylinder(.28,.28,.15,'#ff69b9',xx,.4,zz,g);cylinder(.07,.1,.32,'#6547cf',xx,.2,zz,g,8);}
    }
    const spark=sphere(.14,'#fff434',.95,1.4,.3,g,0);sparks.push(spark);floats.push({object:spark,base:1.4,phase:i,rotate:true});
    for(let j=0;j<3;j++)sphere(.1+j*.025,'#ffa1ee',Math.cos(j*2+i)*1.15,.17,Math.sin(j*2+i)*1.1,g,0);
    // Each island has a curved path to the center; little lights mark the route.
    const start=new THREE.Vector3(x,.06,z);const end=new THREE.Vector3(0,.08,1);
    const mid=start.clone().lerp(end,.5);mid.x+=z*.12;mid.y=-.18;
    const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
    mesh(new THREE.TubeGeometry(curve,30,.075,7,false),d.tint);
    for(let k=1;k<7;k++){const p=curve.getPoint(k/8);sphere(.044,'#d9ff37',p.x,p.y+.04,p.z,root,0);}
  });
  // Floating fragments give the diorama depth without expensive postprocessing.
  for(let i=0;i<16;i++){const a=i*2.4,r=8.2+(i%3)*.35;const stone=sphere(.13+(i%3)*.06,i%2?'#8664f0':'#eb6abe',Math.cos(a)*r,-.45+(i%4)*.1,Math.sin(a)*r,root,0);floats.push({object:stone,base:stone.position.y,phase:i,rotate:false});}
  const avatar=new THREE.Group();avatar.position.set(0,.35,2.15);avatar.scale.setScalar(1.5);root.add(avatar);
  cylinder(.16,.23,.4,'#803dff',0,.21,0,avatar,16);
  sphere(.23,'#fff06c',0,.57,0,avatar,2);
  sphere(.04,'#25134b',-.09,.6,.195,avatar,1);sphere(.04,'#25134b',.09,.6,.195,avatar,1);
  cylinder(.027,.027,.3,'#ff55bc',0,.94,0,avatar,8);sphere(.09,'#ff55bc',0,1.12,0,avatar,2);
  sphere(.12,'#faf2ff',-.26,.24,0,avatar,2);sphere(.12,'#faf2ff',.26,.24,0,avatar,2);
  const avatarRing=torus(.36,.025,'#66fff1',0,.04,0,avatar);avatarRing.rotation.x=Math.PI/2;
  let angle=0,targetAngle=0,paused=reducedMotion,visible=true,frame=0,last=0,time=0,travel=null,width=1,height=1;
  let playing=false, gameTime=0, hopTime=0, gameSuspended=false;
  const keys=new Set(), bursts=[], gameStars=[];
  const point=new THREE.Vector3(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function resize(){const rect=container.getBoundingClientRect();width=rect.width;height=rect.height;renderer.setSize(width,height,false);const aspect=width/height;const half=Math.max(9,10.6/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.position.set(0,21,26);camera.lookAt(0,.2,1);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function labels(){camera.updateMatrixWorld();root.updateMatrixWorld(true);islands.forEach((g,i)=>{point.set(0,-.25,1.3);g.localToWorld(point);point.project(camera);const button=document.querySelector(`[data-island="${destinations[i].id}"]`);if(button){button.style.left=`${(point.x*.5+.5)*width}px`;button.style.top=`${(-point.y*.5+.5)*height}px`;}});}
  function draw(now){frame=requestAnimationFrame(draw);if(!visible)return;const elapsed=(now-last)/1000;const delta=Math.min(elapsed,.05);if(now-last<1000/30)return;last=now;
    if(!paused)time+=delta;
    updateGame(delta,elapsed);
    root.rotation.y+=(targetAngle-root.rotation.y)*Math.min(delta*8,1);angle=root.rotation.y;
    floats.forEach(({object,base,phase,rotate})=>{object.position.y=base+(paused?0:Math.sin(time*1.2+phase)*.09);if(rotate&&!paused)object.rotation.y+=delta*.23;});
    if(travel){travel.t+=delta/(paused?.01:.72);const t=Math.min(1,travel.t),ease=t*t*(3-2*t);avatar.position.lerpVectors(travel.from,travel.to,ease);avatar.position.y+=Math.sin(t*Math.PI)*(paused?0:1.3);if(t===1)travel=null;}
    if(!paused){avatarRing.rotation.z=time;core.rotation.y=time*.1;}
    labels();sparkLabels();renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(draw);
  let down=null,dragged=false;
  function pointerDown(e){if(e.button!==0)return;down={x:e.clientX,y:e.clientY,angle:targetAngle};dragged=false;renderer.domElement.setPointerCapture(e.pointerId);}
  function pointerMove(e){if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>7){dragged=true;targetAngle=down.angle+dx*.004;}}
  function pointerUp(e){if(!down)return;const wasDrag=dragged;down=null;if(wasDrag)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/width*2-1,-(e.clientY-rect.top)/height*2+1);raycaster.setFromCamera(pointer,camera);if(playing){const floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.2);const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(floor,p)){root.worldToLocal(p);walkTo(p.x,p.z);}return;}
    const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit)onSelect(hit.object.userData.id);}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  function visibility(){visible=!document.hidden;last=performance.now();}document.addEventListener('visibilitychange',visibility);
  // A small, optional collection game. Portfolio navigation never depends on it.
  const starShape=new THREE.Shape();
  for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.16:.36;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
  const starGeometry=new THREE.ExtrudeGeometry(starShape,{depth:.13,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035});
  const starPositions=[[-5,-4],[0,-6.4],[5,-4],[7,1],[5,5.3],[0,7],[-5,5.3],[-7,1]];
  starPositions.forEach(([x,z],i)=>{const star=mesh(starGeometry,'#fff02b',x,.95,z);star.visible=false;gameStars.push(star);});
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('role','group');
  renderer.domElement.setAttribute('aria-label','3D playground. During spark hunt, use arrow keys or W A S D to move, and Space to hop.');
  function walkTo(x,z){travel={from:avatar.position.clone(),to:new THREE.Vector3(THREE.MathUtils.clamp(x,-9,9),.2,THREE.MathUtils.clamp(z,-7,8)),t:0};}
  function burst(x,y,z,count=24){
    if(paused)return;
    const colors=['#ff51b5','#fff239','#7eff6a','#5af7ff','#ab77ff'];
    for(let i=0;i<count;i++){const o=box(.09,.15,.07,colors[i%5],x,y,z);bursts.push({o,v:new THREE.Vector3((Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4),life:1.3});}
  }
  function sparkLabels(){
    gameStars.forEach((s,i)=>{const b=document.querySelector(`[data-spark="${i}"]`);if(!b)return;b.hidden=!playing||!s.visible;point.copy(s.position);root.localToWorld(point);point.project(camera);b.style.left=`${(point.x*.5+.5)*width}px`;b.style.top=`${(-point.y*.5+.5)*height}px`;});
  }
  function updateGame(delta,elapsed){
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];if(!paused){b.life-=delta;b.v.y-=delta*5;b.o.position.addScaledVector(b.v,delta);b.o.rotation.x+=delta*4;}if(b.life<=0){root.remove(b.o);b.o.geometry.dispose();bursts.splice(i,1);}}
    if(!playing||gameSuspended)return;
    gameTime+=elapsed;onGameTick?.(gameTime);
    const dx=Number(keys.has('right'))-Number(keys.has('left')),dz=Number(keys.has('down'))-Number(keys.has('up'));
    if(dx||dz){travel=null;const length=Math.hypot(dx,dz),c=Math.cos(angle),s=Math.sin(angle);avatar.position.x=THREE.MathUtils.clamp(avatar.position.x+(dx*c-dz*s)/length*delta*4.4,-9,9);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z+(dx*s+dz*c)/length*delta*4.4,-7,8);}
    if(hopTime>0){hopTime=Math.max(0,hopTime-delta);if(!travel)avatar.position.y=.2+(paused?0:Math.sin((1-hopTime/.65)*Math.PI)*1.25);}else if(!travel)avatar.position.y=.2;
    gameStars.forEach((star,i)=>{if(!star.visible)return;star.position.y=.95+(paused?0:Math.sin(time*3+i)*.12);if(!paused)star.rotation.y+=delta*1.5;
      if(Math.hypot(avatar.position.x-star.position.x,avatar.position.z-star.position.z)<.5){star.visible=false;burst(star.position.x,1,star.position.z);onSpark?.(i,gameTime);}
    });
  }
  const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'};
  function keyDown(e){if(!playing||gameSuspended)return;if(keyMap[e.key]){e.preventDefault();keys.add(keyMap[e.key]);}if(e.code==='Space'){e.preventDefault();if(!e.repeat)hopTime=.65;}}
  function keyUp(e){if(keyMap[e.key])keys.delete(keyMap[e.key]);}
  renderer.domElement.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);renderer.domElement.addEventListener('blur',()=>keys.clear());

  return {
    startGame(){playing=true;gameTime=0;hopTime=0;travel=null;keys.clear();avatar.position.set(0,.2,2.15);gameStars.forEach(s=>{s.visible=true;});targetAngle=0;sparkLabels();renderer.domElement.focus({preventScroll:true});},
    stopGame(){playing=false;keys.clear();gameStars.forEach(s=>{s.visible=false;});},
    seekSpark(i){keys.clear();renderer.domElement.focus({preventScroll:true});if(playing&&gameStars[i]?.visible)walkTo(gameStars[i].position.x,gameStars[i].position.z);},
    move(direction,down){if(down)keys.add(direction);else keys.delete(direction);},
    hop(){hopTime=.65;},suspendGame(value){gameSuspended=value;keys.clear();},
    celebrate(){burst(0,2,1,70);},
    travelTo(id){const d=destinations.find(d=>d.id===id);travel={from:avatar.position.clone(),to:new THREE.Vector3(d.position[0],.2,d.position[1]+.8),t:0};},
    collect(ids){sparks.forEach((spark,i)=>{spark.visible=!ids.has(destinations[i].id)});seat.visible=ids.size===6;sculpture.visible=ids.size!==6;},
    rotate(amount){targetAngle+=amount;}, reset(){targetAngle=0;},pause(value){paused=value;},
    dispose(){cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keyup',keyUp);scene.traverse(o=>{o.geometry?.dispose();});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
  };
}
