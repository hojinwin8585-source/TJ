/* 말랑 화장 가게 (P8-가) — 가게 앞에서 손님을 골라 의자에 앉히고, 화장품마다 자기 자리에만 칠해 줘요.
   사용 후기 "립스틱이 얼굴에도 머리에도 칠해지고 얼굴이 엉망" → 칠해지는 것은 그 화장품의 자리(zones) 안의 칸뿐.
   - 자리 밖에 대면 아무것도 칠해지지 않고, 그 자리가 은은히 빛나며 손님이 손으로 가리키고 "여기야!"
   - 색은 손님마다 어울리는 묶음에서만(pretty), 반투명 한 겹(최대 70%), 가장자리는 부드럽게. 같은 자리를 계속 문질러도 더 진해지지 않음
   - 손가락을 따라오는 도구 ML.P2.makeTool(칸 방식). 칸은 자리 모양 안에만 있고, 그리는 것도 자리 모양으로 오려 냄
   - 세 구역: 위(뒤로 64px + 과정 그림 줄) · 무대(큰 정면 얼굴, 무대의 70%) · 아래 도구 칸(도구 하나 또는 카드 3장)
   - 끝은 아이가 거울을 눌러서. 손님이 거울을 보며 고개를 돌리고 윙크 → 찰칵 → 가게 벽 액자
   숫자와 단계는 MLCFG.games.makeup(zones, pretty, steps, ending, levels), motion, rules, shell, touch, calm, voice 에서 읽습니다.
   단계: ML.Progress.get('makeup').level (화면 id 는 makeup2, 예전 화장 놀이 'makeup' 은 그대로 둠). 그림은 모두 이 파일 안에서 직접 그림. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,noise,SFX}=P;
const id='makeup2',GID='makeup',L=life(id),OL=A.OL||'#5B3A29';
const S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},MK=(CF.games||{}).makeup||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},CALM=CF.calm||{},PAL=CALM.palette||{},MO=CF.motion||{};
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BLOOM=(CALM.colorPolicy||{}).bloomMs||600;
/* pretty: "최대 70%" → no painted colour is ever more opaque than this, whatever the order or how long it is rubbed */
const MAXOP=Math.min(1,num(MK.pretty,0,70)/100);
/* per zone, a share of that ceiling (blush and shadow lighter than lipstick so the face stays soft) — not in config */
const OPA={lips:MAXOP,blush:MAXOP*.72,shadow:MAXOP*.8};
const HUM_MS=num((MK.steps||{}).pack,1,5)*1000;   // "5초 기다리며 손님이 콧노래"
const LOTION_TAPS=num((MK.steps||{}).lotion,0,4);   // "콕 4번"
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const COLORS=(CALM.choiceColors||[]).map(c=>({id:c.en,ko:c.ko,en:c.en,hex:c.hex,light:c.light,vivid:c.vivid}));
const colorOf=en=>COLORS.find(c=>c.en===en)||COLORS[0];
const LOG=[];
const praise=(ko,en)=>{const p=M.nextPraise?M.nextPraise():['잘했어!','Good job!'];return[ko?ko+' '+p[0]:p[0],en?en+' '+p[1]:p[1]]};
const iya=w=>w+(M.batchim&&M.batchim(w)?'이야':'야');

/* ---------- levels: the "new" words of games.makeup.levels, added up ---------- */
const LEVELS=(MK.levels&&MK.levels.length?MK.levels:[{level:1,new:'세안, 볼터치, 립스틱'}]);
const ORDER=['wash','pack','lotion','blush','eyeshadow','mascara','lips','sparkle'];
const KEYS={wash:/세안/,pack:/팩/,lotion:/로션/,blush:/볼터치/,eyeshadow:/아이섀도/,mascara:/마스카라/,lips:/립스틱/,sparkle:/반짝이|스티커/};
function levelInfo(n){
  const on=new Set();let wish=false;
  LEVELS.slice(0,n).forEach(l=>{const t=l.new||'';Object.keys(KEYS).forEach(k=>{if(KEYS[k].test(t))on.add(k)});if(/말풍선|원하는 색/.test(t))wish=true});
  if(!on.size)['wash','blush','lips'].forEach(k=>on.add(k));
  return{level:n,steps:ORDER.filter(k=>on.has(k)),wish};
}
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
const DATA=Object.assign({level:1,served:0,wall:[],last:''},store.get('mallang_makeup2',{}));if(!Array.isArray(DATA.wall))DATA.wall=[];
const save=()=>store.set('mallang_makeup2',DATA);
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LEVELS.length,n))}
if(PRG())PRG().register(GID,{max:LEVELS.length,name:'화장 가게',seg:'setMakeupLv'});

/* ---------- customers (not in config: names, hair, skin and the colour sets that suit each one — pretty) ---------- */
const CUST=[
  {id:'bun',ko:'하나',en:'Hana',hair:'#8A5634',hairHi:'#B07A52',skin:'#FFE6D6',shade:'#F6C9B4',eye:'#5A3422',iris:'#8A5A3A',top:'#F2C4CC',trim:'#E89AAE',
    lips:['pink','magenta','red'],blush:['pink','orange','magenta'],shadow:['purple','pink','sky blue']},
  {id:'long',ko:'유나',en:'Yuna',hair:'#3D2B29',hairHi:'#6A4F4A',skin:'#F8DCC4',shade:'#EDBF9F',eye:'#3A2216',iris:'#6B4129',top:'#CFE5F4',trim:'#8FC3E6',
    lips:['red','pink','orange'],blush:['orange','pink','red'],shadow:['sky blue','mint','purple']},
  {id:'curly',ko:'세라',en:'Sera',hair:'#B5612F',hairHi:'#D88A55',skin:'#E8B896',shade:'#D49A74',eye:'#4A2A18',iris:'#7A4A2A',top:'#CFE6CB',trim:'#8FC48A',
    lips:['orange','red','magenta'],blush:['red','orange','pink'],shadow:['pink','orange','purple']}
];
const custOf=k=>CUST.find(c=>c.id===k)||CUST[0];

/* ============================== the face (viewBox 0 0 400 470, front facing, 말랑 그림체) ============================== */
const VBW=400,VBH=470;
const FACE='M200 112C292 112 336 178 336 256C336 334 282 390 200 390C118 390 64 334 64 256C64 178 108 112 200 112Z';
const EYE={l:[146,262],r:[254,262]},CHEEK={l:[122,318],r:[278,318]},CHEEK_R=38,LIP=[200,346];
const LK=.84;
const lipsD=(cx,cy)=>{const p=(x,y)=>`${(cx+x*LK).toFixed(1)} ${(cy+y*LK).toFixed(1)}`;
  return `M${p(-38,0)}C${p(-31,-13)} ${p(-17,-18)} ${p(-8,-15)}C${p(-4,-14)} ${p(-2,-10)} ${p(0,-10)}C${p(2,-10)} ${p(4,-14)} ${p(8,-15)}C${p(17,-18)} ${p(31,-13)} ${p(38,0)}C${p(32,17)} ${p(17,25)} ${p(0,25)}C${p(-17,25)} ${p(-32,17)} ${p(-38,0)}Z`};
