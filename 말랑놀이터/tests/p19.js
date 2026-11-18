/* P19 완료 기준 검사: node tests/p19.js   (SHOT_DIR=폴더 를 주면 휘핑 네 모습과 캐릭터 캡처를 저장)
   19-가 입체감(art.volume)
   1) 네 동물 · 아이 인형(옷 가게 · 직업) · 화장 얼굴 SVG에 그라데이션과 접지 그림자(두 겹)가 있음
   2) 캐릭터 하나의 그라데이션 6개 이하 (동물 일곱 종류 × 표정 · 미용실 모습, 인형, 화장 얼굴, 네일숍 손님)
   3) 다른 화면의 겉모양(요소 위치 · 크기)이 P19 전(기준 커밋)과 같음: 화면의 모든 상자 + 캐릭터 부분(al-*)의 그림 좌표
   19-나 케이크 크림 휘핑(games.bakery.whip)
   4) 케이크 3단계에서 휘핑 4단계 모습(묽음 → 방울 → 몽글 → 뿔)이 차례로 나오고, 콕만으로 끝남 → 짤주머니 → 크림 바르기로 이어짐
   5) 4단계: 크림 색 고르기가 들어가고, 고른 색이 케이크 크림과 짤주머니 꽃에 쓰임
   모든 손동작은 휴대폰 화면(isMobile) + CDP Input.dispatchTouchEvent 로 보낸 진짜 터치입니다. (기존 검사와 monkey 는 따로 돌립니다) */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs'),os=require('os'),{execSync}=require('child_process');
const APP=path.resolve(__dirname,'..'),URL='file://'+path.join(APP,'index.html');
const SHOT=process.env.SHOT_DIR||'';
const BASE_COMMIT=process.env.P19_BASE||'710d175';   // P16 검증 커밋 (P19 전)
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
const SEED=()=>{let x=12345;Math.random=()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648}};

