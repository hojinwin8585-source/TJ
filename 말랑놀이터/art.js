/* 말랑 놀이터 · 그림 도구 (직접 그린 SVG 캐릭터·음식·도구·건물)
   모든 그림은 이 앱을 위해 새로 그린 것입니다. */
(()=>{
'use strict';
const OL='#5B3A29';           // 공통 외곽선 색
const S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
let gid=0;const uid=p=>p+(++gid);

/* seeded random so a pizza looks the same every time it is redrawn */
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
/* organic closed shape */
function blob(cx,cy,r,jit,n,seed){
  const R=rng(seed),pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=r*(1+(R()-.5)*jit);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}
  let d='';for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];d+=(i===0?`M${((pts[n-1][0]+p[0])/2).toFixed(1)} ${((pts[n-1][1]+p[1])/2).toFixed(1)}`:'')+`Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`}
  return d+'Z';
}

/* =========================== CHARACTERS ===========================
   kind: bunny | bear | cat | dog   mood: idle | happy | yum | wow | sleepy | think
   viewBox 0 0 200 230 */
const KINDS={
  bunny:{ko:'토토',body:'#FFF9F2',edge:'#FFDCCB',dark:'#F3DCC8',inner:'#FFB3C6',cheek:'#FF86A8'},
  bear:{ko:'보리',body:'#DDA574',edge:'#B97C4B',dark:'#A86E43',inner:'#F9E2C6',cheek:'#FF8672'},
  cat:{ko:'모모',body:'#FFC878',edge:'#F59A38',dark:'#EE8F32',inner:'#FFEFD8',cheek:'#FF8585'},
  dog:{ko:'콩이',body:'#FFFFFF',edge:'#EADFD5',dark:'#B98154',inner:'#FCF1E6',cheek:'#FF94AC'}
};
/* big head, big sparkly eyes, rosy cheeks, soft shading. opt: chef, apron, bow, wave, lash */
function animal(kind='bunny',mood='idle',opt={}){
  const k=KINDS[kind]||KINDS.bunny,id=uid('an'),c=`url(#${id}b)`,EYE='#4A2E20';let s='';
  s+=`<defs><radialGradient id="${id}b" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="${k.body}"/><stop offset=".62" stop-color="${k.body}"/><stop offset="1" stop-color="${k.edge}"/></radialGradient>
    <radialGradient id="${id}c"><stop offset="0" stop-color="${k.cheek}" stop-opacity=".95"/><stop offset=".6" stop-color="${k.cheek}" stop-opacity=".55"/><stop offset="1" stop-color="${k.cheek}" stop-opacity="0"/></radialGradient></defs>`;
  s+=`<ellipse cx="100" cy="225" rx="58" ry="6" fill="rgba(91,58,41,.16)"/>`;
  /* ears behind the head */
  if(kind==='bunny')s+=`<g class="ears"><ellipse cx="72" cy="36" rx="19" ry="44" fill="${c}" ${S} transform="rotate(-10 72 36)"/><ellipse cx="72" cy="40" rx="9" ry="31" fill="${k.inner}" transform="rotate(-10 72 40)"/>
    <ellipse cx="128" cy="36" rx="19" ry="44" fill="${c}" ${S} transform="rotate(12 128 36)"/><ellipse cx="128" cy="40" rx="9" ry="31" fill="${k.inner}" transform="rotate(12 128 40)"/></g>`;
  if(kind==='bear')s+=`<circle cx="42" cy="50" r="25" fill="${c}" ${S}/><circle cx="42" cy="52" r="13" fill="${k.inner}"/><circle cx="158" cy="50" r="25" fill="${c}" ${S}/><circle cx="158" cy="52" r="13" fill="${k.inner}"/>`;
  if(kind==='cat')s+=`<path d="M36 74L44 12L90 44Z" fill="${c}" ${S}/><path d="M49 58L52 30L74 46Z" fill="${k.inner}"/><path d="M164 74L156 12L110 44Z" fill="${c}" ${S}/><path d="M151 58L148 30L126 46Z" fill="${k.inner}"/>`;
  /* body, feet, arms */
  s+=`<ellipse cx="78" cy="220" rx="17" ry="9" fill="${c}" ${S}/><ellipse cx="122" cy="220" rx="17" ry="9" fill="${c}" ${S}/>`;
  s+=`<ellipse cx="100" cy="188" rx="48" ry="38" fill="${c}" ${S}/><ellipse cx="100" cy="196" rx="28" ry="22" fill="${k.inner}" opacity=".92"/>`;
  if(opt.apron)s+=`<path d="M72 164H128L134 220Q100 228 66 220Z" fill="${opt.apron}" ${S}/><rect x="88" y="184" width="24" height="16" rx="5" fill="#fff" opacity=".75"/><path d="M92 172c-5-6-13 1-6 7l6 5 6-5c7-6-1-13-6-7z" fill="#fff" opacity=".9" transform="translate(8 0)"/>`;
  s+=`<ellipse cx="52" cy="182" rx="13" ry="21" fill="${c}" ${S} transform="rotate(28 52 182)"/><g${opt.wave?' class="wave"':''}><ellipse cx="148" cy="182" rx="13" ry="21" fill="${c}" ${S} transform="rotate(-28 148 182)"/></g>`;
  /* head */
  s+=`<circle cx="100" cy="100" r="70" fill="${c}" ${S}/><ellipse cx="68" cy="56" rx="25" ry="13" fill="#fff" opacity=".38" transform="rotate(-28 68 56)"/>`;
  if(kind==='cat')s+=`<path d="M100 32v15M84 35l3 13M116 35l-3 13" stroke="${k.dark}" stroke-width="5.5" stroke-linecap="round"/>`;
  if(kind==='dog')s+=`<ellipse cx="128" cy="92" rx="21" ry="24" fill="${k.dark}" opacity=".55"/><path d="M36 68Q16 108 40 140Q58 120 58 78Z" fill="${k.dark}" ${S}/><path d="M164 68Q184 108 160 140Q142 120 142 78Z" fill="${k.dark}" ${S}/>`;
  if(kind==='bunny')s+=`<path d="M90 36q10-12 20 0" stroke="${k.inner}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(kind==='bear'||kind==='dog')s+=`<ellipse cx="100" cy="127" rx="31" ry="23" fill="${k.inner}"/>`;else s+=`<ellipse cx="100" cy="127" rx="25" ry="17" fill="#fff" opacity=".5"/>`;
  s+=`<circle cx="52" cy="124" r="18" fill="url(#${id}c)"/><circle cx="148" cy="124" r="18" fill="url(#${id}c)"/>`;
  /* eyes */
  const eye=(x,out)=>{
    const lash=(opt.bow||opt.lash)?`<path d="M${x+out*11} ${92}l${out*7} -5M${x+out*8} ${87}l${out*5} -7" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`:'';
    if(mood==='happy'||mood==='yum')return `<path d="M${x-12} 104Q${x} 86 ${x+12} 104" stroke="${EYE}" stroke-width="5.5" fill="none" stroke-linecap="round"/>${lash}`;
    if(mood==='sleepy')return `<path d="M${x-11} 100Q${x} 108 ${x+11} 100" stroke="${EYE}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    const w=mood==='wow',rx=w?13:11.5,ry=w?15.5:13.5;
    return `<g class="eye"><ellipse cx="${x}" cy="100" rx="${rx}" ry="${ry}" fill="${EYE}"/><ellipse cx="${x}" cy="${105}" rx="${rx*.62}" ry="${ry*.5}" fill="#8A5638"/>
      <circle cx="${x+4}" cy="${94}" r="${w?5.6:4.8}" fill="#fff"/><circle cx="${x-4.5}" cy="${106}" r="${w?2.8:2.3}" fill="#fff" opacity=".95"/></g>${lash}`;
  };
  s+=`<g class="eyes">${eye(74,-1)}${eye(126,1)}</g>`;
  if(mood==='think')s+=`<path d="M60 80l20-5M140 80l-20-5" stroke="${EYE}" stroke-width="4" stroke-linecap="round"/>`;
  /* nose and mouth */
  const big=kind==='bear'||kind==='dog';
  s+=`<ellipse cx="100" cy="116" rx="${big?9:6}" ry="${big?6.5:4.5}" fill="${big?EYE:'#FF7FA2'}"/>${big?'<ellipse cx="97" cy="114" rx="3" ry="1.6" fill="#fff" opacity=".6"/>':''}`;
  if(mood==='yum')s+=`<g class="chew"><path d="M84 124Q100 150 116 124Z" fill="#B8474B" ${S}/><path d="M91 134Q100 146 109 134Q100 129 91 134Z" fill="#FF8FA3"/></g>`;
  else if(mood==='wow')s+=`<ellipse cx="100" cy="135" rx="8.5" ry="10.5" fill="#B8474B" ${S}/>`;
  else if(mood==='happy')s+=`<path d="M82 123Q100 150 118 123Z" fill="#B8474B" ${S}/><path d="M90 134Q100 146 110 134Q100 129 90 134Z" fill="#FF8FA3"/>`;
  else s+=`<path d="M88 123q6 9 12 0q6 9 12 0" stroke="${OL}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
  if(kind==='cat')s+=`<path d="M46 114h-20M46 122l-18 5M154 114h20M154 122l18 5" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>`;
  /* hats */
  if(opt.chef)s+=`<g><path d="M64 36Q48 8 76 2Q86 -14 100 -6Q114 -16 124 0Q152 6 136 36Z" fill="#fff" ${S}/><rect x="66" y="30" width="68" height="20" rx="7" fill="#fff" ${S}/><path d="M78 40h44" stroke="#E6EAF0" stroke-width="3" stroke-linecap="round"/></g>`;
  if(opt.bow)s+=`<g transform="translate(140 42) rotate(20)"><path d="M0 0L-22 -15Q-27 0 -22 15Z" fill="${opt.bow}" ${S}/><path d="M0 0L22 -15Q27 0 22 15Z" fill="${opt.bow}" ${S}/><circle r="7.5" fill="${opt.bow}" ${S}/><circle cx="-13" cy="-4" r="2.5" fill="#fff" opacity=".7"/></g>`;
  return `<svg class="ani ani-${mood}" viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/* =========================== FOOD (pizza) =========================== */
