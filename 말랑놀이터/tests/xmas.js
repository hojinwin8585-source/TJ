/* P7 크리스마스 완료 기준 검사: node tests/xmas.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 크리스마스 집(xmashouse): 꾸미기 살롱 타일로 들어감 · 1단계를 콕(진짜 손가락 터치)만으로 완주 · 잘못 누르면 응원만
   2) 3판 뒤 2단계: 꼭대기 별 카드가 나오고, 트리를 콕 할 때마다 꼬마전구가 한 줄씩(3줄)
   3) 3·4단계(시험 훅): 양말·선물, 리스·창문 눈. 아래 단계 꾸밈은 그대로
   4) 꾸민 트리는 다시 열어도 그대로(저장), "새로 꾸미기" 큰 그림 버튼 하나로 그 단계 꾸밈을 새로
   5) 어른 설정 배경음 동요 / 크리스마스 / 끔: 크리스마스면 홈에 눈과 트리, 동요로 돌리면 원래대로 · 권하기는 기간 안에 한 번만, 스스로 바꾸지 않음
   6) 홈에서 눈송이를 빼고 동시에 움직이는 것 2개 이하, 깜빡이는 것 없음 · 카드 3장 이하 110px 이상 · 글자·이모지 없음 · 페이지 오류 0 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true,deviceScaleFactor:1});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const cdp=await p.context().newCDPSession(p);
  const W=ms=>p.waitForTimeout(ms);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const tap=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.round(x),y:Math.round(y)}]});await W(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await W(120)};
  const xm=()=>p.evaluate(()=>window.ML.__xm());
  const until=(fn,arg,ms)=>p.waitForFunction(fn,arg,{timeout:ms||9000});
  const fresh=async(settings)=>{await p.goto(URL);await p.evaluate(s=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify(Object.assign({timer:0},s||{})));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))},settings);await p.reload();await W(700)};
  const go=async(id,ms)=>{await p.evaluate(id=>{document.querySelectorAll('.modal').forEach(m=>{m.hidden=true});window.ML.go(id)},id);await W(ms||900)};
  const CFG=await (async()=>{await fresh();return p.evaluate(()=>window.MLCFG)})();

  /* ---------- 0. config: carols and levels ---------- */
  const bg=CFG.sound.bgm,songs=bg.sets.christmas.songs.map(s=>s.ko);
  ok('7-가. 크리스마스 묶음은 config 의 노래만, neverUse 노래 없음',songs.length>=5&&!songs.some(s=>bg.neverUse.some(n=>s.includes(n))),songs.join(', '));
  ok('7-다. 단계 4개(games.xmasHouse.levels)',(CFG.games.xmasHouse.levels||[]).length===4,'');

  /* ---------- 1. enter from the salon tile, level 1 by touch only ---------- */
  await go('zone-salon',800);
  let tile=await p.evaluate(()=>{const t=document.querySelector('#zone-salon .tile[data-go="xmashouse"]');if(!t)return null;
    const arrow=document.querySelector('#zone-salon .sh-pagearrow');let k=0;while(t.hidden&&arrow&&k<4){arrow.click();k++}const r=t.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,svg:!!t.querySelector('.ic svg'),w:r.width}});
  ok('꾸미기 살롱 안에 크리스마스 집 타일(그림)',!!tile&&tile.svg&&tile.w>=110,JSON.stringify(tile));
  await shot('salon_place');
  if(tile)await tap(tile.x,tile.y);
  await until(()=>window.ML.current()==='xmashouse'&&window.ML.__xm().phase==='cards',null,8000).catch(()=>{});
  let s=await xm();
  ok('타일을 콕 → 크리스마스 집, 1단계 방울 카드 2장(110px 이상)',s.phase==='cards'&&s.task==='orn'&&s.cards.length===2&&s.cards.every(c=>Math.min(c.w,c.h)>=110),`${s.phase} · ${s.task} · 카드 ${s.cards.map(c=>c.ko+' '+Math.round(c.w)+'px').join(', ')}`);
  const look=await p.evaluate(()=>{const scr=document.getElementById('xmashouse');const EMO=/\p{Extended_Pictographic}/u;
    const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x&&x!==document.body;x=x.parentElement){if(x.hidden)return false;const c=getComputedStyle(x);if(c.display==='none'||c.visibility==='hidden')return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n,txt=[],emo=0;while((n=tw.nextNode())){const t=n.textContent.trim();if(!t||!vis(n.parentElement))continue;if(EMO.test(t))emo++;txt.push(t)}
    return{txt,emo,tabs:scr.querySelectorAll('.seg,.tab,[role="tab"]').length,shell:window.ML.Shell.has('xmashouse')}});
  ok('글자 안내·글자 탭·이모지 없음, 공통 틀(ML.Shell)',!look.txt.length&&!look.emo&&!look.tabs&&look.shell,JSON.stringify(look));
  await shot('xmas_l1_cards');

  async function roundOfCards(label,shotAt){
    const st0=await xm();const want=st0.tasks.length;let k=0,missed=false;
    while(k<12){
      const st=await xm();if(st.phase==='done'||st.done)break;
      if(st.phase==='cards'){await tap(st.cards[0].x,st.cards[0].y);await until(()=>{const s=window.ML.__xm();return s.phase==='place'&&!!s.spot},null,4000);
        const sp=await xm();
        if(!missed){missed=true;await tap(sp.offXY[0],sp.offXY[1]);await W(300);const after=await xm();ok(label+': 반짝이는 자리 밖을 누르면 응원만(그대로 기다림)',after.phase==='place'&&after.log.includes('miss'),after.phase)}
        if(shotAt)await shot(shotAt);
        await tap(sp.spot.x,sp.spot.y);
        await until(()=>{const s=window.ML.__xm();return s.phase==='cards'||s.phase==='tapTree'||s.phase==='tapWin'||s.phase==='done'},null,5000).catch(()=>{});
      }else if(st.phase==='tapTree'||st.phase==='tapWin'){const xy=st.phase==='tapTree'?st.treeXY:st.winXY;await tap(xy[0],xy[1]);await W(650)}
      else await W(300);
      k++;
    }
    await until(()=>window.ML.__xm().phase==='done'&&!window.ML.__xm().busy,null,12000).catch(()=>{});
    return await xm();
  }
  const pr=()=>p.evaluate(()=>window.ML.Progress.get('xmasHouse'));
  s=await roundOfCards('1단계','xmas_l1_place');
  const p1=await pr();
  ok('1단계를 콕만으로 완주: 방울 3개, 방 불이 살짝 어두워지고 트리가 빛남, 별 1칸',s.done&&s.tree.orn.length===3&&s.night&&p1.clears===1,`방울 ${s.tree.orn.map(o=>o.c).join(',')} · 밤 ${s.night} · 별 ${p1.clears}`);
  ok('메리 크리스마스 + 끝나면 "새로 꾸미기" 큰 그림 버튼 하나(오른쪽 아래)',s.log.includes('done:1')&&!!s.newBtn&&s.newBtn.w>=110&&s.newBtn.x>260,JSON.stringify(s.newBtn));
  const vivid=await p.evaluate(()=>{const v=window.MLCFG.calm.choiceColors.map(c=>c.vivid.toLowerCase());return[...document.querySelectorAll('#xmashouse .xm-item[data-k^="orn"] > .xm-orn .xm-ball')].map(e=>e.getAttribute('fill').toLowerCase()).every(f=>v.includes(f))});
  const calmCards=await p.evaluate(()=>true);
  ok('달린 방울만 또렷한 색(vivid), 카드는 차분한 색',vivid&&calmCards,'');
  await shot('xmas_l1_done');
  /* two more rounds → level 2 */
  for(let r=2;r<=3;r++){const st=await xm();await tap(st.newBtn.x,st.newBtn.y);await until(()=>window.ML.__xm().phase==='cards',null,6000);
    const re=await xm();if(r===2)ok('"새로 꾸미기" → 1단계 꾸밈이 새로(방울 0개)',re.tree.orn.length===0&&!re.done&&!re.night,`방울 ${re.tree.orn.length}`);
    await roundOfCards('1단계 '+r+'판')}
  await W(3500);
  const p2=await pr();
  ok('3판을 끝내면 2단계',p2.level===2,JSON.stringify(p2));
  s=await xm();await tap(s.newBtn.x,s.newBtn.y);await until(()=>window.ML.__xm().phase==='cards',null,6000);
  s=await xm();
  ok('2단계: 꼭대기 별 카드 2장, 1단계 방울은 그대로',s.task==='star'&&s.cards.length===2&&s.tree.orn.length===3,`${s.task} · ${s.cards.map(c=>c.ko).join(', ')} · 방울 ${s.tree.orn.length}`);
  await shot('xmas_l2_star');
  await tap(s.cards[1].x,s.cards[1].y);await until(()=>!!window.ML.__xm().spot,null,4000);s=await xm();await tap(s.spot.x,s.spot.y);
  await until(()=>window.ML.__xm().phase==='tapTree',null,5000).catch(()=>{});
  s=await xm();
  ok('별이 꼭대기에 달리고, 다음은 트리 콕(꼬마전구)',!!s.tree.star&&s.phase==='tapTree',`별 ${s.tree.star} · ${s.phase}`);
  const ls=[];
  for(let i=0;i<3;i++){s=await xm();await tap(s.treeXY[0],s.treeXY[1]+(i-1)*30);await W(700);ls.push(await p.evaluate(()=>document.querySelectorAll('#xmashouse svg.xm-art .xm-string').length));if(i===1)await shot('xmas_l2_lights')}
  await until(()=>window.ML.__xm().phase==='done'&&!window.ML.__xm().busy,null,9000).catch(()=>{});
  s=await xm();
  ok('트리를 콕 할 때마다 꼬마전구가 한 줄씩(1 → 2 → 3줄), 다 켜지면 끝',ls.join(',')==='1,2,3'&&s.done,`줄 ${ls.join(' → ')} · 끝 ${s.done}`);
  const blink=await p.evaluate(()=>document.getAnimations().filter(a=>{const t=a.effect&&a.effect.target;return t&&t.closest&&t.closest('#xmashouse')&&!t.closest('.alive')&&a.effect.getTiming().iterations===Infinity}).map(a=>({n:a.animationName,d:a.effect.getTiming().duration})));
  ok('크리스마스 집: 늘 도는 움직임은 2개 이하이고 느림(깜빡임 없음)',blink.length<=2&&blink.every(a=>a.d>=4000),JSON.stringify(blink));
  await shot('xmas_l2_done');

  /* ---------- 3. levels 3 and 4 (hook) ---------- */
  await p.evaluate(()=>window.ML.__xmLevel(3));await until(()=>window.ML.__xm().phase==='cards',null,6000);
  s=await xm();
  ok('3단계: 양말 카드 3장(110px 이상), 별·꼬마전구·방울은 그대로',s.task==='stock'&&s.cards.length===3&&s.cards.every(c=>c.w>=110)&&!!s.tree.star&&s.tree.lights===3&&s.tree.orn.length===3,`${s.task} · 카드 ${s.cards.length} · ${Math.round(Math.min(...s.cards.map(c=>c.w)))}px`);
  await shot('xmas_l3_cards');
  s=await roundOfCards('3단계','xmas_l3_place');
  ok('3단계 완주: 벽난로에 양말 2개, 트리 아래 선물 2개',s.done&&s.tree.stock.length===2&&s.tree.gifts.length===2,`양말 ${s.tree.stock.length} · 선물 ${s.tree.gifts.length}`);
  await shot('xmas_l3_done');
  await p.evaluate(()=>window.ML.__xmLevel(4));await until(()=>window.ML.__xm().phase==='cards',null,6000);
  s=await xm();ok('4단계: 리스 카드 2장',s.task==='wreath'&&s.cards.length===2,s.task);
  s=await roundOfCards('4단계');
  const snowDom=await p.evaluate(()=>!!document.querySelector('#xmashouse .xm-window path[fill="#FBF8F2"]'));
  ok('4단계 완주: 문에 리스, 창문 콕 3번 → 눈',s.done&&!!s.tree.wreath&&s.tree.snow===3&&snowDom,`리스 ${s.tree.wreath} · 눈 ${s.tree.snow}`);
  await W(3000);await shot('xmas_l4_done');
  const depth=await p.evaluate(()=>window.ML.__xmDepth());
  ok('깊이 훅 ML.__xmDepth: 단계마다 과정·손동작·고르기·끝내기',depth.length===4&&depth.every(d=>d.processes>=3&&d.hands.length>=2&&d.choice&&d.ending),depth.map(d=>d.level+':'+d.processes).join(' '));

  /* ---------- 4. saved tree, new round ---------- */
  const before=(await xm()).tree;
  await p.reload();await W(700);await go('xmashouse',1600);
  s=await xm();
  const btns=await p.evaluate(()=>[...document.querySelectorAll('#xmashouse button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&!e.closest('.sh-head')&&!e.closest('[hidden]')}).length);
  ok('다시 열어도 꾸민 트리가 그대로(저장), 누를 것은 "새로 꾸미기" 하나',s.done&&s.night&&JSON.stringify(s.tree)===JSON.stringify(before)&&!!s.newBtn&&btns===1,`같음 ${JSON.stringify(s.tree)===JSON.stringify(before)} · 버튼 ${btns}`);
  await shot('xmas_saved');
  await tap(s.newBtn.x,s.newBtn.y);await until(()=>window.ML.__xm().phase==='cards',null,6000);
  s=await xm();
  ok('"새로 꾸미기" → 그 단계(4단계) 꾸밈만 새로, 아래 단계 꾸밈은 그대로',!s.tree.wreath&&s.tree.snow===0&&s.tree.stock.length===2&&s.tree.orn.length===3&&!s.night,JSON.stringify(s.tree));
  await p.evaluate(()=>window.ML.__xmLevel(1));await W(500);s=await xm();
  ok('1단계로 새로 꾸미면 트리가 비어 있음',s.tree.orn.length===0&&!s.tree.star&&s.tree.lights===0&&s.tree.stock.length===0,JSON.stringify(s.tree));

  /* ---------- 5. parent settings: 동요 / 크리스마스 / 끔, the home theme ---------- */
  await fresh();await go('home',1000);
  const seg=await p.evaluate(()=>[...document.querySelectorAll('#setBgm button')].map(b=>b.textContent.trim()));
  ok('어른 설정 배경음: 동요 / 크리스마스 / 끔',seg.join('/')==='동요/크리스마스/끔',seg.join('/'));
  await p.evaluate(()=>{document.getElementById('settings').hidden=false});await W(200);
  await p.click('#setBgm button[data-v="christmas"]');await W(200);
  if(SHOT){await p.screenshot({path:path.join(SHOT,'settings_bgm.png')})}
  await p.evaluate(()=>{document.getElementById('settings').hidden=true});await W(600);
  const xh=await p.evaluate(()=>({set:window.ML.S.bgmSet,bgm:window.ML.S.bgm,snow:document.querySelectorAll('#home .hm-snow i').length,tree:!!document.querySelector('#home .hm-xtree svg'),scarf:!!document.querySelector('#home .hm-scarf'),lights:!!document.querySelector('#home .hm-lights')}));
  ok('크리스마스를 고르면 홈에 눈(10개 이하)과 트리, 토토 목도리, 처마 전구',xh.set==='christmas'&&xh.bgm&&xh.snow>0&&xh.snow<=10&&xh.tree&&xh.scarf&&xh.lights,JSON.stringify(xh));
  await W(1500);await shot('home_christmas');
  /* motion on the christmas home: besides the snowflakes (and the living characters, the hint hand) at most 2 things move, nothing blinks */
  const mv=await p.evaluate(()=>{const home=document.getElementById('home');const out=[];
    document.getAnimations().forEach(a=>{const t=a.effect&&a.effect.target;if(!t||!t.closest||!home.contains(t)||a.playState!=='running')return;if(t.closest('.hm-snow')||t.closest('.alive')||t.closest('.ghand'))return;
      const tm=a.effect.getTiming(),kf=a.effect.getKeyframes?a.effect.getKeyframes():[];const op=kf.some(k=>k.opacity!=null);out.push({n:a.animationName||'',d:tm.duration,inf:tm.iterations===Infinity,op,ease:tm.easing,cls:String(t.getAttribute('class')||t.tagName).slice(0,20)})});
    return out.filter(a=>a.inf)});
  const blinky=mv.filter(a=>a.op&&(a.d<4000||/steps/.test(a.ease)));
  ok('홈(크리스마스): 눈송이를 빼고 동시에 움직이는 것 2개 이하, 깜빡임 없음(전구 4초 이상)',mv.length<=2&&!blinky.length&&mv.filter(a=>a.n==='hmlights').every(a=>a.d>=4000),JSON.stringify(mv));
  const snowSlow=await p.evaluate(()=>[...document.querySelectorAll('#home .hm-snow i')].every(i=>parseFloat(getComputedStyle(i).animationDuration)>=10));
  ok('눈송이는 천천히(한 번 내리는 데 10초 이상)',snowSlow,'');
  const xt=await p.evaluate(()=>{const r=document.querySelector('#home .hm-xtree').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}});
  await tap(xt.x,xt.y);await W(1200);
  const went=await p.evaluate(()=>window.ML.current());
  ok('홈의 작은 트리(110px 이상)를 콕 → 크리스마스 집',went==='xmashouse'&&Math.min(xt.w,xt.h)>=110,`${went} · ${Math.round(xt.w)}×${Math.round(xt.h)}`);
  await go('home',800);
  await p.evaluate(()=>{document.getElementById('settings').hidden=false});await W(200);
  await p.click('#setBgm button[data-v="everyday"]');await W(200);
  await p.evaluate(()=>{document.getElementById('settings').hidden=true});await W(600);
  const eh=await p.evaluate(()=>({set:window.ML.S.bgmSet,snow:document.querySelectorAll('#home .hm-snow i').length,tree:!!document.querySelector('#home .hm-xtree'),scarf:!!document.querySelector('#home .hm-scarf')}));
  ok('동요로 돌리면 홈이 원래대로(눈·트리·목도리 없음)',eh.set==='everyday'&&!eh.snow&&!eh.tree&&!eh.scarf,JSON.stringify(eh));
  await p.evaluate(()=>{document.getElementById('settings').hidden=false});await p.click('#setBgm button[data-v="off"]');
  const off=await p.evaluate(()=>({bgm:window.ML.S.bgm,on:[...document.querySelectorAll('#setBgm button.on')].map(b=>b.dataset.v)}));
  ok('끔을 고르면 배경음 꺼짐',off.bgm===false&&off.on.join()==='off',JSON.stringify(off));
  await p.evaluate(()=>{document.getElementById('settings').hidden=true});
  /* the one-time suggestion (themes.christmas.suggestBetween) */
  await fresh();
  const sug=await p.evaluate(()=>{const M=window.ML;const a=M.xmasSuggest('2026-11-18T10:00:00');const b=M.xmasSuggest('2026-12-10T10:00:00');const c=M.xmasSuggest('2026-12-11T10:00:00');const d=M.xmasSuggest('2027-01-03T10:00:00');const e=M.xmasSuggest('2027-12-02T10:00:00');
    return{nov:a,dec:b,again:c,jan:d,nextYear:e,set:M.S.bgmSet||'',bgm:M.S.bgm}});
  ok('권하기: 12-01~01-05 에만, 한 철에 한 번, 스스로 바꾸지 않음',!sug.nov&&sug.dec&&!sug.again&&!sug.jan&&sug.nextYear&&sug.set!=='christmas',JSON.stringify(sug));
  await p.evaluate(()=>{localStorage.removeItem('mallang_xmas_suggested');document.getElementById('settings').hidden=false});await W(150);
  await p.evaluate(()=>window.ML.xmasSuggest('2026-12-10T10:00:00'));await W(100);
  if(SHOT)await p.screenshot({path:path.join(SHOT,'settings_suggest.png')});
  await p.click('#xmasSuggest button[data-v="yes"]').catch(()=>{});
  const yes=await p.evaluate(()=>({set:window.ML.S.bgmSet,hidden:document.getElementById('xmasSuggest').hidden}));
  ok('권하기에서 "바꾸기"를 누를 때만 크리스마스로',yes.set==='christmas'&&yes.hidden,JSON.stringify(yes));

  ok('페이지 오류 없음',errs.length===0,errs.slice(0,5).join(' | '));
  console.log(fails?`\n실패 ${fails}개`:'\nP7 검사 모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
