/* 말랑 식당 (P17) — 셰프 도전을 진짜 요리로. 가게 앞에서 손님을 고르면, 그 주문대로 손으로 직접 요리해요.
   호텔 아침 식사: 빵 고르기 → 토스터에 쏙(콕) → 레버 콕콕(빵이 하양 → 갈색) → 통! 접시로 / 달걀 고르기 → 톡 톡 깨기 → 뒤집개로 쓱쓱(투명 → 하양) → 휙 뒤집기 → 접시로 /
                   딸기·포도 고르기(틀린 답 없음) → 물에 쓱쓱 씻기 → 콕콕 접시에 → 건네주기
   바삭 치킨: 닭 고르기 → 튀김가루 쓱쓱 굴리기 → 기름에 하나씩 퐁당(4조각을 다 넣어야 다음) → 집게로 쓱쓱(하양 → 노릇) → 집게로 콕 건져 바구니에(4조각) → 건네주기
   버거(3단계): 빵 고르기(카드 3장) → 칼로 슥슥 반 자르기 → 고기 굽기(판에 올리기 → 뒤집개로 꾹꾹 → 휙 뒤집기) → 치즈가 사르르 → 상추 씻고 찢기 → 토마토 썰기
                (준비된 것은 준비 접시에) → 아래 빵·고기·상추·토마토 차례로 쌓기(틀리면 튀어 돌아옴) → 소스 고르기(3장) → 지그재그 뿌리기 → 뚜껑 덮고 꾹 → 건네주기
   파스타(4단계, 손님이 두 가지 주문): 면 고르기 → 물 끓이기 → 면 넣기 → 빙글빙글 젓기 → 체에 쏟고 탈탈 → 소스 고르기(토마토·크림) → 국자로 붓기 → 면 넣고 휙휙 섞기 →
                포크로 돌돌 담기 → 치즈 솔솔·바질 + 곁들임(주스: 오렌지 짜기 → 선까지 붓기 / 샐러드: 오이 썰기 → 섞기) → 두 가지 다 건네주기
   손님은 주문하는 순간과 건네받는 순간에 무대 높이의 절반만큼 크게(games.restaurant.customerBig). 물 주전자는 손가락 위에 떠서 물줄기만 내려오고, 음식 위에서는 비쳐 보임.
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
/* the menus this file can cook */
const BUILT=['toast','chicken','burger','pasta'];
/* numbers that are written inside the step sentences of games.restaurant.menus */
const stepOf=(m,i)=>((MENUS.find(x=>x.id===m)||{}).steps||[])[i]||'';
const N_CHICKEN=Math.max(2,Math.min(6,num(stepOf('chicken',1),0,4)));   // '조각 4개를 다 넣어야 다음'
const N_CRACK=Math.max(1,Math.min(4,num(stepOf('toast',1),0,2)));       // '톡 깨서(콕 2번)'
/* not in config: slices of bread in the toaster, presses of the lever until golden, fruit on the plate */
const N_BREAD=2,N_PRESS=3,N_FRUIT=3;
const N_TOMATO=Math.max(2,Math.min(3,num(stepOf('burger',3),0,2)));        // '토마토 2조각'
/* not in config: knife strokes through the bun, tears in the leaf, taps to boil, spaghetti bundles, shakes of the colander, ladles, tosses, orange halves, cucumber slices */
const N_STROKE=3,N_TEAR=2,N_BOIL=3,N_BUNDLE=2,N_SHAKE=2,N_LADLE=3,N_TOSS=3,N_SQUEEZE=3,N_CUKE=3;
const BIG_R=Math.max(.45,Math.min(.6,num(GC.customerBig,0,50)/100));        // 주문·건네주기 순간 손님 키 = 무대 높이의 50%
const PITCH_GAP=1;                                                           // the pitcher's spout sits a whole spout-to-bottom height above the finger
const SIDES=(GC.sides&&GC.sides.length?GC.sides:[{id:'juice',ko:'주스',en:'juice'},{id:'salad',ko:'샐러드',en:'salad'}]);
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
  fruit:{ok:['strawberry','grape'],free:true,ask:['딸기랑 포도 중에 무엇을 줄까? 하나 골라 봐!','Strawberries or grapes? Pick one!']},
  bun:{ok:['bun'],ko:'빵',en:'bun'},noodle:{ok:['noodle'],ko:'스파게티',en:'spaghetti'},
  sauce:{ok:['ketchup','mustard','mayo'],free:true,ask:['어떤 소스를 뿌릴까? 하나 골라 봐!','Which sauce? Pick one!']},
  psauce:{ok:['tsauce','csauce'],free:true,ask:['토마토 소스? 크림 소스? 하나 골라 봐!','Tomato sauce or cream sauce? Pick one!']},
  chicken:{ok:['chicken'],svg:()=>drumSVG(0,0),ko:'닭고기',en:'chicken'}
};
const cardPic=k=>k==='bun'?`<svg viewBox="-100 -75 200 130" style="overflow:visible">${bunWholeG(0)}</svg>`:k==='noodle'?bundleSVG:SAUCE[k]?bottleUpSVG(k):PSAUCE[k]?sauceBowlSVG(k):k==='bread'?breadSVG(0):k==='egg'?eggWhole(false):k==='chicken'?drumSVG(0,0):FRUIT[k]?fruitSVG(k):wholeOf(k);
const cardName=k=>k==='bun'?['빵','bun']:k==='noodle'?['스파게티','spaghetti']:SAUCE[k]?[SAUCE[k].ko,SAUCE[k].en]:PSAUCE[k]?[PSAUCE[k].ko,PSAUCE[k].en]:k==='bread'?['빵','bread']:k==='egg'?['달걀','egg']:k==='chicken'?['닭고기','chicken']:FRUIT[k]?[FRUIT[k].ko,FRUIT[k].en]:[(A.TOPPING&&A.TOPPING[k]||{}).ko||k,(A.TOPPING&&A.TOPPING[k]||{}).en||k];
const STEP_ICON={'pick:bread':()=>breadSVG(0),toastIn:()=>toasterSVG({n:1,heat:0}),toastPop:()=>breadSVG(1),'pick:egg':()=>eggWhole(false),crack:()=>eggWhole(true),fry:()=>turnerSVG,flip:()=>eggFlatSVG(null,true,false),
  'pick:fruit':()=>fruitSVG('strawberry'),wash:()=>pitcherSVG,plateFruit:()=>plateSVG({toast:0,egg:false,fruit:['strawberry','grape','strawberry']}),
  'pick:chicken':()=>drumSVG(0,0),coat:()=>drumSVG(1,0),drop:()=>potSVG({pieces:[0]}),fry2:()=>tongsSVG,lift:()=>basketSVG(2),
  'pick:bun':()=>cardPic('bun'),slice:()=>knifeHSVG,patty:()=>pdishSVG('patty'),press:()=>turnerSVG,flipP:()=>`<svg viewBox="-80 -50 160 110">${pattyTop(0,0,{flip:true})}</svg>`,melt:()=>pdishSVG('cheese'),
  wash2:()=>pitcherSVG,tear:()=>leafSVG(1,null),cut:()=>A.wholeSVG?A.wholeSVG('tomato',0):'',stack:()=>burgerSVG({heel:1,patty:1,cheese:1,lettuce:1}),'pick:sauce':()=>bottleUpSVG('ketchup'),drizzle:()=>bottleSVG('ketchup'),lid:()=>stackPic('crown'),
  'pick:noodle':()=>bundleSVG,boil:()=>stoveSVG({heat:3,inPot:0},false),noodles:()=>stoveSVG({heat:3,inPot:2,soft:0},false),stir:()=>spoonSVG,drain:()=>colanderSVG({full:true}),'pick:psauce':()=>sauceBowlSVG('tsauce'),
  sauceP:()=>ladleSVG(PSAUCE.tsauce.c),toss:()=>ppanSVG({sauce:3,inPan:true,toss:N_TOSS,sauceK:'tsauce'}),twirl:()=>forkSVG,sprinkle:()=>shakerSVG,juice:()=>juicerSVG({k:0,jug:.4},false),pour:()=>glassSVG(GLASS_LINE,true),
  chopS:()=>sboardSVG(1),tossS:()=>serversSVG};
const stepIcon=k=>(STEP_ICON[k]||(()=>ICON.cust))();


/* ============================== 버거(3단계) · 파스타와 곁들임(4단계) 그림 ==============================
   P19 art.volume: 빛은 왼쪽 위, 모양마다 같은 빛·그늘 덧칠(ART.vol.lit), 두 겹 접지 그림자(ART.vol.ground), 흐림 없음.
   고르는 카드·도구·그릇은 차분한 색, 다 된 음식만 또렷한 색(calm.colorPolicy). */
const VOLA=A.vol||null;
const LIT=s=>s+(VOLA&&VOLA.lit?VOLA.lit(s):'');
const GND=(cx,cy,rx,ry)=>VOLA&&VOLA.ground?VOLA.ground(cx,cy,rx,ry):`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry||6}" fill="rgba(91,58,41,.16)"/>`;
const SHN=(cx,cy,rx,ry,rot)=>VOLA&&VOLA.shine?VOLA.shine(cx,cy,rx,ry,rot):`<ellipse cx="${cx}" cy="${cy}" rx="${(rx*.8).toFixed(1)}" ry="${(ry*.8).toFixed(1)}" fill="#fff" opacity=".35"${rot?` transform="rotate(${rot} ${cx} ${cy})"`:''}/>`;
const RIM=(cx,cy,rx,ry,rot,w)=>VOLA&&VOLA.rim?VOLA.rim(cx,cy,rx,ry,rot,w):'';
const FC={bun:'#EDA54C',bunD:'#C97B30',crumb:'#FCE7B8',seed:'#FFF6DE',raw:'#EC958C',meat:'#7C4325',meatL:'#9A552E',cheese:'#FFC233',cheeseE:'#E3940F',leaf:'#78C35C',leafD:'#4C9439',leafL:'#B5E09B',tom:'#E5402E',tomL:'#F77B62',seedT:'#FFE7A6',noodle:'#F7D98A',noodleE:'#CF9A43',basil:'#4CA243',orange:'#FFA137',cuke:'#5BAA4A',cukeL:'#D3EDB5'};
const SAUCE={ketchup:{c:'#D9392A',e:'#A5251A',ko:'케첩',en:'ketchup'},mustard:{c:'#F3C22C',e:'#C69416',ko:'머스터드',en:'mustard'},mayo:{c:'#FFF5D8',e:'#DCC795',ko:'마요네즈',en:'mayo'}};
const PSAUCE={tsauce:{c:'#D8432C',e:'#A52E1C',n:'#E86A3E',ne:'#B4441F',ko:'토마토 소스',en:'tomato sauce'},csauce:{c:'#F8EDD2',e:'#DCC798',n:'#F8E3AE',ne:'#C99E50',ko:'크림 소스',en:'cream sauce'}};
const f1=n=>(+n).toFixed(1);
let bid=0;

/* ---- bun (side view, local units: centre x = 0) ---- */
const SEEDS=[[-46,-34,-20],[-18,-48,10],[12,-44,-15],[42,-30,25],[-30,-16,15],[0,-26,-5],[28,-12,-25],[-58,-10,30],[56,-12,-30]];
const seedsG=dy=>SEEDS.map(([x,y,r])=>`<ellipse cx="${x}" cy="${y+dy}" rx="4.4" ry="2.5" fill="${FC.seed}" stroke="#D2A96E" stroke-width="1.1" transform="rotate(${r} ${x} ${y+dy})"/>`).join('');
/* whole bun (bottom at y = 44); cut: how far the knife line has gone (0..1) */
function bunWholeG(cut){
  const d='M-88 10Q-92 -60 0 -64Q92 -60 88 10Q86 40 62 44H-62Q-86 40 -88 10Z';
  let s=GND(0,48,84,7)+LIT(`<path d="${d}" fill="${FC.bun}" ${S3}/>`);
  s+=`<path d="M-86 16Q0 26 86 16Q84 38 62 42H-62Q-84 38 -86 16Z" fill="${FC.bunD}" opacity=".4"/>`+seedsG(0)+SHN(-38,-38,26,11,-18);
  if(cut>0){const x=-88+176*Math.min(1,cut);s+=`<path d="M-90 12L${f1(x)} 12" stroke="${OL}" stroke-width="4.5" stroke-linecap="round"/><path d="M-88 16L${f1(x)} 16" stroke="${FC.crumb}" stroke-width="3.5" stroke-linecap="round"/>`}
  return s;
}
/* top half: cut face at y = 0, dome up */
function crownG(){
  const d='M-88 0Q-92 -60 0 -64Q92 -60 88 0Q0 9 -88 0Z';
  return LIT(`<path d="${d}" fill="${FC.bun}" ${S3}/>`)+`<path d="M-86 1Q0 11 86 1Q84 9 70 11H-70Q-84 9 -86 1Z" fill="${FC.crumb}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`+seedsG(-8)+SHN(-38,-40,26,11,-18);
}
/* bottom half: bottom at y = 0, cut face on top */
function heelG(){
  const d='M-86 -26Q0 -18 86 -26Q88 -4 64 0H-64Q-88 -4 -86 -26Z';
  return LIT(`<path d="${d}" fill="${FC.bunD}" ${S3}/>`)+`<path d="M-86 -26Q0 -38 86 -26Q0 -15 -86 -26Z" fill="${FC.crumb}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>`;
}
/* patty, side view: bottom at 0, 24 high */
function pattyG(c){
  const d='M-90 -16Q-94 -2 -76 0H76Q94 -2 90 -16Q88 -24 70 -24H-70Q-88 -24 -90 -16Z';
  let s=LIT(`<path d="${d}" fill="${mix(FC.raw,FC.meat,c)}" ${S3}/>`);
  s+=`<g fill="${mix('#F8B9B0','#5A2D16',c)}">${[[-62,-12],[-36,-7],[-10,-15],[18,-8],[44,-13],[68,-8],[-76,-6],[4,-5]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.8"/>`).join('')}</g>`;
  return s+`<path d="M-78 -20Q0 -26 78 -20" stroke="#fff" stroke-width="3" opacity=".22" fill="none" stroke-linecap="round"/>`;
}
/* cheese slice draped over the patty: top edge at 0, m = how much it has melted (drips get longer) */
function cheeseG(m){
  const d=`M-94 -2Q0 -6 94 -2L96 4Q90 ${f1(6+12*m)} 84 ${f1(8+18*m)}Q78 ${f1(7+3*m)} 62 6L36 6Q28 ${f1(8+18*m)} 20 ${f1(8+22*m)}Q14 ${f1(8+3*m)} 6 6L-30 6Q-38 ${f1(8+11*m)} -46 ${f1(8+16*m)}Q-52 ${f1(8+3*m)} -64 6L-88 6Q-94 ${f1(6+8*m)} -96 4Z`;
  return LIT(`<path d="${d}" fill="${FC.cheese}" stroke="${FC.cheeseE}" stroke-width="2.6" stroke-linejoin="round"/>`)+`<path d="M-72 1Q-30 -2 12 0" stroke="#FFE8A4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}
/* lettuce ruffle, side view: bottom at 0 */
function lettuceG(){
  let d='M-102 -6';for(let x=-102;x<102;x+=17)d+=`Q${x+8.5} -19 ${x+17} -7`;d+='L102 3';for(let x=102;x>-102;x-=17)d+=`Q${x-8.5} 11 ${x-17} 3`;d+='Z';
  return LIT(`<path d="${d}" fill="${FC.leaf}" ${S2}/>`)+`<path d="M-90 -4Q-40 -9 0 -5Q40 -9 90 -4" stroke="${FC.leafL}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}
/* tomato slices, side view: bottom at 0 */
function tomatoG(n){
  const xs=n>=3?[-56,0,56]:n===2?[-40,40]:[0];
  return xs.map(x=>LIT(`<ellipse cx="${x}" cy="-6" rx="${n>=3?40:48}" ry="8" fill="${FC.tom}" ${S3}/>`)+`<ellipse cx="${x}" cy="-7" rx="${n>=3?30:37}" ry="4" fill="${FC.tomL}"/>${[-18,0,18].map(o=>`<ellipse cx="${x+o}" cy="-7" rx="3" ry="1.6" fill="${FC.seedT}"/>`).join('')}`).join('');
}
/* sauce zig-zag drawn on top of the last layer: pts in burger units (x, y relative to that layer's top) */
function sauceLine(sc,pts){
  if(!pts||pts.length<2)return'';const c=SAUCE[sc]||SAUCE.ketchup,d='M'+pts.map(p=>f1(p[0])+' '+f1(p[1])).join('L');
  return `<path d="${d}" fill="none" stroke="${c.e}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c.c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".45" stroke-linecap="round" transform="translate(-1 -1.5)"/>`;
}
/* the burger in layers, bottom at y = 0 (fixed order: heel, patty+cheese, lettuce, tomato, sauce, crown) */
const BH={heel:30,patty:24,lettuce:14,tomato:12,crown:58};
function burgerG(L){
  let y=0,s='';const T=(dy,g)=>`<g transform="translate(0 ${f1(dy)})">${g}</g>`;
  if(L.heel){s+=T(y,heelG());y-=BH.heel}
  if(L.patty){s+=T(y+2,pattyG(1));y-=BH.patty;if(L.cheese!=null)s+=T(y+3,cheeseG(L.cheese))}
  if(L.lettuce){s+=T(y+5,lettuceG());y-=BH.lettuce}
  if(L.tomato){s+=T(y+4,tomatoG(L.tomN||2));y-=BH.tomato}
  if(L.sauce&&L.sauce.pts&&L.sauce.pts.length>1)s+=T(y+2,sauceLine(L.sauce.k,L.sauce.pts));
  if(L.drips&&L.sauce)s+=T(y+3,[-70,10,62].map((x,i)=>{const c=(SAUCE[L.sauce.k]||SAUCE.ketchup);return `<path d="M${x-6} 0Q${x} ${10+i*3} ${x+6} 0Z" fill="${c.c}" stroke="${c.e}" stroke-width="1.6"/>`}).join(''));
  if(L.crown){s+=T(y+7,crownG());y-=BH.crown}
  return{s,top:y};
}
const BURGER_FULL=sk=>({heel:1,patty:1,cheese:1,lettuce:1,tomato:1,tomN:2,crown:1,sauce:sk?{k:sk,pts:[[-70,-2],[-50,2],[-30,-3],[-10,2],[10,-3],[30,2],[50,-3],[70,1]]}:null});
function burgerSVG(L,o={}){const b=burgerG(L);return `<svg viewBox="-110 -${o.h||150} 220 ${(o.h||150)+30}" style="overflow:visible">${GND(0,8,96,7)}<g transform="translate(0 0)">${b.s}</g></svg>`}

