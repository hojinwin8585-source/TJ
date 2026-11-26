/* 말랑 공주 옷장 그림 (P8-가 더하기 · games.clothes.princessWardrobe) — clothes.js 의 '공주 방'이 씁니다.
   사용 후기 "레벨업이 되면 더 많이 나오는 건데, 공주만큼은 이렇게 하면 안 될까요? 공주가 너무 옷이 없어요ㅠ" →
   공주 방은 1단계부터 옷장이 가득: 드레스 · 망토 · 왕관 · 목걸이 · 귀걸이 · 머리 모양 · 구두 · 손에 드는 것 · 장갑 (종류마다 6가지 이상).
   여기에는 그림과 목록만 있습니다(움직임과 손동작은 clothes.js). 모든 그림은 인형 좌표(viewBox 0 0 240 400)에 맞게 직접 그림:
   - 드레스는 윗옷(bodice) 6가지 × 치마(skirt) 6가지를 맞춘 것. 겹치마 · 주름 그림자 · 왼쪽 위 빛줄기(sheen) · 오른쪽 아래 반사광(rim) · 레이스 단.
   - 보석은 멈춰 있는 하이라이트(깜빡이지 않음). 고르는 카드는 차분한 색(hex), 인형이 입으면 또렷한 색(vivid) — calm.colorPolicy.
   - 입체감은 P19 art.volume 규칙(ART.vol: litAll 덮개, 접지 그림자, 흐림 없음). 새 그라데이션은 만들지 않음(캐릭터 하나 6개 이하).
   ML.PrincessArt(K) 로 만들고, K 는 clothes.js 의 인형 좌표와 그리기 도구입니다. */
