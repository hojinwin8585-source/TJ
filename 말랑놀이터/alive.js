/* 말랑 놀이터 · 살아 있는 캐릭터 (P12 12-가)
   ML.Alive.attach(el,{kind,waiting,follow}) → 캐릭터 그림(art.js의 al-* 묶음)을 느리고 작게, 끊임없이 움직입니다.
   - 늘 하는 움직임(idle): 숨쉬기 · 머리 갸웃 · 귀/꼬리 살랑 = CSS 애니메이션(주기는 캐릭터마다 조금씩 다름)
                         깜빡임 · 둘러보기 = 캐릭터마다 타이머 하나씩
   - 손가락 따라보기: 화면에 손가락이 닿아 있는 동안 모든 캐릭터가 함께 쓰는 requestAnimationFrame 하나
   - setMood(name) 표정 · setTool(name|null,{side,wind}) 도구를 쓰는 동안 · play(name) 큰 동작(한 번에 하나) · sound(name) 짧은 소리
   - 화면이 숨겨지면 멈추고, detach()와 화면을 떠날 때(L.onEnd) 모든 타이머를 지웁니다.
   숫자는 MLCFG.calm.characterLife (idle 문장 속 숫자, followFinger, limits) 에서 읽습니다. */
(()=>{
'use strict';
const M=window.ML;if(!M)return;
const CL=((M.CFG||{}).calm||{}).characterLife||{},IDLE=CL.idle||{};
const LIM=Object.assign({minCycleMs:600,maxRotateDeg:8,maxMovePx:14,noFlashing:true,onlyOneBigMomentAtATime:true},CL.limits||{});
/* the idle values are written as sentences ("3~5초마다 … (0.15초)"): take the n-th number, or the fallback */
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const MIN=LIM.minCycleMs;
const C={
  breatheMs:Math.max(MIN,num(IDLE.breathe,0,3)*1000),breatheScale:num(IDLE.breathe,2,1.025),
  blinkMin:num(IDLE.blink,0,3)*1000,blinkMax:num(IDLE.blink,1,5)*1000,blinkMs:num(IDLE.blink,2,.15)*1000,
  earMin:Math.max(MIN,num(IDLE.earsTail,0,4)*1000),earMax:Math.max(MIN,num(IDLE.earsTail,1,6)*1000),
  swayMs:Math.max(MIN,num(IDLE.sway,0,5)*1000),swayDeg:Math.min(LIM.maxRotateDeg,num(IDLE.sway,1,2)),
  lookMin:num(IDLE.lookAround,0,6)*1000,lookMax:num(IDLE.lookAround,1,9)*1000,
  followPx:Math.min(LIM.maxMovePx,num(CL.followFinger,0,6)),followDeg:Math.min(LIM.maxRotateDeg,num(CL.followFinger,1,3))
};
const REDUCED=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const R=LIM.maxRotateDeg;

/* ---------------- styles ----------------
   parts: .al-root (big moves) > .al-breathe > .al-head (idle sway) > .al-head-s (state: gaze, mood, tool via CSS variables)
   every repeating motion here is ≥ minCycleMs per cycle; nothing flashes. */
const css=`
.alive .al-root,.alive .al-breathe,.alive .al-head,.alive .al-head-s,.alive .al-ear,.alive .al-ear-s,.alive .al-tail,.alive .al-tail-s,.alive .al-arm,.alive .al-arm-s,.alive .al-foot,.alive .al-eye,.alive .al-pupil,.alive .al-mouth{transform-box:fill-box;transform-origin:50% 50%}
.alive .ani .eyes,.alive .wave{animation:none}
.alive .al-breathe{animation:al-breathe var(--al-br,3s) ease-in-out var(--al-off,0s) infinite}
@keyframes al-breathe{0%,100%{transform:scale(1)}50%{transform:scale(var(--al-bs,1.025))}}
.alive .al-head{animation:al-sway var(--al-sw,5s) ease-in-out var(--al-off,0s) infinite}
@keyframes al-sway{0%,100%{transform:rotate(calc(var(--al-swa,2deg) * -1))}50%{transform:rotate(var(--al-swa,2deg))}}
.alive .al-ear-l{--al-esign:-1;animation:al-flick var(--al-ef1,4.6s) ease-in-out var(--al-off,0s) infinite}
.alive .al-ear-r{--al-esign:1;animation:al-flick var(--al-ef2,5.6s) ease-in-out var(--al-off,0s) infinite}
@keyframes al-flick{0%,80%,100%{transform:rotate(0)}87%{transform:rotate(calc(var(--al-esign) * ${R}deg))}94%{transform:rotate(calc(var(--al-esign) * -3deg))}}
.alive .al-tail{animation:al-wag var(--al-tf,5s) ease-in-out var(--al-off,0s) infinite}
@keyframes al-wag{0%,84%,100%{transform:rotate(0)}92%{transform:rotate(28deg)}}
.alive.al-k-dog .al-tail{animation-name:al-wag-dog}
@keyframes al-wag-dog{0%,64%,100%{transform:rotate(0)}70%{transform:rotate(30deg)}76%{transform:rotate(4deg)}82%{transform:rotate(30deg)}88%{transform:rotate(4deg)}94%{transform:rotate(26deg)}}
.alive.al-k-cat .al-tail{animation-name:al-wag-cat}
@keyframes al-wag-cat{0%,100%{transform:rotate(0)}50%{transform:rotate(24deg)}}
.alive.al-wait .al-foot-l{animation:al-swing 1.6s ease-in-out infinite}
.alive.al-wait .al-foot-r{animation:al-swing 1.6s ease-in-out -.8s infinite}
@keyframes al-swing{0%,100%{transform:rotate(-${R}deg)}50%{transform:rotate(${R}deg)}}
/* state */
.alive .al-head-s{transition:transform .3s ease-out;transform:translate(calc(var(--al-hx,0px) + var(--al-mhx,0px) + var(--al-thx,0px)),calc(var(--al-hy,0px) + var(--al-mhy,0px) + var(--al-thy,0px))) rotate(clamp(-${R}deg,calc(var(--al-hr,0deg) + var(--al-mhr,0deg) + var(--al-thr,0deg)),${R}deg))}
.alive .al-pupil{transition:transform .25s ease-out;transform:translate(clamp(-5px,calc(var(--al-px,0px) + var(--al-tpx,0px)),5px),clamp(-4px,calc(var(--al-py,0px) + var(--al-tpy,0px)),4px))}
.alive .al-eye{transition:transform .3s ease-out;transform:scale(var(--al-esx,1),var(--al-esy,1))}
.alive .al-ear-s{transition:transform .3s ease-out;transform:rotate(calc((var(--al-me,0) + var(--al-te,0)) * var(--al-esign,1) * 1deg + var(--al-ew,0deg)))}
.alive .al-mouth,.alive .al-mouth-o,.alive .al-brows{transition:opacity .3s ease-out}
.alive .al-lid{transition:opacity .1s}
.alive.al-blink .al-eye.al-open{--al-esy:.1;transition-duration:.07s}
.alive.al-blink .al-lid{opacity:1}
/* moods (0.3 s to change): 시무룩 · 간질간질 · 부르르 · 활짝 · 우와 */
.alive.al-m-sad{--al-me:${R};--al-mhy:3px;--al-mhr:-2deg}
.alive.al-m-sad .al-brows{opacity:1}
.alive.al-m-ticklish .al-arm{animation:al-shrug 1.6s ease-in-out infinite}
@keyframes al-shrug{0%,60%,100%{transform:translateY(0)}80%{transform:translateY(-5px)}}
.alive.al-m-shiver .al-root{animation:al-shiver .8s ease-in-out infinite}
@keyframes al-shiver{0%,100%{transform:translateX(-1.5px) rotate(-1.5deg)}50%{transform:translateX(1.5px) rotate(1.5deg)}}
.alive.al-m-shiver{--al-me:4}
.alive.al-m-happy{--al-me:-4;--al-mhy:-2px}
.alive.al-m-happy .al-root{animation:al-bob 1.6s ease-in-out infinite}
@keyframes al-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.alive.al-m-wow{--al-esx:1.1;--al-esy:1.1;--al-mhy:-2px}
/* while a tool is used */
.alive.al-t-sponge .al-arm{animation:al-shrug .9s ease-in-out infinite}
.alive.al-t-sponge .al-head{animation:al-wobble 1.2s ease-in-out infinite}
@keyframes al-wobble{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.alive.al-t-sponge.al-side-l .al-eye-l.al-open,.alive.al-t-sponge.al-side-r .al-eye-r.al-open{--al-esy:.1}
.alive.al-t-sponge.al-side-l .al-lid-l,.alive.al-t-sponge.al-side-r .al-lid-r{opacity:1}
.alive.al-t-shower{--al-thy:-4px;--al-mhy:0px}
.alive.al-t-shower .al-eye.al-open{--al-esy:.1}
.alive.al-t-shower .al-lid{opacity:1}
.alive.al-t-shower .al-mouth{opacity:0}
.alive.al-t-shower .al-mouth-o{opacity:1}
.alive.al-t-shower.al-side-l .al-ear-l,.alive.al-t-shower.al-side-r .al-ear-r{--al-te:${R}}
.alive.al-t-dryer{--al-ew:calc(var(--al-wind,1) * ${R}deg);--al-me:0;--al-thy:-2px}
.alive.al-t-dryer .al-eye.al-open{--al-esy:.55}
.alive.al-t-dryer .al-ear{animation:al-flutter .8s ease-in-out infinite alternate}
@keyframes al-flutter{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
.alive.al-t-dryer .al-root{animation:none}
.alive.al-t-brush .al-eye.al-open{--al-esy:.1}
.alive.al-t-brush .al-lid{opacity:1}
.alive.al-t-brush.al-side-l{--al-thr:-6deg}.alive.al-t-brush.al-side-r{--al-thr:6deg}
.alive.al-t-nailBrush{--al-thy:3px;--al-tpy:3px}
.alive.al-t-nailBrush .al-eye.al-open{--al-esx:1.12;--al-esy:1.12}
.alive.al-t-lamp{--al-thy:3px;--al-tpy:3px;--al-tpx:-2px;--al-thr:-4deg}
.alive.al-t-lamp .al-eye.al-open{--al-esx:1.1;--al-esy:1.1}
.alive.al-t-lamp .al-foot-r{animation:al-tap 1.2s ease-in-out infinite}
@keyframes al-tap{0%,55%,100%{transform:rotate(0)}75%{transform:rotate(-${R}deg)}}
.alive.al-blink.al-t-nailBrush .al-eye.al-open,.alive.al-blink.al-t-lamp .al-eye.al-open,.alive.al-blink.al-m-wow .al-eye.al-open{--al-esy:.1}
/* big moments: one at a time (play) */
.alive.al-p-hop .al-root{animation:al-hop .6s ease-in-out var(--al-n,1)}
@keyframes al-hop{0%,100%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.04,.96)}50%{transform:translateY(var(--al-jump,-12px)) scale(.98,1.03)}85%{transform:translateY(0) scale(1.03,.97)}}
.alive.al-pw .al-arm-r,.alive.al-p-wave .al-arm-r{animation:al-wave 1.8s ease-in-out}
@keyframes al-wave{0%,100%{transform:rotate(0)}20%{transform:rotate(-100deg)}37%{transform:rotate(-80deg)}53%{transform:rotate(-112deg)}70%{transform:rotate(-80deg)}85%{transform:rotate(-100deg)}}
.alive.al-p-wave .al-head{animation:al-lean 1.8s ease-in-out}
@keyframes al-lean{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(${R*.75}deg)}}
.alive.al-p-clap .al-root{animation:al-hop .6s ease-in-out}
.alive.al-p-clap .al-arm-l{animation:al-clap-l .6s ease-in-out .3s 3}
.alive.al-p-clap .al-arm-r{animation:al-clap-r .6s ease-in-out .3s 3}
@keyframes al-clap-l{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(-58deg)}}
@keyframes al-clap-r{0%,100%{transform:rotate(20deg)}50%{transform:rotate(58deg)}}
.alive.al-p-twirl .al-root{animation:al-twirl 1.2s ease-in-out}
@keyframes al-twirl{0%,100%{transform:scaleX(1)}25%{transform:scaleX(.05) translateY(-4px)}50%{transform:scaleX(-1) translateY(-6px)}75%{transform:scaleX(.05) translateY(-4px)}}
.alive.al-p-dance .al-root{animation:al-dance 1.2s ease-in-out 2}
@keyframes al-dance{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(calc(var(--al-mv,8px) * -1)) rotate(-6deg) translateY(-3px)}50%{transform:translateX(0) rotate(0)}75%{transform:translateX(var(--al-mv,8px)) rotate(6deg) translateY(-3px)}}
.alive.al-p-dance .al-arm-l{animation:al-clap-l 1.2s ease-in-out 2}
.alive.al-p-dance .al-arm-r{animation:al-clap-r 1.2s ease-in-out .6s 2}
.alive.al-p-shiver .al-root{animation:al-shake .6s ease-in-out 2}
@keyframes al-shake{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(calc(var(--al-mv,8px) * -.6)) rotate(-4deg)}75%{transform:translateX(calc(var(--al-mv,8px) * .6)) rotate(4deg)}}
.alive.al-p-sneeze .al-root{animation:al-sneeze .6s ease-out}
@keyframes al-sneeze{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(3px) scale(1.03,.96)}55%{transform:translateY(-8px) scale(1)}}
.alive.al-p-peekMirror .al-head{animation:al-peek 1.2s ease-in-out}
@keyframes al-peek{0%,100%{transform:rotate(0)}30%,75%{transform:translate(-5px,-4px) rotate(-${R*.75}deg)}}
.alive.al-p-peekMirror .al-root{animation:al-twirl 1.2s ease-in-out 1.2s}
.alive.al-p-oops .al-arm-r{animation:al-touch 1.4s ease-in-out}
@keyframes al-touch{0%,100%{transform:rotate(0)}30%,75%{transform:rotate(-125deg)}}
.alive.al-p-oops .al-head{animation:al-tilt 1.4s ease-in-out}
@keyframes al-tilt{0%,100%{transform:rotate(0)}30%,75%{transform:rotate(${R}deg)}}
.alive.al-p-oops{--al-esx:1.1;--al-esy:1.1}
/* page hidden: everything stops */
.alive.al-paused *{animation-play-state:paused!important}
/* reduced motion: only breathing and blinking (overrides the global reduced-motion rule) */
.alive.al-reduced *:not(.al-breathe){animation:none!important}
@media (prefers-reduced-motion:reduce){
  .alive .al-breathe{animation:al-breathe var(--al-br,3s) ease-in-out infinite!important}
  .alive.al-blink .al-eye.al-open{transition-duration:.07s!important}
}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ---------------- timers (all tracked, so leaving a screen can leave zero behind) ---------------- */
const TIMERS=new Set();
function later(fn,ms){const h=setTimeout(()=>{TIMERS.delete(h);fn()},Math.max(0,ms));TIMERS.add(h);return h}
function clear(h){if(h){clearTimeout(h);TIMERS.delete(h)}}
const rnd=(a,b)=>a+Math.random()*(b-a);
const list=[];          // attached characters
const LOG=[];           // big moments: {who,name,t0,t1}
let uid=0,hidden=document.hidden;

/* ---------------- short voice sounds (WebAudio): 키득 · 아~ · 히히 · 우와 · 에취 ---------------- */
/* a soft voice-like tone: a buzzy source through two vowel filters (formants) */
function vowel(a,t,dur,f0,f1,F,vol){
  const o=a.createOscillator(),g=a.createGain(),out=a.createGain();o.type='sawtooth';
  o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
  F.forEach(([fq,q,v,fq2])=>{const b=a.createBiquadFilter();b.type='bandpass';b.frequency.setValueAtTime(fq,t);if(fq2)b.frequency.linearRampToValueAtTime(fq2,t+dur);b.Q.value=q;const gg=a.createGain();gg.gain.value=v;o.connect(b);b.connect(gg);gg.connect(g)});
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.05,dur*.3));g.gain.setValueAtTime(vol,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  g.connect(out);out.connect(a.destination);o.start(t);o.stop(t+dur+.05);
}
const I=[[300,6,1],[2300,10,.7]],A=[[800,5,1],[1200,7,.6]];   // vowel formants: 'i', 'a'
function sound(name){
  const a=M.actx&&M.actx();if(!a||!M.S||!M.S.sound)return false;const t=a.currentTime+.01,v=.09;
  if(name==='giggle')[0,1,2].forEach(k=>vowel(a,t+k*.13,.09,560+k*40,600+k*40,I,v));
  else if(name==='hehe')[0,1].forEach(k=>vowel(a,t+k*.2,.14,470,430,I,v));
  else if(name==='aah')vowel(a,t,.8,330,280,A,v*.9);
  else if(name==='wow')vowel(a,t,.65,290,400,[[330,6,1,800],[800,8,.5,1200]],v);
  else if(name==='achoo'){vowel(a,t,.16,420,520,A,v*.8);vowel(a,t+.2,.22,600,380,[[2600,2,1],[4200,3,.6]],v*.6)}
  else return false;
  return true;
}

/* ---------------- one character ---------------- */
const MOODS=['sad','ticklish','shiver','happy','wow'],TOOLS=['sponge','shower','dryer','brush','nailBrush','lamp'];
const PLAYS={hop:600,clap:2100,twirl:1200,dance:2400,wave:1800,shiver:1200,peekMirror:2400,sneeze:600,oops:1400};
function attach(el,o={}){
  if(!el)return null;if(el.__alive)el.__alive.detach();
  const kind=o.kind||'bunny',id=++uid;
  const me={id,el,kind,mood:'',tool:null,play:null,queued:null,blinks:0,looks:0,t0:performance.now(),pausedAt:0,tm:{},dead:false,follow:o.follow!==false&&!REDUCED,gaze:[0,0,0,0]};
  el.classList.add('alive','al-k-'+kind);if(o.waiting)el.classList.add('al-wait');if(REDUCED)el.classList.add('al-reduced');
  /* each character gets slightly different timings, and inside one character the cycles differ */
  const sv=(k,v)=>el.style.setProperty(k,v);
  sv('--al-br',Math.round(C.breatheMs*rnd(.9,1.12))+'ms');sv('--al-bs',String(C.breatheScale));
  sv('--al-sw',Math.round(C.swayMs*rnd(.9,1.15))+'ms');sv('--al-swa',C.swayDeg+'deg');
  const e1=rnd(C.earMin,C.earMax);let e2=rnd(C.earMin,C.earMax);if(Math.abs(e2-e1)<400)e2=e1+(e1<(C.earMin+C.earMax)/2?600:-600);
  sv('--al-ef1',Math.round(e1)+'ms');sv('--al-ef2',Math.round(e2)+'ms');sv('--al-tf',Math.round(rnd(C.earMin,C.earMax)*(kind==='cat'?1.3:1))+'ms');
  const scaleTo=()=>{const w=el.getBoundingClientRect().width;return w?200/w:1};   // svg units per screen px
  const lim=()=>{const u=scaleTo();sv('--al-jump',(-Math.min(12,LIM.maxMovePx*u)).toFixed(1)+'px');sv('--al-mv',Math.min(8,LIM.maxMovePx*u*.6).toFixed(1)+'px')};
  lim();
  const T=(k,fn,ms)=>{clear(me.tm[k]);me.tm[k]=later(()=>{delete me.tm[k];if(me.dead)return;if(!el.isConnected){h.detach();return}fn()},ms)};
  /* blink every 3~5 s (0.15 s), sometimes twice */
  const blink=()=>{
    el.classList.add('al-blink');me.blinks++;
    T('blinkOff',()=>{el.classList.remove('al-blink');if(Math.random()<.22)T('blink2',()=>{el.classList.add('al-blink');T('blinkOff',()=>el.classList.remove('al-blink'),C.blinkMs)},140)},C.blinkMs);
    T('blink',blink,rnd(C.blinkMin,C.blinkMax));
  };
  /* look aside every 6~9 s, then back */
  const look=()=>{
    if(!REDUCED&&!(P.down&&me.follow)&&!me.play){const s=Math.random()<.5?-1:1;me.looks++;setGaze(s*3.5,rnd(-1,1),s*1.5,0);T('lookBack',()=>{if(!(P.down&&me.follow))setGaze(0,0,0,0)},1300)}
    T('look',look,rnd(C.lookMin,C.lookMax));
  };
  function setGaze(px,py,hr,hx){
    const g=me.gaze;if(Math.abs(g[0]-px)<.05&&Math.abs(g[1]-py)<.05&&Math.abs(g[2]-hr)<.05&&Math.abs(g[3]-hx)<.05)return;me.gaze=[px,py,hr,hx];
    sv('--al-px',px.toFixed(2)+'px');sv('--al-py',py.toFixed(2)+'px');sv('--al-hr',hr.toFixed(2)+'deg');sv('--al-hx',hx.toFixed(2)+'px');
  }
  function schedule(){T('blink',blink,rnd(800,C.blinkMax));if(!REDUCED)T('look',look,rnd(C.lookMin*.5,C.lookMax))}
  function stopTimers(){Object.keys(me.tm).forEach(k=>clear(me.tm[k]));me.tm={}}
  let gigT=0;
  const h={
    get id(){return id},get el(){return el},
    /* call after the picture inside was redrawn (new SVG): keeps the idle motion in step instead of restarting it */
    refresh(){const off=-(performance.now()-me.t0);el.querySelectorAll('svg').forEach(s=>{if(!s.__al){s.__al=1;s.style.setProperty('--al-off',Math.round(off)+'ms')}})},
    setMood(name){name=MOODS.includes(name)?name:'';if(name===me.mood)return;if(me.mood)el.classList.remove('al-m-'+me.mood);me.mood=name;if(name)el.classList.add('al-m-'+name)},
    setTool(name,op={}){
      name=TOOLS.includes(name)?name:null;
      if(name!==me.tool){if(me.tool)el.classList.remove('al-t-'+me.tool);me.tool=name;if(name)el.classList.add('al-t-'+name);
        clear(gigT);gigT=0;
        if(name==='shower')sound('aah');
        if(name==='dryer')sound('hehe');
        if(name==='sponge'){const gg=()=>{gigT=later(()=>{if(me.dead||me.tool!=='sponge')return;sound('giggle');gg()},rnd(3500,5500))};gg()}
        if(!name){el.classList.remove('al-side-l','al-side-r');me.side='';me.wind=0}}
      if((op.side==='l'||op.side==='r')&&op.side!==me.side){me.side=op.side;el.classList.toggle('al-side-l',op.side==='l');el.classList.toggle('al-side-r',op.side==='r')}
      if(op.wind&&op.wind!==me.wind){me.wind=op.wind;sv('--al-wind',op.wind<0?'-1':'1')}
    },
    play(name,op={}){
      if(!PLAYS[name])return false;
      if(REDUCED){LOG.push({who:id,name,t0:performance.now(),t1:performance.now(),skipped:true});return false}
      if(me.play){me.queued={name,op};return 'queued'}
      lim();let dur=PLAYS[name];const cls=['al-p-'+name];
      if(name==='hop'){const n=Math.max(1,Math.min(3,op.n||1));sv('--al-n',String(n));dur=600*n;if(op.wave){cls.push('al-pw');dur=Math.max(dur,1800)}}
      const rec={who:id,name,t0:performance.now(),t1:0};LOG.push(rec);if(LOG.length>300)LOG.splice(0,LOG.length-300);me.play=rec;
      el.classList.remove(...Object.keys(PLAYS).map(k=>'al-p-'+k),'al-pw');void el.getBoundingClientRect();el.classList.add(...cls);
      if(op.sound)sound(op.sound);
      clear(me.tm.play);me.tm.play=later(()=>{delete me.tm.play;el.classList.remove(...cls);rec.t1=performance.now();me.play=null;
        if(me.dead)return;const q=me.queued;me.queued=null;if(q)h.play(q.name,q.op)},dur+40);
      return true;
    },
    sound,
    detach(){
      if(me.dead)return;me.dead=true;stopTimers();clear(gigT);if(me.play&&!me.play.t1)me.play.t1=performance.now();
      el.classList.remove('alive','al-k-'+kind,'al-wait','al-reduced','al-blink','al-paused','al-side-l','al-side-r','al-pw');
      [...el.classList].filter(c=>/^al-[mtp]-/.test(c)).forEach(c=>el.classList.remove(c));
      ['--al-br','--al-bs','--al-sw','--al-swa','--al-ef1','--al-ef2','--al-tf','--al-jump','--al-mv','--al-n','--al-px','--al-py','--al-hr','--al-hx','--al-wind'].forEach(k=>el.style.removeProperty(k));
      const i=list.indexOf(me);if(i>=0)list.splice(i,1);if(el.__alive===h)delete el.__alive;
    },
    state(){return{id,kind,mood:me.mood,tool:me.tool,play:me.play&&me.play.name,blinks:me.blinks,looks:me.looks,classes:[...el.classList].filter(c=>/^al-/.test(c)),gaze:me.gaze.slice()}},
    _pause(on){if(on){stopTimers();clear(gigT);el.classList.add('al-paused');me.pausedAt=performance.now();
        if(me.play){me.play.t1=performance.now();me.play=null;me.queued=null;[...el.classList].filter(c=>/^al-p-/.test(c)).forEach(c=>el.classList.remove(c));el.classList.remove('al-pw')}}else{el.classList.remove('al-paused');if(me.pausedAt){me.t0+=performance.now()-me.pausedAt;me.pausedAt=0}schedule()}},
    _gaze:setGaze,_me:me
  };
  el.__alive=h;list.push(me);me.h=h;h.refresh();
  if(hidden)h._pause(true);else schedule();
  return h;
}

/* ---------------- finger following: one shared requestAnimationFrame while a finger is down ---------------- */
const P={down:false,x:0,y:0};let raf=0;
function frame(){
  raf=0;if(!P.down||hidden)return;let any=false;
  list.forEach(me=>{if(!me.follow||me.dead||me.play)return;const r=me.el.getBoundingClientRect();if(!r.width||!r.height)return;any=true;
    const u=200/r.width,cx=r.left+r.width/2,cy=r.top+r.height*.43,nx=Math.max(-1,Math.min(1,(P.x-cx)/(r.width*.7))),ny=Math.max(-1,Math.min(1,(P.y-cy)/(r.height*.7)));
    const mp=Math.min(4.5,C.followPx*u);me.h._gaze(nx*mp,ny*mp*.8,nx*C.followDeg,nx*Math.min(2,C.followPx*u*.3))});
  if(any)raf=requestAnimationFrame(frame);
}
const kick=()=>{if(!raf&&P.down&&!hidden&&list.some(m=>m.follow))raf=requestAnimationFrame(frame)};
document.addEventListener('pointerdown',e=>{P.down=true;P.x=e.clientX;P.y=e.clientY;kick()},{capture:true,passive:true});
document.addEventListener('pointermove',e=>{if(!P.down)return;P.x=e.clientX;P.y=e.clientY;kick()},{capture:true,passive:true});
const up=()=>{if(!P.down)return;P.down=false;if(raf){cancelAnimationFrame(raf);raf=0}list.forEach(me=>{if(me.follow&&!me.dead)me.h._gaze(0,0,0,0)})};
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,up,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){if(raf){cancelAnimationFrame(raf);raf=0}P.down=false}list.slice().forEach(me=>me.h._pause(hidden));TURNS.forEach(x=>x._pause(hidden))});

/* ---------------- waiting customers: one at a time, in turn, waves 'pick me' ---------------- */
const TURNS=new Set();
function takeTurns(hs,o={}){
  let i=0,t=0;const every=o.every||3600;   // config has no number for this: one wave about every 3.6 s
  const go=()=>{clear(t);t=later(()=>{const live=hs.filter(x=>x&&x._me&&!x._me.dead&&x.el.isConnected);if(!live.length){me.stop();return}
    const x=live[i++%live.length];x.play(o.play||'wave');go()},every+rnd(-400,600))};
  const me={stop(){TURNS.delete(me);clear(t);t=0},_pause(on){clear(t);t=0;if(!on)go()}};
  TURNS.add(me);if(!hidden)go();
  return me;
}

M.Alive={attach,takeTurns,sound,LIMITS:LIM,CFG:C,log:LOG,
  stats(){return{instances:list.length,timers:TIMERS.size,raf:raf?1:0,following:P.down}},
  all(){return list.map(m=>m.h.state())}};
})();