/* ---- patty top view on the grill (3/4 view) ---- */
function cheeseTop(cx,cy,m){
  const L=[cx-68,cy+5+9*m],T=[cx,cy-30+5*m],R=[cx+68,cy+5+9*m],B=[cx,cy+34+16*m];
  const q=(a,b)=>{const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;return f1(mx+(cx-mx)*.1*m)+' '+f1(my+(cy-my)*.1*m+7*m)};
  const p=a=>f1(a[0])+' '+f1(a[1]);
  let s=LIT(`<path d="M${p(L)}Q${q(L,T)} ${p(T)}Q${q(T,R)} ${p(R)}Q${q(R,B)} ${p(B)}Q${q(B,L)} ${p(L)}Z" fill="${FC.cheese}" stroke="${FC.cheeseE}" stroke-width="2.6" stroke-linejoin="round"/>`);
  if(m>.3)s+=[L,R,B].map((a,i)=>{const h=(10+i*4)*m;return `<path d="M${f1(a[0]-7)} ${f1(a[1]-2)}Q${f1(a[0])} ${f1(a[1]+h)} ${f1(a[0]+7)} ${f1(a[1]-2)}Z" fill="${FC.cheese}" stroke="${FC.cheeseE}" stroke-width="2"/>`}).join('');
  return s+`<path d="M${f1(cx-34)} ${f1(cy-6+4*m)}Q${cx} ${f1(cy-20+5*m)} ${f1(cx+20)} ${f1(cy-14+5*m)}" stroke="#FFE8A4" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
}
const PATTY_CELLS=(()=>{const a=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)a.push([-40+c*40,-18+r*18]);return a})();
function pattyTop(cx,cy,p){
  const rx=64,ry=34,h=14,cooked=!!p.flip,top=cooked?FC.meat:FC.raw,side=cooked?'#5E3119':mix(FC.raw,FC.meat,.3+.5*(p.under||0));
  let s=`<path d="M${cx-rx} ${cy}V${cy+h}A${rx} ${ry} 0 0 0 ${cx+rx} ${cy+h}V${cy}Z" fill="${side}" ${S3}/>`;
  s+=LIT(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${top}" ${S3}/>`);
  const c='rsp'+(++bid);s+=`<defs><clipPath id="${c}"><ellipse cx="${cx}" cy="${cy}" rx="${rx-2}" ry="${ry-2}"/></clipPath></defs><g clip-path="url(#${c})">`;
  if(!cooked&&p.cells)s+=PATTY_CELLS.map((q,i)=>p.cells[i]>.02?`<circle cx="${cx+q[0]}" cy="${cy+q[1]}" r="25" fill="${FC.meatL}" opacity="${Math.min(1,p.cells[i]*.95).toFixed(2)}"/>`:'').join('');
  if(cooked)s+=[-42,-14,14,42].map(o=>`<path d="M${cx+o-22} ${cy+30}L${cx+o+22} ${cy-30}" stroke="#40200F" stroke-width="7" stroke-linecap="round" opacity=".7"/>`).join('');
  s+=`<g fill="${cooked?'#5A2D16':'#F8BDB4'}">${[[-36,-10],[-12,8],[16,-14],[40,6],[-6,-20],[28,18],[-44,12]].map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="2.6"/>`).join('')}</g></g>`;
  s+=`<ellipse cx="${cx-24}" cy="${cy-16}" rx="20" ry="7" fill="#fff" opacity="${cooked?.18:.3}" transform="rotate(-12 ${cx-24} ${cy-16})"/>`;
  if(p.cheese!=null)s+=cheeseTop(cx,cy-4,p.cheese);
  return s;
}
/* griddle (viewBox 0 0 300 210), patty in the middle (150, 98) */
const GRILL_C=[150,98];
function grillSVG(p){
  let s=GND(150,200,132,8)+`<rect x="34" y="168" width="22" height="26" rx="7" fill="#8E96A6" ${S2}/><rect x="244" y="168" width="22" height="26" rx="7" fill="#8E96A6" ${S2}/>`;
  s+=LIT(`<rect x="8" y="56" width="284" height="124" rx="30" fill="#7A8293" ${S3}/>`)+`<circle cx="124" cy="166" r="7" fill="#F6E9D8" ${S2}/><circle cx="176" cy="166" r="7" fill="#F6E9D8" ${S2}/>`;
  s+=`<rect x="22" y="38" width="256" height="114" rx="24" fill="#4A4F5B" ${S3}/>`;
  for(let y=54;y<146;y+=15)s+=`<path d="M40 ${y}H260" stroke="#5E6472" stroke-width="5" stroke-linecap="round"/>`;
  s+=`<ellipse class="rs-glow" cx="150" cy="102" rx="98" ry="42" fill="#FF9A3C" opacity="${p.on?.2:.08}"/><path d="M40 48Q90 40 150 42" stroke="#fff" stroke-width="5" opacity=".14" fill="none" stroke-linecap="round"/>`;
  if(p.on)s+=pattyTop(GRILL_C[0],GRILL_C[1],p);
  return `<svg viewBox="0 0 300 210" style="overflow:visible">${s}</svg>`;
}
/* small dish (viewBox 0 0 200 130) with a raw patty, a cheese slice or two spaghetti bundles */
function pdishSVG(what,n){
  let s=svgInner(smallDishSVG);
  if(what==='patty')s+=`<g transform="translate(100 58) scale(.92)">${pattyTop(0,0,{flip:false})}</g>`;
  if(what==='cheese')s+=`<g transform="translate(100 66) scale(.8)">${cheeseTop(0,0,0)}</g>`;
  if(what==='noodle')for(let i=0;i<n;i++)s+=`<g transform="translate(${n>1?72+i*56:100} 64) rotate(${i?18:-18}) scale(.5)">${bundleG()}</g>`;
  return `<svg viewBox="0 0 200 130" style="overflow:visible">${s}</svg>`;
}
/* ---- lettuce leaf (top view, centred) torn into 3 pieces; dirt per cell for washing ---- */
const LEAF_D='M-88 10Q-98 -32 -62 -50Q-40 -68 -10 -58Q14 -72 42 -58Q74 -62 86 -32Q102 -6 86 18Q92 46 60 54Q30 68 0 56Q-30 68 -60 52Q-94 42 -88 10Z';
const LEAF_V=`<path d="M-74 4Q0 -8 80 -4" stroke="${FC.leafD}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-40 0L-56 -30M-40 0L-50 30M0 -4L-10 -40M0 -4L-6 36M40 -4L36 -40M40 -4L44 34" stroke="${FC.leafD}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
const TEAR=['M-30 -90L-24 -48L-36 -16L-22 14L-34 46L-28 90','M28 -90L36 -50L22 -18L38 14L24 46L32 90'];
const LEAF_DIRT=[[-58,-14],[-50,22],[-14,-30],[-4,24],[34,-24],[50,20]];
function leafG(torn,dirt){
  const body=LIT(`<path d="${LEAF_D}" fill="${FC.leaf}" ${S3}/>`)+`<path d="M-70 -30Q-40 -56 0 -48" stroke="${FC.leafL}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`+LEAF_V+
    (dirt?`<g fill="#A0815A">${LEAF_DIRT.map((q,i)=>{const d=1-(dirt[i]||0);return d>.02?`<g opacity="${d.toFixed(2)}"><circle cx="${q[0]}" cy="${q[1]}" r="5"/><circle cx="${q[0]+9}" cy="${q[1]+5}" r="3.4"/><circle cx="${q[0]-7}" cy="${q[1]+7}" r="2.6"/></g>`:`<path d="M${q[0]} ${q[1]-12}l3 -7l3 7l7 3l-7 3l-3 7l-3 -7l-7 -3z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.4"/>`}).join('')}</g>`:'');
  if(!torn)return body;
  const T0=TEAR[0].slice(1),T1r=TEAR[1].slice(1).split('L').reverse().join('L');
  const pc=['M-130 -90L'+T0+'L-130 90Z','M'+T0+'L'+T1r+'Z','M130 -90L'+TEAR[1].slice(1)+'L130 90Z'],edges=[[0],[0,1],[1]];
  const off=[torn>=1?[-18,-4,-7]:[0,0,0],[0,4,0],torn>=2?[18,-2,7]:[0,0,0]],lc='rslf'+(++bid);
  return `<defs><clipPath id="${lc}"><path d="${LEAF_D}"/></clipPath></defs>`+pc.map((d,i)=>{const c='rsl'+(++bid),o=off[i];
    const ed=edges[i].filter(e=>torn>e).map(e=>`<path d="${TEAR[e]}" stroke="${FC.leafL}" stroke-width="6" fill="none"/><path d="${TEAR[e]}" stroke="${OL}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>`).join('');
    return `<defs><clipPath id="${c}"><path d="${d}"/></clipPath></defs><g transform="translate(${o[0]} ${o[1]}) rotate(${o[2]})"><g clip-path="url(#${c})">${body}${ed?`<g clip-path="url(#${lc})">${ed}</g>`:''}</g></g>`}).join('');
}
const leafSVG=(torn,dirt)=>`<svg viewBox="-110 -80 220 160" style="overflow:visible">${leafG(torn,dirt)}</svg>`;
/* bowl of water with the leaf to wash (viewBox 0 0 260 170) */
const LB_C=[130,74],LB_K=.86;
function lbowlSVG(dirt){
  let s=`<ellipse cx="132" cy="160" rx="110" ry="10" fill="rgba(90,50,20,.14)"/><path d="M10 60Q14 156 130 158Q246 156 250 60Z" fill="#DCEEF8" fill-opacity=".85" ${S3}/><ellipse cx="130" cy="60" rx="120" ry="30" fill="#BFE0F2" ${S3}/><ellipse class="rs-rip" cx="130" cy="62" rx="96" ry="20" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>`;
  s+=`<g transform="translate(${LB_C[0]} ${LB_C[1]}) scale(${LB_K})">${leafG(0,dirt)}</g>`;
  s+=`<path d="M18 74Q130 108 242 74Q238 150 130 152Q22 150 18 74Z" fill="#8FC3E6" opacity=".3"/><path d="M34 96Q50 136 104 146" stroke="#fff" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 260 170" style="overflow:visible">${s}</svg>`;
}
/* tomato slice, top view (cross section) */
const tomSliceG=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><circle r="30" fill="${FC.tom}" ${S3}/><circle r="23" fill="${FC.tomL}"/>${[0,120,240].map(a=>`<path d="M0 0L${f1(19*Math.cos((a-40)*Math.PI/180))} ${f1(19*Math.sin((a-40)*Math.PI/180))}A19 19 0 0 1 ${f1(19*Math.cos((a+40)*Math.PI/180))} ${f1(19*Math.sin((a+40)*Math.PI/180))}Z" fill="#E9503C" opacity=".55"/>`).join('')}${[30,90,150,210,270,330].map(a=>`<ellipse cx="${f1(12*Math.cos(a*Math.PI/180))}" cy="${f1(12*Math.sin(a*Math.PI/180))}" rx="2.6" ry="1.6" fill="${FC.seedT}" transform="rotate(${a} ${f1(12*Math.cos(a*Math.PI/180))} ${f1(12*Math.sin(a*Math.PI/180))})"/>`).join('')}<circle r="4" fill="#FBD0C2"/><ellipse cx="-12" cy="-14" rx="7" ry="3.4" fill="#fff" opacity=".4" transform="rotate(-30 -12 -14)"/></g>`;
/* whole tomato that gets shorter with every slice (k of n cut) */
function tomatoWholeG(k,n){
  const c='rst'+(++bid),w=96*(1-k/n),inner=svgInner(A.wholeSVG?A.wholeSVG('tomato',0):'');
  return `<defs><clipPath id="${c}"><rect x="-60" y="-70" width="${f1(12+w)}" height="140"/></clipPath></defs><g clip-path="url(#${c})">${inner}</g>${k?`<ellipse cx="${f1(-48+w)}" cy="6" rx="${f1(Math.min(14,4+w*.4))}" ry="42" fill="${FC.tomL}" stroke="${OL}" stroke-width="3"/><ellipse cx="${f1(-48+w)}" cy="6" rx="${f1(Math.min(7,2+w*.2))}" ry="24" fill="#E9503C" opacity=".5"/>`:''}`;
}
/* cutting board (viewBox 0 0 300 190): the bun, its halves, the leaf or the tomato and its slices */
const BB_C=[150,104];
function bboardSVG(bg){
  let s=GND(152,182,138,8)+LIT(`<rect x="8" y="30" width="284" height="148" rx="30" fill="#E7C99C" ${S3}/>`)+`<rect x="22" y="44" width="256" height="120" rx="20" fill="none" stroke="#F2DFBD" stroke-width="5"/><circle cx="268" cy="56" r="7" fill="#D4B080" stroke="${OL}" stroke-width="2"/>`;
  const b=bg.board;
  if(b==='bun')s+=`<g transform="translate(150 98)">${bunWholeG(bg.cut)}</g>`;
  else if(b==='split')s+=`<g transform="translate(150 140)">${heelG()}</g>`;
  else if(b==='halves')s+=`<g transform="translate(84 136) scale(.62)">${heelG()}</g><g transform="translate(216 126) scale(.62)">${crownG()}</g>`;
  else if(b==='lettuce')s+=`<g transform="translate(150 102) scale(.92)">${leafG(bg.torn,null)}</g>`;
  else if(b==='tomato'){s+=`<g transform="translate(96 100) scale(1.05)">${tomatoWholeG(bg.tcut,N_TOMATO)}</g>`;for(let i=0;i<bg.tcut;i++)s+=tomSliceG(196+(i%2)*50,82+Math.floor(i/2)*44+(i%2)*14,.8)}
  return `<svg viewBox="0 0 300 190" style="overflow:visible">${s}</svg>`;
}
/* the little plate of things that are ready (viewBox 0 0 200 120): what has been prepared waits here until the stacking */
function readySVG(list){
  let s=`<ellipse cx="102" cy="112" rx="92" ry="8" fill="rgba(90,50,20,.12)"/><ellipse cx="100" cy="66" rx="94" ry="46" fill="#FFFDF9" ${S3}/><ellipse cx="100" cy="66" rx="72" ry="32" fill="none" stroke="#EADFD0" stroke-width="3"/>`;
  const at=[[54,58],[146,58],[60,84],[140,86]];
  list.forEach((k,i)=>{const [x,y]=at[i]||at[3];
    if(k==='halves')s+=`<g transform="translate(${x} ${y+10}) scale(.32)">${heelG()}</g><g transform="translate(${x} ${y-4}) scale(.3)">${crownG()}</g>`;
    if(k==='patty')s+=`<g transform="translate(${x} ${y+8}) scale(.36)">${pattyG(1)}${`<g transform="translate(0 -21)">${cheeseG(1)}</g>`}</g>`;
    if(k==='lettuce')s+=`<g transform="translate(${x} ${y}) scale(.3)">${leafG(2,null)}</g>`;
    if(k==='tomato')s+=tomSliceG(x-12,y,.42)+tomSliceG(x+12,y+4,.42)});
  return `<svg viewBox="0 0 200 120" style="overflow:visible">${s}</svg>`;
}
/* stacking pieces (viewBox -100 -100 200 200) */
const STACK=['heel','patty','lettuce','tomato','crown'];
const STACK_NAME={heel:['아래 빵','bottom bun'],patty:['고기','patty'],lettuce:['상추','lettuce'],tomato:['토마토','tomato'],crown:['뚜껑 빵','top bun']};
function stackPic(k){
  let g='';
  if(k==='heel')g=`<g transform="translate(0 26) scale(1.1 1.3)">${heelG()}</g>`;
  if(k==='patty')g=`<g transform="translate(0 30) scale(1.1 1.4)">${pattyG(1)}<g transform="translate(0 -21)">${cheeseG(1)}</g></g>`;
  if(k==='lettuce')g=`<g transform="scale(.82)">${leafG(2,null)}</g>`;
  if(k==='tomato')g=tomSliceG(-36,0,1.05)+tomSliceG(36,6,1.05);
  if(k==='crown')g=`<g transform="translate(0 34) scale(1.1)">${crownG()}</g>`;
  return `<svg viewBox="-100 -100 200 200" style="overflow:visible">${GND(0,k==='lettuce'||k==='tomato'?52:40,80,6)}${g}</svg>`;
}
/* the plate the burger is built on (viewBox 0 0 260 260): burger bottom at (130, 220) */
const BP_C=[130,220];
function bplateSVG(L,press){
  const b=burgerG(L);
  return `<svg viewBox="0 0 260 260" style="overflow:visible">${GND(130,238,120,9)}${LIT(`<ellipse cx="130" cy="226" rx="120" ry="25" fill="#FFFDF9" ${S3}/>`)}<ellipse cx="130" cy="224" rx="94" ry="15" fill="none" stroke="#EADFD0" stroke-width="3"/><g transform="translate(${BP_C[0]} ${BP_C[1]})"><g class="bgp${press?' press':''}">${b.s}</g></g></svg>`;
}

/* ---- pasta ---- */
function bundleG(){
  let s='';for(let i=0;i<9;i++){const x=-16+i*4;s+=`<path d="M${x} -84L${x+3} 84" stroke="${FC.noodleE}" stroke-width="5.6" stroke-linecap="round"/>`}
  for(let i=0;i<9;i++){const x=-16+i*4;s+=`<path d="M${x} -84L${x+3} 84" stroke="${FC.noodle}" stroke-width="3" stroke-linecap="round"/>`}
  return s+LIT(`<rect x="-24" y="-12" width="50" height="24" rx="8" fill="#A9CFA0" ${S2}/>`)+`<path d="M-18 -4H20" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
}
const bundleSVG=`<svg viewBox="-60 -100 120 200" style="overflow:visible"><g transform="rotate(20)">${bundleG()}</g></svg>`;
/* pot on the stove (viewBox 0 0 280 240): water at (140, 88); heat 0..3 (bubbles), noodles in, soft 0..1, swirl phase */
const POT_W=[140,88,92,20];
function stoveSVG(ps,potOnly){
  let s='';
  if(!potOnly){
    s+=GND(140,234,126,7)+LIT(`<rect x="16" y="198" width="248" height="32" rx="12" fill="#DCE3EA" ${S3}/>`);
    s+=`<g transform="rotate(${ps.heat*50} 44 214)"><circle cx="44" cy="214" r="11" fill="#FFFDF9" ${S2}/><path d="M44 214V205" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/></g><circle cx="236" cy="214" r="6" fill="${ps.heat?'#FF9A3C':'#C9D1DA'}" stroke="${OL}" stroke-width="2"/>`;
    if(ps.heat>0)for(let i=0;i<5;i++){const x=92+i*24,h=10+ps.heat*6;s+=`<g class="rs-flame" style="animation-delay:${i*.13}s"><path d="M${x-8} 199Q${x-9} ${199-h*.6} ${x} ${199-h}Q${x+9} ${199-h*.6} ${x+8} 199Z" fill="#FFA24A" stroke="#E87A2A" stroke-width="1.5"/><path d="M${x-4} 199Q${x-4} ${199-h*.4} ${x} ${199-h*.62}Q${x+4} ${199-h*.4} ${x+4} 199Z" fill="#FFE07A"/></g>`}
  }else s+=GND(140,206,104,7);
  s+=`<path d="M38 96Q14 92 14 106Q16 118 38 116" fill="none" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M242 96Q266 92 266 106Q264 118 242 116" fill="none" stroke="${OL}" stroke-width="10" stroke-linecap="round"/>`;
  s+=LIT(`<path d="M40 86V160Q40 184 140 184Q240 184 240 160V86Z" fill="#9CC6D9" ${S3}/>`)+`<path d="M58 118Q60 162 104 174" stroke="#C7E2EE" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s+=`<ellipse cx="140" cy="86" rx="104" ry="28" fill="#6F8796" ${S3}/>`;
  if(!ps.empty){s+=`<ellipse cx="140" cy="${POT_W[1]}" rx="${POT_W[2]}" ry="${POT_W[3]}" fill="${ps.heat>=3?'#D7EEF7':'#CBE8F5'}"/>`;
    const nb=ps.heat*3;for(let i=0;i<nb;i++){const x=72+((i*53)%140),y=82+((i*29)%14),r=3+(i%3);s+=`<circle class="rs-bub" cx="${x}" cy="${y}" r="${r+1}" fill="#fff" fill-opacity=".7" stroke="#7FB3CC" stroke-width="1.6" style="animation-delay:${(i*.17)%1.2}s"/>`}}
  s+=potNoodles(ps);
  return `<svg viewBox="0 0 280 240" style="overflow:visible">${s}</svg>`;
}
const NOOD_A=[-26,-19,-12,-6,0,6,12,19,26];
const strandD=(pts)=>'M'+pts.map(p=>f1(p[0])+' '+f1(p[1])).join('L');
function potNoodles(ps){
  let s='';const sf=ps.soft||0;if(!ps.inPot||ps.empty)return s;
  const c='rsw'+(++bid);
  if(sf<.98){const op=Math.min(1,(1-sf)*1.6);let a='',b='';
    for(let k=0;k<ps.inPot;k++)NOOD_A.forEach((d,i)=>{const x0=140+(k?18:-18)+d*.6,y0=92,ang=(d+(k?8:-8))*Math.PI/180,L=118*(1-sf*.7),tx=x0+Math.sin(ang)*L*(1+sf*.6),ty=y0-Math.cos(ang)*L*(1-sf)+sf*12,
      cx=(x0+tx)/2+Math.sin(ang)*sf*40,cy=(y0+ty)/2-L*.12*(1-sf)+sf*26,dd=`M${f1(x0)} ${y0}Q${f1(cx)} ${f1(cy)} ${f1(tx)} ${f1(ty)}`;a+=`<path d="${dd}"/>`;b+=`<path d="${dd}"/>`});
    s+=`<g opacity="${op.toFixed(2)}" fill="none" stroke-linecap="round"><g stroke="${FC.noodleE}" stroke-width="5.4">${a}</g><g stroke="${FC.noodle}" stroke-width="3">${b}</g></g>`}
  if(sf>.25){const op=Math.min(1,(sf-.25)/.5),ph=(ps.swirl||0)*Math.PI/180;let a='';
    for(let i=0;i<7;i++){const pts=[];for(let x=56;x<=224;x+=8)pts.push([x,POT_W[1]-12+i*4+Math.sin(x*.07+ph*2+i*1.7)*5]);a+=`<path d="${strandD(pts)}"/>`}
    s+=`<defs><clipPath id="${c}"><ellipse cx="${POT_W[0]}" cy="${POT_W[1]}" rx="${POT_W[2]-3}" ry="${POT_W[3]-2}"/></clipPath></defs><g clip-path="url(#${c})" opacity="${op.toFixed(2)}" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${FC.noodleE}" stroke-width="5.6">${a}</g><g stroke="${FC.noodle}" stroke-width="3.2">${a}</g></g>`;
    s+=`<ellipse cx="${POT_W[0]}" cy="${POT_W[1]}" rx="${POT_W[2]*.62}" ry="${POT_W[3]*.5}" fill="none" stroke="#fff" stroke-width="2.4" opacity=".55" stroke-dasharray="26 18" style="transform-box:fill-box;transform-origin:50% 50%;transform:rotate(${(ps.swirl||0)%360}deg)"/>`}
  return s;
}
/* colander (viewBox 0 0 240 170) */
function colanderSVG(c){
  let s=GND(122,162,96,7)+`<ellipse cx="120" cy="152" rx="44" ry="9" fill="#E59E76" ${S2}/>`;
  s+=`<path d="M16 62Q4 56 6 70Q8 80 22 78" fill="none" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M224 62Q236 56 234 70Q232 80 218 78" fill="none" stroke="${OL}" stroke-width="8" stroke-linecap="round"/>`;
  s+=LIT(`<path d="M18 62Q24 148 120 150Q216 148 222 62Z" fill="#F2B48C" ${S3}/>`);
  [[56,92],[88,100],[120,102],[152,100],[184,92],[72,122],[104,128],[136,128],[168,122],[120,140]].forEach(([x,y])=>{s+=`<circle cx="${x}" cy="${y}" r="4.2" fill="#B8714C"/>`});
  s+=`<ellipse cx="120" cy="62" rx="104" ry="24" fill="#F7CBAA" ${S3}/><ellipse cx="120" cy="64" rx="88" ry="16" fill="#D98F69"/>`;
  if(c.full){let a='';for(let i=0;i<7;i++){const pts=[];for(let x=40;x<=200;x+=8)pts.push([x,56-Math.max(0,22-Math.abs(x-120)*.26)+i*3.4+Math.sin(x*.08+i*1.9)*4]);a+=`<path d="${strandD(pts)}"/>`}
    s+=LIT(`<path d="M36 62Q60 30 120 28Q180 30 204 62Q120 76 36 62Z" fill="${FC.noodle}" stroke="${FC.noodleE}" stroke-width="2.4"/>`)+`<g fill="none" stroke-linecap="round"><g stroke="${FC.noodleE}" stroke-width="5">${a}</g><g stroke="${FC.noodle}" stroke-width="2.8">${a}</g></g>`}
  return `<svg viewBox="0 0 240 170" style="overflow:visible">${s}</svg>`;
}
/* curly pasta tangle (top view) around (cx, cy), radius r */
function tangle(cx,cy,r,col,edge,seed){
  let a='';for(let i=0;i<9;i++){const pts=[];for(let t=0;t<=Math.PI*2+.01;t+=.26){const k=.45+.5*Math.abs(Math.sin(t*1.5+i*1.3+seed));pts.push([cx+Math.cos(t*2+i*.7)*r*k,cy+Math.sin(t*2+i*1.1)*r*.72*k])}a+=`<path d="${strandD(pts)}"/>`}
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${edge}" stroke-width="6">${a}</g><g stroke="${col}" stroke-width="3.4">${a}</g></g>`;
}
/* pan for the pasta (viewBox 0 0 300 210): sauce pool, then the noodles mixed with it */
function ppanSVG(ps){
  let s=`<ellipse cx="114" cy="196" rx="96" ry="12" fill="rgba(90,50,20,.16)"/>`;
  s+=`<path d="M196 92L282 56Q296 50 298 64Q300 74 288 80L204 120Z" fill="#9C6A45" ${S3}/><path d="M206 98L276 68" stroke="#C08A60" stroke-width="5" stroke-linecap="round"/><circle cx="286" cy="66" r="4" fill="${OL}"/><rect x="186" y="92" width="26" height="26" rx="8" fill="#8E96A6" ${S3} transform="rotate(-22 199 105)"/>`;
  s+=LIT(`<ellipse cx="108" cy="112" rx="100" ry="86" fill="#585E6C" ${S3}/>`)+`<ellipse cx="108" cy="106" rx="86" ry="72" fill="#7A8091"/><path d="M40 84Q60 50 104 42" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".18"/>`;
  const sc=PSAUCE[ps.sauceK]||PSAUCE.tsauce;
  if(ps.sauce>0){const r=26+ps.sauce*15;s+=`<ellipse cx="108" cy="108" rx="${r}" ry="${f1(r*.84)}" fill="${sc.c}" stroke="${sc.e}" stroke-width="2.6"/><ellipse cx="${108-r*.3}" cy="${f1(108-r*.35)}" rx="${f1(r*.3)}" ry="${f1(r*.12)}" fill="#fff" opacity=".35"/>`;
    for(let i=0;i<ps.sauce*2;i++){const x=88+((i*37)%44),y=98+((i*23)%24);s+=`<circle class="rs-bub" cx="${x}" cy="${y}" r="${3+(i%2)}" fill="none" stroke="#fff" stroke-width="1.8" style="animation-delay:${(i*.3)%1.2}s"/>`}}
  if(ps.inPan){const t=Math.min(1,(ps.toss||0)/N_TOSS);s+=`<g class="rs-tangle">${tangle(108,106,58,mix(FC.noodle,sc.n,t),mix(FC.noodleE,sc.ne,t),1)}</g>`;
    if(t>0)s+=[[84,92],[128,96],[100,124],[136,120],[76,116]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="${f1(6*t+2)}" ry="${f1(4*t+1.5)}" fill="${sc.c}" opacity="${t.toFixed(2)}"/>`).join('')}
  return `<svg viewBox="0 0 300 210" style="overflow:visible">${s}</svg>`;
}
/* the pasta plate (viewBox 0 0 260 180): a twirled nest that grows with nest (0..1), cheese per cell, basil */
const PP_C=[130,90];
const CHEESE_CELLS=[[-30,-16],[0,-26],[30,-14],[-24,10],[6,4],[34,12]];
function nestG(p,col,edge){
  if(p<=0)return'';const T=Math.PI*5.2,end=T*p;let out='';
  [0,2.1,4.2].forEach((off,j)=>{const pts=[];for(let th=0;th<=end;th+=.28){const r=6+62*(th/T),k=1-th/T;pts.push([PP_C[0]+r*Math.cos(th+off)+j*2,PP_C[1]+r*.6*Math.sin(th+off)-k*18])}if(pts.length>1)out+=`<path d="${strandD(pts.reverse())}"/>`});
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${edge}" stroke-width="8.6">${out}</g><g stroke="${col}" stroke-width="5.4">${out}</g><g stroke="#fff" stroke-width="1.4" opacity=".35" transform="translate(-1 -2)">${out}</g></g>`;
}
function pplateSVG(ps){
  const sc=PSAUCE[ps.sauceK]||PSAUCE.tsauce;
  let s=GND(132,168,116,8)+LIT(`<ellipse cx="130" cy="96" rx="118" ry="70" fill="#FFFDF9" ${S3}/>`)+`<ellipse cx="130" cy="96" rx="92" ry="52" fill="none" stroke="#EADFD0" stroke-width="3"/>`;
  s+=nestG(ps.nest||0,sc.n,sc.ne);
  if((ps.nest||0)>=.99)s+=`<path d="M108 80Q112 66 130 66Q150 66 152 80Q140 88 130 86Q116 88 108 80Z" fill="${sc.c}" stroke="${sc.e}" stroke-width="2.4"/><ellipse cx="122" cy="72" rx="7" ry="3" fill="#fff" opacity=".45"/>`;
  if(ps.cheese)s+=CHEESE_CELLS.map((q,i)=>{const v=ps.cheese[i]||0;return v>.05?`<g opacity="${Math.min(1,v).toFixed(2)}" fill="#FFF6D6" stroke="#E7CF8E" stroke-width="1">${[[0,0],[8,4],[-7,5],[3,-6],[-4,-3]].map(([a,b],k)=>`<rect x="${PP_C[0]+q[0]+a-2.5}" y="${PP_C[1]+q[1]+b-1.4}" width="5" height="2.8" rx="1.2" transform="rotate(${k*35} ${PP_C[0]+q[0]+a} ${PP_C[1]+q[1]+b})"/>`).join('')}</g>`:''}).join('');
  if(ps.basil)s+=[[118,64,-30],[142,70,25]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -14Q12 -4 0 14Q-12 -4 0 -14Z" fill="${FC.basil}" ${S2}/><path d="M0 -10V10" stroke="#2F7A2C" stroke-width="1.8"/></g>`).join('');
  return `<svg viewBox="0 0 260 180" style="overflow:visible">${s}</svg>`;
}
const pastaMini=sk=>`<svg viewBox="0 0 260 180">${svgInner(pplateSVG({nest:1,sauceK:sk||'tsauce',basil:true,cheese:[1,1,1,1,1,1]}))}</svg>`;
/* juice: juicer jug (viewBox 0 0 200 220) and glass (viewBox 0 0 120 200) with the line */
function juicerSVG(j,jugOnly){
  const c='rsj'+(++bid),lv=Math.max(0,Math.min(1,j.jug||0));
  let s=GND(100,214,78,7);
  const body='M44 96H156L148 204Q146 212 138 212H62Q54 212 52 204Z';
  s+=`<path d="M156 118Q184 120 182 150Q180 176 154 176" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M156 118Q184 120 182 150Q180 176 154 176" fill="none" stroke="#E6F2F8" stroke-width="4" stroke-linecap="round"/>`;
  s+=`<defs><clipPath id="${c}"><path d="${body}"/></clipPath></defs><path d="${body}" fill="#EAF5FA" fill-opacity=".9" ${S3}/>`;
  if(lv>0)s+=`<g clip-path="url(#${c})"><rect x="40" y="${f1(212-110*lv)}" width="120" height="${f1(110*lv+4)}" fill="${FC.orange}"/><path d="M40 ${f1(212-110*lv)}H160" stroke="#FFD08A" stroke-width="4"/></g>`;
  s+=`<path d="M44 96L30 88Q26 92 32 98L46 104" fill="#EAF5FA" ${S2}/><path d="M60 110Q58 160 66 196" stroke="#fff" stroke-width="6" fill="none" opacity=".7" stroke-linecap="round"/>`;
  if(!jugOnly){
    s+=LIT(`<ellipse cx="100" cy="94" rx="80" ry="17" fill="#FFFDF9" ${S3}/>`)+`<path d="M74 92Q100 34 126 92Z" fill="#F4E6D0" ${S2}/><path d="M88 90L98 46M100 90V42M112 90L102 46" stroke="#D9C3A0" stroke-width="2.4"/>`;
    const left=N_SQUEEZE-(j.k||0);
    if(left>0)s+=`<g class="rs-orange"><path d="M58 92Q58 46 100 44Q142 46 142 92Z" fill="${FC.orange}" ${S3}/><path d="M64 90Q66 54 100 52Q134 54 136 90" fill="none" stroke="#FFD9A0" stroke-width="4"/>${SHN(80,62,14,7,-25)}</g>`;
    for(let i=0;i<Math.max(0,left-1);i++)s+=`<g transform="translate(${170-i*30} 196) scale(.36)"><path d="M-42 0Q-42 -46 0 -48Q42 -46 42 0Z" fill="${FC.orange}" ${S3}/><path d="M-36 -2Q-34 -38 0 -40Q34 -38 36 -2Z" fill="#FFD27A"/></g>`;
  }
  return `<svg viewBox="0 0 200 220" style="overflow:visible">${s}</svg>`;
}
const GLASS_LINE=.78;
function glassSVG(fill,straw){
  const c='rsg'+(++bid),body='M18 34H102L92 186Q90 194 82 194H38Q30 194 28 186Z',top=194-152*fill;
  let s=GND(60,198,48,6)+`<defs><clipPath id="${c}"><path d="${body}"/></clipPath></defs>`;
  if(straw)s+=`<path d="M70 120L88 4L100 6" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 120L88 4L100 6" fill="none" stroke="#FF9EB0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  s+=`<path d="${body}" fill="#EFF8FC" fill-opacity=".85" ${S3}/>`;
  if(fill>0)s+=`<g clip-path="url(#${c})"><rect x="10" y="${f1(top)}" width="100" height="${f1(200-top)}" fill="${FC.orange}"/><path d="M10 ${f1(top)}H110" stroke="#FFD08A" stroke-width="4"/><circle cx="44" cy="${f1(Math.min(184,top+26))}" r="3" fill="#FFD08A"/><circle cx="62" cy="${f1(Math.min(184,top+44))}" r="2.4" fill="#FFD08A"/></g>`;
  const ly=194-152*GLASS_LINE;s+=`<path d="M24 ${f1(ly)}H96" stroke="#B08A5A" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>`;
  s+=`<path d="M30 46Q32 120 40 180" stroke="#fff" stroke-width="6" fill="none" opacity=".7" stroke-linecap="round"/>`;
  if(straw)s+=`<g transform="translate(26 30)"><path d="M-16 0A16 16 0 0 1 16 0Z" fill="${FC.orange}" ${S2}/><path d="M-11 -1A11 11 0 0 1 11 -1" fill="none" stroke="#FFD9A0" stroke-width="3"/></g>`;
  return `<svg viewBox="0 0 120 200" style="overflow:visible">${s}</svg>`;
}
/* salad: cucumber board (viewBox 0 0 300 150) and bowl (viewBox 0 0 240 170) */
function sboardSVG(k){
  let s=GND(152,142,138,7)+LIT(`<rect x="8" y="22" width="284" height="116" rx="28" fill="#E7C99C" ${S3}/>`)+`<rect x="22" y="36" width="256" height="88" rx="18" fill="none" stroke="#F2DFBD" stroke-width="5"/>`;
  const c='rsc'+(++bid),w=180*(1-k/(N_CUKE+1));
  s+=`<defs><clipPath id="${c}"><rect x="20" y="20" width="${f1(36+w)}" height="120"/></clipPath></defs><g clip-path="url(#${c})">${LIT(`<path d="M44 80Q44 56 66 56H226Q250 56 250 80Q250 104 226 104H66Q44 104 44 80Z" fill="${FC.cuke}" ${S3}/>`)}<path d="M70 66H220M76 94H214" stroke="#3E8A33" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`;
  if(k)s+=`<ellipse cx="${f1(56+w)}" cy="80" rx="9" ry="23" fill="${FC.cukeL}" stroke="${OL}" stroke-width="3"/>`;
  return `<svg viewBox="0 0 300 150" style="overflow:visible">${s}</svg>`;
}
const cukeSliceG=(x,y,k)=>`<g transform="translate(${x} ${y}) scale(${k})"><circle r="16" fill="${FC.cuke}" ${S2}/><circle r="12" fill="${FC.cukeL}"/>${[0,72,144,216,288].map(a=>`<ellipse cx="${f1(6*Math.cos(a*Math.PI/180))}" cy="${f1(6*Math.sin(a*Math.PI/180))}" rx="1.8" ry="1.2" fill="#E9F6D6" stroke="#9CC77E" stroke-width=".8"/>`).join('')}</g>`;
function sbowlSVG(sd,jit){
  const j=jit||0,J=(i,a)=>f1(Math.sin(j*1.7+i*2.3)*a);
  let s=GND(122,162,100,7)+`<path d="M14 72Q20 156 120 158Q220 156 226 72Z" fill="#E9B97E" ${S3}/>`;
  [[54,64,-20],[96,48,10],[146,50,-8],[186,64,20],[120,62,0]].forEach(([x,y,r],i)=>{s+=`<g transform="translate(${x} ${f1(y+ +J(i,4))}) rotate(${r+ +J(i+3,8)}) scale(.36)">${LIT(`<path d="${LEAF_D}" fill="${i%2?FC.leafL:FC.leaf}" ${S3}/>`)}${LEAF_V}</g>`});
  [[78,72],[160,70],[118,80]].forEach(([x,y],i)=>{s+=`<g transform="translate(${x} ${f1(y+ +J(i+7,3))})"><circle r="11" fill="${FC.tom}" ${S2}/><ellipse cx="-4" cy="-4" rx="3.6" ry="2" fill="#fff" opacity=".5"/></g>`});
  for(let i=0;i<(sd.cuke||0);i++)s+=cukeSliceG(70+i*44+ +J(i+11,4),60+(i%2)*14,.9);
  if(sd.toss>0)s+=`<g opacity="${Math.min(1,sd.toss).toFixed(2)}" fill="none" stroke="#FFF6DC" stroke-width="3.6" stroke-linecap="round"><path d="M60 62Q80 52 100 64T140 62T180 66"/><path d="M80 78Q100 70 120 80T160 78"/></g>`;
  s+=LIT(`<path d="M14 72Q20 156 120 158Q220 156 226 72Q120 92 14 72Z" fill="#E9B97E" ${S3}/>`)+`<path d="M34 98Q50 138 100 148" stroke="#F6D7A8" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 240 170" style="overflow:visible">${s}</svg>`;
}
const saladMini=`<svg viewBox="0 0 240 170">${svgInner(sbowlSVG({cuke:3,toss:1}))}</svg>`;
const juiceMini=`<svg viewBox="0 0 120 200">${svgInner(glassSVG(GLASS_LINE,true))}</svg>`;
/* ---- tools ---- */
const knifeHSVG=`<svg viewBox="0 0 200 80"><path d="M8 48Q10 22 40 20H130V52H22Q8 52 8 48Z" fill="#E6EAF0" ${S3}/><path d="M26 30H120" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M14 50H128" stroke="#B7BFCB" stroke-width="2.4"/>${LIT(`<rect x="128" y="22" width="66" height="28" rx="13" fill="#7D9BE0" ${S3}/>`)}<circle cx="148" cy="36" r="3" fill="#fff"/><circle cx="174" cy="36" r="3" fill="#fff"/></svg>`;
const spoonSVG=`<svg viewBox="0 0 100 100"><path d="M36 64L90 10" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M36 64L90 10" stroke="#E2B27A" stroke-width="7.4" stroke-linecap="round"/><ellipse cx="24" cy="76" rx="20" ry="14" fill="#E2B27A" ${S3} transform="rotate(-45 24 76)"/><ellipse cx="22" cy="78" rx="11" ry="7" fill="#C98F55" transform="rotate(-45 22 78)"/>${FACE(66,36,.62)}</svg>`;
const forkSVG=`<svg viewBox="0 0 100 100"><path d="M38 62L90 10" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M38 62L90 10" stroke="#E8A0AE" stroke-width="6.6" stroke-linecap="round"/><path d="M40 60L26 74" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M40 60L26 74" stroke="#D6DCE4" stroke-width="10" stroke-linecap="round"/><path d="M26 74L8 82M26 74L12 90M26 74L18 96" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M26 74L8 82M26 74L12 90M26 74L18 96" stroke="#D6DCE4" stroke-width="3" stroke-linecap="round"/>${FACE(70,30,.55)}</svg>`;
const bottleSVG=k=>{const c=SAUCE[k]||SAUCE.ketchup;return `<svg viewBox="0 0 100 100">${LIT(`<rect x="24" y="2" width="52" height="68" rx="18" fill="${c.c}" ${S3}/>`)}<rect x="32" y="28" width="36" height="22" rx="8" fill="#FFFDF9" opacity=".85"/><circle cx="50" cy="39" r="6" fill="${c.c}"/><path d="M36 70H64L60 82H40Z" fill="#FFFDF9" ${S2}/><path d="M44 82L50 98L56 82Z" fill="#FFFDF9" ${S2}/>${FACE(50,16,.5)}</svg>`};
const bottleUpSVG=k=>`<svg viewBox="0 0 100 100"><g transform="rotate(180 50 50)">${svgInner(bottleSVG(k)).replace(/<g class="tf">[\s\S]*?<\/g>/,'')}</g><ellipse cx="50" cy="96" rx="26" ry="4" fill="rgba(90,50,20,.14)"/></svg>`;
const shakerSVG=`<svg viewBox="0 0 100 100">${LIT(`<rect x="26" y="4" width="48" height="62" rx="14" fill="#FFF6DC" ${S3}/>`)}<rect x="26" y="24" width="48" height="20" fill="${PAL.butter||'#F0D58A'}" opacity=".9"/><path d="M28 66H72L68 84Q66 88 60 88H40Q34 88 32 84Z" fill="#C9D1DA" ${S3}/><g fill="${OL}"><circle cx="42" cy="78" r="2"/><circle cx="50" cy="80" r="2"/><circle cx="58" cy="78" r="2"/></g>${FACE(50,34,.5)}</svg>`;
const serversSVG=`<svg viewBox="0 0 100 100"><path d="M30 70L84 8" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M30 70L84 8" stroke="#E2B27A" stroke-width="5" stroke-linecap="round"/><path d="M44 74L94 24" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M44 74L94 24" stroke="#D9A066" stroke-width="5" stroke-linecap="round"/><ellipse cx="22" cy="80" rx="15" ry="10" fill="#E2B27A" ${S3} transform="rotate(-48 22 80)"/><ellipse cx="38" cy="86" rx="15" ry="10" fill="#D9A066" ${S3} transform="rotate(-42 38 86)"/>${FACE(74,30,.5)}</svg>`;
const ladleSVG=c=>`<svg viewBox="0 0 100 100"><path d="M56 56L90 10" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M56 56L90 10" stroke="#C8CDD6" stroke-width="5.6" stroke-linecap="round"/><path d="M14 54Q14 84 38 84Q62 84 62 54Z" fill="#C8CDD6" ${S3}/><ellipse cx="38" cy="55" rx="23" ry="7" fill="${c}" stroke="${OL}" stroke-width="2.4"/></svg>`;
/* a water pitcher in pouring pose: spout at the lower left, water stays level (P17 fix: it floats above the finger) */
const pitcherSVG=(()=>{const T='translate(50 50) rotate(-42) scale(.8) translate(-56 -60)',body='M30 30H80L74 90Q72 96 64 96H40Q32 96 30 90Z';
  return `<svg viewBox="0 0 100 100"><defs><clipPath id="rsPitch"><path d="${body}" transform="${T}"/></clipPath></defs><g transform="${T}"><path d="M80 40Q96 42 94 58Q92 72 76 72" fill="none" ${S3}/><path d="${body}" fill="#E4F1F9" fill-opacity=".92" ${S3}/></g><rect x="0" y="52" width="100" height="60" fill="#8FC3E6" clip-path="url(#rsPitch)"/><g transform="${T}"><path d="${body}" fill="none" ${S3}/><path d="M30 30L12 22Q6 24 10 30L30 42" fill="#E4F1F9" ${S3}/><path d="M38 40Q38 70 42 84" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/></g>${FACE(60,50,.75)}</svg>`})();
const PITCH_SPOUT=[.04,.55];   // where the water leaves the pitcher picture (fraction of its box)

const burgerMini=burgerSVG(BURGER_FULL('ketchup'));
ORDER_PIC.burger=burgerMini;ORDER_PIC.pasta=pastaMini('tsauce');
const SIDE_PIC={juice:juiceMini,salad:saladMini};
/* the order bubble: one picture, or the pasta and its side dish (level 4: two dishes) */
const orderPic=(m,side)=>m==='pasta'&&side?`<svg viewBox="0 0 100 100" style="overflow:visible"><g transform="translate(-4 4) scale(.3)">${svgInner(pastaMini('tsauce'))}</g><g transform="translate(62 38) scale(.3)">${svgInner(SIDE_PIC[side])}</g></svg>`:ORDER_PIC[m];
const orderTwo=(side)=>`<div class="bb2"><i>${pastaMini('tsauce')}</i><i>${SIDE_PIC[side]}</i></div>`;
const sauceBowlSVG=k=>{const c=PSAUCE[k];return `<svg viewBox="0 0 120 110" style="overflow:visible">${GND(60,100,50,5)}${LIT(`<path d="M10 46Q14 94 60 94Q106 94 110 46Z" fill="#FFFDF9" ${S3}/>`)}<ellipse cx="60" cy="46" rx="50" ry="13" fill="${c.c}" stroke="${c.e}" stroke-width="2.4"/><ellipse cx="44" cy="42" rx="12" ry="3.4" fill="#fff" opacity=".45"/>${k==='tsauce'?`<g transform="translate(92 26) scale(.36)">${svgInner(A.wholeSVG?A.wholeSVG('tomato',0):'')}</g>`:`<g transform="translate(94 26)"><path d="M-12 14L-8 -12H8L12 14Z" fill="#FFFDF9" ${S2}/><path d="M-9 -2H9" stroke="#A7CFE8" stroke-width="5"/></g>`}</svg>`};
/* ---- shop front, kitchen wall ---- */
const LOBBY_BG=`<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax slice" style="width:100%;height:100%;display:block"><rect width="100" height="130" fill="#F4EADF"/><rect y="88" width="100" height="42" fill="#E3CDB4"/><path d="M0 88H100" stroke="${OL}" stroke-width=".8"/>
 ${Array.from({length:6},(_,i)=>`<rect x="${i*17+2}" y="96" width="14" height="6" rx="2" fill="#D9BE9E"/>`).join('')}
 <rect x="10" y="20" width="36" height="30" rx="3" fill="#DCEBF0" stroke="${OL}" stroke-width="1"/><path d="M28 20V50M10 35H46" stroke="#C9B49A" stroke-width="1.2"/>
 <rect x="54" y="16" width="38" height="40" rx="4" fill="#6E8A74" stroke="${OL}" stroke-width="1"/><rect x="56" y="18" width="34" height="36" rx="3" fill="#7C9A82"/>
 <g transform="translate(56 20) scale(.075)">${svgInner(breakfastMini)}</g><g transform="translate(74 20) scale(.072)">${svgInner(chickenMini)}</g><g transform="translate(64 38) scale(.068)"><g transform="translate(110 150)">${burgerG(BURGER_FULL('ketchup')).s}</g></g><g transform="translate(74 38) scale(.064)">${svgInner(pastaMini('tsauce'))}</g>
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
@keyframes rsout{to{transform:translateX(175%)}}
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
/* P17 3·4단계: the customer grows big for the order and for being served; the bubble follows; two dishes = two pictures */
.rs-cust,.rs-cfx,div.rs-bub{transition:left .6s ease-in-out,top .6s ease-in-out,width .6s ease-in-out,height .6s ease-in-out}
div.rs-bub.two{border-radius:34px}
div.rs-bub .bb2{display:flex;width:100%;height:100%;gap:4px}
div.rs-bub.big .bb2{flex-direction:column}
div.rs-bub .bb2 i{flex:1;min-width:0;min-height:0;display:block}
div.rs-bub .bb2 svg{width:100%;height:100%;display:block;overflow:visible}
.rsstars{display:flex;flex:none;margin-left:auto}
.rs-it .bgp,.rs-it .rs-orange{transform-box:fill-box;transform-origin:50% 100%}
.rs-it.rs-stk{transition:opacity .35s}
.rs-sawk,.rs-knife{position:absolute;z-index:21;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(91,74,66,.2))}
.rs-knife{transform-origin:20% 80%}
.rs-sawk svg,.rs-knife svg{width:100%;height:100%;display:block;overflow:visible}
.tl-tool.rs-over{opacity:.4}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
/* P16: the screen and its header come from the common shell (ML.Shell.screen): same back picture, size and place on every screen */
const sec=M.Shell.screen(id,{title:'식당',headClass:'rs-head',backClass:'rs-back',stripClass:'rs-strip',stripId:'rsStrip',after:'<div class="rsstars" id="rsStars"></div>',body:`<div class="rs-stage" id="rsStage">
<div class="rs-lobby" id="rsLobby" hidden><div class="rs-lbg">${LOBBY_BG}</div></div><div class="rs-wall" id="rsWall">${WALL}</div><div class="rs-counter" id="rsCounter"></div>
<div class="rs-cust" id="rsCust"></div><div class="rs-cfx" id="rsCfx"></div><div class="rs-bub" id="rsBub" hidden></div><div class="rs-work" id="rsWork"></div><div class="rs-fx" id="rsFx"></div></div><div class="rs-tray" id="rsTray"></div>`}).sec;
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
function planFor(menu,side){
  if(menu==='chicken')return['pick:chicken','coat','drop','fry2','lift','serve'];
  if(menu==='burger')return['pick:bun','slice','patty','press','flipP','melt','wash2','tear','cut','stack','pick:sauce','drizzle','lid','serve'];
  if(menu==='pasta')return['pick:noodle','boil','noodles','stir','drain','pick:psauce','sauceP','toss','twirl','sprinkle',...(side==='salad'?['chopS','tossS']:['juice','pour']),'serve'];
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
const VB={toaster:[220,190],pan:[300,210],plate:[220,140],board:[160,130],bowl:[260,170],dish:[300,170],sdish:[200,130],pot:[260,210],basket:[220,150],
  bboard:[300,190],grill:[300,210],pdish:[200,130],lbowl:[260,170],ready:[200,120],bplate:[260,260],stove:[280,240],ndish:[200,130],colander:[240,170],ppan:[300,210],pplate:[260,180],juicer:[200,220],glass:[120,200],sboard:[300,150],sbowl:[240,170]};
STACK.forEach(k=>VB['st_'+k]=[200,200]);
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
  leafbit:()=>`<svg viewBox="-10 -10 20 20"><path d="M-7 2Q-6 -7 3 -7Q8 -2 5 5Q-2 9 -7 2Z" fill="${FC.leaf}" stroke="${FC.leafD}" stroke-width="1.4"/></svg>`,
  cheese:()=>`<svg viewBox="-6 -4 12 8"><rect x="-5" y="-2.5" width="10" height="5" rx="2" fill="#FFF6D6" stroke="#E2C77E" stroke-width="1"/></svg>`,
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
  if(ph==='enter')return r;
  if(m==='burger'||m==='pasta')return LAY2(W,Hc,ph,m,r);
  const pw=Math.min(W*.4,170),plate=[W-pw/2-6,Hc-pw*.32-6,pw,pw*.64];
  if(m==='toast'){
    if(ph==='serve'){const w=Math.min(W*.64,Hc*.9,250);r.plate=[W-w/2-8,Hc-w*.32-10,w,w*.64];return r}
    r.plate=plate;
    if(ph==='pick:bread'||ph==='toastIn'||ph==='toastPop'||ph==='enter'){const tw=Math.min(W*.58,Hc*.7,300),th=tw*190/220;r.toaster=[tw/2+10,Math.min(Hc-th/2-8,Hc*.58),tw,th];
      if(ph!=='toastPop'&&S.board>0){const bw=Math.max(140,Math.min(W*.38,160));r.board=[W-bw/2-6,Math.max(bw*.42,Hc*.3),bw,bw*130/160]}}
    else if(ph==='pick:egg'||ph==='crack'||ph==='fry'||ph==='flip'){const w=Math.min(W*.82,(Hc-20)*300/210,400),h=w*210/300;r.pan=[w/2+4,Math.max(h/2+Math.min(90,Hc*.2),Hc-pw*.64-h/2+20),w,h];
      if(ph==='pick:egg'||ph==='crack'){const ew=Math.max(110,Math.min(124,w*.34)),[px,py]=[r.pan[0]-w/2+PAN_C[0]/300*w,r.pan[1]-h/2+PAN_C[1]/210*h];r.egg=[px,Math.max(ew*.6,py-h*.42-ew*.3),ew,ew*1.2]}}
    else if(ph==='pick:fruit'||ph==='wash'||ph==='plateFruit'){const w=Math.min(W*.74,Hc*1.2,340),h=w*170/260;r.bowl=[w/2+8,Math.min(Hc*.42+h*.1,Hc-pw*.64-h/2+30),w,h]}
  }else{
    if(ph==='serve'){const w=Math.min(W*.6,Hc*.9,240);r.basket=[W-w/2-8,Hc-w*75/220-10,w,w*150/220];return r}
    if(ph==='pick:chicken'||ph==='coat'||ph==='enter'){const w=Math.min(W*.94,Hc*1.5,420),h=w*170/300;r.dish=[W/2,Hc*.56,w,h];const cs=Math.max(84,Math.min(w*.3,140));
      [[.27,.4],[.5,.32],[.73,.42],[.5,.6]].forEach((p,i)=>{if(S.cp[i]==='dish')r['c'+i]=[W/2-w/2+p[0]*w,Hc*.56-h/2+p[1]*h,cs,cs]})}
    else if(ph==='drop'||ph==='lift'){const dw=Math.max(170,Math.min(W*.44,200)),w=Math.min(ph==='drop'?W-dw-14:W*.6,Hc*.82,300),h=w*210/260;r.pot=[w/2+6,Hc*.56,w,h];
      if(ph==='drop'){const dh=dw*130/200;r.sdish=[W-dw/2-4,Hc*.3,dw,dh];const cs=Math.max(70,dw*.46);[[.3,.36],[.7,.36],[.3,.66],[.7,.66]].forEach((p,i)=>{if(S.cp[i]==='dish')r['c'+i]=[W-dw-4+p[0]*dw,Hc*.3-dh/2+p[1]*dh,cs,cs]})}
      else{const bw=Math.min(W*.42,180);r.basket=[W-bw/2-4,Hc-bw*150/220/2-6,bw,bw*150/220]}}
    else if(ph==='fry2'){const w=Math.min(W*.86,Hc*1.05,380),h=w*210/260;r.pot=[W/2,Hc*.55,w,h]}
  }
  return r;
}
/* burger and pasta stations (counter units; every touch target stays ≥ 110 px) */
function LAY2(W,Hc,ph,m,r){
  const IS=Math.max(112,Math.min(W*.31,124));
  if(m==='burger'){
    const B=S.bg,stk=['stack','pick:sauce','drizzle','lid'].includes(ph);
    if(ph==='serve'){const w=Math.min(W*.62,Hc*.64,240);r.bplate=[W-w/2-6,Hc-w/2-4,w,w];return r}
    if((B.ready.length||B.readyOn)&&!stk){const w=Math.min(W*.36,140);r.ready=[w/2+4,w*.3+6,w,w*.6]}
    if(['pick:bun','slice','tear','cut'].includes(ph)){const w=Math.min(W*.96,(Hc-100)*300/190,400),h=w*190/300;if(B.board||ph==='pick:bun')r.bboard=[W/2,Math.min(Hc-h/2-4,Math.max(100+h/2,Hc*.6)),w,h]}
    else if(['patty','press','flipP','melt'].includes(ph)){const w=Math.min(W*.94,(Hc-112)*300/210,400),h=w*210/300;r.grill=[W/2,Hc-h/2-4,w,h];
      if(B.dish){const dw=Math.min(184,Math.max(174,W*.46)),dh=dw*130/200;r.pdish=[W-dw/2-4,dh/2+4,dw,dh]}}
    else if(ph==='wash2'){const w=Math.min(W*.86,(Hc-100)*260/170,360),h=w*170/260;r.lbowl=[W/2,Math.min(Hc-h/2-6,Hc*.62),w,h]}
    else if(stk){const w=Math.min(W*.64,Hc*.6,240);r.bplate=[W/2,Hc-w/2-2,w,w];
      const spots=[[.17,.15],[.5,.13],[.83,.15],[.15,.45],[.85,.45]];
      STACK.forEach((k,i)=>{if(B.layers.includes(k))return;const sp=spots[B.order[i]];r['st_'+k]=[Math.min(W-IS/2-2,Math.max(IS/2+2,W*sp[0])),Math.max(IS/2+2,Hc*sp[1]+IS*.1),IS,IS]})}
    return r;
  }
  const P=S.ps,side=S.sideId;
  if(ph==='serve'){const w=Math.min(W*.62,240),h=w*180/260;r.pplate=[w/2+10,Hc-h/2-6,w,h];
    if(side==='salad'){const sw=Math.max(162,Math.min(W*.46,176)),sh=sw*170/240;r.sbowl=[W-sw/2-6,Hc-h-sh/2+18,sw,sh]}else{const gw=Math.max(116,Math.min(W*.32,122)),gh=gw*200/120;r.glass=[W-gw/2-14,Hc-h-gh/2+40,gw,gh]}return r}
  if(['pick:noodle','boil','noodles','stir'].includes(ph)){const w=Math.min(W*.88,(Hc-24)*280/240,350),h=w*240/280;r.stove=[W/2,Hc-h/2-4,w,h];
    if(P.ndish>0){const dw=Math.min(184,Math.max(174,W*.46)),dh=dw*130/200;r.ndish=[W-dw/2-4,dh/2+4,dw,dh]}}
  else if(ph==='drain'){const w=Math.min(W*.58,220),h=w*240/280;if(!P.potGone)r.stove=[w/2+6,h/2+6,w,h];const cw=Math.min(W*.7,270),ch=cw*170/240;r.colander=[W-cw/2-6,Hc-ch/2-6,cw,ch]}
  else if(['pick:psauce','sauceP','toss'].includes(ph)){const w=Math.min(W*.94,(Hc-60)*300/210,390),h=w*210/300;r.ppan=[w/2+2,Hc-h/2-4,w,h];
    if(ph==='toss'&&P.inColander&&!P.inPan){const cw=Math.min(W*.46,170),ch=cw*170/240;r.colander=[W-cw/2-4,ch/2+4,cw,ch]}}
  else if(ph==='twirl'||ph==='sprinkle'){const w=Math.min(W*.96,(Hc-70)*260/180,400),h=w*180/260;r.pplate=[W/2,Hc-h/2-4,w,h];
    if(ph==='twirl'){const pw=Math.min(W*.42,160),phh=pw*210/300;r.ppan=[pw/2+4,phh/2+4,pw,phh]}}
  else if(ph==='juice'){const w=Math.min(W*.66,(Hc-20)*200/220,260),h=w*220/200;r.juicer=[W/2,Hc-h/2-6,w,h]}
  else if(ph==='pour'){const w=Math.min(W*.5,190),h=w*220/200;r.juicer=[W-w/2-8,h/2+18,w,h];const gw=Math.min(W*.36,140),gh=gw*200/120;r.glass=[gw/2+30,Hc-gh/2-6,gw,gh]}
  else if(ph==='chopS'){const w=Math.min(W*.9,340),h=w*150/300;r.sboard=[W/2,h/2+6,w,h];const bw=Math.min(W*.74,280),bh=bw*170/240;r.sbowl=[W/2,Hc-bh/2-6,bw,bh]}
  else if(ph==='tossS'){const bw=Math.min(W*.92,(Hc-40)*240/170,380),bh=bw*170/240;r.sbowl=[W/2,Hc-bh/2-6,bw,bh]}
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
  const ch=wallH*1.12,cw=ch*200/230,sm={l:W-W*.02-cw,t:Math.max(0,wallH-ch*.9),w:cw,h:ch},bh=Hh*BIG_R,bw=bh*200/230,bg={l:W*.04,t:Math.max(4,Hh*.06),w:bw,h:bh};
  const big=!!(S&&S.custBig),c=big?bg:sm,box={width:c.w+'px',height:c.h+'px',left:c.l+'px',top:c.t+'px'};Object.assign(custEl.style,box);Object.assign(cfxEl.style,box);
  const two=!!(S&&S.menu==='pasta'&&S.sideId);bubEl.classList.toggle('big',big);bubEl.classList.toggle('two',two);
  if(big){const B=Math.min(130,W*.34),w=B,h=two?B*1.8:B;Object.assign(bubEl.style,{width:w+'px',height:h+'px',left:Math.min(W-6-w,bg.l+bw*.8)+'px',top:Math.max(4,bg.t-6)+'px'})}
  else{const bs=Math.min(72,wallH*.66),w=two?bs*1.85:bs;Object.assign(bubEl.style,{width:w+'px',height:bs+'px',left:(sm.l-6-w)+'px',top:(wallH*.1)+'px'})}
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
  /* burger and pasta: only what is on the counter now is redrawn (motion.performance) */
  const V=n=>E[n]&&!E[n].classList.contains('hide');
  if(S.menu==='burger'){const B=S.bg;
    if(V('bboard'))E.bboard.innerHTML=bboardSVG(B);if(V('grill'))E.grill.innerHTML=grillSVG(B.patty);if(V('pdish'))E.pdish.innerHTML=pdishSVG(B.dish);
    if(V('lbowl'))E.lbowl.innerHTML=lbowlSVG(B.lw);if(V('ready'))E.ready.innerHTML=readySVG(B.ready);if(V('bplate'))E.bplate.innerHTML=bplateSVG(layersOf(),B.pressed)}
  if(S.menu==='pasta'){const P=S.ps,D=S.side;
    if(V('stove'))E.stove.innerHTML=stoveSVG(P,P.view==='drain');if(V('ndish'))E.ndish.innerHTML=pdishSVG('noodle',P.ndish);if(V('colander'))E.colander.innerHTML=colanderSVG({full:P.inColander});
    if(V('ppan'))E.ppan.innerHTML=ppanSVG(phase==='twirl'?Object.assign({},P,{inPan:P.panLeft>.12}):P);if(V('pplate'))E.pplate.innerHTML=pplateSVG(P);
    if(V('juicer'))E.juicer.innerHTML=juicerSVG(D,phase==='pour'||phase==='serve');if(V('glass'))E.glass.innerHTML=glassSVG(D.fill,D.straw);
    if(V('sboard'))E.sboard.innerHTML=sboardSVG(D.cut||0);if(V('sbowl'))E.sbowl.innerHTML=sbowlSVG(D,D.jit)}
}
function drawCust(m){if(!S||!S.kind)return;custEl.innerHTML=A.animal(S.kind,m||'idle',{});if(al&&al.refresh)al.refresh()}
const rubBelly=on=>custEl.classList.toggle('rs-rub',!!on);
/* the customer smells the cooking: two scent lines rise to the nose, the nose twitches (motion.cooking.serve: 냄새를 킁킁) */
let lastSniff=0;
function sniff(talk){const n=performance.now();if(n-lastSniff<2500)return;lastSniff=n;cfxEl.classList.remove('sniff');void cfxEl.offsetWidth;cfxEl.classList.add('sniff');LOG.push('sniff');
  if(talk&&S)say(pick([['킁킁, 맛있는 냄새!','Sniff sniff, smells yummy!'],['음~ 고소해!','Mmm, smells good!']])[0],'');alMood('wow',900)}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-4,c-1)),win=items.slice(from,from+4);   // four pictures: the star row sits at the right of the header
  stripEl.innerHTML=(S&&S.view==='lobby'?`<span class="on">${ICON.cust}</span>`:'')+win.map(o=>`<span class="${S&&S.view==='lobby'?'':o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${S&&S.view!=='lobby'&&o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function finish(between){
  H={};kind='wait';AIM=null;HOT=()=>[];const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');rubBelly(true);
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const k=plan[pi];if(!k)return;phase=k;if(S){S.custBig=k==='serve';work.style.visibility=''}strip();size();draw();G.place();
  (STEP[k]||STEP[k.split(':')[0]])(k.split(':')[1]);
}
/* one tool step through ML.P2.makeTool: the tool follows the finger and leans (motion.toolFeel), only touched cells change; taps work too (motion.tapAlso) */
let toolTarget=null;
/* the tool picture is see-through (60%) while it is over the food (games.restaurant.pitcher) */
function overFood(fn){const te=[...stage.querySelectorAll('.tl-tool')].find(x=>x.style.display==='block');if(!te)return;const t=te.getBoundingClientRect(),f=fn();
  te.classList.toggle('rs-over',!!f&&!(t.right<f.left||t.left>f.right||t.bottom<f.top||t.top>f.bottom))}
function rubTool(o){
  killTool();toolTarget=o.target;
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,rub:Object.assign({tapChunk:.12},o.rub||{}),tilt:true,tapAnim:420,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[4,4],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,onFrame:(F,t,Wp)=>{if(o.over)overFood(o.over);if(o.frame)o.frame(F,t,Wp)},onTap:o.tap,
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
    const ask=p.ask||[`${p.ko}${batchim(p.ko)?'을':'를'} 찾아 봐! 콕!`,`Find the ${p.en}! Tap it!`];
    cardsTray(keys,p.ok,(k,b)=>{
      const g=gen,from=ctr(b);let tn=null,hideIt=true;
      if(what==='bread'){S.board=N_BREAD;tn='board'}
      else if(what==='egg'){tn='egg';hideIt=false}
      else if(what==='fruit'){S.wash={kind:k,cells:Array(N_FRUIT*2).fill(0),gone:Array(N_FRUIT).fill(false)};tn='bowl'}
      else if(what==='chicken'){for(let i=0;i<N_CHICKEN;i++)S.cp[i]='dish';tn='dish'}
      else if(what==='bun'){S.bg.board='bun';S.bg.cut=0;tn='bboard'}
      else if(what==='noodle'){S.ps.ndish=N_BUNDLE;tn='ndish'}
      else if(what==='sauce'){S.bg.sauceK=k;tn='bplate';hideIt=false}
      else if(what==='psauce'){S.ps.sauceK=k;tn='ppan';hideIt=false}
      lay();draw();
      if(what==='egg'){E.egg.innerHTML=eggWhole(false);E.egg.classList.add('hide')}
      const to=E[tn]?ctr(E[tn]):from,hid=[];
      if(hideIt)Object.values(E).forEach(el=>{if(/^(board|bowl|dish|c\d|bboard|ndish)$/.test(el.dataset.n)){el.style.opacity='0';hid.push(el)}});
      fly(cardPic(k),from,to,Math.min(130,b.getBoundingClientRect().width),110,600,()=>{if(g!==gen)return;
        hid.forEach(el=>{el.style.opacity=''});if(what==='egg')E.egg.classList.remove('hide');
        const t=E[tn];if(t)squash(t);sfx.pop();alMood('wow',800);
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
    kind='rub';const stopI=intro(pitcherSVG,'물!','Water!');const fk=S.wash.kind;say(`${FRUIT[fk].ko}${batchim(FRUIT[fk].ko)?'을':'를'} 물로 쓱쓱 씻어요!`,`Wash the ${FRUIT[fk].en}!`,true);
    const cells=[];BOWL_F.forEach(p=>{cells.push([(p[0]-10)/260,(p[1]-6)/170]);cells.push([(p[0]+10)/260,(p[1]+8)/170])});let lastFx=0;
    rubTool({...pitcherOpts(()=>rectOf('bowl')),log:'wash',stopIntro:stopI,cells,grid:[6,3],rad:.11,target:()=>rectOf('bowl'),
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
    AIM=()=>{const i=next();return i<0?ctr(E.pot):ctr(E['c'+i])};HOT=()=>[E.sdish,E.pot];
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
  /* 끝내기: 손님이 크게 다가오고, 음식을 콕 → 손님이 두 손으로 받음(두 가지면 둘 다) → 킁킁 → 한 입 크게 → 볼 볼록 → 냠냠 → 춤 → 하트 */
  serve(){
    kind='tap';const list=serveNames();S.given=[];S.held={};toolTray(E[list[0]]?E[list[0]].innerHTML:'');
    const sd=SIDES.find(x=>x.id===S.sideId)||{ko:'',en:''};
    if(list.length>1)say(`완성! 파스타랑 ${sd.ko}${batchim(sd.ko)?'을':'를'} 콕콕 눌러서 ${S.name}에게 줘요!`,`All done! Tap the pasta and the ${sd.en} to give them to ${S.name}!`,true);
    else say(`완성! 콕 눌러서 ${S.name}에게 줘요!`,`All done! Tap to give it to ${S.name}!`,true);
    const left=()=>list.filter(n=>!S.given.includes(n));
    AIM=()=>{const n=left()[0];return n?ctr(E[n]):ctr(custEl)};HOT=()=>left().map(n=>E[n]);
    H={down:e=>{let n=left().find(n=>hit(e,n,6));if(!n&&inRect(e,custEl.getBoundingClientRect()))n=left()[0];if(!n)return false;if(busy)return;busy=true;G.stop();
      handOver(n,list.indexOf(n)>0,()=>{busy=false;if(!left().length){H={};kind='wait';eat(list)}else guideAt(AIM,'tap','이것도 콕!','This one too!')})}};
    guideAt(AIM,'tap','콕 눌러서 건네줘!','Tap to give!');
  }
};
const serveNames=()=>S.menu==='toast'?['plate']:S.menu==='chicken'?['basket']:S.menu==='burger'?['bplate']:['pplate',S.sideId==='salad'?'sbowl':'glass'];


/* ============================== 버거(3단계) · 파스타와 곁들임(4단계) 과정 ==============================
   모든 재료는 통째로 시작해 아이 손동작으로 준비된 뒤에 올라감(rules.everyIngredientPrepared). 준비된 것은 '준비 접시'에 모였다가 쌓기에서 다 쓰임(madeEqualsUsed).
   끌기·문지르기는 콕으로도 됨(motion.tapAlso). 틀린 순서는 살짝 튀어 돌아오고 응원(실패 없음). */
const layersOf=()=>{const o={};S.bg.layers.forEach(k=>o[k]=1);if(o.patty)o.cheese=1;o.tomN=N_TOMATO;if(S.bg.sauce.pts.length>1)o.sauce={k:S.bg.sauceK,pts:S.bg.sauce.pts};o.drips=S.bg.pressed;return o};
/* something prepared hops onto the little 'ready' plate (it waits there until the stacking) */
function toReady(k,html,from,s0,then){
  const g=gen;S.bg.readyOn=true;lay();draw();const r=rectOf('ready'),to=ctr(E.ready);
  fly(html,from,to,s0,r.width*.5,650,()=>{if(g!==gen)return;S.bg.ready.push(k);S.cnt['ready_'+k]=1;LOG.push('ready:'+k);draw();squash(E.ready);sfx.pop();if(then)then()},{up:60});
}
/* the knife comes down once (motion.cooking.chop + threeBeats): ready (lifts), chop (톡), bounce back */
function chopKnife(cx,cy,then){
  const sz=Math.max(150,toolPx()*.8),kn=document.createElement('div');kn.className='rs-knife';kn.innerHTML=A.TOOL.knife;const [x,y]=stXY(cx,cy);
  Object.assign(kn.style,{width:sz+'px',height:sz+'px',left:(x-sz*.22)+'px',top:Math.max(0,y-sz*.78)+'px'});fxEl.appendChild(kn);
  anim(kn,[{transform:'none'},{transform:'translateY(-14%) rotate(-14deg)',offset:.28},{transform:'translateY(16%) rotate(-3deg)',offset:.46},{transform:'translateY(10%) rotate(-5deg)',offset:.62},{transform:'none'}],{duration:620,easing:'ease-in-out'});
  const g=gen;L.later(()=>{if(g===gen)then()},285);setTimeout(()=>kn.remove(),660);
}
/* toss something up out of a pan or off the grill: the station crouches, the thing spins in the air and lands with a squash */
function tossUp(el,html,c,sz,hgt,o,then){
  const g=gen;
  anim(el,[{transform:'none'},{transform:'translateY(5%) rotate(-3deg)',offset:.2},{transform:'translateY(-7%) rotate(5deg)',offset:.38},{transform:'translateY(2%) rotate(-1deg)',offset:.85},{transform:'none'}],{duration:1150,easing:'ease-in-out'});
  L.later(()=>{if(g!==gen)return;if(o.hide)o.hide();sweepTone(300,900,.25,'triangle',.12);
    const f=document.createElement('div');f.className='rs-float';f.innerHTML=html;const [x,y]=stXY(c[0],c[1]);Object.assign(f.style,{left:(x-sz/2)+'px',top:(y-hgt/2)+'px',width:sz+'px',height:hgt+'px',zIndex:25});fxEl.appendChild(f);
    const up=o.up||Math.min(G0.H*.4,hgt*2.2),rot=o.spin==null?360:o.spin;
    anim(f,[{transform:'translateY(0) rotate(0) scale(1)',easing:'cubic-bezier(.2,.7,.4,1)'},{transform:`translateY(${-up}px) rotate(${rot/2}deg) scale(.9,.6)`,offset:.48,easing:'cubic-bezier(.6,0,.8,.4)'},{transform:`translateY(0) rotate(${rot}deg) scale(1)`,offset:.86},{transform:`translateY(0) rotate(${rot}deg) scale(1.18,.78)`,offset:.92},{transform:`translateY(0) rotate(${rot}deg) scale(1)`}],{duration:900,fill:'forwards'});
    if(o.mid)L.later(()=>{if(g===gen)f.innerHTML=o.mid()},430);
    L.later(()=>{f.remove();if(g===gen)then()},900)},170);
}
const pitcherOpts=over=>({icon:pitcherSVG,anchor:PITCH_SPOUT,gap:PITCH_GAP,effect:'water',over});
const sauceC=()=>PSAUCE[S.ps.sauceK]||PSAUCE.tsauce;
const cnt1=(k,n)=>{S.cnt[k]=(S.cnt[k]||0)+(n||1)};

Object.assign(STEP,{
  /* 칼로 빵을 슥슥(가로로 밀었다 당기기 = 한 번, 콕 = 한 번): 자른 선이 빵을 가로질러 가고, 다 가면 반으로 */
  slice(){
    kind='tap';toolTray(knifeHSVG);say('칼로 빵을 슥슥! 반으로 잘라요!','Saw the bun in half!',true);
    const g=gen;let n=0,drag=null;const kn=document.createElement('div');kn.className='rs-sawk';kn.innerHTML=knifeHSVG;kn.style.display='none';fxEl.appendChild(kn);L.onEnd(()=>kn.remove());
    const cutY=()=>at('bboard',150,110)[1],kw=()=>Math.max(160,rectOf('bboard').width*.6);
    const put=cx=>{const w=kw(),h=w*.4,[x,y]=stXY(cx,cutY());Object.assign(kn.style,{display:'block',width:w+'px',height:h+'px',left:(x-w*.35)+'px',top:(y-h*.62)+'px'})};
    const split=()=>{kn.remove();const from=at('bboard',150,80),bw=rectOf('bboard').width;S.bg.board='split';S.cnt.bunCut=1;draw();sfx.boing();say('반으로 쏙!','Cut in half!');
      fly(`<svg viewBox="-100 -90 200 120" style="overflow:visible">${crownG()}</svg>`,from,at('bboard',216,104),bw*.62,bw*.4,650,()=>{if(g!==gen)return;S.bg.board='halves';draw();squash(E.bboard);sfx.pop();
        L.later(()=>{if(g!==gen)return;const fr=ctr(E.bboard);S.bg.board='';draw();toReady('halves',`<svg viewBox="-100 -90 200 130" style="overflow:visible"><g transform="translate(0 34)">${heelG()}</g><g transform="translate(0 -6)">${crownG()}</g></svg>`,fr,bw*.5,()=>finish())},550)},{up:70,spin:-20})};
    const stroke=()=>{if(n>=N_STROKE)return;n++;S.bg.cut=n/N_STROKE;cnt1('stroke');LOG.push('stroke');draw();noise(.16,{type:'bandpass',freq:2400,q:.7,vol:.12});
      const [x]=at('bboard',62+176*S.bg.cut,0);ptAt('crumb',x,cutY(),3,{spread:26,up:16,bounce:true,dy:16,sz:9,ms:650});say(M.CNT_KO[n-1]+'! 슥!',cap(M.CNT_EN[n-1])+'!');
      if(n>=N_STROKE){H={};kind='wait';L.later(()=>{if(g===gen)split()},420)}};
    const tapSaw=cx=>{busy=true;put(cx);anim(kn,[{transform:'none'},{transform:'translateX(-22%)'},{transform:'translateX(18%)'},{transform:'translateX(-10%)'},{transform:'none'}],{duration:480,easing:'ease-in-out'});
      L.later(()=>{busy=false;stroke();if(!drag&&n<N_STROKE)kn.style.display='none'},380)};
    H={down:e=>{if(!hit(e,'bboard',10))return false;if(busy||n>=N_STROKE)return;G.stop();drag={last:e.clientX,dir:0,acc:0,moved:0};put(e.clientX)},
      move:e=>{if(!drag||n>=N_STROKE)return;const dx=e.clientX-drag.last;drag.last=e.clientX;drag.moved+=Math.abs(dx);put(e.clientX);const d=Math.sign(dx);if(d&&d!==drag.dir){drag.dir=d;drag.acc=0}drag.acc+=Math.abs(dx);if(drag.acc>kw()*.28){drag.acc=-1e9;stroke()}},
      up:e=>{if(!drag)return;const d=drag;drag=null;if(d.moved<14&&n<N_STROKE&&tapOk())tapSaw(e.clientX);else if(n<N_STROKE)kn.style.display='none'}};
    AIM=()=>at('bboard',150,104);HOT=()=>[E.bboard];guideAt(AIM,'swipe','슥슥 잘라 봐!','Saw saw!');
  },
  /* 고기를 콕 → 뜨거운 판에 철퍽, 치익 */
  patty(){
    kind='tap';S.bg.dish='patty';lay();draw();toolTray(pdishSVG('patty'));say('고기를 콕! 뜨거운 판에 올려요!','Tap the patty onto the grill!',true);
    AIM=()=>ctr(E.pdish);HOT=()=>[E.pdish,E.grill];
    H={down:e=>{if(!hit(e,'pdish',8)&&!hit(e,'grill',4))return false;if(busy||!tapOk())return;busy=true;H={};kind='wait';G.stop();const g=gen;
      const from=ctr(E.pdish),to=at('grill',GRILL_C[0],GRILL_C[1]+4),gw=rectOf('grill').width,s0=rectOf('pdish').width*.75;S.bg.dish='';draw();
      fly(`<svg viewBox="-80 -50 160 110" style="overflow:visible">${pattyTop(0,0,{flip:false})}</svg>`,from,to,s0,gw*160/300,600,()=>{if(g!==gen)return;
        S.bg.patty.on=true;S.cnt.pattyOn=1;LOG.push('pattyOn');draw();squash(E.grill);sweepTone(240,120,.18,'sine',.25);noise(1.1,{type:'bandpass',freq:4200,q:.5,vol:.08});
        ptAt('oil',to[0],to[1],7,{spread:gw*.25,up:26,dy:8,sz:9,ms:650});steamAt(to[0],to[1]-20,3,70);say('치익! 지글지글!','Sizzle sizzle!');sniff(false);
        L.later(()=>{if(g===gen)finish()},900)},{up:70})}};
    guideAt(AIM,'tap','고기를 콕 눌러 봐!','Tap the patty!');
  },
  /* 뒤집개로 꾹꾹 쓱쓱: 닿은 곳만 분홍 → 갈색 */
  press(){
    kind='rub';const stopI=intro(turnerSVG,'뒤집개!','Turner!');say('뒤집개로 꾹꾹 쓱쓱! 고기를 구워요!','Press with the turner! Cook the patty!',true);
    S.bg.patty.cells=PATTY_CELLS.map(()=>0);const cells=PATTY_CELLS.map(q=>[(GRILL_C[0]+q[0])/300,(GRILL_C[1]+q[1])/210]);let lastFx=0;
    rubTool({icon:turnerSVG,anchor:[.36,.7],gap:.3,log:'press',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[5,4],rad:.1,target:()=>rectOf('grill'),
      sound:()=>noise(.18,{type:'bandpass',freq:4200,q:.5,vol:.08}),touch:()=>{E.grill.classList.add('hot');rubBelly(false)},release:()=>{if(E.grill)E.grill.classList.remove('hot')},
      frame:F=>{const n=performance.now();if(!F||n-lastFx<140)return;lastFx=n;pt('steam',F.x+rand(30)-15,F.y-10,{sz:20,dx:rand(14)-7,dy:-50,ms:900});if(Math.random()<.5)pt('oil',F.x,F.y,{sz:7,dx:rand(40)-20,dy:-4,up:18,ms:500})},
      cell:(i,v)=>{S.bg.patty.cells[i]=v;S.bg.patty.under=S.bg.patty.cells.reduce((a,b)=>a+b,0)/PATTY_CELLS.length;if(v>=1&&Math.random()<.3)sniff(false)},
      done:()=>{S.bg.patty.cells=PATTY_CELLS.map(()=>1);S.bg.patty.under=1;S.cnt.pressed=1;draw();SFX.sparkle();say('노릇노릇 익고 있어요!','It is cooking!');alMood('wow',900);finish()}});
    AIM=()=>at('grill',GRILL_C[0],GRILL_C[1]);guideAt(AIM,'scrub','쓱쓱 눌러 봐!','Press press!');
  },
  /* 콕(또는 위로 휙) → 고기가 공중에서 한 바퀴, 착! 줄무늬 갈색 면 */
  flipP(){
    kind='tap';toolTray(turnerSVG);say('콕! 휙 뒤집어요!','Tap to flip the patty!',true);AIM=()=>at('grill',GRILL_C[0],GRILL_C[1]);HOT=()=>[E.grill];let drag=null;
    const pic=fl=>`<svg viewBox="-80 -50 160 110" style="overflow:visible">${pattyTop(0,0,{flip:fl,cells:S.bg.patty.cells,under:1})}</svg>`;
    const doFlip=()=>{if(busy)return;busy=true;H={};G.stop();kind='wait';LOG.push('flipP');const g=gen,gr=rectOf('grill'),c=at('grill',GRILL_C[0],GRILL_C[1]),sz=gr.width*160/300;
      tossUp(E.grill,pic(false),c,sz,sz*110/160,{hide:()=>{S.bg.patty.on=false;draw()},mid:()=>pic(true)},()=>{S.bg.patty.on=true;S.bg.patty.flip=true;S.cnt.flipped=1;draw();squash(E.grill);
        noise(1.2,{type:'bandpass',freq:4000,q:.5,vol:.1});tone(160,.1,'sine',.2);steamAt(c[0],c[1]-10,4,gr.width*.4);ptAt('oil',c[0],c[1],8,{spread:gr.width*.3,up:30,dy:6,sz:9,ms:650});
        say('휙! 착! 갈색으로 맛있게!','Flip! Nice and brown!');sniff(true);L.later(()=>{if(g===gen)finish()},1000)})};
    H={down:e=>{if(!hit(e,'grill',10))return false;if(!tapOk())return;drag={y:e.clientY}},move:e=>{if(drag&&drag.y-e.clientY>30){drag=null;doFlip()}},up:()=>{if(drag){drag=null;doFlip()}}};
    guideAt(AIM,'tap','콕 눌러서 뒤집어 봐!','Tap to flip!');
  },
  /* 치즈를 콕 → 뜨거운 고기 위에서 사르르 녹아 흘러내림 → 준비 접시로 */
  melt(){
    kind='tap';S.bg.dish='cheese';lay();draw();toolTray(pdishSVG('cheese'));say('치즈를 콕! 뜨거운 고기 위에 올려요!','Tap the cheese onto the hot patty!',true);
    AIM=()=>ctr(E.pdish);HOT=()=>[E.pdish,E.grill];
    H={down:e=>{if(!hit(e,'pdish',8)&&!hit(e,'grill',4))return false;if(busy||!tapOk())return;busy=true;H={};kind='wait';G.stop();const g=gen,from=ctr(E.pdish),to=at('grill',GRILL_C[0],GRILL_C[1]-4),gw=rectOf('grill').width,s0=rectOf('pdish').width*.6;S.bg.dish='';draw();
      fly(`<svg viewBox="-80 -50 160 110" style="overflow:visible">${cheeseTop(0,0,0)}</svg>`,from,to,s0,gw*160/300,560,()=>{if(g!==gen)return;
        S.bg.patty.cheese=0;draw();squash(E.grill);sfx.pop();say('사르르~ 녹아요!','Melty cheese!');steamAt(to[0],to[1]-14,3,60);sweepTone(700,400,.5,'sine',.06);
        const t0=performance.now(),step=()=>{if(g!==gen)return;const t=Math.min(1,(performance.now()-t0)/1100);S.bg.patty.cheese=t;draw();if(t<1){requestAnimationFrame(step);return}
          S.cnt.melted=1;LOG.push('melt');sniff(true);
          L.later(()=>{if(g!==gen)return;S.bg.patty.on=false;draw();toReady('patty',`<svg viewBox="-100 -60 200 90" style="overflow:visible">${pattyG(1)}<g transform="translate(0 -21)">${cheeseG(1)}</g></svg>`,to,gw*.45,()=>finish())},700)};
        requestAnimationFrame(step)},{up:60})}};
    guideAt(AIM,'tap','치즈를 콕!','Tap the cheese!');
  },
  /* 상추를 물로 쓱쓱(물 주전자는 손가락 위에 떠서 물줄기만 내려옴) */
  wash2(){
    kind='rub';S.bg.lw=LEAF_DIRT.map(()=>0);lay();draw();const stopI=intro(pitcherSVG,'물!','Water!');say('상추를 물로 쓱쓱 씻어요!','Wash the lettuce!',true);
    const cells=LEAF_DIRT.map(q=>[(LB_C[0]+q[0]*LB_K)/260,(LB_C[1]+q[1]*LB_K)/170]);let lastFx=0;
    rubTool(Object.assign(pitcherOpts(()=>rectOf('lbowl')),{log:'wash2',stopIntro:stopI,cells,grid:[6,3],rad:.11,target:()=>rectOf('lbowl'),
      sound:()=>noise(.2,{type:'lowpass',freq:1600,vol:.12}),touch:()=>rubBelly(false),
      frame:F=>{const n=performance.now();if(!F||n-lastFx<120)return;lastFx=n;pt('drop',F.x+rand(20)-10,F.y,{sz:12,dx:rand(60)-30,dy:10,up:30,ms:600});if(Math.random()<.4)pt('bubble',F.x+rand(30)-15,F.y,{sz:16,dx:rand(10)-5,dy:-30,ms:900})},
      cell:(i,v,pv)=>{S.bg.lw[i]=v;if(v>=1&&pv<1){tone(880+i*60,.1,'sine',.12);const q=LEAF_DIRT[i],[x,y]=at('lbowl',LB_C[0]+q[0]*LB_K,LB_C[1]+q[1]*LB_K);ptAt('spark',x,y-8,1,{spread:20,sz:18,ms:800})}},
      done:()=>{S.bg.lw.fill(1);S.cnt.lettuceWashed=1;draw();SFX.sparkle();say('반짝반짝 깨끗해요!','Sparkling clean!');alMood('wow',900);finish()}}));
    AIM=()=>ctr(E.lbowl);guideAt(AIM,'scrub','쓱쓱 씻어 봐!','Wash wash!');
  },
  /* 상추를 콕콕(또는 쭉 끌기) 찢기: 한 번에 한 조각씩 떨어짐 */
  tear(){
    kind='tap';S.bg.board='lettuce';S.bg.torn=0;lay();draw();toolTray(leafSVG(0,null));say('상추를 콕콕! 쭉 찢어요!','Tap to tear the lettuce!',true);
    const g=gen;AIM=()=>at('bboard',150+(S.bg.torn?36:-36),100);HOT=()=>[E.bboard];let drag=null;
    const rip=()=>{if(busy||S.bg.torn>=N_TEAR)return;busy=true;G.stop();S.bg.torn++;cnt1('tears');LOG.push('tear');draw();squash(E.bboard);noise(.22,{type:'highpass',freq:2600,vol:.22});sweepTone(1200,500,.12,'triangle',.06);
      const [x,y]=at('bboard',150+(S.bg.torn===1?-30:30),100);ptAt('leafbit',x,y,5,{spread:36,up:24,bounce:true,dy:16,sz:12,ms:700});say(S.bg.torn===1?'쭉!':'쫙!','Rip!');
      L.later(()=>{if(g!==gen)return;busy=false;if(S.bg.torn>=N_TEAR){H={};kind='wait';S.cnt.lettuceTorn=N_TEAR+1;
        L.later(()=>{if(g!==gen)return;const from=ctr(E.bboard),bw=rectOf('bboard').width;S.bg.board='';draw();toReady('lettuce',leafSVG(N_TEAR,null),from,bw*.6,()=>finish())},500)}},420)};
    H={down:e=>{if(!hit(e,'bboard',8))return false;if(!tapOk())return;drag={x:e.clientX,y:e.clientY}},move:e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>40){drag=null;rip()}},up:()=>{if(drag){drag=null;rip()}}};
    guideAt(AIM,'tap','상추를 콕 눌러 봐!','Tap the lettuce!');
  },
  /* 토마토를 칼로 콕콕: 한 번에 한 조각 */
  cut(){
    kind='tap';S.bg.board='tomato';S.bg.tcut=0;lay();draw();const stopI=intro(A.TOOL.knife,'칼!','Knife!');say('토마토를 콕! 칼로 썰어요!','Tap to slice the tomato!',true);
    const g=gen,edge=()=>96+(-48+96*(1-(S.bg.tcut+1)/N_TOMATO)+6)*1.05;
    AIM=()=>at('bboard',Math.max(70,edge()-10),100);HOT=()=>[E.bboard];
    H={down:e=>{if(!hit(e,'bboard',8))return false;if(busy||S.bg.tcut>=N_TOMATO||!tapOk())return;busy=true;G.stop();stopI();const [cx,cy]=at('bboard',edge(),64);
      chopKnife(cx,cy,()=>{S.bg.tcut++;S.cnt.tomatoCut++;LOG.push('cutT');draw();noise(.07,{freq:2600,vol:.25});sfx.pop();
        ptAt('drop',cx,cy+20,4,{c:'#F2705A',spread:30,up:20,dy:20,sz:10,ms:600});say(M.CNT_KO[S.bg.tcut-1]+'!',cap(M.CNT_EN[S.bg.tcut-1])+'!');
        L.later(()=>{if(g!==gen)return;busy=false;if(S.bg.tcut<N_TOMATO)return;H={};kind='wait';
          L.later(()=>{if(g!==gen)return;const from=at('bboard',210,100),bw=rectOf('bboard').width;S.bg.board='';draw();
            toReady('tomato',`<svg viewBox="-70 -40 140 80" style="overflow:visible">${tomSliceG(-28,0,1)+tomSliceG(28,4,1)}</svg>`,from,bw*.4,()=>{SFX.sparkle();say('재료 준비 끝!','Everything is ready!');finish()})},500)},420)})}};
    guideAt(AIM,'tap','콕! 한 번씩 썰어 봐!','Tap to slice!');
  },
  /* 차례차례 쌓기: 아래 빵 → 고기(치즈) → 상추 → 토마토. 콕 또는 끌어다 놓기. 차례가 아니면 살짝 튀어 돌아오고 응원 */
  stack(){
    kind='wait';const g=gen,rr=E.ready?E.ready.getBoundingClientRect():null,rc=rr&&rr.width?[rr.left+rr.width/2,rr.top+rr.height/2]:null;
    S.bg.readyOn=false;S.bg.stackOn=true;lay();draw();
    STACK.forEach((k,i)=>{const el=E['st_'+k];if(!el||!rc)return;el.style.opacity='0';const to=ctr(el),w=el.getBoundingClientRect().width;
      L.later(()=>{if(g!==gen)return;fly(stackPic(k),rc,to,44,w,520,()=>{if(g!==gen)return;el.style.opacity='';squash(el);sfx.pop()},{up:50})},i*110)});
    toolTray(burgerSVG(BURGER_FULL('ketchup')));say('차례차례 쌓아요! 아래 빵부터 콕!','Stack it up! Bottom bun first!',true);
    const next=()=>STACK.find(k=>!S.bg.layers.includes(k));let drag=null;
    AIM=()=>{const k=next();return k&&E['st_'+k]?ctr(E['st_'+k]):ctr(E.bplate)};HOT=()=>{const k=next();return k?[E['st_'+k]]:[]};
    const itemAt=e=>STACK.find(k=>!S.bg.layers.includes(k)&&hit(e,'st_'+k,4));
    const place=(k,from)=>{busy=true;G.stop();const el=E['st_'+k],r=el.getBoundingClientRect(),fr=from||[r.left+r.width/2,r.top+r.height/2];el.classList.add('hide');el.style.transform='';
      const top=burgerG(layersOf()).top,pr=rectOf('bplate'),to=at('bplate',BP_C[0],BP_C[1]+top-10);
      fly(stackPic(k),fr,to,r.width,200*pr.width/260,520,()=>{if(g!==gen)return;S.bg.layers.push(k);countLayer(k);LOG.push('stack:'+k);draw();squash(E.bplate);sfx.pop();tone(520+S.bg.layers.length*90,.1,'sine',.12);
        const nm=STACK_NAME[k];say(nm[0]+'!',cap(nm[1])+'!');alMood('wow',600);busy=false;
        if(S.bg.layers.length>=4){H={};kind='wait';L.later(()=>{if(g!==gen)return;say('잘 쌓았어요!','Great stacking!');finish()},700)}else guideAt(AIM,'tap','다음 것도 콕!','Next one!')},{up:60})};
    const wrong=k=>{S.cnt.stackWrong++;LOG.push('wrong:stack:'+k);misses++;sfx.soft();const n=next(),nm=STACK_NAME[n];
      if(k==='crown')say(`뚜껑은 맨 마지막에! 먼저 ${nm[0]}${batchim(nm[0])?'을':'를'} 올려요!`,`The top bun goes last! First the ${nm[1]}!`);
      else say(`아직이야! 먼저 ${nm[0]}부터! 잘하고 있어!`,`Not yet! First the ${nm[1]}! You're doing great!`);
      G.nudge();const t=E['st_'+n];if(t){t.classList.remove('rs-callme');void t.offsetWidth;t.classList.add('rs-callme');setTimeout(()=>t.classList.remove('rs-callme'),900)}};
    const hopBack=k=>{const el=E['st_'+k],r=el.getBoundingClientRect(),p=rectOf('bplate'),dx=(p.left+p.width/2-(r.left+r.width/2))*.35,dy=(p.top+p.height*.5-(r.top+r.height/2))*.35;
      anim(el,[{transform:'none'},{transform:`translate(${dx}px,${dy-30}px) scale(1.05)`,offset:.4},{transform:`translate(${dx*.4}px,${dy*.4}px) rotate(-6deg)`,offset:.65},{transform:'rotate(4deg)',offset:.82},{transform:'none'}],{duration:800,easing:'ease-in-out'});wrong(k)};
    const backFrom=(k,dx,dy,over)=>{const el=E['st_'+k];el.style.transform='';anim(el,[{transform:`translate(${dx}px,${dy}px) scale(1.08)`},{transform:'translate(0,-8px) scale(1.02)',offset:.6},{transform:'none'}],{duration:450,easing:'cubic-bezier(.3,1.4,.5,1)'});if(over)wrong(k)};
    H={down:e=>{const k=itemAt(e);if(!k)return false;if(busy)return;drag={k,x:e.clientX,y:e.clientY,moved:false}},
      move:e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>12)drag.moved=true;if(drag.moved){const el=E['st_'+drag.k];el.style.transform=`translate(${dx}px,${dy}px) scale(1.08)`;el.style.zIndex='6'}},
      up:e=>{if(!drag)return;const d=drag;drag=null;const el=E['st_'+d.k];el.style.zIndex='';
        if(!d.moved){if(!tapOk())return;if(d.k===next())place(d.k);else hopBack(d.k);return}
        const dx=e.clientX-d.x,dy=e.clientY-d.y,over=inRect(e,rectOf('bplate'),16);
        if(over&&d.k===next()){const r=el.getBoundingClientRect();LOG.push('drag:'+d.k);place(d.k,[r.left+r.width/2,r.top+r.height/2])}else backFrom(d.k,dx,dy,over)}};
    L.later(()=>{if(g!==gen)return;kind='tap';guideAt(AIM,'tap','아래 빵을 콕!','Tap the bottom bun!')},1300);   // the pieces have landed
  },
  /* 소스 병을 꾹 짜며 지그재그(병은 손가락 위에서 따라오고, 소스 줄기가 손가락 자리로 떨어짐) */
  drizzle(){
    kind='rub';const sk=S.bg.sauceK||'ketchup',sc=SAUCE[sk],ic=bottleSVG(sk),stopI=intro(ic,sc.ko+'!',cap(sc.en)+'!');say('쭉쭉! 지그재그로 뿌려요!','Squeeze it zig-zag!',true);
    const top=()=>burgerG(layersOf()).top,cells=[];for(let i=0;i<8;i++)cells.push([(BP_C[0]-72+i*20.5)/260,(BP_C[1]+top()+(i%2?14:-14))/260]);
    const addPt=(cx,cy)=>{const r=rectOf('bplate');if(!r)return;const vx=(cx-r.left)/r.width*260-BP_C[0],vy=(cy-r.top)/r.height*260,t=BP_C[1]+top();if(Math.abs(vx)>84)return;
      const ly=Math.max(-7,Math.min(7,(vy-t)*.3)),P=S.bg.sauce.pts,l=P[P.length-1];if(l&&Math.hypot(l[0]-vx,l[1]-ly)<5)return;if(P.length>160)return;P.push([vx,ly]);rd()};
    let lastS=0;
    rubTool({icon:ic,anchor:[.5,.98],gap:.3,log:'drizzle',stopIntro:stopI,effect:'rub',cells,grid:[6,4],rad:.1,target:()=>rectOf('bplate'),
      fx:({wx,wy,x,y})=>`<path d="M${wx} ${wy}L${x} ${y}" stroke="${sc.e}" stroke-width="8" stroke-linecap="round"/><path d="M${wx} ${wy}L${x} ${y}" stroke="${sc.c}" stroke-width="5" stroke-linecap="round"/>`,
      sound:()=>noise(.12,{type:'lowpass',freq:700,vol:.12}),touch:()=>rubBelly(false),
      frame:F=>{const sr=stR();addPt(F.x+sr.left,F.y+sr.top);const n=performance.now();if(n-lastS>500){lastS=n;sweepTone(200,120,.15,'sine',.08)}},
      tap:F=>{const sr=stR();for(let k=-3;k<=3;k++)addPt(F.x+sr.left+k*9,F.y+sr.top+(k%2?14:-14))},
      cell:()=>{},
      done:()=>{if(S.bg.sauce.pts.length<6)S.bg.sauce.pts=BURGER_FULL(sk).sauce.pts.slice();S.cnt.sauced=1;LOG.push('sauced');draw();SFX.sparkle();say('쭉쭉 지그재그 완성!','Zig-zag done!');alMood('wow',900);finish()}});
    AIM=()=>at('bplate',BP_C[0],BP_C[1]+top());guideAt(AIM,'scrub','지그재그로 쭉쭉!','Zig-zag!');
  },
  /* 뚜껑 빵을 콕(또는 끌기) → 덮이면 한 번 더 콕 = 꾹! */
  lid(){
    kind='tap';toolTray(stackPic('crown'));say('뚜껑 빵을 콕! 덮고 꾹!','Tap the top bun, then press!',true);let st2=0;const g=gen;
    AIM=()=>st2?at('bplate',BP_C[0],BP_C[1]+burgerG(layersOf()).top+20):ctr(E.st_crown);HOT=()=>st2?[E.bplate]:[E.st_crown];
    const cover=()=>{busy=true;G.stop();const el=E.st_crown,r=el.getBoundingClientRect(),from=[r.left+r.width/2,r.top+r.height/2];el.classList.add('hide');el.style.transform='';const top=burgerG(layersOf()).top,pr=rectOf('bplate');
      fly(stackPic('crown'),from,at('bplate',BP_C[0],BP_C[1]+top-24),r.width,200*pr.width/260,560,()=>{if(g!==gen)return;S.bg.layers.push('crown');countLayer('crown');LOG.push('stack:crown');draw();squash(E.bplate);sfx.pop();
        say('뚜껑 덮고… 이제 꾹!','Top on! Now press it!');st2=1;busy=false;guideAt(AIM,'tap','꾹 눌러 봐!','Press it!')},{up:60})};
    let drag=null;
    H={down:e=>{if(busy)return;
      if(!st2){if(!hit(e,'st_crown',6)&&!hit(e,'bplate',4))return false;if(!tapOk())return;drag={x:e.clientX,y:e.clientY,moved:false};return}
      if(!hit(e,'bplate',6))return false;if(!tapOk())return;busy=true;G.stop();H={};kind='wait';S.bg.pressed=true;S.cnt.lidPress=1;LOG.push('press2');draw();
      const gp=E.bplate.querySelector('.bgp');if(gp)anim(gp,[{transform:'none'},{transform:'scale(1.06,.8)',offset:.35},{transform:'scale(.97,1.05)',offset:.7},{transform:'none'}],{duration:640,easing:'ease-out'});
      tone(140,.12,'sine',.2);noise(.15,{type:'lowpass',freq:900,vol:.15});say('꾹! 버거 완성!','Squish! The burger is ready!');SFX.sparkle();alPlay('clap');L.later(()=>{if(g===gen)finish()},1200)},
      move:e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>12)drag.moved=true;if(drag.moved)E.st_crown.style.transform=`translate(${dx}px,${dy}px) scale(1.08)`},
      up:e=>{if(!drag)return;const d=drag;drag=null;if(!d.moved||inRect(e,rectOf('bplate'),16))cover();else{E.st_crown.style.transform='';squash(E.st_crown)}}};
    guideAt(AIM,'tap','뚜껑 빵을 콕!','Tap the top bun!');
  },

  /* ---------- 파스타 ---------- */
  /* 불을 콕콕: 불꽃이 커지고 물이 보글보글 */
  boil(){
    kind='tap';toolTray(stoveSVG({heat:2,inPot:0},false));say('콕콕! 물을 보글보글 끓여요!','Tap to heat the water!',true);
    const g=gen;AIM=()=>at('stove',140,150);HOT=()=>[E.stove];
    H={down:e=>{if(!hit(e,'stove',8))return false;if(busy||!tapOk()||S.ps.heat>=N_BOIL)return;busy=true;G.stop();S.ps.heat++;cnt1('heat');LOG.push('heat');draw();squash(E.stove);
      tone(900,.04,'square',.08);noise(.4+S.ps.heat*.3,{type:'bandpass',freq:700+S.ps.heat*200,q:.8,vol:.05+S.ps.heat*.02});const [x,y]=at('stove',140,84);ptAt('bubble',x,y,2+S.ps.heat*2,{spread:60,dy:-30,sz:16,ms:800});
      if(S.ps.heat>=2)steamAt(x,y-10,S.ps.heat,100);say(M.CNT_KO[S.ps.heat-1]+'! 보글!',cap(M.CNT_EN[S.ps.heat-1])+'!');
      L.later(()=>{if(g!==gen)return;busy=false;if(S.ps.heat>=N_BOIL){H={};kind='wait';S.cnt.boiled=1;say('보글보글 끓어요!','The water is boiling!');L.later(()=>{if(g===gen)finish()},800)}},450)}};
    guideAt(AIM,'tap','콕콕 눌러 봐!','Tap tap!');
  },
  /* 스파게티 묶음을 콕 → 냄비에 쏙(묶음 수만큼) */
  noodles(){
    kind='tap';S.ps.ndish=N_BUNDLE;lay();draw();toolTray(bundleSVG);say('스파게티를 콕! 냄비에 쏙!','Tap the spaghetti into the pot!',true);
    const g=gen;AIM=()=>ctr(E.ndish);HOT=()=>[E.ndish,E.stove];
    H={down:e=>{if(!hit(e,'ndish',8)&&!hit(e,'stove',4))return false;if(busy||!tapOk()||S.ps.ndish<=0)return;busy=true;G.stop();const from=ctr(E.ndish),s0=rectOf('ndish').width*.55;S.ps.ndish--;draw();
      const to=at('stove',140+(S.ps.inPot?18:-18),46),sr=rectOf('stove');
      fly(bundleSVG,from,to,s0,sr.width*.55,560,()=>{if(g!==gen)return;S.ps.inPot++;cnt1('noodlesIn');LOG.push('noodle');draw();squash(E.stove);sweepTone(400,200,.18,'sine',.2);
        ptAt('drop',to[0],to[1]+40,6,{spread:50,up:30,dy:10,sz:10,ms:650});say(M.CNT_KO[S.ps.inPot-1]+'! 쏙!',cap(M.CNT_EN[S.ps.inPot-1])+'!');busy=false;
        if(S.ps.ndish<=0){H={};kind='wait';L.later(()=>{if(g===gen)finish()},700)}else guideAt(AIM,'tap','하나 더 콕!','One more!')},{up:60})}};
    guideAt(AIM,'tap','스파게티를 콕!','Tap the spaghetti!');
  },
  /* 큰 숟가락으로 빙글빙글(또는 콕콕): 딱딱한 면이 말랑하게 */
  stir(){
    kind='rub';const stopI=intro(spoonSVG,'큰 숟가락!','Big spoon!');say('큰 숟가락으로 빙글빙글 저어요!','Stir round and round!',true);
    const cells=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cells.push([(POT_W[0]+Math.cos(a)*POT_W[2]*.62)/280,(POT_W[1]+Math.sin(a)*POT_W[3]*.7)/240])}
    let lastA=null,lastFx=0;
    rubTool({icon:spoonSVG,anchor:[.22,.78],gap:.25,log:'stir',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,3],rad:.12,target:()=>rectOf('stove'),
      sound:()=>noise(.2,{type:'lowpass',freq:900,vol:.1}),touch:()=>rubBelly(false),release:()=>{lastA=null},
      frame:F=>{const sr=stR(),[cx,cy]=at('stove',POT_W[0],POT_W[1]),a=Math.atan2((F.y+sr.top-cy)*2.5,F.x+sr.left-cx)*180/Math.PI;if(lastA!=null){let d=a-lastA;if(d>180)d-=360;if(d<-180)d+=360;S.ps.swirl+=d;rd()}lastA=a;
        const n=performance.now();if(n-lastFx>140){lastFx=n;pt('bubble',F.x+rand(30)-15,F.y,{sz:14,dx:rand(10)-5,dy:-24,ms:700});if(Math.random()<.3)pt('steam',F.x,F.y-20,{sz:20,dx:rand(10)-5,dy:-50,ms:1000})}},
      tap:()=>{S.ps.swirl+=90;rd()},progress:p=>{S.ps.soft=Math.max(S.ps.soft,p)},cell:()=>{},
      done:()=>{S.ps.soft=1;S.cnt.stirred=1;draw();SFX.sparkle();say('말랑말랑 다 익었어요!','Soft and cooked!');alMood('wow',900);finish()}});
    AIM=()=>at('stove',POT_W[0],POT_W[1]);guideAt(AIM,'circle','빙글빙글 저어 봐!','Stir stir!');
  },
  /* 냄비를 콕 → 체에 쏴아(물이 빠짐) → 체를 콕콕 탈탈 */
  drain(){
    kind='tap';S.ps.view='drain';lay();draw();toolTray(colanderSVG({full:true}));say('냄비를 콕! 체에 쏟아요!','Tap the pot to drain the water!',true);
    let shakes=0,poured=false;const g=gen;AIM=()=>poured?ctr(E.colander):ctr(E.stove);HOT=()=>poured?[E.colander]:[E.stove,E.colander];
    H={down:e=>{if(busy)return;
      if(!poured){if(!hit(e,'stove',6)&&!hit(e,'colander',6))return false;if(!tapOk())return;busy=true;G.stop();const pr=rectOf('stove'),cr=rectOf('colander'),dx=(cr.left+cr.width*.4)-(pr.left+pr.width/2),dy=(cr.top-pr.height*.25)-(pr.top+pr.height/2);
        anim(E.stove,[{transform:'none'},{transform:`translate(${dx*.6}px,${dy*.6-30}px) rotate(20deg)`,offset:.3},{transform:`translate(${dx}px,${dy}px) rotate(70deg)`,offset:.55},{transform:`translate(${dx}px,${dy}px) rotate(76deg)`,offset:.82},{transform:`translate(${dx*.5}px,${dy*.5-20}px) rotate(20deg)`,opacity:0}],{duration:1900,easing:'ease-in-out',fill:'forwards'});
        L.later(()=>{if(g!==gen)return;noise(1,{type:'lowpass',freq:1200,vol:.16});const c=ctr(E.colander);for(let k=0;k<6;k++)L.later(()=>{if(g===gen)ptAt('drop',c[0]+rand(40)-20,c[1]-cr.height*.35,3,{spread:30,up:6,dy:cr.height*.55,sz:12,ms:700})},k*110);
          steamAt(c[0],c[1]-cr.height*.3,4,cr.width*.5);S.ps.inColander=true;S.ps.empty=true;S.cnt.drained=1;LOG.push('drain');draw();squash(E.colander);say('쏴아! 물이 쪽!','Whoosh!')},1050);
        L.later(()=>{if(g!==gen)return;poured=true;busy=false;S.ps.potGone=true;lay();say('체를 콕콕 흔들어요!','Tap to shake the colander!');guideAt(AIM,'tap','체를 콕콕!','Tap tap!')},2000);return}
      if(!hit(e,'colander',8))return false;if(!tapOk())return;busy=true;G.stop();shakes++;cnt1('shake');LOG.push('shake');shake(E.colander,7);const c=ctr(E.colander),cr=rectOf('colander');
      ptAt('drop',c[0],c[1]+cr.height*.3,5,{spread:30,up:4,dy:40,sz:10,ms:650});tone(600+shakes*80,.06,'sine',.1);say(M.CNT_KO[shakes-1]+'! 탈탈!',cap(M.CNT_EN[shakes-1])+'!');
      L.later(()=>{if(g!==gen)return;busy=false;if(shakes>=N_SHAKE){H={};kind='wait';finish()}},500)}};
    guideAt(AIM,'tap','냄비를 콕!','Tap the pot!');
  },
  /* 국자로 소스를 콕콕: 한 번에 한 국자씩 팬이 차오름 */
  sauceP(){
    kind='tap';const sc=sauceC();toolTray(ladleSVG(sc.c));say('국자로 콕콕! 소스를 팬에 부어요!','Tap to ladle the sauce into the pan!',true);
    const g=gen;AIM=()=>at('ppan',108,108);HOT=()=>[E.ppan];
    H={down:e=>{if(!hit(e,'ppan',6))return false;if(busy||!tapOk()||S.ps.sauce>=N_LADLE)return;busy=true;G.stop();const pr=rectOf('ppan'),to=at('ppan',108,96),from=[pr.right-30,pr.top+20];
      fly(ladleSVG(sc.c),from,to,pr.width*.3,pr.width*.34,520,()=>{if(g!==gen)return;S.ps.sauce++;cnt1('sauce');LOG.push('sauce');draw();squash(E.ppan);sweepTone(300,140,.2,'sine',.2);noise(.6,{type:'bandpass',freq:900,q:.7,vol:.06});
        ptAt('drop',to[0],to[1]+10,5,{c:sc.c,spread:40,up:24,dy:10,sz:10,ms:650});say(M.CNT_KO[S.ps.sauce-1]+'!',cap(M.CNT_EN[S.ps.sauce-1])+'!');if(S.ps.sauce===2)sniff(true);busy=false;
        if(S.ps.sauce>=N_LADLE){H={};kind='wait';L.later(()=>{if(g!==gen)return;say('보글보글 소스!','Bubbly sauce!');finish()},600)}},{up:50,spin:-30})}};
    guideAt(AIM,'tap','팬을 콕콕!','Tap the pan!');
  },
  /* 체의 면을 콕 → 팬에 쏙, 그다음 콕(또는 위로 휙)마다 휙! 공중으로 섞기 */
  toss(){
    kind='tap';const sc=sauceC(),g=gen;lay();draw();toolTray(ppanSVG(Object.assign({},S.ps,{inPan:true,toss:N_TOSS})));say('면을 콕! 팬에 넣고 휙휙 섞어요!','Tap to add the noodles, then toss!',true);
    AIM=()=>S.ps.inPan?at('ppan',108,108):ctr(E.colander);HOT=()=>S.ps.inPan?[E.ppan]:[E.colander,E.ppan];let drag=null;
    const tg=t=>`<svg viewBox="40 30 136 150" style="overflow:visible">${tangle(108,106,58,mix(FC.noodle,sc.n,t),mix(FC.noodleE,sc.ne,t),1)}</svg>`;
    const add=()=>{busy=true;G.stop();const from=ctr(E.colander),s0=rectOf('colander').width*.5,to=at('ppan',108,106),pr=rectOf('ppan');S.ps.inColander=false;draw();
      fly(tg(0),from,to,s0,pr.width*.45,600,()=>{if(g!==gen)return;S.ps.inPan=true;S.cnt.inPan=1;LOG.push('inPan');lay();draw();squash(E.ppan);noise(.8,{type:'bandpass',freq:3000,q:.5,vol:.07});sfx.pop();
        say('쏙! 이제 콕콕 휙휙!','In it goes! Now toss!');busy=false;guideAt(AIM,'tap','팬을 콕! 휙!','Tap to toss!')},{up:70})};
    const doToss=()=>{if(busy||S.ps.toss>=N_TOSS)return;busy=true;G.stop();const pr=rectOf('ppan'),c=at('ppan',108,106),sz=pr.width*.5;
      tossUp(E.ppan,tg(S.ps.toss/N_TOSS),c,sz,sz*1.1,{hide:()=>{S.ps.inPan=false;draw()},spin:200,up:Math.min(G0.H*.3,pr.height*.8)},()=>{
        S.ps.inPan=true;S.ps.toss++;cnt1('toss');LOG.push('toss');draw();squash(E.ppan);noise(.9,{type:'bandpass',freq:3600,q:.5,vol:.08});ptAt('drop',c[0],c[1],5,{c:sc.c,spread:pr.width*.25,up:20,dy:8,sz:9,ms:600});
        say(M.CNT_KO[S.ps.toss-1]+'! 휙!',cap(M.CNT_EN[S.ps.toss-1])+'!');busy=false;
        if(S.ps.toss>=N_TOSS){H={};kind='wait';sniff(true);L.later(()=>{if(g!==gen)return;say('소스랑 쏙쏙 섞였어요!','All mixed with sauce!');finish()},700)}})};
    H={down:e=>{if(busy||!tapOk())return;
        if(!S.ps.inPan){if(!hit(e,'colander',6)&&!hit(e,'ppan',4))return false;add();return}
        if(!hit(e,'ppan',8))return false;drag={y:e.clientY}},
      move:e=>{if(drag&&drag.y-e.clientY>30){drag=null;doToss()}},up:()=>{if(drag){drag=null;doToss()}}};
    guideAt(AIM,'tap','체를 콕!','Tap the colander!');
  },
  /* 포크로 빙글빙글(또는 콕콕): 접시에 돌돌 말린 둥지가 자람 */
  twirl(){
    kind='rub';S.ps.nest=0;S.ps.panLeft=1;lay();draw();const stopI=intro(forkSVG,'포크!','Fork!');say('포크로 빙글빙글! 접시에 돌돌 말아요!','Twirl it onto the plate!',true);
    const cells=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cells.push([(PP_C[0]+Math.cos(a)*46)/260,(PP_C[1]+Math.sin(a)*27)/180])}let lastFx=0;
    rubTool({icon:forkSVG,anchor:[.16,.86],gap:.25,log:'twirl',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,4],rad:.11,target:()=>rectOf('pplate'),
      sound:()=>noise(.14,{type:'bandpass',freq:1500,q:.6,vol:.06}),touch:()=>rubBelly(false),
      frame:F=>{const n=performance.now();if(n-lastFx<220)return;lastFx=n;if(Math.random()<.5)pt('steam',F.x,F.y-20,{sz:18,dx:rand(10)-5,dy:-40,ms:900})},
      progress:p=>{S.ps.nest=Math.max(S.ps.nest,p);S.ps.panLeft=1-S.ps.nest},cell:()=>{},
      done:()=>{S.ps.nest=1;S.ps.panLeft=0;S.cnt.twirled=1;draw();SFX.sparkle();say('돌돌 예쁘게 담았어요!','Twirled nicely!');alMood('wow',900);finish()}});
    AIM=()=>at('pplate',PP_C[0],PP_C[1]);guideAt(AIM,'circle','빙글빙글 돌려 봐!','Twirl twirl!');
  },
  /* 치즈 통을 솔솔(닿은 곳에만 치즈), 다 되면 바질이 쏙 */
  sprinkle(){
    kind='rub';S.ps.cheese=CHEESE_CELLS.map(()=>0);const stopI=intro(shakerSVG,'치즈!','Cheese!');say('치즈를 솔솔 뿌려요!','Sprinkle the cheese!',true);
    const cells=CHEESE_CELLS.map(q=>[(PP_C[0]+q[0])/260,(PP_C[1]+q[1])/180]);let lastFx=0;
    rubTool({icon:shakerSVG,anchor:[.5,.86],gap:.35,log:'sprinkle',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,4],rad:.11,target:()=>rectOf('pplate'),
      sound:()=>noise(.1,{type:'highpass',freq:5000,vol:.05}),touch:()=>rubBelly(false),
      frame:(F,t,Wp)=>{const n=performance.now();if(!F||!Wp||n-lastFx<90)return;lastFx=n;pt('cheese',Wp.wx+rand(14)-7,Wp.wy,{sz:8,dx:rand(20)-10,dy:Math.max(10,F.y-Wp.wy),ms:500,ease:'ease-in'})},
      cell:(i,v)=>{S.ps.cheese[i]=v},
      done:()=>{S.ps.cheese=CHEESE_CELLS.map(()=>1);S.ps.basil=true;S.cnt.sprinkled=1;draw();squash(E.pplate);SFX.sparkle();const c=at('pplate',PP_C[0],PP_C[1]-20);ptAt('spark',c[0],c[1],3,{spread:50,sz:20,ms:800});
        say('치즈 솔솔, 바질 쏙! 파스타 완성!','Cheese and basil! The pasta is ready!');alPlay('clap');finish()}});
    AIM=()=>at('pplate',PP_C[0],PP_C[1]);guideAt(AIM,'scrub','솔솔 뿌려 봐!','Sprinkle!');
  },
  /* 곁들임 주스 ①: 오렌지 반쪽을 콕콕 꾹 짜기(반쪽 수만큼) */
  juice(){
    kind='tap';S.side.k=0;S.side.jug=0;lay();draw();toolTray(juicerSVG({k:0,jug:.5},false));say('이번엔 주스! 오렌지를 콕콕 꾹 짜요!','Now the juice! Tap to squeeze the orange!',true);
    const g=gen;AIM=()=>at('juicer',100,70);HOT=()=>[E.juicer];
    H={down:e=>{if(!hit(e,'juicer',8))return false;if(busy||!tapOk()||S.side.k>=N_SQUEEZE)return;busy=true;G.stop();
      const o=E.juicer.querySelector('.rs-orange');if(o)anim(o,[{transform:'none'},{transform:'translateY(6px) scale(1.06,.86) rotate(-12deg)',offset:.4},{transform:'translateY(4px) scale(1.04,.9) rotate(14deg)',offset:.7},{transform:'none'}],{duration:600,easing:'ease-in-out'});
      noise(.3,{type:'lowpass',freq:1400,vol:.12});const [x,y]=at('juicer',100,98);for(let k=0;k<3;k++)L.later(()=>{if(g!==gen)return;const [sx,sy]=stXY(x+rand(16)-8,y);pt('drop',sx,sy,{c:FC.orange,sz:10,dy:44,ms:600})},k*120);
      L.later(()=>{if(g!==gen)return;S.side.k++;S.side.jug=S.side.k/N_SQUEEZE;cnt1('squeezed');LOG.push('squeeze');draw();say(M.CNT_KO[S.side.k-1]+'! 꾹!',cap(M.CNT_EN[S.side.k-1])+'!');busy=false;
        if(S.side.k>=N_SQUEEZE){H={};kind='wait';L.later(()=>{if(g!==gen)return;SFX.sparkle();say('주스가 가득!','Lots of juice!');finish()},600)}},560)}};
    guideAt(AIM,'tap','오렌지를 콕콕!','Tap the orange!');
  },
  /* 곁들임 주스 ②: 컵에 선까지 붓기(꾹 누르고 있으면 졸졸, 콕 한 번 = 한 모금씩). 선에 닿으면 저절로 멈추고 빨대 쏙 */
  pour(){
    kind='tap';S.side.fill=0;S.side.full=false;lay();draw();toolTray(glassSVG(GLASS_LINE,false));say('컵에 주스를 부어요! 선까지!','Pour the juice up to the line!',true);
    const g=gen;AIM=()=>ctr(E.glass);HOT=()=>[E.juicer,E.glass];let holding=false,raf2=0,last=0,t0=0;L.onEnd(()=>{if(raf2)cancelAnimationFrame(raf2)});
    const tilt=on=>{const j=E.juicer;if(!j)return;j.style.transformOrigin='30% 70%';j.style.transition='transform .35s ease-in-out';j.style.transform=on?'translate(-12%,-6%) rotate(-38deg)':''};
    const stream=()=>{const a=at('juicer',28,92),b=at('glass',60,194-152*S.side.fill),[ax,ay]=stXY(a[0],a[1]);for(let k=0;k<2;k++)pt('drop',ax+rand(6)-3,ay,{c:FC.orange,sz:10,dx:b[0]-a[0]+rand(10)-5,dy:b[1]-a[1],ms:380,ease:'ease-in'})};
    const fin=()=>{H={};kind='wait';holding=false;tilt(false);S.cnt.poured=1;LOG.push('pour');L.later(()=>{if(g!==gen)return;S.side.straw=true;draw();squash(E.glass);SFX.sparkle();say('딱 선까지! 빨대 쏙!','Right to the line! Straw in!');L.later(()=>{if(g===gen)finish()},900)},400)};
    const add=d=>{S.side.fill=Math.min(GLASS_LINE,S.side.fill+d);S.side.jug=Math.max(0,1-S.side.fill/GLASS_LINE);S.cnt.pourSips=Math.round(S.side.fill/GLASS_LINE*N_SQUEEZE);draw();if(S.side.fill>=GLASS_LINE-1e-6&&!S.side.full){S.side.full=true;fin()}};
    const loop=t=>{raf2=0;if(!holding||S.side.full||g!==gen)return;const dt=last?Math.min(.1,(t-last)/1000):0;last=t;add(dt*.3);if(Math.random()<.5)stream();raf2=requestAnimationFrame(loop)};
    H={down:e=>{if(!hit(e,'glass',10)&&!hit(e,'juicer',8))return false;if(busy||S.side.full)return;G.stop();holding=true;last=0;t0=performance.now();tilt(true);noise(.5,{type:'lowpass',freq:1000,vol:.1});
        L.later(()=>{if(holding&&!raf2&&g===gen)raf2=requestAnimationFrame(loop)},320)},
      up:()=>{if(!holding)return;holding=false;if(S.side.full)return;if(performance.now()-t0<320){busy=true;stream();L.later(()=>{if(g!==gen)return;add(GLASS_LINE/N_SQUEEZE+.001);busy=false;if(!S.side.full){tilt(false);say('졸졸!','Glug glug!');guideAt(AIM,'tap','한 번 더 콕!','Once more!')}},380)}else tilt(false)}};
    guideAt(AIM,'hold','컵을 꾹 눌러 봐!','Press and hold the cup!');
  },
  /* 곁들임 샐러드 ①: 오이를 칼로 콕콕 → 썬 조각이 샐러드 그릇으로 */
  chopS(){
    kind='tap';S.side.cuke=0;S.side.cut=0;lay();draw();const stopI=intro(A.TOOL.knife,'칼!','Knife!');say('이번엔 샐러드! 오이를 콕콕 썰어요!','Now the salad! Tap to slice the cucumber!',true);
    const g=gen,edge=()=>56+180*(1-(S.side.cut+1)/(N_CUKE+1));AIM=()=>at('sboard',edge()+10,80);HOT=()=>[E.sboard];
    H={down:e=>{if(!hit(e,'sboard',8)&&!hit(e,'sbowl',4))return false;if(busy||!tapOk()||S.side.cut>=N_CUKE)return;busy=true;G.stop();stopI();const [cx,cy]=at('sboard',edge(),60);
      chopKnife(cx,cy,()=>{S.side.cut++;cnt1('cukeCut');draw();noise(.07,{freq:2600,vol:.25});
        const br=rectOf('sbowl'),i=S.side.cuke,to=at('sbowl',70+i*44,60+(i%2)*14);
        fly(`<svg viewBox="-20 -20 40 40" style="overflow:visible">${cukeSliceG(0,0,1)}</svg>`,[cx,cy+24],to,40,br.width*40/240*.9,520,()=>{if(g!==gen)return;S.side.cuke++;cnt1('cukeIn');LOG.push('cuke');draw();squash(E.sbowl);sfx.pop();
          say(M.CNT_KO[S.side.cuke-1]+'!',cap(M.CNT_EN[S.side.cuke-1])+'!');busy=false;if(S.side.cuke>=N_CUKE){H={};kind='wait';L.later(()=>{if(g===gen)finish()},600)}},{up:60})})}};
    guideAt(AIM,'tap','오이를 콕!','Tap the cucumber!');
  },
  /* 곁들임 샐러드 ②: 샐러드 집게로 빙글빙글 섞기(잎이 통통 튐, 드레싱이 스며듦) */
  tossS(){
    kind='rub';S.side.toss=0;lay();draw();const stopI=intro(serversSVG,'샐러드 집게!','Salad servers!');say('집게로 쓱쓱 섞어요!','Toss the salad!',true);
    const cells=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cells.push([(120+Math.cos(a)*62)/240,(72+Math.sin(a)*18)/170])}let lastFx=0;
    rubTool({icon:serversSVG,anchor:[.3,.85],gap:.25,log:'tossS',stopIntro:stopI,effect:'rub',fx:()=>'',cells,grid:[6,3],rad:.12,target:()=>rectOf('sbowl'),
      sound:()=>noise(.12,{type:'bandpass',freq:2000,q:.6,vol:.06}),touch:()=>rubBelly(false),
      frame:F=>{const n=performance.now();if(!F||n-lastFx<110)return;lastFx=n;S.side.jit=(S.side.jit||0)+1;rd();if(Math.random()<.4)pt('leafbit',F.x,F.y,{sz:10,dx:rand(40)-20,dy:-6,up:24,bounce:true,ms:600})},
      tap:()=>{S.side.jit=(S.side.jit||0)+3;rd()},progress:p=>{S.side.toss=Math.max(S.side.toss,p)},cell:()=>{},
      done:()=>{S.side.toss=1;S.side.jit=0;S.cnt.tossedS=1;draw();SFX.sparkle();say('샐러드 완성!','The salad is ready!');alMood('wow',900);finish()}});
    AIM=()=>ctr(E.sbowl);guideAt(AIM,'circle','쓱쓱 섞어 봐!','Toss toss!');
  }
});
function countLayer(k){
  if(k==='heel')S.cnt.heelUsed=1;if(k==='crown')S.cnt.crownUsed=1;if(k==='patty'){S.cnt.pattyUsed=1;S.cnt.cheeseUsed=1}
  if(k==='lettuce')S.cnt.lettuceStacked=N_TEAR+1;if(k==='tomato')S.cnt.tomatoStacked=N_TOMATO;
}

