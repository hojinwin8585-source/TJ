// background.js v5.1 — SPA 대응 페이지네이션

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

let G = {
  waitSec: 60,
  isWaiting: false,
  waitStart: null,
  results: [],
  config: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    nextSel: null,
    isRunning: false,
  }
};
let waitTimer = null;
let paginationTabId = null;

async function getActiveTab() {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t;
}

async function injectIfNeeded(tabId) {
  try { await chrome.tabs.sendMessage(tabId, { type: 'PING' }); }
  catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['inject.css'] });
      await new Promise(r => setTimeout(r, 600));
      // 주입 후 PING으로 준비 확인 (최대 1초)
      for (let i = 0; i < 5; i++) {
        try { await chrome.tabs.sendMessage(tabId, { type: 'PING' }); break; } catch {}
        await new Promise(r => setTimeout(r, 200));
      }
    } catch(e) { console.error('inject failed', e); }
  }
}

function broadcastPanel(msg) { chrome.runtime.sendMessage(msg).catch(() => {}); }

// ── 일반 페이지 로드 감지 (URL 바뀌는 사이트용) ─────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!G.pagination.isRunning) return;
  if (tabId !== paginationTabId) return;
  if (G._waitingForSPA) return; // SPA 모드면 여기서 처리 안 함

  await new Promise(r => setTimeout(r, 1500));
  await injectIfNeeded(tabId);

  let bc; try { bc = await chrome.tabs.sendMessage(tabId, { type: 'CHECK_BOT' }); } catch {}
  if (bc?.isBot) { handleBotDetected(tabId); return; }

  await scrapeAndContinue(tabId);
});

function handleBotDetected(tabId) {
  if (G.isWaiting) return;
  G.isWaiting = true; G.waitStart = Date.now();
  broadcastPanel({ type: 'BOT_START', sec: G.waitSec });
  if (waitTimer) clearTimeout(waitTimer);
  waitTimer = setTimeout(async () => {
    G.isWaiting = false; G.waitStart = null;
    broadcastPanel({ type: 'BOT_END' });
    await scrapeAndContinue(tabId);
  }, G.waitSec * 1000);
}

// ── SPA/URL 페이지 이동 후 변화 감지 ────────────────────────────────
async function clickAndWaitForChange(tabId, selector, containerSel) {
  // 클릭 전 URL 기억 (쿠팡 등 301/URL 방식 페이지네이션 감지용)
  const tabBefore = await chrome.tabs.get(tabId).catch(() => null);
  const urlBefore = tabBefore?.url || '';

  const before = await chrome.tabs.sendMessage(tabId, {
    type: 'GET_FIRST_ITEM_TEXT', containerSel
  }).catch(() => null);

  const clicked = await chrome.tabs.sendMessage(tabId, {
    type: 'CLICK_NEXT', selector
  }).catch(() => ({ clicked: false }));

  if (!clicked?.clicked) return false;

  // 최대 15초 대기 (500ms × 30)
  let failStreak = 0;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));

    // URL 변경 감지 (쿠팡 301 리다이렉트 등)
    const tabNow = await chrome.tabs.get(tabId).catch(() => null);
    if (tabNow?.url && tabNow.url !== urlBefore) {
      // URL이 바뀐 경우 → 페이지 완전 로드 대기 후 재주입
      await new Promise(r => setTimeout(r, 1500));
      await injectIfNeeded(tabId).catch(() => {});
      return true;
    }

    try {
      const after = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_FIRST_ITEM_TEXT', containerSel
      });
      failStreak = 0;
      if (after?.text && after.text !== before?.text) {
        await new Promise(r => setTimeout(r, 400));
        return true;
      }
    } catch {
      failStreak++;
      // 연속 3번 실패 = URL 이동 중 → 재주입 시도
      if (failStreak === 3) {
        await injectIfNeeded(tabId).catch(() => {});
      }
    }
  }
  // 타임아웃 → 그냥 진행 (마지막 페이지 등)
  return true;
}

