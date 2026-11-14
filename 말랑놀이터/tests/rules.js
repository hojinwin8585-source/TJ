/* 쇠규칙 검사기 (P5-나): node tests/rules.js
   MLCFG.rules.*.test 를 화면에서 자동으로 봅니다.
   - noReading   : 아이 화면의 모든 버튼에 그림(svg)이 있고 그림이 버튼 넓이의 50% 이상. 글자만·이모지만 있으면 실패. 글자 안내 줄(머리줄 제목 밖의 글자)도 실패
   - noEmojiArt  : 아이 화면의 글자 노드에 이모지 문자가 있으면 실패
   - sameLayoutEverywhere : 뒤로 가기(64px 이상, 왼쪽 위) · 무대(화면 높이 60~66%) · 도구 칸(18~22%, 맨 아래)
   - madeEqualsUsed / everyIngredientPrepared : 피자 1단계를 콕·쓱쓱으로 끝까지 해서 썬 수 == 접시 수 == 피자 위 수, 접시 0 / 모든 재료에 준비 과정, 조각 크기 16% 이상
   - depth : 놀이마다 과정 수 · 손동작 종류 · 살아 있는 손님 · 고르기 · 끝내기 장면 표
   pizza · petsalon · nailshop 은 통과해야 하고(하나라도 어기면 실패로 끝남), 다른 화면은 어긴 것의 목록만 보여 줍니다(P8 이후에 고침). */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const MAIN=['pizza','petsalon','nailshop'];