const LIPS=lipsD(LIP[0],LIP[1]);
const LIPLINE=(()=>{const [cx,cy]=LIP,k=LK;return `M${cx-36*k} ${cy+1}Q${cx-18*k} ${cy+6*k} ${cx} ${cy+3*k}Q${cx+18*k} ${cy+6*k} ${cx+36*k} ${cy+1}`})();
/* eyelid: the whole lid while the eye is closed (where the brush paints), and the crescent above the lash line that shows when it opens */
const lidClosed=ex=>`M${ex-33} 258Q${ex} 176 ${ex+33} 256L${ex+29} 263Q${ex} 284 ${ex-29} 263Z`;
const lidOpen=ex=>`M${ex-33} 258Q${ex} 176 ${ex+33} 256L${ex+29} 248Q${ex} 222 ${ex-29} 250Z`;
const lashLine=ex=>`M${ex-28} 250Q${ex} 224 ${ex+28} 247`;
const qpt=(x0,y0,cx,cy,x1,y1,t)=>[(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1];
const FOREHEAD=[200,196],CHIN=[200,382];

/* coverage cells of each zone, in face units, found with the zone's own shape (only points inside it) */
const cvs=document.createElement('canvas').getContext('2d');
function cellsIn(d,step,exclude){
  const p=new Path2D(d),ex=(exclude||[]).map(x=>new Path2D(x)),out=[];
  const b={x0:0,y0:0,x1:VBW,y1:VBH};
  for(let y=b.y0+step/2;y<b.y1;y+=step)for(let x=b.x0+step/2;x<b.x1;x+=step){if(cvs.isPointInPath(p,x,y)&&!ex.some(q=>cvs.isPointInPath(q,x,y)))out.push([x,y])}
  return out;
}
const circleD=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
const EYE_HOLE=['l','r'].map(s=>circleD(EYE[s][0],EYE[s][1]+2,31));
const ZONE={
  face:{cells:cellsIn(FACE,24,EYE_HOLE.concat([lipsD(LIP[0],LIP[1]),'M60 60H340V182Q200 168 60 182Z'])),step:24},
  lips:{cells:cellsIn(LIPS,7),step:7},
  cheeks:{cells:cellsIn(circleD(...CHEEK.l,CHEEK_R-4),9).concat(cellsIn(circleD(...CHEEK.r,CHEEK_R-4),9)),step:9},
  lidL:{cells:cellsIn(lidClosed(EYE.l[0]),7),step:7},
  lidR:{cells:cellsIn(lidClosed(EYE.r[0]),7),step:7},
  lashes:{cells:['l','r'].flatMap(s=>{const ex=EYE[s][0];return Array.from({length:7},(_,i)=>{const t=.1+i*.8/6,[x,y]=qpt(ex-28,250,ex,224,ex+28,247,t);return[x,y-7]})}),step:9}
};
ZONE.face.cells=ZONE.face.cells.filter(([x,y])=>y>178);
/* dirt for washing: a few soft smudges (chocolate) on cells, decided per customer */
const SMUDGE_AT=[[150,334],[238,298],[232,374],[106,286],[296,262]];

/* defs for one face picture (ids made unique per picture so many faces can live on a page) */
let UID=0;
function faceDefs(px,c){
  return `<defs>
  <clipPath id="${px}cf"><path d="${FACE}"/></clipPath>
  <clipPath id="${px}cl"><path d="${LIPS}"/></clipPath>
  <clipPath id="${px}clidL"><path d="${lidClosed(EYE.l[0])}"/></clipPath><clipPath id="${px}clidR"><path d="${lidClosed(EYE.r[0])}"/></clipPath>
  <clipPath id="${px}olidL"><path d="${lidOpen(EYE.l[0])}"/></clipPath><clipPath id="${px}olidR"><path d="${lidOpen(EYE.r[0])}"/></clipPath>
  <radialGradient id="${px}gb"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".55" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="${px}mb" maskUnits="userSpaceOnUse" x="0" y="0" width="${VBW}" height="${VBH}"><circle cx="${CHEEK.l[0]}" cy="${CHEEK.l[1]}" r="${CHEEK_R}" fill="url(#${px}gb)"/><circle cx="${CHEEK.r[0]}" cy="${CHEEK.r[1]}" r="${CHEEK_R}" fill="url(#${px}gb)"/></mask>
  <linearGradient id="${px}gl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <filter id="${px}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="${px}soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
  <radialGradient id="${px}gi" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${c.iris}"/><stop offset="1" stop-color="${c.eye}"/></radialGradient>
  <linearGradient id="${px}gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.skin}"/><stop offset="1" stop-color="${c.skin}"/></linearGradient>
  </defs>`;
}
/* union of circles with one outline (draw the outlines thick first, then the fills on top) */
const blobs=(cs,fill,sw=7)=>cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${OL}" stroke="${OL}" stroke-width="${sw}"/>`).join('')+cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
function hairBack(c){
  if(c.id==='bun')return blobs([[104,118,46],[296,118,46]],c.hair)+`<path d="M60 258C52 330 76 372 118 380L282 380C324 372 348 330 340 258Z" fill="${c.hair}" ${S3}/>`
    +`<path d="M86 100Q96 86 112 84M278 92Q290 84 306 90" stroke="${c.hairHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if(c.id==='long')return `<path d="M64 240C40 150 112 84 200 84C288 84 360 150 336 240C344 310 352 380 350 440Q300 452 200 452Q100 452 50 440C48 380 56 310 64 240Z" fill="${c.hair}" ${S3}/><path d="M66 330Q62 380 66 430M334 330Q338 380 334 430" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`;
  /* curly bob */
  const cs=[];for(let i=0;i<=20;i++){const a=Math.PI*(1.04-i*1.08/20),x=200+160*Math.cos(a),y=236-140*Math.sin(a);cs.push([x,y,32])}
  [[44,286,30],[356,286,30],[52,326,28],[348,326,28],[70,360,24],[330,360,24]].forEach(q=>cs.push(q));
  return blobs(cs,c.hair);
}
function hairFront(c){
  if(c.id==='long')return `<path d="M66 252C56 160 116 96 200 96C284 96 344 160 334 252C326 214 312 194 298 184C284 196 262 194 250 176C236 194 206 196 196 178C184 196 156 196 144 178C132 194 112 198 100 186C86 200 72 224 66 252Z" fill="${c.hair}" ${S3}/>
    <path d="M150 116Q120 128 104 158M250 112Q282 122 300 152" stroke="${c.hairHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(296 168) rotate(25)"><rect x="-16" y="-6" width="32" height="12" rx="6" fill="#F0D58A" ${S3}/><circle cx="-6" cy="0" r="2.5" fill="#fff"/></g>`;
  if(c.id==='curly'){const cs=[[112,150,28],[150,130,28],[192,122,28],[236,124,28],[276,138,28],[304,166,24],[90,184,24],[126,172,20],[164,162,18],[300,196,18]];
    return blobs(cs,c.hair,6)+`<path d="M144 132Q160 118 178 118M226 120Q246 120 262 134" stroke="${c.hairHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>`}
  /* bun: soft bangs with a parting, two little ribbons by the buns */
  return `<path d="M66 252C56 160 116 96 200 96C284 96 344 160 334 252C328 222 316 200 302 188C292 196 270 190 258 172C246 190 220 190 208 170C196 192 164 194 150 174C138 192 116 200 100 190C86 204 72 226 66 252Z" fill="${c.hair}" ${S3}/>
    <path d="M146 118Q118 132 104 160M240 112Q272 120 290 146" stroke="${c.hairHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>
    ${[[126,96,-20],[274,96,20]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0L-14 -9Q-18 0 -14 9Z" fill="${c.trim}" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 0L14 -9Q18 0 14 9Z" fill="${c.trim}" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/><circle r="4" fill="#F6D3DB" stroke="${OL}" stroke-width="2"/></g>`).join('')}`;
}
/* one eye: open (iris with two sparkles under a lash line) and closed variants, inside .al-eye so ML.Alive blinks it */
function eye(s,c,px){
  const [ex,ey]=EYE[s],k=s==='l'?-1:1;
  const open=`<g class="al-eye al-eye-${s} al-open mk-open"><g class="al-pupil"><ellipse cx="${ex}" cy="${ey+2}" rx="22" ry="27" fill="url(#${px}gi)" stroke="${OL}" stroke-width="3"/>
    <ellipse cx="${ex}" cy="${ey+6}" rx="11" ry="14" fill="${c.eye}" opacity=".85"/><circle cx="${ex-7}" cy="${ey-8}" r="8.5" fill="#fff"/><circle cx="${ex+8}" cy="${ey+11}" r="4" fill="#fff"/><circle cx="${ex+10}" cy="${ey-12}" r="2.2" fill="#fff" opacity=".9"/></g>
    <path d="${lashLine(ex)}" fill="none" stroke="${OL}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M${ex+k*26} ${ey-14}l${k*9} -7M${ex+k*22} ${ey-18}l${k*6} -9" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/></g>`;
  /* blink lid (ML.Alive shows it while blinking) */
  const lid=`<path class="al-lid al-lid-${s}" opacity="0" d="M${ex-26} ${ey+2}Q${ex} ${ey+16} ${ex+26} ${ey+2}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  /* calm closed (wink, eyeshadow, pack): a soft downward curve with lashes */
  const shut=`<g class="mk-shut mk-shut-${s}"><path d="M${ex-27} ${ey+1}Q${ex} ${ey+18} ${ex+27} ${ey+1}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${ex+k*24} ${ey+6}l${k*8} 6M${ex+k*16} ${ey+11}l${k*5} 8M${ex} ${ey+14}v8" stroke="${OL}" stroke-width="3.2" stroke-linecap="round"/></g>`;
  /* squeezed (washing): > < */
  const sq=`<path class="mk-squeeze" d="M${ex+16*k} ${ey-12}L${ex-14*k} ${ey+2}L${ex+16*k} ${ey+16}" stroke="${OL}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  /* happy ^ ^ */
  const hp=`<path class="mk-happy" d="M${ex-22} ${ey+8}Q${ex} ${ey-16} ${ex+22} ${ey+8}" stroke="${OL}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  return open+lid+shut+sq+hp;
}
/* paint inside a zone: cells (face units) with values, or null = all of it (finished faces in frames) */
function dots(cells,vals,step,col,grow=1.15){
  if(!vals)return `<rect x="0" y="0" width="${VBW}" height="${VBH}" fill="${col}"/>`;
  let s='';cells.forEach((p,i)=>{const v=vals[i]||0;if(v<=0)return;s+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(step*grow*Math.sqrt(Math.min(1,v))).toFixed(1)}" fill="${col}"/>`});return s;
}
/* the painted layers: the group opacity is the ceiling, so overlapping dots never get darker than it */
function paintLips(px,look,vals){const z=look.lips;if(!z)return'';const c=colorOf(z.col);
  return `<g clip-path="url(#${px}cl)"><g opacity="${OPA.lips.toFixed(2)}" filter="url(#${px}soft)" class="mk-op" data-op="${OPA.lips.toFixed(2)}">${dots(ZONE.lips.cells,vals,ZONE.lips.step,c.vivid,1.3)}</g>`
    +(vals?'':`<path d="M${LIP[0]-20} ${LIP[1]+10}Q${LIP[0]} ${LIP[1]+16} ${LIP[0]+14} ${LIP[1]+10}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>`)+`</g>`}
function paintBlush(px,look,vals){const z=look.blush;if(!z)return'';const c=colorOf(z.col);
  return `<g mask="url(#${px}mb)"><g opacity="${OPA.blush.toFixed(2)}" filter="url(#${px}soft2)" class="mk-op" data-op="${OPA.blush.toFixed(2)}">${dots(ZONE.cheeks.cells,vals,ZONE.cheeks.step,c.vivid,1.4)}</g></g>`}
function paintLid(px,look,s,vals,closed){const z=look.shadow;if(!z)return'';const c=colorOf(z.col),zk=s==='l'?'lidL':'lidR';
  return `<g clip-path="url(#${px}${closed?'c':'o'}lid${s.toUpperCase()})"><g opacity="${OPA.shadow.toFixed(2)}" filter="url(#${px}soft)" class="mk-op" data-op="${OPA.shadow.toFixed(2)}">${dots(ZONE[zk].cells,vals,ZONE[zk].step,c.vivid,1.3)}</g></g>`}
/* mascara: lashes grow along the lash line with coverage (0..1) */
function lashes(v){
  if(!v)return'';let s='';
  ['l','r'].forEach(sd=>{const ex=EYE[sd][0],k=sd==='l'?-1:1,vs=Array.isArray(v)?v.slice(sd==='l'?0:7,sd==='l'?7:14):[v],vi=vs.reduce((a,b)=>a+b,0)/vs.length;if(vi<=.03)return;
    /* a thicker lash line and four curled lashes on the outer side, longer with more coverage */
    s+=`<path d="${lashLine(ex)}" fill="none" stroke="${OL}" stroke-width="${(5.5+2.5*vi).toFixed(1)}" stroke-linecap="round"/>`;
    [.6,.74,.87,.98].forEach((t0,j)=>{const t=k<0?1-t0:t0,[x,y]=qpt(ex-28,250,ex,224,ex+28,247,t),len=(5+9*vi)*(.75+j*.12);
      s+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(k*len*.15).toFixed(1)} ${(-len*.8).toFixed(1)} ${(k*len*.75).toFixed(1)} ${(-len).toFixed(1)}" stroke="${OL}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`})});
  return s;
}
/* stickers and the hair ornament (sparkle step) */
const STK={
  star:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${A.star(0,0,13,'#FFD86B',`stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"`)}<circle cx="-4" cy="-4" r="2.4" fill="#fff" opacity=".9"/></g>`,
  heart:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 11C-16 0 -14 -12 -7 -12C-3 -12 -1 -10 0 -7C1 -10 3 -12 7 -12C14 -12 16 0 0 11Z" fill="#FF8FB1" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="-6" cy="-6" rx="2.6" ry="1.8" fill="#fff" opacity=".85"/></g>`
};
const ORN={
  bow:(c)=>`<g transform="translate(250 112) rotate(14)"><path d="M0 0L-34 -22Q-44 0 -34 22Z" fill="${c}" ${S3}/><path d="M0 0L34 -22Q44 0 34 22Z" fill="${c}" ${S3}/><path d="M-6 6L-16 34L0 24ZM6 6L16 34L0 24Z" fill="${c}" ${S3}/><circle r="10" fill="#FFF3F6" ${S3}/><path d="M-26 -10Q-20 -14 -14 -10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  tiara:(c)=>`<g transform="translate(200 104)"><path d="M-60 16Q0 -2 60 16L52 -10L30 6L14 -28L0 2L-14 -28L-30 6L-52 -10Z" fill="#FFD86B" ${S3}/><circle cx="0" cy="-2" r="7" fill="${c}" ${S3}/><circle cx="-14" cy="-26" r="5" fill="#fff" ${S3}/><circle cx="14" cy="-26" r="5" fill="#fff" ${S3}/><path d="M-36 4Q-28 0 -20 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  flower:(c)=>`<g transform="translate(270 136)">${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${(15*Math.cos(a)).toFixed(1)}" cy="${(15*Math.sin(a)).toFixed(1)}" r="12" fill="${c}" ${S3}/>`}).join('')}<circle r="9" fill="#FFE27A" ${S3}/><circle cx="-3" cy="-3" r="2.6" fill="#fff"/></g>`
};
/* the whole customer: hair, face, makeup layers, eyes, lips, front hair, ornaments. live = the bust in the room (layers get ids) */
function bust(c,look={},o={}){
  const px='mk'+(++UID)+'_',idg=k=>o.live?` id="mkL-${k}"`:'';
  const sm=look.smudge?SMUDGE_AT.map(([x,y],i)=>`<ellipse cx="${x}" cy="${y}" rx="${10+i%3*3}" ry="${7+i%2*3}" fill="#9A6A4A" opacity=".35"/>`).join(''):'';
  const shoulders=`<path d="M58 470C66 428 118 404 200 404C282 404 334 428 342 470Z" fill="${c.top}" ${S3}/><path d="M150 408Q200 440 250 408" fill="none" stroke="${c.trim}" stroke-width="7" stroke-linecap="round"/>`;
  const neck=`<path d="M172 360V414Q200 428 228 414V360Z" fill="${c.skin}" ${S3}/><path d="M174 392Q200 404 226 392" stroke="${c.shade}" stroke-width="6" fill="none" opacity=".7"/>`;
  const ears=['l','r'].map(s=>{const x=s==='l'?66:334,k=s==='l'?1:-1;return `<ellipse cx="${x}" cy="270" rx="17" ry="23" fill="${c.skin}" ${S3}/><path d="M${x+k*-4} 262q${k*-6} 8 0 16" stroke="${c.shade}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`}).join('');
  const cheeksBase=['l','r'].map(s=>`<ellipse cx="${CHEEK[s][0]}" cy="${CHEEK[s][1]}" rx="26" ry="17" fill="#FF9AAE" opacity=".32" filter="url(#${px}soft)"/>`).join('');
  const brows=['l','r'].map(s=>{const ex=EYE[s][0];return `<path d="M${ex-24} 203Q${ex} 189 ${ex+24} 199" stroke="${c.hair}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`}).join('');
  const nose=`<path d="M195 304Q200 309 205 304" stroke="${c.shade}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  const lipsBase=`<path d="${LIPS}" fill="#F2A9A3"/><path d="M${LIP[0]-14} ${LIP[1]+12}Q${LIP[0]} ${LIP[1]+17} ${LIP[0]+12} ${LIP[1]+12}" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
  const lipsTop=`<path d="${LIPS}" fill="none" stroke="#B4645A" stroke-width="2.6" stroke-linejoin="round"/><path d="${LIPLINE}" stroke="#A8574D" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const sheen=look.sheen?`<g opacity="${(.32*Math.min(1,look.sheen)).toFixed(2)}" filter="url(#${px}soft)"><ellipse cx="128" cy="290" rx="9" ry="4.5" fill="#fff" transform="rotate(-20 128 290)"/><ellipse cx="272" cy="290" rx="9" ry="4.5" fill="#fff" transform="rotate(20 272 290)"/><ellipse cx="200" cy="316" rx="4" ry="2.2" fill="#fff"/></g>`:'';
  const lidsClosed=o.live?['l','r'].map(s=>`<g class="mk-lidc mk-lidc-${s}"${idg('lidc'+s)}>${paintLid(px,look,s,o.vals&&o.vals['lid'+s.toUpperCase()],true)}</g>`).join(''):'';
  const lidsOpen=['l','r'].map(s=>`<g class="mk-lido mk-lido-${s}"${idg('lido'+s)}>${paintLid(px,look,s,o.vals&&o.vals['lid'+s.toUpperCase()],false)}</g>`).join('');
  const st=(look.stickers||[]).map(k=>STK[k.k]?STK[k.k](k.x,k.y,1.25):'').join('');
  const orn=look.orn&&ORN[look.orn.k]?ORN[look.orn.k](colorOf(look.orn.col).vivid):'';
  const head=`${hairBack(c)}${shoulders}${neck}${ears}<path d="${FACE}" fill="${c.skin}" ${S3}/>
    <g clip-path="url(#${px}cf)"><path d="M70 330Q200 420 330 330V400H70Z" fill="${c.shade}" opacity=".25"/><g${idg('smudge')}>${sm}</g></g>
    ${cheeksBase}<g${idg('blush')}>${paintBlush(px,look,o.vals&&o.vals.cheeks)}</g>
    <g clip-path="url(#${px}cf)"><g${idg('pack')}></g><g${idg('lotion')}></g></g>
    ${lidsOpen}${lidsClosed}${brows}${eye('l',c,px)}${eye('r',c,px)}<g${idg('lash')}>${lashes(look.lashes)}</g>${nose}
    <g class="mk-lips"><g class="al-mouth">${lipsBase}<g${idg('lips')}>${paintLips(px,look,o.vals&&o.vals.lips)}</g>${lipsTop}</g></g>
    ${sheen?`<g${idg('sheen')}>${sheen}</g>`:`<g${idg('sheen')}></g>`}
    <g${idg('cuke')}></g>${hairFront(c)}<g${idg('orn')}>${orn}</g><g${idg('stk')}>${st}</g><g clip-path="url(#${px}cf)"><g${idg('foam')}></g></g>`;
  return `<svg viewBox="0 0 ${VBW} ${VBH}" style="overflow:visible" data-px="${px}">${faceDefs(px,c)}<g class="mk-pose"><g class="al-root" style="transform-origin:50% 100%"><g class="al-breathe" style="transform-origin:50% 100%">
    <g class="al-head" style="transform-origin:50% 88%"><g class="al-head-s" style="transform-origin:50% 88%">${head}</g></g></g></g></g></svg>`;
}

/* ============================== tools and cards (100×100, tip at the lower left so the finger never hides it) ============================== */
const FACE_TF=(x,y)=>`<g class="tf"><ellipse class="tf-eye" cx="${x-7}" cy="${y}" rx="2.6" ry="3.6" fill="${OL}"/><ellipse class="tf-eye" cx="${x+7}" cy="${y}" rx="2.6" ry="3.6" fill="${OL}"/><path class="tf-grin" d="M${x-5} ${y+6}Q${x} ${y+12} ${x+5} ${y+6}Z" fill="#B5473A" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></g>`;
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  foam:`<svg viewBox="0 0 100 100"><path d="M46 20V10H66" fill="none" stroke="${OL}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M46 20V10H66" fill="none" stroke="#DDE3EA" stroke-width="3" stroke-linecap="round"/><rect x="36" y="20" width="20" height="12" rx="3" fill="#DDE3EA" ${S3}/><path d="M28 34H64Q72 34 72 44V84Q72 92 64 92H28Q20 92 20 84V44Q20 34 28 34Z" fill="#CBEBE4" ${S3}/>${FACE_TF(46,62)}<circle cx="18" cy="22" r="8" fill="#fff" stroke="#CDE9FA" stroke-width="2.5"/><circle cx="8" cy="36" r="5" fill="#fff" stroke="#CDE9FA" stroke-width="2"/><circle cx="26" cy="10" r="4" fill="#fff" stroke="#CDE9FA" stroke-width="2"/></svg>`,
  towel:`<svg viewBox="0 0 100 100"><path d="M10 40Q10 26 26 26H74Q90 26 90 40V64Q90 78 74 78H26Q10 78 10 64Z" fill="#CFE5F4" ${S3}/><path d="M10 44H90M10 60H90" stroke="#8FC3E6" stroke-width="5"/>${FACE_TF(50,52)}</svg>`,
  cucumber:`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="36" fill="#8FC48A" ${S3}/><circle cx="50" cy="52" r="28" fill="#DFF0C8"/>${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return `<ellipse cx="${(50+15*Math.cos(a)).toFixed(1)}" cy="${(52+15*Math.sin(a)).toFixed(1)}" rx="3" ry="5" fill="#B9D99A" transform="rotate(${i*60+90} ${(50+15*Math.cos(a)).toFixed(1)} ${(52+15*Math.sin(a)).toFixed(1)})"/>`}).join('')}<path d="M30 34Q38 26 50 24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  spatula:`<svg viewBox="0 0 100 100"><path d="M44 54L84 14" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M44 54L84 14" stroke="#E3BE98" stroke-width="7" stroke-linecap="round"/><path d="M10 74Q8 58 24 48L40 42Q54 40 58 52Q62 64 50 72L34 86Q18 92 10 74Z" fill="#B8D9AF" ${S3}/><path d="M18 70Q22 60 32 56" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>${FACE_TF(38,64)}</svg>`,
  lotion:`<svg viewBox="0 0 100 100"><rect x="38" y="6" width="24" height="14" rx="5" fill="${PAL.rose||'#E8A0AE'}" ${S3}/><path d="M30 22H70Q78 22 78 32V84Q78 94 68 94H32Q22 94 22 84V32Q22 22 30 22Z" fill="#FFF6EE" ${S3}/><path d="M22 48H78V68H22Z" fill="#F6D3DB"/><path d="M22 48H78M22 68H78" stroke="${OL}" stroke-width="3"/>${FACE_TF(50,58)}<path d="M30 30V80" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`,
  puff:`<svg viewBox="0 0 100 100"><ellipse cx="44" cy="62" rx="36" ry="26" fill="#F6D3DB" ${S3}/><path d="M24 50Q44 30 66 46" fill="none" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/><path d="M58 40Q82 20 90 36Q92 46 74 52" fill="#E8A0AE" ${S3}/>${FACE_TF(44,66)}<path d="M18 62Q20 54 28 50" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  blushBrush:`<svg viewBox="0 0 100 100"><path d="M46 52L86 12" stroke="${OL}" stroke-width="15" stroke-linecap="round"/><path d="M46 52L86 12" stroke="#E3BE98" stroke-width="9" stroke-linecap="round"/><rect x="36" y="44" width="20" height="16" rx="3" transform="rotate(-45 46 52)" fill="#F0D58A" ${S3}/><path d="M38 52Q14 56 10 78Q8 92 22 90Q44 86 48 62Z" fill="#FFF3EA" ${S3}/><path d="M16 84Q22 70 36 62" stroke="#F6D3DB" stroke-width="6" stroke-linecap="round"/>${FACE_TF(66,30)}</svg>`,
  shadowBrush:`<svg viewBox="0 0 100 100"><path d="M34 66L88 12" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M34 66L88 12" stroke="#AE9BE0" stroke-width="6" stroke-linecap="round"/><path d="M14 86Q10 74 22 66L32 60L40 68L34 78Q26 90 14 86Z" fill="#F6EEDF" ${S3}/>${FACE_TF(64,34)}</svg>`,
  mascara:`<svg viewBox="0 0 100 100"><path d="M52 48L88 12" stroke="${OL}" stroke-width="16" stroke-linecap="round"/><path d="M52 48L88 12" stroke="#CF86BE" stroke-width="10" stroke-linecap="round"/><path d="M50 50L22 78" stroke="${OL}" stroke-width="5" stroke-linecap="round"/>${[0,1,2,3,4,5].map(i=>{const t=i/5,x=30-12*t,y=70+12*t;return `<path d="M${(x-6).toFixed(1)} ${(y-6).toFixed(1)}L${(x+6).toFixed(1)} ${(y+6).toFixed(1)}" stroke="${OL}" stroke-width="5" stroke-linecap="round"/>`}).join('')}${FACE_TF(72,26)}</svg>`,
  sticker:`<svg viewBox="0 0 100 100"><rect x="12" y="16" width="76" height="68" rx="14" fill="#FFFDF9" ${S3}/>${STK.star(36,44,1.4)}${STK.heart(64,62,1.3)}</svg>`,
  mirror:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="44" rx="30" ry="36" fill="${PAL.butter||'#F0D58A'}" ${S3}/><ellipse cx="50" cy="44" rx="21" ry="27" fill="#EAF3F6" ${S3}/><path d="M38 30Q43 22 53 21" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${PAL.butter||'#F0D58A'}" stroke-width="3.5" stroke-linecap="round"/>${A.twinkle(82,16,7,'#F0D58A')}</svg>`
};
/* lipstick drawn slanted (tip lower left) in a colour */
const lipstickSVG=(c,face=true)=>`<svg viewBox="0 0 100 100"><g transform="rotate(40 50 50)"><rect x="34" y="50" width="32" height="44" rx="7" fill="#F0D58A" ${S3}/><path d="M42 58V86" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/><rect x="38" y="36" width="24" height="16" rx="3" fill="#F3F5F9" ${S3}/><path d="M40 38V16Q40 4 60 12V38Z" fill="${c}" ${S3}/><path d="M45 32V18" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/></g>${face?FACE_TF(64,72):''}</svg>`;
/* card pictures: compact (blush), palette pan (eyeshadow), lipstick — in the calm colour */
const blushCard=c=>`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="40" ry="34" fill="#F3E3D3" ${S3}/><ellipse cx="50" cy="56" rx="30" ry="25" fill="${c}"/><path d="M30 46Q38 36 50 34" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>${A.twinkle(76,22,7,'#F0D58A')}</svg>`;
const shadowCard=c=>`<svg viewBox="0 0 100 100"><rect x="10" y="22" width="80" height="62" rx="16" fill="#F3E3D3" ${S3}/><ellipse cx="50" cy="53" rx="28" ry="22" fill="${c}" stroke="${OL}" stroke-width="2.5"/><path d="M34 46Q40 38 50 37" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></svg>`;
const lipsCard=c=>lipstickSVG(c,false);
const ORN_VB={bow:'200 68 100 92',tiara:'132 62 136 80',flower:'230 96 80 80'};
const ornCard=(k,c)=>`<svg viewBox="${ORN_VB[k]}">${ORN[k](c)}</svg>`;
const stkCard=k=>`<svg viewBox="-24 -24 48 48">${STK[k](0,0,1.5)}</svg>`;
/* the step pictures for the header strip */
const STEP_ICON={wash:ICON.foam,pack:ICON.cucumber,lotion:ICON.lotion,blush:blushCard('#E89AAE'),eyeshadow:shadowCard('#AE9BE0'),mascara:ICON.mascara,lips:lipsCard('#E89AAE'),sparkle:ICON.sticker};
const TOOL_NAME={foam:['거품!','Bubbles!'],towel:['물수건!','Wet towel!'],cucumber:['오이!','Cucumber!'],spatula:['팩!','Face mask!'],lotion:['로션!','Lotion!'],puff:['퍼프!','Puff!'],blush:['볼터치 붓!','Blush brush!'],shadow:['아이섀도 붓!','Eyeshadow brush!'],mascara:['마스카라!','Mascara!'],lips:['립스틱!','Lipstick!'],sparkle:['반짝이 스티커!','Sparkle stickers!']};

/* ============================== backgrounds (종이 공예 겹: no outlines, calm colours, one soft shadow per layer) ============================== */
const PF='filter="url(#mkPaper)"';
const PAPER_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="mkPaper" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".2"/></filter></defs></svg>`;
const BULBS=(x0,x1,y)=>Array.from({length:5},(_,i)=>{const x=x0+(x1-x0)*i/4;return `<circle cx="${x}" cy="${y}" r="5.5" fill="#FFF3C8"/><circle cx="${x}" cy="${y}" r="9" fill="#FFF3C8" opacity=".35"/>`}).join('');
const ROOM_BG=`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice"><rect width="400" height="520" fill="#F5E6EA"/>
  ${Array.from({length:9},(_,i)=>`<rect x="${i*48-6}" y="0" width="22" height="520" fill="#F1DDE3"/>`).join('')}
  <g ${PF}><path d="M0 0H400V40${Array.from({length:8},(_,i)=>`Q${375-i*50} 62 ${350-i*50} 40`).join('')}Z" fill="#E8B4C0"/></g><rect width="400" height="12" fill="#F2C9D2"/>
  <g ${PF}><rect x="40" y="70" width="320" height="300" rx="150" fill="#E7C9A8"/></g><g ${PF}><rect x="56" y="86" width="288" height="270" rx="136" fill="#EAF1F3"/></g>
  <path d="M110 140L170 100H196L130 170Z" fill="#fff" opacity=".45"/>${BULBS(80,320,78)}
  <g ${PF}><rect x="0" y="420" width="400" height="100" fill="#E9D3C0"/></g><rect x="0" y="420" width="400" height="10" fill="#DFC2A8"/>
  <g ${PF}><rect x="10" y="300" width="62" height="12" rx="5" fill="#D9B48E"/></g><g ${PF}><rect x="18" y="262" width="14" height="38" rx="5" fill="#CFE5F4"/><rect x="38" y="252" width="14" height="48" rx="5" fill="#F6D3DB"/><circle cx="60" cy="290" r="10" fill="#E3D0F0"/></g>
  <g ${PF}><rect x="328" y="300" width="62" height="12" rx="5" fill="#D9B48E"/></g><g ${PF}><path d="M346 300V270Q346 262 354 262H362Q370 262 370 270V300Z" fill="#CBEBE4"/><circle cx="380" cy="292" r="8" fill="#F7E8B8"/></g></svg>`;
const LOBBY_BG=`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice"><rect width="400" height="520" fill="#F3E7DC"/>
  ${Array.from({length:9},(_,i)=>`<rect x="${i*48-6}" y="0" width="20" height="330" fill="#EFE1D4"/>`).join('')}
  <g ${PF}><path d="M0 0H400V34${Array.from({length:8},(_,i)=>`Q${375-i*50} 56 ${350-i*50} 34`).join('')}Z" fill="#E3A7B6"/></g><rect width="400" height="10" fill="#F0C6D0"/>
  <g ${PF}><rect x="0" y="330" width="400" height="190" fill="#E7D3BF"/></g><path d="M0 330H400" stroke="#DCC2A8" stroke-width="8"/>
  <g ${PF}><rect x="290" y="246" width="96" height="14" rx="6" fill="#D9B48E"/></g><g ${PF}><rect x="300" y="208" width="14" height="38" rx="6" fill="#F6D3DB"/><rect x="320" y="198" width="14" height="48" rx="6" fill="#CFE5F4"/><circle cx="350" cy="234" r="12" fill="#E3D0F0"/><rect x="366" y="218" width="16" height="28" rx="7" fill="#F7E8B8"/></g>
  ${BULBS(120,280,58)}
  <g ${PF}><rect x="20" y="236" width="70" height="94" rx="10" fill="#CDB89E"/></g><g ${PF}><circle cx="55" cy="214" r="34" fill="#A9CFA0"/><circle cx="34" cy="232" r="22" fill="#9CC293"/><circle cx="78" cy="230" r="20" fill="#B5D6AC"/></g>
  <g ${PF}><path d="M30 520Q36 448 200 440Q364 448 370 520Z" fill="#E8C7B0"/></g></svg>`;
const FRAME=inner=>`<svg viewBox="0 0 100 112"><g ${PF}><rect x="3" y="3" width="94" height="104" rx="12" fill="#E3BE98"/></g><g ${PF}><rect x="11" y="11" width="78" height="88" rx="7" fill="${inner?'#F6EEF2':'#EFE4D8'}"/></g>${inner?`<g transform="translate(14 16) scale(.18)">${inner}</g>`:''}</svg>`;
const STOOL=`<svg viewBox="0 0 120 70" preserveAspectRatio="xMidYMax meet"><g ${PF}><rect x="22" y="30" width="10" height="40" rx="4" fill="#B88A66"/><rect x="88" y="30" width="10" height="40" rx="4" fill="#B88A66"/></g><g ${PF}><ellipse cx="60" cy="24" rx="54" ry="18" fill="#D9A3B1"/></g><ellipse cx="60" cy="20" rx="44" ry="10" fill="#E8B9C4"/></svg>`;
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
/* a finished face for frames and the lobby (all of its makeup, no live layers) */
const portrait=(rec,mood)=>{const c=custOf(rec.cust);return svgInner(bust(c,Object.assign({},rec.look||{}),{}))};
/* the customer's own hand, pointing at the place to paint ("여기야!") */
const POINT_HAND=c=>`<svg viewBox="0 0 80 80"><path d="M14 74Q8 50 22 40L40 32L62 10Q70 4 74 12Q76 18 70 24L54 40Q62 44 60 56Q58 70 40 74Z" fill="${c.skin}" ${S3}/><path d="M40 48Q46 50 50 46" stroke="${c.shade}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

/* ============================== screen: the three zones ============================== */
const css=`
#${id}{gap:6px}
#${id} .mk-head{flex:none;height:${HEAD_PX}px;gap:8px}
#${id} .mk-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px;flex:none}
#${id} .mk-back svg{width:100%;height:100%;display:block}
.mk-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none}
.mk-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.mk-strip span svg{width:74%;height:74%;display:block}
.mk-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.mk-strip span.done{opacity:.9}
.mk-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.mk-strip span .st svg{width:100%;height:100%}
.mk-stars{flex:none;display:flex;align-items:center}
.mk-stars .mlp-star{width:24px;height:24px}
.mk-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F5E6EA}
.mk-stage svg{display:block}
.mk-bg{position:absolute;inset:0;pointer-events:none}
.mk-bg svg{width:100%;height:100%}
.mk-lobby,.mk-room{position:absolute;inset:0}
.mk-frames{position:absolute;left:0;right:0;top:12%;height:17%;display:flex;justify-content:center;gap:5%;pointer-events:none}
.mk-frame{height:100%;aspect-ratio:100/112}
.mk-frame svg{width:100%;height:100%}
.mk-frame.new{animation:mknew .6s ease-out}
@keyframes mknew{from{transform:scale(.6);opacity:0}}
.mk-seat{position:absolute;bottom:3%;border:0;padding:0;background:none;touch-action:manipulation}
.mk-seat .mk-stool{position:absolute;left:0;right:0;bottom:0;height:24%;pointer-events:none}
.mk-seat .mk-stool svg{width:100%;height:100%}
.mk-seat .mk-mini{position:absolute;left:0;right:0;bottom:14%;aspect-ratio:400/470;pointer-events:none}
.mk-seat .mk-mini>svg{width:100%;height:100%}
.mk-seat:active .mk-mini{transform:translateY(3px)}
.mk-seat.walk .mk-mini{animation:mkwalk .66s ease-in-out 3}
@keyframes mkwalk{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.mk-cust{position:absolute;left:50%;bottom:0;transform:translateX(-50%);pointer-events:none;z-index:3}
.mk-cust>svg{width:100%;height:100%;overflow:visible}
 .mk-cust{transition:transform .8s cubic-bezier(.3,1.1,.5,1)}
.mk-cust.end{transform:translateX(-66%) scale(.86);transform-origin:50% 100%}
.mk-cust.enter{animation:mkin .9s cubic-bezier(.3,1.2,.5,1)}
@keyframes mkin{from{transform:translateX(70%);opacity:0}to{transform:translateX(-50%);opacity:1}}
/* faces: which eyes and mouth show (the customer reacts to each tool) */
.mk-cust .mk-shut,.mk-cust .mk-squeeze,.mk-cust .mk-happy,.mk-lobby .mk-shut,.mk-lobby .mk-squeeze,.mk-lobby .mk-happy,.mk-frame .mk-shut,.mk-frame .mk-squeeze,.mk-frame .mk-happy,.mk-photo .mk-shut,.mk-photo .mk-squeeze,.mk-photo .mk-happy,.mk-ic .mk-shut,.mk-ic .mk-squeeze,.mk-ic .mk-happy{display:none}
.mk-cust .mk-lidc{display:none}
.mk-cust.e-squeeze .mk-open,.mk-cust.e-squeeze .al-lid,.mk-cust.e-shut .mk-open,.mk-cust.e-shut .al-lid,.mk-cust.e-happy .mk-open,.mk-cust.e-happy .al-lid{display:none}
.mk-cust.e-squeeze .mk-squeeze{display:inline}
.mk-cust.e-shut .mk-shut{display:inline}
.mk-cust.e-happy .mk-happy{display:inline}
.mk-cust.e-shut .mk-lido,.mk-cust.e-squeeze .mk-lido{display:none}
.mk-cust.e-shut .mk-lidc{display:inline}
.mk-cust.w-l .mk-eye-l,.mk-cust.w-l .al-eye-l,.mk-cust.w-l .al-lid-l,.mk-cust.w-l .mk-lido-l{display:none}
.mk-cust.w-l .mk-shut-l,.mk-cust.w-l .mk-lidc-l{display:inline}
.mk-cust.w-r .al-eye-r,.mk-cust.w-r .al-lid-r,.mk-cust.w-r .mk-lido-r{display:none}
.mk-cust.w-r .mk-shut-r,.mk-cust.w-r .mk-lidc-r{display:inline}
.mk-cust .mk-lips{transform-box:fill-box;transform-origin:50% 50%;transition:transform .25s cubic-bezier(.3,1.4,.5,1)}
.mk-cust.m-pucker .mk-lips{transform:scale(.84,1.14)}
.mk-cust.m-hum .mk-lips{transform:scale(.9,.96)}
.mk-cust.m-kiss .mk-lips{animation:mkkiss .6s ease-out}
@keyframes mkkiss{0%{transform:scale(.8,1.18)}40%{transform:scale(1.08,.92)}70%{transform:scale(.97,1.03)}100%{transform:scale(1)}}
.mk-cust.look-up{--al-tpy:-4px}
/* whileActing (motion.whileActing): bigger motion only while the finger is on the face */
.mk-cust.acting .mk-pose{animation:mkact .7s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes mkact{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg)}}
.mk-cust.giggle .mk-pose{animation:mkgig .9s ease-out;transform-box:fill-box;transform-origin:50% 100%}
@keyframes mkgig{0%,100%{transform:none}15%{transform:translateY(3px) scale(1.02,.98)}40%{transform:translateY(-8px) rotate(-3deg)}65%{transform:translateY(-2px) rotate(2deg)}85%{transform:translateY(1px) scale(1.01,.99)}}
.mk-cust.turn .mk-pose{animation:mkturn 2.6s ease-in-out;transform-box:fill-box;transform-origin:50% 100%}
@keyframes mkturn{0%,100%{transform:none}20%,35%{transform:translateX(-14px) rotate(-6deg)}55%,70%{transform:translateX(14px) rotate(6deg)}}
.mk-glow{position:absolute;z-index:5;pointer-events:none;border-radius:50%;box-shadow:0 0 0 6px rgba(255,236,170,.75),0 0 26px 10px rgba(255,226,140,.6);opacity:0;transition:opacity .25s}
.mk-glow.on{opacity:1}
.mk-hand{position:absolute;z-index:6;width:76px;height:76px;pointer-events:none;opacity:0;transition:opacity .2s,transform .35s cubic-bezier(.3,1.4,.5,1);transform:translateY(30px)}
.mk-hand.on{opacity:1;transform:none}
.mk-hand svg{width:100%;height:100%}
.mk-fx{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}
.mk-fx .pf{position:absolute;width:0;height:0}
.mk-fx .pf svg{position:absolute;left:-15px;top:-15px;width:30px;height:30px;overflow:visible}
.mk-fx .pf.pop{animation:mkpop ease-out forwards}
@keyframes mkpop{from{transform:scale(.6);opacity:1}to{transform:scale(1.7);opacity:0}}
.mk-fx .pf.fly{animation:mkfly ease-out forwards}
@keyframes mkfly{from{transform:translate(0,0) rotate(0);opacity:1}to{transform:translate(var(--dx),var(--dy)) rotate(var(--rot,0deg));opacity:0}}
.mk-float{position:absolute;z-index:8;pointer-events:none}
.mk-float svg{width:100%;height:100%;overflow:visible}
.mk-mirbtn{position:absolute;right:10px;bottom:10px;width:116px;height:116px;border-radius:50%;border:0;padding:12px;background:var(--paper);z-index:9;opacity:0;transition:opacity .8s ease-out;
  box-shadow:0 5px 0 rgba(46,42,79,.14),0 8px 14px rgba(91,74,66,.14);display:grid;place-items:center}
.mk-mirbtn.on{opacity:1}
.mk-mirbtn svg{width:100%;height:100%;pointer-events:none}
.mk-mirbtn:active{transform:translateY(4px)}
.mk-bigmirror{position:absolute;z-index:4;pointer-events:none;transition:transform .8s cubic-bezier(.3,1.1,.5,1);transform:translateX(130%)}
.mk-bigmirror.on{transform:none}
.mk-bigmirror svg{width:100%;height:100%}
.mk-flash{position:absolute;inset:0;z-index:10;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s ease-out}
.mk-flash.on{opacity:.55}
.mk-photo{position:absolute;z-index:11;pointer-events:none}
.mk-photo svg{width:100%;height:100%}
.mk-bub{position:absolute;z-index:6;pointer-events:none;width:96px;height:84px}
.mk-bub svg{width:100%;height:100%}
.mk-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.mk-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:12px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.mk-tool svg{width:100%;height:100%;display:block}
.mk-tool.in,.mk-card.in{animation:mkcard .3s ease-out both}
.mk-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);min-height:110px;border-radius:28px;border:0;padding:12px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,box-shadow .2s}
.mk-card svg{width:100%;height:100%;display:block;pointer-events:none}
.mk-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.mk-card .mk-wish{position:absolute;right:6px;top:4px;width:34px;height:34px;pointer-events:none}
.mk-card{position:relative}
@keyframes mkcard{from{transform:translateY(24px);opacity:0}}
.mk-show{display:flex;gap:10px;align-items:flex-end;justify-content:center;height:100%;padding:8px 0;pointer-events:none}
.mk-show span{height:78%;aspect-ratio:1;border-radius:26px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.1)}
.mk-show span svg{width:100%;height:100%}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`${PAPER_DEFS}<div class="bar mk-head"><button class="round mk-back" id="mkHome" data-go="home" aria-label="뒤로">${ICON.back}</button><button class="round mk-back" id="mkBack" aria-label="가게 앞으로" hidden>${ICON.back}</button><div class="mk-strip" id="mkStrip"></div><div class="mk-stars" id="mkStars"></div></div>
<div class="mk-stage" id="mkStage">
  <div class="mk-lobby" id="mkLobby"><div class="mk-bg">${LOBBY_BG}</div><div class="mk-frames" id="mkFrames"></div><div id="mkSeats"></div></div>
  <div class="mk-room" id="mkRoom" hidden><div class="mk-bg">${ROOM_BG}</div><div class="mk-bigmirror" id="mkBigMirror"></div><div class="mk-cust" id="mkCust"></div><div class="mk-glow" id="mkGlow"></div><div class="mk-hand" id="mkHand"></div><div class="mk-bub" id="mkBub" hidden></div>
    <div class="mk-fx" id="mkFx"></div><button class="mk-mirbtn" id="mkMirBtn" aria-label="거울" hidden>${ICON.mirror}</button><div class="mk-flash" id="mkFlash"></div></div>
</div>
<div class="mk-tray" id="mkTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='화장 가게';
const $=s=>sec.querySelector(s);
const stage=$('#mkStage'),stripEl=$('#mkStrip'),lobbyEl=$('#mkLobby'),roomEl=$('#mkRoom'),seatsEl=$('#mkSeats'),framesEl=$('#mkFrames'),custEl=$('#mkCust'),glowEl=$('#mkGlow'),handEl=$('#mkHand'),bubEl=$('#mkBub'),
  fxEl=$('#mkFx'),mirBtn=$('#mkMirBtn'),flashEl=$('#mkFlash'),bigMirEl=$('#mkBigMirror'),tray=$('#mkTray'),homeBtn=$('#mkHome'),backBtn=$('#mkBack');
const G=M.Guide.make(sec,{say});

/* ---------- state ---------- */
let view='lobby',phase='',lv=levelInfo(1),plan=[],pi=0,S=null,al=null,tool=null,lobby=[],gen=0,misses=0,lastMiss=0,lastWrong=0,H={},act=null,cards=null;
const killTool=()=>{if(tool){tool.destroy();tool=null}};
const stR=()=>stage.getBoundingClientRect();
const secXY=(x,y)=>{const r=sec.getBoundingClientRect();return[x-r.left,y-r.top]};
/* face units ↔ screen */
const custR=()=>custEl.getBoundingClientRect();
const fpt=(x,y)=>{const r=custR();return[r.left+x/VBW*r.width,r.top+y/VBH*r.height]};
const toFace=e=>{const r=custR();return[(e.clientX-r.left)/r.width*VBW,(e.clientY-r.top)/r.height*VBH]};
const unit=()=>custR().width/VBW;

/* ---------- layout: header 72px · stage · tray 18~22% of the screen ---------- */
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  const r=stR(),W=r.width,Hh=r.height;if(!W)return;
  /* the face is about 70% of the stage (games.makeup.customer) */
  const k=Math.min(W*1.02/VBW,Hh*.97/VBH),w=Math.round(VBW*k),h=Math.round(VBH*k);
  Object.assign(custEl.style,{width:w+'px',height:h+'px'});
  Object.assign(bigMirEl.style,{width:Math.round(W*.42)+'px',height:Math.round(W*.42*1.3)+'px',right:'2%',bottom:'2%'});
  layoutSeats();
}
function layoutSeats(){
  const r=lobbyEl.getBoundingClientRect();if(!r.width)return;const W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.37,Hh*.34,220))),gap=(W-3*bw)/4;
  seatsEl.querySelectorAll('.mk-seat').forEach((b,i)=>Object.assign(b.style,{left:(gap+i*(bw+gap))+'px',width:bw+'px',height:Math.round(bw*1.42)+'px',zIndex:i===1?2:1,bottom:i===1?'2%':'7%'}));
}

