/* P8-라 탐험과 음악 놀이(탐험대·리듬 박수·악기) 완료 기준 검사: node tests/explore.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 진짜 터치 이벤트만으로 세 놀이 모두 1단계 완주 (장소 카드 → 어디 있지? 찾기 · 악기 카드 → 토토 따라 치기 · 건반 두드리기)
   2) 탐험대: 바다·산·우주·공주 모험 네 장면, 다른 것을 콕 해도 막히지 않음(틀림 없음) · 두 번 헛짚으면 찾는 것이 부드럽게 알려짐 · 단계마다 많아지고 가려짐 · 4단계는 차례로
   3) 리듬 박수: 북·탬버린·종, 큰 악기(200px 안팎) · 토토가 먼저 치고 막대가 켜짐 · 타이밍을 따지지 않음 · 가만히 있으면 한 번 더 같이 · 다 치면 인사 · 3단계 빠르게-느리게 · 4단계 동요 한 소절
   4) 악기: 실로폰 건반 3 → 5 → 8개 · 북 · 종(카드 3장으로 바꿈) · 훑으면 소리 · 4단계 빛나는 건반 따라 치기
   5) 같은 단계를 3번 끝내면 별 3칸 → 다음 단계의 새것(level-up 순간) · 어른 설정 '놀이별 단계'에 셋이 보임 · 깊이 훅
   6) 빈 화면 없음(큰 그림이 무대 높이 45% 이상) · 누르는 곳 110px 이상 · 글자·이모지 없음 · 공통 틀 · 페이지 오류 0 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const cdp=await ctx.newCDPSession(p);
  const tStart=async(x,y)=>cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  const tMove=async(x,y)=>cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  const tEnd=async()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const tap=async(x,y)=>{await tStart(x,y);await W(60);await tEnd()};
  const EX=()=>p.evaluate(()=>window.ML.__exp()),RH=()=>p.evaluate(()=>window.ML.__rh()),MU=()=>p.evaluate(()=>window.ML.__mu());
  const HOOK={explore:'__exp',rhythm:'__rh',music:'__mu'},LV={explore:'__exLevel',rhythm:'__rhLevel',music:'__muLevel'};
  const st=g=>p.evaluate(h=>window.ML[h](),HOOK[g]);
  const until=async(g,f,ms=15000)=>{await p.waitForFunction(([h,f])=>{const s=window.ML[h]();return !!s.phase&&eval(f)},[HOOK[g],f],{timeout:ms})};
  const enter=async(g,lv)=>{await p.evaluate(([g,l,LV])=>{window.ML.go('home');window.ML[LV[g]](l);window.ML.go(g)},[g,lv,LV]);await W(900)};
  const tapEl=async sel=>{const r=await p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}},sel);if(!r)throw new Error('없음 '+sel);await tap(r.x,r.y)};
  const pickCard=async label=>{
    for(let k=0;k<3;k++){
      const r=await p.evaluate(l=>{const c=[...document.querySelectorAll('.screen:not([hidden]) .sh-start .sh-card')].find(e=>e.getAttribute('aria-label')===l);if(!c)return null;const b=c.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2}},label);
      if(r){await tap(r.x,r.y);return true}
      await tapEl('.screen:not([hidden]) .sh-start .sh-next');await W(350)}
    return false;
  };
  const startCards=()=>p.evaluate(()=>[...document.querySelectorAll('.screen:not([hidden]) .sh-start button')].map(e=>{const b=e.getBoundingClientRect();return{l:e.getAttribute('aria-label'),w:Math.round(b.width),h:Math.round(b.height)}}));

  /* ---- shared look ---- */
  const look=async(g,name,o={})=>{await W(500);
    const r=await p.evaluate(g=>{const sec=document.getElementById(g),vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
      const txt=(sec.innerText||'').replace(/\s+/g,'');const EMO=/\p{Extended_Pictographic}/u;
      const hd=sec.querySelector(':scope > .sh-head'),bk=sec.querySelector('.sh-back'),stage=sec.querySelector('.sh-stage'),tray=sec.querySelector('.sh-tray');
      const sr=stage.getBoundingClientRect(),tr=tray.getBoundingClientRect();
      const press=[...sec.querySelectorAll('button,[role="button"]')].filter(e=>vis(e)&&!e.closest('.sh-head')).map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
      const audit=[...sec.querySelectorAll('button,.dragi,.nail,.prop,.facebtn,.key,.swatch,.piece')].filter(e=>vis(e)&&!e.closest('.bar')).length;
      return{txt,emo:EMO.test(sec.textContent||''),shell:!!window.ML.Shell.has(g),head:hd&&Math.round(hd.getBoundingClientRect().height),back:bk&&Math.round(bk.getBoundingClientRect().width),
        stage:sr.height,tray:tr.height,trayKids:[...tray.children].filter(vis).length,trayBottom:tr.bottom,press,audit,
        toggles:sec.querySelectorAll('.seg,.dots button').length,hints:[...sec.querySelectorAll('.hint,.khint,p')].filter(vis).length}},g);
    ok(`${name}: 공통 틀(ML.Shell) · 머리줄 72px · 뒤로 가기 64px 이상 · 글자 전환·안내 줄 0`,r.shell&&r.head===72&&r.back>=64&&!r.toggles&&!r.hints,`머리줄 ${r.head} 뒤로 ${r.back}`);
    ok(`${name}: 화면에 글자·이모지 없음`,r.txt===''&&!r.emo,JSON.stringify(r.txt.slice(0,20)));
    ok(`${name}: 아래 칸이 비지 않음 · 맨 아래`,r.trayKids>0&&r.trayBottom>=780-24,`칸 ${Math.round(r.tray)}px, 안의 것 ${r.trayKids}개`);
    ok(`${name}: 누를 것 110px 이상 · 한 화면 3개 이하(audit 기준)`,r.press.every(x=>x>=110)&&r.audit<=3,`누를 것 ${JSON.stringify(r.press)} · 세는 것 ${r.audit}`);
    return r;
  };
  const spread=s=>(s.content.bottom-s.content.top)/s.stage.height;

  /* ================= 탐험대 ================= */
  await enter('explore',1);
  let cards=await startCards();
  ok('탐험대: 들어가면 장면 그림 카드(110px 이상, 3개 이하)가 먼저 나옴(바다·산 + 다음 장)',cards.length>=2&&cards.length<=3&&cards.every(c=>c.w>=110&&c.h>=110),JSON.stringify(cards));
  await shot('explore_pick');
  ok('탐험대: 바다 카드를 콕 → 시작',await pickCard('바다'));
  await until('explore',"s.phase==='find'");
  let s=await EX();
  await look('explore','탐험대 1단계');await shot('explore_sea_L1_start');
  ok('탐험대 1단계: 큰 그림 3개(각 110px 이상) · 찾는 것 2개를 차례로',s.items.length===3&&s.items.every(i=>i.w>=110&&i.h>=110)&&s.asks.length===2,`${s.items.length}개 · 크기 ${Math.round(s.items[0].w)}px · 찾기 ${s.asks.length}`);
  ok('탐험대 1단계: 그림 위치가 무대 안 · 위아래로 넓게(무대 높이 45% 이상)',s.items.every(i=>i.left>=s.stage.left-1&&i.right<=s.stage.left+s.stage.width+1&&i.top>=s.stage.top-1&&i.bottom<=s.stage.top+s.stage.height+1)&&spread(s)>=.45,(spread(s)*100).toFixed(0)+'%');
  ok('탐험대 1단계: 아래 칸에 토토와 찾을 그림(다시 듣기 카드)',s.ask);
  /* 다른 것 콕 → 막히지 않음 */
  let other=s.items.find(i=>!i.target);await tap(other.x,other.y);await W(600);let t=await EX();
  ok('탐험대: 다른 것을 콕 해도 막히지 않음 · 틀린 횟수만 기록 · 다시 묻는 중',t.phase==='find'&&t.wrong===1&&t.log.includes('other:'+other.k),`틀림 ${t.wrong}`);
  other=t.items.find(i=>!i.target&&i.k!==other.k)||t.items.find(i=>!i.target);await tap(other.x,other.y);await W(500);t=await EX();
  ok('탐험대: 두 번 헛짚으면 찾는 것이 부드럽게 도드라짐(hint)',t.hint&&t.wrong===2);
  await shot('explore_sea_L1_hint');
  let tg=t.items.find(i=>i.target);await tap(tg.x,tg.y);await W(300);t=await EX();
  ok('탐험대: 찾는 것을 콕 → 찾았다! (그 친구가 뜀) · 과정 줄에 별',t.log.includes('found:'+tg.k)&&t.at===1);
  await shot('explore_sea_L1_found');
  await until('explore',"s.phase==='find'&&s.at===1",6000);
  s=await EX();ok('탐험대: 다음 것을 묻는다(다른 것)',s.target!==tg.k&&s.ask);
  tg=s.items.find(i=>i.target);await tap(tg.x,tg.y);await W(2800);
  await shot('explore_sea_L1_done');s=await EX();
  ok('탐험대 1단계: 다 찾으면 한 판 끝(별 1칸)',s.log.includes('win')&&s.starsOn===1&&s.starsN===3,`별 ${s.starsOn}/${s.starsN}`);
  const round=async()=>{await until('explore',"s.phase==='find'&&s.at===0&&!s.moment");let q=await EX();const wrongs=0;
    for(let k=0;k<q.asks.length;k++){q=await EX();const g=q.items.find(i=>i.target);await tap(g.x,g.y);if(k<q.asks.length-1)await until('explore',`s.phase==='find'&&s.at===${k+1}`,6000);}
    await W(2800);return q};
  await round();
  await W(300);
  await until('explore',"s.phase==='find'&&s.at===0");await (async()=>{let q=await EX();for(let k=0;k<q.asks.length;k++){q=await EX();const g=q.items.find(i=>i.target);await tap(g.x,g.y);if(k<q.asks.length-1)await until('explore',`s.phase==='find'&&s.at===${k+1}`,6000)}})();
  let moment=false;for(let i=0;i<30&&!moment;i++){await W(250);moment=(await EX()).moment}
  ok('탐험대: 같은 단계 3번 → 새것이 나오는 순간(level-up)이 보임',moment);await shot('explore_levelup');
  await until('explore',"s.phase==='find'&&!s.moment",12000);s=await EX();
  ok('탐험대: 3번 뒤 2단계 · 그림 4개로 늘고 찾는 것 3개 · 별 줄이 다시 비어 시작',s.progress.level===2&&s.items.length===4&&s.asks.length===3&&s.starsOn===0,JSON.stringify(s.progress)+' 그림 '+s.items.length);
  await look('explore','탐험대 2단계');await shot('explore_sea_L2');
  /* 장면 넷, 단계 3·4 */
  for(const [scn,lv,nm] of [['산',3,'mountain'],['우주',4,'space'],['공주 모험',3,'castle'],['바다',4,'sea']]){
    await p.evaluate(([l,LV])=>{window.ML.go('home');window.ML[LV.explore](l);window.ML.go('explore')},[lv,LV]);await W(700);
    ok(`탐험대: ${scn} 카드가 나옴(다음 장 포함)`,await pickCard(scn));
    await until('explore',"s.phase==='find'");s=await EX();await look('explore',`탐험대 ${scn} ${lv}단계`);
    ok(`탐험대 ${scn} ${lv}단계: 그림 ${lv+2}개 모두 110px 이상 · 가려진 것 ${s.covers}개 · 무대 안`,s.items.length===lv+2&&s.items.every(i=>i.w>=110&&i.left>=s.stage.left-1&&i.right<=s.stage.left+s.stage.width+1&&i.bottom<=s.stage.top+s.stage.height+1)&&s.covers===lv-1,`크기 ${Math.round(s.items[0].w)}px`);
    ok(`탐험대 ${scn} ${lv}단계: 큰 그림이 무대 높이 45% 이상`,spread(s)>=.45,(spread(s)*100).toFixed(0)+'%');
    await shot(`explore_${nm}_L${lv}_start`);
    if(lv===4){
      /* 차례로: 먼저 찾는 것이 아닌 것을 콕 해도 괜찮고, 순서대로 하면 3개를 다 찾음 */
      for(let k=0;k<s.asks.length;k++){const q=await EX();const g=q.items.find(i=>i.target);await tap(g.x,g.y);if(k===0)await shot(`explore_${nm}_L4_found`);if(k<q.asks.length-1)await until('explore',`s.phase==='find'&&s.at===${k+1}`,6000)}
      await W(2800);const e=await EX();ok(`탐험대 ${scn} 4단계: 차례대로 3개를 찾고 한 판 끝`,e.log.includes('win'),`별 ${e.starsOn}`);await shot(`explore_${nm}_L4_done`);
    }
  }

  /* ================= 리듬 박수 ================= */
  const rhRound=async(gapMs=380)=>{await until('rhythm',"s.phase==='play'",20000);let q=await RH();for(let k=0;k<q.n;k++){await tap(q.inst_.x,q.inst_.y);await W(gapMs)}await W(300);return await RH()};
  await enter('rhythm',1);
  cards=await startCards();
  ok('리듬 박수: 들어가면 악기 그림 카드 3장(북·탬버린·종, 110px 이상)',cards.length===3&&cards.every(c=>c.w>=110),JSON.stringify(cards.map(c=>c.l)));
  await shot('rhythm_pick');
  ok('리듬 박수: 북 카드를 콕',await pickCard('북'));
  await until('rhythm',"s.phase==='listen'");s=await RH();
  await look('rhythm','리듬 박수 1단계');await shot('rhythm_L1_listen');
  ok('리듬 박수 1단계: 큰 악기(북)가 가운데 200px 안팎',s.inst_.w>=180&&Math.abs(s.inst_.x-(s.stage.left+s.stage.width/2))<4,`${Math.round(s.inst_.w)}px`);
  ok('리듬 박수: 무대 위 친구 셋이 서 있고 위아래 그림이 무대 높이 45% 이상',s.friends.length===3&&spread(s)>=.45&&s.friends.every(f=>f.h>=100),(spread(s)*100).toFixed(0)+'%');
  ok('리듬 박수 1단계: 박수 2번(아래 칸에 막대 2개)',s.n===2&&s.lamps.length===2,`${s.n}번`);
  /* 토토가 먼저 쳐서 막대가 켜짐 */
  let lit=false;for(let i=0;i<24&&!lit;i++){await W(100);const q=await RH();lit=q.lamps.some(l=>l.demo)||q.log.some(l=>/^demo:/.test(l))}
  ok('리듬 박수: 토토가 먼저 치는 동안 막대가 차례로 켜짐(demo)',lit);
  await until('rhythm',"s.phase==='play'",15000);await shot('rhythm_L1_turn');
  /* 타이밍을 따지지 않음: 빨리 쳐도, 늦게 쳐도 같은 수만 치면 끝 */
  await tap(s.inst_.x,s.inst_.y);await W(2200);let q=await RH();
  ok('리듬 박수: 한 번 쳤을 때 막대 하나가 채워짐(타이밍 상관 없음)',q.k===1&&q.lamps.filter(l=>l.done).length===1);
  await shot('rhythm_L1_mid');
  await tap(q.inst_.x,q.inst_.y);await W(700);q=await RH();
  ok('리듬 박수 1단계: 같은 수만큼 치면 한 판 끝(별 1칸) · 친구들과 인사',q.log.includes('win'),`log ${q.log.slice(-4).join(',')}`);
  await W(900);await shot('rhythm_L1_bow');await W(1500);q=await RH();
  ok('리듬 박수: 인사(bow) 뒤 별 1칸',q.log.includes('bow')&&q.starsOn===1&&q.starsN===3,`별 ${q.starsOn}`);
  /* 가만히 있으면 한 번 더 같이 */
  await until('rhythm',"s.phase==='play'",20000);const t0=Date.now();let again=false;for(let i=0;i<150&&!again;i++){await W(100);again=(await RH()).log.includes('again')}
  ok('리듬 박수: 가만히 있으면 약 9초 뒤 토토가 "한 번 더 같이!" (실패가 아니라 다시 들려줌)',again,`${Math.round((Date.now()-t0)/1000)}초`);
  /* 2판, 3판 → level-up */
  await rhRound();await W(600);
  await until('rhythm',"s.phase==='play'",20000);await (async()=>{const z=await RH();for(let k=0;k<z.n;k++){await tap(z.inst_.x,z.inst_.y);await W(350)}})();
  moment=false;for(let i=0;i<40&&!moment;i++){await W(250);moment=(await RH()).moment}
  ok('리듬 박수: 같은 단계 3번 → 새것이 나오는 순간(level-up)',moment);await shot('rhythm_levelup');
  await until('rhythm',"s.phase==='listen'&&!s.moment",12000);s=await RH();
  ok('리듬 박수: 3번 뒤 2단계 · 박수 3번',s.progress.level===2&&s.n===3,JSON.stringify(s.progress)+' '+s.n+'번');
  /* 2단계: 탬버린으로 */
  await p.evaluate(()=>{window.ML.go('home');window.ML.__rhLevel(2);window.ML.go('rhythm')});await W(700);
  ok('리듬 박수: 탬버린 카드',await pickCard('탬버린'));await until('rhythm',"s.phase==='listen'");s=await RH();
  await look('rhythm','리듬 박수 2단계(탬버린)');await shot('rhythm_L2_tamb');
  q=await rhRound(300);ok('리듬 박수 2단계: 탬버린으로 3번 치면 끝',q.log.includes('win'));
  /* 3단계: 빠르게-느리게, 종 */
  await p.evaluate(()=>{window.ML.go('home');window.ML.__rhLevel(3);window.ML.go('rhythm')});await W(700);
  ok('리듬 박수: 종 카드',await pickCard('종'));await until('rhythm',"s.phase==='listen'");s=await RH();
  const gaps=s.times.slice(1).map((v,i)=>v-s.times[i]);
  ok('리듬 박수 3단계: 박수 4번 · 빠른 박자와 느린 박자가 섞임',s.n===4&&Math.min(...gaps)<=.5&&Math.max(...gaps)>=.8,gaps.map(x=>x.toFixed(2)).join(','));
  await look('rhythm','리듬 박수 3단계(종)');await shot('rhythm_L3_bell');
  q=await rhRound(150);ok('리듬 박수 3단계: 빠르게 쳐도(150ms 간격) 끝남(타이밍 상관 없음)',q.log.includes('win'));
  /* 4단계: 동요 한 소절 */
  await p.evaluate(()=>{window.ML.go('home');window.ML.__rhLevel(4);window.ML.go('rhythm')});await W(700);
  await pickCard('북');await until('rhythm',"s.phase==='listen'");s=await RH();
  ok('리듬 박수 4단계: 동요 한 소절(7박) · 아래 막대 7개',s.n===7&&s.lamps.length===7,`${s.n}박`);
  await shot('rhythm_L4_listen');q=await rhRound(380);ok('리듬 박수 4단계: 7번 쳐서 끝',q.log.includes('win'));await shot('rhythm_L4_done');

  /* ================= 악기 ================= */
  const muFree=async(n)=>{for(let k=0;k<n;k++){const q=await MU();const bar=q.bars[k%q.bars.length];await tap(bar.x,bar.y);await W(330)}};
  await enter('music',1);await until('music',"s.phase==='free'");s=await MU();
  await look('music','악기 1단계(실로폰)');await shot('music_L1_xylo');
  ok('악기 1단계: 실로폰 건반 3개 · 친구 셋',s.inst==='xylo'&&s.bars.length===3&&s.friends.length===3,`건반 ${s.bars.length}`);
  ok('악기 1단계: 건반이 110px 안팎 이상으로 큼 · 위아래 그림이 무대 높이 45% 이상',s.bars.every(b=>b.w>=100&&b.h>=200)&&spread(s)>=.45,`폭 ${Math.round(s.bars[0].w)}px · ${(spread(s)*100).toFixed(0)}%`);
  ok('악기: 아래 칸에 악기 카드 3장(실로폰·북·종)',s.cards.length===3&&s.cards.every(c=>c.w>=110)&&s.cards[0].sel);
  await tap(s.bars[0].x,s.bars[0].y);await W(300);let m=await MU();
  ok('악기: 건반을 콕 하면 소리(hit 기록)',m.log.some(l=>l.startsWith('hit:xylo')),m.log.slice(-2).join(','));
  /* 훑기(글리산도): 손가락을 건반 위로 쓱 */
  const y0=s.bars[0].y;await tStart(s.bars[0].x,y0);for(let i=1;i<=12;i++){await tMove(s.bars[0].x+(s.bars[2].x-s.bars[0].x)*i/12,y0);await W(40)}await tEnd();await W(200);
  const m2=await MU();const hits=m2.log.filter(l=>l.startsWith('hit:xylo')).length-m.log.filter(l=>l.startsWith('hit:xylo')).length;
  ok('악기: 손가락으로 건반을 쓱 훑으면 지나가는 건반마다 소리',hits>=3,`${hits}번`);
  /* 카드로 북·종 */
  await tap(s.cards[1].x,s.cards[1].y);await W(500);m=await MU();
  ok('악기: 북 카드 → 큰 북(200px 이상)',m.inst==='drum'&&m.bars.length===1&&m.bars[0].w>=200,`${Math.round(m.bars[0].w)}px`);await shot('music_drum');
  await tap(m.bars[0].x,m.bars[0].y);await W(250);m=await MU();ok('악기: 북을 콕 → 소리',m.log.some(l=>l.startsWith('hit:drum')));
  await tap(m.cards[2].x,m.cards[2].y);await W(500);m=await MU();
  ok('악기: 종 카드 → 큰 종 3개(각 110px 이상)',m.inst==='bells'&&m.bars.length===3&&m.bars.every(b=>b.w>=110),`${m.bars.length}개 ${Math.round(m.bars[0].w)}px`);await shot('music_bells');
  await tap(m.bars[1].x,m.bars[1].y);await W(300);m=await MU();ok('악기: 종을 콕 → 소리',m.log.some(l=>l.startsWith('hit:bells')));
  await look('music','악기(종)');
  await tap(m.cards[0].x,m.cards[0].y);await W(500);
  /* 8번 두드리면 한 판 끝 */
  m=await MU();const before=m.taps;await muFree(8-before+1);await W(600);m=await MU();
  ok('악기 1단계: 건반을 8번 두드리면 한 판 끝(별 1칸) · 친구들 춤',m.log.includes('win')&&m.starsOn===1,`별 ${m.starsOn}`);await shot('music_L1_win');
  /* 3판 → 2단계 */
  await until('music',"s.phase==='free'&&s.taps===0",8000);await muFree(8);await W(400);
  await until('music',"s.phase==='free'&&s.taps===0",8000);await muFree(8);
  moment=false;for(let i=0;i<40&&!moment;i++){await W(250);moment=(await MU()).moment}
  ok('악기: 같은 단계 3번 → 새것이 나오는 순간(level-up)',moment);await shot('music_levelup');
  await until('music',"s.phase==='free'&&!s.moment",12000);await W(300);s=await MU();
  ok('악기: 3번 뒤 2단계 · 건반 5개',s.progress.level===2&&s.bars.length===5,JSON.stringify(s.progress)+' 건반 '+s.bars.length);
  await look('music','악기 2단계(건반 5개)');await shot('music_L2_xylo');
  ok('악기 2단계: 건반 5개가 위아래로 큼(높이 200px 이상)',s.bars.every(b=>b.h>=200),`폭 ${Math.round(s.bars[0].w)}px`);
  /* 3단계: 8개 */
  await enter('music',3);await until('music',"s.phase==='free'");s=await MU();
  ok('악기 3단계: 건반 8개(두 줄) · 모두 무대 안',s.bars.length===8&&s.bars.every(b=>b.left>=s.stage.left-1&&b.right<=s.stage.left+s.stage.width+1&&b.bottom<=s.stage.top+s.stage.height+1),`폭 ${Math.round(s.bars[0].w)}px 높이 ${Math.round(s.bars[0].h)}px`);
  await look('music','악기 3단계(건반 8개)');await shot('music_L3_xylo');
  /* 4단계: 빛나는 건반 따라 치기 */
  await enter('music',4);await until('music',"s.phase==='free'");s=await MU();
  ok('악기 4단계: 빛나는 건반이 하나 보임(차분하게 계속 켜져 있음)',s.nextI>=0&&s.seq.length===7,`다음 ${s.nextI} · 소절 ${s.seq.join('')}`);
  await shot('music_L4_light');
  /* 틀린 건반을 쳐도 막히지 않고 소리는 남 */
  const wrongBar=s.bars.find(b=>b.i!==s.nextI);await tap(wrongBar.x,wrongBar.y);await W(350);m=await MU();
  ok('악기 4단계: 다른 건반을 쳐도 소리가 나고 빛은 그대로(틀림 없음)',m.nextI===s.nextI&&m.si===0&&m.log.some(l=>l.startsWith('hit:xylo')));
  for(let k=0;k<7;k++){const q2=await MU();const bar=q2.bars.find(b=>b.i===q2.nextI);if(!bar)break;await tap(bar.x,bar.y);await W(360);if(k===3)await shot('music_L4_mid')}
  await W(600);m=await MU();
  ok('악기 4단계: 빛나는 건반을 따라 7번 치면 노래 한 소절 완성(별 1칸)',m.log.includes('win')&&m.starsOn===1,`별 ${m.starsOn}`);await shot('music_L4_win');

  /* ---- 어른 설정 · 깊이 훅 · 오류 ---- */
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#progressRows .seg[data-game]')].map(x=>x.dataset.game));
  ok("어른 설정 '놀이별 단계'에 탐험대·리듬 박수·악기가 보임",['explore','rhythm','music'].every(g=>rows.includes(g)),rows.join(','));
  const dep=await p.evaluate(()=>({e:window.ML.__expDepth().length,r:window.ML.__rhDepth().length,m:window.ML.__muDepth().length}));
  ok('깊이 훅: 단계 4개씩',dep.e===4&&dep.r===4&&dep.m===4,JSON.stringify(dep));
  const where=await p.evaluate(()=>({learn:window.ML.Shell.places.learn.games,music:window.ML.Shell.places.music.games,back:{explore:window.ML.Shell.backOf('explore'),rhythm:window.ML.Shell.backOf('rhythm'),music:window.ML.Shell.backOf('music')}}));
  ok('장소: 탐험대는 배움 학교, 리듬 박수·악기는 노래 극장 · 뒤로 가기는 그 장소로',where.learn.includes('explore')&&where.music.includes('rhythm')&&where.music.includes('music')&&where.back.explore==='zone-school'&&where.back.rhythm==='zone-music'&&where.back.music==='zone-music',JSON.stringify(where.back));
  await p.evaluate(()=>window.ML.go('home'));await W(300);
  ok('페이지 오류 0',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e);process.exit(1)});
