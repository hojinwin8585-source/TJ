/* P3 완료 기준 검사: node tests/gate.js
   시간을 짧게(6초) 두고, 모든 손동작은 모바일 화면에서 CDP Input.dispatchTouchEvent(진짜 터치)로 합니다.
   1) 미리 알림(화면은 그대로) → 하던 동작이 끝난 뒤 멈춤 화면 → 미션 → 어른 확인(틀린 숫자·짧은 누름은 통과 안 됨, 맞으면 통과) → 더 놀기 → 놀이로 복귀
   2) 하루 합계를 넘기면 '오늘은 끝'만 · 허락 시간을 30분으로 바꾸면 1800초 뒤에 멈춤
   3) 멈춤 화면에서 아무 데나(무작위 터치 포함) 눌러도 놀이로 못 돌아감
   5) 선 긋기 미션: 손가락을 길 위에 대고 거의 안 움직여도 30초 안에 완성
   캡처 5장: 쉬는 화면 · 선 긋기 · 어른 확인 · 고르기 · 끝 화면 */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const OUT=process.env.GATE_SHOTS||'/tmp/claude-0/-home-user-TJ/951ca345-5c66-5e48-88ff-e7326ce4af72/scratchpad/p3';
fs.mkdirSync(OUT,{recursive:true});
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
const KD=['','일','이','삼','사','오','육','칠','팔','구'];
const koNum=n=>{const t=Math.floor(n/10),o=n%10;return(t>1?KD[t]:'')+(t>0?'십':'')+KD[o]};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const W=ms=>p.waitForTimeout(ms);
  const T=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
  const tap=async(x,y)=>{await T('touchStart',x,y);await W(60);await T('touchEnd')};
  const hold=async(x,y,ms)=>{await T('touchStart',x,y);await W(ms);await T('touchEnd')};
  const center=async sel=>{const r=await p.locator(sel).first().boundingBox();return[r.x+r.width/2,r.y+r.height/2]};
  const tapSel=async sel=>{const[x,y]=await center(sel);await tap(x,y)};
  const gs=()=>p.evaluate(()=>window.ML.Gate.__state());
  const waitS=(fn,ms)=>p.waitForFunction(f=>{const s=window.ML.Gate.__state();return eval('('+f+')')(s)},fn.toString(),{timeout:ms||20000,polling:100});
  const shot=async n=>{await p.screenshot({path:path.join(OUT,n)})};
  const spoken=()=>p.evaluate(()=>window.__said.slice());

  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true,name:'하은'}}));
    localStorage.setItem('mallang_gate',JSON.stringify({interval:10,testSec:6}))});
  await p.reload();await W(500);
  await p.evaluate(()=>{window.__said=[];const V=window.ML_VOICE,o=V.say;V.say=function(ko,en,l){window.__said.push(String(ko)+' | '+String(en));return o.apply(this,arguments)}});
  const cfg=await p.evaluate(()=>({w:window.MLCFG.gate.warnVoice.ko,end:window.MLCFG.gate.afterMax.ko,scr:window.MLCFG.gate.screen.voice.ko}));

  /* ---- 1. 미리 알림 → 멈춤 ---- */
  await p.evaluate(()=>window.ML.go('animals'));await W(400);
  let s=await gs();ok('놀이 화면에서 시간이 셈',s.counting&&s.limitSec===6,'limitSec '+s.limitSec);
  await waitS(s=>s.warned,8000);
  ok('끝나기 전에 토토가 미리 알림',(await spoken()).some(t=>t.startsWith(cfg.w)));
  ok('미리 알림 때 화면은 그대로',await p.evaluate(()=>document.getElementById('rest').hidden&&window.ML.current()==='animals'));
  /* 하던 동작(손가락이 닿아 있는 중)이 끝난 뒤에 멈춘다 */
  await T('touchStart',195,500);
  await waitS(s=>s.pending,8000);await W(1200);
  ok('손가락이 닿아 있는 동안은 멈추지 않음',!(await gs()).shown);
  await T('touchEnd');
  await waitS(s=>s.shown,5000);
  ok('손을 뗀 뒤에 멈춤 화면',(await gs()).phase==='rest');
  ok('멈춤 화면 음성과 배경음 멈춤',(await spoken()).some(t=>t.startsWith(cfg.scr))&&await p.evaluate(()=>!window.ML.bgmOn()));
  await W(1500);await shot('1-rest.png');
  const noText=await p.evaluate(()=>{const m=document.getElementById('gateMount');const el=m.querySelectorAll('h1,h2,h3,p');return el.length});
  ok('아이 화면에 읽어야 할 글(제목·문단)이 없음',noText===0,'제목/문단 '+noText+'개');
  const big=await p.locator('#gGo').boundingBox();
  ok('큰 버튼 하나, 110px 이상',big.width>=110&&big.height>=110,Math.round(big.width)+'x'+Math.round(big.height));

  /* ---- 3. 아무 데나 눌러도 못 돌아감 (버튼 밖 무작위 터치) ---- */
  let leaked=false;
  for(let i=0;i<80;i++){
    const x=5+Math.random()*380,y=5+Math.random()*770;
    if(x>big.x-30&&x<big.x+big.width+30&&y>big.y-30&&y<big.y+big.height+30)continue;
    await tap(x,y);
    if((await gs()).phase!=='rest'){console.log('leak at',x,y,JSON.stringify(big));break}
  }
  s=await gs();leaked=!s.shown||s.phase!=='rest'||await p.evaluate(()=>window.ML.current()!=='animals');
  ok('멈춤 화면에서 아무 데나 눌러도 놀이로 못 돌아감(80번)',!leaked);
  ok('뒤의 놀이는 눌리지 않게 막힘(inert)',await p.evaluate(()=>document.getElementById('animals').closest('[inert]')!==null||document.getElementById('animals').hasAttribute('inert')||!!document.querySelector('#animals').parentElement.closest('[inert]')||[...document.body.children].some(e=>e.hasAttribute('inert'))));

  /* ---- 4/5. 미션: 선 긋기, 손가락을 거의 안 움직임 ---- */
  await tapSel('#gGo');await W(500);
  s=await gs();ok('큰 버튼을 누르면 미션',s.phase==='mission');
  const tr=await p.evaluate(()=>window.ML.Gate.__trace&&window.ML.Gate.__trace());
  ok('첫 미션은 선 긋기, 아이 단계 1(짧은 직선)',!!tr&&tr.lvl===1);
  const cv=await p.locator('#gTr').boundingBox();
  const sx=cv.x+tr.path[0][0],sy=cv.y+tr.path[0][1];
  await T('touchStart',sx,sy);const t0=Date.now();let k=0,done=false,mid=false;
  while(Date.now()-t0<30000){
    await T('touchMove',sx+(k++%2?0.3:0),sy);await W(100);
    const q=await p.evaluate(()=>window.ML.Gate.__trace());
    if(!mid&&q.prog>.4){mid=true;await shot('2-trace.png')}
    if(q.finished||(await gs()).phase!=='mission'){done=true;break}
  }
  await T('touchEnd');const secs=(Date.now()-t0)/1000;
  ok('선 긋기: 길 위에 대고 거의 안 움직여도 30초 안에 완성',done,secs.toFixed(1)+'초');
  await waitS(s=>s.phase==='parent',5000);

  /* ---- 5. 어른 확인 ---- */
  await W(900);
  s=await gs();const ans=s.answer;
  const said=(await spoken()).filter(t=>t.includes('어른 확인')).pop()||'';
  ok('숫자를 말로 불러 줌',said.includes(koNum(+ans)),said);
  const txt=await p.evaluate(()=>document.getElementById('gateMount').innerText);
  ok('화면에 그 숫자를 쓰지 않음',!txt.includes(ans),'정답 '+ans);
  const dg=await p.locator('#gPad button[data-n="5"]').boundingBox();
  ok('숫자 버튼 가로 110px 이상',dg.width>=110,Math.round(dg.width)+'x'+Math.round(dg.height));
  await shot('3-parent.png');
  const press=async str=>{for(const c of str)await tapSel(`#gPad button[data-n="${c}"]`)};
  const wrong=String((+ans+7)%90+10).padStart(2,'0');
  await press(wrong);
  const[hx,hy]=await center('#gHold');
  await hold(hx,hy,2400);await W(300);
  s=await gs();ok('틀린 숫자는 통과 안 됨',s.phase==='parent'&&s.answer!==ans&&s.entered==='','새 숫자 '+s.answer+' (이전 '+ans+')');
  const ans2=s.answer;
  await W(900);
  await press(ans2);await hold(hx,hy,1000);await W(300);
  ok('맞는 숫자라도 2초 안 누르면 통과 안 됨',(await gs()).phase==='parent');
  const dots=await p.evaluate(()=>document.querySelectorAll('#gDots i.on').length);ok('누른 만큼 점이 켜짐',dots===2);
  await hold(hx,hy,2400);await W(300);
  ok('맞는 숫자 + 2초 누르기는 통과',(await gs()).phase==='choice');
  await shot('4-choice.png');

  /* ---- 6. 10분 더 → 놀이로 복귀 ---- */
  const moreTxt=await p.locator('#gMore').innerText();
  ok('더 놀기 버튼에 허락 시간만큼 표시',moreTxt.includes('10분'),moreTxt);
  await W(1300);await tapSel('#gMore');await W(500);
  s=await gs();ok('더 놀기 → 놀이로 복귀',!s.shown&&s.since<2&&await p.evaluate(()=>window.ML.current()==='animals'&&document.getElementById('rest').hidden&&![...document.body.children].some(e=>e.hasAttribute('inert'))));
  /* 하루 합계를 코앞으로 */
  await p.evaluate(()=>{const g=window.ML.store.get('mallang_gate',{});g.testDailySec=Math.ceil(window.ML.Gate.__state().daySec)+2;window.ML.store.set('mallang_gate',g)});
  await waitS(s=>s.shown,15000);await W(1400);

  /* ---- 두 번째 미션: 낱말 카드 ---- */
  await tapSel('#gGo');await W(400);
  s=await gs();ok('두 번째는 낱말 카드(번갈아)',s.phase==='mission'&&(await p.locator('.g-card').count())===2);
  const cr=await p.locator('.g-card').first().boundingBox();ok('카드 110px 이상',cr.width>=110&&cr.height>=110,Math.round(cr.width)+'x'+Math.round(cr.height));
  await p.locator('.g-card').nth(0).dispatchEvent('click');await W(500);
  ok('카드 하나만으로는 안 끝남',(await gs()).phase==='mission');
  const n0=(await spoken()).length;
  await tapSel('.g-card[data-i="1"]');await W(300);
  ok('카드를 콕 하면 이름을 한국어·영어로 말함',(await spoken()).slice(n0).some(t=>/! \| .+!/.test(t)));
  await waitS(s=>s.phase==='parent',5000);await W(700);
  const a3=(await gs()).answer;await press(a3);await hold(hx,hy,2400);await W(300);
  s=await gs();ok('하루 합계를 넘기면 어른 확인 뒤 "오늘은 끝"만 나옴',s.phase==='choice'&&(await p.locator('#gMore').count())===0&&(await p.locator('#gEnd').count())===1);
  await W(1300);await tapSel('#gEnd');await W(600);
  s=await gs();
  const endTxt=await p.evaluate(()=>document.getElementById('gateMount').innerText);
  ok('끝 화면: 끝인사와 화면 밖 놀이 제안',s.phase==='end'&&endTxt.includes('화면 밖 놀이')&&endTxt.includes('오늘 놀이는 끝'),endTxt.replace(/\n+/g,' / ').slice(0,90));
  ok('끝 화면: 끝인사 음성',(await spoken()).some(t=>t.startsWith(cfg.end)));
  ok('끝 화면: 손유희 영상 링크가 그대로 있음',await p.evaluate(()=>{const v=document.querySelector('#rest .vlist');return!!v&&v.querySelectorAll('a.vcard').length>0&&getComputedStyle(v).display!=='none'}));
  await shot('5-end.png');
  /* 끝난 뒤 아이가 놀이를 다시 열어도 바로 끝 화면 */
  await p.evaluate(()=>{window.ML.Gate.__state()});
  await tap(195,40);await W(300);
  ok('끝 화면에서 아이가 눌러도 못 나감',(await gs()).phase==='end');
  const[ex,ey]=await center('#gHome');await hold(ex,ey,2400);await W(400);
  ok('어른이 2초 눌러야 홈으로',await p.evaluate(()=>window.ML.current()==='home')&&!(await gs()).shown,'현재 '+await p.evaluate(()=>window.ML.current())+' '+JSON.stringify(await gs()));
  await p.evaluate(()=>window.ML.go('shapes'));
  await waitS(s=>s.shown&&s.phase==='end',4000).then(()=>ok('오늘은 끝낸 뒤 놀이로 다시 들어가면 바로 끝 화면',true),()=>ok('오늘은 끝낸 뒤 놀이로 다시 들어가면 바로 끝 화면',false));
  await p.evaluate(()=>{window.ML.go('home');});

  /* ---- 2. 허락 시간 30분: 설정에서 바꾸면 실제로 1800초 뒤에 멈춤 ---- */
  await p.evaluate(()=>{document.getElementById('rest').hidden=true;window.ML.Gate.__reset();const g=window.ML.store.get('mallang_gate',{});delete g.testDailySec;window.ML.store.set('mallang_gate',g);window.location.reload()});
  await W(900);
  await p.evaluate(()=>{window.__said=[];const V=window.ML_VOICE,o=V.say;V.say=function(ko){window.__said.push(String(ko));return o.apply(this,arguments)}});
  await p.evaluate(()=>window.ML.go('home'));await W(400);
  const gear=await center('#gear');await hold(gear[0],gear[1],2300);await W(400);
  ok('어른 설정 열림, 옛 "하루 놀이 시간" 줄은 없고 새 줄 3개',await p.evaluate(()=>!document.getElementById('settings').hidden&&!document.getElementById('setTimer')&&!!document.getElementById('gInterval')&&!!document.getElementById('gMode')&&!!document.getElementById('gDaily')));
  const optsT=await p.evaluate(()=>[...document.querySelectorAll('#gInterval button')].map(x=>x.textContent).join(',')+' | '+[...document.querySelectorAll('#gDaily button')].map(x=>x.textContent).join(','));
  ok('허락 시간 10·15·20·30분, 하루 합계 30·45·60분',optsT==='10분,15분,20분,30분 | 30분,45분,60분',optsT);
  await tapSel('#gInterval button[data-v="30"]');await W(200);
  s=await gs();ok('30분으로 바꾸면 한계가 1800초',s.limitSec===1800&&s.interval===30,'limitSec '+s.limitSec);
  await tapSel('#gMode button[data-v="parent_only"]');await W(100);
  ok('방식 설정이 저장됨',(await gs()).mode==='parent_only');
  await tapSel('#gMode button[data-v="mission_then_parent"]');
  await p.evaluate(()=>{document.getElementById('settings').hidden=true;window.ML.go('animals')});await W(500);
  const upTo=async t=>{const c=(await gs()).since;await p.evaluate(d=>window.ML.Gate.__advance(d),t-c)};
  await p.evaluate(()=>window.ML.Gate.__reset());
  await p.evaluate(()=>{const g=window.ML.store.get('mallang_gate',{});window.ML.store.set('mallang_gate',g)});
  await upTo(1700);
  s=await gs();ok('1700초: 아직 안 멈춤·미리 알림도 아직',!s.pending&&!s.shown&&!s.warned,'since '+s.since.toFixed(1));
  await upTo(1745);
  ok('1745초: 미리 알림(1분 전)',(await gs()).warned&&!(await gs()).shown);
  await upTo(1798);
  ok('1798초: 아직 안 멈춤',!(await gs()).pending&&!(await gs()).shown);
  await upTo(1800.5);await W(1200);
  ok('1800초(30분): 멈춤',(await gs()).shown);
  /* 홈·어른 설정에서는 세지 않음 */
  await p.evaluate(()=>{document.getElementById('rest').hidden=true;window.ML.Gate.__reset();window.location.reload()});await W(900);
  await p.evaluate(()=>window.ML.go('home'));let before=(await gs()).since;await W(1800);
  ok('홈에서는 시간을 세지 않음',(await gs()).since===before);
  await p.evaluate(()=>window.ML.go('animals'));await W(1800);
  const mid2=(await gs()).since;ok("놀이 화면에서는 셈",mid2>1.2,mid2.toFixed(1)+'초');
  await p.evaluate(()=>{document.getElementById('settings').hidden=false});const a1=(await gs()).since;await W(1500);
  ok('어른 설정이 열려 있는 동안은 세지 않음',Math.abs((await gs()).since-a1)<.05);
  await p.evaluate(()=>{document.getElementById('settings').hidden=true});

  /* ---- 4. 무작위 터치로 어른 확인이 뚫리지 않음 (멈춤 화면 전 단계) ---- */
  await p.evaluate(()=>{window.ML.store.set('mallang_gate',{interval:10,testSec:3});window.ML.Gate.__reset();window.location.reload()});await W(900);
  await p.evaluate(()=>window.ML.go('animals'));await waitS(s=>s.shown,10000);await W(1400);
  let reached='';
  const R=n=>Math.floor(Math.random()*n);
  for(let i=0;i<400;i++){
    const k=R(10),x=5+R(380),y=5+R(770);
    if(k<6)await p.mouse.click(x,y);
    else if(k<8){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(5+R(380),5+R(770),{steps:5});await p.mouse.up()}
    else{const bs=await p.$$('#rest button');if(bs.length){try{await bs[R(bs.length)].click({force:true,timeout:400})}catch(e){}}}
    const q=await gs();if(!q.shown||q.phase==='choice'||q.phase==='end'){reached=q.phase+'/shown='+q.shown;break}
    if(i%40===0&&q.phase==='parent'){/* 다시 듣기도 눌러 봄 */}
  }
  ok('무작위 터치 400번으로 어른 확인(더 놀기·끝)에 도달 못 함',reached==='',reached||('마지막 단계 '+(await gs()).phase));
  ok('실행 중 오류 0건',errs.length===0,errs.slice(0,3).join(' / '));
  await b.close();
  console.log(fails?('실패 '+fails+'건'):'모두 통과');
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