/* ---------- drawing the live customer ---------- */
const layer=k=>custEl.querySelector('#mkL-'+k);
let PX='';
function drawCust(){
  if(!S)return;custEl.innerHTML=bust(S.c,S.look,{live:true,vals:S.vals});PX=custEl.firstElementChild.getAttribute('data-px');
  drawFoam();drawPack();drawLotion();drawCuke();if(al)al.refresh();
}
function face(e,m){if(!custEl)return;custEl.classList.remove('e-squeeze','e-shut','e-happy','w-l','w-r');if(e)e.split(' ').forEach(x=>x&&custEl.classList.add(x.startsWith('w-')?x:'e-'+x));if(m!==undefined)mouth(m)}
function mouth(m){custEl.classList.remove('m-pucker','m-hum','m-kiss');if(m){void custEl.getBoundingClientRect();custEl.classList.add('m-'+m)}}
function giggle(){custEl.classList.remove('giggle');void custEl.getBoundingClientRect();custEl.classList.add('giggle');setTimeout(()=>custEl.classList.remove('giggle'),950)}
let rdRaf=0,rdWhat=new Set();
function redraw(k){rdWhat.add(k);if(!rdRaf)rdRaf=requestAnimationFrame(()=>{rdRaf=0;const w=rdWhat;rdWhat=new Set();w.forEach(x=>RD[x]&&RD[x]())})}
const RD={
  lips:()=>{const g=layer('lips');if(g)g.innerHTML=paintLips(PX,S.look,S.vals.lips)},
  blush:()=>{const g=layer('blush');if(g)g.innerHTML=paintBlush(PX,S.look,S.vals.cheeks)},
  lidL:()=>{['lidcl','lidol'].forEach((k,j)=>{const g=layer(k);if(g)g.innerHTML=paintLid(PX,S.look,'l',S.vals.lidL,j===0)})},
  lidR:()=>{['lidcr','lidor'].forEach((k,j)=>{const g=layer(k);if(g)g.innerHTML=paintLid(PX,S.look,'r',S.vals.lidR,j===0)})},
  lash:()=>{const g=layer('lash');if(g)g.innerHTML=lashes(S.vals.lashes)},
  foam:drawFoam,pack:drawPack,lotion:drawLotion,cuke:drawCuke,
  sheen:()=>{const g=layer('sheen');const s=S.look.sheen||0;if(g)g.innerHTML=s?`<g opacity="${(.32*Math.min(1,s)).toFixed(2)}" filter="url(#${PX}soft)"><ellipse cx="128" cy="290" rx="9" ry="4.5" fill="#fff" transform="rotate(-20 128 290)"/><ellipse cx="272" cy="290" rx="9" ry="4.5" fill="#fff" transform="rotate(20 272 290)"/><ellipse cx="200" cy="316" rx="4" ry="2.2" fill="#fff"/></g>`:''},
  smudge:()=>{const g=layer('smudge');if(!g)return;if(!S.look.smudge){g.innerHTML='';return}const f=S.vals.foam;g.innerHTML=SMUDGE_AT.map(([x,y],i)=>{const near=nearCells(x,y,26).map(j=>f[j]||0),v=near.length?near.reduce((a,b)=>a+b,0)/near.length:0;
    return v<.6?`<ellipse cx="${x}" cy="${y}" rx="${10+i%3*3}" ry="${7+i%2*3}" fill="#9A6A4A" opacity="${(.35*(1-v/.6)).toFixed(2)}"/>`:''}).join('')},
  stk:()=>{const g=layer('stk');if(g)g.innerHTML=(S.look.stickers||[]).map(k=>STK[k.k](k.x,k.y,1.25)).join('')},
  orn:()=>{const g=layer('orn');if(g)g.innerHTML=S.look.orn?ORN[S.look.orn.k](colorOf(S.look.orn.col).vivid):''}
};
const nearCells=(x,y,r)=>ZONE.face.cells.map((p,i)=>Math.hypot(p[0]-x,p[1]-y)<r?i:-1).filter(i=>i>=0);
function drawFoam(){
  const g=layer('foam');if(!g||!S)return;const f=S.vals.foam,t=S.vals.towel;let s='';
  ZONE.face.cells.forEach((p,i)=>{const v=(f[i]||0)*(1-(t[i]||0));if(v<=.02)return;const k=(i*37)%5;
    s+=`<g opacity="${Math.min(1,v*1.2).toFixed(2)}"><circle cx="${p[0]+k-2}" cy="${p[1]-k+2}" r="${(9+k*1.6).toFixed(1)}" fill="#fff" stroke="#CDE9FA" stroke-width="2"/><circle cx="${p[0]+8-k}" cy="${p[1]+6}" r="${(5+k).toFixed(1)}" fill="#fff" stroke="#CDE9FA" stroke-width="1.6"/><circle cx="${p[0]-3+k-2}" cy="${p[1]-4-k+2}" r="2.4" fill="#EAF6FF"/></g>`});
  g.innerHTML=s;RD.smudge();
}
function drawPack(){
  const g=layer('pack');if(!g||!S)return;const v=S.vals.pack;if(!S.packOn){g.innerHTML='';return}
  g.innerHTML=`<g opacity=".92" filter="url(#${PX}soft)">${dots(ZONE.face.cells,v,ZONE.face.step,'#BFE3B5',1.05)}</g>`+ZONE.face.cells.map((p,i)=>(v[i]||0)>.6&&i%3===0?`<circle cx="${p[0]}" cy="${p[1]}" r="2" fill="#9FCF93" opacity=".7"/>`:'').join('');
}
function drawLotion(){
  const g=layer('lotion');if(!g||!S)return;const v=S.vals.puff;
  g.innerHTML=(S.dollops||[]).map(([x,y])=>{const near=nearCells(x,y,40).map(j=>v[j]||0),k=near.length?near.reduce((a,b)=>a+b,0)/near.length:0,s=Math.max(0,1-k*1.25);if(s<=.02)return'';
    return `<g transform="translate(${x} ${y}) scale(${s.toFixed(2)})"><path d="M-14 6Q-16 -6 -4 -8Q0 -18 8 -10Q18 -8 14 4Q12 12 0 12Q-12 12 -14 6Z" fill="#FFFDF8" stroke="#E9DCCB" stroke-width="2"/><ellipse cx="-3" cy="-3" rx="4" ry="2.4" fill="#fff"/></g>`}).join('');
}
function drawCuke(){
  const g=layer('cuke');if(!g||!S)return;
  g.innerHTML=(S.cukes||[]).map(s=>{const [x,y]=EYE[s];return `<g transform="translate(${x} ${y+4})"><circle r="30" fill="#8FC48A" ${S3}/><circle r="23" fill="#DFF0C8"/>${[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return `<ellipse cx="${(12*Math.cos(a)).toFixed(1)}" cy="${(12*Math.sin(a)).toFixed(1)}" rx="2.4" ry="4" fill="#B9D99A" transform="rotate(${i*60+90} ${(12*Math.cos(a)).toFixed(1)} ${(12*Math.sin(a)).toFixed(1)})"/>`}).join('')}</g>`}).join('');
}
function spawn(html,x,y,cls,o={}){
  if(fxEl.childElementCount>40)return;const e=document.createElement('i');e.className='pf '+cls;e.innerHTML=`<svg viewBox="-15 -15 30 30">${html}</svg>`;
  const s=stR();e.style.left=(x-s.left)+'px';e.style.top=(y-s.top)+'px';e.style.setProperty('--dx',(o.dx||0)+'px');e.style.setProperty('--dy',(o.dy||0)+'px');e.style.setProperty('--rot',(o.rot||0)+'deg');
  const ms=o.ms||800;e.style.animationDuration=ms+'ms';fxEl.appendChild(e);setTimeout(()=>e.remove(),ms+60);
}
const sparkleAt=(x,y)=>spawn(A.twinkle(0,0,10,'#F0D58A'),x,y,'pop',{ms:700});
const bubbleAt=(x,y)=>spawn('<circle r="8" fill="#fff" stroke="#CDE9FA" stroke-width="2"/><circle cx="-3" cy="-3" r="2" fill="#EAF6FF"/>',x,y,'fly',{dx:(Math.random()-.5)*50,dy:-50-Math.random()*30,ms:800});
const noteAt=(x,y)=>spawn(`<path d="M-2 6V-10L8 -12V2" stroke="${OL}" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="-5" cy="6" rx="4.5" ry="3.4" fill="#AE9BE0" stroke="${OL}" stroke-width="2"/><ellipse cx="5" cy="2" rx="4.5" ry="3.4" fill="#AE9BE0" stroke="${OL}" stroke-width="2"/>`,x,y,'fly',{dx:30+Math.random()*30,dy:-70,rot:20,ms:1400});
const heartAt=(x,y)=>spawn(`<path d="M0 10C-14 0 -12 -11 -6 -11C-3 -11 -1 -9 0 -6C1 -9 3 -11 6 -11C12 -11 14 0 0 10Z" fill="#FF8FB1" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>`,x,y,'fly',{dx:20,dy:-80,rot:10,ms:1200});

