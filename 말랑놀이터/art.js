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
  bunny:{ko:'토토',body:'#FFF7EE',dark:'#F3DCC8',inner:'#FFB3C6',cheek:'#FF9CB5'},
  bear:{ko:'보리',body:'#C98C5C',dark:'#A86E43',inner:'#F2D3B0',cheek:'#FF9C8A'},
  cat:{ko:'모모',body:'#FFB75E',dark:'#EE8F32',inner:'#FFE6C7',cheek:'#FF8E8E'},
  dog:{ko:'콩이',body:'#FFFFFF',dark:'#B98154',inner:'#F7E7D7',cheek:'#FFA3B4'}
};
function animal(kind='bunny',mood='idle',opt={}){
  const k=KINDS[kind]||KINDS.bunny,c=k.body;let s='';
  /* ears behind head */
  if(kind==='bunny')s+=`<g class="ears"><ellipse cx="76" cy="40" rx="17" ry="42" fill="${c}" ${S} transform="rotate(-10 76 40)"/><ellipse cx="76" cy="44" rx="8" ry="30" fill="${k.inner}" transform="rotate(-10 76 44)"/>
    <ellipse cx="124" cy="40" rx="17" ry="42" fill="${c}" ${S} transform="rotate(12 124 40)"/><ellipse cx="124" cy="44" rx="8" ry="30" fill="${k.inner}" transform="rotate(12 124 44)"/></g>`;
  if(kind==='bear')s+=`<circle cx="50" cy="56" r="22" fill="${c}" ${S}/><circle cx="50" cy="58" r="11" fill="${k.inner}"/><circle cx="150" cy="56" r="22" fill="${c}" ${S}/><circle cx="150" cy="58" r="11" fill="${k.inner}"/>`;
  if(kind==='cat')s+=`<path d="M46 74L52 26L88 52Z" fill="${c}" ${S}/><path d="M56 62L59 40L76 53Z" fill="${k.inner}"/><path d="M154 74L148 26L112 52Z" fill="${c}" ${S}/><path d="M144 62L141 40L124 53Z" fill="${k.inner}"/>`;
  /* body + arms */
  const wave=opt.wave?' class="wave"':'';
  s+=`<ellipse cx="100" cy="184" rx="52" ry="42" fill="${c}" ${S}/><ellipse cx="100" cy="192" rx="31" ry="25" fill="${k.inner}" opacity=".85"/>`;
  if(opt.apron)s+=`<path d="M70 160H130L136 222Q100 230 64 222Z" fill="${opt.apron}" ${S}/><rect x="88" y="182" width="24" height="16" rx="5" fill="#fff" opacity=".7"/>`;
  s+=`<ellipse cx="54" cy="178" rx="13" ry="21" fill="${c}" ${S} transform="rotate(25 54 178)"/><g${wave}><ellipse cx="146" cy="178" rx="13" ry="21" fill="${c}" ${S} transform="rotate(-25 146 178)"/></g>`;
  /* head */
  s+=`<circle cx="100" cy="104" r="64" fill="${c}" ${S}/>`;
  if(kind==='cat')s+=`<path d="M100 42v14M86 44l3 12M114 44l-3 12" stroke="${k.dark}" stroke-width="5" stroke-linecap="round"/>`;
  if(kind==='dog')s+=`<ellipse cx="128" cy="86" rx="16" ry="13" fill="${k.dark}" opacity=".75"/><path d="M44 76Q30 112 50 136Q62 120 62 84Z" fill="${k.dark}" ${S}/><path d="M156 76Q170 112 150 136Q138 120 138 84Z" fill="${k.dark}" ${S}/>`;
  if(kind==='bunny')s+=`<path d="M92 44q8-10 16 0" stroke="${k.inner}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  /* muzzle */
  if(kind==='bear'||kind==='dog')s+=`<ellipse cx="100" cy="128" rx="30" ry="22" fill="${k.inner}"/>`;
  else s+=`<ellipse cx="100" cy="128" rx="22" ry="15" fill="#FFFFFF" opacity=".55"/>`;
  /* cheeks */
  s+=`<ellipse cx="62" cy="124" rx="12" ry="7.5" fill="${k.cheek}" opacity=".75"/><ellipse cx="138" cy="124" rx="12" ry="7.5" fill="${k.cheek}" opacity=".75"/>`;
  /* eyes */
  const eye=(x)=>{
    if(mood==='happy'||mood==='yum')return `<path d="M${x-10} 104Q${x} 90 ${x+10} 104" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if(mood==='sleepy')return `<path d="M${x-9} 102Q${x} 108 ${x+9} 102" stroke="${OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    const r=mood==='wow'?11:8.5,ry=mood==='wow'?12:10.5;
    return `<g class="eye"><ellipse cx="${x}" cy="102" rx="${r}" ry="${ry}" fill="${OL}"/><circle cx="${x+3}" cy="${98}" r="${mood==='wow'?4:3.2}" fill="#fff"/><circle cx="${x-3}" cy="106" r="1.6" fill="#fff"/></g>`;
  };
  s+=`<g class="eyes">${eye(78)}${eye(122)}</g>`;
  if(mood==='think')s+=`<path d="M66 84l18-4M134 84l-18-4" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`;
  /* nose + mouth */
  s+=`<ellipse cx="100" cy="117" rx="${kind==='bear'||kind==='dog'?9:6}" ry="${kind==='bear'||kind==='dog'?6.5:4.5}" fill="${kind==='bunny'?'#FF8FAB':OL}"/>`;
  if(mood==='yum')s+=`<g class="chew"><path d="M86 128Q100 150 114 128Z" fill="#9C3D3D" ${S}/><path d="M92 136Q100 146 108 136Q100 132 92 136Z" fill="#FF8FA3"/></g>`;
  else if(mood==='wow')s+=`<ellipse cx="100" cy="136" rx="9" ry="11" fill="#9C3D3D" ${S}/>`;
  else if(mood==='happy')s+=`<path d="M84 128Q100 148 116 128Z" fill="#9C3D3D" ${S}/><path d="M91 136Q100 144 109 136Q100 131 91 136Z" fill="#FF8FA3"/>`;
  else if(kind==='cat')s+=`<path d="M88 126q6 8 12 0q6 8 12 0" stroke="${OL}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  else s+=`<path d="M100 122v6M88 128Q100 138 112 128" stroke="${OL}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if(kind==='cat')s+=`<path d="M60 116h-20M60 124l-18 5M140 116h20M140 124l18 5" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>`;
  /* hats */
  if(opt.chef)s+=`<g><rect x="70" y="40" width="60" height="22" rx="6" fill="#fff" ${S}/><path d="M66 46Q52 18 78 14Q86 -2 100 6Q114 -4 124 12Q150 16 134 46Z" fill="#fff" ${S}/></g>`;
  if(opt.bow)s+=`<g transform="translate(128 52) rotate(18)"><path d="M0 0L-18 -12V12Z" fill="${opt.bow}" ${S}/><path d="M0 0L18 -12V12Z" fill="${opt.bow}" ${S}/><circle r="6" fill="${opt.bow}" ${S}/></g>`;
  return `<svg class="ani ani-${mood}" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
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

window.ART={OL,animal,KINDS,F,TOPPING,WHOLE,wholeSVG,pieceSVG,pizza,TOOL,oven,BUILD,blob,rng};
})();
