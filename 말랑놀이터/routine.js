/* 말랑 하루 일과 (P8-나) — 토토의 하루를 아이가 돌봐 줘요: 일어나기 · 양치 · 밥 · 옷 · 목욕 · 잠.
   쇠규칙(MLCFG.rules): 글자 없음 · 다음 버튼 없음(장면이 끝나면 1.5초 이음 장면에 해가 움직이고 저절로 다음으로) · 세 구역 · 이모지 없음(그림은 모두 여기서 직접 그림).
   단계: ML.Progress.get("routine").level, 없으면 1단계 고정(ML.__routineLevel). 시험용: ML.__routine(), ML.__routineDepth(). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,noise,sweepTone,SFX}=P;
const id='routine2',GID='routine',L=life(id),OL=A.OL,S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`,S2=`stroke="${OL}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
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
#routine2{gap:6px}
#routine2 .rt-head{flex:none;height:${HEAD_PX}px;gap:8px}
#routine2 .rt-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#routine2 .rt-back svg{width:100%;height:100%;display:block}
.rt-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.rt-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.rt-strip span svg{width:72%;height:72%;display:block}
.rt-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.rt-strip span.done{opacity:.9}
.rt-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.rt-strip span .st svg{width:100%;height:100%}
.rt-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC}
.rt-stage>div{position:absolute}
.rt-it{position:absolute;pointer-events:none;transition:left .5s ease-in-out,top .5s ease-in-out,width .5s ease-in-out,height .5s ease-in-out,opacity .35s,transform .3s}
.rt-it svg{width:100%;height:100%;display:block;overflow:visible}
.rt-it.hide{opacity:0;visibility:hidden}
.rt-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.rt-float{position:absolute;pointer-events:none;will-change:transform}
.rt-float svg{width:100%;height:100%;display:block;overflow:visible}
.rt-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.rt-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.rt-tool svg{width:100%;height:100%;display:block}
.rt-tool.in{animation:rtcard .3s ease-out both}
.rt-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:12px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.rt-card svg{width:100%;height:100%;display:block;pointer-events:none}
.rt-card.in{animation:rtcard .3s ease-out both}
.rt-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.rt-card.fade{opacity:.35}
@keyframes rtcard{from{transform:translateY(24px);opacity:0}}
@keyframes rtsquish{0%{transform:scale(1)}35%{transform:scale(1.14,.82)}70%{transform:scale(.94,1.08)}100%{transform:scale(1)}}
@keyframes rtnope{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.rt-squish{animation:rtsquish .5s ease-out}
.rt-nope{animation:rtnope .45s}
.rt-callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
`;
const kst=document.createElement('style');kst.textContent=kcss;document.head.appendChild(kst);
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar rt-head"><button class="round rt-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="rt-strip" id="routine2Strip"></div></div><div class="rt-stage" id="routine2Stage"></div><div class="rt-tray" id="routine2Tray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='하루일과';
const $=s=>sec.querySelector(s);
const stage=$('#routine2Stage'),stripEl=$('#routine2Strip'),tray=$('#routine2Tray');
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0,last:''},store.get('mallang_routine2',{}));
const save=()=>store.set('mallang_routine2',DATA);
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
function miss(){misses++;G.nudge();if(custEl){custEl.classList.remove('rt-callme');void custEl.offsetWidth;custEl.classList.add('rt-callme');setTimeout(()=>custEl&&custEl.classList.remove('rt-callme'),700)}
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
function toolTray(html){tray.innerHTML=`<div class="rt-tool in">${html}</div>`;return tray.querySelector('.rt-tool')}
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='rt-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-40}px) scale(${(1+k)/2})`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}
  catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);
}
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});
const spark=(x,y,n=3)=>{for(let k=0;k<n;k++){const g=document.createElement('div');g.className='rt-float';g.innerHTML=ICON.glint;const sz=22+rand(12);Object.assign(g.style,{width:sz+'px',height:sz+'px',left:(x-sz/2+rand(50)-25)+'px',top:(y-sz/2+rand(40)-20)+'px'});fxEl.appendChild(g);
  try{g.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1)',opacity:1,offset:.4},{transform:'scale(.5) translateY(-20px)',opacity:0}],{duration:1100,delay:k*120,fill:'forwards'})}catch(e){}setTimeout(()=>g.remove(),1500)}};
/* one tool step through ML.P2.makeTool: the tool follows the finger, only touched cells change, holding still also finishes */
function rubTool(o){
  killTool();
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,rub:o.rub,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[4,4],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,sound:o.hold?()=>P.holdSound(o.hold):null,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log)},onRelease:()=>G.release(),
    onCell:(i,v)=>{o.cell(i,v);rd()},
    onProgress:(p,ratio,why)=>{if(o.progress)o.progress(p,ratio);if(!o.hold&&(why==='move'||why==='hold')){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}
/* up to three picture cards in the tray; a choice has no wrong answer */
function cardsTray(items,onPick,ko,en){
  kind='cards';let lock=0;const ph=phase;
  tray.innerHTML=items.map((c,k)=>`<button class="rt-card in" data-i="${k}" aria-label="${c.label||''}" style="animation-delay:${k*60}ms">${c.svg}</button>`).join('');
  if(ko)say(ko,en,true);
  G.start({type:'tap',wait:true,at:()=>{const b=tray.querySelector('.rt-card');return b?stXY(...ctr(b)):[0,0]}});
  tray.onpointerdown=e=>{const b=e.target.closest('.rt-card');if(!b||phase!==ph||b.classList.contains('sel'))return;e.preventDefault();const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();
    b.classList.add('sel');tray.querySelectorAll('.rt-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();tray.onpointerdown=null;G.stop();kind='wait';AIM=null;LOG.push('pick:'+(items[+b.dataset.i].log||b.dataset.i));onPick(+b.dataset.i,b)};
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
const fxEl=document.createElement('div');fxEl.className='rt-fx';stage.appendChild(fxEl);

/* ============================== 하루 일과 (P8-나) ==============================
   토토의 하루를 아이가 돌봐 줘요. 일어나기 → 양치 → 밥 → 옷 → 목욕 → 잠. 창밖 해가 아침에서 밤으로 움직여요.
   장면 (MLCFG.games.routine.scenes): 손동작이 장면마다 있고, 장면 사이 1.5초 이음 장면에 해가 움직입니다. 글자 버튼 없음. */
const SC_ORDER=['wake','teeth','eat','dress','bath','sleep'];
const SC_STEPS={wake:['curtain','rouse'],teeth:['pasteColor','paste','brush','rinse'],eat:['food','spoon','wipe'],dress:['outfit','putOn'],bath:['water','foam','shower','towel'],sleep:['pajama','book','cover','lamp']};
const SC_OF={};Object.keys(SC_STEPS).forEach(k=>SC_STEPS[k].forEach(s=>SC_OF[s]=k));
const SC_SKY={wake:0,teeth:.1,eat:.3,dress:.5,bath:.75,sleep:1};   /* not in config: where the sun is in each scene (0 sunrise … 1 night) */
const N_FOOD=num((GC.scenes||{}).eat&&GC.scenes.eat[0],0,3),N_BITE=num((GC.scenes||{}).eat&&GC.scenes.eat[1],0,3);
function levelInfo(n){
  const f={level:n,scenes:[]};const have={};
  LV.slice(0,n).forEach(l=>{const t=l.new||'';
    if(/일어나기/.test(t))have.wake=1;if(/양치/.test(t))have.teeth=1;if(/밥/.test(t))have.eat=1;if(/옷 입기/.test(t))have.dress=1;if(/목욕/.test(t))have.bath=1;
    if(/잠자기|여섯/.test(t))SC_ORDER.forEach(k=>have[k]=1)});
  f.scenes=SC_ORDER.filter(k=>have[k]);return f;
}
const planFor=v=>{const p=[];v.scenes.forEach(k=>p.push(...SC_STEPS[k]));p.push('serve');return p};
const CNTK=k=>M.CNT_KO[k-1]+'!',CNTE=k=>cap(M.CNT_EN[k-1])+'!';

/* ============================== pictures ============================== */
const handSVG=`<svg viewBox="0 0 100 100"><path d="M30 94V54Q16 50 18 38Q20 30 28 34L32 22Q36 14 42 18L45 11Q51 5 57 11L59 20Q67 14 71 22Q76 28 72 38L74 54Q76 74 70 94Z" fill="#FFE0C4" ${S3}/>${FACE(50,56,1)}</svg>`;
const brushSVG=(paste)=>`<svg viewBox="0 0 100 100"><rect x="44" y="40" width="14" height="56" rx="7" fill="#8FC3E6" ${S3} transform="rotate(14 51 68)"/><rect x="26" y="8" width="42" height="26" rx="9" fill="#fff" ${S3}/><path d="M34 8V2M43 8V0M52 8V2M61 8V0" stroke="#A7CFE8" stroke-width="5" stroke-linecap="round"/>${paste?`<ellipse cx="47" cy="6" rx="18" ry="7" fill="${paste}" ${S2}/>`:''}${FACE(52,70,.8)}</svg>`;
const spongeSVG=`<svg viewBox="0 0 100 100"><rect x="14" y="26" width="72" height="50" rx="13" fill="#F4D96B" ${S3}/><path d="M14 58H86V63Q86 76 73 76H27Q14 76 14 63Z" fill="#8FC48A" ${S3}/>${FACE(50,45,1)}</svg>`;
const showerSVG=`<svg viewBox="0 0 100 100"><path d="M44 52H56L60 94H40Z" fill="#A7CFE8" ${S3}/><rect x="28" y="8" width="44" height="46" rx="18" fill="#E6EAF0" ${S3}/><path d="M34 54H66L60 70H40Z" fill="#9AA2B1" ${S3}/>${FACE(50,28,1)}</svg>`;
const towelSVG=`<svg viewBox="0 0 100 100"><rect x="12" y="24" width="76" height="52" rx="11" fill="#CFE5F4" ${S3}/><path d="M12 40H88M12 60H88" stroke="#8FC3E6" stroke-width="5"/>${FACE(50,50,1)}</svg>`;
const spoonSVG=`<svg viewBox="0 0 100 100"><path d="M46 46L40 92" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M46 46L40 92" stroke="#E6B07A" stroke-width="8" stroke-linecap="round"/><ellipse cx="50" cy="26" rx="26" ry="22" fill="#DDE3EA" ${S3}/>${FACE(50,26,1)}</svg>`;
const napkinSVG=`<svg viewBox="0 0 100 100"><path d="M14 22L86 14L90 78L10 86Z" fill="#FFFDF9" ${S3}/><path d="M14 22L86 14L90 78L10 86Z" fill="none" stroke="#F6D3DB" stroke-width="5" stroke-dasharray="4 6" transform="scale(.86) translate(8 8)"/>${FACE(50,50,1)}</svg>`;
const tubeSVG=c=>`<svg viewBox="0 0 100 100"><path d="M30 26H70L66 86Q50 94 34 86Z" fill="${c}" ${S3}/><rect x="40" y="10" width="20" height="18" rx="5" fill="#fff" ${S3}/><path d="M36 40L64 36M36 58L64 54" stroke="#fff" stroke-width="5" opacity=".7" stroke-linecap="round"/></svg>`;
const cupSVG=`<svg viewBox="0 0 100 100"><path d="M24 22H76L68 90Q50 96 32 90Z" fill="#FFFDF9" ${S3}/><path d="M27 44H73L69 88Q50 94 31 88Z" fill="#CFE5F4"/><path d="M76 34Q96 34 94 52Q92 68 70 68" fill="none" ${S3}/></svg>`;
const faucetSVG=`<svg viewBox="0 0 110 110"><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="${OL}" stroke-width="20" stroke-linecap="round"/><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="#DDE3EA" stroke-width="12" stroke-linecap="round"/><rect x="68" y="62" width="24" height="12" rx="4" fill="#9AA2B1" ${S3}/><circle cx="24" cy="46" r="13" fill="#8FC3E6" ${S3}/><path d="M24 36V56M14 46H34" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/></svg>`;
const switchSVG=`<svg viewBox="0 0 100 100"><rect x="14" y="8" width="72" height="84" rx="16" fill="#FFFDF9" ${S3}/><rect x="36" y="22" width="28" height="56" rx="10" fill="#E8D8BF" ${S3}/><rect x="38" y="24" width="24" height="26" rx="8" fill="#F0D58A" ${S2}/></svg>`;
const bookSVG=`<svg viewBox="0 0 200 100"><path d="M6 20Q50 6 100 22Q150 6 194 20V90Q150 78 100 92Q50 78 6 90Z" fill="#F1DDBA" ${S3}/><path d="M100 22V92" stroke="${OL}" stroke-width="3"/><path d="M14 28Q50 18 92 30V82Q50 72 14 82Z" fill="#FFFDF9"/><path d="M108 30Q150 18 186 28V82Q150 72 108 82Z" fill="#FFFDF9"/><g transform="translate(52 56)"><path d="M0 -18L5 -6L18 -5L8 4L11 17L0 10L-11 17L-8 4L-18 -5L-5 -6Z" fill="#F0D58A" ${S2}/></g><g transform="translate(148 56)"><path d="M-10 -16A18 18 0 1 0 12 10A14 14 0 1 1 -10 -16Z" fill="#C3B4E6" ${S2}/></g></svg>`;
const bookPage=`<svg viewBox="0 0 100 100"><path d="M4 20Q30 10 96 26V88Q30 74 4 82Z" fill="#FFFDF9" ${S3}/><g transform="translate(46 54)"><circle r="16" fill="#F6D3DB" ${S2}/></g></svg>`;
const bedSVG=`<svg viewBox="0 0 100 60" preserveAspectRatio="none"><rect x="0" y="6" width="100" height="54" rx="6" fill="#D9A066" stroke="${OL}" stroke-width="1.2"/><rect x="4" y="10" width="92" height="46" rx="4" fill="#F6D3DB"/></svg>`;
const blanketSVG=`<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M0 8Q50 0 100 8V60H0Z" fill="#A7CFE8" stroke="${OL}" stroke-width="1.2"/><path d="M0 8Q50 0 100 8" fill="none" stroke="#fff" stroke-width="4" opacity=".6"/><g fill="#fff" opacity=".7"><circle cx="20" cy="28" r="3"/><circle cx="48" cy="38" r="3"/><circle cx="76" cy="26" r="3"/><circle cx="34" cy="50" r="3"/><circle cx="64" cy="52" r="3"/></g></svg>`;
const tubFront=`<svg viewBox="0 0 100 50" preserveAspectRatio="none"><path d="M0 4H100V34Q100 48 86 48H14Q0 48 0 34Z" fill="#FFFDF9" stroke="${OL}" stroke-width="1.4"/><path d="M4 12H96" stroke="#CFE5F4" stroke-width="4" stroke-linecap="round"/><g class="wt"><path d="M6 4H94V30Q94 44 82 44H18Q6 44 6 30Z" fill="#A7CFE8" opacity=".85"/><circle cx="24" cy="14" r="3" fill="#fff"/><circle cx="64" cy="22" r="4" fill="#fff"/></g></svg>`;
const REG={rice:`<svg viewBox="0 0 100 100"><path d="M10 54H90Q88 88 50 90Q12 88 10 54Z" fill="#A7CFE8" ${S3}/><path d="M16 56Q20 22 50 20Q80 22 84 56Z" fill="#fff" ${S3}/><circle cx="40" cy="38" r="3" fill="#E2D9CB"/><circle cx="58" cy="32" r="3" fill="#E2D9CB"/></svg>`,
  egg:`<svg viewBox="0 0 100 100"><path d="M18 52Q14 24 44 20Q86 16 84 54Q82 84 48 84Q22 84 18 52Z" fill="#fff" ${S3}/><circle cx="50" cy="50" r="17" fill="#F5B83D" ${S3}/></svg>`,
  fish:`<svg viewBox="0 0 100 100"><path d="M10 50Q40 18 70 40L92 22V78L70 60Q40 82 10 50Z" fill="#F2B48C" ${S3}/><circle cx="28" cy="46" r="4" fill="${OL}"/></svg>`,
  carrot:`<svg viewBox="0 0 100 100"><path d="M18 40Q60 26 88 62Q60 86 18 62Q10 50 18 40Z" fill="#F29A4A" ${S3}/><path d="M18 50L6 40M18 54L4 56" stroke="#6DAE5A" stroke-width="6" stroke-linecap="round"/></svg>`,
  broccoli:`<svg viewBox="0 0 100 100"><rect x="42" y="56" width="16" height="34" rx="6" fill="#B7D88F" ${S3}/><circle cx="34" cy="46" r="18" fill="#6DAE5A" ${S3}/><circle cx="66" cy="46" r="18" fill="#6DAE5A" ${S3}/><circle cx="50" cy="32" r="20" fill="#7DBD68" ${S3}/></svg>`,
  tomato:`<svg viewBox="0 0 100 100"><circle cx="50" cy="56" r="34" fill="#E0545C" ${S3}/><path d="M34 26Q50 14 66 26Q50 32 34 26Z" fill="#6DAE5A" ${S2}/></svg>`};
const SIDES=['egg','fish','carrot','broccoli','tomato'];
const SIDEK={egg:['달걀','egg'],fish:['생선','fish'],carrot:['당근','carrot'],broccoli:['브로콜리','broccoli'],tomato:['토마토','tomato'],rice:['밥','rice']};
const plateSVG=(foods)=>{let s=`<circle cx="50" cy="50" r="46" fill="#FFFDF9" ${S3}/><circle cx="50" cy="50" r="36" fill="none" stroke="#A7CFE8" stroke-width="5"/>`;
  const POS=[[34,36],[68,40],[50,70]];foods.forEach((f,i)=>{if(f)s+=`<g transform="translate(${POS[i][0]-17} ${POS[i][1]-17}) scale(.34)">${svgInner(REG[f])}</g>`});return `<svg viewBox="0 0 100 100">${s}</svg>`};
const PLPOS=[[.34,.36],[.68,.4],[.5,.7]];
const OUTFIT={tee:{ko:'티셔츠',en:'T-shirt'},jacket:{ko:'점퍼',en:'jacket'},raincoat:{ko:'비옷',en:'raincoat'},umbrella:{ko:'우산',en:'umbrella'}};
const clothInner=(k,c)=>k==='tee'?`<path d="M66 156H134L150 186L130 192L128 222H72L70 192L50 186Z" fill="${c}" ${S3}/>`
 :k==='jacket'?`<path d="M62 154H138L154 190L132 196L130 224H70L68 196L46 190Z" fill="${c}" ${S3}/><path d="M100 154V224" stroke="#fff" stroke-width="4"/><circle cx="92" cy="180" r="3" fill="#fff"/>`
 :k==='raincoat'?`<path d="M58 150H142L158 194L134 202L132 226H68L66 202L42 194Z" fill="#FFC93C" ${S3}/><circle cx="100" cy="172" r="4" fill="${OL}"/><circle cx="100" cy="194" r="4" fill="${OL}"/><path d="M70 62Q100 24 130 62Q100 44 70 62Z" fill="#FFC93C" ${S3}/>`
 :k==='pj'?`<path d="M66 156H134L150 186L130 192L128 222H72L70 192L50 186Z" fill="#C3B4E6" ${S3}/><g fill="#FFF6C8"><circle cx="86" cy="178" r="4"/><circle cx="112" cy="196" r="4"/><circle cx="104" cy="170" r="3"/><circle cx="84" cy="206" r="3"/></g>`
 :`<path d="M154 120V60" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M104 62Q154 4 204 62Q179 48 154 62Q129 48 104 62Z" fill="${c}" ${S3}/>`;
const clothIcon=(k,c)=>k==='umbrella'?`<svg viewBox="0 0 100 100"><path d="M50 30V84Q50 94 40 90" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M8 48Q50 -6 92 48Q71 38 50 48Q29 38 8 48Z" fill="${c}" ${S3}/></svg>`:`<svg viewBox="30 130 140 110">${clothInner(k,c)}</svg>`;
const mouthSVG=(t)=>{let s=`<ellipse cx="60" cy="36" rx="56" ry="32" fill="#B8474B" ${S3}/><ellipse cx="60" cy="54" rx="26" ry="10" fill="#FF8FA3"/>`;
  for(let i=0;i<12;i++){const up=i<6,x=10+(i%6)*17,y=up?9:41,v=t[i];const col=v>=1?'#fff':`rgb(${Math.round(255-(1-v)*8)},${Math.round(250-(1-v)*40)},${Math.round(240-(1-v)*100)})`;
    s+=`<rect x="${x}" y="${y}" width="15" height="${up?20:19}" rx="6" fill="${col}" stroke="${OL}" stroke-width="2.2"/>`;if(v<.9)s+=`<circle cx="${x+7}" cy="${y+10}" r="3.2" fill="#B98A3E" opacity="${(1-v).toFixed(2)}"/>`;else if(v>=1)s+=`<path d="M${x+3} ${y+5}l3 1" stroke="#CFE5F4" stroke-width="2.4" stroke-linecap="round"/>`}
  return `<svg viewBox="0 0 120 72">${s}</svg>`};
const TCELL=Array.from({length:12},(_,i)=>[(10+(i%6)*17+7.5)/120,((i<6?19:50.5))/72]);
const roomSVG=(sc)=>{const wall={wake:'#F6D9C9',teeth:'#D5EDE6',eat:'#F7E6B8',dress:'#EBDDF3',bath:'#CFE5F4',sleep:'#E1DDF0'}[sc],floor={wake:'#E2C9A8',teeth:'#BFD9D2',eat:'#E2C9A8',dress:'#E2C9A8',bath:'#B7D3E8',sleep:'#CDBFA8'}[sc];
  let s=`<rect width="100" height="100" fill="${wall}"/><rect y="74" width="100" height="26" fill="${floor}"/><path d="M0 74H100" stroke="${OL}" stroke-width=".6"/>`;
  if(sc==='teeth'||sc==='bath')for(let i=0;i<10;i++)s+=`<path d="M${i*11} 0V74M0 ${i*11}H100" stroke="#fff" stroke-width=".5" opacity=".55"/>`;
  if(sc==='eat')s+=`<rect y="48" width="100" height="52" fill="#E7C99C"/><path d="M0 48H100" stroke="${OL}" stroke-width=".8"/>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;display:block">${s}</svg>`};
const STEP_ICON={curtain:()=>`<svg viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="72" rx="8" fill="#BFE3F5" ${S3}/><path d="M14 14H44V86H14Z" fill="#E8A0AE" ${S3}/></svg>`,rouse:()=>handSVG,pasteColor:()=>tubeSVG('#F6D3DB'),paste:()=>tubeSVG('#A9CFA0'),brush:()=>brushSVG(),rinse:()=>cupSVG,
  food:()=>plateSVG(['rice','egg','carrot']),spoon:()=>spoonSVG,wipe:()=>napkinSVG,outfit:()=>clothIcon('tee','#E89AAE'),putOn:()=>clothIcon('jacket','#8FC3E6'),water:()=>faucetSVG,foam:()=>spongeSVG,shower:()=>showerSVG,towel:()=>towelSVG,
  pajama:()=>clothIcon('pj'),book:()=>`<svg viewBox="0 0 200 100">${svgInner(bookSVG)}</svg>`,cover:()=>blanketSVG.replace('preserveAspectRatio="none"',''),lamp:()=>switchSVG,serve:()=>ICON.heart};
const stepIcon=k=>(STEP_ICON[k]||(()=>''))();
const lerp=(a,b,t)=>a+(b-a)*t,hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,t)=>'#'+hx(a).map((v,i)=>Math.round(lerp(v,hx(b)[i],t)).toString(16).padStart(2,'0')).join('');
const SKY=[[0,'#FFD9B0'],[.25,'#BFE3F5'],[.5,'#9AD0F0'],[.75,'#F5B07A'],[1,'#2B3A67']];
const skyAt=t=>{for(let i=1;i<SKY.length;i++)if(t<=SKY[i][0])return mix(SKY[i-1][1],SKY[i][1],(t-SKY[i-1][0])/(SKY[i][0]-SKY[i-1][0]));return SKY[SKY.length-1][1]};

/* ============================== layers ============================== */
const css=`
.rt-room{inset:0;z-index:0;pointer-events:none;transition:filter 1.4s}
.rt-win{left:4%;top:3%;width:40%;aspect-ratio:100/80;z-index:1;pointer-events:none;border:4px solid ${OL};border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.rt-sky{position:absolute;inset:0;transition:background-color 1.4s}
.rt-sky i{position:absolute;display:block;border-radius:50%;transition:left 1.4s,top 1.4s,opacity 1.2s}
.rt-sun{width:26%;aspect-ratio:1;background:#FFD54F;border:3px solid #F2B84B;transform:translate(-50%,-50%)}
.rt-moon{width:22%;aspect-ratio:1;background:#FFF6C8;border:3px solid #E9D98B;left:70%;top:34%;opacity:0;transform:translate(-50%,-50%)}
.rt-st{width:6%;aspect-ratio:1;background:#FFF6C8;opacity:0}
.rt-rain{position:absolute;inset:0;opacity:0;transition:opacity 1s;background:repeating-linear-gradient(105deg,transparent 0 10px,rgba(255,255,255,.7) 10px 12px);background-size:60px 60px;animation:rtrain 1.2s linear infinite}
@keyframes rtrain{to{background-position:-30px 60px}}
.rt-win .bars{position:absolute;inset:0;pointer-events:none}
.rt-curl,.rt-curr{position:absolute;top:0;bottom:0;width:52%;background:#E8A0AE;border:3px solid ${OL};transition:transform .4s}
.rt-curl{left:0;transform-origin:0 50%;transform:scaleX(var(--co,1))}
.rt-curr{right:0;transform-origin:100% 50%;transform:scaleX(var(--co,1))}
.rt-toto{z-index:3;left:50%;transform:translateX(-50%);aspect-ratio:200/230;pointer-events:none;transition:top .6s ease-in-out,height .6s ease-in-out}
.rt-toto>div{position:absolute;inset:0}
.rt-toto svg{width:100%;height:100%;display:block;overflow:visible}
.rt-pr{position:absolute;pointer-events:none;transform:translate(-50%,-50%);transition:left .5s,top .5s,opacity .35s,transform .4s}
.rt-pr svg{width:100%;height:100%;display:block;overflow:visible}
.rt-pr.hide{opacity:0;visibility:hidden}
.rt-night{inset:0;z-index:9;pointer-events:none;background:#1B2250;opacity:0;transition:opacity 1.6s}
.rt-tub .wt{transform-box:fill-box;transform-origin:50% 100%;transform:scaleY(var(--lv,0));transition:transform 2s ease-in-out}
.rt-flip{transform-origin:0 50%;transition:transform .2s}
`;
const gst=document.createElement('style');gst.textContent=css;document.head.appendChild(gst);
stage.insertAdjacentHTML('afterbegin',`<div class="rt-room" id="rtnRoom"></div><div class="rt-win" id="rtnWin"><div class="rt-sky" id="rtnSky"><i class="rt-sun" id="rtnSun"></i><i class="rt-moon" id="rtnMoon"></i><i class="rt-st" style="left:12%;top:16%"></i><i class="rt-st" style="left:40%;top:60%"></i><i class="rt-st" style="left:84%;top:70%"></i><div class="rt-rain" id="rtnRain"></div></div><div class="rt-curl" id="rtnCurL"></div><div class="rt-curr" id="rtnCurR"></div></div><div class="rt-toto" id="rtnToto"><div class="rt-ani" id="rtnAni"></div><div class="rt-ov" id="rtnOv"></div></div><div class="rt-props" id="rtnProps" style="inset:0;pointer-events:none"></div><div class="rt-night" id="rtnDark"></div>`);
const roomEl=$('#rtnRoom'),winEl=$('#rtnWin'),skyEl=$('#rtnSky'),sunEl=$('#rtnSun'),moonEl=$('#rtnMoon'),rainEl=$('#rtnRain'),curL=$('#rtnCurL'),curR=$('#rtnCurR'),aniEl=$('#rtnAni'),ovEl=$('#rtnOv'),props=$('#rtnProps'),darkEl=$('#rtnDark');custEl=$('#rtnToto');
const stars=[...skyEl.querySelectorAll('.rt-st')];
let PR={},HOT=()=>[];
const rectOf=n=>PR[n]?PR[n].getBoundingClientRect():null;
const hit=(e,n,m=6)=>{const r=rectOf(n);return!!r&&!PR[n].classList.contains('hide')&&inRect(e,r,m)};
const totoRect=()=>custEl.getBoundingClientRect();
const hitToto=(e,m=6)=>inRect(e,totoRect(),m);
function mkP(name,html,x,y,wPct,ar,minPx,z){
  let d=PR[name];if(!d){d=document.createElement('div');d.className='rt-pr';d.dataset.n=name;props.appendChild(d);PR[name]=d}
  d.innerHTML=html;d.classList.remove('hide');Object.assign(d.style,{left:x+'%',top:y+'%',width:`max(${minPx||0}px,${wPct}%)`,aspectRatio:String(ar),zIndex:String(z==null?5:z),transform:'translate(-50%,-50%)'});return d;
}
const rmP=n=>{if(PR[n]){PR[n].remove();delete PR[n]}};
const clearProps=()=>{props.innerHTML='';PR={}};
function setToto(top,hPct){Object.assign(custEl.style,{top:top+'%',height:hPct+'%'})}
function drawToto(m){aniEl.innerHTML=A.animal('bunny',m||'idle',{});if(al)al.refresh()}
function setSky(t,rain){
  S.t=t;skyEl.style.backgroundColor=rain?'#9BA8B8':skyAt(t);const night=t>=.9;
  sunEl.style.left=(12+76*Math.min(t,.9))+'%';sunEl.style.top=(66-52*Math.sin(Math.PI*Math.min(1,t/.9)))+'%';sunEl.style.opacity=night||rain?'0':'1';
  moonEl.style.opacity=night?'1':'0';stars.forEach(s=>{s.style.opacity=night?'1':'0'});rainEl.style.opacity=rain?'1':'0';
}
/* overlays on Toto: clothes, foam, towel, food smudges (viewBox 0 0 200 230, same as the animal) */
function drawOv(){
  const o=S.ov;let s='';
  if(o.cloth)s+=clothInner(o.cloth.k,o.cloth.c);
  o.smudge.forEach((v,i)=>{if(v<1){const p=[[78,128],[122,128],[92,140],[108,116]][i];s+=`<ellipse cx="${p[0]}" cy="${p[1]}" rx="12" ry="8" fill="#E9B66B" opacity="${(1-v).toFixed(2)}"/>`}});
  o.foam.forEach((v,i)=>{if(v>0){const p=[[70,52],[130,52],[100,36],[66,110],[134,110],[100,140],[78,190],[122,190]][i];s+=`<circle cx="${p[0]}" cy="${p[1]}" r="26" fill="#fff" stroke="#CDE9FA" stroke-width="3" opacity="${v.toFixed(2)}"/><circle cx="${p[0]+8}" cy="${p[1]-8}" r="9" fill="#CFE5F4" opacity="${v.toFixed(2)}"/>`}});
  if(o.towel>0){const t=o.towel;s+=`<clipPath id="rtntc"><rect x="0" y="${(236-190*t).toFixed(0)}" width="200" height="${(190*t).toFixed(0)}"/></clipPath><g clip-path="url(#rttc)"><path d="M36 84Q100 54 164 84L176 226H24Z" fill="#CFE5F4" ${S3}/><path d="M30 120H170M26 160H174M24 200H176" stroke="#8FC3E6" stroke-width="7"/></g>`}
  ovEl.innerHTML=`<svg viewBox="0 0 200 230">${s}</svg>`;
}
const draw=()=>{if(S){if(S.mouth)S.mouth.innerHTML=mouthSVG(S.teethV);drawOv()}};
const layout=()=>{};
function enterScene(sc){
  S.sc=sc;roomEl.innerHTML=roomSVG(sc);clearProps();S.ov={cloth:null,foam:Array(8).fill(0),towel:0,smudge:[1,1,1,1]};darkEl.style.opacity='0';
  setSky(SC_SKY[sc],sc==='dress'&&S.weather==='rain');LOG.push('scene:'+sc);
  const cfg={wake:[26,50,'sleepy'],teeth:[3,46,''],eat:[3,46,''],dress:[22,52,''],bath:[20,46,''],sleep:[26,46,'']}[sc];
  setToto(cfg[0],cfg[1]);drawToto(cfg[2]);curL.style.setProperty('--co',sc==='wake'?1:0);curR.style.setProperty('--co',sc==='wake'?1:0);
  if(sc==='wake'){const bd=mkP('bed',bedSVG,50,84,100,1,0,2);bd.style.height='34%';bd.style.aspectRatio='auto';
    const bl=mkP('blanket',blanketSVG,50,78,100,1,0,4);bl.style.height='36%';bl.style.aspectRatio='auto'}
  if(sc==='bath'){mkP('tub',tubFront,50,76,98,100/50,0,5);PR.tub.classList.add('rt-tub');PR.tub.style.setProperty('--lv','0')}
  drawOv();
}
const endStep=()=>finish(()=>{const nk=plan[pi+1];if(nk&&nk!=='serve'&&SC_OF[nk]!==SC_OF[plan[pi]])enterScene(SC_OF[nk])});

/* ============================== processes ============================== */
const STEP={
  curtain(){
    kind='rub';const stopI=intro(handSVG,'손!','Hand!');say('커튼을 쓱 열어요! 아침이 와요!','Open the curtain! It is morning!',true);HOT=()=>[];
    rubTool({icon:handSVG,anchor:[.5,.3],gap:.4,log:'curtain',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.2,.3],[.5,.3],[.8,.3],[.2,.7],[.5,.7],[.8,.7]],grid:[3,2],rad:.12,target:()=>winEl.getBoundingClientRect(),
      cell:(i,v)=>{S.cur[i]=v},progress:()=>{const a=S.cur.reduce((x,y)=>x+y,0)/6;const k=(1-.88*a).toFixed(2);curL.style.setProperty('--co',k);curR.style.setProperty('--co',k)},
      done:()=>{curL.style.setProperty('--co','.12');curR.style.setProperty('--co','.12');setSky(.02);S.cnt.curtain=1;SFX.sparkle();say('해가 쏙! 아침이에요!','Here comes the sun!');spark(...stXY(...ctr(winEl)),4);endStep()}});
    guideAt(()=>ctr(winEl),'scrub','쓱쓱 열어 봐!','Open it!');
  },
  rouse(){
    kind='rub';const stopI=intro(handSVG,'손!','Hand!');say('토토를 살살 흔들어 깨워요!','Gently wake Toto up!',true);HOT=()=>[custEl];S.ro=Array(6).fill(0);
    rubTool({icon:handSVG,anchor:[.5,.3],gap:.4,log:'rouse',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.3,.35],[.7,.35],[.3,.6],[.7,.6],[.5,.45],[.5,.75]],grid:[2,3],rad:.12,target:()=>totoRect(),
      cell:(i,v)=>{S.ro[i]=v},progress:()=>{const a=S.ro.reduce((x,y)=>x+y,0)/6;if(a>.45&&!S.awake){S.awake=true;drawToto('');tone(660,.1,'sine',.14)}},
      done:()=>{S.cnt.rouse=1;S.awake=true;drawToto('wow');PR.blanket&&(PR.blanket.style.top='96%');SFX.sparkle();say('으아~ 기지개! 잘 잤어요!','Streeetch! Good morning!');alPlay('hop',{n:2});endStep()}});
    guideAt(()=>ctr(custEl),'scrub','살살 흔들어 봐!','Gently!');
  },
  pasteColor(){
    kind='cards';HOT=()=>[...tray.querySelectorAll('.rt-card')];
    const cols=shuffle(CC.slice()).slice(0,3);
    cardsTray(cols.map(c=>({svg:tubeSVG(c.hex),label:c.ko,log:c.en})),i=>{S.paste=cols[i];say(cols[i].ko+' 치약!',cap(cols[i].en)+' toothpaste!');const g=gen;L.later(()=>{if(g===gen)endStep()},800)},'무슨 색 치약으로 닦을까? 하나 골라 봐!','Which toothpaste? Pick one!');
  },
  paste(){
    kind='tap';toolTray(tubeSVG(S.paste.hex));say('치약을 꾹! 콕 눌러서 칫솔에 짜요!','Squeeze the toothpaste! Tap!',true);
    mkP('brush',brushSVG(),50,36,40,1,112);PR.brush.style.transform='translate(-50%,-50%) rotate(-70deg)';mkP('tube',tubeSVG(S.paste.hex),50,72,32,1,112);AIM=()=>ctr(PR.tube);HOT=()=>[PR.tube];
    H={down:e=>{if(!hit(e,'tube',8))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();S.cnt.paste++;LOG.push('squeeze');PR.tube.style.transform='translate(-50%,-50%) scaleY(.82)';sfx.pop();noise(.25,{type:'lowpass',freq:700,vol:.12});
      const g=gen;L.later(()=>{if(g!==gen)return;PR.tube.style.transform='translate(-50%,-50%)';PR.brush.innerHTML=brushSVG(S.paste.vivid);say('쭈욱! 칫솔에 치약이 묻었어요!','Squish! Paste on the brush!');SFX.sparkle();kind='wait';L.later(()=>{if(g===gen)endStep()},600)},500)}};
    guideAt(AIM,'tap','치약을 콕 눌러 봐!','Tap the tube!');
  },
  brush(){
    kind='rub';rmP('tube');rmP('brush');const stopI=intro(brushSVG(S.paste.vivid),'칫솔!','Toothbrush!');say('칫솔로 쓱쓱! 이를 닦아요!','Brush the teeth!',true);HOT=()=>[];
    S.teethV=Array(12).fill(0);S.mouth=mkP('mouth',mouthSVG(S.teethV),50,72,94,120/72,0,5);
    rubTool({icon:brushSVG(S.paste.vivid),anchor:[.5,.1],gap:.4,log:'brush',stopIntro:stopI,effect:'foam',cells:TCELL,grid:[6,2],rad:.1,target:()=>rectOf('mouth'),
      cell:(i,v)=>{S.teethV[i]=v;if(v>=1&&!S.tClean[i]){S.tClean[i]=true;S.cnt.teeth++}},done:()=>{S.teethV.fill(1);draw();SFX.sparkle();say('반짝반짝! 이가 하얘졌어요!','Sparkly white teeth!');alMood('wow',900);endStep()}});
    guideAt(()=>ctr(PR.mouth),'scrub','쓱쓱 닦아 봐!','Brush brush!');
  },
  rinse(){
    kind='tap';toolTray(cupSVG);say('컵으로 헹궈요! 컵을 콕!','Rinse with the cup! Tap!',true);mkP('cup',cupSVG,50,60,34,1,112);AIM=()=>ctr(PR.cup);HOT=()=>[PR.cup];
    H={down:e=>{if(!hit(e,'cup',8))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';LOG.push('rinse');S.cnt.rinse=1;PR.cup.style.transform='translate(-50%,-50%) rotate(-30deg)';noise(.6,{type:'lowpass',freq:1400,vol:.14});say('쏴아~ 퉤!','Splash! Spit!');const g=gen;
      L.later(()=>{if(g!==gen)return;PR.cup.style.transform='translate(-50%,-50%)';drawToto('happy');spark(...stXY(...ctr(PR.mouth)),5);SFX.sparkle();say('반짝! 이가 깨끗해요!','Sparkle! All clean!');L.later(()=>{if(g===gen)endStep()},900)},700)}};
    guideAt(AIM,'tap','컵을 콕 눌러 봐!','Tap the cup!');
  },
  food(){
    kind='tap';S.plate=[null,null,null];S.fi=0;const foods=['rice',...shuffle(SIDES.slice()).slice(0,2)];S.foods=foods;toolTray(plateSVG(['rice','egg','carrot']));
    say('접시에 담아요! 밥과 반찬을 콕 콕 콕!','Fill the plate! Tap the rice and side dishes!',true);
    mkP('plate',plateSVG(S.plate),50,58,58,1,150,5);foods.forEach((f,i)=>mkP('f'+i,REG[f],[17,50,83][i],86,31,1,112,3));
    AIM=()=>{for(let i=0;i<3;i++)if(!S.plate[i])return ctr(PR['f'+i]);return[0,0]};HOT=()=>[0,1,2].filter(i=>!S.plate[i]).map(i=>PR['f'+i]);
    H={down:e=>{let k=-1;for(let i=0;i<3;i++)if(!S.plate[i]&&hit(e,'f'+i,4))k=i;if(k<0)return false;if(busy||!tapOk())return;busy=true;G.stop();const f=S.foods[k];S.plate[k]=f;S.cnt.foods++;LOG.push('food:'+f);
      const a=ctr(PR['f'+k]),pr=rectOf('plate'),to=[pr.left+pr.width*PLPOS[k][0],pr.top+pr.height*PLPOS[k][1]];PR['f'+k].classList.add('hide');
      fly(REG[f],a,to,100,52,520,()=>{PR.plate.innerHTML=plateSVG(S.plate);sfx.pop();say(SIDEK[f][0]+'!',cap(SIDEK[f][1])+'!');busy=false;
        if(S.plate.every(Boolean)){H={};kind='wait';const g=gen;L.later(()=>{if(g===gen){SFX.sparkle();say('맛있는 밥상이 됐어요!','A yummy meal!');endStep()}},600)}else G.start({type:'tap',at:()=>stXY(...AIM()),ko:'콕 눌러 봐!',en:'Tap!'})})}};
    guideAt(AIM,'tap','음식을 콕 눌러 봐!','Tap a food!');
  },
  spoon(){
    kind='rub';const stopI=intro(spoonSVG,'숟가락!','Spoon!');say('숟가락으로 떠서 토토 입으로! 냠냠!','Feed Toto with the spoon! Yum!',true);HOT=()=>[];S.bitten=[false,false,false];
    rubTool({icon:spoonSVG,anchor:[.5,.2],gap:.4,log:'spoon',stopIntro:stopI,effect:'rub',fx:()=>'',cells:PLPOS,grid:[3,2],rad:.13,target:()=>rectOf('plate'),
      cell:(i,v)=>{if(v>=1&&!S.bitten[i]){S.bitten[i]=true;const f=S.plate[i];S.plate[i]=null;PR.plate.innerHTML=plateSVG(S.plate);S.cnt.bites++;LOG.push('bite');const pr=rectOf('plate'),tr=totoRect();
        fly(REG[f],[pr.left+pr.width*PLPOS[i][0],pr.top+pr.height*PLPOS[i][1]],[tr.left+tr.width*.5,tr.top+tr.height*.55],50,30,600,()=>{drawToto('yum');setTimeout(()=>drawToto(''),800);say(CNTK(S.cnt.bites)+' 냠냠!','Yum! '+CNTE(S.cnt.bites))})}},
      done:()=>{S.plate=[null,null,null];PR.plate.innerHTML=plateSVG(S.plate);S.ov.smudge=[0,0,0,0];draw();SFX.sparkle();say('다 먹었어요! 입에 묻었네?','All gone! Toto is messy!');endStep()}});
    guideAt(()=>ctr(PR.plate),'scrub','쓱쓱 떠 봐!','Scoop it!');
  },
  wipe(){
    kind='rub';rmP('plate');S.foods.forEach((f,i)=>rmP('f'+i));const stopI=intro(napkinSVG,'손수건!','Napkin!');say('입가를 손수건으로 쓱쓱 닦아요!','Wipe Toto\'s mouth!',true);HOT=()=>[custEl];
    rubTool({icon:napkinSVG,anchor:[.5,.4],gap:.4,log:'wipe',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.4,.56],[.6,.56],[.45,.62],[.55,.5]],grid:[2,2],rad:.09,target:()=>totoRect(),
      cell:(i,v)=>{S.ov.smudge[i]=v},done:()=>{S.ov.smudge=[1,1,1,1];draw();S.cnt.wipe=1;SFX.sparkle();say('깨끗해졌어요!','All clean!');drawToto('happy');endStep()}});
    guideAt(()=>[totoRect().left+totoRect().width*.5,totoRect().top+totoRect().height*.56],'scrub','쓱쓱 닦아 봐!','Wipe wipe!');
  },
  outfit(){
    kind='cards';HOT=()=>[...tray.querySelectorAll('.rt-card')];S.weather=S.weather||'sun';setSky(SC_SKY.dress,S.weather==='rain');
    say(S.weather==='rain'?'비가 와요! 어떤 옷을 입을까?':'해가 쨍쨍! 어떤 옷을 입을까?',S.weather==='rain'?'It is raining! What to wear?':'It is sunny! What to wear?',true);
    const cols=shuffle(CC.slice()),ks=shuffle(['umbrella',...shuffle(['tee','jacket','raincoat']).slice(0,2)]);
    cardsTray(ks.map((k,i)=>({svg:clothIcon(k,cols[i].vivid),label:OUTFIT[k].ko,log:k})),i=>{const k=ks[i];S.pick={k,c:cols[i].vivid};say(cols[i].ko+' '+OUTFIT[k].ko+'!',cap(cols[i].en)+' '+OUTFIT[k].en+'!');const g=gen;L.later(()=>{if(g===gen)endStep()},800)},null,null);
  },
  putOn(){
    kind='tap';const q=S.pick;toolTray(clothIcon(q.k,q.c));say('토토를 콕! 옷을 입혀 줘요!','Tap Toto to put it on!',true);mkP('cl',clothIcon(q.k,q.c),82,82,34,1,112,6);AIM=()=>ctr(custEl);HOT=()=>[PR.cl,custEl];
    H={down:e=>{if(!hit(e,'cl',8)&&!hitToto(e,4))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';S.cnt.putOn=1;LOG.push('wear:'+q.k);
      const a=ctr(PR.cl),tr=totoRect();PR.cl.classList.add('hide');
      fly(clothIcon(q.k,q.c),a,[tr.left+tr.width/2,tr.top+tr.height*.6],110,70,700,()=>{S.ov.cloth={k:q.k,c:q.c};draw();sfx.pop();SFX.sparkle();
        mkP('mirror',`<svg viewBox="0 0 100 130"><ellipse cx="50" cy="62" rx="40" ry="54" fill="#DCEBF0" ${S3}/><path d="M30 40Q40 24 56 24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/><rect x="40" y="114" width="20" height="14" rx="4" fill="#E6B07A" ${S3}/></svg>`,20,70,30,100/130,112,6);
        const rain=S.weather==='rain',good=rain&&q.k==='umbrella';say(good?'우산! 비가 와도 괜찮아요!':'거울을 봐요! 멋지다!',good?'An umbrella! Perfect for rain!':'Look in the mirror! Great!');
        alPlay(good?'dance':'twirl');drawToto(good?'happy':'wow');const g=gen;L.later(()=>{if(g===gen)endStep()},good?2800:2200)})}};
    guideAt(AIM,'tap','토토를 콕 눌러 봐!','Tap Toto!');
  },
  water(){
    kind='tap';toolTray(faucetSVG);say('수도꼭지를 콕! 욕조에 물을 받아요!','Tap the faucet to fill the tub!',true);mkP('faucet',faucetSVG,80,12,32,1,112,6);AIM=()=>ctr(PR.faucet);HOT=()=>[PR.faucet];
    H={down:e=>{if(!hit(e,'faucet',8))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';S.cnt.water=1;LOG.push('faucet');noise(1.2,{type:'lowpass',freq:1600,vol:.16,sweep:-600});say('쏴아~ 물이 차올라요!','Splash! The tub is filling!');
      PR.tub.style.setProperty('--lv','1');const g=gen;L.later(()=>{if(g===gen){SFX.sparkle();say('따뜻한 물이 가득!','Warm water!');endStep()}},2300)}};
    guideAt(AIM,'tap','수도꼭지를 콕 눌러 봐!','Tap the faucet!');
  },
  foam(){
    kind='rub';const stopI=intro(spongeSVG,'수세미!','Sponge!');say('수세미로 쓱쓱! 거품을 내요!','Rub with the sponge to make bubbles!',true);HOT=()=>[custEl];alMood('ticklish');
    rubTool({icon:spongeSVG,anchor:[.5,.78],gap:.4,log:'foam',stopIntro:stopI,effect:'foam',cells:FOAMC,grid:[2,4],rad:.1,target:()=>totoRect(),
      cell:(i,v)=>{S.ov.foam[i]=v},done:()=>{S.ov.foam.fill(1);draw();SFX.sparkle();say('뽀글뽀글! 거품이 가득!','Bubbles everywhere!');alMood('happy',1200);endStep()}});
    guideAt(()=>ctr(custEl),'scrub','쓱쓱 문질러 봐!','Rub rub!');
  },
  shower(){
    kind='rub';const stopI=intro(showerSVG,'샤워기!','Shower!');say('샤워기로 거품을 씻어 내요!','Rinse off the bubbles!',true);HOT=()=>[custEl];
    rubTool({icon:showerSVG,effect:'water',anchor:[.5,.68],gap:.5,log:'shower',stopIntro:stopI,hold:'shower',cells:FOAMC,grid:[2,4],rad:.1,target:()=>totoRect(),
      cell:(i,v)=>{S.ov.foam[i]=1-v},done:()=>{S.ov.foam.fill(0);draw();SFX.sparkle();say('깨끗해!','All clean!');alMood('wow',900);endStep()}});
    guideAt(()=>ctr(custEl),'scrub','쓱쓱 씻어 봐!','Rinse it off!');
  },
  towel(){
    kind='rub';const stopI=intro(towelSVG,'수건!','Towel!');say('수건으로 폭 감싸 줘요!','Wrap Toto in the towel!',true);HOT=()=>[custEl];S.tw=Array(6).fill(0);
    rubTool({icon:towelSVG,anchor:[.5,.5],gap:.4,log:'towel',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.3,.3],[.7,.3],[.3,.55],[.7,.55],[.3,.8],[.7,.8]],grid:[2,3],rad:.11,target:()=>totoRect(),
      cell:(i,v)=>{S.tw[i]=v},progress:()=>{S.ov.towel=S.tw.reduce((x,y)=>x+y,0)/6;draw()},
      done:()=>{S.ov.towel=1;draw();S.cnt.towel=1;PR.tub&&PR.tub.classList.add('hide');SFX.sparkle();say('보송보송! 폭 감쌌어요!','So fluffy!');drawToto('happy');endStep()}});
    guideAt(()=>ctr(custEl),'scrub','쓱쓱 감싸 봐!','Wrap wrap!');
  },
  pajama(){
    kind='tap';toolTray(clothIcon('pj'));say('잠옷을 입혀 줘요! 토토를 콕!','Put on the pajamas! Tap Toto!',true);mkP('pj',clothIcon('pj'),82,82,34,1,112,6);AIM=()=>ctr(custEl);HOT=()=>[PR.pj,custEl];
    H={down:e=>{if(!hit(e,'pj',8)&&!hitToto(e,4))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';S.cnt.pajama=1;LOG.push('pajama');const a=ctr(PR.pj),tr=totoRect();PR.pj.classList.add('hide');
      fly(clothIcon('pj'),a,[tr.left+tr.width/2,tr.top+tr.height*.6],110,70,700,()=>{S.ov.towel=0;S.ov.cloth={k:'pj',c:'#C3B4E6'};draw();sfx.pop();SFX.sparkle();say('별 잠옷! 포근해요!','Star pajamas! So cozy!');drawToto('happy');const g=gen;L.later(()=>{if(g===gen)endStep()},1200)})}};
    guideAt(AIM,'tap','토토를 콕 눌러 봐!','Tap Toto!');
  },
  book(){
    kind='rub';rmP('pj');const stopI=intro(handSVG,'손!','Hand!');say('그림책을 한 장 넘겨 줘요! 쓱!','Turn a page of the book! Swipe!',true);HOT=()=>[];S.bk=Array(6).fill(0);
    mkP('book',bookSVG,50,84,86,2,0,6);const bd=PR.book;const fl=document.createElement('div');fl.className='rt-flip';Object.assign(fl.style,{position:'absolute',left:'50%',top:'0',width:'48%',height:'100%',transformOrigin:'0 50%'});fl.innerHTML=bookPage;bd.appendChild(fl);S.flip=fl;
    rubTool({icon:handSVG,anchor:[.5,.3],gap:.4,log:'book',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.6,.3],[.8,.3],[.6,.7],[.8,.7],[.7,.5],[.45,.5]],grid:[3,2],rad:.1,target:()=>rectOf('book'),
      cell:(i,v)=>{S.bk[i]=v},progress:()=>{const a=S.bk.reduce((x,y)=>x+y,0)/6;S.flip.style.transform=`scaleX(${(1-2*a).toFixed(2)})`},
      done:()=>{S.flip.style.transform='scaleX(-1)';S.cnt.page=1;tone(500,.12,'triangle',.14);say('다음 장이에요! 달님이 나왔어요!','Next page! The moon!');endStep()}});
    guideAt(()=>ctr(PR.book),'swipe','쓱 넘겨 봐!','Swipe!');
  },
  cover(){
    kind='rub';rmP('book');const stopI=intro(handSVG,'손!','Hand!');say('이불을 끌어올려 덮어 줘요! 쓱쓱!','Pull the blanket up! Rub rub!',true);HOT=()=>[custEl];S.cv=Array(6).fill(0);
    const qq=mkP('quilt',blanketSVG,50,118,100,1,0,5);qq.style.height='40%';qq.style.aspectRatio='auto';
    rubTool({icon:handSVG,anchor:[.5,.3],gap:.4,log:'cover',stopIntro:stopI,effect:'rub',fx:()=>'',cells:[[.3,.55],[.7,.55],[.3,.75],[.7,.75],[.5,.65],[.5,.9]],grid:[2,3],rad:.11,target:()=>totoRect(),
      cell:(i,v)=>{S.cv[i]=v},progress:()=>{const a=S.cv.reduce((x,y)=>x+y,0)/6;PR.quilt.style.top=(118-34*a)+'%'},
      done:()=>{PR.quilt.style.top='84%';S.cnt.cover=1;SFX.sparkle();say('포근포근! 이불을 덮었어요!','Snug as a bug!');drawToto('sleepy');endStep()}});
    guideAt(()=>ctr(custEl),'scrub','쓱쓱 덮어 봐!','Pull it up!');
  },
  lamp(){
    kind='tap';toolTray(switchSVG);say('불을 꺼요! 스위치를 콕!','Lights out! Tap the switch!',true);mkP('sw',switchSVG,82,14,28,1,112,6);AIM=()=>ctr(PR.sw);HOT=()=>[PR.sw];
    H={down:e=>{if(!hit(e,'sw',8))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();kind='wait';S.cnt.lamp=1;LOG.push('lights-off');darkEl.style.opacity='.5';tone(300,.08,'square',.12);say('깜깜! 쿨쿨 잘 자요!','Lights out! Sweet dreams!');drawToto('sleepy');
      const g=gen;L.later(()=>{if(g!==gen)return;[392,330,262,330,392,330,262].forEach((f,i)=>tone(f,.5,'sine',.07,i*.5));endStep()},1500)}};
    guideAt(AIM,'tap','스위치를 콕 눌러 봐!','Tap the switch!');
  },
  /* ending: Toto cheers (or falls asleep with a lullaby), a heart, a new day */
  serve(){
    phase='serve';kind='wait';const g=gen;LOG.push('serve');H={};tray.innerHTML='';
    if(S.sc==='sleep'){drawToto('sleepy');say('쿨쿨~ 토토가 잠들었어요.','Zzz... Toto is asleep.');L.later(()=>{if(g===gen)heart()},3200)}
    else{drawToto('happy');alPlay('dance');const p=pick(VO.praise||[{ko:'잘했어!',en:'Good job!'}]);say(p.ko+' 고마워!',p.en+' Thank you!');SFX.sparkle();L.later(()=>{if(g===gen)heart()},2600)}
  }
};
const FOAMC=[[.35,.15],[.65,.15],[.5,.1],[.3,.5],[.7,.5],[.5,.6],[.38,.82],[.62,.82]];

