/* 말랑 놀이터 · 놀이 마을 (엄마 아빠 따라하기, 꾸미기, 직업 놀이, 소리·노래)
   index.html의 window.ML 도구를 사용합니다. */
(()=>{
'use strict';
const M=window.ML;if(!M)return;
const {$,say,sfx,tone,cheer,confetti,bounce,pick,rand,shuffle,cap,batchim,go,games,charaHTML,heroData,CAST,hold,CNT_KO,CNT_EN,EMOJI_FONT,actx,marimba}=M;
const cur=()=>M.current();
const josa=(w,a,b)=>w+(batchim(w)?a:b);
let uid=0;

/* ---------------- styles ---------------- */
const css=`
.kstage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;background:var(--kbg,linear-gradient(180deg,#FFF6E8,#FFE6CC));
  box-shadow:inset 0 6px 0 rgba(255,255,255,.6),inset 0 -8px 0 rgba(46,42,79,.06),0 6px 0 rgba(46,42,79,.08)}
.khint{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:var(--paper);border-radius:18px;padding:8px 14px;font-size:clamp(15px,4.2vw,19px);
  box-shadow:0 4px 0 rgba(46,42,79,.12);z-index:8;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.ktray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;padding:10px;background:rgba(255,255,255,.7);border-radius:28px;min-height:92px;
  box-shadow:inset 0 4px 0 rgba(255,255,255,.8),0 5px 0 rgba(46,42,79,.08)}
.ktray.scroll{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start}
.ktray .chip{flex:none}
.kbox{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
.kbox svg,.kbox canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.kbox canvas{touch-action:none}
.dragi{position:absolute;transform:translate(-50%,-50%);touch-action:none;font-size:clamp(46px,13vw,70px);line-height:1;z-index:3;cursor:grab;
  filter:drop-shadow(0 5px 0 rgba(46,42,79,.18));transition:left .3s cubic-bezier(.3,1.4,.5,1),top .3s cubic-bezier(.3,1.4,.5,1)}
.dragi.lift{transition:none;transform:translate(-50%,-50%) scale(1.18);z-index:20;filter:drop-shadow(0 12px 6px rgba(46,42,79,.25))}
.dragi.placed{pointer-events:none}
.dropt{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;text-align:center}
.goneaway{animation:goneaway .45s ease-in forwards;pointer-events:none}
@keyframes goneaway{to{transform:translate(-50%,-50%) scale(0);opacity:0}}
.tapi{position:absolute;transform:translate(-50%,-50%);border:0;background:none;padding:0;line-height:1;font-size:clamp(48px,13vw,72px);touch-action:none;
  filter:drop-shadow(0 5px 0 rgba(46,42,79,.16));z-index:3}
.tapi.wob{animation:kwob 1.6s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes kwob{0%,100%{transform:translate(-50%,-50%) rotate(-6deg)}50%{transform:translate(-50%,-56%) rotate(6deg)}}
.sweeptool{position:absolute;left:0;top:0;font-size:56px;line-height:1;pointer-events:none;z-index:15;transform:translate(-50%,-50%);display:none}
.foam{position:absolute;transform:translate(-50%,-50%);font-size:30px;pointer-events:none;z-index:6;animation:foamup 1s ease-out forwards}
@keyframes foamup{to{transform:translate(-50%,-140%) scale(1.4);opacity:0}}
.bigbtn{font-size:26px;padding:16px 28px}
.kpulse{animation:pulse 1.3s ease-in-out infinite}
/* cutter */
.cutsvg .slash{stroke:#FFFFFF;stroke-width:5;stroke-linecap:round;stroke-dasharray:2 10;opacity:0}
.cutsvg .slash.on{opacity:1}
.cutsvg .cutl{stroke:rgba(46,42,79,.55);stroke-width:3;stroke-linecap:round}
.cutsvg .pc{transition:transform .5s cubic-bezier(.3,1.4,.5,1),opacity .4s;cursor:pointer}
.cutsvg .pc.gone{opacity:0}
.knife{position:absolute;right:8px;bottom:8px;font-size:44px;pointer-events:none;animation:floaty 1.2s ease-in-out infinite}
.plates{display:flex;gap:8px;justify-content:center;align-items:flex-end;flex-wrap:wrap}
.plate2{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:64px}
.plate2 .chara{--u:4.6px}
.plate2 .dish{width:62px;height:22px;border-radius:50%;background:var(--paper);box-shadow:inset 0 -4px 0 rgba(46,42,79,.12),0 3px 0 rgba(46,42,79,.12);display:grid;place-items:center;font-size:26px;line-height:0}
/* cake (side view) */
.cake{position:absolute;left:50%;bottom:12%;transform:translateX(-50%) scale(var(--ks,1));transform-origin:50% 100%;display:flex;flex-direction:column-reverse;align-items:center}
.cake .stand{width:260px;height:22px;border-radius:50%;background:linear-gradient(180deg,#FFFFFF,#DCE3EE);box-shadow:0 6px 0 rgba(46,42,79,.12)}
.cake .tier{position:relative;height:70px;margin-bottom:-4px;border-radius:14px 14px 10px 10px;background:linear-gradient(90deg,rgba(0,0,0,.06),transparent 30%,rgba(255,255,255,.25) 60%,rgba(0,0,0,.08)),var(--tc);
  box-shadow:inset 0 -8px 0 rgba(46,42,79,.1);animation:tierdrop .5s cubic-bezier(.3,1.4,.5,1)}
.cake .tier::before{content:"";position:absolute;left:-4px;right:-4px;top:-6px;height:22px;border-radius:12px;
  background:radial-gradient(circle at 10px 18px,var(--cream) 9px,transparent 10px) 0 0/20px 26px repeat-x,linear-gradient(var(--cream),var(--cream)) 0 0/100% 10px no-repeat}
@keyframes tierdrop{from{transform:translateY(-200px)}to{transform:none}}
.cake .topz{position:relative;width:100px;height:0}
.cake .fr{position:absolute;bottom:-6px;font-size:30px;transform:translateX(-50%);animation:pop .4s ease-out}
.cake .cdl{position:absolute;bottom:4px;width:12px;height:46px;margin-left:-6px;border-radius:4px;background:repeating-linear-gradient(-45deg,#FFFFFF 0 6px,#FF8FAB 6px 12px)}
.cake .cdl .fl{position:absolute;left:50%;top:-30px;width:16px;height:26px;margin-left:-8px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
  background:radial-gradient(circle at 50% 70%,#FFF7B0,#FFC93C 55%,#FF7A2E);animation:flick .25s ease-in-out infinite alternate;cursor:pointer;pointer-events:auto}
.cake .cdl .fl::after{content:"";position:absolute;inset:-14px}
.cake .cdl.out .fl{display:none}
.cake .cdl .smoke{position:absolute;left:50%;top:-34px;font-size:24px;transform:translateX(-50%);animation:foamup 1.2s forwards;pointer-events:none}
@keyframes flick{from{transform:scale(1,1) rotate(-3deg)}to{transform:scale(.9,1.1) rotate(3deg)}}
/* sink / dishes */
.sink{--kbg:linear-gradient(180deg,#DDF3FF 0%,#DDF3FF 62%,#B9D7E8 62%,#A9CADC 100%)}
.faucet{position:absolute;left:50%;top:48px;transform:translateX(-50%);font-size:58px;line-height:1;z-index:5;border:0;background:none;padding:0}
.water{position:absolute;left:50%;top:104px;width:18px;margin-left:-9px;height:0;background:linear-gradient(180deg,rgba(120,200,255,.9),rgba(160,220,255,.5));border-radius:9px;z-index:4;transition:height .4s}
.water.on{height:46%}
.rack{position:absolute;right:10px;bottom:10px;display:flex;flex-direction:column-reverse;align-items:center;z-index:2}
.rack i{display:block;width:54px;height:12px;border-radius:50%;margin-top:-4px;background:var(--paper);box-shadow:inset 0 -3px 0 rgba(46,42,79,.12),0 2px 0 rgba(46,42,79,.12)}
.dishmove{transition:transform .7s ease-in,opacity .7s}
.dishmove.away{transform:translate(60%,40%) scale(.2);opacity:0}
/* jobs & dolls */
.chara .hat{position:absolute;top:calc(var(--u)*-2.4);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*3);line-height:1;z-index:3}
.chara .tool{position:absolute;right:calc(var(--u)*-2.6);top:calc(var(--u)*6.2);font-size:calc(var(--u)*2.8);line-height:1;z-index:3}
.chara .chefhat{position:absolute;top:calc(var(--u)*-3.4);left:50%;transform:translateX(-50%);width:calc(var(--u)*4.6);height:calc(var(--u)*3.6);z-index:3;
  background:radial-gradient(circle at 25% 40%,#fff calc(var(--u)*1.3),transparent calc(var(--u)*1.35)),radial-gradient(circle at 75% 40%,#fff calc(var(--u)*1.3),transparent calc(var(--u)*1.35)),radial-gradient(circle at 50% 30%,#fff calc(var(--u)*1.5),transparent calc(var(--u)*1.55)),linear-gradient(#fff,#fff) 50% 100%/70% 40% no-repeat;
  filter:drop-shadow(0 2px 0 rgba(46,42,79,.18))}
.chara.helmet .face{box-shadow:0 0 0 calc(var(--u)*.8) rgba(200,230,255,.85),0 0 0 calc(var(--u)*1.1) #9FB6CC}
.chara.whitecoat .body{background:linear-gradient(90deg,transparent 46%,#BFD0E2 46% 54%,transparent 54%),var(--body)}
.jobstage{--kbg:linear-gradient(180deg,#CDEBFF,#EAF7FF 65%,#A8DE8E 65%,#93D27A)}
.jobstage .chara{position:absolute;left:50%;bottom:16%;transform:translateX(-50%)}
.jobstage .veh{position:absolute;right:6%;bottom:14%;font-size:clamp(70px,22vw,130px);line-height:1;transform:scaleX(-1)}
.road{--kbg:linear-gradient(180deg,#BDE8FF,#E8F7FF 55%,#9BD67F 55%,#8CCB6F 76%,#6B6F80 76%,#6B6F80 92%,#8CCB6F 92%)}
.driver{position:absolute;bottom:9%;font-size:clamp(70px,20vw,120px);line-height:1;z-index:4;transition:left 1.6s cubic-bezier(.3,.7,.4,1)}
.driver.flipx{transform:scaleX(-1)}
.house{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:clamp(150px,44vw,240px);line-height:1;z-index:1}
/* dress-up doll */
.doll{--u:15px;position:absolute;left:50%;bottom:6%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}
.doll .dhead{position:absolute;top:calc(var(--u)*-2.6);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*3);line-height:1;z-index:4}
.doll .face{width:calc(var(--u)*6.4);height:calc(var(--u)*6.4);border-radius:50%;background:var(--paper) center/cover no-repeat;border:calc(var(--u)*.45) solid var(--paper);
  box-shadow:0 calc(var(--u)*.3) 0 rgba(46,42,79,.18);display:grid;place-items:center;font-size:calc(var(--u)*4.4);line-height:1;position:relative;z-index:3}
.doll .dress{position:relative;z-index:2;margin-top:calc(var(--u)*-.8);background:var(--pat,none),var(--dc);transition:clip-path .3s}
.doll .dress.gown{width:calc(var(--u)*13);height:calc(var(--u)*10.5);clip-path:polygon(38% 0,62% 0,60% 28%,100% 100%,0 100%,40% 28%)}
.doll .dress.tutu{width:calc(var(--u)*11);height:calc(var(--u)*7);clip-path:polygon(38% 0,62% 0,60% 45%,100% 80%,92% 100%,8% 100%,0 80%,40% 45%)}
.doll .dress.mermaid{width:calc(var(--u)*10);height:calc(var(--u)*10.5);clip-path:polygon(36% 0,64% 0,62% 62%,90% 100%,10% 100%,38% 62%)}
.doll .dress.suit{width:calc(var(--u)*6.4);height:calc(var(--u)*6);clip-path:polygon(10% 0,90% 0,96% 100%,4% 100%);
  background:linear-gradient(90deg,transparent 45%,rgba(255,255,255,.85) 45% 55%,transparent 55%),var(--pat,none),var(--dc)}
.doll .cape{position:absolute;top:calc(var(--u)*5.6);left:50%;transform:translateX(-50%);width:calc(var(--u)*9);height:calc(var(--u)*9);background:var(--cc,#C62828);
  clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);z-index:1;box-shadow:inset 0 -6px 0 rgba(0,0,0,.15)}
.doll .legs{display:flex;gap:calc(var(--u)*1.2);position:relative;z-index:1}
.doll .legs i{display:block;width:calc(var(--u)*1.1);height:calc(var(--u)*2);background:#FFE0C7}
.doll.suitlegs .legs i{height:calc(var(--u)*4);background:#2E2A4F}
.doll .shoes{display:flex;gap:calc(var(--u)*.6)}
.doll .shoes i{display:block;width:calc(var(--u)*1.8);height:calc(var(--u)*.9);border-radius:50% 50% 30% 30%;background:var(--dc);box-shadow:inset 0 -3px 0 rgba(0,0,0,.15)}
.doll .pdress{position:relative;z-index:2;margin-top:calc(var(--u)*-1.3);width:calc(var(--u)*15);max-height:calc(var(--u)*17);object-fit:contain;object-position:50% 0;filter:drop-shadow(0 4px 0 rgba(46,42,79,.15))}
.closetbtn{position:relative;overflow:hidden;border-radius:18px;width:64px;height:64px;background:repeating-conic-gradient(#F3EEF9 0 25%,#FFFFFF 0 50%) 0 0/14px 14px}
.closetbtn img{width:100%;height:100%;object-fit:contain}
.closetbtn.locked img{filter:grayscale(1) brightness(1.1) opacity(.55)}
.closetbtn .lk{position:absolute;inset:auto 0 0 0;background:rgba(46,42,79,.75);color:#fff;font-size:12px;padding:1px 0}
.doll .hand{position:absolute;right:calc(var(--u)*-3.2);top:calc(var(--u)*7.6);font-size:calc(var(--u)*3.2);line-height:1;z-index:5}
.doll.twirl{animation:twirl .9s ease-in-out}
@keyframes twirl{0%{transform:translateX(-50%) rotateY(0)}50%{transform:translateX(-50%) rotateY(180deg) scale(1.05)}100%{transform:translateX(-50%) rotateY(360deg)}}
.flash{position:fixed;inset:0;background:#fff;z-index:75;pointer-events:none;animation:flash .5s forwards}
@keyframes flash{from{opacity:.95}to{opacity:0}}
.dressstage{--kbg:radial-gradient(circle at 50% 30%,#FFE9F5,#F6D5FF 60%,#E3C9FF)}
.dressstage::before{content:"✨";position:absolute;left:10%;top:10%;font-size:28px;animation:floaty 2s infinite}
.dressstage::after{content:"🪞";position:absolute;right:8%;top:8%;font-size:40px}
.facerow{display:flex;gap:8px;overflow-x:auto;padding:4px 2px}
.facebtn{flex:none;width:58px;height:58px;border-radius:50%;border:4px solid var(--paper);background:var(--paper) center/cover no-repeat;font-size:34px;display:grid;place-items:center;
  box-shadow:0 4px 0 rgba(46,42,79,.14);padding:0}
.facebtn.on{box-shadow:0 0 0 4px var(--ink)}
/* makeup */
.mkstage{--kbg:radial-gradient(circle at 50% 40%,#FFF0F6,#FFD9EA 70%)}
.mkface{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);border-radius:50%;background:#FFFFFF center/cover no-repeat;display:grid;place-items:center;
  box-shadow:0 0 0 10px #FFFFFF,0 12px 0 10px rgba(46,42,79,.12);overflow:visible}
.mkface .emo{line-height:1;pointer-events:none}
.mkface canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;touch-action:none}
.acc{position:absolute;transform:translate(-50%,-50%);line-height:1;z-index:5;touch-action:none;cursor:grab}
.acc.lift{transform:translate(-50%,-50%) scale(1.15)}
/* nails */
.nailstage{--kbg:radial-gradient(circle at 50% 30%,#FFF4E8,#FFE1CC 70%)}
.nailstage svg .nail{cursor:pointer;stroke:rgba(46,42,79,.18);stroke-width:2}
.nailstage svg .nail.tip{filter:url(#nshine)}
/* sounds & videos */
.sgrid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-content:start;padding:4px 2px 16px}
@media (min-width:640px){.sgrid{grid-template-columns:repeat(4,1fr)}}
.stile{border:0;border-radius:26px;aspect-ratio:1/1;background:radial-gradient(120% 80% at 30% 0%,rgba(255,255,255,.6),transparent 55%),var(--c);box-shadow:inset 0 3px 0 rgba(255,255,255,.6),inset 0 -6px 0 rgba(46,42,79,.12),0 7px 0 rgba(46,42,79,.16),0 12px 16px rgba(46,42,79,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative;overflow:visible}
.stile .ic{font-size:clamp(40px,12vw,58px);line-height:1.1;filter:drop-shadow(0 4px 0 rgba(46,42,79,.16))}
.stile:active{transform:translateY(5px)}
.stile b{font-weight:400;font-size:clamp(14px,4vw,18px)}
.stile.ring::after{content:"";position:absolute;inset:-6px;border-radius:30px;border:4px solid var(--c);animation:ring .6s ease-out forwards;pointer-events:none}
@keyframes ring{from{opacity:1;transform:scale(.9)}to{opacity:0;transform:scale(1.25)}}
.vlist{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:4px 2px 16px}
.vcard{display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink);background:var(--paper);border-radius:24px;padding:12px 16px;
  box-shadow:inset 0 4px 0 rgba(255,255,255,.9),0 6px 0 rgba(46,42,79,.12)}
.vcard:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(46,42,79,.12)}
.vcard .vi{flex:none;width:64px;height:64px;border-radius:18px;display:grid;place-items:center;font-size:36px;background:var(--c)}
.vcard .vt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.vcard .vt b{font-weight:400;font-size:19px}
.vcard .vt small{font-family:system-ui,sans-serif;font-size:13px;color:var(--muted)}
.vcard .yt{flex:none;font-size:13px;font-family:system-ui,sans-serif;background:#FF3B30;color:#fff;border-radius:999px;padding:4px 10px}
/* routine */
.clock{display:flex;align-items:center;gap:6px;background:var(--paper);border-radius:999px;padding:4px 12px 4px 4px;font-size:16px;box-shadow:0 3px 0 rgba(46,42,79,.12);flex:none}
.clock svg{width:34px;height:34px}
.rt-dark{position:absolute;inset:0;background:rgba(20,18,50,.72);z-index:7;transition:opacity 1s;pointer-events:none}
.rt-dark.off{opacity:0}
.curtain{position:absolute;top:0;bottom:0;width:50%;z-index:6;background:repeating-linear-gradient(90deg,#9A7BFF 0 18px,#8A6AF0 18px 36px);transition:transform 1.2s ease-in-out;border:0;padding:0}
.curtain.l{left:0}.curtain.r{right:0}
.curtain.l.open{transform:translateX(-92%)}.curtain.r.open{transform:translateX(92%)}
.bus{position:absolute;bottom:10%;font-size:clamp(90px,26vw,150px);line-height:1;transition:left 1.8s cubic-bezier(.4,.1,.4,1);z-index:4;border:0;background:none;padding:0;transform:scaleX(-1)}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------------- shared helpers ---------------- */
function screen(id,title,barExtra,body,name){
  const s=document.createElement('section');s.id=id;s.className='screen';s.hidden=true;
  s.innerHTML=`<div class="bar"><button class="round" data-go="home" aria-label="처음으로">🏠</button><h2>${title}</h2>${barExtra||''}</div>${body}`;
  $('#app').appendChild(s);M.NAMES[id]=name||title.replace(/<[^>]+>/g,'');return s;
}
function life(id){
  let tok=0,timers=[],cleanups=[];
  return{
    begin(){tok++;timers.forEach(clearTimeout);timers=[];cleanups.forEach(f=>{try{f()}catch(e){}});cleanups=[];return tok},
    later(fn,ms){const t=tok;timers.push(setTimeout(()=>{if(t===tok&&cur()===id)fn()},ms))},
    onEnd(f){cleanups.push(f)},
    ok(t){return t===tok&&cur()===id},
    get tok(){return tok}
  };
}
function chip(tray,inner,label,fn,color,cls){
  const b=document.createElement('button');b.className='chip'+(cls?' '+cls:'');
  b.innerHTML=`<span class="dot" style="--c:${color||'var(--paper)'}">${inner}</span><span>${label}</span>`;
  b.onclick=()=>{bounce(b);actx();fn(b)};tray.appendChild(b);return b;
}
function bigBtn(tray,text,fn,alt){const b=document.createElement('button');b.className='btn bigbtn kpulse'+(alt?' alt':'');b.textContent=text;b.style.flex='none';
  let used=false;b.onclick=()=>{if(used)return;used=true;actx();sfx.pop();fn()};
  if(tray.classList.contains('scroll')){tray.prepend(b);tray.scrollLeft=0}else tray.appendChild(b);return b}
function hint(stage,t){let h=stage.querySelector('.khint');if(!h){h=document.createElement('div');h.className='khint';stage.appendChild(h)}h.textContent=t;h.hidden=!t}
function dotsHTML(n){return `<div class="dots kdots">${'<i></i>'.repeat(n)}</div>`}
function setDots(sec,k){sec.querySelectorAll('.kdots i').forEach((d,i)=>{d.className=i<k?'done':i===k?'on':''})}
function boxSize(stage,f=.9){const r=stage.getBoundingClientRect();return Math.max(160,Math.min(r.width,r.height)*f)}
function foamAt(host,x,y,ch='🫧'){if(host.querySelectorAll('.foam').length>10)return;const f=document.createElement('span');f.className='foam';f.textContent=ch;f.style.left=x+'px';f.style.top=y+'px';host.appendChild(f);setTimeout(()=>f.remove(),1000)}
function friendsRow(n){
  const out=[heroData()];const F=M.friendData,c=Math.min(M.prog().cleared,7);
  for(let i=0;i<c&&out.length<n;i++)out.push(F(i));
  const def=[['🐰','토끼'],['🐶','강아지'],['🐱','고양이'],['🐻','곰'],['🐼','판다']];let k=0;
  while(out.length<n){const d=def[k++%def.length];out.push({emoji:d[0],name:d[1],color:'var(--soda)'})}
  return out;
}
function faceOf(kind){
  if(kind==='baby')return{photo:CAST.hero.photo,emoji:'👶',ko:CAST.hero.name||'아기',en:'baby'};
  if(kind==='mom')return{photo:(CAST.family.mom||{}).photo,emoji:'👩',ko:'엄마',en:'mommy'};
  if(kind==='dad')return{photo:(CAST.family.dad||{}).photo,emoji:'👨',ko:'아빠',en:'daddy'};
  return{photo:null,emoji:kind,ko:'',en:''};
}
function faceBg(f){return f.photo?`background-image:url(${f.photo})`:''}

/* noise for sound effects */
let noiseBuf=null;
function noise(dur=.3,{type='bandpass',freq=1200,q=1,vol=.3,when=0,sweep=0}={}){
  const a=actx();if(!a||!M.S.sound)return;
  if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=a.createBufferSource();s.buffer=noiseBuf;const f=a.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
  const g=a.createGain(),t=a.currentTime+when;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  if(sweep)f.frequency.exponentialRampToValueAtTime(Math.max(60,freq+sweep),t+dur);
  s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+dur+.05);
}
function sweepTone(f0,f1,dur,type='sine',vol=.2,when=0){
  const a=actx();if(!a||!M.S.sound)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+when;
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.05);
}
function siren(kind,dur=2){
  if(kind==='police'){for(let t=0;t<dur;t+=.8){sweepTone(600,1300,.4,'sawtooth',.06,t);sweepTone(1300,600,.4,'sawtooth',.06,t+.4)}}
  else{const hi=kind==='fire'?880:960,lo=kind==='fire'?660:770;for(let t=0,i=0;t<dur;t+=.38,i++)tone(i%2?lo:hi,.36,'square',.05,t)}
}
const SFX={
  scrub(){noise(.12,{freq:2400,q:.8,vol:.12})},
  splash(){noise(.5,{type:'lowpass',freq:1800,vol:.25,sweep:-1200})},
  swish(){noise(.25,{freq:900,q:.7,vol:.18,sweep:1400})},
  shutter(){noise(.06,{freq:3000,vol:.3});noise(.08,{freq:1500,vol:.25,when:.08})},
  chomp(){tone(220,.08,'square',.08);tone(180,.08,'square',.08,.12)},
  sparkle(){[1318,1568,2093].forEach((f,i)=>tone(f,.18,'sine',.1,i*.06))},
  ding(){tone(1046,.6,'sine',.2);tone(2093,.4,'sine',.06)}
};

/* ---------------- engines ---------------- */
/* drag items (.dragi) onto targets (.dropt). Items use % or px centres via left/top. */
function makeDrag(area,{onDrop,onTap}){
  let d=null;
  area.addEventListener('pointerdown',e=>{
    if(d)return;const it=e.target.closest('.dragi');if(!it||it.classList.contains('placed')||!area.contains(it))return;
    e.preventDefault();try{it.setPointerCapture(e.pointerId)}catch(_){}
    const r=it.getBoundingClientRect();
    d={it,id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:e.clientX-(r.left+r.width/2),oy:e.clientY-(r.top+r.height/2),moved:false,hl:it.style.left,ht:it.style.top};
    it.classList.add('lift');tone(520,.06,'triangle',.12);
  });
  area.addEventListener('pointermove',e=>{
    if(!d||e.pointerId!==d.id)return;
    if(Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>8)d.moved=true;
    const ar=area.getBoundingClientRect();
    d.it.style.left=Math.max(0,Math.min(ar.width,e.clientX-ar.left-d.ox))+'px';
    d.it.style.top=Math.max(0,Math.min(ar.height,e.clientY-ar.top-d.oy))+'px';
  });
  const up=e=>{
    if(!d||e.pointerId!==d.id)return;const {it,moved,hl,ht}=d;d=null;it.classList.remove('lift');
    const back=()=>{it.style.left=hl;it.style.top=ht};
    if(!moved){back();if(onTap)onTap(it);return}
    const r=it.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let hit=null,best=1e9;
    area.querySelectorAll('.dropt').forEach(t=>{const q=t.getBoundingClientRect(),pad=28;
      if(cx>q.left-pad&&cx<q.right+pad&&cy>q.top-pad&&cy<q.bottom+pad){const dd=Math.hypot(cx-(q.left+q.width/2),cy-(q.top+q.height/2));if(dd<best){best=dd;hit=t}}});
    let ok=false;try{ok=!!(hit&&onDrop(it,hit))}catch(err){console.error(err)}
    if(!ok){back();if(hit)sfx.boing()}
  };
  area.addEventListener('pointerup',up);area.addEventListener('pointercancel',up);area.addEventListener('lostpointercapture',up);
}

/* scrub (erase dirt) or paint inside a circle on a canvas */
function makeScrub(cv,{mode='erase',color='#D9412B',brush=.07,maskR=.42,threshold=.85,onMove,onDone}){
  const g=cv.getContext('2d');let W=0,H=0,cells=[],clean=0,total=0,last={},active=true,done=false,cx=0,cy=0,R=0,moves=0;
  function setup(){
    const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;W=r.width;H=r.height;if(!W)return;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);g.setTransform(dpr,0,0,dpr,0,0);cv.style.opacity=1;cv.style.transition='';
    cx=W/2;cy=H/2;R=maskR*W;const blobs=[];
    if(mode==='erase'){
      const cols=['rgba(150,95,40,.85)','rgba(210,60,40,.8)','rgba(110,150,50,.8)','rgba(230,170,40,.85)'];
      for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,rr=Math.random()*R*.65,b={x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,r:W*(.07+Math.random()*.07)};blobs.push(b);
        g.fillStyle=pick(cols);for(let k=0;k<5;k++){g.beginPath();g.arc(b.x+(Math.random()-.5)*b.r,b.y+(Math.random()-.5)*b.r,b.r*(.45+Math.random()*.4),0,Math.PI*2);g.fill()}}
    }
    cells=[];const N=16;
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x=(i+.5)/N*W,y=(j+.5)/N*H;if(Math.hypot(x-cx,y-cy)>R*.95)continue;
      if(mode==='erase'&&!blobs.some(b=>Math.hypot(x-b.x,y-b.y)<b.r*.9))continue;cells.push({x,y,d:false})}
    total=cells.length;clean=0;done=false;
  }
  const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  function stroke(a,b){
    const bw=brush*W;g.save();
    if(mode==='erase')g.globalCompositeOperation='destination-out';
    else{g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.clip();g.strokeStyle=color}
    g.lineWidth=bw*2;g.lineCap='round';g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();g.restore();
    cells.forEach(c=>{if(!c.d&&distSeg(c.x,c.y,a,b)<bw*1.05){c.d=true;clean++}});
  }
  function distSeg(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((x-a[0])*dx+(y-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy))}
  function check(){
    if(done||!active)return;
    if(total===0||clean/total>=threshold){
      done=true;
      if(mode==='erase'){cv.style.transition='opacity .5s';cv.style.opacity=0}
      else{g.save();g.fillStyle=color;g.beginPath();g.arc(cx,cy,R,0,Math.PI*2);g.fill();g.restore()}
      onDone&&onDone();
    }
  }
  cv.addEventListener('pointerdown',e=>{if(!active||done)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}const p=pos(e);last[e.pointerId]=p;stroke(p,[p[0]+.1,p[1]]);check()});
  cv.addEventListener('pointermove',e=>{const l=last[e.pointerId];if(!l||!active||done)return;const p=pos(e);if(Math.hypot(p[0]-l[0],p[1]-l[1])<2)return;stroke(l,p);last[e.pointerId]=p;
    if(++moves%6===0){onMove&&onMove(p);check()}});
  const end=e=>{delete last[e.pointerId];check()};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  return{start(){active=true;requestAnimationFrame(setup)},stop(){active=false},progress:()=>total?clean/total:1};
}

/* sweep: finger tool passes over items to hit them */
function makeSweep(area,{tool,radius=60,onHit,onDone,onMove}){
  const te=document.createElement('div');te.className='sweeptool';te.textContent=tool;area.appendChild(te);
  let items=[],down=null,active=true,lastSnd=0;
  function at(e){
    if(!active)return;const ar=area.getBoundingClientRect(),x=e.clientX-ar.left,y=e.clientY-ar.top;
    te.style.display='block';te.style.left=x+'px';te.style.top=(y-30)+'px';const now=performance.now();
    if(onMove&&now-lastSnd>140){lastSnd=now;onMove(x,y)}
    items.forEach(it=>{
      if(it.dead)return;const r=it.el.getBoundingClientRect(),ix=r.left-ar.left+r.width/2,iy=r.top-ar.top+r.height/2;
      if(Math.hypot(ix-x,iy-(y-20))<radius&&now-it.t>260){it.t=now;it.hp--;onHit(it);if(it.hp<=0){it.dead=true;if(items.every(q=>q.dead)){active=false;te.style.display='none';onDone&&onDone()}}}
    });
  }
  area.addEventListener('pointerdown',e=>{if(!active)return;e.preventDefault();try{area.setPointerCapture(e.pointerId)}catch(_){}down=e.pointerId;at(e)});
  area.addEventListener('pointermove',e=>{if(down===e.pointerId)at(e)});
  const end=e=>{if(down===e.pointerId){down=null;te.style.display='none'}};
  area.addEventListener('pointerup',end);area.addEventListener('pointercancel',end);
  return{add(el,hp=1){items.push({el,hp,t:0,dead:false})},stop(){active=false;te.style.display='none'}};
}

/* cutter: swipe across a top-view circle (cake / pizza) */
function makeCutter(box,{top,target=2,onCut,onSeparated,onServe,easy}){
  const EASY=[0,Math.PI/3,2*Math.PI/3];
  const p='c'+(++uid);let cuts=[],start=null,active=true,served=0,n=0;
  box.innerHTML=`<svg class="cutsvg" viewBox="-120 -120 240 240"><defs></defs><g class="whole"><g id="${p}top">${top}</g></g><g class="cuts"></g><line class="slash" x1="0" y1="0" x2="0" y2="0"/></svg><span class="knife">🔪</span>`;
  const svg=box.querySelector('svg'),defs=svg.querySelector('defs'),cg=svg.querySelector('.cuts'),sl=svg.querySelector('.slash'),whole=svg.querySelector('.whole');
  const pt=e=>{const r=svg.getBoundingClientRect(),s=240/Math.min(r.width,r.height);return[(e.clientX-(r.left+r.width/2))*s,(e.clientY-(r.top+r.height/2))*s]};
  svg.addEventListener('pointerdown',e=>{
    if(!active)return;e.preventDefault();try{svg.setPointerCapture(e.pointerId)}catch(_){}
    start={id:e.pointerId,p:pt(e)};sl.setAttribute('x1',start.p[0]);sl.setAttribute('y1',start.p[1]);sl.setAttribute('x2',start.p[0]);sl.setAttribute('y2',start.p[1]);sl.classList.add('on');
  });
  svg.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId)return;const q=pt(e);sl.setAttribute('x2',q[0]);sl.setAttribute('y2',q[1])});
  const up=e=>{
    if(!start||start.id!==e.pointerId)return;const [x1,y1]=start.p,[x2,y2]=pt(e);start=null;sl.classList.remove('on');if(!active)return;
    const L=Math.hypot(x2-x1,y2-y1);if(easy){doCut(EASY[cuts.length%3]);return}if(L<70)return;
    const t=Math.max(0,Math.min(1,-(x1*(x2-x1)+y1*(y2-y1))/(L*L))),px=x1+t*(x2-x1),py=y1+t*(y2-y1);
    if(Math.hypot(px,py)>60){sfx.soft();return}
    let a=Math.atan2(y2-y1,x2-x1);a=((a%Math.PI)+Math.PI)%Math.PI;a=(Math.round(a/(Math.PI/12))*(Math.PI/12))%Math.PI;
    if(cuts.some(c=>{const d=Math.abs(c-a);return Math.min(d,Math.PI-d)<Math.PI/7})){sfx.soft();return}
    doCut(a);
  };
  function doCut(a){
    if(!active)return;cuts.push(a);SFX.swish();
    const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('class','cutl');
    l.setAttribute('x1',-108*Math.cos(a));l.setAttribute('y1',-108*Math.sin(a));l.setAttribute('x2',108*Math.cos(a));l.setAttribute('y2',108*Math.sin(a));cg.appendChild(l);
    onCut&&onCut(cuts.length*2);
    if(cuts.length>=target){active=false;setTimeout(separate,600)}
  };
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
  function separate(){
    const angs=[];cuts.forEach(c=>angs.push(c,c+Math.PI));angs.sort((a,b)=>a-b);n=angs.length;
    let d='',g='';
    for(let i=0;i<n;i++){
      const a0=angs[i],a1=i+1<n?angs[i+1]:angs[0]+Math.PI*2,m=(a0+a1)/2,R=135;
      d+=`<clipPath id="${p}w${i}"><path d="M0 0L${(R*Math.cos(a0)).toFixed(1)} ${(R*Math.sin(a0)).toFixed(1)}A${R} ${R} 0 ${a1-a0>Math.PI?1:0} 1 ${(R*Math.cos(a1)).toFixed(1)} ${(R*Math.sin(a1)).toFixed(1)}Z"/></clipPath>`;
      g+=`<g class="pc" data-i="${i}" data-m="${m}"><g clip-path="url(#${p}w${i})"><use href="#${p}top"/></g></g>`;
    }
    const keep=svg.querySelector(`#${p}top`).outerHTML;defs.innerHTML=d+keep;
    whole.innerHTML=g;cg.innerHTML='';
    requestAnimationFrame(()=>requestAnimationFrame(()=>svg.querySelectorAll('.pc').forEach(pc=>{const m=+pc.dataset.m;pc.style.transform=`translate(${(14*Math.cos(m)).toFixed(1)}px,${(14*Math.sin(m)).toFixed(1)}px)`})));
    box.querySelector('.knife').remove();
    svg.querySelectorAll('.pc').forEach(pc=>pc.addEventListener('pointerdown',e=>{e.preventDefault();if(pc.classList.contains('gone'))return;pc.classList.add('gone');served++;onServe&&onServe(served,n)}));
    onSeparated&&onSeparated(n);
  }
  return{stop(){active=false},cut(){if(active)doCut(EASY[cuts.length%3])}};
}

