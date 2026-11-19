/* 탐험과 음악 놀이 셋 (P8-라) — 탐험대(어디 있지?) · 리듬 박수(작은 음악회) · 악기(실로폰·북·종).
   셋 모두 공통 틀(ML.Shell)과 단계 엔진(ML.Progress)을 씁니다. 화면에 글자와 이모지는 없고, 말은 한국어 다음 영어(say)로 나옵니다.
   탐험대: 바다·산·우주·공주 모험 중 하나를 시작 카드로 고르면, 토토가 "물고기 어디 있지?" 하고 묻고 아이가 그림 속에서 콕 해서 찾아요.
           찾으면 그 친구가 신나게 뛰어요. 다른 것을 콕 해도 그 이름만 알려 주고 다시 물어요(틀림 없음). 단계가 오르면 더 많이 · 더 작게 · 가려진 채 · 차례로 찾아요.
   리듬 박수: 북·탬버린·종 중 하나를 고르면 무대 위 친구들 앞에서 토토가 먼저 치고(막대가 시간대로 켜짐), 아이가 큰 악기를 같은 수만큼 콕. 타이밍은 따지지 않고
           실패도 없어요. 가만히 있으면 토토가 한 번 더 같이 쳐 줘요. 다 치면 친구들과 함께 인사(절)해요. 4단계는 작은 별 같은 옛 동요 한 소절의 박자에 맞춰요.
   악기: 실로폰(건반 3 → 5 → 8개) · 북 · 종을 만지면 바로 소리가 나요. 4단계는 빛나는 건반을 따라 옛 동요(작은 별·나비야·비행기) 한 소절을 쳐요. 소리는 만질 때만 나요.
   숫자는 MLCFG.games.rhythmClap/music(levels), touch(minTargetPx), progress, calm, art.volume 에서 읽어요. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!M||!P||!A||!M.Guide||!M.Shell||!M.Progress)return;
const {say,sfx,games,actx,rand}=M;
const {life}=P;
const CF=M.CFG,PAL=CF.calm.palette,TC=CF.touch||{},CEL=CF.calm.celebration||{pieces:6,durationMs:1200};
const OL=A.OL,V=A.vol,STK=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const FOOT=TC.minTargetPx||110;
const PRG=M.Progress,MAXLV=4;
const cur=()=>M.current();
const praise=()=>{try{return M.nextPraise()}catch(e){return['잘했어!','Good job!']}};
const inner=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const shuf=a=>a.slice().sort(()=>Math.random()-.5);

/* ---------- styles ---------- */
const css=`
.ex-screen .sh-head .ex-stars{display:flex;flex:none;margin-left:auto}
.ex-stage{background:var(--bg);touch-action:none;user-select:none;-webkit-user-select:none}
.ex-stage>svg.ex-bg{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.ex-tray{display:flex;align-items:center;justify-content:center;gap:12px}
.ex-fx{position:absolute;z-index:30;pointer-events:none;width:30px;height:30px;margin:-15px 0 0 -15px}
.ex-fx svg{display:block;width:100%;height:100%}
.ex-card{flex:0 1 150px;min-width:${FOOT}px;aspect-ratio:1;border:0;border-radius:24px;background:var(--paper);padding:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 0 rgba(91,74,66,.14);transition:transform .15s,box-shadow .15s}
.ex-card svg{width:100%;height:100%;display:block;overflow:visible}
.ex-card:active{transform:translateY(4px) scale(.97)}
.ex-card.sel{transform:translateY(-6px);box-shadow:0 10px 0 rgba(91,74,66,.12),0 0 0 5px color-mix(in srgb,${PAL.butter} 80%,#fff)}
/* explore */
.ex-it{position:absolute;z-index:3;touch-action:none;-webkit-tap-highlight-color:transparent;cursor:pointer}
.ex-it svg{width:100%;height:100%;display:block;overflow:visible;animation:exfloat 3.4s ease-in-out infinite;animation-delay:var(--d,0s);transform-origin:50% 90%}
.ex-it.found{pointer-events:none}
.ex-it.found svg{animation:exhop .9s ease-in-out 2}
.ex-it.wob svg{animation:exwob .5s ease-in-out}
.ex-it.hint svg{animation:exhint 1.5s ease-in-out infinite}
.ex-it.cheer svg{animation:exhop .9s ease-in-out var(--d,0s) 2}
.ex-cover{position:absolute;z-index:4;pointer-events:none}
.ex-cover svg{width:100%;height:100%;display:block;overflow:visible}
.ex-star{position:absolute;z-index:6;pointer-events:none;width:34px;height:34px;margin:-17px 0 0 -17px;animation:exstar 1.6s ease-out forwards}
.ex-star svg{width:100%;height:100%;display:block}
@keyframes exfloat{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-2.5%) scale(1.02,.99)}}
@keyframes exhop{0%,100%{transform:translateY(0) scale(1,1)}22%{transform:translateY(0) scale(1.1,.88)}50%{transform:translateY(-16%) scale(.95,1.1)}78%{transform:translateY(0) scale(1.06,.94)}}
@keyframes exwob{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}60%{transform:rotate(6deg)}}
@keyframes exhint{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes exstar{0%{transform:translateY(8px) scale(.4);opacity:0}25%{opacity:1;transform:translateY(-6px) scale(1.1)}100%{transform:translateY(-34px) scale(1);opacity:0}}
.ex-ask{flex:0 1 auto;width:min(94%,360px);height:min(100%,148px);border:0;border-radius:36px;background:var(--paper);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 5px 0 rgba(91,74,66,.14);position:relative}
.ex-ask:active{transform:translateY(4px)}
.ex-ask .ex-who{flex:none;height:100%;aspect-ratio:200/230}
.ex-ask .ex-who svg{width:100%;height:100%;display:block;overflow:visible}
.ex-ask .ex-bub{flex:1;height:100%;border-radius:30px;background:#F6EEE0;display:grid;place-items:center;padding:14px 12px;position:relative;margin-left:6px;box-sizing:border-box;overflow:hidden}
.ex-ask .ex-bub:before{content:"";position:absolute;left:-9px;top:50%;margin-top:-9px;border:9px solid transparent;border-right-color:#F6EEE0;border-left:0}
.ex-ask .ex-bub svg{position:absolute;left:12px;top:12px;width:calc(100% - 24px);height:calc(100% - 24px);display:block;overflow:visible}
.ex-ask .ex-bub svg.pop{animation:expop .5s cubic-bezier(.3,1.5,.5,1)}
@keyframes expop{0%{transform:scale(.55)}100%{transform:scale(1)}}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ---------- shared little pieces ---------- */
const star=(c,x,y,r)=>`<path d="M${x} ${y-r}L${x+r*.3} ${y-r*.3}L${x+r} ${y-r*.2}L${x+r*.45} ${y+r*.25}L${x+r*.6} ${y+r}L${x} ${y+r*.55}L${x-r*.6} ${y+r}L${x-r*.45} ${y+r*.25}L${x-r} ${y-r*.2}L${x-r*.3} ${y-r*.3}Z" fill="${c}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;
const HEART=c=>`<svg viewBox="0 0 24 24"><path d="M12 21C-4 10 4 1 12 7C20 1 28 10 12 21Z" fill="${c}" stroke="${OL}" stroke-width="1.4"/></svg>`;
const TW=c=>`<svg viewBox="0 0 24 24">${star(c,12,12,10)}</svg>`;
const NOTE=c=>`<svg viewBox="0 0 24 24"><path d="M9 18V5L20 3V16" fill="none" stroke="${OL}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="4.4" fill="${c}" stroke="${OL}" stroke-width="2"/><circle cx="17.5" cy="16" r="4.4" fill="${c}" stroke="${OL}" stroke-width="2"/></svg>`;
const hillD=(W,H,y,amp,ph)=>`M0 ${H}V${y.toFixed(1)}Q${(W*(.25+ph*.1)).toFixed(1)} ${(y-amp).toFixed(1)} ${(W*.5).toFixed(1)} ${y.toFixed(1)}T${W} ${(y-amp*ph*.6).toFixed(1)}V${H}Z`;

/* a screen on the common shell: back arrow, picture strip, 3 stars; stage; tray */
function mk(id,title){
  const sc=M.Shell.screen(id,{title,cls:'ex-screen',stageClass:'ex-stage',trayClass:'ex-tray',after:'<div class="ex-stars"></div>'});
  const q=s=>sc.sec.querySelector(s);
  return{sc,sec:sc.sec,stage:sc.stage,tray:sc.tray,strip:sc.strip,starsEl:q('.ex-stars'),
    stars(n){this.starsEl.innerHTML=PRG.stars(id,n)}};
}
const lvOf=id=>Math.max(1,Math.min(MAXLV,(PRG.get(id).level|0)||1));
function fx(stage,L,html,x,y,dx,dy,ms){const f=document.createElement('div');f.className='ex-fx';f.style.left=x+'px';f.style.top=y+'px';f.innerHTML=html;stage.appendChild(f);L.onEnd(()=>f.remove());
  try{const a=f.animate([{transform:'translate(0,0) scale(.4)',opacity:0},{opacity:1,offset:.2},{transform:`translate(${dx}px,${dy}px) scale(1)`,opacity:0}],{duration:ms,easing:'ease-out',fill:'forwards'});a.onfinish=()=>f.remove()}catch(e){setTimeout(()=>f.remove(),ms)}}
