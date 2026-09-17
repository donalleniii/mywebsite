import * as THREE from './vendor/three.module.min.js';

// All geometry is local and procedural: no model downloads, textures, or trackers.
export function createWorld(container, destinations, { onSelect, onFailure, reducedMotion }) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.append(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-12,12,10,-10,.1,100);
  const root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xfff9e8,0xa0b2a1,2.2));
  const sun = new THREE.DirectionalLight(0xfff4dc,3.4);
  sun.position.set(-9,18,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50});
  sun.shadow.normalBias=.04;scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd2d9ff,1.6);fill.position.set(9,8,-10);scene.add(fill);
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
  function tree(parent,x,z,size=1,color='#7eaa87'){
    cylinder(.065,.09,.8*size,'#9d8267',x,.5*size,z,parent,8);
    sphere(.43*size,color,x,1.07*size,z,parent,1);
    sphere(.31*size,color,x+.24*size,.89*size,z,parent,1);
  }
  function plant(parent,x,z){const leaf=mesh(new THREE.ConeGeometry(.18,.58,5),'#86a989',x,.35,z,parent);leaf.rotation.z=.2}
  function island(x,z,r,color){
    const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
    cylinder(r,r*.91,.47,'#b9c2ac',0,-.25,0,g,6);
    cylinder(r*.99,r,.13,color,0,.04,0,g,6);
    cylinder(r*.9,r*.62,.3,'#d9ddc9',0,-.62,0,g,6);
    const ring=torus(r*.85,.016,'#f8f7d7',0,.13,0,g);ring.rotation.x=Math.PI/2;
    return g;
  }
  const home=island(0,1,2.05,'#dde5c6');
  cylinder(1.15,1.25,.22,'#eeeeda',0,.25,0,home);
  cylinder(.84,.9,.17,'#e8e9d1',0,.44,0,home);
  // A sculptural, welcoming sun at the center of the world.
  const sculpture=new THREE.Group();sculpture.position.y=1.8;home.add(sculpture);
  const core=sphere(.7,'#ee995a',0,0,0,sculpture,3);
  const orbit=torus(1.15,.043,'#b78c4f',0,0,0,sculpture);orbit.rotation.set(.55,.25,-.35);
  const orbit2=torus(.94,.023,'#eadca9',0,0,0,sculpture);orbit2.rotation.set(-.7,1,.4);
  sphere(.115,'#f2d486',1.05,.42,0,sculpture,2);
  floats.push({object:sculpture,base:1.8,phase:0,rotate:true});
  tree(home,-1.1,.5,.55);plant(home,1.2,.3);plant(home,-.7,-.9);
  // The last collectible grows a seat in the shared central space.
  const seat=new THREE.Group();seat.visible=false;seat.position.set(0,.6,0);home.add(seat);
  box(1,.18,1,'#c67443',0,.48,0,seat);box(1,1,.16,'#c67443',0,1,-.42,seat);
  for(const x of [-.36,.36])for(const z of [-.34,.34])box(.12,.48,.12,'#a56944',x,.17,z,seat);
  destinations.forEach((d,i)=>{
    const [x,z]=d.position;const g=island(x,z,1.55,d.tint);g.userData.id=d.id;islands.push(g);
    // Hidden generous hit volumes make small objects easy to select with touch.
    const hit=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,3.2,12),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=1;hit.userData.id=d.id;g.add(hit);hitTargets.push(hit);
    if(i===0){
      tree(g,0,0,1.5,'#79a987');tree(g,-.85,.35,.65,'#9cba86');tree(g,.8,.65,.5,'#bbc781');
      sphere(.22,'#d8a068',.55,.3,-.65,g);box(.65,.1,.26,'#a78968',-.55,.3,.85,g);
    }else if(i===1){
      box(1.6,.2,1.2,'#c4b6d2',0,.22,0,g);
      const b=box(.85,.85,.85,'#aa95c7',-.35,.76,0,g);b.rotation.y=.3;
      const b2=box(.64,.64,.64,'#d3c6df',.55,1.3,-.2,g);b2.rotation.set(.2,-.25,.15);
      const wire=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8,.8,.8)),new THREE.LineBasicMaterial({color:'#7c6a96'}));wire.position.set(.3,2,.1);wire.rotation.set(.1,.4,.1);g.add(wire);floats.push({object:wire,base:2,phase:1,rotate:true});
      sphere(.25,'#c29d68',-.8,.48,.66,g);plant(g,.9,.7);
    }else if(i===2){
      cylinder(.95,1.1,.22,'#d6b896',0,.3,0,g);
      const portal=torus(.84,.18,'#d48a4d',0,1.28,0,g);portal.rotation.y=-.2;
      const inner=torus(.61,.035,'#ffdfa1',0,1.28,.04,g);inner.rotation.y=-.2;
      for(let j=0;j<5;j++)box(.16,.12+.15*j,.14,'#f4c273',-.42+j*.21,.6,0,g);
      sphere(.14,'#cf8b45',1,.3,.4,g);plant(g,-1,.5);
    }else if(i===3){
      cylinder(1.05,1.1,.23,'#ce9da0',0,.27,0,g);
      cylinder(.8,.9,.2,'#e4bcba',0,.48,0,g);
      const arch=torus(.92,.12,'#bf8790',0,1.17,-.35,g);arch.rotation.y=.2;
      cylinder(.065,.08,1.1,'#866777',.15,1,0,g,12);
      const mic=box(.21,.38,.23,'#6f5d71',.15,1.56,0,g);mic.rotation.z=.3;
      for(let j=0;j<3;j++)box(.27,.23,.27,'#a77b87',-.55+j*.48,.27,.9,g);
    }else if(i===4){
      const colors=['#8b9e82','#cab77c','#c38b66'];
      for(let j=0;j<3;j++){const book=box(1.4-j*.1,.23,.8,colors[j],0,.35+j*.27,0,g);book.rotation.y=(j-1)*.22;box(1.25-j*.1,.13,.72,'#f4f0d6',0,.38+j*.27,.04,g).rotation.y=(j-1)*.22;}
      const upright=box(.25,1.1,.75,'#b19bb6',.7,.83,-.4,g);upright.rotation.z=-.22;
      tree(g,-.85,-.5,.58,'#a7b982');plant(g,.75,.75);
    }else{
      tree(g,-.7,-.5,.95,'#7aaca0');tree(g,.8,-.3,.7,'#abc7a4');
      cylinder(.64,.64,.14,'#ddcca5',0,.8,.15,g);
      cylinder(.08,.17,.65,'#91a398',0,.42,.15,g,10);
      for(const a of [0,2.1,4.2]){const xx=Math.cos(a)*.92,zz=Math.sin(a)*.92+.15;cylinder(.28,.28,.15,'#789e91',xx,.4,zz,g);cylinder(.07,.1,.32,'#8b9e83',xx,.2,zz,g,8);}
    }
    const spark=sphere(.14,'#f4bd55',.95,1.4,.3,g,0);sparks.push(spark);floats.push({object:spark,base:1.4,phase:i,rotate:true});
    for(let j=0;j<3;j++)sphere(.1+j*.025,'#b2b99d',Math.cos(j*2+i)*1.15,.17,Math.sin(j*2+i)*1.1,g,0);
    // Each island has a curved path to the center; little lights mark the route.
    const start=new THREE.Vector3(x,.06,z);const end=new THREE.Vector3(0,.08,1);
    const mid=start.clone().lerp(end,.5);mid.x+=z*.12;mid.y=-.18;
    const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
    mesh(new THREE.TubeGeometry(curve,30,.025,5,false),'#b4be9e');
    for(let k=1;k<7;k++){const p=curve.getPoint(k/8);sphere(.044,'#e8bc72',p.x,p.y+.04,p.z,root,0);}
  });
  // Floating fragments give the diorama depth without expensive postprocessing.
  for(let i=0;i<16;i++){const a=i*2.4,r=8.2+(i%3)*.35;const stone=sphere(.13+(i%3)*.06,i%2?'#c9d2b3':'#d4c7b1',Math.cos(a)*r,-.45+(i%4)*.1,Math.sin(a)*r,root,0);floats.push({object:stone,base:stone.position.y,phase:i,rotate:false});}
  const avatar=new THREE.Group();avatar.position.set(0,.35,2.15);root.add(avatar);
  cylinder(.16,.23,.4,'#d88345',0,.21,0,avatar,16);
  sphere(.23,'#ffcd84',0,.57,0,avatar,2);
  sphere(.04,'#4d4936',-.09,.6,.195,avatar,1);sphere(.04,'#4d4936',.09,.6,.195,avatar,1);
  const avatarRing=torus(.36,.025,'#c78950',0,.04,0,avatar);avatarRing.rotation.x=Math.PI/2;
  let angle=0,targetAngle=0,paused=reducedMotion,visible=true,frame=0,last=0,time=0,travel=null,width=1,height=1;
  const point=new THREE.Vector3(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function resize(){const rect=container.getBoundingClientRect();width=rect.width;height=rect.height;renderer.setSize(width,height,false);const aspect=width/height;const half=Math.max(9,10.6/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.position.set(0,21,26);camera.lookAt(0,.2,1);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  function labels(){camera.updateMatrixWorld();root.updateMatrixWorld(true);islands.forEach((g,i)=>{point.set(0,-.25,1.3);g.localToWorld(point);point.project(camera);const button=document.querySelector(`[data-island="${destinations[i].id}"]`);if(button){button.style.left=`${(point.x*.5+.5)*width}px`;button.style.top=`${(-point.y*.5+.5)*height}px`;}});}
  function draw(now){frame=requestAnimationFrame(draw);if(!visible)return;const delta=Math.min((now-last)/1000,.05);if(now-last<1000/30)return;last=now;
    if(!paused)time+=delta;
    root.rotation.y+=(targetAngle-root.rotation.y)*Math.min(delta*8,1);angle=root.rotation.y;
    floats.forEach(({object,base,phase,rotate})=>{object.position.y=base+(paused?0:Math.sin(time*1.2+phase)*.09);if(rotate&&!paused)object.rotation.y+=delta*.23;});
    if(travel){travel.t+=delta/(paused?.01:.72);const t=Math.min(1,travel.t),ease=t*t*(3-2*t);avatar.position.lerpVectors(travel.from,travel.to,ease);avatar.position.y+=Math.sin(t*Math.PI)*(paused?0:1.3);if(t===1)travel=null;}
    if(!paused){avatarRing.rotation.z=time;core.rotation.y=time*.1;}
    labels();renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(draw);
  let down=null,dragged=false;
  function pointerDown(e){if(e.button!==0)return;down={x:e.clientX,y:e.clientY,angle:targetAngle};dragged=false;renderer.domElement.setPointerCapture(e.pointerId);}
  function pointerMove(e){if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>7){dragged=true;targetAngle=down.angle+dx*.004;}}
  function pointerUp(e){if(!down)return;const wasDrag=dragged;down=null;if(wasDrag)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/width*2-1,-(e.clientY-rect.top)/height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit)onSelect(hit.object.userData.id);}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();});
  function visibility(){visible=!document.hidden;last=performance.now();}document.addEventListener('visibilitychange',visibility);
  return {
    travelTo(id){const d=destinations.find(d=>d.id===id);travel={from:avatar.position.clone(),to:new THREE.Vector3(d.position[0],.2,d.position[1]+.8),t:0};},
    collect(ids){sparks.forEach((spark,i)=>{spark.visible=!ids.has(destinations[i].id)});seat.visible=ids.size===6;sculpture.visible=ids.size!==6;},
    rotate(amount){targetAngle+=amount;}, reset(){targetAngle=0;},pause(value){paused=value;},
    dispose(){cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);scene.traverse(o=>{o.geometry?.dispose();});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
  };
}