/* tap-to-pop targets */
function tapItems(area,list,{onTap,onDone,wob=true}){
  let left=list.length,count=0;
  list.forEach(([emo,x,y,size])=>{
    const b=document.createElement('button');b.className='tapi'+(wob?' wob':'');b.textContent=emo;b.style.left=x+'%';b.style.top=y+'%';
    if(size)b.style.fontSize=size+'px';b.style.setProperty('--d',(Math.random()*1.2)+'s');b.setAttribute('aria-label',emo);
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(b.dataset.done)return;b.dataset.done=1;count++;left--;
      const keep=onTap?onTap(b,count):false;if(!keep){b.classList.remove('wob');b.classList.add('goneaway');setTimeout(()=>b.remove(),460)}
      if(!left)onDone&&onDone()});
    area.appendChild(b);
  });
}

/* job characters */
const JOBS=[
  {id:'fire',ko:'소방관',en:'firefighter',icon:'🧑‍🚒',veh:'🚒',vko:'소방차',ven:'fire truck',body:'#E53935',hat:'⛑️',tool:'🧯',line:['불을 끄는 소방관!','Firefighters put out fires!'],siren:'fire'},
  {id:'police',ko:'경찰관',en:'police officer',icon:'👮',veh:'🚓',vko:'경찰차',ven:'police car',body:'#2F56B5',hat:'🧢',tool:'🔦',line:['우리를 지켜 주는 경찰관!','Police officers keep us safe!'],siren:'police'},
  {id:'doctor',ko:'의사',en:'doctor',icon:'🧑‍⚕️',veh:'🚑',vko:'구급차',ven:'ambulance',body:'#F7FAFF',hat:'',tool:'🩺',cls:'whitecoat',line:['아픈 사람을 고쳐 주는 의사!','Doctors help sick people!'],siren:'amb'},
  {id:'chef',ko:'요리사',en:'chef',icon:'🧑‍🍳',veh:'🍳',vko:'프라이팬',ven:'frying pan',body:'#FFFFFF',hat:'chef',tool:'🥄',line:['맛있는 음식을 만드는 요리사!','Chefs cook yummy food!']},
  {id:'pilot',ko:'조종사',en:'pilot',icon:'🧑‍✈️',veh:'✈️',vko:'비행기',ven:'airplane',body:'#1F2E5A',hat:'🧢',tool:'🗺️',line:['비행기를 운전하는 조종사!','Pilots fly airplanes!']},
  {id:'astro',ko:'우주비행사',en:'astronaut',icon:'🧑‍🚀',veh:'🚀',vko:'로켓',ven:'rocket',body:'#ECEFF4',hat:'',tool:'⭐',cls:'helmet',line:['우주로 날아가는 우주비행사!','Astronauts fly to space!']},
  {id:'farmer',ko:'농부',en:'farmer',icon:'🧑‍🌾',veh:'🚜',vko:'트랙터',ven:'tractor',body:'#4E7FC4',hat:'👒',tool:'🌽',line:['채소를 키우는 농부!','Farmers grow vegetables!']},
  {id:'driver',ko:'버스 기사',en:'bus driver',icon:'🧑‍✈️',veh:'🚌',vko:'버스',ven:'bus',body:'#43A047',hat:'🧢',tool:'🎫',line:['버스를 운전하는 버스 기사!','Bus drivers drive buses!']}
];
function jobChara(job,face,u){
  const f=face||faceOf('baby');
  const fc=f.photo?`<span class="face" style="${faceBg(f)}"></span>`:`<span class="face">${f.emoji==='👶'?'🙂':f.emoji}</span>`;
  const hat=job.hat==='chef'?'<span class="chefhat"></span>':job.hat?`<span class="hat">${job.hat}</span>`:'';
  return `<div class="chara ${job.cls||''}" style="--body:${job.body};--u:${u}px">${hat}${fc}<span class="body"></span><span class="tool">${job.tool}</span><span class="legs"><i></i><i></i></span></div>`;
}

