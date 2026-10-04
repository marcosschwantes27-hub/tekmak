/* Ciclo demonstrativo: descida, contato e retorno da placa aquecida. */
(function(root){
  'use strict';
  const DOWN=800,HOLD=0,UP=900,WAIT=2000,DURATION=DOWN+HOLD+UP;
  const ease=t=>t*t*(3-2*t);
  function amountAt(elapsed){
    if(elapsed<=0||elapsed>=DURATION)return 0;
    if(elapsed<DOWN)return ease(elapsed/DOWN);
    if(elapsed<DOWN+HOLD)return 1;
    return 1-ease((elapsed-DOWN-HOLD)/UP);
  }
  function connect(head,THREE,onState){
    const name=o=>o.name.replace(/_/g,' ').toLocaleLowerCase('pt-BR');
    const pieces=[...head.children],moving=new THREE.Group();moving.name='PRENSA_VERTICAL';head.add(moving);
    const triggers=new Set(),buttonParts=[],flexible=[];
    let piston,plate;
    head.updateWorldMatrix(true,true);
    for(const o of pieces){
      const n=name(o);
      if(n.startsWith('emergência | ')&&!n.includes('placa')&&!n.includes('legenda')||n.startsWith('detalhe | ')&&/cogumelo|face do botão|estria do pescoço/.test(n)){
        triggers.add(o);buttonParts.push({object:o,z:o.position.z});
      }
      if(n.startsWith('aquecedor | êmbolo central')){piston=o;continue;}
      if(n.startsWith('aquecedor | chapa de contato'))plate=o;
      if(n.startsWith('aquecedor | ')||n.startsWith('detalhe | ')&&(/mola|rebite da caixa térmica/.test(n)||n.includes('canal da bucha')&&o.position.y<.35))moving.attach(o);
      if(n.startsWith('conduíte | ')&&o.isMesh){
        o.geometry=o.geometry.clone();
        const attribute=o.geometry.attributes.position,original=attribute.array.slice(),weights=new Float32Array(attribute.count);
        const inverse=o.matrixWorld.clone().invert();
        const down=new THREE.Vector3(0,-1,0).applyMatrix4(inverse).sub(new THREE.Vector3().applyMatrix4(inverse));
        const vertex=new THREE.Vector3();
        for(let i=0;i<attribute.count;i++){
          vertex.fromBufferAttribute(attribute,i).applyMatrix4(o.matrixWorld);
          weights[i]=THREE.MathUtils.clamp((.355-vertex.y)/(.355-.248),0,1);
        }
        flexible.push({object:o,attribute,original,weights,down});
      }
    }
    if(!plate||!piston||!triggers.size||!moving.children.length)throw Error('Componentes do ciclo da prensa ausentes');
    // The heater underside touches the existing silicone pad without crossing it.
    const plateBottom=new THREE.Box3().setFromObject(plate).min.y;
    const pad=head.parent.children.flatMap(o=>[o,...o.children]).find(o=>name(o).startsWith('bandeja | silicone vermelho'));
    if(!pad)throw Error('Bandeja da prensa ausente');
    const stroke=plateBottom-new THREE.Box3().setFromObject(pad).max.y;
    if(!(stroke>0&&stroke<.1))throw Error('Curso vertical inválido');
    piston.geometry.computeBoundingBox();
    const pistonHeight=piston.geometry.boundingBox.max.y-piston.geometry.boundingBox.min.y;
    const pistonY=piston.position.y,pistonScale=piston.scale.y;
    let start=null,last=0,repeating=false,nextStart=null;
    function apply(amount){
      const displacement=stroke*amount;
      moving.position.y=-displacement;
      piston.position.y=pistonY-displacement/2;
      piston.scale.y=pistonScale+displacement/pistonHeight;
      for(const part of buttonParts)part.object.position.z=part.z-(amount>0?.002:0);
      for(const part of flexible){
        const {attribute,original,weights,down}=part;
        for(let i=0;i<attribute.count;i++){
          const d=displacement*weights[i],j=i*3;
          attribute.setXYZ(i,original[j]+down.x*d,original[j+1]+down.y*d,original[j+2]+down.z*d);
        }
        attribute.needsUpdate=true;part.object.geometry.computeVertexNormals();part.object.geometry.computeBoundingSphere();
      }
    }
    function begin(now){if(start!==null)return false;start=now;nextStart=null;onState('descendo');return true;}
    return {
      get busy(){return start!==null;},
      isTrigger:o=>triggers.has(o),
      start:begin,
      repeat(now){if(repeating)return;repeating=true;if(start===null){nextStart=now+WAIT;onState('aguardando');}},
      update(now,canStart=true){
        if(start===null){
          if(!repeating||now<nextStart||!canStart)return false;
          begin(now);
        }
        const elapsed=now-start,amount=amountAt(elapsed);
        if(amount!==last){apply(amount);last=amount;}
        if(elapsed>=DURATION){start=null;nextStart=repeating?now+WAIT:null;onState(repeating?'aguardando':'pronta');}
        else onState(elapsed<DOWN?'descendo':elapsed<DOWN+HOLD?'prensando':'subindo');
        return true;
      }
    };
  }
  function shuttle(head,press,now,onTravel,travel=.40){
    if(press.busy)throw Error('A placa deve estar levantada ao iniciar o ciclo lateral');
    head.position.x=travel/2;
    let automatic=true,stage='moving',side=0,from=head.position.x,moveStart=now,moveDuration=WAIT/2,pressAt=now+WAIT;
    onTravel('esquerda');
    function move(time){
      side=1-side;from=head.position.x;moveStart=time;
      moveDuration=WAIT*Math.abs(side*travel-from)/travel;
      pressAt=time+WAIT;stage='moving';onTravel(side?'direita':'esquerda');
    }
    function beginPress(time){if(stage!=='waiting'||Math.abs(head.position.x-side*travel)>1e-6)return false;if(!press.start(time))return false;stage='pressing';return true;}
    return {
      get busy(){return stage==='moving'||press.busy;},
      setAutomatic(value,time){
        automatic=value;
        if(press.busy)return;
        side=head.position.x<travel/2?0:1;
        if(value){from=head.position.x;moveStart=time;moveDuration=Math.max(1,WAIT*Math.abs(side*travel-from)/travel);pressAt=time+WAIT;stage='moving';onTravel(side?'direita':'esquerda');}
        else {stage='waiting';pressAt=Infinity;onTravel('manual');}
      },
      setPosition(x){
        if(automatic||press.busy)return false;
        head.position.x=Math.max(0,Math.min(travel,x));side=head.position.x<travel/2?0:1;
        stage='waiting';onTravel('manual');return true;
      },
      align(time){
        if(automatic||press.busy)return false;
        from=head.position.x;side=from<travel/2?0:1;moveStart=time;
        moveDuration=Math.max(1,WAIT*Math.abs(side*travel-from)/travel);
        pressAt=Infinity;stage='moving';onTravel(side?'direita':'esquerda');return true;
      },
      pressNow:beginPress,
      update(time){
        if(stage==='pressing'){
          const changed=press.update(time,false);
          if(!press.busy){if(automatic)move(time);else{stage='waiting';onTravel('manual');}}
          return changed;
        }
        let changed=false;
        if(stage==='moving'){
          const t=Math.min(1,Math.max(0,(time-moveStart)/moveDuration));
          head.position.x=from+(side*travel-from)*ease(t);changed=true;
          if(t===1){head.position.x=side*travel;stage='waiting';onTravel(automatic?'aguardando':'manual');}
        }
        if(automatic&&stage==='waiting'&&time>=pressAt){beginPress(time);changed=true;}
        return changed;
      }
    };
  }
  const api={amountAt,connect,shuttle,DURATION,DOWN,UP,WAIT};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TekmakPress=api;
})(typeof window!=='undefined'?window:globalThis);
