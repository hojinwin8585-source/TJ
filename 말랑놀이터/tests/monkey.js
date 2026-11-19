/* 무작위 터치 오류 검사: node tests/monkey.js
   모든 화면에서 아무 데나 누르고 끌고 버튼을 눌러서, 오류가 0건인지와 마지막에 홈으로 돌아오는지 봅니다. */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto(URL);await p.waitForTimeout(500);
  await p.evaluate(()=>{localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true,name:'하은'}}));localStorage.setItem('mallang_settings',JSON.stringify({timer:0}))});
  await p.reload();await p.waitForTimeout(400);
  const games=await p.$$eval('[data-go]',a=>[...new Set(a.map(x=>x.dataset.go))].filter(g=>g!=='home'));
  let actions=0;const R=n=>Math.floor(Math.random()*n);
  for(let round=0;round<3;round++)for(const g of games){
    await p.evaluate(g=>window.ML.go(g),g);await p.waitForTimeout(550);
    const N=60+R(40);
    for(let i=0;i<N;i++){
      const x=10+R(370),y=80+R(690),k=R(10);
      if(k<5)await p.mouse.click(x,y);
      else if(k<8){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(10+R(370),80+R(690),{steps:4});await p.mouse.up()}
      else{const btns=await p.$$('.screen:not([hidden]) button:not([data-go])');if(btns.length){try{await btns[R(btns.length)].click({force:true,timeout:500})}catch(e){}}}
      actions++;if(i%15===0)await p.waitForTimeout(60);
    }
    await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>{m.hidden=true});window.ML.go('home')});await p.waitForTimeout(600);
    const vis=await p.$$eval('.screen:not([hidden])',a=>a.map(x=>x.id));if(vis.length!==1)errs.push('screens visible: '+vis.join(','));
  }
  for(let i=0;i<60;i++){const g=games[R(games.length)];await p.evaluate(g=>window.ML.go(g),g);await p.waitForTimeout(30+R(60))}
  await p.evaluate(()=>window.ML.go('home'));await p.waitForTimeout(3500);
  const vis=await p.$$eval('.screen:not([hidden])',a=>a.map(x=>x.id));
  console.log('터치',actions,'번 · 마지막 화면',vis.join(','),'· 오류',errs.length,'건');
  console.log([...new Set(errs)].slice(0,15).join('\n'));
  await b.close();process.exit(errs.length?1:0);
})();
