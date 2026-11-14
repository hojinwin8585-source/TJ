/* 말랑 설거지 (P8-나) — 토토가 쌓아 둔 그릇을 걷고, 긁고, 세제로 거품 내고, 헹구고, 닦고, 선반에 꽂아요.
   쇠규칙(MLCFG.rules): 글자 없음 · '다음' 버튼 없음(과정이 끝나면 1.5초 이음 장면 뒤 저절로) · 만든 만큼 쓰기(씻은 그릇 = 선반에 꽂힌 그릇) ·
   세 구역(위 과정 그림 줄, 가운데 무대, 아래 도구 칸) · 이모지 없음(그림은 모두 여기서 직접 그림).
   동작: 콕(걷기, 세제, 수도꼭지, 선반), 쓱쓱(손가락을 따라오는 도구 ML.P2.makeTool: 주걱, 수세미, 샤워기, 행주), 고르기(세제 색, 선반 칸).
   숫자와 단계는 MLCFG.games.dishes(levels), rules, shell, touch, voice 에서 읽습니다. 단계: ML.Progress.get('dishes').level, 없으면 1단계 고정(ML.__dishLevel). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,noise,sweepTone,SFX}=P;
const id='dishes2',GID='dishes',L=life(id),OL=A.OL,S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},DG=(CF.games||{}).dishes||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{},CC=(CF.calm||{}).choiceColors||[];
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);
const TAP_LOCK=TOUCH.tapLockMs||1200;
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const LV=DG.levels&&DG.levels.length?DG.levels:[{level:1,new:'접시 2개: 세제, 거품, 헹굼'}];
const LOG=[];
/* not in config: dish names, which shelf place each kind goes to, and from which level the bowl appears */
const KO={plate:'접시',cup:'컵',bowl:'밥그릇',pot:'냄비'},EN={plate:'plate',cup:'cup',bowl:'bowl',pot:'pot'};
const SLOT_OF={plate:'plate',cup:'cup',bowl:'deep',pot:'deep'},SLOTS=['plate','cup','deep'];
const BOWL_FROM=3;
const iga=w=>w+(M.batchim(w)?'이':'가');

