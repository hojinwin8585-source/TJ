/* 말랑 식당 (P17) — 셰프 도전을 진짜 요리로. 가게 앞에서 손님을 고르면, 그 주문대로 손으로 직접 요리해요.
   호텔 아침 식사: 빵 고르기 → 토스터에 쏙(콕) → 레버 콕콕(빵이 하양 → 갈색) → 통! 접시로 / 달걀 고르기 → 톡 톡 깨기 → 뒤집개로 쓱쓱(투명 → 하양) → 휙 뒤집기 → 접시로 /
                   딸기·포도 고르기(틀린 답 없음) → 물에 쓱쓱 씻기 → 콕콕 접시에 → 건네주기
   바삭 치킨: 닭 고르기 → 튀김가루 쓱쓱 굴리기 → 기름에 하나씩 퐁당(4조각을 다 넣어야 다음) → 집게로 쓱쓱(하양 → 노릇) → 집게로 콕 건져 바구니에(4조각) → 건네주기
   쇠규칙(MLCFG.rules): 글자·이모지 없음 · '다음' 버튼 없음(과정이 끝나면 이음 장면 뒤 저절로) · 만든 만큼 쓰기(구운 빵 2 = 접시 2, 씻은 과일 = 접시 과일, 튀김옷 4 = 기름 4 = 바구니 4) ·
   세 구역(위 과정 그림 줄, 가운데 무대, 아래 도구 칸) · 실패·타는 것 없음. 끌거나 문지르는 동작은 모두 콕콕으로도 됨(motion.tapAlso).
   숫자는 MLCFG.games.restaurant(menus, levels), motion(particles, cooking), rules, shell, touch, voice 에서 읽습니다.
   단계: ML.Progress.get("restaurant").level, 없으면 1단계 고정(ML.__rsLevel). 시험용: ML.__rs(), ML.__rsDepth(). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store,batchim}=M;
const {life,noise,sweepTone,SFX}=P;
const id='restaurant',GID='restaurant',L=life(id),OL=A.OL;
const S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`,S2=`stroke="${OL}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},GC=((CF.games||{})[GID])||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{},MO=CF.motion||{};
const PART=Object.assign({max:40,fadeMs:800},MO.particles||{});
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);
const TAP_LOCK=TOUCH.tapLockMs||1200;
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const PRAISE=VO.praise||[{ko:'잘했어!',en:'Good job!'}];
const LV=GC.levels&&GC.levels.length?GC.levels:[{level:1,new:'호텔 아침 식사, 재료 카드 2장'}];
const MENUS=GC.menus&&GC.menus.length?GC.menus:[{id:'toast',ko:'호텔 아침 식사',en:'breakfast',steps:[]}];
/* the menus this file can cook (burger and pasta are not built yet) */
const BUILT=['toast','chicken'];
/* numbers that are written inside the step sentences of games.restaurant.menus */
const stepOf=(m,i)=>((MENUS.find(x=>x.id===m)||{}).steps||[])[i]||'';
const N_CHICKEN=Math.max(2,Math.min(6,num(stepOf('chicken',1),0,4)));   // '조각 4개를 다 넣어야 다음'
const N_CRACK=Math.max(1,Math.min(4,num(stepOf('toast',1),0,2)));       // '톡 깨서(콕 2번)'
/* not in config: slices of bread in the toaster, presses of the lever until golden, fruit on the plate */
const N_BREAD=2,N_PRESS=3,N_FRUIT=3;
const LOG=[];
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(c1,c2,t)=>{t=Math.max(0,Math.min(1,t));const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),a=h(c1),b=h(c2);return '#'+a.map((v,i)=>Math.round(lerp(v,b[i],t)).toString(16).padStart(2,'0')).join('')};
const FACE=(cx,cy,s=1)=>`<g class="tf"><ellipse class="tf-eye" cx="${cx-8*s}" cy="${cy}" rx="${2.8*s}" ry="${4*s}" fill="${OL}"/><ellipse class="tf-eye" cx="${cx+8*s}" cy="${cy}" rx="${2.8*s}" ry="${4*s}" fill="${OL}"/><path class="tf-grin" d="M${cx-5*s} ${cy+7*s}Q${cx} ${cy+13*s} ${cx+5*s} ${cy+7*s}Z" fill="#B5473A" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/></g>`;

