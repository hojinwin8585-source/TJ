/* 말랑 피자가게 (P5-나) — 살아 있는 손님이 주문하면, 통째 재료부터 준비해서 만든 만큼 올리고, 구워서 건네줘요.
   쇠규칙(MLCFG.rules): 글자 없음 · '다음' 버튼 없음(과정이 끝나면 이음 장면 뒤 저절로) · 만든 만큼 쓰기(썬 조각 = 접시 = 피자 위) ·
   모든 재료에 준비 과정(칼 콕 / 병에서 톡 / 옥수수 쓱쓱 / 강판 쓱쓱 / 국자) · 세 구역(위 과정 그림 줄, 가운데 무대, 아래 도구 칸).
   동작은 콕과 쓱쓱(손가락을 따라오는 도구, ML.P2.makeTool), 카드 고르기뿐. 손님은 ML.Alive.
   숫자는 MLCFG.games.pizza(levels), rules, shell, touch(tool, trace, rub, tapLockMs), voice, calm 에서 읽습니다.
   단계: ML.Progress가 없으면 1단계 고정, 어른 설정의 '피자가게 단계'로 바꿈. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store,batchim,CNT_KO,CNT_EN}=M;
const {life,noise,sweepTone,SFX}=P;
const id='pizza',L=life(id),OL=A.OL,S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},PZ=(CF.games||{}).pizza||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},TRACE=TOUCH.trace||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{};
const LEVELS=PZ.levels&&PZ.levels.length?PZ.levels:[{level:1,scenes:['소스 쓱쓱','토핑 콕','굽기 콕'],toppings:['tomato']}];
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});   // the shared coverage numbers (salon tools)
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72;
const BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);   // '1.5초 이음 장면'
const TAP_LOCK=TOUCH.tapLockMs||1200;
/* not in config: pieces per ingredient by level (rules.madeEqualsUsed.pizza: "4번 썰면 4조각 … 단계가 오르면 5, 6조각") */
const PIECES=[4,5,6,6];
/* not in config: cups of flour and water for the dough */
const CUPS={flour:3,water:2};
const ALLTOPS=['tomato','mushroom','pepper','pepperoni','olive','corn','pineapple'];
/* rules.everyIngredientPrepared.prep: how each ingredient is made ready */
const PREP={tomato:'knife',mushroom:'knife',pepper:'knife',pepperoni:'knife',pineapple:'knife',olive:'jar',corn:'rub'};
const WHOLE_OF={tomato:'tomato',mushroom:'mushroom',pepper:'pepper',pepperoni:'salami',pineapple:'pineapple'};
/* piece size on the pizza (svg units; pizza diameter 2×PZR): every piece ≥ minPieceSize (16%) of the diameter */
const PZR=106,PR={tomato:20,mushroom:20,pepper:20,pepperoni:20,olive:19,pineapple:24};
const KINDS=(VO.animalNames||[{id:'bunny',ko:'토끼',en:'bunny',name:'토토'}]).filter(k=>A.KINDS[k.id]);
const T=t=>A.TOPPING[t]||{ko:t,en:t};
const eul=w=>w+(batchim(w)?'을':'를'),rang=w=>w+(batchim(w)?'이랑':'랑'),iya=w=>w+(batchim(w)?'이야':'야'),ege=w=>w+'에게';
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const LOG=[];

/* ============================== pictures (말랑 그림체, brown outline) ============================== */
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  steam:`<svg viewBox="0 0 30 60"><path d="M15 56Q5 46 15 36Q25 26 15 16Q8 9 14 2" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/></svg>`,
  flourCup:`<svg viewBox="0 0 100 100"><path d="M22 30Q30 8 50 14Q70 8 78 30Z" fill="#FFFDF6" ${S3}/><circle cx="40" cy="20" r="3" fill="#EFE6D6"/><circle cx="60" cy="22" r="2.5" fill="#EFE6D6"/><path d="M18 30H82L74 88Q50 96 26 88Z" fill="${PAL.sky||'#A7CFE8'}" ${S3}/><path d="M82 42Q96 44 94 58Q92 70 78 70" fill="none" ${S3}/><path d="M30 44Q30 70 36 82" stroke="#fff" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round"/></svg>`,
  waterCup:`<svg viewBox="0 0 100 100"><path d="M18 22H82L74 88Q50 96 26 88Z" fill="#E6F2FA" ${S3}/><path d="M22 44H78L73 86Q50 93 27 86Z" fill="#9FCDEB"/><path d="M82 34Q96 36 94 50Q92 62 78 62" fill="none" ${S3}/><path d="M30 50Q30 70 35 80" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/></svg>`,
  grater:`<svg viewBox="0 0 100 100"><path d="M38 6H62Q66 6 66 10V18H34V10Q34 6 38 6Z" fill="${PAL.peach||'#F2B48C'}" ${S3}/><path d="M30 18H70L80 92H20Z" fill="#DDE3EA" ${S3}/>${[30,44,58,72].map((y,r)=>[0,1,2].map(c=>`<path d="M${36+c*12+(r%2)*5} ${y}q4 -3 8 0" stroke="${OL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')).join('')}<g class="tf"><circle class="tf-eye" cx="43" cy="24" r="0"/></g></svg>`,
  cards:`<svg viewBox="0 0 100 100"><rect x="8" y="26" width="34" height="50" rx="9" fill="#FFFDF9" ${S3} transform="rotate(-10 25 51)"/><rect x="33" y="20" width="34" height="50" rx="9" fill="#FFFDF9" ${S3}/><rect x="58" y="26" width="34" height="50" rx="9" fill="#FFFDF9" ${S3} transform="rotate(10 75 51)"/><circle cx="50" cy="45" r="9" fill="#E8412F"/></svg>`,
  ovenMini:`<svg viewBox="0 0 100 100"><path d="M10 92V52Q10 12 50 12Q90 12 90 52V92Z" fill="#E07B4F" ${S3}/><path d="M28 92V64Q28 42 50 42Q72 42 72 64V92Z" fill="#2E1E1A" ${S3}/><path d="M38 90Q36 74 46 68Q46 78 52 78Q50 66 60 62Q64 78 62 90Z" fill="#FF9A2E"/></svg>`,
  bowlMini:`<svg viewBox="0 0 100 100"><path d="M8 44Q8 90 50 90Q92 90 92 44Z" fill="${PAL.sky||'#A7CFE8'}" ${S3}/><ellipse cx="50" cy="44" rx="42" ry="12" fill="#EAF5FC" ${S3}/><path d="M30 44Q50 22 70 44Z" fill="#FFFDF6"/></svg>`
};
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
/* corn kernels in a bunch of four (rules.everyIngredientPrepared.minPieceSize: 옥수수 알은 4알 묶음을 한 조각으로) */
function corn4(x,y,rot,b){return `<g transform="translate(${x} ${y}) rotate(${rot||0})">${[[-9.5,-10.5],[9.5,-10.5],[-9.5,10.5],[9.5,10.5]].map(([a,c])=>`<ellipse cx="${a}" cy="${c}" rx="9" ry="10.5" fill="${b?'#F2B42C':'#FFD23F'}" stroke="#C98A14" stroke-width="1.6"/><ellipse cx="${a-2.5}" cy="${c-3.5}" rx="2.6" ry="3.4" fill="#fff" opacity=".55"/>`).join('')}</g>`}
function topSVG(t,x,y,rot,b){return `<g class="pz-top" data-t="${t}">${t==='corn'?corn4(x,y,rot,b):A.F[t](x,y,PR[t]||18,rot,b)}</g>`}
const pieceIcon=(t,b)=>`<svg viewBox="-26 -26 52 52">${t==='corn'?corn4(0,0,0,b):A.F[t](0,0,PR[t]||18,0,b)}</svg>`;
/* whole ingredient pictures, viewBox -60 -60 120 120 */
function jarSVG(n,left){
  let s=`<path d="M-34 -30Q-40 -30 -40 -22V44Q-40 54 -30 54H30Q40 54 40 44V-22Q40 -30 34 -30Z" fill="#EAF4F2" fill-opacity=".85" ${S3}/><rect x="-30" y="-46" width="60" height="18" rx="6" fill="${PAL.sage||'#A9CFA0'}" ${S3}/>`;
  for(let k=0;k<left;k++){const x=-20+(k%3)*20,y=40-Math.floor(k/3)*22;s+=`<ellipse cx="${x}" cy="${y}" rx="10" ry="12" fill="#2E2A35" stroke="${OL}" stroke-width="2"/><ellipse cx="${x-3}" cy="${y-4}" rx="2.5" ry="3.5" fill="#fff" opacity=".4"/>`}
  return s+`<path d="M-30 -18Q-32 20 -26 44" stroke="#fff" stroke-width="5" opacity=".7" fill="none" stroke-linecap="round"/>`;
}
function cobSVG(rows,gone){   // gone[r]=true → that row's kernels are off (bare core)
  let s=`<path d="M-8 -54Q-30 -20 -24 40Q-20 58 -4 60" fill="#9CC48F" ${S3}/><path d="M8 -54Q30 -20 24 40Q20 58 4 60" fill="#8DB880" ${S3}/><ellipse cx="0" cy="0" rx="20" ry="54" fill="#F3E3B0" ${S3}/>`;
  for(let r=0;r<rows;r++){const y=-42+r*84/(rows-1);if(gone[r])continue;
    for(let c=-1;c<=1;c++){const w=20*Math.sqrt(Math.max(0,1-(y/56)**2));s+=`<ellipse cx="${(c*w*.62).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(w*.34).toFixed(1)}" ry="${(42/rows+2).toFixed(1)}" fill="#FFD23F" stroke="#C98A14" stroke-width="1.4"/>`}}
  return s+`<path d="M-26 50Q0 70 26 50" fill="#7DAE70" ${S3}/>`;
}
const wholeIcon=t=>t==='olive'?`<svg viewBox="-60 -60 120 120">${jarSVG(6,6)}</svg>`:t==='corn'?`<svg viewBox="-60 -60 120 120">${cobSVG(5,[])}</svg>`:A.wholeSVG(WHOLE_OF[t]||t,0);
const STEP_ICON={dough:ICON.bowlMini,knead:A.TOOL.hands,sauce:A.TOOL.ladle,cheese:ICON.grater,choose:ICON.cards,bake:ICON.ovenMini,slice:A.TOOL.wheel};
const stepIcon=st=>(st.k==='prep'||st.k==='top')&&!st.t?ICON.cards:st.k==='prep'?wholeIcon(st.t):st.k==='top'?pieceIcon(st.t):STEP_ICON[st.k]||'';

