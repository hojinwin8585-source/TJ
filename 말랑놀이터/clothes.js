/* 말랑 옷 가게 (P8-가, '공주 왕자 옷 입기'를 다시) — 가게 안에서 친구를 골라 탈의실 앞에 세우고, 몸의 자리를 콕 하면 그 자리 옷 3벌이 옷걸이 봉을 타고 들어와요.
   사용 후기 "배경도 없고 종이 인형만도 못하다, 액세서리는 아케이드 게임 같다" →
   - 가게 배경(background): 커튼 달린 탈의실, 큰 전신 거울, 옷걸이 봉, 신발 선반, 창밖 풍경 (종이 공예 겹)
   - 새로 그린 전신 인형(dollArt): 머리·몸·팔·다리가 따로 움직이는 2.5등신, 속옷 차림에서 시작, 머리 모양·피부·머리색 3가지
   - 몸에 맞게 그린 옷(clothesArt): 주름과 명암, 치맛자락이 살랑(motion.secondary). 차분한 카드 색 → 입으면 또렷한 색
   - 콕 하거나 끌어 놓으면 커튼이 살짝 닫혔다 열리며 입혀짐(putOn) → 빙글. 벗기기는 끌어서 옷걸이로. 입은 옷을 콕 = 색 바꾸기
   - 거울을 눌러야 끝(ending): 테마 배경으로 바뀌고 인형이 걸어 나와 포즈 3가지 → 찰칵 → 사진첩
   - 액세서리는 인형이 실제로 걸치고 드는 물건으로 크게(accessoryStyle)
   숫자와 단계는 MLCFG.games.clothes(levels, themes, background, dollArt, clothesArt, rack, putOn, ending, accessoryStyle), motion, rules, shell, calm, wardrobe 에서 읽습니다.
   단계: ML.Progress.get('clothes').level. 예전 옷 입히기('dressup')는 그대로 둠. 그림은 모두 이 파일 안에서 직접 그림. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide)return;
const {say,sfx,tone,pick,shuffle,cap,games,actx,store}=M;
const {life,noise,SFX}=P;
const id='clothes',GID='clothes',L=life(id),OL=A.OL||'#5B3A29';
const S3=`stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},CL=(CF.games||{}).clothes||{},RULES=CF.rules||{},SHELL=CF.shell||{},VO=CF.voice||{},CALM=CF.calm||{},PAL=CALM.palette||{};
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BLOOM=(CALM.colorPolicy||{}).bloomMs||600;
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const COLORS=(CALM.choiceColors||[]).map(c=>({ko:c.ko,en:c.en,hex:c.hex,light:c.light,vivid:c.vivid}));
const colorOf=en=>COLORS.find(c=>c.en===en)||COLORS[0];
const LOG=[];
const praise=(ko,en)=>{const p=M.nextPraise?M.nextPraise():['잘했어!','Good job!'];return[ko?ko+' '+p[0]:p[0],en?en+' '+p[1]:p[1]]};
const iya=w=>w+(M.batchim&&M.batchim(w)?'이야':'야');
const SH='rgba(91,58,41,.14)',FOLD=`stroke="${OL}" stroke-opacity=".32" stroke-width="2" fill="none" stroke-linecap="round"`;

/* ---------- levels (games.clothes.levels: the "new" words, added up) ---------- */
const LEVELS=CL.levels&&CL.levels.length?CL.levels:[{level:1,new:'옷 2벌 중 하나'}];
function levelInfo(n){
  const f={level:n,options:2,slots:['top','bottom'],photo:false};
  LEVELS.slice(0,n).forEach(l=>{const t=l.new||'',m=t.match(/(\d+)\s*벌/);if(m)f.options=Math.min(3,+m[1]);
    if(/머리/.test(t)&&!f.slots.includes('head'))f.slots.push('head');
    if(/신발/.test(t)&&!f.slots.includes('feet'))f.slots.push('feet');
    if(/소품/.test(t)){['hand','neck'].forEach(k=>{if(!f.slots.includes(k))f.slots.push(k)})}
    if(/우리 집/.test(t))f.photo=true});
  return f;
}
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
const DATA=Object.assign({level:1,served:0,album:[]},store.get('mallang_clothes2',{}));if(!Array.isArray(DATA.album))DATA.album=[];
const save=()=>store.set('mallang_clothes2',DATA);
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LEVELS.length,n))}
if(PRG())PRG().register(GID,{max:LEVELS.length,name:'옷 가게',seg:'setClothesLv'});

/* ---------- themes (games.clothes.themes): the picture in the customer's bubble and the ending scene ---------- */
const THEME_DEF=[{id:'palace',re:/공주|왕자/,ko:'무도회',en:'the ball'},{id:'pajama',re:/잠옷/,ko:'잠잘 시간',en:'bedtime'},{id:'rain',re:/비/,ko:'비 오는 날',en:'a rainy day'},{id:'snow',re:/눈/,ko:'눈 오는 날',en:'a snowy day'},{id:'pool',re:/수영/,ko:'수영장',en:'the pool'}];
const THEMES=(CL.themes&&CL.themes.length?CL.themes:['공주·왕자','잠옷','비 오는 날','눈 오는 날','수영장']).map(t=>THEME_DEF.find(d=>d.re.test(t))).filter(Boolean);

/* ---------- dolls (dollArt: three hair styles, three skin and hair colours). Names are not in config ---------- */
const DOLLS=[
  {id:'mina',ko:'미나',en:'Mina',hair:'pigtails',hc:'#8A5634',hh:'#B07A52',skin:'#FFE6D6',shade:'#F3C7B1',eye:'#4E2E1E',iris:'#86573A',rib:'#E89AAE'},
  {id:'jun',ko:'준이',en:'Juni',hair:'short',hc:'#3D2B29',hh:'#6A4F4A',skin:'#F6D5B8',shade:'#E7B896',eye:'#3A2216',iris:'#6B4129',rib:'#8FC3E6'},
  {id:'sora',ko:'소라',en:'Sora',hair:'wavy',hc:'#B8682F',hh:'#DB955E',skin:'#DDA882',shade:'#C68C66',eye:'#43281A',iris:'#7A4A2A',rib:'#8FC48A'}
];
const dollOf=k=>DOLLS.find(d=>d.id===k)||DOLLS[0];

