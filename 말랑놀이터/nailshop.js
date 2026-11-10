/* 네일숍 (P11) — 가게 앞에서 손님을 고르고, 진짜 네일숍처럼 갈기 · 베이스 · 색 젤 · 램프에 굽기 · 그림 · 도장 · 파츠 · 탑젤 · 오일 (만 2세 기준)
   동작은 콕, 쓱쓱, 카드 고르기(손톱에 끌어다 놓아도 됨). 칠하기 도구는 ML.P2.makeTool 칸 방식(손톱 모양 안의 닿은 칸만 바뀜).
   끝내기는 아이가 거울 버튼을 눌러야 끝나요. 숫자와 문구는 MLCFG.games.nailshop, games.petsalon(lobby, tools, dressing, itemUnlock), calm, touch 에서 읽습니다. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!A.HAND||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,shuffle,cap,games,actx,store,batchim}=M;
const {life,noise,SFX}=P;
const id='nailshop',L=life(id),H=A.HAND,OL=A.OL,S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG,CALM=CF.calm,PAL=CALM.palette,VO=CF.voice;
const NS=(CF.games||{}).nailshop||{},PS=(CF.games||{}).petsalon||{};
const STEPS=NS.steps||{},LEVELS=NS.levels||[{level:1,steps:['color','cure','parts'],colors:3,parts:3}],CUSTS=NS.customers||[],NV=NS.voice||{};
const LOB=PS.lobby||{},TOOLS=PS.tools||{},COV=TOOLS.coverage||{},DRS=PS.dressing||{},UNL=PS.itemUnlock||{};
const WAITING=LOB.waiting||3,IDLE_HINT=DRS.idleHintMs||30000,MIRROR_AFTER=8000,ZOOM_MS=400;   // finish.button: 8초, view.zoom: 0.4초
const CURE_S=(STEPS.cure||{}).seconds||5,EVERY=UNL.everyCustomers||3,BLOOM=(CALM.colorPolicy||{}).bloomMs||600;
const COLORS=CALM.choiceColors.map(c=>({ko:c.ko,en:c.en,hex:c.hex,light:c.light,vivid:c.vivid}));
const SHAPES=(STEPS.stamp||{}).shapes||['heart','star','flower','dots','stripes','moon'];
const PARTS=(STEPS.parts||{}).items||['round gem','heart gem','pearl','tiny ribbon','star stud','flower part'];
const NAMES_KO={heart:'하트',star:'별',flower:'꽃',dots:'물방울 점',stripes:'줄무늬',moon:'달','round gem':'동그란 보석','heart gem':'하트 보석',pearl:'진주','tiny ribbon':'작은 리본','star stud':'별 장식','flower part':'꽃 장식'};
const NAMES_EN={dots:'polka dots',stripes:'stripes','star stud':'star stud','flower part':'flower'};
const LOG=[];
const praise=(ko,en)=>{const p=M.nextPraise();return[ko?ko+' '+p[0]:p[0],en?en+' '+p[1]:p[1]]};
const sayL=l=>{if(l)say(l[0],l[1])};
const iya=w=>w+(batchim(w)?'이야':'야');
const LINE={
  lobby:['누구 손톱을 예쁘게 해 줄까? 손님을 콕 눌러 봐!','Whose nails shall we do? Tap a guest!'],
  comeIn:{mom:['엄마, 어서 오세요!','Come in, Mommy!'],bunnyPaw:['토토야, 들어와!','Come in, Toto!'],baby:['아기야, 들어와!','Come in, baby!'],family:['어서 오세요!','Come in, everyone!']},
  want:c=>[`${c.ko} 색으로 해 주세요!`,`${cap(c.en)}, please!`],
  likeIt:c=>[`${iya(c.ko)}! 내가 좋아하는 색이야!`,`${cap(c.en)}! My favorite!`],
  prettyToo:['이것도 예쁘다!','This one is pretty too!'],
  base:['투명한 젤을 쓱쓱 발라요','Brush on the clear base gel!'],
  lamp:['램프를 콕 눌러 봐!','Tap the lamp!'],
  art:['손톱을 콕! 크게 해서 손가락으로 그림을 그려요','Tap a nail, then draw with your finger!'],
  stamp:['손톱을 콕! 모양 도장을 쿡 찍어요','Tap a nail, then stamp a shape!'],
  parts:['손톱을 콕! 보석을 골라서 붙여요','Tap a nail, then pick a gem!'],
  oil:['스포이트로 오일을 톡! 쓱쓱 문질러요','A drop of oil, then rub rub!'],
  blow:['후~','Whoo~'],
  wow:['우와! 예쁘다!','Wow, so pretty!'],
  thanks:['고마워!','Thank you!']
};
const STEP_LINE=k=>NV[k]||LINE[k]||[(STEPS[k]||{}).ko||'',(STEPS[k]||{}).en||''];

/* ---------- level: ML.Progress if it exists, otherwise fixed at 1 (parent settings can change it) ---------- */
const DATA=Object.assign({level:1,served:0,wall:[],seen:[]},store.get('mallang_nailshop',{}));
if(!Array.isArray(DATA.wall))DATA.wall=[];if(!Array.isArray(DATA.seen))DATA.seen=[];
const save=()=>store.set('mallang_nailshop',DATA);
const PR=()=>M.Progress&&typeof M.Progress.level==='function'?M.Progress:null;
function levelNo(){const pr=PR();let n=pr?pr.level(id):DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LEVELS.length,n))}
/* a level row, with missing numbers taken from the rows before it */
function LV(){
  const n=levelNo(),o={};LEVELS.slice(0,n).forEach(r=>Object.keys(r).forEach(k=>{if(k!=='new')o[k]=r[k]}));
  o.steps=LEVELS[n-1].steps.slice();o.level=n;return o;
}
const custPool=()=>{const n=levelNo();return CUSTS.filter(c=>(c.from||1)<=n)};
const custOf=k=>CUSTS.find(c=>c.id===k)||{id:k,ko:'손님',en:'guest'};
/* itemUnlock: every 3 guests one more stamp or part (alternating), on top of the level's count */
function unlocked(){const lv=LV(),u=Math.floor(DATA.served/EVERY),addP=Math.ceil(u/2),addS=Math.floor(u/2);
  return{parts:PARTS.slice(0,Math.min(PARTS.length,(lv.parts||3)+addP)),stamps:SHAPES.slice(0,Math.min(SHAPES.length,(lv.stamps||3)+addS))}}
const levelColors=()=>COLORS.slice(0,Math.max(3,Math.min(COLORS.length,LV().colors||3)));

