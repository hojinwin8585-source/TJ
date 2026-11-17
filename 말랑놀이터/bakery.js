/* 말랑 빵집 (P8-나) — 빵과 케이크를 한 가게로. 손님이 고른 주문대로 반죽부터 꾸미기까지.
   쇠규칙(MLCFG.rules): 글자 없음 · 다음 버튼 없음(과정이 끝나면 1.5초 이음 장면 뒤 저절로) · 만든 만큼 쓰기(만든 반죽 = 놓은 반죽 = 구운 빵 = 상자에 담은 빵, 썬 과일 = 올린 과일) ·
   세 구역(위 과정 그림 줄, 가운데 무대, 아래 도구 칸) · 이모지 없음(그림은 모두 여기서 직접 그림).
   단계: ML.Progress.get("bakery").level, 없으면 1단계 고정(ML.__bakeLevel). 시험용: ML.__bake(), ML.__bakeDepth().
   P18-나(motion.cooking): 가루는 봉지가 기울며 줄기로 쏟아지고 가루 구름 · 달걀은 톡톡 금 → 쩍 → 노른자 통, 출렁 · 새 거품기가 손가락을 따라 빙글빙글(반죽 소용돌이, 방울) ·
   치대기는 눌린 만큼 찌그러졌다 말랑하게 · 칼질에 조각이 톡 튀어 굴러감 · 오븐에서 부풀고 꺼내면 김 · 바르면 결이 남았다 퍼짐 · 손님이 두 손으로 받아 킁킁, 한 입, 볼 볼록.
   끌거나 문지르는 동작은 모두 콕으로도(motion.tapAlso: 콕 한 번 = 한 번). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,noise,sweepTone,SFX}=P;
const id='bakery',GID='bakery',L=life(id),OL=A.OL,S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`,S2=`stroke="${OL}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},GC=((CF.games||{})[GID])||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{},CC=(CF.calm||{}).choiceColors||[];
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);
const TAP_LOCK=TOUCH.tapLockMs||1200;
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const LV=GC.levels&&GC.levels.length?GC.levels:[{level:1,new:''}];
const LOG=[];
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  glint:`<svg viewBox="-20 -20 40 40"><path d="M0 -18Q2 -2 18 0Q2 2 0 18Q-2 2 -18 0Q-2 -2 0 -18Z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
};
const FACE=(cx,cy,s=1)=>`<g class="tf"><ellipse class="tf-eye" cx="${cx-9*s}" cy="${cy}" rx="${3*s}" ry="${4.4*s}" fill="${OL}"/><ellipse class="tf-eye" cx="${cx+9*s}" cy="${cy}" rx="${3*s}" ry="${4.4*s}" fill="${OL}"/><path class="tf-grin" d="M${cx-6*s} ${cy+8*s}Q${cx} ${cy+16*s} ${cx+6*s} ${cy+8*s}Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g>`;

/* ============================== screen: the three zones ============================== */
const kcss=`
#bakery{gap:6px}
#bakery .bk-head{flex:none;height:${HEAD_PX}px;gap:8px}
#bakery .bk-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#bakery .bk-back svg{width:100%;height:100%;display:block}
.bk-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.bk-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.bk-strip span svg{width:72%;height:72%;display:block}
.bk-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.bk-strip span.done{opacity:.9}
.bk-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.bk-strip span .st svg{width:100%;height:100%}
.bk-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC}
.bk-stage>div{position:absolute}
.bk-it{position:absolute;pointer-events:none;transition:left .5s ease-in-out,top .5s ease-in-out,width .5s ease-in-out,height .5s ease-in-out,opacity .35s,transform .3s}
.bk-it svg{width:100%;height:100%;display:block;overflow:visible}
.bk-it.hide{opacity:0;visibility:hidden}
.bk-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.bk-float{position:absolute;pointer-events:none;will-change:transform}
.bk-float svg{width:100%;height:100%;display:block;overflow:visible}
.bk-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.bk-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.bk-tool svg{width:100%;height:100%;display:block}
.bk-tool.in{animation:bkcard .3s ease-out both}
.bk-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:12px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.bk-card svg{width:100%;height:100%;display:block;pointer-events:none}
.bk-card.in{animation:bkcard .3s ease-out both}
.bk-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.bk-card.fade{opacity:.35}
@keyframes bkcard{from{transform:translateY(24px);opacity:0}}
@keyframes bksquish{0%{transform:scale(1)}35%{transform:scale(1.14,.82)}70%{transform:scale(.94,1.08)}100%{transform:scale(1)}}
@keyframes bknope{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.bk-squish{animation:bksquish .5s ease-out}
.bk-nope{animation:bknope .45s}
.bk-callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
`;
const kst=document.createElement('style');kst.textContent=kcss;document.head.appendChild(kst);
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar bk-head"><button class="round bk-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="bk-strip" id="bakeryStrip"></div></div><div class="bk-stage" id="bakeryStage"></div><div class="bk-tray" id="bakeryTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='빵집';
const $=s=>sec.querySelector(s);
const stage=$('#bakeryStage'),stripEl=$('#bakeryStrip'),tray=$('#bakeryTray');
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0,last:''},store.get('mallang_bakery',{}));
const save=()=>store.set('mallang_bakery',DATA);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LV.length,n))}

/* ---------- state ---------- */
let lv=null,plan=[],pi=0,S=null,al=null,H={},act=null,tool=null,gen=0,misses=0,lastMiss=0,busy=false,lastTap=0,phase='',kind='wait',AIM=null,custEl=null;
const killTool=()=>{if(tool){tool.destroy();tool=null}};
const stR=()=>stage.getBoundingClientRect();
const stXY=(cx,cy)=>{const s=stR();return[cx-s.left,cy-s.top]};
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
let raf=0;const rd=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(typeof draw==='function')draw()})};

