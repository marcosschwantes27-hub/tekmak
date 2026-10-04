/* Ciclo automático da prensa dupla, com alinhamento às bandejas reais do GLB. */
(function(root){
  'use strict';
  const DOWN=800,UP=900,WAIT=2000,DURATION=DOWN+UP;
  const ease=t=>t*t*(3-2*t);
  function connect(head,THREE,onState=()=>{}){
    const name=o=>o.name.replace(/_/g,' ').toLocaleLowerCase('pt-BR');
    const assembly=head.parent,pieces=[...head.children],pads=[];
    assembly.updateWorldMatrix(true,true);
    assembly.traverse(o=>{if(o.isMesh&&/^bandeja \d+ \| silicone/.test(name(o)))pads.push(o);});
    pads.sort((a,b)=>a.getWorldPosition(new THREE.Vector3()).x-b.getWorldPosition(new THREE.Vector3()).x);
    const plate=pieces.find(o=>name(o).startsWith('aquecedor | chapa inferior'));
    if(pads.length!==2||!plate)throw Error('Bandejas ou chapa da prensa dupla ausentes');
    const bounds=new THREE.Box3().setFromObject(plate),center=bounds.getCenter(new THREE.Vector3());
    const stations=pads.map(pad=>head.position.x+new THREE.Box3().setFromObject(pad).getCenter(new THREE.Vector3()).x-center.x);
    const stroke=bounds.min.y-new THREE.Box3().setFromObject(pads[0]).max.y;
    if(!(stroke>0&&stroke<.25))throw Error('Curso vertical inválido');
    if(Math.abs(new THREE.Box3().setFromObject(pads[0]).max.y-new THREE.Box3().setFromObject(pads[1]).max.y)>.0001)throw Error('Bandejas em alturas diferentes');
    const moving=new THREE.Group();moving.name='PRENSA_VERTICAL';head.add(moving);
    const flexible=[];
    function flex(object,piston){
      object.geometry=object.geometry.clone();
      const attribute=object.geometry.attributes.position,original=attribute.array.slice(),weights=new Float32Array(attribute.count);
      const inverse=object.matrixWorld.clone().invert();
      const down=new THREE.Vector3(0,-1,0).applyMatrix4(inverse).sub(new THREE.Vector3().applyMatrix4(inverse));
      const box=new THREE.Box3().setFromObject(object),top=piston?box.max.y:1.605,bottom=piston?box.min.y:1.480;
      const vertex=new THREE.Vector3();
      for(let i=0;i<attribute.count;i++){
        vertex.fromBufferAttribute(attribute,i).applyMatrix4(object.matrixWorld);
        weights[i]=THREE.MathUtils.clamp((top-vertex.y)/(top-bottom),0,1);
      }
      flexible.push({object,attribute,original,weights,down});
    }
    for(const object of pieces){
      const n=name(object);
      if(n.startsWith('aquecedor | êmbolo vertical')){flex(object,true);continue;}
      if(n.startsWith('conduíte | ')&&object.isMesh){flex(object,false);continue;}
      if(n.startsWith('aquecedor | ')||n.startsWith('sinal | ')||n.startsWith('etiqueta | ')||
         n.startsWith('detalhe realista | ')&&/mola|prisioneiro|bucha do pistão|anel usinado da bucha|caixa térmica/.test(n))moving.attach(object);
    }
    if(!moving.children.length||flexible.length<2)throw Error('Conjunto móvel da prensa incompleto');
    let started=null,last=0;
    function apply(amount){
      const displacement=stroke*amount;
      moving.position.y=-displacement;
      for(const part of flexible){
        const {attribute,original,weights,down}=part;
        for(let i=0;i<attribute.count;i++){
          const d=displacement*weights[i],j=i*3;
          attribute.setXYZ(i,original[j]+down.x*d,original[j+1]+down.y*d,original[j+2]+down.z*d);
        }
        attribute.needsUpdate=true;
        part.object.geometry.computeVertexNormals();
        part.object.geometry.computeBoundingSphere();
        part.object.geometry.computeBoundingBox();
      }
    }
    const press={
      get busy(){return started!==null;},
      start(now){if(started!==null)return false;started=now;onState('descendo');return true;},
      update(now){
        if(started===null)return false;
        const elapsed=now-started;
        const amount=elapsed>=DURATION?0:elapsed<DOWN?ease(Math.max(0,elapsed)/DOWN):1-ease((elapsed-DOWN)/UP);
        if(amount!==last){apply(amount);last=amount;}
        if(elapsed>=DURATION){started=null;onState('pronta');}
        else onState(elapsed<DOWN?'descendo':'subindo');
        return true;
      }
    };
    return {press,stations,stroke,moving,plate,pads};
  }
  function shuttle(head,cycle,now,onState=()=>{}){
    const {press,stations}=cycle,travel=stations[1]-stations[0];
    head.position.x=(stations[0]+stations[1])/2;
    let side=0,stage='moving',from=head.position.x,start=now,duration=WAIT/2,pressAt=now+WAIT;
    onState('esquerda');
    return {update(time){
      if(stage==='pressing'){
        press.update(time);
        if(!press.busy){
          side=1-side;from=head.position.x;start=time;duration=WAIT*Math.abs(stations[side]-from)/travel;
          pressAt=time+WAIT;stage='moving';onState(side?'direita':'esquerda');
        }
        return true;
      }
      let changed=false;
      if(stage==='moving'){
        const t=THREEClamp((time-start)/duration);
        head.position.x=from+(stations[side]-from)*ease(t);changed=true;
        if(t===1){head.position.x=stations[side];stage='waiting';onState('aguardando');}
      }
      if(stage==='waiting'&&time>=pressAt){press.start(time);stage='pressing';changed=true;}
      return changed;
    }};
  }
  function THREEClamp(value){return Math.min(1,Math.max(0,value));}
  const api={connect,shuttle,DOWN,UP,WAIT,DURATION};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TekmakDualPress=api;
})(typeof window!=='undefined'?window:globalThis);
