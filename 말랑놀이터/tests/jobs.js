/* P15 직업 놀이 완료 기준 검사: node tests/jobs.js   (SHOT_DIR=폴더 를 주면 과정마다 캡처를 저장)
   모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다(모바일 화면).
   1) 소방관: 옷 3가지를 입히기 전에는 출동이 안 됨(탈것이 없고, 출동 훅도 거절, 그 자리를 눌러도 그대로)
   2) 소방관: 물줄기가 닿은 불만 작아지고, 3곳을 다 꺼야 끝남(2곳 끄고 3번째를 반만 꺼도 안 끝남)
   3) 소방관 한 판을 콕(탭)만으로 끝까지
   4) 의사: 청진기(두근두근) · 반창고 3개(콕, 끌기, 카드 콕)
   5) 2단계: 다른 직업 옷 카드를 누르면 붙지 않고 이름을 말해 줌 · 요리사 · 경찰관 한 판
   6) 글자 버튼 · 글자 · 이모지 없음, '다음' 같은 버튼 없음, 누를 것 110px 이상(뒤로 가기 64px), 살아 있는 인형과 손님, 깊이 표
   7) 3단계: 집배원(편지 3통을 같은 그림 우체통에 · 자전거 · 소포를 같은 그림 집에) · 농부(파기 · 심기 · 물 준 곳만 자람 · 당근 3개 · 암탉 · 달걀), 일이 두 가지
   8) 4단계: 친구가 그림 말풍선으로 도와 달라고 함 → 맞는 직업 카드(틀리면 "어?" 하고 다시 물어봄) · 수의사(청진기 · 붕대 세 번 · 물약 세 방울)
   9) 5단계: 가족 얼굴이 없으면 늘 하던 인형(오류 없음), 테스트 얼굴을 넣으면 그 얼굴이 직업 옷을 입고 이름으로 불림("엄마 ○○ 출동!")
   JB_FROM=3 을 주면 1~2단계 검사를 건너뜀(새 단계만 빨리 볼 때). */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__jb());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[])};
  const drag=async(a,c,n=12)=>{await touch('touchStart',[a]);for(let k=1;k<=n;k++){await touch('touchMove',[[a[0]+(c[0]-a[0])*k/n,a[1]+(c[1]-a[1])*k/n]]);await W(25)}await touch('touchEnd',[])};
  /* hold on a point, wiggling a little, for ms */
  const hold=async(pt,ms,r=6)=>{await touch('touchStart',[pt]);const t0=Date.now();let k=0;while(Date.now()-t0<ms){k++;await touch('touchMove',[[pt[0]+Math.cos(k)*r,pt[1]+Math.sin(k*1.3)*r]]);await W(50)}await touch('touchEnd',[])};
  const circle=async(c,R,ms)=>{await touch('touchStart',[[c[0]+R,c[1]]]);const t0=Date.now();let a=0;while(Date.now()-t0<ms){a+=.35;await touch('touchMove',[[c[0]+Math.cos(a)*R,c[1]+Math.sin(a)*R*.5]]);await W(40)}await touch('touchEnd',[])};
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const waitPhase=(ph,ms=15000)=>p.waitForFunction(ph=>{const s=window.ML.__jb();return [].concat(ph).includes(s.phase)},ph,{timeout:ms});
  const waitFor=(fn,arg,ms=15000)=>p.waitForFunction(fn,arg,{timeout:ms});
  /* screen check: visible text, emoji, buttons (picture ≥50%, ≥110px, back ≥64px), and no other buttons than cards/back */
  const textBad=[],extraBtn=[];
  const check=async tag=>{const t=await p.evaluate(()=>{
    const scr=document.getElementById('jobs'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('style'))texts.push(t)}
    const btns=[...scr.querySelectorAll('button')].filter(vis).map(bt=>{const r=bt.getBoundingClientRect(),s=[...bt.querySelectorAll('svg')].filter(vis),sw=s.length?Math.max(...s.map(x=>x.getBoundingClientRect().width)):0;return{cls:bt.className,w:Math.round(r.width),h:Math.round(r.height),ratio:+(sw/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    return{texts,bad:btns.filter(x=>x.ratio<.5||x.text),small:btns.filter(x=>!/jb-back/.test(x.cls)&&Math.min(x.w,x.h)<110),back:btns.filter(x=>/jb-back/.test(x.cls)&&Math.min(x.w,x.h)<64),other:btns.filter(x=>!/jb-back|jb-card/.test(x.cls)),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent),btns:btns.length}});
    if(t.texts.length||t.bad.length||t.small.length||t.back.length||t.emoji)textBad.push(tag+': '+JSON.stringify(t));if(t.other.length)extraBtn.push(tag+': '+JSON.stringify(t.other));return t};
  const cardOf=(s,f)=>s.cards.find(f);
  async function pickJob(job){let s=await st();let c=cardOf(s,x=>x.job===job&&!x.slot);
    for(let k=0;k<6&&!c;k++){await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('jobs'));await waitPhase('pick');await W(900);s=await st();c=cardOf(s,x=>x.job===job&&!x.slot)}
    await tap(...c.pt);await waitPhase('dress');await W(900);return st()}
  async function wearSlot(slot,byDrag){let s=await st();const c=cardOf(s,x=>x.slot===slot&&!x.decoy);if(!c)return s;
    if(byDrag)await drag(c.pt,s.slotPts.top);else await tap(...c.pt);await W(250);await waitFor(()=>!window.ML.__jb().busy);await W(300);return st()}
  async function rideByTap(){await waitPhase('car',12000);await W(300);const s=await st();await shot(s.job+'_3car');await tap(s.car[0],s.car[1]-10);await waitPhase('mission',9000);await W(1400)}
  async function finishRound(tag){await waitPhase('thanks',20000);await W(1500);await check(tag+' thanks');await shot(tag+'_6thanks');await waitPhase('photo',9000);await W(1200);await check(tag+' photo');await shot(tag+'_7photo');
    await waitPhase('stamp',6000);await W(900);await shot(tag+'_8stamp');await waitPhase('pick',9000);await W(800)}

  const FROM=+(process.env.JB_FROM||1);let s;
  if(FROM<3){
  /* ---------- level 1: the cards ---------- */
  await p.evaluate(()=>window.ML.go('jobs'));await waitPhase('pick');await W(1200);
  s=await st();
  ok('1단계 직업 카드: 소방관 · 의사, 3장 이하, 110px 이상',s.shown.includes('firefighter')&&s.shown.includes('doctor')&&s.cards.length<=3&&s.cards.every(c=>Math.min(c.w,c.h)>=110),s.shown.join(',')+' '+s.cards.map(c=>Math.round(c.w)+'×'+Math.round(c.h)).join(','));
  ok('인형이 살아 있음 (ML.Alive)',!!s.alive,s.alive&&s.alive.kind);
  await check('pick');await shot('jb_1cards');
  s=await pickJob('firefighter');
  ok('카드를 콕 → 이름을 말하고 옷 입히기로',s.phase==='dress'&&s.job==='firefighter'&&s.log.includes('say:소방관!'),s.said);
  ok('1단계 옷 카드: 그 직업의 모자 · 옷 · 도구 3장만 (다른 직업 것 없음)',s.cards.length===3&&s.cards.every(c=>c.job==='firefighter'&&!c.decoy),s.cards.map(c=>c.job+':'+c.slot).join(','));
  await check('dress');
  /* 1) no 출동 before all three */
  let go0=await p.evaluate(()=>window.ML.__jbGo());await tap(300,560);await W(400);s=await st();
  ok('1) 옷 0가지: 탈것 없음 · 출동 훅 거절 · 오른쪽 아래를 눌러도 그대로',!s.car&&!s.canGo&&go0===false&&s.phase==='dress',`car=${!!s.car} go=${go0} phase=${s.phase}`);
  s=await wearSlot('hat');
  ok('모자를 콕 → 붙고 이름(두 언어)',s.wear.hat&&s.log.some(l=>/say:.*헬멧!/.test(l)),JSON.stringify(s.wear)+' '+s.said);
  s=await wearSlot('top',true);
  ok('옷 카드를 끌어서 놓아도 붙음',!!s.wear.top,JSON.stringify(s.wear));
  await W(2300);await shot('firefighter_1dressing');
  go0=await p.evaluate(()=>window.ML.__jbGo());await tap(300,560);await W(1600);s=await st();
  ok('1) 옷 2가지: 아직 출동 안 됨 (탈것 없음, 거울도 안 나옴)',!s.car&&!s.canGo&&go0===false&&s.phase==='dress',`car=${!!s.car} go=${go0} phase=${s.phase}`);
  /* swap colour, take off, put back */
  const col0=s.wear.hat;await tap(...s.slotPts.hat);await W(500);s=await st();
  ok('입은 모자를 콕 → 색이 바뀜(바꾸기)',s.wear.hat&&s.wear.hat!==col0,col0+' → '+s.wear.hat);
  await drag(s.slotPts.hat,[195,700]);await W(600);s=await st();
  ok('입은 모자를 끌어내면 벗겨지고 카드가 돌아옴(떼기)',!s.wear.hat&&s.cards.some(c=>c.slot==='hat'),JSON.stringify(s.wear));
  s=await wearSlot('hat');s=await wearSlot('tool');
  ok('3가지 다 입음',s.allWorn,JSON.stringify(s.wear));
  await waitPhase('mirror',4000);await W(1300);await check('mirror');await shot('firefighter_2mirror');
  await waitPhase('car',8000);s=await st();ok('1) 3가지를 다 입은 뒤에야 탈것이 오고 출동할 수 있음',!!s.car&&s.canGo,JSON.stringify(s.car));
  await check('car');await rideByTap();s=await st();
  ok('탈것을 콕 → 타고 출동 → 불난 집',s.phase==='mission'&&s.ms.fires&&s.ms.fires.length===3&&s.tool,JSON.stringify(s.ms.fires&&s.ms.fires.map(f=>f.lv)));
  await check('fire');
  /* 2) only the touched fire shrinks */
  let f=s.ms.fires;await hold(f[0].aim,900);s=await st();
  const part=s.ms.fires;
  ok('2) 물줄기가 닿은 불만 작아짐 (1번 불만 줄고 2·3번은 그대로)',part[0].lv>0&&part[1].lv===0&&part[2].lv===0,part.map(x=>x.lv).join(' / '));
  await touch('touchStart',[f[0].aim]);for(let k=0;k<6;k++){await touch('touchMove',[[f[0].aim[0]+k,f[0].aim[1]]]);await W(60)}await shot('firefighter_4mission_mid');
  for(let k=0;k<30;k++){await touch('touchMove',[[f[0].aim[0]+Math.cos(k)*5,f[0].aim[1]+Math.sin(k)*5]]);await W(60)}await touch('touchEnd',[]);await W(300);
  await hold(f[1].aim,2600);await W(300);
  /* third fire halfway */
  await hold(f[2].aim,500);await W(1500);s=await st();
  ok('2) 2곳을 끄고 3번째를 반만 끄면 아직 안 끝남',s.ms.fires[0].out&&s.ms.fires[1].out&&!s.ms.fires[2].out&&s.mstep===0&&s.toolDone===false,s.ms.fires.map(x=>x.lv+(x.out?'(꺼짐)':'')).join(' / ')+' step='+s.mstep);
  await hold(f[2].aim,2600);await W(1400);s=await st();
  ok('2) 3곳을 다 끄면 끝나고 다음 일(고양이 구하기)',s.ms.fires.every(x=>x.out)&&s.mstep===1,s.ms.fires.map(x=>x.lv).join(' / ')+' step='+s.mstep);
  await check('cat');await shot('firefighter_5cat');
  await tap(...s.ms.cat);await W(400);s=await st();ok('지붕 위 고양이를 콕 → 사다리로 구함',s.log.includes('cat'),'');
  await finishRound('firefighter');s=await st();
  ok('고마워 → 사진 카드 → 도장 → 별 1칸, 다시 직업 카드',s.phase==='pick'&&s.log.includes('photo')&&s.log.includes('stamp')&&s.log.includes('star:1'),s.log.filter(l=>/thanks|photo|stamp|star/.test(l)).join(','));

  /* ---------- 3) firefighter by taps only ---------- */
  s=await pickJob('firefighter');
  for(const sl of ['tool','hat','top'])s=await wearSlot(sl,false);
  await rideByTap();s=await st();
  let taps=0;for(let k=0;k<60&&s.mstep===0;k++){const fi=s.ms.fires.find(x=>!x.out);if(!fi)break;await tap(...fi.aim);taps++;await W(520);s=await st()}
  ok('3) 불 3곳을 콕콕만으로 끔 (tapAlso)',s.ms.fires.every(x=>x.out),`콕 ${taps}번`);
  await waitFor(()=>window.ML.__jb().mstep===1,null,5000);s=await st();const ct=s.cards.find(c=>c.act==='ladder');await tap(...ct.pt);
  await finishRound('firefighter_tap');s=await st();ok('3) 소방관 한 판을 콕만으로 끝까지',s.log.filter(l=>l==='star:2').length===1,'');

  /* ---------- 4) doctor ---------- */
  s=await pickJob('doctor');await shot('doctor_0cards');
  s=await wearSlot('top');await W(2300);await shot('doctor_1dressing');s=await wearSlot('hat',true);s=await wearSlot('tool');
  await waitPhase('mirror',4000);await W(1300);await shot('doctor_2mirror');
  await rideByTap();s=await st();await check('clinic');
  ok('의사: 진료실, 아픈 곰과 아픈 곳 3군데',s.ms.spots&&s.ms.spots.length===3&&s.helpers>=1,'');
  await touch('touchStart',[s.ms.chest]);for(let k=0;k<20;k++){await touch('touchMove',[[s.ms.chest[0]+Math.cos(k)*4,s.ms.chest[1]+Math.sin(k)*4]]);await W(60)}await shot('doctor_4mission_mid');
  for(let k=0;k<50&&!(await st()).mstep;k++){await touch('touchMove',[[s.ms.chest[0]+Math.cos(k)*6,s.ms.chest[1]+Math.sin(k)*6]]);await W(60)}await touch('touchEnd',[]);await W(1400);s=await st();
  ok('4) 청진기를 가슴에 대면 두근두근 소리, 끝나면 반창고',s.log.filter(l=>l==='beat').length>=2&&s.mstep===1,`두근 ${s.log.filter(l=>l==='beat').length}번`);
  await check('plaster');
  await tap(...s.ms.spots.find(x=>!x.done).pt);await W(700);s=await st();
  const pc=s.cards.find(c=>c.act==='plaster');await drag(pc.pt,s.ms.spots.find(x=>!x.done).pt);await W(700);s=await st();await shot('doctor_5plaster');
  await tap(...pc.pt);await W(700);s=await st();
  ok('4) 반창고: 곰을 콕 · 카드를 끌어 놓기 · 카드를 콕 → 3군데 다 붙음',s.ms.spots.every(x=>x.done)&&s.log.filter(l=>l==='plaster').length===3,'');
  await finishRound('doctor');

  /* ---------- 5) level 2 ---------- */
  await p.evaluate(()=>window.ML.__jbLevel(2));await waitPhase('pick');await W(1200);s=await st();
  ok('2단계 카드: 요리사 · 경찰관이 생김, 3장',s.level===2&&s.levelJobs.includes('chef')&&s.levelJobs.includes('police')&&s.cards.length===3,s.shown.join(','));
  s=await pickJob('chef');
  ok('2단계 옷 카드 3장 중 하나는 다른 직업 것',s.cards.length===3&&s.cards.filter(c=>c.decoy).length===1,s.cards.map(c=>c.job+':'+c.slot).join(','));
  const dc=s.cards.find(c=>c.decoy),w0=JSON.stringify(s.wear);await tap(...dc.pt);await W(1400);s=await st();
  const kos={firefighter:'소방관',doctor:'의사',police:'경찰관',chef:'요리사'};
  ok("5) 다른 직업 옷을 누르면 붙지 않고 이름을 말해 줌 ('이건 ○○ ○○야!')",JSON.stringify(s.wear)===w0&&s.log.some(l=>l.startsWith('say:이건 '+kos[dc.job])),s.said);
  await shot('chef_1decoy');
  for(const sl of ['hat','top','tool']){s=await wearSlot(sl,sl==='top')}
  await waitPhase('mirror',4000);await W(1300);await shot('chef_2mirror');
  await rideByTap();s=await st();await check('kitchen');
  await circle(s.ms.potAim,40,1200);await shot('chef_4mission_mid');
  for(let k=0;k<12&&!(await st()).mstep;k++)await circle(s.ms.potAim,45,900);await W(1400);s=await st();
  ok('요리사: 국자로 저으면 수프가 바뀌고, 다 저으면 담기',s.mstep===1&&s.ms.stir.every(v=>v>=1),s.ms.stir.map(v=>v.toFixed(1)).join(','));
  await tap(...s.ms.potAim);await W(1100);s=await st();const sc=s.cards.find(c=>c.act==='scoop');await tap(...sc.pt);await W(1100);await shot('chef_5serve');s=await st();await tap(...s.ms.bowl);await W(1100);s=await st();
  ok('요리사: 세 번 떠 담으면 손님에게 (만든 만큼)',s.ms.scoops===3,'떠 담은 수 '+s.ms.scoops);
  await finishRound('chef');
  s=await pickJob('police');
  for(const sl of ['top','tool','hat']){s=await wearSlot(sl);const d=s.cards.find(c=>c.decoy);if(d&&sl==='top'){await tap(...d.pt);await W(1300)}}
  await W(2300);await shot('police_1dressing');s=await st();if(!s.allWorn){for(const sl of ['hat','top','tool'])if(!s.wear[sl])s=await wearSlot(sl)}
  await waitPhase('mirror',4000);await W(1300);await shot('police_2mirror');
  await rideByTap();s=await st();await check('street');
  await hold(s.ms.cars[0].pt,700);s=await st();
  ok('경찰관: 표지판이 닿은 차만 멈춤',s.ms.cars[0].lv>0&&s.ms.cars[1].lv===0,s.ms.cars.map(c=>c.lv).join(' / '));
  await touch('touchStart',[s.ms.cars[0].pt]);for(let k=0;k<6;k++){await touch('touchMove',[[s.ms.cars[0].pt[0]+k,s.ms.cars[0].pt[1]]]);await W(60)}await shot('police_4mission_mid');await touch('touchEnd',[]);
  await hold(s.ms.cars[0].pt,2500);await hold(s.ms.cars[1].pt,3000);await W(1400);s=await st();
  ok('경찰관: 차 2대를 다 세우면 오리 건너기',s.ms.cars.every(c=>c.stop)&&s.mstep===1,s.ms.cars.map(c=>c.lv).join(' / '));
  await check('ducks');
  await tap(...s.ms.ducks[0].pt);await W(600);await shot('police_5ducks');s=await st();const wc=s.cards.find(c=>c.act==='whistle');
  for(let k=0;k<3;k++){await tap(...(k%2?wc.pt:s.ms.zone));await W(700)}
  await W(1500);s=await st();ok('경찰관: 오리 4마리가 콕콕으로 다 건넘',s.ms.ducks.every(d=>d.across),'');
  await finishRound('police');
  }

  /* ---------- one round of any job, by touch only (used from level 3 on) ---------- */
  async function dressAll(){for(let k=0;k<6;k++){s=await st();if(s.allWorn||s.phase!=='dress')break;const c=s.cards.find(x=>x.slot&&!x.decoy);if(!c)break;await tap(...c.pt);await W(300);await waitFor(()=>!window.ML.__jb().busy);await W(350)}
    await waitPhase('mirror',5000);await W(1300)}
  const holdUntil=async(pt,cond,arg,ms=9000)=>{await touch('touchStart',[pt]);const t0=Date.now();let k=0;while(Date.now()-t0<ms){k++;await touch('touchMove',[[pt[0]+Math.cos(k)*5,pt[1]+Math.sin(k*1.3)*5]]);await W(60);if(k%5===0&&(await p.evaluate(cond,arg)))break}await touch('touchEnd',[])};
  async function playMission(job,tag){
    s=await st();
    if(job==='firefighter'){for(let k=0;k<70&&s.mstep===0;k++){const fi=s.ms.fires.find(x=>!x.out);if(!fi)break;await tap(...fi.aim);await W(520);s=await st()}await waitFor(()=>window.ML.__jb().mstep===1,null,6000);s=await st();await tap(...s.ms.cat)}
    else if(job==='doctor'){await holdUntil(s.ms.chest,()=>window.ML.__jb().mstep===1,null,12000);await W(1500);for(let k=0;k<3;k++){s=await st();const sp=s.ms.spots.find(x=>!x.done);if(!sp)break;await tap(...sp.pt);await W(800)}}
    else if(job==='chef'){for(let k=0;k<14&&!(await st()).mstep;k++)await circle(s.ms.potAim,45,900);await W(1500);for(let k=0;k<3;k++){s=await st();await tap(...s.ms.potAim);await W(1200)}}
    else if(job==='police'){for(const i of [0,1]){s=await st();await holdUntil(s.ms.cars[i].pt,i=>window.ML.__jb().ms.cars[i].stop,i,8000)}await W(1500);for(let k=0;k<4;k++){s=await st();const d=s.ms.ducks.find(x=>!x.across);if(!d)break;await tap(...d.pt);await W(500)}}
    else if(job==='mail'){for(let k=0;k<3;k++){s=await st();const b=s.ms.boxes.find(x=>x.k===s.ms.letter);await tap(...b.pt);await W(1100)}await waitFor(()=>window.ML.__jb().ms.sub==='ride',null,6000);await W(800);
      for(let k=0;k<3;k++){s=await st();await tap(...s.ms.bike);await W(800)}await waitFor(()=>window.ML.__jb().ms.sub==='deliver',null,6000);await W(500);s=await st();await tap(...s.ms.houses.find(h=>h.k===s.ms.parcel).pt)}
    else if(job==='farmer'){for(const sub of ['dig','seed']){await waitFor(sub=>window.ML.__jb().ms.sub===sub,sub,8000);for(let k=0;k<3;k++){s=await st();const want=sub==='dig'?'flat':'hole';const sp=s.ms.spots.find(x=>x.st===want);if(!sp)break;await tap(...sp.pt);await W(650)}}
      await waitFor(()=>window.ML.__jb().ms.sub==='water',null,8000);await W(2400);for(let i=0;i<3;i++){s=await st();await holdUntil(s.ms.spots[i].pt,i=>window.ML.__jb().ms.spots[i].g>=1||window.ML.__jb().ms.sub!=='water',i,7000)}
      await waitFor(()=>window.ML.__jb().ms.sub==='pull',null,8000);for(let k=0;k<3;k++){s=await st();const sp=s.ms.spots.find(x=>x.st==='carrot');if(!sp)break;await tap(...sp.pt);await W(1100)}
      await waitFor(()=>window.ML.__jb().ms.sub==='feed',null,9000);await W(900);for(let k=0;k<3;k++){s=await st();await tap(...s.ms.hen);await W(900)}await waitFor(()=>!!window.ML.__jb().ms.egg,null,5000);s=await st();await tap(...s.ms.egg)}
    else if(job==='vet'){await holdUntil(s.ms.chest,()=>window.ML.__jb().mstep===1,null,12000);await waitFor(()=>window.ML.__jb().ms.sub==='wrap',null,6000);await W(400);for(let k=0;k<3;k++){s=await st();await tap(...s.ms.paw);await W(700)}
      await waitFor(()=>window.ML.__jb().ms.sub==='meds',null,6000);await W(300);for(let k=0;k<3;k++){s=await st();await tap(...s.ms.mouth);await W(1100)}}
    await finishRound(tag);
  }
  const KO={firefighter:'소방관',doctor:'의사',police:'경찰관',chef:'요리사',mail:'집배원',farmer:'농부',vet:'수의사'};

  /* ---------- 7) level 3: mail carrier, farmer ---------- */
  await p.evaluate(()=>{window.ML.go('jobs')});await W(300);await p.evaluate(()=>window.ML.__jbLevel(3));await waitPhase('pick');await W(1300);s=await st();
  ok('7) 3단계 카드: 집배원 · 농부가 꼭 나옴, 3장, 110px 이상',s.level===3&&s.shown.includes('mail')&&s.shown.includes('farmer')&&s.cards.length===3&&s.cards.every(c=>Math.min(c.w,c.h)>=110),s.shown.join(','));
  await check('l3 pick');await shot('l3_1cards');
  s=await pickJob('mail');await check('mail dress');
  ok('7) 집배원 옷 카드 3장(모자 · 조끼 · 가방), 하나는 다른 직업 것일 수 있음',s.cards.length===3&&s.cards.filter(c=>c.job==='mail').length>=2,s.cards.map(c=>c.job+':'+c.slot).join(','));
  await dressAll();await shot('mail_2mirror');await rideByTap();s=await st();await check('mail sort');await shot('mail_4sort');
  ok('7) 집배원 일 1: 우체통 3개(별 · 하트 · 꽃)와 편지 한 통',s.ms.boxes&&s.ms.boxes.length===3&&!!s.ms.letter&&s.cards.some(c=>c.act==='letter'),JSON.stringify(s.ms.boxes&&s.ms.boxes.map(b=>b.k)));
  {const wrongB=s.ms.boxes.find(b=>b.k!==s.ms.letter);await tap(...wrongB.pt);await W(900);const t=await st();
    ok("7) 다른 그림 우체통을 누르면 안 들어가고 '어?' 하고 알려 줌",t.ms.sorted===0&&t.log.some(l=>l.startsWith('mailwrong:'))&&/^어\?/.test(t.said),t.said)}
  s=await st();{const c=s.cards.find(x=>x.act==='letter'),b=s.ms.boxes.find(x=>x.k===s.ms.letter);await drag(c.pt,b.pt,14);await W(1200)}
  s=await st();ok('7) 편지 카드를 같은 그림 우체통으로 끌면 쏙',s.ms.sorted===1,'넣은 편지 '+s.ms.sorted);await shot('mail_5sort_mid');
  for(let k=0;k<2;k++){s=await st();const b=s.ms.boxes.find(x=>x.k===s.ms.letter);await tap(...b.pt);await W(1200)}
  s=await st();ok('7) 편지 3통을 다 넣어야 일 1이 끝나고, 일 2(자전거)로',s.ms.sorted===3&&s.ms.boxes.every(b=>b.full),`넣은 편지 ${s.ms.sorted}`);
  await waitFor(()=>window.ML.__jb().ms.sub==='ride',null,6000);await W(900);s=await st();await check('mail ride');await shot('mail_6bike');
  ok('7) 일이 두 가지: 일 2로 넘어감 (과정 줄 4번째)',s.mstep===1&&s.ms.sub==='ride',`mstep=${s.mstep} sub=${s.ms.sub}`);
  await tap(...s.ms.bike);await W(900);s=await st();ok('7) 자전거를 콕 → 앞으로 달림(1/3)',s.ms.ride>0.3&&s.ms.ride<0.4,'ride='+s.ms.ride);
  for(let k=0;k<2;k++){s=await st();await tap(...s.ms.bike);await W(900)}
  await waitFor(()=>window.ML.__jb().ms.sub==='deliver',null,6000);await W(600);s=await st();await check('mail deliver');await shot('mail_7houses');
  {const wh=s.ms.houses.find(h=>h.k!==s.ms.parcel);await tap(...wh.pt);await W(900);const t=await st();ok("7) 다른 그림 집 문을 누르면 '어?' 하고 다시",!t.ms.delivered&&t.log.some(l=>l.startsWith('doorwrong:')),t.said)}
  s=await st();await tap(...s.ms.houses.find(h=>h.k===s.ms.parcel).pt);await W(600);s=await st();
  ok('7) 같은 그림 집 문을 누르면 소포 배달',s.ms.delivered&&s.log.includes('parcel'),'');
  await finishRound('mail');s=await st();ok('7) 집배원 한 판 끝 (고마워 · 사진 · 도장 · 별)',s.phase==='pick'&&s.log.filter(l=>l==='parcel').length===1,'');
  /* farmer */
  s=await pickJob('farmer');await check('farmer dress');await dressAll();await shot('farmer_2mirror');await rideByTap();s=await st();await check('farm');await shot('farmer_4dig');
  ok('7) 농부 일 1: 밭 3곳 · 삽 카드',s.ms.spots&&s.ms.spots.length===3&&s.cards.some(c=>c.act==='shovel'),'');
  for(let k=0;k<3;k++){s=await st();const sp=s.ms.spots.find(x=>x.st==='flat');if(!sp)break;if(k===1){const c=s.cards.find(x=>x.act==='shovel');await tap(...c.pt)}else await tap(...sp.pt);await W(700)}
  s=await st();ok('7) 농부: 삽으로 구멍 3개 (콕 · 카드 콕)',s.ms.spots.every(x=>x.st==='hole')&&s.log.filter(l=>l==='dig').length===3,s.ms.spots.map(x=>x.st).join(','));
  await waitFor(()=>window.ML.__jb().ms.sub==='seed',null,5000);
  {const c=s.cards.find(x=>x.act==='seeds')||(await st()).cards.find(x=>x.act==='seeds');const sp=(await st()).ms.spots[2];await drag(c.pt,sp.pt,12);await W(700)}
  for(let k=0;k<2;k++){s=await st();const sp=s.ms.spots.find(x=>x.st==='hole');if(!sp)break;await tap(...sp.pt);await W(700)}
  s=await st();ok('7) 농부: 씨앗 3개 심기 (끌기 · 콕)',s.log.filter(l=>l==='seed').length===3,s.ms.spots.map(x=>x.st).join(','));
  await waitFor(()=>window.ML.__jb().ms.sub==='water',null,6000);await W(2400);s=await st();
  await hold(s.ms.spots[0].pt,700);s=await st();
  ok('7) 농부: 물이 닿은 곳만 싹이 자람 (1번만 자라고 2 · 3번은 그대로)',s.ms.spots[0].g>0&&s.ms.spots[1].g===0&&s.ms.spots[2].g===0,s.ms.spots.map(x=>x.g).join(' / '));
  await touch('touchStart',[s.ms.spots[1].pt]);for(let k=0;k<6;k++){await touch('touchMove',[[s.ms.spots[1].pt[0]+k,s.ms.spots[1].pt[1]]]);await W(60)}await shot('farmer_5water');await touch('touchEnd',[]);
  for(let i=0;i<3;i++){s=await st();await holdUntil(s.ms.spots[i].pt,i=>window.ML.__jb().ms.spots[i].g>=1||window.ML.__jb().ms.sub!=='water',i,7000)}
  await waitFor(()=>window.ML.__jb().ms.sub==='pull',null,8000);await W(400);s=await st();await check('farm pull');await shot('farmer_6carrots');
  ok('7) 농부: 물을 다 주면 당근 3개가 자람',s.ms.spots.every(x=>x.st==='carrot'),s.ms.spots.map(x=>x.st).join(','));
  for(let k=0;k<3;k++){s=await st();const sp=s.ms.spots.find(x=>x.st==='carrot');if(!sp)break;await tap(...sp.pt);await W(1200)}
  s=await st();ok('7) 농부: 당근 3개를 뽑아 바구니에 (심은 만큼 뽑기)',s.ms.carrots===3,'당근 '+s.ms.carrots);
  await waitFor(()=>window.ML.__jb().ms.sub==='feed',null,9000);await W(1000);s=await st();await check('hen');await shot('farmer_7hen');
  ok('7) 농부 일 2: 암탉 (과정 줄 4번째)',s.mstep===1&&!!s.ms.hen,'');
  for(let k=0;k<3;k++){s=await st();if(k===2){const c=s.cards.find(x=>x.act==='grain');await tap(...c.pt)}else await tap(...s.ms.hen);await W(900)}
  await waitFor(()=>!!window.ML.__jb().ms.egg,null,5000);await W(500);s=await st();await shot('farmer_8egg');ok('7) 모이를 세 번 주면 달걀',s.ms.feeds===3&&!!s.ms.egg,'');
  await tap(...s.ms.egg);await W(800);s=await st();ok('7) 달걀을 콕 → 바구니에',s.ms.eggIn,'');
  await finishRound('farmer');

  /* ---------- 8) level 4: the friend asks for help, then the vet ---------- */
  await p.evaluate(()=>window.ML.__jbLevel(4));await waitPhase('pick');await W(1400);s=await st();
  ok('8) 4단계: 친구와 그림 말풍선, 직업 카드 3장 중 하나가 정답',s.askLevel&&!!s.ask&&s.cards.length===3&&s.shown.includes(s.ask)&&s.helpers>=1,`정답 ${s.ask} · 카드 ${s.shown.join(',')}`);
  ok('8) 의사와 수의사는 같이 나오지 않음',!(s.shown.includes('doctor')&&s.shown.includes('vet')),s.shown.join(','));
  await check('ask');await shot('l4_1ask');
  {const w=s.cards.find(c=>c.job!==s.ask);await tap(...w.pt);await W(1300);const t=await st();
    ok("8) 틀린 직업을 누르면 '어?' 하고 다시 물어봄 (실패 없이 그대로 고르기)",t.phase==='pick'&&t.log.includes('askwrong:'+w.job)&&/^어\?/.test(t.said)&&t.cards.length===3,t.said);await shot('l4_2wrong')}
  s=await st();{const r=s.cards.find(c=>c.job===s.ask);await tap(...r.pt);await waitPhase('dress');await W(900)}s=await st();
  ok('8) 맞는 직업을 누르면 그 직업 옷 입히기로',s.phase==='dress'&&s.job===s.ask&&s.log.some(l=>l.startsWith('say:맞아')),s.job);
  let firstJob=s.job;{const job=s.job;await dressAll();await rideByTap();await playMission(job,'l4_'+job)}
  /* make sure the vet comes up and plays through (the first round counts when it already was the vet) */
  let vetOk=firstJob==='vet';
  for(let k=0;k<40&&!vetOk;k++){s=await st();if(s.ask==='vet'){vetOk=true;break}await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('jobs'));await waitPhase('pick');await W(900)}
  ok('8) 강아지가 아파요 → 수의사가 정답으로 나옴',vetOk,'');
  if(vetOk&&firstJob!=='vet'){await W(800);await shot('l4_3vet_ask');s=await st();await tap(...s.cards.find(c=>c.job==='vet').pt);await waitPhase('dress');await W(900);await check('vet dress');
    await dressAll();await shot('vet_2mirror');await rideByTap();s=await st();await check('vet clinic');await shot('vet_4listen');
    await touch('touchStart',[s.ms.chest]);for(let k=0;k<20;k++){await touch('touchMove',[[s.ms.chest[0]+Math.cos(k)*5,s.ms.chest[1]+Math.sin(k)*5]]);await W(60)}await shot('vet_4listen_mid');await touch('touchEnd',[]);
    await holdUntil(s.ms.chest,()=>window.ML.__jb().mstep===1,null,12000);await W(200);s=await st();
    ok('8) 수의사: 청진기로 두근두근, 끝나면 붕대 (일 2로)',s.log.filter(l=>l==='beat').length>=2&&s.mstep===1,`두근 ${s.log.filter(l=>l==='beat').length}번`);
    await waitFor(()=>window.ML.__jb().ms.sub==='wrap',null,6000);await W(300);s=await st();await check('vet wrap');
    await tap(...s.ms.paw);await W(700);s=await st();{const c=s.cards.find(x=>x.act==='bandage');await drag(c.pt,s.ms.paw,12);await W(700);await tap(...c.pt);await W(800)}
    s=await st();await shot('vet_5wrap');ok('8) 수의사: 아픈 발에 붕대 세 번 (콕 · 끌기 · 카드 콕)',s.ms.wraps===3,'감은 수 '+s.ms.wraps);
    await waitFor(()=>window.ML.__jb().ms.sub==='meds',null,6000);await W(300);s=await st();await check('vet meds');
    await tap(...s.ms.mouth);await W(1100);s=await st();await shot('vet_6meds');{const c=s.cards.find(x=>x.act==='meds');await tap(...c.pt);await W(1100)}s=await st();await tap(...s.ms.mouth);await W(1100);s=await st();
    ok('8) 수의사: 물약 세 방울 → 강아지가 폴짝폴짝',s.ms.drops===3,'방울 '+s.ms.drops);
    await finishRound('vet')}

  /* ---------- 9) level 5: family faces ---------- */
  await p.evaluate(async()=>{const F=window.ML.Faces;if(F){await F.ready;await F.__wipe()}});
  await p.evaluate(()=>window.ML.__jbLevel(5));await waitPhase('pick');await W(1400);s=await st();
  ok('9) 5단계 · 가족 얼굴 없음: 늘 하던 인형 (얼굴 사진 없음, 오류 없음)',s.level===5&&s.family&&!s.fam&&!s.photoFace&&s.cards.length===3,`fam=${s.fam}`);
  await shot('l5_1nofaces');
  {const r=s.cards.find(c=>c.job===s.ask);await tap(...r.pt);await waitPhase('dress');await W(900);s=await st();ok("9) 얼굴이 없으면 '○○ 옷을 입어 보자'(이름 없이)",/옷을 입어 보자/.test(s.said),s.said);
    const job=s.job;await dressAll();await rideByTap();await playMission(job,'l5n_'+job)}
  const saved=await p.evaluate(async()=>{const F=window.ML.Faces;if(!F)return false;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#F2C8A8';g.fillRect(0,0,64,64);g.fillStyle='#5B3A29';g.beginPath();g.arc(22,28,4,0,7);g.arc(42,28,4,0,7);g.fill();g.lineWidth=3;g.beginPath();g.arc(32,40,9,0,Math.PI);g.stroke();
    await F.ready;return await F.save({id:'mom',photo:c.toDataURL('image/png'),ko:'엄마',en:'Mom'})});
  ok('9) 테스트 얼굴 저장',!!saved,'');
  await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('jobs'));await waitPhase('pick');await W(1400);s=await st();
  ok('9) 5단계 · 가족 얼굴 있음: 엄마 얼굴이 인형 얼굴에 (카드 그림에도)',s.fam==='mom'&&s.photoFace&&(await p.evaluate(()=>[...document.querySelectorAll('#jbTray .jb-card image')].length))>=1,`fam=${s.fam} photo=${s.photoFace}`);
  await check('l5 ask');await shot('l5_2face_ask');
  {const r=s.cards.find(c=>c.job===s.ask);await tap(...r.pt);await waitPhase('dress');await W(900);s=await st();const job=s.job;
    ok("9) 옷 입히기 말: '엄마 ○○ 옷을 입혀 보자'",s.said.startsWith('엄마 '+KO[job]),s.said);
    await dressAll();await shot('l5_3face_mirror');await waitPhase('car',9000);await W(300);s=await st();
    ok("9) 출동 말: '엄마 ○○ 출동!'",s.log.some(l=>l==='say:엄마 '+KO[job]+' 출동! 차를 콕 눌러서 타자!'),s.said);
    await rideByTap();await shot('l5_4face_mission');s=await st();ok('9) 일하는 동안에도 엄마 얼굴',s.photoFace,'');
    await playMission(job,'l5f_'+job);s=await st();ok("9) 고마워 · 사진 말에 '엄마'",s.log.some(l=>/^say:.*엄마 /.test(l)&&/고마워요|엄마 \S+!$/.test(l)),s.log.filter(l=>/엄마/.test(l)).slice(-2).join(' | '))}

  /* ---------- 6) rules ---------- */
  ok('6) 글자 · 이모지 없음, 버튼은 그림 50% 이상 · 110px 이상 (뒤로 가기 64px)',!textBad.length,textBad.slice(0,3).join(' || '));
  ok("6) '다음' 같은 버튼이 한 번도 없음 (카드와 뒤로 가기만)",!extraBtn.length,extraBtn.slice(0,3).join(' || '));
  const depth=await p.evaluate(()=>window.ML.__jbDepth());
  console.log('깊이 표: '+depth.map(d=>`${d.level}단계 ${d.jobs.join('·')} | 과정 ${d.processes} | 손동작 ${d.hands.join('+')} | 손님 ${d.someone} | 고르기 ${d.choice} | 골라내기 ${d.decoy} | 도와주세요 ${d.ask} | 가족 ${d.family} | 끝 ${d.ending}`).join('\n          '));
  ok('깊이: 과정 4개 이상 · 손동작 2가지 이상 · 손님 · 고르기 · 끝내기 (5단계 모두)',depth.length===5&&depth.every(d=>d.processes>=4&&d.hands.length>=2&&d.someone&&d.choice&&d.ending),'단계 '+depth.length);
  ok('페이지 오류 없음',!errs.length,errs.slice(0,3).join(' | '));
  console.log(fails?`\n실패 ${fails}개`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n').slice(0,3).join(' '));process.exit(1)});
