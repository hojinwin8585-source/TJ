/* P17 아이스크림 가게 검사: node tests/icecream.js
   진짜 터치(모바일 화면 + CDP Input.dispatchTouchEvent)로
   1) 1단계 한 판을 콕만으로 끝까지(콘 고르기 → 통 → 스쿱 → 올리기 → 뿌리기 → 건네주기), '다음' 버튼 없음
   2) 스쿱이 닿은 만큼만 공이 커짐: 닿기 전 0 → 콕 한 번에 조금 → 가만히 두면 그대로 → 더 긁으면 더 큼, 공 크기 = 닿은 양에 비례
   3) 3단계(두 스쿱·체리)를 끌기(쓱쓱)로 끝까지, 만든 공 수 = 올린 공 수
   4) 4단계: 손님 맛과 다른 통을 누르면 다시(실패 없음), 같은 맛이면 진행
   5) 과정마다: 글자·이모지 없음, 누를 것 110px 이상, 카드 3장 이하, 입자 수 ≤ motion.particles.max · 깊이 표(ML.__icDepth) */
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
  const drag=async(r,n=26)=>{const cx=r.x+r.w/2,cy=r.y+r.h*.4;await touch('touchStart',[{x:cx,y:cy}]);for(let k=0;k<n;k++){await touch('touchMove',[{x:cx+Math.cos(k*.9)*r.w*.3,y:cy+Math.sin(k*1.3)*r.h*.15}]);await W(30)}await touch('touchEnd',[])};
  const st=()=>p.evaluate(()=>window.ML.__ic());
  const CFG=await p.evaluate(()=>window.MLCFG);const MAXP=((CFG.motion||{}).particles||{}).max||40;
  const scan=()=>p.evaluate(()=>{const scr=document.getElementById('icecream2'),out={text:[],emoji:[],small:[],extraBtn:[],cards:0};
    const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x&&x!==document.body;x=x.parentElement){if(x.hidden)return false;const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(!t||!vis(n.parentElement))continue;if(/\p{Extended_Pictographic}/u.test(t))out.emoji.push(t);out.text.push(t.slice(0,12))}
    [...scr.querySelectorAll('button')].filter(vis).forEach(bt=>{const r=bt.getBoundingClientRect();if(bt.classList.contains('ic-back'))return;
      if(bt.classList.contains('ic-card'))out.cards++;else if(!bt.classList.contains('ic-lc'))out.extraBtn.push(bt.className);
      if(Math.min(r.width,r.height)<110)out.small.push(bt.className+' '+Math.round(r.width)+'x'+Math.round(r.height))});
    return out});
  const agg={text:new Set(),emoji:new Set(),small:new Set(),extra:new Set(),maxCards:0,smallHot:new Set(),peak:0};
  const look=async s=>{const v=await scan();v.text.forEach(t=>agg.text.add(t));v.emoji.forEach(t=>agg.emoji.add(t));v.small.forEach(t=>agg.small.add(t));v.extraBtn.forEach(t=>agg.extra.add(t));agg.maxCards=Math.max(agg.maxCards,v.cards);
    (s.hot||[]).forEach(h=>{if(Math.min(h.w,h.h)<110)agg.smallHot.add(s.phase+' '+h.w+'x'+h.h)})};
  async function play(mode,hook){
    let s=await st();const t0=Date.now();const seen=[];const served0=s.served;let snap=null;
    while(s.view!=='lobby'||s.phase!=='lobby'){await W(200);s=await st()}
    await look(s);await tap(...s.custPts[1]);
    while(Date.now()-t0<150000){s=await st();agg.peak=Math.max(agg.peak,s.particlePeak);
      if(s.phase==='eat')snap=snap||s;if(s.served>served0&&snap)return Object.assign(snap,{served:s.served,smudge:snap.smudge||s.log.includes('smudge')});
      if(s.kind!=='wait'&&!s.busy&&seen[seen.length-1]!==s.phase+s.pi){seen.push(s.phase+s.pi);await W(650);await look(await st())}
      if(hook&&await hook(s))continue;
      if(s.kind==='cards'){const c=s.cards[0];if(c){await tap(c.x,c.y);await W(1300)}continue}
      if(s.kind==='tap'&&s.aim&&!s.busy){await tap(...s.aim);await W(420);continue}
      if(s.kind==='rub'&&s.toolOn&&!s.toolDone){if(mode==='drag'){await drag(s.rect);await W(250)}else{const ph=s.phase;for(const q of s.cellPts){const s2=await st();if(s2.phase!==ph||!s2.toolOn||s2.toolDone)break;await tap(q[0],q[1]);await W(110)}}continue}
      await W(200)}
    return await st();
  }

  /* ---------- 1+2) level 1 by taps only, and the ball grows only by touching ---------- */
  await p.evaluate(()=>{window.ML.__icLevel(1);window.ML.go('icecream2')});await W(1200);
  let grow=null;
  let s=await play('tap',async s=>{
    if(s.phase!=='scoop'||!s.toolOn||grow)return false;
    const g={};const s0=await st();g.before=s0.ballD;
    const q=s0.cellPts[0];await tap(q[0],q[1]);await W(700);const s1=await st();g.oneTap=s1.ballD;g.p1=s1.scoopP;
    await W(2000);const s2=await st();g.still=s2.ballD;
    const q2=s0.cellPts[2];await tap(q2[0],q2[1]);await W(700);const s3=await st();g.more=s3.ballD;g.p3=s3.scoopP;g.max=s3.ballMax;
    g.prop=Math.abs(s3.ballD-s3.ballMax*(.18+.82*s3.scoopP))<3;grow=g;return true});
  const done=s.log.filter(x=>x.startsWith('done:')).map(x=>x.slice(5));
  ok('1단계: 콕만으로 끝까지 (손님이 받음, 코에 묻음)',s.served>=1&&s.log.includes('serve')&&s.smudge,`과정 ${done.join(' → ')}`);
  ok('스쿱이 닿은 만큼만 공이 커짐',!!grow&&grow.before===0&&grow.oneTap>0&&Math.abs(grow.still-grow.oneTap)<.5&&grow.more>grow.oneTap+1&&grow.prop,
    grow?`닿기 전 ${grow.before}px → 콕 1번 ${grow.oneTap.toFixed(1)}px(닿은 양 ${(grow.p1*100).toFixed(0)}%) → 2초 가만히 ${grow.still.toFixed(1)}px → 콕 1번 더 ${grow.more.toFixed(1)}px(${(grow.p3*100).toFixed(0)}%), 크기 = 최대 ${grow.max.toFixed(0)}px × (0.18 + 0.82 × 닿은 양): ${grow.prop}`:'확인 못 함');
  ok('만든 공 = 올린 공(1단계)',s.cnt.placed===1&&s.scoops.length===1&&s.sprinkles>0,`올린 공 ${s.scoops.length}, 스프링클 ${s.sprinkles}개`);

  /* ---------- 3) level 3 by finger drags ---------- */
  await W(6000);await p.evaluate(()=>window.ML.__icLevel(3));await W(1200);
  s=await play('drag');
  ok('3단계(두 스쿱·체리): 끌기로 끝까지',s.served>=2&&s.scoops.length===2&&s.cherry,`공 ${s.scoops.join('+')}, 체리 ${s.cherry}, 스프링클 ${s.sprinkles}`);
  ok('만든 공 = 올린 공(3단계)',s.cnt.placed===2&&s.scoops.length===2);

  /* ---------- 4) level 4: same colour as the customer asked ---------- */
  await W(6000);await p.evaluate(()=>window.ML.__icLevel(4));await W(1200);
  let match=null;
  s=await play('tap',async s=>{
    if(s.phase!=='tub'||s.kind!=='tap'||s.busy||match)return false;
    const wrong=s.tubs.find(t=>t.k!==s.want&&t.x);await tap(wrong.x,wrong.y);await W(800);const a=await st();
    const right=a.tubs.find(t=>t.k===a.want&&t.x);await tap(right.x,right.y);await W(900);const c=await st();
    match={want:a.want,wrong:wrong.k,stayed:a.phase==='tub',log:a.log.includes('wrong:'+wrong.k),after:c.phase,picked:c.log.includes('tub:'+a.want)};return true});
  ok('4단계: 다른 맛 통은 다시, 같은 맛이면 진행',!!match&&match.stayed&&match.log&&match.picked,match?`손님 ${match.want}, 누른 ${match.wrong} → 그대로 ${match.stayed}; ${match.want} → ${match.picked}`:'확인 못 함');
  ok('4단계 끝까지',s.served>=3,`공 ${s.scoops.join('+')}`);

  /* ---------- 5) screens ---------- */
  ok('글자 없음',!agg.text.size,[...agg.text].join(', ')||'');
  ok('이모지 없음',!agg.emoji.size,[...agg.emoji].join(', ')||'');
  ok("'다음' 같은 버튼 없음(뒤로·손님·카드 말고 버튼 없음)",!agg.extra.size,[...agg.extra].join(', ')||'');
  ok('누를 것 110px 이상',!agg.small.size&&!agg.smallHot.size,[...agg.small,...agg.smallHot].join(', ')||'');
  ok('카드 3장 이하',agg.maxCards<=3,`가장 많을 때 ${agg.maxCards}장`);
  ok(`입자 수 ≤ ${MAXP}`,agg.peak<=MAXP&&agg.peak>0,`가장 많을 때 ${agg.peak}개`);
  ok('손님은 ML.Alive(기다리며 배 문지름·킁킁·냠냠·코에 묻음)',s.log.some(x=>x.startsWith('play:'))&&s.log.includes('sniff')&&s.log.includes('bite')&&s.log.includes('smudge'));
  const depth=await p.evaluate(()=>window.ML.__icDepth());
  console.log('\n깊이 표 (ML.__icDepth)\n단계 | 스쿱 | 맛 | 체리 | 같은 색 | 과정 | 손동작 | 손님 | 고르기 | 끝내기');
  depth.forEach(d=>console.log([d.level,d.scoops,d.flavors,d.cherry,d.match,`${d.processes}(${d.list.join(',')})`,d.handActions.join('+'),d.customer?'있음':'없음',d.choice?'있음(콘/컵, 맛)':'없음',d.ending?'건네주기·냠냠·코에 묻음':'없음'].join(' | ')));
  ok('깊이: 과정 4개 이상 · 손동작 2가지 이상 · 손님 · 고르기 · 끝내기',depth.every(d=>d.processes>=4&&d.handActions.filter(h=>h!=='choose').length>=2&&d.customer&&d.choice&&d.ending));
  ok('페이지 오류 없음',!errs.length,errs.slice(0,3).join(' / '));
  const bad=results.filter(r=>!r.pass).length;console.log(bad?`\n${bad}개 실패`:'\n모두 통과');
  await b.close();process.exit(bad?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
