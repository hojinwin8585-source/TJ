/* 말랑 아이스크림 가게 (P17) — 가게 앞에서 손님을 고르면, 콘이나 컵을 고르고 스쿱으로 통을 쓱쓱 긁어 공을 만들어요.
   흐름(MLCFG.games.icecream.flow): 손님 고르기(말풍선에 맛 색깔) → 콘/컵 카드 2장 → 통 고르기 → 스쿱으로 통을 쓱쓱(닿은 만큼만 공이 커지고, 공이 돌돌 말림) →
   콘을 콕(공이 날아가 톡, 납작했다 돌아옴) → 토핑 통을 흔들어 쓱쓱(스프링클이 떨어져 튐) → (3단계부터 체리 콕) → 건네주기 → 냠냠, 코에 아이스크림.
   단계(games.icecream.levels): 1 한 스쿱·맛 2가지 / 2 두 스쿱·맛 3가지 / 3 체리 토핑 / 4 손님이 고른 맛과 같은 색 고르기.
   쇠규칙: 글자·이모지 없음 · '다음' 버튼 없음 · 세 구역 · 실패 없음(4단계에서 다른 통을 누르면 무슨 맛인지 말해 주고 다시) · 끌기는 모두 콕콕으로도 됨.
   단계: ML.Progress.get("icecream").level, 없으면 1단계 고정(ML.__icLevel). 시험용: ML.__ic(), ML.__icDepth(). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store,batchim}=M;
const {life,noise,sweepTone,SFX}=P;
const id='icecream2',GID='icecream',L=life(id),OL=A.OL;
const S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`,S2=`stroke="${OL}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},GC=((CF.games||{})[GID])||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{},CC=(CF.calm||{}).choiceColors||[],MO=CF.motion||{};
const PART=Object.assign({max:40,fadeMs:800},MO.particles||{});
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);
const TAP_LOCK=TOUCH.tapLockMs||1200;
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const PRAISE=VO.praise||[{ko:'잘했어!',en:'Good job!'}];
const LV=GC.levels&&GC.levels.length?GC.levels:[{level:1,new:'한 스쿱, 맛 2가지'}];
const LOG=[];
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(c1,c2,t)=>{t=Math.max(0,Math.min(1,t));const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),a=h(c1),b=h(c2);return '#'+a.map((v,i)=>Math.round(lerp(v,b[i],t)).toString(16).padStart(2,'0')).join('')};
const FACE=(cx,cy,s=1)=>`<g class="tf"><ellipse class="tf-eye" cx="${cx-8*s}" cy="${cy}" rx="${2.8*s}" ry="${4*s}" fill="${OL}"/><ellipse class="tf-eye" cx="${cx+8*s}" cy="${cy}" rx="${2.8*s}" ry="${4*s}" fill="${OL}"/><path class="tf-grin" d="M${cx-5*s} ${cy+7*s}Q${cx} ${cy+13*s} ${cx+5*s} ${cy+7*s}Z" fill="#B5473A" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/></g>`;
/* flavours: the calm colour is the tub, the result (the ball) blooms toward the vivid colour (calm.choiceColors). Chocolate is not in config */
const CCby=en=>CC.find(c=>c.en===en)||{};
const FLV=[
  {k:'strawberry',ko:'딸기',en:'strawberry',hex:CCby('pink').hex||'#E89AAE',vivid:CCby('pink').vivid||'#FF6F91'},
  {k:'mint',ko:'민트',en:'mint',hex:CCby('mint').hex||'#86CDBE',vivid:CCby('mint').vivid||'#3FCFB4'},
  {k:'vanilla',ko:'바닐라',en:'vanilla',hex:CCby('yellow').hex||'#EBCB6B',vivid:CCby('yellow').vivid||'#FFC93C'},
  {k:'choco',ko:'초코',en:'chocolate',hex:'#B8865E',vivid:'#8B5A3C'}];
const ballC=f=>mix(f.hex,f.vivid,.45),ballL=f=>mix(ballC(f),'#ffffff',.45),ballD=f=>mix(ballC(f),'#5B3A29',.22);
const SPRK=(CC.length?CC.filter(c=>/pink|yellow|sky|green|purple/.test(c.en)).map(c=>c.vivid):['#FF6F91','#FFC93C','#5EC2FF','#5CC76B','#9A7BFF']);