/* ============================== screen: the three zones (same structure as salon.js) ============================== */
const css=`
/* animal pictures outside ML.Alive (home host, etc.): slow blink and wave. These lived in the old pizza shop styles; kept so other screens look the same */
.ani-idle .eyes{animation:blink 4s infinite;transform-origin:100px 102px}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
.ani .wave{animation:wave .6s infinite alternate;transform-origin:140px 165px}
@keyframes wave{to{transform:rotate(-30deg)}}
#pizza{gap:6px}
#pizza .pz-head{flex:none;height:${HEAD_PX}px;gap:8px}
#pizza .pz-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#pizza .pz-back svg{width:100%;height:100%;display:block}
.pz-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.pz-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.pz-strip span svg{width:72%;height:72%;display:block}
.pz-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.pz-strip span.done{opacity:.9}
.pz-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.pz-strip span .st svg{width:100%;height:100%}
.pz-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC}
.pz-stage>div{position:absolute}
.pz-wall{left:0;right:0;top:0;height:34%;pointer-events:none}
.pz-wall svg,.pz-table svg{width:100%;height:100%;display:block}
.pz-table{left:0;right:0;top:34%;bottom:0;pointer-events:none;background:linear-gradient(180deg,#E9CDAA,#E2C29C);border-top:4px solid ${OL}}
.pz-shelf{left:4%;top:5%;display:flex;gap:2px;pointer-events:none}
.pz-shelf i{display:block;width:22px;height:22px}
.pz-shelf i svg{width:100%;height:100%}
.pz-cust{z-index:3;pointer-events:none}
.pz-cust svg{width:100%;height:100%;display:block;overflow:visible}
.pz-cust.enter{animation:pzin 1.2s cubic-bezier(.3,1.1,.5,1)}
@keyframes pzin{from{transform:translateX(120%)}to{transform:none}}
.pz-cust.leave{animation:pzout 1.1s ease-in forwards}
@keyframes pzout{to{transform:translateX(130%)}}
.pz-cust .ani-yum .chew{animation:pzchew .6s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 0}
@keyframes pzchew{to{transform:scaleY(.4)}}
.pz-cust.alive.pz-rub .al-arm-r{animation:pzrub 1.6s ease-in-out infinite}
@keyframes pzrub{0%,100%{transform:rotate(38deg)}50%{transform:rotate(54deg)}}
.pz-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:22px;padding:6px 8px;display:flex;align-items:center;gap:2px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.pz-bub::after{content:"";position:absolute;right:-14px;bottom:14px;border:8px solid transparent;border-left-color:${OL}}
.pz-bub svg{display:block}
.pz-main{z-index:2;transition:left .45s ease-in-out,top .45s ease-in-out,width .45s ease-in-out,height .45s ease-in-out,opacity .45s,transform .45s;pointer-events:none}
.pz-main>svg{width:100%;height:100%;display:block;overflow:visible}
.pz-main.out{opacity:0;transform:translateX(-24%) scale(.9)}
.pz-main.callme{animation:pzcall .7s ease-in-out}
@keyframes pzcall{0%,100%{filter:none}50%{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}}
.pz-oven{position:absolute;left:0;right:0;top:4%;bottom:0}
.pz-oven>svg{width:100%;height:100%;display:block}
.pz-peel{position:absolute;left:50%;width:46%;aspect-ratio:1;transform:translate(-50%,0);top:56%;transition:top 1s ease-in-out,width 1s ease-in-out,opacity .4s;z-index:2}
.pz-peel.in{top:54%;width:30%}
.pz-peel svg{width:100%;height:100%;display:block;overflow:visible}
.pz-plate{z-index:2;pointer-events:none;transition:opacity .4s}
.pz-plate>svg{position:absolute;inset:0;width:100%;height:100%}
.pz-pc{position:absolute;transition:transform .2s}
.pz-pc svg{width:100%;height:100%;display:block;overflow:visible}
.pz-pc.new{animation:pzpc .35s ease-out}
@keyframes pzpc{from{transform:scale(.4)}}
.pz-pc.lift{opacity:0}
.pz-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.pz-float{position:absolute;pointer-events:none;will-change:transform}
.pz-float svg{width:100%;height:100%;display:block;overflow:visible}
.pz-knife{position:absolute;z-index:21;pointer-events:none;transform-origin:20% 80%;filter:drop-shadow(0 4px 3px rgba(91,74,66,.2))}
.pz-knife svg{width:100%;height:100%;display:block}
.pz-knife.chop{animation:pzchop .45s ease-in-out}
@keyframes pzchop{0%,100%{transform:translateY(0) rotate(0)}45%{transform:translateY(16%) rotate(-10deg)}}
.pz-cup{position:absolute;z-index:21;pointer-events:none;transform-origin:70% 60%;animation:pzpour 1s ease-in-out forwards}
.pz-cup svg{width:100%;height:100%;display:block}
@keyframes pzpour{0%{transform:translateY(30%) rotate(0);opacity:0}25%{transform:translateY(0) rotate(0);opacity:1}55%,75%{transform:rotate(-70deg)}100%{transform:translateY(-20%) rotate(0);opacity:0}}
.pz-steam{position:absolute;width:24px;height:48px;z-index:22;pointer-events:none;animation:pzsteam 1.6s ease-out forwards}
.pz-steam svg{width:100%;height:100%}
@keyframes pzsteam{from{transform:translateY(0);opacity:.9}to{transform:translateY(-50px);opacity:0}}
.pz-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.pz-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.pz-tool svg{width:100%;height:100%;display:block}
.pz-tool.in{animation:pzcard .3s ease-out both}
.pz-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:12px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.pz-card svg{width:100%;height:100%;display:block;pointer-events:none}
.pz-card.in{animation:pzcard .3s ease-out both}
.pz-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.pz-card.fade{opacity:.35}
@keyframes pzcard{from{transform:translateY(24px);opacity:0}}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

const WALL=`<svg viewBox="0 0 100 34" preserveAspectRatio="none"><rect width="100" height="34" fill="#F3E7DC"/><rect y="24" width="100" height="10" fill="#EEDFD1"/>
  <rect x="34" y="4" width="22" height="15" rx="2.5" fill="#DCEBF0" stroke="#D9BFA6" stroke-width="1.4"/><path d="M45 4V19M34 11.5H56" stroke="#D9BFA6" stroke-width="1.2"/></svg>`;
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar pz-head"><button class="round pz-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="pz-strip" id="pzStrip"></div></div>
<div class="pz-stage" id="pzStage"><div class="pz-wall">${WALL}</div><div class="pz-shelf" id="pzShelf"></div><div class="pz-table"></div>
<div class="pz-cust" id="pzCust"></div><div class="pz-bub" id="pzBub" hidden></div><div class="pz-main" id="pzMain"></div><div class="pz-plate" id="pzPlate" hidden></div><div class="pz-fx" id="pzFx"></div></div>
<div class="pz-tray" id="pzTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='피자가게';
const $=s=>sec.querySelector(s);
const stage=$('#pzStage'),stripEl=$('#pzStrip'),custEl=$('#pzCust'),bubEl=$('#pzBub'),mainEl=$('#pzMain'),plateEl=$('#pzPlate'),fxEl=$('#pzFx'),tray=$('#pzTray'),shelfEl=$('#pzShelf');
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0},store.get('mallang_pizza',{}));
const save=()=>store.set('mallang_pizza',DATA);

/* ---------- level: ML.Progress if it exists, otherwise fixed at 1 (parent settings can change it) ---------- */
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
if(PRG())PRG().register(id,{max:LEVELS.length,name:'피자가게',seg:'setPizzaLv',seed:DATA.level});
function levelNo(){const pr=PRG();let n=pr?pr.get(id).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LEVELS.length,n))}
/* scenes of a level ('같음' = same as the level before) → which processes it has */
function levelInfo(n){
  let scenes=[],tops=['tomato'];
  LEVELS.slice(0,n).forEach(l=>{if(l.scenes&&!(l.scenes.length===1&&/같음/.test(l.scenes[0])))scenes=l.scenes;if(l.toppings&&l.toppings.length)tops=/모두/.test(l.toppings[0])?ALLTOPS.slice():l.toppings.slice()});
  const has=re=>scenes.some(s=>re.test(s));
  const order=LEVELS.slice(0,n).some(l=>/주문/.test(l.new||''));
  return{level:n,dough:has(/가루|물/),knead:has(/반죽/),cheese:has(/치즈/),choose:has(/고르기/),slice:has(/자르기/),order,pool:tops.filter(t=>A.TOPPING[t]&&PREP[t]),
    pieces:PIECES[Math.min(PIECES.length,n)-1],count:Math.min(2,tops.length)};
}
function planFor(lv,tops){
  const p=[];if(lv.dough)p.push({k:'dough'});if(lv.knead)p.push({k:'knead'});p.push({k:'sauce'});if(lv.cheese)p.push({k:'cheese'});if(lv.choose)p.push({k:'choose'});
  (tops||[]).forEach(t=>{p.push({k:'prep',t});p.push({k:'top',t})});
  if(lv.choose)for(let i=0;i<lv.count;i++){p.push({k:'prep',t:null,slot:i});p.push({k:'top',t:null,slot:i})}
  p.push({k:'bake'});if(lv.slice)p.push({k:'slice'});p.push({k:'serve'});return p;
}

/* ---------- state ---------- */
let lv=null,plan=[],pi=0,S=null,cust=null,al=null,H={},act=null,tool=null,gen=0,misses=0,lastMiss=0,flying=0,busy=false,lastTap=0,phase='',kind='wait';
const counts={};   // per ingredient: made (prepared pieces), placed (landed on the pizza)
const killTool=()=>{if(tool){tool.destroy();tool=null}};

/* ---------- layout: header 72px · stage · tray 18~22% of the screen (shell) ---------- */
let geo={m:0,mx:0,my:0,px:0,py:0,pw:0,ph:0,plate:false,oven:false};
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  const r=stage.getBoundingClientRect(),W=r.width,Hh=r.height;if(!W)return;
  const wallH=Hh*.34,ch=Math.min(wallH*.96,W*.42*230/200),cw=ch*200/230;
  Object.assign(custEl.style,{width:cw+'px',height:ch+'px',right:(W*.05)+'px',top:(wallH-ch*.93)+'px'});
  Object.assign(bubEl.style,{right:(W*.05+cw+10)+'px',top:(wallH*.18)+'px'});
  const tTop=wallH+8,tH=Hh-tTop-8,showPlate=!plateEl.hidden;geo.plate=showPlate;
  let m,mx,my;
  if(showPlate){
    const avail=W-24;m=Math.min(tH*.96,avail*.64);const pw=Math.max(112,Math.min(avail-m-8,tH*.62)),ph=Math.min(tH*.92,pw*1.7);
    mx=12+(avail-m-pw-8)/2;my=tTop+(tH-m)/2;const px=mx+m+8,py=tTop+(tH-ph)/2;
    Object.assign(plateEl.style,{left:px+'px',top:py+'px',width:pw+'px',height:ph+'px'});Object.assign(geo,{px,py,pw,ph});
  }else{m=Math.min(tH*.96,W*.84);mx=(W-m)/2;my=tTop+(tH-m)/2}
  Object.assign(mainEl.style,{left:mx+'px',top:my+'px',width:m+'px',height:m+'px'});Object.assign(geo,{m,mx,my});
  layoutPlate();
}
/* plate slots: 2 columns × 3 rows (up to 6 pieces) */
function slotRect(i){const c=i%2,r=Math.floor(i/2),cw=geo.pw/2,rh=geo.ph/3,sz=Math.min(cw,rh)*.78;return{x:cw*(c+.5)-sz/2,y:rh*(r+.5)-sz/2,sz}}
function layoutPlate(){plateEl.querySelectorAll('.pz-pc').forEach(e=>{const q=slotRect(+e.dataset.s);Object.assign(e.style,{left:q.x+'px',top:q.y+'px',width:q.sz+'px',height:q.sz+'px'})})}
const PLATE_BG=`<svg viewBox="0 0 100 170" preserveAspectRatio="none"><rect x="3" y="4" width="94" height="162" rx="44" fill="rgba(91,58,41,.14)"/><rect x="2" y="1" width="94" height="162" rx="44" fill="#FFFDF9" stroke="${OL}" stroke-width="2.6"/><rect x="12" y="12" width="74" height="140" rx="34" fill="#F1F2F4"/></svg>`;
plateEl.innerHTML=PLATE_BG;

/* coordinates: main picture uses viewBox -120 -120 240 240 */
const mainRect=()=>mainEl.getBoundingClientRect();
const toSvg=(cx,cy)=>{const r=mainRect();return[(cx-r.left)/r.width*240-120,(cy-r.top)/r.height*240-120]};
const toClient=(x,y)=>{const r=mainRect();return[r.left+(x+120)/240*r.width,r.top+(y+120)/240*r.height]};
const stXY=(cx,cy)=>{const s=stage.getBoundingClientRect();return[cx-s.left,cy-s.top]};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;
const onPizza=e=>{const [x,y]=toSvg(e.clientX,e.clientY);return Math.hypot(x,y)<=PZR+14};

/* ============================== drawing ============================== */
let raf=0;const rd=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})};
let cid=0;
function pizzaSVG(){
  const z=S.pz;let s=svgInner(`<svg>${A.pizza({r:z.r,sauce:z.sauce,cheese:z.cheese,tops:[],baked:z.baked,flour:z.flour})}</svg>`);
  if(!z.sauce&&S.sauceV){const c='pzs'+(++cid);s+=`<defs><clipPath id="${c}"><circle r="${z.r-12}"/></clipPath></defs><g clip-path="url(#${c})">`;
    S.sauceV.forEach((v,i)=>{if(v<=.02)return;const [x,y]=SAUCE_PTS[i];s+=`<path d="${A.blob(x,y,24,.35,7,i+5)}" fill="${z.baked?'#B8341F':'#D2412A'}" opacity="${Math.min(1,v*1.25).toFixed(2)}"/>`});s+='</g>'}
  s+=z.tops.map(([t,x,y,rot])=>topSVG(t,x,y,rot,z.baked)).join('');
  if(S.lines){S.lines.forEach((cut,i)=>{const a=LINE_A[i],ux=Math.cos(a)*(z.r+4),uy=Math.sin(a)*(z.r+4);
    s+=cut?`<line x1="${-ux}" y1="${-uy}" x2="${ux}" y2="${uy}" stroke="#F3E3C8" stroke-width="7" stroke-linecap="round"/><line x1="${-ux}" y1="${-uy}" x2="${ux}" y2="${uy}" stroke="#9A5E24" stroke-width="2.5" stroke-linecap="round"/>`
      :(phase==='slice'?`<line x1="${-ux}" y1="${-uy}" x2="${ux}" y2="${uy}" stroke="#FFFDF6" stroke-width="22" stroke-linecap="round" opacity=".38"/>`:'')})}
  return s;
}
function draw(){
  if(!S)return;const m=S.main;let s='';
  if(m==='pizza')s=pizzaSVG();
  else if(m==='bowl'){
    const b=S.bowl,f=b.flour/CUPS.flour,w=b.water/CUPS.water,lv=Math.min(1,f*.55+w*.45),k=.45+.55*lv,rx=92*k,ry=24*k,cy=-34+(1-lv)*14;
    s=`<ellipse cx="6" cy="104" rx="104" ry="14" fill="rgba(90,50,20,.18)"/><path d="M-108 -34Q-108 100 0 100Q108 100 108 -34Z" fill="${PAL.sky||'#A7CFE8'}" ${S3}/><path d="M-82 -4Q-74 64 -16 82" stroke="#fff" stroke-width="10" opacity=".5" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-34" rx="108" ry="30" fill="#93BEDA" ${S3}/><ellipse cx="0" cy="-34" rx="98" ry="25" fill="#EAF5FC"/>`;
    if(b.ball)s+=`<ellipse cx="0" cy="-46" rx="60" ry="34" fill="#F3D9A8" stroke="#C99A5E" stroke-width="3"/><ellipse cx="-18" cy="-58" rx="14" ry="7" fill="#fff" opacity=".5"/>`;
    else if(lv>0){s+=`<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${b.water?'#F2DDB2':'#FFF8EA'}"/>`;
      if(b.flour&&!b.water)s+=`<path d="M${-rx*.65} ${cy}Q0 ${cy-50*f} ${rx*.65} ${cy}Z" fill="#FFFDF6" stroke="#E9E1D2" stroke-width="2"/>`;
      if(b.water)s+=`<ellipse cx="16" cy="${cy+2}" rx="${rx*.4}" ry="${ry*.5}" fill="#BFE3FF" opacity=".9"/>`;
      if(b.swirl)s+=`<g transform="translate(0 ${cy}) scale(1 .26) rotate(${b.swirl})"><path d="M0 0C24 -34 60 -10 54 24C48 58 -12 70 -48 36" stroke="rgba(255,255,255,.8)" stroke-width="9" fill="none" stroke-linecap="round"/></g>`}
  }else if(m==='board'||m==='dough'){
    s=`<ellipse cx="6" cy="110" rx="112" ry="10" fill="rgba(90,50,20,.18)"/><rect x="-114" y="-96" width="228" height="200" rx="30" fill="#E9B67A" ${S3}/><path d="M-96 -46H96M-100 4H100M-96 54H96" stroke="rgba(150,95,40,.16)" stroke-width="4"/>`;
    if(m==='dough'){const d=S.dough,p=d.p,rx=58+44*p,ry=44+52*p;s+=`<ellipse cx="0" cy="${8+ry*.12}" rx="${rx}" ry="${ry*.92}" fill="rgba(120,70,30,.18)"/><ellipse cx="0" cy="4" rx="${rx}" ry="${ry*.92}" fill="#F5DCAB" stroke="#C99A5E" stroke-width="2.6"/><ellipse cx="${-rx*.3}" cy="${-ry*.3}" rx="${rx*.28}" ry="${ry*.15}" fill="#fff" opacity=".45"/>`;
      d.v.forEach((v,i)=>{if(v>=1)return;const [x,y]=DOUGH_PTS[i],R=A.rng(i*37+11),jx=(R()-.5)*16,jy=(R()-.5)*16;s+=`<ellipse cx="${((x+jx)*(.6+.4*p)).toFixed(1)}" cy="${((y+jy)*(.6+.4*p)).toFixed(1)}" rx="${(5*(1-v)+1.5).toFixed(1)}" ry="${(3.5*(1-v)+1).toFixed(1)}" fill="#DDB77A" opacity="${(.8*(1-v)).toFixed(2)}"/>`})}
    else{const b=S.board,t=b.t,N=lv.pieces,left=N-counts[t].made;
      if(PREP[t]==='knife'){const c='pzc'+(++cid),w=120*(left/N);s+=`<defs><clipPath id="${c}"><rect x="-60" y="-70" width="${w.toFixed(1)}" height="140"/></clipPath></defs><g transform="translate(-6 4) scale(1.5)"><g clip-path="url(#${c})">${svgInner(A.wholeSVG(WHOLE_OF[t],0))}</g></g>`}
      else if(PREP[t]==='jar')s+=`<g transform="translate(0 0) scale(1.55)">${jarSVG(N,left)}</g>`;
      else if(PREP[t]==='rub')s+=`<g transform="translate(0 2) rotate(0) scale(1.62)">${cobSVG(N,b.gone)}</g>`}
  }
  if(m!=='oven')mainEl.innerHTML=`<svg viewBox="-120 -120 240 240">${s}</svg>`;
}
function drawCust(mood){if(!cust)return;custEl.innerHTML=A.animal(cust.kind,mood||'idle',{});if(al)al.refresh()}
function renderPlate(fresh){
  plateEl.querySelectorAll('.pz-pc').forEach(e=>e.remove());
  S.plate.forEach((pc,i)=>{const e=document.createElement('div');e.className='pz-pc'+(fresh===pc.u?' new':'');e.dataset.s=i;e.dataset.u=pc.u;e.innerHTML=pieceIcon(pc.t);plateEl.appendChild(e)});layoutPlate();
}
function shelf(){shelfEl.innerHTML=Array.from({length:Math.min(5,DATA.served)},()=>`<i>${ICON.heart}</i>`).join('')}
function strip(){
  const items=plan.map((s,i)=>({s,i})).filter(o=>o.s.k!=='serve');const at=Math.max(0,items.findIndex(o=>o.i===pi));const idx=items.findIndex(o=>o.i>=pi);const c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5);
  stripEl.innerHTML=win.map(o=>`<span class="${o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.s)}${o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');void at;
}
function toolTray(html){tray.innerHTML=`<div class="pz-tool in">${html}</div>`;return tray.querySelector('.pz-tool')}
function bubble(){
  if(!cust){bubEl.hidden=true;return}const want=S.want;
  bubEl.innerHTML=want&&want.length?want.map(t=>`<span style="width:38px;height:38px">${pieceIcon(t)}</span>`).join(''):`<svg viewBox="-120 -120 240 240" width="40" height="40">${A.pizza({r:100,sauce:true,cheese:[],tops:[],baked:true})}</svg>`;
  bubEl.hidden=false;
}

/* ============================== touches ============================== */
function miss(){misses++;G.nudge();mainEl.classList.remove('callme');void mainEl.offsetWidth;mainEl.classList.add('callme');
  const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
stage.addEventListener('pointerdown',e=>{
  actx();if(!H.down)return;e.preventDefault();G.touch();
  const r=H.down(e);if(r===false){miss();return}
  if(H.move||H.up){try{stage.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId}
});
stage.addEventListener('pointermove',e=>{if(act===e.pointerId&&H.move)H.move(e)});
const endP=e=>{G.release();if(act!==e.pointerId)return;act=null;if(H.up)H.up(e)};
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,endP));
const alMood=(m,ms)=>{if(!al)return;al.setMood(m);if(ms){const g=gen;L.later(()=>{if(g===gen&&al&&phase!=='eat')al.setMood('')},ms)}};
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};
const rub=on=>custEl.classList.toggle('pz-rub',!!on);

/* the tool jumps out of the tray and says its name (touch.tool.intro) */
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
/* cells for the rubbing tools (fractions of the main picture) */
const disk=(n,R)=>{const out=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++){const x=-R+(c+.5)*2*R/n,y=-R+(r+.5)*2*R/n;if(Math.hypot(x,y)<=R*1.02)out.push([x,y])}return out};
const SAUCE_PTS=disk(7,PZR-16),DOUGH_PTS=disk(6,70),CHEESE_PTS=disk(7,PZR-18);
const LINE_A=[0,Math.PI/3,2*Math.PI/3],LINE_PTS=[];LINE_A.forEach((a,li)=>{for(let k=0;k<9;k++){const t=-.88+k*.22;LINE_PTS.push({li,x:Math.cos(a)*t*PZR,y:Math.sin(a)*t*PZR})}});
const frac=([x,y])=>[(x+120)/240,(y+120)/240];
/* one rubbing tool step through ML.P2.makeTool: the tool follows the finger, only touched cells change */
function rubTool(o){
  killTool();
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells.map(frac),target:mainRect,rub:o.rub,radius:o.radius,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[7,7]},o.cov||{})}),
    fx:o.fx,onMiss:miss,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log)},onRelease:()=>G.release(),
    onCell:(i,v,pv,why)=>{o.cell(i,v,pv,why);rd()},
    onProgress:(p,ratio,why)=>{if(why==='move'||why==='hold'){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}if(o.progress)o.progress(p,ratio)},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}
const tapOk=()=>{const n=performance.now();if(n-lastTap<260)return false;lastTap=n;return true};

/* ============================== processes ============================== */
const STEP={
  /* 가루와 물: 콕 하면 한 컵씩 */
  dough(){
    S.main='bowl';S.bowl={flour:0,water:0,swirl:0,ball:false};draw();size();kind='tap';let what='flour';
    const stopI=intro(ICON.flourCup,'밀가루!','Flour!');say('밀가루를 넣어요! 그릇을 콕 누르면 한 컵!','Tap the bowl for a cup of flour!',true);
    const pour=()=>{if(busy)return;busy=true;stopI();const r=mainRect(),sz=Math.max(120,r.width*.5),[x,y]=stXY(r.left+r.width*.62,r.top+r.height*.02);
      const c=document.createElement('div');c.className='pz-cup';c.innerHTML=what==='flour'?ICON.flourCup:ICON.waterCup;Object.assign(c.style,{width:sz+'px',height:sz+'px',left:(x-sz/2)+'px',top:(y-sz/2)+'px'});fxEl.appendChild(c);
      const g=gen;L.later(()=>{if(g!==gen)return;S.bowl[what]++;LOG.push('cup:'+what);const k=S.bowl[what];noise(.45,{type:what==='flour'?'bandpass':'lowpass',freq:what==='flour'?2600:900,vol:.12});draw();
        say(`${P.CNT_KO_UNIT(k)} 컵!`,`${cap(CNT_EN[k-1])} cup!`)},550);
      L.later(()=>{c.remove();busy=false;if(g!==gen)return;
        if(what==='flour'&&S.bowl.flour>=CUPS.flour){what='water';toolTray(ICON.waterCup);say('이번엔 물! 콕 누르면 한 컵!','Now water! Tap for a cup!',true)}
        else if(what==='water'&&S.bowl.water>=CUPS.water){H={};G.stop();kind='wait';say('빙글빙글 섞으면 반죽!','Stir, stir, it becomes dough!');stir(()=>finish())}},1050)};
    H={down:e=>{if(!inRect(e,mainRect(),10))return false;if(tapOk())pour()}};
    guideTap(0,-30,'그릇을 콕 눌러 봐!','Tap the bowl!');
  },
  /* 반죽 쓱쓱 (3단계부터) */
  knead(){
    S.main='dough';S.dough={p:0,v:DOUGH_PTS.map(()=>0)};draw();size();kind='rub';
    const stopI=intro(A.TOOL.hands,'손으로 쓱쓱!','Use your hands!');say('반죽을 손으로 쓱쓱 문질러서 넓게 펴요!','Rub the dough flat with your hands!',true);
    rubTool({icon:A.TOOL.hands,anchor:[.5,.6],gap:.3,effect:'rub',fx:()=>'',cells:DOUGH_PTS,grid:[6,6],log:'knead',stopIntro:stopI,sound:()=>sweepTone(200,150,.1,'sine',.12),
      cell:(i,v)=>{S.dough.v[i]=v},progress:p=>{S.dough.p=p},done:()=>{S.dough.p=1;draw();SFX.sparkle();say('넓적하게 펴졌어요!','Nice and flat!');finish()}});
    guideRub();
  },
  /* 소스: 국자로 떠서 쓱쓱 바르기 */
  sauce(){
    toPizza();S.sauceV=SAUCE_PTS.map(()=>0);draw();kind='rub';
    const stopI=intro(A.TOOL.ladle,'국자!','Ladle!');say('국자로 소스를 떠서 쓱쓱 발라요!','Scoop the sauce and rub it on!',true);
    rubTool({icon:A.TOOL.ladle,anchor:[.38,.72],gap:.45,cells:SAUCE_PTS,grid:[7,7],log:'sauce',stopIntro:stopI,
      fx:({wx,wy,x,y})=>`<circle cx="${x}" cy="${y}" r="16" fill="#D2412A" opacity=".25"/>${[0,1].map(k=>`<circle cx="${(wx+(k?6:-4)).toFixed(1)}" cy="${(wy+(y-wy)*((performance.now()/500+k*.5)%1)).toFixed(1)}" r="5" fill="#D2412A"/>`).join('')}`,
      cell:(i,v)=>{S.sauceV[i]=v},done:()=>{S.pz.sauce=true;S.sauceV=null;draw();SFX.sparkle();say('소스 완성! 빨갛게 됐어요!','Sauce is on!');alMood('happy',1200);finish()}});
    guideRub();
  },
  /* 치즈: 강판에 쓱쓱 갈기 */
  cheese(){
    toPizza();draw();kind='rub';let added=0;
    const stopI=intro(ICON.grater,'강판!','Grater!');say('치즈를 강판으로 쓱쓱 갈아요!','Grate the cheese! Rub rub!',true);
    const shred=(i,n)=>{const [x,y]=CHEESE_PTS[i];for(let k=0;k<n;k++)S.pz.cheese.push([+(x+(Math.random()-.5)*26).toFixed(1),+(y+(Math.random()-.5)*26).toFixed(1),rand(180)]);added+=n};
    rubTool({icon:ICON.grater,anchor:[.5,.92],gap:.5,cells:CHEESE_PTS,grid:[7,7],log:'cheese',stopIntro:stopI,
      fx:({wx,wy,y})=>Array.from({length:4},(_,k)=>{const t=(performance.now()/600+k/4)%1;return `<path transform="translate(${(wx-14+k*9).toFixed(1)} ${(wy+(y-wy)*t).toFixed(1)}) rotate(${k*40})" d="M-6 0q3 -3 6 0t6 0" stroke="#E2BE55" stroke-width="4" fill="none" stroke-linecap="round"/>`}).join(''),
      cell:(i,v,pv)=>{const a=Math.floor(pv*3),b=Math.floor(v*3);if(b>a)shred(i,b-a)},
      done:()=>{SFX.sparkle();say('치즈 듬뿍!','Lots of cheese!');alMood('happy',1200);finish()}});
    guideRub();
  },
  /* 재료 고르기: 카드 3장 (틀린 답 없음) */
  choose(){
    kind='cards';let round=0;S.chosen=[];
    const show=()=>{
      const pool=lv.pool.filter(t=>!S.chosen.includes(t));let three=shuffle(pool.slice()).slice(0,3);
      if(S.want){const w=S.want.find(t=>!S.chosen.includes(t));if(w&&!three.includes(w)){three[rand(three.length)]=w}}
      three=shuffle(three);tray.innerHTML=three.map((t,k)=>`<button class="pz-card in" data-t="${t}" aria-label="${T(t).ko}" style="animation-delay:${k*60}ms">${wholeIcon(t)}</button>`).join('');
      if(round===0)say('어떤 재료를 올릴까? 하나 골라 봐!','What goes on the pizza? Pick one!',true);else say('하나 더 골라 봐!','Pick one more!',true);
      G.start({type:'tap',wait:true,at:()=>{const b=tray.querySelector('.pz-card');if(!b)return[0,0];const r=b.getBoundingClientRect();return stXY(r.left+r.width/2,r.top+r.height/2)}});
    };
    let lock=0;
    tray.onclick=null;tray.onpointerdown=e=>{const b=e.target.closest('.pz-card');if(!b||phase!=='choose'||b.classList.contains('sel'))return;e.preventDefault();const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();
      const t=b.dataset.t;S.chosen.push(t);LOG.push('choose:'+t);b.classList.add('sel');tray.querySelectorAll('.pz-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();say(T(t).ko+'!',cap(T(t).en)+'!');alMood('wow',900);
      round++;const g=gen;
      L.later(()=>{if(g!==gen)return;if(round<lv.count)show();else{tray.onpointerdown=null;G.stop();
        plan.forEach(s=>{if((s.k==='prep'||s.k==='top')&&s.t==null)s.t=S.chosen[s.slot]});S.chosen.forEach(t=>{counts[t]=counts[t]||{made:0,placed:0}});finish()}},900)};
    show();
  },
  /* 준비: 칼로 콕 한 조각씩 / 병에서 톡 한 알씩 / 옥수수 쓱쓱 */
  prep(st){
    const t=st.t,N=lv.pieces,how=PREP[t];counts[t]=counts[t]||{made:0,placed:0};
    S.main='board';S.board={t,gone:Array(N).fill(false)};plateEl.hidden=false;renderPlate();draw();size();
    const add=(fromXY)=>{const pc={t,u:++cid};counts[t].made++;LOG.push('cut:'+t);const i=S.plate.length;S.plate.push(pc);
      const g=gen;size();const q=slotRect(i),pr=plateEl.getBoundingClientRect(),to=[pr.left+q.x+q.sz/2,pr.top+q.y+q.sz/2];flying++;
      fly(pieceIcon(t),fromXY,to,q.sz*.9,q.sz,420,()=>{flying--;if(g!==gen)return;renderPlate(pc.u)});draw();
      const k=counts[t].made;say(CNT_KO[k-1]+'!',cap(CNT_EN[k-1])+'!');
      if(k>=N){H={};G.stop();const g2=gen;L.later(()=>{if(g2!==gen)return;SFX.sparkle();say(`${T(t).ko} ${P.CNT_KO_UNIT(N)} 조각!`,`${cap(CNT_EN[N-1])} pieces of ${T(t).en}!`);finish()},700)}};
    if(how==='knife'){
      kind='tap';const stopI=intro(A.TOOL.knife,'칼!','Knife!');say(`${eul(T(t).ko)} 썰어요! 콕 누르면 한 조각!`,`Slice the ${T(t).en}! Tap for one piece!`,true);
      H={down:e=>{if(!inRect(e,mainRect(),8))return false;if(busy||counts[t].made>=N||!tapOk())return;busy=true;stopI();
        const r=mainRect(),sz=toolPx(),kn=document.createElement('div');kn.className='pz-knife chop';kn.innerHTML=A.TOOL.knife;const [x,y]=stXY(e.clientX,e.clientY);
        Object.assign(kn.style,{width:sz+'px',height:sz+'px',left:(x-sz*.25)+'px',top:Math.max(0,y-sz*.85)+'px'});fxEl.appendChild(kn);noise(.07,{freq:2600,vol:.25});
        const g=gen,edge=-60+120*((N-counts[t].made)/N);
        L.later(()=>{if(g!==gen)return;sfx.pop();const [cx,cy]=toClient(-6+1.5*edge-10,4);add([Math.min(cx,r.right-20),cy])},220);
        L.later(()=>{kn.remove();busy=false},480)}};
      guideTap(0,0,'콕! 한 번씩 눌러서 썰어 봐!','Tap to slice, one at a time!');
    }else if(how==='jar'){
      kind='tap';say('병에서 올리브를 꺼내요! 콕 누르면 한 알!','Tap the jar for one olive!',true);toolTray(wholeIcon('olive'));
      H={down:e=>{if(!inRect(e,mainRect(),8))return false;if(busy||counts[t].made>=N||!tapOk())return;busy=true;
        const left=N-counts[t].made-1,x=-20+(left%3)*20,y=40-Math.floor(left/3)*22;tone(900,.08,'sine',.15);
        const [cx,cy]=toClient(x*1.55,y*1.55);add([cx,cy]);const g=gen;L.later(()=>{if(g===gen)busy=false},380)}};
      guideTap(0,10,'병을 콕 눌러 봐!','Tap the jar!');
    }else{
      /* corn: rub the cob, each row of kernels comes off as one bunch of four */
      kind='rub';const rows=N,cells=[],grp=[];for(let r=0;r<rows;r++)for(let c=-1;c<=1;c++){cells.push([c*14*1.62,(-42+r*84/(rows-1))*1.62+2]);grp.push(r)}
      const v=cells.map(()=>0),rowDone=Array(rows).fill(false);
      const stopI=intro(A.TOOL.hands,'옥수수!','Corn!');say('옥수수를 쓱쓱 문질러서 알을 떼요!','Rub the corn to get the kernels off!',true);LOG.push('prep:corn:rub');
      const check=r=>{if(rowDone[r])return;if(cells.every((_,i)=>grp[i]!==r||v[i]>=1)){rowDone[r]=true;S.board.gone[r]=true;const y=(-42+r*84/(rows-1))*1.62+2,[cx,cy]=toClient(0,y);add([cx,cy])}};
      rubTool({icon:A.TOOL.hands,anchor:[.5,.6],gap:.3,effect:'rub',fx:()=>'',cells,grid:[9,9],log:'corn',stopIntro:stopI,cov:{radiusRatio:.11},
        cell:(i,val)=>{v[i]=val;check(grp[i])},done:()=>{for(let r=0;r<rows;r++){cells.forEach((_,i)=>{if(grp[i]===r)v[i]=1});check(r)}}});
      guideRub();
    }
  },
  /* 올리기: 접시의 조각을 콕(또는 끌기) → 피자로. 접시가 빌 때까지 */
  top(st){
    const t=st.t;toPizza(true);draw();kind='tap';
    say(`접시의 ${eul(T(t).ko)} 콕 누르면 피자로 날아가요!`,`Tap the plate to put the ${T(t).en} on the pizza!`,true);
    let drag=null;
    const launch=(pc,from,svgAt)=>{
      const i=S.plate.indexOf(pc);if(i<0)return;S.plate.splice(i,1);renderPlate();flying++;counts[t].launched=(counts[t].launched||0)+1;
      const at=svgAt||nextSpot(t),to=toClient(at[0],at[1]),szTo=mainRect().width*(2*(PR[t]||18)+4)/240,g=gen,rot=rand(360);
      fly(pieceIcon(t),from,to,szTo*1.2,szTo,520,()=>{flying--;if(g!==gen)return;S.pz.tops.push([t,+at[0].toFixed(1),+at[1].toFixed(1),rot]);counts[t].placed++;LOG.push('put:'+t);draw();sfx.pop();
        const k=counts[t].placed;say(CNT_KO[k-1]+'!',cap(CNT_EN[k-1])+'!');alMood('wow',700);   // 토핑을 올릴 때마다 눈이 커짐
        if(!S.plate.length&&!flying){H={};G.stop();const g2=gen;L.later(()=>{if(g2!==gen)return;SFX.sparkle();alPlay('clap');say('다 올렸어요! 접시가 비었네!','All on! The plate is empty!');finish(()=>{plateEl.hidden=true;size()})},500)}});
    };
    const pcAt=e=>{const el=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains('pz-pc'));return el?S.plate.find(p=>p.u===+el.dataset.u):null};
    H={
      down:e=>{if(!S.plate.length)return;
        if(inRect(e,plateEl.getBoundingClientRect(),6)){const pc=pcAt(e)||S.plate[S.plate.length-1];drag={pc,x0:e.clientX,y0:e.clientY,f:null};return}
        if(onPizza(e)){if(!tapOk())return;const [x,y]=toSvg(e.clientX,e.clientY),d=Math.hypot(x,y),R=PZR-30,k=d>R?R/d:1,pc=S.plate[S.plate.length-1],el=plateEl.querySelector(`.pz-pc[data-u="${pc.u}"]`),r=el?el.getBoundingClientRect():plateEl.getBoundingClientRect();
          launch(pc,[r.left+r.width/2,r.top+r.height/2],[x*k,y*k]);return}
        return false},
      move:e=>{if(!drag)return;if(!drag.f&&Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>12){const el=plateEl.querySelector(`.pz-pc[data-u="${drag.pc.u}"]`);if(el)el.classList.add('lift');
          const sz=el?el.getBoundingClientRect().width:60;drag.f=document.createElement('div');drag.f.className='pz-float';drag.f.innerHTML=pieceIcon(t);Object.assign(drag.f.style,{width:sz+'px',height:sz+'px'});drag.sz=sz;fxEl.appendChild(drag.f)}
        if(drag.f){const [x,y]=stXY(e.clientX,e.clientY);drag.f.style.left=(x-drag.sz/2)+'px';drag.f.style.top=(y-drag.sz/2)+'px'}},
      up:e=>{const d=drag;drag=null;if(!d)return;
        if(d.f){d.f.remove();let at=null;if(e.type!=='pointercancel'&&onPizza(e)){const [x,y]=toSvg(e.clientX,e.clientY),dd=Math.hypot(x,y),R=PZR-30,k=dd>R?R/dd:1;at=[x*k,y*k]}launch(d.pc,[e.clientX,e.clientY],at)}   // 어디에 놓아도 피자로 날아감
        else{if(!tapOk())return;const el=plateEl.querySelector(`.pz-pc[data-u="${d.pc.u}"]`),r=el?el.getBoundingClientRect():plateEl.getBoundingClientRect();launch(d.pc,[r.left+r.width/2,r.top+r.height/2],null)}}
    };
    G.start({type:'tap',at:()=>{const el=plateEl.querySelector('.pz-pc:last-child'),r=(el||plateEl).getBoundingClientRect();return stXY(r.left+r.width/2,r.top+r.height/2)},ko:'접시를 콕 눌러 봐!',en:'Tap the plate!'});
  },
  /* 굽기: 콕 → 화덕에 쏙 → 지글지글 → 띵 → 콕 → 꺼냄 */
  bake(){
    S.main='oven';plateEl.hidden=true;size();kind='tap';rub(true);
    mainEl.innerHTML=`<div class="pz-oven">${A.oven(false)}</div><div class="pz-peel"><svg viewBox="-120 -120 240 240">${pizzaSVG()}</svg></div>`;
    const stopI=intro(A.TOOL.peel,'화덕!','Oven!');say('뜨거운 화덕에 넣어요! 콕!','Tap to put it in the hot oven!',true);let stg=0;
    const peel=()=>mainEl.querySelector('.pz-peel');
    const takeOut=()=>{if(stg!==2)return;stg=3;G.stop();const p=peel();if(p)p.classList.remove('in');
      for(let k=0;k<3;k++){const s=document.createElement('div');s.className='pz-steam';s.innerHTML=ICON.steam;const r=mainRect(),[x,y]=stXY(r.left+r.width*(.4+k*.1),r.top+r.height*.5);s.style.left=x+'px';s.style.top=y+'px';s.style.animationDelay=(k*.15)+'s';fxEl.appendChild(s);setTimeout(()=>s.remove(),2000)}
      const g=gen;L.later(()=>{if(g!==gen)return;rub(false);alMood('wow',1400);alPlay('hop');say('음~ 고소한 냄새!','Mmm, smells great!');finish()},900)};
    const putIn=()=>{if(stg!==0)return;stg=1;G.stop();stopI();const p=peel();if(p)p.classList.add('in');sweepTone(300,200,.4,'sine',.1);
      const g=gen;L.later(()=>{if(g!==gen)return;mainEl.querySelector('.pz-oven').innerHTML=A.oven(true);noise(2.6,{type:'bandpass',freq:3000,q:.5,vol:.06});say('지글지글…','Sizzle sizzle…');
        [0,1,2].forEach(j=>L.later(()=>{if(g!==gen)return;say(['셋','둘','하나'][j],['three','two','one'][j]);tone(700,.08,'sine',.06)},900+j*900));
        L.later(()=>{if(g!==gen)return;S.pz.baked=true;const p2=peel();if(p2)p2.innerHTML=`<svg viewBox="-120 -120 240 240">${pizzaSVG()}</svg>`;SFX.ding();
          say('띵! 다 구워졌어요! 콕 눌러서 꺼내요.','Ding! Tap to take it out!');stg=2;guideTap(0,30,'콕 눌러서 꺼내 봐!','Tap to take it out!')},3800)},1100)};
    H={down:e=>{if(!inRect(e,mainRect(),10))return false;if(!tapOk())return;if(stg===0)putIn();else if(stg===2)takeOut()}};
    guideTap(0,40,'화덕을 콕 눌러 봐!','Tap the oven!');
  },
  /* 자르기: 피자 칼 도구를 움직여 지나간 선이 잘림 (굵은 길, 근처만 가도 인정, touch.trace) */
  slice(){
    toPizza();S.lines=[false,false,false];phase='slice';draw();kind='rub';let cut=0;
    const stopI=intro(A.TOOL.wheel,'피자 칼!','Pizza cutter!');say('피자 칼을 쭉 굴려서 잘라요!','Roll the pizza cutter across!',true);
    const v=LINE_PTS.map(()=>0);
    rubTool({icon:A.TOOL.wheel,anchor:[.4,.4],gap:.15,cells:LINE_PTS.map(p=>[p.x,p.y]),grid:[5,5],log:'slice',stopIntro:stopI,effect:'cut',fx:()=>'',
      radius:(h,t)=>t.width*(TRACE.pathWidthRatio||.18)*(1+(TRACE.countsWithinRatio||.4)),
      rub:{tapChunk:TRACE.tapAlsoAdvances==null?.12:TRACE.tapAlsoAdvances,holdProgressPerSec:TRACE.creepWhileTouchingPerSec==null?.05:TRACE.creepWhileTouchingPerSec},
      cov:{doneAt:TRACE.autoFinishAt||.9},sound:()=>noise(.08,{freq:1800,q:.8,vol:.08}),
      cell:(i,val)=>{v[i]=val;const li=LINE_PTS[i].li;if(!S.lines[li]&&LINE_PTS.every((p,j)=>p.li!==li||v[j]>=1)){S.lines[li]=true;cut++;sweepTone(500,300,.25,'triangle',.08);say(`${P.CNT_KO_UNIT(cut*2)} 조각!`,`${cap(CNT_EN[cut*2-1])} slices!`)}},
      done:()=>{S.lines=[true,true,true];draw();SFX.sparkle();say('여섯 조각 완성!','Six slices!');finish()}});
    G.start({type:'swipe',at:()=>{const r=mainRect();return stXY(r.left+r.width/2,r.top+r.height/2)},span:70,ko:'피자 칼을 쭉 움직여 봐!',en:'Move the cutter across!'});
  },
  /* 끝내기: 콕 → 손님에게 건네줌 → 냠냠 → 춤 → 하트 → 안녕 */
  serve(){
    toPizza();draw();kind='tap';tray.innerHTML='';rub(false);
    say(`완성! 콕 눌러서 ${ege(cust.name)} 줘요!`,`All done! Tap to give it to ${cust.name}!`,true);
    H={down:e=>{if(!onPizza(e)&&!inRect(e,custEl.getBoundingClientRect()))return false;H={};G.stop();give()}};
    guideTap(0,0,'피자를 콕 눌러 봐!','Tap the pizza!');
  }
};
const toolPx=()=>{const t=TOUCH.tool||{},w=stage.getBoundingClientRect().width;return Math.min(t.maxPx||300,Math.max(t.minPx||180,w*(t.stageWidthRatio||.45)))};
function toPizza(keepPlate){S.main='pizza';if(!S.pz.r)S.pz.r=PZR;if(!keepPlate)plateEl.hidden=true;size()}
/* the next free spot on the pizza (sunflower pattern, so pieces spread out) */
/* each ingredient takes every count-th slot, so both kinds spread over the whole pizza */
function nextSpot(t){const kinds=plan.filter(s=>s.k==='top').map(s=>s.t),ki=Math.max(0,kinds.indexOf(t)),N=Math.max(4,lv.pieces*kinds.length),n=(counts[t].launched-1)*kinds.length+ki,k=(n%N)+.5,r=(PZR-30)*Math.sqrt(k/N),a=n*2.39996+S.spin;return[Math.cos(a)*r,Math.sin(a)*r]}
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='pz-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-40}px) scale(${(1+k)/2})`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}
  catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);   // even if the animation never finishes (hidden tab), the count stays right
}
function guideTap(x,y,ko,en){G.start({type:'tap',at:()=>{const [cx,cy]=toClient(x,y);return stXY(cx,cy)},ko,en})}
function guideRub(){const st=plan[pi];G.start({type:'scrub',at:()=>{const r=mainRect();return stXY(r.left+r.width/2,r.top+r.height/2)},ko:'쓱쓱 문질러 봐!',en:'Rub rub!'});void st}

