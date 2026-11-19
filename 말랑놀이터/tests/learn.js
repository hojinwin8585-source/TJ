/* P8-다 배움 놀이(젤리 세기·모양 넣기·선 긋기) 완료 기준 검사: node tests/learn.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 진짜 터치 이벤트만으로 세 놀이 모두 1단계 완주 (젤리 콕 · 모양 콕+구멍 콕 · 길 따라가기)
   2) 선 긋기: 길에서 벗어나 그려도(굵은 길 가장자리 밖) 나아가고 끝남 · 콕만 해도 끝남 · 4단계(동그라미)까지
   3) 모양: 틀린 구멍은 부드럽게 응원(맞는 구멍이 반짝, 모양은 그대로) · 끌어다 넣기도 됨 · 한 번에 누를 것 3개 이하
   4) 같은 단계를 3번 끝내면 별 3칸 → 다음 단계의 새것이 나옴(level-up 순간) · 어른 설정 '놀이별 단계'에 세 놀이가 보임
   5) 빈 화면 없음(큰 그림이 무대 높이 45% 이상, 아래 칸이 비지 않음) · 누르는 곳 110px 이상 · 글자·이모지 없음 · 공통 틀 · 페이지 오류 0 */
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
  const J=()=>p.evaluate(()=>window.ML.__jl()),SH=()=>p.evaluate(()=>window.ML.__sh()),TR=()=>p.evaluate(()=>window.ML.__tr());
  const enter=async(g,lv)=>{await p.evaluate(([g,l])=>{window.ML.go('home');window.ML['__'+({jelly:'jl',shapes:'sh',trace:'tr'})[g]+'Level'](l);window.ML.go(g)},[g,lv]);
    await W(900)};
  const preds={jelly:"s.phase==='count'&&s.count===0&&!s.moment",shapes:"s.phase==='play'&&s.holes.length&&s.holes.every(h=>!h.done)&&!s.moment",trace:"s.phase==='go'&&s.prog<.01&&!s.moment"};
  const hook={jelly:'__jl',shapes:'__sh',trace:'__tr'};
  const ready=g=>p.waitForFunction(([h,f])=>{const s=window.ML[h]();return !!s.phase&&eval(f)},[hook[g],preds[g]],{timeout:12000});
  const st=g=>p.evaluate(h=>window.ML[h](),hook[g]);

  /* ---- three screens: shared look ---- */
  const look=async(g,name)=>{await W(700);
    const r=await p.evaluate(g=>{const sec=document.getElementById(g),vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
      const txt=(sec.innerText||'').replace(/\s+/g,'');const EMO=/\p{Extended_Pictographic}/u;
      const hd=sec.querySelector(':scope > .sh-head'),bk=sec.querySelector('.sh-back'),stage=sec.querySelector('.sh-stage'),tray=sec.querySelector('.sh-tray');
      const sr=stage.getBoundingClientRect(),tr=tray.getBoundingClientRect();
      const press=[...sec.querySelectorAll('button,[role="button"]')].filter(e=>vis(e)&&!e.closest('.sh-head')).map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
      const audit=[...sec.querySelectorAll('button,.dragi,.nail,.prop,.facebtn,.key,.swatch,.piece')].filter(e=>vis(e)&&!e.closest('.bar')).length;
      return{txt,emo:EMO.test(sec.textContent||''),shell:!!window.ML.Shell.has(g),head:hd&&Math.round(hd.getBoundingClientRect().height),back:bk&&Math.round(bk.getBoundingClientRect().width),
        stage:sr.height,stageW:sr.width,tray:tr.height,trayKids:[...tray.children].filter(vis).length,trayBottom:tr.bottom,press,audit,
        toggles:sec.querySelectorAll('.seg,.dots button').length,hints:[...sec.querySelectorAll('.hint,.khint,p')].filter(vis).length}},g);
    ok(`${name}: 공통 틀(ML.Shell) · 머리줄 72px · 뒤로 가기 64px 이상 · 글자 전환·안내 줄 0`,r.shell&&r.head===72&&r.back>=64&&!r.toggles&&!r.hints,`머리줄 ${r.head} 뒤로 ${r.back}`);
    ok(`${name}: 화면에 글자·이모지 없음`,r.txt===''&&!r.emo,JSON.stringify(r.txt.slice(0,20)));
    ok(`${name}: 아래 칸이 비지 않음 · 맨 아래`,r.trayKids>0&&r.trayBottom>=780-24,`칸 ${Math.round(r.tray)}px, 안의 것 ${r.trayKids}개`);
    ok(`${name}: 누를 것 110px 이상 · 한 화면 3개 이하(audit 기준)`,r.press.every(x=>x>=110)&&r.audit<=3,`누를 것 ${JSON.stringify(r.press)} · 세는 것 ${r.audit}`);
    return r;
  };

  /* ================= 젤리 세기 ================= */
  async function jellyRound(){
    await ready('jelly');let s=await J();const n=s.n;const seen=[];
    for(let k=0;k<n;k++){s=await J();const j=s.jellies.find(x=>!x.done);await tap(j.x,j.y);await W(1000);const t=await J();seen.push(t.count);
      if(k===0&&SHOT&&n>1)await shot('jelly_L'+s.lv+'_mid')}
    return{n,seen};
  }
  await enter('jelly',1);await ready('jelly');
  let s=await J();
  const jr=await look('jelly','젤리 1단계');await shot('jelly_L1_start');
  ok('젤리 1단계: 젤리 1~2개, 모두 110px 이상 큰 젤리',s.n<=2&&s.jellies.every(j=>j.w>=110&&j.h>=110),`젤리 ${s.n}개, 크기 ${Math.round(s.jellies[0].w)}px`);
  ok('젤리 1단계: 큰 그림(젤리+병)이 무대 높이의 45% 이상',(s.content.bottom-s.content.top)/s.stage.height>=.45,((s.content.bottom-s.content.top)/s.stage.height*100).toFixed(0)+'%');
  const r1=await jellyRound();
  ok('젤리 1단계: 젤리를 하나씩 콕 → 세는 수 1,2,…가 차례로 오름',r1.seen.join()===Array.from({length:r1.n},(_,i)=>i+1).join(),r1.seen.join(','));
  await W(300);s=await J();
  ok('젤리 1단계: 센 젤리가 모두 병 안으로 들어감',s.jellies.every(j=>j.x>=s.jar.left&&j.x<=s.jar.left+s.jar.width&&j.y>=s.jar.top&&j.y<=s.jar.top+s.jar.height),JSON.stringify(s.jellies.map(j=>[Math.round(j.x),Math.round(j.y)])));
  ok('젤리 1단계: 한 판 끝내면 별 1칸 · 말은 한국어 다음 영어(log win)',s.log.includes('win')&&s.starsOn===1&&s.starsN===3,`별 ${s.starsOn}/${s.starsN}`);
  await shot('jelly_L1_win');
  /* 3판 끝내면 2단계로 */
  await ready('jelly');await jellyRound();
  await ready('jelly');
  const r3=await (async()=>{await ready('jelly');let t=await J();const n=t.n;for(let k=0;k<n;k++){t=await J();const j=t.jellies.find(x=>!x.done);await tap(j.x,j.y);await W(1000)}return n})();
  let moment=false;for(let i=0;i<30&&!moment;i++){await W(250);moment=(await J()).moment}
  ok('젤리: 같은 단계 3번 → 새것이 나오는 순간(level-up)이 보임',moment);
  await shot('jelly_levelup');
  await ready('jelly');s=await J();
  ok('젤리: 3번 뒤 2단계가 됨 · 별 줄이 다시 비어 시작',s.progress.level===2&&s.starsOn===0,JSON.stringify(s.progress));
  /* 3단계: 5개까지 */
  await p.evaluate(()=>{window.ML.go('home');window.ML.__jlLevel(3);window.ML.__jlN(5);window.ML.go('jelly')});await W(900);await ready('jelly');s=await J();
  ok('젤리 3단계: 5개 젤리도 모두 110px 이상 · 한 화면 안',s.jellies.every(j=>j.w>=110&&j.h>=110&&j.x>s.stage.left&&j.x<s.stage.left+s.stage.width&&j.y>s.stage.top&&j.y<s.stage.top+s.stage.height),`${s.n}개 ${Math.round(s.jellies[0].w)}px`);
  ok('젤리 3단계: 큰 그림이 무대 높이의 45% 이상',(s.content.bottom-s.content.top)/s.stage.height>=.45,((s.content.bottom-s.content.top)/s.stage.height*100).toFixed(0)+'%');
  await look('jelly','젤리 3단계');await shot('jelly_L3_start');
  for(let k=0;k<s.n;k++){const t=await J();const j=t.jellies.find(x=>!x.done);await tap(j.x,j.y);await W(k===1?500:1000);if(k===1)await shot('jelly_L3_mid');await W(k===1?500:0)}
  await W(600);await shot('jelly_L3_win');
  /* 4단계: 센 뒤 수 그림 고르기 */
  await enter('jelly',4);await ready('jelly');s=await J();
  for(let k=0;k<s.n;k++){const t=await J();const j=t.jellies.find(x=>!x.done);await tap(j.x,j.y);await W(1000)}
  await W(500);s=await J();
  ok('젤리 4단계: 다 세면 아래 칸에 수 그림 카드 3장(110px 이상)',s.phase==='match'&&s.cards.length===3&&s.cards.every(c=>c.w>=110),`카드 ${s.cards.length}장`);
  await look('jelly','젤리 4단계(수 고르기)');await shot('jelly_L4_match');
  const wrongC=s.cards.find(c=>c.v!==s.n),rightC=s.cards.find(c=>c.v===s.n);
  await tap(wrongC.x,wrongC.y);await W(500);let t4=await J();
  ok('젤리 4단계: 틀린 수 그림을 눌러도 멈추지 않고 다시 세어 보라고 함(실패 없음)',t4.phase==='match'&&t4.wrong===1&&t4.cards.length===3);
  await W(3800);await tap(rightC.x,rightC.y);await W(700);t4=await J();
  ok('젤리 4단계: 맞는 수를 고르면 한 판 끝(별 1칸)',t4.log.includes('numok')&&t4.log.includes('win'),`별 ${t4.starsOn}`);
  await shot('jelly_L4_win');

  /* ================= 모양 넣기 ================= */
  const hole=(s,t)=>s.holes.find(h=>h.t===t);
  async function shapeRoundTap(order){
    await ready('shapes');let s=await SH();
    for(let guard=0;guard<10;guard++){s=await SH();if(s.phase==='done'||s.holes.every(h=>h.done))break;
      const pc=s.pieces[0];if(!pc)break;await tap(pc.x,pc.y);await W(250);s=await SH();const h=hole(s,pc.t);await tap(h.x,h.y);await W(1000)}
    return await SH();
  }
  await enter('shapes',1);await ready('shapes');s=await SH();
  await look('shapes','모양 1단계');await shot('shapes_L1_start');
  ok('모양 1단계: 구멍 1개(동그라미)가 크게 · 무대 높이의 45% 이상',s.holes.length===1&&s.holes[0].h/s.stage.height>=.45,`구멍 ${Math.round(s.holes[0].h)}px / 무대 ${Math.round(s.stage.height)}px`);
  let pc=s.pieces[0];await tap(pc.x,pc.y);await W(300);s=await SH();
  ok('모양 1단계: 모양을 콕 하면 뜸(고른 모양)',s.sel===pc.t);
  await shot('shapes_L1_picked');
  let h0=hole(s,pc.t);await tap(h0.x,h0.y);await W(1100);s=await SH();
  ok('모양 1단계: 구멍을 콕 → 모양이 날아가 쏙 들어가고 한 판 끝(별 1칸)',s.log.includes('in:circle')&&s.log.includes('win'),`별 ${s.starsOn}`);
  await shot('shapes_L1_win');
  /* 2~3판 → 2단계 */
  await ready('shapes');await shapeRoundTap();await W(300);
  await ready('shapes');await shapeRoundTap();
  moment=false;for(let i=0;i<30&&!moment;i++){await W(250);moment=(await SH()).moment}
  ok('모양: 같은 단계 3번 → 새 모양이 나오는 순간(level-up)',moment);await shot('shapes_levelup');
  await ready('shapes');s=await SH();ok('모양: 3번 뒤 2단계(동그라미·네모)',s.progress.level===2&&s.set.length===2,JSON.stringify(s.set));
  /* 2단계: 끌어다 넣기 */
  await look('shapes','모양 2단계');await shot('shapes_L2_start');
  /* 틀린 구멍: 응원, 모양 그대로 */
  s=await SH();pc=s.pieces[0];const other=s.holes.find(h=>h.t!==pc.t&&!h.done);
  await tap(pc.x,pc.y);await W(250);await tap(other.x,other.y);await W(500);let sw=await SH();
  ok('모양: 틀린 구멍을 콕 → 모양은 그대로, 틀린 횟수만 기록, 막히지 않음',sw.wrong===1&&sw.pieces.some(x=>x.t===pc.t)&&sw.sel===pc.t,`틀림 ${sw.wrong}`);
  const hintOn=await p.evaluate(t=>!!document.querySelector(`#shapes .sp-hole[data-t="${t}"].hint`),pc.t);
  ok('모양: 맞는 구멍이 반짝여 알려 줌',hintOn);await shot('shapes_L2_wrong');
  const rightH=hole(sw,pc.t);await tap(rightH.x,rightH.y);await W(1100);
  await W(300);
  s=await SH();pc=s.pieces[0];h0=hole(s,pc.t);
  await tStart(pc.x,pc.y);await W(50);for(let i=1;i<=8;i++){await tMove(pc.x+(h0.x-pc.x)*i/8,pc.y+(h0.y-pc.y)*i/8);await W(40)}
  const ghost=await p.evaluate(()=>!!document.querySelector('#shapes .sp-ghost'));
  await tEnd();await W(1000);s=await SH();
  ok('모양 2단계: 끌어다 맞는 구멍에 넣어도 됨(끄는 동안 모양이 손가락을 따라옴)',ghost&&s.log.includes('in:'+pc.t),pc.t);
  /* 4단계: 5개, 아래 칸엔 한 번에 3개까지 */
  await enter('shapes',4);await ready('shapes');s=await SH();
  ok('모양 4단계: 모양 5개, 구멍 5개 모두 110px 이상',s.set.length===5&&s.holes.length===5&&s.holes.every(h=>h.w>=110&&h.h>=110),`구멍 ${Math.round(s.holes[0].w)}px`);
  ok('모양 4단계: 아래 칸의 모양은 한 번에 3개까지',s.pieces.length===3,`${s.pieces.length}개`);
  ok('모양 4단계: 구멍들이 무대를 가득 채움(높이 45% 이상)',(Math.max(...s.holes.map(h=>h.bottom))-Math.min(...s.holes.map(h=>h.top)))/s.stage.height>=.45);
  const l4=await look('shapes','모양 4단계');await shot('shapes_L4_start');
  let k4=0;for(let guard=0;guard<8;guard++){s=await SH();if(s.holes.every(h=>h.done))break;pc=s.pieces[0];await tap(pc.x,pc.y);await W(200);s=await SH();h0=hole(s,pc.t);await tap(h0.x,h0.y);await W(900);k4++;if(k4===3)await shot('shapes_L4_mid')}
  await W(300);s=await SH();ok('모양 4단계: 5개를 모두 콕과 콕으로 넣고 한 판 끝(아래 칸은 3개씩 채워짐)',k4===5&&s.log.includes('win'),`넣은 수 ${k4}`);
  await shot('shapes_L4_win');

  /* ================= 선 긋기 ================= */
  async function follow(offset,speedMs=45,steps=9){
    let s=await TR();const pts=s.path;
    await tStart(pts[0][0]+offset,pts[0][1]);
    for(let i=1;i<pts.length;i++){await tMove(pts[i][0]+offset,pts[i][1]);await W(speedMs)}
    /* hold at the end until the road is finished (the finger keeps creeping) */
    for(let g=0;g<60;g++){s=await TR();if(s.done)break;await tMove(pts[pts.length-1][0]+offset,pts[pts.length-1][1]);await W(100)}
    await tEnd();return await TR();
  }
  async function traceTaps(){let s=await TR();for(let g=0;g<30&&!s.done;g++){await tap(s.stage.left+s.stage.width*.5,s.stage.top+s.stage.height*.5);await W(380);s=await TR()}return s}
  await enter('trace',1);await ready('trace');s=await TR();
  await look('trace','선 긋기 1단계');await shot('trace_L1_start');
  ok('선 긋기 1단계: 길 폭이 화면 폭의 18% 이상',s.lane/s.stage.width>=.17,(s.lane/s.stage.width*100).toFixed(1)+'%');
  ok('선 긋기 1단계: 토토와 길이 무대 높이의 45% 이상을 차지',(s.content.bottom-s.content.top)/s.stage.height>=.45,((s.content.bottom-s.content.top)/s.stage.height*100).toFixed(0)+'%');
  /* 길 가장자리 밖(길 폭의 한 바퀴 가까이)을 따라가도 나아감 */
  let t0=Date.now();
  await tStart(s.path[0][0]+s.lane*.8,s.path[0][1]);await W(60);
  for(let i=1;i<Math.floor(s.path.length/2);i++){await tMove(s.path[i][0]+s.lane*.8,s.path[i][1]);await W(50)}
  let mid=await TR();await shot('trace_L1_mid');
  ok('선 긋기: 길에서 벗어나(길 폭의 80% 옆) 따라가도 토토가 걸어감(forgiving)',mid.prog>.15,`진행 ${(mid.prog*100).toFixed(0)}%`);
  /* 속도 제한: 손가락이 아무리 빨라도 한 번에 끝나지 않음 */
  ok('선 긋기: 절반쯤 가도 아직 끝나지 않음(속도 제한)',!mid.done&&mid.prog<.95);
  for(let i=Math.floor(s.path.length/2);i<s.path.length;i++){await tMove(s.path[i][0]+s.lane*.8,s.path[i][1]);await W(50)}
  for(let g=0;g<60;g++){const q=await TR();if(q.done)break;await tMove(s.path[s.path.length-1][0]+s.lane*.8,s.path[s.path.length-1][1]);await W(100)}
  await tEnd();await W(1300);s=await TR();
  ok('선 긋기 1단계: 끝까지 가면 덤불이 열리고 그림이 나타남 · 한 판 끝(별 1칸)',s.done&&s.pic&&/open/.test(s.bush)&&s.log.includes('win'),`별 ${s.starsOn} · ${Math.round((Date.now()-t0)/100)/10}초`);
  await shot('trace_L1_win');
  /* 콕만 해도 끝남 → 2번째 판 */
  await ready('trace');s=await TR();let pBefore=s.prog;await tap(s.stage.left+s.stage.width*.3,s.stage.top+s.stage.height*.4);await W(600);s=await TR();
  ok('선 긋기: 길을 만지지 않고 콕만 해도 조금 전진(tapAlsoAdvances)',s.prog>pBefore+.05,`${(s.prog*100).toFixed(0)}%`);
  s=await traceTaps();await W(1300);s=await TR();ok('선 긋기: 콕만으로도 끝까지 감(실패 없음)',s.done&&s.pic,JSON.stringify({d:s.done,p:s.pic,prog:s.prog,log:s.log.slice(-4)}));
  await ready('trace');
  /* 3번째 판: 손가락으로, 길을 좀 벗어나게 */
  s=await follow(-s.lane*.6);
  moment=false;for(let i=0;i<30&&!moment;i++){await W(250);moment=(await TR()).moment}
  ok('선 긋기: 같은 단계 3번 → 새 길이 나오는 순간(level-up)',moment);await shot('trace_levelup');
  await ready('trace');s=await TR();ok('선 긋기: 3번 뒤 2단계(긴 직선)',s.progress.level===2,JSON.stringify(s.progress));
  /* 3단계 물결과 4단계 동그라미: 손가락으로 */
  for(const lv of [3,4]){
    await enter('trace',lv);await ready('trace');s=await TR();await look('trace','선 긋기 '+lv+'단계');await shot('trace_L'+lv+'_start');
    ok(`선 긋기 ${lv}단계: 토토와 길이 무대 높이의 45% 이상`,(s.content.bottom-s.content.top)/s.stage.height>=.45,((s.content.bottom-s.content.top)/s.stage.height*100).toFixed(0)+'%');
    const lane=s.lane;await tStart(s.path[0][0],s.path[0][1]);
    for(let i=1;i<s.path.length;i++){await tMove(s.path[i][0]+(i%2?18:-18),s.path[i][1]);await W(45);if(i===Math.floor(s.path.length/2))await shot('trace_L'+lv+'_mid')}
    for(let g=0;g<80;g++){const q=await TR();if(q.done)break;await tMove(s.path[s.path.length-1][0],s.path[s.path.length-1][1]);await W(100)}
    await tEnd();await W(1300);s=await TR();ok(`선 긋기 ${lv}단계: 손가락으로 따라가 끝까지 가고 그림이 나타남`,s.done&&s.pic);await shot('trace_L'+lv+'_win');
  }

  /* ---- 어른 설정 '놀이별 단계' ---- */
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#progressRows .seg[data-game]')].map(x=>x.dataset.game));
  ok("어른 설정 '놀이별 단계'에 젤리·모양·선 긋기가 보임",['jelly','shapes','trace'].every(g=>rows.includes(g)),rows.join(','));
  const dep=await p.evaluate(()=>({j:window.ML.__jlDepth().length,s:window.ML.__shDepth().length,t:window.ML.__trDepth().length}));
  ok('깊이 훅: 단계 4개씩',dep.j===4&&dep.s===4&&dep.t===4,JSON.stringify(dep));
  await p.evaluate(()=>window.ML.go('home'));await W(300);
  ok('페이지 오류 0',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e);process.exit(1)});
