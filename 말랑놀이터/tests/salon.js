/* 동물 미용실 한 손님 끝까지 해 보기: node tests/salon.js
   엉뚱한 곳을 누르면 진행되지 않는지, 문지르기와 콕 누르기만으로 끝까지 되는지 봅니다. */
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
  await p.evaluate(()=>window.ML.go('petsalon'));await W(1500);await shot('1enter');
  await p.waitForFunction(()=>window.ML.__ps().phase==='foam',null,{timeout:10000});await W(500);
  const sb=await p.locator('#psStage').boundingBox(),pet=async()=>p.locator('#psPet').boundingBox();
  // wrong place: top-left corner of the stage
  for(let k=0;k<3;k++){await p.mouse.click(sb.x+10,sb.y+sb.height*.5);await W(300)}
  let s=await st();console.log('엉뚱한 곳 3번 → 단계',s.phase,'막대',JSON.stringify(s.bar),'응원',s.misses);
  const t={};let cur=s.phase,t0=Date.now();
  const tick=async()=>{const x=await st();if(x.phase!==cur){t[cur]=((Date.now()-t0)/1000).toFixed(1);cur=x.phase;t0=Date.now()}return x};
  for(let n=0;n<120;n++){
    const x=await tick();if(x.phase==='done')break;const r=await pet();const cx=r.x+r.width/2,cy=r.y+r.height/2;
    if(x.phase==='foam'){await p.mouse.move(cx,cy);await p.mouse.down();for(let k=0;k<14;k++){await p.mouse.move(cx+Math.cos(k)*r.width*.3,cy+Math.sin(k*1.3)*r.height*.3);await W(45)}if(n===2)await shot('2foam');await p.mouse.up();await W(80)}
    else if(x.phase==='rinse'||x.phase==='dry'){await p.mouse.click(cx,cy);await W(500);if(x.bar==='33.3333%')await shot('3'+x.phase)}
    else if(['head','neck','face'].includes(x.phase)){const c=p.locator('#psPanel .ps-card:not(.dim):not(.picked)');if(await c.count()===3){await W(700);await shot('4'+x.phase);await c.nth(n%3).dispatchEvent('pointerdown')}await W(600)}
    else await W(300);
  }
  t[cur]=((Date.now()-t0)/1000).toFixed(1);s=await st();
  console.log('단계별 걸린 시간(초):',JSON.stringify(t));console.log('입힌 것:',s.wear.join(', '),'· 손님',s.served,'명');
  await W(1500);await shot('5done');await W(3600);await shot('6bell');
  await p.locator('#psPanel .ps-card.one').dispatchEvent('pointerdown');await W(5500);console.log('벨 → 다음 손님 단계:',(await st()).phase);
  console.log('오류:',JSON.stringify(errs));await b.close();process.exit(errs.length?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
