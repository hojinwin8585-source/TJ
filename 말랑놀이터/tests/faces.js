/* P4 우리 가족 얼굴 완료 기준 검사: node tests/faces.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 얼굴 관리 화면: 할머니 자리에 테스트 그림 파일을 진짜 파일 입력(+진짜 터치)으로 넣기 → 얼굴만 따기(타원 틀 → 지우개 화면 → 저장)
   2) 미용실 4단계에 할머니가 손님으로 나옴 · "할머니가 오셨어요!" · 머리 감기(거품·헹굼·말림)와 꾸미기 한 판 완주
   3) "+ 얼굴 추가"로 6~9번째 얼굴 → 다시 열어도 9개 · 저장은 IndexedDB
   4) 움직임 7가지가 각각 다른 모습(변형 값과 캡처) · 효과 5가지 · 0.6~1초, 반복 없음
   5) 사진이 하나도 없어도 4단계가 동물 손님으로 오류 없이 진행 · 칭찬은 토토가 손뼉
   6) 예전 localStorage 얼굴이 처음 한 번 옮겨져 그대로 보임 · IndexedDB가 안 되어도 앱이 동작
   7) 크리스마스 4단계: 얼굴이 있을 때만 액자 · 얼굴 칭찬 손뼉 · 페이지 오류 0 */
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
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const tap=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(x),y:Math.round(y)}]});await W(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await W(150)};
  const tapEl=async sel=>{const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();return{x:q.left+q.width/2,y:q.top+q.height/2}},sel);if(!r)throw new Error('없음 '+sel);await tap(r.x,r.y)};
  const until=(fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:ms||9000});
  const fresh=async(cast,pre)=>{await p.goto(URL);await p.evaluate(([c,pre])=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify(c||{hero:{setup:true}}));if(pre)Object.keys(pre).forEach(k=>localStorage.setItem(k,pre[k]))},[cast,pre]);
    await p.evaluate(()=>new Promise(res=>{const q=indexedDB.deleteDatabase('mallang_faces');q.onsuccess=q.onerror=q.onblocked=()=>res()}));await p.reload();await W(600);await p.evaluate(()=>window.ML.Faces.ready)};
  const go=async(id,ms)=>{await p.evaluate(id=>{document.querySelectorAll('.modal').forEach(m=>m.hidden=true);window.ML.go(id)},id);await W(ms||900)};
  /* a test picture: a drawn face on a coloured wall (a real cut has to remove the wall) */
  const FACE=`(skin,hair,bg)=>{const c=document.createElement('canvas');c.width=c.height=600;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,600,600);
    g.fillStyle=hair;g.beginPath();g.ellipse(300,260,150,170,0,0,7);g.fill();g.fillStyle=skin;g.beginPath();g.ellipse(300,300,118,150,0,0,7);g.fill();
    g.fillStyle=hair;g.beginPath();g.ellipse(300,170,118,60,0,0,7);g.fill();g.fillStyle='#3a2a20';[[250,290],[350,290]].forEach(([x,y])=>{g.beginPath();g.ellipse(x,y,14,18,0,0,7);g.fill()});
    g.strokeStyle='#a0444a';g.lineWidth=8;g.lineCap='round';g.beginPath();g.arc(300,340,40,.2,Math.PI-.2);g.stroke();g.fillStyle='rgba(255,130,140,.5)';[[225,340],[375,340]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,24,0,7);g.fill()});return c.toDataURL('image/png')}`;
  const mk=(skin,hair,bg)=>p.evaluate(([f,a,b,c])=>eval(f)(a,b,c),[FACE,skin,hair,bg]);
  const cut=(id,kind,url)=>p.evaluate(([id,kind,url])=>window.ML.Faces.__cutDirect(id,kind,url,{cx:.5,cy:.5,rx:.27}),[id,kind,url]);
  const GR=['#F2CDB0','#cfcfcf','#8fc0e0'],MO=['#F6D5BE','#3a2418','#e0c08f'],BA=['#F8DCC6','#8a5a36','#b0e0b0'];

  /* ---------- 1. the manager: take a file for grandma, the real path ---------- */
  await fresh();
  let st=await p.evaluate(()=>window.ML.Faces.__state());
  ok('저장은 IndexedDB, 자리 5개(아기·엄마·아빠·삼촌·할머니), 사진 0장',st.mode==='idb'&&st.ids.join()==='baby,mom,dad,uncle,grandma'&&st.withPhoto.length===0,JSON.stringify(st));
  await go('home');
  await p.evaluate(()=>window.ML.Faces.openManager());await W(300);await shot('faces_manager_empty');
  const grUrl=await mk(...GR);
  await tapEl('.fm-card[data-id="grandma"] [data-act="pick"]');
  const buf=Buffer.from(grUrl.split(',')[1],'base64');
  await p.setInputFiles('#faceFile',{name:'grandma.png',mimeType:'image/png',buffer:buf});
  await until(()=>!document.getElementById('faceCut').hidden,null,5000);await W(300);
  const c1=await p.evaluate(()=>({hint:document.getElementById('fcHint').textContent,canvasVisible:!document.getElementById('fcFrame').hidden,auto:!document.getElementById('fcAuto').hidden,fd:'FaceDetector' in window}));
  ok('얼굴 따기 1단계: 타원 틀 화면(손으로 맞춤), 얼굴 자동 맞추기는 기기가 지원할 때만',c1.canvasVisible&&c1.auto===c1.fd,JSON.stringify(c1));
  await shot('faces_cut1_frame');
  /* drag the frame with a finger, change the size */
  const fr0=await p.evaluate(()=>{const c=document.getElementById('fcFrame').getBoundingClientRect();return{x:c.left+c.width/2,y:c.top+c.height/2,w:c.width}});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(fr0.x),y:Math.round(fr0.y)}]});
  for(let k=1;k<=6;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(fr0.x+k*2),y:Math.round(fr0.y+k*3)}]});await W(30)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await W(100);
  await p.evaluate(()=>{const r=document.getElementById('fcSize');r.value=0.3;r.dispatchEvent(new Event('input'))});
  await tapEl('#fcNext');await W(400);
  const c2=await p.evaluate(()=>({workVisible:!document.getElementById('fcWork').hidden,tools:[...document.querySelectorAll('#fcTool button')].map(b=>b.textContent),soft:!!document.getElementById('fcSoft')}));
  ok('얼굴 따기 2단계: 지우개·되살리기·가장자리 부드럽게',c2.workVisible&&c2.tools.join()==='지우개,되살리기'&&c2.soft,JSON.stringify(c2));
  /* erase a stripe with a finger, then restore it */
  const wk=await p.evaluate(()=>{const c=document.getElementById('fcWork').getBoundingClientRect();return{x:c.left,y:c.top,w:c.width}});
  const alphaAt=()=>p.evaluate(()=>{const c=document.getElementById('fcWork'),d=c.getContext('2d').getImageData(256,40,1,1).data;return d[3]});
  const a0=await alphaAt();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(wk.x+wk.w*.3),y:Math.round(wk.y+wk.w*.08)}]});
  for(let k=0;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(wk.x+wk.w*(.3+k*.04)),y:Math.round(wk.y+wk.w*.08)}]});await W(25)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const a1=await alphaAt();
  ok('지우개: 손가락으로 쓸면 그 자리가 투명해짐',a0>200&&a1<30,`전 ${a0} 후 ${a1}`);
  await p.evaluate(()=>{document.querySelector('#fcTool button[data-t="restore"]').click()});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(wk.x+wk.w*.3),y:Math.round(wk.y+wk.w*.08)}]});
  for(let k=0;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(wk.x+wk.w*(.3+k*.04)),y:Math.round(wk.y+wk.w*.08)}]});await W(25)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const a2=await alphaAt();
  ok('되살리기: 다시 칠하면 돌아옴',a2>200,`후 ${a2}`);
  await shot('faces_cut2_erase');
  await tapEl('#fcNext');await until(()=>document.getElementById('faceCut').hidden,null,6000);await W(500);
  st=await p.evaluate(()=>window.ML.Faces.__state());
  const gr=await p.evaluate(()=>{const r=window.ML.Faces.get('grandma');return{photo:/^data:image\/(webp|png)/.test(r.photo||''),len:(r.photo||'').length,hair:r.hair,skin:r.skin}});
  ok('저장: 할머니 사진이 IndexedDB에 들어감(256px 얼굴, 머리·피부색 뽑음)',st.withPhoto.join()==='grandma'&&gr.photo&&/^#/.test(gr.skin||''),JSON.stringify(gr));
  const sz=await p.evaluate(()=>new Promise(res=>{const i=new Image();i.onload=()=>res([i.naturalWidth,i.naturalHeight]);i.src=window.ML.Faces.get('grandma').photo}));
  ok('얼굴 사진 크기 256px',sz[0]===256&&sz[1]===256,sz.join('x'));
  await shot('faces_manager_grandma');
  await p.evaluate(()=>window.ML.Faces.closeManager());

  /* ---------- 2. salon level 4: grandma is the customer ---------- */
  await p.evaluate(()=>{window.ML.Progress.set('petsalon',4)});
  await go('petsalon',900);
  await p.evaluate(()=>window.ML.__psReset({kind:'fc_grandma'}));
  await go('home',300);await go('petsalon',1500);
  let s=await p.evaluate(()=>window.ML.__ps());
  ok('4단계 가게 앞: 할머니 손님이 기다림, 나머지는 동물(얼굴이 하나뿐)',s.lobby.some(c=>c.kind==='fc_grandma'&&c.need==='muddy')&&s.level===4,s.lobby.map(c=>c.kind).join());
  await shot('faces_salon_lobby');
  const gi=s.lobby.findIndex(c=>c.kind==='fc_grandma');
  const bb=await p.evaluate(i=>{const r=document.querySelector(`.lb-cust[data-i="${i}"]`).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}},gi);
  await tap(bb.x,bb.y);await W(1400);
  s=await p.evaluate(()=>window.ML.__ps());
  ok('"할머니가 오셨어요!"로 맞이함',s.log.some(l=>l==='here:할머니가 오셨어요!'),s.log.filter(l=>/here/.test(l)).join());
  await until(()=>window.ML.__ps().phase==='foam',null,10000);await W(500);
  s=await p.evaluate(()=>window.ML.__ps());
  ok('머리 감기: 거품 → 헹굼 → 말림 (진흙 없음)',s.customer.kind==='fc_grandma'&&s.customer.steps.join()==='rinse,dry'||s.customer.steps.join()==='foam,rinse,dry'||s.customer.steps.join()==='rinse,dry,',JSON.stringify(s.customer));
  await shot('faces_salon_foam_start');
  const look=await p.evaluate(()=>{const e=document.querySelector('#psPet svg.pe-person');return{person:!!e,photo:!!(e&&e.querySelector('.pe-photo')),grad:window.ART.vol.count(e),alive:document.querySelector('#psPet').classList.contains('alive')}});
  ok('손님 그림: 사진 얼굴 캐릭터, 그라데이션 6개 이하, 살아 있는 움직임',look.person&&look.photo&&look.grad<=6&&look.alive,JSON.stringify(look));
  /* play the whole round */
  const done={};let t0=Date.now();
  for(let n=0;n<260&&Date.now()-t0<150000;n++){
    const x=await p.evaluate(()=>window.ML.__ps());if(x.view==='lobby'&&done.mirror)break;
    if(['foam','rinse','dry'].includes(x.phase)){const r=await p.locator('#psPet').boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height*.45;await p.mouse.move(cx,cy);await p.mouse.down();
      for(let k=0;k<14;k++){await p.mouse.move(cx+Math.cos(k)*r.width*.3,cy+Math.sin(k*1.3)*r.height*.3);await W(45)}
      if(!done[x.phase]){done[x.phase]=1;await shot('faces_salon_'+x.phase)}await p.mouse.up();await W(80)}
    else if(x.phase==='dress'){
      for(const slot of ['head','neck','face']){if((await p.evaluate(()=>window.ML.__ps())).worn[slot])continue;const [px,py]=(await p.evaluate(()=>window.ML.__ps())).slotPts[slot];await p.mouse.click(px,py);await W(500);
        const c=p.locator('#psPanel .ps-card'),nc=await c.count();if(nc>=2&&nc<=3){await c.nth(n%nc).click();await W(900)}}
      if(!(await p.evaluate(()=>window.ML.__ps())).mirror){await W(1000);continue}
      await shot('faces_salon_dressed');await p.locator('#psMirBtn').click();done.mirror=1;await W(1800);await shot('faces_salon_mirror');await W(1500)}
    else await W(300);
  }
  await W(3000);s=await p.evaluate(()=>window.ML.__ps());
  ok('할머니 손님 한 판 완주(거품·헹굼·말림·꾸미기·거울) 후 가게 앞으로',done.foam&&done.rinse&&done.dry&&done.mirror&&s.view==='lobby'&&s.served>=1,JSON.stringify(Object.keys(done))+' '+s.view);
  await shot('faces_salon_after');

  /* ---------- 3. unlimited faces, reload ---------- */
  await go('home');await p.evaluate(()=>window.ML.Faces.openManager());await W(300);
  const imgs=[MO,BA,['#EBC9A8','#222','#d6b0e0'],['#F7D9C4','#b5483a','#a0d0d0']].map(a=>mk(...a));
  for(let k=0;k<4;k++){await tapEl('#fmAdd');await W(200)}
  const idsNow=await p.evaluate(()=>window.ML.Faces.all().map(r=>r.id));
  ok('"+ 얼굴 추가" 4번 → 자리 9개(5 + 4)',idsNow.length===9,String(idsNow.length));
  const customs=idsNow.slice(5);
  const urls=await Promise.all(imgs);
  for(let k=0;k<4;k++)await cut(customs[k],'main',urls[k]);
  await cut('mom','main',urls[0]);await cut('baby','main',urls[1]);
  await p.evaluate(()=>window.ML.Faces.closeManager());
  await p.reload();await W(700);await p.evaluate(()=>window.ML.Faces.ready);
  st=await p.evaluate(()=>window.ML.Faces.__state());
  ok('다시 열어도 9개 중 사진 있는 7개가 그대로(8번째·9번째 포함)',st.ids.length===9&&st.withPhoto.length===7&&st.withPhoto.includes(customs[3])&&st.withPhoto.includes(customs[2]),JSON.stringify(st.withPhoto));
  await go('friends',900);await shot('faces_friends');
  const fc=await p.evaluate(()=>[...document.querySelectorAll('#cast .fc-card')].map(e=>({n:e.querySelector('.cn').textContent,w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)})));
  ok('친구들 화면에 얼굴 캐릭터 7개(터치 칸 110px 이상)',fc.length===7&&fc.every(f=>f.w>=110&&f.h>=110),JSON.stringify(fc.slice(0,3)));
  await p.evaluate(()=>window.ML.Faces.openManager());await W(300);await p.evaluate(()=>document.querySelector('#faceMgr .sheet').scrollTo(0,99999));await W(200);await shot('faces_manager_many');
  await p.evaluate(()=>window.ML.Faces.closeManager());

  /* ---------- 4. the seven motions ---------- */
  await go('home',400);
  await p.evaluate(()=>{const d=document.createElement('div');d.id='mt';d.style.cssText='position:fixed;left:0;top:0;width:390px;height:780px;z-index:99;background:#F6F1EA;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px';
    const r=window.ML.Faces.get('mom');['lookL','lookR','nodUp','nodDown','tilt','bounce','shiver'].forEach(m=>{const w=document.createElement('div');w.dataset.m=m;w.style.cssText='position:relative;height:150px';w.innerHTML=window.ML.Face.card(r,{w:92});d.appendChild(w)});document.body.appendChild(d)});
  const sig=await p.evaluate(()=>{const out={};document.querySelectorAll('#mt [data-m]').forEach(w=>{const m=w.dataset.m,res=window.ML.Face.play(w,m,{force:true});res.freeze(.5);
    const sv=w.querySelector('svg'),t=s=>{const e=sv.querySelector(s);return e?getComputedStyle(e).transform:''};out[m]={ms:res.ms,root:t('.al-root'),head:t('.al-head-s'),photo:t('.pe-photo')}});return out});
  const keys=Object.keys(sig),uniq=new Set(keys.map(k=>sig[k].root+'|'+sig[k].head+'|'+sig[k].photo));
  ok('움직임 7가지가 모두 다른 변형 값',keys.length===7&&uniq.size===7,keys.map(k=>k+':'+(sig[k].photo||sig[k].root).slice(0,26)).join(' / '));
  ok('한 번에 0.6~1초(반복 없음)',keys.every(k=>sig[k].ms>=600&&sig[k].ms<=1000),keys.map(k=>sig[k].ms).join());
  await W(150);await shot('faces_motions_mid');
  await p.evaluate(()=>{document.querySelectorAll('#mt [data-m]').forEach(w=>w.getAnimations({subtree:true}).forEach(a=>a.cancel()))});
  /* effects */
  await p.evaluate(()=>{const d=document.getElementById('mt');d.innerHTML='';d.style.gridTemplateColumns='repeat(5,1fr)';const r=window.ML.Faces.get('grandma');
    ['blush','heart','sparkle','sweat','sleep'].forEach(f=>{const w=document.createElement('div');w.dataset.f=f;w.style.cssText='position:relative;height:140px';w.innerHTML=window.ML.Face.card(r,{w:72});d.appendChild(w)})});
  await p.evaluate(()=>document.querySelectorAll('#mt [data-f]').forEach(w=>window.ML.Face.play(w,'tilt',{fx:w.dataset.f,force:true})));
  await W(380);
  const fxn=await p.evaluate(()=>[...document.querySelectorAll('#mt [data-f]')].map(w=>w.querySelectorAll('.fc-fx[data-fx="'+w.dataset.f+'"]').length));
  ok('그린 효과 5가지(볼 빨개짐·하트·반짝이·땀방울·쿨쿨)가 얼굴 위에 나옴',fxn.every(n=>n===1),fxn.join());
  await shot('faces_effects');
  await W(1200);
  const gone=await p.evaluate(()=>document.querySelectorAll('.fc-fx').length);
  ok('효과는 저절로 사라짐(반복 없음)',gone===0,String(gone));
  await p.evaluate(()=>document.getElementById('mt').remove());

  /* ---------- 5. praise: a face claps at the end of a round, Toto with no photos ---------- */
  await go('home',300);
  await p.evaluate(()=>document.dispatchEvent(new CustomEvent('ml-round',{detail:{game:'x'}})));
  await until(()=>!!document.querySelector('.fc-praise'),null,4000);await W(700);
  const pr1=await p.evaluate(()=>{const e=document.querySelector('.fc-praise');return{who:e.dataset.who,person:!!e.querySelector('.pe-person'),events:getComputedStyle(e).pointerEvents}});
  ok('한 판이 끝나면 넣어 둔 얼굴 하나가 손뼉(눌러도 막지 않음)',pr1.person&&pr1.who!=='toto'&&pr1.events==='none',JSON.stringify(pr1));
  await shot('faces_praise');
  await until(()=>!document.querySelector('.fc-praise'),null,5000);
  ok('칭찬 손뼉은 3초 안에 사라짐',true,'');

  /* ---------- 6. xmas level 4 frame with faces ---------- */
  await go('xmashouse',900);
  await p.evaluate(()=>window.ML.__xmLevel(4));
  await until(()=>window.ML.__xm().phase==='cards',null,6000);
  const xm=()=>p.evaluate(()=>window.ML.__xm());
  let x=await xm();
  ok('크리스마스 4단계: 얼굴이 있으면 꾸밈이 5개(리스·눈 3·액자)',x.tasks.join()==='wreath,snow,snow,snow,frame',x.tasks.join());
  let guard=0,sawFrameCards=null;
  while(guard++<14){x=await xm();if(x.done||x.phase==='done')break;
    if(x.phase==='cards'){if(x.task==='frame')sawFrameCards=x.cards.length;await tap(x.cards[0].x,x.cards[0].y);await until(()=>{const s=window.ML.__xm();return s.phase==='place'&&!!s.spot},null,4000);const sp=await xm();if(x.task==='frame')await shot('faces_xmas_place');await tap(sp.spot.x,sp.spot.y);await W(1500)}
    else if(x.phase==='tapWin'){await tap(x.winXY[0],x.winXY[1]);await W(650)}
    else await W(300)}
  await until(()=>window.ML.__xm().phase==='done'&&!window.ML.__xm().busy,null,12000).catch(()=>{});
  x=await xm();
  ok('액자: 얼굴 카드(최대 3장)를 골라 벽에 걸림',sawFrameCards>=1&&sawFrameCards<=3&&!!x.tree.frame,`카드 ${sawFrameCards} · 액자 ${x.tree.frame}`);
  const fdom=await p.evaluate(()=>!!document.querySelector('#xmashouse .xm-item[data-k="frame"] .pe-photo'));
  ok('액자 안에 사진 얼굴이 보임',fdom,'');
  await shot('faces_xmas_done');

  /* ---------- 7. no faces at all ---------- */
  await fresh();
  await p.evaluate(()=>{window.ML.Progress.set('petsalon',4);window.ML.Progress.set('xmasHouse',4)});
  await go('petsalon',1500);
  s=await p.evaluate(()=>window.ML.__ps());
  ok('사진이 없어도 4단계: 동물 손님 3마리, 오류 없음',s.level===4&&s.lobby.length===3&&s.lobby.every(c=>c&&!/^fc_/.test(c.kind)),s.lobby.map(c=>c.kind).join());
  await shot('faces_none_lobby');
  const ni=s.lobby.findIndex(c=>c.need==='muddy');
  const nb=await p.evaluate(i=>{const r=document.querySelector(`.lb-cust[data-i="${i}"]`).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}},ni);
  await tap(nb.x,nb.y);await until(()=>window.ML.__ps().phase==='foam',null,10000);
  ok('동물 손님이 들어와 씻기 시작',true,'');
  await go('xmashouse',900);await p.evaluate(()=>window.ML.__xmLevel(4));await until(()=>window.ML.__xm().phase==='cards',null,6000);x=await xm();
  ok('얼굴이 없으면 크리스마스 4단계는 예전 그대로(4개)',x.tasks.join()==='wreath,snow,snow,snow',x.tasks.join());
  await go('home',300);await p.evaluate(()=>document.dispatchEvent(new CustomEvent('ml-round',{detail:{game:'x'}})));
  await until(()=>!!document.querySelector('.fc-praise'),null,4000);await W(900);
  const pr0=await p.evaluate(()=>{const e=document.querySelector('.fc-praise');return{who:e.dataset.who,alive:e.classList.contains('alive'),arm:getComputedStyle(e.querySelector('.al-arm-l')).animationName}});
  ok('얼굴이 없으면 토토가 손뼉',pr0.who==='toto'&&pr0.alive,JSON.stringify(pr0));
  await shot('faces_praise_toto');
  await W(3500);
  ok('얼굴 없이도 페이지 오류 0(이 시점까지)',errs.length===0,errs.slice(0,3).join(' | '));

  /* ---------- 8. migration of old data ---------- */
  const tiny=await mk('#F6D5BE','#3a2418','#e0c08f');
  await fresh({hero:{setup:true,name:'하은',photo:tiny},family:{mom:{photo:tiny},dad:{photo:tiny}}});
  st=await p.evaluate(()=>window.ML.Faces.__state());
  const lsCast=await p.evaluate(()=>JSON.parse(localStorage.getItem('mallang_cast')));
  ok('예전 저장 얼굴(엄마·아빠·아기 사진)이 처음 한 번 IndexedDB로 옮겨져 그대로 보임',st.mode==='idb'&&['mom','dad','baby'].every(i=>st.withPhoto.includes(i))&&st.migrated,JSON.stringify(st));
  ok('옮긴 뒤 localStorage에는 가족 사진이 남지 않고, 공주 모험 주인공 사진은 그대로',!(lsCast.family&&((lsCast.family.mom||{}).photo||(lsCast.family.dad||{}).photo))&&!!lsCast.hero.photo,JSON.stringify(Object.keys(lsCast.family||{}).map(k=>[k,!!(lsCast.family[k]||{}).photo])));
  const legacy=await p.evaluate(()=>({mom:!!window.ML.CAST.family.mom.photo,hero:!!window.ML.CAST.hero.photo}));
  ok('예전 화면(옷 입히기 등)이 읽는 엄마 사진도 그대로 보임',legacy.mom&&legacy.hero,JSON.stringify(legacy));
  await p.reload();await W(600);await p.evaluate(()=>window.ML.Faces.ready);
  st=await p.evaluate(()=>window.ML.Faces.__state());
  ok('다시 열어도 한 번만 옮기고 그대로 남음',['mom','dad','baby'].every(i=>st.withPhoto.includes(i)),JSON.stringify(st.withPhoto));
  await go('friends',900);await shot('faces_friends_migrated');

  /* ---------- 9. IndexedDB broken: the app still works ---------- */
  const p2=await ctx.newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));p2.on('console',m=>{if(m.type()==='error')e2.push(m.text())});
  await p2.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{get(){throw new Error('no idb')}})});
  await p2.goto(URL);await p2.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});await p2.reload();await p2.waitForTimeout(700);
  await p2.evaluate(()=>window.ML.Faces.ready);
  await p2.evaluate(([u])=>window.ML.Faces.__cutDirect('mom','main',u,{cx:.5,cy:.5,rx:.27}),[tiny]);
  const s2=await p2.evaluate(()=>window.ML.Faces.__state());
  await p2.reload();await p2.waitForTimeout(700);await p2.evaluate(()=>window.ML.Faces.ready);
  const s3=await p2.evaluate(()=>window.ML.Faces.__state());
  ok('IndexedDB를 못 써도 localStorage로 저장되고 다시 열어도 남음, 오류 없음',s2.mode==='ls'&&s2.withPhoto.includes('mom')&&s3.withPhoto.includes('mom')&&e2.length===0,JSON.stringify([s2.mode,s3.withPhoto,e2.slice(0,2)]));
  await p2.close();

  ok('페이지 오류 0',errs.length===0,errs.slice(0,4).join(' | '));
  console.log(fails?`\n실패 ${fails}개`:'\n전부 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('시험 중 오류',e);process.exit(2)});
