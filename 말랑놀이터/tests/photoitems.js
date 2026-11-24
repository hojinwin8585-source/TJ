/* P6 우리 물건 완료 기준 검사: node tests/photoitems.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치(모바일 화면 390×780), 사진은 사진 고르기와 같은 파일 입력으로 넣습니다.
   1) 물건이 하나도 없을 때: 미용실 머리 카드·옷 가게 카드·내 방 선물 상자·크리스마스 4단계가 예전 그대로
   2) 어른 화면 '우리 물건': 모자(머리 장식)·컵(방 물건)·방울(크리스마스 장식)을 파일 입력 → 물건만 따기(네모 틀·배경 자동 지우기·지우개) → 이름과 종류 → 저장
   3) 미용실 머리 꾸미기 카드에 모자가 나오고 입혀짐 · 옷 가게 머리 자리 카드에 나오고 입혀짐 (옷 종류는 윗옷 자리)
   4) 내 방 선물 상자에서 컵이 나오고 놓임 · 크리스마스 집 4단계 끝에 방울이 나오고 놓임
   5) 다시 열어도 남아 있음(IndexedDB) · 지우면 모든 곳에서 사라짐 · 다 지우면 다시 예전 그대로
   6) 아이 화면에 글자·이모지 없음 · 카드 3장 이하 · 110px 이상 · 페이지 오류 0 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:1});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const cdp=await ctx.newCDPSession(p);
  const W=ms=>p.waitForTimeout(ms);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,'p6_'+n+'.png')})};
  const tap=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(x),y:Math.round(y)}]});await W(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await W(200)};
  const tapEl=async sel=>{const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return{x:q.left+q.width/2,y:q.top+q.height/2}},sel);if(!r)throw new Error('없음 '+sel);await tap(r.x,r.y)};
  const until=(fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:(ms||9000)*2});
  const go=async(id,ms)=>{await p.evaluate(id=>{document.querySelectorAll('.modal').forEach(m=>m.hidden=true);window.ML.go(id)},id);await W(ms||900)};
  const fresh=async()=>{await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});
    await p.evaluate(()=>new Promise(res=>{const q=indexedDB.deleteDatabase('mallang_faces');q.onsuccess=q.onerror=q.onblocked=()=>res()}));await p.reload();await W(600);await p.evaluate(()=>Promise.all([window.ML.Faces.ready,window.ML.Items.ready]))};
  /* the test things: a thing drawn on a plain wall (the cut has to remove the wall) */
  const THING=`(kind)=>{const c=document.createElement('canvas');c.width=c.height=600;const g=c.getContext('2d');g.fillStyle='#cfe3f2';g.fillRect(0,0,600,600);
    if(kind==='hat'){g.fillStyle='#C9473F';g.beginPath();g.ellipse(300,380,230,60,0,0,7);g.fill();g.beginPath();g.moveTo(150,380);g.quadraticCurveTo(150,150,300,140);g.quadraticCurveTo(450,150,450,380);g.fill();g.fillStyle='#F2D58A';g.fillRect(150,330,300,40)}
    else if(kind==='cup'){g.fillStyle='#F2C94C';g.fillRect(190,200,220,240);g.strokeStyle='#F2C94C';g.lineWidth=36;g.beginPath();g.arc(430,320,60,-1.4,1.4);g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(300,320,40,0,7);g.fill()}
    else if(kind==='dress'){g.fillStyle='#E88FB4';g.beginPath();g.moveTo(240,150);g.lineTo(360,150);g.lineTo(450,470);g.lineTo(150,470);g.closePath();g.fill()}
    else{g.fillStyle='#2E9E6B';g.beginPath();g.arc(300,330,150,0,7);g.fill();g.fillStyle='#F2C94C';g.fillRect(270,150,60,50);g.strokeStyle='#fff';g.lineWidth=14;g.beginPath();g.arc(300,330,100,.3,2.2);g.stroke()}
    return c.toDataURL('image/png')}`;
  const mk=k=>p.evaluate(([f,k])=>eval(f)(k),[THING,k]);
  /* the real path: manager → file input → cut (frame, background wash, eraser) → name and kind → save */
  async function addUI(kind,ko,en,thing){
    const url=await mk(thing);
    await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>m.hidden=true);window.ML.Items.openManager()});await W(300);
    await tapEl('#imPick');
    await p.setInputFiles('#itemFile',{name:thing+'.png',mimeType:'image/png',buffer:Buffer.from(url.split(',')[1],'base64')});
    await until(()=>!document.getElementById('faceCut').hidden,null,5000);await W(300);
    const c1=await p.evaluate(()=>({title:document.getElementById('fcTitle').textContent,frame:!document.getElementById('fcFrame').hidden,auto:document.getElementById('fcBg').hidden}));
    if(thing==='hat'){ok('물건만 따기 1단계: 네모 틀 화면',c1.frame&&/물건/.test(c1.title)&&c1.auto,JSON.stringify(c1));await shot('cut1_frame')}
    await p.evaluate(()=>{const r=document.getElementById('fcSize');r.value=0.46;r.dispatchEvent(new Event('input'))});
    await tapEl('#fcNext');await W(400);
    const a0=await p.evaluate(()=>document.getElementById('fcWork').getContext('2d').getImageData(20,20,1,1).data[3]);
    await p.evaluate(()=>{const b=document.getElementById('fcBg');if(b.hidden)throw new Error('배경 자동 지우기 버튼 없음')});
    await tapEl('#fcBg');await W(500);
    const a1=await p.evaluate(()=>document.getElementById('fcWork').getContext('2d').getImageData(20,20,1,1).data[3]);
    if(thing==='hat'){ok('배경 자동으로 지우기: 모서리 배경이 투명해짐',a0>200&&a1<10,`전 ${a0} 후 ${a1}`);await shot('cut2_erased')}
    await tapEl('#fcNext');await W(900);
    if(await p.evaluate(()=>!document.getElementById('faceCut').hidden)){await tapEl('#fcNext');await W(900)}
    await until(()=>!document.getElementById('itemForm').hidden,null,5000);await W(200);
    if(thing==='hat')await shot('form');
    await p.fill('#ifKo',ko);await p.fill('#ifEn',en);await tapEl(`#ifKinds [data-k="${kind}"]`);
    await tapEl('#ifSave');await until(()=>document.getElementById('itemForm').hidden,null,5000);await W(400);
  }
  const textOf=sel=>p.evaluate(sel=>{const scr=document.querySelector(sel);if(!scr)return['(없음)'];
    const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),out=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('style,script'))out.push(t)}return out},sel);
  const noText=async(tag,sel)=>{const t=await textOf(sel);ok('아이 화면에 글자·이모지 없음: '+tag,t.length===0&&!/\p{Extended_Pictographic}/u.test(t.join('')),JSON.stringify(t.slice(0,4)))};

  /* ---------- salon helpers (as tests/p2b.js) ---------- */
  const st=()=>p.evaluate(()=>window.ML.__ps());
  const waitPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ps().phase===ph,ph,{timeout:t});
  const enterLobby=async()=>{await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>m.hidden=true);window.ML.go('home')});await W(300);await p.evaluate(()=>window.ML.go('petsalon'));await waitPhase('lobby',8000);await W(400)};
  const pickParty=async()=>{for(let k=0;k<14;k++){await waitPhase('lobby',20000);const s=await st(),i=s.lobby.findIndex(c=>c&&c.need==='party'&&!c.inside);
      if(i>=0){await p.evaluate(i=>document.querySelector(`.lb-cust[data-i="${i}"]`).click(),i);await p.waitForFunction(()=>window.ML.__ps().view==='salon',null,{timeout:4000});return}
      await p.evaluate(()=>window.ML.__psReset());await enterLobby()}throw new Error('파티 손님 없음')};
  const salonHead=async()=>{await enterLobby();await pickParty();await waitPhase('dress',14000);await W(900);let s=await st();await tap(...s.slotPts.head);await W(500);return st()};
  const headCards=async()=>p.evaluate(()=>[...document.querySelectorAll('#psPanel .ps-card')].map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.item,photo:b.classList.contains('photo'),x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}}));
  /* clothes helpers */
  const cst=()=>p.evaluate(()=>window.ML.__cl());
  const clothesHead=async()=>{await go('home',300);await p.evaluate(()=>window.ML.__clLevel(4));await go('clothes',900);await until(()=>window.ML.__cl().view==='lobby'||window.ML.__cl().mates.length>0,null,8000);
    let s=await cst();await W(600);s=await cst();await tap(s.mates[0][0],s.mates[0][1]);
    for(let k=0;k<3;k++){try{await until(()=>window.ML.__cl().phase==='dress',null,7000);break}catch(e){s=await cst();if(s.mates.length)await tap(s.mates[0][0],s.mates[0][1])}}
    await until(()=>window.ML.__cl().phase==='dress',null,9000);await W(900);s=await cst();return s};
  const clCards=()=>p.evaluate(()=>[...document.querySelectorAll('#clothes .cl-card:not(.out)')].map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.item,ours:b.classList.contains('ours'),x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}}));
  const openSlot=async slot=>{let s=await cst();await tap(...s.slotPts[slot]);await W(900);return clCards()};

  /* ================= 1. zero things: everything as before ================= */
  await fresh();
  let it=await p.evaluate(()=>window.ML.Items.__state());
  ok('저장은 IndexedDB, 물건 0개',it.mode==='idb'&&it.ids.length===0,JSON.stringify(it));
  {let s=await salonHead(),cs=await headCards();
    ok('물건 0개: 미용실 머리 카드는 그림 장식만',cs.length>=2&&cs.length<=3&&cs.every(c=>!c.photo),cs.map(c=>c.id).join(', '));
    await p.evaluate(()=>window.ML.go('home'));await W(300)}
  {await clothesHead();const cs=await openSlot('head');
    ok('물건 0개: 옷 가게 머리 자리 카드는 그림 옷만',cs.length>=2&&cs.every(c=>!c.ours),cs.map(c=>c.id).join(', '))}
  await go('zone-myroom',900);
  {const r=await p.evaluate(()=>({inbox:window.ML.Room.inbox(),box:!document.querySelector('.rm-box').hidden}));
   ok('물건 0개: 내 방에 선물 상자 없음',r.inbox.length===0&&!r.box,JSON.stringify(r))}
  await p.evaluate(()=>window.ML.__xmLevel(4));await go('xmashouse',1200);
  {const x=await p.evaluate(()=>window.ML.__xm());ok('물건 0개: 크리스마스 4단계 할 일 4가지(리스·눈 3번)',x.tasks.join()==='wreath,snow,snow,snow',x.tasks.join())}

  /* ================= 2. add three things the real way ================= */
  await fresh();
  await addUI('head','파란 모자','blue hat','hat');
  it=await p.evaluate(()=>window.ML.Items.__state());
  ok('모자 저장: 머리 장식 1개',it.ids.length===1&&it.kinds[0]==='head',JSON.stringify(it));
  const rec=await p.evaluate(()=>{const r=window.ML.Items.all()[0];return new Promise(res=>{const i=new Image();i.onload=()=>res({ko:r.ko,en:r.en,w:i.naturalWidth,h:i.naturalHeight,type:r.img.slice(0,16)});i.src=r.img})});
  ok('사진은 물건만 오려 384px 이하(256~512)로 저장, 이름은 입력한 대로',rec.ko==='파란 모자'&&rec.en==='blue hat'&&rec.w>=256&&rec.w<=512&&rec.w===rec.h&&/^data:image\/(webp|png)/.test(rec.type),JSON.stringify(rec));
  await p.evaluate(()=>window.ML.Items.openManager());await W(300);await shot('manager');
  {const mg=await p.evaluate(()=>[...document.querySelectorAll('#itemMgr button')].map(b=>{const r=b.getBoundingClientRect();return[b.textContent.trim(),Math.round(r.width),Math.round(r.height)]}));
   ok('어른 화면 단추가 누르기 편한 크기',mg.length>=3,JSON.stringify(mg))}
  await addUI('room','노란 컵','yellow cup','cup');
  await addUI('xmas','초록 방울','green ornament','xmas');
  await p.evaluate(()=>window.ML.Items.add({kind:'cloth',ko:'분홍 드레스',en:'pink dress',img:(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#E88FB4';g.beginPath();g.moveTo(100,20);g.lineTo(156,20);g.lineTo(220,236);g.lineTo(36,236);g.closePath();g.fill();return c.toDataURL('image/png')})()}));await W(300);
  it=await p.evaluate(()=>window.ML.Items.__state());
  ok('4가지 종류 저장(머리 장식·방 물건·크리스마스 장식·옷)',it.ids.length===4&&['head','room','xmas','cloth'].every(k=>it.kinds.includes(k)),it.kinds.join());

  /* ================= 3. salon + clothes ================= */
  {const s=await salonHead(),cs=await headCards(),hat=cs.find(c=>c.photo);
   ok('미용실 머리 카드: 모자가 카드 하나로 섞여 나옴(그림 장식도 함께, 3장 이하)',!!hat&&cs.length>=2&&cs.length<=3&&cs.some(c=>!c.photo),cs.map(c=>c.id+(c.photo?'*':'')).join(', '));
   ok('카드 크기 110px 이상',cs.every(c=>Math.min(c.w,c.h)>=110),cs.map(c=>Math.round(c.w)+'×'+Math.round(c.h)).join(','));
   await shot('salon_cards');await tap(hat.x,hat.y);await W(1100);const s2=await st();
   ok('미용실: 모자를 콕 하면 머리에 써짐',s2.worn.head&&s2.worn.head.photo===true,JSON.stringify(s2.worn));await shot('salon_worn');
   await noText('미용실','#petsalon');
   await p.evaluate(()=>window.ML.go('home'));await W(300)}
  {await clothesHead();let cs=await openSlot('head');const o=cs.find(c=>c.ours);
   ok('옷 가게 머리 자리 카드: 모자가 카드 하나로 나옴(카드 3장 이하, 110px 이상)',!!o&&cs.length>=2&&cs.length<=3&&cs.every(c=>Math.min(c.w,c.h)>=110),cs.map(c=>c.id+(c.ours?'*':'')).join(', '));
   await shot('clothes_cards');await tap(o.x,o.y);await W(400);await until(()=>!window.ML.__cl().busy,null,6000);await W(500);
   let s=await cst();ok('옷 가게: 모자를 입힘',s.wear.head&&/^photo:/.test(s.wear.head.id),JSON.stringify(s.wear));await shot('clothes_worn');
   cs=await openSlot('top');const d=cs.find(c=>c.ours);
   ok('옷 종류(드레스)는 윗옷 자리 카드로 나옴',!!d,cs.map(c=>c.id+(c.ours?'*':'')).join(', '));
   if(d){await tap(d.x,d.y);await W(400);await until(()=>!window.ML.__cl().busy,null,6000);s=await cst();ok('옷 가게: 드레스를 입힘',s.wear.top&&/^photo:/.test(s.wear.top.id),JSON.stringify(s.wear))}
   await noText('옷 가게','#clothes')}

  /* ================= 4. my room + christmas house ================= */
  await go('zone-myroom',900);
  {const r0=await p.evaluate(()=>window.ML.Room.inbox());ok('내 방: 방 물건이 선물 상자에 들어 있음',r0.length===1&&/^photo:/.test(r0[0]),r0.join());
   await shot('room_box');await tapEl('.rm-box');await W(900);
   const g=await p.evaluate(()=>[...document.querySelectorAll('.rm-glow')].map(b=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width]}));
   ok('방 물건을 열면 반짝이는 자리가 3개 이하',g.length>=1&&g.length<=3,g.length+'개');await shot('room_held');
   await tap(g[0][0],g[0][1]);await W(900);const r=await p.evaluate(()=>window.ML.Room.state());
   ok('방 물건이 방에 놓임(저장)',Object.values(r.placed).some(v=>/^photo:/.test(v))&&r.inbox.length===0&&!r.held,JSON.stringify(r.placed));await shot('room_placed');
   await noText('내 방 무대','#zone-myroom .rm-stage')}
  await p.evaluate(()=>window.ML.__xmLevel(4));await go('xmashouse',1200);
  {let x=await p.evaluate(()=>window.ML.__xm());ok('크리스마스 4단계: 우리 물건이 있으면 할 일이 하나 더(방울)',x.tasks.join()==='wreath,snow,snow,snow,deco',x.tasks.join());
   for(let n=0;n<60;n++){x=await p.evaluate(()=>window.ML.__xm());if(x.task==='deco'&&x.phase==='cards')break;
     if(x.phase==='cards'&&x.cards.length)await tap(x.cards[0].x,x.cards[0].y);
     else if(x.phase==='place'&&x.spot)await tap(x.spot.x,x.spot.y);
     else if(x.phase==='tapWin'&&x.winXY)await tap(...x.winXY);
     await W(450)}
   ok('마지막 할 일이 우리 물건 고르기(카드에 그림, 글자 없음)',x.task==='deco'&&x.phase==='cards'&&x.cards.length===1&&Math.min(x.cards[0].w,x.cards[0].h)>=110,JSON.stringify(x.cards));
   await shot('xmas_card');
   await tap(x.cards[0].x,x.cards[0].y);await W(500);x=await p.evaluate(()=>window.ML.__xm());await shot('xmas_place');
   ok('고르면 반짝이는 자리가 나타남',x.phase==='place'&&!!x.spot,x.phase);
   await tap(x.spot.x,x.spot.y);await W(1800);x=await p.evaluate(()=>window.ML.__xm());
   ok('방울이 크리스마스 방에 놓임',!!x.tree.deco&&x.log.some(l=>l==='hang:deco:'+x.tree.deco),JSON.stringify(x.tree.deco));
   await W(2500);await shot('xmas_done');await noText('크리스마스 집','#xmashouse')}

  /* ================= 5. reload keeps them; delete removes them ================= */
  await p.reload();await W(700);await p.evaluate(()=>Promise.all([window.ML.Faces.ready,window.ML.Items.ready]));
  it=await p.evaluate(()=>window.ML.Items.__state());
  ok('다시 열어도 4개가 그대로(IndexedDB)',it.mode==='idb'&&it.ids.length===4,JSON.stringify(it));
  await p.evaluate(()=>window.ML.Items.openManager());await W(400);
  const cards=await p.evaluate(()=>document.querySelectorAll('#itemMgr .im-card').length);
  ok('어른 화면에 4개가 보임',cards===4,String(cards));
  /* delete every one with the two-tap safety */
  for(let k=0;k<4;k++){await tapEl('#itemMgr [data-act="del"]');await W(250);await tapEl('#itemMgr [data-act="del"]');await W(500)}
  it=await p.evaluate(()=>window.ML.Items.__state());
  ok('지우기(두 번 눌러야 지워짐): 모두 사라짐',it.ids.length===0,JSON.stringify(it));
  await p.reload();await W(700);await p.evaluate(()=>Promise.all([window.ML.Faces.ready,window.ML.Items.ready]));
  it=await p.evaluate(()=>window.ML.Items.__state());ok('지운 뒤 다시 열어도 0개',it.ids.length===0,JSON.stringify(it));
  {const s=await salonHead(),cs=await headCards();ok('다 지운 뒤 미용실 머리 카드: 그림 장식만',cs.every(c=>!c.photo),cs.map(c=>c.id).join(', '));await p.evaluate(()=>window.ML.go('home'));await W(300)}
  await go('zone-myroom',900);
  {const r=await p.evaluate(()=>({inbox:window.ML.Room.inbox(),placed:Object.values(window.ML.Room.state().placed).filter(v=>/^photo:/.test(v)).length}));
   ok('다 지운 뒤 내 방: 선물 상자·놓인 물건 없음',r.inbox.length===0&&r.placed===0,JSON.stringify(r))}
  await p.evaluate(()=>window.ML.__xmLevel(4));await go('xmashouse',1200);
  {const x=await p.evaluate(()=>window.ML.__xm());ok('다 지운 뒤 크리스마스 4단계: 다시 할 일 4가지',x.tasks.join()==='wreath,snow,snow,snow',x.tasks.join())}
  ok('페이지 오류 0',errs.length===0,JSON.stringify(errs.slice(0,3)));
  console.log(fails?`실패 ${fails}개`:'전부 통과');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0],(e.stack||'').split('\n').filter(l=>/photoitems/.test(l)).slice(0,2).join(' '));process.exit(1)});