const F={
  tomato(x,y,r=17,rot=0,b=false){return `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="${r}" fill="${b?'#C9301F':'#E8412F'}" stroke="#A82A1C" stroke-width="1.5"/><circle r="${r*.78}" fill="${b?'#D9503A':'#F2604B'}"/>
    ${[0,1,2,3].map(i=>{const a=i*Math.PI/2+.4;return `<ellipse cx="${(Math.cos(a)*r*.42).toFixed(1)}" cy="${(Math.sin(a)*r*.42).toFixed(1)}" rx="${r*.2}" ry="${r*.13}" transform="rotate(${a*57.3} ${(Math.cos(a)*r*.42).toFixed(1)} ${(Math.sin(a)*r*.42).toFixed(1)})" fill="#F9D36B" opacity=".9"/>`}).join('')}<circle r="${r*.16}" fill="#F7B2A2"/></g>`},
  mushroom(x,y,r=16,rot=0,b=false){return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-r} ${-r*.1}Q${-r} ${-r} 0 ${-r}Q${r} ${-r} ${r} ${-r*.1}Q${r*.5} ${r*.1} ${r*.3} ${r*.05}L${r*.35} ${r*.9}Q0 ${r*1.05} ${-r*.35} ${r*.9}L${-r*.3} ${r*.05}Q${-r*.5} ${r*.1} ${-r} ${-r*.1}Z"
    fill="${b?'#D9B48A':'#F3E3CC'}" stroke="${b?'#8E6440':'#B89270'}" stroke-width="1.8"/><path d="M${-r*.8} ${-r*.2}Q0 ${-r*.8} ${r*.8} ${-r*.2}" stroke="${b?'#9A6A42':'#C7A584'}" stroke-width="1.6" fill="none"/></g>`},
  pepper(x,y,r=15,rot=0,b=false){return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${blob(0,0,r,.35,7,x*7+y)}" fill="none" stroke="${b?'#3E8E2E':'#4DB33A'}" stroke-width="${r*.42}"/><path d="${blob(0,0,r,.35,7,x*7+y)}" fill="none" stroke="${b?'#2E6E22':'#2F8A25'}" stroke-width="1.2" transform="scale(1.18)"/></g>`},
  olive(x,y,r=10,rot=0,b=false){return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="none" stroke="${b?'#1E1A22':'#2E2A35'}" stroke-width="${r*.75}"/><circle r="${r*.9}" fill="none" stroke="#4A4458" stroke-width="1" opacity=".6"/></g>`},
  pepperoni(x,y,r=17,rot=0,b=false){return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${b?'#A8321F':'#C9432C'}" stroke="${b?'#7A2214':'#962F1E'}" stroke-width="${b?3:1.5}"/>${[[.35,-.2],[-.3,.3],[-.1,-.45],[.2,.45],[-.45,-.1]].map(([a,c])=>`<circle cx="${(a*r).toFixed(1)}" cy="${(c*r).toFixed(1)}" r="${r*.11}" fill="#F4A08A" opacity=".85"/>`).join('')}</g>`},
  corn(x,y,r=12,rot=0,b=false){return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${(r/10).toFixed(2)})">${[[-5,0],[3,-3],[4,5],[-2,7],[-3,-7]].map(([a,c])=>`<ellipse cx="${a}" cy="${c}" rx="3.6" ry="4.2" fill="${b?'#F2B42C':'#FFD23F'}" stroke="#D89A16" stroke-width="1"/>`).join('')}</g>`},
  pineapple(x,y,r=15,rot=0,b=false){return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-r} ${r*.6}L0 ${-r}L${r} ${r*.6}Z" fill="${b?'#F5BE3A':'#FFDB5C'}" stroke="#D9A21F" stroke-width="1.6" stroke-linejoin="round"/><path d="M${-r*.5} ${r*.2}H${r*.5}M${-r*.25} ${-r*.3}H${r*.25}" stroke="#E2AE2A" stroke-width="1.4"/></g>`},
  basil(x,y,r=12,rot=0){return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 ${-r}Q${r*.9} ${-r*.2} 0 ${r}Q${-r*.9} ${-r*.2} 0 ${-r}Z" fill="#3E9E3A" stroke="#2A7A28" stroke-width="1.4"/><path d="M0 ${-r*.8}V${r*.8}" stroke="#7BD06A" stroke-width="1.4"/></g>`}
};
const TOPPING={
  tomato:{ko:'토마토',en:'tomato',cut:true,whole:'tomato'},
  mushroom:{ko:'버섯',en:'mushroom',cut:true,whole:'mushroom'},
  pepper:{ko:'피망',en:'green pepper',cut:true,whole:'pepper'},
  pepperoni:{ko:'페퍼로니',en:'pepperoni',cut:true,whole:'salami'},
  olive:{ko:'올리브',en:'olive',cut:true,whole:'olives'},
  corn:{ko:'옥수수',en:'corn',cut:false},
  pineapple:{ko:'파인애플',en:'pineapple',cut:true,whole:'pineapple'}
};
/* whole ingredients on the cutting board, viewBox -60 -60 120 120 */
const WHOLE={
  tomato:`<circle cx="0" cy="6" r="44" fill="#E8412F" ${S}/><ellipse cx="-16" cy="-8" rx="12" ry="7" fill="#fff" opacity=".45" transform="rotate(-30 -16 -8)"/><path d="M0 -34L-14 -46M0 -34L14 -46M0 -34L-20 -32M0 -34L20 -32M0 -34V-50" stroke="#2F8A25" stroke-width="6" stroke-linecap="round"/>`,
  mushroom:`<path d="M-48 2Q-50 -44 0 -46Q50 -44 48 2Q30 10 0 10Q-30 10 -48 2Z" fill="#C79868" ${S}/><circle cx="-18" cy="-24" r="6" fill="#E9C9A2"/><circle cx="14" cy="-30" r="4" fill="#E9C9A2"/><path d="M-16 8Q-18 40 0 44Q18 40 16 8Z" fill="#F6EAD8" ${S}/>`,
  pepper:`<path d="M-34 -24Q-48 18 -22 42Q0 50 22 42Q48 18 34 -24Q20 -36 0 -28Q-20 -36 -34 -24Z" fill="#43A833" ${S}/><path d="M-20 -14Q-26 14 -14 32" stroke="#7BD06A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 -28Q2 -44 12 -48" stroke="#2F7A22" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  salami:`<rect x="-50" y="-18" width="100" height="36" rx="18" fill="#B3382A" ${S}/><ellipse cx="50" cy="0" rx="12" ry="18" fill="#D9573F" ${S}/>${[[-30,-6],[-10,6],[12,-8],[28,6]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="3" fill="#F2A08A"/>`).join('')}`,
  olives:`${[[-18,8],[16,10],[0,-12]].map(([a,b])=>`<ellipse cx="${a}" cy="${b}" rx="16" ry="20" fill="#2E2A35" ${S}/><ellipse cx="${a-5}" cy="${b-7}" rx="4" ry="6" fill="#fff" opacity=".35"/>`).join('')}`,
  pineapple:`<path d="M-30 -4Q-34 44 0 48Q34 44 30 -4Q24 -26 0 -26Q-24 -26 -30 -4Z" fill="#F7C548" ${S}/><path d="M-26 0L26 30M-26 20L14 42M-20 -16L28 10M26 0L-26 30M26 20L-14 42M20 -16L-28 10" stroke="#D99A26" stroke-width="2.5"/><path d="M0 -26L-14 -52M0 -26L0 -56M0 -26L14 -52M0 -26L-24 -40M0 -26L24 -40" stroke="#3E9E3A" stroke-width="6" stroke-linecap="round"/>`
};
function wholeSVG(name,cuts=0){
  const cutLines=cuts?Array.from({length:cuts},(_,i)=>`<path d="M${-28+i*14} -46V48" stroke="#FFF7EE" stroke-width="4" opacity=".9"/>`).join(''):'';
  return `<svg viewBox="-60 -60 120 120">${WHOLE[name]||''}${cutLines}</svg>`;
}
function pieceSVG(t,size=40){return `<svg viewBox="-20 -20 40 40" width="${size}" height="${size}">${F[t](0,0,14,10,false)}</svg>`}

/* pizza top view, viewBox -120 -120 240 240. st={r,sauce,cheese:[[x,y,rot]],tops:[[t,x,y,rot]],baked,flour} */
function pizza(st){
  const id=uid('pz'),r=st.r,b=st.baked;
  let s=`<defs><radialGradient id="${id}c" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="${b?'#F0C27A':'#F6DDB0'}"/><stop offset=".93" stop-color="${b?'#D58F3E':'#EBC78E'}"/><stop offset="1" stop-color="${b?'#B8732E':'#DDB377'}"/></radialGradient>
    <radialGradient id="${id}s" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${b?'#D2402A':'#E2513A'}"/><stop offset="1" stop-color="${b?'#A82D1C':'#C2381F'}"/></radialGradient></defs>`;
  s+=`<ellipse cx="4" cy="8" rx="${r+2}" ry="${r}" fill="rgba(90,50,20,.18)"/><path d="${blob(0,0,r,.05,22,7)}" fill="url(#${id}c)" stroke="${b?'#9A5E24':'#C79A5E'}" stroke-width="2"/>`;
  if(st.flour)for(let i=0;i<26;i++){const R=rng(i*13+5),a=R()*6.28,d=R()*r*.9;s+=`<circle cx="${(Math.cos(a)*d).toFixed(1)}" cy="${(Math.sin(a)*d).toFixed(1)}" r="${1+R()*1.6}" fill="#fff" opacity=".7"/>`}
  if(b)for(let i=0;i<14;i++){const a=i/14*6.28+.2;s+=`<ellipse cx="${(Math.cos(a)*(r-6)).toFixed(1)}" cy="${(Math.sin(a)*(r-6)).toFixed(1)}" rx="5" ry="3" fill="#9E5A20" opacity=".35" transform="rotate(${a*57.3} ${(Math.cos(a)*(r-6)).toFixed(1)} ${(Math.sin(a)*(r-6)).toFixed(1)})"/>`}
  if(st.sauce){s+=`<path d="${blob(0,0,r-14,.08,18,3)}" fill="url(#${id}s)"/>`;for(let i=0;i<18;i++){const R=rng(i*29+1),a=R()*6.28,d=R()*(r-22);s+=`<circle cx="${(Math.cos(a)*d).toFixed(1)}" cy="${(Math.sin(a)*d).toFixed(1)}" r="${.8+R()*1.4}" fill="${R()>.5?'#3E7E2E':'#8E2216'}" opacity=".7"/>`}}
  if(st.cheese.length){
    if(b){const pts=st.cheese;s+=`<g opacity=".97">${pts.map(([x,y],i)=>`<path d="${blob(x,y,13,.5,7,i+3)}" fill="#FFE07A"/>`).join('')}</g>`;
      pts.forEach(([x,y],i)=>{if(i%4===0)s+=`<ellipse cx="${x+4}" cy="${y-3}" rx="5" ry="3.5" fill="#E39A35" opacity=".75"/>`;if(i%5===1)s+=`<ellipse cx="${x-3}" cy="${y+2}" rx="3" ry="2" fill="#FFF6C8" opacity=".9"/>`})}
    else st.cheese.forEach(([x,y,rot])=>{s+=`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-7 0q3.5-4 7 0t7 0" stroke="#E2BE55" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M-7 0q3.5-4 7 0t7 0" stroke="#FFF2B8" stroke-width="3" fill="none" stroke-linecap="round"/></g>`});
  }
  st.tops.forEach(([t,x,y,rot])=>{s+=F[t](x,y,undefined,rot,b)});
  if(st.basil)st.basil.forEach(([x,y,rot])=>{s+=F.basil(x,y,11,rot)});
  return s;
}

/* =========================== TOOLS (icons) =========================== */
const TOOL={
  flour:`<svg viewBox="0 0 100 100"><path d="M24 26Q20 12 34 12H66Q80 12 76 26L84 82Q84 92 74 92H26Q16 92 16 82Z" fill="#FFF8E6" ${S}/><path d="M28 24H72" ${S}/><rect x="30" y="44" width="40" height="22" rx="6" fill="#F7C548" ${S}/><text x="50" y="60" font-size="13" text-anchor="middle" fill="${OL}" font-family="Jua,sans-serif">밀가루</text></svg>`,
  water:`<svg viewBox="0 0 100 100"><path d="M30 20H70L66 88Q50 94 34 88Z" fill="#CFEAFF" ${S}/><path d="M33 48H67L65 86Q50 91 35 86Z" fill="#7CC4F5"/><path d="M70 30Q88 32 86 50Q84 62 68 62" fill="none" ${S}/><ellipse cx="42" cy="36" rx="4" ry="10" fill="#fff" opacity=".7"/></svg>`,
  spoon:`<svg viewBox="0 0 100 100"><ellipse cx="34" cy="30" rx="16" ry="22" fill="#D9A066" ${S} transform="rotate(-40 34 30)"/><path d="M44 42L84 86" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M44 42L84 86" stroke="#D9A066" stroke-width="7" stroke-linecap="round"/></svg>`,
  hands:`<svg viewBox="0 0 100 100"><path d="M20 70Q14 40 30 30Q36 50 40 52V20Q48 16 50 22V50Q52 18 60 18Q66 20 64 50Q70 26 76 30Q80 34 74 60Q70 84 46 86Q28 86 20 70Z" fill="#FFD9BE" ${S}/></svg>`,
  pin:`<svg viewBox="0 0 100 100"><rect x="18" y="38" width="64" height="24" rx="12" fill="#E9B67A" ${S}/><rect x="4" y="44" width="16" height="12" rx="6" fill="#B97A40" ${S}/><rect x="80" y="44" width="16" height="12" rx="6" fill="#B97A40" ${S}/><path d="M28 44H72" stroke="#fff" stroke-width="3" opacity=".6"/></svg>`,
  ladle:`<svg viewBox="0 0 100 100"><path d="M18 56Q18 82 40 82Q62 82 62 56Z" fill="#D9412B" ${S}/><path d="M60 58L88 14" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M60 58L88 14" stroke="#C8CDD6" stroke-width="5" stroke-linecap="round"/></svg>`,
  cheese:`<svg viewBox="0 0 100 100"><path d="M14 76L50 22L86 60V82H14Z" fill="#FFD94D" ${S}/><circle cx="40" cy="62" r="7" fill="#F2B82C"/><circle cx="64" cy="70" r="5" fill="#F2B82C"/><circle cx="58" cy="46" r="4" fill="#F2B82C"/></svg>`,
  knife:`<svg viewBox="0 0 100 100"><path d="M14 70L70 14Q84 10 80 28L36 72Z" fill="#E6EAF0" ${S}/><path d="M36 72L52 88" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M36 72L52 88" stroke="#3E6FD8" stroke-width="10" stroke-linecap="round"/></svg>`,
  wheel:`<svg viewBox="0 0 100 100"><circle cx="40" cy="40" r="28" fill="#E6EAF0" ${S}/><circle cx="40" cy="40" r="8" fill="#9AA2B1" ${S}/><path d="M56 56L88 88" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M56 56L88 88" stroke="#FF6F91" stroke-width="10" stroke-linecap="round"/></svg>`,
  peel:`<svg viewBox="0 0 100 100"><ellipse cx="40" cy="40" rx="32" ry="28" fill="#D9A066" ${S}/><path d="M64 60L90 90" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M64 60L90 90" stroke="#D9A066" stroke-width="7" stroke-linecap="round"/></svg>`,
  plate:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="44" ry="30" fill="#fff" ${S}/><ellipse cx="50" cy="54" rx="30" ry="19" fill="#F1F5FA"/></svg>`
};

/* brick pizza oven, viewBox 0 0 240 200 */
function oven(on){
  return `<svg viewBox="0 0 240 200"><path d="M20 190V100Q20 20 120 20Q220 20 220 100V190Z" fill="#E07B4F" ${S}/>
    ${[40,70,100,130,160].map((y,i)=>`<path d="M${i%2?34:22} ${y+30}H${i%2?206:218}" stroke="#B9583A" stroke-width="3" opacity=".6"/>`).join('')}
    <path d="M60 190V130Q60 80 120 80Q180 80 180 130V190Z" fill="#2E1E1A" ${S}/>
    ${on?`<g class="fire"><path d="M80 186Q76 150 96 138Q92 160 108 160Q100 132 124 118Q120 148 140 150Q138 136 150 132Q166 160 158 186Z" fill="#FF9A2E"/><path d="M98 186Q96 164 110 156Q110 172 122 170Q120 152 136 146Q144 170 140 186Z" fill="#FFD84D"/></g>`:''}
    <rect x="40" y="184" width="160" height="10" rx="4" fill="#9E4B30" ${S}/><path d="M104 20V2H136V20" fill="#9AA2B1" ${S}/></svg>`;
}

/* =========================== BUILDINGS (home hub) =========================== */
const BUILD={
  kitchen:`<svg viewBox="0 0 200 160"><rect x="26" y="56" width="148" height="96" rx="8" fill="#FFF3DF" ${S}/><path d="M18 60L30 30H170L182 60Z" fill="#FF6F91" ${S}/>
    ${[0,1,2,3,4,5].map(i=>`<path d="M${30+i*24} 30L${26+i*26} 60H${38+i*26}L${42+i*24} 30Z" fill="#fff" opacity=".85"/>`).join('')}
    <path d="M18 60Q30 72 42 60Q54 72 66 60Q78 72 90 60Q102 72 114 60Q126 72 138 60Q150 72 162 60Q174 72 182 60" fill="#FF6F91" ${S}/>
    <rect x="40" y="84" width="54" height="40" rx="6" fill="#BDE8FF" ${S}/><circle cx="67" cy="104" r="14" fill="#F6CF8F" stroke="#C98A3E" stroke-width="2"/><circle cx="62" cy="100" r="3" fill="#E8412F"/><circle cx="72" cy="106" r="3" fill="#E8412F"/><circle cx="66" cy="110" r="2.5" fill="#4DB33A"/>
    <rect x="110" y="92" width="44" height="60" rx="6" fill="#C98C5C" ${S}/><circle cx="146" cy="124" r="3.5" fill="${OL}"/>
    <circle cx="100" cy="20" r="16" fill="#F6CF8F" ${S}/><path d="M100 4V36M84 20H116M89 9L111 31M111 9L89 31" stroke="#E8412F" stroke-width="2.5"/></svg>`,
  castle:`<svg viewBox="0 0 200 160"><rect x="40" y="70" width="120" height="82" fill="#FFE3EF" ${S}/><rect x="24" y="50" width="36" height="102" fill="#FFD1E3" ${S}/><rect x="140" y="50" width="36" height="102" fill="#FFD1E3" ${S}/>
    <path d="M20 52L42 14L64 52Z" fill="#9A7BFF" ${S}/><path d="M136 52L158 14L180 52Z" fill="#9A7BFF" ${S}/><path d="M70 72L100 26L130 72Z" fill="#B597FF" ${S}/>
    <path d="M100 26V6L118 12L100 18" fill="#FF6F91" ${S}/><path d="M80 152V118Q100 96 120 118V152Z" fill="#C98C5C" ${S}/>
    <circle cx="42" cy="80" r="7" fill="#BDE8FF" ${S}/><circle cx="158" cy="80" r="7" fill="#BDE8FF" ${S}/><path d="M86 88h28" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/></svg>`,
  salon:`<svg viewBox="0 0 200 160"><rect x="30" y="58" width="140" height="94" rx="10" fill="#FFE9F3" ${S}/><path d="M22 62Q100 6 178 62Z" fill="#FF8FB1" ${S}/>
    <circle cx="100" cy="44" r="14" fill="#fff" ${S}/><path d="M94 40q6-8 12 0M92 48q8 6 16 0" stroke="#FF6F91" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="44" y="80" width="52" height="50" rx="24" fill="#E9F6FF" ${S}/><path d="M60 92L74 92L80 124H54Z" fill="#B57CFF" ${S}/><circle cx="67" cy="88" r="5" fill="#FFD9BE" ${S}/>
    <rect x="110" y="88" width="46" height="64" rx="8" fill="#9A7BFF" ${S}/><circle cx="148" cy="122" r="3.5" fill="#fff"/></svg>`,
  fire:`<svg viewBox="0 0 200 160"><rect x="24" y="48" width="152" height="104" rx="6" fill="#E53935" ${S}/><path d="M16 52L100 14L184 52Z" fill="#B71C1C" ${S}/>
    <rect x="44" y="84" width="112" height="68" rx="6" fill="#FFF3E0" ${S}/>${[0,1,2,3].map(i=>`<path d="M48 ${94+i*14}H152" stroke="#E0C9A8" stroke-width="3"/>`).join('')}
    <circle cx="100" cy="62" r="14" fill="#FFC93C" ${S}/><path d="M100 54v10l6 4" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M150 30V12M146 12H158" ${S}/></svg>`,
  school:`<svg viewBox="0 0 200 160"><rect x="28" y="60" width="144" height="92" rx="6" fill="#FFE08A" ${S}/><path d="M20 64L100 24L180 64Z" fill="#FF9A62" ${S}/>
    <circle cx="100" cy="50" r="12" fill="#fff" ${S}/><path d="M100 44v6l5 3" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${[44,128].map(x=>`<rect x="${x}" y="80" width="28" height="26" rx="4" fill="#BDE8FF" ${S}/>`).join('')}<path d="M86 152V110H114V152Z" fill="#6CCB5F" ${S}/>
    <text x="58" y="132" font-size="16" fill="#E53935" font-family="Jua,sans-serif">가</text><text x="128" y="132" font-size="16" fill="#3E63DD" font-family="Jua,sans-serif">A</text><text x="146" y="132" font-size="16" fill="#43A047" font-family="Jua,sans-serif">1</text></svg>`,
  music:`<svg viewBox="0 0 200 160"><path d="M30 152V80Q30 40 100 40Q170 40 170 80V152Z" fill="#B9E3FF" ${S}/><path d="M50 152V96Q50 70 100 70Q150 70 150 96V152Z" fill="#3FB8F0" ${S}/>
    ${[0,1,2,3,4,5].map(i=>`<rect x="${62+i*13}" y="112" width="11" height="40" rx="3" fill="${['#FF6F91','#FF9A62','#FFC93C','#6CCB5F','#3FB8F0','#9A7BFF'][i]}" ${S}/>`).join('')}
    <path d="M70 34V16L86 12V30" ${S} fill="none"/><circle cx="66" cy="34" r="5" fill="${OL}"/><circle cx="82" cy="30" r="5" fill="${OL}"/><path d="M130 30V14" ${S}/><circle cx="126" cy="30" r="5" fill="${OL}"/></svg>`,
  stamp:`<svg viewBox="0 0 200 160"><rect x="36" y="30" width="128" height="110" rx="14" fill="#fff" ${S}/>${[0,1,2,3,4,5].map(i=>`<circle cx="${66+(i%3)*34}" cy="${66+Math.floor(i/3)*40}" r="14" fill="none" stroke="${i<4?'#E0393E':'#E4DDF2'}" stroke-width="${i<4?4:3}" ${i<4?'':'stroke-dasharray="4 4"'}/>${i<4?`<text x="${66+(i%3)*34}" y="${71+Math.floor(i/3)*40}" font-size="11" text-anchor="middle" fill="#E0393E" font-family="Jua,sans-serif">참</text>`:''}`).join('')}</svg>`
};

/* =========================== 꾸미기 그림 (화장 얼굴, 액세서리, 드레스, 화장품) =========================== */
function star(cx,cy,r,fill='#FFD84D',extra=''){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;d+=(i?'L':'M')+(cx+rr*Math.cos(a)).toFixed(1)+' '+(cy+rr*Math.sin(a)).toFixed(1)}return `<path d="${d}Z" fill="${fill}" ${extra}/>`}
function twinkle(cx,cy,r,fill='#fff'){return `<path d="M${cx} ${cy-r}Q${cx} ${cy} ${cx+r} ${cy}Q${cx} ${cy} ${cx} ${cy+r}Q${cx} ${cy} ${cx-r} ${cy}Q${cx} ${cy} ${cx} ${cy-r}Z" fill="${fill}"/>`}
/* accessories, drawn around (0,0), about 80 wide */
const ACC={
  crown:`<path d="M-36 20L-42 -18L-18 2L0 -30L18 2L42 -18L36 20Z" fill="#FFD23F" ${S}/><rect x="-37" y="14" width="74" height="13" rx="5" fill="#FFB800" ${S}/><circle cy="-30" r="6.5" fill="#FF6F91" ${S}/><circle cx="-42" cy="-18" r="5.5" fill="#5EC2FF" ${S}/><circle cx="42" cy="-18" r="5.5" fill="#5EC2FF" ${S}/><circle cy="3" r="5.5" fill="#FF6F91"/><circle cx="-20" cy="20" r="3" fill="#fff"/><circle cx="20" cy="20" r="3" fill="#fff"/><path d="M-26 -2l6 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  ribbon:`<path d="M-6 6L-20 36L-2 26Z" fill="#FF8FB1" ${S}/><path d="M6 6L20 36L2 26Z" fill="#FF8FB1" ${S}/><path d="M0 0L-40 -24Q-50 0 -40 24Z" fill="#FF6F91" ${S}/><path d="M0 0L40 -24Q50 0 40 24Z" fill="#FF6F91" ${S}/><circle r="11" fill="#FF8FB1" ${S}/><path d="M-32 -12q6 -2 10 2M22 -10q6 -4 12 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" fill="none"/>`,
  flower:`<path d="M18 22Q34 30 40 18Q28 10 18 22Z" fill="#6CCB5F" ${S}/>${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${(22*Math.cos(a)).toFixed(1)}" cy="${(22*Math.sin(a)).toFixed(1)}" r="16" fill="#FFB3D1" ${S}/>`}).join('')}<circle r="13" fill="#FFD23F" ${S}/><circle cx="-4" cy="-4" r="3.5" fill="#fff" opacity=".8"/>`,
  wand:`<path d="M-6 6L-34 38" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M-6 6L-34 38" stroke="#FF8FB1" stroke-width="5.5" stroke-linecap="round"/>${star(8,-8,26,'#FFD84D',S)}${twinkle(34,-30,8)}${twinkle(-14,-34,6)}`,
  star:star(0,0,36,'#FFD84D',S)+`<circle cx="-10" cy="-8" r="4" fill="#fff" opacity=".8"/>`,
  heart:`<path d="M0 30C-44 0 -38 -34 -18 -34C-8 -34 -2 -28 0 -20C2 -28 8 -34 18 -34C38 -34 44 0 0 30Z" fill="#FF6F91" ${S}/><ellipse cx="-16" cy="-18" rx="7" ry="4.5" fill="#fff" opacity=".7" transform="rotate(-30 -16 -18)"/>`
};
const accSVG=n=>`<svg viewBox="-55 -50 110 100" style="overflow:visible">${ACC[n]||''}</svg>`;

/* a girl's face for the makeup game. viewBox 0 0 300 330.
   st: {lip:color|null, blushL,blushR:bool, lidL,lidR:color|null, acc:'crown'|'ribbon'|'flower'|null, mood:'idle'|'happy', glow:zoneName|null} */
const FACE_ZONES={lips:[150,250,62],cheekL:[78,226,44],cheekR:[222,226,44],lidL:[106,172,42],lidR:[194,172,42],top:[150,48,70]};
function face(st={}){
  const id=uid('fc'),HAIR='#7A4A2A',HAIR2='#94603A',SKIN='#FFE4D0',EYE='#4A2E20';
  const glow=z=>st.glow===z?`<circle cx="${FACE_ZONES[z][0]}" cy="${FACE_ZONES[z][1]}" r="${FACE_ZONES[z][2]*.8}" fill="none" stroke="#FFC93C" stroke-width="6" stroke-dasharray="4 12" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 ${FACE_ZONES[z][0]} ${FACE_ZONES[z][1]}" to="360 ${FACE_ZONES[z][0]} ${FACE_ZONES[z][1]}" dur="6s" repeatCount="indefinite"/></circle>`:'';
  let s=`<defs><radialGradient id="${id}s" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#FFF1E6"/><stop offset=".6" stop-color="${SKIN}"/><stop offset="1" stop-color="#F9CDB3"/></radialGradient>
    <radialGradient id="${id}c"><stop offset="0" stop-color="#FF7FA6" stop-opacity=".95"/><stop offset=".6" stop-color="#FF8FB1" stop-opacity=".6"/><stop offset="1" stop-color="#FF8FB1" stop-opacity="0"/></radialGradient></defs>`;
  /* hair behind, buns */
  s+=`<circle cx="56" cy="70" r="38" fill="${HAIR}" ${S}/><circle cx="244" cy="70" r="38" fill="${HAIR}" ${S}/><circle cx="46" cy="58" r="10" fill="${HAIR2}" opacity=".7"/><circle cx="234" cy="58" r="10" fill="${HAIR2}" opacity=".7"/>
    <path d="M36 200Q18 64 150 44Q282 64 264 200Q268 268 238 300L62 300Q32 268 36 200Z" fill="${HAIR}" ${S}/>`;
  s+=`<ellipse cx="46" cy="196" rx="15" ry="19" fill="${SKIN}" ${S}/><ellipse cx="254" cy="196" rx="15" ry="19" fill="${SKIN}" ${S}/>`;
  s+=`<ellipse cx="150" cy="190" rx="106" ry="108" fill="url(#${id}s)" ${S}/>`;
  /* fringe */
  s+=`<path d="M48 168Q50 72 150 66Q250 72 252 168Q232 120 196 108Q184 136 150 108Q118 136 104 108Q68 120 48 168Z" fill="${HAIR}" ${S}/><path d="M92 92Q120 78 150 80" stroke="${HAIR2}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>`;
  /* bun ties */
  s+=`<g transform="translate(78 96) scale(.42) rotate(-20)">${ACC.ribbon}</g><g transform="translate(222 96) scale(.42) rotate(20)">${ACC.ribbon}</g>`;
  /* eye shadow, eyes */
  if(st.lidL)s+=`<ellipse cx="106" cy="168" rx="30" ry="15" fill="${st.lidL}" opacity=".75"/>${twinkle(84,158,6)}`;
  if(st.lidR)s+=`<ellipse cx="194" cy="168" rx="30" ry="15" fill="${st.lidR}" opacity=".75"/>${twinkle(216,158,6)}`;
  const eye=(x,out)=>st.mood==='happy'
    ?`<path d="M${x-18} 196Q${x} 170 ${x+18} 196" stroke="${EYE}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x+out*18} 190l${out*9} -5M${x+out*13} 182l${out*7} -8" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`
    :`<ellipse cx="${x}" cy="190" rx="17" ry="20" fill="${EYE}"/><ellipse cx="${x}" cy="197" rx="10.5" ry="10" fill="#8A5638"/><circle cx="${x+6}" cy="181" r="7" fill="#fff"/><circle cx="${x-6}" cy="199" r="3.4" fill="#fff" opacity=".95"/>
      <path d="M${x+out*16} 178l${out*9} -6M${x+out*11} 171l${out*6} -9" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`;
  s+=`<g class="eyes">${eye(106,-1)}${eye(194,1)}</g>`;
  s+=`<path d="M86 154q20 -11 38 0M176 154q18 -11 38 0" stroke="${HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M145 220q5 6 10 0" stroke="#E0A184" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  /* cheeks */
  s+=`<circle cx="78" cy="226" r="${st.blushL?30:24}" fill="url(#${id}c)" opacity="${st.blushL?1:.4}"/><circle cx="222" cy="226" r="${st.blushR?30:24}" fill="url(#${id}c)" opacity="${st.blushR?1:.4}"/>`;
  if(st.blushL)s+=twinkle(66,214,6);if(st.blushR)s+=twinkle(234,214,6);
  /* lips */
  const lc=st.lip||'#F2A4A2',ls=st.lip?'rgba(91,58,41,.55)':'#D98482';
  s+=st.mood==='happy'
    ?`<path d="M118 244Q150 286 182 244Q150 252 118 244Z" fill="#B8474B" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M118 244Q134 232 150 240Q166 232 182 244Q150 252 118 244Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M124 250Q150 292 176 250" fill="none" stroke="${lc}" stroke-width="9" stroke-linecap="round"/>`
    :`<path d="M122 248Q150 280 178 248Q150 256 122 248Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M122 248Q136 234 150 243Q164 234 178 248Q150 256 122 248Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if(st.lip)s+=`<ellipse cx="160" cy="262" rx="8" ry="3" fill="#fff" opacity=".65"/>`;
  if(st.acc&&ACC[st.acc])s+=`<g transform="translate(150 ${st.acc==='crown'?44:52}) scale(1.35)">${ACC[st.acc]}</g>`;
  s+=glow('lips')+glow('cheekL')+glow('cheekR')+glow('lidL')+glow('lidR')+glow('top');
  return `<svg class="face-art" viewBox="0 0 300 330" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/* dresses, viewBox 0 0 200 240. kind: ball | tutu | star. c1 main colour, c2 trim */
function dress(kind='ball',c1='#FF8FB1',c2='#FFD1E0'){
  let s='';
  if(kind==='ball'){
    s+=`<circle cx="58" cy="36" r="21" fill="${c2}" ${S}/><circle cx="142" cy="36" r="21" fill="${c2}" ${S}/>
      <path d="M66 86Q12 150 8 220Q100 244 192 220Q188 150 134 86Z" fill="${c1}" ${S}/>
      <path d="M36 158Q100 182 164 158" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/><path d="M22 190Q100 214 178 190" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
      ${[0,1,2,3,4,5,6,7,8].map(i=>`<circle cx="${14+i*21.5}" cy="${222+Math.sin(i/8*Math.PI)*9}" r="11" fill="${c2}" ${S}/>`).join('')}
      <path d="M72 14Q100 30 128 14L134 88H66Z" fill="${c1}" ${S}/><path d="M74 16Q100 32 126 16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1 9"/>
      <g transform="translate(100 88) scale(.5)">${ACC.ribbon.replace(/#FF6F91/g,c2).replace(/#FF8FB1/g,'#fff')}</g>
      ${twinkle(52,130,8)}${twinkle(150,146,7)}${twinkle(96,196,6)}${twinkle(134,112,5)}`;
  }else if(kind==='tutu'){
    s+=`<path d="M78 8V34M122 8V34" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M78 8V34M122 8V34" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="100" cy="150" rx="92" ry="44" fill="${c2}" ${S}/><ellipse cx="100" cy="138" rx="80" ry="36" fill="${c1}" ${S} opacity=".95"/><ellipse cx="100" cy="126" rx="64" ry="28" fill="${c2}" ${S}/>
      ${[0,1,2,3,4,5,6].map(i=>`<path d="M${22+i*26} ${168+Math.sin(i/6*Math.PI)*18}q8 12 16 0" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/>`).join('')}
      <path d="M68 30Q100 42 132 30L128 112Q100 122 72 112Z" fill="${c1}" ${S}/>
      <g transform="translate(100 66) scale(.42)">${ACC.heart.replace('#FF6F91','#fff')}</g>${twinkle(40,132,7)}${twinkle(160,140,6)}${twinkle(100,150,5)}`;
  }else{
    s+=`<path d="M70 12Q100 26 130 12L172 214Q100 234 28 214Z" fill="${c1}" ${S}/><path d="M34 190Q100 210 166 190L172 214Q100 234 28 214Z" fill="${c2}" ${S}/>
      <path d="M70 12Q78 34 100 24Q84 14 70 12Z" fill="#fff" ${S}/><path d="M130 12Q122 34 100 24Q116 14 130 12Z" fill="#fff" ${S}/><circle cx="100" cy="30" r="6" fill="#FFD84D" ${S}/>
      ${star(76,80,11)}${star(122,104,13)}${star(66,140,12)}${star(132,162,10)}${star(98,150,9,'#fff')}${star(104,64,7,'#fff')}${star(52,176,7,'#fff')}`;
  }
  return `<svg class="dress-art" viewBox="0 0 200 240" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
function lipstick(color='#FF5A7A'){return `<svg viewBox="0 0 100 140" style="overflow:visible"><path d="M36 60V34Q36 12 64 24V60Z" fill="${color}" ${S}/><path d="M42 54V34Q42 26 50 24" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/><rect x="32" y="56" width="36" height="20" rx="4" fill="#F3F5F9" ${S}/><rect x="26" y="72" width="48" height="60" rx="9" fill="#FFD23F" ${S}/><path d="M36 82v40" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>${twinkle(80,30,8,'#FFD84D')}</svg>`}
function polish(color='#FF5A7A'){return `<svg viewBox="0 0 100 140" style="overflow:visible"><rect x="38" y="6" width="24" height="56" rx="9" fill="#5B4A8A" ${S}/><path d="M44 14v40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/><rect x="40" y="58" width="20" height="12" fill="#F3F5F9" ${S}/><path d="M22 84Q22 68 38 68H62Q78 68 78 84V118Q78 134 62 134H38Q22 134 22 118Z" fill="${color}" ${S}/><path d="M32 82v36" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".55"/><g transform="translate(58 104) scale(.28)">${ACC.heart.replace('#FF6F91','#fff')}</g></svg>`}

/* 종이 공예 그림체: 외곽선 없이 종이를 여러 겹 겹친 둥근 그림. 겹마다 부드러운 그림자, 종이 결.
   paper(kind, {grow:0~3, size}) — grow가 오를수록 그림에 나무·꽃·집이 하나씩 늘어남(숫자 대신 그림이 자람). */
let _pid=0;
function paper(kind='forest',o={}){
  const g=Math.max(0,Math.min(3,o.grow??3)),id='pp'+(++_pid);
  const P={forest:{sky:'#DCEBF0',far:'#B9D3B0',mid:'#9CC293',near:'#86B27E',path:'#EBDCC0',acc:'#E9B7A6'},
           sea:{sky:'#DDEBF2',far:'#A9CBDA',mid:'#8EBBCF',near:'#EADCC2',path:'#F3E8D3',acc:'#E8C27A'},
           christmas:{sky:'#DCE4EE',far:'#C4D3CB',mid:'#F4F1EA',near:'#FBF9F4',path:'#E9E2D6',acc:'#D9928A'},
           kitchen:{sky:'#F3E6DA',far:'#E8D3C0',mid:'#D9BFA6',near:'#EFE2D0',path:'#F6EEE2',acc:'#E3A79A'}}[kind]||{};
  const L=(d)=>`<g filter="url(#${id}s)">${d}</g>`;                 // 한 겹 = 그림자 하나
  const tree=(x,y,s=1,c='#7FA978')=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-3" y="-4" width="6" height="16" rx="2" fill="#B89878"/><path d="M0-34L16-6H-16Z" fill="${c}"/><path d="M0-46L12-22H-12Z" fill="${c}" opacity=".92"/></g>`;
  const bush=(x,y,s=1,c='#93BC8A')=>`<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-8" cy="0" r="10" fill="${c}"/><circle cx="6" cy="-4" r="12" fill="${c}"/><circle cx="16" cy="2" r="8" fill="${c}"/></g>`;
  const flower=(x,y,c=P.acc)=>`<g transform="translate(${x} ${y})"><rect x="-1" y="0" width="2" height="9" fill="#7FA978"/>${[0,72,144,216,288].map(a=>`<circle cx="${Math.cos(a*Math.PI/180)*4}" cy="${Math.sin(a*Math.PI/180)*4}" r="3.4" fill="${c}"/>`).join('')}<circle r="2.4" fill="#F4D58A"/></g>`;
  const house=(x,y,roof='#D9928A',wall='#F6EEE2')=>`<g transform="translate(${x} ${y})"><path d="M-18 0V-22H18V0Z" fill="${wall}"/><path d="M-24-20L0-40L24-20Z" fill="${roof}"/><rect x="-5" y="-12" width="10" height="12" rx="4" fill="#C9A98A"/><rect x="8" y="-17" width="7" height="7" rx="2" fill="#F4D58A"/></g>`;
  const cloud=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="#FBF9F4"><circle cx="-10" cy="0" r="8"/><circle cx="2" cy="-5" r="11"/><circle cx="14" cy="0" r="8"/><rect x="-18" y="0" width="40" height="7" rx="3.5"/></g>`;
  let s='';
  if(kind==='forest'){
    s+=L(cloud(62,52,1)+cloud(140,40,.8));
    s+=L(`<path d="M0 118Q50 84 100 104T200 96V200H0Z" fill="${P.far}"/>`);
    s+=L(`<path d="M0 136Q60 110 120 130T200 124V200H0Z" fill="${P.mid}"/>`+(g>=1?tree(40,124,1)+tree(58,128,.75,'#8DB585'):'')+(g>=2?tree(160,122,1.1)+tree(178,128,.8,'#8DB585'):''));
    s+=L(`<path d="M0 160Q70 146 130 158T200 154V200H0Z" fill="${P.near}"/>`+(g>=1?bush(150,160,.9):'')+(g>=3?bush(30,166,.8,'#A3C799')+flower(118,168)+flower(132,174,'#EBC9A0')+flower(70,176):''));
    s+=L(`<path d="M84 200Q92 170 104 156Q112 148 106 140Q118 150 114 162Q104 182 120 200Z" fill="${P.path}"/>`);
    s+=`<g transform="translate(78 92) scale(.3)">${animal('bunny','happy',{bow:'#E9A2B4'})}</g>`;
  }else if(kind==='sea'){
    s+=L(cloud(150,48,.9)+`<circle cx="52" cy="56" r="14" fill="#F2DDA0"/>`);
    s+=L(`<path d="M0 112Q50 104 100 112T200 108V200H0Z" fill="${P.far}"/>`);
    s+=L(`<path d="M0 132Q40 124 80 132T160 130T200 132V200H0Z" fill="${P.mid}"/>`+(g>=2?`<path d="M120 118L136 118L128 96Z" fill="#FBF9F4"/><path d="M112 120H146L140 128H118Z" fill="#D9928A"/>`:''));
    s+=L(`<path d="M0 158Q60 146 120 156T200 150V200H0Z" fill="${P.near}"/>`+(g>=1?`<path d="M40 162l8-14 8 14z" fill="#E3B48A"/><circle cx="160" cy="166" r="6" fill="#E8C7B8"/>`:'')+(g>=3?`<path d="M120 172q8-12 16 0q-8 6-16 0z" fill="#E9B7A6"/><circle cx="74" cy="176" r="4" fill="#FBF9F4"/>`:''));
    s+=`<g transform="translate(70 104) scale(.28)">${animal('cat','happy',{bow:'#9DB7E0'})}</g>`;
  }else if(kind==='christmas'){
    s+=L(Array.from({length:10},(_,i)=>`<circle cx="${18+i*19}" cy="${30+(i*37)%50}" r="${2+(i%3)}" fill="#FBF9F4"/>`).join(''));
    s+=L(`<path d="M0 116Q50 96 100 110T200 104V200H0Z" fill="${P.far}"/>`+tree(150,110,.9,'#8FAE98')+tree(166,114,.7,'#8FAE98'));
    s+=L(`<path d="M0 138Q60 122 120 136T200 130V200H0Z" fill="${P.mid}"/>`+house(62,138,'#C98A84')+(g>=2?house(126,140,'#9FB5C9'):''));
    s+=L(`<path d="M0 164Q70 150 130 162T200 158V200H0Z" fill="${P.near}"/>`+(g>=1?tree(30,170,1,'#7FA48A'):'')+(g>=3?`<circle cx="160" cy="170" r="10" fill="#FBF9F4"/><circle cx="160" cy="154" r="7" fill="#FBF9F4"/><path d="M160 154l8 2-8 2z" fill="#E3A060"/>`:''));
    s+=`<g transform="translate(84 112) scale(.26)">${animal('bear','happy',{bow:'#D9928A'})}</g>`;
  }else{ // kitchen
    s+=L(`<rect x="0" y="0" width="200" height="120" fill="${P.far}"/><rect x="30" y="30" width="50" height="40" rx="6" fill="#DDEBF0"/>`);
    s+=L(`<rect x="0" y="120" width="200" height="80" fill="${P.mid}"/>`+(g>=1?`<rect x="120" y="70" width="50" height="50" rx="8" fill="#EFE2D0"/><rect x="130" y="82" width="30" height="22" rx="4" fill="#C9A98A"/>`:''));
    s+=L(`<path d="M20 150H180L170 172H30Z" fill="${P.near}"/>`+(g>=2?`<circle cx="70" cy="146" r="12" fill="#E3A79A"/><circle cx="70" cy="140" r="6" fill="#F6EEE2"/>`:'')+(g>=3?`<path d="M120 148h28l-4 -16h-20z" fill="#F2DDA0"/>`:''));
    s+=`<g transform="translate(84 92) scale(.28)">${animal('bear','yum',{apron:'#E3A79A'})}</g>`;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="paper-art"><defs>
<clipPath id="${id}c"><circle cx="100" cy="100" r="92"/></clipPath>
<filter id="${id}s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".22"/></filter>
<filter id="${id}g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .36  0 0 0 0 .23  0 0 0 0 .16  0 0 0 .09 0"/></filter></defs>
<circle cx="100" cy="103" r="97" fill="#5B3A29" opacity=".12"/><circle cx="100" cy="100" r="97" fill="#FBF9F4"/>
<g clip-path="url(#${id}c)"><rect width="200" height="200" fill="${P.sky}"/>${s}<rect width="200" height="200" filter="url(#${id}g)"/></g>
<circle cx="100" cy="100" r="92" fill="none" stroke="#5B3A29" stroke-opacity=".08" stroke-width="1.5"/></svg>`;
}

window.ART={paper,OL,animal,KINDS,F,TOPPING,WHOLE,wholeSVG,pieceSVG,pizza,TOOL,oven,BUILD,blob,rng,ACC,accSVG,face,FACE_ZONES,dress,lipstick,polish,star,twinkle};
})();
