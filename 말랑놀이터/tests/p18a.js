/* P18 18-가 완료 기준 검사: node tests/p18a.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 말린 모습에 흰 덩어리 요소가 없음(요소 이름으로 확인) + 네 동물 캡처
   2) 드라이기를 왼쪽에 댈 때와 오른쪽에 댈 때 가닥 각도의 부호가 반대
   3) 손을 떼고 1초 뒤 가닥 각도가 0 근처 (바람에 움직인 만큼 = 쉬는 자세와의 차이)
   4) 조랑말 손님이 2단계에서 나오고 끝까지 진행 (씻기 → 헹굼 → 수건 → 드라이 → 빗질 → 머리 모양 → 장식 → 거울)
   5) 콕만으로 드라이 단계 완료
   (기존 검사 salon, p2a, p2b, p12a, rules, monkey 는 따로 돌립니다) */
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
    localStorage.setItem('mallang_progress',JSON.stringify({petsalon:{level:2,clears:0}}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps());
  const shot=async(n,sel)=>{if(!SHOT)return;if(sel)await p.locator(sel).screenshot({path:path.join(SHOT,n+'.png')});else await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const waitPhase=(ph,ms=12000)=>p.waitForFunction(ph=>window.ML.__ps().phase===ph,ph,{timeout:ms});
  const petBox=()=>p.locator('#psPet').boundingBox();
  const scrub=async ph=>{const r=await petBox();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.4);await p.mouse.down();
    for(let k=0;k<300&&(await st()).phase===ph;k++){await p.mouse.move(r.x+r.width*(.3+.4*Math.random()),r.y+r.height*(.2+.45*Math.random()));await W(60)}await p.mouse.up()};

  /* ---------- 1. the dried look: no white lumps (by element name), soft outline instead ---------- */
  const dry=await p.evaluate(()=>{const A=window.ART,out={};['bunny','dog','cat','bear'].forEach(k=>{const d=document.createElement('div');d.innerHTML=A.animal(k,'happy',{lash:true,state:'fluffy'});
    out[k]={lumps:d.querySelectorAll('[class*="tuft"],.pc-fluffy *').length,bumps:d.querySelectorAll('.ps-fb').length,out:[...d.querySelectorAll('.ps-fb')].filter(e=>e.style.getPropertyValue('--f')==='1.00').length,shine:d.querySelectorAll('.ps-sheen').length}});return out});
  ok('1. 말린 모습(네 동물)에 흰 덩어리 요소 없음 · 윤곽이 보송한 물결로',Object.values(dry).every(v=>v.lumps===0&&v.bumps>=24&&v.out>=24&&v.shine===2),JSON.stringify(dry));
  const doll=await p.evaluate(()=>{const d=document.createElement('div');d.innerHTML=window.ART.animal('dolly','happy',{lash:true,state:'fluffy'});return{fur:d.querySelectorAll('.ps-fb,.ps-fur,.ps-sheen').length,hair:d.querySelectorAll('.hs').length}});
  ok('인형(사람) 얼굴에는 털 물결·윤기 호 없음 (보송한 것은 머리카락만)',doll.fur===0&&doll.hair>0,JSON.stringify(doll));
  if(SHOT){await p.evaluate(()=>{const A=window.ART,d=document.createElement('div');d.id='gal';d.style.cssText='position:fixed;inset:0;z-index:999;background:#F6EEE6;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;align-content:start';
    ['bunny','dog','cat','bear'].forEach(k=>{const c=document.createElement('div');c.style.cssText='aspect-ratio:200/230;padding:8px';c.innerHTML=A.animal(k,'happy',{lash:true,state:'fluffy'});c.firstElementChild.style.cssText='width:100%;height:100%;overflow:visible';d.appendChild(c)});document.body.appendChild(d)});
    await W(200);await shot('p18a_dried_4');await p.evaluate(()=>document.getElementById('gal').remove())}

  /* ---------- 4. a pony waits at level 2 ---------- */
  await p.evaluate(()=>window.ML.go('petsalon'));await waitPhase('lobby',8000);await W(600);
  let s=await st();const natural=s.lobby.filter(c=>c&&c.need==='hair').map(c=>c.kind);
  ok('4. 2단계 가게 앞에 털이 긴 손님이 기다림',s.level===2&&natural.length===1,s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  await shot('p18a_lobby');
  if(!s.lobby.some(c=>c.kind==='pony')){await p.evaluate(()=>{window.ML.__psReset({kind:'pony'});window.ML.go('home')});await W(300);await p.evaluate(()=>window.ML.go('petsalon'));await waitPhase('lobby',8000);await W(600);s=await st()}
  const pi=s.lobby.findIndex(c=>c.kind==='pony');await p.locator(`.lb-cust[data-i="${pi}"]`).click();
  await waitPhase('foam',12000);s=await st();
  ok('4. 조랑말의 과정: 씻기 → 헹굼 → 수건 → 드라이 → 빗질 → 머리 모양',s.plan.join()==='foam,rinse,towel,dry,brush,style'&&s.hair&&s.hair.strands.length>=8&&s.hair.strands.length<=14,s.plan.join(' → ')+' · 가닥 '+(s.hair?s.hair.strands.length:0)+'개');
  await W(1500);await scrub('foam');await waitPhase('rinse');await W(2000);await scrub('rinse');
  await waitPhase('towel',10000);await W(1600);s=await st();
  const wetD=Math.max(...s.hair.strands.map(x=>x.d));await shot('p18a_hair_1_wet','#psStage');
  ok('젖은 가닥은 축 처짐 (가닥마다 마른 정도 0 근처)',wetD<.2,'가장 마른 가닥 '+wetD.toFixed(2));
  await scrub('towel');await waitPhase('dry',10000);await W(2200);

  /* ---------- 2. dryer from the left and from the right ---------- */
  const r=await petBox(),sb=await p.locator('#psStage').boundingBox();
  const hold=async(fx,name)=>{await p.mouse.move(r.x+r.width*fx,r.y+r.height*.3);await p.mouse.down();
    for(let k=1;k<=4;k++){await W(k===1?260:180);if(SHOT)await p.locator('#psStage').screenshot({path:path.join(SHOT,`p18a_mane_${name}_${k}.png`)})}
    const a=(await st()).hair.strands;return a};
  const meanDev=a=>a.reduce((s,x)=>s+x.dev[0]+x.dev[1]+x.dev[2],0)/a.length;
  const L=await hold(.18,'left');const devL=meanDev(L);await p.mouse.up();
  const t0=Date.now();await W(1000);const after=(await st()).hair.strands;const settle=Math.max(...after.map(x=>Math.max(...x.dev.map(Math.abs))));
  const R=await hold(.82,'right');const devR=meanDev(R);await p.mouse.up();await W(1000);
  const maxL=Math.max(...L.map(x=>Math.max(...x.dev.map(Math.abs))));
  ok('2. 드라이기를 왼쪽에 댈 때와 오른쪽에 댈 때 가닥 각도의 부호가 반대',Math.sign(devL)!==Math.sign(devR)&&Math.abs(devL)>3&&Math.abs(devR)>3,`왼쪽 평균 ${devL.toFixed(1)}° · 오른쪽 평균 ${devR.toFixed(1)}° · 가장 크게 ${maxL.toFixed(1)}°`);
  ok('3. 손을 떼고 1초 뒤 가닥 각도가 0 근처',settle<1,`가장 큰 차이 ${settle.toFixed(2)}°`);
  const lim=await p.evaluate(()=>window.MLCFG.motion.whileActing.maxRotateDeg);
  ok('관절 하나의 바람 각도는 motion.whileActing 한도 안',maxL<=lim+.01,maxL.toFixed(1)+'° ≤ '+lim+'°');

  /* ---------- 5. taps only: the dry step finishes ---------- */
  let taps=0;for(;taps<80&&(await st()).phase==='dry';taps++){await p.mouse.click(r.x+r.width*(.3+.4*((taps*37)%10)/10),r.y+r.height*(.25+.35*((taps*53)%10)/10));await W(220);if(taps===2)await shot('p18a_hair_2_tap','#psStage')}
  s=await st();const tapLog=s.log.filter(x=>x==='tap:dry').length;
  ok('5. 콕만으로 드라이 단계 완료 (콕마다 바람 한 번)',s.phase!=='dry'&&tapLog>=1,'콕 '+taps+'번 · 기록된 바람 '+tapLog+'번');
  await W(600);s=await st();await shot('p18a_hair_3_fluffy','#psStage');
  ok('말린 뒤 가닥이 풍성 (마른 정도 1) · 말 얼굴에는 털 물결 없음 (보송한 것은 갈기·꼬리)',s.hair.strands.every(x=>x.d>.99)&&s.fluff.length===0,'가닥 '+s.hair.strands.map(x=>x.d.toFixed(1)).join(',')+' · 물결 '+s.fluff.filter(f=>f>=1).length);
  await waitPhase('brush',10000);await W(1500);await scrub('brush');await W(300);s=await st();
  ok('빗질 뒤 가지런 (윤기)',s.hair.brushed===true);
  /* ---------- hairstyle: cards 3 at a time, tap tap = one knot each ---------- */
  await waitPhase('style',10000);await W(1200);s=await st();
  const cards1=await p.locator('#psPanel .ps-card.style').count();const first=s.log.filter(x=>/^styles:/.test(x)).pop();
  await shot('p18a_style_cards');
  const pr=await petBox();await p.mouse.click(pr.x+pr.width*.5,pr.y+pr.height*.3);await W(500);s=await st();const second=s.log.filter(x=>/^styles:/.test(x)).pop();
  ok('머리 모양 카드 3장, 머리를 콕 하면 다른 3장',cards1===3&&first!==second,first+' → '+second);
  const pickId=await p.locator('#psPanel .ps-card.style').nth(1).getAttribute('data-style');await p.locator('#psPanel .ps-card.style').nth(1).click();await W(700);
  let knots=0;for(;knots<10&&(await st()).phase==='style';knots++){await p.mouse.click(pr.x+pr.width*.5,pr.y+pr.height*.3);await W(450);if(knots===0)await shot('p18a_style_knot1','#psStage')}
  s=await st();await W(300);await shot('p18a_style_done','#psStage');
  ok('머리 모양을 고르고 콕콕(한 매듭씩)으로 완성',s.hair.style===pickId&&s.hair.knots>=1&&s.phase!=='style',pickId+' · 매듭 '+s.hair.knots+' · 콕 '+knots+'번');
  /* ---------- dress and mirror ---------- */
  await waitPhase('dress',10000);await W(900);s=await st();
  {const [x,y]=s.slotPts.head;await p.mouse.click(x,y);await W(500);await p.locator('#psPanel .ps-card').first().click();await W(1200)}
  await p.waitForFunction(()=>window.ML.__ps().mirror,null,{timeout:15000});await shot('p18a_dressed','#psStage');
  const served0=(await st()).served;await p.locator('#psMirBtn').click();
  await p.waitForFunction(()=>window.ML.__ps().view==='lobby',null,{timeout:12000});await W(1500);s=await st();
  ok('4. 조랑말 손님 끝까지 진행 → 가게 앞, 액자 1개',s.served===served0+1&&s.view==='lobby'&&s.frames>=1,'꾸민 손님 '+s.served);
  await shot('p18a_lobby_after');

  /* ---------- performance: one shared frame, stops on screen exit ---------- */
  await p.evaluate(()=>window.ML.go('home'));await W(500);const al=await p.evaluate(()=>window.ML.Alive.stats());
  ok('화면을 떠나면 움직임 0 (캐릭터·타이머·rAF·바람 0)',al.instances===0&&al.timers===0&&al.raf===0&&al.simulating===0,JSON.stringify(al));
  ok('오류 없음',errs.length===0,JSON.stringify(errs.slice(0,5)));
  console.log(fails?'\n실패 '+fails+'개':'\n18-가 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.stack.split('\n').slice(0,3).join(' / '));process.exit(1)});