/* the same screens, measured the same way, in any copy of the app */
async function measure(b,url){
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,reducedMotion:'reduce'});await ctx.addInitScript(SEED);const p=await ctx.newPage();
  await p.goto(url);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const games=['home','pizza','petsalon','nailshop','bakery','restaurant','icecream2','clothes','makeup2','jobs','dishes2','chores2','routine2','maze','animals','friends','map'];const out={};
  for(const g of games){
    await p.evaluate(g=>window.ML.go(g),g);await p.waitForTimeout(1800);
    out[g]=await p.evaluate(()=>{
      const scr=[...document.querySelectorAll('.screen')].find(s=>!s.hidden);if(!scr)return{boxes:[],parts:[]};
      document.querySelectorAll('*').forEach(e=>{if(e.getAnimations)e.getAnimations().forEach(a=>{try{a.pause();a.currentTime=0}catch(_){}})});
      const r=e=>{const q=e.getBoundingClientRect();return[Math.round(q.left),Math.round(q.top),Math.round(q.width),Math.round(q.height)]};
      const boxes=[...scr.querySelectorAll('*')].filter(e=>!(e.closest('svg')&&e.tagName.toLowerCase()!=='svg')&&!e.classList.contains('tl-tool')&&!/pfx|bk-fx|bk-float/.test(e.className&&e.className.baseVal==null?e.className:'')).map(e=>(e.id||e.className&&(e.className.baseVal==null?e.className:e.className.baseVal)||e.tagName)+':'+r(e).join(','));
      /* character parts in picture units (not moved by animation): head, ears, arms, feet, eyes … */
      /* only the drawn shapes count: the added light and shadow (vol-*) are taken out before measuring */
      scr.querySelectorAll('[class^="vol-"],[class*=" vol-"]').forEach(e=>e.remove());
      const parts=[];scr.querySelectorAll('svg').forEach((sv,i)=>{sv.querySelectorAll('[class^="al-"],[class*=" al-"]').forEach(e=>{try{const bb=e.getBBox();parts.push(i+':'+(e.getAttribute('class')||'').split(' ')[0]+':'+[bb.x,bb.y,bb.width,bb.height].map(v=>Math.round(v)).join(','))}catch(_){}})});
      return{boxes,parts}});
  }
  await ctx.close();return out;
}
function cmpList(a,b){let diff=[];const n=Math.max(a.length,b.length);for(let i=0;i<n;i++){if(a[i]!==b[i])diff.push((a[i]||'-')+' ≠ '+(b[i]||'-'))}return diff}

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:SHOT?2:1});const p=await ctx.newPage();
  const cdp=await ctx.newCDPSession(p);
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms);
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(50);await touch('touchEnd',[])};
  let moves=0;const rub=async pts=>{if(!pts.length)return;await touch('touchStart',[pts[0]]);for(let r=0;r<2;r++)for(const q of pts){await touch('touchMove',[q]);moves++;await W(14)}await touch('touchEnd',[])};

  /* ---------- 1 · 2. gradients, ground shadow, at most 6 gradients per character ---------- */
  const look=await p.evaluate(()=>{
    const A=window.ART,box=document.createElement('div');box.style.cssText='position:absolute;left:-9999px;top:0;width:200px';document.body.appendChild(box);
    const info=sv=>{const refs=new Set((sv.outerHTML.match(/url\(#([^)]+)\)/g)||[]).map(u=>u.slice(5,-1)));const grads=[...refs].filter(id=>{const g=document.getElementById(id);return g&&/Gradient$/.test(g.tagName)});
      const gr=sv.querySelector('.vol-ground');return{grads:grads.length,ground:!!gr&&gr.querySelectorAll('ellipse').length===2}};
    const put=h=>{box.innerHTML=h;return box.querySelector('svg')};
    const four=['bunny','bear','cat','dog'].map(k=>Object.assign({k},info(put(A.animal(k,'idle',{})))));
    let max=0,worst='',n=0;const all=(name,h)=>{const r=info(put(h));n++;if(r.grads>max){max=r.grads;worst=name}};
    Object.keys(A.KINDS).forEach(k=>['idle','happy','yum','wow','sleepy','think'].forEach(m=>all(k+'/'+m,A.animal(k,m,{}))));
    Object.keys(A.KINDS).forEach(k=>['muddy','foamy','rinse1','wet','dry1','fluffy'].forEach(st=>all(k+'/'+st,A.animal(k,'idle',{state:st,grid:[6,6]}))));
    ['bunny','bear','cat','dog'].forEach(k=>{all(k+'/bow',A.animal(k,'happy',{bow:'#FF6F91'}));all(k+'/chef',A.animal(k,'idle',{chef:true,apron:'#E3A79A'}))});
    ['mom','baby','family','bunnyPaw'].forEach(k=>all('nail/'+k,A.HAND.portrait(k,'idle')));
    all('face',A.face({lip:'#FF5A7A',blushL:true,blushR:true,lidL:'#B57CFF',lidR:'#B57CFF',acc:'crown'}));
    box.remove();return{four,max,worst,n}});
  look.four.forEach(r=>ok(`1. ${r.k}: 그라데이션 + 접지 그림자 두 겹`,r.grads>0&&r.ground,`그라데이션 ${r.grads}개 · 접지 그림자 ${r.ground?'두 겹':'없음'}`));
  /* the dolls (clothes shop, jobs) and the makeup faces, as drawn in their screens */
  const scr=async(g,sel,ms=2200)=>{await p.evaluate(g=>window.ML.go(g),g);await W(ms);return p.evaluate(sel=>{
    return[...document.querySelectorAll(sel)].filter(sv=>sv.getBoundingClientRect().width>0).map(sv=>{const refs=new Set((sv.outerHTML.match(/url\(#([^)]+)\)/g)||[]).map(u=>u.slice(5,-1)));
      const grads=[...refs].filter(id=>{const g=document.getElementById(id);return g&&/Gradient$/.test(g.tagName)});const gr=sv.querySelector('.vol-ground');return{grads:grads.length,ground:!!gr&&gr.querySelectorAll('ellipse').length===2}})},sel)};
  const dolls=await scr('clothes','#clothes .cl-mate .cl-mini>svg');
  ok('1. 아이 인형(옷 가게): 그라데이션 + 접지 그림자 두 겹',dolls.length>=3&&dolls.every(d=>d.grads>0&&d.ground),dolls.map(d=>`그라데이션 ${d.grads} · 그림자 ${d.ground?'두 겹':'없음'}`).join(' / '));
  await p.evaluate(()=>window.ML.go('jobs'));await W(2400);
  const jb=await p.evaluate(()=>[...document.querySelectorAll('#jobs svg')].filter(sv=>sv.querySelector(':scope .jb-head')&&sv.getBoundingClientRect().width>0).map(sv=>{const refs=new Set((sv.outerHTML.match(/url\(#([^)]+)\)/g)||[]).map(u=>u.slice(5,-1)));
    return{grads:[...refs].filter(id=>{const g=document.getElementById(id);return g&&/Gradient$/.test(g.tagName)}).length,ground:!!sv.querySelector('.vol-ground')&&sv.querySelectorAll('.vol-ground ellipse').length===2}}));
  ok('1. 아이 인형(직업): 그라데이션 + 접지 그림자 두 겹',jb.length>=1&&jb.every(d=>d.grads>0&&d.ground),jb.map(d=>`그라데이션 ${d.grads} · 그림자 ${d.ground?'두 겹':'없음'}`).join(' / '));
  const faces=await scr('makeup2','#makeup2 svg[data-px]');
  ok('1. 화장 얼굴: 그라데이션 + 접지 그림자 두 겹 (턱 아래)',faces.length>=3&&faces.every(d=>d.grads>0&&d.ground),faces.map(d=>`그라데이션 ${d.grads} · 그림자 ${d.ground?'두 겹':'없음'}`).join(' / '));
  const scrMax=Math.max(...dolls.concat(jb,faces).map(d=>d.grads));
  ok('2. 캐릭터 하나의 그라데이션 6개 이하',look.max<=6&&scrMax<=6,`그림 ${look.n}개 중 최대 ${look.max}개(${look.worst}) · 인형/얼굴 최대 ${scrMax}개`);
  const defs=await p.evaluate(()=>{const d=document.getElementById('volDefs');return{n:d?d.querySelectorAll('radialGradient,linearGradient').length:0,blur:d?d.querySelectorAll('filter').length:0}});
  ok('2. 정의는 한 번만(색마다 하나, 화면 전체가 같이 씀) · 흐림 필터 없음',defs.n>0&&defs.n<60&&defs.blur===0,`공용 그라데이션 ${defs.n}개 · 흐림 필터 ${defs.blur}개`);

  /* ---------- 3. other screens: the same boxes and character parts as before P19 ---------- */
  let baseDir='';try{baseDir=fs.mkdtempSync(path.join(os.tmpdir(),'p19base-'));const root=execSync('git rev-parse --show-toplevel',{cwd:APP}).toString().trim(),rel=path.relative(root,APP);
    execSync(`git archive ${BASE_COMMIT} "${rel}" | tar -x -C "${baseDir}"`,{cwd:root,shell:'/bin/bash'});baseDir=path.join(baseDir,rel)}catch(e){baseDir=''}
  if(baseDir&&fs.existsSync(path.join(baseDir,'index.html'))){
    const A0=await measure(b,'file://'+path.join(baseDir,'index.html')),A1=await measure(b,URL);
    const rows=Object.keys(A0).map(g=>{const d1=cmpList(A0[g].boxes,A1[g].boxes),d2=cmpList(A0[g].parts,A1[g].parts);return{g,nb:A1[g].boxes.length,np:A1[g].parts.length,d:d1.concat(d2)}});
    const bad=rows.filter(r=>r.d.length);
    ok('3. 다른 화면의 겉모양(요소 위치·크기, 캐릭터 부분 좌표) 변화 없음 (P19 전과 비교)',!bad.length,rows.map(r=>`${r.g} 상자 ${r.nb}·부분 ${r.np}${r.d.length?' 다름 '+r.d.length+' 예: '+r.d[0]:''}`).join(' / '));
  }else ok('3. 다른 화면의 겉모양 변화 없음',false,'기준 커밋 '+BASE_COMMIT+'을 꺼내지 못함 (P19_BASE=커밋 으로 지정)');

  /* ---------- 4. cake level 3: whipping, four looks in order, taps only ---------- */
  const st=()=>p.evaluate(()=>window.ML.__bake());
  const shot=async n=>{if(SHOT){const r=await p.locator('#bakeryStage').boundingBox();await p.screenshot({path:path.join(SHOT,n+'.png'),clip:{x:r.x,y:r.y,width:r.width,height:r.height}})}};
  const waitStep=async(step,ms=20000)=>p.waitForFunction(k=>{const s=window.ML.__bake();return s.step===k&&s.kind!=='wait'&&!s.busy},step,{timeout:ms});
  const startCake=async lv=>{await p.evaluate(()=>window.ML.go('bakery'));await W(300);await p.evaluate(n=>window.ML.__bakeLevel(n),lv);await p.waitForFunction(()=>window.ML.__bake().phase==='lobby',null,{timeout:9000});await W(700);
    const s=await st();const i=s.orders.indexOf('cake');await tap(...s.custPts[Math.max(0,i)]);return s.orders};
  const orders3=await startCake(3);
  await waitStep('cin');let s=await st();
  ok('4. 3단계 케이크 과정 맨 앞에 휘핑: 생크림 붓기 → 젓기 → 짤주머니 → 크림 바르기',s.plan.slice(0,4).join()==='cin,whip,fill,cream',s.plan.join(' → ')+` (주문 ${orders3.join('+')})`);
  await W(2400);
  while((await st()).step==='cin'){const z=await st();if(z.kind==='tap'&&!z.busy)await tap(...z.aim);await W(500)}
  s=await st();ok('4. 생크림 콕 2번 + 설탕 콕 1번',s.whip.cream===2&&s.whip.sugar===1,`생크림 ${s.whip.cream} · 설탕 ${s.whip.sugar} · ${s.log.filter(x=>/^cin:/.test(x)).join(',')}`);
  await waitStep('whip');await W(2400);await shot('p19_whip_look0');
  const bowl=await p.evaluate(()=>{const e=document.querySelector('#bkWork [data-n="bowl"]').getBoundingClientRect();return[e.left+e.width/2,e.top+e.height*.42,e.width*.27]});
  const m0=moves;let taps=0;const seen=[0];
  for(;taps<80&&(await st()).step==='whip';taps++){await tap(bowl[0]+bowl[2]*.5*Math.cos(taps*1.3),bowl[1]+bowl[2]*.3*Math.sin(taps*1.3));await W(520);
    const z=await st();if(z.whip&&z.whip.look!==seen[seen.length-1]){seen.push(z.whip.look);if(z.whip.look<3)await shot('p19_whip_look'+z.whip.look)}}
  await W(1000);await shot('p19_whip_look3');await W(500);s=await st();
  const looks=s.whip.looks;
  ok('4. 휘핑 4단계 모습이 차례로: 묽음(0) → 방울(1) → 몽글(2) → 뿔(3)',looks.join()==='0,1,2,3',`모습 ${looks.join(' → ')} · 기록 ${s.log.filter(x=>/^look:/.test(x)).join(',')}`);
  ok('4. 콕만으로 휘핑이 끝남 (끌기 없이)',s.step!=='whip'&&moves===m0&&s.log.filter(x=>x==='tap:whip').length>=1,`콕 ${taps}번 · 끌기 ${moves-m0}번 · 지금 과정 ${s.step}`);
  await waitStep('fill');await W(1800);s=await st();await tap(...s.aim);await W(1800);
  await waitStep('cream');s=await st();ok('4. 짤주머니에 담기(콕) → 크림 바르기로 이어짐',s.whip.bag===1&&s.log.includes('fill')&&s.step==='cream',`짤주머니 ${s.whip.bag} · 다음 과정 ${s.step}`);
  await shot('p19_whip_then_cream');
  /* finish the round (any step, taps and rubs like the other tests) */
  const drive=async(until,ms=240000)=>{const t1=Date.now();let guard=0;while(Date.now()-t1<ms){const z=await st();if(until(z))return z;
    if(z.kind==='wait'||z.busy||z.phase==='enter'){await W(150);continue}
    if(z.kind==='cards'){const bb=await p.locator('#bakeryTray .bk-card').nth(guard++%3).boundingBox();await tap(bb.x+bb.width/2,bb.y+bb.height/2);await W(1300);continue}
    if(z.kind==='tap'){await tap(...z.aim);await W(450);continue}
    if(z.kind==='rub'){await rub(z.cellPts.length?z.cellPts:[[z.rect.x+z.rect.w/2,z.rect.y+z.rect.h/2]]);await W(150);continue}
    await W(200)}return st()};
  s=await drive(z=>z.log.includes('clear'));
  ok('4. 3단계 케이크 한 판이 끝까지 감',s.log.includes('clear'),s.plan.join(' → '));
  await W(3500);

  /* ---------- 5. level 4: cream colour ---------- */
  await startCake(4);await waitStep('cin');s=await st();
  ok('5. 4단계: 뿔이 선 뒤 크림 색 고르기',s.plan.slice(0,5).join()==='cin,whip,tint,fill,cream',s.plan.join(' → '));
  s=await drive(z=>z.step==='cream'&&z.kind==='rub');await shot('p19_tinted_cream');
  const tint=s.whip.tint,col=s.whip.col;
  s=await drive(z=>z.step==='pipe'&&z.kind==='tap');
  s=await drive(z=>z.step==='candle');
  const used=await p.evaluate(c=>{const sv=document.querySelector('#bkWork [data-n="cake"] svg');return sv?{cream:sv.innerHTML.toLowerCase().split(c.toLowerCase()).length-1}:{cream:0}},col||'#none');
  ok('5. 고른 색(딸기·초코·바닐라)이 케이크 크림과 크림 꽃에 쓰임',!!tint&&!!col&&used.cream>=10,`고른 크림 ${tint} ${col} · 케이크 그림에서 그 색 ${used.cream}곳`);
  s=await drive(z=>z.log.includes('clear'));
  ok('5. 4단계 케이크 한 판이 끝까지 감',s.log.includes('clear'));

  if(SHOT){await p.evaluate(()=>window.ML.go('home'));}
  ok('페이지 오류 없음',errs.length===0,JSON.stringify(errs.slice(0,3)));
  await b.close();console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