/* ---------- ending ---------- */
function handOver(n,side,then){
  const g=gen,el=E[n],cr=custEl.getBoundingClientRect(),fr=el.getBoundingClientRect();if(!S.given.length)LOG.push('serve');S.given.push(n);rubBelly(false);
  const html=el.innerHTML;el.classList.add('hide');if(S.given.length===1)tray.innerHTML='';
  const to=side?[cr.left+cr.width*.86,cr.top+cr.height*.74]:[cr.left+cr.width*.5,cr.top+cr.height*.7],sz=side?cr.width*.42:cr.width*.66;sfx.pop();
  fly(html,[fr.left+fr.width/2,fr.top+fr.height/2],to,Math.min(fr.width,220),sz,800,f=>{if(g!==gen){if(f)f.remove();return}S.held[n]=f;alMood('wow',700);sniff(false);then()},{up:40,keep:true});
}
function eat(list){
  phase='eat';const g=gen,cr=custEl.getBoundingClientRect(),mouth=[cr.left+cr.width*.5,cr.top+cr.height*.66],main=S.held[list[0]],side=list[1]?S.held[list[1]]:null;
  say('킁킁~ 맛있는 냄새!','Sniff sniff! Smells yummy!');
  L.later(()=>{if(g!==gen)return;drawCust('yum');cfxEl.classList.remove('puff');void cfxEl.offsetWidth;cfxEl.classList.add('puff');LOG.push('bite');
    [0,600,1200].forEach((t,k)=>L.later(()=>{if(g!==gen)return;SFX.chomp();if(main)anim(main,[{transform:`scale(${1-k*.22})`},{transform:`scale(${.86-k*.22},${.9-k*.22})`},{transform:`scale(${.78-k*.22})`}],{duration:400,fill:'forwards',easing:'ease-out'});
      ptAt('crumb',mouth[0],mouth[1],3,{spread:30,up:14,bounce:true,dy:30,sz:9,ms:700})},t));
    const p=pick(PRAISE);L.later(()=>{if(g!==gen)return;say('냠냠! '+p.ko,'Yum yum! '+p.en)},400)},900);
  let tEnd=3000;
  if(side){tEnd=4700;L.later(()=>{if(g!==gen)return;if(main)main.remove();LOG.push('sip');
    if(S.sideId==='juice'){sweepTone(300,700,.4,'sine',.1);say('호로록! 시원해!','Slurp! So fresh!')}else{SFX.chomp();say('아삭아삭!','Crunch crunch!')}
    anim(side,[{transform:'none'},{transform:'scale(.82)',offset:.5},{transform:'scale(.6)',opacity:.3}],{duration:1300,fill:'forwards'})},3000)}
  L.later(()=>{if(g!==gen)return;Object.values(S.held).forEach(f=>{if(f)f.remove()});drawCust('happy');alPlay('dance');SFX.sparkle();
    L.later(()=>{if(g===gen)heart()},2300)},tEnd);
}
/* the 3-star row of the level engine in the header */
function stars(n){const pr=PRG(),el=$('#rsStars');if(el)el.innerHTML=pr&&pr.stars?pr.stars(GID,n):''}
/* progress.levelUpMoment: the new menu of the new level, big, with its name */
function newThing(n){
  const m=levelInfo(n).menus.find(x=>!levelInfo(Math.max(1,n-1)).menus.includes(x))||'toast',mm=MENUS.find(x=>x.id===m)||{ko:'',en:''};
  const art=m==='burger'?burgerMini:m==='pasta'?pastaMini('tsauce'):m==='chicken'?chickenMini:breakfastMini;
  return{art,ko:mm.ko+'!',en:cap(mm.en)+'!',what:m};
}
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-50],50,44,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');const pr=PRG();let R=null;if(pr)try{R=pr.clear(GID)}catch(e){}
  /* P12-나: one star of the row fills slowly; a full row that opens a new level → the level-up moment once the customer has gone */
  if(R&&pr.fillStars){LOG.push('star:'+R.filled);stars(Math.max(0,R.filled-1));L.later(()=>{if(g===gen)pr.fillStars($('#rsStars'),R.filled)},400)}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('고마워! 또 올게요!','Thank you! See you again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');cfxEl.style.visibility='hidden';bubEl.hidden=true;
      L.later(()=>{if(g!==gen)return;
        if(R&&R.up&&pr.moment){phase='levelup';const t=newThing(R.level);LOG.push('levelup:'+R.level+':'+t.what);const stop=pr.moment(stage,t,()=>{if(g!==gen)return;LOG.push('levelup:done');stars(0);newRound()});L.onEnd(stop);return}
        if(R&&R.full)stars(0);newRound()},1400)},1500)},1100);
}

