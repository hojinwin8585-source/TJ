/* 동물 미용실 한 손님 끝까지 해 보기: node tests/salon.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   가게 앞에서 진흙 손님을 골라 들어가서, 엉뚱한 곳을 누르면 진행되지 않는지,
   쓱쓱(손가락을 따라오는 도구)과 콕(머리·목·얼굴 → 카드)만으로 꾸미기까지 되고, 거울을 눌러 가게 앞으로 돌아오는지 봅니다. */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ps());
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,'salon_'+n+'.png')})};
  await p.evaluate(()=>window.ML.go('petsalon'));await p.waitForFunction(()=>window.ML.__ps().phase==='lobby',null,{timeout:6000});await W(600);await shot('0lobby');
  let s=await st();console.log('가게 앞 손님:',s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  const i=s.lobby.findIndex(c=>c.need==='muddy');await p.locator(`.lb-cust[data-i="${i}"]`).click();await W(1500);await shot('1enter');
  await p.waitForFunction(()=>window.ML.__ps().phase==='foam',null,{timeout:10000});await W(500);
  const sb=await p.locator('#psStage').boundingBox(),pet=async()=>p.locator('#psPet').boundingBox();
  // wrong place: left edge of the stage
  for(let k=0;k<3;k++){await p.mouse.click(sb.x+10,sb.y+sb.height*.5);await W(300)}
  s=await st();console.log('엉뚱한 곳 3번 → 단계',s.phase,'막대',JSON.stringify(s.bar),'응원',s.misses);
  const wrongOk=s.phase==='foam'&&(s.bar===''||s.bar==='0%')&&s.misses===3;
  const t={};let cur=s.phase,t0=Date.now();
  const tick=async()=>{const x=await st();if(x.phase!==cur){t[cur]=((Date.now()-t0)/1000).toFixed(1);cur=x.phase;t0=Date.now()}return x};
  const done={};
  for(let n=0;n<200;n++){
    const x=await tick();if(x.view==='lobby'&&done.mirror)break;
    if(['foam','rinse','dry'].includes(x.phase)){const r=await pet(),cx=r.x+r.width/2,cy=r.y+r.height*.45;await p.mouse.move(cx,cy);await p.mouse.down();
      for(let k=0;k<14;k++){await p.mouse.move(cx+Math.cos(k)*r.width*.3,cy+Math.sin(k*1.3)*r.height*.3);await W(45)}
      if(!done[x.phase]){done[x.phase]=1;await shot('2'+x.phase)}await p.mouse.up();await W(80)}
    else if(x.phase==='dress'){
      for(const slot of ['head','neck','face']){if((await st()).worn[slot])continue;const [px,py]=(await st()).slotPts[slot];await p.mouse.click(px,py);await W(500);
        const c=p.locator('#psPanel .ps-card'),nc=await c.count();if(nc>=2&&nc<=3){await shot('3'+slot);await c.nth(n%nc).click();await W(900)}}   // 2-나: 1단계는 카드 2장, 2단계부터 3장
      if(!(await st()).mirror){await W(1000);continue}
      await shot('4dressed');await p.locator('#psMirBtn').click();done.mirror=1;await W(2000);await shot('5mirror');await W(1500)}
    else await W(300);
  }
  t[cur]=((Date.now()-t0)/1000).toFixed(1);s=await st();
  console.log('단계별 걸린 시간(초):',JSON.stringify(t));console.log('꾸민 손님:',s.served,'명 · 벽 액자',s.frames,'개 · 지금',s.view,s.phase);
  await W(3500);await shot('6lobby');s=await st();
  console.log('다음 손님까지 온 가게 앞:',s.lobby.map(c=>c.kind+'('+c.need+')').join(', '));
  const pass=wrongOk&&s.served===1&&s.frames===1&&s.view==='lobby'&&errs.length===0;
  console.log('오류:',JSON.stringify(errs));console.log(pass?'통과':'실패');await b.close();process.exit(pass?0:1);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