function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  layout();
}
function miss(){misses++;G.nudge();if(custEl){custEl.classList.remove('bk-callme');void custEl.offsetWidth;custEl.classList.add('bk-callme');setTimeout(()=>custEl&&custEl.classList.remove('bk-callme'),700)}
  const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
stage.addEventListener('pointerdown',e=>{
  actx();if(!H.down)return;e.preventDefault();G.touch();
  const r=H.down(e);if(r===false){miss();return}
  if(H.move||H.up){try{stage.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId}
});
stage.addEventListener('pointermove',e=>{if(act===e.pointerId&&H.move)H.move(e)});
const endP=e=>{G.release();if(act!==e.pointerId)return;act=null;if(H.up)H.up(e)};
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,endP));
const alMood=(m,ms)=>{if(!al)return;al.setMood(m);if(ms){const g=gen;L.later(()=>{if(g===gen&&al)al.setMood('')},ms)}};
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};
const tapOk=()=>{const n=performance.now();if(n-lastTap<260)return false;lastTap=n;return true};
function toolTray(html){tray.innerHTML=`<div class="bk-tool in">${html}</div>`;return tray.querySelector('.bk-tool')}
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='bk-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-40}px) scale(${(1+k)/2})`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}
  catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);
}
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});
const spark=(x,y,n=3)=>{for(let k=0;k<n;k++){const g=document.createElement('div');g.className='bk-float';g.innerHTML=ICON.glint;const sz=22+rand(12);Object.assign(g.style,{width:sz+'px',height:sz+'px',left:(x-sz/2+rand(50)-25)+'px',top:(y-sz/2+rand(40)-20)+'px'});fxEl.appendChild(g);
  try{g.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1)',opacity:1,offset:.4},{transform:'scale(.5) translateY(-20px)',opacity:0}],{duration:1100,delay:k*120,fill:'forwards'})}catch(e){}setTimeout(()=>g.remove(),1500)}};
/* one tool step through ML.P2.makeTool: the tool follows the finger, only touched cells change, holding still also finishes */
function rubTool(o){
  killTool();
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,rub:o.rub,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[4,4],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,sound:o.hold?()=>P.holdSound(o.hold):null,
    tapAnim:TAP_MS,tilt:true,   // P18: motion.tapAlso + motion.toolFeel (play2.js options)
    onFrame:(F,t,W)=>{K.tick(t);if(o.frame&&F&&W)o.frame(F,t,W)},onTap:(F,W)=>{LOG.push('tap:'+o.log);if(o.tapFx&&F&&W)o.tapFx(F,W)},
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log);if(o.touch)o.touch()},onRelease:()=>{G.release();if(o.release)o.release()},
    onCell:(i,v)=>{o.cell(i,v);rd()},
    onProgress:(p,ratio,why)=>{if(o.progress)o.progress(p,ratio);if(!o.hold&&(why==='move'||why==='hold')){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  o.el=[...stage.querySelectorAll('.tl-tool')].pop();
  L.onEnd(killTool);
}
/* up to three picture cards in the tray; a choice has no wrong answer */
function cardsTray(items,onPick,ko,en){
  kind='cards';let lock=0;const ph=phase;
  tray.innerHTML=items.map((c,k)=>`<button class="bk-card in" data-i="${k}" aria-label="${c.label||''}" style="animation-delay:${k*60}ms">${c.svg}</button>`).join('');
  if(ko)say(ko,en,true);
  G.start({type:'tap',wait:true,at:()=>{const b=tray.querySelector('.bk-card');return b?stXY(...ctr(b)):[0,0]}});
  tray.onpointerdown=e=>{const b=e.target.closest('.bk-card');if(!b||phase!==ph||b.classList.contains('sel'))return;e.preventDefault();const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();
    b.classList.add('sel');tray.querySelectorAll('.bk-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();tray.onpointerdown=null;G.stop();kind='wait';AIM=null;LOG.push('pick:'+(items[+b.dataset.i].log||b.dataset.i));onPick(+b.dataset.i,b)};
}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5);
  stripEl.innerHTML=win.map(o=>`<span class="${o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function finish(between){
  H={};kind='wait';AIM=null;const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const k=plan[pi];if(!k)return;phase=k;strip();size();G.place();STEP[k]();
}
const fxEl=document.createElement('div');fxEl.className='bk-fx';stage.appendChild(fxEl);
/* ---------- P18-나 motion kit (the salon.js pattern copied here, not shared): particle pool, three beats, squash, the customer eating ----------
   motion.particles: at most max at once, each one gone within fadeMs, calm colours · motion.threeBeats: ready 0.15 s → act → after 0.4 s ·
   motion.squash · motion.performance: only CSS transform and opacity move; when frames get slow the particle cap halves first. */
function motionKit(host,pre){
  const MO=(M.CFG||{}).motion||{},PART=Object.assign({max:40,fadeMs:800},MO.particles||{}),BEAT={ready:150,after:400};
  const box=document.createElement('div');box.className=pre+'-pfx';box.style.cssText='position:absolute;inset:0;z-index:19;pointer-events:none;overflow:hidden';host.appendChild(box);
  const K={PART,BEAT,box,max:0,spawned:0,cap:PART.max,ema:16,lt:0,last:0};
  const ks=document.createElement('style');ks.textContent=`.alive.${pre}-hold .al-arm-l{animation:${pre}hl .35s ease-out forwards}.alive.${pre}-hold .al-arm-r{animation:${pre}hr .35s ease-out forwards}
@keyframes ${pre}hl{to{transform:rotate(-50deg)}}@keyframes ${pre}hr{to{transform:rotate(50deg)}}`;document.head.appendChild(ks);
  /* one particle: a small svg that moves (transform) and fades (opacity); removed when its fadeMs is over */
  K.spawn=(svg,x,y,o={})=>{
    if(box.childElementCount>=K.cap)return null;
    const sz=o.sz||24,ms=Math.min(PART.fadeMs,o.ms||PART.fadeMs),e=document.createElement('i'),now=performance.now();
    e.style.cssText=`position:absolute;left:${(x-sz/2).toFixed(1)}px;top:${(y-sz/2).toFixed(1)}px;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px`;
    e.innerHTML=`<svg viewBox="${o.vb||'-15 -15 30 30'}" style="width:100%;height:100%;display:block;overflow:visible">${svg}</svg>`;
    e.dataset.t=now;box.appendChild(e);K.spawned++;K.last=now;if(box.childElementCount>K.max)K.max=box.childElementCount;
    const dx=o.dx||0,dy=o.dy||0,g=o.g||0,s0=o.s0==null?1:o.s0,s1=o.s1==null?1:o.s1,r0=o.r0||0,r=o.rot||0,op=o.op==null?1:o.op;
    const kf=[0,.3,.65,1].map((t,i)=>({offset:t,opacity:i===0?(o.fadeIn?0:op):i===3?0:i===2?op*.7:op,
      transform:`translate(${(dx*t).toFixed(1)}px,${(dy*t+g*t*t).toFixed(1)}px) rotate(${(r0+r*t).toFixed(0)}deg) scale(${(s0+(s1-s0)*t).toFixed(2)})`}));
    let gone=false;const rm=()=>{if(gone)return;gone=true;e.remove()};
    try{const a=e.animate(kf,{duration:ms,easing:o.ease||'cubic-bezier(.25,.6,.45,1)',fill:'forwards'});a.onfinish=rm}catch(_){}
    setTimeout(rm,ms);return e;
  };
  /* a puff of flour / dust: soft round clouds that rise, grow and fade */
  K.cloud=(x,y,n,col,o={})=>{const sp=o.spread||46;for(let k=0;k<n;k++){const a=(k/n)*Math.PI*2+Math.random()*.7;
    K.spawn(`<circle r="11" fill="${col}" stroke="${o.edge||'#E6DCCB'}" stroke-width="1.4"/><circle cx="-3.5" cy="-3.5" r="3.6" fill="#fff" opacity=".8"/>`,x+Math.cos(a)*sp*.22,y+Math.sin(a)*sp*.1,
      {sz:(o.sz||24)+Math.random()*12,dx:Math.cos(a)*sp,dy:-(o.up||40)-Math.random()*18+Math.sin(a)*sp*.25,s0:.45,s1:1.55,op:o.op||.9})}};
  /* drops / bits thrown up that fall back (gravity) */
  K.drops=(x,y,n,col,o={})=>{const sp=o.sp||52;for(let k=0;k<n;k++){const a=((k+.5)/n-.5)*(o.fan||2.4)+(o.dir||0);
    K.spawn(o.svg||`<ellipse rx="5" ry="6.4" fill="${col}" stroke="${o.edge||'rgba(91,58,41,.4)'}" stroke-width="1.3"/><circle cx="-1.6" cy="-2.2" r="1.6" fill="#fff" opacity=".85"/>`,x,y,
      {sz:o.sz||16,dx:Math.sin(a)*sp,dy:-Math.cos(a)*sp*(o.lift||.9),g:o.g==null?95:o.g,rot:a*70,ms:o.ms||650})}};
  /* the grain a spatula / knife / ladle leaves: a glossy stroke that slowly spreads out and melts away */
  K.streak=(x,y,col,ang,o={})=>K.spawn(`<path d="M-13 1Q0 -5 13 1" stroke="${o.edge||'rgba(91,58,41,.25)'}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-13 1Q0 -5 13 1" stroke="${col}" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M-8 -1.2Q0 -4 8 -1.2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".75"/>`,x,y,{sz:o.sz||40,r0:ang||0,s0:1,s1:1.7,op:.95});
  /* steam wisps rising softly */
  K.steam=(x,y,n,o={})=>{for(let k=0;k<n;k++)K.spawn(`<path d="M0 13Q-7 6 0 0Q7 -6 0 -13" stroke="${o.col||'#fff'}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`,x+(k-(n-1)/2)*(o.gap||18),y,
    {sz:o.sz||36,dy:-(o.up||48),dx:(Math.random()-.5)*12,s0:.7,s1:1.35,op:o.op||.85,fadeIn:true,ease:'ease-out'})};
  /* bubbles rising and growing */
  K.bubbles=(x,y,n,o={})=>{for(let k=0;k<n;k++)K.spawn(`<circle r="9" fill="#fff" fill-opacity=".55" stroke="${o.edge||'#A7CFE8'}" stroke-width="1.8"/><circle cx="-3" cy="-3" r="2.4" fill="#fff"/>`,x+(Math.random()-.5)*(o.spread||30),y,
    {sz:(o.sz||16)+Math.random()*10,dx:(Math.random()-.5)*30,dy:-(o.up||40)-Math.random()*24,s0:.5,s1:1.25,op:.95})};
  K.crumbs=(x,y,n,col,o={})=>K.drops(x,y,n,col,Object.assign({sz:12,sp:44,g:110,svg:`<circle r="5" fill="${col}" stroke="rgba(91,58,41,.45)" stroke-width="1.3"/>`},o));
  /* motion.squash: flat → tall → settles */
  K.squash=(el,a=.16,ms=420,org='50% 100%')=>{if(!el||!el.animate)return;el.style.transformOrigin=org;
    try{el.animate([{transform:'scale(1,1)'},{transform:`scale(${1+a},${1-a})`,offset:.28},{transform:`scale(${1-a*.45},${1+a*.5})`,offset:.62},{transform:`scale(${1+a*.12},${1-a*.12})`,offset:.84},{transform:'scale(1,1)'}],{duration:ms,easing:'ease-out'})}catch(_){}};
  /* motion.threeBeats on the thing being worked on: down (a little squash while the finger is on), up (a bounce that settles), tap (both) */
  K.beat=(el,k)=>{if(!el||!el.animate)return;let kf,ms;
    if(k==='down'){kf=[{transform:'scale(1,1)'},{transform:'scale(1.04,.95)'},{transform:'scale(1.02,.98)'}];ms=BEAT.ready+120}
    else if(k==='up'){kf=[{transform:'scale(1.02,.98)'},{transform:'scale(.98,1.035) translateY(-1.5%)'},{transform:'scale(1.01,.99)'},{transform:'scale(1,1)'}];ms=BEAT.after}
    else{kf=[{transform:'scale(1,1)'},{transform:'scale(1.045,.94)',offset:.25},{transform:'scale(.97,1.04) translateY(-2%)',offset:.55},{transform:'scale(1.015,.985)',offset:.8},{transform:'scale(1,1)'}];ms=BEAT.ready+BEAT.after+150}
    el.style.transformOrigin='50% 90%';el.getAnimations().filter(a=>a.id==='kbeat').forEach(a=>a.cancel());const a=el.animate(kf,{duration:ms,easing:'ease-out',fill:k==='down'?'forwards':'none'});a.id='kbeat'};
  /* frame time from the tool loops: slow frames (older phones) → half the particles */
  K.tick=t=>{if(K.lt){const dt=t-K.lt;if(dt>0&&dt<250)K.ema=K.ema*.9+dt*.1}K.lt=t;K.cap=K.ema>34?Math.round(PART.max/2):PART.max};
  K.clear=()=>{box.innerHTML='';K.lt=0};
  K.stats=()=>{const n=performance.now(),ages=[...box.children].map(e=>n-(+e.dataset.t||n));return{now:box.childElementCount,max:K.max,cap:K.cap,limit:PART.max,fadeMs:PART.fadeMs,spawned:K.spawned,oldest:ages.length?Math.round(Math.max(...ages)):0,last:K.last}};
  /* motion.cooking.serve: the customer takes the food in both hands, sniffs twice, takes one big bite, cheeks puff up and chew.
     o: {cust, kind, food (svg html), draw(mood), later(fn,ms), done, log, grow, origin} — the customer comes up big meanwhile (whileActing) */
  K.eat=o=>{
    const c=o.cust,kd=A.KINDS[o.kind]||{},ov=document.createElement('div');ov.className=pre+'-eat';ov.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2';
    const ck=s=>`<div class="ek" style="position:absolute;left:${s<0?13:63}%;top:43.5%;width:24%;aspect-ratio:1;opacity:0"><svg viewBox="-20 -20 40 40" style="width:100%;height:100%;display:block;overflow:visible"><circle r="16.5" fill="${kd.body||'#FFF6EC'}" stroke="${OL}" stroke-width="2.8"/><circle cx="${s*2}" cy="3" r="9" fill="${kd.cheek||'#FF9AA8'}" opacity=".7"/><ellipse cx="${-s*5}" cy="-8" rx="4" ry="2.6" fill="#fff" opacity=".85"/></svg></div>`;
    ov.innerHTML=ck(-1)+ck(1)+`<div class="ef" style="position:absolute;left:28%;top:57%;width:44%;aspect-ratio:1">${o.food}</div>`;
    const fd=ov.querySelector('.ef'),cks=[...ov.querySelectorAll('.ek')],put=m=>{o.draw(m);c.appendChild(ov)},log=x=>{if(o.log)o.log(x)},hx=()=>{const r=c.getBoundingClientRect(),h=host.getBoundingClientRect();return[r.left-h.left,r.top-h.top,r.width,r.height]};
    const GS=o.grow||1.16;c.style.transformOrigin=o.origin||'50% 45%';let grow=null;try{grow=c.animate([{transform:'scale(1)'},{transform:`scale(${GS})`}],{duration:450,easing:'ease-out',fill:'forwards'})}catch(_){}
    put('happy');c.classList.add(pre+'-hold');log('eat:take');
    try{fd.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1.15,.85)',opacity:1,offset:.45},{transform:'scale(.94,1.06)',offset:.75},{transform:'scale(1)'}],{duration:450,easing:'ease-out'})}catch(_){}
    /* 킁킁: the food comes up to the nose twice, the head tips up, scent curls rise */
    o.later(()=>{log('eat:sniff');try{fd.animate([{transform:'none'},{transform:'translateY(-26%) scale(1.04)',offset:.4},{transform:'translateY(-18%)',offset:.6},{transform:'translateY(-26%) scale(1.04)',offset:.8},{transform:'none'}],{duration:1100,easing:'ease-in-out'});
      c.animate([{transform:'none'},{transform:'translateY(-3%) rotate(-3deg)',offset:.4},{transform:'translateY(-1%)',offset:.6},{transform:'translateY(-3%) rotate(-3deg)',offset:.8},{transform:'none'}],{duration:1100,easing:'ease-in-out',composite:'add'})}catch(_){}
      [0,440].forEach(w=>o.later(()=>{const [x,y,ww,hh]=hx();for(let k=0;k<3;k++)K.spawn(`<path d="M0 12Q-6 6 0 0Q6 -6 0 -12" stroke="#F3C6A0" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,x+ww*(.38+k*.12),y+hh*.66,{sz:26,dx:(.5-k*.5)*10,dy:-hh*.16,s0:.7,s1:1.2,op:.8,fadeIn:true,ms:700});
        noise(.09,{freq:2600,q:1.4,vol:.06});noise(.09,{freq:2900,q:1.4,vol:.05,when:.13})},w))},500);
    /* 한 입 크게: mouth opens, the customer leans in (ready → bite → after), the food loses a big round piece, crumbs fall */
    o.later(()=>{put('wow');log('eat:bite');try{c.animate([{transform:'none'},{transform:'translateY(1.5%) scale(1,.96)',offset:.2},{transform:'translate(-2%,4%) rotate(-5deg) scale(1.07)',offset:.45},{transform:'translateY(1%) scale(1.02)',offset:.72},{transform:'none'}],{duration:760,easing:'ease-out',composite:'add'});
        fd.animate([{transform:'none'},{transform:'translateY(-30%) scale(1.06)',offset:.45},{transform:'none'}],{duration:760,easing:'ease-out'})}catch(_){}
      o.later(()=>{fd.innerHTML=bitten(o.food);SFX.chomp();put('yum');const [x,y,ww,hh]=hx();K.crumbs(x+ww*.55,y+hh*.62,5,o.crumb||'#E7B46A',{sp:36})},340)},1700);
    /* 볼 볼록: both cheeks puff out and chew three times, then go down */
    o.later(()=>{log('eat:cheeks');cks.forEach((e,i)=>{try{e.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(1.3)',opacity:1,offset:.4},{transform:'scale(.95)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:460,easing:'ease-out',fill:'forwards'});
        o.later(()=>{try{e.animate([{transform:'scale(1)',opacity:1},{transform:`scale(${i?1.14:.9},${i?.9:1.14})`,opacity:1},{transform:'scale(1)',opacity:1}],{duration:640,iterations:3,easing:'ease-in-out',fill:'forwards'})}catch(_){}},460)}catch(_){}});
      [0,640,1280].forEach(w=>o.later(()=>tone(190+w/16,.07,'sine',.07),460+w))},2150);
    o.later(()=>{cks.forEach(e=>{try{e.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.2)',opacity:0}],{duration:320,fill:'forwards'})}catch(_){}});try{fd.animate([{opacity:1},{opacity:0,transform:'translateY(10%) scale(.8)'}],{duration:400,fill:'forwards'})}catch(_){}
      c.classList.remove(pre+'-hold');try{if(grow){grow.cancel();c.animate([{transform:`scale(${GS})`},{transform:'scale(1)'}],{duration:400,easing:'ease-out'})}}catch(_){}},4500);
    o.later(()=>{ov.remove();log('eat:done');if(o.done)o.done()},4950);
  };
  /* the same food with a big round bite out of it (two overlapping circles cut by a mask) */
  let bid=0;function bitten(html){const m=html.match(/viewBox="([^"]+)"/);if(!m)return html;const [x,y,w,h]=m[1].split(/[\s,]+/).map(Number),id=pre+'bt'+(++bid);
    return `<svg viewBox="${m[1]}" style="width:100%;height:100%;display:block;overflow:visible"><defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${x-w}" y="${y-h}" width="${w*3}" height="${h*3}"><rect x="${x-w}" y="${y-h}" width="${w*3}" height="${h*3}" fill="#fff"/><circle cx="${x+w*.62}" cy="${y+h*.06}" r="${w*.2}" fill="#000"/><circle cx="${x+w*.4}" cy="${y+h*.02}" r="${w*.17}" fill="#000"/></mask></defs><g mask="url(#${id})">${html.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g></svg>`}
  return K;
}
const K=motionKit(stage,'bk'),TAP_MS=450;   // motion.tapAlso has no number: one tap plays one stroke of about half a second (as in salon.js)

/* ============================== 빵집 (P8-나) ==============================
   손님 셋 중 한 명을 고르면(말풍선에 빵 또는 케이크 그림) 그 주문대로 반죽부터 꾸미기까지 직접 합니다.
   빵: 재료 넣기 → 젓기 → 치대기 → 판에 놓기 → 모양 고르기 → 오븐 → 장갑으로 꺼내기 → 잼 → 바르기 → 상자에 담기
   케이크: 크림 → 과일 고르기 → 썰기 → 올리기 → 짤주머니 → 초 꽂기 → 불 붙이기 → 노래 → 불기 → 건네주기
   숫자(횟수, 단계별 새 과정)는 MLCFG.games.bakery 의 문장에서 읽습니다. */
const KINDS=['bunny','bear','cat','dog'];
const T=(a,i,d)=>num(a&&a[i],0,d);
const N_FLOUR=T(GC.bread,0,3),N_EGG=num((GC.bread||[])[0],1,2),N_KNEAD=T(GC.bread,2,5),N_BALL=Math.min(4,T(GC.bread,3,4)),N_CUT=Math.min(4,num((GC.cake||[])[1],1,4)),N_ROSE=T(GC.cake,2,8),N_CAND=Math.min(3,T(GC.cake,3,3));
const DOUGH='#F4DDAF',CRUST='#D9923A',CRUST_L='#EDB866',SPONGE='#F2D49B',CREAM='#FFFDF9';
const CNTK=k=>M.CNT_KO[k-1]+'!',CNTE=k=>cap(M.CNT_EN[k-1])+'!';

function levelInfo(n){
  const f={level:n,add:false,knead:false,spread:false,cake:false,cream:false,fruit:false,candles:false,shape:false,pipe:false,order:false};
  LV.slice(0,n).forEach(l=>{const t=l.new||'';
    if(/재료 넣기/.test(t))f.add=true;if(/치대기/.test(t))f.knead=true;if(/잼|버터/.test(t))f.spread=true;if(/케이크/.test(t))f.cake=true;
    if(/크림/.test(t))f.cream=true;if(/과일/.test(t))f.fruit=true;if(/(^|[\s,:])초(\s|,|$)/.test(t))f.candles=true;if(/모양 고르기/.test(t))f.shape=true;if(/짤주머니/.test(t))f.pipe=true;if(/주문/.test(t))f.order=true});
  return f;
}
function planFor(o,v){
  if(o==='cake'){const p=['cream'];if(v.fruit)p.push('pickFruit','cut','top');if(v.pipe)p.push('pipe');if(v.candles)p.push('candle','light','blow');p.push('serve');return p}
  const p=[];if(v.add)p.push('add');p.push('stir');if(v.knead)p.push('knead');p.push('place');if(v.shape)p.push('shape');p.push('bake','out');if(v.spread)p.push('jam','spread');p.push('serve');return p;
}
/* not in config: which order each of the three guests asks for. before cake: bread. level 3 (cake is new): bread and cake take turns. level 4: a mix, the child picks */
function makeOrders(v){
  if(!v.cake)return['bread','bread','bread'];
  if(!v.order){const o=DATA.last==='cake'?'bread':'cake';return[o,o,o]}
  return shuffle(['bread','cake',pick(['bread','cake'])]);
}

/* ============================== pictures ============================== */
const eggSVG=`<svg viewBox="0 0 100 100"><path d="M50 10C74 10 84 52 84 66C84 85 68 94 50 94C32 94 16 85 16 66C16 52 26 10 50 10Z" fill="#FFF3DC" ${S3}/><ellipse cx="38" cy="36" rx="7" ry="11" fill="#fff" opacity=".7" transform="rotate(18 38 36)"/><circle cx="62" cy="64" r="2.4" fill="#E6C58A"/><circle cx="46" cy="76" r="2" fill="#E6C58A"/></svg>`;
const flourSVG=`<svg viewBox="0 0 100 100"><path d="M26 22Q50 10 74 22L80 90Q50 98 20 90Z" fill="#FFFDF9" ${S3}/><path d="M26 22Q50 32 74 22" fill="none" ${S3}/><g transform="translate(50 62)"><path d="M0 22V-14" stroke="#B98A3E" stroke-width="3" stroke-linecap="round"/><ellipse cx="-8" cy="-4" rx="4.5" ry="9" fill="#F0D58A" ${S2} transform="rotate(-30 -8 -4)"/><ellipse cx="8" cy="-4" rx="4.5" ry="9" fill="#F0D58A" ${S2} transform="rotate(30 8 -4)"/><ellipse cx="0" cy="-15" rx="4.5" ry="9" fill="#F0D58A" ${S2}/></g></svg>`;
const milkSVG=`<svg viewBox="0 0 100 100"><path d="M28 34H72V90Q72 96 66 96H34Q28 96 28 90Z" fill="#fff" ${S3}/><path d="M28 34L50 12L72 34Z" fill="#A7CFE8" ${S3}/><path d="M50 52C42 62 40 70 46 76C52 80 60 76 60 68C60 62 54 56 50 52Z" fill="#A7CFE8" ${S2}/></svg>`;
const SRC={flour:flourSVG,milk:milkSVG,egg:eggSVG};
const spatulaSVG=`<svg viewBox="0 0 100 100"><path d="M52 50L84 88" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M52 50L84 88" stroke="#E6B07A" stroke-width="8" stroke-linecap="round"/><path d="M14 20Q14 8 28 8H46Q62 8 62 24V38Q62 56 38 56Q14 56 14 38Z" fill="#8FC3E6" ${S3}/>${FACE(38,28,.9)}</svg>`;
/* P18 cooking.whisk: the new whisk (balloon of wires, wooden handle with a small face). .wk-w = the wires, squeezed sideways while it spins */
const WIRE=d=>`<path d="${d}" fill="none" stroke="${OL}" stroke-width="5.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#DCE2EA" stroke-width="3" stroke-linecap="round"/>`;
const whiskSVG=`<svg viewBox="0 0 100 100"><g class="wk-w">${WIRE('M45 44C14 60 18 97 50 97C82 97 86 60 55 44')}${WIRE('M46.5 44C28 62 31 95 50 95C69 95 72 62 53.5 44')}${WIRE('M48 44C40 64 42 93 50 93C58 93 60 64 52 44')}<path d="M24 66Q26 84 40 92" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></g><rect x="40" y="35" width="20" height="13" rx="4" fill="#B9C0CC" ${S2}/><path d="M37 9Q37 2 50 2Q63 2 63 9V37H37Z" fill="#E6B07A" ${S3}/><path d="M42 31H58" stroke="#C98A4E" stroke-width="2.4" stroke-linecap="round"/>${FACE(50,15,.72)}</svg>`;
const gloveSVG=`<svg viewBox="0 0 100 100"><path d="M30 94V54Q16 50 18 38Q20 30 28 34L32 22Q36 14 42 18L45 11Q51 5 57 11L59 20Q67 14 71 22Q76 28 72 38L74 54Q76 74 70 94Z" fill="#E8A0AE" ${S3}/><rect x="26" y="76" width="48" height="19" rx="7" fill="#F6D3DB" ${S3}/>${FACE(50,56,1)}</svg>`;
const knifeSVG=`<svg viewBox="0 0 100 100"><rect x="62" y="6" width="18" height="46" rx="8" fill="#E6B07A" ${S3} transform="rotate(24 71 29)"/><path d="M20 50L66 44Q86 50 80 64L34 90Q16 88 14 68Z" fill="#DDE3EA" ${S3}/>${FACE(46,66,.8)}</svg>`;
const matchSVG=`<svg viewBox="0 -8 100 108"><rect x="43" y="32" width="14" height="64" rx="6" fill="#E6B07A" ${S3}/><circle cx="50" cy="30" r="14" fill="#D2412A" ${S3}/><path d="M50 -6Q64 8 50 20Q36 8 50 -6Z" fill="#FFB761" ${S2}/>${FACE(50,32,.55)}</svg>`;
const bagSVG=c=>`<svg viewBox="0 0 100 100"><path d="M28 14H72L58 78L50 92L42 78Z" fill="#FFFDF9" ${S3}/><path d="M40 70L50 92L60 70Z" fill="${c}" ${S2}/><path d="M34 30H66" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity=".7"/>${FACE(50,48,.9)}</svg>`;
const jarSVG=(c)=>`<svg viewBox="0 0 100 100"><rect x="26" y="14" width="48" height="14" rx="6" fill="#E6B07A" ${S3}/><path d="M22 30H78V84Q78 94 68 94H32Q22 94 22 84Z" fill="#FFFDF9" ${S3}/><path d="M26 44H74V82Q74 90 66 90H34Q26 90 26 82Z" fill="${c}"/><ellipse cx="38" cy="58" rx="5" ry="9" fill="#fff" opacity=".5"/></svg>`;
const butterSVG=`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="74" rx="42" ry="16" fill="#FFFDF9" ${S3}/><path d="M22 50L34 36H78L66 50Z" fill="#FFE38A" ${S3}/><path d="M22 50H66V74H22Z" fill="#F7D56A" ${S3}/><path d="M66 50L78 36V60L66 74Z" fill="#EBC24F" ${S3}/></svg>`;
const JAMS=[{k:'strawberry',ko:'딸기잼',en:'strawberry jam',hex:'#E0786F',vivid:'#E5434F',svg:jarSVG('#E5434F')},{k:'blueberry',ko:'블루베리잼',en:'blueberry jam',hex:'#7D9BE0',vivid:'#5B63D6',svg:jarSVG('#5B63D6')},{k:'butter',ko:'버터',en:'butter',hex:'#EBCB6B',vivid:'#FFD84A',svg:butterSVG}];
const candleSVG=c=>`<svg viewBox="0 0 80 100"><rect x="30" y="34" width="20" height="64" rx="8" fill="${c}" ${S3}/><path d="M30 52L50 44M30 68L50 60M30 84L50 76" stroke="#fff" stroke-width="5" opacity=".8"/><path d="M40 34V26" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><g class="fl"><path d="M40 -4Q54 10 40 26Q26 10 40 -4Z" fill="#FFC14D" ${S2}/><path d="M40 8Q46 15 40 24Q34 15 40 8Z" fill="#FFF3B0"/></g></svg>`;
const FR={strawberry:{ko:'딸기',en:'strawberry',
  whole:`<svg viewBox="0 0 100 100"><path d="M50 92C20 80 14 52 22 40C32 28 68 28 78 40C86 52 80 80 50 92Z" fill="#E0545C" ${S3}/><path d="M34 32Q50 12 66 32Q50 24 34 32Z" fill="#6DAE5A" ${S2}/><g fill="#FFE4A8"><circle cx="38" cy="52" r="2.4"/><circle cx="58" cy="50" r="2.4"/><circle cx="48" cy="64" r="2.4"/><circle cx="64" cy="68" r="2.4"/><circle cx="34" cy="70" r="2.4"/></g></svg>`,
  slice:`<svg viewBox="0 0 100 100"><path d="M50 90C20 78 14 50 24 38C34 26 66 26 76 38C86 50 80 78 50 90Z" fill="#E0545C" ${S3}/><path d="M50 78C34 68 32 52 38 46C44 42 56 42 62 46C68 52 66 68 50 78Z" fill="#F7B5B0"/><path d="M50 50V72" stroke="#fff" stroke-width="2.4" opacity=".7"/></svg>`},
 kiwi:{ko:'키위',en:'kiwi',
  whole:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="54" rx="38" ry="34" fill="#B98A5A" ${S3}/><path d="M26 40Q40 30 56 36M30 66Q50 76 70 62" stroke="#9B6F44" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  slice:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#8FC464" ${S3}/><circle cx="50" cy="50" r="30" fill="#A9D67C"/><circle cx="50" cy="50" r="11" fill="#F3F0C2"/><g fill="#3E2F2A"><circle cx="50" cy="32" r="2"/><circle cx="66" cy="42" r="2"/><circle cx="66" cy="58" r="2"/><circle cx="50" cy="68" r="2"/><circle cx="34" cy="58" r="2"/><circle cx="34" cy="42" r="2"/></g></svg>`},
 orange:{ko:'오렌지',en:'orange',
  whole:`<svg viewBox="0 0 100 100"><circle cx="50" cy="54" r="38" fill="#F5A53C" ${S3}/><path d="M50 16Q60 6 70 12Q62 22 50 16Z" fill="#6DAE5A" ${S2}/><ellipse cx="36" cy="42" rx="8" ry="5" fill="#fff" opacity=".4"/></svg>`,
  slice:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#F5A53C" ${S3}/><circle cx="50" cy="50" r="31" fill="#FFD27A"/><g stroke="#F5A53C" stroke-width="3" stroke-linecap="round"><path d="M50 50V22M50 50L72 34M50 50L74 56M50 50L56 76M50 50L34 70M50 50L26 52M50 50L30 32"/></g></svg>`}};
const FKEYS=['strawberry','kiwi','orange'];
const FRC={strawberry:'#F08A8E',kiwi:'#A9D67C',orange:'#FFC867'};   // juice drops (not in config)
const shapeInner=(k,c,h)=>k==='loaf'?`<path d="M12 46Q12 22 34 26Q50 14 66 26Q88 22 88 46V76Q88 86 78 86H22Q12 86 12 76Z" fill="${c}" ${S3}/><path d="M24 42Q36 34 48 42M52 42Q64 34 76 42" fill="none" stroke="${h}" stroke-width="5" stroke-linecap="round"/>`
 :k==='croissant'?`<path d="M8 68Q10 30 50 24Q90 30 92 68Q82 56 72 62Q64 42 50 42Q36 42 28 62Q18 56 8 68Z" fill="${c}" ${S3}/><path d="M36 30L40 44M50 26V42M64 30L60 44" stroke="${h}" stroke-width="4" stroke-linecap="round"/>`
 :k==='bun'?`<ellipse cx="50" cy="58" rx="40" ry="32" fill="${c}" ${S3}/><path d="M28 50Q50 36 72 50" fill="none" stroke="${h}" stroke-width="5" stroke-linecap="round"/><path d="M34 66Q50 74 66 66" fill="none" stroke="${h}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`
 :`<circle cx="50" cy="54" r="36" fill="${c}" ${S3}/><ellipse cx="38" cy="40" rx="11" ry="6" fill="${h}" opacity=".75" transform="rotate(-20 38 40)"/>`;
const shapeSVG=(k,c,h)=>`<svg viewBox="0 0 100 100">${shapeInner(k,c||CRUST,h||CRUST_L)}</svg>`;
const SHP=['bun','loaf','croissant'],SHK={bun:['동그란 빵','round bun'],loaf:['식빵','loaf bread'],croissant:['크루아상','croissant']};
const pieceHTML=k=>`<svg viewBox="0 0 100 100"><g class="raw">${shapeInner(k,DOUGH,'#fff')}</g><g class="gold">${shapeInner(k,CRUST,CRUST_L)}</g><g class="jam"><circle cx="38" cy="48" r="17" fill="#E5434F" opacity="0"/><circle cx="64" cy="48" r="17" fill="#E5434F" opacity="0"/><circle cx="38" cy="68" r="17" fill="#E5434F" opacity="0"/><circle cx="64" cy="68" r="17" fill="#E5434F" opacity="0"/></g></svg>`;
const lumpSVG=sm=>`<svg viewBox="0 0 100 100"><path d="M14 60Q8 34 34 24Q50 16 68 24Q94 34 88 62Q84 84 54 86Q20 88 14 60Z" fill="${DOUGH}" ${S3}/><ellipse cx="38" cy="40" rx="14" ry="7" fill="#fff" opacity=".6" transform="rotate(-18 38 40)"/><g opacity="${(1-sm).toFixed(2)}" stroke="#C9A468" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M30 60L42 56M58 66L70 60M50 46L58 50"/></g><g fill="#fff" opacity="${(1-sm).toFixed(2)}"><circle cx="64" cy="40" r="2.2"/><circle cx="28" cy="52" r="2"/><circle cx="52" cy="72" r="2.2"/></g></svg>`;
const sheetSVG=`<svg viewBox="0 0 100 100"><rect x="2" y="2" width="96" height="96" rx="14" fill="#C8CDD6" ${S3}/><rect x="8" y="8" width="84" height="84" rx="9" fill="#DDE3EA"/><path d="M50 12V88M12 50H88" stroke="#C8CDD6" stroke-width="2" stroke-dasharray="3 5"/></svg>`;
const boxSVG=closed=>`<svg viewBox="0 0 100 90">${closed?`<rect x="8" y="30" width="84" height="56" rx="8" fill="#E7C99C" ${S3}/><rect x="6" y="20" width="88" height="20" rx="7" fill="#F1DDBA" ${S3}/><rect x="43" y="20" width="14" height="66" fill="${PAL.rose||'#E8A0AE'}"/><path d="M50 20Q34 4 28 14Q26 24 50 20Q74 24 72 14Q66 4 50 20Z" fill="${PAL.rose||'#E8A0AE'}" ${S2}/>`:`<path d="M14 38L6 10H94L86 38Z" fill="#F1DDBA" ${S3}/><rect x="10" y="36" width="80" height="50" rx="8" fill="#E7C99C" ${S3}/><path d="M16 54H84" stroke="#fff" stroke-width="4" opacity=".5"/>`}</svg>`;
const ovenSVG=`<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="94" rx="12" fill="#D9DEE6" ${S3}/><circle cx="22" cy="16" r="5" fill="#A9B0BD" ${S2}/><circle cx="40" cy="16" r="5" fill="#A9B0BD" ${S2}/><circle cx="58" cy="16" r="5" fill="#E8A0AE" ${S2}/><rect x="70" y="11" width="20" height="10" rx="4" fill="#A7CFE8" ${S2}/><rect x="12" y="32" width="76" height="60" rx="7" fill="#4A3A33" stroke="${OL}" stroke-width="3"/><rect class="win" x="16" y="36" width="68" height="52" rx="5" fill="#FFB761"/><g class="door"><path fill-rule="evenodd" d="M10 30H90V94H10Z M17 38H83V80H17Z" fill="#A9B0BD" ${S3}/><rect x="17" y="38" width="66" height="42" rx="4" fill="#fff" opacity=".12"/><rect x="26" y="83" width="48" height="6" rx="3" fill="#8E96A6" ${S2}/></g></svg>`;
const ovenMini=`<svg viewBox="0 0 100 100"><rect x="8" y="12" width="84" height="80" rx="12" fill="#D9DEE6" ${S3}/><rect x="18" y="38" width="64" height="44" rx="7" fill="#FFB761" ${S3}/><circle cx="26" cy="24" r="5" fill="#A9B0BD" ${S2}/><circle cx="44" cy="24" r="5" fill="#A9B0BD" ${S2}/></svg>`;
const BCELL=[[52,64],[80,50],[120,50],[148,64],[68,80],[100,72],[132,80],[100,56]];
const BUBS=[[70,58,4],[118,72,3.2],[96,48,3.6],[140,60,3],[58,72,2.8],[108,62,4.4],[84,76,3],[128,50,2.6],[46,62,2.4],[152,70,2.8],[92,66,2.2],[76,48,2.6]];
/* the batter swirl that turns with the whisk (CSS rotate only; two layers: separate streaks fade, mixed lines stay) */
const SWIRL_A=`<svg viewBox="-50 -50 100 100"><path d="M0 0C10 -18 36 -10 33 10C30 31 0 40 -24 28" fill="none" stroke="#F5C24A" stroke-width="8" stroke-linecap="round" opacity=".95"/><path d="M0 0C-10 18 -36 10 -33 -10C-30 -31 0 -40 24 -28" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/><circle cx="16" cy="-24" r="4" fill="#fff"/><circle cx="-20" cy="22" r="3.6" fill="#F5C24A"/></svg>`;
const SWIRL_B=`<svg viewBox="-50 -50 100 100"><path d="M0 0C14 -10 28 4 22 18C16 30 -6 34 -20 24C-34 14 -32 -10 -16 -22C-4 -30 14 -30 26 -22" fill="none" stroke="#D9AE6A" stroke-width="3.2" stroke-linecap="round"/><path d="M0 0C-12 8 -22 -4 -16 -14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`;
function bowlSVG(b){
  const avg=b.cells.reduce((a,c)=>a+c,0)/b.cells.length;
  let s=`<path d="M8 62Q12 140 100 142Q188 140 192 62Z" fill="#A7CFE8" ${S3}/><path d="M26 100Q100 122 174 100" stroke="#fff" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/><ellipse cx="100" cy="62" rx="92" ry="38" fill="#FFFDF9" ${S3}/><ellipse cx="100" cy="64" rx="78" ry="29" fill="#EFE5D6"/>`;
  if(b.stir||b.pre){
    s+=`<clipPath id="bkbc"><ellipse cx="100" cy="64" rx="78" ry="29"/></clipPath><g clip-path="url(#bkbc)"><ellipse cx="100" cy="64" rx="80" ry="31" fill="#F7F1E6"/>`;
    [[78,62],[124,68],[100,56]].slice(0,Math.max(1,b.e)).forEach(y=>{s+=`<circle cx="${y[0]}" cy="${y[1]}" r="9" fill="#F5B83D" stroke="#E09A1E" stroke-width="1.6" opacity="${(1-avg).toFixed(2)}"/>`});
    [[60,70],[90,78],[130,56],[110,70],[72,54]].forEach(p=>{s+=`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff" opacity="${(1-avg).toFixed(2)}"/>`});
    b.cells.forEach((v,i)=>{if(v>0)s+=`<circle cx="${BCELL[i][0]}" cy="${BCELL[i][1]}" r="26" fill="${DOUGH}" opacity="${v.toFixed(2)}"/>`});
    /* cooking.whisk: '저을수록 거품이 올라옴' — little bubbles on the batter, more as it mixes */
    if(b.stir)BUBS.slice(0,Math.round(avg*BUBS.length)).forEach(p=>{s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="#FFFDF6" stroke="#E2C79A" stroke-width="1.2"/><circle cx="${p[0]-p[2]*.35}" cy="${p[1]-p[2]*.35}" r="${p[2]*.3}" fill="#fff"/>`});
    s+=`</g>`;
  }else{
    if(b.m>0)s+=`<ellipse cx="100" cy="66" rx="58" ry="19" fill="#FAF6EE" stroke="#E2D9CB" stroke-width="2"/>`;
    for(let k=0;k<b.f;k++)s+=`<ellipse cx="${100+(k-1)*28}" cy="${60-(k===1?4:0)}" rx="28" ry="15" fill="#fff" stroke="#E2D9CB" stroke-width="2"/>`;
    for(let k=0;k<b.e;k++)s+=`<circle cx="${80+k*40}" cy="${66+k*2}" r="10" fill="#F5B83D" stroke="#E09A1E" stroke-width="2"/><ellipse cx="${77+k*40}" cy="${62+k*2}" rx="3" ry="2" fill="#fff" opacity=".7"/>`;
  }
  return `<svg viewBox="0 0 200 150">${s}</svg>`;
}
/* cake: 340 x 270. top ellipse (170,100) 150 x 68 */
const CCELLS=(()=>{const a=[];[62,100,138].forEach(y=>[45,95,145,195,245,295].forEach(x=>{if(((x-170)/142)**2+((y-100)/60)**2<=1)a.push([x,y])}));return a})();
const FSPOT=[[112,92],[228,92],[142,124],[198,124]];
const ROSE=Array.from({length:N_ROSE},(_,k)=>{const t=(k+.5)/N_ROSE*Math.PI*2;return[170+120*Math.cos(t),100+50*Math.sin(t)]});
const CSPOT=N_CAND<=1?[[170,98]]:N_CAND===2?[[104,102],[236,102]]:[[58,108],[170,96],[282,108]];
const CKEY={slice:null};
function cakeSVG(c){
  const avg=c.cream.reduce((a,b)=>a+b,0)/c.cream.length;
  let s=`<ellipse cx="170" cy="196" rx="166" ry="68" fill="#FFFDF9" ${S3}/><ellipse cx="170" cy="196" rx="128" ry="50" fill="none" stroke="#EADFD0" stroke-width="3"/>`;
  s+=`<path d="M20 100V180A150 66 0 0 0 320 180V100Z" fill="${SPONGE}" ${S3}/><path d="M20 100V180A150 66 0 0 0 320 180V100Z" fill="#fff" opacity="${(avg*.95).toFixed(2)}"/>`;
  s+=`<path d="M44 150Q100 172 170 174" stroke="#D3A862" stroke-width="3" fill="none" stroke-linecap="round" opacity="${(1-avg).toFixed(2)}"/>`;
  s+=`<ellipse cx="170" cy="100" rx="150" ry="68" fill="${SPONGE}" ${S3}/><clipPath id="bkcc"><ellipse cx="170" cy="100" rx="148" ry="66"/></clipPath><g clip-path="url(#bkcc)">`;
  c.cream.forEach((v,i)=>{if(v>0)s+=`<circle cx="${CCELLS[i][0]}" cy="${CCELLS[i][1]}" r="44" fill="${CREAM}" opacity="${v.toFixed(2)}"/>`});
  s+=`</g>`;
  c.slices.forEach(p=>{s+=`<g transform="translate(${p.x} ${p.y}) scale(.66)"><g transform="translate(-50 -50)">${svgInner(FR[p.f].slice)}</g></g>`});
  c.roses.forEach(p=>{s+=`<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><circle r="18" fill="${p.col}" ${S2}/><path d="M0 -10Q9 -10 9 -2Q9 8 0 8Q-6 8 -6 2Q-6 -4 0 -4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`});
  return `<svg viewBox="0 0 340 270">${s}</svg>`;
}
const cakeMini=`<svg viewBox="0 0 100 90"><ellipse cx="50" cy="66" rx="46" ry="18" fill="#FFFDF9" ${S3}/><path d="M14 40V60A36 14 0 0 0 86 60V40Z" fill="${SPONGE}" ${S3}/><ellipse cx="50" cy="40" rx="36" ry="14" fill="#fff" ${S3}/><circle cx="50" cy="38" r="7" fill="#E0545C" ${S2}/></svg>`;
const breadBub=`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="38" ry="28" fill="${CRUST}" ${S3}/><path d="M30 52Q50 40 70 52" fill="none" stroke="${CRUST_L}" stroke-width="5" stroke-linecap="round"/></svg>`;
const STEP_ICON={add:()=>flourSVG,stir:()=>whiskSVG,knead:()=>lumpSVG(.6),place:()=>shapeSVG('ball',DOUGH,'#fff'),shape:()=>shapeSVG('bun'),bake:()=>ovenMini,out:()=>gloveSVG,jam:()=>JAMS[0].svg,spread:()=>knifeSVG,
  cream:()=>spatulaSVG,pickFruit:()=>FR.strawberry.whole,cut:()=>knifeSVG,top:()=>FR.kiwi.slice,pipe:()=>bagSVG('#E89AAE'),candle:()=>candleSVG('#8FC3E6'),light:()=>matchSVG,blow:()=>candleSVG('#EDA468'),serve:()=>boxSVG(true)};
const stepIcon=k=>(STEP_ICON[k]||(()=>''))();

/* ---- shop front and counter room ---- */
const LOBBY_BG=`<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax slice" style="width:100%;height:100%;display:block"><rect width="100" height="130" fill="#F6E9D8"/><rect y="86" width="100" height="44" fill="#E2C9A8"/><path d="M0 86H100" stroke="${OL}" stroke-width=".8"/>
 ${Array.from({length:9},(_,i)=>`<path d="M${i*12} 86L${i*12-6} 130" stroke="#D5B98F" stroke-width=".8"/>`).join('')}
 <rect x="8" y="22" width="84" height="56" rx="4" fill="#FFF5E4" stroke="${OL}" stroke-width="1.2"/><rect x="12" y="26" width="76" height="48" rx="2" fill="#DCEBF0"/><path d="M12 50H88M12 38H88" stroke="#C9A468" stroke-width="1.6"/>
 <g transform="translate(20 22) scale(.16)">${svgInner(breadBub)}</g><g transform="translate(36 22) scale(.16)">${svgInner(shapeSVG('croissant'))}</g><g transform="translate(52 22) scale(.16)">${svgInner(shapeSVG('loaf'))}</g><g transform="translate(66 22) scale(.16)">${svgInner(breadBub)}</g>
 <g transform="translate(18 34) scale(.18)">${svgInner(cakeMini)}</g><g transform="translate(40 34) scale(.18)">${svgInner(cakeMini)}</g><g transform="translate(62 34) scale(.18)">${svgInner(cakeMini)}</g>
 <path d="M4 4H96V20Q92 26 88 20Q84 26 80 20Q76 26 72 20Q68 26 64 20Q60 26 56 20Q52 26 48 20Q44 26 40 20Q36 26 32 20Q28 26 24 20Q20 26 16 20Q12 26 8 20Q4 26 4 20Z" fill="#E8A0AE" stroke="${OL}" stroke-width="1.2"/>
 ${[0,1,2,3,4,5].map(i=>`<path d="M${4+i*16} 4H${12+i*16}V22Q${8+i*16} 27 ${4+i*16} 22Z" fill="#FFFDF9" opacity=".75"/>`).join('')}</svg>`;
const WALL=`<svg viewBox="0 0 100 30" preserveAspectRatio="none"><rect width="100" height="30" fill="#F6E9D8"/>${Array.from({length:14},(_,i)=>`<path d="M${i*8} 0V30" stroke="#EDDDC5" stroke-width="1"/>`).join('')}<rect y="21" width="100" height="9" fill="#E8D2AE"/><rect x="4" y="14" width="40" height="3.4" rx="1.5" fill="#E2C9A8" stroke="#C9A468" stroke-width=".6"/><g transform="translate(6 3) scale(.12)">${svgInner(breadBub)}</g><g transform="translate(18 3) scale(.12)">${svgInner(shapeSVG('croissant'))}</g><g transform="translate(30 3) scale(.12)">${svgInner(shapeSVG('loaf'))}</g></svg>`;

/* ============================== layers ============================== */
const css=`
.bk-lobby{inset:0;z-index:1;overflow:hidden;touch-action:manipulation}
.bk-lobby>div{position:absolute;pointer-events:none}
.bk-lbg{inset:0}
.bk-lc{position:absolute;border:0;padding:0;background:none;pointer-events:auto;touch-action:manipulation;transition:transform 1s ease-in,opacity .6s}
.bk-lc .lc-ani{position:absolute;left:3%;right:3%;bottom:0;aspect-ratio:200/230}
.bk-lc .lc-bub{position:absolute;right:-6%;top:-14%;width:46%;aspect-ratio:1;border-radius:50%;background:var(--paper);border:3px solid ${OL};display:grid;place-items:center;padding:6%;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.bk-lc .lc-bub svg{width:100%;height:100%;display:block}
.bk-lc.sel{transform:translateY(-12px) scale(1.06)}
.bk-lc.gone{opacity:0;pointer-events:none}
.bk-wall{left:0;right:0;top:0;pointer-events:none}
.bk-wall svg{width:100%;height:100%;display:block}
.bk-counter{left:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(180deg,#E9D6BC,#E2C9A8);border-top:4px solid ${OL}}
.bk-cust{z-index:3;pointer-events:none}
.bk-cust svg{width:100%;height:100%;display:block;overflow:visible}
.bk-cust.enter{animation:bkin 1.1s cubic-bezier(.3,1.1,.5,1)}
.bk-cust.leave{animation:bkout 1.1s ease-in forwards}
@keyframes bkin{from{transform:translateX(120%)}to{transform:none}}
@keyframes bkout{to{transform:translateX(130%)}}
.bk-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:50%;padding:7px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.bk-bub svg{width:100%;height:100%;display:block}
.bk-work{z-index:5;left:0;right:0;bottom:0;pointer-events:none}
.bk-board{background:#E7C99C;border:4px solid ${OL};border-radius:26px;box-shadow:inset 0 0 0 6px #F1DDBA}
.bk-it.bk-oven .win{fill-opacity:0;transition:fill-opacity 1s}
.bk-it.bk-oven.on .win{fill-opacity:.6}
.bk-it.bk-oven .door{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(var(--op,1));transition:transform .5s}
.bk-pc .gold{opacity:0;transition:opacity 3.4s ease-in}
.bk-pc svg{transition:transform 3.4s ease-out}
.bk-pc.baked .gold{opacity:1}
.bk-pc.baked svg{transform:scale(1.14)}
.bk-pc.pop{animation:bksquish .5s ease-out}
@keyframes bksquish{0%{transform:scale(1)}35%{transform:scale(1.18,.84)}70%{transform:scale(.94,1.08)}100%{transform:scale(1)}}
.bk-cd .fl{opacity:0;transition:opacity .3s}
.bk-cd.lit .fl{opacity:1}
.bk-cd.drop{animation:bkdrop .5s ease-in}
@keyframes bkdrop{from{transform:translateY(-60px);opacity:0}}
.bk-tip{transform:rotate(-34deg) translate(0,-8px)}
.bk-it.bk-swirl{border-radius:50%;overflow:hidden;transition:opacity .4s}
.bk-swirl .sw-in{position:absolute;left:0;top:50%;width:100%;aspect-ratio:1;will-change:transform}
.bk-swirl .sw-in>div{position:absolute;inset:0}
.bk-swirl .sw-in svg{width:100%;height:100%;display:block}
.tl-tool .wk-w{transform-box:fill-box;transform-origin:50% 0}
.bk-actor{position:absolute;pointer-events:none;z-index:21}
.bk-actor svg{width:100%;height:100%;display:block;overflow:visible}
.bk-stream{position:absolute;pointer-events:none;z-index:18;transform-origin:50% 0}
.bk-stream svg{width:100%;height:100%;display:block;overflow:visible}
.bk-smoke{position:absolute;width:30px;height:30px;border-radius:50%;background:#EDE7DF;pointer-events:none}
`;
const gst=document.createElement('style');gst.textContent=css;document.head.appendChild(gst);
stage.insertAdjacentHTML('afterbegin',`<div class="bk-lobby" id="bkLobby" hidden><div class="bk-lbg">${LOBBY_BG}</div></div><div class="bk-wall" id="bkWall">${WALL}</div><div class="bk-counter" id="bkCounter"></div><div class="bk-cust" id="bkCust"></div><div class="bk-bub" id="bkBub" hidden></div><div class="bk-work" id="bkWork"></div>`);
const lobbyEl=$('#bkLobby'),wallEl=$('#bkWall'),counterEl=$('#bkCounter'),bubEl=$('#bkBub'),work=$('#bkWork');custEl=$('#bkCust');
let E={},G0={W:0,H:0,wallH:0,Hc:0,SL:112,SX:150},HOT=()=>[],lobbyAl=[],turns=null;
const rectOf=n=>E[n]?E[n].getBoundingClientRect():null;
const drawCust=m=>{if(!S||!S.kind)return;custEl.innerHTML=A.animal(S.kind,m||'idle',{});if(al)al.refresh()};
const showView=v=>{S.view=v;lobbyEl.hidden=v!=='lobby';[wallEl,counterEl,custEl,work].forEach(e=>{e.style.visibility=v==='lobby'?'hidden':''});if(v==='lobby')bubEl.hidden=true};
function mkIt(name,html,cls){const d=document.createElement('div');d.className='bk-it hide '+(cls||'');d.dataset.n=name;d.innerHTML=html;work.appendChild(d);E[name]=d;return d}
const slot=(c,y,s,i)=>[c+((i%2)?1:-1)*(s/2+3),y+(i<2?-1:1)*(s/2+3),s-2,s-2];
const cpt=(q,x,y)=>[q[0]-q[2]/2+x*q[2]/340,q[1]-q[3]/2+y*q[3]/270];
function cakeRect(mode){
  const {W,Hc,SL}=G0,cw=Math.min(W*.96,340),ch=cw*270/340;
  if(mode==='small'){const w=Math.min(190,(Hc-16-2*SL-8)/(270/340));return[W/2,4+w*270/340/2,w,w*270/340]}
  if(mode==='low')return[W/2,Hc-4-ch/2,cw,ch];
  return[W/2,Hc/2,cw,ch];
}
function LAY(){
  const {W,Hc,SL,SX}=G0,cx=W/2,sh=2*SL+14,shX=2*SX+14,sCy=Hc-8-sh/2,r={},ph=phase,nb=S.nb;
  if(S.order==='bread'){
    const bw0=Math.min(W*.84,Hc*.7),bw1=Math.min(W*.96,Hc*.9),ow=Math.min(W*.96,Hc*.96),pcs=f=>{for(let i=0;i<nb;i++){const q=f(i);if(q)r['pc'+i]=q}};
    if(ph==='add'){r.bowl=[cx,Hc-bw0*.75/2-8,bw0,bw0*.75];r.src=[cx,Math.max(64,(Hc-bw0*.75-8)/2),124,124]}
    else if(ph==='stir'){r.bowl=[cx,Hc/2,bw1,bw1*.75];const bh=bw1*.75;r.swirl=[cx,Hc/2-bh/2+bh*64/150,bw1*156/200,bh*58/150]}
    else if(ph==='knead'){const ls=Math.min(W*.74,Hc*.7);r.board=[cx,Hc/2,W*.94,Hc*.86];r.lump=[cx,Hc/2,ls,ls]}
    else if(ph==='place'||ph==='shape'){if(S.pl<nb)r.lump=[cx,70,124,124];r.sheet=[cx,sCy,sh,sh];pcs(i=>S.pcOn[i]?slot(cx,sCy,SL,i):null)}
    else if(ph==='bake'||(ph==='out'&&!S.out)){const wc=i=>[cx-ow/2+ow*(.225+.18*i),Hc/2-ow/2+ow*.62,ow*.17,ow*.17];r.oven=[cx,Hc/2,ow,ow];
      if(ph==='bake'&&!S.inOven){r.sheet=[cx,sCy,sh,sh];pcs(i=>slot(cx,sCy,SL,i))}else pcs(wc)}
    else if(ph==='out'||ph==='jam'||ph==='spread'){r.sheet=[cx,Hc/2,shX,shX];pcs(i=>slot(cx,Hc/2,SX,i))}
    else if(ph==='serve'){const bh=Math.min(135,Hc-8-sh-8);r.box=[cx,4+bh/2,bh*1.1,bh];r.sheet=[cx,sCy,sh,sh];pcs(i=>S.packed[i]?[cx,4+bh/2,26,26]:slot(cx,sCy,SL,i))}
  }else{
    const gcy=Hc-8-SL-3;
    if(ph==='cream'||ph==='pipe'||ph==='serve'||ph==='enter')r.cake=cakeRect('big');
    else if(ph==='pickFruit'||ph==='cut'||ph==='top'){r.cake=cakeRect('small');
      if(S.fruit&&ph==='cut'&&S.cutN<N_CUT)r.fruit=[cx,gcy,130,130];
      for(let k=0;k<N_CUT;k++){const st=S.sl[k];if(st==='board')r['sl'+k]=slot(cx,gcy,SL,k);else if(st&&st.cake)r['sl'+k]=st.cake}}
    else{const q=cakeRect('low');r.cake=q;S.cd.forEach((c,i)=>{if(c.on){const p=cpt(q,CSPOT[i][0],CSPOT[i][1]);r['cd'+i]=[p[0],p[1]+28-75,112,150]}})}
  }
  return r;
}
function lay(){
  if(!S||!G0.W||S.view!=='work')return;const R=LAY();
  Object.keys(E).forEach(n=>{const el=E[n],q=R[n];if(!q){el.classList.add('hide');return}
    Object.assign(el.style,{left:(q[0]-q[2]/2)+'px',top:(q[1]-q[3]/2)+'px',width:q[2]+'px',height:q[3]+'px'});el.classList.remove('hide')});
  S.hidden.forEach(n=>E[n]&&E[n].classList.add('hide'));
}
function jump(el,q){el.style.transition='none';Object.assign(el.style,{left:(q[0]-q[2]/2)+'px',top:(q[1]-q[3]/2)+'px',width:q[2]+'px',height:q[3]+'px'});el.classList.remove('hide');void el.offsetWidth;el.style.transition=''}
function layoutLobby(){
  if(!S||S.view!=='lobby')return;const r=lobbyEl.getBoundingClientRect(),W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.3,150))),gap=(W-3*bw)/4,bh=Math.round(bw*1.32);
  lobbyEl.querySelectorAll('.bk-lc').forEach((b,i)=>Object.assign(b.style,{left:(gap+i*(bw+gap))+'px',bottom:Math.round(Hh*.04)+'px',width:bw+'px',height:bh+'px'}));
}
function layout(){
  const r=stR(),W=r.width,Hh=r.height;if(!W||!Hh)return;
  const wallH=Math.round(Math.max(90,Math.min(Hh*.27,Hh-410))),Hc=Hh-wallH;
  const SL=Math.max(112,Math.round(cl((Hc-30)/3.3,112,128))),SX=Math.max(112,Math.round(Math.min(150,(Hc-24)/2.15,(W-24)/2.15)));
  G0={W,H:Hh,wallH,Hc,SL,SX};
  Object.assign(wallEl.style,{height:wallH+'px'});Object.assign(counterEl.style,{top:wallH+'px'});Object.assign(work.style,{top:wallH+'px'});
  const ch=wallH*1.12,cw=ch*200/230;Object.assign(custEl.style,{width:cw+'px',height:ch+'px',right:(W*.02)+'px',top:Math.max(0,wallH-ch*.9)+'px'});
  const bs=Math.min(64,wallH*.62);Object.assign(bubEl.style,{width:bs+'px',height:bs+'px',right:(W*.02+cw+6)+'px',top:(wallH*.12)+'px'});
  layoutLobby();lay();
}

/* ============================== P18 motions ============================== */
const ICON_SPARK=`<path d="M0 -10Q1.2 -1.2 10 0Q1.2 1.2 0 10Q-1.2 1.2 -10 0Q-1.2 -1.2 0 -10Z" fill="#FFE7A0" stroke="#E0B85A" stroke-width="1.2"/>`;
/* cooking.pour: the bag / carton tips over the bowl (ready → tip → pour → back), a stream falls, flour puffs up or milk splashes. returns ms until the bowl fills */
function pourIt(k,g){
  const sv=E.src.firstElementChild,b=rectOf('bowl'),s=stR(),src=E.src.getBoundingClientRect(),sz=src.width,flour=k==='flour';
  if(sv)try{sv.style.transformOrigin='50% 60%';sv.getAnimations().forEach(a=>a.cancel());sv.animate([{transform:'none'},{transform:'scale(1.06,.92)',offset:.14},{transform:'translate(-26%,14%) rotate(118deg)',offset:.36},{transform:'translate(-24%,18%) rotate(126deg)',offset:.5},{transform:'translate(-26%,14%) rotate(118deg)',offset:.66},{transform:'rotate(-8deg)',offset:.86},{transform:'none'}],{duration:1050,easing:'ease-in-out'})}catch(_){}
  const mx=src.left-s.left+sz*.52,my=src.top-s.top+sz*.82,by=b.top-s.top+b.height*.4,st=document.createElement('div');st.className='bk-stream';
  const w=flour?26:18,col=flour?'#FFFDF6':'#F4F9FC',edge=flour?'#E6DCCB':'#A7CFE8';
  st.innerHTML=`<svg viewBox="0 0 20 100" preserveAspectRatio="none"><path d="M4 0Q2 50 6 100H14Q18 50 16 0Z" fill="${col}" stroke="${edge}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${flour?'<circle cx="8" cy="30" r="1.6" fill="#EFE6D6"/><circle cx="12" cy="62" r="1.4" fill="#EFE6D6"/>':'<path d="M9 8V90" stroke="#fff" stroke-width="2" opacity=".8"/>'}</svg>`;
  Object.assign(st.style,{left:(mx-w/2)+'px',top:my+'px',width:w+'px',height:Math.max(20,by-my)+'px',opacity:'0'});fxEl.appendChild(st);
  try{st.animate([{transform:'scaleY(0)',opacity:1,offset:0},{transform:'scaleY(1)',opacity:1,offset:.25},{transform:'scaleY(1)',opacity:1,offset:.7},{transform:'translateY(100%) scaleY(0)',opacity:.6}],{duration:420,delay:380,easing:'ease-in'})}catch(_){}
  setTimeout(()=>st.remove(),900);
  if(flour)noise(.35,{type:'highpass',freq:1800,vol:.06,when:.38});else noise(.45,{type:'lowpass',freq:900,vol:.1,when:.38});
  L.later(()=>{if(g!==gen)return;const cx=b.left-s.left+b.width/2;
    if(flour){K.cloud(cx,by,10,'#FFFDF6',{spread:60,up:46});noise(.2,{type:'bandpass',freq:700,vol:.07})}   // 가루 구름이 폭
    else{K.drops(cx,by,6,'#F4F9FC',{edge:'#8FC3E6',sp:46,sz:14});tone(900,.05,'sine',.06)}
    K.squash(E.bowl,.04,360)},500);
  return 640;
}
/* cooking.crack: the egg knocks twice on the rim (a crack grows), opens wide, the yolk drops in and wobbles */
function crackEgg(g){
  const s=stR(),src=E.src.getBoundingClientRect(),b=rectOf('bowl'),sz=src.width,x0=src.left-s.left,y0=src.top-s.top,rimY=b.top-s.top+b.height*.08-sz*.78;
  const k=S.bowl.e,yx=b.left-s.left+b.width*(80+k*40)/200,yy=b.top-s.top+b.height*(66+k*2)/150;
  E.src.style.opacity='0';const act=document.createElement('div');act.className='bk-actor';Object.assign(act.style,{left:x0+'px',top:y0+'px',width:sz+'px',height:sz+'px'});
  const egg=svgInner(eggSVG),crack=`<path class="ck" d="M18 56L28 48L36 58L46 47L54 58L63 48L72 57L82 50" fill="none" stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
  act.innerHTML=`<div class="bot" style="position:absolute;inset:0;clip-path:polygon(0 52%,18% 56%,28% 48%,36% 58%,46% 47%,54% 58%,63% 48%,72% 57%,82% 50%,100% 52%,100% 100%,0 100%)"><svg viewBox="0 0 100 100">${egg}${crack}</svg></div><div class="top" style="position:absolute;inset:0;clip-path:polygon(0 0,100% 0,100% 52%,82% 50%,72% 57%,63% 48%,54% 58%,46% 47%,36% 58%,28% 48%,18% 56%,0 52%)"><svg viewBox="0 0 100 100">${egg}${crack}</svg></div>`;
  fxEl.appendChild(act);const top=act.querySelector('.top'),bot=act.querySelector('.bot'),cks=[...act.querySelectorAll('.ck')],dy=rimY-y0;
  try{
    act.animate([{transform:'none'},{transform:'scale(1.05,.94)',offset:.12},{transform:`translate(0,${dy}px)`,offset:.3},{transform:`translate(0,${dy-12}px)`,offset:.38},{transform:`translate(0,${dy}px)`,offset:.46},{transform:`translate(0,${dy-8}px)`,offset:.54},{transform:`translate(0,${dy}px)`,offset:.62},{transform:`translate(0,${dy}px)`}],{duration:1000,fill:'forwards',easing:'ease-in-out'});
    cks.forEach(c=>c.animate([{strokeDashoffset:1},{strokeDashoffset:.55,offset:.3},{strokeDashoffset:.55,offset:.5},{strokeDashoffset:0,offset:.62},{strokeDashoffset:0}],{duration:1000,fill:'forwards'}));
    top.animate([{transform:'none',opacity:1},{transform:'none',offset:.62},{transform:'translate(-20%,-14%) rotate(-38deg)',opacity:1,offset:.78},{transform:'translate(-28%,-10%) rotate(-48deg)',opacity:0}],{duration:1300,fill:'forwards',easing:'ease-out'});
    bot.animate([{transform:'none',opacity:1},{transform:'none',offset:.62},{transform:'translate(18%,6%) rotate(34deg)',opacity:1,offset:.78},{transform:'translate(26%,10%) rotate(44deg)',opacity:0}],{duration:1300,fill:'forwards',easing:'ease-out'});
  }catch(_){}
  tone(1500,.04,'triangle',.1,.3);tone(1500,.04,'triangle',.08,.46);noise(.08,{freq:3000,q:2,vol:.1,when:.6});   // 톡 · 톡 · 쩍
  L.later(()=>{if(g!==gen)return;const yk=document.createElement('div');yk.className='bk-actor';const ys=sz*.44;
    yk.innerHTML=`<svg viewBox="-20 -20 40 40"><path d="M-17 4Q-16 -9 0 -10Q16 -9 17 4Q12 12 0 12Q-12 12 -17 4Z" fill="#FFF8EC" stroke="#E6DCCB" stroke-width="1.4"/><circle r="9" fill="#F5B83D" stroke="#E09A1E" stroke-width="1.8"/><ellipse cx="-3" cy="-3.5" rx="3" ry="2" fill="#fff" opacity=".8"/></svg>`;
    Object.assign(yk.style,{left:(x0+sz/2-ys/2)+'px',top:(rimY+sz*.55-ys/2)+'px',width:ys+'px',height:ys+'px'});fxEl.appendChild(yk);
    const ddx=yx-(x0+sz/2),ddy=yy-(rimY+sz*.55);
    try{yk.animate([{transform:'translate(0,0) scale(.8,1.1)'},{transform:`translate(${ddx}px,${ddy}px) scale(.9,1.1)`,offset:.32},{transform:`translate(${ddx}px,${ddy}px) scale(1.4,.66)`,offset:.44},{transform:`translate(${ddx}px,${ddy}px) scale(.86,1.16)`,offset:.6},{transform:`translate(${ddx}px,${ddy}px) scale(1.12,.92)`,offset:.76},{transform:`translate(${ddx}px,${ddy}px) scale(1)`,opacity:1,offset:.9},{transform:`translate(${ddx}px,${ddy}px) scale(1)`,opacity:0}],{duration:800,fill:'forwards',easing:'ease-in'})}catch(_){}   // 통 떨어져 출렁
    sweepTone(520,200,.14,'sine',.1,.25);L.later(()=>{if(g===gen)K.drops(yx,yy,3,'#FFF8EC',{edge:'#E6DCCB',sp:30,sz:11})},260);
    setTimeout(()=>yk.remove(),850)},620);
  setTimeout(()=>{act.remove();E.src.style.opacity=''},1350);
  return 900;
}
/* cooking.knead: pressed flat as far as the finger goes (ready → press → springs back soft), a dent and a little flour */
function kneadFx(e,k){
  const el=E.lump,r=el.getBoundingClientRect(),s=stR(),st=k%2?{p:'scale(1.24,.74)',b:'scale(.9,1.13)'}:{p:'scale(1.36,.84)',b:'scale(.86,1.1)'};
  el.style.transformOrigin='50% 88%';try{el.getAnimations().forEach(a=>a.cancel());el.animate([{transform:'scale(1)'},{transform:'scale(.96,1.05)',offset:.18},{transform:st.p,offset:.38},{transform:st.p,offset:.48},{transform:st.b,offset:.68},{transform:'scale(1.04,.97)',offset:.85},{transform:'scale(1)'}],{duration:820,easing:'ease-out'})}catch(_){}
  tone(170+k*12,.14,'sine',.22,.3);noise(.12,{type:'lowpass',freq:500,vol:.12,when:.3});
  const g=gen;L.later(()=>{if(g!==gen)return;const x=e.clientX-s.left,y=Math.min(e.clientY,r.bottom-r.height*.25)-s.top;
    K.spawn(`<ellipse rx="11" ry="7" fill="#C9A468" opacity=".45"/><ellipse cx="-2" cy="-2" rx="6" ry="3" fill="#B98A4E" opacity=".35"/>`,x,y,{sz:44,s0:1.1,s1:.8,ms:800});
    K.cloud(r.left-s.left+r.width*.12,r.bottom-s.top-r.height*.18,2,'#FFFDF6',{sz:12,spread:26,up:14});K.cloud(r.right-s.left-r.width*.12,r.bottom-s.top-r.height*.18,2,'#FFFDF6',{sz:12,spread:26,up:14})},300);
}
/* cooking.spread: where the knife or spatula passes, a glossy grain stays a moment and melts in */
function grainer(col,edge){let lx=null,ly=null;
  return{frame:(F,t,W)=>{if(lx==null){lx=W.wx;ly=W.wy;return}const d=Math.hypot(W.wx-lx,W.wy-ly);if(d<18)return;K.streak(W.wx,W.wy,col(),Math.atan2(W.wy-ly,W.wx-lx)*180/Math.PI,{edge});lx=W.wx;ly=W.wy;if(Math.random()<.3)noise(.08,{freq:900,q:.8,vol:.05})},
    tap:(F,W)=>{[-1,1].forEach(q=>K.streak(W.wx+q*12,W.wy+q*4,col(),q*12,{edge}));lx=null}}}
/* cooking.chop: the knife lifts (ready), comes down (톡), bounces back; then() at the moment it lands */
function chop(target,then){
  const r=target.getBoundingClientRect(),s=stR(),sz=Math.max(120,r.width*1.1),kn=document.createElement('div');kn.className='bk-actor';kn.innerHTML=knifeSVG;
  Object.assign(kn.style,{width:sz+'px',height:sz+'px',left:(r.left-s.left+r.width*.5-sz*.45)+'px',top:(r.top-s.top-sz*.55)+'px',transformOrigin:'80% 20%'});fxEl.appendChild(kn);
  try{kn.animate([{transform:'translateY(-6%) rotate(0)',opacity:0},{transform:'translateY(-18%) rotate(-14deg)',opacity:1,offset:.3},{transform:'translateY(14%) rotate(4deg)',opacity:1,offset:.46},{transform:'translateY(6%) rotate(-2deg)',opacity:1,offset:.66},{transform:'translateY(-6%) rotate(0)',opacity:0}],{duration:620,easing:'ease-in-out',fill:'forwards'})}catch(_){}
  setTimeout(()=>kn.remove(),660);
  L.later(()=>{noise(.06,{freq:2600,vol:.22});tone(700,.05,'triangle',.1);then()},285);
}

/* ============================== processes ============================== */
const hit=(e,n,m=6)=>{const r=rectOf(n);return!!r&&!E[n].classList.contains('hide')&&inRect(e,r,m)};
const STEP={
  /* 재료 넣기: 밀가루 콕 3번, 우유 콕, 달걀 콕 2번 */
  add(){
    kind='tap';const seq=[...Array(N_FLOUR).fill('flour'),'milk',...Array(N_EGG).fill('egg')];S.addN=0;
    const NAME={flour:['밀가루','flour','한 컵 넣어요! 콕!','One cup! Tap!'],milk:['우유','milk','우유도 한 컵! 콕!','A cup of milk! Tap!'],egg:['달걀','egg','달걀을 톡 깨요! 콕!','Crack the egg! Tap!']};
    E.src.innerHTML=SRC.flour;intro(SRC.flour,'밀가루!','Flour!');say('밀가루를 콕 눌러 그릇에 넣어요!','Tap the flour into the bowl!',true);
    AIM=()=>ctr(E.src);HOT=()=>[E.src];
    H={down:e=>{if(!hit(e,'src',8))return false;if(busy||!tapOk())return;busy=true;G.stop();const k=seq[S.addN],n=++S.addN;S.cnt.add++;LOG.push('add:'+k);
      const g=gen,AT=k==='egg'?crackEgg(g):pourIt(k,g);
      L.later(()=>{if(g!==gen)return;if(k==='flour')S.bowl.f++;else if(k==='milk')S.bowl.m=1;else S.bowl.e++;draw();
        const same=S.addN<seq.length&&seq[S.addN]===k;say(k==='flour'?CNTK(S.bowl.f):k==='egg'?CNTK(S.bowl.e):NAME.milk[0]+'!',k==='flour'?CNTE(S.bowl.f):k==='egg'?CNTE(S.bowl.e):'Milk!');
        if(S.addN>=seq.length){H={};kind='wait';L.later(()=>{if(g===gen){SFX.sparkle();say('재료가 다 들어갔어요!','All in the bowl!');finish()}},600);busy=false;return}
        if(!same){const nk=seq[S.addN];E.src.innerHTML=SRC[nk];toolTray(SRC[nk]);E.src.classList.remove('bk-squish');void E.src.offsetWidth;E.src.classList.add('bk-squish');say(NAME[nk][2],NAME[nk][3])}
        busy=false;G.start({type:'tap',at:()=>stXY(...ctr(E.src)),ko:'콕 눌러 봐!',en:'Tap!'})},AT)}};
    guideAt(AIM,'tap','콕 눌러 봐!','Tap!');
  },
  stir(){
    kind='rub';S.bowl.stir=true;S.bowl.mix=0;draw();const stopI=intro(whiskSVG,'거품기!','Whisk!');say('거품기로 빙글빙글 저어요!','Whisk round and round!',true);HOT=()=>[];
    /* cooking.whisk: the whisk follows the finger round and round, the batter swirls with it (angle of the whisk around the bowl centre), drops fly, '착착' on every half turn */
    const sw=S.sw={a:0,v:0,drive:0,acc:0,last:null,lt:0,drop:0,bub:0,on:false,raf:0,spin:0},o={icon:whiskSVG,anchor:[.5,.9],gap:.3,log:'stir',stopIntro:stopI,effect:'rub',fx:()=>'',cells:BCELL.map(c=>[c[0]/200,c[1]/150]),grid:[4,2],rad:.12,target:()=>rectOf('bowl')};
    const inner=E.swirl.querySelector('.sw-in'),lA=E.swirl.querySelector('.sw-a'),lB=E.swirl.querySelector('.sw-b');E.swirl.style.opacity='1';
    const cen=()=>{const r=rectOf('bowl'),s=stR();return[r.left-s.left+r.width/2,r.top-s.top+r.height*64/150]};
    const paint=()=>{const r=E.swirl.getBoundingClientRect(),q=r.width?r.height/r.width:.37;inner.style.transform=`translateY(-50%) scaleY(${q.toFixed(3)}) rotate(${sw.a.toFixed(1)}deg)`;
      const m=S.bowl.mix||0;lA.style.opacity=(1-m).toFixed(2);lB.style.opacity=(.25+.6*m).toFixed(2);
      const w=o.el&&o.el.querySelector('.wk-w');if(w)w.style.transform=`scaleX(${(.45+.55*Math.abs(Math.cos(sw.a*Math.PI/90))).toFixed(3)})`};
    const loop=t=>{sw.raf=0;if(!tool||phase!=='stir')return;const dt=sw.lt?Math.min(.05,(t-sw.lt)/1000):.016;sw.lt=t;const d=sw.drive;sw.drive=0;
      if(sw.on&&d){sw.a+=d;sw.v=sw.v*.7+(d/Math.max(dt,.008))*.3}else{sw.a+=sw.v*dt;sw.v*=Math.exp(-dt*5)}
      sw.acc+=Math.abs(sw.a-(sw.pa==null?sw.a:sw.pa));sw.pa=sw.a;while(sw.acc>=180){sw.acc-=180;noise(.05,{freq:2200,q:3,vol:.06});tone(330+(S.bowl.mix||0)*180,.05,'sine',.04)}   // motion.soundSync
      paint();if(sw.on||Math.abs(sw.v)>4)sw.raf=requestAnimationFrame(loop);else sw.lt=0};
    const go=()=>{if(!sw.raf)sw.raf=requestAnimationFrame(loop)};
    o.touch=()=>{sw.on=true;sw.last=null;go();K.beat(E.bowl,'down')};o.release=()=>{sw.on=false;go();K.beat(E.bowl,'up')};
    o.frame=(F,t,W)=>{const [cx,cy]=cen(),ang=Math.atan2((W.wy-cy)/.4,W.wx-cx);
      if(sw.last!=null){let d=ang-sw.last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;if(Math.abs(d)<1.4)sw.drive+=d*180/Math.PI}sw.last=ang;go();
      if(Math.abs(sw.v)>240&&t-sw.drop>120){sw.drop=t;const sg=Math.sign(sw.v);K.drops(W.wx,W.wy,2,DOUGH,{sp:58,dir:sg*(Math.cos(ang)>0?.9:-.9),fan:.7,sz:14})}
      if((S.bowl.mix||0)>.35&&t-sw.bub>420){sw.bub=t;K.bubbles(cx+(Math.random()-.5)*60,cy,1,{edge:'#E2C79A',sz:12,up:26})}};
    /* one tap = one turn of the whisk: it draws a circle and the batter turns once */
    o.tapFx=(F,W)=>{sw.v+=(sw.v<0?-1:1)*1800;go();K.beat(E.bowl,'tap');const sv=o.el&&o.el.querySelector('svg');
      if(sv)try{sv.animate(Array.from({length:9},(_,i)=>{const a=i/8*Math.PI*2;return{transform:`translate(${(14*Math.sin(a)).toFixed(1)}%,${(5-5*Math.cos(a)).toFixed(1)}%)`}}),{duration:TAP_MS,easing:'linear'})}catch(_){}
      const [cx,cy]=cen();K.drops(cx,cy,3,DOUGH,{sp:50,sz:14})};
    o.progress=p=>{S.bowl.mix=p};
    o.cell=(i,v)=>{S.bowl.cells[i]=v};o.done=()=>{S.bowl.cells.fill(1);S.bowl.mix=1;paint();draw();SFX.sparkle();say('말랑말랑 반죽이 됐어요!','The dough is ready!');alMood('wow',900);finish()};
    rubTool(o);paint();
    guideAt(()=>ctr(E.bowl),'scrub','빙글빙글 저어 봐!','Stir stir!');
  },
  knead(){
    kind='tap';S.kn=0;E.lump.innerHTML=lumpSVG(0);toolTray(lumpSVG(.5));say('반죽을 꾹꾹 눌러요! 콕콕!','Press the dough! Tap tap!',true);AIM=()=>ctr(E.lump);HOT=()=>[E.lump];
    H={down:e=>{if(!hit(e,'lump',8))return false;if(busy||!tapOk())return;const k=++S.kn;S.cnt.knead++;LOG.push('knead');
      kneadFx(e,k);E.lump.innerHTML=lumpSVG(k/N_KNEAD);say(CNTK(k),CNTE(k));alMood('ticklish',500);
      if(k>=N_KNEAD){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g===gen){SFX.sparkle();say('부들부들 말랑해졌어요!','Soft and squishy!');finish()}},600)}}};
    guideAt(AIM,'tap','콕콕 눌러 봐!','Tap tap!');
  },
  place(){
    kind='tap';S.pl=0;toolTray(shapeSVG('ball',DOUGH,'#fff'));say('반죽을 콕! 동글동글 떼어서 판에 놓아요!','Tap the dough! Put round balls on the tray!',true);AIM=()=>ctr(E.lump);HOT=()=>[E.lump];
    H={down:e=>{if(!hit(e,'lump',8))return false;if(busy||!tapOk()||S.pl>=S.nb)return;busy=true;const k=S.pl++;S.cnt.made++;LOG.push('make');
      const lq=[G0.W/2,70,50,50];S.pcOn[k]=true;const p=E['pc'+k];p.innerHTML=pieceHTML('ball');jump(p,lq);lay();E.lump.classList.remove('bk-squish');void E.lump.offsetWidth;E.lump.classList.add('bk-squish');
      E.lump.style.opacity=String(Math.max(.25,1-.15*S.pl));tone(300+k*60,.12,'triangle',.2);sfx.pop();const g=gen;
      L.later(()=>{if(g!==gen)return;S.cnt.placed++;LOG.push('placed');say(CNTK(k+1),CNTE(k+1));alPlay('hop');busy=false;
        K.squash(p,.24,420,'50% 90%');tone(150,.1,'sine',.14);const [px,py]=stXY(...ctr(p));K.cloud(px,py+p.offsetHeight*.3,3,'#FFFDF6',{sz:12,spread:34,up:14});   // motion.squash: 빵이 판에 폭
        if(S.pl>=S.nb){H={};G.stop();kind='wait';E.lump.classList.add('hide');L.later(()=>{if(g===gen){SFX.sparkle();say('동글동글 '+S.nb+'개를 다 놓았어요!','All '+S.nb+' balls are on the tray!');finish()}},500)}},560)}};
    guideAt(AIM,'tap','반죽을 콕 눌러 봐!','Tap the dough!');
  },
  shape(){
    kind='cards';HOT=()=>[...tray.querySelectorAll('.bk-card')];
    cardsTray(SHP.map(k=>({svg:shapeSVG(k),label:SHK[k][0],log:k})),(i)=>{const k=SHP[i];S.shape=k;say(SHK[k][0]+'!',cap(SHK[k][1])+'!');
      for(let j=0;j<S.nb;j++)L.later(()=>{const p=E['pc'+j];p.innerHTML=pieceHTML(k);p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');tone(500+j*80,.1,'triangle',.18)},j*160);
      const g=gen;L.later(()=>{if(g===gen){alMood('wow',900);finish()}},S.nb*160+700)},'어떤 빵으로 만들까? 하나 골라 봐!','Which bread? Pick one!');
  },
  bake(){
    kind='tap';toolTray(ovenMini);say('오븐에 쏙! 오븐을 콕 눌러요!','Into the oven! Tap the oven!',true);AIM=()=>ctr(E.oven);HOT=()=>[E.oven];
    H={down:e=>{if(!hit(e,'oven',6)&&!hit(e,'sheet',6))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';LOG.push('bake');
      S.inOven=true;lay();E.sheet.classList.add('hide');E.oven.classList.add('on');sweepTone(300,500,.5,'sine',.12);say('쏙!','In!');const g=gen;
      L.later(()=>{if(g!==gen)return;for(let i=0;i<S.nb;i++){const pc=E['pc'+i];pc.classList.add('baked');const sv=pc.querySelector('svg');
          /* cooking.bake: 부풀어 오르고 노릇해짐 (rises past its size, settles) */
          if(sv)try{sv.style.transformOrigin='50% 85%';sv.animate([{transform:'scale(1)'},{transform:'scale(1.05,.96)',offset:.1},{transform:'scale(1.26,1.3)',offset:.72},{transform:'scale(1.1,1.12)',offset:.86},{transform:'scale(1.14)'}],{duration:3400,easing:'ease-in-out',fill:'forwards',delay:i*90})}catch(_){}}
        say('부풀어요! 노릇노릇!','Puffing up! Golden!');
        [900,2000].forEach(w=>L.later(()=>{if(g!==gen)return;const r=rectOf('oven'),s=stR();K.steam(r.left-s.left+r.width*.5,r.top-s.top+r.height*.55,2,{col:'#FFE6C2',op:.55,sz:26,up:26,gap:30})},w))},900);
      L.later(()=>{if(g!==gen)return;S.cnt.baked=S.nb;tone(1318,.5,'sine',.16);tone(1318,.5,'sine',.12,.35);say('땡! 다 구워졌어요!','Ding! All baked!');alMood('wow',900);finish()},900+3700)}};
    guideAt(AIM,'tap','오븐을 콕 눌러 봐!','Tap the oven!');
  },
  out(){
    kind='rub';S.openV=Array(6).fill(0);const stopI=intro(gloveSVG,'장갑!','Mitt!');say('장갑을 끼고 쓱쓱! 뜨거운 빵을 꺼내요!','Mitt on! Take out the hot bread!',true);HOT=()=>[];
    rubTool({icon:gloveSVG,anchor:[.5,.62],gap:.4,log:'out',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.3,.55],[.5,.55],[.7,.55],[.3,.75],[.5,.75],[.7,.75]],grid:[3,2],rad:.12,target:()=>rectOf('oven'),
      cell:(i,v)=>{S.openV[i]=v;const a=S.openV.reduce((x,y)=>x+y,0)/6;E.oven.style.setProperty('--op',(1-.8*a).toFixed(2))},
      tapFx:()=>{K.beat(E.oven,'tap');tone(260,.08,'sine',.08)},
      done:()=>{E.oven.style.setProperty('--op','.2');S.out=true;E.oven.classList.remove('on');lay();SFX.sparkle();say('뜨끈뜨끈! 잘 꺼냈어요!','Nice and hot! Well done!');alMood('wow',900);spark(...stXY(...ctr(E.oven)),2);
        const g=gen;[300,800,1300].forEach(w=>L.later(()=>{if(g!==gen)return;for(let i=0;i<S.nb;i++){const [x,y]=stXY(...ctr(E['pc'+i]));K.steam(x,y-E['pc'+i].offsetHeight*.3,2,{gap:16,sz:30,up:44})}},w));   // cooking.bake: 꺼내면 김이 모락모락
        finish()}});
    guideAt(()=>ctr(E.oven),'scrub','쓱쓱 문질러 봐!','Rub rub!');
  },
  jam(){
    kind='cards';HOT=()=>[...tray.querySelectorAll('.bk-card')];
    cardsTray(JAMS.map(j=>({svg:j.svg,label:j.ko,log:j.k})),i=>{S.jam=JAMS[i];say(S.jam.ko+'!',cap(S.jam.en)+'!');for(let p=0;p<S.nb;p++)E['pc'+p].querySelectorAll('.jam circle').forEach(c=>c.setAttribute('fill',S.jam.vivid));
      const g=gen;L.later(()=>{if(g===gen)finish()},800)},'잼을 발라 볼까? 하나 골라 봐!','Jam or butter? Pick one!');
  },
  spread(){
    kind='rub';const stopI=intro(knifeSVG,'버터칼!','Butter knife!');say('칼로 쓱쓱 발라요!','Spread it with the knife!',true);HOT=()=>[];
    const {SX}=G0,shX=2*SX+14,cells=[];for(let p=0;p<S.nb;p++){const q=slot(0,0,SX,p),o=SX*.2;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(d=>cells.push([.5+(q[0]+d[0]*o)/shX,.5+(q[1]+d[1]*o)/shX]))}
    const gr=grainer(()=>S.jam?S.jam.vivid:'#E5434F');
    rubTool({icon:knifeSVG,anchor:[.28,.8],gap:.4,log:'spread',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[4,4],rad:.1,target:()=>rectOf('sheet'),frame:gr.frame,tapFx:gr.tap,
      cell:(i,v)=>{const c=E['pc'+(i>>2)].querySelectorAll('.jam circle')[i&3];if(c)c.setAttribute('opacity',(v*.95).toFixed(2))},
      done:()=>{for(let p=0;p<S.nb;p++)E['pc'+p].querySelectorAll('.jam circle').forEach(c=>c.setAttribute('opacity','.95'));S.cnt.spread=S.nb;SFX.sparkle();say('맛있게 발랐어요!','Yummy!');alMood('wow',900);finish()}});
    guideAt(()=>ctr(E.sheet),'scrub','쓱쓱 발라 봐!','Spread spread!');
  },
  /* 상자에 담기 (빵) 또는 케이크 건네주기 */
  serve(){
    kind='tap';
    if(S.order==='bread'){
      toolTray(boxSVG(false));S.pk=0;say('빵을 콕 눌러서 상자에 담아요!','Tap each bread into the box!',true);
      const nextP=()=>{for(let i=0;i<S.nb;i++)if(!S.packed[i])return i;return-1};
      AIM=()=>{const i=nextP();return i<0?[0,0]:ctr(E['pc'+i])};HOT=()=>{const a=[];for(let i=0;i<S.nb;i++)if(!S.packed[i])a.push(E['pc'+i]);return a};
      H={down:e=>{let k=-1;for(let i=0;i<S.nb;i++)if(!S.packed[i]&&hit(e,'pc'+i,4))k=i;if(k<0)return false;if(busy||!tapOk())return;
        S.packed[k]=true;S.cnt.packed++;LOG.push('pack');lay();E.box.classList.remove('bk-squish');void E.box.offsetWidth;E.box.classList.add('bk-squish');sfx.pop();say(CNTK(S.cnt.packed),CNTE(S.cnt.packed));const g=gen;
        L.later(()=>{E['pc'+k]&&E['pc'+k].classList.add('hide');S.hidden.push('pc'+k)},520);
        if(S.cnt.packed>=S.nb){H={};G.stop();kind='wait';L.later(()=>{if(g!==gen)return;E.box.innerHTML=boxSVG(true);E.box.classList.add('bk-squish');SFX.sparkle();say('상자를 닫았어요!','The box is closed!');
          L.later(()=>{if(g===gen)give(E.box,boxSVG(true))},900)},700)}}};
      guideAt(AIM,'tap','빵을 콕 눌러 봐!','Tap a bread!');
    }else{
      toolTray(cakeMini);say('케이크를 콕 눌러서 건네줘요!','Tap the cake to give it!',true);AIM=()=>ctr(E.cake);HOT=()=>[E.cake];
      H={down:e=>{if(!hit(e,'cake',4))return false;H={};G.stop();kind='wait';give(E.cake,cakeMini)}};
      guideAt(AIM,'tap','케이크를 콕 눌러 봐!','Tap the cake!');
    }
  },
  /* 케이크 */
  cream(){
    kind='rub';const stopI=intro(spatulaSVG,'주걱!','Spatula!');say('주걱으로 쓱쓱! 하얀 크림을 발라요!','Spread the cream!',true);HOT=()=>[];
    const gr=grainer(()=>CREAM,'rgba(181,140,90,.35)');
    rubTool({icon:spatulaSVG,anchor:[.36,.58],gap:.35,log:'cream',stopIntro:stopI,effect:'rub',fx:()=>'',cells:CCELLS.map(c=>[c[0]/340,c[1]/270]),grid:[6,3],rad:.11,target:()=>rectOf('cake'),frame:gr.frame,tapFx:gr.tap,
      cell:(i,v)=>{S.cakeS.cream[i]=v},done:()=>{S.cakeS.cream.fill(1);draw();SFX.sparkle();say('하얀 크림이 가득!','Fluffy white cream!');alMood('wow',900);finish()}});
    guideAt(()=>ctr(E.cake),'scrub','쓱쓱 발라 봐!','Spread spread!');
  },
  pickFruit(){
    kind='cards';HOT=()=>[...tray.querySelectorAll('.bk-card')];
    cardsTray(FKEYS.map(k=>({svg:FR[k].whole,label:FR[k].ko,log:k})),i=>{const k=FKEYS[i];S.fruit=k;E.fruit.innerHTML=FR[k].whole;say(FR[k].ko+'!',cap(FR[k].en)+'!');const g=gen;L.later(()=>{if(g===gen){lay();L.later(()=>{if(g===gen)finish()},700)}},300)},'어떤 과일을 올릴까? 하나 골라 봐!','Which fruit? Pick one!');
    LAY_FRUIT=true;
  },
  cut(){
    kind='tap';S.cutN=0;toolTray(knifeSVG);intro(knifeSVG,'칼!','Knife!');say('과일을 콕콕! 잘라요!','Tap to cut the fruit!',true);AIM=()=>ctr(E.fruit);HOT=()=>[E.fruit];lay();
    H={down:e=>{if(!hit(e,'fruit',8))return false;if(busy||!tapOk()||S.cutN>=N_CUT)return;busy=true;const k=S.cutN++;S.cnt.cut++;LOG.push('cut');
      const g=gen;chop(E.fruit,()=>{if(g!==gen)return;   // cooking.chop: at the moment the knife lands
        const fq=[G0.W/2,G0.Hc-8-G0.SL-3,50,50];S.sl[k]='board';const p=E['sl'+k];p.innerHTML=FR[S.fruit].slice;jump(p,fq);lay();
        const sv=p.firstElementChild;if(sv)try{sv.animate([{transform:'translateY(-30%) rotate(-240deg) scale(.8)'},{transform:'translateY(-8%) rotate(-60deg)',offset:.6},{transform:'none'}],{duration:520,easing:'ease-out'})}catch(_){}
        E.fruit.firstElementChild.style.transform=`scale(${Math.max(.1,1-.2*S.cutN)})`;K.squash(E.fruit,.1,320);
        const [x,y]=stXY(...ctr(E.fruit));K.drops(x,y-10,3,FRC[S.fruit]||'#E0545C',{sp:46,sz:13})});
      L.later(()=>{if(g!==gen)return;say(CNTK(k+1),CNTE(k+1));busy=false;
        if(S.cutN>=N_CUT){H={};G.stop();kind='wait';E.fruit.classList.add('hide');L.later(()=>{if(g===gen){SFX.sparkle();say('다 잘랐어요!','All cut!');finish()}},500)}},520)}};
    guideAt(AIM,'tap','과일을 콕 눌러 봐!','Tap the fruit!');
  },
  top(){
    kind='tap';S.tp=0;toolTray(FR[S.fruit].slice);say('자른 과일을 콕! 케이크 위에 올려요!','Tap each piece onto the cake!',true);
    const nextS=()=>{for(let k=0;k<N_CUT;k++)if(S.sl[k]==='board')return k;return-1};
    AIM=()=>{const k=nextS();return k<0?[0,0]:ctr(E['sl'+k])};HOT=()=>{const a=[];for(let k=0;k<N_CUT;k++)if(S.sl[k]==='board')a.push(E['sl'+k]);return a};
    H={down:e=>{let k=-1;for(let i=0;i<N_CUT;i++)if(S.sl[i]==='board'&&hit(e,'sl'+i,4))k=i;if(k<0)return false;if(busy||!tapOk())return;
      const i=S.tp++,sp=FSPOT[i],q=cakeRect('small'),pt=cpt(q,sp[0],sp[1]);S.sl[k]={cake:[pt[0],pt[1],36,36]};S.cnt.topped++;LOG.push('top');lay();sfx.pop();
      const g=gen;L.later(()=>{if(g===gen){K.squash(E['sl'+k],.22,300,'50% 80%');tone(520,.05,'sine',.08)}},470);
      L.later(()=>{if(g!==gen)return;S.cakeS.slices.push({f:S.fruit,x:sp[0],y:sp[1]});draw();say(CNTK(i+1),CNTE(i+1))},520);
      L.later(()=>{if(g!==gen)return;S.hidden.push('sl'+k);E['sl'+k].classList.add('hide')},770);
      if(S.tp>=N_CUT){H={};G.stop();kind='wait';L.later(()=>{if(g===gen){SFX.sparkle();say('과일을 다 올렸어요!','All the fruit is on!');alMood('wow',900);finish()}},1200)}}};
    guideAt(AIM,'tap','과일을 콕 눌러 봐!','Tap a piece!');
  },
  pipe(){
    kind='tap';S.rs=0;S.pipeCol=pick(CC.length?CC:[{vivid:'#FF6F91'}]).vivid;toolTray(bagSVG(S.pipeCol));intro(bagSVG(S.pipeCol),'짤주머니!','Piping bag!');say('케이크 테두리를 콕콕! 크림 꽃을 짜요!','Tap around the edge to pipe cream flowers!',true);
    const free=()=>ROSE.map((p,i)=>i).filter(i=>!S.rosesAt[i]);AIM=()=>{const f=free();if(!f.length)return[0,0];const q=cakeRect('big'),r=rectOf('cake'),p=ROSE[f[0]];return[r.left+(p[0]/340)*r.width,r.top+(p[1]/270)*r.height]};HOT=()=>[E.cake];
    H={down:e=>{if(!hit(e,'cake',4))return false;if(busy||!tapOk())return;const f=free();if(!f.length)return;const r=rectOf('cake'),tx=(e.clientX-r.left)/r.width*340,ty=(e.clientY-r.top)/r.height*270;
      f.sort((a,b)=>Math.hypot(ROSE[a][0]-tx,ROSE[a][1]-ty)-Math.hypot(ROSE[b][0]-tx,ROSE[b][1]-ty));const i=f[0];S.rosesAt[i]=true;S.cakeS.roses.push({x:ROSE[i][0],y:ROSE[i][1],col:S.pipeCol});S.cnt.rose++;LOG.push('rose');draw();
      noise(.18,{type:'lowpass',freq:800,vol:.1});tone(660+S.cnt.rose*30,.08,'sine',.15);say(CNTK(S.cnt.rose),CNTE(S.cnt.rose));
      {const rr=rectOf('cake'),s=stR(),x=rr.left-s.left+ROSE[i][0]/340*rr.width,y=rr.top-s.top+ROSE[i][1]/270*rr.height;K.spawn(`<circle r="11" fill="${S.pipeCol}" stroke="${OL}" stroke-width="1.6"/><path d="M0 -6Q6 -6 6 0Q6 6 0 6Q-4 6 -4 1" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,x,y,{sz:34,s0:1.5,s1:.9,op:.9,ms:420,ease:'ease-out'})}   // motion.squash: 크림 꽃이 쭉
      if(S.cnt.rose>=N_ROSE){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g===gen){SFX.sparkle();say('예쁜 크림 꽃이 활짝!','Pretty cream flowers!');alMood('wow',900);finish()}},700)}}};
    guideAt(AIM,'tap','케이크를 콕 눌러 봐!','Tap the cake!');
  },
  candle(){
    kind='tap';S.cn=0;toolTray(candleSVG('#8FC3E6'));say('케이크에 초를 콕콕 꽂아요!','Tap to put candles on the cake!',true);AIM=()=>{const r=rectOf('cake'),p=CSPOT[S.cn]||CSPOT[0];return[r.left+(p[0]/340)*r.width,r.top+(p[1]/270)*r.height]};HOT=()=>[E.cake];
    H={down:e=>{if(!hit(e,'cake',20))return false;if(busy||!tapOk())return;const r=rectOf('cake'),tx=(e.clientX-r.left)/r.width*340,ty=(e.clientY-r.top)/r.height*270,fr=S.cd.map((c,i)=>i).filter(i=>!S.cd[i].on);if(!fr.length)return;
      fr.sort((a,b)=>Math.hypot(CSPOT[a][0]-tx,CSPOT[a][1]-ty)-Math.hypot(CSPOT[b][0]-tx,CSPOT[b][1]-ty));const i=fr[0];S.cd[i].on=true;S.cn++;S.cnt.cand++;LOG.push('candle');lay();E['cd'+i].classList.remove('drop');void E['cd'+i].offsetWidth;E['cd'+i].classList.add('drop');
      sfx.pop();say(CNTK(S.cn),CNTE(S.cn));if(S.cn>=N_CAND){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g===gen){say('초를 다 꽂았어요!','All the candles are on!');finish()}},700)}}};
    guideAt(AIM,'tap','케이크를 콕 눌러 봐!','Tap the cake!');
  },
  light(){
    kind='rub';const stopI=intro(matchSVG,'성냥!','Match!');say('불씨를 초에 대 봐! 불이 켜져요!','Touch the candles with the match!',true);HOT=()=>[];
    const union=()=>{const rs=S.cd.map((c,i)=>E['cd'+i].getBoundingClientRect());const l=Math.min(...rs.map(r=>r.left)),t=Math.min(...rs.map(r=>r.top)),rr=Math.max(...rs.map(r=>r.right)),b=Math.max(...rs.map(r=>r.bottom));return{left:l,top:t,width:rr-l,height:b-t,right:rr,bottom:b}};
    const cells=S.cd.map((c,i)=>{const r=E['cd'+i].getBoundingClientRect(),u=union();return[(r.left+r.width/2-u.left)/u.width,(r.top+r.height*.28-u.top)/u.height]});
    rubTool({icon:matchSVG,anchor:[.5,.05],gap:.5,log:'light',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[3,1],rad:.14,target:union,
      tapFx:(F,W)=>{K.spawn(ICON_SPARK,W.wx,W.wy,{sz:22,dy:-26,s0:.6,s1:1.1,ms:500})},
      cell:(i,v)=>{if(v>=.35&&!S.cd[i].lit){S.cd[i].lit=true;S.cnt.lit++;E['cd'+i].classList.add('lit');tone(700+i*120,.12,'sine',.16);LOG.push('lit');const [x,y]=stXY(...ctr(E['cd'+i]));for(let q=0;q<3;q++)K.spawn(ICON_SPARK,x+(q-1)*14,y-E['cd'+i].offsetHeight*.42,{sz:18,dy:-30,dx:(q-1)*8,s0:.5,s1:1,ms:600})}},
      done:()=>{S.cd.forEach((c,i)=>{if(!c.lit){c.lit=true;S.cnt.lit++;E['cd'+i].classList.add('lit')}});SFX.sparkle();say('생일 축하 노래를 불러요!','Let\'s sing a birthday song!');alPlay('dance');
        [523,523,587,523,698,659].forEach((f,i)=>tone(f,.34,'triangle',.12,i*.42));const g=gen;L.later(()=>{if(g===gen)say('짝짝짝! 후~ 불어 봐요!','Clap clap! Now blow!')},2700);L.later(()=>{if(g===gen)finish()},3100)}});
    guideAt(()=>{const r=E.cd1?E.cd1.getBoundingClientRect():stR();return[r.left+r.width/2,r.top+r.height*.3]},'scrub','불씨를 초에 대 봐!','Touch the candles!');
  },
  blow(){
    kind='tap';S.bl=0;toolTray(candleSVG('#EDA468'));say('초를 콕콕! 후~ 불어서 꺼요!','Tap the candles to blow them out!',true);
    const next=()=>S.cd.findIndex(c=>c.lit);AIM=()=>{const i=next();return i<0?[0,0]:ctr(E['cd'+i])};HOT=()=>S.cd.filter(c=>c.lit).map((c,i)=>E['cd'+S.cd.indexOf(c)]);
    H={down:e=>{let k=-1;S.cd.forEach((c,i)=>{if(c.lit&&hit(e,'cd'+i,4))k=i});if(k<0)return false;if(busy||!tapOk())return;S.cd[k].lit=false;E['cd'+k].classList.remove('lit');S.cnt.blown++;LOG.push('blow');
      const c=ctr(E['cd'+k]),[x,y]=stXY(c[0],c[1]-40);const sm=document.createElement('div');sm.className='bk-smoke';Object.assign(sm.style,{left:(x-15)+'px',top:(y-15)+'px'});fxEl.appendChild(sm);try{sm.animate([{opacity:.8,transform:'translateY(0) scale(.6)'},{opacity:0,transform:'translateY(-50px) scale(1.6)'}],{duration:1100,fill:'forwards'})}catch(_){}setTimeout(()=>sm.remove(),1200);
      noise(.3,{type:'bandpass',freq:1400,vol:.1});say('후~','Whoosh!');
      if(S.cd.every(c=>!c.lit)){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g===gen){SFX.sparkle();say('촛불이 다 꺼졌어요!','All blown out!');finish()}},700)}}};
    guideAt(AIM,'tap','촛불을 콕 눌러 봐!','Tap a candle!');
  }
};
let LAY_FRUIT=false;

