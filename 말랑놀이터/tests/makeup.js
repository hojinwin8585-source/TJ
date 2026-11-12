/* P8-가 화장 가게 완료 기준 검사: node tests/makeup.js   (SHOT_DIR=폴더 를 주면 가게 앞 · 과정마다 · 거울 장면을 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다(모바일 화면).
   1) 1단계 한 판(세안 → 볼터치 → 립스틱 → 거울)을 콕과 쓱쓱만으로 끝까지, 별 1칸
   2) 립스틱 도구를 볼 · 머리 · 눈 · 코에 대고 문질러도 칠해진 칸 0 (다른 자리도 그대로), 그 자리가 빛나고 손님이 가리킴. 입술에서만 오름
   3) 어떤 과정에서도 화장 색의 진하기(그린 층의 불투명도)가 한도(pretty: 70%)를 넘지 않음 — 다 칠한 뒤 더 문질러도 그대로
   4) 거울은 아이가 눌러야만 끝남(나타난 뒤 4초 기다려도 그대로)
   5) 4단계(훅)에서 새 과정이 실제로 나옴: 오이 팩 · 로션 · 아이섀도 · 마스카라 · 반짝이 스티커와 머리 장식 · 원하는 색 말풍선, 끝까지 완주
   6) 글자 안내 · 글자 버튼 · 이모지 없음, 누를 것 110px 이상(뒤로 가기는 64px), 손님이 살아 있음(ML.Alive), 깊이 표 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:SHOT?2:1});const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__mk());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[])};
  const rub=async(pts,rounds=1)=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(let r=0;r<rounds;r++){for(const q of pts){await touch('touchMove',[q]);await W(12)}}await touch('touchEnd',[])};
  /* a back-and-forth path over some points (a child's scribble over the place) */
  const scribble=(c,rx,ry,n=24)=>Array.from({length:n},(_,k)=>[c[0]+Math.cos(k*1.3)*rx,c[1]+Math.sin(k*2.1)*ry]);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const tapEl=async sel=>{const bb=await p.locator(sel).first().boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2)};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('makeup2'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('style'))texts.push(t)}
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=[...bt.querySelectorAll('svg')].filter(vis),sw=s.length?Math.max(...s.map(x=>x.getBoundingClientRect().width)):0;return{cls:bt.className,w:Math.round(r.width),h:Math.round(r.height),ratio:+(sw/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    const emoji=/\p{Extended_Pictographic}/u.test(scr.textContent);
    return{texts,btns,bad:btns.filter(x=>x.ratio<.5||x.text),small:btns.filter(x=>!/mk-back/.test(x.cls)&&Math.min(x.w,x.h)<110),backSmall:btns.filter(x=>/mk-back/.test(x.cls)&&Math.min(x.w,x.h)<64),emoji}});
  /* the painted layers' real opacity on screen (group opacity × every parent's opacity) */
  const realOpacity=()=>p.evaluate(()=>{let mx=0;document.querySelectorAll('#mkCust .mk-op').forEach(e=>{let o=1;for(let x=e;x&&x.id!=='mkCust';x=x.parentElement){o*=+getComputedStyle(x).opacity}mx=Math.max(mx,o)});return +mx.toFixed(3)});
  let maxOp=0,capV=0;const watchOp=async()=>{const o=await realOpacity();if(o>maxOp)maxOp=o};
  const textBad=[];const checkText=async tag=>{const t=await textCheck();if(t.texts.length||t.bad.length||t.emoji||t.small.length||t.backSmall.length)textBad.push(tag+': '+JSON.stringify({texts:t.texts,bad:t.bad,emoji:t.emoji,small:t.small,back:t.backSmall}))};

  /* ---------- one whole round by tapping and rubbing ---------- */
  async function play(tag,o={}){
    const t0=Date.now(),seen=[],shotDone=new Set();let guard=0,wrongDone=false;
    while(Date.now()-t0<240000){
      const s=await st();
      if(s.view==='lobby'&&s.phase==='lobby'&&seen.length)return{seen,s};
      if(s.phase==='enter'||s.phase==='pick'){await W(300);continue}
      if(s.step&&seen[seen.length-1]!==s.phase&&s.phase!=='mirror')seen.push(s.phase);
      await watchOp();
      const key=s.phase+(s.toolOn?'_tool':s.cards.length?'_cards':'');
      if(!shotDone.has(key)&&s.phase!=='mirror'){shotDone.add(key);await W(s.toolOn?2300:900);await checkText(tag+' '+key);await shot(tag+'_'+String(seen.length).padStart(2,'0')+'_'+key);continue}
      if(s.mirror&&(s.phase==='free'||(s.phase==='sparkle'&&s.look.orn))){
        /* 4) the mirror ends the round only when pressed */
        const before=s.phase;await W(4000);const s2=await st();ok(tag+': 거울이 나와도 누르기 전에는 끝나지 않음',s2.phase===before&&s2.view==='room',s2.phase);
        await shot(tag+'_09_before_mirror');await tapEl('#mkMirBtn');await W(2900);await shot(tag+'_10_mirror');await W(1500);await shot(tag+'_11_photo');
        await p.waitForFunction(()=>window.ML.__mk().view==='lobby',null,{timeout:12000});await W(2600);await shot(tag+'_12_lobby_after');continue}
      if(s.phase==='mirror'){await W(300);continue}
      if(s.cards.length&&!s.toolOn&&!s.waitTap){await tapEl(`#mkTray .mk-card:nth-child(${(guard++%3)+1})`);await W(900);continue}
      if(s.toolOn&&s.step==='lips'&&o.wrongTest&&!wrongDone){
        wrongDone=true;await W(400);const a=await st();
        /* 2) lipstick on the cheek, hair, eye and nose */
        for(const k of ['cheekL','hair','eyeL','nose','cheekR']){await rub(scribble(a.pts[k],18,12,30),2);await W(250)}
        const z=await st();const others=JSON.stringify([z.painted.cheeks,z.painted.lidL,z.painted.lidR])===JSON.stringify([a.painted.cheeks,a.painted.lidL,a.painted.lidR]);
        ok('립스틱을 볼·머리·눈·코에 문질러도 입술 칠한 칸 0, 다른 자리도 그대로',z.painted.lips===0&&others,`입술 칸 ${z.painted.lips} · 볼 ${a.painted.cheeks}→${z.painted.cheeks}`);
        ok('엉뚱한 곳: 그 자리가 빛나고 손님이 가리킴 (여기야!)',z.log.some(x=>x==='wrong:lips'),z.log.filter(x=>x.startsWith('wrong')).join(','));
        await shot(tag+'_lips_wrong_place');
        await rub(scribble(z.pts.lips,14,6,20),1);await W(200);const y=await st();
        ok('입술에 대면 입술 칸만 오름',y.painted.lips>0&&y.cover.lips>0,`입술 칸 ${y.painted.lips}/${y.cellPts.length}`);
        continue}
      if(s.toolOn){const pts=s.cellPts;
        if(pts.length){const path=[];const n=pts.length;for(let k=0;k<n;k++)path.push(pts[k]);for(let k=n-1;k>=0;k-=2)path.push(pts[k]);await rub(path,1)}
        await W(150);continue}
      if(s.waitTap){
        if(s.step==='pack'){const t=s.cukes<2?(s.cukes===0?s.pts.eyeL:s.pts.eyeR):s.pts.nose;await tap(t[0],t[1]);await W(700);continue}
        if(s.step==='lotion'&&s.spots){const t=s.spots[s.dollops];if(t){await tap(t[0],t[1]);await W(500)}else await W(300);continue}
        if(s.step==='sparkle'){
          const look=s.look;if(!look.stickers.length){await tapEl('#mkTray .mk-card:nth-child(1)');await W(300);await tap(s.pts.cheekL[0],s.pts.cheekL[1]);await W(400);await tapEl('#mkTray .mk-card:nth-child(2)');await W(300);await tap(s.pts.cheekR[0],s.pts.cheekR[1]);await W(400);
            /* tap a sticker again = take it off, then put it back */
            const n1=(await st()).look.stickers.length;await tap(s.pts.cheekR[0],s.pts.cheekR[1]);await W(300);const n2=(await st()).look.stickers.length;ok('스티커는 붙였다 뗄 수 있음',n1===2&&n2===1,n1+'→'+n2);
            await tap(s.pts.cheekR[0],s.pts.cheekR[1]);await W(300);await tapEl('#mkTray .mk-card:nth-child(3)');await W(900);continue}
          await W(300);continue}
        await W(300);continue}
      await W(250);
    }
    throw new Error('시간 초과 '+tag+' '+JSON.stringify((await st()).phase));
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('makeup2'));await p.waitForFunction(()=>window.ML.__mk().phase==='lobby',null,{timeout:8000});await W(1200);
  let s=await st();capV=s.cap;
  ok('1단계 과정: 세안 → 볼터치 → 립스틱',s.level===1&&s.plan.join()==='wash,blush,lips',s.plan.join(' → '));
  ok('가게 앞 손님 3명, 누를 곳 110px 이상',s.seats.length===3&&s.seats.every(q=>Math.min(q[2],q[3])>=110),s.seats.map(q=>Math.round(q[2])+'×'+Math.round(q[3])).join(', '));
  await checkText('lobby');await shot('mk_lobby_L1');
  await tap(s.seats[0][0],s.seats[0][1]);
  await p.waitForFunction(()=>window.ML.__mk().phase==='wash',null,{timeout:9000});
  s=await st();ok('손님이 살아 있음 (ML.Alive)',!!s.alive,s.alive&&('깜빡임 '+s.alive.blinks));
  const c1=s.cust;
  const r1=await play('mkL1_'+c1,{wrongTest:true});
  ok('1단계 한 판을 콕과 쓱쓱만으로 완주',r1.seen.join()==='wash,blush,lips',r1.seen.join(' → '));
  s=await st();ok('끝나면 별 1칸, 가게 벽 액자',s.log.includes('star:1')&&s.wall===1,`별 ${s.log.filter(x=>x.startsWith('star')).join(',')} · 액자 ${s.wall}`);
  ok('3) 화장 색 진하기가 한도를 넘지 않음 (한 판 내내)',maxOp>0&&maxOp<=capV+1e-6,`가장 진한 층 ${Math.round(maxOp*100)}% / 한도 ${Math.round(capV*100)}%`);

  /* ---------- level 4 via the hook: every new step ---------- */
  await p.evaluate(()=>window.ML.__mkLevel(4));await W(1500);s=await st();
  ok('4단계 과정에 새로 생기는 것이 나옴',['wash','pack','lotion','blush','eyeshadow','mascara','lips','sparkle'].every(k=>s.plan.includes(k)),s.plan.join(' → '));
  await shot('mk_lobby_L4');
  const lobbyCusts=await p.evaluate(()=>[...document.querySelectorAll('#mkSeats .mk-seat')].map(b=>b.getAttribute('aria-label')));
  /* a different customer than in round 1 */
  const i2=s.seats.length>1?1:0;await tap(s.seats[i2][0],s.seats[i2][1]);
  await p.waitForFunction(()=>window.ML.__mk().phase==='wash',null,{timeout:9000});s=await st();const c2=s.cust;
  ok('4단계: 손님이 원하는 색을 말풍선으로',!!s.wish,JSON.stringify(s.wish));
  maxOp=0;
  const r4=await play('mkL4_'+c2);
  ok('4단계 한 판 완주 (오이 팩 · 로션 · 아이섀도 · 마스카라 · 스티커)',['pack','lotion','eyeshadow','mascara','sparkle'].every(k=>r4.seen.includes(k)),r4.seen.join(' → '));
  ok('두 판의 손님이 다름',c1!==c2,c1+' / '+c2);
  ok('3) 4단계에서도 진하기 한도 이하',maxOp>0&&maxOp<=capV+1e-6,`가장 진한 층 ${Math.round(maxOp*100)}%`);
  /* every look together, rubbed in any order: the finished face never goes over the ceiling */
  await p.evaluate(()=>window.ML.__mkPreview('curly',{lips:{col:'red'},blush:{col:'red'},shadow:{col:'orange'},lashes:1}));await W(300);
  const allOp=await realOpacity();ok('3) 모든 화장을 다 한 얼굴도 한도 이하',allOp<=capV+1e-6,Math.round(allOp*100)+'%');
  ok('6) 글자 안내 · 글자 버튼 · 이모지 없음 · 누를 것 110px 이상',textBad.length===0,textBad.slice(0,3).join(' / '));
  const depth=await p.evaluate(()=>window.ML.__mkDepth());
  console.log('깊이 표 (__mkDepth): '+depth.map(d=>`${d.level}단계 과정 ${d.processes}(${d.steps.join('·')}) 손동작 ${d.hands.join('+')} 손님 ${d.someone?'있음':'없음'} 고르기 ${d.choice?'있음':'없음'} 끝내기 ${d.ending}`).join(' / '));
  ok('깊이: 과정 수가 단계마다 늘고 4단계는 4개 이상, 손동작 2가지 이상',depth[0].processes>=3&&depth[3].processes>=4&&depth.every(d=>d.hands.length>=2&&d.someone&&d.choice),depth.map(d=>d.processes).join(','));
  ok('페이지 오류 없음',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
