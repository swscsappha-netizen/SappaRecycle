/* Original artwork poses. Characters animate independently; no pose crossfades. */
(function(root){
 'use strict';
 const definitions={
  rewards:{sheet:1,col:2,row:0,split:351,whole:true,label:'ชี้แนะนำของรางวัล',mode:'present'},
  coupons:{sheet:1,col:1,row:2,split:320,label:'แสดงบัตรคูปองพร้อมใช้',mode:'card'},
  profile:{sheet:1,col:0,row:2,split:300,label:'ตรวจบัตรนักเรียน',mode:'nod'},
  ready:{sheet:1,col:0,row:3,split:300,whole:true,label:'เตรียมขวดก่อนหยอด',mode:'present'},
  confirm:{sheet:1,col:1,row:2,split:320,label:'ยืนยันรหัสนักเรียน',mode:'nod'},
  insert:{sheet:1,col:1,row:3,split:300,whole:true,label:'สาธิตหยอดขวดเข้าตู้',mode:'insert'},
  inspect:{sheet:2,col:0,row:0,split:310,whole:true,label:'ตรวจขวดด้วยแว่นขยาย',mode:'inspect'},
  points:{sheet:2,col:0,row:1,split:310,label:'ชูมือรับแต้มสำเร็จ',mode:'points',once:760},
  level:{sheet:2,col:1,row:1,split:325,label:'กระโดดดีใจเมื่อเลื่อนระดับ',mode:'level',once:780},
  success:{sheet:2,col:2,row:1,split:325,whole:true,label:'คู่หูแตะมือฉลองแลกสำเร็จ',mode:'highfive',once:780},
  loading:{sheet:2,col:0,row:2,split:305,label:'ถือป้ายรอข้อมูล',mode:'wait'},
  pending:{sheet:2,col:1,row:2,split:305,label:'พักรอคูปอง',mode:'wait'},
  error:{sheet:2,col:2,row:3,split:350,label:'ชี้คำแนะนำให้ลองใหม่',mode:'retry'}
 };
 const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 function poseAt(scene,ms,index,still=false){
  const d=definitions[scene]||definitions.rewards,phase=index? .55:0,t=ms/1000;
  const p={x:0,y:0,angle:0,accent:1};if(still)return p;
  const breath=Math.sin(t*2*Math.PI/4.8+phase);
  p.angle=breath*.16;
  switch(d.mode){
   case 'present':p.angle=(!index?-.8:.45)*Math.sin(t*2*Math.PI/3.6+phase);p.x=index?0:Math.sin(t*2*Math.PI/3.6)*.65;break;
   case 'card':p.angle=(!index?-.65:.5)*Math.sin(t*2*Math.PI/4+phase);break;
   case 'nod':p.angle=!index?Math.sin(t*2*Math.PI/3.8)*.65:breath*.2;break;
   case 'insert':{const cycle=(ms%4200)/4200,q=ease((cycle-.12)/.3)*(1-ease((cycle-.62)/.25));p.x=index?-3*q:0;p.angle=index?-1.2*q:0;break;}
   case 'inspect':p.angle=index?Math.sin(t*2*Math.PI/4)*.6:Math.sin(t*2*Math.PI/4)*-.6;break;
   case 'wait':p.angle=Math.sin(t*2*Math.PI/5.5+phase)*.22;break;
   case 'retry':p.angle=(!index?-.55:.2)*Math.sin(t*2*Math.PI/4.5);break;
   case 'points':case 'level':{const q=Math.min(1,ms/d.once),jump=Math.sin(q*Math.PI);p.y=-jump*(d.mode==='level'?10:5)*(index?.8:1);p.angle=Math.sin(q*2*Math.PI)*(index?-1.3:1.3);break;}
   case 'highfive':{const q=Math.min(1,ms/d.once),contact=ease(q/.36)*(1-ease((q-.65)/.35));p.x=(index?-3:3)*(1-contact);p.angle=(index?-1:1)*Math.sin(q*Math.PI);p.x=0;p.y=-2*Math.sin(q*Math.PI);p.angle=0;break;}
  }
  return p;
 }
 function create(host,{scene='rewards',onReady=()=>{}}={}){
  const d=definitions[scene]||definitions.rewards,doc=root.document,media=root.matchMedia('(prefers-reduced-motion: reduce)');
  const src=new URL('assets/mascot-actions/'+scene+'.png',doc.baseURI).href,id='pose-'+Math.random().toString(36).slice(2);
  const image=`<image href="${src}" x="0" y="0" width="512" height="288"/>`;
  host.innerHTML=`<svg class="duo-rig scene-pose-rig" viewBox="0 0 640 330" role="img" aria-label="${d.label}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}-cell"><rect width="512" height="288"/></clipPath><clipPath id="${id}-machine"><rect width="${d.whole?512:d.split}" height="288"/></clipPath><clipPath id="${id}-bottle"><rect x="${d.split}" width="${512-d.split}" height="288"/></clipPath></defs><g transform="translate(64 19)">${(d.whole?['machine']:['machine','bottle']).map(name=>`<g data-pose-character="${name}"><g clip-path="url(#${id}-${name})"><g clip-path="url(#${id}-cell)">${image}</g></g></g>`).join('')}</g></svg>`;
  const svg=host.querySelector('svg'),actors=[...host.querySelectorAll('[data-pose-character]')];svg.style.visibility='hidden';
  let elapsed=0,previous=null,raf=0,paused=true,visible=true,ready=false,destroyed=false;
  host.dataset.assetState='loading';host.dataset.pose=scene;
  function render(){actors.forEach((el,index)=>{const p=poseAt(scene,elapsed,d.whole?0:index,media.matches),pivot=d.whole?[256,269]:index?[410,269]:[170,269];el.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.angle} ${pivot[0]} ${pivot[1]})`);});host.dataset.phase=d.once&&elapsed<d.once?'action':'idle';}
  function frame(time){raf=0;if(destroyed||paused||!visible||doc.hidden||!ready)return;if(previous!==null)elapsed+=Math.min(50,time-previous);previous=time;render();if(!media.matches&&(!d.once||elapsed<d.once))raf=root.requestAnimationFrame(frame);}
  function sync(){root.cancelAnimationFrame(raf);raf=0;previous=null;if(!ready||destroyed)return;if(media.matches){render();return;}if(!paused&&visible&&!doc.hidden)raf=root.requestAnimationFrame(frame);}
  const observer='IntersectionObserver'in root?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}):null;observer?.observe(host);
  doc.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);
  const img=new Image();img.onload=()=>{if(destroyed)return;ready=true;host.classList.add('has-rig');host.dataset.assetState='ready';svg.style.visibility='visible';render();sync();onReady();};img.onerror=()=>{if(destroyed)return;host.dataset.assetState='fallback';svg.remove();};img.src=src;
  return {greet(){elapsed=0;render();sync();},replay(){elapsed=0;render();sync();},pause(){paused=true;sync();},resume(){if(!paused)return;paused=false;sync();},get elapsed(){return elapsed;},destroy(){destroyed=true;root.cancelAnimationFrame(raf);observer?.disconnect();doc.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);img.onload=img.onerror=null;host.replaceChildren();host.classList.remove('has-rig');}};
 }
 root.SapphaScenePlayer={create,definitions,has:scene=>Object.hasOwn(definitions,scene)};
 if(typeof module!=='undefined'&&module.exports)module.exports={definitions,poseAt};
})(typeof window!=='undefined'?window:globalThis);