/* ============================== pictures (말랑 그림체, brown outline) ============================== */
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  sponge:`<svg viewBox="0 0 100 100"><rect x="14" y="26" width="72" height="50" rx="13" fill="#F4D96B" ${S3}/><path d="M14 58H86V63Q86 76 73 76H27Q14 76 14 63Z" fill="#8FC48A" ${S3}/><circle cx="26" cy="38" r="2.4" fill="#D9B53F"/><circle cx="72" cy="36" r="2.8" fill="#D9B53F"/><circle cx="60" cy="42" r="2" fill="#D9B53F"/><g class="tf"><ellipse class="tf-eye" cx="38" cy="45" rx="3.2" ry="4.6" fill="${OL}"/><ellipse class="tf-eye" cx="62" cy="45" rx="3.2" ry="4.6" fill="${OL}"/><path class="tf-grin" d="M42 52Q50 60 58 52Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  spatula:`<svg viewBox="0 0 100 100"><path d="M52 50L84 88" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M52 50L84 88" stroke="#E6B07A" stroke-width="8" stroke-linecap="round"/><path d="M14 20Q14 8 28 8H46Q62 8 62 24V38Q62 56 38 56Q14 56 14 38Z" fill="#8FC3E6" ${S3}/><g class="tf"><ellipse class="tf-eye" cx="30" cy="28" rx="3" ry="4.2" fill="${OL}"/><ellipse class="tf-eye" cx="46" cy="28" rx="3" ry="4.2" fill="${OL}"/><path class="tf-grin" d="M32 36Q38 43 44 36Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  towel:`<svg viewBox="0 0 100 100"><rect x="12" y="24" width="76" height="52" rx="11" fill="#CFE5F4" ${S3}/><path d="M12 40H88M12 60H88" stroke="#8FC3E6" stroke-width="5"/><path d="M88 30Q96 50 88 70" fill="none" stroke="#8FC3E6" stroke-width="4" stroke-dasharray="3 4"/><g class="tf"><ellipse class="tf-eye" cx="38" cy="50" rx="3.2" ry="4.6" fill="${OL}"/><ellipse class="tf-eye" cx="62" cy="50" rx="3.2" ry="4.6" fill="${OL}"/><path class="tf-grin" d="M43 56Q50 64 57 56Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  sprayer:`<svg viewBox="0 0 100 100"><path d="M44 52H56L60 94H40Z" fill="#A7CFE8" ${S3}/><rect x="28" y="8" width="44" height="46" rx="18" fill="#E6EAF0" ${S3}/><path d="M34 54H66L60 70H40Z" fill="#9AA2B1" ${S3}/><circle cx="43" cy="62" r="2" fill="#fff"/><circle cx="50" cy="64" r="2" fill="#fff"/><circle cx="57" cy="62" r="2" fill="#fff"/><g class="tf"><ellipse class="tf-eye" cx="42" cy="28" rx="3" ry="4.4" fill="${OL}"/><ellipse class="tf-eye" cx="58" cy="28" rx="3" ry="4.4" fill="${OL}"/><path class="tf-grin" d="M44 36Q50 43 56 36Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  scourer:`<svg viewBox="0 0 100 100"><rect x="14" y="30" width="72" height="44" rx="20" fill="#C8CDD6" ${S3}/><path d="M24 44Q34 36 44 46T64 44T78 52M26 60Q38 52 48 62T72 60" fill="none" stroke="#8E96A6" stroke-width="3" stroke-linecap="round"/><g class="tf"><ellipse class="tf-eye" cx="38" cy="50" rx="3.2" ry="4.6" fill="${OL}"/><ellipse class="tf-eye" cx="62" cy="50" rx="3.2" ry="4.6" fill="${OL}"/><path class="tf-grin" d="M43 57Q50 65 57 57Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  faucet:`<svg viewBox="0 0 110 110"><rect x="8" y="98" width="94" height="10" rx="5" fill="#C8CDD6" ${S3}/><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="${OL}" stroke-width="20" stroke-linecap="round"/><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="#DDE3EA" stroke-width="12" stroke-linecap="round"/><rect x="68" y="62" width="24" height="12" rx="4" fill="#9AA2B1" ${S3}/><circle cx="24" cy="46" r="13" fill="#8FC3E6" ${S3}/><path d="M24 36V56M14 46H34" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/></svg>`,
  bin:`<svg viewBox="0 0 60 70"><path d="M8 20H52L47 64Q46 68 42 68H18Q14 68 13 64Z" fill="#A9CFA0" ${S3}/><rect x="4" y="10" width="52" height="11" rx="5" fill="#8FC48A" ${S3}/><path d="M24 30V58M36 30V58" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/></svg>`,
  glint:`<svg viewBox="-20 -20 40 40"><path d="M0 -18Q2 -2 18 0Q2 2 0 18Q-2 2 -18 0Q-2 -2 0 -18Z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
};
const soapSVG=hex=>`<svg viewBox="0 0 100 100"><path d="M44 28V12H70" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 28V12H70" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="40" y="26" width="20" height="14" rx="4" fill="#fff" ${S3}/><rect x="24" y="38" width="52" height="56" rx="15" fill="${hex}" ${S3}/><rect x="33" y="54" width="34" height="24" rx="7" fill="#fff" opacity=".85"/><circle cx="46" cy="64" r="5" fill="${hex}" opacity=".7"/><circle cx="56" cy="70" r="3.5" fill="${hex}" opacity=".7"/></svg>`;
/* side pictures of stored dishes (viewBox 0 0 100 100) */
function mini(kind,rim){
  rim=rim||'#A7CFE8';
  if(kind==='plate')return `<ellipse cx="50" cy="50" rx="15" ry="40" fill="#FFFDF9" ${S3}/><ellipse cx="50" cy="50" rx="7" ry="30" fill="${rim}" opacity=".85"/>`;
  if(kind==='cup')return `<path d="M26 28H70L64 84Q50 90 36 84Z" fill="#FFFDF9" ${S3}/><path d="M69 38Q88 38 86 54Q84 68 65 68" fill="none" ${S3}/><path d="M29 42H67" stroke="${rim}" stroke-width="7"/>`;
  if(kind==='bowl')return `<path d="M10 38H90Q88 82 50 86Q12 82 10 38Z" fill="#FFFDF9" ${S3}/><path d="M16 50H84" stroke="${rim}" stroke-width="8"/>`;
  return `<rect x="22" y="30" width="56" height="52" rx="8" fill="#9AA2B1" ${S3}/><rect x="6" y="40" width="16" height="9" rx="4" fill="#9AA2B1" ${S3}/><rect x="78" y="40" width="16" height="9" rx="4" fill="#9AA2B1" ${S3}/><path d="M30 44V72" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/>`;
}
const miniSVG=(k,rim)=>`<svg viewBox="0 0 100 100">${mini(k,rim)}</svg>`;
/* one shelf place as a card: wooden cubby with a sample inside */
function slotCard(type){
  let s=`<rect x="8" y="10" width="84" height="84" rx="12" fill="#F3DFC0" ${S3}/><rect x="16" y="18" width="68" height="68" rx="7" fill="#E7C99C"/>`;
  if(type==='plate')s+=[0,1,2].map(k=>`<g transform="translate(${-14+k*14} 4) scale(.8)">${mini('plate',['#E89AAE','#8FC3E6','#EBCB6B'][k])}</g>`).join('')+`<path d="M18 80H82" stroke="${OL}" stroke-width="3"/>`;
  else if(type==='cup')s+=`<path d="M20 26H80" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`+[0,1].map(k=>`<path d="M${34+k*30} 26V34" stroke="${OL}" stroke-width="3.5"/><g transform="translate(${6+k*30} 22) scale(.55)">${mini('cup',['#E89AAE','#8FC3E6'][k])}</g>`).join('');
  else s+=`<g transform="translate(6 18) scale(.5)">${mini('bowl','#EBCB6B')}</g><g transform="translate(40 30) scale(.55)">${mini('pot')}</g>`;
  return `<svg viewBox="0 0 100 100">${s}</svg>`;
}
/* the shelf on the wall (viewBox 0 0 150 84): three places; placed dishes stand inside */
function rackSVG(placed){
  let s=`<rect x="2" y="4" width="146" height="78" rx="9" fill="#F3DFC0" ${S3}/>`;
  SLOTS.forEach((t,i)=>{const x=8+i*46;s+=`<rect x="${x}" y="10" width="40" height="66" rx="5" fill="#E7C99C"/>`;
    const items=placed.filter(p=>SLOT_OF[p.kind]===t);
    if(t==='cup')s+=`<path d="M${x+3} 20H${x+37}" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
    items.forEach((p,k)=>{const sc=t==='plate'?.42:t==='cup'?.36:.4,ox=t==='plate'?x+2+(k%4)*7-6:t==='cup'?x+2+(k%2)*18:x+(k%2)*17-4,oy=t==='plate'?22:t==='cup'?22:34+(Math.floor(k/2))*-6;
      s+=`<g transform="translate(${ox} ${oy}) scale(${sc})">${mini(p.kind,p.rim)}</g>`})});
  return `<svg viewBox="0 0 150 84">${s}</svg>`;
}
const STEP_ICON={choose:()=>soapSVG('#CFE6CB'),collect:()=>`<svg viewBox="-50 -50 100 100">${base('plate','#8FC3E6')}</svg>`,scrape:()=>ICON.spatula,soap:()=>soapSVG('#F6D3DB'),scrub:()=>ICON.sponge,burnt:()=>ICON.scourer,rinse:()=>ICON.sprayer,dry:()=>ICON.towel,shelve:()=>slotCard('plate')};
const stepIcon=k=>(STEP_ICON[k]||(()=>''))();

/* ---- dishes seen from above (viewBox -50 -50 100 100); cells sit on the dish ---- */
const CELLS=(()=>{const a=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++){const x=(c-2)*.19,y=(r-2)*.19;if(Math.hypot(x,y)<=.4)a.push([x,y])}return a})();
function base(kind,rim){
  if(kind==='plate')return `<circle r="46" fill="#FFFDF9" ${S3}/><circle r="38" fill="none" stroke="${rim}" stroke-width="6"/><circle r="30" fill="#F4EFE6" stroke="#E2D9CB" stroke-width="1.5"/>`;
  if(kind==='bowl')return `<circle r="45" fill="${rim}" ${S3}/><circle r="37" fill="#FFFDF9" ${S3}/><circle r="29" fill="#EFE8DC"/><path d="M-26 -10Q-18 -26 0 -28" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if(kind==='cup')return `<path d="M30 -12Q54 -14 52 0Q50 14 30 12" fill="none" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M30 -12Q54 -14 52 0Q50 14 30 12" fill="none" stroke="#FFFDF9" stroke-width="5" stroke-linecap="round"/><circle cx="-6" r="38" fill="#FFFDF9" ${S3}/><circle cx="-6" r="33" fill="none" stroke="${rim}" stroke-width="5"/><circle cx="-6" r="27" fill="#F4E7D8" stroke="#E2D2BD" stroke-width="1.5"/>`;
  return `<rect x="-54" y="-9" width="20" height="18" rx="7" fill="#9AA2B1" ${S3}/><rect x="34" y="-9" width="20" height="18" rx="7" fill="#9AA2B1" ${S3}/><circle r="42" fill="#9AA2B1" ${S3}/><circle r="34" fill="#707888" ${S3}/><path d="M-26 -14Q-18 -28 0 -30" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".45"/>`;
}
const DIRT=['#D2412A','#E2A83A','#8A5A3C','#7FA86A'];
function dishSVG(d){
  const o=d.kind==='cup'?-6:0;let s=base(d.kind,d.rim);const T=d.soap;
  const nSv=d.sv.reduce((a,b)=>a+b,0)/d.sv.length;
  d.cells.forEach(([fx,fy],i)=>{const x=fx*100,y=fy*100,u=i*7+d.seed;
    if(d.food[i]&&d.scr[i]<1){const o2=1-d.scr[i],k=d.fk[i];
      s+=k===0?`<g opacity="${o2.toFixed(2)}"><ellipse cx="${x-3}" cy="${y}" rx="5" ry="2.6" fill="#fff" stroke="#D9CDB8" stroke-width="1" transform="rotate(${u*13%60} ${x} ${y})"/><ellipse cx="${x+3}" cy="${y+3}" rx="5" ry="2.6" fill="#fff" stroke="#D9CDB8" stroke-width="1" transform="rotate(${u*29%60} ${x} ${y})"/></g>`
        :k===1?`<circle cx="${x}" cy="${y}" r="4.6" fill="#7FB86A" stroke="#4E8A45" stroke-width="1.2" opacity="${o2.toFixed(2)}"/>`
        :`<rect x="${x-5}" y="${y-4}" width="10" height="8" rx="3" fill="#F29A4A" stroke="#C26A22" stroke-width="1.2" opacity="${o2.toFixed(2)}"/>`}
    if(d.mask[i]&&d.sv[i]<.5)s+=`<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="${d.dirt}" opacity="${((1-2*d.sv[i])*.85).toFixed(2)}" transform="rotate(${u*37%180} ${x} ${y})"/>`;
    if(d.burnt&&d.bv[i]<1)s+=`<ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="#3E2A22" opacity="${((1-d.bv[i])*.92).toFixed(2)}" transform="rotate(${u*53%180} ${x} ${y})"/>`;
    const f=d.sv[i]*(1-d.rv[i]);
    if(f>.05)s+=`<circle cx="${x-3}" cy="${y-2}" r="${(5.5*f+2).toFixed(1)}" fill="#fff" stroke="${T?T.vivid:'#CDE9FA'}" stroke-width="1.4" opacity=".95"/><circle cx="${x+4}" cy="${y+3}" r="${(4.2*f+1.5).toFixed(1)}" fill="${T?T.light:'#fff'}" stroke="#fff" stroke-width="1" opacity=".95"/>`;
    if(d.rv[i]>0&&d.dv[i]<1&&d.rv[i]>=.5)s+=`<ellipse cx="${x+4}" cy="${y-4}" rx="2.2" ry="3.2" fill="#A7CFE8" stroke="#8FC3E6" stroke-width=".8" opacity="${(.85*(1-d.dv[i])).toFixed(2)}"/>`});
  if(d.soap&&nSv<.35)s+=`<g opacity="${(1-nSv*3).toFixed(2)}"><ellipse cx="${o}" cy="0" rx="13" ry="10" fill="${T.hex}" stroke="${OL}" stroke-width="2"/><ellipse cx="${o-4}" cy="-4" rx="4" ry="2.6" fill="#fff" opacity=".7"/></g>`;
  if(d.clean){s+=`<g transform="translate(${o} 2)" opacity=".92"><ellipse cx="-9" cy="-12" rx="4" ry="9" fill="#FFFDF9" stroke="${OL}" stroke-width="1.8" transform="rotate(-12 -9 -12)"/><ellipse cx="9" cy="-12" rx="4" ry="9" fill="#FFFDF9" stroke="${OL}" stroke-width="1.8" transform="rotate(12 9 -12)"/><circle r="15" fill="#FFF9F2" stroke="${OL}" stroke-width="2"/><circle cx="-5" cy="-2" r="2" fill="#4A2E20"/><circle cx="5" cy="-2" r="2" fill="#4A2E20"/><path d="M-4 4Q0 8 4 4" fill="none" stroke="#4A2E20" stroke-width="1.8" stroke-linecap="round"/><circle cx="-9" cy="3" r="2.6" fill="#FF86A8" opacity=".6"/><circle cx="9" cy="3" r="2.6" fill="#FF86A8" opacity=".6"/></g><g transform="translate(26 -28) scale(.5)">${svgInner(ICON.glint)}</g>`}
  return `<svg viewBox="-50 -50 100 100" style="overflow:visible">${s}</svg>`;
}
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');

/* ============================== screen: the three zones (same structure as pizzashop.js) ============================== */
const css=`
#dishes2{gap:6px}
#dishes2 .dk-head{flex:none;height:${HEAD_PX}px;gap:8px}
#dishes2 .dk-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#dishes2 .dk-back svg{width:100%;height:100%;display:block}
.dk-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.dk-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.dk-strip span svg{width:72%;height:72%;display:block}
.dk-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.dk-strip span.done{opacity:.9}
.dk-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.dk-strip span .st svg{width:100%;height:100%}
.dk-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC}
.dk-stage>div{position:absolute}
.dk-wall{left:0;right:0;top:0;height:34%;pointer-events:none}
.dk-wall svg,.dk-counter svg{width:100%;height:100%;display:block}
.dk-counter{left:0;right:0;top:34%;bottom:0;pointer-events:none;background:linear-gradient(180deg,#E9D6BC,#E2C9A8);border-top:4px solid ${OL}}
.dk-rack{pointer-events:none;z-index:2}
.dk-rack svg{width:100%;height:100%;display:block;overflow:visible}
.dk-bin{pointer-events:none;z-index:2}
.dk-bin svg{width:100%;height:100%;display:block;overflow:visible}
.dk-cust{z-index:3;pointer-events:none}
.dk-cust svg{width:100%;height:100%;display:block;overflow:visible}
.dk-cust.enter{animation:dkin 1.2s cubic-bezier(.3,1.1,.5,1)}
@keyframes dkin{from{transform:translateX(120%)}to{transform:none}}
.dk-cust.leave{animation:dkout 1.1s ease-in forwards}
@keyframes dkout{to{transform:translateX(130%)}}
.dk-cust.alive.dk-rub .al-arm-r{animation:dkrub 1.6s ease-in-out infinite}
@keyframes dkrub{0%,100%{transform:rotate(38deg)}50%{transform:rotate(54deg)}}
.dk-cust.callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
.dk-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:22px;padding:6px 8px;display:flex;align-items:center;gap:2px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.dk-bub::after{content:"";position:absolute;right:-14px;bottom:14px;border:8px solid transparent;border-left-color:${OL}}
.dk-sink{z-index:2;pointer-events:none}
.dk-basin{position:absolute;left:0;right:0;top:0;bottom:0;border-radius:34px;background:linear-gradient(180deg,#C9D2DC,#DDE4EA);border:4px solid ${OL};box-shadow:inset 0 8px 14px rgba(91,74,66,.12);transition:top .5s ease-in-out,opacity .4s}
.dk-basin::after{content:"";position:absolute;inset:10px;border-radius:26px;background:#EAF3F8;opacity:.9}
.dk-sink.table .dk-basin{top:64%}
.dk-tabletop{position:absolute;inset:-8px -6px -8px -6px;border-radius:30px;background:#F3E3C8;opacity:0;transition:opacity .4s;background-image:linear-gradient(90deg,transparent 48%,rgba(217,160,102,.2) 48% 52%,transparent 52%)}
.dk-sink.table .dk-tabletop{opacity:1}
.dk-dish{position:absolute;pointer-events:none;transition:left .5s ease-in-out,top .5s ease-in-out,width .5s ease-in-out,height .5s ease-in-out,transform .25s,opacity .3s}
.dk-dish svg{width:100%;height:100%;display:block}
.dk-dish.sel{transform:translateY(-10px) scale(1.1);filter:drop-shadow(0 0 10px ${PAL.butter||'#F0D58A'})}
.dk-dish.hide{display:none}
.dk-dish.nope{animation:dknope .45s}
@keyframes dknope{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.dk-faucet,.dk-bottle{z-index:3;pointer-events:none;transition:opacity .4s,transform .3s}
.dk-faucet svg,.dk-bottle svg{width:100%;height:100%;display:block;overflow:visible}
.dk-bottle{opacity:0}.dk-bottle.show{opacity:1}
.dk-bottle.squeeze{transform:scale(1,.86)}
.dk-faucet.off,.dk-bottle.off{opacity:0}
.dk-faucet.callme svg,.dk-bottle.callme svg{animation:dkcall .8s ease-in-out}
@keyframes dkcall{0%,100%{filter:none}50%{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}}
.dk-water{z-index:2;pointer-events:none;width:16px;border-radius:8px;background:repeating-linear-gradient(180deg,#CFE5F4 0 10px,#A7CFE8 10px 18px);background-size:100% 36px;animation:dkflow .8s linear infinite;opacity:.85;display:none}
.dk-water.on{display:block}
@keyframes dkflow{to{background-position:0 36px}}
.dk-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.dk-float{position:absolute;pointer-events:none;will-change:transform}
.dk-float svg{width:100%;height:100%;display:block;overflow:visible}
.dk-drop{position:absolute;z-index:21;pointer-events:none;width:26px;height:26px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;animation:dkdrop .55s ease-in forwards}
@keyframes dkdrop{from{transform:translateY(-40px) scale(.6);opacity:.4}to{transform:translateY(0) scale(1);opacity:1}}
.dk-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.dk-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.dk-tool svg{width:100%;height:100%;display:block}
.dk-tool.in{animation:dkcard .3s ease-out both}
.dk-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:12px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.dk-card svg{width:100%;height:100%;display:block;pointer-events:none}
.dk-card.in{animation:dkcard .3s ease-out both}
.dk-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.dk-card.fade{opacity:.35}
.dk-card.nope{animation:dknope .45s}
@keyframes dkcard{from{transform:translateY(24px);opacity:0}}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const WALL=`<svg viewBox="0 0 100 34" preserveAspectRatio="none"><rect width="100" height="34" fill="#F3EADD"/>${Array.from({length:14},(_,i)=>`<path d="M${i*8} 0V34" stroke="#EADFCE" stroke-width="1"/>`).join('')}<rect y="26" width="100" height="8" fill="#E8DAC5"/><rect x="60" y="3" width="16" height="12" rx="2" fill="#DCEBF0" stroke="#D9BFA6" stroke-width="1.2"/><path d="M68 3V15M60 9H76" stroke="#D9BFA6" stroke-width="1"/></svg>`;
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar dk-head"><button class="round dk-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="dk-strip" id="dkStrip"></div></div>
<div class="dk-stage" id="dkStage"><div class="dk-wall">${WALL}</div><div class="dk-counter"></div><div class="dk-rack" id="dkRack"></div><div class="dk-bin" id="dkBin">${ICON.bin}</div>
<div class="dk-cust" id="dkCust"></div><div class="dk-bub" id="dkBub" hidden></div>
<div class="dk-sink" id="dkSink"><div class="dk-tabletop"></div><div class="dk-basin"></div><div class="dk-dishes" id="dkDishes"></div></div>
<div class="dk-water" id="dkWater"></div><div class="dk-faucet" id="dkFaucet">${ICON.faucet}</div><div class="dk-bottle" id="dkBottle"></div><div class="dk-fx" id="dkFx"></div></div>
<div class="dk-tray" id="dkTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='설거지';
const $=s=>sec.querySelector(s);
const stage=$('#dkStage'),stripEl=$('#dkStrip'),custEl=$('#dkCust'),bubEl=$('#dkBub'),sinkEl=$('#dkSink'),dishesEl=$('#dkDishes'),waterEl=$('#dkWater'),faucetEl=$('#dkFaucet'),bottleEl=$('#dkBottle'),rackEl=$('#dkRack'),binEl=$('#dkBin'),fxEl=$('#dkFx'),tray=$('#dkTray');
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0,last:''},store.get('mallang_dishes2',{}));
const save=()=>store.set('mallang_dishes2',DATA);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LV.length,n))}
function levelInfo(n){
  const f={level:n,count:2,collect:false,dry:false,scrape:false,shelve:false,burnt:false,cup:false};
  LV.slice(0,n).forEach(l=>{const t=l.new||'',m=t.match(/(\d+)\s*개/);if(m)f.count=+m[1];
    if(/걷기/.test(t))f.collect=true;if(/컵/.test(t))f.cup=true;if(/행주/.test(t))f.dry=true;if(/긁기/.test(t))f.scrape=true;if(/선반/.test(t))f.shelve=true;if(/탄 자국|냄비/.test(t))f.burnt=true});
  return f;
}
function planFor(lv){
  const p=['choose'];if(lv.collect)p.push('collect');if(lv.scrape)p.push('scrape');p.push('soap','scrub');if(lv.burnt)p.push('burnt');p.push('rinse');if(lv.dry)p.push('dry');if(lv.shelve)p.push('shelve');p.push('serve');return p;
}

/* ---------- state ---------- */
let lv=null,plan=[],pi=0,S=null,al=null,H={},act=null,tool=null,gen=0,misses=0,lastMiss=0,flying=0,busy=false,lastTap=0,phase='',kind='wait',AIM=null;
const killTool=()=>{if(tool){tool.destroy();tool=null}};
const G0={W:0,H:0,wallH:0,sx:0,sy:0,sw:0,sh:0};
const stR=()=>stage.getBoundingClientRect();
const stXY=(cx,cy)=>{const s=stR();return[cx-s.left,cy-s.top]};
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;

/* ---------- layout: header 72px · stage · tray 18~22% of the screen ---------- */
function slotsFor(n,w,h){
  if(n<=2){const s=Math.min(w/2*.9,h*.9,176),g=(w-n*s)/(n+1);return Array.from({length:n},(_,i)=>({x:g+(s+g)*i,y:(h-s)/2,s}))}
  const s=Math.min(w/2*.88,h/2*.92),gx=(w-2*s)/3,gy=(h-2*s)/3;
  return Array.from({length:n},(_,i)=>{const c=i%2,r=Math.floor(i/2),alone=(n===3&&i===2);return{x:alone?(w-s)/2:gx+(s+gx)*c,y:gy+(s+gy)*r,s}});
}
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  const r=stR(),W=r.width,Hh=r.height;if(!W)return;const wallH=Hh*.34;
  const ch=Math.min(wallH*.98,W*.36*230/200),cw=ch*200/230;
  Object.assign(custEl.style,{width:cw+'px',height:ch+'px',right:(W*.03)+'px',top:(wallH-ch*.93)+'px'});
  Object.assign(bubEl.style,{right:(W*.03+cw+10)+'px',top:(wallH*.12)+'px'});
  const rw=Math.min(W*.4,wallH*.92*150/84);Object.assign(rackEl.style,{left:(W*.03)+'px',top:(wallH*.08)+'px',width:rw+'px',height:rw*84/150+'px'});
  Object.assign(binEl.style,{left:(W*.03+rw+8)+'px',top:(wallH*.55)+'px',width:'44px',height:'52px'});
  const fz=110,sy=wallH+fz*.6,sh2=Hh-sy-8,sx=W*.03,sw=W*.94;Object.assign(G0,{W,H:Hh,wallH,sx,sy,sw,sh:sh2});
  Object.assign(sinkEl.style,{left:sx+'px',top:sy+'px',width:sw+'px',height:sh2+'px'});
  Object.assign(faucetEl.style,{width:fz+'px',height:fz+'px',left:(W/2-fz*.28)+'px',top:(wallH-fz*.4)+'px'});
  Object.assign(bottleEl.style,{width:fz+'px',height:fz+'px',left:(W*.04)+'px',top:(wallH-fz*.4)+'px'});
  Object.assign(waterEl.style,{left:(W/2-fz*.28+fz*.72-8)+'px',top:(wallH-fz*.4+fz*.6)+'px',height:(sy+sh2*.45-(wallH-fz*.4+fz*.6))+'px'});
  layoutDishes();rackDraw();
}
function dishRect(d){
  const w=G0.sw,h=G0.sh,n=S.dishes.length;
  if(S.view==='table'){
    if(d.collected){const s=Math.min(h*.26,w/(n+1)*.9),gap=(w-n*s)/(n+1);return{x:gap+(s+gap)*d.ci,y:h*.68,s}}
    const sl=slotsFor(n,w,h*.62);return sl[S.dishes.indexOf(d)];
  }
  return slotsFor(n,w,h)[S.dishes.indexOf(d)];
}
function layoutDishes(){
  if(!S)return;S.dishes.forEach(d=>{const q=dishRect(d);if(!q)return;Object.assign(d.el.style,{left:q.x+'px',top:q.y+'px',width:q.s+'px',height:q.s+'px'});d.el.classList.toggle('hide',!!d.shelved)});
}
const dishCenterClient=d=>{const r=d.el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
/* fractions (of the sink rect) of the cells that a tool works on */
function cellList(filter){
  const out=[],w=G0.sw,h=G0.sh;
  S.dishes.forEach(d=>{if(d.shelved)return;const q=slotsFor(S.dishes.length,w,h)[S.dishes.indexOf(d)];
    d.cells.forEach((c,i)=>{if(!filter||filter(d,i))out.push({d,i,fx:(q.x+q.s*(.5+c[0]))/w,fy:(q.y+q.s*(.5+c[1]))/h})})});
  return out;
}

/* ---------- drawing ---------- */
let raf=0;const rd=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})};
function draw(){if(!S)return;S.dishes.forEach(d=>{if(!d.shelved)d.el.innerHTML=dishSVG(d)})}
function rackDraw(){rackEl.innerHTML=rackSVG(S?S.dishes.filter(d=>d.shelved):[])}
function drawCust(mood){custEl.innerHTML=A.animal('bunny',mood||'idle',{apron:'#E3A79A'});if(al)al.refresh()}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5);
  stripEl.innerHTML=win.map(o=>`<span class="${o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function toolTray(html){tray.innerHTML=`<div class="dk-tool in">${html}</div>`;return tray.querySelector('.dk-tool')}
function setView(v){S.view=v;sinkEl.classList.toggle('table',v==='table');layoutDishes()}
const setCleanLook=()=>{};

/* ---------- touches ---------- */
function miss(){misses++;G.nudge();custEl.classList.remove('callme');void custEl.offsetWidth;custEl.classList.add('callme');setTimeout(()=>custEl.classList.remove('callme'),700);
  const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
stage.addEventListener('pointerdown',e=>{
  actx();if(!H.down)return;e.preventDefault();G.touch();
  const r=H.down(e);if(r===false){miss();return}
  if(H.move||H.up){try{stage.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId}
});
stage.addEventListener('pointermove',e=>{if(act===e.pointerId&&H.move)H.move(e)});
const endP=e=>{G.release();if(act!==e.pointerId)return;act=null;if(H.up)H.up(e)};
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,endP));
const alMood=(m,ms)=>{if(!al)return;al.setMood(m);if(ms){const g=gen;L.later(()=>{if(g===gen&&al&&phase!=='serve')al.setMood('')},ms)}};
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};
const tapOk=()=>{const n=performance.now();if(n-lastTap<260)return false;lastTap=n;return true};
const toolPx=()=>{const t=TOUCH.tool||{},w=stR().width;return Math.min(t.maxPx||300,Math.max(t.minPx||180,w*(t.stageWidthRatio||.45)))};
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='dk-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-40}px) scale(${(1+k)/2})`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}
  catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);
}
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});
/* one tool step through ML.P2.makeTool: the tool follows the finger, only touched cells change, holding still also finishes */
function rubTool(o){
  killTool();const cells=cellList(o.filter),w=G0.sw,h=G0.sh;
  const sp=Math.max(14,slotsFor(S.dishes.length,w,h)[0].s*.19),gc=Math.max(3,Math.round(w/sp)),gr=Math.max(3,Math.round(h/sp));
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:cells.map(c=>[c.fx,c.fy]),target:()=>sinkEl.getBoundingClientRect(),rub:o.rub,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:[gc,gr],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,sound:o.hold?()=>P.holdSound(o.hold):null,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log)},onRelease:()=>G.release(),
    onCell:(i,v)=>{const c=cells[i];o.cell(c.d,c.i,v);rd()},
    onProgress:(p,ratio,why)=>{if(!o.hold&&(why==='move'||why==='hold')){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}
const spark=(x,y,n=3)=>{for(let k=0;k<n;k++){const g=document.createElement('div');g.className='dk-float';g.innerHTML=ICON.glint;const sz=22+rand(12);Object.assign(g.style,{width:sz+'px',height:sz+'px',left:(x-sz/2+rand(50)-25)+'px',top:(y-sz/2+rand(40)-20)+'px'});fxEl.appendChild(g);
  try{g.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1)',opacity:1,offset:.4},{transform:'scale(.5) translateY(-20px)',opacity:0}],{duration:1100,delay:k*120,fill:'forwards'})}catch(e){}setTimeout(()=>g.remove(),1500)}};

/* ============================== processes ============================== */
const dishAt=e=>S.dishes.find(d=>!d.shelved&&inRect(e,d.el.getBoundingClientRect(),6));
const STEP={
  /* 세제 고르기: 카드 3장 (틀린 답 없음) */
  choose(){
    kind='cards';const cols=shuffle(CC.slice()).slice(0,3);let lock=0;
    tray.innerHTML=cols.map((c,k)=>`<button class="dk-card in" data-i="${k}" aria-label="${c.ko} 세제" style="animation-delay:${k*60}ms">${soapSVG(c.hex)}</button>`).join('');
    say('어떤 세제로 씻을까? 하나 골라 봐!','Which soap? Pick one!',true);
    G.start({type:'tap',wait:true,at:()=>{const b=tray.querySelector('.dk-card');if(!b)return[0,0];return stXY(...ctr(b))}});
    tray.onpointerdown=e=>{const b=e.target.closest('.dk-card');if(!b||phase!=='choose'||b.classList.contains('sel'))return;e.preventDefault();const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();
      const c=cols[+b.dataset.i];S.soap={ko:c.ko,en:c.en,hex:c.hex,light:c.light,vivid:c.vivid};LOG.push('choose:'+c.en);
      b.classList.add('sel');tray.querySelectorAll('.dk-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();say(`${c.ko} 세제!`,`${cap(c.en)} soap!`);alMood('wow',900);
      bottleEl.innerHTML=soapSVG(c.hex);bottleEl.classList.add('show');tray.onpointerdown=null;G.stop();kind='wait';AIM=null;
      const g=gen;L.later(()=>{if(g===gen)finish()},900)};
  },
  /* 걷기: 식탁의 그릇을 콕 하면 싱크대로 */
  collect(){
    kind='tap';S.collected=0;toolTray(stepIcon('collect'));say('그릇을 콕 누르면 싱크대로 가요!','Tap a dish to put it in the sink!',true);
    AIM=()=>{const d=S.dishes.find(x=>!x.collected);return d?dishCenterClient(d):[0,0]};
    H={down:e=>{const d=dishAt(e);if(!d||d.collected)return false;if(busy||!tapOk())return;
      d.collected=true;d.ci=S.collected++;LOG.push('collect');sfx.pop();layoutDishes();const k=S.collected;say(M.CNT_KO[k-1]+'!',cap(M.CNT_EN[k-1])+'!');alMood('wow',600);
      if(k>=S.dishes.length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('그릇을 다 모았어요!','All the dishes are in!');finish(()=>{setView('sink')})},900)}}};
    guideAt(AIM,'tap','그릇을 콕 눌러 봐!','Tap a dish!');
  },
  /* 긁기: 주걱으로 남은 음식을 쓱 */
  scrape(){
    kind='rub';const stopI=intro(ICON.spatula,'주걱!','Spatula!');say('남은 음식을 쓱쓱 긁어서 통에 담아요!','Scrape the food into the bin!',true);
    const left=S.dishes.map(d=>d.food.filter(Boolean).length);let bits=0;
    rubTool({icon:ICON.spatula,anchor:[.36,.58],gap:.35,log:'scrape',stopIntro:stopI,effect:'rub',fx:()=>'',
      cell:(d,i,v)=>{d.scr[i]=v;if(v>=1&&d.food[i]){const di=S.dishes.indexOf(d);left[di]--;bits++;LOG.push('scrape');binEl.querySelector('svg').style.transform=`scale(${1+Math.min(.25,bits*.02)})`;
        const r=d.el.getBoundingClientRect(),b=binEl.getBoundingClientRect();fly(`<svg viewBox="-8 -8 16 16"><circle r="6" fill="#F29A4A" stroke="${OL}" stroke-width="1.6"/></svg>`,[r.left+r.width*(.5+d.cells[i][0]),r.top+r.height*(.5+d.cells[i][1])],[b.left+b.width/2,b.top+10],16,12,520,()=>{if(bits%3===0)tone(300+bits*8,.08,'sine',.1)})}},
      done:()=>{S.dishes.forEach(d=>d.scr.fill(1));draw();SFX.sparkle();say('남은 음식이 다 없어졌어요!','All the food is gone!');finish()}});
    G.start({type:'scrub',at:()=>stXY(...ctr(sinkEl)),ko:'쓱쓱 긁어 봐!',en:'Scrape scrape!'});
  },
  /* 세제: 병을 콕 → 방울이 톡, 그릇마다 한 번 */
  soap(){
    kind='tap';S.squeezed=0;bottleEl.classList.add('show');
    const stopI=intro(soapSVG(S.soap.hex),`${S.soap.ko} 세제!`,`${cap(S.soap.en)} soap!`);say('세제를 꾹 짜요! 병을 콕 누르면 방울이 톡!','Squeeze the soap! Tap the bottle!',true);
    AIM=()=>ctr(bottleEl);
    H={down:e=>{if(!inRect(e,bottleEl.getBoundingClientRect(),8))return false;if(busy||!tapOk())return;busy=true;stopI();
      const d=S.dishes[S.squeezed],k=S.squeezed+1;S.squeezed=k;LOG.push('squeeze');bottleEl.classList.add('squeeze');sfx.pop();noise(.25,{type:'lowpass',freq:700,vol:.12});
      const dc=dishCenterClient(d),sr=stR(),[x,y]=stXY(dc[0],dc[1]-d.el.getBoundingClientRect().height*.1),drop=document.createElement('div');drop.className='dk-drop';
      Object.assign(drop.style,{left:(x-13)+'px',top:(y-13)+'px',background:S.soap.hex,border:`2.5px solid ${OL}`});fxEl.appendChild(drop);void sr;
      const g=gen;L.later(()=>{if(g!==gen)return;bottleEl.classList.remove('squeeze');d.soap=S.soap;drop.remove();tone(880,.08,'sine',.14);draw();say(M.CNT_KO[k-1]+'!',cap(M.CNT_EN[k-1])+'!');busy=false;
        if(k>=S.dishes.length){H={};G.stop();kind='wait';L.later(()=>{if(g===gen){SFX.sparkle();say('세제 준비 끝!','Soap is ready!');finish()}},500)}},520)}};
    guideAt(AIM,'tap','병을 콕 눌러 봐!','Tap the bottle!');
  },
  /* 거품: 수세미로 쓱쓱 (닿은 곳만 얼룩이 지워지고 거품이 남음) */
  scrub(){
    kind='rub';alMood('ticklish');const stopI=intro(ICON.sponge,'수세미!','Sponge!');say('수세미로 쓱쓱 문질러 거품을 내요!','Rub with the sponge to make bubbles!',true);
    rubTool({icon:ICON.sponge,anchor:[.5,.78],gap:.4,log:'scrub',stopIntro:stopI,cell:(d,i,v)=>{d.sv[i]=v},
      done:()=>{S.dishes.forEach(d=>d.sv.fill(1));draw();SFX.sparkle();say('뽀글뽀글! 거품이 가득!','Bubbles everywhere!');alMood('happy',1200);finish()}});
    guideAt(()=>ctr(sinkEl),'scrub','쓱쓱 문질러 봐!','Rub rub!');
  },
  /* 탄 자국: 냄비만, 철수세제로 더 오래 */
  burnt(){
    kind='rub';const stopI=intro(ICON.scourer,'철수세미!','Scrubber!');say('냄비의 탄 자국은 오래오래 쓱쓱 문질러요!','Burnt spots need extra scrubbing!',true);
    rubTool({icon:ICON.scourer,anchor:[.5,.74],gap:.4,log:'burnt',stopIntro:stopI,filter:(d)=>d.burnt,rad:.075,rub:{needStageWidths:4},cell:(d,i,v)=>{d.bv[i]=v},
      done:()=>{S.dishes.forEach(d=>d.bv.fill(1));draw();SFX.sparkle();say('탄 자국이 없어졌어요!','The burnt spots are gone!');finish()}});
    guideAt(()=>{const d=S.dishes.find(x=>x.burnt);return d?dishCenterClient(d):ctr(sinkEl)},'scrub','쓱쓱 문질러 봐!','Rub rub!');
  },
  /* 헹굼: 수도꼭지를 콕 → 샤워기를 움직여 거품을 씻어 냄 */
  rinse(){
    kind='tap';toolTray(ICON.faucet);say('수도꼭지를 콕 눌러서 물을 틀어요!','Tap the faucet to turn on the water!',true);
    AIM=()=>ctr(faucetEl);
    H={down:e=>{if(!inRect(e,faucetEl.getBoundingClientRect(),8))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();
      waterEl.classList.add('on');noise(.8,{type:'lowpass',freq:1600,vol:.18,sweep:-600});LOG.push('faucet');say('쏴아~','Splash!');
      const g=gen;L.later(()=>{if(g!==gen)return;busy=false;kind='rub';AIM=null;const stopI=intro(ICON.sprayer,'샤워기!','Sprayer!');say('물줄기로 거품을 씻어 내요!','Rinse off the bubbles!',true);
        rubTool({icon:ICON.sprayer,effect:'water',anchor:[.5,.68],gap:.5,log:'rinse',stopIntro:stopI,hold:'shower',cell:(d,i,v)=>{d.rv[i]=v},
          done:()=>{S.dishes.forEach(d=>{d.rv.fill(1);if(!lv.dry){d.dv.fill(1);d.clean=true}});draw();waterEl.classList.remove('on');SFX.sparkle();say('깨끗해!','All clean!');alMood('wow',900);finish()}});
        guideAt(()=>ctr(sinkEl),'scrub','쓱쓱 헹궈 봐!','Rinse it off!')},800)}};
    guideAt(AIM,'tap','수도꼭지를 콕 눌러 봐!','Tap the faucet!');
  },
  /* 닦기: 행주로 쓱쓱, 토토도 함께 */
  dry(){
    kind='rub';custEl.classList.add('dk-rub');alMood('happy');const stopI=intro(ICON.towel,'행주!','Towel!');say('행주로 닦아서 반짝반짝 만들어요!','Dry with the towel until it shines!',true);
    const nDone=S.dishes.map(()=>0),total=CELLS.length;
    rubTool({icon:ICON.towel,anchor:[.5,.6],gap:.4,effect:'rub',fx:({x,y})=>`<circle cx="${x}" cy="${y}" r="26" fill="#fff" opacity=".35"/>`,log:'dry',stopIntro:stopI,sound:()=>sweepTone(240,180,.1,'sine',.1),
      cell:(d,i,v)=>{d.dv[i]=v;if(v>=1){const di=S.dishes.indexOf(d);nDone[di]++;if(nDone[di]>=total-1&&!d.clean){d.clean=true;LOG.push('shine');sfx.pop();const c=dishCenterClient(d);spark(...stXY(c[0],c[1]),2);alPlay('hop')}}},
      done:()=>{S.dishes.forEach(d=>{d.dv.fill(1);d.clean=true});draw();custEl.classList.remove('dk-rub');SFX.sparkle();say('반짝반짝! 그릇에 토토 얼굴이 보여요!','So shiny! I can see Toto!');alMood('wow',1200);finish()}});
    guideAt(()=>ctr(sinkEl),'scrub','쓱쓱 닦아 봐!','Wipe wipe!');
  },
  /* 선반: 그릇을 콕, 맞는 칸을 콕 (틀리면 이름을 말해 주고 다시) */
  shelve(){
    kind='shelve';S.sel=null;const types=S.slotTypes;let lock=0;
    tray.innerHTML=types.map((t,k)=>`<button class="dk-card in" data-t="${t}" aria-label="${t}" style="animation-delay:${k*60}ms">${slotCard(t)}</button>`).join('');
    say('맞는 칸에 꽂아요! 그릇을 콕, 칸을 콕!','Put each dish in its place! Tap the dish, then the shelf!',true);
    const next=()=>S.dishes.find(d=>!d.shelved);
    AIM=()=>{const d=S.sel||next();return d?dishCenterClient(d):[0,0]};
    const select=d=>{S.dishes.forEach(x=>x.el.classList.toggle('sel',x===d));S.sel=d;if(d){LOG.push('select:'+d.kind);tone(620,.08,'triangle',.14);say(`${KO[d.kind]}!`,`${cap(EN[d.kind])}!`,true)}};
    const place=(d,t,btn)=>{
      if(SLOT_OF[d.kind]!==t){d.el.classList.remove('nope');void d.el.offsetWidth;d.el.classList.add('nope');btn.classList.remove('nope');void btn.offsetWidth;btn.classList.add('nope');LOG.push('wrong:'+d.kind+'>'+t);S.wrongShelf=(S.wrongShelf||0)+1;
        say(`이건 ${KO[d.kind]}이야! 다른 칸에 넣어 보자!`,`This is a ${EN[d.kind]}! Try another spot!`);return}
      busy=true;const q=rackEl.getBoundingClientRect(),i=SLOTS.indexOf(t),from=dishCenterClient(d),to=[q.left+q.width*(.19+i*.31),q.top+q.height*.55];const sz=d.el.getBoundingClientRect().width;
      d.el.classList.remove('sel');d.el.style.opacity='0';S.sel=null;LOG.push('shelve:'+d.kind);
      fly(miniSVG(d.kind,d.rim),from,to,sz*.7,q.width*.18,600,()=>{d.shelved=true;layoutDishes();rackDraw();busy=false;sfx.pop();alPlay('hop');
        const k=S.dishes.filter(x=>x.shelved).length;say(M.CNT_KO[k-1]+'!',cap(M.CNT_EN[k-1])+'!');
        if(k>=S.dishes.length){H={};tray.onpointerdown=null;G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('선반이 가득 찼어요!','The shelf is full!');finish()},600)}})};
    H={down:e=>{const d=dishAt(e);if(!d)return false;if(busy||!tapOk())return;select(S.sel===d?null:d)}};
    tray.onpointerdown=e=>{const b=e.target.closest('.dk-card');if(!b||phase!=='shelve'||busy)return;e.preventDefault();const n=performance.now();if(n-lock<400)return;lock=n;actx();G.touch();
      const d=S.sel||next();if(!d)return;if(!S.sel)select(d);place(d,b.dataset.t,b)};
    guideAt(AIM,'tap','그릇을 콕 눌러 봐!','Tap a dish!');
  },
  /* 끝내기: 토토를 콕 → (1~2단계는 그릇이 선반으로) → 박수 → 하트 */
  serve(){
    kind='tap';toolTray(ICON.heart);AIM=()=>ctr(custEl);setView('sink');
    say('다 씻었어요! 토토를 콕 눌러 줘요!','All clean! Tap Toto!',true);
    H={down:e=>{if(!inRect(e,custEl.getBoundingClientRect(),10)&&!dishAt(e))return false;H={};G.stop();kind='wait';give()}};
    guideAt(AIM,'tap','토토를 콕 눌러 봐!','Tap Toto!');
  }
};
function finish(between){
  H={};kind='wait';AIM=null;const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const k=plan[pi];if(!k)return;phase=k;strip();size();G.place();STEP[k]();
}

