/* 말랑 마을 — 홈 화면 (P9: 한 화면 홈)
   한 화면(세로로 밀지 않음): 위(화면의 28%) 토토 + 당근 바구니 + 큰 그림 시작 버튼(오늘의 놀이 3개를 그림으로, 진행은 별 3칸),
   가운데와 아래(72%) 놀이 마을: 종이 공예 원 4개(요리·꾸미기·배움·노래)와 가운데 집(내 방). 어른 버튼은 오른쪽 위 작은 톱니(2초).
   원 그림은 그 안 놀이들의 단계 평균에 따라 grow 0~3으로 자람(숫자 없음). 크리스마스 테마(배경음 크리스마스)면 눈·트리·꼬마전구·토토 목도리.
   장소 화면(요리 마을 등)은 공통 틀 ML.Shell.place(2×2 그림 타일 + 다음 장 화살표). 내 방은 room.js.
   어른 설정 > 아이 기록: 문마다 놀이 칸 3열(놀이 그림 · 단계 · 별 3칸 막대 · 마지막 날), 칸을 누르면 단계를 바꿈.
   숫자·문구는 MLCFG.home(oneScreen, portals, places, portalStyle, portalGrowth, insidePlace), themes.christmas, progress(parentView, starsShown), guide 에서 읽습니다. */