/* ============================== the doll (viewBox 0 0 240 400, 2.5 heads: head 22~160, feet ~362) ============================== */
const VBW=240,VBH=400;
const ARM={l:{s:[91,172],h:[73,238]},r:{s:[149,172],h:[167,238]}},HAND={l:[72,245],r:[168,245]};
const LEG={l:{s:[106,238],a:[104,344]},r:{s:[134,238],a:[136,344]}},FOOT={l:[99,352],r:[141,352]};
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const line=(p,q,w,c,ow)=>`<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" stroke="${OL}" stroke-width="${w+(ow||6)}" stroke-linecap="round"/><path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const FACE='M120 36C164 36 182 66 182 98C182 134 154 158 120 158C86 158 58 134 58 98C58 66 76 36 120 36Z';
const TORSO='M94 162Q120 156 146 162Q158 166 157 182L153 236Q120 244 87 236L83 182Q82 166 94 162Z';
const blobs=(cs,fill,sw=5)=>cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${OL}" stroke="${OL}" stroke-width="${sw}"/>`).join('')+cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
function hairBack(d){
  if(d.hair==='pigtails')return blobs([[50,104,20],[44,128,18],[44,150,15],[190,104,20],[196,128,18],[196,150,15]],d.hc)+`<path d="M62 120C52 70 84 28 120 28C156 28 188 70 178 120Z" fill="${d.hc}" ${S3}/>`
    +[[54,86],[186,86]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M0 0L-12 -8Q-15 0 -12 8Z" fill="${d.rib}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 0L12 -8Q15 0 12 8Z" fill="${d.rib}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><circle r="3.6" fill="#FFF3F6" stroke="${OL}" stroke-width="2"/></g>`).join('');
  if(d.hair==='wavy'){const cs=[];for(let i=0;i<=10;i++){const t=i/10;cs.push([54-6*Math.sin(t*9),100+t*120,16]);cs.push([186+6*Math.sin(t*9),100+t*120,16])}
    return blobs(cs,d.hc)+`<path d="M60 124C48 66 84 26 120 26C156 26 192 66 180 124Z" fill="${d.hc}" ${S3}/>`}
  return `<path d="M60 112C52 60 84 26 120 26C156 26 188 60 180 112Z" fill="${d.hc}" ${S3}/>`;
}
function hairFront(d){
  if(d.hair==='short')return `<path d="M58 104C52 56 84 30 120 30C156 30 188 56 182 104C176 88 168 78 160 72C152 82 136 80 128 68C118 82 98 84 88 72C78 80 66 90 58 104Z" fill="${d.hc}" ${S3}/><path d="M114 32Q110 18 120 12Q118 22 128 26" fill="${d.hc}" ${S3}/><path d="M86 46Q100 36 116 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if(d.hair==='wavy')return `<path d="M58 108C52 58 84 30 120 30C156 30 188 58 182 108C178 90 170 78 160 70C140 80 112 76 96 62C88 74 72 86 58 108Z" fill="${d.hc}" ${S3}/><path d="M92 44Q108 34 126 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/><g transform="translate(160 56) rotate(20)"><circle r="7" fill="${d.rib}" ${S3}/><circle r="2.6" fill="#FFF6C8"/></g>`;
  return `<path d="M58 106C52 58 84 30 120 30C156 30 188 58 182 106C178 92 170 82 162 76C154 84 140 82 132 72C124 84 108 84 100 72C92 82 72 88 58 106Z" fill="${d.hc}" ${S3}/><path d="M88 46Q102 36 118 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
function eyes(d,px){
  return ['l','r'].map(s=>{const ex=s==='l'?98:142,ey=106,k=s==='l'?-1:1;
    return `<g class="al-eye al-eye-${s} al-open"><g class="al-pupil"><ellipse cx="${ex}" cy="${ey}" rx="10" ry="12.5" fill="url(#${px}gi)" stroke="${OL}" stroke-width="2"/><circle cx="${ex-3.5}" cy="${ey-4.5}" r="4" fill="#fff"/><circle cx="${ex+3.6}" cy="${ey+5}" r="1.9" fill="#fff"/></g>
      <path d="M${ex-13} ${ey-5}Q${ex} ${ey-17} ${ex+13} ${ey-6}" stroke="${OL}" stroke-width="3.2" fill="none" stroke-linecap="round"/>${d.hair!=='short'?`<path d="M${ex+k*12} ${ey-8}l${k*5} -4" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`:''}</g>
      <path class="al-lid al-lid-${s}" opacity="0" d="M${ex-12} ${ey}Q${ex} ${ey+7} ${ex+12} ${ey}" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>`}).join('');
}
function head(d,px,wear){
  const ears=[58,182].map(x=>`<ellipse cx="${x}" cy="${112}" rx="8" ry="11" fill="${d.skin}" ${S3}/>`).join('');
  return `${hairBack(d)}${ears}<path d="${FACE}" fill="${d.skin}" ${S3}/>
    ${[88,152].map(x=>`<ellipse cx="${x}" cy="128" rx="11" ry="7" fill="#FF9AAE" opacity=".45"/>`).join('')}
    ${['l','r'].map(s=>{const ex=s==='l'?98:142;return `<path d="M${ex-10} 86Q${ex} 80 ${ex+10} 85" stroke="${d.hc}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`}).join('')}
    ${eyes(d,px)}<path d="M118 121Q120 123 122 121" stroke="${d.shade}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g class="al-mouth"><path d="M112 132Q120 140 128 132" stroke="${OL}" stroke-width="2.8" fill="#F08A96" stroke-linejoin="round" stroke-linecap="round"/></g>
    ${hairFront(d)}`;
}

/* ============================== clothes (clothesArt): each item returns pieces for the body parts, drawn to fit this body ============================== */
const sleeve=(s,t,c,w=21)=>{const a=ARM[s];return line(a.s,lerp(a.s,a.h,t),w,c,5)};
const cuff=(s,t,c)=>{const a=ARM[s],p=lerp(a.s,a.h,t),q=lerp(a.s,a.h,t-.08);return line(q,p,22,c,5)};
const puff=(s,c,l)=>{const [x,y]=ARM[s].s,k=s==='l'?-1:1;return `<ellipse cx="${x+k*3}" cy="${y+6}" rx="15" ry="13" fill="${c}" ${S3}/><path d="M${x+k*-6} ${y+2}q${k*6} 6 ${k*14} 6" ${FOLD}/><path d="M${x-6} ${y+16}q6 3 ${12} 0" stroke="${l}" stroke-width="3" fill="none" stroke-linecap="round"/>`};
const legPiece=(s,t0,t1,c,w=28)=>{const g=LEG[s];return line(lerp(g.s,g.a,t0),lerp(g.s,g.a,t1),w,c,5)};
const HIP='M84 226Q120 234 156 226L159 260Q140 268 122 263L120 256L118 263Q100 268 81 260Z';
const scallop=(x0,x1,y,n,dep)=>{let d='';const w=(x1-x0)/n;for(let i=0;i<n;i++){const a=x1-i*w,b=a-w;d+=`Q${(a+b)/2} ${y+dep} ${b} ${y}`}return d};
const star5=(x,y,r,f)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;d+=(i?'L':'M')+(x+q*Math.cos(a)).toFixed(1)+' '+(y+q*Math.sin(a)).toFixed(1)}return `<path d="${d}Z" fill="${f}"/>`};
const ITEMS={
  top:[
    {id:'gown',ko:'드레스',en:'ball gown',th:['palace'],cols:['pink','purple','sky blue'],dress:true,
      d:(c,l)=>({skirt:`<path d="M88 224Q120 232 152 224Q184 276 204 336${scallop(36,204,336,7,14).replace(/^/,'')}Q50 280 88 224Z" fill="${c}" ${S3}/>
        <path d="M44 322${scallop(44,196,322,6,10).replace(/Q/,'L196 322Q').slice(0,0)}" fill="none"/>
        <path d="M60 318Q120 336 180 318" stroke="${l}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M104 236Q96 290 82 330M136 236Q144 290 158 330M120 238V334" ${FOLD}/>
        <path d="M70 270Q64 300 56 324" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>${[[76,300],[150,280],[118,306],[170,318],[96,270]].map(([x,y])=>A.twinkle(x,y,4,'#fff')).join('')}`,
        torso:`<path d="M92 162Q120 156 148 162Q156 166 155 182L151 230Q120 238 89 230L85 182Q84 166 92 162Z" fill="${c}" ${S3}/><path d="M96 164Q120 178 144 164" stroke="${l}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M90 226Q120 236 150 226" stroke="${l}" stroke-width="6" fill="none" stroke-linecap="round"/><g transform="translate(120 227)"><path d="M0 0L-11 -7Q-14 0 -11 7Z" fill="${l}" stroke="${OL}" stroke-width="2"/><path d="M0 0L11 -7Q14 0 11 7Z" fill="${l}" stroke="${OL}" stroke-width="2"/><circle r="3.5" fill="${c}" stroke="${OL}" stroke-width="2"/></g>`,
        armL:puff('l',c,l),armR:puff('r',c,l)}),vb:'20 150 200 200'},
    {id:'blouse',ko:'블라우스',en:'blouse',th:['palace','rain'],cols:['sky blue','pink','yellow'],
      d:(c,l)=>({torso:`<path d="M90 160Q120 152 150 160Q162 165 160 184L157 244Q120 254 83 244L80 184Q78 165 90 160Z" fill="${c}" ${S3}/><path d="M104 196Q102 222 104 244M136 196Q138 222 136 244" ${FOLD}/>
        <path d="M120 162Q104 158 98 166Q100 180 118 176Z" fill="#FFFDF9" ${S3}/><path d="M120 162Q136 158 142 166Q140 180 122 176Z" fill="#FFFDF9" ${S3}/>${[190,208,226].map(y=>`<circle cx="120" cy="${y}" r="3" fill="${l}" stroke="${OL}" stroke-width="1.8"/>`).join('')}<path d="M86 236Q120 250 154 236" stroke="${l}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
        armL:puff('l',c,l),armR:puff('r',c,l)}),vb:'50 140 140 130'},
    {id:'prince',ko:'왕자 옷',en:'prince jacket',th:['palace'],cols:['blue','red','purple'],
      d:(c,l)=>({torso:`<path d="M90 160Q120 152 150 160Q162 165 160 184L160 252Q120 260 80 252L80 184Q78 165 90 160Z" fill="${c}" ${S3}/><path d="M120 162L108 186L120 250L132 186Z" fill="#FFFDF9" ${S3}/>
        <path d="M90 168L146 238" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M90 168L146 238" stroke="#F0D58A" stroke-width="9" stroke-linecap="round"/>${[196,214,232].map(y=>`<circle cx="104" cy="${y}" r="3.2" fill="#FFD86B" stroke="${OL}" stroke-width="1.8"/><circle cx="136" cy="${y}" r="3.2" fill="#FFD86B" stroke="${OL}" stroke-width="1.8"/>`).join('')}`,
        armL:sleeve('l',.86,c)+cuff('l',.9,'#F0D58A')+`<ellipse cx="88" cy="168" rx="13" ry="7" fill="#FFD86B" ${S3}/>`,armR:sleeve('r',.86,c)+cuff('r',.9,'#F0D58A')+`<ellipse cx="152" cy="168" rx="13" ry="7" fill="#FFD86B" ${S3}/>`}),vb:'50 140 140 130'},
    {id:'pajama',ko:'잠옷',en:'pajama top',th:['pajama'],cols:['sky blue','yellow','pink'],
      d:(c,l)=>({torso:`<path d="M90 160Q120 152 150 160Q164 165 162 184L160 250Q120 258 80 250L78 184Q76 165 90 160Z" fill="${c}" ${S3}/><path d="M120 166V250" stroke="${OL}" stroke-width="2" stroke-opacity=".5"/>${[184,204,224].map(y=>`<circle cx="124" cy="${y}" r="2.8" fill="#FFFDF9" stroke="${OL}" stroke-width="1.6"/>`).join('')}
        ${[[96,190],[144,200],[104,232],[140,236],[98,212]].map(([x,y])=>star5(x,y,5,l)).join('')}<path d="M104 160L120 174L136 160" fill="none" stroke="${l}" stroke-width="5" stroke-linecap="round"/>`,
        armL:sleeve('l',.9,c,23)+cuff('l',.92,l),armR:sleeve('r',.9,c,23)+cuff('r',.92,l)}),vb:'50 140 140 130'},
    {id:'raincoat',ko:'비옷',en:'raincoat',th:['rain'],cols:['yellow','red','mint'],
      d:(c,l)=>({back:`<path d="M66 108Q60 52 120 46Q180 52 174 108Q166 142 120 150Q74 142 66 108Z" fill="${c}" ${S3}/>`,
        torso:`<path d="M88 158Q120 150 152 158Q166 164 164 184L170 272Q120 282 70 272L76 184Q74 164 88 158Z" fill="${c}" ${S3}/><path d="M120 162V276" stroke="${OL}" stroke-width="2.4" stroke-opacity=".6"/>${[190,214,238].map(y=>`<rect x="112" y="${y}" width="16" height="6" rx="3" fill="${l}" stroke="${OL}" stroke-width="1.8"/>`).join('')}<path d="M96 200Q92 240 86 266M146 200Q150 240 156 266" ${FOLD}/><path d="M82 190Q80 230 78 260" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`,
        armL:sleeve('l',.92,c,24),armR:sleeve('r',.92,c,24)}),vb:'40 40 160 250'},
    {id:'sweater',ko:'털 스웨터',en:'sweater',th:['snow'],cols:['red','mint','purple'],
      d:(c,l)=>({torso:`<path d="M90 160Q120 152 150 160Q164 165 162 184L158 246Q120 254 82 246L78 184Q76 165 90 160Z" fill="${c}" ${S3}/><path d="M104 156Q120 166 136 156V168Q120 176 104 168Z" fill="${c}" ${S3}/>
        <path d="M80 200L90 192L100 200L110 192L120 200L130 192L140 200L150 192L160 200" stroke="${l}" stroke-width="5" fill="none" stroke-linejoin="round"/>${[92,104,116,128,140,152].map(x=>`<path d="M${x} 238V250" stroke="${OL}" stroke-opacity=".35" stroke-width="2"/>`).join('')}`,
        armL:sleeve('l',.9,c,23)+cuff('l',.92,l),armR:sleeve('r',.9,c,23)+cuff('r',.92,l)}),vb:'50 140 140 130'},
    {id:'tee',ko:'줄무늬 티',en:'striped tee',th:['pool','rain'],cols:['mint','orange','sky blue'],
      d:(c,l)=>({torso:`<path d="M90 160Q120 152 150 160Q162 165 160 184L157 244Q120 252 83 244L80 184Q78 165 90 160Z" fill="#FFFDF9" ${S3}/>${[182,200,218,236].map(y=>`<path d="M${81} ${y}Q120 ${y+6} 159 ${y}" stroke="${c}" stroke-width="7" fill="none"/>`).join('')}<path d="M90 160Q120 152 150 160Q162 165 160 184L157 244Q120 252 83 244L80 184Q78 165 90 160Z" fill="none" ${S3}/><path d="M106 160Q120 170 134 160" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
        armL:sleeve('l',.34,'#FFFDF9',24)+cuff('l',.36,c),armR:sleeve('r',.34,'#FFFDF9',24)+cuff('r',.36,c)}),vb:'50 140 140 130'},
    {id:'swimsuit',ko:'수영복',en:'swimsuit',th:['pool'],cols:['pink','mint','orange'],dress:true,
      d:(c,l)=>({torso:`<path d="M96 168Q120 176 144 168L152 236Q156 254 142 262L122 266Q120 258 118 266L98 262Q84 254 88 236Z" fill="${c}" ${S3}/><path d="M100 168L104 160M140 168L136 160" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M100 168L104 160M140 168L136 160" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M86 240Q120 252 154 240L160 262${scallop(80,160,262,5,8)}Z" fill="${l}" ${S3}/>${[[108,196],[132,210],[116,226]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="${l}"/>`).join('')}`}),vb:'60 150 120 130'}
  ],
  bottom:[
    {id:'tutu',ko:'발레 치마',en:'tutu',th:['palace'],cols:['pink','purple','sky blue'],
      d:(c,l)=>({skirt:`<path d="M86 228Q120 236 154 228Q178 252 186 278${scallop(54,186,278,6,10)}Q62 252 86 228Z" fill="${l}" ${S3}/><path d="M86 228Q120 236 154 228Q170 248 174 268${scallop(66,174,268,5,9)}Q70 248 86 228Z" fill="${c}" ${S3}/><path d="M86 228Q120 238 154 228" stroke="${OL}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M86 228Q120 238 154 228" stroke="${l}" stroke-width="3.5" stroke-linecap="round" fill="none"/>${[[90,256],[150,254],[120,262]].map(([x,y])=>A.twinkle(x,y,3.5,'#fff')).join('')}`}),vb:'40 210 160 100'},
    {id:'skirt',ko:'주름 치마',en:'pleated skirt',th:['rain','palace'],cols:['red','purple','blue'],
      d:(c,l)=>({skirt:`<path d="M86 226Q120 234 154 226L172 290Q120 302 68 290Z" fill="${c}" ${S3}/>${[96,108,120,132,144].map((x,i)=>`<path d="M${x} ${230+Math.abs(i-2)} L${x+(x-120)*.35} 294" ${FOLD}/>`).join('')}<path d="M86 228Q120 236 154 228" stroke="${l}" stroke-width="4" fill="none"/><path d="M76 280Q120 292 164 280" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`}),vb:'50 210 140 100'},
    {id:'pants',ko:'바지',en:'trousers',th:['snow','rain','palace'],cols:['blue','green','purple'],
      d:(c,l)=>({hip:`<path d="${HIP}" fill="${c}" ${S3}/><path d="M86 232Q120 240 154 232" stroke="${l}" stroke-width="4" fill="none"/>`,legL:legPiece('l',.05,.92,c,28)+`<path d="M104 270V330" ${FOLD}/>`,legR:legPiece('r',.05,.92,c,28)+`<path d="M136 270V330" ${FOLD}/>`}),vb:'60 210 120 160'},
    {id:'pjpants',ko:'잠옷 바지',en:'pajama pants',th:['pajama'],cols:['sky blue','yellow','pink'],
      d:(c,l)=>({hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.9,c,30)+legPiece('l',.84,.92,l,30)+star5(102,290,5,l)+star5(108,316,4,l),legR:legPiece('r',.05,.9,c,30)+legPiece('r',.84,.92,l,30)+star5(138,300,5,l)+star5(134,326,4,l)}),vb:'60 210 120 160'},
    {id:'shorts',ko:'반바지',en:'shorts',th:['pool'],cols:['orange','mint','yellow'],
      d:(c,l)=>({hip:`<path d="${HIP}" fill="${c}" ${S3}/><path d="M86 232Q120 240 154 232" stroke="${l}" stroke-width="4" fill="none"/>`,legL:legPiece('l',.05,.36,c,32)+legPiece('l',.3,.36,l,32),legR:legPiece('r',.05,.36,c,32)+legPiece('r',.3,.36,l,32)}),vb:'60 210 120 100'}
  ],
  feet:[
    {id:'maryjane',ko:'구두',en:'shoes',th:['palace'],cols:['red','pink','purple'],d:(c,l)=>({footL:shoe('l',c,l,'mj'),footR:shoe('r',c,l,'mj')}),vb:'70 318 100 50'},
    {id:'rainboots',ko:'장화',en:'rain boots',th:['rain'],cols:['yellow','red','green'],d:(c,l)=>({footL:shoe('l',c,l,'boot'),footR:shoe('r',c,l,'boot')}),vb:'70 300 100 68'},
    {id:'snowboots',ko:'털 부츠',en:'snow boots',th:['snow'],cols:['orange','purple','sky blue'],d:(c,l)=>({footL:shoe('l',c,l,'snow'),footR:shoe('r',c,l,'snow')}),vb:'70 300 100 68'},
    {id:'slippers',ko:'토끼 슬리퍼',en:'bunny slippers',th:['pajama'],cols:['pink','yellow','sky blue'],d:(c,l)=>({footL:shoe('l',c,l,'bunny'),footR:shoe('r',c,l,'bunny')}),vb:'70 318 100 50'},
    {id:'sandals',ko:'샌들',en:'sandals',th:['pool'],cols:['mint','orange','pink'],d:(c,l)=>({footL:shoe('l',c,l,'sandal'),footR:shoe('r',c,l,'sandal')}),vb:'70 326 100 42'},
    {id:'sneakers',ko:'운동화',en:'sneakers',th:['rain','pool','snow'],cols:['blue','green','red'],d:(c,l)=>({footL:shoe('l',c,l,'sneak'),footR:shoe('r',c,l,'sneak')}),vb:'70 318 100 50'}
  ],
  head:[
    {id:'crown',ko:'왕관',en:'crown',th:['palace'],cols:['pink','sky blue','purple'],d:(c,l)=>({hat:`<g transform="translate(120 34)"><path d="M-40 10Q0 -2 40 10L36 -18L18 -4L8 -30L0 -8L-8 -30L-18 -4L-36 -18Z" fill="#FFD86B" ${S3}/><circle cy="0" r="5.5" fill="${c}" ${S3}/><circle cx="-8" cy="-30" r="3.6" fill="#fff" ${S3}/><circle cx="8" cy="-30" r="3.6" fill="#fff" ${S3}/><path d="M-26 0Q-20 -3 -14 -2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`}),vb:'70 -6 100 60'},
    {id:'bow',ko:'리본 머리띠',en:'bow headband',th:['palace','pool'],cols:['red','pink','yellow'],d:(c,l)=>({hat:`<path d="M62 92Q60 40 120 36Q180 40 178 92" fill="none" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M62 92Q60 40 120 36Q180 40 178 92" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><g transform="translate(150 44) rotate(18)"><path d="M0 0L-24 -16Q-31 0 -24 16Z" fill="${c}" ${S3}/><path d="M0 0L24 -16Q31 0 24 16Z" fill="${c}" ${S3}/><circle r="7" fill="${l}" ${S3}/></g>`}),vb:'50 10 140 90'},
    {id:'rainhat',ko:'비 모자',en:'rain hat',th:['rain'],cols:['yellow','red','mint'],d:(c,l)=>({hat:`<path d="M48 76Q60 16 120 14Q180 16 192 76Q168 66 120 66Q72 66 48 76Z" fill="${c}" ${S3}/><path d="M44 80Q120 58 196 80Q206 92 196 96Q120 76 44 96Q34 92 44 80Z" fill="${c}" ${S3}/><path d="M80 34Q96 22 116 20" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`}),vb:'30 0 180 110'},
    {id:'beanie',ko:'털모자',en:'beanie',th:['snow'],cols:['red','mint','purple'],d:(c,l)=>({hat:`<path d="M58 74Q56 22 120 20Q184 22 182 74Z" fill="${c}" ${S3}/><rect x="54" y="66" width="132" height="18" rx="9" fill="${l}" ${S3}/>${[70,86,102,118,134,150,166].map(x=>`<path d="M${x} 68V82" stroke="${OL}" stroke-opacity=".3" stroke-width="2"/>`).join('')}${blobs([[120,16,12]],'#FFFDF9',4)}<path d="M80 50L90 42L100 50L110 42L120 50L130 42L140 50L150 42L160 50" stroke="${l}" stroke-width="4" fill="none" stroke-linejoin="round"/>`}),vb:'40 -2 160 96'},
    {id:'nightcap',ko:'잠옷 모자',en:'night cap',th:['pajama'],cols:['sky blue','yellow','purple'],d:(c,l)=>({hat:`<path d="M60 76Q58 26 120 22Q170 22 196 60Q206 82 214 96" fill="${c}" ${S3}/><path d="M60 76Q58 26 120 22Q170 22 196 60Q206 82 214 96L182 72Z" fill="${c}"/><rect x="56" y="66" width="128" height="16" rx="8" fill="#FFFDF9" ${S3}/>${star5(104,44,6,l)}${star5(150,40,5,l)}${blobs([[214,100,11]],'#FFFDF9',4)}`}),vb:'44 6 186 110'},
    {id:'sunhat',ko:'밀짚모자',en:'sun hat',th:['pool'],cols:['pink','orange','sky blue'],d:(c,l)=>({hat:`<ellipse cx="120" cy="66" rx="84" ry="18" fill="#F3DCA6" ${S3}/><path d="M74 66Q72 20 120 18Q168 20 166 66Z" fill="#F3DCA6" ${S3}/><path d="M74 54Q120 66 166 54L166 64Q120 76 74 64Z" fill="${c}" ${S3}/><g transform="translate(152 58)">${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${(6*Math.cos(a)).toFixed(1)}" cy="${(6*Math.sin(a)).toFixed(1)}" r="5" fill="${l}" stroke="${OL}" stroke-width="1.8"/>`}).join('')}<circle r="3.4" fill="#FFE27A"/></g>`}),vb:'30 0 180 96'}
  ],
  neck:[
    {id:'necklace',ko:'진주 목걸이',en:'pearl necklace',th:['palace'],cols:['pink','purple','sky blue'],d:(c,l)=>({neck:`${[-22,-15,-8,0,8,15,22].map(x=>{const y=166+12*(1-Math.pow(x/24,2));return `<circle cx="${120+x}" cy="${y.toFixed(1)}" r="3.6" fill="#FFFDF9" stroke="${OL}" stroke-width="1.6"/>`}).join('')}<path d="M120 182C110 176 111 168 116 168C118 168 119 170 120 171C121 170 122 168 124 168C129 168 130 176 120 182Z" fill="${c}" stroke="${OL}" stroke-width="2" stroke-linejoin="round" transform="translate(0 4)"/>`}),vb:'86 150 68 50'},
    {id:'bowtie',ko:'나비넥타이',en:'bow tie',th:['palace'],cols:['red','blue','purple'],d:(c,l)=>({neck:`<g transform="translate(120 168)"><path d="M0 0L-16 -9Q-19 0 -16 9Z" fill="${c}" ${S3}/><path d="M0 0L16 -9Q19 0 16 9Z" fill="${c}" ${S3}/><rect x="-5" y="-5" width="10" height="10" rx="3.5" fill="${l}" ${S3}/></g>`}),vb:'92 148 56 40'},
    {id:'scarf',ko:'목도리',en:'scarf',th:['snow'],cols:['red','yellow','mint'],d:(c,l)=>({neck:`<path d="M92 160Q120 178 148 160L150 172Q120 192 90 172Z" fill="${c}" ${S3}/><path d="M128 176L140 222L124 224L118 180Z" fill="${c}" ${S3}/>${[100,112,124,136].map(x=>`<path d="M${x} 168l2 10" stroke="${l}" stroke-width="4" stroke-linecap="round"/>`).join('')}<path d="M126 222l-2 6M132 221l0 7M138 220l2 6" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`}),vb:'80 148 80 86'},
    {id:'lei',ko:'꽃목걸이',en:'flower lei',th:['pool'],cols:['pink','orange','yellow'],d:(c,l)=>({neck:[-24,-14,-4,6,16,26].map((x,i)=>{const y=166+14*(1-Math.pow(x/26,2));return `<g transform="translate(${120+x} ${y.toFixed(1)})">${[0,1,2,3,4].map(j=>{const a=-Math.PI/2+j*Math.PI*2/5;return `<circle cx="${(4.5*Math.cos(a)).toFixed(1)}" cy="${(4.5*Math.sin(a)).toFixed(1)}" r="4" fill="${i%2?l:c}" stroke="${OL}" stroke-width="1.5"/>`}).join('')}<circle r="2.4" fill="#FFE27A"/></g>`}).join('')}),vb:'86 150 68 46'}
  ],
  hand:[
    {id:'wand',ko:'요술봉',en:'magic wand',th:['palace'],cols:['pink','purple','yellow'],d:(c,l)=>({handR:`<path d="M168 246L196 168" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M168 246L196 168" stroke="${l}" stroke-width="4" stroke-linecap="round"/>${A.star(198,160,18,c,`stroke="${OL}" stroke-width="3" stroke-linejoin="round"`)}<circle cx="193" cy="155" r="3.5" fill="#fff" opacity=".9"/>${A.twinkle(222,142,6,'#FFE27A')}`}),vb:'150 130 90 130'},
    {id:'umbrella',ko:'우산',en:'umbrella',th:['rain'],cols:['red','sky blue','yellow'],d:(c,l)=>({handR:`<path d="M168 246L196 40" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><path d="M168 246L196 40" stroke="#C8CDD6" stroke-width="3" stroke-linecap="round"/><path d="M168 246Q160 258 152 250" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M120 44Q130 -6 198 -6Q266 -6 276 44Q262 34 248 44Q236 32 222 42Q210 30 198 42Q186 30 174 42Q160 32 148 44Q134 34 120 44Z" fill="${c}" ${S3}/><path d="M198 -6Q186 18 174 42M198 -6Q210 18 222 42M198 -6V42" ${FOLD}/><path d="M140 22Q156 4 182 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/><circle cx="198" cy="-8" r="4" fill="${l}" ${S3}/>`}),vb:'110 -18 176 276'},
    {id:'teddy',ko:'곰 인형',en:'teddy bear',th:['pajama'],cols:['orange','pink','yellow'],d:(c,l)=>({handR:`<g transform="translate(184 254)"><circle cx="-12" cy="-30" r="7" fill="${c}" ${S3}/><circle cx="12" cy="-30" r="7" fill="${c}" ${S3}/><ellipse cy="6" rx="18" ry="20" fill="${c}" ${S3}/><circle cy="-18" r="17" fill="${c}" ${S3}/><ellipse cy="-13" rx="7" ry="5" fill="${l}"/><circle cx="-6" cy="-21" r="2.2" fill="${OL}"/><circle cx="6" cy="-21" r="2.2" fill="${OL}"/><circle cy="-15" r="2" fill="${OL}"/><ellipse cy="8" rx="9" ry="10" fill="${l}"/></g>`}),vb:'150 210 70 76'},
    {id:'bag',ko:'가방',en:'handbag',th:['palace','rain'],cols:['purple','red','pink'],d:(c,l)=>({handR:`<path d="M156 256Q156 236 170 236Q184 236 184 256" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M150 256H190L186 290Q170 296 154 290Z" fill="${c}" ${S3}/><path d="M152 266Q170 272 188 266" stroke="${l}" stroke-width="4" fill="none"/><circle cx="170" cy="268" r="3.5" fill="#FFD86B" stroke="${OL}" stroke-width="1.8"/>`}),vb:'140 226 60 76'},
    {id:'ring',ko:'튜브',en:'swim ring',th:['pool'],cols:['orange','pink','mint'],d:(c,l)=>({front:`<ellipse cx="120" cy="246" rx="58" ry="20" fill="${c}" ${S3}/><path d="M66 244Q120 268 174 244" stroke="#fff" stroke-width="7" fill="none" stroke-dasharray="14 18" stroke-linecap="round"/><path d="M86 240Q120 252 154 240" fill="none" stroke="${OL}" stroke-width="2.4" stroke-opacity=".5"/>`}),vb:'56 220 128 56'}
  ]
};
function shoe(s,c,l,kind){
  const [x,y]=FOOT[s],k=s==='l'?-1:1;
  const base=`<path d="M${x-15} ${y+2}Q${x-16} ${y-10} ${x} ${y-10}Q${x+16} ${y-10} ${x+15} ${y+2}Q${x+16} ${y+9} ${x} ${y+9}Q${x-16} ${y+9} ${x-15} ${y+2}Z"`;
  if(kind==='mj')return `${base} fill="${c}" ${S3}/><path d="M${x-10} ${y-6}H${x+10}" stroke="${OL}" stroke-width="3.6" stroke-linecap="round"/><circle cx="${x+k*8}" cy="${y-6}" r="2.4" fill="#FFD86B" stroke="${OL}" stroke-width="1.4"/><path d="M${x-9} ${y+2}Q${x} ${y+5} ${x+8} ${y+1}" stroke="#fff" stroke-width="2.2" fill="none" opacity=".6"/>`;
  if(kind==='boot'||kind==='snow'){const top=kind==='snow'?324:316;return `<path d="M${x-12} ${top}H${x+12}L${x+13} ${y-6}Q${x+18} ${y} ${x+16} ${y+6}Q${x} ${y+12} ${x-16} ${y+6}Q${x-17} ${y-2} ${x-12} ${y-8}Z" fill="${c}" ${S3}/><path d="M${x-15} ${y+5}Q${x} ${y+10} ${x+15} ${y+5}" stroke="${OL}" stroke-width="4" fill="none"/><path d="M${x-7} ${top+6}V${y-10}" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`+(kind==='snow'?blobs([[x-10,top,6],[x,top-1,6],[x+10,top,6]],'#FFFDF9',3.5):`<path d="M${x-12} ${top+3}H${x+12}" stroke="${l}" stroke-width="4"/>`)}
  if(kind==='bunny')return `${base} fill="${c}" ${S3}/><ellipse cx="${x-6}" cy="${y-16}" rx="3.6" ry="9" fill="${c}" ${S3}/><ellipse cx="${x+6}" cy="${y-16}" rx="3.6" ry="9" fill="${c}" ${S3}/><ellipse cx="${x-6}" cy="${y-16}" rx="1.6" ry="5" fill="${l}"/><ellipse cx="${x+6}" cy="${y-16}" rx="1.6" ry="5" fill="${l}"/><circle cx="${x-4}" cy="${y-3}" r="1.6" fill="${OL}"/><circle cx="${x+4}" cy="${y-3}" r="1.6" fill="${OL}"/><circle cx="${x}" cy="${y+1}" r="1.6" fill="#FF8FB1"/>`;
  if(kind==='sandal')return `<path d="M${x-15} ${y+5}Q${x} ${y+12} ${x+15} ${y+5}" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x-15} ${y+5}Q${x} ${y+12} ${x+15} ${y+5}" stroke="${l}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M${x-11} ${y-4}Q${x} ${y-12} ${x+11} ${y-4}" stroke="${OL}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M${x-11} ${y-4}Q${x} ${y-12} ${x+11} ${y-4}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y-8}" r="3.4" fill="#FFE27A" stroke="${OL}" stroke-width="1.5"/>`;
  return `${base} fill="${c}" ${S3}/><path d="M${x-15} ${y+4}Q${x} ${y+9} ${x+15} ${y+4}" stroke="#FFFDF9" stroke-width="4" fill="none"/><path d="M${x-6} ${y-8}l8 4M${x-2} ${y-9}l8 4" stroke="#FFFDF9" stroke-width="2.4" stroke-linecap="round"/>`;
}
const SLOTS=['top','bottom','feet','head','neck','hand'];
const itemOf=(slot,iid)=>(ITEMS[slot]||[]).find(x=>x.id===iid)||null;
/* photos from the closet (level 4 "우리 집 옷"): wardrobe categories → body places */
const WCATS=((CF.wardrobe||{}).categories)||[];
const CAT_SLOT={dress:'top',shoes:'feet',headband:'head',neck:'neck',bag:'hand',toy:'hand'};
const PHOTO_BOX={top:[64,150,112,130],feet:[76,326,88,44],head:[56,8,128,70],neck:[90,150,60,44],hand:[150,214,62,70]};
function photoItems(){
  const list=store.get('mallang_closet',[]);if(!Array.isArray(list))return[];
  return list.map((c,k)=>{if(!c||!c.img)return null;const cat=WCATS.find(w=>w.id===c.cat||w.ko===c.cat||w.id===c.category||w.ko===c.category);const slot=cat&&CAT_SLOT[cat.id];if(!slot)return null;
    const b=PHOTO_BOX[slot];return{id:'photo:'+(c.id||k),slot,photo:c.img,ko:c.name||cat.ko,en:c.en||cat.en,cols:['pink'],th:[],vb:b.join(' '),
      d:()=>({photo:`<image href="${c.img}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" preserveAspectRatio="xMidYMid meet"/>`})}}).filter(Boolean);
}
const findItem=(slot,iid)=>itemOf(slot,iid)||(String(iid).startsWith('photo:')?photoItems().find(p=>p.id===iid):null);

