// sidepanel.js v5 — pagination + auto-detect

let detectedConfig = null;
let allResults = [];
let nextBtnSel = null;
let botTimer = null;
let isPaginating = false;
let totalPages = 5;
let previewData = [];

// ── DOM ────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const hdrUrl     = $('hdr-url');
const botAlert   = $('bot-alert');
const baNum      = $('ba-num');
const baBar      = $('ba-bar');
const btnDetect  = $('btn-detect');
const spinDetect = $('spin-detect');
const detectArea = $('detect-area');
const detectRes  = $('detect-result');
const recCnt     = $('rec-cnt');
const tblHead    = $('tbl-head');
const tblBody    = $('tbl-body');
const chips      = $('chips');
const btnRegen   = $('btn-regen');
const btnToStep2 = $('btn-to-step2');
const btnDlX1    = $('btn-dl-x1');
const btnDlC1    = $('btn-dl-c1');
const pgSelTxt   = $('pg-sel-txt');
const pgBox      = $('pg-box');
const btnAutoNext= $('btn-auto-next');
const btnPickNext= $('btn-pick-next');
const pgCount    = $('pg-count');
const waitSlider = $('wait-slider');
const waitLbl    = $('wait-lbl');
const btnToStep3 = $('btn-to-step3');
const sdot       = $('sdot');
const stxt       = $('stxt');
const pgProgress = $('pg-progress');
const progVal    = $('prog-val');
const progBar    = $('prog-bar');
const progPages  = $('prog-pages');
const bigNum     = $('big-num');
const btnScrOnce = $('btn-scrape-once');
const btnScrPages= $('btn-scrape-pages');
const btnStop    = $('btn-stop');
const btnReset   = $('btn-reset');
const btnDlX     = $('btn-dl-x');
const btnDlC     = $('btn-dl-c');
const sNotice    = $('s-notice');

// ── Helpers ────────────────────────────────────────────────────────
function sendBg(msg){ return new Promise(r=>chrome.runtime.sendMessage(msg,r)); }

(async()=>{
  const [t]=await chrome.tabs.query({active:true,currentWindow:true});
  if(t?.url){ try{hdrUrl.textContent=new URL(t.url).hostname;}catch{} }
})();

// Accordion
document.querySelectorAll('.step-hdr').forEach(hdr=>{
  hdr.addEventListener('click',()=>{
    const body=hdr.nextElementSibling, chev=hdr.querySelector('.chev');
    const open=body.classList.contains('open');
    body.classList.toggle('open',!open); chev.classList.toggle('open',!open);
  });
});
function openStep(n){
  document.querySelectorAll('.step-hdr').forEach((hdr,i)=>{
    const body=hdr.nextElementSibling,chev=hdr.querySelector('.chev'),is=i+1===n;
    body.classList.toggle('open',is); chev.classList.toggle('open',is);
  });
}
function markDone(id){ const s=$(id); s.classList.add('done'); s.classList.remove('active'); s.querySelector('.snum').textContent='✓'; }
function markActive(id){ const s=$(id); s.classList.add('active'); }

function setStatus(s){
  const m={ready:{c:'dot-no',t:'대기 중'},scraping:{c:'dot-bl',t:'스크래핑 중...'},waiting:{c:'dot-or',t:'봇 감지 대기 중'},done:{c:'dot-g',t:'완료'},running:{c:'dot-bl',t:'페이지 연속 수집 중...'}};
  const d=m[s]||m.ready; sdot.className='dot '+d.c; stxt.textContent=d.t;
}
function showNotice(type,txt){ sNotice.className='notice n-'+type; sNotice.textContent=txt; sNotice.style.display='block'; }
function hideNotice(){ sNotice.style.display='none'; }

// ── Bot timer ──────────────────────────────────────────────────────
function startBotTimer(total,elapsed=0){
  if(botTimer)clearInterval(botTimer);
  botAlert.classList.add('show');
  let rem=total-elapsed;
  const tick=()=>{
    if(rem<=0){clearInterval(botTimer);botTimer=null;botAlert.classList.remove('show');return;}
    baNum.textContent=rem; baBar.style.width=(rem/total*100)+'%'; rem--;
  };
  tick(); botTimer=setInterval(tick,1000);
}