/* ---------- little drawings ---------- */
const ICON={
  mirror:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="44" rx="30" ry="36" fill="${PAL.butter}" ${S}/><ellipse cx="50" cy="44" rx="21" ry="27" fill="#EAF3F6" ${S}/><path d="M38 30Q43 22 53 21" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${PAL.butter}" stroke-width="3.5" stroke-linecap="round"/>${A.twinkle(82,16,7,'#F0D58A')}</svg>`,
  next:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${PAL.sage}" ${S}/><path d="M38 30L62 50L38 70" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 30L62 50L38 70" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  back:`<svg viewBox="0 0 40 40" width="30" height="30"><path d="M25 8L12 20L25 32" fill="none" stroke="${OL}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:'<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#F0D58A" stroke="#5B3A29" stroke-width="1.2"/></svg>',
  ribbon:`<svg viewBox="-20 -14 40 28"><path d="M0 0L-16 -10Q-19 0 -16 10Z" fill="${PAL.rose}" stroke="${OL}" stroke-width="2"/><path d="M0 0L16 -10Q19 0 16 10Z" fill="${PAL.rose}" stroke="${OL}" stroke-width="2"/><circle r="4.5" fill="#F6D3DB" stroke="${OL}" stroke-width="2"/></svg>`
};
const DROP=c=>`<svg viewBox="0 0 60 56"><path d="M10 4H50Q58 4 58 12V34Q58 42 50 42H26L15 52L17 42H10Q2 42 2 34V12Q2 4 10 4Z" fill="#FFFDF9" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 9Q41 22 41 28Q41 37 30 37Q19 37 19 28Q19 22 30 9Z" fill="${c}" stroke="${OL}" stroke-width="2.2"/><ellipse cx="25.5" cy="27" rx="2.4" ry="4" fill="#fff" opacity=".7"/></svg>`;
/* shop front: papercraft layers (no outlines), calm colours */
const PF='filter="url(#nsPaper)"';
const PAPER_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="nsPaper" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".22"/></filter></defs></svg>`;
const LB_WALL=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="#F1E8EE"/><rect y="58" width="100" height="16" fill="#EADFE6"/><path d="M0 72Q50 70 100 72V100H0Z" fill="#E7D8C6"/><path d="M0 91Q50 89.5 100 91V100H0Z" fill="#DDCBB5"/></svg>`;
const LB_AWN=`<svg viewBox="0 0 200 40" preserveAspectRatio="none"><g ${PF}><path d="M0 0H200V22${Array.from({length:10},(_,i)=>`Q${195-i*20} 36 ${190-i*20} 22`).join('')}Q5 36 0 22Z" fill="#C3B4E6"/></g><rect width="200" height="9" fill="#DCD4F3"/></svg>`;
const LB_WIN=`<svg viewBox="0 0 160 124"><g ${PF}><rect x="4" y="4" width="152" height="96" rx="16" fill="#D9BFA6"/></g><g ${PF}><rect x="14" y="14" width="132" height="76" rx="10" fill="#DCEBF0"/></g>
  <g ${PF}><rect x="22" y="70" width="116" height="8" rx="4" fill="#C9A98A"/></g>${[[36,'#E89AAE'],[58,'#AE9BE0'],[80,'#8FC3E6'],[102,'#EBCB6B'],[124,'#86CDBE']].map(([x,c])=>`<g ${PF}><rect x="${x-3}" y="40" width="6" height="12" rx="2" fill="#7E6E9E"/><rect x="${x-8}" y="50" width="16" height="20" rx="6" fill="${c}"/></g>`).join('')}
  <path d="M24 84L52 18H66L38 84Z" fill="#fff" opacity=".35"/><g ${PF}><rect x="10" y="98" width="140" height="16" rx="6" fill="#C9A98A"/></g></svg>`;
const LB_DOOR=`<svg viewBox="0 0 120 172" preserveAspectRatio="xMidYMax meet"><g ${PF}><path d="M6 166V52Q6 6 60 6Q114 6 114 52V166Z" fill="#C9A98A"/></g><g ${PF}><path d="M17 166V56Q17 18 60 18Q103 18 103 56V166Z" fill="#E8A0AE"/></g>
  <g ${PF}><circle cx="60" cy="60" r="21" fill="#DCEBF0"/></g><g transform="translate(51 44) scale(.32)"><rect x="18" y="0" width="22" height="30" rx="7" fill="#7E6E9E"/><rect x="6" y="28" width="46" height="46" rx="14" fill="#C3B4E6"/></g>
  <g ${PF}><rect x="28" y="96" width="64" height="58" rx="8" fill="#F2C4CC"/></g><g ${PF}><circle cx="90" cy="112" r="5.5" fill="#F0D58A"/></g><g ${PF}><rect x="0" y="162" width="120" height="10" rx="4" fill="#DCCBB6"/></g></svg>`;
const LB_CHAIR=`<svg viewBox="0 0 120 84" preserveAspectRatio="xMidYMax meet"><g ${PF}><rect x="20" y="2" width="80" height="50" rx="18" fill="#D8C7E8"/></g><g ${PF}><rect x="12" y="68" width="9" height="16" rx="3" fill="#B88A66"/><rect x="99" y="68" width="9" height="16" rx="3" fill="#B88A66"/></g><g ${PF}><rect x="6" y="48" width="108" height="20" rx="9" fill="#C3B4E6"/></g></svg>`;
const FRAME=inner=>`<svg viewBox="0 0 100 112"><g ${PF}><rect x="3" y="3" width="94" height="104" rx="12" fill="#D8C7E8"/></g><g ${PF}><rect x="11" y="11" width="78" height="88" rx="7" fill="${inner?'#FBF6F2':'#EFE4D8'}"/></g>${inner?`<g transform="translate(17 16) scale(.22)">${inner}</g>`:''}</svg>`;
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');

const css=`
#nailshop{gap:8px}
.nsstars{display:flex;gap:2px;flex:none}.nsstars svg{width:20px;height:20px}
#nsBack svg{display:block}
.ns-lobby{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F1E8EE;touch-action:manipulation}
.ns-lobby>div{position:absolute;pointer-events:none}
.ns-lobby svg{display:block;width:100%;height:100%}
.nl-bg{inset:0}.nl-awn{left:0;right:0;top:0;height:9%}
.nl-frames{left:4%;right:4%;top:11%;height:16%;display:flex;justify-content:center;gap:4%}
.nl-frame{height:100%;aspect-ratio:100/112;position:relative}
.nl-frame.new{animation:nlnew .6s ease-out}
@keyframes nlnew{from{transform:scale(.6);opacity:0}}
.nl-win{left:4%;width:44%;top:37%;height:26%}.nl-door{left:53%;width:40%;top:28%;height:44.5%}
.nl-seats{inset:0}.nl-slot{position:absolute}.nl-chair{position:absolute;left:0;right:0;bottom:0;height:46%}
.nl-cust{position:absolute;left:0;bottom:0;width:100%;height:100%;border:0;padding:0;background:none;pointer-events:auto;touch-action:manipulation;transition:transform 2s linear}
.nl-cust .nl-ani{position:absolute;left:3%;right:3%;bottom:19%;aspect-ratio:200/230}
.nl-cust .nl-ani svg{width:100%;height:100%}
.nl-cust .nl-bub{position:absolute;right:-2%;top:0;width:42%;aspect-ratio:60/56}
.nl-cust.walk .nl-ani{animation:nlwalk .66s ease-in-out 3}
.nl-cust.arriving{pointer-events:none}
@keyframes nlwalk{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.nl-walker{position:absolute;z-index:5;pointer-events:none}
.ns-room{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
.ns-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);
  background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 86%,var(--grape)) 0 40%,#EADBCB 40% 100%)}
.ns-stage>div{position:absolute;pointer-events:none}
.ns-stage svg{display:block;width:100%;height:100%;overflow:visible}
.ns-table{left:0;right:0;top:40%;bottom:0;background:linear-gradient(180deg,#EFE2D3,#E6D5C2);border-top:4px solid #D9C3AC}
.ns-cust{z-index:1;transition:transform .5s ease-in-out,opacity .4s}
.ns-cust.enter{animation:nscin .8s cubic-bezier(.3,1.3,.5,1)}
@keyframes nscin{from{transform:translateY(40%);opacity:0}}
.ns-stage.cure .ns-cust{z-index:6;transform:translate(var(--peek,0px),18px) scale(.62);transform-origin:50% 0}
/* P12: the hand taps its fingers while waiting, wiggles a little while being painted; Toto's toe beans are soft jelly */
#nsHand.wait{animation:nstap 2.8s ease-in-out infinite}
@keyframes nstap{0%,62%,100%{translate:0 0;rotate:0deg}70%{translate:0 -5px;rotate:-1deg}78%{translate:0 0;rotate:0deg}86%{translate:0 -4px;rotate:-.8deg}94%{translate:0 0;rotate:0deg}}
#nsHand.wiggle{animation:nswig .6s ease-in-out}
@keyframes nswig{0%,100%{rotate:0deg}30%{rotate:-1.2deg}70%{rotate:1.2deg}}
#nsHand .ns-bean{transform-box:fill-box;transform-origin:50% 50%;animation:nsbean 1.8s ease-in-out var(--ns-off,0s) infinite}
@keyframes nsbean{0%,100%{transform:scale(1)}50%{transform:scale(1.1,.9)}}
.ns-hand{z-index:3;transform-origin:0 0;transition:transform .8s cubic-bezier(.4,.1,.3,1)}
.ns-hand.enter{animation:nshin .7s cubic-bezier(.3,1.2,.5,1)}
@keyframes nshin{from{transform:translateY(60%)}}
.ns-hand.raise{transform:translateY(-12%) rotate(-4deg)}
.lp{opacity:0;transition:opacity .5s ease-out}
.ns-stage.cure .lp{opacity:1}
.lp-back{z-index:2}.lp-front{z-index:5}
.lp-glow{z-index:4;opacity:0!important;transition:opacity 1.4s ease-in-out}
.ns-stage.cure.lampon .lp-glow{opacity:.62!important}
.ns-dots{z-index:6;display:flex;justify-content:center;gap:12px}
.ns-dots i{width:22px;height:22px;border-radius:50%;border:3px solid ${OL};background:#FFFDF9;transition:background .3s,transform .3s}
.ns-dots i.on{background:${PAL.lilac};transform:scale(1.15)}
.ns-zoom{z-index:7;background:transparent;transform-origin:0 0}
.ns-zbg{z-index:6;inset:0;background:color-mix(in srgb,var(--bg) 92%,var(--grape));opacity:0;transition:opacity .4s}
.ns-zbg.on{opacity:1}
.ns-pfx{inset:0;z-index:9;overflow:hidden}
.ns-pfx .pf{position:absolute;width:0;height:0}
.ns-pfx .pf svg{position:absolute;left:-12px;top:-12px;width:24px;height:24px;overflow:visible}
.ns-pfx .pf.fly{animation:nsfly ease-out forwards}
@keyframes nsfly{from{transform:translate(0,0);opacity:1}to{transform:translate(var(--dx),var(--dy));opacity:0}}
.ns-abrush{position:absolute;z-index:8;width:120px;height:120px;pointer-events:none;transition:left .09s linear,top .09s linear;filter:drop-shadow(0 4px 3px rgba(91,74,66,.2))}
.ns-corner{position:absolute;bottom:10px;width:116px;height:116px;border-radius:50%;border:0;padding:12px;background:var(--paper);z-index:10;opacity:0;transition:opacity .8s ease-out;
  box-shadow:0 5px 0 rgba(46,42,79,.14),0 8px 14px rgba(91,74,66,.14);display:grid;place-items:center;touch-action:manipulation}
.ns-corner.on{opacity:1}.ns-corner svg{width:100%;height:100%;display:block;pointer-events:none}
.ns-corner:active{transform:translateY(4px)}
#nsNext,#nsMir{right:10px}#nsHandBack{left:10px;opacity:1}
.ns-panel{flex:none;height:170px;display:flex;gap:10px;align-items:center;justify-content:center;padding:6px 0;touch-action:none}
.ns-card{flex:1;min-width:0;max-width:200px;height:124px;border-radius:28px;border:0;padding:10px;background:var(--paper);display:grid;place-items:center;touch-action:none;position:relative;
  box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .2s}
.ns-card svg{width:100%;height:100%;display:block;pointer-events:none}
.ns-card:active{transform:translateY(5px)}
.ns-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--grape) 80%,#fff),0 4px 12px rgba(91,74,66,.16)}
.ns-card.lift{opacity:.4}
.ns-card.in{animation:nscard .3s ease-out both}
@keyframes nscard{from{transform:translateY(24px);opacity:0}}
.ns-card .nb{position:absolute;right:8px;top:6px;width:34px;height:24px}
.ns-toolcard{width:150px;height:150px;border-radius:28px;background:color-mix(in srgb,var(--paper) 80%,transparent);display:grid;place-items:center;padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.1)}
.ns-toolcard svg{width:100%;height:100%}
.ns-float{position:absolute;z-index:60;pointer-events:none;will-change:transform}
.ns-float svg{width:100%;height:100%;display:block;overflow:visible}
.ns-photo{position:absolute;z-index:11;pointer-events:none;opacity:0;transition:opacity .35s}
.ns-photo.on{opacity:1}.ns-photo svg{width:100%;height:100%;display:block}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`${PAPER_DEFS}<div class="bar"><button class="round" data-go="home" id="nsHome" aria-label="처음으로">🏠</button><button class="round" id="nsBack" aria-label="가게 앞으로" hidden>${ICON.back}</button><h2>네일숍</h2><div class="nsstars" id="nsStars"></div></div>
<div class="ns-lobby" id="nsLobby"><div class="nl-bg">${LB_WALL}</div><div class="nl-awn">${LB_AWN}</div><div class="nl-frames" id="nsFrames"></div><div class="nl-win">${LB_WIN}</div><div class="nl-door" id="nsDoor">${LB_DOOR}</div><div class="nl-seats" id="nsSeats"></div></div>
<div class="ns-room" id="nsRoom" hidden><div class="ns-stage" id="nsStage"><div class="ns-table"></div><div class="ns-cust" id="nsCust"></div>
<div class="lp lp-back" id="nsLpBack">${H.LAMP.back}</div><div class="ns-hand" id="nsHand"></div><div class="lp lp-glow" id="nsLpGlow">${H.LAMP.glow}</div><div class="lp lp-front" id="nsLpFront">${H.LAMP.front}</div><div class="lp ns-dots" id="nsDots"></div>
<div class="ns-zbg" id="nsZbg"></div><div class="ns-zoom" id="nsZoom" hidden></div><div class="ns-pfx" id="nsPfx"></div>
<button class="ns-corner" id="nsNext" aria-label="다음" hidden>${ICON.next}</button><button class="ns-corner" id="nsMir" aria-label="거울" hidden>${ICON.mirror}</button><button class="ns-corner" id="nsHandBack" aria-label="손 전체" hidden>${H.TOOLS.handIcon}</button></div>
<div class="ns-panel" id="nsPanel"></div></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='네일숍';
const $=s=>sec.querySelector(s);
const lobbyEl=$('#nsLobby'),roomEl=$('#nsRoom'),seatsEl=$('#nsSeats'),framesEl=$('#nsFrames'),doorEl=$('#nsDoor'),homeBtn=$('#nsHome'),backBtn=$('#nsBack');
const stage=$('#nsStage'),custEl=$('#nsCust'),handEl=$('#nsHand'),zoomEl=$('#nsZoom'),zbg=$('#nsZbg'),pfx=$('#nsPfx'),panel=$('#nsPanel');
const nextBtn=$('#nsNext'),mirBtn=$('#nsMir'),handBackBtn=$('#nsHandBack'),lpBack=$('#nsLpBack'),lpGlow=$('#nsLpGlow'),lpFront=$('#nsLpFront'),dotsEl=$('#nsDots');
const G=M.Guide.make(sec,{say});

/* P12: living customers (alive.js) and big tools */
const AL=M.Alive||null;let al=null,lobbyAl=[],turns=null,lastWig=0;
const alKind=k=>k==='bunnyPaw'?'bunny':k;
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};   // started now or right after the current one
function lobbyAlive(){if(!AL)return;lobbyAliveOff();seatsEl.querySelectorAll('.nl-cust .nl-ani').forEach(e=>{const c=lobby[+e.closest('.nl-cust').dataset.i];lobbyAl.push(AL.attach(e,{kind:alKind(c?c.kind:'mom'),waiting:true}))});turns=AL.takeTurns(lobbyAl)}
function lobbyAliveOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
/* touch.tool.nailToolRatio: "손 그림 폭의 55% …" → the brush, file and dropper are 55% of the hand picture */
const NAIL_TOOL=(+(String((CF.touch.tool||{}).nailToolRatio||'').match(/\d+(?:\.\d+)?/)||[55])[0])/100;
const TOOL_NAME={file:['손톱 줄!','Nail file!'],base:['젤 붓!','Gel brush!'],top:['젤 붓!','Gel brush!'],oil:['오일 스포이트!','Oil dropper!']};
function handWait(on){handEl.classList.toggle('wait',!!on)}
function wiggle(){const n=performance.now();if(n-lastWig<700)return;lastWig=n;handEl.classList.remove('wiggle');void handEl.offsetWidth;handEl.classList.add('wiggle')}
const custFace=()=>{const r=custEl.getBoundingClientRect();return{left:r.left+r.width*.15,right:r.right-r.width*.15,top:r.top+r.height*.15,bottom:r.top+r.height*.7,width:r.width*.7,height:r.height*.55}};
let view='lobby',phase='',lobby=[],seatIdx=-1,cs=null,raf=0,lastMiss=0,misses=0,tools=[],plan=[],pi=0,stepKey='',doneN=new Set(),
  colSel=-1,colSet=0,cards=null,mode='',zoomI=null,decoN=0,firstDeco=0,mirrorT=0,dd=null,cd=null,stroke=null,abrush=null,cureN=0,flying=0,reacted=false,freshT=0;
