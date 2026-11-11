/* 단계 엔진 ML.Progress (P2-나) — 같은 단계를 3번 끝내면 다음 단계, 별 3칸, 두 번 연속 어려워하면 조용히 한 단계 쉽게.
   숫자는 MLCFG.progress(clearsToLevelUp, starsShown, struggle, stepDownAfterStruggles, storageKey)에서 읽습니다.
   get(gameId) → {level, clears}   clear(gameId) → 별 1칸, 다 차면 level+1 ('ml-levelup' 이벤트)
   struggle(gameId, {wrong, idleMs}) → 그 판이 어려웠는지 기록, 연속 두 판이면 조용히 한 단계 내림
   set(gameId, level) → 어른 설정에서 직접 고름   register(gameId, {max, name, seg, seed}) → 놀이가 쓸 수 있는 단계 수와 어른 설정 줄
   아이 화면 그림: stars(gameId) (별 줄), fillStars(el, n), moment(host, {art, ko, en}, done) (단계 오르는 순간, 3초 안) */
(()=>{
'use strict';
const M=window.ML;if(!M||!M.store)return;
const CF=M.CFG||window.MLCFG||{},PC=CF.progress||{};
const KEY=PC.storageKey||'mallang_progress',NEED=Math.max(1,PC.clearsToLevelUp||3),STARS=Math.max(1,PC.starsShown||NEED);
const DOWN=Math.max(1,PC.stepDownAfterStruggles||2),STR=PC.struggle||{},WRONG=STR.wrongTouches||6,IDLE=STR.idleMs||20000;
const store=M.store;
let DB=store.get(KEY,{});if(!DB||typeof DB!=='object'||Array.isArray(DB))DB={};
const REG={};
const save=()=>store.set(KEY,DB);
const cfgMax=id=>(((CF.games||{})[id]||{}).levels||[]).length||1;
const maxOf=id=>Math.max(1,(REG[id]&&REG[id].max)||cfgMax(id));
const clamp=(n,id)=>Math.max(1,Math.min(maxOf(id),Math.round(+n||1)));
function rec(id){
  let r=DB[id];if(!r||typeof r!=='object')r=DB[id]={level:1,clears:0,struggles:0};
  r.level=clamp(r.level,id);r.clears=Math.max(0,Math.min(NEED,r.clears|0));r.struggles=r.struggles|0;return r;
}
function get(id){const r=rec(id);return{level:r.level,clears:r.clears}}
const level=id=>rec(id).level;   // short form (gate.js reads it)
/* one round finished: one more star. A full row opens the next level (at the last level the row just starts again) */
function clear(id){
  const r=rec(id);if(!r.hard)r.struggles=0;r.hard=false;r.last=Date.now();
  let up=false,full=false;r.clears++;
  if(r.clears>=NEED){full=true;r.clears=0;if(r.level<maxOf(id)){r.level++;up=true}}
  save();sync();
  if(up)document.dispatchEvent(new CustomEvent('ml-levelup',{detail:{game:id,level:r.level}}));
  return{level:r.level,clears:r.clears,up,full,filled:full?NEED:r.clears};
}
/* the child found this round hard (progress.struggle: wrongTouches or idleMs). Two rounds in a row → one level easier, silently */
function struggle(id,f){
  const hard=!f||(f.wrong|0)>=WRONG||(+f.idleMs||0)>=IDLE;if(!hard)return false;
  const r=rec(id);if(r.hard)return false;r.hard=true;r.struggles++;let down=false;
  if(r.struggles>=DOWN){r.struggles=0;if(r.level>1){r.level--;r.clears=0;down=true}}
  save();sync();return down?'down':true;
}
function set(id,n){const r=rec(id);r.level=clamp(n,id);r.clears=0;r.struggles=0;r.hard=false;save();sync();return get(id)}
function register(id,o={}){
  const fresh=!DB[id];REG[id]=Object.assign({},REG[id],o);
  if(fresh&&o.seed>1){rec(id).level=clamp(o.seed,id);save()}else rec(id);
  addRow(id);return get(id);
}

/* ---------- child screen: the 3-star row and the level-up moment (calm, no text) ---------- */
const STAR_D='M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.6l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z';
const css=`
.mlp-stars{display:inline-flex;gap:4px;align-items:center;flex:none}
.mlp-star{position:relative;width:30px;height:30px;display:block}
.mlp-star svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.mlp-star .mlp-fill{clip-path:inset(100% 0 0 0);transition:clip-path 1.4s ease-in-out}
.mlp-star.on .mlp-fill{clip-path:inset(0 0 0 0)}
.mlp-star.now{animation:mlpstar 1.6s ease-in-out}
@keyframes mlpstar{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
.mlp-moment{position:absolute;inset:0;z-index:70;display:grid;place-items:center;pointer-events:none;background:rgba(255,250,244,.55);opacity:0;transition:opacity .35s ease-out}
.mlp-moment.on{opacity:1}
.mlp-moment .mlp-card{width:min(64%,300px);aspect-ratio:1;border-radius:50%;background:var(--paper,#FFFDF9);display:grid;place-items:center;padding:12%;
  box-shadow:0 8px 22px rgba(91,74,66,.18);transform:scale(.7);transition:transform .5s cubic-bezier(.3,1.4,.5,1)}
.mlp-moment.on .mlp-card{transform:scale(1)}
.mlp-moment .mlp-card svg{width:100%;height:100%;display:block;overflow:visible}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const starSVG=`<svg viewBox="0 0 20 20"><path d="${STAR_D}" fill="#F6EEDF" stroke="#D9C7A8" stroke-width="1.3" stroke-linejoin="round"/></svg><svg class="mlp-fill" viewBox="0 0 20 20"><path d="${STAR_D}" fill="#F0D58A" stroke="#5B3A29" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
/* the row of STARS stars for a game, showing its clears (or n) */
function stars(id,n){const c=n==null?get(id).clears:n;return `<span class="mlp-stars" data-game="${id}">${Array.from({length:STARS},(_,i)=>`<i class="mlp-star${i<c?' on':''}">${starSVG}</i>`).join('')}</span>`}
/* fill the row up to n stars; the newly filled one fills slowly from the bottom */
function fillStars(el,n){if(!el)return;el.querySelectorAll('.mlp-star').forEach((s,i)=>{const was=s.classList.contains('on'),on=i<n;s.classList.toggle('on',on);if(on&&!was){s.classList.remove('now');void s.offsetWidth;s.classList.add('now')}})}
/* the level-up moment: one new thing shown big, its name in Korean and English, gone within 3 seconds */
function moment(host,o={},done){
  if(!host){done&&done();return()=>{}}
  const el=document.createElement('div');el.className='mlp-moment';el.innerHTML=`<div class="mlp-card">${o.art||''}</div>`;host.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('on'));
  if(M.tone){M.tone(784,.3,'sine',.07);M.tone(1046,.45,'sine',.07,.22)}
  if(o.ko&&M.say)M.say(o.ko,o.en||'');
  let t1=setTimeout(()=>el.classList.remove('on'),2400),t2=setTimeout(()=>{el.remove();done&&done()},2850);
  return()=>{clearTimeout(t1);clearTimeout(t2);el.remove()};
}

/* ---------- parent settings: one '놀이별 단계' block (progress.parentCanSetLevel) ---------- */
let block=null;
function ensureBlock(){
  if(block)return block;if(PC.parentCanSetLevel===false)return null;
  const sh=document.querySelector('#settings .sheet'),h4=sh&&sh.querySelector('h4');if(!h4)return null;
  block=document.createElement('div');block.id='progressRows';block.style.display='contents';
  block.innerHTML=`<div class="row"><span><b>놀이별 단계</b><br><small>같은 단계를 ${NEED}번 끝내면 다음 단계</small></span></div>`;
  sh.insertBefore(block,h4);
  block.addEventListener('click',e=>{const b=e.target.closest('.seg button');if(!b)return;const g=b.closest('.seg').dataset.game;set(g,+b.dataset.v)});
  const m=document.getElementById('settings');if(m&&window.MutationObserver)new MutationObserver(()=>{if(!m.hidden)sync()}).observe(m,{attributes:true,attributeFilter:['hidden']});
  return block;
}
function addRow(id){
  const bl=ensureBlock();if(!bl||bl.querySelector(`.seg[data-game="${id}"]`))return;const o=REG[id]||{},max=maxOf(id);
  const row=document.createElement('div');row.className='row';
  row.innerHTML=`<span>${o.name||(M.NAMES&&M.NAMES[id])||id} <small class="mlp-cl" data-game="${id}"></small></span><div class="seg" data-game="${id}"${o.seg?` id="${o.seg}"`:''}>${Array.from({length:max},(_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join('')}</div>`;
  bl.appendChild(row);sync();
}
function sync(){
  if(!block)return;
  block.querySelectorAll('.seg[data-game]').forEach(sg=>{const g=sg.dataset.game,r=get(g);sg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===r.level))});
  block.querySelectorAll('.mlp-cl[data-game]').forEach(s=>{s.textContent=`(별 ${get(s.dataset.game).clears}/${NEED})`});
}

M.Progress={get,level,clear,struggle,set,register,stars,fillStars,moment,NEED,STARS,get games(){return Object.keys(REG)}};
})();
