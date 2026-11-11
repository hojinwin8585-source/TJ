/* P8-나 빵집 완료 기준 검사: node tests/bakery.js   (SHOT_DIR=폴더 를 주면 과정마다 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다.
   1) 1단계 빵 한 판을 콕과 쓱쓱만으로 끝까지 (젓기 → 판에 놓기 → 굽기 → 꺼내기 → 상자에 담기)
   2) 4단계(훅): 빵은 재료 넣기·치대기·모양 고르기·잼 고르기·바르기가 설정된 순서대로 늘고, 케이크는 크림 → 과일 → 짤주머니 → 초 순서
   3) 수가 맞음: 만든 반죽 = 놓은 반죽 = 구운 빵 = 상자에 담은 빵, 썬 과일 = 올린 과일
   4) 글자 · 이모지 · 다음 버튼 없음, 누를 것 110px 이상, 엉뚱한 곳을 눌러도 진행 안 됨 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__bake());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[]);};
  const rub=async(pts,rounds=1)=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(let r=0;r<rounds;r++){for(const q of pts){await touch('touchMove',[q]);await W(14)}}await touch('touchEnd',[])};
  const shotDone=new Set();const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('bakery'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const svgText=[...scr.querySelectorAll('svg text')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=bt.querySelector('svg'),sr=s?s.getBoundingClientRect():{width:0};return{w:Math.round(r.width),h:Math.round(r.height),ratio:+(sr.width/r.width).toFixed(2),text:(bt.textContent||'').trim(),cls:bt.className}});
    return{texts,svgText,btns,bad:btns.filter(x=>x.ratio<.5||x.text),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent),nextBtn:btns.some(x=>!/bk-back|bk-card|bk-lc/.test(x.cls))}});
  const smallHot=[];let sawNext=false;
  async function play(tag,want,opts={}){
    const t0=Date.now();let guard=0;const clears0=(await st()).log.filter(x=>x==='clear').length;
    while(Date.now()-t0<400000){
      const s=await st();
      if(s.log.filter(x=>x==='clear').length>clears0)return s;
      if(s.phase==='enter'){await W(300);continue}
      if(!sawNext){const t=await textCheck();if(t.nextBtn)sawNext=true}
      if(opts.onState&&await opts.onState(s))continue;
      if(s.kind==='wait'||s.busy){await W(200);continue}
      const key=tag+(s.step||s.phase);
      if(!shotDone.has(key)){shotDone.add(key);await W(s.view==='lobby'?800:2400);await shot(key);continue}
      s.hot.forEach(h=>{if(Math.min(h.w,h.h)<110)smallHot.push((s.step||s.phase)+':'+h.w+'x'+h.h)});
      if(s.phase==='lobby'){const i=Math.max(0,s.orders.indexOf(want));await tap(s.custPts[i][0],s.custPts[i][1]);await W(1500);continue}
      if(s.kind==='cards'){const bb=await p.locator('#bakeryTray .bk-card').nth(guard++%3).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
      if(s.kind==='tap'){await tap(s.aim[0],s.aim[1]);await W(450);continue}
      if(s.kind==='rub'){await rub(s.cellPts.length?s.cellPts:[[s.rect.x+s.rect.w/2,s.rect.y+s.rect.h/2]],1);await W(150);continue}
      await W(200);
    }
    throw new Error('시간 초과 '+tag);
  }

  /* ---------- level 1: bread ---------- */
  await p.evaluate(()=>window.ML.go('bakery'));await p.waitForFunction(()=>window.ML.__bake().phase==='lobby',null,{timeout:9000});await W(600);
  let s=await st();
  ok('가게 앞에 손님 3명, 모두 살아 있음(Alive), 말풍선은 빵',s.custPts.length===3&&s.lobbyAlive===3&&s.orders.every(o=>o==='bread'),s.orders.join('+')+' · 살아 있는 손님 '+s.lobbyAlive);
  let tc=await textCheck();
  ok('글자 안내 줄 없음',tc.texts.length===0&&tc.svgText.length===0,JSON.stringify(tc.texts.concat(tc.svgText)));
  ok('글자 버튼 없음(모든 버튼에 그림 50% 이상), 이모지 없음',tc.bad.length===0&&!tc.emoji,tc.btns.map(x=>x.w+'x'+x.h+' 그림 '+Math.round(x.ratio*100)+'%').join(', '));
  ok('손님 버튼과 뒤로 가기가 110px / 64px 이상',tc.btns.every(x=>Math.min(x.w,x.h)>=64)&&tc.btns.filter(x=>/bk-lc/.test(x.cls)).every(x=>Math.min(x.w,x.h)>=110),JSON.stringify(tc.btns.map(x=>[x.w,x.h])));
  /* a wrong place in the lobby does nothing */
  const sb=await p.locator('#bakeryStage').boundingBox();const m0=s.misses;await tap(sb.x+sb.width*.5,sb.y+sb.height*.2);await W(300);let y=await st();
  ok('엉뚱한 곳을 눌러도 진행 없음, 응원',y.phase==='lobby'&&y.misses-m0===1,'응원 '+(y.misses-m0)+'번');
  const r1=await play('L1_','bread',{onState:async x=>{
    if(x.step==='stir'&&x.kind==='rub'&&shotDone.has('L1_stir')&&!shotDone.has('L1_wrong')){shotDone.add('L1_wrong');const m=x.misses;await tap(sb.x+sb.width*.5,sb.y+8);await W(300);const z=await st();ok('젓기 중 엉뚱한 곳 → 진행 없음, 응원',z.step==='stir'&&z.misses-m===1);return true}
    return false}});
  s=await st();
  ok('1단계 빵 과정: 젓기 → 판에 놓기 → 굽기 → 꺼내기 → 담기',s.plan.join()==='stir,place,bake,out,serve',s.plan.join(' → '));
  ok('수가 맞음: 만든 반죽 = 놓은 반죽 = 구운 빵 = 상자에 담은 빵 = 4',s.cnt.made===4&&s.cnt.placed===4&&s.cnt.baked===4&&s.cnt.packed===4,JSON.stringify(s.cnt));
  ok('빵이 실제로 노릇하게 구워짐',s.pieces.length===4&&s.pieces.every(x=>x.baked));
  ok('"다음" 같은 글자 버튼이 한 번도 없었음',!sawNext);
  ok('누를 것은 모두 110px 이상',smallHot.length===0,smallHot.slice(0,5).join(', ')||'모두 110px 이상');
  await W(1500);s=await st();ok('한 판이 끝까지 가고 별 1칸',s.log.includes('serve')&&s.served>=1,'served '+s.served);
  await W(3500);

  /* ---------- level 4: bread with every step ---------- */
  await p.evaluate(()=>window.ML.__bakeLevel(4));await p.waitForFunction(()=>window.ML.__bake().phase==='lobby',null,{timeout:9000});await W(600);
  s=await st();
  ok('4단계 손님 주문이 빵과 케이크 섞임',s.level===4&&s.orders.includes('bread')&&s.orders.includes('cake'),s.orders.join('+'));
  const dp=await p.evaluate(()=>window.ML.__bakeDepth());
  ok('깊이 표: 과정 4개 이상, 손동작 2가지 이상, 손님, 고르기, 끝내기',dp.processes>=4&&dp.handActions.length>=2&&dp.customer&&dp.choice&&dp.ending,JSON.stringify(dp));
  const sawPlan={};
  await play('L4b_','bread',{onState:async x=>{if(x.step&&!sawPlan.bread&&x.order==='bread'){sawPlan.bread=x.plan.join()}return false}});
  s=await st();
  ok('4단계 빵 과정이 설정 순서대로 늘어남',sawPlan.bread==='add,stir,knead,place,shape,bake,out,jam,spread,serve',sawPlan.bread);
  ok('재료 콕 6번(밀가루 3 + 우유 1 + 달걀 2), 치대기 5번',s.cnt.add===6&&s.cnt.knead===5,JSON.stringify(s.cnt));
  ok('4단계 빵도 만든 만큼 쓰기 (4 = 4 = 4 = 4)',s.cnt.made===4&&s.cnt.placed===4&&s.cnt.baked===4&&s.cnt.packed===4&&s.cnt.spread===4,JSON.stringify(s.cnt));
  ok('모양 카드와 잼 카드를 골랐음',s.log.some(l=>/^pick:(bun|loaf|croissant)$/.test(l))&&s.log.some(l=>/^pick:(strawberry|blueberry|butter)$/.test(l)),s.log.filter(l=>l.startsWith('pick:')).join(' '));
  await W(3500);

  /* ---------- level 4: cake ---------- */
  await p.evaluate(()=>window.ML.__bakeLevel(4));await p.waitForFunction(()=>window.ML.__bake().phase==='lobby',null,{timeout:9000});await W(600);
  let planCake='';
  await play('L4c_','cake',{onState:async x=>{if(x.step&&!planCake&&x.order==='cake')planCake=x.plan.join();return false}});
  s=await st();
  ok('4단계 케이크 과정이 설정 순서대로: 크림 → 과일 → 짤주머니 → 초',planCake==='cream,pickFruit,cut,top,pipe,candle,light,blow,serve',planCake);
  ok('썬 과일 = 올린 과일 = 4, 크림 꽃 8곳, 초 3개 꽂고 켜고 끔',s.cnt.cut===4&&s.cnt.topped===4&&s.slices===4&&s.cnt.rose===8&&s.roses===8&&s.cnt.cand===3&&s.cnt.lit===3&&s.cnt.blown===3,JSON.stringify(s.cnt));
  ok('케이크 한 판이 끝까지 감',s.log.includes('serve'));
  ok('누를 것은 모두 110px 이상 (4단계 포함)',smallHot.length===0,smallHot.slice(0,5).join(', ')||'모두 110px 이상');
  ok('글자 버튼 · 다음 버튼 한 번도 없었음',!sawNext);
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
