/* P17 식당 검사: node tests/restaurant.js
   진짜 터치(모바일 화면 + CDP Input.dispatchTouchEvent)로
   1) 호텔 아침 식사(1단계): 콕만으로 토스터 → 달걀 → 과일 순서로 끝까지, '다음' 버튼 없음, 구운 빵 = 접시 빵, 씻은 과일 = 접시 과일
   2) 바삭 치킨(2단계, 쓱쓱은 손가락 끌기로): 치킨 4조각을 다 넣기 전에는 다음 과정이 안 됨(3조각에서 3초 기다려도 그대로), 튀김옷 = 기름 = 노릇 = 바구니
   3) 과정마다: 글자·이모지 없음, 누를 것 110px 이상, 카드 3장 이하, 입자 수 ≤ motion.particles.max
   4) 깊이 표(ML.__rsDepth)
   5) 버거(3단계, 콕만으로): 모든 재료가 쌓기 전에 아이 손으로 준비됨(빵 자르기·고기 굽기·뒤집기·치즈 녹이기·상추 씻고 찢기·토마토 썰기), 만든 만큼 쓰기,
      틀린 순서(뚜껑 빵·토마토 먼저)는 튀어 돌아옴, 끌어다 놓기도 됨, 물 주전자가 손가락 위에 떠서 그릇을 가리지 않음(겹치면 60% 투명), 별 줄과 단계 오르는 순간
   6) 파스타 + 곁들임(4단계): 주스·샐러드 두 판 다 끝까지, 말풍선에 그림 두 개, 두 가지 다 건네줌
   7) 손님은 주문하는 순간과 건네주는 순간에 무대 높이의 45% 이상
   SHOT_DIR=폴더 를 주면 과정 캡처(deviceScaleFactor 1)를 저장 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
const results=[];const ok=(name,pass,info)=>{results.push({name,pass,info});console.log(`${pass?'통과':'실패'} | ${name}${info?' | '+info:''}`)};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});await p.reload();await p.waitForTimeout(500);
  const cdp=await ctx.newCDPSession(p);const W=ms=>p.waitForTimeout(ms);
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
  const tap=async(x,y)=>{await touch('touchStart',[{x,y}]);await W(40);await touch('touchEnd',[])};
  const drag=async(r)=>{const cx=r.x+r.w/2,cy=r.y+r.h/2;await touch('touchStart',[{x:cx,y:cy}]);for(let k=0;k<26;k++){await touch('touchMove',[{x:cx+Math.cos(k*.9)*r.w*.33,y:cy+Math.sin(k*1.3)*r.h*.3}]);await W(30)}await touch('touchEnd',[])};
  const st=()=>p.evaluate(()=>window.ML.__rs());
  const CFG=await p.evaluate(()=>window.MLCFG);const MAXP=((CFG.motion||{}).particles||{}).max||40;
  /* what the child sees now: text, emoji, buttons */
  const scan=()=>p.evaluate(()=>{const scr=document.getElementById('restaurant'),out={text:[],emoji:[],small:[],extraBtn:[],cards:0};
    const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x&&x!==document.body;x=x.parentElement){if(x.hidden)return false;const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(!t||!vis(n.parentElement))continue;if(/\p{Extended_Pictographic}/u.test(t))out.emoji.push(t);out.text.push(t.slice(0,12))}
    [...scr.querySelectorAll('button')].filter(vis).forEach(bt=>{const r=bt.getBoundingClientRect();if(bt.classList.contains('rs-back'))return;
      if(bt.classList.contains('rs-card'))out.cards++;else if(!bt.classList.contains('rs-lc'))out.extraBtn.push(bt.className);
      if(Math.min(r.width,r.height)<110)out.small.push(bt.className+' '+Math.round(r.width)+'x'+Math.round(r.height))});
    return out});
  const agg={text:new Set(),emoji:new Set(),small:new Set(),extra:new Set(),maxCards:0,smallHot:new Set(),peak:0};
  const look=async s=>{const v=await scan();v.text.forEach(t=>agg.text.add(t));v.emoji.forEach(t=>agg.emoji.add(t));v.small.forEach(t=>agg.small.add(t));v.extraBtn.forEach(t=>agg.extra.add(t));agg.maxCards=Math.max(agg.maxCards,v.cards);
    (s.hot||[]).forEach(h=>{if(Math.min(h.w,h.h)<110)agg.smallHot.add(s.phase+' '+h.w+'x'+h.h)})};
  /* play one round. mode 'tap' = taps only; 'drag' = rubbing steps by finger drags. hook(s) may intervene */
  async function play(menu,mode,hook){
    let s=await st();const t0=Date.now();const seen=[];const served0=s.served;let snap=null;const big={order:0,serve:0,two:false,shots:{}};
    while(s.view!=='lobby'||s.phase!=='lobby'){await W(200);s=await st()}
    await look(s);await tap(...s.custPts[s.orders.indexOf(menu)]);
    while(Date.now()-t0<300000){s=await st();agg.peak=Math.max(agg.peak,s.particlePeak);
      if(s.phase==='enter'&&s.cust.bubble){big.order=Math.max(big.order,s.cust.ratio);big.two=big.two||s.cust.two;if(!big.shots.order&&s.cust.ratio>.4){big.shots.order=1;await W(700);await shot(menu+'_order')}}
      if(s.phase==='serve'){big.serve=Math.max(big.serve,s.cust.ratio);if(!big.shots.serve){big.shots.serve=1;await W(900);await shot(menu+'_serve')}}
      if(s.phase==='eat')snap=snap||s;if(s.served>served0&&snap)return Object.assign(snap,{served:s.served,big});
      if(s.kind!=='wait'&&!s.busy&&seen[seen.length-1]!==s.phase+pi(s)){seen.push(s.phase+pi(s));await W(650);await look(await st());if(SHOT&&['burger','pasta'].includes(menu))await shot(`${menu}_${String(seen.length).padStart(2,'0')}_${s.phase.replace(':','-')}`)}
      if(hook&&await hook(s))continue;
      if(s.kind==='cards'){const c=s.cards.find(c=>c.ok);if(c){await tap(c.x,c.y);await W(1300)}continue}
      if(s.kind==='tap'&&s.aim&&!s.busy){await tap(...s.aim);await W(420);continue}
      if(s.kind==='rub'&&s.toolOn&&!s.toolDone){if(mode==='drag'){await drag(s.rect);await W(250)}else{const ph=s.phase;for(const q of s.cellPts){const s2=await st();if(s2.phase!==ph||!s2.toolOn||s2.toolDone)break;await tap(q[0],q[1]);await W(110)}}continue}
      await W(200)}
    return Object.assign(await st(),{big});
  }
  const pi=s=>s.pi;

  /* ---------- 1) breakfast by taps only ---------- */
  await p.evaluate(()=>{window.ML.__rsLevel(1);window.ML.go('restaurant')});await W(1200);
  let s=await play('toast','tap');const bigT=s.big;
  const done=s.log.filter(x=>x.startsWith('done:')).map(x=>x.slice(5));
  const ix=k=>done.indexOf(k);
  ok('호텔 아침 식사: 콕만으로 끝까지 (손님이 받음)',s.served>=1&&s.log.includes('serve'),`과정 ${done.join(' → ')}`);
  ok('순서: 토스터 → 달걀 → 과일',ix('toastPop')>=0&&ix('toastPop')<ix('crack')&&ix('flip')<ix('wash')&&ix('wash')<ix('plateFruit'),`토스터 ${ix('toastPop')} · 달걀 깨기 ${ix('crack')} · 뒤집기 ${ix('flip')} · 씻기 ${ix('wash')}`);
  const c=s.cnt;
  ok('만든 만큼 쓰기(아침)',c.toastMade===c.toastPlated&&c.toastPlated===s.nBread&&c.eggs===1&&c.eggPlated===1&&c.washed===c.fruitPlated&&c.fruitPlated===s.nFruit,`구운 빵 ${c.toastMade} = 접시 빵 ${c.toastPlated} · 달걀 ${c.eggs} = 접시 ${c.eggPlated} · 씻은 과일 ${c.washed} = 접시 과일 ${c.fruitPlated}`);
  ok('손동작이 상태를 바꿈(빵 갈색·달걀 하양·뒤집힘)',c.press>=3&&s.toastHeat>=1&&s.eggCooked>=.99&&s.flipped,`레버 ${c.press}번, 빵 ${s.toastHeat}, 달걀 익음 ${s.eggCooked.toFixed(2)}, 뒤집힘 ${s.flipped}`);

  /* ---------- 2) chicken: all four pieces before the next step ---------- */
  await W(6000);
  await p.evaluate(()=>window.ML.__rsLevel(2));await W(1200);
  let gate=null;
  s=await play('chicken','drag',async s=>{
    if(s.phase==='drop'&&s.kind==='tap'&&!s.busy&&s.cnt.dropped===s.nChicken-1&&!gate){await W(3000);const y=await st();gate={phase:y.phase,dropped:y.cnt.dropped,pot:y.pot.length,left:y.cp.filter(x=>x==='dish').length};return false}
    return false});
  ok(`치킨 ${s.nChicken}조각을 다 넣기 전에는 다음 과정이 안 됨`,!!gate&&gate.phase==='drop'&&gate.dropped===s.nChicken-1&&gate.left===1,gate?`${gate.dropped}조각 넣고 3초 뒤: 과정 ${gate.phase}, 접시에 남은 조각 ${gate.left}`:'확인 못 함');
  const bigC=s.big;const dn=s.log.filter(x=>x.startsWith('done:')).map(x=>x.slice(5));
  ok('바삭 치킨: 끌기(쓱쓱)로 끝까지',s.served>=2&&s.log.filter(x=>x==='serve').length>=2,`과정 ${dn.slice(-5).join(' → ')}`);
  const k=s.cnt;ok('만든 만큼 쓰기(치킨)',k.coated===s.nChicken&&k.dropped===s.nChicken&&k.fried===s.nChicken&&k.basket===s.nChicken,`튀김옷 ${k.coated} = 기름 ${k.dropped} = 노릇 ${k.fried} = 바구니 ${k.basket}`);

  /* ---------- 5) burger (level 3) by touch ---------- */
  await W(6000);
  await p.evaluate(()=>{window.ML.__rsLevel(3);const P=window.ML.Progress;P.clear('restaurant');P.clear('restaurant')});await W(1200);
  let wrongT=null,dragT=null,pitch=null;
  s=await play('burger','tap',async s=>{
    /* the pitcher floats above the finger and is see-through over the bowl */
    if(s.phase==='wash2'&&s.toolOn&&!s.toolDone&&!pitch){const r=s.rect,fx=r.x+r.w*.45,fy=r.y+r.h*.5;await touch('touchStart',[{x:fx,y:fy}]);
      for(let k=1;k<=4;k++){await touch('touchMove',[{x:fx+k*6,y:fy+k*2}]);await W(60)}
      pitch=await p.evaluate(([fx,fy,r])=>{const t=[...document.querySelectorAll('#rsStage .tl-tool')].find(e=>e.style.display==='block');if(!t)return null;const q=t.getBoundingClientRect();
        const over=!(q.right<r.x||q.left>r.x+r.w||q.bottom<r.y||q.top>r.y+r.h);return{bottom:q.bottom,top:q.top,h:q.height,fy:fy+8,over,op:+getComputedStyle(t).opacity}},[fx,fy,r]);
      await shot('burger_pitcher');await touch('touchEnd',[]);await W(300);return true}
    /* wrong order: the top bun and the tomato before the bottom bun → they hop back, nothing is stacked */
    if(s.phase==='stack'&&s.kind==='tap'&&!s.busy&&s.stack&&!wrongT&&s.stack.items.length===5&&!s.stack.layers.length){await W(900);const z=await st();const it=k=>z.stack.items.find(x=>x.k===k);
      const c0=it('crown'),t0=it('tomato');await tap(c0.x,c0.y);await W(1400);await tap(t0.x,t0.y);await W(400);await shot('burger_wrong');await W(1000);
      const y=await st(),c1=y.stack.items.find(x=>x.k==='crown'),t1=y.stack.items.find(x=>x.k==='tomato');
      wrongT={layers:y.stack.layers.length,back:Math.hypot(c1.x-c0.x,c1.y-c0.y)<4&&Math.hypot(t1.x-t0.x,t1.y-t0.y)<4,log:y.log.filter(x=>x.startsWith('wrong:stack:')),wrong:y.cnt.stackWrong};return true}
    /* drag and drop: the bottom bun is dragged onto the plate */
    if(s.phase==='stack'&&s.kind==='tap'&&!s.busy&&wrongT&&!dragT&&s.stack&&!s.stack.layers.length){const h=s.stack.items.find(x=>x.k==='heel'),pl=s.stack.plate;
      await touch('touchStart',[{x:h.x,y:h.y}]);for(let k=1;k<=12;k++){await touch('touchMove',[{x:h.x+(pl.x-h.x)*k/12,y:h.y+(pl.y-h.y)*k/12}]);await W(35)}await touch('touchEnd',[]);await W(1300);
      const y=await st();dragT={layers:y.stack.layers.slice(),dragged:y.log.includes('drag:heel')};return true}
    return false});
  const starsIn=await p.evaluate(()=>{const e=document.getElementById('rsStars');return e?{n:e.querySelectorAll('.mlp-star').length,on:e.querySelectorAll('.mlp-star.on').length}:null});
  await W(6000);const lvLog=(await st()).log;
  const bl=s.log,iS=bl.findIndex(x=>x.startsWith('stack:')),iOf=k=>bl.indexOf(k);
  const prep=['done:slice','done:press','done:flipP','done:melt','done:wash2','done:tear','done:cut','ready:halves','ready:patty','ready:lettuce','ready:tomato'];
  ok('버거: 콕(과 끌기)으로 끝까지, 손님이 받음',s.served>=3&&bl.filter(x=>x==='serve').length>=3,`과정 ${bl.filter(x=>x.startsWith('done:')).slice(-14).map(x=>x.slice(5)).join(' → ')}`);
  ok('버거: 모든 재료가 쌓기 전에 손으로 준비됨',iS>0&&prep.every(k=>iOf(k)>=0&&iOf(k)<iS),prep.map(k=>`${k.replace(/^(done|ready):/,'')} ${iOf(k)}`).join(' · ')+` · 첫 쌓기 ${iS}`);
  const bc=s.cnt;
  ok('버거: 손동작이 모습을 바꿈(칼질 3번에 반쪽, 분홍 → 갈색, 뒤집기, 치즈 녹음, 소스, 꾹)',bc.stroke>=3&&bc.bunCut===1&&bc.pressed===1&&bc.flipped===1&&bc.melted===1&&bc.sauced===1&&bc.lidPress===1&&s.sauceN>=6,
    `칼질 ${bc.stroke} · 반쪽 ${bc.bunCut} · 굽기 ${bc.pressed} · 뒤집기 ${bc.flipped} · 치즈 ${bc.melted} · 소스 점 ${s.sauceN} · 꾹 ${bc.lidPress}`);
  ok('버거: 만든 만큼 쓰기',bc.heelUsed+bc.crownUsed===2*bc.bunCut&&bc.lettuceTorn===bc.lettuceStacked&&bc.lettuceTorn===3&&bc.tomatoCut===bc.tomatoStacked&&bc.tomatoCut>=2&&bc.pattyUsed===bc.melted,
    `빵 반쪽 2 = 쌓은 빵 ${bc.heelUsed+bc.crownUsed} · 찢은 상추 ${bc.lettuceTorn} = 쌓은 상추 ${bc.lettuceStacked} · 썬 토마토 ${bc.tomatoCut} = 쌓은 토마토 ${bc.tomatoStacked} · 고기 ${bc.pattyUsed}`);
  ok('버거: 틀린 순서는 튀어 돌아오고 아무것도 안 쌓임(응원)',!!wrongT&&wrongT.layers===0&&wrongT.back&&wrongT.log.includes('wrong:stack:crown')&&wrongT.log.includes('wrong:stack:tomato'),
    wrongT?`뚜껑 빵·토마토 먼저 콕 → 쌓인 것 ${wrongT.layers}개 · 제자리로 돌아옴 ${wrongT.back} · ${wrongT.log.join(',')}`:'확인 못 함');
  ok('버거: 끌어다 놓기로도 쌓임',!!dragT&&dragT.dragged&&dragT.layers[0]==='heel',dragT?`쌓인 것 ${dragT.layers.join(',')}`:'확인 못 함');
  ok('물 주전자: 손가락 위에 떠서 그릇을 가리지 않음(겹치면 60% 투명)',!!pitch&&pitch.bottom<=pitch.fy&&(!pitch.over||pitch.op<=.45),
    pitch?`주전자 아래끝 ${Math.round(pitch.bottom)} ≤ 손가락 ${Math.round(pitch.fy)} · 그릇과 겹침 ${pitch.over} · 불투명도 ${pitch.op}`:'확인 못 함');
  ok('별 줄(3칸)과 단계 오르는 순간(3단계 → 4단계, 파스타)',!!starsIn&&starsIn.n===3&&starsIn.on===3&&lvLog.includes('star:3')&&lvLog.some(x=>x==='levelup:4:pasta'),`별 ${starsIn&&starsIn.on}/${starsIn&&starsIn.n} 다 참 · ${lvLog.filter(x=>x.startsWith('levelup')).join(',')||'없음'}`);
  const bigs=[['아침',bigT],['치킨',bigC],['버거',s.big]];

  /* ---------- 6) pasta + juice, pasta + salad (level 4) ---------- */
  for(const sd of ['juice','salad']){
    await W(5000);await p.evaluate(k=>{window.ML.__rsSide(k);window.ML.__rsLevel(4)},sd);await W(1200);
    const r=await play('pasta','tap');const L=r.log,c=r.cnt,sv=r.served;bigs.push(['파스타+'+sd,r.big]);
    const side=sd==='juice'?['done:juice','done:pour']:['done:chopS','done:tossS'];
    const want=['done:boil','done:noodles','done:stir','done:drain','done:sauceP','done:toss','done:twirl','done:sprinkle',...side];
    const L2=(await st()).log,Lr=L2.slice(L2.lastIndexOf('level:4'));void L;
    ok(`파스타+${sd==='juice'?'주스':'샐러드'}: 끝까지, 두 가지 다 건네주고 먹음`,r.side===sd&&want.every(k=>Lr.includes(k))&&Lr.includes('sip')&&Lr.includes('bite'),`과정 ${Lr.filter(x=>x.startsWith('done:')).map(x=>x.slice(5)).join(' → ')} · 마시기/먹기 ${Lr.includes('sip')}`);
    ok(`파스타+${sd==='juice'?'주스':'샐러드'}: 손동작이 모습을 바꿈·만든 만큼 쓰기`,c.heat>=3&&c.noodlesIn===2&&r.soft>=1&&c.drained===1&&c.shake>=2&&c.sauce===3&&c.toss===3&&r.nest>=1&&c.sprinkled===1&&
      (sd==='juice'?c.squeezed===3&&c.pourSips===c.squeezed&&r.glassFill>=.77:c.cukeCut===3&&c.cukeIn===c.cukeCut&&c.tossedS===1),
      `불 ${c.heat} · 면 ${c.noodlesIn}묶음 · 말랑 ${r.soft} · 탈탈 ${c.shake} · 국자 ${c.sauce} · 휙 ${c.toss} · 돌돌 ${r.nest} · `+(sd==='juice'?`짠 오렌지 ${c.squeezed} = 부은 만큼 ${c.pourSips} · 컵 ${r.glassFill.toFixed(2)}`:`썬 오이 ${c.cukeCut} = 그릇 ${c.cukeIn} · 섞기 ${c.tossedS}`));
    ok(`파스타+${sd==='juice'?'주스':'샐러드'}: 말풍선에 그림 두 개`,r.big.two);
  }
  /* ---------- 7) the customer is big at the order and the serve moments ---------- */
  ok('손님이 주문·건네받는 순간 무대 높이의 45% 이상',bigs.every(([,b])=>b&&b.order>=.45&&b.serve>=.45),bigs.map(([n,b])=>`${n} 주문 ${Math.round(b.order*100)}% · 건네기 ${Math.round(b.serve*100)}%`).join(' / '));

  /* ---------- 3) every screen seen ---------- */
  ok('글자 없음',!agg.text.size,[...agg.text].join(', ')||'');
  ok('이모지 없음',!agg.emoji.size,[...agg.emoji].join(', ')||'');
  ok("'다음' 같은 버튼 없음(뒤로·손님·카드 말고 버튼 없음)",!agg.extra.size,[...agg.extra].join(', ')||'');
  ok('누를 것 110px 이상',!agg.small.size&&!agg.smallHot.size,[...agg.small,...agg.smallHot].join(', ')||'');
  ok('카드 3장 이하',agg.maxCards<=3,`가장 많을 때 ${agg.maxCards}장`);
  ok(`입자 수 ≤ ${MAXP}`,agg.peak<=MAXP&&agg.peak>0,`가장 많을 때 ${agg.peak}개`);
  const sAlive=await st();ok('손님은 ML.Alive',s.log.some(x=>x.startsWith('play:'))&&s.log.includes('sniff')&&s.log.includes('bite'),`큰 동작 ${s.log.filter(x=>x.startsWith('play:')).length}번, 킁킁 ${s.log.filter(x=>x==='sniff').length}번, 한 입 ${s.log.filter(x=>x==='bite').length}번`);void sAlive;

  /* ---------- 4) depth ---------- */
  const depth=await p.evaluate(()=>window.ML.__rsDepth());
  console.log('\n깊이 표 (ML.__rsDepth)\n단계 | 메뉴 | 과정 | 손동작 | 손님 | 고르기 | 끝내기 | 아직 없는 메뉴');
  depth.forEach(d=>console.log([d.level,d.menus.join('+'),d.byMenu.map(r=>`${r.menu} ${r.processes}(${r.list.join(',')})`).join(' / '),d.handActions.join('+'),d.customer?'있음':'없음',d.choice?'있음':'없음',d.ending?'건네주기·냠냠·춤':'없음',d.notBuilt.join(',')||'-'].join(' | ')));
  ok('깊이: 과정 4개 이상 · 손동작 2가지 이상 · 손님 · 고르기 · 끝내기',depth.every(d=>d.processes>=4&&d.handActions.filter(h=>h!=='choose').length>=2&&d.customer&&d.choice&&d.ending));
  ok('페이지 오류 없음',!errs.length,errs.slice(0,3).join(' / '));
  const bad=results.filter(r=>!r.pass).length;console.log(bad?`\n${bad}개 실패`:'\n모두 통과');
  await b.close();process.exit(bad?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
