/* 말랑 놀이터 · 시간 약속 (P3)
   놀이 화면에 있는 시간만 세고(홈·어른 설정·앱이 가려진 동안은 세지 않음), 시간이 되면 하던 동작이 끝난 뒤
   차분한 쉬는 화면 → (엄마와 미션 1개) → 어른 확인(말로 부른 숫자 + 2초 누르기) → 더 놀기 / 오늘은 끝.
   숫자와 문구는 MLCFG.gate · touch.trace · calm 에서 읽습니다. */
(()=>{
'use strict';
const M=window.ML;if(!M||!window.MLCFG)return;
const CFG=window.MLCFG,G=CFG.gate||{},TR=(CFG.touch||{}).trace||{},TOUCH=CFG.touch||{},PAL=(CFG.calm&&CFG.calm.palette)||{};
const COL=(CFG.calm&&CFG.calm.choiceColors)||[];
const $=s=>document.querySelector(s);
const say=(ko,en)=>{try{M.say(ko,en)}catch(e){}};
const OPTS=G.intervalOptions||[10,15,20,30],DAILY_OPTS=G.dailyMaxOptions||[30,45,60];
const KEY='mallang_gate',DKEY='mallang_gate_day';
const MODES={mission_then_parent:'미션 있음',parent_only:'미션 없음'};

/* ---------- saved settings and today's totals ---------- */
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const loadSet=()=>M.store.get(KEY,{});
function settings(){
  const s=loadSet();
  const interval=OPTS.includes(s.interval)?s.interval:(OPTS.includes(M.S.timer)?M.S.timer:G.everyMinutes);
  const mode=MODES[s.mode]?s.mode:(MODES[G.mode]?G.mode:'mission_then_parent');
  const dailyMax=DAILY_OPTS.includes(s.dailyMax)?s.dailyMax:G.dailyMaxMinutes;
  /* testSec / testDailySec: only for tests (a short interval instead of minutes) */
  return{interval,mode,dailyMax,limitSec:s.testSec>0?s.testSec:interval*60,dailySec:s.testDailySec>0?s.testDailySec:dailyMax*60};
}
const saveSet=o=>M.store.set(KEY,Object.assign(loadSet(),o));
function day(){const d=M.store.get(DKEY,null);return d&&d.d===todayStr()?d:{d:todayStr(),sec:0,ended:false,last:''}}
const saveDay=d=>M.store.set(DKEY,d);

/* ---------- state ---------- */
let since=0,warned=false,pending=false,pendingAt=0,shown=false,phase='',lastTick=0,tickT=0,shownAt=0;
let D=day();
let answer='',entered='',phaseTimers=[],phaseStop=null,lastActivity=0;
const down=new Set();
const enabled=()=>M.S.timer!==0;   // 0 = off (only the old test setting; there is no 'off' choice in the parent settings)
const later=(fn,ms)=>{const t=setTimeout(()=>{phaseTimers=phaseTimers.filter(x=>x!==t);fn()},ms);phaseTimers.push(t);return t};
function clearPhase(){phaseTimers.forEach(clearTimeout);phaseTimers=[];if(phaseStop){try{phaseStop()}catch(e){}phaseStop=null}}

/* ---------- styles ---------- */
const st=document.createElement('style');
st.textContent=`
#rest{background:var(--bg);z-index:80;padding:0}
#rest>.sheet{background:transparent;box-shadow:none;max-width:560px;height:100%;max-height:100%;padding:16px;justify-content:center;gap:12px}
#gateMount{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;width:100%;flex:1;min-height:0}
.g-toto{width:min(52vw,230px);max-height:34vh;flex:none}.g-toto svg{width:100%;height:100%;display:block;overflow:visible}
.g-big{border:0;border-radius:999px;min-width:220px;min-height:150px;padding:18px 28px;background:${PAL.butter||'#F0D58A'};color:${PAL.ink||'#5B4A42'};font-size:22px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 6px 0 rgba(91,58,41,.16),0 10px 18px rgba(91,58,41,.12)}
.g-big svg{width:72px;height:72px}
.g-big:active{transform:translateY(2px)}
.g-miss{width:100%;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.g-miss canvas{width:100%;flex:1;min-height:0;touch-action:none;background:${PAL.surface||'#FFFDF9'};border-radius:36px;box-shadow:0 6px 0 rgba(91,58,41,.1)}
.g-hand{position:absolute;width:72px;height:88px;pointer-events:none;z-index:2;filter:drop-shadow(0 4px 4px rgba(91,58,41,.2))}
.g-cards{display:flex;flex-direction:column;gap:14px;width:100%;flex:1;min-height:0;justify-content:center}
.g-card{border:0;border-radius:36px;background:${PAL.surface||'#FFFDF9'};flex:1;min-height:150px;max-height:260px;display:grid;place-items:center;padding:8px;position:relative;box-shadow:0 6px 0 rgba(91,58,41,.1)}
.g-card svg{height:100%;max-height:220px;width:auto;display:block;overflow:visible}
.g-card.got{background:${(COL[3]&&COL[3].light)||'#F7E8B8'}}
.g-card .g-tick{position:absolute;right:16px;top:12px;width:44px;height:44px;opacity:0;transition:opacity .4s}
.g-card.got .g-tick{opacity:1}
.g-pc{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}
.g-pc h3{margin:0;font-weight:400;font-size:22px;color:${PAL.ink||'#5B4A42'}}
.g-pc .hint{text-align:center}
.g-top{display:flex;align-items:center;justify-content:center;gap:14px}
.g-dots{display:flex;gap:12px}.g-dots i{width:26px;height:26px;border-radius:50%;background:rgba(91,58,41,.14);display:block;transition:background .2s}
.g-dots i.on{background:${(COL[0]&&COL[0].hex)||'#E89AAE'}}
.g-pad{display:grid;grid-template-columns:repeat(3,minmax(0,110px));gap:8px;justify-content:center}
.g-pad button,.g-ico{border:0;border-radius:26px;min-height:78px;font-size:34px;background:${PAL.surface||'#FFFDF9'};color:${PAL.ink||'#5B4A42'};box-shadow:0 4px 0 rgba(91,58,41,.14);display:grid;place-items:center;padding:0}
.g-pad button:active,.g-ico:active{transform:translateY(2px)}
.g-ico{width:78px;min-height:64px;border-radius:22px}.g-ico svg{width:36px;height:36px}
.g-hold{position:relative;overflow:hidden;border:0;border-radius:999px;min-height:72px;min-width:260px;padding:14px 22px;font-size:18px;color:${PAL.ink||'#5B4A42'};background:${PAL.sage||'#A9CFA0'};opacity:.55;box-shadow:0 0 0 3px ${PAL.ink||'#5B4A42'}}
.g-hold.ready{opacity:1}
.g-hold::before{content:"";position:absolute;inset:0;width:calc(var(--p,0)*100%);background:rgba(255,255,255,.55)}
.g-hold span{position:relative}
.g-shake{animation:g-shake .4s ease-in-out}
@keyframes g-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.g-choice{display:flex;flex-direction:column;gap:16px;align-items:center;width:100%}
.g-choice .btn{min-width:240px;min-height:84px;font-size:24px}
.g-end{display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;width:100%}
.g-end h3{margin:0;font-weight:400;font-size:26px}
.g-idea{background:${PAL.surface||'#FFFDF9'};border-radius:22px;padding:14px 16px;font-size:16px;line-height:1.6;width:100%;text-align:left}
.g-idea b{display:block;font-weight:400;color:var(--muted);font-size:14px;margin-bottom:4px}
#rest .vlist{width:100%;max-height:30vh;overflow:auto}
`;
document.head.appendChild(st);

/* ---------- pictures (drawn, no emoji) ---------- */
const svgAnimal=(kind,mood,opt)=>`<svg viewBox="0 0 200 230" role="img" aria-hidden="true">${window.ART?window.ART.animal(kind,mood||'happy',opt||{}):''}</svg>`;
const HEART=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 54C8 38 8 14 22 12c6-1 9 2 10 6 1-4 4-7 10-6 14 2 14 26-10 42Z" fill="${(COL[0]&&COL[0].hex)||'#E89AAE'}" stroke="#5B3A29" stroke-width="3" stroke-linejoin="round"/></svg>`;
const SPK=`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h8l10-8v26l-10-8H8z" fill="#5B4A42"/><path d="M32 17c4 4 4 10 0 14M37 12c7 7 7 17 0 24" stroke="#5B4A42" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`;
const BACK=`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 11h24v26H18L6 24z" fill="none" stroke="#5B4A42" stroke-width="3.5" stroke-linejoin="round"/><path d="M26 18l12 12M38 18L26 30" stroke="#5B4A42" stroke-width="3.5" stroke-linecap="round"/></svg>`;
const TICK=`<svg class="g-tick" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="${(COL[4]&&COL[4].hex)||'#8FC48A'}"/><path d="M13 25l8 8 14-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const HANDSVG=`<svg viewBox="0 0 72 88" aria-hidden="true"><path d="M30 6c5 0 8 3 8 8v26l5-3c4-2 8 1 7 5l-1 22c0 10-8 18-18 18-9 0-14-5-18-13l-8-17c-2-4 2-8 6-6l6 4V14c0-5 4-8 8-8z" fill="#FFF9F2" stroke="#5B3A29" stroke-width="3.5" stroke-linejoin="round"/></svg>`;

/* ---------- sino-Korean / English number words for the spoken parent check ---------- */
const KD=['','일','이','삼','사','오','육','칠','팔','구'];
const koNum=n=>{const t=Math.floor(n/10),o=n%10;return(t>1?KD[t]:'')+(t>0?'십':'')+KD[o]};
const EO=['','one','two','three','four','five','six','seven','eight','nine'],ET=['','ten','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'],ETN=['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const enNum=n=>{const t=Math.floor(n/10),o=n%10;return t===1?ETN[o]:ET[t]+(o?'-'+EO[o]:'')};
function newAnswer(){let n;do{n=10+Math.floor(Math.random()*90)}while(String(n)===answer);answer=String(n);return+answer}
function speakNumber(prefix){const n=+answer;say((prefix||'')+'어른 확인! '+koNum(n)+' 을 눌러 주세요.',(prefix?'Try again. ':'')+'Grown-up check! Press '+enNum(n)+'.')}

/* ---------- warning, counting ---------- */
const leadSec=s=>Math.min(60,s/3);   // 1 minute before the break (a third of the time when the interval is shortened for tests)
function addPlay(sec){
  const s=settings();since+=sec;D=day();D.sec+=sec;saveDay(D);
  if(!warned&&!shown&&since>=s.limitSec-leadSec(s.limitSec)&&since<s.limitSec){
    warned=true;const w=G.warnVoice||{};say(w.ko||'',w.en||'');
  }
  if(!pending&&(since>=s.limitSec||D.sec>=s.dailySec)){pending=true;pendingAt=Date.now()}
}
function counting(){
  if(!enabled()||document.hidden||shown)return false;
  if(M.current()==='home')return false;
  const se=$('#settings');if(se&&!se.hidden)return false;
  return true;
}
function tick(){
  const now=Date.now(),dt=Math.min(1000,Math.max(0,now-(lastTick||now)));lastTick=now;
  if(down.size&&now-lastActivity>8000)down.clear();   // a missed pointerup must not hold the break forever
  if(shown||!enabled())return;
  if(M.current()!=='home'&&!document.hidden&&D.ended){D=day();if(D.ended)pending=true}   // already said "all done" today
  if(counting())addPlay(dt/1000);
  if(pending&&!document.hidden&&!down.size&&now-lastActivity>350&&M.current()!=='home'){
    const se=$('#settings');if(!se||se.hidden)show();
  }
}
function startTick(){if(tickT)return;lastTick=Date.now();tickT=setInterval(tick,250)}
function stopTick(){clearInterval(tickT);tickT=0}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTick();down.clear();return}lastTick=Date.now();startTick()});
const act=()=>{lastActivity=Date.now()};
document.addEventListener('pointerdown',e=>{down.add(e.pointerId);act()},true);
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,e=>{down.delete(e.pointerId);act()},true));
document.addEventListener('pointermove',e=>{if(down.has(e.pointerId))act()},true);
window.addEventListener('blur',()=>down.clear());

/* a finger that is still down when a hold finishes must not 'click' whatever appears under it */
function swallowClicks(ms){const f=e=>{e.stopPropagation();e.preventDefault()};document.addEventListener('click',f,true);setTimeout(()=>document.removeEventListener('click',f,true),ms)}

/* ---------- the break screen ---------- */
const rest=$('#rest'),mount=$('#gateMount'),vlist=rest&&rest.querySelector('.vlist');
function lockPage(on){
  [...document.body.children].forEach(el=>{if(el===rest||el.tagName==='SCRIPT'||el.tagName==='STYLE'||el.id==='fx'||el.id==='toast')return;
    if(on){if(!el.hasAttribute('inert')){el.setAttribute('inert','');el.dataset.gateInert='1'}}else if(el.dataset.gateInert){el.removeAttribute('inert');delete el.dataset.gateInert}});
}
function show(){
  if(shown||!rest)return;
  shown=true;pending=false;D=day();const s=settings();
  try{if(document.activeElement)document.activeElement.blur()}catch(e){}
  lockPage(true);rest.hidden=false;try{M.BGM.stop()}catch(e){}
  try{M.bgmSync&&M.bgmSync()}catch(e){}
  if(D.ended){endScreen();return}
  restPhase();
}
function hide(){
  clearPhase();shown=false;phase='';entered='';rest.hidden=true;lockPage(false);mount.innerHTML='';
  if(vlist)vlist.style.display='none';
  try{document.dispatchEvent(new CustomEvent('visibilitychange'))}catch(e){}
  lastTick=Date.now();
}
function setPhase(p){clearPhase();phase=p;shownAt=Date.now();mount.innerHTML='';if(vlist)vlist.style.display='none'}
const locked=()=>Date.now()-shownAt<(TOUCH.tapLockMs||1200);

function restPhase(){
  setPhase('rest');
  mount.innerHTML=`<div class="g-toto" id="gToto">${svgAnimal('bunny','happy',{wave:true})}</div>
    <button class="g-big" id="gGo" aria-label="엄마랑 같이 해요">${HEART}<span>엄마랑 같이 해요</span></button>`;
  try{if(M.Alive){const a=M.Alive.attach(mount.querySelector('#gToto svg'),{kind:'bunny',follow:false});phaseStop=()=>{try{a.detach()}catch(e){}}}}catch(e){}
  const sc=G.screen&&G.screen.voice||{};say(sc.ko||'',sc.en||'');
  $('#gGo').onclick=()=>{if(locked())return;try{M.sfx.pop()}catch(e){}settings().mode==='mission_then_parent'?missionPhase():parentPhase()};
}

/* ---------- mission: trace_line or word_cards (alternate) ---------- */
function missionPhase(){
  const last=D.last;const t=last==='trace_line'?'word_cards':(last==='word_cards'?'trace_line':'trace_line');
  const types=(G.mission&&G.mission.types)||['trace_line','word_cards'];
  const type=types.includes(t)?t:types[0];D=day();D.last=type;saveDay(D);
  setPhase('mission');
  const done=()=>{phaseStop=null;try{M.sfx.ding()}catch(e){}const p=M.nextPraise?M.nextPraise():['잘했어!','Good job!'];say(p[0],p[1]);later(parentPhase,1400)};
  if(type==='trace_line')traceMission(done);else cardsMission(done);
}
function childLevel(){try{const P=M.Progress;const v=P&&P.level&&P.level('trace');return Math.max(1,Math.min(4,+v||1))}catch(e){return 1}}

function traceMission(onDone){
  mount.innerHTML=`<div class="g-miss" style="position:relative"><canvas id="gTr"></canvas></div>`;
  const wrap=mount.querySelector('.g-miss'),cv=$('#gTr'),g=cv.getContext('2d');
  const lvl=childLevel();
  const PW=TR.pathWidthRatio||.18,NEARR=PW*(1+(TR.countsWithinRatio||.4)),CREEP=TR.creepWhileTouchingPerSec==null?.05:TR.creepWhileTouchingPerSec,MAXSP=TR.maxSpeedPerSec||.35,TAP=TR.tapAlsoAdvances==null?.12:TR.tapAlsoAdvances,IDLE=TR.showHandAfterIdleMs||2000,FIN=TR.autoFinishAt||.9;
  let W=0,H=0,pts=[],prog=0,touching=false,fp=null,raf=0,lastT=0,idleSince=performance.now(),finishing=0,finished=false,dpr=1;
  const hand=document.createElement('div');hand.className='g-hand';hand.innerHTML=HANDSVG;hand.style.display='none';wrap.appendChild(hand);
  function build(){
    const r=cv.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;
    const N=160;pts=[];const m=Math.min(W,H);
    for(let i=0;i<=N;i++){const u=i/N;let x,y;
      if(lvl===1){x=W*(.22+.56*u);y=H*.5}
      else if(lvl===2){x=W*(.12+.76*u);y=H*(.7-.4*u)}
      else if(lvl===3){x=W*(.12+.76*u);y=H*.5+Math.sin(u*Math.PI*2)*H*.12}
      else{const a=-Math.PI/2+u*Math.PI*2;x=W/2+Math.cos(a)*m*.3;y=H/2+Math.sin(a)*m*.3}
      pts.push([x,y])}
  }
  const pw=()=>Math.min(W,H)*(lvl===4?PW*1.0:PW)*(W<H?1:1);
  const at=u=>{const f=Math.max(0,Math.min(1,u))*(pts.length-1),i=Math.floor(f),j=Math.min(pts.length-1,i+1),k=f-i;return[pts[i][0]+(pts[j][0]-pts[i][0])*k,pts[i][1]+(pts[j][1]-pts[i][1])*k]};
  function nearest(x,y,a,b){let best=1e9,bi=0;const lo=Math.max(0,Math.floor(a*(pts.length-1))),hi=Math.min(pts.length-1,Math.ceil(b*(pts.length-1)));
    for(let i=lo;i<=hi;i++){const d=Math.hypot(pts[i][0]-x,pts[i][1]-y);if(d<best){best=d;bi=i}}return{d:best,u:bi/(pts.length-1)}}
  const nearPx=()=>Math.min(W,H)*NEARR;
  function draw(){
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);g.lineCap='round';g.lineJoin='round';
    const w=pw();const path=(a,b)=>{g.beginPath();for(let i=0;i<=80;i++){const p=at(a+(b-a)*i/80);i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])}};
    g.lineWidth=w;g.strokeStyle=(COL[3]&&COL[3].light)||'#F7E8B8';path(0,1);g.stroke();
    if(prog>0.002){g.strokeStyle=(COL[4]&&COL[4].vivid)||'#5CC76B';g.lineWidth=w*.82;path(0,prog);g.stroke()}
    const s=at(0);g.fillStyle=PAL.sage||'#A9CFA0';g.beginPath();g.arc(s[0],s[1],w*.34,0,7);g.fill();
    const e=at(1);g.fillStyle=PAL.rose||'#E8A0AE';g.beginPath();g.arc(e[0],e[1],w*.34,0,7);g.fill();
    const c=at(prog);g.fillStyle='rgba(255,255,255,.9)';g.strokeStyle='#5B3A29';g.lineWidth=3;g.beginPath();g.arc(c[0],c[1],w*.3,0,7);g.fill();g.stroke();
  }
  function frame(t){
    raf=0;if(document.hidden||finished)return;
    const dt=Math.min(.1,(t-(lastT||t))/1000);lastT=t;
    if(touching&&!finishing){prog=Math.min(1,prog+CREEP*dt);if(fp){const n=nearest(fp[0],fp[1],prog-.3,prog+.45);if(n.d<=nearPx()&&n.u>prog)prog=Math.min(n.u,prog+MAXSP*dt)}}
    if(!finishing&&prog>=FIN){finishing=1}
    if(finishing){prog=Math.min(1,prog+.9*dt);if(prog>=1){finished=true;draw();hand.style.display='none';onDone();return}}
    /* the guide hand shows the next stretch after a pause */
    const idle=!touching&&performance.now()-idleSince>IDLE;
    if(idle&&!finishing){const cyc=(performance.now()%1800)/1800,p=at(prog+Math.min(.2,1-prog)*cyc);hand.style.display='block';hand.style.left=(p[0]-14)+'px';hand.style.top=(p[1]-8)+'px'}else hand.style.display='none';
    draw();raf=requestAnimationFrame(frame);
  }
  const kick=()=>{if(!raf&&!finished)raf=requestAnimationFrame(frame)};
  const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
    fp=pos(e);idleSince=performance.now();const n=nearest(fp[0],fp[1],0,1);touching=n.d<=nearPx();
    if(touching&&!finishing)prog=Math.min(1,prog+TAP);kick()});
  cv.addEventListener('pointermove',e=>{if(!fp)return;fp=pos(e);idleSince=performance.now();const n=nearest(fp[0],fp[1],0,1);touching=n.d<=nearPx()});
  const up=()=>{fp=null;touching=false;idleSince=performance.now()};
  ['pointerup','pointercancel','pointerleave'].forEach(t=>cv.addEventListener(t,up));
  const onVis=()=>{if(!document.hidden){lastT=0;kick()}};document.addEventListener('visibilitychange',onVis);
  const onRes=()=>{build();draw()};window.addEventListener('resize',onRes);
  phaseStop=()=>{cancelAnimationFrame(raf);raf=0;finished=true;document.removeEventListener('visibilitychange',onVis);window.removeEventListener('resize',onRes)};
  build();draw();kick();say('쓱~ 길을 따라가 봐!','Follow the path!');
  M.Gate.__trace=()=>({prog,lvl,touching,finished,W,H,path:pts.length?[at(0),at(1),at(.5)]:null});
}

function cardsMission(onDone){
  const names=((CFG.voice&&CFG.voice.animalNames)||[{id:'bunny',ko:'토끼',en:'bunny'},{id:'bear',ko:'곰',en:'bear'}]).slice();
  for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
  const two=names.slice(0,2),got=new Set();
  mount.innerHTML=`<div class="g-cards">${two.map((a,i)=>`<button class="g-card" data-i="${i}" aria-label="${a.ko}">${svgAnimal(a.id,'happy')}${TICK}</button>`).join('')}</div>`;
  const als=[];try{if(M.Alive)mount.querySelectorAll('.g-card svg:not(.g-tick)').forEach((el,i)=>als.push(M.Alive.attach(el,{kind:two[i].id,follow:false})))}catch(e){}
  phaseStop=()=>als.forEach(a=>{try{a.detach()}catch(e){}});
  mount.querySelectorAll('.g-card').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i,a=two[i];try{M.sfx.pop()}catch(e){}say(a.ko+'!',a.en+'!');
    if(!got.has(i)){got.add(i);b.classList.add('got')}
    if(got.size===2&&!b._done){mount.querySelectorAll('.g-card').forEach(x=>x._done=1);later(onDone,1500)}
  });
  say('그림을 콕 눌러 봐!','Tap the pictures!');
}

/* ---------- parent check: a spoken number, buttons 0-9, then hold 2 seconds ---------- */
const holdMs=()=>{const m=String((G.parentCheck&&G.parentCheck.type)||'').match(/(\d+)\s*초/);return(m?+m[1]:2)*1000};
function parentPhase(){
  setPhase('parent');entered='';newAnswer();
  mount.innerHTML=`<div class="g-pc">
    <h3>어른 확인</h3><p class="hint">말로 불러 주는 숫자를 눌러 주세요. 다 누르면 아래 버튼을 2초 동안 꾹 누릅니다.</p>
    <div class="g-top"><button class="g-ico" id="gHear" aria-label="다시 듣기">${SPK}</button><div class="g-dots" id="gDots"><i></i><i></i></div><button class="g-ico" id="gDel" aria-label="지우기">${BACK}</button></div>
    <div class="g-pad" id="gPad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')}<span></span><button data-n="0">0</button><span></span></div>
    <button class="g-hold" id="gHold"><span>어른이 2초 꾹 누르면 확인</span></button></div>`;
  const dots=[...mount.querySelectorAll('#gDots i')],hb=$('#gHold');
  const sync=()=>{dots.forEach((d,i)=>d.classList.toggle('on',i<entered.length));hb.classList.toggle('ready',entered.length===2)};
  $('#gPad').addEventListener('click',e=>{const b=e.target.closest('button[data-n]');if(!b||entered.length>=2)return;entered+=b.dataset.n;try{M.sfx.pop()}catch(_){}sync()});
  $('#gDel').onclick=()=>{entered=entered.slice(0,-1);sync()};
  $('#gHear').onclick=()=>speakNumber();
  /* hold: only counts when two digits are in, and the finger must stay down for the whole time */
  let raf=0,t0=0;const stop=()=>{cancelAnimationFrame(raf);raf=0;hb.style.setProperty('--p',0)};
  hb.addEventListener('pointerdown',e=>{e.preventDefault();if(entered.length!==2||raf)return;t0=performance.now();
    const step=()=>{const p=Math.min(1,(performance.now()-t0)/holdMs());hb.style.setProperty('--p',p);
      if(p>=1){stop();check()}else raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>hb.addEventListener(t,stop));
  hb.addEventListener('contextmenu',e=>e.preventDefault());
  const prevStop=phaseStop;phaseStop=()=>{stop();if(prevStop)prevStop()};
  function check(){
    if(entered===answer){swallowClicks(900);choicePhase();return}
    entered='';sync();const box=mount.querySelector('.g-pc');box.classList.remove('g-shake');void box.offsetWidth;box.classList.add('g-shake');
    newAnswer();speakNumber('다시 한 번! ');
  }
  later(()=>speakNumber(),400);
}

/* ---------- more play / all done ---------- */
function choicePhase(){
  setPhase('choice');const s=settings();D=day();const capped=D.sec>=s.dailySec;
  mount.innerHTML=`<div class="g-choice"><div class="g-toto" style="width:min(38vw,170px)">${svgAnimal('bunny','happy')}</div>
    ${capped?'':`<button class="btn" id="gMore">더 놀기 (${s.interval}분)</button>`}<button class="btn alt" id="gEnd">오늘은 끝</button></div>`;
  try{if(M.Alive){const a=M.Alive.attach(mount.querySelector('.g-toto svg'),{kind:'bunny',follow:false});phaseStop=()=>{try{a.detach()}catch(e){}}}}catch(e){}
  const more=$('#gMore');if(more)more.onclick=()=>{if(locked())return;since=0;warned=false;pending=false;hide();say('다시 놀자!','Let\'s play!')};
  $('#gEnd').onclick=()=>{if(locked())return;D=day();D.ended=true;saveDay(D);endScreen()};
}
const IDEAS=['진짜 수건으로 인형 말려 주기','베란다에서 함께 구름 모양 찾기','숟가락과 냄비로 천천히 박수 리듬 놀이','엄마 아빠와 동요를 부르며 손유희 하기'];
function offlineIdea(){
  const m=String(G.offlineIdea||'').match(/예:\s*([^)]+)\)/),first=m?m[1].trim():IDEAS[0];
  const list=[first].concat(IDEAS.filter(x=>x!==first));
  return list[(new Date().getDate())%list.length];
}
function endScreen(){
  setPhase('end');
  const a=G.afterMax||{};
  mount.innerHTML=`<div class="g-end"><div class="g-toto" style="width:min(38vw,170px)">${svgAnimal('bunny','sleepy')}</div>
    <h3>${a.ko||'오늘 놀이는 끝!'}</h3>
    <div class="g-idea"><b>화면 밖 놀이, 어른께 제안해요</b>${offlineIdea()}</div>
    <button class="pillhold holdbtn" id="gHome" style="position:relative;overflow:hidden"><span style="position:relative">어른: 홈으로 (꾹 2초)</span></button></div>`;
  try{if(M.Alive){const al=M.Alive.attach(mount.querySelector('.g-toto svg'),{kind:'bunny',follow:false});phaseStop=()=>{try{al.detach()}catch(e){}}}}catch(e){}
  if(vlist){vlist.style.display='';mount.appendChild(vlist)}
  say(a.ko||'',a.en||'');
  M.hold($('#gHome'),2000,()=>{swallowClicks(900);hide();M.go('home')});
}

/* ---------- parent settings rows ---------- */
function buildRows(){
  const host=$('#gateRows');if(!host)return;
  const s=settings();
  const seg=(id,label,items,cur)=>`<div class="row"><span>${label}</span><div class="seg" id="${id}">${items.map(([v,t])=>`<button data-v="${v}" class="${String(v)===String(cur)?'on':''}">${t}</button>`).join('')}</div></div>`;
  host.innerHTML=seg('gInterval','허락 시간 (이만큼 놀면 쉬어요)',OPTS.map(v=>[v,v+'분']),s.interval)
    +seg('gMode','쉬는 시간에',Object.keys(MODES).map(k=>[k,MODES[k]]),s.mode)
    +seg('gDaily','하루 합계',DAILY_OPTS.map(v=>[v,v+'분']),s.dailyMax);
  const on=(id,fn)=>$('#'+id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;fn(b.dataset.v);buildRows()});
  on('gInterval',v=>{const n=+v;saveSet({interval:n,testSec:0});M.S.timer=n;M.store.set('mallang_settings',M.S);since=0;warned=false;pending=false});
  on('gMode',v=>saveSet({mode:v}));
  on('gDaily',v=>{saveSet({dailyMax:+v,testDailySec:0})});
}
buildRows();

M.Gate={
  __state:()=>({shown,phase,since,warned,pending,daySec:day().sec,ended:day().ended,answer,entered,limitSec:settings().limitSec,dailySec:settings().dailySec,interval:settings().interval,mode:settings().mode,counting:counting(),down:down.size}),
  __advance:sec=>addPlay(sec),
  __reset(){since=0;warned=false;pending=false;D={d:todayStr(),sec:0,ended:false,last:''};saveDay(D)},
  settings
};
startTick();
})();
