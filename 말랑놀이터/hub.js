/* 말랑 마을 — 홈 화면
   벤치마킹에서 가져온 것:
   · 베베핀 타운: 주인공과 함께 돌아다니는 "공간" (목록이 아니라 마을 그림)
   · 토도: 오늘 할 분량을 정해서 보여 주기 (오늘의 놀이 3개)
   · Babybus: 글 없이 그림과 말로, 영역은 5~6개만 */
(()=>{
'use strict';
const M=window.ML,A=window.ART;if(!M||!A)return;
const {say,games,bounce,sfx}=M;
const OL=A.OL,S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const css=`
.home-scroll.townmode{display:block;padding:2px 0 22px}
/* 오늘의 놀이 */
.today{display:flex;align-items:flex-end;gap:6px;margin:0 2px 14px;padding:10px 12px 12px 4px;border-radius:30px;position:relative;
  background:linear-gradient(180deg,#FFF7D6,#FFE9A8);box-shadow:inset 0 4px 0 rgba(255,255,255,.8),0 7px 0 #E2B84A,0 14px 18px rgba(46,42,79,.14)}
.today .host{flex:none;width:30%;max-width:130px;margin-bottom:-6px;border:0;background:none;padding:0}
.today .host svg{width:100%;height:auto;display:block}
.today .tb{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.today .tt{align-self:flex-start;background:#fff;border:3px solid ${OL};border-radius:18px;padding:4px 12px;font-size:clamp(16px,4.6vw,21px);position:relative}
.today .tt::before{content:"";position:absolute;left:-13px;bottom:8px;border:7px solid transparent;border-right-color:${OL}}
.today .tpath{display:flex;align-items:center;justify-content:space-between;gap:4px;position:relative;padding:0 2px}
.today .tpath::before{content:"";position:absolute;left:12%;right:12%;top:50%;border-top:5px dotted #E2B84A}
.msn{position:relative;flex:none;width:clamp(58px,18vw,76px);aspect-ratio:1;border-radius:50%;border:4px solid ${OL};background:#fff;font-size:clamp(28px,9vw,38px);line-height:1;display:grid;place-items:center;padding:0;
  box-shadow:inset 0 -5px 0 rgba(46,42,79,.1),0 5px 0 rgba(46,42,79,.18)}
.msn.done{background:#E9F8E4}
.msn.done::after{content:"";position:absolute;right:-8px;top:-8px;width:30px;height:30px;border-radius:50%;background:#6CCB5F;border:3px solid ${OL};
  background-image:linear-gradient(45deg,transparent 46%,#fff 46% 56%,transparent 56%),linear-gradient(-45deg,transparent 42%,#fff 42% 54%,transparent 54%);background-size:10px 10px,16px 16px;background-position:6px 12px,8px 6px;background-repeat:no-repeat}
.msn.next{width:clamp(74px,23vw,96px);font-size:clamp(36px,11vw,48px);background:#FFF;border-color:#FF6F91;animation:pulse 1.3s ease-in-out infinite}
.msn .go{position:absolute;left:50%;bottom:-12px;transform:translateX(-50%);background:#FF6F91;color:#fff;font-size:13px;border-radius:999px;padding:1px 10px;border:2px solid ${OL};white-space:nowrap}
.msn:active{transform:translateY(4px)}
/* 마을 */
.town{position:relative;width:100%;max-width:560px;margin:0 auto;aspect-ratio:100/264;border-radius:30px;overflow:hidden;
  background:linear-gradient(180deg,#9ADBFF 0%,#DDF4FF 8.6%,#C7EEAD 8.7%,#B2E496 100%);box-shadow:0 6px 0 rgba(46,42,79,.1)}
.town>svg.bg{position:absolute;inset:0;width:100%;height:100%}
.cloud{position:absolute;top:var(--y);left:-30%;width:26%;height:5%;pointer-events:none;animation:drift var(--t) linear infinite;animation-delay:var(--d)}
.cloud svg{width:100%;height:100%}
@keyframes drift{to{transform:translateX(520%)}}
.bld{position:absolute;transform:translate(-50%,-50%);width:var(--w,46%);border:0;background:none;padding:0;display:flex;flex-direction:column;align-items:center;z-index:2;animation:bldhop 4s ease-in-out infinite;animation-delay:var(--d,0s)}
.bld .art{width:100%;display:block;filter:drop-shadow(0 6px 0 rgba(46,42,79,.14))}
.bld .art svg{width:100%;height:auto;display:block}
.bld b{font-weight:400;font-size:clamp(15px,4.4vw,20px);color:#fff;background:#C98C5C;border:3px solid ${OL};border-radius:12px;padding:1px 12px;margin-top:-8px;box-shadow:0 4px 0 ${OL};white-space:nowrap;position:relative;z-index:1}
.bld small{font-size:clamp(12px,3.4vw,15px);color:${OL};background:rgba(255,255,255,.9);border-radius:999px;padding:0 8px;margin-top:6px;white-space:nowrap}
.bld .pal{position:absolute;width:36%;bottom:16%;z-index:2;pointer-events:none}
.bld .pal.r{right:-12%}.bld .pal.l{left:-12%}
.bld .pal svg{width:100%;height:auto;display:block}
.bld .pal .chara{--u:5.4px}
.bld:active{animation:none;transform:translate(-50%,-50%) scale(.94)}
@keyframes bldhop{0%,88%,100%{transform:translate(-50%,-50%)}94%{transform:translate(-50%,-54%)}}
.tree{position:absolute;width:9%;transform:translate(-50%,-100%);pointer-events:none;z-index:1}
.tree svg{width:100%;height:auto;display:block}
/* 건물 안 (영역 화면) */
.zonegrid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;align-content:start;padding:4px 2px 18px}
.zonegrid .tile{aspect-ratio:1/.92;position:relative}
.zonegrid .tile .ic{font-size:clamp(46px,14vw,70px)}
.zonegrid .tile b{font-size:clamp(17px,4.8vw,22px)}
.zonehead{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.zonehead svg{width:70px;height:56px;flex:none}
.tile .ic svg{width:1.3em;height:1.3em;display:block}
.tile .newb{position:absolute;right:8px;top:8px;background:#FF3B6B;color:#fff;font-size:12px;border-radius:999px;padding:1px 7px}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const ZONES=[
  {id:'zone-cook',label:'엄마 아빠 따라하기',art:'kitchen',title:'요리 마을',en:'Cooking town',pal:['bunny',{chef:true}],at:[27,68]},
  {id:'zone-salon',label:'꾸미기',art:'salon',title:'꾸미기 살롱',en:'Dress-up salon',pal:['cat',{bow:'#FF6F91'}],at:[73,94]},
  {id:'zone-job',label:'직업 놀이',art:'fire',title:'직업 마을',en:'Job town',pal:['dog',{}],at:[27,120]},
  {id:'zone-school',label:'배움 놀이',art:'school',title:'배움 학교',en:'School',pal:['bear',{}],at:[73,146]},
  {id:'zone-music',label:'소리·노래',art:'music',title:'노래 극장',en:'Music hall',pal:['bunny',{bow:'#9A7BFF'}],at:[27,172]}
];
const home=document.getElementById('home'),scroll=home.querySelector('.home-scroll');
const zoneOf={};
/* move each section's tiles into its own building screen */
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
});
document.querySelectorAll('.tile[data-go="pizza"]').forEach(t=>{t.querySelector('.ic').innerHTML=`<svg viewBox="-120 -120 240 240">${A.pizza({r:100,sauce:true,cheese:Array.from({length:24},(_,i)=>[Math.cos(i*2.4)*i*3.4,Math.sin(i*2.4)*i*3.4,i*40]),tops:[['tomato',-38,-30,0],['mushroom',34,-36,20],['pepperoni',-30,40,0],['olive',40,30,0],['pepper',4,4,0]],baked:true})}</svg>`;
  t.querySelector('b').textContent='피자가게';t.insertAdjacentHTML('beforeend','<span class="newb">NEW</span>')});

/* the old list-style tiles stay in the page (other code updates them) but are hidden */
['questBanner','friendsTile','stampTile'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true});
scroll.classList.add('townmode');
const todayEl=document.createElement('div');todayEl.className='today';scroll.appendChild(todayEl);
const town=document.createElement('div');town.className='town';scroll.appendChild(town);

const CLOUD=`<svg viewBox="0 0 100 40"><path d="M14 34Q0 34 4 22Q8 12 22 16Q28 2 46 6Q62 0 68 14Q90 10 94 24Q98 34 84 34Z" fill="#fff"/></svg>`;
const TREE=`<svg viewBox="0 0 40 54"><rect x="16" y="30" width="8" height="22" rx="3" fill="#B97A40" ${S}/><circle cx="20" cy="20" r="17" fill="#5DBB4E" ${S}/><circle cx="14" cy="14" r="5" fill="#8BDB78"/></svg>`;
const HOUSE=`<svg viewBox="0 0 200 160"><rect x="40" y="70" width="120" height="82" rx="8" fill="#FFF3DF" ${S}/><path d="M28 74L100 22L172 74Z" fill="#6CCB5F" ${S}/><rect x="86" y="104" width="30" height="48" rx="6" fill="#C98C5C" ${S}/><circle cx="62" cy="100" r="13" fill="#BDE8FF" ${S}/><circle cx="140" cy="100" r="13" fill="#BDE8FF" ${S}/><path d="M100 62c-7-9-18 0-9 9l9 8 9-8c9-9-2-18-9-9z" fill="#FF6F91"/></svg>`;
const DY=12,pos=([x,y])=>`left:${x}%;top:${((y>40?y+DY:y)/264*100).toFixed(2)}%`;
function bgSVG(){
  let s=`<svg class="bg" viewBox="0 0 100 264" preserveAspectRatio="none"><circle cx="86" cy="9" r="6" fill="#FFD84D"/><circle cx="86" cy="9" r="8.5" fill="#FFD84D" opacity=".3"/>
    <ellipse cx="18" cy="26" rx="40" ry="8" fill="#B9E89C"/><ellipse cx="84" cy="27" rx="36" ry="7" fill="#A9DE8B"/>
    <g transform="translate(0 12)"><ellipse cx="80" cy="120" rx="44" ry="20" fill="#BCE9A0" opacity=".7"/><ellipse cx="14" cy="150" rx="40" ry="18" fill="#A6DC89" opacity=".6"/><ellipse cx="70" cy="214" rx="50" ry="20" fill="#BCE9A0" opacity=".7"/>
    <path d="M50 44C50 58,27 54,27 70S73 80,73 96S27 108,27 122S73 134,73 148S27 160,27 174S73 186,73 200S27 208,27 222" fill="none" stroke="#E9C88A" stroke-width="9" stroke-linecap="round"/>
    <path d="M50 44C50 58,27 54,27 70S73 80,73 96S27 108,27 122S73 134,73 148S27 160,27 174S73 186,73 200S27 208,27 222" fill="none" stroke="#F7E3B4" stroke-width="6.4" stroke-linecap="round"/>
    <path d="M50 44C50 58,27 54,27 70S73 80,73 96S27 108,27 122S73 134,73 148S27 160,27 174S73 186,73 200S27 208,27 222" fill="none" stroke="#fff" stroke-width=".8" stroke-dasharray="2 3" stroke-linecap="round" opacity=".9"/>`;
  [[8,60],[92,74],[60,112],[8,128],[94,160],[50,186],[90,226],[10,198],[46,84],[54,160]].forEach(([x,y],i)=>{const c=['#FF8FB1','#FFD84D','#fff','#B57CFF'][i%4];s+=`<circle cx="${x}" cy="${y}" r="1.1" fill="${c}"/><circle cx="${x+2.4}" cy="${y+1.2}" r=".9" fill="${c}"/><circle cx="${x+1}" cy="${y+2.6}" r=".9" fill="${c}"/>`});
  return s+'</g></svg>';
}
function bld(o){
  return `<button class="bld" data-go="${o.go}" data-en="${o.en}" style="${pos(o.at)};--w:${o.w||46}%;--d:${o.d||0}s"><span class="art">${o.art}</span>${o.pal?`<span class="pal ${o.side||'r'}">${o.pal}</span>`:''}<b>${o.title}</b>${o.sub?`<small>${o.sub}</small>`:''}</button>`;
}
function renderTown(){
  const P=M.prog(),cleared=Math.min(P.cleared,7),stamps=M.stamps?M.stamps():0;
  let h=bgSVG()+[['3%','46s','0s'],['6.5%','60s','-22s'],['1.5%','70s','-48s']].map(c=>`<span class="cloud" style="--y:${c[0]};--t:${c[1]};--d:${c[2]}">${CLOUD}</span>`).join('');
  [[8,52],[93,62],[52,100],[6,108],[95,132],[48,158],[6,186],[94,184],[52,214]].forEach(t=>{h+=`<span class="tree" style="${pos(t)}">${TREE}</span>`});
  h+=bld({go:'map',en:'Princess adventure',at:[50,31],w:64,art:A.BUILD.castle,pal:M.charaHTML(M.heroData()),side:'l',title:'공주 모험',sub:cleared>=7?'모험 성공! 👑':`별 ${cleared} / 7`});
  ZONES.forEach((z,i)=>{h+=bld({go:z.id,en:z.en,at:z.at,art:A.BUILD[z.art],pal:A.animal(z.pal[0],'idle',z.pal[1]),side:z.at[0]<50?'r':'l',title:z.title,d:.5+i*.6})});
  h+=bld({go:'friends',en:'Our friends',at:[73,198],w:40,art:HOUSE,title:'친구들 집',sub:cleared?`친구 ${cleared}명`:'',d:3.4});
  h+=bld({go:'stamps',en:'Praise stamps',at:[27,220],w:34,art:A.BUILD.stamp,title:'칭찬 도장',sub:`도장 ${stamps}개`,d:4});
  town.innerHTML=h;
}
let nextTarget=null,lastGreet=0;
function renderToday(){
  const ms=M.missions?M.missions():[],ni=ms.findIndex(m=>!m.done),allDone=ms.length&&ni<0,nm=CASTNAME();
  todayEl.innerHTML=`<button class="host" aria-label="토토">${A.animal('bunny',allDone?'happy':'idle',{chef:true,wave:true})}</button>
    <div class="tb"><span class="tt">${allDone?'오늘 놀이 끝! 최고야!':'오늘의 놀이'}</span>
    <div class="tpath">${ms.map((m,i)=>`<button class="msn ${m.done?'done':''} ${i===ni?'next':''}" data-go="${m.id}" data-en="">${m.icon}<b hidden>${m.name}</b>${i===ni?'<span class="go">여기! ▶</span>':''}</button>`).join('')}</div></div>`;
  nextTarget=todayEl.querySelector('.msn.next')||null;
  const host=todayEl.querySelector('.host');
  const greet=()=>{if(allDone)say(`${nm}오늘 놀이를 다 했어요! 최고야! 이제 하고 싶은 걸 골라 봐!`,'You finished today\'s play! Pick anything you like!');
    else if(ni>=0)say(`${nm}안녕! 오늘은 ${ms[ni].name} 해 볼까? 반짝이는 동그라미를 눌러 봐!`,'Hi! Tap the glowing circle to play!');
    else say('안녕! 나는 토토야. 같이 놀자!','Hi! I am Toto. Let\'s play!')};
  host.onclick=()=>{bounce(host);sfx.pop();greet()};
  const now=Date.now();if(now-lastGreet>45000){lastGreet=now;setTimeout(()=>{if(M.current()==='home')greet()},600)}
}
function CASTNAME(){const n=M.CAST.hero.name;return n?n+', ':''}

/* a gentle hint hand on the home screen: after 4 quiet seconds it taps today's next play */
const HG=M.Guide?M.Guide.make(home):null;
if(HG){home.addEventListener('pointerdown',()=>HG.touch(),true);['pointerup','pointercancel'].forEach(t=>home.addEventListener(t,()=>HG.release(),true));scroll.addEventListener('scroll',()=>HG.touch(),{passive:true});}
const he=games.home.enter;
games.home.enter=()=>{he();renderToday();renderTown();
  if(HG){if(nextTarget)HG.start({type:'tap',wait:true,after:4000,quiet:true,at:()=>{const r=nextTarget.getBoundingClientRect(),hr=home.getBoundingClientRect();return[r.left-hr.left+r.width/2,r.top-hr.top+r.height/2]}});else HG.stop()}};
games.home.exit=()=>{if(HG)HG.stop()};
games.home.enter();
/* back button inside a game returns to its building, not all the way home */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-go="home"]');if(!b)return;const scr=b.closest('.screen');if(!scr)return;const z=zoneOf[scr.id];
  if(z){e.stopPropagation();e.preventDefault();sfx.pop();M.go(z)}
},true);
})();
