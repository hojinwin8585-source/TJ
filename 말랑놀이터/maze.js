/* 길 찾기 (P14) — 토토가 서 있고, 갈 수 있는 다음 자리에 큰 발자국이 빛나요. 발자국을 콕 하면 토토가 그 길을 통통 걸어가요.
   길을 손가락으로 따라가도 돼요(touch.trace: 굵은 길, 근처만 가도 인정, 천천히 도와줌).
   틀린 길에는 이유가 보여요(자고 있는 고양이, 물웅덩이, 막힌 울타리). 그래도 가면 토토가 스스로 돌아오고, 실패나 시간 제한은 없어요.
   미로 전체가 한 화면에 보이고 길 폭은 화면 폭의 18% 이상이에요. 숫자는 MLCFG.games.maze, touch, calm 에서 읽어요. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!M.Alive)return;
const {say,sfx,tone,pick,games,actx,store,batchim}=M;
const {life}=P;
const id='maze',L=life(id),OL=A.OL,S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG,CALM=CF.calm,PAL=CALM.palette,TC=CF.touch||{},TR=TC.trace||{},MZ=(CF.games||{}).maze||{};
const AL=M.Alive;

/* ---------- numbers from the config (see 보고: what the config does not say is fixed below) ---------- */
const LANE_RATIO=(()=>{const m=String(MZ.view||'').match(/(\d+)\s*%/);return m?+m[1]/100:.18})();   // 길 폭은 화면 폭의 18% 이상
const FOOT=TC.minTargetPx||110;                                  // 발자국 누르는 자리
const NEAR=TR.countsWithinRatio||.4,CREEP=TR.creepWhileTouchingPerSec||.05,MAXSP=TR.maxSpeedPerSec||.35;
const CEL=CALM.celebration||{pieces:6,durationMs:1200},GAP=CALM.minMsBetweenSceneChanges||4000;
/* 설정에 없어서 여기 정한 값: 걷는 빠르기, 칸 모양, 토토 크기 */
const SPEED_RATIO=.62,TOTO_W=84,PAD_X=6,PAD_T=30,PAD_B=8,MOVE_PX=8;

/* ---------- the five mazes: lattice points (column,row) the lanes run through. Stops are the two ends of every lane piece ----------
   w: dead-end side lane (wrong way, with a visible reason)   blk: reason on it ('rand' = cat / puddle / fence)
   sg: gets a picture sign (level 4)   c: carrots on the way (fractions)   key: lane that ends in the key   door: locked door on the lane */
const LV={
  1:{cols:3,rows:4,start:[0,3],goal:[1,0],gk:'home',E:[
    {p:[[0,3],[1,3],[2,3]]},{p:[[2,3],[2,2],[2,1]]},{p:[[2,1],[1,1],[0,1]]},{p:[[0,1],[0,0],[1,0]]}]},
  2:{cols:3,rows:4,start:[1,3],goal:[0,0],gk:'friend',pizza:1,E:[
    {p:[[1,3],[1,2]]},{p:[[1,2],[0,2]],w:1,blk:'cat'},{p:[[1,2],[2,2],[2,1]]},{p:[[2,1],[2,0],[1,0]]},{p:[[1,0],[0,0]]}]},
  3:{cols:3,rows:4,start:[0,3],goal:[1,0],gk:'friend',carrots:1,E:[
    {p:[[0,3],[1,3]]},{p:[[1,3],[2,3]],w:1,blk:'rand'},{p:[[1,3],[1,2],[1,1]],c:[.5]},{p:[[1,1],[2,1]],w:1,blk:'rand'},
    {p:[[1,1],[0,1]],c:[.5]},{p:[[0,1],[0,0],[1,0]],c:[.3]}]},
  4:{cols:3,rows:4,start:[1,3],goal:[1,0],gk:'friend',hide:1,E:[
    {p:[[1,3],[1,2]]},{p:[[1,2],[0,2]],w:1,sg:1},{p:[[1,2],[2,2]],sg:1},{p:[[2,2],[2,1]]},
    {p:[[2,1],[2,0]],w:1,sg:1},{p:[[2,1],[1,1],[0,1],[0,0],[1,0]],sg:1}]},
  5:{cols:3,rows:5,start:[1,4],goal:[0,0],gk:'home',keyAt:[2,0],E:[
    {p:[[1,4],[1,3]]},{p:[[1,3],[0,3]],w:1,blk:'rand'},{p:[[1,3],[2,3],[2,2]]},{p:[[2,2],[2,1],[2,0]],key:1},
    {p:[[2,2],[1,2]]},{p:[[1,2],[0,2]],w:1,blk:'rand'},{p:[[1,2],[1,1]]},{p:[[1,1],[0,1],[0,0]],door:.5}]}
};
const FRIENDS=[{k:'cat',ko:'고양이',en:'cat'},{k:'dog',ko:'강아지',en:'puppy'},{k:'bear',ko:'곰',en:'bear'}];

/* ---------- voice (words for the ear; nothing is written on the child's screen) ---------- */
const LINE={
  home:['토토를 집에 데려다 줘! 발자국을 콕!','Take Toto home! Tap the footprints!'],
  pizza:['피자를 친구에게 가져다 줘요! 발자국을 콕!','Bring the pizza to our friend! Tap the footprints!'],
  carrots:['당근을 세 개 줍고 친구에게 가자!','Pick up three carrots and go to our friend!'],
  seek:['숨은 친구를 찾아 보자! 발자국을 콕!','Let us find our hidden friend! Tap the footprints!'],
  key:['열쇠를 찾아서 문을 열자!','Find the key and open the door!'],
  step:['발자국을 콕!','Tap the footprints!'],
  fork:['어느 길로 갈까?','Which way shall we go?'],
  notThis:['이쪽이 아니야, 이쪽!','Not this way, this way!'],
  cat:['쉿, 고양이가 자고 있어!','Shh, the cat is sleeping!'],
  puddle:['앗, 물웅덩이야!','Oh, a puddle!'],
  bar:['울타리가 막고 있어!','The fence is in the way!'],
  end:['길이 막혔어!','The road ends here!'],
  carrot:['당근 찾았다!','Found a carrot!'],
  keyFound:['열쇠를 찾았다!','Found the key!'],
  locked:['문이 잠겼어! 열쇠가 필요해!','The door is locked! We need the key!'],
  keyHere:['열쇠는 이쪽에 있어!','The key is this way!'],
  open:['문이 열렸다!','The door is open!'],
  homeWin:['집에 왔다! 야호!','We are home! Hooray!'],
  friendWin:['와, 왔구나! 고마워!','You came! Thank you!'],
  cheer:['발자국을 콕 눌러 봐!','Tap a footprint!'],
  ask:f=>[`${f.ko}${batchim(f.ko)?'이':'가'} 있는 길로 가자!`,`Go to the ${f.en}!`],
  askNo:f=>[`아니야, ${f.ko}${batchim(f.ko)?'이':'가'} 있는 길은 이쪽!`,`No, the ${f.en} is this way!`]
};