/* ============================== pictures (말랑 그림체) ============================== */
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  cust:`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="34" fill="#FFF9F2" ${S3}/><ellipse cx="34" cy="22" rx="9" ry="20" fill="#FFF9F2" ${S3}/><ellipse cx="66" cy="22" rx="9" ry="20" fill="#FFF9F2" ${S3}/><circle cx="40" cy="50" r="4" fill="${OL}"/><circle cx="60" cy="50" r="4" fill="${OL}"/><path d="M42 62Q50 70 58 62" fill="none" ${S2}/></svg>`
};
/* bread: t = 0 white … 1 toasted */
const BREAD_P='M16 42Q6 14 32 12Q50 2 68 12Q94 14 84 42V88Q84 95 77 95H23Q16 95 16 88Z',BREAD_I='M25 44Q18 22 36 21Q50 13 64 21Q82 22 75 44V84Q75 87 72 87H28Q25 87 25 84Z';
const crustC=t=>mix('#E3BC7C','#A8642B',t),crumbC=t=>mix('#FFF5DC','#E2A14F',t);
function breadIn(t){return `<path d="${BREAD_P}" fill="${crustC(t)}" ${S3}/><path d="${BREAD_I}" fill="${crumbC(t)}"/>${t>.5?`<path d="M34 50L46 62M54 46L66 58M36 70L48 82" stroke="${mix('#E2A14F','#B8732E',t)}" stroke-width="4" stroke-linecap="round" opacity="${((t-.5)*2).toFixed(2)}"/>`:''}<ellipse cx="38" cy="34" rx="8" ry="4" fill="#fff" opacity="${(.55-.35*t).toFixed(2)}" transform="rotate(-20 38 34)"/>`}
const breadSVG=t=>`<svg viewBox="0 0 100 100">${breadIn(t)}</svg>`;
const EGG_P='M50 6C74 6 88 50 88 72C88 98 70 114 50 114C30 114 12 98 12 72C12 50 26 6 50 6Z';
function eggWhole(cr){return `<svg viewBox="0 0 100 120"><path d="${EGG_P}" fill="#FFF4DE" ${S3}/><ellipse cx="36" cy="40" rx="8" ry="14" fill="#fff" opacity=".75" transform="rotate(18 36 40)"/><circle cx="62" cy="80" r="2.6" fill="#E9CFA0"/><circle cx="44" cy="92" r="2.2" fill="#E9CFA0"/>${cr?`<path d="M14 62L26 54L34 64L44 52L54 64L64 52L74 62L86 56" fill="none" stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`:''}</svg>`}
const shellHalf=side=>`<svg viewBox="0 0 100 120"><defs><clipPath id="rsh${side}"><path d="${side==='l'?'M0 0H50V54L44 52L34 64L26 54L14 62L0 70Z':'M50 0H100V70L86 56L74 62L64 52L54 64L50 58Z'}"/></clipPath></defs><g clip-path="url(#rsh${side})"><path d="${EGG_P}" fill="#FFF4DE" ${S3}/></g><path d="${side==='l'?'M14 62L26 54L34 64L44 52L50 58':'M50 58L54 64L64 52L74 62L86 56'}" fill="none" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/></svg>`;
/* the fried egg on its own (viewBox -80 -70 160 140): cells = cooked amount where the turner touched, edge = golden frill after the flip */
const EGG_CELLS=(()=>{const a=[];for(let r=0;r<5;r++)for(let c=0;c<5;c++){const x=-48+c*24,y=-44+r*22;if((x/56)**2+(y/50)**2<=1)a.push([x,y])}return a})();
let cid=0;
function eggFlat(cells,flip,raw){
  const c='rse'+(++cid),blob=A.blob?A.blob(0,0,56,.16,7,3):'M-56 0A56 50 0 1 0 56 0A56 50 0 1 0 -56 0';
  let s=`<defs><clipPath id="${c}"><path d="${blob}"/></clipPath></defs>`;
  s+=flip?`<path d="${blob}" fill="#E9B45A" transform="scale(1.04)"/>`:'';
  s+=`<path d="${blob}" fill="#FFFFFF" fill-opacity="${raw?.34:.42}" stroke="#FFFFFF" stroke-opacity=".85" stroke-width="3"/>`;
  s+=`<g clip-path="url(#${c})">${EGG_CELLS.map((p,i)=>{const v=cells?cells[i]:1;return v>.02?`<circle cx="${p[0]}" cy="${p[1]}" r="21" fill="#FFFEF8" opacity="${Math.min(1,v).toFixed(2)}"/>`:''}).join('')}</g>`;
  if(flip)s+=`<path d="${blob}" fill="none" stroke="#E7A84A" stroke-width="5" opacity=".75"/>`;
  s+=`<g class="yolk"><circle cx="-4" cy="-4" r="21" fill="#FFB52E" stroke="#E8921A" stroke-width="2.6"/><ellipse cx="-11" cy="-12" rx="7" ry="4.6" fill="#fff" opacity=".75"/></g>`;
  return s;
}
const eggFlatSVG=(cells,flip,raw)=>`<svg viewBox="-80 -70 160 140" style="overflow:visible">${eggFlat(cells,flip,raw)}</svg>`;
const dropSVG=`<svg viewBox="-40 -40 80 80"><path d="M-30 6Q-34 -16 -10 -22Q14 -30 28 -10Q36 8 18 18Q-6 28 -30 6Z" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="2.5"/><circle cx="-2" cy="-2" r="15" fill="#FFB52E" stroke="#E8921A" stroke-width="2.4"/><ellipse cx="-7" cy="-8" rx="5" ry="3.4" fill="#fff" opacity=".75"/></svg>`;
/* fruit (viewBox -50 -50 100 100) */
const FRUIT={
  strawberry:{ko:'딸기',en:'strawberry',draw:(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 40C-30 28 -36 0 -28 -12C-18 -26 18 -26 28 -12C36 0 30 28 0 40Z" fill="#E7565E" ${S3}/><path d="M-18 -18Q0 -36 18 -18Q8 -14 0 -22Q-8 -14 -18 -18Z" fill="#6DAE5A" ${S2}/><g fill="#FFE4A8">${[[-12,-2],[8,-4],[-2,12],[14,14],[-16,16],[2,-12]].map(([a,b])=>`<ellipse cx="${a}" cy="${b}" rx="2" ry="3"/>`).join('')}</g><ellipse cx="-14" cy="-8" rx="5" ry="8" fill="#fff" opacity=".35" transform="rotate(25 -14 -8)"/></g>`},
  grape:{ko:'포도',en:'grapes',draw:(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><path d="M2 -34Q6 -42 14 -44" stroke="#8A6A3C" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M6 -38Q22 -46 26 -32Q12 -30 6 -38Z" fill="#7DBA5E" ${S2}/>${[[-14,-20],[2,-22],[18,-18],[-20,-4],[-4,-4],[12,-2],[-12,12],[4,14],[-4,28]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="10.5" fill="#9B7BD0" ${S2}/><circle cx="${a-3}" cy="${b-4}" r="3" fill="#fff" opacity=".5"/>`).join('')}</g>`}
};
const fruitSVG=k=>`<svg viewBox="-50 -50 100 100">${FRUIT[k].draw(0,0,1)}</svg>`;
/* drumstick (viewBox -50 -50 100 100): coat 0..1 flour, fry 0..1 golden */
function drum(coat,fry){
  const meat=mix(mix('#F4C9BB','#F4ECDD',coat),'#D98C33',fry),edge=mix('#E3A897','#B86F22',fry);
  let s=`<path d="M14 14L32 32" stroke="${OL}" stroke-width="15" stroke-linecap="round"/><path d="M14 14L32 32" stroke="#FFF6E8" stroke-width="9" stroke-linecap="round"/><circle cx="37" cy="29" r="8" fill="#FFF6E8" ${S2}/><circle cx="29" cy="38" r="8" fill="#FFF6E8" ${S2}/>`;
  s+=`<path d="M-32 -6Q-38 -34 -10 -38Q18 -40 24 -12Q28 8 20 20Q8 28 -6 22Q-28 16 -32 -6Z" fill="${meat}" stroke="${edge}" stroke-width="2"/><path d="M-32 -6Q-38 -34 -10 -38Q18 -40 24 -12Q28 8 20 20Q8 28 -6 22Q-28 16 -32 -6Z" fill="none" ${S3}/>`;
  if(coat>.05&&fry<.98)s+=`<g fill="#FFFDF6" opacity="${(coat*(1-fry)).toFixed(2)}">${[[-20,-20],[-6,-28],[8,-22],[-14,-4],[2,-8],[14,2],[-22,4],[-4,10],[10,14]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="3.4"/>`).join('')}</g>`;
  if(fry>.05)s+=`<g fill="none" stroke="${mix('#E9B45A','#B5651D',fry)}" stroke-width="3" stroke-linecap="round" opacity="${fry.toFixed(2)}"><path d="M-24 -18q4 -4 8 0M-8 -28q4 -4 8 0M6 -16q4 -4 8 0M-18 0q4 -4 8 0M0 4q4 -4 8 0M-6 14q4 -4 8 0"/></g><ellipse cx="-14" cy="-24" rx="9" ry="5" fill="#FFE7A8" opacity="${(.7*fry).toFixed(2)}" transform="rotate(-25 -14 -24)"/>`;
  else s+=`<ellipse cx="-14" cy="-24" rx="9" ry="5" fill="#fff" opacity=".5" transform="rotate(-25 -14 -24)"/>`;
  return s;
}
const drumSVG=(c,f)=>`<svg viewBox="-50 -50 100 100" style="overflow:visible">${drum(c,f)}</svg>`;
/* toaster (viewBox 0 0 220 190) */
const SLOT_X=[78,142];
function toasterSVG(st){
  const t=st.heat||0,gl=st.glow||0;let s=`<ellipse cx="112" cy="178" rx="92" ry="10" fill="rgba(90,50,20,.16)"/>`;
  s+=`<rect x="30" y="160" width="26" height="16" rx="6" fill="#8E96A6" ${S2}/><rect x="164" y="160" width="26" height="16" rx="6" fill="#8E96A6" ${S2}/>`;
  s+=`<rect x="196" y="70" width="12" height="76" rx="6" fill="#8E96A6" ${S2}/>`;
  s+=`<rect x="16" y="44" width="186" height="124" rx="42" fill="#BCDCEB" ${S3}/><path d="M40 58Q110 46 178 58" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".65"/><path d="M28 120Q30 150 60 160" stroke="#9CC4D8" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s+=`<defs><clipPath id="rstc"><rect x="0" y="-60" width="220" height="108"/></clipPath></defs>`;
  SLOT_X.forEach((x,i)=>{s+=`<ellipse cx="${x}" cy="50" rx="30" ry="8" fill="#4A3A33" stroke="${OL}" stroke-width="3"/><ellipse class="rs-glow" cx="${x}" cy="50" rx="25" ry="5" fill="#FF9A3C" opacity="${(gl*.95).toFixed(2)}"/>`;
    if(i<(st.n||0))s+=`<g clip-path="url(#rstc)"><g transform="translate(${x-29} ${-2-(st.up||0)}) scale(.58 .62)">${breadIn(t)}</g></g>`});
  s+=`<circle cx="52" cy="136" r="12" fill="#F6E9D8" ${S2}/><path d="M52 136L58 128" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`;
  s+=FACE(118,112,1.1).replace(/class="tf"/,'class="rs-tface"');
  s+=`<ellipse cx="96" cy="124" rx="7" ry="4" fill="#FF9DB0" opacity=".55"/><ellipse cx="140" cy="124" rx="7" ry="4" fill="#FF9DB0" opacity=".55"/>`;
  s+=`<g class="rs-lever" style="transform:translateY(${st.lever||0}px)"><rect x="200" y="70" width="22" height="16" rx="7" fill="${PAL.rose||'#E8A0AE'}" ${S2}/></g>`;
  return `<svg viewBox="0 0 220 190" style="overflow:visible">${s}</svg>`;
}
/* frying pan (viewBox 0 0 300 210): body on the left, handle to the upper right */
const PAN_C=[108,108],PAN_K=1.15;
function panSVG(st){
  let s=`<ellipse cx="114" cy="196" rx="96" ry="12" fill="rgba(90,50,20,.16)"/>`;
  s+=`<path d="M196 92L282 56Q296 50 298 64Q300 74 288 80L204 120Z" fill="#9C6A45" ${S3}/><path d="M206 98L276 68" stroke="#C08A60" stroke-width="5" stroke-linecap="round"/><circle cx="286" cy="66" r="4" fill="${OL}"/><rect x="186" y="92" width="26" height="26" rx="8" fill="#8E96A6" ${S3} transform="rotate(-22 199 105)"/>`;
  s+=`<ellipse cx="108" cy="112" rx="100" ry="86" fill="#585E6C" ${S3}/><ellipse cx="108" cy="106" rx="86" ry="72" fill="#7A8091"/><path d="M40 84Q60 50 104 42" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".18"/><ellipse cx="108" cy="110" rx="62" ry="48" fill="#F2D27A" opacity=".10"/>`;
  if(st.egg)s+=`<g transform="translate(${PAN_C[0]} ${PAN_C[1]}) scale(${PAN_K})">${eggFlat(st.cells,st.flip,st.raw)}</g>`;
  return `<svg viewBox="0 0 300 210" style="overflow:visible">${s}</svg>`;
}
/* turner (viewBox 0 0 100 100), working point = middle of the blade */
const turnerSVG=`<svg viewBox="0 0 100 100"><path d="M60 46L92 8" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M60 46L92 8" stroke="#E6B07A" stroke-width="7" stroke-linecap="round"/><path d="M52 52L64 40" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M52 52L64 40" stroke="#C8CED8" stroke-width="3" stroke-linecap="round"/><path d="M10 62Q8 50 20 46L46 40Q58 40 60 52L64 74Q66 86 54 90L26 96Q12 98 10 86Z" fill="#E0E5EC" ${S3}/><path d="M24 58L28 82M36 56L40 80M48 54L52 78" stroke="#AEB6C2" stroke-width="3" stroke-linecap="round"/>${FACE(36,68,.75)}</svg>`;
/* water jug for washing (spout at the lower left) */
const jugSVG=`<svg viewBox="0 0 100 100"><path d="M30 30H80L74 90Q72 96 64 96H40Q32 96 30 90Z" fill="#CFE5F4" fill-opacity=".9" ${S3}/><path d="M33 52H77L73 88Q71 92 65 92H39Q34 92 33 88Z" fill="#8FC3E6"/><path d="M30 30L12 22Q6 24 10 30L30 42" fill="#CFE5F4" ${S3}/><path d="M80 40Q96 42 94 58Q92 72 76 72" fill="none" ${S3}/><path d="M38 40Q38 70 42 84" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/>${FACE(56,64,.8)}</svg>`;
/* tongs (viewBox 0 0 100 100), tips at the lower left */
const tongsSVG=`<svg viewBox="0 0 100 100"><path d="M84 14L18 78" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M84 14L18 78" stroke="#D8DEE6" stroke-width="5" stroke-linecap="round"/><path d="M84 14L30 90" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M84 14L30 90" stroke="#C8CED8" stroke-width="5" stroke-linecap="round"/><path d="M14 72L24 84M24 84L34 94" stroke="${PAL.rose||'#E8A0AE'}" stroke-width="7" stroke-linecap="round"/><circle cx="84" cy="14" r="11" fill="${PAL.rose||'#E8A0AE'}" ${S2}/>${FACE(84,13,.5)}</svg>`;
const handSVG=A.TOOL&&A.TOOL.hands?A.TOOL.hands:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="#FFE0C4" ${S3}/></svg>`;
/* plate (viewBox 0 0 220 140) with what has been put on it */
function plateSVG(p){
  let s=`<ellipse cx="112" cy="80" rx="104" ry="54" fill="rgba(90,50,20,.14)"/><ellipse cx="110" cy="74" rx="104" ry="56" fill="#FFFDF9" ${S3}/><ellipse cx="110" cy="74" rx="80" ry="40" fill="none" stroke="#EADFD0" stroke-width="3"/>`;
  for(let i=0;i<p.toast;i++)s+=`<g transform="translate(${30+i*30} ${22+i*6}) rotate(${-10+i*14} 30 30) scale(.62)">${breadIn(1)}</g>`;
  if(p.egg)s+=`<g transform="translate(150 62) scale(.5)">${eggFlat(null,true,false)}</g>`;
  (p.fruit||[]).forEach((k,i)=>{s+=FRUIT[k].draw(78+i*30,104-(i%2)*4,.38)});
  return `<svg viewBox="0 0 220 140" style="overflow:visible">${s}</svg>`;
}
/* board with the bread waiting */
function boardSVG(n){let s=`<rect x="6" y="20" width="148" height="98" rx="22" fill="#E7C99C" ${S3}/><rect x="16" y="30" width="128" height="78" rx="14" fill="none" stroke="#F1DDBA" stroke-width="5"/>`;
  for(let i=0;i<n;i++)s+=`<g transform="translate(${20+i*58} ${18}) scale(.62)">${breadIn(0)}</g>`;return `<svg viewBox="0 0 160 130">${s}</svg>`}
/* bowl of water with fruit to wash (viewBox 0 0 260 170) */
const BOWL_F=[[70,74],[130,66],[192,76]];
function bowlSVG(w){
  let s=`<ellipse cx="132" cy="160" rx="110" ry="10" fill="rgba(90,50,20,.14)"/><path d="M10 60Q14 156 130 158Q246 156 250 60Z" fill="#DCEEF8" fill-opacity=".85" ${S3}/><ellipse cx="130" cy="60" rx="120" ry="30" fill="#BFE0F2" ${S3}/>`;
  s+=`<ellipse class="rs-rip" cx="130" cy="62" rx="96" ry="20" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>`;
  BOWL_F.forEach((p,i)=>{if(w.gone[i])return;const d=1-((w.cells[i*2]||0)+(w.cells[i*2+1]||0))/2;
    s+=FRUIT[w.kind].draw(p[0],p[1],.62);
    if(d>.02)s+=`<g opacity="${d.toFixed(2)}" fill="#A88A62">${[[-10,-6],[8,4],[-4,12],[12,-10],[-14,8]].map(([a,b])=>`<circle cx="${p[0]+a}" cy="${p[1]+b}" r="3.4"/>`).join('')}<path d="M${p[0]-16} ${p[1]+2}q6 -6 12 0" stroke="#A88A62" stroke-width="3" fill="none"/></g>`;
    else s+=`<path d="M${p[0]+12} ${p[1]-18}l3 -7l3 7l7 3l-7 3l-3 7l-3 -7l-7 -3z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.4"/>`});
  s+=`<path d="M18 74Q130 108 242 74Q238 150 130 152Q22 150 18 74Z" fill="#8FC3E6" opacity=".32"/><path d="M34 96Q50 136 104 146" stroke="#fff" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 260 170" style="overflow:visible">${s}</svg>`;
}
/* flour dish (viewBox 0 0 300 170) */
const dishSVG=`<svg viewBox="0 0 300 170"><ellipse cx="152" cy="150" rx="140" ry="14" fill="rgba(90,50,20,.14)"/><path d="M8 70Q12 146 150 148Q288 146 292 70Z" fill="#C9D9E6" ${S3}/><ellipse cx="150" cy="70" rx="142" ry="50" fill="#DCE7F0" ${S3}/><ellipse cx="150" cy="74" rx="126" ry="40" fill="#FFFBF2"/><path d="M50 70Q70 54 92 68M170 60Q196 48 222 62M110 92Q140 80 164 94" stroke="#EFE6D4" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
const smallDishSVG=`<svg viewBox="0 0 200 130"><ellipse cx="102" cy="116" rx="92" ry="10" fill="rgba(90,50,20,.14)"/><ellipse cx="100" cy="66" rx="94" ry="46" fill="#FFFDF9" ${S3}/><ellipse cx="100" cy="66" rx="74" ry="32" fill="none" stroke="#EADFD0" stroke-width="3"/></svg>`;
/* oil pot (viewBox 0 0 260 210): pieces float in the oil */
const POT_S=[[62,72],[108,62],[154,70],[200,78],[96,90],[166,92]];
function potSVG(st){
  let s=`<ellipse cx="132" cy="198" rx="112" ry="11" fill="rgba(90,50,20,.16)"/><path d="M2 64Q-8 60 -6 74Q-4 84 14 84" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M258 64Q268 60 266 74Q264 84 246 84" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round"/>`;
  s+=`<path d="M14 66V150Q14 194 130 194Q246 194 246 150V66Z" fill="#E2977C" ${S3}/><path d="M30 120Q34 170 90 180" stroke="#F2B9A2" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s+=`<ellipse cx="130" cy="66" rx="116" ry="30" fill="#6B4A3C" ${S3}/><ellipse cx="130" cy="70" rx="104" ry="23" fill="#F0BE52"/><ellipse cx="104" cy="64" rx="40" ry="7" fill="#FFE29A" opacity=".7"/>`;
  [[60,74,4,0],[110,80,3,.5],[170,70,4,.9],[200,78,3,.3],[140,62,3,1.2]].forEach(([x,y,r,d])=>{s+=`<circle class="rs-bub" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#FFF1C4" stroke-width="2" style="animation-delay:${d}s"/>`});
  (st.pieces||[]).forEach((f,i)=>{const p=POT_S[i%POT_S.length];if(f==null)return;s+=`<g transform="translate(${p[0]} ${p[1]}) rotate(${[-20,15,-35,25,0,10][i%6]}) scale(.46)">${drum(1,f)}</g>`});
  if((st.pieces||[]).some(f=>f!=null))s+=`<path d="M26 72Q130 104 234 72Q234 92 130 96Q26 92 26 72Z" fill="#F0BE52" opacity=".55"/>`;
  return `<svg viewBox="0 0 260 210" style="overflow:visible">${s}</svg>`;
}
/* basket with paper (viewBox 0 0 220 150) */
const BASK_S=[[70,52,-20],[110,44,10],[150,54,30],[92,66,-5],[130,68,20],[110,58,0]];
function basketSVG(n){
  let s=`<ellipse cx="112" cy="140" rx="96" ry="9" fill="rgba(90,50,20,.16)"/><path d="M30 60L60 20L150 14L196 56Z" fill="#FFFDF9" ${S2}/><path d="M60 20L84 54M100 16L112 52M150 14L148 52" stroke="${PAL.rose||'#E8A0AE'}" stroke-width="7" opacity=".7"/>`;
  for(let i=0;i<n;i++){const p=BASK_S[i];s+=`<g transform="translate(${p[0]} ${p[1]}) rotate(${p[2]}) scale(.5)">${drum(1,1)}</g>`}
  s+=`<path d="M14 66H206L188 128Q184 136 174 136H46Q36 136 32 128Z" fill="#DDA867" ${S3}/><path d="M24 86H196M30 106H190" stroke="#B9814A" stroke-width="4"/>${[50,80,110,140,170].map(x=>`<path d="M${x} 68V134" stroke="#B9814A" stroke-width="3" opacity=".6"/>`).join('')}<rect x="8" y="58" width="204" height="16" rx="8" fill="#E9BC7E" ${S3}/>`;
  return `<svg viewBox="0 0 220 150" style="overflow:visible">${s}</svg>`;
}
/* order pictures in the speech bubbles */
const breakfastMini=`<svg viewBox="0 0 220 140">${svgInner(plateSVG({toast:2,egg:true,fruit:['strawberry','strawberry']}))}</svg>`;
const chickenMini=`<svg viewBox="0 0 220 150">${svgInner(basketSVG(3))}</svg>`;
const ORDER_PIC={toast:breakfastMini,chicken:chickenMini};
/* pick cards: the right one and the others (other foods: they say what they are) */
const OTHER=['tomato','mushroom','pepper'];
const wholeOf=k=>A.wholeSVG?A.wholeSVG(k,0):'';
const PICK={
  bread:{ok:['bread'],svg:()=>breadSVG(0),ko:'빵',en:'bread'},
  egg:{ok:['egg'],svg:()=>eggWhole(false),ko:'달걀',en:'egg'},
  fruit:{ok:['strawberry','grape'],free:true},
  chicken:{ok:['chicken'],svg:()=>drumSVG(0,0),ko:'닭고기',en:'chicken'}
};
const cardPic=k=>k==='bread'?breadSVG(0):k==='egg'?eggWhole(false):k==='chicken'?drumSVG(0,0):FRUIT[k]?fruitSVG(k):wholeOf(k);
const cardName=k=>k==='bread'?['빵','bread']:k==='egg'?['달걀','egg']:k==='chicken'?['닭고기','chicken']:FRUIT[k]?[FRUIT[k].ko,FRUIT[k].en]:[(A.TOPPING&&A.TOPPING[k]||{}).ko||k,(A.TOPPING&&A.TOPPING[k]||{}).en||k];
const STEP_ICON={'pick:bread':()=>breadSVG(0),toastIn:()=>toasterSVG({n:1,heat:0}),toastPop:()=>breadSVG(1),'pick:egg':()=>eggWhole(false),crack:()=>eggWhole(true),fry:()=>turnerSVG,flip:()=>eggFlatSVG(null,true,false),
  'pick:fruit':()=>fruitSVG('strawberry'),wash:()=>jugSVG,plateFruit:()=>plateSVG({toast:0,egg:false,fruit:['strawberry','grape','strawberry']}),
  'pick:chicken':()=>drumSVG(0,0),coat:()=>drumSVG(1,0),drop:()=>potSVG({pieces:[0]}),fry2:()=>tongsSVG,lift:()=>basketSVG(2)};