/* after a process: short link scene (1.5 s), then the next one by itself */
function finish(between){
  H={};kind='wait';const g=gen,st=plan[pi];LOG.push('done:'+st.k+(st.t?':'+st.t:''));alPlay('hop');
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    const nx=plan[pi+1];const swap=nx&&(nx.k==='prep'||nx.k==='bake'||(nx.k==='sauce'&&S.main!=='pizza')||(nx.k==='knead'));if(swap){mainEl.classList.add('out')}
    L.later(()=>{if(g!==gen)return;mainEl.classList.remove('out');pi++;run()},swap?Math.round(BRIDGE_MS*.45):Math.round(BRIDGE_MS*.3))},Math.round(BRIDGE_MS*.55));
}
/* the stirring link scene after the water */
function stir(then){const g=gen,t0=performance.now();let rf=0;L.onEnd(()=>cancelAnimationFrame(rf));const tick=()=>{rf=0;if(g!==gen||!S||S.main!=='bowl')return;const p=(performance.now()-t0)/1100;S.bowl.swirl=p*900;if(p>=1){S.bowl.ball=true;S.bowl.swirl=0;draw();
  sweepTone(260,180,.2,'sine',.1);if(then)then();return}draw();rf=requestAnimationFrame(tick)};rf=requestAnimationFrame(tick)}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const st=plan[pi];if(!st)return;phase=st.k;strip();size();G.place();
  STEP[st.k](st);
}

