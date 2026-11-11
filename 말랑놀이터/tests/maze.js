/* P14 길 찾기 미로 완료 기준 검사: node tests/maze.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 발자국만 콕(진짜 터치 이벤트) 해서 1~3단계 완주 (4, 5단계도 완주해 봄)
   2) 2단계에서 틀린 길로 가면 이유가 보이고(고양이), 토토가 스스로 돌아오고, 진행이 막히지 않음
   3) 화면을 밀지 않아도 미로가 다 보임 · 길 폭 화면 폭의 18% 이상 · 길끼리 겹치지 않음 · 누르는 자리 110px 이상
   4) 손가락으로 길을 따라가도 걸어감(trace) · 3단계 당근 3개 · 4단계 그림 표지(듣고 고르기) · 5단계 열쇠와 문
   5) 도착하면 폴짝과 인사(ML.Alive) · 글자·이모지 없음 · 버튼마다 그림 · 반복 움직임은 주기 0.6초 이상 · 화면을 떠나면 멈춤 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:SHOT?2:1});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms),mz=()=>p.evaluate(()=>window.ML.__mz());
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const cdp=await ctx.newCDPSession(p);
  const touchTap=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await W(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  const feet=()=>p.evaluate(()=>[...document.querySelectorAll('#mzFeet .mz-foot')].map(b=>{const r=b.getBoundingClientRect();return{edge:b.dataset.edge,node:b.dataset.node,x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,tried:b.classList.contains('tried'),svgW:(b.querySelector('svg')||{getBoundingClientRect:()=>({width:0})}).getBoundingClientRect().width}}));
  const enter=async lv=>{await p.evaluate(l=>{window.ML.go('home');window.ML.__mzLevel(l);window.ML.go('maze')},lv);await p.waitForFunction(()=>{const s=window.ML.__mz();return s.phase==='idle'&&!s.busy&&s.options.length>0},null,{timeout:8000});await W(200)};
  const settled=()=>p.waitForFunction(()=>{const s=window.ML.__mz();return s.phase==='done'||(s.phase==='idle'&&!s.busy&&s.options.length>0)},null,{timeout:25000});
  const tapOpt=async o=>{const s0=await mz();const n0=s0.log.length,c0=(await p.evaluate(()=>window.ML.__mz().log.length));
    const fs=await feet(),f=fs.find(x=>x.edge===o.edge);await touchTap(f.x,f.y);
    await p.waitForFunction(n=>{const l=window.ML.__mz().log;return l.length>n||l.some(x=>x==='win')},c0,{timeout:4000}).catch(()=>{});await W(150);await settled()};
  /* walk to the goal with footprint taps only. choose(opts,state) → option; returns the list of what happened */
  const run=async(choose,max=14)=>{const seen={moves:0,forks:0,wrong:0};
    for(let k=0;k<max;k++){await settled();const s=await mz();if(s.phase==='done')break;
      if(s.options.length>=2)seen.forks++;const o=choose(s.options,s,seen);if(o.wrong)seen.wrong++;seen.moves++;await tapOpt(o)}
    return seen};
  const best=os=>os.find(o=>o.best)||os[0];

  /* ---------- 3) 한 화면, 길 폭, 겹침, 누르는 자리: 다섯 단계 모두 ---------- */
  const cfgRatio=await p.evaluate(()=>{const m=String((window.MLCFG.games.maze||{}).view||'').match(/(\d+)\s*%/);return m?+m[1]/100:.18});
  for(let lv=1;lv<=5;lv++){
    await enter(lv);const s=await mz();const f=await feet();
    const pageScroll=await p.evaluate(()=>({sw:document.scrollingElement.scrollWidth,sh:document.scrollingElement.scrollHeight,iw:innerWidth,ih:innerHeight,st:document.getElementById('mzStage').scrollHeight,sc:document.getElementById('mzStage').clientHeight,sx:document.getElementById('mzStage').scrollWidth,cx:document.getElementById('mzStage').clientWidth}));
    ok(`${lv}단계: 화면을 밀지 않아도 됨 (페이지·무대 모두 넘치지 않음)`,pageScroll.sw<=pageScroll.iw&&pageScroll.sh<=pageScroll.ih+1&&pageScroll.st<=pageScroll.sc+1&&pageScroll.sx<=pageScroll.cx+1,JSON.stringify(pageScroll));
    const half=s.lane/2;const pts=s.edges.flatMap(e=>e.pts);
    const inside=pts.every(([x,y])=>x-half>=-1&&x+half<=s.W+1&&y-half>=-1&&y+half<=s.H+1);
    ok(`${lv}단계: 미로 전체(모든 길)가 무대 안에 있음`,inside,`무대 ${Math.round(s.W)}x${Math.round(s.H)}, 길 폭 ${s.lane}`);
    const stageR=s.stage,tt=s.toto;
    ok(`${lv}단계: 토토와 누르는 발자국이 무대 안`,tt.left>=stageR.left-1&&tt.left+tt.width<=stageR.left+stageR.width+1&&f.every(x=>x.x-x.w/2>=stageR.left-1&&x.x+x.w/2<=stageR.left+stageR.width+1&&x.y-x.h/2>=stageR.top-1&&x.y+x.h/2<=stageR.top+stageR.height+1));
    ok(`${lv}단계: 길 폭이 화면 폭의 ${Math.round(cfgRatio*100)}% 이상`,s.laneRatio>=cfgRatio,`길 폭 ${s.lane}px = 화면 폭의 ${(s.laneRatio*100).toFixed(1)}%`);
    ok(`${lv}단계: 발자국 누르는 자리 110px 이상, 그림이 자리의 50% 이상`,f.length>0&&f.every(x=>x.w>=110&&x.h>=110&&x.svgW>=x.w*.5),f.map(x=>Math.round(x.w)+'px').join(','));
    /* lanes never touch each other: sample the centre lines */
    const apart=await p.evaluate(()=>{const s=window.ML.__mz(),lane=s.lane;const sam=e=>{const o=[];for(let i=1;i<e.pts.length;i++){const a=e.pts[i-1],b=e.pts[i],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let k=0;k<=n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}return o};
      const nd=Object.fromEntries(s.nodes.map(n=>[n.id,n]));let min=1e9;
      for(let i=0;i<s.edges.length;i++)for(let j=i+1;j<s.edges.length;j++){const e=s.edges[i],f=s.edges[j];const shared=[e.a,e.b].filter(x=>x===f.a||x===f.b);
        const P=sam(e),Q=sam(f);P.forEach(p=>Q.forEach(q=>{const d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(shared.some(id=>Math.hypot(p[0]-nd[id].x,p[1]-nd[id].y)<lane*1.6&&Math.hypot(q[0]-nd[id].x,q[1]-nd[id].y)<lane*1.6))return;if(d<min)min=d}))}
      return Math.round(min)});
    ok(`${lv}단계: 서로 다른 길은 겹치거나 맞닿지 않음 (가장 가까운 두 길 사이 ${apart}px)`,apart>=s.lane+20);
    if(lv<=4)await shot('maze_level'+lv);
    if(lv===5)await shot('maze_level5');
  }

  /* ---------- 1) 발자국만 콕 해서 1~3단계 완주 (진짜 터치) ---------- */
  const alog0=()=>p.evaluate(()=>window.ML.Alive.log.length);
  for(const lv of [1,2,3,4,5]){
    await enter(lv);const a0=await alog0();const t0=Date.now();
    let seen;
    if(lv===1||lv===3)seen=await run(best);
    else if(lv===2)seen=await run(best);
    else seen=await run(best);
    await W(300);const s=await mz();
    const want={1:{moves:4,forks:0},2:{forks:1},3:{forks:2},4:{forks:2},5:{forks:3}}[lv];
    ok(`${lv}단계: 발자국만 콕 해서 완주 (${seen.moves}번 콕, ${((Date.now()-t0)/1000).toFixed(1)}초)`,s.phase==='done'&&s.won&&s.log.includes('win'),`phase=${s.phase}`);
    if(lv===1)ok('1단계: 갈림길 없이 발자국 4개',seen.forks===0&&seen.moves===4,`콕 ${seen.moves}번, 갈림길 ${seen.forks}`);
    else ok(`${lv}단계: 갈림길 ${want.forks}개를 지남`,lv===5?seen.forks>=3:seen.forks===want.forks,`갈림길 ${seen.forks}`);
    if(lv===3)ok('3단계: 당근 3개를 주움',s.carrots===3,'당근 '+s.carrots);
    if(lv===5)ok('5단계: 열쇠를 주워서 문이 열렸음',s.hasKey&&s.log.includes('door:open')&&s.log.includes('key'));
    /* arrival: hop + greeting by ML.Alive */
    const al=await p.evaluate(a=>window.ML.Alive.log.slice(a).map(x=>x.name),a0);
    ok(`${lv}단계: 도착하면 폴짝과 인사(Alive hop, 친구는 손 흔들기)`,al.includes('hop')&&(lv===1||lv===5||al.includes('wave')),al.join(','));
    if(lv===1){await W(500);await shot('maze_arrive_l1')}
    if(lv===3||lv===2){await W(500);await shot('maze_arrive_l'+lv)}
  }

  /* ---------- 2) 2단계: 틀린 길 ---------- */
  await enter(2);
  {
    let did=false,info='';
    for(let k=0;k<8&&!did;k++){
      await settled();let s=await mz();
      if(s.options.length>=2){
        const bad=s.options.find(o=>o.wrong),good=s.options.find(o=>!o.wrong);const cur0=s.cur;const n0=s.options.length;
        ok('2단계: 틀린 길에 이유가 보임 (자고 있는 고양이를 그림으로 그림)',bad.reason==='cat'&&(await p.evaluate(()=>document.querySelectorAll('#mzScene g').length>5)),'이유 '+bad.reason);
        await shot('maze_l2_wrong_before');
        await tapOpt(bad);await W(100);
        s=await mz();
        const logw=s.log.filter(x=>x.startsWith('wrong:')||x==='back');
        ok('2단계: 틀린 길로 가면 스스로 돌아옴 (같은 갈림길, 움직임 끝, 발자국 그대로)',s.cur===cur0&&!s.busy&&s.phase==='idle'&&logw.includes('wrong:cat')&&logw.includes('back')&&s.options.length===n0&&Math.hypot(s.totoXY[0]-s.curXY[0],s.totoXY[1]-s.curXY[1])<3,`log ${logw.join(',')} 토토-갈림길 거리 ${Math.hypot(s.totoXY[0]-s.curXY[0],s.totoXY[1]-s.curXY[1]).toFixed(1)}px`);
        const f2=await feet();ok('2단계: 가 본 틀린 길 발자국은 옅어지고 올바른 발자국이 남아 있음',f2.some(x=>x.tried)&&f2.some(x=>!x.tried));
        /* once more into the wrong way: still returns, nothing is stuck */
        await tapOpt((await mz()).options.find(o=>o.wrong));s=await mz();
        ok('2단계: 틀린 길을 또 가도 다시 돌아옴',s.cur===cur0&&!s.busy&&s.phase==='idle');
        did=true;info='ok';
      }else await tapOpt(s.options[0]);
    }
    ok('2단계: 갈림길을 만남',did,info);
    const seen=await run(best);const s=await mz();
    ok('2단계: 틀린 길을 다녀온 뒤에도 끝까지 완주',s.phase==='done'&&s.won,`phase=${s.phase}`);
  }

  /* ---------- 4) 손가락으로 길 따라가기 (trace) ---------- */
  await enter(1);
  {
    const s=await mz(),o=s.options[0],e=s.edges.find(x=>x.id===o.edge),sr=s.stage;
    /* the lane from Toto's spot, in screen coordinates */
    const fwd=e.a===s.cur,pts=(fwd?e.pts:e.pts.slice().reverse());
    const at=d=>{let acc=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc+l>=d||i===pts.length-1){const t=Math.min(1,(d-acc)/l);return[sr.left+pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,sr.top+pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t]}acc+=l}};
    const a0=at(70);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a0[0]-0,y:a0[1]}]});
    for(let d=80;d<=170;d+=15){const q=at(d);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:q[0]+6,y:q[1]-5}]});await W(40)}
    await W(250);const mid=await mz();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    ok('손가락으로 길을 따라가면 토토가 걸어감 (길 한가운데가 아니어도 인정)',mid.busy&&mid.log.some(x=>x.startsWith('walk:'+e.id)),'걷는 중 '+mid.busy);
    await settled();const e2=await mz();
    ok('손가락을 떼도 그 구간을 끝까지 걸어서 도착',e2.cur===o.node&&!e2.busy,`도착 ${e2.cur}, 기대 ${o.node}`);
    /* a plain tap on the lane (not on the footprint) also walks one piece */
    const s3=await mz(),o3=s3.options[0],e3=s3.edges.find(x=>x.id===o3.edge);const p3=(e3.a===s3.cur?e3.pts:e3.pts.slice().reverse());
    const mx=sr.left+(p3[0][0]+p3[1][0])/2,my=sr.top+(p3[0][1]+p3[1][1])/2;
    await touchTap(mx,my);await W(200);const m3=await mz();ok('길 위를 콕 해도 한 구간을 걸어감',m3.busy||m3.cur===o3.node,'busy '+m3.busy);
    await settled();
    /* a tap on the empty grass does nothing but cheer */
    const s4=await mz();await touchTap(sr.left+6,sr.top+6);await W(300);const m4=await mz();ok('풀밭을 콕 해도 아무 일 없이 응원만 함 (움직임 없음, 막히지 않음)',!m4.busy&&m4.cur===s4.cur&&m4.phase==='idle');
  }

  /* ---------- 4단계: 그림 표지 ---------- */
  await enter(4);
  {
    let did=false;
    for(let k=0;k<6&&!did;k++){await settled();const s=await mz();
      if(s.options.length>=2){const good=s.options.find(o=>!o.wrong),bad=s.options.find(o=>o.wrong);
        ok('4단계: 올바른 길의 그림 표지가 지금 찾는 그림(트레이 카드)과 같고, 틀린 길은 다른 그림',good.fruit===s.target&&bad.fruit&&bad.fruit!==s.target,`찾는 그림 ${s.target}, 길 표지 ${good.fruit} / ${bad.fruit}`);
        await tapOpt(bad);const s2=await mz();ok('4단계: 틀린 그림 길로 가도 돌아옴',s2.cur===s.cur&&!s2.busy&&s2.phase==='idle');did=true}
      else await tapOpt(s.options[0])}
    ok('4단계: 갈림길에서 그림 표지를 봄',did);
  }
  /* ---------- 5단계: 열쇠 없이 문으로 가면 ---------- */
  await enter(5);
  {
    let locked=false;
    for(let k=0;k<12&&!locked;k++){await settled();const s=await mz();
      /* at the fork with the key lane: take the other lane first */
      const o=s.options.length>=2&&s.options.some(x=>x.key)?s.options.find(x=>!x.key):best(s.options);
      await tapOpt(o);const s2=await mz();if(s2.log.includes('locked'))locked=true}
    const s=await mz();
    ok('5단계: 열쇠 없이 문에 가면 스스로 돌아와 열쇠 길 갈림길에 섬',locked&&!s.hasKey&&!s.busy&&s.options.some(o=>o.key),`열쇠 ${s.hasKey}`);
    await shot('maze_l5_locked');
    const seen=await run(best);const s5=await mz();ok('5단계: 열쇠를 줍고 나서 문을 열고 완주',s5.phase==='done'&&s5.hasKey);
  }

  /* ---------- 5) 글자·이모지 없음, 버튼마다 그림, 느린 움직임, 떠나면 멈춤 ---------- */
  await enter(3);
  const look=await p.evaluate(()=>{const scr=document.getElementById('maze'),EMO=/\p{Extended_Pictographic}/u;const out={text:[],emoji:[],btn:[]};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(!t)continue;out.text.push(t.slice(0,12));if(EMO.test(t))out.emoji.push(t)}
    scr.querySelectorAll('button').forEach(bt=>{const r=bt.getBoundingClientRect(),sv=bt.querySelector('svg'),w=sv?sv.getBoundingClientRect().width:0;if(r.width&&(!sv||w<r.width*.5))out.btn.push(bt.className)});
    return out});
  ok('아이 화면에 글자가 없음',look.text.length===0,look.text.join(' | '));
  ok('아이 화면에 이모지가 없음',look.emoji.length===0);
  ok('모든 버튼에 그림이 있고 그림이 버튼 넓이의 50% 이상',look.btn.length===0,look.btn.join(','));
  const back=await p.evaluate(()=>{const r=document.getElementById('mzHome').getBoundingClientRect(),st=document.getElementById('mzStage').getBoundingClientRect(),tr=document.getElementById('mzTray').getBoundingClientRect();return{bw:r.width,bl:r.left,bt:r.top,sh:st.height/innerHeight,th:tr.height/innerHeight,trBottom:innerHeight-tr.bottom}});
  ok('세 구역: 뒤로 가기 64px 이상 왼쪽 위 · 무대 화면 높이의 60~66% · 도구 칸 18~22% 맨 아래',back.bw>=64&&back.bl<32&&back.bt<32&&back.sh>=.59&&back.sh<=.67&&back.th>=.17&&back.th<=.23&&back.trBottom<=16,`뒤로 ${Math.round(back.bw)}px, 무대 ${(back.sh*100).toFixed(1)}%, 도구 칸 ${(back.th*100).toFixed(1)}%`);
  const bg=await p.evaluate(()=>{const css=[...document.querySelectorAll('#maze, #mzStage, #mzStage *, #mzTray')].map(e=>getComputedStyle(e).backgroundImage).filter(x=>x&&x!=='none');return css.filter(x=>/repeating|radial-gradient/.test(x)).length});
  ok('배경에 반복 무늬(점·줄무늬)가 없음',bg===0);
  /* repeating motion slower than 0.6 s while playing, and nothing runs after leaving */
  await p.evaluate(()=>{window.__fast=new Set();window.__t=setInterval(()=>{document.getAnimations().forEach(a=>{const t=a.effect&&a.effect.getTiming&&a.effect.getTiming();if(!t)return;const it=t.iterations,d=+t.duration;if((it>1||it===Infinity)&&d>0&&d<600)window.__fast.add((a.animationName||'?')+' '+d+'ms')})},500)});
  await W(2500);
  const fast=await p.evaluate(()=>[...window.__fast]);
  ok('반복하는 움직임은 주기 0.6초 이상',fast.length===0,fast.join(', '));
  await p.evaluate(()=>window.ML.go('home'));await W(400);
  const left=await p.evaluate(()=>{const g=window.ML.__mz();const n0=g.log.length;return{phase:g.phase,n0,fx:document.querySelectorAll('#maze .mz-ch,#maze .mz-fx').length,feet:document.querySelectorAll('#mzFeet .mz-foot').length}});
  await W(1500);const left2=await p.evaluate(()=>window.ML.__mz().log.length);
  ok('화면을 떠나면 멈춤 (캐릭터·발자국 정리, 더 이상 진행하지 않음)',left.phase===''&&left.fx===0&&left.feet===0&&left2===left.n0);
  ok('콘솔·페이지 오류 없음',errs.length===0,errs.slice(0,3).join(' | '));
  await b.close();
  console.log(fails?`\n${fails}개 실패`:'\n모두 통과');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
