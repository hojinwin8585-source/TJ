/* P12 12-가 완료 기준 검사: node tests/p12a.js   (SHOT_DIR=폴더 를 주면 연속 캡처를 저장)
   1) 미용실 손님 · 가게 앞 손님 · 네일숍 손님: 2초 간격으로 잰 몸·머리·귀·눈의 변형 값이 다름, 8초 안에 깜빡임 1번 이상
   2) 손가락을 왼쪽에 대면 눈동자가 왼쪽, 오른쪽에 대면 오른쪽
   3) 샤워 중과 드라이 중의 표정·자세가 서로 다르고, 손을 떼면 기본으로 돌아옴
   4) 과정이 끝날 때 큰 동작(hop 또는 clap)이 기록됨, 큰 동작이 동시에 두 개 돌지 않음
   5) 390px 화면에서 도구 폭 175px 이상, 도구 칸 그림 150px 이상
   6) 반복하는 움직임은 주기 0.6초 이상(선언된 animation-duration), 화면을 떠나면 타이머 0개 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:SHOT?2:1});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));
    /* 2-나: these checks need the dryer and neck/face cards, so start the salon at level 2 with every decoration unlocked */
    localStorage.setItem('mallang_progress',JSON.stringify({petsalon:{level:2,clears:0}}));localStorage.setItem('mallang_salon',JSON.stringify({served:0,wall:[],items:{unlocked:window.MLCFG.games.petsalon.itemUnlock.order,fresh:[],photoSeen:[]}}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps()),ns=()=>p.evaluate(()=>window.ML.__ns());
  const seq=async(name,n=4,gap=600)=>{if(!SHOT)return;for(let k=1;k<=n;k++){await p.screenshot({path:path.join(SHOT,name+'_'+k+'.png')});if(k<n)await W(gap)}};
  /* transforms of the movable parts inside one character element */
  const pose=sel=>p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)return null;const g=c=>{const e=el.querySelector(c);return e?getComputedStyle(e).transform:'-'};
    return{body:g('.al-breathe'),head:g('.al-head'),earL:g('.al-ear-l'),earR:g('.al-ear-r'),eye:g('.al-eye'),pupil:g('.al-pupil'),eyeS:g('.al-eye.al-open'),earS:g('.al-ear-s'),mouthO:(el.querySelector('.al-mouth-o')?getComputedStyle(el.querySelector('.al-mouth-o')).opacity:'-')}},sel);
  const sig=o=>o?[o.body,o.head,o.earL,o.earR,o.eye,o.pupil].join('|'):'';
  /* count blinks by watching the class on the character element (8 s) */
  const watchBlink=sel=>p.evaluate(sel=>{const el=document.querySelector(sel);window.__bl=window.__bl||{};window.__bl[sel]=0;if(!el)return;let on=false;
    new MutationObserver(()=>{const now=el.classList.contains('al-blink');if(now&&!on)window.__bl[sel]++;on=now}).observe(el,{attributes:true,attributeFilter:['class']})},sel);
  const blinks=sel=>p.evaluate(sel=>window.__bl[sel],sel);
  /* watch big moments: never two al-p-* classes on one character at the same time */
  await p.evaluate(()=>{window.__maxPlays=0;new MutationObserver(ms=>ms.forEach(m=>{const n=[...m.target.classList].filter(c=>/^al-p-/.test(c)).length;if(n>window.__maxPlays)window.__maxPlays=n})).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true})});
  /* runtime check: repeating animations shorter than the limit */
  await p.evaluate(()=>{window.__fast=new Set();setInterval(()=>{document.getAnimations().forEach(a=>{const t=a.effect&&a.effect.getTiming&&a.effect.getTiming();if(!t)return;const it=t.iterations,d=+t.duration;
    if((it>1||it===Infinity)&&d>0&&d<600){const tg=a.effect.target;window.__fast.add((a.animationName||'?')+'@'+(tg&&(tg.id||tg.getAttribute&&tg.getAttribute('class'))||'')+' '+d+'ms×'+it)}})},700)});

  /* ---------- salon: waiting customers ---------- */
  await p.evaluate(()=>window.ML.go('petsalon'));await p.waitForFunction(()=>window.ML.__ps().phase==='lobby',null,{timeout:6000});await W(700);
  const lob='.lb-slot:nth-child(2) .lb-ani';await watchBlink(lob);
  const l1=await pose(lob);await seq('1_waiting',4,700);await W(SHOT?0:2000);const l2=await pose(lob);
  await W(Math.max(0,8000-(SHOT?2100:2000)));const lbl=await blinks(lob);
  let s=await st();
  ok('가게 앞 손님 3마리 모두 살아 있음 (Alive)',s.lobbyAlive.length===3,s.lobbyAlive.map(a=>a.kind).join(', '));
  ok('1. 가게 앞 손님: 2초 간격 몸·머리·귀·눈 변형 값이 다름',sig(l1)&&sig(l1)!==sig(l2),'몸 '+l1.body+' → '+l2.body);
  ok('1. 가게 앞 손님: 8초 안에 깜빡임 1번 이상',lbl>=1,lbl+'번');
  const waved=await p.evaluate(()=>window.ML.Alive.log.filter(x=>x.name==='wave').length);
  ok('가게 앞 손님이 차례로 손 흔들기 (나 골라 줘)',waved>=1,'손 흔들기 '+waved+'번');

  /* ---------- salon: the customer inside ---------- */
  const i=s.lobby.findIndex(c=>c&&c.need==='muddy');await p.locator(`.lb-cust[data-i="${i}"]`).click();
  await p.waitForFunction(()=>window.ML.__ps().phase==='foam',null,{timeout:12000});await W(300);
  await seq('5_tool_intro',4,350);
  const pet='#psPet';await watchBlink(pet);const tPet=Date.now();
  const p1=await pose(pet);await W(2000);const p2=await pose(pet);
  ok('1. 미용실 손님: 2초 간격 몸·머리·귀·눈 변형 값이 다름',sig(p1)!==sig(p2),'머리 '+p1.head+' → '+p2.head);
  /* 5: tray picture */
  const tray=await p.evaluate(()=>{const r=document.querySelector('#psPanel .mi').getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
  /* 2: finger left / right (outside the pet: only the eyes follow) */
  const sb=await p.locator('#psStage').boundingBox();
  /* pupil: its own sideways shift inside the eye (computed transform) and its place on screen */
  const pupil=()=>p.evaluate(()=>{const e=document.querySelector('#psPet .al-pupil'),r=document.querySelector('#psPet').getBoundingClientRect(),q=e.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(e).transform);return{dx:m.e,x:q.left+q.width/2-(r.left+r.width/2)}});
  await W(1500);
  await p.mouse.move(sb.x+8,sb.y+sb.height*.35);await p.mouse.down();await W(900);const pl=await pupil();await p.mouse.up();await W(700);
  await p.mouse.move(sb.x+sb.width-8,sb.y+sb.height*.35);await p.mouse.down();await W(900);const pr=await pupil();await p.mouse.up();await W(500);
  ok('2. 손가락을 왼쪽에 대면 눈동자가 왼쪽, 오른쪽에 대면 오른쪽',pl.dx<-1&&pr.dx>1&&pr.x-pl.x>2,`눈 안에서 눈동자 이동 왼쪽 ${pl.dx.toFixed(1)} / 오른쪽 ${pr.dx.toFixed(1)} (그림 단위) · 화면 위치 차이 ${(pr.x-pl.x).toFixed(1)}px`);
  await W(Math.max(0,8000-(Date.now()-tPet)));const pbl=await blinks(pet);
  ok('1. 미용실 손님: 8초 안에 깜빡임 1번 이상',pbl>=1,pbl+'번');
  /* foam: hold on the pet until done, check the tool size */
  const pb=await p.locator(pet).boundingBox();
  await p.mouse.move(pb.x+pb.width*.5,pb.y+pb.height*.42);await p.mouse.down();await W(400);
  const toolW=(await st()).tool;
  const foamTool=(await st()).alive.tool;
  if(SHOT)await p.screenshot({path:path.join(SHOT,'6_tool_after.png')});
  for(let k=0,t0=Date.now();Date.now()-t0<30000&&(await st()).phase==='foam';k++){await p.mouse.move(pb.x+pb.width*(.35+.3*Math.random()),pb.y+pb.height*(.25+.4*Math.random()));await W(100)}
  await p.mouse.up();
  ok('5. 도구 폭 175px 이상 (390px 화면, 쓰는 중)',toolW&&toolW.w>=175,toolW?'수세미 '+Math.round(toolW.w)+'px':'도구 없음');
  ok('5. 도구 칸의 도구 그림 150px 이상',tray>=150,tray+'px');
  ok('수세미를 대고 있는 동안 손님 반응(whileTool sponge)',foamTool==='sponge');
  await W(300);s=await st();
  const clapAt=s.log.indexOf('play:clap');
  ok('4. 과정(거품)이 끝날 때 큰 동작(hop 또는 clap) 기록',clapAt>s.log.indexOf('press:rub')&&clapAt>=0,s.log.filter(x=>/^play:/.test(x)).join(' '));
  /* 3: shower vs dryer */
  await p.waitForFunction(()=>window.ML.__ps().phase==='rinse',null,{timeout:8000});await W(2200);
  const holdPose=async ph=>{const r=await p.locator(pet).boundingBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.4);await p.mouse.down();await W(700);
    const o={pose:await pose(pet),st:(await st()).alive};await seq(ph==='rinse'?'2_shower':'3_dryer',4,450);
    for(let k=0;k<150&&(await st()).phase===ph;k++){await p.mouse.move(r.x+r.width*(.3+.4*Math.random()),r.y+r.height*(.25+.4*Math.random()));await W(100)}
    return o};
  const rinseHold=async()=>{const r=await p.locator(pet).boundingBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.4);await p.mouse.down();await W(700);
    const o={pose:await pose(pet),st:(await st()).alive};await seq('2_shower',4,450);await p.mouse.up();await W(700);
    /* back to normal (a blink may happen at that moment: look a few times, 0.3 s apart) */
    let back;for(let k=0;k<6;k++){back={pose:await pose(pet),st:(await st()).alive};if(!back.st.classes.includes('al-blink')&&/matrix\(1, 0, 0, 1, 0, 0\)|none/.test(back.pose.eyeS))break;await W(300)}
    return{o,back}};
  const R=await rinseHold();
  const idleEye=R.back.pose.eyeS,idleMouth=R.back.pose.mouthO;
  /* finish rinsing */
  {const r=await p.locator(pet).boundingBox();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.4);await p.mouse.down();for(let k=0;k<150&&(await st()).phase==='rinse';k++){await p.mouse.move(r.x+r.width*(.3+.4*Math.random()),r.y+r.height*(.25+.4*Math.random()));await W(100)}await p.mouse.up()}
  await p.waitForFunction(()=>window.ML.__ps().phase==='dry',null,{timeout:8000});await W(2000);
  const D=await holdPose('dry');await p.mouse.up();
  const sh=R.o,dr=D;
  ok('3. 샤워 중: 눈 꼭 감기 · 입 아~ (whileTool shower)',sh.st.tool==='shower'&&sh.pose.mouthO==='1'&&/matrix\(1, 0, 0, 0\.1/.test(sh.pose.eyeS),'눈 '+sh.pose.eyeS+' 입 '+sh.pose.mouthO);
  ok('3. 드라이 중: 귀가 바람에 날림 · 눈 가늘게 (whileTool dryer)',dr.st.tool==='dryer'&&dr.pose.earS!==R.back.pose.earS&&/matrix\(1, 0, 0, 0\.55/.test(dr.pose.eyeS),'귀 '+dr.pose.earS+' 눈 '+dr.pose.eyeS);
  ok('3. 샤워 중과 드라이 중의 표정·자세가 서로 다름',sh.st.tool!==dr.st.tool&&(sh.pose.eyeS!==dr.pose.eyeS||sh.pose.earS!==dr.pose.earS)&&sh.pose.mouthO!==dr.pose.mouthO,`샤워 [${sh.st.classes.join(' ')}] · 드라이 [${dr.st.classes.join(' ')}]`);
  ok('3. 손을 떼면 기본으로 돌아옴',R.back.st.tool===null&&!R.back.st.classes.some(c=>/^al-t-/.test(c))&&idleMouth==='0'&&/matrix\(1, 0, 0, 1, 0, 0\)|none/.test(idleEye),'뗀 뒤 도구 '+R.back.st.tool+', 눈 '+idleEye+', 입 '+idleMouth);
  /* dress → mirror → dance */
  await p.waitForFunction(()=>window.ML.__ps().phase==='dress',null,{timeout:10000});await W(1200);
  for(const slot of ['head','neck']){const [x,y]=(await st()).slotPts[slot];await p.mouse.click(x,y);await W(600);await p.locator('#psPanel .ps-card').first().click();await W(2800)}
  await p.waitForFunction(()=>window.ML.__ps().mirror,null,{timeout:15000});
  await p.locator('#psMirBtn').click();await W(700);await seq('4_dance',4,450);
  await W(SHOT?3000:4500);
  s=await st();const plays=await p.evaluate(()=>window.ML.Alive.log.map(x=>({who:x.who,name:x.name,t0:x.t0,t1:x.t1})));
  const byWho={};plays.forEach(x=>{(byWho[x.who]=byWho[x.who]||[]).push(x)});
  const overlap=Object.values(byWho).some(a=>a.sort((u,v)=>u.t0-v.t0).some((x,k)=>k&&x.t0<a[k-1].t1-1));
  const maxPlays=await p.evaluate(()=>window.__maxPlays);
  ok('4. 큰 동작이 동시에 두 개 돌지 않음 (한 캐릭터에 한 번에 하나)',!overlap&&maxPlays<=1,'기록된 큰 동작 '+plays.length+'개 · 동시에 최대 '+maxPlays+'개 · 미용실 손님: '+s.log.filter(x=>/^play:/.test(x)).join(' '));
  ok('끝나면 춤 → 손 흔들기',s.log.includes('play:dance')&&s.log.includes('play:wave'));
  /* 6: leave the screen → no timers */
  await p.evaluate(()=>window.ML.go('home'));await W(400);
  const st6=await p.evaluate(()=>window.ML.Alive.stats());
  ok('6. 미용실을 떠나면 타이머 0개 (캐릭터 0, rAF 0)',st6.instances===0&&st6.timers===0&&st6.raf===0,JSON.stringify(st6));

  /* ---------- nail shop: the guest looks at her nails ---------- */
  await p.evaluate(()=>{window.ML.go('nailshop')});await p.waitForFunction(()=>window.ML.__ns().phase==='lobby',null,{timeout:6000});await W(600);
  let n=await ns();ok('네일숍 가게 앞 손님도 살아 있음',n.lobbyAlive.length===3,n.lobbyAlive.map(a=>a.kind).join(', '));
  const mi=n.lobby.findIndex(c=>c&&c.kind==='mom');await p.locator(`.nl-cust[data-i="${mi>=0?mi:0}"]`).click();
  await p.waitForFunction(()=>window.ML.__ns().phase==='color',null,{timeout:10000});await W(400);
  const cu='#nsCust';await watchBlink(cu);
  const c1=await pose(cu);await W(2000);const c2=await pose(cu);
  ok('1. 네일숍 손님: 2초 간격 몸·머리·눈 변형 값이 다름',sig(c1)!==sig(c2),'머리 '+c1.head+' → '+c2.head);
  const nr=(await ns()).nails[1].rect;await p.mouse.move(nr.left+nr.width/2,nr.top+nr.height/2);await p.mouse.down();await W(500);
  const nTool=await p.evaluate(()=>{const t=[...document.querySelectorAll('#nsStage .tl-tool')].find(x=>x.style.display==='block');return t?Math.round(t.getBoundingClientRect().width):0});
  const nAl=(await ns()).alive;await p.mouse.up();
  ok('네일숍: 칠하는 동안 손님이 손톱을 내려다봄 (whileTool nailBrush)',nAl&&nAl.tool==='nailBrush',nAl&&nAl.classes.join(' '));
  const handW=await p.evaluate(()=>document.getElementById('nsHand').getBoundingClientRect().width);
  ok('네일숍 도구(붓)는 손 그림 폭의 55%',Math.abs(nTool-handW*.55)<3,'붓 '+nTool+'px · 손 '+Math.round(handW)+'px');
  await W(6000);const nbl=await blinks(cu);
  ok('1. 네일숍 손님: 8초 안에 깜빡임 1번 이상',nbl>=1,nbl+'번');
  /* the page is hidden (phone locked, other app): every character timer stops, and starts again when it comes back */
  const hid=await p.evaluate(async()=>{const set=v=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'))};
    set(true);await new Promise(r=>setTimeout(r,300));const a=window.ML.Alive.stats(),paused=document.querySelectorAll('.alive.al-paused').length;
    set(false);await new Promise(r=>setTimeout(r,300));const b=window.ML.Alive.stats();delete document.hidden;return{a,b,paused}});
  ok('화면이 숨겨지면 캐릭터 타이머 0개 · 움직임 멈춤, 돌아오면 다시',hid.a.timers===0&&hid.a.instances>0&&hid.paused===hid.a.instances&&hid.b.timers>0,'숨김 '+JSON.stringify(hid.a)+' 멈춘 캐릭터 '+hid.paused+' → 다시 타이머 '+hid.b.timers+'개');
  await p.evaluate(()=>window.ML.go('home'));await W(400);
  const st7=await p.evaluate(()=>window.ML.Alive.stats());
  ok('6. 네일숍을 떠나면 타이머 0개',st7.instances===0&&st7.timers===0&&st7.raf===0,JSON.stringify(st7));

  /* 6: declared animation durations (repeating ones, and every character motion) on the screens of 12-가:
     salon, nail shop, alive.js, the tools. Other screens are listed for information only. */
  const decl=await p.evaluate(()=>{const bad=[],seen=[],other=[];const mine=/#petsalon|\.ps-|\.lb-|#nailshop|\.ns-|\.nl-|#ns|\.alive|\.al-|\.tl-|\.tf/;const toMs=v=>v.split(',').map(x=>x.trim()).map(x=>x.endsWith('ms')?parseFloat(x):parseFloat(x)*1000);
    const scan=rules=>{for(const r of rules){if(r.cssRules&&!r.style){scan(r.cssRules);continue}if(!r.style)continue;const nm=r.style.animationName;if(!nm||nm==='none')continue;
      const it=r.style.animationIterationCount||'1',dur=r.style.animationDuration||'0s',sel=r.selectorText||'';
      const rep=it.split(',').some(x=>x.trim()==='infinite'||parseFloat(x)>1),ch=/alive|al-|\.tf|lb-cust|nl-cust|nsHand|ns-bean|tl-tool/.test(sel);
      if(!(rep||ch))continue;if(/var\(/.test(dur)){seen.push(sel+' '+dur);continue}
      const ms=toMs(dur);if(!mine.test(sel)){if(ms.some(m=>m>0&&m<600))other.push(sel+' '+dur);continue}seen.push(sel+' '+dur+' ×'+it);if(ms.some(m=>m>0&&m<600))bad.push(sel+' '+dur+' ×'+it)}};
    for(const sh of document.styleSheets){try{scan(sh.cssRules)}catch(e){}}return{bad,n:seen.length,other}});
  const fast=await p.evaluate(()=>[...window.__fast]);
  ok('6. 선언된 animation-duration: 미용실·네일숍·캐릭터·도구의 반복 움직임 모두 0.6초 이상',decl.bad.length===0,decl.bad.length?decl.bad.join(' ; '):'검사한 규칙 '+decl.n+'개');
  if(decl.other.length)console.log('   (참고: 12-가 밖 다른 화면의 0.6초 미만 반복 움직임 '+decl.other.length+'개: '+decl.other.join(' ; ')+')');
  ok('6. 실제로 돈 반복 애니메이션도 0.6초 미만 없음',fast.length===0,fast.join(' ; ')||'없음');
  ok('오류 없음',errs.length===0,JSON.stringify(errs.slice(0,5)));
  console.log(fails?'\n실패 '+fails+'개':'\n12-가 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.stack.split('\n').slice(0,3).join(' / '));process.exit(1)});