function CNT_KO_UNIT(n){return ['한','두','세','네','다섯','여섯','일곱','여덟','아홉','열'][n-1]||String(n)}

/* =================================================================
   3. DISHES
   ================================================================= */
(()=>{
  const id='dishes',L=life(id);
  const sec=screen(id,'설거지 하기',dotsHTML(3),'<div class="kstage sink" id="dsStage"></div><div class="ktray" id="dsTray"></div>');
  const stage=sec.querySelector('#dsStage'),tray=sec.querySelector('#dsTray');
  const RIMS=['#7FC8F8','#FF9EBB','#A8E6CF'];
  let k=0,eng;
  function plate(){
    stage.innerHTML=`<button class="faucet" aria-label="수도꼭지">🚰</button><div class="water"></div><div class="rack">${'<i></i>'.repeat(k)}</div>`;
    const box=document.createElement('div');box.className='kbox dishmove';const s=boxSize(stage,.72);box.style.width=box.style.height=s+'px';box.style.top='56%';
    box.innerHTML=`<svg viewBox="-120 -120 240 240"><circle r="108" fill="#FFFFFF" stroke="${RIMS[k%3]}" stroke-width="14"/><circle r="72" fill="#F7FBFF" stroke="#E3EEF7" stroke-width="4"/></svg><canvas></canvas>`;
    stage.appendChild(box);return box;
  }
  function next(){
    setDots(sec,k);tray.innerHTML='';const box=plate();const cv=box.querySelector('canvas');
    hint(stage,'수세미로 쓱쓱 문질러서 깨끗하게!');say(k===0?'접시가 지저분해요. 수세미로 쓱쓱 닦아 볼까?':'다음 접시도 쓱쓱!',k===0?'Scrub the dirty plate!':'Next plate! Scrub scrub!');
    const tool=document.createElement('div');tool.className='sweeptool';tool.textContent='🧽';stage.appendChild(tool);
    const mv=e=>{const r=stage.getBoundingClientRect();tool.style.display='block';tool.style.left=(e.clientX-r.left+18)+'px';tool.style.top=(e.clientY-r.top+18)+'px'};
    cv.addEventListener('pointermove',mv);cv.addEventListener('pointerdown',mv);cv.addEventListener('pointerup',()=>{tool.style.display='none'});
    eng=makeScrub(cv,{mode:'erase',brush:.08,maskR:.45,threshold:.88,
      onMove:p=>{SFX.scrub();const r=cv.getBoundingClientRect(),sr=stage.getBoundingClientRect();foamAt(stage,p[0]+r.left-sr.left,p[1]+r.top-sr.top)},
      onDone:()=>{tool.remove();say('뽀득뽀득! 이제 물로 헹구자!','Squeaky! Now rinse it!');hint(stage,'수도꼭지를 눌러서 물로 헹궈요!');
        for(let i=0;i<7;i++){const f=document.createElement('span');f.className='foam';f.style.animation='none';f.textContent='🫧';f.style.left=(30+Math.random()*40)+'%';f.style.top=(40+Math.random()*30)+'%';f.dataset.stay=1;stage.appendChild(f)}
        const fc=stage.querySelector('.faucet');fc.classList.add('kpulse');
        fc.onclick=()=>{fc.onclick=null;fc.classList.remove('kpulse');stage.querySelector('.water').classList.add('on');SFX.splash();
          stage.querySelectorAll('.foam[data-stay]').forEach((f,i)=>setTimeout(()=>{f.style.animation='';},i*80));
          L.later(()=>{stage.querySelector('.water').classList.remove('on');box.classList.add('away');sfx.pop();k++;say(`깨끗한 접시 ${CNT_KO_UNIT(k)} 개!`,`${cap(CNT_EN[k-1])} clean ${k>1?'plates':'plate'}!`);
            L.later(()=>{if(k>=3){setDots(sec,3);stage.querySelector('.rack').innerHTML='<i></i>'.repeat(3);cheer('설거지 끝! 엄마 아빠를 도와줬어요!','All clean! You helped Mommy and Daddy!');
              L.later(()=>{tray.innerHTML='';bigBtn(tray,'다시 하기 🔄',reset)},1500)}else next()},1000)},1300)}}
    });
    eng.start();
  }
  function reset(){L.begin();if(eng)eng.stop();k=0;requestAnimationFrame(next)}
  games[id]={enter:reset,exit:()=>{L.begin();if(eng)eng.stop()}};
})();

