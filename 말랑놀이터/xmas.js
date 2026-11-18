/* 말랑 놀이터 · 크리스마스 집 꾸미기 (P7 7-다, 화면 id xmashouse)
   차분한 거실: 가운데 큰 초록 트리, 왼쪽에 문, 오른쪽에 창문과 벽난로. 토토(빨간 목도리)가 같이 있어요.
   단계(MLCFG.games.xmasHouse.levels, 단계 엔진 ML.Progress 'xmasHouse'): 탭 없이, 단계가 오르면 저절로 다음 꾸밈으로.
     1단계 방울: 카드 2장 중 하나 콕 → 트리의 반짝이는 자리 콕 → 방울이 달림 (3번)
     2단계 꼭대기 별(카드 2장) + 트리를 콕 할 때마다 꼬마전구가 한 줄씩 켜짐 (3줄)
     3단계 벽난로에 양말(카드 3장, 2개) + 트리 아래 선물(카드 3장, 2개)
     4단계 문에 리스(카드 2장) + 창문을 콕 할 때마다 눈이 쌓임 (3번). 가족 얼굴 액자(P4)·사진 장식(P6)은 그 단계가 생기면 여기에 더함.
   한 판 = 그 단계의 꾸밈. 아래 단계에서 달아 준 것은 그대로 남고, 그 단계의 꾸밈만 새로 함. 마지막 꾸밈을 아이가 달면 끝:
   방 불이 살짝 어두워지고 트리가 은은하게 빛나며 "메리 크리스마스!", 별 1칸. 꾸민 트리는 저장해서 다음에 그대로 보이고,
   오른쪽 아래 큰 그림 버튼 하나("새로 꾸미기")로 다시 꾸밈.
   색 규칙(calm.colorPolicy): 카드와 방은 차분한 색(hex), 달린 장식만 또렷한 색(vivid, 0.6초 동안 피어나듯).
   잘못 누르면 다그치지 않고 안내 손과 응원 한마디. 소리는 손을 댈 때만.
   숫자·문구는 MLCFG.games.xmasHouse, calm(choiceColors, colorPolicy, celebration), voice(onWrongPlace), themes.christmas.voice 에서 읽습니다.
   시험용: ML.__xmLevel(n) · ML.__xm() · ML.__xmDepth() */