(()=>{
'use strict';
const M=window.ML;if(!M)return;
M.PrincessArt=function(K){
const {OL,S3,FOLD,A,line,lerp,scallop,star5,blobs,ARM,HAND,FOOT,COLORS}=K;
const S2=`stroke="${OL}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const HX=/^#[0-9a-f]{6}$/i;
const mix=(a,b,t)=>{if(!HX.test(a||'')||!HX.test(b||''))return a;const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const f1=n=>(+n).toFixed(1);
const GOLD='#F4C95D',GOLDL='#FFEBB0',GOLDD='#D6A23C',PEARL='#FFFDF6',LEAF='#9CCB8F';

/* ---------- colours: the calm choice colours + a few princess ones (white, gold, glass) + hair colours ---------- */
const EXTRA=[
  {en:'white',ko:'하양',hex:'#EEE6E0',light:'#FFFFFF',vivid:'#FFFBF7'},
  {en:'gold',ko:'금색',hex:'#E4C887',light:'#FFF1C9',vivid:'#F7C948'},
  {en:'glass',ko:'유리',hex:'#C3DFEC',light:'#F4FBFE',vivid:'#BDE9F9'},
  {en:'brown hair',ko:'갈색',hex:'#8A5634',light:'#B88158',vivid:'#8A5634',hair:1},
  {en:'black hair',ko:'까만색',hex:'#3D2B29',light:'#6E5450',vivid:'#3D2B29',hair:1},
  {en:'golden hair',ko:'금빛',hex:'#E2AE52',light:'#F7D995',vivid:'#E2AE52',hair:1},
  {en:'red hair',ko:'붉은색',hex:'#BE6A33',light:'#E09B65',vivid:'#BE6A33',hair:1},
  {en:'pink hair',ko:'분홍',hex:'#E39AB4',light:'#F7C9D8',vivid:'#E39AB4',hair:1},
  {en:'lilac hair',ko:'보라',hex:'#AA96DA',light:'#D3C6F2',vivid:'#AA96DA',hair:1}
];
const ALLC=(COLORS||[]).concat(EXTRA);
const colorOf=en=>ALLC.find(c=>c.en===en)||ALLC[0];
/* one colour set for drawing: c (main), l (light trim), dk (fold shade), hl (shine) */
function CO(key,vivid){const k=colorOf(key),c=vivid&&!k.hair?k.vivid:k.hex,l=k.hair?k.light:k.light;return{key:k.en,c,l,dk:mix(c,'#5B3A29',.26),hl:mix(c,'#FFFFFF',.55),hair:!!k.hair}}

/* small drawing helpers */
function starP(x,y,r,f,extra){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.48:r;d+=(i?'L':'M')+f1(x+q*Math.cos(a))+' '+f1(y+q*Math.sin(a))}return `<path d="${d}Z" fill="${f}" ${extra||S2}/>`}
const heartP=(x,y,s,f,extra)=>`<path d="M${x} ${f1(y+s*.9)}C${f1(x-s*1.3)} ${f1(y+s*.1)} ${f1(x-s*.9)} ${f1(y-s*.9)} ${x} ${f1(y-s*.35)}C${f1(x+s*.9)} ${f1(y-s*.9)} ${f1(x+s*1.3)} ${f1(y+s*.1)} ${x} ${f1(y+s*.9)}Z" fill="${f}" ${extra||S2}/>`;
const gem=(x,y,r,f)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S2}/><circle cx="${f1(x-r*.35)}" cy="${f1(y-r*.38)}" r="${f1(Math.max(1,r*.32))}" fill="#fff" opacity=".9"/>`;
const drop=(x,y,r,f)=>`<path d="M${x} ${f1(y-r*1.5)}Q${f1(x+r*1.1)} ${f1(y-r*.1)} ${x} ${f1(y+r)}Q${f1(x-r*1.1)} ${f1(y-r*.1)} ${x} ${f1(y-r*1.5)}Z" fill="${f}" ${S2}/><circle cx="${f1(x-r*.3)}" cy="${f1(y-r*.2)}" r="${f1(Math.max(.9,r*.28))}" fill="#fff" opacity=".9"/>`;
const pearl=(x,y,r)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${PEARL}" stroke="${OL}" stroke-width="1.5"/><circle cx="${f1(x-r*.35)}" cy="${f1(y-r*.35)}" r="${f1(r*.35)}" fill="#fff"/>`;
const bow=(x,y,s,f,rot)=>`<g transform="translate(${x} ${y})${rot?` rotate(${rot})`:''} scale(${s})"><path d="M0 0L-11 -7Q-15 0 -11 7Z" fill="${f}" ${S2}/><path d="M0 0L11 -7Q15 0 11 7Z" fill="${f}" ${S2}/><path d="M-2 2L-6 12M2 2L6 12" stroke="${OL}" stroke-width="4.6" stroke-linecap="round"/><path d="M-2 2L-6 12M2 2L6 12" stroke="${f}" stroke-width="2.2" stroke-linecap="round"/><circle r="3.4" fill="${f}" ${S2}/></g>`;
const flower=(x,y,r,f,mid)=>`<g transform="translate(${f1(x)} ${f1(y)})">${[0,1,2,3,4].map(j=>{const a=-Math.PI/2+j*Math.PI*2/5;return `<circle cx="${f1(r*.62*Math.cos(a))}" cy="${f1(r*.62*Math.sin(a))}" r="${f1(r*.5)}" fill="${f}" stroke="${OL}" stroke-width="1.4"/>`}).join('')}<circle r="${f1(r*.36)}" fill="${mid||GOLD}" stroke="${OL}" stroke-width="1.2"/></g>`;
const rose=(x,y,r,f,d)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S2}/><path d="M${f1(x-r*.5)} ${f1(y)}Q${f1(x)} ${f1(y-r*.7)} ${f1(x+r*.45)} ${f1(y-r*.1)}Q${f1(x+r*.2)} ${f1(y+r*.5)} ${f1(x-r*.2)} ${f1(y+r*.2)}" stroke="${d}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
const tw=(x,y,r,f)=>A.twinkle(x,y,r,f||'#fff');

/* ============================== gowns: bodice × skirt ============================== */
const WAIST='Q102 236 87 226';
/* a skirt's shading: soft fold wedges, fold lines, a shine on the upper left, reflected light on the lower right */
function folds(C,H,pts,y0){
  let s='';for(let i=0;i+1<pts.length;i+=2){const a=pts[i],b=pts[i+1],my=(y0+H)/2;s+=`<path d="M${a[0]} ${y0}Q${f1(a[0]*.4+a[1]*.6)} ${my} ${a[1]} ${H}L${b[1]} ${H}Q${f1(b[0]*.4+b[1]*.6)} ${my} ${b[0]} ${y0}Z" fill="${C.dk}" opacity=".16"/>`}
  pts.forEach(([a,b])=>{s+=`<path d="M${a} ${y0+4}Q${f1(a*.4+b*.6)} ${f1((y0+H)/2)} ${b} ${H-3}" ${FOLD}/>`});return s;
}
const sheen=(pts,w,op)=>`<path d="${pts}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
const rimL=d=>A.vol.off?'':`<path d="${d}" stroke="#fff" stroke-opacity=".32" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const pearlRow=(x0,x1,y,n,sag)=>Array.from({length:n},(_,i)=>{const t=n>1?i/(n-1):.5,x=x0+(x1-x0)*t;return pearl(x,y+sag*4*t*(1-t),2.2)}).join('');
const SK={
  /* a big bell ball gown: petticoat lace peeking out, folds, a lace band and pearls on the hem */
  ball(C){const H=330;
    return `<path d="M84 230Q120 240 156 230C182 256 206 300 210 338${scallop(30,210,338,10,7)}C34 300 58 256 84 230Z" fill="${C.l}" ${S3}/>${Array.from({length:12},(_,i)=>`<circle cx="${f1(40+i*14.6)}" cy="342" r="1.8" fill="#fff" opacity=".95"/>`).join('')}
      <path d="M88 228Q120 236 152 228C174 248 198 292 202 ${H}${scallop(38,202,H,7,10)}C42 292 66 248 88 228Z" fill="${C.c}" ${S3}/>
      ${folds(C,H,[[100,60],[108,84],[124,134],[132,156],[142,180],[150,196]],236)}
      <path d="M46 ${H-11}Q120 ${H-1} 194 ${H-11}" stroke="${C.l}" stroke-width="5" fill="none" stroke-linecap="round"/>${pearlRow(52,188,H-8,9,5)}
      ${sheen('M98 242C84 266 70 296 62 318',7,.34)}${sheen('M112 246C106 272 100 296 98 314',3,.3)}${rimL(`M160 240C182 266 196 296 199 ${H-8}`)}`},
  /* three ruffle tiers */
  tier(C){const T=[[60,180,290,38,202,334,7],[72,168,258,54,186,300,6],[88,152,228,70,170,268,5]];let s='';
    T.forEach(([xl,xr,yt,bl,br,yb,n],i)=>{s+=`<path d="M${xl} ${yt}Q120 ${yt+8} ${xr} ${yt}Q${f1(xr+(br-xr)*.4)} ${f1(yt+(yb-yt)*.5)} ${br} ${yb}${scallop(bl,br,yb,n,9)}Q${f1(xl+(bl-xl)*.6)} ${f1(yt+(yb-yt)*.5)} ${xl} ${yt}Z" fill="${C.c}" ${S3}/>
      <path d="M${bl+6} ${yb-6}Q120 ${yb+2} ${br-6} ${yb-6}" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[.22,.4,.6,.78].map(t=>{const x=xl+(xr-xl)*t,xb=bl+(br-bl)*t;return `<path d="M${f1(x)} ${yt+5}Q${f1((x+xb)/2)} ${f1((yt+yb)/2)} ${f1(xb)} ${yb-4}" ${FOLD}/>`}).join('')}
      ${i<2?'':''}`;if(i<2){const u=T[i+1];s+=`<path d="M${u[3]+2} ${u[5]-2}Q120 ${u[5]+10} ${u[4]-2} ${u[5]-2}L${u[4]+4} ${u[5]+8}Q120 ${u[5]+20} ${u[3]-4} ${u[5]+8}Z" fill="${C.dk}" opacity=".18"/>`}});
    return s+sheen('M96 236C88 252 80 264 76 280',5,.34)+sheen('M74 300C66 312 60 322 56 330',5,.3)+rimL('M178 290C188 304 196 316 199 326')},
  /* an overskirt swagged up with two roses, the light underskirt shows in front */
  swag(C){const H=332;
    return `<path d="M88 228Q120 236 152 228C174 248 198 292 202 ${H}${scallop(38,202,H,8,8)}C42 292 66 248 88 228Z" fill="${C.l}" ${S3}/>
      ${[270,292,314].map(y=>`<path d="M${f1(120-(y-226)*.62)} ${y}Q120 ${y+8} ${f1(120+(y-226)*.62)} ${y}" stroke="${C.c}" stroke-opacity=".45" stroke-width="3" fill="none"/>`).join('')}
      <path d="M88 228Q120 236 152 228C172 248 194 288 202 ${H}Q190 322 178 330Q160 300 138 268Q128 252 120 250Q112 252 102 268Q80 300 62 330Q50 322 38 ${H}C46 288 68 248 88 228Z" fill="${C.c}" ${S3}/>
      ${folds(C,326,[[96,52],[106,74],[140,170],[148,190]],234)}
      <path d="M104 262Q86 294 66 326M136 262Q154 294 174 326" ${FOLD}/>
      ${rose(102,266,8,C.hl,C.dk)}${rose(138,266,8,C.hl,C.dk)}<path d="M96 272L90 284L100 280ZM144 272L150 284L140 280Z" fill="${LEAF}" ${S2}/>
      ${sheen('M92 242C80 262 70 288 60 312',6,.34)}${rimL('M160 240C180 264 194 292 198 320')}`},
  /* petals: side petals, then the front one, with piped edges */
  petal(C){const H=334;
    const p=(d,f)=>`<path d="${d}" fill="${f}" ${S3}/>`;
    return `<path d="M88 228Q120 236 152 228C174 250 196 292 200 ${H}${scallop(40,200,H,8,7)}C44 292 66 250 88 228Z" fill="${C.l}" ${S3}/>
      ${p('M88 228C66 256 42 298 36 328Q60 346 94 332Q104 290 114 234Z',C.c)}${p('M152 228C174 256 198 298 204 328Q180 346 146 332Q136 290 126 234Z',C.c)}
      <path d="M44 326Q64 338 90 328M196 326Q176 338 150 328" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${p('M106 234C96 270 88 310 92 336Q120 352 148 336C152 310 144 270 134 234Q120 240 106 234Z',mix(C.c,'#FFFFFF',.12))}
      <path d="M98 334Q120 346 142 334" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M114 240Q106 290 104 332M126 240Q134 290 136 332M78 262Q64 296 58 322M162 262Q176 296 182 322" ${FOLD}/>
      <path d="M138 246Q146 290 144 330L134 334Q138 290 130 248Z" fill="${C.dk}" opacity=".16"/>
      ${sheen('M88 244C74 270 60 298 52 318',6,.34)}${sheen('M108 246C102 280 98 306 98 324',3,.3)}${rimL('M172 262C186 284 196 304 199 322')}`},
  /* clouds of tulle with still little stars */
  tulle(C){const H=334;
    return `<path d="M86 230Q120 238 154 230C184 252 210 296 214 ${H}${scallop(26,214,H,9,12)}C30 296 56 252 86 230Z" fill="${C.l}" ${S3}/>
      <path d="M88 228Q120 236 152 228C176 250 198 288 202 318${scallop(38,202,318,7,13)}C42 288 64 250 88 228Z" fill="${C.c}" ${S3}/>
      <path d="M90 228Q120 236 150 228C164 244 178 266 182 288${scallop(58,182,288,5,12)}C62 266 76 244 90 228Z" fill="${C.hl}" ${S3}/>
      ${[[70,300],[106,310],[150,306],[178,312],[90,272],[132,276],[118,296],[60,326],[184,330]].map(([x,y],i)=>i%3?tw(x,y,4.5,'#fff'):starP(x,y,5,GOLDL,`stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"`)).join('')}
      <path d="M104 236Q96 262 92 286M136 236Q144 262 148 286M78 296Q70 310 64 320M162 296Q170 310 176 320" ${FOLD}/>
      ${sheen('M94 240C86 254 78 268 74 282',5,.36)}${rimL('M166 300C176 310 186 318 190 326')}`},
  /* a bubble skirt with picked-up puffs and little bows */
  bubble(C){const H=332;let s=`<path d="M88 228Q120 236 152 228C174 248 198 292 202 ${H}${scallop(38,202,H,8,8)}C42 292 66 248 88 228Z" fill="${C.c}" ${S3}/>`;
    const puff=(x,y,rx,ry)=>`<path d="M${x-rx} ${y}Q${x-rx} ${y-ry*1.4} ${x} ${y-ry*1.2}Q${x+rx} ${y-ry*1.4} ${x+rx} ${y}Q${x+rx*.9} ${y+ry} ${x} ${y+ry}Q${x-rx*.9} ${y+ry} ${x-rx} ${y}Z" fill="${mix(C.c,'#FFFFFF',.14)}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x-rx*.7} ${y+ry*.55}Q${x} ${y+ry*.95} ${x+rx*.7} ${y+ry*.55}" stroke="${C.dk}" stroke-opacity=".3" stroke-width="3" fill="none"/><path d="M${x-rx*.55} ${y-ry*.6}Q${x-rx*.2} ${y-ry*.95} ${x+rx*.1} ${y-ry*.9}" stroke="#fff" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    [[98,264,18,8],[142,264,18,8],[120,262,13,8]].forEach(q=>{s+=puff(...q)});
    [[66,302,19,9],[101,304,19,9],[139,304,19,9],[174,302,19,9]].forEach(q=>{s+=puff(...q)});
    s+=[[108,274],[132,274],[82,312],[120,314],[158,312]].map(([x,y])=>bow(x,y,.55,C.l)).join('');
    s+=`<path d="M46 ${H-6}Q120 ${H+4} 194 ${H-6}" stroke="${C.l}" stroke-width="5" fill="none" stroke-linecap="round"/>`+rimL('M162 244C182 268 194 294 198 320');
    return s}
};
/* sleeves (drawn in the arm groups, so they move with the arms) */
const SL={
  puff(s,C){const [x,y]=ARM[s].s,k=s==='l'?-1:1;return `<ellipse cx="${x+k*3}" cy="${y+5}" rx="18" ry="16" fill="${C.c}" ${S3}/><path d="M${x+k*-8} ${y-7}Q${x+k*-2} ${y+6} ${x+k*-6} ${y+18}M${x+k*3} ${y-10}Q${x+k*6} ${y+4} ${x+k*3} ${y+20}M${x+k*12} ${y-6}Q${x+k*16} ${y+6} ${x+k*12} ${y+17}" ${FOLD}/><path d="M${x-10+k*3} ${y+18}Q${x+k*3} ${y+23} ${x+10+k*3} ${y+18}" stroke="${C.l}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M${x+k*3-9} ${y-4}Q${x+k*3-4} ${y-9} ${x+k*3+2} ${y-9}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`},
  cap(s,C){const [x,y]=ARM[s].s,k=s==='l'?-1:1;return `<ellipse cx="${x+k*2}" cy="${y+2}" rx="14" ry="11" fill="${C.c}" ${S3}/><path d="M${x+k*2-9} ${y+9}Q${x+k*2} ${y+13} ${x+k*2+9} ${y+9}" stroke="${C.l}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`},
  off(s,C){const a=ARM[s],p=lerp(a.s,a.h,.16),k=s==='l'?-1:1,[x,y]=p;return `<path d="M${x-16} ${y-7}Q${x} ${y-12} ${x+16} ${y-7}L${x+17} ${y+5}${scallop(x-17,x+17,y+5,4,6)}Z" fill="${C.c}" ${S3}/><path d="M${x-15} ${y+1}Q${x} ${y-3} ${x+15} ${y+1}" stroke="${C.l}" stroke-width="3" fill="none"/><path d="M${x+k*-6} ${y-6}L${x+k*-7} ${y+8}M${x+k*4} ${y-7}L${x+k*5} ${y+8}" ${FOLD}/>`},
  long(s,C){const a=ARM[s],k=s==='l'?-1:1,p=lerp(a.s,a.h,.86),q=lerp(a.s,a.h,.97);return line(a.s,p,19,C.c,5)+`<path d="M${f1(a.s[0]+k*4)} ${a.s[1]+10}L${f1(p[0]+k*4)} ${f1(p[1]-6)}" ${FOLD}/>`+line(p,q,21,C.l,5)+`<ellipse cx="${a.s[0]+k*2}" cy="${a.s[1]+3}" rx="13" ry="11" fill="${C.c}" ${S3}/>${[0,1,2].map(i=>`<circle cx="${f1(p[0]-6+i*6)}" cy="${f1(p[1]+5)}" r="1.6" fill="#fff"/>`).join('')}`},
  flutter(s,C){const [x,y]=ARM[s].s,k=s==='l'?-1:1;return `<path d="M${x-12} ${y-6}Q${x} ${y-12} ${x+12} ${y-6}L${x+k*4+14} ${y+20}${scallop(x+k*4-14,x+k*4+14,y+20,4,6)}Z" fill="${C.c}" ${S3}/><path d="M${x+k*4-10} ${y+17}Q${x+k*4} ${y+21} ${x+k*4+10} ${y+17}" stroke="${C.l}" stroke-width="3" fill="none"/><path d="M${x} ${y-6}L${x+k*3} ${y+18}" ${FOLD}/>`},
  none(){return''}
};
const sash=(C,center)=>`<path d="M86 220Q120 232 154 220L154 230Q138 238 120 244Q102 238 86 230Z" fill="${C.l}" ${S3}/>${center||''}`;
const BODY_BASE='L157 184L153 226Q138 236 120 242'+WAIST+'L83 184';
const BD={
  /* classic princess: round neck, big puff sleeves, a light front panel with pearl buttons */
  puff(C){return{sleeve:'puff',torso:`<path d="M92 161Q120 174 148 161Q158 166 157 184L153 226Q138 236 120 242${WAIST}L83 184Q82 166 92 161Z" fill="${C.c}" ${S3}/>
    <path d="M110 174Q120 178 130 174L128 230L120 238L112 230Z" fill="${C.l}" opacity=".7"/>${[188,202,216].map(y=>pearl(120,y,2.6)).join('')}
    <path d="M92 164Q120 177 148 164" stroke="${C.l}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M146 176Q152 200 150 222L142 228Q146 200 141 178Z" fill="${C.dk}" opacity=".2"/>
    ${sheen('M94 178Q92 196 94 214',4,.36)}${sash(C,bow(120,236,.95,C.l))}`}},
  /* sweetheart, no straps, a pearl edge and a jewel */
  heart(C){return{sleeve:'none',torso:`<path d="M84 184Q85 170 100 168Q113 168 120 179Q127 168 140 168Q155 170 156 184L153 226Q138 236 120 242${WAIST}Z" fill="${C.c}" ${S3}/>
    ${pearlRow(88,116,174,5,-2)}${pearlRow(124,152,174,5,-2)}<path d="M98 186L104 224M142 186L136 224" ${FOLD}/>${drop(120,198,6,C.l)}
    <path d="M146 184Q150 204 148 222L140 228Q144 204 140 186Z" fill="${C.dk}" opacity=".2"/>${sheen('M92 186Q90 202 92 216',4,.36)}${sash(C,gem(120,232,4.2,C.hl))}`}},
  /* off the shoulder: a ruffle band across, ruffles over the arms */
  off(C){return{sleeve:'off',torso:`<path d="M83 182Q120 190 157 182${'L153 226Q138 236 120 242'+WAIST}Z" fill="${C.c}" ${S3}/>
    <path d="M80 174Q120 184 160 174L160 186Q120 196 80 186Z" fill="${C.l}" ${S3}/>${scallop(80,160,186,8,5).length?`<path d="M160 186${scallop(80,160,186,8,5)}" stroke="${OL}" stroke-width="2" fill="none" opacity=".5"/>`:''}
    <path d="M106 196Q104 214 108 232M134 196Q136 214 132 232" ${FOLD}/><path d="M146 192Q152 208 150 222L142 228Q146 206 141 194Z" fill="${C.dk}" opacity=".2"/>${sheen('M92 194Q90 206 92 218',4,.36)}${sash(C,rose(120,233,5.5,C.hl,C.dk))}`}},
  /* square neck, long sleeves with lace cuffs */
  long(C){return{sleeve:'long',torso:`<path d="M92 161L106 163L106 176Q120 180 134 176L134 163L148 161Q158 166 157 184L153 226Q138 236 120 242${WAIST}L83 184Q82 166 92 161Z" fill="${C.c}" ${S3}/>
    <path d="M106 176Q120 180 134 176" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M120 182L120 236" stroke="${C.l}" stroke-width="3" opacity=".8"/>${[190,206,222].map(y=>gem(120,y,2.4,C.hl)).join('')}
    <path d="M104 188Q102 212 106 232M136 188Q138 212 134 232" ${FOLD}/><path d="M146 176Q152 200 150 222L142 228Q146 200 141 178Z" fill="${C.dk}" opacity=".2"/>${sheen('M94 178Q92 196 94 214',4,.36)}${sash(C)}`}},
  /* a big bow on the chest, cap sleeves */
  bow(C){return{sleeve:'cap',torso:`<path d="M92 161L104 163Q120 172 136 163L148 161Q158 166 157 184L153 226Q138 236 120 242${WAIST}L83 184Q82 166 92 161Z" fill="${C.c}" ${S3}/>
    <path d="M104 164Q120 174 136 164" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M104 196Q102 214 106 232M136 196Q138 214 134 232" ${FOLD}/>
    <path d="M146 176Q152 200 150 222L142 228Q146 200 141 178Z" fill="${C.dk}" opacity=".2"/>${sheen('M94 178Q92 196 94 214',4,.36)}${sash(C)}${bow(120,188,1.55,C.l)}`}},
  /* a V neck with criss-cross lacing and fluttery sleeves */
  lace(C){return{sleeve:'flutter',torso:`<path d="M92 161Q106 166 112 172L120 190L128 172Q134 166 148 161Q158 166 157 184L153 226Q138 236 120 242${WAIST}L83 184Q82 166 92 161Z" fill="${C.c}" ${S3}/>
    <path d="M112 172L120 190L128 172" stroke="${C.l}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M112 196L128 206M128 196L112 206M112 208L128 218M128 208L112 218M113 220L127 228M127 220L113 228" stroke="${C.l}" stroke-width="2.6" stroke-linecap="round"/>
    ${[196,208,220].map(y=>`<circle cx="111" cy="${y}" r="1.7" fill="${GOLD}"/><circle cx="129" cy="${y}" r="1.7" fill="${GOLD}"/>`).join('')}<path d="M146 176Q152 200 150 222L142 228Q146 200 141 178Z" fill="${C.dk}" opacity=".2"/>${sheen('M94 178Q92 196 94 214',4,.36)}${sash(C)}`}}
};
/* patterns (level 3 sparkle trims) scattered inside the bell of any skirt */
const PAT_PTS=[[104,256],[136,256],[88,278],[120,280],[152,278],[74,300],[104,302],[136,302],[166,300],[62,320],[92,322],[120,324],[148,322],[178,320]];
const PATS={
  stars:{ko:'별 무늬',en:'stars',d:(C)=>PAT_PTS.map(([x,y],i)=>starP(x,y,i%2?4.2:5.4,GOLDL,`stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"`)).join('')},
  hearts:{ko:'하트 무늬',en:'hearts',d:(C)=>PAT_PTS.map(([x,y],i)=>heartP(x,y,i%2?3.6:4.6,'#FFFFFF',`stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"`)).join('')},
  flowers:{ko:'꽃 무늬',en:'flowers',d:(C)=>PAT_PTS.map(([x,y],i)=>flower(x,y,i%2?5:6.4,i%3?'#FFFFFF':C.l,GOLD)).join('')},
  pearls:{ko:'진주 무늬',en:'pearls',d:()=>PAT_PTS.map(([x,y],i)=>pearl(x,y,i%2?2.4:3.2)).join('')+`<path d="M62 314Q120 334 178 314" stroke="${PEARL}" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round" fill="none"/>`},
  sparkles:{ko:'반짝이',en:'sparkles',d:()=>PAT_PTS.map(([x,y],i)=>tw(x,y,i%2?4.5:6.5,i%3?'#FFFFFF':GOLDL)).join('')},
  bows:{ko:'리본 무늬',en:'bows',d:(C)=>PAT_PTS.filter((_,i)=>i%2===0||i>8).map(([x,y])=>bow(x,y,.5,'#FFFFFF')).join('')}
};
const PAT_IDS=Object.keys(PATS);
/* a whole gown (skirt / bodice / sleeves). C is the bodice colour, C2 the skirt colour (the same unless mixed) */
function gown(b,sk,C,C2,pat){
  C2=C2||C;const B=BD[b]||BD.puff,bb=B(C),sl=SL[bb.sleeve]||SL.none;
  const skirt=(SK[sk]||SK.ball)(C2)+(pat&&PATS[pat]?`<g class="cl-pat">${PATS[pat].d(C2)}</g>`:'');
  return{skirt,torso:bb.torso,armL:sl('l',C),armR:sl('r',C),back:`<ellipse cx="120" cy="344" rx="92" ry="9" fill="${OL}" opacity=".1"/>`};
}

/* ============================== capes (behind the body, a clasp in front) ============================== */
const CAPE_BACK='M92 164Q120 154 148 164C176 196 208 270 222 344Q120 362 18 344C32 270 64 196 92 164Z';
const CAPES=[
  {id:'royal',ko:'왕실 망토',en:'royal cape',cols:['red','purple','blue','pink'],d:C=>({back:`<path d="${CAPE_BACK}" fill="${C.c}" ${S3}/><path d="M24 336Q120 354 216 336L220 346Q120 364 20 346Z" fill="${PEARL}" ${S3}/>${[40,70,100,130,160,190].map((x,i)=>`<path d="M${x} ${345+(i%2)*2}l0 5" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
      <path d="M60 220Q46 280 36 330M180 220Q194 280 204 330" ${FOLD}/><path d="M178 210Q200 270 212 334L200 338Q190 280 170 216Z" fill="${C.dk}" opacity=".2"/>${sheen('M70 200Q54 250 44 300',6,.3)}`,
    collar:`<path d="M94 168Q120 180 146 168" stroke="${OL}" stroke-width="5" fill="none"/><path d="M94 168Q120 180 146 168" stroke="${GOLD}" stroke-width="2.6" fill="none"/>${gem(94,168,4.5,GOLD)}${gem(146,168,4.5,GOLD)}`}),vb:'14 150 212 214'},
  {id:'capelet',ko:'짧은 망토',en:'capelet',cols:['sky blue','pink','mint','purple'],d:C=>({back:`<path d="M90 164Q120 154 150 164C170 180 186 210 190 238${scallop(50,190,238,5,9)}C54 210 70 180 90 164Z" fill="${C.c}" ${S3}/><path d="M66 208Q60 222 58 234M174 208Q180 222 182 234" ${FOLD}/>${sheen('M72 190Q64 204 60 218',5,.3)}`,
    collar:bow(120,170,1.25,C.l)}),vb:'40 150 160 104'},
  {id:'sheer',ko:'반짝 망토',en:'sparkly cape',cols:['purple','sky blue','pink','mint'],d:C=>({back:`<path d="${CAPE_BACK}" fill="${C.l}" fill-opacity=".85" ${S3}/>${[[44,300],[64,250],[190,290],[176,240],[30,334],[210,330],[200,250],[40,270]].map(([x,y],i)=>i%2?tw(x,y,5,C.c):starP(x,y,5,GOLDL,`stroke="${OL}" stroke-width="1.2" stroke-linejoin="round"`)).join('')}<path d="M60 220Q46 280 36 330M180 220Q194 280 204 330" ${FOLD}/>`,
    collar:pearl(120,172,4)}),vb:'14 150 212 214'},
  {id:'starcape',ko:'별 망토',en:'star cape',cols:['blue','purple','magenta','red'],d:C=>({back:`<path d="M92 164Q120 154 148 164C176 196 208 270 222 344${scallop(18,222,344,8,9)}C32 270 64 196 92 164Z" fill="${C.c}" ${S3}/>${[[40,310],[60,262],[78,220],[200,310],[182,262],[164,220],[30,338],[212,338]].map(([x,y])=>starP(x,y,6,GOLD)).join('')}<path d="M178 210Q200 270 212 334L200 338Q190 280 170 216Z" fill="${C.dk}" opacity=".2"/>`,
    collar:starP(120,172,7,GOLD)}),vb:'14 150 212 214'},
  {id:'petalcape',ko:'꽃잎 망토',en:'petal cape',cols:['pink','yellow','mint','orange'],d:C=>({back:`<path d="M92 164Q120 154 148 164C176 196 208 270 222 340Q206 360 186 346Q170 362 150 350Q134 364 120 352Q106 364 90 350Q70 362 54 346Q34 360 18 340C32 270 64 196 92 164Z" fill="${C.c}" ${S3}/><path d="M28 336Q40 346 54 340M66 344Q78 352 90 346M186 340Q198 346 212 336M150 346Q162 352 174 344" stroke="${C.l}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M60 220Q46 280 36 330M180 220Q194 280 204 330" ${FOLD}/>`,
    collar:flower(120,170,9,C.l,GOLD)}),vb:'14 150 212 214'},
  {id:'heartcape',ko:'하트 망토',en:'heart cape',cols:['red','pink','purple','sky blue'],d:C=>({back:`<path d="${CAPE_BACK}" fill="${C.c}" ${S3}/>${blobs(Array.from({length:13},(_,i)=>{const t=i/12;return[22+t*196,344+Math.sin(t*Math.PI)*12,7]}),C.l,3.5)}<path d="M178 210Q200 270 212 334L200 338Q190 280 170 216Z" fill="${C.dk}" opacity=".2"/>${sheen('M70 200Q54 250 44 300',6,.3)}`,
    collar:heartP(120,170,8,C.l)}),vb:'14 150 212 220'}
];

/* ============================== crowns and tiaras (on the head) ============================== */
const CROWNS=[
  {id:'crown',ko:'왕관',en:'crown',cols:['pink','sky blue','purple','red'],d:C=>({hat:`<g transform="translate(120 40)"><path d="M-36 -4L-42 -32L-24 -14L-12 -40L0 -16L12 -40L24 -14L42 -32L36 -4Q0 -12 -36 -4Z" fill="${GOLD}" ${S3}/><path d="M-38 6Q0 -4 38 6L36 -6Q0 -14 -36 -6Z" fill="${GOLDD}" ${S3}/>${pearl(-42,-33,4.2)}${pearl(-12,-41,4.2)}${pearl(12,-41,4.2)}${pearl(42,-33,4.2)}${gem(0,-2,6.5,C.c)}${gem(-22,0,4.2,C.l)}${gem(22,0,4.2,C.l)}${drop(0,-24,4.5,C.c)}<path d="M-30 -12L-34 -26" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/></g>`}),vb:'70 -8 100 62'},
  {id:'tiara',ko:'티아라',en:'tiara',cols:['sky blue','pink','purple','mint'],d:C=>({hat:`<path d="M74 56Q120 22 166 56" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M74 56Q120 22 166 56" stroke="${GOLD}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M90 42Q96 22 110 30Q104 36 108 42M150 42Q144 22 130 30Q136 36 132 42" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M90 42Q96 22 110 30Q104 36 108 42M150 42Q144 22 130 30Q136 36 132 42" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${drop(120,22,8,C.c)}${gem(98,26,3.2,C.l)}${gem(142,26,3.2,C.l)}${pearl(84,46,3)}${pearl(156,46,3)}${tw(132,12,4)}`}),vb:'66 0 108 64'},
  {id:'flowers',ko:'꽃 화관',en:'flower crown',cols:['pink','yellow','purple','orange'],d:C=>({hat:`<path d="M62 70Q66 28 120 26Q174 28 178 70" stroke="#7FB277" stroke-width="5" fill="none" stroke-linecap="round"/>${[[68,58],[80,40],[100,30],[120,27],[140,30],[160,40],[172,58]].map(([x,y],i)=>`<path d="M${x} ${y}l${i%2?7:-7} ${i%2?-6:6}q-4 2 -8 -2z" fill="${LEAF}" stroke="${OL}" stroke-width="1.4"/>`+flower(x+(i%2?4:-4),y-2,i===3?11:8.5,i%2?C.l:C.c,i===3?GOLD:'#FFF2B8')).join('')}`}),vb:'52 8 136 72'},
  {id:'startiara',ko:'별 티아라',en:'star tiara',cols:['yellow','sky blue','pink','purple'],d:C=>({hat:`<path d="M70 58Q120 30 170 58" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M70 58Q120 30 170 58" stroke="${GOLD}" stroke-width="5.5" fill="none" stroke-linecap="round"/>${starP(120,24,16,GOLD,S3)}${gem(120,26,4.6,C.c)}${starP(92,38,7,GOLDL)}${starP(148,38,7,GOLDL)}${gem(80,50,2.6,C.l)}${gem(160,50,2.6,C.l)}`}),vb:'62 2 116 68'},
  {id:'heartcrown',ko:'하트 왕관',en:'heart crown',cols:['red','pink','magenta','purple'],d:C=>({hat:`<g transform="translate(120 42)"><path d="M-34 0Q0 -8 34 0L32 -14Q0 -22 -32 -14Z" fill="${GOLD}" ${S3}/>${[-22,0,22].map((x,i)=>heartP(x,i===1?-30:-24,i===1?11:8,i===1?C.c:GOLD,S3)).join('')}${gem(-12,-8,3,C.l)}${gem(12,-8,3,C.l)}${pearl(0,-8,2.6)}</g>`}),vb:'76 0 88 52'},
  {id:'circlet',ko:'이마 장식',en:'circlet',cols:['mint','purple','sky blue','pink'],d:C=>({hat:`<path d="M60 74Q64 34 120 34Q176 34 180 74" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 74Q64 34 120 34Q176 34 180 74" stroke="${GOLD}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M104 40Q112 50 120 52Q128 50 136 40" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M104 40Q112 50 120 52Q128 50 136 40" stroke="${GOLD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${drop(120,60,6.5,C.c)}${pearl(104,40,2.8)}${pearl(136,40,2.8)}${gem(120,36,4,C.l)}`}),vb:'54 24 132 58'}
];
/* ============================== necklaces (at the neck) and earrings (at the ears) ============================== */
const chainY=(x,y0,sag)=>y0+sag*(1-Math.pow((x-120)/20,2));
const NECKS=[
  {id:'pearls',ko:'진주 목걸이',en:'pearl necklace',cols:['pink','sky blue','purple','mint'],d:C=>({neck:`${[-20,-15,-10,-5,0,5,10,15,20].map(x=>pearl(120+x,chainY(120+x,164,14),3)).join('')}${drop(120,186,5.5,C.c)}`}),vb:'92 152 56 46'},
  {id:'locket',ko:'하트 목걸이',en:'heart locket',cols:['red','pink','purple','sky blue'],d:C=>({neck:`<path d="M102 162Q120 186 138 162" stroke="${OL}" stroke-width="3.6" fill="none"/><path d="M102 162Q120 186 138 162" stroke="${GOLD}" stroke-width="1.8" fill="none"/>${heartP(120,186,8,C.c,S2)}<path d="M116 182Q118 180 120 181" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>`}),vb:'94 152 52 50'},
  {id:'collar',ko:'보석 목걸이',en:'jewel collar',cols:['sky blue','mint','purple','red'],d:C=>({neck:`<path d="M100 164Q120 182 140 164" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M100 164Q120 182 140 164" stroke="${GOLD}" stroke-width="5" fill="none" stroke-linecap="round"/>${[-16,-8,0,8,16].map((x,i)=>i===2?drop(120,180,5,C.c):gem(120+x,f1(chainY(120+x,165,8)+.5),i%2?3:3.6,i%2?C.l:C.c)).join('')}`}),vb:'94 154 52 40'},
  {id:'choker',ko:'별 리본 목걸이',en:'star choker',cols:['purple','pink','blue','red'],d:C=>({neck:`<path d="M110 156Q120 160 130 156L130 162Q120 166 110 162Z" fill="${C.c}" ${S2}/>${starP(120,174,7.5,GOLD)}<path d="M120 163V167" stroke="${OL}" stroke-width="2"/>`}),vb:'100 146 40 40'},
  {id:'daisy',ko:'꽃 목걸이',en:'flower chain',cols:['yellow','pink','sky blue','orange'],d:C=>({neck:[-18,-9,0,9,18].map((x,i)=>flower(120+x,chainY(120+x,164,12),i===2?6:4.6,i%2?'#FFFFFF':C.c,GOLD)).join('')}),vb:'94 152 52 40'},
  {id:'drops',ko:'물방울 목걸이',en:'drop necklace',cols:['mint','sky blue','pink','purple'],d:C=>({neck:`<path d="M102 162Q120 180 138 162" stroke="${OL}" stroke-width="3.4" fill="none"/><path d="M102 162Q120 180 138 162" stroke="${GOLD}" stroke-width="1.7" fill="none"/>${drop(108,178,4,C.l)}${drop(132,178,4,C.l)}${drop(120,186,6,C.c)}`}),vb:'94 152 52 46'}
];
const EAR=[[55,124],[185,124]];
const ears=f=>EAR.map(([x,y],i)=>`<g transform="translate(${x} ${y})">${f(i)}</g>`).join('');
const EARS=[
  {id:'pearldrop',ko:'진주 귀걸이',en:'pearl earrings',cols:['pink','purple','sky blue','mint'],d:C=>({ear:ears(()=>`<circle r="2.6" fill="${GOLD}" ${S2}/><path d="M0 2V8" stroke="${OL}" stroke-width="2"/>${pearl(0,13,5)}`)}),vb:'44 112 152 34'},
  {id:'gemdrop',ko:'보석 귀걸이',en:'gem earrings',cols:['sky blue','red','purple','mint'],d:C=>({ear:ears(()=>`${gem(0,0,3.6,C.l)}${drop(0,14,6,C.c)}`)}),vb:'44 112 152 34'},
  {id:'hoops',ko:'동그라미 귀걸이',en:'hoop earrings',cols:['yellow','pink','sky blue','purple'],d:C=>({ear:ears(()=>`<circle cy="11" r="9" fill="none" stroke="${OL}" stroke-width="5"/><circle cy="11" r="9" fill="none" stroke="${GOLD}" stroke-width="2.6"/>${gem(0,20,3,C.c)}`)}),vb:'44 112 152 34'},
  {id:'hearts',ko:'하트 귀걸이',en:'heart earrings',cols:['red','pink','magenta','purple'],d:C=>({ear:ears(()=>`<circle r="2.4" fill="${GOLD}" ${S2}/><path d="M0 2V6" stroke="${OL}" stroke-width="2"/>${heartP(0,13,6.5,C.c)}`)}),vb:'44 112 152 34'},
  {id:'stars',ko:'별 귀걸이',en:'star earrings',cols:['yellow','sky blue','pink','mint'],d:C=>({ear:ears(()=>`<circle r="2.4" fill="${GOLD}" ${S2}/><path d="M0 2V6" stroke="${OL}" stroke-width="2"/>${starP(0,13,8,C.c)}`)}),vb:'44 112 152 34'},
  {id:'chandelier',ko:'샹들리에 귀걸이',en:'chandelier earrings',cols:['purple','sky blue','pink','red'],d:C=>({ear:ears(()=>`${gem(0,0,3,GOLD)}<path d="M-7 6Q0 2 7 6" stroke="${OL}" stroke-width="3.6" fill="none"/><path d="M-7 6Q0 2 7 6" stroke="${GOLD}" stroke-width="1.8" fill="none"/>${drop(-7,13,3.4,C.l)}${drop(7,13,3.4,C.l)}${drop(0,17,4.6,C.c)}`)}),vb:'44 112 152 34'}
];

/* ============================== hairstyles: nape (behind the body), back (behind the face), front (bangs) ============================== */
const CAP='M60 124C48 66 84 26 120 26C156 26 192 66 180 124Z';
const hl=(d,h)=>`<path d="${d}" stroke="${h}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
const SWEPT=(c)=>`<path d="M58 110C52 58 84 30 120 30C156 30 188 58 182 110C178 90 170 78 158 70C146 84 120 86 104 66C94 80 72 92 58 110Z" fill="${c}" ${S3}/>`;
const HAIRS=[
  {id:'long',ko:'긴 웨이브 머리',en:'long wavy hair',cols:['brown hair','golden hair','black hair','red hair','pink hair','lilac hair'],d:C=>{const cs=[];for(let i=0;i<=12;i++){const t=i/12;cs.push([52-7*Math.sin(t*10),102+t*126,17]);cs.push([188+7*Math.sin(t*10),102+t*126,17])}
    return{nape:blobs(cs,C.c)+`<path d="M58 110L52 226L80 230L84 140ZM182 110L188 226L160 230L156 140Z" fill="${C.c}"/>`+hl('M48 140Q40 170 48 200',C.l)+hl('M192 140Q200 170 192 200',C.l),back:`<path d="${CAP}" fill="${C.c}" ${S3}/>`,
      front:SWEPT(C.c)+hl('M90 46Q106 36 124 36',C.l)+hl('M150 50Q164 58 172 74',C.l)}},vb:'26 18 188 220'},
  {id:'bun',ko:'올림 머리',en:'high bun',cols:['black hair','brown hair','golden hair','red hair','lilac hair','pink hair'],d:C=>({nape:'',
    back:blobs([[120,14,22]],C.c)+`<path d="M104 12Q120 4 136 12" stroke="${C.l}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><path d="M100 28Q120 36 140 28" stroke="${OL}" stroke-width="2.4" fill="none" opacity=".5"/><path d="${CAP}" fill="${C.c}" ${S3}/>`,
    front:`<path d="M58 104C52 56 84 30 120 30C156 30 188 56 182 104C176 82 160 66 138 62Q126 66 120 76Q114 66 102 62C80 66 64 82 58 104Z" fill="${C.c}" ${S3}/>${hl('M86 50Q100 40 114 40',C.l)}
      ${[['l',60],['r',180]].map(([s,x])=>{const k=s==='l'?-1:1;return `<path d="M${x} 100Q${x+k*8} 116 ${x} 128Q${x-k*8} 140 ${x+k*2} 152" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x} 100Q${x+k*8} 116 ${x} 128Q${x-k*8} 140 ${x+k*2} 152" stroke="${C.c}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`}).join('')}`}),vb:'30 -10 180 168'},
  {id:'braid',ko:'옆 땋은 머리',en:'side braid',cols:['golden hair','brown hair','red hair','black hair','pink hair','lilac hair'],d:C=>{const seg=[[60,124,-20],[64,146,16],[69,168,-16],[74,190,14],[78,210,-12]];
    return{nape:'',back:`<path d="${CAP}" fill="${C.c}" ${S3}/>`,
      front:SWEPT(C.c)+hl('M90 46Q106 36 124 36',C.l)+seg.map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="13" ry="11" transform="rotate(${r} ${x} ${y})" fill="${C.c}" ${S3}/><path d="M${x-7} ${y-3}Q${x} ${y-7} ${x+6} ${y-2}" stroke="${C.l}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`).join('')
        +`<path d="M76 222Q72 236 80 244Q84 236 88 244Q92 232 84 222Z" fill="${C.c}" ${S3}/>${bow(80,222,.85,'#F2A7BD')}`}},vb:'36 18 168 236'},
  {id:'twin',ko:'양쪽 동그라미 머리',en:'twin buns',cols:['brown hair','pink hair','black hair','golden hair','lilac hair','red hair'],d:C=>({nape:'',
    back:`${blobs([[64,48,19],[176,48,19]],C.c)}${[[64,48],[176,48]].map(([x,y])=>`<path d="M${x-10} ${y-8}Q${x} ${y-14} ${x+9} ${y-6}" stroke="${C.l}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/>`).join('')}<path d="${CAP}" fill="${C.c}" ${S3}/>`
      +`<path d="M58 70Q44 100 50 136Q56 150 62 140Q56 108 70 76ZM182 70Q196 100 190 136Q184 150 178 140Q184 108 170 76Z" fill="${C.c}" ${S3}/>`,
    front:`<path d="M58 104C52 56 84 30 120 30C156 30 188 56 182 104L176 82Q164 90 152 78Q142 90 130 80Q120 92 108 80Q98 90 88 78Q76 90 64 82Z" fill="${C.c}" ${S3}/>${hl('M88 46Q104 36 122 36',C.l)}${bow(76,62,.8,'#F2A7BD',-20)}${bow(164,62,.8,'#F2A7BD',20)}`}),vb:'34 18 172 140'},
  {id:'curls',ko:'곱슬 머리',en:'curly hair',cols:['red hair','brown hair','golden hair','black hair','pink hair','lilac hair'],d:C=>{const cs=[];[[46,112],[40,138],[46,164],[42,190],[50,214],[194,112],[200,138],[194,164],[198,190],[190,214],[62,96],[178,96]].forEach(([x,y])=>cs.push([x,y,18]));
    return{nape:blobs(cs,C.c)+cs.map(([x,y])=>`<path d="M${x-6} ${y}Q${x-6} ${y-7} ${x} ${y-6}Q${x+6} ${y-4} ${x+4} ${y+3}" stroke="${C.l}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>`).join(''),
      back:blobs([[70,58,20],[94,38,20],[120,32,20],[146,38,20],[170,58,20]],C.c)+`<path d="${CAP}" fill="${C.c}" ${S3}/>`,
      front:blobs([[66,86,13],[80,68,14],[98,56,14],[120,52,14],[142,56,14],[160,68,14],[174,86,13]],C.c,4.4)+hl('M92 50Q106 42 120 42',C.l)}},vb:'20 10 200 230'},
  {id:'pony',ko:'높은 꽁지 머리',en:'high ponytail',cols:['golden hair','black hair','brown hair','lilac hair','red hair','pink hair'],d:C=>({
    nape:`<path d="M146 44C204 28 220 92 208 144C202 180 210 204 198 220C184 196 176 162 180 124C182 92 172 64 146 44Z" fill="${C.c}" ${S3}/>${hl('M190 70Q204 100 198 140',C.l)}<path d="M186 120Q184 160 196 196" ${FOLD}/>`,
    back:`<path d="${CAP}" fill="${C.c}" ${S3}/>`,
    front:SWEPT(C.c)+hl('M90 46Q106 36 124 36',C.l)+bow(156,40,1.05,'#F2A7BD',25)}),vb:'40 16 184 210'}
];