/* ---------- ending: hand it over, yum, a heart ---------- */
function give(fromEl,html){
  phase='serve';const g=gen,cr=custEl.getBoundingClientRect(),fr=fromEl.getBoundingClientRect();LOG.push('serve');
  fromEl.classList.add('hide');
  fly(html,[fr.left+fr.width/2,fr.top+fr.height/2],[cr.left+cr.width/2,cr.top+cr.height*.7],Math.min(fr.width,140),50,900,()=>{if(g!==gen)return;
    /* cooking.serve: 두 손으로 받아 들고 킁킁 → 한 입 크게 → 볼 볼록 */
    const later=(fn,ms)=>L.later(()=>{if(g===gen)fn()},ms);say('킁킁, 냄새 좋다!','Sniff sniff, smells good!');
    later(()=>{const p=pick(VO.praise||[{ko:'맛있다!',en:'Yummy!'}]);say('냠냠! '+p.ko,'Yum yum! '+p.en)},2000);
    work.style.transition='opacity .4s';work.style.opacity='0';bubEl.hidden=true;
    K.eat({cust:custEl,kind:S.kind,grow:1.9,origin:'100% 0%',food:S.order==='cake'?cakeSliceSVG(S.fruit):breadFood(),draw:m=>drawCust(m),later,log:x=>LOG.push(x),crumb:S.order==='cake'?SPONGE:CRUST_L,
      done:()=>{drawCust('happy');alPlay('dance');SFX.sparkle();later(heart,1800)}})});
}
const breadFood=()=>`<svg viewBox="0 0 100 100">${shapeInner(S.shape||'ball',CRUST,CRUST_L)}${S.jam&&S.cnt.spread?`<path d="M30 52Q50 40 70 52Q66 66 50 64Q34 66 30 52Z" fill="${S.jam.vivid}" opacity=".95"/>`:''}</svg>`;
const cakeSliceSVG=f=>`<svg viewBox="0 0 100 100"><path d="M10 52L90 36V78L10 94Z" fill="${SPONGE}" ${S3}/><path d="M10 73L90 57" stroke="${CREAM}" stroke-width="7"/><path d="M10 52L90 36L76 26L4 42Z" fill="${CREAM}" ${S3}/>${f&&FR[f]?`<g transform="translate(30 14) scale(.32)">${svgInner(FR[f].slice)}</g>`:''}</svg>`;
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-60],50,40,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('안녕! 또 올게요!','Bye! See you again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');bubEl.hidden=true;
      L.later(()=>{if(g===gen)newRound()},1400)},1500)},1100);
}

