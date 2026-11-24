/* 말랑 놀이터 · 우리 물건 (P6)
   어른이 아이의 진짜 물건(장난감·모자·좋아하는 컵)을 사진으로 넣으면, 오려서 알맞은 놀이에 보통 카드처럼 나옵니다.
   ML.Items  list(kind) · get(id) · add({kind,ko,en,img}) · remove(id) · count() · forPlace(place) · seen(place,id) · markSeen(place,id)
             kinds 종류표 · px 사진 크기 · cardId(id) 'photo:ID' · fromCard(cardId) · iga(word)
   어른용 화면: ML.Items.openManager() — 사진 찍기/고르기 → 물건만 따기(faces.js 의 같은 도구: 네모 틀 · 지우개 · 되살리기 · 가장자리 · 배경 자동 지우기)
             → 부를 이름·영어 이름·종류 → 저장. 지우기.
   저장: faces.js 와 같은 IndexedDB(mallang_faces)의 'items' 칸. 안 되면 localStorage(mallang_items_ls). 사진은 이 기기 안에만 있습니다.
   숫자·종류는 MLCFG.ourItems (max, sizePx, kinds, newVoice, voice)에서 읽습니다. 아이 화면에는 글자가 없습니다(이 파일의 글자는 어른용 화면뿐). */
(()=>{
'use strict';
const M=window.ML;if(!M||!M.Faces)return;
const CF=M.CFG||window.MLCFG||{},OI=CF.ourItems||{};
const toast=m=>{try{M.toast(m)}catch(e){}};
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PX=OI.sizePx||384,MAX=OI.max||40;
const KINDS=(OI.kinds&&OI.kinds.length?OI.kinds:[{id:'head',ko:'머리 장식',en:'hat'},{id:'cloth',ko:'옷',en:'clothes'},{id:'hand',ko:'손에 드는 것',en:'toy'},{id:'room',ko:'방 물건',en:'thing'},{id:'xmas',ko:'크리스마스 장식',en:'ornament'}]).map(k=>({id:k.id,ko:k.ko,en:k.en}));
const kindOf=id=>KINDS.find(k=>k.id===id)||KINDS[0];

/* ================= storage ================= */
const DBN='mallang_faces',OS='items',LSK='mallang_items_ls',SEEN='mallang_items_seen';
let db=null,mode='ls';
const mem=new Map();
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}};
function openDB(){return new Promise((res,rej)=>{
  try{if(!window.indexedDB){rej(new Error('no idb'));return}
    const q=indexedDB.open(DBN,2);
    q.onupgradeneeded=()=>{try{['faces',OS].forEach(n=>{if(!q.result.objectStoreNames.contains(n))q.result.createObjectStore(n,{keyPath:'id'})})}catch(e){}};
    q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error||new Error('idb'));q.onblocked=()=>rej(new Error('blocked'));
    setTimeout(()=>rej(new Error('timeout')),4000);
  }catch(e){rej(e)}})}
const tx=(rw,fn)=>new Promise((res,rej)=>{try{const t=db.transaction(OS,rw),r=fn(t.objectStore(OS));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))}catch(e){rej(e)}});
function lsLoad(){try{const o=JSON.parse(lsGet(LSK)||'{}');return Object.keys(o).map(k=>o[k]).filter(r=>r&&r.id&&r.img)}catch(e){return[]}}
function lsSaveAll(){const o={};mem.forEach((r,k)=>{o[k]=r});return lsSet(LSK,JSON.stringify(o))}
async function put(rec){
  if(mode==='idb'){try{await tx('readwrite',s=>s.put(rec));return true}
    catch(e){if(e&&(e.name==='QuotaExceededError'||/quota/i.test(String(e.message))))return false;mode='ls'}}
  return lsSaveAll();
}
async function del(id){
  if(mode==='idb'){try{await tx('readwrite',s=>s.delete(id));return true}catch(e){mode='ls'}}
  return lsSaveAll();
}
const norm=r=>{const k=kindOf(r.kind);return{id:r.id,kind:k.id,ko:String(r.ko||'').trim()||k.ko,en:String(r.en||'').trim()||k.en,img:r.img,ord:r.ord||0}};