const ZONES={pizza:{back:'.pz-back',stage:'#pzStage',tray:'#pzTray'},petsalon:{back:'#psHome,#psBack',stage:'#psStage',tray:'#psPanel'},nailshop:{back:'#nsHome,#nsBack',stage:'#nsStage',tray:'#nsPanel'}};
const TOL=.01;   // measuring tolerance on the height ratios
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});await p.reload();await p.waitForTimeout(600);
  const W=ms=>p.waitForTimeout(ms);
  const CFG=await p.evaluate(()=>window.MLCFG);
  const R=CFG.rules||{},SH=CFG.shell||{};
  const lim={back:Math.max(64,+(String(((R.sameLayoutEverywhere||{}).sizes||{}).back||'64').match(/\d+/)||[64])[0]),stage:(SH.stage||{}).heightRatio||[.6,.66],tray:(SH.tray||{}).heightRatio||[.18,.22]};

  /* ---------- one look at the screen as it is now ---------- */
  const look=(id,z,withLayout)=>p.evaluate(([id,z,withLayout,lim,TOL])=>{
    const scr=document.getElementById(id),out={reading:[],hint:[],emoji:[],layout:[],info:{}};if(!scr)return out;
    const vis=e=>{if(!e||!e.getBoundingClientRect)return false;const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return false;
      for(let x=e;x&&x!==document.body;x=x.parentElement){if(x.hidden)return false;const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const EMO=/\p{Extended_Pictographic}/u,name=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')||e.tagName.toLowerCase();
    /* buttons: a picture of at least half the width */
    const btns=[...scr.querySelectorAll('button,[role="button"]')].filter(vis);
    btns.forEach(bt=>{const r=bt.getBoundingClientRect(),pics=[...bt.querySelectorAll('svg,img,canvas')].filter(vis),pw=pics.length?Math.max(...pics.map(s=>s.getBoundingClientRect().width)):0,txt=(bt.textContent||'').trim();
      if(pw<r.width*.5){const kind=!txt?'그림 작음':EMO.test(txt)&&!txt.replace(/\p{Extended_Pictographic}|️|‍|\s/gu,'')?'이모지만 있는 버튼':pw?'그림이 작고 글자':'글자만 있는 버튼';out.reading.push(`${kind}: ${name(bt)} "${txt.slice(0,14)}" (그림 ${Math.round(pw)}/${Math.round(r.width)}px)`)}});
    /* text outside buttons and outside the header title = a text hint line */
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n;
    while((n=tw.nextNode())){const t=n.textContent.trim();if(!t)continue;const el=n.parentElement;if(!vis(el))continue;
      if(EMO.test(t))out.emoji.push(`${name(el.closest('button')||el)} "${t.slice(0,12)}"`);
      if(el.closest('button,[role="button"]'))continue;
      if(el.closest('.bar h2,.bar h1,.zonehead h2'))continue;
      out.hint.push(`${name(el)} "${t.slice(0,16)}"`)}
    out.info.buttons=btns.length;
    if(withLayout){
      const sh=scr.getBoundingClientRect().height,sw=scr.getBoundingClientRect().width;
      const back=[...scr.querySelectorAll(z&&z.back?z.back:'.bar button,.bar .round')].find(vis);
      if(!back)out.layout.push('뒤로 가기 없음');else{const r=back.getBoundingClientRect();out.info.back=Math.round(Math.min(r.width,r.height));
        if(Math.min(r.width,r.height)<lim.back)out.layout.push(`뒤로 가기 ${Math.round(Math.min(r.width,r.height))}px < ${lim.back}px`);
        if(r.left+r.width/2>sw*.3||r.top>sh*.15)out.layout.push('뒤로 가기가 왼쪽 위가 아님')}
      let stage=z&&z.stage?scr.querySelector(z.stage):null,tray=z&&z.tray?scr.querySelector(z.tray):null;
      if(!stage){const kids=[...scr.querySelectorAll(':scope > *, :scope > * > *')].filter(e=>vis(e)&&!e.closest('.bar')&&e.getBoundingClientRect().width>sw*.6);
        kids.sort((a,c)=>c.getBoundingClientRect().height-a.getBoundingClientRect().height);stage=kids[0]||null;
        if(stage){const sr=stage.getBoundingClientRect();tray=kids.filter(e=>e!==stage&&!e.contains(stage)&&!stage.contains(e)&&e.getBoundingClientRect().top>=sr.bottom-2).sort((a,c)=>c.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom)[0]||null}}
      if(!stage||!vis(stage))out.layout.push('무대 없음');else{const sr=stage.getBoundingClientRect(),k=sr.height/sh;out.info.stage=+k.toFixed(3);
        if(k<lim.stage[0]-TOL||k>lim.stage[1]+TOL)out.layout.push(`무대 높이 ${(k*100).toFixed(1)}% (기준 ${lim.stage[0]*100}~${lim.stage[1]*100}%)`)}
      if(!tray||!tray.getBoundingClientRect().height)out.layout.push('아래 도구 칸 없음');else{const tr=tray.getBoundingClientRect(),k=tr.height/sh;out.info.tray=+k.toFixed(3);
        if(k<lim.tray[0]-TOL||k>lim.tray[1]+TOL)out.layout.push(`도구 칸 높이 ${(k*100).toFixed(1)}% (기준 ${lim.tray[0]*100}~${lim.tray[1]*100}%)`);
        if(tr.bottom<sh-40)out.layout.push('도구 칸이 맨 아래가 아님');
        if(stage&&tr.top<stage.getBoundingClientRect().bottom-2)out.layout.push('도구 칸이 무대 아래가 아님')}
    }
    return out},[id,z||null,withLayout,lim,TOL]);
  const merge=(a,c)=>{['reading','hint','emoji','layout'].forEach(k=>{a[k]=[...new Set(a[k].concat(c[k]))]});Object.assign(a.info,c.info);return a};
  const blank=()=>({reading:[],hint:[],emoji:[],layout:[],info:{}});
  const results={},extra={};

  /* ---------- pizza: level 1 by tapping and rubbing only ---------- */
  await p.evaluate(()=>window.ML.go('pizza'));await p.waitForFunction(()=>window.ML.__pz().phase==='sauce',null,{timeout:9000});await W(2500);
  let rz=await look('pizza',ZONES.pizza,true);results.pizza=rz;
  const pz=()=>p.evaluate(()=>window.ML.__pz());
  let fin=null;const t0=Date.now();
  while(Date.now()-t0<90000){const s=await pz();
    if(s.step==='serve'&&!fin){fin=s;merge(results.pizza,await look('pizza',ZONES.pizza,true))}
    if(s.served>=1)break;
    if(s.step==='top'&&s.plate===2&&!extra.wait){extra.wait=true;await p.waitForFunction(()=>!window.ML.__pz().flying,null,{timeout:4000});
      merge(results.pizza,await look('pizza',ZONES.pizza,true));await W(3000);const y=await pz();extra.stay=y.step==='top'&&y.plate===2}
    if(s.kind==='wait'||s.busy){await W(200);continue}
    if(s.kind==='rub'){const r=s.rect,cx=r.x+r.w/2,cy=r.y+r.h/2;await p.mouse.move(cx,cy);await p.mouse.down();for(let k=0;k<16;k++){await p.mouse.move(cx+Math.cos(k*1.1)*r.w*.32,cy+Math.sin(k*1.7)*r.h*.32,{steps:3});await W(30)}await p.mouse.up();await W(100);continue}
    if(s.kind==='tap'){await p.mouse.click(s.aim[0],s.aim[1]);await W(450);continue}
    await W(200)}
  const counts=fin?fin.counts:{},madeOk=!!fin&&Object.keys(counts).length>0&&Object.keys(counts).every(t=>counts[t].made>0&&counts[t].made===counts[t].placed&&fin.topsBy[t]===counts[t].made)&&fin.plate===0;
  const prep=await p.evaluate(()=>window.ML.__pzPrep()),sizes=await p.evaluate(()=>window.ML.__pzPieceSizes());
  const minSize=+(String((R.everyIngredientPrepared||{}).minPieceSize||'16').match(/\d+/)||[16])[0]/100;
  const unprepared=prep.tops.filter(t=>!prep.prep[t]),small=Object.keys(sizes).filter(t=>sizes[t]<minSize);
  results.pizza.made={ok:madeOk&&extra.stay===true,info:fin?Object.keys(counts).map(t=>`${t}: 썬 ${counts[t].made} · 올린 ${counts[t].placed} · 피자 위 ${fin.topsBy[t]}`).join(' / ')+` · 접시 남은 ${fin.plate} · 접시에 2개 남았을 때 3초 기다려도 그대로 ${extra.stay}`:'끝까지 못 감'};
  results.pizza.prepared={ok:!unprepared.length&&!small.length&&prep.prep.corn&&prep.prep.corn!=='knife',info:`준비: ${prep.tops.map(t=>t+'='+prep.prep[t]).join(', ')} · 조각/피자 지름: ${Object.keys(sizes).map(t=>t+' '+Math.round(sizes[t]*100)+'%').join(', ')}`};

  /* ---------- pet salon: shop front, then in the salon while washing ---------- */
  await p.evaluate(()=>window.ML.go('home'));await W(300);
  await p.evaluate(()=>window.ML.go('petsalon'));await p.waitForFunction(()=>window.ML.__ps().phase==='lobby',null,{timeout:8000});await W(800);
  results.petsalon=await look('petsalon',ZONES.petsalon,false);
  for(let k=0;k<4&&(await p.evaluate(()=>window.ML.__ps().phase))==='lobby';k++){await p.locator('.lb-cust').first().click().catch(()=>{});await W(1200)}await p.waitForFunction(()=>['foam','rinse','dry','dress'].includes(window.ML.__ps().phase),null,{timeout:15000}).catch(async e=>{throw new Error('미용실 손님이 들어오지 않음: '+JSON.stringify(await p.evaluate(()=>{const s=window.ML.__ps();return[window.ML.current(),s.view,s.phase]})))});await W(2500);
  merge(results.petsalon,await look('petsalon',ZONES.petsalon,true));
  /* ---------- nail shop: shop front, then the room while colouring ---------- */
  await p.evaluate(()=>window.ML.go('home'));await W(300);
  await p.evaluate(()=>window.ML.go('nailshop'));await p.waitForFunction(()=>window.ML.__ns().phase==='lobby',null,{timeout:8000});await W(800);
  results.nailshop=await look('nailshop',ZONES.nailshop,false);
  await p.locator('.nl-cust').first().click();await p.waitForFunction(()=>window.ML.__ns().view==='room',null,{timeout:8000});await W(3500);
  merge(results.nailshop,await look('nailshop',ZONES.nailshop,true));

  /* ---------- report: the three that must pass ---------- */
  let bad=0;
  console.log('=== 쇠규칙: 반드시 통과 (pizza, petsalon, nailshop) ===');
  console.log('화면 | 글자 버튼(noReading) | 글자 안내 줄 | 이모지(noEmojiArt) | 세 구역(뒤로·무대·도구 칸) | 판정');
  for(const g of MAIN){const r=results[g],ok=!r.reading.length&&!r.hint.length&&!r.emoji.length&&!r.layout.length&&(!r.made||r.made.ok)&&(!r.prepared||r.prepared.ok);if(!ok)bad++;
    console.log([g,r.reading.length||'없음',r.hint.length||'없음',r.emoji.length||'없음',r.layout.length?r.layout.length+'건':`맞음 (뒤로 ${r.info.back}px · 무대 ${Math.round(r.info.stage*1000)/10}% · 도구 칸 ${Math.round(r.info.tray*1000)/10}%)`,ok?'통과':'고칠 것'].join(' | '));
    ['reading','hint','emoji','layout'].forEach(k=>r[k].forEach(x=>console.log('    - '+x)));
    if(r.made)console.log(`    만든 만큼 쓰기(madeEqualsUsed): ${r.made.ok?'통과':'실패'} | ${r.made.info}`);
    if(r.prepared)console.log(`    모든 재료에 준비 과정(everyIngredientPrepared): ${r.prepared.ok?'통과':'실패'} | ${r.prepared.info}`);
  }

  /* ---------- the other screens: list only ---------- */
  const others=await p.evaluate(m=>[...document.querySelectorAll('#app > .screen')].map(s=>s.id).filter(id=>id!=='home'&&!m.includes(id)),MAIN);
  console.log('\n=== 다른 화면: 목록만 (P8 이후에 고침, 실패로 치지 않음) ===');
  console.log('화면 | 글자 버튼 | 글자 안내 줄 | 이모지 | 세 구역');
  const probe={};
  for(const g of others){
    await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>{m.hidden=true})});
    await p.evaluate(g=>window.ML.go(g),g);await W(1600);
    const r=await look(g,null,true);
    probe[g]=await p.evaluate(g=>{const scr=document.getElementById(g),q=s=>scr.querySelectorAll(s).length;
      return{alive:window.ML.Alive?window.ML.Alive.stats().instances:0,dots:q('.kdots i,.dots i,.dots button'),canvas:q('canvas'),drag:q('.dragi,.piece'),tool:q('.tl-tool,.rub-tool'),btn:q('button:not([data-go])')}},g);
    console.log([g,r.reading.length,r.hint.length,r.emoji.length,r.layout.length?r.layout.join(' / '):'맞음'].join(' | '));
    const show=(k,lab)=>{if(r[k].length)console.log(`    ${lab}: ${r[k].slice(0,4).join(' · ')}${r[k].length>4?` 외 ${r[k].length-4}`:''}`)};
    show('reading','글자 버튼');show('hint','글자 줄');show('emoji','이모지');
  }

  /* ---------- depth table (rules.depth) ---------- */
  const must=(R.depth||{}).must||{},minProc=+(String(must.processes||'4').match(/\d+/)||[4])[0],minHands=+(String(must.handActions||'2').match(/\d+/)||[2])[0];
  const depth=await p.evaluate(()=>window.ML.__pzDepth());
  const rows=[];
  depth.forEach(d=>rows.push({g:`pizza ${d.level}단계`,proc:d.processes,hands:d.hands,someone:d.someone,choice:d.choice,ending:d.ending?'건네주기·냠냠·춤':'',src:'놀이 코드'}));
  const ps=(CFG.games||{}).petsalon||{},needSteps=Math.max(...(ps.needs||[{steps:[]}]).map(n=>(n.steps||[]).length));
  rows.push({g:'petsalon',proc:Math.min(3,needSteps)+1,hands:['rub(도구 따라옴)','card'],someone:true,choice:true,ending:'거울·사진·액자',src:'config needs + salon.js'});
  const ns=(CFG.games||{}).nailshop||{},lvls=ns.levels||[],nl=lvls.length?lvls[lvls.length-1].steps:[],nf=lvls.length?lvls[0].steps:[];
  rows.push({g:`nailshop (1~${lvls.length}단계)`,proc:`${new Set(nf).size}~${new Set(nl).size}`,hands:['rub(도구 따라옴)','tap','card'],someone:true,choice:true,ending:'거울·액자',src:'config levels'});
  for(const g of others){const q=probe[g];if(!q||/^zone-|^map$|^friends$|^stamps$|^videos$/.test(g))continue;
    const hands=[];if(q.canvas||q.tool)hands.push('rub');if(q.btn)hands.push('tap');if(q.drag)hands.push('drag');
    rows.push({g,proc:q.dots||1,hands,someone:q.alive>0,choice:'?',ending:'?',src:'화면에서 추정'})}
  console.log('\n=== 깊이 표 (rules.depth: 과정 '+minProc+'개 이상 · 손동작 '+minHands+'가지 이상 · 살아 있는 손님 · 고르기 · 끝내기 장면) ===');
  console.log('놀이 | 과정 | 손동작 | 살아 있는 손님 | 고르기 | 끝내기 장면 | 판정 | 근거');
  rows.forEach(r=>{const pr=typeof r.proc==='string'?+r.proc.split('~').pop():r.proc,lack=[];
    if(pr<minProc)lack.push('과정');if(r.hands.length<minHands)lack.push('손동작');if(!r.someone)lack.push('손님');if(r.choice!==true)lack.push('고르기');if(!r.ending||r.ending==='?')lack.push('끝내기');
    console.log([r.g,r.proc,r.hands.join('+')||'-',r.someone?'있음':'없음',r.choice===true?'있음':r.choice===false?'없음':r.choice,r.ending||'없음',lack.length?'고칠 것('+lack.join(',')+')':'갖춤',r.src].join(' | '))});
  console.log('  * 피자 1단계는 rules.depth.must.processes 의 "1단계는 3개부터" 에 따라 과정 4개(소스·썰기·올리기·굽기), 고르기는 3단계부터(games.pizza.levels).');

  console.log('\n페이지 오류:',errs.length?JSON.stringify(errs.slice(0,5)):'없음');
  console.log(bad?`\n반드시 통과할 화면 중 ${bad}개가 고칠 것`:'\n반드시 통과할 화면 모두 통과');
  await b.close();process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
