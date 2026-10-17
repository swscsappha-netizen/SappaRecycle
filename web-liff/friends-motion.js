(function(root){
  'use strict';
  const scenes={home:{character:'cat',pose:'wave',title:'เพื่อนตัวเล็ก ภารกิจที่ยิ่งใหญ่',hint:'หยอดวันนี้ เพื่อโรงเรียนที่น่าอยู่ทุกวัน'},rewards:{character:'rabbit',pose:'point',title:'เปลี่ยนแต้มเป็นของขวัญ',hint:'เลือกของที่ชอบ แล้วตรวจรายละเอียดก่อนแลก'},coupons:{character:'bird',pose:'wave',title:'นกน้อยพาคูปองมาส่ง',hint:'แสดง QR ให้สภานักเรียนเมื่อไปรับของรางวัล'},profile:{character:'cat',pose:'point',title:'บัตรสมาชิกแก๊งรักษ์โลก',hint:'ตรวจข้อมูลและเบอร์โทรศัพท์ให้พร้อม'},scanner:{character:'rabbit',pose:'wait',title:'จุดรับของขวัญรักษ์โลก',hint:'สแกนคูปอง ตรวจสอบ แล้วจึงยืนยันส่งมอบ'}};
  /** Presentation only. This module never calls account or credit APIs. */
  function createDirector({guide,actors=[],reduced=()=>false,changed=()=>{}}){
    let animations=[],revision=0,current='home';
    const cancel=()=>{revision++;animations.forEach(a=>a.cancel());animations=[];};
    function navigate(scene){
      if(!scenes[scene])return false;
      const old=actors.map(a=>a.getBoundingClientRect());
      cancel();current=scene;guide.dataset.scene=scene;
      actors.forEach((actor,i)=>{
        const active=actor.dataset.character===scenes[scene].character;
        actor.dataset.active=String(active);actor.dataset.pose=active?scenes[scene].pose:'idle';
      });
      changed(scenes[scene]);
      if(!reduced())actors.forEach((actor,i)=>{
        const next=actor.getBoundingClientRect();
        if(!actor.animate)return;
        const animation=actor.animate([{transform:`translate(${old[i].left-next.left}px,${old[i].top-next.top}px) scale(${old[i].width/(next.width||1)})`},{transform:'translate(0,0) scale(1)'}],{duration:340,easing:'cubic-bezier(.22,.72,.22,1)'});
        animations.push(animation);animation.finished?.catch(()=>{});
      });
      return true;
    }
    function status(value){
      actors.forEach(actor=>{if(actor.dataset.character===scenes[current].character)actor.dataset.pose=value==='error'?'alert':value==='loading'?'wait':value==='success'?'happy':scenes[current].pose;});
    }
    return {navigate,status,cancel,get scene(){return current;},get revision(){return revision;}};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createDirector};
  if(!root.document)return;
  const doc=root.document;
  let director=null,fetchArt=null,flight=null,flightNode=null,observer=null,pageAnimation=null;
  const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cancelFlight(){flight?.cancel();flightNode?.remove();flight=null;flightNode=null;}
  function poseNodes(){doc.querySelectorAll('[data-friend]').forEach(node=>{node.dataset.character=node.dataset.friend;node.dataset.pose=node.dataset.pose||'idle';node.classList.add('eco-friend');});}
  async function hydrate(){
    try{
      fetchArt ||= fetch(new URL('assets/eco-friends.svg',doc.baseURI)).then(r=>{if(!r.ok)throw Error('art');return r.text();}).catch(()=>{fetchArt=null;return '';});
      const art=await fetchArt;if(!art)return;
      poseNodes();doc.querySelectorAll('[data-friend]:not([data-hydrated])').forEach(node=>{node.innerHTML=art;node.dataset.hydrated='true';observer?.observe(node);});
    }catch{/* Text and controls remain usable if illustration cannot load. */}
  }
  function enter(target){
    pageAnimation?.cancel();pageAnimation=null;
    if(!target)return;
    target.getAnimations?.().forEach(a=>a.cancel());
    if(!reduced()){ pageAnimation=target.animate?.([{opacity:.5,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});pageAnimation?.finished?.catch(()=>{}); }
  }
  function expand(target,origin){
    if(!target||!origin||reduced()){enter(target);return;}
    pageAnimation?.cancel();target.getAnimations?.().forEach(a=>a.cancel());
    const from=origin.getBoundingClientRect(),to=target.getBoundingClientRect();
    if(!target.animate||!to.width||!to.height)return;
    pageAnimation=target.animate([{opacity:.35,transform:'translate('+(from.left+from.width/2-to.left-to.width/2)+'px,'+(from.top+from.height/2-to.top-to.height/2)+'px) scale('+Math.max(.35,Math.min(1,from.width/to.width))+')'},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:340,easing:'cubic-bezier(.22,.72,.22,1)'});
    pageAnimation.finished?.catch(()=>{});
  }
  function transfer(kind,target){
    cancelFlight();if(reduced()||!target||!director)return;
    const start=doc.querySelector('.friend-guide [data-character="bird"]')?.getBoundingClientRect(),end=target.getBoundingClientRect();if(!start||!end)return;
    const node=doc.createElement('span');node.className='friend-transfer';node.textContent=kind==='coupon'?'✉':'★';node.setAttribute('aria-hidden','true');
    node.style.left=start.left+'px';node.style.top=start.top+'px';doc.body.appendChild(node);flightNode=node;
    const animation=node.animate([{opacity:0,transform:'translate(0,0) rotate(-12deg)'},{offset:.2,opacity:1},{opacity:0,transform:`translate(${end.left-start.left}px,${end.top-start.top}px) rotate(12deg) scale(.6)`}],{duration:720,easing:'cubic-bezier(.2,.7,.2,1)'});
    flight=animation;animation.finished.then(()=>{if(flight===animation)cancelFlight();}).catch(()=>{});
    director.status('success');
  }
  function navigate(tab){
    cancelFlight();const scene=({'tab-home':'home','tab-rewards':'rewards','tab-coupons':'coupons','tab-profile':'profile','view-scanner':'scanner'})[tab];
    if(scene)director?.navigate(scene);enter(doc.getElementById(tab));
  }
  function boot(){
    const main=doc.querySelector('main');if(!main)return;
    const guide=doc.createElement('aside');guide.className='friend-guide';guide.dataset.scene='home';guide.setAttribute('aria-label','เพื่อนนักเรียนรักษ์โลก');
    guide.innerHTML='<div class="friend-guide-copy"><span class="friend-kicker">SAPPHA · ECO FRIENDS</span><h2></h2><p></p></div><div class="guide-actors" aria-hidden="true"><div data-friend="cat" data-active="true" data-pose="wave"></div><div data-friend="rabbit"></div><div data-friend="bird"></div></div>';
    main.before(guide);poseNodes();
    director=createDirector({guide,actors:[...guide.querySelectorAll('[data-friend]')],reduced,changed(scene){guide.querySelector('h2').textContent=scene.title;guide.querySelector('p').textContent=scene.hint;}});
    if('IntersectionObserver' in root)observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('friend-paused',!e.isIntersecting)));
    hydrate();
    fetch(new URL('assets/school-eco.svg',doc.baseURI)).then(r=>r.ok?r.text():'').then(art=>{if(!art)return;doc.querySelectorAll('[data-school-scene]').forEach(node=>{node.innerHTML=art;observer?.observe(node);});}).catch(()=>{});
    navigate('tab-home');
    const pause=()=>doc.documentElement.classList.toggle('motion-paused',doc.hidden);doc.addEventListener('visibilitychange',pause);pause();
    const media=root.matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener?.('change',()=>{director.cancel();cancelFlight();pageAnimation?.cancel();});
    root.addEventListener('pagehide',()=>{director.cancel();cancelFlight();observer?.disconnect();});
  }
  root.EcoMotion={navigate,enter,expand,transfer,hydrate,status:value=>director?.status(value)};
  doc.addEventListener('DOMContentLoaded',boot);
})(typeof window!=='undefined'?window:globalThis);