/* ---------- little drawings (말랑 그림체: 또렷한 윤곽, 차분한 색) ---------- */
const ICO={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:'<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#F0D58A" stroke="#5B3A29" stroke-width="1.2"/></svg>'
};
/* each inner drawing is centred around (0,0) in a 100 x 100 box */
const D={
  house:`<path d="M-38 36V-4L0 -36L38 -4V36Z" fill="#F8E8D0" ${S}/><path d="M-46 -2L0 -44L46 -2Z" fill="${PAL.rose}" ${S}/><rect x="26" y="-46" width="13" height="24" rx="3" fill="#D9BFA6" ${S}/><path d="M-12 36V8Q-12 -2 0 -2Q12 -2 12 8V36Z" fill="${PAL.sage}" ${S} class="mz-hdoor"/><circle cx="6" cy="20" r="2.6" fill="${PAL.butter}"/><rect x="-34" y="4" width="16" height="16" rx="4" fill="${PAL.sky}" ${S}/><rect x="18" y="4" width="16" height="16" rx="4" fill="${PAL.sky}" ${S}/>`,
  pizza:`<ellipse cx="0" cy="34" rx="40" ry="6" fill="rgba(91,58,41,.14)"/><circle r="38" fill="${PAL.peach}" ${S}/><circle r="29" fill="${PAL.butter}" stroke="#E8C466" stroke-width="2"/><circle cx="-10" cy="-10" r="7" fill="#E0786F" ${S}/><circle cx="12" cy="-4" r="7" fill="#E0786F" ${S}/><circle cx="-4" cy="14" r="7" fill="#E0786F" ${S}/><circle cx="16" cy="18" r="5" fill="${PAL.sage}" ${S}/>`,
  carrot:`<path d="M-10 -22L0 -42L10 -22Z" fill="${PAL.sage}" ${S}/><path d="M-4 -26L-18 -38M4 -26L18 -36" stroke="${PAL.sage}" stroke-width="7" stroke-linecap="round"/><path d="M-16 -24Q0 -32 16 -24Q18 -10 4 36Q0 44 -4 36Q-18 -10 -16 -24Z" fill="#EDA468" ${S}/><path d="M-8 -12H4M-6 4H6M-3 20H3" stroke="#D9824A" stroke-width="3" stroke-linecap="round"/>`,
  key:`<circle cx="-16" cy="-12" r="19" fill="#F0D58A" ${S}/><circle cx="-16" cy="-12" r="8" fill="${PAL.bg}" ${S}/><path d="M-4 0L30 34" stroke="${OL}" stroke-width="15" stroke-linecap="round"/><path d="M-4 0L30 34" stroke="#F0D58A" stroke-width="8" stroke-linecap="round"/><path d="M16 22L26 12M24 30L34 20" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M16 22L26 12M24 30L34 20" stroke="#F0D58A" stroke-width="5.5" stroke-linecap="round"/>`,
  apple:`<path d="M0 -26Q-6 -40 -14 -40" fill="none" stroke="#8A5A36" stroke-width="5" stroke-linecap="round"/><path d="M2 -28Q18 -44 30 -34Q16 -22 2 -28Z" fill="${PAL.sage}" ${S}/><path d="M0 -24Q-38 -38 -38 4Q-38 38 -16 38Q-8 34 0 38Q8 34 16 38Q38 38 38 4Q38 -38 0 -24Z" fill="#E0786F" ${S}/><path d="M-26 -6Q-24 -16 -16 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`,
  banana:`<path d="M-34 -26Q-6 -6 30 -2Q36 -2 38 6Q4 40 -30 -8Q-38 -20 -34 -26Z" fill="#F0D58A" ${S}/><path d="M-34 -26L-38 -34" stroke="#8A5A36" stroke-width="7" stroke-linecap="round"/><path d="M-20 -6Q0 12 28 6" fill="none" stroke="#E0BC5E" stroke-width="3" stroke-linecap="round"/>`,
  strawberry:`<path d="M-14 -28Q0 -40 14 -28Q4 -22 0 -26Q-4 -22 -14 -28Z" fill="${PAL.sage}" ${S}/><path d="M-34 -22Q0 -34 34 -22Q36 6 10 34Q0 42 -10 34Q-36 6 -34 -22Z" fill="#E8657A" ${S}/><ellipse cx="-14" cy="-6" rx="3" ry="4.5" fill="${PAL.butter}"/><ellipse cx="8" cy="-10" rx="3" ry="4.5" fill="${PAL.butter}"/><ellipse cx="-2" cy="10" rx="3" ry="4.5" fill="${PAL.butter}"/><ellipse cx="16" cy="8" rx="3" ry="4.5" fill="${PAL.butter}"/><ellipse cx="-16" cy="16" rx="3" ry="4.5" fill="${PAL.butter}"/>`,
  pear:`<path d="M0 -26Q2 -38 10 -42" fill="none" stroke="#8A5A36" stroke-width="5" stroke-linecap="round"/><path d="M-12 -26Q0 -34 12 -26Q16 -12 28 8Q38 36 0 40Q-38 36 -28 8Q-16 -12 -12 -26Z" fill="#C9D98A" ${S}/><path d="M-20 10Q-18 22 -8 28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`
};
const svg=(inner,vb='-50 -50 100 100',cls='')=>`<svg viewBox="${vb}"${cls?` class="${cls}"`:''} style="overflow:visible">${inner}</svg>`;
const FRUITS=[{k:'apple',ko:'사과',en:'apple'},{k:'banana',ko:'바나나',en:'banana'},{k:'strawberry',ko:'딸기',en:'strawberry'},{k:'pear',ko:'배',en:'pear'}];

/* two bunny footprints, pointing along the way (ang in degrees, 0 = to the right) */
const pawOne=(x,y)=>`<g transform="translate(${x} ${y})"><ellipse cx="0" cy="5" rx="9" ry="12" fill="${PAL.rose}" stroke="#C97A8A" stroke-width="2.4"/><ellipse cx="-6" cy="-12" rx="3.6" ry="6" fill="${PAL.rose}" stroke="#C97A8A" stroke-width="2"/><ellipse cx="0" cy="-15" rx="3.6" ry="6.4" fill="${PAL.rose}" stroke="#C97A8A" stroke-width="2"/><ellipse cx="6" cy="-12" rx="3.6" ry="6" fill="${PAL.rose}" stroke="#C97A8A" stroke-width="2"/></g>`;
const footSVG=ang=>`<svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="49" fill="#FFFDF9" opacity=".92" stroke="${PAL.butter}" stroke-width="5"/><g transform="rotate(${(ang+90).toFixed(0)} 55 55)">${pawOne(40,60)}${pawOne(70,46)}</g></svg>`;

