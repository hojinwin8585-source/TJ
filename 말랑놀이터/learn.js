/* 배움 학교 놀이 셋 (P8-다) — 젤리 세기 · 모양 넣기 · 선 긋기. 셋 모두 공통 틀(ML.Shell)과 단계 엔진(ML.Progress)을 씁니다.
   젤리 세기: 젤리를 하나씩 콕 하면 통통 병 속으로 뛰어들고, 세는 소리가 한국어 다음 영어로 나와요(4단계는 수 그림 고르기).
   모양 넣기: 모양을 끌어다 맞는 구멍에 넣거나, 모양을 콕 하고 구멍을 콕 해요. 틀리면 부드럽게 응원하고 맞는 구멍이 반짝여요.
   선 긋기: 손가락으로 길을 따라가면 토토가 걸어가요(touch.trace: 굵은 길, 근처만 가도 인정, 콕만 해도 조금 전진, 멈추면 손 그림, 90%에서 부드럽게 완성).
           도착하면 덤불이 열리고 그림이 나타나요. 실패와 시간 제한은 없어요.
   숫자는 MLCFG.games.counting/shapes/trace(levels), touch(minTargetPx, trace), progress, calm, art.volume 에서 읽어요. 화면에 글자와 이모지는 없어요. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!M||!P||!A||!M.Guide||!M.Shell||!M.Progress)return;
const {say,sfx,tone,games,actx,rand}=M;
const {life}=P;
const CF=M.CFG,PAL=CF.calm.palette,TC=CF.touch||{},TR=TC.trace||{},CEL=CF.calm.celebration||{pieces:6,durationMs:1200};
const OL=A.OL,V=A.vol,STK=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const FOOT=TC.minTargetPx||110;
const NEAR=TR.countsWithinRatio||.4,CREEP=TR.creepWhileTouchingPerSec||.05,MAXSP=TR.maxSpeedPerSec||.35,TAPADV=TR.tapAlsoAdvances||.12,
  WIDTH_R=TR.pathWidthRatio||.18,AUTO=TR.autoFinishAt||.9,HAND_MS=TR.showHandAfterIdleMs||2000;
const PRG=M.Progress,MAXLV=4;
const cur=()=>M.current();
const praise=()=>{try{return M.nextPraise()}catch(e){return['잘했어!','Good job!']}};
const inner=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const JC=[PAL.rose,PAL.butter,PAL.sage,PAL.sky,PAL.lilac,PAL.peach];

/* ---------- styles ---------- */
const css=`
.ln-screen .sh-head .ln-stars{display:flex;flex:none;margin-left:auto}
.ln-stage{background:var(--bg);touch-action:none;user-select:none;-webkit-user-select:none}
.ln-stage>svg.ln-bg{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.ln-tray{display:flex;align-items:center;justify-content:center;gap:12px}
.ln-fx{position:absolute;z-index:30;pointer-events:none;width:30px;height:30px;margin:-15px 0 0 -15px}
.ln-fx svg{display:block;width:100%;height:100%}
.ln-numcard{flex:none;height:min(100%,150px);aspect-ratio:1;border-radius:50%;background:var(--paper);display:grid;place-items:center;padding:14px;box-shadow:0 5px 0 rgba(91,74,66,.14)}
.ln-numcard svg{width:100%;height:100%;display:block;overflow:visible}
.ln-numcard.pop svg{animation:lnpop .5s cubic-bezier(.3,1.5,.5,1)}
@keyframes lnpop{0%{transform:scale(.6)}100%{transform:scale(1)}}
/* jelly */
.jl-friend svg{width:100%;height:100%;display:block;overflow:visible}
.jl-j{position:absolute;z-index:3;touch-action:none;-webkit-tap-highlight-color:transparent}
.jl-j svg{width:100%;height:100%;display:block;overflow:visible;animation:jlwob 2.8s ease-in-out infinite;animation-delay:var(--d,0s);transform-origin:50% 90%}
.jl-j.counted{pointer-events:none}
.jl-j.counted svg{animation:none}
.jl-j.land svg{animation:jlland .5s ease-out}
.jl-j.cheer svg{animation:jlcheer .9s ease-in-out var(--d,0s) 2}
@keyframes jlwob{0%,100%{transform:scale(1,1)}50%{transform:scale(1.05,.95)}}
@keyframes jlland{0%{transform:scale(1.25,.7)}60%{transform:scale(.9,1.1)}100%{transform:scale(1,1)}}
@keyframes jlcheer{0%,100%{transform:translateY(0)}40%{transform:translateY(-14%) scale(.95,1.06)}}
.jl-jar{position:absolute;z-index:1;pointer-events:none}
.jl-jar svg{width:100%;height:100%;display:block;overflow:visible}
.jl-jar.front{z-index:4}
.jl-jar.jig svg{animation:jljig .6s ease-in-out}
@keyframes jljig{0%,100%{transform:rotate(0)}30%{transform:rotate(-3deg)}65%{transform:rotate(2.5deg)}}
.ln-card{flex:0 1 150px;min-width:${FOOT}px;aspect-ratio:1;border:0;border-radius:24px;background:var(--paper);padding:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(91,74,66,.14);transition:transform .15s}
.ln-card svg{width:100%;height:100%;display:block;overflow:visible}
.ln-card:active{transform:translateY(4px) scale(.97)}
.ln-card.shake{animation:lnshake .5s}
.ln-card.tried{opacity:.55}
@keyframes lnshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}45%{transform:translateX(6px)}70%{transform:translateX(-4px)}}
/* shapes */
.sp-hole{position:absolute;z-index:2;touch-action:none}
.sp-hole svg{width:100%;height:100%;display:block;overflow:visible}
.sp-hole.hint svg{animation:sphint 1.3s ease-in-out infinite}
.sp-hole.in svg{animation:spin .6s cubic-bezier(.3,1.5,.5,1)}
.sp-hole.hop svg{animation:jlcheer .9s ease-in-out var(--d,0s) 2}
@keyframes sphint{0%,100%{filter:drop-shadow(0 0 0 rgba(240,213,138,0))}50%{filter:drop-shadow(0 0 10px #F0D58A) drop-shadow(0 0 4px #F0D58A)}}
@keyframes spin{0%{transform:scale(.8)}55%{transform:scale(1.1)}100%{transform:scale(1)}}
.ln-piece{flex:1 1 0;min-width:${FOOT}px;max-width:150px;aspect-ratio:1;padding:6px;border:0;border-radius:24px;background:var(--paper);box-shadow:0 5px 0 rgba(91,74,66,.14);touch-action:none;position:relative;transition:transform .15s,box-shadow .15s}
.ln-piece svg{width:100%;height:100%;display:block;overflow:visible;pointer-events:none}
.ln-piece.sel{transform:translateY(-8px);box-shadow:0 10px 0 rgba(91,74,66,.12),0 0 0 5px color-mix(in srgb,${PAL.butter} 80%,#fff)}
.ln-piece.drag{opacity:.25}
.ln-piece.shake{animation:lnshake .5s}
.ln-piece.enter{animation:lnpop .45s cubic-bezier(.3,1.5,.5,1)}
.sp-ghost{position:absolute;z-index:60;pointer-events:none;filter:drop-shadow(0 8px 4px rgba(91,74,66,.22))}
.sp-ghost svg{width:100%;height:100%;display:block;overflow:visible}
/* trace */
.tr-ch{position:absolute;left:0;top:0;z-index:5;pointer-events:none;will-change:transform}
.tr-ch .tr-ani{width:100%;height:100%}
.tr-ch .tr-ani svg{width:100%;height:100%;display:block;overflow:visible}
.tr-bush{position:absolute;z-index:4;pointer-events:none;transition:transform .7s cubic-bezier(.3,1.3,.5,1),opacity .6s}
.tr-bush svg{width:100%;height:100%;display:block;overflow:visible}
.tr-bush.open{transform:translate(0,40%) scale(.5);opacity:0}
.tr-bush.sway svg{animation:trsway 2.6s ease-in-out infinite;transform-origin:50% 90%}
@keyframes trsway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}
.tr-pic{position:absolute;left:50%;top:50%;z-index:12;width:min(78%,300px);aspect-ratio:1;margin:0;transform:translate(-50%,-50%) scale(.3);opacity:0;pointer-events:none;border-radius:50%;
  background:var(--paper);display:grid;place-items:center;padding:11%;box-shadow:0 8px 22px rgba(91,74,66,.2);transition:transform .7s cubic-bezier(.3,1.4,.5,1),opacity .4s}
.tr-pic.on{transform:translate(-50%,-50%) scale(1);opacity:1}
.tr-pic svg{width:100%;height:100%;display:block;overflow:visible}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ---------- shared little pieces ---------- */
const WALL=`<defs><linearGradient id="lnwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF1DE"/><stop offset="1" stop-color="#F6E7CF"/></linearGradient></defs>`;
const star=(c,x,y,r)=>`<path d="M${x} ${y-r}L${x+r*.3} ${y-r*.3}L${x+r} ${y-r*.2}L${x+r*.45} ${y+r*.25}L${x+r*.6} ${y+r}L${x} ${y+r*.55}L${x-r*.6} ${y+r}L${x-r*.45} ${y+r*.25}L${x-r} ${y-r*.2}L${x-r*.3} ${y-r*.3}Z" fill="${c}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;
const HEART=c=>`<svg viewBox="0 0 24 24"><path d="M12 21C-4 10 4 1 12 7C20 1 28 10 12 21Z" fill="${c}" stroke="${OL}" stroke-width="1.4"/></svg>`;
const TW=c=>`<svg viewBox="0 0 24 24">${star(c,12,12,10)}</svg>`;
/* a drawn numeral (stroke paths, no text) */
const DIG={1:'M20 26L34 12V68',2:'M16 28Q18 10 32 10Q48 10 48 26Q48 38 16 66H50',3:'M16 14H46L30 36Q50 34 50 52Q50 70 30 70Q18 70 14 60',
  4:'M38 68V10L12 50H52',5:'M46 12H20L16 38Q24 32 32 32Q50 34 50 52Q50 70 32 70Q20 70 14 60'};