/* ---------- ending: the dishes go to the shelf, Toto claps, a heart ---------- */
function give(){
  phase='serve';LOG.push('serve');const g=gen;let t=0;
  const toShelf=S.dishes.filter(d=>!d.shelved);
  toShelf.forEach((d,k)=>L.later(()=>{if(g!==gen)return;const q=rackEl.getBoundingClientRect(),i=SLOTS.indexOf(SLOT_OF[d.kind]),from=dishCenterClient(d),sz=d.el.getBoundingClientRect().width;
    d.el.style.opacity='0';fly(miniSVG(d.kind,d.rim),from,[q.left+q.width*(.19+i*.31),q.top+q.height*.55],sz*.7,q.width*.18,600,()=>{d.shelved=true;layoutDishes();rackDraw();sfx.pop()})},k*350));
  t=toShelf.length?toShelf.length*350+800:200;
  L.later(()=>{if(g!==gen)return;drawCust('happy');alPlay('dance');const p=pick((VO.praise||[{ko:'반짝반짝!',en:'So shiny!'}]));say(p.ko+' 고마워!',p.en+' Thank you!');SFX.sparkle();
    L.later(()=>{if(g!==gen)return;heart()},2400)},t);
}
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-60],50,40,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('안녕! 또 도와줘!','Bye! Help me again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');bubEl.hidden=true;
      L.later(()=>{if(g===gen)newRound()},1400)},1500)},1100);
}