(()=>{
'use strict';
const M=window.ML,A=window.ART;if(!M||!A||!M.Shell)return;
const {say,games,bounce,sfx}=M;
const SHL=M.Shell,R=M.Room,PR=()=>M.Progress;
const CF=M.CFG||window.MLCFG||{},HOME=CF.home||{},XM=(CF.themes||{}).christmas||{},XP=XM.palette||{},PAL=(CF.calm||{}).palette||{},PC=CF.progress||{},PV=PC.parentView||{};
const num=(s,i,d)=>{const m=String(s==null?'':s).match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const OS=HOME.oneScreen||[];
const TOP_R=Math.min(.4,Math.max(.2,num(OS[0],0,28)/100));                       // '위(화면의 28%)'
const PORTAL_MIN=Math.max(140,num(OS[1],2,140));                                   // '원 4개(각 140px 이상)'
const PORTAL_GOAL=Math.max(PORTAL_MIN,num(HOME.portalStyle,0,150));               // '큰 원(지름 150px 이상)'
const STARS=Math.max(1,PC.starsShown||3),NEED=Math.max(1,PC.clearsToLevelUp||3);
const SNOW_MAX=num((XM.home||[]).find(s=>/눈송이/.test(s)),0,10);                 // '눈송이 최대 10개가 천천히 내림'
/* not in config: the start button's width (P9 '화면 폭의 40% 이상'), the paper picture of each place (P9 '요리=kitchen, 꾸미기=forest,
   배움=sea, 노래=forest의 다른 색'), who lives in each circle, which progress id a screen uses */
const START_MIN=.4;
const KIND={cook:'kitchen',salon:'forest',learn:'sea',music:'forest'};
const TINT={music:{sky:'#E6E3F1',far:'#D2CBE5',mid:'#C6D6B3',near:'#AFCB9F',path:'#EFE6D6',acc:'#B9A8DE'}};
const WHO={cook:['bear','yum',{apron:'#E3A79A'}],salon:['bunny','happy',{bow:'#E9A2B4'}],learn:['cat','happy',{bow:'#9DB7E0'}],music:['dog','happy',{bow:'#C3B4E6'}]};
const GID={dishes2:'dishes',icecream2:'icecream',makeup2:'makeup',chores2:'chores',routine2:'routine'};
const OL=A.OL,S=`stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const isXmas=()=>!!(M.S&&M.S.bgm!==false&&XM.linkedBgm&&M.S.bgmSet===XM.linkedBgm);

/* ============================== the place screens (P16 shell) ============================== */
const PORTALS=(HOME.portals||[{id:'cook'},{id:'salon'},{id:'learn'},{id:'music'}]).filter(p=>SHL.places[p.id]).map(p=>{const P=SHL.places[p.id];return{key:p.id,id:P.id,ko:P.ko,en:P.en,short:p.ko||P.ko,shortEn:p.en||P.en}});
const home=document.getElementById('home'),scroll=home.querySelector('.home-scroll');
document.querySelectorAll('.tile[data-go="pizza"] .ic').forEach(ic=>{ic.innerHTML=`<svg viewBox="-120 -120 240 240">${A.pizza({r:100,sauce:true,cheese:Array.from({length:24},(_,i)=>[Math.cos(i*2.4)*i*3.4,Math.sin(i*2.4)*i*3.4,i*40]),tops:[['tomato',-38,-30,0],['mushroom',34,-36,20],['pepperoni',-30,40,0],['olive',40,30,0],['pepper',4,4,0]],baked:true})}</svg>`;
  const b=ic.parentElement.querySelector('b');if(b)b.textContent='피자가게'});
PORTALS.forEach(p=>SHL.place(p.key));
/* the drawn picture of every game (for today's plays and the parent record), taken from its tile */
const ICON={};
document.querySelectorAll('.tile[data-go]').forEach(t=>{const s=t.querySelector('.ic > svg');if(s&&!ICON[t.dataset.go])ICON[t.dataset.go]=s.outerHTML});
const iconOf=id=>ICON[id]||ICON[M.missionTarget?M.missionTarget(id):id]||SHL.art('play');
/* the old list home stays in the page (other code still writes into it) but is hidden; nothing on it is reachable */
if(scroll){scroll.hidden=true;scroll.querySelectorAll('.section-label').forEach(l=>l.remove())}
const topOld=home.querySelector('.home-top');const logo=topOld&&topOld.querySelector('.logo');if(logo)logo.remove();

/* ============================== styles ============================== */
const css=`
#home.hm{gap:8px}
#home .home-top.hm-gear{position:absolute;right:max(10px,env(safe-area-inset-right,0px));top:8px;z-index:6;gap:0}
#home .hm-gear .gear{width:44px;height:44px;padding:8px}
#home .hm-gear .gear svg{width:100%;height:100%;display:block}
#home .hm-gear .gear-wrap{font-size:10px;gap:1px}
.hm-top{flex:none;height:calc(${(TOP_R*100).toFixed(1)}% - 4px);position:relative;display:flex;align-items:flex-end;gap:6px;padding-top:4px}
.hm-toto{flex:none;width:34%;max-width:150px;height:100%;position:relative;display:flex;align-items:flex-end;justify-content:center}
.hm-toto .hm-tt{position:relative;width:88%;max-height:96%;aspect-ratio:200/230}
.hm-toto .hm-tt svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.hm-basket{position:absolute;right:-14%;bottom:-2%;width:46%;z-index:3;pointer-events:none}
.hm-basket svg{width:100%;height:auto;display:block;overflow:visible}
.hm-drop{position:absolute;left:50%;top:-10%;width:18%;transform:translate(-50%,-140%);animation:hmdrop .5s cubic-bezier(.5,0,.8,.6) forwards;z-index:4}
.hm-drop svg{width:100%;height:auto;display:block}
@keyframes hmdrop{to{transform:translate(-50%,40%);opacity:.2}}
.hm-start{flex:1;min-width:${Math.round(START_MIN*100)}vw;max-width:300px;height:calc(100% - 54px);margin-left:auto;border:0;border-radius:34px;padding:10px 8px 8px;position:relative;
  background:#FBEFC9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  box-shadow:inset 0 3px 0 rgba(255,255,255,.75),0 6px 0 #E6CF8E,0 10px 18px rgba(91,74,66,.14)}
.hm-start:active{transform:translateY(4px);box-shadow:inset 0 3px 0 rgba(255,255,255,.75),0 2px 0 #E6CF8E}
.hm-start .hm-plays{display:flex;align-items:center;justify-content:center;gap:4%;width:100%;flex:1;min-height:0}
.hm-play{position:relative;flex:none;width:27%;aspect-ratio:1;border-radius:50%;background:#FFFDF9;display:grid;place-items:center;padding:7%;
  box-shadow:inset 0 -3px 0 rgba(91,74,66,.08),0 3px 0 rgba(91,74,66,.12)}
.hm-play svg{width:100%;height:100%;display:block;overflow:visible}
.hm-play.done{opacity:.55}
.hm-play.next{width:40%;padding:8%;box-shadow:0 0 0 5px #F6D77A,inset 0 -3px 0 rgba(91,74,66,.08),0 4px 0 rgba(91,74,66,.14);animation:hmnext 2.6s ease-in-out infinite}
@keyframes hmnext{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.hm-play .hm-go{position:absolute;right:-10%;bottom:-8%;width:42%;aspect-ratio:1;border-radius:50%;background:${PAL.sage||'#A9CFA0'};display:grid;place-items:center;box-shadow:0 3px 0 rgba(91,74,66,.18)}
.hm-play .hm-go svg{width:58%;height:58%}
.hm-start .mlp-stars{gap:10%;justify-content:center;width:70%}
.hm-start .mlp-star{width:30px;height:30px}
.hm-start.all .mlp-star.on{animation:hmglow 3s ease-in-out infinite}
@keyframes hmglow{0%,100%{filter:none}50%{filter:drop-shadow(0 0 6px #F6D77A)}}
.hm-village{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#DCEBE4}
.hm-village>svg.hm-bg,.hm-village>svg.hm-paths{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.hm-portal{position:absolute;width:var(--d);height:calc(var(--d) + 24px);transform:translate(-50%,calc(var(--d) / -2));border:0;background:none;padding:0;display:flex;flex-direction:column;align-items:center;z-index:2}
.hm-portal .pp{position:relative;width:var(--d);height:var(--d);display:block;filter:drop-shadow(0 5px 6px rgba(91,58,41,.16))}
.hm-portal .pp>svg{width:100%;height:100%;display:block}
.hm-portal .pp .hm-xo{position:absolute;inset:-6% -4% auto -4%;width:108%;height:auto;pointer-events:none}
.hm-portal b{font-weight:400;font-size:13px;color:#6B5A50;background:rgba(255,253,249,.92);border-radius:999px;padding:1px 10px;margin-top:-6px;white-space:nowrap;position:relative;z-index:1;box-shadow:0 2px 0 rgba(91,74,66,.1)}
.hm-portal:active .pp,.hm-house:active .hh{transform:scale(.95)}
.hm-house{position:absolute;width:var(--hw);transform:translate(-50%,-50%);border:0;background:none;padding:0;z-index:3;display:flex;flex-direction:column;align-items:center}
.hm-house .hh{position:relative;width:100%;aspect-ratio:160/150;display:block}
.hm-house .hh svg{width:100%;height:100%;display:block;overflow:visible}
.hm-house b{font-weight:400;font-size:13px;color:#6B5A50;background:rgba(255,253,249,.92);border-radius:999px;padding:1px 10px;margin-top:-4px;white-space:nowrap;box-shadow:0 2px 0 rgba(91,74,66,.1)}
.hm-house .hm-gift{position:absolute;right:-4%;bottom:6%;width:32%;display:none;animation:hmgift 3s ease-in-out infinite}
.hm-house.gift .hm-gift{display:block}.hm-house .hm-gift svg{width:100%;height:auto;display:block;overflow:visible}
@keyframes hmgift{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.hm-house .hm-lights{animation:hmlights 4s ease-in-out infinite}
@keyframes hmlights{0%,100%{opacity:.7}50%{opacity:1}}
.hm-snow{position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden}
.hm-snow i{position:absolute;top:-20px;left:var(--x);width:var(--s);height:var(--s);border-radius:50%;background:#FFFFFF;box-shadow:0 1px 2px rgba(91,74,66,.18);opacity:.95;animation:hmsnow var(--t) linear infinite;animation-delay:var(--dl)}
@keyframes hmsnow{from{transform:translate(0,0)}50%{transform:translate(8px,calc(var(--h) / 2))}to{transform:translate(0,calc(var(--h) + 30px))}}
.hm-scarf{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.hm-house.gift .hm-lights{animation:none;opacity:.9}
.hm-xtree{position:absolute;width:112px;height:128px;transform:translate(-50%,-50%);border:0;background:none;padding:0 14px;z-index:3;display:flex;flex-direction:column;align-items:center}
.hm-xtree .xt{width:84px;height:104px;display:block;filter:drop-shadow(0 4px 4px rgba(91,58,41,.14))}
.hm-xtree .xt svg{width:100%;height:100%;display:block;overflow:visible}
.hm-xtree b{font-weight:400;font-size:12px;color:#6B5A50;background:rgba(255,253,249,.92);border-radius:999px;padding:1px 8px;margin-top:-4px;white-space:nowrap;box-shadow:0 2px 0 rgba(91,74,66,.1)}
.hm-xtree:active .xt{transform:scale(.95)}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ============================== pictures ============================== */
const PLAY=`<svg viewBox="0 0 40 40"><path d="M14 9L31 20L14 31Z" fill="#fff" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/></svg>`;
const GEAR=`<svg viewBox="0 0 48 48">${Array.from({length:8},(_,i)=>`<rect x="20" y="3" width="8" height="10" rx="2.5" fill="#B9AEA6" transform="rotate(${i*45} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="14" fill="#B9AEA6"/><circle cx="24" cy="24" r="6" fill="#FFFDF9"/></svg>`;
const SCARF=`<svg class="hm-scarf" viewBox="0 0 200 230"><path d="M118 156L130 200L112 203L104 160Z" fill="${XP.berry||'#C96A63'}" ${S}/><path d="M113 172l12 -3M116 186l12 -3" stroke="${XP.snow||'#FBF8F2'}" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 146Q100 168 140 146L142 160Q100 184 58 160Z" fill="${XP.berry||'#C96A63'}" ${S}/><path d="M74 156l2 10M92 160v11M110 160v11M126 156l-2 10" stroke="${XP.snow||'#FBF8F2'}" stroke-width="4" stroke-linecap="round"/></svg>`;
/* paper filter shared by the village pieces (art.papercraft: one soft shadow per layer, no outline) */
let _fid=0;
const pf=id=>`<filter id="${id}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".22"/></filter>`;
function villageBG(W,H,x){
  const id='hmv'+(++_fid),L=d=>`<g filter="url(#${id})">${d}</g>`;
  const sky=x?(XP.night||'#C9D6EA'):'#E3EEF0',far=x?'#E6ECEE':'#CFE2C2',mid=x?(XP.snow||'#FBF8F2'):'#BCD9AC',near=x?'#F4F1EA':'#A9CD9A';
  const tree=(tx,ty,s,c)=>`<g transform="translate(${tx} ${ty}) scale(${s})"><rect x="-3" y="-4" width="6" height="14" rx="2" fill="#B89878"/><path d="M0-34L16-6H-16Z" fill="${c}"/><path d="M0-46L12-22H-12Z" fill="${c}" opacity=".92"/>${x?`<path d="M0-46L6-35Q0-32-6-35Z" fill="#FFFFFF"/><path d="M-9-20Q0-16 9-20L12-14Q0-10-12-14Z" fill="#FFFFFF" opacity=".9"/>`:''}</g>`;
  const bush=(bx,by,s,c)=>`<g transform="translate(${bx} ${by}) scale(${s})"><circle cx="-8" cy="0" r="10" fill="${c}"/><circle cx="6" cy="-4" r="12" fill="${c}"/><circle cx="16" cy="2" r="8" fill="${c}"/>${x?'<path d="M-16-4Q-6-14 4-12Q14-14 22-4Q8-8-16-4Z" fill="#FFFFFF"/>':''}</g>`;
  const flower=(fx,fy,c)=>x?'':`<g transform="translate(${fx} ${fy})"><rect x="-1" y="0" width="2" height="8" fill="#7FA978"/>${[0,72,144,216,288].map(a=>`<circle cx="${(Math.cos(a*Math.PI/180)*3.6).toFixed(1)}" cy="${(Math.sin(a*Math.PI/180)*3.6).toFixed(1)}" r="3" fill="${c}"/>`).join('')}<circle r="2.2" fill="#F4D58A"/></g>`;
  const cloud=(cx,cy,s)=>`<g transform="translate(${cx} ${cy}) scale(${s})" fill="#FBF9F4"><circle cx="-10" cy="0" r="8"/><circle cx="2" cy="-5" r="11"/><circle cx="14" cy="0" r="8"/><rect x="-18" y="0" width="40" height="7" rx="3.5"/></g>`;
  const pine=x?(XP.pine||'#6FA58A'):'#8DB585';
  let s=`<rect width="${W}" height="${H}" fill="${sky}"/>`;
  s+=L(cloud(W*.5,H*.07,1.1)+(x?'':cloud(W*.86,H*.18,.8)));
  s+=L(`<path d="M0 ${H*.2}Q${W*.3} ${H*.12} ${W*.55} ${H*.19}T${W} ${H*.16}V${H}H0Z" fill="${far}"/>`);
  s+=L(`<path d="M0 ${H*.42}Q${W*.35} ${H*.34} ${W*.62} ${H*.41}T${W} ${H*.38}V${H}H0Z" fill="${mid}"/>`+(x&&A.XMAS?'':tree(W*.06,H*.5,1,pine))+tree(W*.95,H*.47,1.1,pine)+bush(W*.5,H*.31,.8,x?'#DDE7DF':'#A8CC9C'));
  s+=L(`<path d="M0 ${H*.7}Q${W*.4} ${H*.63} ${W*.7} ${H*.69}T${W} ${H*.67}V${H}H0Z" fill="${near}"/>`+bush(W*.07,H*.74,.9,x?'#E4EAE4':'#94BF88')+bush(W*.92,H*.76,.8,x?'#E4EAE4':'#94BF88')+tree(W*.5,H*.99,.9,pine)
    +flower(W*.38,H*.95,'#E9B7A6')+flower(W*.62,H*.96,'#EBC9A0')+flower(W*.12,H*.97,'#C3B4E6')+flower(W*.88,H*.97,'#E9B7A6'));
  return `<svg class="hm-bg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${pf(id)}<filter id="${id}g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .36  0 0 0 0 .23  0 0 0 0 .16  0 0 0 .09 0"/></filter></defs>${s}<rect width="${W}" height="${H}" filter="url(#${id}g)"/></svg>`;
}
/* paper paths from the house to each circle */
function pathsSVG(W,H,hx,hy,pts,x){
  const id='hmp'+(++_fid),c=x?'#ECE6DA':'#F3E8D3',e=x?'#DCD3C4':'#E6D3B0';
  const d=pts.map(([px,py])=>{const mx=(hx+px)/2,my=(hy+py)/2;return `M${hx} ${hy}Q${mx+(px<hx?-14:14)} ${my} ${px} ${py}`}).join('');
  return `<svg class="hm-paths" viewBox="0 0 ${W} ${H}"><defs>${pf(id)}</defs><g filter="url(#${id})"><path d="${d}" fill="none" stroke="${e}" stroke-width="22" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/></g></svg>`;
}
/* the house in the middle (my room): paper layers. x: snow on the roof, a little tree, string lights. gift: a present waits at the door */
function houseSVG(x){
  const id='hmh'+(++_fid),L=d=>`<g filter="url(#${id})">${d}</g>`;
  const roof=x?(XP.berry||'#C96A63'):'#D9928A';
  let s='';
  if(x&&!(A.XMAS&&document.getElementById('xmashouse')))s+=L(`<g transform="translate(16 132)"><rect x="-3" y="0" width="6" height="12" rx="2" fill="#B89878"/><path d="M0-44L20-6H-20Z" fill="${XP.pine||'#6FA58A'}"/><path d="M0-58L15-30H-15Z" fill="${XP.pine||'#6FA58A'}"/>
    <path d="M0-64l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="${XP.gold||'#E3C46A'}"/><circle cx="-8" cy="-14" r="3" fill="${XP.berry||'#C96A63'}"/><circle cx="7" cy="-24" r="3" fill="${XP.gold||'#E3C46A'}"/><circle cx="9" cy="-8" r="3" fill="${XP.snow||'#FBF8F2'}"/></g>`);
  s+=L(`<rect x="88" y="16" width="14" height="30" rx="2" fill="#C9A98A"/>${x?'<path d="M86 16Q95 8 104 16Z" fill="#FFFFFF"/>':''}`);
  s+=L(`<rect x="30" y="66" width="100" height="78" rx="6" fill="#F6EEE2"/>`);
  s+=L(`<path d="M16 72L80 18L144 72Z" fill="${roof}"/><path d="M16 72L80 18L144 72" fill="none" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="2"/>`);
  if(x)s+=L(`<path d="M22 66L80 22L138 66Q126 60 116 66Q106 58 96 64Q86 56 76 64Q64 56 54 64Q42 58 34 66Q28 62 22 66Z" fill="#FFFFFF"/>`);
  s+=L(`<path d="M66 144V112Q66 98 80 98Q94 98 94 112V144Z" fill="#C9A98A"/><circle cx="88" cy="122" r="2.6" fill="#8C6E58"/><path d="M80 108c-3-4-8 0-4 4l4 3.4 4-3.4c4-4-1-8-4-4z" fill="#E9B7A6"/>`);
  s+=L(`<rect x="40" y="86" width="20" height="20" rx="5" fill="${x?'#F4D58A':'#DDEBF0'}"/><rect x="100" y="86" width="20" height="20" rx="5" fill="${x?'#F4D58A':'#DDEBF0'}"/><path d="M50 86V106M40 96H60M110 86V106M100 96H120" stroke="#F6EEE2" stroke-width="2"/>`);
  if(x)s+=`<g class="hm-lights">${Array.from({length:9},(_,i)=>{const t=(i+.5)/9,lx=18+124*t,ly=72-(t<.5?t:1-t)*2*50+5,c=[XP.gold,XP.berry,XP.pine,XP.snow][i%4]||'#E3C46A';
    return `<circle cx="${lx.toFixed(1)}" cy="${(ly+6).toFixed(1)}" r="3.6" fill="${c}"/><circle cx="${lx.toFixed(1)}" cy="${(ly+6).toFixed(1)}" r="6.5" fill="${c}" opacity=".25"/>`}).join('')}</g>`;
  return `<svg viewBox="0 0 160 150" xmlns="http://www.w3.org/2000/svg"><defs>${pf(id)}</defs><ellipse cx="80" cy="146" rx="66" ry="6" fill="#5B3A29" opacity=".1"/>${s}</svg>`;
}
/* christmas on a circle: a snow cap along the top and a string of lights (still, no blinking) */
const XO=()=>`<svg class="hm-xo" viewBox="0 0 216 90"><path d="M22 74Q34 14 108 8Q182 14 194 74Q184 58 172 64Q164 46 150 54Q140 36 126 46Q116 30 104 42Q92 30 82 44Q70 36 62 52Q48 46 42 62Q30 56 22 74Z" fill="#FFFFFF" opacity=".96"/>
  ${Array.from({length:7},(_,i)=>{const a=Math.PI*(1-(i+.5)/7),x=108+Math.cos(a)*90,y=86-Math.sin(a)*70;const c=[XP.gold,XP.berry,XP.pine][i%3]||'#E3C46A';return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${c}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${c}" opacity=".22"/>`}).join('')}</svg>`;

/* ============================== growth: the circle picture grows with the levels inside ============================== */
function growOf(key){
  const P=SHL.places[key];if(!P)return 0;const ret=SHL.retired;const list=P.games.filter(g=>document.getElementById(g)&&!ret[g]);if(!list.length)return 0;
  let sum=0;list.forEach(sid=>{const gid=GID[sid]||sid,inf=PR()?PR().info(gid):null;
    /* a game on the level engine: its level. An old game without levels: every NEED finished rounds count as one level (the same rule as the engine) */
    const lv=inf&&inf.max>1?inf.level:1+Math.floor((R?R.rounds(sid)+R.rounds(gid):0)/NEED);sum+=Math.min(4,lv)});
  return Math.max(0,Math.min(3,Math.round(sum/list.length-1)));
}

/* ============================== build the home ============================== */
home.classList.add('hm');
if(topOld){topOld.classList.add('hm-gear');const g=topOld.querySelector('#gear');if(g)g.innerHTML=GEAR}
const top=document.createElement('div');top.className='hm-top';
top.innerHTML=`<div class="hm-toto" aria-label="토토"><div class="hm-tt"></div><div class="hm-basket"></div></div><button class="hm-start" type="button" aria-label="오늘의 놀이 시작"><span class="hm-plays"></span><span class="hm-starrow"></span></button>`;
const village=document.createElement('div');village.className='hm-village';
home.insertBefore(top,scroll||null);home.insertBefore(village,scroll||null);
const totoBox=top.querySelector('.hm-tt'),basketEl=top.querySelector('.hm-basket'),startBtn=top.querySelector('.hm-start'),playsEl=top.querySelector('.hm-plays'),starsEl=top.querySelector('.hm-starrow');
let al=null,nextGo=null,ms=[],allDone=false,lastGreet=0,dropT=[];

function renderToto(mood){totoBox.innerHTML=A.animal('bunny',mood||'idle',{})+(isXmas()?SCARF:'');}
function renderBasket(n){basketEl.innerHTML=R?R.basketSVG(n==null?R.carrots():n):''}
function renderToday(){
  ms=M.missions?M.missions():[];const ni=ms.findIndex(m=>!m.done);allDone=ms.length>0&&ni<0;
  nextGo=ni>=0?(M.missionTarget?M.missionTarget(ms[ni].id):ms[ni].id):null;
  playsEl.innerHTML=ms.map((m,i)=>`<span class="hm-play${m.done?' done':''}${i===ni?' next':''}" data-m="${m.id}">${iconOf(m.id)}${i===ni?`<span class="hm-go">${PLAY}</span>`:''}</span>`).join('');
  starsEl.innerHTML=PR()?PR().stars('today',ms.filter(m=>m.done).length):'';
  startBtn.classList.toggle('all',allDone);
}
const nameOf=m=>String(m&&m.name||'').replace(/\s*\(.*\)\s*/,'');
startBtn.addEventListener('click',()=>{
  bounce(startBtn);sfx.pop();
  if(nextGo){const m=ms.find(x=>!x.done);say(`${nameOf(m)} 해 볼까?`,"Let's play!");setTimeout(()=>{if(M.current()==='home')M.go(nextGo)},350);return}
  if(al)al.play('hop');
  if(R&&R.inbox().length)say('오늘 놀이를 다 했어요! 내 방에 선물이 있어요!','You did it! There is a present in your room!');
  else say('오늘 놀이를 다 했어요! 최고야! 하고 싶은 곳을 골라 봐!','You finished today\'s play! Pick any place!');
});
totoBox.parentElement.addEventListener('pointerdown',()=>{if(al)al.play('hop');sfx.pop();greet(true)});

function portalHTML(p){
  const x=isXmas(),g=growOf(p.key);
  const art=x?A.paper('christmas',{grow:g,who:WHO[p.key]}):A.paper(KIND[p.key]||'forest',{grow:g,who:WHO[p.key],tint:TINT[p.key],notes:p.key==='music'});
  return `<button class="hm-portal" type="button" data-go="${p.id}" data-en="${p.en}" data-key="${p.key}" data-grow="${g}"><span class="pp">${art}${x?XO():''}</span><b>${p.ko}</b></button>`;
}
function renderVillage(){
  const x=isXmas();
  village.innerHTML=PORTALS.map(portalHTML).join('')+`<button class="hm-house" type="button" data-go="zone-myroom" data-en="My room"><span class="hh">${houseSVG(x)}<span class="hm-gift">${R?R.BOX:''}</span></span><b>${(HOME.mySpace||{}).ko||'내 방'}</b></button>`+(x&&A.XMAS&&document.getElementById('xmashouse')?`<button class="hm-xtree" type="button" data-go="xmashouse" data-en="Christmas house"><span class="xt">${A.XMAS.icon()}</span><b>${(M.NAMES&&M.NAMES.xmashouse)||'크리스마스 집'}</b></button>`:'')+(x?`<div class="hm-snow">${Array.from({length:SNOW_MAX},(_,i)=>`<i style="--x:${(4+i*9.6+(i%2)*3).toFixed(1)}%;--s:${6+(i%3)*2}px;--t:${16+(i*7)%9}s;--dl:${-(i*2.3).toFixed(1)}s"></i>`).join('')}</div>`:'');
  layout();
}
/* 4 circles at the corners, the house in the middle, paths between; sizes from the village box */
function layout(){
  const W=village.clientWidth,H=village.clientHeight;if(!W||!H)return;
  const x=isXmas();
  const d=Math.round(Math.max(PORTAL_MIN,Math.min(PORTAL_GOAL+16,W*.44,(H-60)/2.9)));
  const cxL=Math.round(W*.27),cxR=Math.round(W-W*.27),cy1=Math.round(d/2+10),cy2=Math.round(H-d/2-32),hx=Math.round(W/2),hy=Math.round((cy1+cy2)/2+6);
  const pts=[[cxL,cy1],[cxR,cy1],[cxL,cy2],[cxR,cy2]];
  village.querySelectorAll('.hm-portal').forEach((b,i)=>{const p=pts[i]||pts[0];b.style.setProperty('--d',d+'px');b.style.left=p[0]+'px';b.style.top=p[1]+'px'});
  const hw=Math.round(Math.max(120,Math.min(W*.48,176,cy2-cy1-d+40)));
  const hb=village.querySelector('.hm-house');if(hb){hb.style.setProperty('--hw',hw+'px');hb.style.left=hx+'px';hb.style.top=hy+'px'}
  const xt=village.querySelector('.hm-xtree');if(xt){xt.style.left=Math.round(Math.max(58,hx-hw/2-50))+'px';xt.style.top=(hy+8)+'px'}
  village.querySelectorAll('svg.hm-bg,svg.hm-paths').forEach(s=>s.remove());
  village.insertAdjacentHTML('afterbegin',villageBG(W,H,x)+pathsSVG(W,H,hx,hy,pts,x));
  village.style.setProperty('--h',H+'px');village.querySelectorAll('.hm-snow i').forEach(i=>i.style.setProperty('--h',H+'px'));
}
function renderGift(){const hb=village.querySelector('.hm-house');if(hb)hb.classList.toggle('gift',!!(R&&R.inbox().length))}

/* a carrot drops into the basket for every round finished since the last visit (0.5 s, one sound each) */
function dropCarrots(){
  dropT.forEach(clearTimeout);dropT=[];if(!R)return;
  const pend=R.takePending(),have=R.carrots(),before=Math.max(0,Math.min(R.SHOW,have-pend)),n=Math.max(0,Math.min(pend,R.SHOW-before));
  renderBasket(before);
  for(let i=0;i<n;i++)dropT.push(setTimeout(()=>{if(M.current()!=='home')return;const c=document.createElement('div');c.className='hm-drop';c.innerHTML=R.carrotSVG();basketEl.appendChild(c);
    try{M.tone(880,.09,'triangle',.16)}catch(e){}
    dropT.push(setTimeout(()=>{c.remove();renderBasket(before+i+1)},500))},700+i*650));
  if(!n)renderBasket(have);
}
function greet(force){
  const nm=M.CAST&&M.CAST.hero&&M.CAST.hero.name?M.CAST.hero.name+', ':'';const m=ms.find(x=>!x.done);
  if(allDone)say(`${nm}오늘 놀이를 다 했어요! 최고야!`,'You finished today\'s play! Great job!');
  else if(m)say(`${nm}안녕! 오늘은 ${nameOf(m)} 해 볼까? 큰 단추를 눌러 봐!`,'Hi! Tap the big button to play!');
  else if(force)say('안녕! 나는 토토야. 같이 놀자!','Hi! I am Toto. Let\'s play!');
}

/* the hint hand: after 4 quiet seconds it taps the start button (P9 8) */
const HG=M.Guide?M.Guide.make(home):null;
if(HG){home.addEventListener('pointerdown',()=>HG.touch(),true);['pointerup','pointercancel'].forEach(t=>home.addEventListener(t,()=>HG.release(),true))}
const IDLE=4000;
/* themes.christmas.voice: Toto says it when the home opens, at most once a minute (P7 7-나) */
const XMAS_SAY_GAP=60000;let lastXmasSay=0;
const he=games.home.enter;
games.home.enter=()=>{he();
  renderToday();renderToto(allDone?'happy':'idle');renderVillage();renderGift();
  if(M.Alive){if(al)al.detach();al=M.Alive.attach(totoBox,{kind:'bunny'})}
  dropCarrots();
  /* today's three plays done: a quiet celebration and one gift, once a day */
  let gift=null;if(allDone&&R)gift=R.todayGift();
  const now=Date.now();
  if(gift){renderGift();setTimeout(()=>{if(M.current()!=='home')return;if(al)al.play('hop');try{M.tone(784,.3,'sine',.07);M.tone(1046,.45,'sine',.07,.22)}catch(e){}
    say('오늘 놀이를 다 했어요! 선물이 왔어요! 내 방에 가 볼까?','You finished today\'s play! A present came! Let\'s go to your room!')},700);lastGreet=now}
  else if(now-lastGreet>45000){lastGreet=now;setTimeout(()=>{if(M.current()==='home')greet()},600)}
  if(isXmas()&&XM.voice&&now-lastXmasSay>XMAS_SAY_GAP){lastXmasSay=now;setTimeout(()=>{if(M.current()==='home')say(XM.voice.ko,XM.voice.en,true)},2600)}
  if(HG)HG.start({type:'tap',wait:true,after:IDLE,quiet:true,at:()=>{const r=startBtn.getBoundingClientRect(),hr=home.getBoundingClientRect();return[r.left-hr.left+r.width*.5,r.top-hr.top+r.height*.45]}});
};
games.home.exit=()=>{if(HG)HG.stop();dropT.forEach(clearTimeout);dropT=[];if(al){al.detach();al=null}};
let rz=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(M.current()==='home')layout()},120)});
document.addEventListener('ml-mission',()=>{if(M.current()==='home')renderToday()});
document.addEventListener('ml-bgmset',()=>{if(M.current()==='home'){renderToto(allDone?'happy':'idle');if(M.Alive){if(al)al.detach();al=M.Alive.attach(totoBox,{kind:'bunny'})}renderVillage();renderGift()}});

/* ============================== parent settings > 아이 기록 (progress.parentView) ============================== */
const REC_CSS=`
#recordBlock{display:flex;flex-direction:column;gap:8px;width:100%}
#recordBlock .rec-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:18px}
#recordBlock .rec-h small{font-family:system-ui,sans-serif;font-size:14px;color:var(--muted,#8A7A70)}
#recordBlock .rec-place{font-size:16px;margin-top:6px}
#recordBlock .rec-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#recordBlock .rec-cell{border:0;border-radius:16px;background:var(--bg,#F6F1EA);padding:6px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:13px;line-height:1.2;min-height:118px}
#recordBlock .rec-cell.sel{box-shadow:0 0 0 3px ${PAL.rose||'#E8A0AE'}}
#recordBlock .rec-cell .ri{width:46px;height:46px;display:grid;place-items:center}#recordBlock .rec-cell .ri svg{width:100%;height:100%;display:block;overflow:visible}
#recordBlock .rec-cell .rn{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#recordBlock .rec-cell .rl{font-size:14px}
#recordBlock .rec-cell .mlp-star{width:16px;height:16px}
#recordBlock .rec-cell .rd{font-family:system-ui,sans-serif;font-size:11px;color:var(--muted,#8A7A70)}
#recordBlock .rec-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:15px;background:var(--bg,#F6F1EA);border-radius:16px;padding:8px 10px}
#recordBlock .rec-pick button{border:0;border-radius:999px;min-width:40px;height:40px;background:var(--paper,#FFFDF9);font-size:17px;box-shadow:0 2px 0 rgba(91,74,66,.14)}
#recordBlock .rec-pick button.on{background:var(--ink,#5B4A42);color:var(--paper,#FFFDF9)}
`;
const rs=document.createElement('style');rs.textContent=REC_CSS;document.head.appendChild(rs);
const sheet=document.querySelector('#settings .sheet');
const recBlock=document.createElement('div');recBlock.id='recordBlock';
if(sheet){const before=sheet.querySelector('#progressRows')||sheet.querySelector('h4');sheet.insertBefore(recBlock,before||null)}
const pad2=n=>String(n).padStart(2,'0'),dstr=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
const todayS=()=>dstr(Date.now());
function lastDay(sid,gid,inf){
  const stats=M.store.get('mallang_stats',{});let best='';Object.keys(stats).forEach(k=>{if(stats[k]&&(stats[k][sid]||stats[k][gid])&&k>best)best=k});
  if(inf&&inf.last){const k=dstr(inf.last);if(k>best)best=k}
  if(!best)return'아직';if(best===todayS())return'오늘';const [,mm,dd]=best.split('-');return `${+mm}/${+dd}`;
}
let recSel=null;
function recSections(){
  const ret=SHL.retired;const out=PORTALS.map(p=>({key:p.key,ko:p.ko,games:SHL.places[p.key].games.filter(g=>document.getElementById(g)&&!ret[g])}));
  const room=((HOME.places||{}).myroom)||{};out.push({key:'myroom',ko:room.ko||'내 방',games:['chores2','routine2'].filter(g=>document.getElementById(g))});
  return out;
}
function renderRecord(){
  if(!sheet)return;const P=PR();
  const gd=M.store.get('mallang_gate_day',null),min=gd&&gd.d===todayS()?Math.round((gd.sec||0)/60):0;
  let h=`<div class="rec-h"><b>아이 기록</b><small>오늘 논 시간 ${min}분</small></div>`;
  recSections().forEach(sec=>{
    h+=`<div class="rec-place">${sec.ko}</div><div class="rec-grid">`;
    sec.games.forEach(sid=>{const gid=GID[sid]||sid,inf=P?P.info(gid):null,lv=inf&&inf.max>1;
      const nm=(M.NAMES&&M.NAMES[sid])||sid;
      h+=`<button type="button" class="rec-cell${recSel===sid?' sel':''}" data-game="${sid}" data-gid="${gid}"${lv?'':' data-fixed="1"'}><span class="ri">${ICON[sid]||''}</span><span class="rn">${nm}</span>
        <span class="rl">${lv?`${inf.level}단계`:'–'}</span>${P?P.stars(gid,lv?inf.clears:0):''}<span class="rd">${lastDay(sid,gid,inf)}</span></button>`});
    h+=`</div>`;
    if(recSel&&sec.games.includes(recSel)){const gid=GID[recSel]||recSel,inf=P.info(gid);
      h+=`<div class="rec-pick" data-game="${recSel}"><span>${(M.NAMES&&M.NAMES[recSel])||recSel} 단계</span>${Array.from({length:inf.max},(_,i)=>`<button type="button" data-v="${i+1}" class="${inf.level===i+1?'on':''}">${i+1}</button>`).join('')}</div>`}
  });
  recBlock.innerHTML=h;
}
recBlock.addEventListener('click',e=>{
  const pk=e.target.closest('.rec-pick button');if(pk){const sid=pk.closest('.rec-pick').dataset.game,gid=GID[sid]||sid;if(PR())PR().set(gid,+pk.dataset.v);renderRecord();return}
  const c=e.target.closest('.rec-cell');if(!c)return;
  if(c.dataset.fixed){recSel=null;renderRecord();return}
  recSel=recSel===c.dataset.game?null:c.dataset.game;renderRecord();
});
const setM=document.getElementById('settings');
if(setM&&window.MutationObserver)new MutationObserver(()=>{if(!setM.hidden){recSel=null;renderRecord()}}).observe(setM,{attributes:true,attributeFilter:['hidden']});
renderRecord();

M.Home={layout,growOf,isXmas,renderRecord,portals:()=>PORTALS.map(p=>Object.assign({},p))};
games.home.enter();
/* the back button inside a game goes one step up by itself (ML.Shell: game → place → home) */
})();