// ── Render table (Web Scraper style) ──────────────────────────────
function renderTable(rows){
  if(!rows?.length||!detectedConfig){tblHead.innerHTML='<th>데이터 없음</th>';tblBody.innerHTML='';return;}
  const fields=detectedConfig.fields;
  const cols=fields.map(f=>f.name);

  tblHead.innerHTML='<th>#</th>'+cols.map(c=>`<th>${c}<span class="x" data-c="${c}">✕</span></th>`).join('');
  tblHead.querySelectorAll('.x').forEach(x=>{
    x.addEventListener('click',e=>{e.stopPropagation();removeField(x.dataset.c);});
  });
  const preview=rows.slice(0,30);
  tblBody.innerHTML=preview.map((r,i)=>
    `<tr><td>${i+1}</td>${cols.map(c=>`<td title="${r[c]||''}">${(r[c]||'').slice(0,20)}</td>`).join('')}</tr>`
  ).join('');

  // Chips
  chips.innerHTML='';
  fields.forEach(f=>{
    const chip=document.createElement('div'); chip.className='chip';
    chip.innerHTML=`${f.name}<span class="cx" data-n="${f.name}">✕</span>`;
    chip.querySelector('.cx').addEventListener('click',()=>removeField(f.name));
    chips.appendChild(chip);
  });
}

function removeField(name){
  if(!detectedConfig)return;
  detectedConfig.fields=detectedConfig.fields.filter(f=>f.name!==name);
  runPreview();
}

async function runPreview(){
  if(!detectedConfig)return;
  const r=await sendBg({type:'CMD_SCRAPE',config:detectedConfig});
  if(r?.data){ previewData=r.data; recCnt.textContent=r.data.length; renderTable(r.data); }
}

// ── Step 1: Auto detect ────────────────────────────────────────────
btnDetect.addEventListener('click',async()=>{
  spinDetect.style.display='inline-block'; btnDetect.disabled=true;
  const r=await sendBg({type:'CMD_AUTO_DETECT'});
  spinDetect.style.display='none'; btnDetect.disabled=false;

  if(!r?.ok||!r.containerSel){
    detectArea.querySelector('div:last-child')?.remove?.();
    const err=document.createElement('div');
    err.className='notice n-warn mt8';
    err.textContent='😕 감지 실패 — 네이버 쇼핑 또는 다나와 목록 페이지에서 시도해보세요.';
    detectArea.appendChild(err);
    return;
  }
  detectedConfig={containerSel:r.containerSel,fields:r.fields};
  await runPreview();
  detectArea.style.display='none';
  detectRes.style.display='block';
  $('step1').classList.add('done');
});

btnRegen.addEventListener('click',()=>{
  detectArea.style.display='block'; detectRes.style.display='none';
  $('step1').classList.remove('done');
});

btnToStep2.addEventListener('click',()=>{ markDone('step1'); markActive('step2'); openStep(2); });
btnDlX1.addEventListener('click',()=>downloadXlsx(previewData));
btnDlC1.addEventListener('click',()=>downloadCsv(previewData));

// ── Step 2: Pagination ─────────────────────────────────────────────
btnAutoNext.addEventListener('click',async()=>{
  btnAutoNext.disabled=true; btnAutoNext.textContent='🔍 감지 중...';
  const r=await sendBg({type:'CMD_DETECT_NEXT_BTN'});
  btnAutoNext.disabled=false; btnAutoNext.textContent='🔍 자동 감지';
  if(r?.ok){
    nextBtnSel=r.selector;
    pgSelTxt.textContent=`"${r.text}" (${r.selector.slice(0,25)}...)`;
    pgSelTxt.className='pg-val ok';
    pgBox.classList.add('active');
  } else {
    pgSelTxt.textContent='자동 감지 실패 — 직접 선택 시도';
    pgSelTxt.className='pg-val none';
  }
});

btnPickNext.addEventListener('click',async()=>{
  await sendBg({type:'CMD_PICK_NEXT_BTN'});
  btnPickNext.textContent='👆 선택 대기 중...';
  btnPickNext.disabled=true;
});

