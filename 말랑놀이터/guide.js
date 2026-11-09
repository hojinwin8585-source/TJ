/* 말랑 놀이터 · 안내 손 (Guide)
   - 단계가 시작되면 손 그림이 "이렇게 해요" 동작을 먼저 보여 줘요.
   - 아이가 만지면 사라지고, 2초 동안 가만히 있으면 다시 나와요.
   - 7초 가만히 있으면 말로 한 번 더 알려 주고, 그 뒤에는 응원해 줘요 (대신 해 주지 않아요). */
(()=>{
'use strict';
const M=window.ML;if(!M)return;
const HAND=`<svg viewBox="0 0 100 120"><path d="M26 14Q26 4 35 4Q44 4 44 14V52Q46 44 55 46Q62 48 62 56Q66 50 73 53Q79 56 78 64Q84 60 88 66Q92 72 90 84Q88 112 60 114H50Q32 114 22 96L10 74Q6 64 14 62Q22 60 26 70Z" fill="#FFE0C4" stroke="#5B3A29" stroke-width="4" stroke-linejoin="round"/><path d="M44 52V66M62 56V68M78 64V72" stroke="#5B3A29" stroke-width="3" stroke-linecap="round"/></svg>`;
const CHEERS=[['할 수 있어! 천천히 해 봐!','You can do it! Take your time!'],['괜찮아, 손 그림처럼 해 봐!','It\'s okay! Do it like the hand!'],['잘하고 있어! 한 번 더!','You\'re doing great! One more time!']];
const css=`
.ghand{position:absolute;left:50%;top:50%;width:0;height:0;z-index:40;pointer-events:none;opacity:0;transition:opacity .25s}
.ghand.on{opacity:1}
.ghand .gr,.ghand .gm,.ghand .gc{position:absolute;left:0;top:0;width:0;height:0}
.ghand .gh{position:absolute;left:-30px;top:-6px;width:84px;height:100px;filter:drop-shadow(0 6px 4px rgba(46,42,79,.3))}
.ghand .gh svg{width:100%;height:100%}
.ghand .gring{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:5px solid #FFC93C;box-shadow:0 0 0 3px rgba(255,255,255,.9);opacity:0}
.ghand.on.tap .gh{animation:gtap .8s ease-in-out infinite}
.ghand.on.tap .gring{animation:gring .8s ease-out infinite}
.ghand.on.hold .gh{animation:ghold 2.2s ease-in-out infinite}
.ghand.on.hold .gring{animation:gholdring 2.2s ease-in-out infinite}
.ghand.on.circle .gm{animation:gcircle 1.5s linear infinite}
.ghand.on.swipe .gm{animation:gswipe 1.6s ease-in-out infinite}
.ghand.on.scrub .gm{animation:gscrub 1.8s ease-in-out infinite}
.ghand.on.circle .gring,.ghand.on.swipe .gring,.ghand.on.scrub .gring{opacity:.9;transform:scale(.7)}
@keyframes gtap{0%,100%{transform:translateY(-20px)}45%,60%{transform:translateY(0) scale(.93)}}
@keyframes gring{0%,40%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(1.7)}}
@keyframes ghold{0%,100%{transform:translateY(-22px)}14%,86%{transform:translateY(0) scale(.93)}}
@keyframes gholdring{0%,12%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(.7)}50%{opacity:1;transform:scale(1.25)}80%{opacity:1;transform:scale(.7)}90%,100%{opacity:0}}
@keyframes gcircle{0%{transform:translate(52px,0)}25%{transform:translate(0,24px)}50%{transform:translate(-52px,0)}75%{transform:translate(0,-24px)}100%{transform:translate(52px,0)}}
@keyframes gswipe{0%,12%{transform:translateX(calc(var(--gs,62px) * -1))}88%,100%{transform:translateX(var(--gs,62px))}}
@keyframes gscrub{0%,100%{transform:translate(-50px,-30px)}25%{transform:translate(50px,-10px)}50%{transform:translate(-50px,10px)}75%{transform:translate(50px,30px)}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function make(host,opt={}){
  const say=opt.say||M.say;
  const el=document.createElement('div');el.className='ghand';el.innerHTML=`<div class="gr"><div class="gm"><span class="gring"></span><div class="gc"><div class="gh">${HAND}</div></div></div></div>`;host.appendChild(el);
  const gr=el.querySelector('.gr'),gc=el.querySelector('.gc');
  let cfg=null,down=false,idle=0,reprompted=false,cheers=0,nextCheer=0;
  function place(){if(!cfg)return;const p=cfg.at?cfg.at():[host.clientWidth/2,host.clientHeight/2];el.style.left=p[0]+'px';el.style.top=p[1]+'px';
    const a=cfg.angle||0;gr.style.transform=`rotate(${a}deg)`;gc.style.transform=`rotate(${-a}deg)`;el.style.setProperty('--gs',(cfg.span||62)+'px')}
  function show(){if(!cfg||down)return;if(!el.isConnected)host.appendChild(el);place();el.className='ghand on '+cfg.type}
  function hide(){el.classList.remove('on')}
  const iv=setInterval(()=>{
    if(!cfg||down||host.offsetParent===null||document.hidden)return;
    idle+=500;
    if(idle>=(cfg.after||2000)&&!el.classList.contains('on'))show();
    if(cfg.quiet)return;
    if(idle>=7000&&!reprompted){reprompted=true;nextCheer=idle+6000;if(cfg.ko)say(cfg.ko,cfg.en)}
    if(reprompted&&cheers<3&&idle>=nextCheer){cheers++;nextCheer=idle+9000;const c=CHEERS[(Math.random()*CHEERS.length)|0];say(c[0],c[1])}
  },500);
  return{
    start(c){cfg=c;idle=0;reprompted=false;cheers=0;down=false;if(c.wait)hide();else show()},
    place,
    nudge(){down=false;show()},
    touch(){down=true;idle=0;hide()},
    release(){down=false;idle=0},
    stop(){cfg=null;hide()},
    state:()=>({on:el.classList.contains('on'),type:cfg&&cfg.type,idle}),
    destroy(){clearInterval(iv);el.remove()}
  };
}
M.Guide={make};
})();
