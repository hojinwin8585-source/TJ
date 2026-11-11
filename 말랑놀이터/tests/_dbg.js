const {chromium}=require('playwright');const path=require('path');const URL='file://'+path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});await p.reload();await p.waitForTimeout(600);
await p.evaluate(()=>window.ML.go('pizza'));await p.waitForTimeout(3000);
await p.evaluate(()=>window.ML.go('home'));await p.waitForTimeout(300);
await p.evaluate(()=>window.ML.go('petsalon'));await p.waitForFunction(()=>window.ML.__ps().phase==='lobby',null,{timeout:8000});await p.waitForTimeout(800);
const box=await p.locator('.lb-cust').first().boundingBox();console.log(box);
await p.locator('.lb-cust').first().click();
for(let i=0;i<8;i++){await p.waitForTimeout(1000);const s=await p.evaluate(()=>{const s=window.ML.__ps();return s.view+' '+s.phase});console.log(s)}
await b.close()})();