/* ============================== pictures ============================== */
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  cust:`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="34" fill="#FFF9F2" ${S3}/><ellipse cx="34" cy="22" rx="9" ry="20" fill="#FFF9F2" ${S3}/><ellipse cx="66" cy="22" rx="9" ry="20" fill="#FFF9F2" ${S3}/><circle cx="40" cy="50" r="4" fill="${OL}"/><circle cx="60" cy="50" r="4" fill="${OL}"/><path d="M42 62Q50 70 58 62" fill="none" ${S2}/></svg>`
};
/* one ball of ice cream (centre x,y, radius r): bumpy bottom edge, curl lines, shine */
function ball(f,x,y,r,rot){
  const c=ballC(f),d=ballD(f),l=ballL(f),n=9;let bump='';for(let i=0;i<=n;i++){const a=Math.PI*(i/n),bx=x+Math.cos(a)*r*1.02,by=y+r*.38+Math.sin(a)*r*.18;bump+=(i?'Q':'M')+(i?`${(x+Math.cos(a-Math.PI/n/2)*r*1.08).toFixed(1)} ${(by+r*.14).toFixed(1)} `:'')+`${bx.toFixed(1)} ${by.toFixed(1)}`}
  return `<g transform="rotate(${rot||0} ${x} ${y})"><path d="M${x-r} ${y+r*.36}A${r} ${r} 0 1 1 ${x+r} ${y+r*.36}Z" fill="${c}" ${S3}/><path d="${bump}" fill="${c}" ${S3}/><path d="M${x-r*.98} ${y+r*.36}H${x+r*.98}" stroke="${c}" stroke-width="5"/>
    <path d="M${x-r*.55} ${y-r*.05}Q${x-r*.1} ${y-r*.42} ${x+r*.45} ${y-r*.12}" stroke="${d}" stroke-width="${Math.max(2,r*.07)}" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${x-r*.35} ${y+r*.2}Q${x+r*.1} ${y-r*.05} ${x+r*.6} ${y+r*.2}" stroke="${d}" stroke-width="${Math.max(2,r*.06)}" fill="none" stroke-linecap="round" opacity=".45"/>
    <ellipse cx="${x-r*.38}" cy="${y-r*.42}" rx="${r*.24}" ry="${r*.14}" fill="${l}" opacity=".9" transform="rotate(-25 ${x-r*.38} ${y-r*.42})"/></g>`;
}
const ballSVG=(f,rot)=>`<svg viewBox="-60 -60 120 120" style="overflow:visible">${ball(f,0,-6,52,rot)}</svg>`;
/* cone or cup with what is on it (viewBox 0 0 200 300). scoops: flavours bottom → top, sp: sprinkles [x,y,rot,colour], cherry */
const CONE_TOP=168,SCOOP_Y=[134,80],SCOOP_R=50;
function treat(o){
  let s=`<ellipse cx="100" cy="292" rx="46" ry="6" fill="rgba(90,50,20,.14)"/>`;
  const holder=o.holder||'cone';
  if(holder==='cone')s+=`<path d="M48 ${CONE_TOP}L100 290L152 ${CONE_TOP}Z" fill="#E8B46C" ${S3}/><path d="M62 ${CONE_TOP+10}L118 270M84 ${CONE_TOP+6}L130 238M106 ${CONE_TOP+4}L140 208M138 ${CONE_TOP+10}L82 270M116 ${CONE_TOP+6}L70 238M94 ${CONE_TOP+4}L60 208" stroke="#C98A3E" stroke-width="3" stroke-linecap="round"/><path d="M44 ${CONE_TOP-6}H156V${CONE_TOP+6}Q100 ${CONE_TOP+16} 44 ${CONE_TOP+6}Z" fill="#F0C882" ${S3}/>`;
  else s+=`<path d="M38 ${CONE_TOP}H162L148 280Q146 288 138 288H62Q54 288 52 280Z" fill="${PAL.sky||'#A7CFE8'}" ${S3}/><path d="M50 ${CONE_TOP+30}H150M55 ${CONE_TOP+70}H145" stroke="#fff" stroke-width="7" opacity=".7"/><path d="M34 ${CONE_TOP-6}H166V${CONE_TOP+6}H34Z" fill="#CFE5F4" ${S3}/>`;
  (o.scoops||[]).forEach((f,i)=>{s+=ball(f,100,SCOOP_Y[i]+(holder==='cup'?8:0),SCOOP_R-i*4,0)});
  (o.sp||[]).forEach(([x,y,r,c])=>{s+=`<rect x="${x-6}" y="${y-2.4}" width="12" height="4.8" rx="2.4" fill="${c}" stroke="${OL}" stroke-width="1" transform="rotate(${r} ${x} ${y})"/>`});
  if(o.cherry){const n=(o.scoops||[]).length,cy=SCOOP_Y[Math.max(0,n-1)]-SCOOP_R+4+(holder==='cup'?8:0);s+=cherryAt(100,cy)}
  return `<svg viewBox="0 0 200 300" style="overflow:visible">${s}</svg>`;
}
const cherryAt=(x,y)=>`<path d="M${x+2} ${y-12}Q${x+6} ${y-34} ${x+20} ${y-40}" stroke="#6E8F3A" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="15" fill="#E5434F" ${S3}/><ellipse cx="${x-5}" cy="${y-5}" rx="5" ry="3.4" fill="#fff" opacity=".75"/>`;
const cherrySVG=`<svg viewBox="-30 -50 60 72" style="overflow:visible">${cherryAt(0,0)}</svg>`;
/* tub (viewBox 0 0 160 150): cells = scraped places (grooves where the scoop went) */
const TUB_CELLS=[[50,50],[80,44],[110,50],[60,64],[100,64],[80,56]];
function tubSVG(f,cells,dim){
  let s=`<ellipse cx="82" cy="142" rx="66" ry="7" fill="rgba(90,50,20,.14)"/><path d="M14 52L24 132Q26 140 36 140H124Q134 140 136 132L146 52Z" fill="#FFFDF9" ${S3}/><path d="M18 78H142L138 108H22Z" fill="${f.hex}" opacity=".8"/><circle cx="80" cy="93" r="11" fill="#FFFDF9" opacity=".9"/>${ball(f,80,93,8,0).replace(S3,S2)}`;
  s+=`<ellipse cx="80" cy="52" rx="68" ry="20" fill="${f.hex}" ${S3}/><path d="M24 50Q40 32 58 44Q70 30 88 42Q104 30 120 44Q132 38 138 50" fill="${mix(f.hex,'#ffffff',.25)}" stroke="none"/>`;
  (cells||[]).forEach((v,i)=>{if(v<.05)return;const [x,y]=TUB_CELLS[i];s+=`<path d="M${x-14} ${y}Q${x} ${y-8} ${x+14} ${y}" stroke="${mix(f.hex,'#5B3A29',.25)}" stroke-width="4" fill="none" stroke-linecap="round" opacity="${Math.min(1,v).toFixed(2)}"/><path d="M${x-10} ${y+5}Q${x} ${y-1} ${x+10} ${y+5}" stroke="${mix(f.hex,'#fff',.4)}" stroke-width="3" fill="none" stroke-linecap="round" opacity="${Math.min(1,v).toFixed(2)}"/>`});
  return `<svg viewBox="0 0 160 165" style="overflow:visible${dim?';opacity:.55':''}"><g transform="translate(0 15)">${s}</g></svg>`;
}
/* scoop tool (viewBox 0 0 100 100): bowl at the lower left = working point */
const scoopSVG=`<svg viewBox="0 0 100 100"><path d="M44 52L90 10" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M44 52L90 10" stroke="${PAL.rose||'#E8A0AE'}" stroke-width="8" stroke-linecap="round"/><path d="M8 70Q8 46 30 46Q52 46 52 68Q52 90 30 90Q8 90 8 70Z" fill="#DDE3EA" ${S3}/><path d="M16 66Q20 54 32 54" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>${FACE(76,26,.55)}</svg>`;
/* topping shaker (viewBox 0 0 100 100): holes at the bottom = working point */
const shakerSVG=`<svg viewBox="0 0 100 100"><rect x="30" y="18" width="40" height="66" rx="14" fill="#FFFDF9" fill-opacity=".9" ${S3}/>${[[40,40,0],[54,50,40],[44,62,-30],[58,70,70],[46,74,10]].map(([x,y,r],i)=>`<rect x="${x-5}" y="${y-2}" width="10" height="4" rx="2" fill="${SPRK[i%SPRK.length]}" transform="rotate(${r} ${x} ${y})"/>`).join('')}<path d="M28 80H72V90Q72 96 66 96H34Q28 96 28 90Z" fill="${PAL.lilac||'#C3B4E6'}" ${S3}/><circle cx="42" cy="90" r="2" fill="${OL}"/><circle cx="50" cy="92" r="2" fill="${OL}"/><circle cx="58" cy="90" r="2" fill="${OL}"/><rect x="34" y="6" width="32" height="14" rx="6" fill="${PAL.lilac||'#C3B4E6'}" ${S3}/>${FACE(50,32,.7)}</svg>`;
const coneCard=`<svg viewBox="20 140 160 160">${svgInner(treat({holder:'cone'}))}</svg>`,cupCard=`<svg viewBox="20 140 160 160">${svgInner(treat({holder:'cup'}))}</svg>`;
const flavorBub=f=>`<svg viewBox="10 70 180 230">${svgInner(treat({holder:'cone',scoops:[f]}))}</svg>`;
const STEP_ICON={cone:()=>coneCard,tub:()=>tubSVG(FLV[0],[]),scoop:()=>scoopSVG,place:()=>`<svg viewBox="0 20 200 280">${svgInner(treat({holder:'cone',scoops:[FLV[0]]}))}</svg>`,sprinkle:()=>shakerSVG,cherry:()=>cherrySVG};
const stepIcon=k=>(STEP_ICON[k]||(()=>ICON.cust))();
const LOBBY_BG=`<svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax slice" style="width:100%;height:100%;display:block"><rect width="100" height="130" fill="#F3ECF3"/><rect y="88" width="100" height="42" fill="#E6D3DC"/><path d="M0 88H100" stroke="${OL}" stroke-width=".8"/>
 <rect x="8" y="22" width="84" height="40" rx="4" fill="#FFFDF9" stroke="${OL}" stroke-width="1"/><rect x="12" y="26" width="76" height="32" rx="2" fill="#E5F1F6"/>
 ${FLV.map((f,i)=>`<g transform="translate(${16+i*19} 30)"><path d="M2 14H16L14 26H4Z" fill="#FFFDF9" stroke="${OL}" stroke-width=".7"/><ellipse cx="9" cy="14" rx="8" ry="3" fill="${f.hex}" stroke="${OL}" stroke-width=".7"/></g>`).join('')}
 <path d="M4 4H96V14Q92 18 88 14Q84 18 80 14Q76 18 72 14Q68 18 64 14Q60 18 56 14Q52 18 48 14Q44 18 40 14Q36 18 32 14Q28 18 24 14Q20 18 16 14Q12 18 8 14Q4 18 4 14Z" fill="#E8A0AE" stroke="${OL}" stroke-width="1"/>
 ${[0,1,2,3,4,5].map(i=>`<path d="M${4+i*16} 4H${12+i*16}V15Q${8+i*16} 18 ${4+i*16} 15Z" fill="#FFFDF9" opacity=".75"/>`).join('')}
 <g transform="translate(70 64) scale(.1)">${svgInner(treat({holder:'cone',scoops:[FLV[0],FLV[1]]}))}</g></svg>`;
