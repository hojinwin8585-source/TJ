/* 말랑 놀이터 · 내 방 (P9 home.mySpace) + 당근 바구니 (progress.rewards)
   - 빈 방 그림에서 시작. 단계가 오르면(ml-levelup) 선물 1개가 선물 상자로 들어옴 → 상자 콕 → 방의 반짝이는 자리 콕 → 놓임(저장).
   - 사진으로 넣은 옷(칭찬 도장으로 열린 것)은 옷걸이에, 가족 얼굴 사진은 액자에 보임.
   - 한 판을 끝낼 때마다(ml-round · 예전 놀이는 ml-cheer) 당근 1개. 바구니에는 당근 그림 5개까지, 숫자 없음.
     내 방에서 바구니를 콕 하면 당근이 토토에게 날아가 냠냠(2초). 5개를 다 주면 작은 선물(스티커) 1개. 가게·잃기 없음.
   - 아래 칸: 내 방 안의 놀이(우리 가족 · 칭찬 도장 · 집안일 · 하루 일과) 그림 카드(공통 틀 Shell.cards).
   숫자는 MLCFG.progress.rewards(show, spend), home.mySpace, home.places.myroom 에서 읽습니다.
   ML.Room: state() · carrots() · takePending() · feed() · give(size, why) · todayGift() · inbox() · rounds(id) · basketSVG(n) · carrotSVG() · reset() */