/* =================================================================
   4. CHORES (toys, laundry, sweeping, watering)
   ================================================================= */
(()=>{
  const id='chores',L=life(id);
  const sec=screen(id,'집안일 하기','<div class="seg" id="chTabs"><button data-t="toys" class="on">🧸</button><button data-t="laundry">🧺</button><button data-t="sweep">🧹</button><button data-t="water">🌷</button></div>',
    '<div class="kstage" id="chStage" style="--kbg:linear-gradient(180deg,#FFF5E6 0%,#FFF5E6 60%,#F3D9B5 60%,#E9C99E 100%)"></div>');
  let tab='toys',eng=null;
  const ORDER=['toys','laundry','sweep','water'];
  function done(msgKo,msgEn){cheer(msgKo,msgEn);L.later(()=>{const n=ORDER[(ORDER.indexOf(tab)+1)%ORDER.length];setTab(n)},2800)}
  function toys(stage){
    hint(stage,'장난감을 상자에 쏙 넣어 정리해요!');say('장난감을 상자에 정리해 볼까?','Put the toys in the box!');
    stage.insertAdjacentHTML('beforeend','<div class="dropt" data-k="toy" style="left:50%;top:80%;font-size:clamp(80px,24vw,120px)">📦</div>');
    const items=['🧸','⚽','🚗','🧩','🪀','🎈'],pos=shuffle([[18,24],[50,22],[82,26],[22,50],[78,52],[50,48]]);let n=0;
    items.forEach((e,i)=>stage.insertAdjacentHTML('beforeend',`<div class="dragi" data-k="toy" style="left:${pos[i][0]}%;top:${pos[i][1]}%">${e}</div>`));
    makeDrag(stage,{onDrop:(it,t)=>{if(t.dataset.k!==it.dataset.k)return false;it.classList.add('placed','goneaway');bounce(t);sfx.pop();n++;say(CNT_KO[n-1],CNT_EN[n-1]);
      if(n===items.length)L.later(()=>done('깨끗하게 정리했어요!','All tidy!'),500);return true}});
  }
  function laundry(stage){
    hint(stage,'옷은 옷 바구니, 양말은 양말 바구니에!');say('빨래를 바구니에 나눠 담아 볼까?','Sort the laundry into the baskets!');
    const B=[['top','👕','옷','shirts'],['sock','🧦','양말','socks'],['pants','👖','바지','pants']];
    B.forEach((b,i)=>stage.insertAdjacentHTML('beforeend',`<div class="dropt" data-k="${b[0]}" style="left:${20+i*30}%;top:80%;width:28%;"><span style="font-size:clamp(60px,18vw,90px);line-height:1">🧺</span><span style="position:absolute;top:-12px;font-size:32px;background:#fff;border-radius:50%;width:48px;height:48px;display:grid;place-items:center;box-shadow:0 3px 0 rgba(46,42,79,.15)">${b[1]}</span></div>`));
    const items=[['👕','top'],['👚','top'],['🧦','sock'],['🧦','sock'],['👖','pants'],['🩳','pants']];const pos=shuffle([[15,22],[38,18],[62,22],[85,18],[28,46],[72,46]]);let n=0;
    items.forEach((e,i)=>stage.insertAdjacentHTML('beforeend',`<div class="dragi" data-k="${e[1]}" style="left:${pos[i][0]}%;top:${pos[i][1]}%">${e[0]}</div>`));
    makeDrag(stage,{onDrop:(it,t)=>{if(t.dataset.k!==it.dataset.k){say('여기가 아니야. 다시 해 볼까?','Not this one. Try again!');return false}
      const b=B.find(x=>x[0]===t.dataset.k);it.classList.add('placed','goneaway');bounce(t);sfx.pop();n++;say(b[2]+'!',cap(b[3])+'!');
      if(n===items.length)L.later(()=>done('빨래 정리 끝!','Laundry done!'),500);return true}});
  }
  function sweep(stage){
    hint(stage,'빗자루로 먼지를 쓱쓱 쓸어요!');say('빗자루로 먼지를 쓱쓱 쓸어 볼까?','Sweep away the dust!');
    eng=makeSweep(stage,{tool:'🧹',radius:70,onMove:()=>SFX.scrub(),
      onHit:it=>{it.el.classList.add('goneaway');sfx.pop()},onDone:()=>done('반짝반짝 깨끗해요!','Sparkly clean floor!')});
    const P=[[16,62],[34,74],[52,64],[70,78],[86,66],[28,88],[62,90],[46,80]];
    P.forEach(([x,y],i)=>{const d=document.createElement('div');d.className='tapi';d.style.cssText=`left:${x}%;top:${y}%;font-size:${i%3===0?40:30}px;pointer-events:none`;
      d.innerHTML=i%3===0?'🍪':'<span style="display:block;width:42px;height:30px;border-radius:50%;background:radial-gradient(circle,#B8B2C8,#8E87A3);filter:blur(.5px)"></span>';stage.appendChild(d);eng.add(d,1)});
  }
  function water(stage){
    hint(stage,'화분을 눌러서 물을 줘요! 쑥쑥 자라라~');say('화분에 물을 주면 꽃이 쑥쑥 자라요!','Water the plants and watch them grow!');
    const flowers=['🌷','🌻','🌹'],grow=['🌱','🌿'];let bloom=0;
    [20,50,80].forEach((x,i)=>{
      const pot=document.createElement('button');pot.className='tapi';pot.style.cssText=`left:${x}%;top:66%;display:flex;flex-direction:column;align-items:center;font-size:clamp(46px,13vw,66px)`;
      pot.innerHTML=`<span class="pl">🌱</span><span>🪴</span>`;let s=0;
      pot.addEventListener('pointerdown',e=>{e.preventDefault();if(s>=3)return;s++;
        const dr=document.createElement('span');dr.className='foam';dr.textContent='💧';dr.style.left=x+'%';dr.style.top='40%';stage.appendChild(dr);setTimeout(()=>dr.remove(),1000);
        noise(.35,{type:'highpass',freq:2500,vol:.12});const pl=pot.querySelector('.pl');pl.textContent=s<3?grow[s-1]:flowers[i];bounce(pot);
        if(s===3){bloom++;SFX.sparkle();say('꽃이 피었어요!','A flower bloomed!');if(bloom===3)L.later(()=>done('꽃밭이 됐어요!','A flower garden!'),700)}else say('쑥쑥!','Grow grow!')});
      stage.appendChild(pot)});
    stage.insertAdjacentHTML('beforeend','<div style="position:absolute;right:8%;top:14%;font-size:54px;animation:floaty 1.4s infinite">🚿</div>');
  }
  function setTab(t){
    L.begin();if(eng&&eng.stop)eng.stop();eng=null;tab=t;
    sec.querySelectorAll('#chTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
    const old=sec.querySelector('#chStage'),fresh=old.cloneNode(false);old.replaceWith(fresh);
    requestAnimationFrame(()=>({toys,laundry,sweep,water})[t](fresh));
  }
  sec.querySelector('#chTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setTab(b.dataset.t)});
  games[id]={enter:()=>setTab('toys'),exit:()=>{L.begin();if(eng&&eng.stop)eng.stop()}};
})();

/* =================================================================
   5. DAILY ROUTINE
   ================================================================= */
(()=>{
  const id='routine',L=life(id);
  const sec=screen(id,'하루 일과','<div class="clock" id="rtClock"></div>','<div class="kstage" id="rtStage"></div><div class="ktray" id="rtTray"></div>');
  const tray=sec.querySelector('#rtTray');let i=0,eng=null;
  const stageEl=()=>sec.querySelector('#rtStage');
  function clock(h,m,label){
    const ha=((h%12)+m/60)*30,ma=m*6;
    sec.querySelector('#rtClock').innerHTML=`<svg viewBox="-20 -20 40 40"><circle r="18" fill="#fff" stroke="#2E2A4F" stroke-width="2.5"/><line x1="0" y1="0" x2="${(9*Math.sin(ha*Math.PI/180)).toFixed(1)}" y2="${(-9*Math.cos(ha*Math.PI/180)).toFixed(1)}" stroke="#2E2A4F" stroke-width="3" stroke-linecap="round"/><line x1="0" y1="0" x2="${(14*Math.sin(ma*Math.PI/180)).toFixed(1)}" y2="${(-14*Math.cos(ma*Math.PI/180)).toFixed(1)}" stroke="#FF6F91" stroke-width="2" stroke-linecap="round"/></svg>${label}`;
  }
  function fresh(bg){const o=stageEl(),n=o.cloneNode(false);n.style.setProperty('--kbg',bg);o.replaceWith(n);return n}
  function nextBtn(){tray.innerHTML='';bigBtn(tray,'다음 ▶',()=>{i++;run()},true)}
  const hero=(u)=>charaHTML(heroData(),'',u);
  const STEPS=[
    {h:7,m:0,t:'아침 7시',bg:'linear-gradient(180deg,#FFE9B8,#FFF6DD 70%,#E8D2B0 70%)',go(s){
      s.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);font-size:110px">☀️</div><div style="position:absolute;left:50%;bottom:6%;transform:translateX(-50%)">${hero(13)}</div><div class="rt-dark"></div><button class="curtain l" aria-label="커튼"></button><button class="curtain r" aria-label="커튼"></button>`);
      hint(s,'커튼을 눌러서 열어 봐!');say('아침이에요! 커튼을 열어 볼까?','Good morning! Open the curtains!');
      const open=()=>{if(s.dataset.open)return;s.dataset.open=1;s.querySelectorAll('.curtain').forEach(c=>c.classList.add('open'));s.querySelector('.rt-dark').classList.add('off');SFX.sparkle();
        const nm=CAST.hero.name;L.later(()=>{bounce(s.querySelector('.chara'));cheer(nm?`${nm}야, 좋은 아침!`:'좋은 아침!','Good morning!');nextBtn()},900)};
      s.querySelectorAll('.curtain').forEach(c=>c.addEventListener('pointerdown',e=>{e.preventDefault();open()}));
    }},
    {h:7,m:30,t:'아침 7시 반',bg:'linear-gradient(180deg,#DDF1FB,#CBE7F5)',go(s){
      hint(s,'칫솔로 이를 쓱쓱 닦아요!');say('치카치카 양치할 시간! 칫솔로 쓱쓱 닦아 볼까?','Time to brush your teeth!');
      const box=document.createElement('div');box.className='kbox';const z=boxSize(s,.8);box.style.width=z+'px';box.style.height=z*1.1+'px';
      box.innerHTML=M.toothSVG(false)+'<canvas></canvas>';s.appendChild(box);
      const tool=document.createElement('div');tool.className='sweeptool';tool.textContent='🪥';s.appendChild(tool);
      const cv=box.querySelector('canvas');const mv=e=>{const r=s.getBoundingClientRect();tool.style.display='block';tool.style.left=(e.clientX-r.left+20)+'px';tool.style.top=(e.clientY-r.top+10)+'px'};
      cv.addEventListener('pointerdown',mv);cv.addEventListener('pointermove',mv);
      eng=makeScrub(cv,{mode:'erase',brush:.085,maskR:.36,threshold:.85,onMove:p=>{SFX.scrub();const r=cv.getBoundingClientRect(),sr=s.getBoundingClientRect();foamAt(s,p[0]+r.left-sr.left,p[1]+r.top-sr.top)},
        onDone:()=>{tool.remove();const sv=box.querySelector('.tsvg');if(sv)sv.outerHTML=M.toothSVG(true);cheer('반짝반짝 깨끗한 이!','Sparkly clean teeth!');nextBtn()}});
      eng.start();
    }},
    {h:8,m:0,t:'아침 8시',bg:'linear-gradient(180deg,#FFF3D6,#FFE7B8 62%,#E8B97A 62%)',go(s){
      hint(s,'음식을 끌어서 입에 냠냠!');say('아침 먹을 시간! 음식을 입으로 가져가 볼까?','Breakfast time! Bring the food to the mouth!');
      s.insertAdjacentHTML('beforeend',`<div class="dropt" data-k="mouth" style="left:50%;top:38%">${hero(14)}</div>`);
      const F=[['🍚','밥','rice'],['🥕','당근','carrot'],['🍳','달걀','egg'],['🥛','우유','milk']];let n=0;
      F.forEach((f,j)=>s.insertAdjacentHTML('beforeend',`<div class="dragi" data-k="mouth" data-ko="${f[1]}" data-en="${f[2]}" style="left:${14+j*24}%;top:86%">${f[0]}</div>`));
      makeDrag(s,{onDrop:(it,t)=>{it.classList.add('placed','goneaway');SFX.chomp();bounce(t.querySelector('.chara'));n++;say(`냠냠, ${it.dataset.ko}!`,`Yum, ${it.dataset.en}!`);
        if(n===F.length)L.later(()=>{cheer('잘 먹었습니다!','All done! Yummy!');nextBtn()},600);return true}});
    }},
    {h:8,m:30,t:'아침 8시 반',bg:'linear-gradient(180deg,#F3E9FF,#E6D8FF)',go(s){
      hint(s,'옷을 끌어서 입혀 줘요!');say('옷을 입어 볼까? 티셔츠, 바지, 양말, 신발!','Let\'s get dressed!');
      s.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%)">${charaHTML(Object.assign(heroData(),{color:'#E0DCEB'}),'',14)}</div>`+
        `<div class="dropt" data-k="hat" style="left:50%;top:11%;width:80px;height:60px"></div><div class="dropt" data-k="top" style="left:50%;top:52%;width:110px;height:70px"></div>`+
        `<div class="dropt" data-k="sock" style="left:50%;top:66%;width:90px;height:40px"></div>`);
      const C=[['🧢','hat','모자','hat'],['👕','top','티셔츠','T-shirt'],['🧦','sock','양말','socks']];let n=0;
      C.forEach((c,j)=>s.insertAdjacentHTML('beforeend',`<div class="dragi" data-k="${c[1]}" data-ko="${c[2]}" data-en="${c[3]}" style="left:${20+j*30}%;top:88%">${c[0]}</div>`));
      makeDrag(s,{onDrop:(it,t)=>{if(it.dataset.k!==t.dataset.k){say('거기가 아니야~','Not there!');return false}
        it.classList.add('placed');it.style.left=t.style.left;it.style.top=t.style.top;if(it.dataset.k==='top')s.querySelector('.chara').style.setProperty('--body','#FF6F91');
        sfx.pop();n++;say(it.dataset.ko+'!',cap(it.dataset.en)+'!');if(n===C.length)L.later(()=>{cheer('옷을 다 입었어요!','All dressed!');nextBtn()},500);return true}});
    }},
    {h:9,m:0,t:'아침 9시',bg:'linear-gradient(180deg,#BDE8FF,#E8F7FF 55%,#9BD67F 55%,#8CCB6F 76%,#6B6F80 76%,#6B6F80 92%,#8CCB6F 92%)',go(s){
      hint(s,'버스를 눌러서 어린이집에 가요!');say('어린이집 갈 시간! 버스를 눌러 볼까?','Time for daycare! Tap the bus!');
      s.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:24%;bottom:12%;transform:translateX(-50%)" class="rh">${hero(9)}</div><button class="bus" style="left:-40%">🚌</button><div style="position:absolute;right:6%;top:30%;font-size:70px">🏫</div>`);
      const bus=s.querySelector('.bus');L.later(()=>{bus.style.left='40%';tone(392,.15,'square',.08);tone(523,.2,'square',.08,.2)},300);
      bus.addEventListener('pointerdown',e=>{e.preventDefault();if(bus.dataset.go)return;bus.dataset.go=1;s.querySelector('.rh').style.transition='opacity .5s';s.querySelector('.rh').style.opacity=0;
        say('다녀오겠습니다! 부릉부릉!','Bye bye! Vroom vroom!');L.later(()=>{bus.style.left='120%';noise(1.4,{type:'lowpass',freq:300,vol:.2})},600);L.later(()=>{cheer('어린이집에 도착!','We are at daycare!');nextBtn()},2400)});
    }},
    {h:16,m:0,t:'오후 4시',bg:'linear-gradient(180deg,#CDEBFF,#EAF7FF 65%,#A8DE8E 65%)',go(s){
      hint(s,'놀이터에서 풍선을 콕콕 터뜨려요!');say('놀이터에서 놀아요! 풍선을 콕콕 터뜨려 볼까?','Playground time! Pop the balloons!');
      s.insertAdjacentHTML('beforeend','<div style="position:absolute;left:12%;bottom:6%;font-size:90px">🛝</div>');
      tapItems(s,[['🎈',20,26],['🎈',45,18],['🎈',70,28],['🎈',34,46],['🎈',62,48]],{onTap:(b,c)=>{noise(.12,{freq:2000,vol:.3});say(CNT_KO[c-1],CNT_EN[c-1]);return false},
        onDone:()=>L.later(()=>{cheer('신나게 놀았어요!','So much fun!');nextBtn()},400)});
    }},
    {h:19,m:0,t:'저녁 7시',bg:'linear-gradient(180deg,#DDF6FF,#BFE8F8)',go(s){
      hint(s,'거품을 콕콕! 오리도 눌러 봐!');say('목욕할 시간! 거품을 콕콕 터뜨려 볼까?','Bath time! Pop the bubbles!');
      s.insertAdjacentHTML('beforeend','<div style="position:absolute;left:50%;bottom:4%;transform:translateX(-50%);font-size:clamp(120px,36vw,190px);line-height:1">🛁</div>');
      const duck=document.createElement('button');duck.className='tapi';duck.textContent='🦆';duck.style.cssText='left:72%;top:58%';duck.addEventListener('pointerdown',e=>{e.preventDefault();bounce(duck);sweepTone(900,1400,.15,'square',.08);sweepTone(1400,900,.15,'square',.08,.15);say('꽥꽥!','Quack quack!')});s.appendChild(duck);
      const B=[];for(let j=0;j<7;j++)B.push(['🫧',14+Math.random()*72,14+Math.random()*44,40+rand(24)]);
      tapItems(s,B,{onTap:(b,c)=>{tone(1200+c*80,.07,'sine',.2);say(CNT_KO[c-1],CNT_EN[c-1]);return false},onDone:()=>L.later(()=>{cheer('보송보송 깨끗해요!','Squeaky clean!');nextBtn()},400)});
    }},
    {h:20,m:0,t:'밤 8시',bg:'linear-gradient(180deg,#3B2F7A,#5A4BA8 70%,#4A3D8A 70%)',go(s){
      hint(s,'불을 끄고 잘 자요!');say('잘 시간이에요. 불을 꺼 볼까?','Bedtime. Turn off the light!');
      s.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:50%;bottom:8%;transform:translateX(-50%);display:flex;align-items:flex-end;gap:6px"><span style="font-size:90px">🛏️</span>${hero(9)}</div><div style="position:absolute;right:10%;top:10%;font-size:50px">🌙</div><div class="rt-dark off" style="background:rgba(10,8,40,.6)"></div>`);
      const lamp=document.createElement('button');lamp.className='tapi kpulse';lamp.textContent='💡';lamp.style.cssText='left:22%;top:34%;border-radius:50%';s.appendChild(lamp);
      lamp.addEventListener('pointerdown',e=>{e.preventDefault();if(lamp.dataset.off)return;lamp.dataset.off=1;lamp.classList.remove('kpulse');s.querySelector('.rt-dark').classList.remove('off');
        for(let j=0;j<10;j++)s.insertAdjacentHTML('beforeend',`<span style="position:absolute;left:${rand(90)+5}%;top:${rand(40)+4}%;font-size:${14+rand(14)}px;z-index:8;animation:floaty ${1+Math.random()*2}s infinite">⭐</span>`);
        const T=[0,0,4,4,5,5,4,3,3,2,2,1,1,0],N=[261.63,293.66,329.63,349.23,392,440];T.forEach((n,j)=>tone(N[n],.7,'sine',.16,j*.6+(j>=7?.3:0)));
        const nm=CAST.hero.name;L.later(()=>{say(nm?`잘 자요, ${nm} 공주!`:'잘 자요!','Good night!');confetti(10)},600);
        L.later(()=>{tray.innerHTML='';bigBtn(tray,'새로운 하루 ☀️',()=>{i=0;run()})},9200)});
    }}
  ];
  function run(){
    L.begin();if(eng&&eng.stop)eng.stop();eng=null;tray.innerHTML='';const S2=STEPS[i];clock(S2.h,S2.m,S2.t);
    const s=fresh(S2.bg);requestAnimationFrame(()=>S2.go(s));
  }
  games[id]={enter:()=>{i=0;run()},exit:()=>{L.begin();if(eng&&eng.stop)eng.stop()}};
})();

