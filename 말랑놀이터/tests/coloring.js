/* P5-가 색칠 놀이 완료 기준 검사: node tests/coloring.js   (SHOT_DIR=폴더 를 주면 캡처를 저장)
   1) 진짜 터치 이벤트(CDP)만으로 1단계 완주: 물감 카드 콕 → 반짝이는 칸 콕 → 부드럽게 채워짐 → 그림 콕 → 그림이 움직이고 별 1칸
   2) 물감을 고르기 전에 칸을 눌러도 칠해지지 않음 · 칸 밖을 누르면 응원만(칠해지지 않음) · 칸 바로 옆을 눌러도 그 칸으로 인정
   3) 누른 칸만 그 색이 됨(다른 칸은 그대로) · 칠한 칸은 또렷한 색(vivid), 카드는 차분한 색(hex)
   4) 3단계: 쓱쓱 문질러도 칸이 채워짐(makeRub) · 4단계: 칸 8개, 물감 카드는 한 번에 3장까지(칠할 때마다 다음 3장), 무늬 도장, 액자로 끝내기
   5) 같은 단계를 3번 끝내면 별 3칸 → 다음 단계의 새 그림이 나오는 순간 · 어른 설정 '놀이별 단계'에 보임 · 꾸미기 살롱에 타일
   6) 빈 화면 없음(그림이 무대 높이 45% 이상, 무대의 85% 이상이 그림·토토·물통) · 누르는 곳 110px 이상 · 글자·이모지 없음 · 공통 틀 · 페이지 오류 0 */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SHOT=process.env.SHOT_DIR||'';
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});await p.reload();await p.waitForTimeout(500);
  const W=ms=>p.waitForTimeout(ms);
  const shot=async n=>{if(SHOT)await p.screenshot({path:path.join(SHOT,n+'.png')})};
  const cdp=await ctx.newCDPSession(p);
  const tStart=async(x,y)=>cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  const tMove=async(x,y)=>cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
  const tEnd=async()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const tap=async(x,y)=>{await tStart(x,y);await W(60);await tEnd()};
  const C=()=>p.evaluate(()=>window.ML.__co());
  const enter=async(lv,pic)=>{await p.evaluate(([l,k])=>{window.ML.go('home');window.ML.__coLevel(l);if(k)window.ML.__coPic(k);window.ML.go('coloring')},[lv,pic||'']);await W(900);await ready()};
  const ready=()=>p.waitForFunction(()=>{const s=window.ML.__co();return s.phase==='pick'&&s.regions&&s.regions.every(r=>r.pre||!r.done)&&!s.moment},null,{timeout:15000});
  const waitPhase=(ph,ms)=>p.waitForFunction(ph=>{const s=window.ML.__co();return ph.includes(s.phase)},ph,{timeout:ms||8000});
  /* one region: tap a card (the k-th), then tap the region (its inside point) */
  const paintOne=async(i,k)=>{let s=await C();const c=s.cards[(k||0)%s.cards.length];await tap(c.x,c.y);await W(300);s=await C();
    const r=s.regions[i];await tap(r.x,r.y);await W(1650);return{s:await C(),card:c}};
  const finishByPicture=async()=>{await waitPhase(['show']);const s=await C();await tap(s.pic.x,s.pic.y);await W(500);return await C()};
  const roundTaps=async()=>{let s=await C();for(let g=0;g<12;g++){s=await C();if(s.phase!=='pick')break;const i=s.regions.findIndex(r=>!r.done);await paintOne(i,g)}
    await waitPhase(['show','stamp']);s=await C();if(s.phase==='stamp'){await tap(s.finish.x,s.finish.y);await W(500)}else await finishByPicture();return await C()};

  /* ---- the screen: shared look ---- */
  const look=async name=>{
    const r=await p.evaluate(()=>{const sec=document.getElementById('coloring'),vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
      const txt=(sec.innerText||'').replace(/\s+/g,'');const EMO=/\p{Extended_Pictographic}/u;
      const hd=sec.querySelector(':scope > .sh-head'),bk=sec.querySelector('.sh-back'),stage=sec.querySelector('.sh-stage'),tray=sec.querySelector('.sh-tray');
      const sr=stage.getBoundingClientRect(),tr=tray.getBoundingClientRect();
      const press=[...sec.querySelectorAll('button,[role="button"]')].filter(e=>vis(e)&&!e.closest('.sh-head')).map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
      const svgBtn=[...sec.querySelectorAll('button')].filter(vis).every(e=>{const s=e.querySelector('svg');return s&&s.getBoundingClientRect().width>=e.getBoundingClientRect().width*.5&&!(e.textContent||'').trim()});
      return{txt,emo:EMO.test(sec.textContent||''),shell:!!window.ML.Shell.has('coloring'),head:hd&&Math.round(hd.getBoundingClientRect().height),back:bk&&Math.round(bk.getBoundingClientRect().width),
        stage:sr.height,tray:tr.height,trayKids:[...tray.children].filter(vis).length,trayBottom:tr.bottom,press,svgBtn,
        cards:[...tray.querySelectorAll('.sh-card')].filter(vis).length,hscroll:tray.scrollWidth>tray.clientWidth+2||document.documentElement.scrollWidth>innerWidth+1,
        hints:[...sec.querySelectorAll('.hint,.khint,p')].filter(vis).length}});
    ok(`${name}: 공통 틀(ML.Shell) · 머리줄 72px · 뒤로 가기 64px 이상 · 글자 안내 줄 0`,r.shell&&r.head===72&&r.back>=64&&!r.hints,`머리줄 ${r.head} 뒤로 ${r.back}`);
    ok(`${name}: 화면에 글자·이모지 없음 · 버튼은 모두 그림(글자 없음)`,r.txt===''&&!r.emo&&r.svgBtn,JSON.stringify(r.txt.slice(0,20)));
    ok(`${name}: 아래 칸이 비지 않음 · 맨 아래 · 가로로 밀리지 않음`,r.trayKids>0&&r.trayBottom>=780-24&&!r.hscroll,`칸 ${Math.round(r.tray)}px, 안의 것 ${r.trayKids}개`);
    ok(`${name}: 누를 것 110px 이상 · 물감 카드 3장 이하`,r.press.every(x=>x>=110)&&r.cards<=3&&r.press.length<=3,`누를 것 ${JSON.stringify(r.press)} · 카드 ${r.cards}`);
    return r;
  };
  const space=async name=>{const s=await C();
    const cov=await p.evaluate(()=>{const st=document.querySelector('#coloring .sh-stage').getBoundingClientRect(),rs=['.co-paper','.co-toto','.co-jar'].map(q=>document.querySelector('#coloring '+q).getBoundingClientRect());
      let n=0,inn=0;for(let a=0;a<30;a++)for(let b=0;b<30;b++){const x=st.left+st.width*(a+.5)/30,y=st.top+st.height*(b+.5)/30;n++;if(rs.some(r=>x>=r.left-6&&x<=r.right+6&&y>=r.top-6&&y<=r.bottom+6))inn++}return inn/n});
    ok(`${name}: 그림이 무대 높이의 45% 이상 · 무대의 85% 이상이 그림·토토·물통(빈 곳 15% 이하)`,s.pic.height/s.stage.height>=.45&&cov>=.85,`그림 ${(s.pic.height/s.stage.height*100).toFixed(0)}% · 채움 ${(cov*100).toFixed(0)}%`);
  };

  /* ================= 1단계 ================= */
  await enter(1,'apple');let s=await C();
  await look('색칠 1단계');await space('색칠 1단계');await shot('co_L1_start');
  ok('1단계: 칸 1개 · 물감 카드 2장 · 반짝이는 칸 하나',s.regions.length===1&&s.cards.length===2&&s.regions.filter(r=>r.next).length===1,`칸 ${s.regions.length} 카드 ${s.cards.length}`);
  ok('1단계: 칸은 크게(가장 작은 쪽 110px 이상)',s.regions.every(r=>Math.min(r.w,r.h)>=110),s.regions.map(r=>Math.round(Math.min(r.w,r.h))).join(','));
  /* 물감 고르기 전에 칸을 누름 → 칠해지지 않음 */
  await tap(s.regions[0].x,s.regions[0].y);await W(400);s=await C();
  ok('물감을 고르기 전에 칸을 눌러도 칠해지지 않음(카드를 고르라고 알려 줌)',s.phase==='pick'&&!s.regions[0].done);
  /* 카드 콕 → 색 이름 · 고른 카드가 떠오름 */
  let c0=s.cards[0];await tap(c0.x,c0.y);await W(350);s=await C();
  ok('물감 카드 콕 → 그 색을 고름(카드가 떠오름) · 칠할 차례',s.phase==='paint'&&s.sel===s.colors[0]&&s.cards[0].sel,`고른 색 ${s.sel}`);
  const vividOf=await p.evaluate(()=>{const o={};window.MLCFG.calm.choiceColors.forEach(c=>o[c.en]={hex:c.hex.slice(1).toLowerCase(),vivid:c.vivid.slice(1).toLowerCase()});return o});
  const calmCard=await p.evaluate(v=>{const h=document.querySelector('#coloring .sh-tray').innerHTML.toLowerCase();return h.includes('vb'+v.hex)&&!h.includes('vb'+v.vivid)},vividOf[s.sel]);
  ok('물감 카드는 차분한 색(calm.colorPolicy.choosing = hex)',calmCard);
  await shot('co_L1_picked');
  /* 칸 밖을 누름 → 응원만 */
  const outX=s.stage.left+s.stage.width*.52,outY=s.stage.top+s.stage.height-26;
  await tap(outX,outY);await W(400);s=await C();
  ok('칸 밖(무대 아래쪽 바닥)을 누르면 응원만 · 칠해지지 않음 · 고른 색은 그대로',!s.regions[0].done&&s.phase==='paint'&&s.log.includes('cheer')&&s.sel,`log ${s.log.slice(-2).join(',')}`);
  /* 칸 바로 옆(칸 밖 12px)을 누름 → 그 칸으로 인정 */
  const rr0=await p.evaluate(()=>{const b=document.querySelector('#coloring .co-reg .co-base').getBoundingClientRect();return{l:b.left,t:b.top,w:b.width,h:b.height}});
  const besideX=rr0.l-12,besideY=rr0.t+rr0.h*.55;
  const inside=await p.evaluate(([x,y])=>{const e=document.querySelector('#coloring .co-reg .co-base'),m=e.getScreenCTM().inverse(),sv=e.ownerSVGElement.createSVGPoint();sv.x=x;sv.y=y;return e.isPointInFill(sv.matrixTransform(m))},[besideX,besideY]);
  await tap(besideX,besideY);await W(300);s=await C();
  ok('칸 바로 옆(칸 밖 12px)을 눌러도 그 칸으로 인정(넉넉한 칸)',!inside&&s.regions[0].done,`누른 곳이 칸 안? ${inside}`);
  await shot('co_L1_filling');
  await W(1400);s=await C();
  const v0=vividOf[s.regions[0].color];
  ok('칠한 칸은 또렷한 색(vivid)으로 피어남(calm.colorPolicy.result)',s.regions[0].fill.includes(v0.vivid),`칸 ${s.regions[0].fill} · ${s.regions[0].color}`);
  await waitPhase(['show']).catch(()=>{});s=await C();
  ok('다 칠하면 그림을 콕 할 차례(그림이 반짝 · 오른쪽 아래 액자 그림)',s.phase==='show'&&!!s.finish,`phase ${s.phase}`);
  await shot('co_L1_show');
  await tap(s.pic.x,s.pic.y);await W(700);s=await C();
  ok('그림을 콕 → 그림이 움직이고 조용한 축하 · 한 판 끝(별 1칸)',s.phase==='done'&&s.log.includes('win')&&await p.evaluate(()=>/co-fin-/.test(document.querySelector('#coloring .co-pic').getAttribute('class'))),`별 ${s.starsOn}/${s.starsN}`);
  await W(800);await shot('co_L1_done');s=await C();
  ok('한 판 끝나면 별 3칸 중 1칸',s.starsOn===1&&s.starsN===3,`별 ${s.starsOn}/${s.starsN}`);
  /* 2·3번째 판 (터치만): 풍선도 나옴 → level-up */
  await ready();s=await C();const pic2=s.key;
  ok('1단계 그림은 사과·풍선을 번갈아(같은 그림이 연달아 나오지 않음)',pic2!=='apple'&&['apple','balloon'].includes(pic2),pic2);
  await shot('co_L1_'+pic2);
  await roundTaps();await W(300);
  await ready();await roundTaps();
  let moment=false;for(let i=0;i<40&&!moment;i++){await W(250);moment=(await C()).moment}
  ok('같은 단계 3번 → 새 그림이 나오는 순간(level-up)',moment);await shot('co_levelup');
  await ready();s=await C();
  ok('3번 뒤 2단계 · 별 줄이 다시 비어 시작 · 칸 3개 · 카드 3장',s.progress.level===2&&s.starsOn===0&&s.regions.length===3&&s.cards.length===3,JSON.stringify(s.progress)+' 칸 '+s.regions.length);

  /* ================= 2단계: 누른 칸만 ================= */
  await enter(2,'fish');s=await C();await look('색칠 2단계');await space('색칠 2단계');await shot('co_L2_fish_start');
  const notNext=s.regions.findIndex(r=>!r.next);
  let c1=s.cards[1];await tap(c1.x,c1.y);await W(300);s=await C();
  await tap(s.regions[notNext].x,s.regions[notNext].y);await W(1700);s=await C();
  ok('누른 칸만 그 색이 됨(반짝이지 않던 칸을 눌러도 그 칸) · 다른 칸은 그대로',s.regions[notNext].done&&s.regions.filter(r=>r.done).length===1&&s.regions[notNext].color===s.colors[1],
    s.regions.map(r=>r.done?r.color:'-').join(','));
  ok('칠한 뒤 다시 "무슨 색?" · 반짝이는 칸은 아직 안 칠한 칸',s.phase==='pick'&&s.regions.filter(r=>r.next).every(r=>!r.done),`phase ${s.phase}`);
  await shot('co_L2_fish_one');
  for(const k of ['flower','house']){await enter(2,k);await shot('co_L2_'+k+'_start');s=await roundTaps();await W(900);await shot('co_L2_'+k+'_done')}

  /* ================= 3단계: 쓱쓱 ================= */
  await enter(3,'butterfly');s=await C();await look('색칠 3단계');await space('색칠 3단계');await shot('co_L3_start');
  ok('3단계: 칸 5개 · 색 5개 · 쓱쓱 가능 · 카드 3장',s.regions.length===5&&s.colors.length===5&&s.rub&&s.cards.length===3,`칸 ${s.regions.length} 색 ${s.colors.length}`);
  const set1=s.cards.map(c=>c.ko).join(',');
  let ck=s.cards[0];await tap(ck.x,ck.y);await W(300);s=await C();
  const ri=s.regions.findIndex(r=>!r.done),r3=s.regions[ri];
  await tStart(r3.x,r3.y);let midDabs=0,rubDone=false;
  for(let k=0;k<200&&!rubDone;k++){const a=k*.7;await tMove(r3.x+Math.cos(a)*16,r3.y+Math.sin(a)*12);await W(30);
    if(k===10){const t=await C();midDabs=t.regions[ri].dabs;await shot('co_L3_rubbing')}
    if(k%10===9)rubDone=(await C()).regions[ri].done}
  await tEnd();await W(1500);s=await C();
  ok('3단계: 쓱쓱 문지르면 물감 자국이 남고 칸이 다 채워짐(makeRub)',midDabs>0&&s.regions[ri].done&&s.log.some(x=>x==='rub:'+ri),`자국 ${midDabs} · log ${s.log.filter(x=>/rub|tapfill/.test(x)).join(',')}`);
  ok('물감이 3개보다 많으면 칠한 뒤 다음 3장으로 바뀜(가로로 밀지 않음)',s.cards.length===3&&s.cards.map(c=>c.ko).join(',')!==set1,`${set1} → ${s.cards.map(c=>c.ko).join(',')}`);
  /* 콕도 됨 */
  const ri2=s.regions.findIndex(r=>!r.done);await paintOne(ri2,1);s=await C();
  ok('3단계: 콕만 해도 칸이 채워짐',s.regions[ri2].done&&s.log.includes('tapfill:'+ri2));
  s=await roundTaps();await W(900);await shot('co_L3_butterfly_done');
  for(const k of ['car','cake']){await enter(3,k);await shot('co_L3_'+k+'_start');await roundTaps();await W(1200);await shot('co_L3_'+k+'_done')}

  /* ================= 4단계: 칸 8개 · 도장 · 액자 ================= */
  await enter(4,'dress');s=await C();await look('색칠 4단계');await space('색칠 4단계');await shot('co_L4_dress_start');
  ok('4단계: 칸 8개 · 색 8개 · 물감 카드는 3장만 보임',s.regions.length===8&&s.colors.length===8&&s.cards.length===3,`칸 ${s.regions.length} 색 ${s.colors.length} 카드 ${s.cards.length}`);
  const small=async k=>{const t=await C();ok(`4단계 ${k}: 작은 칸도 손가락 크기 이상(가장 작은 쪽 40px 이상, 둘레도 인정)`,t.regions.every(r=>Math.min(r.w,r.h)>=40),t.regions.map(r=>Math.round(Math.min(r.w,r.h))).join(','))};
  await small('dress');
  const seen=new Set();
  for(let g=0;g<12;g++){s=await C();if(s.phase!=='pick')break;s.cards.forEach(c=>seen.add(c.ko));const i=s.regions.findIndex(r=>!r.done);await paintOne(i,g);if(g===3)await shot('co_L4_dress_mid')}
  ok('4단계: 칠하는 동안 8가지 색이 모두 차례로 카드에 나옴',seen.size===8,[...seen].join(','));
  await waitPhase(['stamp']);s=await C();
  ok('4단계: 다 칠하면 무늬 도장 2장 + 오른쪽 아래 액자(누를 것 3개)',s.phase==='stamp'&&s.cards.length===2&&!!s.finish,`도장 ${s.cards.length}`);
  await look('색칠 4단계(도장)');await shot('co_L4_stamp');
  await tap(s.pic.x,s.pic.y);await W(300);s=await C();
  ok('도장을 고르기 전에 그림을 눌러도 아무것도 찍히지 않음',s.nStamp===0);
  await tap(s.cards[0].x,s.cards[0].y);await W(300);s=await C();
  for(const i of [6,5,0]){const r=s.regions[i];await tap(r.x,r.y);await W(350)}
  s=await C();
  ok('도장 콕 → 그림에 무늬가 찍힘(칸 안에만)',s.nStamp===3&&s.regions.reduce((a,r)=>a+r.stamps,0)===3,`도장 ${s.nStamp}`);
  await shot('co_L4_stamped');
  await tap(s.finish.x,s.finish.y);await W(700);s=await C();
  ok('액자 그림 콕 → 아이가 끝냄 · 그림이 움직임 · 별',s.phase==='done'&&s.log.includes('win'),`별 ${s.starsOn}`);
  await W(900);await shot('co_L4_dress_done');
  await enter(4,'bear');await small('bear');await shot('co_L4_bear_start');s=await roundTaps();await W(1000);await shot('co_L4_bear_done');
  /* 가족 얼굴이 없으면 '우리 가족' 그림은 나오지 않음 */
  await enter(4,'family');s=await C();
  ok("가족 얼굴이 없으면 '우리 가족' 그림 대신 다른 그림(ML.Faces 확인)",!s.faces&&s.key!=='family',`그림 ${s.key} · 얼굴 ${s.faces}`);

  /* ---- 가족 얼굴이 있으면 (그린 얼굴 사진으로 흉내) ---- */
  const famOK=await p.evaluate(async()=>{const F=window.ML.Faces;if(!F||!F.save)return 'no Faces';
    const cv=document.createElement('canvas');cv.width=cv.height=96;const g=cv.getContext('2d');g.fillStyle='#F6D5BE';g.fillRect(0,0,96,96);g.fillStyle='#5B3A29';g.beginPath();g.arc(34,44,6,0,7);g.arc(62,44,6,0,7);g.fill();g.fillRect(34,64,28,5);
    try{await F.save({id:'mom',photo:cv.toDataURL()});await F.save({id:'dad',photo:cv.toDataURL()})}catch(e){return 'save '+e.message}return F.list().length});
  if(typeof famOK==='number'&&famOK>0){await enter(4,'family');s=await C();
    ok("가족 얼굴이 있으면 4단계에 '우리 가족' 그림(칸 8개)",s.key==='family'&&s.regions.length===8,`그림 ${s.key} 칸 ${s.regions.length}`);
    await small('family');
    await shot('co_L4_family_start');s=await roundTaps();await W(1000);await shot('co_L4_family_done');
    await p.evaluate(async()=>{try{await window.ML.Faces.__wipe()}catch(e){}});
  }else console.log('참고 | 가족 얼굴 저장 불가로 우리 가족 그림 검사는 건너뜀: '+famOK);

  /* ---- 꾸미기 살롱 타일 · 어른 설정 · 깊이 훅 ---- */
  const tile=await p.evaluate(()=>{const t=document.querySelector('#zone-salon .tile[data-go="coloring"]');return t?{svg:!!t.querySelector('.ic svg'),emo:/\p{Extended_Pictographic}/u.test(t.querySelector('.ic').textContent||'')}:null});
  ok('꾸미기 살롱에 색칠 놀이 타일(그린 그림, 이모지 없음)',!!tile&&tile.svg&&!tile.emo,JSON.stringify(tile));
  await p.evaluate(()=>window.ML.go('zone-salon'));await W(600);
  await p.evaluate(()=>{const t=document.querySelector('#zone-salon .tile[data-go="coloring"]');if(t.hidden){const a=document.querySelector('#zone-salon .sh-pagearrow');for(let i=0;i<3&&t.hidden;i++)a.click()}});await W(300);
  const tr=await p.evaluate(()=>{const r=document.querySelector('#zone-salon .tile[data-go="coloring"]').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}});
  await shot('co_salon');await tap(tr.x,tr.y);await W(1000);
  const where=await p.evaluate(()=>window.ML.current());
  ok('살롱 타일을 콕 → 색칠 놀이가 열림 · 뒤로 가면 살롱',where==='coloring'&&await p.evaluate(()=>document.querySelector('#coloring .sh-back').dataset.go)==='zone-salon',where);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('#progressRows .seg[data-game]')].map(x=>x.dataset.game));
  ok("어른 설정 '놀이별 단계'에 색칠 놀이가 보임",rows.includes('coloring'),rows.join(','));
  const dep=await p.evaluate(()=>window.ML.__coDepth());
  ok('깊이 훅: 단계 4개 · 과정 4개 이상 · 고르기·손님·끝내기 · 3단계부터 쓱쓱',dep.length===4&&dep.every(d=>d.processes>=4&&d.choice&&d.someone&&d.ending)&&dep[2].hands.includes('rub'),dep.map(d=>d.processes+':'+d.hands.join('+')).join(' / '));
  await p.evaluate(()=>window.ML.go('home'));await W(300);
  ok('페이지 오류 0',errs.length===0,errs.slice(0,3).join(' / '));
  console.log(fails?`\n실패 ${fails}건`:'\n모두 통과');
  await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error('실패',e);process.exit(1)});
