/* P2 2-가 완료 기준 검사: node tests/p2a.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 가게 앞에 손님 3마리, 콕 한 손님이 미용실에 들어옴(동물 종류 같음), 뒤로 가기는 가게 앞으로
   2) 샤워 단계에서 동물 왼쪽 위만 문지르면 그 칸만 지워지고 오른쪽 아래 칸은 그대로, 계속하면 85%에서 끝남
   3) 샤워기·드라이기가 손가락을 따라 움직이고, 물줄기·바람은 대고 있을 때만 보임
   4) 가만히 대고만 있어도 거품·헹굼·말림이 각각 20초 안에 끝남
   5) 붙이기 → 같은 자리 바꾸기 → 끌어서 떼기 → 다시 붙이기 → 콕으로 색 바꾸기, 거울을 누르기 전에는 끝나지 않음(40초)
   6) 거울을 누르면 가게 앞으로 돌아오고 벽 액자가 1개 늘어남 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));
    /* 2-나: these checks need the dryer and neck/face cards, so start the salon at level 2 with every decoration unlocked */
    localStorage.setItem('mallang_progress',JSON.stringify({petsalon:{level:2,clears:0}}));localStorage.setItem('mallang_salon',JSON.stringify({served:0,wall:[],items:{unlocked:window.MLCFG.games.petsalon.itemUnlock.order,fresh:[],photoSeen:[]}}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps());
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,'p2a_'+n+'.png')})};
  const waitPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ps().phase===ph,ph,{timeout:t});
  const petBox=()=>p.locator('#psPet').boundingBox();
  const enterLobby=async()=>{await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('petsalon'));await waitPhase('lobby',6000);await W(400)};
  const pickNeed=async need=>{await waitPhase('lobby',10000);const s=await st();const i=s.lobby.findIndex(c=>c&&c.need===need&&!c.inside);await p.locator(`.lb-cust[data-i="${i}"]`).click();
    await p.waitForFunction(()=>window.ML.__ps().view==='salon',null,{timeout:4000});return s.lobby[i]};
  const holdStill=async(fx,fy,ph)=>{const r=await petBox(),x=r.x+r.width*fx,y=r.y+r.height*fy;await p.mouse.move(x,y);const t0=Date.now();await p.mouse.down();
    while(Date.now()-t0<25000){await W(200);if((await st()).phase!==ph)break}await p.mouse.up();return(Date.now()-t0)/1000};

  /* ---------- 1. shop front ---------- */
  await enterLobby();
  let s=await st();
  const nCust=await p.locator('.lb-cust').count();
  await shot('1lobby');
  ok('가게 앞: 손님 3마리가 의자에 앉아 있음',s.view==='lobby'&&nCust===3&&s.lobby.filter(Boolean).length===3,'손님 '+s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  const bubbles=await p.locator('.lb-cust .lb-bub svg').count();
  ok('손님마다 원하는 것 말풍선(그림)',bubbles===3,'말풍선 '+bubbles+'개');
  const sizes=await p.$$eval('.lb-cust',a=>a.map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))}));
  ok('손님 버튼 110px 이상',Math.min(...sizes)>=110,'가장 작은 것 '+Math.min(...sizes)+'px');
  const want=s.lobby[1];await p.locator('.lb-cust[data-i="1"]').click();
  await p.waitForFunction(()=>window.ML.__ps().view==='salon',null,{timeout:4000});s=await st();
  ok('콕 한 손님이 미용실에 들어옴 (동물 종류 같음)',s.customer&&s.customer.kind===want.kind&&s.customer.need===want.need,'고른 손님 '+want.kind+' → 미용실 '+(s.customer&&s.customer.kind));
  await W(600);await p.locator('#psBack').click();await W(400);s=await st();
  ok('미용실의 뒤로 가기는 가게 앞으로',s.view==='lobby'&&s.phase==='lobby'&&(await p.locator('.lb-cust').count())===3,'view '+s.view);
  const homeVisible=await p.locator('#psHome').isVisible();ok('가게 앞에는 집 버튼',homeVisible);

  /* ---------- visit 1: muddy customer ---------- */
  await pickNeed('muddy');await waitPhase('foam',8000);await W(400);
  const tFoam1=await holdStill(.5,.42,'foam');
  await waitPhase('rinse',6000);await W(1300);

  /* ---------- 2 + 3. shower follows the finger, only the top-left cells are washed ---------- */
  let r=await petBox();
  const A1={x:r.x+r.width*.24,y:r.y+r.height*.2},B1={x:r.x+r.width*.38,y:r.y+r.height*.34};
  ok('손가락 대기 전에는 물줄기 없음',(await st()).fx===null);
  await p.mouse.move(A1.x,A1.y);await p.mouse.down();await W(120);
  const tA=(await st()).tool,fxOn=(await st()).fx;
  await p.mouse.move(B1.x,B1.y,{steps:4});await W(120);
  const tB=(await st()).tool;
  ok('샤워기가 손가락을 따라 움직임',tA&&tB&&Math.hypot(tA.x-tB.x,tA.y-tB.y)>20,tA&&tB?`(${Math.round(tA.x)},${Math.round(tA.y)}) → (${Math.round(tB.x)},${Math.round(tB.y)})`:'도구 없음');
  ok('샤워기 그림 폭 130px 이상, 손가락 위쪽',tB&&tB.w>=130&&tB.bottom<B1.y,tB?'폭 '+Math.round(tB.w)+'px, 아래끝 '+Math.round(tB.bottom)+' / 손가락 '+Math.round(B1.y):'');
  ok('대고 있는 동안 물줄기 보임',fxOn&&/water/.test(fxOn.kind)&&fxOn.parts>5,fxOn?fxOn.kind+' 요소 '+fxOn.parts+'개':'없음');
  // scrub only the top-left of the pet for ~2.4 s (keeps moving, so no hold-still help)
  for(let k=0;k<60;k++){const a=k*.45;await p.mouse.move(r.x+r.width*(.3+.09*Math.cos(a)),r.y+r.height*(.27+.08*Math.sin(a*1.3)));await W(30)}
  await shot('2shower');
  s=await st();
  const tl=s.cells.filter(c=>c.col<=2&&c.row<=2),br=s.cells.filter(c=>c.col>=3&&c.row>=3);
  const tlDone=tl.filter(c=>c.v>=1).length,brTouched=br.filter(c=>c.v>0).length;
  console.log('   칸 상태(헹굼, 1=다 씻김, -=동물 밖):\n'+s.grid.map(row=>'   '+row.map(v=>v==null?'  -  ':v.toFixed(2)).join(' ')).join('\n'));
  ok('왼쪽 위만 문지르면 그 칸만 지워지고 오른쪽 아래 칸은 그대로',tlDone>=3&&brTouched===0,`왼쪽 위 ${tl.length}칸 중 ${tlDone}칸 씻김, 오른쪽 아래 ${br.length}칸 중 ${brTouched}칸 건드림`);
  await p.mouse.up();await W(150);
  ok('손을 떼면 물줄기와 샤워기가 사라짐',(await st()).fx===null&&(await st()).tool===null);
  // keep washing everywhere until it finishes
  r=await petBox();
  for(let k=0;k<400&&(await st()).phase==='rinse';k++){
    await p.mouse.move(r.x+r.width*(.3+.4*((k*7)%10)/10),r.y+r.height*(.2+.55*((k*3)%10)/10));await p.mouse.down();
    for(let j=0;j<8;j++){await p.mouse.move(r.x+r.width*(.25+.5*Math.random()),r.y+r.height*(.2+.6*Math.random()),{steps:3});await W(25)}
    await p.mouse.up();
  }
  s=await st();
  ok('계속하면 85%에서 헹굼 끝 (나머지는 저절로)',s.doneRatio.rinse>=.85&&s.doneRatio.rinse<1.0001,'끝난 순간 처리된 칸 '+Math.round(s.doneRatio.rinse*100)+'%');
  await waitPhase('dry',6000);await W(1300);

  /* ---------- 3. dryer ---------- */
  r=await petBox();
  ok('드라이 시작 전에는 바람 없음',(await st()).fx===null);
  const A2={x:r.x+r.width*.3,y:r.y+r.height*.3},B2={x:r.x+r.width*.62,y:r.y+r.height*.5};
  await p.mouse.move(A2.x,A2.y);await p.mouse.down();await W(150);
  const dA=(await st()).tool,wOn=(await st()).fx;
  await p.mouse.move(B2.x,B2.y,{steps:5});await W(150);const dB=(await st()).tool;
  ok('드라이기가 손가락을 따라 움직임',dA&&dB&&Math.hypot(dA.x-dB.x,dA.y-dB.y)>20,dA&&dB?`(${Math.round(dA.x)},${Math.round(dA.y)}) → (${Math.round(dB.x)},${Math.round(dB.y)})`:'도구 없음');
  ok('대고 있는 동안 바람 줄 보임',wOn&&/wind/.test(wOn.kind)&&wOn.parts>=4,wOn?wOn.kind+' 요소 '+wOn.parts+'개':'없음');
  for(let k=0;k<40;k++){await p.mouse.move(r.x+r.width*(.25+.5*(k%10)/10),r.y+r.height*(.2+.35*Math.floor(k/10)/4));await W(30)}
  await shot('3dryer');
  await p.mouse.up();await W(150);
  ok('손을 떼면 바람과 드라이기가 사라짐',(await st()).fx===null&&(await st()).tool===null);
  const tDry1=await holdStill(.5,.5,'dry');

  /* ---------- 5. free dressing ---------- */
  await waitPhase('dress',8000);await W(900);
  const cardsN=()=>p.locator('#psPanel .ps-card').count();
  const tapPt=async([x,y])=>{await p.mouse.click(x,y);await W(250)};
  const clickCard=async k=>{const c=p.locator('#psPanel .ps-card').nth(k);await c.click();await W(900)};
  s=await st();await tapPt(s.slotPts.neck);s=await st();const neckA=s.cards&&s.cards.items.slice();
  ok('목을 콕 → 목 장식 카드 3장',s.cards&&s.cards.slot==='neck'&&(await cardsN())===3,neckA&&neckA.join(', '));
  await tapPt(s.slotPts.neck);s=await st();const neckB=s.cards&&s.cards.items.slice();
  ok('같은 자리를 다시 콕 → 다른 3장',neckB&&neckA&&neckB.join()!==neckA.join()&&(await cardsN())===3,neckB&&neckB.join(', '));
  // drag a card onto the pet
  {const c=await p.locator('#psPanel .ps-card').nth(0).boundingBox(),pr=await petBox();await p.mouse.move(c.x+c.width/2,c.y+c.height/2);await p.mouse.down();
   await p.mouse.move(pr.x+pr.width*.55,pr.y+pr.height*.6,{steps:10});await p.mouse.up();await W(900)}
  s=await st();ok('카드를 동물에게 끌어다 놓으면 붙음',s.worn.neck&&s.worn.neck.item===neckB[0],JSON.stringify(s.worn.neck));
  await tapPt(s.slotPts.head);s=await st();const headCards=s.cards.items.slice();
  await clickCard(0);s=await st();const first=s.worn.head&&s.worn.head.item;
  ok('붙이기: 카드를 콕 → 머리에 붙음',first===headCards[0],'머리 '+first);
  const hadBloom=await p.evaluate(()=>!!document.querySelector('#psPet .over [data-slot="head"]'));
  await clickCard(1);s=await st();const second=s.worn.head&&s.worn.head.item;
  ok('바꾸기: 같은 자리에 다른 카드 → 바뀜',second===headCards[1]&&second!==first&&hadBloom,first+' → '+second);
  await W(400);await shot('4dress_before');
  const before=Object.keys(s.worn).length;
  {const [x,y]=s.itemPts.head,sb=await p.locator('#psStage').boundingBox();await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x-40,y-30,{steps:4});await p.mouse.move(sb.x+20,sb.y+30,{steps:8});await p.mouse.up();await W(700)}
  s=await st();ok('떼기: 머리 장식을 끌어서 밖으로 → 떨어짐',!s.worn.head&&Object.keys(s.worn).length===before-1,'남은 것: '+Object.keys(s.worn).join(', '));
  await shot('5dress_after');
  await tapPt(s.slotPts.head);await clickCard(2);s=await st();
  ok('다시 붙이기',s.worn.head&&s.worn.head.item===s.cards.items[2],'머리 '+(s.worn.head&&s.worn.head.item));
  const col0=s.worn.head.color;await W(300);s=await st();await tapPt(s.itemPts.head);await W(400);s=await st();
  ok('색 바꾸기: 붙은 장식을 콕 → 다음 색',s.worn.head&&s.worn.head.color!==col0&&s.worn.head.item===s.cards.items[2],col0+' → '+(s.worn.head&&s.worn.head.color));
  ok('한 화면 카드 3장 이하',(await cardsN())<=3,(await cardsN())+'장');
  const t40=Date.now();let mirrorAt=0,phases=new Set();
  while(Date.now()-t40<40000){await W(1000);s=await st();phases.add(s.phase);if(s.mirror&&!mirrorAt)mirrorAt=(Date.now()-t40)/1000}
  ok('장식을 붙이고 40초 기다려도 꾸미기 그대로 (저절로 끝나지 않음)',phases.size===1&&phases.has('dress'),'단계: '+[...phases].join(','));
  ok('거울 버튼이 조용히 나타남 (110px 이상)',s.mirror&&(await p.locator('#psMirBtn').boundingBox()).width>=110,'나타난 때 ~'+mirrorAt+'초(기다리기 시작 기준)');
  ok('30초 가만히 있으면 안내 손이 거울을 가리킴',s.guide.on&&s.guide.type==='tap',JSON.stringify(s.guide));

  /* ---------- 6. mirror → shop front, one more frame ---------- */
  const wall0=s.frames;
  await p.locator('#psMirBtn').click();await W(1900);await shot('6mirror');
  await W(1500);await shot('6mirror_frame');
  await p.waitForFunction(()=>window.ML.__ps().view==='lobby',null,{timeout:8000});await W(1200);await shot('7lobby_back');
  await waitPhase('lobby',8000);s=await st();
  ok('거울을 누르면 가게 앞으로 돌아오고 벽 액자가 1개 늘어남',s.view==='lobby'&&s.frames===wall0+1&&s.wall===wall0+1,'액자 '+wall0+' → '+s.frames);
  ok('새 손님이 걸어와 빈 의자에 앉음 (3마리)',(await p.locator('.lb-cust').count())===3&&s.lobby.filter(Boolean).length===3);
  await shot('8lobby_new');

  /* ---------- 4. visit 2: hold still in every washing step ---------- */
  await pickNeed('muddy');await waitPhase('foam',8000);await W(400);
  const tFoam=await holdStill(.5,.42,'foam');await waitPhase('rinse',6000);await W(400);
  const tRinse=await holdStill(.5,.42,'rinse');await waitPhase('dry',6000);await W(400);
  const tDry=await holdStill(.5,.42,'dry');
  ok('가만히 대고만 있어도 각 씻기 단계가 20초 안에 끝남',[tFoam,tRinse,tDry,tFoam1,tDry1].every(t=>t<20),`거품 ${tFoam.toFixed(1)}초 · 헹굼 ${tRinse.toFixed(1)}초 · 말림 ${tDry.toFixed(1)}초 (첫 손님: 거품 ${tFoam1.toFixed(1)}초, 말림 ${tDry1.toFixed(1)}초)`);
  s=await st();
  console.log('   반응 기록:',s.log.filter(x=>/react/.test(x)).join(' ')||'없음');
  ok('오류 없음',errs.length===0,JSON.stringify(errs));
  console.log(fails?'\n실패 '+fails+'개':'\n2-가 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