const numSVG=n=>`<svg viewBox="0 0 64 80"><path d="${DIG[n]}" fill="none" stroke="${OL}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="${DIG[n]}" fill="none" stroke="${PAL.butter}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="${DIG[n]}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".55" transform="translate(-1.6 -1.6)"/></svg>`;
const emptyNum=`<svg viewBox="0 0 64 80"><circle cx="32" cy="40" r="22" fill="none" stroke="#D9C7AA" stroke-width="5" stroke-dasharray="3 11" stroke-linecap="round"/></svg>`;

/* a screen on the common shell: back arrow, picture strip, 3 stars; stage; tray */
function mk(id,title,place){
  const sc=M.Shell.screen(id,{title,cls:'ln-screen',stageClass:'ln-stage',trayClass:'ln-tray',after:'<div class="ln-stars"></div>'});
  const q=s=>sc.sec.querySelector(s);
  return{sc,sec:sc.sec,stage:sc.stage,tray:sc.tray,strip:sc.strip,starsEl:q('.ln-stars'),
    stars(n){this.starsEl.innerHTML=PRG.stars(id,n)}};
}
const lvOf=id=>Math.max(1,Math.min(MAXLV,(PRG.get(id).level|0)||1));
function fx(stage,L,html,x,y,dx,dy,ms){const f=document.createElement('div');f.className='ln-fx';f.style.left=x+'px';f.style.top=y+'px';f.innerHTML=html;stage.appendChild(f);L.onEnd(()=>f.remove());
  try{const a=f.animate([{transform:'translate(0,0) scale(.4)',opacity:0},{opacity:1,offset:.2},{transform:`translate(${dx}px,${dy}px) scale(1)`,opacity:0}],{duration:ms,easing:'ease-out',fill:'forwards'});a.onfinish=()=>f.remove()}catch(e){setTimeout(()=>f.remove(),ms)}}
function burst(stage,L,x,y){const n=CEL.pieces||6;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.55;L.later(()=>fx(stage,L,i%2?HEART(PAL.rose):TW(PAL.butter),x+(i-(n-1)/2)*18,y,Math.cos(a)*34,-60-(i%3)*18,CEL.durationMs||1200),i*70)}}
const secXY=(sec,stage,x,y)=>{const sr=sec.getBoundingClientRect(),r=stage.getBoundingClientRect();return[x+r.left-sr.left,y+r.top-sr.top]};
/* a round ended: one star (ML.Progress), a full row opens the next level with its new thing; then next() */
function endRound(S,L,id,wrong,thing,next){
  if(wrong>=6){try{PRG.struggle(id,{wrong,idleMs:0})}catch(e){}}
  const R=PRG.clear(id);
  const stop=PRG.after(id,R,{starsEl:S.starsEl,host:S.stage,thing,then:()=>L.later(next,R.up?300:2600)});
  L.onEnd(stop);return R;
}
const JNAME=[['하나','one'],['둘','two'],['셋','three'],['넷','four'],['다섯','five']];
const JUNIT=['한','두','세','네','다섯'];

/* =====================================================================================================================
   1. 젤리 세기
   ===================================================================================================================== */