(()=>{
'use strict';
const M=window.ML,A=window.ART,SHL=M&&M.Shell;if(!M||!A||!A.XMAS||!SHL||!M.Guide)return;
const X=A.XMAS,OL=A.OL,store=M.store;
const id='xmashouse',GID='xmasHouse';
const cur=()=>M.current();
const say=(ko,en,q)=>{try{M.say(ko,en,q)}catch(e){}};
const tone=(...a)=>{try{M.tone(...a)}catch(e){}};
const pop=()=>{try{M.sfx.pop()}catch(e){}};
const CF=M.CFG||window.MLCFG||{},XG=(CF.games||{}).xmasHouse||{},CALM=CF.calm||{},CP=CALM.colorPolicy||{},CEL=CALM.celebration||{},VO=CF.voice||{},XM=(CF.themes||{}).christmas||{};
const LV=XG.levels&&XG.levels.length?XG.levels:[{level:1},{level:2},{level:3},{level:4}];
const MAXLV=LV.length;
const BLOOM=CP.bloomMs||600;
const MISS=(VO.onWrongPlace&&VO.onWrongPlace.length?VO.onWrongPlace:[{ko:'여기야, 여기! 할 수 있어!',en:'Right here! You can do it!'}]).map(m=>[m.ko,m.en]);
const MERRY=XM.voice||{ko:'메리 크리스마스!',en:'Merry Christmas!'};
const COLORS={};(CALM.choiceColors||[]).forEach(c=>{COLORS[c.en]=c;COLORS[String(c.en).split(' ')[0]]=COLORS[String(c.en).split(' ')[0]]||c});
const col=en=>COLORS[en]||{ko:en,en,hex:'#E0786F',vivid:'#FF5A5F'};
/* not in config: the storage key; which colours each decoration comes in; how many of each per round; where things stand in the room (scene 300 × 400) */
const KEY='mallang_xmas';
const KIND={
  orn:{ko:'방울',en:'ornament',cards:2,pal:['red','yellow','blue','purple','pink','sky','orange']},
  star:{ko:'별',en:'star',cards:2,pal:['yellow','pink','sky']},
  stock:{ko:'양말',en:'stocking',cards:3,pal:['red','green','blue','purple','sky']},
  gift:{ko:'선물',en:'present',cards:3,pal:['pink','sky','yellow','purple','mint','orange']},
  wreath:{ko:'리스',en:'wreath',cards:2,pal:['red','pink','purple','blue']}
};
const TASKS={1:['orn','orn','orn'],2:['star','light','light','light'],3:['stock','stock','gift','gift'],4:['wreath','snow','snow','snow']};
const TREE_AT=[68,26],FIRE_AT=[200,184],WIN_AT=[207,36],DOOR_AT=[6,92];
const GIFT_AT=[[110,338],[188,340],[150,360]];
const ORN_PLAN=[[1,5,0],[2,3,0],[1,4,2],[3,5,0],[2,4,1],[0,3,5]];
const TOTO={x:0,w:84,bottom:396};
const tp=(p,at)=>[p[0]+at[0],p[1]+at[1]];
const ribbon=en=>/yellow|mint|orange/.test(en)?X.C.berry:X.C.snow;

/* ---------------- saved state ---------------- */
const emptyTree=()=>({orn:[],star:null,lights:0,stock:[],gifts:[],wreath:null,snow:0});
const fresh=()=>({tree:emptyTree(),lv:0,done:false,plan:null});
let ST=Object.assign(fresh(),store.get(KEY,{}));
const fix=()=>{if(!ST.tree||typeof ST.tree!=='object')ST.tree=emptyTree();ST.tree=Object.assign(emptyTree(),ST.tree);['orn','stock','gifts'].forEach(k=>{if(!Array.isArray(ST.tree[k]))ST.tree[k]=[]});
  const t=ST.tree;t.orn=t.orn.filter(o=>o&&X.TREE.spots[o.s]);t.stock=t.stock.filter(o=>o&&X.FIRE.hooks[o.h]);t.gifts=t.gifts.filter(o=>o&&GIFT_AT[o.g]);t.lights=Math.max(0,Math.min(3,t.lights|0));t.snow=Math.max(0,Math.min(3,t.snow|0))};
fix();
const save=()=>store.set(KEY,ST);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
if(PRG())PRG().register(GID,{max:MAXLV,name:'크리스마스 집'});
const level=()=>Math.max(1,Math.min(MAXLV,(PRG()?PRG().get(GID).level:1)|0||1));
const LOG=[];

/* ---------------- styles ---------------- */
const css=`
#${id} .xm-stage{background:${X.C.wall}}
.xm-scene{position:absolute;inset:0}
.xm-scene>svg.xm-art{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.xm-dim{opacity:0;transition:opacity 1.4s ease-in-out;pointer-events:none}
.xm-scene.night .xm-dim{opacity:.2}
.xm-glow{opacity:0;transition:opacity 1.6s ease-in-out;pointer-events:none}
.xm-scene.night .xm-glow{opacity:.9;animation:xmglow 6s ease-in-out 1.6s infinite}
@keyframes xmglow{0%,100%{opacity:.9}50%{opacity:.62}}
.xm-fire{transform-box:fill-box;transform-origin:50% 100%;animation:xmfire 4.4s ease-in-out infinite}
@keyframes xmfire{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.95)}}
.xm-item{transform-box:fill-box;transform-origin:50% 0%}
.xm-item.pop{animation:xmpop .55s cubic-bezier(.3,1.5,.5,1)}
@keyframes xmpop{0%{transform:scale(.35);opacity:.3}60%{transform:scale(1.08,.92)}100%{transform:scale(1)}}
.xm-item.wig{animation:xmwig .5s ease-in-out}
@keyframes xmwig{25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
.xm-veil{pointer-events:none;animation:xmveil ${BLOOM}ms ease-out forwards}
@keyframes xmveil{to{opacity:0}}
.xm-on{animation:xmon .8s ease-out}
@keyframes xmon{from{opacity:0}}
.xm-toto{position:absolute;z-index:5}
.xm-toto>svg{width:100%;height:auto;display:block;overflow:visible}
.xm-spot{position:absolute;width:112px;height:112px;transform:translate(-50%,-50%);border:0;border-radius:50%;padding:30px;z-index:8;
  background:radial-gradient(circle,rgba(255,243,196,.92) 0,rgba(255,243,196,.55) 42%,rgba(255,243,196,0) 70%)}
.xm-spot svg{width:100%;height:100%;display:block;animation:xmspot 2.4s ease-in-out infinite}
@keyframes xmspot{0%,100%{transform:scale(.86);opacity:.75}50%{transform:scale(1.06);opacity:1}}
.xm-spot:active{transform:translate(-50%,-50%) scale(.94)}
.xm-fx{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;pointer-events:none;z-index:9}
.xm-fx svg{width:100%;height:100%;display:block}
.xm-strip{gap:8px}
.xm-strip .xs{flex:none;width:30px;height:30px;display:grid;place-items:center;opacity:.42;transition:width .3s,height .3s,opacity .3s}
.xm-strip .xs svg{width:100%;height:100%;display:block;overflow:visible}
.xm-strip .xs.done{opacity:1}
.xm-strip .xs.on{width:42px;height:42px;opacity:1;border-radius:50%;background:var(--paper,#FFFDF9);box-shadow:0 0 0 3px #F6E3A6}
.xm-stars{flex:none;display:flex}.xm-stars .mlp-star{width:20px;height:20px}
#${id} .xm-held{width:150px;height:150px;padding:14px;border-radius:50%;background:radial-gradient(circle,#FFF6DA 0,#FFF6DA 55%,rgba(255,246,218,0) 72%)}
#${id} .xm-trayStars .mlp-star{width:40px;height:40px}
#${id} .xm-trayStars{display:flex;gap:10px;margin-right:110px}
.sh-tiles .tile[data-go="xmashouse"] .ic>svg{width:1.25em;height:1.85em}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ---------------- the screen (공통 틀: 머리줄 + 무대 + 아래 칸) ---------------- */
const S2=SHL.screen(id,{title:'크리스마스 집',place:'salon',stageClass:'xm-stage',stageId:'xmStage',trayId:'xmTray',stripClass:'xm-strip',stripId:'xmStrip',
  after:'<div class="xm-stars" id="xmStars"></div>'});
const sec=S2.sec,stage=S2.stage,tray=S2.tray,stripEl=S2.strip;
stage.innerHTML=`<div class="xm-scene" id="xmScene"><svg class="xm-art" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"></svg><div class="xm-toto" aria-label="토토"></div><div class="xm-spots"></div></div>`;
const scene=stage.querySelector('.xm-scene'),art=scene.querySelector('svg.xm-art'),totoEl=scene.querySelector('.xm-toto'),spotsEl=scene.querySelector('.xm-spots');
const starsEl=sec.querySelector('#xmStars');
const G=M.Guide.make(stage,{say});
let al=null,phase='',task='',held=null,busy=false,freshKey='',lastMiss=0,lastTap=0,lastToto=0,lastNudgeSay=0,wrong=0,lastTouch=0,maxIdle=0,said={};
let T0=0;   // life token: every round / exit bumps it so old timers do nothing
const later=(fn,ms)=>{const t=T0;setTimeout(()=>{if(t===T0&&cur()===id)fn()},ms)};

/* ---------------- geometry ---------------- */
let SW=0,SH=0,VB=[0,0,300,400];   // stage box in px; the part of the room (scene units) it shows: always the whole 300 × 400, more wall above or on the sides
function size(){
  const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  SW=w;SH=h;
  if(w/h>.75){const vw=400*w/h;VB=[150-vw/2,0,vw,400]}else{const vh=300*h/w;VB=[0,400-vh,300,vh]}
  art.setAttribute('viewBox',VB.map(v=>+v.toFixed(2)).join(' '));
  totoEl.style.left=((TOTO.x-VB[0])/VB[2]*100)+'%';totoEl.style.width=(TOTO.w/VB[2]*100)+'%';totoEl.style.bottom=((VB[1]+VB[3]-TOTO.bottom)/VB[3]*100)+'%';
  spotsEl.querySelectorAll('.xm-spot').forEach(b=>{const p=JSON.parse(b.dataset.p||'[0,0]');b.style.left=pctX(p[0]);b.style.top=pctY(p[1])});
}
const pctX=x=>((x-VB[0])/VB[2]*100)+'%',pctY=y=>((y-VB[1])/VB[3]*100)+'%';
/* scene units → px inside the stage (for the hint hand) and on the page (for tests) */
const toStage=([x,y])=>[(x-VB[0])/VB[2]*stage.clientWidth,(y-VB[1])/VB[3]*stage.clientHeight];
const toPage=([x,y])=>{const r=stage.getBoundingClientRect();return[r.left+(x-VB[0])/VB[2]*r.width,r.top+(y-VB[1])/VB[3]*r.height]};
const fromEvent=e=>{const r=stage.getBoundingClientRect();return[VB[0]+(e.clientX-r.left)/r.width*VB[2],VB[1]+(e.clientY-r.top)/r.height*VB[3]]};
function onTree([x,y]){
  const lx=x-TREE_AT[0],ly=y-TREE_AT[1];
  if(ly>=226&&ly<=282&&Math.abs(lx-80)<=36)return true;   // trunk and pot
  return X.TREE.tiers.some(([cx,top,base,hw])=>ly>=top-4&&ly<=base+8&&Math.abs(lx-cx)<=hw*Math.max(.15,(ly-top)/(base-top))+8);
}
const onWindow=([x,y])=>x>=WIN_AT[0]-6&&x<=WIN_AT[0]+X.WIN.w+6&&y>=WIN_AT[1]-6&&y<=WIN_AT[1]+X.WIN.h;
const ornAt=s=>tp(X.TREE.spots[s],TREE_AT);
const starAt=()=>tp(X.TREE.star,TREE_AT);
const hookAt=h=>tp(X.FIRE.hooks[h],FIRE_AT);
const wreathAt=()=>tp(X.DOOR.wreath,DOOR_AT);
/* the glowing spot's place for the decoration about to be hung (scene units) */
function targetOf(k){
  const P=ST.plan||{},t=ST.tree;
  if(k==='orn'){const s=(P.orn||[0,3,5])[t.orn.length%3];const p=ornAt(s);return{p,s}}
  if(k==='star')return{p:starAt()};
  if(k==='stock'){const h=(P.hook||[0,1])[t.stock.length]??0;const p=hookAt(h);return{p:[p[0]+5,p[1]+26],h}}
  if(k==='gift'){const g=(P.gift||[0,1,2])[t.gifts.length]??0;const p=GIFT_AT[g];return{p:[p[0],p[1]-18],g}}
  if(k==='wreath')return{p:wreathAt()};
  return null;
}

/* ---------------- drawing ---------------- */
const vividOf=en=>col(en).vivid,hexOf=en=>col(en).hex;
function itemG(key,html,veil,cls){
  const isNew=key===freshKey;
  return `<g class="xm-item${isNew?' pop':''}${cls?' '+cls:''}" data-k="${key}">${html}${isNew&&veil?`<g class="xm-veil">${veil}</g>`:''}</g>`;
}
function draw(){
  const t=ST.tree;let s=X.room();
  /* window and door, the wreath, the fireplace and its stockings: behind the tree */
  s+=`<g transform="translate(${WIN_AT[0]} ${WIN_AT[1]})">${itemG('snow',X.window(t.snow),'',t.snow&&freshKey==='snow'?'xm-on':'')}</g>`;
  s+=`<g transform="translate(${DOOR_AT[0]} ${DOOR_AT[1]})">${X.door()}</g>`;
  if(t.wreath){const [x,y]=wreathAt();s+=`<g transform="translate(${x} ${y})">${itemG('wreath',X.wreath(vividOf(t.wreath)),X.wreath(hexOf(t.wreath)))}</g>`}
  s+=`<g transform="translate(${FIRE_AT[0]} ${FIRE_AT[1]})">${X.fireplace()}</g>`;
  t.stock.forEach((o,i)=>{const [x,y]=hookAt(o.h);s+=`<g transform="translate(${x} ${y+2})">${itemG('stock:'+i,X.stocking(vividOf(o.c)),X.stocking(hexOf(o.c)))}</g>`});
  /* the room dims when the tree is done; a soft glow behind the tree */
  s+=`<rect class="xm-dim" x="-300" y="-400" width="900" height="800" fill="#2F3552"/><ellipse class="xm-glow" cx="148" cy="176" rx="132" ry="168" fill="url(#xmGlowG)"/>`;
  /* the tree and what hangs on it */
  let tr=X.tree();
  for(let i=0;i<t.lights;i++)tr+=`<g class="${freshKey==='light:'+i?'xm-on':''}">${X.lights(i)}</g>`;
  s+=`<g transform="translate(${TREE_AT[0]} ${TREE_AT[1]})">${tr}</g>`;
  t.orn.forEach((o,i)=>{const [x,y]=ornAt(o.s);s+=`<g transform="translate(${x} ${y})">${itemG('orn:'+i,X.ornament(vividOf(o.c)),X.ornament(hexOf(o.c)))}</g>`});
  if(t.star){const [x,y]=starAt();s+=`<g transform="translate(${x} ${y})">${itemG('star',X.star(vividOf(t.star),{halo:true}),X.star(hexOf(t.star)))}</g>`}
  t.gifts.slice().sort((a,b)=>GIFT_AT[a.g][1]-GIFT_AT[b.g][1]).forEach(o=>{const i=t.gifts.indexOf(o),[x,y]=GIFT_AT[o.g];s+=`<g transform="translate(${x} ${y})">${itemG('gift:'+i,X.gift(vividOf(o.c),ribbon(o.c)),X.gift(hexOf(o.c),ribbon(o.c)))}</g>`});
  art.innerHTML=s;
  scene.classList.toggle('night',!!ST.done);
}
function drawToto(mood){totoEl.innerHTML=A.animal('bunny',mood||'idle',{})+X.scarf}
const STEP_HEX={orn:'#E0786F',star:'#EBCB6B',stock:'#7D9BE0',gift:'#E89AAE',wreath:'#E0786F',light:'#EBCB6B'};
function strip(){
  const lv=ST.lv||level(),list=TASKS[lv]||[],n=doneCount();
  stripEl.innerHTML=list.map((k,i)=>`<span class="xs${i<n?' done':''}${i===n&&!ST.done?' on':''}" data-k="${k}">${X.card(k==='light'?'bulb':k,STEP_HEX[k]||'#E0786F')}</span>`).join('');
}
function stars(n){const pr=PRG();starsEl.innerHTML=pr?pr.stars(GID,n):''}

/* ---------------- a round ---------------- */
const tasks=()=>TASKS[ST.lv]||TASKS[1];
function doneCount(){
  const t=ST.tree;
  switch(ST.lv){case 1:return Math.min(3,t.orn.length);case 2:return(t.star?1:0)+Math.min(3,t.lights);case 3:return Math.min(2,t.stock.length)+Math.min(2,t.gifts.length);case 4:return(t.wreath?1:0)+Math.min(3,t.snow);default:return 0}
}
const pickN=(arr,n)=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,n)};
/* the decorations of the levels below stay; if they are missing (a parent moved the level, or a fresh tree), they are hung quietly first */
function fillBelow(lv){
  const t=ST.tree;
  if(lv>=2&&t.orn.length<3){const used=t.orn.map(o=>o.s);[[0,'red'],[3,'yellow'],[5,'blue'],[1,'purple'],[2,'pink'],[4,'sky']].forEach(([s,c])=>{if(t.orn.length<3&&!used.includes(s))t.orn.push({s,c})})}
  if(lv>=3){if(!t.star)t.star='yellow';t.lights=3}
  if(lv>=4){if(t.stock.length<2)t.stock=[{h:0,c:'red'},{h:1,c:'green'}];if(t.gifts.length<2)t.gifts=[{g:0,c:'pink'},{g:1,c:'sky'}]}
}
function clearFrom(lv){
  const t=ST.tree;
  if(lv<=1)t.orn=[];
  if(lv<=2){t.star=null;t.lights=0}
  if(lv<=3){t.stock=[];t.gifts=[]}
  if(lv<=4){t.wreath=null;t.snow=0}
}
function startRound(lv){
  T0++;G.stop();
  ST.lv=lv;ST.done=false;clearFrom(lv);fillBelow(lv);
  ST.plan={orn:ORN_PLAN[Math.floor(Math.random()*ORN_PLAN.length)].slice(),hook:pickN([0,1],2),gift:pickN([0,1,2],2)};
  save();freshKey='';held=null;wrong=0;maxIdle=0;lastTouch=Date.now();said={};LOG.push('round:'+lv);
  scene.classList.remove('night');
  draw();strip();stars();
  next(true);
}
function next(first){
  if(cur()!==id)return;
  busy=false;held=null;spotsEl.innerHTML='';
  const list=tasks(),i=doneCount();strip();
  if(i>=list.length){finishRound();return}
  task=list[i];
  if(KIND[task])showCards(task,first);
  else if(task==='light')askTap('light',first);
  else if(task==='snow')askTap('snow',first);
}
/* --- choose a card --- */
let lastCols={};
function showCards(k,first){
  phase='cards';const K=KIND[k];
  const used=k==='orn'?ST.tree.orn.map(o=>o.c):k==='stock'?ST.tree.stock.map(o=>o.c):k==='gift'?ST.tree.gifts.map(o=>o.c):[];
  let pool=K.pal.filter(c=>!used.includes(c)&&!(lastCols[k]||[]).includes(c));if(pool.length<K.cards)pool=K.pal.filter(c=>!used.includes(c));if(pool.length<K.cards)pool=K.pal.slice();
  const cs=pickN(pool,K.cards);lastCols[k]=cs;
  const items=cs.map(c=>{const C=col(c);return{v:c,ko:`${C.ko} ${K.ko}!`,en:`${cap(C.en)} ${K.en}!`,svg:X.card(k,C.hex,ribbon(c))}});
  tray.innerHTML='';tray.appendChild(SHL.cards(items,it=>pick(k,it.v)));
  const n=ST.tree[k==='orn'?'orn':k==='stock'?'stock':k==='gift'?'gifts':'x'];
  const again=Array.isArray(n)&&n.length>0;
  const line={orn:again?['하나 더! 어떤 방울을 달까?','One more! Which ornament?']:['토토랑 트리를 꾸며 볼까? 방울을 골라 봐!',"Let's decorate the tree with Toto! Pick an ornament!"],
    star:['트리 꼭대기에 별을 달아 볼까? 별을 골라 봐!','Shall we put a star on top? Pick a star!'],
    stock:again?['양말 하나 더!','One more stocking!']:['벽난로에 양말을 걸어 볼까? 양말을 골라 봐!','Shall we hang stockings on the fireplace? Pick one!'],
    gift:again?['선물 하나 더!','One more present!']:['트리 아래에 선물을 놓아 볼까? 선물을 골라 봐!','Shall we put presents under the tree? Pick one!'],
    wreath:['문에 리스를 걸어 볼까? 리스를 골라 봐!','Shall we hang a wreath on the door? Pick one!']}[k];
  if(line)say(line[0],line[1]);
  G.start({type:'tap',wait:true,after:5000,ko:line?line[0]:'',en:line?line[1]:'',at:()=>{const c=tray.querySelector('.sh-card');if(!c)return[stage.clientWidth/2,stage.clientHeight];const r=c.getBoundingClientRect(),s=stage.getBoundingClientRect();return[r.left-s.left+r.width/2,r.top-s.top+r.height/2]}});
}
const cap=s=>String(s).charAt(0).toUpperCase()+String(s).slice(1);
function pick(k,c){
  if(phase!=='cards'||busy)return;
  held={k,c};phase='place';LOG.push('pick:'+k+':'+c);
  if(al){al.setMood('wow');al.play('hop')}
  tray.innerHTML='';tray.appendChild(SHL.tool(X.card(k,hexOf(c),ribbon(c)),{cls:'xm-held'}));
  const tg=targetOf(k);spotsEl.innerHTML='';
  const b=document.createElement('button');b.type='button';b.className='xm-spot';b.setAttribute('aria-label','반짝이는 자리');
  b.innerHTML=`<svg viewBox="-12 -12 24 24">${A.twinkle(0,0,11,'#F2D06B')}${A.twinkle(0,0,5,'#fff')}</svg>`;
  b.dataset.p=JSON.stringify(tg.p);b.style.left=pctX(tg.p[0]);b.style.top=pctY(tg.p[1]);
  b.addEventListener('click',e=>{e.stopPropagation();hang()});
  spotsEl.appendChild(b);
  G.start({type:'tap',wait:true,after:3000,ko:'반짝이는 곳을 콕 눌러 봐!',en:'Tap the sparkly spot!',at:()=>toStage(tg.p)});
}
/* --- hang the held decoration on the glowing spot --- */
function hang(){
  if(phase!=='place'||!held||busy)return;
  busy=true;const {k,c}=held,t=ST.tree,tg=targetOf(k);
  if(k==='orn'){t.orn.push({s:tg.s,c});freshKey='orn:'+(t.orn.length-1)}
  else if(k==='star'){t.star=c;freshKey='star'}
  else if(k==='stock'){t.stock.push({h:tg.h,c});freshKey='stock:'+(t.stock.length-1)}
  else if(k==='gift'){t.gifts.push({g:tg.g,c});freshKey='gift:'+(t.gifts.length-1)}
  else if(k==='wreath'){t.wreath=c;freshKey='wreath'}
  save();held=null;phase='hung';spotsEl.innerHTML='';G.stop();LOG.push('hang:'+k+':'+c);
  pop();tone(1046,.5,'sine',.1,.06);tone(1568,.35,'sine',.05,.16);
  draw();strip();
  if(al){al.setMood('happy');al.play('hop')}
  const nice=[['예쁘다!','So pretty!'],['반짝반짝!','Sparkly!'],['우와, 멋지다!','Wow, lovely!']][doneCount()%3];
  say(nice[0],nice[1]);
  tray.innerHTML='';
  later(()=>next(),1300);
}
/* --- tap the tree (lights) or the window (snow) --- */
function askTap(k,first){
  phase=k==='light'?'tapTree':'tapWin';
  tray.innerHTML='';tray.appendChild(SHL.tool(X.card(k==='light'?'lights':'snow','#fff'),{cls:'xm-held'}));
  const n=k==='light'?ST.tree.lights:ST.tree.snow;
  if(!n){if(k==='light')say('트리를 콕 눌러 봐! 꼬마전구가 켜져요!','Tap the tree! The little lights turn on!');else say('창문을 콕 눌러 봐! 하얀 눈이 와요!','Tap the window! White snow is coming!')}
  const at=k==='light'?()=>toStage([TREE_AT[0]+80,TREE_AT[1]+150]):()=>toStage([WIN_AT[0]+42,WIN_AT[1]+46]);
  G.start({type:'tap',wait:n>0,after:n>0?4000:undefined,ko:k==='light'?'트리를 콕!':'창문을 콕!',en:k==='light'?'Tap the tree!':'Tap the window!',at});
}
function lightUp(){
  const t=ST.tree;if(t.lights>=3)return;
  t.lights++;freshKey='light:'+(t.lights-1);save();LOG.push('light:'+t.lights);G.stop();
  const f=[784,988,1175][t.lights-1]||1175;tone(f,.6,'sine',.11);tone(f*1.5,.4,'sine',.04,.08);
  draw();strip();if(al)al.play('hop');
  if(t.lights===1)say('반짝! 불이 켜졌어요!','Twinkle! The lights are on!');else if(t.lights===2)say('하나 더!','One more!');else say('반짝반짝!','Twinkle twinkle!');
  if(t.lights>=3){busy=true;phase='hung';later(()=>next(),1200)}
  else G.start({type:'tap',wait:true,after:4000,ko:'트리를 콕!',en:'Tap the tree!',at:()=>toStage([TREE_AT[0]+80,TREE_AT[1]+150])});
}
function snowOn(){
  const t=ST.tree;if(t.snow>=3)return;
  t.snow++;freshKey='snow';save();LOG.push('snow:'+t.snow);G.stop();
  [1568,1760,2093].slice(0,t.snow).forEach((f,i)=>tone(f,.3,'sine',.05,i*.09));
  draw();strip();if(al)al.play('hop');
  if(t.snow===1)say('하얀 눈!','White snow!');else if(t.snow===2)say('눈이 더 와요!','More snow!');else say('눈이 소복소복!','Snow is piling up!');
  if(t.snow>=3){busy=true;phase='hung';later(()=>next(),1200)}
  else G.start({type:'tap',wait:true,after:4000,ko:'창문을 콕!',en:'Tap the window!',at:()=>toStage([WIN_AT[0]+42,WIN_AT[1]+46])});
}
/* --- the room is done: lights dim, the tree glows, Merry Christmas, one star --- */
function finishRound(){
  phase='done';busy=true;ST.done=true;save();G.stop();spotsEl.innerHTML='';tray.innerHTML='';LOG.push('done:'+ST.lv);
  scene.classList.add('night');strip();
  [523,659,784,1046].forEach((f,i)=>tone(f,.9,'sine',.08,i*.22));
  if(al){al.setMood('happy');al.play('clap')}
  say(MERRY.ko,MERRY.en);
  celebrate();
  const pr=PRG();let R=null;
  if(pr){const idle=Math.max(maxIdle,Date.now()-lastTouch);pr.struggle(GID,{wrong,idleMs:idle});R=pr.clear(GID)}
  stars(R?R.filled-1:undefined);
  if(R)later(()=>{if(pr)pr.fillStars(starsEl,R.filled);LOG.push('star:'+R.filled)},500);
  later(()=>{if(al)al.play('dance')},2300);
  if(R&&R.up){
    const nl=Math.min(MAXLV,R.level),k=(TASKS[nl]||[])[0];
    later(()=>{const art2=k?X.card(k,STEP_HEX[k]||'#EBCB6B'):X.icon();LOG.push('levelup:'+nl);
      pr.moment(stage,{art:art2,ko:'새로운 꾸미기가 생겼어요!',en:'Something new to decorate!'},()=>{stars(0);showDone()})},2600);
  }else later(showDone,2400);
}
function celebrate(){
  const n=Math.max(1,Math.min(8,CEL.pieces||6)),dur=CEL.durationMs||1200,[cx,cy]=toStage([148,140]);
  for(let i=0;i<n;i++)later(()=>{const f=document.createElement('div');f.className='xm-fx';f.innerHTML=`<svg viewBox="-12 -12 24 24">${A.twinkle(0,0,11,i%2?'#F6E3A6':'#FFF6DA')}</svg>`;
    f.style.left=(cx+(i-(n-1)/2)*30)+'px';f.style.top=(cy+((i*37)%40))+'px';stage.appendChild(f);
    const a=f.animate([{transform:'translateY(0) scale(.4)',opacity:0},{transform:'translateY(-14px) scale(1)',opacity:1,offset:.3},{transform:'translateY(-70px) scale(.8)',opacity:0}],{duration:dur*1.6,easing:'ease-out',fill:'forwards'});
    a.onfinish=()=>f.remove()},i*120);
}
/* the finished tree: one big picture button (bottom right) to decorate anew */
const NEW_ICON=`<svg viewBox="0 0 100 100" style="overflow:visible"><path d="M82 50A32 32 0 1 1 66 22" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M82 50A32 32 0 1 1 66 22" fill="none" stroke="#A9CFA0" stroke-width="5.5" stroke-linecap="round"/><path d="M58 8L80 20L60 36Z" fill="#A9CFA0" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><g transform="translate(29 25) scale(.25)">${X.icon().replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g></svg>`;
function showDone(){
  phase='done';busy=false;tray.innerHTML='';
  const pr=PRG();if(pr){const s=document.createElement('div');s.className='xm-trayStars';s.innerHTML=pr.stars(GID);tray.appendChild(s)}
  tray.appendChild(SHL.finish(NEW_ICON,()=>{if(phase!=='done'||busy)return;LOG.push('new');startRound(level())},{ko:'새로 꾸며 볼까?',en:"Let's decorate again!",cls:'xm-new'}));
}

