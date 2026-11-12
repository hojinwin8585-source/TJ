/* P8-가 옷 가게 완료 기준 검사: node tests/clothes.js   (SHOT_DIR=폴더 를 주면 가게 · 옷걸이 · 테마 배경 완성 3벌을 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다(모바일 화면).
   1) 가게 화면에 배경 요소(커튼 탈의실, 거울, 옷걸이 봉, 신발 선반, 창)가 있음
   2) 인형이 머리 · 몸 · 팔 둘 · 다리 둘 묶음으로 이루어지고, 입힌 옷이 그 묶음 안에 들어감(몸에 맞게)
   3) 몸을 콕 → 그 자리 옷이 옷걸이에 걸려 들어옴(1단계 2벌), 콕 하면 입힘, 다른 옷을 콕 하면 바꿈, 입은 옷을 콕 하면 색이 바뀜, 끌어서 떼면 벗겨짐, 카드를 끌어다 놓아도 입힘
   4) 거울은 아이가 눌러야 끝(4초 기다려도 그대로), 누르면 테마 배경 · 포즈 3가지 · 사진첩, 별 1칸
   5) 4단계(훅): 머리 장식 · 신발 · 소품 · 목 자리가 생기고 3벌씩, 세 친구가 세 테마로 끝까지
   6) 글자 안내 · 글자 버튼 · 이모지 없음, 누를 것 110px 이상(뒤로 가기 64px), 인형이 살아 있음, 깊이 표 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__cl());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[])};
  const drag=async(a,c,n=12)=>{await touch('touchStart',[a]);for(let k=1;k<=n;k++){await touch('touchMove',[[a[0]+(c[0]-a[0])*k/n,a[1]+(c[1]-a[1])*k/n]]);await W(25)}await touch('touchEnd',[])};
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const idle=()=>p.waitForFunction(()=>!window.ML.__cl().busy,null,{timeout:5000}).then(()=>W(450));
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('clothes'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('style'))texts.push(t)}
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=[...bt.querySelectorAll('svg')].filter(vis),sw=s.length?Math.max(...s.map(x=>x.getBoundingClientRect().width)):0;return{cls:bt.className,w:Math.round(r.width),h:Math.round(r.height),ratio:+(sw/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    return{texts,bad:btns.filter(x=>x.ratio<.5||x.text),small:btns.filter(x=>!/cl-back/.test(x.cls)&&Math.min(x.w,x.h)<110),back:btns.filter(x=>/cl-back/.test(x.cls)&&Math.min(x.w,x.h)<64),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent)}});
  const textBad=[];const checkText=async tag=>{const t=await textCheck();if(t.texts.length||t.bad.length||t.small.length||t.back.length||t.emoji)textBad.push(tag+': '+JSON.stringify(t))};
  /* dress the places listed, tapping the place and then card k (or dragging it) */
  async function wear(slot,k=0,byDrag=false){
    let s=await st();await tap(...s.slotPts[slot]);await W(700);s=await st();
    if(!s.rack||s.rack.slot!==slot)return s;
    const c=s.cards[k%s.cards.length];
    if(byDrag)await drag([c[0],c[1]],s.slotPts.top);else await tap(c[0],c[1]);
    await W(200);await idle();return st();
  }
  async function ending(tag){
    let s=await st();await tap(...(await p.evaluate(()=>{const r=document.getElementById('clMirBtn').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})));
    await W(2600);await shot(tag+'_pose1');await W(2350);await shot(tag+'_pose2');await W(700);await shot(tag+'_pose3');
    s=await st();await p.waitForFunction(()=>window.ML.__cl().view==='lobby',null,{timeout:12000});await W(2500);return s;
  }

  /* ---------- the shop ---------- */
  await p.evaluate(()=>window.ML.go('clothes'));await p.waitForFunction(()=>window.ML.__cl().phase==='lobby',null,{timeout:8000});await W(1200);
  let s=await st();
  ok('1) 가게 배경 요소: 커튼 탈의실 · 거울 · 옷걸이 봉 · 신발 선반 · 창',Object.values(s.bg).every(Boolean),JSON.stringify(s.bg));
  ok('기다리는 친구 3명, 누를 곳 110px 이상',s.mates.length===3&&s.mates.every(q=>Math.min(q[2],q[3])>=110),s.mates.map(q=>Math.round(q[2])+'×'+Math.round(q[3])).join(', '));
  await checkText('lobby');await shot('cl_shop');
  await tap(s.mates[0][0],s.mates[0][1]);await p.waitForFunction(()=>window.ML.__cl().phase==='dress',null,{timeout:8000});await W(900);
  s=await st();
  ok('2) 인형이 머리 · 몸 · 팔 · 다리 묶음으로 이루어짐',Object.values(s.parts).every(n=>n===1),JSON.stringify(s.parts));
  ok('1단계 자리: 윗옷 · 아래옷, 2벌씩',s.slots.join()==='top,bottom'&&s.options===2,s.slots.join(',')+' / '+s.options+'벌');
  ok('인형이 살아 있음 (ML.Alive)',!!s.alive,s.alive&&s.alive.kind);
  /* 3) the rack */
  await tap(...s.slotPts.top);await W(900);s=await st();
  ok('3) 몸을 콕 → 그 자리 옷 2벌이 옷걸이에',s.rack&&s.rack.slot==='top'&&s.cards.length===2&&s.cards.every(c=>Math.min(c[2],c[3])>=110),JSON.stringify(s.rack)+' '+s.cards.map(c=>Math.round(c[2])+'×'+Math.round(c[3])).join(','));
  await checkText('rack');await shot('cl_rack');
  await tap(s.cards[0][0],s.cards[0][1]);await W(200);await idle();s=await st();const first=s.wear.top&&s.wear.top.id;
  ok('3) 카드를 콕 → 입혀짐 (커튼이 닫혔다 열림)',!!first&&s.log.some(x=>x.startsWith('wear:top')),first);
  ok('2) 입힌 옷이 몸 · 팔 묶음 안에 들어감',s.wornIn['top@torso']&&(s.wornIn['top@arm']||first==='swimsuit'),Object.keys(s.wornIn).join(','));
  await tap(s.cards[1][0],s.cards[1][1]);await W(200);await idle();s=await st();
  ok('3) 다른 옷을 콕 → 바뀜',s.wear.top&&s.wear.top.id!==first,first+' → '+(s.wear.top&&s.wear.top.id));
  const col0=s.wear.top.col;await tap(...s.slotPts.top);await W(700);s=await st();
  ok('3) 입은 옷을 콕 → 색이 바뀜',s.wear.top&&s.wear.top.col!==col0,col0+' → '+(s.wear.top&&s.wear.top.col));
  await drag(s.slotPts.top,s.offPt,14);await W(800);s=await st();
  ok('3) 입은 옷을 끌어서 옷걸이로 → 벗겨짐',!s.wear.top&&s.log.includes('off:top'),JSON.stringify(s.wear));
  /* card dragged onto the doll; avoid a one-piece dress so the bottom can go on too */
  await tap(...s.slotPts.top);await W(700);s=await st();
  const ri=s.rack.items.findIndex(x=>!['gown','swimsuit'].includes(x));await drag([s.cards[Math.max(0,ri)][0],s.cards[Math.max(0,ri)][1]],s.slotPts.top);await W(200);await idle();s=await st();
  ok('3) 카드를 인형에 끌어다 놓아도 입혀짐',!!s.wear.top,JSON.stringify(s.wear));
  s=await wear('bottom',0);
  ok('아래옷도 입힘',!!s.wear.bottom||(s.wear.top&&['gown','swimsuit'].includes(s.wear.top.id)),JSON.stringify(s.wear));
  await p.waitForFunction(()=>window.ML.__cl().mirror,null,{timeout:9000});await W(900);
  /* 4) the mirror */
  const before=await st();await W(4000);s=await st();
  ok('4) 거울이 나와도 누르기 전에는 끝나지 않음',s.phase==='dress'&&s.view==='room'&&before.mirror,s.phase);
  await checkText('dressed');await shot('cl_L1_dressed');
  const e1=await ending('cl_L1_'+before.theme);
  ok('4) 거울을 누르면 테마 배경과 포즈 3가지',e1.scene===before.theme&&['pose:1','pose:2','pose:3'].every(x=>e1.log.includes(x)),e1.scene+' / '+e1.log.filter(x=>x.startsWith('pose')).join(','));
  s=await st();ok('4) 사진첩에 들어가고 별 1칸',s.album===1&&s.log.includes('star:1'),'사진첩 '+s.album+' · '+s.log.filter(x=>x.startsWith('star')).join(','));

  /* ---------- level 4 via the hook: three friends, three themes ---------- */
  await p.evaluate(()=>window.ML.__clLevel(4));await W(1500);s=await st();
  const seenTh=[],seenDoll=[];
  for(let r=0;r<3;r++){
    s=await st();const i=r%3;await tap(s.mates[i][0],s.mates[i][1]);await p.waitForFunction(()=>window.ML.__cl().phase==='dress',null,{timeout:8000});await W(900);s=await st();
    if(r===0){ok('5) 4단계 자리: 머리 · 신발 · 소품 · 목, 3벌씩',['head','feet','hand','neck'].every(k=>s.slots.includes(k))&&s.options===3,s.slots.join(',')+' / '+s.options+'벌')}
    seenTh.push(s.theme);seenDoll.push(s.doll);
    for(const slot of ['top','bottom','feet','head','neck','hand']){const t=await st();if(slot==='bottom'&&t.wear.top&&['gown','swimsuit'].includes(t.wear.top.id))continue;await wear(slot,0)}
    s=await st();if(r===0){ok('2) 신발은 다리, 머리 장식은 머리, 소품은 팔/몸 묶음 안',s.wornIn['feet@leg']&&s.wornIn['head@head']&&(s.wornIn['hand@arm']||s.wornIn['hand@torso']),Object.keys(s.wornIn).join(','));await shot('cl_L4_rack_'+s.theme)}
    await checkText('L4 '+s.theme);await W(600);await shot(`cl_L4_${r}_${s.doll}_${s.theme}_dressed`);
    await ending(`cl_L4_${r}_${s.doll}_${s.theme}`);
  }
  ok('5) 세 판 모두 끝까지 (서로 다른 테마)',new Set(seenTh).size===3,seenTh.join(', ')+' / '+seenDoll.join(', '));
  s=await st();ok('사진첩 4장',s.album===4,String(s.album));
  ok('6) 글자 안내 · 글자 버튼 · 이모지 없음 · 누를 것 110px 이상',textBad.length===0,textBad.slice(0,2).join(' / '));
  const depth=await p.evaluate(()=>window.ML.__clDepth());
  console.log('깊이 표 (__clDepth): '+depth.map(d=>`${d.level}단계 과정 ${d.processes}(${d.steps.join('·')}) 손동작 ${d.hands.join('+')} 손님 ${d.someone?'있음':'없음'} 고르기 있음 끝내기 ${d.ending}`).join(' / '));
  ok('깊이: 과정 4개 이상, 손동작 2가지 이상, 살아 있는 손님',depth.every(d=>d.processes>=4&&d.hands.length>=2&&d.someone),depth.map(d=>d.processes).join(','));
  ok('페이지 오류 없음',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