/* ---------- ending ---------- */
const BITE=`<svg viewBox="0 0 60 70"><path d="M8 8L52 8L30 64Z" fill="#F0C27A" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 13L47 13L30 56Z" fill="#D2412A"/><path d="M15 15L45 15L30 50Z" fill="#FFE07A" opacity=".85"/><circle cx="26" cy="22" r="5" fill="#E8412F"/><circle cx="35" cy="31" r="4" fill="#E8412F"/></svg>`;
function give(){
  phase='eat';kind='wait';LOG.push('serve');const g=gen;
  drawCust('yum');if(al)al.setMood('');alPlay('hop');say('냠냠냠! 맛있어!','Nom nom! Yummy!');
  const bite=()=>{if(g!==gen)return;const r=mainRect(),cr=custEl.getBoundingClientRect();fly(BITE,[r.left+r.width*.5,r.top+r.height*.35],[cr.left+cr.width*.5,cr.top+cr.height*.62],r.width*.3,cr.width*.22,700,()=>{if(g===gen)SFX.chomp()})};
  bite();L.later(bite,1000);L.later(bite,2000);
  L.later(()=>{if(g!==gen)return;const got=!S.want||S.want.every(t=>S.pz.tops.some(x=>x[0]===t));drawCust('happy');alPlay('dance');
    say(got&&S.want?'내가 주문한 피자야! 고마워!':'음~ 정말 맛있어! 고마워!',got&&S.want?'Just what I ordered! Thank you!':'Mmm, so yummy! Thank you!');
    L.later(()=>{if(g!==gen)return;heart()},2500)},3000);
}
function heart(){
  const cr=custEl.getBoundingClientRect(),sr=shelfEl.getBoundingClientRect(),g=gen,n=Math.min(5,DATA.served+1)-1;
  fly(ICON.heart,[cr.left+cr.width*.4,cr.top+cr.height*.6],[sr.left+11+n*24,sr.top+11],60,22,900,()=>{if(g!==gen)return;DATA.served++;save();shelf();SFX.sparkle();const pr=PRG();if(pr)pr.clear(id)});
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('안녕! 또 올게!','Bye! See you again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');bubEl.hidden=true;mainEl.classList.add('out');
      L.later(()=>{if(g===gen)newCustomer()},1400)},1500)},1000);
}