waitSlider.addEventListener('input',()=>{ waitLbl.textContent=waitSlider.value+'초'; sendBg({type:'SET_WAIT',sec:+waitSlider.value}); });

btnToStep3.addEventListener('click',()=>{ markDone('step2'); markActive('step3'); openStep(3); });

// ── Step 3: Scrape ─────────────────────────────────────────────────
btnScrOnce.addEventListener('click',async()=>{
  if(!detectedConfig){showNotice('warn','⚠️ 먼저 1단계에서 자동 감지를 실행하세요.');return;}
  setStatus('scraping'); btnScrOnce.disabled=true; hideNotice();
  const r=await sendBg({type:'CMD_SCRAPE',config:detectedConfig});
  btnScrOnce.disabled=false;
  if(r?.waiting){setStatus('waiting');showNotice('warn','봇 감지 — 타이머 후 자동 재시작');return;}
  if(r?.error){setStatus('ready');showNotice('warn','오류: '+r.error);return;}
  if(r?.data?.length){
    allResults=allResults.concat(r.data);
    bigNum.textContent=allResults.length;
    btnDlX.disabled=false; btnDlC.disabled=false;
    setStatus('done'); showNotice('ok',`✅ ${r.data.length}건 수집! 총 ${allResults.length}건`);
  } else { setStatus('ready'); showNotice('warn','0건 수집됨. 1단계 재실행을 시도해보세요.'); }
});

btnScrPages.addEventListener('click',async()=>{
  if(!detectedConfig){showNotice('warn','⚠️ 먼저 1단계에서 자동 감지를 실행하세요.');return;}
  if(!nextBtnSel){showNotice('warn','⚠️ 2단계에서 다음 페이지 버튼을 먼저 설정하세요.');return;}

  totalPages=parseInt(pgCount.value)||5;
  isPaginating=true;
  setStatus('running');
  btnScrPages.style.display='none';
  btnScrOnce.style.display='none';
  btnStop.style.display='block';
  pgProgress.style.display='block';
  progPages.textContent=`페이지 1 / ${totalPages}`;
  progBar.style.width='0%';
  hideNotice();

  const r=await sendBg({
    type:'CMD_START_PAGINATION',
    config:detectedConfig,
    nextSel:nextBtnSel,
    totalPages
  });
  if(!r?.ok){ showNotice('warn','페이지네이션 시작 실패'); stopPagination(); }
});

btnStop.addEventListener('click',async()=>{
  await sendBg({type:'CMD_STOP_PAGINATION'});
  stopPagination();
  showNotice('ok',`⏹ 중지됨. 총 ${allResults.length}건 수집`);
});

function stopPagination(){
  isPaginating=false;
  btnScrPages.style.display=''; btnScrOnce.style.display='';
  btnStop.style.display='none';
  setStatus(allResults.length>0?'done':'ready');
}

btnReset.addEventListener('click',()=>{
  allResults=[]; bigNum.textContent='0';
  btnDlX.disabled=true; btnDlC.disabled=true;
  pgProgress.style.display='none'; progBar.style.width='0%';
  stopPagination(); hideNotice(); sendBg({type:'RESET'});
});

btnDlX.addEventListener('click',()=>downloadXlsx(allResults));
btnDlC.addEventListener('click',()=>downloadCsv(allResults));

