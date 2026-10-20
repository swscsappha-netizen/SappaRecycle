(function(root){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const directory='assets/mascot-original-rig/';
 const parts={machine:{body:'v3/machine-body.png',right:'v3/machine-arm.png'},bottle:{body:'v3/bottle-body-clean.png',right:'v3/bottle-arm.png'}};
 // Keep the original face/glove artwork. Complete arms rotate behind intact bodies.
 // Small grounded steps fit the original short legs. Source-contour overlap
 // keeps the hips covered while support feet cancel the actor travel.
 function poseAt(ms,kind='machine',still=false){
  const neutral={offset:0,lift:0,opacity:1,bodyY:0,bodyAngle:0,left:0,right:0,hand:0,feet:[{x:0,y:0,angle:0},{x:0,y:0,angle:0}]};
  if(still)return neutral;
  const bottle=kind==='bottle',delay=bottle?240:0,duration=3000;
  const u=clamp((ms-delay)/duration),accel=.12,decel=.16,normal=1-(accel+decel)/2;
  const entry=u<accel?u*u/(2*accel*normal):u>1-decel?1-(1-u)*(1-u)/(2*decel*normal):(u-accel/2)/normal;
  const direction=bottle?-1:1,distance=bottle?44:72;
  const envelope=smooth(u/.12)*(1-smooth((u-.86)/.14));
  const cycle=entry*4,feet=[0,.5].map(shift=>{
   const phase=(cycle+shift)%1,swing=phase>=.6,q=clamp((phase-.6)/.4),stride=distance/4;
   // Support lasts 60% of a cycle. Counter-translation cancels actor travel,
   // keeping the planted sole level; only the returning foot lifts.
   const x=(swing?-.3+.6*smooth(q):.3-phase)*stride*direction;
   return {x:x*envelope,y:swing?-3*Math.sin(q*Math.PI)*envelope:0,angle:swing?-direction*2*Math.sin(q*Math.PI)*envelope:0};
  });
  const t=Math.max(0,ms-3300-delay)/1000,wave=smooth(t/.5)*(1-smooth((t-2.3)/.6));
  const breath=Math.sin(t*2*Math.PI/4.8+(bottle?.7:0));
  const idle=smooth((t-3)/.8),little=Math.sin(t*2*Math.PI/6.8+(bottle?1.4:0))*idle;
  return {...neutral,feet,offset:-direction*distance*(1-entry),
   bodyY:.7*(1-Math.cos(cycle*4*Math.PI))*envelope+breath*.25,
   bodyAngle:direction*.25*envelope+breath*.1,
   right:Math.sin(cycle*2*Math.PI)*1.8*envelope-(1-Math.cos(t*2*Math.PI/1.1))*.5*wave*(bottle?9:7)-(1+little)*.3*idle};
 }
 function create(host,{onPhase=()=>{},reduced:forced=false,reference=false,startAt=0}={}){
  const doc=root.document,media=root.matchMedia('(prefers-reduced-motion: reduce)');
  const url=file=>new URL(directory+file,doc.baseURI).href;
  const image=file=>`<image href="${url(file)}" x="0" y="0" width="512" height="256"/>`;
  const joints={machine:{left:[93,127],right:[253,148],hand:[283,132],pivot:[174,251]},bottle:{left:[365,176],right:[442,174],hand:[455,162],pivot:[407,251]}};
  // Contour masks follow the cabinet/bottle base, with hidden overlap at
  // each hip. Whole source legs and shoes rotate together behind the torso.
  const id='duo-'+Math.random().toString(36).slice(2);
  const geometry={
   machine:{hips:[[111,205],[186,214]],torso:'0,0 512,0 512,196 260,196 236,205 221,215 200,217 170,214 130,209 103,204 90,198 88,211 0,211',
    feet:['0,211 80,211 94,202 139,205 150,220 150,256 0,256','150,219 172,219 173,210 204,212 211,214 241,211 512,211 512,256 150,256']},
   bottle:{hips:[[381,228],[423,227]],torso:'320,0 512,0 512,214 445,214 439,219 427,227 407,232 384,231 369,227 362,219 320,219',
    feet:['320,219 365,219 390,225 407,236 407,256 320,256','408,234 416,224 438,218 512,218 512,256 408,256']}
  };
  const character=name=>{const p=parts[name],g=geometry[name],prefix=id+'-'+name;
   return '<defs><clipPath id="'+prefix+'-torso"><polygon points="'+g.torso+'"/></clipPath>'+g.feet.map((points,i)=>'<clipPath id="'+prefix+'-foot-'+i+'"><polygon points="'+points+'"/></clipPath>').join('')+'</defs><g data-character="'+name+'">'+[0,1].map(i=>'<g data-foot="'+i+'"><g clip-path="url(#'+prefix+'-foot-'+i+')">'+image(p.body)+'</g></g>').join('')+'<g data-body><g data-arm="right">'+image(p.right)+'</g><g clip-path="url(#'+prefix+'-torso)">'+image(p.body)+'</g></g></g>';
  };
  host.innerHTML='<svg class="duo-rig original-duo-rig" viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="น้องตู้และน้องขวดเดินเข้ามา โบกมือ แล้วพักด้วยกัน"><g transform="translate(64 35)">'+character('machine')+character('bottle')+'</g></svg>';
  const svg=host.querySelector('svg');svg.style.visibility='hidden';
  let raf=0,elapsed=Math.max(0,Number(startAt)||0),previous=null,visible=true,paused=false,destroyed=false,ready=false,phase='loading';
  host.dataset.assetState='loading';host.dataset.phase=phase;
  const chars=['machine','bottle'].map(name=>{const node=svg.querySelector('[data-character="'+name+'"]');return {name,node,body:node.querySelector('[data-body]'),right:node.querySelector('[data-arm="right"]'),feet:[...node.querySelectorAll('[data-foot]')]};});
  const still=()=>forced||reference||media.matches;
  function render(){
   const next=still()?'idle':elapsed<3540?'entering':elapsed<6900?'greeting':'idle';
   if(next!==phase){phase=next;host.dataset.phase=phase;onPhase(phase);}
   for(const c of chars){
    const p=poseAt(elapsed,c.name,still()),j=joints[c.name];
    c.node.setAttribute('transform',`translate(${p.offset} ${p.lift})`);c.node.setAttribute('opacity',p.opacity);
    c.body.setAttribute('transform',`translate(0 ${p.bodyY}) rotate(${p.bodyAngle} ${j.pivot[0]} ${j.pivot[1]})`);
    c.feet.forEach((foot,i)=>{const f=p.feet[i],anchor=geometry[c.name].hips[i];foot.setAttribute('transform',`translate(${f.x} ${f.y}) rotate(${f.angle} ${anchor[0]} ${anchor[1]})`);});
    c.right.setAttribute('transform',`rotate(${p.right} ${j.right[0]} ${j.right[1]})`);
   }
  }
  function frame(time){raf=0;if(destroyed||paused||!visible||doc.hidden||!ready){previous=null;return;}if(still()){render();previous=null;return;}if(previous!==null)elapsed+=Math.min(50,time-previous);previous=time;render();raf=root.requestAnimationFrame(frame);}
  function sync(){root.cancelAnimationFrame(raf);raf=0;previous=null;if(!ready||destroyed)return;if(still())render();else if(!paused&&visible&&!doc.hidden)raf=root.requestAnimationFrame(frame);}
  const visibility=()=>sync(),preference=()=>sync();doc.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
  const observer='IntersectionObserver'in root?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}):null;observer?.observe(host);
  const files=[...new Set([...Object.values(parts).flatMap(Object.values),'original-static.png'])];
  Promise.all(files.map(file=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=url(file);}))).then(()=>{
   if(destroyed)return;ready=true;host.classList.add('has-rig');host.dataset.assetState='ready';svg.style.visibility='visible';render();sync();
  }).catch(()=>{if(destroyed)return;host.dataset.assetState='fallback';svg.remove();});
  return {greet(){elapsed=3540;paused=false;if(ready)render();sync();},replay(){elapsed=0;paused=false;if(ready)render();sync();},pause(){paused=true;sync();},resume(){paused=false;sync();},get elapsed(){return elapsed;},get paused(){return paused;},destroy(){destroyed=true;root.cancelAnimationFrame(raf);observer?.disconnect();doc.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);host.replaceChildren();host.classList.remove('has-rig');}};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={poseAt,parts};
 root.SapphaDuoRig={create};
})(typeof window!=='undefined'?window:globalThis);
