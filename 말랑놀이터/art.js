/* 말랑 놀이터 · 그림 도구 (직접 그린 SVG 캐릭터·음식·도구·건물)
   모든 그림은 이 앱을 위해 새로 그린 것입니다. */
(()=>{
'use strict';
const OL='#5B3A29';           // 공통 외곽선 색
const S=`stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;   // P19 art.volume.outline: 3.5 → 3 (the bottom gets a heavier line, VOL.low)
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
  dog:{ko:'콩이',body:'#FFFFFF',edge:'#EADFD5',dark:'#B98154',inner:'#FCF1E6',cheek:'#FF94AC'},
  /* P18 games.petsalon.hairCustomers: long-haired customers (drawn here, hair from HAIR below) */
  pony:{ko:'구름이',nofur:1,body:'#F6EFFA',edge:'#DCCBEA',dark:'#B79BD0',inner:'#FFF8FC',cheek:'#FF9FC0',hair:1},
  fluffdog:{ko:'솜이',body:'#FFF8F0',edge:'#EEDCC8',dark:'#8A5A40',inner:'#FFFDF8',cheek:'#FF9DB0',hair:1},
  dolly:{ko:'별이',nofur:1,body:'#FFE6D8',edge:'#F3C8B2',dark:'#E59A80',inner:'#FFF1EA',cheek:'#FF9AA8',hair:1,dress:'#F4B9CB',dressEdge:'#DE93AC',dressIn:'#FBDCE5',shoe:'#D98AA6'}
};
/* ---------- P18 styles shared by the fluffy outline and the hair strands (all motion is CSS transform driven by variables) ---------- */
(()=>{const st=document.createElement('style');st.textContent=
  '.ps-fb{transform:translate(calc(var(--f,0) * var(--nx,0) * 1px),calc(var(--f,0) * var(--ny,0) * 1px));transition:transform .4s cubic-bezier(.34,1.9,.55,1)}'+
  '.ps-fbw{transform:translate(var(--al-fwx,0px),var(--al-fwy,0px))}'+
  '.hs .j0{transform:rotate(var(--h0,0deg))}.hs .j1{transform:rotate(var(--h1,0deg))}.hs .j2{transform:rotate(var(--h2,0deg))}'+
  '.hs .w{transform:scaleX(calc(.62 + .48 * var(--d,1)))}.hs .hw{opacity:calc((1 - var(--d,1)) * .6)}.hs .hg{opacity:var(--g,0);transition:opacity .4s}'+
  '.hs .hw-drop{opacity:calc((1 - var(--d,1)) * 1.4 - .4)}'+
  /* P19 art.volume.contact: the ground shadow gets smaller and lighter while the character is in the air */
  '.vol-ground{transform-box:fill-box;transform-origin:50% 50%}.alive.al-p-hop .vol-ground{animation:vol-hop .6s ease-in-out var(--al-n,1)}.alive.al-p-clap .vol-ground{animation:vol-hop .6s ease-in-out}'+
    /* P4: the photo face slides inside its fixed oval (ML.Face.play); a blink is a very small squeeze of the photo */
  '.pe-photo{transform-box:fill-box;transform-origin:50% 55%;transition:transform .08s ease-out}.alive.al-blink .pe-photo{transform:scaleY(.965) translateY(1px)}'+
  '@keyframes vol-hop{0%,100%{transform:scale(1);opacity:1}15%{transform:scale(1.05,1)}50%{transform:scale(.74);opacity:.5}85%{transform:scale(1.04,1)}}';
  (document.head||document.documentElement).appendChild(st)})();
/* ---------- P18 fluffyFix: the outline itself turns soft (small half-circles in the fur colour), no white lumps ----------
   Two layers so the outline stays one line: A = shapes with outline, B = the same shapes a little smaller without outline on top.
   Each bump slides out (--f 0 → 1) when its cell dries; when wet they hide inside the plain shape (looks exactly like before). */
const FB_HEAD={n:16,rb:13,hide:51.75,move:9.75},FB_BODY={n:14,rb:11,move:9.75};
const fluffOf=v=>!v||v.shaken||!((v.rinse||0)>0)?0:Math.min(1,(v.dry||0)*2);
function nearestCell(cells,x,y){let b=0,bd=1e9;cells.forEach((c,i)=>{const d=(c.cx-x)**2+(c.cy-y)**2;if(d<bd){bd=d;b=i}});return b}
const FB_CACHE={};
function fluffBumps(grid){
  const key=(grid||[6,6]).join('x');if(FB_CACHE[key])return FB_CACHE[key];const cells=PET_CELLS(grid),out={head:[],body:[]};
  for(let i=0;i<FB_HEAD.n;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/FB_HEAD.n,nx=Math.cos(a),ny=Math.sin(a),x=100+nx*FB_HEAD.hide,y=100+ny*FB_HEAD.hide;
    out.head.push({x,y,r:FB_HEAD.rb,nx:nx*FB_HEAD.move,ny:ny*FB_HEAD.move,c:nearestCell(cells,x+nx*20,y+ny*20)})}
  for(let i=0;i<FB_BODY.n;i++){const t=(i+.5)*Math.PI*2/FB_BODY.n;if(Math.sin(t)>.72)continue;   // the bottom is hidden by the feet and the tub
    const px=100+48*Math.cos(t),py=188+38*Math.sin(t),gx=Math.cos(t)/48,gy=Math.sin(t)/38,gl=Math.hypot(gx,gy),nx=gx/gl,ny=gy/gl,h=FB_BODY.rb+1.75+3.5;
    out.body.push({x:px-nx*h,y:py-ny*h,r:FB_BODY.rb,nx:nx*FB_BODY.move,ny:ny*FB_BODY.move,c:nearestCell(cells,px,py)})}
  return FB_CACHE[key]=out;
}
/* A layer (with outline) and B layer (fill only) of one ring. base: the plain shape [A, B] */
function fluffRing(list,vals,fill,baseA,baseB){
  const b=(o,stroke)=>`<circle class="ps-fb" data-c="${o.c}" cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${stroke?o.r:o.r-1.75}" style="--nx:${o.nx.toFixed(2)};--ny:${o.ny.toFixed(2)};--f:${vals?fluffOf(vals[o.c]).toFixed(2):0}" fill="${fill}"${stroke?` ${S}`:''}/>`;
  return `${baseA}<g class="ps-fbw">${list.map(o=>b(o,1)).join('')}</g>${baseB}<g class="ps-fbw">${list.map(o=>b(o,0)).join('')}</g>`;
}
/* live update from the salon (no redraw): only bumps whose value changed are touched */
function fluffSet(root,vals){
  if(!root||!vals)return;root.querySelectorAll('.ps-fb').forEach(e=>{const f=fluffOf(vals[+e.dataset.c]);if(e.__f!==f){e.__f=f;e.style.setProperty('--f',f.toFixed(2))}});
}
/* a lighter shade of the fur for the soft inner-fur strokes (white fur → a hint of its edge colour) */
function hexMix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const lum=h=>{const v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return .3*v[0]+.59*v[1]+.11*v[2]};

/* ---------- P19 art.volume: soft round volume drawn with light and shadow only (light always from the top left) ----------
   One shared <defs> for the whole page: each gradient is made once per colour and referenced by id, so a hundred characters
   still cost a handful of gradients (motion.performance). No blur filters: the soft highlight is a fading gradient.
   ball(c,edge)   round part: +12% light at the top left → colour → −14% (or the drawn edge colour) at the bottom right
   ballU(...)     the same in picture units (for shapes that must match a ball exactly, e.g. the salon's soft outline)
   cheek(c)       blush: strong in the middle, gone at the edge
   hl()           soft white highlight (white 35%, fades out)
   over()         one colour-free overlay for objects, clothes and food: a little light at the top left, warm shade at the bottom right
   rim(...)       thin reflected light along the bottom right edge (an arc just inside the outline, no gradient)
   low(...)       a slightly heavier outline along the bottom (weight)
   ground(...)    two-layer contact shadow (dark small + light wide); shrinks while hopping (CSS below)
   under(shape)   overlap shadow: the same shape 2px lower in brown 15%, drawn just before the shape in front
   glass(...)     a very faint reflection at the bottom of an eye (glass bead)
   VOL.off = true draws everything without the added light (used for the before/after page). */
const VOL=(()=>{
  const NS='http://www.w3.org/2000/svg',made=new Set();let defs=null;
  const HEX=/^#[0-9a-f]{6}$/i,f1=n=>+(+n).toFixed(1);
  function host(){
    if(defs&&defs.isConnected)return defs;
    const sv=document.createElementNS(NS,'svg');sv.setAttribute('id','volDefs');sv.setAttribute('aria-hidden','true');sv.setAttribute('width','0');sv.setAttribute('height','0');
    sv.style.cssText='position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
    defs=document.createElementNS(NS,'defs');sv.appendChild(defs);(document.body||document.documentElement).appendChild(sv);made.clear();return defs;
  }
  const def=(id,mk)=>{const h=host();if(!made.has(id)){h.insertAdjacentHTML('beforeend',mk());made.add(id)}return `url(#${id})`};
  const key=c=>c.slice(1).toLowerCase();
  const light=c=>hexMix(c,'#FFFFFF',.3),dark=c=>hexMix(c,'#4A2C1E',.17);   // ≈ +12% / −14% brightness, the shade a little warm (brown, not grey)
  const stops=(c,e)=>`<stop offset="0" stop-color="${light(c)}"/><stop offset=".52" stop-color="${c}"/><stop offset=".82" stop-color="${hexMix(c,e,.55)}"/><stop offset="1" stop-color="${e}"/>`;
  const V={off:false,
    ball(c,edge){if(!HEX.test(c||''))return c;const e=HEX.test(edge||'')?hexMix(edge,dark(c),.35):dark(c);
      return def('vb'+key(c)+key(e),()=>`<radialGradient id="vb${key(c)}${key(e)}" cx=".36" cy=".28" r=".85" fx=".3" fy=".22">${stops(c,e)}</radialGradient>`)},
    ballU(c,edge,x,y,rx,ry,tag){if(!HEX.test(c||''))return c;const e=HEX.test(edge||'')?hexMix(edge,dark(c),.35):dark(c),id='vu'+tag+key(c)+key(e);
      return def(id,()=>`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${x} ${y}) scale(${rx} ${ry})">${stops(c,e)}</radialGradient>`)},
    cheek(c){if(!HEX.test(c||''))return c;return def('vc'+key(c),()=>`<radialGradient id="vc${key(c)}"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".55" stop-color="${c}" stop-opacity=".5"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`)},
    hl(){return def('vhl',()=>`<radialGradient id="vhl"><stop offset="0" stop-color="#fff" stop-opacity=".72"/><stop offset=".5" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`)},
    over(){return def('vov',()=>`<radialGradient id="vov" cx=".36" cy=".28" r=".85" fx=".3" fy=".22"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="${OL}" stop-opacity="0"/><stop offset="1" stop-color="${OL}" stop-opacity=".2"/></radialGradient>`)},
    /* an arc of an ellipse (rx, ry, turned rot°) between two angles (0° = right, 90° = down) */
    arc(cx,cy,rx,ry,rot,a0,a1){const r=(rot||0)*Math.PI/180,p=a=>{a*=Math.PI/180;const x=rx*Math.cos(a),y=ry*Math.sin(a);return f1(cx+x*Math.cos(r)-y*Math.sin(r))+' '+f1(cy+x*Math.sin(r)+y*Math.cos(r))};
      return `M${p(a0)}A${f1(rx)} ${f1(ry)} ${rot||0} ${a1-a0>180?1:0} 1 ${p(a1)}`},
    rim(cx,cy,rx,ry,rot,w){if(V.off)return'';const k=w||2.6,i=1.5+k/2+.4;if(rx<=i*2||ry<=i*2)return'';
      return `<path class="vol-rim" d="${V.arc(cx,cy,rx-i,ry-i,rot,-12,104)}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="${k}" stroke-linecap="round"/><path class="vol-rim" d="${V.arc(cx,cy,rx-i,ry-i,rot,14,78)}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="${k}" stroke-linecap="round"/>`},
    low(cx,cy,rx,ry,rot){if(V.off)return'';return `<path class="vol-low" d="${V.arc(cx,cy,rx,ry,rot,28,152)}" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/>`},
    ground(cx,cy,rx,ry){ry=ry||6;if(V.off)return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(91,58,41,.16)"/>`;
      return `<g class="vol-ground"><ellipse cx="${cx}" cy="${cy}" rx="${f1(rx*1.08)}" ry="${f1(ry*1.25)}" fill="${OL}" opacity=".09"/><ellipse cx="${cx}" cy="${f1(cy-ry*.1)}" rx="${f1(rx*.64)}" ry="${f1(ry*.6)}" fill="${OL}" opacity=".2"/></g>`},
    under(shape,dy){if(V.off)return'';return `<g class="vol-under" transform="translate(0 ${dy||2})" opacity=".15">${shape.replace(/\s(stroke|stroke-width|stroke-linejoin|stroke-linecap|opacity|class|id|data-[\w-]+)="[^"]*"/g,'').replace(/fill="[^"]*"/,`fill="${OL}"`)}</g>`},
    glass(cx,cy,rx,ry){if(V.off)return'';return `<path class="vol-glass" d="M${f1(cx-rx*.55)} ${f1(cy+ry*.52)}Q${f1(cx)} ${f1(cy+ry*.92)} ${f1(cx+rx*.55)} ${f1(cy+ry*.52)}" fill="none" stroke="#fff" stroke-width="${f1(Math.max(1.2,rx*.16))}" stroke-linecap="round" opacity=".26"/>`},
    /* a soft highlight ellipse (top left of a head or a round thing) */
    shine(cx,cy,rx,ry,rot){if(V.off)return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(rx*.83)}" ry="${f1(ry*.76)}" fill="#fff" opacity=".38"${rot?` transform="rotate(${rot} ${cx} ${cy})"`:''}/>`;
      return `<ellipse class="vol-hl" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${V.hl()}"${rot?` transform="rotate(${rot} ${cx} ${cy})"`:''}/>`},
    /* overlay copy of a filled shape: same geometry, colour-free light and shade on top (objects, clothes, food) */
    lit(shape){if(V.off)return'';return shape.replace(/\s(stroke|stroke-width|stroke-linejoin|stroke-linecap|stroke-dasharray|opacity|fill-opacity|class|filter|id|style|data-[\w-]+|aria-[\w-]+|vector-effect)="[^"]*"/g,'').replace(/fill="[^"]*"/,`fill="${V.over()}" pointer-events="none"`)},
    /* every outlined, coloured shape in a piece of markup gets its overlay copy right after it (clothes, tools, food drawn by the games) */
    litAll(markup){if(V.off||!markup)return markup;return markup.replace(/<(path|ellipse|circle|rect)\b[^>]*?fill="#[0-9A-Fa-f]{6}"[^>]*?stroke="#5B3A29"[^>]*?\/>/g,m=>/fill="#5B3A29"/i.test(m)?m:m+V.lit(m))},
    /* a round limb drawn as one thick stroke from p to q (width w): a light stripe on its upper left side, a soft shade on the lower right */
    limb(p,q,w){if(V.off)return'';const dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;let nx=-uy,ny=ux;if(nx+ny>0){nx=-nx;ny=-ny}
      const cut=Math.min(L*.3,w*.35),a=[p[0]+ux*cut,p[1]+uy*cut],b=[q[0]-ux*cut,q[1]-uy*cut],ln=(o,sw,col,op)=>`<path class="vol-limb" d="M${f1(a[0]+nx*o)} ${f1(a[1]+ny*o)}L${f1(b[0]+nx*o)} ${f1(b[1]+ny*o)}" stroke="${col}" stroke-width="${f1(sw)}" stroke-linecap="round" opacity="${op}"/>`;
      return ln(w*.22,w*.26,'#fff',.3)+ln(-w*.28,w*.22,OL,.12)},
    /* how many different gradients one picture uses (art.volume.limits: 6 or fewer per character) */
    count(svgEl){const ids=new Set();(svgEl.outerHTML.match(/url\(#([^)]+)\)/g)||[]).forEach(u=>{const id=u.slice(5,-1),g=document.getElementById(id);if(g&&/Gradient$/.test(g.tagName))ids.add(id)});return ids.size}
  };
  return V;
})();

/* ---------- P18 motion.hair: long hair as strands (8~14). Each strand turns at its root and at two joints (nested <g>), so the tip follows later.
   strand: [x, y, angle (deg, 0 = straight down, + = tip to the left), length, width, bend per joint (deg)]
   groups: back (behind the head), front (bangs, over the face), tail (in the tail group). cap: the hair on top of the head. */
const HAIR={
  pony:{col:'#F2A9C6',dark:'#CF7FA3',light:'#FBD9E6',
    /* a long mane down the right side of the neck (the ones rooted on top fill it out behind the head) */
    back:[[120,34,-10,136,28,-5],[136,42,-14,150,28,-5],[150,56,-14,150,27,-6],[160,74,-16,136,25,-6],[166,96,-18,112,23,-6],[78,32,12,70,24,6],[60,48,20,64,20,8]],
    /* forelock between the ears, over the forehead */
    front:[[92,26,18,58,22,8],[104,24,-4,64,24,-6],[115,28,-22,54,20,-8]],
    /* a long tail beside the body */
    tail:[[132,198,-38,98,25,-9],[136,204,-56,92,23,-10],[134,208,-22,96,22,-8]],
    cap:K=>`<path d="M80 40Q86 18 104 20Q124 20 128 40Q114 30 100 34Q88 32 80 40Z" fill="${HAIR.pony.col}" ${S}/>`},
  fluffdog:{col:'#F3D8BB',dark:'#D3A97F',light:'#FCEEDD',
    back:[[38,70,8,86,26,4],[30,90,16,70,20,6],[48,90,2,78,20,3],[162,70,-8,86,26,-4],[170,90,-16,70,20,-6],[152,90,-2,78,20,-3]],
    front:[[70,46,10,46,17,6],[86,40,4,50,17,3],[102,40,-2,50,17,-2],[118,42,-6,48,17,-4],[133,48,-12,44,16,-6]],
    cap:K=>`<path d="M42 74Q36 42 66 34Q82 20 100 28Q118 20 134 34Q164 42 158 74Q146 56 128 58Q114 46 100 54Q86 46 72 58Q54 56 42 74Z" fill="${HAIR.fluffdog.col}" ${S}/>`},
  dolly:{col:'#F2C46E',dark:'#D29C3E',light:'#FBE3AE',
    back:[[34,96,5,110,30,2],[42,72,3,128,28,2],[58,52,1,142,24,1],[166,96,-5,110,30,-2],[158,72,-3,128,28,-2],[142,52,-1,142,24,-1]],
    front:[[84,38,6,36,16,4],[100,35,0,38,16,0],[116,38,-6,36,16,-4]],
    cap:K=>`<path d="M30 106Q26 34 100 30Q174 34 170 106Q162 70 134 62Q118 76 100 64Q82 76 66 62Q38 70 30 106Z" fill="${HAIR.dolly.col}" ${S}/>`+
      `<g transform="translate(100 31)"><path d="M-20 4L-24 -14L-10 -4L0 -20L10 -4L24 -14L20 4Z" fill="#F6D77A" ${S}/><circle cy="-20" r="4" fill="#F4A9C0" stroke="${OL}" stroke-width="2"/></g>`}
};
/* hair styles (games.petsalon.hairCustomers.styles) and how many taps (knots) each takes */
const HAIR_STYLES=[{id:'loose',ko:'풀기',en:'loose',knots:1},{id:'ponytail',ko:'하나로 묶기',en:'ponytail',knots:2},{id:'pigtails',ko:'양 갈래',en:'pigtails',knots:2},{id:'braid',ko:'땋기',en:'braid',knots:4},{id:'updo',ko:'올림머리',en:'updo',knots:3}];
const TIE='#B9A3E3';
/* the strands and extras of one look. style/knots: the hairstyle and how many knots are done */
function hairPlan(kind,style,knots){
  const H=HAIR[kind];if(!H)return null;const S0=HAIR_STYLES.find(s=>s.id===style),k=S0?Math.min(knots|0,S0.knots):0;
  let back=H.back.slice(),pre='',post='';
  const bunch=(x,y,list)=>list.map(([a,l,w,b])=>[x,y,a,l,w,b]);
  const tie=(x,y,r=8)=>`<g class="hs-tie"><ellipse cx="${x}" cy="${y}" rx="${r+2}" ry="${r*.7}" fill="${TIE}" ${S}/><path d="M${x-r*.6} ${y-1}Q${x} ${y-4} ${x+r*.6} ${y-1}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
  const bow=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 0L-16 -10Q-19 0 -16 10Z" fill="${TIE}" ${S}/><path d="M0 0L16 -10Q19 0 16 10Z" fill="${TIE}" ${S}/><circle r="5" fill="#D9CBF2" ${S}/></g>`;
  if(style==='ponytail'&&k>=1){back=bunch(100,30,[[200,46,18,24],[176,52,18,26],[154,56,17,22],[222,48,17,-24],[190,40,16,30]]);post+=tie(100,30)+(k>=2?bow(100,22):'')}
  if(style==='pigtails'&&k>=1){const L=bunch(36,82,[[10,74,20,6],[24,66,18,8],[-4,70,18,4]]),R=bunch(164,82,[[-10,74,20,-6],[-24,66,18,-8],[4,70,18,-4]]);
    back=k>=2?L.concat(R):L.concat(H.back.filter(s=>s[0]>=100));post+=tie(36,82)+(k>=2?tie(164,82):'')}
  if(style==='braid'&&k>=1){
    const links=Math.min(4,k)*2;let x=154,y=100;back=[];
    for(let i=0;i<links;i++){pre+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="13" ry="10" transform="rotate(${i%2?-28:28} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${H.col}" ${S}/><path d="M${(x-7).toFixed(1)} ${(y-2).toFixed(1)}q7 -4 12 1" stroke="${H.light}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;x+=i%2?-3:5;y+=13}
    back.push([x,y-4,-8,k>=4?30:60,k>=4?14:22,-6],[x+4,y-4,-20,k>=4?26:52,k>=4?12:18,-8]);
    post+=k>=4?tie(x+1,y-4,6):'';
  }
  if(style==='updo'&&k>=1){back=bunch(100,40,[[176,26,22,12],[190,24,20,-10],[164,22,18,14]]);
    if(k>=2)pre+=`<circle cx="100" cy="20" r="21" fill="${H.col}" ${S}/><path d="M88 16Q98 6 110 14Q114 26 100 28Q92 26 94 18" stroke="${H.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    if(k>=3)post+=`<g transform="translate(118 10)">${star(0,0,9,'#F6D77A',`stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"`)}</g>`;
    post+=tie(100,40,7)}
  return{H,back,front:H.front,tail:H.tail||null,pre,post,style:S0?S0.id:'loose',knots:k};
}
/* one strand: an outline chain and a fill chain, both turned by the same variables on the strand (--h0..2). d: 0 wet .. 1 dry, g: shine after brushing */
function hairStrand(s,i,H,o,outl){
  const [x,y,ang,len,w,bend]=s,d=o.d==null?1:o.d,mix=.15+.85*d,ns=o.neat?.4:1,L=[len*.4,len*.33,len*.27],W=[w,w*.86,w*.72];
  const a0=ang*mix,a1=bend*mix*ns,a2=bend*mix*ns*1.2;
  const seg=(k,outl)=>{const l=L[k],ww=W[k];
    if(k<2)return `<g class="w"><path d="M0 0V${l.toFixed(1)}" stroke="${outl?OL:H.col}" stroke-width="${(outl?ww+3.5:ww).toFixed(1)}" stroke-linecap="round"/>${outl?'':`<path class="hw" d="M0 0V${l.toFixed(1)}" stroke="${H.dark}" stroke-width="${(ww*.7).toFixed(1)}" stroke-linecap="round"/><path d="M${(ww*.2).toFixed(1)} 2V${(l-2).toFixed(1)}" stroke="${H.dark}" stroke-width="2.2" stroke-linecap="round" opacity=".35"/><path class="hg" d="M${(-ww*.22).toFixed(1)} ${(l*.15).toFixed(1)}V${(l*.85).toFixed(1)}" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`}</g>`;
    const hw=ww/2,tip=`M${-hw} 0Q${-hw} ${(l*.7).toFixed(1)} 0 ${l.toFixed(1)}Q${hw} ${(l*.7).toFixed(1)} ${hw} 0Z`;
    return `<g class="w">${outl?`<path d="${tip}" fill="${OL}" stroke="${OL}" stroke-width="3.5" stroke-linejoin="round"/>`:`<path d="${tip}" fill="${H.col}"/><path class="hw" d="M0 0V${(l*.8).toFixed(1)}" stroke="${H.dark}" stroke-width="${(ww*.5).toFixed(1)}" stroke-linecap="round"/><path class="hw-drop" transform="translate(0 ${(l+6).toFixed(1)}) scale(.6)" d="M0 -9Q8 3 0 7Q-8 3 0 -9Z" fill="#9FD0F0" stroke="#6FB2DC" stroke-width="1.5"/>`}</g>`};
  const chain=outl=>`<g class="j0">${seg(0,outl)}<g transform="translate(0 ${L[0].toFixed(1)})"><g class="j1">${seg(1,outl)}<g transform="translate(0 ${L[1].toFixed(1)})"><g class="j2">${seg(2,outl)}</g></g></g></g></g>`;
  return `<g class="hs" data-i="${o.grp}${i}" data-x="${x}" data-y="${y}" data-a="${ang}" data-b="${bend}" data-l="${len}" transform="translate(${x} ${y})" style="--h0:${a0.toFixed(1)}deg;--h1:${a1.toFixed(1)}deg;--h2:${a2.toFixed(1)}deg;--d:${d.toFixed(2)};--g:${o.neat?.75:o.shine?.5:0}">${chain(outl)}</g>`;
}
/* all outlines first, then all fills: the hair reads as one soft mass with locks, not a row of stripes (each strand has two hosts turned together) */
const hairGroup=(list,H,o,grp)=>list?`<g class="al-hair al-hair-${grp}">${[1,0].map(ol=>list.map((s,i)=>hairStrand(s,i,H,Object.assign({grp},o),ol)).join('')).join('')}</g>`:'';
/* how dry the hair looks for a whole-body state (portraits): wet hangs and drips, dry is full */
const HAIR_D={wet:0,rinse1:.35,dry1:.6};
/* big head, big sparkly eyes, rosy cheeks, soft shading. opt: chef, apron, bow, wave, lash
   P12: the picture is grouped into movable parts (alive.js moves them with CSS; without it nothing moves and it looks the same):
   al-root(큰 동작) > al-breathe(숨) > al-tail · al-foot-l/r · 몸 · al-arm-l/r > al-arm-s · al-head > al-head-s >
   (ears > al-ear-l/r > al-ear-s) · 얼굴 · al-brows(숨김) · eyes > al-eye > al-pupil · al-lid(숨김) · al-mouth · al-mouth-o(숨김).
   head·root·breathe turn around fixed points of the 200×230 picture (view-box) so a matching overlay (salon.js) moves with them. */
const AL_VB=(x,y)=>`style="transform-box:view-box;transform-origin:${x}px ${y}px"`;
const AL_FB=(x,y)=>`style="transform-origin:${x}% ${y}%"`;
/* where each ear turns (fill-box %): bunny/cat/bear at the base, dog at the top where it hangs */
const AL_EAR={bunny:[[50,100],[50,100]],bear:[[72,88],[28,88]],cat:[[52,78],[48,78]],dog:[[66,6],[34,6]],pony:[[50,100],[50,100]]};
/* tail tucked behind the body (hidden when still, peeks out when it wags) */
const AL_TAIL={bunny:'<circle cx="124" cy="206" r="10"',bear:'<circle cx="124" cy="206" r="9"',cat:'<ellipse cx="126" cy="207" rx="14" ry="6" transform="rotate(-20 126 207)"',dog:'<ellipse cx="126" cy="207" rx="14" ry="7" transform="rotate(-20 126 207)"'};
/* P2-나 petStates: how far the ears hang down in each look (0 = up, 1 = wet and droopy), and where each ear turns for it (viewBox units) */
const EAR_DROOP={muddy:.3,foamy:.2,rinse1:.6,wet:1,dry1:.5,fluffy:0};
const EAR_PIVOT={bunny:[[78,74,-24],[122,74,24]],bear:[[56,64,-14],[144,64,14]],cat:[[62,58,-18],[138,58,18]],dog:[[50,72,-9],[150,72,9]],pony:[[66,62,-22],[134,62,22]]};
/* opt (P18): layer:false = no per-cell drawings (the salon draws them on its own overlay), hairStyle/knots = hairstyle, brushed = neat shiny hair, hairD = how dry the hair is (0..1) */
function animal(kind='bunny',mood='idle',opt={}){
  /* P4: a family face drawn as a customer */
  if((KINDS[kind]||{}).person){const q=KINDS[kind];return person(q.photo,Object.assign({kind,mood,skin:q.skin,hair:q.hair,hairStyle:q.hairStyle,cloth:q.cloth,acc:q.acc,expr:q.expr},opt))}
  const k=KINDS[kind]||KINDS.bunny,id=uid('an'),EYE='#4A2E20';let s='',c=`url(#${id}b)`;
  /* opt.state: one of games.petsalon.petStates (muddy · foamy · rinse1 · wet · dry1 · fluffy). opt.cells: per-cell values (see petLayer) so the look changes where it was touched */
  const state=opt.state||'',droop=EAR_DROOP[state]||0,vals=opt.cells||(state?stateCells(state):null),layer=vals&&opt.layer!==false?petLayer(kind,PET_CELLS(opt.grid),vals):null;
  /* P18: soft outline rings (only for the salon looks: other screens draw exactly as before) */
  const FB=vals&&!k.nofur?fluffBumps(opt.grid):null,fluffy=state==='fluffy';
  const hp=k.hair?hairPlan(kind,opt.hairStyle,opt.knots):null,hd=opt.hairD!=null?opt.hairD:(HAIR_D[state]!=null?HAIR_D[state]:1),ho={d:hd,neat:!!opt.brushed,shine:state==='fluffy'};
  const dress=!!k.dress;let bodyF=dress?`url(#${id}d)`:c,skin=c,feetF=dress?k.shoe:c;
  const ear=(side,inner)=>{const o=(AL_EAR[kind]||AL_EAR.bunny)[side==='l'?0:1],pv=(EAR_PIVOT[kind]||EAR_PIVOT.bunny)[side==='l'?0:1];
    if(droop)inner=`<g class="ps-droop" transform="rotate(${(pv[2]*droop).toFixed(1)} ${pv[0]} ${pv[1]})">${inner}</g>`;
    return `<g class="al-ear al-ear-${side}" ${AL_FB(o[0],o[1])}><g class="al-ear-s">${inner}</g></g>`};
  /* P19 art.volume: the round parts share one ball gradient per colour (page-wide defs, VOL); VOL.off keeps the old flat-centred look */
  const V=!VOL.off;let CH=`url(#${id}c)`,HU=`url(#${id}h)`,UU=`url(#${id}u)`;
  if(V){c=VOL.ball(k.body,k.edge);CH=VOL.cheek(k.cheek);if(FB){HU=VOL.ballU(k.body,k.edge,80.4,69.2,119,119,'h');UU=dress?VOL.ballU(k.dress,k.dressEdge,86.56,171.28,81.6,64.6,'u'):VOL.ballU(k.body,k.edge,86.56,171.28,81.6,64.6,'u')}
    skin=c;if(dress)bodyF=VOL.ball(k.dress,k.dressEdge);else{bodyF=c;feetF=c}}
  else{
  s+=`<defs><radialGradient id="${id}b" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="${k.body}"/><stop offset=".62" stop-color="${k.body}"/><stop offset="1" stop-color="${k.edge}"/></radialGradient>
    <radialGradient id="${id}c"><stop offset="0" stop-color="${k.cheek}" stop-opacity=".95"/><stop offset=".6" stop-color="${k.cheek}" stop-opacity=".55"/><stop offset="1" stop-color="${k.cheek}" stop-opacity="0"/></radialGradient>`;
  /* the same gradients in picture units, for the outline bumps (they must match the plain shape exactly) */
  const gU=(n,a,b,x,y,rx,ry)=>`<radialGradient id="${id}${n}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${x} ${y}) scale(${rx} ${ry})"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  if(FB)s+=gU('h',k.body,k.edge,80.4,69.2,119,119)+(dress?gU('u',k.dress,k.dressEdge,86.56,171.28,81.6,64.6):gU('u',k.body,k.edge,86.56,171.28,81.6,64.6));
  if(dress)s+=`<radialGradient id="${id}d" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="${k.dress}"/><stop offset=".62" stop-color="${k.dress}"/><stop offset="1" stop-color="${k.dressEdge}"/></radialGradient>`;
  s+=`</defs>`;}
  s+=VOL.ground(100,225,58,6);
  s+=`<g class="al-root" ${AL_VB(100,226)}><g class="al-breathe" ${AL_VB(100,228)}>`;
  /* tail (behind everything); the pony's is a bunch of hair strands */
  s+=`<g class="al-tail" ${AL_VB(114,210)}><g class="al-tail-s">${hp&&hp.tail?hairGroup(hp.tail,hp.H,ho,'t'):k.hair?'':`${AL_TAIL[kind]||AL_TAIL.bunny} fill="${kind==='dog'?k.dark:c}" ${S}/>`}</g></g>`;
  /* body, feet, arms */
  s+=`<g class="al-foot al-foot-l" ${AL_FB(60,0)}><ellipse cx="78" cy="220" rx="17" ry="9" fill="${feetF}" ${S}/>${VOL.rim(78,220,17,9,0,2)}</g><g class="al-foot al-foot-r" ${AL_FB(40,0)}><ellipse cx="122" cy="220" rx="17" ry="9" fill="${feetF}" ${S}/>${VOL.rim(122,220,17,9,0,2)}</g>`;
  if(FB)s+=fluffRing(FB.body,vals,UU,`<ellipse cx="100" cy="188" rx="48" ry="38" fill="${bodyF}" ${S}/>`,`<ellipse cx="100" cy="188" rx="46.25" ry="36.25" fill="${UU}"/>`);
  else s+=`<ellipse cx="100" cy="188" rx="48" ry="38" fill="${bodyF}" ${S}/>`+VOL.low(100,188,48,38);
  s+=dress?`<path d="M80 166Q100 176 120 166L128 214Q100 222 72 214Z" fill="${k.dressIn}" opacity=".9"/><path d="M86 168L100 176L114 168L112 160L100 168L88 160Z" fill="#fff" opacity=".8"/>`:`${V?`<ellipse class="vol-under" cx="100" cy="171" rx="36" ry="8" fill="${OL}" opacity=".1"/>`:''}<ellipse cx="100" cy="196" rx="28" ry="22" fill="${k.inner}" opacity="${V?.8:.92}"/>`;   // art.volume.overlap: the head leaves a soft shadow on the top of the body
  s+=VOL.rim(100,188,48,38);
  if(opt.apron)s+=`<path d="M72 164H128L134 220Q100 228 66 220Z" fill="${opt.apron}" ${S}/><rect x="88" y="184" width="24" height="16" rx="5" fill="#fff" opacity=".75"/><path d="M92 172c-5-6-13 1-6 7l6 5 6-5c7-6-1-13-6-7z" fill="#fff" opacity=".9" transform="translate(8 0)"/>`;
  const armL=`<ellipse cx="52" cy="182" rx="13" ry="21" fill="${skin}" ${S} transform="rotate(28 52 182)"/>`,armR=`<ellipse cx="148" cy="182" rx="13" ry="21" fill="${skin}" ${S} transform="rotate(-28 148 182)"/>`;
  s+=`<g class="al-arm al-arm-l" ${AL_FB(90,8)}><g class="al-arm-s">${VOL.under(armL)}${armL}${VOL.rim(52,182,13,21,28,2.2)}</g></g>`;
  s+=`<g class="al-arm al-arm-r" ${AL_FB(10,8)}><g class="al-arm-s"><g${opt.wave?' class="wave"':''}>${VOL.under(armR)}${armR}${VOL.rim(148,182,13,21,-28,2.2)}</g></g></g>`;
  /* fluffyFix.instead: soft inner-fur strokes a little lighter than the fur (3~4 short curves) */
  const furOn=fluffy&&!k.nofur,furLine=lum(k.body)>.9?hexMix(k.edge,k.body,.35):hexMix(k.body,'#ffffff',.45);
  if(furOn)s+=`<g class="ps-fur" stroke="${furLine}" stroke-width="3.2" fill="none" stroke-linecap="round"><path d="M66 196q-3 8 1 15"/><path d="M134 196q3 8 -1 15"/></g>`;
  if(layer)s+=`<g class="ps-cells" data-state="${state}">${layer.b}</g>`;
  /* head: ears are behind the head (they never touch the body, so drawing them after the body looks the same) */
  s+=`<g class="al-head" ${AL_VB(100,166)}><g class="al-head-s" ${AL_VB(100,166)}>`;
  if(kind==='bunny')s+=`<g class="ears">${ear('l',`<ellipse cx="72" cy="36" rx="19" ry="44" fill="${c}" ${S} transform="rotate(-10 72 36)"/>${VOL.rim(72,36,19,44,-10,2.2)}<ellipse cx="72" cy="40" rx="9" ry="31" fill="${k.inner}" transform="rotate(-10 72 40)"/>`)}
    ${ear('r',`<ellipse cx="128" cy="36" rx="19" ry="44" fill="${c}" ${S} transform="rotate(12 128 36)"/>${VOL.rim(128,36,19,44,12,2.2)}<ellipse cx="128" cy="40" rx="9" ry="31" fill="${k.inner}" transform="rotate(12 128 40)"/>`)}</g>`;
  if(kind==='bear')s+=`<g class="ears">${ear('l',`<circle cx="42" cy="50" r="25" fill="${c}" ${S}/>${VOL.rim(42,50,25,25,0,2.2)}<circle cx="42" cy="52" r="13" fill="${k.inner}"/>`)}${ear('r',`<circle cx="158" cy="50" r="25" fill="${c}" ${S}/>${VOL.rim(158,50,25,25,0,2.2)}<circle cx="158" cy="52" r="13" fill="${k.inner}"/>`)}</g>`;
  if(kind==='cat')s+=`<g class="ears">${ear('l',`<path d="M36 74L44 12L90 44Z" fill="${c}" ${S}/><path d="M49 58L52 30L74 46Z" fill="${k.inner}"/>`)}${ear('r',`<path d="M164 74L156 12L110 44Z" fill="${c}" ${S}/><path d="M151 58L148 30L126 46Z" fill="${k.inner}"/>`)}</g>`;
  if(kind==='pony')s+=`<g class="ears">${ear('l',`<path d="M48 64Q40 20 60 0Q80 24 76 58Z" fill="${c}" ${S}/><path d="M56 52Q52 26 60 14Q70 32 68 52Z" fill="#F8CFE0"/>`)}${ear('r',`<path d="M152 64Q160 20 140 0Q120 24 124 58Z" fill="${c}" ${S}/><path d="M144 52Q148 26 140 14Q130 32 132 52Z" fill="#F8CFE0"/>`)}</g>`;
  /* long hair behind the head (and a bun or braid behind it) */
  if(hp)s+=hp.pre+hairGroup(hp.back,hp.H,ho,'b');
  if(FB)s+=fluffRing(FB.head,vals,HU,`<circle cx="100" cy="100" r="70" fill="${c}" ${S}/>`,`<circle cx="100" cy="100" r="68.25" fill="${HU}"/>`);
  else if(kind==='pony')s+=`<path d="M38 98Q36 30 100 28Q164 30 162 98Q161 124 144 140Q142 186 100 188Q58 186 56 140Q39 124 38 98Z" fill="${c}" ${S}/>`;
  else s+=`<circle cx="100" cy="100" r="70" fill="${c}" ${S}/>`+VOL.low(100,100,70,70);
  if(kind!=='pony')s+=VOL.rim(100,100,70,70,0,2.8);
  s+=VOL.shine(68,56,30,17,-28);
  if(kind==='cat')s+=`<path d="M100 32v15M84 35l3 13M116 35l-3 13" stroke="${k.dark}" stroke-width="5.5" stroke-linecap="round"/>`;
  if(kind==='dog')s+=`<ellipse cx="128" cy="92" rx="21" ry="24" fill="${k.dark}" opacity=".55"/><g class="ears">${ear('l',`<path d="M36 68Q16 108 40 140Q58 120 58 78Z" fill="${V?VOL.ball(k.dark):k.dark}" ${S}/>`)}${ear('r',`<path d="M164 68Q184 108 160 140Q142 120 142 78Z" fill="${V?VOL.ball(k.dark):k.dark}" ${S}/>`)}</g>`;
  if(kind==='bunny')s+=`<path d="M90 36q10-12 20 0" stroke="${k.inner}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if(furOn)s+=`<g class="ps-fur" stroke="${furLine}" stroke-width="3.2" fill="none" stroke-linecap="round"><path d="M44 116q-4 9 0 17"/><path d="M156 116q4 9 0 17"/></g>`;
  if(hp){const cp=hp.H.cap(k);s+=cp+VOL.lit(cp.match(/^<path[^>]*\/>/)[0])}
  if(kind==='pony')s+=`<path d="M60 150Q62 126 100 124Q138 126 140 150Q140 186 100 188Q60 186 60 150Z" fill="#FBE3EE"/><path d="M84 146q4 -6 9 -1M116 146q-4 -6 -9 -1" stroke="#B07A98" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  else if(kind==='bear'||kind==='dog'||kind==='fluffdog')s+=`<ellipse cx="100" cy="127" rx="31" ry="23" fill="${k.inner}"/>`;else if(kind!=='dolly')s+=`<ellipse cx="100" cy="127" rx="25" ry="17" fill="#fff" opacity=".5"/>`;
  const chx=kind==='pony'?[60,140]:[52,148];
  s+=`<circle cx="${chx[0]}" cy="124" r="18" fill="${CH}"/><circle cx="${chx[1]}" cy="124" r="18" fill="${CH}"/>`;
  /* fluffyFix.instead: rosier cheeks */
  if(fluffy)s+=`<circle cx="${chx[0]}" cy="124" r="21" fill="${CH}" opacity=".7"/><circle cx="${chx[1]}" cy="124" r="21" fill="${CH}" opacity=".7"/>`;
  /* worried brows (shown only by alive.js for the 'sad' mood) */
  s+=`<g class="al-brows" opacity="0"><path d="M60 84L84 75M140 84L116 75" stroke="${EYE}" stroke-width="4" stroke-linecap="round"/></g>`;
  /* eyes */
  const open=!(mood==='happy'||mood==='yum'||mood==='sleepy');
  const eye=(x,out)=>{
    const side=out<0?'l':'r',lash=(opt.bow||opt.lash)?`<path d="M${x+out*11} ${92}l${out*7} -5M${x+out*8} ${87}l${out*5} -7" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`:'';
    if(mood==='happy'||mood==='yum')return `<g class="al-eye al-eye-${side}"><path d="M${x-12} 104Q${x} 86 ${x+12} 104" stroke="${EYE}" stroke-width="5.5" fill="none" stroke-linecap="round"/></g>${lash}`;
    if(mood==='sleepy')return `<g class="al-eye al-eye-${side}"><path d="M${x-11} 100Q${x} 108 ${x+11} 100" stroke="${EYE}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    const w=mood==='wow',rx=w?13:11.5,ry=w?15.5:13.5;
    return `<g class="eye al-eye al-eye-${side} al-open"><g class="al-pupil"><ellipse cx="${x}" cy="100" rx="${rx}" ry="${ry}" fill="${EYE}"/><ellipse cx="${x}" cy="${105}" rx="${rx*.62}" ry="${ry*.5}" fill="#8A5638"/>
      <circle cx="${x+4}" cy="${94}" r="${w?5.6:4.8}" fill="#fff"/><circle cx="${x-4.5}" cy="${106}" r="${w?2.8:2.3}" fill="#fff" opacity=".95"/>${VOL.glass(x,100,rx,ry)}${fluffy?`<circle cx="${x+6.5}" cy="101" r="2" fill="#fff"/>`:''}</g></g>${lash}`;
  };
  s+=`<g class="eyes al-eyes">${eye(74,-1)}${eye(126,1)}</g>`;
  /* fluffyFix.instead: sparkly eyes (a tiny star beside smiling eyes) */
  if(fluffy&&!open)s+=twinkle(96,88,4.5,'#fff')+twinkle(146,88,3.5,'#fff');
  /* closed eyelids for blinking (hidden until alive.js shows them) */
  if(open)s+=[74,126].map((x,i)=>`<path class="al-lid al-lid-${i?'r':'l'}" opacity="0" d="M${x-12} 101Q${x} 109 ${x+12} 101" stroke="${EYE}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
  if(mood==='think')s+=`<path d="M60 80l20-5M140 80l-20-5" stroke="${EYE}" stroke-width="4" stroke-linecap="round"/>`;
  /* bangs (over the forehead; the puppy's reach the eyes) and ties of a hairstyle */
  if(hp)s+=hairGroup(hp.front,hp.H,ho,'f')+hp.post;
  /* nose and mouth */
  const big=kind==='bear'||kind==='dog'||kind==='fluffdog';
  if(kind==='dolly')s+=`<ellipse cx="100" cy="117" rx="4.5" ry="3.2" fill="${k.dark}"/>`;
  else if(kind!=='pony')s+=`<ellipse cx="100" cy="116" rx="${big?9:6}" ry="${big?6.5:4.5}" fill="${big?EYE:'#FF7FA2'}"/>${big?'<ellipse cx="97" cy="114" rx="3" ry="1.6" fill="#fff" opacity=".6"/>':''}`;
  if(kind==='pony')s+=`<g transform="translate(22 58) scale(.78)">`;
  s+=`<g class="al-mouth" ${AL_FB(50,30)}>`;
  if(mood==='yum')s+=`<g class="chew"><path d="M84 124Q100 150 116 124Z" fill="#B8474B" ${S}/><path d="M91 134Q100 146 109 134Q100 129 91 134Z" fill="#FF8FA3"/></g>`;
  else if(mood==='wow')s+=`<ellipse cx="100" cy="135" rx="8.5" ry="10.5" fill="#B8474B" ${S}/>`;
  else if(mood==='happy')s+=`<path d="M82 123Q100 150 118 123Z" fill="#B8474B" ${S}/><path d="M90 134Q100 146 110 134Q100 129 90 134Z" fill="#FF8FA3"/>`;
  else s+=`<path d="M88 123q6 9 12 0q6 9 12 0" stroke="${OL}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`;
  s+=`</g><g class="al-mouth-o" opacity="0"><ellipse cx="100" cy="133" rx="7.5" ry="9.5" fill="#B8474B" ${S}/></g>`;
  if(kind==='pony')s+=`</g>`;
  if(kind==='cat')s+=`<path d="M46 114h-20M46 122l-18 5M154 114h20M154 122l18 5" stroke="${OL}" stroke-width="2.5" stroke-linecap="round"/>`;
  /* hats */
  if(opt.chef)s+=`<g><path d="M64 36Q48 8 76 2Q86 -14 100 -6Q114 -16 124 0Q152 6 136 36Z" fill="#fff" ${S}/><rect x="66" y="30" width="68" height="20" rx="7" fill="#fff" ${S}/><path d="M78 40h44" stroke="#E6EAF0" stroke-width="3" stroke-linecap="round"/></g>`;
  if(opt.bow)s+=`<g transform="translate(140 42) rotate(20)"><path d="M0 0L-22 -15Q-27 0 -22 15Z" fill="${opt.bow}" ${S}/><path d="M0 0L22 -15Q27 0 22 15Z" fill="${opt.bow}" ${S}/><circle r="7.5" fill="${opt.bow}" ${S}/><circle cx="-13" cy="-4" r="2.5" fill="#fff" opacity=".7"/></g>`;
  /* fluffyFix.instead: two shine arcs (top of the head, beside the cheek) and three still sparkles */
  if(fluffy&&k.nofur)s+=`<g class="ps-shine">${twinkle(174,58,8,'#F6DE9A')}${twinkle(22,96,6,'#F6DE9A')}${twinkle(170,158,5,'#F6DE9A')}</g>`;
  else if(fluffy)s+=`<g class="ps-shine"><path class="ps-sheen" d="M50 76Q58 48 90 38" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/><path class="ps-sheen" d="M160 104Q164 120 156 136" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>${twinkle(174,58,8,'#F6DE9A')}${twinkle(22,96,6,'#F6DE9A')}${twinkle(170,158,5,'#F6DE9A')}</g>`;
  if(layer)s+=`<g class="ps-cells" data-state="${state}">${layer.h}</g>`;
  s+=`</g></g></g></g>`;
  return `<svg class="ani ani-${mood}${state?' ps-st-'+state:''}${k.hair?' al-haired':''}" viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

/* ---------- P2-나: the changing looks of a salon customer, cell by cell ----------
   PET_CELLS(grid): the cells inside the animal picture (viewBox 0 0 200 230), grid [cols, rows] (games.petsalon.tools.coverage.grid).
   Each cell: col,row, cx,cy (centre), dx,dy (drawing point, kept off the eyes), fx,fy (fractions), face (on the face), edge ([x,y,deg] on the outline or null), head (moves with the head).
   petLayer(kind, cells, vals): vals[i] = {mud,mr, foam, leaf,lr, rinse, dry, tangle, brush, shaken} (0..1). Returns {b: body part, h: head part, states: name of each cell}.
   A cell's look: muddy (진흙) → foamy (거품) → wet (털이 처지고 물방울) → fluffy (털 뭉치와 윤기). leafy and tangled for those customers, clean when nothing is left. */
const PET_HEAD_Y=158;
const petInSil=(x,y)=>y<=192&&(Math.hypot(x-100,y-100)<=72||((x-100)/50)**2+((y-188)/40)**2<=1);   // feet are hidden by the tub, so not counted
const PET_CACHE={};
function PET_CELLS(grid=[6,6],insideOnly=true){
  const key=grid.join('x')+(insideOnly?'':'a');if(PET_CACHE[key])return PET_CACHE[key];
  const EYES=[[74,100],[126,100]],out=[];
  for(let r=0;r<grid[1];r++)for(let c=0;c<grid[0];c++){
    const w=200/grid[0],h=230/grid[1],x0=c*w,y0=r*h;let n=0,sx=0,sy=0;
    for(let a=0;a<5;a++)for(let b=0;b<5;b++){const x=x0+(a+.5)*w/5,y=y0+(b+.5)*h/5;if(petInSil(x,y)){n++;sx+=x;sy+=y}}
    if(!insideOnly){if(!n){sx=x0+w/2;sy=y0+h/2;n=1}}else if(n<3)continue;
    const cx=sx/n,cy=sy/n;let dx=cx,dy=cy;
    EYES.forEach(([ex,ey])=>{const d=Math.hypot(dx-ex,dy-ey);if(d<24){const k=26/(d||1);dx=ex+(dx-ex)*k;dy=ey+(dy-ey)*k}});
    const face=((cx-100)/54)**2+((cy-112)/36)**2<=1;let edge=null;
    if(cy<160){const d=Math.hypot(cx-100,cy-100);if(d>40)edge=[100+(cx-100)/d*70,100+(cy-100)/d*70,Math.atan2(cy-100,cx-100)*180/Math.PI+90]}
    else if(Math.abs(cx-100)>26){const an=Math.atan2((cy-188)/40,(cx-100)/50);edge=[100+50*Math.cos(an),188+40*Math.sin(an),an*180/Math.PI+90]}
    out.push({col:c,row:r,cx,cy,dx,dy,fx:cx/200,fy:cy/230,face,edge,head:cy<PET_HEAD_Y});
  }
  return PET_CACHE[key]=out;
}
/* little pictures of the looks */
const PL={
  leaf:(x,y,r,s)=>`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r}) scale(${s.toFixed(2)})"><path d="M0 -13Q12 -3 0 13Q-12 -3 0 -13Z" fill="#9CC48F" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -9V10" stroke="#6E9E66" stroke-width="1.6"/></g>`,
  foam:(x,y,s)=>`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})"><g fill="#fff" stroke="#CDE9FA" stroke-width="2"><circle r="14"/><circle cx="12" cy="8" r="9.5"/><circle cx="-10" cy="9" r="8"/></g><circle cx="-5" cy="-5" r="3.5" fill="#E8F6FF"/></g>`,
  drop:(x,y,s)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M0 -9Q8 3 0 7Q-8 3 0 -9Z" fill="#9FD0F0" stroke="#6FB2DC" stroke-width="1.5"/>`,
  /* wet fur hangs straight down in a thin lock */
  drip:(x,y,s,body)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M-8 -5Q-9 7 -3 13Q0 16 3 13Q9 7 8 -5Z" fill="${body}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`,
  damp:(x,y,r,col,o)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${col}" opacity="${o.toFixed(2)}"/>`,
  /* tangled fur: a scribbly knot; brushed: two smooth lines */
  knot:(x,y,s,col,seed)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(seed*47)%360}) scale(${s.toFixed(2)})" d="M-11 2q3 -9 7 -2t6 -3t6 4q-2 7 -8 4t-7 4t-5 -5" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  smooth:(x,y,s,col)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M-9 -4Q0 -7 9 -4M-9 3Q0 0 9 3" stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>`
};
function cellState(v){
  if(!v)return'clean';
  const rinse=v.rinse||0,dry=v.dry||0,wet=v.shaken?0:rinse*(1-dry)*(1-.6*(v.towel||0)),foam=(v.foam||0)*(1-rinse),mud=(v.mud||0)*(1-.6*(v.foam||0))*(1-rinse);
  if(dry>=.5&&!v.shaken)return'fluffy';
  if(wet>.3)return'wet';
  if(foam>.3)return'foamy';
  if(mud>.3)return'muddy';
  if((v.leaf||0)*(1-rinse)>.3)return'leafy';
  if((v.tangle||0)*(1-(v.brush||0))>.3)return'tangled';
  return'clean';
}
function petLayer(kind,cells,vals){
  const K=KINDS[kind]||KINDS.bunny,out={b:'',h:'',states:[]},put=(P,i,st,x)=>{out[P.head?'h':'b']+=`<g data-c="${i}" class="pc pc-${st}">${x}</g>`};
  /* drawn in passes so foam sits above mud everywhere, drops above foam, and so on */
  const pass=[[],[],[],[]];
  cells.forEach((P,i)=>{const v=vals[i]||{},st=cellState(v);out.states.push(st);
    const rinse=v.rinse||0,dry=v.shaken?0:(v.dry||0),wet=v.shaken?0:rinse*(1-dry)*(1-.6*(v.towel||0)),mud=(v.mud||0)*(1-.6*(v.foam||0))*(1-rinse),lf=(v.leaf||0)*(1-rinse),f=(v.foam||0)*(1-rinse);
    let a='';
    /* P4: a person's hair is only a little dusty (a pale smudge in the hair, none on the face) instead of mud */
    if(mud>.02&&!K.person)a+=`<path d="${blob(P.dx,P.dy,v.mr||10,.5,7,i+11)}" fill="#8A5A36" opacity="${(mud*.85).toFixed(2)}"/>`;
    else if(mud>.02&&P.cy<84)a+=`<path d="${blob(P.dx,P.dy,(v.mr||10)*.8,.5,7,i+11)}" fill="#B7A08A" opacity="${(mud*.5).toFixed(2)}"/>`;
    if(lf>.02)a+=PL.leaf(P.dx,P.dy,v.lr||0,.6+.4*lf);
    const tg=(v.tangle||0)*(1-(v.brush||0));
    if(tg>.02)a+=`<g opacity="${Math.min(1,tg*1.2).toFixed(2)}">${PL.knot(P.dx,P.dy,.9+.3*tg,K.dark,i+3)}${PL.knot(P.dx+7,P.dy+5,.6,K.dark,i+9)}</g>`;
    else if(v.tangle&&(v.brush||0)>=.5)a+=PL.smooth(P.dx,P.dy,1,K.dark);
    pass[0].push([P,i,a]);
    pass[1].push([P,i,f>.02?PL.foam(P.dx,P.dy,(P.face?.6:.85)*(.35+.65*f)):'']);
    let w='';if(wet>.04){w+=PL.damp(P.dx,P.dy,P.face?10:14,K.edge,.32*wet);if(P.edge&&!P.face)w+=PL.drip(P.edge[0],P.edge[1]+3,.45+.3*wet,K.edge);w+=PL.drop(P.dx+6,P.dy-4,.5+.5*wet)}
    pass[2].push([P,i,w]);
    /* P18 fluffyFix: a dried cell draws nothing here any more (no white tufts, no curls): the outline itself turns soft (fluffRing in animal) */
    pass[3].push([P,i,'']);
  });
  pass.forEach(ps=>ps.forEach(([P,i,x])=>{if(x)put(P,i,out.states[i],x)}));
  return out;
}
/* the look of the whole customer from its cells: muddy → foamy → rinse1 (헹구는 중) → wet → dry1 (말리는 중) → fluffy. '' when clean */
function petState(vals){
  if(!vals||!vals.length)return'';const n=vals.length,avg=k=>vals.reduce((s,v)=>s+(+(v&&v[k])||0),0)/n;
  if(vals.some(v=>v&&v.shaken))return'';
  const R=avg('rinse'),D=avg('dry'),F=avg('foam');
  if(R>0){if(D>=.999)return'fluffy';if(D>0)return'dry1';if(R>=.999)return'wet';return'rinse1'}
  if(F>0)return'foamy';
  if(vals.some(v=>v&&v.mud>0))return'muddy';
  return'';
}
/* a whole-body example of each look (portraits, captures): the same seeded mud every time */
function stateCells(state){
  const cells=PET_CELLS(),R=rng(77);
  return cells.map((P,i)=>{const mud=R()<.35||i%5===0?1:0,v={mud,mr:9+R()*6,foam:0,rinse:0,dry:0};
    if(state==='foamy')v.foam=1;
    if(state==='rinse1'){v.foam=1;v.rinse=P.row<2?1:0}
    if(state==='wet'){v.foam=1;v.rinse=1}
    if(state==='dry1'){v.foam=1;v.rinse=1;v.dry=P.row<3?1:0}
    if(state==='fluffy'){v.foam=1;v.rinse=1;v.dry=1}
    return v});
}
/* the empty skeleton of the same parts, for a picture drawn on top of the animal (mud, foam, wear) that must move with it.
   body/head: inner SVG strings. */
function animalOverlay(body,head){
  return `<g class="al-root" ${AL_VB(100,226)}><g class="al-breathe" ${AL_VB(100,228)}><g class="ov-body">${body||''}</g><g class="al-head" ${AL_VB(100,166)}><g class="al-head-s" ${AL_VB(100,166)}><g class="ov-head">${head||''}</g></g></g></g></g>`;
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
  s+=`<ellipse cx="4" cy="8" rx="${r+2}" ry="${r}" fill="rgba(90,50,20,.18)"/><path d="${blob(0,0,r,.05,22,7)}" fill="url(#${id}c)" stroke="${b?'#9A5E24':'#C79A5E'}" stroke-width="2"/>`+VOL.lit(`<path d="${blob(0,0,r,.05,22,7)}" fill="#000"/>`);   // P19 art.volume.objects: the crust gets the shared light and shade
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
  /* P12: grouped like animal() so alive.js can move it (no change in looks) */
  s+=`<g class="al-root" style="transform-origin:50% 100%"><g class="al-breathe" style="transform-origin:50% 100%"><g class="al-head" style="transform-origin:50% 88%"><g class="al-head-s" style="transform-origin:50% 88%">`;
  /* hair behind, buns */
  s+=`<circle cx="56" cy="70" r="38" fill="${HAIR}" ${S}/><circle cx="244" cy="70" r="38" fill="${HAIR}" ${S}/><circle cx="46" cy="58" r="10" fill="${HAIR2}" opacity=".7"/><circle cx="234" cy="58" r="10" fill="${HAIR2}" opacity=".7"/>
    <path d="M36 200Q18 64 150 44Q282 64 264 200Q268 268 238 300L62 300Q32 268 36 200Z" fill="${HAIR}" ${S}/>`;
  s=VOL.litAll(s);   // P19 art.volume: hair, buns and ears get the same light and shade
  s+=`<ellipse cx="46" cy="196" rx="15" ry="19" fill="${SKIN}" ${S}/>${VOL.lit(`<ellipse cx="46" cy="196" rx="15" ry="19" fill="#000"/>`)}<ellipse cx="254" cy="196" rx="15" ry="19" fill="${SKIN}" ${S}/>${VOL.lit(`<ellipse cx="254" cy="196" rx="15" ry="19" fill="#000"/>`)}`;
  s+=`<ellipse cx="150" cy="190" rx="106" ry="108" fill="url(#${id}s)" ${S}/>`+VOL.low(150,190,106,108)+VOL.rim(150,190,106,108,0,3);
  /* fringe */
  s+=`<path d="M48 168Q50 72 150 66Q250 72 252 168Q232 120 196 108Q184 136 150 108Q118 136 104 108Q68 120 48 168Z" fill="${HAIR}" ${S}/><path d="M92 92Q120 78 150 80" stroke="${HAIR2}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if(!VOL.off)s+=VOL.lit(`<path d="M48 168Q50 72 150 66Q250 72 252 168Q232 120 196 108Q184 136 150 108Q118 136 104 108Q68 120 48 168Z" fill="#000"/>`)+VOL.shine(108,86,40,14,-18);
  /* bun ties */
  s+=`<g transform="translate(78 96) scale(.42) rotate(-20)">${ACC.ribbon}</g><g transform="translate(222 96) scale(.42) rotate(20)">${ACC.ribbon}</g>`;
  /* eye shadow, eyes */
  if(st.lidL)s+=`<ellipse cx="106" cy="168" rx="30" ry="15" fill="${st.lidL}" opacity=".75"/>${twinkle(84,158,6)}`;
  if(st.lidR)s+=`<ellipse cx="194" cy="168" rx="30" ry="15" fill="${st.lidR}" opacity=".75"/>${twinkle(216,158,6)}`;
  const eye=(x,out)=>{const side=out<0?'l':'r';return st.mood==='happy'
    ?`<g class="al-eye al-eye-${side}"><path d="M${x-18} 196Q${x} 170 ${x+18} 196" stroke="${EYE}" stroke-width="7" fill="none" stroke-linecap="round"/></g><path d="M${x+out*18} 190l${out*9} -5M${x+out*13} 182l${out*7} -8" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`
    :`<g class="al-eye al-eye-${side} al-open"><g class="al-pupil"><ellipse cx="${x}" cy="190" rx="17" ry="20" fill="${EYE}"/><ellipse cx="${x}" cy="197" rx="10.5" ry="10" fill="#8A5638"/><circle cx="${x+6}" cy="181" r="7" fill="#fff"/><circle cx="${x-6}" cy="199" r="3.4" fill="#fff" opacity=".95"/>${VOL.glass(x,190,17,20)}</g></g>
      <path d="M${x+out*16} 178l${out*9} -6M${x+out*11} 171l${out*6} -9" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`};
  s+=`<g class="eyes al-eyes">${eye(106,-1)}${eye(194,1)}</g>`;
  if(st.mood!=='happy')s+=[106,194].map((x,i)=>`<path class="al-lid al-lid-${i?'r':'l'}" opacity="0" d="M${x-19} 192Q${x} 205 ${x+19} 192" stroke="${EYE}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('');
  s+=`<path d="M86 154q20 -11 38 0M176 154q18 -11 38 0" stroke="${HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M145 220q5 6 10 0" stroke="#E0A184" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  /* cheeks */
  s+=`<circle cx="78" cy="226" r="${st.blushL?30:24}" fill="url(#${id}c)" opacity="${st.blushL?1:.4}"/><circle cx="222" cy="226" r="${st.blushR?30:24}" fill="url(#${id}c)" opacity="${st.blushR?1:.4}"/>`;
  if(st.blushL)s+=twinkle(66,214,6);if(st.blushR)s+=twinkle(234,214,6);
  /* lips */
  const lc=st.lip||'#F2A4A2',ls=st.lip?'rgba(91,58,41,.55)':'#D98482';
  s+=`<g class="al-mouth" style="transform-origin:50% 30%">`;
  s+=st.mood==='happy'
    ?`<path d="M118 244Q150 286 182 244Q150 252 118 244Z" fill="#B8474B" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M118 244Q134 232 150 240Q166 232 182 244Q150 252 118 244Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M124 250Q150 292 176 250" fill="none" stroke="${lc}" stroke-width="9" stroke-linecap="round"/>`
    :`<path d="M122 248Q150 280 178 248Q150 256 122 248Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/><path d="M122 248Q136 234 150 243Q164 234 178 248Q150 256 122 248Z" fill="${lc}" stroke="${ls}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if(st.lip)s+=`<ellipse cx="160" cy="262" rx="8" ry="3" fill="#fff" opacity=".65"/>`;
  s+=`</g><g class="al-mouth-o" opacity="0"><ellipse cx="150" cy="258" rx="13" ry="15" fill="#B8474B" stroke="${ls}" stroke-width="2.5"/></g>`;
  if(st.acc&&ACC[st.acc])s+=`<g transform="translate(150 ${st.acc==='crown'?44:52}) scale(1.35)">${ACC[st.acc]}</g>`;
  s+=`</g></g></g></g>`;
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
/* P9 options: tint = colour overrides for the layers (노래 = forest의 다른 색), who = [animal kind, mood, opt] living in the circle
   (so four circles stay different in the christmas picture too), notes = two paper music notes in the sky (노래) */
function paper(kind='forest',o={}){
  const g=Math.max(0,Math.min(3,o.grow??3)),id='pp'+(++_pid);
  const who=(x,y,s,def)=>{const w=o.who||def;return `<g transform="translate(${x} ${y}) scale(${s})">${animal(w[0],w[1]||'happy',w[2]||{})}</g>`};
  const P0={forest:{sky:'#DCEBF0',far:'#B9D3B0',mid:'#9CC293',near:'#86B27E',path:'#EBDCC0',acc:'#E9B7A6'},
           sea:{sky:'#DDEBF2',far:'#A9CBDA',mid:'#8EBBCF',near:'#EADCC2',path:'#F3E8D3',acc:'#E8C27A'},
           christmas:{sky:'#DCE4EE',far:'#C4D3CB',mid:'#F4F1EA',near:'#FBF9F4',path:'#E9E2D6',acc:'#D9928A'},
           kitchen:{sky:'#F3E6DA',far:'#E8D3C0',mid:'#D9BFA6',near:'#EFE2D0',path:'#F6EEE2',acc:'#E3A79A'}}[kind]||{};
  const P=Object.assign({},P0,o.tint||{});
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
    if(o.notes)s+=L(`<g fill="${P.acc}"><path d="M38 34V58" stroke="${P.acc}" stroke-width="3"/><ellipse cx="33" cy="58" rx="6" ry="4.6"/><path d="M38 34L50 38V44L38 40Z"/><path d="M160 64V84" stroke="${P.acc}" stroke-width="3"/><ellipse cx="155" cy="84" rx="5.4" ry="4.2"/></g>`);
    s+=who(78,92,.3,['bunny','happy',{bow:'#E9A2B4'}]);
  }else if(kind==='sea'){
    s+=L(cloud(150,48,.9)+`<circle cx="52" cy="56" r="14" fill="#F2DDA0"/>`);
    s+=L(`<path d="M0 112Q50 104 100 112T200 108V200H0Z" fill="${P.far}"/>`);
    s+=L(`<path d="M0 132Q40 124 80 132T160 130T200 132V200H0Z" fill="${P.mid}"/>`+(g>=2?`<path d="M120 118L136 118L128 96Z" fill="#FBF9F4"/><path d="M112 120H146L140 128H118Z" fill="#D9928A"/>`:''));
    s+=L(`<path d="M0 158Q60 146 120 156T200 150V200H0Z" fill="${P.near}"/>`+(g>=1?`<path d="M40 162l8-14 8 14z" fill="#E3B48A"/><circle cx="160" cy="166" r="6" fill="#E8C7B8"/>`:'')+(g>=3?`<path d="M120 172q8-12 16 0q-8 6-16 0z" fill="#E9B7A6"/><circle cx="74" cy="176" r="4" fill="#FBF9F4"/>`:''));
    s+=who(70,104,.28,['cat','happy',{bow:'#9DB7E0'}]);
  }else if(kind==='christmas'){
    s+=L(Array.from({length:10},(_,i)=>`<circle cx="${18+i*19}" cy="${30+(i*37)%50}" r="${2+(i%3)}" fill="#FBF9F4"/>`).join(''));
    s+=L(`<path d="M0 116Q50 96 100 110T200 104V200H0Z" fill="${P.far}"/>`+tree(150,110,.9,'#8FAE98')+tree(166,114,.7,'#8FAE98'));
    s+=L(`<path d="M0 138Q60 122 120 136T200 130V200H0Z" fill="${P.mid}"/>`+house(62,138,'#C98A84')+(g>=2?house(126,140,'#9FB5C9'):''));
    s+=L(`<path d="M0 164Q70 150 130 162T200 158V200H0Z" fill="${P.near}"/>`+(g>=1?tree(30,170,1,'#7FA48A'):'')+(g>=3?`<circle cx="160" cy="170" r="10" fill="#FBF9F4"/><circle cx="160" cy="154" r="7" fill="#FBF9F4"/><path d="M160 154l8 2-8 2z" fill="#E3A060"/>`:''));
    s+=who(84,112,.26,['bear','happy',{bow:'#D9928A'}]);
  }else{ // kitchen
    s+=L(`<rect x="0" y="0" width="200" height="120" fill="${P.far}"/><rect x="30" y="30" width="50" height="40" rx="6" fill="#DDEBF0"/>`);
    s+=L(`<rect x="0" y="120" width="200" height="80" fill="${P.mid}"/>`+(g>=1?`<rect x="120" y="70" width="50" height="50" rx="8" fill="#EFE2D0"/><rect x="130" y="82" width="30" height="22" rx="4" fill="#C9A98A"/>`:''));
    s+=L(`<path d="M20 150H180L170 172H30Z" fill="${P.near}"/>`+(g>=2?`<circle cx="70" cy="146" r="12" fill="#E3A79A"/><circle cx="70" cy="140" r="6" fill="#F6EEE2"/>`:'')+(g>=3?`<path d="M120 148h28l-4 -16h-20z" fill="#F2DDA0"/>`:''));
    s+=who(84,92,.28,['bear','yum',{apron:'#E3A79A'}]);
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="paper-art"><defs>
<clipPath id="${id}c"><circle cx="100" cy="100" r="92"/></clipPath>
<filter id="${id}s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".22"/></filter>
<filter id="${id}g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .36  0 0 0 0 .23  0 0 0 0 .16  0 0 0 .09 0"/></filter></defs>
<circle cx="100" cy="103" r="97" fill="#5B3A29" opacity=".12"/><circle cx="100" cy="100" r="97" fill="#FBF9F4"/>
<g clip-path="url(#${id}c)"><rect width="200" height="200" fill="${P.sky}"/>${s}<rect width="200" height="200" filter="url(#${id}g)"/></g>
<circle cx="100" cy="100" r="92" fill="none" stroke="#5B3A29" stroke-opacity=".08" stroke-width="1.5"/></svg>`;
}

/* =========================== HANDS & NAILS (네일숍, 말랑 그림체) ===========================
   HAND.KINDS: 엄마 손 · 아기 손 · 토토 발. 손가락 [x, 폭, 위, 아래], 손톱 [x, y, 폭, 높이] (viewBox 단위, 손톱은 똑바로 서 있음)
   HAND.nail(g, st, cid): 손톱 하나를 손톱 좌표(0..w, 0..h)로 그림. st = view.nailState 한 칸
     {filed:[6], base:[칸], col:[{c,h,t}|null], cured, top:[칸], topCured, oil:[칸], drop, art:[], parts:[], shine, dust} */
const HAND=(()=>{
  const NAT='#FBE3E0',CLAW='#FFF3EA',GRID=6;
  const KINDS={
    mom:{vb:[296,330],skin:'#FFE4D0',shade:'#F3C7AC',sleeve:'#C3B4E6',cuff:'#DCD4F3',
      fingers:[[2,58,150,270],[58,62,46,236],[118,62,22,236],[178,60,40,236],[236,57,92,236]],
      nails:[[6,158,50,54],[63,54,52,62],[123,30,52,64],[183,48,50,62],[240,100,49,56]],
      palm:[10,186,282,118,52],arm:[64,280,168,60],round:.82},
    baby:{vb:[296,330],skin:'#FFEADB',shade:'#F6CDB6',sleeve:'#F0D58A',cuff:'#F7E8B8',
      fingers:[[2,58,176,272],[58,62,84,236],[118,62,64,236],[178,60,80,236],[236,57,122,236]],
      nails:[[6,183,50,46],[63,91,52,50],[123,71,52,52],[183,87,50,50],[240,129,49,44]],
      palm:[6,184,284,122,60],arm:[70,284,156,56],round:.95},
    bunnyPaw:{vb:[290,330],skin:'#FFF9F2',shade:'#F3DCC8',paw:true,bean:'#FFB3C6',
      fingers:[[4,72,74,236],[74,72,44,236],[144,72,44,236],[214,72,74,236]],
      nails:[[15,80,50,44],[85,50,50,44],[155,50,50,44],[225,80,50,44]],
      palm:[4,166,282,140,70],arm:[72,280,146,60],round:1}
  };
  KINDS.family=KINDS.mom;
  const f1=n=>+n.toFixed(1);
  const geo=(kind,i)=>{const k=KINDS[kind]||KINDS.mom,n=k.nails[i];return{x:n[0],y:n[1],w:n[2],h:n[3],ry:n[2]/2*k.round,k:n[3]*.07,paw:!!k.paw}};
  /* nail outline: round tip on top, soft curve at the root */
  const path=g=>{const {w,h,ry,k}=g;return `M0 ${f1(ry)}A${f1(w/2)} ${f1(ry)} 0 0 1 ${w} ${f1(ry)}L${w} ${f1(h-k)}Q${f1(w/2)} ${f1(h+k)} 0 ${f1(h-k)}Z`};
  const inside=(g,x,y)=>{const {w,h,ry,k}=g;if(x<0||x>w||y<0)return false;const u=(x-w/2)/(w/2);
    if(y<ry)return u*u+((y-ry)/ry)**2<=1;return y<=h-k+2*k*(1-u*u)*.5};
  /* coverage cells (6×6 over the nail box, only those inside the nail) with a rect that also covers empty neighbours */
  const cache={};
  function cells(g){
    const key=[g.w,g.h,g.ry].join(',');if(cache[key])return cache[key];
    const cw=g.w/GRID,ch=g.h/GRID,list=[],has={};
    for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){let n=0;for(let a=0;a<5;a++)for(let b=0;b<5;b++)if(inside(g,c*cw+(a+.5)*cw/5,r*ch+(b+.5)*ch/5))n++;
      if(n>=3){has[c+','+r]=1;list.push({c,r,fx:(c+.5)/GRID,fy:(r+.5)/GRID})}}
    list.forEach(e=>{let x0=e.c*cw,x1=x0+cw,y0=e.r*ch,y1=y0+ch;
      if(!has[(e.c-1)+','+e.r])x0-=cw;if(!has[(e.c+1)+','+e.r])x1+=cw;if(!has[e.c+','+(e.r-1)])y0-=ch;if(!has[e.c+','+(e.r+1)])y1+=ch;
      e.rect=[f1(x0-1),f1(y0-1),f1(x1-x0+2),f1(y1-y0+2)]});
    return cache[key]=list;
  }
  /* the six spots along the tip that the file smooths */
  const tipAng=c=>Math.PI+(c+.5)/GRID*Math.PI;
  const tipCells=g=>Array.from({length:GRID},(_,c)=>{const a=tipAng(c);return{fx:(g.w/2+g.w/2*Math.cos(a)*.8)/g.w,fy:Math.max(.02,(g.ry+g.ry*Math.sin(a)*.8)/g.h)}});
  function jag(g,c,v){   // rough, uneven free edge for one tip column (shrinks as it is filed)
    const a0=Math.PI+c/GRID*Math.PI,a1=Math.PI+(c+1)/GRID*Math.PI,cx=g.w/2,cy=g.ry,d=g.w*.12*(1-v);if(d<.6)return'';
    let p=`M${f1(cx)} ${f1(cy)}`;for(let j=0;j<=4;j++){const a=a0+(a1-a0)*j/4,o=(j%2?1:.45)*d+(j===0||j===4?0:1.5);p+=`L${f1(cx+(g.w/2+o)*Math.cos(a))} ${f1(cy+(g.ry+o)*Math.sin(a))}`}
    return `<path class="ns-jag" d="${p}Z" fill="#FFF8F1" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>`;
  }
  /* stamps (flat ink, about 20 units around 0,0) and parts (glossy, about 20 units) */
  const HEART='M0 16C-24 0 -21 -18 -10 -18C-4 -18 -1 -15 0 -10C1 -15 4 -18 10 -18C21 -18 24 0 0 16Z';
  const STAMP={
    heart:c=>`<path d="${HEART}" fill="${c}"/>`,
    star:c=>star(0,0,20,c),
    flower:c=>[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${f1(10*Math.cos(a))}" cy="${f1(10*Math.sin(a))}" r="8" fill="${c}"/>`}).join('')+`<circle r="5.5" fill="#fff" opacity=".75"/>`,
    dots:c=>`<circle cx="-10" cy="-7" r="5.5" fill="${c}"/><circle cx="9" cy="-11" r="5.5" fill="${c}"/><circle cx="2" cy="9" r="5.5" fill="${c}"/><circle cx="-12" cy="12" r="4" fill="${c}"/><circle cx="14" cy="6" r="4" fill="${c}"/>`,
    stripes:c=>[-12,0,12].map(o=>`<path d="M${o-14} 16L${o+14} -16" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/>`).join(''),
    moon:c=>`<path d="M6 -18A18 18 0 1 0 6 18A13 13 0 1 1 6 -18Z" fill="${c}"/>`
  };
  const SO=`stroke="${OL}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
  const PART={
    'round gem':(c,l)=>`<circle r="15" fill="${c}" ${SO}/><path d="M-15 0H15M-8 -13L0 0L8 -13M-8 13L0 0L8 13" stroke="${l}" stroke-width="2" fill="none"/><circle cx="-5" cy="-6" r="3.5" fill="#fff" opacity=".9"/>`,
    'heart gem':(c,l)=>`<path d="${HEART}" fill="${c}" ${SO}/><path d="M0 -10V14M-14 -6L0 4L14 -6" stroke="${l}" stroke-width="2" fill="none"/><ellipse cx="-9" cy="-9" rx="4" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-30 -9 -9)"/>`,
    pearl:(c,l)=>`<circle r="13" fill="${l}" ${SO}/><circle r="13" fill="none" stroke="${c}" stroke-width="3" opacity=".7"/><circle cx="-4" cy="-5" r="4" fill="#fff"/>`,
    'tiny ribbon':(c,l)=>`<path d="M0 0L-18 -11Q-22 0 -18 11Z" fill="${c}" ${SO}/><path d="M0 0L18 -11Q22 0 18 11Z" fill="${c}" ${SO}/><path d="M-3 3L-9 16M3 3L9 16" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle r="5.5" fill="${l}" ${SO}/>`,
    'star stud':(c,l)=>star(0,0,17,c,SO)+`<circle cx="-4" cy="-4" r="2.6" fill="#fff" opacity=".9"/>`,
    'flower part':(c,l)=>[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${f1(9*Math.cos(a))}" cy="${f1(9*Math.sin(a))}" r="7.5" fill="${c}" ${SO}/>`}).join('')+`<circle r="6" fill="#F0D58A" ${SO}/>`
  };
  function nail(g,st,cid){
    st=st||{};const {w,h}=g,P=path(g),C=cells(g),cw=w/GRID;let s='';
    if(st.filed)for(let c=0;c<GRID;c++)s+=jag(g,c,st.filed[c]||0);
    s+=`<path d="${P}" fill="${g.paw?CLAW:NAT}"/>`;
    s+=`<clipPath id="${cid}"><path d="${P}"/></clipPath><g clip-path="url(#${cid})">`;
    s+=`<path d="M${f1(w*.2)} ${f1(h*.92)}Q${f1(w/2)} ${f1(h*.78)} ${f1(w*.8)} ${f1(h*.92)}" stroke="#fff" stroke-width="${f1(w*.08)}" fill="none" opacity=".55" stroke-linecap="round"/>`;
    const now=performance.now();
    if(st.base)C.forEach((e,i)=>{const v=st.base[i];if(v>.05)s+=`<rect x="${e.rect[0]}" y="${e.rect[1]}" width="${e.rect[2]}" height="${e.rect[3]}" fill="#EAF6FF" opacity="${f1(.55*Math.min(1,v))}"/>`});
    if(st.col)C.forEach((e,i)=>{const p=st.col[i];if(!p)return;const fresh=now-p.t<500;   // steps.color.how: 0.5초 뒤 매끈하게
      s+=`<rect x="${e.rect[0]}" y="${e.rect[1]}" width="${e.rect[2]}" height="${e.rect[3]}" fill="${fresh?p.h:p.c}"/>`;
      if(fresh){const x=e.c*cw;s+=`<path d="M${f1(x+cw*.3)} ${e.rect[1]}v${e.rect[3]}M${f1(x+cw*.72)} ${e.rect[1]}v${e.rect[3]}" stroke="#fff" stroke-width="1.6" opacity=".45"/>`}});
    (st.art||[]).forEach(a=>{
      if(a.type==='line'){if(!a.pts.length)return;const d=a.pts.map((p,j)=>(j?'L':'M')+f1(p[0])+' '+f1(p[1])).join('');
        s+=a.pts.length>1?`<path d="${d}" stroke="${a.c}" stroke-width="${f1(w*.09)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:`<circle cx="${f1(a.pts[0][0])}" cy="${f1(a.pts[0][1])}" r="${f1(w*.05)}" fill="${a.c}"/>`}
      else if(a.type==='stamp'&&STAMP[a.shape])s+=`<g transform="translate(${f1(a.x)} ${f1(a.y)}) scale(${f1(w*.012)})">${STAMP[a.shape](a.c)}</g>`});
    if(st.top)C.forEach((e,i)=>{const v=st.top[i];if(v>.05&&!st.topCured)s+=`<rect x="${e.rect[0]}" y="${e.rect[1]}" width="${e.rect[2]}" height="${e.rect[3]}" fill="#fff" opacity="${f1(.3*Math.min(1,v))}"/>`});
    if(st.oil)C.forEach((e,i)=>{const v=st.oil[i];if(v>.05&&e.fy>.5)s+=`<rect x="${e.rect[0]}" y="${e.rect[1]}" width="${e.rect[2]}" height="${e.rect[3]}" fill="#F7D98B" opacity="${f1(.3*Math.min(1,v)*(e.fy))}"/>`});
    if(st.cured)s+=`<path class="ns-gloss" d="M${f1(w*.24)} ${f1(h*.22)}Q${f1(w*.16)} ${f1(h*.48)} ${f1(w*.24)} ${f1(h*.74)}" stroke="#fff" stroke-width="${f1(w*.1)}" fill="none" opacity=".6" stroke-linecap="round"/><circle cx="${f1(w*.36)}" cy="${f1(h*.16)}" r="${f1(w*.05)}" fill="#fff" opacity=".7"/>`;
    if(st.topCured)s+=`<path class="ns-gloss2" d="M${f1(w*.74)} ${f1(h*.26)}Q${f1(w*.82)} ${f1(h*.45)} ${f1(w*.76)} ${f1(h*.62)}" stroke="#fff" stroke-width="${f1(w*.07)}" fill="none" opacity=".8" stroke-linecap="round"/><path d="M${f1(w*.2)} ${f1(h*.2)}Q${f1(w*.12)} ${f1(h*.48)} ${f1(w*.2)} ${f1(h*.78)}" stroke="#fff" stroke-width="${f1(w*.05)}" fill="none" opacity=".9" stroke-linecap="round"/><rect width="${w}" height="${f1(h*.45)}" fill="#fff" opacity=".12"/>`;
    if(st.shine)s+=`<path d="${P}" fill="none" stroke="#FFF6D8" stroke-width="6" opacity=".9"/>`;
    s+=`</g><path d="${P}" fill="none" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`;
    if(st.shine)s+=twinkle(f1(w*.86),f1(h*.1),f1(w*.11),'#FFF6D8');
    if(st.drop)s+=`<path d="M${f1(w/2)} ${f1(h-14)}Q${f1(w/2+7)} ${f1(h-4)} ${f1(w/2)} ${f1(h)}Q${f1(w/2-7)} ${f1(h-4)} ${f1(w/2)} ${f1(h-14)}Z" fill="#F4CD6C" stroke="#D9A94A" stroke-width="1.5"/>`;
    (st.parts||[]).forEach((p,j)=>{if(p.hide||!PART[p.item])return;s+=`<g class="ns-part" data-j="${j}" transform="translate(${f1(p.x)} ${f1(p.y)}) scale(${f1(w*.0095)})">${PART[p.item](p.c,p.l)}</g>`});
    if(st.dust)for(let j=0;j<6;j++)s+=`<circle class="ns-dust" cx="${f1(w*(.15+.14*j))}" cy="${f1(-3-(j%2)*5)}" r="2.2" fill="#E9D8C8"/>`;
    return s;
  }
  /* finger, toe and palm silhouettes: outline layer first, fill layer on top, so the hand reads as one soft shape */
  const capsule=([x,w,t,b])=>`M${x} ${b}V${t+w/2}A${w/2} ${w/2} 0 0 1 ${x+w} ${t+w/2}V${b}Z`;
  const rr=(x,y,w,h,r)=>`M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;
  function body(kind){
    const k=KINDS[kind]||KINDS.mom,shapes=k.fingers.map(capsule).concat([rr(...k.palm),rr(k.arm[0],k.arm[1],k.arm[2],k.arm[3]+20,20)]);
    let s=shapes.map(d=>`<path d="${d}" fill="none" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>`).join('')+shapes.map(d=>`<path d="${d}" fill="${k.skin}"/>`).join('');
    const F=k.fingers;
    for(let i=1;i<F.length;i++){const x=F[i][0]+1,t=Math.max(F[i-1][2],F[i][2])+Math.min(F[i][1],F[i-1][1])*.5+10;s+=`<path d="M${x} ${t}V${k.palm[1]+12}" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`}
    if(k.paw){
      F.forEach(f=>{s+=`<ellipse class="ns-bean" cx="${f[0]+f[1]/2}" cy="${f[2]+76}" rx="14" ry="11" fill="${k.bean}"/>`});
      s+=`<path class="ns-bean" d="M${k.palm[0]+92} 236Q${k.palm[0]+141} 186 ${k.palm[0]+190} 236Q${k.palm[0]+196} 276 ${k.palm[0]+141} 276Q${k.palm[0]+86} 276 ${k.palm[0]+92} 236Z" fill="${k.bean}"/><ellipse cx="${k.palm[0]+122}" cy="232" rx="10" ry="6" fill="#fff" opacity=".55"/>`;
    }else{
      F.forEach((f,i)=>{const n=k.nails[i],y=n[1]+n[3]+22;s+=`<path d="M${f[0]+f[1]*.3} ${y}Q${f[0]+f[1]/2} ${y+5} ${f[0]+f[1]*.7} ${y}" stroke="${k.shade}" stroke-width="3" fill="none" stroke-linecap="round"/>`});
      s+=`<ellipse cx="${k.palm[0]+k.palm[2]*.62}" cy="${k.palm[1]+40}" rx="46" ry="20" fill="#fff" opacity=".3"/>`;
      s+=`<path d="${rr(k.arm[0]-8,k.arm[1]+20,k.arm[2]+16,60,18)}" fill="${k.sleeve}" ${S}/><path d="M${k.arm[0]-8} ${k.arm[1]+34}H${k.arm[0]+k.arm[2]+8}" stroke="${k.cuff}" stroke-width="8"/>`;
    }
    return s;
  }
  /* the whole hand with every nail drawn from its state. o.id: unique prefix for clip paths */
  function hand(kind,states,o={}){
    const k=KINDS[kind]||KINDS.mom,id=o.id||uid('hd');let s=body(kind);
    k.nails.forEach((n,i)=>{const g=geo(kind,i);s+=`<g class="ns-n" data-i="${i}" transform="translate(${g.x} ${g.y})">${nail(g,(states||[])[i],id+'c'+i)}</g>`});
    return `<svg class="ns-handart" data-hand="${kind}" viewBox="0 0 ${k.vb[0]} ${k.vb[1]}" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }
  /* one fingertip (or toe) with its nail, for the zoom view. returns {svg, vb:[x,y,w,h]} in nail coordinates */
  function zoom(kind,i,st,cid){
    const k=KINDS[kind]||KINDS.mom,g=geo(kind,i),f=k.fingers[i],fx=f[0]-g.x,ft=f[2]-g.y,pad=10,vb=[fx-pad,-g.h*.24,f[1]+pad*2,g.h*1.24+g.h*.6];
    const tip=`M${fx} ${vb[1]+vb[3]+20}V${ft+f[1]/2}A${f[1]/2} ${f[1]/2} 0 0 1 ${fx+f[1]} ${ft+f[1]/2}V${vb[1]+vb[3]+20}Z`;
    const s=`<path d="${tip}" fill="${k.skin}" stroke="${OL}" stroke-width="2.4"/>`+(k.paw?`<ellipse cx="${fx+f[1]/2}" cy="${ft+76}" rx="14" ry="11" fill="${k.bean}"/>`:`<path d="M${fx+f[1]*.3} ${g.h+22}Q${fx+f[1]/2} ${g.h+27} ${fx+f[1]*.7} ${g.h+22}" stroke="${k.shade}" stroke-width="2" fill="none" stroke-linecap="round"/>`)+nail(g,st,cid);
    return{vb,svg:`<svg viewBox="${vb.map(f1).join(' ')}" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`};
  }
  /* customers: mom (the makeup face), baby, Toto */
  function baby(mood){
    const EYE='#4A2E20',hp=mood==='happy';
    const eye=(x,sd)=>hp?`<g class="al-eye al-eye-${sd}"><path d="M${x-11} 104Q${x} 88 ${x+11} 104" stroke="${EYE}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`:`<g class="al-eye al-eye-${sd} al-open"><g class="al-pupil"><ellipse cx="${x}" cy="100" rx="10" ry="12" fill="${EYE}"/><circle cx="${x+3.5}" cy="95" r="4" fill="#fff"/>${VOL.glass(x,100,10,12)}</g></g>`;
    const lid=x=>hp?'':`<path class="al-lid al-lid-${x<100?'l':'r'}" opacity="0" d="M${x-11} 100Q${x} 108 ${x+11} 100" stroke="${EYE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    /* P12: grouped like animal() for alive.js (same look) */
    const V=!VOL.off,SKB=V?VOL.ball('#FFEADB','#F6CDB6'):'#FFEADB',SUIT='#F7E8B8';   // P19 art.volume
    return `<svg viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${VOL.ground(100,225,58,6)}
      <g class="al-root" style="transform-origin:50% 100%"><g class="al-breathe" style="transform-origin:50% 100%">
      <ellipse cx="100" cy="196" rx="50" ry="34" fill="${SUIT}" ${S}/>${VOL.lit('<ellipse cx="100" cy="196" rx="50" ry="34" fill="#000"/>')}${VOL.low(100,196,50,34)}${VOL.rim(100,196,50,34)}${V?`<ellipse class="vol-under" cx="100" cy="173" rx="38" ry="8" fill="${OL}" opacity=".12"/>`:''}<circle cx="100" cy="182" r="7" fill="#fff" ${S}/>
      <g class="al-head" style="transform-origin:50% 95%"><g class="al-head-s" style="transform-origin:50% 95%"><ellipse cx="34" cy="108" rx="13" ry="16" fill="${SKB}" ${S}/><ellipse cx="166" cy="108" rx="13" ry="16" fill="${SKB}" ${S}/>
      <circle cx="100" cy="104" r="68" fill="${SKB}" ${S}/>${VOL.low(100,104,68,68)}${VOL.rim(100,104,68,68,0,2.8)}<path d="M92 38Q100 22 112 30Q118 38 108 42" stroke="#7A4A2A" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${V?VOL.shine(72,66,26,14,-25):'<ellipse cx="72" cy="66" rx="20" ry="10" fill="#fff" opacity=".4" transform="rotate(-25 72 66)"/>'}
      ${V?`<circle cx="56" cy="126" r="17" fill="${VOL.cheek('#FFB3C6')}"/><circle cx="144" cy="126" r="17" fill="${VOL.cheek('#FFB3C6')}"/>`:'<circle cx="56" cy="126" r="15" fill="#FFB3C6" opacity=".6"/><circle cx="144" cy="126" r="15" fill="#FFB3C6" opacity=".6"/>'}<g class="eyes al-eyes">${eye(76,'l')}${eye(124,'r')}</g>${lid(76)}${lid(124)}
      <g class="al-mouth" style="transform-origin:50% 30%">${hp?`<path d="M86 124Q100 144 114 124Z" fill="#B8474B" ${S}/>`:`<path d="M92 126q8 7 16 0" stroke="${OL}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`}</g><g class="al-mouth-o" opacity="0"><ellipse cx="100" cy="130" rx="7" ry="8.5" fill="#B8474B" ${S}/></g>
      </g></g></g></g></svg>`;
  }
  const inner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
  function portrait(kind,mood){
    mood=mood||'idle';
    if(kind==='bunnyPaw')return animal('bunny',mood,{lash:true});
    if(kind==='baby')return baby(mood);
    const fc=face({mood:mood==='happy'?'happy':'idle'});
    if(kind==='family')return `<svg viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-6 40) scale(.46)">${inner(fc)}</g><g transform="translate(100 80) scale(.62)">${inner(baby(mood))}</g></svg>`;
    return `<svg viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g transform="translate(6 14) scale(.63)">${inner(fc)}</g></svg>`;
  }
  /* tools, drawn in 100×100, working end at the lower left (anchor about [.18,.77]).
     P12 touch.tool.face: a small face (eyes + smile); while in use (.tl-tool) the eyes blink and the smile opens (play2.js) */
  const tface=(x1,x2,y,r,mw)=>`<g class="tf"><circle class="tf-eye" cx="${x1}" cy="${y}" r="${r}" fill="${OL}"/><circle class="tf-eye" cx="${x2}" cy="${y}" r="${r}" fill="${OL}"/>`+
    `<path class="tf-smile" d="M${(x1+x2)/2-mw} ${y+r*1.6}Q${(x1+x2)/2} ${y+r*1.6+mw*.8} ${(x1+x2)/2+mw} ${y+r*1.6}" stroke="${OL}" stroke-width="${(r*.75).toFixed(1)}" fill="none" stroke-linecap="round"/>`+
    `<path class="tf-grin" opacity="0" d="M${(x1+x2)/2-mw} ${y+r*1.4}Q${(x1+x2)/2} ${y+r*1.4+mw*1.5} ${(x1+x2)/2+mw} ${y+r*1.4}Z" fill="#B8474B" stroke="${OL}" stroke-width="${(r*.5).toFixed(1)}" stroke-linejoin="round"/></g>`;
  const TOOLS={
    file:`<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="8" y="40" width="84" height="20" rx="10" fill="#C3B4E6" ${S}/><path d="M18 40H50V60H18Q8 60 8 50Q8 40 18 40Z" fill="#F2B48C"/><rect x="8" y="40" width="84" height="20" rx="10" fill="none" ${S}/>${[16,24,32,40,20,28,36,44].map((x,i)=>`<circle cx="${x}" cy="${i<4?46:54}" r="1.6" fill="#D98F62"/>`).join('')}${tface(64,76,47,2.6,3.6)}</g></svg>`,
    brush:(tip,clear)=>`<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="40" y="43" width="54" height="14" rx="7" fill="#E8A0AE" ${S}/>${tface(66,77,47.5,2.2,3)}<rect x="26" y="41" width="16" height="18" rx="3" fill="#E6EAF0" ${S}/><path d="M27 43Q12 44 7 50Q12 56 27 57Z" fill="${tip}" ${S} ${clear?'opacity=".8"':''}/>${clear?'<path d="M14 48h9" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>':''}</g></svg>`,
    dropper:`<svg viewBox="0 0 100 100"><g transform="rotate(-40 50 50)"><rect x="16" y="44" width="48" height="12" rx="6" fill="#EAF6FF" ${S}/><rect x="20" y="47" width="30" height="6" rx="3" fill="#F4CD6C"/><path d="M16 46L8 50L16 54Z" fill="#EAF6FF" ${S}/><rect x="60" y="40" width="10" height="20" rx="3" fill="#E6EAF0" ${S}/><ellipse cx="80" cy="50" rx="14" ry="13" fill="#E8A0AE" ${S}/><ellipse cx="86" cy="42" rx="3.5" ry="2" fill="#fff" opacity=".7"/>${tface(76,85,48,2.2,3)}</g></svg>`,
    stamp:c=>`<svg viewBox="0 0 100 100"><rect x="40" y="10" width="20" height="34" rx="9" fill="#D9BFA6" ${S}/><rect x="22" y="42" width="56" height="20" rx="8" fill="#C3B4E6" ${S}/><rect x="26" y="60" width="48" height="12" rx="4" fill="#E6EAF0" ${S}/><g transform="translate(50 86) scale(.5)">${STAMP.heart(c)}</g></svg>`,
    gem:c=>`<svg viewBox="0 0 100 100"><g transform="translate(50 52) scale(2.2)">${PART['round gem'](c,'#fff')}</g>${twinkle(80,20,7,'#F0D58A')}</svg>`,
    handIcon:`<svg viewBox="0 0 100 100"><path d="M30 92V60L20 50Q14 42 22 38Q28 36 32 44V22Q32 14 39 14Q45 14 45 22V18Q45 10 52 10Q58 10 58 18V22Q58 14 65 14Q71 14 71 22V30Q71 24 77 24Q83 24 83 32V64Q83 80 70 92Z" fill="#FFE4D0" ${S}/>${[[38,20],[51,16],[64,20],[77,30]].map(([x,y])=>`<rect x="${x-4}" y="${y-2}" width="9" height="9" rx="4" fill="#FF6F91"/>`).join('')}</svg>`
  };
  /* gel lamp: dome with a smiling face. back = inside, glow = soft lilac light, front = shell with the opening. viewBox 0 0 300 220 */
  const DOME='M14 206V120Q14 20 150 20Q286 20 286 120V206Z',OPEN='M46 206V142Q46 72 150 72Q254 72 254 142V206Z';
  const LAMP={vb:[300,220],open:[46,72,208,134],
    back:`<svg viewBox="0 0 300 220"><path d="${OPEN}" fill="#EDE7F6"/><rect x="2" y="198" width="296" height="20" rx="10" fill="#E6DCCB" ${S}/></svg>`,
    glow:`<svg viewBox="0 0 300 220"><defs><radialGradient id="nsLampGlow" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#E9DDFF" stop-opacity=".95"/><stop offset="1" stop-color="#C3B4E6" stop-opacity=".55"/></radialGradient></defs><path d="${OPEN}" fill="url(#nsLampGlow)"/></svg>`,
    front:`<svg viewBox="0 0 300 220"><path d="${DOME} ${OPEN}" fill="#FFFDF9" fill-rule="evenodd" ${S}/><path d="M40 108Q48 52 104 36" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".9"/>
      <circle cx="128" cy="48" r="5" fill="${OL}"/><circle cx="172" cy="48" r="5" fill="${OL}"/><path d="M138 56Q150 66 162 56" stroke="${OL}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="114" cy="58" r="7" fill="#F6D3DB"/><circle cx="186" cy="58" r="7" fill="#F6D3DB"/></svg>`,
    icon:on=>`<svg viewBox="0 0 100 100"><path d="M8 84V56Q8 16 50 16Q92 16 92 56V84Z" fill="#FFFDF9" ${S}/><path d="M22 84V62Q22 40 50 40Q78 40 78 62V84Z" fill="${on?'#DCD4F3':'#EDE7F6'}" ${S}/><circle cx="42" cy="28" r="3" fill="${OL}"/><circle cx="58" cy="28" r="3" fill="${OL}"/><path d="M45 32Q50 36 55 32" stroke="${OL}" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="4" y="82" width="92" height="10" rx="5" fill="#E6DCCB" ${S}/></svg>`
  };
  return{KINDS,geo,path,inside,cells,tipCells,nail,hand,zoom,portrait,TOOLS,LAMP,STAMP,PART,bottle:c=>polish(c),GRID};
})();

/* =========================== P9 선물 (내 방에 놓는 것, 20개 이상) ===========================
   GIFTS[i] = {id, ko, en, place:'floor'|'wall', size:'big'|'small', svg()}  — viewBox 0 0 100 100, 말랑 그림체(갈색 외곽선) + P19 입체감(VOL).
   바닥에 놓는 것은 아래 가운데(50, 94)가 바닥에 닿고 접지 그림자 두 겹. 벽에 붙이는 스티커(small)는 흰 테두리. */
const GIFTS=(()=>{
  const P={rose:'#E8A0AE',peach:'#F2B48C',butter:'#F0D58A',sage:'#A9CFA0',sky:'#A7CFE8',lilac:'#C3B4E6',cream:'#FFFDF9',wood:'#D9B48C',bear:'#D9A877',bearIn:'#F6E3C8',grey:'#7A6A62'};
  const L2=`stroke="${OL}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  const eyes=(x1,x2,y,r=2.8)=>`<circle cx="${x1}" cy="${y}" r="${r}" fill="${OL}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${OL}"/><circle cx="${x1+.9}" cy="${y-1}" r="${r*.35}" fill="#fff"/><circle cx="${x2+.9}" cy="${y-1}" r="${r*.35}" fill="#fff"/>`;
  const smile=(x,y,w=4)=>`<path d="M${x-w} ${y}Q${x} ${y+w*.9} ${x+w} ${y}" fill="none" ${L2}/>`;
  /* sticker: every outlined shape first gets a thick white edge (the paper of the sticker), then the shape itself */
  const sticker=m=>{const backs=(m.match(/<(path|ellipse|circle|rect)\b[^>]*?stroke="#5B3A29" stroke-width="3"[^>]*?\/>/g)||[]).map(x=>x.replace(/fill="[^"]*"/,'fill="#FFFFFF"').replace(/stroke="#5B3A29" stroke-width="3"/,'stroke="#FFFFFF" stroke-width="12"')).join('');
    return `<g transform="translate(0 2.5)" opacity=".12">${backs.replace(/#FFFFFF/g,OL)}</g>${backs}${m}`};
  const wheel=(x,y)=>`<circle cx="${x}" cy="${y}" r="7.5" fill="${P.grey}" ${S}/><circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/>`;
  const flags=()=>{let s=`<path d="M6 22Q50 46 94 22" fill="none" stroke="${OL}" stroke-width="2.6"/>`;const c=[P.rose,P.butter,P.sky,P.sage,P.lilac];
    [.1,.3,.5,.7,.9].forEach((t,i)=>{const x=6+88*t,y=22+48*t*(1-t);s+=`<path d="M${(x-9).toFixed(1)} ${y.toFixed(1)}L${(x+9).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y+24).toFixed(1)}Z" fill="${c[i]}" ${S}/>`});return s};
  const band=(R,r,c)=>`<path d="M${50-R} 72A${R} ${R} 0 0 1 ${50+R} 72H${50+r}A${r} ${r} 0 0 0 ${50-r} 72Z" fill="${c}" ${S}/>`;
  const D=[
    ['teddy','곰 인형','teddy bear','floor','big',()=>`<circle cx="30" cy="24" r="10" fill="${P.bear}" ${S}/><circle cx="70" cy="24" r="10" fill="${P.bear}" ${S}/><circle cx="30" cy="24" r="4.5" fill="${P.bearIn}"/><circle cx="70" cy="24" r="4.5" fill="${P.bearIn}"/>
      <ellipse cx="50" cy="72" rx="25" ry="21" fill="${P.bear}" ${S}/><ellipse cx="27" cy="86" rx="10" ry="8" fill="${P.bear}" ${S}/><ellipse cx="73" cy="86" rx="10" ry="8" fill="${P.bear}" ${S}/>
      <ellipse cx="50" cy="75" rx="12" ry="10" fill="${P.bearIn}"/><circle cx="50" cy="40" r="22" fill="${P.bear}" ${S}/><ellipse cx="50" cy="48" rx="10" ry="7.5" fill="${P.bearIn}" ${S}/>
      ${eyes(42,58,37)}<ellipse cx="50" cy="45" rx="3.4" ry="2.6" fill="${OL}"/>${smile(50,50,3.5)}<path d="M40 60L50 65L60 60L58 70L50 66L42 70Z" fill="${P.rose}" ${S}/>`],
    ['plant','화분','flower pot','floor','big',()=>`<path d="M50 58V22" stroke="${OL}" stroke-width="3"/><path d="M50 58Q28 56 24 36Q46 34 50 58Z" fill="${P.sage}" ${S}/><path d="M50 56Q72 52 78 30Q54 32 50 56Z" fill="#8DBF85" ${S}/>
      <circle cx="50" cy="20" r="10" fill="${P.rose}" ${S}/><circle cx="50" cy="20" r="4" fill="${P.butter}"/><path d="M32 64H68L63 92H37Z" fill="${P.peach}" ${S}/><rect x="27" y="56" width="46" height="11" rx="4" fill="#E9A07A" ${S}/>`],
    ['lamp','전등','lamp','floor','big',()=>`<ellipse cx="50" cy="90" rx="20" ry="5.5" fill="${P.lilac}" ${S}/><rect x="47" y="40" width="6" height="50" rx="3" fill="#B89878" ${S}/><ellipse cx="50" cy="48" rx="24" ry="7" fill="#FFF3C4" opacity=".75"/>
      <path d="M27 46L36 14H64L73 46Z" fill="${P.butter}" ${S}/><path d="M37 22H63" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>`],
    ['shelf','책장','bookshelf','floor','big',()=>`<rect x="18" y="12" width="64" height="82" rx="5" fill="${P.wood}" ${S}/><rect x="24" y="18" width="52" height="33" rx="2" fill="#F3E3CC"/><rect x="24" y="57" width="52" height="31" rx="2" fill="#F3E3CC"/>
      ${[[27,P.rose,30],[37,P.sky,28],[47,P.butter,31],[57,P.sage,26]].map(([x,c,h])=>`<rect x="${x}" y="${51-h}" width="8.5" height="${h}" rx="2" fill="${c}" ${S}/>`).join('')}
      ${[[27,P.lilac,28],[37,P.peach,25]].map(([x,c,h])=>`<rect x="${x}" y="${88-h}" width="8.5" height="${h}" rx="2" fill="${c}" ${S}/>`).join('')}<circle cx="62" cy="79" r="9" fill="${P.rose}" ${S}/>`],
    ['balloons','풍선','balloons','floor','big',()=>`<path d="M50 88Q46 72 34 56M50 88Q50 68 50 46M50 88Q56 72 66 58" stroke="${OL}" stroke-width="2" fill="none"/>
      <ellipse cx="33" cy="38" rx="14" ry="17" fill="${P.rose}" ${S}/><ellipse cx="67" cy="40" rx="14" ry="17" fill="${P.sky}" ${S}/><ellipse cx="50" cy="27" rx="14" ry="17" fill="${P.butter}" ${S}/>
      <rect x="41" y="84" width="18" height="10" rx="3.5" fill="${P.lilac}" ${S}/>`],
    ['cushion','쿠션','cushion','floor','big',()=>`<path d="M16 54Q14 34 30 34H70Q86 34 84 54V72Q86 92 70 92H30Q14 92 16 72Z" fill="${P.lilac}" ${S}/><path d="M30 44Q40 52 50 63M70 44Q60 52 50 63M30 84Q40 74 50 63M70 84Q60 74 50 63" stroke="${OL}" stroke-width="1.6" opacity=".25" fill="none"/>
      <circle cx="50" cy="63" r="4.5" fill="#A996D6" ${S}/>${eyes(40,60,56,2.4)}`],
    ['train','장난감 기차','toy train','floor','big',()=>`<rect x="34" y="34" width="22" height="22" rx="3" fill="${P.rose}" ${S}/><rect x="38" y="38" width="14" height="10" rx="2" fill="#DDEBF0" ${S}/><rect x="16" y="36" width="9" height="16" rx="2" fill="${P.grey}" ${S}/>
      <rect x="10" y="50" width="48" height="30" rx="6" fill="${P.rose}" ${S}/><path d="M58 70H62" stroke="${OL}" stroke-width="3"/><rect x="62" y="54" width="30" height="26" rx="5" fill="${P.sky}" ${S}/>
      <rect x="67" y="46" width="20" height="10" rx="3" fill="${P.butter}" ${S}/>${wheel(22,84)}${wheel(46,84)}${wheel(70,84)}${wheel(86,84)}`],
    ['ball','공','ball','floor','big',()=>`<circle cx="50" cy="62" r="30" fill="${P.butter}" ${S}/><path d="M23 52Q50 64 77 52" stroke="${P.rose}" stroke-width="8" fill="none"/><path d="M26 76Q50 86 74 76" stroke="${P.sky}" stroke-width="7" fill="none"/>`
      +`<circle cx="50" cy="62" r="30" fill="none" ${S}/>`+VOL.lit(`<circle cx="50" cy="62" r="30" fill="#000"/>`)],
    ['duck','오리 인형','rubber duck','floor','big',()=>`<path d="M14 66Q14 90 50 91Q84 91 86 66Q86 54 72 56Q64 64 52 60Q38 54 28 58Q14 56 14 66Z" fill="${P.butter}" ${S}/><circle cx="62" cy="38" r="18" fill="${P.butter}" ${S}/>
      <path d="M78 40Q93 39 93 46Q87 51 76 49Z" fill="${P.peach}" ${S}/>${eyes(64,64,34,3)}<path d="M32 68Q46 60 56 70Q48 81 36 77Z" fill="#E9C46E" ${S}/><circle cx="56" cy="44" r="4" fill="${P.rose}" opacity=".5"/>`],
    ['horse','흔들 목마','rocking horse','floor','big',()=>`<path d="M30 64L22 86M38 64L36 90M62 64L64 90M70 64L78 86" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M30 64L22 86M38 64L36 90M62 64L64 90M70 64L78 86" stroke="${P.bearIn}" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 84Q50 102 92 84" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M8 84Q50 102 92 84" stroke="${P.wood}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M24 54Q10 56 12 72" stroke="${P.rose}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="58" rx="27" ry="13" fill="${P.bearIn}" ${S}/>
      <path d="M66 52L72 28Q74 18 84 20L93 28Q95 35 88 37L80 35L79 56Z" fill="${P.bearIn}" ${S}/><path d="M71 28Q65 40 67 52" stroke="${P.rose}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="83" cy="27" r="2.6" fill="${OL}"/><rect x="40" y="45" width="18" height="11" rx="3" fill="${P.sky}" ${S}/>`],
    ['blocks','쌓기 블록','blocks','floor','big',()=>`<rect x="17" y="62" width="31" height="31" rx="4" fill="${P.sky}" ${S}/><rect x="52" y="62" width="31" height="31" rx="4" fill="${P.rose}" ${S}/><rect x="34.5" y="29" width="31" height="31" rx="4" fill="${P.butter}" ${S}/>
      <circle cx="32.5" cy="77.5" r="7" fill="#fff" opacity=".85"/><path d="M50 36L59 52H41Z" fill="#fff" opacity=".85"/>${star(67.5,77.5,9,'#fff','opacity=".85"')}`],
    ['rug','동그란 깔개','round rug','floor','big',()=>`<ellipse cx="50" cy="80" rx="45" ry="15" fill="${P.rose}" ${S}/><ellipse cx="50" cy="80" rx="33" ry="10.5" fill="#F6D3DB"/><ellipse cx="50" cy="80" rx="19" ry="6" fill="${P.butter}"/>
      ${[-36,-24,-12,0,12,24,36].map(x=>`<path d="M${50+x} ${80+Math.sqrt(Math.max(0,1-(x/45)**2))*15}v4" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`).join('')}`],
    ['clock','시계','clock','wall','big',()=>`<circle cx="25" cy="21" r="9" fill="${P.butter}" ${S}/><circle cx="75" cy="21" r="9" fill="${P.butter}" ${S}/><circle cx="50" cy="52" r="34" fill="${P.sky}" ${S}/><circle cx="50" cy="52" r="26" fill="${P.cream}" ${S}/>
      ${[0,90,180,270].map(a=>{const r=a*Math.PI/180;return `<circle cx="${(50+Math.sin(r)*20).toFixed(1)}" cy="${(52-Math.cos(r)*20).toFixed(1)}" r="2.4" fill="${OL}"/>`}).join('')}
      <path d="M50 52V36M50 52L61 58" stroke="${OL}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="52" r="3.6" fill="${P.rose}" ${S}/>`],
    ['bunting','깃발 줄','bunting','wall','big',flags],
    ['painting','해님 그림','sun picture','wall','big',()=>`<path d="M36 22L50 9L64 22" stroke="${OL}" stroke-width="2.2" fill="none"/><rect x="13" y="22" width="74" height="60" rx="5" fill="${P.wood}" ${S}/><rect x="21" y="30" width="58" height="44" rx="2" fill="#DDEBF2"/>
      <circle cx="37" cy="45" r="8" fill="${P.butter}"/><path d="M21 74Q38 54 54 66T79 58V74Z" fill="${P.sage}"/><path d="M48 74Q62 62 79 68V74Z" fill="#8DBF85"/>`],
    ['mobile','구름 모빌','cloud mobile','wall','big',()=>`<path d="M50 2V12" stroke="${OL}" stroke-width="2.2"/><path d="M32 32V58M50 32V74M68 32V58" stroke="${OL}" stroke-width="1.8"/>
      <path d="M24 33Q13 33 15 23Q19 15 29 17Q33 7 48 9Q61 5 67 15Q81 13 83 23Q85 33 74 33Z" fill="${P.cream}" ${S}/>${eyes(42,56,22,2.4)}
      ${star(32,64,9,P.butter,S)}${star(50,80,9,P.rose,S)}${star(68,64,9,P.sky,S)}`],
    ['stStar','별 스티커','star sticker','wall','small',()=>sticker(star(50,54,36,P.butter,S)+eyes(42,58,52,3)+smile(50,62,5))],
    ['stHeart','하트 스티커','heart sticker','wall','small',()=>sticker(`<path d="M50 86C10 60 14 22 34 22C42 22 48 28 50 34C52 28 58 22 66 22C86 22 90 60 50 86Z" fill="${P.rose}" ${S}/>`+`<ellipse cx="34" cy="36" rx="7" ry="4.5" fill="#fff" opacity=".6" transform="rotate(-30 34 36)"/>`)],
    ['stMoon','달 스티커','moon sticker','wall','small',()=>sticker(`<path d="M58 14A37 37 0 1 0 86 72A29 29 0 1 1 58 14Z" fill="${P.butter}" ${S}/>`+`<circle cx="40" cy="52" r="2.8" fill="${OL}"/>${smile(46,62,4)}`+star(78,26,8,P.cream,S))],
    ['stRainbow','무지개 스티커','rainbow sticker','wall','small',()=>sticker(band(38,30,P.rose)+band(30,22,P.butter)+band(22,14,P.sky)+`<circle cx="18" cy="74" r="9" fill="${P.cream}" ${S}/><circle cx="82" cy="74" r="9" fill="${P.cream}" ${S}/>`)],
    ['stFlower','꽃 스티커','flower sticker','wall','small',()=>sticker([0,72,144,216,288].map(a=>{const r=(a-90)*Math.PI/180;return `<circle cx="${(50+Math.cos(r)*20).toFixed(1)}" cy="${(52+Math.sin(r)*20).toFixed(1)}" r="15" fill="${P.lilac}" ${S}/>`}).join('')+`<circle cx="50" cy="52" r="13" fill="${P.butter}" ${S}/>`+eyes(45,55,50,2.2)+smile(50,56,3))],
    ['stButterfly','나비 스티커','butterfly sticker','wall','small',()=>sticker(`<ellipse cx="30" cy="38" rx="20" ry="17" fill="${P.sky}" ${S}/><ellipse cx="70" cy="38" rx="20" ry="17" fill="${P.sky}" ${S}/><ellipse cx="33" cy="66" rx="15" ry="13" fill="${P.rose}" ${S}/><ellipse cx="67" cy="66" rx="15" ry="13" fill="${P.rose}" ${S}/>`
      +`<ellipse cx="50" cy="52" rx="6" ry="24" fill="${P.grey}" ${S}/>`+`<path d="M47 30Q42 18 36 16M53 30Q58 18 64 16" fill="none" ${L2}/>`)]
  ];
  const memo={};
  return D.map(([id,ko,en,place,size,fn])=>({id,ko,en,place,size,svg(){if(memo[id])return memo[id];
    const body=VOL.litAll(fn());return memo[id]=`<svg viewBox="0 0 100 100" class="gift-art" data-gift="${id}" style="overflow:visible">${place==='floor'&&id!=='rug'?VOL.ground(50,94,30,5):''}${body}</svg>`}}));
})();
const giftSVG=id=>{const g=GIFTS.find(x=>x.id===id);return g?g.svg():''};

/* =========================== P7 크리스마스 집 (ART.XMAS) ===========================
   차분한 거실의 그림 조각. 모두 이 앱을 위해 새로 그린 말랑 그림체(갈색 외곽선) + P19 입체감(VOL: 빛은 왼쪽 위, 림 라이트, 접지 그림자).
   벽·바닥은 종이 공예(외곽선 없음, 겹마다 그림자 하나). 색은 themes.christmas.palette 를 씀.
   좌표: tree()/fireplace()/window()/door() 는 자기 상자(왼쪽 위 0,0) 안에 그림 → 놀이 쪽에서 translate 로 놓음.
         ornament()/star()/wreath() 는 가운데가 (0,0), stocking() 은 고리가 (0,0), gift() 는 바닥 가운데가 (0,0).
   room() 은 300 × 400 상자 밖으로도 벽과 바닥을 이어 그림(무대가 더 길거나 넓어도 빈틈 없음).
   tree 상자 160 × 280: TREE.spots(방울 자리 = 공 가운데), TREE.star(꼭대기), TREE.strings(꼬마전구 줄 3개 [x0,y0,cx,cy,x1,y1]).
   fireplace 상자 96 × 128: FIRE.hooks(양말 고리). window 상자 84 × 104. door 상자 72 × 220: DOOR.wreath(리스 자리). */
const XMAS=(()=>{
  const XP=(((window.MLCFG||{}).themes||{}).christmas||{}).palette||{};
  const C={pine:XP.pine||'#6FA58A',berry:XP.berry||'#C96A63',snow:XP.snow||'#FBF8F2',gold:XP.gold||'#E3C46A',night:XP.night||'#C9D6EA',
    wood:'#DDBB94',woodDk:'#C9A27C',trunk:'#B08A68',stone:'#E9DCCB',stoneLine:'#D6C3AC',soot:'#6E5D55',pot:'#D8A69C',potBand:'#EBCFC8',
    wall:'#EFE5D8',wainscot:'#E7D9C7',rail:'#F5EDE2',floor:'#E3CDB1',plank:'#D6BD9C',rug:'#E8D6CB',rugIn:'#EFE2D9',curtain:'#D9BDB4',frame:'#F7F1E8'};
  const f1=n=>+(+n).toFixed(1);
  const S2=`stroke="${OL}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
  const lit=m=>VOL.litAll(m);
  const tint=(c,t)=>hexMix(c,'#FFFFFF',t==null?.45:t);
  const shade=(c,t)=>hexMix(c,'#3E2A20',t==null?.18:t);
  const TREE={w:160,h:280,tiers:[[80,14,88,40,4],[80,60,162,56,5],[80,126,238,72,6]],star:[80,12],
    spots:[[78,60],[60,124],[100,120],[46,206],[82,216],[116,202]],
    strings:[[44,84,80,102,118,80],[26,156,80,180,134,152],[12,232,80,256,148,228]]};
  const FIRE={w:96,h:128,hooks:[[24,14],[64,14]]};
  const DOOR={w:72,h:220,wreath:[36,62]};
  const WIN={w:84,h:104};
  const BULB=['#F2D06B','#E07A70','#8EC9F0','#FFF4DC'];

  /* one tree tier: rounded top, plump sides, a scalloped hem (n bumps) */
  function tierD(cx,top,base,hw,n){
    const tl=top+6,w=2*hw/n,mid=top+(base-top)*.55;
    let d=`M${cx-4} ${tl}Q${cx} ${top-2} ${cx+4} ${tl}Q${f1(cx+hw*.56)} ${f1(mid)} ${cx+hw} ${base-4}`;
    for(let i=0;i<n;i++){const x0=cx+hw-i*w,x1=x0-w;d+=`Q${f1((x0+x1)/2)} ${base+8} ${f1(x1)} ${base-4}`}
    return d+`Q${f1(cx-hw*.56)} ${f1(mid)} ${cx-4} ${tl}Z`;
  }
  function hemD(cx,base,hw,n){const w=2*hw/n;let d=`M${cx+hw} ${base-4}`;for(let i=0;i<n;i++){const x0=cx+hw-i*w,x1=x0-w;d+=`Q${f1((x0+x1)/2)} ${base+8} ${f1(x1)} ${base-4}`}return d}
  function tier(t,i){
    const [cx,top,base,hw,n]=t,d=tierD(cx,top,base,hw,n),dk=shade(C.pine,.3);
    const shape=`<path d="${d}" fill="${C.pine}" ${S}/>`;
    /* a few soft needle marks (not a pattern), the rim light down the right side, a heavier hem line, one soft highlight */
    const nd=[[-.42,.62],[.18,.5],[.5,.78],[-.1,.84]].slice(0,2+i).map(([u,v])=>{const y=top+(base-top)*v,x=cx+hw*u*((y-top)/(base-top));return `<path d="M${f1(x-5)} ${f1(y-3)}Q${f1(x)} ${f1(y+3)} ${f1(x+5)} ${f1(y-3)}" fill="none" stroke="${dk}" stroke-width="2" stroke-linecap="round" opacity=".35"/>`}).join('');
    const rim=VOL.off?'':`<path class="vol-rim" d="M${cx+8} ${top+12}Q${f1(cx+hw*.52)} ${f1(top+(base-top)*.55)} ${cx+hw-7} ${base-7}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.6" stroke-linecap="round"/>`;
    const low=VOL.off?'':`<path class="vol-low" d="${hemD(cx,base,hw,n)}" fill="none" stroke="${OL}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    return shape+VOL.lit(shape)+nd+rim+low+VOL.shine(f1(cx-hw*.3),f1(top+(base-top)*.46),f1(hw*.13),f1((base-top)*.08),-30);
  }
  /* the big tree (no decorations): pot, trunk, three tiers; each upper tier leaves a soft shadow on the one below */
  function tree(){
    const T=TREE.tiers,under=t=>VOL.under(`<path d="${tierD(...t)}" fill="#000"/>`,4);
    let s=VOL.ground(80,277,50,6);
    s+=lit(`<rect x="71" y="228" width="18" height="30" rx="3" fill="${C.trunk}" ${S}/>`);
    s+=lit(`<path d="M50 250H110L103 276Q80 281 57 276Z" fill="${C.pot}" ${S}/>`)+`<path d="M52 257H108" stroke="${C.potBand}" stroke-width="5"/><path d="M50 250H110L103 276Q80 281 57 276Z" fill="none" ${S}/>`;
    s+=lit(`<rect x="46" y="244" width="68" height="11" rx="4" fill="${tint(C.pot,.25)}" ${S}/>`);
    s+=tier(T[2],2)+under(T[1])+tier(T[1],1)+under(T[0])+tier(T[0],0);
    return `<g class="xm-tree-art">${s}</g>`;
  }
  /* a soft round glow behind the tree (shown when the room is done) */
  function treeGlow(){return `<radialGradient id="xmGlowG"><stop offset="0" stop-color="#FFF3C9" stop-opacity=".95"/><stop offset=".55" stop-color="#FFE9B0" stop-opacity=".45"/><stop offset="1" stop-color="#FFE9B0" stop-opacity="0"/></radialGradient>`}
  /* ornament ball, centre (0,0), radius 11. c = colour (calm hex on a card, vivid on the tree). band: a soft stripe */
  function ornament(c,o={}){
    const r=o.r||11,band=o.band!==false;
    return `<g class="xm-orn"><path d="M0 ${-r-10}V${-r-3}" stroke="${OL}" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="${-r-11}" r="2.4" fill="none" stroke="${OL}" stroke-width="1.6"/>
      ${lit(`<rect x="-4.6" y="${-r-4.5}" width="9.2" height="6" rx="1.6" fill="#E9D7A8" ${S2}/>`)}
      <circle class="xm-ball" cx="0" cy="0" r="${r}" fill="${c}" ${S}/>${band?`<path d="M${f1(-r*.92)} ${f1(r*.18)}Q0 ${f1(r*.62)} ${f1(r*.92)} ${f1(r*.18)}" fill="none" stroke="#fff" stroke-width="${f1(r*.26)}" stroke-linecap="round" opacity=".38"/>`:''}
      ${VOL.lit(`<circle cx="0" cy="0" r="${r}" fill="#000"/>`)}${VOL.rim(0,0,r,r,0,2)}${VOL.shine(f1(-r*.38),f1(-r*.4),f1(r*.36),f1(r*.26),-30)}</g>`;
  }
  /* the top star, centre (0,0) */
  function topStar(c,o={}){
    const r=o.r||18,body=star(0,0,r,c,S);
    return `<g class="xm-star">${o.halo?`<circle r="${r*1.9}" fill="url(#xmGlowG)" opacity=".8"/>`:''}${body}${VOL.lit(star(0,0,r,'#000'))}${VOL.shine(f1(-r*.24),f1(-r*.3),f1(r*.22),f1(r*.15),-30)}</g>`;
  }
  /* one string of little lights along a tree tier (tree box units). Lit: the bulbs glow softly (no blinking) */
  function lights(i){
    const [x0,y0,cx,cy,x1,y1]=TREE.strings[i],n=5+i;
    const at=t=>[(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1];
    let s=`<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="#5E7D69" stroke-width="1.8" stroke-linecap="round"/>`,halo='',bulb='';
    for(let k=0;k<n;k++){const [x,y]=at((k+.5)/n),c=BULB[(k+i)%BULB.length];
      halo+=`<circle cx="${f1(x)}" cy="${f1(y+4)}" r="8.5" fill="${c}" opacity=".32"/>`;
      bulb+=`<rect x="${f1(x-2)}" y="${f1(y-1)}" width="4" height="3.4" rx="1" fill="#8C7A6A"/><ellipse cx="${f1(x)}" cy="${f1(y+5)}" rx="3.6" ry="4.6" fill="${c}" stroke="${OL}" stroke-width="1.4"/><ellipse cx="${f1(x-1.1)}" cy="${f1(y+3.4)}" rx="1.1" ry="1.6" fill="#fff" opacity=".7"/>`}
    return `<g class="xm-string" data-i="${i}"><g class="xm-halo">${halo}</g>${s}${bulb}</g>`;
  }
  /* stocking, the hook at (0,0) */
  function stocking(c){
    const body=`<path d="M-9 6H9V30Q9 33.5 12 35L16 37Q23 40 21.5 47.5Q19.5 54.5 11 53L-1 50.5Q-11 48 -10 37Z" fill="${c}" ${S}/>`;
    return `<g class="xm-stock"><path d="M0 -6V4" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>${body}${VOL.lit(body)}
      <path d="M14 39.5Q21 41 20.5 47.5Q19.5 52.5 14 52.5Z" fill="#fff" opacity=".42"/><path d="M-10 38Q-8 46.5 0 48.5L1 41Q-5.5 40 -10 38Z" fill="#fff" opacity=".3"/>
      ${lit(`<rect x="-12" y="1" width="24" height="12" rx="5" fill="${C.snow}" ${S}/>`)}<ellipse cx="-5" cy="5" rx="4" ry="2" fill="#fff" opacity=".8"/></g>`;
  }
  /* a present, bottom centre (0,0). rb = ribbon colour */
  function gift(c,rb){
    const r=rb||C.snow;
    return `<g class="xm-gift">${VOL.ground(0,1,24,4)}${lit(`<rect x="-20" y="-30" width="40" height="30" rx="4" fill="${c}" ${S}/>`)}<rect x="-4.5" y="-30" width="9" height="30" fill="${r}"/><rect x="-20" y="-30" width="40" height="30" rx="4" fill="none" ${S}/>
      ${lit(`<rect x="-23" y="-38" width="46" height="10" rx="3" fill="${c}" ${S}/>`)}<rect x="-4.5" y="-38" width="9" height="10" fill="${r}"/><rect x="-23" y="-38" width="46" height="10" rx="3" fill="none" ${S}/>
      ${lit(`<path d="M0 -38Q-15 -52 -18 -43Q-19 -36 0 -38Z" fill="${r}" ${S}/><path d="M0 -38Q15 -52 18 -43Q19 -36 0 -38Z" fill="${r}" ${S}/>`)}<circle cx="0" cy="-38" r="3.6" fill="${r}" ${S2}/>
      ${VOL.shine(-12,-23,5,3.4,-20)}</g>`;
  }
  /* wreath, centre (0,0), bow colour c */
  function wreath(c){
    const lf=[],g1=C.pine,g2=tint(C.pine,.22);
    for(let k=0;k<14;k++){const a=k/14*Math.PI*2,x=Math.cos(a)*20,y=Math.sin(a)*20,deg=a*180/Math.PI+90;
      lf.push(`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="8.5" ry="5.6" transform="rotate(${f1(deg+(k%2?18:-18))} ${f1(x)} ${f1(y)})" fill="${k%2?g2:g1}" ${S2}/>`)}
    const berries=[[-17,-10],[-14,-14],[-11,-11],[16,-11],[13,-15],[18,-6],[-6,-21],[-1,-22]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.7" fill="${C.berry}" stroke="${OL}" stroke-width="1.2"/>`).join('');
    const bow=`<path d="M0 18Q-15 6 -17 15Q-18 24 0 18Z" fill="${c}" ${S}/><path d="M0 18Q15 6 17 15Q18 24 0 18Z" fill="${c}" ${S}/><path d="M-2 19L-8 34L-2 31L1 35L2 19Z" fill="${c}" ${S}/><path d="M2 19L9 33L3 31Z" fill="${c}" ${S}/>`;
    return `<g class="xm-wreath"><path d="M0 -33V-24" stroke="${OL}" stroke-width="2"/><circle cx="0" cy="-34" r="2.6" fill="${C.gold}" stroke="${OL}" stroke-width="1.4"/>
      ${VOL.under(`<circle cx="0" cy="0" r="27" fill="#000"/>`,3)}${lit(lf.join(''))}${berries}${lit(bow)}<circle cx="0" cy="18" r="3.6" fill="${c}" ${S2}/></g>`;
  }
  /* fireplace (96 × 128): mantle, stones, fire, the three empty stocking hooks */
  function fireplace(){
    const stones=[[12,22,22,12],[38,20,26,13],[68,22,18,12],[10,40,16,12],[80,40,10,13],[10,60,8,16],[82,62,8,16],[10,84,8,18],[82,88,8,18],[10,106,8,14],[82,108,8,14]]
      .map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${C.stoneLine}" stroke-width="1.6"/>`).join('');
    const body=`<rect x="6" y="10" width="84" height="116" rx="3" fill="${C.stone}" ${S}/>`;
    const hole=`<path d="M22 126V66Q22 50 38 50H58Q74 50 74 66V126Z" fill="${C.soot}" ${S}/>`;
    const fire=`<g class="xm-fire"><path d="M48 120Q30 116 34 98Q38 104 42 100Q38 86 50 76Q50 90 58 92Q64 84 60 76Q72 92 66 108Q64 118 48 120Z" fill="#EFA982" ${S2}/><path d="M48 118Q39 114 42 104Q46 108 49 104Q48 96 54 92Q56 100 60 102Q60 114 48 118Z" fill="${C.gold}"/></g>`;
    const logs=lit(`<rect x="30" y="116" width="38" height="8" rx="4" fill="#B98E6C" ${S2}/>`)+lit(`<rect x="34" y="110" width="30" height="7" rx="3.5" fill="#A87F60" ${S2}/>`);
    const hooks=FIRE.hooks.map(([x,y])=>`<path d="M${x} ${y-2}V${y+3}Q${x} ${y+7} ${x+3.5} ${y+6}" fill="none" stroke="#B7954E" stroke-width="2.4" stroke-linecap="round"/>`).join('');
    return `<g class="xm-fireplace">${VOL.ground(48,128,52,5)}${lit(body)}${stones}${hole}<ellipse cx="48" cy="104" rx="22" ry="20" fill="#F2B48C" opacity=".22"/>${fire}${logs}
      ${lit(`<rect x="0" y="120" width="96" height="9" rx="3" fill="${C.stoneLine}" ${S}/>`)}${VOL.under(`<rect x="2" y="2" width="92" height="12" fill="#000"/>`,3)}${lit(`<rect x="-2" y="0" width="100" height="13" rx="3.5" fill="${C.wood}" ${S}/>`)}${hooks}</g>`;
  }
  /* window (84 × 104), snowy night outside. n = snow the child put on it (0..3): frost in the corners, flakes on the glass, a pile on the sill */
  function windowArt(n){
    n=n|0;const sky=C.night;
    const flake=(x,y,r)=>`<g transform="translate(${x} ${y})" stroke="#fff" stroke-width="1.6" stroke-linecap="round">${[0,60,120].map(a=>`<path d="M${f1(Math.cos(a*Math.PI/180)*r)} ${f1(Math.sin(a*Math.PI/180)*r)}L${f1(-Math.cos(a*Math.PI/180)*r)} ${f1(-Math.sin(a*Math.PI/180)*r)}"/>`).join('')}</g>`;
    const out=[[20,22],[30,40],[52,18],[64,44],[24,62],[58,64]].map(([x,y],k)=>`<circle cx="${x}" cy="${y}" r="${1.4+(k%2)}" fill="#fff" opacity=".9"/>`).join('');
    const frost=n>=1?[[11,11,1,1],[73,11,-1,1],[11,81,1,-1],[73,81,-1,-1]].slice(0,n>=3?4:2).map(([x,y,sx,sy])=>`<path d="M${x} ${y}h${12*sx}q${-2*sx} ${5*sy} ${-6*sx} ${5*sy}q0 ${5*sy} ${-6*sx} ${7*sy}Z" fill="#fff" opacity=".75"/>`).join(''):'';
    const flakes=n>=2?flake(26,30,4.5)+flake(58,28,3.6)+flake(30,62,3.6)+flake(60,66,4.5)+(n>=3?flake(44,48,3):''):'';
    const pile=n>=1?`<path d="M2 88Q8 ${84-n*2} 18 ${85-n} Q30 ${80-n*2.5} 42 ${84-n} Q56 ${80-n*2.5} 66 ${84-n} Q78 ${82-n*2} 82 88Z" fill="${C.snow}" ${S2}/>`:'';
    const curtain=`<path d="M-6 0H14Q9 44 18 98H-6Z" fill="${C.curtain}" ${S}/><path d="M90 0H70Q75 44 66 98H90Z" fill="${C.curtain}" ${S}/>`;
    return `<g class="xm-window">${lit(`<rect x="4" y="4" width="76" height="84" rx="8" fill="${C.frame}" ${S}/>`)}<rect x="11" y="11" width="62" height="70" rx="4" fill="${sky}"/>
      <circle cx="60" cy="25" r="7" fill="#F6EBC8"/><path d="M11 64Q30 54 46 62T73 58V81H11Z" fill="${C.snow}"/><path d="M22 66l5 -12 5 12z M52 64l4 -10 4 10z" fill="#9EB8AD"/>${out}${frost}${flakes}
      <path d="M42 11V81M11 46H73" stroke="${C.frame}" stroke-width="4.5"/><rect x="11" y="11" width="62" height="70" rx="4" fill="none" stroke="${OL}" stroke-width="2"/>
      ${lit(curtain)}${lit(`<rect x="-2" y="84" width="88" height="9" rx="3" fill="${C.wood}" ${S}/>`)}${pile}${lit(`<rect x="-10" y="-5" width="104" height="7" rx="3.5" fill="${C.woodDk}" ${S}/>`)}</g>`;
  }
  /* door (72 × 220) with a small nail for the wreath */
  function door(){
    const slab=`<rect x="7" y="7" width="58" height="213" rx="3" fill="${C.wood}" ${S}/>`;
    return `<g class="xm-door">${lit(`<rect x="0" y="0" width="72" height="220" rx="6" fill="${C.woodDk}" ${S}/>`)}${lit(slab)}
      <rect x="15" y="100" width="42" height="50" rx="5" fill="none" stroke="${OL}" stroke-width="2" opacity=".28"/><rect x="15" y="158" width="42" height="52" rx="5" fill="none" stroke="${OL}" stroke-width="2" opacity=".28"/>
      <rect x="15" y="22" width="42" height="68" rx="5" fill="none" stroke="${OL}" stroke-width="2" opacity=".28"/>
      ${lit(`<circle cx="56" cy="132" r="4.6" fill="${C.gold}" ${S2}/>`)}<circle cx="${DOOR.wreath[0]}" cy="${DOOR.wreath[1]-34}" r="2" fill="#9C8466"/></g>`;
  }
  /* the room behind everything (300 × 400): paper layers, no outline, one soft shadow each */
  function room(){
    const L=d=>`<g filter="url(#xmPaper)">${d}</g>`;
    return `<defs><filter id="xmPaper" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#5B3A29" flood-opacity=".18"/></filter>${treeGlow()}</defs>
      <rect x="-300" y="-400" width="900" height="800" fill="${C.wall}"/>${L(`<rect x="-300" y="236" width="900" height="78" fill="${C.wainscot}"/>`)}${L(`<rect x="-300" y="232" width="900" height="6" fill="${C.rail}"/>`)}
      ${L(`<rect x="-300" y="312" width="900" height="88" fill="${C.floor}"/>`)}<path d="M-300 338H600M-300 366H600" stroke="${C.plank}" stroke-width="1.2"/><path d="M60 312L52 338M180 338L186 366M110 366L104 400M250 312L246 338" stroke="${C.plank}" stroke-width="1.2"/>
      ${L(`<rect x="-300" y="308" width="900" height="7" fill="${C.rail}"/>`)}${L(`<ellipse cx="150" cy="342" rx="112" ry="25" fill="${C.rug}"/><ellipse cx="150" cy="342" rx="84" ry="17" fill="${C.rugIn}"/>`)}`;
  }
  /* Toto's red scarf, laid over ART.animal (viewBox 200 × 230) */
  const scarf=`<svg class="xm-scarf" viewBox="0 0 200 230" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">${lit(`<path d="M118 156L130 200L112 203L104 160Z" fill="${C.berry}" ${S}/>`)}<path d="M113 172l12 -3M116 186l12 -3" stroke="${C.snow}" stroke-width="4" stroke-linecap="round"/>
    ${lit(`<path d="M60 146Q100 168 140 146L142 160Q100 184 58 160Z" fill="${C.berry}" ${S}/>`)}<path d="M74 156l2 10M92 160v11M110 160v11M126 156l-2 10" stroke="${C.snow}" stroke-width="4" stroke-linecap="round"/></svg>`;
  /* a small decorated tree for the place tile and the home (calm colours) */
  function icon(){
    const orn=(x,y,c)=>`<g transform="translate(${x} ${y}) scale(.9)">${ornament(c,{band:false})}</g>`;
    return `<svg viewBox="-6 -4 172 292" class="xm-icon" style="overflow:visible">${tree()}${lights(1)}${orn(60,124,'#E0786F')}${orn(100,120,'#EBCB6B')}${orn(82,214,'#7D9BE0')}${orn(46,206,'#E89AAE')}${orn(116,202,'#AE9BE0')}${orn(78,60,'#8FC3E6')}<g transform="translate(80 14)">${topStar('#EBCB6B',{r:20})}</g></svg>`;
  }
  /* standalone pictures for the cards and the level-up moment */
  function card(kind,c,rb){
    if(kind==='orn')return `<svg viewBox="-19 -26 38 40" style="overflow:visible">${ornament(c)}</svg>`;
    if(kind==='star')return `<svg viewBox="-24 -24 48 48" style="overflow:visible">${topStar(c)}</svg>`;
    if(kind==='stock')return `<svg viewBox="-22 -10 56 68" style="overflow:visible">${stocking(c)}</svg>`;
    if(kind==='gift')return `<svg viewBox="-30 -54 60 60" style="overflow:visible">${gift(c,rb)}</svg>`;
    if(kind==='wreath')return `<svg viewBox="-36 -40 72 78" style="overflow:visible">${wreath(c)}</svg>`;
    if(kind==='lights')return `<svg viewBox="20 140 120 52" style="overflow:visible">${lights(1)}</svg>`;
    if(kind==='bulb')return `<svg viewBox="-16 -18 32 36" style="overflow:visible"><circle cx="0" cy="4" r="14" fill="${c||BULB[0]}" opacity=".3"/>${lit(`<rect x="-5" y="-15" width="10" height="8" rx="2" fill="#A8968A" ${S2}/>`)}<ellipse cx="0" cy="3" rx="8.5" ry="11" fill="${c||BULB[0]}" ${S}/>${VOL.lit('<ellipse cx="0" cy="3" rx="8.5" ry="11" fill="#000"/>')}${VOL.shine(-3,-1.5,2.6,3.6,-20)}</svg>`;
    if(kind==='snow')return `<svg viewBox="-24 -24 48 48" style="overflow:visible"><circle r="20" fill="${C.night}" ${S}/><g stroke="#fff" stroke-width="3.4" stroke-linecap="round">${[0,60,120].map(a=>`<path d="M${f1(Math.cos(a*Math.PI/180)*13)} ${f1(Math.sin(a*Math.PI/180)*13)}L${f1(-Math.cos(a*Math.PI/180)*13)} ${f1(-Math.sin(a*Math.PI/180)*13)}"/>`).join('')}</g>${VOL.shine(-7,-8,6,4,-30)}</svg>`;
    if(kind==='tree')return icon();
    return '';
  }
  return {C,TREE,FIRE,DOOR,WIN,BULB,tree,ornament,star:topStar,lights,stocking,gift,wreath,fireplace,window:windowArt,door,room,scarf,icon,card};
})();

/* =========================== P4 가족 얼굴 캐릭터 (ART.person) ===========================
   오려낸 사진 얼굴(256px, 타원) + 그린 머리카락·몸·옷·손. 동물(animal)과 같은 200×230 그림판에 같은 묶음(al-*)으로 그려서
   살아 있는 움직임(alive.js)과 미용실 칸 그림(petLayer)을 그대로 씁니다. 눈·입은 사진이라 따로 없습니다.
   photo: 오려낸 얼굴(PNG 주소) · opt: {skin, hair, hairStyle(short|long|bun|curl), cloth, acc(ACC 이름), mood, expr:{smile,wow}, cap:false, state, cells, grid, layer}
   얼굴 타원: 가운데 (100,104), 가로 52 세로 62. 사진 한 장 안의 타원은 가로 107 세로 126(256 그림판), 그래서 옷·머리를 같은 비율로 맞춤. */
const PE={cx:100,cy:104,rx:52,ry:62};
const PE_SKIN='#F6D5BE',PE_HAIR='#5A3A2A',PE_CLOTH='#A9CFA0';
const PE_STYLES=['short','long','bun','curl'];
const HEXRE=/^#[0-9a-f]{6}$/i;
function person(photo,opt={}){
  if(!photo)return '';
  const id=uid('pe'),skin=HEXRE.test(opt.skin||'')?opt.skin:PE_SKIN,hair=HEXRE.test(opt.hair||'')?opt.hair:PE_HAIR,cloth=HEXRE.test(opt.cloth||'')?opt.cloth:PE_CLOTH;
  const hs=PE_STYLES.includes(opt.hairStyle)?opt.hairStyle:'short',mood=opt.mood||'idle',state=opt.state||'';
  const ex=opt.expr||{},img=mood==='happy'&&ex.smile?ex.smile:(mood==='wow'||mood==='yum')&&ex.wow?ex.wow:photo;
  const edge=hexMix(skin,'#C9906E',.5),hairE=hexMix(hair,'#2A1A12',.4),clothE=hexMix(cloth,'#4A2C1E',.22),shoe=hexMix(cloth,'#4A2C1E',.45);
  const vals=opt.cells||(state?stateCells(state):null),layer=vals&&opt.layer!==false?petLayer(opt.kind||'bunny',PET_CELLS(opt.grid),vals):null;
  const SK=VOL.ball(skin,edge),HR=VOL.ball(hair,hairE),CL=VOL.ball(cloth,clothE),SH=VOL.ball(shoe,hexMix(shoe,'#2A1A12',.3));
  let s='';
  s+=VOL.ground(100,225,58,6);
  s+=`<g class="al-root" ${AL_VB(100,226)}><g class="al-breathe" ${AL_VB(100,228)}>`;
  /* feet and body (round shoulders, a soft collar) */
  s+=`<g class="al-foot al-foot-l" ${AL_FB(60,0)}><ellipse cx="78" cy="220" rx="17" ry="9" fill="${SH}" ${S}/>${VOL.rim(78,220,17,9,0,2)}</g><g class="al-foot al-foot-r" ${AL_FB(40,0)}><ellipse cx="122" cy="220" rx="17" ry="9" fill="${SH}" ${S}/>${VOL.rim(122,220,17,9,0,2)}</g>`;
  const bodyD='M58 222Q50 178 76 166Q100 160 124 166Q150 178 142 222Q100 232 58 222Z';
  s+=`<path d="${bodyD}" fill="${CL}" ${S}/>`+VOL.lit(`<path d="${bodyD}" fill="#000"/>`);
  s+=`<path d="M82 166Q100 186 118 166Q100 160 82 166Z" fill="${SK}" ${S}/><path d="M80 168Q100 192 120 168" stroke="${hexMix(cloth,'#FFFFFF',.45)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M70 200Q100 210 130 200" stroke="${hexMix(cloth,'#4A2C1E',.12)}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
  s+=VOL.rim(100,194,44,34,0,2.2);
  const armL=`<ellipse cx="52" cy="182" rx="13" ry="21" fill="${CL}" ${S} transform="rotate(28 52 182)"/>`,armR=`<ellipse cx="148" cy="182" rx="13" ry="21" fill="${CL}" ${S} transform="rotate(-28 148 182)"/>`;
  s+=`<g class="al-arm al-arm-l" ${AL_FB(90,8)}><g class="al-arm-s">${VOL.under(armL)}${armL}<circle cx="42" cy="201" r="8.5" fill="${SK}" ${S}/></g></g>`;
  s+=`<g class="al-arm al-arm-r" ${AL_FB(10,8)}><g class="al-arm-s"><g>${VOL.under(armR)}${armR}<circle cx="158" cy="201" r="8.5" fill="${SK}" ${S}/></g></g></g>`;
  if(layer)s+=`<g class="ps-cells" data-state="${state}">${layer.b}</g>`;
  /* head */
  s+=`<g class="al-head" ${AL_VB(100,166)}><g class="al-head-s" ${AL_VB(100,166)}>`;
  s+=`<ellipse cx="100" cy="164" rx="14" ry="11" fill="${SK}" ${S}/>`;
  const back={short:'<ellipse cx="100" cy="92" rx="63" ry="64"/>',curl:'<ellipse cx="100" cy="96" rx="57" ry="60"/>',
    bun:'<ellipse cx="100" cy="92" rx="63" ry="64"/><circle cx="100" cy="28" r="21"/>',
    long:'<path d="M36 98Q32 32 100 30Q168 32 164 98Q172 152 162 186Q132 196 128 162L72 162Q68 196 38 186Q28 152 36 98Z"/>'}[hs];
  s+=`<g class="pe-hair" fill="${HR}" ${S}>${back}</g>${VOL.lit(`<g fill="#000">${back}</g>`)}`;
  if(hs==='bun')s+=`<path d="M82 40Q100 50 118 40" stroke="${hexMix(hair,'#FFFFFF',.35)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
  s+=`<ellipse cx="${PE.cx-PE.rx-1}" cy="112" rx="9" ry="12" fill="${SK}" ${S}/><ellipse cx="${PE.cx+PE.rx+1}" cy="112" rx="9" ry="12" fill="${SK}" ${S}/>`;
  /* face: a skin-coloured base (the soft photo edge melts into it), the photo, a thin outline */
  s+=`<defs><clipPath id="${id}k"><ellipse cx="${PE.cx}" cy="${PE.cy}" rx="${PE.rx}" ry="${PE.ry}"/></clipPath></defs>`;
  s+=`<ellipse cx="${PE.cx}" cy="${PE.cy}" rx="${PE.rx}" ry="${PE.ry}" fill="${SK}"/>`;
  s+=`<g clip-path="url(#${id}k)"><image class="pe-photo" href="${img}" x="${PE.cx-PE.rx}" y="${PE.cy-PE.ry}" width="${PE.rx*2}" height="${PE.ry*2}" preserveAspectRatio="xMidYMid slice"/></g>`;
  s+=`<ellipse cx="${PE.cx}" cy="${PE.cy}" rx="${PE.rx}" ry="${PE.ry}" fill="none" stroke="${OL}" stroke-width="3"/>`+VOL.low(PE.cx,PE.cy,PE.rx,PE.ry)+VOL.rim(PE.cx,PE.cy,PE.rx,PE.ry,0,2.6);
  if(mood==='happy'||state==='fluffy')s+=`<circle cx="66" cy="132" r="11" fill="${VOL.cheek('#FF9AA8')}" opacity=".7"/><circle cx="134" cy="132" r="11" fill="${VOL.cheek('#FF9AA8')}" opacity=".7"/>`;
  /* the hair over the forehead (a thin fringe, so the photo's own hairline and the drawn hair meet) */
  if(opt.cap!==false&&hs!=='curl'){
    const cap=hs==='long'?'M47 92Q48 46 100 42Q152 46 153 92Q140 66 100 64Q60 66 47 92Z':'M48 88Q50 46 100 42Q150 46 152 88Q138 62 100 60Q62 62 48 88Z';
    s+=`<path d="${cap}" fill="${HR}" ${S}/>`+VOL.lit(`<path d="${cap}" fill="#000"/>`)+VOL.shine(78,50,24,8,-18);
  }
  if(hs==='curl')s+=`<path d="M100 44Q92 28 104 24Q116 22 112 34Q108 40 102 36" stroke="${OL}" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M100 44Q92 28 104 24Q116 22 112 34Q108 40 102 36" stroke="${HR}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  s+=VOL.shine(70,60,30,16,-28);
  /* the hair-accessory slot: a small drawn accessory on the head (opt.acc: ribbon, flower, star, heart, crown) */
  const ac=opt.acc&&ACC[opt.acc];
  s+=`<g class="pe-acc" data-acc="${opt.acc||''}" transform="translate(${hs==='bun'?100:134} ${hs==='bun'?30:46}) scale(.42) rotate(${hs==='bun'?0:18})">${ac||''}</g>`;
  if(layer)s+=`<g class="ps-cells" data-state="${state}">${layer.h}</g>`;
  s+=`</g></g></g></g>`;
  return `<svg class="ani ani-${mood} pe-person${state?' ps-st-'+state:''}" viewBox="0 0 200 230" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
/* head and shoulders only (cards, frames) */
const personHead=(photo,opt)=>person(photo,Object.assign({},opt,{cells:null,state:''})).replace('viewBox="0 0 200 230" style="overflow:visible"','viewBox="22 22 156 160" style="overflow:hidden"');
/* a family face as a salon customer: the same lookups as animals (KINDS[kind]) with the person's own colours */
function personKind(kind,f){
  const skin=f.skin||PE_SKIN,hair=f.hair||PE_HAIR;
  KINDS[kind]={ko:f.ko||'가족',en:f.en||'family',person:1,photo:f.photo,expr:f.expr||{},skin,hair,hairStyle:f.hairStyle,cloth:f.cloth,acc:f.acc,
    body:skin,edge:hexMix(skin,'#C9906E',.5),dark:hair,inner:hexMix(skin,'#FFFFFF',.4),cheek:'#FF9AA8'};
  return KINDS[kind];
}

window.ART={person,personHead,personKind,PE,vol:VOL,paper,OL,animal,animalOverlay,petCells:PET_CELLS,petLayer,petState,cellState,stateCells,fluffSet,fluffOf,HAIR,HAIR_STYLES,hairPlan,KINDS,F,TOPPING,WHOLE,wholeSVG,pieceSVG,pizza,TOOL,oven,BUILD,blob,rng,ACC,accSVG,face,FACE_ZONES,dress,lipstick,polish,star,twinkle,HAND,GIFTS,giftSVG,XMAS};
})();