const secXY=(x,y)=>{const sr=sec.getBoundingClientRect();return[x-sr.left,y-sr.top]};
const MISS=VO.onWrongPlace.map(m=>[m.ko,m.en]);
function miss(){misses++;G.nudge();const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
function stars(){$('#nsStars').innerHTML=Array.from({length:Math.min(8,DATA.served)},()=>ICON.star).join('')}

/* ============================== shop front (가게 앞) ============================== */
function newCustomer(avoid){
  const pool=custPool(),fresh=pool.filter(c=>!avoid.includes(c.id)),c=pick(fresh.length?fresh:pool)||{id:'mom'},cols=levelColors();
  return{kind:c.id,want:(Math.random()*cols.length)|0,inside:false};
}
function fillLobby(avoid){
  while(lobby.length<WAITING)lobby.push(null);
  lobby.forEach((c,i)=>{if(c&&custPool().some(p=>p.id===c.kind))return;lobby[i]=null});
  lobby.forEach((c,i)=>{if(c)return;const others=lobby.filter(Boolean);let n=newCustomer(others.map(o=>o.kind).concat(avoid||[]));let k=0;while(others.some(o=>o.want===n.want)&&k++<8)n.want=(Math.random()*levelColors().length)|0;lobby[i]=n});
}
function seatBox(i){const r=lobbyEl.getBoundingClientRect(),W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.3,Hh*.26,210))),gap=(W-3*bw)/4,bh=Math.round(bw*1.32);return{left:gap+i*(bw+gap),bottom:Math.round(Hh*.03),w:bw,h:bh}}
function custHTML(c,i){const k=custOf(c.kind),col=levelColors()[c.want]||COLORS[0];return `<button class="nl-cust" data-i="${i}" aria-label="${k.ko}"><span class="nl-ani">${H.portrait(c.kind,'idle')}</span><span class="nl-bub">${DROP(col.hex)}</span></button>`}
function renderSeats(skip){
  seatsEl.innerHTML='';
  for(let i=0;i<WAITING;i++){const b=seatBox(i),slot=document.createElement('div');slot.className='nl-slot';slot.dataset.i=i;
    Object.assign(slot.style,{left:b.left+'px',bottom:b.bottom+'px',width:b.w+'px',height:b.h+'px'});
    slot.innerHTML=`<div class="nl-chair">${LB_CHAIR}</div>`+(lobby[i]&&!lobby[i].inside&&i!==skip?custHTML(lobby[i],i):'');seatsEl.appendChild(slot)}
  lobbyAlive();
}
function layoutLobby(){if(view!=='lobby'||!lobbyEl.getBoundingClientRect().width)return;seatsEl.querySelectorAll('.nl-slot').forEach(sl=>{const b=seatBox(+sl.dataset.i);Object.assign(sl.style,{left:b.left+'px',bottom:b.bottom+'px',width:b.w+'px',height:b.h+'px'})})}
function renderFrames(fresh){framesEl.innerHTML=[0,1,2].map(i=>{const w=DATA.wall[i];return `<div class="nl-frame${w?' full':''}${w&&fresh&&i===0?' new':''}">${FRAME(w?svgInner(H.hand(w.kind,w.nails,{id:'nsf'+i})):'')}</div>`}).join('')}
seatsEl.addEventListener('click',e=>{const b=e.target.closest('.nl-cust');if(!b||b.classList.contains('arriving'))return;pickCustomer(+b.dataset.i,b)});
lobbyEl.addEventListener('pointerdown',e=>{actx();if(phase!=='lobby'||e.target.closest('.nl-cust'))return;miss()});
function showLobby(o={}){
  exitRoom();view='lobby';phase='lobby';seatIdx=-1;L.onEnd(lobbyAliveOff);
  lobbyEl.hidden=false;roomEl.hidden=true;homeBtn.hidden=false;backBtn.hidden=true;
  lobby.forEach(c=>{if(c)c.inside=false});fillLobby();renderFrames(!!o.served);
  if(o.served){phase='arrive';renderSeats(o.slot);walkOut(o.served,()=>arrive(o.slot))}else{renderSeats();greet(!o.quiet)}
  stars();
}
function greet(talk){phase='lobby';if(talk!==false)say(LINE.lobby[0],LINE.lobby[1],true);
  G.start({type:'tap',at:()=>{const b=seatsEl.querySelector('.nl-slot:nth-child(2) .nl-cust')||seatsEl.querySelector('.nl-cust');if(!b)return[sec.clientWidth/2,sec.clientHeight/2];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height*.55)},ko:LINE.lobby[0],en:LINE.lobby[1]})}