async function scrapeAndContinue(tabId) {
  if (!G.config || !G.pagination.isRunning) return;

  const currentPage = G.pagination.currentPage;
  broadcastPanel({ type: 'PAGE_SCRAPING', page: currentPage, total: G.pagination.totalPages });

  try {
    await injectIfNeeded(tabId);
    const configWithPage = { ...G.config, page: currentPage };
    const r = await chrome.tabs.sendMessage(tabId, { type: 'DO_SCRAPE', config: configWithPage });

    if (r?.data?.length) {
      G.results = G.results.concat(r.data);
      broadcastPanel({
        type: 'SCRAPE_RESULT',
        data: r.data,
        total: G.results.length,
        page: currentPage,
        totalPages: G.pagination.totalPages,
        pageItemCount: r.data.length
      });
    }

    // 다음 페이지 이동 판단
    if (G.pagination.currentPage < G.pagination.totalPages && G.pagination.nextSel) {
      broadcastPanel({ type: 'PAGE_CHANGED', page: currentPage + 1, totalPages: G.pagination.totalPages });

      // SPA 방식으로 클릭 + DOM 변화 감지
      G._waitingForSPA = true;
      const changed = await clickAndWaitForChange(
        tabId,
        G.pagination.nextSel,
        G.config.containerSel
      );
      G._waitingForSPA = false;

      if (changed) {
        G.pagination.currentPage++;
        await injectIfNeeded(tabId);
        let bc; try { bc = await chrome.tabs.sendMessage(tabId, { type: 'CHECK_BOT' }); } catch {}
        if (bc?.isBot) { handleBotDetected(tabId); return; }
        await scrapeAndContinue(tabId);
      } else {
        G.pagination.isRunning = false;
        broadcastPanel({ type: 'PAGINATION_DONE', total: G.results.length });
      }
    } else {
      G.pagination.isRunning = false;
      broadcastPanel({ type: 'PAGINATION_DONE', total: G.results.length });
    }
  } catch(e) {
    console.error('scrapeAndContinue error', e);
    G.pagination.isRunning = false;
    broadcastPanel({ type: 'PAGINATION_ERROR', error: e.message });
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'GET_STATE') {
    sendResponse({ ...G, elapsed: G.waitStart ? Math.floor((Date.now() - G.waitStart) / 1000) : 0 });
    return true;
  }
  if (msg.type === 'SET_WAIT') { G.waitSec = msg.sec; sendResponse({ ok: true }); return true; }
  if (msg.type === 'RESET') {
    G.results = []; G.isWaiting = false; G.waitStart = null; G._waitingForSPA = false;
    G.pagination = { currentPage:1, totalPages:1, nextSel:null, isRunning:false };
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === 'CMD_AUTO_DETECT') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab) { sendResponse({ error: 'No tab' }); return; }
      await injectIfNeeded(tab.id);
      try { const r = await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_DETECT' }); sendResponse(r); }
      catch(e) { sendResponse({ error: e.message }); }
    })();
    return true;
  }

  if (msg.type === 'CMD_DETECT_NEXT_BTN') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab) { sendResponse({ error: 'No tab' }); return; }
      await injectIfNeeded(tab.id);
      try { const r = await chrome.tabs.sendMessage(tab.id, { type: 'DETECT_NEXT_BTN' }); sendResponse(r); }
      catch(e) { sendResponse({ error: e.message }); }
    })();
    return true;
  }

  if (msg.type === 'CMD_PICK_NEXT_BTN') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab) { sendResponse({ error: 'No tab' }); return; }
      await injectIfNeeded(tab.id);
      try { const r = await chrome.tabs.sendMessage(tab.id, { type: 'START_PICK_NEXT' }); sendResponse(r); }
      catch(e) { sendResponse({ error: e.message }); }
    })();
    return true;
  }

  if (msg.type === 'NEXT_BTN_PICKED') {
    G.pagination.nextSel = msg.selector;
    broadcastPanel({ type: 'NEXT_BTN_PICKED', selector: msg.selector, sample: msg.sample });
    sendResponse({ ok: true }); return true;
  }

  if (msg.type === 'CMD_SCRAPE') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab) { sendResponse({ error: 'No tab' }); return; }
      await injectIfNeeded(tab.id);
      let bc; try { bc = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_BOT' }); } catch {}
      if (bc?.isBot) {
        if (!G.isWaiting) {
          G.isWaiting = true; G.waitStart = Date.now(); G.config = msg.config;
          broadcastPanel({ type: 'BOT_START', sec: G.waitSec });
          if (waitTimer) clearTimeout(waitTimer);
          waitTimer = setTimeout(async () => {
            G.isWaiting = false; G.waitStart = null;
            broadcastPanel({ type: 'BOT_END' });
            try {
              const r2 = await chrome.tabs.sendMessage(tab.id, { type: 'DO_SCRAPE', config: G.config });
              if (r2?.data?.length) { G.results = G.results.concat(r2.data); broadcastPanel({ type: 'SCRAPE_RESULT', data: r2.data, total: G.results.length, page: 1, totalPages: 1, pageItemCount: r2.data.length }); }
            } catch {}
          }, G.waitSec * 1000);
        }
        sendResponse({ waiting: true }); return;
      }
      try {
        const r = await chrome.tabs.sendMessage(tab.id, { type: 'DO_SCRAPE', config: msg.config });
        if (r?.data) G.results = G.results.concat(r.data);
        sendResponse(r);
      } catch(e) { sendResponse({ error: e.message }); }
    })();
    return true;
  }

  if (msg.type === 'CMD_START_PAGINATION') {
    (async () => {
      const tab = await getActiveTab();
      if (!tab) { sendResponse({ error: 'No tab' }); return; }
      paginationTabId = tab.id;
      G.config = msg.config;
      G.pagination.nextSel = msg.nextSel;
      G.pagination.totalPages = msg.totalPages || 999;
      G.pagination.currentPage = 1;
      G.pagination.isRunning = true;
      G._waitingForSPA = false;
      sendResponse({ ok: true });
      await injectIfNeeded(tab.id);
      await scrapeAndContinue(tab.id);
    })();
    return true;
  }

  if (msg.type === 'CMD_STOP_PAGINATION') {
    G.pagination.isRunning = false;
    G._waitingForSPA = false;
    sendResponse({ ok: true });
    broadcastPanel({ type: 'PAGINATION_DONE', total: G.results.length });
    return true;
  }

  if (msg.type === 'BOT_DETECTED' && sender.tab) {
    handleBotDetected(sender.tab.id);
    sendResponse({ ok: true });
  }

  // ── SELLERPICK 무게 자동조회 ──────────────────────────────────
  if (msg.type === 'CMD_SP_AUTO_WEIGHT') {
    (async () => {
      const spTab = await getActiveTab();
      if (!spTab) { sendResponse({ error: 'No tab' }); return; }
      await injectIfNeeded(spTab.id);

      // 1. 원본 URL 추출
      const urlRes = await chrome.tabs.sendMessage(spTab.id, { type: 'SP_GET_SOURCE_URL' }).catch(() => ({ ok: false }));
      if (!urlRes?.ok) { sendResponse({ error: urlRes?.error || '원본 링크 없음' }); return; }

      // 2. 타오바오 URL에서 상품 ID·플랫폼 추출
      let itemId = null, nat = 'taobao';
      try {
        const u = new URL(urlRes.url);
        itemId = u.searchParams.get('id') || (u.pathname.match(/\/(\d{8,})/) || [])[1];
        nat = u.hostname.includes('tmall') ? 'tmall' : u.hostname.includes('1688') ? '1688' : 'taobao';
      } catch {}
      if (!itemId) { sendResponse({ error: '상품 ID 추출 실패. URL: ' + urlRes.url }); return; }

      // 3. 셀러픽 API로 상품 스펙 조회 (탭 열지 않음, 봇차단 없음)
      const scrape = await chrome.tabs.sendMessage(spTab.id, {
        type: 'SP_FETCH_SPECS', prodNo: itemId, nat
      }).catch(() => ({ ok: false }));

      if (!scrape?.ok) { sendResponse({ error: scrape?.error || '스펙 조회 실패' }); return; }

      // 4. 부피무게 계산 (해운 기준 ÷6000)
      const actual = scrape.weight || 0;
      const vol = scrape.dims ? (scrape.dims.l * scrape.dims.w * scrape.dims.h) / 6000 : 0;
      const billing = Math.max(actual, vol);

      if (!billing) { sendResponse({ error: '이 상품에 무게/치수 정보가 없습니다' }); return; }

      // 5. 셀러픽 무게 필드 입력
      const setRes = await chrome.tabs.sendMessage(spTab.id, {
        type: 'SP_SET_WEIGHT_FIELD', weight: billing.toFixed(2)
      }).catch(() => ({ ok: false }));

      sendResponse({
        ok: true,
        actual: actual || null,
        vol: vol ? +vol.toFixed(2) : null,
        billing: +billing.toFixed(2),
        dims: scrape.dims,
        optWeights: scrape.optWeights || null,
        fieldSet: setRes?.ok
      });
    })();
    return true;
  }

  return true;
});
