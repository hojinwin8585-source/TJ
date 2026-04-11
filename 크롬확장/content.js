// content.js v8 — 쿠팡/네이버 사이트별 분기 + lazy-load 스크롤 대응
(function(){
  if(window.__NWS7__)return; window.__NWS7__=true;

  // ── 사이트 감지 ───────────────────────────────────────
  function detectSite(){
    const url=location.hostname;
    if(url.includes('coupang'))return 'coupang';
    if(url.includes('naver')||url.includes('smartstore'))return 'naver';
    return 'other';
  }
  const SITE=detectSite();

  function isBot(){
    const t=(document.title+(document.body?.innerText||'')+location.href).toLowerCase();
    return ['자동입력 방지','보안문자','captcha','비정상적인 접근','접근이 제한','robot check',
            '자동화된 요청','unusual traffic','are you human','인증이 필요','보안 인증'].some(k=>t.includes(k));
  }
  if(isBot()) chrome.runtime.sendMessage({type:'BOT_DETECTED'}).catch(()=>{});

  // ── Bot overlay ────────────────────────────────────────
  function showBotOverlay(sec){
    let ov=document.getElementById('nws-bot-overlay');
    if(!ov){
      ov=document.createElement('div'); ov.id='nws-bot-overlay';
      ov.innerHTML=`<div id="nws-bot-box"><h3>⚠️ 봇 감지 페이지</h3><p>잠시 후 자동으로 스크래핑을 재시작합니다.</p><div id="nws-bot-cnt">${sec}</div><div id="nws-bot-sub">초 후 자동 시작</div></div>`;
      document.body.appendChild(ov);
    }
    ov.classList.add('show');
    let r=sec;
    const iv=setInterval(()=>{ r--; const el=document.getElementById('nws-bot-cnt'); if(el)el.textContent=r; if(r<=0){clearInterval(iv);ov.classList.remove('show');} },1000);
  }

  // ── Selector generator ─────────────────────────────────
  function getSelector(el){
    if(!el||el===document.body)return 'body';
    if(el.id&&!/^\d/.test(el.id))return '#'+CSS.escape(el.id);
    const tag=el.tagName.toLowerCase();
    const cls=Array.from(el.classList).filter(c=>c&&c.length<60&&!/^\d/.test(c)).slice(0,2).map(c=>'.'+CSS.escape(c)).join('');
    const base=cls?tag+cls:tag;
    const par=el.parentElement;
    if(!par||par===document.body)return base;
    const parSel=getSelector(par);
    try{
      const sibs=par.querySelectorAll(':scope > '+base);
      if(sibs.length===1)return parSel+' > '+base;
      const idx=[...par.children].indexOf(el)+1;
      return parSel+' > '+tag+':nth-child('+idx+')';
    }catch{ return parSel+' > '+base; }
  }

  // ── AUTO-DETECT ────────────────────────────────────────
  function autoDetect(){
    const candidates=[];
    function scoreEl(el){
      if(!el||el.tagName==='BODY'||el.tagName==='HTML')return 0;
      const txt=el.innerText||'';
      const h=el.offsetHeight,w=el.offsetWidth;
      if(h<60||w<60||txt.length<10)return 0;
      let s=0;
      if(/[\d,]+원/.test(txt))s+=40;
      if(/\d+,\d{3}/.test(txt))s+=20;
      if(/(리뷰|평점|별점|후기|\d+개)/.test(txt))s+=15;
      if(/(배송|출발|도착|무료)/.test(txt))s+=10;
      if(el.querySelector('img'))s+=15;
      if(h>100&&h<800)s+=10;
      return s;
    }
    const checked=new Set();
    document.querySelectorAll('li,article,[class*="item"],[class*="product"],[class*="goods"],[class*="card"],[class*="prd"],[class*="list_"]').forEach(el=>{
      if(checked.has(el))return; checked.add(el);
      const score=scoreEl(el); if(score<30)return;
      const par=el.parentElement; if(!par)return;
      const tag=el.tagName.toLowerCase();
      const cls=Array.from(el.classList).filter(c=>c&&c.length<60&&!/^\d/.test(c)).slice(0,2).map(c=>'.'+CSS.escape(c)).join('');
      const fullSel=getSelector(par)+' > '+tag+cls;
      let sibs; try{sibs=[...par.querySelectorAll(':scope > '+tag+(cls||''))]; }catch{sibs=[];}
      if(sibs.length<2)return;
      candidates.push({sel:fullSel,count:sibs.length,score:score*sibs.length,sample:el});
    });
    if(!candidates.length)return null;
    candidates.sort((a,b)=>b.score-a.score);
    const best=candidates[0];
    document.querySelectorAll('.nws-container-hl').forEach(e=>e.classList.remove('nws-container-hl'));
    try{document.querySelectorAll(best.sel).forEach(e=>e.classList.add('nws-container-hl'));}catch{}
    const fields=extractFields(best.sample,best.sel);
    return {containerSel:best.sel,count:best.count,fields};
  }

  function extractFields(containerEl){
    if(!containerEl)return[];

    // ── 셀렉터 생성 헬퍼 ──
    function relSel(el){
      const path=[];let cur=el;
      while(cur&&cur!==containerEl&&cur!==document.body){
        const par=cur.parentElement; if(!par)break;
        const tag=cur.tagName.toLowerCase();
        const cls=Array.from(cur.classList).filter(c=>c&&c.length<60&&!/^\d/.test(c)).slice(0,2).map(c=>'.'+CSS.escape(c)).join('');
        const base=cls?tag+cls:tag;
        try{
          const sibs=[...par.querySelectorAll(':scope > '+base)];
          if(sibs.length===1)path.unshift(base);
          else{const idx=[...par.children].indexOf(cur)+1;path.unshift(tag+':nth-child('+idx+')');}
        }catch{path.unshift(base);}
        cur=par;
      }
      return path.join(' > ');
    }

    // ── 1단계: 일반 DOM 탐색 ──
    const fields=[];
    const seen=new Set();
    containerEl.querySelectorAll('*').forEach(el=>{
      const txt=(el.innerText||'').trim();
      if(!txt||txt.length>200||seen.has(txt))return;
      if([...el.children].filter(c=>(c.innerText||'').trim().length>2).length>3)return;
      const sel=relSel(el); if(!sel)return;
      let name=null;
      if(/^[\d,]+원?$/.test(txt.replace(/\s/g,''))&&(txt.includes(',')||txt.includes('원')))name='가격';
      else if(/평점\s*[\d.]+|★/.test(txt))name='평점';
      else if((/리뷰\s*\d+|후기\s*\d+/.test(txt)||/^\([\d,]+\)$/.test(txt))&&txt.length<30)name='리뷰수';
      else if(/(배송|출발|도착|오늘출발|무료배송)/.test(txt)&&txt.length<=50)name='배송';
      else if(/(BEST|NEW|인증|공식|인기)/.test(txt)&&txt.length<15)name='뱃지';
      else if(el.tagName==='A'&&txt.length>5&&txt.length<100)name='상품명';
      else if(txt.length>5&&txt.length<80&&el.closest('a'))name='상품명';
      else if(/판매자|스토어|몰$/.test(txt)&&txt.length<30)name='판매처';
      else if(txt.length>5&&txt.length<80&&fields.length<8)name='data'+(fields.length+1);
      if(!name)return;
      let fn=name,n=2;
      while(fields.find(f=>f.name===fn)){fn=name+n;n++;}
      seen.add(txt);
      fields.push({name:fn,sel,sample:txt});
    });

    // ── 2단계: 5대 필수 필드 보장 ──
    function ensure(name, finder){
      if(fields.find(f=>f.name===name))return;
      const result=finder();
      if(result) fields.push({name,...result});
    }

    // 상품명 보장: 가장 긴 앵커 텍스트
    ensure('상품명',()=>{
      let best=null,bestLen=0;
      containerEl.querySelectorAll('a').forEach(a=>{
        const t=(a.innerText||'').trim();
        if(t.length>bestLen&&t.length>5&&t.length<120){bestLen=t.length;best=a;}
      });
      if(!best)return null;
      return{sel:relSel(best),sample:(best.innerText||'').trim()};
    });

    // 가격 보장: 원 포함 숫자 텍스트
    ensure('가격',()=>{
      for(const el of containerEl.querySelectorAll('*')){
        const t=(el.innerText||'').trim();
        if(/[\d,]+원/.test(t)&&t.length<30&&[...el.children].length===0)
          return{sel:relSel(el),sample:t};
      }
      return null;
    });

    // 리뷰수 보장: (숫자) 형태
    ensure('리뷰수',()=>{
      for(const el of containerEl.querySelectorAll('*')){
        const t=(el.innerText||'').trim();
        if(/^\([\d,]+\)$/.test(t)||(/리뷰|후기/.test(t)&&/\d/.test(t)&&t.length<30))
          return{sel:relSel(el),sample:t};
      }
      return null;
    });

    // 배송 보장: 도착/출발 포함 텍스트
    ensure('배송',()=>{
      for(const el of containerEl.querySelectorAll('*')){
        const t=(el.innerText||'').trim();
        if(/(도착|출발|배송)/.test(t)&&t.length>3&&t.length<=80&&[...el.children].length===0)
          return{sel:relSel(el),sample:t};
      }
      return null;
    });

    // ── 3단계: 이미지URL 보장 ──
    if(!fields.find(f=>f.name==='이미지URL')){
      const imgEl=containerEl.querySelector('img[data-src]')
               ||containerEl.querySelector('img[data-img-src]')
               ||containerEl.querySelector('img[data-lazy]')
               ||containerEl.querySelector('img[data-original]')
               ||containerEl.querySelector('img[src]:not([src^="data:"])');
      if(imgEl){
        const imgSel=relSel(imgEl);
        const url=imgEl.getAttribute('data-src')||imgEl.getAttribute('data-img-src')||imgEl.getAttribute('data-lazy')||imgEl.getAttribute('data-original')||imgEl.src||'';
        if(imgSel) fields.push({name:'이미지URL',sel:imgSel,sample:url,isImage:true});
      }
    }

    // ── 4단계: 고정 순서 정렬 ──
    const ORDER=['상품명','가격','리뷰수','배송','평점','뱃지','판매처'];
    fields.sort((a,b)=>{
      const ai=ORDER.findIndex(o=>a.name.startsWith(o));
      const bi=ORDER.findIndex(o=>b.name.startsWith(o));
      if(a.name==='이미지URL')return 1;
      if(b.name==='이미지URL')return -1;
      if(ai>=0&&bi>=0)return ai-bi;
      if(ai>=0)return -1;
      if(bi>=0)return 1;
      return 0;
    });
    return fields.slice(0,16);
  }

  // ── AUTO-DETECT NEXT BUTTON ────────────────────────────
  function detectNextBtn(){
    const patterns=[
      // 텍스트 기반
      ...Array.from(document.querySelectorAll('a,button,span')).filter(el=>{
        const t=(el.innerText||el.textContent||'').trim();
        return t==='다음'||t==='>'||t==='›'||t==='→'||t==='다음페이지'||t==='next';
      }),
      // class/aria 기반
      ...document.querySelectorAll('[class*="next"],[aria-label*="다음"],[aria-label*="next"],[class*="pg_next"],[class*="btn_next"],[rel="next"]'),
    ];
    // 화면에 보이는 것만
    const visible=patterns.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.top<window.innerHeight;
    });
    if(!visible.length)return null;
    const el=visible[0];
    const sel=getSelector(el);
    document.querySelectorAll('.nws-next-hl').forEach(e=>e.classList.remove('nws-next-hl'));
    el.classList.add('nws-next-hl');
    return {selector:sel, text:(el.innerText||el.textContent||'').trim().slice(0,20)};
  }

  // ── Pick mode for next button ──────────────────────────
  let pickingNext=false;
  function startPickNext(){
    pickingNext=true;
    document.body.style.cursor='crosshair';
    const tip=document.createElement('div');
    tip.id='nws-pick-tip';
    tip.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#1a2332;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;font-family:sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.4)';
    tip.textContent='👆 다음 페이지 버튼을 클릭하세요';
    document.body.appendChild(tip);

    function onClickNext(e){
      if(!pickingNext)return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const el=e.target;
      const sel=getSelector(el);
      document.querySelectorAll('.nws-next-hl').forEach(x=>x.classList.remove('nws-next-hl'));
      el.classList.add('nws-next-hl');
      pickingNext=false;
      document.body.style.cursor='';
      tip.remove();
      document.removeEventListener('click',onClickNext,true);
      chrome.runtime.sendMessage({type:'NEXT_BTN_PICKED',selector:sel,sample:(el.innerText||el.textContent||'').trim().slice(0,20)});
    }
    document.addEventListener('click',onClickNext,true);
  }

  // ── Scroll to load lazy content ─────────────────────────
  async function scrollToLoadAll(){
    const totalH=document.body.scrollHeight;
    const step=window.innerHeight*0.7;
    let pos=0;
    while(pos<totalH){
      pos+=step;
      window.scrollTo({top:pos,behavior:'smooth'});
      await new Promise(r=>setTimeout(r,300));
    }
    // 최하단 도달 후 추가 대기 (lazy-load 완료)
    window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
    await new Promise(r=>setTimeout(r,800));
    // 최상단 복귀
    window.scrollTo({top:0,behavior:'smooth'});
    await new Promise(r=>setTimeout(r,300));
  }

  // ── 쿠팡 전용 셀렉터 ──────────────────────────────────
  const COUPANG_SELECTORS={
    container:[
      'ul.search-product-list > li',
      '#productList > li',
      '.search-product-list__item',
      '[class*="search-product"] li',
      'ul[class*="product"] > li',
    ],
    name:['a.baby-product-link .name','a .name','.descriptions .name','.name','.product-name','a[class*="product"]'],
    price:['.price-value','em.sale','.base-price .value','.price .value','strong.price-value'],
    image:['img.search-product-wrap-img','dt.image img','img[class*="product"]','img[src*="thumbnail"]'],
    review:['.rating-total-count','.count','[class*="review-count"]','[class*="rating"] .count'],
    delivery:['.arrival-info','.shipping-fee-txt','.badge.rocket','[class*="arrival"]','[class*="delivery"]'],
  };

  // ── 네이버 전용 셀렉터 ─────────────────────────────────
  const NAVER_SELECTORS={
    container:[
      '.product_item',
      '.basicList_item__0T9JD',
      '[class*="product_item"]',
      '[class*="basicList_item"]',
      'li[class*="product"]',
      '.list_item',
    ],
    name:['.product_title','.basicList_title','.product_info_tit a','[class*="product_title"]','[class*="basicList_title"]','a[class*="title"]'],
    price:['.product_num .num','.price_area .price','[class*="product_num"]','[class*="price"] strong','em.num'],
    image:['img.product_img','.product_img img','img[class*="product_img"]','img[class*="thumb"]'],
    review:['.product_etc_count','.etc_count','[class*="etc_count"]'],
    delivery:['.product_delivery','.delivery','[class*="delivery"]'],
  };

  // ── 사이트별 auto-detect 보강 ─────────────────────────
  function siteSpecificDetect(){
    const sels=SITE==='coupang'?COUPANG_SELECTORS:SITE==='naver'?NAVER_SELECTORS:null;
    if(!sels)return null;

    // 컨테이너 찾기
    let containerSel=null, count=0;
    for(const sel of sels.container){
      try{
        const els=document.querySelectorAll(sel);
        if(els.length>=2){containerSel=sel;count=els.length;break;}
      }catch{}
    }
    if(!containerSel)return null;

    // 필드 매핑
    const sample=document.querySelector(containerSel);
    if(!sample)return null;

    const fields=[];
    function findField(name,selList,isImg){
      for(const s of selList){
        try{
          const el=sample.querySelector(s);
          if(el){
            const txt=isImg?(el.getAttribute('data-src')||el.getAttribute('src')||''):(el.innerText||'').trim();
            if(txt||isImg){
              fields.push({name,sel:s,sample:txt.slice(0,60),isImage:!!isImg});
              return;
            }
          }
        }catch{}
      }
    }
    findField('상품명',sels.name);
    findField('가격',sels.price);
    findField('이미지URL',sels.image,true);
    findField('리뷰수',sels.review);
    findField('배송',sels.delivery);

    if(fields.length<2)return null;

    // 하이라이트
    document.querySelectorAll('.nws-container-hl').forEach(e=>e.classList.remove('nws-container-hl'));
    try{document.querySelectorAll(containerSel).forEach(e=>e.classList.add('nws-container-hl'));}catch{}

    return {containerSel,count,fields};
  }

  // ── Scrape ─────────────────────────────────────────────
  function doScrape(config){
    const {containerSel,fields}=config;
    const items=document.querySelectorAll(containerSel);
    const rows=[];
    items.forEach((item,i)=>{
      const row={_페이지:config.page||1,_index:i+1,_url:location.href};
      fields.forEach(f=>{
        try{
          const el=f.sel?item.querySelector(f.sel):item;
          if(el){
            if(f.isImage||el.tagName==='IMG'){
              // lazy-load 대응: 다양한 속성 순서대로 확인
              row[f.name]=el.getAttribute('data-src')||el.getAttribute('data-img-src')
                ||el.getAttribute('data-lazy')||el.getAttribute('data-lazy-src')
                ||el.getAttribute('data-original')||el.getAttribute('data-image')
                ||el.getAttribute('srcset')?.split(',')[0]?.trim()?.split(' ')[0]
                ||el.src||'';
            } else {
              row[f.name]=(el.innerText||'').trim().replace(/\n+/g,' ');
              const a=el.tagName==='A'?el:(el.closest('a')||el.querySelector('a'));
              if(a?.href)row[f.name+'_링크']=a.href;
            }
          } else {
            if(f.name==='이미지URL'){
              const img=item.querySelector('img[data-src],img[data-img-src],img[data-lazy-src],img[data-original],img[src]:not([src^="data:"])');
              row[f.name]=img?(img.getAttribute('data-src')||img.getAttribute('data-img-src')
                ||img.getAttribute('data-lazy-src')||img.getAttribute('data-original')
                ||img.src||''):'';
            } else row[f.name]='';
          }
        }catch{row[f.name]='';}
      });
      // 유효 필드 2개 이상 있어야 행 추가 (광고/구분자 제거)
      const filled=fields.filter(f=>row[f.name]&&row[f.name].length>1).length;
      if(filled>=2)rows.push(row);
    });
    return rows;
  }

  // ── Click next page ────────────────────────────────────
  async function clickNext(selector){
    try{
      let el=document.querySelector(selector);
      if(!el)return false;

      // 저장된 셀렉터가 페이지 번호를 가리키면(이전 버튼 추가로 nth-child 밀림) 다음 버튼 재탐색
      const elText=(el.innerText||el.textContent||'').trim();
      if(/^\d+$/.test(elText)){
        const detected=detectNextBtn();
        if(detected){ const newEl=document.querySelector(detected.selector); if(newEl) el=newEl; }
      }

      // 1) 버튼이 보이는 위치로 스크롤
      el.scrollIntoView({behavior:'smooth',block:'center'});
      await new Promise(r=>setTimeout(r,600));

      // 2) 페이지 맨 아래까지 스크롤 (사람처럼)
      window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
      await new Promise(r=>setTimeout(r,800));

      // 3) 다시 버튼 위치로 스크롤
      el.scrollIntoView({behavior:'smooth',block:'center'});
      await new Promise(r=>setTimeout(r,400));

      // 4) 실제 마우스 이벤트 시퀀스
      const rect=el.getBoundingClientRect();
      const cx=Math.round(rect.left+rect.width/2);
      const cy=Math.round(rect.top+rect.height/2);
      const base={bubbles:true,cancelable:true,view:window,
                  clientX:cx,clientY:cy,screenX:cx+window.screenX,screenY:cy+window.screenY};
      el.dispatchEvent(new MouseEvent('mouseover', {...base}));
      el.dispatchEvent(new MouseEvent('mousemove', {...base}));
      el.dispatchEvent(new MouseEvent('mousedown', {...base,button:0,buttons:1}));
      await new Promise(r=>setTimeout(r,80));
      el.dispatchEvent(new MouseEvent('mouseup',   {...base,button:0,buttons:0}));
      el.dispatchEvent(new MouseEvent('click',     {...base,button:0,buttons:0}));

      // 5) anchor면 href 이동
      const anchor=el.tagName==='A'?el:el.closest('a');
      if(anchor?.href && !anchor.href.startsWith('javascript') && !anchor.href.startsWith('#')){
        await new Promise(r=>setTimeout(r,100));
        window.location.href=anchor.href;
      }
      return true;
    }catch{return false;}
  }

  function getFirstItemText(containerSel){
    try{
      const el=document.querySelector(containerSel);
      return (el?.innerText||'').trim().slice(0,100);
    }catch{return '';}
  }

  // ── Messages ───────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg,_,sendResponse)=>{
    if(msg.type==='PING'){sendResponse({ok:true});return;}
    if(msg.type==='CHECK_BOT'){sendResponse({isBot:isBot()});return;}
    if(msg.type==='SHOW_BOT'){showBotOverlay(msg.sec||60);sendResponse({ok:true});return;}
    if(msg.type==='AUTO_DETECT'){
      try{
        // 사이트 전용 셀렉터 우선 시도, 실패 시 범용 auto-detect
        const r=siteSpecificDetect()||autoDetect();
        sendResponse(r?{ok:true,...r,site:SITE}:{ok:false,error:'감지 실패'});
      }
      catch(e){sendResponse({ok:false,error:e.message});}
      return true;
    }
    if(msg.type==='DETECT_NEXT_BTN'){
      const r=detectNextBtn();
      sendResponse(r?{ok:true,...r}:{ok:false,error:'다음 버튼을 찾지 못했습니다'});
      return true;
    }
    if(msg.type==='START_PICK_NEXT'){
      startPickNext();
      sendResponse({ok:true});
      return true;
    }
    if(msg.type==='DO_SCRAPE'){
      // lazy-load 대응: 스크래핑 전 페이지 전체 스크롤
      scrollToLoadAll().then(()=>{
        try{const data=doScrape(msg.config);sendResponse({data,count:data.length,site:SITE});}
        catch(e){sendResponse({error:e.message});}
      }).catch(e=>sendResponse({error:e.message}));
      return true;
    }
    if(msg.type==='CLICK_NEXT'){
      // async 함수이므로 await 후 응답
      clickNext(msg.selector).then(clicked=>sendResponse({clicked}));
      return true;
    }
    if(msg.type==='GET_FIRST_ITEM_TEXT'){
      sendResponse({text:getFirstItemText(msg.containerSel)});
      return true;
    }
    return true;
  });

  chrome.runtime.sendMessage({type:'PAGE_READY',url:location.href,isBot:isBot(),site:SITE}).catch(()=>{});
})();