function burst(stage,L,x,y){const n=CEL.pieces||6;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.55;L.later(()=>fx(stage,L,i%2?HEART(PAL.rose):TW(PAL.butter),x+(i-(n-1)/2)*18,y,Math.cos(a)*34,-60-(i%3)*18,CEL.durationMs||1200),i*70)}}
const secXY=(sec,stage,x,y)=>{const sr=sec.getBoundingClientRect(),r=stage.getBoundingClientRect();return[x+r.left-sr.left,y+r.top-sr.top]};
const rectOf=e=>{const b=e.getBoundingClientRect();return{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,left:b.left,top:b.top,right:b.right,bottom:b.bottom}};
/* a round ended: one star (ML.Progress), a full row opens the next level with its new thing; then next() */
function endRound(S,L,id,wrong,thing,next){
  if(wrong>=6){try{PRG.struggle(id,{wrong,idleMs:0})}catch(e){}}
  const R=PRG.clear(id);
  const stop=PRG.after(id,R,{starsEl:S.starsEl,host:S.stage,thing,then:()=>L.later(next,R.up?300:2600)});
  L.onEnd(stop);return R;
}
/* a round of soft sounds (attack 30 ms or more; only after a touch) */
const soundOn=()=>!(M.S&&M.S.sound===false);
let noiseBuf=null,noiseCtx=null;
function env(f,dur,type,vol,when){const a=actx();if(!a||!soundOn())return;const t=a.currentTime+(when||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function sweep(f0,f1,dur,type,vol,when){const a=actx();if(!a||!soundOn())return;const t=a.currentTime+(when||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.05);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.1)}
function noise(dur,freq,q,vol,when){const a=actx();if(!a||!soundOn())return;
  if(!noiseBuf||noiseCtx!==a){noiseCtx=a;noiseBuf=a.createBuffer(1,a.sampleRate*.6,a.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=a.currentTime+(when||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;f.type='bandpass';f.frequency.value=freq;f.Q.value=q||.8;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(a.destination);s.start(t);s.stop(t+dur+.05)}
const NOTES=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];       // do re mi fa sol la si do
const SND={
  drum(deg){deg=deg||0;sweep(200+deg*16,72+deg*7,.34,'sine',.5);noise(.1,320,.8,.14)},
  tamb(){noise(.18,5200,.9,.2);noise(.12,7600,1.2,.1,.06);env(3300,.1,'triangle',.04,.02)},
  bell(f){f=f||784;env(f,1.1,'sine',.2);env(f*2.01,.7,'sine',.07);env(f*3.02,.4,'sine',.03)},
  xylo(f){env(f,.6,'triangle',.22);env(f*3,.22,'sine',.05)},
  clapSoft(){noise(.09,1500,.6,.07)}
};
/* a soft little round of applause (only after the child finished their own play) */
function applause(){[0,.12,.2,.34,.43,.57,.7].forEach(w=>noise(.08,1400+Math.random()*900,.6,.06,w))}
/* friends who live on the stage (ML.Alive: breathing, blinking) */
function friend(kind,mood){return A.animal(kind,mood||'happy')}
function attachAlive(el,kind){try{return M.Alive.attach(el,{kind,follow:false})}catch(e){return null}}

/* ---------- the big drawn instruments (shared by the rhythm concert and the instrument play) ---------- */
const bodyOf=(d,c)=>{const b=`<path d="${d}" fill="${V.ball(c)}" ${STK}/>`;return b+V.lit(b)};
const drumSVG=(c)=>`<svg viewBox="0 0 200 200" style="overflow:visible">${V.ground(100,188,84,8)}
  ${bodyOf('M24 78V150Q24 180 100 180Q176 180 176 150V78Z',c||PAL.rose)}
  <path d="M30 98L52 152L72 100L92 154L112 100L132 154L152 100L170 144" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
  <ellipse cx="100" cy="78" rx="76" ry="26" fill="${V.ball(PAL.sky)}" ${STK}/>
  <ellipse cx="100" cy="78" rx="65" ry="20" fill="#FFF6E6" ${STK}/><ellipse cx="86" cy="73" rx="30" ry="6.5" fill="#fff" opacity=".7" transform="rotate(-6 86 73)"/>
  <g class="rh-stk rh-stk-l" style="transform-origin:34px 16px"><path d="M34 16L78 62" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M34 16L78 62" stroke="#E2B98A" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="64" r="8" fill="${V.ball(PAL.butter)}" ${STK}/></g>
  <g class="rh-stk rh-stk-r" style="transform-origin:166px 16px"><path d="M166 16L122 62" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M166 16L122 62" stroke="#E2B98A" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="64" r="8" fill="${V.ball(PAL.butter)}" ${STK}/></g></svg>`;
const tambSVG=()=>`<svg viewBox="0 0 200 200" style="overflow:visible">${V.ground(100,190,76,7)}
  <path d="M140 24Q168 10 176 36Q158 36 150 52Z" fill="${V.ball(PAL.rose)}" ${STK}/><path d="M58 22Q30 10 24 38Q42 36 50 52Z" fill="${V.ball(PAL.lilac)}" ${STK}/>
  <circle cx="100" cy="100" r="88" fill="${V.ball(PAL.butter)}" ${STK}/>${V.lit(`<circle cx="100" cy="100" r="88" fill="${PAL.butter}"/>`)}
  <circle cx="100" cy="100" r="68" fill="#FFF6E6" ${STK}/><ellipse cx="84" cy="78" rx="30" ry="9" fill="#fff" opacity=".7" transform="rotate(-24 84 78)"/>
  ${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3+Math.PI/6,x=100+Math.cos(a)*78,y=100+Math.sin(a)*78;return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(i*60+30)})"><circle cx="-7" cy="0" r="10" fill="${V.ball('#E8E4F0')}" ${STK.replace('3.5','2.6')}/><circle cx="7" cy="0" r="10" fill="${V.ball('#E8E4F0')}" ${STK.replace('3.5','2.6')}/></g>`}).join('')}
  <path d="M60 112Q100 134 140 112" fill="none" stroke="${PAL.rose}" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`;
const bellSVG=(c)=>`<svg viewBox="0 0 200 200" style="overflow:visible">${V.ground(100,190,64,7)}
  <path d="M88 20Q88 8 100 8Q112 8 112 20V70H88Z" fill="${V.ball('#E2B98A')}" ${STK}/><rect x="84" y="62" width="32" height="12" rx="5" fill="${V.ball('#C99A6B')}" ${STK}/>
  ${bodyOf('M44 156Q40 84 100 76Q160 84 156 156Q172 160 174 174H26Q28 160 44 156Z',c||PAL.butter)}
  <path d="M50 150Q100 164 150 150" fill="none" stroke="${OL}" stroke-width="3" opacity=".45"/>${V.shine(74,110,10,26,-12)}
  <circle cx="100" cy="182" r="11" fill="${V.ball('#E9BF6A')}" ${STK}/></svg>`;
const xyloThumb=()=>`<svg viewBox="0 0 200 200" style="overflow:visible"><rect x="14" y="40" width="172" height="12" rx="6" fill="#E2B98A" stroke="${OL}" stroke-width="3"/><rect x="14" y="146" width="172" height="12" rx="6" fill="#E2B98A" stroke="${OL}" stroke-width="3"/>${[PAL.rose,PAL.peach,PAL.butter,PAL.sage,PAL.sky].map((c,i)=>`<rect x="${20+i*34}" y="${22+i*8}" width="28" height="${156-i*16}" rx="9" fill="${V.ball(c)}" ${STK}/>`).join('')}</svg>`;

/* =====================================================================================================================
   1. 탐험대 — 어디 있지?
   ===================================================================================================================== */
(()=>{
const id='explore',L=life(id);
PRG.register(id,{max:MAXLV,name:'탐험대'});
const S=mk(id,'탐험대'),{stage,tray,strip,sec}=S;
const G=M.Guide.make(sec,{say});

const FACE=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s||1})"><circle cx="-8" cy="0" r="3.6" fill="${OL}"/><circle cx="8" cy="0" r="3.6" fill="${OL}"/><circle cx="-6.8" cy="-1.3" r="1.2" fill="#fff"/><circle cx="9.2" cy="-1.3" r="1.2" fill="#fff"/><path d="M-4.5 6.5Q0 11 4.5 6.5" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="-15" cy="6" rx="4.6" ry="3" fill="${V.cheek(PAL.rose)}"/><ellipse cx="15" cy="6" rx="4.6" ry="3" fill="${V.cheek(PAL.rose)}"/></g>`;
const bd=(d,c)=>{const b=`<path d="${d}" fill="${V.ball(c)}" ${STK}/>`;return b+V.lit(b)};
const sv=(vb,x)=>`<svg viewBox="${vb}" style="overflow:visible">${x}</svg>`;
const tube=(d,c,w)=>`<path d="${d}" fill="none" stroke="${OL}" stroke-width="${w+5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ANI=(kind)=>({vb:[200,230],svg:()=>A.animal(kind,'happy')});
const ITEMS={
  fish:{ko:'물고기',en:'fish',vb:[100,100],svg:()=>sv('0 0 100 100',`<path d="M72 50L96 30Q101 50 96 70Z" fill="${V.ball('#EFA77C')}" ${STK}/>${bd('M8 50Q8 20 44 20Q76 22 84 50Q76 78 44 80Q8 80 8 50Z','#F4B98A')}<path d="M30 22Q36 8 52 12Q54 20 50 24" fill="${V.ball('#EF9E7A')}" ${STK}/><path d="M46 27Q54 50 46 73M60 31Q66 50 60 69" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>${V.shine(28,34,10,6,-20)}<circle cx="26" cy="46" r="5" fill="${OL}"/><circle cx="27.6" cy="44.4" r="1.7" fill="#fff"/><path d="M15 58Q22 65 29 58" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><ellipse cx="31" cy="60" rx="5" ry="3.2" fill="${V.cheek(PAL.rose)}"/>`)},
  crab:{ko:'게',en:'crab',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M30 66L12 78M34 72L20 88M70 66L88 78M66 72L80 88','#E58E80',6)}${tube('M30 52Q14 46 14 32M70 52Q86 46 86 32','#E58E80',7)}<circle cx="13" cy="26" r="13" fill="${V.ball('#EE9A8C')}" ${STK}/><circle cx="87" cy="26" r="13" fill="${V.ball('#EE9A8C')}" ${STK}/><path d="M9 17L14 27M91 17L86 27" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>${tube('M40 40L38 24M60 40L62 24','#E58E80',4)}<circle cx="38" cy="22" r="6" fill="#fff" ${STK}/><circle cx="62" cy="22" r="6" fill="#fff" ${STK}/><circle cx="38" cy="22" r="2.6" fill="${OL}"/><circle cx="62" cy="22" r="2.6" fill="${OL}"/>${bd('M16 62Q16 38 50 38Q84 38 84 62Q84 82 50 82Q16 82 16 62Z','#EE9A8C')}${V.shine(36,48,11,6,-15)}<path d="M42 62Q50 70 58 62" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><ellipse cx="30" cy="64" rx="5" ry="3.2" fill="${V.cheek(PAL.rose)}"/><ellipse cx="70" cy="64" rx="5" ry="3.2" fill="${V.cheek(PAL.rose)}"/>`)},
  turtle:{ko:'거북이',en:'turtle',vb:[100,100],svg:()=>sv('0 0 100 100',`${V.ground(50,90,38,5)}${tube('M26 78L22 90M62 80L66 90','#9CC893',9)}<circle cx="86" cy="56" r="13" fill="${V.ball('#A9CFA0')}" ${STK}/><path d="M12 80Q10 76 14 74" fill="none" ${STK}/>${bd('M10 74Q10 34 48 34Q82 34 84 74Q84 82 48 82Q10 82 10 74Z','#8FBF8F')}<path d="M34 40L30 74M62 40L66 74M18 60H80" fill="none" stroke="${OL}" stroke-width="2.6" opacity=".45"/>${V.shine(32,46,10,6,-20)}<circle cx="90" cy="52" r="3.6" fill="${OL}"/><circle cx="91.2" cy="50.8" r="1.2" fill="#fff"/><path d="M82 62Q87 66 92 62" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`)},
  octopus:{ko:'문어',en:'octopus',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M30 62Q18 82 32 90M44 68Q40 92 52 92M58 68Q62 92 72 90M72 62Q86 80 70 90','#B995D6',11)}${bd('M18 46Q18 12 50 12Q82 12 82 46Q82 72 50 72Q18 72 18 46Z','#C9A8E0')}${V.shine(36,28,11,7,-20)}${FACE(50,46,1.1)}`)},
  whale:{ko:'고래',en:'whale',vb:[100,100],svg:()=>sv('0 0 100 100',`<path d="M50 32Q46 18 36 14M50 32Q54 18 64 14" fill="none" stroke="${PAL.sky}" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="12" r="3.4" fill="${PAL.sky}" stroke="${OL}" stroke-width="1.6"/><circle cx="66" cy="12" r="3.4" fill="${PAL.sky}" stroke="${OL}" stroke-width="1.6"/>${bd('M6 62Q6 34 46 34Q80 34 90 58Q94 48 99 44Q101 60 94 70Q86 84 50 84Q10 84 6 62Z','#8FB8DE')}<path d="M14 66Q40 80 82 70Q74 82 50 84Q20 84 14 66Z" fill="#E8F2FA" opacity=".9"/>${V.shine(30,46,11,6,-20)}<circle cx="26" cy="58" r="4.6" fill="${OL}"/><circle cx="27.4" cy="56.6" r="1.6" fill="#fff"/><path d="M14 68Q22 74 30 68" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><ellipse cx="36" cy="68" rx="5" ry="3" fill="${V.cheek(PAL.rose)}"/>`)},
  starfish:{ko:'불가사리',en:'starfish',vb:[100,100],svg:()=>sv('0 0 100 100',`${V.ground(50,92,34,5)}${(()=>{const b=`<path d="M50 6L61 36L94 38L68 58L78 90L50 72L22 90L32 58L6 38L39 36Z" fill="${V.ball('#F4B98A')}" ${STK}/>`;return b+V.lit(b)})()}<circle cx="50" cy="26" r="2.4" fill="#fff" opacity=".8"/><circle cx="28" cy="44" r="2.4" fill="#fff" opacity=".8"/><circle cx="72" cy="44" r="2.4" fill="#fff" opacity=".8"/><circle cx="36" cy="72" r="2.4" fill="#fff" opacity=".8"/><circle cx="64" cy="72" r="2.4" fill="#fff" opacity=".8"/>${FACE(50,52,.9)}`)},
  bear:Object.assign({ko:'곰',en:'bear'},ANI('bear')),
  bunny:Object.assign({ko:'토끼',en:'bunny'},ANI('bunny')),
  bird:{ko:'새',en:'bird',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M42 82L40 92M58 82L60 92','#E8A66F',4)}<path d="M82 52L98 58L82 64Z" fill="#F2B48C" ${STK}/>${bd('M16 56Q16 18 52 18Q86 20 86 56Q86 84 52 84Q16 84 16 56Z','#F0D58A')}<path d="M34 54Q22 54 24 68Q34 76 46 66Q44 56 34 54Z" fill="${V.ball('#E9BF6A')}" ${STK}/>${V.shine(38,32,10,6,-20)}<circle cx="66" cy="46" r="4.6" fill="${OL}"/><circle cx="67.4" cy="44.6" r="1.6" fill="#fff"/><ellipse cx="72" cy="58" rx="5" ry="3.2" fill="${V.cheek(PAL.rose)}"/>`)},
  butterfly:{ko:'나비',en:'butterfly',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M50 34L40 12M50 34L60 12','#6E5348',2.4)}<circle cx="39" cy="11" r="3.4" fill="${OL}"/><circle cx="61" cy="11" r="3.4" fill="${OL}"/>${bd('M48 40Q16 10 8 38Q6 58 44 56Z','#C3B4E6')}${bd('M52 40Q84 10 92 38Q94 58 56 56Z','#C3B4E6')}${bd('M46 56Q18 60 20 82Q30 94 46 72Z','#E8A0AE')}${bd('M54 56Q82 60 80 82Q70 94 54 72Z','#E8A0AE')}<circle cx="24" cy="38" r="6" fill="#fff" opacity=".7"/><circle cx="76" cy="38" r="6" fill="#fff" opacity=".7"/>${bd('M45 38Q50 30 55 38L55 74Q50 82 45 74Z','#8A6A58')}<circle cx="48" cy="42" r="1.7" fill="#fff"/><circle cx="52" cy="42" r="1.7" fill="#fff"/>`)},
  mushroom:{ko:'버섯',en:'mushroom',vb:[100,100],svg:()=>sv('0 0 100 100',`${V.ground(50,92,34,5)}${bd('M34 56Q30 80 36 90H64Q70 80 66 56Z','#F8EBD3')}${bd('M6 56Q6 12 50 12Q94 12 94 56Q70 62 50 62Q30 62 6 56Z','#E8A0AE')}<circle cx="30" cy="34" r="7" fill="#fff" opacity=".85"/><circle cx="62" cy="28" r="6" fill="#fff" opacity=".85"/><circle cx="78" cy="46" r="5" fill="#fff" opacity=".85"/>${V.shine(26,22,9,5,-20)}${FACE(50,76,.8)}`)},
  flower:{ko:'꽃',en:'flower',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M50 46V94','#7FA978',5)}<path d="M52 78Q76 66 82 80Q64 90 52 78Z" fill="${V.ball(PAL.sage)}" ${STK}/>${[0,1,2,3,4].map(i=>`<ellipse cx="50" cy="22" rx="13" ry="19" transform="rotate(${i*72} 50 40)" fill="${V.ball(PAL.rose)}" ${STK}/>`).join('')}<circle cx="50" cy="40" r="14" fill="${V.ball(PAL.butter)}" ${STK}/>${FACE(50,40,.62)}`)},
  rocket:{ko:'로켓',en:'rocket',vb:[100,100],svg:()=>sv('0 0 100 100',`<path d="M42 82Q50 100 58 82Z" fill="${V.ball(PAL.butter)}" ${STK}/>${bd('M24 78L12 60Q10 54 16 54L32 58Z','#C3B4E6')}${bd('M76 78L88 60Q90 54 84 54L68 58Z','#C3B4E6')}${bd('M50 4Q74 22 72 56L70 82H30L28 56Q26 22 50 4Z','#F4EFE8')}<path d="M50 4Q62 12 67 28Q50 22 33 28Q38 12 50 4Z" fill="${V.ball('#E8A0AE')}" ${STK}/><circle cx="50" cy="48" r="12" fill="${V.ball(PAL.sky)}" ${STK}/>${V.shine(46,44,4,3,-20)}<path d="M30 70H70" stroke="${OL}" stroke-width="2.6" opacity=".4"/>`)},
  moon:{ko:'달',en:'moon',vb:[100,100],svg:()=>sv('0 0 100 100',`${bd('M50 8A42 42 0 1 0 50.1 8Z','#F0D58A')}<circle cx="72" cy="30" r="7" fill="#E6C778" stroke="${OL}" stroke-width="2" opacity=".9"/><circle cx="26" cy="72" r="6" fill="#E6C778" stroke="${OL}" stroke-width="2" opacity=".9"/><circle cx="74" cy="72" r="4.4" fill="#E6C778" stroke="${OL}" stroke-width="2" opacity=".9"/>${V.shine(32,28,9,6,-30)}${FACE(48,52,1.05)}`)},
  star:{ko:'별',en:'star',vb:[100,100],svg:()=>sv('0 0 100 100',`${(()=>{const b=`<path d="M50 4L62 36L96 38L70 60L79 94L50 75L21 94L30 60L4 38L38 36Z" fill="${V.ball('#F0D58A')}" ${STK}/>`;return b+V.lit(b)})()}${FACE(50,55,.95)}`)},
  planet:{ko:'행성',en:'planet',vb:[100,100],svg:()=>sv('0 0 100 100',`<path d="M4 54A46 11 0 0 1 96 54" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round" transform="rotate(-18 50 54)"/><path d="M4 54A46 11 0 0 1 96 54" fill="none" stroke="#F2B48C" stroke-width="5" stroke-linecap="round" transform="rotate(-18 50 54)"/>${bd('M50 20A30 30 0 1 0 50.1 20Z','#C3B4E6')}<path d="M24 46Q50 56 76 42M24 64Q50 74 76 60" fill="none" stroke="#fff" stroke-width="4" opacity=".4"/>${V.shine(38,36,9,6,-25)}${FACE(50,50,.85)}<path d="M4 54A46 11 0 0 0 96 54" fill="none" stroke="${OL}" stroke-width="9" stroke-linecap="round" transform="rotate(-18 50 54)"/><path d="M4 54A46 11 0 0 0 96 54" fill="none" stroke="#F2B48C" stroke-width="5" stroke-linecap="round" transform="rotate(-18 50 54)"/>`)},
  alien:{ko:'외계인',en:'alien',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M36 22L28 6M64 22L72 6','#7FB98A',3)}<circle cx="28" cy="6" r="5" fill="${V.ball(PAL.butter)}" ${STK}/><circle cx="72" cy="6" r="5" fill="${V.ball(PAL.butter)}" ${STK}/>${tube('M30 78L26 92M70 78L74 92','#7FB98A',5)}${bd('M12 50Q12 14 50 14Q88 14 88 50Q88 84 50 84Q12 84 12 50Z','#B8DCA0')}${V.shine(34,30,11,7,-20)}<ellipse cx="36" cy="48" rx="8" ry="11" fill="${OL}"/><ellipse cx="64" cy="48" rx="8" ry="11" fill="${OL}"/><circle cx="38.6" cy="43.6" r="2.6" fill="#fff"/><circle cx="66.6" cy="43.6" r="2.6" fill="#fff"/><path d="M42 68Q50 76 58 68" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`)},
  comet:{ko:'별똥별',en:'shooting star',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M70 30Q40 40 10 74','#F6E7B4',12)}${tube('M66 40Q44 56 24 86','#F0D58A',6)}<path d="M86 14L90 26L102 28L92 36L95 48L86 41L77 48L80 36L70 28L82 26Z" fill="${V.ball('#F0D58A')}" ${STK}/>${FACE(86,33,.5)}<circle cx="14" cy="38" r="2.6" fill="#fff"/><circle cx="40" cy="16" r="2.2" fill="#fff"/>`)},
  princess:Object.assign({ko:'공주님',en:'princess'},ANI('dolly')),
  crown:{ko:'왕관',en:'crown',vb:[100,100],svg:()=>sv('0 0 100 100',`${V.ground(50,90,36,5)}${bd('M12 78L8 30L32 50L50 18L68 50L92 30L88 78Z','#F0D58A')}<rect x="10" y="72" width="80" height="14" rx="5" fill="${V.ball('#E9BF6A')}" ${STK}/><circle cx="8" cy="28" r="5" fill="${PAL.rose}" ${STK}/><circle cx="50" cy="16" r="5.4" fill="${PAL.sky}" ${STK}/><circle cx="92" cy="28" r="5" fill="${PAL.rose}" ${STK}/><circle cx="30" cy="79" r="4" fill="${PAL.sky}" stroke="${OL}" stroke-width="2"/><circle cx="50" cy="79" r="4" fill="${PAL.rose}" stroke="${OL}" stroke-width="2"/><circle cx="70" cy="79" r="4" fill="${PAL.sky}" stroke="${OL}" stroke-width="2"/>${V.shine(32,52,8,5,-30)}`)},
  horse:Object.assign({ko:'말',en:'horse'},ANI('pony')),
  treasure:{ko:'보물 상자',en:'treasure chest',vb:[100,100],svg:()=>sv('0 0 100 100',`${V.ground(50,92,40,5)}<circle cx="32" cy="48" r="8" fill="${V.ball('#F0D58A')}" ${STK}/><circle cx="48" cy="44" r="8" fill="${V.ball('#F0D58A')}" ${STK}/><circle cx="64" cy="48" r="8" fill="${V.ball('#F0D58A')}" ${STK}/>${bd('M10 90V54H90V90Z','#C99A6B')}${bd('M10 56Q10 28 50 28Q90 28 90 56Z','#D6A878')}<path d="M32 28V90M68 28V90" stroke="#E9BF6A" stroke-width="7"/><path d="M32 28V90M68 28V90" stroke="${OL}" stroke-width="1.6" fill="none" opacity=".5"/><rect x="42" y="50" width="16" height="18" rx="4" fill="${V.ball('#F0D58A')}" ${STK}/><circle cx="50" cy="58" r="2.6" fill="${OL}"/>${V.shine(24,38,9,5,-20)}`)},
  key:{ko:'열쇠',en:'key',vb:[100,100],svg:()=>sv('0 0 100 100',`<g transform="rotate(-35 50 50)">${tube('M30 50H86M70 50V64M82 50V60','#E9BF6A',9)}<circle cx="24" cy="50" r="19" fill="${V.ball('#F0D58A')}" ${STK}/><circle cx="24" cy="50" r="8" fill="#F6F1EA" ${STK}/>${V.shine(16,42,7,4,-30)}</g><circle cx="78" cy="16" r="3" fill="${PAL.butter}"/><circle cx="88" cy="26" r="2.2" fill="${PAL.rose}"/>`)},
  wand:{ko:'요술봉',en:'magic wand',vb:[100,100],svg:()=>sv('0 0 100 100',`${tube('M26 90L62 44','#F2B48C',9)}<path d="M64 6L72 28L96 30L77 44L84 68L64 54L44 68L51 44L32 30L56 28Z" fill="${V.ball('#F0D58A')}" ${STK}/>${V.shine(58,26,7,5,-30)}<circle cx="18" cy="30" r="3.4" fill="${PAL.rose}"/><circle cx="90" cy="76" r="3" fill="${PAL.sky}"/><circle cx="30" cy="58" r="2.4" fill="${PAL.lilac}"/>`)}
};
/* the drawn scene behind each play, and the things that hide in it */
const R=i=>{const x=Math.sin(i*127.1+3.7)*43758.5453;return x-Math.floor(x)};
const COVER={
  seaweed:()=>sv('0 0 120 70',`<path d="M16 70Q4 40 20 14Q22 40 30 70Z" fill="${V.ball('#8FC9A0')}" ${STK}/><path d="M44 70Q34 34 52 8Q54 40 62 70Z" fill="${V.ball('#7DBB8E')}" ${STK}/><path d="M76 70Q70 40 86 18Q90 44 96 70Z" fill="${V.ball('#8FC9A0')}" ${STK}/><path d="M100 70Q98 50 110 36Q112 54 116 70Z" fill="${V.ball('#7DBB8E')}" ${STK}/>`),
  rock:()=>sv('0 0 120 70',`${bd('M4 70Q2 34 34 24Q56 14 82 26Q116 36 116 70Z','#B9C4D2')}<path d="M30 38Q44 30 58 36" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`),
  coral:()=>sv('0 0 120 70',`${tube('M30 70V40M30 52L16 36M30 46L44 30M80 70V34M80 48L66 30M80 42L96 24','#EFA0A8',9)}<circle cx="16" cy="34" r="6" fill="#F4B7BC" ${STK}/><circle cx="44" cy="28" r="6" fill="#F4B7BC" ${STK}/><circle cx="66" cy="28" r="6" fill="#F4B7BC" ${STK}/><circle cx="96" cy="22" r="6" fill="#F4B7BC" ${STK}/>`),
  bush:()=>sv('0 0 120 70',`${bd('M2 70Q0 40 24 36Q34 14 58 24Q84 10 100 34Q122 42 118 70Z','#9CC893')}<circle cx="34" cy="48" r="4" fill="${PAL.rose}"/><circle cx="82" cy="42" r="4" fill="${PAL.butter}"/><circle cx="62" cy="54" r="3.4" fill="${PAL.lilac}"/>`),
  stone:()=>sv('0 0 120 70',`${bd('M6 70Q4 38 36 30Q62 20 88 32Q116 42 114 70Z','#B8BFC8')}<path d="M34 42Q48 34 62 40" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`),
  blooms:()=>sv('0 0 120 70',`${bd('M4 70Q2 46 28 42Q40 26 62 34Q86 24 98 42Q120 48 116 70Z','#A9CFA0')}${[[26,44,PAL.rose],[56,34,PAL.butter],[86,40,PAL.rose],[98,54,PAL.lilac],[44,56,PAL.sky]].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="6.5" fill="${c}" ${STK.replace('3.5','2')}/><circle cx="${x}" cy="${y}" r="2.2" fill="#fff"/>`).join('')}`),
  puff:()=>sv('0 0 120 70',`<g fill="${V.ball('#CFC6EC')}" ${STK}><ellipse cx="34" cy="48" rx="30" ry="20"/><ellipse cx="68" cy="38" rx="34" ry="26"/><ellipse cx="94" cy="52" rx="24" ry="16"/></g><ellipse cx="60" cy="28" rx="14" ry="6" fill="#fff" opacity=".4"/>`),
  asteroid:()=>sv('0 0 120 70',`${bd('M6 66Q0 36 30 24Q60 14 90 28Q118 40 112 66Z','#A9A6C9')}<ellipse cx="40" cy="44" rx="9" ry="5" fill="#8F8CB4" stroke="${OL}" stroke-width="2"/><ellipse cx="76" cy="38" rx="7" ry="4" fill="#8F8CB4" stroke="${OL}" stroke-width="2"/>`),
  crater:()=>sv('0 0 120 70',`${bd('M2 70Q4 42 30 40Q60 22 92 40Q118 44 118 70Z','#B7B3D4')}<ellipse cx="42" cy="54" rx="12" ry="5" fill="#9B97C2" stroke="${OL}" stroke-width="2"/><ellipse cx="82" cy="52" rx="9" ry="4" fill="#9B97C2" stroke="${OL}" stroke-width="2"/>`),
  hedge:()=>sv('0 0 120 70',`${bd('M4 70V34Q4 22 18 22H102Q116 22 116 34V70Z','#8FBF86')}${[[22,40],[48,34],[74,42],[96,36],[34,56],[64,58],[90,54]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3.4" fill="#A9D49F" opacity=".9"/>`).join('')}`),
  pillar:()=>sv('0 0 120 70',`${bd('M10 70V24Q10 14 24 14H96Q110 14 110 24V70Z','#F2E3D0')}<path d="M34 14V70M60 14V70M86 14V70" stroke="#fff" stroke-width="5" opacity=".55"/>`)
};
const SCENES={
  sea:{ko:'바다',en:'Sea',items:['fish','crab','turtle','octopus','whale','starfish'],cover:['seaweed','rock','coral'],
    bg:(W,H)=>`<defs><linearGradient id="exsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDF1F6"/><stop offset=".22" stop-color="#B7E2EC"/><stop offset=".7" stop-color="#8CCADE"/><stop offset="1" stop-color="#76B8D2"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#exsea)"/>
      <path d="M0 ${H*.06}Q${W*.12} ${H*.03} ${W*.25} ${H*.06}T${W*.5} ${H*.06}T${W*.75} ${H*.06}T${W} ${H*.06}V0H0Z" fill="#EAF7FA"/>
      <g fill="#fff" opacity=".13"><path d="M${W*.1} 0L${W*.26} 0L${W*.12} ${H*.7}L${W*.02} ${H*.7}Z"/><path d="M${W*.48} 0L${W*.6} 0L${W*.54} ${H*.7}L${W*.4} ${H*.7}Z"/><path d="M${W*.78} 0L${W*.9} 0L${W*.98} ${H*.7}L${W*.84} ${H*.7}Z"/></g>
      ${Array.from({length:9},(_,i)=>`<circle cx="${W*(.08+R(i)*.84)}" cy="${H*(.16+R(i+20)*.6)}" r="${4+R(i+9)*7}" fill="none" stroke="#fff" stroke-width="2.4" opacity=".55"/>`).join('')}
      <g opacity=".75"><path d="M${W*.05} ${H*.9}Q${W*.01} ${H*.72} ${W*.07} ${H*.6}Q${W*.1} ${H*.75} ${W*.1} ${H*.9}Z" fill="#9ED3AE"/><path d="M${W*.93} ${H*.9}Q${W*.99} ${H*.7} ${W*.92} ${H*.56}Q${W*.88} ${H*.74} ${W*.88} ${H*.9}Z" fill="#9ED3AE"/></g>
      <path d="${hillD(W,H,H*.86,H*.035,1)}" fill="#F3E3BE"/><path d="${hillD(W,H,H*.94,H*.03,1.6)}" fill="#E9D4A6"/>
      <path d="M${W*.2} ${H*.93}q8 -14 18 0z" fill="#F7C9C4" stroke="${OL}" stroke-width="2"/><path d="M${W*.7} ${H*.95}q9 -15 20 0z" fill="#F7E1B8" stroke="${OL}" stroke-width="2"/>`,
    thumb:()=>`<svg viewBox="0 0 100 100"><defs><clipPath id="exct1"><circle cx="50" cy="50" r="46"/></clipPath></defs><g clip-path="url(#exct1)"><rect width="100" height="100" fill="#B7E2EC"/><rect y="62" width="100" height="40" fill="#F3E3BE"/><path d="M0 22Q12 14 25 22T50 22T75 22T100 22V0H0Z" fill="#EAF7FA"/><g transform="translate(26 30) scale(.5)">${inner(ITEMS.fish.svg())}</g><g transform="translate(52 50) scale(.34)">${inner(ITEMS.starfish.svg())}</g><circle cx="22" cy="62" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="80" cy="34" r="4" fill="none" stroke="#fff" stroke-width="2"/></g><circle cx="50" cy="50" r="46" fill="none" stroke="${OL}" stroke-width="3.5"/></svg>`},
  mountain:{ko:'산',en:'Mountain',items:['bear','bunny','bird','butterfly','mushroom','flower'],cover:['bush','stone','blooms'],
    bg:(W,H)=>`<defs><linearGradient id="exmt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CBE5F5"/><stop offset=".5" stop-color="#E8F1F0"/><stop offset="1" stop-color="#F6EEDC"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#exmt)"/>
      <circle cx="${W*.82}" cy="${H*.1}" r="${W*.1}" fill="#FBEFC5" opacity=".7"/><circle cx="${W*.82}" cy="${H*.1}" r="${W*.065}" fill="#F7E3A0"/>
      <g fill="#fff" opacity=".9"><ellipse cx="${W*.2}" cy="${H*.09}" rx="${W*.1}" ry="${H*.025}"/><ellipse cx="${W*.3}" cy="${H*.075}" rx="${W*.06}" ry="${H*.022}"/><ellipse cx="${W*.56}" cy="${H*.17}" rx="${W*.09}" ry="${H*.022}"/></g>
      <path d="M0 ${H*.5}L${W*.2} ${H*.2}L${W*.38} ${H*.46}L${W*.56} ${H*.26}L${W*.8} ${H*.5}L${W} ${H*.34}V${H}H0Z" fill="#BCC6DE"/>
      <path d="M${W*.2} ${H*.2}L${W*.27} ${H*.31}L${W*.2} ${H*.29}L${W*.15} ${H*.31}Z M${W*.56} ${H*.26}L${W*.63} ${H*.36}L${W*.56} ${H*.34}L${W*.5} ${H*.36}Z" fill="#fff" opacity=".95"/>
      <path d="M0 ${H*.62}Q${W*.25} ${H*.44} ${W*.5} ${H*.56}T${W} ${H*.5}V${H}H0Z" fill="#B9D6A6"/>
      <path d="${hillD(W,H,H*.74,H*.05,1.1)}" fill="#A6CD93"/><path d="${hillD(W,H,H*.88,H*.04,1.7)}" fill="#97C384"/>
      ${[[.1,.62,34],[.9,.58,30],[.78,.7,26]].map(([x,y,s])=>`<g transform="translate(${W*x} ${H*y})"><path d="M0 ${-s*1.3}L${s*.6} ${-s*.2}H${-s*.6}Z M0 ${-s*.8}L${s*.78} ${s*.4}H${-s*.78}Z" fill="#7FB17B" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><rect x="-3" y="${s*.4}" width="6" height="${s*.3}" fill="#9B6B4C"/></g>`).join('')}`,
    thumb:()=>`<svg viewBox="0 0 100 100"><defs><clipPath id="exct2"><circle cx="50" cy="50" r="46"/></clipPath></defs><g clip-path="url(#exct2)"><rect width="100" height="100" fill="#CBE5F5"/><circle cx="76" cy="26" r="11" fill="#F7E3A0"/><path d="M-4 70L28 28L50 58L70 36L104 72V104H-4Z" fill="#BCC6DE"/><path d="M28 28L36 41L28 38L21 41Z" fill="#fff"/><path d="M-4 78Q30 62 60 74T104 70V104H-4Z" fill="#A6CD93"/></g><circle cx="50" cy="50" r="46" fill="none" stroke="${OL}" stroke-width="3.5"/></svg>`},
  space:{ko:'우주',en:'Space',items:['rocket','moon','star','planet','alien','comet'],cover:['puff','asteroid','crater'],
    bg:(W,H)=>`<defs><linearGradient id="exsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4C86"/><stop offset=".55" stop-color="#6A68A2"/><stop offset="1" stop-color="#8479B4"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#exsp)"/>
      <ellipse cx="${W*.3}" cy="${H*.2}" rx="${W*.4}" ry="${H*.1}" fill="#8F86C4" opacity=".28"/><ellipse cx="${W*.78}" cy="${H*.55}" rx="${W*.38}" ry="${H*.09}" fill="#9A8FCB" opacity=".25"/>
      ${Array.from({length:34},(_,i)=>`<circle cx="${W*R(i)}" cy="${H*R(i+50)*.9}" r="${.8+R(i+99)*2}" fill="#fff" opacity="${(.45+R(i+7)*.45).toFixed(2)}"/>`).join('')}
      <g transform="translate(${W*.84} ${H*.13})"><ellipse rx="${W*.17}" ry="${W*.045}" fill="none" stroke="#E8C9A8" stroke-width="7" transform="rotate(-20)"/><circle r="${W*.09}" fill="#D9A7C0"/><path d="M${-W*.07} ${-W*.01}Q0 ${W*.03} ${W*.07} ${-W*.02}" fill="none" stroke="#fff" stroke-width="4" opacity=".35"/><ellipse rx="${W*.17}" ry="${W*.045}" fill="none" stroke="#E8C9A8" stroke-width="7" transform="rotate(-20)" clip-path="inset(50% 0 0 0)"/></g>
      <circle cx="${W*.1}" cy="${H*.52}" r="${W*.05}" fill="#B7D3E8" opacity=".85"/><circle cx="${W*.09}" cy="${H*.505}" r="${W*.014}" fill="#fff" opacity=".5"/>
      <path d="${hillD(W,H,H*.9,H*.035,1)}" fill="#A9A6C9"/><path d="${hillD(W,H,H*.96,H*.025,1.7)}" fill="#9794BA"/>
      <ellipse cx="${W*.3}" cy="${H*.94}" rx="${W*.06}" ry="${H*.012}" fill="#8F8CB4"/><ellipse cx="${W*.72}" cy="${H*.97}" rx="${W*.05}" ry="${H*.01}" fill="#8F8CB4"/>`,
    thumb:()=>`<svg viewBox="0 0 100 100"><defs><clipPath id="exct3"><circle cx="50" cy="50" r="46"/></clipPath></defs><g clip-path="url(#exct3)"><rect width="100" height="100" fill="#5C5B93"/><circle cx="22" cy="24" r="1.8" fill="#fff"/><circle cx="76" cy="16" r="1.4" fill="#fff"/><circle cx="58" cy="30" r="1.6" fill="#fff"/><circle cx="84" cy="50" r="1.6" fill="#fff"/><circle cx="14" cy="60" r="1.4" fill="#fff"/><ellipse cx="50" cy="42" rx="40" ry="9" fill="none" stroke="#E8C9A8" stroke-width="5" transform="rotate(-18 50 42)"/><circle cx="50" cy="42" r="22" fill="#D9A7C0" stroke="${OL}" stroke-width="3"/><path d="M-4 84Q30 74 60 82T104 80V104H-4Z" fill="#A9A6C9"/></g><circle cx="50" cy="50" r="46" fill="none" stroke="${OL}" stroke-width="3.5"/></svg>`},
  castle:{ko:'공주 모험',en:'Princess adventure',items:['princess','crown','horse','treasure','key','wand'],cover:['hedge','blooms','pillar'],
    bg:(W,H)=>`<defs><linearGradient id="excs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE2E8"/><stop offset=".5" stop-color="#EFE4F4"/><stop offset="1" stop-color="#E3EEF6"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#excs)"/>
      <g fill="#fff" opacity=".85"><ellipse cx="${W*.18}" cy="${H*.08}" rx="${W*.1}" ry="${H*.022}"/><ellipse cx="${W*.78}" cy="${H*.14}" rx="${W*.1}" ry="${H*.022}"/></g>
      <g transform="translate(${W*.5} ${H*.5})"><rect x="${-W*.3}" y="${-H*.16}" width="${W*.6}" height="${H*.2}" fill="#F4D3DB" stroke="${OL}" stroke-width="3"/>
        ${[-1,1].map(s=>`<rect x="${s*W*.3-W*.06}" y="${-H*.3}" width="${W*.12}" height="${H*.34}" fill="#F7DDE3" stroke="${OL}" stroke-width="3"/><path d="M${s*W*.3-W*.08} ${-H*.3}L${s*W*.3} ${-H*.4}L${s*W*.3+W*.08} ${-H*.3}Z" fill="#B9A8DE" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`).join('')}
        <rect x="${-W*.07}" y="${-H*.36}" width="${W*.14}" height="${H*.4}" fill="#FBE6EA" stroke="${OL}" stroke-width="3"/><path d="M${-W*.09} ${-H*.36}L0 ${-H*.47}L${W*.09} ${-H*.36}Z" fill="#E8A0AE" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M0 ${-H*.47}V${-H*.53}L${W*.07} ${-H*.505}L0 ${-H*.49}" fill="#F0D58A" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M${-W*.05} ${H*.04}V${-H*.04}Q0 ${-H*.09} ${W*.05} ${-H*.04}V${H*.04}Z" fill="#B9A8DE" stroke="${OL}" stroke-width="3"/></g>
      <path d="${hillD(W,H,H*.66,H*.04,1.2)}" fill="#CDE5B8"/><path d="${hillD(W,H,H*.8,H*.04,1.8)}" fill="#BCDCA6"/><path d="M${W*.42} ${H}Q${W*.5} ${H*.78} ${W*.5} ${H*.58}Q${W*.52} ${H*.78} ${W*.6} ${H}Z" fill="#F4E6CC"/>
      ${[[.08,.84,PAL.rose],[.92,.82,PAL.butter],[.2,.95,PAL.lilac],[.8,.96,PAL.rose]].map(([x,y,c])=>`<g transform="translate(${W*x} ${H*y})"><path d="M0 0V12" stroke="#7FA978" stroke-width="3" stroke-linecap="round"/><circle r="6" fill="${c}" stroke="${OL}" stroke-width="1.8"/><circle r="2.2" fill="#fff"/></g>`).join('')}`,
    thumb:()=>`<svg viewBox="0 0 100 100"><defs><clipPath id="exct4"><circle cx="50" cy="50" r="46"/></clipPath></defs><g clip-path="url(#exct4)"><rect width="100" height="100" fill="#FBE2E8"/><rect x="28" y="46" width="44" height="30" fill="#F4D3DB" stroke="${OL}" stroke-width="3"/><rect x="20" y="30" width="14" height="46" fill="#F7DDE3" stroke="${OL}" stroke-width="3"/><rect x="66" y="30" width="14" height="46" fill="#F7DDE3" stroke="${OL}" stroke-width="3"/><path d="M17 30L27 16L37 30Z M63 30L73 16L83 30Z" fill="#B9A8DE" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><path d="M43 76V62Q50 54 57 62V76Z" fill="#B9A8DE" stroke="${OL}" stroke-width="3"/><path d="M-4 82Q30 72 60 80T104 78V104H-4Z" fill="#BCDCA6"/></g><circle cx="50" cy="50" r="46" fill="none" stroke="${OL}" stroke-width="3.5"/></svg>`}
};

/* ---------- state ---------- */
let st=null,scene='',first=true;const LOG=[];
const LV=[{n:3,asks:2,cap:150,cover:0},{n:4,asks:3,cap:130,cover:0},{n:5,asks:3,cap:120,cover:2},{n:6,asks:3,cap:112,cover:3}];
const ICO=k=>ITEMS[k].svg();
const ar=k=>ITEMS[k].vb[1]/ITEMS[k].vb[0];

function layoutCells(P){
  const rows=P.n<=4?2:3,cells=[];for(let r=0;r<rows;r++)for(let c=0;c<2;c++)cells.push([c,r]);
  /* 3 things on a 2×2 board: any one corner stays free, but never a whole row */
  return{rows,cells:shuf(cells).slice(0,P.n)};
}
function build(){
  const W=stage.clientWidth,H=stage.clientHeight,sc=SCENES[st.scene];st.W=W;st.H=H;
  stage.innerHTML=`<svg class="ex-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${sc.bg(W,H)}</svg>`;
  st.items.forEach((o,i)=>{
    const d=document.createElement('div');d.className='ex-it';d.setAttribute('role','button');d.setAttribute('aria-label',ITEMS[o.k].ko);d.dataset.i=i;
    d.style.setProperty('--d',(-Math.random()*3).toFixed(2)+'s');d.innerHTML=ICO(o.k);stage.appendChild(d);o.el=d;
    if(o.cover){const c=document.createElement('div');c.className='ex-cover';c.innerHTML=COVER[o.cover]();stage.appendChild(c);o.cv=c}
  });
  placeAll();
}
function placeAll(){
  const W=stage.clientWidth,H=stage.clientHeight,P=st.P,rows=st.rows,cw=W/2,ch=H/rows;st.W=W;st.H=H;
  const s=Math.max(FOOT,Math.min(P.cap,cw-8,ch-8));st.s=s;
  st.items.forEach(o=>{
    const w=s,h=Math.min(ch-4,s*ar(o.k));
    const x=(o.c+.5)*cw+o.jx*Math.max(0,(cw-w)/2-4)*.8,y=(o.r+.5)*ch+o.jy*Math.max(0,(ch-h)/2-2)*.8;
    o.el.style.cssText=`left:${(x-w/2).toFixed(1)}px;top:${(y-h/2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--d:${o.el.style.getPropertyValue('--d')}`;
    if(o.cv){const cwid=w*1.18,chei=w*.64;o.cv.style.cssText=`left:${(x-cwid/2).toFixed(1)}px;top:${(y+h/2-chei*.66).toFixed(1)}px;width:${cwid.toFixed(1)}px;height:${chei.toFixed(1)}px`}
    o.cx=x;o.cy=y;o.w=w;o.h=h;
  });
}
function renderStrip(){M.Shell.steps(strip,st.asks.map(ICO),st.at)}
function renderTray(){
  const k=st.target||st.asks[0];
  tray.innerHTML=`<button type="button" class="ex-ask" aria-label="다시 듣기"><span class="ex-who">${A.animal('bunny','happy')}</span><span class="ex-bub">${ICO(k)}</span></button>`;
  const b=tray.querySelector('.ex-ask');b.onclick=()=>{actx();sayAsk();try{M.bounce(b)}catch(e){}};
  const sv2=b.querySelector('.ex-bub svg');if(sv2){sv2.classList.add('pop')}
}
function sayAsk(){const I=ITEMS[st.target];say(`${I.ko} 어디 있지?`,`Where is the ${I.en}?`)}
function aim(){
  if(!st||st.phase!=='find'){G.stop();return}
  G.start({type:'tap',wait:true,after:6500,ko:`${ITEMS[st.target].ko} 어디 있지?`,en:`Where is the ${ITEMS[st.target].en}?`,at:()=>{const o=st.items.find(x=>x.k===st.target);if(!o)return[0,0];const r=secXY(sec,stage,o.cx,o.cy);return[r[0]-8,r[1]-10]}});
}
function newRound(){
  L.begin();G.stop();
  const lv=lvOf(id),P=LV[lv-1],sc=SCENES[scene];
  const keys=shuf(sc.items).slice(0,P.n),asks=shuf(keys).slice(0,P.asks);
  const{rows,cells}=layoutCells(P),covers=new Set(shuf(keys.map((_,i)=>i)).slice(0,P.cover));
  st={lv,P,scene,rows,keys,asks,at:0,wrong:0,phase:'find',target:asks[0],items:keys.map((k,i)=>({k,c:cells[i][0],r:cells[i][1],jx:Math.random()*2-1,jy:Math.random()*2-1,
    cover:covers.has(i)?sc.cover[rand(sc.cover.length)]:'',found:false}))};
  LOG.push('round:'+scene+':'+asks.join(','));
  S.stars();build();renderStrip();renderTray();
  if(lv===4&&asks.length>1){const t=asks.map(k=>ITEMS[k].ko),e=asks.map(k=>ITEMS[k].en);
    say(`먼저 ${t[0]}, 그다음 ${t[1]}, 그다음 ${t[2]}! 찾아 보자!`,`First the ${e[0]}, then the ${e[1]}, then the ${e[2]}!`);L.later(sayAsk,5200)}
  else if(first){say(`${ITEMS[st.target].ko} 어디 있지?`,`Where is the ${ITEMS[st.target].en}?`);first=false}else sayAsk();
  aim();
}
function nextAsk(){
  if(!st)return;st.target=st.asks[st.at];st.phase='find';renderTray();sayAsk();aim();
}
function spark(o){
  const s=document.createElement('div');s.className='ex-star';s.style.left=o.cx+'px';s.style.top=(o.cy-o.h*.5)+'px';s.innerHTML=TW(PAL.butter);stage.appendChild(s);L.onEnd(()=>s.remove());setTimeout(()=>s.remove(),1700);
}
function tap(i){
  const o=st&&st.items[i];if(!o||o.found||st.phase==='done'||st.phase==='end')return;
  actx();G.touch();G.release();
  const I=ITEMS[o.k];
  if(st.phase==='find'&&o.k===st.target){
    o.found=true;o.el.classList.remove('wob','hint');o.el.classList.add('found');o.el.removeAttribute('role');
    st.phase='gap';G.stop();st.at++;LOG.push('found:'+o.k);sfx.pop();M.tone(660,.2,'triangle',.18);M.tone(880,.3,'sine',.14,.12);
    spark(o);renderStrip();
    say(`찾았다! ${I.ko}!`,`You found the ${I.en}!`);
    if(st.at>=st.asks.length){st.phase='end';L.later(done,1500)}else L.later(nextAsk,1900);
    return;
  }
  /* another thing: it wiggles and tells its name; the question comes again (no wrong answers) */
  o.el.classList.remove('wob');void o.el.offsetWidth;o.el.classList.add('wob');L.later(()=>o.el.classList.remove('wob'),600);
  sfx.soft();
  if(st.phase==='find'){
    st.wrong++;LOG.push('other:'+o.k);const T=ITEMS[st.target];
    say(`${I.ko}! ${T.ko} 어디 있지?`,`That is the ${I.en}! Where is the ${T.en}?`);
    if(st.wrong>=2){const t=st.items.find(x=>x.k===st.target);if(t&&!t.found){t.el.classList.add('hint');L.later(()=>t.el.classList.remove('hint'),4200)}}
    aim();
  }else say(`${I.ko}!`,`The ${I.en}!`);
}
function done(){
  st.phase='done';LOG.push('win');G.stop();sfx.ding();
  st.items.forEach((o,i)=>{o.el.style.setProperty('--d',(i*.12)+'s');o.el.classList.remove('found','wob','hint');o.el.classList.add('cheer')});
  burst(stage,L,st.W/2,st.H*.4);
  const p=praise();say(`다 찾았어! ${p[0]}`,`You found them all! ${p[1]}`);
  endRound(S,L,id,st.wrong,thing,newRound);
}
const sceneIcons=()=>['sea','mountain','space','castle'].map(k=>({svg:SCENES[k].thumb(),ko:SCENES[k].ko,en:SCENES[k].en,v:k}));
const manyArt=()=>`<svg viewBox="0 0 240 80" style="overflow:visible">${['fish','crab','turtle','starfish'].map((k,i)=>`<g transform="translate(${i*58} ${i%2?8:0}) scale(.56)">${inner(ITEMS[k].svg())}</g>`).join('')}</svg>`;
const hideArt=()=>`<svg viewBox="0 0 120 100" style="overflow:visible"><g transform="translate(14 0) scale(.9)">${inner(ITEMS.fish.svg())}</g><g transform="translate(0 42) scale(.9)">${inner(COVER.seaweed().replace(/^<svg[^>]*>/,'<svg>'))}</g></svg>`;
const seqArt=()=>`<svg viewBox="0 0 270 80" style="overflow:visible">${['crab','fish','whale'].map((k,i)=>`<g transform="translate(${i*90} 0) scale(.72)">${inner(ITEMS[k].svg())}</g>`).join('')}<path d="M70 40L84 40M160 40L174 40" stroke="${OL}" stroke-width="5" stroke-linecap="round"/></svg>`;
function thing(lv){
  if(lv===2)return{art:manyArt(),ko:'친구가 더 많아요!',en:'More friends!'};
  if(lv===3)return{art:hideArt(),ko:'숨은 친구를 찾아요!',en:'Find the hiding friends!'};
  return{art:seqArt(),ko:'차례로 찾아요!',en:'Find them one by one!'};
}
stage.addEventListener('pointerdown',e=>{
  if(!st)return;const el=e.target.closest('.ex-it');if(el){tap(+el.dataset.i);return}
  if(cur()===id&&(st.phase==='find'||st.phase==='gap')){   // a touch beside a thing: the nearest one answers (forgiving)
    const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=-1,bd2=1e9;
    st.items.forEach((o,i)=>{if(o.found)return;const d=Math.hypot(o.cx-x,o.cy-y);if(d<bd2){bd2=d;best=i}});
    if(best>=0&&bd2<st.s*.85)tap(best)}
});
function pickScene(it){if(cur()!==id)return;scene=it.v;first=true;newRound()}
games[id]={enter:()=>{L.begin();st=null;first=true;stage.innerHTML='';tray.innerHTML='';strip.innerHTML='';S.stars();const SHL=M.Shell;
    SHL.start(sec,sceneIcons(),pickScene,{ko:'어디로 탐험 갈까?',en:'Where shall we explore?'})},
  exit:()=>{L.begin();G.stop();sec.querySelectorAll(':scope > .sh-start').forEach(x=>x.remove());st=null},
  resize:()=>{if(st&&cur()===id)placeAll()}};
window.addEventListener('resize',()=>{if(st&&cur()===id)placeAll()});

M.__exLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__exp=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),its=st.items.map(o=>Object.assign({k:o.k,found:o.found,cover:o.cover,target:o.k===st.target},rectOf(o.el)));
  const top=Math.min(...its.map(i=>i.top)),bot=Math.max(...its.map(i=>i.bottom));
  return{lv:st.lv,scene:st.scene,phase:st.phase,wrong:st.wrong,asks:st.asks.slice(),at:st.at,target:st.target,items:its,log:LOG.slice(-40),stage:{left:r.left,top:r.top,width:r.width,height:r.height},
    ask:!!tray.querySelector('.ex-ask'),starsOn:sec.querySelectorAll('.ex-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ex-stars .mlp-star').length,
    moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id),content:{top,bottom:bot},covers:st.items.filter(o=>o.cover).length,
    hint:!!stage.querySelector('.ex-it.hint'),strip:strip.querySelectorAll('span').length};
};
M.__expDepth=()=>[1,2,3,4].map(lv=>{const steps=['장소 고르기','어디 있지? 듣기','그림 속에서 콕','찾았다! 뛰기'].concat(lv>=3?['가려진 것 찾기']:[]).concat(lv>=4?['차례로 기억하기']:[]);
  return{level:lv,processes:steps.length,steps,hands:['tap','choose'],someone:true,choice:true,ending:'모두 찾아 춤 · 별'}});
})();

/* =====================================================================================================================
   2. 리듬 박수 — 작은 음악회
   ===================================================================================================================== */
(()=>{
const id='rhythm',L=life(id);
PRG.register(id,{max:MAXLV,name:'리듬 박수'});
const S=mk(id,'리듬 박수'),{stage,tray,strip,sec}=S;
const G=M.Guide.make(sec,{say});
const css2=`
.rh-fr{position:absolute;z-index:3;pointer-events:none;transform-origin:50% 100%}
.rh-fr .rh-in{width:100%;height:100%}.rh-fr .rh-in svg{width:100%;height:100%;display:block;overflow:visible}
.rh-fr.bob{animation:rhbob .4s ease-out}
@keyframes rhbob{0%{transform:translateY(0) scale(1,1)}30%{transform:translateY(-6%) scale(.97,1.05)}100%{transform:translateY(0) scale(1,1)}}
.rh-inst{position:absolute;z-index:4;touch-action:none;-webkit-tap-highlight-color:transparent}
.rh-inst>svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 80%}
.rh-inst.hit>svg{animation:rhhit .24s ease-out}
.rh-inst.bell.hit>svg{transform-origin:50% 8%;animation:rhswing .5s ease-out}
.rh-inst .rh-stk{transition:transform .08s}
.rh-inst.hit.l .rh-stk-l{animation:rhstk .24s ease-out}
.rh-inst.hit.r .rh-stk-r{animation:rhstk2 .24s ease-out}
@keyframes rhhit{0%{transform:scale(1,1)}35%{transform:scale(1.05,.93)}100%{transform:scale(1,1)}}
@keyframes rhswing{0%{transform:rotate(0)}25%{transform:rotate(-9deg)}60%{transform:rotate(6deg)}100%{transform:rotate(0)}}
@keyframes rhstk{0%{transform:rotate(0)}40%{transform:rotate(14deg)}100%{transform:rotate(0)}}
@keyframes rhstk2{0%{transform:rotate(0)}40%{transform:rotate(-14deg)}100%{transform:rotate(0)}}
.rh-ring{position:absolute;z-index:3;pointer-events:none;border-radius:50%;border:7px solid ${PAL.rose};opacity:0;animation:rhring .7s ease-out forwards}
.rh-ring.demo{border-color:${PAL.butter}}
@keyframes rhring{0%{transform:scale(.55);opacity:.55}100%{transform:scale(1.25);opacity:0}}
.rh-line{position:relative;width:min(94%,380px);height:min(100%,112px);flex:none}
.rh-line .rh-track{position:absolute;left:0;right:0;top:50%;height:16px;margin-top:-8px;border-radius:8px;background:#EBDDCB;box-shadow:inset 0 2px 0 rgba(91,74,66,.12)}
.rh-lamp{position:absolute;top:50%;width:var(--lw,54px);height:var(--lw,54px);margin:calc(var(--lw,54px) / -2) 0 0 calc(var(--lw,54px) / -2);border-radius:50%;background:#F6EEE0;border:4px solid ${OL};box-sizing:border-box;box-shadow:0 4px 0 rgba(91,74,66,.16);transition:background .2s,transform .2s}
.rh-lamp.demo{background:${PAL.butter};transform:scale(1.18)}
.rh-lamp.done{background:${PAL.rose}}
.rh-lamp.now{box-shadow:0 4px 0 rgba(91,74,66,.16),0 0 0 5px color-mix(in srgb,${PAL.butter} 70%,#fff)}
`;
const st2=document.createElement('style');st2.textContent=css2;document.head.appendChild(st2);

/* what the little concert plays: times (seconds) of each clap; level 4: a phrase of an old tune (deg = which note) */
const PATS=[
  [[0,.9],[0,.7],[0,1.1]],
  [[0,.8,1.6],[0,.7,1.5],[0,1,1.7]],
  [[0,.85,1.2,2.05],[0,.4,.8,1.65],[0,.45,1.3,1.75]],
  [[0,.5,1,1.5,2,2.5,3].map((t,i)=>({t,d:[0,0,4,4,5,5,4][i]})),[0,.5,1,1.5,2,2.5,3].map((t,i)=>({t,d:[4,2,2,3,1,1,0][i]})),[0,.5,1,1.5,2,2.5,3].map((t,i)=>({t,d:[2,1,0,1,2,2,2][i]}))]
];
const norm=p=>p.map(b=>typeof b==='number'?{t:b,d:0}:b);
const INST={drum:{svg:()=>drumSVG(),ko:'북',en:'Drum'},tamb:{svg:tambSVG,ko:'탬버린',en:'Tambourine'},bell:{svg:()=>bellSVG(),ko:'종',en:'Bell'}};
let st=null,inst='drum',lastPat=-1,fr=[],frAl=[],first=true;const LOG=[];

function play(d,lv){const f=NOTES[d||0];if(inst==='drum')SND.drum(lv===4?d:0);else if(inst==='tamb')SND.tamb();else SND.bell(lv===4?f*2:784)}
function build(){
  const W=stage.clientWidth,H=stage.clientHeight;st.W=W;st.H=H;
  const fh=Math.min(H*.3,150),fw=fh*200/230,floor=H*.56;
  stage.innerHTML=`<svg class="ex-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="rhwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBEFE2"/><stop offset="1" stop-color="#F3DDCB"/></linearGradient><linearGradient id="rhfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBCFA6"/><stop offset="1" stop-color="#DDB784"/></linearGradient><linearGradient id="rhspot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#rhwall)"/>
    <path d="M${W*.34} 0H${W*.66}L${W*.95} ${floor}H${W*.05}Z" fill="url(#rhspot)" opacity=".5"/>
    <path d="M0 0H${W*.2}Q${W*.1} ${H*.28} ${W*.18} ${floor}H0Z" fill="${PAL.rose}" stroke="${OL}" stroke-width="3"/><path d="M${W} 0H${W*.8}Q${W*.9} ${H*.28} ${W*.82} ${floor}H${W}Z" fill="${PAL.rose}" stroke="${OL}" stroke-width="3"/>
    <path d="M${W*.05} 0Q${W*.02} ${H*.3} ${W*.07} ${floor}M${W*.12} 0Q${W*.07} ${H*.3} ${W*.12} ${floor}M${W*.95} 0Q${W*.98} ${H*.3} ${W*.93} ${floor}M${W*.88} 0Q${W*.93} ${H*.3} ${W*.88} ${floor}" fill="none" stroke="#fff" stroke-width="4" opacity=".35"/>
    <path d="M0 0V${H*.05}${Array.from({length:7},(_,i)=>`Q${W*(i+.5)/7} ${H*.095} ${W*(i+1)/7} ${H*.05}`).join('')}V0Z" fill="${PAL.lilac}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="0" y="${floor}" width="${W}" height="${H-floor}" fill="url(#rhfloor)"/><path d="M0 ${floor}H${W}" stroke="${OL}" stroke-width="3"/>
    ${[.62,.7,.79,.89].map(f=>`<path d="M0 ${H*f}H${W}" stroke="#B98C5C" stroke-width="2" opacity=".28"/>`).join('')}
    <rect x="${W*.34}" y="${floor-H*.015}" width="${W*.32}" height="${H*.07}" rx="8" fill="${V.ball('#F2E3D0')}" stroke="${OL}" stroke-width="3"/></svg>`;
  const cast=[['bear',.2,floor+H*.05,1],['dog',.8,floor+H*.05,1],['bunny',.5,floor+H*.03,1.12]];
  fr=cast.map(([k,x,fy,sc])=>{const w=fw*sc,h=fh*sc,d=document.createElement('div');d.className='rh-fr';d.style.cssText=`left:${(W*x-w/2).toFixed(1)}px;top:${(fy-h).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
    d.innerHTML=`<div class="rh-in">${friend(k,'happy')}</div>`;stage.appendChild(d);return d});
  frAl.forEach(a=>{try{a&&a.detach()}catch(e){}});frAl=fr.map((d,i)=>attachAlive(d.firstChild,cast[i][0]));
  const isz=Math.min(210,W*.62,H*.44),el=document.createElement('div');el.className='rh-inst '+inst;el.id='rhInst';
  el.style.cssText=`left:${((W-isz)/2).toFixed(1)}px;top:${(H*.78-isz/2).toFixed(1)}px;width:${isz.toFixed(1)}px;height:${isz.toFixed(1)}px`;
  el.innerHTML=INST[inst].svg();stage.appendChild(el);st.el=el;st.isz=isz;
}
function lampsHTML(){
  const p=st.pat,last=p[p.length-1].t||1,n=p.length,lw=n>5?40:n>3?48:56;
  return `<div class="rh-line" style="--lw:${lw}px"><div class="rh-track"></div>${p.map((b,i)=>{const x=n===1?50:6+(b.t/last)*88;return `<span class="rh-lamp" data-i="${i}" style="left:${x.toFixed(2)}%"></span>`}).join('')}</div>`;
}
const lamp=i=>tray.querySelector(`.rh-lamp[data-i="${i}"]`);
const clsLamp=(i,c,on)=>{const e=lamp(i);if(e)e.classList.toggle(c,on)};
function bobFriends(){fr.forEach((d,i)=>{d.classList.remove('bob');void d.offsetWidth;L.later(()=>d.classList.add('bob'),i*60)})}
function ring(demo){
  const r=document.createElement('div');r.className='rh-ring'+(demo?' demo':'');const s=st.isz*.9;
  r.style.cssText=`left:${st.W/2-s/2}px;top:${st.H*.78-s/2}px;width:${s}px;height:${s}px`;stage.appendChild(r);setTimeout(()=>r.remove(),800);
}
function hitAnim(side){const e=st.el;if(!e)return;e.classList.remove('hit','l','r');void e.offsetWidth;e.classList.add('hit',side?'l':'r');setTimeout(()=>e.classList&&e.classList.remove('hit'),600)}
function renderStrip(){const n=st.pat.length;M.Shell.steps(strip,Array.from({length:n},(_,i)=>`<svg viewBox="0 0 200 200">${inner(INST[inst].svg()).replace(/<g class="rh-stk[\s\S]*?<\/g>/g,'')}</svg>`),st.k)}
function newRound(){
  L.begin();G.stop();
  const lv=lvOf(id),list=PATS[lv-1];let i;do{i=rand(list.length)}while(i===lastPat&&list.length>1);lastPat=i;
  st={lv,pat:norm(list[i]),k:0,phase:'listen',wrong:0,last:0,inst,log:[]};
  LOG.push('round:'+lv+':'+st.pat.length);
  S.stars();build();tray.innerHTML=lampsHTML();renderStrip();
  if(first){say('토토가 먼저 쳐요. 잘 들어 봐!','Toto plays first. Listen!');first=false}else say('잘 들어 봐!','Listen!');
  L.later(demo,1700);
}
function demo(){
  if(!st)return;st.phase='listen';st.k=0;G.stop();renderStrip();
  tray.querySelectorAll('.rh-lamp').forEach(e=>e.classList.remove('done','demo','now'));
  st.pat.forEach((b,i)=>{
    L.later(()=>{if(!st)return;play(b.d,st.lv);hitAnim(i%2===0);ring(true);clsLamp(i,'demo',true);L.later(()=>clsLamp(i,'demo',false),380);bobFriends();LOG.push('demo:'+i)},b.t*1000);
  });
  const end=st.pat[st.pat.length-1].t*1000+1000;
  L.later(yourTurn,end);
}
function yourTurn(){
  if(!st)return;st.phase='play';st.k=0;st.last=performance.now();LOG.push('turn');
  tray.querySelectorAll('.rh-lamp').forEach(e=>e.classList.remove('done','demo'));clsLamp(0,'now',true);
  say('이제 같이 쳐 봐!','Now you play with me!');
  G.start({type:'tap',after:5000,ko:'큰 악기를 콕!',en:'Tap the big instrument!',at:()=>{if(!st||!st.el)return[0,0];const r=secXY(sec,stage,st.W/2,st.H*.78);return[r[0]-8,r[1]-10]}});
  watch();
}
function watch(){L.later(()=>{if(!st||st.phase!=='play')return;if(performance.now()-st.last>9000)again();else watch()},1500)}
function again(){say('한 번 더 같이!','Once more together!');LOG.push('again');demo()}
function tap(e){
  if(!st)return;actx();G.touch();G.release();
  const d=st.phase==='play'&&st.k<st.pat.length?st.pat[st.k].d:0;
  play(d,st.lv);hitAnim(Math.random()<.5);ring(false);bobFriends();
  if(st.phase!=='play')return;
  st.last=performance.now();const k=st.k;st.k++;LOG.push('tap:'+st.k);
  clsLamp(k,'now',false);clsLamp(k,'done',true);if(st.k<st.pat.length)clsLamp(st.k,'now',true);
  renderStrip();
  if(st.k>=st.pat.length)complete();
}
function complete(){
  st.phase='done';G.stop();LOG.push('win');sfx.ding();
  burst(stage,L,st.W/2,st.H*.45);
  L.later(()=>{frAl.forEach((a,i)=>{try{a&&a.setMood('happy');a.play(i===2?'hop':'dance',{n:2})}catch(e){}})},350);
  const p=praise();say(`같이 쳤어요! ${p[0]}`,`We played together! ${p[1]}`);
  L.later(()=>{
    bow();applause();LOG.push('bow');say('인사해요!','Time to bow!');
    endRound(S,L,id,st.wrong,thing,newRound);
  },1500);
}
function bow(){fr.forEach((d,i)=>{try{d.animate([{transform:'rotate(0) translateY(0)'},{transform:'rotate(24deg) translateY(4%)',offset:.4},{transform:'rotate(24deg) translateY(4%)',offset:.62},{transform:'rotate(0) translateY(0)'}],{duration:1500,delay:i*80,easing:'ease-in-out'})}catch(e){}})}
const dots=(xs)=>`<svg viewBox="0 0 280 60" style="overflow:visible"><path d="M14 30H266" stroke="#E4D6C2" stroke-width="12" stroke-linecap="round"/>${xs.map((x,i)=>`<circle cx="${x}" cy="30" r="${i===xs.length-1&&xs.length>3?17:19}" fill="${[PAL.rose,PAL.butter,PAL.sky,PAL.sage][i%4]}" stroke="${OL}" stroke-width="4"/>`).join('')}</svg>`;
function thing(lv){
  if(lv===2)return{art:dots([40,140,240]),ko:'세 번 쳐요!',en:'Three claps!'};
  if(lv===3)return{art:dots([30,120,160,250]),ko:'빠르게, 느리게!',en:'Quick and slow!'};
  return{art:`<svg viewBox="0 0 120 60" style="overflow:visible"><g transform="translate(0 4) scale(1.7)">${NOTE(PAL.rose).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(60 0) scale(1.7)">${NOTE(PAL.sky).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>`,ko:'노래에 맞춰 쳐요!',en:'Play along with a song!'};
}
stage.addEventListener('pointerdown',e=>{
  if(!st)return;const r=stage.getBoundingClientRect(),y=e.clientY-r.top;
  if(y>st.H*.5||e.target.closest('.rh-inst'))tap(e);
  else{actx();const i=Math.max(0,Math.min(2,Math.floor((e.clientX-r.left)/(st.W/3))));const d=fr[i];if(d){d.classList.remove('bob');void d.offsetWidth;d.classList.add('bob')}try{SND.clapSoft();frAl[i]&&frAl[i].play('hop',{n:1})}catch(_){}}
});
function pickInst(it){if(cur()!==id)return;inst=it.v;first=true;lastPat=-1;play(0,1);L.later(newRound,500)}
games[id]={enter:()=>{L.begin();st=null;first=true;stage.innerHTML='';tray.innerHTML='';strip.innerHTML='';S.stars();
    M.Shell.start(sec,['drum','tamb','bell'].map(k=>({svg:INST[k].svg(),ko:INST[k].ko,en:INST[k].en,v:k})),pickInst,{ko:'무엇으로 칠까?',en:'What shall we play?'})},
  exit:()=>{L.begin();G.stop();sec.querySelectorAll(':scope > .sh-start').forEach(x=>x.remove());frAl.forEach(a=>{try{a&&a.detach()}catch(e){}});frAl=[];st=null},
  resize:()=>{}};

M.__rhLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__rh=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),ir=rectOf(st.el),fs=fr.map(rectOf);
  return{lv:st.lv,phase:st.phase,k:st.k,n:st.pat.length,inst:st.inst,log:LOG.slice(-40),stage:{left:r.left,top:r.top,width:r.width,height:r.height},inst_:ir,friends:fs,
    lamps:[...tray.querySelectorAll('.rh-lamp')].map(l=>({done:l.classList.contains('done'),demo:l.classList.contains('demo'),w:l.getBoundingClientRect().width})),
    starsOn:sec.querySelectorAll('.ex-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ex-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id),
    content:{top:Math.min(...fs.map(f=>f.top),ir.top),bottom:ir.bottom},times:st.pat.map(b=>b.t)};
};
M.__rhDepth=()=>[1,2,3,4].map(lv=>{const steps=['악기 고르기','토토 치는 것 듣기(막대가 켜짐)','큰 악기를 같은 수만큼 콕','친구들과 인사'].concat(lv>=3?['빠르게·느리게 박자']:[]).concat(lv>=4?['노래 소리 따라']:[]);
  return{level:lv,processes:steps.length,steps,hands:['tap','choose'],someone:true,choice:true,ending:'친구들 춤 · 인사 · 박수'}});
})();

/* =====================================================================================================================
   3. 악기 — 실로폰 · 북 · 종
   ===================================================================================================================== */
(()=>{
const id='music',L=life(id);
PRG.register(id,{max:MAXLV,name:'악기'});
const S=mk(id,'악기'),{stage,tray,strip,sec}=S;
const G=M.Guide.make(sec,{say});
const css3=`
.mu-fr{position:absolute;z-index:3;pointer-events:none;transform-origin:50% 100%}
.mu-fr .rh-in{width:100%;height:100%}.mu-fr .rh-in svg{width:100%;height:100%;display:block;overflow:visible}
.mu-fr.bob{animation:rhbob .4s ease-out}
.mu-bar{position:absolute;z-index:4;touch-action:none;-webkit-tap-highlight-color:transparent}
.mu-bar svg{width:100%;height:100%;display:block;overflow:visible}
.mu-bar.hit svg{animation:muhit .26s ease-out}
.mu-bar.next:after{content:"";position:absolute;inset:-5px;border-radius:20px;border:6px solid ${PAL.butter};box-shadow:0 0 0 3px #fff;animation:munext 1.6s ease-in-out infinite;pointer-events:none}
@keyframes muhit{0%{transform:translateY(0) scale(1,1)}35%{transform:translateY(5%) scale(1.03,.96)}100%{transform:translateY(0) scale(1,1)}}
@keyframes munext{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.mu-big{position:absolute;z-index:4;touch-action:none;-webkit-tap-highlight-color:transparent}
.mu-big svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 80%}
.mu-big.hit svg{animation:rhhit .24s ease-out}
.mu-bell{position:absolute;z-index:4;touch-action:none;-webkit-tap-highlight-color:transparent}
.mu-bell svg{width:100%;height:100%;display:block;overflow:visible;transform-origin:50% 6%}
.mu-bell.hit svg{animation:rhswing .55s ease-out}
.mu-str{position:absolute;z-index:3;pointer-events:none}
`;
const st3=document.createElement('style');st3.textContent=css3;document.head.appendChild(st3);

const KEYSETS=[[0,2,4],[0,1,2,4,5],[0,1,2,3,4,5,6,7],[0,1,2,3,4,5,6,7]];
const KCOL=[PAL.rose,PAL.peach,PAL.butter,PAL.sage,PAL.sky,PAL.lilac,'#EFA7C4','#F4C59E'];
const BELLS=[[523.25,PAL.rose],[659.25,PAL.butter],[783.99,PAL.sky]];
const PHRASES=[[0,0,4,4,5,5,4],[4,2,2,3,1,1,0],[2,1,0,1,2,2,2]];
const FREE_N=8;
let st=null,inst='xylo',frs=[],frAl=[],bars=[],pi=-1,first=true;const LOG=[];

const frKinds=['bear','cat','dog'];
function bgSVG(W,H,shelfY){return `<svg class="ex-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="muwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3ECF8"/><stop offset="1" stop-color="#E9DFF0"/></linearGradient><linearGradient id="mufl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBCFA6"/><stop offset="1" stop-color="#DDB784"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#muwall)"/>
  ${[.12,.34,.56,.78].map(x=>`<circle cx="${W*x}" cy="${H*.045}" r="${W*.02}" fill="#fff" opacity=".6"/>`).join('')}
  <path d="M0 ${shelfY+H*.03}H${W}V${H}H0Z" fill="url(#mufl)"/>
  <rect x="${W*.03}" y="${shelfY}" width="${W*.94}" height="${H*.03}" rx="8" fill="${V.ball('#D9A877')}" stroke="${OL}" stroke-width="3"/>
  ${[.48,.64,.8,.94].map(f=>`<path d="M0 ${H*f}H${W}" stroke="#B98C5C" stroke-width="2" opacity=".25"/>`).join('')}</svg>`}
function frAdd(W,shelfY,fh){
  const fw=fh*200/230;
  frs=frKinds.map((k,i)=>{const x=[.2,.5,.8][i],d=document.createElement('div');d.className='mu-fr';d.style.cssText=`left:${(W*x-fw/2).toFixed(1)}px;top:${(shelfY+4-fh).toFixed(1)}px;width:${fw.toFixed(1)}px;height:${fh.toFixed(1)}px`;
    d.innerHTML=`<div class="rh-in">${friend(k,'happy')}</div>`;stage.appendChild(d);return d});
  frAl.forEach(a=>{try{a&&a.detach()}catch(e){}});frAl=frs.map((d,i)=>attachAlive(d.firstChild,frKinds[i]));
}
function build(){
  const W=stage.clientWidth,H=stage.clientHeight,shelfY=H*.33,fh=Math.min(shelfY-10,140);st.W=W;st.H=H;
  stage.innerHTML=bgSVG(W,H,shelfY);frAdd(W,shelfY,fh);bars=[];
  const zx=12,zy=shelfY+H*.065,zw=W-24,zh=H-zy-12;st.zone={x:zx,y:zy,w:zw,h:zh};
  if(inst==='xylo')buildXylo(zx,zy,zw,zh);else if(inst==='drum')buildDrum(zx,zy,zw,zh);else buildBells(zx,zy,zw,zh);
}
function buildXylo(zx,zy,zw,zh){
  const lv=st.lv,keys=KEYSETS[lv-1],n=keys.length,two=n===8,cols=two?4:n,rows=two?2:1,gapX=8,gapY=12,
    bw=(zw-gapX*(cols-1))/cols,rh=(zh-gapY*(rows-1))/rows;
  const rail=document.createElement('div');rail.className='mu-str';rail.style.cssText=`left:${zx}px;top:${zy}px;width:${zw}px;height:${zh}px`;
  rail.innerHTML=`<svg viewBox="0 0 ${zw} ${zh}" style="width:100%;height:100%;display:block;overflow:visible">${Array.from({length:rows},(_,r)=>[.2,.8].map(f=>`<rect x="-4" y="${(r*(rh+gapY)+rh*f-7).toFixed(1)}" width="${zw+8}" height="14" rx="7" fill="${V.ball('#D9A877')}" stroke="${OL}" stroke-width="3"/>`).join('')).join('')}</svg>`;
  stage.appendChild(rail);
  keys.forEach((kd,i)=>{
    const r=two?Math.floor(i/4):0,c=two?i%4:i,h=rh*(1-(two?.14:.24)*(two?c/3:i/Math.max(1,n-1))),x=zx+c*(bw+gapX),y=zy+r*(rh+gapY)+(rh-h)/2;
    const d=document.createElement('div');d.className='mu-bar';d.dataset.i=kd;d.setAttribute('aria-label','건반');d.style.cssText=`left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${bw.toFixed(1)}px;height:${h.toFixed(1)}px`;
    const col=KCOL[kd];
    d.innerHTML=`<svg viewBox="0 0 ${bw.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="none"><rect x="2" y="2" width="${(bw-4).toFixed(1)}" height="${(h-4).toFixed(1)}" rx="16" fill="${V.ball(col)}" ${STK}/><rect x="2" y="2" width="${(bw-4).toFixed(1)}" height="${(h-4).toFixed(1)}" rx="16" fill="${V.over()}"/><rect x="${(bw*.2).toFixed(1)}" y="12" width="${(bw*.14).toFixed(1)}" height="${(h-44).toFixed(1)}" rx="${(bw*.07).toFixed(1)}" fill="#fff" opacity=".32"/><circle cx="${(bw/2).toFixed(1)}" cy="22" r="5.5" fill="${OL}" opacity=".3"/><circle cx="${(bw/2).toFixed(1)}" cy="${(h-22).toFixed(1)}" r="5.5" fill="${OL}" opacity=".3"/></svg>`;
    stage.appendChild(d);bars.push({el:d,i:kd,x,y,w:bw,h,col});
  });
}
function buildDrum(zx,zy,zw,zh){
  const s=Math.min(zw*.96,zh*.98,320),d=document.createElement('div');d.className='mu-big drum';d.dataset.n='drum';d.setAttribute('aria-label','북');
  d.style.cssText=`left:${(zx+(zw-s)/2).toFixed(1)}px;top:${(zy+(zh-s)/2).toFixed(1)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px`;d.innerHTML=drumSVG();stage.appendChild(d);
  bars.push({el:d,i:0,x:zx+(zw-s)/2,y:zy+(zh-s)/2,w:s,h:s,drum:true});
}
function buildBells(zx,zy,zw,zh){
  const bw=Math.min(zw*.4,160),bh=bw,top=zy+zh*.22,rail=document.createElement('div');rail.className='mu-str';
  rail.style.cssText=`left:${zx}px;top:${zy}px;width:${zw}px;height:${zh}px`;
  const ry=zh*.2;
  rail.innerHTML=`<svg viewBox="0 0 ${zw} ${zh}" style="width:100%;height:100%;display:block;overflow:visible"><rect x="${zw*.04}" y="${ry}" width="${zw*.92}" height="16" rx="8" fill="${V.ball('#D9A877')}" stroke="${OL}" stroke-width="3"/><rect x="${zw*.04}" y="${ry}" width="14" height="${zh*.74}" rx="7" fill="${V.ball('#C99A6B')}" stroke="${OL}" stroke-width="3"/><rect x="${zw*.96-14}" y="${ry}" width="14" height="${zh*.74}" rx="7" fill="${V.ball('#C99A6B')}" stroke="${OL}" stroke-width="3"/></svg>`;
  stage.appendChild(rail);
  BELLS.forEach(([f,c],i)=>{
    const x=zx+zw*(.5+(i-1)*.325)-bw/2,y=zy+ry+14,sz=Math.min(bw,zh*.62),d=document.createElement('div');d.className='mu-bell';d.dataset.n='bell'+i;d.setAttribute('aria-label','종');
    d.style.cssText=`left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${bw.toFixed(1)}px;height:${bw.toFixed(1)}px`;d.innerHTML=bellSVG(c);stage.appendChild(d);
    bars.push({el:d,i,x,y,w:bw,h:bw,bell:true,f,col:c});
  });
}
function renderTray(){
  tray.innerHTML='';
  [['xylo',xyloThumb(),'실로폰','Xylophone'],['drum',drumSVG(),'북','Drum'],['bells',bellSVG(),'종','Bells']].forEach(([k,svg,ko,en])=>{
    const b=document.createElement('button');b.type='button';b.className='ex-card'+(k===inst?' sel':'');b.dataset.v=k;b.setAttribute('aria-label',ko);b.innerHTML=svg;
    b.onclick=()=>{actx();G.touch();G.release();sfx.pop();say(ko,en);if(inst!==k){inst=k;st.taps=0;st.phase='free';st.si=0;rebuild()}};tray.appendChild(b)});
}
function seqOn(){return st&&st.lv===4&&inst==='xylo'}
function renderStrip(){
  const n=seqOn()?st.seq.length:FREE_N,at=seqOn()?st.si:st.taps;
  M.Shell.steps(strip,Array.from({length:n},(_,i)=>NOTE(KCOL[seqOn()?st.seq[i]:i%8])),at);
}
function markNext(){
  bars.forEach(b=>b.el.classList.remove('next'));
  if(!seqOn()||st.phase!=='free')return;
  const b=bars.find(x=>x.i===st.seq[st.si]);if(b)b.el.classList.add('next');
  G.start({type:'tap',after:5000,ko:'빛나는 건반을 콕!',en:'Tap the glowing key!',at:()=>{const b2=bars.find(x=>x.i===st.seq[st.si]);if(!b2)return[0,0];const r=secXY(sec,stage,b2.x+b2.w/2,b2.y+b2.h/2);return[r[0]-8,r[1]-10]}});
}
function rebuild(){
  G.stop();st.lv=lvOf(id);build();renderTray();renderStrip();markNext();
  if(!seqOn()&&inst==='xylo'&&!st.said){st.said=true}
}
function newRound(){
  const lv=lvOf(id);
  if(!st){st={lv,taps:0,si:0,phase:'free',wrong:0,seq:[],said:false};L.begin();S.stars();build();renderTray()}
  else{const ch=st.lv!==lv;st.lv=lv;st.taps=0;st.si=0;st.phase='free';st.wrong=0;S.stars();if(ch)build();renderTray()}
  if(lv===4&&inst==='xylo'){let i;do{i=rand(PHRASES.length)}while(i===pi&&PHRASES.length>1);pi=i;st.seq=PHRASES[i].slice()}
  LOG.push('round:'+lv+':'+inst);renderStrip();markNext();
  if(first){say('두드려 봐! 소리가 나요.','Tap it! Make music!');first=false}
  else if(seqOn())say('빛나는 건반을 눌러 봐!','Tap the glowing key!');
}
function hit(b,e){
  const sc=st;actx();G.touch();G.release();
  const el=b.el;el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),600);
  let fxc=PAL.butter,note=null;
  if(inst==='xylo'){SND.xylo(NOTES[b.i]);fxc=b.col;note=b.i}
  else if(inst==='drum'){const r=el.getBoundingClientRect(),dx=Math.hypot(e.clientX-(r.left+r.width/2),(e.clientY-(r.top+r.height*.4))*1.6)/(r.width/2);SND.drum(Math.min(6,Math.round(dx*6)));note=0}
  else{SND.bell(b.f);fxc=b.col;note=b.i}
  const sr=stage.getBoundingClientRect();fx(stage,L,NOTE(fxc),b.x+b.w/2,Math.max(24,b.y+(b.bell?b.h*.2:10)),(Math.random()-.5)*30,-46,900);
  const fi=Math.floor(Math.random()*3),f=frs[fi];if(f){f.classList.remove('bob');void f.offsetWidth;f.classList.add('bob');try{frAl[fi]&&frAl[fi].play('hop',{n:1})}catch(_){}}
  LOG.push('hit:'+inst+':'+note);
  if(sc.phase!=='free')return;
  if(seqOn()){
    if(b.i===sc.seq[sc.si]){sc.si++;renderStrip();if(sc.si>=sc.seq.length){finish();return}markNext()}
  }else{sc.taps++;renderStrip();if(sc.taps>=FREE_N)finish()}
}
function finish(){
  st.phase='cheer';G.stop();bars.forEach(b=>b.el.classList.remove('next'));LOG.push('win');sfx.ding();
  burst(stage,L,st.W/2,st.H*.42);
  L.later(()=>{frAl.forEach((a,i)=>{try{a&&a.setMood('happy');a.play(i===1?'hop':'dance',{n:2})}catch(e){}})},300);
  const p=praise();say(`멋진 연주! ${p[0]}`,`What a concert! ${p[1]}`);
  endRound(S,L,id,0,thing,newRound);
}
const miniX=n=>`<svg viewBox="0 0 200 200" style="overflow:visible"><rect x="10" y="44" width="180" height="12" rx="6" fill="#E2B98A" stroke="${OL}" stroke-width="3"/><rect x="10" y="144" width="180" height="12" rx="6" fill="#E2B98A" stroke="${OL}" stroke-width="3"/>${Array.from({length:n},(_,i)=>{const w=180/n-5;return `<rect x="${12+i*(w+5)}" y="${20+i*(n>5?4:8)}" width="${w}" height="${160-i*(n>5?8:16)}" rx="8" fill="${V.ball(KCOL[i%8])}" ${STK}/>`}).join('')}</svg>`;
function thing(lv){
  if(lv===2)return{art:miniX(5),ko:'건반이 다섯 개!',en:'Five keys!'};
  if(lv===3)return{art:miniX(8),ko:'건반이 여덟 개!',en:'Eight keys!'};
  return{art:`<svg viewBox="0 0 200 200" style="overflow:visible">${miniX(5).replace(/^<svg[^>]*>|<\/svg>$/g,'')}<g transform="translate(120 4) scale(3)">${NOTE(PAL.butter).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>`,ko:'빛나는 건반을 따라 쳐요!',en:'Follow the glowing keys!'};
}
/* the nearest bar to a point (forgiving: a touch between two bars plays the closer one) */
function barAt(x,y){
  const r=stage.getBoundingClientRect(),px=x-r.left,py=y-r.top;let best=null,bd=1e9;
  bars.forEach(b=>{const inx=px>=b.x&&px<=b.x+b.w,iny=py>=b.y&&py<=b.y+b.h;const d=(inx&&iny)?0:Math.hypot(Math.max(b.x-px,0,px-b.x-b.w),Math.max(b.y-py,0,py-b.y-b.h));if(d<bd){bd=d;best=b}});
  return bd<(inst==='xylo'?14:30)?best:null;
}
const last={};
stage.addEventListener('pointerdown',e=>{if(!st)return;const b=barAt(e.clientX,e.clientY);last[e.pointerId]=b;if(b)hit(b,e)});
stage.addEventListener('pointermove',e=>{if(!st||inst!=='xylo'||!(e.pointerId in last)||e.buttons===0&&e.pointerType==='mouse')return;const b=barAt(e.clientX,e.clientY);if(b&&b!==last[e.pointerId]){last[e.pointerId]=b;hit(b,e)}});
['pointerup','pointercancel'].forEach(ev=>stage.addEventListener(ev,e=>{delete last[e.pointerId]}));
games[id]={enter:()=>{L.begin();st=null;first=true;inst='xylo';pi=-1;stage.innerHTML='';tray.innerHTML='';strip.innerHTML='';requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();G.stop();frAl.forEach(a=>{try{a&&a.detach()}catch(e){}});frAl=[];st=null},
  resize:()=>{if(st&&cur()===id){build();markNext()}}};
window.addEventListener('resize',()=>{if(st&&cur()===id){build();markNext()}});

M.__muLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf(id)};
M.__muInst=k=>{inst=k;return inst};
M.__mu=()=>{
  if(!st)return{lv:lvOf(id),phase:'',log:LOG.slice()};
  const r=stage.getBoundingClientRect(),bs=bars.map(b=>Object.assign({i:b.i},rectOf(b.el))),fs=frs.map(rectOf);
  const top=Math.min(...fs.map(f=>f.top),...bs.map(b=>b.top)),bot=Math.max(...bs.map(b=>b.bottom));
  return{lv:st.lv,inst,phase:st.phase,taps:st.taps,si:st.si,seq:st.seq.slice(),next:bars.findIndex(b=>b.el.classList.contains('next')),nextI:(()=>{const b=bars.find(x=>x.el.classList.contains('next'));return b?b.i:-1})(),
    bars:bs,friends:fs,stage:{left:r.left,top:r.top,width:r.width,height:r.height},log:LOG.slice(-60),
    cards:[...tray.querySelectorAll('.ex-card')].map(c=>Object.assign({v:c.dataset.v,sel:c.classList.contains('sel')},rectOf(c))),
    starsOn:sec.querySelectorAll('.ex-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.ex-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),progress:PRG.get(id),content:{top,bottom:bot}};
};
M.__muDepth=()=>[1,2,3,4].map(lv=>{const steps=['악기 고르기(카드)','두드려 소리 내기','친구들이 반응'].concat(lv>=2?['건반 늘어남']:[]).concat(lv>=4?['빛나는 건반 따라 치기']:[]);
  return{level:lv,processes:steps.length,steps,hands:['tap','glide'],someone:true,choice:true,ending:'친구들 춤 · 별'}});
})();

})();