/* pieces of everything worn, each in its colour (vivid on the doll, calm on cards) */
function pieces(wear,vivid,skip){
  const out={back:'',legL:'',legR:'',footL:'',footR:'',hip:'',skirt:'',torso:'',neck:'',front:'',armL:'',armR:'',handR:'',hat:'',photo:''};
  ['bottom','top','feet','neck','hand','head'].forEach(slot=>{const w=wear[slot];if(!w||skip===slot)return;if(slot==='bottom'&&wear.top&&(findItem('top',wear.top.id)||{}).dress)return;
    const it=findItem(slot,w.id);if(!it)return;const c=colorOf(w.col),pc=it.d(vivid?c.vivid:c.hex,c.light);
    Object.keys(pc).forEach(k=>{out[k]+=`<g data-slot="${slot}">${pc[k]}</g>`})});
  return out;
}
/* the whole doll. Body parts are separate groups (head / torso / arms / legs) so they move on their own and the clothes move with them */
function doll(d,wear={},o={}){
  const px='cl'+(++UID)+'_',p=pieces(wear,o.vivid!==false,o.skip);
  const legs=['l','r'].map(s=>{const g=LEG[s],K=s.toUpperCase();return `<g class="cl-leg cl-leg-${s}">${line(g.s,g.a,18,d.skin,6)}<ellipse cx="${FOOT[s][0]}" cy="${FOOT[s][1]}" rx="12" ry="7" fill="${d.skin}" ${S3}/>${p['leg'+K]}${p['foot'+K]}</g>`}).join('');
  const arms=['l','r'].map(s=>{const a=ARM[s],K=s.toUpperCase();return `<g class="al-arm al-arm-${s} cl-arm"><g class="al-arm-s">${line(a.s,a.h,14,d.skin,6)}<circle cx="${HAND[s][0]}" cy="${HAND[s][1]}" r="9" fill="${d.skin}" ${S3}/>${p['arm'+K]}${s==='r'?p.handR:''}</g></g>`}).join('');
  const under=`<path d="M96 166Q120 172 144 166L150 230Q120 238 90 230Z" fill="#FFF8F0" ${S3}/><path d="M104 166L106 160M136 166L134 160" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M104 166L106 160M136 166L134 160" stroke="#FFF8F0" stroke-width="2" stroke-linecap="round"/><path d="M112 176Q120 182 128 176" stroke="#F6D3DB" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M86 228Q120 236 154 228L157 254Q140 260 122 256L120 250L118 256Q100 260 83 254Z" fill="#FFF8F0" ${S3}/><path d="M86 250Q100 256 116 252M124 252Q140 256 154 250" stroke="#F6D3DB" stroke-width="3" fill="none"/>`;
  return `<svg viewBox="0 0 ${VBW} ${VBH}" style="overflow:visible"><defs><radialGradient id="${px}gi" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${d.iris}"/><stop offset="1" stop-color="${d.eye}"/></radialGradient></defs>
    <ellipse cx="120" cy="366" rx="58" ry="9" fill="rgba(91,58,41,.16)"/>
    <g class="al-root" style="transform-origin:50% 92%"><g class="al-breathe" style="transform-origin:50% 92%">
    <g class="cl-back">${p.back}</g>${legs}
    <g class="cl-torso"><path d="M111 148H129V168H111Z" fill="${d.skin}" ${S3}/>${line([120,166],[120,172],0,d.skin,0)}<path d="${TORSO}" fill="${d.skin}" ${S3}/>${under}${p.hip}<g class="cl-sway">${p.skirt}</g>${p.torso}${p.neck}${p.front}</g>
    ${arms}<g class="al-head" style="transform-origin:50% 40%"><g class="al-head-s" style="transform-origin:50% 40%"><g class="cl-head">${head(d,px,wear)}${p.hat}</g></g></g>${p.photo}
    </g></g></svg>`;
}
let UID=0;
/* a card picture: just the item (calm colours), cropped to its own box */
function cardSVG(slot,it,col){const c=colorOf(col),pc=it.d(c.hex,c.light);const order=['back','legL','legR','footL','footR','hip','skirt','torso','neck','front','armL','armR','handR','hat','photo'];
  return `<svg viewBox="${it.vb||'0 0 240 400'}" preserveAspectRatio="xMidYMid meet" style="overflow:visible">${order.map(k=>pc[k]||'').join('')}</svg>`}

