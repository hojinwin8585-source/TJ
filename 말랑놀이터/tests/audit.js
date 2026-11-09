/* 버튼 크기·개수 검사: node tests/audit.js
   기준(만 2세): 누를 것은 110px 이상, 한 화면 선택지 3개 이하.
   왼쪽 위 집 버튼 같은 구석 버튼(.bar 안)은 세지 않습니다. */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
const SCREENS=['home','zone-cook','pizza','bread','cake','dishes','chores','routine','dressup','makeup','nails','jobdress','jobmatch','dispatch','animals','ice','jelly','shapes','words','map'];
const MIN=110,MAXN=3;
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});
  await p.reload();await p.waitForTimeout(500);
  let bad=0;console.log('화면 | 누를 것 | 가장 작은 것(px) | '+MIN+'px 미만 | 판정');
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
    const ok=r.small===0&&r.n<=MAXN;if(!ok)bad++;
    console.log([g,r.n,r.min,r.small,ok?'통과':'고칠 것'].join(' | '));
  }
  console.log(bad?'\n고칠 화면 '+bad+'개':'\n모든 화면 통과');
  await b.close();
})();