/* reasons on the wrong ways (centred at 0,0, about one lane wide) */
const BLK={
  cat:(l,a)=>`<g transform="scale(${(l/90).toFixed(2)})"><ellipse cx="0" cy="22" rx="42" ry="7" fill="rgba(91,58,41,.16)"/><ellipse cx="2" cy="6" rx="38" ry="24" fill="#F2B48C" ${S}/><path d="M-20 -6Q-14 -14 -6 -8M8 -8Q14 -14 22 -6" stroke="#D9824A" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="-30" cy="0" r="19" fill="#F2B48C" ${S}/><path d="M-44 -12L-42 -30L-30 -18ZM-18 -14L-14 -30L-4 -12Z" fill="#F2B48C" ${S}/><path d="M-38 0Q-34 -4 -30 0M-26 0Q-22 -4 -18 0" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="-33" cy="7" rx="3.5" ry="2.4" fill="#E8A0AE"/><path d="M34 12Q52 8 50 -6Q48 -16 38 -12" fill="none" stroke="#F2B48C" stroke-width="10" stroke-linecap="round"/><circle cx="-6" cy="-32" r="4" fill="#fff" stroke="#CDE3F0" stroke-width="2"/><circle cx="6" cy="-42" r="6" fill="#fff" stroke="#CDE3F0" stroke-width="2"/><circle cx="20" cy="-54" r="8" fill="#fff" stroke="#CDE3F0" stroke-width="2"/></g>`,
  puddle:(l,a)=>`<g transform="scale(${(l/90).toFixed(2)})"><path d="M-44 4Q-44 -22 -10 -24Q24 -30 42 -8Q54 12 24 24Q-6 34 -34 24Q-44 20 -44 4Z" fill="#A7CFE8" stroke="#7FAFD0" stroke-width="3.5" stroke-linejoin="round"/><path d="M-26 0Q-18 -10 -4 -10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/><path d="M8 8Q18 4 28 10" fill="none" stroke="#E8F4FB" stroke-width="3.5" stroke-linecap="round"/><g transform="translate(18 -2) rotate(-25)"><path d="M0 -9Q9 -2 0 9Q-9 -2 0 -9Z" fill="#9CC48F" ${S}/></g></g>`,
  bar:(l,a)=>`<g transform="rotate(${a}) scale(${(l/90).toFixed(2)})"><ellipse cx="0" cy="22" rx="52" ry="6" fill="rgba(91,58,41,.16)"/><rect x="-46" y="-26" width="12" height="52" rx="5" fill="#D9BFA6" ${S}/><rect x="34" y="-26" width="12" height="52" rx="5" fill="#D9BFA6" ${S}/><rect x="-44" y="-16" width="88" height="11" rx="5" fill="#E3BE98" ${S}/><rect x="-44" y="4" width="88" height="11" rx="5" fill="#E3BE98" ${S}/></g>`,
  lock:(l,a)=>`<g transform="rotate(${a}) scale(${(l/90).toFixed(2)})"><ellipse cx="0" cy="26" rx="56" ry="6" fill="rgba(91,58,41,.16)"/><g class="mz-gl"><rect x="-52" y="-32" width="52" height="60" rx="8" fill="#C9A98A" ${S}/><path d="M-40 -22V20M-26 -22V20" stroke="#B88A66" stroke-width="3" stroke-linecap="round"/></g><g class="mz-gr"><rect x="0" y="-32" width="52" height="60" rx="8" fill="#C9A98A" ${S}/><path d="M26 -22V20M40 -22V20" stroke="#B88A66" stroke-width="3" stroke-linecap="round"/></g><g class="mz-lk"><circle cx="0" cy="-2" r="13" fill="#F0D58A" ${S}/><circle cx="0" cy="-4" r="3.4" fill="${OL}"/><path d="M0 -3V6" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/></g></g>`
};
const signSVG=f=>`<g><ellipse cx="0" cy="40" rx="22" ry="5" fill="rgba(91,58,41,.16)"/><rect x="-5" y="6" width="10" height="36" rx="3" fill="#C9A98A" ${S}/><rect x="-34" y="-40" width="68" height="56" rx="14" fill="#FFFDF9" ${S}/><g transform="translate(0 -12) scale(.5)">${D[f.k]}</g></g>`;
const bush=(w)=>`<g transform="scale(${(w/100).toFixed(2)})"><ellipse cx="0" cy="30" rx="52" ry="7" fill="rgba(91,58,41,.14)"/><circle cx="-28" cy="8" r="24" fill="#9CC293" ${S}/><circle cx="26" cy="10" r="22" fill="#A9CFA0" ${S}/><circle cx="0" cy="-6" r="28" fill="#A9CFA0" ${S}/><circle cx="-30" cy="-6" r="4" fill="${PAL.rose}"/><circle cx="22" cy="-14" r="4" fill="${PAL.butter}"/></g>`;
const DECOR=[
  (w)=>bush(w),
  (w)=>`<g transform="scale(${(w/100).toFixed(2)})"><ellipse cx="0" cy="40" rx="30" ry="6" fill="rgba(91,58,41,.14)"/><rect x="-7" y="6" width="14" height="36" rx="5" fill="#C9A98A" ${S}/><circle cx="0" cy="-10" r="34" fill="#A9CFA0" ${S}/><circle cx="-14" cy="-16" r="6" fill="#C5E0BC" opacity=".8"/></g>`,
  (w)=>`<g transform="scale(${(w/100).toFixed(2)})"><ellipse cx="0" cy="22" rx="40" ry="6" fill="rgba(91,58,41,.14)"/><path d="M-36 20Q-40 -10 -8 -16Q22 -20 34 4Q40 20 28 22Z" fill="#CFC8BE" ${S}/><path d="M-18 -4Q-10 -10 0 -10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></g>`,
  (w)=>`<g transform="scale(${(w/100).toFixed(2)})">${[[-22,10,PAL.rose],[8,-6,PAL.butter],[26,14,PAL.lilac]].map(([x,y,c])=>`<path d="M${x} ${y+18}V${y}" stroke="#7FA978" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="11" fill="${c}" ${S}/><circle cx="${x}" cy="${y}" r="4" fill="#FFFDF9"/>`).join('')}</g>`
];

