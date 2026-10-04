(() => {
'use strict';
const $=id=>document.getElementById(id),drawing=$('drawing'),ctx=drawing.getContext('2d',{willReadFrequently:true});
const inkColors={white:'#ecece8',navy:'#111d34',black:'#08090b'};
let stage='preparing',garment='white',ink='#00aeef',erasing=false,pointerId=null,lastPoint=null,hasArtwork=false;
let ready=false,loadingPromise=null,loadError=null,renderer,scene,camera,model,shirt,press,printer,filmRoot,filmPlane,filmMaterial,whitePlane,whiteMaterial,mixer,action,events,clip;
let printed=false,cycleTime=0,lastFrame=performance.now(),yaw=0,pitch=0,distance=1.3,orbitPointer=null,revealCamera=null;
const history=[],target=new THREE.Vector3(0,1.2,1.55),orbitTarget=new THREE.Vector3();
let playing=true,lastInkStep=-1,lastWhiteStep=-1,heaterMaterial,studioFloor;
const artwork=document.createElement('canvas');artwork.width=artwork.height=2048;
const artworkContext=artwork.getContext('2d'),texture=new THREE.CanvasTexture(artwork);texture.encoding=THREE.sRGBEncoding;texture.flipY=false;
const filmArtwork=document.createElement('canvas');filmArtwork.width=1024;filmArtwork.height=662;
const filmContext=filmArtwork.getContext('2d'),filmTexture=new THREE.CanvasTexture(filmArtwork);filmTexture.encoding=THREE.sRGBEncoding;filmTexture.flipY=false;
const whiteArtwork=document.createElement('canvas');whiteArtwork.width=1024;whiteArtwork.height=662;
const whiteContext=whiteArtwork.getContext('2d'),whiteTexture=new THREE.CanvasTexture(whiteArtwork);whiteTexture.encoding=THREE.sRGBEncoding;whiteTexture.flipY=false;
const frontMaterials=[],clothMaterials=[];
function setStage(next){
  stage=next;document.body.dataset.stage=next;
  $('color-stage').hidden=next!=='color';$('draw-stage').hidden=next!=='drawing';$('studio-stage').hidden=!['preparing','prepared','printing','pressing','result'].includes(next);
  window.scrollTo(0,0);if(renderer)resize();updateControls();
}
function checkArtwork(){
  const bytes=ctx.getImageData(0,0,drawing.width,drawing.height).data;hasArtwork=false;
  for(let i=3;i<bytes.length;i+=4)if(bytes[i]){hasArtwork=true;break;}
}
function updateControls(){
  $('print').disabled=!hasArtwork||!ready||stage!=='drawing';
  $('undo').disabled=!history.length;$('clear').disabled=!hasArtwork;$('editor-status').hidden=!loadError&&(ready||!hasArtwork);
  $('editor-status').textContent=loadError?'Não foi possível carregar o 3D. Tente novamente.':!hasArtwork?'Desenhe para imprimir sua estampa DTF.':!ready?'Preparando a impressora DTF…':'Sua estampa está pronta para imprimir.';
  $('retry').hidden=$('retry-load').hidden=!loadError;
  $('begin-drawing').hidden=stage!=='prepared';
  const running=['preparing','printing','pressing'].includes(stage);
  $('cycle-controls').hidden=!running;$('cycle-pause').textContent=playing?'Pausar':'Continuar';
  $('replay-stage').hidden=!['prepared','result'].includes(stage);
  $('replay-stage').textContent=stage==='result'?'Rever transferência':'Rever preparo';
  const phase=stage==='result'?3:stage==='pressing'?2:stage==='printing'?1:0;
  document.querySelectorAll('.cycle-steps li').forEach((item,i)=>{item.classList.toggle('active',i===phase);item.classList.toggle('complete',i<phase);if(i===phase)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
}
function updateFilmArtwork(progress,whiteProgress=0){
  for(const [canvas,context,map,p,isWhite] of [[filmArtwork,filmContext,filmTexture,progress,false],[whiteArtwork,whiteContext,whiteTexture,whiteProgress,true]]){
    const step=Math.round(THREE.MathUtils.clamp(p,0,1)*80);
    if(step===(isWhite?lastWhiteStep:lastInkStep))continue;
    if(isWhite)lastWhiteStep=step;else lastInkStep=step;
    context.clearRect(0,0,canvas.width,canvas.height);context.save();context.beginPath();
    context.rect(0,0,canvas.width,canvas.height*step/80);context.clip();
    context.translate(canvas.width,0);context.scale(-1,1);context.drawImage(drawing,0,0,canvas.width,canvas.height);
    if(isWhite){context.globalCompositeOperation='source-in';context.fillStyle='#fffffa';context.fillRect(0,0,canvas.width,canvas.height);}
    context.restore();map.needsUpdate=true;
  }
}
function remember(){if(history.length>=20)history.shift();history.push(ctx.getImageData(0,0,drawing.width,drawing.height));}
function clearArtwork(){ctx.clearRect(0,0,drawing.width,drawing.height);history.length=0;hasArtwork=false;pointerId=null;setPrinted(false);updateControls();}
function setTool(erase){
  erasing=erase;$('brush').classList.toggle('active',!erase);$('eraser').classList.toggle('active',erase);
  $('brush').setAttribute('aria-pressed',String(!erase));$('eraser').setAttribute('aria-pressed',String(erase));
}
function setInk(color){
  ink=color;$('custom-ink').value=color;setTool(false);
  document.querySelectorAll('.bottle').forEach(button=>{const selected=button.dataset.ink===color.toLowerCase();button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
}
function point(event){const r=drawing.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*drawing.width,y:(event.clientY-r.top)/r.height*drawing.height};}
function drawSegment(a,b){
  ctx.save();ctx.globalCompositeOperation=erasing?'destination-out':'source-over';ctx.strokeStyle=ctx.fillStyle=ink;
  ctx.lineWidth=Number($('size').value)*(erasing?2:1);ctx.lineCap=ctx.lineJoin='round';
  if(!a){ctx.beginPath();ctx.arc(b.x,b.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
  else{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  ctx.restore();
}
drawing.addEventListener('pointerdown',event=>{
  if(stage!=='drawing'||pointerId!==null||event.button!==0)return;
  event.preventDefault();pointerId=event.pointerId;drawing.setPointerCapture(pointerId);remember();lastPoint=point(event);drawSegment(null,lastPoint);
  checkArtwork();updateControls();
});
drawing.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointerId)return;
  for(const sample of event.getCoalescedEvents?.().length?event.getCoalescedEvents():[event]){const next=point(sample);drawSegment(lastPoint,next);lastPoint=next;}
});
function finishStroke(event){if(event.pointerId!==pointerId)return;pointerId=null;lastPoint=null;checkArtwork();updateControls();}
for(const type of ['pointerup','pointercancel','lostpointercapture'])drawing.addEventListener(type,finishStroke);
$('size').oninput=()=>{const percentage=(Number($('size').value)-2)/58*100;$('size').style.background='linear-gradient(to right,#ffe846 0 '+percentage+'%,#494e50 '+percentage+'% 100%)';};
$('brush').onclick=()=>setTool(false);$('eraser').onclick=()=>setTool(true);
$('undo').onclick=()=>{if(history.length){ctx.putImageData(history.pop(),0,0);checkArtwork();updateControls();}};
$('clear').onclick=()=>{remember();ctx.clearRect(0,0,drawing.width,drawing.height);hasArtwork=false;updateControls();};
document.querySelectorAll('.bottle').forEach(button=>button.onclick=()=>setInk(button.dataset.ink));
$('custom-ink').oninput=event=>setInk(event.target.value);
document.querySelectorAll('.garment').forEach(button=>button.onclick=()=>{
  garment=button.dataset.garment;document.querySelectorAll('.garment').forEach(item=>{const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));});updateTexture();applyGarmentColor();
});
$('begin-drawing').onclick=()=>{clearArtwork();$('studio-eyebrow').textContent='01 — IMPRESSORA PREPARADA';$('studio-title').textContent='Sua ideia começa aqui.';setStage('drawing');$('draw-title').setAttribute('tabindex','-1');$('draw-title').focus({preventScroll:true});};
$('back-color').onclick=()=>{setStage('prepared');$('begin-drawing').focus({preventScroll:true});};
$('continue').onclick=()=>{
  if(stage!=='color'||!ready)return;
  $('result-actions').hidden=true;$('studio-eyebrow').textContent='04 — PRENSANDO SUA CAMISETA';$('studio-title').textContent='A estampa está sendo transferida.';
  playing=true;action.paused=false;seek(events.shirtArrives);setStage('pressing');lastFrame=performance.now();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){mixer.setTime(events.revealEnds);cycleTime=events.revealEnds;setPrinted(true);finishCycle();}
  else action.paused=false;
};
function updateTexture(){
  artworkContext.fillStyle=inkColors[garment];artworkContext.fillRect(0,0,2048,2048);
  // Mesh UV uses U=(x+.45)/.9, V=z/.74. glTF CanvasTexture has flipY=false.
  // This UV rectangle is on the front panel and follows the existing cloth folds.
  const width=.32,height=width*drawing.height/drawing.width,top=.565;
  artworkContext.drawImage(drawing,(.45-width/2)/.9*2048,(.74-top)/.74*2048,width/.9*2048,height/.74*2048);
  texture.needsUpdate=true;
}
function applyGarmentColor(){
  for(const material of clothMaterials){material.color.set(inkColors[garment]).convertSRGBToLinear();material.envMapIntensity=.22;material.roughness=.88;}
  for(const material of frontMaterials){material.color.set(printed?'#ffffff':inkColors[garment]).convertSRGBToLinear();material.map=printed?texture:null;material.needsUpdate=true;}
}
function setPrinted(value){printed=value;applyGarmentColor();}
function resize(){
  if(!renderer||$('studio-stage').hidden)return;
  const bounds=$('viewport').getBoundingClientRect();if(bounds.width<1||bounds.height<1)return;
  renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();
}
function canOrbit(){return stage==='result'||stage==='prepared';}
function shotAt(t){
  const shots=events.shots;let i=0;while(i<shots.length-2&&shots[i+1].time<t)i++;
  const a=shots[i],b=shots[i+1],u=THREE.MathUtils.clamp((t-a.time)/(b.time-a.time),0,1),f=u*u*(3-2*u);
  return {position:new THREE.Vector3().fromArray(a.position).lerp(new THREE.Vector3().fromArray(b.position),f),target:new THREE.Vector3().fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target),f)};
}
function cameraShot(t){
  const shot=shotAt(t),scale=Math.max(1,1/Math.max(.42,camera.aspect));
  camera.position.copy(shot.target).add(shot.position.sub(shot.target).multiplyScalar(scale));camera.lookAt(shot.target);
}
function resetPrinterView(){
  const shot=shotAt(6.5),offset=shot.position.sub(shot.target);orbitTarget.copy(shot.target);
  distance=offset.length()*Math.max(1,1/Math.max(.42,camera.aspect));yaw=Math.atan2(offset.x,offset.z);pitch=Math.asin(offset.y/offset.length());
}
function positionOrbitCamera(center){
  const horizontal=distance*Math.cos(pitch);
  camera.position.set(center.x+Math.sin(yaw)*horizontal,center.y+Math.sin(pitch)*distance,center.z+Math.cos(yaw)*horizontal);camera.lookAt(center);
}
function makeRenderer(){
  if(renderer)return;
  renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.02,30);
  scene.add(new THREE.HemisphereLight(0xe8efff,0x242830,.75));
  const key=new THREE.DirectionalLight(0xfff8ef,1.15);key.position.set(-3.5,5,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:3,top:4,bottom:-3,near:.1,far:15});key.shadow.normalBias=.0015;key.shadow.bias=-.0001;scene.add(key);
  const fill=new THREE.DirectionalLight(0xdbe7ff,.5);fill.position.set(3,2,2);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,.9);rim.position.set(0,3,-3);scene.add(rim);
  const room=new THREE.Scene();room.background=new THREE.Color(0x454c55);
  for(const [x,y,z,w,h,d]of[[-3,2,1,.1,4,2],[3,2,0,.1,3,2],[0,4,0,4,.1,3]]){const panel=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:0xffffff}));panel.position.set(x,y,z);room.add(panel);}
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.04).texture;pmrem.dispose();
  room.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();obj.material.dispose();}});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:new THREE.Color(0x171d26).convertSRGBToLinear(),roughness:1,metalness:0,envMapIntensity:0}));floor.rotation.x=-Math.PI/2;floor.position.y=-.021;floor.receiveShadow=true;scene.add(floor);
  studioFloor=floor;
  scene.fog=new THREE.FogExp2(0x10151d,.035);
  new ResizeObserver(resize).observe($('viewport'));window.addEventListener('resize',resize);
  const canvas=$('scene');
  canvas.addEventListener('pointerdown',event=>{if(!canOrbit()||event.button!==0)return;orbitPointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!canOrbit()||!orbitPointer||event.pointerId!==orbitPointer.id)return;yaw-=(event.clientX-orbitPointer.x)*.009;pitch=THREE.MathUtils.clamp(pitch+(event.clientY-orbitPointer.y)*.006,-1.15,1.15);orbitPointer.x=event.clientX;orbitPointer.y=event.clientY;});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{orbitPointer=null;});
  canvas.addEventListener('wheel',event=>{if(!canOrbit())return;event.preventDefault();distance=THREE.MathUtils.clamp(distance+event.deltaY*.001,stage==='prepared'?2:.85,stage==='prepared'?7:3.5);},{passive:false});
  canvas.addEventListener('keydown',event=>{if(!canOrbit()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home'){if(stage==='prepared')resetPrinterView();else resetView();}else if(event.key==='ArrowLeft')yaw-=.2;else if(event.key==='ArrowRight')yaw+=.2;else pitch=THREE.MathUtils.clamp(pitch+(event.key==='ArrowUp'?.15:-.15),-.25,1.15);});
  document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();});
  requestAnimationFrame(animate);
}
function batchPressGeometry(){
  // Keep all Blender animation roots; merge only their stationary child geometry.
  model.updateMatrixWorld(true);
  const animated=new Set(clip.tracks.map(track=>track.name.split('.')[0])),buckets=new Map(),meshes=[];
  press.traverse(object=>{if(object.isMesh&&!Array.isArray(object.material))meshes.push(object);});
  for(const object of meshes){
    let scope=press;
    for(let parent=object.parent;parent&&parent!==press;parent=parent.parent)if(animated.has(parent.name)){scope=parent;break;}
    const key=scope.uuid+'|'+object.material.name;
    if(!buckets.has(key))buckets.set(key,{scope,material:object.material,geometries:[]});
    const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().copy(scope.matrixWorld).invert().multiply(object.matrixWorld));
    buckets.get(key).geometries.push(geometry);object.parent.remove(object);
  }
  for(const {scope,material,geometries}of buckets.values()){
    const geometry=new THREE.BufferGeometry();
    for(const name of ['position','normal','uv']){
      if(!geometries.every(item=>item.attributes[name]))continue;
      const itemSize=geometries[0].attributes[name].itemSize,total=geometries.reduce((sum,item)=>sum+item.attributes[name].count*itemSize,0);
      const values=new Float32Array(total);let offset=0;
      for(const item of geometries){const attribute=item.attributes[name];for(let i=0;i<attribute.count;i++)for(let j=0;j<itemSize;j++)values[offset++]=attribute.array[i*itemSize+j];}
      geometry.setAttribute(name,new THREE.BufferAttribute(values,itemSize));
    }
    geometry.computeBoundingSphere();
    const merged=new THREE.Mesh(geometry,material);merged.name='Grupo_'+material.name;merged.castShadow=!material.transparent;merged.receiveShadow=true;scope.add(merged);
    for(const item of geometries)item.dispose();
  }
}

