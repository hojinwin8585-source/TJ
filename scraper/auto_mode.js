// ══════════════════════════════════════════════════════════════════
// 자동화 모드 (auto_mode.js)
// sidepanel.js 맨 아래에 붙여넣기
// ══════════════════════════════════════════════════════════════════

// ── 대형몰 블랙리스트 ─────────────────────────────────────────────
const BIG_MALLS = [
  '지마켓','g마켓','gmarket','옥션','auction',
  '11번가','쿠팡','coupang','롯데온','롯데몰','lotte',
  '신세계몰','ssg','위메프','티몬','tmon',
  'ak몰','gs샵','cj온스타일','ns홈쇼핑','현대홈쇼핑',
  'h몰','인터파크','interpark','하프클럽','무신사',
  '오늘의집','카카오','네이버쇼핑'
];

function isBigMall(name) {
  const n = (name || '').toLowerCase().replace(/\s/g, '');
  return BIG_MALLS.some(m => n.includes(m));
}

// ── 안전한 랜덤 딜레이 ────────────────────────────────────────────
function rDelay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise(r => setTimeout(r, ms));
}

// ── 진행 상황 UI 업데이트 ─────────────────────────────────────────
let autoTotalCollected = 0;

function updateAutoUI(status, detail = '', pct = null) {
  const s = document.getElementById('auto-status');
  const d = document.getElementById('auto-prog-detail');
  const b = document.getElementById('auto-prog-bar');
  const c = document.getElementById('auto-collect-count');
  if (s) s.textContent = status;
  if (d) d.textContent = detail;
  if (b && pct !== null) b.style.width = Math.min(100, pct) + '%';
  if (c) c.textContent = `수집: ${autoTotalCollected}건`;
}

// ── content.js 주입 확인 ──────────────────────────────────────────
async function ensureContentScript(tabId) {
  for (let i = 0; i < 3; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return true;
    } catch {
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
        await chrome.scripting.insertCSS({ target: { tabId }, files: ['inject.css'] });
      } catch {}
      await rDelay(800, 1200);
    }
  }
  return false;
}

// ── 탭 이동 + 로드 대기 ──────────────────────────────────────────
async function navAndWait(tabId, url, minMs = 3500, maxMs = 7000) {
  await chrome.tabs.update(tabId, { url });
  await rDelay(minMs, maxMs);
  await ensureContentScript(tabId);
}

// ── 페이지에서 스토어 목록 추출 ──────────────────────────────────
async function extractStores(tabId) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const stores = {};

      // ① mall_list 패널 (스토어명 + pageKey)
      document.querySelectorAll('[class*="mall_list"] a[title]').forEach(a => {
        const name = (a.getAttribute('title') || '').trim();
        const pageKey = a.getAttribute('data-shp-page-key') || '';
        if (name && !stores[name]) stores[name] = { name, pageKey, storeId: null };
      });

      // ② 아웃링크에서 storeId 직접 추출
      document.querySelectorAll('a[href*="inflow/outlink"]').forEach(a => {
        try {
          const u = new URL(a.href);
          const inner = decodeURIComponent(u.searchParams.get('url') || '');
          const m = inner.match(/smartstore\.naver\.com\/([^/?&#]+)/);
          const name = (a.getAttribute('title') || a.innerText || '').trim().split('\n')[0];
          if (m?.[1] && m[1] !== 'inflow' && m[1] !== 'main') {
            const key = name || m[1];
            if (!stores[key]) stores[key] = { name: key, pageKey: '', storeId: null };
            stores[key].storeId = m[1];
          }
        } catch {}
      });

      return Object.values(stores);
    }
  });
  return result?.[0]?.result || [];
}

// ── 스토어 1개 크롤링 ─────────────────────────────────────────────
async function scrapeStore(tabId, storeId, storeName, maxPages) {
  const results = [];

  for (let page = 1; page <= maxPages; page++) {
    if (autoShouldStop) break;

    const url = `https://smartstore.naver.com/${storeId}/category/ALL?cp=${page}`;
    await navAndWait(tabId, url, page === 1 ? 3500 : 2500, page === 1 ? 7000 : 5500);

    // 탭 강제 활성화 (getActiveTab이 올바른 탭 반환하도록)
    await chrome.tabs.update(tabId, { active: true });

    // 봇 감지 확인
    let botCheck;
    try { botCheck = await chrome.tabs.sendMessage(tabId, { type: 'CHECK_BOT' }); } catch {}
    if (botCheck?.isBot) {
      updateAutoUI(`⚠️ 봇 감지! 5분 대기 후 재시도...`, storeName);
      await rDelay(5 * 60 * 1000, 5 * 60 * 1000 + 30000);
      await navAndWait(tabId, url, 3000, 6000);
      await chrome.tabs.update(tabId, { active: true });
    }

    // 자동 감지 + 스크랩
    const detected = await sendBg({ type: 'CMD_AUTO_DETECT' });
    if (!detected?.ok || !detected.containerSel) break;

    const r = await sendBg({
      type: 'CMD_SCRAPE',
      config: { containerSel: detected.containerSel, fields: detected.fields, page }
    });

    if (!r?.data?.length) break; // 마지막 페이지
    results.push(...r.data.map(row => ({ ...row, _store: storeName, _storeId: storeId })));

    // 페이지 간 딜레이 (4~9초)
    if (page < maxPages) await rDelay(4000, 9000);
  }

  return results;
}