/* ---------- header strip and stars ---------- */
function strip(){
  const items=plan.map((k,i)=>({k,i}));
  stripEl.innerHTML=items.slice(Math.max(0,Math.min(items.length-5,pi-2))).slice(0,5).map(o=>`<span class="${o.i<pi?'done':o.i===pi?'on':''}">${STEP_ICON[o.k]}${o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function stars(n){const pr=PRG();$('#mkStars').innerHTML=pr?pr.stars(GID,n):''}

/* ---------- wrong place: nothing is painted; the place glows and the customer points at it ---------- */
function zoneBox(z){
  const cs=z==='lids'?ZONE.lidL.cells.concat(ZONE.lidR.cells):z==='lidL'||z==='lidR'?ZONE[z].cells:z==='eyes'?[[EYE.l[0]-30,EYE.l[1]-30],[EYE.r[0]+30,EYE.r[1]+30]]:ZONE[z].cells;
  const xs=cs.map(p=>p[0]),ys=cs.map(p=>p[1]);return{x0:Math.min(...xs)-10,y0:Math.min(...ys)-10,x1:Math.max(...xs)+10,y1:Math.max(...ys)+10};
}
function glow(z){
  if(!z||!S)return;const parts=z==='cheeks'?[CHEEK.l,CHEEK.r].map(([x,y])=>({x0:x-CHEEK_R,y0:y-CHEEK_R,x1:x+CHEEK_R,y1:y+CHEEK_R})):z==='lashes'?['l','r'].map(s=>({x0:EYE[s][0]-34,y0:216,x1:EYE[s][0]+34,y1:252})):[zoneBox(z)];
  const b=parts.reduce((a,q)=>({x0:Math.min(a.x0,q.x0),y0:Math.min(a.y0,q.y0),x1:Math.max(a.x1,q.x1),y1:Math.max(a.y1,q.y1)}));
  const s=stR(),[x0,y0]=fpt(b.x0,b.y0),[x1,y1]=fpt(b.x1,b.y1);
  Object.assign(glowEl.style,{left:(x0-s.left)+'px',top:(y0-s.top)+'px',width:(x1-x0)+'px',height:(y1-y0)+'px',borderRadius:z==='cheeks'||z==='lashes'?'40px':'50%'});
  glowEl.classList.add('on');clearTimeout(glow.t);glow.t=setTimeout(()=>glowEl.classList.remove('on'),1100);
  /* the customer's hand comes up beside the place */
  const [hx,hy]=fpt(Math.min(b.x1+6,VBW-60),Math.max(b.y1-10,0));handEl.innerHTML=POINT_HAND(S.c);Object.assign(handEl.style,{left:(hx-s.left)+'px',top:(hy-s.top)+'px'});
  handEl.classList.add('on');clearTimeout(glow.h);glow.h=setTimeout(()=>handEl.classList.remove('on'),1300);
}
function wrongPlace(z){
  if(!S)return;const n=performance.now();if(n-lastWrong<1400)return;lastWrong=n;misses++;S.wrong++;LOG.push('wrong:'+z);glow(z);G.nudge();
  say('여기야!','Here!');tone(660,.08,'sine',.08);tone(880,.1,'sine',.08,.1);
}
function miss(){misses++;if(S)S.wrong++;G.nudge();const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}

/* ============================== shop front (가게 앞): three customers wait; tap one ============================== */
function newCust(avoid){const pool=CUST.filter(c=>!avoid.includes(c.id));return pick(pool.length?pool:CUST).id}
function fillLobby(){const have=lobby.filter(Boolean);if(have.length===3)return;lobby=shuffle(CUST.map(c=>c.id)).slice(0,3)}
function renderFrames(fresh){framesEl.innerHTML=[0,1,2].map(i=>{const w=DATA.wall[i];return `<div class="mk-frame${w&&fresh&&i===0?' new':''}">${FRAME(w?portrait(w):'')}</div>`}).join('')}
function renderSeats(){
  seatsEl.innerHTML=lobby.map((k,i)=>{const c=custOf(k);return `<button class="mk-seat" data-i="${i}" aria-label="${c.ko}"><span class="mk-stool">${STOOL}</span><span class="mk-mini">${bust(c,{},{})}</span></button>`}).join('');
  layoutSeats();lobbyAlive();
}
let lobbyAl=[],turns=null;
function lobbyAlive(){lobbyAliveOff();if(!M.Alive)return;seatsEl.querySelectorAll('.mk-mini').forEach(e=>lobbyAl.push(M.Alive.attach(e,{kind:'girl',waiting:false})));turns=M.Alive.takeTurns(lobbyAl,{play:'hop'})}
function lobbyAliveOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
function showLobby(o={}){
  L.begin();gen++;killTool();G.stop();H={};cards=null;fxEl.innerHTML='';if(al){al.detach();al=null}
  view='lobby';phase='lobby';S=null;lv=levelInfo(levelNo());plan=lv.steps.slice();pi=-1;
  lobbyEl.hidden=false;roomEl.hidden=true;homeBtn.hidden=false;backBtn.hidden=true;
  fillLobby();renderFrames(!!o.served);renderSeats();size();strip();
  const R=o.result;stars(R?R.filled-1:undefined);
  if(R)L.later(()=>{const pr=PRG();if(pr)pr.fillStars($('#mkStars'),R.filled);LOG.push('star:'+R.filled)},400);
  if(R&&R.up){L.later(()=>levelUp(R.level),1600)}
  showcase();
  L.onEnd(lobbyAliveOff);
  L.later(()=>{say('누구를 예쁘게 해 줄까? 친구를 콕 눌러 봐!','Who should we make pretty? Tap a friend!');
    G.start({type:'tap',at:()=>{const b=seatsEl.querySelector('.mk-seat:nth-child(2) .mk-mini');if(!b)return[sec.clientWidth/2,sec.clientHeight/2];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height*.5)}})},R?2400:300);
}
/* the tray in front of the shop: today's cosmetics on display (pictures only, nothing to press) */
function showcase(){const ks=lv.steps.slice(-3);tray.innerHTML=`<div class="mk-show">${ks.map(k=>`<span>${STEP_ICON[k]}</span>`).join('')}</div>`}
function levelUp(n){
  const prev=levelInfo(n-1).steps,now=levelInfo(n).steps,k=now.find(x=>!prev.includes(x));LOG.push('levelup:'+n+(k?':'+k:''));
  const pr=PRG();if(!pr||!k)return;const nm={lotion:TOOL_NAME.lotion,eyeshadow:TOOL_NAME.shadow,pack:TOOL_NAME.cucumber,mascara:TOOL_NAME.mascara,sparkle:TOOL_NAME.sparkle}[k]||['새 화장품!','Something new!'];
  pr.moment(lobbyEl,{art:STEP_ICON[k],ko:nm[0],en:nm[1]},()=>{stars(0)});
}
seatsEl.addEventListener('click',e=>{const b=e.target.closest('.mk-seat');if(!b||phase!=='lobby')return;pickCust(+b.dataset.i,b)});
lobbyEl.addEventListener('pointerdown',e=>{actx();if(phase==='lobby'&&!e.target.closest('.mk-seat'))miss()});
function pickCust(i,b){
  phase='pick';G.touch();G.stop();actx();sfx.pop();const c=custOf(lobby[i]);LOG.push('pick:'+c.id);
  say(`${c.ko}, 앉아!`,`Have a seat, ${c.en}!`);
  b.animate([{transform:'scale(1)'},{transform:'scale(1.08) translateY(-10px)'},{transform:'scale(.6) translateY(-40px)',opacity:0}],{duration:520,easing:'ease-in-out',fill:'forwards'});
  L.later(()=>enterRoom(i),560);
}
backBtn.addEventListener('click',()=>{if(view!=='room')return;actx();sfx.pop();showLobby()});

/* ============================== in the chair ============================== */
function freshState(c){
  const z=k=>ZONE[k].cells.map(()=>0);
  return{c,look:{smudge:true,sheen:0,lashes:0,stickers:[]},vals:{foam:z('face'),towel:z('face'),pack:z('face'),puff:z('face'),lips:z('lips'),cheeks:z('cheeks'),lidL:z('lidL'),lidR:z('lidR'),lashes:z('lashes')},
    dollops:[],cukes:[],packOn:false,wrong:0,idle:0,wish:null,done:[],t0:performance.now()};
}
function enterRoom(i){
  L.begin();gen++;killTool();G.stop();H={};fxEl.innerHTML='';lobbyAliveOff();
  const c=custOf(lobby[i]);view='room';phase='enter';S=freshState(c);S.seat=i;lv=levelInfo(levelNo());plan=lv.steps.slice();pi=0;
  /* level 4: the customer asks for a colour with a speech bubble (lips, or blush) */
  if(lv.wish){const k=plan.includes('lips')?'lips':'blush';S.wish={step:k,col:pick(c[k])}}
  custEl.classList.remove('end');lobbyEl.hidden=true;roomEl.hidden=false;homeBtn.hidden=true;backBtn.hidden=false;mirBtn.hidden=true;mirBtn.classList.remove('on');bigMirEl.classList.remove('on');bubEl.hidden=true;
  size();face('');drawCust();strip();stars();
  if(M.Alive){al=M.Alive.attach(custEl,{kind:'girl'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('enter');
  L.later(()=>{say(`안녕! 나는 ${iya(c.ko)}. 예쁘게 해 줄래?`,`Hi! I'm ${c.en}. Will you make me pretty?`,true);if(al)al.play('hop',{n:2})},700);
  L.later(run,2600);
}
function run(){
  const k=plan[pi];if(!k){finishRound();return}
  phase=k;strip();LOG.push('step:'+k);STEP[k]();
}
function next(){
  /* "다음 ▶" is never a button: when a step is done the next one starts by itself after a short bridge */
  const g=gen;S.done.push(plan[pi]);pi++;strip();L.later(()=>{if(g===gen)run()},1500);
}
function toolTray(html){tray.innerHTML=`<div class="mk-tool in">${html}</div>`;return tray.querySelector('.mk-tool')}
function intro(html,nm){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko:nm[0],en:nm[1]}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
const toolPx=()=>{const t=TOUCH.tool||{},w=stR().width;return Math.min(t.maxPx||300,Math.max(t.minPx||180,w*(t.stageWidthRatio||.45)))};
/* a finger-following tool over a zone. cells in face units; only those cells change (and only within the brush around the finger) */
function zoneTool(o){
  killTool();const cells=o.cells,u=()=>unit();let introStop=intro(o.icon,o.name),lastS=0;
  const cols=Math.round(VBW/o.step),rows=Math.round(VBH/o.step);
  tool=P.makeTool(stage,{tool:o.icon,effect:'brush',fx:o.fx||(()=>''),anchor:o.anchor||[.16,.84],gapScale:o.gap==null?.18:o.gap,size:()=>Math.min(toolPx(),o.px||220),
    cells:cells.map(([x,y])=>[x/VBW,y/VBH]),target:()=>custR(),face:null,
    radius:()=>o.rad*u(),rub:Object.assign({tapChunk:.12,needStageWidths:1.1,holdProgressPerSec:0},o.rub||{}),
    cfg:()=>({coverage:{grid:[cols,rows],doneAt:o.doneAt||.85,holdStillCleansNearest:false}}),
    onMiss:miss,
    onTouch:(e)=>{G.touch();if(introStop){introStop();introStop=null}custEl.classList.add('acting');S.lastTouch=performance.now();checkPlace(e,o);if(o.onTouch)o.onTouch(e)},
    onRelease:()=>{G.release();setTimeout(()=>custEl.classList.remove('acting'),800);if(o.onRelease)o.onRelease()},
    onMove:(pt,d)=>{const s=stR();checkPlace({clientX:pt.x+s.left,clientY:pt.y+s.top},o);const n=performance.now();if(o.sound&&n-lastS>140){lastS=n;o.sound()}},
    onCell:(i,v,pv,why)=>{o.vals[i]=v;if(o.onCell)o.onCell(i,v,pv,why);redraw(o.redraw)},
    onProgress:(p,ratio)=>{if(o.onProgress)o.onProgress(p,ratio)},
    onAutoFinish:rest=>{rest.slice(0,6).forEach((i,k)=>L.later(()=>{const [x,y]=fpt(...cells[i]);sparkleAt(x,y)},k*90))},
    onDone:()=>{killTool();custEl.classList.remove('acting');G.stop();if(o.onDone)o.onDone()}});
  L.onEnd(killTool);
  const cx=cells.reduce((a,p)=>a+p[0],0)/cells.length,cy=cells.reduce((a,p)=>a+p[1],0)/cells.length,mid=cells.reduce((b,p)=>Math.hypot(p[0]-cx,p[1]-cy)<Math.hypot(b[0]-cx,b[1]-cy)?p:b,cells[0]);
  G.start({type:o.guide||'scrub',at:()=>{const c=mid;const [x,y]=fpt(c[0],c[1]);return secXY(x,y)}});
}
/* the finger is on the face but away from this tool's place → glow + point (only once in a while) */
function checkPlace(e,o){
  if(!o.zone)return;const [x,y]=toFace(e),far=!o.cells.some(([cx,cy])=>Math.hypot(cx-x,cy-y)<o.rad*1.6);
  if(far)wrongPlace(o.zone);
}

/* ---------- colour cards (3): pick → the tool comes with that colour ---------- */
function colorCards(kind,then){
  const set=S.c[kind]||['pink','red','magenta'],wish=S.wish&&S.wish.step===(kind==='blush'?'blush':kind)?S.wish.col:null;
  const pic=kind==='lips'?lipsCard:kind==='blush'?blushCard:shadowCard;
  tray.innerHTML='';cards={kind,set};
  set.forEach((en,k)=>{const c=colorOf(en),b=document.createElement('button');b.className='mk-card in';b.style.animationDelay=(k*70)+'ms';b.dataset.col=en;b.setAttribute('aria-label',c.ko);b.innerHTML=pic(c.hex);tray.appendChild(b)});
  const ask={lips:['어떤 색 립스틱을 바를까? 하나 골라 봐!','Which lipstick? Pick one!'],blush:['볼은 어떤 색으로 할까?','Which colour for the cheeks?'],shadow:['눈에는 어떤 색을 할까?','Which colour for the eyes?']}[kind];
  if(wish){showWish(wish);say(`나는 ${colorOf(wish).ko}이 좋아!`,`I like ${colorOf(wish).en}!`,true)}
  say(ask[0],ask[1],true);
  G.start({type:'tap',at:()=>{const b=tray.querySelector('.mk-card:nth-child(2)')||tray.firstElementChild;const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}});
  H.card=(b)=>{const en=b.dataset.col;cards=null;H.card=null;G.stop();hideWish();tray.querySelectorAll('.mk-card').forEach(x=>x.classList.toggle('sel',x===b));sfx.pop();const c=colorOf(en);LOG.push('color:'+kind+':'+en);
    if(wish&&en===wish){say('내가 원하던 색이야! 고마워!','That\'s the one I wanted! Thank you!');giggle();if(al)al.sound('wow')}else say(c.ko+'!',cap(c.en)+'!');
    const g=gen;L.later(()=>{if(g===gen)then(en)},700)};
}
function showWish(en){const c=colorOf(en);bubEl.hidden=false;const s=stR(),[x,y]=fpt(330,140);Object.assign(bubEl.style,{left:Math.min(s.width-100,x-s.left)+'px',top:Math.max(4,y-s.top-80)+'px'});
  bubEl.innerHTML=`<svg viewBox="0 0 96 84"><path d="M12 4H84Q92 4 92 12V52Q92 60 84 60H40L22 78L26 60H12Q4 60 4 52V12Q4 4 12 4Z" fill="#FFFDF9" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="32" r="17" fill="${c.hex}" stroke="${OL}" stroke-width="2.5"/><path d="M40 26Q44 20 50 20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>`}
function hideWish(){bubEl.hidden=true}
tray.addEventListener('pointerdown',e=>{const b=e.target.closest('.mk-card');if(!b)return;e.preventDefault();actx();G.touch();if(H.card)H.card(b)});

/* ============================== the steps (games.makeup.steps) ============================== */
const STEP={
  /* 세안: foam rubbed on (dirt goes under the bubbles) → wet towel wipes (only where it touched) — eyes squeezed shut */
  wash(){
    face('squeeze');say('세수부터 하자! 눈을 꼭 감아!','Let\'s wash first! Close your eyes tight!',true);
    const g=gen;L.later(()=>{if(g!==gen)return;
      zoneTool({icon:ICON.foam,name:TOOL_NAME.foam,cells:ZONE.face.cells,step:ZONE.face.step,rad:30,vals:S.vals.foam,redraw:'foam',zone:null,anchor:[.2,.5],gap:.3,
        sound:()=>SFX.scrub(),onCell:(i,v,pv,why)=>{if(v>=1&&pv<1&&why!=='auto'&&Math.random()<.3){const [x,y]=fpt(...ZONE.face.cells[i]);bubbleAt(x,y)}},
        onTouch:()=>{if(al)al.sound('giggle')},
        onDone:()=>{const w=VO.actionWords&&VO.actionWords.bubbles;if(w)say(w.ko,w.en);
          L.later(()=>{if(g!==gen)return;
            zoneTool({icon:ICON.towel,name:TOOL_NAME.towel,cells:ZONE.face.cells,step:ZONE.face.step,rad:30,vals:S.vals.towel,redraw:'foam',anchor:[.5,.6],gap:.3,
              sound:()=>SFX.swish&&Math.random()<.4&&SFX.swish(),
              onCell:(i,v,pv,why)=>{if(v>=1&&pv<1&&why!=='auto'&&Math.random()<.25){const [x,y]=fpt(...ZONE.face.cells[i]);sparkleAt(x,y)}},
              onDone:()=>{S.look.smudge=false;face('happy');giggle();SFX.sparkle();const w=VO.actionWords&&VO.actionWords.clean,t=praise(w&&w.ko,w&&w.en);say(t[0],t[1]);if(al)al.play('hop');L.later(()=>face(''),1400);next()}})},900)}})},1200);
  },
  /* 오이 팩: two cucumber slices onto the eyes (tap tap), the mask on (rub), 5 s humming, then tap to peel off */
  pack(){
    face('');say('오이를 눈 위에 콕콕 올려 줘!','Put the cucumbers on the eyes! Tap tap!',true);
    toolTray(ICON.cucumber);S.cukes=[];
    G.start({type:'tap',at:()=>{const s=S.cukes.includes('l')?'r':'l';const [x,y]=fpt(...EYE[s]);return secXY(x,y)}});
    H.down=e=>{const [x,y]=toFace(e);const s=['l','r'].find(k=>Math.hypot(EYE[k][0]-x,EYE[k][1]-y)<46&&!S.cukes.includes(k));
      if(!s){if(Math.hypot(x-200,y-260)<150)wrongPlace('eyes');else miss();return true}
      G.touch();const tr=tray.querySelector('.mk-tool').getBoundingClientRect(),[tx,ty]=fpt(...EYE[s]);
      fly(ICON.cucumber,[tr.left+tr.width/2,tr.top+tr.height/2],[tx,ty],tr.width*.7,unit()*64,420,()=>{S.cukes.push(s);face(S.cukes.length===2?'shut':'w-'+s);drawCuke();tone(520,.08,'sine',.12);LOG.push('cuke:'+s);
        if(S.cukes.length===2){H.down=null;G.stop();say('시원해~','So cool~');const g=gen;L.later(()=>{if(g===gen)packOn()},900)}});
      return true};
    const packOn=()=>{S.packOn=true;say('팩을 쓱쓱 발라 줘!','Spread the mask! Rub rub!',true);
      zoneTool({icon:ICON.spatula,name:TOOL_NAME.spatula,cells:ZONE.face.cells,step:ZONE.face.step,rad:30,vals:S.vals.pack,redraw:'pack',sound:()=>SFX.scrub(),anchor:[.2,.76],gap:.25,
        onDone:()=>{SFX.sparkle();say('이제 기다려요. 흥얼흥얼~','Now we wait. Hum hum~');mouth('hum');
          let k=0;const g=gen,hum=()=>{if(g!==gen||phase!=='pack')return;const [x,y]=fpt(250,330);noteAt(x,y);[392,440,494,440][k%4]&&tone([392,440,494,440][k%4],.3,'sine',.06);k++;if(k<HUM_MS/600)L.later(hum,600)};hum();
          L.later(()=>{if(g!==gen)return;mouth('');say('이제 팩을 떼자! 얼굴을 콕!','Time to peel it off! Tap the face!',true);
            G.start({type:'tap',at:()=>{const [x,y]=fpt(200,300);return secXY(x,y)}});
            H.down=e=>{const [x,y]=toFace(e);if(Math.hypot(x-200,y-270)>150){miss();return true}H.down=null;G.stop();peel();return true}},HUM_MS)}})};
    const peel=()=>{const g=layer('pack');if(g)g.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(40px)',opacity:0}],{duration:600,easing:'ease-in',fill:'forwards'});
      LOG.push('peel');noise(.35,{type:'bandpass',freq:1400,q:.9,vol:.12});
      L.later(()=>{S.packOn=false;S.cukes=[];drawPack();drawCuke();S.look.sheen=.6;RD.sheen();face('happy');giggle();const t=praise('매끈매끈!','So smooth!');say(t[0],t[1]);L.later(()=>face(''),1400);next()},650)};
  },
  /* 로션: tap 4 times (forehead, both cheeks, chin) → puff spreads it (rub) */
  lotion(){
    face('');S.dollops=[];const spots=[FOREHEAD,CHEEK.l,CHEEK.r,CHIN].slice(0,Math.max(1,LOTION_TAPS));
    toolTray(ICON.lotion);say('로션을 톡톡! 이마, 볼, 턱에 콕 눌러 줘!','Dab the lotion! Tap the forehead, cheeks and chin!',true);
    const nextSpot=()=>spots.find(p=>!S.dollops.some(d=>d[0]===p[0]&&d[1]===p[1]));
    G.start({type:'tap',at:()=>{const p=nextSpot()||spots[0];const [x,y]=fpt(...p);return secXY(x,y)}});
    H.down=e=>{const [x,y]=toFace(e),p=spots.find(q=>Math.hypot(q[0]-x,q[1]-y)<48&&!S.dollops.includes(q));
      if(!p){if(Math.hypot(x-200,y-270)<150)wrongPlace('face');else miss();return true}
      G.touch();S.dollops.push(p);drawLotion();tone(700+S.dollops.length*80,.08,'sine',.1);giggle();LOG.push('dab');
      const g=layer('lotion');if(g&&g.lastElementChild)g.lastElementChild.animate([{transform:g.lastElementChild.getAttribute('transform')+' scale(1.4,.6)'},{transform:g.lastElementChild.getAttribute('transform')}],{duration:300,easing:'ease-out'});
      if(S.dollops.length>=spots.length){H.down=null;G.stop();const gg=gen;L.later(()=>{if(gg!==gen)return;say('이제 쓱쓱 펴 발라 줘!','Now spread it! Rub rub!',true);
        zoneTool({icon:ICON.puff,name:TOOL_NAME.puff,cells:ZONE.face.cells,step:ZONE.face.step,rad:34,vals:S.vals.puff,redraw:'lotion',anchor:[.3,.7],gap:.3,
          onCell:(i,v)=>{S.look.sheen=Math.max(S.look.sheen||0,S.vals.puff.reduce((a,b)=>a+b,0)/S.vals.puff.length);redraw('sheen')},
          onDone:()=>{S.look.sheen=1;RD.sheen();face('happy');giggle();SFX.sparkle();const t=praise('촉촉해!','So soft!');say(t[0],t[1]);L.later(()=>face(''),1300);next()}})},700)}
      return true};
  },
  /* 볼터치: 3 colour cards → big brush, tap tap on the cheeks (both) */
  blush(){
    face('');colorCards('blush',en=>{S.look.blush={col:en};drawCust();say('볼을 톡톡! 양쪽 다!','Dab the cheeks! Both sides!',true);
      zoneTool({icon:ICON.blushBrush,name:TOOL_NAME.blush,cells:ZONE.cheeks.cells,step:ZONE.cheeks.step,rad:24,vals:S.vals.cheeks,redraw:'blush',zone:'cheeks',guide:'tap',anchor:[.14,.86],
        rub:{tapChunk:.13},onTouch:()=>{face('happy');giggle()},onRelease:()=>face(''),
        onCell:(i,v,pv,why)=>{if(v>=1&&pv<1&&why!=='auto'&&Math.random()<.4){const [x,y]=fpt(...ZONE.cheeks.cells[i]);sparkleAt(x,y)}},
        onDone:()=>{face('happy');SFX.sparkle();const t=praise('발그레!','Rosy cheeks!');say(t[0],t[1]);if(al)al.play('hop');L.later(()=>face(''),1300);next()}})});
  },
  /* 아이섀도: 3 cards → the customer closes one eye → brush the lid → the other side */
  eyeshadow(){
    face('');colorCards('shadow',en=>{S.look.shadow={col:en};drawCust();
      const side=s=>{face('w-'+s);say(s==='l'?'눈을 감았어요. 눈꺼풀을 쓱쓱!':'이번엔 반대쪽!',s==='l'?'Eyes closed. Brush the eyelid!':'Now the other side!',true);
        const zk=s==='l'?'lidL':'lidR';
        zoneTool({icon:ICON.shadowBrush,name:TOOL_NAME.shadow,cells:ZONE[zk].cells,step:ZONE[zk].step,rad:18,vals:S.vals[zk],redraw:zk,zone:zk,anchor:[.14,.86],
          onDone:()=>{SFX.sparkle();if(s==='l'){face('');const g=gen;L.later(()=>{if(g===gen)side('r')},900)}else{face('');if(al)al.play('hop');const t=praise('반짝반짝 눈!','Sparkly eyes!');say(t[0],t[1]);next()}}})};
      side('l')});
  },
  /* 마스카라: wand up along the lashes → they grow, then blink blink */
  mascara(){
    face('');custEl.classList.add('look-up');say('속눈썹을 위로 쓱! 길어져라~','Brush the lashes up! Grow long~',true);
    zoneTool({icon:ICON.mascara,name:TOOL_NAME.mascara,cells:ZONE.lashes.cells,step:ZONE.lashes.step,rad:16,vals:S.vals.lashes,redraw:'lash',zone:'lashes',anchor:[.2,.8],guide:'swipe',
      onDone:()=>{custEl.classList.remove('look-up');S.look.lashes=1;RD.lash();
        let k=0;const blink=()=>{custEl.classList.add('al-blink');setTimeout(()=>custEl.classList.remove('al-blink'),160);if(++k<2)setTimeout(blink,380)};setTimeout(blink,200);
        tone(988,.1,'sine',.08);tone(1318,.12,'sine',.08,.4);const t=praise('깜빡깜빡!','Blink blink!');say(t[0],t[1]);next()}});
  },
  /* 립스틱: 3 cards → she puckers → only inside the lips → "음~마!" */
  lips(){
    face('');colorCards('lips',en=>{S.look.lips={col:en};drawCust();face('shut','pucker');if(al)al.sound('hehe');say('입술을 쭉! 입술에만 칠해 줘!','Pucker up! Only on the lips!',true);
      zoneTool({icon:lipstickSVG(colorOf(en).hex),name:TOOL_NAME.lips,cells:ZONE.lips.cells,step:ZONE.lips.step,rad:13,vals:S.vals.lips,redraw:'lips',zone:'lips',anchor:[.2,.8],
        rub:{needStageWidths:.9,tapChunk:.1},
        onDone:()=>{face('happy','kiss');const [x,y]=fpt(...LIP);heartAt(x,y);say('음~마!','Mwah!');tone(880,.08,'sine',.12);tone(660,.12,'sine',.1,.12);
          L.later(()=>{face('');mouth('');const t=praise('예뻐!','So pretty!');say(t[0],t[1]);next()},1200)}});
    });
  },
  /* 마무리: star/heart stickers on cheeks or forehead (tap to put, tap again to take off) and one hair ornament */
  sparkle(){
    face('');say('반짝이 스티커를 붙여 줘! 머리 장식도!','Add sparkle stickers! And something for the hair!',true);
    const ornK=pick(['bow','tiara','flower']),ornCol=pick(S.c.lips);
    tray.innerHTML='';[['star',stkCard('star')],['heart',stkCard('heart')],['orn',ornCard(ornK,colorOf(ornCol).hex)]].forEach(([k,html],j)=>{const b=document.createElement('button');b.className='mk-card in';b.style.animationDelay=(j*70)+'ms';b.dataset.k=k;b.setAttribute('aria-label',k);b.innerHTML=html;tray.appendChild(b)});
    let sel=null;const OK=[[CHEEK.l,46],[CHEEK.r,46],[[200,200],40]];
    H.card=b=>{const k=b.dataset.k;sfx.pop();if(k==='orn'){S.look.orn=S.look.orn?null:{k:ornK,col:ornCol};RD.orn();LOG.push('orn');if(S.look.orn){if(al)al.play('hop');say('예쁜 머리 장식!','A pretty hair ornament!')}mirrorSoon();return}
      sel=k;tray.querySelectorAll('.mk-card').forEach(x=>x.classList.toggle('sel',x===b));say('볼이나 이마에 콕!','Tap a cheek or the forehead!');
      G.start({type:'tap',at:()=>{const [x,y]=fpt(...CHEEK.r);return secXY(x,y)}})};
    G.start({type:'tap',at:()=>{const r=tray.firstElementChild.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}});
    H.down=e=>{const [x,y]=toFace(e);
      const hit=(S.look.stickers||[]).findIndex(s=>Math.hypot(s.x-x,s.y-y)<22);
      if(hit>=0){S.look.stickers.splice(hit,1);RD.stk();tone(520,.08,'sine',.1);LOG.push('unstick');return true}
      if(!sel){G.nudge();return true}
      const ok=OK.some(([p,r])=>Math.hypot(p[0]-x,p[1]-y)<r);if(!ok){if(Math.hypot(x-200,y-270)<160)wrongPlace('cheeks');else miss();return true}
      if(S.look.stickers.length>=6)S.look.stickers.shift();
      S.look.stickers.push({k:sel,x:Math.round(x),y:Math.round(y)});RD.stk();G.stop();tone(1046,.08,'sine',.1);sparkleAt(e.clientX,e.clientY);giggle();LOG.push('stick:'+sel);mirrorSoon();return true};
    const mirrorSoon=()=>{if(S.look.stickers.length+(S.look.orn?1:0)>=2)showMirror()};
  }
};
function finishRound(){phase='free';tray.innerHTML=`<div class="mk-tool in">${ICON.mirror}</div>`;showMirror();say('다 했으면 거울을 콕!','All done? Tap the mirror!',true)}
function showMirror(){if(!mirBtn.hidden)return;mirBtn.hidden=false;requestAnimationFrame(()=>mirBtn.classList.add('on'));
  G.start({type:'tap',wait:phase==='sparkle',quiet:phase==='sparkle',at:()=>{const r=mirBtn.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}})}
/* touches on the stage while a tap step is on (makeTool listens on its own) */
stage.addEventListener('pointerdown',e=>{
  actx();if(view!=='room'||e.target.closest('.mk-mirbtn'))return;
  if(H.down){e.preventDefault();if(H.down(e)===false)miss()}
  else if(!tool&&(phase==='free'))miss();
});
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='mk-float';f.innerHTML=html;const s=stR();
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(from[0]-s.left-s0/2)+'px',top:(from[1]-s.top-s0/2)+'px'});stage.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-50}px) scale(${(1+k)/2})`,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(${k*1.15},${k*.85})`,offset:.9},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);
}