/* ================= the list ================= */
const subs=[];
const changed=()=>{subs.forEach(f=>{try{f()}catch(e){}});try{document.dispatchEvent(new CustomEvent('ml-items'))}catch(e){}};
const all=()=>[...mem.values()].sort((a,b)=>(a.ord||0)-(b.ord||0));
const list=kind=>all().filter(r=>!kind||r.kind===kind);
const get=id=>mem.get(id)||null;
const ordOf=()=>{let m=0;mem.forEach(r=>{if(r.ord>m)m=r.ord});return m+1};
async function add(o){
  if(!o||!o.img)return null;
  if(mem.size>=MAX){toast('우리 물건이 너무 많아요. 오래된 물건을 지우고 다시 넣어 주세요.');return null}
  const id='i'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36);
  const rec=norm({id,kind:o.kind,ko:o.ko,en:o.en,img:o.img,ord:ordOf()});
  mem.set(id,rec);
  if(!(await put(rec))){mem.delete(id);toast('저장 공간이 부족해서 사진을 저장하지 못했어요. 다른 물건을 지우고 다시 해 주세요.');return null}
  changed();return rec;
}
async function remove(id){
  const prev=mem.get(id);if(!prev)return true;mem.delete(id);
  const ok=await del(id);if(!ok)mem.set(id,prev);
  try{const s=seenAll();Object.keys(s).forEach(p=>{s[p]=(s[p]||[]).filter(x=>x!==id)});lsSet(SEEN,JSON.stringify(s))}catch(e){}
  changed();return ok;
}
/* which places already showed a thing (the first time it shows, a ribbon and the "new" voice) */
const seenAll=()=>{try{return JSON.parse(lsGet(SEEN)||'{}')||{}}catch(e){return{}}};
const seen=(place,id)=>(seenAll()[place]||[]).includes(id);
function markSeen(place,id){const s=seenAll();s[place]=s[place]||[];if(!s[place].includes(id)){s[place].push(id);lsSet(SEEN,JSON.stringify(s))}}
/* the kinds each place takes */
const PLACES={salon:['head'],clothes:['head','cloth','hand'],room:['room'],xmas:['xmas']};
const forPlace=p=>all().filter(r=>(PLACES[p]||[]).includes(r.kind));
const cardId=id=>'photo:'+id;
const fromCard=c=>String(c).startsWith('photo:')?get(String(c).slice(6)):null;
const iga=w=>{const c=String(w).trim().slice(-1).charCodeAt(0);return(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28)?'이':'가'};
const fill=(t,r)=>String(t||'').replace(/\{ko\}이\(가\)/g,r.ko+iga(r.ko)).replace(/\{ko\}/g,r.ko).replace(/\{en\}/g,r.en);

const Items={px:PX,max:MAX,kinds:KINDS,kindOf,list,all,get,add,remove,count:()=>mem.size,forPlace,seen,markSeen,cardId,fromCard,iga,fill,
  newVoice:()=>OI.newVoice||['새 {ko}이(가) 왔어요!','A new {en}!'],voice:()=>OI.voice||['{ko}!','{en}!'],
  subscribe:f=>{subs.push(f)},
  __state:()=>({mode,ids:all().map(r=>r.id),kinds:all().map(r=>r.kind)}),
  __wipe:async()=>{mem.clear();try{if(db)await tx('readwrite',s=>s.clear())}catch(e){}try{localStorage.removeItem(LSK);localStorage.removeItem(SEEN)}catch(e){}changed()}};
Items.ready=(async()=>{
  try{db=await openDB();mode='idb';const rows=await tx('readonly',s=>s.getAll());(rows||[]).forEach(r=>{if(r&&r.id&&r.img)mem.set(r.id,norm(r))})}
  catch(e){db=null;mode='ls';lsLoad().forEach(r=>mem.set(r.id,norm(r)))}
  changed();
})().catch(()=>{});
M.Items=Items;