/* ---------- the screen ---------- */
const css=`
#maze{gap:10px}
#maze .bar .round{width:64px;height:64px;padding:10px}
#maze .bar .round svg{display:block;width:100%;height:100%}
.mzbar-sp{flex:1}
.mzstars{display:flex;gap:2px;flex:none}
.mzstars svg{width:20px;height:20px}
.mz-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#DDE8CF}
.mz-stage>svg.mz-scene{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.mz-ch{position:absolute;left:0;top:0;pointer-events:none;will-change:transform;z-index:5}
.mz-ch.fr{z-index:3}
.mz-ani{width:100%;height:100%}
.mz-ani svg{width:100%;height:100%;display:block;overflow:visible}
.mz-hide{position:absolute;pointer-events:none;z-index:4}
.mz-hide svg{width:100%;height:100%;display:block;overflow:visible}
.mz-pz{position:absolute;right:-10%;bottom:6%;width:46%;aspect-ratio:1}
.mz-pz svg{width:100%;height:100%;display:block;overflow:visible}
.mz-feet{position:absolute;inset:0;z-index:6;pointer-events:none}
.mz-foot{position:absolute;width:${FOOT}px;height:${FOOT}px;margin:0;padding:0;border:0;background:transparent;pointer-events:auto;transition:opacity .35s,transform .15s;-webkit-tap-highlight-color:transparent}
.mz-foot svg{display:block;width:100%;height:100%;filter:drop-shadow(0 3px 3px rgba(91,74,66,.18))}
.mz-foot:active{transform:scale(.94)}
.mz-foot.tried{opacity:.55}
.mz-foot.solo svg{animation:mzbob 1.8s ease-in-out infinite}
.mz-foot.nudge svg{animation:mznudge .7s ease-in-out 2}
@keyframes mzbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mznudge{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.mz-fx{position:absolute;z-index:8;pointer-events:none;width:30px;height:30px;margin:-15px 0 0 -15px}
.mz-fx svg{display:block;width:100%;height:100%}
.mz-tray{flex:none;height:clamp(120px,21vh,172px);display:flex;align-items:center;justify-content:center;gap:14px;border-radius:26px;padding:6px 10px;
  background:color-mix(in srgb,var(--paper) 78%,var(--bg));box-shadow:0 4px 10px rgba(91,74,66,.1)}
.mz-card{width:clamp(${FOOT}px,30vw,134px);height:calc(100% - 4px);min-height:${FOOT}px;max-height:150px;border:0;border-radius:24px;background:var(--paper);padding:8px;box-shadow:0 4px 0 rgba(91,74,66,.14);transition:transform .15s}
.mz-card:active{transform:translateY(3px)}
.mz-card svg{display:block;width:100%;height:100%}
.mz-card.dim svg{opacity:.38;filter:grayscale(.6)}
.mz-card.pop{animation:mzcard .5s}
@keyframes mzcard{0%{transform:scale(1)}40%{transform:scale(1.1)}100%{transform:scale(1)}}
.mz-open .mz-gl{transform:translateX(-46px) scaleX(.18);transform-box:fill-box;transform-origin:left center;transition:transform .5s}
.mz-open .mz-gr{transform:translateX(46px) scaleX(.18);transform-box:fill-box;transform-origin:right center;transition:transform .5s}
.mz-open .mz-lk{opacity:0;transition:opacity .3s}
.mz-open .mz-hdoor{fill:#FFF3C9}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar"><button class="round" data-go="home" id="mzHome" aria-label="뒤로">${ICO.back}</button><div class="mzbar-sp"></div><div class="mzstars" id="mzStars"></div></div>
<div class="mz-stage" id="mzStage"><svg class="mz-scene" id="mzScene"></svg><div class="mz-feet" id="mzFeet"></div></div>
<div class="mz-tray" id="mzTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='길 찾기';
const $=s=>sec.querySelector(s);
const stage=$('#mzStage'),scene=$('#mzScene'),feetEl=$('#mzFeet'),tray=$('#mzTray');
const G=M.Guide.make(sec,{say});
const DATA=Object.assign({level:1,stars:0},store.get('mallang_maze',{}));
const save=()=>store.set('mallang_maze',DATA);
/* level: ML.Progress (P2-나 단계 엔진) if it exists, otherwise the saved one */
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
if(PRG())PRG().register(id,{max:5,name:'길 찾기',seg:'setMazeLv',seed:DATA.level});
const level=()=>Math.max(1,Math.min(5,(PRG()?PRG().get(id).level:DATA.level)|0||1));
const LOG=[];

/* ---------- geometry ---------- */
let st=null,W=0,H=0,LW=72,toto=null,totoAl=null,friendEl=null,friendAl=null,tr=null,lastMiss=0;
const posAt=(pts,cum,s)=>{s=Math.max(0,Math.min(cum[cum.length-1],s));let i=1;while(i<cum.length-1&&cum[i]<s)i++;const a=pts[i-1],b=pts[i],t=(s-cum[i-1])/((cum[i]-cum[i-1])||1);return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,dx:b[0]-a[0],dy:b[1]-a[1]}};
const project=(pts,cum,p)=>{let best={d:1e9,s:0};for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy||1;let t=((p.x-a[0])*vx+(p.y-a[1])*vy)/l2;t=Math.max(0,Math.min(1,t));
  const x=a[0]+vx*t,y=a[1]+vy*t,d=Math.hypot(p.x-x,p.y-y);if(d<best.d)best={d,s:cum[i-1]+Math.sqrt(l2)*t}}return best};
const cumOf=pts=>{const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c};
const key=(c,r)=>c+','+r;
const SPEED=()=>SPEED_RATIO*W;

function build(){
  const def=LV[st.lv],mir=st.mirror,cols=def.cols,rows=def.rows;
  LW=Math.min(Math.ceil(LANE_RATIO*innerWidth)+1,Math.round(W*.26));
  const px=(W-2*PAD_X-LW)/(cols-1),py=(H-PAD_T-PAD_B-LW)/(rows-1);
  const X=c=>PAD_X+LW/2+(mir?cols-1-c:c)*px,Y=r=>PAD_T+LW/2+r*py;
  const nodes={},edges=[],used=new Set();
  const nd=(c,r)=>{const k=key(mir?cols-1-c:c,r);if(!nodes[k])nodes[k]={id:k,c:mir?cols-1-c:c,r,x:X(c),y:Y(r),es:[]};return nodes[k]};
  def.E.forEach((d,i)=>{
    d.p.forEach(([c,r])=>used.add(key(mir?cols-1-c:c,r)));
    const a=nd(...d.p[0]),b=nd(...d.p[d.p.length-1]);
    const pts=d.p.map(([c,r])=>[X(c),Y(r)]),cum=cumOf(pts),rp=pts.slice().reverse(),rc=cumOf(rp);
    const e={i,id:'e'+i,a:a.id,b:b.id,p:pts,cum,rp,rcum:rc,len:cum[cum.length-1],w:!!d.w,sg:!!d.sg,keyEdge:!!d.key,blk:d.blk||null,carrots:(d.c||[]).map((f,k)=>({s:f*cum[cum.length-1],got:false,id:'c'+i+'_'+k})),doorS:d.door!=null?d.door*cum[cum.length-1]:null,done:false};
    edges.push(e);a.es.push(e);b.es.push(e);
  });
  const start=nd(...def.start),goal=nd(...def.goal);goal.goal=true;
  if(def.keyAt)nd(...def.keyAt).key=true;
  /* tree: parent edge of every stop, seen from the start */
  const par={},seen=new Set([start.id]),q=[start];
  while(q.length){const n=q.shift();n.es.forEach(e=>{const o=nodes[e.a===n.id?e.b:e.a];if(!seen.has(o.id)){seen.add(o.id);par[o.id]=e;o.parent=n.id;q.push(o)}})}
  Object.values(nodes).forEach(n=>{n.pe=par[n.id]||null});
  /* what to do with the reasons on the wrong ways (picked once per round, so they stay the same on resize) */
  edges.forEach(e=>{if(e.w){const b=def.E[e.i].blk;if(!(e.id in st.reason))st.reason[e.id]=b==null?null:b==='rand'?pick(['cat','puddle','bar']):b;e.reason=st.reason[e.id];
    if(e.reason){e.blkS=e.len*.8;e.stopS=Math.max(26,e.blkS-LW*.8)}else{e.blkS=null;e.stopS=Math.max(26,e.len-LW*.55)}}});
  /* free lattice points get hand-placed greenery (never a repeating pattern) */
  const free=[];for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){const k=key(c,r);if(!used.has(k))free.push({x:PAD_X+LW/2+c*px,y:Y(r),c,r})}
  return{nodes,edges,start,goal,free,px,py};
}
const opts=n=>n.es.filter(e=>e!==n.pe&&!e.done);
const other=(e,n)=>st.g.nodes[e.a===n.id?e.b:e.a];
const polyFrom=(e,n)=>e.a===n.id?[e.p,e.cum]:[e.rp,e.rcum];

/* ---------- drawing the whole maze ---------- */
function drawScene(){
  const g=st.g,def=LV[st.lv];
  const lanes=g.edges.map(e=>'M'+e.p.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')).join('');
  let s=`<defs><linearGradient id="mzg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4EED8"/><stop offset="1" stop-color="#D3E3C5"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#mzg)"/>`;
  g.free.forEach((f,i)=>{const w=Math.min(LW*1.15,g.px*.72);const dx=((st.seed*(i+3))%17)-8,dy=((st.seed*(i+5))%13)-6;s+=`<g transform="translate(${(f.x+dx).toFixed(0)} ${(f.y+dy).toFixed(0)})">${DECOR[(st.seed+i*2)%DECOR.length](w)}</g>`});
  s+=`<path d="${lanes}" fill="none" stroke="#D3BC98" stroke-width="${LW+9}" stroke-linecap="round" stroke-linejoin="round"/><path d="${lanes}" fill="none" stroke="#F6EAD3" stroke-width="${LW}" stroke-linecap="round" stroke-linejoin="round"/>`;
  /* carrots, key */
  g.edges.forEach(e=>e.carrots.forEach(c=>{if(c.got)return;const p=posAt(e.p,e.cum,c.s);s+=`<g id="mz-${c.id}"><g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(LW/115).toFixed(2)})" style="transform-box:fill-box">${D.carrot}</g></g>`}));
  const kn=Object.values(g.nodes).find(n=>n.key);if(kn&&!st.hasKey)s+=`<g id="mz-key"><g transform="translate(${kn.x.toFixed(1)} ${kn.y.toFixed(1)}) scale(${(LW/95).toFixed(2)})">${D.key}</g></g>`;
  /* reasons, signs, door */
  g.edges.forEach(e=>{
    if(e.w&&e.reason){const p=posAt(e.p,e.cum,e.blkS),ang=Math.abs(p.dx)>Math.abs(p.dy)?90:0;s+=`<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">${BLK[e.reason](LW*.95,ang)}</g>`}
    if(e.doorS!=null){const p=posAt(e.p,e.cum,e.doorS),ang=Math.abs(p.dx)>Math.abs(p.dy)?90:0;s+=`<g id="mz-door" class="${st.hasKey?'mz-open':''}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">${BLK.lock(LW*.95,ang)}</g>`}
    if(e.sg&&e.fruit){const p=posAt(e.p,e.cum,Math.min(e.len*.5,LW*1.0));s+=`<g transform="translate(${p.x.toFixed(1)} ${(p.y-4).toFixed(1)}) scale(${(LW/92).toFixed(2)})">${signSVG(e.fruit)}</g>`}});
  /* the goal */
  const gn=g.goal;
  if(def.gk==='home')s+=`<g id="mz-house" class="${st.won?'mz-open':''}" transform="translate(${gn.x.toFixed(1)} ${(gn.y-12).toFixed(1)})"><g transform="scale(.86)">${D.house}</g></g>`;
  scene.setAttribute('viewBox',`0 0 ${W} ${H}`);scene.innerHTML=s;
}