/* =================================================================
   6. JOB DRESS-UP
   ================================================================= */
(()=>{
  const id='jobdress',L=life(id);
  const sec=screen(id,'직업 옷 입기','<button class="round" id="jdFace" aria-label="얼굴 바꾸기">😊</button>','<div class="kstage jobstage" id="jdStage"></div><div class="ktray scroll" id="jdTray"></div>');
  const stage=sec.querySelector('#jdStage'),tray=sec.querySelector('#jdTray');
  const FACES=['baby','mom','dad','🐰','🐻','🐱'];let fi=0,job=JOBS[0];
  function show(speak){
    const u=Math.max(9,Math.min(17,stage.clientHeight/22));
    stage.innerHTML=jobChara(job,faceOf(FACES[fi]),u.toFixed(1))+`<span class="veh">${job.veh}</span>`;
    const c=stage.querySelector('.chara');bounce(c);
    if(speak){say(job.line[0],job.line[1]);if(job.siren)siren(job.siren,1.6);else SFX.sparkle()}
  }
  JOBS.forEach(j=>chip(tray,j.icon,j.ko,()=>{job=j;show(true)}));
  sec.querySelector('#jdFace').onclick=()=>{fi=(fi+1)%FACES.length;sfx.pop();show(false);const f=faceOf(FACES[fi]);if(f.ko)say(f.ko+'!',cap(f.en)+'!')};
  games[id]={enter:()=>{L.begin();requestAnimationFrame(()=>{show(false);say('어떤 일을 하고 싶어? 옷을 골라 봐!','What job do you want? Pick an outfit!')})},exit:()=>L.begin(),resize:()=>show(false)};
})();

/* =================================================================
   7. JOB MATCH (worker ↔ vehicle)
   ================================================================= */
(()=>{
  const id='jobmatch',L=life(id);
  const sec=screen(id,'짝 맞추기','','<div class="kstage jobstage" id="jmStage"></div>');
  let stage=sec.querySelector('#jmStage');
  function round(){
    L.begin();const o=sec.querySelector('#jmStage'),s=o.cloneNode(false);o.replaceWith(s);stage=s;
    const set=shuffle(JOBS.slice()).slice(0,3),order=shuffle([0,1,2]);let n=0;
    hint(s,'누가 무엇을 탈까? 끌어서 짝을 맞춰 봐!');say('누가 무엇을 탈까? 짝을 맞춰 봐!','Who rides what? Match them!');
    set.forEach((j,k)=>s.insertAdjacentHTML('beforeend',`<div class="dropt" data-k="${j.id}" style="left:${20+k*30}%;top:34%;font-size:clamp(64px,18vw,100px);line-height:1;flex-direction:column"><span>${j.veh}</span><span style="font-size:15px;background:#fff;border-radius:999px;padding:2px 8px">${j.vko}</span></div>`));
    set.forEach((j,k)=>s.insertAdjacentHTML('beforeend',`<div class="dragi" data-k="${j.id}" style="left:${20+order[k]*30}%;top:78%">${j.icon}</div>`));
    makeDrag(s,{onTap:it=>{const j=JOBS.find(x=>x.id===it.dataset.k);bounce(it);say(j.ko+'!',cap(j.en)+'!')},
      onDrop:(it,t)=>{const j=JOBS.find(x=>x.id===it.dataset.k);
        if(it.dataset.k!==t.dataset.k){say(`${josa(j.ko,'은','는')} 다른 걸 타요~`,'Try another one!');return false}
        it.classList.add('placed');it.style.left=t.style.left;it.style.top=(parseFloat(t.style.top)-10)+'%';bounce(t);n++;
        say(`${josa(j.ko,'은','는')} ${j.vko}!`,`${cap(j.en)}, ${j.ven}!`);if(j.siren)siren(j.siren,1.2);else sfx.ding();
        if(n===3)L.later(()=>{cheer('짝을 다 맞췄어요!','All matched!');L.later(round,2800)},900);return true}});
  }
  games[id]={enter:round,exit:()=>L.begin()};
})();

/* =================================================================
   8. DISPATCH (출동!)
   ================================================================= */
