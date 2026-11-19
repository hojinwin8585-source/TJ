/* P8-나 하루 일과 완료 기준 검사: node tests/routine.js   (SHOT_DIR=폴더 를 주면 장면마다 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다.
   1) 1단계 하루(일어나기 · 양치)를 콕과 쓱쓱만으로 끝까지
   2) 4단계(훅): 여섯 장면이 아침부터 차례로 늘어나고, 창밖 해가 장면마다 움직임
   3) 수가 맞음: 담은 음식 = 떠먹은 숟가락 수 = 3, 접시에 남은 것 0
   4) 글자 · 이모지 · 다음/새로운 하루 버튼 없음, 누를 것 110px 이상, 토토가 무대 높이의 45% 이상, 엉뚱한 곳을 눌러도 진행 안 됨 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__routine());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[]);};
  const rub=async(pts,rounds=1)=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(let r=0;r<rounds;r++){for(const q of pts){await touch('touchMove',[q]);await W(14)}}await touch('touchEnd',[])};
  const shotDone=new Set();const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('routine2'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const svgText=[...scr.querySelectorAll('svg text')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=bt.querySelector('svg'),sr=s?s.getBoundingClientRect():{width:0};return{w:Math.round(r.width),h:Math.round(r.height),ratio:+(sr.width/r.width).toFixed(2),text:(bt.textContent||'').trim(),cls:bt.className}});
    return{texts,svgText,btns,bad:btns.filter(x=>x.ratio<.5||x.text),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent),nextBtn:btns.some(x=>!/rt-back|rt-card/.test(x.cls))}});
  const smallHot=[];let sawNext=false;const skyBy={},tot=[];
  async function play(tag,opts={}){
    const t0=Date.now();let guard=0;const clears0=(await st()).log.filter(x=>x==='clear').length;
    while(Date.now()-t0<500000){
      const s=await st();
      if(s.log.filter(x=>x==='clear').length>clears0)return s;
      if(s.phase==='enter'){await W(300);continue}
      if(!sawNext){const t=await textCheck();if(t.nextBtn)sawNext=true}
      if(opts.onState&&await opts.onState(s))continue;
      if(s.kind==='wait'||s.busy){await W(200);continue}
      const key=tag+String(s.pi).padStart(2,'0')+'_'+s.step;
      if(!shotDone.has(key)){shotDone.add(key);await W(2400);await shot(key);const q=await st();if(!skyBy[q.scene])skyBy[q.scene]={t:q.sky,x:q.sunX};tot.push(q.totoH);continue}
      s.hot.forEach(h=>{if(Math.min(h.w,h.h)<110)smallHot.push(s.step+':'+h.w+'x'+h.h)});
      if(s.kind==='cards'){const bb=await p.locator('#routine2Tray .rt-card').nth(guard++%3).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
      if(s.kind==='tap'){await tap(s.aim[0],s.aim[1]);await W(450);continue}
      if(s.kind==='rub'){await rub(s.cellPts.length?s.cellPts:[[s.rect.x+s.rect.w/2,s.rect.y+s.rect.h/2]],1);await W(150);continue}
      await W(200);
    }
    throw new Error('시간 초과 '+tag);
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('routine2'));await p.waitForFunction(()=>window.ML.__routine().phase==='curtain',null,{timeout:12000});await W(500);
  let s=await st();
  ok('1단계: 일어나기와 양치 두 장면, 과정이 설정 순서대로',s.level===1&&s.scenes.join()==='wake,teeth'&&s.plan.join()==='curtain,rouse,pasteColor,paste,brush,rinse,serve',s.plan.join(' → '));
  ok('토토가 살아 있음 (ML.Alive)',!!s.alive&&s.alive.kind==='bunny','깜빡임 '+(s.alive&&s.alive.blinks));
  let tc=await textCheck();
  ok('글자 안내 줄 없음',tc.texts.length===0&&tc.svgText.length===0,JSON.stringify(tc.texts.concat(tc.svgText)));
  ok('글자 버튼 없음, 이모지 없음',tc.bad.length===0&&!tc.emoji,tc.btns.map(x=>x.w+'x'+x.h).join(', '));
  const dp1=await p.evaluate(()=>window.ML.__routineDepth());
  ok('깊이(1단계): 과정 4개 이상, 손동작 2가지 이상, 손님, 고르기, 끝내기',dp1.processes>=4&&dp1.handActions.length>=2&&dp1.customer&&dp1.choice&&dp1.ending,JSON.stringify(dp1));
  const sb=await p.locator('#routine2Stage').boundingBox();let wrongDone=false;
  const w0=Date.now();
  await play('L1_',{onState:async x=>{
    if(x.step==='curtain'&&x.kind==='rub'&&!wrongDone&&shotDone.has('L1_00_curtain')){wrongDone=true;const m=x.misses;await tap(sb.x+sb.width*.5,sb.y+sb.height*.9);await W(300);const z=await st();ok('커튼 앞에서 엉뚱한 곳 → 진행 없음, 응원',z.step==='curtain'&&z.misses-m===1);return true}
    return false}});
  s=await st();
  ok('1단계 하루가 끝까지 감 (커튼 · 흔들기 · 치약 · 양치 · 헹굼)',s.cnt.curtain===1&&s.cnt.rouse===1&&s.cnt.paste===1&&s.cnt.teeth===12&&s.cnt.rinse===1,JSON.stringify(s.cnt));
  ok('"다음" 같은 글자 버튼이 한 번도 없었음',!sawNext);
  ok('누를 것은 모두 110px 이상',smallHot.length===0,smallHot.slice(0,6).join(', ')||'모두 110px 이상');
  await W(1500);s=await st();ok('별 1칸',s.served>=1,'served '+s.served);
  await W(3500);

  /* ---------- level 4 ---------- */
  await p.evaluate(()=>window.ML.__routineLevel(4));await p.waitForFunction(()=>window.ML.__routine().phase==='curtain',null,{timeout:12000});await W(500);
  s=await st();
  ok('4단계: 여섯 장면이 아침부터 차례로',s.level===4&&s.scenes.join()==='wake,teeth,eat,dress,bath,sleep',s.scenes.join(' → '));
  ok('4단계 과정이 설정 순서대로',s.plan.join()==='curtain,rouse,pasteColor,paste,brush,rinse,food,spoon,wipe,outfit,putOn,water,foam,shower,towel,pajama,book,cover,lamp,serve',s.plan.join(' '));
  const dp4=await p.evaluate(()=>window.ML.__routineDepth());
  ok('깊이(4단계): 과정 4개 이상 · 손동작 3가지 · 고르기',dp4.processes>=4&&dp4.handActions.length>=3&&dp4.choice,JSON.stringify(dp4));
  await play('L4_',{});
  s=await st();
  ok('수가 맞음: 담은 음식 = 떠먹은 숟가락 = 3',s.cnt.foods===3&&s.cnt.bites===3,'담음 '+s.cnt.foods+' · 먹음 '+s.cnt.bites);
  ok('모든 장면의 동작이 일어남 (옷, 수건, 잠옷, 책, 이불, 불 끄기)',s.cnt.putOn===1&&s.cnt.towel===1&&s.cnt.pajama===1&&s.cnt.page===1&&s.cnt.cover===1&&s.cnt.lamp===1&&s.cnt.water===1&&s.cnt.wipe===1,JSON.stringify(s.cnt));
  const sc=['wake','teeth','eat','dress','bath','sleep'];
  ok('창밖 해가 장면마다 움직임 (아침 → 밤)',sc.every(k=>skyBy[k])&&sc.every((k,i)=>i===0||skyBy[k].t>skyBy[sc[i-1]].t),sc.map(k=>k+' '+(skyBy[k]?skyBy[k].t:'?')).join(' → '));
  ok('토토가 무대 높이의 45% 이상',tot.length>0&&tot.every(h=>h>=sb.height*.45),'가장 작을 때 '+Math.min(...tot)+'px / 무대 '+Math.round(sb.height)+'px');
  ok('누를 것은 모두 110px 이상 (4단계 포함)',smallHot.length===0,smallHot.slice(0,6).join(', ')||'모두 110px 이상');
  ok('글자 버튼 · 다음/새로운 하루 버튼 한 번도 없었음',!sawNext);
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
