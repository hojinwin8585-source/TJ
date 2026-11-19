/* P18 18-나 완료 기준 검사: node tests/p18b.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   모든 손동작은 휴대폰 화면(isMobile) + CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다.
   1) 거품기 도구가 손가락을 따라 돌고(도구가 손가락을 따라 움직이고 반죽 소용돌이 각도가 돎) 반죽 섞임 값이 오름
   2) 콕만으로도 젓기 완료 (콕마다 젓기 한 바퀴가 기록됨)
   3) 가루를 넣을 때 입자가 생겼다 0.8초(motion.particles.fadeMs) 안에 사라짐
   4) 입자가 한 번에 40개(motion.particles.max)를 넘지 않음 (빵집 · 피자 · 설거지)
   + 손님 반응: 두 손으로 받아 킁킁 → 한 입 → 볼 볼록이 차례로 기록됨
   (기존 검사 pizza, bakery, dishes, rules, monkey 는 따로 돌립니다) */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:SHOT?2:1});const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__bake());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(50);await touch('touchEnd',[])};
  const shot=async n=>{if(SHOT){const r=await p.locator('#bakeryStage').boundingBox();await p.screenshot({path:path.join(SHOT,n+'.png'),clip:{x:r.x,y:r.y,width:r.width,height:r.height}})}};
  const LIM=await p.evaluate(()=>window.MLCFG.motion.particles);
  let maxParts=0;const watch=s=>{if(s&&s.parts)maxParts=Math.max(maxParts,s.parts.max)};
  const waitStep=async(step,ms=15000)=>{await p.waitForFunction(k=>{const s=window.ML.__bake();return s.step===k&&s.kind!=='wait'&&!s.busy},step,{timeout:ms})};
  const bowl=()=>p.evaluate(()=>{const e=document.querySelector('#bkWork [data-n="bowl"]').getBoundingClientRect();return[e.left+e.width/2,e.top+e.height*.42,e.width*.27]});
  const startRound=async lv=>{await p.evaluate(n=>window.ML.__bakeLevel(n),lv);await p.waitForFunction(()=>window.ML.__bake().phase==='lobby',null,{timeout:9000});await W(700);
    const s=await st();await tap(...s.custPts[0]);};

  /* ---------- 1. the whisk follows the finger round and round, the batter mixes ---------- */
  await p.evaluate(()=>window.ML.go('bakery'));await W(300);await startRound(1);await waitStep('stir');await W(2400);
  let s=await st();const mix0=s.mix,a0=s.swirl?s.swirl.a:0;
  const [cx,cy,R]=await bowl();const fingers=[],tools=[],tilts=[];let tw=0,sawWhisk=false;
  await touch('touchStart',[[cx+R,cy]]);
  for(let k=1;k<=40;k++){const a=k*.3,f=[cx+R*Math.cos(a),cy+R*.45*Math.sin(a)];await touch('touchMove',[f]);await W(25);
    if(k%4===0){const z=await st();watch(z);if(z.toolBox){tw=z.toolBox.w;if(z.toolBox.whisk)sawWhisk=true;fingers.push(f);tools.push([z.toolBox.x,z.toolBox.y]);const m=/rotate\((-?[\d.]+)deg/.exec(z.toolBox.tf||'');tilts.push(m?+m[1]:0)}if(k===16)await shot('p18b_whisk_1');if(k===28)await shot('p18b_whisk_2')}
    if((await st()).step!=='stir')break}
  s=await st();watch(s);await touch('touchEnd',[]);
  const whiskOn=sawWhisk;
  /* the tool centre keeps the same offset from the finger (it follows; the lean of up to 20° moves its box centre a little), and it moved as far as the finger did */
  const offs=tools.map((t,i)=>[t[0]-fingers[i][0],t[1]-fingers[i][1]]),spread=Math.max(...offs.map(o=>Math.hypot(o[0]-offs[0][0],o[1]-offs[0][1]))),
    travel=Math.max(...tools.map(t=>Math.hypot(t[0]-tools[0][0],t[1]-tools[0][1])));
  const turned=Math.abs((s.swirl?s.swirl.a:0)-a0);
  ok('1. 거품기 도구(새 그림)가 손가락을 따라 움직임',whiskOn&&tools.length>=4&&spread<tw*.15&&travel>R*.8,`표본 ${tools.length}개 · 손가락과의 거리 차이 최대 ${spread.toFixed(1)}px (도구 ${Math.round(tw)}px의 15% 안, 기울기 때문) · 도구가 움직인 거리 ${travel.toFixed(0)}px`);
  ok('1. 거품기를 따라 반죽이 빙글빙글 돎 (소용돌이 각도)',turned>=300,`소용돌이 ${turned.toFixed(0)}°`);
  ok('1. 도구가 움직이는 쪽으로 기욺 (최대 20°)',tilts.some(t=>Math.abs(t)>2)&&tilts.every(t=>Math.abs(t)<=20.01),'기울기 '+tilts.map(t=>t.toFixed(0)).join(','));
  ok('1. 반죽 섞임 값이 오름',s.mix>mix0+.3||s.step!=='stir',`섞임 ${mix0} → ${s.mix} (단계 ${s.step})`);

  /* ---------- 2. taps only: stirring finishes ---------- */
  await W(500);await startRound(1);await waitStep('stir');await W(2400);
  const [bx,by,br]=await bowl();let taps=0;s=await st();const swA=s.swirl?s.swirl.a:0;let turnTap=0;
  for(;taps<60&&(await st()).step==='stir';taps++){await tap(bx+br*.5*Math.cos(taps*1.3),by+br*.3*Math.sin(taps*1.3));await W(taps===0?380:560);
    if(taps===0){const z=await st();turnTap=Math.abs((z.swirl?z.swirl.a:0)-swA);await shot('p18b_whisk_tap')}watch(await st())}
  s=await st();const tapLog=s.log.filter(x=>x==='tap:stir').length;
  ok('2. 콕만으로 젓기 완료 (콕마다 젓기 한 번)',s.step!=='stir'&&tapLog>=1,`콕 ${taps}번 · 기록된 젓기 ${tapLog}번 · 첫 콕에 반죽이 ${turnTap.toFixed(0)}° 돎`);

  /* ---------- 3. flour: particles appear and are gone within fadeMs ---------- */
  await W(500);await startRound(2);await waitStep('add');await W(2400);s=await st();
  const samples=[];let lastSpawn=0;
  for(let t=0;t<3;t++){s=await st();await tap(...s.aim);const t0=Date.now();while(Date.now()-t0<1300){const z=await st();samples.push(z.parts);watch(z);if(t===0&&samples.length===8)await shot('p18b_flour');await W(40)}}
  await W(Math.max(0,LIM.fadeMs+150));const after=(await st()).parts;
  const seen=Math.max(...samples.map(x=>x.now)),oldest=Math.max(...samples.map(x=>x.oldest));
  ok('3. 가루를 넣을 때 입자(가루 구름)가 생김',seen>0,`한 번에 보인 입자 최대 ${seen}개`);
  ok('3. 입자는 0.8초 안에 사라짐',oldest<=LIM.fadeMs+60&&after.now===0,`가장 오래 남은 입자 ${oldest}ms (기준 ${LIM.fadeMs}ms) · 마지막 입자 뒤 ${LIM.fadeMs+150}ms에 남은 입자 ${after.now}개`);
  /* finish this round (egg, knead, …) and watch the customer eat */
  const t1=Date.now();let guard=0;
  while(Date.now()-t1<240000){const z=await st();watch(z);if(z.log.includes('clear'))break;
    if(z.kind==='wait'||z.busy||z.phase==='enter'){await W(150);continue}
    if(z.kind==='cards'){const bb=await p.locator('#bakeryTray .bk-card').nth(guard++%3).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
    if(z.kind==='tap'){await tap(...z.aim);await W(450);continue}
    if(z.kind==='rub'){const pts=z.cellPts.length?z.cellPts:[[z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2]];await touch('touchStart',[pts[0]]);for(let r=0;r<3;r++)for(const q of pts){await touch('touchMove',[q]);await W(14)}await touch('touchEnd',[]);await W(150);continue}
    await W(200)}
  s=await st();const eat=s.log.filter(x=>/^eat:/.test(x));
  ok('손님이 두 손으로 받아 킁킁 → 한 입 크게 → 볼 볼록 (차례대로)',eat.join()==='eat:take,eat:sniff,eat:bite,eat:cheeks,eat:done',eat.join(' → '));
  ok('달걀 깨기 · 치대기가 콕으로 끝까지 (수는 그대로)',s.cnt.add===6&&s.cnt.knead===5,JSON.stringify({add:s.cnt.add,knead:s.cnt.knead}));

  /* ---------- 4. never more than max particles at once: bakery (above), pizza sauce, dishes scrubbing ---------- */
  await p.evaluate(()=>window.ML.go('pizza'));await p.waitForFunction(()=>window.ML.__pz().phase==='lobby',null,{timeout:9000});await W(900);{const a=(await p.evaluate(()=>window.ML.__pz())).aim;await p.mouse.click(a[0],a[1])}
  await p.waitForFunction(()=>{const s=window.ML.__pz();return s.step==='sauce'&&s.kind==='rub'},null,{timeout:12000});await W(2400);
  let z=await p.evaluate(()=>window.ML.__pz());const pr=z.rect;await touch('touchStart',[[pr.x+pr.w/2,pr.y+pr.h/2]]);
  for(let k=0;k<70&&z.step==='sauce';k++){await touch('touchMove',[[pr.x+pr.w*(.5+.32*Math.cos(k*.9)),pr.y+pr.h*(.5+.32*Math.sin(k*1.4))]]);await W(16);if(k%10===0)z=await p.evaluate(()=>window.ML.__pz())}
  await touch('touchEnd',[]);const pzParts=(await p.evaluate(()=>window.ML.__pz())).parts;
  await p.evaluate(()=>{window.ML.__dishLevel(1);window.ML.go('dishes2')});await p.waitForFunction(()=>{const s=window.ML.__dish();return s.step==='scrub'||s.step==='soap'||s.kind==='cards'},null,{timeout:12000});
  const t2=Date.now();while(Date.now()-t2<60000){const d=await p.evaluate(()=>window.ML.__dish());if(d.step==='rinse')break;if(d.kind==='wait'||d.busy){await W(150);continue}
    if(d.kind==='cards'){const bb=await p.locator('#dkTray .dk-card').nth(0).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1200);continue}
    if(d.kind==='tap'){await tap(...d.aim);await W(450);continue}
    if(d.kind==='rub'){await touch('touchStart',[d.cellPts[0]]);for(let r=0;r<3;r++)for(const q of d.cellPts){await touch('touchMove',[q]);await W(10)}await touch('touchEnd',[]);await W(150);continue}await W(150)}
  const dkParts=(await p.evaluate(()=>window.ML.__dish())).parts;
  ok('4. 입자가 한 번에 '+LIM.max+'개를 넘지 않음',maxParts<=LIM.max&&pzParts.max<=LIM.max&&dkParts.max<=LIM.max&&pzParts.spawned>0&&dkParts.spawned>0,`빵집 최대 ${maxParts}개 · 피자 최대 ${pzParts.max}개(만든 ${pzParts.spawned}) · 설거지 최대 ${dkParts.max}개(만든 ${dkParts.spawned})`);
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