(()=>{
  const id='dispatch',L=life(id);
  const sec=screen(id,'출동 놀이','<div class="seg" id="dpTabs"><button data-t="fire" class="on">🔥</button><button data-t="amb">🩹</button><button data-t="police">🐶</button></div>','<div class="kstage road" id="dpStage"></div>');
  let eng=null,tab='fire';
  function fresh(){const o=sec.querySelector('#dpStage'),s=o.cloneNode(false);o.replaceWith(s);return s}
  function arrive(s,job,cb){
    s.insertAdjacentHTML('beforeend',`<div class="driver flipx" style="left:-40%">${job.veh}</div>`);const d=s.querySelector('.driver');siren(job.siren,2.2);
    L.later(()=>{d.style.left='4%'},80);
    L.later(()=>{s.insertAdjacentHTML('beforeend',`<div style="position:absolute;left:30%;bottom:6%;z-index:5">${jobChara(job,faceOf('baby'),8)}</div>`);cb()},1900);
  }
  function fire(){
    const s=fresh(),job=JOBS[0];s.insertAdjacentHTML('beforeend','<div class="house">🏠</div>');
    hint(s,'불이 났어요! 소방차 출동!');say('큰일이야, 불이 났어요! 소방차 출동!','Fire! Fire truck, go!');
    const P=[[38,30],[60,28],[44,46],[64,48],[52,36]];const fires=P.map(([x,y])=>{const f=document.createElement('div');f.className='tapi wob';f.style.cssText=`left:${x}%;top:${y}%;pointer-events:none;font-size:clamp(40px,11vw,60px);transition:font-size .2s`;f.textContent='🔥';s.appendChild(f);return f});
    arrive(s,job,()=>{hint(s,'손가락으로 물을 쏴서 불을 꺼요!');say('손가락으로 물을 쏴서 불을 꺼 보자!','Spray water to put out the fire!');
      eng=makeSweep(s,{tool:'💦',radius:70,onMove:()=>noise(.15,{type:'highpass',freq:1800,vol:.12}),
        onHit:it=>{if(it.hp>0){it.el.style.fontSize='34px';noise(.2,{freq:600,vol:.2})}else{it.el.classList.remove('wob');it.el.classList.add('goneaway');sfx.pop()}},
        onDone:()=>L.later(()=>{s.insertAdjacentHTML('beforeend','<div class="tapi" style="left:50%;top:22%;pointer-events:none">😊</div>');cheer('불이 다 꺼졌어요! 고마워요, 소방관!','The fire is out! Thank you, firefighter!')},300)});
      fires.forEach(f=>eng.add(f,2))});
  }
  function amb(){
    const s=fresh(),job=JOBS[2];const pat=pick([['🐻','곰'],['🐰','토끼'],['🐶','강아지'],['🐼','판다']]);
    s.insertAdjacentHTML('beforeend',`<div class="house" style="font-size:clamp(150px,42vw,230px)">${pat[0]}</div>`);
    hint(s,'친구가 다쳤어요! 구급차 출동!');say(`${josa(pat[1],'이','가')} 다쳤어요! 구급차 출동!`,'Our friend is hurt! Ambulance, go!');
    arrive(s,job,()=>{hint(s,'아픈 곳에 반창고를 붙여 줘요!');say('아픈 곳을 콕 눌러서 반창고를 붙여 주자!','Tap the boo-boos to put on bandages!');
      const P=[[38,34],[62,36],[44,54],[58,56]];
      tapItems(s,P.map(([x,y])=>['🔴',x,y,30]),{wob:false,onTap:(b,c)=>{b.textContent='🩹';b.style.fontSize='40px';sfx.pop();say(CNT_KO[c-1],CNT_EN[c-1]);return true},
        onDone:()=>L.later(()=>{SFX.sparkle();cheer('이제 안 아파요! 고마워요, 의사 선생님!','All better! Thank you, doctor!')},500)})});
  }
  function police(){
    const s=fresh(),job=JOBS[1];s.style.setProperty('--kbg','linear-gradient(180deg,#CDEBFF,#EAF7FF 40%,#A8DE8E 40%,#8FD07A)');
    hint(s,'강아지를 잃어버렸어요! 경찰차 출동!');say('강아지를 잃어버렸어요! 경찰차 출동!','A lost puppy! Police car, go!');
    s.insertAdjacentHTML('beforeend','<div style="position:absolute;right:6%;top:18%;font-size:60px">🧒</div>');
    arrive(s,job,()=>{hint(s,'나무를 눌러서 강아지를 찾아 봐!');say('강아지가 어디 숨었을까? 나무를 눌러 봐!','Where is the puppy? Tap the trees!');
      const P=[[24,36],[50,30],[76,38],[36,58],[66,60]],win=rand(P.length),others=['🐦','🦋','🐿️','🐞'];let found=false;
      P.forEach(([x,y],k)=>{const b=document.createElement('button');b.className='tapi';b.textContent='🌳';b.style.cssText=`left:${x}%;top:${y}%;font-size:clamp(60px,17vw,90px)`;
        b.addEventListener('pointerdown',e=>{e.preventDefault();if(found||b.dataset.done)return;b.dataset.done=1;
          if(k===win){found=true;b.textContent='🐶';bounce(b);sweepTone(700,1100,.15,'square',.08);say('멍멍! 찾았다!','Woof! Found it!');L.later(()=>cheer('강아지를 찾아 줬어요! 고마워요, 경찰관!','You found the puppy! Thank you, officer!'),700)}
          else{b.textContent=others[k%others.length];bounce(b);sfx.soft();say('여기는 없네~','Not here!')}});s.appendChild(b)});
    });
  }
  function setTab(t){L.begin();if(eng&&eng.stop)eng.stop();eng=null;tab=t;sec.querySelectorAll('#dpTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));({fire,amb,police})[t]()}
  sec.querySelector('#dpTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.t)});
  games[id]={enter:()=>setTab(tab),exit:()=>{L.begin();if(eng&&eng.stop)eng.stop()}};
})();

/* =================================================================
   9. PRINCESS / PRINCE DRESS-UP
   ================================================================= */
(()=>{
  const id='dressup',L=life(id);
  const sec=screen(id,'공주 왕자 옷 입기','<button class="round" id="duMirror" aria-label="거울 보기">🪞</button><button class="round" id="duSnap" aria-label="사진 찍기">📸</button>',
    '<div class="kstage dressstage" id="duStage"></div><div class="seg" id="duTabs" style="align-self:center"><button data-t="face" class="on">얼굴</button><button data-t="dress">옷</button><button data-t="color">색깔</button><button data-t="head">머리</button><button data-t="hand">소품</button><button data-t="closet">옷장</button></div><div class="ktray scroll" id="duTray"></div>');
  const stage=sec.querySelector('#duStage'),tray=sec.querySelector('#duTray');
  const FACES=[['baby','우리 아기','our baby'],['mom','엄마','mommy'],['dad','아빠','daddy'],['👸','장미 공주','Rose princess'],['👸🏻','눈꽃 공주','Snow princess'],['👸🏽','햇님 공주','Sunny princess'],
    ['🤴','별 왕자','Star prince'],['🤴🏻','달 왕자','Moon prince'],['🤴🏽','바다 왕자','Ocean prince'],['🧚','요정','fairy'],['🧜‍♀️','인어 공주','mermaid'],['🐰','토끼 공주','bunny princess'],['🐻','곰 왕자','bear prince'],['🐱','고양이 공주','kitty princess']];
  const DRESS=[['gown','드레스','ball gown'],['tutu','발레복','tutu'],['mermaid','인어 드레스','mermaid dress'],['suit','왕자 옷','prince suit'],['cape','망토','cape']];
  const COLORS=[['#FF8FB1','분홍','pink'],['#FF5A5F','빨강','red'],['#FFC93C','노랑','yellow'],['#7ED957','초록','green'],['#5EC2FF','하늘','sky blue'],['#3E63DD','파랑','blue'],['#B57CFF','보라','purple'],['#FFFFFF','하양','white'],['#2E2A4F','검정','black']];
  const PATS=[['','민무늬','plain'],['radial-gradient(circle,rgba(255,255,255,.9) 3px,transparent 4px) 0 0/16px 16px','물방울','polka dots'],['repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 8px,transparent 8px 16px)','줄무늬','stripes'],['radial-gradient(circle,rgba(255,255,255,.95) 1.5px,transparent 2px) 0 0/9px 9px','반짝이','glitter']];
  const HEAD=[['👑','왕관','crown'],['🎀','리본','ribbon'],['🌸','꽃','flower'],['🎩','모자','top hat'],['👒','밀짚모자','sun hat'],['','없음','none']];
  const HAND=[['🪄','요술봉','magic wand'],['💐','꽃다발','bouquet'],['🧸','곰인형','teddy bear'],['🌂','우산','umbrella'],['🍭','사탕','lollipop'],['👜','가방','bag'],['','없음','none']];
  const D={face:'baby',dress:'gown',color:'#FF8FB1',pat:'',head:'👑',hand:'🪄',cape:false,pdress:null};let tab='face';
  function render(){
    const fa=faceOf(D.face),u=Math.max(8,Math.min(16,stage.clientHeight/24)).toFixed(1);
    const fc=fa.photo?`<span class="face" style="${faceBg(fa)}"></span>`:`<span class="face">${fa.emoji==='👶'?'🙂':fa.emoji}</span>`;
    const st=D.dress==='cape'?'suit':D.dress;
    const pd=D.pdress&&M.closet?M.closet().find(c=>c.id===D.pdress):null;
    const dressEl=pd?`<img class="pdress" src="${pd.img}" alt="">`:`<span class="dress ${st}"></span>`;
    stage.innerHTML=`<div class="doll ${st==='suit'&&!pd?'suitlegs':''}" style="--u:${u}px;--dc:${D.color};--pat:${D.pat||'none'};--cc:${D.color==='#FFFFFF'?'#C62828':D.color}">${D.cape&&!pd?'<span class="cape"></span>':''}${D.head?`<span class="dhead">${D.head}</span>`:''}${fc}${dressEl}${D.hand?`<span class="hand">${D.hand}</span>`:''}<span class="legs"><i></i><i></i></span><span class="shoes"><i></i><i></i></span></div>`;
  }
  function pop(){const d=stage.querySelector('.doll');if(d){d.classList.remove('bounce');void d.offsetWidth;d.classList.add('bounce')}SFX.sparkle()}
  function fill(){
    tray.innerHTML='';
    if(tab==='face')FACES.forEach(f=>{const fa=faceOf(f[0]);const b=document.createElement('button');b.className='facebtn'+(D.face===f[0]?' on':'');
      if(fa.photo)b.style.backgroundImage=`url(${fa.photo})`;else b.textContent=fa.emoji;b.setAttribute('aria-label',f[1]);
      b.onclick=()=>{D.face=f[0];render();pop();fill();say(f[1]+'!',cap(f[2])+'!')};tray.appendChild(b)});
    if(tab==='closet'){
      const C=M.closet?M.closet():[],have=M.stamps?M.stamps():0;
      if(!C.length){tray.innerHTML='<span class="hint" style="padding:0 8px">어른이 ⭐ 칭찬 도장판 → 우리 옷장에서 진짜 드레스 사진을 넣어 주면 여기에 나와요.</span>';return}
      C.forEach(c=>{const lock=have<c.need;const b=document.createElement('button');b.className='facebtn closetbtn'+(D.pdress===c.id?' on':'')+(lock?' locked':'');
        b.innerHTML=`<img src="${c.img}" alt="">${lock?`<span class="lk">🔒${c.need}</span>`:''}`;b.setAttribute('aria-label',c.name||'드레스');
        b.onclick=()=>{bounce(b);if(lock){sfx.soft();say(`칭찬 도장 ${c.need}개를 모으면 입을 수 있어요! 지금은 ${have}개!`,`Collect ${c.need} stamps to wear this! You have ${have}.`);return}
          D.pdress=c.id;render();pop();fill();say(`${c.name||'우리 집 드레스'}!`,'Our real dress!')};tray.appendChild(b)});
      return;
    }
    if(tab==='dress')DRESS.forEach(d=>chip(tray,{gown:'👗',tutu:'🩰',mermaid:'🧜‍♀️',suit:'🤵',cape:'🦸'}[d[0]],d[1],()=>{D.pdress=null;if(d[0]==='cape'){D.cape=!D.cape;if(D.dress==='gown'||D.dress==='tutu'||D.dress==='mermaid')D.dress='suit'}else{D.dress=d[0];if(d[0]!=='suit')D.cape=false}render();pop();say(d[1]+'!',cap(d[2])+'!')}));
    if(tab==='color'){COLORS.forEach(c=>chip(tray,'',c[1],()=>{D.color=c[0];render();pop();say(c[1]+'!',cap(c[2])+'!')},c[0]));
      PATS.forEach(p=>chip(tray,'',p[1],()=>{D.pat=p[0];render();pop();say(p[1]+'!',cap(p[2])+'!')},p[0]?`${p[0]},#B57CFF`:'#B57CFF'))}
    if(tab==='head')HEAD.forEach(h=>chip(tray,h[0]||'🚫',h[1],()=>{D.head=h[0];render();pop();say(h[1]+'!',cap(h[2])+'!')}));
    if(tab==='hand')HAND.forEach(h=>chip(tray,h[0]||'🚫',h[1],()=>{D.hand=h[0];render();pop();say(h[1]+'!',cap(h[2])+'!')}));
  }
  sec.querySelector('#duTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.t;sec.querySelectorAll('#duTabs button').forEach(x=>x.classList.toggle('on',x===b));fill()});
  sec.querySelector('#duMirror').onclick=()=>{const d=stage.querySelector('.doll');if(!d)return;d.classList.remove('twirl');void d.offsetWidth;d.classList.add('twirl');SFX.sparkle();confetti(14);
    const prince=D.dress==='suit'||/🤴|dad|🐻/.test(D.face);say(prince?'우와, 멋진 왕자님!':'우와, 예쁜 공주님!',prince?'Wow, what a handsome prince!':'Wow, what a beautiful princess!')};
  sec.querySelector('#duSnap').onclick=()=>{const f=document.createElement('div');f.className='flash';document.body.appendChild(f);setTimeout(()=>f.remove(),520);SFX.shutter();say('찰칵! 김치~','Click! Say cheese!')};
  games[id]={enter:()=>{L.begin();requestAnimationFrame(()=>{render();fill();say('누구 옷을 입혀 볼까?','Who shall we dress up?')})},exit:()=>L.begin(),resize:render};
})();

/* =================================================================
   10. MAKEUP
   ================================================================= */
(()=>{
  const id='makeup',L=life(id);
  const sec=screen(id,'화장 놀이','<button class="round" id="mkFace" aria-label="얼굴 바꾸기">🔄</button><button class="round" id="mkMirror" aria-label="거울 보기">🪞</button><button class="round holdbtn" id="mkClear" aria-label="다 지우기, 1초 길게 누르기">🧽</button>',
    '<div class="kstage mkstage" id="mkStage"></div><div class="ktray scroll" id="mkTools"></div><div class="ktray scroll" id="mkColors" style="min-height:70px"></div>');
  const stage=sec.querySelector('#mkStage'),tools=sec.querySelector('#mkTools'),colors=sec.querySelector('#mkColors');
  const FACES=[['mom','엄마','mommy'],['baby','우리 아기','baby'],['dad','아빠','daddy'],['👸','공주','princess'],['🐱','고양이','kitty'],['🐶','강아지','puppy'],['🐰','토끼','bunny'],['🐼','판다','panda']];
  const TOOLS=[['lip','💄','립스틱','lipstick'],['blush','🌸','볼터치','blush'],['shadow','🎨','아이섀도','eye shadow'],['brow','✏️','눈썹','eyebrow pencil'],['glitter','✨','반짝이','glitter'],['sticker','⭐','스티커','stickers'],['acc','🎀','액세서리','accessories'],['wipe','🧻','물티슈','wipe']];
  const PAL={lip:[['#E53950','빨강','red'],['#FF6F91','분홍','pink'],['#FF8A65','코랄','coral'],['#B5179E','자주','berry']],blush:[['#FF8FB1','분홍','pink'],['#FFA07A','살구','peach']],
    shadow:[['#B57CFF','보라','purple'],['#5EC2FF','하늘','sky blue'],['#FFC93C','금색','gold'],['#7ED957','초록','green']],brow:[['#5A3A22','갈색','brown'],['#2E2A4F','검정','black']],
    glitter:[['#FFD700','금색','gold'],['#C0C0FF','은색','silver'],['#FF8FB1','분홍','pink']],sticker:[['❤️','하트','heart'],['⭐','별','star'],['🌸','꽃','flower'],['🦋','나비','butterfly']],
    acc:[['👓','안경','glasses'],['🕶️','선글라스','sunglasses'],['🎀','리본','ribbon'],['👑','왕관','crown'],['🌸','꽃핀','flower clip'],['💎','보석','jewel'],['🎩','모자','hat'],['🐰','토끼 귀','bunny ears']],wipe:[]};
  let fi=0,tool='lip',color=PAL.lip[1][0],cv=null,g=null,face=null,S2=0,last={},acc=null;
  function build(){
    const f=FACES[fi],fa=faceOf(f[0]);S2=Math.round(Math.min(stage.clientWidth*.82,stage.clientHeight*.82));
    stage.innerHTML=`<div class="mkface" style="width:${S2}px;height:${S2}px;${faceBg(fa)}">${fa.photo?'':`<span class="emo" style="font-size:${S2*.8}px">${fa.emoji==='👶'?'🙂':fa.emoji}</span>`}<canvas></canvas></div>`;
    face=stage.querySelector('.mkface');cv=face.querySelector('canvas');g=cv.getContext('2d');const dpr=window.devicePixelRatio||1;cv.width=S2*dpr;cv.height=S2*dpr;g.setTransform(dpr,0,0,dpr,0,0);
    bind();
  }
  function puff(x,y,r,c,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,hexA(c,a));gr.addColorStop(1,hexA(c,0));g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
  function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
  function paint(a,b){
    const d=Math.hypot(b[0]-a[0],b[1]-a[1]);g.save();
    if(tool==='lip'||tool==='brow'){g.strokeStyle=hexA(color,tool==='lip'?.8:.85);g.lineWidth=S2*(tool==='lip'?.04:.014);g.lineCap='round';g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}
    else if(tool==='blush'||tool==='shadow'){const st=Math.max(1,Math.floor(d/6));for(let k=0;k<=st;k++){const t=k/st;puff(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,S2*(tool==='blush'?.075:.05),color,tool==='blush'?.1:.14)}}
    else if(tool==='glitter'){for(let k=0;k<4;k++){g.fillStyle=k%2?'#FFFFFF':color;g.beginPath();g.arc(b[0]+(Math.random()-.5)*S2*.06,b[1]+(Math.random()-.5)*S2*.06,1+Math.random()*2.4,0,Math.PI*2);g.fill()}}
    else if(tool==='wipe'){g.globalCompositeOperation='destination-out';g.lineWidth=S2*.1;g.lineCap='round';g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}
    g.restore();
  }
  function bind(){
    const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*S2/r.width,(e.clientY-r.top)*S2/r.height]};
    cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=pos(e);
      if(tool==='sticker'){g.font=`${S2*.11}px ${EMOJI_FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(color,p[0],p[1]);sfx.pop();return}
      if(tool==='acc'){addAcc(color,p[0],p[1]);return}
      try{cv.setPointerCapture(e.pointerId)}catch(_){}last[e.pointerId]=p;paint(p,[p[0]+.5,p[1]+.5])});
    cv.addEventListener('pointermove',e=>{const l=last[e.pointerId];if(!l)return;const p=pos(e);paint(l,p);last[e.pointerId]=p;if(Math.random()<.08)tool==='wipe'?noise(.1,{freq:2000,vol:.08}):tone(1400+rand(600),.04,'sine',.05)});
    const end=e=>{delete last[e.pointerId]};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  }
  function addAcc(e,x,y){
    if(face.querySelectorAll('.acc').length>=12)return;
    const a=document.createElement('div');a.className='acc';a.textContent=e;a.style.left=(x/S2*100)+'%';a.style.top=(y/S2*100)+'%';a.style.fontSize=(S2*.2)+'px';face.appendChild(a);bounce(a);sfx.pop();
    let d=null;
    a.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();try{a.setPointerCapture(ev.pointerId)}catch(_){}d={id:ev.pointerId,sx:ev.clientX,sy:ev.clientY,m:false};a.classList.add('lift')});
    a.addEventListener('pointermove',ev=>{if(!d||d.id!==ev.pointerId)return;if(Math.hypot(ev.clientX-d.sx,ev.clientY-d.sy)>8)d.m=true;const r=face.getBoundingClientRect();
      a.style.left=Math.max(-10,Math.min(110,(ev.clientX-r.left)/r.width*100))+'%';a.style.top=Math.max(-10,Math.min(110,(ev.clientY-r.top)/r.height*100))+'%'});
    const up=ev=>{if(!d||d.id!==ev.pointerId)return;const m=d.m;d=null;a.classList.remove('lift');if(!m){a.classList.add('goneaway');setTimeout(()=>a.remove(),450);sfx.soft()}};
    a.addEventListener('pointerup',up);a.addEventListener('pointercancel',up);
  }
  function fillTools(){
    tools.innerHTML='';TOOLS.forEach(t=>{const b=chip(tools,t[1],t[2],()=>{tool=t[0];fillTools();fillColors();say(t[2]+'!',cap(t[3])+'!')});if(t[0]===tool)b.querySelector('.dot').style.boxShadow='0 0 0 4px var(--ink)'});
  }
  function fillColors(){
    colors.innerHTML='';const P=PAL[tool];if(!P.length){colors.innerHTML='<span class="hint">문질러서 지워요</span>';return}
    if(!P.some(p=>p[0]===color))color=P[0][0];
    P.forEach(p=>{const emo=!p[0].startsWith('#');const b=chip(colors,emo?p[0]:'',p[1],()=>{color=p[0];fillColors();say(p[1]+'!',cap(p[2])+'!')},emo?'var(--paper)':p[0]);
      if(p[0]===color)b.querySelector('.dot').style.boxShadow='0 0 0 4px var(--ink)'});
  }
  sec.querySelector('#mkFace').onclick=()=>{fi=(fi+1)%FACES.length;build();sfx.pop();say(FACES[fi][1]+'!',cap(FACES[fi][2])+'!')};
  sec.querySelector('#mkMirror').onclick=()=>{confetti(12);SFX.sparkle();bounce(face);say('우와, 정말 예쁘다!','Wow, so pretty!')};
  hold(sec.querySelector('#mkClear'),1000,()=>{build();noise(.3,{freq:1500,vol:.2});say('깨끗하게 지웠어요!','All clean!')});
  games[id]={enter:()=>{L.begin();requestAnimationFrame(()=>{build();fillTools();fillColors();say('누구를 예쁘게 꾸며 볼까? 립스틱부터 발라 봐!','Let\'s do makeup! Try the lipstick!')})},exit:()=>L.begin()};
})();

/* =================================================================
   11. NAILS
   ================================================================= */
(()=>{
  const id='nails',L=life(id);
  const sec=screen(id,'손톱 꾸미기','<div class="seg" id="nlHand"><button data-h="mom" class="on">엄마 손</button><button data-h="baby">아기 손</button></div>','<div class="kstage nailstage" id="nlStage"></div><div class="ktray scroll" id="nlTray"></div>');
  const stage=sec.querySelector('#nlStage'),tray=sec.querySelector('#nlTray');
  const PAINT=[['#FF5A7A','빨강','red'],['#FF8FB1','분홍','pink'],['#B57CFF','보라','purple'],['#5EC2FF','하늘','sky blue'],['#7ED957','초록','green'],['#FFC93C','노랑','yellow'],['url(#nglit)','반짝이','glitter'],['url(#nrain)','무지개','rainbow'],['url(#ndot)','물방울','polka dots']];
  const STK=[['⭐','별','star'],['❤️','하트','heart'],['🌸','꽃','flower'],['💎','보석','jewel']];
  const FN=[['엄지','thumb'],['검지','pointer finger'],['중지','middle finger'],['약지','ring finger'],['새끼','pinky']];
  let hand='mom',paint=PAINT[1],stk=null,painted=[];
  const F=[{x:44,y:178,w:44,h:96,r:-38,nx:0,ny:-30},{x:86,y:58,w:42,h:150,r:-6},{x:134,y:36,w:44,h:170,r:0},{x:184,y:52,w:42,h:156,r:6},{x:228,y:96,w:36,h:124,r:14}];
  function svgHand(){
    const skin=hand==='mom'?'#FFD8BE':'#FFE3CF';
    let s=`<svg viewBox="0 0 300 380" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(${hand==='mom'?1:.82});width:min(92%,${Math.round(stage.clientHeight*.82)}px);height:auto;overflow:visible">
      <defs><pattern id="nglit" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#FFB3D1"/><circle cx="2" cy="2" r="1.3" fill="#fff"/><circle cx="6" cy="6" r="1" fill="#FFD700"/></pattern>
      <linearGradient id="nrain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A7A"/><stop offset=".35" stop-color="#FFC93C"/><stop offset=".65" stop-color="#7ED957"/><stop offset="1" stop-color="#5EC2FF"/></linearGradient>
      <pattern id="ndot" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#5EC2FF"/><circle cx="5" cy="5" r="2.2" fill="#fff"/></pattern>
      <filter id="nshine"><feGaussianBlur stdDeviation=".3"/></filter></defs>
      <rect x="62" y="190" width="190" height="180" rx="70" fill="${skin}"/>`;
    F.forEach((f,i)=>{
      s+=`<g transform="rotate(${f.r} ${f.x+f.w/2} ${f.y+f.h})"><rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h+40}" rx="${f.w/2}" fill="${skin}"/>`+
        `<rect class="nail" data-i="${i}" x="${f.x+7}" y="${f.y+8}" width="${f.w-14}" height="${Math.min(46,f.h*.34)}" rx="${(f.w-14)/2}" fill="${painted[i]?painted[i].c:'#FFF4EE'}"/>`+
        `<ellipse cx="${f.x+f.w/2-5}" cy="${f.y+20}" rx="3" ry="7" fill="rgba(255,255,255,.7)" pointer-events="none"/>`+
        (painted[i]&&painted[i].s?`<text x="${f.x+f.w/2}" y="${f.y+8+Math.min(46,f.h*.34)/2}" font-size="20" text-anchor="middle" dominant-baseline="central" pointer-events="none">${painted[i].s}</text>`:'')+'</g>';
    });
    return s+'</svg>';
  }
  function render(){stage.innerHTML=svgHand()}
  function fillTray(){
    tray.innerHTML='';
    PAINT.forEach(p=>{const bg=p[0].startsWith('url')?{['url(#nglit)']:'radial-gradient(circle,#fff 2px,transparent 3px) 0 0/8px 8px,#FFB3D1',['url(#nrain)']:'linear-gradient(#FF5A7A,#FFC93C,#7ED957,#5EC2FF)',['url(#ndot)']:'radial-gradient(circle,#fff 3px,transparent 4px) 0 0/12px 12px,#5EC2FF'}[p[0]]:p[0];
      const b=chip(tray,'💅',p[1],()=>{paint=p;stk=null;fillTray();say(p[1]+'!',cap(p[2])+'!')},bg);if(paint===p&&!stk)b.querySelector('.dot').style.boxShadow='0 0 0 4px var(--ink)'});
    STK.forEach(t=>{const b=chip(tray,t[0],t[1],()=>{stk=t;fillTray();say(t[1]+' 스티커!',cap(t[2])+' sticker!')});if(stk===t)b.querySelector('.dot').style.boxShadow='0 0 0 4px var(--ink)'});
  }
  stage.addEventListener('pointerdown',e=>{
    const n=e.target.closest('.nail');if(!n)return;e.preventDefault();const i=+n.dataset.i;
    if(stk){if(!painted[i])painted[i]={c:'#FFF4EE'};painted[i].s=stk[0];sfx.pop();say(stk[1]+'!',cap(stk[2])+'!')}
    else{const first=!painted[i]||painted[i].c==='#FFF4EE';painted[i]=Object.assign({},painted[i],{c:paint[0]});tone(900+i*120,.12,'sine',.15);say(`${FN[i][0]} 손톱, ${paint[1]}!`,`${cap(FN[i][1])}, ${paint[2]}!`);void first}
    render();
    if(painted.filter(p=>p&&p.c!=='#FFF4EE').length===5&&!stage.dataset.fan){stage.dataset.fan=1;L.later(()=>{bigBtn(tray,'후~ 말리기 🌬️',dry)},500)}
  });
  function dry(){noise(1.2,{type:'lowpass',freq:900,vol:.25});SFX.sparkle();confetti(16);say('후~ 반짝반짝 예쁜 손톱 완성!','Blow blow! Sparkly nails!');
    L.later(()=>{fillTray();bigBtn(tray,'새로 칠하기 🔄',()=>{painted=[];delete stage.dataset.fan;render();fillTray()})},1500)}
  sec.querySelector('#nlHand').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;hand=b.dataset.h;sec.querySelectorAll('#nlHand button').forEach(x=>x.classList.toggle('on',x===b));painted=[];delete stage.dataset.fan;render();fillTray()});
  games[id]={enter:()=>{L.begin();painted=[];delete stage.dataset.fan;requestAnimationFrame(()=>{render();fillTray();say('손톱에 예쁜 색을 칠해 볼까? 손톱을 콕 눌러 봐!','Let\'s paint the nails! Tap a nail!')})},exit:()=>L.begin(),resize:render};
})();

