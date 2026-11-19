/* P9 완료 기준 검사: node tests/home.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 390 × 780 화면에서 홈이 스크롤 없이 다 보임 (위 28%: 토토 + 큰 그림 시작 버튼, 아래: 원 4개 + 가운데 집)
   2) 홈과 문 안 화면: 누를 것 110px 이상, 문 안 타일 4개 이하. 놀이가 home.places 대로 제자리에
   3) 단계가 오르면 선물이 생기고, 내 방에 놓은 뒤 앱을 다시 열어도 그대로 있음
   4) 당근: 3판을 끝내면 바구니에 당근 그림 3개, 내 방에서 다 주면 바구니가 비고, 5개째에 선물이 생김
   5) 어른 설정 > 아이 기록에 놀이마다 단계와 별 막대가 보임 (칸을 누르면 단계를 바꿈)
   더: 시작 버튼 · 안내 손(4초) · 문 그림이 자람 · 크리스마스 테마 · 놀이에서 뒤로 가면 그 문 안 · 오류 0 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const W=ms=>p.waitForTimeout(ms);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const fresh=async(settings,extra)=>{await p.goto(URL);await p.evaluate(([s,x])=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify(Object.assign({timer:0},s||{})));
      localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}));Object.keys(x||{}).forEach(k=>localStorage.setItem(k,JSON.stringify(x[k])))},[settings,extra]);await p.reload();await W(700)};
  const go=async(id,ms)=>{await p.evaluate(id=>{document.querySelectorAll('.modal').forEach(m=>{m.hidden=true});window.ML.go(id)},id);await W(ms||900)};
  const CFG=await (async()=>{await fresh();return p.evaluate(()=>window.MLCFG)})();

  /* ---------- 1. one screen ---------- */
  await go('home',1200);
  const h=await p.evaluate(()=>{
    const home=document.getElementById('home'),vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('[hidden]')};
    const r=e=>{const q=e.getBoundingClientRect();return{x:Math.round(q.left),y:Math.round(q.top),w:Math.round(q.width),h:Math.round(q.height),b:Math.round(q.bottom),r:Math.round(q.right)}};
    const btns=[...home.querySelectorAll('button')].filter(vis).filter(e=>getComputedStyle(e).pointerEvents!=='none');
    const top=home.querySelector('.hm-top'),start=home.querySelector('.hm-start'),portals=[...home.querySelectorAll('.hm-portal')],house=home.querySelector('.hm-house');
    const txt=[...start.querySelectorAll('*')].map(e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('')).join('');
    const emo=[...home.querySelectorAll('*')].filter(vis).some(e=>[...e.childNodes].some(n=>n.nodeType===3&&/\p{Extended_Pictographic}/u.test(n.textContent)));
    return{doc:document.scrollingElement.scrollHeight,inner:innerHeight,innerW:innerWidth,home:[home.scrollHeight,home.clientHeight],allIn:btns.every(e=>{const q=e.getBoundingClientRect();return q.top>=0&&q.bottom<=innerHeight&&q.left>=0&&q.right<=innerWidth}),
      top:r(top),start:r(start),portals:portals.map(e=>r(e.querySelector('.pp'))),house:r(house),plays:start.querySelectorAll('.hm-play > svg').length,stars:start.querySelectorAll('.mlp-star').length,txt,emo,
      overflow:getComputedStyle(home).overflowY,grow:portals.map(e=>+e.dataset.grow),toto:!!home.querySelector('.hm-tt svg'),basket:!!home.querySelector('.hm-basket svg')}});
  ok('1. 390×780 홈이 스크롤 없이 다 보임',h.doc<=h.inner&&h.home[0]<=h.home[1]&&h.allIn,`문서 높이 ${h.doc} / 화면 ${h.inner} · 홈 ${h.home.join('/')} · 누를 것이 모두 화면 안: ${h.allIn}`);
  const topR=(h.top.b-10)/h.inner;
  ok('1. 위 28%: 토토 + 당근 바구니 + 큰 그림 시작 버튼(화면 폭 40% 이상)',h.toto&&h.basket&&Math.abs(topR-.28)<.03&&h.start.w>=h.innerW*.4,`위 칸 아래 끝 ${(topR*100).toFixed(1)}% · 시작 버튼 ${h.start.w}×${h.start.h}px (${Math.round(h.start.w/h.innerW*100)}%)`);
  ok('1. 시작 버튼: 오늘의 놀이 3개를 그림으로, 진행은 별 3칸, 아이가 읽을 글자 없음',h.plays===3&&h.stars===3&&!h.txt,`그림 ${h.plays}개 · 별 ${h.stars}칸 · 글자 "${h.txt}"`);
  ok('1. 놀이 마을: 종이 공예 원 4개(각 140px 이상) + 가운데 집',h.portals.length===4&&h.portals.every(q=>Math.min(q.w,q.h)>=140)&&h.house.w>=110,`원 ${h.portals.map(q=>q.w+'px').join(', ')} · 집 ${h.house.w}×${h.house.h}px`);
  ok('1. 홈에 이모지 없음',!h.emo,'');
  await shot('home');

  /* ---------- 2. sizes and counts (home + place screens), games in the right place ---------- */
  const count=()=>p.evaluate(()=>{const scr=document.querySelector('.screen:not([hidden])');
    const els=[...scr.querySelectorAll('button,.dragi,.nail,.prop,.facebtn,.key,.swatch,.piece')].filter(e=>{const r=e.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.top<780&&r.bottom>0&&getComputedStyle(e).pointerEvents!=='none'&&!e.closest('[hidden]')&&!e.closest('.bar')&&!e.closest('.home-top')});
    const s=els.map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
    return{id:scr.id,n:s.length,min:s.length?Math.min(...s):0,tiles:els.filter(e=>e.matches('.tile')).length,arrows:els.filter(e=>e.matches('.sh-pagearrow,.sh-next')).length}});
  const hc=await count(),homeMax=1+(CFG.home.portals||[]).length+1;
  ok('2. 홈: 누를 것 110px 이상, 시작 1 + 원 '+(CFG.home.portals||[]).length+' + 집 1',hc.min>=110&&hc.n===homeMax,`누를 것 ${hc.n}개 · 가장 작은 것 ${hc.min}px`);
  const placeIds=await p.evaluate(()=>Object.values(window.ML.Shell.places).map(P=>P.id));
  for(const id of placeIds){await go(id,700);const c=await count();
    const pages=await p.evaluate(id=>document.querySelectorAll('#'+id+' .sh-dots i').length||1,id);
    let maxTiles=c.tiles;for(let k=1;k<pages;k++){await p.click(`#${id} .sh-pagearrow`);await W(200);maxTiles=Math.max(maxTiles,(await count()).tiles)}
    const room=id==='zone-myroom';
    ok(`2. 문 안 ${id}: 누를 것 110px 이상, 타일 4개 이하`,c.min>=110&&maxTiles<=4&&(room||c.n<=maxTiles+1),`누를 것 ${c.n}개 · 가장 작은 것 ${c.min}px · 한 장의 타일 최대 ${maxTiles}개 · ${pages}장`);
  }
  const where=await p.evaluate(()=>{const o={};Object.entries(window.ML.Shell.places).forEach(([k,P])=>{const el=document.getElementById(P.id);o[k]=el?[...el.querySelectorAll('.tile[data-go]')].map(t=>t.dataset.go):[]});
    o.myroomCards=[...document.querySelectorAll('#zone-myroom .sh-card')].map(c=>c.getAttribute('aria-label'));return o});
  const want={cook:['pizza','bakery','restaurant','dishes2','icecream2'],salon:['petsalon','nailshop','clothes','makeup2','coloring','draw'],learn:['words','maze','jobs','animals','jelly','shapes','trace','explore'],music:['rhythm','music','videos']};
  const misplaced=[];Object.entries(want).forEach(([k,list])=>list.forEach(g=>{if(!where[k].includes(g))misplaced.push(g+'→'+k)}));
  const twice=[].concat(...Object.keys(want).map(k=>where[k])).filter((g,i,a)=>a.indexOf(g)!==i);
  ok('2. 놀이가 제자리에 (아이스크림은 요리 마을, 직업·미로는 배움, 집안일·하루 일과는 내 방), 두 군데 나오는 놀이 없음',!misplaced.length&&!twice.length&&!where.learn.includes('icecream2'),
    `요리 ${where.cook.join(',')} · 꾸미기 ${where.salon.join(',')} · 배움 ${where.learn.join(',')} · 노래 ${where.music.join(',')}${misplaced.length?' · 빠짐 '+misplaced.join(','):''}${twice.length?' · 두 번 '+twice.join(','):''}`);
  await go('zone-myroom',900);
  const roomCards=await p.evaluate(()=>{const out=[];const box=document.querySelector('#zone-myroom .sh-cards');for(let k=0;k<3;k++){box.querySelectorAll('.sh-card').forEach(c=>out.push(c.getAttribute('aria-label')));const n=box.querySelector('.sh-next');if(!n)break;n.click()}return[...new Set(out)]});
  ok('2. 내 방 안: 우리 가족 · 칭찬 도장 · 집안일 · 하루 일과 (그림 카드)',['우리 가족','칭찬 도장','집안일','하루 일과'].every(x=>roomCards.includes(x)),roomCards.join(', '));
  await go('dishes2',1200);await p.click('#dishes2 .sh-back');await W(600);
  const backTo=await p.evaluate(()=>window.ML.current());
  ok('바꾸지 말 것: 놀이에서 뒤로 가면 그 문 안으로',backTo==='zone-cook',`설거지 → ${backTo}`);

  /* ---------- 3. level up → gift → place it → reopen ---------- */
  await fresh();
  const lv=await p.evaluate(()=>{const P=window.ML.Progress,before=window.ML.Room.inbox().length;P.set('pizza',1);let r;for(let i=0;i<P.NEED;i++)r=P.clear('pizza');return{before,after:window.ML.Room.inbox(),up:r.up,level:r.level}});
  ok('3. 단계가 오르면 선물이 생김 (선물 상자로)',lv.up&&lv.after.length===lv.before+1,`피자 ${lv.level}단계 · 선물 상자 ${JSON.stringify(lv.after)}`);
  await go('home',1500);
  const gate=await p.evaluate(()=>document.querySelector('.hm-house').classList.contains('gift'));
  ok('3. 홈의 집 앞에 선물 상자가 보임',gate,'');
  await go('zone-myroom',1000);
  await shot('room_box');
  await p.click('#zone-myroom .rm-box');await W(700);
  const glow=await p.evaluate(()=>[...document.querySelectorAll('#zone-myroom .rm-glow')].map(g=>{const r=g.getBoundingClientRect();return{s:g.dataset.spot,w:Math.round(r.width)}}));
  ok('3. 상자를 콕 → 반짝이는 자리(3개 이하, 110px 이상)',glow.length>=1&&glow.length<=3&&glow.every(g=>g.w>=110),JSON.stringify(glow));
  await shot('room_place');
  /* a tap somewhere else does not place it */
  await p.mouse.click(200,200);await W(300);
  const still=await p.evaluate(()=>window.ML.Room.state().held);
  ok('3. 엉뚱한 곳을 누르면 놓이지 않고 응원 (선물은 그대로 손에)',!!still,still);
  await p.click(`#zone-myroom .rm-glow[data-spot="${glow[0].s}"]`);await W(800);
  const placed=await p.evaluate(()=>window.ML.Room.state().placed);
  await p.reload();await W(700);await go('zone-myroom',1000);
  const after=await p.evaluate(()=>[...document.querySelectorAll('#zone-myroom .rm-spot')].map(e=>e.dataset.spot+':'+e.dataset.gift));
  ok('3. 놓은 선물이 앱을 다시 열어도 그대로',Object.keys(placed).length===1&&after.length===1&&after[0]===Object.entries(placed)[0].join(':'),`저장 ${JSON.stringify(placed)} · 다시 연 뒤 ${after.join(',')}`);
  const giftN=await p.evaluate(()=>window.ART.GIFTS.length);
  ok('3. 선물 그림 20개 이상 (ART.GIFTS)',giftN>=20,giftN+'개');

  /* ---------- 4. carrots ---------- */
  await fresh();
  const rounds=['pizza','dishes','maze','icecream','restaurant'];
  await p.evaluate(g=>{const P=window.ML.Progress;g.slice(0,3).forEach(x=>P.clear(x))},rounds);
  await go('home',700+3*650+900);
  const basket=await p.evaluate(()=>document.querySelectorAll('#home .hm-basket .rm-car').length);
  ok('4. 3판을 끝내면 홈의 바구니에 당근 그림 3개 (숫자 없음)',basket===3,`당근 그림 ${basket}개 · 바구니 글자 "${await p.evaluate(()=>document.querySelector('#home .hm-basket').textContent.trim())}"`);
  await shot('home_carrots');
  await go('zone-myroom',900);
  for(let i=0;i<3;i++){await p.click('#zone-myroom .rm-basket');await W(700)}
  const fed=await p.evaluate(()=>({n:document.querySelectorAll('#zone-myroom .rm-basket .rm-car').length,inbox:window.ML.Room.inbox(),c:window.ML.Room.carrots()}));
  ok('4. 내 방에서 다 주면 바구니가 빔 (아직 선물 없음)',fed.n===0&&fed.c===0&&fed.inbox.length===0,`바구니 당근 ${fed.n}개 · 선물 ${fed.inbox.length}개`);
  await p.evaluate(g=>{const P=window.ML.Progress;g.slice(3).forEach(x=>P.clear(x))},rounds);await W(200);
  await p.click('#zone-myroom .rm-basket');await W(700);
  const four=await p.evaluate(()=>window.ML.Room.inbox().length);
  await p.click('#zone-myroom .rm-basket');await W(800);
  const five=await p.evaluate(()=>({inbox:window.ML.Room.inbox(),small:window.ML.Room.inbox().map(id=>window.ART.GIFTS.find(g=>g.id===id).size),box:!document.querySelector('#zone-myroom .rm-box').hidden}));
  ok('4. 5개째 당근을 주면 작은 선물이 생김',four===0&&five.inbox.length===1&&five.small[0]==='small'&&five.box,`4개째 선물 ${four}개 → 5개째 ${JSON.stringify(five.inbox)} (${five.small}) · 상자 보임 ${five.box}`);
  await W(1600);await shot('room_fed');

  /* ---------- 5. parent record ---------- */
  await go('home',800);
  await p.evaluate(()=>{const P=window.ML.Progress;P.set('pizza',2);P.clear('pizza')});
  const g=await p.locator('#gear').boundingBox();await p.mouse.move(g.x+g.width/2,g.y+g.height/2);await p.mouse.down();await W(2300);await p.mouse.up();await W(400);
  const rec=await p.evaluate(()=>{const m=document.getElementById('settings'),bl=document.getElementById('recordBlock');if(!bl||m.hidden)return null;
    const cells=[...bl.querySelectorAll('.rec-cell')].map(c=>({g:c.dataset.game,lv:c.querySelector('.rl').textContent,stars:c.querySelectorAll('.mlp-star').length,on:c.querySelectorAll('.mlp-star.on').length,svg:!!c.querySelector('.ri svg'),d:c.querySelector('.rd').textContent}));
    return{places:[...bl.querySelectorAll('.rec-place')].map(x=>x.textContent),cells,cols:getComputedStyle(bl.querySelector('.rec-grid')).gridTemplateColumns.split(' ').length,time:bl.querySelector('.rec-h small').textContent}});
  const pz=rec&&rec.cells.find(c=>c.g==='pizza');
  ok('5. 어른 설정 > 아이 기록: 문마다 놀이 칸 3열, 칸마다 그림·단계·별 3칸 막대·마지막 날',!!rec&&rec.places.length>=4&&rec.cols===3&&rec.cells.every(c=>c.stars===3&&c.svg)&&pz&&pz.lv==='2단계'&&pz.on===1&&pz.d==='오늘',
    rec?`${rec.places.join('·')} · 칸 ${rec.cells.length}개 · 피자 ${pz&&pz.lv} 별 ${pz&&pz.on}/3 ${pz&&pz.d} · ${rec.time}`:'설정이 안 열림');
  await p.locator('#recordBlock .rec-cell[data-game="pizza"]').scrollIntoViewIfNeeded();
  await p.click('#recordBlock .rec-cell[data-game="pizza"]');await W(200);
  await shot('parent_record');
  await p.click('#recordBlock .rec-pick button[data-v="3"]');await W(200);
  const set3=await p.evaluate(()=>({lv:window.ML.Progress.get('pizza').level,cell:document.querySelector('#recordBlock .rec-cell[data-game="pizza"] .rl').textContent}));
  ok('5. 칸을 누르면 단계를 바꿀 수 있음',set3.lv===3&&set3.cell==='3단계',JSON.stringify(set3));
  await p.click('#closeSettings');await W(300);

  /* ---------- more: start button, hint hand, growth, christmas ---------- */
  await fresh();await go('home',800);
  const ms=await p.evaluate(()=>window.ML.missions().map(m=>window.ML.missionTarget(m.id)));
  await W(4600);
  const hand=await p.evaluate(()=>{const g=document.querySelector('#home .ghand'),s=document.querySelector('#home .hm-start').getBoundingClientRect();if(!g||!g.classList.contains('on'))return null;const r=g.getBoundingClientRect();return{inside:r.left>=s.left&&r.left<=s.right&&r.top>=s.top&&r.top<=s.bottom}});
  ok('안내 손: 4초 가만히 있으면 시작 버튼을 가리킴',!!hand&&hand.inside,JSON.stringify(hand));
  await p.click('#home .hm-start');await W(900);
  const cur=await p.evaluate(()=>window.ML.current());
  ok('시작 버튼: 오늘의 놀이 첫 번째로 들어감',cur===ms[0],`오늘의 놀이 ${ms.join(', ')} → ${cur}`);
  await p.evaluate(m=>{document.dispatchEvent(new CustomEvent('ml-cheer',{detail:m}))},ms[0]);await go('home',900);
  const one=await p.evaluate(()=>({on:document.querySelectorAll('#home .hm-start .mlp-star.on').length,next:[...document.querySelectorAll('#home .hm-play')].findIndex(e=>e.classList.contains('next'))}));
  ok('시작 버튼: 하나 끝내면 별 1칸, 다음 놀이가 커짐',one.on===1&&one.next===1,JSON.stringify(one));
  for(const m of ms.slice(1)){await go(m,300);await p.evaluate(m=>{document.dispatchEvent(new CustomEvent('ml-cheer',{detail:m}))},m)}
  await go('home',1500);
  const all=await p.evaluate(()=>({on:document.querySelectorAll('#home .hm-start .mlp-star.on').length,inbox:window.ML.Room.inbox().length,today:window.ML.Room.state().todayGift}));
  ok('3개가 끝나면 조용한 축하와 선물 1개 (하루 한 번)',all.on===3&&all.inbox===1&&!!all.today,JSON.stringify(all));
  await go('zone-cook',300);await go('home',800);
  ok('다시 홈에 와도 선물이 또 생기지 않음',(await p.evaluate(()=>window.ML.Room.inbox().length))===1,'');
  const g0=await p.evaluate(()=>window.ML.Home.growOf('cook'));
  await p.evaluate(()=>{const P=window.ML.Progress;['pizza','dishes','restaurant','icecream','bakery'].forEach(g=>P.set(g,3))});await go('home',800);
  const g1=await p.evaluate(()=>+document.querySelector('#home .hm-portal[data-key="cook"]').dataset.grow);
  ok('문 그림이 단계 평균에 따라 자람 (grow 0~3, 숫자 없음)',g1>g0,`요리 마을 grow ${g0} → ${g1}`);
  await fresh({bgmSet:'christmas'});await go('home',1500);
  const xm=await p.evaluate(()=>({snow:document.querySelectorAll('#home .hm-snow i').length,scarf:!!document.querySelector('#home .hm-scarf'),lights:!!document.querySelector('#home .hm-house .hm-lights'),
    paper:document.querySelectorAll('#home .hm-portal .pp > svg.paper-art').length===4&&[...document.querySelectorAll('#home .hm-portal .pp > svg.paper-art')].every(s=>s.innerHTML.includes('#DCE4EE')),caps:document.querySelectorAll('#home .hm-portal .hm-xo').length}));
  ok('크리스마스 테마: 문 그림이 christmas, 집과 문에 눈과 전구, 토토 목도리, 눈송이 10개 이하',xm.paper&&xm.caps===4&&xm.lights&&xm.scarf&&xm.snow>0&&xm.snow<=10,JSON.stringify(xm));
  await shot('home_christmas');
  await fresh();await go('home',900);
  const xm0=await p.evaluate(()=>!document.querySelector('#home .hm-snow')&&!document.querySelector('#home .hm-scarf'));
  ok('크리스마스가 아니면 눈·목도리 없음',xm0,'');

  ok('6. 페이지 오류 없음',errs.length===0,errs.slice(0,5).join(' | '));
  console.log(fails?`\n실패 ${fails}개`:'\nP9 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
