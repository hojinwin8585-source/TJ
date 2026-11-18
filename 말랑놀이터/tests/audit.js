/* 버튼 크기·개수 검사: node tests/audit.js
   기준(만 2세): 누를 것은 110px 이상, 한 화면 선택지 3개 이하.
   왼쪽 위 집 버튼 같은 구석 버튼(.bar 안)은 세지 않습니다.
   P9: 홈은 config 의 한 화면 배치(시작 버튼 1 + 둥근 문 home.portals + 가운데 집 1)까지, 문 안(zone-*)은 타일 4개(home.inside) + 다음 장 화살표 1,
   내 방은 그림 카드 3장(화살표 포함) + 당근 바구니 + 선물 상자까지 셉니다. */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SCREENS=['home','zone-cook','zone-salon','zone-school','zone-music','zone-myroom','petsalon','nailshop','pizza','bread','cake','dishes','chores','routine','dressup','makeup','nails','jobdress','jobmatch','dispatch','animals','ice','jelly','shapes','words','map','xmashouse'];
const MIN=110,MAXN=3;
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});
  await p.reload();await p.waitForTimeout(500);
  const LIM=await p.evaluate(()=>{const H=window.MLCFG.home||{},sz=(window.ML.Shell||{}).sizes||{};return{home:1+(H.portals||[]).length+1,place:(sz.perPage||4)+1,room:(sz.maxCards||3)+2}});
  const maxOf=g=>g==='home'?LIM.home:g==='zone-myroom'?LIM.room:/^zone-/.test(g)?LIM.place:MAXN;
  let bad=0,p9bad=0;console.log('화면 | 누를 것 | 가장 작은 것(px) | '+MIN+'px 미만 | 판정');
  for(const g of SCREENS){
    await p.evaluate(g=>window.ML.go(g),g);await p.waitForTimeout(g==='pizza'?5200:2600);
    const r=await p.evaluate(MIN=>{
      const scr=document.querySelector('.screen:not([hidden])');
      const els=[...scr.querySelectorAll('button,.dragi,.nail,.prop,.facebtn,.key,.swatch,.piece')].filter(e=>{
        const r=e.getBoundingClientRect();
        return r.width>0&&r.height>0&&r.top<780&&r.bottom>0&&getComputedStyle(e).pointerEvents!=='none'&&!e.closest('[hidden]')&&!e.closest('.bar')&&!e.closest('.home-top');
      });
      const s=els.map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))});
      return{n:s.length,min:s.length?Math.min(...s):0,small:s.filter(x=>x<MIN).length};
    },MIN);
    const ok=r.small===0&&r.n<=maxOf(g);if(!ok){bad++;if(g==='home'||/^zone-/.test(g))p9bad++}
    console.log([g,r.n,r.min,r.small,ok?'통과':'고칠 것'].join(' | '));
  }
  console.log(`\n홈과 문 안 화면(P9): ${p9bad?'고칠 것 '+p9bad+'개':'모두 통과'} (홈 ${LIM.home}개까지 · 문 안 ${LIM.place}개까지 · 내 방 ${LIM.room}개까지)`);
  console.log(bad?'고칠 화면 '+bad+'개':'모든 화면 통과');
  await b.close();
})();