/* ============================== backgrounds (종이 공예 겹, calm) ============================== */
const PF='filter="url(#clPaper)"';
const PAPER_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="clPaper" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".2"/></filter></defs></svg>`;
const hanger=(x,y,c)=>`<path d="M${x} ${y}q0 -8 6 -8" stroke="#B9A48C" stroke-width="2.4" fill="none"/><path d="M${x-14} ${y+8}L${x} ${y}L${x+14} ${y+8}" stroke="#B9A48C" stroke-width="2.4" fill="none"/><path d="M${x-14} ${y+8}Q${x-18} ${y+40} ${x-12} ${y+52}H${x+12}Q${x+18} ${y+40} ${x+14} ${y+8}Q${x} ${y+16} ${x-14} ${y+8}Z" fill="${c}"/>`;
const SHOP_BG=`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="520" fill="#F4E9DE"/>${Array.from({length:10},(_,i)=>`<rect x="${i*44-4}" y="0" width="18" height="400" fill="#F0E2D4"/>`).join('')}
  <g id="bg-window"><g ${PF}><rect x="18" y="40" width="104" height="118" rx="52" fill="#D9BFA6"/></g><g ${PF}><rect x="26" y="48" width="88" height="102" rx="44" fill="#D8EBF2"/></g>
    <circle cx="90" cy="76" r="12" fill="#F7E8B8"/><g ${PF}><path d="M26 130Q50 110 74 124Q96 108 114 126V150H26Z" fill="#B5D6AC"/></g><g ${PF}><circle cx="48" cy="118" r="14" fill="#A9CFA0"/><rect x="45" y="126" width="6" height="16" fill="#C9A98A"/></g><rect x="68" y="48" width="4" height="102" fill="#D9BFA6"/></g>
  <g id="bg-curtain"><g ${PF}><rect x="112" y="18" width="176" height="10" rx="5" fill="#C9A98A"/></g><g ${PF}><rect x="122" y="26" width="156" height="370" fill="#EFE0EC"/></g>
    <g ${PF}><path d="M118 26H160Q150 120 168 200Q140 230 150 396H118Z" fill="#D9A3B8"/></g><g ${PF}><path d="M282 26H240Q250 120 232 200Q260 230 250 396H282Z" fill="#D9A3B8"/></g>
    <path d="M128 30Q134 110 140 180M150 30Q148 100 156 190M272 30Q266 110 260 180M250 30Q252 100 244 190" stroke="#C88EA6" stroke-width="3" fill="none" opacity=".7"/>
    <g ${PF}><rect x="140" y="194" width="30" height="10" rx="5" fill="#F0D58A"/><rect x="230" y="194" width="30" height="10" rx="5" fill="#F0D58A"/></g></g>
  <g id="bg-mirror"><g ${PF}><rect x="314" y="60" width="78" height="300" rx="39" fill="#E3BE98"/></g><g ${PF}><rect x="322" y="68" width="62" height="284" rx="31" fill="#E6F1F4"/></g><path d="M334 110L364 80V100L334 150Z" fill="#fff" opacity=".55"/><g ${PF}><rect x="320" y="360" width="10" height="34" rx="4" fill="#C9A98A"/><rect x="376" y="360" width="10" height="34" rx="4" fill="#C9A98A"/></g></g>
  <g id="bg-rack"><g ${PF}><rect x="10" y="190" width="100" height="7" rx="3.5" fill="#B9A48C"/><rect x="14" y="196" width="6" height="200" rx="3" fill="#B9A48C"/><rect x="100" y="196" width="6" height="200" rx="3" fill="#B9A48C"/></g>
    <g ${PF}>${hanger(30,198,'#E8B4C0')}${hanger(58,198,'#CFE5F4')}${hanger(86,198,'#F7E8B8')}</g></g>
  <g ${PF}><rect x="0" y="396" width="400" height="124" fill="#E7D3BF"/></g><path d="M0 396H400" stroke="#DCC2A8" stroke-width="6"/>
  <g id="bg-shoes"><g ${PF}><rect x="8" y="330" width="100" height="10" rx="4" fill="#C9A98A"/><rect x="8" y="378" width="100" height="10" rx="4" fill="#C9A98A"/></g>
    <g ${PF}><path d="M18 330Q18 316 32 316H40Q46 316 46 330Z" fill="#E8A0AE"/><path d="M56 330Q56 312 66 312H72V330Z" fill="#F0D58A"/><path d="M80 330Q80 318 92 318H100V330Z" fill="#A7CFE8"/><path d="M22 378Q22 364 36 364H46V378Z" fill="#B8D9AF"/><path d="M62 378Q62 362 76 362H86Q90 362 90 378Z" fill="#D3C2EB"/></g></g>
  <g ${PF}><ellipse cx="200" cy="470" rx="150" ry="22" fill="#EAC7B4"/></g></svg>`;
/* the ending scenes (ending: palace ballroom, bedroom, rainy street, snowy village, pool) */
const SCENE={
  palace:`<rect width="400" height="520" fill="#F1E3F0"/>${[60,200,340].map(x=>`<g ${PF}><path d="M${x-40} 300V120Q${x-40} 70 ${x} 70Q${x+40} 70 ${x+40} 120V300Z" fill="#E2CDE8"/></g><path d="M${x-30} 300V124Q${x-30} 82 ${x} 82Q${x+30} 82 ${x+30} 124V300Z" fill="#DCEBF3"/><circle cx="${x+14}" cy="110" r="8" fill="#F7E8B8"/>`).join('')}
    <g ${PF}><path d="M150 30H250L238 50H162Z" fill="#F0D58A"/></g>${[160,180,200,220,240].map(x=>`<circle cx="${x}" cy="58" r="5" fill="#FFF3C8"/><circle cx="${x}" cy="58" r="10" fill="#FFF3C8" opacity=".35"/>`).join('')}
    <g ${PF}><rect y="300" width="400" height="220" fill="#EBD9C9"/></g>${Array.from({length:8},(_,i)=>Array.from({length:4},(_,j)=>(i+j)%2?`<rect x="${i*50}" y="${300+j*55}" width="50" height="55" fill="#E2CDB9"/>`:'').join('')).join('')}
    <g ${PF}><path d="M150 520L176 300H224L250 520Z" fill="#D98A9A"/></g><path d="M160 520L182 300M240 520L218 300" stroke="#F0D58A" stroke-width="4"/>`,
  pajama:`<rect width="400" height="520" fill="#E3E4F3"/><g ${PF}><rect x="40" y="40" width="130" height="140" rx="16" fill="#C9A98A"/></g><g ${PF}><rect x="50" y="50" width="110" height="120" rx="10" fill="#4F5B8C"/></g><circle cx="122" cy="88" r="16" fill="#F7E8B8"/><circle cx="130" cy="82" r="14" fill="#4F5B8C"/>${[[70,70],[90,130],[146,140],[70,150],[110,60]].map(([x,y])=>A.twinkle(x,y,4,'#F7E8B8')).join('')}
    <g ${PF}><rect x="240" y="200" width="150" height="70" rx="18" fill="#C9A98A"/></g><g ${PF}><rect x="230" y="250" width="170" height="80" rx="16" fill="#CFE5F4"/></g><g ${PF}><ellipse cx="290" cy="248" rx="40" ry="18" fill="#FFFDF9"/></g>
    <g ${PF}><rect x="20" y="230" width="60" height="80" rx="10" fill="#D9BFA6"/></g><g ${PF}><path d="M30 230L50 190L70 230Z" fill="#F7E8B8"/></g><circle cx="50" cy="222" r="26" fill="#FFF3C8" opacity=".35"/>
    <g ${PF}><rect y="330" width="400" height="190" fill="#D9CBE0"/></g><g ${PF}><ellipse cx="200" cy="440" rx="160" ry="40" fill="#F2D6E1"/></g>`,
  rain:`<rect width="400" height="520" fill="#DCE6EE"/>${[[70,70],[220,50],[330,90]].map(([x,y])=>`<g ${PF}><ellipse cx="${x}" cy="${y}" rx="60" ry="22" fill="#F2F5F8"/><ellipse cx="${x+24}" cy="${y-12}" rx="32" ry="20" fill="#F2F5F8"/></g>`).join('')}
    <g ${PF}><rect x="10" y="150" width="110" height="200" fill="#E8C7B0"/><path d="M0 154L65 104L130 154Z" fill="#C98A7A"/></g><rect x="40" y="200" width="44" height="44" rx="6" fill="#F7E8B8"/>
    <g ${PF}><rect x="290" y="170" width="100" height="180" fill="#CFE0C8"/><path d="M280 174L340 124L400 174Z" fill="#8FA7C9"/></g><rect x="316" y="214" width="40" height="40" rx="6" fill="#F7E8B8"/>
    <g ${PF}><rect y="350" width="400" height="170" fill="#B9C3CC"/></g><ellipse cx="90" cy="440" rx="50" ry="10" fill="#A9C7DC"/><ellipse cx="320" cy="470" rx="60" ry="12" fill="#A9C7DC"/>
    ${Array.from({length:26},(_,i)=>{const x=(i*61)%400,y=(i*97)%330;return `<path d="M${x} ${y}l-4 12" stroke="#9FC3DD" stroke-width="2.6" stroke-linecap="round"/>`}).join('')}`,
  snow:`<rect width="400" height="520" fill="#E4EEF5"/><g ${PF}><path d="M0 300Q100 250 200 290Q300 250 400 290V520H0Z" fill="#FFFFFF"/></g>
    <g ${PF}><rect x="20" y="190" width="100" height="110" fill="#E8C7B0"/><path d="M8 196L70 140L132 196Z" fill="#C98A7A"/><path d="M8 196L70 140L132 196L120 196L70 152L20 196Z" fill="#fff"/></g><rect x="54" y="226" width="34" height="34" rx="5" fill="#F7E8B8"/>
    <g ${PF}><path d="M320 300L350 220L380 300Z" fill="#9CC293"/><path d="M326 270L350 200L374 270Z" fill="#A9CFA0"/><path d="M336 230L350 190L364 230Z" fill="#fff"/></g>
    <g ${PF}><circle cx="290" cy="330" r="26" fill="#fff"/><circle cx="290" cy="292" r="18" fill="#fff"/></g><circle cx="284" cy="288" r="2.4" fill="${OL}"/><circle cx="296" cy="288" r="2.4" fill="${OL}"/><path d="M290 294l10 3-10 2Z" fill="#EDA468"/>
    ${Array.from({length:30},(_,i)=>`<circle cx="${(i*53)%400}" cy="${(i*89)%300}" r="${2+i%3}" fill="#fff"/>`).join('')}`,
  pool:`<rect width="400" height="520" fill="#E3F2F6"/><circle cx="330" cy="70" r="30" fill="#F7E8B8"/><g ${PF}><ellipse cx="80" cy="80" rx="50" ry="18" fill="#fff"/></g>
    <g ${PF}><rect x="20" y="160" width="10" height="150" fill="#C9A98A"/><path d="M-30 170Q25 120 80 170Q60 150 25 150Q-10 150 -30 170Z" fill="#E8A0AE"/></g>
    <g ${PF}><rect y="290" width="400" height="230" fill="#F2E3CF"/></g><g ${PF}><rect x="40" y="340" width="320" height="150" rx="30" fill="#9FD3E6"/></g>
    ${[0,1,2,3].map(i=>`<path d="M${70+i*20} ${370+i*30}q20 -8 40 0t40 0t40 0" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`).join('')}
    <g ${PF}><circle cx="300" cy="380" r="22" fill="#F7B79A"/><circle cx="300" cy="380" r="10" fill="#9FD3E6"/></g>`
};
const sceneSVG=k=>`<svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">${SCENE[k]||SCENE.palace}</svg>`;
/* theme pictures for the customer's bubble */
const THEME_ICON={
  palace:`<g transform="translate(30 28)"><path d="M-18 8L-20 -10L-9 0L0 -14L9 0L20 -10L18 8Z" fill="#FFD86B" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cy="-14" r="3" fill="#E89AAE"/></g>`,
  pajama:`<g transform="translate(30 27)"><path d="M6 -14A14 14 0 1 0 14 8A11 11 0 1 1 6 -14Z" fill="#F7E8B8" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>${A.twinkle(-12,-8,4,'#F0D58A')}</g>`,
  rain:`<g transform="translate(30 26)"><path d="M-18 2Q-16 -16 0 -16Q16 -16 18 2Q12 -2 6 2Q0 -3 -6 2Q-12 -2 -18 2Z" fill="#E0786F" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M0 0V14Q0 18 -5 16" stroke="${OL}" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  snow:`<g transform="translate(30 26)" stroke="#8FC3E6" stroke-width="3.4" stroke-linecap="round">${[0,60,120].map(a=>`<path d="M0 -14V14" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#fff"/></g>`,
  pool:`<g transform="translate(30 26)"><circle r="14" fill="#EDA468" stroke="${OL}" stroke-width="2.4"/><circle r="6" fill="#FFFDF9" stroke="${OL}" stroke-width="2"/><path d="M-12 -7L-6 -3M12 -7L6 -3M-12 7L-6 3M12 7L6 3" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`
};
const bubble=th=>`<svg viewBox="0 0 60 56"><path d="M10 4H50Q58 4 58 12V34Q58 42 50 42H26L15 52L17 42H10Q2 42 2 34V12Q2 4 10 4Z" fill="#FFFDF9" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>${THEME_ICON[th]||''}</svg>`;
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  mirror:`<svg viewBox="0 0 100 100"><rect x="28" y="6" width="44" height="80" rx="22" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="3.5"/><rect x="35" y="13" width="30" height="66" rx="15" fill="#EAF3F6" stroke="${OL}" stroke-width="3"/><path d="M41 28L55 18V26L41 40Z" fill="#fff"/><path d="M36 86L32 96M64 86L68 96" stroke="${OL}" stroke-width="5" stroke-linecap="round"/>${A.twinkle(84,18,7,'#F0D58A')}</svg>`
};
/* the fitting-room curtain halves that close over the doll for a moment (putOn) */
const CURTAIN=side=>`<svg viewBox="0 0 100 300" preserveAspectRatio="none"><path d="M${side==='l'?'0 0H100Q86 80 100 160Q84 230 100 300H0Z':'100 0H0Q14 80 0 160Q16 230 0 300H100Z'}" fill="#D9A3B8"/>${[20,45,70].map(x=>`<path d="M${side==='l'?x:100-x} 0Q${side==='l'?x+6:94-x} 150 ${side==='l'?x:100-x} 300" stroke="#C88EA6" stroke-width="4" fill="none"/>`).join('')}</svg>`;

/* ============================== screen ============================== */
const css=`
#${id}{gap:6px}
#${id} .cl-headbar{flex:none;height:${HEAD_PX}px;gap:8px}
#${id} .cl-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px;flex:none}
#${id} .cl-back svg{width:100%;height:100%;display:block}
.cl-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none}
.cl-strip span{flex:none;width:44px;height:44px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:all .3s;box-shadow:0 2px 6px rgba(91,74,66,.12);padding:4px}
.cl-strip span svg{width:100%;height:100%;display:block}
.cl-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.cl-strip span.done{opacity:1}
.cl-stars{flex:none;display:flex}
.cl-stars .mlp-star{width:24px;height:24px}
.cl-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F4E9DE}
.cl-stage svg{display:block}
.cl-bg,.cl-scene{position:absolute;inset:0;pointer-events:none}
.cl-bg svg,.cl-scene svg{width:100%;height:100%}
.cl-scene{opacity:0;transition:opacity .7s}
.cl-scene.on{opacity:1}
.cl-doll{position:absolute;left:50%;bottom:2%;transform:translateX(-50%);z-index:3;pointer-events:none}
.cl-doll>svg{width:100%;height:100%;overflow:visible}
.cl-doll .al-arm-l{transform-box:view-box!important;transform-origin:91px 172px!important}
.cl-doll .al-arm-r{transform-box:view-box!important;transform-origin:149px 172px!important}
.cl-doll .cl-sway{transform-box:view-box;transform-origin:120px 226px}
.cl-doll.sway .cl-sway{animation:clsway 1.1s ease-out}
@keyframes clsway{0%{transform:rotate(0)}20%{transform:rotate(7deg)}45%{transform:rotate(-5deg)}70%{transform:rotate(2.5deg)}100%{transform:rotate(0)}}
.cl-doll.drop>svg{animation:cldrop .5s ease-out}
@keyframes cldrop{0%{transform:none}30%{transform:scale(1.04,.95) translateY(6px)}65%{transform:scale(.98,1.03)}100%{transform:none}}
.cl-doll.tada .al-arm-l{animation:cltadal 1.4s ease-in-out}
.cl-doll.tada .al-arm-r{animation:cltadar 1.4s ease-in-out}
@keyframes cltadal{0%,100%{transform:rotate(0)}25%,75%{transform:rotate(130deg)}}
@keyframes cltadar{0%,100%{transform:rotate(0)}25%,75%{transform:rotate(-130deg)}}
.cl-doll.walk>svg{animation:clwalk .5s ease-in-out infinite}
@keyframes clwalk{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.cl-doll.walk .cl-leg-l{animation:clstep .5s ease-in-out infinite;transform-box:view-box;transform-origin:106px 238px}
.cl-doll.walk .cl-leg-r{animation:clstep .5s ease-in-out -.25s infinite;transform-box:view-box;transform-origin:134px 238px}
@keyframes clstep{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
.cl-curt{position:absolute;top:0;bottom:0;width:52%;z-index:5;pointer-events:none;transition:transform .35s ease-in-out}
.cl-curt svg{width:100%;height:100%}
.cl-curt.l{left:0;transform:translateX(-102%)}.cl-curt.r{right:0;transform:translateX(102%)}
.cl-stage.closed .cl-curt{transform:translateX(0)}
.cl-mates{position:absolute;inset:0;z-index:3}
.cl-mate{position:absolute;bottom:3%;border:0;padding:0;background:none;touch-action:manipulation}
.cl-mate .cl-mini{position:absolute;left:0;right:0;bottom:0;top:22%;pointer-events:none}
.cl-mate .cl-mini>svg{width:100%;height:100%;overflow:visible}
.cl-mate .cl-bub{position:absolute;right:-4%;top:0;width:52%;aspect-ratio:60/56;pointer-events:none}
.cl-mate .cl-bub svg{width:100%;height:100%}
.cl-mate:active .cl-mini{transform:translateY(3px)}
.cl-fx{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}
.cl-fx .pf{position:absolute;width:0;height:0}
.cl-fx .pf svg{position:absolute;left:-15px;top:-15px;width:30px;height:30px;overflow:visible}
.cl-fx .pf.pop{animation:clpop ease-out forwards}
@keyframes clpop{from{transform:scale(.6);opacity:1}to{transform:scale(1.8);opacity:0}}
.cl-float{position:absolute;z-index:60;pointer-events:none}
.cl-float svg{width:100%;height:100%;overflow:visible}
.cl-mirbtn{position:absolute;right:10px;bottom:10px;width:116px;height:116px;border-radius:50%;border:0;padding:12px;background:var(--paper);z-index:9;opacity:0;transition:opacity .8s ease-out;box-shadow:0 5px 0 rgba(46,42,79,.14),0 8px 14px rgba(91,74,66,.14);display:grid;place-items:center}
.cl-mirbtn.on{opacity:1}
.cl-mirbtn svg{width:100%;height:100%;pointer-events:none}
.cl-flash{position:absolute;inset:0;z-index:10;background:#fff;opacity:0;pointer-events:none;transition:opacity .25s ease-out}
.cl-flash.on{opacity:.55}
.cl-photo{position:absolute;z-index:11;pointer-events:none;background:#FFFDF9;border-radius:10px;padding:8px 8px 22px;box-shadow:0 6px 16px rgba(91,74,66,.25)}
.cl-photo>div{width:100%;height:100%;border-radius:6px;overflow:hidden;position:relative}
.cl-photo svg{position:absolute;inset:0;width:100%;height:100%}
.cl-tray{flex:none;position:relative;display:flex;align-items:flex-end;justify-content:center;gap:10px;touch-action:none;padding-bottom:4px}
.cl-rod{position:absolute;left:4%;right:4%;top:6px;height:9px;border-radius:5px;background:#C9A98A;box-shadow:0 2px 3px rgba(91,58,41,.2);pointer-events:none}
.cl-rod::before,.cl-rod::after{content:"";position:absolute;top:-3px;width:15px;height:15px;border-radius:50%;background:#B9946F}
.cl-rod::before{left:-6px}.cl-rod::after{right:-6px}
.cl-card{position:relative;flex:1;min-width:110px;max-width:170px;height:calc(100% - 24px);min-height:110px;border-radius:24px;border:0;padding:10px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .45s cubic-bezier(.3,1.1,.5,1),opacity .3s,box-shadow .2s}
.cl-card svg{width:100%;height:100%;display:block;pointer-events:none}
.cl-card .cl-hook{position:absolute;left:50%;top:-20px;width:30px;height:24px;transform:translateX(-50%);pointer-events:none}
.cl-card .cl-hook svg{width:100%;height:100%}
.cl-card.slide{transform:translateX(120vw)}
.cl-card.out{transform:translateX(-120vw)}
.cl-card.worn{box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16)}
.cl-card.lift{opacity:.35}
.cl-show{display:flex;gap:12px;align-items:flex-end;justify-content:center;height:100%;padding:22px 0 6px;pointer-events:none}
.cl-show span{height:100%;aspect-ratio:.9;border-radius:22px;background:var(--paper);padding:8px;box-shadow:0 3px 10px rgba(91,74,66,.1)}
.cl-show span svg{width:100%;height:100%}
.cl-ic .al-lid{opacity:0}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const HOOK=`<svg viewBox="0 0 30 24"><path d="M15 22V12Q15 4 21 4Q26 4 26 9" stroke="#9C8670" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M2 22L15 14L28 22" stroke="#9C8670" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`${PAPER_DEFS}<div class="bar cl-headbar"><button class="round cl-back" id="clHome" data-go="home" aria-label="뒤로">${ICON.back}</button><button class="round cl-back" id="clBack" aria-label="가게 처음으로" hidden>${ICON.back}</button><div class="cl-strip" id="clStrip"></div><div class="cl-stars" id="clStars"></div></div>
<div class="cl-stage" id="clStage"><div class="cl-bg" id="clBg">${SHOP_BG}</div><div class="cl-scene" id="clScene"></div><div class="cl-mates" id="clMates"></div><div class="cl-doll" id="clDoll"></div>
  <div class="cl-curt l" id="clCurtL">${CURTAIN('l')}</div><div class="cl-curt r" id="clCurtR">${CURTAIN('r')}</div><div class="cl-fx" id="clFx"></div>
  <button class="cl-mirbtn" id="clMirBtn" aria-label="거울" hidden>${ICON.mirror}</button><div class="cl-flash" id="clFlash"></div></div>
<div class="cl-tray" id="clTray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='옷 가게';
const $=s=>sec.querySelector(s);
const stage=$('#clStage'),stripEl=$('#clStrip'),matesEl=$('#clMates'),dollEl=$('#clDoll'),fxEl=$('#clFx'),mirBtn=$('#clMirBtn'),flashEl=$('#clFlash'),sceneEl=$('#clScene'),tray=$('#clTray'),homeBtn=$('#clHome'),backBtn=$('#clBack');
const G=M.Guide.make(sec,{say});
let view='lobby',phase='',lv=levelInfo(1),S=null,al=null,lobby=[],gen=0,misses=0,lastMiss=0,rack=null,dd=null,cd=null,busy=false,mirrorT=0,lobbyAl=[],turns=null;
const stR=()=>stage.getBoundingClientRect();
const secXY=(x,y)=>{const r=sec.getBoundingClientRect();return[x-r.left,y-r.top]};
const dR=()=>dollEl.getBoundingClientRect();
const dpt=(x,y)=>{const r=dR();return[r.left+x/VBW*r.width,r.top+y/VBH*r.height]};
const toDoll=e=>{const r=dR();return[(e.clientX-r.left)/r.width*VBW,(e.clientY-r.top)/r.height*VBH]};
const SLOT_PT={head:[120,58],top:[120,200],bottom:[120,262],feet:[120,350],neck:[120,170],hand:[168,246]};

/* ---------- layout ---------- */
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  const r=stR(),W=r.width,Hh=r.height;if(!W)return;
  const h=Math.round(Math.min(Hh*.9,W*.86*VBH/VBW)),w=Math.round(h*VBW/VBH);Object.assign(dollEl.style,{width:w+'px',height:h+'px'});
  layoutMates();
}
function layoutMates(){const r=stR();if(!r.width)return;const W=r.width,Hh=r.height,bw=Math.round(Math.max(112,Math.min(W*.31,Hh*.3))),gap=(W-3*bw)/4;
  matesEl.querySelectorAll('.cl-mate').forEach((b,i)=>Object.assign(b.style,{left:(gap+i*(bw+gap))+'px',width:bw+'px',height:Math.round(bw*2.1)+'px'}))}