/* ---------- a customer comes in ---------- */
function newCustomer(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.innerHTML='';tray.onpointerdown=null;busy=false;flying=0;rub(false);
  lv=levelInfo(levelNo());Object.keys(counts).forEach(k=>delete counts[k]);
  const prev=cust&&cust.kind,k=pick(KINDS.filter(x=>x.id!==prev).length?KINDS.filter(x=>x.id!==prev):KINDS);cust={kind:k.id,name:k.name||k.ko,en:k.en};
  const fixed=lv.choose?null:lv.pool.slice(0,lv.count);
  const want=lv.order?shuffle(lv.pool.slice()).slice(0,lv.count):fixed;
  S={main:'none',pz:{r:lv.dough?0:PZR,sauce:false,cheese:[],tops:[],baked:false,flour:!lv.dough},plate:[],want:want&&want.length?want:null,spin:Math.random()*6.28,lines:null,sauceV:null};
  if(fixed)fixed.forEach(t=>{counts[t]={made:0,placed:0}});
  plan=planFor(lv,fixed);pi=0;phase='enter';kind='wait';LOG.push('level:'+lv.level,'customer:'+cust.kind);
  plateEl.hidden=true;renderPlate();mainEl.innerHTML='';mainEl.classList.remove('out');
  if(lv.dough){S.main='bowl';S.bowl={flour:0,water:0,swirl:0,ball:false}}else S.main='pizza';
  size();draw();strip();shelf();
  if(al){al.detach();al=null}drawCust('idle');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:cust.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');bubEl.hidden=true;
  const g=gen;
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubble();
    const nm=S.want?(S.want.length>1?rang(T(S.want[0]).ko)+' '+T(S.want[1]).ko:T(S.want[0]).ko)+' 피자':'맛있는 피자',en=S.want?S.want.map(t=>T(t).en).join(' and ')+' pizza':'a yummy pizza';
    say(`안녕! 나는 ${iya(cust.name)}. ${nm} 주세요!`,`Hi! I'm ${cust.name}. ${cap(en)}, please!`)},1200);
  L.later(()=>{if(g!==gen)return;run()},3600);
}

