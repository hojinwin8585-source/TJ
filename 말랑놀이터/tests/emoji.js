/* 이모지 조사표 (P16): node tests/emoji.js
   아이 화면마다 보이는 글자 속 이모지를 세어 표로 보여 줍니다(rules.noEmojiArt).
   칸: 머리줄(공통 틀의 머리줄) · 타일(장소 화면의 놀이 타일) · 놀이 안(그 밖의 화면 내용) · 시작 카드(종류 고르기 카드).
   P16에서 바꾸는 것은 머리줄·장소 화면·타일이라 이 셋에 이모지가 하나라도 있으면 실패. 놀이 안의 이모지는 그 놀이를 고치는 단계에서 고치므로 목록만 보여 줍니다. */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:780},hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));localStorage.setItem('mallang_cast',JSON.stringify({hero:{setup:true}}))});await p.reload();await p.waitForTimeout(700);
  const W=ms=>p.waitForTimeout(ms);
  const ids=await p.evaluate(()=>{const ret=(window.ML.Shell&&window.ML.Shell.retired)||{};return[...document.querySelectorAll('#app > .screen')].map(s=>s.id).filter(id=>!ret[id])});
  const count=id=>p.evaluate(id=>{
    const scr=document.getElementById(id);const out={head:[],tile:[],start:[],body:[]};if(!scr||scr.hidden)return null;
    const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight)return false;
      for(let x=e;x&&x!==document.body;x=x.parentElement){if(x.hidden)return false;const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return false}return true};
    const RE=/\p{Extended_Pictographic}/gu;
    const tw=document.createTreeWalker(scr,NodeFilter.SHOW_TEXT);let n;
    while((n=tw.nextNode())){const t=n.textContent;const m=t.match(RE);if(!m)continue;const el=n.parentElement;if(!el||!vis(el))continue;
      const k=el.closest('.sh-head,.bar')?'head':el.closest('.sh-start')?'start':el.closest('.tile')?'tile':'body';
      m.forEach(ch=>out[k].push(ch))}
    return out},id);
  const rows=[];let bad=0;
  for(const id of ['home'].concat(ids.filter(x=>x!=='home'))){
    await p.evaluate(()=>{document.querySelectorAll('.modal').forEach(m=>{m.hidden=true})});
    await p.evaluate(id=>window.ML.go(id),id);await W(id==='pizza'?5200:1700);
    const c=await count(id);if(!c){rows.push([id,'-','-','-','-','-','(열리지 않음)']);continue}
    const tot=c.head.length+c.tile.length+c.start.length+c.body.length;
    if(c.head.length||c.tile.length||c.start.length)bad++;
    const ex=[...new Set(c.head.concat(c.tile,c.start,c.body))].slice(0,8).join(' ');
    rows.push([id,c.head.length,c.tile.length,c.start.length,c.body.length,tot,ex]);
  }
  const kind=id=>/^zone-/.test(id)?'장소':id==='home'?'홈':'놀이';
  console.log('=== 이모지 조사표 (아이 화면에 보이는 이모지 수) ===');
  console.log('화면 | 종류 | 머리줄 | 타일 | 시작 카드 | 놀이 안 | 합계 | 보이는 이모지');
  rows.forEach(r=>console.log([r[0],kind(r[0])].concat(r.slice(1)).join(' | ')));
  const sum=k=>rows.reduce((a,r)=>a+(+r[k]||0),0);
  console.log(`합계 | | ${sum(1)} | ${sum(2)} | ${sum(3)} | ${sum(4)} | ${sum(5)} |`);
  console.log(`이모지 0개인 화면: ${rows.filter(r=>r[5]===0).length} / ${rows.length}`);
  console.log('\n페이지 오류:',errs.length?JSON.stringify(errs.slice(0,5)):'없음');
  console.log(bad?`\n머리줄·타일·시작 카드에 이모지가 남은 화면 ${bad}개`:'\n머리줄·장소 타일·시작 카드의 이모지 0개 (놀이 안의 이모지는 그 놀이를 고치는 단계에서)');
  await b.close();process.exit(bad||errs.length?1:0);
})().catch(e=>{console.error('실패',e.message.split('\n')[0]);process.exit(1)});