/* ---------- a new round: the shop front first ---------- */
const KINDS=(VO.animalNames||[{id:'bunny',ko:'토끼',en:'bunny',name:'토토'}]).filter(k=>A.KINDS[k.id]);
function lobbyOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
/* not in config: which menu each of the three guests asks for (two menus: at least one of each, the last one is not repeated first) */
function makeOrders(v){const m=v.menus;if(m.length<2)return[m[0],m[0],m[0]];if(m.length===2){const o=shuffle([m[0],m[1],pick(m)]);if(o[0]===DATA.last)o.push(o.shift());return o}
  /* three or more menus: the newest one is always there, plus two others, all different */
  const nw=m[m.length-1],o=shuffle([nw,...shuffle(m.slice(0,-1)).slice(0,2)]);if(o[0]===DATA.last&&o[0]!==nw)o.push(o.shift());return o}
let FORCE_SIDE=null;
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';ptNow=0;tray.innerHTML='';tray.onpointerdown=null;busy=false;
  if(al){al.detach();al=null}lobbyOff();custEl.classList.remove('leave','enter','rs-rub');cfxEl.classList.remove('puff','sniff');
  lv=levelInfo(levelNo());const orders=makeOrders(lv),kinds=shuffle(KINDS.map(k=>k.id)).slice(0,3);
  S={view:'lobby',orders,kinds,menu:null,kind:null,name:'',board:0,toast:{n:0,heat:0,glow:0,lever:0,up:0},plate:{toast:0,egg:false,fruit:[]},pan:{egg:false,cells:null,flip:false,raw:true},wash:null,
    cp:Array(N_CHICKEN).fill('none'),coat:Array(N_CHICKEN).fill(0),cells:Array(N_CHICKEN*2).fill(0),coated:Array(N_CHICKEN).fill(false),fried:Array(N_CHICKEN).fill(false),pot:[],basketN:0,
    cnt:{breadIn:0,press:0,toastMade:0,toastPlated:0,crack:0,eggs:0,flip:0,eggPlated:0,washed:0,fruitPlated:0,coated:0,dropped:0,fried:0,basket:0,
      stroke:0,bunCut:0,pattyOn:0,pressed:0,flipped:0,melted:0,lettuceWashed:0,tears:0,lettuceTorn:0,tomatoCut:0,heelUsed:0,crownUsed:0,pattyUsed:0,cheeseUsed:0,lettuceStacked:0,tomatoStacked:0,stackWrong:0,sauced:0,lidPress:0,
      heat:0,boiled:0,noodlesIn:0,stirred:0,drained:0,shake:0,sauce:0,inPan:0,toss:0,twirled:0,sprinkled:0,squeezed:0,poured:0,pourSips:0,cukeCut:0,cukeIn:0,tossedS:0},
    bg:{board:'',cut:0,dish:'',patty:{on:false,cells:null,flip:false,cheese:null,under:0},lw:LEAF_DIRT.map(()=>0),torn:0,tcut:0,ready:[],readyOn:false,layers:[],order:shuffle([0,1,2,3,4]),sauceK:'ketchup',sauce:{pts:[]},pressed:false},
    ps:{heat:0,inPot:0,ndish:0,soft:0,swirl:0,view:'',empty:false,inColander:false,potGone:false,sauceK:'tsauce',sauce:0,inPan:false,toss:0,nest:0,panLeft:1,cheese:null,basil:false},
    side:{k:0,jug:0,fill:0,straw:false,full:false,cuke:0,cut:0,toss:0,jit:0},
    sideId:lv.twoOrders?(FORCE_SIDE||(DATA.lastSide==='juice'?'salad':'juice')):null,given:[],held:{},custBig:false};
  work.innerHTML='';E={};pi=0;phase='lobby';kind='tap';HOT=()=>[...lobbyEl.querySelectorAll('.rs-lc')];
  plan=new Set(orders).size===1?planFor(orders[0]):[];
  LOG.push('level:'+lv.level,'orders:'+orders.join('+'));
  lobbyEl.querySelectorAll('.rs-lc').forEach(b=>b.remove());
  kinds.forEach((k,i)=>{const b=document.createElement('button');b.className='rs-lc';b.dataset.i=i;b.setAttribute('aria-label','손님');
    b.innerHTML=`<span class="lc-ani">${A.animal(k,'idle',{})}</span><span class="lc-bub">${orderPic(orders[i],S.sideId)}</span>`;lobbyEl.appendChild(b)});
  showView('lobby');strip();size();stars();
  if(M.Alive){lobbyEl.querySelectorAll('.lc-ani').forEach((e,i)=>lobbyAl.push(M.Alive.attach(e,{kind:kinds[i],waiting:true})));if(M.Alive.takeTurns)turns=M.Alive.takeTurns(lobbyAl);L.onEnd(lobbyOff)}
  AIM=()=>{const b=lobbyEl.querySelector('.rs-lc:nth-child(3)');return b?ctr(b):[0,0]};
  say('어서 오세요! 누구에게 요리해 줄까? 친구를 콕!','Welcome! Who shall we cook for? Tap a friend!',true);
  H={down:e=>{const bs=[...lobbyEl.querySelectorAll('.rs-lc')];const i=bs.findIndex(b=>inRect(e,b.getBoundingClientRect(),4));if(i<0)return false;if(busy)return;busy=true;choose(i)}};
  const g=gen;L.later(()=>{if(g===gen)G.start({type:'tap',at:()=>stXY(...AIM()),ko:'친구를 콕 눌러 봐!',en:'Tap a friend!'})},800);
}
function choose(i){
  const g=gen,bs=[...lobbyEl.querySelectorAll('.rs-lc')];G.stop();H={};LOG.push('customer:'+S.orders[i]);
  bs.forEach((b,j)=>b.classList.add(j===i?'sel':'gone'));sfx.pop();
  S.menu=S.orders[i];S.kind=S.kinds[i];const kn=KINDS.find(k=>k.id===S.kind)||{};S.name=kn.name||kn.ko||'';DATA.last=S.menu;
  if(S.menu!=='pasta')S.sideId=null;else DATA.lastSide=S.sideId;save();
  const m=MENUS.find(x=>x.id===S.menu)||{ko:'',en:''},sd=SIDES.find(x=>x.id===S.sideId);
  if(sd)say(`${m.ko}랑 ${sd.ko} 주세요!`,`${cap(m.en)} and ${sd.en}, please!`);else say(`${m.ko} 주세요!`,`${cap(m.en)}, please!`);
  L.later(()=>{if(g!==gen)return;lobbyOff();startWork()},1300);
}
function startWork(){
  const g=gen;
  if(S.menu==='toast'){mkIt('plate','');mkIt('toaster','');mkIt('board','');mkIt('pan','');mkIt('egg',eggWhole(false));mkIt('bowl','')}
  else if(S.menu==='chicken'){mkIt('dish',dishSVG);mkIt('sdish',smallDishSVG);mkIt('pot','');mkIt('basket','');for(let i=0;i<N_CHICKEN;i++)mkIt('c'+i,'')}
  else if(S.menu==='burger'){['ready','bboard','grill','pdish','lbowl','bplate'].forEach(n=>mkIt(n,''));STACK.forEach(k=>mkIt('st_'+k,stackPic(k),'rs-stk'))}
  else{['stove','ndish','colander','ppan','pplate'].forEach(n=>mkIt(n,''));(S.sideId==='salad'?['sboard','sbowl']:['juicer','glass']).forEach(n=>mkIt(n,''))}
  plan=planFor(S.menu,S.sideId);pi=0;S.custBig=true;showView('work');cfxEl.style.visibility='';work.style.visibility='hidden';
  if(al){al.detach();al=null}drawCust('idle');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:S.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=S.menu==='pasta'&&S.sideId?orderTwo(S.sideId):ORDER_PIC[S.menu];bubEl.hidden=true;
  phase='enter';kind='wait';strip();size();draw();
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;rubBelly(true);
    const sd=SIDES.find(x=>x.id===S.sideId)||{ko:'',en:''};
    const hi={toast:[`안녕! 나는 ${S.name}. 배고파요. 아침밥 만들어 줘!`,`Hi! I'm ${S.name}. I'm hungry. Breakfast, please!`],chicken:[`안녕! 나는 ${S.name}. 바삭바삭 치킨 먹고 싶어!`,`Hi! I'm ${S.name}. Crispy chicken, please!`],
      burger:[`안녕! 나는 ${S.name}. 맛있는 버거 먹고 싶어!`,`Hi! I'm ${S.name}. A yummy burger, please!`],pasta:[`안녕! 나는 ${S.name}. 파스타랑 ${sd.ko} 주세요!`,`Hi! I'm ${S.name}. Pasta and ${sd.en}, please!`]}[S.menu];
    say(hi[0],hi[1])},1200);
  L.later(()=>{if(g!==gen)return;run()},S.menu==='pasta'?4300:3800);
}