(()=>{
const id='jelly',L=life(id);
PRG.register(id,{max:MAXLV,name:'젤리 세기'});
const S=mk(id,'젤리 세기'),{stage,tray,strip,sec}=S;
const G=M.Guide.make(sec,{say});
let st=null,lastN=0,first=true,forceN=0,fAl=null;
const LOG=[];
const MAXN=[2,3,5,5];

function jellySVG(c){
  const body=`<path d="M14 92Q8 60 18 40Q26 14 50 14Q74 14 82 40Q92 60 86 92Q50 104 14 92Z" fill="${V.ball(c)}" ${STK}/>`;
  return `<svg viewBox="0 0 100 108" style="overflow:visible">${V.ground(50,100,34,6)}${body}${V.lit(body)}${V.rim(50,58,36,42)}${V.shine(36,34,13,8,-25)}
    <ellipse cx="30" cy="68" rx="8" ry="5.5" fill="${V.cheek(PAL.rose)}"/><ellipse cx="70" cy="68" rx="8" ry="5.5" fill="${V.cheek(PAL.rose)}"/>
    <circle cx="38" cy="56" r="4.6" fill="${OL}"/><circle cx="62" cy="56" r="4.6" fill="${OL}"/><circle cx="39.6" cy="54.4" r="1.6" fill="#fff"/><circle cx="63.6" cy="54.4" r="1.6" fill="#fff"/>
    <path d="M43 66Q50 73 57 66" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/></svg>`;
}
const jarBack=()=>`<svg viewBox="0 0 200 220" style="overflow:visible">${V.ground(100,212,64,7)}
  <path d="M44 36Q40 40 40 54L36 96Q30 130 34 176Q36 206 60 208H140Q164 206 166 176Q170 130 164 96L160 54Q160 40 156 36Z" fill="#EAF5FC" opacity=".8"/>
  <path d="M40 150Q36 200 70 206H130Q164 200 160 150Z" fill="#D8EBF7" opacity=".7"/>
  <ellipse cx="100" cy="36" rx="60" ry="12" fill="#D8EBF7" stroke="${OL}" stroke-width="3.5"/></svg>`;
const jarFront=()=>`<svg viewBox="0 0 200 220" style="overflow:visible">
  <path d="M44 36Q40 40 40 54L36 96Q30 130 34 176Q36 206 60 208H140Q164 206 166 176Q170 130 164 96L160 54Q160 40 156 36" fill="none" ${STK}/>
  <path d="M42 36Q100 56 158 36" fill="none" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M52 66Q46 120 52 172" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".6"/>
  <path d="M62 184Q64 196 74 200" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55"/>
  <path d="M152 70Q156 110 152 150" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>
  <path d="M40 186Q50 208 70 208H130Q150 208 160 186" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/></svg>`;
const bgSVG=(W,H,py)=>`<svg class="ln-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${WALL}<rect width="${W}" height="${H}" fill="url(#lnwall)"/>
  ${[0,1,2,3,4,5].map(i=>`<circle cx="${20+i*W/5.2}" cy="${14+(i%2)*10}" r="5" fill="#fff" opacity=".5"/>`).join('')}
  <rect x="0" y="${py}" width="${W}" height="${H-py}" fill="#E9D3B0"/><rect x="0" y="${py}" width="${W}" height="10" fill="#D9BE94"/><rect x="0" y="${py+10}" width="${W}" height="6" fill="#5B3A29" opacity=".08"/></svg>`;
const SLOTS=[[66,176],[100,176],[134,176],[83,132],[117,132]],JW=42;

function geo(){
  const W=stage.clientWidth,H=stage.clientHeight,n=st.n,jh=Math.round(H*.42),jw=Math.round(jh*200/220);
  const jar={w:jw,h:jh,x:Math.round((W-jw)/2),y:H-jh-6,k:jw/200};
  const ay=8,ah=jar.y-ay-22,cols=n<=2?n:n===3?2:n===4?2:3,rows=Math.ceil(n/cols),gap=6,aw=W-12;
  const s=Math.max(60,Math.min(190,(aw-gap*(cols-1))/cols,(ah-gap*(rows-1))/rows/1.08));
  const pos=[];let i=0;
  for(let r=0;r<rows;r++){const inRow=Math.min(cols,n-r*cols),rw=inRow*s+(inRow-1)*gap;
    for(let c=0;c<inRow;c++){pos.push({x:(W-rw)/2+c*(s+gap)+s/2,y:ay+(ah-(rows*s*1.08+(rows-1)*gap))+r*(s*1.08+gap)+s*.54-4});i++}}
  return{W,H,jar,s,pos,plateY:jar.y-14};
}
const slotXY=(g,k)=>{const sl=SLOTS[Math.min(k,SLOTS.length-1)];return{x:g.jar.x+sl[0]*g.jar.k,y:g.jar.y+sl[1]*g.jar.k,s:JW*g.jar.k}};

function build(){
  const g=st.g=geo();
  stage.innerHTML=bgSVG(g.W,g.H,g.plateY);
  const plate=document.createElement('div');plate.className='jl-plate';plate.style.cssText=`position:absolute;z-index:2;left:6px;right:6px;top:${g.plateY-20}px;height:34px;pointer-events:none`;
  plate.innerHTML=`<svg viewBox="0 0 300 34" preserveAspectRatio="none" style="width:100%;height:100%;display:block"><ellipse cx="150" cy="22" rx="146" ry="10" fill="#5B3A29" opacity=".12"/><ellipse cx="150" cy="16" rx="140" ry="12" fill="#FFFDF9" stroke="${OL}" stroke-width="3"/><ellipse cx="150" cy="15" rx="112" ry="7" fill="#F1E6D2"/></svg>`;
  stage.appendChild(plate);
  /* a friend sits behind the plate and cheers: it fills the wall once the jellies have hopped away */
  if(fAl){try{fAl.detach()}catch(e){}fAl=null}
  const fr=document.createElement('div'),fh=Math.round(Math.min(g.plateY-14,(g.W-24)*230/200)),fw=Math.round(fh*200/230);
  fr.className='jl-friend';fr.style.cssText=`position:absolute;z-index:1;pointer-events:none;left:${Math.round((g.W-fw)/2)}px;top:${g.plateY-6-fh}px;width:${fw}px;height:${fh}px`;
  fr.innerHTML=`<div style="width:100%;height:100%">${A.animal(st.friend,'idle')}</div>`;fr.firstChild.querySelector&&0;stage.appendChild(fr);st.fr=fr;
  try{fAl=M.Alive.attach(fr.firstChild,{kind:st.friend,follow:false})}catch(e){}
  const jb=document.createElement('div');jb.className='jl-jar back';jb.style.cssText=`left:${g.jar.x}px;top:${g.jar.y}px;width:${g.jar.w}px;height:${g.jar.h}px`;jb.innerHTML=jarBack();stage.appendChild(jb);
  const jf=document.createElement('div');jf.className='jl-jar front';jf.style.cssText=jb.style.cssText;jf.innerHTML=jarFront();stage.appendChild(jf);st.jar=jb;st.jarF=jf;
  st.jel=[];
  for(let i=0;i<st.n;i++){
    const j=document.createElement('div');j.className='jl-j';j.setAttribute('role','button');j.setAttribute('aria-label','젤리');
    j.dataset.i=i;j.style.setProperty('--d',(-Math.random()*2.4).toFixed(2)+'s');j.innerHTML=jellySVG(st.colors[i]);stage.appendChild(j);st.jel.push({el:j,done:false,slot:-1});
  }
  place();
}
function place(){
  const g=st.g;st.jel.forEach((o,i)=>{const j=o.el;j.getAnimations&&j.getAnimations().forEach(a=>a.cancel());
    if(o.done){const sl=slotXY(g,o.slot);j.style.cssText=`left:${sl.x-sl.s/2}px;top:${sl.y-sl.s*1.08/2}px;width:${sl.s}px;height:${sl.s*1.08}px;z-index:3`}
    else{const p=g.pos[i];j.style.cssText=`left:${p.x-g.s/2}px;top:${p.y-g.s*.54}px;width:${g.s}px;height:${g.s*1.08}px;--d:${j.style.getPropertyValue('--d')}`}});
}
function renderTray(){
  tray.innerHTML='';
  if(st.phase==='match'){
    const pool=[1,2,3,4,5].filter(x=>x!==st.n).sort(()=>Math.random()-.5).slice(0,2),opts=pool.concat([st.n]).sort(()=>Math.random()-.5);
    opts.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='ln-card';b.dataset.v=v;b.setAttribute('aria-label','수');b.innerHTML=numSVG(v);
      b.onclick=()=>pickNum(v,b);tray.appendChild(b)});
    return;
  }
  const c=document.createElement('div');c.className='ln-numcard';c.id='jlNum';
  c.innerHTML=st.lv===4?tallySVG():(st.count?numSVG(st.count):emptyNum);tray.appendChild(c);
}
/* level 4 counts first: little jelly dots fill in the tray; the numerals come after */
function tallySVG(){const n=st.n,w=Math.min(50,260/n);return `<svg viewBox="0 0 ${n*54} 60" style="width:100%;height:100%">${Array.from({length:n},(_,i)=>`<circle cx="${27+i*54}" cy="30" r="20" fill="${i<st.count?st.colors[i]:'none'}" stroke="${i<st.count?OL:'#D9C7AA'}" stroke-width="${i<st.count?3.5:5}" ${i<st.count?'':'stroke-dasharray="3 9" stroke-linecap="round"'}/>`).join('')}</svg>`}
function renderStrip(){M.Shell.steps(strip,st.colors.slice(0,st.n).map(c=>`<svg viewBox="0 0 100 108">${`<path d="M14 92Q8 60 18 40Q26 14 50 14Q74 14 82 40Q92 60 86 92Q50 104 14 92Z" fill="${c}" ${STK}/>`}</svg>`),st.count)}
function aim(){
  const o=st.jel.find(x=>!x.done);if(!o||st.phase!=='count'){G.stop();return}
  G.start({type:'tap',after:HAND_MS,ko:'젤리를 콕!',en:'Tap a jelly!',at:()=>{const b=st.jel.find(x=>!x.done);if(!b)return[0,0];const i=st.jel.indexOf(b),p=st.g.pos[i];const r=secXY(sec,stage,p.x,p.y);return[r[0]-8,r[1]-10]}});
}
function newRound(){
  L.begin();G.stop();
  const lv=lvOf(id),maxN=MAXN[lv-1],minN=lv===4?2:1;let n;do{n=minN+rand(maxN-minN+1)}while(n===lastN&&maxN>minN);if(forceN){n=forceN;forceN=0}lastN=n;
  const cs=JC.slice().sort(()=>Math.random()-.5);
  st={lv,n,count:0,phase:'count',wrong:0,friend:['bear','cat','dog','bunny'][rand(4)],colors:Array.from({length:n},(_,i)=>cs[i%cs.length]),jel:[],busy:false,tried:0};
  LOG.push('round:'+n);
  S.stars();build();renderTray();renderStrip();
  if(first){say('젤리를 하나씩 눌러서 세어 봐!','Tap each jelly and count!');first=false}else say('젤리가 몇 개일까?','How many jellies?');
  aim();
}
function tap(i){
  const o=st.jel[i];if(!o||o.done||st.phase!=='count')return;
  actx();G.touch();G.release();
  o.done=true;o.slot=st.count;st.count++;const k=st.count;LOG.push('count:'+k);
  const g=st.g,p=g.pos[i],sl=slotXY(g,o.slot),j=o.el,dx=sl.x-p.x,dy=sl.y-p.y,sc=sl.s/g.s;
  j.classList.add('counted');j.removeAttribute('role');j.removeAttribute('aria-label');j.style.zIndex=8;sfx.pop();tone(300+k*70,.2,'triangle',.22);
  say(JNAME[k-1][0],JNAME[k-1][1]);
  const land=()=>{if(o.landed)return;o.landed=true;j.getAnimations().forEach(x=>x.cancel());j.style.transition='';j.style.zIndex=3;j.style.cssText=`left:${sl.x-sl.s/2}px;top:${sl.y-sl.s*1.08/2}px;width:${sl.s}px;height:${sl.s*1.08}px;z-index:3`;j.classList.add('land');
    try{st.jar.classList.remove('jig');void st.jar.offsetWidth;st.jar.classList.add('jig')}catch(e){}tone(520+k*50,.12,'sine',.1)};
  const mid={x:(p.x+sl.x)/2,y:Math.min(p.y,sl.y)-110};
  try{const a=j.animate([{transform:'translate(0,0) scale(1,1)'},{transform:`translate(${mid.x-p.x}px,${mid.y-p.y}px) scale(1.12,.92)`,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(${sc},${sc})`}],{duration:720,easing:'cubic-bezier(.3,.1,.5,1)',fill:'forwards'});a.onfinish=land;L.later(land,900)}catch(e){land()}
  const nc=tray.querySelector('#jlNum');if(nc){nc.innerHTML=st.lv===4?tallySVG():numSVG(k);nc.classList.remove('pop');void nc.offsetWidth;nc.classList.add('pop')}
  renderStrip();
  if(k===st.n){st.busy=true;G.stop();L.later(()=>{st.lv===4?toMatch():done()},980)}else aim();
}
function toMatch(){st.phase='match';st.busy=false;LOG.push('match');renderTray();say('몇 개일까?','How many?');
  G.start({type:'tap',after:HAND_MS,ko:'맞는 수를 콕!',en:'Tap the right number!',at:()=>{const b=tray.querySelector(`.ln-card[data-v="${st.n}"]`);if(!b)return[0,0];const r=b.getBoundingClientRect(),s=sec.getBoundingClientRect();return[r.left-s.left+r.width/2-8,r.top-s.top+r.height/2-10]}})}
function pickNum(v,b){
  if(st.phase!=='match'||st.busy)return;actx();sfx.pop();
  if(v===st.n){st.busy=true;G.stop();LOG.push('numok');tray.querySelectorAll('.ln-card').forEach(x=>{if(x!==b)x.classList.add('tried')});done()}
  else{st.wrong++;LOG.push('numwrong');b.classList.add('tried','shake');say('한 번 더 세어 보자!','Let us count once more!');
    st.jel.forEach((o,i)=>L.later(()=>{o.el.classList.remove('land');void o.el.offsetWidth;o.el.classList.add('land');tone(300+(i+1)*70,.15,'triangle',.18);say(JNAME[i][0],JNAME[i][1])},i*650))}
}
function done(){
  st.phase='done';st.busy=true;G.stop();LOG.push('win');renderStrip();
  const g=st.g,n=st.n;sfx.ding();if(fAl){try{fAl.setMood('happy');fAl.play('hop',{n:2,wave:true})}catch(e){}}
  st.jel.forEach((o,i)=>{o.el.style.setProperty('--d',(i*.12)+'s');o.el.classList.remove('land');o.el.classList.add('cheer')});
  st.jar.classList.add('jig');burst(stage,L,g.jar.x+g.jar.w/2,g.jar.y+g.jar.h*.25);
  const p=praise();say(`젤리 ${JUNIT[n-1]} 개! ${p[0]}`,`${JNAME[n-1][1][0].toUpperCase()+JNAME[n-1][1].slice(1)} ${n>1?'jellies':'jelly'}! ${p[1]}`);
  if(st.lv<4){const nc=tray.querySelector('#jlNum');if(nc)nc.innerHTML=numSVG(n)}
  endRound(S,L,id,st.wrong,thing,newRound);
}
const jellyRow=(k)=>`<svg viewBox="0 0 ${k*70+10} 108" style="overflow:visible">${Array.from({length:k},(_,i)=>`<g transform="translate(${5+i*70} 0) scale(.68)">${inner(jellySVG(JC[i%JC.length]))}</g>`).join('')}</svg>`;
function thing(lv){
  if(lv===2)return{art:jellyRow(3),ko:'젤리 셋!',en:'Three jellies!'};
  if(lv===3)return{art:jellyRow(5).replace('<svg ','<svg style="overflow:visible" '),ko:'젤리 다섯!',en:'Five jellies!'};
  return{art:numSVG(4),ko:'수를 찾아요!',en:'Find the number!'};
}
/* touch: any jelly (the stage hears the finger, so a jelly's whole picture counts) */
stage.addEventListener('pointerdown',e=>{
  if(!st||st.phase!=='count')return;
  const el=e.target.closest('.jl-j');if(el){tap(+el.dataset.i);return}
  if(cur()===id&&st.phase==='count'){/* a tap beside the jellies: the nearest one hops in (forgiving) */
    const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=-1,bd=1e9;
    st.jel.forEach((o,i)=>{if(o.done)return;const p=st.g.pos[i],d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=i}});
    if(best>=0&&bd<st.g.s*.9)tap(best);else if(best>=0){say('젤리를 콕!','Tap a jelly!');G.nudge()}}
});
games[id]={enter:()=>{first=true;requestAnimationFrame(()=>{if(cur()===id)newRound()})},exit:()=>{L.begin();G.stop();if(fAl){try{fAl.detach()}catch(e){}fAl=null}st=null},
  resize:()=>{if(st&&st.g&&cur()===id&&!st.busy)build0()}};
function build0(){const keep=st.jel.map(o=>({done:o.done,slot:o.slot}));build();keep.forEach((k,i)=>{st.jel[i].done=k.done;st.jel[i].slot=k.slot;if(k.done)st.jel[i].el.classList.add('counted')});place();renderTray()}
window.addEventListener('resize',()=>{if(cur()===id&&st&&st.g&&!st.busy)build0()});

M.__jlN=n=>{forceN=Math.max(1,Math.min(5,n|0))};
M.__jlLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__jl=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),jr=st.jar.getBoundingClientRect();
  return{lv:st.lv,n:st.n,count:st.count,phase:st.phase,busy:st.busy,wrong:st.wrong,log:LOG.slice(-40),
    stage:{left:r.left,top:r.top,width:r.width,height:r.height},jar:{left:jr.left,top:jr.top,width:jr.width,height:jr.height},
    jellies:st.jel.map(o=>{const b=o.el.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,done:o.done}}),
    cards:[...tray.querySelectorAll('.ln-card')].map(b=>{const c=b.getBoundingClientRect();return{v:+b.dataset.v,x:c.left+c.width/2,y:c.top+c.height/2,w:c.width,h:c.height}}),
    starsOn:sec.querySelectorAll('.ln-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ln-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id),
    content:{top:Math.min(...st.jel.map(o=>o.el.getBoundingClientRect().top),jr.top),bottom:jr.bottom}};
};
M.__jlDepth=()=>[1,2,3,4].map(lv=>{const steps=['젤리 콕(병에 뛰어듦)','세는 소리 듣기'].concat(lv===4?['수 그림 고르기']:[]);
  return{level:lv,processes:steps.length+1,steps,hands:['tap'],someone:true,choice:lv===4,ending:'병이 통통 · 젤리 춤 · 별'}});
})();

/* =====================================================================================================================
   2. 모양 넣기
   ===================================================================================================================== */
(()=>{
const id='shapes',L=life(id);
PRG.register(id,{max:MAXLV,name:'모양 넣기'});
const SX=mk(id,'모양 넣기'),{stage,tray,strip,sec}=SX;
const G=M.Guide.make(sec,{say});
const SHP={circle:{c:PAL.rose,ko:'동그라미',en:'circle'},square:{c:PAL.sky,ko:'네모',en:'square'},triangle:{c:PAL.butter,ko:'세모',en:'triangle'},star:{c:PAL.lilac,ko:'별',en:'star'},heart:{c:PAL.sage,ko:'하트',en:'heart'}};
const SETS=[['circle'],['circle','square'],['circle','square','triangle'],['circle','square','triangle','star','heart']];
const STARD=(()=>{const p=[];for(let i=0;i<10;i++){const r=i%2?21:46,a=-Math.PI/2+i*Math.PI/5;p.push((50+r*Math.cos(a)).toFixed(1)+' '+(54+r*Math.sin(a)).toFixed(1))}return 'M'+p.join('L')+'Z'})();
const PATH={circle:'M50 10A40 40 0 1 1 49.9 10Z',square:'M22 12H78Q90 12 90 24V80Q90 92 78 92H22Q10 92 10 80V24Q10 12 22 12Z',triangle:'M50 10Q56 10 59 16L92 78Q96 90 84 90H16Q4 90 8 78L41 16Q44 10 50 10Z',star:STARD,
  heart:'M50 90C20 68 4 52 4 31C4 15 16 5 30 5C40 5 47 11 50 19C53 11 60 5 70 5C84 5 96 15 96 31C96 52 80 68 50 90Z'};
const FACEY={circle:0,square:0,triangle:14,star:4,heart:-4};
function shapeSVG(t,o={}){
  const c=SHP[t].c,d=PATH[t],body=`<path d="${d}" fill="${V.ball(c)}" ${STK}/>`;
  const fy=FACEY[t];
  return `<svg viewBox="0 0 100 100" style="overflow:visible">${o.ground===false?'':V.ground(50,96,32,5)}${body}${V.lit(body)}${V.shine(36,30,12,7,-25)}
    <g transform="translate(0 ${fy})"><ellipse cx="32" cy="58" rx="7" ry="4.6" fill="${V.cheek(PAL.rose)}"/><ellipse cx="68" cy="58" rx="7" ry="4.6" fill="${V.cheek(PAL.rose)}"/>
    <circle cx="40" cy="48" r="4.4" fill="${OL}"/><circle cx="60" cy="48" r="4.4" fill="${OL}"/><circle cx="41.5" cy="46.5" r="1.5" fill="#fff"/><circle cx="61.5" cy="46.5" r="1.5" fill="#fff"/>
    <path d="M43 57Q50 64 57 57" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/></g></svg>`;
}
const holeSVG=t=>`<svg viewBox="0 0 100 100" style="overflow:visible"><path d="${PATH[t]}" fill="none" stroke="#fff" stroke-width="5" opacity=".6" transform="translate(0 3.2)"/><path d="${PATH[t]}" fill="#CFBB9A" stroke="#A98F6C" stroke-width="3.6" stroke-linejoin="round"/><path d="${PATH[t]}" fill="#5B3A29" opacity=".13" transform="translate(2.4 3) scale(.96)" style="transform-origin:50% 50%"/></svg>`;
const bgSVG=(W,H)=>`<svg class="ln-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect width="${W}" height="${H}" fill="#F4E7D3"/><rect x="10" y="10" width="${W-20}" height="${H-20}" rx="26" fill="#EBD8BA"/><rect x="10" y="10" width="${W-20}" height="${H-20}" rx="26" fill="none" stroke="#CDB48D" stroke-width="5"/>
  ${[0,1,2,3,4,5,6].map(i=>`<path d="M${24} ${H*(.1+i*.13)}Q${W/2} ${H*(.1+i*.13)+8} ${W-24} ${H*(.1+i*.13)}" fill="none" stroke="#5B3A29" stroke-width="2" opacity=".06"/>`).join('')}</svg>`;
let st=null;const LOG=[];

function geo(){
  const W=stage.clientWidth,H=stage.clientHeight,n=st.set.length,cols=n<=2?1:2,rows=Math.ceil(n/cols),gap=14,padX=26,padY=22;
  const cap=n===1?Math.min(W-40,H*.66):260;
  const s=Math.max(70,Math.min(cap,(W-padX*2-gap*(cols-1))/cols,(H-padY*2-gap*(rows-1))/rows));
  const pos=[];for(let i=0;i<n;i++){const r=Math.floor(i/cols),inRow=Math.min(cols,n-r*cols),rw=inRow*s+(inRow-1)*gap,c=i%cols;
    pos.push({x:(W-rw)/2+c*(s+gap)+s/2,y:(H-(rows*s+(rows-1)*gap))/2+r*(s+gap)+s/2})}
  return{W,H,s,pos};
}
function build(){
  const g=st.g=geo();stage.innerHTML=bgSVG(g.W,g.H);st.holes={};
  st.set.forEach((t,i)=>{const h=document.createElement('div');h.className='sp-hole';h.dataset.t=t;h.setAttribute('aria-label','구멍');h.innerHTML=holeSVG(t);stage.appendChild(h);st.holes[t]={el:h,done:false,slot:st.slotOf[t]}});
  placeHoles();
}
function placeHoles(){const g=st.g;Object.keys(st.holes).forEach(t=>{const h=st.holes[t],p=g.pos[h.slot];h.el.style.cssText=`left:${p.x-g.s/2}px;top:${p.y-g.s/2}px;width:${g.s}px;height:${g.s}px`+(h.el.style.getPropertyValue('--d')?`;--d:${h.el.style.getPropertyValue('--d')}`:'')})}
function renderStrip(){const left=st.set.length;M.Shell.steps(strip,st.set.map(t=>shapeSVG(t,{ground:false})),st.set.length-st.queue.length-st.tray.length)}
/* the tray shows up to 3 pieces (shell.tray: at most 3 things to press); as one goes in, the next comes */
function fillTray(){
  while(st.tray.length<3&&st.queue.length){const t=st.queue.shift();st.tray.push(t);
    const b=document.createElement('button');b.type='button';b.className='piece ln-piece enter';b.dataset.t=t;b.setAttribute('aria-label','모양');b.innerHTML=shapeSVG(t);bindPiece(b,t);tray.appendChild(b)}
  renderStrip();
}
const pieceEl=t=>tray.querySelector(`.ln-piece[data-t="${t}"]`);
function select(t,on){tray.querySelectorAll('.ln-piece').forEach(b=>b.classList.toggle('sel',on&&b.dataset.t===t));st.sel=on?t:null}
function aimHand(){
  if(!st||st.phase!=='play'){G.stop();return}
  const t=st.sel||st.tray[0];if(!t){G.stop();return}
  G.start({type:'tap',after:HAND_MS,ko:st.sel?'맞는 구멍을 콕!':'모양을 콕!',en:st.sel?'Tap the matching hole!':'Tap a shape!',at:()=>{
    const s=sec.getBoundingClientRect();
    if(st.sel){const h=st.holes[st.sel];if(h){const r=h.el.getBoundingClientRect();return[r.left-s.left+r.width/2-8,r.top-s.top+r.height/2-10]}}
    const b=pieceEl(st.tray[0]);if(b){const r=b.getBoundingClientRect();return[r.left-s.left+r.width/2-8,r.top-s.top+r.height/2-10]}return[0,0]}});
}
function newRound(){
  L.begin();G.stop();
  const lv=lvOf(id),set=SETS[lv-1].slice();
  const slots=set.map((_,i)=>i).sort(()=>Math.random()-.5),slotOf={};set.forEach((t,i)=>slotOf[t]=slots[i]);
  st={lv,set,slotOf,queue:set.slice().sort(()=>Math.random()-.5),tray:[],sel:null,phase:'play',wrong:0,busy:false};
  LOG.push('round:'+set.join(','));
  SX.stars();tray.innerHTML='';build();fillTray();
  say(lv===1?'모양을 같은 모양 자리에 쏙 넣어 봐!':'모양을 하나씩 알맞은 자리에 쏙!',lv===1?'Put the shape in its home!':'Put each shape in its home!');
  aimHand();
}
function say1(t){const n=SHP[t];say(n.ko+'!',n.en[0].toUpperCase()+n.en.slice(1)+'!')}
/* a shape goes into its hole: it flies there and fills it */
function place(t,from,fromSize){
  const hole=st.holes[t];if(!hole||hole.done)return;
  hole.done=true;st.busy=true;G.stop();select(t,false);
  st.tray.splice(st.tray.indexOf(t),1);const b=pieceEl(t);if(b)b.remove();
  LOG.push('in:'+t);sfx.pop();
  const hr=hole.el.getBoundingClientRect(),sr=stage.getBoundingClientRect(),fl=document.createElement('div');fl.className='sp-ghost';fl.style.zIndex=20;
  const sz=fromSize||110;fl.style.cssText+=`;left:${from.x-sz/2-sr.left}px;top:${from.y-sz/2-sr.top}px;width:${sz}px;height:${sz}px`;fl.innerHTML=shapeSVG(t);stage.appendChild(fl);
  const tx=hr.left+hr.width/2-from.x,ty=hr.top+hr.height/2-from.y,sc=hr.width/sz;
  let fd=false;const fin=()=>{if(fd)return;fd=true;fl.remove();hole.el.innerHTML=shapeSVG(t);hole.el.classList.add('in');hole.el.dataset.in='1';tone(420+LOG.length*20,.18,'triangle',.2);say1(t);
    burst(stage,L,hr.left+hr.width/2-sr.left,hr.top+hr.height/2-sr.top);
    if(st.queue.length||st.tray.length){fillTray();st.busy=false;aimHand()}else all()};
  try{const a=fl.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${tx*.5}px,${ty*.5-40}px) scale(${1+(sc-1)*.5+.1})`,offset:.5},{transform:`translate(${tx}px,${ty}px) scale(${sc})`}],{duration:520,easing:'cubic-bezier(.3,.1,.5,1)',fill:'forwards'});a.onfinish=fin;L.later(fin,900)}catch(e){fin()}
  renderStrip();
}
function wrongTry(t,b,target){
  st.wrong++;LOG.push('wrong:'+t+'>'+(target||'-'));sfx.boing&&sfx.boing();
  if(b){b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}
  const v=(CF.voice&&CF.voice.onWrongPlace)||[{ko:'여기야, 여기!',en:'Right here!'}];const l=v[rand(v.length)];say(l.ko,l.en);
  const h=st.holes[t];if(h&&!h.done){h.el.classList.add('hint');L.later(()=>h.el.classList.remove('hint'),3200)}
}
function drop(t,x,y,b,sz){
  if(st.busy||st.phase!=='play')return false;
  const g=Object.keys(st.holes).map(k=>{const h=st.holes[k],r=h.el.getBoundingClientRect();return{k,h,d:Math.hypot(r.left+r.width/2-x,r.top+r.height/2-y),r}}).filter(o=>!o.h.done);
  const hit=g.find(o=>x>=o.r.left&&x<=o.r.right&&y>=o.r.top&&y<=o.r.bottom)||g.sort((a,c)=>a.d-c.d).find(o=>o.d<o.r.width*.75);
  if(!hit)return false;
  if(hit.k===t){place(t,{x,y},sz);return true}
  wrongTry(t,b,hit.k);return true;
}
function bindPiece(b,t){
  let dr=null;
  b.addEventListener('pointerdown',e=>{
    if(st.busy||st.phase!=='play')return;actx();G.touch();
    try{b.setPointerCapture(e.pointerId)}catch(_){}
    dr={id:e.pointerId,sx:e.clientX,sy:e.clientY,moved:false,g:null};
  });
  b.addEventListener('pointermove',e=>{
    if(!dr||dr.id!==e.pointerId)return;
    if(!dr.moved&&Math.hypot(e.clientX-dr.sx,e.clientY-dr.sy)>10){dr.moved=true;b.classList.add('drag');select(t,false);
      const s=sec.getBoundingClientRect(),sz=Math.max(FOOT,st.g.s*.6);dr.sz=sz;const gh=document.createElement('div');gh.className='sp-ghost';gh.style.width=gh.style.height=sz+'px';gh.innerHTML=shapeSVG(t);sec.appendChild(gh);dr.g=gh;dr.s=s;tone(520,.08,'triangle',.12);say1(t)}
    if(dr.moved&&dr.g){const s=sec.getBoundingClientRect();dr.g.style.left=(e.clientX-s.left-dr.sz/2)+'px';dr.g.style.top=(e.clientY-s.top-dr.sz/2)+'px'}
  });
  const up=e=>{
    if(!dr||dr.id!==e.pointerId)return;const d=dr;dr=null;G.release();
    if(d.g)d.g.remove();b.classList.remove('drag');
    if(d.moved){if(!drop(t,e.clientX,e.clientY,b,d.sz)){LOG.push('drag:home')}aimHand()}
    else{const on=st.sel!==t;select(t,on);if(on){say1(t);LOG.push('sel:'+t)}aimHand()}
  };
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',e=>{if(!dr)return;const d=dr;dr=null;if(d.g)d.g.remove();b.classList.remove('drag')});
}
/* tap a hole while a shape is picked up */
stage.addEventListener('pointerdown',e=>{
  if(!st||st.busy||st.phase!=='play')return;
  const hel=e.target.closest('.sp-hole');if(!hel)return;actx();G.touch();
  const k=hel.dataset.t,h=st.holes[k];
  if(h.done){say1(k);return}
  if(!st.sel){say('먼저 모양을 콕!','Tap a shape first!');G.release();aimHand();return}
  const b=pieceEl(st.sel),br=b?b.getBoundingClientRect():null;
  if(st.sel===k)place(k,{x:br.left+br.width/2,y:br.top+br.height/2},br.width);
  else{wrongTry(st.sel,b,k);G.release();aimHand()}
});
function all(){
  st.phase='done';st.busy=true;G.stop();LOG.push('win');renderStrip();sfx.ding();
  Object.keys(st.holes).forEach((k,i)=>{const e=st.holes[k].el;e.style.setProperty('--d',(i*.14)+'s');e.classList.remove('in');e.classList.add('hop')});
  const p=praise();say(`모양을 다 넣었어! ${p[0]}`,`All the shapes are home! ${p[1]}`);
  tray.innerHTML='';
  endRound(SX,L,id,st.wrong,thing,newRound);
}
const pair=(a,b)=>`<svg viewBox="0 0 210 100" style="overflow:visible"><g>${inner(shapeSVG(a,{ground:false}))}</g><g transform="translate(110 0)">${inner(shapeSVG(b,{ground:false}))}</g></svg>`;
function thing(lv){
  if(lv===2)return{art:pair('circle','square'),ko:'동그라미와 네모!',en:'Circle and square!'};
  if(lv===3)return{art:shapeSVG('triangle'),ko:'세모!',en:'Triangle!'};
  return{art:pair('star','heart'),ko:'별과 하트!',en:'Star and heart!'};
}
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},exit:()=>{L.begin();G.stop();st=null},
  resize:()=>{if(st&&st.g&&cur()===id){st.g=geo();placeHoles()}}};