function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.4],[cr.left+cr.width*.3,cr.top-40],50,40,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('내일 또 놀자!','See you tomorrow!');
    L.later(()=>{if(g===gen)newRound()},2400)},1100);
}

/* ---------- a new day ---------- */
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.innerHTML='';tray.onpointerdown=null;busy=false;
  if(al){al.detach();al=null}
  lv=levelInfo(levelNo());S={sc:null,t:0,ov:null,weather:Math.random()<.5?'rain':'sun',cnt:{curtain:0,rouse:0,paste:0,teeth:0,rinse:0,foods:0,bites:0,wipe:0,putOn:0,water:0,towel:0,pajama:0,page:0,cover:0,lamp:0},cur:Array(6).fill(0),tClean:Array(12).fill(false),teethV:Array(12).fill(0),mouth:null,awake:false,paste:null,pick:null};
  plan=planFor(lv);pi=0;phase='enter';kind='wait';LOG.push('level:'+lv.level,'scenes:'+lv.scenes.join('+'),'weather:'+S.weather);
  enterScene(lv.scenes[0]);
  if(M.Alive){al=M.Alive.attach(aniEl,{kind:'bunny'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  strip();size();draw();const g=gen;
  L.later(()=>{if(g!==gen)return;say('안녕! 나는 토토야. 오늘 하루를 같이 보내자!',"Hi! I'm Toto. Let's spend the day together!")},900);
  L.later(()=>{if(g!==gen)return;run()},3200);
}

/* ---------- test hooks ---------- */
const HAND_OF={curtain:'rub',rouse:'rub',pasteColor:'choose',paste:'tap',brush:'rub',rinse:'tap',food:'tap',spoon:'rub',wipe:'rub',outfit:'choose',putOn:'tap',water:'tap',foam:'rub',shower:'rub',towel:'rub',pajama:'tap',book:'rub',cover:'rub',lamp:'tap'};
M.__routineLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__routine=()=>{
  const k=plan[pi]||null;let aim=null;try{aim=AIM?AIM():null}catch(e){}const sr=stR();
  let hot=[];try{hot=HOT().filter(Boolean).map(e=>{const r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})}catch(e){}
  const sun=sunEl.getBoundingClientRect(),wr=winEl.getBoundingClientRect();
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),scenes:lv?lv.scenes.slice():[],pi,phase,step:k,scene:S&&S.sc,kind,busy,aim,rect:{x:sr.left,y:sr.top,w:sr.width,h:sr.height},cellPts:tool?tool.cellPts():[],toolOn:!!tool,
    cards:[...tray.querySelectorAll('.rt-card')].length,hot,cnt:S?Object.assign({},S.cnt):{},sky:S?S.t:0,sunX:Math.round((sun.left+sun.width/2-wr.left)/wr.width*100),weather:S&&S.weather,
    foods:S&&S.foods||[],totoH:Math.round(custEl.getBoundingClientRect().height),alive:al?al.state():null,misses,guide:G.state(),served:DATA.served,log:LOG.slice()};
};
M.__routineDepth=()=>{
  const v=levelInfo(levelNo()),p=planFor(v).filter(x=>x!=='serve');
  return{level:levelNo(),processes:p.filter(x=>HAND_OF[x]!=='choose').length,handActions:[...new Set(p.map(x=>HAND_OF[x]))],customer:!!M.Alive,choice:p.some(x=>HAND_OF[x]==='choose'),ending:true,scenes:v.scenes.slice()};
};
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.onpointerdown=null;if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* tile picture on the home screen */
document.querySelectorAll('.tile[data-go="routine2"] .ic').forEach(ic=>{
  ic.innerHTML=`<svg viewBox="0 0 100 100" style="width:1.5em;height:1.5em;overflow:visible"><circle cx="50" cy="52" r="40" fill="#BFE3F5" ${S3}/><circle cx="38" cy="40" r="13" fill="#FFD54F" stroke="#F2B84B" stroke-width="3"/><path d="M10 74Q50 54 90 74" fill="#A9CFA0" ${S3}/></svg>`;
});
})();