const WALL=`<svg viewBox="0 0 100 30" preserveAspectRatio="none"><rect width="100" height="30" fill="#F3ECF3"/>${Array.from({length:10},(_,i)=>`<rect x="${i*10}" y="0" width="5" height="30" fill="#EEE4EE"/>`).join('')}<rect y="22" width="100" height="8" fill="#E6D3DC"/></svg>`;

/* ============================== screen ============================== */
const css=`
#${id}{gap:6px}
#${id} .ic-head{flex:none;height:${HEAD_PX}px;gap:8px}
#${id} .ic-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#${id} .ic-back svg{width:100%;height:100%;display:block}
.ic-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.ic-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.ic-strip span svg{width:72%;height:72%;display:block}
.ic-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.ic-strip span.done{opacity:.9}
.ic-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.ic-strip span .st svg{width:100%;height:100%}
.ic-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3ECF3}
.ic-stage>div{position:absolute}
.ic-lobby{inset:0;z-index:1;overflow:hidden}
.ic-lobby>div{position:absolute;pointer-events:none}
.ic-lbg{inset:0}
.ic-lc{position:absolute;border:0;padding:0;background:none;pointer-events:auto;touch-action:none;transition:transform 1s ease-in,opacity .6s}
.ic-lc .lc-ani{position:absolute;left:3%;right:3%;bottom:0;aspect-ratio:200/230}
.ic-lc .lc-ani svg{width:100%;height:100%;display:block;overflow:visible}
.ic-lc .lc-bub{position:absolute;right:-8%;top:-16%;width:52%;aspect-ratio:1;border-radius:50%;background:var(--paper);border:3px solid ${OL};display:grid;place-items:center;padding:8%;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.ic-lc .lc-bub svg{width:100%;height:100%;display:block;overflow:visible}
.ic-lc.sel{transform:translateY(-12px) scale(1.06)}
.ic-lc.gone{opacity:0;pointer-events:none}
.ic-wall{left:0;right:0;top:0;pointer-events:none}
.ic-wall svg{width:100%;height:100%;display:block}
.ic-counter{left:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(180deg,#EADBE2,#E3CFD8);border-top:4px solid ${OL}}
.ic-cust{z-index:3;pointer-events:none}
.ic-cust svg{width:100%;height:100%;display:block;overflow:visible}
.ic-cust.enter{animation:icin 1.1s cubic-bezier(.3,1.1,.5,1)}
.ic-cust.leave{animation:icout 1.1s ease-in forwards}
@keyframes icin{from{transform:translateX(120%)}to{transform:none}}
@keyframes icout{to{transform:translateX(130%)}}
.ic-cust.alive.ic-rub .al-arm-r{animation:icrub 1.6s ease-in-out infinite}
@keyframes icrub{0%,100%{transform:rotate(38deg)}50%{transform:rotate(54deg)}}
.ic-cfx{z-index:4;pointer-events:none}
.ic-cfx svg{width:100%;height:100%;display:block;overflow:visible}
.ic-cfx .ck{transform-box:fill-box;transform-origin:50% 50%;opacity:0}
.ic-cfx.puff .ck{animation:icpuff .6s ease-in-out 3}
@keyframes icpuff{0%,100%{opacity:0;transform:scale(.6)}40%,60%{opacity:.95;transform:scale(1.15)}}
.ic-cfx .sn{opacity:0}
.ic-cfx.sniff .sn{animation:icsniff 1.4s ease-out}
@keyframes icsniff{0%{opacity:0;transform:translateY(16px)}30%{opacity:.9}100%{opacity:0;transform:translateY(-10px)}}
.ic-cfx .nose{transition:opacity .3s;opacity:0}
.ic-cfx.smudge .nose{opacity:1}
.ic-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:50%;padding:7px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.ic-bub svg{width:100%;height:100%;display:block;overflow:visible}
.ic-work{z-index:5;left:0;right:0;bottom:0;pointer-events:none}
.ic-it{position:absolute;pointer-events:none;transition:left .5s ease-in-out,top .5s ease-in-out,width .5s ease-in-out,height .5s ease-in-out,opacity .35s}
.ic-it>svg{width:100%;height:100%;display:block;overflow:visible}
.ic-it.hide{opacity:0;visibility:hidden}
.ic-ball{position:absolute;z-index:9;pointer-events:none;transition:width .12s ease-out,height .12s ease-out,margin .12s ease-out}
.ic-ball>svg{width:100%;height:100%;display:block;overflow:visible}
.ic-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.ic-float{position:absolute;pointer-events:none;will-change:transform}
.ic-float>svg{width:100%;height:100%;display:block;overflow:visible}
.ic-pt{position:absolute;pointer-events:none;will-change:transform,opacity}
.ic-pt svg{width:100%;height:100%;display:block;overflow:visible}
.ic-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.ic-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.ic-tool svg{width:100%;height:100%;display:block;overflow:visible}
.ic-tool.in{animation:iccard .3s ease-out both}
.ic-card{position:relative;flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:12px;background:var(--paper);display:block;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.ic-card svg{position:absolute;left:12px;top:12px;width:calc(100% - 24px);height:calc(100% - 24px);display:block;pointer-events:none;overflow:visible}
.ic-card.in{animation:iccard .3s ease-out both}
.ic-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.ic-card.fade{opacity:.35}
@keyframes iccard{from{transform:translateY(24px);opacity:0}}
.ic-nope{animation:icnope .5s}
@keyframes icnope{0%,100%{transform:none}20%{transform:translateX(-10px) rotate(-6deg)}50%{transform:translateX(9px) rotate(5deg)}80%{transform:translateX(-4px)}}
.ic-callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
/* P16: the screen and its header come from the common shell (ML.Shell.screen): same back picture, size and place on every screen */
const sec=M.Shell.screen(id,{title:'아이스크림 가게',headClass:'ic-head',backClass:'ic-back',stripClass:'ic-strip',stripId:'icStrip',body:`<div class="ic-stage" id="icStage">
<div class="ic-lobby" id="icLobby" hidden><div class="ic-lbg">${LOBBY_BG}</div></div><div class="ic-wall" id="icWall">${WALL}</div><div class="ic-counter" id="icCounter"></div>
<div class="ic-cust" id="icCust"></div><div class="ic-cfx" id="icCfx"></div><div class="ic-bub" id="icBub" hidden></div><div class="ic-work" id="icWork"></div><div class="ic-fx" id="icFx"></div></div><div class="ic-tray" id="icTray"></div>`}).sec;
const $=s=>sec.querySelector(s);
const stage=$('#icStage'),stripEl=$('#icStrip'),tray=$('#icTray'),lobbyEl=$('#icLobby'),wallEl=$('#icWall'),counterEl=$('#icCounter'),custEl=$('#icCust'),cfxEl=$('#icCfx'),bubEl=$('#icBub'),work=$('#icWork'),fxEl=$('#icFx');
cfxEl.innerHTML=`<svg viewBox="0 0 200 230"><circle class="ck" cx="62" cy="130" r="17" fill="#FF9DB0"/><circle class="ck" cx="138" cy="130" r="17" fill="#FF9DB0"/>
<g class="sn" fill="none" stroke="#C9A468" stroke-width="4" stroke-linecap="round"><path d="M70 150q-8 -10 0 -20t0 -20"/><path d="M130 150q8 -10 0 -20t0 -20"/></g><path class="nose" d="M88 112Q90 100 102 102Q114 100 113 112Q112 120 100 119Q89 120 88 112Z" fill="#FFFDF6" stroke="${OL}" stroke-width="2"/></svg>`;
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0},store.get('mallang_icecream2',{}));
const save=()=>store.set('mallang_icecream2',DATA);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
if(PRG())PRG().register(GID,{max:LV.length,name:'아이스크림 가게',seg:'setIcLv',seed:DATA.level});
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LV.length,n))}
/* games.icecream.levels[].new: '한 스쿱/두 스쿱', '맛 N가지', '토핑(…체리)', '같은 색 고르기' */
function levelInfo(n){
  const f={level:n,scoops:1,flavors:2,cherry:false,match:false};
  LV.slice(0,n).forEach(l=>{const t=l.new||'';if(/두 스쿱/.test(t))f.scoops=2;const m=t.match(/맛\s*(\d)\s*가지/);if(m)f.flavors=Math.max(2,Math.min(3,+m[1]));if(/체리/.test(t))f.cherry=true;if(/같은 색/.test(t))f.match=true});
  return f;
}
function planFor(v){const p=['cone'];for(let i=0;i<v.scoops;i++)p.push('tub','scoop','place');p.push('sprinkle');if(v.cherry)p.push('cherry');p.push('serve');return p}

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
const VB={treat:[200,300],tub0:[160,165],tub1:[160,165],tub2:[160,165]};
const at=(n,x,y)=>{const r=rectOf(n),v=VB[n];return[r.left+x/v[0]*r.width,r.top+y/v[1]*r.height]};
let raf=0;const rd=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})};
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  layout();
}
function miss(){misses++;G.nudge();const t=HOT()[0]||custEl;if(t){t.classList.remove('ic-callme');void t.offsetWidth;t.classList.add('ic-callme');setTimeout(()=>t.classList.remove('ic-callme'),700)}
  const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
stage.addEventListener('pointerdown',e=>{actx();if(!H.down)return;e.preventDefault();G.touch();const r=H.down(e);if(r===false){miss();return}if(H.move||H.up){try{stage.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId}});
stage.addEventListener('pointermove',e=>{if(act===e.pointerId&&H.move)H.move(e)});
const endP=e=>{G.release();if(act!==e.pointerId)return;act=null;if(H.up)H.up(e)};
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,endP));
const alMood=(m,ms)=>{if(!al)return;al.setMood(m);if(ms){const g=gen;L.later(()=>{if(g===gen&&al)al.setMood('')},ms)}};
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};
const tapOk=()=>{const n=performance.now();if(n-lastTap<260)return false;lastTap=n;return true};
function toolTray(html){tray.innerHTML=`<div class="ic-tool in">${html}</div>`;return tray.querySelector('.ic-tool')}
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});
const rubBelly=on=>custEl.classList.toggle('ic-rub',!!on);
let lastSniff=0;
function sniff(talk){const n=performance.now();if(n-lastSniff<2500)return;lastSniff=n;cfxEl.classList.remove('sniff');void cfxEl.offsetWidth;cfxEl.classList.add('sniff');LOG.push('sniff');if(talk)say('킁킁, 달콤한 냄새!','Sniff sniff, smells sweet!');alMood('wow',900)}

/* ---------- motion helpers ---------- */
const anim=(el,frames,o)=>{try{return el.animate(frames,Object.assign({fill:'none'},o))}catch(e){return null}};
const squash=el=>anim(el,[{transform:'scale(1.18,.78)'},{transform:'scale(.92,1.08)',offset:.35},{transform:'scale(1.04,.97)',offset:.65},{transform:'none'}],{duration:450,easing:'ease-out'});
const PT={
  sprinkle:c=>`<svg viewBox="-8 -4 16 8"><rect x="-6" y="-2.4" width="12" height="4.8" rx="2.4" fill="${c||'#FF6F91'}" stroke="${OL}" stroke-width="1"/></svg>`,
  spark:()=>`<svg viewBox="-20 -20 40 40"><path d="M0 -18Q2 -2 18 0Q2 2 0 18Q-2 2 -18 0Q-2 -2 0 -18Z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  frost:()=>`<svg viewBox="-12 -12 24 24"><path d="M0 -10V10M-9 -5L9 5M-9 5L9 -5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  curl:c=>`<svg viewBox="-12 -12 24 24"><path d="M-8 4Q-8 -8 2 -6Q8 -4 4 2Q0 6 -2 0" fill="none" stroke="${c||'#fff'}" stroke-width="4" stroke-linecap="round"/></svg>`
};
function pt(kind,x,y,o={}){
  if(ptNow>=PART.max)return;ptNow++;ptPeak=Math.max(ptPeak,ptNow);
  const d=document.createElement('div');d.className='ic-pt';const sz=o.sz||14;d.innerHTML=PT[kind](o.c);
  Object.assign(d.style,{left:(x-sz/2)+'px',top:(y-sz/2)+'px',width:sz+'px',height:sz+'px'});fxEl.appendChild(d);
  const dx=o.dx||0,dy=o.dy||0,up=o.up||0,r=o.rot||0,ms=o.ms||PART.fadeMs;let fr;
  if(o.bounce)fr=[{transform:`translate(0,0) rotate(0)`,opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-up}px) rotate(${r/2}deg)`,offset:.35},{transform:`translate(${dx}px,${dy}px) rotate(${r}deg)`,offset:.6},{transform:`translate(${dx*1.15}px,${dy-up*.3}px) rotate(${r}deg)`,offset:.76},{transform:`translate(${dx*1.25}px,${dy}px) rotate(${r}deg)`,opacity:1,offset:.9},{transform:`translate(${dx*1.25}px,${dy}px) rotate(${r}deg)`,opacity:0}];
  else fr=[{transform:'translate(0,0) scale(.6)',opacity:0},{transform:`translate(${dx*.5}px,${dy*.5-up}px) scale(1)`,opacity:1,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(.7)`,opacity:0}];
  anim(d,fr,{duration:ms,easing:'ease-out',fill:'forwards'});
  setTimeout(()=>{d.remove();ptNow--},ms+30);
}
function fly(html,from,to,s0,s1,ms,then,o={}){
  const f=document.createElement('div');f.className='ic-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0,up=o.up==null?60:o.up,sp=o.spin||0;let done=false;
  const fin=()=>{if(done)return;done=true;if(o.keep){const [tx,ty]=stXY(to[0],to[1]);f.getAnimations().forEach(a=>a.cancel());Object.assign(f.style,{left:(tx-s1/2)+'px',top:(ty-s1/2)+'px',width:s1+'px',height:s1+'px'});if(then)then(f);return}f.remove();if(then)then()};
  const a=anim(f,[{transform:'translate(0,0) scale(1) rotate(0)'},{transform:`translate(${dx/2}px,${Math.min(dy/2,0)-up}px) scale(${(1+k)/2}) rotate(${sp/2}deg)`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k}) rotate(${sp}deg)`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});
  if(a)a.onfinish=fin;setTimeout(fin,ms+400);return f;
}

/* ---------- layout ---------- */
function mkIt(name,html,cls){const d=document.createElement('div');d.className='ic-it hide '+(cls||'');d.dataset.n=name;d.innerHTML=html;work.appendChild(d);E[name]=d;return d}
function setIt(n,q){const el=E[n];if(!el)return;if(!q){el.classList.add('hide');return}Object.assign(el.style,{left:(q[0]-q[2]/2)+'px',top:(q[1]-q[3]/2)+'px',width:q[2]+'px',height:q[3]+'px'});el.classList.remove('hide')}
const showView=v=>{if(S)S.view=v;lobbyEl.hidden=v!=='lobby';[wallEl,counterEl,custEl,cfxEl,work].forEach(e=>{e.style.visibility=v==='lobby'?'hidden':''});if(v==='lobby')bubEl.hidden=true};
function LAY(){
  const {W,Hc}=G0,r={},ph=phase,nt=S.tubs.length;
  const big=ph==='sprinkle'||ph==='cherry'||ph==='serve'||ph==='cone';
  if(big){const h=Math.min(Hc*.94,W*.9*1.5),w=h*200/300;r.treat=[W/2,Hc/2+4,w,h];return r}
  const th=Math.min(Hc*.62,(W*.36)*1.5),tw=th*200/300;r.treat=[W-tw/2-8,Hc-th/2-6,tw,th];
  if(ph==='tub'||ph==='enter'){const w=Math.max(112,Math.min((W-8)/nt-8,150)),h=w*165/160,gap=(W-nt*w)/(nt+1);
    S.tubs.forEach((f,i)=>{r['tub'+i]=[gap+w/2+i*(w+gap),Math.max(h/2+6,Math.min(Hc*.3,Hc-th-h/2-14)),w,h]})}
  else{const w=Math.min(W-tw-30,Hc*.85,320),h=w*165/160;r['tub'+S.tubI]=[10+w/2,Math.max(h/2+10,Hc*.48),w,h]}
  return r;
}
function lay(){if(!S||!G0.W||S.view!=='work')return;const R=LAY();Object.keys(E).forEach(n=>setIt(n,R[n]));placeBall()}
function layoutLobby(){
  if(!S||S.view!=='lobby')return;const r=lobbyEl.getBoundingClientRect(),W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.3,150))),gap=(W-3*bw)/4,bh=Math.round(bw*1.32);
  lobbyEl.querySelectorAll('.ic-lc').forEach((b,i)=>Object.assign(b.style,{left:(gap+i*(bw+gap))+'px',bottom:Math.round(Hh*.05)+'px',width:bw+'px',height:bh+'px'}));
}
function layout(){
  const r=stR(),W=r.width,Hh=r.height;if(!W||!Hh)return;
  const wallH=Math.round(Math.max(96,Math.min(Hh*.27,Hh-400))),Hc=Hh-wallH;G0={W,H:Hh,wallH,Hc};
  Object.assign(wallEl.style,{height:wallH+'px'});Object.assign(counterEl.style,{top:wallH+'px'});Object.assign(work.style,{top:wallH+'px'});
  const ch=wallH*1.12,cw=ch*200/230,box={width:cw+'px',height:ch+'px',right:(W*.02)+'px',top:Math.max(0,wallH-ch*.9)+'px'};Object.assign(custEl.style,box);Object.assign(cfxEl.style,box);
  const bs=Math.min(72,wallH*.66);Object.assign(bubEl.style,{width:bs+'px',height:bs+'px',right:(W*.02+cw+6)+'px',top:(wallH*.1)+'px'});
  layoutLobby();lay();
}
/* ---------- drawing ---------- */
function draw(){
  if(!S||S.view!=='work')return;
  if(E.treat)E.treat.innerHTML=treat({holder:S.holder,scoops:S.scoops,sp:S.sp,cherry:S.cherry});
  S.tubs.forEach((f,i)=>{if(E['tub'+i])E['tub'+i].innerHTML=tubSVG(f,i===S.tubI?S.tubCells:[],false)});
}
function drawCust(m){if(!S||!S.kind)return;custEl.innerHTML=A.animal(S.kind,m||'idle',{});if(al&&al.refresh)al.refresh()}
/* the ball being scooped: its size = how much the scoop has touched (nothing grows by itself) */
const ballEl=document.createElement('div');ballEl.className='ic-ball';ballEl.hidden=true;stage.appendChild(ballEl);
const BALL_MAX=()=>{const r=rectOf('treat');return r?r.width*.56:110};
let ballAt=null,ballRot=0;
function ballSize(){return S&&S.scoopP>0?BALL_MAX()*(.18+.82*S.scoopP):0}
function placeBall(){
  if(!S||!S.ball){ballEl.hidden=true;return}const d=ballSize();if(d<=0){ballEl.hidden=true;return}
  let x,y;if(ballAt){[x,y]=ballAt}else{const r=rectOf('tub'+S.tubI);if(!r){ballEl.hidden=true;return}const [sx,sy]=stXY(r.left+r.width*.5,r.top+r.height*.3);x=sx;y=sy-d*.3}
  ballEl.hidden=false;Object.assign(ballEl.style,{width:d+'px',height:d+'px',left:(x-d/2)+'px',top:(y-d/2)+'px'});
  ballEl.innerHTML=ballSVG(S.ball,ballRot);
}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5),lob=S&&S.view==='lobby';
  stripEl.innerHTML=(lob?`<span class="on">${ICON.cust}</span>`:'')+win.map(o=>`<span class="${lob?'':o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${!lob&&o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function finish(between){
  H={};kind='wait';AIM=null;HOT=()=>[];const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');rubBelly(true);
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;const k=plan[pi];if(!k)return;phase=k;strip();size();draw();G.place();STEP[k]()}
function rubTool(o){
  killTool();
  tool=P.makeTool(stage,{tool:o.icon,effect:'rub',anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,rub:Object.assign({tapChunk:.12},o.rub||{}),tilt:true,tapAnim:o.tapAnim==null?420:o.tapAnim,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:o.grid||[4,4],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx||(()=>''),onMiss:miss,onFrame:o.frame,onTap:o.tap,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log);rubBelly(false);if(o.touch)o.touch()},onRelease:()=>{G.release();if(o.release)o.release()},
    onCell:(i,v,pv,why)=>{o.cell(i,v,pv,why);rd()},
    onProgress:(p,ratio,why)=>{if(o.progress)o.progress(p,ratio,why);if(why==='move'||why==='hold'||why==='tap'){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}

/* ============================== processes ============================== */
const STEP={
  /* 콘이냐 컵이냐 (틀린 답 없음) */
  cone(){
    kind='cards';let lock=0;const keys=['cone','cup'];
    tray.innerHTML=keys.map((k,i)=>`<button class="ic-card in" data-k="${k}" aria-label="${k==='cone'?'콘':'컵'}" style="animation-delay:${i*60}ms">${k==='cone'?coneCard:cupCard}</button>`).join('');
    say('콘에 담을까, 컵에 담을까? 하나 골라 봐!','A cone or a cup? Pick one!',true);
    HOT=()=>[...tray.querySelectorAll('.ic-card')];AIM=()=>{const b=HOT()[0];return b?ctr(b):[0,0]};G.start({type:'tap',wait:true,at:()=>stXY(...AIM())});
    tray.onpointerdown=e=>{const b=e.target.closest('.ic-card');if(!b||phase!=='cone')return;e.preventDefault();const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();
      b.classList.add('sel');tray.querySelectorAll('.ic-card:not(.sel)').forEach(x=>x.classList.add('fade'));sfx.pop();tray.onpointerdown=null;G.stop();kind='wait';HOT=()=>[];
      S.holder=b.dataset.k;LOG.push('pick:'+S.holder);say(S.holder==='cone'?'콘!':'컵!',S.holder==='cone'?'Cone!':'Cup!');const g=gen,from=ctr(b);
      E.treat.style.opacity='0';draw();
      fly(b.innerHTML,from,ctr(E.treat),b.getBoundingClientRect().width,rectOf('treat').width,600,()=>{if(g!==gen)return;E.treat.style.opacity='';squash(E.treat);alMood('wow',800);L.later(()=>{if(g===gen)finish()},400)},{up:60})};
  },
  /* 맛 고르기: 통을 콕 (4단계: 손님이 고른 맛과 같은 색) */
  tub(){
    kind='tap';S.tubI=-1;lay();draw();
    if(lv.match)say(`${S.want.ko} 맛을 찾아서 콕!`,`Find the ${S.want.en}! Tap it!`,true);else say('어떤 맛을 담을까? 통을 콕!','Which flavour? Tap a tub!',true);
    toolTray(scoopSVG);HOT=()=>S.tubs.map((f,i)=>E['tub'+i]).filter((e,i)=>!lv.match||S.tubs[i].k===S.want.k);AIM=()=>{const h=HOT()[0];return h?ctr(h):[0,0]};
    H={down:e=>{const i=S.tubs.findIndex((f,j)=>hit(e,'tub'+j,6));if(i<0)return false;if(busy||!tapOk())return;const f=S.tubs[i];
      if(lv.match&&f.k!==S.want.k){const el=E['tub'+i];el.classList.remove('ic-nope');void el.offsetWidth;el.classList.add('ic-nope');sfx.soft();misses++;LOG.push('wrong:'+f.k);
        say(`이건 ${f.ko}${batchim(f.ko)?'이야':'야'}! ${S.want.ko}${batchim(S.want.ko)?'을':'를'} 찾아 봐!`,`That's ${f.en}! Find the ${S.want.en}!`);G.nudge();return}
      busy=true;G.stop();S.tubI=i;S.ball=f;S.scoopP=0;S.tubCells=TUB_CELLS.map(()=>0);LOG.push('tub:'+f.k);squash(E['tub'+i]);sfx.pop();say(f.ko+'!',cap(f.en)+'!');const g=gen;
      L.later(()=>{if(g===gen)finish()},500)}};
    guideAt(AIM,'tap','통을 콕 눌러 봐!','Tap a tub!');
  },
  /* 스쿱으로 통을 쓱쓱: 닿은 만큼만 공이 커지고, 움직이면 돌돌 말림 */
  scoop(){
    kind='rub';const stopI=intro(scoopSVG,'스쿱!','Scoop!');const f=S.ball;say('스쿱으로 통을 쓱쓱 긁어요! 동글동글 공이 생겨요!','Scrape the tub with the scoop! A ball grows!',true);
    const cells=TUB_CELLS.map(([x,y])=>[x/160,(y+15)/165]);let lastFx=0,lastXY=null;
    const sync=()=>{placeBall()};
    rubTool({icon:scoopSVG,anchor:[.3,.68],gap:.32,log:'scoop',stopIntro:stopI,cells,grid:[3,2],rad:.12,target:()=>rectOf('tub'+S.tubI),
      sound:()=>noise(.12,{type:'bandpass',freq:1400,q:.7,vol:.08}),
      frame:(F,t,Wp)=>{if(!Wp)return;const [x,y]=[Wp.wx,Wp.wy];if(lastXY)ballRot+=Math.hypot(x-lastXY[0],y-lastXY[1])*1.6;lastXY=[x,y];ballAt=[x,y-ballSize()*.32];sync();
        const n=performance.now();if(n-lastFx>130&&S.scoopP<1){lastFx=n;pt('curl',x+rand(20)-10,y+6,{sz:16,c:ballD(f),dx:rand(30)-15,dy:-14,up:10,ms:600});if(Math.random()<.4)pt('frost',x+rand(30)-15,y,{sz:12,dx:rand(20)-10,dy:-24,ms:700})}},
      release:()=>{ballAt=null;lastXY=null;sync()},
      cell:(i,v)=>{S.tubCells[i]=v},
      progress:p=>{S.scoopP=Math.max(S.scoopP,p);S.cnt.scoopTouch++;sync()},
      done:()=>{S.scoopP=1;ballAt=null;sync();squash(ballEl);SFX.sparkle();say('동그란 공 완성!','A round ball!');alMood('wow',900);sniff(false);finish()}});
    AIM=()=>ctr(E['tub'+S.tubI]);guideAt(AIM,'scrub','쓱쓱 긁어 봐!','Scrape scrape!');
  },
  /* 콘을 콕: 공이 날아가 톡, 납작했다 돌아옴 */
  place(){
    kind='tap';toolTray(`<svg viewBox="0 20 200 280">${svgInner(treat({holder:S.holder,scoops:S.scoops.concat([S.ball])}))}</svg>`);say(`${S.holder==='cone'?'콘':'컵'}을 콕! 공을 톡 올려요!`,'Tap to put the ball on!',true);
    AIM=()=>at('treat',100,CONE_TOP-20);HOT=()=>[E.treat];
    H={down:e=>{if(!hit(e,'treat',8)&&!inRect(e,ballEl.getBoundingClientRect(),6))return false;if(busy||!tapOk())return;busy=true;G.stop();const g=gen;
      const br=ballEl.getBoundingClientRect(),from=[br.left+br.width/2,br.top+br.height/2],n=S.scoops.length,to=at('treat',100,SCOOP_Y[n]+(S.holder==='cup'?8:0)-6),tr=rectOf('treat'),d=tr.width*(SCOOP_R-n*4)*2/200*1.08;
      ballEl.hidden=true;const f=S.ball;S.ball=null;sweepTone(500,900,.2,'triangle',.12);
      fly(ballSVG(f,ballRot),from,to,br.width,d,600,()=>{if(g!==gen)return;S.scoops.push(f);S.cnt.placed++;LOG.push('place:'+f.k);draw();squash(E.treat);sweepTone(300,140,.16,'sine',.25);
        for(let k=0;k<4;k++)pt('spark',...stXY(to[0]+rand(80)-40,to[1]+rand(30)-15),{sz:18,dx:rand(20)-10,dy:-20,ms:700});say('톡!','Plop!');alMood('wow',900);
        L.later(()=>{if(g===gen)finish()},600)},{up:90,spin:200})}};
    guideAt(AIM,'tap','콘을 콕 눌러 봐!','Tap the cone!');
  },
  /* 토핑 통을 흔들어 쓱쓱: 지나간 자리에 스프링클, 바닥에 떨어진 것은 통통 튐 */
  sprinkle(){
    kind='rub';const stopI=intro(shakerSVG,'스프링클!','Sprinkles!');say('토핑 통을 흔들흔들! 스프링클을 뿌려요!','Shake the sprinkles on!',true);
    const n=S.scoops.length,yOff=S.holder==='cup'?8:0,cells=[];for(let s=0;s<n;s++){const cy=SCOOP_Y[s]+yOff,r=SCOOP_R-s*4;[[-.5,-.3],[0,-.6],[.5,-.3],[-.3,.1],[.3,.1]].forEach(([a,b])=>cells.push([(100+a*r)/200,(cy+b*r)/300]))}
    let lastFx=0;
    const drop=(F)=>{const c=pick(SPRK);pt('sprinkle',F.x+rand(24)-12,F.y-20,{sz:14,c,dx:rand(50)-25,dy:40+rand(30),up:10,bounce:true,rot:rand(360),ms:800})};
    rubTool({icon:shakerSVG,anchor:[.5,.94],gap:.4,log:'sprinkle',stopIntro:stopI,cells,grid:[4,4],rad:.12,target:()=>rectOf('treat'),
      sound:()=>{tone(1400+rand(600),.03,'square',.03);tone(1800+rand(600),.03,'square',.03,.05)},
      fx:({wx,wy,y,now})=>Array.from({length:5},(_,k)=>{const t=((now/420)+k/5)%1;return `<rect x="${(wx-10+k*5).toFixed(1)}" y="${(wy+(y-wy)*t).toFixed(1)}" width="10" height="4" rx="2" fill="${SPRK[k%SPRK.length]}" transform="rotate(${k*50} ${(wx-5+k*5).toFixed(1)} ${(wy+(y-wy)*t).toFixed(1)})"/>`}).join(''),
      frame:F=>{const n2=performance.now();if(F&&n2-lastFx>110){lastFx=n2;drop(F)}},
      tap:F=>{if(F)for(let k=0;k<3;k++)setTimeout(()=>drop(F),k*90)},
      cell:(i,v,pv)=>{const a=Math.floor(pv*3),b=Math.floor(v*3);const [fx,fy]=cells[i];for(let k=a;k<b;k++){S.sp.push([+(fx*200+rand(36)-18).toFixed(1),+(fy*300+rand(26)-13).toFixed(1),rand(180),pick(SPRK)]);S.cnt.sprinkles++}},
      done:()=>{SFX.sparkle();say('알록달록 스프링클!','Colourful sprinkles!');alMood('wow',900);finish()}});
    AIM=()=>at('treat',100,SCOOP_Y[n-1]+yOff);guideAt(AIM,'scrub','흔들흔들 뿌려 봐!','Shake shake!');
  },
  /* 체리 콕: 위에서 톡 떨어져 통통 */
  cherry(){
    kind='tap';toolTray(cherrySVG);say('체리를 콕! 맨 위에 올려요!','Tap to put a cherry on top!',true);
    const n=S.scoops.length,cy=SCOOP_Y[n-1]-SCOOP_R+4+(S.holder==='cup'?8:0);AIM=()=>at('treat',100,cy+20);HOT=()=>[E.treat];
    H={down:e=>{if(!hit(e,'treat',8))return false;if(busy||!tapOk())return;busy=true;G.stop();const g=gen,to=at('treat',100,cy-10),tr=rectOf('treat'),sz=tr.width*.36;
      const f=fly(cherrySVG,[to[0],to[1]-G0.H*.4],to,sz,sz,520,()=>{if(g!==gen)return;S.cherry=true;S.cnt.cherry++;LOG.push('cherry');draw();squash(E.treat);sweepTone(700,300,.12,'sine',.2);say('톡! 체리!','A cherry!');
        L.later(()=>{if(g===gen)finish()},700)},{up:0});void f}};
    guideAt(AIM,'tap','콕 눌러 봐!','Tap!');
  },
  serve(){
    kind='tap';toolTray(`<svg viewBox="0 0 200 300">${svgInner(treat({holder:S.holder,scoops:S.scoops,sp:S.sp,cherry:S.cherry}))}</svg>`);
    say(`완성! 콕 눌러서 ${S.name}에게 줘요!`,`All done! Tap to give it to ${S.name}!`,true);AIM=()=>ctr(E.treat);HOT=()=>[E.treat];
    H={down:e=>{if(!hit(e,'treat',6)&&!inRect(e,custEl.getBoundingClientRect()))return false;H={};G.stop();kind='wait';give()}};
    guideAt(AIM,'tap','콕 눌러서 건네줘!','Tap to give!');
  }
};

/* ---------- ending: lick, cheeks puff, a smudge on the nose ---------- */
function give(){
  phase='eat';const g=gen,cr=custEl.getBoundingClientRect(),fr=rectOf('treat');LOG.push('serve');rubBelly(false);tray.innerHTML='';
  const top=S.scoops[S.scoops.length-1];E.treat.classList.add('hide');
  const mouth=[cr.left+cr.width*.5,cr.top+cr.height*.72],sz=cr.width*.5;
  fly(`<svg viewBox="0 0 300 300">${svgInner(treat({holder:S.holder,scoops:S.scoops,sp:S.sp,cherry:S.cherry})).replace(/^/,'<g transform="translate(50 0)">')}</g></svg>`,[fr.left+fr.width/2,fr.top+fr.width*.75],mouth,fr.height,sz*1.4,900,f=>{if(g!==gen){f.remove();return}
    sniff(false);say('우와! 차가워! 달콤해!','Wow! Cold and sweet!');
    L.later(()=>{if(g!==gen)return;drawCust('yum');cfxEl.classList.remove('puff');void cfxEl.offsetWidth;cfxEl.classList.add('puff');LOG.push('bite');
      [0,600,1200].forEach((t,k)=>L.later(()=>{if(g!==gen)return;SFX.chomp();anim(f,[{transform:`scale(${1-k*.15})`},{transform:`scale(${.9-k*.15},${.94-k*.15})`},{transform:`scale(${.85-k*.15})`}],{duration:400,fill:'forwards'})},t));
      L.later(()=>{if(g!==gen)return;const nose=cfxEl.querySelector('.nose');if(nose)nose.setAttribute('fill',ballC(top));cfxEl.classList.add('smudge');LOG.push('smudge');say('어? 코에 묻었다! 히히!','Oops! On my nose! Hee hee!')},1500)},900);
    L.later(()=>{if(g!==gen)return;f.remove();drawCust('happy');alPlay('dance');SFX.sparkle();const p=pick(PRAISE);say('냠냠! '+p.ko,'Yum yum! '+p.en);
      L.later(()=>{if(g===gen)heart()},2300)},3300)},{up:40,keep:true});
}
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-50],50,44,1000,()=>{if(g!==gen)return;DATA.served++;save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('고마워! 또 올게요!','Thank you! See you again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');cfxEl.style.visibility='hidden';bubEl.hidden=true;
      L.later(()=>{if(g===gen)newRound()},1400)},1500)},1100);
}