const stepIcon=k=>(STEP_ICON[k]||(()=>ICON.cust))();

/* ---- shop front, kitchen wall ---- */
const LOBBY_BG=`<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax slice" style="width:100%;height:100%;display:block"><rect width="100" height="130" fill="#F4EADF"/><rect y="88" width="100" height="42" fill="#E3CDB4"/><path d="M0 88H100" stroke="${OL}" stroke-width=".8"/>
 ${Array.from({length:6},(_,i)=>`<rect x="${i*17+2}" y="96" width="14" height="6" rx="2" fill="#D9BE9E"/>`).join('')}
 <rect x="10" y="20" width="36" height="30" rx="3" fill="#DCEBF0" stroke="${OL}" stroke-width="1"/><path d="M28 20V50M10 35H46" stroke="#C9B49A" stroke-width="1.2"/>
 <rect x="54" y="16" width="38" height="40" rx="4" fill="#6E8A74" stroke="${OL}" stroke-width="1"/><rect x="56" y="18" width="34" height="36" rx="3" fill="#7C9A82"/>
 <g transform="translate(57 20) scale(.13)">${svgInner(breakfastMini)}</g><g transform="translate(60 36) scale(.12)">${svgInner(chickenMini)}</g>
 <path d="M4 4H96V12Q92 16 88 12Q84 16 80 12Q76 16 72 12Q68 16 64 12Q60 16 56 12Q52 16 48 12Q44 16 40 12Q36 16 32 12Q28 16 24 12Q20 16 16 12Q12 16 8 12Q4 16 4 12Z" fill="#A9CFA0" stroke="${OL}" stroke-width="1"/>
 ${[0,1,2,3,4,5].map(i=>`<path d="M${4+i*16} 4H${12+i*16}V13Q${8+i*16} 16 ${4+i*16} 13Z" fill="#FFFDF9" opacity=".7"/>`).join('')}</svg>`;
const WALL=`<svg viewBox="0 0 100 30" preserveAspectRatio="none"><rect width="100" height="30" fill="#F2EBE2"/>${Array.from({length:12},(_,i)=>`<path d="M${i*9} 0V30" stroke="#E8DED2" stroke-width=".8"/>`).join('')}${Array.from({length:4},(_,i)=>`<path d="M0 ${i*7.5}H100" stroke="#E8DED2" stroke-width=".8"/>`).join('')}<rect y="22" width="100" height="8" fill="#E6D7C4"/><rect x="4" y="12" width="44" height="3" rx="1.4" fill="#D9BE9E" stroke="#C9A468" stroke-width=".5"/></svg>`;