/* ---------- drawing ---------- */
function drawDoll(extra){if(!S)return;dollEl.innerHTML=doll(S.d,S.wear,{skip:S.drag});if(al)al.refresh()}
function strip(){
  const ks=lv.slots;stripEl.innerHTML=ks.map(k=>{const w=S&&S.wear[k],it=w&&findItem(k,w.id),c=w&&colorOf(w.col);
    const pic=it?cardSVG(k,it,w.col).replace('<svg ',`<svg data-v="1" `):slotIcon(k);return `<span class="${w?'done':''}${rack&&rack.slot===k?' on':''}">${pic}</span>`}).join('');
}
/* a body-place picture for an empty place (outline of a little body with that place filled) */
function slotIcon(k){const box={head:'40 0 160 140',top:'50 140 140 140',bottom:'50 200 140 150',feet:'70 300 100 70',neck:'80 130 80 70',hand:'130 200 80 90'}[k];
  const d=DOLLS[0];return `<svg viewBox="${box}"><g opacity=".35">${line(ARM.l.s,ARM.l.h,14,'#E8DCCF',6)}${line(ARM.r.s,ARM.r.h,14,'#E8DCCF',6)}${line(LEG.l.s,LEG.l.a,18,'#E8DCCF',6)}${line(LEG.r.s,LEG.r.a,18,'#E8DCCF',6)}<path d="${TORSO}" fill="#E8DCCF" ${S3}/><path d="${FACE}" fill="#E8DCCF" ${S3}/></g>
    ${k==='head'?`<path d="${FACE}" fill="${d.skin}" ${S3}/>`:k==='top'?`<path d="${TORSO}" fill="${PAL.rose||'#E8A0AE'}" ${S3}/>`:k==='bottom'?`<path d="${HIP}" fill="${PAL.sky||'#8FC3E6'}" ${S3}/>`:k==='feet'?shoe('l','#E0786F','#F3C6C1','mj')+shoe('r','#E0786F','#F3C6C1','mj'):k==='neck'?`<circle cx="120" cy="172" r="8" fill="#F0D58A" ${S3}/>`:`<circle cx="${HAND.r[0]}" cy="${HAND.r[1]}" r="11" fill="#F0D58A" ${S3}/>`}</svg>`}