/* =================================================================
   12. FUN SOUNDS
   ================================================================= */
(()=>{
  const id='sounds';
  const sec=screen(id,'소리 놀이','','<div class="sgrid" id="sgGrid"></div>');
  const SND=[
    ['🚒','소방차','삐뽀삐뽀!','Nee-naw!','var(--berry)',()=>siren('fire',1.6)],
    ['🚓','경찰차','왱왱!','Wee-woo!','var(--soda)',()=>siren('police',1.6)],
    ['🚑','구급차','삐뽀삐뽀!','Nee-naw!','#F7FAFF',()=>siren('amb',1.6)],
    ['🚂','기차','칙칙폭폭!','Choo choo!','var(--peach)',()=>{for(let i=0;i<4;i++)noise(.18,{freq:500,vol:.25,when:i*.25});tone(880,.5,'triangle',.12,1.05);tone(1046,.5,'triangle',.12,1.05)}],
    ['🚗','자동차','빵빵!','Beep beep!','var(--banana)',()=>{tone(415,.18,'square',.1);tone(523,.18,'square',.08);tone(415,.25,'square',.1,.25);tone(523,.25,'square',.08,.25)}],
    ['✈️','비행기','슝~','Whoosh!','#BDE8FF',()=>noise(1.2,{freq:3000,vol:.25,sweep:-2600})],
    ['🥁','북','둥둥!','Boom boom!','var(--grape)',()=>{sweepTone(140,50,.35,'sine',.5);sweepTone(140,50,.35,'sine',.5,.35)}],
    ['🔔','종','딩동!','Ding dong!','var(--banana)',()=>{tone(659,.9,'sine',.25);tone(1318,.5,'sine',.06);tone(523,1.1,'sine',.25,.45);tone(1046,.6,'sine',.06,.45)}],
    ['🎺','나팔','빰빠밤!','Ta-da!','var(--peach)',()=>{[523,659,784,1046].forEach((f,i)=>tone(f,i===3?.6:.16,'sawtooth',.07,i*.14))}],
    ['👏','박수','짝짝짝!','Clap clap!','var(--lime)',()=>{for(let i=0;i<3;i++)noise(.08,{freq:1800,q:.6,vol:.4,when:i*.22})}],
    ['🫧','비눗방울','뽀글뽀글!','Pop pop!','#DDF6FF',()=>{for(let i=0;i<6;i++)tone(800+rand(900),.07,'sine',.15,i*.09)}],
    ['🌧️','비','주룩주룩!','Pitter patter!','#C9D6E8',()=>noise(1.6,{type:'highpass',freq:3000,vol:.15})],
    ['⚡','천둥','우르릉 쾅!','Rumble boom!','#7B6FA8',()=>{noise(1.4,{type:'lowpass',freq:240,vol:.5});noise(.3,{type:'lowpass',freq:800,vol:.4,when:.1})}],
    ['💨','방귀','뿡!','Toot!','#E9C99E',()=>{const a=actx();if(!a||!M.S.sound)return;const o=a.createOscillator(),g=a.createGain(),l=a.createOscillator(),lg=a.createGain(),t=a.currentTime;
      o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.linearRampToValueAtTime(70,t+.5);l.frequency.value=28;lg.gain.value=18;l.connect(lg);lg.connect(o.frequency);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.55);o.connect(g);g.connect(a.destination);o.start(t);l.start(t);o.stop(t+.6);l.stop(t+.6)}],
    ['🐸','개구리','개굴개굴!','Ribbit!','var(--lime)',()=>{for(let i=0;i<2;i++){tone(180,.12,'square',.1,i*.3);tone(240,.1,'square',.08,i*.3+.12)}}],
    ['🦈','상어','첨벙!','Splash!','#4FB6EA',()=>{noise(.6,{type:'lowpass',freq:1600,vol:.35,sweep:-1200});tone(220,.4,'sine',.15,.1)}]
  ];
  const grid=sec.querySelector('#sgGrid');
  grid.innerHTML=SND.map((s,i)=>`<button class="stile" data-i="${i}" style="--c:${s[4]}"><span class="ic">${s[0]}</span><b>${s[1]}</b></button>`).join('');
  grid.addEventListener('pointerdown',e=>{const b=e.target.closest('.stile');if(!b)return;e.preventDefault();actx();const s=SND[+b.dataset.i];
    b.classList.remove('ring','bounce');void b.offsetWidth;b.classList.add('ring','bounce');try{s[5]()}catch(err){}say(s[2],s[3])});
  games[id]={enter:()=>say('눌러서 재미있는 소리를 들어 봐!','Tap to hear funny sounds!')};
})();