/* ============================== screen: the three zones ============================== */
const css=`
#${id}{gap:6px}
#${id} .rs-head{flex:none;height:${HEAD_PX}px;gap:8px}
#${id} .rs-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#${id} .rs-back svg{width:100%;height:100%;display:block}
.rs-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.rs-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.rs-strip span svg{width:72%;height:72%;display:block}
.rs-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.rs-strip span.done{opacity:.9}
.rs-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.rs-strip span .st svg{width:100%;height:100%}
.rs-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F2EBE2}
.rs-stage>div{position:absolute}
.rs-lobby{inset:0;z-index:1;overflow:hidden}
.rs-lobby>div{position:absolute;pointer-events:none}
.rs-lbg{inset:0}
.rs-lc{position:absolute;border:0;padding:0;background:none;pointer-events:auto;touch-action:none;transition:transform 1s ease-in,opacity .6s}
.rs-lc .lc-ani{position:absolute;left:3%;right:3%;bottom:0;aspect-ratio:200/230}
.rs-lc .lc-ani svg{width:100%;height:100%;display:block;overflow:visible}
.rs-lc .lc-bub{position:absolute;right:-8%;top:-16%;width:58%;aspect-ratio:1;border-radius:50%;background:var(--paper);border:3px solid ${OL};display:grid;place-items:center;padding:7%;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.rs-lc .lc-bub svg{width:100%;height:100%;display:block;overflow:visible}
.rs-lc.sel{transform:translateY(-12px) scale(1.06)}
.rs-lc.gone{opacity:0;pointer-events:none}
.rs-wall{left:0;right:0;top:0;pointer-events:none}
.rs-wall svg{width:100%;height:100%;display:block}
.rs-counter{left:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(180deg,#E9D6BC,#E2C9A8);border-top:4px solid ${OL}}
.rs-cust{z-index:3;pointer-events:none}
.rs-cust svg{width:100%;height:100%;display:block;overflow:visible}
.rs-cust.enter{animation:rsin 1.1s cubic-bezier(.3,1.1,.5,1)}
.rs-cust.leave{animation:rsout 1.1s ease-in forwards}
@keyframes rsin{from{transform:translateX(120%)}to{transform:none}}
@keyframes rsout{to{transform:translateX(130%)}}
.rs-cust.alive.rs-rub .al-arm-r{animation:rsrub 1.6s ease-in-out infinite}
@keyframes rsrub{0%,100%{transform:rotate(38deg)}50%{transform:rotate(54deg)}}
.rs-cfx{z-index:4;pointer-events:none}
.rs-cfx svg{width:100%;height:100%;display:block;overflow:visible}
.rs-cfx .ck{transform-box:fill-box;transform-origin:50% 50%;opacity:0}
.rs-cfx.puff .ck{animation:rspuff .6s ease-in-out 3}
@keyframes rspuff{0%,100%{opacity:.0;transform:scale(.6)}40%,60%{opacity:.95;transform:scale(1.15)}}
.rs-cfx .sn{opacity:0}
.rs-cfx.sniff .sn{animation:rssniff 1.4s ease-out}
@keyframes rssniff{0%{opacity:0;transform:translateY(16px)}30%{opacity:.9}100%{opacity:0;transform:translateY(-10px)}}
.rs-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:50%;padding:7px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.rs-bub svg{width:100%;height:100%;display:block;overflow:visible}
.rs-work{z-index:5;left:0;right:0;bottom:0;pointer-events:none}
.rs-it{position:absolute;pointer-events:none;transition:left .5s ease-in-out,top .5s ease-in-out,width .5s ease-in-out,height .5s ease-in-out,opacity .35s}
.rs-it>svg{width:100%;height:100%;display:block;overflow:visible}
.rs-it.hide{opacity:0;visibility:hidden}
.rs-it.notr{transition:none}
.rs-it .yolk{transform-box:fill-box;transform-origin:50% 60%}
.rs-it.wob .yolk{animation:rswob .9s ease-out}
@keyframes rswob{0%{transform:scale(1.25,.7)}25%{transform:scale(.85,1.15)}45%{transform:scale(1.1,.92)}65%{transform:scale(.96,1.04)}100%{transform:none}}
.rs-it .rs-lever{transition:transform .18s cubic-bezier(.3,1.6,.5,1)}
.rs-it .rs-glow{transition:opacity .4s}
.rs-it .rs-bub{animation:rsbub 1.6s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}
.rs-it.hot .rs-bub{animation-duration:.5s}
@keyframes rsbub{0%{transform:scale(.3);opacity:0}40%{opacity:1}100%{transform:scale(1.4) translateY(-4px);opacity:0}}
.rs-it .rs-rip{transform-box:fill-box;transform-origin:50% 50%;animation:rsrip 2.4s ease-in-out infinite}
@keyframes rsrip{0%,100%{transform:scale(.92);opacity:.25}50%{transform:scale(1.04);opacity:.7}}
.rs-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.rs-float{position:absolute;pointer-events:none;will-change:transform}
.rs-float>svg{width:100%;height:100%;display:block;overflow:visible}
.rs-pt{position:absolute;pointer-events:none;will-change:transform,opacity}
.rs-pt svg{width:100%;height:100%;display:block;overflow:visible}
.rs-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.rs-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.rs-tool svg{width:100%;height:100%;display:block;overflow:visible}
.rs-tool.in{animation:rscard .3s ease-out both}
.rs-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:14px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.rs-card svg{width:100%;height:100%;display:block;pointer-events:none;overflow:visible}
.rs-card.in{animation:rscard .3s ease-out both}
.rs-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.rs-card.fade{opacity:.35}
.rs-card.nope{animation:rsnope .5s}
@keyframes rscard{from{transform:translateY(24px);opacity:0}}
@keyframes rsnope{0%,100%{transform:none}20%{transform:translateX(-10px) rotate(-6deg)}50%{transform:translateX(9px) rotate(5deg)}80%{transform:translateX(-4px)}}
.rs-callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar rs-head"><button class="round rs-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="rs-strip" id="rsStrip"></div></div><div class="rs-stage" id="rsStage">
<div class="rs-lobby" id="rsLobby" hidden><div class="rs-lbg">${LOBBY_BG}</div></div><div class="rs-wall" id="rsWall">${WALL}</div><div class="rs-counter" id="rsCounter"></div>
<div class="rs-cust" id="rsCust"></div><div class="rs-cfx" id="rsCfx"></div><div class="rs-bub" id="rsBub" hidden></div><div class="rs-work" id="rsWork"></div><div class="rs-fx" id="rsFx"></div></div><div class="rs-tray" id="rsTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='식당';
const $=s=>sec.querySelector(s);
const stage=$('#rsStage'),stripEl=$('#rsStrip'),tray=$('#rsTray'),lobbyEl=$('#rsLobby'),wallEl=$('#rsWall'),counterEl=$('#rsCounter'),custEl=$('#rsCust'),cfxEl=$('#rsCfx'),bubEl=$('#rsBub'),work=$('#rsWork'),fxEl=$('#rsFx');
/* the customer's face effects: puffed cheeks, sniff lines, a smudge on the nose (in the animal's 200 x 230 picture units) */
cfxEl.innerHTML=`<svg viewBox="0 0 200 230"><circle class="ck" cx="62" cy="130" r="17" fill="#FF9DB0"/><circle class="ck" cx="138" cy="130" r="17" fill="#FF9DB0"/>
<g class="sn" fill="none" stroke="#C9A468" stroke-width="4" stroke-linecap="round"><path d="M70 150q-8 -10 0 -20t0 -20"/><path d="M130 150q8 -10 0 -20t0 -20"/></g><ellipse class="nose" cx="100" cy="112" rx="0" ry="0" fill="#FFFDF6" stroke="${OL}" stroke-width="1.5"/></svg>`;
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0,last:''},store.get('mallang_restaurant',{}));
const save=()=>store.set('mallang_restaurant',DATA);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
if(PRG())PRG().register(GID,{max:LV.length,name:'식당',seg:'setRsLv',seed:DATA.level});
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LV.length,n))}
/* what a level brings (games.restaurant.levels[].new: menu names, '재료 카드 N장', '두 가지를 주문') */
function levelInfo(n){
  const f={level:n,menus:[],cards:2,twoOrders:false};
  LV.slice(0,n).forEach(l=>{const t=l.new||'';MENUS.forEach(m=>{if(t.includes(m.ko)&&!f.menus.includes(m.id))f.menus.push(m.id)});const c=t.match(/카드\s*(\d)\s*장/);if(c)f.cards=Math.max(2,Math.min(3,+c[1]));if(/두 가지/.test(t))f.twoOrders=true});
  f.menus=f.menus.filter(m=>BUILT.includes(m));if(!f.menus.length)f.menus=['toast'];
  return f;
}
function planFor(menu){
  if(menu==='chicken')return['pick:chicken','coat','drop','fry2','lift','serve'];
  return['pick:bread','toastIn','toastPop','pick:egg','crack','fry','flip','pick:fruit','wash','plateFruit','serve'];
}

/* ---------- state ---------- */
let lv=null,plan=[],pi=0,S=null,al=null,H={},act=null,tool=null,gen=0,misses=0,lastMiss=0,busy=false,lastTap=0,phase='',kind='wait',AIM=null,lobbyAl=[],turns=null,ptPeak=0,ptNow=0;
let E={},G0={W:0,H:0,wallH:0,Hc:0},HOT=()=>[];
const killTool=()=>{if(tool){tool.destroy();tool=null}};
const stR=()=>stage.getBoundingClientRect();
const stXY=(cx,cy)=>{const s=stR();return[cx-s.left,cy-s.top]};
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;
const rectOf=n=>E[n]?E[n].getBoundingClientRect():null;
const hit=(e,n,m=6)=>{const r=rectOf(n);return!!r&&!E[n].classList.contains('hide')&&inRect(e,r,m)};
/* a point inside an item's picture, given in its viewBox units → client coordinates */
const VB={toaster:[220,190],pan:[300,210],plate:[220,140],board:[160,130],bowl:[260,170],dish:[300,170],sdish:[200,130],pot:[260,210],basket:[220,150]};
const at=(n,x,y)=>{const r=rectOf(n),v=VB[n];return[r.left+x/v[0]*r.width,r.top+y/v[1]*r.height]};
let raf=0;const rd=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})};

function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  layout();
}
function miss(){misses++;G.nudge();const t=HOT()[0]||custEl;if(t){t.classList.remove('rs-callme');void t.offsetWidth;t.classList.add('rs-callme');setTimeout(()=>t.classList.remove('rs-callme'),700)}
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
function toolTray(html){tray.innerHTML=`<div class="rs-tool in">${html}</div>`;return tray.querySelector('.rs-tool')}
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
const toolPx=()=>{const t=TOUCH.tool||{},w=stR().width;return Math.min(t.maxPx||300,Math.max(t.minPx||180,w*(t.stageWidthRatio||.45)))};
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});

/* ---------- motion helpers (motion.threeBeats, squash, particles) ---------- */
const anim=(el,frames,o)=>{try{return el.animate(frames,Object.assign({fill:'none'},o))}catch(e){return null}};
/* three beats: crouch (0.15 s) → the move → a bouncy settle (0.4 s) */
function beat(el,move,ms=300){return anim(el,[{transform:'none'},{transform:'translateY(4%) scale(1.04,.94)',offset:150/(ms+550)},{transform:move,offset:(150+ms)/(ms+550)},{transform:'translateY(-2%) scale(.98,1.03)',offset:(150+ms+180)/(ms+550)},{transform:'none'}],{duration:ms+550,easing:'ease-in-out'})}
/* landing: flat for a moment, then back with two small bounces */
const squash=el=>anim(el,[{transform:'scale(1.22,.74)'},{transform:'scale(.9,1.1)',offset:.35},{transform:'scale(1.05,.96)',offset:.65},{transform:'none'}],{duration:450,easing:'ease-out'});
const shake=(el,deg=4)=>anim(el,[{transform:'none'},{transform:`rotate(${-deg}deg)`},{transform:`rotate(${deg}deg)`},{transform:`rotate(${-deg/2}deg)`},{transform:'none'}],{duration:420,easing:'ease-in-out'});
const PT={
  steam:()=>`<svg viewBox="0 0 30 60"><path d="M15 56Q5 46 15 36Q25 26 15 16Q8 9 14 2" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".9"/></svg>`,
  drop:c=>`<svg viewBox="-10 -14 20 26"><path d="M0 -12Q8 0 8 4A8 8 0 0 1 -8 4Q-8 0 0 -12Z" fill="${c||'#9FD0EE'}" stroke="#6FAFD6" stroke-width="1.5"/></svg>`,
  oil:()=>`<svg viewBox="-10 -10 20 20"><circle r="7" fill="#F6CF67" stroke="#D9A53A" stroke-width="1.5"/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity=".7"/></svg>`,
  crumb:()=>`<svg viewBox="-10 -10 20 20"><path d="M-6 -4L4 -7L7 3L-2 7Z" fill="#D49A52" stroke="#A8642B" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  flour:()=>`<svg viewBox="-20 -20 40 40"><circle r="16" fill="#FFFDF6" opacity=".9"/><circle cx="-8" cy="4" r="9" fill="#fff"/></svg>`,
  bubble:()=>`<svg viewBox="-12 -12 24 24"><circle r="9" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="2.2"/><circle cx="-3" cy="-3" r="2.4" fill="#fff"/></svg>`,
  spark:()=>`<svg viewBox="-20 -20 40 40"><path d="M0 -18Q2 -2 18 0Q2 2 0 18Q-2 2 -18 0Q-2 -2 0 -18Z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  shell:()=>`<svg viewBox="-10 -10 20 20"><path d="M-7 -3L2 -7L7 2L-1 6Z" fill="#FFF4DE" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  heat:()=>`<svg viewBox="0 0 20 60"><path d="M10 58Q2 48 10 38Q18 28 10 18Q4 10 10 2" fill="none" stroke="#FFB27A" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`
};
/* one particle (stage px). o: sz, dx, dy (end offset), up (arc height), bounce, ms, rot, c. Never more than motion.particles.max at once */
function pt(kind,x,y,o={}){
  if(ptNow>=PART.max)return;ptNow++;ptPeak=Math.max(ptPeak,ptNow);
  const d=document.createElement('div');d.className='rs-pt';const sz=o.sz||14;d.innerHTML=PT[kind](o.c);
  Object.assign(d.style,{left:(x-sz/2)+'px',top:(y-sz/2)+'px',width:sz+'px',height:sz+'px'});fxEl.appendChild(d);
  const dx=o.dx||0,dy=o.dy||0,up=o.up||0,r=o.rot||0,ms=o.ms||PART.fadeMs;let fr;
  if(kind==='steam'||kind==='heat'||kind==='flour')fr=[{transform:'translateY(0) scale(.5)',opacity:0},{transform:`translate(${dx*.4}px,${dy*.4}px) scale(1)`,opacity:.95,offset:.3},{transform:`translate(${dx}px,${dy}px) scale(1.5)`,opacity:0}];
  else if(o.bounce)fr=[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-up}px) rotate(${r/2}deg)`,offset:.35},{transform:`translate(${dx}px,${dy}px) rotate(${r}deg)`,offset:.65},{transform:`translate(${dx*1.12}px,${dy-up*.25}px) rotate(${r}deg)`,offset:.8},{transform:`translate(${dx*1.2}px,${dy}px) rotate(${r}deg)`,opacity:1,offset:.92},{transform:`translate(${dx*1.2}px,${dy}px) rotate(${r}deg)`,opacity:0}];
  else fr=[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-up}px) scale(1)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.6)`,opacity:0}];
  anim(d,fr,{duration:ms,easing:o.ease||'ease-out',fill:'forwards'});
  setTimeout(()=>{d.remove();ptNow--},ms+30);
}
const ptAt=(kind,cx,cy,n,o)=>{const [x,y]=stXY(cx,cy);for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,s=(o&&o.spread)||40;pt(kind,x+(Math.random()-.5)*((o&&o.jx)||10),y,Object.assign({dx:Math.cos(a)*s,dy:(o&&o.dy!=null?o.dy:Math.sin(a)*s*.6),up:(o&&o.up)||0,rot:rand(360)},o||{}))}};
const steamAt=(cx,cy,n=3,w=60)=>{const [x,y]=stXY(cx,cy);for(let k=0;k<n;k++)setTimeout(()=>pt('steam',x+(k-(n-1)/2)*w/n+rand(10)-5,y,{sz:22,dx:rand(16)-8,dy:-60-rand(30),ms:1300}),k*110)};
/* a picture flying along an arc: from → to (client px), size s0 → s1, optional spin, then a squash on landing */
function fly(html,from,to,s0,s1,ms,then,o={}){
  const f=document.createElement('div');f.className='rs-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px',zIndex:o.z||''});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0,up=o.up==null?60:o.up,sp=o.spin||0;let done=false;
  const fin=()=>{if(done)return;done=true;if(o.keep){const [tx,ty]=stXY(to[0],to[1]);f.getAnimations().forEach(x=>x.cancel());Object.assign(f.style,{left:(tx-s1/2)+'px',top:(ty-s1/2)+'px',width:s1+'px',height:s1+'px',transform:sp?`rotate(${sp}deg)`:''});if(then)then(f);return}f.remove();if(then)then()};
  const a=anim(f,[{transform:'translate(0,0) scale(1) rotate(0)'},{transform:`translate(${dx/2}px,${Math.min(dy/2,0)-up}px) scale(${(1+k)/2}) rotate(${sp/2}deg)`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k}) rotate(${sp}deg)`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});
  if(a)a.onfinish=fin;
  setTimeout(fin,ms+400);
  return f;
}
const PCOL={drop:'#9FD0EE'};

/* ---------- layout ---------- */
function mkIt(name,html,cls){const d=document.createElement('div');d.className='rs-it hide '+(cls||'');d.dataset.n=name;d.innerHTML=html;work.appendChild(d);E[name]=d;return d}
function setIt(n,q){const el=E[n];if(!el)return;if(!q){el.classList.add('hide');return}Object.assign(el.style,{left:(q[0]-q[2]/2)+'px',top:(q[1]-q[3]/2)+'px',width:q[2]+'px',height:q[3]+'px'});el.classList.remove('hide')}
const showView=v=>{if(S)S.view=v;lobbyEl.hidden=v!=='lobby';[wallEl,counterEl,custEl,cfxEl,work].forEach(e=>{e.style.visibility=v==='lobby'?'hidden':''});if(v==='lobby')bubEl.hidden=true};
function LAY(){
  const {W,Hc}=G0,r={},ph=phase,m=S.menu;
  const pw=Math.min(W*.4,170),plate=[W-pw/2-6,Hc-pw*.32-6,pw,pw*.64];
  if(m==='toast'){
    if(ph==='serve'){const w=Math.min(W*.86,Hc*1.2,340);r.plate=[W/2,Hc*.55,w,w*.64];return r}
    r.plate=plate;
    if(ph==='pick:bread'||ph==='toastIn'||ph==='toastPop'||ph==='enter'){const tw=Math.min(W*.58,Hc*.7,300),th=tw*190/220;r.toaster=[tw/2+10,Math.min(Hc-th/2-8,Hc*.58),tw,th];
      if(ph!=='toastPop'&&S.board>0){const bw=Math.min(W*.36,150);r.board=[W-bw/2-6,Math.max(bw*.42,Hc*.3),bw,bw*130/160]}}
    else if(ph==='pick:egg'||ph==='crack'||ph==='fry'||ph==='flip'){const w=Math.min(W*.82,(Hc-20)*300/210,400),h=w*210/300;r.pan=[w/2+4,Math.max(h/2+Math.min(90,Hc*.2),Hc-pw*.64-h/2+20),w,h];
      if(ph==='pick:egg'||ph==='crack'){const ew=Math.max(84,Math.min(118,w*.32)),[px,py]=[r.pan[0]-w/2+PAN_C[0]/300*w,r.pan[1]-h/2+PAN_C[1]/210*h];r.egg=[px,Math.max(ew*.6,py-h*.42-ew*.3),ew,ew*1.2]}}
    else if(ph==='pick:fruit'||ph==='wash'||ph==='plateFruit'){const w=Math.min(W*.74,Hc*1.2,340),h=w*170/260;r.bowl=[w/2+8,Math.min(Hc*.42+h*.1,Hc-pw*.64-h/2+30),w,h]}
  }else{
    if(ph==='serve'){const w=Math.min(W*.8,Hc*1.1,320);r.basket=[W/2,Hc*.55,w,w*150/220];return r}
    if(ph==='pick:chicken'||ph==='coat'||ph==='enter'){const w=Math.min(W*.94,Hc*1.5,420),h=w*170/300;r.dish=[W/2,Hc*.56,w,h];const cs=Math.max(84,Math.min(w*.3,140));
      [[.27,.4],[.5,.32],[.73,.42],[.5,.6]].forEach((p,i)=>{if(S.cp[i]==='dish')r['c'+i]=[W/2-w/2+p[0]*w,Hc*.56-h/2+p[1]*h,cs,cs]})}
    else if(ph==='drop'||ph==='lift'){const w=Math.min(W*.6,Hc*.82,300),h=w*210/260;r.pot=[w/2+6,Hc*.56,w,h];
      if(ph==='drop'){const dw=Math.min(W*.4,170),dh=dw*130/200;r.sdish=[W-dw/2-4,Hc*.3,dw,dh];const cs=Math.max(70,dw*.46);[[.3,.36],[.7,.36],[.3,.66],[.7,.66]].forEach((p,i)=>{if(S.cp[i]==='dish')r['c'+i]=[W-dw-4+p[0]*dw,Hc*.3-dh/2+p[1]*dh,cs,cs]})}
      else{const bw=Math.min(W*.42,180);r.basket=[W-bw/2-4,Hc-bw*150/220/2-6,bw,bw*150/220]}}
    else if(ph==='fry2'){const w=Math.min(W*.86,Hc*1.05,380),h=w*210/260;r.pot=[W/2,Hc*.55,w,h]}
  }
  return r;
}
function lay(){if(!S||!G0.W||S.view!=='work')return;const R=LAY();Object.keys(E).forEach(n=>setIt(n,R[n]))}
function layoutLobby(){
  if(!S||S.view!=='lobby')return;const r=lobbyEl.getBoundingClientRect(),W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.3,150))),gap=(W-3*bw)/4,bh=Math.round(bw*1.32);
  lobbyEl.querySelectorAll('.rs-lc').forEach((b,i)=>Object.assign(b.style,{left:(gap+i*(bw+gap))+'px',bottom:Math.round(Hh*.05)+'px',width:bw+'px',height:bh+'px'}));
}
function layout(){
  const r=stR(),W=r.width,Hh=r.height;if(!W||!Hh)return;
  const wallH=Math.round(Math.max(96,Math.min(Hh*.27,Hh-400))),Hc=Hh-wallH;G0={W,H:Hh,wallH,Hc};
  Object.assign(wallEl.style,{height:wallH+'px'});Object.assign(counterEl.style,{top:wallH+'px'});Object.assign(work.style,{top:wallH+'px'});
  const ch=wallH*1.12,cw=ch*200/230,box={width:cw+'px',height:ch+'px',right:(W*.02)+'px',top:Math.max(0,wallH-ch*.9)+'px'};Object.assign(custEl.style,box);Object.assign(cfxEl.style,box);
  const bs=Math.min(72,wallH*.66);Object.assign(bubEl.style,{width:bs+'px',height:bs+'px',right:(W*.02+cw+6)+'px',top:(wallH*.1)+'px'});
  layoutLobby();lay();
}

/* ---------- drawing the stations ---------- */
function draw(){
  if(!S||S.view!=='work')return;
  if(E.toaster)E.toaster.innerHTML=toasterSVG(S.toast);
  if(E.board)E.board.innerHTML=boardSVG(S.board);
  if(E.plate)E.plate.innerHTML=plateSVG(S.plate);
  if(E.pan)E.pan.innerHTML=panSVG(S.pan);
  if(E.bowl&&S.wash)E.bowl.innerHTML=bowlSVG(S.wash);
  if(E.pot)E.pot.innerHTML=potSVG({pieces:S.pot});
  if(E.basket)E.basket.innerHTML=basketSVG(S.basketN);
  for(let i=0;i<N_CHICKEN;i++)if(E['c'+i])E['c'+i].innerHTML=drumSVG(S.coat[i],0);
}
function drawCust(m){if(!S||!S.kind)return;custEl.innerHTML=A.animal(S.kind,m||'idle',{});if(al&&al.refresh)al.refresh()}
const rubBelly=on=>custEl.classList.toggle('rs-rub',!!on);
/* the customer smells the cooking: two scent lines rise to the nose, the nose twitches (motion.cooking.serve: 냄새를 킁킁) */
let lastSniff=0;
function sniff(talk){const n=performance.now();if(n-lastSniff<2500)return;lastSniff=n;cfxEl.classList.remove('sniff');void cfxEl.offsetWidth;cfxEl.classList.add('sniff');LOG.push('sniff');
  if(talk&&S)say(pick([['킁킁, 맛있는 냄새!','Sniff sniff, smells yummy!'],['음~ 고소해!','Mmm, smells good!']])[0],'');alMood('wow',900)}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5);
  stripEl.innerHTML=(S&&S.view==='lobby'?`<span class="on">${ICON.cust}</span>`:'')+win.map(o=>`<span class="${S&&S.view==='lobby'?'':o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${S&&S.view!=='lobby'&&o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function finish(between){
  H={};kind='wait';AIM=null;HOT=()=>[];const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');rubBelly(true);
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const k=plan[pi];if(!k)return;phase=k;strip();size();draw();G.place();
  (STEP[k]||STEP[k.split(':')[0]])(k.split(':')[1]);
}
/* one tool step through ML.P2.makeTool: the tool follows the finger and leans (motion.toolFeel), only touched cells change; taps work too (motion.tapAlso) */
function rubTool(o){
  killTool();
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,rub:Object.assign({tapChunk:.12},o.rub||{}),tilt:true,tapAnim:420,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[4,4],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,onFrame:o.frame,onTap:o.tap,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log);if(o.touch)o.touch()},onRelease:()=>{G.release();if(o.release)o.release()},
    onCell:(i,v,pv)=>{o.cell(i,v,pv);rd()},
    onProgress:(p,ratio,why)=>{if(o.progress)o.progress(p,ratio);if(why==='move'||why==='hold'||why==='tap'){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}
/* up to three picture cards; o.free: every card is right (child's choice). Otherwise a wrong card says what it is and the child tries again */
function cardsTray(keys,okKeys,onPick,ko,en){
  kind='cards';let lock=0;const ph=phase;
  tray.innerHTML=keys.map((k,i)=>`<button class="rs-card in" data-k="${k}" aria-label="${cardName(k)[0]}" style="animation-delay:${i*60}ms">${cardPic(k)}</button>`).join('');
  if(ko)say(ko,en,true);HOT=()=>[...tray.querySelectorAll('.rs-card')].filter(b=>okKeys.includes(b.dataset.k));
  AIM=()=>{const b=HOT()[0];return b?ctr(b):[0,0]};
  G.start({type:'tap',wait:true,at:()=>stXY(...AIM())});
  tray.onpointerdown=e=>{const b=e.target.closest('.rs-card');if(!b||phase!==ph||b.classList.contains('sel'))return;e.preventDefault();actx();G.touch();const k=b.dataset.k;
    if(!okKeys.includes(k)){const n=performance.now();if(n-lock<600)return;lock=n;b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope');sfx.soft();misses++;LOG.push('wrong:'+k);
      const want=cardName(okKeys[0])[0];say(`이건 ${cardName(k)[0]}${batchim(cardName(k)[0])?'이야':'야'}! ${want}${batchim(want)?'을':'를'} 찾아 봐!`,`That's ${cardName(k)[1]}! Find the ${cardName(okKeys[0])[1]}!`);G.nudge();return}
    const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;
    b.classList.add('sel');tray.querySelectorAll('.rs-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();tray.onpointerdown=null;G.stop();kind='wait';AIM=null;HOT=()=>[];LOG.push('pick:'+k);
    say(cardName(k)[0]+'!',cap(cardName(k)[1])+'!');onPick(k,b)};
}
const cardKeys=(okKeys,free)=>{if(free)return okKeys.slice(0,Math.max(2,Math.min(3,lv.cards)));const n=Math.max(2,Math.min(3,lv.cards));return shuffle([okKeys[0],...shuffle(OTHER.slice()).slice(0,n-1)])};

/* ============================== processes ============================== */
const STEP={
  /* 재료 고르기: 동작 앞의 짧은 고르기 */
  pick(what){
    const p=PICK[what];const keys=cardKeys(p.ok,p.free);
    const ask=p.free?['딸기랑 포도 중에 무엇을 줄까? 하나 골라 봐!','Strawberries or grapes? Pick one!']:[`${p.ko}${batchim(p.ko)?'을':'를'} 찾아 봐! 콕!`,`Find the ${p.en}! Tap it!`];
    cardsTray(keys,p.ok,(k,b)=>{
      const g=gen,from=ctr(b);let to=null,sz=110;
      if(what==='bread'){S.board=N_BREAD;lay();draw();to=ctr(E.board);}
      else if(what==='egg'){lay();to=ctr(E.egg);E.egg.innerHTML=eggWhole(false);E.egg.classList.add('hide')}
      else if(what==='fruit'){S.wash={kind:k,cells:Array(N_FRUIT*2).fill(0),gone:Array(N_FRUIT).fill(false)};lay();draw();to=ctr(E.bowl)}
      else{for(let i=0;i<N_CHICKEN;i++)S.cp[i]='dish';lay();draw();to=ctr(E.dish)}
      if(what==='bread'||what==='fruit'||what==='chicken'){Object.values(E).forEach(el=>{if(/^(board|bowl|dish|c\d)$/.test(el.dataset.n))el.style.opacity='0'})}
      fly(cardPic(k),from,to,Math.min(130,b.getBoundingClientRect().width),sz,600,()=>{if(g!==gen)return;
        Object.values(E).forEach(el=>{el.style.opacity=''});if(what==='egg')E.egg.classList.remove('hide');
        const t=what==='bread'?E.board:what==='egg'?E.egg:what==='fruit'?E.bowl:E.dish;if(t)squash(t);sfx.pop();alMood('wow',800);
        L.later(()=>{if(g===gen)finish()},500)},{up:80});
    },ask[0],ask[1]);
  },
  /* 빵을 토스터에 쏙(콕) */
  toastIn(){
    kind='tap';toolTray(breadSVG(0));say('빵을 콕! 토스터에 쏙 넣어요!','Tap the bread into the toaster!',true);
    AIM=()=>S.board>0?ctr(E.board):ctr(E.toaster);HOT=()=>[E.board,E.toaster];
    H={down:e=>{if(!hit(e,'board',8)&&!hit(e,'toaster',8))return false;if(busy||!tapOk()||S.board<=0)return;busy=true;G.stop();
      const k=N_BREAD-S.board,g=gen;S.board--;draw();const br=rectOf('board'),from=[br.left+br.width*(.3+.36*k),br.top+br.height*.48],to=at('toaster',SLOT_X[S.toast.n],30);
      sweepTone(500,900,.18,'triangle',.12);
      fly(breadSVG(0),from,to,br.width*.42,rectOf('toaster').width*.28,520,()=>{if(g!==gen)return;S.toast.n++;S.cnt.breadIn++;LOG.push('breadIn');draw();squash(E.toaster);sweepTone(700,300,.16,'sine',.14);say(M.CNT_KO[S.toast.n-1]+'! 쏙!',cap(M.CNT_EN[S.toast.n-1])+'!');
        busy=false;if(S.toast.n>=N_BREAD){H={};kind='wait';L.later(()=>{if(g===gen){S.board=0;lay();finish()}},500)}},{up:70});
    }};
    guideAt(AIM,'tap','빵을 콕 눌러 봐!','Tap the bread!');
  },
  /* 레버를 콕콕: 누를 때마다 빵이 노릇노릇 (시간이 아니라 아이 동작으로), 다 되면 띵! 통! */
  toastPop(){
    kind='tap';toolTray(toasterSVG({n:2,heat:.4,lever:30}));say('토스터를 콕콕 눌러요! 빵이 노릇노릇!','Tap the toaster! Make it toasty!',true);
    AIM=()=>at('toaster',150,110);HOT=()=>[E.toaster];let presses=0;
    H={down:e=>{if(!hit(e,'toaster',10))return false;if(busy||!tapOk()||presses>=N_PRESS)return;busy=true;G.stop();presses++;S.cnt.press++;LOG.push('press');const g=gen;
      /* three beats: the lever crouches up a little, slams down, the toaster wiggles; the slots glow and the bread browns */
      S.toast.lever=-4;draw();L.later(()=>{if(g!==gen)return;S.toast.lever=46;S.toast.glow=1;S.toast.heat=presses/N_PRESS;draw();squash(E.toaster);tone(180,.12,'square',.08);noise(.35,{type:'bandpass',freq:3200,q:.6,vol:.08});
        const r=rectOf('toaster');for(let k=0;k<2;k++){const [x,y]=at('toaster',SLOT_X[k],30),[sx,sy]=stXY(x,y);pt('heat',sx-6+k*12,sy-6,{sz:18,dx:rand(10)-5,dy:-50,ms:900})}
        say(M.CNT_KO[presses-1]+'!',cap(M.CNT_EN[presses-1])+'!');if(presses===2)sniff(true);void r},150);
      L.later(()=>{if(g!==gen)return;S.toast.glow=.45;draw();busy=false;
        if(presses>=N_PRESS){H={};kind='wait';L.later(()=>{if(g===gen)pop()},500)}},650)}};
    const pop=()=>{const g=gen;SFX.ding();S.toast.lever=0;S.toast.glow=0;S.toast.up=14;draw();say('띵! 통!','Ding! Pop!');sfx.boing();
      const tr=rectOf('toaster'),sz=tr.width*.3;
      for(let k=0;k<N_BREAD;k++)L.later(()=>{if(g!==gen)return;const from=at('toaster',SLOT_X[k],10);if(k===N_BREAD-1){S.toast.n=0;draw()}else{S.toast.n=N_BREAD-1-k;draw()}
        S.cnt.toastMade++;const pr=rectOf('plate'),to=[pr.left+pr.width*(.3+k*.14),pr.top+pr.height*.42];
        fly(breadSVG(1),from,to,sz,pr.width*.3,900,()=>{if(g!==gen)return;S.plate.toast++;S.cnt.toastPlated++;LOG.push('toastPlated');draw();squash(E.plate);sfx.pop();
          ptAt('crumb',to[0],to[1],5,{spread:34,up:26,bounce:true,dy:10,sz:10,ms:700});
          if(S.plate.toast>=N_BREAD){L.later(()=>{if(g!==gen)return;SFX.sparkle();say('바삭바삭 토스트 완성!','Crispy toast!');alMood('wow',900);finish()},500)}},{up:Math.min(160,tr.height*.9),spin:k?-380:360});
        steamAt(...at('toaster',SLOT_X[k],30),2,30)},k*220)};
    guideAt(AIM,'tap','토스터를 콕콕 눌러 봐!','Tap the toaster!');
  },
  /* 달걀을 톡 깨기(콕 N번): 금이 가고 → 쩍 벌어지며 노른자가 통 떨어져 출렁 (motion.cooking.crack) */
  crack(){
    kind='tap';toolTray(eggWhole(true));say(`달걀을 톡톡 깨요! 콕콕!`,'Crack the egg! Tap tap!',true);let taps=0;
    AIM=()=>ctr(E.egg);HOT=()=>[E.egg];
    H={down:e=>{if(!hit(e,'egg',14)&&!hit(e,'pan',0))return false;if(busy||!tapOk())return;busy=true;G.stop();taps++;S.cnt.crack++;LOG.push('crack');const g=gen;
      if(taps<N_CRACK){E.egg.innerHTML=eggWhole(true);beat(E.egg,'translateY(10%) rotate(-8deg)',180);noise(.06,{type:'highpass',freq:3000,vol:.3});tone(1200,.04,'square',.1);
        ptAt('shell',...ctr(E.egg),2,{spread:30,up:20,bounce:true,dy:30,sz:10,ms:700});say('톡!','Tap!');L.later(()=>{if(g===gen){busy=false;guideAt(AIM,'tap','한 번 더 콕!','Once more!')}},450);return}
      /* open: two shell halves swing away, the egg falls into the pan with a plop */
      const er=rectOf('egg'),c=ctr(E.egg);E.egg.classList.add('hide');noise(.12,{type:'highpass',freq:2400,vol:.28});say('쩍!','Crack!');
      ['l','r'].forEach(s=>{const f=document.createElement('div');f.className='rs-float';f.innerHTML=shellHalf(s);const [x,y]=stXY(er.left,er.top);Object.assign(f.style,{left:x+'px',top:y+'px',width:er.width+'px',height:er.height+'px'});fxEl.appendChild(f);
        anim(f,[{transform:'none',opacity:1},{transform:`translate(${s==='l'?-24:24}px,-10px) rotate(${s==='l'?-40:40}deg)`,opacity:1,offset:.4},{transform:`translate(${s==='l'?-50:50}px,30px) rotate(${s==='l'?-70:70}deg)`,opacity:0}],{duration:900,easing:'ease-out',fill:'forwards'});setTimeout(()=>f.remove(),950)});
      const to=at('pan',PAN_C[0],PAN_C[1]),pr=rectOf('pan'),dz=pr.width*.32;
      const d=fly(dropSVG,[c[0],c[1]+er.height*.1],to,er.width*.7,dz,480,()=>{if(g!==gen)return;S.pan.egg=true;S.pan.raw=true;S.pan.cells=EGG_CELLS.map(()=>0);draw();
        E.pan.classList.remove('wob');void E.pan.offsetWidth;E.pan.classList.add('wob');sweepTone(240,120,.18,'sine',.25);noise(1.1,{type:'bandpass',freq:4200,q:.5,vol:.07});LOG.push('eggInPan');S.cnt.eggs++;
        ptAt('oil',to[0],to[1],6,{spread:pr.width*.25,up:24,dy:8,sz:9,ms:600});steamAt(to[0],to[1]-20,3,70);say('지글지글!','Sizzle sizzle!');sniff(false);
        L.later(()=>{if(g===gen)finish()},900)},{up:0});void d}};
    guideAt(AIM,'tap','달걀을 콕 눌러 봐!','Tap the egg!');
  },
  /* 뒤집개로 쓱쓱: 닿은 곳만 투명 → 하양 (지글지글, 김) */
  fry(){
    kind='rub';const stopI=intro(turnerSVG,'뒤집개!','Turner!');say('뒤집개로 쓱쓱! 달걀이 하얗게 익어요!','Rub with the turner! The egg turns white!',true);
    const cells=EGG_CELLS.map(([x,y])=>[(PAN_C[0]+x*PAN_K)/300,(PAN_C[1]+y*PAN_K)/210]);let lastFx=0;
    rubTool({icon:turnerSVG,anchor:[.36,.7],gap:.3,log:'fry',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[5,5],rad:.1,target:()=>rectOf('pan'),
      sound:()=>noise(.18,{type:'bandpass',freq:4200,q:.5,vol:.07}),
      touch:()=>{E.pan.classList.add('hot');rubBelly(false)},release:()=>E.pan.classList.remove('hot'),
      frame:(F)=>{const n=performance.now();if(!F||n-lastFx<140)return;lastFx=n;pt('steam',F.x+rand(30)-15,F.y-10,{sz:20,dx:rand(14)-7,dy:-50,ms:900});if(Math.random()<.5)pt('oil',F.x,F.y,{sz:7,dx:rand(40)-20,dy:-4,up:18,ms:500})},
      cell:(i,v)=>{S.pan.cells[i]=v;if(v>=1&&Math.random()<.3)sniff(false)},
      done:()=>{S.pan.cells=EGG_CELLS.map(()=>1);S.pan.raw=false;draw();SFX.sparkle();say('하얗게 익었어요!','All white and cooked!');alMood('wow',900);finish()}});
    AIM=()=>at('pan',PAN_C[0],PAN_C[1]);guideAt(AIM,'scrub','쓱쓱 문질러 봐!','Rub rub!');
  },
  /* 휙 뒤집기(콕 한 번 = 뒤집기 한 번): 팬이 살짝 움츠렸다 튕기고, 달걀이 공중에서 한 바퀴 돌고 착, 지글지글 김 */
  flip(){
    kind='tap';toolTray(turnerSVG);say('콕! 휙 뒤집어요!','Tap to flip it!',true);AIM=()=>at('pan',PAN_C[0],PAN_C[1]);HOT=()=>[E.pan];
    let drag=null;
    const doFlip=()=>{if(busy)return;busy=true;H={};G.stop();kind='wait';S.cnt.flip++;LOG.push('flip');const g=gen,pr=rectOf('pan'),c=at('pan',PAN_C[0],PAN_C[1]),sz=pr.width*PAN_K*160/300,hgt=sz*140/160;
      S.flipT0=performance.now();
      /* the pan crouches, then tosses */
      anim(E.pan,[{transform:'none'},{transform:'translateY(5%) rotate(-3deg)',offset:.2},{transform:'translateY(-7%) rotate(5deg)',offset:.38},{transform:'translateY(2%) rotate(-1deg)',offset:.85},{transform:'none'}],{duration:1150,easing:'ease-in-out'});
      L.later(()=>{if(g!==gen)return;S.pan.egg=false;draw();sweepTone(300,900,.25,'triangle',.12);
        const f=document.createElement('div');f.className='rs-float rs-flipegg';f.innerHTML=eggFlatSVG(S.pan.cells,false,false);const [x,y]=stXY(c[0],c[1]);Object.assign(f.style,{left:(x-sz/2)+'px',top:(y-hgt/2)+'px',width:sz+'px',height:hgt+'px',zIndex:25});fxEl.appendChild(f);
        const up=Math.min(G0.H*.42,pr.height*1.15);
        const a=anim(f,[{transform:'translateY(0) rotate(0) scale(1)',easing:'cubic-bezier(.2,.7,.4,1)'},{transform:`translateY(${-up}px) rotate(180deg) scale(.9,.55)`,offset:.48,easing:'cubic-bezier(.6,0,.8,.4)'},{transform:'translateY(0) rotate(360deg) scale(1)',offset:.86},{transform:'translateY(0) rotate(360deg) scale(1.18,.78)',offset:.92},{transform:'translateY(0) rotate(360deg) scale(1)'}],{duration:900,fill:'forwards'});
        L.later(()=>{if(g!==gen)return;f.innerHTML=eggFlatSVG(S.pan.cells,true,false)},430);
        L.later(()=>{if(g!==gen)return;f.remove();S.pan.egg=true;S.pan.flip=true;draw();E.pan.classList.remove('wob');void E.pan.offsetWidth;E.pan.classList.add('wob');squash(E.pan);
          noise(1.2,{type:'bandpass',freq:4000,q:.5,vol:.1});tone(160,.1,'sine',.2);steamAt(c[0],c[1]-10,4,pr.width*.4);ptAt('oil',c[0],c[1],8,{spread:pr.width*.3,up:30,dy:6,sz:9,ms:650});
          say('휙! 착! 지글지글!','Flip! Sizzle!');sniff(true);
          L.later(()=>{if(g!==gen)return;/* the egg slides onto the plate */
            S.pan.egg=false;draw();const pl=rectOf('plate'),to=[pl.left+pl.width*.7,pl.top+pl.height*.42];
            fly(eggFlatSVG(null,true,false),c,to,sz,pl.width*.42,700,()=>{if(g!==gen)return;S.plate.egg=true;S.cnt.eggPlated++;draw();squash(E.plate);sfx.pop();SFX.sparkle();say('달걀 프라이 완성!','Fried egg done!');alMood('wow',900);finish()},{up:50})},1100)},900);
        void a},170)};
    H={down:e=>{if(!hit(e,'pan',10))return false;if(!tapOk())return;drag={y:e.clientY,t:performance.now()}},
      move:e=>{if(drag&&drag.y-e.clientY>30){drag=null;doFlip()}},
      up:()=>{if(drag){drag=null;doFlip()}}};
    guideAt(AIM,'tap','팬을 콕 눌러 봐!','Tap the pan!');
  },
  /* 과일을 물에 쓱쓱 씻기 (물 주전자가 손가락을 따라옴) */
  wash(){
    kind='rub';const stopI=intro(jugSVG,'물!','Water!');const fk=S.wash.kind;say(`${FRUIT[fk].ko}${batchim(FRUIT[fk].ko)?'을':'를'} 물로 쓱쓱 씻어요!`,`Wash the ${FRUIT[fk].en}!`,true);
    const cells=[];BOWL_F.forEach(p=>{cells.push([(p[0]-10)/260,(p[1]-6)/170]);cells.push([(p[0]+10)/260,(p[1]+8)/170])});let lastFx=0;
    rubTool({icon:jugSVG,anchor:[.1,.27],gap:.6,log:'wash',stopIntro:stopI,effect:'water',cells,grid:[6,3],rad:.11,target:()=>rectOf('bowl'),
      sound:()=>noise(.2,{type:'lowpass',freq:1600,vol:.12}),touch:()=>rubBelly(false),
      frame:F=>{const n=performance.now();if(!F||n-lastFx<120)return;lastFx=n;pt('drop',F.x+rand(20)-10,F.y,{sz:12,dx:rand(60)-30,dy:10,up:30,ms:600});if(Math.random()<.4)pt('bubble',F.x+rand(30)-15,F.y,{sz:16,dx:rand(10)-5,dy:-30,ms:900})},
      cell:(i,v,pv)=>{S.wash.cells[i]=v;const f=i>>1;if(v>=1&&pv<1&&S.wash.cells[f*2]>=1&&S.wash.cells[f*2+1]>=1){S.cnt.washed++;tone(880+f*120,.12,'sine',.14);const [x,y]=at('bowl',BOWL_F[f][0],BOWL_F[f][1]);ptAt('spark',x,y-10,2,{spread:30,sz:20,ms:800})}},
      done:()=>{S.wash.cells.fill(1);S.cnt.washed=N_FRUIT;draw();SFX.sparkle();say('반짝반짝 깨끗해요!','Sparkling clean!');alMood('wow',900);finish()}});
    AIM=()=>ctr(E.bowl);guideAt(AIM,'scrub','쓱쓱 씻어 봐!','Wash wash!');
  },
  /* 씻은 과일을 콕콕 접시에 (씻은 만큼 다) */
  plateFruit(){
    kind='tap';const fk=S.wash.kind;toolTray(fruitSVG(fk));say(`${FRUIT[fk].ko}${batchim(FRUIT[fk].ko)?'을':'를'} 콕! 접시에 올려요!`,`Tap the ${FRUIT[fk].en} onto the plate!`,true);
    const next=()=>S.wash.gone.findIndex(x=>!x);
    AIM=()=>{const i=next();return i<0?ctr(E.plate):at('bowl',BOWL_F[i][0],BOWL_F[i][1])};HOT=()=>[E.bowl];
    H={down:e=>{if(!hit(e,'bowl',8)&&!hit(e,'plate',4))return false;if(busy||!tapOk())return;let i=next();if(i<0)return;
      const r=rectOf('bowl');if(inRect(e,r)){let bd=1e9;S.wash.gone.forEach((g2,j)=>{if(g2)return;const [x,y]=at('bowl',BOWL_F[j][0],BOWL_F[j][1]),d=Math.hypot(x-e.clientX,y-e.clientY);if(d<bd){bd=d;i=j}})}
      busy=true;G.stop();const g=gen,from=at('bowl',BOWL_F[i][0],BOWL_F[i][1]);S.wash.gone[i]=true;draw();ptAt('drop',from[0],from[1],4,{spread:30,up:20,dy:20,sz:10,ms:600});
      const k=S.plate.fruit.length,pl=rectOf('plate'),to=[pl.left+(78+k*30)/220*pl.width,pl.top+(104-(k%2)*4)/140*pl.height];
      fly(fruitSVG(fk),from,to,r.width*.26,pl.width*.18,560,()=>{if(g!==gen)return;S.plate.fruit.push(fk);S.cnt.fruitPlated++;LOG.push('fruitPlated');draw();squash(E.plate);sfx.pop();
        say(M.CNT_KO[S.plate.fruit.length-1]+'!',cap(M.CNT_EN[S.plate.fruit.length-1])+'!');busy=false;
        if(next()<0){H={};kind='wait';L.later(()=>{if(g!==gen)return;SFX.sparkle();say('아침 식사 완성!','Breakfast is ready!');alPlay('clap');finish()},600)}},{up:60})}};
    guideAt(AIM,'tap','과일을 콕 눌러 봐!','Tap the fruit!');
  },
  /* 튀김가루 쓱쓱 굴리기: 닿은 조각만 하얗게, 가루 구름이 폭 */
  coat(){
    kind='rub';const stopI=intro(handSVG,'튀김가루!','Flour!');say('닭고기를 튀김가루에 쓱쓱 굴려요!','Roll the chicken in the flour!',true);
    const pos=[[.27,.4],[.5,.32],[.73,.42],[.5,.6]].slice(0,N_CHICKEN),cells=[];pos.forEach(p=>{cells.push([p[0]-.04,p[1]-.04]);cells.push([p[0]+.04,p[1]+.05])});let lastFx=0;
    rubTool({icon:handSVG,anchor:[.5,.6],gap:.3,log:'coat',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,4],rad:.1,target:()=>rectOf('dish'),
      sound:()=>noise(.14,{type:'highpass',freq:1800,vol:.08}),touch:()=>rubBelly(false),
      frame:F=>{const n=performance.now();if(!F||n-lastFx<110)return;lastFx=n;pt('flour',F.x+rand(30)-15,F.y,{sz:26,dx:rand(40)-20,dy:-30-rand(20),ms:800});
        /* the touched piece rolls a little under the hand */
        const sr=stR();for(let i=0;i<N_CHICKEN;i++){const el=E['c'+i];if(!el)continue;const r=el.getBoundingClientRect();if(F.x+sr.left>r.left&&F.x+sr.left<r.right&&F.y+sr.top>r.top&&F.y+sr.top<r.bottom&&!el.getAnimations().length)anim(el,[{transform:'none'},{transform:'rotate(-16deg) translateX(-4%)'},{transform:'rotate(10deg) translateX(3%)'},{transform:'none'}],{duration:420,easing:'ease-in-out'})}},
      cell:(i,v)=>{const p=i>>1,a=Math.min(1,((S.cells[p*2]=(i%2?S.cells[p*2]:v))+(S.cells[p*2+1]=(i%2?v:S.cells[p*2+1])))/2);S.coat[p]=a;if(a>=1&&!S.coated[p]){S.coated[p]=true;S.cnt.coated++;tone(700+p*80,.1,'sine',.12)}},
      done:()=>{for(let i=0;i<N_CHICKEN;i++){S.coat[i]=1;if(!S.coated[i]){S.coated[i]=true;S.cnt.coated++}}draw();SFX.sparkle();say('하얗게 옷을 입었어요!','All coated!');alMood('wow',900);finish()}});
    AIM=()=>ctr(E.dish);guideAt(AIM,'scrub','쓱쓱 굴려 봐!','Roll roll!');
  },
  /* 기름에 하나씩 퐁당: 조각을 다 넣어야 다음 */
  drop(){
    kind='tap';toolTray(tongsSVG);say(`닭고기를 콕! 기름에 퐁당! ${M.CNT_KO[N_CHICKEN-1]===undefined?'':'다 넣어요!'}`,'Tap each piece into the oil!',true);
    const next=()=>S.cp.findIndex(x=>x==='dish');
    AIM=()=>{const i=next();return i<0?ctr(E.pot):ctr(E['c'+i])};HOT=()=>{const i=next();return i<0?[]:[E['c'+i]]};
    H={down:e=>{let i=-1;for(let j=0;j<N_CHICKEN;j++)if(S.cp[j]==='dish'&&hit(e,'c'+j,6))i=j;if(i<0&&(hit(e,'pot',4)||hit(e,'sdish',6)))i=next();if(i<0)return false;if(busy||!tapOk())return;busy=true;G.stop();
      const g=gen,el=E['c'+i],from=ctr(el),slot=S.pot.length,ps=POT_S[slot],to=at('pot',ps[0],ps[1]+4);S.cp[i]='flying';el.classList.add('hide');
      sweepTone(600,400,.2,'triangle',.1);
      const sz=el.getBoundingClientRect().width,pr=rectOf('pot');
      /* the tongs carry the piece in an arc, it plops in: splash, bubbles, sizzle */
      fly(`<svg viewBox="-50 -70 100 120" style="overflow:visible">${drum(1,0)}<g transform="translate(-14 -86) scale(.7)">${svgInner(tongsSVG)}</g></svg>`,from,to,sz,pr.width*.26,560,()=>{if(g!==gen)return;
        S.cp[i]='pot';S.pot.push(0);S.cnt.dropped++;LOG.push('drop');draw();E.pot.classList.add('hot');setTimeout(()=>E.pot&&E.pot.classList.remove('hot'),900);
        sweepTone(260,90,.22,'sine',.28);noise(.9,{type:'bandpass',freq:3800,q:.5,vol:.09});
        ptAt('oil',to[0],to[1],7,{spread:pr.width*.18,up:40,dy:16,sz:10,ms:650});ptAt('bubble',to[0],to[1],4,{spread:30,dy:-24,sz:16,ms:900});
        say(['퐁당!','하나!','둘!','셋!','넷!','다섯!','여섯!'][S.pot.length]||'퐁당!',cap(M.CNT_EN[S.pot.length-1])+'!');if(S.pot.length===2)sniff(true);
        busy=false;if(next()<0){H={};kind='wait';L.later(()=>{if(g!==gen)return;say('다 넣었어요! 지글지글!','All in! Sizzle sizzle!');finish()},700)}else guideAt(AIM,'tap','다음 조각도 콕!','Next piece!')},{up:90})}};
    guideAt(AIM,'tap','닭고기를 콕 눌러 봐!','Tap a piece!');
  },
  /* 집게로 쓱쓱 휘저으면: 닿은 조각만 하양 → 노릇 (시간이 아니라 아이 동작으로) */
  fry2(){
    kind='rub';const stopI=intro(tongsSVG,'집게!','Tongs!');say('집게로 쓱쓱! 노릇노릇 튀겨요!','Stir with the tongs! Make them golden!',true);
    const cells=[];S.pot.forEach((f,i)=>{const p=POT_S[i];cells.push([(p[0]-8)/260,(p[1]-6)/210]);cells.push([(p[0]+8)/260,(p[1]+6)/210])});S.fv=cells.map(()=>0);let lastFx=0;
    rubTool({icon:tongsSVG,anchor:[.2,.86],gap:.35,log:'fry2',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,3],rad:.1,target:()=>rectOf('pot'),
      sound:()=>noise(.2,{type:'bandpass',freq:3800,q:.5,vol:.08}),touch:()=>{E.pot.classList.add('hot');rubBelly(false)},release:()=>E.pot.classList.remove('hot'),
      frame:F=>{const n=performance.now();if(!F||n-lastFx<90)return;lastFx=n;pt('bubble',F.x+rand(40)-20,F.y+10,{sz:14,dx:rand(10)-5,dy:-26,ms:700});if(Math.random()<.35)pt('steam',F.x+rand(30)-15,F.y-14,{sz:20,dx:rand(10)-5,dy:-50,ms:1000})},
      cell:(i,v)=>{S.fv[i]=v;const p=i>>1;S.pot[p]=(S.fv[p*2]+S.fv[p*2+1])/2;if(S.pot[p]>=1&&!S.fried[p]){S.fried[p]=true;S.cnt.fried++;tone(780+p*90,.1,'sine',.12);sniff(true)}},
      done:()=>{S.pot=S.pot.map(()=>1);S.pot.forEach((f,p)=>{if(!S.fried[p]){S.fried[p]=true;S.cnt.fried++}});draw();SFX.sparkle();say('노릇노릇 바삭!','Golden and crispy!');alMood('wow',900);finish()}});
    AIM=()=>ctr(E.pot);guideAt(AIM,'scrub','쓱쓱 저어 봐!','Stir stir!');
  },
  /* 집게로 콕 건져서 바구니에 (튀긴 만큼 다) */
  lift(){
    kind='tap';toolTray(basketSVG(0));say('집게로 콕! 바구니에 담아요!','Tap to lift them into the basket!',true);
    const next=()=>S.pot.findIndex(f=>f!=null);AIM=()=>{const i=next();return i<0?ctr(E.basket):at('pot',POT_S[i][0],POT_S[i][1])};HOT=()=>[E.pot];
    H={down:e=>{if(!hit(e,'pot',6)&&!hit(e,'basket',4))return false;if(busy||!tapOk())return;const i=next();if(i<0)return;busy=true;G.stop();const g=gen;
      const from=at('pot',POT_S[i][0],POT_S[i][1]),pr=rectOf('pot');S.pot[i]=null;draw();const k=S.basketN,br=rectOf('basket'),bp=BASK_S[k],to=[br.left+bp[0]/220*br.width,br.top+bp[1]/150*br.height];
      tone(500,.08,'triangle',.12);ptAt('oil',from[0],from[1],5,{spread:20,dy:30,up:4,sz:8,ms:700});
      fly(`<svg viewBox="-50 -70 100 120" style="overflow:visible">${drum(1,1)}<g transform="translate(-14 -86) scale(.7)">${svgInner(tongsSVG)}</g></svg>`,from,to,pr.width*.3,br.width*.32,640,()=>{if(g!==gen)return;
        S.basketN++;S.cnt.basket++;LOG.push('basket');draw();squash(E.basket);sfx.pop();ptAt('crumb',to[0],to[1],4,{spread:26,up:20,bounce:true,dy:8,sz:9,ms:650});
        say(M.CNT_KO[S.basketN-1]+'!',cap(M.CNT_EN[S.basketN-1])+'!');busy=false;
        if(next()<0){H={};kind='wait';L.later(()=>{if(g!==gen)return;SFX.sparkle();say('바삭 치킨 완성!','Crispy chicken is ready!');alPlay('clap');finish()},600)}},{up:110})}};
    guideAt(AIM,'tap','기름 속 치킨을 콕!','Tap the chicken!');
  },
  /* 끝내기: 콕 → 손님이 받아서 킁킁 → 한 입 크게 → 볼이 볼록 → 냠냠 → 춤 → 하트 */
  serve(){
    kind='tap';const n=S.menu==='toast'?'plate':'basket';toolTray(S.menu==='toast'?plateSVG(S.plate):basketSVG(S.basketN));
    say(`완성! 콕 눌러서 ${S.name}에게 줘요!`,`All done! Tap to give it to ${S.name}!`,true);AIM=()=>ctr(E[n]);HOT=()=>[E[n]];
    H={down:e=>{if(!hit(e,n,6)&&!inRect(e,custEl.getBoundingClientRect()))return false;H={};G.stop();kind='wait';give(E[n])}};
    guideAt(AIM,'tap','콕 눌러서 건네줘!','Tap to give!');
  }
};

