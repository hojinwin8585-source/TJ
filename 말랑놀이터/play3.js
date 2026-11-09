/* 말랑 놀이터 · 진짜 순서 베이킹, 리듬 따라하기, 칭찬 도장판, 우리 집 드레스 옷장 */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2;if(!P)return;
const {$,say,sfx,tone,cheer,confetti,bounce,pick,rand,cap,games,charaHTML,hold,CNT_KO,CNT_EN,actx,store,toast}=M;
const {screen,life,chip,bigBtn,hint,makeScrub,makeCutter,friendsRow,noise,sweepTone,SFX,CNT_KO_UNIT}=P;
const cur=()=>M.current();
let uid=0;

const css=`
.kitchen{--kbg:linear-gradient(180deg,#FFF8EC 0%,#FFF8EC 58%,#E8BE88 58%,#D9A86E 100%)}
.kitchen::before{content:"";position:absolute;inset:0 0 42% 0;background:repeating-linear-gradient(0deg,transparent 0 38px,rgba(214,190,160,.35) 38px 40px),repeating-linear-gradient(90deg,transparent 0 38px,rgba(214,190,160,.35) 38px 40px);pointer-events:none}
.work{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);touch-action:none;z-index:2}
.work>svg{width:100%;height:100%;display:block;overflow:visible}
.work canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;z-index:3}
.props{position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center;gap:14px;z-index:4;pointer-events:none}
.prop{pointer-events:auto;border:0;background:radial-gradient(circle at 35% 25%,#fff,#F1F4FA);border-radius:22px;padding:6px 10px 4px;display:flex;flex-direction:column;align-items:center;gap:0;
  box-shadow:inset 0 -4px 0 rgba(46,42,79,.1),0 5px 0 rgba(46,42,79,.16),0 9px 12px rgba(46,42,79,.12);transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.prop .pi{font-size:clamp(40px,11vw,56px);line-height:1.1}
.prop .pl{font-size:14px}
.prop.tilt{transform:rotate(-55deg) translate(-10px,10px)}
.prop.gone{transform:translateY(160px) scale(.2);opacity:0;transition:transform .5s ease-in,opacity .5s}
.prop.kpulse{animation:pulse 1.3s ease-in-out infinite}
.sack{width:54px;height:58px;position:relative}
.stream{position:absolute;left:50%;top:34%;width:14px;margin-left:-7px;height:0;border-radius:7px;z-index:3;transition:height .25s;pointer-events:none}
.stream.on{height:22%}
.handtool{position:absolute;left:0;top:0;font-size:52px;line-height:1;pointer-events:none;z-index:6;transform:translate(-50%,-80%);display:none}
.pin{position:absolute;left:50%;top:50%;width:78%;height:34px;margin-left:-39%;border-radius:17px;z-index:6;pointer-events:none;
  background:linear-gradient(180deg,#F2C58E,#D69A5C);box-shadow:inset 0 -5px 0 rgba(0,0,0,.12),0 4px 0 rgba(46,42,79,.18)}
.pin::before,.pin::after{content:"";position:absolute;top:8px;width:34px;height:18px;border-radius:9px;background:#B97A40}
.pin::before{left:-26px}.pin::after{right:-26px}
.rbar{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 6px;flex:none;scroll-behavior:smooth}
.rs{flex:none;display:flex;flex-direction:column;align-items:center;min-width:52px;padding:4px 6px;border-radius:14px;background:rgba(255,255,255,.7);font-size:22px;line-height:1.1;opacity:.55;
  box-shadow:0 3px 0 rgba(46,42,79,.08)}
.rs i{font-style:normal;font-size:11px;white-space:nowrap}
.rs.on{opacity:1;background:var(--paper);box-shadow:0 0 0 3px var(--berry),0 3px 0 rgba(46,42,79,.08)}
.rs.done{opacity:.9}
.rs.done::after{content:"✓";font-size:12px;color:var(--lime)}
.ovtimer{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);font-size:clamp(40px,12vw,64px);color:var(--berry);z-index:5;text-shadow:0 3px 0 #fff;pointer-events:none}
/* rhythm */
.rcards{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:8px}
.rcard{width:clamp(64px,19vw,90px);height:clamp(84px,24vw,112px);border-radius:20px;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  box-shadow:inset 0 4px 0 #fff,0 6px 0 rgba(46,42,79,.12);transition:transform .12s}
.rcard .rv{font-size:34px;line-height:1}
.rcard .rv.sm{font-size:22px;letter-spacing:-4px}
.rcard b{font-weight:400;font-size:18px}
.rcard.hit{transform:translateY(-10px) scale(1.08);box-shadow:0 0 0 4px var(--banana),0 10px 0 rgba(46,42,79,.12)}
.rcard.rest{background:#EEF0F6}
.drum{border:0;background:none;padding:0;font-size:clamp(120px,36vw,190px);line-height:1;filter:drop-shadow(0 8px 0 rgba(46,42,79,.18));touch-action:none;transition:transform .08s}
.drum.hit{transform:scale(.9) translateY(6px)}
.rstage{--kbg:radial-gradient(circle at 50% 70%,#FFF4D6,#FFE2EE 70%);display:flex;flex-direction:column;align-items:center;justify-content:space-around}
/* stamps */
.stp{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:2px 2px 18px}
.stpcard{background:var(--paper);border-radius:26px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:inset 0 4px 0 #fff,0 7px 0 rgba(46,42,79,.1),0 12px 16px rgba(46,42,79,.08)}
.stphead{display:flex;align-items:center;gap:14px}
.stphead .big{font-size:52px;line-height:1;color:#E0393E}
.stphead .goal{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;font-size:16px}
.bar2{height:14px;border-radius:7px;background:#F0EDF7;overflow:hidden}
.bar2 i{display:block;height:100%;background:linear-gradient(90deg,#FF8FB1,#FF6F91);border-radius:7px}
.goalimg{width:62px;height:62px;border-radius:16px;object-fit:contain;background:repeating-conic-gradient(#F3EEF9 0 25%,#FFFFFF 0 50%) 0 0/12px 12px}
.mrow{display:flex;align-items:center;gap:10px;border:0;background:#F7F5FC;border-radius:16px;padding:8px 12px;font-size:18px;text-align:left}
.mrow .mi{font-size:30px}.mrow .mt{flex:1}.mrow .mc{font-size:24px}
.mrow.done{background:#E6F7E0}
.sgrid2{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.slot{aspect-ratio:1;border-radius:50%;border:3px dashed #E4DDF2;display:grid;place-items:center}
.slot svg{width:100%;height:100%}
.stampfx{position:fixed;inset:0;z-index:85;display:grid;place-items:center;pointer-events:none;background:rgba(46,42,79,.25);animation:sfxbg 2.2s forwards}
.stampfx .st{width:min(60vw,260px);animation:thud .45s cubic-bezier(.2,1.6,.4,1) both}
.stampfx p{position:absolute;top:calc(50% + min(34vw,150px));left:0;right:0;text-align:center;font-size:24px;color:#fff;text-shadow:0 2px 0 rgba(46,42,79,.6)}
@keyframes thud{from{transform:scale(3) rotate(-30deg);opacity:0}to{transform:scale(1) rotate(-12deg);opacity:1}}
@keyframes sfxbg{0%,80%{opacity:1}100%{opacity:0}}
.reasons{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%}
.reasons button{border:0;border-radius:16px;background:#F7F5FC;padding:12px 8px;font-size:17px;box-shadow:0 3px 0 rgba(46,42,79,.1)}
/* closet + cutout */
.clist{display:flex;flex-direction:column;gap:10px;width:100%}
.citem{display:flex;align-items:center;gap:10px;background:#F7F5FC;border-radius:16px;padding:8px}
.citem img{width:56px;height:56px;object-fit:contain;border-radius:12px;background:repeating-conic-gradient(#EEE8F7 0 25%,#FFFFFF 0 50%) 0 0/10px 10px}
.citem input{flex:1;min-width:0;font-size:16px;border:2px solid var(--hole);border-radius:10px;padding:6px 8px}
.citem .seg button{padding:6px 8px;font-size:14px}
.cobox{width:min(340px,100%);aspect-ratio:1;background:repeating-conic-gradient(#EEE8F7 0 25%,#FFFFFF 0 50%) 0 0/18px 18px;border-radius:16px;display:grid;place-items:center;overflow:hidden;touch-action:none}
#coCanvas{max-width:100%;max-height:100%;touch-action:none;cursor:crosshair}
.corow{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* =================================================================
   REAL BAKING (pizza · bread · cake)
   ================================================================= */
const SACK=(label,color)=>`<svg class="sack" viewBox="0 0 54 58"><path d="M8 14Q6 4 14 4H40Q48 4 46 14L50 50Q50 56 44 56H10Q4 56 4 50Z" fill="${color}" stroke="rgba(46,42,79,.25)" stroke-width="2"/><path d="M12 12H42" stroke="rgba(46,42,79,.25)" stroke-width="2"/><text x="27" y="38" font-size="11" text-anchor="middle" fill="#6B4A2A" font-family="Jua,sans-serif">${label}</text></svg>`;
const ING={
  flour:{p:SACK('밀가루','#FFF8E8'),ko:'밀가루',en:'flour',color:'#FFFDF5'},
  sugar:{p:SACK('설탕','#F3F7FF'),ko:'설탕',en:'sugar',color:'#FFFFFF'},
  yeast:{p:SACK('이스트','#FFE9C2'),ko:'이스트',en:'yeast',color:'#E9C98C'},
  water:{p:'🫗',ko:'물',en:'water',color:'#CFEAFF'},
  milk:{p:'🥛',ko:'우유',en:'milk',color:'#FFFFFF'},
  salt:{p:'🧂',ko:'소금',en:'salt',color:'#FFFFFF'},
  oil:{p:'🫒',ko:'올리브유',en:'olive oil',color:'#D9C44A'},
  butter:{p:'🧈',ko:'버터',en:'butter',color:'#FFE08A'},
  egg:{p:'🥚',ko:'달걀',en:'egg',color:'#FFC93C'}
};
function lerpC(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const c=[16,8,0].map(s=>Math.round(((A>>s)&255)*(1-t)+((B>>s)&255)*t));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}

function makeBakery(id,title,steps,o){
  const L=life(id);
  const sec=screen(id,title,'',`<div class="rbar" id="${id}Bar"></div><div class="kstage kitchen" id="${id}Stage"><div class="props"></div><div class="work"><svg viewBox="-120 -120 240 240"></svg></div></div><div class="ktray" id="${id}Tray"></div>`);
  const stage=sec.querySelector('.kstage'),work=sec.querySelector('.work'),props=sec.querySelector('.props'),tray=sec.querySelector('.ktray'),bar=sec.querySelector('.rbar');
  let svg=work.querySelector('svg'),V,i=0,H={},act=null,eng=null,raf=0;
  const p='bk'+(++uid);
  bar.innerHTML=steps.map((s,k)=>`<span class="rs" data-k="${k}">${s.icon}<i>${s.ko}</i></span>`).join('');
  function size(){const z=Math.round(Math.max(170,Math.min(stage.clientWidth*.86,stage.clientHeight*.7)));work.style.width=work.style.height=z+'px'}
  /* ---------- drawing ---------- */
  function bowlSVG(){
    const lv=V.level,k=.5+.5*lv,ry=25*k,rx=94*k,cy=-30+(1-lv)*14;
    let s=`<path d="M-106 -30Q-106 102 0 102Q106 102 106 -30Z" fill="#8FD0FA"/><path d="M-80 0Q-70 70 -10 84" stroke="rgba(255,255,255,.55)" stroke-width="10" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-30" rx="106" ry="30" fill="#6FBDEE"/><ellipse cx="0" cy="-30" rx="97" ry="25" fill="#EAF5FC"/>`;
    if(lv>0){
      s+=`<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${V.color}"/>`;
      for(let j=0;j<V.lumps;j++){const a=j*2.4,r=(j%3+1)*rx*.25;s+=`<circle cx="${(Math.cos(a)*r).toFixed(1)}" cy="${(cy+Math.sin(a)*r*.25).toFixed(1)}" r="5" fill="rgba(255,255,255,.9)"/>`}
      V.specks.forEach(([x,y,c])=>{s+=`<circle cx="${x*rx}" cy="${cy+y*ry}" r="4" fill="${c}"/>`});
      for(let j=0;j<V.yolks;j++)s+=`<circle cx="${-30+j*28}" cy="${cy-2+(j%2)*6}" r="11" fill="#FFB31A" stroke="#FFF3D0" stroke-width="5"/>`;
      if(V.swirl)s+=`<g transform="translate(0 ${cy}) scale(1 ${(ry/rx).toFixed(3)}) rotate(${V.swirl})"><path d="M0 0C20 -30 50 -10 45 20C40 50 -10 60 -40 30" stroke="rgba(255,255,255,.6)" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
    }
    return s;
  }
  function doughSVG(){
    const s=V.ds,sq=V.squish?[1.12,.82]:[1,1],rx=66*s*sq[0],ry=46*s*sq[1];
    let o=`<defs><radialGradient id="${p}d" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FFF6E2"/><stop offset="1" stop-color="#EBCB94"/></radialGradient></defs>
      <rect x="-112" y="-78" width="224" height="180" rx="26" fill="#E7B67E"/><path d="M-100 -40H100M-100 10H100M-100 60H100" stroke="rgba(150,95,40,.15)" stroke-width="3"/>
      <ellipse cx="0" cy="${30+ry*.25}" rx="${rx}" ry="${ry*.35}" fill="rgba(120,70,30,.18)"/><ellipse cx="0" cy="18" rx="${rx}" ry="${ry}" fill="url(#${p}d)"/>`;
    for(let j=0;j<V.bumps;j++){const a=j*1.9,r=(.3+(j%4)*.15);o+=`<circle cx="${(Math.cos(a)*rx*r).toFixed(1)}" cy="${(18+Math.sin(a)*ry*r).toFixed(1)}" r="${4+j%3}" fill="rgba(200,160,100,.45)"/>`}
    if(V.cloth)o+=`<path d="M${-rx-18} ${18-ry-6}Q0 ${18-ry-40} ${rx+18} ${18-ry-6}L${rx+26} ${18+ry+8}Q0 ${18+ry+22} ${-rx-26} ${18+ry+8}Z" fill="#FF8FB1" opacity=".95"/><path d="M${-rx} ${18-ry+6}L${rx} ${18-ry+6}M${-rx-8} ${18}L${rx+8} 18M${-rx} ${18+ry-4}L${rx} ${18+ry-4}" stroke="#fff" stroke-width="6" opacity=".7"/>`;
    return o;
  }
  function flatSVG(){
    const r=V.r;let s=`<circle r="${r}" fill="${V.baked?'#D9963F':'#F2CF98'}"/>`;
    if(V.sauce)s+=`<circle r="${r-13}" fill="#D9412B"/>`;
    V.cheese.forEach(([x,y,c])=>{s+=`<circle cx="${x}" cy="${y}" r="${c}" fill="${V.baked?'#F5B83D':'#FFE07A'}" opacity=".95"/>`});
    V.tops.forEach(([e,x,y])=>{s+=`<text x="${x}" y="${y}" font-size="24" text-anchor="middle" dominant-baseline="central">${e}</text>`});
    return s;
  }
  function rollsSVG(){
    let s=`<rect x="-114" y="-90" width="228" height="190" rx="14" fill="#B9BFCB"/><rect x="-104" y="-80" width="208" height="170" rx="10" fill="#D5DAE3"/>`;
    if(V.big>0)s+=`<ellipse cx="0" cy="0" rx="${60*V.big+10}" ry="${42*V.big+8}" fill="#F0D3A0"/>`;
    V.rolls.forEach(([x,y,g])=>{s+=`<ellipse cx="${x}" cy="${y+6}" rx="26" ry="10" fill="rgba(0,0,0,.12)"/><circle cx="${x}" cy="${y}" r="25" fill="${V.baked?'#C9782E':'#F3D7A6'}"/>`+
      (g?`<ellipse cx="${x-7}" cy="${y-9}" rx="10" ry="6" fill="rgba(255,255,255,${V.baked?.45:.7})"/>`:'')+(V.baked?`<path d="M${x-10} ${y-4}Q${x} ${y-12} ${x+10} ${y-4}" stroke="#A35F20" stroke-width="3" fill="none"/>`:'')});
    return s;
  }
  function tinSVG(){
    const lv=V.tin;let s='';
    if(V.baked)s+=`<path d="M-86 -10Q-86 -64 0 -66Q86 -64 86 -10Z" fill="#E9B45C"/><path d="M-86 -10Q-86 -54 0 -56Q86 -54 86 -10Z" fill="#F5CE7E"/>`;
    s+=`<rect x="-92" y="-14" width="184" height="90" rx="10" fill="#C3C9D3"/><rect x="-84" y="-6" width="168" height="74" rx="6" fill="#E6EAF0"/>`;
    if(lv>0)s+=`<rect x="-84" y="${68-74*Math.min(1,lv)}" width="168" height="${74*Math.min(1,lv)}" rx="6" fill="${V.baked?'#F5CE7E':'#FFE59A'}"/>`;
    s+=`<rect x="-92" y="-14" width="184" height="90" rx="10" fill="none" stroke="#9AA2B1" stroke-width="4"/>`;
    return s;
  }
  function cakeSVG(){
    let s=`<circle r="102" fill="#F5CE7E"/>`;
    if(V.cream)s+=`<circle r="100" fill="#FFFFFF"/><circle r="100" fill="none" stroke="#FFF0F5" stroke-width="12" stroke-dasharray="10 8"/><circle r="78" fill="none" stroke="#FCE4EC" stroke-width="3"/>`;
    V.fruits.forEach((e,j)=>{const a=j/Math.max(V.fruits.length,1)*Math.PI*2-Math.PI/2;s+=`<text x="${(64*Math.cos(a)).toFixed(1)}" y="${(64*Math.sin(a)).toFixed(1)}" font-size="26" text-anchor="middle" dominant-baseline="central">${e}</text>`});
    V.candles.forEach((lit,j)=>{const [x,y]=candlePos(j);s+=`<rect x="${x-5}" y="${y-4}" width="10" height="26" rx="3" fill="#FF8FAB" stroke="#fff" stroke-width="2"/>`+(lit?`<ellipse class="flame" cx="${x}" cy="${y-12}" rx="7" ry="11" fill="#FFB020"/><ellipse cx="${x}" cy="${y-10}" rx="3" ry="6" fill="#FFF3B0"/>`:'')});
    return s;
  }
  function candlePos(j){const n=V.candles.length;const a=(j-(n-1)/2)*0.55;return[Math.round(Math.sin(a)*34),Math.round(-6-Math.cos(a)*10)]}
  function ovenSVG(){
    const glow=V.ovenOn?'#FFB04D':'#4A4258';
    return `<rect x="-110" y="-100" width="220" height="200" rx="18" fill="#E9ECF2"/><rect x="-110" y="-100" width="220" height="40" rx="18" fill="#CDD3DD"/>
      <circle cx="-70" cy="-80" r="10" fill="#8E96A6"/><circle cx="-40" cy="-80" r="10" fill="#8E96A6"/><text x="60" y="-74" font-size="18" text-anchor="middle" fill="#E0393E" font-family="Jua,sans-serif">${o.temp}</text>
      <rect x="-90" y="-44" width="180" height="128" rx="12" fill="${V.inOven&&V.ovenOpen===false?glow:'#3A3346'}" stroke="#9AA2B1" stroke-width="6"/>
      ${V.inOven?`<text x="0" y="24" font-size="70" text-anchor="middle" dominant-baseline="central" opacity="${V.ovenOpen===false?.85:1}">${o.emoji}</text>`:''}
      <rect x="-60" y="-58" width="120" height="10" rx="5" fill="#9AA2B1"/>`;
  }
  function draw(){
    const m=V.mode;
    svg.innerHTML=m==='bowl'?bowlSVG():m==='dough'?doughSVG():m==='flat'?flatSVG():m==='rolls'?rollsSVG():m==='tin'?tinSVG():m==='cake'?cakeSVG():ovenSVG();
  }
  function itemInner(){return V.mode==='flat'?flatSVG():cakeSVG()}
  /* ---------- pointer routing on the work area ---------- */
  const pt=e=>{const r=work.getBoundingClientRect();return[(e.clientX-(r.left+r.width/2))*240/r.width,(e.clientY-(r.top+r.height/2))*240/r.height,e.clientX-stage.getBoundingClientRect().left,e.clientY-stage.getBoundingClientRect().top]};
  work.addEventListener('pointerdown',e=>{if(!H.down||act!==null)return;e.preventDefault();try{work.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId;H.down(pt(e))});
  work.addEventListener('pointermove',e=>{if(act!==e.pointerId||!H.move)return;H.move(pt(e))});
  const endp=e=>{if(act!==e.pointerId)return;act=null;if(H.up)H.up(pt(e))};
  work.addEventListener('pointerup',endp);work.addEventListener('pointercancel',endp);work.addEventListener('lostpointercapture',endp);
  /* ---------- helpers ---------- */
  function prop(html,label,onTap,pulse=true){
    const b=document.createElement('button');b.className='prop'+(pulse?' kpulse':'');b.innerHTML=`<span class="pi">${html}</span><span class="pl">${label}</span>`;
    let lock=false;b.addEventListener('pointerdown',e=>{e.preventDefault();if(lock)return;lock=true;setTimeout(()=>{lock=false},380);actx();onTap(b)});props.appendChild(b);return b;
  }
  function tool(emo){let t=stage.querySelector('.handtool');if(!t){t=document.createElement('div');t.className='handtool';stage.appendChild(t)}t.textContent=emo;return t}
  function moveTool(t,q){t.style.display='block';t.style.left=q[2]+'px';t.style.top=q[3]+'px'}
  function stream(color){let s=stage.querySelector('.stream');if(!s){s=document.createElement('div');s.className='stream';stage.appendChild(s)}s.style.background=color;s.classList.add('on');setTimeout(()=>s.classList.remove('on'),450)}
  const done=(ko,en)=>{H={};props.innerHTML='';const t=stage.querySelector('.handtool');if(t)t.style.display='none';SFX.sparkle();if(ko)say(ko,en);L.later(next,1300)};
  /* ---------- step types ---------- */
  const T={
    pour(s){
      V.mode='bowl';draw();const ig=ING[s.ing];let k=0;
      prop(ig.p,ig.ko,b=>{b.classList.add('tilt');setTimeout(()=>b.classList.remove('tilt'),520);stream(ig.color==='#FFFFFF'?'#F4F7FB':ig.color);
        s.ing==='water'||s.ing==='milk'?noise(.5,{type:'lowpass',freq:1400,vol:.2}):noise(.4,{freq:900,vol:.15});
        k++;V.level=Math.min(1,V.level+s.amt/s.n);if(V.color==='#FFFFFF'||k===1&&V.level<=s.amt/s.n+.01)V.color=s.c||ig.color;else V.color=lerpC(V.color,s.c||ig.color,.5);
        if(s.ing==='flour')V.lumps=Math.min(9,V.lumps+3);draw();
        say(`${CNT_KO_UNIT(k)} ${s.unit}!`,`${cap(CNT_EN[k-1])} ${s.unitEn}!`);
        if(k>=s.n)done()});
    },
    crack(s){
      V.mode='bowl';draw();let k=0;
      prop('🥚','달걀',b=>{bounce(b);noise(.06,{freq:2500,vol:.35});setTimeout(()=>noise(.08,{freq:1800,vol:.3}),120);k++;V.yolks++;V.level=Math.min(1,V.level+.12);if(V.level<.2)V.color='#FFE9A8';draw();
        say(`톡! 달걀 ${CNT_KO_UNIT(k)} 개!`,`Crack! ${cap(CNT_EN[k-1])} ${k>1?'eggs':'egg'}!`);if(k>=s.n){b.classList.add('gone');done()}});
    },
    add(s){
      V.mode='bowl';draw();let left=s.items.length;
      s.items.forEach(key=>{const ig=ING[key];const b=prop(ig.p,ig.ko,()=>{if(b.dataset.used)return;b.dataset.used=1;b.classList.remove('kpulse');b.classList.add('gone');
        for(let j=0;j<4;j++)V.specks.push([(Math.random()-.5)*1.2,(Math.random()-.5)*1.2,ig.color==='#FFFFFF'?'#E8ECF3':ig.color]);draw();sfx.pop();say(ig.ko+'!',cap(ig.en)+'!');
        if(--left===0)done()})});
    },
    stir(s){
      V.mode='bowl';draw();const t=tool(s.tool||'🥄');let last=null,acc=0,turns=0;const c0=V.color,need=s.rot*Math.PI*2,L0=V.lumps;
      H={down:q=>{last=Math.atan2(q[1]+20,q[0]);moveTool(t,q)},
        move:q=>{moveTool(t,q);const a=Math.atan2(q[1]+20,q[0]);if(last===null){last=a;return}let d=a-last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;last=a;
          if(Math.hypot(q[0],q[1]+20)<14)return;acc+=Math.abs(d);const pr=Math.min(1,acc/need);V.color=lerpC(c0,s.c,pr);V.lumps=Math.round(L0*(1-pr));V.specks=V.specks.filter(()=>Math.random()>.02);V.swirl=a*57.3;
          if(!raf)raf=requestAnimationFrame(()=>{raf=0;draw()});
          if(Math.random()<.15)noise(.12,{type:'lowpass',freq:500,vol:.12});
          const tn=Math.floor(acc/(Math.PI*2));if(tn>turns){turns=tn;say(`${CNT_KO_UNIT(turns)} 바퀴!`,`${cap(CNT_EN[turns-1])}!`,true)}
          if(pr>=1){V.swirl=0;V.specks=[];draw();done(s.dk,s.de)}},
        up:()=>{last=null;t.style.display='none'}};
    },
    knead(s){
      V.mode='dough';V.ds=1;V.bumps=10;draw();let k=0;
      H={down:()=>{V.squish=true;k++;V.bumps=Math.max(0,10-Math.round(k*10/s.n));draw();sweepTone(220,160,.12,'sine',.25);say(`꾹! ${CNT_KO[k-1]}`,`Press! ${cap(CNT_EN[k-1])}`);
          setTimeout(()=>{V.squish=false;draw()},150);if(k>=s.n)done('반죽이 매끈매끈해졌어요!','The dough is smooth!')}};
    },
    rise(){
      V.mode='dough';draw();
      prop('🧣','천 덮기',b=>{b.remove();V.cloth=true;draw();say('반죽을 덮고 따뜻한 곳에서 기다려요. 쑥쑥 부풀어라!','Cover the dough and wait. Grow, dough, grow!');
        let n=0;const iv=setInterval(()=>{if(cur()!==id){clearInterval(iv);return}n++;V.ds=1+n*.045;draw();if(n%10===0){const c=3-n/10;if(c>0){hint(stage,`기다려요… ${c}`);tone(660,.1,'sine',.1)}}
          if(n>=30){clearInterval(iv);V.cloth=false;draw();hint(stage,'짜잔! 두 배로 부풀었어요!');done('짜잔! 반죽이 부풀었어요!','Ta-da! The dough grew big!')}},100);L.onEnd(()=>clearInterval(iv))});
    },
    roll(s){
      V.mode='flat';V.r=52;draw();const pin=document.createElement('div');pin.className='pin';work.appendChild(pin);let sx=null,dir=0,travel=0,passes=0;
      H={down:q=>{sx=q[0];pin.style.top=(q[1]/240*100+50)+'%'},
        move:q=>{pin.style.top=(q[1]/240*100+50)+'%';if(sx===null){sx=q[0];return}const d=q[0]-sx;sx=q[0];const nd=Math.sign(d);if(!nd)return;
          if(nd!==dir){if(travel>45){passes++;V.r=Math.min(100,52+passes*8);draw();sweepTone(140,110,.15,'triangle',.18);say(`밀어요! ${CNT_KO[passes-1]}`,`Roll! ${cap(CNT_EN[passes-1])}`);
            if(passes>=s.n){pin.remove();done('동그랗고 납작하게 밀었어요!','Nice and flat!')}}dir=nd;travel=0}travel+=Math.abs(d)},
        up:()=>{sx=null}};
    },
    shape(s){
      V.mode='rolls';V.big=1;V.rolls=[];draw();const SL=[[-62,-44],[0,-44],[62,-44],[-62,30],[0,30],[62,30]];
      H={down:()=>{const k=V.rolls.length;if(k>=s.n)return;V.rolls.push([SL[k][0],SL[k][1],false]);V.big=Math.max(0,1-(k+1)/s.n);draw();sfx.pop();say(`동글동글 ${CNT_KO[k]}!`,`Roll a ball, ${CNT_EN[k]}!`);
        if(k+1>=s.n)done('빵 반죽 여섯 개 완성!','Six little buns!')}};
    },
    glaze(){
      V.mode='rolls';draw();const t=tool('🖌️');let k=0;
      H={down:q=>{moveTool(t,q);const r=V.rolls.find(r=>!r[2]&&Math.hypot(r[0]-q[0],r[1]-q[1])<34);if(!r)return;r[2]=true;k++;draw();noise(.15,{freq:3000,vol:.1});say(`반짝! ${CNT_KO[k-1]}`,`Shiny! ${cap(CNT_EN[k-1])}`);
          if(V.rolls.every(r=>r[2]))done('달걀물을 발라서 반짝반짝!','Egg wash makes them shiny!')},move:q=>moveTool(t,q),up:()=>{t.style.display='none'}};
    },
    spread(s){
      if(s.on==='cake'){V.mode='cake'}draw();const cv=document.createElement('canvas');work.appendChild(cv);const t=tool(s.tool);
      const mv=e=>{const r=stage.getBoundingClientRect();t.style.display='block';t.style.left=(e.clientX-r.left)+'px';t.style.top=(e.clientY-r.top)+'px'};
      cv.addEventListener('pointermove',mv);cv.addEventListener('pointerdown',mv);cv.addEventListener('pointerup',()=>{t.style.display='none'});
      const R=s.on==='cake'?98:V.r-13;
      eng=makeScrub(cv,{mode:'paint',color:s.color,brush:.08,maskR:R/240,threshold:.8,onMove:()=>SFX.scrub(),
        onDone:()=>{if(s.on==='cake')V.cream=true;else V.sauce=true;cv.remove();draw();done(s.dk,s.de)}});eng.start();
    },
    sprinkle(s){
      let k=0;draw();
      H={down:q=>{const R=(V.mode==='flat'?V.r-20:60);for(let j=0;j<3;j++){let x=q[0]+(Math.random()-.5)*36,y=q[1]+(Math.random()-.5)*36;const d=Math.hypot(x,y);if(d>R){x*=R/d;y*=R/d}
          if(V.mode==='flat')V.cheese.push([+x.toFixed(1),+y.toFixed(1),6+Math.random()*6]);else V.specks.push([x/100,y/100,'#FFFFFF'])}
        draw();tone(900+k*40,.06,'sine',.12);k++;if(k>=s.n)done(s.dk,s.de)}};
    },
    top(s){
      tray.innerHTML='';let btn=null;
      s.items.forEach(t=>chip(tray,t[0],M.S.lang==='en'?t[2]:t[1],()=>{if(V.tops.length>=14)return;const a=Math.random()*Math.PI*2,r=Math.random()*(V.r-34);V.tops.push([t[0],+(r*Math.cos(a)).toFixed(1),+(r*Math.sin(a)).toFixed(1)]);
        draw();sfx.pop();say(t[1]+'!',cap(t[2])+'!');if(V.tops.length>=3&&!btn)btn=bigBtn(tray,'다음 ▶',()=>{tray.innerHTML='';done()},true)}));
    },
    pan(){
      V.mode='tin';V.tin=0;draw();let k=0;
      prop('🥣','반죽 붓기',b=>{b.classList.add('tilt');setTimeout(()=>b.classList.remove('tilt'),520);stream('#FFE59A');noise(.5,{type:'lowpass',freq:700,vol:.2});k++;V.tin=k/3;draw();
        say(`주르륵! ${CNT_KO[k-1]}`,`Pour! ${cap(CNT_EN[k-1])}`);if(k>=3)done('틀에 다 부었어요!','All in the pan!')});
    },
    oven(){
      const prev=V.mode;V.mode='oven';V.inOven=false;V.ovenOpen=true;V.ovenOn=false;draw();
      say('오븐은 뜨거워요! 어른이랑 같이, 오븐 장갑을 껴요.','The oven is hot! Put on oven mitts with a grown-up.');
      prop('🧤','장갑 끼기',b=>{b.remove();sfx.pop();
        prop(`<span style="font-size:.8em">${o.emoji}➡️</span>`,'오븐에 넣기',b2=>{b2.remove();V.inOven=true;V.ovenOpen=false;V.ovenOn=true;draw();noise(.2,{freq:400,vol:.2});
          say(`${o.temp}에서 구워요! 셋, 둘, 하나!`,`Bake at ${o.tempEn}! Three, two, one!`);
          const tm=document.createElement('div');tm.className='ovtimer';stage.appendChild(tm);
          [3,2,1].forEach((n,j)=>L.later(()=>{tm.textContent=n;tone(700,.08,'square',.08)},j*900));
          L.later(()=>{tm.remove();SFX.ding();say('띵! 다 구워졌어요! 장갑 끼고 꺼내요.','Ding! It is done! Take it out with mitts.');
            prop('🧤','꺼내기',b3=>{b3.remove();V.baked=true;V.inOven=false;V.ovenOn=false;V.mode=prev;draw();confetti(10);done('음~ 고소한 냄새!','Mmm, smells so good!')})},2800)})});
    },
    cool(){
      V.mode='tin';draw();let k=0;
      prop('🌬️','식히기',b=>{bounce(b);noise(.6,{type:'lowpass',freq:800,vol:.2});k++;say(`후~ ${CNT_KO[k-1]}`,`Blow! ${cap(CNT_EN[k-1])}`);
        if(k>=3){V.mode='cake';done('케이크가 식었어요. 이제 꾸며요!','The cake cooled. Let\'s decorate!')}});
    },
    decorate(){
      V.mode='cake';draw();tray.innerHTML='';let btn=null;
      [['🍓','딸기','strawberry'],['🫐','블루베리','blueberry'],['🍒','체리','cherry'],['🍑','복숭아','peach']].forEach(f=>chip(tray,f[0],M.S.lang==='en'?f[2]:f[1],()=>{if(V.fruits.length>=10)return;V.fruits.push(f[0]);draw();sfx.pop();say(f[1]+'!',cap(f[2])+'!')}));
      chip(tray,'🕯️','초',()=>{if(V.candles.length>=5)return;V.candles.push(true);draw();sfx.pop();say(CNT_KO[V.candles.length-1],CNT_EN[V.candles.length-1]);
        if(!btn)btn=bigBtn(tray,'촛불 켜기 🎂',()=>{tray.innerHTML='';done()})});
    },
    blow(){
      V.mode='cake';draw();const nm=M.CAST.hero.name;say(nm?`${nm}야, 촛불을 콕 눌러서 후~ 불어 봐!`:'촛불을 콕 눌러서 후~ 불어 봐!','Tap the candles to blow them out!');
      H={down:q=>{const j=V.candles.findIndex((lit,k)=>{if(!lit)return false;const [x,y]=candlePos(k);return Math.hypot(q[0]-x,q[1]-(y-10))<26});if(j<0)return;V.candles[j]=false;draw();noise(.3,{type:'lowpass',freq:700,vol:.2});
        if(V.candles.every(x=>!x)){H={};const HB=[[392,.75],[392,.25],[440,1],[392,1],[523.25,1],[493.88,2],[392,.75],[392,.25],[440,1],[392,1],[587.33,1],[523.25,2],[392,.75],[392,.25],[783.99,1],[659.25,1],[523.25,1],[493.88,1],[440,2],[698.46,.75],[698.46,.25],[659.25,1],[523.25,1],[587.33,1],[523.25,2]];
          let t=0;HB.forEach(([f,d])=>{tone(f,d*.4+.15,'triangle',.18,t);t+=d*.4});confetti(24);hint(stage,'🎉 생일 축하합니다! 🎉');
          L.later(()=>{say(`생일 축하해요, ${nm?nm+' 공주':'우리 공주님'}!`,'Happy birthday!');done()},t*1000+200)}}};
    },
    cut(s){
      H={};const top=itemInner();work.innerHTML='';const box=document.createElement('div');box.style.cssText='position:absolute;inset:0';work.appendChild(box);
      const fr=friendsRow(s.n===6?6:4);
      say(`${s.tool==='🍕'?'피자 칼':'칼'}로 가운데를 쓱 지나가게 잘라요!`,'Swipe across the middle to cut!');hint(stage,'가운데를 지나가게 쓱~ 두 번 잘라요');
      eng=makeCutter(box,{top,target:2,
        onCut:n=>say(`${CNT_KO_UNIT(n)} 조각!`,`${cap(CNT_EN[n-1])} pieces!`),
        onSeparated:()=>{hint(stage,'조각을 눌러서 친구들에게 나눠 줘요');tray.innerHTML='<div class="plates">'+fr.map(c=>`<div class="plate2">${charaHTML(c)}<span class="dish"></span></div>`).join('')+'</div>'},
        onServe:(k,n)=>{const d=tray.querySelectorAll('.dish')[k-1];if(d){d.textContent=o.emoji;bounce(d.parentElement)}SFX.chomp();say(CNT_KO[k-1],CNT_EN[k-1]);if(k>=n)L.later(finish,600)}});
      const kn=box.querySelector('.knife');if(kn)kn.textContent=s.tool;
    },
    serve(){
      V.mode='rolls';draw();const fr=friendsRow(6);tray.innerHTML='<div class="plates">'+fr.map(c=>`<div class="plate2">${charaHTML(c)}<span class="dish"></span></div>`).join('')+'</div>';
      let k=0;H={down:q=>{const r=V.rolls.find(r=>!r[3]&&Math.hypot(r[0]-q[0],r[1]-q[1])<34);if(!r)return;r[3]=true;V.rolls=V.rolls.filter(x=>x!==r);draw();k++;
        const d=tray.querySelectorAll('.dish')[k-1];if(d){d.textContent='🍞';bounce(d.parentElement)}SFX.chomp();say(CNT_KO[k-1],CNT_EN[k-1]);if(!V.rolls.length){H={};L.later(finish,600)}}};
    }
  };
  function finish(){cheer(o.endKo,o.endEn);bar.querySelectorAll('.rs').forEach(r=>{r.className='rs done'});L.later(()=>{tray.innerHTML='';bigBtn(tray,'다시 만들기 🔄',start)},1700)}
  function next(){
    i++;if(i>=steps.length){finish();return}run();
  }
  function run(){
    H={};props.innerHTML='';if(eng&&eng.stop)eng.stop();eng=null;const s=steps[i];
    bar.querySelectorAll('.rs').forEach((r,k)=>{r.className='rs'+(k<i?' done':k===i?' on':'')});
    const on=bar.querySelector('.rs.on');if(on)bar.scrollLeft=Math.max(0,on.offsetLeft-bar.clientWidth/2+30);
    if(s.type!=='top'&&s.type!=='decorate')tray.innerHTML=`<span class="hint" style="font-size:16px">${i+1}단계 · ${s.icon} ${s.ko}</span>`;
    hint(stage,s.hint||s.ko);if(s.say)say(s.say[0],s.say[1]);
    T[s.type](s);
  }
  function start(){
    L.begin();H={};act=null;if(eng&&eng.stop)eng.stop();eng=null;
    work.innerHTML='<svg viewBox="-120 -120 240 240"></svg>';svg=work.querySelector('svg');props.innerHTML='';stage.querySelectorAll('.handtool,.stream,.ovtimer').forEach(n=>n.remove());
    V={mode:'bowl',level:0,color:'#FFFFFF',lumps:0,specks:[],yolks:0,swirl:0,ds:1,bumps:0,squish:false,cloth:false,r:52,sauce:false,cheese:[],tops:[],baked:false,big:0,rolls:[],tin:0,cream:false,fruits:[],candles:[],inOven:false};
    i=0;requestAnimationFrame(()=>{size();draw();say(o.introKo,o.introEn);L.later(run,1400)});
  }
  games[id]={enter:start,exit:()=>{L.begin();H={};if(eng&&eng.stop)eng.stop()},resize:()=>{size()}};
}

const TOPS=[['🍄','버섯','mushroom'],['🫑','피망','pepper'],['🍅','토마토','tomato'],['🫒','올리브','olive'],['🌽','옥수수','corn'],['🍍','파인애플','pineapple'],['🥓','베이컨','bacon']];
/* 피자는 pizzashop.js (말랑 피자가게)로 옮겼어요 */
makeBakery('bread','빵 굽기',[
  {type:'pour',icon:'🌾',ko:'밀가루',ing:'flour',n:3,amt:.5,unit:'컵',unitEn:'cup',hint:'밀가루를 세 컵 부어요',say:['밀가루를 세 컵 부어요!','Pour three cups of flour!']},
  {type:'pour',icon:'🥛',ko:'우유',ing:'milk',n:2,amt:.25,unit:'컵',unitEn:'cup',c:'#FBF4E6',hint:'우유를 두 컵 부어요',say:['우유를 두 컵 부어요!','Pour two cups of milk!']},
  {type:'crack',icon:'🥚',ko:'달걀',n:1,hint:'달걀을 톡 깨서 넣어요',say:['달걀을 톡 깨서 넣어요!','Crack an egg!']},
  {type:'add',icon:'🧈',ko:'버터·설탕',items:['butter','sugar','yeast'],hint:'버터, 설탕, 이스트를 넣어요',say:['버터랑 설탕, 이스트를 넣어요.','Add butter, sugar and yeast.']},
  {type:'stir',icon:'🥄',ko:'섞기',rot:3,c:'#F4DFB6',tool:'🥄',hint:'빙글빙글 세 바퀴 섞어요',say:['빙글빙글 섞어요!','Stir it up!'],dk:'잘 섞였어요!',de:'Well mixed!'},
  {type:'knead',icon:'👐',ko:'반죽하기',n:8,hint:'꾹꾹 8번 반죽해요',say:['꾹꾹 반죽해요!','Knead the dough!']},
  {type:'rise',icon:'⏳',ko:'부풀리기',hint:'천을 덮고 기다려요',say:['천을 덮고 반죽이 부풀 때까지 기다려요.','Cover and let it rise.']},
  {type:'shape',icon:'⚪',ko:'동글동글',n:6,hint:'반죽을 콕콕 눌러 동그란 빵 6개를 만들어요',say:['반죽을 떼어서 동글동글 빵을 만들어요!','Make little round buns!']},
  {type:'glaze',icon:'🖌️',ko:'달걀물',hint:'붓으로 빵을 하나씩 콕 발라요',say:['붓으로 달걀물을 발라요. 그래야 반짝반짝해요!','Brush on egg wash so they shine!']},
  {type:'oven',icon:'🔥',ko:'굽기',hint:'장갑 끼고 오븐에 넣어요'},
  {type:'serve',icon:'🍞',ko:'나눠 먹기',hint:'빵을 눌러서 친구들에게 나눠 줘요',say:['따끈따끈한 빵을 친구들에게 나눠 줘요!','Share the warm buns with friends!']}
],{emoji:'🍞',temp:'180도',tempEn:'180 degrees',introKo:'빵집 놀이! 진짜 빵 만드는 순서대로 해 볼까?',introEn:'Bakery time! Let\'s bake real bread step by step!',endKo:'따끈따끈 빵 완성! 냠냠!',endEn:'Warm bread is ready! Yummy!'});

makeBakery('cake','케이크 만들기',[
  {type:'crack',icon:'🥚',ko:'달걀',n:3,hint:'달걀 3개를 톡톡 깨요',say:['케이크는 달걀부터! 세 개를 깨요.','Cakes start with eggs! Crack three.']},
  {type:'add',icon:'🍬',ko:'설탕',items:['sugar'],hint:'설탕을 넣어요',say:['달콤한 설탕을 넣어요.','Add the sweet sugar.']},
  {type:'stir',icon:'🌀',ko:'거품 내기',rot:4,c:'#FFF1C9',tool:'🌀',hint:'거품기로 빙글빙글 네 바퀴!',say:['거품기로 빠르게 휘휘 저어요. 하얗게 부풀어요!','Whisk fast until it gets fluffy!'],dk:'폭신폭신 거품이 됐어요!',de:'So fluffy!'},
  {type:'sprinkle',icon:'🌾',ko:'밀가루 체치기',n:5,hint:'콕콕 눌러서 밀가루를 솔솔 체쳐요',say:['체에 밀가루를 솔솔 쳐서 넣어요.','Sift in the flour.'],dk:'솔솔 다 넣었어요!',de:'All sifted!'},
  {type:'stir',icon:'🥄',ko:'살살 섞기',rot:2,c:'#FFE59A',tool:'🥄',hint:'주걱으로 살살 두 바퀴',say:['이번엔 살살 섞어요.','Now fold gently.'],dk:'반죽 완성!',de:'Batter is ready!'},
  {type:'pan',icon:'🥣',ko:'틀에 붓기',hint:'그릇을 눌러 케이크 틀에 부어요',say:['케이크 틀에 반죽을 부어요.','Pour the batter into the pan.']},
  {type:'oven',icon:'🔥',ko:'굽기',hint:'장갑 끼고 오븐에 넣어요'},
  {type:'cool',icon:'🌬️',ko:'식히기',hint:'후~ 불어서 식혀요',say:['뜨거운 케이크를 식혀요. 후~ 불어 볼까?','Let the hot cake cool. Blow!']},
  {type:'spread',icon:'🍦',ko:'생크림',on:'cake',color:'#FFFFFF',tool:'🔪',hint:'생크림을 쓱쓱 펴 발라요',say:['하얀 생크림을 쓱쓱 발라요!','Spread the whipped cream!'],dk:'하얀 케이크가 됐어요!',de:'A snowy white cake!'},
  {type:'decorate',icon:'🍓',ko:'꾸미기',hint:'과일을 올리고 초를 꽂아요',say:['과일을 올리고 초를 꽂아요!','Add fruit and candles!']},
  {type:'blow',icon:'🕯️',ko:'촛불 끄기',hint:'촛불을 콕 눌러 후~'},
  {type:'cut',icon:'🔪',ko:'자르기',tool:'🔪',hint:'칼로 잘라요'}
],{emoji:'🎂',temp:'170도',tempEn:'170 degrees',introKo:'케이크 가게! 진짜 케이크처럼 달걀부터 시작해요!',introEn:'Cake shop! Let\'s start with eggs like real bakers!',endKo:'다 같이 나눠 먹어요! 냠냠!',endEn:'We share it together! Yummy!'});

/* =================================================================
   RHYTHM ECHO (따라 치기)
   ================================================================= */
(()=>{
  const id='rhythm',L=life(id);
  const sec=screen(id,'리듬 박수','<div class="seg" id="rhInst"><button data-i="drum" class="on">🥁 북</button><button data-i="clap">👏 박수</button><button data-i="bell">🔔 종</button></div>',
    '<div class="kstage rstage" id="rhStage"><div class="rcards" id="rhCards"></div><button class="drum" id="rhDrum" aria-label="치기">🥁</button></div><div class="ktray" id="rhTray"></div>');
  const cards=sec.querySelector('#rhCards'),drum=sec.querySelector('#rhDrum'),tray=sec.querySelector('#rhTray'),stage=sec.querySelector('#rhStage');
  const PAT=[['ta','ta','ta','z'],['ta','ta','ti','ta'],['ti','ti','ta','z'],['ta','z','ta','ta'],['ti','ta','ti','ta'],['ta','ti','ti','ta']];
  let inst='drum',pi=0,mode='listen',hits=[],hk=0,timers=[];
  const SOUND={drum:()=>{sweepTone(150,55,.3,'sine',.55);noise(.05,{freq:200,vol:.2})},clap:()=>noise(.09,{freq:1800,q:.6,vol:.45}),bell:()=>{tone(1318,.5,'sine',.2);tone(2637,.3,'sine',.05)}};
  const EMO={drum:'🥁',clap:'👏',bell:'🔔'};
  function render(){
    const p=PAT[pi];cards.innerHTML=p.map((t,k)=>`<div class="rcard ${t==='z'?'rest':''}" data-k="${k}">${t==='ta'?`<span class="rv">${EMO[inst]}</span><b>따</b>`:t==='ti'?`<span class="rv sm">${EMO[inst]}${EMO[inst]}</span><b>띠띠</b>`:'<span class="rv">🤫</span><b>쉼</b>'}</div>`).join('');
    drum.textContent=EMO[inst];
  }
  function lit(k){const c=cards.children[k];if(!c)return;c.classList.add('hit');setTimeout(()=>c.classList.remove('hit'),220)}
  function listen(){
    L.begin();mode='listen';render();tray.innerHTML='';hint(stage,'잘 들어 봐요!');say('잘 들어 봐!','Listen!');
    const beat=.62;let t=1.1;
    PAT[pi].forEach((tk,k)=>{
      if(tk==='ta')L.later(()=>{SOUND[inst]();lit(k)},t*1000);
      if(tk==='ti'){L.later(()=>{SOUND[inst]();lit(k)},t*1000);L.later(()=>{SOUND[inst]();lit(k)},(t+beat/2)*1000)}
      if(tk==='z')L.later(()=>lit(k),t*1000);
      t+=beat;
    });
    L.later(yourTurn,(t+.4)*1000);
  }
  function yourTurn(){
    mode='play';hits=[];PAT[pi].forEach((tk,k)=>{if(tk==='ta')hits.push(k);if(tk==='ti')hits.push(k,k)});hk=0;
    hint(stage,'이제 네 차례! 똑같이 쳐 봐요');say('이제 네 차례! 똑같이 쳐 봐!','Your turn! Copy the rhythm!');
    tray.innerHTML='';bigBtn(tray,'다시 듣기 👂',listen,true);
  }
  drum.addEventListener('pointerdown',e=>{
    e.preventDefault();actx();drum.classList.add('hit');setTimeout(()=>drum.classList.remove('hit'),90);SOUND[inst]();
    if(mode!=='play')return;const k=hits[hk++];lit(k);
    if(hk>=hits.length){mode='done';PAT[pi].forEach((tk,j)=>{if(tk==='z')lit(j)});L.later(()=>{cheer('리듬을 똑같이 쳤어요!','You copied the rhythm!');L.later(()=>{pi=(pi+1)%PAT.length;listen()},2600)},400)}
  });
  sec.querySelector('#rhInst').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;inst=b.dataset.i;sec.querySelectorAll('#rhInst button').forEach(x=>x.classList.toggle('on',x===b));render();SOUND[inst]()});
  games[id]={enter:()=>{pi=0;say('선생님이 먼저 치면 똑같이 따라 쳐요!','I play first, then you copy!');L.later(listen,1500)},exit:()=>L.begin()};
  void timers;
})();

/* =================================================================
   PRAISE STAMPS (칭찬 도장판) + DAILY MISSIONS + REAL-DRESS CLOSET
   ================================================================= */
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const STP=Object.assign({total:0,log:[],day:'',missions:[],done:[]},store.get('mallang_stamps',{}));
const saveSTP=()=>store.set('mallang_stamps',STP);
const CLOSET=store.get('mallang_closet',[]);
function saveCloset(){if(!store.set('mallang_closet',CLOSET)){toast('저장 공간이 부족해요. 사진 드레스를 하나 지우고 다시 해 주세요.');return false}return true}
M.stamps=()=>STP.total;M.closet=()=>CLOSET;
const POOL=[['jelly','🍬','젤리 세기'],['trace','✏️','선 긋기'],['shapes','🔺','모양 맞추기'],['animals','🐶','동물 찾기 (찾기 모드)'],['rhythm','🥁','리듬 박수'],['music','🎹','작은 별 연주'],
  ['jobmatch','🧩','직업 짝 맞추기'],['chores','🧹','집안일'],['dishes','🍽️','설거지'],['pizza','🍕','피자 만들기'],['bread','🥐','빵 굽기'],['routine','⏰','하루 일과']];
function ensureMissions(){
  const t=today();if(STP.day===t&&STP.missions.length)return;
  let h=0;for(const ch of t)h=(h*31+ch.charCodeAt(0))>>>0;const ids=POOL.map(x=>x[0]);const out=[];
  while(out.length<3){h=(h*1103515245+12345)>>>0;const c=ids[h%ids.length];if(!out.includes(c))out.push(c)}
  STP.day=t;STP.missions=out;STP.done=[];saveSTP();
}
const STAMP_SVG=`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="rgba(255,255,255,.0)" stroke="#E0393E" stroke-width="6"/><circle cx="50" cy="50" r="36" fill="none" stroke="#E0393E" stroke-width="2"/>
  <text x="50" y="42" font-size="20" text-anchor="middle" fill="#E0393E" font-family="Jua,sans-serif">참</text><text x="50" y="66" font-size="17" text-anchor="middle" fill="#E0393E" font-family="Jua,sans-serif">잘했어요</text></svg>`;
function award(reason,en){
  STP.total++;STP.log.unshift({d:today(),r:reason});STP.log=STP.log.slice(0,80);saveSTP();
  const f=document.createElement('div');f.className='stampfx';f.innerHTML=`<div class="st">${STAMP_SVG}</div><p>${reason.replace(/[<>&]/g,'')}</p>`;document.body.appendChild(f);setTimeout(()=>f.remove(),2300);
  setTimeout(()=>{sweepTone(120,60,.25,'sine',.6);noise(.15,{type:'lowpass',freq:500,vol:.4})},250);
  say(`참 잘했어요! 칭찬 도장 쾅! ${reason}`,'Great job! Here is a stamp!');
  const opened=CLOSET.filter(c=>c.need===STP.total);
  if(opened.length)setTimeout(()=>{confetti(24);say('우와! 새 드레스가 열렸어요! 옷 입히기에서 입어 봐요!','A new dress is unlocked!',true)},2400);
  if(cur()==='stamps')setTimeout(renderStamps,500);
  renderTile();
}
document.addEventListener('ml-cheer',e=>{
  ensureMissions();const sid=e.detail;
  if(STP.missions.includes(sid)&&!STP.done.includes(sid)){STP.done.push(sid);saveSTP();const m=POOL.find(x=>x[0]===sid);setTimeout(()=>award(`오늘의 미션 성공: ${m[2]}`),2600)}
});
document.addEventListener('ml-stageclear',()=>setTimeout(()=>award('공주 모험 성공!'),3200));

const sec=screen('stamps','칭찬 도장판','','<div class="stp" id="stpBody"></div>','칭찬 도장판');
function nextGoal(){return CLOSET.filter(c=>c.need>STP.total).sort((a,b)=>a.need-b.need)[0]}
function renderStamps(){
  ensureMissions();const g=nextGoal(),page=Math.floor(STP.total/20),onPage=STP.total%20===0&&STP.total>0?20:STP.total%20;
  const showN=STP.total===0?0:onPage,missions=STP.missions.map(id=>POOL.find(x=>x[0]===id)).filter(Boolean);
  sec.querySelector('#stpBody').innerHTML=`
    <div class="stpcard"><div class="stphead"><span class="big">⭐ ${STP.total}</span><div class="goal">${g?`<span>다음 드레스까지 도장 <b>${g.need-STP.total}</b>개!</span><div class="bar2"><i style="width:${Math.round(STP.total/g.need*100)}%"></i></div>`:
      CLOSET.length?'<span>모든 드레스를 열었어요! 👑</span>':'<span>어른이 진짜 드레스 사진을 넣으면, 도장을 모아서 입을 수 있어요.</span>'}</div>${g?`<img class="goalimg" src="${g.img}" alt="">`:''}</div></div>
    <div class="stpcard"><h4 style="margin:0;font-weight:400;font-size:20px">오늘의 미션 · 성공하면 도장 1개</h4>
      ${missions.map(m=>`<button class="mrow ${STP.done.includes(m[0])?'done':''}" data-go="${m[0]}"><span class="mi">${m[1]}</span><span class="mt">${m[2]}</span><span class="mc">${STP.done.includes(m[0])?'✅':'▶'}</span></button>`).join('')}</div>
    <div class="stpcard"><h4 style="margin:0;font-weight:400;font-size:20px">도장판 ${page+1}장째</h4><div class="sgrid2">${Array.from({length:20},(_,k)=>`<span class="slot">${k<showN?STAMP_SVG:''}</span>`).join('')}</div></div>
    <button class="pillhold holdbtn" id="stpGive" style="align-self:center">👩 엄마 아빠 칭찬 도장 (어른 꾹 2초)</button>
    <button class="pillhold holdbtn" id="stpCloset" style="align-self:center">👗 우리 집 드레스 옷장 관리 (어른 꾹 2초)</button>
    <p class="hint">도장은 실제로 칭찬할 일이 있을 때 어른이 찍어 주세요. 진짜 드레스 사진은 옷장 관리에서 넣고, 도장 몇 개에 열릴지 정할 수 있어요. 사진은 이 기기에만 저장돼요.</p>`;
  hold(sec.querySelector('#stpGive'),2000,openReasons);
  hold(sec.querySelector('#stpCloset'),2000,openCloset);
}
games.stamps={enter:()=>{renderStamps();say(`칭찬 도장 ${STP.total}개! 오늘의 미션도 해 볼까?`,`You have ${STP.total} stamps!`)}};

/* home tile */
function renderTile(){
  const t=document.getElementById('stampTile');if(!t)return;ensureMissions();const g=nextGoal();
  t.innerHTML=`<b>⭐ 칭찬 도장 ${STP.total}개</b><span class="fr-row" style="font-size:15px;color:var(--muted);gap:6px;align-items:center">오늘 미션 ${STP.done.length}/3${g?` · 드레스까지 ${g.need-STP.total}개 <img src="${g.img}" alt="" style="width:34px;height:34px;object-fit:contain">`:''}</span>`;
}
const he=games.home.enter;games.home.enter=()=>{he();renderTile()};renderTile();

/* ---------- modals: reasons, closet, cutout ---------- */
function modal(id,html){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.className='modal';m.id=id;document.body.appendChild(m)}m.innerHTML=`<div class="sheet center">${html}</div>`;m.hidden=false;return m}
function openReasons(){
  const R=[['🪥','양치를 잘했어요'],['🍚','밥을 잘 먹었어요'],['🧸','장난감을 정리했어요'],['🙇','인사를 잘했어요'],['👕','혼자 옷을 입었어요'],['🤝','친구를 도와줬어요'],['😴','낮잠을 잘 잤어요'],['📚','책을 읽었어요'],['🚽','화장실을 잘 갔어요'],['💛','엄마 아빠를 도와줬어요']];
  const m=modal('reasonModal',`<h3>무엇을 칭찬할까요?</h3><div class="reasons">${R.map((r,k)=>`<button data-k="${k}">${r[0]} ${r[1]}</button>`).join('')}</div>
    <label class="field">직접 쓰기<input id="reasonText" type="text" maxlength="20" placeholder="예: 동생이랑 사이좋게 놀았어요"></label>
    <div class="row" style="justify-content:center"><button class="btn ghost" id="rsCancel">닫기</button><button class="btn" id="rsGo">도장 찍기</button></div>`);
  m.querySelectorAll('.reasons button').forEach(b=>b.onclick=()=>{m.hidden=true;award(R[+b.dataset.k][1])});
  m.querySelector('#rsCancel').onclick=()=>{m.hidden=true};
  m.querySelector('#rsGo').onclick=()=>{const v=m.querySelector('#reasonText').value.trim();m.hidden=true;award(v||'참 잘했어요')};
}
function openCloset(){
  const m=modal('closetModal',`<h3>우리 집 드레스 옷장</h3>
    <p class="hint">집에 있는 드레스를 단색 바닥이나 벽 앞에 펼쳐 놓고 찍으면 배경이 잘 지워져요. 도장 몇 개를 모으면 열릴지 정해 주세요.</p>
    <div class="clist">${CLOSET.length?CLOSET.map((c,k)=>`<div class="citem"><img src="${c.img}" alt=""><input data-k="${k}" maxlength="10" value="${(c.name||'').replace(/"/g,'&quot;')}" placeholder="이름 (예: 분홍 드레스)">
      <div class="seg" data-k="${k}">${[1,3,5,10].map(n=>`<button data-n="${n}" class="${c.need===n?'on':''}">${n}</button>`).join('')}</div><button class="round holdbtn" data-del="${k}" aria-label="지우기, 1초 길게 누르기" style="width:40px;height:40px;font-size:18px">🗑️</button></div>`).join(''):'<p class="hint">아직 드레스가 없어요.</p>'}</div>
    <button class="btn alt" id="clAdd">📷 드레스 사진 넣기</button><button class="btn ghost" id="clClose">닫기</button>`);
  m.querySelectorAll('.citem input').forEach(inp=>inp.addEventListener('change',()=>{CLOSET[+inp.dataset.k].name=inp.value.trim();saveCloset()}));
  m.querySelectorAll('.citem .seg').forEach(sg=>sg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;CLOSET[+sg.dataset.k].need=+b.dataset.n;saveCloset();openCloset()}));
  m.querySelectorAll('[data-del]').forEach(b=>hold(b,1000,()=>{CLOSET.splice(+b.dataset.del,1);saveCloset();openCloset();renderTile()}));
  m.querySelector('#clAdd').onclick=()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.hidden=true;inp.id='closetFile';document.getElementById('closetFile')?.remove();document.body.appendChild(inp);
    inp.onchange=()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f)return;const im=new Image();im.onload=()=>{m.hidden=true;openCutout(im)};im.onerror=()=>toast('이 사진은 열 수 없어요.');im.src=URL.createObjectURL(f)};inp.click()};
  m.querySelector('#clClose').onclick=()=>{m.hidden=true;if(cur()==='stamps')renderStamps();renderTile()};
}
function openCutout(img){
  const m=modal('cutoutModal',`<h3>드레스 오리기</h3>
    <p class="hint">① ✨ 자동 배경 지우기를 누르고 ② 남은 배경은 🪄 콕 누르거나 🧽 지우개로 지워요. 잘못 지운 곳은 🖌️ 되살리기로 칠해요.</p>
    <div class="cobox"><canvas id="coCanvas"></canvas></div>
    <div class="corow"><div class="seg" id="coTool"><button data-t="wand" class="on">🪄 콕 지우기</button><button data-t="erase">🧽 지우개</button><button data-t="restore">🖌️ 되살리기</button></div></div>
    <div class="corow" style="font-size:15px;align-items:center">지우는 강도 <input type="range" id="coTol" min="10" max="90" value="38" style="accent-color:var(--berry)"></div>
    <div class="corow"><button class="btn small alt" id="coAuto">✨ 자동 배경 지우기</button><button class="btn small ghost" id="coUndo">↩️ 되돌리기</button></div>
    <div class="corow"><button class="btn ghost" id="coCancel">취소</button><button class="btn" id="coSave">옷장에 넣기</button></div>`);
  const cv=m.querySelector('#coCanvas'),g=cv.getContext('2d',{willReadFrequently:true});
  const MAX=520,sc=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));cv.width=Math.round(img.naturalWidth*sc);cv.height=Math.round(img.naturalHeight*sc);
  g.drawImage(img,0,0,cv.width,cv.height);
  const orig=document.createElement('canvas');orig.width=cv.width;orig.height=cv.height;orig.getContext('2d').drawImage(cv,0,0);
  let toolT='wand',undo=[],last=null;
  const snap=()=>{undo.push(g.getImageData(0,0,cv.width,cv.height));if(undo.length>12)undo.shift()};
  function flood(sx,sy,tol){
    const W=cv.width,Hh=cv.height,d=g.getImageData(0,0,W,Hh),px=d.data,i0=(sy*W+sx)*4;if(px[i0+3]===0)return;
    const r0=px[i0],g0=px[i0+1],b0=px[i0+2],seen=new Uint8Array(W*Hh),stack=[sy*W+sx],t2=tol*tol*3;
    while(stack.length){const p=stack.pop();if(seen[p])continue;seen[p]=1;const q=p*4;if(px[q+3]===0)continue;
      const dr=px[q]-r0,dg=px[q+1]-g0,db=px[q+2]-b0;if(dr*dr+dg*dg+db*db>t2)continue;px[q+3]=0;
      const x=p%W,y=(p/W)|0;if(x>0)stack.push(p-1);if(x<W-1)stack.push(p+1);if(y>0)stack.push(p-W);if(y<Hh-1)stack.push(p+W)}
    g.putImageData(d,0,0);
  }
  const pos=e=>{const r=cv.getBoundingClientRect();return[Math.max(0,Math.min(cv.width-1,Math.round((e.clientX-r.left)*cv.width/r.width))),Math.max(0,Math.min(cv.height-1,Math.round((e.clientY-r.top)*cv.height/r.height)))]};
  function brush(a,b){const rr=Math.max(8,cv.width/28);g.save();g.lineWidth=rr*2;g.lineCap='round';
    if(toolT==='erase'){g.globalCompositeOperation='destination-out';g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}
    else{g.globalCompositeOperation='source-over';g.beginPath();const steps=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])/(rr/2));
      for(let k=0;k<=steps;k++){const x=a[0]+(b[0]-a[0])*k/steps,y=a[1]+(b[1]-a[1])*k/steps;g.moveTo(x+rr,y);g.arc(x,y,rr,0,Math.PI*2)}g.clip();g.drawImage(orig,0,0)}
    g.restore()}
  cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}snap();const p=pos(e);
    if(toolT==='wand'){flood(p[0],p[1],+m.querySelector('#coTol').value);return}last=p;brush(p,[p[0]+.5,p[1]])});
  cv.addEventListener('pointermove',e=>{if(!last)return;const p=pos(e);brush(last,p);last=p});
  const end=()=>{last=null};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  m.querySelector('#coTool').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;toolT=b.dataset.t;m.querySelectorAll('#coTool button').forEach(x=>x.classList.toggle('on',x===b))});
  m.querySelector('#coAuto').onclick=()=>{snap();const tol=+m.querySelector('#coTol').value,W=cv.width-1,Hh=cv.height-1;
    [[0,0],[W,0],[0,Hh],[W,Hh],[W>>1,0],[W>>1,Hh],[0,Hh>>1],[W,Hh>>1]].forEach(([x,y])=>flood(x,y,tol))};
  m.querySelector('#coUndo').onclick=()=>{const d=undo.pop();if(d)g.putImageData(d,0,0)};
  m.querySelector('#coCancel').onclick=()=>{m.hidden=true;openCloset()};
  m.querySelector('#coSave').onclick=()=>{
    const W=cv.width,Hh=cv.height,px=g.getImageData(0,0,W,Hh).data;let x0=W,y0=Hh,x1=-1,y1=-1;
    for(let y=0;y<Hh;y++)for(let x=0;x<W;x++)if(px[(y*W+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1<0){toast('다 지워졌어요. 되돌리기를 눌러 주세요.');return}
    const w=x1-x0+1,h=y1-y0+1,s2=Math.min(1,360/Math.max(w,h)),out=document.createElement('canvas');out.width=Math.round(w*s2);out.height=Math.round(h*s2);
    out.getContext('2d').drawImage(cv,x0,y0,w,h,0,0,out.width,out.height);
    const need=CLOSET.length?Math.max(...CLOSET.map(c=>c.need))+2:3;
    CLOSET.push({id:'d'+Date.now(),img:out.toDataURL('image/png'),need:Math.min(need,10),name:''});
    if(!saveCloset()){CLOSET.pop();return}
    m.hidden=true;openCloset();renderTile();toast('옷장에 넣었어요! 도장 개수를 정해 주세요.');
  };
}
})();