/* ---------- characters (Alive) ---------- */
const chSize=()=>({w:Math.round(Math.min(TOTO_W,LW*1.18)),h:Math.round(Math.min(TOTO_W,LW*1.18)*230/200)});
function mkChar(kind,cls){
  const d=document.createElement('div');d.className='mz-ch '+(cls||'');
  d.innerHTML=`<div class="mz-ani">${A.animal(kind,'idle')}</div>`;stage.appendChild(d);return d;
}
function placeCh(el,x,y,flip,bob){const {w,h}=chSize();el.style.width=w+'px';el.style.height=h+'px';el.style.transform=`translate(${(x-w/2).toFixed(1)}px,${(y-h*.6+(bob||0)).toFixed(1)}px) scaleX(${flip<0?-1:1})`}
let faceDir=1;
function setToto(x,y,dx,bob){if(dx!=null&&Math.abs(dx)>.5)faceDir=dx<0?-1:1;st.tx=x;st.ty=y;placeCh(toto,x,y,faceDir,bob)}
function layoutChars(){
  const g=st.g,n=st.cur;placeCh(toto,n.x,n.y,faceDir,0);st.tx=n.x;st.ty=n.y;
  if(friendEl){const gn=g.goal;placeCh(friendEl,gn.x,gn.y,gn.c>=(LV[st.lv].cols-1)/2?-1:1,0);
    const hb=stage.querySelector('.mz-hide');if(hb){const {w,h}=chSize();hb.style.cssText=`left:${(gn.x-w*.62).toFixed(0)}px;top:${(gn.y-h*.6+h*.5).toFixed(0)}px;width:${(w*1.24).toFixed(0)}px;height:${(w*.9).toFixed(0)}px`}}
}