/* ---------- ending ---------- */
function give(fromEl){
  phase='eat';const g=gen,cr=custEl.getBoundingClientRect(),fr=fromEl.getBoundingClientRect();LOG.push('serve');rubBelly(false);
  const html=fromEl.innerHTML;fromEl.classList.add('hide');tray.innerHTML='';
  const mouth=[cr.left+cr.width*.5,cr.top+cr.height*.66],sz=cr.width*.62;
  fly(html,[fr.left+fr.width/2,fr.top+fr.height/2],mouth,Math.min(fr.width,200),sz,900,f=>{if(g!==gen){f.remove();return}
    /* sniff, then big bites: the food shrinks, the cheeks puff */
    sniff(false);say('킁킁~ 맛있는 냄새!','Sniff sniff! Smells yummy!');
    L.later(()=>{if(g!==gen)return;drawCust('yum');cfxEl.classList.remove('puff');void cfxEl.offsetWidth;cfxEl.classList.add('puff');LOG.push('bite');
      [0,600,1200].forEach((t,k)=>L.later(()=>{if(g!==gen)return;SFX.chomp();anim(f,[{transform:`scale(${1-k*.22})`},{transform:`scale(${.86-k*.22},${.9-k*.22})`},{transform:`scale(${.78-k*.22})`}],{duration:400,fill:'forwards',easing:'ease-out'});
        ptAt('crumb',mouth[0],mouth[1],3,{spread:30,up:14,bounce:true,dy:30,sz:9,ms:700})},t));
      const p=pick(PRAISE);L.later(()=>{if(g!==gen)return;say('냠냠! '+p.ko,'Yum yum! '+p.en)},400)},900);
    L.later(()=>{if(g!==gen)return;f.remove();drawCust('happy');alPlay('dance');SFX.sparkle();
      L.later(()=>{if(g===gen)heart()},2300)},3000)},{up:40,keep:true});
}
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-50],50,44,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('고마워! 또 올게요!','Thank you! See you again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');cfxEl.style.visibility='hidden';bubEl.hidden=true;
      L.later(()=>{if(g===gen)newRound()},1400)},1500)},1100);
}

