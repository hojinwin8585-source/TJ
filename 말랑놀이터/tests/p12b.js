/* P12 12-나 완료 기준 검사: node tests/p12b.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다(390×780 휴대폰 화면).
   미용실
   1) 과정 그림 줄의 수 == 손님의 과정 수, 지금 과정이 크게 표시되고 과정이 바뀔 때 따라감
   2) 나뭇잎 손님: 나뭇잎 떼기 → 헹굼 → 수건 → 말림 순서 (나뭇잎 5개를 콕콕, 수건은 콕 3번)
   3) 과정 사이 이음 장면(욕조에 퐁당, 의자 빙글)이 기록되고 1.5초 안팎
   4) 손님이 나가면 화면 위 바구니(홈의 당근 바구니와 같은 것)가 1 늘고, 다시 열어도 그대로
   5) 파티 손님: 꾸미기 → 향수 칙(콕 1번) → 거울
   네일숍 · 피자 · 미로
   6) 머리줄에 별 3칸, 3번 끝내면 단계 오르는 순간 화면이 나오고 단계가 오르며 별 줄이 비워짐
   7) 네일숍: 과정 그림 줄 == 단계의 과정 수, 램프 이음 장면, 2단계에서 손 쓱 이음 장면, 손님이 나가면 바구니 +1
   8) 피자 1단계에 가게 앞 손님 고르기(3명, 말풍선에 피자), 고른 손님이 들어와 주문
   9) 화면에 글자·이모지 없음, 오류 없음 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));
    /* the leafy customer comes from level 2 (needs[].from) */
    localStorage.setItem('mallang_progress',JSON.stringify({petsalon:{level:2,clears:0}}))});
  await p.reload();await p.waitForTimeout(600);
  const W=ms=>p.waitForTimeout(ms);
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y,after=350)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[]);await W(after)};
  const rubBox=async(r,n=24)=>{const cx=r.x+r.w/2,cy=r.y+r.h/2;await touch('touchStart',[[cx,cy]]);for(let k=0;k<n;k++){await touch('touchMove',[[cx+Math.cos(k*.9)*r.w*.3,cy+Math.sin(k*1.4)*r.h*.3]]);await W(30)}await touch('touchEnd',[]);await W(150)};
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const box=sel=>p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height}},sel);
  const tapSel=async(sel,after)=>{const r=await box(sel);if(!r)return false;await tap(r.x+r.w/2,r.y+r.h/2,after);return true};
  const textCheck=id=>p.evaluate(id=>{
    const scr=document.getElementById(id),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const small=[...scr.querySelectorAll('button')].filter(vis).filter(bt=>{const r=bt.getBoundingClientRect();return Math.min(r.width,r.height)<64}).map(bt=>bt.id||bt.className);
    return{texts,emoji:/\p{Extended_Pictographic}/u.test(scr.textContent),small}},id);

  /* ======================================== pet salon ======================================== */
  const ps=()=>p.evaluate(()=>window.ML.__ps());
  const psPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ps().phase===ph,ph,{timeout:t});
  const enterSalon=async()=>{await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('petsalon'));await psPhase('lobby',8000);await W(500)};
  const pickNeed=async need=>{for(let k=0;k<24;k++){await enterSalon();const s=await ps();const i=s.lobby.findIndex(c=>c&&c.need===need);
      if(i>=0){await tapSel(`.lb-cust[data-i="${i}"]`);await p.waitForFunction(()=>window.ML.__ps().view==='salon',null,{timeout:4000});return s.lobby[i]}
      await p.evaluate(()=>window.ML.__psReset())}throw new Error('no '+need)};
  const petBox=()=>box('#psPet');
  const carrots0=await p.evaluate(()=>window.ML.Room.carrots());

  /* watch the phases and the strip while a customer is served */
  const seen=[],stripAt={},linkT={};let lastPh='';
  const watch=async()=>{const s=await ps();if(s.phase!==lastPh){lastPh=s.phase;seen.push(s.phase);if(s.phase==='link'){linkT[s.links[s.links.length-1]]=Date.now()}else{const lk=seen[seen.length-2]==='link'&&s.links[s.links.length-1];if(lk&&linkT[lk]&&!linkT[lk+'_ms'])linkT[lk+'_ms']=Date.now()-linkT[lk]}
      if(['pick','rinse','towel','dry','dress'].includes(s.phase))stripAt[s.phase]={on:s.strip.on,at:s.strip.at,n:s.strip.n,shown:s.strip.shown,big:s.strip.big,done:s.strip.done}}return s};

  await enterSalon();
  {const s=await ps();ok('가게 앞 머리줄에 당근 바구니(홈과 같은 바구니)',s.strip.basket&&s.strip.n===0,'바구니 당근 '+s.strip.basketN+' · 저장된 당근 '+s.carrots);await shot('p12b_1salon_lobby_basket')}
  const c=await pickNeed('leaves');
  await psPhase('pick',12000);await W(400);
  let s=await watch();
  ok('1. 과정 그림 줄 = 이 손님의 과정 수 (나뭇잎 손님 4개)',s.strip.n===4&&s.strip.shown===4&&s.strip.keys.join()==='pick,rinse,towel,dry',`줄 ${s.strip.n}개(보이는 것 ${s.strip.shown}) · ${s.strip.keys.join(' → ')} · 씻기 과정 ${s.plan.join(',')}`);
  ok('1. 지금 과정(나뭇잎 떼기)만 크게 표시',s.strip.on==='0'&&s.strip.big>=50,`크게 표시된 칸 ${s.strip.on} · 폭 ${s.strip.big}px`);
  ok('2. 나뭇잎 5개',s.leaves===5,'나뭇잎 '+s.leaves+'개');
  await W(1800);await shot('p12b_2salon_pick_strip');
  /* wrong place first: the corner of the stage → gentle encouragement, nothing falls */
  {const sb=await box('#psStage');await tap(sb.x+12,sb.y+sb.h*.5);s=await ps();ok('엉뚱한 곳을 콕 → 응원만, 나뭇잎 그대로',s.leaves===5&&s.misses>=1,'응원 '+s.misses+'번')}
  for(let k=0;k<14&&(await ps()).phase==='pick';k++){const r=await petBox(),t=[[.5,.4],[.3,.55],[.7,.55],[.5,.7],[.35,.3],[.65,.3]][k%6];await tap(r.x+r.w*t[0],r.y+r.h*t[1],380);if(k===1)await shot('p12b_3salon_leaf_falls')}
  s=await ps();ok('2. 나뭇잎을 콕콕 → 다 떨어짐',s.leaves===0&&s.log.filter(x=>/^pick:\d/.test(x)).length===5,'떼어 낸 잎 '+s.log.filter(x=>/^pick:\d/.test(x)).length);
  /* rinse: rub with the shower */
  for(let k=0;k<80;k++){s=await watch();if(s.phase==='link'&&s.links[s.links.length-1]==='plop'&&!linkT.shotPlop){linkT.shotPlop=1;await W(700);await shot('p12b_4salon_link_plop')}if(s.phase==='rinse')break;await W(120)}
  for(let k=0;k<30&&(s=await watch()).phase==='rinse';k++)await rubBox(await petBox(),20);
  for(let k=0;k<80;k++){s=await watch();if(s.phase==='towel')break;await W(120)}
  await W(1600);s=await watch();
  ok('1. 과정이 바뀌면 줄의 큰 칸도 따라감 (헹굼 1번 → 수건 2번 칸)',stripAt.rinse&&stripAt.rinse.on==='1'&&stripAt.towel&&stripAt.towel.on==='2'&&stripAt.towel.done===2,JSON.stringify({rinse:stripAt.rinse,towel:stripAt.towel}));
  for(let k=0;k<3;k++){const r=await petBox();await tap(r.x+r.w*.5,r.y+r.h*.62,450);if(k===0)await shot('p12b_5salon_towel_wrap')}
  s=await ps();ok('2. 수건: 콕 3번 → 감쌌다 풀림',s.pats===3&&s.log.includes('pat:3'),'톡톡 '+s.pats+'번');
  for(let k=0;k<80;k++){s=await watch();if(s.phase==='dry')break;await W(120)}
  for(let k=0;k<30&&(s=await watch()).phase==='dry';k++)await rubBox(await petBox(),20);
  for(let k=0;k<100;k++){s=await watch();if(s.phase==='link'&&s.links[s.links.length-1]==='spin'&&!linkT.shotSpin){linkT.shotSpin=1;await W(650);await shot('p12b_6salon_link_spin')}if(s.phase==='dress')break;await W(100)}
  const order=seen.filter(x=>['pick','rinse','towel','dry'].includes(x));
  ok('2. 나뭇잎 손님 순서: 떼기 → 헹굼 → 수건 → 말림',order.join()==='pick,rinse,towel,dry',order.join(' → '));
  s=await ps();
  ok('3. 이음 장면: 욕조에 퐁당(plop) · 욕조에서 나옴(out) · 의자 빙글(spin), 순서대로',s.links.join()==='plop,out,spin',s.links.join(', '));
  {const L2=s.linkMs.slice(-3),ms=k=>(L2.find(x=>x.k===k)||{}).ms||0;
    ok('3. 이음 장면 길이 1.5초 안팎 (퐁당·빙글), 욕조에서 나오기는 짧게',ms('plop')>=1300&&ms('plop')<=1900&&ms('spin')>=1300&&ms('spin')<=1900&&ms('out')>0&&ms('out')<1000,L2.map(x=>x.k+' '+x.ms+'ms').join(' · '))}
  ok('1. 꾸미기 때는 네 과정 모두 별(끝남)',stripAt.dress&&stripAt.dress.done===4&&stripAt.dress.on===undefined,JSON.stringify(stripAt.dress));
  /* dress: tap the head, one card; wait for the mirror and press it */
  await W(900);s=await ps();await tap(...s.slotPts.head,500);await tapSel('#psPanel .ps-card',900);
  await p.waitForFunction(()=>window.ML.__ps().mirror,null,{timeout:16000});await W(900);await shot('p12b_7salon_dressed');
  await tapSel('#psMirBtn',300);
  await p.waitForFunction(()=>window.ML.__ps().view==='lobby',null,{timeout:12000});
  await W(500);await shot('p12b_8salon_reward_flying');
  await W(1300);s=await ps();
  const carrots1=s.carrots;
  ok('4. 손님이 나가면 당근 1개가 위 바구니로 (저장된 당근 +1, 바구니 그림에도)',carrots1===carrots0+1&&s.strip.basket&&s.strip.basketN===Math.min(5,carrots1)&&s.log.includes('reward'),`당근 ${carrots0} → ${carrots1} · 바구니 그림 ${s.strip.basketN}개`);
  await shot('p12b_9salon_basket_after');
  /* reload: the basket keeps it (ML.Room = the home basket) */
  await p.reload();await W(700);
  {const n=await p.evaluate(()=>window.ML.Room.carrots());await enterSalon();s=await ps();
    const home=await p.evaluate(()=>{window.ML.go('home');return 0});await W(900);
    const hb=await p.evaluate(()=>{const e=document.querySelector('#home .hm-basket .rm-basket-art');return e?+e.dataset.n:-1});
    ok('4. 다시 열어도 바구니의 당근 그대로 (가게 앞 바구니와 홈 바구니 모두)',n===carrots1&&s.strip.basketN===Math.min(5,n)&&hb===Math.min(5,n),`다시 연 뒤 당근 ${n} · 가게 앞 바구니 ${s.strip.basketN} · 홈 바구니 ${hb}`);void home}
  /* the party customer: dress → perfume → mirror */
  await pickNeed('party');await psPhase('dress',12000);await W(900);s=await ps();
  ok('1. 파티 손님의 과정 줄: 꾸미기 → 향수 (2개, 꾸미기가 크게)',s.strip.n===2&&s.strip.keys.join()==='dress,perfume'&&s.strip.on==='0',s.strip.keys.join(' → ')+' · 큰 칸 '+s.strip.on);
  await tap(...s.slotPts.head,500);await tapSel('#psPanel .ps-card',900);
  await p.waitForFunction(()=>window.ML.__ps().mirror,null,{timeout:16000});await W(600);await tapSel('#psMirBtn',600);
  s=await ps();ok('5. 거울을 누르면 먼저 향수 칙 (향수 병 하나, 줄의 큰 칸은 향수)',s.phase==='perfume'&&s.strip.on==='1'&&(await p.locator('#psPanel .ps-perf').count())===1,'단계 '+s.phase+' · 큰 칸 '+s.strip.on);
  {const r=await box('#psPanel .ps-perf');ok('향수 병 누르는 자리 110px 이상',r&&r.w>=110&&r.h>=110,r&&Math.round(r.w)+'px')}
  await W(1200);await shot('p12b_10salon_perfume');
  await tapSel('#psPanel .ps-perf',700);await shot('p12b_11salon_perfume_hearts');
  s=await ps();ok('5. 향수를 콕 → 하트 구름, 그다음 거울 장면',s.log.includes('perfume')&&s.perfume.done,s.phase);
  await p.waitForFunction(()=>window.ML.__ps().view==='lobby',null,{timeout:12000});await W(1600);
  s=await ps();ok('파티 손님도 나가면 당근 +1',s.carrots===carrots1+1,'당근 '+s.carrots);
  {const t=await textCheck('petsalon');ok('미용실: 보이는 글자·이모지 없음',!t.texts.length&&!t.emoji,JSON.stringify(t.texts))}

  /* ======================================== nail shop ======================================== */
  const ns=()=>p.evaluate(()=>window.ML.__ns());
  const nsPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ns().phase===ph,ph,{timeout:t});
  const nailRound=async(n,o={})=>{
    await nsPhase('lobby',15000);await W(600);let s=await ns();
    if(n===1){ok('네일숍 가게 앞: 머리줄에 별 3칸(빈 칸)과 당근 바구니',s.starsN===3&&s.starsOn===0&&s.strip.basket,`별 ${s.starsOn}/${s.starsN} · 바구니 ${s.strip.basket}`);await shot('p12b_12nail_lobby')}
    await tapSel('.nl-slot:nth-child(2) .nl-cust');await p.waitForFunction(()=>window.ML.__ns().view==='room',null,{timeout:5000});
    if(o.level2){await nsPhase('file',12000);await W(500);s=await ns();
      ok('네일숍 2단계: 과정 줄 4개(갈기 → 색 → 굽기 → 꾸미기), 갈기가 크게',s.strip.n===4&&s.strip.at===0&&s.plan.join()==='file,color,cure,stamp+parts',`줄 ${s.strip.n} · ${s.plan.join(' → ')}`);
      await shot('p12b_17nail_level2_strip');
      for(const i of [0,1,2]){const r=(await ns()).nails[i].rect;await touch('touchStart',[[r.left+r.width/2,r.top+r.height*.5]]);
        for(let c2=0;c2<10;c2++){await touch('touchMove',[[r.left+r.width*(c2%2?.2:.8),r.top+r.height*(.05+.04*(c2%3))]]);await W(40)}
        const t0=Date.now();while(Date.now()-t0<15000){const x=await ns();if(x.done.includes(i))break;await W(200)}await touch('touchEnd',[]);await W(300)}
      await p.waitForFunction(()=>window.ML.__ns().next,null,{timeout:6000});await W(900);await tapSel('#nsNext',200);
      await W(500);s=await ns();ok('네일숍 이음 장면: 다음 과정 전에 손을 쓱 내밀기(slide)',s.phase==='link'&&s.links.includes('slide'),'단계 '+s.phase+' · '+s.links.join(','));
      await shot('p12b_18nail_link_slide');
      await nsPhase('color',6000);s=await ns();ok('네일숍: 이음 장면 뒤 색 칠하기, 줄의 큰 칸이 2번째로',s.strip.at===1,'큰 칸 '+s.strip.at);
      return}
    await nsPhase('color',12000);await W(400);s=await ns();
    if(n===1){ok('네일숍 1단계: 과정 그림 줄 = 과정 수 3개(색 → 굽기 → 보석), 색이 크게',s.strip.n===3&&s.strip.shown===3&&s.strip.at===0,`줄 ${s.strip.n} · 지금 ${s.strip.at} · ${s.plan.join(' → ')}`);await W(1500);await shot('p12b_13nail_strip')}
    for(const i of [0,1,2]){const r=(await ns()).nails[i].rect;await tap(r.left+r.width/2,r.top+r.height/2,200);const t0=Date.now();while(Date.now()-t0<9000){if((await ns()).done.includes(i))break;await W(200)}}
    await p.waitForFunction(()=>window.ML.__ns().next,null,{timeout:8000});await W(700);await tapSel('#nsNext',300);
    await nsPhase('cure',6000);await W(500);s=await ns();
    if(n===1){ok('네일숍 이음 장면: 램프가 내려옴(lamp), 줄의 큰 칸이 굽기로',s.links.includes('lamp')&&s.strip.at===1,s.links.join(',')+' · 큰 칸 '+s.strip.at)}
    await tapSel('#nsPanel .ns-card',300);await nsPhase('deco',16000);await W(600);
    await tapSel('#nsPanel .ns-card',300);for(const i of [0,2]){const r=(await ns()).nails[i].rect;await tap(r.left+r.width/2,r.top+r.height/2,400)}
    await p.waitForFunction(()=>window.ML.__ns().mirror,null,{timeout:16000});await W(500);await tapSel('#nsMir',300);
    await p.waitForFunction(()=>window.ML.__ns().view==='lobby',null,{timeout:12000});
  };
  await p.evaluate(()=>window.ML.go('nailshop'));
  const nc0=await p.evaluate(()=>window.ML.Room.carrots());
  await nailRound(1);await W(500);if(SHOT)await shot('p12b_14nail_reward');await W(900);s=await ns();
  ok('네일숍: 1번 끝내면 별 1칸, 손님이 나가며 당근 +1 (바구니)',s.starsOn===1&&s.carrots===nc0+1&&s.strip.basketN===Math.min(5,nc0+1),`별 ${s.starsOn} · 당근 ${nc0} → ${s.carrots}`);
  await nailRound(2);await W(1400);s=await ns();ok('네일숍: 2번 끝내면 별 2칸',s.starsOn===2,'별 '+s.starsOn);
  await nailRound(3);
  {let mom=false,lv=0;for(let k=0;k<40;k++){s=await ns();if(s.moment&&!mom){mom=true;await W(500);await shot('p12b_15nail_levelup')}lv=s.progress.level;if(mom&&!s.moment)break;await W(150)}
    await W(600);s=await ns();ok('6. 네일숍: 3번 끝내면 단계 오르는 순간(새 과정 그림과 이름) → 2단계, 별 줄은 빈 칸',mom&&s.progress.level===2&&s.starsOn===0&&s.log.some(x=>/^levelup:2:step:file/.test(x)),`순간 ${mom} · 단계 ${s.progress.level} · 별 ${s.starsOn} · ${s.log.filter(x=>/^levelup/.test(x)).join(',')}`);
    await shot('p12b_16nail_after_levelup')}
  await nailRound(4,{level2:true});
  {const t=await textCheck('nailshop');ok('네일숍: 보이는 글자·이모지 없음',!t.texts.length&&!t.emoji,JSON.stringify(t.texts))}

  /* ======================================== pizza ======================================== */
  const pz=()=>p.evaluate(()=>window.ML.__pz());
  const pizzaRound=async n=>{
    await p.waitForFunction(()=>window.ML.__pz().phase==='lobby',null,{timeout:15000});await W(900);let s=await pz();
    if(n===1){
      ok('8. 피자 1단계: 가게 앞에 손님 3명, 말풍선에 피자(토마토)',s.level===1&&s.lobby&&s.lobby.length===3&&(await p.locator('#pzLobby .pz-lc .lc-bub svg').count())===3&&s.lobby.every(c=>c.want&&c.want.join()==='tomato'),s.lobby&&s.lobby.map(c=>c.kind+'('+(c.want||[]).join('+')+')').join(', '));
      ok('8. 손님 그림 누르는 자리 110px 이상, 고를 것 3개 이하',s.lobby.every(c=>c.w>=110)&&s.lobby.length<=3,s.lobby.map(c=>Math.round(c.w)+'px').join(', '));
      ok('6. 피자 머리줄에 별 3칸',s.starsN===3&&s.starsOn===0,`별 ${s.starsOn}/${s.starsN}`);
      const d=await p.evaluate(()=>window.ML.__pzDepth()[0]);ok('8. 깊이 훅: 피자 1단계에도 고르기 있음',d.choice===true&&d.choices.includes('customer'),JSON.stringify(d.choices));
      await shot('p12b_19pizza_lobby');
      /* a wrong place: the shop wall */
      const sb=await box('#pzStage');await tap(sb.x+sb.w*.5,sb.y+30);s=await pz();ok('가게 앞 빈 곳을 콕 → 응원만, 손님 그대로',s.phase==='lobby'&&s.misses>=1,'응원 '+s.misses)}
    const pickI=n%3,who=s.lobby[pickI];await tap(who.x,who.y,300);
    await p.waitForFunction(()=>window.ML.__pz().phase!=='lobby',null,{timeout:4000});s=await pz();
    if(n===1)ok('8. 고른 손님이 들어와 주문함',s.cust===who.kind&&s.log.includes('pick:'+who.kind),'고른 손님 '+who.kind+' · 들어온 손님 '+s.cust);
    const t0=Date.now(),served0=s.served;
    while(Date.now()-t0<200000){s=await pz();if(s.served>served0)break;
      if(s.kind==='wait'||s.busy||s.phase==='lobby'){await W(200);continue}
      if(s.kind==='cards'){await tapSel('#pzTray .pz-card',1300);continue}
      if(s.kind==='rub'){await rubBox(s.rect,22);continue}
      if(s.kind==='tap'){await tap(s.aim[0],s.aim[1],s.step==='top'?450:500);continue}
      await W(200)}
  };
  await p.evaluate(()=>window.ML.go('pizza'));
  await pizzaRound(1);await W(1500);s=await pz();ok('피자: 1번 끝내면 별 1칸',s.starsOn===1,'별 '+s.starsOn);
  await pizzaRound(2);await pizzaRound(3);
  {let mom=false;for(let k=0;k<80;k++){s=await pz();if(s.moment&&!mom){mom=true;await W(500);await shot('p12b_20pizza_levelup')}if(mom&&!s.moment)break;await W(150)}
    await W(800);s=await pz();ok('6. 피자: 3번 끝내면 단계 오르는 순간(버섯) → 2단계, 별 줄 빈 칸',mom&&s.progress.level===2&&s.starsOn===0&&s.log.some(x=>/^levelup:2:top:mushroom/.test(x)),`순간 ${mom} · 단계 ${s.progress.level} · 별 ${s.starsOn}`)}
  await p.waitForFunction(()=>window.ML.__pz().phase==='lobby',null,{timeout:8000});await W(900);s=await pz();
  ok('피자 2단계도 가게 앞 손님 고르기 (말풍선에 토마토+버섯)',s.level===2&&s.lobby&&s.lobby.length===3&&s.lobby.every(c=>c.want.join()==='tomato,mushroom'),s.lobby&&s.lobby.map(c=>c.want.join('+')).join(', '));
  await shot('p12b_21pizza_level2_lobby');
  {const t=await textCheck('pizza');ok('피자: 보이는 글자·이모지 없음',!t.texts.length&&!t.emoji,JSON.stringify(t.texts))}

  /* ======================================== maze ======================================== */
  const mz=()=>p.evaluate(()=>window.ML.__mz());
  await p.evaluate(()=>window.ML.go('maze'));
  const mazeRound=async n=>{
    await p.waitForFunction(()=>{const s=window.ML.__mz();return s.phase==='idle'&&!s.busy&&!s.won},null,{timeout:20000});await W(300);let s=await mz();
    if(n===1){ok('6. 미로 머리줄에 별 3칸',s.starsN===3&&s.starsOn===0,`별 ${s.starsOn}/${s.starsN}`);await shot('p12b_22maze_stars')}
    const t0=Date.now();while(Date.now()-t0<60000){s=await mz();if(s.won)break;if(s.busy||s.phase!=='idle'){await W(200);continue}
      const o=s.options.find(x=>!x.wrong)||s.options[0];if(!o){await W(200);continue}await tap(s.stage.left+o.x,s.stage.top+o.y,400)}
  };
  await mazeRound(1);await W(1500);s=await mz();ok('미로: 1번 끝내면 별 1칸',s.starsOn===1,'별 '+s.starsOn);
  await mazeRound(2);await mazeRound(3);
  {let mom=false;for(let k=0;k<120;k++){s=await mz();if(s.moment&&!mom){mom=true;await W(500);await shot('p12b_23maze_levelup')}if(mom&&!s.moment)break;await W(150)}
    await W(1500);s=await mz();ok('6. 미로: 3번 끝내면 단계 오르는 순간(피자 배달) → 2단계, 별 줄 빈 칸',mom&&s.progress.level===2&&s.lv===2&&s.starsOn===0,`순간 ${mom} · 단계 ${s.progress.level} · 별 ${s.starsOn}`)}
  {const d=await p.evaluate(()=>window.ML.__mzDepth());ok('미로 깊이 훅(ML.__mzDepth)',d.length===5&&d[1].choice===true,d.map(x=>x.level+':'+x.processes).join(' '))}

  ok('오류 없음',errs.length===0,JSON.stringify(errs.slice(0,5)));
  console.log(fails?'\n실패 '+fails+'개':'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