function stars(n){const pr=PRG();$('#clStars').innerHTML=pr?pr.stars(GID,n):''}
function spawn(html,x,y,ms=700){if(fxEl.childElementCount>40)return;const e=document.createElement('i');e.className='pf pop';e.innerHTML=`<svg viewBox="-15 -15 30 30">${html}</svg>`;const s=stR();e.style.left=(x-s.left)+'px';e.style.top=(y-s.top)+'px';e.style.animationDuration=ms+'ms';fxEl.appendChild(e);setTimeout(()=>e.remove(),ms+60)}
const sparkles=(slot)=>{const [x,y]=dpt(...SLOT_PT[slot]),u=dR().width/VBW;[[-50,-30],[46,-20],[0,40],[-30,30],[34,34]].forEach(([dx,dy],k)=>setTimeout(()=>spawn(A.twinkle(0,0,10,'#F0D58A'),x+dx*u,y+dy*u),k*80))};
function miss(){misses++;if(S)S.wrong++;G.nudge();const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}

/* ============================== in the shop: three friends wait, each wants a theme ============================== */
function fillLobby(){const used=lobby.filter(Boolean);if(used.length===3)return;const ds=shuffle(DOLLS.map(d=>d.id)),ths=shuffle(THEMES.map(t=>t.id));lobby=ds.map((d,i)=>({d,th:ths[i%ths.length]}))}
function renderMates(){
  matesEl.innerHTML=lobby.map((c,i)=>{const d=dollOf(c.d);return `<button class="cl-mate" data-i="${i}" aria-label="${d.ko}"><span class="cl-mini">${doll(d,{},{})}</span><span class="cl-bub">${bubble(c.th)}</span></button>`}).join('');
  layoutMates();lobbyAliveOff();if(M.Alive){matesEl.querySelectorAll('.cl-mini').forEach(e=>lobbyAl.push(M.Alive.attach(e,{kind:'doll',waiting:true})));turns=M.Alive.takeTurns(lobbyAl)}
}
function lobbyAliveOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
function showLobby(o={}){
  L.begin();gen++;G.stop();fxEl.innerHTML='';if(al){al.detach();al=null}rack=null;dd=null;cd=null;busy=false;mirrorT=0;
  view='lobby';phase='lobby';S=null;lv=levelInfo(levelNo());
  sceneEl.classList.remove('on');dollEl.innerHTML='';dollEl.style.transform='';matesEl.hidden=false;homeBtn.hidden=false;backBtn.hidden=true;mirBtn.hidden=true;mirBtn.classList.remove('on');stage.classList.remove('closed');
  fillLobby();size();renderMates();strip();
  const R=o.result;stars(R?R.filled-1:undefined);if(R)L.later(()=>{const pr=PRG();if(pr)pr.fillStars($('#clStars'),R.filled);LOG.push('star:'+R.filled)},400);
  if(R&&R.up)L.later(()=>levelUp(R.level),1600);
  /* the rack in the tray: today's clothes on show (pictures only) */
  const show=[['top','gown','pink'],['top','raincoat','yellow'],['top','pajama','sky blue']];
  tray.innerHTML=`<div class="cl-rod"></div><div class="cl-show">${show.map(([s,i,c])=>`<span>${cardSVG(s,itemOf(s,i),c)}</span>`).join('')}</div>`;
  L.onEnd(lobbyAliveOff);
  L.later(()=>{say('누구 옷을 골라 줄까? 친구를 콕 눌러 봐!','Whose clothes shall we pick? Tap a friend!');
    G.start({type:'tap',at:()=>{const b=matesEl.querySelector('.cl-mate:nth-child(2) .cl-mini');if(!b)return[sec.clientWidth/2,sec.clientHeight/2];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height*.4)}})},R?2400:300);
}
function levelUp(n){const a=levelInfo(n-1),b=levelInfo(n),k=b.slots.find(x=>!a.slots.includes(x));LOG.push('levelup:'+n+(k?':'+k:''));const pr=PRG();if(!pr)return;
  const art=k?slotIcon(k):cardSVG('top',itemOf('top','gown'),'pink');pr.moment(stage,{art,ko:'새 옷이 왔어요!',en:'New clothes!'},()=>stars(0))}
