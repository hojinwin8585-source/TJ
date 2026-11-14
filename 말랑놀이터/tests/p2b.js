/* P2 2-나 완료 기준 검사: node tests/p2b.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 1단계에서 손님 3명 → 2단계로 오르고(별 3칸, 단계 오르는 순간, ml-levelup) 드라이 단계와 목 장식이 생김
   5) 손님 3명마다 장식이 1개씩 늘고(리본 표시와 이름 음성), 다시 열어도 남아 있음.
      테스트용 사진 장식 1개를 저장소에 넣으면 꾸미기 카드에 나오고 붙이기·떼기가 됨
   2) 칸별로 그림이 실제로 달라짐(상태 이름과 캡처), 네 동물 × 여섯 모습
   3) 어른 설정에서 단계를 1로 되돌릴 수 있음 (+ 두 번 연속 어려워하면 조용히 한 단계 내림)
   더: 3단계의 빗과 엉킨 털 손님 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
/* a test photo decoration: a small hat picture as a data URL (stands in for a photo P6 will add) */
const HAT='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><ellipse cx="50" cy="70" rx="48" ry="14" fill="#6E8FB8"/><path d="M24 70Q22 18 50 16Q78 18 76 70Z" fill="#88A9D1"/><rect x="24" y="52" width="52" height="10" fill="#F0D58A"/></svg>');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps());
  const shot=async(n,loc)=>{if(!SHOT)return;const f=path.join(SHOT,'p2b_'+n+'.png');if(loc)await p.locator(loc).screenshot({path:f});else await p.screenshot({path:f})};
  const spy=()=>p.evaluate(()=>{window.__said=[];window.__lv=[];const V=window.ML_VOICE,o=V.say;V.say=function(ko,en){window.__said.push(ko+' / '+en);return o.apply(this,arguments)};
    document.addEventListener('ml-levelup',e=>window.__lv.push(e.detail))});
  const said=()=>p.evaluate(()=>window.__said.slice());
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await W(500);await spy();
  const waitPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ps().phase===ph,ph,{timeout:t});
  const enterLobby=async()=>{await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('petsalon'));await waitPhase('lobby',8000);await W(400)};
  /* the waiting customers are random: if none has this need, send them home (test hook) and look again */
  const ensureNeed=async need=>{for(let k=0;k<12;k++){await waitPhase('lobby',20000);if((await st()).lobby.some(c=>c&&c.need===need&&!c.inside))return;await p.evaluate(()=>window.ML.__psReset());await enterLobby()}};
  const pickNeed=async need=>{await ensureNeed(need);const s=await st();const i=s.lobby.findIndex(c=>c&&c.need===need&&!c.inside);if(i<0)throw new Error('가게 앞에 '+need+' 손님 없음: '+JSON.stringify(s.lobby));
    await p.locator(`.lb-cust[data-i="${i}"]`).click();await p.waitForFunction(()=>window.ML.__ps().view==='salon',null,{timeout:4000});return s.lobby[i]};
  const petBox=()=>p.locator('#psPet').boundingBox();
  const holdStill=async(ph)=>{const r=await petBox();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.42);const t0=Date.now();await p.mouse.down();
    while(Date.now()-t0<25000){await W(200);if((await st()).phase!==ph)break}await p.mouse.up();return(Date.now()-t0)/1000};
  const tapPt=async([x,y])=>{await p.mouse.click(x,y);await W(350)};
  /* one party customer: straight to dressing, one decoration, wait for the mirror, press it */
  const serveParty=async(onMirror)=>{
    await pickNeed('party');await waitPhase('dress',12000);await W(900);
    let s=await st();await tapPt(s.slotPts.head);await p.locator('#psPanel .ps-card').first().click();await W(900);
    await p.waitForFunction(()=>window.ML.__ps().mirror,null,{timeout:15000});await p.locator('#psMirBtn').click();
    if(onMirror)await onMirror();
    await p.waitForFunction(()=>window.ML.__ps().view==='lobby',null,{timeout:10000});
  };

  /* ---------- 1. level 1 → 2 after three customers ---------- */
  await enterLobby();let s=await st();
  ok('처음은 1단계: 손님은 토끼·강아지, 머리만, 카드 2장, 색 4가지',s.level===1&&s.lobby.every(c=>['bunny','dog'].includes(c.kind))&&s.slots.join()==='head'&&s.optionsPerChoice===2&&s.colors===4,
    `손님 ${s.lobby.map(c=>c.kind+'('+c.need+')').join(', ')} · 자리 ${s.slots} · 카드 ${s.optionsPerChoice} · 색 ${s.colors}`);
  ok('별 3칸이 위쪽에 (빈 칸)',s.starsN===3&&s.starsOn===0,'별 '+s.starsOn+'/'+s.starsN);
  {const c=await pickNeed('muddy');s=await st();ok('1단계 진흙 손님의 씻기: 거품 → 헹굼 (드라이 없음)',s.plan.join()==='foam,rinse',s.plan.join(' → '));await W(600);await p.locator('#psBack').click();await W(500)}
  await serveParty();await W(2200);s=await st();
  ok('손님 1명 → 별 1칸이 천천히 채워짐',s.starsOn===1&&s.progress.clears===1&&s.log.includes('star:1'),'별 '+s.starsOn+'/3');
  await shot('2star_row','#petsalon .bar');await shot('2star_lobby');
  await waitPhase('lobby',10000);await serveParty();await W(2200);
  await waitPhase('lobby',10000);
  let sawMoment=false,starsAtUp=0;
  await serveParty(async()=>{});
  for(let k=0;k<40&&!sawMoment;k++){await W(150);s=await st();if(s.starsOn===3)starsAtUp=3;if(s.moment){sawMoment=true;await W(500);await shot('3levelup_moment')}}
  const tUp=Date.now();await p.waitForFunction(()=>!window.ML.__ps().moment,null,{timeout:6000});const momentMs=Date.now()-tUp;
  s=await st();const lv=await p.evaluate(()=>window.__lv.slice()),sd=await said();
  ok('3명째에 별 3칸이 다 참',starsAtUp===3);
  ok('단계 오르는 순간: 새로 생긴 것(드라이기)을 크게, 이름을 한국어·영어로, 3초 안에 끝',sawMoment&&s.log.some(x=>x==='levelup:2:step:dry')&&sd.some(x=>/드라이기!.*Dryer!/.test(x))&&momentMs<3000,
    s.log.filter(x=>/levelup/.test(x)).join()+' · 사라질 때까지 '+momentMs+'ms (보인 뒤 약 0.7초부터 잼)');
  ok("'ml-levelup' 이벤트 {game, level}",lv.length===1&&lv[0].game==='petsalon'&&lv[0].level===2,JSON.stringify(lv));
  await waitPhase('lobby',10000);s=await st();
  ok('2단계: 별 줄이 비고, 목 자리·카드 3장·색 6가지',s.level===2&&s.starsOn===0&&s.slots.join()==='head,neck'&&s.optionsPerChoice===3&&s.colors===6,`단계 ${s.level} · 별 ${s.starsOn} · 자리 ${s.slots}`);
  {const c=await pickNeed('muddy');s=await st();ok('2단계 진흙 손님에게 드라이 단계가 생김',s.plan.join()==='foam,rinse,dry',s.plan.join(' → '));await W(600);await p.locator('#psBack').click();await W(500)}

  /* ---------- 5. one more decoration every three customers ---------- */
  await pickNeed('party');await waitPhase('dress',12000);await W(900);s=await st();
  await tapPt(s.slotPts.neck);s=await st();
  ok('목을 콕 → 목 장식 카드',s.cards&&s.cards.slot==='neck',s.cards&&s.cards.items.join(', '));
  await p.evaluate(()=>{window.__said=[]});
  await tapPt(s.slotPts.head);await W(300);s=await st();const sd5=await said();
  ok('손님 3명 → 장식 1개(왕관)가 새로 열림',s.items.unlocked.join()==='crown'&&s.pools.head.includes('crown'),'열린 것 '+s.items.unlocked.join());
  ok('새 장식은 맨 앞 카드에 작은 리본 표시, 이름 음성',s.cards.items[0]==='crown'&&s.cards.badges[0]==='ribbon'&&sd5.some(x=>/새 왕관이 생겼어요!.*A new crown!/.test(x)),`카드 ${s.cards.items.join(', ')} · 표시 ${s.cards.badges.join(',')} · 음성 ${sd5.join(' | ')}`);
  await shot('4new_item_card');await shot('4new_item_card_panel','#psPanel');
  await tapPt(s.slotPts.head);s=await st();
  ok('두 번째로 보일 때는 리본 표시 없음',!s.cards.badges.includes('ribbon'),s.cards.badges.join(','));

  /* reopen: still there; a test photo decoration in the closet store shows up on a card */
  await p.evaluate(h=>localStorage.setItem('mallang_closet',JSON.stringify([{id:'testhat',img:h,name:'모자',en:'hat',cat:'headband'}])),HAT);
  await p.reload();await W(600);await spy();await enterLobby();s=await st();
  ok('다시 열어도 단계와 장식이 남아 있음',s.level===2&&s.items.unlocked.includes('crown')&&s.pools.head.includes('crown'),'단계 '+s.level+' · 머리 장식 '+s.pools.head.join(', '));
  await pickNeed('party');await waitPhase('dress',12000);await W(900);s=await st();
  await p.evaluate(()=>{window.__said=[]});await tapPt(s.slotPts.head);s=await st();const sd6=await said();
  const pk=s.cards.photo.indexOf(true);
  ok('사진 장식이 꾸미기 카드에 나옴 (하트 액자 표시, "엄마가 넣어 준" 음성, 3장 중 1장)',pk>=0&&s.cards.items[pk]==='photo:testhat'&&s.cards.badges[pk]==='heart'&&s.cards.photo.filter(Boolean).length===1&&sd6.some(x=>/엄마가 넣어 준 모자!.*Mommy's hat!/.test(x)),
    `카드 ${s.cards.items.join(', ')} · 표시 ${s.cards.badges.join(',')}`);
  await p.locator('#psPanel .ps-card').nth(pk).click();await W(900);s=await st();
  ok('사진 장식 붙이기',s.worn.head&&s.worn.head.photo&&s.worn.head.item==='photo:testhat',JSON.stringify(s.worn.head));
  await W(300);await shot('5photo_on');
  await tapPt(s.itemPts.head);await W(200);s=await st();
  ok('사진 장식을 콕 → 색 대신 반짝이며 살랑',s.log.includes('sparkle:head')&&s.worn.head&&s.worn.head.photo&&!s.log.includes('color:head'));
  await W(600);s=await st();
  {const [x,y]=s.itemPts.head,sb=await p.locator('#psStage').boundingBox();await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x-40,y-30,{steps:4});await p.mouse.move(sb.x+20,sb.y+30,{steps:8});await p.mouse.up();await W(700)}
  s=await st();ok('사진 장식 끌어서 떼기',!s.worn.head,'남은 것: '+Object.keys(s.worn).join(','));
  await p.locator('#psBack').click();await W(500);

  /* ---------- 2. the look changes cell by cell ---------- */
  await pickNeed('muddy');await waitPhase('foam',8000);await W(500);s=await st();
  const look0=s.look;await shot('6state_muddy','#psStage');
  await holdStill('foam');await waitPhase('rinse',6000);await W(1400);
  let r=await petBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.25);await p.mouse.down();
  for(let k=0;k<60;k++){const a=k*.45;await p.mouse.move(r.x+r.width*(.3+.09*Math.cos(a)),r.y+r.height*(.27+.08*Math.sin(a*1.3)));await W(30)}
  await p.mouse.up();await W(300);s=await st();
  const grid=g=>g.map(row=>'   '+row.map(v=>(v||'-').padEnd(7)).join(' ')).join('\n');
  console.log('   헹굼 중 칸 상태:\n'+grid(s.stateGrid));
  const tl=g=>g.slice(0,3).flatMap(row=>row.slice(0,3)),br=g=>g.slice(3).flatMap(row=>row.slice(3));
  /* what is drawn in the cells of each look: water drops (#9FD0F0) and damp fur only in wet cells, foam (#CDE9FA) in foamy ones */
  const domKinds=await p.evaluate(()=>{const o={};document.querySelectorAll('#psPet .over .pc').forEach(e=>{const k=[...e.classList].find(c=>c.startsWith('pc-')&&c!=='pc'),h=e.innerHTML,x=o[k]=o[k]||{n:0,drop:0,foam:0};x.n++;if(/#9FD0F0/i.test(h))x.drop++;if(/#CDE9FA/i.test(h))x.foam++});return o});
  ok('헹군 왼쪽 위 칸은 "젖음", 오른쪽 아래 칸은 "거품" 그대로 (그림도 다름)',tl(s.stateGrid).includes('wet')&&br(s.stateGrid).filter(Boolean).every(x=>x==='foamy')&&domKinds['pc-wet']&&domKinds['pc-foamy']&&domKinds['pc-wet'].drop>0&&domKinds['pc-foamy'].drop===0&&domKinds['pc-foamy'].foam>0,
    '전체 모습 '+s.look+' · 칸 그림 '+JSON.stringify(domKinds));
  await shot('6state_rinse_partly','#psStage');
  await holdStill('rinse');await W(300);s=await st();const lookWet=s.look,wetClass=await p.evaluate(()=>document.querySelector('#psPet .psbase svg').getAttribute('class'));
  await waitPhase('dry',6000);await W(1400);await shot('6state_wet','#psStage');
  r=await petBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.25);await p.mouse.down();
  for(let k=0;k<50;k++){const a=k*.45;await p.mouse.move(r.x+r.width*(.3+.09*Math.cos(a)),r.y+r.height*(.27+.08*Math.sin(a*1.3)));await W(30)}
  await p.mouse.up();await W(300);s=await st();
  console.log('   말리는 중 칸 상태:\n'+grid(s.stateGrid));
  ok('말린 왼쪽 위 칸은 "보송", 오른쪽 아래 칸은 "젖음"',tl(s.stateGrid).includes('fluffy')&&br(s.stateGrid).filter(Boolean).every(x=>x==='wet')&&s.look==='dry1','전체 모습 '+s.look);
  await shot('6state_dry_partly','#psStage');
  await holdStill('dry');await W(400);s=await st();
  await shot('6state_fluffy','#psStage');
  const looks=[look0].concat(s.log.filter(x=>/^look:/.test(x)).map(x=>x.slice(5)));   // the first look is set when the customer comes in
  ok('전체 모습이 진흙 → 거품 → 헹구는 중 → 젖음(귀 처짐) → 말리는 중 → 보송 순서로 바뀜',look0==='muddy'&&['muddy','foamy','rinse1','wet','dry1','fluffy'].every((x,i,a)=>looks.indexOf(x)>=0&&(i===0||looks.indexOf(x)>looks.indexOf(a[i-1])))&&/ps-st-wet/.test(wetClass)&&lookWet==='wet',
    looks.join(' → ')+' · 젖은 그림 class "'+wetClass+'"');
  await p.locator('#psBack').click();await W(500);
  /* every animal in all six looks */
  const gal=await p.evaluate(()=>{const A=window.ART,kinds=['bunny','dog','cat','bear'],states=window.MLCFG.games.petsalon.petStates.map(s=>s.id);
    const d=document.createElement('div');d.id='p2bGal';d.style.cssText='position:fixed;inset:0;z-index:999;background:#FBF6EF;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;padding:6px;align-content:start';
    const strip=x=>x.replace(/an\d+/g,'an');const diff={};
    kinds.forEach(k=>{const seen=new Set();states.forEach(s=>{const h=A.animal(k,'idle',{lash:true,state:s});seen.add(strip(h));const c=document.createElement('div');c.innerHTML=h;c.style.cssText='aspect-ratio:200/230';c.firstElementChild.style.cssText='width:100%;height:100%';d.appendChild(c)});diff[k]=seen.size});
    document.body.appendChild(d);return{states,diff}});
  await W(200);await shot('1pet_states_4x6');await p.evaluate(()=>document.getElementById('p2bGal').remove());
  ok('네 동물 모두 여섯 모습이 서로 다른 그림',Object.values(gal.diff).every(n=>n===6),gal.states.join(' · ')+' → '+JSON.stringify(gal.diff));

  /* ---------- 3. parent settings: back to level 1; two hard rounds in a row step down silently ---------- */
  await p.evaluate(()=>{document.getElementById('settings').hidden=false});await W(300);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#progressRows .seg')].map(sg=>sg.dataset.game+':'+sg.querySelectorAll('button').length+':'+(sg.querySelector('button.on')||{}).textContent));
  await p.locator('#progressRows').scrollIntoViewIfNeeded();await p.locator('#setSalonLv').scrollIntoViewIfNeeded();await W(200);await shot('7parent_levels');
  await p.locator('#setSalonLv button[data-v="1"]').click();await W(300);
  const after=await p.evaluate(()=>({pr:window.ML.Progress.get('petsalon'),on:document.querySelector('#setSalonLv button.on').textContent,saved:JSON.parse(localStorage.getItem('mallang_progress')).petsalon.level}));
  ok("어른 설정 '놀이별 단계'에 미용실·네일숍·피자가게·길 찾기 줄",['petsalon','nailshop','pizza','maze'].every(g=>rows.some(x=>x.startsWith(g+':'))),rows.join(' / '));
  ok('어른 설정에서 미용실 단계를 1로 되돌림 (저장까지)',after.pr.level===1&&after.on==='1'&&after.saved===1,JSON.stringify(after));
  await p.evaluate(()=>{document.getElementById('settings').hidden=true});
  await enterLobby();s=await st();
  ok('되돌린 뒤 가게 앞은 1단계 손님만',s.level===1&&s.lobby.every(c=>['bunny','dog'].includes(c.kind)&&['muddy','party'].includes(c.need)),s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  const down=await p.evaluate(()=>{const P=window.ML.Progress;window.__lv=[];P.set('petsalon',3);const a=[];
    a.push(P.struggle('petsalon',{wrong:2,idleMs:3000}));P.clear('petsalon');      // not hard
    a.push(P.struggle('petsalon',{wrong:6}));P.clear('petsalon');                  // hard 1
    a.push(P.struggle('petsalon',{idleMs:21000}));                                 // hard 2 → down
    const lv=P.get('petsalon').level;P.clear('petsalon');return{a,lv,events:window.__lv.length}});
  ok('두 판 연속 어려워하면(엉뚱한 곳 6번 / 20초 가만히) 조용히 한 단계 내림',down.lv===2&&down.a.join()==='false,true,down'&&down.events===0,JSON.stringify(down));

  /* ---------- more: level 3, the comb and a tangled customer ---------- */
  await p.evaluate(()=>{window.ML.Progress.set('petsalon',3);window.ML.__psReset()});
  let found=false;for(let k=0;k<12&&!found;k++){await enterLobby();s=await st();found=s.lobby.some(c=>c.need==='tangled');if(!found)await p.evaluate(()=>window.ML.__psReset())}
  ok('3단계: 엉킨 털 손님이 가게 앞에',found,s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  if(found){await pickNeed('tangled');s=await st();ok('엉킨 털 손님은 빗질 단계',s.plan.join()==='brush',s.plan.join());
    await waitPhase('brush',8000);await W(1400);s=await st();const tg=s.states.filter(x=>x==='tangled').length;await shot('8brush_tangled','#psStage');
    r=await petBox();await p.mouse.move(r.x+r.width*.35,r.y+r.height*.5);await p.mouse.down();for(let k=0;k<20;k++){await p.mouse.move(r.x+r.width*(.3+.3*(k%5)/5),r.y+r.height*(.45+.1*Math.sin(k)));await W(40)}
    await W(200);await shot('8brush_combing','#psStage');s=await st();const toolOn=!!s.tool;await p.mouse.up();
    const tB=await holdStill('brush');s=await st();
    ok('빗이 손가락을 따라오고, 가만히 대고만 있어도 20초 안에 엉킨 털이 다 풀림',toolOn&&tB<20&&tg>=8&&!s.states.includes('tangled'),`엉킨 칸 ${tg}개 → 0, ${tB.toFixed(1)}초`);
    await waitPhase('dress',8000);await W(900);s=await st();ok('3단계 꾸밀 자리: 머리·목·얼굴, 색 10가지',s.slots.join()==='head,neck,face'&&s.colors===10,s.slots.join()+' · 색 '+s.colors);
  }
  ok('오류 없음',errs.length===0,JSON.stringify(errs));
  console.log(fails?'\n실패 '+fails+'개':'\n2-나 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
