/* 동물 미용실 — 동물 손님이 찾아오면 씻겨 주고 꾸며 줘요 (만 2세 기준)
   동작은 쓱쓱(문지르기)과 콕(누르기)뿐. 고르기는 큰 카드 3장. 엉뚱한 곳을 누르면 응원. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide)return;
const {say,sfx,tone,cheer,confetti,pick,rand,shuffle,cap,games,actx,store,CNT_KO,CNT_EN}=M;
const {life,noise,SFX}=P;
const id='petsalon',L=life(id),OL=A.OL,S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();

/* ---------- colours (many, so every visit looks different) ---------- */
const COLORS=[['분홍','pink','#FF6F91','#FFC2D2'],['빨강','red','#FF5A5F','#FFB3B5'],['주황','orange','#FF9A3C','#FFD3A6'],['노랑','yellow','#FFC93C','#FFE9A6'],
  ['초록','green','#5CC76B','#BDEBC3'],['민트','mint','#3FCFB4','#B4F0E4'],['하늘','sky blue','#5EC2FF','#C4E9FF'],['파랑','blue','#4E7BFF','#BCCBFF'],['보라','purple','#9A7BFF','#D9CCFF'],['자주','magenta','#D946B8','#F3B6E6']];
/* ---------- things to wear. Each is drawn around (0,0) and takes (colour, light colour) ---------- */
const WEAR={
  head:[
    {ko:'리본',en:'ribbon',d:(c,l)=>`<path d="M-6 6L-20 34L-2 26Z" fill="${l}" ${S}/><path d="M6 6L20 34L2 26Z" fill="${l}" ${S}/><path d="M0 0L-40 -24Q-50 0 -40 24Z" fill="${c}" ${S}/><path d="M0 0L40 -24Q50 0 40 24Z" fill="${c}" ${S}/><circle r="11" fill="${l}" ${S}/><path d="M-32 -12q6 -2 10 2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" fill="none"/>`},
    {ko:'왕관',en:'crown',d:(c,l)=>`<path d="M-36 20L-42 -18L-18 2L0 -30L18 2L42 -18L36 20Z" fill="#FFD23F" ${S}/><rect x="-37" y="14" width="74" height="13" rx="5" fill="#FFB800" ${S}/><circle cy="-30" r="6.5" fill="${c}" ${S}/><circle cx="-42" cy="-18" r="5.5" fill="${l}" ${S}/><circle cx="42" cy="-18" r="5.5" fill="${l}" ${S}/><circle cy="3" r="6" fill="${c}"/>`},
    {ko:'꽃',en:'flower',d:(c,l)=>`${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${(22*Math.cos(a)).toFixed(1)}" cy="${(22*Math.sin(a)).toFixed(1)}" r="16" fill="${c}" ${S}/>`}).join('')}<circle r="13" fill="#FFE066" ${S}/><circle cx="-4" cy="-4" r="3.5" fill="#fff" opacity=".8"/>`},
    {ko:'고깔모자',en:'party hat',d:(c,l)=>`<path d="M0 -44L30 24H-30Z" fill="${c}" ${S}/><path d="M-13 -14L17 -6M-21 4L25 14" stroke="${l}" stroke-width="7" stroke-linecap="round"/><circle cy="-46" r="10" fill="${l}" ${S}/><path d="M-34 24Q0 36 34 24" stroke="${OL}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M-34 24Q0 36 34 24" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>`},
    {ko:'별 머리핀',en:'star clip',d:(c,l)=>A.star(0,0,36,c,S)+`<circle cx="-10" cy="-8" r="4" fill="#fff" opacity=".8"/>`},
    {ko:'하트 머리핀',en:'heart clip',d:(c,l)=>`<path d="M0 30C-44 0 -38 -34 -18 -34C-8 -34 -2 -28 0 -20C2 -28 8 -34 18 -34C38 -34 44 0 0 30Z" fill="${c}" ${S}/><ellipse cx="-16" cy="-18" rx="7" ry="4.5" fill="#fff" opacity=".7" transform="rotate(-30 -16 -18)"/>`}
  ],
  neck:[
    {ko:'나비넥타이',en:'bow tie',d:(c,l)=>`<path d="M0 0L-34 -18Q-40 0 -34 18Z" fill="${c}" ${S}/><path d="M0 0L34 -18Q40 0 34 18Z" fill="${c}" ${S}/><rect x="-8" y="-9" width="16" height="18" rx="6" fill="${l}" ${S}/>`},
    {ko:'목도리',en:'scarf',d:(c,l)=>`<path d="M12 6L26 44L8 46L2 12Z" fill="${c}" ${S}/><path d="M-48 -10Q0 14 48 -10L46 8Q0 32 -46 8Z" fill="${c}" ${S}/><path d="M-30 2l4 12M-8 8l2 12M14 8l-2 12M34 0l-4 12" stroke="${l}" stroke-width="5" stroke-linecap="round"/>`},
    {ko:'목걸이',en:'necklace',d:(c,l)=>`${[-40,-28,-15,0,15,28,40].map((x,i)=>`<circle cx="${x}" cy="${(-6+14*(1-Math.pow(x/40,2))).toFixed(1)}" r="7" fill="${i%2?l:c}" ${S}/>`).join('')}<path d="M0 34C-18 22 -16 8 -8 8C-4 8 -1 11 0 14C1 11 4 8 8 8C16 8 18 22 0 34Z" fill="${c}" ${S}/>`},
    {ko:'방울 목걸이',en:'bell collar',d:(c,l)=>`<path d="M-46 -8Q0 14 46 -8L45 4Q0 26 -45 4Z" fill="${c}" ${S}/><circle cy="20" r="13" fill="#FFD23F" ${S}/><path d="M-8 22h16M0 22v8" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><circle cx="-4" cy="14" r="3" fill="#fff" opacity=".8"/>`}
  ],
  face:[
    {ko:'동그란 안경',en:'round glasses',d:(c,l)=>`<circle cx="-26" r="20" fill="rgba(255,255,255,.35)" stroke="${OL}" stroke-width="9"/><circle cx="26" r="20" fill="rgba(255,255,255,.35)" stroke="${OL}" stroke-width="9"/><path d="M-7 -2Q0 -8 7 -2" stroke="${OL}" stroke-width="9" fill="none"/><circle cx="-26" r="20" fill="none" stroke="${c}" stroke-width="4.5"/><circle cx="26" r="20" fill="none" stroke="${c}" stroke-width="4.5"/><path d="M-7 -2Q0 -8 7 -2" stroke="${c}" stroke-width="4.5" fill="none"/>`},
    {ko:'선글라스',en:'sunglasses',d:(c,l)=>`<path d="M-46 -12H-8Q-6 16 -27 16Q-46 16 -46 -12Z" fill="#4A3F6B" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M46 -12H8Q6 16 27 16Q46 16 46 -12Z" fill="#4A3F6B" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M-8 -8H8" stroke="${c}" stroke-width="5"/><path d="M-40 -6l8 10M14 -6l8 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`},
    {ko:'볼 스티커',en:'cheek stickers',card:'translate(0 -44) scale(1.7)',d:(c,l)=>`<g transform="translate(-48 26) scale(.36)"><path d="M0 30C-44 0 -38 -34 -18 -34C-8 -34 -2 -28 0 -20C2 -28 8 -34 18 -34C38 -34 44 0 0 30Z" fill="${c}" ${S}/></g><g transform="translate(48 26)">${A.star(0,0,13,c,S)}</g>`}
  ]
};
const SLOT={head:'translate(100 24) scale(.8)',neck:'translate(100 168) scale(.86)',face:'translate(100 100)'};
const ASK={head:['머리에 뭘 달아 줄까? 하나 골라 봐!','What goes on the head? Pick one!'],neck:['목에는 뭘 걸어 줄까?','What goes around the neck?'],face:['얼굴에는 뭘 해 줄까?','What goes on the face?']};
const PETS=[['bunny','토토'],['bear','보리'],['cat','모모'],['dog','콩이']];