window.addEventListener('resize',()=>{if(cur()===id&&st&&st.g){st.g=geo();placeHoles()}});

M.__shLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__sh=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),rc=e=>{const b=e.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,left:b.left,top:b.top,right:b.right,bottom:b.bottom}};
  return{lv:st.lv,set:st.set.slice(),phase:st.phase,busy:st.busy,wrong:st.wrong,sel:st.sel,log:LOG.slice(-40),stage:{left:r.left,top:r.top,width:r.width,height:r.height},
    holes:Object.keys(st.holes).map(k=>Object.assign({t:k,done:st.holes[k].done},rc(st.holes[k].el))),
    pieces:[...tray.querySelectorAll('.ln-piece')].map(b=>Object.assign({t:b.dataset.t},rc(b))),
    starsOn:sec.querySelectorAll('.ln-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ln-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id)};
};
M.__shDepth=()=>SETS.map((s,i)=>{const steps=['모양 집기(콕 또는 끌기)','맞는 구멍 찾기','쏙 넣기'];
  return{level:i+1,processes:steps.length+(s.length>1?1:0),steps,hands:['tap','drag'],someone:true,choice:s.length>1,ending:'모양들이 춤 · 별'}});
})();

/* =====================================================================================================================
   3. 선 긋기
   ===================================================================================================================== */