/* =================================================================
   13. SONG VIDEOS (YouTube links)
   ================================================================= */
const VIDEOS=[
  ['🍒','앵두, 어떤 소리 날까요?','손유희 · "하나하고 하나는 어떤 소리 날까요?"','https://www.youtube.com/watch?v=JQ6Xyv_cchE','#FFB3C7'],
  ['✋','어떤 소리 날까요','손유희 · 숫자 세며 소리 맞히기','https://www.youtube.com/watch?v=YWRi3MwL9Us','#FFE29A'],
  ['🦈','아기상어 체조','핑크퐁 공식 채널에서 찾기','https://www.youtube.com/results?search_query=%ED%95%91%ED%81%AC%ED%90%81+%EC%95%84%EA%B8%B0%EC%83%81%EC%96%B4+%EC%B2%B4%EC%A1%B0','#A8DBFF'],
  ['🐻','곰 세 마리','손유희 동요 찾기','https://www.youtube.com/results?search_query=%EA%B3%B0+%EC%84%B8+%EB%A7%88%EB%A6%AC+%EC%86%90%EC%9C%A0%ED%9D%AC','#E9C99E'],
  ['🪥','양치송','치카치카 양치 동요 찾기','https://www.youtube.com/results?search_query=%EC%96%91%EC%B9%98%EC%86%A1+%EB%8F%99%EC%9A%94','#C9F0E0'],
  ['🙆','머리 어깨 무릎 발','율동 동요 찾기','https://www.youtube.com/results?search_query=%EB%A8%B8%EB%A6%AC+%EC%96%B4%EA%B9%A8+%EB%AC%B4%EB%A6%8E+%EB%B0%9C+%EB%8F%99%EC%9A%94','#D9CCFF'],
  ['⭐','반짝반짝 작은 별','자장가 동요 찾기','https://www.youtube.com/results?search_query=%EB%B0%98%EC%A7%9D%EB%B0%98%EC%A7%9D+%EC%9E%91%EC%9D%80+%EB%B3%84+%EB%8F%99%EC%9A%94','#FFF0B3']
];
function videoCards(list){return list.map(v=>`<a class="vcard" href="${v[3]}" target="_blank" rel="noopener noreferrer" data-v="${v[1]}"><span class="vi" style="--c:${v[4]}">${v[0]}</span><span class="vt"><b>${v[1]}</b><small>${v[2]}</small></span><span class="yt">YouTube</span></a>`).join('')}
(()=>{
  const id='videos';
  const sec=screen(id,'노래 영상','',`<p class="hint">누르면 유튜브가 새 창으로 열려요. 다 보고 나서 이 앱으로 돌아오면 이어서 놀 수 있어요. 어른과 함께 보세요.</p><div class="vlist">${videoCards(VIDEOS)}</div>`);
  sec.addEventListener('click',e=>{const a=e.target.closest('.vcard');if(a){try{speechSynthesis.cancel()}catch(_){}sfx.pop()}});
  games[id]={enter:()=>say('같이 노래 영상 볼까?','Shall we watch a song?')};
})();

/* ---------- soft machine sounds (attack >= 30ms, no sharp highs) ---------- */
function useCount(k){const n=(M.store.get(k,0)|0);M.store.set(k,n+1);return n}
function softNoise(dur,{type='lowpass',freq=900,q=.7,vol=.2,attack=.06}){
  const a=actx();if(!a||!M.S.sound||vol<=0)return;
  if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=a.createBufferSource();s.buffer=noiseBuf;s.loop=true;const f=a.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
  const g=a.createGain(),t=a.currentTime,rel=.3;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.setValueAtTime(vol,t+Math.max(attack,dur-rel));g.gain.linearRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+dur+.05);return{t,dur,g}
}
/* dryer: low motor hum (~180Hz) + soft warm wind. Loudness grows with how many times it was used (saved on device). */
function dryerSound(){
  const C=(M.CFG.sound||{}),D=C.dryer||{},vs=D.volumeByUse||[.15,.25,.35,.45],n=useCount('mallang_dryuse');
  const parent=Number(M.S.dryer==null?1:M.S.dryer),vol=vs[Math.min(n,vs.length-1)]*parent*(C.master||.8);
  const a=actx();if(!a||!M.S.sound||vol<=0)return 0;
  const dur=1.2,t=a.currentTime,o=a.createOscillator(),lfo=a.createOscillator(),lg=a.createGain(),g=a.createGain();
  o.type='sine';o.frequency.value=180;lfo.frequency.value=6;lg.gain.value=4;lfo.connect(lg);lg.connect(o.frequency);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*.45,t+.08);g.gain.setValueAtTime(vol*.45,t+dur-.3);g.gain.linearRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(a.destination);o.start(t);lfo.start(t);o.stop(t+dur+.05);lfo.stop(t+dur+.05);
  softNoise(dur,{type:'lowpass',freq:900,vol:vol*1.5,attack:.08});
  return vol;
}
/* shower: rain-like band noise + an occasional soft drop */
function showerSound(){
  const S2=(M.CFG.sound||{}).shower||{},vol=(S2.volume||.3)*((M.CFG.sound||{}).master||.8);
  softNoise(1.2,{type:'bandpass',freq:2400,q:.6,vol:vol*.6,attack:.05});
  const a=actx();if(!a||!M.S.sound)return vol;
  [.3,.8].forEach(w=>{const t=a.currentTime+w,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(500,t+.12);
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol*.25,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.25)});
  return vol;
}

/* ---------- rub v2: easy rubbing (numbers live in MLCFG.touch.rub / touch.tool / calm) ----------
   touch on target = instant progress; keeps counting after the finger leaves the target;
   moving adds distance; holding still adds slow progress; progress never goes down. */
const rubCss=document.createElement('style');rubCss.textContent=
'.rub-tool{position:absolute;left:0;top:0;z-index:7;pointer-events:none;display:none;filter:drop-shadow(0 4px 3px rgba(91,74,66,.2))}'+
'.rub-tool svg{width:100%;height:100%;display:block}'+
'.rub-fx{position:absolute;z-index:6;pointer-events:none;display:none;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95) 0 38%,rgba(255,255,255,.55) 62%,rgba(255,255,255,0) 72%)}'+
'.rub-trail{position:absolute;z-index:6;pointer-events:none;border-radius:50%;background:rgba(255,255,255,.9);border:2px solid #D8EAF4;transform:translate(-50%,-50%);animation:rubtrail .7s ease-out forwards}'+
'@keyframes rubtrail{from{opacity:.9;transform:translate(-50%,-50%) scale(.5)}to{opacity:0;transform:translate(-50%,-90%) scale(1.2)}}';
document.head.appendChild(rubCss);
function makeRub(el,o={}){
  const cfg=()=>Object.assign({},(M.CFG.touch||{}).rub,o.cfg||{}),tcfg=()=>Object.assign({},(M.CFG.touch||{}).tool);
  const host=o.host||el;
  let tool=null,fx=null;
  if(o.tool){tool=document.createElement('div');tool.className='rub-tool';tool.innerHTML=o.tool;host.appendChild(tool)}
  fx=document.createElement('div');fx.className='rub-fx';host.appendChild(fx);
  let p=0,enabled=true,done=false,id=null,lx=0,ly=0,raf=0,lastT=0,trailD=0,total=0;
  const hr=()=>host.getBoundingClientRect();
  function toolSize(){const t=tcfg(),w=hr().width;return Math.max(t.minPx||130,w*(t.stageWidthRatio||.32))}
  function place(e){
    const r=hr(),x=e.clientX-r.left,y=e.clientY-r.top,c=cfg(),rad=r.width*(c.effectRadiusRatio||.16);
    if(tool){const sz=toolSize();tool.style.width=sz+'px';tool.style.height=sz+'px';tool.style.display='block';tool.style.left=(x-sz/2)+'px';tool.style.top=Math.max(0,y-sz-18)+'px'}
    fx.style.display='block';fx.style.width=fx.style.height=(rad*2)+'px';fx.style.left=(x-rad)+'px';fx.style.top=(y-rad)+'px';
  }
  function trail(e,rad){
    if(host.querySelectorAll('.rub-trail').length>8)return;const r=hr(),b=document.createElement('i');b.className='rub-trail';
    const sz=rad*(.5+Math.random()*.5);b.style.width=b.style.height=sz+'px';b.style.left=(e.clientX-r.left+(Math.random()-.5)*rad)+'px';b.style.top=(e.clientY-r.top+(Math.random()-.5)*rad)+'px';host.appendChild(b);setTimeout(()=>b.remove(),750);
  }
  function add(d,why){
    if(done||!enabled)return;const before=p;p=Math.min(1,p+d);
    if(p>before||why==='tap'){if(o.onProgress)o.onProgress(p,why)}
    if(p>=1&&!done){done=true;stopHold();if(o.onDone)o.onDone()}
  }
  function holdLoop(t){
    raf=0;if(id==null||done||!enabled)return;
    const dt=Math.min(.1,(t-lastT)/1000);lastT=t;add((cfg().holdProgressPerSec==null?.12:cfg().holdProgressPerSec)*dt,'hold');
    if(id!=null&&!done)raf=requestAnimationFrame(holdLoop);
  }
  function stopHold(){if(raf){cancelAnimationFrame(raf);raf=0}}
  function end(e){
    if(id==null||(e&&e.pointerId!==id))return;id=null;stopHold();
    if(tool)tool.style.display='none';fx.style.display='none';if(o.onRelease)o.onRelease();
  }
  function down(e){
    if(!enabled||done)return;e.preventDefault();actx();
    const r=o.target?o.target():el.getBoundingClientRect(),c=cfg(),tm=(c.targetMargin==null?.25:c.targetMargin)/4,mx=(r.width||0)*tm,my=(r.height||0)*tm;
    const inside=e.clientX>=r.left-mx&&e.clientX<=r.right+mx&&e.clientY>=r.top-my&&e.clientY<=r.bottom+my;
    if(!inside){if(o.onMiss)o.onMiss(e);return}
    if(o.onTouch)o.onTouch(e);
    try{el.setPointerCapture(e.pointerId)}catch(_){}
    id=e.pointerId;lx=e.clientX;ly=e.clientY;lastT=performance.now();place(e);
    add(c.tapChunk==null?.08:c.tapChunk,'tap');
    if(!done)raf=requestAnimationFrame(holdLoop);
  }
  function move(e){
    if(id==null||e.pointerId!==id||done)return;
    const c=cfg(),d=Math.hypot(e.clientX-lx,e.clientY-ly);lx=e.clientX;ly=e.clientY;place(e);
    if(d>=(c.minMovePx==null?.5:c.minMovePx)){
      add(d/(hr().width*(c.needStageWidths||2)),'move');
      trailD+=d;const rad=hr().width*(c.effectRadiusRatio||.16);if(trailD>rad*.8){trailD=0;trail(e,rad)}
    }
  }
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,end));
  return{
    get progress(){return p},get active(){return id!=null},
    stop(){enabled=false;end()},
    destroy(){enabled=false;stopHold();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.removeEventListener(ev,end));if(tool)tool.remove();fx.remove();host.querySelectorAll('.rub-trail').forEach(x=>x.remove())}
  };
}

M.P2={makeRub,dryerSound,showerSound,screen,life,chip,bigBtn,hint,dotsHTML,setDots,makeScrub,makeCutter,makeDrag,makeSweep,tapItems,friendsRow,faceOf,faceBg,noise,sweepTone,siren,SFX,foamAt,boxSize,CNT_KO_UNIT,josa};
/* rest screen gets the hand-play videos too */
(()=>{const r=document.querySelector('#rest .sheet');if(!r)return;const box=document.createElement('div');box.className='vlist';box.style.width='100%';
  box.innerHTML='<p class="hint">쉬는 동안 손유희 노래를 같이 따라 해 봐요.</p>'+videoCards(VIDEOS.slice(0,3));r.insertBefore(box,r.querySelector('#restHold'))})();

})();
