/* P17 식당 검사: node tests/restaurant.js
   진짜 터치(모바일 화면 + CDP Input.dispatchTouchEvent)로
   1) 호텔 아침 식사(1단계): 콕만으로 토스터 → 달걀 → 과일 순서로 끝까지, '다음' 버튼 없음, 구운 빵 = 접시 빵, 씻은 과일 = 접시 과일
   2) 바삭 치킨(2단계, 쓱쓱은 손가락 끌기로): 치킨 4조각을 다 넣기 전에는 다음 과정이 안 됨(3조각에서 3초 기다려도 그대로), 튀김옷 = 기름 = 노릇 = 바구니
   3) 과정마다: 글자·이모지 없음, 누를 것 110px 이상, 카드 3장 이하, 입자 수 ≤ motion.particles.max
   4) 깊이 표(ML.__rsDepth) */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const results=[];const ok=(name,pass,info)=>{results.push({name,pass,info});console.log(`${pass?'통과':'실패'} | ${name}${info?' | '+info:''}`)};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true});const p=await ctx.newPage();
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
    let s=await st();const t0=Date.now();const seen=[];const served0=s.served;let snap=null;
    while(s.view!=='lobby'||s.phase!=='lobby'){await W(200);s=await st()}
    await look(s);await tap(...s.custPts[s.orders.indexOf(menu)]);
    while(Date.now()-t0<150000){s=await st();agg.peak=Math.max(agg.peak,s.particlePeak);
      if(s.phase==='eat')snap=snap||s;if(s.served>served0&&snap)return Object.assign(snap,{served:s.served});
      if(s.kind!=='wait'&&!s.busy&&seen[seen.length-1]!==s.phase+pi(s)){seen.push(s.phase+pi(s));await W(650);await look(await st())}
      if(hook&&await hook(s))continue;
      if(s.kind==='cards'){const c=s.cards.find(c=>c.ok);if(c){await tap(c.x,c.y);await W(1300)}continue}
      if(s.kind==='tap'&&s.aim&&!s.busy){await tap(...s.aim);await W(420);continue}
      if(s.kind==='rub'&&s.toolOn&&!s.toolDone){if(mode==='drag'){await drag(s.rect);await W(250)}else{const ph=s.phase;for(const q of s.cellPts){const s2=await st();if(s2.phase!==ph||!s2.toolOn||s2.toolDone)break;await tap(q[0],q[1]);await W(110)}}continue}
      await W(200)}
    return await st();
  }
  const pi=s=>s.pi;

  /* ---------- 1) breakfast by taps only ---------- */
  await p.evaluate(()=>{window.ML.__rsLevel(1);window.ML.go('restaurant')});await W(1200);
  let s=await play('toast','tap');
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
  const dn=s.log.filter(x=>x.startsWith('done:')).map(x=>x.slice(5));
  ok('바삭 치킨: 끌기(쓱쓱)로 끝까지',s.served>=2&&s.log.filter(x=>x==='serve').length>=2,`과정 ${dn.slice(-5).join(' → ')}`);
  const k=s.cnt;ok('만든 만큼 쓰기(치킨)',k.coated===s.nChicken&&k.dropped===s.nChicken&&k.fried===s.nChicken&&k.basket===s.nChicken,`튀김옷 ${k.coated} = 기름 ${k.dropped} = 노릇 ${k.fried} = 바구니 ${k.basket}`);

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