// ── Background messages ────────────────────────────────────────────
chrome.runtime.onMessage.addListener(msg=>{
  if(msg.type==='BOT_START'){ setStatus('waiting'); startBotTimer(msg.sec,0); }
  if(msg.type==='BOT_END'){   botAlert.classList.remove('show'); setStatus(isPaginating?'running':'scraping'); }

  if(msg.type==='NEXT_BTN_PICKED'){
    nextBtnSel=msg.selector;
    pgSelTxt.textContent=`"${msg.sample}" (${msg.selector.slice(0,25)})`;
    pgSelTxt.className='pg-val ok';
    pgBox.classList.add('active');
    btnPickNext.textContent='🖱 직접 선택'; btnPickNext.disabled=false;
  }

  if(msg.type==='PAGE_SCRAPING'){
    const tp=msg.total||totalPages;
    progPages.textContent=`페이지 ${msg.page} / ${tp} 수집 중...`;
    stxt.textContent=`페이지 ${msg.page} 수집 중...`;
    progBar.style.width=((msg.page-1)/tp*100)+'%';
  }
  if(msg.type==='PAGE_CHANGED'){
    const tp=msg.totalPages||totalPages;
    progPages.textContent=`페이지 ${msg.page} / ${tp} 이동 중...`;
  }
  if(msg.type==='SCRAPE_RESULT'){
    allResults=allResults.concat(msg.data||[]);
    bigNum.textContent=allResults.length;
    const tp=msg.totalPages||totalPages;
    const pg=msg.page||1;
    progBar.style.width=(pg/tp*100)+'%';
    progVal.textContent=`${allResults.length}건 누적 (이번 페이지 ${msg.pageItemCount||msg.data?.length||0}건)`;
    progPages.textContent=`페이지 ${pg} / ${tp} 완료`;
    btnDlX.disabled=false; btnDlC.disabled=false;
    updateLiveTable(msg.data||[]);
  }
  if(msg.type==='PAGINATION_DONE'){
    progBar.style.width='100%';
    progVal.textContent=`총 ${msg.total}건 수집 완료`;
    stopPagination();
    showNotice('ok',`✅ 완료! 총 ${msg.total}건 수집됨`);
    setStatus('done');
  }
  if(msg.type==='PAGINATION_ERROR'){
    stopPagination(); showNotice('warn','오류: '+msg.error);
  }
});

// ── 실시간 수집 목록 ──────────────────────────────────────────────
const liveRows = [];
function updateLiveTable(newData) {
  if(!newData?.length || !detectedConfig) return;
  liveRows.unshift(...newData.slice(0,5)); // 최신 5개를 맨 위에
  if(liveRows.length > 50) liveRows.splice(50); // 최대 50개 유지

  const liveWrap = $('live-wrap');
  const liveBody = $('live-body');
  const liveHead = $('live-head');
  if(!liveWrap) return;

  liveWrap.style.display = 'block';
  const cols = detectedConfig.fields.slice(0,4).map(f=>f.name); // 최대 4컬럼

  liveHead.innerHTML = '<th>페이지</th>' + cols.map(c=>`<th>${c}</th>`).join('');
  liveBody.innerHTML = liveRows.slice(0,15).map(r=>
    `<tr><td class="pg-cell">${r._페이지||1}</td>${cols.map(c=>`<td title="${r[c]||''}">${(r[c]||'').slice(0,18)}</td>`).join('')}</tr>`
  ).join('');
}