/* ============================== shoes (on the feet, under the hem) ============================== */
function shoeBase(x,y,f,extra){return `<path d="M${x-16} ${y+2}Q${x-17} ${y-11} ${x} ${y-11}Q${x+17} ${y-11} ${x+16} ${y+2}Q${x+17} ${y+10} ${x} ${y+10}Q${x-17} ${y+10} ${x-16} ${y+2}Z" fill="${f}" ${extra||S3}/>`}
const feet=f=>({footL:f(FOOT.l[0],FOOT.l[1],-1),footR:f(FOOT.r[0],FOOT.r[1],1)});
const SHOES=[
  {id:'glass',ko:'유리 구두',en:'glass slippers',cols:['glass','pink','purple','mint'],d:C=>feet((x,y,k)=>`${shoeBase(x,y,C.l,`stroke="${OL}" stroke-width="3" stroke-linejoin="round" fill-opacity=".92"`)}<path d="M${x-10} ${y-5}Q${x} ${y-9} ${x+10} ${y-5}" stroke="${C.c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${x-11} ${y+1}Q${x-9} ${y-6} ${x-3} ${y-8}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>${tw(x+k*8,y+2,4)}${gem(x,y-8,2.4,C.c)}`),vb:'76 334 88 32'},
  {id:'flats',ko:'리본 구두',en:'ballet flats',cols:['pink','sky blue','red','yellow'],d:C=>feet((x,y,k)=>`${shoeBase(x,y,C.c)}<path d="M${x-9} ${y-6}Q${x} ${y-2} ${x+9} ${y-6}" stroke="${C.dk}" stroke-width="2.4" fill="none" opacity=".5"/>${bow(x,y-8,.62,C.l)}<path d="M${x-12} ${y+2}Q${x-10} ${y-6} ${x-4} ${y-8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`),vb:'76 334 88 32'},
  {id:'pumps',ko:'보석 구두',en:'jewel pumps',cols:['purple','red','sky blue','pink'],d:C=>feet((x,y,k)=>`<path d="M${x+k*10} ${y+6}L${x+k*13} ${y+14}" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M${x+k*10} ${y+6}L${x+k*13} ${y+14}" stroke="${C.dk}" stroke-width="3.6" stroke-linecap="round"/>${shoeBase(x,y,C.c)}${gem(x-k*2,y-6,4.4,C.l)}<path d="M${x-12} ${y+2}Q${x-10} ${y-6} ${x-4} ${y-8}" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`),vb:'76 334 88 36'},
  {id:'sandals',ko:'반짝 샌들',en:'sparkly sandals',cols:['yellow','mint','pink','sky blue'],d:C=>feet((x,y,k)=>`<path d="M${x-15} ${y+6}Q${x} ${y+13} ${x+15} ${y+6}" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x-15} ${y+6}Q${x} ${y+13} ${x+15} ${y+6}" stroke="${C.l}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${x-11} ${y-5}L${x+11} ${y+3}M${x+11} ${y-5}L${x-11} ${y+3}" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M${x-11} ${y-5}L${x+11} ${y+3}M${x+11} ${y-5}L${x-11} ${y+3}" stroke="${C.c}" stroke-width="3.6" stroke-linecap="round"/>${gem(x,y-1,3.4,GOLDL)}`),vb:'76 334 88 32'},
  {id:'boots',ko:'공주 부츠',en:'princess boots',cols:['red','purple','pink','blue'],d:C=>feet((x,y,k)=>`<path d="M${x-12} 318H${x+12}L${x+13} ${y-6}Q${x+18} ${y} ${x+16} ${y+6}Q${x} ${y+12} ${x-16} ${y+6}Q${x-17} ${y-2} ${x-12} ${y-8}Z" fill="${C.c}" ${S3}/><path d="M${x-12} 322H${x+12}" stroke="${C.l}" stroke-width="5"/>${[328,336,344].map(yy=>`<path d="M${x-5} ${yy}L${x+5} ${yy+4}M${x+5} ${yy}L${x-5} ${yy+4}" stroke="${C.l}" stroke-width="2" stroke-linecap="round"/>`).join('')}<path d="M${x-15} ${y+5}Q${x} ${y+10} ${x+15} ${y+5}" stroke="${OL}" stroke-width="3.6" fill="none"/>`),vb:'76 312 88 54'},
  {id:'maryjane',ko:'꽃 구두',en:'flower shoes',cols:['mint','pink','yellow','purple'],d:C=>feet((x,y,k)=>`${shoeBase(x,y,C.c)}<path d="M${x-11} ${y-6}H${x+11}" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M${x-11} ${y-6}H${x+11}" stroke="${C.dk}" stroke-width="2.4" stroke-linecap="round"/>${flower(x,y,5,C.l,GOLD)}`),vb:'76 334 88 32'}
];