async function loadScene(){
  if(ready)return;if(loadingPromise)return loadingPromise;loadError=null;updateControls();
  loadingPromise=(async()=>{
    try{
      makeRenderer();
      const loader=new THREE.GLTFLoader();
      const [g,metadata]=await Promise.all([new Promise((resolve,reject)=>loader.load('assets/personalizacao_dtf.glb?v=real-dtf-5',resolve,undefined,reject)),fetch('assets/ciclo.json?v=real-dtf-5').then(response=>{if(!response.ok)throw Error('Cronologia indisponível');return response.json();})]);
      model=g.scene;events=metadata;shirt=model.getObjectByName(events.shirt);filmRoot=model.getObjectByName(events.film);filmPlane=model.getObjectByName(events.filmArtwork);press=model.getObjectByName(events.press);printer=model.getObjectByName(events.printer);
      whitePlane=model.getObjectByName(events.filmWhite);target.fromArray(events.resultTarget);
      if(!shirt||!filmRoot||!filmPlane||!whitePlane||!press||!printer)throw Error('Modelos 3D da impressora, filme, prensa ou camiseta ausentes.');
      clip=new THREE.AnimationClip('Ciclo_personalizacao',-1,g.animations.flatMap(item=>item.tracks));
      if(!clip.tracks.length)throw Error('A animação exportada do Blender está incompleta.');
      model.traverse(object=>{
        if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=!shirt.getObjectById(object.id);
        object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone();
        for(const material of [].concat(object.material)){
          material.envMapIntensity=.55;
          if(/^(Algodao_|Ribana_|Interior_)/.test(material.name)||/Algodao_Branca/.test(material.name))clothMaterials.push(material);
          if(material.name==='Algodao_Frente')frontMaterials.push(material);
          if(material.name==='Arte DTF editável no navegador'){
            filmMaterial=material;material.map=filmTexture;material.side=THREE.DoubleSide;material.transparent=true;material.alphaTest=.02;material.depthWrite=false;material.needsUpdate=true;
          }
          if(material.name==='Branco de cobertura DTF'){whiteMaterial=material;material.map=whiteTexture;material.side=THREE.FrontSide;material.transparent=true;material.alphaTest=.02;material.depthWrite=false;material.needsUpdate=true;}
          if(material.name==='Filme PET translúcido'){material.transparent=true;material.opacity=.18;material.depthWrite=false;material.side=THREE.DoubleSide;material.roughness=.23;}
          if(material.name.includes('Acrilico ambar')){material.transparent=true;material.opacity=.13;material.depthWrite=false;material.roughness=.22;}
          if(material.name==='Indicador de cura')heaterMaterial=material;
        }
      });
      if(!frontMaterials.length||!filmMaterial)throw Error('Materiais da camiseta ou do filme DTF ausentes.');
      mixer=new THREE.AnimationMixer(model);action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.reset();action.play();action.paused=false;mixer.setTime(0);
      batchPressGeometry();scene.add(model);model.visible=true;ready=true;applyGarmentColor();resize();resetPrinterView();updateControls();
      $('loading').hidden=true;$('retry').hidden=true;
      $('studio-eyebrow').textContent='01 — PREPARAÇÃO';$('studio-title').textContent='Precisão começa no preparo.';setStage('preparing');lastFrame=performance.now();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){seek(events.prepareEnds);playing=false;action.paused=true;resetPrinterView();setStage('prepared');caption('01 — TK‑3002I PREPARADA','Agora, a próxima ideia é sua.','Crie sua arte para acompanhar a impressão e a transferência.');}
    }catch(error){loadError=error.message;ready=false;console.error(error);$('loading').textContent='Não foi possível carregar o 3D. Seu desenho continua salvo nesta sessão.';$('loading').hidden=false;updateControls();}
    finally{loadingPromise=null;}
  })();return loadingPromise;
}
$('retry').onclick=$('retry-load').onclick=()=>loadScene();
$('print').onclick=()=>{
  if(!ready||!hasArtwork||stage!=='drawing')return;
  pointerId=null;orbitPointer=null;lastInkStep=lastWhiteStep=-1;updateTexture();updateFilmArtwork(0);setPrinted(false);
  $('result-actions').hidden=true;$('studio-eyebrow').textContent='02 — IMPRIMINDO EM FILME DTF';$('studio-title').textContent='Sua arte está saindo da impressora.';
  playing=true;seek(events.printStarts);setStage('printing');lastFrame=performance.now();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){seek(events.colorChoice);playing=false;action.paused=true;updateFilmArtwork(1,1);setStage('color');}
};
function resetView(){yaw=0;pitch=0;distance=Math.max(1.16,.77/Math.max(.42,camera?.aspect||1));}
function seek(time){action.paused=false;mixer.setTime(time);cycleTime=time;action.paused=!playing;}
function segment(){return stage==='pressing'?[events.shirtArrives,events.revealEnds]:stage==='printing'?[events.printStarts,events.colorChoice]:[0,events.prepareEnds];}
$('cycle-pause').onclick=()=>{playing=!playing;action.paused=!playing;lastFrame=performance.now();updateControls();};
$('cycle-scrubber').oninput=event=>{playing=false;const [a,b]=segment();seek(a+Number(event.target.value)*(b-a));updateControls();};
$('replay-stage').onclick=()=>{
  const result=stage==='result';playing=true;$('result-actions').hidden=true;
  seek(result?events.shirtArrives:0);setStage(result?'pressing':'preparing');lastFrame=performance.now();
};
function finishCycle(){
  playing=false;action.paused=true;press.visible=false;printer.visible=false;filmRoot.visible=false;setPrinted(true);setStage('result');resetView();
  $('studio-eyebrow').textContent='05 — SUA CAMISETA PRONTA';$('studio-title').textContent='Feita com a sua ideia.';
  $('studio-status').textContent='Sua estampa aplicada ao tecido. Explore de todos os lados.';
  $('result-actions').hidden=false;
}
function caption(kicker,title,description){
  for(const [id,text] of [['studio-eyebrow',kicker],['studio-title',title],['studio-status',description]])if($(id).textContent!==text)$(id).textContent=text;
}
function cut(t,center){return THREE.MathUtils.clamp(1-Math.max(0,Math.abs(t-center)-.10)/.30,0,1);}
function renderCycleState(){
  const t=cycleTime,isPress=stage==='pressing',isPrint=stage==='printing';
  printer.visible=['preparing','prepared','printing'].includes(stage);
  press.visible=isPress&&t<39.55;shirt.visible=isPress||stage==='result';
  studioFloor.visible=stage!=='result'&&!(isPress&&t>=39.55);
  filmRoot.visible=isPrint||(isPress&&t>=events.filmPlaced&&t<38.9);
  const transferComplete=isPress&&t>=events.printAppears||stage==='result';
  if(printed!==transferComplete)setPrinted(transferComplete);
  filmPlane.visible=whitePlane.visible=!transferComplete;
  const powder=model.getObjectByName('APLICADOR_PO');if(powder)powder.visible=isPrint&&t>=14&&t<16.4;
  const refill=model.getObjectByName('FRASCO_CIANO');if(refill)refill.visible=stage==='preparing'&&t<6;
  if(heaterMaterial){heaterMaterial.emissive.setHex(0xff7b24);heaterMaterial.emissiveIntensity=isPrint&&t>=16&&t<19.5?1.1:0;}
  if(isPrint)updateFilmArtwork((t-7)/5,(t-12)/2.1);
  if(stage==='prepared')positionOrbitCamera(orbitTarget);
  else if(stage==='result')positionOrbitCamera(target);
  else cameraShot(t);
  $('shot-fade').style.opacity=isPress?Math.max(cut(t,20.1),cut(t,27.94),cut(t,39.55)):0;
  if(['preparing','printing','pressing'].includes(stage)){
    const [a,b]=segment();$('cycle-scrubber').value=THREE.MathUtils.clamp((t-a)/(b-a),0,1);
    $('cycle-time').textContent=Math.round(t-a).toString().padStart(2,'0')+' / '+Math.round(b-a)+' s';
  }
  if(stage==='preparing')caption('01 — PREPARAÇÃO','Cada cor, no seu reservatório.',t<1.7?'Abertura do reservatório para reposição manual.':t<4.4?'Reposição de tinta ciano. CMYK e branco têm circuitos separados.':'Reservatório fechado. Filme PET preparado para impressão.');
  if(isPrint){
    if(t<12)caption('02 — IMPRESSÃO CMYK','Sua arte ganha forma no filme.','O carro percorre o trilho. A arte é impressa espelhada sobre o PET.');
    else if(t<14.2)caption('02 — CAMADA BRANCA','Cor com uma base consistente.','O branco é impresso sobre a arte e formará sua base no tecido.');
    else if(t<16)caption('02 — PÓ TERMOCOLANTE','Adesivo apenas sobre a tinta.','O shaker distribui o pó sobre a tinta úmida e retira o excesso.');
    else if(t<18.7)caption('02 — CURA NO FORNO','O filme atravessa o forno.','O calor funde o adesivo antes da transferência para o tecido.');
    else caption('02 — TRANSFER PRONTO','Impressão e cura concluídas.','O transfer é separado do rolo para aplicação na camiseta.');
  }
  if(isPress){
    if(t<23.3)caption('04 — PREPARO DO TECIDO','Camiseta apoiada e alinhada.','A bandeja leva o tecido estendido para a área de prensagem.');
    else if(t<27.8)caption('04 — PRÉ-PRENSAGEM','Uma superfície pronta para receber a arte.','A pré-prensagem alisa o tecido antes do posicionamento do transfer.');
    else if(t<30.3)caption('04 — POSICIONAMENTO MANUAL','A arte no lugar certo.','Filme alinhado sobre o peito, com tinta e adesivo voltados para o tecido.');
    else if(t<33.85)caption('04 — TRANSFERÊNCIA','Calor, contato e pressão.','A placa térmica mantém pressão uniforme sobre o transfer.');
    else if(t<35.8)caption('04 — ABERTURA E RESFRIAMENTO','A bandeja retorna ao operador.','A placa abre. O conjunto repousa antes da retirada do filme.');
    else if(t<39.5)caption('04 — RETIRADA DO PET','O filme sai. A estampa fica.','O suporte é retirado progressivamente, em ângulo baixo.');
    else caption('05 — SUA CAMISETA PRONTA','Feita com a sua ideia.','Sua estampa aplicada ao tecido. Explore de todos os lados.');
  }
}
function animate(now){
  requestAnimationFrame(animate);const delta=Math.max(0,Math.min((now-lastFrame)/1000,.08));lastFrame=now;
  if(document.hidden||!ready||!['preparing','prepared','printing','pressing','result'].includes(stage))return;
  if(playing&&['preparing','printing','pressing'].includes(stage)){
    mixer.update(delta);cycleTime=action.time;
    if(stage==='preparing'&&cycleTime>=events.prepareEnds){
      seek(events.prepareEnds);playing=false;action.paused=true;resetPrinterView();setStage('prepared');caption('01 — TK‑3002I PREPARADA','Agora, a próxima ideia é sua.','Crie sua arte para acompanhar a impressão e a transferência.');
    }else if(stage==='printing'&&cycleTime>=events.colorChoice){
      seek(events.colorChoice);playing=false;action.paused=true;updateFilmArtwork(1,1);setStage('color');return;
    }else if(stage==='pressing'&&cycleTime>=events.revealEnds){
      seek(events.revealEnds);finishCycle();
    }
  }
  renderCycleState();renderer.render(scene,camera);
}
// Read-only diagnostics used to verify the exported clip and the exact artwork.
window.tekmakStudio=Object.freeze({snapshot:(includeArtwork=false)=>({stage,garment,ink,ready,hasArtwork,printed,cycleTime,clip:clip?.name,duration:clip?.duration,shirt:shirt?.getWorldPosition(new THREE.Vector3()).toArray(),tray:model?.getObjectByName('BANDEJA_MOVEL_DIANTEIRA')?.getWorldPosition(new THREE.Vector3()).toArray(),frontMaterials:frontMaterials.length,artwork:includeArtwork?drawing.toDataURL():null,texture:includeArtwork?artwork.toDataURL():null,actionEnabled:action?.enabled,actionPaused:action?.paused,mixerTime:mixer?.time,renderCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,camera:camera?.position.toArray(),cameraFree:canOrbit(),yaw,pitch,distance})});
updateControls();loadScene();
})();