// ── XLSX export (SheetJS — 진짜 .xlsx 바이너리) ───────────────────
function downloadXlsx(data){
  if(!data?.length){ showNotice('warn','다운로드할 데이터가 없습니다.'); return; }
  if(typeof XLSX==='undefined'){ showNotice('warn','XLSX 라이브러리 로딩 실패'); return; }
  const ws = XLSX.utils.json_to_sheet(data);
  // 컬럼 너비 자동 조정
  const keys = Object.keys(data[0]);
  ws['!cols'] = keys.map(k=>({ wch: Math.min(40, Math.max(10, k.length+4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '스크래핑결과');
  const site = (data[0]?.['_url']||'').includes('coupang') ? 'coupang' : 'naver';
  XLSX.writeFile(wb, `${site}_${Date.now()}.xlsx`);
}

function downloadCsv(data){
  if(!data?.length)return;
  const keys=Object.keys(data[0]);
  const rows=data.map(r=>keys.map(k=>`"${String(r[k]==null?'':r[k]).replace(/"/g,'""')}"`).join(','));
  const a=Object.assign(document.createElement('a'),{
    href:URL.createObjectURL(new Blob(['\uFEFF'+[keys.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'})),
    download:`naver_${Date.now()}.csv`
  });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── SELLERPICK 모드 ────────────────────────────────────────────────
let spData = null;

async function checkSellerpickMode() {
  const [t] = await chrome.tabs.query({active:true,currentWindow:true});
  const isSP = t?.url && t.url.includes('sellerpick') && t.url.includes('shopAdmin');
  const spPanel = document.getElementById('sp-panel');
  document.querySelectorAll('#step1,#step2,#step3').forEach(s => s.style.display = isSP ? 'none' : '');
  spPanel.style.display = isSP ? 'block' : 'none';
  if (isSP) spLoad();
}

async function spLoad() {
  const r = await sendBg({type:'CMD_SP_GET_DATA'});
  if (!r?.ok) { spNotice('slide','warn','셀러픽 상품 편집 페이지를 열어주세요.'); return; }
  spData = r;

  const titleBox = document.getElementById('sp-title-box');
  titleBox.textContent = r.title || '(상품명 없음)';
  titleBox.style.display = 'block';
  document.getElementById('sp-img-stat').textContent =
    `셀러픽 이미지 ${r.dImgs.length}장 / 알리바바 원본 ${r.aliImgs.length}장 / 옵션 ${r.weights.length}개`;
  document.getElementById('sp-btn-apply').disabled = false;

  // 무게 목록
  const wl = document.getElementById('sp-weight-list');
  if (!r.weights.length) { wl.innerHTML = '<div class="muted">옵션 없음</div>'; }
  else {
    wl.innerHTML = r.weights.map((w,i) => `
      <div class="sp-opt-row">
        <span class="sp-opt-name" title="${w.optColor}">${w.optColor||'옵션'+(i+1)}</span>
        <input type="number" step="0.1" min="0.1" max="30" value="${w.weight}"
          class="sp-w-inp" data-idx="${i}">
        <span class="muted">kg</span>
        <button class="btn btn-g btn-sm sp-w-btn" data-idx="${i}">↑</button>
      </div>`).join('');
    wl.querySelectorAll('.sp-w-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const i = +btn.dataset.idx;
        const val = wl.querySelector(`.sp-w-inp[data-idx="${i}"]`).value;
        const r2 = await sendBg({type:'CMD_SP_SET_WEIGHT', idx:i, weight:val});
        if (r2?.ok) { btn.textContent='✓'; btn.style.background='#27ae60'; }
      });
    });
  }
}

function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function buildMainHtml(title, images, shippingType, addTitle, addShipping) {
  const days = shippingType === '해운' ? '7~14일' : '3~5일';
  const tSlide = addTitle ? `<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:60px 30px;text-align:center;"><p style="color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:5px;font-family:sans-serif;margin-bottom:14px;">LIVERRY GLOBAL</p><p style="color:#fff;font-size:20px;font-weight:800;line-height:1.5;font-family:sans-serif;margin-bottom:22px;">${escH(title)}</p><div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;"><span style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:5px 14px;color:#fff;font-size:11px;">해외직배송</span><span style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:5px 14px;color:#fff;font-size:11px;">정품보장</span><span style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:5px 14px;color:#fff;font-size:11px;">당일출고</span></div></div>` : '';
  const imgs = images.map(u=>`<img style="max-width:800px;width:100%;display:block;" src="${u}">`).join('\n');
  const sSlide = addShipping ? `<div style="background:#fff;padding:32px 20px;text-align:center;font-family:sans-serif;border-top:3px solid #1a1a2e;"><p style="font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:20px;">📦 배송 안내</p><div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;max-width:560px;margin:0 auto;"><div style="background:#f8f9fa;border-radius:10px;padding:16px 18px;min-width:100px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">✈️</div><div style="font-size:10px;color:#999;margin-bottom:3px;">배송방법</div><div style="font-size:13px;font-weight:700;color:#1a1a2e;">해외직배송</div></div><div style="background:#f8f9fa;border-radius:10px;padding:16px 18px;min-width:100px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">💸</div><div style="font-size:10px;color:#999;margin-bottom:3px;">배송비</div><div style="font-size:13px;font-weight:700;color:#1a1a2e;">무료배송</div></div><div style="background:#f8f9fa;border-radius:10px;padding:16px 18px;min-width:100px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">📅</div><div style="font-size:10px;color:#999;margin-bottom:3px;">배송기간</div><div style="font-size:13px;font-weight:700;color:#1a1a2e;">${days}</div></div><div style="background:#f8f9fa;border-radius:10px;padding:16px 18px;min-width:100px;text-align:center;"><div style="font-size:20px;margin-bottom:6px;">🛃</div><div style="font-size:10px;color:#999;margin-bottom:3px;">통관/세금</div><div style="font-size:13px;font-weight:700;color:#1a1a2e;">포함</div></div></div><p style="font-size:10px;color:#bbb;margin-top:14px;">* 배송 기간은 통관 상황에 따라 변동될 수 있습니다</p></div>` : '';
  return `<div style="text-align:center;"><div style="padding:5% 0%;text-align:center;" name="titleWrap"><div style="font-size:1.3em;font-weight:bold;line-height:1.3em;text-align:center;">${escH(title)}</div></div>${tSlide}<div style="margin:auto;max-width:800px;">${imgs}</div>${sSlide}</div>`;
}

function spNotice(area, type, txt) {
  const id = area==='slide' ? 'sp-slide-notice' : 'sp-weight-notice';
  const el = document.getElementById(id);
  el.className='notice n-'+type; el.textContent=txt; el.style.display='block';
}

document.getElementById('sp-btn-load')?.addEventListener('click', spLoad);

document.getElementById('sp-btn-apply')?.addEventListener('click', async () => {
  if (!spData) return;
  const addTitle    = document.getElementById('sp-opt-title').checked;
  const addShipping = document.getElementById('sp-opt-shipping').checked;
  const addAli      = document.getElementById('sp-opt-ali').checked;
  const images = addAli ? [...spData.dImgs, ...spData.aliImgs] : spData.dImgs;
  const html = buildMainHtml(spData.title, images, spData.shippingType||'해운', addTitle, addShipping);
  const r = await sendBg({type:'CMD_SP_SET_MAIN_HTML', html});
  if (r?.ok) spNotice('slide','ok','✅ 슬라이드 적용 완료! 셀러픽에서 저장하세요.');
  else spNotice('slide','warn','적용 실패: '+(r?.error||''));
});

document.getElementById('sp-btn-weight-auto')?.addEventListener('click', async () => {
  const btn = document.getElementById('sp-btn-weight-auto');
  btn.disabled = true; btn.textContent = '⏳ 조회 중...';
  spNotice('weight','info','원본 페이지 열어서 스펙 파싱 중...');

  const r = await sendBg({type:'CMD_SP_AUTO_WEIGHT'});
  btn.disabled = false; btn.textContent = '🔍 무게 자동 조회';

  if (!r?.ok) {
    spNotice('weight','warn','❌ ' + (r?.error||'실패'));
    return;
  }

  document.getElementById('sp-weight-result').style.display = 'block';
  document.getElementById('sp-w-actual').textContent  = r.actual  ? r.actual+'kg'  : '정보 없음';
  document.getElementById('sp-w-vol').textContent     = r.vol     ? r.vol+'kg'     : '정보 없음';
  document.getElementById('sp-w-dims').textContent    = r.dims    ? `${r.dims.l}×${r.dims.w}×${r.dims.h}` : '정보 없음';
  document.getElementById('sp-w-billing').textContent = r.billing + 'kg';

  if (r.fieldSet) spNotice('weight','ok', `✅ ${r.billing}kg 자동 입력 완료`);
  else spNotice('weight','warn', `조회 성공 (${r.billing}kg) 但 필드 입력 실패 — 수동 확인 필요`);
});

chrome.tabs?.onActivated?.addListener(()=>checkSellerpickMode());
chrome.tabs?.onUpdated?.addListener((id,info)=>{ if(info.status==='complete') checkSellerpickMode(); });

// ── Init ───────────────────────────────────────────────────────────
sendBg({type:'GET_STATE'}).then(s=>{
  if(!s)return;
  if(s.waitSec){waitSlider.value=s.waitSec;waitLbl.textContent=s.waitSec+'초';}
  if(s.isWaiting&&s.waitStart) startBotTimer(s.waitSec,s.elapsed);
  if(s.results?.length){ allResults=s.results; bigNum.textContent=allResults.length; btnDlX.disabled=false; btnDlC.disabled=false; }
  if(s.pagination?.nextSel){ nextBtnSel=s.pagination.nextSel; pgSelTxt.textContent=nextBtnSel.slice(0,30); pgSelTxt.className='pg-val ok'; }
});