matesEl.addEventListener('click',e=>{const b=e.target.closest('.cl-mate');if(!b||phase!=='lobby')return;pickMate(+b.dataset.i,b)});
function pickMate(i,b){
  phase='pick';G.touch();G.stop();actx();sfx.pop();const c=lobby[i],d=dollOf(c.d);LOG.push('pick:'+d.id+':'+c.th);say(`${d.ko}, 이리 와!`,`Come here, ${d.en}!`);
  const r=b.getBoundingClientRect(),s=stR(),dx=s.left+s.width/2-(r.left+r.width/2);
  b.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,-10px) scale(1.3)`,opacity:.2}],{duration:600,easing:'ease-in-out',fill:'forwards'});
  L.later(()=>enterRoom(i),620);
}
backBtn.addEventListener('click',()=>{if(view!=='room')return;actx();sfx.pop();showLobby()});
lobbyEl_down();
function lobbyEl_down(){stage.addEventListener('pointerdown',e=>{actx();if(view==='lobby'&&phase==='lobby'&&!e.target.closest('.cl-mate'))miss()})}

/* ============================== dressing ============================== */
function enterRoom(i){
  L.begin();gen++;G.stop();lobbyAliveOff();const c=lobby[i];
  view='room';phase='dress';S={d:dollOf(c.d),th:c.th,seat:i,wear:{},drag:null,wrong:0,idle:0,rot:{},t0:performance.now()};lv=levelInfo(levelNo());rack=null;
  matesEl.hidden=true;homeBtn.hidden=true;backBtn.hidden=false;mirBtn.hidden=true;mirBtn.classList.remove('on');mirrorT=0;
  size();drawDoll();strip();stars();
  if(M.Alive){al=M.Alive.attach(dollEl,{kind:'doll'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  dollEl.animate([{transform:'translateX(-50%) scale(.7)',opacity:0},{transform:'translateX(-50%) scale(1)',opacity:1}],{duration:500,easing:'cubic-bezier(.3,1.3,.5,1)'});
  const th=THEMES.find(t=>t.id===S.th)||THEMES[0];
  tray.innerHTML=`<div class="cl-rod"></div>`;
  L.later(()=>{say(`안녕! 나는 ${iya(S.d.ko)}. ${th.ko}에 갈 옷을 골라 줘!`,`Hi! I'm ${S.d.en}. Pick my clothes for ${th.en}!`,true);if(al)al.play('hop',{n:2})},500);
  L.later(()=>{say('몸을 콕 눌러 봐! 옷이 와요.','Tap the body! Clothes will come.',true);
    G.start({type:'tap',at:()=>{const [x,y]=dpt(...SLOT_PT.top);return secXY(x,y)}})},2600);
}
/* which body place a tap means (only the places of this level) */
function slotAt(x,y){
  const open=lv.slots;let want='top';
  if(Math.hypot(x-HAND.r[0],y-HAND.r[1])<24||Math.hypot(x-HAND.l[0],y-HAND.l[1])<24)want='hand';
  else if(y<150)want='head';else if(y<180&&Math.abs(x-120)<24)want='neck';else if(y<238)want='top';else if(y<332)want='bottom';else want='feet';
  if(open.includes(want))return want;
  const near={hand:['top','bottom'],neck:['top','head'],head:['top'],feet:['bottom','top'],bottom:['top'],top:['bottom']}[want]||[];return near.find(k=>open.includes(k))||open[0];
}
const inDoll=(x,y)=>x>40&&x<210&&y>4&&y<375&&!(y>250&&y<330&&Math.abs(x-120)>48);
/* the rack: options for a place, theme clothes first; tapping the same place again brings the next ones */
function poolFor(slot){const th=S.th,its=(ITEMS[slot]||[]).slice();its.sort((a,b)=>(b.th.includes(th)?1:0)-(a.th.includes(th)?1:0));let out=its;
  if(lv.photo)out=photoItems().filter(p=>p.slot===slot).concat(out);return out}
function openRack(slot,again){
  const n=lv.options,pool=poolFor(slot);if(!pool.length)return;
  const rot=again?(S.rot[slot]||0)+1:(S.rot[slot]||0);S.rot[slot]=rot;
  const pickd=[];for(let k=0;k<Math.min(n,pool.length);k++)pickd.push(pool[(rot*n+k)%pool.length]);
  const items=pickd.map((it,k)=>({id:it.id,col:it.cols[(rot+k)%it.cols.length]}));
  const old=[...tray.querySelectorAll('.cl-card')];old.forEach(b=>{b.classList.add('out');setTimeout(()=>b.remove(),450)});
  rack={slot,items};LOG.push('rack:'+slot+':'+items.map(x=>x.id).join('+'));
  items.forEach((c,k)=>{const it=findItem(slot,c.id),b=document.createElement('button');b.className='cl-card slide';b.dataset.k=k;b.dataset.item=c.id;b.setAttribute('aria-label',it.ko);
    b.innerHTML=`<span class="cl-hook">${HOOK}</span>${cardSVG(slot,it,c.col)}`;tray.appendChild(b);
    setTimeout(()=>b.classList.remove('slide'),60+k*110)});
  noise(.4,{type:'bandpass',freq:1800,q:2,vol:.05});markWorn();strip();
  const ask={top:['어떤 옷을 입을까?','Which top?'],bottom:['치마? 바지?','A skirt or trousers?'],feet:['어떤 신발을 신을까?','Which shoes?'],head:['머리에는 뭘 쓸까?','Something for the head?'],neck:['목에는 뭘 할까?','Something for the neck?'],hand:['손에 뭘 들까?','Something to hold?']}[slot];
  say(ask[0],ask[1]);
}
function markWorn(){if(!rack)return;const w=S.wear[rack.slot];tray.querySelectorAll('.cl-card').forEach(b=>{if(b.classList.contains('out'))return;const c=rack.items[+b.dataset.k];b.classList.toggle('worn',!!(w&&c&&w.id===c.id))})}
/* put on: the curtain closes a little, opens, and it is on (vivid) — then a twirl and the skirt sways */
function putOn(slot,iid,col,fromEl){
  if(!S||busy)return;busy=true;G.touch();G.stop();
  const fin=()=>{stage.classList.add('closed');noise(.3,{type:'bandpass',freq:900,q:.7,vol:.08});
    L.later(()=>{if(!S)return;
      const it=findItem(slot,iid);
      if(slot==='top'&&it&&it.dress)delete S.wear.bottom;if(slot==='bottom'&&S.wear.top&&(findItem('top',S.wear.top.id)||{}).dress)delete S.wear.top;
      S.wear[slot]={id:iid,col};LOG.push('wear:'+slot+':'+iid);drawDoll();stage.classList.remove('closed');
      L.later(()=>{busy=false;dollEl.classList.remove('sway','drop');void dollEl.offsetWidth;dollEl.classList.add('drop');if(al)al.play('twirl');setTimeout(()=>dollEl.classList.add('sway'),300);setTimeout(()=>dollEl.classList.remove('sway','drop'),1500);
        sparkles(slot);SFX.sparkle();const c=colorOf(col);if(it)say(it.photo?it.ko+'!':`${c.ko} ${it.ko}!`,it.photo?'':`${cap(c.en)} ${it.en}!`);markWorn();strip();armMirror()},380)},380)};
  if(fromEl){const [tx,ty]=dpt(...SLOT_PT[slot]);fly(fromEl,tx,ty,dR().width*.4,320,fin)}else fin();
}
function takeOff(slot,f){
  if(!S)return;delete S.wear[slot];S.drag=null;LOG.push('off:'+slot);drawDoll();markWorn();strip();sfx.pop();say('어?','Oh?');if(al)al.play('oops');
  if(f){const r=tray.getBoundingClientRect();fly(f,r.left+r.width/2,r.top+r.height/2,50,420,null,true)}
  if(!Object.keys(S.wear).length){mirBtn.classList.remove('on');mirBtn.hidden=true}
}
function recolor(slot){const w=S.wear[slot],it=findItem(slot,w.id);if(!it||it.photo){sparkles(slot);return}const cs=it.cols,next=cs[(cs.indexOf(w.col)+1)%cs.length];
  w.col=next===w.col?COLORS[(COLORS.indexOf(colorOf(w.col))+1)%COLORS.length].en:next;LOG.push('color:'+slot+':'+w.col);drawDoll();sparkles(slot);strip();const c=colorOf(w.col);say(c.ko+'!',cap(c.en)+'!');tone(880,.1,'sine',.1);
  if(al)al.play('hop')}
function armMirror(){if(!mirBtn.hidden||mirrorT)return;const need=Math.min(2,lv.slots.length);if(Object.keys(S.wear).length>=need){showMirror();return}
  mirrorT=1;const g=gen;L.later(()=>{mirrorT=0;if(g===gen&&S&&Object.keys(S.wear).length)showMirror()},6000)}
