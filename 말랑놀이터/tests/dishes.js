/* P8-나 설거지 완료 기준 검사: node tests/dishes.js   (SHOT_DIR=폴더 를 주면 과정마다 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다.
   1) 1단계 한 판을 콕과 쓱쓱만으로 끝까지 (세제 고르기 → 세제 → 거품 → 헹굼 → 끝내기)
   2) 4단계(훅)에서 과정이 늘어남: 걷기 · 긁기 · 탄 자국 · 닦기 · 선반
   3) 수가 맞음: 씻은 그릇 = 선반에 꽂힌 그릇, 세제 짜기 = 그릇 수, 걷은 그릇 = 그릇 수
   4) 틀린 선반 칸은 받지 않고 그릇 이름을 말해 줌
   5) 글자 안내 · 글자 버튼 · 이모지 없음, 엉뚱한 곳을 눌러도 진행 안 됨, 다음 버튼 없음, 토토가 살아 있음 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__dish());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[]);};
  const rub=async(pts,rounds=1)=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(let r=0;r<rounds;r++){for(const q of pts){await touch('touchMove',[q]);await W(14)}}await touch('touchEnd',[])};
  const shotDone=new Set();
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('dishes2'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const svgText=[...scr.querySelectorAll('svg text')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=bt.querySelector('svg'),sr=s?s.getBoundingClientRect():{width:0};return{w:Math.round(r.width),h:Math.round(r.height),ratio:+(sr.width/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    const emoji=/\p{Extended_Pictographic}/u.test(scr.textContent);
    return{texts,svgText,btns,bad:btns.filter(x=>x.ratio<.5||x.text),emoji,nextBtn:!!scr.querySelector('button:not(.dk-back):not(.dk-card)')}});
  async function play(tag,opts={}){
    const t0=Date.now(),seen=[];let guard=0;
    while(Date.now()-t0<300000){
      const s=await st();if(s.phase==='enter'){await W(300);continue}
      if(s.log.includes('clear')&&opts.untilClear!==false&&s.phase==='serve'&&s.log.filter(x=>x==='clear').length>(opts.clears0||0))return s;
      if(s.step&&seen[seen.length-1]!==s.step)seen.push(s.step);
      if(opts.onState&&await opts.onState(s))continue;
      if(s.kind==='wait'||s.busy){await W(200);continue}
      const key=tag+String(s.pi).padStart(2,'0')+'_'+s.step;
      if(!shotDone.has(key)){shotDone.add(key);await W(2400);await shot(key);continue}
      if(s.kind==='cards'&&s.step==='choose'){const bb=await p.locator('#dkTray .dk-card').nth(guard++%3).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
      if(s.kind==='tap'){await tap(s.aim[0],s.aim[1]);await W(500);continue}
      if(s.kind==='rub'){await rub(s.cellPts.length?s.cellPts:[[s.rect.x+s.rect.w/2,s.rect.y+s.rect.h/2]],1);await W(150);continue}
      if(s.kind==='shelve'){const d=s.dishes.findIndex(x=>!x.shelved);if(d<0){await W(200);continue}
        await tap(s.dishes[d].xy[0],s.dishes[d].xy[1]);await W(450);
        const idx=s.cards.indexOf(s.dishes[d].slot),bb=await p.locator('#dkTray .dk-card').nth(idx).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1100);continue}
      await W(200);
    }
    throw new Error('시간 초과 '+tag);
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('dishes2'));await p.waitForFunction(()=>window.ML.__dish().phase==='choose',null,{timeout:9000});await W(500);
  let s=await st();
  ok('1단계 과정: 세제 고르기 → 세제 → 거품 → 헹굼 → 끝내기',s.level===1&&s.plan.join()==='choose,soap,scrub,rinse,serve',s.plan.join(' → '));
  ok('접시 2개',s.dishes.length===2&&s.dishes.every(d=>d.kind==='plate'),s.dishes.map(d=>d.kind).join('+'));
  ok('토토가 살아 있음 (ML.Alive)',!!s.alive&&s.alive.kind==='bunny','깜빡임 '+(s.alive&&s.alive.blinks));
  let tc=await textCheck();
  ok('글자 안내 줄 없음',tc.texts.length===0&&tc.svgText.length===0,JSON.stringify(tc.texts.concat(tc.svgText)));
  ok('글자 버튼 없음 (모든 버튼에 그림 50% 이상), 이모지 없음',tc.bad.length===0&&!tc.emoji,tc.btns.map(x=>x.w+'x'+x.h+' 그림 '+Math.round(x.ratio*100)+'%').join(', '));
  ok('카드와 뒤로 가기가 110px / 64px 이상',tc.btns.every(x=>Math.min(x.w,x.h)>=64)&&tc.btns.filter(x=>x.w!==x.h).every(x=>x.w>=110),JSON.stringify(tc.btns.map(x=>[x.w,x.h])));
  const sb=await p.locator('#dkStage').boundingBox();
  await W(3000);
  let sawNext=false,rubSeen={},crumbs=0;
  let wrongDone=false;
  const r1=await play('L1_',{onState:async x=>{
    if(x.step==='soap'&&x.kind==='tap'&&!wrongDone&&shotDone.has('L1_01_soap')){wrongDone=true;const m0=x.misses;for(let k=0;k<3;k++){await tap(sb.x+sb.width*.6,sb.y+sb.height*.08);await W(300)}const y=await st();
      ok('엉뚱한 곳 3번 → 진행 없음, 응원 3번',y.step==='soap'&&y.squeezed===0&&y.misses-m0===3,'응원 '+(y.misses-m0)+'번');return true}if(x.step==='scrub'||x.step==='rinse')rubSeen[x.step]=x;
    if(!sawNext){const t=await textCheck();if(t.nextBtn)sawNext=true}
    if(x.step==='serve'&&!shotDone.has('L1_done')){shotDone.add('L1_done');await W(1500);await shot('L1_serve_dishes');}
    return false}});
  s=await st();
  ok('세제 짜기 수 = 그릇 수',s.squeezed===s.dishes.length,s.squeezed+'번 / 그릇 '+s.dishes.length);
  ok('1단계 한 판 끝: 씻은 그릇 = 선반에 꽂힌 그릇 = 2',s.washed===2&&s.shelvedCount===2&&s.log.includes('serve'),`씻은 ${s.washed} · 선반 ${s.shelvedCount}`);
  ok('"다음" 같은 글자 버튼이 한 번도 없었음',!sawNext);
  await W(3500);

  /* ---------- level 4 via the test hook ---------- */
  await p.evaluate(()=>window.ML.__dishLevel(4));await p.waitForFunction(()=>window.ML.__dish().phase==='choose',null,{timeout:9000});await W(500);
  s=await st();
  ok('4단계 과정이 늘어남: 걷기 · 긁기 · 탄 자국 · 닦기 · 선반',s.level===4&&['collect','scrape','burnt','dry','shelve'].every(k=>s.plan.includes(k)),s.plan.join(' → '));
  ok('그릇 4개, 냄비 1개',s.dishes.length===4&&s.dishes.filter(d=>d.kind==='pot').length===1,s.dishes.map(d=>d.kind).join('+'));
  const t4=Date.now();let wrongTried=false,pots={};const clears0=(await st()).log.filter(x=>x==='clear').length;
  const r4=await play('L4_',{clears0,onState:async x=>{
    if(x.step==='burnt'&&x.toolOn){const d=x.dishes.find(y=>y.burnt);pots.b=d.bv;}
    if(x.step==='shelve'&&x.kind==='shelve'&&!wrongTried&&x.sel<0){wrongTried=true;const d=x.dishes.findIndex(y=>!y.shelved),wrong=x.cards.findIndex(c=>c!==x.dishes[d].slot);
      await tap(x.dishes[d].xy[0],x.dishes[d].xy[1]);await W(400);const bb=await p.locator('#dkTray .dk-card').nth(wrong).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(500);
      const y=await st();ok('틀린 칸에는 그릇이 들어가지 않고 이름을 말해 줌',y.shelvedCount===0&&y.wrongShelf===1&&y.log.some(l=>l.startsWith('wrong:'+x.dishes[d].kind)),'틀린 칸 '+y.wrongShelf+'번, 선반 '+y.shelvedCount);await shot('L4_wrongShelf');return true}
    return false}});
  s=await st();
  const cnt=a=>s.log.filter(x=>x===a).length;
  ok('걷은 그릇 = 4, 세제 짜기 = 4',cnt('collect')===4&&s.squeezed===4,`걷기 ${cnt('collect')} · 세제 ${s.squeezed}`);
  ok('씻은 그릇 = 선반에 꽂힌 그릇 = 4',s.washed===4&&s.shelvedCount===4,`씻은 ${s.washed} · 선반 ${s.shelvedCount}`);
  ok('남은 음식 긁기와 탄 자국 지우기가 실제로 일어남',cnt('scrape')>0&&s.log.includes('press:burnt')&&s.dishes.every(d=>d.scr===1&&d.bv===1||d.scr===1&&!d.burnt),`긁은 알갱이 ${cnt('scrape')}`);
  ok('4단계 한 판이 끝까지 감',s.log.includes('serve'),'걸린 시간 '+Math.round((Date.now()-t4)/1000)+'초');
  await W(1500);await shot('L4_end');
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