/* ---------- a new round: the shop front first ---------- */
function lobbyOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';K.clear();tray.innerHTML='';tray.onpointerdown=null;busy=false;
  if(al){al.detach();al=null}lobbyOff();custEl.classList.remove('leave','enter','bk-hold');custEl.getAnimations().forEach(a=>a.cancel());
  lv=levelInfo(levelNo());const orders=makeOrders(lv),kinds=shuffle(KINDS.slice()).slice(0,3);
  S={view:'lobby',orders,kinds,order:null,kind:null,nb:N_BALL,hidden:[],pcOn:[],packed:[],sl:[],cd:CSPOT.map(()=>({on:false,lit:false})),rosesAt:[],pl:0,cutN:0,inOven:false,out:false,fruit:null,shape:null,jam:null,
    cnt:{add:0,knead:0,made:0,placed:0,baked:0,spread:0,packed:0,cut:0,topped:0,rose:0,cand:0,lit:0,blown:0},bowl:null,cakeS:null};
  work.innerHTML='';E={};LAY_FRUIT=false;plan=[];pi=0;phase='lobby';kind='tap';HOT=()=>[...lobbyEl.querySelectorAll('.bk-lc')];
  LOG.push('level:'+lv.level,'orders:'+orders.join('+'));
  lobbyEl.querySelectorAll('.bk-lc').forEach(b=>b.remove());
  kinds.forEach((k,i)=>{const b=document.createElement('button');b.className='bk-lc';b.dataset.i=i;b.setAttribute('aria-label','손님');
    b.innerHTML=`<span class="lc-ani">${A.animal(k,'idle',{})}</span><span class="lc-bub">${orders[i]==='cake'?cakeMini:breadBub}</span>`;lobbyEl.appendChild(b)});
  showView('lobby');strip();size();
  if(M.Alive){lobbyEl.querySelectorAll('.lc-ani').forEach((e,i)=>lobbyAl.push(M.Alive.attach(e,{kind:kinds[i],waiting:true})));turns=M.Alive.takeTurns(lobbyAl);const t=turns;L.onEnd(lobbyOff)}
  AIM=()=>{const b=lobbyEl.querySelector('.bk-lc:nth-child(3)');return b?ctr(b):[0,0]};
  say('어서 오세요! 누구를 도와줄까? 친구를 콕!','Welcome! Who do we help? Tap a friend!',true);
  H={down:e=>{const bs=[...lobbyEl.querySelectorAll('.bk-lc')];const i=bs.findIndex(b=>inRect(e,b.getBoundingClientRect(),4));if(i<0)return false;if(busy)return;busy=true;choose(i)}};
  const g=gen;L.later(()=>{if(g===gen)G.start({type:'tap',at:()=>stXY(...AIM()),ko:'친구를 콕 눌러 봐!',en:'Tap a friend!'})},800);
}
function choose(i){
  const g=gen,bs=[...lobbyEl.querySelectorAll('.bk-lc')];G.stop();H={};LOG.push('customer:'+S.orders[i]);
  bs.forEach((b,j)=>b.classList.add(j===i?'sel':'gone'));sfx.pop();
  S.order=S.orders[i];S.kind=S.kinds[i];DATA.last=S.order;save();
  say(S.order==='cake'?'케이크 주세요!':'빵 주세요!',S.order==='cake'?'Cake, please!':'Bread, please!');
  L.later(()=>{if(g!==gen)return;lobbyOff();startWork()},1300);
}
function startWork(){
  const g=gen;
  const pre=!lv.add;S.bowl={f:pre?N_FLOUR:0,m:pre?1:0,e:pre?N_EGG:0,cells:BCELL.map(()=>0),stir:false,pre};S.cakeS={cream:CCELLS.map(()=>0),slices:[],roses:[]};
  if(S.order==='bread'){
    mkIt('board','','bk-board');mkIt('bowl','');mkIt('swirl',`<div class="sw-in"><div class="sw-b">${SWIRL_B}</div><div class="sw-a">${SWIRL_A}</div></div>`,'bk-swirl');mkIt('src','');mkIt('lump',lumpSVG(0));mkIt('oven',ovenSVG,'bk-oven');mkIt('sheet',sheetSVG);
    for(let i=0;i<S.nb;i++)mkIt('pc'+i,pieceHTML('ball'),'bk-pc');mkIt('box',boxSVG(false));
  }else{
    mkIt('cake','');mkIt('fruit','');for(let k=0;k<N_CUT;k++)mkIt('sl'+k,'');S.sl=Array(N_CUT).fill(null);CSPOT.forEach((c,i)=>mkIt('cd'+i,candleSVG(pick(CC.length?CC:[{hex:'#8FC3E6'}]).hex),'bk-cd'));
  }
  plan=planFor(S.order,lv);pi=0;showView('work');work.style.opacity='';
  if(al){al.detach();al=null}drawCust('sad');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:S.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=S.order==='cake'?cakeMini:breadBub;bubEl.hidden=true;
  phase='enter';kind='wait';strip();size();draw();
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;say(S.order==='cake'?'안녕! 케이크를 만들어 줘!':'안녕! 맛있는 빵을 만들어 줘!',S.order==='cake'?'Hi! Please make me a cake!':'Hi! Please bake me some bread!')},1200);
  L.later(()=>{if(g!==gen)return;run()},3400);
}
function draw(){
  if(!S||S.view!=='work')return;
  if(E.bowl)E.bowl.innerHTML=bowlSVG(S.bowl);
  if(E.cake)E.cake.innerHTML=cakeSVG(S.cakeS);
}