(()=>{
const id='trace',L=life(id);
PRG.register(id,{max:MAXLV,name:'선 긋기'});
const T=mk(id,'선 긋기'),{stage,strip,sec}=T,tray=T.tray;
const G=M.Guide.make(sec,{say});
const AL=M.Alive;
let st=null,raf=0;const LOG=[];

/* the pictures that appear at the end (the result is the only vivid thing) */
const PICS=[
  {k:'carrot',ko:'당근',en:'carrot',art:()=>`<svg viewBox="-50 -50 100 100" style="overflow:visible"><path d="M-10 -22L0 -42L10 -22Z" fill="${PAL.sage}" ${STK}/><path d="M-4 -26L-18 -38M4 -26L18 -36" stroke="${PAL.sage}" stroke-width="7" stroke-linecap="round"/><path d="M-16 -24Q0 -32 16 -24Q18 -10 4 36Q0 44 -4 36Q-18 -10 -16 -24Z" fill="${V.ball('#EDA468')}" ${STK}/><path d="M-8 -12H4M-6 4H6M-3 20H3" stroke="#D9824A" stroke-width="3" stroke-linecap="round"/>${V.shine(-7,-14,4,8,-10)}</svg>`},
  {k:'house',ko:'집',en:'house',art:()=>`<svg viewBox="-50 -50 100 100" style="overflow:visible"><path d="M-38 36V-4L0 -36L38 -4V36Z" fill="${V.ball('#F8E8D0')}" ${STK}/><path d="M-46 -2L0 -44L46 -2Z" fill="${V.ball(PAL.rose)}" ${STK}/><path d="M-12 36V8Q-12 -2 0 -2Q12 -2 12 8V36Z" fill="${PAL.sage}" ${STK}/><circle cx="6" cy="20" r="2.6" fill="${PAL.butter}"/><rect x="-32" y="2" width="14" height="14" rx="3" fill="#EAF5FC" ${STK}/><rect x="18" y="2" width="14" height="14" rx="3" fill="#EAF5FC" ${STK}/></svg>`},
  {k:'flower',ko:'꽃',en:'flower',art:()=>`<svg viewBox="-50 -50 100 100" style="overflow:visible"><path d="M0 4V42" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M0 4V42" stroke="#7FA978" stroke-width="4.5" stroke-linecap="round"/><path d="M2 30Q22 20 30 30Q16 40 2 30Z" fill="${PAL.sage}" ${STK}/>${[0,1,2,3,4].map(i=>`<ellipse cx="0" cy="-22" rx="11" ry="17" transform="rotate(${i*72} 0 -6)" fill="${V.ball(PAL.rose)}" ${STK}/>`).join('')}<circle cx="0" cy="-6" r="11" fill="${V.ball(PAL.butter)}" ${STK}/></svg>`},
  {k:'sun',ko:'해님',en:'sun',art:()=>`<svg viewBox="-50 -50 100 100" style="overflow:visible">${Array.from({length:8},(_,i)=>`<path d="M-5 -34L0 -46L5 -34Z" transform="rotate(${i*45})" fill="${PAL.butter}" ${STK}/>`).join('')}<circle r="29" fill="${V.ball(PAL.butter)}" ${STK}/><circle cx="-10" cy="-3" r="3.4" fill="${OL}"/><circle cx="10" cy="-3" r="3.4" fill="${OL}"/><path d="M-9 9Q0 17 9 9" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><ellipse cx="-17" cy="6" rx="6" ry="4" fill="${V.cheek(PAL.rose)}"/><ellipse cx="17" cy="6" rx="6" ry="4" fill="${V.cheek(PAL.rose)}"/></svg>`}
];
const bushSVG=()=>`<svg viewBox="-60 -50 120 100" style="overflow:visible">${V.ground(0,38,46,7)}<circle cx="-28" cy="8" r="26" fill="${V.ball('#9CC293')}" ${STK}/><circle cx="26" cy="10" r="24" fill="${V.ball('#A9CFA0')}" ${STK}/><circle cx="0" cy="-8" r="31" fill="${V.ball('#A9CFA0')}" ${STK}/>${V.shine(-10,-22,11,7,-25)}<circle cx="-32" cy="-4" r="4.5" fill="${PAL.rose}"/><circle cx="30" cy="-6" r="4.5" fill="${PAL.butter}"/><circle cx="6" cy="14" r="4" fill="${PAL.lilac}"/></svg>`;
const meadowSVG=(W,H)=>`<svg class="ln-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="lnsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF3F8"/><stop offset="1" stop-color="#F8F2E2"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#lnsky)"/>
  <g fill="#fff" opacity=".85"><ellipse cx="${W*.22}" cy="${H*.09}" rx="40" ry="13"/><ellipse cx="${W*.3}" cy="${H*.075}" rx="26" ry="11"/><ellipse cx="${W*.76}" cy="${H*.15}" rx="36" ry="12"/><ellipse cx="${W*.84}" cy="${H*.135}" rx="22" ry="9"/></g>
  <path d="M0 ${H*.62}Q${W*.3} ${H*.5} ${W*.6} ${H*.6}T${W} ${H*.56}V${H}H0Z" fill="#CFE2C0"/><path d="M0 ${H*.78}Q${W*.4} ${H*.68} ${W} ${H*.76}V${H}H0Z" fill="#BFD8AE"/>
  ${[[.12,.9,PAL.rose],[.86,.88,PAL.butter],[.5,.94,PAL.lilac],[.92,.7,PAL.rose],[.07,.7,PAL.butter]].map(([x,y,c])=>`<g transform="translate(${W*x} ${H*y})"><path d="M0 0V12" stroke="#7FA978" stroke-width="3" stroke-linecap="round"/><circle r="6" fill="${c}" stroke="${OL}" stroke-width="1.8"/><circle r="2.2" fill="#fff"/></g>`).join('')}</svg>`;

/* the road for each level (stage coordinates; start = bottom, end = top) */
function route(lv,W,H){
  const N=240,out=[];
  for(let i=0;i<=N;i++){const t=i/N;let x,y;
    if(lv===1){x=W*(.40+.2*t);y=H*(.72-.40*t)}
    else if(lv===2){x=W*(.2+.6*t);y=H*(.8-.6*t)}
    else if(lv===3){x=W*.5+Math.sin(t*Math.PI*2.5)*W*.22;y=H*(.82-.62*t)}
    else{const r=Math.min(W*.31,H*.27),a=Math.PI/2+t*Math.PI*2*.86;x=W/2+r*Math.cos(a);y=H*.5+r*Math.sin(a)}
    out.push([x,y])}
  return out;
}
const cumOf=pts=>{const c=[0];for(let i=1;i<pts.length;i++)c.push(c[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return c};
function at(s){ // s in 0..1 → {x,y,dx,dy}
  const c=st.cum,tot=c[c.length-1],d=Math.max(0,Math.min(1,s))*tot;let i=1;while(i<c.length-1&&c[i]<d)i++;
  const a=st.pts[i-1],b=st.pts[i],t=(d-c[i-1])/((c[i]-c[i-1])||1);return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,dx:b[0]-a[0],dy:b[1]-a[1]}}
function project(x,y,s0,s1){ // nearest point of the road between fractions s0..s1
  const c=st.cum,tot=c[c.length-1];let best={d:1e9,s:0};
  for(let i=1;i<c.length;i++){if(c[i]<s0*tot||c[i-1]>s1*tot)continue;
    const a=st.pts[i-1],b=st.pts[i],vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy||1;let t=((x-a[0])*vx+(y-a[1])*vy)/l2;t=Math.max(0,Math.min(1,t));
    const px=a[0]+vx*t,py=a[1]+vy*t,d=Math.hypot(x-px,y-py);if(d<best.d)best={d,s:(c[i-1]+Math.sqrt(l2)*t)/tot}}
  return best;
}
const pathD=pts=>'M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
let chEl=null,chAl=null,bushEl=null,picEl=null,roadProg=null,faceDir=1;
function chSize(){return Math.round(Math.min(110,Math.max(84,st.lw*1.45)))}
function build(){
  const W=stage.clientWidth,H=stage.clientHeight;st.W=W;st.H=H;
  const lw=Math.max(Math.round(W*WIDTH_R),64);st.lw=lw;
  st.pts=route(st.lv,W,H);st.cum=cumOf(st.pts);
  const d=pathD(st.pts),e=st.pts[st.pts.length-1],s0=st.pts[0];
  stage.innerHTML=meadowSVG(W,H)+`<svg class="ln-bg" id="trRoad" viewBox="0 0 ${W} ${H}" style="z-index:1">
    <path d="${d}" fill="none" stroke="#5B3A29" stroke-opacity=".10" stroke-width="${lw+12}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 4)"/>
    <path d="${d}" fill="none" stroke="#E7D8BD" stroke-width="${lw+10}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#F4EAD6" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${lw*.7}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2 -3)" opacity=".35"/>
    <path d="${d}" fill="none" stroke="#C9B58F" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 17"/>
    <path id="trProg" d="${d}" fill="none" stroke="${PAL.rose}" stroke-width="${lw*.6}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0 99999"/>
    <circle cx="${s0[0]}" cy="${s0[1]}" r="${lw*.5}" fill="#fff" opacity=".55"/></svg>`;
  roadProg=stage.querySelector('#trProg');
  const total=st.cum[st.cum.length-1];st.total=total;try{roadProg.style.strokeDasharray=`0 ${total*2}`}catch(_){}
  /* the thing the road leads to: a bush that hides a picture */
  bushEl=document.createElement('div');bushEl.className='tr-bush sway';const bw=Math.round(Math.max(lw*1.5,96));bushEl.style.cssText=`left:${e[0]-bw/2}px;top:${e[1]-bw*.5}px;width:${bw}px;height:${bw*.83}px`;bushEl.innerHTML=bushSVG();stage.appendChild(bushEl);
  chEl=document.createElement('div');chEl.className='tr-ch';chEl.innerHTML=`<div class="tr-ani">${A.animal('bunny','idle')}</div>`;stage.appendChild(chEl);
  if(chAl){try{chAl.detach()}catch(_){}chAl=null}
  try{chAl=AL.attach(chEl.querySelector('.tr-ani'),{kind:'bunny',follow:false})}catch(_){}
  picEl=document.createElement('div');picEl.className='tr-pic';picEl.innerHTML=PICS[st.lv-1].art();stage.appendChild(picEl);
  draw();
}
function draw(){
  if(!st||!chEl)return;
  const p=at(st.prog),sz=chSize(),w=sz,h=sz*230/200;
  if(Math.abs(p.dx)>.3)faceDir=p.dx<0?-1:1;
  const bob=st.moving?Math.abs(Math.sin(st.prog*st.total/22))*-7:0;
  chEl.style.width=w+'px';chEl.style.height=h+'px';
  chEl.style.transform=`translate(${(p.x-w/2).toFixed(1)}px,${(p.y-h*.78+bob).toFixed(1)}px) scaleX(${faceDir})`;
  if(roadProg)roadProg.style.strokeDasharray=`${(st.prog*st.total).toFixed(1)} ${st.total*2}`;
}
function renderStrip(){const k=Math.min(3,Math.floor(st.prog*3+.0001));
  M.Shell.steps(strip,[0,1,2].map(i=>`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="18" fill="${PAL.rose}" ${STK}/><circle cx="30" cy="30" r="9" fill="${PAL.rose}" ${STK}/><circle cx="50" cy="22" r="9" fill="${PAL.rose}" ${STK}/><circle cx="70" cy="30" r="9" fill="${PAL.rose}" ${STK}/></svg>`),st.prog>=1?3:k)}
function aim(){G.start({type:'tap',after:HAND_MS,ko:'토토를 따라 쓱쓱!',en:'Slide along the road!',at:()=>{if(!st)return[0,0];const q=at(Math.min(1,st.prog+.14));const r=secXY(sec,stage,q.x,q.y);return[r[0]-8,r[1]-10]}})}
function newRound(){
  L.begin();G.stop();cancelAnimationFrame(raf);
  const lv=lvOf(id);
  st={lv,prog:0,target:0,down:false,near:false,moving:false,done:false,phase:'go',lastT:0,tapMoved:0,tx:0,ty:0,lastBeep:0,touches:0};
  T.stars();build();renderStrip();tray.innerHTML='';traySet();
  say(lv===1?'토토가 덤불로 가요. 손가락으로 길을 따라 쓱쓱!':'손가락으로 길을 따라 쓱쓱!',lv===1?'Toto is going to the bush! Slide your finger along the road!':'Slide your finger along the road!');
  aim();L.onEnd(()=>cancelAnimationFrame(raf));st.lastT=performance.now();raf=requestAnimationFrame(loop);
}
/* the tray carries the little picture of what the road leads to (a small bunny + bush), so the bottom is not empty */
function traySet(){tray.innerHTML=`<div class="ln-numcard" style="border-radius:34px;aspect-ratio:auto;width:min(86%,330px);height:min(100%,140px);padding:10px 18px"><svg viewBox="0 0 330 100" style="width:100%;height:100%;display:block;overflow:visible"><path id="trTray" d="M40 62Q80 28 120 62T200 62T290 50" fill="none" stroke="#E7D8BD" stroke-width="22" stroke-linecap="round"/><path d="M40 62Q80 28 120 62T200 62T290 50" fill="none" stroke="#C9B58F" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 13"/><g transform="translate(30 4) scale(.4)">${inner(A.animal('bunny','happy'))}</g><g transform="translate(240 14) scale(.62)">${inner(PICS[st.lv-1].art())}</g></svg></div>`}
function loop(t){
  if(!st||cur()!==id)return;
  const dt=Math.min(.1,Math.max(0,(t-st.lastT)/1000));st.lastT=t;
  if(!st.done){
    let want=st.target;
    if(st.down){want=Math.max(want,st.prog+CREEP*dt*1.0);st.target=want}   // a finger on the screen always creeps a little
    if(st.prog>=AUTO*1.0&&!st.done)want=1;
    if(want>st.prog){const step=Math.min(want-st.prog,MAXSP*dt);const was=st.prog;st.prog=Math.min(1,st.prog+step);st.moving=step>1e-4;
      if(st.prog-st.lastBeep>=.1){st.lastBeep=st.prog;if(st.down||st.tapAdv)tone(392+st.prog*520,.12,'triangle',.16)}
      if(Math.floor(st.prog*3)!==Math.floor(was*3))renderStrip();
      if(st.prog>=.999)finish()}
    else st.moving=false;
    draw();
  }
  raf=requestAnimationFrame(loop);
}
const loc=e=>{const r=stage.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
function touchAt(p){
  if(!st||st.done||st.phase!=='go')return;
  const reach=st.lw*(.5+NEAR);
  const pr=project(p.x,p.y,Math.max(0,st.prog-.04),Math.min(1,st.prog+.22));
  st.near=pr.d<=reach;
  if(st.near&&pr.s>st.target)st.target=pr.s;
}
stage.addEventListener('pointerdown',e=>{
  actx();if(!st||st.done||st.phase!=='go')return;
  try{stage.setPointerCapture(e.pointerId)}catch(_){}
  st.down=true;st.touches++;st.tapMoved=0;const p=loc(e);st.tx=p.x;st.ty=p.y;G.touch();touchAt(p);
  if(st.touches===1)LOG.push('down');
});
stage.addEventListener('pointermove',e=>{
  if(!st||!st.down)return;const p=loc(e);st.tapMoved+=Math.hypot(p.x-st.tx,p.y-st.ty);st.tx=p.x;st.ty=p.y;touchAt(p);
});
const up=()=>{
  if(!st||!st.down)return;st.down=false;G.release();
  if(st.tapMoved<10&&!st.done){st.target=Math.min(1,Math.max(st.target,st.prog)+TAPADV);st.tapAdv=true;LOG.push('tap')}
};
stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
function finish(){
  if(st.done)return;st.done=true;st.phase='done';st.prog=1;st.target=1;st.moving=false;G.stop();LOG.push('win');draw();renderStrip();
  const pic=PICS[st.lv-1],e=st.pts[st.pts.length-1];
  if(chAl){try{chAl.setMood('happy');chAl.play('hop',{n:2,wave:true})}catch(_){}}
  sfx.ding();
  if(bushEl){bushEl.classList.remove('sway');bushEl.classList.add('open')}
  L.later(()=>{if(picEl)picEl.classList.add('on');stage.querySelectorAll('#trRoad').forEach(x=>{x.style.transition='opacity .6s';x.style.opacity='.25'});burst(stage,L,st.W/2,st.H*.3)},500);
  const p=praise();say(`${pic.ko}! ${p[0]}`,`${pic.en[0].toUpperCase()+pic.en.slice(1)}! ${p[1]}`);
  endRound(T,L,id,0,thing,newRound);
}
const roadIcon=(lv)=>{const d={2:'M14 86L86 14',3:'M30 90Q80 70 30 50T30 10',4:'M50 88A38 38 0 1 1 49 88'}[lv];
  return `<svg viewBox="0 0 100 100"><path d="${d}" fill="none" stroke="${OL}" stroke-width="17" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#F4EAD6" stroke-width="10" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#C9B58F" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9"/></svg>`};
function thing(lv){
  if(lv===2)return{art:roadIcon(2),ko:'긴 길!',en:'A long road!'};
  if(lv===3)return{art:roadIcon(3),ko:'꼬불꼬불 길!',en:'A wavy road!'};
  return{art:roadIcon(4),ko:'동그란 길!',en:'A round road!'};
}
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},exit:()=>{L.begin();G.stop();cancelAnimationFrame(raf);st=null},
  resize:()=>relayout()};
function relayout(){if(!st||cur()!==id||st.done)return;const keep={prog:st.prog,target:st.target,down:st.down,phase:st.phase,lv:st.lv,touches:st.touches,lastT:st.lastT,lastBeep:st.lastBeep};build();Object.assign(st,keep);draw()}
window.addEventListener('resize',relayout);

M.__trLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__tr=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),cr=chEl.getBoundingClientRect(),n=st.pts.length;
  const cl=a=>[a[0]+r.left,a[1]+r.top];
  return{lv:st.lv,phase:st.phase,prog:st.prog,target:st.target,done:st.done,down:st.down,log:LOG.slice(-30),lane:st.lw,stage:{left:r.left,top:r.top,width:r.width,height:r.height},
    path:st.pts.filter((_,i)=>i%6===0||i===n-1).map(cl),start:cl(st.pts[0]),end:cl(st.pts[n-1]),
    char:{x:cr.left+cr.width/2,y:cr.top+cr.height/2,w:cr.width,h:cr.height},bush:bushEl&&bushEl.className,pic:!!(picEl&&picEl.classList.contains('on')),
    starsOn:sec.querySelectorAll('.ln-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ln-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id),
    content:{top:Math.min(...st.pts.map(p=>p[1]))+r.top-st.lw/2,bottom:Math.max(...st.pts.map(p=>p[1]))+r.top+st.lw/2}};
};
M.__trDepth=()=>[1,2,3,4].map(lv=>({level:lv,processes:4,steps:['토토 콕(출발)','길 따라가기','덤불 도착','그림 나타남'],hands:['trace','tap'],someone:true,choice:false,ending:'덤불이 열리고 그림 · 별'}));
})();

})();