/* ---------- tray: the aim of this maze, as pictures ---------- */
const frFace=()=>`<svg viewBox="0 0 200 230" style="overflow:visible">${A.animal(st.friend.k,'happy').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</svg>`;
const carrotRow=n=>`<svg viewBox="0 0 150 60">${[0,1,2].map(i=>`<g class="${i<n?'':'dim'}" transform="translate(${25+i*50} 30) scale(.55)" opacity="${i<n?1:.3}">${D.carrot}</g>`).join('')}</svg>`;
function renderTray(){
  const lv=st.lv;let cards=[];
  if(lv===1)cards=[['home',svg(D.house)]];
  if(lv===2)cards=[['pizza',svg(D.pizza)],['friend',frFace()]];
  if(lv===3)cards=[['carrots',carrotRow(st.carrots)],['friend',frFace()]];
  if(lv===4)cards=[['ask',st.target?svg(D[st.target.k]):svg(D.apple)]];
  if(lv===5)cards=[['key',svg(D.key),st.hasKey?'':'dim'],['home',svg(D.house)]];
  tray.innerHTML=cards.map(c=>`<button class="mz-card ${c[2]||''}" data-k="${c[0]}" aria-label="목표">${c[1]}</button>`).join('');
}
tray.addEventListener('click',e=>{const b=e.target.closest('.mz-card');if(!st||!b)return;actx();sfx.pop();b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');sayGoal(b.dataset.k)});
function sayGoal(k){
  const lv=st.lv;
  if(k==='ask'&&st.target){const a=LINE.ask(st.target);say(a[0],a[1]);return}
  if(k==='key'){say(LINE.key[0],LINE.key[1]);return}
  const l=lv===2?LINE.pizza:lv===3?LINE.carrots:lv===4?LINE.seek:lv===5?LINE.key:LINE.home;say(l[0],l[1])
}
const goalLine=()=>{const lv=st.lv;return lv===2?LINE.pizza:lv===3?LINE.carrots:lv===4?LINE.seek:lv===5?LINE.key:LINE.home};
function stars(){$('#mzStars').innerHTML=Array.from({length:Math.min(8,DATA.stars)},()=>ICO.star).join('')}

/* ---------- footprints (the next spots) ---------- */
const secXY=(x,y)=>{const sr=sec.getBoundingClientRect(),r=stage.getBoundingClientRect();return[x+r.left-sr.left,y+r.top-sr.top]};
const bestOpt=list=>{
  const good=list.filter(o=>!o.e.w);
  if(st.lv===5&&!st.hasKey){const k=good.find(o=>o.e.keyEdge);if(k)return k}
  if(st.lv===5&&st.hasKey){const k=good.find(o=>!o.e.keyEdge);if(k)return k}
  return good[0]||list[0]};
function footPt(e,n){const [pts,cum]=polyFrom(e,n),o=other(e,n);
  if(o.goal)return posAt(pts,cum,Math.max(0,e.len-LW*.95));
  return posAt(pts,cum,e.len)}
function options(){
  if(!st||st.phase!=='idle')return[];
  return opts(st.cur).map(e=>{const p=footPt(e,st.cur),[pts,cum]=polyFrom(e,st.cur),last=posAt(pts,cum,e.len-1);
    return{e,x:p.x,y:p.y,ang:Math.atan2(last.dy,last.dx)*180/Math.PI,node:other(e,st.cur)}});
}
function showFeet(){
  const list=options();st.opts=list;feetEl.innerHTML='';if(!list.length)return;
  const best=bestOpt(list);st.best=best;
  list.forEach(o=>{const b=document.createElement('button');b.className='mz-foot'+(list.length===1?' solo':'')+(o.e.w&&st.tried.has(o.e.id)?' tried':'');
    b.dataset.edge=o.e.id;b.dataset.node=o.node.id;b.dataset.ok=o===best?'1':o.e.w?'0':'1';b.setAttribute('aria-label','발자국');
    b.style.left=Math.max(0,Math.min(W-FOOT,o.x-FOOT/2)).toFixed(1)+'px';b.style.top=Math.max(0,Math.min(H-FOOT,o.y-FOOT/2)).toFixed(1)+'px';b.innerHTML=footSVG(o.ang);feetEl.appendChild(b)});
}
feetEl.addEventListener('click',e=>{const b=e.target.closest('.mz-foot');if(!b||!st||st.busy||st.phase!=='idle')return;actx();goEdge(st.g.edges.find(x=>x.id===b.dataset.edge),st.cur,null)});
function hint(fork){
  if(!st||st.phase!=='idle'||!st.best)return;const b=st.best;
  const at=()=>{const o=st.best;return o?secXY(o.x,o.y):[sec.clientWidth/2,sec.clientHeight/2]};
  const l=st.lv===4&&st.target&&fork?LINE.ask(st.target):fork?LINE.fork:LINE.step;
  G.start({type:'tap',at,ko:l[0],en:l[1],wait:!!fork,after:fork?5000:undefined});
}

/* ---------- walking ---------- */
let stepSnd=0;
function walk(e,n,s0,s1,o={}){
  return new Promise(res=>{
    const t=L.tok,[pts,cum]=polyFrom(e,n),fwd=e.a===n.id,len=e.len;let s=s0,last=performance.now(),acc=0,tgt=s1,doorOpened=false;
    const T=o.trace;
    const frame=now=>{
      if(!L.ok(t))return;
      const dt=Math.min(.05,(now-last)/1000);last=now;
      let sp=(o.speed||SPEED());
      if(T){if(T.down){T.t=Math.min(Math.max(T.t,T.s)+CREEP*len*dt,s1);tgt=T.t;sp=Math.min(sp,Math.max(90,MAXSP*len))}else tgt=s1}
      const d=tgt-s;s+=Math.sign(d)*Math.min(Math.abs(d),sp*dt);
      acc+=Math.abs(sp*dt);const hop=Math.round(W*.34);const bob=-Math.abs(Math.sin(Math.PI*acc/hop))*7;
      if(Math.floor((acc+sp*dt)/hop)!==Math.floor(acc/hop)&&d!==0){tone(392+((acc/hop|0)%3)*40,.05,'sine',.05)}
      const p=posAt(pts,cum,s);setToto(p.x,p.y,p.dx,Math.abs(d)<.5?0:bob);
      /* carrots on this lane are picked up when passed */
      if(o.carrots)e.carrots.forEach(c=>{if(c.got)return;const sa=fwd?s:len-s;if(Math.abs(sa-c.s)<=LW*.4)pickCarrot(c)});
      if(e.doorS!=null&&st.hasKey&&!doorOpened&&(fwd?s:len-s)>=e.doorS-LW*1.1){doorOpened=true;openDoor()}
      if(Math.abs(s1-s)<.6&&Math.abs(tgt-s)<.6){setToto(p.x,p.y,p.dx,0);res();return}
      requestAnimationFrame(frame)};
    requestAnimationFrame(frame);
  });
}
const wait=ms=>new Promise(r=>L.later(r,ms));
function fly(html,x,y,dx,dy,ms){const f=document.createElement('div');f.className='mz-fx';f.style.left=x+'px';f.style.top=y+'px';f.innerHTML=html;stage.appendChild(f);L.onEnd(()=>f.remove());
  const a=f.animate([{transform:'translate(0,0) scale(.4)',opacity:0},{transform:'translate(0,0) scale(1.1)',opacity:1,offset:.25},{transform:`translate(${dx}px,${dy}px) scale(.7)`,opacity:0}],{duration:ms,easing:'ease-out',fill:'forwards'});a.onfinish=()=>f.remove()}
const TW=(c)=>`<svg viewBox="-12 -12 24 24">${A.twinkle(0,0,10,c)}</svg>`,HEART=c=>`<svg viewBox="0 0 24 24"><path d="M12 21C-4 10 4 1 12 7C20 1 28 10 12 21Z" fill="${c}" stroke="#5B3A29" stroke-width="1.4"/></svg>`;
function celebrate(x,y){
  const n=CEL.pieces||6;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.5;L.later(()=>fly(i%2?HEART('#E8A0AE'):TW('#F0D58A'),x+(i-(n-1)/2)*22,y-30,Math.cos(a)*30,-70-(i%3)*18,CEL.durationMs||1200),i*70)}
}
function pickCarrot(c){
  c.got=true;st.carrots++;LOG.push('pick:carrot');sfx.pop();
  const g=scene.querySelector('#mz-'+c.id);if(g){const a=g.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-36px)'}],{duration:450,fill:'forwards'});a.onfinish=()=>g.remove()}
  renderTray();const cd=tray.querySelector('.mz-card');if(cd){cd.classList.add('pop')}
  say(LINE.carrot[0],LINE.carrot[1]);
}
function openDoor(){const d=scene.querySelector('#mz-door');if(d)d.classList.add('mz-open');sfx.soft();LOG.push('door:open');say(LINE.open[0],LINE.open[1],true)}
const tPlay=(n,o)=>{if(totoAl&&totoAl.play(n,o))LOG.push('play:'+n)};
const tMood=m=>{if(totoAl)totoAl.setMood(m)};

async function goEdge(e,n,trace){
  if(!st||st.busy||st.phase!=='idle')return;
  st.busy=true;const t=L.tok;G.stop();feetEl.innerHTML='';
  const o=other(e,n);let s1=e.len,mode='ok';
  if(e.w){s1=e.stopS;mode='wrong'}
  else if(e.doorS!=null&&!st.hasKey){s1=Math.max(8,e.doorS-LW*.85);mode='locked'}
  else if(o.goal)s1=Math.max(0,e.len-(LV[st.lv].gk==='friend'?LW*1.05:LW*.2));
  LOG.push('walk:'+e.id+':'+mode);
  await walk(e,n,0,s1,{carrots:true,trace});
  if(!L.ok(t))return;
  if(mode==='wrong'){await wrongFlow(e,n,s1);return}
  if(mode==='locked'){await lockedFlow(e,n,s1);return}
  await arrive(o,e);
}
async function wrongFlow(e,n,s1){
  const t=L.tok;st.tried.add(e.id);LOG.push('wrong:'+(e.reason||'end'));
  tPlay('oops');tMood('sad');if(totoAl)totoAl.sound('wow');
  if(st.lv===4&&e.fruit&&st.target){const a=LINE.askNo(st.target);say(a[0],a[1])}
  else{const r=LINE[e.reason||'end'];say(r[0],r[1]);L.later(()=>{if(st.phase==='idle'||st.busy)say(LINE.notThis[0],LINE.notThis[1],true)},1100)}
  await wait(1500);if(!L.ok(t))return;
  tMood('');LOG.push('back');
  await walk(e,n,s1,0,{speed:SPEED()*1.1});
  if(!L.ok(t))return;
  st.busy=false;st.cur=n;st.phase='idle';showFeet();hint(true);
}
async function lockedFlow(e,n,s1){
  const t=L.tok;LOG.push('locked');tPlay('oops');say(LINE.locked[0],LINE.locked[1]);
  await wait(1700);if(!L.ok(t))return;
  await walk(e,n,s1,0,{speed:SPEED()*1.1});if(!L.ok(t))return;
  /* back to the lane where the key lies, by themselves */
  const kn=Object.values(st.g.nodes).find(x=>x.key),kp=st.g.nodes[kn.parent];
  const chain=[];let c=n;while(c&&c.id!==kp.id){chain.push(c);c=st.g.nodes[c.parent]}
  let at=n;
  for(const x of chain){const pe=at.pe;await walk(pe,at,0,pe.len,{speed:SPEED()*1.15});if(!L.ok(t))return;at=st.g.nodes[at.parent]}
  st.cur=kp;st.busy=false;st.phase='idle';say(LINE.keyHere[0],LINE.keyHere[1]);showFeet();hint(true);
}
async function arrive(n,e){
  const t=L.tok;st.cur=n;LOG.push('at:'+n.id);
  if(n.goal){await win();return}
  if(n.key&&!st.hasKey){
    st.hasKey=true;e.done=true;LOG.push('key');sfx.ding();
    const g=scene.querySelector('#mz-key');if(g){const a=g.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-40px)'}],{duration:500,fill:'forwards'});a.onfinish=()=>g.remove()}
    renderTray();const cd=tray.querySelector('.mz-card');if(cd)cd.classList.add('pop');
    tPlay('hop');say(LINE.keyFound[0],LINE.keyFound[1]);
    await wait(1300);if(!L.ok(t))return;
    const kp=st.g.nodes[n.parent];await walk(e,n,0,e.len,{speed:SPEED()*1.1});   // the side lane ends here: back to the fork
    if(!L.ok(t))return;st.cur=kp;
    return finishStep(kp);
  }
  finishStep(n);
}
function finishStep(n){
  st.busy=false;st.phase='idle';const list=options();const fork=list.length>=2;
  if(st.lv===4&&fork){const sg=st.signs[n.id];if(sg){st.target=sg.t;renderTray();const a=LINE.ask(sg.t);say(a[0],a[1])}}
  else if(fork)say(LINE.fork[0],LINE.fork[1]);
  showFeet();hint(fork);
}
async function win(){
  const t=L.tok,def=LV[st.lv];st.phase='done';st.busy=true;st.won=true;feetEl.innerHTML='';G.stop();LOG.push('win');
  sfx.ding();tMood('happy');tPlay('hop',{n:2,wave:true});
  if(def.gk==='home'){const h=scene.querySelector('#mz-house');if(h)h.classList.add('mz-open')}
  if(friendAl){friendAl.setMood('happy');friendAl.play('wave')}
  const l=def.gk==='home'?LINE.homeWin:LINE.friendWin;say(l[0],l[1]);
  celebrate(st.tx,st.ty-chSize().h*.6);
  DATA.stars++;DATA.done=(DATA.done||0)+1;save();stars();if(PRG())PRG().clear(id);
  await wait(2000);if(!L.ok(t))return;
  if(totoAl)totoAl.sound('hehe');tPlay('clap');
  if(friendAl)friendAl.play('hop');
  await wait(Math.max(GAP,3400));if(!L.ok(t))return;
  newRound();
}

/* ---------- following the road with a finger (touch.trace) ---------- */
const local=e=>{const r=stage.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
function nearest(p){
  let best=null;(st.opts||[]).forEach(o=>{const [pts,cum]=polyFrom(o.e,st.cur),pr=project(pts,cum,p);if(!best||pr.d<best.d)best={d:pr.d,s:pr.s,o}});return best}
const REACH=()=>LW/2+NEAR*LW;
stage.addEventListener('pointerdown',e=>{
  actx();if(e.target.closest('.mz-foot'))return;if(!st||st.busy||st.phase!=='idle')return;
  const p=local(e);tr={down:true,moved:0,lx:p.x,ly:p.y,sx:p.x,sy:p.y,e:null,s:0,t:0};
});
stage.addEventListener('pointermove',e=>{
  if(!tr||!tr.down||!st)return;const p=local(e);tr.moved+=Math.hypot(p.x-tr.lx,p.y-tr.ly);tr.lx=p.x;tr.ly=p.y;
  if(!tr.e){
    if(tr.moved>=MOVE_PX&&!st.busy&&st.phase==='idle'){const b=nearest(p);if(b&&b.d<=REACH()){tr.e=b.o.e;tr.s=b.s;tr.t=0;goEdge(b.o.e,st.cur,tr)}}
  }else{const [pts,cum]=polyFrom(tr.e,st.cur),pr=project(pts,cum,p);if(pr.d<=REACH())tr.s=Math.max(tr.s,pr.s)}
});
const up=e=>{
  if(!tr)return;const T=tr;tr=null;T.down=false;
  if(T.e)return;
  if(T.moved<MOVE_PX&&st&&!st.busy&&st.phase==='idle'){const b=nearest({x:T.lx,y:T.ly});if(b&&b.d<=REACH())goEdge(b.o.e,st.cur,null);else miss()}
};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
function miss(){
  const n=performance.now();if(n-lastMiss<3500)return;lastMiss=n;
  feetEl.querySelectorAll('.mz-foot').forEach(b=>{b.classList.remove('nudge');void b.offsetWidth;b.classList.add('nudge')});G.nudge();say(LINE.cheer[0],LINE.cheer[1]);LOG.push('miss');
}

/* ---------- a round ---------- */
function clearChars(){
  if(totoAl){totoAl.detach();totoAl=null}if(friendAl){friendAl.detach();friendAl=null}
  stage.querySelectorAll('.mz-ch,.mz-hide,.mz-fx').forEach(x=>x.remove());toto=null;friendEl=null;
}
function size(){const r=stage.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height)}
function newRound(){
  L.begin();G.stop();clearChars();tr=null;
  const lv=level(),def=LV[lv];size();
  st={lv,mirror:Math.random()<.5,phase:'idle',busy:false,hasKey:false,carrots:0,tried:new Set(),reason:{},signs:{},target:null,won:false,seed:(Math.random()*997)|0,friend:pick(FRIENDS),opts:[],best:null};
  st.g=build();st.cur=st.g.start;
  /* picture signs: the forks, in the order they come */
  if(lv===4){
    const order=[];const walkT=(n)=>{const o=opts(n);if(o.length>=2)order.push(n);o.forEach(e=>{if(!e.w)walkT(other(e,n))})};walkT(st.g.start);
    order.forEach(n=>{const es=opts(n),good=es.find(e=>!e.w),bad=es.find(e=>e.w);const pool=FRUITS.slice().sort(()=>Math.random()-.5);
      const used=Object.values(st.signs).map(x=>x.t.k);const t=pool.find(f=>!used.includes(f.k))||pool[0],ot=pool.find(f=>f.k!==t.k);
      st.signs[n.id]={t,o:ot,good:good.id,bad:bad.id};good.fruit=t;bad.fruit=ot});
    st.target=order.length?st.signs[order[0].id].t:null;
  }
  drawScene();
  toto=mkChar('bunny','');totoAl=AL.attach(toto.querySelector('.mz-ani'),{kind:'bunny',follow:false});L.onEnd(()=>{if(totoAl){totoAl.detach();totoAl=null}});
  if(def.pizza){const pz=document.createElement('div');pz.className='mz-pz';pz.innerHTML=svg(D.pizza);toto.appendChild(pz)}
  if(def.gk==='friend'){
    friendEl=mkChar(st.friend.k,'fr');friendAl=AL.attach(friendEl.querySelector('.mz-ani'),{kind:st.friend.k,waiting:true});
    if(def.hide){const hb=document.createElement('div');hb.className='mz-hide';hb.innerHTML=svg(bush(100),'-60 -40 120 80');stage.appendChild(hb)}
  }
  layoutChars();renderTray();stars();
  /* enter: Toto hops in and waves (bigMoments) */
  st.phase='idle';st.busy=true;
  const t=L.tok;tPlay('hop',{n:2,wave:true});const gl=goalLine();say(gl[0],gl[1]);
  L.later(()=>{if(!st||t!==L.tok)return;st.busy=false;st.phase='idle';finishStep0()},1900);
}
function finishStep0(){
  const list=options();showFeet();hint(list.length>=2);
}
function relayout(){
  if(!st||cur()!==id)return;const t=st;size();if(!W||!H)return;
  const lv=st.lv;const keep={cur:st.cur.id};
  if(st.busy&&st.phase!=='done'){/* a walk is on: snap Toto to the stop it was walking from */}
  st.g=rebuild();st.cur=st.g.nodes[keep.cur]||st.g.start;
  drawScene();layoutChars();renderTray();showFeet();
}
/* rebuild the same maze (same mirror, reasons, signs) at the new size */
function rebuild(){
  const old=st.g,g=build();
  g.edges.forEach((e,i)=>{const o=old.edges[i];e.done=o.done;e.fruit=o.fruit;e.carrots.forEach((c,k)=>{c.got=o.carrots[k].got})});
  return g;
}
function exitAll(){L.begin();G.stop();clearChars();feetEl.innerHTML='';tr=null;st=null}
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},exit:exitAll,resize:()=>{if(st&&!st.busy)relayout()}};
window.addEventListener('resize',()=>{if(cur()===id&&st&&!st.busy)relayout()});

