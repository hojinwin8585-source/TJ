/* P11 네일숍 완료 기준 검사: node tests/nailshop.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 가게 앞에서 손님을 고르면 그 손님의 손이 나옴(엄마 손 / 토토 발)
   2) 1단계: 손톱 3개를 색 젤로 칠함(왼쪽 반만 칠하면 오른쪽 칸은 그대로) → 다음 → 램프 → 5초 뒤 윤기 → 파츠 붙이기·끌어서 떼기 → 거울 → 가게 앞, 벽 액자 1개
   3) 단계 4(어른 설정 / 테스트 훅): 갈기 → 베이스 → 색 → 굽기 → 그림 → 도장 → 파츠 → 탑젤 → 굽기 → 오일 순서, 갈기 전후 손톱 끝이 달라짐
   4) 그림 그리기에서 손톱 밖으로 그은 선이 손톱 밖에 남지 않음
   5) 거울 버튼을 누르기 전에는 끝나지 않음 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__ns());
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const waitPhase=(ph,t=15000)=>p.waitForFunction(ph=>window.ML.__ns().phase===ph,ph,{timeout:t});
  const enter=async()=>{await p.evaluate(()=>window.ML.go('home'));await W(300);await p.evaluate(()=>window.ML.go('nailshop'));await waitPhase('lobby',6000);await W(400)};
  /* pick a customer of this kind (re-seat the lobby until one is there) */
  const pickKind=async kind=>{for(let k=0;k<20;k++){await waitPhase('lobby',10000);const s=await st();const i=s.lobby.findIndex(c=>c&&c.kind===kind);
      if(i>=0){await p.locator(`.nl-cust[data-i="${i}"]`).click();await p.waitForFunction(()=>window.ML.__ns().view==='room',null,{timeout:4000});return s.lobby[i]}
      await p.evaluate(l=>window.ML.__nsLevel(l),s.level);await enter()}throw new Error('no '+kind)};
  const nail=async i=>(await st()).nails[i];
  /* rub a nail: zigzag over the whole nail, then hold still until that nail is done */
  const paint=async(i,ph)=>{const r=(await nail(i)).rect;await p.mouse.move(r.left+r.width/2,r.top+r.height/2);await p.mouse.down();
    for(let c=0;c<6;c++){const x=r.left+r.width*(c+.5)/6;await p.mouse.move(x,r.top+r.height*(c%2?.9:.08),{steps:5});await p.mouse.move(x,r.top+r.height*(c%2?.08:.9),{steps:5})}
    const t0=Date.now();while(Date.now()-t0<15000){if((await st()).done.includes(i)||(await st()).phase!==ph)break;await W(200)}await p.mouse.up();await W(250);return(Date.now()-t0)/1000};
  const holdOn=async(i,ph,fy=.5)=>{const r=(await nail(i)).rect;await p.mouse.move(r.left+r.width/2,r.top+r.height*fy);await p.mouse.down();const t0=Date.now();
    while(Date.now()-t0<20000){await W(200);const s=await st();if(s.done.includes(i)||s.phase!==ph)break}await p.mouse.up();await W(250);return(Date.now()-t0)/1000};
  const clickNext=async()=>{await p.waitForFunction(()=>window.ML.__ns().next,null,{timeout:6000});await W(900);await p.locator('#nsNext').click();await W(500)};
  const doCure=async(label)=>{await waitPhase('cure',6000);await W(600);await p.locator('#nsPanel .ns-card').click();await W(2600);const s1=await st();if(label)await shot(label);
    await p.waitForFunction(()=>window.ML.__ns().phase==='cured',null,{timeout:12000});return s1};
  const tapNail=async i=>{const r=(await nail(i)).rect;await p.mouse.click(r.left+r.width/2,r.top+r.height/2);await W(700)};
  const zoomPt=async(fx,fy)=>{const s=await st(),z=s.zoomRect,v=s.zvb,g=s.zg;return[z.x+(fx-v[0])/v[2]*z.w,z.y+(fy-v[1])/v[3]*z.h]};

  /* ---------- 1. pick a customer → her hand ---------- */
  await enter();let s=await st();
  ok('가게 앞: 손님 3명, 말풍선에 원하는 색',(await p.locator('.nl-cust').count())===3&&(await p.locator('.nl-cust .nl-bub svg').count())===3,s.lobby.map(c=>c.kind+'('+c.want+')').join(', '));
  await shot('p11_1lobby');
  await pickKind('mom');await W(3000);s=await st();
  const handMom=await p.locator('#nsHand svg[data-hand="mom"]').count();
  ok('엄마 손님을 고르면 엄마 손이 나옴',s.customer.kind==='mom'&&s.hand==='mom'&&handMom===1&&s.nails.length===5,'손 '+s.hand+', 손톱 '+s.nails.length+'개');
  const ws=s.nails.map(n=>Math.round(n.rect.width));
  ok('손톱 하나 56px 이상',Math.min(...ws)>=56,'손톱 폭 '+ws.join(', ')+'px');
  await p.locator('#nsBack').click();await W(400);
  await pickKind('bunnyPaw');await W(3000);s=await st();
  ok('토토 손님을 고르면 토토 발이 나옴(발톱 4개)',s.customer.kind==='bunnyPaw'&&s.hand==='bunnyPaw'&&s.nails.length===4,'손 '+s.hand+', 발톱 '+s.nails.length+'개 · 폭 '+s.nails.map(n=>Math.round(n.rect.width)).join(', ')+'px');
  await p.locator('#nsBack').click();await W(400);

  /* ---------- 2. level 1: colour, lamp, parts, mirror ---------- */
  await pickKind('mom');await waitPhase('color',8000);s=await st();
  ok('1단계 과정: 색 → 굽기 → 파츠',s.level===1&&s.plan.join()==='color,cure,parts',s.plan.join(' → '));
  ok('색 병 카드 3장',(await p.locator('#nsPanel .ns-card').count())===3);
  await p.locator('#nsPanel .ns-card').nth(0).click();await W(400);
  {const r=(await nail(1)).rect,x=r.left+r.width*.15;await p.mouse.move(x,r.top+r.height*.12);await p.mouse.down();
   for(let k=0;k<3;k++){await p.mouse.move(x,r.top+r.height*.9,{steps:6});await p.mouse.move(x,r.top+r.height*.12,{steps:6})}await p.mouse.up();await W(300)}
  s=await st();{const n=s.nails[1],col=c=>n.cells.map((cr,j)=>cr[0]===c?n.col[j]:undefined).filter(v=>v!==undefined);
    ok('왼쪽 반만 칠하면 왼쪽 칸만 칠해지고 오른쪽 칸은 그대로',col(0).some(Boolean)&&col(5).length>0&&col(5).every(v=>!v)&&col(4).every(v=>!v),'왼쪽 칸 '+col(0).filter(Boolean).length+'/'+col(0).length+' · 오른쪽 칸 '+col(5).filter(Boolean).length+'/'+col(5).length);}
  await shot('p11_3painting_half');
  ok('칠하는 중에는 다음 버튼 없음',!s.next);
  const tHold=await holdOn(1,'color');
  ok('가만히 대고 있어도 손톱 하나가 끝남',(await st()).done.includes(1),tHold.toFixed(1)+'초');
  await paint(2,'color');
  await tapNail(3);const tTap0=Date.now();await p.waitForFunction(()=>window.ML.__ns().done.includes(3),null,{timeout:12000}).catch(()=>{});
  s=await st();ok('손톱을 콕만 해도 붓이 알아서 칠함',s.done.includes(3)&&s.log.includes('autobrush:3'),((Date.now()-tTap0)/1000).toFixed(1)+'초');
  ok('손톱 3개를 칠하면 다음 버튼이 나타남',(await p.waitForFunction(()=>window.ML.__ns().next,null,{timeout:4000}).then(()=>true).catch(()=>false)),'칠한 손톱 '+s.done.length+'개');
  ok('칠해진 손톱은 또렷한 색(vivid)',await p.evaluate(()=>{const v=window.MLCFG.calm.choiceColors.map(c=>c.vivid.toLowerCase());return[...document.querySelectorAll('#nsHand .ns-n[data-i="2"] rect')].some(r=>v.includes((r.getAttribute('fill')||'').toLowerCase()))}));
  await clickNext();
  const sl=await doCure('p11_4lamp');
  ok('램프: 손이 램프 안으로, 연보라빛이 켜지고 점이 하나씩 참',sl.lamp&&sl.dots>=1&&sl.dots<=3,'램프 '+sl.lamp+', 점 '+sl.dots+'/5 (2.6초)');
  s=await st();ok('5초 뒤 띵 → 윤기 상태',s.nails.every(n=>n.cured)&&s.log.includes('ding'));
  await W(400);await shot('p11_5glossy');
  await waitPhase('deco',6000);await W(500);s=await st();
  ok('굽기 뒤 파츠 단계(확대 전 도구 칸)',s.modes.join()==='parts'&&s.zoom===null);
  await tapNail(2);s=await st();
  ok('손톱을 콕 → 그 손톱이 무대를 가득 채움',s.zoom===2&&s.zoomRect.w>200,'확대 폭 '+Math.round(s.zoomRect.w)+'px');
  ok('파츠 카드 3장',(await p.locator('#nsPanel .ns-card').count())===3);
  await p.locator('#nsPanel .ns-card').nth(0).click();await W(800);
  {const c=await p.locator('#nsPanel .ns-card').nth(1).boundingBox(),[x,y]=await zoomPt(...await p.evaluate(()=>{const s=window.ML.__ns();return[s.zvb[0]+s.zvb[2]*.5,s.zvb[1]+s.zvb[3]*.55]}));
   await p.mouse.move(c.x+c.width/2,c.y+c.height/2);await p.mouse.down();await p.mouse.move(x,y,{steps:10});await p.mouse.up();await W(900)}
  s=await st();ok('파츠 붙이기: 카드 콕, 카드를 끌어다 놓기',s.nails[2].parts.length===2,s.nails[2].parts.join(', '));
  await shot('p11_7parts');
  {const [x,y]=s.partPts[0],sb=await p.locator('#nsStage').boundingBox();await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+30,y-20,{steps:4});await p.mouse.move(sb.x+20,sb.y+30,{steps:8});await p.mouse.up();await W(700)}
  s=await st();ok('붙은 파츠를 끌어서 빼면 떨어짐',s.nails[2].parts.length===1&&s.log.some(l=>/^off:/.test(l)),'남은 것 '+s.nails[2].parts.join(', '));
  {const [x,y]=s.partPts[0];await p.mouse.click(x,y);await W(400)}
  s=await st();ok('붙은 파츠를 콕 하면 색이 바뀜',s.log.some(l=>/^recolor:/.test(l)));
  /* 5. never ends by itself */
  const t0=Date.now(),phases=new Set();let mirAt=0;
  while(Date.now()-t0<20000){await W(1000);s=await st();phases.add(s.phase);if(s.mirror&&!mirAt)mirAt=(Date.now()-t0)/1000}
  ok('거울 버튼을 누르기 전에는 끝나지 않음 (20초 기다림)',phases.size===1&&phases.has('deco'),'단계: '+[...phases].join(','));
  ok('거울 버튼이 조용히 나타남 (110px 이상)',s.mirror&&(await p.locator('#nsMir').boundingBox()).width>=110,'~'+mirAt+'초');
  const fr0=s.frames;await p.locator('#nsMir').click();await W(1200);await shot('p11_8mirror');
  await p.waitForFunction(()=>window.ML.__ns().view==='lobby',null,{timeout:8000});await waitPhase('lobby',8000);await W(300);s=await st();
  ok('거울 → 가게 앞, 벽 액자 1개',s.view==='lobby'&&s.frames===fr0+1&&s.wall===1,'액자 '+fr0+' → '+s.frames);
  await shot('p11_9lobby_back');

  /* ---------- 3. level 4 ---------- */
  const row=await p.locator('#setNailLv button').count();
  ok('어른 설정에 네일숍 단계 1~5',row===5);
  await p.evaluate(()=>window.ML.__nsLevel(4));await enter();
  await pickKind('mom');await waitPhase('file',8000);await W(400);s=await st();
  ok('4단계 과정표',s.level===4&&s.plan.join()==='file,base,color,cure,art+stamp+parts,top,cure,oil',s.plan.join(' → '));
  const j0=s.nails[2].jags;await shot('p11_2filing_before');
  await paint(2,'file');s=await st();
  ok('갈기 전후 손톱 끝이 달라짐 (울퉁불퉁 → 매끈)',j0===6&&s.nails[2].jags===0&&s.nails[2].filed.every(v=>v>=1),'울퉁불퉁 조각 '+j0+' → '+s.nails[2].jags);
  await W(300);await shot('p11_2filing_after');
  await paint(1,'file');await paint(3,'file');await clickNext();
  await waitPhase('base',4000);for(const i of [1,2,3])await paint(i,'base');s=await st();
  ok('베이스: 칠한 곳이 촉촉해짐',s.nails[2].base>0,'칸 '+s.nails[2].base);await clickNext();
  await waitPhase('color',4000);await p.locator('#nsPanel .ns-card').nth(1).click();await W(300);for(const i of [1,2,3])await paint(i,'color');await clickNext();
  await doCure();await waitPhase('deco',6000);await W(400);
  s=await st();ok('굽기 뒤 붓·도장·보석 버튼 3개',(await p.locator('#nsPanel .ns-card').count())===3&&s.modes.join()==='art,stamp,parts');
  /* 4. draw a line from inside the nail to outside */
  await tapNail(2);s=await st();
  const g=await p.evaluate(()=>{const s=window.ML.__ns();return s.zvb});
  const n2=await p.evaluate(()=>{const H=window.ART.HAND,g=H.geo('mom',2);return{w:g.w,h:g.h}});
  const [ax,ay]=await zoomPt(n2.w*.4,n2.h*.5),[bx,by]=await zoomPt(n2.w+6,n2.h*.5),[ox,oy]=await zoomPt(n2.w+5,n2.h*.5);
  const box={x:ox-6,y:oy-6,width:12,height:12};
  const before=await p.screenshot({clip:box});
  await p.mouse.move(ax,ay);await p.mouse.down();await p.mouse.move(bx,by,{steps:8});await p.mouse.move(bx,by+30,{steps:4});await p.mouse.up();await W(250);
  const after=await p.screenshot({clip:box});s=await st();
  const inside=await p.evaluate(()=>{const g=document.querySelector('#nsZoom svg g[clip-path]');return !!g&&!!g.querySelector('path[stroke-width]')});
  ok('그림: 손톱 밖으로 그은 선이 손톱 밖에 남지 않음',s.nails[2].strokes.length===1&&Buffer.compare(before,after)===0&&inside,'선 점 '+s.nails[2].strokes[0]+'개, 손톱 밖 화면 '+(Buffer.compare(before,after)===0?'그대로':'바뀜'));
  {const [x1,y1]=await zoomPt(n2.w*.3,n2.h*.25),[x2,y2]=await zoomPt(n2.w*.7,n2.h*.75);await p.mouse.move(x1,y1);await p.mouse.down();await p.mouse.move(x2,y2,{steps:8});await p.mouse.up();await W(300)}
  await shot('p11_6zoom_drawing');
  await p.locator('#nsHandBack').click();await W(500);
  await p.locator('#nsPanel .ns-card[data-m="stamp"]').click();await W(400);await tapNail(1);
  {const [x,y]=await zoomPt(n2.w*.5,n2.h*.5);await p.mouse.click(x,y);await W(400)}
  s=await st();ok('도장: 확대한 손톱을 콕 하면 그 자리에 쿡',s.nails[1].art>=1&&s.log.some(l=>/^stamp:/.test(l)));
  await p.locator('#nsHandBack').click();await W(500);
  await p.locator('#nsPanel .ns-card[data-m="parts"]').click();await W(400);await tapNail(3);
  await p.locator('#nsPanel .ns-card').nth(0).click();await W(900);s=await st();
  ok('파츠: 붙음',s.nails[3].parts.length===1);
  await p.locator('#nsHandBack').click();await W(400);
  await clickNext();await waitPhase('top',4000);for(const i of [1,2,3])await paint(i,'top');await clickNext();
  await doCure();s=await st();ok('탑젤 뒤 다시 굽기 → 아주 반짝',s.nails[2].topCured);
  await waitPhase('oil',6000);for(const i of [1,2,3])await paint(i,'oil');s=await st();
  ok('오일: 스포이트로 톡 → 문지르면 촉촉',s.nails[2].drop&&s.nails[2].oil>0);
  await clickNext();await waitPhase('finish',4000);s=await st();
  const want='file,base,color,cure,art,stamp,parts,top,cure,oil';
  ok('4단계 순서: 갈기 → 베이스 → 색 → 굽기 → 그림 → 도장 → 파츠 → 탑젤 → 굽기 → 오일',s.stepLog.slice(-10).join()===want,s.stepLog.slice(-10).join(' → '));
  const t1=Date.now();const ph2=new Set();while(Date.now()-t1<12000){await W(1000);s=await st();ph2.add(s.phase)}
  ok('마지막 과정 뒤에도 거울을 누르기 전에는 끝나지 않음',ph2.size===1&&ph2.has('finish')&&s.mirror,'단계 '+[...ph2].join(',')+', 거울 '+s.mirror);
  await p.locator('#nsMir').click();await p.waitForFunction(()=>window.ML.__ns().view==='lobby',null,{timeout:8000});await waitPhase('lobby',8000);s=await st();
  ok('두 번째 손님 뒤 액자 2개',s.frames===2);
  ok('오류 없음',errs.length===0,JSON.stringify(errs.slice(0,5)));
  console.log(fails?'\n실패 '+fails+'개':'\nP11 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