// ── 메인 자동화 실행 ──────────────────────────────────────────────
let autoShouldStop = false;

async function runAutoMode() {
  const kwText   = (document.getElementById('auto-keywords')?.value || '').trim();
  const webhook  = (document.getElementById('auto-webhook')?.value || '').trim();
  const stMin    = parseInt(document.getElementById('delay-store-min')?.value || '40') * 1000;
  const stMax    = parseInt(document.getElementById('delay-store-max')?.value || '90') * 1000;
  const kwMin    = parseInt(document.getElementById('delay-kw-min')?.value  || '8')  * 60000;
  const kwMax    = parseInt(document.getElementById('delay-kw-max')?.value  || '20') * 60000;
  const maxPages = parseInt(document.getElementById('auto-max-pages')?.value || '3');

  if (!kwText) { alert('키워드를 입력해주세요.'); return; }

  const keywords = kwText.split('\n').map(k => k.trim()).filter(Boolean);
  if (!keywords.length) return;

  // UI 시작 상태
  autoShouldStop = false;
  autoTotalCollected = 0;
  document.getElementById('auto-progress').style.display = 'block';
  document.getElementById('btn-auto-start').style.display = 'none';
  document.getElementById('btn-auto-stop').style.display  = '';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { alert('활성 탭을 찾을 수 없어요.'); return; }

  for (let ki = 0; ki < keywords.length; ki++) {
    if (autoShouldStop) break;

    const keyword = keywords[ki];
    const kwPct   = Math.round((ki / keywords.length) * 100);

    // ① 네이버 쇼핑 검색
    updateAutoUI(
      `[${ki+1}/${keywords.length}] "${keyword}" 검색 중...`, '', kwPct
    );
    const searchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`;
    await navAndWait(tab.id, searchUrl, 4000, 8000);
    await chrome.tabs.update(tab.id, { active: true });

    // ② 스토어 추출 + 필터링
    const allStores = await extractStores(tab.id);
    const valid = allStores.filter(s => s.storeId && !isBigMall(s.name));

    updateAutoUI(
      `[${ki+1}/${keywords.length}] "${keyword}" — ${valid.length}개 스토어`,
      `대형몰 포함 ${allStores.length}개 중 ${allStores.length - valid.length}개 제외`,
      kwPct
    );

    const kwData = [];

    // ③ 스토어별 크롤링
    for (let si = 0; si < valid.length; si++) {
      if (autoShouldStop) break;
      const store = valid[si];

      updateAutoUI(
        `[${ki+1}/${keywords.length}] "${keyword}" → [${si+1}/${valid.length}] ${store.name}`,
        `최대 ${maxPages}페이지 수집 중...`,
        kwPct + Math.round((si / valid.length) * (100 / keywords.length))
      );

      const storeData = await scrapeStore(tab.id, store.storeId, store.name, maxPages);
      kwData.push(...storeData);
      autoTotalCollected += storeData.length;
      updateAutoUI(
        `[${ki+1}/${keywords.length}] "${keyword}" → ${store.name} 완료 (${storeData.length}건)`,
        '', kwPct
      );

      // 스토어 간 랜덤 딜레이
      if (si < valid.length - 1 && !autoShouldStop) {
        const waitMs  = Math.floor(Math.random() * (stMax - stMin) + stMin);
        const waitSec = Math.round(waitMs / 1000);
        updateAutoUI(`⏳ 다음 스토어까지 ${waitSec}초 대기 중...`, valid[si+1]?.name || '');
        await rDelay(waitMs, waitMs + 2000);
      }
    }

    // ④ N8N 전송
    if (webhook && kwData.length) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            count: kwData.length,
            timestamp: new Date().toISOString(),
            data: kwData
          })
        });
        updateAutoUI(`✅ "${keyword}" → N8N 전송 완료 (${kwData.length}건)`, '');
      } catch (e) {
        updateAutoUI(`⚠️ "${keyword}" N8N 전송 실패`, e.message);
      }
    }

    // 기존 allResults에 병합 + 다운로드 버튼 활성화
    allResults = allResults.concat(kwData);
    bigNum.textContent = allResults.length;
    if (allResults.length) { btnDlX.disabled = false; btnDlC.disabled = false; }

    // ⑤ 키워드 간 랜덤 딜레이
    if (ki < keywords.length - 1 && !autoShouldStop) {
      const waitMs  = Math.floor(Math.random() * (kwMax - kwMin) + kwMin);
      const waitMin = Math.round(waitMs / 60000);
      updateAutoUI(
        `⏳ 다음 키워드까지 ${waitMin}분 대기 중...`,
        `다음: ${keywords[ki+1]}`,
        Math.round(((ki+1) / keywords.length) * 100)
      );
      await rDelay(waitMs, waitMs + 10000);
    }
  }

  // 완료
  updateAutoUI(`🎉 완료! 총 ${autoTotalCollected}건 수집`, '', 100);
  document.getElementById('btn-auto-start').style.display = '';
  document.getElementById('btn-auto-stop').style.display  = 'none';
}

// ── 버튼 이벤트 연결 ──────────────────────────────────────────────
document.getElementById('btn-auto-start')?.addEventListener('click', runAutoMode);
document.getElementById('btn-auto-stop')?.addEventListener('click', () => {
  autoShouldStop = true;
  updateAutoUI('⏹ 중지 요청됨... 현재 작업 후 중지');
  document.getElementById('btn-auto-stop').textContent = '중지 중...';
  document.getElementById('btn-auto-stop').disabled = true;
});