/* ---------- test hooks ---------- */
const HAND_OF={add:'tap',stir:'rub',knead:'tap',place:'tap',shape:'choose',bake:'tap',out:'rub',jam:'choose',spread:'rub',cream:'rub',pickFruit:'choose',cut:'tap',top:'tap',pipe:'tap',candle:'tap',light:'rub',blow:'tap'};
M.__bakeLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__bake=()=>{
  const k=plan[pi]||null;let aim=null;try{aim=AIM?AIM():null}catch(e){}const sr=stR();
  let hot=[];try{hot=HOT().filter(Boolean).map(e=>{const r=e.getBoundingClientRect();return{w:e.offsetWidth,h:e.offsetHeight,x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})}catch(e){}
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,view:S&&S.view,order:S&&S.order,orders:S?S.orders.slice():[],
    rect:{x:sr.left,y:sr.top,w:sr.width,h:sr.height},cellPts:tool?tool.cellPts():[],toolOn:!!tool,cards:[...tray.querySelectorAll('.bk-card')].length,hot,
    custPts:[...lobbyEl.querySelectorAll('.bk-lc')].map(b=>ctr(b)),cnt:S?Object.assign({},S.cnt):{},nb:S?S.nb:0,shape:S&&S.shape,fruit:S&&S.fruit,
    pieces:S&&S.order==='bread'?Array.from({length:S.nb},(_,i)=>({baked:E['pc'+i]&&E['pc'+i].classList.contains('baked')})):[],slices:S&&S.cakeS?S.cakeS.slices.length:0,roses:S&&S.cakeS?S.cakeS.roses.length:0,
    alive:al?al.state():null,lobbyAlive:lobbyAl.length,misses,guide:G.state(),served:DATA.served,log:LOG.slice(),
    parts:K.stats(),mix:S&&S.bowl?+(S.bowl.mix||0).toFixed(3):0,swirl:S&&S.sw?{a:+S.sw.a.toFixed(1),v:Math.round(S.sw.v)}:null,
    toolBox:(()=>{const t=[...stage.querySelectorAll('.tl-tool')].find(e=>e.style.display==='block');if(!t)return null;const q=t.getBoundingClientRect();return{x:q.left+q.width/2,y:q.top+q.height/2,w:q.width,whisk:!!t.querySelector('.wk-w'),tf:t.style.transform}})()};
};
M.__bakeDepth=()=>{
  const v=levelInfo(levelNo()),os=v.cake?['bread','cake']:['bread'];
  const rows=os.map(o=>{const p=planFor(o,v).filter(x=>x!=='serve'),work=p.filter(x=>HAND_OF[x]!=='choose');return{order:o,processes:new Set(work).size,hands:[...new Set(p.map(x=>HAND_OF[x]))]}});
  const hands=[...new Set(rows.flatMap(r=>r.hands))];
  return{level:levelNo(),processes:Math.min(...rows.map(r=>r.processes)),handActions:hands,customer:!!M.Alive,choice:true,ending:true,byOrder:rows};
};
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';K.clear();tray.onpointerdown=null;lobbyOff();if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* tile picture on the home screen */
document.querySelectorAll('.tile[data-go="bakery"] .ic').forEach(ic=>{
  ic.innerHTML=`<svg viewBox="0 0 100 100" style="width:1.5em;height:1.5em;overflow:visible"><g transform="translate(-6 10) scale(.62)">${svgInner(cakeMini)}</g><g transform="translate(36 -2) scale(.6)">${svgInner(shapeSVG('croissant'))}</g></svg>`;
});
})();
