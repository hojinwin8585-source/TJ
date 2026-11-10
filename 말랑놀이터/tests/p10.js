/* P10 완료 기준 검사: node tests/p10.js
   1) 가짜 목소리 목록에서 한국어 Yuna (Enhanced), 영어 Ava (Premium) 이 골라짐
   2) 어른 설정에서 다른 목소리를 고르면 다음 말부터 그 목소리, 다시 열어도 유지
   3) 가짜 녹음을 '예쁘다!'에 저장 → 칭찬 때 녹음 재생(한국어 기기 목소리 없음), '영어도 함께'를 끄면 녹음 뒤 영어 기기 목소리
   (4) tests/p1.js, tests/salon.js, tests/monkey.js 는 따로 돌립니다) */
const {chromium}=require('playwright');
const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');
let fails=0;
const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'통과':'실패')+' | '+name+(info?' | '+info:''))};

const STUB=()=>{
  const V=[['Yuna (Compact)','ko-KR'],['Yuna (Enhanced)','ko-KR'],['Google 한국의','ko-KR'],['Grandpa (Korean)','ko-KR'],
    ['Samantha','en-US'],['Ava (Premium)','en-US'],['eSpeak English','en-GB']]
    .map(([name,lang])=>({name,lang,voiceURI:name,localService:true,default:false}));
  window.__spoken=[];
  const fake={getVoices:()=>V,speaking:false,paused:false,
    speak(u){window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice&&u.voice.name,rate:u.rate,pitch:u.pitch});setTimeout(()=>u.onend&&u.onend({}),30)},
    cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};
  Object.defineProperty(window,'speechSynthesis',{value:fake,configurable:true});
  window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  /* 짧은 소리 파일 (0.3초 사인파 wav) */
  const wav=()=>{const sr=8000,n=2400,b=new ArrayBuffer(44+n*2),d=new DataView(b);
    const w=(o,s)=>[...s].forEach((c,i)=>d.setUint8(o+i,c.charCodeAt(0)));
    w(0,'RIFF');d.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);
    d.setUint32(24,sr,true);d.setUint32(28,sr*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,'data');d.setUint32(40,n*2,true);
    for(let i=0;i<n;i++)d.setInt16(44+i*2,Math.sin(i/8)*3000,true);
    return new Blob([b],{type:'audio/wav'})};
  window.MediaRecorder=class{constructor(){this.state='inactive';this.mimeType='audio/wav'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.ondataavailable&&this.ondataavailable({data:wav()});this.onstop&&this.onstop()}};
  const tr={stop(){}};
  navigator.mediaDevices.getUserMedia=async()=>({active:true,getTracks:()=>[tr]});
};

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true});
  await ctx.addInitScript(STUB);
  const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('mallang_settings',JSON.stringify({timer:0}));
    return new Promise(r=>{const q=indexedDB.deleteDatabase('mallang_voice_rec');q.onsuccess=q.onerror=q.onblocked=()=>r()})});
  await p.reload();await p.waitForTimeout(400);
  const W=ms=>p.waitForTimeout(ms);
  const openSettings=()=>p.evaluate(()=>{document.getElementById('settings').hidden=false});
  const spoken=()=>p.evaluate(()=>window.__spoken.slice());
  const clearSpoken=()=>p.evaluate(()=>{window.__spoken.length=0});
  const settle=async()=>{await W(1800);await clearSpoken();return p.evaluate(()=>ML_VOICE.log().length)};
  const sayIt=async(ko,en)=>{await settle();await p.evaluate(([k,e])=>window.ML.say(k,e),[ko,en]);await W(500);return spoken()};

  /* 1 */
  const pick=await p.evaluate(()=>({ko:ML_VOICE.current('ko').name,en:ML_VOICE.current('en').name,
    ko_rank:ML_VOICE.ranked('ko').map(v=>v.name),en_rank:ML_VOICE.ranked('en').map(v=>v.name)}));
  ok('한국어 목소리 = Yuna (Enhanced)',pick.ko==='Yuna (Enhanced)',pick.ko_rank.join(' > '));
  ok('영어 목소리 = Ava (Premium)',pick.en==='Ava (Premium)',pick.en_rank.join(' > '));
  let s=await sayIt('안녕!','Hi!');
  ok('말하기: 한국어 다음 영어, 고른 목소리로',s.length===2&&s[0].lang==='ko-KR'&&s[0].voice==='Yuna (Enhanced)'&&s[1].voice==='Ava (Premium)'&&s[0].pitch===1,JSON.stringify(s.map(x=>[x.lang,x.voice,x.rate,x.pitch])));

  /* 2 */
  await openSettings();
  ok('설정에 목소리·녹음 메뉴가 보임',await p.locator('#openVoicePick').isVisible()&&await p.locator('#openRecs').isVisible());
  await p.click('#openVoicePick');await W(200);
  const ids=await p.locator('.vp-list[data-lang="ko"] .vp-opt').allInnerTexts();
  ok('한국어 목록은 점수 순 위 5개 이내 + 더 보기',ids.length<=5&&ids[0].startsWith('Yuna (Enhanced)'),ids.map(x=>x.split('\n')[0]).join(' / '));
  await clearSpoken();
  await p.locator('.vp-opt',{hasText:'Google 한국의'}).click();await W(300);
  s=await spoken();
  ok('고르면 바로 예시 문장',s.length===1&&s[0].voice==='Google 한국의'&&s[0].text.includes('토토'),JSON.stringify(s));
  await p.screenshot({path:'/tmp/claude-0/-home-user-TJ/951ca345-5c66-5e48-88ff-e7326ce4af72/scratchpad/p10/parent-voice.png'});
  await p.click('.vp-close');
  s=await sayIt('멋지다!','Awesome!');
  ok('다음 말부터 고른 목소리',s[0].voice==='Google 한국의'&&s[1].voice==='Ava (Premium)',JSON.stringify(s.map(x=>x.voice)));
  await p.reload();await W(400);
  s=await sayIt('멋지다!','Awesome!');
  ok('다시 열어도 유지',s[0].voice==='Google 한국의',JSON.stringify(s.map(x=>x.voice)));
  /* 빠르기 */
  await openSettings();await p.click('#openVoicePick');await p.click('#vpRate button[data-v="slow"]');await W(200);await p.click('.vp-close');
  s=await sayIt('멋지다!','Awesome!');
  ok('천천히: 보통보다 느림',s[0].rate<0.95&&s[1].rate<0.9,s.map(x=>x.rate).join(','));
  await openSettings();await p.click('#openVoicePick');await p.click('#vpRate button[data-v="normal"]');await p.click('.vp-close');

  /* 3 */
  await openSettings();await p.click('#openRecs');await W(300);
  const card=await p.locator('.vp-ko').innerText();
  ok('첫 문장 카드가 칭찬 \'예쁘다!\'',card==='예쁘다!',card);
  const cnt=await p.evaluate(()=>ML_VOICE.phrases().length);
  ok('녹음할 문장 30개 안팎',cnt>=28&&cnt<=40,cnt+'개');
  const rb=await p.locator('#rcRec').boundingBox();
  await p.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2);await p.mouse.down();await W(600);await p.mouse.up();await W(200);
  ok('녹음 뒤 저장 버튼 켜짐',await p.locator('#rcSave').isEnabled());
  await p.check('#rcBoth');
  await p.click('#rcSave');await W(400);
  ok('저장됨 표시',(await p.locator('.vp-nav .vp-state').innerText()).includes('녹음됨 1개'));
  await p.screenshot({path:'/tmp/claude-0/-home-user-TJ/951ca345-5c66-5e48-88ff-e7326ce4af72/scratchpad/p10/parent-rec.png'});
  await p.click('.vp-close');
  await p.reload();await W(600);   // 저장소에서 다시 읽기
  let n0=await settle();await p.evaluate(()=>window.ML.say(...window.ML.nextPraise()));await W(900);
  let lg=(await p.evaluate(()=>ML_VOICE.log())).slice(n0);s=await spoken();
  ok('칭찬 때 녹음 재생, 기기 목소리(한국어·영어) 없음',lg.some(x=>x.t==='rec')&&s.length===0,JSON.stringify({log:lg.map(x=>x.t),tts:s.length}));
  await p.evaluate(()=>window.ML.say('예쁘다','Beautiful'));await W(800);
  lg=(await p.evaluate(()=>ML_VOICE.log())).slice(n0);
  ok('문장부호·공백이 달라도 같은 문장으로 봄',lg.filter(x=>x.t==='rec').length===2);
  /* 영어도 함께 끄기 */
  await openSettings();await p.click('#openRecs');await W(300);
  await p.uncheck('#rcBoth');await W(300);await p.click('.vp-close');
  await p.reload();await W(600);
  n0=await settle();await p.evaluate(()=>window.ML.say('예쁘다!','Beautiful!'));await W(900);
  lg=(await p.evaluate(()=>ML_VOICE.log())).slice(n0);s=await spoken();
  ok('영어도 함께 끄면: 녹음 뒤 영어 기기 목소리만',lg.map(x=>x.t).join(',')==='rec,tts'&&s.length===1&&s[0].lang==='en-US'&&s[0].text==='Beautiful!',JSON.stringify({log:lg.map(x=>x.t),tts:s.map(x=>x.lang)}));
  /* 다른 문장은 그대로 기기 목소리 */
  s=await sayIt('안녕!','Hi!');
  ok('녹음 없는 말은 기기 목소리',s.length===2&&s[0].lang==='ko-KR');
  ok('화면 오류 없음',errs.length===0,errs.join(' | '));

  /* MediaRecorder 없으면 녹음 메뉴 숨김 */
  const p2=await (await b.newContext({viewport:{width:390,height:780}})).newPage();
  await p2.addInitScript(()=>{delete window.MediaRecorder;Object.defineProperty(window,'MediaRecorder',{value:undefined,configurable:true})});
  await p2.goto(URL);await p2.waitForTimeout(300);
  ok('MediaRecorder 없으면 녹음 메뉴 숨김',await p2.evaluate(()=>document.getElementById('openRecs').closest('.row').hidden===true));

  await b.close();
  console.log(fails?`\n${fails}개 실패`:'\n전부 통과');
  process.exit(fails?1:0);
})();