/* ---------- a new round ---------- */
function makeDishes(n_lv){
  const cnt=n_lv.count;let kinds,tries=0;
  do{
    if(n_lv.burnt){kinds=['pot'].concat(shuffle(['plate','cup',...(n_lv.level>=BOWL_FROM?['bowl']:[])]).concat(shuffle(['plate','cup','bowl'])).slice(0,cnt-1))}
    else if(!n_lv.cup)kinds=Array(cnt).fill('plate');
    else{const pool=n_lv.level>=BOWL_FROM?['plate','cup','bowl']:['plate','cup'];kinds=shuffle(pool.slice());while(kinds.length<cnt)kinds.push(pick(pool));kinds=kinds.slice(0,cnt);if(n_lv.level<BOWL_FROM&&!kinds.includes('cup'))kinds[0]='cup'}
    kinds=shuffle(kinds);tries++;
  }while(kinds.join()===DATA.last&&tries<6&&n_lv.cup);
  DATA.last=kinds.join();save();
  const rims=shuffle(CC.slice());
  return kinds.map((k,i)=>{const N=CELLS.length,cells=CELLS.map(c=>[c[0]+(k==='cup'?-.06:0),c[1]]),R=A.rng(rand(9999)+i);
    return{kind:k,rim:(rims[i]||{hex:'#A7CFE8'}).hex,cells,seed:rand(50),dirt:pick(DIRT),
      mask:cells.map(()=>R()<.62),food:cells.map(()=>n_lv.scrape&&R()<.5),fk:cells.map(()=>rand(3)),
      sv:Array(N).fill(0),rv:Array(N).fill(0),dv:Array(N).fill(0),bv:Array(N).fill(0),scr:Array(N).fill(0),burnt:k==='pot',
      soap:null,clean:false,collected:!n_lv.collect,ci:-1,shelved:false,el:null}});
}
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.innerHTML='';tray.onpointerdown=null;busy=false;flying=0;custEl.classList.remove('dk-rub');waterEl.classList.remove('on');
  lv=levelInfo(levelNo());const dishes=makeDishes(lv);
  const types=[...new Set(dishes.map(d=>SLOT_OF[d.kind]))];while(types.length<2)types.push(pick(SLOTS.filter(t=>!types.includes(t))));
  S={view:lv.collect?'table':'sink',dishes,soap:null,slotTypes:SLOTS.filter(t=>types.includes(t)),sel:null,collected:0,squeezed:0};
  dishesEl.innerHTML='';dishes.forEach(d=>{d.el=document.createElement('div');d.el.className='dk-dish';dishesEl.appendChild(d.el)});
  bottleEl.classList.remove('show');bottleEl.innerHTML='';bottleEl.classList.remove('squeeze');binEl.querySelector('svg').style.transform='';
  plan=planFor(lv);pi=0;phase='enter';kind='wait';LOG.push('level:'+lv.level,'dishes:'+dishes.map(d=>d.kind).join('+'));
  sinkEl.classList.toggle('table',S.view==='table');size();draw();strip();
  if(al){al.detach();al=null}drawCust('sad');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:'bunny'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=`<svg viewBox="-50 -50 100 100" width="46" height="46">${base('plate','#8FC3E6')}<g transform="translate(24 -26) scale(.7)">${svgInner(ICON.glint)}</g></svg>`;bubEl.hidden=true;
  const g=gen;
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;say('안녕! 나는 토토야. 그릇을 깨끗이 씻어 줘!',"Hi! I'm Toto. Please wash the dishes!")},1200);
  L.later(()=>{if(g!==gen)return;run()},3600);
}