function walkOut(c,then){
  const lr=lobbyEl.getBoundingClientRect(),dr=doorEl.getBoundingClientRect(),w=Math.round(seatBox(0).w*.92),h=Math.round(w*230/200);
  const wk=document.createElement('div');wk.className='nl-walker';wk.innerHTML=H.portrait(c.kind,'happy');
  Object.assign(wk.style,{width:w+'px',height:h+'px',left:(dr.left-lr.left+dr.width/2-w/2)+'px',top:(dr.bottom-lr.top-h)+'px'});lobbyEl.appendChild(wk);
  const dist=lr.right-dr.left+w;
  wk.animate([{transform:'translate(0,0)'},{transform:`translate(${dist*.25}px,-8px)`},{transform:`translate(${dist*.5}px,0)`},{transform:`translate(${dist*.75}px,-8px)`},{transform:`translate(${dist}px,0)`}],{duration:1500,easing:'linear',fill:'forwards'});
  L.later(()=>{wk.remove();then&&then()},1550);L.onEnd(()=>wk.remove());
}
function arrive(i){
  const gone=lobby[i]&&lobby[i].kind;lobby[i]=null;fillLobby([gone]);const c=lobby[i],slot=seatsEl.querySelector(`.nl-slot[data-i="${i}"]`);if(!slot||!c){greet();return}
  slot.insertAdjacentHTML('beforeend',custHTML(c,i));const b=slot.lastElementChild,lr=lobbyEl.getBoundingClientRect(),sr=slot.getBoundingClientRect();
  const dx=i<WAITING-1?-(sr.right-lr.left+10):(lr.right-sr.left+10);
  b.classList.add('arriving');b.style.transition='none';b.style.transform=`translateX(${dx}px)`;void b.offsetWidth;b.style.transition='';b.classList.add('walk');b.style.transform='translateX(0)';
  tone(523,.12,'sine',.08);tone(659,.12,'sine',.08,.25);
  L.later(()=>{b.classList.remove('arriving','walk');lobbyAlive();greet()},2050);
}
function pickCustomer(i,btn){
  if(phase!=='lobby'||view!=='lobby')return;const c=lobby[i];if(!c)return;
  phase='pick';G.touch();G.stop();actx();sfx.pop();sayL(LINE.comeIn[c.kind]||LINE.comeIn.family);LOG.push('pick:'+c.kind);
  const dr=doorEl.getBoundingClientRect(),br=btn.getBoundingClientRect(),dx=dr.left+dr.width/2-(br.left+br.width/2),dy=dr.bottom-dr.height*.25-(br.top+br.height/2);
  btn.style.transition='none';
  btn.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-40}px) scale(.85)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.55)`,opacity:0}],{duration:500,easing:'ease-in-out',fill:'forwards'});
  L.later(()=>enterRoom(i),560);
}
backBtn.addEventListener('click',()=>{if(view!=='room')return;actx();sfx.pop();showLobby({quiet:true})});

/* ============================== at the nail table ============================== */
const DECO=['art','stamp','parts'],TOOLSTEPS=['file','base','color','top','oil'];
const nailCount=()=>cs?H.KINDS[cs.kind].nails.length:5;
const geo=i=>H.geo(cs.kind,i);
function freshNail(hasFile){return{filed:hasFile?[0,0,0,0,0,0]:null,base:null,col:[],cured:false,top:null,topCured:false,oil:null,drop:false,art:[],parts:[],shine:false,dust:false}}
/* the level's steps → stages; neighbouring art/stamp/parts become one free decorating stage */
function makePlan(steps){const out=[];steps.forEach(k=>{if(DECO.includes(k)){const last=out[out.length-1];if(last&&last.deco)last.modes.push(k);else out.push({deco:true,modes:[k]})}else out.push({key:k})});return out}
function exitRoom(){L.begin();killTools();stopBrush();G.stop();clearFloats();lobbyAliveOff();if(al){al.detach();al=null}handWait(false);dd=null;cd=null;stroke=null;cards=null;zoomI=null;mirrorT=0;
  stage.classList.remove('cure','lampon');handEl.style.transform='';handEl.classList.remove('raise');zoomEl.hidden=true;zbg.classList.remove('on');hideCorner(nextBtn);hideCorner(mirBtn);handBackBtn.hidden=true}
function clearFloats(){sec.querySelectorAll('.ns-float,.ns-photo,.ns-abrush').forEach(f=>f.remove());pfx.innerHTML=''}
function enterRoom(i){
  exitRoom();const c=lobby[i];if(!c){showLobby();return}
  const lv=LV();view='room';phase='enter';seatIdx=i;c.inside=true;
  cs={kind:c.kind,want:c.want,level:lv.level,lv,nails:[]};plan=makePlan(lv.steps);pi=0;decoN=0;firstDeco=0;cureN=0;reacted=false;colSel=-1;colSet=0;mode='';
  for(let k=0;k<nailCount();k++)cs.nails.push(freshNail(lv.steps.includes('file')));
  LOG.push('level:'+lv.level,'hand:'+c.kind);
  lobbyEl.hidden=true;roomEl.hidden=false;homeBtn.hidden=true;backBtn.hidden=false;panel.innerHTML='';
  if(AL){al=AL.attach(custEl,{kind:alKind(c.kind)});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  size();drawCust('idle');custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('enter');L.later(()=>{alPlay('hop',{n:2,wave:true})},900);
  render();handEl.classList.remove('enter');L.later(()=>{handEl.classList.add('enter');handEl.style.visibility=''},700);handEl.style.visibility='hidden';
  L.later(()=>{const col=levelColors()[c.want]||COLORS[0];sayL(NV.enter);sayL(LINE.want(col))},500);
  L.later(runStage,2600);
}
function drawCust(m){if(cs){custEl.innerHTML=H.portrait(cs.kind,m);if(al)al.refresh()}}
function size(){
  const r=stage.getBoundingClientRect();if(!r.width||!cs)return;const W=r.width,Hh=r.height,vb=H.KINDS[cs.kind].vb;
  const hw=Math.round(Math.min(W*.99,Hh*.76*vb[0]/vb[1])),hh=Math.round(hw*vb[1]/vb[0]),hl=Math.round((W-hw)/2),ht=Math.round(Hh-hh-Hh*.02);
  Object.assign(handEl.style,{width:hw+'px',height:hh+'px',left:hl+'px',top:ht+'px'});
  const ph=Math.round(Math.max(90,Math.min(ht+hh*.12,Hh*.36,190))),pw=Math.round(ph*200/230);Object.assign(custEl.style,{width:pw+'px',height:ph+'px',left:Math.round((W-pw)/2)+'px',top:'4px'});
  custEl.style.setProperty('--peek',Math.round(W/2-pw*.62/2-6)+'px');   // during the lamp: peeks in from the right
  const lw=Math.round(Math.min(W*.86,Hh*.46*300/220)),lh=Math.round(lw*220/300),ll=Math.round((W-lw)/2),lt=Math.round(Hh*.03);
  [lpBack,lpGlow,lpFront].forEach(e=>Object.assign(e.style,{width:lw+'px',height:lh+'px',left:ll+'px',top:lt+'px'}));
  Object.assign(dotsEl.style,{left:'0',right:'0',top:(Hh-44)+'px',height:'30px'});
  const O=H.LAMP.open,s=lw/300,ow=O[2]*s,sc=ow*.9/hw;
  size.inLamp=`translate(${(ll+O[0]*s+(ow-hw*sc)/2-hl).toFixed(1)}px,${(lt+O[1]*s+O[3]*s*.08-ht).toFixed(1)}px) scale(${sc.toFixed(3)})`;
  if(stage.classList.contains('lampon'))handEl.style.transform=size.inLamp;
  if(zoomI!=null)placeZoom();
}
/* ---------- drawing ---------- */
function render(){if(!cs)return;handEl.innerHTML=H.hand(cs.kind,cs.nails,{id:'nsh'});const hs=handEl.firstElementChild;if(hs)hs.style.setProperty('--ns-off',-Math.round(performance.now()%1800)+'ms');if(zoomI!=null)renderZoom()}
function rd(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;render()})}
function freshRedraw(){if(freshT)return;freshT=1;L.later(()=>{freshT=0;rd()},520)}
/* nail box on screen (client px) */
function nailRect(i){const r=handEl.getBoundingClientRect(),vb=H.KINDS[cs.kind].vb,s=r.width/vb[0],g=geo(i);const left=r.left+g.x*s,top=r.top+g.y*s,width=g.w*s,height=g.h*s;return{left,top,width,height,right:left+width,bottom:top+height}}
function nailAt(x,y,m){if(!cs)return-1;let best=-1,bd=1e9;for(let i=0;i<nailCount();i++){const r=nailRect(i),mx=r.width*m,my=r.height*m;
  if(x>=r.left-mx&&x<=r.right+mx&&y>=r.top-my&&y<=r.bottom+my){const d=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));if(d<bd){bd=d;best=i}}}return best}
const stXY=(x,y)=>{const s=stage.getBoundingClientRect();return[x-s.left,y-s.top]};
function spawn(html,x,y,o={}){if(pfx.childElementCount>18)return;const e=document.createElement('i');e.className='pf fly';e.innerHTML=`<svg viewBox="-12 -12 24 24">${html}</svg>`;
  e.style.left=x+'px';e.style.top=y+'px';e.style.setProperty('--dx',(o.dx||0)+'px');e.style.setProperty('--dy',(o.dy||0)+'px');const ms=o.ms||800;e.style.animationDuration=ms+'ms';pfx.appendChild(e);setTimeout(()=>e.remove(),ms+60)}
/* corner buttons appear quietly (no pulsing) */
function showCorner(b){if(!b.hidden)return;b.hidden=false;requestAnimationFrame(()=>b.classList.add('on'))}
function hideCorner(b){b.classList.remove('on');b.hidden=true}
function cornerGuide(b){G.start({type:'tap',wait:true,quiet:true,after:IDLE_HINT,at:()=>{const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}})}

/* ---------- stages ---------- */
function runStage(){
  if(!cs)return;killTools();stopBrush();hideCorner(nextBtn);doneN=new Set();cards=null;panel.innerHTML='';
  const st=plan[pi];if(!st){finishStage();return}
  if(st.deco){decoStage(st.modes);return}
  stepKey=st.key;LOG.push('step:'+st.key);
  if(st.key==='cure')cureStep();else toolStep(st.key);
}
function advance(){if(!cs)return;actx();sfx.pop();alPlay('clap');if(stepKey==='file')cs.nails.forEach(n=>{n.dust=false});hideCorner(nextBtn);G.stop();if(zoomI!=null)unzoom(true);pi++;runStage()}
nextBtn.addEventListener('click',()=>{if(nextBtn.hidden||view!=='room')return;advance()});
const need3=()=>Math.min(3,nailCount());   // flow: 손톱 3개 이상 하면 다음 버튼

/* ---------- tool steps: file, base, color, top, oil (ML.P2.makeTool, only the touched cells inside the nail change) ---------- */
function killTools(){tools.forEach(t=>t&&t.destroy());tools=[]}
const toolIcon=k=>k==='file'?H.TOOLS.file:k==='oil'?H.TOOLS.dropper:k==='color'?H.TOOLS.brush(colSel>=0?curColors()[colSel].hex:'#F3EEE8'):H.TOOLS.brush('#EAF6FF',true);
const fxFor=k=>a=>{const c=k==='color'&&colSel>=0?curColors()[colSel].hex:k==='oil'?'#F4CD6C':k==='file'?'#E9D8C8':'#EAF6FF';
  return `<circle cx="${a.x}" cy="${a.y}" r="${(a.rad*.7).toFixed(1)}" fill="${c}" opacity="${k==='file'?.35:.45}"/>`};
function makeNailTool(i,k){
  const g=geo(i),cl=k==='file'?H.tipCells(g):H.cells(g);
  const rub={get needStageWidths(){const sr=stage.getBoundingClientRect(),nr=nailRect(i);return((CF.touch.rub||{}).needStageWidths||2)*nr.width/Math.max(1,sr.width)}};
  let lastDust=0;
  return P.makeTool(stage,{tool:toolIcon(k),effect:'brush',anchor:[.18,.77],gapScale:.25,cells:cl.map(c=>[c.fx,c.fy]),size:()=>handEl.getBoundingClientRect().width*NAIL_TOOL,face:custFace,
    cfg:()=>({offsetAboveFingerRatio:TOOLS.offsetAboveFingerRatio,coverage:Object.assign({},COV,{grid:[H.GRID,H.GRID]})}),rub,
    radius:(h,t)=>t.width*(k==='file'?.36:.3),target:()=>nailRect(i),fx:fxFor(k),
    onMiss:()=>{},
    onTouch:()=>{G.touch();stopBrush();LOG.push('press:'+k);handWait(false);if(al)al.setTool('nailBrush');if(k==='color'&&colSel<0)selectColor(0,true,true);if(k==='oil'&&!cs.nails[i].drop){cs.nails[i].drop=true;tone(1180,.08,'sine',.1);rd()}},
    onRelease:()=>{G.release();if(al)al.setTool(null);if(TOOLSTEPS.includes(phase))handWait(true)},
    onCell:(c,v,pv,why)=>{const n=cs.nails[i];if(why!=='auto')wiggle();
      if(k==='file'){n.filed[c]=v;const t=performance.now();if(why==='move'&&t-lastDust>140){lastDust=t;const r=nailRect(i),[x,y]=stXY(r.left+r.width*cl[c].fx,r.top+r.height*cl[c].fy);spawn('<circle r="2.5" fill="#E9D8C8"/>',x,y,{dx:(Math.random()-.5)*20,dy:40,ms:700})}}
      else if(k==='color'){if(v>=.5){const col=curColors()[Math.max(0,colSel)],p=n.col[c];if(!p||p.k!==col.hex){n.col[c]={c:col.vivid,h:col.hex,k:col.hex,t:performance.now()};freshRedraw()}}}
      else{if(!n[k])n[k]=[];n[k][c]=v}
      rd()},
    onProgress:(p,ratio,why)=>{if(k==='file'&&why==='move'){const t=performance.now();if(t-lastDust>130)SFX.scrub()}},
    onDone:()=>nailDone(i,k)});
}
function armTools(k){killTools();for(let i=0;i<nailCount();i++)tools.push(makeNailTool(i,k))}
function toolStep(k){
  phase=k;armTools(k);handWait(true);
  if(k==='color')colorCards(true);else{panel.innerHTML=`<div class="ns-toolcard">${toolIcon(k)}</div>`;
    const nm=TOOL_NAME[k];if(nm&&P.toolIntro){const stop=P.toolIntro(stage,panel.querySelector('.ns-toolcard'),toolIcon(k),{ko:nm[0],en:nm[1],size:handEl.getBoundingClientRect().width*NAIL_TOOL});L.onEnd(stop)}}
  const l=STEP_LINE(k);if(k!=='color'){if(k==='file')say(VO.actionWords.rub.ko,VO.actionWords.rub.en,!!TOOL_NAME[k]);say(l[0],l[1],!!TOOL_NAME[k])}   // after the tool's name (intro)
  G.start({type:'scrub',at:()=>{const i=[...Array(nailCount()).keys()].find(j=>!doneN.has(j));const r=nailRect(i==null?1:i);return secXY(r.left+r.width/2,r.top+r.height/2)},ko:l[0],en:l[1]});
}
function nailDone(i,k){
  if(!cs||phase!==k)return;const first=!doneN.has(i);doneN.add(i);const n=cs.nails[i];
  if(k==='color'){n.shine=true;SFX.sparkle();
    if(!reacted){reacted=true;const want=levelColors()[cs.want],c=curColors()[Math.max(0,colSel)];drawCust('happy');alPlay('hop');if(al)al.sound('wow');
      sayL(want&&c&&want.hex===c.hex?LINE.likeIt(c):LINE.prettyToo);L.later(()=>drawCust('idle'),1600)}
    else if(first){const p=praise();say(p[0],p[1])}}
  else if(k==='file'){n.dust=true;SFX.sparkle()}
  else{tone(1046,.12,'sine',.08);if(first&&doneN.size===1){const p=praise();say(p[0],p[1])}}
  if(k==='color'){const t=tools[i];if(t){t.destroy();tools[i]=makeNailTool(i,k)}}else if(tools[i]){tools[i].destroy();tools[i]=null}
  rd();
  if(doneN.size>=need3()){showCorner(nextBtn);cornerGuide(nextBtn)}
}
/* colour bottles: 3 calm cards from the level's colours; tapping the chosen card again shows the next 3 */
function curColors(){const cols=levelColors(),out=[];for(let k=0;k<3;k++)out.push(cols[(colSet*3+k+(cs?cs.want:0))%cols.length]);return out}
function colorCards(talk){
  if(talk)sayL(NV.color);cards={type:'color'};
  panel.innerHTML=curColors().map((c,k)=>`<button class="ns-card in${k===colSel?' sel':''}" data-k="${k}" style="animation-delay:${k*60}ms" aria-label="${c.ko}">${H.bottle(c.hex)}</button>`).join('');
}
function selectColor(k,quiet,noArm){
  if(k===colSel&&!quiet&&levelColors().length>3){colSet++;colSel=-1;colorCards();sfx.pop();return}
  colSel=k;const c=curColors()[k];panel.querySelectorAll('.ns-card').forEach((b,j)=>b.classList.toggle('sel',j===k));
  if(!quiet){sfx.pop();say(c.ko+'!',cap(c.en)+'!')}LOG.push('color:'+c.en);
  /* the brush picture and paint follow the new colour; nails keep what they have */
  if(phase==='color'&&!noArm)armTools('color');
}
/* tap on a nail (no rubbing): the brush paints it slowly by itself */
function stopBrush(){if(abrush){abrush.el.remove();abrush=null;if(al)al.setTool(null)}}
function autoBrush(i){
  if(!cs||phase!=='color'||!tools[i])return;stopBrush();if(colSel<0)selectColor(0,true,true);
  const g=geo(i),cl=H.cells(g),order=cl.map((c,j)=>j).sort((a,b)=>cl[a].c-cl[b].c||(cl[a].c%2?cl[b].r-cl[a].r:cl[a].r-cl[b].r));
  const el=document.createElement('div');el.className='ns-abrush';el.innerHTML=toolIcon('color');stage.appendChild(el);
  const bs=Math.round(handEl.getBoundingClientRect().width*NAIL_TOOL);el.style.width=el.style.height=bs+'px';if(al)al.setTool('nailBrush');
  const me={el,i};abrush=me;let k=0;LOG.push('autobrush:'+i);
  const tick=()=>{if(abrush!==me||!cs||phase!=='color')return;const t=tools[i];if(!t||t.done||k>=order.length){stopBrush();return}
    const j=order[k++],r=nailRect(i),[x,y]=stXY(r.left+r.width*cl[j].fx,r.top+r.height*cl[j].fy);el.style.left=(x-bs*.18)+'px';el.style.top=(y-bs*.77)+'px';
    t.fill(j,1);wiggle();if(k%4===0)tone(700+Math.random()*300,.04,'sine',.04);L.later(tick,90)};
  tick();
}
panel.addEventListener('click',e=>{const b=e.target.closest('.ns-card');if(!b||!cards||view!=='room')return;actx();G.touch();G.release();
  if(cards.type==='color')selectColor(+b.dataset.k);else if(cards.type==='mode')chooseMode(b.dataset.m);else if(cards.type==='lamp')startCure();else decoCard(+b.dataset.k,b,e)});

/* ---------- cure: lamp button → hand into the lamp → soft lilac light (no blinking) → count to 5 → ding → shine ---------- */
let hum=null;
function humStart(){const a=actx();if(!a||!M.S.sound)return;const t=a.currentTime,g=a.createGain(),o=a.createOscillator(),o2=a.createOscillator();o.type='sine';o.frequency.value=110;o2.type='sine';o2.frequency.value=165;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.05,t+.6);o.connect(g);o2.connect(g);g.connect(a.destination);o.start(t);o2.start(t);
  hum={stop(){const t2=a.currentTime;try{g.gain.cancelScheduledValues(t2);g.gain.setValueAtTime(g.gain.value,t2);g.gain.linearRampToValueAtTime(.0001,t2+.4);o.stop(t2+.45);o2.stop(t2+.45)}catch(e){}hum=null}}}
function cureStep(){
  phase='cure';cards={type:'lamp'};stage.classList.add('cure');handWait(false);if(al)al.setTool('lamp');dotsEl.innerHTML='<i></i>'.repeat(CURE_S);   // the guest peeks into the lamp
  panel.innerHTML=`<button class="ns-card in" aria-label="램프" style="max-width:150px">${H.LAMP.icon(false)}</button>`;
  sayL(cureN?NV.top:LINE.lamp);
  G.start({type:'tap',at:()=>{const b=panel.querySelector('.ns-card');const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)},ko:LINE.lamp[0],en:LINE.lamp[1]});
}
function startCure(){
  if(phase!=='cure')return;phase='curing';G.stop();cards=null;sfx.pop();LOG.push('lamp');
  panel.innerHTML=`<div class="ns-toolcard">${H.LAMP.icon(true)}</div>`;handEl.style.transform=size.inLamp||'';
  L.later(()=>{stage.classList.add('lampon');sayL(NV.cure);humStart();L.onEnd(()=>{if(hum)hum.stop()})},800);
  for(let k=0;k<CURE_S;k++)L.later(()=>{const d=dotsEl.children[k];if(d)d.classList.add('on');tone(523+k*66,.14,'sine',.05)},1800+k*1000);
  L.later(()=>{if(hum)hum.stop();tone(1568,.7,'sine',.14);tone(2093,.5,'sine',.05,.02);LOG.push('ding');
    cureN++;cs.nails.forEach(n=>{if(cureN>=2&&n.top)n.topCured=true;else n.cured=true});stage.classList.remove('lampon');render()},1800+CURE_S*1000);
  L.later(()=>{handEl.style.transform='';SFX.sparkle();sayL(NV.shiny);LOG.push('shiny')},1800+CURE_S*1000+900);
  L.later(()=>{stage.classList.remove('cure');if(al)al.setTool(null);drawCust('happy');alPlay('hop');phase='cured';L.later(()=>{drawCust('idle');pi++;runStage()},1600)},1800+CURE_S*1000+1800);
}

/* ============================== decorating: art · stamp · parts (free, zoomed nail) ============================== */
let decoSet=0,decoSel=0,shapeSet=0,shapeSel=0,partSet=0,suppressClick=false;
const decoColors=()=>{const cols=levelColors(),out=[];for(let k=0;k<3;k++)out.push(cols[(decoSet*3+k+(cs?cs.want:0))%cols.length]);return out};
const inkColor=()=>decoColors()[decoSel]||COLORS[0];
const MODE_ICON=m=>{const c=inkColor().hex;return m==='art'?H.TOOLS.brush(c):m==='stamp'?H.TOOLS.stamp(c):H.TOOLS.gem(c)};
const nameKo=n=>NAMES_KO[n]||n,nameEn=n=>NAMES_EN[n]||n;
function decoStage(modes){
  phase='deco';handWait(true);cs.modes=modes;cs.modeSeen={};mode='';chooseMode(modes[0],true);modePanel();sayL(LINE[mode]);
  G.start({type:'tap',at:()=>{const r=nailRect(Math.min(1,nailCount()-1));return secXY(r.left+r.width/2,r.top+r.height/2)},ko:LINE[mode][0],en:LINE[mode][1]});
}
/* hand view rail: the deco tools (붓·도장·보석) as big buttons; only one tool → shown as the tool card */
function modePanel(){
  if(!cs||zoomI!=null)return;const ms=cs.modes||[];
  if(phase!=='deco'||!ms.length){panel.innerHTML='';cards=null;return}
  if(ms.length===1){cards=null;panel.innerHTML=`<div class="ns-toolcard">${MODE_ICON(ms[0])}</div>`;return}
  cards={type:'mode'};panel.innerHTML=ms.map((m,k)=>`<button class="ns-card in${m===mode?' sel':''}" data-m="${m}" style="animation-delay:${k*60}ms" aria-label="${(STEPS[m]||{}).ko||m}">${MODE_ICON(m)}</button>`).join('');
}
function chooseMode(m,quiet){
  if(!cs||!(cs.modes||[]).includes(m))return;if(!cs.modeSeen[m]){cs.modeSeen[m]=1;LOG.push('step:'+m)}
  mode=m;if(!quiet){sfx.pop();sayL(LINE[m]);modePanel()}
}
/* ---------- zoom: the tapped nail fills the stage (0.4 s); the hand button goes back ---------- */
let zvb=[0,0,1,1];
function renderZoom(){const z=H.zoom(cs.kind,zoomI,cs.nails[zoomI],'nsz');zvb=z.vb;zoomEl.innerHTML=z.svg}
function placeZoom(){
  const r=stage.getBoundingClientRect(),sc=Math.min(r.width*.8/zvb[2],r.height*.9/zvb[3]),w=zvb[2]*sc,h=zvb[3]*sc;
  Object.assign(zoomEl.style,{width:w+'px',height:h+'px',left:((r.width-w)/2)+'px',top:Math.max(4,(r.height-h)/2-r.height*.04)+'px'});return sc;
}
function zoomTo(i){
  zoomI=i;LOG.push('zoom:'+i);renderZoom();zoomEl.hidden=false;const sc=placeZoom(),nr=nailRect(i),g=geo(i),s0=nr.width/(g.w*sc);
  const zl=parseFloat(zoomEl.style.left),zt=parseFloat(zoomEl.style.top),[nx,ny]=stXY(nr.left,nr.top),tx=nx-zl-(-zvb[0]*sc)*s0,ty=ny-zt-(-zvb[1]*sc)*s0;
  zoomEl.animate([{transform:`translate(${tx}px,${ty}px) scale(${s0})`},{transform:'none'}],{duration:ZOOM_MS,easing:'cubic-bezier(.3,.7,.4,1)'});
  zbg.classList.add('on');handBackBtn.hidden=false;tone(660,.1,'sine',.08);tone(880,.12,'sine',.08,.1);decoCards(true);
  G.start({type:mode==='art'?'scrub':'tap',wait:true,at:()=>{const r=zoomEl.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height*.4)}});
}
function unzoom(quiet){if(zoomI==null)return;zoomI=null;zoomEl.hidden=true;zbg.classList.remove('on');handBackBtn.hidden=true;stroke=null;if(!quiet){sfx.pop();modePanel();render()}}
handBackBtn.addEventListener('click',()=>{if(view!=='room')return;actx();G.touch();G.release();LOG.push('hand');unzoom()});
const zoomLocal=(x,y)=>{const r=zoomEl.getBoundingClientRect();return[zvb[0]+(x-r.left)/r.width*zvb[2],zvb[1]+(y-r.top)/r.height*zvb[3]]};
const zoomClient=(lx,ly)=>{const r=zoomEl.getBoundingClientRect();return[r.left+(lx-zvb[0])/zvb[2]*r.width,r.top+(ly-zvb[1])/zvb[3]*r.height]};
const onNail=(g,x,y,m)=>{if(H.inside(g,x,y))return true;const mx=g.w*(m||0);return x>-mx&&x<g.w+mx&&y>-mx&&y<g.h+mx};
/* rail cards in the zoom view: 3 brush colours / 3 shapes / 3 parts */
function newFirst(list,kind){const fresh=list.find(n=>!DATA.seen.includes(kind+':'+n));if(fresh&&DATA.served>=EVERY){const i=list.indexOf(fresh);return{list:[fresh].concat(list.slice(0,i),list.slice(i+1)),fresh}}return{list,fresh:null}}
function decoCards(talk){
  if(zoomI==null)return;const un=unlocked();let html='';
  if(mode==='art'){cards={type:'ink'};html=decoColors().map((c,k)=>`<button class="ns-card in${k===decoSel?' sel':''}" data-k="${k}" aria-label="${c.ko}">${H.TOOLS.brush(c.hex)}</button>`).join('')}
  else if(mode==='stamp'){const nf=newFirst(un.stamps,'s'),L3=[0,1,2].map(k=>nf.list[(shapeSet*3+k)%nf.list.length]).filter((v,k,a)=>a.indexOf(v)===k);cards={type:'shape',items:L3,fresh:nf.fresh};
    html=L3.map((n,k)=>`<button class="ns-card in${k===shapeSel?' sel':''}" data-k="${k}" aria-label="${nameKo(n)}"><svg viewBox="-28 -28 56 56">${H.STAMP[n](inkColor().hex)}</svg>${n===nf.fresh&&shapeSet===0?`<span class="nb">${ICON.ribbon}</span>`:''}</button>`).join('');
    if(nf.fresh&&shapeSet===0)announce('s',nf.fresh)}
  else{const nf=newFirst(un.parts,'p'),cols=levelColors(),L3=[0,1,2].map(k=>nf.list[(partSet*3+k)%nf.list.length]).filter((v,k,a)=>a.indexOf(v)===k),ks=shuffle(cols.map((c,i)=>i)).slice(0,3);
    cards={type:'part',items:L3.map((n,k)=>({item:n,k:ks[k%ks.length]})),fresh:nf.fresh};
    html=cards.items.map((p,k)=>{const c=cols[p.k];return `<button class="ns-card in" data-k="${k}" aria-label="${c.ko} ${nameKo(p.item)}"><svg viewBox="-26 -26 52 52">${H.PART[p.item](c.hex,c.light)}</svg>${p.item===nf.fresh&&partSet===0?`<span class="nb">${ICON.ribbon}</span>`:''}</button>`}).join('');
    if(nf.fresh&&partSet===0)announce('p',nf.fresh)}
  panel.innerHTML=html;
}
function announce(kind,n){const key=kind+':'+n;if(DATA.seen.includes(key))return;DATA.seen.push(key);save();const v=UNL.newVoice||['새 {ko}이(가) 생겼어요!','A new {en}!'];
  const ko=nameKo(n),j=batchim(ko)?'이':'가';say(v[0].replace('{ko}이(가)',ko+j).replace('{ko}',ko),v[1].replace('{en}',nameEn(n)))}
function decoCard(k,b){
  if(suppressClick){suppressClick=false;return}
  if(!cards||zoomI==null)return;
  if(cards.type==='ink'){if(k===decoSel&&levelColors().length>3){decoSet++;decoSel=0;decoCards();sfx.pop();return}decoSel=k;const c=inkColor();sfx.pop();say(c.ko+'!',cap(c.en)+'!');decoCards()}
  else if(cards.type==='shape'){const n=cards.items[k];if(k===shapeSel&&unlocked().stamps.length>3){shapeSet++;shapeSel=0;decoCards();sfx.pop();return}shapeSel=k;sfx.pop();say(nameKo(n)+'!',cap(nameEn(n))+'!');decoCards()}
  else if(cards.type==='part'){if(flying)return;const r=b.getBoundingClientRect(),p=cards.items[k],f=floatPart(p.item,p.k,false,r.left+r.width/2,r.top+r.height/2,r.width*.8);putPart(p.item,p.k,f)}
}
function decoAdded(kind){
  decoN++;if(!firstDeco)firstDeco=performance.now();LOG.push('deco:'+kind);
  if(pi<plan.length-1){if(nextBtn.hidden){showCorner(nextBtn);cornerGuide(nextBtn)}}else armMirror();
}
/* art: finger line, kept only inside the nail (clipped by the nail shape) */
function addPt(lx,ly){const a=stroke.a,l=a.pts[a.pts.length-1];if(l&&Math.hypot(lx-l[0],ly-l[1])<1.5)return;a.pts.push([+lx.toFixed(1),+ly.toFixed(1)]);if(a.pts.length%6===0)tone(900+Math.random()*400,.03,'sine',.03);rd()}
function addStamp(lx,ly){const n=cards&&cards.type==='shape'?cards.items[shapeSel]:unlocked().stamps[0],c=inkColor();
  cs.nails[zoomI].art.push({type:'stamp',shape:n,c:c.vivid,x:lx,y:ly});noise(.08,{type:'lowpass',freq:500,vol:.18});tone(330,.1,'sine',.08,.04);LOG.push('stamp:'+n);decoAdded('stamp');rd()}
/* parts: tap a card or drag it onto the nail; drag a part off to take it away; tap a part to change its colour (같은 규칙: 동물 미용실 꾸미기) */
const SPOTS=[[.5,.5],[.5,.76],[.3,.3],[.7,.3],[.5,.28],[.3,.62],[.7,.62]];
function freeSpot(g,list){for(const [fx,fy] of SPOTS){const x=g.w*fx,y=g.h*fy;if(!list.some(p=>Math.hypot(p.x-x,p.y-y)<g.w*.22))return[x,y]}return[g.w/2,g.h/2]}
function clampIn(g,x,y){let k=0;while(!H.inside(g,x,y)&&k++<20){x+=(g.w/2-x)*.2;y+=(g.h/2-y)*.2}return[x,y]}
function floatPart(item,k,vivid,cx,cy,px){const c=levelColors()[k]||COLORS[0],f=document.createElement('div');f.className='ns-float';f.innerHTML=`<svg viewBox="-26 -26 52 52">${H.PART[item](vivid?c.vivid:c.hex,c.light)}</svg>`;
  const [x,y]=secXY(cx,cy);Object.assign(f.style,{width:px+'px',height:px+'px',left:(x-px/2)+'px',top:(y-px/2)+'px'});sec.appendChild(f);return f}
function flyTo(f,cx,cy,px,ms,then,fade){const r=f.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2),s=px/r.width;
  const a=f.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:fade?0:1}],{duration:ms,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});a.onfinish=()=>{f.remove();then&&then()};a.oncancel=()=>f.remove()}
const partPx=()=>{const g=geo(zoomI),r=zoomEl.getBoundingClientRect();return g.w*.0095*52*r.width/zvb[2]};
const panelPt=()=>{const r=panel.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
function putPart(item,k,f,at){
  if(zoomI==null||phase!=='deco')return;const i=zoomI,g=geo(i),list=cs.nails[i].parts;
  if(list.length>=6){const old=list.shift();LOG.push('off:'+old.item)}
  const [x,y]=at?clampIn(g,at[0],at[1]):freeSpot(g,list),[cx,cy]=zoomClient(x,y);flying++;
  const done=()=>{flying=Math.max(0,flying-1);if(!cs||phase!=='deco')return;const c=levelColors()[k]||COLORS[0];
    list.push({item,k,c:c.vivid,l:c.light,x,y});LOG.push('part:'+item);rd();sfx.pop();SFX.sparkle();say(`${c.ko} ${nameKo(item)}!`,`${cap(c.en)} ${nameEn(item)}!`);decoAdded('parts')};
  if(f)flyTo(f,cx,cy,partPx(),350,done);else done();
}
function partAt(lx,ly){if(zoomI==null)return-1;const g=geo(zoomI),list=cs.nails[zoomI].parts;let best=-1,bd=g.w*.24;list.forEach((p,j)=>{const d=Math.hypot(p.x-lx,p.y-ly);if(d<bd){bd=d;best=j}});return best}
function partColor(j){const p=cs.nails[zoomI].parts[j],cols=levelColors();p.k=(p.k+1)%cols.length;p.c=cols[p.k].vivid;p.l=cols[p.k].light;LOG.push('recolor:'+p.item);rd();const c=cols[p.k];say(c.ko+'!',cap(c.en)+'!');tone(880,.1,'sine',.1)}
function takePart(j,f){const list=cs.nails[zoomI].parts,p=list[j];list.splice(j,1);LOG.push('off:'+p.item);rd();sfx.pop();tone(520,.08,'sine',.1,.05);const [px,py]=panelPt();if(f)flyTo(f,px,py,60,420,null,true);
  decoN=Math.max(0,decoN-1);if(!cs.nails.some(n=>n.parts.length||n.art.length)&&!mirBtn.hidden)hideCorner(mirBtn)}

/* ---------- touches on the stage ---------- */
let down=null;
stage.addEventListener('pointerdown',e=>{
  if(view!=='room'||!cs||e.target.closest('.ns-corner'))return;e.preventDefault();actx();
  const x=e.clientX,y=e.clientY;down={x,y,t:performance.now(),id:e.pointerId,moved:0};
  if(TOOLSTEPS.includes(phase)){const i=nailAt(x,y,.3);down.i=i;if(i<0){miss();return}
    if(phase==='file'&&doneN.has(i)&&cs.nails[i].dust)blow(i);return}
  if(phase==='cure'){G.nudge();return}
  if(phase==='deco'||phase==='finish'){
    if(zoomI==null){const i=nailAt(x,y,.25);if(i<0){miss();return}G.touch();
      if(phase==='deco')zoomTo(i);else{drawCust('happy');tone(988,.1,'sine',.08);L.later(()=>{if(phase==='finish')drawCust('idle')},900)}return}
    const g=geo(zoomI),[lx,ly]=zoomLocal(x,y);G.touch();
    if(mode==='parts'){const j=partAt(lx,ly);if(j>=0){dd={j,id:e.pointerId,x0:x,y0:y,moved:false,f:null};try{stage.setPointerCapture(e.pointerId)}catch(_){}return}
      if(onNail(g,lx,ly,.1)){if(unlocked().parts.length>3){partSet++;decoCards();sfx.pop()}else G.nudge();return}miss();return}
    if(!onNail(g,lx,ly,.08)){miss();return}
    if(mode==='art'){const a={type:'line',c:inkColor().vivid,pts:[]};cs.nails[zoomI].art.push(a);stroke={a,id:e.pointerId};addPt(lx,ly);try{stage.setPointerCapture(e.pointerId)}catch(_){}decoAdded('art');return}
    if(mode==='stamp'){addStamp(lx,ly);return}
  }
});
stage.addEventListener('pointermove',e=>{
  if(down&&e.pointerId===down.id)down.moved=Math.max(down.moved,Math.hypot(e.clientX-down.x,e.clientY-down.y));
  if(stroke&&e.pointerId===stroke.id&&zoomI!=null){const [lx,ly]=zoomLocal(e.clientX,e.clientY);addPt(lx,ly);return}
  if(dd&&e.pointerId===dd.id&&zoomI!=null){
    if(!dd.moved&&Math.hypot(e.clientX-dd.x0,e.clientY-dd.y0)>12){dd.moved=true;const p=cs.nails[zoomI].parts[dd.j];if(!p){dd=null;return}p.hide=true;rd();dd.f=floatPart(p.item,p.k,true,e.clientX,e.clientY,partPx());tone(520,.06,'triangle',.1)}
    if(dd.moved&&dd.f){const [x,y]=secXY(e.clientX,e.clientY),w=dd.f.offsetWidth;dd.f.style.left=(x-w/2)+'px';dd.f.style.top=(y-w/2)+'px'}}
});
const stageUp=e=>{
  G.release();const d=down;down=null;
  if(stroke&&e.pointerId===stroke.id){stroke=null;rd()}
  if(dd&&e.pointerId===dd.id){const t=dd;dd=null;if(!cs||zoomI==null){if(t.f)t.f.remove();return}const list=cs.nails[zoomI].parts,p=list[t.j];if(!p){if(t.f)t.f.remove();return}
    if(!t.moved){partColor(t.j);return}
    const g=geo(zoomI),[lx,ly]=zoomLocal(e.clientX,e.clientY);
    if(e.type!=='pointercancel'&&onNail(g,lx,ly,.05)){const [x,y]=clampIn(g,lx,ly),[cx,cy]=zoomClient(x,y);p.x=x;p.y=y;flyTo(t.f,cx,cy,partPx(),180,()=>{p.hide=false;rd()})}
    else takePart(t.j,t.f);return}
  if(d&&e.type==='pointerup'&&phase==='color'&&d.i>=0&&performance.now()-d.t<350&&d.moved<12)autoBrush(d.i);
};
stage.addEventListener('pointerup',stageUp);stage.addEventListener('pointercancel',stageUp);
/* file: '후~' blows the fine dust away (tap) */
function blow(i){const n=cs.nails[i];n.dust=false;rd();sayL(LINE.blow);noise(.5,{type:'lowpass',freq:900,vol:.12,sweep:-400});LOG.push('blow:'+i);
  const r=nailRect(i),[x,y]=stXY(r.left+r.width/2,r.top);for(let k=0;k<6;k++)spawn('<circle r="2.5" fill="#E9D8C8"/>',x+(k-2.5)*r.width*.14,y,{dx:(k-2.5)*14,dy:-50-k*4,ms:800})}
/* part cards can also be dragged onto the zoomed nail */
panel.addEventListener('pointerdown',e=>{const b=e.target.closest('.ns-card');if(!b||!cards||cards.type!=='part'||cd)return;cd={b,k:+b.dataset.k,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{b.setPointerCapture(e.pointerId)}catch(_){}});
panel.addEventListener('pointermove',e=>{if(!cd||e.pointerId!==cd.id)return;
  if(!cd.moved&&Math.hypot(e.clientX-cd.x0,e.clientY-cd.y0)>12){const p=cards&&cards.items[cd.k];if(!p){cd=null;return}cd.moved=true;cd.p=p;cd.f=floatPart(p.item,p.k,false,e.clientX,e.clientY,cd.b.getBoundingClientRect().width*.8);cd.b.classList.add('lift');tone(520,.06,'triangle',.1)}
  if(cd.moved&&cd.f){const [x,y]=secXY(e.clientX,e.clientY),w=cd.f.offsetWidth;cd.f.style.left=(x-w/2)+'px';cd.f.style.top=(y-w/2)+'px'}});
const endCard=e=>{if(!cd||e.pointerId!==cd.id)return;const d=cd;cd=null;d.b.classList.remove('lift');if(!d.moved)return;suppressClick=true;setTimeout(()=>{suppressClick=false},400);
  if(!cs||zoomI==null||phase!=='deco'||flying){if(d.f)d.f.remove();return}
  const g=geo(zoomI),[lx,ly]=zoomLocal(e.clientX,e.clientY);
  if(e.type!=='pointercancel'&&onNail(g,lx,ly,.15))putPart(d.p.item,d.p.k,d.f,[lx,ly]);
  else{const r=d.b.getBoundingClientRect();flyTo(d.f,r.left+r.width/2,r.top+r.height/2,r.width*.8,250)}};
panel.addEventListener('pointerup',endCard);panel.addEventListener('pointercancel',endCard);

/* ============================== finishing: the child presses the mirror ============================== */
function finishStage(){phase='finish';handWait(true);panel.innerHTML='';cards=null;stepKey='';if(decoN>0)armMirror()}
function armMirror(){if(!mirBtn.hidden||mirrorT)return;const wait=Math.max(0,MIRROR_AFTER-(performance.now()-firstDeco));mirrorT=1;
  L.later(()=>{mirrorT=0;if(!cs||!['deco','finish'].includes(phase)||pi<plan.length-1&&phase!=='finish')return;if(decoN>0){showCorner(mirBtn);cornerGuide(mirBtn)}},wait)}
mirBtn.addEventListener('click',()=>{
  if(mirBtn.hidden||!cs||!['deco','finish'].includes(phase))return;actx();
  phase='mirror';G.stop();hideCorner(mirBtn);hideCorner(nextBtn);unzoom(true);cards=null;panel.innerHTML='';LOG.push('mirror');sfx.pop();render();
  L.later(()=>{handEl.classList.add('raise');drawCust('happy');alPlay('clap');if(al)al.sound('wow');sayL(LINE.wow);[1318,1568,2093].forEach((f,i)=>tone(f,.25,'sine',.06,i*.12))},300);
  L.later(()=>{noise(.05,{type:'lowpass',freq:2200,vol:.12});noise(.07,{type:'lowpass',freq:1400,vol:.1,when:.07});photo()},1700);
  L.later(()=>{const rec={kind:cs.kind,nails:cs.nails.map(n=>Object.assign({},n,{col:n.col.map(p=>p&&{c:p.c,h:p.h,k:p.k,t:0}),dust:false,drop:false}))};
    DATA.wall.unshift(rec);DATA.wall=DATA.wall.slice(0,3);DATA.served++;save();const pr=PR();if(pr&&typeof pr.clear==='function')try{pr.clear(id)}catch(_){}
    stars();sayL(LINE.thanks);tone(1318,.4,'sine',.12);tone(1046,.6,'sine',.12,.3);handEl.classList.remove('raise')},3100);
  L.later(()=>{const i=seatIdx;showLobby({served:{kind:cs.kind},slot:i})},4700);
});
function photo(){
  const r=handEl.getBoundingClientRect(),sr=stage.getBoundingClientRect(),w=Math.min(r.width*.7,sr.height*.5),h=w*112/100;
  const f=document.createElement('div');f.className='ns-photo';f.innerHTML=FRAME(svgInner(H.hand(cs.kind,cs.nails,{id:'nsp'})));
  Object.assign(f.style,{width:w+'px',height:h+'px',left:((sr.width-w)/2)+'px',top:((sr.height-h)/2)+'px'});stage.appendChild(f);requestAnimationFrame(()=>f.classList.add('on'));
  L.later(()=>{const a=f.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${-(sr.width-w)/2-w*.2}px,${-(sr.height-h)/2-h*.25}px) scale(.3)`,opacity:.2}],{duration:1000,easing:'ease-in',fill:'forwards'});a.onfinish=()=>f.remove()},500);
  L.onEnd(()=>f.remove());
}