/* ============================== ending: the mirror (only when the child presses it) ============================== */
const BIG_MIRROR=`<svg viewBox="0 0 200 260"><path d="M88 226H112L118 258H82Z" fill="${PAL.butter||'#F0D58A'}" ${S3}/><ellipse cx="100" cy="124" rx="88" ry="112" fill="${PAL.butter||'#F0D58A'}" ${S3}/><ellipse cx="100" cy="124" rx="72" ry="96" fill="#EAF3F6" ${S3}/><path d="M56 70Q74 44 104 40" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>${A.twinkle(170,30,10,'#F0D58A')}</svg>`;
mirBtn.addEventListener('click',()=>{
  if(view!=='room'||mirBtn.hidden||!S)return;actx();
  const g=gen;phase='mirror';H={};killTool();G.stop();tray.innerHTML='';mirBtn.classList.remove('on');mirBtn.hidden=true;LOG.push('mirror');sfx.pop();
  bigMirEl.innerHTML=BIG_MIRROR;bigMirEl.classList.add('on');custEl.classList.add('end');face('');
  L.later(()=>{say('우와, 예쁘다!','Wow, so pretty!');if(al)al.sound('wow');custEl.classList.remove('turn');void custEl.offsetWidth;custEl.classList.add('turn')},700);
  L.later(()=>{face('w-r');tone(1318,.12,'sine',.08)},3000);   // wink
  L.later(()=>{face('happy')},3700);
  L.later(()=>{flashEl.classList.add('on');SFX.shutter&&SFX.shutter();setTimeout(()=>flashEl.classList.remove('on'),260);photo()},4200);
  L.later(()=>{
    const rec={cust:S.c.id,look:{lips:S.look.lips,blush:S.look.blush,shadow:S.look.shadow,lashes:S.look.lashes?1:0,stickers:S.look.stickers||[],orn:S.look.orn,sheen:S.look.sheen?1:0}};
    DATA.wall.unshift(rec);DATA.wall=DATA.wall.slice(0,3);DATA.served++;save();
    say('고마워! 또 올게!','Thank you! See you again!');if(al)al.play('wave')},5600);
  L.later(()=>{if(g!==gen)return;const i=S.seat;lobby[i]=null;const others=lobby.filter(Boolean);lobby[i]=newCust(others.concat([S.c.id]));
    let result=null;const pr=PRG();if(pr){pr.struggle(GID,{wrong:S.wrong,idleMs:S.idle});result=pr.clear(GID)}else{DATA.level=Math.min(LEVELS.length,DATA.level+1);save()}
    showLobby({served:true,result})},7600);
});
function photo(){
  const r=custR(),s=stR(),w=r.width*.6,h=w*112/100;const f=document.createElement('div');f.className='mk-photo';
  const rec={cust:S.c.id,look:S.look};f.innerHTML=FRAME(portrait(rec));Object.assign(f.style,{width:w+'px',height:h+'px',left:(r.left-s.left+r.width/2-w/2)+'px',top:(r.top-s.top+r.height*.18)+'px'});stage.appendChild(f);
  L.later(()=>{const a=f.animate([{transform:'none',opacity:1},{transform:`translate(${-(r.left-s.left+r.width/2-w/2)}px,${-(r.top-s.top)}px) scale(.3)`,opacity:.2}],{duration:1100,easing:'ease-in',fill:'forwards'});a.onfinish=()=>f.remove()},700);
  L.onEnd(()=>f.remove());
}