/* ---------- test hooks ---------- */
M.__dishLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__dish=()=>{
  const k=plan[pi]||null,sr=sinkEl.getBoundingClientRect();let aim=null;try{aim=AIM?AIM():null}catch(e){}
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,rect:{x:sr.left,y:sr.top,w:sr.width,h:sr.height},view:S&&S.view,
    dishes:S?S.dishes.map(d=>({kind:d.kind,collected:d.collected,shelved:d.shelved,clean:d.clean,soap:!!d.soap,burnt:d.burnt,sv:+(d.sv.reduce((a,b)=>a+b,0)/d.sv.length).toFixed(2),rv:+(d.rv.reduce((a,b)=>a+b,0)/d.rv.length).toFixed(2),dv:+(d.dv.reduce((a,b)=>a+b,0)/d.dv.length).toFixed(2),bv:+(d.bv.reduce((a,b)=>a+b,0)/d.bv.length).toFixed(2),scr:+(d.scr.reduce((a,b)=>a+b,0)/d.scr.length).toFixed(2),food:d.food.filter(Boolean).length,slot:SLOT_OF[d.kind],xy:dishCenterClient(d)})):[],
    cards:[...tray.querySelectorAll('.dk-card')].map(b=>b.dataset.t||b.dataset.i),slotTypes:S&&S.slotTypes,sel:S&&S.sel?S.dishes.indexOf(S.sel):-1,wrongShelf:S&&S.wrongShelf||0,
    washed:S?S.dishes.filter(d=>d.clean).length:0,shelvedCount:S?S.dishes.filter(d=>d.shelved).length:0,rackItems:S?S.dishes.filter(d=>d.shelved).length:0,
    cellPts:tool?tool.cellPts():[],toolOn:!!tool,soap:S&&S.soap&&S.soap.en,squeezed:S?S.squeezed:0,collected:S?S.collected:0,
    alive:al?al.state():null,misses,guide:G.state(),served:DATA.served,log:LOG.slice(),waterOn:waterEl.classList.contains('on')};
};
M.__dishDepth=()=>LV.map((l,i)=>{const v=levelInfo(i+1),p=planFor(v).filter(k=>k!=='serve'),H2={choose:'choose',collect:'tap',scrape:'rub',soap:'tap',scrub:'rub',burnt:'rub',rinse:'rub',dry:'rub',shelve:'tap'};
  return{level:i+1,processes:new Set(p).size,hands:[...new Set(p.map(k=>H2[k]))],someone:!!M.Alive,choice:true,ending:true}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.onpointerdown=null;if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* tile picture on the home screen */
document.querySelectorAll('.tile[data-go="dishes2"] .ic').forEach(ic=>{
  ic.innerHTML=`<svg viewBox="-50 -50 100 100" style="width:1.5em;height:1.5em;overflow:visible">${base('plate','#8FC3E6')}<g transform="translate(18 -26) scale(.8)">${svgInner(ICON.glint)}</g></svg>`;
});
})();