/* ================= grown-up screens ================= */
let uiCss=false;
function css(){
  if(uiCss)return;uiCss=true;const st=document.createElement('style');st.textContent=`
#itemMgr .sheet,#itemForm .sheet{max-width:520px;gap:12px}
#itemMgr .im-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px;width:100%}
#itemMgr .im-card{background:var(--bg);border-radius:18px;padding:8px;display:flex;flex-direction:column;gap:6px;align-items:center;font-family:system-ui,sans-serif;font-size:14px;color:var(--ink);text-align:center}
#itemMgr .im-pic,#itemForm .im-pic{width:84px;height:84px;border-radius:14px;background:var(--paper);display:grid;place-items:center;overflow:hidden}
#itemMgr .im-pic img,#itemForm .im-pic img{width:100%;height:100%;object-fit:contain}
#itemMgr .im-kind{color:var(--muted);font-size:12px}
#itemMgr .btn.small,#itemForm .btn.small{font-size:14px;padding:7px 12px}
#itemMgr .im-empty{color:var(--muted);font-size:14px;font-family:system-ui,sans-serif}
#itemForm input[type=text]{width:100%;font-size:16px;border:2px solid var(--hole,#d8d0c4);border-radius:12px;padding:8px 10px;color:var(--ink);background:var(--paper);font-family:system-ui,sans-serif}
#itemForm .im-kinds{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
#itemForm .im-pic{width:120px;height:120px;background:repeating-conic-gradient(#e9e3da 0 25%,#f7f3ec 0 50%) 0 0/16px 16px}
`;(document.head||document.documentElement).appendChild(st);
}
function modal(id,html){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.className='modal';m.id=id;m.hidden=true;document.body.appendChild(m)}m.innerHTML=html;return m}
let pendingKind=null;
function fileInputs(){
  let a=document.getElementById('itemFile'),b=document.getElementById('itemCam');
  if(!a){a=document.createElement('input');a.type='file';a.accept='image/*';a.id='itemFile';a.hidden=true;document.body.appendChild(a);
    b=document.createElement('input');b.type='file';b.accept='image/*';b.setAttribute('capture','environment');b.id='itemCam';b.hidden=true;document.body.appendChild(b);
    [a,b].forEach(inp=>inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
      M.Faces.loadFile(f,im=>M.Faces.cutObject(im,res=>openForm(res.photo)))}));
  }
  return{a,b};
}
let mgr=null,armed=null;
function renderMgr(){
  if(!mgr||mgr.hidden)return;const box=$('#imGrid',mgr);if(!box)return;
  const rs=all();
  box.innerHTML=rs.length?rs.map(r=>`<div class="im-card" data-id="${esc(r.id)}"><div class="im-pic"><img src="${r.img}" alt=""></div><b style="font-weight:400">${esc(r.ko)}</b><span class="im-kind">${esc(kindOf(r.kind).ko)}</span><button class="btn small ghost" data-act="del" data-id="${esc(r.id)}">${armed===r.id?'정말 지울까요?':'지우기'}</button></div>`).join(''):'<p class="im-empty">아직 넣은 물건이 없어요. 아래에서 사진을 넣어 보세요.</p>';
  const cnt=$('#imCount',mgr);if(cnt)cnt.textContent=rs.length+' / '+MAX;
}
function openManager(){
  css();fileInputs();
  mgr=modal('itemMgr',`<div class="sheet" role="dialog" aria-label="우리 물건">
    <h3>우리 물건</h3>
    <p class="hint">아이가 좋아하는 진짜 물건(모자, 장난감, 컵…)을 사진으로 넣으면 놀이에 카드로 나와요. 사진은 이 기기 안에만 저장되고 어디로도 보내지 않아요. 물건만 오려서 쓰고, 종류에 따라 미용실·옷 가게·내 방·크리스마스 집에 나와요. <span id="imCount"></span></p>
    <div class="im-grid" id="imGrid"></div>
    <div class="row" style="justify-content:center"><button class="btn alt" id="imCam">사진 찍기</button><button class="btn alt" id="imPick">사진 고르기</button></div>
    <button class="btn" id="imClose">닫기</button></div>`);
  mgr.hidden=false;armed=null;renderMgr();
  mgr.onclick=async e=>{
    const b=e.target.closest('[data-act="del"]');if(!b)return;const id=b.dataset.id;
    if(armed!==id){armed=id;renderMgr();setTimeout(()=>{if(armed===id){armed=null;renderMgr()}},3500);return}
    armed=null;await remove(id);renderMgr();
  };
  $('#imCam',mgr).onclick=()=>{if(mem.size>=MAX){toast('우리 물건이 너무 많아요. 오래된 물건을 지우고 다시 넣어 주세요.');return}fileInputs().b.click()};
  $('#imPick',mgr).onclick=()=>{if(mem.size>=MAX){toast('우리 물건이 너무 많아요. 오래된 물건을 지우고 다시 넣어 주세요.');return}fileInputs().a.click()};
  $('#imClose',mgr).onclick=()=>{mgr.hidden=true;armed=null};
}
function openForm(img){
  css();let kind=pendingKind||KINDS[0].id;
  const m=modal('itemForm',`<div class="sheet center" role="dialog" aria-label="물건 이름과 종류">
    <h3>이름과 종류</h3>
    <div class="im-pic"><img src="${img}" alt=""></div>
    <input type="text" id="ifKo" maxlength="12" placeholder="부를 이름 (예: 파란 모자)" aria-label="이름">
    <input type="text" id="ifEn" maxlength="20" placeholder="영어 이름 (예: blue hat)" aria-label="영어 이름">
    <div class="im-kinds" id="ifKinds"></div>
    <div class="row" style="justify-content:center"><button class="btn ghost" id="ifCancel">취소</button><button class="btn" id="ifSave">저장</button></div></div>`);
  const draw=()=>{$('#ifKinds',m).innerHTML=KINDS.map(k=>`<button class="btn small ${k.id===kind?'':'ghost'}" data-k="${k.id}">${esc(k.ko)}</button>`).join('')};
  draw();
  m.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;kind=b.dataset.k;pendingKind=kind;draw()};
  $('#ifCancel',m).onclick=()=>{m.hidden=true};
  $('#ifSave',m).onclick=async()=>{
    const r=await add({kind,ko:$('#ifKo',m).value,en:$('#ifEn',m).value,img});
    if(r){m.hidden=true;renderMgr();toast('우리 물건을 넣었어요.')}
  };
  m.hidden=false;
}
Items.openManager=openManager;
Items.closeManager=()=>{if(mgr)mgr.hidden=true};
/* tests: the form's save without typing */
Items.__open=openForm;
})();