/* tile picture in the learning corner of the home screen */
document.querySelectorAll('.tile[data-go="maze"] .ic').forEach(ic=>{
  ic.innerHTML=`<svg viewBox="0 0 100 100" style="width:1.5em;height:1.5em;overflow:visible"><rect x="6" y="6" width="88" height="88" rx="22" fill="#DDE8CF" ${S}/><path d="M24 78H62V54H30V30H72" fill="none" stroke="#D3BC98" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 78H62V54H30V30H72" fill="none" stroke="#F6EAD3" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(74 28) scale(.3)">${D.house}</g><g transform="translate(26 74) rotate(-90)">${pawOne(0,0).replace('translate(0 0)','translate(0 0) scale(.55)')}</g></svg>`;
});

/* test hooks: set the level (1-5) from the parent settings or a test; peek at the state */
M.__mzLevel=n=>{DATA.level=Math.max(1,Math.min(5,n|0));save();if(PRG())PRG().set(id,DATA.level);return level()};
M.__mz=()=>{
  if(!st)return{lv:level(),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),tt=toto?toto.getBoundingClientRect():null;
  return{lv:st.lv,phase:st.phase,busy:st.busy,cur:st.cur.id,curXY:[st.cur.x,st.cur.y],goal:st.g.goal.id,W,H,lane:LW,laneRatio:LW/innerWidth,pitch:[st.g.px,st.g.py],
    stage:{left:r.left,top:r.top,width:r.width,height:r.height},totoXY:[st.tx,st.ty],toto:tt&&{left:tt.left,top:tt.top,width:tt.width,height:tt.height},
    carrots:st.carrots,hasKey:st.hasKey,mirror:st.mirror,target:st.target&&st.target.k,tried:[...st.tried],won:st.won,stars:DATA.stars,
    options:(st.opts||[]).map(o=>({edge:o.e.id,node:o.node.id,x:o.x,y:o.y,wrong:o.e.w,reason:o.e.reason||null,key:!!o.e.keyEdge,best:o===st.best,fruit:o.e.fruit&&o.e.fruit.k})),
    reasons:st.g.edges.filter(e=>e.w).map(e=>({edge:e.id,reason:e.reason})),
    edges:st.g.edges.map(e=>({id:e.id,a:e.a,b:e.b,w:e.w,len:e.len,pts:e.p.map(p=>[Math.round(p[0]),Math.round(p[1])])})),
    nodes:Object.values(st.g.nodes).map(n=>({id:n.id,x:n.x,y:n.y,c:n.c,r:n.r})),
    log:LOG.slice(-60)};
};
})();