function showMirror(){if(!mirBtn.hidden)return;mirBtn.hidden=false;requestAnimationFrame(()=>mirBtn.classList.add('on'));say('다 입었으면 거울을 콕!','All dressed? Tap the mirror!',true);
  G.start({type:'tap',wait:true,quiet:true,after:20000,at:()=>{const r=mirBtn.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}})}
function fly(el,cx,cy,px,ms,then,fade){
  const r=el.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2),s=px/r.width;let done=false;const f=()=>{if(done)return;done=true;el.remove();then&&then()};
  try{const a=el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:fade?0:1}],{duration:ms,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});a.onfinish=f}catch(e){setTimeout(f,ms)}setTimeout(f,ms+300);
}
function floatOf(slot,iid,col,cx,cy,px,vivid){const it=findItem(slot,iid),f=document.createElement('div');f.className='cl-float';const c=colorOf(col);
  f.innerHTML=it?cardSVG(slot,it,col).replace(new RegExp(c.hex,'g'),vivid?c.vivid:c.hex):'';const [x,y]=secXY(cx,cy);Object.assign(f.style,{width:px+'px',height:px+'px',left:(x-px/2)+'px',top:(y-px/2)+'px'});sec.appendChild(f);return f}
/* touches on the doll: a worn item (tap = colour, drag off = take off), or a place (tap = the rack) */
stage.addEventListener('pointerdown',e=>{
  if(view!=='room'||phase!=='dress'||!S||e.target.closest('.cl-mirbtn'))return;e.preventDefault();actx();G.touch();
  const [x,y]=toDoll(e);if(!inDoll(x,y)){miss();return}
  const slot=slotAt(x,y);
  if(S.wear[slot]){dd={slot,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{stage.setPointerCapture(e.pointerId)}catch(_){}return}
  sfx.pop();openRack(slot,rack&&rack.slot===slot);
});
stage.addEventListener('pointermove',e=>{
  if(!dd||e.pointerId!==dd.id||!S)return;
  if(!dd.moved&&Math.hypot(e.clientX-dd.x0,e.clientY-dd.y0)>14){dd.moved=true;const w=S.wear[dd.slot];if(!w){dd=null;return}S.drag=dd.slot;drawDoll();dd.f=floatOf(dd.slot,w.id,w.col,e.clientX,e.clientY,dR().width*.45,true);tone(520,.06,'triangle',.1)}
  if(dd.moved&&dd.f){const [x,y]=secXY(e.clientX,e.clientY),w=dd.f.offsetWidth;dd.f.style.left=(x-w/2)+'px';dd.f.style.top=(y-w/2)+'px'}
});
const endDrag=e=>{G.release();if(!dd||(e&&e.pointerId!==dd.id))return;const d=dd;dd=null;if(!S){if(d.f)d.f.remove();return}
  if(!d.moved){recolor(d.slot);if(!rack||rack.slot!==d.slot)openRack(d.slot,false);return}
  const [x,y]=toDoll(e),out=!inDoll(x,y)||Math.hypot(x-SLOT_PT[d.slot][0],y-SLOT_PT[d.slot][1])>110;
  if(out&&e.type!=='pointercancel')takeOff(d.slot,d.f);else{S.drag=null;d.f.remove();drawDoll()}};
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
/* cards: tap = put on; drag onto the doll = put on */
tray.addEventListener('pointerdown',e=>{const b=e.target.closest('.cl-card');if(!b||!rack||phase!=='dress'||cd||busy||b.classList.contains('out'))return;e.preventDefault();actx();G.touch();
  cd={b,k:+b.dataset.k,slot:rack.slot,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{b.setPointerCapture(e.pointerId)}catch(_){}});
tray.addEventListener('pointermove',e=>{if(!cd||e.pointerId!==cd.id)return;
  if(!cd.moved&&Math.hypot(e.clientX-cd.x0,e.clientY-cd.y0)>12){cd.moved=true;const c=rack.items[cd.k];cd.f=floatOf(cd.slot,c.id,c.col,e.clientX,e.clientY,cd.b.getBoundingClientRect().width,false);cd.b.classList.add('lift')}
  if(cd.moved&&cd.f){const [x,y]=secXY(e.clientX,e.clientY),w=cd.f.offsetWidth;cd.f.style.left=(x-w/2)+'px';cd.f.style.top=(y-w/2)+'px'}});
const endCard=e=>{G.release();if(!cd||(e&&e.pointerId!==cd.id))return;const d=cd;cd=null;d.b.classList.remove('lift');if(!S||!rack||rack.slot!==d.slot){if(d.f)d.f.remove();return}
  const c=rack.items[d.k];if(!c){if(d.f)d.f.remove();return}
  if(!d.moved){const r=d.b.getBoundingClientRect();const f=floatOf(d.slot,c.id,c.col,r.left+r.width/2,r.top+r.height/2,r.width*.9,false);sfx.pop();putOn(d.slot,c.id,c.col,f);return}
  const [x,y]=toDoll(e);if(inDoll(x,y)&&e.type!=='pointercancel')putOn(d.slot,c.id,c.col,d.f);else{const r=d.b.getBoundingClientRect();fly(d.f,r.left+r.width/2,r.top+r.height/2,r.width,250)}};
tray.addEventListener('pointerup',endCard);tray.addEventListener('pointercancel',endCard);

/* ============================== ending: the theme scene, walk out, three poses, click, album ============================== */
mirBtn.addEventListener('click',()=>{
  if(view!=='room'||mirBtn.hidden||!S||busy)return;actx();const g=gen;
  phase='ending';G.stop();rack=null;tray.innerHTML='<div class="cl-rod"></div>';mirBtn.classList.remove('on');mirBtn.hidden=true;LOG.push('mirror');sfx.pop();
  sceneEl.innerHTML=sceneSVG(S.th);LOG.push('scene:'+S.th);
  const W=stR().width;dollEl.style.transition='none';dollEl.style.transform=`translateX(${W*.6}px)`;
  L.later(()=>{sceneEl.classList.add('on');dollEl.classList.add('walk');dollEl.style.transition='transform 1.6s linear';dollEl.style.transform='translateX(-50%)';const th=THEMES.find(t=>t.id===S.th);say(`${th.ko}에 왔어요!`,`Off to ${th.en}!`)},100);
  L.later(()=>{dollEl.classList.remove('walk');dollEl.style.transition='';LOG.push('pose:1');if(al)al.play('wave');say('짜잔!','Ta-da!')},1800);
  L.later(()=>{LOG.push('pose:2');if(al)al.play('twirl');dollEl.classList.add('sway');setTimeout(()=>dollEl.classList.remove('sway'),1200)},3700);
  L.later(()=>{LOG.push('pose:3');dollEl.classList.add('tada');setTimeout(()=>dollEl.classList.remove('tada'),1450);tone(1046,.2,'sine',.08)},5100);
  L.later(()=>{flashEl.classList.add('on');SFX.shutter&&SFX.shutter();setTimeout(()=>flashEl.classList.remove('on'),260);photo()},6100);
  L.later(()=>{DATA.album.unshift({d:S.d.id,th:S.th,wear:JSON.parse(JSON.stringify(S.wear)),t:Date.now()});DATA.album=DATA.album.slice(0,12);DATA.served++;save();say('고마워! 예쁜 옷이야!','Thank you! I love my clothes!')},7300);
  L.later(()=>{if(g!==gen)return;const i=S.seat;const others=lobby.filter((x,k)=>k!==i);const ds=DOLLS.map(d=>d.id).filter(x=>x!==S.d.id&&!others.some(o=>o.d===x)),ths=THEMES.map(t=>t.id).filter(x=>x!==S.th);
    lobby[i]={d:pick(ds.length?ds:[S.d.id]),th:pick(ths)};
    let result=null;const pr=PRG();if(pr){pr.struggle(GID,{wrong:S.wrong,idleMs:S.idle});result=pr.clear(GID)}else{DATA.level=Math.min(LEVELS.length,DATA.level+1);save()}
    dollEl.style.transform='';showLobby({result})},9200);
});
function photo(){const r=dR(),s=stR(),w=s.width*.5,h=w*1.2,f=document.createElement('div');f.className='cl-photo';
  f.innerHTML=`<div>${sceneSVG(S.th)}<div style="position:absolute;left:10%;right:10%;top:6%;bottom:0">${doll(S.d,S.wear,{})}</div></div>`;
  Object.assign(f.style,{width:w+'px',height:h+'px',left:(s.width/2-w/2)+'px',top:(s.height*.12)+'px'});stage.appendChild(f);
  L.later(()=>{const a=f.animate([{transform:'rotate(0) scale(1)'},{transform:'rotate(-8deg) scale(.4) translate(-60%,-80%)',opacity:.3}],{duration:900,easing:'ease-in',fill:'forwards'});a.onfinish=()=>f.remove()},900);L.onEnd(()=>f.remove())}

/* ============================== test hooks ============================== */
M.__clLevel=n=>{DATA.level=Math.max(1,Math.min(LEVELS.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)showLobby();return levelNo()};
M.__clPreview=(did,wear,th)=>{L.begin();gen++;G.stop();lobbyAliveOff();view='room';phase='preview';S={d:dollOf(did),th:th||'palace',wear:wear||{},drag:null,wrong:0,rot:{}};matesEl.hidden=true;size();drawDoll();
  if(th){sceneEl.innerHTML=sceneSVG(th);sceneEl.classList.add('on')}else sceneEl.classList.remove('on');return true};
M.__cl=()=>{
  const q=s=>stage.querySelector(s);
  return{view,phase,level:lv.level,slots:lv.slots.slice(),options:lv.options,doll:S?S.d.id:null,theme:S?S.th:null,busy,misses,
    wear:S?Object.fromEntries(Object.entries(S.wear).map(([k,w])=>[k,{id:w.id,col:w.col}])):{},
    rack:rack?{slot:rack.slot,items:rack.items.map(c=>c.id)}:null,cards:[...tray.querySelectorAll('.cl-card:not(.out)')].map(b=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width,r.height]}),
    slotPts:S?Object.fromEntries(SLOTS.map(k=>[k,dpt(...SLOT_PT[k])])):{},offPt:(()=>{const r=tray.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})(),
    bg:{curtain:!!q('#bg-curtain'),mirror:!!q('#bg-mirror'),rack:!!q('#bg-rack'),shoes:!!q('#bg-shoes'),window:!!q('#bg-window')},
    parts:{head:dollEl.querySelectorAll('.al-head .cl-head').length,torso:dollEl.querySelectorAll('.cl-torso').length,armL:dollEl.querySelectorAll('.al-arm-l').length,armR:dollEl.querySelectorAll('.al-arm-r').length,legL:dollEl.querySelectorAll('.cl-leg-l').length,legR:dollEl.querySelectorAll('.cl-leg-r').length},
    wornIn:S?Object.fromEntries([...dollEl.querySelectorAll('[data-slot]')].map(g=>[g.getAttribute('data-slot')+'@'+(g.parentElement.closest('.cl-torso')?'torso':g.parentElement.closest('.al-arm')?'arm':g.parentElement.closest('.cl-leg')?'leg':g.parentElement.closest('.al-head')?'head':'body'),1])):{},
    mates:[...matesEl.querySelectorAll('.cl-mate')].map(b=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,r.width,r.height]}),
    mirror:!mirBtn.hidden,scene:sceneEl.classList.contains('on')?S&&S.th:null,album:DATA.album.length,served:DATA.served,alive:al?al.state():null,log:LOG.slice(),guide:G.state()};
};
M.__clDepth=()=>LEVELS.map((l,i)=>{const v=levelInfo(i+1);return{level:i+1,processes:1+v.slots.length+1,steps:['friend'].concat(v.slots,['mirror']),hands:['tap','drag','card'],someone:!!M.Alive,choice:true,ending:'theme scene · poses · photo',options:v.options}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)showLobby()})},
  exit:()=>{L.begin();gen++;G.stop();fxEl.innerHTML='';lobbyAliveOff();if(al){al.detach();al=null}dd=null;cd=null;rack=null;busy=false;phase='';view='lobby';sec.querySelectorAll('.cl-float').forEach(f=>f.remove())},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* home tile picture: the doll in a dress (no emoji) */
document.querySelectorAll('.tile[data-go="clothes"] .ic').forEach(ic=>{ic.classList.add('cl-ic');ic.innerHTML=doll(DOLLS[0],{top:{id:'gown',col:'pink'},head:{id:'crown',col:'pink'}},{});const s=ic.querySelector('svg');if(s){s.style.width='1.3em';s.style.height='2.1em'}});
})();
