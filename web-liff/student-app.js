(function(root){
  'use strict';
  const VERSION='1';
  const tabs=['tab-home','tab-rewards','tab-coupons','tab-profile','view-scanner'];
  const scenes={welcome:[0,0],identity:[0,1],confirm:[0,2],insert:[0,3],inspect:[1,0],success:[1,1],pending:[1,2],error:[1,3],used:[0,2],rewards:[0,0],coupons:[0,2],profile:[0,2],points:[1,1],level:[1,1],loading:[1,2],ready:[0,3]};
  const spriteClips={
    welcome:{file:'welcome.webp',columns:4,rows:4,frames:16,fps:10,loop:true,pingPong:true},
    identity:{file:'identity.webp',columns:4,rows:4,frames:16,fps:10,loop:true,pingPong:true},
    success:{file:'success.webp',columns:4,rows:3,frames:12,fps:15,loop:false,pingPong:false}
  };
  function spriteFrame(clip,elapsed){
    const step=Math.max(0,Math.floor(elapsed*clip.fps/1000));
    if(!clip.loop)return Math.min(clip.frames-1,step);
    if(!clip.pingPong)return step%clip.frames;
    const period=Math.max(1,2*(clip.frames-1)),phase=step%period;
    return phase<clip.frames?phase:period-phase;
  }
  // Clip playback stays independent of account state and transaction callbacks.
  function createVideoPlayback({video,clips,resolve=value=>value,onVisible=()=>{}}){
    let current=null,active=false,ready=false,failed=false,destroyed=false,revision=0,sourceLoaded=false;
    let sources=[],sourceIndex=0,listeners=[],requested=false;
    const clear=()=>{listeners.forEach(([name,fn])=>video.removeEventListener(name,fn));listeners=[];};
    const listen=(name,fn)=>{video.addEventListener(name,fn);listeners.push([name,fn]);};
    function play(){
      if(!active||!ready||failed||destroyed||requested)return;
      const ticket=revision;requested=true;
      try{Promise.resolve(video.play()).then(()=>{
        if(ticket!==revision)return;
        if(!active)video.pause();
      }).catch(()=>{if(ticket===revision){requested=false;onVisible(false);}});}catch{requested=false;onVisible(false);}
    }
    function loadSource(){
      clear();const ticket=++revision;ready=false;requested=false;video.pause();onVisible(false);
      listen('loadeddata',()=>{if(ticket!==revision||destroyed)return;
        const clip=clips[current];
        if(clip.alpha&&sources[sourceIndex]===clip.webm&&video.ownerDocument){
          try{const canvas=video.ownerDocument.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,1,1,0,0,1,1);if(ctx.getImageData(0,0,1,1).data[3]>0&&sourceIndex+1<sources.length){sourceIndex++;loadSource();return;}}catch{if(sourceIndex+1<sources.length){sourceIndex++;loadSource();return;}}
        }
        ready=true;onVisible(active);play();});
      listen('error',()=>{if(ticket!==revision||destroyed)return;if(++sourceIndex<sources.length)loadSource();else{failed=true;ready=false;requested=false;video.pause();onVisible(false);}});
      listen('ended',()=>{if(ticket!==revision||destroyed)return;requested=false;const next=clips[current]?.next;if(next&&clips[next])set(next);});
      sourceLoaded=true;video.src=resolve(sources[sourceIndex]);video.load();
    }
    function set(name){
      if(destroyed||!clips[name]||current===name)return false;
      current=name;failed=false;ready=false;requested=false;sourceIndex=0;sourceLoaded=false;
      const clip=clips[name];sources=video.canPlayType('video/webm')?[clip.webm,clip.mp4]:[clip.mp4,clip.webm];sources=sources.filter(Boolean);
      video.loop=!!clip.loop;if(clip.poster)video.poster=resolve(clip.poster);video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';
      clear();revision++;video.pause();onVisible(false);
      if(active&&sources.length)loadSource();return true;
    }
    return {
      set,
      setActive(value,{still=false}={}){
        if(destroyed)return;
        active=!!value&&!still;
        if(!active){requested=false;video.pause();if(still)onVisible(false);return;}
        if(!current||failed)return;
        if(!sourceLoaded&&sources.length)loadSource();
        else if(ready){onVisible(true);play();}
      },
      replay(){if(destroyed||failed)return;video.currentTime=0;requested=false;play();},
      destroy(){destroyed=true;revision++;clear();video.pause();video.removeAttribute('src');video.load();onVisible(false);},
      get current(){return current;},
      get alpha(){return !!clips[current]?.alpha&&sources[sourceIndex]===clips[current]?.webm;},
      get poster(){const clip=clips[current];return clip?.alpha&&sources[sourceIndex]===clip.webm?clip.posterAlpha:clip?.poster;}
    };
  }
  const slides=[
    {art:'ready',title:'เริ่มจากขวดที่พร้อมรีไซเคิล',copy:'เตรียมขวดพลาสติก PET หรือกระป๋องที่ตู้รองรับ เทน้ำและเครื่องดื่มออกให้หมดก่อนนำไปหยอด',tip:'เตรียมให้พร้อมก่อนถึงตู้'},
    {art:'confirm',title:'รหัสของเรา แต้มของเรา',copy:'ที่หน้าตู้ กรอกรหัสนักเรียน 5 หลัก ตรวจชื่อและชั้นเรียนให้ตรงกับคุณ แล้วกดยืนยัน',tip:'หน้าตู้ไม่ต้องล็อกอิน LINE'},
    {art:'insert',title:'ค่อย ๆ หยอด ทีละ 1 ชิ้น',copy:'วางขวดหรือกระป๋องในช่องรับด้านหน้า รอให้ตู้ตรวจและคัดแยกเสร็จก่อนใส่ชิ้นถัดไป หากไม่ผ่านให้รับคืนจากช่องส่งคืน',tip:'ไม่วางหลายชิ้นพร้อมกัน'},
    {art:'inspect',title:'เช็กแต้ม แล้วเลือกของที่ชอบ',copy:'กลับมาดูยอดและประวัติในเว็บ หากตู้ยังรอส่งข้อมูล แต้มอาจยังไม่ขึ้น เมื่อแลกรางวัลสำเร็จให้นำคูปอง QR ไปแสดงกับสภานักเรียนเพื่อรับของ',tip:'แต้มไม่เข้า? แจ้งปัญหาได้ที่หน้าหลัก'}
  ];
  function createGuideStore(storage){
    let owner=null;const finished=new Set();
    const key=()=>`sappha:guide:${VERSION}:${owner}`;
    return {
      setOwner(value){const next=value==null?null:String(value);const changed=next!==owner;owner=next;return changed;},
      get owner(){return owner;},
      needed(){if(!owner||finished.has(owner))return false;try{return !['done','skipped'].includes(storage?.getItem(key()));}catch{return true;}},
      finish(skipped=false){if(!owner)return;finished.add(owner);try{storage?.setItem(key(),skipped?'skipped':'done');}catch{/* Completion still lasts for this session. */}}
    };
  }
  function createNavigation({history,location,getY,restore}){
    let current='tab-home';const positions=new Map();let revision=0;
    const url=tab=>`${location.pathname||''}${location.search||''}#${tab}`;
    return {
      get current(){return current;},
      get alpha(){return !!clips[current]?.alpha&&sources[sourceIndex]===clips[current]?.webm;},
      get poster(){const clip=clips[current];return clip?.alpha&&sources[sourceIndex]===clip.webm?clip.posterAlpha:clip?.poster;},
      init(){const requested=location.hash?.slice(1);const first=tabs.slice(0,4).includes(requested)?requested:'tab-home';current=first;history.replaceState({...history.state,sapphaTab:first},'',url(first));return first;},
      go(tab,{history:write=true}={}){if(!tabs.includes(tab))return false;if(tab!==current){positions.set(current,getY());current=tab;if(write)history.pushState({...history.state,sapphaTab:tab},'',url(tab));}const ticket=++revision;restore(positions.get(tab)||0,()=>ticket===revision);return true;}
    };
  }
  function getJourney(total){
    if(total===null||total===undefined||total==='')return null;
    const count=Number(total);if(!Number.isSafeInteger(count)||count<0)return null;
    const level=count<10?1:count<30?2:count<60?3:4;
    const lower=[0,0,10,30,60][level],goal=[0,10,30,60,null][level];
    return {count,level,goal,pct:goal===null?100:Math.round((count-lower)/(goal-lower)*100)};
  }
  function createProgressMotion({render,animate,read,still}){
    let value=null,animation=null;
    return {set(next){if(!Number.isFinite(next))return false;next=Math.max(0,Math.min(100,next));if(next===value)return false;const from=animation?read():value??0;animation?.cancel();animation=null;value=next;render(next);if(!still()&&from!==next){animation=animate(from,next);animation?.finished?.catch(()=>{});}return true;},cancel(){animation?.cancel();animation=null;if(value!==null)render(value);},get value(){return value;}};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createGuideStore,createNavigation,getJourney,createProgressMotion,slides,scenes,spriteClips,spriteFrame,createVideoPlayback};
  if(!root.document)return;
  const doc=root.document,$=id=>doc.getElementById(id);
  let guideStore,nav,guideIndex=0,guideOwner=null,guideOrigin=null,introTimer=null,pendingInstall=null,activeTab='tab-home',introBooted=false;
  let movement=null,flight=null,flightNode=null,flightTimer=null,flightRevision=0,hero=null,observer=null,interval=null,assetReady=false,account=null;
  let cardAnimations=[],navMovement=null,navObserver=null,navPill=null,ringMotion=null;
  let lastVisualTab='tab-home',arrival=null,routeTransition=null,routeRevision=0;
  const actors=new Set();let shown=new WeakSet();
  const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const imagePaths=['assets/mascot-calm/legacy-01.webp','assets/mascot-calm/legacy-02.webp'].map(p=>new URL(p,doc.baseURI).href);
  function stopFlight(){flightRevision++;clearTimeout(flightTimer);flight?.cancel();flight=null;arrival?.cancel();arrival=null;flightNode?.remove();flightNode=null;actors.forEach(el=>{if(['success','points','level'].includes(el.dataset.mascot))setArt(el,'welcome');});}
  const spriteReady=new Set(),spriteRuns=new Map(),painted=new WeakMap(),videoRuns=new Map(),duoRigs=new Map();
  // Only approved, locally packaged clips are enabled in this manifest.
  const videoLibrary=root.SapphaMascotClips||{clips:{},scenes:{}};
  function setArt(el,scene){
    if(!el)return;const next=scene in scenes?scene:'welcome';
    if(el.dataset.mascot===next&&(duoRigs.has(el)||videoRuns.has(el)))return;
    painted.delete(el);if(el.dataset.mascot!==next)spriteRuns.delete(el);
    duoRigs.get(el)?.destroy();duoRigs.delete(el);el.classList.remove('has-duo-rig','has-mascot-video','has-alpha-video');
    videoRuns.get(el)?.destroy();videoRuns.delete(el);
    el.dataset.mascot=next;el.classList.add('app-mascot');el.replaceChildren();actors.add(el);observer?.observe(el);paint(el,0);
    const selectedClip=el.id==='splash-mascot'&&next==='welcome'?'greeting':videoLibrary.scenes[next];
    if(!videoLibrary.clips[selectedClip]&&(root.SapphaScenePlayer?.has(next)||(['identity','welcome'].includes(next)&&root.SapphaDuoRig))){
      el.style.backgroundImage='none';el.style.clipPath='none';el.classList.add('has-duo-rig');
      el.innerHTML='<div class="student-login-scene" data-motion="paused"><div class="halo halo-back" data-ambient aria-hidden="true"></div><div class="halo halo-front" data-ambient aria-hidden="true"></div><div class="scene-floor" data-ambient aria-hidden="true"></div><svg class="leaves" viewBox="0 0 390 300" aria-hidden="true"><path data-ambient d="M38 212Q35 179 65 170Q67 197 38 212Z"/><path data-ambient d="M332 104Q334 77 356 78Q354 100 332 104Z"/><path data-ambient d="M78 77Q81 59 94 62Q91 78 78 77Z"/></svg><div class="scene-motes" aria-hidden="true"><i data-ambient></i><i data-ambient></i><i data-ambient></i><i data-ambient></i></div><div class="student-login-stage"></div></div>';
      const scene=el.firstElementChild,rig=root.SapphaScenePlayer?.has(next)?root.SapphaScenePlayer.create(el.querySelector('.student-login-stage'),{scene:next}):root.SapphaDuoRig.create(el.querySelector('.student-login-stage'),{startAt:el.matches('#splash-mascot,#modal-line-bind .login-friends')?0:3540});
      duoRigs.set(el,{setActive(active){const motion=active&&!reduced()?'playing':'paused';if(scene.dataset.motion!==motion)scene.dataset.motion=motion;if(this.active===active)return;this.active=active;active?rig.resume():rig.pause();},replay(){rig.greet();},destroy(){rig.destroy();}});
      duoRigs.get(el).setActive(false);return;
    }
    const clip=selectedClip;
    if(clip&&videoLibrary.clips[clip]){
      el.classList.add('has-mascot-video');const video=doc.createElement('video');video.className='app-mascot-video';video.hidden=true;video.setAttribute('aria-hidden','true');video.setAttribute('playsinline','');video.setAttribute('disablepictureinpicture','');video.tabIndex=-1;el.append(video);
      const player=createVideoPlayback({video,clips:videoLibrary.clips,resolve:path=>new URL(path,doc.baseURI).href,onVisible:visible=>{if(video.hidden!==!visible)video.hidden=!visible;const player=videoRuns.get(el);if(player)paint(el,0);}});
      videoRuns.set(el,player);player.set(clip);painted.delete(el);paint(el,0);
    }
  }
  function paint(el,index){
    if(duoRigs.has(el))return;
    const player=videoRuns.get(el),poster=player?.poster||videoLibrary.clips[player?.current]?.poster;if(poster){if(el.classList.contains('has-alpha-video')!==!!player?.alpha)el.classList.toggle('has-alpha-video',!!player?.alpha);const showingVideo=el.querySelector('.app-mascot-video')?.hidden===false;const key='video:'+poster+':'+showingVideo;if(painted.get(el)!==key){painted.set(el,key);el.style.backgroundImage=showingVideo?'none':`url("${new URL(poster,doc.baseURI).href}")`;el.style.backgroundSize='contain';el.style.backgroundPosition='center';el.style.clipPath='none';}return;}
    const scene=el.dataset.mascot,clip=spriteReady.has(scene)?spriteClips[scene]:null,key=`${scene}:${clip?'atlas':'fallback'}:${index}`;
    if(painted.get(el)===key)return;painted.set(el,key);
    if(clip){
      el.style.backgroundImage=`url("${new URL('assets/mascot-calm/'+clip.file,doc.baseURI).href}")`;
      el.style.backgroundSize=`${clip.columns*100}% ${clip.rows*100}%`;
      el.style.backgroundPosition=`${index%clip.columns*100/(clip.columns-1)}% ${Math.floor(index/clip.columns)*100/(clip.rows-1)}%`;
      el.style.clipPath='none';
    }else{
      const [sheet,row]=scenes[scene]||scenes.welcome;
      el.style.backgroundImage=`url("${imagePaths[sheet]}")`;el.style.backgroundSize='300% 400%';el.style.backgroundPosition=`0% ${row*100/3}%`;
      el.style.clipPath=({pending:'inset(5% 0 3%)',confirm:'inset(6% 0 2%)',identity:'inset(2% 0 1%)'})[scene]||'none';
    }
    el.dataset.mascotFrame=String(index);
  }
  function visibleSurface(){
    const dialogs=Array.from(doc.querySelectorAll?.('dialog[open]')||[]);
    if(dialogs.length)return dialogs[dialogs.length-1];
    return ['app-splash-screen','identity-retry','modal-bind-success','modal-line-bind','modal-phone-required','modal-council-verify'].map($).find(el=>el&&el.getClientRects?.().length&&!el.classList.contains('hidden'))||null;
  }
  // Single clock for visible atlases. No crossfade, geometry deformation or hidden loops.
  function tick(){
    clearTimeout(interval);let pending=false;const now=Date.now(),surface=visibleSurface();brandPlayer?.setActive(!!$('app-splash-screen')&&!doc.hidden&&(!surface||surface.id==='app-splash-screen'),{still:reduced()||!root.anime});doc.body.toggleAttribute('data-motion-suspended',doc.hidden||!!surface&&surface.id!=='app-onboarding');
    actors.forEach(el=>{
      if(!el.isConnected){duoRigs.get(el)?.destroy();duoRigs.delete(el);videoRuns.get(el)?.destroy();videoRuns.delete(el);actors.delete(el);spriteRuns.delete(el);observer?.unobserve(el);return;}
      const clip=spriteClips[el.dataset.mascot];
      let run=spriteRuns.get(el);if(!run){run={elapsed:0,last:null};spriteRuns.set(el,run);}
      const pane=el.closest?.('.tab-pane');
      const visible=shown.has(el)&&(!pane||pane.classList.contains('active'))&&(!surface||surface.contains(el));
      const loginRig=duoRigs.get(el);if(loginRig){run.last=null;loginRig.setActive(visible&&!doc.hidden);return;}
      const player=videoRuns.get(el);
      if(player){run.last=null;paint(el,0);player.setActive(visible&&!doc.hidden,{still:reduced()||!root.anime});return;}
      if(!root.anime||reduced()||doc.hidden||!clip||!spriteReady.has(el.dataset.mascot)){run.last=null;paint(el,0);return;}
      if(!visible){run.last=null;return;}
      if(run.last!==null)run.elapsed+=Math.max(0,now-run.last);run.last=now;
      paint(el,spriteFrame(clip,run.elapsed));
      if(clip.loop||run.elapsed<clip.frames*1000/clip.fps)pending=true;
    });
    if(pending)interval=setTimeout(tick,33);
  }
  function hydrate(){doc.querySelectorAll('[data-mascot]:not([data-mascot-ready]),[data-friend]:not([data-mascot-ready])').forEach(el=>{el.dataset.mascotReady='true';el.removeAttribute('data-friend');el.classList.remove('eco-friend');setArt(el,el.dataset.mascot||'welcome');});if(assetReady)actors.forEach(el=>paint(el,0));tick();}
  function cancelSurfaces(){movement?.cancel();movement=null;cardAnimations.forEach(a=>a.cancel());cardAnimations=[];}
  const running=new Set(),owners=new WeakMap(),visited=new Set(),revealedLists=new Set();
  const OUT=[.23,1,.32,1],DRAWER=[.32,.72,0,1];
  let brandPlayer=null;
  let splashMotion=null,loginMotion=null,loginSeen=false,guideMotion=null,press=null,pressedButton=null;
  // One owner per animated element. Every completion/cancellation restores inline styles.
  function sequence(groups){
    const items=groups.flatMap(group=>Array.from(group.targets||[]));
    items.forEach(el=>owners.get(el)?.cancel());
    if(!root.anime||reduced()||doc.hidden||!items.length)return null;
    const snapshots=items.map(el=>[el,el.style.transform,el.style.opacity]);
    let resolve,done=false,timeline;
    const handle={finished:new Promise(r=>resolve=r),cancel(){finish(false);},finish(){finish(true);}};
    function finish(completed){if(done)return;done=true;timeline?.pause();timeline?.cancel();
      snapshots.forEach(([el,transform,opacity])=>{el.style.transform=transform;el.style.opacity=opacity;if(owners.get(el)===handle)owners.delete(el);});
      running.delete(handle);resolve(completed);
    }
    timeline=root.anime.createTimeline({autoplay:false,onComplete:()=>finish(true)});
    running.add(handle);items.forEach(el=>owners.set(el,handle));
    for(const group of groups){const {targets,at=0,curve=OUT,stagger=0,...properties}=group;
      if(targets.length)timeline.add(targets,{...properties,ease:root.anime.cubicBezier(...curve),delay:root.anime.stagger(stagger)},at);
    }
    timeline.play();return handle;
  }
  function play(target,frames,options){
    if(!target)return null;
    const properties={};for(const key of Object.keys(frames[0]))if(key!=='offset')properties[key]=frames.map(frame=>frame[key]??frames[0][key]);
    return sequence([{targets:[target],...properties,duration:options.duration,curve:options.curve||OUT}]);
  }
  function settleAll(){routeTransition?.skipTransition?.();routeTransition=null;videoRuns.forEach(player=>player.setActive(false,{still:reduced()}));spriteRuns.forEach(run=>run.last=null);[...running].forEach(handle=>handle.finish());stopFlight();}
  function enter(target,origin){
    cancelSurfaces();if(!target)return;
    // Reopening during an exit must not let the old completion close the new view.
    const previous=closing.get(target);if(previous){closing.delete(target);previous.cancel();}
    const sheet=target.tagName==='DIALOG'&&target.classList.contains('app-sheet');
    if(target.classList?.contains?.('tab-pane')&&doc.getElementById?.('app-splash-screen'))return;
    if(target.classList?.contains?.('tab-pane')&&routeTransition){visited.add(target.id);return;}
    const first=target.classList?.contains?.('tab-pane')&&!visited.has(target.id);
    if(first)visited.add(target.id);
    let groups;
    if(target.classList?.contains?.('tab-pane')){
      const items=[...target.children].filter(el=>!el.hidden&&!['rewards-grid','coupons-list'].includes(el.id)).slice(0,8);
      groups=[{targets:items,opacity:[0,1],transform:[first?'translateY(28px)':'translateX(48px)','translateY(0)'],duration:first?380:300,stagger:38}];
    }else groups=[{targets:[target],opacity:[0,1],transform:[sheet?'translateY(110px) scale(.96)':'translateY(16px)','translateY(0) scale(1)'],duration:sheet?300:280,curve:sheet?DRAWER:OUT}];
    movement=sequence(groups);
    if(first)revealList(target.querySelector?.('#rewards-grid,#coupons-list'));
  }
  function revealList(target){
    if(!target||revealedLists.has(target.id)||!target.querySelector('.reward-card'))return;
    revealedLists.add(target.id);
    sequence([{targets:[...target.querySelectorAll('.reward-card')].slice(0,6),opacity:[0,1],transform:['translateY(8px)','translateY(0)'],duration:240,stagger:45}]);
  }
  function login(){
    if(loginSeen)return;loginSeen=true;hydrate();
    loginMotion=sequence([
      {targets:[...doc.querySelectorAll('#modal-line-bind .login-friends')],opacity:[0,1],transform:['translateY(16px) scale(.94)','translateY(0) scale(1)'],duration:480},
      {targets:[...doc.querySelectorAll('#modal-line-bind .school-welcome h4,#modal-line-bind .school-welcome p,#modal-line-bind .welcome-steps')],opacity:[0,1],transform:['translateY(8px)','translateY(0)'],duration:240,stagger:60,at:140},
      {targets:[$('btn-confirm-line-bind')].filter(Boolean),opacity:[.6,1],transform:['translateY(6px)','translateY(0)'],duration:200,at:260}
    ]);
  }
  function intro(){splashMotion=sequence([
    {targets:[...doc.querySelectorAll('#app-splash-screen .splash-halo')],opacity:[0,1],transform:['scale(.94)','scale(1)'],duration:800},
    {targets:[$('splash-mascot')].filter(Boolean),opacity:[0,1],transform:['translateY(16px) scale(.94)','translateY(0) scale(1)'],duration:600,at:100},
    {targets:[...doc.querySelectorAll('#app-splash-screen .splash-brand,#app-splash-screen .splash-status')],opacity:[0,1],transform:['translateY(8px)','translateY(0)'],duration:300,stagger:80,at:300}
  ]);}
  function ready(){brandPlayer?.destroy();brandPlayer=null;splashMotion?.cancel();splashMotion=null;$('app-splash-screen')?.remove();if(activeTab==='tab-home'&&account)enter($('tab-home'));tick();}
  const closing=new WeakMap();
  function closeSurface(dialog){
    if(!dialog?.open)return;
    if(closing.has(dialog))return;
    dialog.querySelectorAll?.('*').forEach(el=>owners.get(el)?.cancel());
    if(dialog.id==='modal-qr-presentation')stopFlight();
    if(reduced()||doc.hidden||!root.anime){dialog.close();return;}
    const animation=play(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(90px) scale(.97)'}],{duration:220,curve:DRAWER});
    closing.set(dialog,animation);
    const finish=()=>{if(closing.get(dialog)!==animation)return;closing.delete(dialog);if(dialog.open)dialog.close();animation.cancel();};
    animation.finished.then(finish);
  }
  const listMotions=new WeakMap();
  function filterChanged(target){
    if(!target)return;listMotions.get(target)?.cancel();
    if(reduced()||doc.hidden)return;
    const cards=[...(target.querySelectorAll?.('.reward-card')||[])].slice(0,6);
    const animation=cards.length?sequence([{targets:[target],opacity:[.55,1],duration:160},{targets:cards,opacity:[.4,1],transform:['translateY(7px)','translateY(0)'],duration:230,stagger:28,at:30}]):play(target,[{opacity:.35},{opacity:1}],{duration:160});
    if(animation){listMotions.set(target,animation);animation.finished.catch(()=>{});}
  }
  function moveNav(tab,animate=true){const list=$('bottom-nav-list'),button=list?.querySelector(`[data-tab="${tab}"]`);if(!navPill||!list)return;const before=navPill.getBoundingClientRect();navMovement?.cancel();if(!button){navPill.hidden=true;return;}navPill.hidden=false;const to=button.getBoundingClientRect(),parent=list.getBoundingClientRect();Object.assign(navPill.style,{left:`${to.left-parent.left}px`,top:`${to.top-parent.top}px`,width:`${to.width}px`,height:`${to.height}px`});if(animate&&!reduced()&&before.width){navMovement=play(navPill,[{transform:`translateX(${before.left-to.left}px)`},{transform:'translateX(0)'}],{duration:250,easing:'cubic-bezier(.2,.7,.2,1)'});navMovement.finished?.catch(()=>{});}}
  function updateJourney(student){const data=getJourney(student.total_bottles_recycled),progress=$('journey-progress');if(!progress)return;if(!data){$('journey-count').textContent='—';$('journey-level').textContent='รอข้อมูล';$('journey-goal').textContent=' ชิ้นสะสม';progress.removeAttribute('aria-valuenow');progress.setAttribute('aria-valuetext','ยังไม่มียอดชิ้นสะสมล่าสุด');return;}$('journey-level').textContent=`ระดับ ${data.level}`;$('journey-count').textContent=data.count.toLocaleString();$('journey-goal').textContent=data.goal===null?' ชิ้นสะสมทั้งหมด':` / ${data.goal} ชิ้นสะสม`;progress.setAttribute('aria-valuenow',String(data.pct));progress.setAttribute('aria-valuetext',data.goal===null?`ระดับสูงสุด สะสม ${data.count} ชิ้น`:`ระดับ ${data.level} คืบหน้า ${data.pct}% สะสม ${data.count} ชิ้น`);ringMotion?.set(data.pct);}
  const currentActor=()=>{const login=doc.querySelector('#modal-line-bind:not(.hidden) .login-friends');return login|| (activeTab==='tab-home'?doc.querySelector('#journey-mascot'):hero);};
  function transfer(kind,target,details={}){
    // Called only by the controller after a confirmed balance/redemption response.
    stopFlight();if(!target||!root.anime||reduced()||doc.hidden)return;
    if(kind==='coupon'&&$('modal-qr-presentation')?.open){
      const actor=$('coupon-mascot');setArt(actor,'success');
      flight=sequence([{targets:[...doc.querySelectorAll('.coupon-spark')],opacity:[0,1,0],transform:['translateY(6px) scale(.7)','translateY(-4px) scale(1)','translateY(-12px) scale(.9)'],duration:600,stagger:25,at:60}]);
      tick();flightTimer=setTimeout(()=>{setArt(actor,'coupons');tick();},800);return;
    }
    const revision=flightRevision,actor=currentActor();const start=actor?.getBoundingClientRect(),end=target.getBoundingClientRect();
    if(!end.width||!end.height||!start?.width||!start?.height)return;
    setArt(actor,kind==='points'?(details.levelUp?'level':'points'):'success');
    if(!start)return;const node=doc.createElement('span');node.className='app-transfer';node.textContent=kind==='coupon'?'▤':'✦';node.setAttribute('aria-hidden','true');node.style.left=`${start.left+start.width/2}px`;node.style.top=`${start.top+start.height/2}px`;doc.body.append(node);flightNode=node;
    const dx=end.left+end.width/2-start.left-start.width/2,dy=end.top+end.height/2-start.top-start.height/2;
    if(kind==='points'&&Number.isFinite(details.delta)&&details.delta>0){node.textContent=`+${details.delta.toLocaleString()}`;node.classList.add('app-transfer-points');}
    flight=play(node,[
      {opacity:0,transform:'translate(-50%,-50%) scale(.5)'},
      {opacity:1,transform:`translate(calc(-50% + ${dx*.25}px),calc(-50% + ${dy*.25-24}px)) scale(1.08)`,offset:.4},
      {opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.4)`}
    ],{duration:500,easing:'cubic-bezier(.2,.7,.2,1)'});
    if(!flight){node.remove();flightNode=null;setArt(actor,defaultArt());return;}
    flight.finished.then(completed=>{if(!completed||revision!==flightRevision)return;flightNode?.remove();flightNode=null;flight=null;
      arrival=play(target,[{transform:'scale(1)'},{transform:'scale(1.12)',offset:.4},{transform:'scale(1)'}],{duration:220});arrival?.finished?.catch(()=>{});
    }).catch(()=>{});
    flightTimer=setTimeout(()=>{if(revision===flightRevision){setArt(actor,defaultArt());tick();}},800);tick();
  }
  const defaultArt=()=>({'tab-rewards':'rewards','tab-coupons':'coupons','tab-profile':'profile'}[activeTab]||'welcome');
  function motionStatus(value){if(value==='error'){splashMotion?.cancel();loginMotion?.cancel();}stopFlight();setArt(currentActor(),value==='error'?'error':value==='loading'?'loading':defaultArt());tick();}
  function transitionTab(tab,commit){
    const ticket=++routeRevision;routeTransition?.skipTransition?.();routeTransition=null;
    if(!doc.startViewTransition||!root.anime||reduced()||doc.hidden||lastVisualTab==='view-scanner'||tab==='view-scanner'||lastVisualTab===tab){commit();return;}
    doc.documentElement.dataset.motionDirection=tabs.indexOf(tab)<tabs.indexOf(lastVisualTab)?'back':'forward';
    try{
      const transition=doc.startViewTransition(()=>{if(ticket===routeRevision)commit();});routeTransition=transition;
      transition.ready.catch(()=>{});transition.updateCallbackDone.catch(()=>{});
      transition.finished.catch(()=>{}).finally(()=>{if(routeTransition===transition)routeTransition=null;});
    }catch{routeTransition=null;if(ticket===routeRevision)commit();}
  }
  function motionNavigate(tab){guideMotion?.cancel();[...running].forEach(handle=>handle.cancel());activeTab=tab;doc.body.dataset.appTab=tab;stopFlight();cancelSurfaces();setArt(hero,defaultArt());if(hero&&tab==='view-scanner')hero.parentElement.hidden=true;hydrate();}
  function blockers(){return !!doc.querySelector('dialog[open], #identity-retry')||['app-splash-screen','modal-line-bind','modal-bind-success','modal-qr-presentation','modal-phone-required','modal-council-verify'].some(id=>{const el=$(id);return el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';});}
  function tryIntro(){clearTimeout(introTimer);if(!guideStore?.needed()||doc.hidden||activeTab!=='tab-home')return;if(blockers()){introTimer=setTimeout(tryIntro,800);return;}openGuide(null,true);}
  function closeGuide(skipped){if(guideOwner===guideStore.owner)guideStore.finish(skipped);guideMotion?.cancel();closeSurface($('app-onboarding'));guideOwner=null;guideOrigin?.focus?.();tick();}
  function showSlide(direction=1){const data=slides[guideIndex];$('guide-title').textContent=data.title;$('guide-copy').textContent=data.copy;$('guide-tip').textContent=data.tip;$('guide-counter').textContent=`${guideIndex+1} / ${slides.length}`;$('guide-prev').disabled=guideIndex===0;$('guide-next').textContent=guideIndex===slides.length-1?'เริ่มใช้งาน':'ถัดไป →';doc.querySelectorAll('.app-guide-dot').forEach((d,i)=>d.classList.toggle('current',i===guideIndex));setArt($('guide-mascot'),data.art);guideMotion?.cancel();guideMotion=sequence([{targets:[$('guide-mascot')],opacity:[0,1],transform:[`translateX(${direction*16}px)`,'translateX(0)'],duration:280},{targets:[$('guide-title'),$('guide-copy'),$('guide-tip')],opacity:[0,1],transform:[`translateX(${direction*10}px)`,'translateX(0)'],duration:220,stagger:30,at:40}]);tick();}
  function openGuide(origin,automatic=false){if(!guideStore?.owner||$('app-onboarding').open)return;if(automatic&&blockers())return;clearTimeout(introTimer);guideOrigin=origin||doc.activeElement;guideOwner=guideStore.owner;guideIndex=0;showSlide();$('app-onboarding').showModal();tick();}
  function installHelp(){const message=$('install-help-copy');const inLine=root.liff?.isInClient?.()||/Line\//i.test(navigator.userAgent);const ios=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    message.textContent=inLine?'ใน LINE ให้เปิดเมนูของหน้าต่างนี้ แล้วเลือกเปิดด้วยเบราว์เซอร์ภายนอก จากนั้นใช้เมนูเพิ่มลงหน้าจอหลักของเบราว์เซอร์':ios?'เปิดเว็บนี้ใน Safari แล้วแตะปุ่มแชร์ เลือก “เพิ่มไปยังหน้าจอโฮม” และกดเพิ่ม':'เปิดเว็บนี้ใน Chrome หรือเบราว์เซอร์ที่รองรับ แล้วเปิดเมนู ⋮ เลือก “ติดตั้งแอพ” หรือ “เพิ่มลงในหน้าจอหลัก” หากไม่มีเมนูนี้ ยังใช้งานผ่านเว็บได้ตามปกติ';$('install-help').showModal();}
  function installed(){return root.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
  async function install(){if(installed()){$('app-install-status').textContent='กำลังใช้งานจากหน้าจอหลักแล้ว';return;}if(pendingInstall){const event=pendingInstall;pendingInstall=null;try{await event.prompt();const choice=await event.userChoice;$('app-install-status').textContent=choice.outcome==='accepted'?'ทำตามขั้นตอนของอุปกรณ์เพื่อติดตั้งให้เสร็จ':'คุณเพิ่มลงหน้าจอหลักภายหลังได้';}catch{installHelp();}}else installHelp();}
  function accountReady(student,profile){account=student;if(!guideStore)return;const changed=guideStore.setOwner(student?.student_id);if(changed){if($('app-onboarding').open){guideMotion?.cancel();closeSurface($('app-onboarding'));}guideOwner=null;clearTimeout(introTimer);}
    updateJourney(student);
    if($('store-points'))$('store-points').textContent=Number.isFinite(student?.current_points)?student.current_points.toLocaleString():'—';
    const level=getJourney(student?.total_bottles_recycled)?.level;doc.querySelectorAll('.garden-level-path [data-level]').forEach(step=>{step.classList.toggle('complete',!!level&&Number(step.dataset.level)<=level);step.classList.toggle('current',Number(step.dataset.level)===level);});
    $('app-greeting-name').textContent=profile?.displayName||student?.full_name?.replace(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว)/,'').trim()||'เพื่อนรักษ์โลก';
    $('app-account-line').textContent='LINE: '+(profile?.displayName||student?.line_display_name||'เชื่อมต่อแล้ว');$('app-account-school').textContent=`บัญชีโรงเรียน: ${student.student_id}@sappha.ac.th · ยืนยันแล้ว`;
    if(!introBooted){introBooted=true;const first=nav.init();root.StudentActivity?.navigate(first,{history:false});}
    if(changed)introTimer=setTimeout(tryIntro,650);
  }
  function boot(){
    if(!doc.body.classList.contains('student-app'))return;let storage;try{storage=root.localStorage;}catch{}guideStore=createGuideStore(storage);
    const brandVideo=$('brand-reveal-video');
    if(brandVideo){brandPlayer=createVideoPlayback({video:brandVideo,clips:{brand:{mp4:'assets/brand-motion/sr-reveal.mp4',poster:'assets/brand-motion/sr-reveal.jpg',loop:false}},resolve:path=>new URL(path,doc.baseURI).href,onVisible:visible=>{if(brandVideo.hidden!==!visible)brandVideo.hidden=!visible;const poster=$('brand-reveal-poster');if(poster&&poster.hidden!==visible)poster.hidden=visible;}});brandPlayer.set('brand');}
    nav=createNavigation({history:root.history,location:root.location,getY:()=>root.scrollY,restore:(y,current)=>root.requestAnimationFrame(()=>{if(current())root.scrollTo({top:y,behavior:'instant'});})});
    root.history.scrollRestoration='manual';
    const circle=$('journey-ring-fill'),circumference=628.3185;
    if(circle)ringMotion=createProgressMotion({render:value=>{circle.style.strokeDashoffset=String(circumference*(1-value/100));},read:()=>100*(1-parseFloat(getComputedStyle(circle).strokeDashoffset)/circumference),still:()=>reduced()||doc.hidden||activeTab!=='tab-home',animate:(from,to)=>circle.animate([{strokeDashoffset:String(circumference*(1-from/100))},{strokeDashoffset:String(circumference*(1-to/100))}],{duration:600,easing:'cubic-bezier(.2,.7,.2,1)'})});
    function releasePress(){press?.cancel();press=null;const button=pressedButton;pressedButton=null;if(!button)return;button.classList.remove('motion-pressed');play(button,[{transform:'scale(.97)'},{transform:'scale(1)'}],{duration:160});}
    doc.addEventListener('pointerdown',event=>{const button=event.target.closest?.('button');if(!button||button.disabled||button.closest('#bottom-nav-list')||reduced())return;releasePress();pressedButton=button;button.classList.add('motion-pressed');press=play(button,[{transform:'scale(1)'},{transform:'scale(.97)'}],{duration:90});});
    doc.addEventListener('pointerup',releasePress);doc.addEventListener('pointercancel',releasePress);root.addEventListener('blur',releasePress);
    const navList=$('bottom-nav-list');navPill=doc.createElement('li');navPill.className='app-nav-highlight';navPill.setAttribute('aria-hidden','true');navPill.setAttribute('role','presentation');navList.prepend(navPill);if('ResizeObserver' in root){navObserver=new ResizeObserver(()=>moveNav(activeTab,false));navObserver.observe(navList);}
    doc.querySelectorAll('#btn-header-profile-avatar img,#prof-avatar-img').forEach(img=>{img.onerror=()=>{img.onerror=null;img.src=new URL('assets/app-icon-192.png',doc.baseURI).href;};});
    const card=doc.createElement('aside');card.className='app-tab-companion';card.innerHTML='<div class="app-mascot" id="app-tab-mascot" role="img" aria-label="น้องตู้และน้องขวดเพื่อนรักษ์โลก"></div><div class="companion-message"><small class="reward-companion-label">จากการแยก สู่รางวัล</small><p id="app-tab-hint">ไปด้วยกัน ทีละขวด</p><span class="reward-companion-caption">เลือกของที่ชอบ แล้วเปิดดูรายละเอียดก่อนแลก</span></div>';$('store-wallet')?.after(card);hero=$('app-tab-mascot');
    if('IntersectionObserver' in root)observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)shown.add(entry.target);else shown.delete(entry.target);}tick();});
    Promise.all(imagePaths.map(path=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=path;}))).then(()=>{assetReady=true;hydrate();}).catch(()=>{doc.body.classList.add('app-art-unavailable');});
    for(const [name,clip] of Object.entries(spriteClips)){
      const image=new Image();image.onload=()=>{spriteReady.add(name);tick();};image.onerror=()=>{};
      image.src=new URL('assets/mascot-calm/'+clip.file,doc.baseURI).href;
    }
    const surfaceObserver='MutationObserver' in root?new MutationObserver(()=>tick()):null;
    surfaceObserver?.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
    const loginArt=doc.querySelector('#modal-line-bind .login-friends');if(loginArt){loginArt.removeAttribute('data-friend');loginArt.dataset.mascotReady='true';setArt(loginArt,'identity');}
    hydrate();intro();doc.addEventListener('click',event=>{const actor=event.target.closest('.app-mascot');if(actor&&actors.has(actor)&&actor.dataset.mascot!=='success'){spriteRuns.delete(actor);duoRigs.get(actor)?.replay();const player=videoRuns.get(actor);if(player){const clip=videoLibrary.scenes[actor.dataset.mascot];if(player.current!==clip)player.set(clip);else player.replay();}tick();}if(event.target.closest('[data-open-guide]'))openGuide(event.target.closest('[data-open-guide]'));const target=event.target.closest('button[data-app-tab],a[data-app-tab]');if(target)root.StudentActivity?.navigate(target.dataset.appTab);if(event.target.closest('[data-install-app]'))install();});
    $('tab-home').prepend($('app-network'));
    $('app-my-reports').onclick=()=>$('open-my-reports')?.click();
    doc.querySelectorAll('.app-settings button').forEach(button=>{const icon=doc.createElement('span');icon.className='material-symbols-rounded setting-icon';icon.setAttribute('aria-hidden','true');icon.textContent=button.hasAttribute('data-install-app')?'install_mobile':button.hasAttribute('data-open-guide')?'auto_stories':'support_agent';button.prepend(icon);});
    const brand=doc.createElement('img');brand.className='sr-install-lockup';brand.src='assets/sr-logo.png';brand.alt='Sappha Recycle';brand.width=128;brand.height=138;$('install-help-title').before(brand);
    const freshness=$('balance-freshness');if(freshness){const slot=doc.createElement('div');slot.className='app-balance-freshness';slot.append(freshness);doc.querySelector('.balance-hero')?.after(slot);}
    if($('activity-status'))$('tab-home').append($('activity-status'));
    $('guide-next').addEventListener('click',()=>{if(guideIndex===slides.length-1)closeGuide(false);else{guideIndex++;showSlide();}});$('guide-prev').addEventListener('click',()=>{guideIndex=Math.max(0,guideIndex-1);showSlide(-1);});$('guide-skip').addEventListener('click',()=>closeGuide(true));$('app-onboarding').addEventListener('close',()=>{guideOrigin?.focus?.();});$('app-onboarding').addEventListener('cancel',event=>{event.preventDefault();closeGuide(true);});$('install-help-close').onclick=()=>closeSurface($('install-help'));
    $('modal-qr-presentation').addEventListener('cancel',event=>{event.preventDefault();closeSurface(event.currentTarget);});
    root.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;});root.addEventListener('appinstalled',()=>{pendingInstall=null;$('app-install-status').textContent='เพิ่มแอพลงหน้าจอแล้ว';});
    root.addEventListener('popstate',event=>{const tab=event.state?.sapphaTab||root.location.hash.slice(1);if(tabs.includes(tab))root.StudentActivity?.navigate(tab,{history:false});});
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden){brandPlayer?.setActive(false);doc.body.setAttribute('data-motion-suspended','');duoRigs.forEach(player=>player.setActive(false));releasePress();settleAll();clearTimeout(interval);clearTimeout(introTimer);cancelSurfaces();ringMotion?.cancel();navMovement?.cancel();stopFlight();}else{tick();tryIntro();}});
    root.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{releasePress();settleAll();clearTimeout(interval);cancelSurfaces();ringMotion?.cancel();navMovement?.cancel();stopFlight();actors.forEach(el=>paint(el,0));tick();});
    root.addEventListener('online',()=>{if($('app-network'))$('app-network').hidden=true;});root.addEventListener('offline',()=>{if($('app-network'))$('app-network').hidden=false;motionStatus('error');});$('app-network').hidden=navigator.onLine!==false;
    $('app-install-status').textContent=installed()?'กำลังใช้งานจากหน้าจอหลักแล้ว':'เพิ่มไอคอนไว้ เปิดใช้งานได้สะดวกขึ้น';
    doc.addEventListener('close',event=>{owners.get(event.target)?.cancel();event.target.querySelectorAll?.('*').forEach(el=>owners.get(el)?.cancel());if(event.target.id==='modal-qr-presentation')stopFlight();setTimeout(tryIntro,100);tick();},true);doc.addEventListener('click',()=>{if(guideStore.needed())setTimeout(tryIntro,100);});
    root.addEventListener('pagehide',event=>{brandPlayer?.setActive(false);if(!event.persisted)brandPlayer?.destroy();if(!event.persisted){videoRuns.forEach(player=>player.destroy());videoRuns.clear();}duoRigs.forEach(player=>{player.setActive(false);if(!event.persisted)player.destroy();});if(!event.persisted)duoRigs.clear();releasePress();settleAll();clearTimeout(interval);clearTimeout(introTimer);stopFlight();cancelSurfaces();ringMotion?.cancel();navMovement?.cancel();observer?.disconnect();navObserver?.disconnect();surfaceObserver?.disconnect();});root.addEventListener('pageshow',event=>{if(event.persisted){surfaceObserver?.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});actors.forEach(el=>observer?.observe(el));if(navList)navObserver?.observe(navList);tick();}});
    if(account)accountReady(account,null);
  }
  function setCompanionMessage(title,caption,label){
    if($('app-tab-hint'))$('app-tab-hint').textContent=title;
    const card=hero?.parentElement;if(!card)return;
    const detail=card.querySelector('.reward-companion-caption'),tag=card.querySelector('.reward-companion-label');
    if(detail)detail.textContent=caption;if(tag)tag.textContent=label;
  }
  function couponFilter(filter){filterChanged($('coupons-list'));if(activeTab!=='tab-coupons')return;const used=filter==='REDEEMED';setCompanionMessage(used?'เก็บทุกก้าวดี ๆ ไว้':'พร้อมไปรับรางวัล',used?'รายการที่รับของแล้ว เก็บไว้ดูย้อนหลังได้':'เปิด QR แล้วแสดงที่ห้องสภานักเรียน',used?'ความตั้งใจที่ผ่านมา':'จากแต้ม สู่ของที่ชอบ');setArt(hero,used?'used':'coupons');tick();}
  root.PortalExperience={accountReady,couponFilter,navigate(tab,options){return nav?.go(tab,options);},tabChanged(tab){activeTab=tab;const companion=hero?.parentElement;if(companion&&tab!=='view-scanner'){const anchor=$(tab)?.querySelector(tab==='tab-rewards'?'#store-wallet':'.page-heading');if(anchor)anchor.after(companion);else $(tab)?.prepend(companion);if(tab==='tab-profile')setCompanionMessage('พร้อมสำหรับก้าวต่อไป','ตรวจข้อมูลติดต่อ ก่อนแลกของที่ชอบ','พื้นที่ของเพื่อนรักษ์โลก');else setCompanionMessage('สิ่งดี ๆ รอคุณอยู่','เลือกของที่ชอบ แล้วเปิดดูรายละเอียดก่อนแลก','จากการแยก สู่รางวัล');companion.hidden=tab==='tab-home';if(tab==='tab-coupons')couponFilter(doc.querySelector('.c-tab.active')?.dataset.filter);}doc.querySelectorAll('.nav-tab-btn').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});moveNav(tab);if(tab!=='view-scanner'&&(lastVisualTab!==tab||!visited.has(tab)))enter($(tab));lastVisualTab=tab;tryIntro();}};
  root.EcoMotion={transitionTab,ready,login,revealList,close:closeSurface,filterChanged,navigate:motionNavigate,enter,expand:enter,transfer,hydrate,status:motionStatus};
  doc.addEventListener('DOMContentLoaded',boot);
})(typeof window!=='undefined'?window:globalThis);