/* ---------- a new round: the shop front first ---------- */
const KINDS=(VO.animalNames||[{id:'bunny',ko:'토끼',en:'bunny',name:'토토'}]).filter(k=>A.KINDS[k.id]);
function lobbyOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
/* not in config: which menu each of the three guests asks for (two menus: at least one of each, the last one is not repeated first) */
function makeOrders(v){if(v.menus.length<2)return[v.menus[0],v.menus[0],v.menus[0]];const o=shuffle([v.menus[0],v.menus[1],pick(v.menus)]);if(o[0]===DATA.last)o.push(o.shift());return o}
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';ptNow=0;tray.innerHTML='';tray.onpointerdown=null;busy=false;
  if(al){al.detach();al=null}lobbyOff();custEl.classList.remove('leave','enter','rs-rub');cfxEl.classList.remove('puff','sniff');
  lv=levelInfo(levelNo());const orders=makeOrders(lv),kinds=shuffle(KINDS.map(k=>k.id)).slice(0,3);
  S={view:'lobby',orders,kinds,menu:null,kind:null,name:'',board:0,toast:{n:0,heat:0,glow:0,lever:0,up:0},plate:{toast:0,egg:false,fruit:[]},pan:{egg:false,cells:null,flip:false,raw:true},wash:null,
    cp:Array(N_CHICKEN).fill('none'),coat:Array(N_CHICKEN).fill(0),cells:Array(N_CHICKEN*2).fill(0),coated:Array(N_CHICKEN).fill(false),fried:Array(N_CHICKEN).fill(false),pot:[],basketN:0,
    cnt:{breadIn:0,press:0,toastMade:0,toastPlated:0,crack:0,eggs:0,flip:0,eggPlated:0,washed:0,fruitPlated:0,coated:0,dropped:0,fried:0,basket:0}};
  work.innerHTML='';E={};pi=0;phase='lobby';kind='tap';HOT=()=>[...lobbyEl.querySelectorAll('.rs-lc')];
  plan=new Set(orders).size===1?planFor(orders[0]):[];
  LOG.push('level:'+lv.level,'orders:'+orders.join('+'));
  lobbyEl.querySelectorAll('.rs-lc').forEach(b=>b.remove());
  kinds.forEach((k,i)=>{const b=document.createElement('button');b.className='rs-lc';b.dataset.i=i;b.setAttribute('aria-label','손님');
    b.innerHTML=`<span class="lc-ani">${A.animal(k,'idle',{})}</span><span class="lc-bub">${ORDER_PIC[orders[i]]}</span>`;lobbyEl.appendChild(b)});
  showView('lobby');strip();size();
  if(M.Alive){lobbyEl.querySelectorAll('.lc-ani').forEach((e,i)=>lobbyAl.push(M.Alive.attach(e,{kind:kinds[i],waiting:true})));if(M.Alive.takeTurns)turns=M.Alive.takeTurns(lobbyAl);L.onEnd(lobbyOff)}
  AIM=()=>{const b=lobbyEl.querySelector('.rs-lc:nth-child(3)');return b?ctr(b):[0,0]};
  say('어서 오세요! 누구에게 요리해 줄까? 친구를 콕!','Welcome! Who shall we cook for? Tap a friend!',true);
  H={down:e=>{const bs=[...lobbyEl.querySelectorAll('.rs-lc')];const i=bs.findIndex(b=>inRect(e,b.getBoundingClientRect(),4));if(i<0)return false;if(busy)return;busy=true;choose(i)}};
  const g=gen;L.later(()=>{if(g===gen)G.start({type:'tap',at:()=>stXY(...AIM()),ko:'친구를 콕 눌러 봐!',en:'Tap a friend!'})},800);
}
function choose(i){
  const g=gen,bs=[...lobbyEl.querySelectorAll('.rs-lc')];G.stop();H={};LOG.push('customer:'+S.orders[i]);
  bs.forEach((b,j)=>b.classList.add(j===i?'sel':'gone'));sfx.pop();
  S.menu=S.orders[i];S.kind=S.kinds[i];const kn=KINDS.find(k=>k.id===S.kind)||{};S.name=kn.name||kn.ko||'';DATA.last=S.menu;save();
  const m=MENUS.find(x=>x.id===S.menu)||{ko:'',en:''};say(`${m.ko} 주세요!`,`${cap(m.en)}, please!`);
  L.later(()=>{if(g!==gen)return;lobbyOff();startWork()},1300);
}
function startWork(){
  const g=gen;
  if(S.menu==='toast'){mkIt('plate','');mkIt('toaster','');mkIt('board','');mkIt('pan','');mkIt('egg',eggWhole(false));mkIt('bowl','')}
  else{mkIt('dish',dishSVG);mkIt('sdish',smallDishSVG);mkIt('pot','');mkIt('basket','');for(let i=0;i<N_CHICKEN;i++)mkIt('c'+i,'')}
  plan=planFor(S.menu);pi=0;showView('work');cfxEl.style.visibility='';
  if(al){al.detach();al=null}drawCust('idle');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:S.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=ORDER_PIC[S.menu];bubEl.hidden=true;
  phase='enter';kind='wait';strip();size();draw();
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;rubBelly(true);
    say(S.menu==='toast'?`안녕! 나는 ${S.name}. 배고파요. 아침밥 만들어 줘!`:`안녕! 나는 ${S.name}. 바삭바삭 치킨 먹고 싶어!`,S.menu==='toast'?`Hi! I'm ${S.name}. I'm hungry. Breakfast, please!`:`Hi! I'm ${S.name}. Crispy chicken, please!`)},1200);
  L.later(()=>{if(g!==gen)return;run()},3600);
}