/* ---------------- touches on the room ---------------- */
function hitItem(p){
  const t=ST.tree,d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  for(let i=t.gifts.length-1;i>=0;i--){const [x,y]=GIFT_AT[t.gifts[i].g];if(Math.abs(p[0]-x)<=24&&p[1]<=y+2&&p[1]>=y-52)return{key:'gift:'+i,k:'gift',c:t.gifts[i].c}}
  if(t.star&&d(p,starAt())<=22)return{key:'star',k:'star',c:t.star};
  for(let i=0;i<t.orn.length;i++)if(d(p,ornAt(t.orn[i].s))<=16)return{key:'orn:'+i,k:'orn',c:t.orn[i].c};
  for(let i=0;i<t.stock.length;i++){const [x,y]=hookAt(t.stock[i].h);if(p[0]>=x-12&&p[0]<=x+22&&p[1]>=y&&p[1]<=y+58)return{key:'stock:'+i,k:'stock',c:t.stock[i].c}}
  if(t.wreath&&d(p,wreathAt())<=32)return{key:'wreath',k:'wreath',c:t.wreath};
  return null;
}
function wiggle(h){
  const g=art.querySelector(`.xm-item[data-k="${h.key}"]`);if(g){g.classList.remove('pop','wig');void g.getBBox;requestAnimationFrame(()=>g.classList.add('wig'));setTimeout(()=>g.classList.remove('wig'),600)}
  const C=col(h.c),K=KIND[h.k];if(K)say(`${C.ko} ${K.ko}!`,`${cap(C.en)} ${K.en}!`);
  tone(1318,.25,'sine',.06);
}
function miss(line){
  wrong++;LOG.push('miss');G.nudge();
  const now=Date.now();if(now-lastMiss<3000)return;lastMiss=now;
  const m=line||MISS[(wrong-1)%MISS.length];say(m[0],m[1]);
}
stage.addEventListener('pointerdown',e=>{
  if(cur()!==id)return;
  G.touch();const now=Date.now();maxIdle=Math.max(maxIdle,now-lastTouch);lastTouch=now;
  if(e.target.closest('.xm-spot')||e.target.closest('.mlp-moment'))return;
  if(e.target.closest('.xm-toto')){if(now-lastToto>1500){lastToto=now;if(al)al.play('hop');try{M.sfx.pop()}catch(er){}
    say(phase==='done'?'우리 트리 예쁘지? 메리 크리스마스!':'토토랑 같이 꾸미자!',phase==='done'?'Our tree is so pretty! Merry Christmas!':"Let's decorate together!")}return}
  const p=fromEvent(e);
  if(busy&&phase!=='done')return;
  if(phase==='tapTree'){if(onTree(p)){if(now-lastTap<450)return;lastTap=now;lightUp()}else miss([['트리를 콕 눌러 봐!','Tap the tree!'],MISS[0]][wrong%2]);return}
  if(phase==='tapWin'){if(onWindow(p)){if(now-lastTap<450)return;lastTap=now;snowOn()}else miss([['창문을 콕 눌러 봐!','Tap the window!'],MISS[0]][wrong%2]);return}
  const h=hitItem(p);
  if(phase==='place'){miss();return}
  if(h){wiggle(h);return}
  if(phase==='done'&&onTree(p)){if(now-lastNudgeSay>2500){lastNudgeSay=now;tone(1046,.4,'sine',.07);tone(1318,.4,'sine',.05,.12);say(MERRY.ko,MERRY.en)}return}
  if(phase==='cards'&&now-lastNudgeSay>4000){lastNudgeSay=now;const K=KIND[task];if(K)say(`아래에서 ${K.ko}${/[스]$/.test(K.ko)?'를':'을'} 골라 볼까?`,`Pick a ${K.en} down here!`);G.nudge()}
});
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,()=>G.release()));
window.addEventListener('resize',()=>{if(cur()===id){size();G.place()}});

