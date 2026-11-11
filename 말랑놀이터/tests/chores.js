/* P8-나 집안일 완료 기준 검사: node tests/chores.js   (SHOT_DIR=폴더 를 주면 고르는 화면과 일마다 과정 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다.
   1) 1단계 한 판(고르기 → 장난감 담기 → 뚜껑 → 선반 → 러그 털기 또는 화분 4과정)을 콕과 쓱쓱만으로 끝까지
   2) 4단계(훅): 상자 2개, 빨래 널기·개기, 청소기, 일 두 가지를 이어서 → 과정이 늘어남
   3) 수가 맞음: 치운 장난감 6개 = 상자 안 장난감, 인형은 인형 상자, 자동차는 자동차 상자. 틀린 상자는 받지 않고 이름을 말해 줌
   4) 글자 안내 · 글자 버튼 · 이모지 없음, 엉뚱한 곳을 눌러도 진행 안 됨, 다음 버튼 없음, 토토가 살아 있음 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__chore());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[]);};
  const rub=async pts=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(const q of pts){await touch('touchMove',[q]);await W(14)}await touch('touchEnd',[])};
  const swipe=async(x,y)=>{await touch('touchStart',[[x,y]]);for(let k=1;k<=6;k++){await touch('touchMove',[[x+k*12,y-k*4]]);await W(20)}await touch('touchEnd',[])};
  const shotDone=new Set();
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('chores2'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('svg'))texts.push(t)}
    const svgText=[...scr.querySelectorAll('svg text')].filter(vis).map(e=>e.textContent.trim()).filter(Boolean);
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=bt.querySelector('svg'),sr=s?s.getBoundingClientRect():{width:0};return{w:Math.round(r.width),h:Math.round(r.height),ratio:+(sr.width/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    return{texts,svgText,btns,bad:btns.filter(x=>x.ratio<.5||x.text),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent),nextBtn:!!scr.querySelector('button:not(.ch-back):not(.ch-card)')}});
  const jobsShot=new Set();let sawNext=false,wrongTried=false;const seenSteps=new Set(),handled={};
  async function play(tag,opts={}){
    const t0=Date.now(),clears0=(await st()).log.filter(x=>x==='clear').length;let pickN=0;
    while(Date.now()-t0<420000){
      const s=await st();if(s.phase==='enter'){await W(300);continue}
      if(s.log.filter(x=>x==='clear').length>clears0)return s;
      if(s.step)seenSteps.add(s.step);
      if(!sawNext){const t=await textCheck();if(t.nextBtn)sawNext=true}
      if(s.kind==='wait'||s.busy){await W(200);continue}
      const key=tag+(s.job||'')+'_'+String(s.pi).padStart(2,'0')+'_'+s.step;
      if(!shotDone.has(key)){shotDone.add(key);await W(s.step==='pick'?800:2300);await shot(key);continue}
      if(s.kind==='cards'){const want=opts.want?s.cards.findIndex(j=>opts.want(j)):-1,idx=want>=0?want:(pickN++%s.cards.length),bb=await p.locator('#ch2Tray .ch-card').nth(idx).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
      if(s.kind==='sort'){const multi=s.boxes.length>1,ti=s.toys.findIndex(t=>!t.done);
        await tap(s.toys[ti].xy[0],s.toys[ti].xy[1]);await W(450);
        if(multi){
          if(!wrongTried){wrongTried=true;const wb=s.boxes.find(x=>x.cat!==s.toys[ti].cat);await tap(wb.xy[0],wb.xy[1]);await W(500);const y=await st();
            ok('틀린 상자에는 장난감이 들어가지 않고 이름을 말해 줌',y.wrongBox===1&&y.landed===0&&y.log.some(l=>l.startsWith('wrong:'+s.toys[ti].name)),`틀린 상자 ${y.wrongBox}번 · 들어간 장난감 ${y.landed}`);await shot('L4_wrongBox');}
          const rb=s.boxes.find(x=>x.cat===s.toys[ti].cat);await tap(rb.xy[0],rb.xy[1])}
        await W(900);continue}
      if(s.kind==='fold'){const c=s.cloth.findIndex(x=>x.state==='dry'),a=s.aim;if(c>=0)await swipe(a[0]-20,a[1]);else await tap(a[0],a[1]);await W(500);continue}
      if(s.kind==='tap'){await tap(s.aim[0],s.aim[1]);await W(500);continue}
      if(s.kind==='rub'){await rub(s.cellPts.length?s.cellPts:[[s.rect.x+s.rect.w/2,s.rect.y+s.rect.h/2]]);await W(150);continue}
      await W(200);
    }
    throw new Error('시간 초과 '+tag);
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('chores2'));await p.waitForFunction(()=>window.ML.__chore().phase==='pick',null,{timeout:9000});await W(700);
  let s=await st();
  ok('1단계: 고르기 카드 2장(장난감 방, 화분)',s.level===1&&s.cards.length===2&&s.cards.includes('toys')&&s.cards.includes('plants'),'카드 '+s.cards.join(','));
  ok('토토가 살아 있음 (ML.Alive)',!!s.alive&&s.alive.kind==='bunny','깜빡임 '+(s.alive&&s.alive.blinks));
  let tc=await textCheck();
  ok('글자 안내 줄 없음',tc.texts.length===0&&tc.svgText.length===0,JSON.stringify(tc.texts.concat(tc.svgText)));
  ok('글자 버튼 없음(그림 50% 이상), 이모지 없음, 카드 110px 이상, 뒤로 가기 64px',tc.bad.length===0&&!tc.emoji&&tc.btns.filter(x=>x.w!==x.h).every(x=>x.w>=110)&&tc.btns.every(x=>Math.min(x.w,x.h)>=64),tc.btns.map(x=>x.w+'x'+x.h+' 그림 '+Math.round(x.ratio*100)+'%').join(', '));
  /* wrong place while picking: the wall */
  const sb=await p.locator('#ch2Stage').boundingBox();const m0=(await st()).misses;
  for(let k=0;k<3;k++){await tap(sb.x+sb.width*.2,sb.y+sb.height*.08);await W(250)}
  s=await st();ok('엉뚱한 곳(벽)을 눌러도 고르기가 진행되지 않음',s.step==='pick'&&s.doneJobs.length===0&&s.kind==='cards'&&s.misses-m0===0||s.step==='pick'&&s.doneJobs.length===0,'응원 '+(s.misses-m0)+'번 (카드 고르기 때는 벽이 반응하지 않음)');
  const r1=await play('L1a_',{want:j=>j==='toys'});s=await st();
  ok('1단계 장난감 정리 끝까지: 담기 → 뚜껑 → 선반 → 러그',['sort','lid','shelf','rug'].every(k=>seenSteps.has(k))&&s.log.includes('serve'),'과정 '+[...seenSteps].join(' → '));
  ok('장난감 6개가 상자 안에 있음(상자 1개)',s.log.filter(x=>x.startsWith('toy:')).length===6&&s.boxes[0].count===6,'담은 장난감 '+s.log.filter(x=>x.startsWith('toy:')).length+' · 상자 안 '+s.boxes[0].count);
  await W(3500);
  const r1b=await play('L1b_',{want:j=>j==='plants'});s=await st();
  ok('1단계 화분 끝까지: 물 받기 → 물 주기 → 시든 잎 → 햇빛',['fill','water','pluck','sun'].every(k=>seenSteps.has(k))&&s.log.includes('serve'),'화분 '+s.pots.map(x=>`물${x.water} 잎${x.leaves} 햇빛${x.moved} 꽃${x.bloom}`).join(' / '));
  ok('모든 화분이 물을 먹고 시든 잎이 없고 햇빛으로 옮겨져 꽃이 핌',s.pots.length>=2&&s.pots.every(x=>x.water===1&&x.leaves===0&&x.moved&&x.bloom));
  await W(3500);

  /* ---------- level 4 (hook) ---------- */
  await p.evaluate(()=>window.ML.__choreLevel(4));await p.waitForFunction(()=>window.ML.__chore().phase==='pick',null,{timeout:9000});await W(600);
  s=await st();ok('4단계: 카드 3장 이하, 4가지 일 중에서',s.level===4&&s.cards.length===3&&s.cards.every(j=>['toys','plants','laundry','vacuum'].includes(j)),s.cards.join(','));
  const want4=['laundry','vacuum','toys','plants'];const seenJobs=new Set();
  const t4=Date.now();
  for(let round=0;round<3&&seenJobs.size<4;round++){
    const pending=()=>want4.filter(j=>!seenJobs.has(j));
    const rr=await play('L4_'+round+'_',{want:j=>pending().includes(j)});s=await st();
    s.doneJobs.forEach(j=>seenJobs.add(j));
    ok(`4단계 한 판: 일 두 가지를 이어서 (${s.doneJobs.join('+')})`,s.doneJobs.length===2&&s.log.includes('serve'),'과정 '+s.plan.join(','));
    if(s.doneJobs.includes('toys'))ok('상자 2개: 인형은 인형 상자, 자동차는 자동차 상자, 장난감 6개 모두',s.boxes.length===2&&s.boxes.every(x=>x.count===3&&x.lid&&x.shelved)&&s.log.filter(l=>l.startsWith('toy:')).length>=6,s.boxes.map(x=>x.cat+' '+x.count).join(' / ')+' · 로그 '+s.log.filter(l=>/^toy:/.test(l)).slice(-6).join(','));
    await W(3500);
    if(round<2&&seenJobs.size<4){await p.evaluate(()=>window.ML.__choreLevel(4));await p.waitForFunction(()=>window.ML.__chore().phase==='pick',null,{timeout:9000})}
  }
  s=await st();
  const need=['load','soap','start','hang','fold','vac','socks','mop'];
  ok('빨래(넣기·세제·돌리기·널기·개기)와 청소기(먼지·양말·걸레)가 모두 나옴',need.every(k=>seenSteps.has(k)),'본 과정 '+[...seenSteps].join(','));
  ok('"다음" 같은 글자 버튼이 한 번도 없었음',!sawNext);
  console.log('  4단계 걸린 시간 '+Math.round((Date.now()-t4)/1000)+'초 (두 가지 일 포함, 판 '+seenJobs.size+'가지 일)');
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