/* ---------- test hooks ---------- */
const HAND_OF={pick:'choose',toastIn:'tap',toastPop:'tap',crack:'tap',fry:'rub',flip:'tap',wash:'rub',plateFruit:'tap',coat:'rub',drop:'tap',fry2:'rub',lift:'tap',serve:'tap'};
M.__rsLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__rs=()=>{
  const k=plan[pi]||null;let aim=null;try{aim=AIM?AIM():null}catch(e){}const sr=stR();
  let hot=[];try{hot=HOT().filter(Boolean).map(e=>{const r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})}catch(e){}
  const tr=tool?(()=>{const t=E[{fry:'pan',wash:'bowl',coat:'dish',fry2:'pot'}[phase]];const r=t?t.getBoundingClientRect():sr;return{x:r.left,y:r.top,w:r.width,h:r.height}})():null;
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,view:S&&S.view,menu:S&&S.menu,orders:S?S.orders.slice():[],
    rect:tr||{x:sr.left,y:sr.top,w:sr.width,h:sr.height},cellPts:tool?tool.cellPts():[],toolOn:!!tool,toolDone:tool?tool.done:false,
    cards:[...tray.querySelectorAll('.rs-card')].map(b=>{const r=b.getBoundingClientRect();return{k:b.dataset.k,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,ok:HOT().includes(b)}}),hot,
    custPts:[...lobbyEl.querySelectorAll('.rs-lc')].map(b=>ctr(b)),cnt:S?Object.assign({},S.cnt):{},plate:S?JSON.parse(JSON.stringify(S.plate)):null,pot:S?S.pot.slice():[],basket:S?S.basketN:0,cp:S?S.cp.slice():[],
    toastHeat:S?S.toast.heat:0,eggCooked:S&&S.pan.cells?S.pan.cells.reduce((a,b)=>a+b,0)/S.pan.cells.length:0,flipped:S?S.pan.flip:false,flipT0:S?S.flipT0||0:0,
    nChicken:N_CHICKEN,nBread:N_BREAD,nFruit:N_FRUIT,particles:ptNow,particlePeak:ptPeak,particleMax:PART.max,
    alive:al?al.state():null,lobbyAlive:lobbyAl.length,misses,guide:G.state(),served:DATA.served,log:LOG.slice()};
};
M.__rsDepth=()=>LV.map((l,i)=>{const v=levelInfo(i+1);const rows=v.menus.map(m=>{const p=planFor(m),work=p.filter(x=>HAND_OF[x.split(':')[0]]!=='choose'&&x!=='serve');
    return{menu:m,processes:new Set(work).size,steps:p.length,list:work,hands:[...new Set(p.map(x=>HAND_OF[x.split(':')[0]]))]}});
  return{level:i+1,menus:v.menus,notBuilt:MENUS.filter(m=>(l.new||'').includes(m.ko)&&!BUILT.includes(m.id)).map(m=>m.id),cards:v.cards,processes:Math.min(...rows.map(r=>r.processes)),handActions:[...new Set(rows.flatMap(r=>r.hands))],customer:!!M.Alive,choice:true,ending:true,byMenu:rows}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';ptNow=0;tray.onpointerdown=null;lobbyOff();if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* tile picture on the home screen */
document.querySelectorAll(`.tile[data-go="${id}"] .ic`).forEach(ic=>{
  ic.innerHTML=`<svg viewBox="0 0 100 100" style="width:1.5em;height:1.5em;overflow:visible"><g transform="translate(-4 34) scale(.5)">${svgInner(plateSVG({toast:2,egg:true,fruit:['strawberry']}))}</g><g transform="translate(46 -4) scale(.46)">${svgInner(drumSVG(1,1).replace('viewBox="-50 -50 100 100"',''))}</g></svg>`;
});
})();
