/* 목소리: 기기 목소리 고르기, 말 대기열, 엄마 목소리 녹음 (window.ML_VOICE)
   숫자와 문구는 config 의 voice.tts / voice.recordings 에서 읽습니다. */
(()=>{
const CF=window.MLCFG||{},VO=CF.voice||{},T=VO.tts||{},R=VO.recordings||{};
const SC=T.score||{},PICK=T.parentPicker||{},HELP=T.installHelp||{};
const KEY=PICK.storageKey||'mallang_voice',DB_NAME='mallang_voice_rec';
const SAMPLE=PICK.sample||{ko:'안녕!',en:'Hi!'};
const RATE=T.rate||{ko:.95,en:.9},PITCH=T.pitch||1,GAP=T.gapBetweenLangsMs||0;
const SLOW=T.slowFactor||.8,MAXREC=(R.maxSeconds||4)*1000,TOP=5;
const EN_PREF=T.enPreferLangs||['en-US','en-GB','en-AU'];
const hasTTS='speechSynthesis' in window;
const DUCK_TARGET=.9,DUCK_MAXGAIN=4;

/* ---------- 저장된 고름 ---------- */
let pref=(()=>{try{return Object.assign({ko:'',en:'',rate:'normal'},JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return{ko:'',en:'',rate:'normal'}}})();
const savePref=()=>{try{localStorage.setItem(KEY,JSON.stringify(pref))}catch(e){}};

/* ---------- 목소리 점수 ---------- */
const lc=s=>String(s||'').toLowerCase();
const langOf=v=>String(v.lang||'').replace('_','-');
function score(v,lang){
  const name=lc(v.name);let s=0;
  const has=k=>(SC[k]||[]).some(w=>name.includes(lc(w)));
  if(has('nameContains+5'))s+=5;
  if(has('nameContains+3'))s+=3;
  if(has('nameContains-10'))s-=10;
  if(v.localService&&SC['localService+1'])s+=1;
  if(lang==='en'){const i=EN_PREF.findIndex(l=>lc(l)===lc(langOf(v)));s+=i<0?0:(EN_PREF.length-i)*.1}
  return s;
}
function allVoices(){try{return hasTTS?(speechSynthesis.getVoices()||[]):[]}catch(e){return[]}}
function ranked(lang){
  return allVoices().map((v,i)=>({v,i}))
    .filter(o=>lc(langOf(o.v)).startsWith(lang))
    .map(o=>({v:o.v,i:o.i,s:score(o.v,lang)}))
    .sort((a,b)=>b.s-a.s||a.i-b.i).map(o=>o.v);
}
const vid=v=>v.voiceURI||v.name;
function current(lang){
  const list=ranked(lang),saved=pref[lang];
  if(saved){const f=list.find(v=>vid(v)===saved);if(f)return f}
  return list[0]||null;
}
const rateFor=lang=>(RATE[lang]||1)*(pref.rate==='slow'?SLOW:1);

/* ---------- 문장 비교 (공백·문장부호 무시) ---------- */
const norm=s=>String(s||'').replace(/[^\p{L}\p{N}]/gu,'');

/* ---------- 녹음 저장소 (IndexedDB) ---------- */
let recs=new Map(); // norm(ko) -> {key,ko,en,both,blob}
let dbp=null;
function db(){
  if(dbp)return dbp;
  dbp=new Promise(res=>{
    try{const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=()=>{try{r.result.createObjectStore('rec',{keyPath:'key'})}catch(e){}};
      r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}});
  return dbp;
}
async function dbDo(mode,fn){
  const d=await db();if(!d)return null;
  return new Promise(res=>{try{const tx=d.transaction('rec',mode),st=tx.objectStore('rec'),rq=fn(st);
    tx.oncomplete=()=>res(rq&&rq.result!==undefined?rq.result:true);tx.onerror=tx.onabort=()=>res(null)}catch(e){res(null)}});
}
const loaded=dbDo('readonly',st=>st.getAll()).then(rows=>{if(Array.isArray(rows))rows.forEach(r=>recs.set(r.key,r))});

/* ---------- 소리 재생: 녹음 크기 맞춤 ---------- */
let ac=null,curSrc=null,curAudio=null;
function actx(){
  if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null}}
  if(ac&&ac.state==='suspended')try{ac.resume()}catch(e){}
  return ac;
}
document.addEventListener('pointerdown',()=>actx(),{capture:true});
const bufCache=new WeakMap();
async function decode(blob){
  if(bufCache.has(blob))return bufCache.get(blob);
  const a=actx();if(!a)return null;
  const buf=await a.decodeAudioData(await blob.arrayBuffer());
  let peak=0;for(let c=0;c<buf.numberOfChannels;c++){const d=buf.getChannelData(c);for(let i=0;i<d.length;i++){const x=Math.abs(d[i]);if(x>peak)peak=x}}
  const o={buf,gain:peak>.001?Math.min(DUCK_MAXGAIN,DUCK_TARGET/peak):1};
  bufCache.set(blob,o);return o;
}
function stopAudio(){
  if(curSrc){try{curSrc.onended=null;curSrc.stop()}catch(e){}curSrc=null}
  if(curAudio){try{curAudio.pause();curAudio.onended=null}catch(e){}curAudio=null}
}
function playBlob(blob,done){
  let fin=false;const end=()=>{if(fin)return;fin=true;done&&done()};
  stopAudio();
  const viaEl=()=>{try{const url=URL.createObjectURL(blob),a=new Audio(url);curAudio=a;
    const f=()=>{try{URL.revokeObjectURL(url)}catch(e){}end()};a.onended=f;a.onerror=f;a.play().catch(f)}catch(e){end()}};
  decode(blob).then(o=>{
    if(!o){viaEl();return}
    const a=actx(),src=a.createBufferSource(),g=a.createGain();
    src.buffer=o.buf;g.gain.value=o.gain;src.connect(g);g.connect(a.destination);
    curSrc=src;src.onended=()=>{if(curSrc===src)curSrc=null;end()};src.start();
  }).catch(viaEl);
  return end;
}

/* ---------- 말 대기열 ---------- */
const LOG=[];let q=[],busy=false,gen=0,stopCur=null;
function log(o){LOG.push(o);if(LOG.length>200)LOG.shift()}
function pump(){
  if(busy)return;
  const it=q.shift();if(!it)return;
  busy=true;const g=gen;let fin=false,wd=0;
  const next=()=>{if(fin||g!==gen)return;fin=true;clearTimeout(wd);stopCur=null;busy=false;pump()};
  const abort=()=>{if(fin||g!==gen)return;fin=true;clearTimeout(wd);stopCur=null;busy=false;q=[]};
  if(it.t==='gap'){wd=setTimeout(next,it.ms);stopCur=()=>clearTimeout(wd);return}
  if(it.t==='rec'){
    log({t:'rec',ko:it.rec.ko});
    wd=setTimeout(next,15000);stopCur=()=>{clearTimeout(wd);stopAudio()};
    playBlob(it.rec.blob,next);return;
  }
  /* 기기 목소리 */
  if(!hasTTS){busy=false;pump();return}
  try{
    const lang=it.lang==='ko'?'ko-KR':'en-US',u=new SpeechSynthesisUtterance(it.text);
    u.lang=lang;u.rate=rateFor(it.lang);u.pitch=PITCH;
    const v=current(it.lang);if(v){try{u.voice=v}catch(e){}}
    u.onend=next;
    u.onerror=e=>{const er=e&&e.error;if(er==='canceled'||er==='interrupted')abort();else next()};
    log({t:'tts',lang:it.lang,text:it.text,voice:v?v.name:''});
    wd=setTimeout(next,2500+it.text.length*420/Math.max(.5,u.rate));
    stopCur=()=>clearTimeout(wd);
    speechSynthesis.speak(u);
  }catch(e){busy=false;pump()}
}
function cancel(){
  gen++;q=[];busy=false;
  if(stopCur){try{stopCur()}catch(e){}stopCur=null}
  stopAudio();
  if(hasTTS){try{speechSynthesis.cancel()}catch(e){}}
}
function say(ko,en,lang){
  const wantKo=lang!=='en'&&ko,wantEn=lang!=='ko'&&en;
  const items=[];let skipEn=false;
  if(wantKo){
    const r=recs.get(norm(ko));
    if(r){items.push({t:'rec',rec:r});if(r.both)skipEn=true}
    else items.push({t:'tts',lang:'ko',text:ko});
  }
  if(wantEn&&!skipEn){
    if(items.length&&GAP)items.push({t:'gap',ms:GAP});
    items.push({t:'tts',lang:'en',text:en});
  }
  q.push(...items);pump();
}
const speaking=()=>busy||q.length>0||(hasTTS&&(()=>{try{return speechSynthesis.speaking}catch(e){return false}})());
function sample(lang){
  cancel();q.push({t:'tts',lang,text:SAMPLE[lang]||''});pump();
}

/* ---------- 녹음할 문장 (코드에서 실제로 쓰는 글자 그대로) ---------- */
const batchim=w=>{const c=String(w).charCodeAt(String(w).length-1)-0xAC00;return c>=0&&c<11172&&c%28!==0};
function phrases(){
  const L=[],add=(ko,en)=>{if(ko&&!L.some(p=>norm(p.ko)===norm(ko)))L.push({ko,en:en||''})};
  (VO.praise||[]).forEach(p=>add(p.ko,p.en));
  (VO.onWrongPlace||[]).forEach(p=>add(p.ko,p.en));
  Object.values(VO.actionWords||{}).forEach(p=>add(p.ko,p.en));
  (VO.animalNames||[]).forEach(a=>add(a.ko+(batchim(a.ko)?'아':'야')+', 들어와!','Come in, '+a.en+'!'));
  add('누구를 데려올까? 친구를 콕 눌러 봐!','Who comes in next? Tap a friend!');
  add('손가락으로 쓱쓱! 거품을 내 줘!','Rub rub to make bubbles!');
  add('손가락을 대면 샤워기가 따라가요. 거품을 씻어 줘!','The shower follows your finger. Wash the bubbles away!');
  add('손가락을 대면 드라이기가 따라가요. 보송보송 말려 줘!','The dryer follows your finger. Blow dry!');
  const S=CF.sound||{};
  [S.shower,S.dryer].forEach(x=>{if(x&&x.warnBefore)add(x.warnBefore.ko,x.warnBefore.en)});
  add('머리나 목이나 얼굴을 콕 눌러 봐! 예쁘게 꾸며 줘!','Tap the head, neck or face to dress up!');
  add('히히, 간지러워!','Hee hee, that tickles!');
  add('에취!','Achoo!');
  add('부르르!','Shake shake!');
  add('다 꾸몄으면 거울을 콕!','All done? Tap the mirror!');
  add('고마워!','Thank you!');
  add('안녕! 나는 토토야. 같이 놀자!','Hi! I am Toto. Let\'s play!');
  return L;
}

/* ---------- 어른 설정 화면 ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function injectCss(){
  if(document.getElementById('vpCss'))return;
  const s=document.createElement('style');s.id='vpCss';
  s.textContent=`.vp-list{display:flex;flex-direction:column;gap:6px;width:100%}
.vp-opt{display:flex;align-items:center;gap:8px;text-align:left;border:0;border-radius:14px;padding:10px 12px;background:var(--bg);color:var(--ink);font-size:16px;font-family:system-ui,sans-serif}
.vp-opt.on{box-shadow:0 0 0 3px var(--ink);background:var(--paper)}
.vp-opt small{opacity:.6;margin-left:auto}
.vp-help{font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;margin:0}
.vp-card{display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;width:100%;background:var(--bg);border-radius:22px;padding:16px}
.vp-ko{font-size:26px}.vp-en{font-size:18px;opacity:.7}
.vp-rec{width:120px;height:120px;border-radius:50%;border:0;background:var(--berry);font-size:44px;touch-action:none}
.vp-rec.on{box-shadow:0 0 0 8px rgba(224,120,111,.4)}
.vp-nav{display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px}
.vp-acts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.vp-state{font-family:system-ui,sans-serif;font-size:14px}`;
  document.head.appendChild(s);
}
function openModal(html,onClose){
  injectCss();
  const st=$('#settings');if(st)st.hidden=true;
  const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="sheet" role="dialog">${html}<button class="btn alt vp-close">닫기</button></div>`;
  document.body.appendChild(m);
  const close=()=>{cancel();m.remove();onClose&&onClose();if(st)st.hidden=false};
  m.querySelector('.vp-close').onclick=close;
  return{m,close};
}

/* --- 목소리 고르기 --- */
function openPicker(){
  const more={ko:false,en:false};
  const {m}=openModal('<h3>목소리 고르기</h3><div id="vpBody"></div>',()=>{try{speechSynthesis.removeEventListener('voiceschanged',draw)}catch(e){}});
  const body=m.querySelector('#vpBody');
  function section(lang,title){
    const list=ranked(lang),cur=current(lang),shown=more[lang]?list:list.slice(0,TOP);
    let h=`<h4>${title}</h4><div class="vp-list" data-lang="${lang}">`;
    if(!list.length)h+='<p class="vp-help">이 기기에는 쓸 수 있는 목소리가 없어요.</p>';
    shown.forEach(v=>{h+=`<button class="vp-opt${cur&&vid(cur)===vid(v)?' on':''}" data-id="${esc(vid(v))}"><span>${esc(v.name)}</span><small>${esc(langOf(v))}</small></button>`});
    if(list.length>TOP&&!more[lang])h+=`<button class="btn small alt vp-more" data-lang="${lang}">더 보기 (${list.length-TOP})</button>`;
    return h+'</div>';
  }
  function draw(){
    let h=section('ko','한국어 목소리')+section('en','영어 목소리');
    h+=`<div class="row"><span>빠르기</span><div class="seg" id="vpRate"><button data-v="slow" class="${pref.rate==='slow'?'on':''}">천천히</button><button data-v="normal" class="${pref.rate!=='slow'?'on':''}">보통</button></div></div>`;
    h+='<h4>좋은 목소리 내려받기</h4>';
    if(HELP.iPhone)h+=`<p class="vp-help"><b>아이폰</b> ${esc(HELP.iPhone)}</p>`;
    if(HELP.Android)h+=`<p class="vp-help"><b>안드로이드</b> ${esc(HELP.Android)}</p>`;
    if(HELP.note)h+=`<p class="vp-help">${esc(HELP.note)}</p>`;
    body.innerHTML=h;
  }
  draw();
  try{speechSynthesis.addEventListener('voiceschanged',draw)}catch(e){}
  body.addEventListener('click',e=>{
    const mo=e.target.closest('.vp-more');if(mo){more[mo.dataset.lang]=true;draw();return}
    const o=e.target.closest('.vp-opt');
    if(o){const lang=o.parentNode.dataset.lang;pref[lang]=o.dataset.id;savePref();draw();sample(lang);return}
    const r=e.target.closest('#vpRate button');
    if(r){pref.rate=r.dataset.v;savePref();draw();sample('ko')}
  });
}

/* --- 엄마 목소리 녹음 --- */
const recSupported=()=>typeof MediaRecorder!=='undefined'&&!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
function openRecorder(){
  const P=phrases();let i=0,pending=null,both=false,stream=null,mr=null,chunks=[],pressed=false,t0=0,limitT=0,msg='';
  const {m}=openModal('<h3>엄마 목소리 녹음</h3><div id="rcBody"></div>',()=>{if(stream){stream.getTracks().forEach(t=>{try{t.stop()}catch(e){}});stream=null}});
  const body=m.querySelector('#rcBody');
  const rec=()=>recs.get(norm(P[i].ko));
  function draw(){
    const p=P[i],r=rec(),n=P.filter(x=>recs.has(norm(x.ko))).length;
    const bothOn=pending?both:(r?r.both:both);
    body.innerHTML=`<div class="vp-nav"><button class="btn small alt" id="rcPrev" aria-label="이전">◀</button><span class="vp-state">${i+1} / ${P.length} · 녹음됨 ${n}개</span><button class="btn small alt" id="rcNext" aria-label="다음">▶</button></div>
<div class="vp-card"><div class="vp-ko">${esc(p.ko)}</div><div class="vp-en">${esc(p.en)}</div>
<button class="vp-rec${pressed?' on':''}" id="rcRec" aria-label="누르는 동안 녹음">🎙️</button>
<div class="vp-state" id="rcState">${esc(msg||(pending?'녹음했어요. 들어 보고 저장해요.':r?'녹음됨':'버튼을 누르고 있는 동안 녹음해요 (최대 '+(MAXREC/1000)+'초)'))}</div>
<label class="vp-state"><input type="checkbox" id="rcBoth"${bothOn?' checked':''}> 영어도 함께 (영어 기기 목소리는 생략)</label>
<div class="vp-acts"><button class="btn small alt" id="rcPlay"${pending||r?'':' disabled'}>들어 보기</button>
<button class="btn small" id="rcSave"${pending?'':' disabled'}>저장</button>
<button class="btn small alt" id="rcAgain"${pending?'':' disabled'}>다시</button>
<button class="btn small alt" id="rcDel"${r?'':' disabled'}>지우기</button></div></div>
<div class="row"><span>전체 지우기</span><button class="btn small alt" id="rcAll"${n?'':' disabled'}>${n?'모두 지우기':'없음'}</button></div>`;
    bindRec();
  }
  async function ensureStream(){
    if(stream&&stream.active)return stream;
    stream=await navigator.mediaDevices.getUserMedia({audio:true});return stream;
  }
  function stopRec(){
    pressed=false;clearTimeout(limitT);
    if(mr&&mr.state!=='inactive'){try{mr.stop()}catch(e){}}
    const b=body.querySelector('#rcRec');if(b)b.classList.remove('on');
  }
  async function startRec(){
    if(pressed)return;pressed=true;msg='';cancel();
    const b=body.querySelector('#rcRec');if(b)b.classList.add('on');
    try{await ensureStream()}catch(e){pressed=false;msg='마이크를 쓸 수 없어요. 마이크 사용을 허용해 주세요.';draw();return}
    if(!pressed)return;
    try{
      chunks=[];mr=new MediaRecorder(stream);t0=performance.now();
      mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
      mr.onstop=()=>{
        const dur=performance.now()-t0;
        if(dur<300||!chunks.length){msg='조금 더 길게 눌러 주세요.';pending=null}
        else{pending=new Blob(chunks,{type:mr.mimeType||chunks[0].type||'audio/webm'});msg='';const r=rec();both=r?r.both:both}
        draw();
      };
      mr.start();limitT=setTimeout(stopRec,MAXREC);
    }catch(e){pressed=false;msg='녹음을 시작하지 못했어요.';draw()}
  }
  function bindRec(){
    const b=body.querySelector('#rcRec');
    b.addEventListener('pointerdown',e=>{e.preventDefault();startRec()});
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>{if(pressed)stopRec()}));
    b.addEventListener('contextmenu',e=>e.preventDefault());
    body.querySelector('#rcPrev').onclick=()=>{pending=null;msg='';i=(i+P.length-1)%P.length;cancel();draw()};
    body.querySelector('#rcNext').onclick=()=>{pending=null;msg='';i=(i+1)%P.length;cancel();draw()};
    body.querySelector('#rcBoth').onchange=async e=>{
      both=e.target.checked;const r=rec();
      if(r&&!pending){r.both=both;await dbDo('readwrite',st=>st.put(r))}
    };
    body.querySelector('#rcPlay').onclick=()=>{const bl=pending||(rec()&&rec().blob);if(bl){cancel();playBlob(bl)}};
    body.querySelector('#rcAgain').onclick=()=>{pending=null;msg='';draw()};
    body.querySelector('#rcSave').onclick=async()=>{
      if(!pending)return;const p=P[i],r={key:norm(p.ko),ko:p.ko,en:p.en,both,blob:pending,ts:Date.now()};
      recs.set(r.key,r);pending=null;msg='저장했어요.';
      await dbDo('readwrite',st=>st.put(r));draw();
    };
    body.querySelector('#rcDel').onclick=async()=>{const k=norm(P[i].ko);recs.delete(k);await dbDo('readwrite',st=>st.delete(k));pending=null;msg='';draw()};
    body.querySelector('#rcAll').onclick=async function(){
      if(this.dataset.sure!=='1'){this.dataset.sure='1';this.textContent='정말 지울까요? 한 번 더';return}
      recs.clear();await dbDo('readwrite',st=>st.clear());pending=null;msg='';draw();
    };
  }
  draw();
  ensureStream().catch(()=>{});
}

function bind(){
  const a=$('#openVoicePick'),b=$('#openRecs');
  if(a)a.onclick=openPicker;
  if(b){if(!recSupported()){const row=b.closest('.row');(row||b).hidden=true}else b.onclick=openRecorder}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();

window.ML_VOICE={say,cancel,speaking,sample,score,ranked,current,norm,phrases,loaded,
  recs:()=>recs,log:()=>LOG.slice(),openPicker,openRecorder};
})();