/* ---------- a new round ---------- */
const KINDS=(VO.animalNames||[{id:'bunny',ko:'토끼',en:'bunny',name:'토토'}]).filter(k=>A.KINDS[k.id]);
function lobbyOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';ptNow=0;tray.innerHTML='';tray.onpointerdown=null;busy=false;ballEl.hidden=true;ballAt=null;
  if(al){al.detach();al=null}lobbyOff();custEl.classList.remove('leave','enter','ic-rub');cfxEl.classList.remove('puff','sniff','smudge');
  lv=levelInfo(levelNo());
  /* not in config: which flavours are out today (a different set each round) */
  const tubs=shuffle(FLV.slice()).slice(0,lv.flavors),kinds=shuffle(KINDS.map(k=>k.id)).slice(0,3),wants=kinds.map(()=>pick(tubs));
  S={view:'lobby',kinds,wants,tubs,kind:null,name:'',want:null,holder:'cone',scoops:[],sp:[],cherry:false,tubI:-1,tubCells:[],ball:null,scoopP:0,
    cnt:{scoopTouch:0,placed:0,sprinkles:0,cherry:0}};
  work.innerHTML='';E={};pi=0;phase='lobby';kind='tap';HOT=()=>[...lobbyEl.querySelectorAll('.ic-lc')];plan=planFor(lv);
  LOG.push('level:'+lv.level);
  lobbyEl.querySelectorAll('.ic-lc').forEach(b=>b.remove());
  kinds.forEach((k,i)=>{const b=document.createElement('button');b.className='ic-lc';b.dataset.i=i;b.setAttribute('aria-label','손님');
    b.innerHTML=`<span class="lc-ani">${A.animal(k,'idle',{})}</span><span class="lc-bub">${flavorBub(wants[i])}</span>`;lobbyEl.appendChild(b)});
  showView('lobby');strip();size();
  if(M.Alive){lobbyEl.querySelectorAll('.lc-ani').forEach((e,i)=>lobbyAl.push(M.Alive.attach(e,{kind:kinds[i],waiting:true})));if(M.Alive.takeTurns)turns=M.Alive.takeTurns(lobbyAl);L.onEnd(lobbyOff)}
  AIM=()=>{const b=lobbyEl.querySelector('.ic-lc:nth-child(3)');return b?ctr(b):[0,0]};
  say('어서 오세요! 아이스크림 가게예요. 친구를 콕!','Welcome to the ice cream shop! Tap a friend!',true);
  H={down:e=>{const bs=[...lobbyEl.querySelectorAll('.ic-lc')];const i=bs.findIndex(b=>inRect(e,b.getBoundingClientRect(),4));if(i<0)return false;if(busy)return;busy=true;choose(i)}};
  const g=gen;L.later(()=>{if(g===gen)G.start({type:'tap',at:()=>stXY(...AIM()),ko:'친구를 콕 눌러 봐!',en:'Tap a friend!'})},800);
}
function choose(i){
  const g=gen,bs=[...lobbyEl.querySelectorAll('.ic-lc')];G.stop();H={};
  bs.forEach((b,j)=>b.classList.add(j===i?'sel':'gone'));sfx.pop();
  S.kind=S.kinds[i];S.want=S.wants[i];const kn=KINDS.find(k=>k.id===S.kind)||{};S.name=kn.name||kn.ko||'';LOG.push('customer:'+S.kind+':'+S.want.k);
  say(`${S.want.ko} 아이스크림 주세요!`,`${cap(S.want.en)} ice cream, please!`);
  L.later(()=>{if(g!==gen)return;lobbyOff();startWork()},1300);
}
function startWork(){
  const g=gen;mkIt('treat','');S.tubs.forEach((f,i)=>mkIt('tub'+i,''));
  pi=0;showView('work');cfxEl.style.visibility='';
  if(al){al.detach();al=null}drawCust('idle');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:S.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=flavorBub(S.want);bubEl.hidden=true;phase='enter';kind='wait';strip();size();draw();
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;rubBelly(true);say(`안녕! 나는 ${S.name}. ${S.want.ko} 아이스크림 먹고 싶어!`,`Hi! I'm ${S.name}. I want ${S.want.en} ice cream!`)},1200);
  L.later(()=>{if(g!==gen)return;run()},3400);
}