/* ---------- test hooks ---------- */
const HAND_OF={pick:'choose',toastIn:'tap',toastPop:'tap',crack:'tap',fry:'rub',flip:'tap',wash:'rub',plateFruit:'tap',coat:'rub',drop:'tap',fry2:'rub',lift:'tap',serve:'tap',
  slice:'tool',patty:'tap',press:'rub',flipP:'tap',melt:'tap',wash2:'rub',tear:'tap',cut:'tap',stack:'drag',drizzle:'rub',lid:'tap',
  boil:'tap',noodles:'tap',stir:'rub',drain:'tap',sauceP:'tap',toss:'tap',twirl:'rub',sprinkle:'rub',juice:'tap',pour:'tap',chopS:'tap',tossS:'rub'};
M.__rsSide=k=>{FORCE_SIDE=k||null;return FORCE_SIDE};
M.__rsLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__rs=()=>{
  const k=plan[pi]||null;let aim=null;try{aim=AIM?AIM():null}catch(e){}const sr=stR();
  let hot=[];try{hot=HOT().filter(Boolean).map(e=>{const r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})}catch(e){}
  const tr=tool&&toolTarget?(()=>{const r=toolTarget()||sr;return{x:r.left,y:r.top,w:r.width,h:r.height}})():null;
  const cb=custEl.getBoundingClientRect();
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,view:S&&S.view,menu:S&&S.menu,orders:S?S.orders.slice():[],
    rect:tr||{x:sr.left,y:sr.top,w:sr.width,h:sr.height},cellPts:tool?tool.cellPts():[],toolOn:!!tool,toolDone:tool?tool.done:false,
    cards:[...tray.querySelectorAll('.rs-card')].map(b=>{const r=b.getBoundingClientRect();return{k:b.dataset.k,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,ok:HOT().includes(b)}}),hot,
    custPts:[...lobbyEl.querySelectorAll('.rs-lc')].map(b=>ctr(b)),cnt:S?Object.assign({},S.cnt):{},plate:S?JSON.parse(JSON.stringify(S.plate)):null,pot:S?S.pot.slice():[],basket:S?S.basketN:0,cp:S?S.cp.slice():[],
    toastHeat:S?S.toast.heat:0,eggCooked:S&&S.pan.cells?S.pan.cells.reduce((a,b)=>a+b,0)/S.pan.cells.length:0,flipped:S?S.pan.flip:false,flipT0:S?S.flipT0||0:0,
    nChicken:N_CHICKEN,nBread:N_BREAD,nFruit:N_FRUIT,particles:ptNow,particlePeak:ptPeak,particleMax:PART.max,
    alive:al?al.state():null,lobbyAlive:lobbyAl.length,misses,guide:G.state(),served:DATA.served,log:LOG.slice(),
    cust:{h:cb.height,w:cb.width,ratio:cb.height/(sr.height||1),big:!!(S&&S.custBig),bubble:!bubEl.hidden,bubW:bubEl.getBoundingClientRect().width,bubH:bubEl.getBoundingClientRect().height,two:bubEl.classList.contains('two')},
    side:S?S.sideId:null,ready:S?S.bg.ready.slice():[],
    stack:S&&S.menu==='burger'?{layers:S.bg.layers.slice(),next:STACK.find(k=>!S.bg.layers.includes(k))||null,items:STACK.map(k=>{const e=E['st_'+k];if(!e||e.classList.contains('hide'))return null;const r=e.getBoundingClientRect();return{k,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}}).filter(Boolean),plate:(()=>{const r=rectOf('bplate');return r?{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:null})()}:null,
    sauceN:S?S.bg.sauce.pts.length:0,glassFill:S?S.side.fill:0,nest:S?S.ps.nest:0,soft:S?S.ps.soft:0};
};
M.__rsDepth=()=>LV.map((l,i)=>{const v=levelInfo(i+1);const rows=v.menus.map(m=>{const p=planFor(m,v.twoOrders?'juice':null),work=p.filter(x=>HAND_OF[x.split(':')[0]]!=='choose'&&x!=='serve');
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
