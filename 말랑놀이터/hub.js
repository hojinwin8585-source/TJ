/* 말랑 마을 — 홈을 건물 그림이 있는 마을 지도로 바꿉니다 (선택지는 줄이고 그림은 크게) */
(()=>{
'use strict';
const M=window.ML,A=window.ART;if(!M||!A)return;
const {say,games,bounce}=M;
const css=`
.home-top .mascot{width:64px;height:72px;flex:none;margin-left:-6px}
.home-top .mascot svg{width:100%;height:100%}
.zone{grid-column:span 2;border:0;border-radius:28px;padding:10px 8px 12px;display:flex;flex-direction:column;align-items:center;gap:2px;position:relative;
  background:radial-gradient(120% 80% at 30% 0%,rgba(255,255,255,.7),transparent 60%),var(--c);
  box-shadow:inset 0 3px 0 rgba(255,255,255,.7),inset 0 -7px 0 rgba(46,42,79,.1),0 7px 0 color-mix(in srgb,var(--c) 60%,var(--ink)),0 14px 18px rgba(46,42,79,.15)}
.zone:active{transform:translateY(5px) scale(.98)}
.zone svg{width:100%;max-width:190px;height:auto;aspect-ratio:200/160;filter:drop-shadow(0 4px 0 rgba(46,42,79,.12))}
.zone b{font-weight:400;font-size:clamp(18px,5vw,22px);color:var(--ink)}
.zone small{font-size:13px;color:var(--muted)}
.zone .newb{position:absolute;right:10px;top:10px;background:#FF3B6B;color:#fff;font-size:12px;border-radius:999px;padding:2px 8px;box-shadow:0 2px 0 rgba(0,0,0,.15)}
.quest-banner .qb-deco{width:44%;max-width:180px;right:4px;top:4px;opacity:1}
.quest-banner .qb-deco svg{width:100%;height:auto}
.zonegrid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;align-content:start;padding:4px 2px 18px}
.zonegrid .tile{aspect-ratio:1/.92}
.zonegrid .tile .ic{font-size:clamp(46px,14vw,70px)}
.zonegrid .tile b{font-size:clamp(17px,4.8vw,22px)}
.zonehead{display:flex;align-items:center;gap:10px}
.zonehead svg{width:70px;height:56px}
.tile .ic svg{width:1.3em;height:1.3em;display:block}
.tile .newb{position:absolute;right:8px;top:8px;background:#FF3B6B;color:#fff;font-size:12px;border-radius:999px;padding:1px 7px}
.tile{position:relative}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const ZONES=[
  {id:'zone-cook',label:'엄마 아빠 따라하기',art:'kitchen',title:'요리 마을',en:'Cooking town',c:'#FFD3DF',sub:'피자 · 빵 · 케이크 · 집안일',isNew:true},
  {id:'zone-salon',label:'꾸미기',art:'salon',title:'꾸미기 살롱',en:'Dress-up salon',c:'#EBDDFF',sub:'드레스 · 화장 · 손톱'},
  {id:'zone-job',label:'직업 놀이',art:'fire',title:'직업 마을',en:'Job town',c:'#FFD8C9',sub:'소방관 · 경찰관 · 의사'},
  {id:'zone-school',label:'배움 놀이',art:'school',title:'배움 학교',en:'School',c:'#FFF0B8',sub:'동물 · 숫자 · 모양 · 낱말'},
  {id:'zone-music',label:'소리·노래',art:'music',title:'노래 극장',en:'Music hall',c:'#CDEBFF',sub:'소리 놀이 · 노래 영상'}
];
const home=document.getElementById('home'),scroll=home.querySelector('.home-scroll');
const zoneOf={};
/* move each section's tiles into its own zone screen */
const labels=[...scroll.querySelectorAll('.section-label')];
ZONES.forEach(z=>{
  const lab=labels.find(l=>l.textContent.includes(z.label));if(!lab)return;
  const tiles=[];let n=lab.nextElementSibling;while(n&&!n.classList.contains('section-label')){if(n.classList.contains('tile'))tiles.push(n);n=n.nextElementSibling}
  const sec=document.createElement('section');sec.id=z.id;sec.className='screen';sec.hidden=true;
  sec.innerHTML=`<div class="bar"><button class="round" data-go="home" aria-label="마을로">🏠</button><div class="zonehead">${A.BUILD[z.art]}<h2>${z.title}</h2></div></div><div class="zonegrid"></div>`;
  const g=sec.querySelector('.zonegrid');tiles.forEach(t=>{g.appendChild(t);zoneOf[t.dataset.go]=z.id});
  document.getElementById('app').appendChild(sec);M.NAMES[z.id]=z.title;
  games[z.id]={enter:()=>say(`${z.title}에 왔어요! 무엇을 할까?`,`Welcome to the ${z.en}!`)};
  lab.remove();
  const card=document.createElement('button');card.className='zone';card.dataset.go=z.id;card.dataset.en=z.en;card.style.setProperty('--c',z.c);
  card.innerHTML=`${z.isNew?'<span class="newb">NEW</span>':''}${A.BUILD[z.art]}<b>${z.title}</b><small>${z.sub}</small>`;scroll.appendChild(card);
});
/* stamp tile and friends tile go first, zones after */
/* pizza tile gets a drawn icon */
document.querySelectorAll('.tile[data-go="pizza"]').forEach(t=>{t.querySelector('.ic').innerHTML=`<svg viewBox="-120 -120 240 240">${A.pizza({r:100,sauce:true,cheese:Array.from({length:24},(_,i)=>[Math.cos(i*2.4)*i*3.4,Math.sin(i*2.4)*i*3.4,i*40]),tops:[['tomato',-38,-30,0],['mushroom',34,-36,20],['pepperoni',-30,40,0],['olive',40,30,0],['pepper',4,4,0]],baked:true})}</svg>`;
  t.querySelector('b').textContent='피자가게';t.insertAdjacentHTML('beforeend','<span class="newb">NEW</span>')});
/* mascot greeting on the home header */
const mascot=document.createElement('div');mascot.className='mascot';mascot.innerHTML=A.animal('bunny','happy',{chef:true,wave:true});home.querySelector('.home-top').prepend(mascot);
mascot.addEventListener('click',()=>{bounce(mascot);M.sfx.pop();say('안녕! 나는 토토야. 같이 놀자!','Hi! I am Toto. Let\'s play!')});
/* castle drawing on the quest banner */
const he=games.home.enter;
games.home.enter=()=>{he();const d=document.querySelector('#questBanner .qb-deco');if(d)d.innerHTML=A.BUILD.castle};
games.home.enter();
/* back button inside a game returns to its zone, not all the way home */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-go="home"]');if(!b)return;const scr=b.closest('.screen');if(!scr)return;const z=zoneOf[scr.id];
  if(z){e.stopPropagation();e.preventDefault();M.sfx.pop();M.go(z)}
},true);
})();
