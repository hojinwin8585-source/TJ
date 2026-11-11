/* P5-나 피자가게 완료 기준 검사: node tests/pizza.js   (SHOT_DIR=폴더 를 주면 과정마다 캡처를 저장)
   1) 콕과 쓱쓱만으로 1단계 완주 (소스 → 토마토 썰기 → 올리기 → 굽기 → 건네주기)
   2) 썬 조각 수 == 접시의 조각 수 == 끝났을 때 피자 위의 수, 접시에 조각이 남아 있으면 다음으로 넘어가지 않음
   3) 옥수수가 문지르기 과정을 거침 (3단계에서 옥수수를 골라 끝까지)
   4) 화면에 글자 안내 줄과 글자 버튼이 없음, 엉뚱한 곳을 누르면 진행되지 않음, 손님이 살아 있음(ML.Alive) */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__pz());
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  /* visible text and buttons inside the pizza screen */
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('pizza'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const svgText=[...scr.querySelectorAll('svg text')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=bt.querySelector('svg'),sr=s?s.getBoundingClientRect():{width:0};return{w:Math.round(r.width),svg:Math.round(sr.width),ratio:+(sr.width/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    return{texts,svgText,btns,badBtns:btns.filter(x=>x.ratio<.5||x.text)}});
  /* do whatever the current step asks: tap the aim, rub around it, or pick a card */
  const rubAt=async s=>{const r=s.rect,cx=r.x+r.w/2,cy=r.y+r.h/2;await p.mouse.move(cx,cy);await p.mouse.down();
    for(let k=0;k<16;k++){await p.mouse.move(cx+Math.cos(k*1.1)*r.w*.32,cy+Math.sin(k*1.7)*r.h*.32,{steps:3});await W(30)}await p.mouse.up();await W(120)};
  const traceAt=async s=>{const r=s.rect,cx=r.x+r.w/2,cy=r.y+r.h/2,R=r.w*.42;for(const a of [0,Math.PI/3,2*Math.PI/3]){await p.mouse.move(cx-Math.cos(a)*R,cy-Math.sin(a)*R);await p.mouse.down();
    await p.mouse.move(cx+Math.cos(a)*R,cy+Math.sin(a)*R,{steps:14});await p.mouse.move(cx-Math.cos(a)*R,cy-Math.sin(a)*R,{steps:14});await p.mouse.up();await W(150)}};
  const shotDone=new Set();
  async function playOne(opts={}){
    const t0=Date.now(),served0=(await st()).served,stepT={};let last='',ts=Date.now();
    while(Date.now()-t0<240000){
      const s=await st();if(s.served>served0)break;
      const key=s.step+(s.t?'_'+s.t:'');if(key!==last){if(last)stepT[last]=((Date.now()-ts)/1000).toFixed(1);last=key;ts=Date.now()}
      if(opts.onStep&&await opts.onStep(s))continue;
      if(s.kind==='wait'||s.busy){await W(200);continue}
      const tag=(opts.tag||'')+String(s.pi).padStart(2,'0')+'_'+key;
      if(!shotDone.has(tag)){shotDone.add(tag);await W(2300);await shot(tag);continue}   // after the tool intro, before acting
      if(s.kind==='cards'){const pickT=opts.pick?opts.pick(s):0;await p.locator('#pzTray .pz-card').nth(pickT).click();await W(1300);continue}
      if(s.kind==='rub'){if(s.step==='slice')await traceAt(s);else await rubAt(s);continue}
      if(s.kind==='tap'){await p.mouse.click(s.aim[0],s.aim[1]);await W(s.step==='top'?450:s.step==='prep'?600:400);continue}
      await W(200);
    }
    stepT[last]=((Date.now()-ts)/1000).toFixed(1);
    return{sec:((Date.now()-t0)/1000).toFixed(1),stepT};
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('pizza'));await p.waitForFunction(()=>window.ML.__pz().phase==='sauce',null,{timeout:8000});await W(400);
  let s=await st();
  ok('1단계 과정: 소스 → 토마토 썰기 → 올리기 → 굽기 → 건네주기',s.level===1&&s.plan.join()==='sauce,prep:tomato,top:tomato,bake,serve',s.plan.join(' → '));
  ok('손님이 살아 있음 (ML.Alive)',!!s.alive&&s.alive.kind===s.cust,'손님 '+s.cust+', 깜빡임 '+(s.alive&&s.alive.blinks));
  let tc=await textCheck();
  ok('글자 안내 줄 없음 (화면의 보이는 글자 0개)',tc.texts.length===0&&tc.svgText.length===0,JSON.stringify(tc.texts.concat(tc.svgText)));
  ok('글자 버튼 없음 (모든 버튼에 그림 50% 이상)',tc.badBtns.length===0,tc.btns.map(x=>x.w+'px 그림 '+Math.round(x.ratio*100)+'%').join(', '));
  /* wrong place: the wall, three times */
  const sb=await p.locator('#pzStage').boundingBox();
  for(let k=0;k<3;k++){await p.mouse.click(sb.x+20,sb.y+30);await W(300)}
  s=await st();ok('엉뚱한 곳 3번 → 진행 없음, 응원 3번',s.step==='sauce'&&!s.sauce&&s.misses===3,'응원 '+s.misses+'번');
  let waitedOk=null,plateDuring=[],cutSeen=0;
  const r1=await playOne({tag:'L1_',onStep:async x=>{
    if(x.step==='prep')cutSeen=Math.max(cutSeen,x.counts.tomato.made);
    if(x.step==='top'&&waitedOk===null&&x.plate===1){await p.waitForFunction(()=>!window.ML.__pz().flying,null,{timeout:4000});   // one piece left on the plate: wait, nothing must move on
      plateDuring.push(x.plate);await W(3500);const y=await st();waitedOk=y.step==='top'&&y.plate===1;await shot('L1_top_onePieceLeft');return false}
    if(x.step==='top'&&x.kind==='tap'&&x.plate>0)plateDuring.push(x.plate);
    if(x.step==='serve'&&!shotDone.has('L1_final')){shotDone.add('L1_final');const c=x.counts.tomato;
      ok('썬 조각 수 == 접시에 놓인 수 == 피자 위의 수, 접시 0',c.made===4&&c.placed===4&&x.topsBy.tomato===4&&x.plate===0,`썬 ${c.made} · 접시에서 올린 ${c.placed} · 피자 위 ${x.topsBy.tomato} · 접시 남은 ${x.plate}`);}
    if(x.step==='serve'&&x.kind==='tap'&&!shotDone.has('L1_serveShot')){shotDone.add('L1_serveShot');await W(800);await shot('L1_serve');}
    if(x.phase==='eat'&&!shotDone.has('L1_eat')){shotDone.add('L1_eat');await W(1600);await shot('L1_eat');}
    return false}});
  s=await st();
  ok('접시에 1조각이 남아 있으면 3.5초 기다려도 다음으로 넘어가지 않음',waitedOk===true);
  ok('접시의 조각 수가 썬 수에서 하나씩 줄어듦',plateDuring.length>0&&Math.max(...plateDuring)<=4,'올리는 동안 접시: '+[...new Set(plateDuring)].join(','));
  ok('1단계 끝까지: 손님이 먹고 하트를 줌',s.served===1&&s.log.includes('serve'),'걸린 시간 '+r1.sec+'초 · 과정별 '+JSON.stringify(r1.stepT));
  ok('굽는 동안 손님이 배를 문지르고, 올릴 때마다 눈이 커지고, 끝나면 춤',s.log.filter(x=>x==='play:dance').length>=1,'큰 동작: '+[...new Set(s.log.filter(x=>/^play:/.test(x)))].join(', '));
  await W(3000);await shot('L1_nextCustomer');

  /* ---------- level 3: choose corn → rub the cob ---------- */
  await p.evaluate(()=>window.ML.__pzLevel(3));await W(500);
  s=await st();ok('3단계 과정에 반죽·치즈·고르기·자르기',['dough','knead','sauce','cheese','choose','bake','slice'].every(k=>s.plan.some(x=>x.startsWith(k))),s.plan.join(' → '));
  const cornLog={};
  const r3=await playOne({tag:'L3_',pick:x=>{const i=x.cards.indexOf('corn');return i>=0?i:0},onStep:async x=>{
    if(x.step==='prep'&&x.t==='corn')cornLog.rub=cornLog.rub||(x.log.includes('prep:corn:rub')&&x.kind==='rub');
    if(x.step==='prep'&&x.t==='corn'&&!shotDone.has('L3_cornMid')&&x.counts.corn&&x.counts.corn.made>=1){shotDone.add('L3_cornMid');await shot('L3_corn_rubbing')}
    if(x.step==='bake'&&!cornLog.counts){cornLog.counts=x.counts;cornLog.topsBy=x.topsBy}
    if(x.step==='slice'&&x.toolOn&&!shotDone.has('L3_sliceMid')&&x.lines&&x.lines.some(Boolean)){shotDone.add('L3_sliceMid');await shot('L3_slice_mid')}
    if(x.phase==='eat'&&!shotDone.has('L3_eat')){shotDone.add('L3_eat');await W(1600);await shot('L3_eat')}
    return false}});
  s=await st();
  const cc=cornLog.counts&&cornLog.counts.corn;
  ok('옥수수: 자루를 쓱쓱 문질러 알 떼기 과정을 거침',cornLog.rub===true&&s.log.includes('press:corn'),'고른 재료 '+JSON.stringify(s.chosen));
  ok('3단계도 만든 만큼 올림 (재료마다 썬 수 == 피자 위의 수)',!!cornLog.counts&&Object.keys(cornLog.counts).every(t=>cornLog.counts[t].made===6&&cornLog.counts[t].placed===6&&cornLog.topsBy[t]===6),JSON.stringify(cornLog.counts)+' 피자 위 '+JSON.stringify(cornLog.topsBy));
  ok('3단계 끝까지 (콕·쓱쓱·카드만)',s.served===2,'걸린 시간 '+r3.sec+'초 · 과정별 '+JSON.stringify(r3.stepT));
  tc=await textCheck();ok('3단계 화면에도 글자 없음',tc.texts.length===0&&tc.badBtns.length===0,JSON.stringify(tc.texts));
  await p.evaluate(()=>window.ML.__pzLevel(1));
  ok('오류 없음',errs.length===0,JSON.stringify(errs.slice(0,5)));
  console.log(fails?'\n실패 '+fails+'개':'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