/* ============================== test hooks ============================== */
M.__mkLevel=n=>{DATA.level=Math.max(1,Math.min(LEVELS.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)showLobby();return levelNo()};
const avg=a=>a&&a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
M.__mk=()=>{
  const ops=[...custEl.querySelectorAll('.mk-op')].map(e=>+e.getAttribute('opacity'));
  return{view,phase,level:lv.level,plan:plan.slice(),pi,step:plan[pi]||null,cust:S?S.c.id:null,misses,
    cover:S?{lips:avg(S.vals.lips),cheeks:avg(S.vals.cheeks),lidL:avg(S.vals.lidL),lidR:avg(S.vals.lidR),lashes:avg(S.vals.lashes),foam:avg(S.vals.foam),towel:avg(S.vals.towel),pack:avg(S.vals.pack),puff:avg(S.vals.puff)}:null,
    painted:S?{lips:S.vals.lips.filter(v=>v>0).length,cheeks:S.vals.cheeks.filter(v=>v>0).length,lidL:S.vals.lidL.filter(v=>v>0).length,lidR:S.vals.lidR.filter(v=>v>0).length,lashes:S.vals.lashes.filter(v=>v>0).length}:null,
    look:S?JSON.parse(JSON.stringify(S.look)):null,maxOpacity:ops.length?Math.max(...ops):0,cap:MAXOP,
    toolOn:!!tool,cellPts:tool?tool.cellPts():[],cards:[...tray.querySelectorAll('.mk-card')].map(b=>b.dataset.col||b.dataset.k),
    pts:S?{lips:fpt(...LIP),cheekL:fpt(...CHEEK.l),cheekR:fpt(...CHEEK.r),eyeL:fpt(...EYE.l),eyeR:fpt(...EYE.r),hair:fpt(200,128),forehead:fpt(...FOREHEAD),chin:fpt(...CHIN),lidL:fpt(EYE.l[0],236),lidR:fpt(EYE.r[0],236),nose:fpt(200,300)}:null,
    spots:S&&phase==='lotion'?[FOREHEAD,CHEEK.l,CHEEK.r,CHIN].map(p=>fpt(...p)):null,dollops:S?S.dollops.length:0,cukes:S?S.cukes.length:0,packOn:S?S.packOn:false,
    waitTap:!!H.down,mirror:!mirBtn.hidden,served:DATA.served,wall:DATA.wall.length,frames:framesEl.querySelectorAll('.mk-frame svg g g').length,
    seats:[...seatsEl.querySelectorAll('.mk-seat')].map(b=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width,r.height]}),
    eyes:[...custEl.classList].filter(c=>/^(e-|w-|m-)/.test(c)),wish:S&&S.wish,alive:al?al.state():null,log:LOG.slice(),guide:G.state()};
};
/* preview hook for art checks: the customer in the chair with a given finished look and face */
M.__mkPreview=(cid,look,cls)=>{L.begin();gen++;killTool();G.stop();H={};view='room';phase='preview';lobbyEl.hidden=true;roomEl.hidden=false;S=freshState(custOf(cid));S.look=Object.assign(S.look,{smudge:false},look||{});
  ['lips','cheeks','lidL','lidR'].forEach(k=>{if(look&&(look[k==='cheeks'?'blush':k==='lips'?'lips':'shadow']))S.vals[k]=S.vals[k].map(()=>1)});if(look&&look.lashes)S.vals.lashes=S.vals.lashes.map(()=>1);
  size();face(cls||'');drawCust();return true};
M.__mkDepth=()=>LEVELS.map((l,i)=>{const v=levelInfo(i+1),H2={wash:'rub',pack:'tap',lotion:'tap',blush:'tap',eyeshadow:'rub',mascara:'rub',lips:'rub',sparkle:'tap'};
  return{level:i+1,processes:v.steps.length,steps:v.steps,hands:[...new Set(v.steps.map(k=>H2[k]).concat(['card']))],someone:!!M.Alive,choice:v.steps.some(k=>['blush','eyeshadow','lips','sparkle'].includes(k)),ending:'mirror'}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)showLobby()})},
  exit:()=>{L.begin();gen++;H={};killTool();G.stop();fxEl.innerHTML='';lobbyAliveOff();if(al){al.detach();al=null}phase='';view='lobby'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* home tile picture: a drawn face with lipstick and blush (no emoji) */
document.querySelectorAll('.tile[data-go="makeup"] .ic,.tile[data-go="makeup2"] .ic').forEach(ic=>{
  ic.classList.add('mk-ic');ic.innerHTML=bust(CUST[0],{lips:{col:'pink'},blush:{col:'pink'}},{});const s=ic.querySelector('svg');if(s){s.style.width='1.6em';s.style.height='1.9em'}});
})();