/* ---------- parent settings: nail shop level (ML.Progress가 없을 때만 바꿀 수 있음) ---------- */
(()=>{const sh=document.querySelector('#settings .sheet'),h4=sh&&sh.querySelector('h4');if(!h4)return;
  const row=document.createElement('div');row.className='row';row.innerHTML=`<span>네일숍 단계</span><div class="seg" id="setNailLv">${LEVELS.map(l=>`<button data-v="${l.level}">${l.level}</button>`).join('')}</div>`;sh.insertBefore(row,h4);
  const seg=row.querySelector('.seg'),sync=()=>seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===levelNo()));
  seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;DATA.level=+b.dataset.v;save();sync()});sync();
  M.__nsLevel=n=>{DATA.level=n;save();sync();lobby=[];return levelNo()};})();

/* debug hook for tests */
M.__ns=()=>({view,phase,level:levelNo(),plan:plan.map(s=>s.deco?s.modes.join('+'):s.key),stepLog:LOG.filter(x=>/^step:/.test(x)).map(x=>x.slice(5)),
  lobby:lobby.map(c=>c&&{kind:c.kind,want:(levelColors()[c.want]||{}).en}),customer:cs?{kind:cs.kind,want:(levelColors()[cs.want]||{}).en}:null,
  hand:(handEl.querySelector('svg')||{dataset:{}}).dataset.hand||null,
  nails:cs?cs.nails.map((n,i)=>({filed:n.filed&&n.filed.map(v=>+v.toFixed(2)),col:H.cells(geo(i)).map((c,j)=>n.col[j]?n.col[j].k:null),colN:n.col.filter(Boolean).length,cells:H.cells(geo(i)).map(c=>[c.c,c.r]),
    base:n.base?n.base.filter(v=>v>=1).length:0,top:n.top?n.top.filter(v=>v>=1).length:0,oil:n.oil?n.oil.filter(v=>v>=1).length:0,drop:n.drop,cured:n.cured,topCured:n.topCured,shine:n.shine,dust:n.dust,
    art:n.art.length,strokes:n.art.filter(a=>a.type==='line').map(a=>a.pts.length),parts:n.parts.map(p=>p.item),jags:handEl.querySelectorAll(`.ns-n[data-i="${i}"] .ns-jag`).length,rect:nailRect(i)})):[],
  done:[...doneN],next:!nextBtn.hidden,mirror:!mirBtn.hidden,zoom:zoomI,mode,modes:cs&&cs.modes||[],cards:cards?cards.type:null,
  zoomRect:zoomI!=null?(r=>({x:r.left,y:r.top,w:r.width,h:r.height}))(zoomEl.getBoundingClientRect()):null,zvb:zvb.slice(),
  partPts:cs&&zoomI!=null?cs.nails[zoomI].parts.map(p=>zoomClient(p.x,p.y)):[],
  lamp:stage.classList.contains('lampon'),dots:dotsEl.querySelectorAll('i.on').length,served:DATA.served,wall:DATA.wall.length,frames:framesEl.querySelectorAll('.nl-frame.full').length,
  misses,guide:G.state(),log:LOG.slice(),alive:al?al.state():null,lobbyAlive:lobbyAl.map(h=>h.state())});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)showLobby()})},exit:()=>{exitRoom();view='lobby';phase='';cs=null;lobby.forEach(c=>{if(c)c.inside=false})},resize:()=>{size();layoutLobby();if(view==='room')render()}};
window.addEventListener('resize',()=>{if(cur()===id){size();layoutLobby()}});
/* home tile icon */
document.querySelectorAll('.tile[data-go="nailshop"] .ic').forEach(ic=>{ic.innerHTML=H.bottle('#FF6F91');const s=ic.querySelector('svg');if(s){s.style.width='1.1em';s.style.height='1.5em'}});
})();