/* ---------- parent settings: pizza level (ML.Progress가 있으면 그 '놀이별 단계' 줄, 없을 때만 이 줄) ---------- */
M.__pzLevel=n=>{if(PRG())PRG().set(id,n);else{DATA.level=n;save()}if(cur()===id)newCustomer();return levelNo()};
(()=>{const sh=document.querySelector('#settings .sheet'),h4=sh&&sh.querySelector('h4');if(!h4||PRG())return;
  const row=document.createElement('div');row.className='row';row.innerHTML=`<span>피자가게 단계</span><div class="seg" id="setPizzaLv">${LEVELS.map(l=>`<button data-v="${l.level}">${l.level}</button>`).join('')}</div>`;sh.insertBefore(row,h4);
  const seg=row.querySelector('.seg'),sync=()=>seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===levelNo()));
  seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;DATA.level=+b.dataset.v;save();sync()});sync();
  M.__pzLevel=n=>{DATA.level=n;save();sync();if(cur()===id)newCustomer();return levelNo()};})();

/* ---------- test hooks ---------- */
const HAND={dough:'tap',knead:'rub',sauce:'rub',cheese:'rub',choose:'choose',top:'tap',bake:'tap',slice:'move',serve:'tap'};
M.__pzDepth=()=>LEVELS.map((l,i)=>{const v=levelInfo(i+1),p=planFor(v,v.choose?[]:v.pool.slice(0,v.count)).filter(s=>s.k!=='serve');
  const steps=v.choose?planFor(v,null).filter(s=>s.k!=='serve'):p,hands=new Set();steps.forEach(s=>{if(s.k==='prep'){const pool=v.choose?v.pool:v.pool.slice(0,v.count);pool.forEach(t=>hands.add(PREP[t]==='rub'?'rub':'tap'))}else hands.add(HAND[s.k])});
  return{level:i+1,processes:new Set(steps.map(s=>s.k)).size,steps:steps.length,hands:[...hands],someone:!!M.Alive,choice:v.choose,ending:true,order:v.order}});
