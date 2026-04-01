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
async function checkSellerpickMode() {
  const [t] = await chrome.tabs.query({active:true, lastFocusedWindow:true});
  const isSP = t?.url && t.url.includes('sellerpick') && t.url.includes('shopAdmin');
  document.querySelectorAll('#step1,#step2,#step3').forEach(s => s.style.display = isSP ? 'none' : '');
  document.getElementById('sp-panel').style.display = isSP ? 'block' : 'none';
}

function spNotice(type, txt) {
  const el = document.getElementById('sp-weight-notice');
  el.className='notice n-'+type; el.textContent=txt; el.style.display='block';
}

document.getElementById('sp-btn-weight-auto')?.addEventListener('click', async () => {
  const btn = document.getElementById('sp-btn-weight-auto');
  btn.disabled = true; btn.textContent = '⏳ 조회 중...';
  spNotice('info','원본 페이지 열어서 스펙 파싱 중...');

  const r = await sendBg({type:'CMD_SP_AUTO_WEIGHT'});
  btn.disabled = false; btn.textContent = '🔍 무게 자동 조회';

  if (!r?.ok) {
    spNotice('warn','❌ ' + (r?.error||'실패'));
    return;
  }

  document.getElementById('sp-weight-result').style.display = 'block';
  document.getElementById('sp-w-actual').textContent  = r.actual  ? r.actual+'kg'  : '정보 없음';
  document.getElementById('sp-w-vol').textContent     = r.vol     ? r.vol+'kg'     : '정보 없음';
  document.getElementById('sp-w-dims').textContent    = r.dims    ? `${r.dims.l}×${r.dims.w}×${r.dims.h}` : '정보 없음';
  document.getElementById('sp-w-billing').textContent = r.billing + 'kg';

  // 옵션별 무게 테이블
  const optList = document.getElementById('sp-opt-list');
  const optBody = document.getElementById('sp-opt-tbody');
  if (r.optWeights && r.optWeights.length >= 2) {
    optList.style.display = 'block';
    const vol = r.vol || 0;
    optBody.innerHTML = r.optWeights.map(opt => {
      const billing = Math.max(opt.weight, vol);
      return `<tr>
        <td title="${opt.label}" style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${opt.label.slice(0,18)}</td>
        <td>${opt.weight}kg</td>
        <td>${vol ? vol+'kg' : '-'}</td>
        <td style="color:var(--g);font-weight:700">${billing.toFixed(2)}kg</td>
      </tr>`;
    }).join('');
  } else {
    optList.style.display = 'none';
  }

  if (r.fieldSet) spNotice('ok', `✅ ${r.billing}kg 자동 입력 완료`);
  else spNotice('warn', `조회 성공 (${r.billing}kg) — 필드 입력 실패, 수동 확인 필요`);
});

chrome.tabs?.onActivated?.addListener(()=>checkSellerpickMode());
chrome.tabs?.onUpdated?.addListener((id,info)=>{ if(info.status==='complete') checkSellerpickMode(); });

// ── Init ───────────────────────────────────────────────────────────
checkSellerpickMode();
sendBg({type:'GET_STATE'}).then(s=>{
  if(!s)return;
  if(s.waitSec){waitSlider.value=s.waitSec;waitLbl.textContent=s.waitSec+'초';}
  if(s.isWaiting&&s.waitStart) startBotTimer(s.waitSec,s.elapsed);
  if(s.results?.length){ allResults=s.results; bigNum.textContent=allResults.length; btnDlX.disabled=false; btnDlC.disabled=false; }
  if(s.pagination?.nextSel){ nextBtnSel=s.pagination.nextSel; pgSelTxt.textContent=nextBtnSel.slice(0,30); pgSelTxt.className='pg-val ok'; }
});