/* ---------- little drawings ---------- */
const ICON={
  sponge:`<svg viewBox="0 0 100 100"><rect x="14" y="26" width="72" height="50" rx="16" fill="#FFD84D" ${S}/><circle cx="34" cy="44" r="5" fill="#F2B82C"/><circle cx="56" cy="38" r="4" fill="#F2B82C"/><circle cx="68" cy="56" r="6" fill="#F2B82C"/><circle cx="42" cy="62" r="4.5" fill="#F2B82C"/><circle cx="22" cy="24" r="9" fill="#fff" ${S}/><circle cx="80" cy="76" r="7" fill="#fff" ${S}/></svg>`,
  shower:`<svg viewBox="0 0 100 100"><path d="M70 10V34" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M70 10V34" stroke="#C8CDD6" stroke-width="6" stroke-linecap="round"/><path d="M22 52Q22 30 50 30Q78 30 78 52Z" fill="#9BD3F7" ${S}/><path d="M32 62l-4 14M50 62v16M68 62l4 14M41 64l-2 20M59 64l2 20" stroke="#5EC2FF" stroke-width="5" stroke-linecap="round"/></svg>`,
  dryer:`<svg viewBox="0 0 100 100"><path d="M52 52L60 90H44L40 54Z" fill="#B57CFF" ${S}/><path d="M16 24H62Q84 24 84 40Q84 56 62 56H16Z" fill="#FF8FB1" ${S}/><rect x="8" y="26" width="12" height="28" rx="4" fill="#5B4A8A" ${S}/><circle cx="62" cy="40" r="8" fill="#fff" opacity=".7"/></svg>`,
  bell:`<svg viewBox="-80 -80 160 150"><path d="M-52 40Q-48 -6 -34 -28Q-18 -50 0 -50Q18 -50 34 -28Q48 -6 52 40Z" fill="#FFC93C" ${S}/><rect x="-62" y="36" width="124" height="16" rx="8" fill="#F2A81D" ${S}/><circle cy="-56" r="9" fill="#F2A81D" ${S}/><path d="M-30 18Q-28 -10 -14 -26" stroke="#fff" stroke-width="8" opacity=".6" fill="none" stroke-linecap="round"/></svg>`,
  star:'<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#FFC93C" stroke="#5B3A29" stroke-width="1.2"/></svg>'
};
const TUB=`<svg viewBox="0 0 300 150"><ellipse cx="150" cy="142" rx="130" ry="8" fill="rgba(91,58,41,.16)"/><rect x="52" y="118" width="22" height="24" rx="8" fill="#FFD23F" ${S}/><rect x="226" y="118" width="22" height="24" rx="8" fill="#FFD23F" ${S}/>
  <path d="M22 34H278Q282 108 240 126H60Q18 108 22 34Z" fill="#FF9EBB" ${S}/><path d="M44 54Q46 96 70 110" stroke="#fff" stroke-width="9" opacity=".5" fill="none" stroke-linecap="round"/>
  <rect x="10" y="22" width="280" height="24" rx="12" fill="#FFC2D2" ${S}/>${[[40,20,13],[66,12,10],[250,18,14],[224,10,9],[150,16,11],[110,10,8],[190,12,9]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#CDE9FA" stroke-width="2"/>`).join('')}</svg>`;
const flags=['#FF8FB1','#FFD84D','#5EC2FF','#B57CFF','#6CCB5F'];
const BG=`<svg class="ps-gar" viewBox="0 0 400 70" preserveAspectRatio="none"><path d="M0 6Q200 58 400 6" fill="none" stroke="${OL}" stroke-width="2.5"/>${Array.from({length:11},(_,i)=>{const x=20+i*36,y=6+50*(1-Math.pow((x-200)/200,2));return `<path d="M${x-12} ${y}L${x+12} ${y}L${x} ${y+26}Z" fill="${flags[i%5]}" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`}).join('')}</svg>
  <svg class="ps-mirror" viewBox="0 0 200 220"><ellipse cx="100" cy="110" rx="92" ry="102" fill="#FFD23F" ${S}/><ellipse cx="100" cy="110" rx="76" ry="86" fill="#E6F6FF" ${S}/><path d="M56 62Q78 40 110 40" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>${A.twinkle(156,64,12)}${A.twinkle(44,160,9)}<g transform="translate(100 12) scale(.5)">${A.ACC.ribbon}</g></svg>
  <div class="ps-shelf"><span>${A.polish('#FF6F91')}</span><span>${A.lipstick('#B57CFF')}</span><span>${A.polish('#5EC2FF')}</span></div>
  <svg class="ps-win" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#BDE8FF" ${S}/><path d="M50 6V94M6 50H94" stroke="${OL}" stroke-width="3.5"/><circle cx="72" cy="28" r="10" fill="#FFD84D"/><path d="M14 70Q10 60 22 62Q26 52 38 58Q46 56 46 66Q46 72 38 72H20Q14 72 14 70Z" fill="#fff"/></svg>
  <div class="ps-rug"></div>`;

const css=`
#petsalon{gap:8px}
.psstars{display:flex;gap:2px;flex:none}
.psstars svg{width:20px;height:20px}
.ps-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 0 rgba(46,42,79,.1);
  background:radial-gradient(circle,rgba(255,255,255,.7) 5px,transparent 6px) 0 0/44px 44px,linear-gradient(180deg,#FFE3EF 0%,#FFEFF6 70%,#F7C6DB 70%,#F2B4CD 100%)}
.ps-gar{position:absolute;left:0;right:0;top:0;width:100%;height:13%;pointer-events:none}
.ps-mirror{position:absolute;left:50%;top:15%;width:62%;max-width:300px;transform:translateX(-50%);pointer-events:none;opacity:.95}
.ps-shelf{position:absolute;right:3%;top:16%;width:22%;display:flex;align-items:flex-end;justify-content:center;gap:2px;padding-bottom:4px;border-bottom:8px solid #C98C5C;border-radius:0 0 6px 6px;pointer-events:none}
.ps-shelf span{width:30%}.ps-shelf svg{width:100%;height:auto;display:block}
.ps-win{position:absolute;left:3%;top:16%;width:20%;pointer-events:none}
.ps-rug{position:absolute;left:50%;bottom:5%;width:78%;height:10%;transform:translateX(-50%);border-radius:50%;background:repeating-radial-gradient(circle,#FFF 0 10px,#FFD1E0 10px 20px);border:4px solid ${OL};opacity:.85;pointer-events:none}
.ps-pet{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);z-index:3;pointer-events:none}
.ps-pet .psbase svg,.ps-pet .over{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ps-pet.enter{animation:psin .9s cubic-bezier(.3,1.3,.5,1)}
@keyframes psin{from{transform:translateX(120%)}to{transform:translateX(-50%)}}
.ps-pet.leave{animation:psout .7s ease-in forwards}
@keyframes psout{to{transform:translateX(-220%)}}
.ps-pet.hop{animation:pshop .5s}
@keyframes pshop{0%,100%{transform:translateX(-50%)}40%{transform:translateX(-50%) translateY(-18px)}}
.ps-pet.callme{animation:pscall .7s ease-in-out}
@keyframes pscall{0%,100%{transform:translateX(-50%) scale(1);filter:none}50%{transform:translateX(-50%) scale(1.06);filter:drop-shadow(0 0 14px #FFC93C)}}
.ps-pet.party{animation:psparty .6s ease-in-out 3}
@keyframes psparty{0%,100%{transform:translateX(-50%) rotate(0)}25%{transform:translateX(-50%) translateY(-16px) rotate(-6deg)}75%{transform:translateX(-50%) translateY(-16px) rotate(6deg)}}
.ps-pet .pop{animation:pspop .5s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:center}
@keyframes pspop{from{opacity:0}}
.ps-tub{position:absolute;left:50%;bottom:3%;transform:translateX(-50%) translateY(130%);z-index:4;pointer-events:none;transition:transform .7s cubic-bezier(.3,1.2,.5,1)}
.ps-tub.on{transform:translateX(-50%)}
.ps-tub svg{width:100%;height:auto;display:block}
.ps-tool{position:absolute;left:0;top:0;width:84px;height:84px;z-index:6;pointer-events:none;transform:translate(-50%,-60%);display:none;filter:drop-shadow(0 4px 2px rgba(46,42,79,.25))}
.ps-fx{position:absolute;z-index:5;pointer-events:none;opacity:0;transition:opacity .2s}
.ps-fx.on{opacity:1}
.ps-fx svg{width:100%;height:auto;display:block}
.ps-fx.shower{left:50%;top:6%;width:34%;transform:translateX(-50%)}
.ps-fx.shower i{position:absolute;left:10%;right:10%;top:62%;height:46vh;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(94,194,255,.85) 9px 14px,transparent 14px 22px);-webkit-mask:linear-gradient(180deg,#000,transparent);mask:linear-gradient(180deg,#000,transparent);animation:psrain .25s linear infinite}
@keyframes psrain{to{background-position:0 0,0 30px;transform:translateY(8px)}}
.ps-fx.dryer{right:1%;top:30%;width:30%;transform:scaleX(-1)}
.ps-fx.dryer i{position:absolute;right:96%;top:22%;width:120%;height:36%;background:repeating-linear-gradient(180deg,transparent 0 8px,rgba(255,255,255,.95) 8px 12px,transparent 12px 20px);-webkit-mask:linear-gradient(270deg,#000,transparent);mask:linear-gradient(270deg,#000,transparent);animation:pswind .2s linear infinite}
@keyframes pswind{to{transform:translateX(-10px)}}
.ps-heart{position:absolute;z-index:6;pointer-events:none;width:34px;animation:foamup 1.4s ease-out forwards}
.ps-panel{flex:none;height:136px;display:flex;gap:10px;align-items:center;justify-content:center;padding:6px 0}
.ps-panel .pzmeter{background:rgba(255,255,255,.75);border-radius:28px;padding:12px 10px;box-shadow:inset 0 4px 0 #fff,0 5px 0 rgba(46,42,79,.08)}
.ps-card{flex:1;min-width:0;height:124px;border-radius:28px;border:0;padding:8px;background:radial-gradient(circle at 35% 20%,#fff,#FFF0F6);display:grid;place-items:center;
  box-shadow:inset 0 -6px 0 rgba(46,42,79,.08),0 7px 0 rgba(46,42,79,.16),0 12px 16px rgba(46,42,79,.12);transition:transform .15s}
.ps-card svg{width:100%;height:100%;display:block;pointer-events:none}
.ps-card:active{transform:translateY(5px)}
.ps-card.picked{transform:translateY(-10px) scale(1.06);box-shadow:0 0 0 5px #FF6F91,0 12px 16px rgba(46,42,79,.12)}
.ps-card.dim{opacity:.35}
.ps-card.one{flex:none;width:150px;animation:pulse 1.3s ease-in-out infinite}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar"><button class="round" data-go="home" aria-label="처음으로">🏠</button><h2>동물 미용실</h2><div class="psstars" id="psStars"></div></div>
<div class="ps-stage" id="psStage">${BG}<div class="ps-pet" id="psPet"><div class="psbase"></div><svg class="over" viewBox="0 0 200 230"></svg></div>
<div class="ps-tub" id="psTub">${TUB}</div><div class="ps-fx shower" id="psShower">${ICON.shower}<i></i></div><div class="ps-fx dryer" id="psDryer">${ICON.dryer}<i></i></div><div class="ps-tool" id="psTool"></div></div>
<div class="ps-panel" id="psPanel"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='동물 미용실';
const $=s=>sec.querySelector(s);
const stage=$('#psStage'),petEl=$('#psPet'),baseEl=petEl.querySelector('.psbase'),overEl=petEl.querySelector('.over'),tub=$('#psTub'),panel=$('#psPanel'),tool=$('#psTool');
const G=M.Guide.make(sec,{say});
const DATA=Object.assign({served:0},store.get('mallang_salon',{}));
let pet=null,st=null,phase='',mood='idle',raf=0,lastMiss=0,misses=0;

/* ---------- drawing ---------- */
const MUD=[[62,152,16],[134,64,13],[150,196,15],[66,204,12],[112,130,10],[44,96,11],[152,150,12]];
const FOAM=[[60,62],[102,40],[142,62],[40,112],[160,112],[70,162],[132,162],[100,192],[52,200],[150,200],[100,112],[100,152]];
const DROPS=[[50,72],[150,82],[70,142],[132,152],[100,58],[40,182],[160,182]];
function drawOver(popSlot){
  let s='';
  if(st.dirt>.02)MUD.forEach(([x,y,r],i)=>{s+=`<path d="${A.blob(x,y,r,.5,7,i+11)}" fill="#8A5A36" opacity="${(st.dirt*.9).toFixed(2)}"/>`});
  ['neck','face','head'].forEach(k=>{const w=st.wear[k];if(w)s+=`<g transform="${SLOT[k]}"><g class="${popSlot===k?'pop':''}">${w.item.d(w.col[2],w.col[3])}</g></g>`});
  const nf=Math.round(st.foam*FOAM.length);
  for(let i=0;i<nf;i++){const [x,y]=FOAM[i];s+=`<g fill="#fff" stroke="#CDE9FA" stroke-width="2"><circle cx="${x}" cy="${y}" r="15"/><circle cx="${x+13}" cy="${y+8}" r="10"/><circle cx="${x-11}" cy="${y+9}" r="8"/></g><circle cx="${x-5}" cy="${y-5}" r="3.5" fill="#E8F6FF"/>`}
  const nd=Math.round(st.wet*DROPS.length);
  for(let i=0;i<nd;i++){const [x,y]=DROPS[i];s+=`<path d="M${x} ${y-9}Q${x+8} ${y+3} ${x} ${y+7}Q${x-8} ${y+3} ${x} ${y-9}Z" fill="#7CC8F7" stroke="#4BA8E0" stroke-width="1.5"/>`}
  if(st.fluff)s+=A.twinkle(34,60,10,'#FFE066')+A.twinkle(170,84,9,'#FFE066')+A.twinkle(160,190,8,'#fff')+A.twinkle(36,170,8,'#fff');
  overEl.innerHTML=s;
}
function drawPet(m,extra){mood=m||mood;baseEl.innerHTML=A.animal(pet[0],mood,Object.assign({lash:true},extra||{}))}
function rd(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawOver()})}
function size(){const r=stage.getBoundingClientRect();const w=Math.round(Math.max(150,Math.min(r.width*.74,r.height*.66*200/230)));petEl.style.width=w+'px';petEl.style.height=Math.round(w*230/200)+'px';tub.style.width=Math.round(w*1.28)+'px'}
function stars(){$('#psStars').innerHTML=Array.from({length:Math.min(8,DATA.served)},()=>ICON.star).join('')}
function meter(icon){panel.innerHTML=`<div class="pzmeter"><span class="mi">${icon}</span><div class="mbar"><i></i></div><span class="mstar">${ICON.star}</span></div>`}
function prog(p){p=Math.max(0,Math.min(1,p));const b=panel.querySelector('.mbar i');if(b)b.style.width=(p*100)+'%';const s=panel.querySelector('.mstar');if(s)s.classList.toggle('full',p>=1)}
function anim(cls){petEl.classList.remove('enter','hop','callme','party','leave');void petEl.offsetWidth;petEl.classList.add(cls)}
function hearts(){const r=petEl.getBoundingClientRect(),sr=stage.getBoundingClientRect();for(let k=0;k<6;k++){const h=document.createElement('div');h.className='ps-heart';h.innerHTML=`<svg viewBox="-50 -40 100 80">${k%2?A.ACC.heart:A.star(0,0,30,'#FFD84D',S)}</svg>`;
  h.style.left=(r.left-sr.left+r.width*(.1+.16*k))+'px';h.style.top=(r.top-sr.top+r.height*.2)+'px';h.style.animationDelay=(k*.09)+'s';stage.appendChild(h);setTimeout(()=>h.remove(),1700)}}
const petXY=(fx,fy)=>{const r=petEl.getBoundingClientRect(),sr=sec.getBoundingClientRect();return[r.left-sr.left+r.width*fx,r.top-sr.top+r.height*fy]};
const inPet=e=>{const r=petEl.getBoundingClientRect(),px=r.width*.12,py=r.height*.06;return e.clientX>r.left-px&&e.clientX<r.right+px&&e.clientY>r.top-py&&e.clientY<r.bottom+py};
const MISS=[['여기야, 여기! 할 수 있어!','Right here! You can do it!'],['괜찮아! 손이 가리키는 곳을 눌러 봐!','It is okay! Tap where the hand points!'],['잘하고 있어! 여기를 눌러 봐!','You are doing great! Tap here!']];
function miss(){misses++;G.nudge();if(phase==='foam'||phase==='rinse'||phase==='dry')anim('callme');const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}

/* ---------- touch: the pet is the one big target while washing ---------- */
let rub=null,H={};
stage.addEventListener('pointerdown',e=>{
  e.preventDefault();actx();
  if(!H.tap&&!H.rub)return;
  if(!inPet(e)){miss();return}
  G.touch();
  if(H.rub){try{stage.setPointerCapture(e.pointerId)}catch(_){}rub={id:e.pointerId,x:e.clientX,y:e.clientY};moveTool(e)}
  if(H.tap)H.tap();
});
stage.addEventListener('pointermove',e=>{if(!rub||rub.id!==e.pointerId||!H.rub)return;const d=Math.hypot(e.clientX-rub.x,e.clientY-rub.y);rub.x=e.clientX;rub.y=e.clientY;moveTool(e);if(d>.5)H.rub(Math.min(d,60))});
const endRub=e=>{if(rub&&rub.id===e.pointerId){rub=null;tool.style.display='none'}G.release()};
stage.addEventListener('pointerup',endRub);stage.addEventListener('pointercancel',endRub);stage.addEventListener('lostpointercapture',endRub);
function moveTool(e){const r=stage.getBoundingClientRect();tool.style.display='block';tool.style.left=(e.clientX-r.left)+'px';tool.style.top=(e.clientY-r.top)+'px'}

/* ---------- the visit ---------- */
function newCustomer(){
  L.begin();H={};rub=null;G.stop();phase='enter';panel.innerHTML='';tool.style.display='none';tub.classList.remove('on');$('#psShower').classList.remove('on');$('#psDryer').classList.remove('on');
  pet=pick(PETS.filter(p=>!pet||p[0]!==pet[0]));st={dirt:1,foam:0,wet:0,fluff:false,wear:{}};
  size();drawPet('idle',{wave:true});drawOver();stars();anim('enter');
  L.later(()=>{say(`안녕! 나는 ${pet[1]}야. 진흙에서 놀았어. 깨끗하게 씻겨 줄래?`,`Hi! I'm ${pet[1]}. I played in the mud. Can you wash me?`)},500);
  L.later(()=>{drawPet('idle');tub.classList.add('on');noise(.4,{type:'lowpass',freq:900,vol:.2})},3000);
  L.later(foam,3900);
}
function foam(){
  phase='foam';meter(ICON.sponge);tool.innerHTML=ICON.sponge;say('쓱쓱 문질러서 거품을 내 줘!','Rub rub to make bubbles!');
  const NEED=stage.clientWidth*4.2;let dist=0,qk=0,fin=false,lastS=0;
  H={rub:d=>{if(fin)return;dist+=d;const p=Math.min(1,dist/NEED);st.foam=p;st.dirt=1-p;prog(p);rd();
    const n=performance.now();if(n-lastS>130){lastS=n;SFX.scrub();if(Math.random()<.4)tone(700+rand(700),.05,'sine',.08)}
    const k=Math.floor(p*3);if(k>qk){qk=k;if(k<3)say('뽀글뽀글!','Bubble bubble!')}
    if(p>=1){fin=true;H={};rub=null;tool.style.display='none';G.stop();drawPet('happy');drawOver();SFX.sparkle();say('거품이 뽀글뽀글! 잘했어!','So many bubbles! Great!');L.later(()=>{drawPet('idle');rinse()},1500)}}};
  G.start({type:'scrub',at:()=>petXY(.5,.5),ko:'손가락으로 쓱쓱 문질러 봐!',en:'Rub with your finger!'});
}
function tapStep(o){
  let k=0,lock=false;const N=3;
  H={tap:()=>{if(lock||k>=N)return;lock=true;k++;o.fx.classList.add('on');o.sound();o.each(k/N);prog(k/N);rd();say(CNT_KO[k-1]+'!',cap(CNT_EN[k-1])+'!');anim('hop');
    L.later(()=>{o.fx.classList.remove('on');if(k>=N){H={};G.stop();o.done()}else lock=false},1200)}};
  G.start({type:'tap',at:()=>petXY(.5,.42),ko:o.ko,en:o.en});
}
function rinse(){
  phase='rinse';meter(ICON.shower);say('콕콕 눌러서 물을 뿌려 줘!','Tap tap to rinse!');
  tapStep({fx:$('#psShower'),ko:'콕 눌러서 물을 뿌려 봐!',en:'Tap to spray water!',sound:()=>{noise(1.1,{type:'highpass',freq:2200,vol:.14});SFX.splash()},
    each:p=>{st.foam=1-p;st.wet=1},done:()=>{drawPet('happy');say('깨끗해졌다!','All clean!');L.later(()=>{drawPet('idle');dry()},1300)}});
}
function dry(){
  phase='dry';meter(ICON.dryer);say('이번엔 윙~ 콕콕 눌러서 말려 줘!','Now tap tap to blow dry!');
  tapStep({fx:$('#psDryer'),ko:'콕 눌러서 말려 봐!',en:'Tap to dry!',sound:()=>noise(1.1,{type:'bandpass',freq:700,q:.5,vol:.22}),
    each:p=>{st.wet=1-p;if(p>=1)st.fluff=true},done:()=>{drawPet('happy');SFX.sparkle();say('보송보송! 이제 예쁘게 꾸며 줘!','So fluffy! Now make me pretty!');tub.classList.remove('on');L.later(()=>{drawPet('idle');choose('head')},1700)}});
}
function choose(slot){
  phase=slot;H={};const items=shuffle(WEAR[slot].slice()).slice(0,3),cols=shuffle(COLORS.slice()).slice(0,3);let picked=false;
  panel.innerHTML='';say(ASK[slot][0],ASK[slot][1]);
  items.forEach((it,i)=>{const col=cols[i],b=document.createElement('button');b.className='ps-card';b.setAttribute('aria-label',`${col[0]} ${it.ko}`);
    b.innerHTML=`<svg viewBox="-58 -56 116 112"><g transform="${it.card||''}">${it.d(col[2],col[3])}</g></svg>`;
    b.addEventListener('pointerdown',e=>{e.preventDefault();actx();if(picked)return;picked=true;G.touch();G.stop();
      panel.querySelectorAll('.ps-card').forEach(x=>x.classList.add(x===b?'picked':'dim'));
      st.wear[slot]={item:it,col};drawPet('happy');drawOver(slot);anim('hop');sfx.pop();SFX.sparkle();say(`${col[0]} ${it.ko}!`,`${cap(col[1])} ${it.en}!`);
      L.later(()=>{drawPet('idle');const nx={head:'neck',neck:'face'}[slot];nx?choose(nx):finish()},1700)});
    panel.appendChild(b)});
  G.start({type:'tap',at:()=>{const c=panel.querySelectorAll('.ps-card')[1],r=c.getBoundingClientRect(),sr=sec.getBoundingClientRect();return[r.left-sr.left+r.width/2,r.top-sr.top+r.height/2]},ko:'마음에 드는 걸 하나 콕 눌러 봐!',en:'Tap the one you like!'});
}
function finish(){
  phase='done';H={};panel.innerHTML='';drawPet('wow');anim('party');confetti(22);hearts();DATA.served++;store.set('mallang_salon',DATA);stars();
  cheer(`우와, 정말 예뻐! 고마워!`,'Wow, so pretty! Thank you!');
  L.later(()=>{drawPet('happy',{wave:true});hearts()},1900);
  L.later(()=>{let called=false;const b=document.createElement('button');b.className='ps-card one';b.setAttribute('aria-label','다음 손님');b.innerHTML=ICON.bell;
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(called)return;called=true;G.touch();G.stop();tone(1318,.5,'sine',.22);tone(1046,.7,'sine',.22,.35);anim('leave');say('안녕, 또 올게!','Bye bye! See you again!');L.later(newCustomer,1100)});
    panel.appendChild(b);say('딩동 벨을 눌러서 다음 손님을 불러요!','Ring the bell for the next friend!');
    G.start({type:'tap',at:()=>{const r=b.getBoundingClientRect(),sr=sec.getBoundingClientRect();return[r.left-sr.left+r.width/2,r.top-sr.top+r.height/2]},ko:'노란 벨을 콕 눌러 봐!',en:'Tap the yellow bell!'})},4300);
}
/* a touch on the stage while choosing is a miss: cheer and point at the cards */
stage.addEventListener('pointerdown',()=>{if(panel.querySelector('.ps-card:not(.dim):not(.picked)'))miss()});

M.__ps=()=>({phase,misses,bar:(panel.querySelector('.mbar i')||{style:{}}).style.width,wear:st?Object.keys(st.wear):[],served:DATA.served,guide:G.state()});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newCustomer()})},exit:()=>{L.begin();H={};rub=null;G.stop()},resize:size};

/* tile icon in the salon building */
document.querySelectorAll('.tile[data-go="petsalon"] .ic').forEach(ic=>{ic.innerHTML=A.animal('cat','happy',{bow:'#FF6F91'});const s=ic.querySelector('svg');if(s){s.style.width='1.5em';s.style.height='1.6em'}});
})();
