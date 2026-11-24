/* 말랑 놀이터 · 우리 가족 얼굴 (P4)
   ML.Faces  저장(IndexedDB, 안 되면 localStorage) · 예전 localStorage 얼굴 한 번 옮기기 · 얼굴 목록(자리 5개 + 계속 추가)
             all() 모든 자리 · list() 사진 있는 얼굴 · get(id) · save(rec) · add() · remove(id) · look(rec) 그림 옵션 · register() 미용실 손님으로 등록
   ML.Face   움직이는 얼굴: play(el, 움직임, {fx}) 움직임 7가지 + 그린 효과 5가지 · react(el, 기분, rec) · praise() 칭찬 손뼉 3초 · card(rec) 얼굴 카드 그림
   어른용 화면: ML.Faces.openManager() — 자리마다 사진 찍기/고르기 → 얼굴만 따기(타원 틀 옮기기·크기, 지우개·되살리기, 부드러운 가장자리) → 이름, 표정 사진 2장(선택), 머리·옷 고르기, 지우기, "+ 얼굴 추가".
   숫자·이름은 MLCFG.cast (slots, unlimited, storage, faceCut, emoticon), calm(characterLife, choiceColors) 에서 읽습니다.
   아이 화면에는 글자가 없습니다(이 파일의 글자는 어른용 화면뿐). 사진은 이 기기 안에만 저장됩니다. */
(()=>{
'use strict';
const M=window.ML,A=window.ART;if(!M||!A||!A.person)return;
const CF=M.CFG||window.MLCFG||{},CC=CF.cast||{},store=M.store;
const toast=m=>{try{M.toast(m)}catch(e){}};
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SLOTS=(CC.slots||[{id:'baby',ko:'우리 아기',en:'baby'},{id:'mom',ko:'엄마',en:'Mommy'},{id:'dad',ko:'아빠',en:'Daddy'},{id:'uncle',ko:'삼촌',en:'Uncle'},{id:'grandma',ko:'할머니',en:'Grandma'}]).map(s=>({id:s.id,ko:s.ko,en:s.en}));
const SLOT_STYLE={baby:'curl',mom:'long',dad:'short',uncle:'short',grandma:'bun'};   // the usual hair of each place (the adult can change it)
const HAIRS=['#2B1B14','#5A3A2A','#8A5A36','#C9A24B','#8E8E8E','#E4DDD5','#B5483A'];
const CLOTHES=((CF.calm||{}).choiceColors||[]).map(c=>c.hex);
const PX=(CC.photoSizePx)||256;
const hexMix=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};

/* ================= storage: IndexedDB (cast.storage), a localStorage copy when that is not possible ================= */
const DBN='mallang_faces',OS='faces',LSK='mallang_faces_ls',MIG='mallang_faces_migrated';
let db=null,mode='ls',migrated=false;
const mem=new Map();
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
function openDB(){return new Promise((res,rej)=>{
  try{if(!window.indexedDB){rej(new Error('no idb'));return}
    const q=indexedDB.open(DBN,1);q.onupgradeneeded=()=>{try{q.result.createObjectStore(OS,{keyPath:'id'})}catch(e){}};
    q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error||new Error('idb'));q.onblocked=()=>rej(new Error('blocked'));
    setTimeout(()=>rej(new Error('timeout')),4000);
  }catch(e){rej(e)}})}
const tx=(rw,fn)=>new Promise((res,rej)=>{try{const t=db.transaction(OS,rw),r=fn(t.objectStore(OS));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))}catch(e){rej(e)}});
function lsLoad(){try{const o=JSON.parse(lsGet(LSK)||'{}');return Object.keys(o).map(k=>o[k]).filter(r=>r&&r.id)}catch(e){return[]}}
function lsSaveAll(){const o={};mem.forEach((r,k)=>{o[k]=r});return lsSet(LSK,JSON.stringify(o))}
const norm=r=>{
  const d=SLOTS.find(s=>s.id===r.id),o=Object.assign({id:r.id,ko:'',en:'',photo:null,expr:{},custom:!d,ord:0},r);
  if(!o.expr||typeof o.expr!=='object')o.expr={};
  if(d){if(!o.ko)o.ko=d.ko;if(!o.en)o.en=d.en}
  return o;
};
/* write one record. false when there is no room (the caller puts the old one back) */
async function put(rec){
  if(mode==='idb'){
    try{await tx('readwrite',s=>s.put(rec));return true}
    catch(e){if(e&&(e.name==='QuotaExceededError'||/quota/i.test(String(e.message))))return false;mode='ls'}
  }
  return lsSaveAll();
}
async function del(id){
  if(mode==='idb'){try{await tx('readwrite',s=>s.delete(id));return true}catch(e){mode='ls'}}
  return lsSaveAll();
}
const CAST=()=>M.CAST||{};
/* the old places (localStorage mallang_cast): mom and dad photos, and the hero photo as the baby's first face. Moved once. */
async function migrate(){
  if(lsGet(MIG)==='1'){migrated=true;return}
  const C=CAST(),F=C.family||{},H=C.hero||{},recs=[];
  ['mom','dad'].forEach(k=>{const p=F[k]&&F[k].photo;if(p&&!mem.has(k))recs.push(norm({id:k,photo:p,round:true}))});
  if(H.photo&&!mem.has('baby'))recs.push(norm({id:'baby',photo:H.photo,round:true}));
  for(const r of recs){mem.set(r.id,r);if(!(await put(r))){mem.delete(r.id);return}}
  if(mode==='idb'){['mom','dad'].forEach(k=>{if(F[k]&&F[k].photo)delete F[k].photo});migrated=true;try{M.saveCast()}catch(e){}}
  lsSet(MIG,'1');
}
/* the old code (play2.js, room.js) still reads CAST.family.mom.photo: keep that in memory, never written back (stripCast) */
function syncLegacy(){
  const C=CAST();if(!C.family)C.family={};
  ['mom','dad'].forEach(k=>{const r=mem.get(k);C.family[k]=Object.assign({},C.family[k]);if(r&&r.photo)C.family[k].photo=r.photo;else delete C.family[k].photo});
}
const stripCast=c=>{if(!(mode==='idb'&&migrated)||!c||!c.family)return c;const f={};Object.keys(c.family).forEach(k=>{f[k]=Object.assign({},c.family[k]);delete f[k].photo});return Object.assign({},c,{family:f})};