/* ---------- test hooks ---------- */
const HAND_OF={cone:'choose',tub:'choose',scoop:'rub',place:'tap',sprinkle:'rub',cherry:'tap',serve:'tap'};
M.__icLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__ic=()=>{
  const k=plan[pi]||null;let aim=null;try{aim=AIM?AIM():null}catch(e){}const sr=stR();
  let hot=[];try{hot=HOT().filter(Boolean).map(e=>{const r=e.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})}catch(e){}
  const tgt=phase==='scoop'?E['tub'+S.tubI]:phase==='sprinkle'?E.treat:null,tr=tgt?tgt.getBoundingClientRect():sr;
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,view:S&&S.view,rect:{x:tr.left,y:tr.top,w:tr.width,h:tr.height},cellPts:tool?tool.cellPts():[],toolOn:!!tool,toolDone:tool?tool.done:false,
    cards:[...tray.querySelectorAll('.ic-card')].map(b=>{const r=b.getBoundingClientRect();return{k:b.dataset.k,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,ok:true}}),hot,
    tubs:S?S.tubs.map((f,i)=>{const r=rectOf('tub'+i);return r&&!E['tub'+i].classList.contains('hide')?{k:f.k,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:{k:f.k}}):[],want:S&&S.want?S.want.k:null,
    custPts:[...lobbyEl.querySelectorAll('.ic-lc')].map(b=>ctr(b)),holder:S&&S.holder,scoops:S?S.scoops.map(f=>f.k):[],sprinkles:S?S.sp.length:0,cherry:S?S.cherry:false,
    scoopP:S?S.scoopP:0,ballD:ballEl.hidden?0:ballEl.getBoundingClientRect().width,ballMax:BALL_MAX(),toolProgress:tool?tool.progress:null,cnt:S?Object.assign({},S.cnt):{},
    smudge:cfxEl.classList.contains('smudge'),particles:ptNow,particlePeak:ptPeak,particleMax:PART.max,alive:al?al.state():null,lobbyAlive:lobbyAl.length,misses,guide:G.state(),served:DATA.served,log:LOG.slice()};
};
M.__icDepth=()=>LV.map((l,i)=>{const v=levelInfo(i+1),p=planFor(v),work=p.filter(x=>HAND_OF[x]!=='choose');
  return{level:i+1,scoops:v.scoops,flavors:v.flavors,cherry:v.cherry,match:v.match,processes:new Set(work).size,list:[...new Set(work)],steps:p.length,handActions:[...new Set(p.map(x=>HAND_OF[x]))],customer:!!M.Alive,choice:true,ending:true}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';ptNow=0;tray.onpointerdown=null;ballEl.hidden=true;lobbyOff();if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
document.querySelectorAll(`.tile[data-go="${id}"] .ic`).forEach(ic=>{ic.innerHTML=`<svg viewBox="0 0 200 300" style="width:1.5em;height:1.5em;overflow:visible">${svgInner(treat({holder:'cone',scoops:[FLV[0],FLV[1]],sp:[[80,60,20,SPRK[1]],[118,70,-30,SPRK[2]],[100,48,60,SPRK[3]]],cherry:true}))}</svg>`});
})();