(()=>{
'use strict';
const M=window.ML,A=window.ART,SHL=M&&M.Shell;if(!M||!A||!SHL)return;
const CF=M.CFG||window.MLCFG||{},PC=CF.progress||{},RW=PC.rewards||{},HOME=CF.home||{},MS=HOME.mySpace||{},PLACE=((HOME.places||{}).myroom)||{};
const PAL=(CF.calm||{}).palette||{},OL=A.OL;
const num=(s,i,d)=>{const m=String(s==null?'':s).match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const SHOW=Math.max(1,num(RW.show,0,5));          // '최대 5개까지 보임'
const FEED_GIFT=Math.max(1,num(RW.spend,1,5));    // '당근 콕 → 토토가 냠냠(2초). 5개를 다 주면 작은 선물 1개'
const YUM_MS=Math.max(500,num(RW.spend,0,2)*1000);
/* not in config: the storage key, how far apart two cheers of an old screen may each bring a carrot (an old screen cheers for each small find) */
const KEY='mallang_room',CHEER_GAP=15000;
const store=M.store,say=(ko,en,q)=>{try{M.say(ko,en,q)}catch(e){}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ---------------- saved state ---------------- */
const fresh=()=>({carrots:0,pending:0,fed:0,inbox:[],held:null,placed:{},next:{big:0,small:0},rounds:{},log:[],todayGift:''});
let ST=Object.assign(fresh(),store.get(KEY,{}));
['inbox','log'].forEach(k=>{if(!Array.isArray(ST[k]))ST[k]=[]});['placed','rounds','next'].forEach(k=>{if(!ST[k]||typeof ST[k]!=='object')ST[k]=k==='next'?{big:0,small:0}:{}});
const save=()=>store.set(KEY,ST);
const GIFT=id=>(A.GIFTS||[]).find(g=>g.id===id);
function give(size,why){
  const list=(A.GIFTS||[]).filter(g=>g.size===size);if(!list.length)return null;
  const i=(ST.next[size]|0)%list.length,g=list[i];ST.next[size]=(i+1)%list.length;
  ST.inbox.push(g.id);ST.log.unshift({id:g.id,why:why||'',d:today()});ST.log=ST.log.slice(0,60);save();
  try{document.dispatchEvent(new CustomEvent('ml-gift',{detail:{id:g.id,why}}))}catch(e){}
  if(M.current()==='zone-myroom')render();
  return g.id;
}
function addCarrot(){ST.carrots++;ST.pending++;save();if(M.current()==='zone-myroom')drawBasket()}
const countRound=k=>{if(!k)return;ST.rounds[k]=(ST.rounds[k]|0)+1};
document.addEventListener('ml-round',e=>{const d=e.detail||{};countRound(d.game);addCarrot()});
let lastCheer=0;
document.addEventListener('ml-cheer',e=>{const now=Date.now();countRound(e.detail);if(now-lastCheer<CHEER_GAP){save();return}lastCheer=now;addCarrot()});
document.addEventListener('ml-levelup',()=>give('big','level'));

/* ---------------- pictures: basket, carrot, gift box, room ---------------- */
const S=`stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const CARROT='#EDA468',LEAF=PAL.sage||'#A9CFA0';
const V=A.vol;
const lit=m=>V&&V.litAll?V.litAll(m):m;
function carrotSVG(){return `<svg viewBox="0 0 40 80" style="overflow:visible">${lit(`<path d="M20 22Q14 10 8 6M20 22Q20 8 20 2M20 22Q26 10 32 6" fill="none" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M20 22Q14 10 8 6M20 22Q20 8 20 2M20 22Q26 10 32 6" fill="none" stroke="${LEAF}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M8 26Q20 16 32 26L22 76Q20 80 18 76Z" fill="${CARROT}" ${S}/>`)}<path d="M14 36h5M17 50h5M16 62h4" stroke="${OL}" stroke-width="2" stroke-linecap="round" opacity=".35"/></svg>`}
/* where the carrots stand in the basket (in drawing order: back row first) */
const SLOTS=[[60,30,0],[38,36,-16],[82,36,16],[49,42,-6],[71,42,8]];
function basketSVG(n){
  const k=Math.max(0,Math.min(SHOW,n|0));
  const car=SLOTS.slice(0,k).map(([x,y,r],i)=>`<g class="rm-car" data-i="${i}" transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -14Q-6 -26 -12 -30M0 -14Q0 -28 0 -34M0 -14Q6 -26 12 -30" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M0 -14Q-6 -26 -12 -30M0 -14Q0 -28 0 -34M0 -14Q6 -26 12 -30" fill="none" stroke="${LEAF}" stroke-width="3" stroke-linecap="round"/><path d="M-9 -12Q0 -20 9 -12L4 26H-4Z" fill="${CARROT}" ${S}/></g>`).join('');
  return `<svg viewBox="0 0 120 110" class="rm-basket-art" data-n="${k}" style="overflow:visible">${V&&V.ground?V.ground(60,104,46,6):''}
    <path d="M24 48Q60 2 96 48" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M24 48Q60 2 96 48" fill="none" stroke="#E3C79E" stroke-width="4.5" stroke-linecap="round"/>
    ${lit(car)}${lit(`<path d="M12 50H108L98 100Q60 108 22 100Z" fill="#E3C79E" ${S}/>`)}
    <path d="M17 66H103M20 82H100M38 50L41 102M60 50V104M82 50L79 102" stroke="${OL}" stroke-width="2.2" opacity=".35"/><rect x="8" y="44" width="104" height="12" rx="6" fill="#EBD3AE" ${S}/></svg>`;
}
const BOX=`<svg viewBox="0 0 100 100" style="overflow:visible">${V&&V.ground?V.ground(50,95,36,5):''}${lit(`<rect x="16" y="44" width="68" height="48" rx="8" fill="${PAL.rose||'#E8A0AE'}" ${S}/><path d="M50 44V92" stroke="${PAL.butter||'#F0D58A'}" stroke-width="11"/>`)}
  <g class="rm-lid">${lit(`<rect x="10" y="30" width="80" height="17" rx="6" fill="#F3B7C2" ${S}/>`)}<path d="M50 30V47" stroke="${PAL.butter||'#F0D58A'}" stroke-width="11"/><rect x="10" y="30" width="80" height="17" rx="6" fill="none" ${S}/>
  ${lit(`<path d="M50 30Q30 6 25 20Q23 31 50 30Q70 6 75 20Q77 31 50 30Z" fill="${PAL.butter||'#F0D58A'}" ${S}/>`)}</g></svg>`;
/* the room: paper layers, no outline, one soft shadow each (art.papercraft) */
function roomBG(){
  const f=`<filter id="rmS" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#5B3A29" flood-opacity=".2"/></filter>`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs>${f}</defs>
    <rect width="100" height="100" fill="#F4E8E3"/><rect width="100" height="58" fill="#F1E3EA"/>
    <g filter="url(#rmS)"><rect x="0" y="40" width="100" height="18" fill="#EAD7E1"/></g>
    <g filter="url(#rmS)"><rect x="0" y="57" width="100" height="43" fill="#E6CFB4"/></g>
    <g filter="url(#rmS)"><rect x="0" y="55.5" width="100" height="3.2" fill="#F5EBDD"/></g>
    <path d="M0 72H100M0 86H100" stroke="#D9BE9E" stroke-width=".5"/><path d="M22 57.5L14 100M50 57.5V100M78 57.5L86 100" stroke="#D9BE9E" stroke-width=".4"/></svg>`;
}
const WINDOW=`<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="rmW" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#5B3A29" flood-opacity=".2"/></filter></defs>
  <g filter="url(#rmW)"><rect x="14" y="6" width="92" height="76" rx="10" fill="#FBF9F4"/></g><rect x="21" y="13" width="78" height="62" rx="6" fill="#DDEBF2"/>
  <circle cx="80" cy="30" r="8" fill="#F2DDA0"/><g fill="#FBF9F4"><circle cx="38" cy="34" r="6"/><circle cx="46" cy="31" r="8"/><circle cx="54" cy="34" r="6"/><rect x="34" y="34" width="24" height="5" rx="2.5"/></g>
  <path d="M21 60Q46 50 70 58T99 54V75H21Z" fill="#B9D3B0"/><path d="M60 13V75M21 44H99" stroke="#FBF9F4" stroke-width="3"/>
  <g filter="url(#rmW)"><path d="M8 4H34Q30 40 40 86H8Z" fill="#E9B7A6"/><path d="M112 4H86Q90 40 80 86H112Z" fill="#E9B7A6"/></g>
  <g filter="url(#rmW)"><rect x="4" y="0" width="112" height="7" rx="3.5" fill="#D9B48C"/></g></svg>`;

/* ---------------- the screen (공통 틀: 머리줄 + 무대 + 아래 칸) ---------------- */
const css=`
#zone-myroom .rm-stage{background:#F1E3EA}
.rm-bg{position:absolute;inset:0;pointer-events:none}.rm-bg svg{width:100%;height:100%;display:block}
.rm-win{position:absolute;left:50%;top:3%;width:34%;transform:translateX(-50%);pointer-events:none}.rm-win svg{width:100%;height:auto;display:block}
.rm-spot{position:absolute;width:var(--w);transform:translate(-50%,-100%);pointer-events:none;z-index:var(--z,2)}
.rm-spot.wall{transform:translate(-50%,-50%)}
.rm-spot svg{width:100%;height:auto;display:block;overflow:visible}
.rm-spot .gift-art{pointer-events:auto}
.rm-spot.pop{animation:rmpop .55s cubic-bezier(.3,1.5,.5,1)}
@keyframes rmpop{from{transform:translate(-50%,-100%) scale(.3);opacity:.2}}
.rm-spot.wall.pop{animation-name:rmpopw}@keyframes rmpopw{from{transform:translate(-50%,-50%) scale(.3);opacity:.2}}
.rm-spot.wig svg{animation:rmwig .5s ease-in-out}@keyframes rmwig{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.rm-frame{position:absolute;left:50%;top:41%;width:19%;transform:translate(-50%,-50%);z-index:2}
.rm-frame .fr{position:relative;width:100%;aspect-ratio:1.15;background:#D9B48C;border-radius:8px;padding:9%;box-shadow:0 3px 0 rgba(91,58,41,.18);display:flex;gap:4%;align-items:center;justify-content:center;border:3px solid ${OL}}
.rm-frame .fr i{flex:1;aspect-ratio:1;border-radius:50%;background:#FFF5EC center/cover no-repeat;border:2px solid ${OL};max-width:60%}
.rm-hanger{position:absolute;left:85%;top:39%;width:22%;transform:translate(-50%,-50%);z-index:2}
.rm-hanger .bar{position:relative;height:8px;border-radius:4px;background:#D9B48C;border:3px solid ${OL}}
.rm-hanger .cl{display:flex;justify-content:center;gap:4%;margin-top:-2px}
.rm-hanger .cl img{width:46%;height:auto;max-height:90px;object-fit:contain;filter:drop-shadow(0 3px 2px rgba(91,58,41,.2))}
.rm-toto{position:absolute;left:52%;bottom:7%;width:31%;transform:translateX(-50%);z-index:5}
.rm-toto svg{width:100%;height:auto;display:block;overflow:visible}
.rm-basket{position:absolute;left:76%;bottom:4%;width:118px;height:118px;transform:translateX(-50%);border:0;background:none;padding:22px 14px 6px;z-index:7;border-radius:50%}
.rm-basket svg{width:100%;height:100%;display:block}
.rm-basket:active{transform:translateX(-50%) scale(.95)}
.rm-box{position:absolute;left:4%;bottom:3%;width:116px;height:116px;border:0;background:none;padding:10px;z-index:7;border-radius:50%}
.rm-box svg{width:100%;height:100%;display:block}
.rm-box[hidden]{display:none}
.rm-box:not(.open){animation:rmbox 2.6s ease-in-out infinite}
@keyframes rmbox{0%,80%,100%{transform:rotate(0)}86%{transform:rotate(-5deg)}93%{transform:rotate(5deg)}}
.rm-box.open .rm-lid{transform:translate(0,-14px) rotate(-12deg);transform-origin:20% 100%;transition:transform .35s}
.rm-held{position:absolute;left:50%;top:26%;width:34%;transform:translate(-50%,-50%);z-index:9;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(91,58,41,.2))}
.rm-held svg{width:100%;height:auto;display:block;overflow:visible}
.rm-held.in{animation:rmheld .6s cubic-bezier(.3,1.5,.5,1)}@keyframes rmheld{from{transform:translate(-50%,40%) scale(.2);opacity:0}}
.rm-held .rm-shine{position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(circle,rgba(255,247,214,.95),rgba(255,247,214,0) 68%);z-index:-1}
.rm-glow{position:absolute;width:112px;height:112px;transform:translate(-50%,-50%);border:0;border-radius:50%;background:radial-gradient(circle,rgba(255,243,196,.9) 0,rgba(255,243,196,.55) 45%,rgba(255,243,196,0) 70%);z-index:8;padding:0}
.rm-glow::after{content:"";position:absolute;inset:20%;border-radius:50%;border:4px dashed ${PAL.butter||'#F0D58A'};animation:rmglow 2.4s ease-in-out infinite}
@keyframes rmglow{0%,100%{transform:scale(.9);opacity:.75}50%{transform:scale(1.08);opacity:1}}
.rm-fly{position:fixed;width:34px;height:68px;margin:-34px 0 0 -17px;z-index:60;pointer-events:none;transition:transform .5s cubic-bezier(.4,.1,.5,1),opacity .2s .45s}
.rm-fly svg{width:100%;height:100%;display:block}
#zone-myroom .sh-tray .sh-card{max-width:150px}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* spots: [id, x%, y%, width% of the room, 'wall'|'floor'] — floor spots: y is where the thing touches the floor */
const SPOTS=[['w1',15,14,21,'wall'],['w2',85,14,21,'wall'],['w3',15,38,21,'wall'],['w4',85,38,21,'wall'],['w5',33,41,18,'wall'],['w6',67,41,18,'wall'],
  ['f1',14,73,27,'floor'],['f2',86,73,27,'floor'],['f3',35,63,23,'floor'],['f4',66,63,23,'floor'],['f5',87,99,25,'floor']];
const MAX_GLOW=Math.max(1,num(((CF.rules||{}).sameLayoutEverywhere||{}).sizes&&CF.rules.sameLayoutEverywhere.sizes.cards,1,3)||3);   // 한 화면 선택지 3개 이하

/* the four games that live in My Room besides the gifts (home.places.myroom), as picture cards */
const icon=go=>{const t=document.querySelector(`.tile[data-go="${go}"] .ic`);const s=t&&t.querySelector('svg');return s?s.outerHTML:''};
const CARDS=[{v:'friends',ko:'우리 가족',en:'Our family',svg:SHL.art('friends')},{v:'stamps',ko:'칭찬 도장',en:'Praise stamps',svg:SHL.art('stamp')},
  {v:'chores2',ko:'집안일',en:'Chores',svg:icon('chores2')||SHL.art('broom')},{v:'routine2',ko:'하루 일과',en:'My day',svg:icon('routine2')||SHL.art('sun')}].filter(c=>document.getElementById(c.v));
const S2=SHL.screen('zone-myroom',{title:MS.ko||PLACE.ko||'내 방',kind:'place',backGo:'home',stageClass:'rm-stage',stageId:'rmStage',trayId:'rmTray'});
const stage=S2.stage,tray=S2.tray;
stage.innerHTML=`<div class="rm-bg">${roomBG()}</div><div class="rm-win">${WINDOW}</div><div class="rm-things"></div>
  <div class="rm-toto" aria-label="토토"></div><button class="rm-basket" type="button" aria-label="당근 바구니"></button><button class="rm-box" type="button" aria-label="선물 상자" hidden>${BOX}</button><div class="rm-glows"></div>`;
const things=stage.querySelector('.rm-things'),totoEl=stage.querySelector('.rm-toto'),basketBtn=stage.querySelector('.rm-basket'),boxBtn=stage.querySelector('.rm-box'),glows=stage.querySelector('.rm-glows');
tray.appendChild(SHL.cards(CARDS,it=>setTimeout(()=>M.go(it.v),250)));
if(M.NAMES)M.NAMES['zone-myroom']=MS.ko||'내 방';
const HG=M.Guide?M.Guide.make(stage):null;
let al=null,yumT=0,busy=false,lastNudge=0;

function totoSVG(mood){return A.animal('bunny',mood||'idle',{})}
function drawBasket(){basketBtn.innerHTML=basketSVG(ST.carrots)}
const blocked=()=>{const b={};if(clothes().length)b.w4=1;return b};
function clothes(){const C=(M.closet&&M.closet())||[],n=M.stamps?M.stamps():0;return C.filter(c=>c&&c.img&&(c.need|0)<=n).slice(0,2)}
function family(){const C=M.CAST||{},F=C.family||{};return[C.hero&&C.hero.photo,F.mom&&F.mom.photo,F.dad&&F.dad.photo].filter(Boolean).slice(0,3)}
function render(){
  const bl=blocked();let h='';
  SPOTS.forEach(sp=>{const id=ST.placed[sp[0]],g=id&&GIFT(id);if(!g||bl[sp[0]])return;const w=g.size==='small'?sp[3]*.8:sp[3];
    h+=`<div class="rm-spot ${sp[4]}" data-spot="${sp[0]}" data-gift="${g.id}" style="left:${sp[1]}%;top:${sp[2]}%;--w:${w}%;--z:${sp[4]==='wall'?2:3+Math.round(sp[2]/10)}">${g.svg()}</div>`});
  const fam=family();if(fam.length)h+=`<div class="rm-frame" aria-label="우리 가족 액자"><div class="fr">${fam.map(p=>`<i style="background-image:url(${p})"></i>`).join('')}</div></div>`;
  const cl=clothes();if(cl.length)h+=`<div class="rm-hanger" aria-label="내 옷"><div class="bar"></div><div class="cl">${cl.map(c=>`<img src="${c.img}" alt="">`).join('')}</div></div>`;
  things.innerHTML=h;drawBasket();
  boxBtn.hidden=!ST.inbox.length&&!ST.held;boxBtn.classList.toggle('open',!!ST.held);
  stage.querySelectorAll('.rm-held').forEach(x=>x.remove());
  if(ST.held){const g=GIFT(ST.held);if(g){const d=document.createElement('div');d.className='rm-held';d.innerHTML=`<span class="rm-shine"></span>${g.svg()}`;stage.appendChild(d)}}
  drawGlows();
}
/* up to MAX_GLOW spots of the held gift's kind glow: empty ones first; when all are full, a gift there gets swapped */
function glowSpots(){
  const g=ST.held&&GIFT(ST.held);if(!g)return[];const bl=blocked();
  const mine=SPOTS.filter(sp=>sp[4]===g.place&&!bl[sp[0]]);const empty=mine.filter(sp=>!ST.placed[sp[0]]);
  return (empty.length?empty:mine).slice(0,MAX_GLOW);
}
function drawGlows(){
  glows.innerHTML='';const list=glowSpots();
  list.forEach(sp=>{const b=document.createElement('button');b.type='button';b.className='rm-glow';b.dataset.spot=sp[0];b.setAttribute('aria-label','반짝이는 자리');
    const w=stage.clientWidth,h=stage.clientHeight,ww=sp[3]/100*w;const y=sp[4]==='wall'?sp[2]/100*h:sp[2]/100*h-ww*.45;
    b.style.left=(sp[1]/100*w)+'px';b.style.top=y+'px';b.onclick=e=>{e.stopPropagation();put(sp[0])};glows.appendChild(b)});
  if(HG){if(list.length){const b=glows.firstElementChild;HG.start({type:'tap',wait:true,after:3000,ko:'반짝이는 곳을 콕 눌러 봐!',en:'Tap the sparkly spot!',at:()=>{const r=b.getBoundingClientRect(),s=stage.getBoundingClientRect();return[r.left-s.left+r.width/2,r.top-s.top+r.height/2]}})}else HG.stop()}
}
function openBox(){
  if(ST.held){const g=GIFT(ST.held);if(g)say(`${g.ko}! 반짝이는 곳에 놓아 볼까?`,`${g.en}! Put it on a sparkly spot!`);if(HG)HG.nudge();return}
  if(!ST.inbox.length)return;
  ST.held=ST.inbox.shift();save();
  const g=GIFT(ST.held);try{M.sfx.ding()}catch(e){}
  render();const h=stage.querySelector('.rm-held');if(h)h.classList.add('in');
  if(g)say(`선물이에요! ${g.ko}! 반짝이는 곳에 놓아 볼까?`,`A present! ${g.en}! Where shall we put it?`);
}
function put(spot){
  if(!ST.held)return;const id=ST.held;ST.placed[spot]=id;ST.held=null;save();
  try{M.sfx.pop();M.tone(784,.18,'sine',.12,.08)}catch(e){}
  render();const el=things.querySelector(`[data-spot="${spot}"]`);if(el){el.classList.add('pop')}
  if(al)al.play('hop');const g=GIFT(id);say(g?`${g.ko} 예쁘다!`:'예쁘다!',g?`What a pretty ${g.en}!`:'So pretty!');
}
function feed(){
  if(busy)return null;
  if(ST.carrots<=0){say('당근은 놀이를 하면 생겨요!','Play a game to get a carrot!');if(al)al.play('wave');return null}
  busy=true;ST.carrots--;ST.fed=(ST.fed|0)+1;let gift=null;
  if(ST.fed>=FEED_GIFT){ST.fed=0;gift=give('small','carrot')}
  save();
  /* the top carrot flies from the basket to Toto's mouth (0.5 s), then Toto munches */
  const br=basketBtn.getBoundingClientRect(),tr=totoEl.getBoundingClientRect();
  const f=document.createElement('div');f.className='rm-fly';f.innerHTML=carrotSVG();f.style.left=(br.left+br.width/2)+'px';f.style.top=(br.top+br.height*.3)+'px';document.body.appendChild(f);
  drawBasket();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform=`translate(${tr.left+tr.width*.5-(br.left+br.width/2)}px,${tr.top+tr.height*.42-(br.top+br.height*.3)}px) rotate(-70deg) scale(.8)`;f.style.opacity='0'}));
  setTimeout(()=>{f.remove();busy=false;
    totoEl.innerHTML=totoSVG('yum');try{M.tone(196,.07,'square',.05);M.tone(174,.07,'square',.05,.12);M.tone(196,.07,'square',.05,.24)}catch(e){}
    say(gift?'냠냠! 맛있다! 고마워! 선물이 왔어요!':'냠냠! 맛있다!',gift?'Yum yum! Thank you! A present for you!':'Yum yum!');
    clearTimeout(yumT);yumT=setTimeout(()=>{if(M.current()==='zone-myroom')totoEl.innerHTML=totoSVG(ST.held?'wow':'idle')},YUM_MS);
    if(gift)render();
  },520);
  return{gift};
}
boxBtn.addEventListener('click',()=>{try{M.bounce(boxBtn)}catch(e){}openBox()});
basketBtn.addEventListener('click',()=>{feed()});
stage.addEventListener('pointerdown',e=>{
  if(HG)HG.touch();
  const sp=e.target.closest('.rm-spot');
  if(sp&&!ST.held){sp.classList.remove('wig');void sp.offsetWidth;sp.classList.add('wig');const g=GIFT(sp.dataset.gift);if(g)say(g.ko,g.en);return}
  if(e.target.closest('.rm-toto')&&!busy){if(al)al.play('hop');say(ST.carrots>0?'안녕! 당근 줄래?':'안녕! 내 방에 온 걸 환영해!',ST.carrots>0?'Hi! A carrot for me?':'Hi! Welcome to my room!');return}
  if(e.target.closest('.rm-frame')){say('우리 가족!','My family!');return}
  if(e.target.closest('.rm-hanger')){say('내 옷!','My clothes!');return}
  if(ST.held&&!e.target.closest('button')){const now=Date.now();if(now-lastNudge>3000){lastNudge=now;say('반짝이는 곳에 놓아 볼까?','Put it on a sparkly spot!')}if(HG)HG.nudge()}
});
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,()=>{if(HG)HG.release()}));
window.addEventListener('resize',()=>{if(M.current()==='zone-myroom')drawGlows()});

M.games['zone-myroom']={
  enter:()=>{totoEl.innerHTML=totoSVG('idle');render();if(M.Alive){al=M.Alive.attach(totoEl,{kind:'bunny'})}
    if(ST.held||ST.inbox.length)say('내 방이에요! 선물 상자가 있어요! 콕 눌러 봐!','My room! There is a present! Tap the box!');
    else if(ST.carrots>0)say('내 방이에요! 토토에게 당근을 줘 볼까?','My room! Shall we give Toto a carrot?');
    else say(`${MS.ko||'내 방'}에 왔어요!`,'Welcome to my room!')},
  exit:()=>{clearTimeout(yumT);if(al){al.detach();al=null}if(HG)HG.stop();busy=false;document.querySelectorAll('.rm-fly').forEach(x=>x.remove())}
};

M.Room={
  state:()=>JSON.parse(JSON.stringify(ST)),carrots:()=>ST.carrots,shown:()=>Math.min(SHOW,ST.carrots),
  takePending(){const n=ST.pending|0;if(n){ST.pending=0;save()}return n},
  feed,give,inbox:()=>ST.inbox.slice().concat(ST.held?[ST.held]:[]),rounds:id=>ST.rounds[id]|0,
  /* today's three plays finished: one quiet gift, once a day */
  todayGift(){const t=today();if(ST.todayGift===t)return null;ST.todayGift=t;save();return give('big','today')},
  basketSVG,carrotSVG,BOX,SHOW,FEED_GIFT,spots:SPOTS.map(s=>({id:s[0],x:s[1],y:s[2],w:s[3],kind:s[4]})),
  reset(){ST=fresh();save();if(M.current()==='zone-myroom')render()}
};
})();