/* ============================== in the hand (right hand) ============================== */
const HR=HAND.r;
const HANDS=[
  {id:'wand',ko:'요술봉',en:'magic wand',cols:['pink','purple','yellow','sky blue'],d:C=>({handR:`<path d="M166 250L190 184" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M166 250L190 184" stroke="${GOLDL}" stroke-width="4" stroke-linecap="round"/>${starP(193,172,17,C.c,S3)}<circle cx="188" cy="166" r="3.2" fill="#fff" opacity=".9"/><path d="M186 190Q176 200 182 212Q186 220 180 228" stroke="${C.l}" stroke-width="3.4" fill="none" stroke-linecap="round"/>${tw(214,152,5.5,GOLDL)}`}),vb:'150 142 76 120'},
  {id:'fan',ko:'부채',en:'folding fan',cols:['sky blue','pink','purple','mint'],d:C=>{const cx=170,cy=250,R=38,a0=-118,a1=-22,n=7;let s='';
    for(let i=0;i<n;i++){const u=a0+(a1-a0)*i/n,v=a0+(a1-a0)*(i+1)/n,p=a=>[cx+R*Math.cos(a*Math.PI/180),cy+R*Math.sin(a*Math.PI/180)];const A1=p(u),B1=p(v);s+=`<path d="M${cx} ${cy}L${f1(A1[0])} ${f1(A1[1])}A${R} ${R} 0 0 1 ${f1(B1[0])} ${f1(B1[1])}Z" fill="${i%2?C.l:C.c}" ${S2}/>`}
    const arc=[];for(let i=0;i<=8;i++){const a=(a0+(a1-a0)*i/8)*Math.PI/180;arc.push([cx+(R-4)*Math.cos(a),cy+(R-4)*Math.sin(a)])}
    return{handR:`<path d="M${cx} ${cy}L${f1(cx+R*Math.cos(a0*Math.PI/180))} ${f1(cy+R*Math.sin(a0*Math.PI/180))}A${R} ${R} 0 0 1 ${f1(cx+R*Math.cos(a1*Math.PI/180))} ${f1(cy+R*Math.sin(a1*Math.PI/180))}Z" fill="${C.c}" ${S3}/>${s}${arc.map(([x,y])=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="1.8" fill="#fff"/>`).join('')}${gem(cx,cy,3.6,GOLD)}`}},vb:'126 206 90 56'},
  {id:'bag',ko:'손가방',en:'little handbag',cols:['purple','pink','red','sky blue'],d:C=>({handR:`<path d="M160 248Q160 262 172 266Q184 262 184 248" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M160 248Q160 262 172 266Q184 262 184 248" stroke="${GOLD}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M154 268Q172 260 192 268L190 290Q172 298 156 290Z" fill="${C.c}" ${S3}/><path d="M156 274Q172 280 190 274" stroke="${C.l}" stroke-width="3" fill="none"/>${gem(172,276,3.4,GOLD)}${bow(172,288,.5,C.l)}`}),vb:'146 236 54 64'},
  {id:'bouquet',ko:'꽃다발',en:'bouquet',cols:['pink','yellow','red','purple'],d:C=>({handR:`<path d="M160 256L176 256L188 208L148 208Z" fill="${PEARL}" ${S3}/><path d="M158 220L180 252" ${FOLD}/>${[[152,206],[184,206],[160,194],[176,194],[168,204],[168,186]].map(([x,y],i)=>`<path d="M${x} ${y+4}l${i%2?8:-8} 6" stroke="${OL}" stroke-width="1" fill="none"/>`).join('')}<path d="M148 210L140 200L152 202ZM190 210L198 200L186 202Z" fill="${LEAF}" ${S2}/>${rose(154,204,8,C.c,C.dk)}${rose(182,204,8,C.c,C.dk)}${rose(168,196,9,C.l,C.dk)}${rose(160,190,7,C.c,C.dk)}${rose(176,188,7,C.c,C.dk)}${bow(168,252,.8,C.l)}`}),vb:'134 176 70 86'},
  {id:'parasol',ko:'양산',en:'parasol',cols:['mint','pink','yellow','sky blue'],d:C=>({handR:`<path d="M166 252L192 142" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M166 252L192 142" stroke="${GOLDL}" stroke-width="2.6" stroke-linecap="round"/><path d="M166 252Q160 262 154 256" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <g transform="rotate(14 194 134)"><path d="M156 140Q158 102 194 100Q230 102 232 140Q222 132 213 140Q204 132 194 140Q184 132 175 140Q166 132 156 140Z" fill="${C.c}" ${S3}/><path d="M156 140Q166 148 175 140Q184 148 194 140Q204 148 213 140Q222 148 232 140" stroke="${C.l}" stroke-width="3.4" fill="none"/><path d="M194 100Q180 118 175 140M194 100Q208 118 213 140M194 100V140" ${FOLD}/><circle cx="194" cy="98" r="3.4" fill="${GOLD}" ${S2}/><path d="M168 122Q174 110 186 106" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/></g>`}),vb:'146 90 96 172'},
  {id:'scepter',ko:'공주 지팡이',en:'scepter',cols:['red','purple','sky blue','pink'],d:C=>({handR:`<path d="M164 266L186 186" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M164 266L186 186" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/><circle cx="187" cy="182" r="9" fill="none" stroke="${OL}" stroke-width="6"/><circle cx="187" cy="182" r="9" fill="none" stroke="${GOLD}" stroke-width="3"/>${heartP(188,180,7,C.c)}${pearl(190,166,3.2)}${gem(176,222,3,C.l)}`}),vb:'150 150 56 120'}
];

/* ============================== gloves (both arms) ============================== */
function glove(t0,C,extra){const out={};['l','r'].forEach(s=>{const a=ARM[s],p=lerp(a.s,a.h,t0),[hx,hy]=HAND[s];
  out['arm'+s.toUpperCase()]=line(p,a.h,16,C.c,5)+`<circle cx="${hx}" cy="${hy}" r="10" fill="${C.c}" ${S3}/><path d="M${hx-4} ${hy-5}Q${hx} ${hy-8} ${hx+3} ${hy-6}" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>`+(extra?extra(p,s,a):'')});return out}
const GLOVES=[
  {id:'opera',ko:'긴 장갑',en:'long gloves',cols:['white','pink','purple','sky blue'],d:C=>glove(.22,C,(p,s,a)=>{const q=lerp(a.s,a.h,.7);return `<path d="M${f1(p[0]+(s==='l'?-3:3))} ${f1(p[1]+6)}L${f1(q[0]+(s==='l'?-3:3))} ${f1(q[1])}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`}),vb:'56 170 128 90'},
  {id:'lacecuff',ko:'레이스 장갑',en:'lace gloves',cols:['white','pink','mint','yellow'],d:C=>glove(.72,C,p=>`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="9.5" fill="${C.l}" ${S2}/>${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return `<circle cx="${f1(p[0]+6*Math.cos(a))}" cy="${f1(p[1]+6*Math.sin(a))}" r="1.6" fill="#fff"/>`}).join('')}`),vb:'56 214 128 46'},
  {id:'bowgloves',ko:'리본 장갑',en:'bow gloves',cols:['pink','red','sky blue','white'],d:C=>glove(.58,C,p=>bow(f1(p[0]),f1(p[1]+2),.6,C.l)),vb:'56 200 128 60'},
  {id:'pearlgloves',ko:'진주 팔찌 장갑',en:'pearl gloves',cols:['white','purple','pink','mint'],d:C=>glove(.5,C,(p,s,a)=>{const q=lerp(a.s,a.h,.9);return [-6,-2,2,6].map(d=>pearl(q[0]+d,q[1]+(d*d)/12,2.2)).join('')}),vb:'56 196 128 64'},
  {id:'ruffle',ko:'주름 장갑',en:'ruffle gloves',cols:['yellow','pink','white','mint'],d:C=>glove(.6,C,p=>blobs([[p[0]-7,p[1],5],[p[0],p[1]-3,5],[p[0]+7,p[1],5],[p[0],p[1]+4,5]],C.l,3)),vb:'56 200 128 60'},
  {id:'mesh',ko:'반짝 장갑',en:'sparkle gloves',cols:['purple','sky blue','pink','white'],d:C=>glove(.4,C,(p,s,a)=>{const q=lerp(a.s,a.h,.62),r=lerp(a.s,a.h,.82);return tw(+f1(q[0]),+f1(q[1]),3.4,GOLDL)+tw(+f1(r[0]),+f1(r[1]),2.8,'#fff')+`<path d="M${f1(p[0]-8)} ${f1(p[1])}Q${f1(p[0])} ${f1(p[1]+5)} ${f1(p[0]+8)} ${f1(p[1])}" stroke="${C.l}" stroke-width="3" fill="none"/>`}),vb:'56 186 128 74'}
];

/* ============================== gowns: ready ones + the white one for the dye pots ============================== */
const GOWN_COLS=['pink','purple','sky blue','mint','yellow','red','magenta','orange'];
const rot=(arr,k)=>arr.slice(k).concat(arr.slice(0,k));
const GOWNS=[
  {id:'rose',ko:'장미 드레스',en:'rose ball gown',b:'puff',s:'ball',cols:rot(GOWN_COLS,0)},
  {id:'sky',ko:'구름 드레스',en:'ruffle gown',b:'off',s:'tier',cols:rot(GOWN_COLS,2)},
  {id:'lilac',ko:'꽃잎 드레스',en:'petal gown',b:'heart',s:'petal',cols:rot(GOWN_COLS,1)},
  {id:'sun',ko:'리본 드레스',en:'bow gown',b:'bow',s:'swag',cols:rot(GOWN_COLS,4)},
  {id:'mint',ko:'별빛 드레스',en:'starry tulle gown',b:'lace',s:'tulle',cols:rot(GOWN_COLS,3)},
  {id:'berry',ko:'퐁퐁 드레스',en:'bubble gown',b:'long',s:'bubble',cols:rot(GOWN_COLS,6)},
  {id:'peach',ko:'층층 드레스',en:'layered gown',b:'puff',s:'tier',cols:rot(GOWN_COLS,7)}
].map(g=>Object.assign(g,{d:(C,w)=>gown(g.b,g.s,C,w&&w.col2?w.C2:null,w&&w.pat),vb:'26 150 188 200'}));
const DYE={id:'dye',ko:'하얀 드레스',en:'white gown',b:'off',s:'ball',cols:['white'],d:(C,w)=>gown('off','ball',C,null,w&&w.pat),vb:'26 150 188 200'};

/* ---------- the categories and their stands (games.clothes.princessWardrobe.stands) ---------- */
const CATS={gown:GOWNS,cape:CAPES,crown:CROWNS,necklace:NECKS,earring:EARS,hair:HAIRS,shoes:SHOES,hand:HANDS,gloves:GLOVES};
const CAT_KO={gown:['드레스','a gown'],cape:['망토','a cape'],crown:['왕관','a crown'],necklace:['목걸이','a necklace'],earring:['귀걸이','earrings'],hair:['머리 모양','a hairstyle'],shoes:['구두','shoes'],hand:['손에 드는 것','something to hold'],gloves:['장갑','gloves']};
function itemOf(cat,id){if(cat==='gown'){if(id==='dye')return DYE;if(String(id).startsWith('mix:')){const [,b,s]=String(id).split(':');return{id,ko:'맞춘 드레스',en:'my own gown',b,s,cols:GOWN_COLS,mixed:true,d:(C,w)=>gown(b,s,C,w&&w.col2?w.C2:null,w&&w.pat),vb:'26 150 188 200'}}}
  return(CATS[cat]||[]).find(x=>x.id===id)||null}

/* every piece of what is worn (vivid on the doll, calm on cards). pw: {cat:{id,col,col2,pat}} */
const ORDER=['cape','gown','shoes','gloves','hand','necklace','earring','crown','hair'];
function pieces(pw,vivid){
  const out={back:'',nape:'',legL:'',legR:'',footL:'',footR:'',hip:'',skirt:'',torso:'',collar:'',neck:'',front:'',armL:'',armR:'',handR:'',hat:'',ear:'',photo:'',hairB:null,hairF:null};
  ORDER.forEach(cat=>{const w=pw[cat];if(!w)return;const it=itemOf(cat,w.id);if(!it)return;const C=CO(w.col,vivid),ww=Object.assign({},w,w.col2?{C2:CO(w.col2,vivid)}:{});
    const pc=it.d(C,ww);
    if(cat==='hair'){out.nape+=`<g data-pcat="hair">${A.vol.litAll(pc.nape||'')}</g>`;out.hairB=`<g data-pcat="hair">${A.vol.litAll(pc.back||'')}</g>`;out.hairF=`<g data-pcat="hair">${A.vol.litAll(pc.front||'')}</g>`;return}
    Object.keys(pc).forEach(k=>{if(out[k]==null||k==='hairB'||k==='hairF')return;out[k]+=`<g data-pcat="${cat}">${A.vol.litAll(pc[k])}</g>`})});
  out.back=out.nape+out.back;return out;
}
/* a card picture: just the item, calm colours, cropped to its own box */
function cardSVG(cat,it,col,w){const C=CO(col,false),ww=Object.assign({},w||{},w&&w.col2?{C2:CO(w.col2,false)}:{}),pc=it.d(C,ww);
  const order=cat==='hair'?['nape','back','front']:['back','legL','legR','footL','footR','hip','skirt','torso','collar','neck','front','armL','armR','handR','hat','ear'];
  return `<svg viewBox="${it.vb||'0 0 240 400'}" preserveAspectRatio="xMidYMid meet" style="overflow:visible">${cat==='hair'?`<path d="M60 112C60 66 86 40 120 40C154 40 180 66 180 112C180 140 154 158 120 158C86 158 60 140 60 112Z" fill="#F6E6DA" ${S3}/>`.replace('<path','<path data-wig="1"'):''}${order.map(k=>pc[k]?A.vol.litAll(pc[k]):'').join('')}</svg>`}

/* ============================== the stands around the doll (calm colours, pictures only) ============================== */
const ALC=(c1,c2)=>`<path d="M6 128V46Q6 6 60 6Q114 6 114 46V128Z" fill="${c1}"/><path d="M14 128V48Q14 14 60 14Q106 14 106 48V128Z" fill="${c2}"/><rect x="2" y="116" width="116" height="12" rx="6" fill="#E3CDB8"/>`;
const STAND_ART={
  dress:`${ALC('#EFDDE9','#F7EDF3')}<path d="M60 96V116M46 122L60 112L74 122" stroke="#B9946F" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M52 20H68V30H52Z" fill="#D8C2A8" ${S2}/>
    <path d="M44 34Q60 28 76 34L74 56Q60 62 46 56Z" fill="#E8A0AE" ${S2}/><path d="M46 56Q60 62 74 56Q90 74 96 98Q78 106 60 104Q42 106 24 98Q30 74 46 56Z" fill="#E8A0AE" ${S2}/><path d="M28 94Q60 104 92 94" stroke="#F6D3DB" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 62L44 96M66 62L76 96" stroke="${OL}" stroke-opacity=".3" stroke-width="1.6"/>${bow(60,56,.7,'#F6D3DB')}<ellipse cx="44" cy="34" rx="8" ry="7" fill="#E8A0AE" ${S2}/><ellipse cx="76" cy="34" rx="8" ry="7" fill="#E8A0AE" ${S2}/>`,
  crown:`${ALC('#E9E1F2','#F4F0F9')}<path d="M42 82H78L74 116H46Z" fill="#EFE5D6" ${S2}/><path d="M38 76H82V84H38Z" fill="#E3D4BE" ${S2}/><path d="M52 86V114M60 86V114M68 86V114" stroke="${OL}" stroke-opacity=".2" stroke-width="2"/>
    <path d="M26 66Q60 52 94 66Q96 78 60 80Q24 78 26 66Z" fill="#B9A6DE" ${S2}/>${[[26,70],[94,70]].map(([x,y])=>`<path d="M${x} ${y}l0 8" stroke="#E4C887" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <g transform="translate(60 52) scale(.72)"><path d="M-36 -4L-42 -32L-24 -14L-12 -40L0 -16L12 -40L24 -14L42 -32L36 -4Q0 -12 -36 -4Z" fill="#E9C870" ${S3}/><path d="M-38 6Q0 -4 38 6L36 -6Q0 -14 -36 -6Z" fill="#D9B45C" ${S3}/>${gem(0,-1,6,'#E89AAE')}${gem(-22,1,4,'#8FC3E6')}${gem(22,1,4,'#8FC3E6')}${pearl(-42,-33,4)}${pearl(-12,-41,4)}${pearl(12,-41,4)}${pearl(42,-33,4)}</g>`,
  jewel:`${ALC('#DDEDEA','#EEF6F4')}<path d="M30 116Q28 92 44 84Q52 80 52 66V44Q60 38 68 44V66Q68 80 76 84Q92 92 90 116Z" fill="#9CC9C2" ${S2}/><path d="M44 116H76" stroke="#7FB3AA" stroke-width="3"/>
    ${[-14,-10,-6,-2,2,6,10,14].map(x=>pearl(60+x,72+10*(1-Math.pow(x/15,2)),2.4)).join('')}${drop(60,88,4.6,'#E89AAE')}
    <path d="M86 26V44M80 26H96" stroke="#C9A98A" stroke-width="3" stroke-linecap="round"/>${drop(84,52,4,'#AE9BE0')}${drop(94,52,4,'#AE9BE0')}<path d="M84 46V44M94 46V30" stroke="${OL}" stroke-width="1.4"/>`,
  hair:`${ALC('#F4E7D8','#FAF3EA')}<path d="M60 92V112M46 118L60 110L74 118" stroke="#B9946F" stroke-width="5" stroke-linecap="round" fill="none"/>
    ${blobs([[32,60,10],[30,76,10],[34,92,9],[88,60,10],[90,76,10],[86,92,9]],'#E2AE52',3)}<ellipse cx="60" cy="56" rx="26" ry="30" fill="#F6E6DA" ${S2}/><path d="M34 56Q32 26 60 24Q88 26 86 56Q80 42 70 38Q58 46 44 40Q38 46 34 56Z" fill="#E2AE52" ${S2}/><path d="M46 30Q56 26 66 28" stroke="#F7D995" stroke-width="3" fill="none" stroke-linecap="round"/>${bow(80,34,.7,'#E8A0AE',20)}`,
  shoes:`${ALC('#E2EEF5','#F1F7FA')}<path d="M24 96Q24 78 60 78Q96 78 96 96V110Q60 116 24 110Z" fill="#E8B8C6" ${S2}/><path d="M24 96Q60 104 96 96" stroke="#F6D3DB" stroke-width="3" fill="none"/><path d="M30 110V118M90 110V118" stroke="#C9A98A" stroke-width="4" stroke-linecap="round"/>
    ${[[44,74,-1],[76,74,1]].map(([x,y,k])=>`<path d="M${x-16} ${y+2}Q${x-17} ${y-11} ${x} ${y-11}Q${x+17} ${y-11} ${x+16} ${y+2}Q${x+17} ${y+10} ${x} ${y+10}Q${x-17} ${y+10} ${x-16} ${y+2}Z" fill="#E4F3F9" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x-10} ${y-5}Q${x} ${y-9} ${x+10} ${y-5}" stroke="#8FC3E6" stroke-width="2.6" fill="none"/><path d="M${x-11} ${y+1}Q${x-9} ${y-6} ${x-3} ${y-8}" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')}${tw(60,48,6,'#F0D58A')}${tw(92,44,4,'#F0D58A')}`,
  hand:`${ALC('#F5ECD9','#FBF6EC')}<ellipse cx="60" cy="84" rx="40" ry="10" fill="#E3CDB6" ${S2}/><path d="M56 92H64V114H56ZM44 118Q60 110 76 118" fill="#D9BFA6" ${S2}/>
    <path d="M30 80L52 30" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M30 80L52 30" stroke="#F7E8B8" stroke-width="3" stroke-linecap="round"/>${starP(54,26,12,'#E89AAE')}
    <path d="M62 80L62 52L92 64Z" fill="#8FC3E6" ${S2}/><path d="M62 80L70 56M62 80L80 60M62 80L88 62" stroke="${OL}" stroke-opacity=".35" stroke-width="1.4"/>
    <path d="M86 84Q92 96 88 108" stroke="${OL}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M86 84Q92 96 88 108" stroke="#FFFDF9" stroke-width="7.5" stroke-linecap="round" fill="none"/>`
};
const standSVG=k=>`<svg viewBox="0 0 120 128" preserveAspectRatio="xMidYMid meet">${STAND_ART[k]||''}</svg>`;
const NEXT=`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#F7EDF3" stroke="${OL}" stroke-width="3.5"/><path d="M30 50H64" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M30 50H64" stroke="#E89AAE" stroke-width="7" stroke-linecap="round"/><path d="M54 32L72 50L54 68" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M54 32L72 50L54 68" fill="none" stroke="#E89AAE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ============================== the dressing room and the ballroom ============================== */
const ROOM=`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="520" fill="#F5ECF2"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*52+8}" y="30" width="36" height="300" rx="6" fill="#F0E2EC"/>`).join('')}
  <path d="M0 330H400" stroke="#E6D3E1" stroke-width="8"/><rect y="334" width="400" height="60" fill="#EFDFEA"/>${[0,1,2,3,4,5,6].map(i=>`<rect x="${i*60+10}" y="344" width="40" height="40" rx="6" fill="#E9D6E3"/>`).join('')}
  <g><path d="M136 330V160Q136 96 200 96Q264 96 264 160V330Z" fill="#E2CFE0"/><path d="M146 330V164Q146 108 200 108Q254 108 254 164V330Z" fill="#E3F0F5"/>
    <path d="M146 300Q176 270 200 284Q226 266 254 292V330H146Z" fill="#CFE5C8"/><circle cx="226" cy="150" r="14" fill="#F7EBC2"/><path d="M200 108V330M146 214H254" stroke="#E2CFE0" stroke-width="6"/>
    <path d="M118 90H282" stroke="#D8BFA2" stroke-width="8" stroke-linecap="round"/><path d="M124 92Q140 200 128 336H112Q120 200 112 92Z" fill="#E7B9C9"/><path d="M276 92Q260 200 272 336H288Q280 200 288 92Z" fill="#E7B9C9"/>
    <path d="M114 230Q130 224 132 238M286 230Q270 224 268 238" stroke="#E4C887" stroke-width="6" fill="none" stroke-linecap="round"/></g>
  <g><path d="M200 0V26" stroke="#D8BFA2" stroke-width="3"/><path d="M164 44Q200 64 236 44" stroke="#E4C887" stroke-width="5" fill="none"/><path d="M176 30H224L218 44H182Z" fill="#E9D29A"/>${[164,182,200,218,236].map((x,i)=>`<path d="M${x} ${i%4?50:44}v-8" stroke="#F5ECDA" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="${(i%4?50:44)-12}" r="3.6" fill="#FBEBB5"/>`).join('')}</g>
  <rect y="394" width="400" height="126" fill="#EAD8C6"/>${[0,1,2,3,4,5,6,7,8].map(i=>`<path d="M${i*50} 394V520" stroke="#E1CCB7" stroke-width="2"/>`).join('')}<path d="M0 394H400" stroke="#DCC2A8" stroke-width="5"/>
  <ellipse cx="200" cy="476" rx="168" ry="38" fill="#EBC6D3"/><ellipse cx="200" cy="476" rx="150" ry="30" fill="none" stroke="#F6E1E9" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>
  <g transform="translate(46 470)"><ellipse rx="34" ry="11" cy="22" fill="#5B3A29" opacity=".08"/><path d="M-30 0Q-30 -20 0 -20Q30 -20 30 0V14Q0 24 -30 14Z" fill="#CDBDE6"/><path d="M-30 0Q0 10 30 0" stroke="#E3D9F3" stroke-width="4" fill="none"/><rect x="-14" y="-34" width="28" height="16" rx="4" fill="#F3DCA6"/><path d="M0 -34V-18M-14 -26H14" stroke="#E89AAE" stroke-width="3"/></g>
</svg>`;
const BALL=`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="520" fill="#EEE3F1"/>${[50,150,250,350].map(x=>`<path d="M${x-38} 330V110Q${x-38} 56 ${x} 56Q${x+38} 56 ${x+38} 110V330Z" fill="#E3D3EA"/><path d="M${x-28} 330V114Q${x-28} 68 ${x} 68Q${x+28} 68 ${x+28} 114V330Z" fill="#DDEAF3"/><path d="M${x} 68V330M${x-28} 190H${x+28}" stroke="#E3D3EA" stroke-width="4"/>`).join('')}
  <path d="M0 0H70Q60 160 84 330H0Z" fill="#DDA3B6"/><path d="M400 0H330Q340 160 316 330H400Z" fill="#DDA3B6"/><path d="M20 0Q30 160 18 330M48 0Q56 160 52 330M380 0Q370 160 382 330M352 0Q344 160 348 330" stroke="#CF92A7" stroke-width="4" fill="none"/>
  <path d="M0 22Q100 52 200 26Q300 52 400 22V0H0Z" fill="#E7B9C9"/>
  <g><path d="M200 0V30" stroke="#D8BFA2" stroke-width="3"/><ellipse cx="200" cy="64" rx="70" ry="40" fill="#FFF8E6" opacity=".55"/><path d="M150 52Q200 84 250 52" stroke="#E4C887" stroke-width="6" fill="none"/><path d="M168 40H232L224 56H176Z" fill="#E9D29A"/>${[150,170,190,210,230,250].map((x,i)=>`<path d="M${x} ${i===0||i===5?52:60}v-9" stroke="#F5ECDA" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="${(i===0||i===5?52:60)-13}" r="4" fill="#FBEBB5"/>`).join('')}${[160,180,200,220,240].map(x=>`<path d="M${x} 74v8" stroke="#F3F0FA" stroke-width="2"/><circle cx="${x}" cy="86" r="2.6" fill="#F3F0FA"/>`).join('')}</g>
  <rect y="330" width="400" height="190" fill="#EFE4D8"/>${Array.from({length:9},(_,i)=>Array.from({length:5},(_,j)=>(i+j)%2?`<path d="M${i*50-((j*38)*(i-4)/16)} ${330+j*38}h50l${(i-3.5)*2} 38h-50z" fill="#E6D5C5"/>`:'').join('')).join('')}
  <path d="M160 520L184 330H216L240 520Z" fill="#E2A9B8"/><path d="M168 520L188 330M232 520L212 330" stroke="#EFD9A0" stroke-width="3"/>
  <path class="cl-spot" d="M172 0H228L330 520H70Z" fill="#FFFDF4" opacity=".22"/><ellipse class="cl-spot" cx="200" cy="474" rx="140" ry="34" fill="#FFFDF4" opacity=".42"/>
</svg>`;

/* ---------- dye pots and the dress form ---------- */
function potSVG(key){const k=colorOf(key);return `<svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid meet"><ellipse cx="60" cy="122" rx="46" ry="6" fill="${OL}" opacity=".12"/>
  <path d="M16 46Q14 110 30 118Q60 128 90 118Q106 110 104 46Z" fill="#F2E7DC" ${S3}/><path d="M18 74Q60 86 102 74" stroke="${k.hex}" stroke-width="7" fill="none" opacity=".75"/><path d="M26 56Q24 92 32 108" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
  <ellipse cx="60" cy="46" rx="46" ry="14" fill="#E8D9C8" ${S3}/><ellipse class="cl-ink" cx="60" cy="47" rx="38" ry="9.5" fill="${k.hex}"/><ellipse cx="48" cy="45" rx="12" ry="3" fill="#fff" opacity=".45"/>
  <path d="M96 48Q100 60 97 70" stroke="${k.hex}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="97" cy="76" r="4" fill="${k.hex}"/></svg>`}
const FORM=`<path d="M120 236V352M98 366L120 348L142 366" stroke="#B9946F" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M110 138H130V156H110Z" fill="#D8C2A8" ${S3}/><path d="M92 158Q120 150 148 158Q158 164 156 184L152 230Q120 240 88 230L84 184Q82 164 92 158Z" fill="#F1E6D8" ${S3}/><path d="M120 160V236M100 164Q96 200 100 230M140 164Q144 200 140 230" stroke="${OL}" stroke-opacity=".18" stroke-width="2"/>`;
const HANGER=`<path d="M120 152V140Q120 130 128 130Q136 130 136 138" stroke="#B9A48C" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M82 170L120 152L158 170" stroke="#B9A48C" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
/* one gown on its own (cards of the workshops, the dress form, the hanger); w: {col,col2,pat} */
function gownSVG(b,s,col,o={}){const C=CO(col,!!o.vivid),C2=o.col2?CO(o.col2,!!o.vivid):null,g=gown(b,s,C,C2,o.pat);
  const parts=o.only==='bodice'?['torso','armL','armR']:o.only==='skirt'?['skirt']:['skirt','torso','armL','armR'];
  return parts.map(k=>A.vol.litAll(g[k]||'')).join('')}
const BODICE_IDS=Object.keys(BD),SKIRT_IDS=Object.keys(SK);
const BD_KO={puff:['퐁 소매 윗옷','a puffy top'],heart:['하트 윗옷','a heart top'],off:['어깨 주름 윗옷','a ruffle top'],long:['긴 소매 윗옷','a long-sleeve top'],bow:['리본 윗옷','a bow top'],lace:['끈 윗옷','a laced top']};
const SK_KO={ball:['큰 치마','a big skirt'],tier:['층층 치마','a layered skirt'],swag:['장미 치마','a rose skirt'],petal:['꽃잎 치마','a petal skirt'],tulle:['별빛 치마','a starry skirt'],bubble:['퐁퐁 치마','a bubble skirt']};

/* ---------- two friend princesses (new: other hair and skin) ---------- */
const FRIENDS=[
  {id:'lia',ko:'리아',en:'Lia',hair:'short',hc:'#2F2321',hh:'#5A4440',skin:'#C99470',shade:'#AE7A58',eye:'#2E1B12',iris:'#5A3A26',rib:'#E89AAE',style:'bun',hcol:'black hair'},
  {id:'ella',ko:'엘라',en:'Ella',hair:'short',hc:'#E2AE52',hh:'#F7D995',skin:'#FFE9DC',shade:'#F2C9B4',eye:'#3E2A1E',iris:'#6B8FB0',rib:'#8FC3E6',style:'long',hcol:'golden hair'}
];
/* coordinated colours for the friends: the two neighbours of the doll's colour on the colour ring */
function friendCols(col){const ring=GOWN_COLS,i=Math.max(0,ring.indexOf(col));return[ring[(i+1)%ring.length],ring[(i+ring.length-1)%ring.length]]}
/* confetti (calm: few, slow, no flashing) */
const CONF_COL=['#E8A0AE','#F0D58A','#AE9BE0','#8FC3E6','#86CDBE','#F3C6C1'];
const confetti=i=>{const c=CONF_COL[i%CONF_COL.length];return i%3===0?`<svg viewBox="-6 -6 12 12"><circle r="4.5" fill="${c}"/></svg>`:i%3===1?`<svg viewBox="-6 -6 12 12"><rect x="-5" y="-2.5" width="10" height="5" rx="1.6" fill="${c}"/></svg>`:`<svg viewBox="-8 -8 16 16">${starP(0,0,6.5,c,'stroke="none"')}</svg>`};

return{CATS,CAT_KO,GOWNS,DYE,BD,SK,PATS,PAT_IDS,BODICE_IDS,SKIRT_IDS,BD_KO,SK_KO,itemOf,pieces,cardSVG,colorOf,CO,standSVG,NEXT,ROOM,BALL,potSVG,FORM,HANGER,gownSVG,gown,FRIENDS,friendCols,confetti,GOWN_COLS,STAND_IDS:Object.keys(STAND_ART),mix};
};
})();