/* ================= the list ================= */
const ordOf=()=>{let m=0;mem.forEach(r=>{if(r.ord>m)m=r.ord});return m+1};
function get(id){const r=mem.get(id);if(r)return r;const d=SLOTS.find(s=>s.id===id);return d?norm({id}):null}
const all=()=>{
  const out=SLOTS.map(s=>get(s.id)),c=[];mem.forEach(r=>{if(!SLOTS.some(s=>s.id===r.id))c.push(r)});
  c.sort((a,b)=>(a.ord||0)-(b.ord||0));return out.concat(c);
};
const list=()=>all().filter(r=>r.photo);
const kindOf=id=>'fc_'+id;
const byKind=k=>String(k).startsWith('fc_')?get(String(k).slice(3)):null;
const hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
/* drawing options of a face (the adult's choices, else the usual ones) */
function look(r){
  const h=hash(r.id);
  return{skin:r.skin,hair:r.hair,hairStyle:r.hairStyle||SLOT_STYLE[r.id]||'short',cloth:r.cloth||CLOTHES[h%Math.max(1,CLOTHES.length)],acc:r.acc||'',expr:r.expr||{}};
}
function register(){list().forEach(r=>{try{A.personKind(kindOf(r.id),Object.assign({ko:r.ko,en:r.en,photo:r.photo},look(r)))}catch(e){}})}
async function save(rec){
  const prev=mem.get(rec.id);rec=norm(rec);if(!rec.ord)rec.ord=ordOf();mem.set(rec.id,rec);
  const ok=await put(rec);
  if(!ok){if(prev)mem.set(rec.id,prev);else mem.delete(rec.id);toast('저장 공간이 부족해서 사진을 저장하지 못했어요. 다른 얼굴을 지우고 다시 해 주세요.');return false}
  syncLegacy();register();changed();return true;
}
async function remove(id){
  const prev=mem.get(id);mem.delete(id);const ok=await del(id);if(!ok&&prev)mem.set(id,prev);
  syncLegacy();register();changed();return ok;
}
async function add(o){
  const id='f'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
  const rec=norm({id,ko:(o&&o.ko)||'',en:(o&&o.en)||'',custom:true,ord:ordOf()});
  mem.set(id,rec);if(!(await put(rec))){mem.delete(id);toast('저장 공간이 부족해요.');return null}
  changed();return rec;
}
const subs=[];
const changed=()=>{subs.forEach(f=>{try{f()}catch(e){}});try{document.dispatchEvent(new CustomEvent('ml-faces'))}catch(e){}};
/* the name a child hears: 할머니가 오셨어요 */
const iga=w=>{const c=String(w).trim().slice(-1).charCodeAt(0);return(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?'이':'가'};
const nameKo=r=>(r.ko||'가족').trim(),nameEn=r=>(r.en||r.ko||'family').trim();

const Faces={
  idb:()=>mode==='idb',migrated:()=>migrated,stripCast,
  all,list,get,save,remove,add,look,register,kindOf,byKind,iga,nameKo,nameEn,
  count:()=>list().length,subscribe:f=>{subs.push(f)},
  slots:SLOTS,hairs:HAIRS,
  /* tests: where the faces are kept now */
  __state:()=>({mode,migrated,ids:all().map(r=>r.id),withPhoto:list().map(r=>r.id)}),
  __wipe:async()=>{mem.clear();try{if(db)await tx('readwrite',s=>s.clear())}catch(e){}try{localStorage.removeItem(LSK)}catch(e){}syncLegacy();changed()}
};
Faces.ready=(async()=>{
  try{db=await openDB();mode='idb';const rows=await tx('readonly',s=>s.getAll());(rows||[]).forEach(r=>{if(r&&r.id)mem.set(r.id,norm(r))})}
  catch(e){db=null;mode='ls';lsLoad().forEach(r=>mem.set(r.id,norm(r)))}
  try{await migrate()}catch(e){}
  syncLegacy();register();changed();
})().catch(()=>{});
M.Faces=Faces;

/* ================= the moving face (cast.emoticon) =================
   The photo is moved inside a fixed oval (slid and squeezed to one side like a turning head), the head leans, the body bounces.
   One motion lasts 0.6~1 s and never repeats. Drawn effects (blush, heart, sparkle, sweat, sleep) float on top for the same time. */
const REDUCED=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const MOTIONS=['lookL','lookR','nodUp','nodDown','tilt','bounce','shiver'];
const FX=['blush','heart','sparkle','sweat','sleep'];
const DUR={lookL:900,lookR:900,nodUp:800,nodDown:800,tilt:900,bounce:700,shiver:900};
/* keyframes per layer: root (al-root), head (al-head-s), photo (pe-photo). Offsets 0 → 1 */
const KF={
  lookL:{photo:[{transform:'translate(0,0) scaleX(1)'},{transform:'translate(-9px,0) scaleX(.86)',offset:.35},{transform:'translate(-9px,0) scaleX(.86)',offset:.65},{transform:'translate(0,0) scaleX(1)'}],
         head:[{transform:'rotate(0) translateX(0)'},{transform:'rotate(-5deg) translateX(-3px)',offset:.35},{transform:'rotate(-5deg) translateX(-3px)',offset:.65},{transform:'rotate(0) translateX(0)'}]},
  lookR:{photo:[{transform:'translate(0,0) scaleX(1)'},{transform:'translate(9px,0) scaleX(.86)',offset:.35},{transform:'translate(9px,0) scaleX(.86)',offset:.65},{transform:'translate(0,0) scaleX(1)'}],
         head:[{transform:'rotate(0) translateX(0)'},{transform:'rotate(5deg) translateX(3px)',offset:.35},{transform:'rotate(5deg) translateX(3px)',offset:.65},{transform:'rotate(0) translateX(0)'}]},
  nodUp:{photo:[{transform:'translate(0,0) scaleY(1)'},{transform:'translate(0,-8px) scaleY(1.07)',offset:.4},{transform:'translate(0,-8px) scaleY(1.07)',offset:.6},{transform:'translate(0,0) scaleY(1)'}],
         head:[{transform:'translateY(0) scaleY(1)'},{transform:'translateY(-6px) scaleY(1.03)',offset:.4},{transform:'translateY(-6px) scaleY(1.03)',offset:.6},{transform:'translateY(0) scaleY(1)'}]},
  nodDown:{photo:[{transform:'translate(0,0) scaleY(1)'},{transform:'translate(0,9px) scaleY(.88)',offset:.4},{transform:'translate(0,9px) scaleY(.88)',offset:.6},{transform:'translate(0,0) scaleY(1)'}],
         head:[{transform:'translateY(0) scaleY(1)'},{transform:'translateY(7px) scaleY(.95)',offset:.4},{transform:'translateY(7px) scaleY(.95)',offset:.6},{transform:'translateY(0) scaleY(1)'}]},
  tilt:{head:[{transform:'rotate(0) translateX(0)'},{transform:'rotate(11deg) translateX(4px)',offset:.4},{transform:'rotate(11deg) translateX(4px)',offset:.65},{transform:'rotate(0) translateX(0)'}],
        photo:[{transform:'rotate(0)'},{transform:'rotate(-3deg)',offset:.4},{transform:'rotate(-3deg)',offset:.65},{transform:'rotate(0)'}]},
  bounce:{root:[{transform:'translateY(0) scale(1,1)'},{transform:'translateY(0) scale(1.06,.93)',offset:.18},{transform:'translateY(-17px) scale(.96,1.05)',offset:.5},{transform:'translateY(0) scale(1.05,.95)',offset:.82},{transform:'translateY(0) scale(1,1)'}]},
  shiver:{root:[{transform:'translateX(0) rotate(0)'},{transform:'translateX(-3px) rotate(-2deg)',offset:.17},{transform:'translateX(3px) rotate(2deg)',offset:.5},{transform:'translateX(-3px) rotate(-2deg)',offset:.83},{transform:'translateX(0) rotate(0)'}],
          head:[{transform:'rotate(0)'},{transform:'rotate(2deg)',offset:.33},{transform:'rotate(-2deg)',offset:.67},{transform:'rotate(0)'}]}
};
const part=(el,sel)=>el&&el.querySelector(sel);
/* a drawn effect over the picture: an svg (same picture units 200×230) laid exactly on the character */
const FXS={
  blush:()=>`<g class="fx-in"><ellipse cx="66" cy="132" rx="15" ry="9.5" fill="#FF8FA6" opacity=".6"/><ellipse cx="134" cy="132" rx="15" ry="9.5" fill="#FF8FA6" opacity=".6"/></g>`,
  heart:()=>[[150,52,0],[168,78,160]].map(([x,y,d])=>`<g class="fx-up" style="animation-delay:${d}ms"><path transform="translate(${x} ${y})" d="M0 9C-14 -2 -12 -13 -5 -13C-2 -13 0 -10 0 -7C0 -10 2 -13 5 -13C12 -13 14 -2 0 9Z" fill="#F08AA0" stroke="${A.OL}" stroke-width="2.2" stroke-linejoin="round"/></g>`).join(''),
  sparkle:()=>[[40,46,0,10],[162,40,120,12],[176,96,240,8]].map(([x,y,d,r])=>`<g class="fx-pop" style="animation-delay:${d}ms;transform-origin:${x}px ${y}px">${A.twinkle(x,y,r,'#F6D77A')}</g>`).join(''),
  sweat:()=>`<g class="fx-drip"><path transform="translate(156 62)" d="M0 -11Q9 3 0 9Q-9 3 0 -11Z" fill="#9FD0F0" stroke="#6FB2DC" stroke-width="2" stroke-linejoin="round"/></g>`,
  sleep:()=>[[150,44,0,1],[170,22,320,.75]].map(([x,y,d,s])=>`<g class="fx-up" style="animation-delay:${d}ms"><path transform="translate(${x} ${y}) scale(${s})" d="M-9 -8H8L-9 8H9" fill="none" stroke="#8A9AC8" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')
};
(()=>{const st=document.createElement('style');st.textContent=
  '.fc-fx{position:absolute;pointer-events:none;overflow:visible;z-index:5}'+
  '.fc-fx .fx-in{animation:fx-in var(--fx-ms,900ms) ease-in-out both}@keyframes fx-in{0%{opacity:0}30%,70%{opacity:1}100%{opacity:0}}'+
  '.fc-fx .fx-up{animation:fx-up var(--fx-ms,900ms) ease-out both}@keyframes fx-up{0%{opacity:0;transform:translateY(8px) scale(.6)}25%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-26px) scale(1.05)}}'+
  '.fc-fx .fx-pop{animation:fx-pop var(--fx-ms,900ms) ease-in-out both}@keyframes fx-pop{0%{opacity:0;transform:scale(.2)}35%{opacity:1;transform:scale(1.15)}65%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.4)}}'+
  '.fc-fx .fx-drip{animation:fx-drip var(--fx-ms,900ms) ease-in both}@keyframes fx-drip{0%{opacity:0;transform:translateY(-4px)}20%{opacity:1}100%{opacity:0;transform:translateY(34px)}}'+
  '.fc-praise{position:fixed;z-index:55;pointer-events:none;width:84px;right:12px;top:calc(env(safe-area-inset-top,0px) + 96px);opacity:0;transform:translateY(14px) scale(.7);transition:opacity .4s ease,transform .45s cubic-bezier(.34,1.5,.55,1)}'+
  '.fc-praise.on{opacity:1;transform:none}.fc-praise svg{display:block;width:100%;height:auto;overflow:visible}'+
  '.fc-fig{display:block;width:calc(var(--fw,96px));height:auto;position:relative}.fc-fig svg{display:block;width:100%;height:auto;overflow:visible}';
  (document.head||document.documentElement).appendChild(st)})();
function fxLayer(el,name,ms){
  const sv=el&&el.querySelector('svg');if(!sv||!FXS[name])return null;
  const host=sv.parentElement||el;if(getComputedStyle(host).position==='static')host.style.position='relative';
  const hr=host.getBoundingClientRect(),r=sv.getBoundingClientRect();if(!r.width)return null;
  const d=document.createElement('div');d.className='fc-fx';Object.assign(d.style,{left:(r.left-hr.left)+'px',top:(r.top-hr.top)+'px',width:r.width+'px',height:r.height+'px','--fx-ms':ms+'ms'});
  d.innerHTML=`<svg viewBox="0 0 200 230" style="overflow:visible;width:100%;height:100%">${FXS[name]()}</svg>`;d.dataset.fx=name;host.appendChild(d);
  setTimeout(()=>d.remove(),ms+500);return d;
}
const LOGF=[];
/* one motion (0.6~1 s, once) and optionally one drawn effect; returns the animations (tests can freeze them) */
function play(el,motion,o={}){
  if(!el||!KF[motion])return null;
  const sv=el.querySelector('svg.pe-person')||el.querySelector('svg');if(!sv)return null;
  const ms=DUR[motion],anims=[];
  if(!REDUCED||o.force){
    const k=KF[motion],tg={root:part(sv,'.al-root'),head:part(sv,'.al-head-s'),photo:part(sv,'.pe-photo')};
    Object.keys(k).forEach(l=>{const t=tg[l];if(!t||!t.animate)return;
      const a=t.animate(k[l],{duration:ms,easing:'ease-in-out',fill:'none'});anims.push(a)});
    if(motion==='bounce'){const g=part(sv,'.vol-ground');if(g&&g.animate)anims.push(g.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.7)',opacity:.5,offset:.5},{transform:'scale(1)',opacity:1}],{duration:ms,easing:'ease-in-out'}))}
  }
  if(o.fx)fxLayer(el,o.fx,ms);
  const rec={motion,fx:o.fx||'',t:performance.now(),ms};LOGF.push(rec);if(LOGF.length>200)LOGF.shift();
  return{motion,ms,anims,freeze(p){anims.forEach(a=>{a.pause();a.currentTime=ms*p})},cancel(){anims.forEach(a=>a.cancel())}};
}
/* a mood for a whole face: the motion, the effect and (when the adult added expression photos) the smiling or surprised photo */
const MOODS={happy:['bounce','heart'],wow:['nodUp','sparkle'],shy:['tilt','blush'],sleepy:['nodDown','sleep'],cold:['shiver','sweat'],hello:['lookR',''],look:['lookL','']};
function react(el,mood,rec){
  const m=MOODS[mood];if(!m)return null;const sv=el&&el.querySelector('svg');if(!sv)return null;
  const ph=part(sv,'.pe-photo'),ex=rec&&rec.expr||{},alt=mood==='happy'?ex.smile:mood==='wow'?ex.wow:null;let back=null;
  if(ph&&alt){back=ph.getAttribute('href');ph.setAttribute('href',alt)}
  const r=play(el,m[0],{fx:m[1]||undefined});
  if(back)setTimeout(()=>{try{ph.setAttribute('href',back)}catch(e){}},r?r.ms+500:900);
  return r;
}
/* a face card picture (child screens): head and shoulders of a face, alive when alive.js is there */
function card(rec,o={}){
  const L=look(rec);return `<span class="fc-fig" style="--fw:${o.w||96}px" data-face="${esc(rec.id)}">${A.person(rec.photo,Object.assign({mood:o.mood||'idle',cells:null},L))}</span>`;
}

/* ================= praise: at the end of a round one face (or Toto) claps for 3 seconds (cast / ML.Progress 'ml-round') ================= */
let praiseT=0,praiseEl=null,praiseOn=true;
function praise(o={}){
  if(!praiseOn&&!o.force)return null;
  if(praiseEl){praiseEl.remove();praiseEl=null}clearTimeout(praiseT);
  const fs=list(),f=fs.length?fs[Math.floor(Math.random()*fs.length)]:null;
  const d=document.createElement('div');d.className='fc-praise';d.setAttribute('aria-hidden','true');d.dataset.who=f?f.id:'toto';
  d.innerHTML=f?A.person(f.photo,Object.assign({mood:'happy',cells:null},look(f))):A.animal('bunny','happy',{});
  document.body.appendChild(d);praiseEl=d;
  /* the clap is drawn here (no ML.Alive instance, so nothing keeps running once the screen is left) */
  requestAnimationFrame(()=>{d.classList.add('on');
    if(!REDUCED){
      const root=d.querySelector('.al-root');if(root&&root.animate)root.animate([{transform:'translateY(0)'},{transform:'translateY(-9px)',offset:.5},{transform:'translateY(0)'}],{duration:600,delay:200,easing:'ease-in-out'});
      [['.al-arm-l',-20,-58],['.al-arm-r',20,58]].forEach(([sel,a0,a1])=>{const e=d.querySelector(sel);if(!e||!e.animate)return;e.style.transformBox='fill-box';
        e.animate([{transform:`rotate(${a0}deg)`},{transform:`rotate(${a1}deg)`},{transform:`rotate(${a0}deg)`}],{duration:600,delay:300,iterations:3,easing:'ease-in-out'})});
    }
    if(f)setTimeout(()=>{try{play(d,'bounce',{fx:'heart'})}catch(e){}},300);
  });
  try{M.sfx&&M.sfx.pop&&M.sfx.pop()}catch(e){}
  praiseT=setTimeout(()=>{d.classList.remove('on');setTimeout(()=>{d.remove();if(praiseEl===d)praiseEl=null},450)},2600);
  return d;
}
document.addEventListener('ml-round',()=>{setTimeout(()=>{try{praise()}catch(e){}},900)});
const Face={MOTIONS,FX,DUR,play,react,card,praise,MOODS,log:()=>LOGF.slice(),praiseOn:v=>{if(v!=null)praiseOn=!!v;return praiseOn},
  __praiseEl:()=>praiseEl};
M.Face=Face;

/* ================= grown-up screens: the face manager and the face cut ================= */
let uiCss=false;
function css(){
  if(uiCss)return;uiCss=true;const st=document.createElement('style');st.textContent=`
#faceMgr .sheet{max-width:560px;gap:12px}
#faceMgr .fm-card{background:var(--bg);border-radius:22px;padding:12px;display:flex;flex-direction:column;gap:8px;width:100%;text-align:left}
#faceMgr .fm-top{display:flex;gap:10px;align-items:center}
#faceMgr .fm-pic{flex:none;width:84px;height:84px;border-radius:18px;background:var(--paper);display:grid;place-items:center;overflow:hidden;font-size:12px;color:var(--muted);font-family:system-ui,sans-serif;border:2px dashed var(--hole,#d8d0c4)}
#faceMgr .fm-pic.has{border:0}#faceMgr .fm-pic svg{width:100%;height:100%}
#faceMgr .fm-names{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}
#faceMgr input[type=text]{width:100%;font-size:16px;border:2px solid var(--hole,#d8d0c4);border-radius:12px;padding:6px 10px;color:var(--ink);background:var(--paper);font-family:system-ui,sans-serif}
#faceMgr .fm-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:14px;font-family:system-ui,sans-serif;color:var(--ink)}
#faceMgr .fm-row b{font-weight:400;min-width:56px;color:var(--muted)}
#faceMgr .btn.small{font-size:14px;padding:7px 12px}
#faceMgr .fm-sw{width:30px;height:30px;border-radius:50%;border:2px solid transparent;padding:0;box-shadow:0 2px 0 rgba(46,42,79,.15)}
#faceMgr .fm-sw.on{border-color:var(--ink)}
#faceMgr .fm-ex{display:flex;gap:6px;align-items:center}
#faceMgr .fm-ex img{width:34px;height:34px;border-radius:50%;object-fit:cover;background:var(--paper)}
#faceCut .sheet{max-width:440px}
#faceCut .fc-stage{width:min(340px,100%);aspect-ratio:1;touch-action:none;position:relative}
#faceCut canvas{width:100%;height:100%;display:block;border-radius:18px;touch-action:none}
#faceCut #fcWork{background:repeating-conic-gradient(#e9e3da 0 25%,#f7f3ec 0 50%) 0 0/20px 20px}
#faceCut .fc-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;font-size:15px;font-family:system-ui,sans-serif;width:100%}
#faceCut .fc-ctl input[type=range]{flex:1;min-width:120px;accent-color:var(--berry)}
`;(document.head||document.documentElement).appendChild(st);
}
function modal(id,html){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.className='modal';m.id=id;m.hidden=true;document.body.appendChild(m)}m.innerHTML=html;return m}

/* ---------- face cut ---------- */
const SZ=560,RY=126/107;       // the frame: an oval with the face's height-to-width, 107 × 126 inside a 256 square
let cutEl=null,C=null;
function openCut(img,target,done){
  css();
  cutEl=modal('faceCut',`<div class="sheet center" role="dialog" aria-label="얼굴만 따기">
    <h3 id="fcTitle">얼굴만 따기</h3>
    <p class="hint" id="fcHint"></p>
    <div class="fc-stage"><canvas id="fcFrame" width="${SZ}" height="${SZ}"></canvas><canvas id="fcWork" width="512" height="512" hidden></canvas></div>
    <div class="fc-ctl" id="fcCtl1"><span>크기</span><input type="range" id="fcSize" min="0.08" max="0.48" step="0.005" aria-label="틀 크기"><button class="btn small alt" id="fcAuto" hidden>얼굴 자동으로 맞추기</button></div>
    <div class="fc-ctl" id="fcCtl2" hidden>
      <div class="seg" id="fcTool"><button data-t="erase" class="on">지우개</button><button data-t="restore">되살리기</button></div>
      <span>붓</span><input type="range" id="fcBrush" min="8" max="64" value="28" aria-label="붓 크기">
      <span>가장자리</span><input type="range" id="fcSoft" min="0" max="8" step="1" value="4" aria-label="가장자리 부드럽게">
      <button class="btn small ghost" id="fcUndo">되돌리기</button>
    </div>
    <div class="row" style="justify-content:center"><button class="btn ghost" id="fcCancel">취소</button><button class="btn ghost" id="fcBack" hidden>이전</button><button class="btn" id="fcNext">다음</button></div>
  </div>`);
  const cv=$('#fcFrame'),g=cv.getContext('2d'),wk=$('#fcWork'),wg=wk.getContext('2d',{willReadFrequently:true});
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,s=Math.min(SZ/iw,SZ/ih),fw=iw*s,fh=ih*s,ox=(SZ-fw)/2,oy=(SZ-fh)/2;
  C={img,target,done,step:1,tool:'erase',undo:[],orig:null,last:null,ptrs:new Map(),pinch:0};
  const fr=C.fr={cx:SZ/2,cy:SZ/2,rx:Math.min(fw,fh)*.3};
  const clampFr=()=>{fr.rx=Math.max(SZ*.08,Math.min(SZ*.48,fr.rx));fr.cx=Math.max(0,Math.min(SZ,fr.cx));fr.cy=Math.max(0,Math.min(SZ,fr.cy));$('#fcSize').value=fr.rx/SZ};
  const draw=()=>{
    g.fillStyle='#EDE8E0';g.fillRect(0,0,SZ,SZ);g.drawImage(img,ox,oy,fw,fh);
    g.fillStyle='rgba(46,42,79,.5)';g.beginPath();g.rect(0,0,SZ,SZ);g.ellipse(fr.cx,fr.cy,fr.rx,fr.rx*RY,0,0,Math.PI*2,true);g.fill('evenodd');
    g.strokeStyle='#fff';g.lineWidth=5;g.beginPath();g.ellipse(fr.cx,fr.cy,fr.rx,fr.rx*RY,0,0,Math.PI*2);g.stroke();
    g.fillStyle='#fff';[[0,-1],[0,1],[-1,0],[1,0]].forEach(([a,b])=>{g.beginPath();g.arc(fr.cx+a*fr.rx,fr.cy+b*fr.rx*RY,7,0,Math.PI*2);g.fill()});
  };
  C.draw=draw;clampFr();draw();
  $('#fcHint').textContent='타원 틀을 손가락으로 끌어서 얼굴에 맞추고, 두 손가락으로 벌리거나 아래 막대로 크기를 맞춰 주세요. 머리카락과 턱선은 다음 화면에서 손봐요.';
  const mapPt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*SZ/r.width,(e.clientY-r.top)*SZ/r.height]};
  cv.addEventListener('pointerdown',e=>{if(C.step!==1)return;try{cv.setPointerCapture(e.pointerId)}catch(_){}C.ptrs.set(e.pointerId,mapPt(e));C.pinch=0});
  cv.addEventListener('pointermove',e=>{
    if(C.step!==1||!C.ptrs.has(e.pointerId))return;const p=mapPt(e),q=C.ptrs.get(e.pointerId);
    if(C.ptrs.size===1){fr.cx+=p[0]-q[0];fr.cy+=p[1]-q[1]}
    else{C.ptrs.set(e.pointerId,p);const v=[...C.ptrs.values()],d=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]);if(C.pinch)fr.rx*=d/C.pinch;C.pinch=d}
    C.ptrs.set(e.pointerId,p);clampFr();draw();
  });
  const up=e=>{C.ptrs.delete(e.pointerId);C.pinch=0};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  $('#fcSize').addEventListener('input',e=>{fr.rx=+e.target.value*SZ;clampFr();draw()});
  /* FaceDetector (only where the device has it): fit the frame by itself; by hand when it is not there */
  if('FaceDetector' in window){
    const b=$('#fcAuto');b.hidden=false;
    const fit=async()=>{try{const fd=new window.FaceDetector({fastMode:true,maxDetectedFaces:1}),r=await fd.detect(img);
      if(r&&r[0]){const bb=r[0].boundingBox;fr.cx=ox+(bb.x+bb.width/2)*s;fr.cy=oy+(bb.y+bb.height*.42)*s;fr.rx=bb.width*s*.68;clampFr();draw();return true}}catch(e){}return false};
    b.onclick=async()=>{if(!(await fit()))toast('얼굴을 찾지 못했어요. 손으로 맞춰 주세요.')};fit();
  }
  /* step 2: the oval part of the photo on a 512 sheet, with the pieces round it kept to bring back */
  const toStep2=()=>{
    const k=107/fr.rx,half=128/k,ix=(fr.cx-ox)/s,iy=(fr.cy-oy)/s,hi=half/s;
    const o=document.createElement('canvas');o.width=o.height=512;const og=o.getContext('2d');og.drawImage(img,ix-hi,iy-hi,hi*2,hi*2,0,0,512,512);C.orig=o;
    wg.clearRect(0,0,512,512);wg.save();wg.beginPath();wg.ellipse(256,256,214,252,0,0,Math.PI*2);wg.clip();wg.drawImage(o,0,0);wg.restore();
    C.step=2;C.undo=[];cv.hidden=true;wk.hidden=false;$('#fcCtl1').hidden=true;$('#fcCtl2').hidden=false;$('#fcBack').hidden=false;$('#fcNext').textContent='저장';
    $('#fcHint').textContent='남은 배경은 지우개로 지우고, 너무 지운 곳은 되살리기로 칠해 주세요. 가장자리 막대로 얼굴 둘레를 부드럽게 해요.';
  };
  const toStep1=()=>{C.step=1;cv.hidden=false;wk.hidden=true;$('#fcCtl1').hidden=false;$('#fcCtl2').hidden=true;$('#fcBack').hidden=true;$('#fcNext').textContent='다음';draw();
    $('#fcHint').textContent='타원 틀을 손가락으로 끌어서 얼굴에 맞추고, 두 손가락으로 벌리거나 아래 막대로 크기를 맞춰 주세요. 머리카락과 턱선은 다음 화면에서 손봐요.'};
  const snap=()=>{C.undo.push(wg.getImageData(0,0,512,512));if(C.undo.length>10)C.undo.shift()};
  const wpos=e=>{const r=wk.getBoundingClientRect();return[(e.clientX-r.left)*512/r.width,(e.clientY-r.top)*512/r.height]};
  const brush=(a,b)=>{const rr=+$('#fcBrush').value/2+4;wg.save();wg.lineWidth=rr*2;wg.lineCap='round';
    if(C.tool==='erase'){wg.globalCompositeOperation='destination-out';wg.beginPath();wg.moveTo(a[0],a[1]);wg.lineTo(b[0],b[1]);wg.stroke()}
    else{wg.beginPath();const n=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])/(rr/2));for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,y=a[1]+(b[1]-a[1])*i/n;wg.moveTo(x+rr,y);wg.arc(x,y,rr,0,Math.PI*2)}wg.clip();wg.drawImage(C.orig,0,0)}
    wg.restore()};
  wk.addEventListener('pointerdown',e=>{if(C.step!==2)return;e.preventDefault();try{wk.setPointerCapture(e.pointerId)}catch(_){}snap();const p=wpos(e);C.last=p;brush(p,[p[0]+.5,p[1]])});
  wk.addEventListener('pointermove',e=>{if(!C.last)return;const p=wpos(e);brush(C.last,p);C.last=p});
  const end=()=>{C.last=null};wk.addEventListener('pointerup',end);wk.addEventListener('pointercancel',end);
  $('#fcTool').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;C.tool=b.dataset.t;cutEl.querySelectorAll('#fcTool button').forEach(x=>x.classList.toggle('on',x===b))});
  $('#fcUndo').onclick=()=>{const d=C.undo.pop();if(d)wg.putImageData(d,0,0)};
  $('#fcCancel').onclick=()=>{cutEl.hidden=true;C=null};
  $('#fcBack').onclick=toStep1;
  $('#fcNext').onclick=()=>{if(C.step===1){toStep2();return}finish(wk,+$('#fcSoft').value)};
  C.__step2=toStep2;
  cutEl.hidden=false;
}
/* soft edge: the alpha is blurred a few pixels and only ever lowers the picture's own alpha, so the face melts inward at the border */
function feather(id,r){
  if(r<=0)return;const W=id.width,H=id.height,px=id.data,a=new Float32Array(W*H),t=new Float32Array(W*H);
  for(let i=0;i<W*H;i++)a[i]=px[i*4+3];
  const pass=(src,dst,horiz)=>{for(let y=0;y<(horiz?H:W);y++){let sum=0;const n=horiz?W:H,at=k=>horiz?src[y*W+k]:src[k*W+y],set=(k,v)=>{if(horiz)dst[y*W+k]=v;else dst[k*W+y]=v};
    for(let k=-r;k<=r;k++)sum+=at(Math.max(0,Math.min(n-1,k)));
    for(let k=0;k<n;k++){set(k,sum/(2*r+1));sum+=at(Math.min(n-1,k+r+1))-at(Math.max(0,k-r))}}};
  pass(a,t,true);pass(t,a,false);pass(a,t,true);pass(t,a,false);
  for(let i=0;i<W*H;i++)px[i*4+3]=Math.min(px[i*4+3],Math.round(a[i]));
}
/* colours for the drawn parts: skin from the cheeks, hair from the top of the oval (none when it looks like skin) */
function sample(id){
  const W=id.width,px=id.data,avg=(x0,x1,y0,y1,minA)=>{let r=0,g=0,b=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*W+x)*4;if(px[i+3]>=minA){r+=px[i];g+=px[i+1];b+=px[i+2];n++}}return n>20?[r/n,g/n,b/n]:null};
  const hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  let skin=avg(Math.round(W*.36),Math.round(W*.64),Math.round(W*.5),Math.round(W*.62),200);
  let top=-1;for(let y=0;y<W*.4&&top<0;y++){let n=0;for(let x=Math.round(W*.35);x<Math.round(W*.65);x++)if(px[(y*W+x)*4+3]>200)n++;if(n>12)top=y}
  let hair=top>=0?avg(Math.round(W*.34),Math.round(W*.66),top+3,top+3+Math.round(W*.06),200):null;
  const out={};
  if(skin){skin=skin.map((v,i)=>v+(255-v)*[.1,.08,.06][i]);out.skin=hex(skin)}
  if(hair&&skin){const d=Math.hypot(hair[0]-skin[0],hair[1]-skin[1],hair[2]-skin[2]);if(d>48){hair=hair.map((v,i)=>v+(([42,26,18][i])-v)*.12);out.hair=hex(hair)}}
  return out;
}
const toData=cv=>{let d='';try{d=cv.toDataURL('image/webp',.92)}catch(e){}return/^data:image\/webp/.test(d)?d:cv.toDataURL('image/png')};
function finish(wk,soft){
  const out=document.createElement('canvas');out.width=out.height=PX;const o=out.getContext('2d',{willReadFrequently:true});o.imageSmoothingQuality='high';o.drawImage(wk,0,0,PX,PX);
  const id=o.getImageData(0,0,PX,PX);let n=0;for(let i=3;i<id.data.length;i+=4)if(id.data[i]>16)n++;
  if(n<PX*PX*.04){toast('다 지워졌어요. 되돌리기를 눌러 주세요.');return}
  const colors=sample(id);feather(id,soft);o.putImageData(id,0,0);
  const data=toData(out),done=C.done,t=C.target;cutEl.hidden=true;C=null;
  if(done)done({photo:data,colors,target:t});
}
/* from a file: a picture object, then the cut. The same path whether it is taken or picked. */
let pendingFile=null;
function loadFile(f,cb){
  if(!f)return;const url=URL.createObjectURL(f),im=new Image();
  im.onload=()=>{cb(im)};im.onerror=()=>toast('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.');im.src=url;
}
function fileInputs(){
  let a=document.getElementById('faceFile'),b=document.getElementById('faceCam');
  if(!a){a=document.createElement('input');a.type='file';a.accept='image/*';a.id='faceFile';a.hidden=true;document.body.appendChild(a);
    b=document.createElement('input');b.type='file';b.accept='image/*';b.setAttribute('capture','user');b.id='faceCam';b.hidden=true;document.body.appendChild(b);
    [a,b].forEach(inp=>inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0],t=pendingFile;inp.value='';if(!f||!t)return;loadFile(f,im=>openCut(im,t,res=>applyCut(res)))}));
  }
  return{a,b};
}
async function applyCut(res){
  const t=res.target,r=Object.assign({},get(t.id),{id:t.id});r.expr=Object.assign({},r.expr);
  if(t.kind==='main'){r.photo=res.photo;r.round=false;if(res.colors.skin)r.skin=res.colors.skin;if(!r.hairSet)r.hair=res.colors.hair||r.hair||'';if(res.colors.hair)r.hairAuto=res.colors.hair}
  else r.expr[t.kind]=res.photo;
  if(!r.ko&&r.custom)r.ko='가족 '+(all().filter(x=>x.custom).length);if(!r.en&&r.custom)r.en='Family '+(all().filter(x=>x.custom).length);
  const ok=await save(r);if(ok){renderMgr();toast('사진을 저장했어요.')}
}

/* ---------- the manager ---------- */
let mgrEl=null,armed=null;
const SWATCH=(arr,cur,k,id)=>arr.map(h=>`<button class="fm-sw${cur&&cur.toLowerCase()===h.toLowerCase()?' on':''}" data-act="${k}" data-id="${esc(id)}" data-v="${h}" style="background:${h}" aria-label="색 고르기"></button>`).join('');
function cardHTML(r){
  const L=look(r),has=!!r.photo;
  const pic=has?A.personHead(r.photo,Object.assign({mood:'idle'},L)):'사진 없음';
  const sty=[['short','짧게'],['long','길게'],['bun','올림'],['curl','곱슬']].map(([v,t])=>`<button class="btn small ${L.hairStyle===v?'':'ghost'}" data-act="style" data-id="${esc(r.id)}" data-v="${v}">${t}</button>`).join('');
  const ex=(k,t)=>`<span class="fm-ex">${r.expr[k]?`<img src="${r.expr[k]}" alt=""><button class="btn small ghost" data-act="exdel" data-id="${esc(r.id)}" data-k="${k}">지우기</button>`:`<button class="btn small ghost" data-act="ex" data-id="${esc(r.id)}" data-k="${k}"${has?'':' disabled'}>${t} 사진</button>`}</span>`;
  return `<div class="fm-card" data-id="${esc(r.id)}">
    <div class="fm-top"><div class="fm-pic${has?' has':''}">${pic}</div>
      <div class="fm-names"><input type="text" maxlength="10" data-act="ko" data-id="${esc(r.id)}" value="${esc(r.ko)}" placeholder="부를 이름 (예: 할머니)" aria-label="이름"><input type="text" maxlength="16" data-act="en" data-id="${esc(r.id)}" value="${esc(r.en)}" placeholder="영어 이름 (예: Grandma)" aria-label="영어 이름"></div></div>
    <div class="fm-row"><button class="btn small alt" data-act="cam" data-id="${esc(r.id)}">사진 찍기</button><button class="btn small alt" data-act="pick" data-id="${esc(r.id)}">사진 고르기</button><button class="btn small ghost" data-act="del" data-id="${esc(r.id)}"${has||r.custom||mem.has(r.id)?'':' disabled'}>${armed===r.id?'정말 지울까요?':'지우기'}</button></div>
    <div class="fm-row"><b>표정(선택)</b>${ex('smile','웃는 얼굴')}${ex('wow','놀란 얼굴')}</div>
    <div class="fm-row"><b>머리</b>${sty}</div>
    <div class="fm-row"><b>머리색</b><button class="btn small ${r.hairSet?'ghost':''}" data-act="hairauto" data-id="${esc(r.id)}">사진 색</button>${SWATCH(HAIRS,r.hairSet?r.hair:'','hair',r.id)}</div>
    <div class="fm-row"><b>옷 색</b>${SWATCH(CLOTHES,L.cloth,'cloth',r.id)}</div>
  </div>`;
}
function renderMgr(){
  if(!mgrEl||mgrEl.hidden)return;const box=$('#fmList');if(!box)return;const sc=mgrEl.querySelector('.sheet').scrollTop;
  box.innerHTML=all().map(cardHTML).join('');mgrEl.querySelector('.sheet').scrollTop=sc;
}
function openManager(){
  css();fileInputs();
  mgrEl=modal('faceMgr',`<div class="sheet" role="dialog" aria-label="우리 가족 얼굴">
    <h3>우리 가족 얼굴</h3>
    <p class="hint">사진은 이 기기 안에만 저장되고 어디로도 보내지 않아요. 얼굴만 오려서 캐릭터 얼굴로 써요. 자리마다 사진을 넣으면 미용실 손님, 칭찬 손뼉, 크리스마스 액자에 나와요.</p>
    <div id="fmList" style="display:contents"></div>
    <button class="btn alt" id="fmAdd">+ 얼굴 추가</button>
    <button class="btn" id="fmClose">닫기</button></div>`);
  mgrEl.hidden=false;armed=null;renderMgr();
  mgrEl.onclick=async e=>{
    const b=e.target.closest('[data-act]');if(!b||b.tagName==='INPUT')return;const act=b.dataset.act,id=b.dataset.id;
    if(act!=='del')armed=null;
    if(act==='cam'||act==='pick'){const{a,b:c}=fileInputs();pendingFile={id,kind:'main'};(act==='cam'?c:a).click();return}
    if(act==='ex'){const{a}=fileInputs();pendingFile={id,kind:b.dataset.k};a.click();return}
    const r=Object.assign({},get(id),{id});
    if(act==='exdel'){r.expr=Object.assign({},r.expr);delete r.expr[b.dataset.k];await save(r);renderMgr();return}
    if(act==='style'){r.hairStyle=b.dataset.v;await save(r);renderMgr();return}
    if(act==='hair'){r.hair=b.dataset.v;r.hairSet=true;await save(r);renderMgr();return}
    if(act==='hairauto'){r.hairSet=false;r.hair=r.hairAuto||'';await save(r);renderMgr();return}
    if(act==='cloth'){r.cloth=b.dataset.v;await save(r);renderMgr();return}
    if(act==='del'){if(armed!==id){armed=id;renderMgr();setTimeout(()=>{if(armed===id){armed=null;renderMgr()}},3500);return}armed=null;
      if(SLOTS.some(s=>s.id===id)){await remove(id)}else await remove(id);renderMgr();return}
  };
  mgrEl.onchange=async e=>{const i=e.target.closest('input[data-act]');if(!i)return;const r=Object.assign({},get(i.dataset.id),{id:i.dataset.id});const v=i.value.trim();
    if(i.dataset.act==='ko')r.ko=v;else r.en=v;await save(r);renderMgr()};
  $('#fmAdd').onclick=async()=>{const r=await add();if(r){renderMgr();const c=mgrEl.querySelector(`.fm-card[data-id="${r.id}"]`);if(c){c.scrollIntoView({block:'center'});const i=c.querySelector('input');if(i)i.focus()}}};
  $('#fmClose').onclick=()=>{mgrEl.hidden=true;armed=null;changed()};
}
Faces.openManager=openManager;
Faces.closeManager=()=>{if(mgrEl)mgrEl.hidden=true};
/* tests: the same cut path without the dialog (frame as 0..1 of the picture) */
Faces.__cutDirect=async(id,kind,dataUrl,fr)=>{
  const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=dataUrl});
  return new Promise(res=>{openCut(im,{id,kind:kind||'main'},async r=>{await applyCut(r);res(true)});
    if(fr){C.fr.cx=fr.cx*SZ;C.fr.cy=fr.cy*SZ;C.fr.rx=fr.rx*SZ}C.draw();C.__step2();$('#fcNext').click()})};
})();