M.__pzPrep=()=>({prep:Object.assign({},PREP),tops:ALLTOPS.slice(),pieceR:Object.assign({},PR,{corn:'4알 묶음'}),pizzaR:PZR});
/* every topping drawn as it sits on the pizza: its size against the pizza diameter (rules.everyIngredientPrepared.minPieceSize) */
M.__pzPieceSizes=()=>{const NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('viewBox','-120 -120 240 240');sv.style.cssText='position:fixed;left:-500px;top:0;width:240px;height:240px';document.body.appendChild(sv);
  const out={};ALLTOPS.forEach(t=>{sv.innerHTML=topSVG(t,0,0,0,false);const b=sv.querySelector('.pz-top').getBBox();out[t]=+(Math.min(b.width,b.height)/(2*PZR)).toFixed(3)});sv.remove();return out};
M.__pz=()=>{
  const st=plan[pi]||{},r=mainEl.getBoundingClientRect(),aim=(()=>{
    if(kind==='tap'){if(phase==='top'){const el=plateEl.querySelector('.pz-pc:last-child');const q=(el||plateEl).getBoundingClientRect();return[q.left+q.width/2,q.top+q.height/2]}
      if(phase==='bake'||phase==='serve'||phase==='prep'||phase==='dough')return[r.left+r.width/2,r.top+r.height*(phase==='bake'?.6:.5)]}
    return[r.left+r.width/2,r.top+r.height/2]})();
  return{level:lv?lv.level:levelNo(),plan:plan.map(s=>s.k+(s.t?':'+s.t:'')),pi,phase,step:st.k||null,t:st.t||null,kind,busy,aim,
    rect:{x:r.left,y:r.top,w:r.width,h:r.height},pizzaPx:r.width*2*PZR/240,
    plate:S?S.plate.length:0,plateShown:!plateEl.hidden,flying,tops:S?S.pz.tops.length:0,topsBy:S?S.pz.tops.reduce((o,x)=>(o[x[0]]=(o[x[0]]||0)+1,o),{}):{},
    counts:JSON.parse(JSON.stringify(counts)),want:S&&S.want,chosen:S&&S.chosen,cards:[...tray.querySelectorAll('.pz-card')].map(b=>b.dataset.t),
    cust:cust&&cust.kind,alive:al?al.state():null,served:DATA.served,misses,guide:G.state(),log:LOG.slice(),
    sauce:S?S.pz.sauce:false,cheese:S?S.pz.cheese.length:0,baked:S?S.pz.baked:false,lines:S&&S.lines,toolOn:!!tool,rubbing:custEl.classList.contains('pz-rub')};
};
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newCustomer()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.onpointerdown=null;if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
})();