/* ---------------- enter / exit ---------------- */
M.games[id]={
  enter:()=>{
    T0++;fix();size();drawToto(ST.done?'happy':'idle');
    if(M.Alive){if(al)al.detach();al=M.Alive.attach(totoEl,{kind:'bunny'})}
    requestAnimationFrame(()=>{if(cur()!==id)return;size();
      const lv=level();
      if(ST.done&&ST.lv){freshKey='';draw();strip();stars();showDone();if(al)al.play('wave');say('우리가 꾸민 크리스마스 트리예요! 메리 크리스마스!','Our Christmas tree! Merry Christmas!')}
      else if(ST.lv===lv&&doneCount()>0){freshKey='';draw();stars();if(al)al.play('hop');next(false)}
      else startRound(lv);
    });
  },
  exit:()=>{T0++;G.stop();busy=false;held=null;phase='';spotsEl.innerHTML='';stage.querySelectorAll('.xm-fx,.mlp-moment').forEach(x=>x.remove());if(al){al.detach();al=null}},
  resize:size
};
if(M.NAMES)M.NAMES[id]='크리스마스 집';

/* ---------------- test hooks ---------------- */
M.__xmLevel=n=>{const lv=Math.max(1,Math.min(MAXLV,n|0||1));if(PRG())PRG().set(GID,lv);if(cur()===id)startRound(lv);else{ST.lv=0;ST.done=false;save()}return level()};
M.__xm=()=>{
  const sp=spotsEl.querySelector('.xm-spot'),r=sp?sp.getBoundingClientRect():null;
  return{lv:ST.lv,level:level(),phase,task,busy,done:!!ST.done,held:held&&Object.assign({},held),i:doneCount(),tasks:tasks().slice(),tree:JSON.parse(JSON.stringify(ST.tree)),
    spot:r&&{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height},cards:[...tray.querySelectorAll('.sh-card')].map(b=>{const q=b.getBoundingClientRect();return{v:b.dataset.v,ko:b.getAttribute('aria-label'),x:q.left+q.width/2,y:q.top+q.height/2,w:q.width,h:q.height}}),
    newBtn:(()=>{const b=tray.querySelector('.xm-new');if(!b)return null;const q=b.getBoundingClientRect();return{x:q.left+q.width/2,y:q.top+q.height/2,w:q.width,h:q.height}})(),
    treeXY:SW?toPage([TREE_AT[0]+80,TREE_AT[1]+160]):null,winXY:SW?toPage([WIN_AT[0]+42,WIN_AT[1]+46]):null,offXY:SW?toPage([150,384]):null,
    night:scene.classList.contains('night'),scene:SW?{w:SW,h:SH}:null,toto:!!(al),log:LOG.slice(-60)};
};
M.__xmDepth=()=>LV.map((l,i)=>{const lv=i+1,steps={1:['방울 고르기(카드 2장)','반짝이는 자리에 달기 ×3','불 끄기 · 트리 빛 · 메리 크리스마스'],
  2:['별 고르기(카드 2장)','꼭대기에 달기','트리 콕 → 꼬마전구 한 줄씩 ×3','불 끄기 · 트리 빛 · 메리 크리스마스'],
  3:['양말 고르기(카드 3장)','벽난로 고리에 걸기 ×2','선물 고르기(카드 3장)','트리 아래 놓기 ×2','불 끄기 · 트리 빛 · 메리 크리스마스'],
  4:['리스 고르기(카드 2장)','문에 걸기','창문 콕 → 눈 쌓임 ×3','불 끄기 · 트리 빛 · 메리 크리스마스']}[lv]||[];
  return{level:lv,processes:steps.length,steps,hands:lv===2||lv===4?['tap','card','tap target(tree/window)']:['tap','card'],someone:!!M.Alive,choice:true,ending:'불 끄기 · 트리 빛 · 메리 크리스마스 · 저장된 트리'}});
})();
