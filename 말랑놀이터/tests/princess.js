/* 공주 옷장 늘리기 검사 (games.clothes.princessWardrobe): node tests/princess.js   (SHOT_DIR=폴더 를 주면 화면을 저장)
   후기 "공주가 너무 옷이 없어요ㅠ" → 1단계부터 옷장이 가득. 모든 손동작은 CDP Input.dispatchTouchEvent 로 보낸 진짜 터치(390×780 모바일).
   1) 1단계 공주 방: 받침대 6개 이상(110px 이상, 그림), 종류 7가지 이상 × 6가지 이상을 받침대와 화살표만으로 다 볼 수 있음
   2) 한 번에 보이는 카드는 3장까지, 큰 화살표 그림으로 다음 3장 → 끝까지 가면 처음으로
   3) 종류마다 하나씩 입히면 모두 인형 위에 실제 크기로 보임, 입은 것을 콕 = 색 바꾸기, 인형에서 끌어내면 벗겨짐, 카드를 인형에 끌어 놓아도 입힘
   4) 물감 통: 하얀 드레스를 끌어서 통에 넣으면 그 색 드레스가 됨
   5) 거울은 아이가 눌러야 끝: 누르기 전에는 친구 공주 0명, 누르면 무도회장 · 친구 공주 2명 · 색종이 · 포즈 3가지 · 사진첩
   6) 2단계: 윗옷 + 치마를 드레스 틀에서 맞춰 입힘 · 3단계: 반짝이 무늬까지 · 4단계: 가족 얼굴(사진이 있을 때)
   7) 글자 · 이모지 없음, 누를 것 110px 이상, 페이지 오류 없음 */
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
  const W=ms=>p.waitForTimeout(ms),st=()=>p.evaluate(()=>window.ML.__clPrincess()),cl=()=>p.evaluate(()=>window.ML.__cl());
  const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q[0],y:q[1],id:i}))});
  const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await W(60);await touch('touchEnd',[])};
  const drag=async(a,c,n=14)=>{await touch('touchStart',[a]);for(let k=1;k<=n;k++){await touch('touchMove',[[a[0]+(c[0]-a[0])*k/n,a[1]+(c[1]-a[1])*k/n]]);await W(25)}await touch('touchEnd',[])};
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const idle=()=>p.waitForFunction(()=>!window.ML.__clPrincess().busy,null,{timeout:8000}).then(()=>W(300));
  let maxCards=0;const look=async()=>{const s=await st();maxCards=Math.max(maxCards,s.cards.length);return s};
  const textCheck=()=>p.evaluate(()=>{
    const scr=document.getElementById('clothes'),vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(x.hidden||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT),texts=[];let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t&&n.parentElement&&vis(n.parentElement)&&!n.parentElement.closest('style'))texts.push(t)}
    const btns=[...scr.querySelectorAll('button')].filter(vis).filter(bt=>getComputedStyle(bt).pointerEvents!=='none').map(bt=>{const r=bt.getBoundingClientRect(),s=[...bt.querySelectorAll('svg')].filter(vis),sw=s.length?Math.max(...s.map(x=>x.getBoundingClientRect().width)):0;return{cls:bt.className,w:Math.round(r.width),h:Math.round(r.height),ratio:+(sw/r.width).toFixed(2),text:(bt.textContent||'').trim()}});
    return{texts,bad:btns.filter(x=>x.ratio<.5||x.text),small:btns.filter(x=>!/cl-back/.test(x.cls)&&Math.min(x.w,x.h)<110),emoji:/\p{Extended_Pictographic}/u.test(scr.textContent)}});
  const textBad=[];const checkText=async tag=>{const t=await textCheck();if(t.texts.length||t.bad.length||t.small.length||t.emoji)textBad.push(tag+': '+JSON.stringify(t))};
  /* open the princess room from the shop (the friend whose bubble is the crown) */
  async function enter(){
    await p.waitForFunction(()=>window.ML.__cl().phase==='lobby',null,{timeout:12000});await W(1200);
    const c=await cl();const i=c.mateThemes.indexOf('palace');
    if(i<0)return false;await tap(c.mates[i][0],c.mates[i][1]);
    await p.waitForFunction(()=>window.ML.__clPrincess().on&&window.ML.__clPrincess().phase==='pdress',null,{timeout:8000});await W(2400);return true;
  }
  const standOf=(s,cat)=>s.stands.find(x=>x.cats.includes(cat));
  /* show the rail page that has a card of this category (stand tap, then the arrow), and return that card */
  async function findCard(cat,kind){
    let s=await look();const sd=standOf(s,cat||'gown');
    if(s.open!==sd.id){await tap(sd.rect[0],sd.rect[1]);await W(700);s=await look()}
    for(let k=0;k<=s.pages;k++){const c=s.cards.find(x=>kind?x.kind===kind:x.cat===cat);if(c)return c;if(!s.next)break;await tap(s.next[0],s.next[1]);await W(600);s=await look()}
    return null;
  }

  /* ---------- level 1 ---------- */
  await p.evaluate(()=>window.ML.go('clothes'));
  let c0=await (async()=>{await p.waitForFunction(()=>window.ML.__cl().phase==='lobby',null,{timeout:12000});return cl()})();
  ok('가게에 공주 손님이 늘 있음 (왕관 말풍선)',c0.mateThemes.includes('palace'),c0.mateThemes.join(','));
  ok('1단계에서 공주 방에 들어감',await enter());
  let s=await look();
  ok('1) 받침대 6개 이상, 110px 이상, 그림',s.stands.length>=6&&s.stands.every(x=>x.rect&&Math.min(x.rect[2],x.rect[3])>=110&&x.svg),s.stands.map(x=>x.id+' '+Math.round(x.rect[2])+'×'+Math.round(x.rect[3])).join(', '));
  ok('들어가자마자 드레스 받침대가 열려 카드 3장',s.open==='dress'&&s.cards.length===3,s.open+' / '+s.cards.length);
  await checkText('room');await shot('pr_1_room');
  /* 1) + 2) every stand, every page */
  const seen={},cyc=[];
  for(const sd of s.stands){
    let t=await look();if(t.open!==sd.id){await tap(sd.rect[0],sd.rect[1]);await W(700);t=await look()}
    const pages=t.pages,p0=t.page;
    for(let k=0;k<pages;k++){t=await look();t.cards.forEach(x=>{if(x.kind==='item'){(seen[x.cat]=seen[x.cat]||new Set()).add(x.id)}});if(t.next){await tap(t.next[0],t.next[1]);await W(550)}}
    t=await look();cyc.push(`${sd.id}: ${pages}장(${t.page===p0?'처음으로 돌아옴':'안 돌아옴 '+t.page})`);if(pages>1&&t.page!==p0)cyc.push('X');
  }
  const cats=Object.keys(seen).filter(k=>seen[k].size>=6);
  ok('1) 1단계에 종류 7가지 이상 × 6가지 이상 (받침대와 화살표로 직접 봄)',cats.length>=7,Object.keys(seen).map(k=>k+' '+seen[k].size).join(', '));
  ok('2) 화살표로 다음 3장, 끝까지 가면 처음으로',!cyc.includes('X'),cyc.join(' / '));
  if(SHOT){const t=await look();const sd=t.stands.find(x=>x.id==='crown');await tap(sd.rect[0],sd.rect[1]);await W(800);await shot('pr_2_crowns')}
  /* 3) one of every category */
  const worn=[];
  for(const cat of Object.keys(seen)){if(cat==='gown')continue;const c=await findCard(cat);if(!c)continue;await tap(c.rect[0],c.rect[1]);await W(250);await idle();worn.push(cat)}
  {const c=await findCard('gown');await tap(c.rect[0],c.rect[1]);await W(250);await idle();worn.push('gown')}
  s=await look();
  ok('3) 종류마다 하나씩 입힘',worn.every(k=>s.wear[k]),worn.filter(k=>!s.wear[k]).join(',')||worn.join(','));
  ok('3) 입은 것이 모두 인형 위에 보임',worn.every(k=>s.onDoll[k]),'인형 위: '+Object.keys(s.onDoll).join(','));
  await checkText('dressed');await W(1600);await shot('pr_3_all_worn');
  const col0=s.wear.crown&&s.wear.crown.col;await tap(...s.catPts.crown);await W(700);s=await look();
  ok('3) 입은 왕관을 콕 → 색이 바뀜',s.wear.crown&&s.wear.crown.col!==col0,col0+' → '+(s.wear.crown&&s.wear.crown.col));
  await drag(s.catPts.hand,s.offPt,16);await W(900);s=await look();
  ok('3) 손에 든 것을 끌어서 빼면 벗겨짐',!s.wear.hand&&s.log.includes('poff:hand'),JSON.stringify(Object.keys(s.wear)));
  {const c=await findCard('hand');await drag([c.rect[0],c.rect[1]],s.catPts.gown);await W(250);await idle();s=await look()}
  ok('3) 카드를 인형에 끌어 놓아도 입힘',!!s.wear.hand,s.wear.hand&&s.wear.hand.id);
  /* 4) dye pots */
  {const c=await findCard('gown','dye');ok('4) 1단계 드레스 받침대에 물감 통 카드',!!c);if(c){await tap(c.rect[0],c.rect[1]);await W(900)}}
  s=await look();ok('4) 물감 통 작업대: 하얀 드레스 + 통 3개(110px 이상)',s.work&&s.work.kind==='dye'&&s.work.pots.length===3&&s.work.pots.every(q=>Math.min(q.rect[2],q.rect[3])>=110),JSON.stringify(s.work&&s.work.pots.map(q=>q.col)));
  await checkText('dye');await shot('pr_4_dye');
  const pot=s.work.pots[1];await drag([s.work.gown[0],s.work.gown[1]],[pot.rect[0],pot.rect[1]],16);await W(1500);await shot('pr_5_dipping');
  await p.waitForFunction(()=>{const s=window.ML.__clPrincess();return !s.work&&s.wear.gown&&s.wear.gown.id==='dye'&&!s.busy},null,{timeout:9000}).catch(()=>{});await W(600);s=await look();
  ok('4) 통에 담근 드레스가 그 색으로 바뀌어 입혀짐',s.wear.gown&&s.wear.gown.id==='dye'&&s.wear.gown.col===pot.col,JSON.stringify(s.wear.gown)+' 통 '+pot.col);
  await shot('pr_6_dyed');
  /* 5) the mirror: only the child ends it */
  await p.waitForFunction(()=>!!window.ML.__clPrincess().mirror,null,{timeout:9000}).catch(()=>{});await W(4000);s=await look();
  ok('5) 거울이 나와도 누르기 전에는 끝나지 않음 · 친구 공주 0명',s.phase==='pdress'&&!!s.mirror&&s.finale.friends===0,s.phase+' 친구 '+s.finale.friends);
  ok('2) 한 번에 보인 카드는 3장까지',maxCards<=3,'가장 많이 보인 수 '+maxCards);
  await tap(s.mirror[0],s.mirror[1]);await W(2600);s=await look();await shot('pr_7_ball_friends');await checkText('finale');
  ok('5) 거울을 누르면 무도회장 · 친구 공주 2명 · 색종이',s.finale.scene&&s.finale.friends===2&&s.finale.confetti>0,JSON.stringify(s.finale));
  await W(3400);await shot('pr_8_pose');
  await p.waitForFunction(()=>window.ML.__cl().view==='lobby',null,{timeout:12000});await W(2600);s=await look();
  ok('5) 포즈 3가지 · 사진첩',['pose:1','pose:2','pose:3'].every(x=>s.log.includes(x))&&s.album>=1,'사진첩 '+s.album);

  /* ---------- level 2: top + skirt on the dress form ---------- */
  await p.evaluate(()=>window.ML.__clLevel(2));await W(800);
  ok('2단계에서 공주 방',await enter());
  {const c=await findCard('gown','mix');ok('6) 2단계 드레스 받침대에 드레스 틀 카드',!!c);if(c){await tap(c.rect[0],c.rect[1]);await W(1200)}}
  s=await look();ok('6) 드레스 틀: 윗옷 카드 3장',s.work&&s.work.kind==='mix'&&s.work.step==='bodice'&&s.cards.length===3,JSON.stringify(s.work&&s.work.step)+' '+s.cards.map(x=>x.id).join(','));
  await checkText('mix');await shot('pr_9_mix_bodice');
  await tap(s.cards[0].rect[0],s.cards[0].rect[1]);await p.waitForFunction(()=>{const s=window.ML.__clPrincess();return s.work&&s.work.step==='skirt'&&s.cards.length===3},null,{timeout:6000}).catch(()=>{});await W(700);s=await look();
  ok('6) 윗옷이 틀에 붙고 치마 카드 3장',s.work&&!!s.work.b&&s.work.step==='skirt',JSON.stringify(s.work&&s.work.b));await shot('pr_10_mix_skirt');
  await drag([s.cards[1].rect[0],s.cards[1].rect[1]],[s.work.form[0],s.work.form[1]+s.work.form[3]*.15],16);
  await p.waitForFunction(()=>{const s=window.ML.__clPrincess();return !s.work&&s.wear.gown&&String(s.wear.gown.id).startsWith('mix:')&&!s.busy},null,{timeout:9000}).catch(()=>{});await W(700);s=await look();
  ok('6) 윗옷 + 치마를 맞춘 드레스를 인형이 입음',s.wear.gown&&/^mix:\w+:\w+$/.test(s.wear.gown.id)&&s.onDoll.gown,JSON.stringify(s.wear.gown));
  await W(1000);await shot('pr_11_mixed');

  /* ---------- level 3: sparkle pattern; level 4: family face ---------- */
  await p.evaluate(()=>window.ML.__clLevel(3));await W(800);await enter();
  {const c=await findCard('gown','mix');if(c){await tap(c.rect[0],c.rect[1]);await W(1200)}}
  for(const step of ['bodice','skirt','trim']){await p.waitForFunction(st=>{const s=window.ML.__clPrincess();return s.work&&s.work.step===st&&s.cards.length===3&&!s.busy},step,{timeout:6000}).catch(()=>{});await W(500);s=await look();if(s.cards[0])await tap(s.cards[0].rect[0],s.cards[0].rect[1]);await W(400)}
  await p.waitForFunction(()=>{const s=window.ML.__clPrincess();return !s.work&&s.wear.gown&&!s.busy},null,{timeout:9000}).catch(()=>{});await W(700);s=await look();
  ok('6) 3단계: 반짝이 무늬까지 붙은 드레스',s.wear.gown&&!!s.wear.gown.pat,JSON.stringify(s.wear.gown));await W(1200);await shot('pr_12_pattern');
  /* a family face (P4): a tiny drawn photo saved like the adult screen does */
  const saved=await p.evaluate(async()=>{const F=window.ML.Faces;if(!F)return false;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#F2C8A8';g.fillRect(0,0,64,64);g.fillStyle='#5B3A29';g.beginPath();g.arc(22,28,4,0,7);g.arc(42,28,4,0,7);g.fill();g.beginPath();g.arc(32,42,9,0,Math.PI);g.stroke();
    await F.ready;return await F.save({id:'mom',photo:c.toDataURL('image/png'),ko:'엄마',en:'Mom'})});
  await p.evaluate(()=>window.ML.__clLevel(4));await W(800);await enter();
  {const c=await findCard('hair','face');ok('6) 4단계: 머리 받침대에 가족 얼굴 카드',!saved||!!c,saved?'':'얼굴 저장 안 됨(건너뜀)');if(c){await tap(c.rect[0],c.rect[1]);await W(250);await idle()}}
  s=await look();if(saved)ok('6) 4단계: 가족 얼굴 공주 (인형 얼굴에 사진)',!!s.wear.face&&!!s.onDoll.face,JSON.stringify(s.wear.face));await W(1200);await shot('pr_13_face');

  ok('7) 글자 안내 · 글자 버튼 · 이모지 없음 · 누를 것 110px 이상',textBad.length===0,textBad.slice(0,2).join(' / '));
  const depth=await p.evaluate(()=>window.ML.__clDepth());
  console.log('깊이 표(공주 방): '+depth.map(d=>`${d.level}단계 받침대 ${d.princess.stands} · 종류 ${d.princess.categories} · 물건 ${d.princess.items} · 과정 ${d.princess.steps.join('·')}`).join(' / '));
  ok('깊이: 1단계부터 종류 7가지 이상, 물건 42개 이상',depth.every(d=>d.princess.categories>=7&&d.princess.items>=42),depth[0].princess.items+'개');
  ok('페이지 오류 없음',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
