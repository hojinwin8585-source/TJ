/* P1 완료 기준 검사: node tests/p1.js
   1) 손가락을 거의 움직이지 않아도 10초 안에 거품 단계 끝
   2) config 의 needStageWidths 를 바꾸면 실제 문지르기 양이 바뀜
   3) 미용실에 반복 무늬 배경이 없고, 동시에 움직이는 것(배경·효과·버튼, 캐릭터 몸 제외)이 2개 이하, 카드(차분) → 동물(또렷) 색이 다름
   4) 도구 그림 폭 130px 이상, 손가락 위쪽에 보임
   5) 드라이 단계에서 예고 음성 → 누름 → 소리 순서
   (P2 2-가부터: 가게 앞에서 진흙 손님을 골라 들어가고, 샤워기·드라이기도 손가락을 대고 있는 동안 작동) */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));
    /* 2-나: these checks need the dryer and neck/face cards, so start the salon at level 2 with every decoration unlocked */
    localStorage.setItem('mallang_progress',JSON.stringify({petsalon:{level:2,clears:0}}));localStorage.setItem('mallang_salon',JSON.stringify({served:0,wall:[],items:{unlocked:window.MLCFG.games.petsalon.itemUnlock.order,fresh:[],photoSeen:[]}}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps());
  const enter=async()=>{await p.evaluate(()=>{window.ML.go('home')});await W(300);await p.evaluate(()=>window.ML.go('petsalon'));
    await p.waitForFunction(()=>window.ML.__ps().phase==='lobby',null,{timeout:6000});const i=(await st()).lobby.findIndex(c=>c&&c.need==='muddy');await p.locator(`.lb-cust[data-i="${i}"]`).click();
    await p.waitForFunction(()=>window.ML.__ps().phase==='enter',null,{timeout:4000}).catch(()=>{});await p.waitForFunction(()=>window.ML.__ps().phase==='foam',null,{timeout:12000});await W(300)};
  const petBox=()=>p.locator('#psPet').boundingBox();
  /* P12: 캐릭터(손님 몸과 도구 얼굴)의 느린 움직임(calm.characterLife)은 빼고, 배경·효과·버튼의 끝없는 움직임만 셉니다 */
  const anims=()=>p.evaluate(()=>{const g=new Set();document.getAnimations().forEach(a=>{const t=a.effect&&a.effect.target,tm=a.effect&&a.effect.getTiming();
    if(!t||!tm||tm.iterations!==Infinity||a.playState!=='running')return;const r=t.getBoundingClientRect();if(!r.width||!r.height||t.closest('[hidden]'))return;
    if(t.closest('.alive,.tf'))return;
    g.add(t.closest('.ghand')?'ghand':(t.id||t.className&&t.className.baseVal||t.className||t.tagName))});return[...g]});
  const cfgRead=()=>p.evaluate(()=>({need:window.MLCFG.touch.rub.needStageWidths,hold:window.MLCFG.touch.rub.holdProgressPerSec,chunk:window.MLCFG.touch.rub.tapChunk}));
  console.log('config.js:',JSON.stringify(await cfgRead()));

  /* 1 + 3 + 4: near-still finger, whole visit */
  await enter();
  const pb=await petBox(),cx=pb.x+pb.width/2,cy=pb.y+pb.height/2;
  let maxAnim=[];const sample=async()=>{const a=await anims();if(a.length>maxAnim.length)maxAnim=a};
  await sample();
  const t0=Date.now();await p.mouse.move(cx,cy);await p.mouse.down();
  await W(400);
  const tool=await p.evaluate(()=>{const t=document.querySelector('#psStage .tl-tool'),r=t.getBoundingClientRect();return{w:r.width,h:r.height,bottom:r.bottom,disp:getComputedStyle(t).display}});
  ok('도구 그림 폭 130px 이상 (문지르는 중)',tool.disp!=='none'&&tool.w>=130,'폭 '+Math.round(tool.w)+'px');
  ok('도구가 손가락 위쪽에 보임',tool.bottom<=cy+1,'도구 아래끝 '+Math.round(tool.bottom)+' / 손가락 '+Math.round(cy));
  let t1=0,k=0;
  for(let i=0;i<400;i++){ // 0.3px 만 흔들리는 손가락 (minMovePx 0.5 미만)
    await p.mouse.move(cx+(k++%2?0.3:0),cy);await W(50);
    if(i%6===0)await sample();
    const s=await st();if(s.bar==='100%'||s.phase!=='foam'){t1=(Date.now()-t0)/1000;break}
  }
  await p.mouse.up();
  ok('손가락을 거의 안 움직여도 10초 안에 거품 단계 끝',t1>0&&t1<10,'걸린 시간 '+t1.toFixed(1)+'초');
  await p.waitForFunction(()=>window.ML.__ps().phase==='rinse',null,{timeout:6000});
  // rinse and dry: warn first, then the tool works while the finger is down (hold still on the pet)
  const holdPet=async ph=>{const r=await petBox();await p.mouse.move(r.x+r.width/2,r.y+r.height*.45);await p.mouse.down();await W(300);
    const w=await p.evaluate(()=>{const t=document.querySelector('#psStage .tl-tool');return t?t.getBoundingClientRect().width:0});
    for(let i=0;i<120&&(await st()).phase===ph;i++){await W(200);if(i%5===0)await sample()}await p.mouse.up();return w};
  await W(1500);await sample();
  const shw=await holdPet('rinse');
  await p.waitForFunction(()=>window.ML.__ps().phase==='dry',null,{timeout:6000});
  await W(1200);await sample();
  const dry0=(await st()).log.slice();
  const dw=await holdPet('dry');
  ok('샤워기·드라이기 그림 폭 130px 이상',shw>=130&&dw>=130,'샤워기 '+Math.round(shw)+'px, 드라이기 '+Math.round(dw)+'px');
  await p.waitForFunction(()=>window.ML.__ps().phase==='dress',null,{timeout:8000});
  const log=(await st()).log;
  const iw=log.indexOf('warn:dry'),ip=log.indexOf('press:dry'),is=log.indexOf('sound:dry');
  const early=dry0.filter(x=>/^(press|sound):dry/.test(x));
  ok('드라이 단계: 예고 음성 → 누름 → 소리 순서',iw>=0&&ip>iw&&is>ip&&early.length===0,'기록 '+log.filter(x=>/dry|water/.test(x)).join(' '));
  ok('샤워도 예고 → 누름 → 소리',log.indexOf('warn:water')>=0&&log.indexOf('warn:water')<log.indexOf('press:water')&&log.indexOf('press:water')<log.indexOf('sound:water'));
  const uses=await p.evaluate(()=>JSON.parse(localStorage.getItem('mallang_dryuse')));
  ok('드라이기 사용 횟수가 기기에 저장됨 (소리 크기 단계: 드라이 한 번에 1회)',uses===1,'사용 '+uses+'번');
  // calm card vs vivid result
  await W(900);
  {const [x,y]=(await st()).slotPts.head;await p.mouse.click(x,y);await W(500)}
  const card=await p.evaluate(()=>{const c=document.querySelector('#psPanel .ps-card');return{hex:c.dataset.hex,html:c.innerHTML}});
  const vivid=await p.evaluate(h=>{const m=window.MLCFG.calm.choiceColors.find(x=>x.hex===h);return m.vivid},card.hex);
  ok('카드의 장식은 차분한 색(hex)',card.html.toLowerCase().includes(card.hex.toLowerCase())&&!card.html.toLowerCase().includes(vivid.toLowerCase()),'카드 '+card.hex+' (또렷한 색 '+vivid+' 없음)');
  await p.locator('#psPanel .ps-card').first().click();
  const mid=await p.waitForFunction(()=>!!document.querySelector('#psPet .over .bloom'),null,{timeout:1500,polling:30}).then(()=>1).catch(()=>0);
  await W(1000);
  const over=await p.evaluate(()=>document.querySelector('#psPet .over').innerHTML.toLowerCase());
  ok('고르는 순간 피어남(bloom) 후 동물에게는 또렷한 색(vivid), 카드와 다름',mid===1&&over.includes(vivid.toLowerCase())&&!over.includes(card.hex.toLowerCase()),'동물 '+vivid);
  await sample();
  /* 3: repeating backgrounds */
  const pat=await p.evaluate(()=>{const bad=[];[document.body,...document.querySelectorAll('#petsalon *')].forEach(e=>{const b=getComputedStyle(e).backgroundImage;
    if(/repeating-|radial-gradient/.test(b)){const s=getComputedStyle(e).backgroundSize;if(/repeating-/.test(b)||(s&&s!=='auto'))bad.push((e.id||e.className&&e.className.baseVal||e.className||e.tagName)+':'+b.slice(0,40))}});return bad});
  ok('미용실 화면에 반복 무늬 배경 없음',pat.length===0,pat.join(' ; ')||'없음');
  ok('동시에 움직이는 것(끝없는 움직임, 캐릭터 몸 제외) 2개 이하',maxAnim.length<=2,'최대 '+maxAnim.length+'개: '+maxAnim.join(', '));
  const home=await p.evaluate(()=>{window.ML.go('home');return[document.body,...document.querySelectorAll('#home *,.bg-home *')].filter(e=>/repeating-|px/.test(getComputedStyle(e).backgroundImage+getComputedStyle(e).backgroundSize)&&/repeating-|(\d+px \d+px)/.test(getComputedStyle(e).backgroundImage+' '+getComputedStyle(e).backgroundSize)&&!/is-hero/.test(e.className)).length});
  ok('홈·공통 배경에 점 무늬 없음',home===0,'무늬 요소 '+home+'개');

  /* 2: needStageWidths changes the amount */
  const prog=async need=>{
    await p.evaluate(n=>{const r=window.MLCFG.touch.rub;r.needStageWidths=n;r.holdProgressPerSec=0;r.tapChunk=0},need);
    await enter();const r=await petBox(),x=r.x+r.width*.2,y=r.y+r.height/2;
    await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=10;i++)await p.mouse.move(x+i*20,y);await p.mouse.up();
    return (await st()).rub;
  };
  const a=await prog(2),b2=await prog(4);
  const stageW=await p.evaluate(()=>document.getElementById('psStage').clientWidth);
  ok('needStageWidths 를 2 → 4 로 바꾸면 같은 거리에서 진행량이 절반',a>0&&Math.abs(a/b2-2)<.15,'200px 문지르기(무대 폭 '+stageW+'px): 2이면 '+(a*100).toFixed(1)+'%, 4이면 '+(b2*100).toFixed(1)+'% (비율 '+(a/b2).toFixed(2)+', 기대 2)');
  ok('오류 없음',errs.length===0,JSON.stringify(errs));
  console.log(fails?'\n실패 '+fails+'개':'\nP1 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
