/* 말랑 피자가게 — 손님 주문 → 진짜 순서로 만들기 → 손님 반응 (직접 그린 그림) */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A)return;
const {say,sfx,tone,cheer,confetti,bounce,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,makeScrub,makeCutter,noise,sweepTone,SFX,CNT_KO_UNIT}=P;
const {CNT_KO,CNT_EN}=M;
const cur=()=>M.current();
const bat=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<=11171&&c%28!==0};
const eul=w=>w+(bat(w)?'을':'를'),rang=w=>w+(bat(w)?'이랑':'랑');
const id='pizza',L=life(id);

const css=`
#pizza{gap:8px}
.pzsteps{display:flex;gap:5px;overflow-x:auto;flex:none;padding:2px 2px 4px;scroll-behavior:smooth}
.pzsteps span{flex:none;width:40px;height:40px;border-radius:50%;background:#fff;display:grid;place-items:center;opacity:.45;box-shadow:0 3px 0 rgba(46,42,79,.1)}
.pzsteps span svg{width:30px;height:30px}
.pzsteps span.on{opacity:1;box-shadow:0 0 0 3px var(--berry),0 3px 0 rgba(46,42,79,.1);transform:scale(1.1)}
.pzsteps span.done{opacity:1;background:#E9F8E4}
.shop{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 6px 0 rgba(46,42,79,.1)}
.shop-top{flex:none;height:36%;position:relative;background:repeating-linear-gradient(90deg,#FFF0E0 0 26px,#FFE6D0 26px 52px)}
.shop-top::after{content:"";position:absolute;left:0;right:0;bottom:0;height:22%;background:linear-gradient(180deg,#E7A86E,#C98650);border-top:4px solid #5B3A29}
.shop-win{position:absolute;left:5%;top:9%;width:26%;height:48%;border-radius:14px;background:linear-gradient(180deg,#BDE8FF,#E7F7FF);border:4px solid #5B3A29}
.shop-win::before{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:4px solid #5B3A29}
.shop-menu{position:absolute;right:4%;top:8%;width:30%;height:44%;border-radius:12px;background:#4E7D5A;border:4px solid #5B3A29;color:#fff;font-size:clamp(11px,3vw,15px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.2}
.shop-menu b{font-weight:400;font-size:1.25em;color:#FFE08A}
.cust{position:absolute;left:50%;bottom:6%;width:34%;max-width:170px;transform:translateX(-50%);z-index:2}
.cust svg{width:100%;height:auto;display:block}
.cust.enter{animation:custin .8s cubic-bezier(.3,1.3,.5,1)}
@keyframes custin{from{transform:translateX(160%)}to{transform:translateX(-50%)}}
.cust.hop{animation:custhop .5s}
@keyframes custhop{0%,100%{transform:translateX(-50%)}40%{transform:translateX(-50%) translateY(-16px)}}
.ani-idle .eyes{animation:blink 4s infinite;transform-origin:100px 102px}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
.ani-yum .chew{animation:chew .22s infinite alternate;transform-origin:100px 132px}
@keyframes chew{to{transform:scaleY(.35)}}
.ani .wave{animation:wave .6s infinite alternate;transform-origin:140px 165px}
@keyframes wave{to{transform:rotate(-30deg)}}
.order{position:absolute;left:4%;top:8%;z-index:3;background:#fff;border:3px solid #5B3A29;border-radius:20px;padding:6px 10px;display:flex;align-items:center;gap:4px;box-shadow:0 4px 0 rgba(46,42,79,.15);animation:pop .4s ease-out;transform-origin:80% 100%}
.order::after{content:"";position:absolute;right:-14px;bottom:10px;border:9px solid transparent;border-left-color:#5B3A29}
.order svg{display:block}
.order .pl{font-size:20px;color:#5B3A29}
.order .ck{position:absolute;right:-6px;top:-8px;font-size:18px}
.wallstars{position:absolute;left:34%;top:6%;display:flex;gap:2px;z-index:1}
.wallstars svg{width:18px;height:18px}
.shop-table{flex:1;min-height:0;position:relative;background:linear-gradient(180deg,#F1C48E,#E2AE74);background-image:repeating-linear-gradient(180deg,transparent 0 30px,rgba(150,95,40,.12) 30px 32px),linear-gradient(180deg,#F1C48E,#E2AE74)}
.pzwork{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);touch-action:none;z-index:2}
.pzwork>svg{width:100%;height:100%;display:block;overflow:visible}
.pzwork canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;z-index:3}
.pzhint{position:absolute;left:50%;top:8px;transform:translateX(-50%);background:#fff;border-radius:16px;padding:6px 14px;font-size:clamp(15px,4.2vw,19px);z-index:6;white-space:nowrap;box-shadow:0 4px 0 rgba(46,42,79,.12);pointer-events:none;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.pzcursor{position:absolute;left:0;top:0;width:76px;height:76px;pointer-events:none;z-index:8;transform:translate(-30%,-75%);display:none;filter:drop-shadow(0 4px 2px rgba(46,42,79,.25))}
.pzcursor svg{width:100%;height:100%}
.pztools{flex:none;display:flex;gap:8px;justify-content:center;align-items:center;min-height:96px;padding:8px;background:rgba(255,255,255,.75);border-radius:28px;box-shadow:inset 0 4px 0 #fff,0 5px 0 rgba(46,42,79,.08);overflow-x:auto}
.ptool{flex:none;width:clamp(68px,19vw,84px);height:clamp(68px,19vw,84px);border-radius:26px;border:0;padding:8px;background:radial-gradient(circle at 35% 25%,#fff,#F3F0FA);display:grid;place-items:center;position:relative;
  box-shadow:inset 0 -5px 0 rgba(46,42,79,.1),0 6px 0 rgba(46,42,79,.16),0 10px 14px rgba(46,42,79,.12);transition:transform .15s}
.ptool svg{width:100%;height:100%}
.ptool.go{animation:pulse 1.3s ease-in-out infinite}
.ptool.sel{box-shadow:0 0 0 5px var(--berry),0 6px 0 rgba(46,42,79,.16)}
.ptool.tilt{transform:rotate(-40deg) translateY(-14px)}
.ptool .lb{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);font-size:13px;background:#fff;border-radius:999px;padding:0 8px;white-space:nowrap;box-shadow:0 2px 0 rgba(46,42,79,.12)}
.ptool.bowl{background:radial-gradient(circle at 50% 60%,#FFFFFF 0 46%,#DCE8F5 47% 60%,#fff 61%)}
.pour{position:absolute;left:50%;top:0;width:16px;margin-left:-8px;height:0;border-radius:8px;z-index:5;transition:height .25s;pointer-events:none}
.pour.on{height:38%}
.knife2{position:absolute;right:16%;top:12%;width:90px;height:90px;z-index:6;pointer-events:none;transition:transform .12s}
.knife2.chop{transform:translateY(46px) rotate(-12deg)}
.ovenbox{position:absolute;inset:0;display:grid;place-items:center}
.ovenbox .ov{width:min(96%,330px)}
.ovenbox .peelpz{position:absolute;left:50%;top:62%;width:38%;transform:translate(-50%,-50%);transition:transform 1.1s ease-in-out,opacity .5s;z-index:3}
.ovenbox .peelpz.in{transform:translate(-50%,-62%) scale(.55)}
.ovenbox .fire{animation:flick2 .3s infinite alternate;transform-origin:120px 186px}
@keyframes flick2{to{transform:scaleY(1.08) scaleX(.96)}}
.steam{position:absolute;font-size:30px;color:#fff;opacity:.85;pointer-events:none;animation:foamup 1.4s ease-out forwards;z-index:7}
.servepz{position:absolute;z-index:9;transition:transform 1s cubic-bezier(.4,.1,.3,1),opacity .4s;pointer-events:none}
.pzmeter{display:flex;align-items:center;gap:12px;width:100%;padding:0 4px}
.pzmeter .mi{flex:none;width:72px;height:72px;border-radius:22px;background:radial-gradient(circle at 35% 25%,#fff,#F3F0FA);padding:7px;box-shadow:inset 0 -5px 0 rgba(46,42,79,.1),0 5px 0 rgba(46,42,79,.14)}
.pzmeter .mi svg{width:100%;height:100%;display:block}
.pzmeter .mbar{flex:1;min-width:0;height:36px;border-radius:18px;background:#F1ECF8;border:4px solid #5B3A29;overflow:hidden;box-shadow:inset 0 4px 0 rgba(46,42,79,.08)}
.pzmeter .mbar i{display:block;height:100%;width:0;border-radius:0 12px 12px 0;background:repeating-linear-gradient(45deg,#FF8FB1 0 14px,#FFB3C9 14px 28px);box-shadow:inset 0 5px 0 rgba(255,255,255,.45);transition:width .25s}
.pzmeter .mstar{flex:none;width:60px;height:60px;filter:grayscale(1) opacity(.4);transition:filter .2s}
.pzmeter .mstar svg{width:100%;height:100%;display:block}
.pzmeter .mstar.full{filter:none;animation:bounce .6s}
.bite{position:absolute;z-index:4;width:15%;max-width:72px;pointer-events:none;transform:rotate(-25deg)}
.bite .str{animation:stretch .5s ease-in-out infinite alternate;transform-origin:50% 0}
@keyframes stretch{to{transform:scaleY(1.8)}}
.hearts{position:absolute;font-size:26px;pointer-events:none;z-index:5;animation:foamup 1.3s ease-out forwards}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar"><button class="round" data-go="home" aria-label="처음으로">🏠</button><h2>말랑 피자가게</h2></div>
<div class="pzsteps" id="pzSteps"></div>
<div class="shop"><div class="shop-top"><div class="shop-win"></div><div class="shop-menu"><b>오늘의 피자</b><span>🍕 반죽부터</span><span>직접 만들어요</span></div><div class="wallstars" id="pzStars"></div><div class="cust" id="pzCust"></div></div>
<div class="shop-table" id="pzTable"><div class="pzwork" id="pzWork"><svg viewBox="-120 -120 240 240"></svg></div></div></div>
<div class="pztools" id="pzTools"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='피자가게';
const $=s=>sec.querySelector(s);
const table=$('#pzTable'),work=$('#pzWork'),tools=$('#pzTools'),custEl=$('#pzCust'),top=sec.querySelector('.shop-top');
let svg=work.querySelector('svg');

const STEPS=[['flour','밀가루'],['water','물'],['spoon','섞기'],['hands','반죽'],['pin','밀대'],['ladle','소스'],['cheese','치즈'],['knife','썰기'],['top','토핑'],['peel','굽기'],['wheel','자르기'],['plate','드리기']];
const TOPS=['tomato','mushroom','pepper','pepperoni','olive','corn','pineapple'];
const CUSTS=[['bunny','토토',{bow:'#FF6F91'}],['bear','보리',{apron:null}],['cat','모모',{bow:'#9A7BFF'}],['dog','콩이',{}]];
const DATA=Object.assign({served:0},store.get('mallang_pizza',{}));
let S,i=0,H={},act=null,eng=null,raf=0,cust=null,order=[];
$('#pzSteps').innerHTML=STEPS.map(([t])=>`<span>${t==='top'?A.pieceSVG('tomato',30):A.TOOL[t]}</span>`).join('');

/* ---------- small helpers ---------- */
function hint(t){let h=table.querySelector('.pzhint');if(!h){h=document.createElement('div');h.className='pzhint';table.appendChild(h)}h.textContent=t;h.hidden=!t}
function size(){const r=table.getBoundingClientRect(),low=S&&S.mode==='bowl',z=Math.round(Math.max(150,Math.min(r.width*.86,r.height*.84)*(low?.7:1)));work.style.width=work.style.height=z+'px';work.style.top=low?'64%':''}
function face(mood,extra){if(!cust)return;custEl.innerHTML=A.animal(cust[0],mood,Object.assign({},cust[2],extra||{}))}
function hop(){custEl.classList.remove('hop','enter');void custEl.offsetWidth;custEl.classList.add('hop')}
function stars(){$('#pzStars').innerHTML=Array.from({length:Math.min(10,DATA.served)},()=>'<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#FFC93C" stroke="#5B3A29" stroke-width="1.2"/></svg>').join('')}
function cursor(t){let c=table.querySelector('.pzcursor');if(!c){c=document.createElement('div');c.className='pzcursor';table.appendChild(c)}c.innerHTML=A.TOOL[t]||'';return c}
function moveCursor(c,q){c.style.display='block';c.style.left=q[2]+'px';c.style.top=q[3]+'px'}
function hideCursor(){const c=table.querySelector('.pzcursor');if(c)c.style.display='none'}
function toolBtn(t,label,on,cls=''){
  const b=document.createElement('button');b.className='ptool go '+cls;b.innerHTML=(t.startsWith('<')?t:A.TOOL[t])+(label?`<span class="lb">${label}</span>`:'');
  let lock=0;b.addEventListener('pointerdown',e=>{e.preventDefault();const n=performance.now();if(n-lock<380)return;lock=n;actx();on(b)});tools.appendChild(b);return b;
}
function draw(){
  const m=S.mode;
  if(m==='bowl'){
    const lv=S.level,k=.45+.55*lv,rx=92*k,ry=24*k,cy=-34+(1-lv)*14;
    let s=`<ellipse cx="6" cy="104" rx="104" ry="14" fill="rgba(90,50,20,.18)"/><path d="M-108 -34Q-108 100 0 100Q108 100 108 -34Z" fill="#9BD3F7" stroke="${A.OL}" stroke-width="3.5"/><path d="M-82 -4Q-74 64 -16 82" stroke="#fff" stroke-width="10" opacity=".5" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-34" rx="108" ry="30" fill="#7CC2EE" stroke="${A.OL}" stroke-width="3.5"/><ellipse cx="0" cy="-34" rx="98" ry="25" fill="#EAF5FC"/>`;
    if(lv>0){s+=`<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${S.color}"/>`;
      if(S.mound)s+=`<path d="M${-rx*.6} ${cy}Q0 ${cy-48*S.mound} ${rx*.6} ${cy}Z" fill="#FFFDF6" stroke="#E9E1D2" stroke-width="2"/>`;
      if(S.puddle)s+=`<ellipse cx="${18}" cy="${cy+2}" rx="${rx*.35}" ry="${ry*.45}" fill="#BFE3FF" opacity=".9"/>`;
      if(S.ball)s+=`<ellipse cx="0" cy="${cy-14}" rx="${46*S.ball}" ry="${30*S.ball}" fill="#F3D9A8" stroke="#C99A5E" stroke-width="2.5"/><ellipse cx="-14" cy="${cy-24}" rx="12" ry="6" fill="#fff" opacity=".5"/>`;
      if(S.swirl)s+=`<g transform="translate(0 ${cy}) scale(1 .26) rotate(${S.swirl})"><path d="M0 0C24 -34 60 -10 54 24C48 58 -12 70 -48 36" stroke="rgba(255,255,255,.75)" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;}
    svg.innerHTML=s;
  }else if(m==='board'){
    const sq=S.squish?[1.14,.8]:[1,1],rx=70*sq[0],ry=48*sq[1];
    let s=`<ellipse cx="6" cy="104" rx="112" ry="12" fill="rgba(90,50,20,.2)"/><rect x="-114" y="-84" width="228" height="186" rx="28" fill="#E9B67A" stroke="${A.OL}" stroke-width="3.5"/><path d="M-96 -40H96M-100 10H100M-96 60H96" stroke="rgba(150,95,40,.18)" stroke-width="4"/>`;
    for(let k=0;k<22;k++){const R=A.rng(k*31+7),a=R()*6.28,d=R()*95;s+=`<circle cx="${(Math.cos(a)*d).toFixed(1)}" cy="${(Math.sin(a)*d*.75).toFixed(1)}" r="${1+R()*2}" fill="#fff" opacity=".75"/>`}
    s+=`<ellipse cx="0" cy="${30+ry*.3}" rx="${rx}" ry="${ry*.3}" fill="rgba(120,70,30,.2)"/><ellipse cx="0" cy="14" rx="${rx}" ry="${ry}" fill="#F5DCAB" stroke="#C99A5E" stroke-width="2.5"/><ellipse cx="-20" cy="-4" rx="${rx*.3}" ry="${ry*.18}" fill="#fff" opacity=".45"/>`;
    for(let k=0;k<S.bumps;k++){const a=k*1.9,r=.3+(k%4)*.15;s+=`<circle cx="${(Math.cos(a)*rx*r).toFixed(1)}" cy="${(14+Math.sin(a)*ry*r).toFixed(1)}" r="${4+k%3}" fill="#E2BF85" opacity=".8"/>`}
    svg.innerHTML=s;
  }else if(m==='pizza'){
    svg.innerHTML=`<g>${A.pizza(S.pz)}</g>`;
  }else if(m==='cut'){
    let s=`<rect x="-114" y="-84" width="228" height="186" rx="28" fill="#F3F6FA" stroke="${A.OL}" stroke-width="3.5"/><rect x="-100" y="-70" width="200" height="158" rx="20" fill="#E9B67A" stroke="${A.OL}" stroke-width="3"/>`;
    const it=S.cutItem;
    if(it){if(S.cuts<4)s+=`<g transform="translate(-20 6) scale(1.25)">${A.wholeSVG(A.TOPPING[it].whole,S.cuts).replace(/<\/?svg[^>]*>/g,'')}</g>`;
      for(let k=0;k<S.cuts*2;k++)s+=A.F[it](40+(k%3)*22,-36+Math.floor(k/3)*30,15,k*25,false);}
    svg.innerHTML=s;
  }
}
/* pointer routing: the whole table is ONE touch zone */
const G=M.Guide.make(table,{say});
const pt=e=>{const r=work.getBoundingClientRect(),tr=table.getBoundingClientRect();return[(e.clientX-(r.left+r.width/2))*240/r.width,(e.clientY-(r.top+r.height/2))*240/r.height,e.clientX-tr.left,e.clientY-tr.top]};
table.addEventListener('pointerdown',()=>G.touch(),true);
['pointerup','pointercancel'].forEach(t=>table.addEventListener(t,()=>G.release(),true));
table.addEventListener('pointerdown',e=>{if(!H.down||act!==null)return;e.preventDefault();try{table.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId;H.down(pt(e))});
table.addEventListener('pointermove',e=>{if(act!==e.pointerId||!H.move)return;H.move(pt(e))});
const endp=e=>{if(act!==e.pointerId)return;act=null;if(H.up)H.up(pt(e))};
table.addEventListener('pointerup',endp);table.addEventListener('pointercancel',endp);table.addEventListener('lostpointercapture',endp);

const STARSVG='<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#FFC93C" stroke="#5B3A29" stroke-width="1.2"/></svg>';
function meter(icon){tools.innerHTML=`<div class="pzmeter"><span class="mi">${icon.startsWith('<')?icon:A.TOOL[icon]}</span><div class="mbar"><i></i></div><span class="mstar">${STARSVG}</span></div>`}
function prog(p){p=Math.max(0,Math.min(1,p));const b=tools.querySelector('.mbar i');if(b)b.style.width=(p*100)+'%';const s=tools.querySelector('.mstar');if(s)s.classList.toggle('full',p>=1)}
function rd(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()})}
function guide(type,o={}){const x=o.x||0,y=o.y||0;G.start(Object.assign({type,at:()=>{const r=work.getBoundingClientRect(),t=table.getBoundingClientRect();return[r.left-t.left+r.width/2+x/240*r.width,r.top-t.top+r.height/2+y/240*r.height]}},o))}
function done(ko,en){H={};G.stop();hideCursor();prog(1);SFX.sparkle();if(ko)say(ko,en);L.later(next,1400)}

/* ---------- steps: every step = one gesture, anywhere on the table, about 6~8 seconds ---------- */
const STEP={
  flour(){S.mode='bowl';draw();meter('flour');hint('꾹~ 누르고 있어요');say(`${cust[1]}의 피자를 만들어요! 꾹 누르고 있으면 밀가루가 솔솔!`,'Press and hold to pour the flour!');
    eng=M.P3.makePour(table,work,{kind:'flour',ms:6500,anywhere:true,quiet:true,surface:.36,noise,tone,say,
      onProgress:p=>{S.level=Math.min(.75,.05+.7*p);S.color='#FFF8EA';S.mound=Math.min(1.3,p*1.4);prog(p);rd()},
      onCup:k=>say(`${CNT_KO_UNIT(k)} 컵!`,`${cap(CNT_EN[k-1])} cup!`),onDone:()=>done('밀가루 세 컵, 다 넣었어요!','Three cups of flour!')});
    guide('hold',{y:-50,ko:'꾹~ 누르고 있어 봐!',en:'Press and hold!',assist:()=>eng&&eng.add&&eng.add(1700)})},
  water(){S.mode='bowl';draw();meter('water');hint('꾹~ 누르고 있어요');say('이번엔 물! 꾹 누르고 있으면 졸졸졸!','Now water! Press and hold!');const l0=S.level,m0=S.mound;
    eng=M.P3.makePour(table,work,{kind:'water',ms:6500,anywhere:true,quiet:true,surface:.36,noise,tone,say,
      onProgress:(p,dx)=>{S.level=Math.min(1,l0+(1-l0)*p);S.puddle=true;S.mound=Math.max(.3,m0*(1-p*.6));S.swirl=(S.swirl||0)+dx*.08;prog(p);rd()},
      onCup:k=>say(`${CNT_KO_UNIT(k)} 컵!`,`${cap(CNT_EN[k-1])} cup!`),onDone:()=>{S.swirl=0;done('물도 다 넣었어요!','Water is in!')}});
    guide('hold',{y:-50,ko:'꾹~ 누르고 있어 봐!',en:'Press and hold!',assist:()=>eng&&eng.add&&eng.add(1700)})},
  spoon(){S.mode='bowl';draw();meter('spoon');hint('빙글빙글 저어요');say('숟가락으로 빙글빙글 저어요!','Stir round and round!');const c=cursor('spoon'),NEED=1500;let lp=null,dist=0,qk=0,fin=false;
    const adv=d=>{if(fin)return;dist+=d;const p=Math.min(1,dist/NEED);S.mound=Math.max(0,1-p*1.4);S.puddle=p<.4;S.color=p>.5?'#F2DBAE':'#F7EBD3';S.swirl=(S.swirl||0)+d*.9;S.ball=p>.85?(p-.85)/.15:0;prog(p);rd();
      if(Math.random()<.1)noise(.12,{type:'lowpass',freq:500,vol:.12});
      const k=Math.floor(p*4);if(k>qk){qk=k;if(k<4)say(`빙글빙글 ${CNT_KO[k-1]}!`,`Round ${CNT_EN[k-1]}!`)}
      if(p>=1){fin=true;S.swirl=0;S.ball=1;draw();done('반죽 덩어리가 됐어요!','It became dough!')}};
    H={down:q=>{lp=q;moveCursor(c,q)},move:q=>{moveCursor(c,q);if(lp){const d=Math.hypot(q[0]-lp[0],q[1]-lp[1]);lp=q;if(d>.5)adv(Math.min(d,40))}},up:()=>{lp=null;hideCursor()}};
    guide('circle',{y:-30,ko:'손가락으로 빙글빙글 돌려 봐!',en:'Go round and round!',assist:()=>adv(NEED*.28)})},
  hands(){S.mode='board';size();S.bumps=9;draw();meter('hands');hint('꾹꾹 눌러요');say('손으로 반죽을 꾹꾹 눌러요!','Press the dough with your hands!');const c=cursor('hands'),N=8;let k=0;
    const press=q=>{if(k>=N)return;if(q)moveCursor(c,q);S.squish=true;k++;S.bumps=Math.max(0,9-Math.round(k*9/N));draw();sweepTone(220,150,.12,'sine',.25);prog(k/N);say(`꾹! ${CNT_KO[k-1]}`,`Press! ${cap(CNT_EN[k-1])}`);
      setTimeout(()=>{S.squish=false;if(S.mode==='board')draw()},160);if(k>=N){H={};setTimeout(()=>done('매끈매끈 반죽 완성!','Smooth dough!'),300)}};
    H={down:press,up:hideCursor};guide('tap',{y:10,ko:'반죽을 꾹꾹 눌러 봐!',en:'Press the dough!',assist:()=>press(null)})},
  pin(){S.mode='pizza';S.pz.r=56;S.pz.flour=true;draw();meter('pin');hint('쓱쓱 왔다 갔다 밀어요');say('밀대로 쭉쭉! 왔다 갔다 밀어요!','Roll the dough back and forth!');const c=cursor('pin'),NEED=1100;let lp=null,dist=0,qk=0,fin=false;
    const adv=d=>{if(fin)return;dist+=d;const p=Math.min(1,dist/NEED);S.pz.r=56+44*p;prog(p);rd();const k=Math.floor(p*4);
      if(k>qk){qk=k;sweepTone(150,110,.15,'triangle',.18);if(k<4)say(`쭉! ${CNT_KO[k-1]}`,`Roll! ${cap(CNT_EN[k-1])}`)}
      if(p>=1){fin=true;H={};draw();done('동그랗게 다 폈어요!','Nice and round!')}};
    H={down:q=>{lp=q;moveCursor(c,q)},move:q=>{moveCursor(c,q);if(lp){const d=Math.hypot(q[0]-lp[0],q[1]-lp[1]);lp=q;adv(Math.min(d,40))}},up:()=>{lp=null;hideCursor()}};
    guide('swipe',{ko:'손가락을 왔다 갔다 밀어 봐!',en:'Slide back and forth!',assist:()=>adv(NEED*.28)})},
  ladle(){S.mode='pizza';S.pz.flour=false;draw();meter('ladle');hint('쓱쓱 문질러요');say('빨간 토마토소스! 피자를 쓱쓱 문질러요.','Rub the pizza to spread the sauce!');
    const cv=document.createElement('canvas');work.appendChild(cv);const c=cursor('ladle');const mv=e=>{const r=table.getBoundingClientRect();c.style.display='block';c.style.left=(e.clientX-r.left)+'px';c.style.top=(e.clientY-r.top)+'px'};
    cv.addEventListener('pointermove',mv);cv.addEventListener('pointerdown',mv);cv.addEventListener('pointerup',hideCursor);const TH=.7;let fin=false,ak=0;
    const finish=()=>{if(fin)return;fin=true;S.pz.sauce=true;cv.remove();draw();done('소스 완성!','Sauce done!')};
    eng=makeScrub(cv,{mode:'paint',color:'#D2412A',brush:.1,maskR:(S.pz.r-14)/240,threshold:TH,onMove:()=>{SFX.scrub();if(eng&&eng.progress)prog(Math.max(ak/3,eng.progress()/TH))},onDone:finish});eng.start();
    guide('scrub',{ko:'피자를 쓱쓱 문질러 봐!',en:'Rub the pizza!',assist:()=>{ak++;prog(ak/3);if(ak>=3)finish()}})},
  cheese(){S.mode='pizza';draw();meter('cheese');hint('콕콕 눌러요');say('치즈를 솔솔! 피자를 콕콕 눌러요.','Tap the pizza to sprinkle cheese!');const c=cursor('cheese'),NEED=66;let fin=false,lastT=0;
    const drop=q=>{if(fin)return;if(q)moveCursor(c,q);const R=S.pz.r-22,bx=q?q[0]:(Math.random()-.5)*R*1.4,by=q?q[1]:(Math.random()-.5)*R*1.4;
      for(let k=0;k<3;k++){let x=bx+(Math.random()-.5)*44,y=by+(Math.random()-.5)*44;const d=Math.hypot(x,y);if(d>R){x*=R/d;y*=R/d}S.pz.cheese.push([+x.toFixed(1),+y.toFixed(1),rand(180)])}
      prog(S.pz.cheese.length/NEED);rd();tone(900+rand(300),.05,'sine',.08);
      if(S.pz.cheese.length>=NEED){fin=true;H={};hideCursor();draw();done('치즈 듬뿍!','Lots of cheese!')}};
    H={down:drop,move:q=>{const t=performance.now();if(t-lastT>140){lastT=t;drop(q)}},up:hideCursor};
    guide('tap',{ko:'피자를 콕콕 눌러 봐!',en:'Tap the pizza!',assist:()=>{for(let k=0;k<4;k++)drop(null)}})},
  knife(){
    const need=order.filter(t=>A.TOPPING[t].cut),CH=4;let qi=0,fin=false,busy=false;S.mode='cut';meter('knife');
    const kn=document.createElement('div');kn.className='knife2';kn.innerHTML=A.TOOL.knife;table.appendChild(kn);
    const nextItem=()=>{S.cutItem=need[qi];S.cuts=0;draw();const t=A.TOPPING[S.cutItem];hint('콕콕 눌러요');say(`${eul(t.ko)} 썰어요! 콕콕 눌러 봐!`,`Tap to slice the ${t.en}!`)};
    const chop=()=>{if(fin||busy||S.cuts>=CH)return;kn.classList.add('chop');setTimeout(()=>kn.classList.remove('chop'),130);noise(.07,{freq:2600,vol:.3});S.cuts++;draw();
      prog((qi*CH+S.cuts)/(need.length*CH));say(CNT_KO[S.cuts-1]+'!',cap(CNT_EN[S.cuts-1])+'!');
      if(S.cuts>=CH){busy=true;qi++;if(qi<need.length)L.later(()=>{busy=false;nextItem()},900);else{fin=true;L.later(()=>{kn.remove();done('다 썰었어요!','All sliced!')},500)}}};
    nextItem();H={down:chop};guide('tap',{x:-20,ko:'콕콕 눌러서 썰어 봐!',en:'Tap to chop!',assist:chop})},
  top(){
    S.mode='pizza';draw();const PER=4,total=order.length*PER;let cnt=0,fin=false;
    const curT=()=>order[Math.min(order.length-1,Math.floor(cnt/PER))];
    const intro=()=>{const t=A.TOPPING[curT()];meter(A.pieceSVG(curT(),60));prog(cnt/total);hint('콕콕 눌러요');say(`${eul(t.ko)} 올려요! 피자를 콕콕!`,`Put on the ${t.en}! Tap the pizza!`)};
    const put=q=>{if(fin)return;const R=S.pz.r-24;let x,y;if(q&&Math.hypot(q[0],q[1])<=R){x=q[0];y=q[1]}else{const a=Math.random()*6.28,d=Math.random()*R;x=Math.cos(a)*d;y=Math.sin(a)*d}
      S.pz.tops.push([curT(),+x.toFixed(1),+y.toFixed(1),rand(360)]);cnt++;draw();sfx.pop();prog(cnt/total);
      if(cnt%PER===1){face('happy');hop();L.later(()=>face('idle'),1200)}
      say(CNT_KO[(cnt-1)%PER]+'!',cap(CNT_EN[(cnt-1)%PER])+'!');
      if(cnt>=total){fin=true;H={};L.later(()=>done('토핑 완성! 맛있겠다!','Toppings done! Looks yummy!'),500)}else if(cnt%PER===0)L.later(intro,800)};
    intro();H={down:put};guide('tap',{ko:'피자를 콕콕 눌러 봐!',en:'Tap the pizza!',assist:()=>put(null)})},
  peel(){
    S.mode='oven';svg.innerHTML='';meter('peel');const ob=document.createElement('div');ob.className='ovenbox';ob.innerHTML=`<div class="ov">${A.oven(false)}</div><div class="peelpz"><svg viewBox="-120 -120 240 240">${A.pizza(S.pz)}</svg></div>`;work.appendChild(ob);
    hint('콕! 화덕에 넣어요');say('뜨거운 화덕이에요! 콕 눌러서 피자를 넣어요.','Tap to put the pizza in the hot oven!');let stg=0;
    const takeOut=()=>{if(stg!==2)return;stg=3;G.stop();prog(1);ob.querySelector('.peelpz').classList.remove('in');
      for(let k=0;k<3;k++){const s=document.createElement('span');s.className='steam';s.textContent='〰';s.style.left=(40+k*10)+'%';s.style.top='40%';table.appendChild(s);setTimeout(()=>s.remove(),1400)}
      L.later(()=>{ob.remove();S.mode='pizza';draw();face('wow');hop();done('음~ 고소한 냄새!','Mmm, smells great!')},900)};
    const putIn=()=>{if(stg!==0)return;stg=1;G.stop();prog(.25);ob.querySelector('.peelpz').classList.add('in');
      L.later(()=>{ob.querySelector('.ov').innerHTML=A.oven(true);noise(2.6,{type:'bandpass',freq:3000,q:.5,vol:.08});hint('지글지글… 셋, 둘, 하나');
        [0,1,2].forEach(j=>L.later(()=>{say(['셋','둘','하나'][j],['three','two','one'][j]);tone(700,.08,'square',.06);prog(.25+.2*(j+1))},j*900));
        L.later(()=>{S.pz.baked=true;S.pz.basil=[[-20,14,30],[30,-24,-40],[8,44,80]];ob.querySelector('.peelpz').innerHTML=`<svg viewBox="-120 -120 240 240">${A.pizza(S.pz)}</svg>`;SFX.ding();
          say('띵! 다 구워졌어요! 콕 눌러서 꺼내요.','Ding! Tap to take it out!');hint('콕! 피자를 꺼내요');stg=2;guide('tap',{y:20,ko:'콕 눌러서 꺼내 봐!',en:'Tap to take it out!',assist:takeOut})},2900)},1100)};
    H={down:()=>{stg===0?putIn():takeOut()}};guide('tap',{y:40,ko:'콕 눌러서 넣어 봐!',en:'Tap to put it in!',assist:putIn})},
  wheel(){
    S.mode='pizza';svg.innerHTML='';meter('wheel');const box=document.createElement('div');box.style.cssText='position:absolute;inset:0;pointer-events:none';work.appendChild(box);
    hint('콕콕 눌러서 잘라요');say('피자 칼로 쓱! 콕콕 눌러서 잘라요.','Tap to cut the pizza!');let lastC=0;
    eng=makeCutter(box,{top:A.pizza(S.pz),target:3,easy:true,onCut:n=>{sweepTone(500,300,.25,'sawtooth',.06);prog(n/6);say(`${CNT_KO_UNIT(n)} 조각!`,`${cap(CNT_EN[n-1])} slices!`)},onSeparated:()=>{L.later(()=>done('여섯 조각 완성!','Six slices!'),700)},onServe:()=>{}});
    const k=box.querySelector('.knife');if(k){k.innerHTML=A.TOOL.wheel;k.style.cssText='position:absolute;right:-6px;bottom:-6px;width:70px;height:70px;pointer-events:none;animation:floaty 1.2s infinite'}
    const cut=()=>{const t=performance.now();if(t-lastC<450)return;lastC=t;if(eng&&eng.cut)eng.cut()};
    H={down:cut};guide('tap',{ko:'콕콕 눌러서 잘라 봐!',en:'Tap to cut!',assist:cut})},
  plate(){
    meter('plate');hint('콕! 손님에게 드려요');say(`완성! 콕 눌러서 ${cust[1]}에게 드려요!`,`All done! Tap to serve ${cust[1]}!`);let sent=false;
    const serve=()=>{if(sent)return;sent=true;H={};G.stop();prog(1);
      const r=work.getBoundingClientRect(),cr=custEl.getBoundingClientRect(),pz=document.createElement('div');pz.className='servepz';pz.innerHTML=`<svg viewBox="-120 -120 240 240">${A.pizza(S.pz)}</svg>`;
      Object.assign(pz.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',position:'fixed'});document.body.appendChild(pz);work.style.opacity='.0';
      requestAnimationFrame(()=>{pz.style.transform=`translate(${cr.left+cr.width/2-(r.left+r.width/2)}px,${cr.top+cr.height*.75-(r.top+r.height/2)}px) scale(.3)`});
      setTimeout(()=>{pz.remove();eat()},1050)};
    H={down:serve};guide('tap',{ko:'콕 눌러서 드려 봐!',en:'Tap to serve!',assist:serve})}
};
function eat(){
  const got=order.every(t=>S.pz.tops.some(x=>x[0]===t));
  hint('');face('yum');const bite=document.createElement('div');bite.className='bite';
  bite.innerHTML=`<svg viewBox="0 0 60 70"><path d="M8 6L52 6L30 62Z" fill="#F0C27A" stroke="#5B3A29" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 10L48 10L30 54Z" fill="#FFE07A"/><circle cx="26" cy="20" r="5" fill="#E8412F"/><circle cx="36" cy="30" r="4" fill="#C9432C"/>
    <g class="str"><path d="M22 6V-8M30 6V-12M38 6V-6" stroke="#FFE07A" stroke-width="4" stroke-linecap="round"/></g></svg>`;
  const cr=custEl.getBoundingClientRect(),tr=top.getBoundingClientRect();bite.style.left=(cr.left-tr.left+cr.width*.62)+'px';bite.style.top=(cr.top-tr.top+cr.height*.6)+'px';top.appendChild(bite);
  const chomp=setInterval(()=>SFX.chomp(),450);say('냠냠냠… 쭉~ 치즈가 늘어나요!','Nom nom... stretchy cheese!');
  L.later(()=>{clearInterval(chomp);bite.remove();face(got?'wow':'happy');hop();
    for(let k=0;k<5;k++){const h=document.createElement('span');h.className='hearts';h.textContent=k%2?'💛':'💖';h.style.left=(35+k*7)+'%';h.style.top='30%';h.style.animationDelay=(k*.1)+'s';top.appendChild(h);setTimeout(()=>h.remove(),1600)}
    const names=order.length>1?rang(A.TOPPING[order[0]].ko)+' '+A.TOPPING[order[1]].ko:A.TOPPING[order[0]].ko;
    DATA.served++;store.set('mallang_pizza',DATA);stars();
    cheer(got?`${names} 피자! 내가 주문한 거야! 최고야!`:'음~ 새로운 맛이네! 맛있어요!',got?'This is exactly what I ordered! The best!':'Mmm, a new taste! Yummy!');
    L.later(()=>{face('happy',{wave:true});tools.innerHTML='';hint('콕! 다음 손님을 불러요');let called=false;const call=()=>{if(called)return;called=true;H={};G.stop();newCustomer()};
      H={down:call};G.start({type:'tap',ko:'콕 눌러서 다음 손님을 불러 봐!',en:'Tap for the next customer!'})},2400)},2300);
  L.onEnd(()=>clearInterval(chomp));
}
function next(){i++;if(i>=STEPS.length)return;run()}
function run(){
  H={};if(eng&&eng.stop)eng.stop();eng=null;hideCursor();
  sec.querySelectorAll('#pzSteps span').forEach((s,k)=>{s.className=k<i?'done':k===i?'on':''});
  const on=sec.querySelector('#pzSteps span.on');if(on)$('#pzSteps').scrollLeft=Math.max(0,on.offsetLeft-$('#pzSteps').clientWidth/2+20);
  STEP[STEPS[i][0]]();size();G.place();
}
function showOrder(){
  top.querySelector('.order')?.remove();const o=document.createElement('div');o.className='order';
  o.innerHTML=`<svg viewBox="-120 -120 240 240" width="46" height="46">${A.pizza({r:100,sauce:true,cheese:[],tops:order.flatMap((t,k)=>[[t,-40+k*60,-30,0],[t,-20+k*50,30,40]]),baked:true})}</svg><span class="pl">=</span>${order.map(t=>A.pieceSVG(t,34)).join('<span class="pl">+</span>')}`;
  top.appendChild(o);
}
function newCustomer(){
  L.begin();H={};act=null;G.stop();if(eng&&eng.stop)eng.stop();eng=null;tools.innerHTML='';
  work.innerHTML='<svg viewBox="-120 -120 240 240"></svg>';svg=work.querySelector('svg');work.style.opacity='1';table.querySelectorAll('.knife2,.pour,.steam').forEach(n=>n.remove());
  cust=pick(CUSTS.filter(c=>!cust||c[0]!==cust[0]));order=shuffle(TOPS.slice()).slice(0,2);
  S={mode:'bowl',level:0,color:'#FFF8EA',mound:0,puddle:false,ball:0,swirl:0,bumps:0,squish:false,cutItem:null,cuts:0,pz:{r:56,sauce:false,cheese:[],tops:[],baked:false,flour:false}};
  i=0;size();draw();face('idle',{wave:true});custEl.classList.remove('hop');void custEl.offsetWidth;custEl.classList.add('enter');stars();
  setTimeout(()=>{if(cur()!==id)return;showOrder();const nm=rang(A.TOPPING[order[0]].ko)+' '+A.TOPPING[order[1]].ko;
    say(`안녕하세요! 저는 ${cust[1]}예요. ${nm} 피자 주세요!`,`Hi! I'm ${cust[1]}. ${order.map(t=>A.TOPPING[t].en).join(' and ')} pizza, please!`);hint('');
    L.later(()=>{face('idle');run()},3200)},700);
}
M.__pz=()=>({i,step:STEPS[i]&&STEPS[i][0],guide:G.state(),bar:(tools.querySelector('.mbar i')||{style:{}}).style.width,tops:S&&S.pz.tops.length,act,hasDown:!!H.down});
games[id]={enter:()=>{cust=null;requestAnimationFrame(newCustomer)},exit:()=>{L.begin();H={};G.stop();if(eng&&eng.stop)eng.stop();document.querySelectorAll('.servepz').forEach(n=>n.remove())},resize:size};
})();
