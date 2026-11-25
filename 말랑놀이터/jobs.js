/* 말랑 직업 놀이 (P15) — 예전 직업 옷 입히기 · 짝 맞추기 · 출동 놀이를 하나로.
   흐름(games.jobs.flow): 직업 카드 고르기 → 모자·옷·도구 3가지 입히기(콕 또는 끌어서, 떼기·색 바꾸기) → 거울 앞에서 빙글 →
   출동(탈것이 와서 콕 하면 타고 감) → 일 해 보기(도구가 손가락을 따라옴, ML.P2.makeTool, 닿은 곳만 바뀜) + 콕 하는 일 →
   고마워하는 장면 → 진짜 사진 카드(사진이 아직 없어서 그린 카드) → 도장, 별 1칸.
   일(jobs[].mission): 소방관 = 물줄기로 불 3곳 끄기 + 지붕 위 고양이 구하기 / 의사 = 청진기로 두근두근 + 아픈 곳 3군데 반창고 /
   요리사 = 국자로 수프 젓기 + 그릇에 세 번 떠 담아 손님에게 / 경찰관 = 멈춤 표지판으로 차 2대 세우기 + 호루라기 불며 오리 가족 건너기 /
   집배원 = (일 1) 편지 그림을 보고 같은 그림 우체통 3개에 넣기 (일 2) 자전거를 타고 가서 소포 그림과 같은 그림의 집 문에 배달 /
   농부 = (일 1) 삽으로 땅 파기 · 씨앗 심기 · 물뿌리개로 물 주기(닿은 만큼 싹이 자람) · 당근 3개 뽑아 토토에게 (일 2) 암탉 모이 주고 달걀 담기 /
   수의사 = (일 1) 청진기로 강아지 두근두근 · 아픈 발에 붕대 세 번 감기 (일 2) 물약을 스포이트로 세 방울 → 강아지가 폴짝폴짝.
   단계(levels): 1 = 소방관·의사, 옷 카드는 맞는 것만 / 2 = 요리사·경찰관, 옷 카드 3장 중 하나는 다른 직업 것(누르면 붙지 않고 이름을 말해 줌) /
   3 = 집배원·농부(일이 두 가지) / 4 = 수의사, 친구가 그림 말풍선으로 '도와주세요' → 알맞은 직업 카드 고르기(틀리면 "어?" 하고 다시 물어봄, 실패 없음) /
   5 = 가족 얼굴(ML.Faces)이 있으면 가족이 직업 옷을 입고 일함("엄마 소방관 출동!"). 얼굴이 없으면 늘 하던 인형.
   숫자와 문구는 MLCFG.games.jobs, motion, rules, shell, calm, touch, voice 에서 읽습니다. 그림은 모두 이 파일 안에서 그림(인형 그림은 clothes.js 의 방식을 옮겨 옴). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide)return;
const {say,sfx,tone,pick,shuffle,cap,games,actx,store}=M;
const {life,noise,SFX,sweepTone,siren}=P;
const id='jobs',GID='jobs',L=life(id),OL=A.OL||'#5B3A29';
const S3=`stroke="${OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},JB=(CF.games||{}).jobs||{},RULES=CF.rules||{},SHELL=CF.shell||{},VO=CF.voice||{},CALM=CF.calm||{},PAL=CALM.palette||{},MO=CF.motion||{};
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const PMAX=((MO.particles||{}).max)||40,PFADE=((MO.particles||{}).fadeMs)||800;
const CELEB=Object.assign({pieces:6,durationMs:1200},CALM.celebration||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const COLORS=(CALM.choiceColors||[]).map(c=>({ko:c.ko,en:c.en,hex:c.hex,light:c.light,vivid:c.vivid}));
const colorOf=en=>COLORS.find(c=>c.en===en)||COLORS[0];
/* colours the choice palette does not have (uniform navy, coat white) — calm on cards, strong on the child */
const NAVY={ko:'남색',en:'navy',hex:'#8C97BE',light:'#C9CFE6',vivid:'#3E56A6'};
const pal=k=>typeof k==='object'?k:colorOf(k);
const LOG=[];let SAID='';
const speak=(ko,en,q)=>{SAID=ko;LOG.push('say:'+ko);say(ko,en,q)};
const praise=()=>M.nextPraise?M.nextPraise():['잘했어!','Good job!'];
const iya=w=>w+(M.batchim&&M.batchim(w)?'이야':'야');
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------- jobs and levels (games.jobs.jobs / levels) ---------- */
const CJOBS=JB.jobs||[];
const BUILT=['firefighter','doctor','chef','police','mail','farmer','vet'];
const LEVELS=JB.levels&&JB.levels.length?JB.levels:[{level:1,new:'소방관·의사'}];
const jobOf=k=>CJOBS.find(j=>j.id===k)||{id:k,ko:k,en:k,wear:['','','']};
/* the jobs a level brings: the names written before the first comma of levels[].new (so '수의사' is not read as '의사', and '불이 났어요 → 소방관' is only an example) */
const levelJobs=l=>{const w=String(l.new||'').split(',')[0].split(/[^가-힣]+/);return CJOBS.filter(j=>w.includes(j.ko)).map(j=>j.id)};
/* a level counts as made when every job it brings is drawn here (a level without jobs, like the family faces, is made by this file) */
const MADE=(()=>{let n=0;for(const l of LEVELS){if(!levelJobs(l).every(j=>BUILT.includes(j)))break;n++}return Math.max(1,n)})();
/* what a level has: its jobs so far, the jobs it brings (fresh), and the extras it turns on */
function levelInfo(n){const f={level:n,jobs:[],fresh:[],decoy:false,two:false,ask:false,family:false};
  LEVELS.slice(0,n).forEach((l,i)=>{const t=l.new||'',js=levelJobs(l).filter(j=>BUILT.includes(j));js.forEach(j=>{if(!f.jobs.includes(j))f.jobs.push(j)});if(i===n-1)f.fresh=js;
    if(/골라내기|다른 직업/.test(t))f.decoy=true;if(/두 가지/.test(t))f.two=true;if(/도와주세요|알맞은 직업/.test(t))f.ask=true;if(/가족 얼굴/.test(t))f.family=true});
  if(!f.jobs.length)f.jobs=BUILT.slice(0,2);return f}
/* the doctor and the vet both make friends feel better: never offered side by side (job cards, other-job clothes) */
const PAIR={doctor:'vet',vet:'doctor'};
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
const DATA=Object.assign({level:1,done:0,last:''},store.get('mallang_jobs',{}));
const save=()=>store.set('mallang_jobs',DATA);
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(MADE,n))}
if(PRG())PRG().register(GID,{max:MADE,name:'직업 놀이',seg:'setJobsLv'});

/* ============================== the child doll (from clothes.js: viewBox 0 0 240 400) ============================== */
const VBW=240,VBH=400;
const ARM={l:{s:[91,172],h:[73,238]},r:{s:[149,172],h:[167,238]}},HAND={l:[72,245],r:[168,245]};
const LEG={l:{s:[106,238],a:[104,344]},r:{s:[134,238],a:[136,344]}},FOOT={l:[99,352],r:[141,352]};
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const line=(p,q,w,c,ow)=>`<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" stroke="${OL}" stroke-width="${w+(ow||6)}" stroke-linecap="round"/><path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const FACE='M120 36C164 36 182 66 182 98C182 134 154 158 120 158C86 158 58 134 58 98C58 66 76 36 120 36Z';
const TORSO='M94 162Q120 156 146 162Q158 166 157 182L153 236Q120 244 87 236L83 182Q82 166 94 162Z';
/* P19 art.volume: skin parts use the shared ball gradient of the skin colour; the arm leaves a soft shadow on the body, the head on the neck and collar */
const SKN=d=>A.vol.off?d.skin:A.vol.ball(d.skin,d.shade);
const ARMSH=a=>A.vol.off?'':`<path class="vol-under" d="M${a.s[0]} ${a.s[1]+2}L${a.h[0]} ${a.h[1]+2}" stroke="${OL}" stroke-width="20" stroke-linecap="round" opacity=".15"/>`;
const HEADSH_=()=>A.vol.off?'':`<ellipse class="vol-under" cx="120" cy="163" rx="24" ry="5.5" fill="${OL}" opacity=".14"/>`;
const HIP='M84 226Q120 234 156 226L159 260Q140 268 122 263L120 256L118 263Q100 268 81 260Z';
const blobs=(cs,fill,sw=5)=>cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${OL}" stroke="${OL}" stroke-width="${sw}"/>`).join('')+cs.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const star5=(x,y,r,f)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;d+=(i?'L':'M')+(x+q*Math.cos(a)).toFixed(1)+' '+(y+q*Math.sin(a)).toFixed(1)}return `<path d="${d}Z" fill="${f}"/>`};
const heart=(x,y,r,f,st)=>`<path d="M${x} ${y+r}C${x-r*1.6} ${y} ${x-r*1.3} ${y-r*1.2} ${x-r*.6} ${y-r*1.2}C${x-r*.25} ${y-r*1.2} ${x} ${y-r} ${x} ${y-r*.6}C${x} ${y-r} ${x+r*.25} ${y-r*1.2} ${x+r*.6} ${y-r*1.2}C${x+r*1.3} ${y-r*1.2} ${x+r*1.6} ${y} ${x} ${y+r}Z" fill="${f}" ${st||''}/>`;
const DOLLS=[
  {id:'mina',hair:'pigtails',hc:'#8A5634',hh:'#B07A52',skin:'#FFE6D6',shade:'#F3C7B1',eye:'#4E2E1E',iris:'#86573A',rib:'#E89AAE'},
  {id:'jun',hair:'short',hc:'#3D2B29',hh:'#6A4F4A',skin:'#F6D5B8',shade:'#E7B896',eye:'#3A2216',iris:'#6B4129',rib:'#8FC3E6'},
  {id:'sora',hair:'wavy',hc:'#B8682F',hh:'#DB955E',skin:'#DDA882',shade:'#C68C66',eye:'#43281A',iris:'#7A4A2A',rib:'#8FC48A'}
];
function hairBack(d){return A.vol.litAll(hairBack0(d))}
function hairBack0(d){
  if(d.hair==='pigtails')return blobs([[50,104,20],[44,128,18],[44,150,15],[190,104,20],[196,128,18],[196,150,15]],d.hc)+`<path d="M62 120C52 70 84 28 120 28C156 28 188 70 178 120Z" fill="${d.hc}" ${S3}/>`;
  if(d.hair==='wavy'){const cs=[];for(let i=0;i<=10;i++){const t=i/10;cs.push([54-6*Math.sin(t*9),100+t*120,16]);cs.push([186+6*Math.sin(t*9),100+t*120,16])}
    return blobs(cs,d.hc)+`<path d="M60 124C48 66 84 26 120 26C156 26 192 66 180 124Z" fill="${d.hc}" ${S3}/>`}
  return `<path d="M60 112C52 60 84 26 120 26C156 26 188 60 180 112Z" fill="${d.hc}" ${S3}/>`;
}
function hairFront(d){
  if(d.hair==='short')return `<path d="M58 104C52 56 84 30 120 30C156 30 188 56 182 104C176 88 168 78 160 72C152 82 136 80 128 68C118 82 98 84 88 72C78 80 66 90 58 104Z" fill="${d.hc}" ${S3}/><path d="M86 46Q100 36 116 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  if(d.hair==='wavy')return `<path d="M58 108C52 58 84 30 120 30C156 30 188 58 182 108C178 90 170 78 160 70C140 80 112 76 96 62C88 74 72 86 58 108Z" fill="${d.hc}" ${S3}/><path d="M92 44Q108 34 126 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  return `<path d="M58 106C52 58 84 30 120 30C156 30 188 58 182 106C178 92 170 82 162 76C154 84 140 82 132 72C124 84 108 84 100 72C92 82 72 88 58 106Z" fill="${d.hc}" ${S3}/><path d="M88 46Q102 36 118 36" stroke="${d.hh}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
function eyes(d,px){
  return ['l','r'].map(s=>{const ex=s==='l'?98:142,ey=106,k=s==='l'?-1:1;
    return `<g class="al-eye al-eye-${s} al-open"><g class="al-pupil"><ellipse cx="${ex}" cy="${ey}" rx="10" ry="12.5" fill="url(#${px}gi)" stroke="${OL}" stroke-width="2"/><circle cx="${ex-3.5}" cy="${ey-4.5}" r="4" fill="#fff"/><circle cx="${ex+3.6}" cy="${ey+5}" r="1.9" fill="#fff"/>${A.vol.glass(ex,ey,10,12.5)}</g>
      <path d="M${ex-11} ${ey-7}Q${ex} ${ey-17} ${ex+11} ${ey-7}" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>${d.hair!=='short'?`<path d="M${ex+k*10} ${ey-9}l${k*4} -3" stroke="${OL}" stroke-width="2.2" stroke-linecap="round"/>`:''}</g>
      <path class="al-lid al-lid-${s}" opacity="0" d="M${ex-12} ${ey}Q${ex} ${ey+7} ${ex+12} ${ey}" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>`}).join('');
}
function head(d,px){
  const ears=[58,182].map(x=>`<ellipse cx="${x}" cy="112" rx="8" ry="11" fill="${SKN(d)}" ${S3}/>`).join('');
  return `${hairBack(d)}${ears}<path d="${FACE}" fill="${SKN(d)}" ${S3}/>
    ${[88,152].map(x=>A.vol.off?`<ellipse cx="${x}" cy="128" rx="11" ry="7" fill="#FF9AAE" opacity=".45"/>`:`<ellipse cx="${x}" cy="128" rx="13" ry="8.5" fill="${A.vol.cheek('#FF9AAE')}" opacity=".85"/>`).join('')}
    ${eyes(d,px)}<path d="M118 121Q120 123 122 121" stroke="${d.shade}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g class="al-mouth"><path d="M111 131Q120 142 129 131Z" stroke="${OL}" stroke-width="2.6" fill="#F08A96" stroke-linejoin="round" stroke-linecap="round"/></g>
    <g class="al-mouth-o" opacity="0"><ellipse cx="120" cy="135" rx="6" ry="7.5" fill="#F08A96" ${S3}/></g>
    ${d.photo?`<clipPath id="${px}fc"><path d="${FACE}"/></clipPath><image class="jb-photo-face" href="${d.photo}" x="58" y="36" width="124" height="122" preserveAspectRatio="xMidYMid slice" clip-path="url(#${px}fc)"/><path d="${FACE}" fill="none" stroke="${OL}" stroke-width="3"/>`:''}
    ${A.vol.litAll(hairFront(d))}${A.vol.off?'':A.vol.shine(94,50,24,11,-24)}`;
}
/* level 5: a family face (ML.Faces, P4) on the doll — the photo in the face, the drawn hair in the family member's colour */
const famList=()=>{try{return M.Faces&&typeof M.Faces.list==='function'?M.Faces.list().filter(r=>r&&r.photo):[]}catch(e){return[]}};
const mixHex=(a,b,t)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const HEX6=/^#[0-9a-f]{6}$/i;
function famDoll(r){
  const L=(M.Faces.look&&M.Faces.look(r))||{},hs=L.hairStyle||'short',base=DOLLS[{long:2,bun:0,curl:1,short:1}[hs]!=null?{long:2,bun:0,curl:1,short:1}[hs]:1];
  const hc=HEX6.test(L.hair||'')?L.hair:base.hc,skin=HEX6.test(L.skin||'')?L.skin:base.skin;
  return Object.assign({},base,{id:'fam_'+r.id,hc,hh:mixHex(hc,'#FFFFFF',.3),skin,shade:mixHex(skin,'#C9906E',.35),photo:r.photo,fam:{id:r.id,ko:M.Faces.nameKo(r),en:M.Faces.nameEn(r)}});
}
const sleeve=(s,t,c,w=21)=>{const a=ARM[s];return line(a.s,lerp(a.s,a.h,t),w,c,5)};
const band=(s,t0,t1,c,w)=>{const a=ARM[s];return line(lerp(a.s,a.h,t0),lerp(a.s,a.h,t1),w,c,5)};
const legPiece=(s,t0,t1,c,w=28)=>{const g=LEG[s];return line(lerp(g.s,g.a,t0),lerp(g.s,g.a,t1),w,c,5)};
function shoe(s,c,l,kind){
  const [x,y]=FOOT[s],k=s==='l'?-1:1;
  const base=`<path d="M${x-15} ${y+2}Q${x-16} ${y-10} ${x} ${y-10}Q${x+16} ${y-10} ${x+15} ${y+2}Q${x+16} ${y+9} ${x} ${y+9}Q${x-16} ${y+9} ${x-15} ${y+2}Z"`;
  if(kind==='boot')return `<path d="M${x-13} 312H${x+13}L${x+14} ${y-6}Q${x+19} ${y} ${x+17} ${y+6}Q${x} ${y+12} ${x-17} ${y+6}Q${x-18} ${y-2} ${x-13} ${y-8}Z" fill="${c}" ${S3}/><path d="M${x-13} 324H${x+13}" stroke="${l}" stroke-width="6"/><path d="M${x-16} ${y+5}Q${x} ${y+10} ${x+16} ${y+5}" stroke="${OL}" stroke-width="4" fill="none"/>`;
  if(kind==='mj')return `${base} fill="${c}" ${S3}/><path d="M${x-9} ${y+1}Q${x} ${y+4} ${x+8} ${y}" stroke="#fff" stroke-width="2.2" fill="none" opacity=".45"/>`;
  return `${base} fill="${c}" ${S3}/><path d="M${x-15} ${y+4}Q${x} ${y+9} ${x+15} ${y+4}" stroke="#FFFDF9" stroke-width="4" fill="none"/><path d="M${x-6} ${y-8}l8 4M${x-2} ${y-9}l8 4" stroke="#FFFDF9" stroke-width="2.4" stroke-linecap="round"/>`;
}
/* everyday clothes under the uniform: a cream tee, sky shorts, pink sneakers */
const BASE=(()=>{const T='#FFF3E2',B='#A7CFE8';return{torso:`<path d="M90 160Q120 152 150 160Q162 165 160 184L157 244Q120 252 83 244L80 184Q78 165 90 160Z" fill="${T}" ${S3}/><path d="M106 160Q120 170 134 160" stroke="#E9C9A6" stroke-width="4" fill="none" stroke-linecap="round"/>${heart(120,204,7,'#F2B48C')}`,
  armL:sleeve('l',.34,T,24),armR:sleeve('r',.34,T,24),hip:`<path d="${HIP}" fill="${B}" ${S3}/>`,legL:legPiece('l',.05,.36,B,32),legR:legPiece('r',.05,.36,B,32),footL:shoe('l','#E8A0AE','#fff','sneak'),footR:shoe('r','#E8A0AE','#fff','sneak')}})();

/* ============================== uniforms and tools (모자 · 옷 · 도구), drawn to fit the doll ============================== */
const REF='#EEF3F6',GLOVE='#8A6A52',STEEL='#D9DDE3';
const refBand=(d)=>`<path d="${d}" stroke="${OL}" stroke-width="13" fill="none"/><path d="${d}" stroke="${REF}" stroke-width="8" fill="none"/>`;
const glove=s=>`<circle cx="${HAND[s][0]}" cy="${HAND[s][1]}" r="11" fill="${GLOVE}" ${S3}/>`;
const GEAR={
  firefighter:{
    hat:{en:'helmet',short:['모자','hat'],nc:true,cols:['red','yellow','orange'],vb:'24 14 192 104',d:(c,l)=>({hat:`<path d="M58 92Q56 30 120 24Q184 30 182 92Z" fill="${c}" ${S3}/>
      <path d="M120 27Q116 58 120 90" stroke="${OL}" stroke-opacity=".3" stroke-width="3" fill="none"/><path d="M76 50Q90 34 110 31" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>
      <path d="M40 92Q120 74 200 92Q216 100 208 110Q172 98 120 98Q68 98 32 110Q24 100 40 92Z" fill="${c}" ${S3}/>
      <path d="M102 40H138L142 60Q138 80 120 86Q102 80 98 60Z" fill="#FFF3C8" ${S3}/>${star5(120,60,10,c)}`})},
    top:{en:'fire suit',short:['옷','suit'],nc:true,cols:['yellow','orange','blue'],vb:'48 146 144 222',d:(c,l)=>({
      torso:`<path d="M86 158Q120 150 154 158Q168 164 166 186L170 266Q120 276 70 266L74 186Q72 164 86 158Z" fill="${c}" ${S3}/><path d="M120 166V270" stroke="${OL}" stroke-width="3" stroke-opacity=".55"/>
        ${[192,210].map(y=>`<rect x="113" y="${y}" width="14" height="6" rx="2" fill="#6B5A52"/>`).join('')}${refBand('M73 230Q120 242 167 230')}${refBand('M74 254Q120 266 167 254')}
        <path d="M98 156Q120 168 142 156L144 170Q120 182 96 170Z" fill="${c}" ${S3}/><path d="M84 190Q80 220 78 246" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>`,
      hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.84,c,30)+legPiece('l',.56,.64,REF,30),legR:legPiece('r',.05,.84,c,30)+legPiece('r',.56,.64,REF,30),
      footL:shoe('l','#6B5A52','#F0D58A','boot'),footR:shoe('r','#6B5A52','#F0D58A','boot'),
      armL:sleeve('l',.9,c,25)+band('l',.66,.76,REF,25)+glove('l'),armR:sleeve('r',.9,c,25)+band('r',.66,.76,REF,25)+glove('r')})},
    tool:{en:'hose',short:['호스','hose'],nc:false,cols:['red','sky blue','yellow'],vb:'136 168 104 206',hand:true,d:(c,l)=>{const hd='M170 252Q198 300 178 330Q158 356 194 364Q228 368 220 340Q214 322 198 330';
      return{handR:`<path d="${hd}" stroke="${OL}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${hd}" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>
        <g transform="translate(168 246) rotate(-28)"><rect x="-8" y="-10" width="16" height="22" rx="5" fill="${c}" ${S3}/><path d="M-7 -10L-5 -46H5L7 -10Z" fill="${STEEL}" ${S3}/><path d="M-9 -46H9L6 -60H-6Z" fill="#F0D58A" ${S3}/><rect x="4" y="-32" width="13" height="6" rx="3" fill="#F0D58A" ${S3}/></g>`}}}
  },
  doctor:{
    hat:{en:'head mirror',short:['머리 거울','head mirror'],nc:false,cols:['sky blue','mint','purple'],vb:'44 30 152 72',d:(c,l)=>({hat:`<path d="M58 88Q120 58 182 88" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M58 88Q120 58 182 88" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="120" cy="60" r="22" fill="${STEEL}" ${S3}/><circle cx="120" cy="60" r="15" fill="#CFE6F2" stroke="${OL}" stroke-width="2"/><path d="M110 54Q113 48 120 47" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="120" cy="60" r="3.5" fill="${OL}"/>`})},
    top:{en:'doctor coat',short:['옷','coat'],nc:false,cols:['sky blue','mint','pink'],vb:'50 146 140 222',d:(c,l)=>({
      torso:`<path d="M98 158L120 198L142 158Z" fill="${c}" ${S3}/>
        <path d="M86 158Q100 154 104 156L120 200L136 156Q140 154 154 158Q170 164 168 186L176 302Q150 310 128 304L122 204H118L112 304Q90 310 64 302L72 186Q70 164 86 158Z" fill="#FFFFFF" ${S3}/>
        <path d="M104 156L120 200L108 208L94 168Z" fill="#F1F3F5" ${S3}/><path d="M136 156L120 200L132 208L146 168Z" fill="#F1F3F5" ${S3}/>
        <rect x="78" y="250" width="24" height="20" rx="4" fill="#F1F3F5" ${S3}/><rect x="138" y="250" width="24" height="20" rx="4" fill="#F1F3F5" ${S3}/>
        <rect x="134" y="188" width="18" height="14" rx="3" fill="#F1F3F5" ${S3}/><path d="M140 180V192" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M140 180V192" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M80 214Q76 260 72 294" stroke="#E3E6EA" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.9,c,28),legR:legPiece('r',.05,.9,c,28),
      armL:sleeve('l',.9,'#FFFFFF',24)+band('l',.8,.9,'#F1F3F5',24),armR:sleeve('r',.9,'#FFFFFF',24)+band('r',.8,.9,'#F1F3F5',24)})},
    tool:{en:'stethoscope',short:['청진기','stethoscope'],nc:false,cols:['sky blue','pink','purple'],vb:'84 150 72 100',neck:true,d:(c,l)=>{const t='M98 162Q94 200 110 214Q120 220 130 214Q146 200 142 162';
      return{neck:`<path d="${t}" stroke="${OL}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${t}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M120 217V226" stroke="${OL}" stroke-width="7"/><path d="M120 217V226" stroke="${c}" stroke-width="3.5"/><circle cx="120" cy="234" r="10" fill="${STEEL}" ${S3}/><circle cx="120" cy="234" r="5" fill="#F4F6F8"/>
        <circle cx="98" cy="162" r="4" fill="${STEEL}" stroke="${OL}" stroke-width="2"/><circle cx="142" cy="162" r="4" fill="${STEEL}" stroke="${OL}" stroke-width="2"/>`}}}
  },
  chef:{
    hat:{en:'chef hat',short:['모자','hat'],nc:false,cols:['red','sky blue','green'],vb:'38 0 164 104',d:(c,l)=>({hat:`<path d="M66 84Q42 66 60 46Q60 20 88 24Q100 4 122 12Q146 0 156 26Q186 24 182 52Q198 70 174 84Z" fill="#FFFFFF" ${S3}/>
      <path d="M92 38Q96 58 94 78M120 32V78M148 38Q144 58 146 78" stroke="#E3E6EA" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="62" y="74" width="116" height="24" rx="9" fill="#FFFFFF" ${S3}/><path d="M66 90H174" stroke="${c}" stroke-width="5"/>`})},
    top:{en:'apron',short:['앞치마','apron'],nc:true,cols:['red','sky blue','green'],vb:'58 140 124 180',d:(c,l)=>({
      torso:`<path d="M102 170Q98 154 110 150M138 170Q142 154 130 150" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M102 170Q98 154 110 150M138 170Q142 154 130 150" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M98 170H142L146 232Q160 236 160 244L164 304Q120 314 76 304L80 244Q80 236 94 232Z" fill="${c}" ${S3}/>
        <path d="M80 236Q120 248 160 236" stroke="${OL}" stroke-width="8" fill="none"/><path d="M80 236Q120 248 160 236" stroke="${l}" stroke-width="4" fill="none"/>
        <g transform="translate(158 242)"><path d="M0 0L14 -8Q17 0 14 8Z" fill="${l}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M0 0L8 18L2 20Z" fill="${l}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/></g>
        <rect x="102" y="256" width="36" height="26" rx="7" fill="${l}" ${S3}/>${heart(120,268,6,c)}<path d="M84 250Q82 280 80 300" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>`})},
    tool:{en:'ladle',short:['국자','ladle'],nc:false,cols:['orange','green','blue'],vb:'132 144 66 172',hand:true,d:(c,l)=>({handR:`<path d="M184 164L162 286" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M184 164L162 286" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/>
      <path d="M184 164Q192 154 186 148" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M138 284Q160 278 184 286Q184 310 160 312Q138 310 138 284Z" fill="${STEEL}" ${S3}/><path d="M146 290Q160 296 176 290" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
      <rect x="170" y="182" width="14" height="40" rx="6" fill="${c}" ${S3} transform="rotate(10 177 202)"/>`})}
  },
  police:{
    hat:{en:'police cap',short:['모자','cap'],nc:false,cols:[NAVY],vb:'40 18 160 90',d:(c,l)=>({hat:`<path d="M54 80Q48 46 72 36Q120 18 168 36Q192 46 186 80Z" fill="${c}" ${S3}/>
      <rect x="58" y="72" width="124" height="16" rx="6" fill="#3E3A4F" ${S3}/><path d="M64 86Q120 76 176 86Q174 102 120 102Q66 102 64 86Z" fill="#3E3A4F" ${S3}/>
      <path d="M108 40H132L134 56Q130 68 120 72Q110 68 106 56Z" fill="#F0D58A" ${S3}/>${star5(120,54,6,'#FFF6C8')}<path d="M78 52Q94 38 112 36" stroke="#fff" stroke-width="5" opacity=".3" fill="none" stroke-linecap="round"/>`})},
    top:{en:'police uniform',short:['옷','uniform'],nc:false,cols:[NAVY],vb:'50 146 140 222',d:(c,l)=>({
      torso:`<path d="M88 158Q120 150 152 158Q166 164 164 186L160 252Q120 260 80 252L76 186Q74 164 88 158Z" fill="${c}" ${S3}/>
        <path d="M104 158L120 176L136 158Z" fill="#CFE5F4" ${S3}/><path d="M117 174H123L126 204L120 212L114 204Z" fill="#3E3A4F" ${S3}/>
        <path d="M86 168l18 -8M154 168l-18 -8" stroke="#3E3A4F" stroke-width="7" stroke-linecap="round"/>
        <path d="M136 180H152L151 194Q144 200 137 194Z" fill="#F0D58A" ${S3}/>
        ${[222,238].map(y=>`<circle cx="104" cy="${y}" r="3" fill="#F0D58A" stroke="${OL}" stroke-width="1.6"/>`).join('')}
        <path d="M78 248Q120 258 162 248" stroke="${OL}" stroke-width="10" fill="none"/><path d="M78 248Q120 258 162 248" stroke="#3E3A4F" stroke-width="6" fill="none"/>`,
      hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.9,c,28),legR:legPiece('r',.05,.9,c,28),footL:shoe('l','#4A4458','#fff','mj'),footR:shoe('r','#4A4458','#fff','mj'),
      armL:sleeve('l',.9,c,23)+band('l',.82,.9,'#3E3A4F',23),armR:sleeve('r',.9,c,23)+band('r',.82,.9,'#3E3A4F',23)})},
    tool:{en:'whistle',short:['호루라기','whistle'],nc:false,cols:['yellow','red','sky blue'],vb:'92 152 66 84',neck:true,d:(c,l)=>({neck:`<path d="M102 162Q104 196 124 210" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M102 162Q104 196 124 210" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M118 204H140Q150 204 150 215Q150 226 139 226Q128 226 126 217H118Z" fill="#E1E5EA" ${S3}/><circle cx="139" cy="215" r="4" fill="#B9BFC8"/>`})}
  },
  mail:{
    hat:{en:'mail cap',short:['모자','cap'],nc:true,cols:['red','green','blue'],vb:'40 18 164 96',d:(c,l)=>({hat:`<path d="M60 82Q56 28 120 24Q184 28 180 82Z" fill="${c}" ${S3}/>
      <path d="M120 26V80" stroke="${OL}" stroke-opacity=".25" stroke-width="3"/><path d="M78 52Q92 38 112 34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".45"/>
      <path d="M62 78Q120 68 178 78Q182 96 120 98Q58 96 62 78Z" fill="${c}" ${S3}/><path d="M70 86Q120 78 170 86" stroke="${OL}" stroke-opacity=".22" stroke-width="3" fill="none"/>
      <rect x="102" y="40" width="36" height="25" rx="5" fill="#FFFDF9" ${S3}/><path d="M104 43L120 55L136 43" stroke="${OL}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`})},
    top:{en:'mail vest',short:['조끼','vest'],nc:true,cols:['red','orange','green'],vb:'50 146 140 222',d:(c,l)=>({
      torso:`<path d="M88 160Q100 155 107 157L114 200L112 247Q96 249 82 245L79 186Q77 166 88 160Z" fill="${c}" ${S3}/><path d="M152 160Q140 155 133 157L126 200L128 247Q144 249 158 245L161 186Q163 166 152 160Z" fill="${c}" ${S3}/>
        ${refBand('M81 226Q97 230 112 228')}${refBand('M128 228Q143 230 159 226')}
        <rect x="86" y="194" width="22" height="18" rx="3" fill="${l}" ${S3}/><path d="M88 196L97 203L106 196" stroke="${OL}" stroke-width="2" fill="none"/>
        <path d="M86 176Q84 200 84 220" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>`,
      hip:`<path d="${HIP}" fill="#8C97BE" ${S3}/>`,legL:legPiece('l',.05,.88,'#8C97BE',28),legR:legPiece('r',.05,.88,'#8C97BE',28),footL:shoe('l','#6B5A52','#fff','mj'),footR:shoe('r','#6B5A52','#fff','mj')})},
    tool:{en:'mail bag',short:['가방','bag'],nc:false,cols:['yellow','orange','sky blue'],vb:'86 150 118 136',d:(c,l)=>({front:`<path d="M98 160Q132 196 168 232" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M98 160Q132 196 168 232" stroke="${c}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <g transform="rotate(-10 162 226)"><rect x="146" y="210" width="32" height="22" rx="3" fill="#FFFDF9" stroke="${OL}" stroke-width="2.4"/><path d="M148 212L162 222L176 212" stroke="${OL}" stroke-width="2" fill="none"/></g>
      <path d="M140 230H194Q199 230 199 236V271Q199 279 191 279H144Q136 279 136 271V236Q136 230 140 230Z" fill="${c}" ${S3}/>
      <path d="M136 234Q136 228 142 228H193Q199 228 199 234V240Q167 256 136 240Z" fill="${l}" ${S3}/><circle cx="167" cy="246" r="4.5" fill="#F0D58A" stroke="${OL}" stroke-width="2"/>
      <path d="M142 252Q142 266 146 274" stroke="#fff" stroke-width="3.5" opacity=".4" fill="none" stroke-linecap="round"/>`})}
  },
  farmer:{
    hat:{en:'straw hat',short:['밀짚모자','straw hat'],nc:false,cols:['red','sky blue','green'],vb:'14 8 212 100',d:(c,l)=>({hat:`<ellipse cx="120" cy="82" rx="102" ry="17" fill="#EED692" ${S3}/>
      <path d="M36 84Q120 100 204 84M50 76Q120 88 190 76" stroke="#D6B565" stroke-width="2.5" fill="none" opacity=".8"/>
      <path d="M70 84Q66 28 120 26Q174 28 170 84Z" fill="#F4DE9E" ${S3}/><path d="M84 44Q120 36 156 44M78 60Q120 52 162 60" stroke="#D6B565" stroke-width="2.5" fill="none" opacity=".8"/>
      <path d="M70 70Q120 80 170 70L170 84Q120 94 70 84Z" fill="${c}" ${S3}/><path d="M86 40Q98 32 112 30" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>`})},
    top:{en:'overalls',short:['멜빵바지','overalls'],nc:true,cols:['blue','green','orange'],vb:'50 146 140 222',d:(c,l)=>({
      torso:`<path d="M98 160L104 202M142 160L136 202" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M98 160L104 202M142 160L136 202" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M98 196H142L145 234H95Z" fill="${c}" ${S3}/><rect x="108" y="204" width="24" height="16" rx="4" fill="${l}" stroke="${OL}" stroke-width="2.4"/>
        ${[104,136].map(x=>`<circle cx="${x}" cy="200" r="4" fill="#F0D58A" stroke="${OL}" stroke-width="1.8"/>`).join('')}`,
      hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.86,c,30)+`<rect x="94" y="290" width="16" height="16" rx="3" fill="${l}" stroke="${OL}" stroke-width="2" transform="rotate(-6 102 298)"/>`,legR:legPiece('r',.05,.86,c,30),
      footL:shoe('l','#A97C5A','#D9BFA6','boot'),footR:shoe('r','#A97C5A','#D9BFA6','boot')})},
    tool:{en:'watering can',short:['물뿌리개','watering can'],nc:false,cols:['green','sky blue','yellow'],vb:'130 210 110 104',hand:true,d:(c,l)=>({handR:`<path d="M194 264L222 236" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M194 264L222 236" stroke="${c}" stroke-width="6.5" stroke-linecap="round"/>
      <ellipse cx="225" cy="232" rx="10" ry="6.5" fill="${c}" ${S3} transform="rotate(-45 225 232)"/>
      <path d="M156 252Q173 222 190 252" stroke="${OL}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M156 252Q173 222 190 252" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M150 250H197L193 296Q191 305 182 305H165Q156 305 154 296Z" fill="${c}" ${S3}/><path d="M152 262H195" stroke="${l}" stroke-width="5"/>
      <path d="M160 270Q158 284 162 296" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>`})}
  },
  vet:{
    hat:{en:'headband',short:['머리띠','headband'],nc:false,cols:['pink','mint','purple'],vb:'44 30 152 72',d:(c,l)=>({hat:`<path d="M58 88Q120 58 182 88" stroke="${OL}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M58 88Q120 58 182 88" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="146" cy="62" r="18" fill="#FFFDF9" ${S3}/>${PAW(146,64,1,c)}`})},
    top:{en:'vet scrubs',short:['가운','scrubs'],nc:true,cols:['mint','sky blue','purple'],vb:'50 146 140 222',d:(c,l)=>({
      torso:`<path d="M86 158Q120 150 154 158Q168 164 166 186L164 262Q120 272 76 262L74 186Q72 164 86 158Z" fill="${c}" ${S3}/>
        <path d="M102 157L120 184L138 157Z" fill="#FFF3E2" ${S3}/><path d="M100 158L120 188L140 158" stroke="${l}" stroke-width="4" fill="none"/>
        <rect x="128" y="196" width="24" height="22" rx="4" fill="${l}" ${S3}/>${PAW(140,208,.62,c)}
        <path d="M84 192Q80 224 80 252" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>`,
      hip:`<path d="${HIP}" fill="${c}" ${S3}/>`,legL:legPiece('l',.05,.9,c,28),legR:legPiece('r',.05,.9,c,28),
      armL:sleeve('l',.5,c,24)+band('l',.42,.5,l,24),armR:sleeve('r',.5,c,24)+band('r',.42,.5,l,24)})},
    tool:{en:'stethoscope',short:['청진기','stethoscope'],nc:false,cols:['pink','purple','yellow'],vb:'84 150 72 104',neck:true,d:(c,l)=>{const t='M98 162Q94 200 110 214Q120 220 130 214Q146 200 142 162';
      return{neck:`<path d="${t}" stroke="${OL}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${t}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M120 217V226" stroke="${OL}" stroke-width="7"/><path d="M120 217V226" stroke="${c}" stroke-width="3.5"/>${heart(120,238,10,STEEL,S3)}${heart(120,238,5,'#F4F6F8')}
        <circle cx="98" cy="162" r="4" fill="${STEEL}" stroke="${OL}" stroke-width="2"/><circle cx="142" cy="162" r="4" fill="${STEEL}" stroke="${OL}" stroke-width="2"/>`}}}
  }
};
/* a paw print (vet pictures) */
function PAW(x,y,k,f){return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="3" rx="7.5" ry="6.5" fill="${f}"/>${[[-8,-6],[-3,-11],[3,-11],[8,-6]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="3.2" fill="${f}"/>`).join('')}</g>`}
const SLOTS=['hat','top','tool'];
const gearOf=(job,slot)=>((GEAR[job]||{})[slot])||null;
const itemKo=(job,slot)=>(jobOf(job).wear||[])[SLOTS.indexOf(slot)]||'';
function pieces(job,wear,vivid,skip){
  const out={back:'',legL:'',legR:'',footL:'',footR:'',hip:'',torso:'',neck:'',front:'',armL:'',armR:'',handR:'',hat:''};
  Object.keys(BASE).forEach(k=>{out[k]+=A.vol.litAll(BASE[k])});
  if(job)['top','tool','hat'].forEach(slot=>{const w=wear[slot];if(!w||skip===slot)return;const it=gearOf(job,slot);if(!it)return;const p=pal(w.col),pc=it.d(vivid?p.vivid:p.hex,p.light);
    Object.keys(pc).forEach(k=>{out[k]+=`<g data-slot="${slot}">${A.vol.litAll(pc[k])}</g>`})});   // P19 art.volume.objects: clothes get the same light and shade
  return out;
}
let UID=0;
function doll(d,job,wear={},o={}){
  const px='jb'+(++UID)+'_',p=pieces(job,wear,o.vivid!==false,o.skip);
  const legs=['l','r'].map(s=>{const g=LEG[s],K=s.toUpperCase();return `<g class="jb-leg jb-leg-${s}">${line(g.s,g.a,18,d.skin,6)}${A.vol.limb(g.s,g.a,18)}<ellipse cx="${FOOT[s][0]}" cy="${FOOT[s][1]}" rx="12" ry="7" fill="${SKN(d)}" ${S3}/>${p['leg'+K]}${p['foot'+K]}</g>`}).join('');
  const arms=['l','r'].map(s=>{const a=ARM[s],K=s.toUpperCase();return `<g class="al-arm al-arm-${s} jb-arm"><g class="al-arm-s">${ARMSH(a)}${line(a.s,a.h,14,d.skin,6)}${A.vol.limb(a.s,a.h,14)}<circle cx="${HAND[s][0]}" cy="${HAND[s][1]}" r="9" fill="${SKN(d)}" ${S3}/>${p['arm'+K]}${s==='r'?p.handR:''}</g></g>`}).join('');
  return `<svg viewBox="${o.vb||'0 0 240 400'}" style="overflow:visible"><defs><radialGradient id="${px}gi" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${d.iris}"/><stop offset="1" stop-color="${d.eye}"/></radialGradient></defs>
    ${A.vol.ground(120,366,58,9)}
    <g class="al-root" style="transform-origin:50% 92%"><g class="al-breathe" style="transform-origin:50% 92%">${p.back}${legs}
    <g class="jb-torso"><path d="M111 148H129V168H111Z" fill="${SKN(d)}" ${S3}/><path d="${TORSO}" fill="${SKN(d)}" ${S3}/>${p.hip}${p.torso}${p.neck}${p.front}${HEADSH_()}</g>
    ${arms}<g class="al-head" style="transform-origin:50% 40%"><g class="al-head-s" style="transform-origin:50% 40%"><g class="jb-head">${head(d,px)}${p.hat}</g></g></g>
    </g></g></svg>`;
}
/* the head alone (for the vehicle window) */
function headSVG(d,job,wear){const px='jb'+(++UID)+'_',p=pieces(job,wear,true);return `<defs><radialGradient id="${px}gi" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${d.iris}"/><stop offset="1" stop-color="${d.eye}"/></radialGradient></defs>${head(d,px)}${p.hat}`}
function cardSVG(job,slot,col,vivid){const it=gearOf(job,slot),p=pal(col),pc=it.d(vivid?p.vivid:p.hex,p.light);const order=['legL','legR','footL','footR','hip','torso','neck','front','armL','armR','handR','hat'];
  return `<svg viewBox="${it.vb}" preserveAspectRatio="xMidYMid meet" style="overflow:visible">${order.map(k=>pc[k]||'').join('')}</svg>`}
const fullWear=job=>Object.fromEntries(SLOTS.map(s=>[s,{col:gearOf(job,s).cols[0]}]));
function jobCardSVG(job,d){return doll(d||DOLLS[0],job,fullWear(job),{vivid:false,vb:'14 6 212 300'})}

/* ============================== pictures: tools that follow the finger (with a small face, touch.tool.face) ============================== */
const TFACE=(x,y,s=1)=>`<g class="tf"><ellipse class="tf-eye" cx="${x-7*s}" cy="${y}" rx="${2.6*s}" ry="${3.4*s}" fill="${OL}"/><ellipse class="tf-eye" cx="${x+7*s}" cy="${y}" rx="${2.6*s}" ry="${3.4*s}" fill="${OL}"/><path class="tf-grin" d="M${x-5*s} ${y+5*s}Q${x} ${y+10*s} ${x+5*s} ${y+5*s}" stroke="${OL}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
const TOOL={
  hose:`<svg viewBox="0 0 100 100"><path d="M50 2Q52 -30 90 -40" stroke="${OL}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M50 2Q52 -30 90 -40" stroke="#E0786F" stroke-width="9" fill="none" stroke-linecap="round"/>
    <rect x="36" y="0" width="28" height="22" rx="8" fill="#E0786F" ${S3}/><path d="M38 22L42 78H58L62 22Z" fill="${STEEL}" ${S3}/><path d="M38 78H62L58 96H42Z" fill="#F0D58A" ${S3}/><rect x="58" y="34" width="22" height="9" rx="4" fill="#F0D58A" ${S3}/>${TFACE(50,48,.9)}</svg>`,
  hoseUse:`<svg viewBox="0 0 100 100"><rect x="36" y="0" width="28" height="22" rx="8" fill="#E0786F" ${S3}/><path d="M38 22L42 78H58L62 22Z" fill="${STEEL}" ${S3}/><path d="M38 78H62L58 96H42Z" fill="#F0D58A" ${S3}/><rect x="58" y="34" width="22" height="9" rx="4" fill="#F0D58A" ${S3}/>${TFACE(50,48,.9)}</svg>`,
  scope:`<svg viewBox="0 0 100 100"><path d="M50 60Q50 20 30 4M50 60Q50 20 72 0" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M50 60Q50 20 30 4M50 60Q50 20 72 0" stroke="#8FC3E6" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="76" r="20" fill="${STEEL}" ${S3}/><circle cx="50" cy="76" r="12" fill="#F4F6F8" stroke="${OL}" stroke-width="2"/>${TFACE(50,75,.75)}</svg>`,
  ladle:`<svg viewBox="0 0 100 100"><path d="M72 4L56 70" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M72 4L56 70" stroke="${STEEL}" stroke-width="6" stroke-linecap="round"/><rect x="62" y="4" width="15" height="30" rx="7" fill="#EDA468" ${S3} transform="rotate(14 70 19)"/>
    <path d="M24 66Q50 60 78 68Q78 96 50 98Q24 96 24 66Z" fill="${STEEL}" ${S3}/><path d="M32 72Q50 78 70 72" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>${TFACE(51,84,.8)}</svg>`,
  sign:`<svg viewBox="0 0 100 100"><rect x="45" y="56" width="10" height="46" rx="4" fill="#C9A98A" ${S3}/><path d="M30 6H70L92 28V60L70 82H30L8 60V28Z" fill="#E0786F" ${S3}/><path d="M34 14H66L84 32V56L66 74H34L16 56V32Z" fill="none" stroke="#fff" stroke-width="4"/>
    <path d="M38 58V36Q38 32 42 32Q46 32 46 36V30Q46 26 50 26Q54 26 54 30V34Q54 30 58 30Q62 30 62 34V48Q66 44 68 48Q68 54 62 60Q58 64 50 64H46Q38 64 38 58Z" fill="#FFF6E8" stroke="${OL}" stroke-width="2"/>${TFACE(50,46,.6).replace(/class="tf"/,'class="tf" opacity="0"')}</svg>`
};
/* tray pictures for the tap steps */
const LADDER=`<svg viewBox="0 0 100 100"><g transform="rotate(14 50 50)"><rect x="28" y="2" width="9" height="96" rx="4" fill="#E0786F" ${S3}/><rect x="63" y="2" width="9" height="96" rx="4" fill="#E0786F" ${S3}/>${[14,32,50,68,86].map(y=>`<rect x="34" y="${y}" width="32" height="6" rx="3" fill="${STEEL}" stroke="${OL}" stroke-width="2"/>`).join('')}</g></svg>`;
const PLASTER=(rot=0)=>`<svg viewBox="-34 -34 68 68"><g transform="rotate(${rot})"><rect x="-30" y="-12" width="60" height="24" rx="12" fill="#F3D6B4" ${S3}/><rect x="-10" y="-9" width="20" height="18" rx="4" fill="#FBEBD8"/>${[-22,-16,16,22].map(x=>`<circle cx="${x}" cy="-4" r="1.5" fill="#D9B48C"/><circle cx="${x}" cy="4" r="1.5" fill="#D9B48C"/>`).join('')}</g></svg>`;
const PLASTER_BOX=`<svg viewBox="0 0 100 100"><rect x="12" y="34" width="76" height="54" rx="10" fill="#F7E8B8" ${S3}/>${heart(50,61,10,'#E89AAE')}<g transform="translate(50 26) rotate(-12)"><rect x="-30" y="-11" width="60" height="22" rx="11" fill="#F3D6B4" ${S3}/><rect x="-9" y="-8" width="18" height="16" rx="4" fill="#FBEBD8"/></g></svg>`;
const BOWL=(lv=0,soup='#FF9A3C')=>`<svg viewBox="0 0 100 70"><ellipse cx="50" cy="64" rx="34" ry="5" fill="rgba(91,58,41,.15)"/><path d="M8 24H92Q90 60 50 62Q10 60 8 24Z" fill="#FFFDF9" ${S3}/>${lv>0?`<ellipse cx="50" cy="${(30-lv*6).toFixed(1)}" rx="${(36+lv*3).toFixed(1)}" ry="7" fill="${soup}" stroke="${OL}" stroke-width="2"/>`:''}<ellipse cx="50" cy="24" rx="42" ry="9" fill="none" ${S3}/><path d="M20 40Q50 52 80 40" stroke="#A7CFE8" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
const WHISTLE=`<svg viewBox="0 0 100 100"><path d="M18 20Q30 60 54 62" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M18 20Q30 60 54 62" stroke="#F0D58A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M40 48H74Q90 48 90 66Q90 84 72 84Q56 84 54 70H40Z" fill="#E1E5EA" ${S3}/><circle cx="72" cy="66" r="7" fill="#B9BFC8"/><path d="M74 34Q84 26 92 30M78 40Q90 38 96 44" stroke="#A7CFE8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
const STAMP_ICON=`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#FBE3E3" stroke="#E0786F" stroke-width="7"/>${heart(50,52,16,'#E0786F')}</svg>`;

/* ============================== backgrounds and set pieces (종이 공예 겹, calm) ============================== */
const PF='filter="url(#jbPaper)"';
const PAPER_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="jbPaper" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".2"/></filter></defs></svg>`;
const bgSVG=(inner,ar)=>`<svg viewBox="0 0 400 520" preserveAspectRatio="${ar||'xMidYMid slice'}">${inner}</svg>`;
const BG={
  locker:`<rect width="400" height="520" fill="#F4E9DE"/>
    <g ${PF}><rect x="-8" y="70" width="104" height="330" rx="10" fill="#C9D9E6"/></g>${[0,1].map(i=>`<rect x="${4+i*46}" y="82" width="40" height="300" rx="6" fill="#D6E3EE"/><path d="M${12+i*46} 100h24M${12+i*46} 108h24M${12+i*46} 116h24" stroke="#B8CBDA" stroke-width="3" stroke-linecap="round"/><rect x="${34+i*46}" y="220" width="5" height="26" rx="2.5" fill="#A9BCCB"/>`).join('')}
    <g ${PF}><rect x="304" y="70" width="104" height="330" rx="10" fill="#E9D3C5"/></g>${[0,1].map(i=>`<rect x="${314+i*46}" y="82" width="40" height="300" rx="6" fill="#F1E0D5"/><path d="M${322+i*46} 100h24M${322+i*46} 108h24M${322+i*46} 116h24" stroke="#DEC5B5" stroke-width="3" stroke-linecap="round"/><rect x="${318+i*46}" y="220" width="5" height="26" rx="2.5" fill="#D3B8A6"/>`).join('')}
    <g ${PF}><rect x="138" y="36" width="124" height="104" rx="52" fill="#D9BFA6"/></g><rect x="146" y="44" width="108" height="88" rx="44" fill="#D8EBF2"/><circle cx="226" cy="70" r="12" fill="#F7E8B8"/><path d="M146 116Q180 92 210 108Q236 96 254 112V132H146Z" fill="#B5D6AC"/>
    <g ${PF}><rect x="0" y="396" width="400" height="124" fill="#E7D3BF"/></g><path d="M0 396H400" stroke="#DCC2A8" stroke-width="6"/><g ${PF}><ellipse cx="200" cy="472" rx="150" ry="22" fill="#EAC7B4"/></g>
    <g ${PF}><rect x="100" y="366" width="64" height="10" rx="4" fill="#C9A98A"/><rect x="236" y="366" width="64" height="10" rx="4" fill="#C9A98A"/></g>`,
  fire:`<rect width="400" height="520" fill="#F4E4D8"/><circle cx="330" cy="70" r="26" fill="#F7E1C2"/><g ${PF}><path d="M-20 330Q80 270 180 310Q280 260 420 300V520H-20Z" fill="#D6E3CC"/></g>
    <g ${PF}><rect y="410" width="400" height="110" fill="#D8D1C6"/></g><rect y="398" width="400" height="16" fill="#EADFCF"/><path d="M0 470H400" stroke="#EFE8DC" stroke-width="6" stroke-dasharray="34 26"/>`,
  clinic:`<rect width="400" height="520" fill="#E3F0EA"/><g ${PF}><rect x="150" y="40" width="110" height="96" rx="12" fill="#D9BFA6"/></g><rect x="158" y="48" width="94" height="80" rx="8" fill="#DCEEF5"/><path d="M158 112Q190 92 216 106Q236 96 252 108V128H158Z" fill="#B5D6AC"/>
    <g ${PF}><rect x="286" y="60" width="92" height="12" rx="5" fill="#C9A98A"/></g><g ${PF}><rect x="294" y="32" width="18" height="28" rx="5" fill="#F3C6C1"/><rect x="318" y="40" width="16" height="20" rx="5" fill="#CFE5F4"/><rect x="340" y="28" width="20" height="32" rx="6" fill="#F7E8B8"/></g>
    <g ${PF}><rect x="30" y="54" width="80" height="90" rx="10" fill="#FFFDF9"/></g>${heart(70,98,18,'#F3C6C1')}
    <g ${PF}><rect y="396" width="400" height="124" fill="#E8DCCB"/></g><path d="M0 396H400" stroke="#DCCBB4" stroke-width="6"/>`,
  kitchen:`<rect width="400" height="520" fill="#F6E9DA"/><g ${PF}><rect x="30" y="40" width="100" height="90" rx="12" fill="#D9BFA6"/></g><rect x="38" y="48" width="84" height="74" rx="8" fill="#DCEEF5"/><circle cx="104" cy="70" r="10" fill="#F7E8B8"/>
    <g ${PF}><rect x="160" y="90" width="210" height="10" rx="4" fill="#C9A98A"/></g><g ${PF}><rect x="172" y="56" width="26" height="34" rx="8" fill="#F3C6C1"/><rect x="206" y="62" width="22" height="28" rx="7" fill="#CFE6CB"/><rect x="236" y="52" width="30" height="38" rx="9" fill="#F7E8B8"/><circle cx="292" cy="74" r="14" fill="#F8D9BD"/></g>
    <g ${PF}><rect y="330" width="400" height="190" fill="#E9D7C2"/></g><g ${PF}><rect y="322" width="400" height="18" rx="4" fill="#D9BFA6"/></g>`,
  street:`<rect width="400" height="520" fill="#E3EEDC"/><rect y="0" width="400" height="128" fill="#DCEAD3"/>${[[40,70],[120,52],[300,64],[360,40]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="26" fill="#C3DDB9"/><rect x="${x-4}" y="${y+18}" width="8" height="24" fill="#C9A98A"/>`).join('')}
    <rect y="128" width="400" height="38" fill="#EEE4D4"/><rect y="164" width="400" height="182" fill="#C9C6C2"/><rect y="344" width="400" height="38" fill="#EEE4D4"/><rect y="380" width="400" height="140" fill="#DCEAD3"/>
    <path d="M0 255H400" stroke="#F4F1EA" stroke-width="5" stroke-dasharray="26 22"/>${[0,1,2,3,4,5].map(i=>`<rect x="162" y="${172+i*29}" width="76" height="17" rx="3" fill="#FAF8F3"/>`).join('')}`
};
/* the burning house (viewBox 0 0 300 340) */
const win=(x,y)=>`<g ${PF}><rect x="${x-32}" y="${y-28}" width="64" height="56" rx="7" fill="#E3C6A8"/></g><rect x="${x-25}" y="${y-21}" width="50" height="42" rx="4" fill="#F8E6C4"/><path d="M${x} ${y-21}V${y+21}M${x-25} ${y}H${x+25}" stroke="#E3C6A8" stroke-width="5"/>`;
const HOUSE=`<svg viewBox="0 0 300 340" style="overflow:visible"><g ${PF}><rect x="204" y="20" width="30" height="56" rx="3" fill="#B87566"/></g><g ${PF}><rect x="28" y="86" width="244" height="248" rx="6" fill="#F3DCC4"/></g>
  <g ${PF}><path d="M6 98L150 10L294 98Z" fill="#C98A7A"/></g><path d="M40 84L150 18L260 84" stroke="#D9A190" stroke-width="5" fill="none" opacity=".6"/>
  ${win(78,148)}${win(222,148)}${win(78,256)}<g ${PF}><rect x="174" y="226" width="58" height="108" rx="28" fill="#B9876A"/></g><circle cx="218" cy="282" r="5" fill="#F0D58A"/>
  <g ${PF}><rect x="44" y="286" width="68" height="14" rx="5" fill="#C9A98A"/></g>${[56,72,88,102].map((x,i)=>`<circle cx="${x}" cy="284" r="6" fill="${['#F3C6C1','#F7E8B8','#CFE5F4','#F3C6C1'][i]}"/>`).join('')}</svg>`;
const FIRE_SPOTS=[[78,170],[222,170],[78,278],[203,262]];
const FLAME=`<svg viewBox="-50 -106 100 114" style="overflow:visible"><g class="jb-smoke">${[[-8,-112,12],[10,-128,10],[-2,-146,8]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#C9C1BA" opacity=".55"/>`).join('')}</g><g class="jb-flame">
  <path d="M0 6C-34 6 -44 -22 -30 -46C-24 -34 -18 -32 -16 -36C-20 -60 -6 -84 8 -98C6 -76 22 -70 26 -54C30 -60 30 -66 28 -72C44 -54 46 -28 34 -12C28 0 16 6 0 6Z" fill="#F08A4B" ${S3}/>
  <path d="M0 4C-20 4 -26 -14 -18 -30C-14 -22 -10 -22 -9 -26C-10 -42 0 -56 8 -64C8 -50 18 -44 20 -32C24 -18 18 4 0 4Z" fill="#F7B65A"/><path d="M0 2C-10 2 -12 -8 -8 -16C-4 -10 0 -12 0 -18C4 -14 10 -8 8 -2C6 2 3 2 0 2Z" fill="#FCE3A0"/></g></svg>`;
const SOOT=`<svg viewBox="-50 -60 100 66"><ellipse cx="0" cy="-10" rx="30" ry="14" fill="#B9AFA6" opacity=".45"/><ellipse cx="-10" cy="-18" rx="14" ry="8" fill="#A69C93" opacity=".35"/></svg>`;
/* the clinic bed (viewBox 0 0 300 170) */
const BED=`<svg viewBox="0 0 300 170"><g ${PF}><rect x="8" y="40" width="22" height="126" rx="8" fill="#D9BFA6"/><rect x="270" y="70" width="22" height="96" rx="8" fill="#D9BFA6"/></g><g ${PF}><rect x="10" y="92" width="280" height="48" rx="16" fill="#FFFDF9"/></g><g ${PF}><path d="M80 96H290V132Q290 140 280 140H80Z" fill="#BFE0D6"/></g><path d="M80 112H290" stroke="#D6EEE6" stroke-width="5"/><g ${PF}><rect x="26" y="70" width="70" height="34" rx="16" fill="#FFFFFF"/></g></svg>`;
const SORE=`<svg viewBox="-20 -20 40 40"><ellipse rx="14" ry="10" fill="#F3A7A0" opacity=".85"/><path d="M-7 -3h14M-5 3h10" stroke="#E0786F" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const BEAR_SPOTS=[[84,52],[50,184],[150,186],[78,216],[124,218]];
const CHEST=[[86,170],[114,170],[100,182],[86,196],[114,196],[100,206]];
/* the stove and pot */
const STOVE=`<svg viewBox="0 0 240 120"><g ${PF}><rect x="10" y="10" width="220" height="104" rx="12" fill="#E1E5EA"/></g><rect x="10" y="10" width="220" height="16" rx="6" fill="#C9CED6"/>${[60,120,180].map(x=>`<circle cx="${x}" cy="74" r="12" fill="#FFFDF9" stroke="${OL}" stroke-width="2.4"/><path d="M${x} 66V74" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`).join('')}
  <path d="M70 6Q74 -4 80 6M110 4Q116 -8 122 4M152 6Q158 -4 164 6" stroke="#8FC3E6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
const POT_CELLS=[[.34,.24],[.5,.2],[.66,.24],[.28,.33],[.42,.33],[.58,.33],[.72,.33],[.5,.4]];
const VEG=[(x,y)=>`<circle cx="${x}" cy="${y}" r="7" fill="#F2A55A" stroke="${OL}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#F8C98E"/>`,(x,y)=>`<circle cx="${x}" cy="${y}" r="4.5" fill="#9CC98A" stroke="${OL}" stroke-width="1.8"/>`,(x,y)=>`<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="3" fill="#F7E3B0" stroke="${OL}" stroke-width="1.8"/>`];
function potSVG(){
  const cells=POT_CELLS.map(([fx,fy],i)=>{const x=fx*240,y=fy*200;return `<g class="jb-pc" data-i="${i}"><ellipse class="jb-soup" cx="${x}" cy="${y}" rx="30" ry="12" fill="#FF9A3C" opacity="0"/><g class="jb-veg" style="transform-origin:${x}px ${y}px;transform-box:view-box">${VEG[i%3](x-9,y-2)}${VEG[(i+1)%3](x+9,y+3)}</g></g>`}).join('');
  return `<svg viewBox="0 0 240 200" style="overflow:visible"><defs><clipPath id="jbPotClip"><ellipse cx="120" cy="62" rx="96" ry="34"/></clipPath></defs>
    <g class="jb-steam" opacity=".25">${[80,120,160].map((x,i)=>`<path d="M${x} 40Q${x-10} 20 ${x} 2Q${x+10} -16 ${x} -34" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`).join('')}</g>
    <path d="M14 62Q8 50 22 50" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M226 62Q232 50 218 50" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M22 62H218L208 168Q206 188 186 190H54Q34 188 32 168Z" fill="#E0786F" ${S3}/><path d="M40 90Q36 140 44 174" stroke="#fff" stroke-width="6" opacity=".35" fill="none" stroke-linecap="round"/>
    <ellipse cx="120" cy="62" rx="100" ry="38" fill="#C35F57" ${S3}/><g clip-path="url(#jbPotClip)"><ellipse class="jb-broth" cx="120" cy="64" rx="98" ry="34" fill="#F6DDB8"/>${cells}
    <g class="jb-swirl" style="transform-origin:120px 64px;transform-box:view-box"><path d="M120 64m-60 0a60 20 0 1 1 120 0a44 15 0 1 1 -88 0a28 9 0 1 1 56 0" stroke="#fff" stroke-width="4" fill="none" opacity=".0" stroke-linecap="round"/></g></g></svg>`;
}
/* ducks and cars for the crossing */
const DUCK=(big)=>{const b=big?'#FFFDF9':'#FFE27A',w=big?'#EDE6DA':'#F6CF5A';return `<svg viewBox="-40 -50 80 80" style="overflow:visible"><ellipse cx="0" cy="26" rx="26" ry="5" fill="rgba(91,58,41,.15)"/><g class="jb-duckb"><ellipse cx="0" cy="6" rx="26" ry="20" fill="${b}" ${S3}/><path d="M-6 2Q8 -2 16 10Q4 18 -8 12Z" fill="${w}" stroke="${OL}" stroke-width="2"/><circle cx="-14" cy="-18" r="15" fill="${b}" ${S3}/><path d="M-28 -18L-40 -14L-28 -10Z" fill="#F2A55A" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-18" cy="-21" r="2.8" fill="${OL}"/><circle cx="-19" cy="-22" r="1" fill="#fff"/><ellipse cx="-8" cy="-12" rx="4" ry="2.5" fill="#FF9AAE" opacity=".6"/><path d="M-6 26v4M6 26v4" stroke="#F2A55A" stroke-width="4" stroke-linecap="round"/></g></svg>`};
function carSVG(col,flip){return `<svg viewBox="0 0 200 110" style="overflow:visible"><g${flip?' transform="translate(200 0) scale(-1 1)"':''}><ellipse cx="100" cy="104" rx="90" ry="6" fill="rgba(91,58,41,.15)"/><g class="jb-carbody">
  <path d="M10 86V64Q10 52 24 50L50 46L72 22Q78 16 88 16H140Q150 16 156 24L172 46L184 50Q192 54 192 66V86Z" fill="${col}" ${S3}/><path d="M80 26H112V46H62Z" fill="#DCEEF5" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M118 26H140Q146 26 150 32L160 46H118Z" fill="#DCEEF5" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
  <g class="jb-driver"><circle cx="94" cy="36" r="10" fill="#DDA574" stroke="${OL}" stroke-width="2"/><circle cx="86" cy="28" r="4" fill="#DDA574" stroke="${OL}" stroke-width="1.8"/><circle cx="102" cy="28" r="4" fill="#DDA574" stroke="${OL}" stroke-width="1.8"/><circle cx="90" cy="35" r="1.6" fill="${OL}"/><circle cx="98" cy="35" r="1.6" fill="${OL}"/><path d="M91 40q3 2 6 0" stroke="${OL}" stroke-width="1.6" fill="none"/></g>
  <circle cx="186" cy="62" r="5" fill="#FFF3C8" stroke="${OL}" stroke-width="2"/><rect class="jb-brake" x="8" y="58" width="8" height="10" rx="3" fill="#E9B4AE" stroke="${OL}" stroke-width="2"/>
  <path d="M30 66H170" stroke="#fff" stroke-width="4" opacity=".5"/></g><circle cx="52" cy="88" r="14" fill="#5B4A42" ${S3}/><circle cx="52" cy="88" r="5" fill="${STEEL}"/><circle cx="150" cy="88" r="14" fill="#5B4A42" ${S3}/><circle cx="150" cy="88" r="5" fill="${STEEL}"/></g></svg>`}

/* ============================== vehicles for 출동 (side view facing left, viewBox 0 0 300 170) ============================== */
const wheel=x=>`<circle cx="${x}" cy="138" r="21" fill="#5B4A42" ${S3}/><circle cx="${x}" cy="138" r="8" fill="${STEEL}"/>`;
const WINP='M28 102V76Q28 66 38 64L56 58H98V102Z';
/* the driver's window of each vehicle: [path, x, y] of the head picture inside it */
const WINS={police:['M28 102V90L60 86L96 62H140V102Z',56,50],tractor:['M136 98V50Q136 44 142 44H200Q206 44 206 50V98Z',140,40]};
function vehicleSVG(kind,headIn){
  const wv=WINS[kind]||[WINP,34,50];
  const hd=headIn?`<clipPath id="jbWin${UID}"><path d="${wv[0]}"/></clipPath><g clip-path="url(#jbWin${UID})"><svg x="${wv[1]}" y="${wv[2]}" width="62" height="64" viewBox="50 14 140 140">${headIn}</svg></g>`:'';
  const cab=(c)=>`<path d="M14 136V88Q14 66 34 60L56 52H112V136Z" fill="${c}" ${S3}/><path d="${WINP}" fill="#D8EBF2" ${S3}/>`;
  const top=`<ellipse cx="150" cy="160" rx="142" ry="8" fill="rgba(91,58,41,.15)"/>`;
  let s='';
  if(kind==='fire')s=`${top}<rect x="112" y="28" width="172" height="12" rx="4" fill="${STEEL}" ${S3}/>${[130,152,174,196,218,240,262].map(x=>`<path d="M${x} 30V38" stroke="${OL}" stroke-width="3"/>`).join('')}
    <rect x="106" y="42" width="184" height="94" rx="10" fill="#E46F66" ${S3}/>${[122,176,230].map(x=>`<rect x="${x}" y="56" width="46" height="42" rx="6" fill="#EE958D" stroke="${OL}" stroke-width="2.5"/>`).join('')}
    ${cab('#E46F66')}<path d="M14 116H290" stroke="#FFFDF9" stroke-width="7"/><g class="jb-beacon"><rect x="60" y="40" width="34" height="13" rx="6" fill="#F3A7A0" ${S3}/></g>`;
  else if(kind==='amb')s=`${top}<rect x="106" y="34" width="184" height="102" rx="12" fill="#FBF8F4" ${S3}/><path d="M106 104H290" stroke="#8FC3E6" stroke-width="12"/>${heart(196,72,18,'#E0786F',S3)}
    ${cab('#FBF8F4')}<path d="M14 108H112" stroke="#8FC3E6" stroke-width="12"/><g class="jb-beacon"><rect x="60" y="40" width="34" height="13" rx="6" fill="#A7CFE8" ${S3}/></g>`;
  else if(kind==='food')s=`${top}<rect x="106" y="34" width="184" height="102" rx="12" fill="#F7E8B8" ${S3}/><rect x="130" y="54" width="130" height="44" rx="6" fill="#FFFDF9" ${S3}/>
    <path d="M124 54H266L274 40H116Z" fill="#E89AAE" ${S3}/>${[140,170,200,230].map(x=>`<path d="M${x} 40L${x-4} 54" stroke="#FFFDF9" stroke-width="10"/>`).join('')}<path d="M180 92Q180 70 196 70Q212 70 212 92Z" fill="#E0786F" ${S3}/>${heart(150,80,7,'#F2B48C')}
    ${cab('#F2B48C')}`;
  else if(kind==='mail')s=`${top}<rect x="106" y="34" width="184" height="102" rx="12" fill="#E0786F" ${S3}/><path d="M106 108H290" stroke="#FFFDF9" stroke-width="8"/>
    <rect x="160" y="50" width="78" height="50" rx="6" fill="#FFFDF9" ${S3}/><path d="M162 53L199 80L236 53" stroke="${OL}" stroke-width="3" fill="none" stroke-linejoin="round"/>${heart(199,88,6,'#E89AAE')}
    ${cab('#E0786F')}<path d="M14 108H112" stroke="#FFFDF9" stroke-width="8"/>`;
  else if(kind==='vet')s=`${top}<rect x="106" y="34" width="184" height="102" rx="12" fill="#BFE3D8" ${S3}/><path d="M106 108H290" stroke="#E89AAE" stroke-width="10"/>
    <circle cx="198" cy="70" r="26" fill="#FFFDF9" ${S3}/>${PAW(198,74,1.7,'#E89AAE')}
    ${cab('#BFE3D8')}<path d="M14 108H112" stroke="#E89AAE" stroke-width="10"/>`;
  else if(kind==='tractor')s=`${top}<path d="M14 136V96Q14 84 26 82L128 78V136Z" fill="#8FC48A" ${S3}/><rect x="36" y="88" width="70" height="8" rx="4" fill="#79AE74"/><rect x="46" y="100" width="54" height="8" rx="4" fill="#79AE74"/>
    <rect x="94" y="50" width="12" height="32" rx="4" fill="${STEEL}" ${S3}/><path d="M92 50H108" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
    <path d="M124 136V44Q124 32 136 32H206Q218 32 218 44V136Z" fill="#8FC48A" ${S3}/><path d="${wv[0]}" fill="#D8EBF2" ${S3}/><path d="M118 32H224" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M118 32H224" stroke="#E0786F" stroke-width="3" stroke-linecap="round"/>
    <path d="M218 112H262" stroke="${OL}" stroke-width="8" stroke-linecap="round"/>`;
  else s=`${top}<path d="M10 136V112Q10 98 26 96L70 90L100 60Q108 52 120 52H200Q212 52 220 60L246 90L280 96Q292 98 292 112V136Z" fill="#FBF8F4" ${S3}/><path d="M10 120H292" stroke="#3E56A6" stroke-width="12"/>
    <path d="M${WINP.slice(1)}" fill="none"/><path d="M28 102V90L60 86L96 62H140V102Z" fill="#D8EBF2" ${S3}/><path d="M150 62H196Q206 62 212 70L230 92H150Z" fill="#D8EBF2" ${S3}/>
    <g class="jb-beacon"><rect x="120" y="40" width="22" height="13" rx="6" fill="#A7CFE8" ${S3}/><rect x="142" y="40" width="22" height="13" rx="6" fill="#F3A7A0" ${S3}/></g>${star5(250,112,8,'#F0D58A')}`;
  const w=kind==='police'?wheel(70)+wheel(232):kind==='tractor'?`<circle cx="62" cy="144" r="15" fill="#5B4A42" ${S3}/><circle cx="62" cy="144" r="6" fill="#F0D58A"/><circle cx="190" cy="126" r="34" fill="#5B4A42" ${S3}/><circle cx="190" cy="126" r="22" fill="none" stroke="#6E5C53" stroke-width="5" stroke-dasharray="6 6"/><circle cx="190" cy="126" r="12" fill="#F0D58A" ${S3}/>`:wheel(62)+wheel(236);
  const lamp=kind!=='police'&&kind!=='tractor'?`<circle cx="20" cy="104" r="6" fill="#FFF3C8" ${S3}/><rect x="8" y="128" width="40" height="10" rx="4" fill="${STEEL}" ${S3}/>`:kind==='tractor'?`<circle cx="22" cy="98" r="6" fill="#FFF3C8" ${S3}/>`:'';
  return `<svg viewBox="0 0 300 170" style="overflow:visible">${s}${lamp}${hd}${w}</svg>`;
}
const MIRROR=`<svg viewBox="0 0 120 300" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><rect x="4" y="4" width="112" height="282" rx="56" fill="#E3BE98" ${S3}/><rect x="14" y="14" width="92" height="262" rx="46" fill="#E6F1F4" stroke="${OL}" stroke-width="2.5"/></svg>`;
const ICON={back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`};

/* ============================== the jobs' own pieces: vehicle, scene, helpee, mission words (config has only the mission sentence) ============================== */
const JOB={
  firefighter:{car:'fire',siren:'fire',scene:'fire',tool:'hose',step2:LADDER,
    hello:['불이야! 호스로 물을 뿌려서 불 세 개를 꺼 줘!','Fire! Spray water and put out all three fires!'],
    thanks:['야옹! 고마워요, 소방관님!','Meow! Thank you, firefighter!']},
  doctor:{car:'amb',siren:'amb',scene:'clinic',tool:'scope',step2:PLASTER_BOX,
    hello:['곰이 아파요. 청진기를 가슴에 대 봐!','Teddy feels sick. Put the stethoscope on the tummy!'],
    thanks:['이제 안 아파요! 고마워요, 의사 선생님!','No more ouchies! Thank you, doctor!']},
  chef:{car:'food',siren:'',scene:'kitchen',tool:'ladle',step2:BOWL(0),
    hello:['배고픈 손님이 왔어요! 국자로 수프를 저어 줘!','A hungry friend is here! Stir the soup with the ladle!'],
    thanks:['냠냠, 맛있어요! 고마워요, 요리사님!','Yum yum! Thank you, chef!']},
  police:{car:'police',siren:'police',scene:'street',tool:'sign',step2:WHISTLE,
    hello:['오리 가족이 길을 건너고 싶어요. 멈춤 표지판으로 차를 세워 줘!','The ducks want to cross. Hold up the stop sign to stop the cars!'],
    thanks:['꽥꽥! 고마워요, 경찰관님!','Quack quack! Thank you, officer!']}
};

/* ============================== P15 3~5단계: pictures of the new jobs (mail carrier, farmer, vet) and the 'help me' bubbles ============================== */
/* the three sorting pictures (star · heart · flower), drawn at (0,0) with radius r */
const SORTP={
  star:{ko:'별',en:'star',col:'#F0D58A',d:(r)=>A.star(0,0,r,'#F0D58A',S3)},
  heart:{ko:'하트',en:'heart',col:'#E89AAE',d:(r)=>heart(0,r*.05,r*.62,'#E89AAE',S3)},
  flower:{ko:'꽃',en:'flower',col:'#C3B4E6',d:(r)=>`${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="${(-r*.5).toFixed(1)}" rx="${(r*.34).toFixed(1)}" ry="${(r*.46).toFixed(1)}" fill="#C3B4E6" ${S3} transform="rotate(${a})"/>`).join('')}<circle r="${(r*.3).toFixed(1)}" fill="#F0D58A" ${S3}/>`}
};
const SORT_KEYS=Object.keys(SORTP);
const MAILBOX=(k,flag)=>`<svg viewBox="0 0 100 150" style="overflow:visible"><ellipse cx="50" cy="146" rx="34" ry="5" fill="rgba(91,58,41,.15)"/><rect x="42" y="96" width="16" height="50" rx="4" fill="#C9A98A" ${S3}/>
  <g class="jb-flag" style="transform-origin:88px 66px;transform-box:view-box;transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .2s;transform:${flag?"none":"scale(.2)"};opacity:${flag?1:0}"><path d="M88 66V30" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M88 32H104V46H88Z" fill="#F0D58A" ${S3}/></g>
  <path d="M10 100V44Q10 12 50 12Q90 12 90 44V100Z" fill="#E0786F" ${S3}/><path d="M20 40Q22 22 42 18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".4"/>
  <rect x="26" y="34" width="48" height="9" rx="4.5" fill="#5B4A42"/><circle cx="50" cy="72" r="21" fill="#FFFDF9" ${S3}/><g transform="translate(50 72)">${SORTP[k].d(15)}</g></svg>`;
const LETTER=k=>`<svg viewBox="0 0 100 72" style="overflow:visible"><ellipse cx="50" cy="69" rx="40" ry="4" fill="rgba(91,58,41,.13)"/><rect x="6" y="6" width="88" height="58" rx="7" fill="#FFFDF9" ${S3}/><path d="M8 9L50 40L92 9" stroke="${OL}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M8 62L38 34M92 62L62 34" stroke="#E3D8CC" stroke-width="3"/>
  <circle cx="50" cy="44" r="17" fill="#FFF6E8" stroke="${OL}" stroke-width="2.4"/><g transform="translate(50 44)">${SORTP[k].d(12)}</g></svg>`;
const LETTER_PILE=n=>`<svg viewBox="0 0 120 90" style="overflow:visible"><ellipse cx="60" cy="84" rx="50" ry="6" fill="rgba(91,58,41,.13)"/><path d="M10 40H110L102 82H18Z" fill="#D9BFA6" ${S3}/>${[0,1,2].slice(0,n).map(i=>`<g transform="translate(${18+i*8} ${30-i*9}) rotate(${-8+i*7} 40 20)"><rect width="66" height="40" rx="5" fill="#FFFDF9" ${S3}/><path d="M2 3L33 24L64 3" stroke="${OL}" stroke-width="2.4" fill="none"/></g>`).join('')}<path d="M10 40H110L106 56H14Z" fill="#E9D3BF" ${S3}/></svg>`;
/* a friend's house with the friend's face on the door (parcel delivery) */
const FACE_VB='16 -8 168 160';
const animalFace=(k,mood)=>A.animal(k,mood||'happy').replace(/viewBox="[^"]*"/,`viewBox="${FACE_VB}"`).replace(/style="overflow:visible"/,'style="overflow:hidden"');
const HOUSE_COL={cat:['#F3D6B4','#E0A27A'],dog:['#CFE5F4','#9DBAD6'],bunny:['#F6D3DB','#DDA0AE'],bear:['#CFE6CB','#A3C79C']};
const friendHouse=(k,open)=>{const [w,r]=HOUSE_COL[k]||HOUSE_COL.cat;return `<svg viewBox="0 0 120 150" style="overflow:visible"><ellipse cx="60" cy="146" rx="54" ry="5" fill="rgba(91,58,41,.14)"/>
  <g ${PF}><rect x="12" y="58" width="96" height="88" rx="6" fill="${w}"/></g><g ${PF}><path d="M2 64L60 14L118 64Z" fill="${r}"/></g>
  <rect x="20" y="74" width="24" height="22" rx="4" fill="#F8E6C4" stroke="${OL}" stroke-width="2"/><path d="M32 74V96M20 85H44" stroke="${w}" stroke-width="3"/>
  <rect class="jb-door-in" x="58" y="84" width="40" height="62" rx="18" fill="#7A5A44"/>
  <g class="jb-door" style="transform-origin:58px 115px;transform-box:view-box;transition:transform .5s ease-out;transform:${open?'scaleX(.15)':'none'}"><rect x="58" y="84" width="40" height="62" rx="18" fill="#B9876A" ${S3}/><circle cx="91" cy="118" r="3.5" fill="#F0D58A"/></g>
  <circle cx="60" cy="50" r="19" fill="#FFFDF9" ${S3}/><svg x="42" y="32" width="36" height="36" viewBox="${FACE_VB}" style="overflow:hidden">${A.animal(k,'happy').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</svg></svg>`};
const PARCEL=k=>`<svg viewBox="0 0 100 90" style="overflow:visible"><ellipse cx="50" cy="86" rx="40" ry="4" fill="rgba(91,58,41,.14)"/><path d="M10 30L50 14L90 30V78L50 88L10 78Z" fill="#E3BE98" ${S3}/><path d="M10 30L50 44L90 30M50 44V88" stroke="${OL}" stroke-width="3" fill="none" stroke-linejoin="round"/>
  <path d="M30 22L70 37V50" stroke="#C99E78" stroke-width="7" fill="none"/><circle cx="72" cy="64" r="15" fill="#FFFDF9" stroke="${OL}" stroke-width="2.4"/><svg x="58" y="50" width="28" height="28" viewBox="${FACE_VB}" style="overflow:hidden">${A.animal(k,'happy').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</svg></svg>`;
/* the bicycle (facing right) with the worker on it; the head is the worker's own head */
function bikeSVG(headIn,vest,parcelK){
  const wl=(x)=>`<g class="jb-wheel" style="transform-origin:${x}px 112px;transform-box:view-box"><circle cx="${x}" cy="112" r="28" fill="none" stroke="${OL}" stroke-width="6"/><circle cx="${x}" cy="112" r="28" fill="none" stroke="#5B4A42" stroke-width="3"/>${[0,60,120].map(a=>`<path d="M${x} 86V138" stroke="#B9BFC8" stroke-width="2.5" transform="rotate(${a} ${x} 112)"/>`).join('')}<circle cx="${x}" cy="112" r="5" fill="${STEEL}" stroke="${OL}" stroke-width="2"/></g>`;
  return `<svg viewBox="0 0 200 150" style="overflow:visible"><ellipse cx="100" cy="144" rx="88" ry="6" fill="rgba(91,58,41,.15)"/>${wl(42)}${wl(158)}
    <path d="M42 112L82 112L120 70L158 112M82 112L66 66M120 70L64 70M120 70L136 50" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M42 112L82 112L120 70L158 112M82 112L66 66M120 70L64 70M120 70L136 50" stroke="#E0786F" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M126 50H146" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M54 64H78" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>
    <path d="M140 54H182L176 80H146Z" fill="#D9BFA6" ${S3}/>${parcelK?`<g transform="translate(142 18) scale(.42)">${PARCEL(parcelK).replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`:''}<path d="M140 62H182" stroke="#C9A98A" stroke-width="3"/>
    <g class="jb-crank" style="transform-origin:82px 112px;transform-box:view-box"><path d="M82 112L82 128M82 112L82 96" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><rect x="74" y="126" width="16" height="6" rx="3" fill="#5B4A42"/><rect x="74" y="92" width="16" height="6" rx="3" fill="#5B4A42"/></g>
    <path d="M70 66Q80 92 82 100" stroke="${OL}" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M70 66Q80 92 82 100" stroke="#8C97BE" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M60 30Q58 52 68 64L84 62Q84 40 76 28Z" fill="${vest}" ${S3}/><path d="M74 36Q104 40 128 50" stroke="${OL}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M74 36Q104 40 128 50" stroke="#FFF3E2" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="130" cy="51" r="6" fill="#F6D5B8" stroke="${OL}" stroke-width="2.4"/>
    <svg x="34" y="-34" width="74" height="74" viewBox="50 14 140 140" style="overflow:visible">${headIn}</svg></svg>`;
}
/* the farm: a soil patch that becomes a hole, a seed, a sprout and a carrot (states by class on the wrapper) */
const SOILP=`<svg viewBox="-50 -80 100 110" style="overflow:visible"><ellipse class="g-flat" cx="0" cy="12" rx="44" ry="14" fill="#C9A27E"/><path class="g-flat" d="M-30 6Q-20 0 -10 6M8 4Q18 -2 28 4" stroke="#B48C68" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g class="g-hole"><ellipse cx="0" cy="12" rx="28" ry="10" fill="#7A5A44" stroke="${OL}" stroke-width="2.4"/><path d="M24 14Q34 -2 46 12Z" fill="#B48C68" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/></g>
  <g class="g-seed"><ellipse cx="0" cy="12" rx="26" ry="9" fill="#9E7A5C" stroke="${OL}" stroke-width="2.4"/><ellipse class="g-seed1" cx="0" cy="6" rx="6" ry="4.2" fill="#F0D58A" stroke="${OL}" stroke-width="2"/></g>
  <g class="g-sprout" style="transform-origin:0px 8px;transform-box:view-box"><path d="M0 8V-26" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M0 8V-26" stroke="#8FC48A" stroke-width="3" stroke-linecap="round"/>
    <path d="M0 -14Q-24 -22 -26 -44Q-6 -40 0 -18Z" fill="#9CCB8E" ${S3}/><path d="M0 -20Q20 -34 30 -54Q8 -50 0 -24Z" fill="#8FC48A" ${S3}/><path d="M0 -24Q-4 -50 6 -66Q12 -46 2 -26Z" fill="#A7D49B" ${S3}/></g>
  <g class="g-top"><path d="M-14 12Q-14 -2 0 -4Q14 -2 14 12Z" fill="#F2A55A" ${S3}/><path d="M-8 4H-2M4 8H9" stroke="#D9853F" stroke-width="2.4" stroke-linecap="round"/></g></svg>`;
const CARROT=`<svg viewBox="-40 -70 80 140" style="overflow:visible"><path d="M0 -26Q-22 -34 -24 -58Q-4 -54 0 -30Z" fill="#9CCB8E" ${S3}/><path d="M0 -30Q20 -44 28 -64Q6 -60 0 -34Z" fill="#8FC48A" ${S3}/><path d="M0 -32Q-4 -56 6 -68Q12 -50 2 -34Z" fill="#A7D49B" ${S3}/>
  <path d="M-16 -26Q0 -34 16 -26Q14 20 2 60Q-2 62 -4 58Q-14 20 -16 -26Z" fill="#F2A55A" ${S3}/><path d="M-8 -6H0M2 12H9M-6 28H1" stroke="#D9853F" stroke-width="2.6" stroke-linecap="round"/><path d="M-10 -16Q-8 10 -4 30" stroke="#fff" stroke-width="3" opacity=".4" fill="none" stroke-linecap="round"/></svg>`;
const BASKET=n=>`<svg viewBox="0 0 120 80" style="overflow:visible"><ellipse cx="60" cy="76" rx="50" ry="5" fill="rgba(91,58,41,.14)"/><path d="M26 34Q60 -6 94 34" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M26 34Q60 -6 94 34" stroke="#D9BFA6" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${Array.from({length:Math.min(3,n.c||0)},(_,i)=>`<g transform="translate(${38+i*20} 30) rotate(${-24+i*24}) scale(.42)">${CARROT.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`).join('')}${n.e?`<ellipse cx="60" cy="34" rx="11" ry="14" fill="#FFF6E8" ${S3}/>`:''}
  <path d="M12 34H108L98 72H22Z" fill="#E3BE98" ${S3}/><path d="M18 46H102M22 58H98" stroke="#C99E78" stroke-width="3"/></svg>`;
/* the hen (Alive-ready: al-root / al-breathe / al-head), viewBox like the animals */
const HEN=`<svg viewBox="0 0 200 230" style="overflow:visible"><ellipse cx="100" cy="222" rx="70" ry="7" fill="rgba(91,58,41,.15)"/><g class="al-root" style="transform-origin:50% 96%"><g class="al-breathe" style="transform-origin:50% 96%">
  <path d="M84 196V214M116 196V214" stroke="#F2A55A" stroke-width="6" stroke-linecap="round"/><path d="M76 216H92M108 216H124" stroke="#F2A55A" stroke-width="5" stroke-linecap="round"/>
  <path d="M150 120Q186 92 178 64Q164 96 150 104Z" fill="#FFF6E8" ${S3}/><ellipse cx="102" cy="150" rx="66" ry="54" fill="#FFF6E8" ${S3}/><path d="M60 140Q100 120 130 150Q100 176 70 164Z" fill="#F3E3CF" stroke="${OL}" stroke-width="2.6"/>
  <g class="al-head" style="transform-origin:72px 110px"><g class="al-head-s" style="transform-origin:72px 110px"><path d="M58 60Q60 44 72 50Q76 38 88 46Q98 44 92 60Z" fill="#E0786F" ${S3}/><circle cx="74" cy="84" r="32" fill="#FFF6E8" ${S3}/>
    <path d="M44 84L28 92L44 98Z" fill="#F2A55A" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/><path d="M48 100Q44 114 52 116Q58 108 54 100Z" fill="#E0786F" stroke="${OL}" stroke-width="2.2"/>
    <g class="al-eye al-eye-l al-open"><g class="al-pupil"><circle cx="64" cy="78" r="5" fill="${OL}"/><circle cx="62.5" cy="76.5" r="1.8" fill="#fff"/></g></g><path class="al-lid al-lid-l" opacity="0" d="M58 78Q64 82 70 78" stroke="${OL}" stroke-width="2.6" fill="none"/>
    <ellipse cx="82" cy="94" rx="7" ry="4.5" fill="#FF9AAE" opacity=".5"/></g></g></g></g></svg>`;
const EGG=`<svg viewBox="-30 -36 60 70" style="overflow:visible"><ellipse cx="0" cy="30" rx="18" ry="3.5" fill="rgba(91,58,41,.15)"/><path d="M0 -32Q22 -30 22 4Q22 28 0 28Q-22 28 -22 4Q-22 -30 0 -32Z" fill="#FFF6E8" ${S3}/><path d="M-10 -14Q-14 -2 -12 8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
const NEST=`<svg viewBox="0 0 160 50" style="overflow:visible"><ellipse cx="80" cy="30" rx="74" ry="18" fill="#E3C68C" ${S3}/><path d="M14 26Q40 14 80 18Q120 14 146 26M20 36Q60 28 100 34Q130 30 144 36" stroke="#C9A55E" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
/* vet: the exam table, the sore paw, the bandage turns, the medicine bottle */
const VTABLE=`<svg viewBox="0 0 300 120"><g ${PF}><rect x="30" y="56" width="16" height="62" rx="6" fill="#C9CED6"/><rect x="254" y="56" width="16" height="62" rx="6" fill="#C9CED6"/></g><g ${PF}><rect x="8" y="30" width="284" height="34" rx="14" fill="#FFFDF9"/></g><path d="M20 46H280" stroke="#E3F0EA" stroke-width="10" stroke-linecap="round"/></svg>`;
const SOREPAW=`<svg viewBox="-20 -20 40 40"><ellipse rx="13" ry="10" fill="#F3A7A0" opacity=".8"/><path d="M-6 -3h12M-4 3h8" stroke="#E0786F" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const WRAP=(n)=>`<svg viewBox="-24 -24 48 48" style="overflow:visible">${[0,1,2].slice(0,n).map(i=>`<path d="M-17 ${-10+i*9}Q0 ${-15+i*9} 17 ${-10+i*9}L17 ${-3+i*9}Q0 ${-8+i*9} -17 ${-3+i*9}Z" fill="#FFFDF9" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`).join('')}${n>=3?heart(12,-14,5,'#E89AAE'):''}</svg>`;
const BANDAGE=`<svg viewBox="0 0 100 100"><path d="M68 70Q86 66 92 80" stroke="${OL}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M68 70Q86 66 92 80" stroke="#FFFDF9" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="46" cy="56" rx="30" ry="30" fill="#FFFDF9" ${S3}/><ellipse cx="46" cy="56" rx="11" ry="11" fill="#E3F0EA" ${S3}/><path d="M24 40Q34 30 46 28M20 60Q22 74 34 82" stroke="#E3E6EA" stroke-width="4" fill="none" stroke-linecap="round"/>${heart(70,30,8,'#E89AAE')}</svg>`;
const MEDS=(n)=>`<svg viewBox="0 0 100 100"><ellipse cx="44" cy="94" rx="28" ry="4" fill="rgba(91,58,41,.13)"/><path d="M24 44Q24 36 32 36H56Q64 36 64 44V86Q64 92 58 92H30Q24 92 24 86Z" fill="#F6D3DB" ${S3}/>
  <rect x="26" y="${(88-n*14).toFixed(0)}" width="36" height="${(n*14).toFixed(0)}" rx="4" fill="#E89AAE" opacity=".8"/>${[0,1,2].map(i=>`<path d="M24 ${60+i*14}H32" stroke="${OL}" stroke-width="2"/>`).join('')}
  <rect x="34" y="24" width="20" height="14" rx="4" fill="${STEEL}" ${S3}/><path d="M44 24V6" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M44 24V6" stroke="#FFFDF9" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 22Q74 10 86 20Q80 32 70 30" fill="#F3C6C1" stroke="${OL}" stroke-width="2.4"/>${heart(44,66,6,'#FFFDF9')}</svg>`;
const DROPPER=`<svg viewBox="0 0 100 100"><path d="M50 98L44 84H56Z" fill="#E89AAE" stroke="${OL}" stroke-width="2"/><rect x="40" y="40" width="20" height="46" rx="6" fill="#F4F6F8" ${S3}/><rect x="42" y="62" width="16" height="22" rx="4" fill="#E89AAE" opacity=".8"/>
  <path d="M38 40H62" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M42 40Q38 14 50 6Q62 14 58 40Z" fill="#E0786F" ${S3}/>${TFACE(50,58,.7)}</svg>`;
const DROP_PINK=`<path d="M0 -10Q8 2 0 8Q-8 2 0 -10Z" fill="#E89AAE" stroke="${OL}" stroke-width="1.5"/>`;
const GRAIN=`<svg viewBox="0 0 100 100"><path d="M20 50Q20 92 50 92Q80 92 80 50Z" fill="#E3BE98" ${S3}/><ellipse cx="50" cy="50" rx="30" ry="9" fill="#F0D58A" ${S3}/>${[[38,48],[48,46],[58,49],[44,52],[54,52],[64,51]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#D6B565"/>`).join('')}<path d="M78 56L96 44" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M78 56L96 44" stroke="#C9A98A" stroke-width="4" stroke-linecap="round"/></svg>`;
const SHOVEL=`<svg viewBox="0 0 100 100"><path d="M64 10L46 60" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M64 10L46 60" stroke="#C9A98A" stroke-width="6" stroke-linecap="round"/><path d="M54 6H76" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M54 6H76" stroke="#8FC48A" stroke-width="4" stroke-linecap="round"/>
  <path d="M36 54L58 62L52 86Q42 98 30 88Z" fill="${STEEL}" ${S3}/><path d="M40 62L36 82" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>${TFACE(46,74,.6)}</svg>`;
const SEEDS=`<svg viewBox="0 0 100 100"><path d="M22 24H78L74 90H26Z" fill="#F7E8B8" ${S3}/><path d="M22 24L32 14H68L78 24" fill="#EED692" ${S3}/><g transform="translate(50 54) scale(.55)">${CARROT.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>
  ${[[30,94],[44,98],[60,95]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4.5" ry="3" fill="#F0D58A" stroke="${OL}" stroke-width="1.6"/>`).join('')}</svg>`;
const PULL=`<svg viewBox="0 0 100 100"><g transform="translate(50 52) scale(.62)">${CARROT.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g><path d="M74 26Q86 18 92 30M76 40Q90 40 94 50" stroke="#A7CFE8" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
const BIKE_ICON=`<svg viewBox="0 0 100 100"><circle cx="24" cy="66" r="16" fill="none" stroke="${OL}" stroke-width="5"/><circle cx="76" cy="66" r="16" fill="none" stroke="${OL}" stroke-width="5"/><path d="M24 66H46L66 42L76 66M46 66L38 40M66 42L36 42M66 42L72 30" stroke="#E0786F" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M68 30H80" stroke="${OL}" stroke-width="4" stroke-linecap="round"/></svg>`;
/* the finger tools of the new jobs (with the small face, touch.tool.face) */
TOOL.can=`<svg viewBox="0 0 100 100"><path d="M40 52L14 82" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M40 52L14 82" stroke="#8FC48A" stroke-width="6" stroke-linecap="round"/><ellipse cx="12" cy="85" rx="9" ry="6" fill="#8FC48A" ${S3} transform="rotate(-50 12 85)"/>
  <path d="M52 30Q70 6 90 30" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M52 30Q70 6 90 30" stroke="#8FC48A" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <path d="M38 34H94L90 80Q88 88 80 88H54Q46 88 44 80Z" fill="#8FC48A" ${S3}/><path d="M40 46H92" stroke="#CFE6CB" stroke-width="5"/>${TFACE(67,64,.85)}</svg>`;
TOOL.vscope=`<svg viewBox="0 0 100 100"><path d="M50 60Q50 20 30 4M50 60Q50 20 72 0" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M50 60Q50 20 30 4M50 60Q50 20 72 0" stroke="#E89AAE" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${heart(50,78,20,STEEL,S3)}${heart(50,78,11,'#F4F6F8')}${TFACE(50,74,.7)}</svg>`;
/* the 'help me!' bubble pictures (level 4), viewBox 0 0 120 100 */
const bubbleIn=html=>html.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const PROBLEM={
  firefighter:()=>`<g ${PF}><rect x="26" y="46" width="62" height="46" rx="4" fill="#F3DCC4"/></g><g ${PF}><path d="M18 50L57 20L96 50Z" fill="#C98A7A"/></g><rect x="36" y="56" width="18" height="16" rx="3" fill="#F8E6C4"/><rect x="62" y="64" width="16" height="28" rx="8" fill="#B9876A"/>
    <g transform="translate(46 60) scale(.42)">${bubbleIn(FLAME)}</g><g transform="translate(86 50) scale(.34)">${bubbleIn(FLAME)}</g>`,
  doctor:()=>`<svg x="10" y="0" width="100" height="100" viewBox="-10 -10 220 250" style="overflow:hidden">${bubbleIn(A.animal('bear','sad'))}</svg><g transform="translate(70 58) rotate(-60)"><rect x="-4" y="-22" width="8" height="30" rx="4" fill="#FFFDF9" ${S3}/><circle cx="0" cy="10" r="6" fill="#E0786F" ${S3}/></g><g transform="translate(46 30) rotate(-20) scale(.42)">${bubbleIn(PLASTER(0))}</g>`,
  chef:()=>`<g transform="translate(16 30)">${bubbleIn(BOWL(0)).replace(/<ellipse cx="50" cy="64"[^>]*>/,'')}</g><path d="M30 24Q36 16 30 8M58 22Q64 12 58 4M86 24Q92 16 86 8" stroke="#D9CFC4" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="4 6"/>`,
  police:()=>`<rect x="6" y="66" width="108" height="26" rx="4" fill="#C9C6C2"/>${[0,1,2,3,4].map(i=>`<rect x="${12+i*21}" y="70" width="13" height="18" rx="2" fill="#FAF8F3"/>`).join('')}<svg x="40" y="18" width="50" height="50" viewBox="-40 -50 80 80" style="overflow:hidden">${bubbleIn(DUCK(true))}</svg><svg x="76" y="40" width="32" height="32" viewBox="-40 -50 80 80">${bubbleIn(DUCK(false))}</svg><svg x="4" y="40" width="44" height="26" viewBox="0 0 200 110">${bubbleIn(carSVG('#CFE5F4',false))}</svg>`,
  mail:()=>`<g transform="translate(18 22) scale(.86)">${bubbleIn(LETTER('heart'))}</g>`,
  farmer:()=>`<path d="M4 80Q60 66 116 80V96H4Z" fill="#C9A27E"/>${[24,60,96].map(x=>`<ellipse cx="${x}" cy="80" rx="14" ry="6" fill="#9E7A5C" stroke="${OL}" stroke-width="2"/>`).join('')}<g transform="translate(60 40) scale(.5)">${bubbleIn(CARROT)}</g>`,
  vet:()=>`<svg x="10" y="0" width="100" height="100" viewBox="-10 -10 220 250" style="overflow:hidden">${bubbleIn(A.animal('dog','sad'))}</svg><g transform="translate(83 84) scale(1.1)">${bubbleIn(SOREPAW)}</g>`
};
const BUBBLE=(job)=>`<svg viewBox="0 0 160 130" style="overflow:visible"><path d="M14 8H146Q156 8 156 18V98Q156 108 146 108H96L84 126L76 108H14Q4 108 4 98V18Q4 8 14 8Z" fill="#FFFDF9" ${S3}/><svg x="20" y="10" width="120" height="96" viewBox="0 0 120 100" style="overflow:hidden">${PROBLEM[job]()}</svg></svg>`;

/* new backgrounds (calm paper layers, viewBox 0 0 400 520) */
Object.assign(BG,{
  post:`<rect width="400" height="520" fill="#F5E8DD"/><rect y="236" width="400" height="94" fill="#EFDCCD"/><path d="M0 236H400" stroke="#E6CDB9" stroke-width="5"/>
    <g ${PF}><rect y="330" width="400" height="190" fill="#E8D7C6"/></g><path d="M0 330H400" stroke="#DCC2A8" stroke-width="6"/><g ${PF}><ellipse cx="300" cy="446" rx="100" ry="18" fill="#EAC7B4"/></g>`,
  village:`<rect width="400" height="520" fill="#E7F0EC"/><circle cx="56" cy="50" r="24" fill="#F7E1C2"/><g ${PF}><path d="M-20 214Q100 170 210 200Q300 172 420 204V520H-20Z" fill="#D6E7CC"/></g>${[[40,300],[200,318],[350,296]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="20" fill="#C3DDB9"/><rect x="${x-3}" y="${y+14}" width="6" height="18" fill="#C9A98A"/>`).join("")}
    <g ${PF}><rect y="372" width="400" height="148" fill="#DCD3C6"/></g><rect y="364" width="400" height="14" fill="#EADFCF"/><path d="M0 446H400" stroke="#EFE8DC" stroke-width="6" stroke-dasharray="34 26"/>`,
  farm:`<rect width="400" height="520" fill="#E9F1F2"/><circle cx="330" cy="46" r="24" fill="#F7E1C2"/><g ${PF}><path d="M-20 116Q90 78 200 104Q300 78 420 108V520H-20Z" fill="#D6E7CC"/></g>
    ${[0,1,2,3,4,5,6,7,8].map(i=>`<rect x="${6+i*48}" y="100" width="10" height="44" rx="3" fill="#E3C9A8"/>`).join('')}<rect x="0" y="110" width="400" height="8" rx="3" fill="#E3C9A8"/><rect x="0" y="128" width="400" height="8" rx="3" fill="#E3C9A8"/>
    <g ${PF}><rect y="150" width="400" height="370" fill="#E2CDB3"/></g>${[300,350].map(y=>`<path d="M0 ${y}H400" stroke="#D8C0A2" stroke-width="5" stroke-dasharray="40 30"/>`).join('')}`,
  vet:`<rect width="400" height="520" fill="#ECE8F4"/><g ${PF}><rect x="30" y="44" width="90" height="96" rx="12" fill="#D9BFA6"/></g><rect x="38" y="52" width="74" height="80" rx="8" fill="#DCEEF5"/><path d="M38 116Q60 98 82 110Q100 100 112 112V132H38Z" fill="#B5D6AC"/>
    <g ${PF}><rect x="160" y="50" width="80" height="80" rx="40" fill="#FFFDF9"/></g>${PAW(200,94,2.2,'#E8C3CF')}
    <g ${PF}><rect x="276" y="66" width="104" height="12" rx="5" fill="#C9A98A"/></g><g ${PF}><rect x="286" y="36" width="20" height="30" rx="6" fill="#CFE6CB"/><rect x="312" y="44" width="16" height="22" rx="5" fill="#F6D3DB"/><circle cx="350" cy="52" r="14" fill="#F7E8B8"/></g>
    <g ${PF}><rect y="396" width="400" height="124" fill="#E3DACB"/></g><path d="M0 396H400" stroke="#D6CBB8" stroke-width="6"/>`
});
/* the new jobs' own pieces (vehicle, scene, the strip pictures of the two tasks, words). ask/hint: the level-4 'help me' bubble words, asker: who asks */
Object.assign(JOB,{
  mail:{car:'mail',siren:'',scene:'post',tool:'',icon1:LETTER('star'),step2:BIKE_ICON,
    hello:['편지가 왔어요! 편지 그림과 같은 그림 우체통에 넣어 줘!','Letters! Put each letter in the mailbox with the same picture!'],
    thanks:['소포다! 고마워요, 집배원님!','A parcel for me! Thank you, mail carrier!']},
  farmer:{car:'tractor',siren:'',scene:'farm',tool:'can',icon1:TOOL.can,step2:EGG,
    hello:['토토가 당근이 먹고 싶대요! 삽으로 땅을 파 줘!','Toto wants carrots! Dig the ground with the shovel!'],
    thanks:['꼬꼬댁! 고마워요, 농부님!','Cluck cluck! Thank you, farmer!']},
  vet:{car:'vet',siren:'',scene:'vet',tool:'vscope',step2:MEDS(3),
    hello:['강아지가 아파요. 청진기를 가슴에 대 봐!','The puppy feels sick. Put the stethoscope on the tummy!'],
    thanks:['멍멍! 고마워요, 수의사 선생님!','Woof woof! Thank you, vet!']}
});
const ASK={
  firefighter:{asker:'cat',ask:['불이 났어요! 누가 도와줄까?','Fire! Who can help?'],hint:['불을 끄는 사람은 누구지?','Who puts out fires?']},
  doctor:{asker:'bear',ask:['곰이 아파요! 누가 도와줄까?','Teddy is sick! Who can help?'],hint:['아픈 곳을 낫게 해 주는 사람은 누구지?','Who makes ouchies better?']},
  chef:{asker:'bunny',ask:['배가 고파요! 누가 도와줄까?','I am hungry! Who can help?'],hint:['맛있는 음식을 만드는 사람은 누구지?','Who cooks yummy food?']},
  police:{asker:'bunny',ask:['오리가 길을 못 건너요! 누가 도와줄까?','The ducks cannot cross! Who can help?'],hint:['차를 세워 주는 사람은 누구지?','Who stops the cars?']},
  mail:{asker:'bunny',ask:['편지를 보내고 싶어요! 누가 도와줄까?','I want to send letters! Who can help?'],hint:['편지를 배달하는 사람은 누구지?','Who brings the letters?']},
  farmer:{asker:'bunny',ask:['밭이 텅 비었어요! 누가 도와줄까?','The field is empty! Who can help?'],hint:['밭에서 당근을 키우는 사람은 누구지?','Who grows carrots?']},
  vet:{asker:'dog',ask:['강아지가 발을 다쳤어요! 누가 도와줄까?','The puppy hurt its paw! Who can help?'],hint:['동물 친구를 낫게 해 주는 사람은 누구지?','Who helps sick animals?']}
};

/* ============================== screen ============================== */
const css=`
#${id}{gap:6px}
#${id} .jb-headbar{flex:none;height:${HEAD_PX}px;gap:8px}
#${id} .jb-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px;flex:none}
#${id} .jb-back svg{width:100%;height:100%;display:block}
.jb-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:5px;pointer-events:none;overflow:hidden}
.jb-strip span{flex:none;width:30px;height:30px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.5;transition:all .3s;box-shadow:0 2px 6px rgba(91,74,66,.12);padding:4px}
.jb-strip span svg{width:100%;height:100%;display:block;overflow:hidden}
.jb-strip span.on{width:44px;height:44px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.jb-strip span.done{opacity:1}
.jb-strip span i{position:absolute;right:-5px;top:-5px;width:16px;height:16px}
.jb-stars{flex:none;display:flex}.jb-stars .mlp-star{width:20px;height:20px}
.jb-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F4E9DE}
.jb-stage svg{display:block}
.jb-bg,.jb-world{position:absolute;inset:0}
.jb-bg{pointer-events:none}.jb-bg svg{width:100%;height:100%}
.jb-world{pointer-events:none}
.jb-world>*{position:absolute}
.jb-world svg{width:100%;height:100%;overflow:visible}
.jb-doll{position:absolute;z-index:3;pointer-events:none;transition:left .6s ease-in-out,height .5s,width .5s}
.jb-doll>svg{width:100%;height:100%;overflow:visible}
.jb-doll .al-arm-l{transform-box:view-box!important;transform-origin:91px 172px!important}
.jb-doll .al-arm-r{transform-box:view-box!important;transform-origin:149px 172px!important}
.jb-doll.drop>svg{animation:jbdrop .5s ease-out}
@keyframes jbdrop{0%{transform:none}30%{transform:scale(1.04,.95) translateY(6px)}65%{transform:scale(.98,1.03)}100%{transform:none}}
.jb-doll.hug .al-arm-l{animation:jbhugl 1.2s ease-in-out}.jb-doll.hug .al-arm-r{animation:jbhugr 1.2s ease-in-out}
@keyframes jbhugl{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(-40deg)}}@keyframes jbhugr{0%,100%{transform:rotate(0)}30%,70%{transform:rotate(40deg)}}
.jb-mirror{position:absolute;right:4%;bottom:3%;width:34%;height:84%;z-index:2;pointer-events:none;transform:translateX(140%);transition:transform .6s cubic-bezier(.3,1.1,.5,1)}
.jb-mirror.on{transform:none}
.jb-refl{position:absolute;left:14%;right:14%;top:12%;bottom:6%;transform:scaleX(-1);opacity:.9}
.jb-refl svg{width:100%;height:100%;overflow:visible}
.jb-mirror::after{content:"";position:absolute;left:18%;top:8%;width:18%;height:30%;background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,0));border-radius:40px;transform:skewX(-12deg)}
.jb-car{position:absolute;z-index:4;right:2%;bottom:3%;width:66%;aspect-ratio:300/170;transform:translateX(130%);transition:transform 1.4s cubic-bezier(.25,.9,.4,1)}
.jb-car.in{transform:none}.jb-car.out{transform:translateX(-170%);transition:transform 1.7s cubic-bezier(.5,0,.8,.5)}
.jb-car svg{width:100%;height:100%;overflow:visible}
.jb-car.go .jb-beacon{animation:jbbeacon 1.2s ease-in-out infinite}
@keyframes jbbeacon{0%,100%{opacity:1}50%{opacity:.45}}
.jb-car.go>svg{animation:jbbump .7s ease-in-out infinite}
@keyframes jbbump{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.jb-flamew{position:absolute;transform:translate(-50%,-100%);transform-origin:50% 100%;pointer-events:none}
.jb-flamew>.jb-fl{position:absolute;inset:0;transform-origin:50% 100%;transition:transform .25s ease-out,opacity .5s}
.jb-flame{transform-box:view-box;transform-origin:0 6px;animation:jbflick 1.3s ease-in-out infinite alternate}
@keyframes jbflick{0%{transform:scale(.95,1.04) skewX(-3deg)}100%{transform:scale(1.04,.96) skewX(3deg)}}
.jb-smoke{animation:jbsmoke 2.4s ease-in-out infinite alternate}
@keyframes jbsmoke{0%{transform:translateY(0);opacity:.8}100%{transform:translateY(-8px);opacity:.5}}
.jb-flamew .jb-soot{position:absolute;inset:0;opacity:0;transition:opacity .6s}
.jb-flamew.out .jb-soot{opacity:1}
.jb-help{pointer-events:none}
.jb-help>svg{width:100%;height:100%;overflow:visible}
.jb-hit{position:absolute;pointer-events:none}
.jb-spot,.jb-plaster{position:absolute;transform:translate(-50%,-50%);pointer-events:none}
.jb-plaster{animation:jbstick .45s ease-out}
@keyframes jbstick{0%{transform:translate(-50%,-50%) scale(1.5)}40%{transform:translate(-50%,-50%) scale(.85,1.15)}70%{transform:translate(-50%,-50%) scale(1.06,.95)}100%{transform:translate(-50%,-50%) scale(1)}}
.jb-carx{transition:left 2.4s ease-in}
.jb-carx>svg{animation:jbcreep 1.4s ease-in-out infinite alternate}
@keyframes jbcreep{0%{transform:translateX(-3px)}100%{transform:translateX(3px)}}
.jb-carx.stop>svg{animation:jbhalt .5s ease-out}
@keyframes jbhalt{0%{transform:translateX(4px)}40%{transform:translateX(-3px) scale(1.02,.97)}100%{transform:none}}
.jb-carx.stop .jb-brake{fill:#FF5A5F}
.jb-duck{transition:top 1.7s ease-in-out,left 1.7s ease-in-out}
.jb-duck.walk .jb-duckb{animation:jbwaddle .45s ease-in-out infinite alternate;transform-box:view-box;transform-origin:0 26px}
@keyframes jbwaddle{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}
.jb-fx{position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden}
.jb-fx .jb-pf{position:absolute;width:30px;height:30px}
.jb-fx .jb-pf svg{width:100%;height:100%;overflow:visible}
.jb-float{position:absolute;z-index:60;pointer-events:none}
.jb-float svg{width:100%;height:100%;overflow:visible}
.jb-photo{position:absolute;inset:0;z-index:11;display:grid;place-items:center;background:rgba(255,250,244,.5);pointer-events:none}
.jb-pcard{position:relative;background:#FFFDF9;border-radius:14px;padding:10px 10px 40px;box-sizing:border-box;box-shadow:0 10px 24px rgba(91,74,66,.28);transform:rotate(-3deg) scale(.6);opacity:0;transition:transform .55s cubic-bezier(.3,1.4,.5,1),opacity .3s}
.jb-photo.on .jb-pcard{transform:rotate(-3deg) scale(1);opacity:1}
.jb-pcard>.jb-pic{position:relative;width:100%;height:100%;border-radius:8px;overflow:hidden}
.jb-pcard .pbg,.jb-pcard .pcar,.jb-pcard .pdoll{position:absolute}
.jb-pcard .pbg{inset:0}.jb-pcard svg{width:100%;height:100%;overflow:visible}
.jb-stamp{position:absolute;right:2%;bottom:1%;width:30%;aspect-ratio:1;opacity:0;transform:scale(2.2) rotate(-20deg)}
.jb-stamp.on{animation:jbstamp .5s ease-out forwards}
@keyframes jbstamp{0%{opacity:0;transform:scale(2.2) rotate(-20deg)}60%{opacity:1;transform:scale(.9,1.1) rotate(-12deg)}80%{transform:scale(1.06,.95) rotate(-12deg)}100%{opacity:1;transform:scale(1) rotate(-12deg)}}
.jb-tray{flex:none;position:relative;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;padding:4px 0}
.jb-card{position:relative;flex:1;min-width:110px;max-width:170px;height:100%;min-height:110px;border-radius:24px;border:0;padding:8px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .45s cubic-bezier(.3,1.1,.5,1),opacity .3s}
.jb-card>svg{width:100%;height:100%;display:block;pointer-events:none;overflow:hidden!important}
.jb-card.slide{transform:translateY(130%)}.jb-card.out{transform:translateY(130%);opacity:0}
.jb-card.lift{opacity:.35}.jb-card.chosen{transform:scale(1.08);box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16)}
.jb-card.nope{animation:jbnope .5s ease-in-out}
@keyframes jbnope{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.jb-toolpic{height:100%;aspect-ratio:1;max-width:46%;border-radius:28px;background:var(--paper);padding:10px;box-shadow:0 4px 12px rgba(91,74,66,.14)}
.jb-toolpic svg{width:100%;height:100%;overflow:visible}
.jb-show{display:flex;gap:10px;align-items:center;justify-content:center;height:100%;pointer-events:none}
.jb-show span{height:86%;aspect-ratio:.9;border-radius:22px;background:var(--paper);padding:8px;box-shadow:0 3px 10px rgba(91,74,66,.1)}
.jb-show span svg{width:100%;height:100%}
.jb-ic .al-lid,.jb-ic .al-mouth-o{opacity:0}
.jb-bubble{pointer-events:none;transform-origin:70% 100%}
.jb-bubble>svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 4px 6px rgba(91,74,66,.16))}
.jb-box,.jb-house2,.jb-pile,.jb-bike,.jb-soil,.jb-basket,.jb-nest,.jb-egg{pointer-events:none}
.jb-bike{transition:left .65s ease-in-out}
.jb-bike.ride .jb-wheel,.jb-bike.ride .jb-crank{animation:jbspin .65s linear}
@keyframes jbspin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.jb-bike.ride>svg{animation:jbbump .32s ease-in-out 2}
.jb-soil .g-hole,.jb-soil .g-seed,.jb-soil .g-sprout,.jb-soil .g-top{display:none}
.jb-soil.hole .g-hole,.jb-soil.pulled .g-hole{display:inline}
.jb-soil.seed .g-seed,.jb-soil.grow .g-seed,.jb-soil.grow .g-sprout,.jb-soil.carrot .g-sprout,.jb-soil.carrot .g-top{display:inline}
.jb-soil.grow .g-seed1,.jb-soil.carrot .g-seed1{display:none}
.jb-soil.carrot .g-sprout{transform:none!important;transition:transform .3s}
.jb-soil .g-sprout{transition:transform .25s ease-out}
.jb-hen.peck>svg{animation:jbpeck .6s ease-in-out;transform-origin:30% 90%}
@keyframes jbpeck{0%,100%{transform:none}30%{transform:rotate(-14deg) translateY(4%)}55%{transform:rotate(-4deg)}75%{transform:rotate(-14deg) translateY(4%)}}
.jb-wrap svg,.jb-spot svg{width:100%;height:100%;overflow:visible}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* P16: the screen and its header come from the common shell (ML.Shell.screen): same back picture, size and place on every screen */
const sec=M.Shell.screen(id,{title:'직업 놀이',pre:PAPER_DEFS,headClass:'jb-headbar',backClass:'jb-back',backId:'jbHome',backs:[{id:'jbBack',label:'직업 고르기로'}],stripClass:'jb-strip',stripId:'jbStrip',after:`<div class="jb-stars" id="jbStars"></div>`,body:`<div class="jb-stage" id="jbStage"><div class="jb-bg" id="jbBg"></div><div class="jb-world" id="jbWorld"></div><div class="jb-mirror" id="jbMirror">${MIRROR}<div class="jb-refl"></div></div><div class="jb-doll" id="jbDoll"></div><div class="jb-car" id="jbCar"></div><div class="jb-fx" id="jbFx"></div><div class="jb-photo" id="jbPhoto" hidden></div></div>
<div class="jb-tray" id="jbTray"></div>`}).sec;
const $=s=>sec.querySelector(s);
const stage=$('#jbStage'),bgEl=$('#jbBg'),world=$('#jbWorld'),mirrorEl=$('#jbMirror'),dollEl=$('#jbDoll'),carEl=$('#jbCar'),fxEl=$('#jbFx'),photoEl=$('#jbPhoto'),tray=$('#jbTray'),stripEl=$('#jbStrip'),homeBtn=$('#jbHome'),backBtn=$('#jbBack');
const G=M.Guide.make(sec,{say});
let phase='',lv=levelInfo(1),S=null,al=null,helpAl=[],gen=0,misses=0,lastMiss=0,dd=null,cd=null,busy=false,tool=null,shown=[],canGo=false,MS=null,mirrorT=0;
const stR=()=>stage.getBoundingClientRect();
const secXY=(x,y)=>{const r=sec.getBoundingClientRect();return[x-r.left,y-r.top]};
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const dR=()=>dollEl.getBoundingClientRect();
const dpt=(x,y)=>{const r=dR();return[r.left+x/VBW*r.width,r.top+y/VBH*r.height]};
const toDoll=e=>{const r=dR();return[(e.clientX-r.left)/r.width*VBW,(e.clientY-r.top)/r.height*VBH]};
const inDoll=(x,y)=>x>40&&x<230&&y>4&&y<375;
const SLOT_PT={hat:[120,56],top:[120,212],tool:[168,246]};
const toolPt=job=>gearOf(job,'tool')&&gearOf(job,'tool').neck?[120,214]:[172,250];

/* ---------- sounds (motion.soundSync) ---------- */
const SND={
  thump(){tone(92,.16,'sine',.4);tone(74,.18,'sine',.32,.2)},
  whistle(){sweepTone(2300,2700,.16,'square',.035);sweepTone(2700,2350,.3,'square',.035,.17)},
  quack(){sweepTone(640,380,.14,'sawtooth',.05);sweepTone(600,360,.14,'sawtooth',.045,.18)},
  meow(){sweepTone(700,1050,.18,'sine',.12);sweepTone(1050,620,.3,'sine',.1,.18)},
  hiss(){noise(.35,{freq:3200,q:.6,vol:.12,sweep:-1800})},
  horn(){tone(392,.18,'square',.05);tone(494,.2,'square',.045,.2)},
  bubble(){tone(260+Math.random()*320,.07,'sine',.08)},
  stamp(){noise(.14,{type:'lowpass',freq:420,vol:.4});tone(150,.14,'sine',.28)},
  screech(){noise(.4,{freq:2600,q:4,vol:.06,sweep:-900})},
  pour(){noise(.45,{type:'lowpass',freq:1400,vol:.18,sweep:-700})},
  stick(){tone(520,.06,'triangle',.12);noise(.08,{freq:2200,vol:.08})},
  bell(){tone(1320,.12,'sine',.12);tone(1320,.18,'sine',.1,.16)},
  pedal(){tone(180,.05,'triangle',.1);tone(210,.05,'triangle',.08,.18)},
  knock(){tone(140,.06,'sine',.3);tone(140,.06,'sine',.28,.16)},
  dig(){noise(.22,{type:'lowpass',freq:600,vol:.3,sweep:-200})},
  seed(){tone(880,.05,'sine',.08);tone(660,.06,'sine',.07,.08)},
  peck(){tone(900,.03,'square',.03)},
  cluck(){sweepTone(500,700,.08,'triangle',.08);sweepTone(520,760,.08,'triangle',.08,.12);sweepTone(480,900,.16,'triangle',.08,.26)},
  slurp(){sweepTone(400,900,.18,'sine',.1)}
};

/* ---------- layout ---------- */
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(sh*TRAY_R[1],Math.max(sh*TRAY_R[0],want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  placeDoll();
}
function placeDoll(){
  const r=stR(),W=r.width,H=r.height;if(!W||!S)return;const m=S.dollMode||'center';
  let h,left,bottom=H*.02;
  if(m==='side'){h=H*.52;left=-W*.04}
  else if(m==='ask'){h=Math.min(H*.56,W*.5*VBH/VBW);left=-W*.03}
  else if(m==='left'){h=Math.min(H*.74,W*.6*VBH/VBW);left=W*.0}
  else if(m==='mirror'){h=Math.min(H*.8,W*.66*VBH/VBW);left=W*.02}
  else{h=Math.min(H*.9,W*.86*VBH/VBW);left=(W-h*VBW/VBH)/2}
  Object.assign(dollEl.style,{height:Math.round(h)+'px',width:Math.round(h*VBW/VBH)+'px',left:Math.round(left)+'px',bottom:Math.round(bottom)+'px'});
}

/* ---------- drawing ---------- */
function drawDoll(){if(!S)return;dollEl.innerHTML=doll(S.d,S.job,S.wear,{skip:S.drag});if(al)al.refresh&&al.refresh()}
const STEPS=['suit','car','m1','m2','stamp'];
function stepIndex(){if(!S||!S.job)return -1;if(phase==='dress')return 0;if(['mirror','car','ride'].includes(phase))return 1;if(phase==='mission')return S.mstep?3:2;return 4}
function strip(){
  if(!S||!S.job){stripEl.innerHTML='';return}const j=S.job,J=JOB[j],k=stepIndex();
  const pics=[cardSVG(j,'top',gearOf(j,'top').cols[0]),vehicleSVG(J.car),J.icon1||TOOL[J.tool],J.step2,STAMP_ICON];
  const star=`<i><svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg></i>`;
  stripEl.innerHTML=pics.map((p,i)=>`<span class="${i===k?'on':i<k?'done':''}">${p}${i<k?star:''}</span>`).join('');
}
function stars(n){const pr=PRG();$('#jbStars').innerHTML=pr?pr.stars(GID,n):''}
function spawn(inner,x,y,o={}){if(fxEl.childElementCount>=PMAX)return;const e=document.createElement('i');e.className='jb-pf';e.innerHTML=`<svg viewBox="-15 -15 30 30">${inner}</svg>`;const s=stR(),sz=o.sz||30;
  Object.assign(e.style,{left:(x-s.left-sz/2)+'px',top:(y-s.top-sz/2)+'px',width:sz+'px',height:sz+'px'});fxEl.appendChild(e);const ms=o.ms||PFADE;
  try{e.animate([{transform:`scale(${o.s0||.6})`,opacity:1},{transform:`translate(${o.dx||0}px,${o.dy==null?-34:o.dy}px) scale(${o.s1||1.3})`,opacity:0}],{duration:ms,easing:'ease-out',fill:'forwards'})}catch(_){}setTimeout(()=>e.remove(),ms+60)}
const SPARK=A.twinkle(0,0,11,'#F0D58A'),HEART=heart(0,2,9,'#F3A7A0',`stroke="${OL}" stroke-width="1.5"`),DROP=`<path d="M0 -10Q8 2 0 8Q-8 2 0 -10Z" fill="#A7CFE8" stroke="#8FC3E6" stroke-width="1.5"/>`,PUFF=`<circle r="10" fill="#E9E4DE" opacity=".8"/>`;
const sparkles=(x,y,u=1)=>[[-50,-30],[46,-20],[0,40],[-30,30],[34,34]].forEach(([dx,dy],k)=>setTimeout(()=>spawn(SPARK,x+dx*u,y+dy*u),k*80));
function celebrate(x,y){for(let i=0;i<CELEB.pieces;i++)setTimeout(()=>spawn(i%2?HEART:SPARK,x+rnd(-80,80),y+rnd(-20,30),{ms:CELEB.durationMs,dy:-70-rnd(0,40),s0:.8,s1:1.2}),i*90)}
function miss(){misses++;if(S)S.wrong++;G.nudge();const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);speak(c[0],c[1])}
function clearTool(){if(tool){tool.destroy();tool=null}}
function helpOff(){helpAl.forEach(h=>h&&h.detach());helpAl=[]}
function fly(el,cx,cy,px,ms,then,fade){
  const r=el.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2),s=px/r.width;let done=false;const f=()=>{if(done)return;done=true;el.remove();then&&then()};
  try{const a=el.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:fade?0:1}],{duration:ms,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});a.onfinish=f}catch(e){setTimeout(f,ms)}setTimeout(f,ms+300);
}
function floatHTML(html,cx,cy,px){const f=document.createElement('div');f.className='jb-float';f.innerHTML=html;const [x,y]=secXY(cx,cy);Object.assign(f.style,{width:px+'px',height:px+'px',left:(x-px/2)+'px',top:(y-px/2)+'px'});sec.appendChild(f);return f}
function setTray(html){tray.innerHTML=html}
function showWorn(){if(!S||!S.job)return setTray('');setTray(`<div class="jb-show">${SLOTS.map(s=>`<span>${cardSVG(S.job,s,(S.wear[s]||{col:gearOf(S.job,s).cols[0]}).col,true)}</span>`).join('')}</div>`)}
function attachDoll(){if(al){al.detach();al=null}if(M.Alive){al=M.Alive.attach(dollEl,{kind:'doll'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}}
function attachHelp(el,kind,o={}){if(!M.Alive||!el)return null;const h=M.Alive.attach(el,Object.assign({kind},o));helpAl.push(h);return h}

/* ============================== 1. pick a job (three cards at most) ============================== */
function showPick(o={}){
  L.begin();gen++;G.stop();clearTool();helpOff();fxEl.innerHTML='';dd=null;cd=null;busy=false;canGo=false;MS=null;mirrorT=0;
  phase='pick';lv=levelInfo(levelNo());
  /* level 5: a family face does the job (one of the saved faces each round); no faces → the usual doll */
  const fam=lv.family?famList():[],fr=fam.length?fam[Math.floor(Math.random()*fam.length)]:null;
  S={d:fr?famDoll(fr):pick(DOLLS),job:null,wear:{},wrong:0,idle:0,dollMode:lv.ask?'ask':'center',t0:performance.now(),ask:null};
  bgEl.innerHTML=bgSVG(BG.locker);world.innerHTML='';mirrorEl.classList.remove('on');carEl.className='jb-car';carEl.innerHTML='';photoEl.hidden=true;photoEl.innerHTML='';
  dollEl.style.opacity='1';homeBtn.hidden=false;backBtn.hidden=true;size();drawDoll();attachDoll();strip();
  if(lv.ask){/* level 4: a friend shows its problem in a picture bubble; the child picks the job that helps (three cards at most) */
    let pool=lv.jobs.filter(j=>j!==DATA.last);if(!pool.length)pool=lv.jobs.slice();
    const fresh=lv.fresh.filter(j=>pool.includes(j)),ans=fresh.length&&Math.random()<.4?pick(fresh):pick(pool);
    S.ask=ans;shown=shuffle([ans].concat(shuffle(lv.jobs.filter(j=>j!==ans&&j!==PAIR[ans])).slice(0,2)));
    const A2=ASK[ans]||ASK.firefighter,ak=mk('jb-help jb-asker',A.animal(A2.asker,'sad'));Object.assign(ak.style,{right:'1%',bottom:'3%',width:'50%',aspectRatio:'200/230',zIndex:'2'});
    const bb=mk('jb-bubble',BUBBLE(ans));Object.assign(bb.style,{right:'2%',top:'8%',width:'68%',aspectRatio:'160/130',zIndex:'2'});
    const akAl=attachHelp(ak,A2.asker);if(akAl)akAl.setMood('sad');S.asker={el:ak,al:akAl,bubble:bb};
    try{bb.animate([{transform:'scale(.4)',opacity:0},{transform:'scale(1.05)',opacity:1,offset:.7},{transform:'none'}],{duration:500,delay:500,easing:'ease-out',fill:'backwards'})}catch(_){}
  }else{/* the jobs this level brings come first, so the child meets them */
    const fresh=lv.fresh.slice(0,2);let rest=lv.jobs.filter(j=>!fresh.includes(j));if(rest.length>3-fresh.length)rest=rest.filter(j=>j!==DATA.last);
    shown=shuffle(fresh.concat(shuffle(rest)).slice(0,3));
  }
  LOG.push('cards:'+shown.join('+'));
  setTray(shown.map(j=>`<button class="jb-card slide" data-job="${j}" aria-label="${jobOf(j).ko}">${jobCardSVG(j,S.d)}</button>`).join(''));
  tray.querySelectorAll('.jb-card').forEach((b,k)=>setTimeout(()=>b.classList.remove('slide'),60+k*110));
  const R=o.result;stars(R?R.filled-1:undefined);if(R)L.later(()=>{const pr=PRG();if(pr)pr.fillStars($('#jbStars'),R.filled);LOG.push('star:'+R.filled)},400);
  if(R&&R.up)L.later(()=>levelUp(R.level),1500);
  L.later(()=>{if(S.ask){const q=ASK[S.ask].ask;speak(q[0],q[1]);if(S.asker&&S.asker.al)S.asker.al.play('wave')}else speak('어떤 일을 해 볼까? 카드를 콕 눌러 봐!','Which job shall we try? Tap a card!');if(al)al.play('wave');
    G.start({type:'tap',at:()=>{const b=tray.querySelector('.jb-card');if(!b)return[sec.clientWidth/2,sec.clientHeight*.85];const [x,y]=ctr(b);return secXY(x,y)}})},R&&R.up?4400:R?2000:400);
}
function levelUp(n){const a=levelInfo(n-1),b=levelInfo(n);LOG.push('levelup:'+n);const pr=PRG();if(!pr)return;
  let m;
  if(b.family&&!a.family){const f=famList()[0];m=f?{art:A.personHead(f.photo,M.Faces.look(f)),ko:'우리 가족도 일해요!',en:'Our family can work too!'}:{art:jobCardSVG(pick(b.jobs),S.d),ko:'다 같이 일해요!',en:'Everyone works together!'}}
  else{const nj=b.fresh[0]||b.jobs.find(j=>!a.jobs.includes(j))||b.jobs[0];m={art:jobCardSVG(nj,S.d),ko:'새 직업이 왔어요!',en:'New jobs are here!'}}
  pr.moment(stage,m,()=>stars(0))}
const famKo=()=>S&&S.d&&S.d.fam?S.d.fam.ko:'',famEn=()=>S&&S.d&&S.d.fam?cap(S.d.fam.en):'';
function pickJob(j,b){
  if(phase!=='pick'||busy)return;G.touch();actx();sfx.pop();const J=jobOf(j);
  if(S.ask&&j!==S.ask){/* not the job for this problem: a gentle 어? and the friend asks again (never a fail) */
    S.wrong++;LOG.push('askwrong:'+j);b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope');tone(330,.18,'sine',.12);
    const h=ASK[S.ask].hint;speak(`어? ${J.ko}? ${h[0]}`,`Oh? The ${J.en}? ${h[1]}`);if(al)al.play('oops');if(S.asker&&S.asker.al)S.asker.al.play('shiver');G.nudge();return}
  busy=true;G.stop();LOG.push('pick:'+j);
  if(S.ask){speak(`맞아, ${J.ko}!`,`Yes! The ${J.en}!`);if(S.asker&&S.asker.al){S.asker.al.setMood('happy');S.asker.al.play('hop')}const r=b.getBoundingClientRect();sparkles(r.left+r.width/2,r.top+r.height/2,.7)}
  else speak(J.ko+'!',cap(J.en)+'!');
  b.classList.add('chosen');tray.querySelectorAll('.jb-card').forEach(x=>{if(x!==b)x.classList.add('out')});if(al)al.play('hop');
  S.job=j;DATA.last=j;save();L.later(()=>{busy=false;startDress()},S.ask?1700:1300);
}

/* ============================== 2. dress up: hat, clothes, tool (tap or drag; drag off; tap a worn one = new colour) ============================== */
function startDress(){
  phase='dress';S.wear={};S.decoy=null;homeBtn.hidden=true;backBtn.hidden=false;helpOff();world.innerHTML='';S.asker=null;S.dollMode='center';placeDoll();strip();renderItems(true);drawDoll();
  const J=jobOf(S.job);
  if(famKo())speak(`${famKo()} ${J.ko} 옷을 입혀 보자! 카드를 콕 누르거나 끌어 봐.`,`Let's dress ${famEn()} as a ${J.en}! Tap or drag a card.`);
  else speak(`${J.ko} 옷을 입어 보자! 카드를 콕 누르거나 끌어 봐.`,`Let's dress up as a ${J.en}! Tap or drag a card.`);
  G.start({type:'tap',at:()=>{const b=tray.querySelector('.jb-card:not(.out)');if(!b)return[sec.clientWidth/2,sec.clientHeight*.85];const [x,y]=ctr(b);return secXY(x,y)}});
}
function renderItems(first){
  if(!S||!S.job||!GEAR[S.job])return;
  const need=SLOTS.filter(s=>!S.wear[s]),list=need.map(s=>({job:S.job,slot:s}));
  if(lv.decoy&&need.length){
    const others=lv.jobs.filter(j=>j!==S.job&&j!==PAIR[S.job]&&BUILT.includes(j));let dec=S.decoy;
    if(!dec||!need.includes(dec.slot)||dec.job===S.job||!gearOf(dec.job,dec.slot)){const sl=pick(need),pool=(others.length?others:BUILT.filter(j=>j!==S.job&&j!==PAIR[S.job])).filter(j=>gearOf(j,sl));dec=pool.length?{job:pick(pool),slot:sl}:null}
    S.decoy=dec;if(dec){if(list.length>2)list.splice(2);list.push(Object.assign({decoy:true},dec))}
  }
  const order=(first?shuffle(list):list).filter(c=>gearOf(c.job,c.slot));
  setTray(order.map(c=>{const it=gearOf(c.job,c.slot);return `<button class="jb-card${first?' slide':''}" data-job="${c.job}" data-slot="${c.slot}"${c.decoy?' data-decoy="1"':''} aria-label="${itemKo(c.job,c.slot)}">${cardSVG(c.job,c.slot,it.cols[0])}</button>`}).join(''));
  if(first)tray.querySelectorAll('.jb-card').forEach((b,k)=>setTimeout(()=>b.classList.remove('slide'),60+k*110));
  if(!need.length)showWorn();
}
function putOn(job,slot,fromEl){
  if(!S||busy||phase!=='dress')return;G.touch();G.stop();
  if(job!==S.job){/* another job's piece: it does not stick, we hear what it is (levels: 골라내기) */
    busy=true;S.wrong++;LOG.push('decoy:'+job+':'+slot);const J=jobOf(job),g=gearOf(job,slot),w=g.short[0],en=g.short[1];
    const [tx,ty]=dpt(...SLOT_PT[slot==='tool'?'top':slot]),done=()=>{busy=false};
    speak(`이건 ${J.ko} ${iya(w)}! 다시 골라 보자.`,`That's the ${J.en}'s ${en}! Let's pick again.`);tone(330,.18,'sine',.12);
    if(fromEl){const r=fromEl.getBoundingClientRect(),hx=r.left+r.width/2,hy=r.top+r.height/2;try{const a=fromEl.animate([{transform:'none'},{transform:`translate(${(tx-hx)*.75}px,${(ty-hy)*.75}px) scale(.8)`,offset:.45},{transform:`translate(${(tx-hx)*.7}px,${(ty-hy)*.7+16}px) scale(.85,.75)`,offset:.55},{transform:'none'}],{duration:900,easing:'ease-in-out'});a.onfinish=()=>{fromEl.remove();done()}}catch(_){fromEl.remove();done()}setTimeout(()=>{if(fromEl.isConnected)fromEl.remove();done()},1300)}else done();
    const b=tray.querySelector(`.jb-card[data-decoy]`);if(b){b.classList.remove('nope');void b.offsetWidth;b.classList.add('nope')}
    if(al)al.play('oops');return;
  }
  busy=true;
  const fin=()=>{if(!S)return;const g=gearOf(job,slot);S.wear[slot]={col:g.cols[0]};LOG.push('wear:'+slot);drawDoll();
    dollEl.classList.remove('drop');void dollEl.offsetWidth;dollEl.classList.add('drop');setTimeout(()=>dollEl.classList.remove('drop'),600);
    const [x,y]=dpt(...(slot==='tool'?toolPt(job):SLOT_PT[slot]));sparkles(x,y,dR().width/VBW);SFX.sparkle();if(al)al.play(slot==='hat'?'hop':'twirl');
    const c=pal(g.cols[0]),ko=itemKo(job,slot);speak(g.nc?`${c.ko} ${ko}!`:`${ko}!`,g.nc?`${cap(c.en)} ${g.en}!`:`${cap(g.en)}!`);
    busy=false;renderItems(false);armGo()};
  if(fromEl){const [tx,ty]=dpt(...(slot==='tool'?toolPt(job):SLOT_PT[slot]));fly(fromEl,tx,ty,dR().width*.4,320,fin)}else fin();
}
function takeOff(slot,f){
  if(!S)return;delete S.wear[slot];S.drag=null;LOG.push('off:'+slot);drawDoll();renderItems(false);sfx.pop();speak('어?','Oh?');if(al)al.play('oops');
  if(f){const r=tray.getBoundingClientRect();fly(f,r.left+r.width/2,r.top+r.height/2,50,420,null,true)}
}
function recolor(slot){const w=S.wear[slot],g=gearOf(S.job,slot),cs=g.cols;if(cs.length<2){const [x,y]=dpt(...(slot==='tool'?toolPt(S.job):SLOT_PT[slot]));sparkles(x,y,dR().width/VBW);if(al)al.play('hop');return}
  w.col=cs[(cs.indexOf(w.col)+1)%cs.length];LOG.push('color:'+slot+':'+pal(w.col).en);drawDoll();const c=pal(w.col);speak(c.ko+'!',cap(c.en)+'!');tone(880,.1,'sine',.1);if(al)al.play('hop')}
/* all three on → the mirror, then the vehicle comes (출동 is possible only now) */
function allWorn(){return !!S&&SLOTS.every(s=>S.wear[s])}
function armGo(){if(!allWorn()||mirrorT)return;mirrorT=1;const g=gen;L.later(()=>{mirrorT=0;if(g===gen&&phase==='dress'&&allWorn())mirrorBeat()},1100)}
function slotAt(x,y){
  const w=S.wear,tp=toolPt(S.job);
  if(w.tool&&(Math.hypot(x-tp[0],y-tp[1])<34||(gearOf(S.job,'tool').hand&&x>150&&y>150)))return 'tool';
  if(w.hat&&y<104)return 'hat';
  if(w.top&&y>=150)return 'top';
  return null;
}
function dressDown(e){
  e.preventDefault();G.touch();const [x,y]=toDoll(e);if(!inDoll(x,y)){miss();return}
  const slot=slotAt(x,y);if(slot){dd={slot,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{stage.setPointerCapture(e.pointerId)}catch(_){}return}
  G.nudge();const n=performance.now();if(n-lastMiss>2400){lastMiss=n;speak('아래 카드를 콕 눌러 봐!','Tap a card below!')}
}
stage.addEventListener('pointermove',e=>{
  if(!dd||e.pointerId!==dd.id||!S)return;
  if(!dd.moved&&Math.hypot(e.clientX-dd.x0,e.clientY-dd.y0)>14){dd.moved=true;const w=S.wear[dd.slot];if(!w){dd=null;return}S.drag=dd.slot;drawDoll();dd.f=floatHTML(cardSVG(S.job,dd.slot,w.col,true),e.clientX,e.clientY,dR().width*.45);tone(520,.06,'triangle',.1)}
  if(dd.moved&&dd.f){const [x,y]=secXY(e.clientX,e.clientY),w=dd.f.offsetWidth;dd.f.style.left=(x-w/2)+'px';dd.f.style.top=(y-w/2)+'px'}
});
const endDrag=e=>{G.release();if(!dd||(e&&e.pointerId!==dd.id))return;const d=dd;dd=null;if(!S||phase!=='dress'){if(d.f)d.f.remove();return}
  if(!d.moved){recolor(d.slot);return}
  const [x,y]=toDoll(e),pt=d.slot==='tool'?toolPt(S.job):SLOT_PT[d.slot],out=!inDoll(x,y)||Math.hypot(x-pt[0],y-pt[1])>110;
  if(out&&e.type!=='pointercancel')takeOff(d.slot,d.f);else{S.drag=null;d.f.remove();drawDoll()}};
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
/* cards in the tray: tap = choose / put on, drag onto the doll = put on */
tray.addEventListener('pointerdown',e=>{const b=e.target.closest('.jb-card');if(!b||b.classList.contains('out')||busy||cd)return;e.preventDefault();actx();G.touch();
  if(phase==='pick'){pickJob(b.dataset.job,b);return}
  if(phase==='mission'&&MS&&MS.trayDown){MS.trayDown(e,b);return}
  if(phase!=='dress')return;
  cd={b,job:b.dataset.job,slot:b.dataset.slot,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{b.setPointerCapture(e.pointerId)}catch(_){}});
tray.addEventListener('pointermove',e=>{if(MS&&MS.trayMove)MS.trayMove(e);if(!cd||e.pointerId!==cd.id)return;
  if(!cd.moved&&Math.hypot(e.clientX-cd.x0,e.clientY-cd.y0)>12){cd.moved=true;cd.f=floatHTML(cardSVG(cd.job,cd.slot,gearOf(cd.job,cd.slot).cols[0]),e.clientX,e.clientY,cd.b.getBoundingClientRect().width);cd.b.classList.add('lift')}
  if(cd.moved&&cd.f){const [x,y]=secXY(e.clientX,e.clientY),w=cd.f.offsetWidth;cd.f.style.left=(x-w/2)+'px';cd.f.style.top=(y-w/2)+'px'}});
const endCard=e=>{G.release();if(MS&&MS.trayUp)MS.trayUp(e);if(!cd||(e&&e.pointerId!==cd.id))return;const d=cd;cd=null;d.b.classList.remove('lift');if(!S||phase!=='dress'){if(d.f)d.f.remove();return}
  if(!d.moved){const r=d.b.getBoundingClientRect();const f=floatHTML(cardSVG(d.job,d.slot,gearOf(d.job,d.slot).cols[0]),r.left+r.width/2,r.top+r.height/2,r.width*.9);sfx.pop();putOn(d.job,d.slot,f);return}
  const [x,y]=toDoll(e);if(inDoll(x,y)&&e.type!=='pointercancel')putOn(d.job,d.slot,d.f);else{const r=d.b.getBoundingClientRect();fly(d.f,r.left+r.width/2,r.top+r.height/2,r.width,250)}};
tray.addEventListener('pointerup',endCard);tray.addEventListener('pointercancel',endCard);

/* ============================== 3. mirror and 출동 ============================== */
function mirrorBeat(){
  phase='mirror';LOG.push('mirror');G.stop();strip();showWorn();const J=jobOf(S.job);
  S.dollMode='mirror';placeDoll();mirrorEl.querySelector('.jb-refl').innerHTML=doll(S.d,S.job,S.wear,{});mirrorEl.classList.add('on');
  L.later(()=>{if(al)al.play('twirl');(famKo()?speak(`우와, 멋진 ${famKo()} ${J.ko}!`,`Wow! ${famEn()} the super ${J.en}!`):speak(`우와, 멋진 ${J.ko}!`,`Wow! A super ${J.en}!`));const r=mirrorEl.getBoundingClientRect();sparkles(r.left+r.width/2,r.top+r.height*.4)},700);
  L.later(()=>{if(al)al.play('wave')},2300);
  L.later(()=>{mirrorEl.classList.remove('on');carArrive()},3900);
}
function carArrive(){
  const J=JOB[S.job],jo=jobOf(S.job);S.dollMode='left';placeDoll();
  carEl.innerHTML=vehicleSVG(J.car);carEl.className='jb-car';void carEl.offsetWidth;carEl.classList.add('in','go');
  if(J.siren)siren(J.siren,1.4);else SND.horn();
  L.later(()=>{carEl.classList.remove('go');canGo=true;phase='car';strip();SND.horn();LOG.push('car');
    if(famKo())speak(`${famKo()} ${jo.ko} 출동! 차를 콕 눌러서 타자!`,`${famEn()} the ${jo.en}, let's go! Tap the car to hop in!`);
    else speak(`출동! 차를 콕 눌러서 타자!`,`Let's go, ${jo.en}! Tap the car to hop in!`);
    G.start({type:'tap',at:()=>{const [x,y]=ctr(carEl);return secXY(x,y)}})},1500);
}
function tryGo(){if(!canGo||!allWorn()||phase!=='car')return false;board();return true}
function board(){
  phase='ride';canGo=false;G.stop();LOG.push('ride');strip();const J=JOB[S.job];actx();sfx.pop();
  const c=carEl.getBoundingClientRect(),d=dR(),tx=c.left+c.width*.22-(d.left+d.width/2),ty=c.top+c.height*.45-(d.top+d.height*.25);
  try{dollEl.animate([{transform:'none',opacity:1},{transform:`translate(${tx*.5}px,${ty-60}px) scale(.7)`,offset:.5},{transform:`translate(${tx}px,${ty}px) scale(.3)`,opacity:0}],{duration:700,easing:'ease-in-out',fill:'forwards'}).onfinish=()=>{dollEl.style.opacity='0'}}catch(_){dollEl.style.opacity='0'}
  L.later(()=>{carEl.innerHTML=vehicleSVG(J.car,headSVG(S.d,S.job,S.wear));carEl.classList.add('go');if(J.siren)siren(J.siren,2.4);else SND.horn();speak('출발!','Off we go!')},700);
  L.later(()=>{carEl.classList.add('out')},1300);
  L.later(()=>{dollEl.getAnimations().forEach(a=>a.cancel());startMission()},3000);
}

/* ============================== 4. the mission ============================== */
function startMission(){
  phase='mission';S.mstep=0;S.dollMode='side';carEl.className='jb-car';carEl.innerHTML='';helpOff();clearTool();
  const J=JOB[S.job];bgEl.innerHTML=bgSVG(BG[J.scene],J.scene==='street'?'none':undefined);world.innerHTML='';placeDoll();dollEl.style.opacity='1';drawDoll();
  try{dollEl.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:450,easing:'cubic-bezier(.3,1.4,.5,1)'})}catch(_){}
  strip();MS=MS_BASE();const m=MISSION[S.job]();['tap','trayDown','trayMove','trayUp','up'].forEach(k=>{if(MS[k]&&!m[k])m[k]=MS[k]});MS=m;LOG.push('mission:'+S.job);
}
function nextStep(){S.mstep=1;clearTool();strip();LOG.push('step2:'+S.job);if(al)al.play('clap')}
/* the generic finger-following tool: only the cells it touches change (holding still keeps working where it is) */
function toolStep(o){
  setTray(`<div class="jb-toolpic">${TOOL[o.icon]}</div>`);
  const pic=tray.querySelector('.jb-toolpic');let lastT=0,stop=null;
  const intro=()=>{if(stop)stop();stop=P.toolIntro(stage,pic,TOOL[o.icon],{ko:o.say[0],en:o.say[1]})};
  pic.addEventListener('pointerdown',()=>{actx();intro()});
  L.later(intro,300);
  tool=P.makeTool(stage,{tool:TOOL[o.use||o.icon],face:o.face,effect:o.effect||'foam',fx:o.fx,anchor:o.anchor,gapScale:o.gap,cells:o.cells,target:o.target,tilt:true,tapAnim:420,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:{radiusRatio:o.radius||.1,doneAt:1,holdStillCleansNearest:false,grid:[8,8]}}),rub:{tapChunk:o.tapChunk||.07},
    onMiss:miss,onTouch:()=>{G.touch();if(stop){stop();stop=null}LOG.push('press:'+o.icon);o.onTouch&&o.onTouch()},
    onRelease:()=>{G.release();lastT=0;o.onRelease&&o.onRelease()},
    onTap:(F,W)=>{LOG.push('tap:'+o.icon);o.onTap&&o.onTap(F,W)},
    sound:o.sound,onCell:o.onCell,
    onMove:o.onMove,
    onFrame:(F,t,W)=>{if(!F||!tool)return;const dt=lastT?Math.min(.1,(t-lastT)/1000):0;lastT=t;const h=stR(),R=(o.radius||.1)*Math.min(h.width,h.height);
      if(dt>0)tool.cellPts().forEach((p,i)=>{if(Math.hypot(p[0]-h.left-F.x,p[1]-h.top-F.y)<R)tool.fill(i,(o.rate||.6)*dt)});o.onFrame&&o.onFrame(F,t,W)},
    onDone:()=>{LOG.push('done:'+o.icon);o.onDone()}});
  G.start({type:o.guide||'scrub',at:o.guideAt});
}
const pctBox=(el,l,t,w,h)=>{Object.assign(el.style,{left:l+'%',top:t+'%',width:w+'%'});if(h!=null)el.style.height=h+'%';return el};
const mk=(cls,html)=>{const e=document.createElement('div');e.className=cls;e.innerHTML=html||'';world.appendChild(e);return e};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;
function thanks(helpEl,h,line){
  phase='thanks';clearTool();G.stop();strip();LOG.push('thanks');showWorn();const [x,y]=ctr(helpEl);
  if(h){h.setMood&&h.setMood('happy');h.play('hop',{n:2})}SFX.ding();celebrate(x,y);
  const jo=jobOf(S.job),fl=famKo()?[line[0].replace(/고마워요, .*$/,`고마워요, ${famKo()} ${jo.ko}님!`),line[1].replace(/Thank you, .*$/,`Thank you, ${famEn()} the ${jo.en}!`)]:line;
  L.later(()=>{speak(fl[0],fl[1]);if(al)al.play('wave')},500);
  L.later(()=>{if(h)h.play('dance');if(al)al.play('dance')},2600);
  L.later(photoCard,5200);
}
/* 5. the "real photo" card — no photos yet (P13), so a nicely drawn card of the job, then the stamp */
function photoCard(){
  phase='photo';LOG.push('photo');const J=JOB[S.job],jo=jobOf(S.job);strip();
  photoEl.innerHTML=`<div class="jb-pcard"><div class="jb-pic"><div class="pbg">${bgSVG(BG[J.scene],J.scene==='street'?'none':undefined)}</div><div class="pcar" style="right:-6%;bottom:6%;width:78%;aspect-ratio:300/170">${vehicleSVG(J.car)}</div><div class="pdoll" style="left:2%;bottom:2%;height:80%;aspect-ratio:240/400">${doll(S.d,S.job,S.wear,{})}</div></div><div class="jb-stamp">${STAMP_ICON}</div></div>`;
  const sr=stR(),cw=Math.min(sr.width*.7,sr.height*.86*.8);Object.assign(photoEl.querySelector('.jb-pcard').style,{width:cw+'px',height:(cw/.8)+'px'});
  photoEl.hidden=false;requestAnimationFrame(()=>photoEl.classList.add('on'));SFX.shutter&&SFX.shutter();
  L.later(()=>famKo()?speak(`${famKo()} ${jo.ko}!`,`${famEn()} the ${jo.en}!`):speak(`진짜 ${jo.ko}!`,`A real ${jo.en}!`),500);
  L.later(()=>{const s=photoEl.querySelector('.jb-stamp');s.classList.add('on');setTimeout(SND.stamp,280);LOG.push('stamp');phase='stamp';strip();
    const r=s.getBoundingClientRect();setTimeout(()=>sparkles(r.left+r.width/2,r.top+r.height/2),320)},2400);
  L.later(()=>{if(!S)return;DATA.done++;save();let result=null;const pr=PRG();
    if(pr){pr.struggle(GID,{wrong:S.wrong,idleMs:S.idle});result=pr.clear(GID)}else{DATA.level=Math.min(MADE,DATA.level+1);save()}
    photoEl.classList.remove('on');showPick({result})},5200);
}

/* ---------- firefighter: put out three fires with the hose, then bring the cat down ---------- */
function mFire(){
  const J=JOB.firefighter,R={};
  const truck=pctBox(mk('',vehicleSVG('fire')),-30,0,70);truck.style.top='auto';truck.style.bottom='3%';truck.style.aspectRatio='300/170';truck.style.zIndex='1';
  const house=mk('jb-house',HOUSE);Object.assign(house.style,{right:'1%',bottom:'11%',width:'70%',aspectRatio:'300/340',zIndex:'1'});
  const spots=shuffle(FIRE_SPOTS.map((p,i)=>i)).slice(0,3).sort((a,b)=>a-b).map(i=>FIRE_SPOTS[i]);
  const fires=spots.map(([x,y],k)=>{const w=document.createElement('div');w.className='jb-flamew';Object.assign(w.style,{left:(x/300*100)+'%',top:(y/340*100)+'%',width:'30%',aspectRatio:'100/114'});
    w.innerHTML=`<div class="jb-soot">${SOOT}</div><div class="jb-fl">${FLAME}</div>`;house.appendChild(w);return{x,y,el:w,fl:w.querySelector('.jb-fl'),lv:0,out:false}});
  const cat=document.createElement('div');cat.className='jb-help';Object.assign(cat.style,{position:'absolute',left:'8%',top:'-8%',width:'26%',aspectRatio:'200/230'});cat.innerHTML=A.animal('cat');house.appendChild(cat);
  const catAl=attachHelp(cat,'cat');if(catAl)catAl.setMood('sad');
  /* cells: five around each fire, in house fractions */
  const OFF=[[0,-18],[-16,-8],[16,-8],[0,-36],[0,2]],cells=[],group=[];
  fires.forEach((f,k)=>OFF.forEach(([dx,dy])=>{cells.push([(f.x+dx)/300,(f.y+dy)/340]);group.push(k)}));
  const cv=cells.map(()=>0);
  R.fires=fires;R.house=house;R.cat=cat;
  L.later(()=>{speak(J.hello[0],J.hello[1]);SND.meow()},400);
  const handPt=()=>{const r=dR(),s=stR();return[r.left-s.left+HAND.r[0]/VBW*r.width,r.top-s.top+HAND.r[1]/VBH*r.height]};
  let lastHiss=0;
  toolStep({icon:'hose',use:'hoseUse',anchor:[.5,.96],gap:.8,radius:.1,rate:.45,cells,target:()=>house.getBoundingClientRect(),say:['호스! 물을 뿌려요!','The hose! Spray the water!'],
    guideAt:()=>{const f=fires.find(x=>!x.out)||fires[0];const [x,y]=ctr(f.el);return secXY(x,y+f.el.offsetHeight*.3)},
    sound:()=>P.holdSound('shower'),
    fx:({wx,wy,sz,x,y,rad,now})=>{
      const h=handPt(),a=(tool?tool.tilt:0)*Math.PI/180,tx=wx+Math.sin(a)*sz*.96,ty=wy-Math.cos(a)*sz*.96;
      const hp=`M${h[0].toFixed(1)} ${h[1].toFixed(1)}C${(h[0]+60).toFixed(1)} ${(h[1]+70).toFixed(1)} ${(tx-10).toFixed(1)} ${(ty-60).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
      let s=`<path d="${hp}" stroke="${OL}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${hp}" stroke="#E0786F" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      const fw=rad*.45;s+=`<path d="M${wx-6} ${wy}L${wx+6} ${wy}L${x+fw} ${y}L${x-fw} ${y}Z" fill="#CFE5F4" opacity=".55"/>`;
      for(let i=0;i<16;i++){const sd=((i*37)%16)/15*2-1,t=((now/520)+i/16)%1,px=wx+(x+sd*fw-wx)*t,py=wy+(y-wy)*t;s+=`<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="3" ry="6.5" fill="#A7CFE8" stroke="#8FC3E6" stroke-width="1" opacity="${Math.min(1,t*8).toFixed(2)}"/>`}
      const k=.85+.15*Math.sin(now/140);s+=`<ellipse cx="${x}" cy="${y}" rx="${(fw*1.8*k).toFixed(1)}" ry="${(fw*.6*k).toFixed(1)}" fill="none" stroke="#A7CFE8" stroke-width="3.5" opacity=".9"/>`;
      for(let i=0;i<5;i++){const t=((now/600)+i/5)%1,an=-Math.PI/2+(i-2)*.5;s+=`<circle cx="${(x+Math.cos(an)*t*rad).toFixed(1)}" cy="${(y+Math.sin(an)*t*rad*.6+t*t*20).toFixed(1)}" r="3" fill="#CFE5F4" opacity="${(1-t).toFixed(2)}"/>`}
      return s},
    onTap:(F)=>{const s=stR();for(let k=0;k<4;k++)spawn(DROP,s.left+F.x+rnd(-20,20),s.top+F.y,{dx:rnd(-30,30),dy:-20,sz:22})},
    onCell:(i,v,pv,why)=>{cv[i]=v;const k=group[i],f=fires[k];const ix=group.map((g,j)=>g===k?j:-1).filter(j=>j>=0),lvv=ix.reduce((s,j)=>s+cv[j],0)/ix.length;f.lv=lvv;
      if(!f.out){f.fl.style.transform=`scale(${(1-.82*lvv).toFixed(3)})`;const n=performance.now();if(n-lastHiss>260&&why!=='auto'){lastHiss=n;SND.hiss();const [x,y]=ctr(f.el);spawn(PUFF,x+rnd(-14,14),y-10,{dy:-50,sz:34,ms:900})}}
      if(lvv>=1&&!f.out){f.out=true;f.el.classList.add('out');f.fl.style.opacity='0';LOG.push('fireout:'+k);const [x,y]=ctr(f.el);for(let q=0;q<4;q++)spawn(PUFF,x+rnd(-20,20),y,{dy:-70,sz:40,ms:1100});
        const left=fires.filter(z=>!z.out).length;if(catAl)catAl.play('hop');if(left){const p=praise();speak(`불이 꺼졌어! ${p[0]}`,`It's out! ${p[1]}`)}}},
    onDone:()=>{L.later(()=>{speak('불이 다 꺼졌어! 이제 고양이를 구해 줘. 콕!','All the fires are out! Now save the kitty. Tap!');if(catAl)catAl.setMood('wow');SND.meow();stepCat()},700)}});
  function stepCat(){
    nextStep();setTray(`<button class="jb-card" data-act="ladder" aria-label="사다리">${LADDER}</button>`);
    G.start({type:'tap',at:()=>{const [x,y]=ctr(cat);return secXY(x,y)}});
    R.saved=false;
    MS.tap=e=>{const r=cat.getBoundingClientRect(),m=Math.max(0,(110-Math.min(r.width,r.height))/2)+10;if(inRect(e,r,m))rescue();else miss()};
    MS.trayDown=()=>rescue();
  }
  function rescue(){
    if(R.saved)return;R.saved=true;MS.tap=null;MS.trayDown=null;G.stop();LOG.push('cat');SND.meow();sfx.pop();setTray('');
    const lad=document.createElement('div');Object.assign(lad.style,{position:'absolute',left:'2%',top:'10%',width:'26%',height:'94%',transformOrigin:'50% 100%',transform:'rotate(14deg)'});
    lad.innerHTML=`<svg viewBox="0 0 60 200" preserveAspectRatio="none"><rect x="6" y="0" width="9" height="200" rx="4" fill="#E0786F" ${S3}/><rect x="45" y="0" width="9" height="200" rx="4" fill="#E0786F" ${S3}/>${[16,46,76,106,136,166].map(y=>`<rect x="12" y="${y}" width="36" height="7" rx="3" fill="${STEEL}" stroke="${OL}" stroke-width="2"/>`).join('')}</svg>`;house.insertBefore(lad,cat);
    try{lad.animate([{transform:'rotate(60deg)',opacity:0},{transform:'rotate(14deg)',opacity:1}],{duration:500,easing:'ease-out'})}catch(_){}
    L.later(()=>{const c=cat.getBoundingClientRect(),d=dR(),tx=d.left+d.width*.62-(c.left+c.width/2),ty=d.top+d.height*.48-(c.top+c.height/2);cat.style.zIndex='6';house.style.zIndex='4';
      try{cat.animate([{transform:'none'},{transform:`translate(${tx*.3}px,${ty*.45}px)`,offset:.4},{transform:`translate(${tx*.6}px,${ty*.8}px)`,offset:.7},{transform:`translate(${tx}px,${ty}px) scale(.8)`}],{duration:1500,easing:'ease-in-out',fill:'forwards'})}catch(_){}
      dollEl.classList.add('hug');setTimeout(()=>dollEl.classList.remove('hug'),1300)},600);
    L.later(()=>thanks(cat,catAl,J.thanks),2300);
  }
  return Object.assign({R,get fires(){const hr=house.getBoundingClientRect();return fires.map(f=>({lv:+f.lv.toFixed(3),out:f.out,pt:ctr(f.el),aim:[hr.left+f.x/300*hr.width,hr.top+(f.y-16)/340*hr.height]}))},get cat(){return ctr(cat)}},MS_BASE());
}
function MS_BASE(){return{tap:null,trayDown:null,trayMove:null,trayUp:null,up:null}}

/* ---------- doctor: listen to the heartbeat, then a plaster on each sore spot ---------- */
function mDoctor(){
  const J=JOB.doctor,R={};
  const bed=mk('',BED);Object.assign(bed.style,{right:'-4%',bottom:'6%',width:'80%',aspectRatio:'300/170',zIndex:'1'});
  const bear=mk('jb-help',A.animal('bear'));Object.assign(bear.style,{right:'5%',bottom:'20%',width:'58%',aspectRatio:'200/230',zIndex:'2'});
  const bearAl=attachHelp(bear,'bear');if(bearAl)bearAl.setMood('sad');
  const sp=shuffle(BEAR_SPOTS.map((p,i)=>i)).slice(0,3).map(i=>BEAR_SPOTS[i]);
  const spots=sp.map(([x,y])=>{const e=document.createElement('div');e.className='jb-spot';Object.assign(e.style,{left:(x/200*100)+'%',top:(y/230*100)+'%',width:'16%',aspectRatio:'1'});e.innerHTML=SORE;bear.appendChild(e);return{x,y,el:e,done:false}});
  R.spots=spots;
  L.later(()=>{speak(J.hello[0],J.hello[1]);tone(300,.3,'sine',.08)},400);
  const chestR=()=>{const r=bear.getBoundingClientRect();return{x:r.left+100/200*r.width,y:r.top+186/230*r.height,rx:46/200*r.width,ry:38/230*r.height}};
  let lastBeat=0,said=false;
  toolStep({icon:'scope',anchor:[.5,.76],gap:.18,radius:.1,rate:.42,cells:CHEST.map(([x,y])=>[x/200,y/230]),target:()=>bear.getBoundingClientRect(),face:()=>{const r=bear.getBoundingClientRect();return{left:r.left+r.width*.15,right:r.right-r.width*.15,top:r.top+r.height*.1,bottom:r.top+r.height*.66,width:r.width*.7,height:r.height*.56}},say:['청진기! 가슴에 대 봐요.','The stethoscope! Listen to the tummy.'],
    guideAt:()=>{const c=chestR();return secXY(c.x,c.y)},
    onFrame:(F)=>{const s=stR(),c=chestR(),x=s.left+F.x,y=s.top+F.y;const on=((x-c.x)/c.rx)**2+((y-c.y)/c.ry)**2<=1.4;const n=performance.now();
      if(on&&n-lastBeat>700){lastBeat=n;SND.thump();LOG.push('beat');spawn(HEART,c.x+rnd(-10,10),c.y-10,{dy:-60,sz:34,ms:1000});if(bearAl)bearAl.setMood('wow');if(!said){said=true;speak('두근두근!','Thump thump!')}}},
    onRelease:()=>{if(bearAl)bearAl.setMood('sad')},
    onTap:()=>{const c=chestR();SND.thump();spawn(HEART,c.x,c.y-10,{dy:-60,sz:34,ms:1000})},
    onCell:()=>{},
    onDone:()=>{L.later(()=>{speak('튼튼한 소리! 이제 아픈 곳에 반창고를 붙여 줘.','A strong heart! Now put plasters on the sore spots.');if(bearAl)bearAl.setMood('sad');stepPlaster()},700)}});
  function next(){return spots.find(s=>!s.done)}
  function nearest(cx,cy){let b=null,bd=1e9;spots.forEach(s=>{if(s.done)return;const [x,y]=ctr(s.el),d=Math.hypot(x-cx,y-cy);if(d<bd){bd=d;b=s}});return b}
  function stepPlaster(){
    nextStep();setTray(`<button class="jb-card" data-act="plaster" aria-label="반창고">${PLASTER_BOX}</button>`);
    G.start({type:'tap',at:()=>{const s=next();if(!s)return[0,0];const [x,y]=ctr(s.el);return secXY(x,y)}});
    MS.tap=e=>{const r=bear.getBoundingClientRect();if(!inRect(e,r,20)){miss();return}const s=nearest(e.clientX,e.clientY);if(s)stick(s,null)};
    let pd=null;
    MS.trayDown=(e,b)=>{pd={id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null,b};try{b.setPointerCapture(e.pointerId)}catch(_){}};
    MS.trayMove=e=>{if(!pd||e.pointerId!==pd.id)return;if(!pd.moved&&Math.hypot(e.clientX-pd.x0,e.clientY-pd.y0)>12){pd.moved=true;pd.f=floatHTML(PLASTER(-20),e.clientX,e.clientY,90)}
      if(pd.f){const [x,y]=secXY(e.clientX,e.clientY);pd.f.style.left=(x-45)+'px';pd.f.style.top=(y-45)+'px'}};
    MS.trayUp=e=>{if(!pd||e.pointerId!==pd.id)return;const d=pd;pd=null;
      if(!d.moved){const s=next();if(s){const r=d.b.getBoundingClientRect();stick(s,floatHTML(PLASTER(-20),r.left+r.width/2,r.top+r.height/2,90))}return}
      const r=bear.getBoundingClientRect();if(inRect(e,r,30)){const s=nearest(e.clientX,e.clientY);if(s){stick(s,d.f);return}}if(d.f)d.f.remove()};
  }
  function stick(s,f){
    if(s.done)return;s.done=true;G.touch();LOG.push('plaster');const rot=Math.round(rnd(-30,30));
    const put=()=>{const p=document.createElement('div');p.className='jb-plaster';Object.assign(p.style,{left:s.el.style.left,top:s.el.style.top,width:'22%',aspectRatio:'1'});p.innerHTML=PLASTER(rot);bear.appendChild(p);s.el.style.opacity='0';
      SND.stick();const [x,y]=ctr(s.el);sparkles(x,y,.6);if(bearAl)bearAl.play('hop');
      const left=spots.filter(z=>!z.done).length;if(left){speak('호~ 괜찮아!','There, there!')}else{L.later(()=>{G.stop();MS.tap=null;MS.trayDown=null;thanks(bear,bearAl,J.thanks)},700)}};
    if(f){const [x,y]=ctr(s.el);fly(f,x,y,bear.getBoundingClientRect().width*.22,320,put)}else put();
  }
  return Object.assign({R,get spots(){return spots.map(s=>({done:s.done,pt:ctr(s.el)}))},get bear(){const r=bear.getBoundingClientRect();return[r.left,r.top,r.width,r.height]},get chest(){const c=chestR();return[c.x,c.y]}},MS_BASE());
}

/* ---------- chef: stir the soup, then three ladles into the bowl, and the guest eats ---------- */
function mChef(){
  const J=JOB.chef,R={},kind=pick(['bunny','dog','cat']);
  const guest=mk('jb-help',A.animal(kind));Object.assign(guest.style,{right:'-2%',top:'4%',width:'44%',aspectRatio:'200/230',zIndex:'1'});
  const gAl=attachHelp(guest,kind,{waiting:true});if(gAl)gAl.setMood('sad');
  const table=mk('',`<svg viewBox="0 0 160 60"><g ${PF}><rect x="4" y="6" width="152" height="18" rx="8" fill="#D9BFA6"/></g><rect x="20" y="22" width="10" height="38" fill="#C9A98A"/><rect x="130" y="22" width="10" height="38" fill="#C9A98A"/></svg>`);Object.assign(table.style,{right:'0%',top:'31%',width:'46%',aspectRatio:'160/60',zIndex:'2'});
  const stove=mk('',STOVE);Object.assign(stove.style,{left:'30%',bottom:'2%',width:'58%',aspectRatio:'240/120',zIndex:'1'});
  const pot=mk('jb-pot',potSVG());Object.assign(pot.style,{left:'31%',bottom:'16%',width:'56%',aspectRatio:'240/200',zIndex:'2'});
  const pcs=[...pot.querySelectorAll('.jb-pc')],swirl=pot.querySelector('.jb-swirl'),steam=pot.querySelector('.jb-steam');
  const cv=POT_CELLS.map(()=>0);let ang=0,lastA=null,lastB=0;
  L.later(()=>{speak(J.hello[0],J.hello[1]);if(gAl)gAl.play('wave')},400);
  const potC=()=>{const r=pot.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height*.32]};
  toolStep({icon:'ladle',anchor:[.5,.88],gap:.3,radius:.11,rate:.38,cells:POT_CELLS,target:()=>pot.getBoundingClientRect(),say:['국자! 빙글빙글 저어요.','The ladle! Stir round and round.'],guide:'circle',
    guideAt:()=>{const [x,y]=potC();return secXY(x,y)},
    onFrame:(F)=>{const s=stR(),[cx,cy]=potC(),a=Math.atan2(s.top+F.y-cy,s.left+F.x-cx);if(lastA!=null){let d=a-lastA;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;ang+=d*180/Math.PI}lastA=a;
      swirl.style.transform=`rotate(${ang.toFixed(1)}deg)`;swirl.firstElementChild.setAttribute('opacity','.75');const n=performance.now();if(n-lastB>220){lastB=n;SND.bubble()}},
    onRelease:()=>{lastA=null;swirl.firstElementChild.setAttribute('opacity','0')},
    onTap:()=>{ang+=120;swirl.style.transition='transform .42s ease-out';swirl.style.transform=`rotate(${ang}deg)`;swirl.firstElementChild.setAttribute('opacity','.75');setTimeout(()=>{swirl.style.transition='';swirl.firstElementChild.setAttribute('opacity','0')},460);SND.bubble();SND.bubble()},
    onCell:(i,v)=>{cv[i]=v;const g=pcs[i];g.querySelector('.jb-soup').setAttribute('opacity',(v*.95).toFixed(2));g.querySelector('.jb-veg').style.transform=`scale(${(1-.55*v).toFixed(2)}) rotate(${(v*90).toFixed(0)}deg)`;
      const m=cv.reduce((a,b)=>a+b,0)/cv.length;steam.setAttribute('opacity',(.25+.75*m).toFixed(2));if(v>=1&&i%3===0){const [x,y]=ctr(g);spawn(PUFF,x,y-20,{dy:-50,sz:30,ms:900})}},
    onDone:()=>{L.later(()=>{const [x,y]=potC();sparkles(x,y);speak('보글보글, 다 됐다! 그릇에 콕콕 담아 줘.','Bubble bubble, ready! Tap to fill the bowl.');stepServe()},700)}});
  let bowl=null,scoops=0,potLv=1;
  function stepServe(){
    nextStep();bowl=mk('jb-bowl',BOWL(0));Object.assign(bowl.style,{right:'4%',bottom:'24%',width:'30%',aspectRatio:'100/70',zIndex:'3'});
    try{bowl.animate([{transform:'translateY(-40px) scale(.8)',opacity:0},{transform:'scale(1.05,.9)',offset:.7},{transform:'none',opacity:1}],{duration:450,easing:'ease-out'})}catch(_){}
    setTray(`<button class="jb-card" data-act="scoop" aria-label="국자">${TOOL.ladle}</button>`);
    G.start({type:'tap',at:()=>{const [x,y]=potC();return secXY(x,y)}});
    MS.tap=e=>{if(inRect(e,pot.getBoundingClientRect(),10)||inRect(e,bowl.getBoundingClientRect(),20))scoop();else miss()};
    MS.trayDown=()=>scoop();
  }
  let scooping=false;
  function scoop(){
    if(scooping||scoops>=3)return;scooping=true;G.touch();LOG.push('scoop');const [px,py]=potC(),[bx,by]=ctr(bowl);
    const f=floatHTML(TOOL.ladle,px,py,110);SND.bubble();
    try{const a=f.animate([{transform:'none'},{transform:`translate(${(bx-px)*.5}px,${(by-py)*.5-70}px) rotate(-10deg)`,offset:.5},{transform:`translate(${bx-px}px,${by-py-40}px) rotate(-60deg)`}],{duration:700,easing:'ease-in-out',fill:'forwards'});a.onfinish=gd(pour)}catch(_){L.later(pour,700)}
    function pour(){f.remove();scoops++;potLv=1-scoops/3;SND.pour();bowl.innerHTML=BOWL(scoops);bowl.classList.remove('jbsq');try{bowl.animate([{transform:'scale(1.06,.9)'},{transform:'none'}],{duration:350})}catch(_){}
      for(let k=0;k<3;k++)spawn(`<circle r="5" fill="#FF9A3C" stroke="${OL}" stroke-width="1"/>`,bx+rnd(-20,20),by-10,{dy:-20,sz:20,ms:500});
      pot.querySelector('.jb-broth').setAttribute('ry',(34*(.55+.45*potLv)).toFixed(1));pcs.forEach(g=>g.querySelector('.jb-soup').setAttribute('opacity',(.95*(.4+.6*potLv)).toFixed(2)));
      scooping=false;if(scoops<3){speak(scoops===1?'하나!':'둘!',scoops===1?'One!':'Two!')}else{speak('셋! 가득 찼다!','Three! All full!');MS.tap=null;MS.trayDown=null;G.stop();setTray('');L.later(serve,800)}}
  }
  function serve(){
    const g=guest.getBoundingClientRect(),b=bowl.getBoundingClientRect(),tx=g.left+g.width*.5-(b.left+b.width/2),ty=g.top+g.height*.86-(b.top+b.height/2);LOG.push('serve');
    try{bowl.animate([{transform:'none'},{transform:`translate(${tx}px,${ty}px) scale(.8)`}],{duration:800,easing:'ease-in-out',fill:'forwards'})}catch(_){}
    L.later(()=>{if(gAl){gAl.setMood('wow')}let n=0;const chomp=()=>{if(n++<3){SFX.chomp();const [x,y]=ctr(guest);spawn(HEART,x,y,{dy:-50,sz:30});setTimeout(chomp,420)}};chomp()},900);
    L.later(()=>{bowl.innerHTML=BOWL(0);thanks(guest,gAl,J.thanks)},2400);
  }
  return Object.assign({R,get pot(){const r=pot.getBoundingClientRect();return[r.left,r.top,r.width,r.height]},get potAim(){return potC()},get stir(){return cv.slice()},get scoops(){return scoops},get bowl(){return bowl?ctr(bowl):null}},MS_BASE());
}

/* ---------- police: stop both cars with the sign, then the duck family crosses (whistle each time) ---------- */
function mPolice(){
  const J=JOB.police,R={},cols=shuffle(['#F3C6C1','#CFE5F4','#CFE6CB','#F7E8B8']);
  const cars=[{l:2,t:30,flip:false,c:cols[0]},{l:64,t:47,flip:true,c:cols[1]}].map((o,k)=>{const e=mk('jb-carx',carSVG(o.c,o.flip));Object.assign(e.style,{left:o.l+'%',top:o.t+'%',width:'34%',aspectRatio:'200/110',zIndex:'1'});return{el:e,lv:0,stop:false,o}});
  const DX=[[50,68],[41,75],[50,80],[59,75]];/* mother first, then three babies (stage %) */
  const ducks=[true,false,false,false].map((big,k)=>{const e=mk('jb-duck',DUCK(big));const w=big?16:12;Object.assign(e.style,{left:(DX[k][0]-w/2)+'%',top:DX[k][1]+'%',width:w+'%',aspectRatio:'1',zIndex:'2'});return{el:e,big,across:false,w}});
  const zone=mk('jb-hit');Object.assign(zone.style,{left:'30%',top:'64%',width:'40%',height:'28%'});
  const mom=ducks[0].el;const momAl=null;
  L.later(()=>{speak(J.hello[0],J.hello[1]);SND.quack()},400);
  const sr=stR(),cells=[],group=[];
  cars.forEach((c,k)=>{const r=c.el.getBoundingClientRect();[[.3,.45],[.5,.4],[.7,.45],[.5,.65]].forEach(([fx,fy])=>{cells.push([(r.left-sr.left+fx*r.width)/sr.width,(r.top-sr.top+fy*r.height)/sr.height]);group.push(k)})});
  const cv=cells.map(()=>0);
  toolStep({icon:'sign',anchor:[.5,.45],gap:.25,radius:.12,rate:.55,cells,target:()=>stR(),say:['멈춤 표지판! 차 위에 들어 봐요.','The stop sign! Hold it up at the cars.'],guide:'hold',
    guideAt:()=>{const c=cars.find(x=>!x.stop)||cars[0];const [x,y]=ctr(c.el);return secXY(x,y)},
    onTouch:()=>{SND.whistle()},onTap:()=>SND.whistle(),
    onCell:(i,v)=>{cv[i]=v;const k=group[i],c=cars[k];const ix=group.map((g,j)=>g===k?j:-1).filter(j=>j>=0);c.lv=ix.reduce((s,j)=>s+cv[j],0)/ix.length;
      c.el.querySelector('.jb-brake').setAttribute('fill',c.lv>0?`rgba(255,90,95,${(.3+.7*c.lv).toFixed(2)})`:'#E9B4AE');
      if(c.lv>=1&&!c.stop){c.stop=true;c.el.classList.add('stop');SND.screech();setTimeout(SND.horn,450);LOG.push('carstop:'+k);const [x,y]=ctr(c.el);sparkles(x,y,.6);
        if(cars.some(z=>!z.stop)){speak('멈췄다! 한 대 더!','Stopped! One more!')}}},
    onDone:()=>{L.later(()=>{speak('차가 다 멈췄어! 호루라기를 불며 오리를 콕콕!','All stopped! Blow the whistle and tap the ducks!');stepDucks()},700)}});
  function stepDucks(){
    nextStep();setTray(`<button class="jb-card" data-act="whistle" aria-label="호루라기">${WHISTLE}</button>`);
    G.start({type:'tap',at:()=>{const d=ducks.find(x=>!x.across);if(!d)return[0,0];const [x,y]=ctr(d.el);return secXY(x,y)}});
    MS.tap=e=>{const r=zone.getBoundingClientRect();if(inRect(e,r)||ducks.some(d=>!d.across&&inRect(e,d.el.getBoundingClientRect(),20))){let b=null,bd=1e9;ducks.forEach(d=>{if(d.across)return;const [x,y]=ctr(d.el),q=Math.hypot(x-e.clientX,y-e.clientY);if(q<bd){bd=q;b=d}});if(b)cross(b)}else miss()};
    MS.trayDown=()=>{const d=ducks.find(x=>!x.across);if(d)cross(d)};
  }
  let crossed=0;
  function cross(d){
    if(d.across)return;d.across=true;G.touch();SND.whistle();setTimeout(SND.quack,250);LOG.push('duck');const k=ducks.indexOf(d);
    d.el.classList.add('walk');d.el.style.top=(12+k%2*4)+'%';d.el.style.left=(30+k*10)+'%';
    L.later(()=>{d.el.classList.remove('walk');crossed++;const [x,y]=ctr(d.el);spawn(HEART,x,y-10,{dy:-40,sz:28});
      if(crossed>=ducks.length){MS.tap=null;MS.trayDown=null;G.stop();setTray('');L.later(()=>{cars.forEach(c=>{c.el.classList.remove('stop');c.el.style.left=(c.o.flip?-50:120)+'%'});SND.horn()},600);L.later(()=>thanks(mom,null,J.thanks),1400)}},1750);
    if(crossed===0&&ducks.filter(x=>x.across).length===1)speak('삐익! 건너가요!','Tweet! Off you go!');
  }
  return Object.assign({R,get cars(){return cars.map(c=>({lv:+c.lv.toFixed(3),stop:c.stop,pt:ctr(c.el)}))},get ducks(){return ducks.map(d=>({across:d.across,pt:ctr(d.el)}))},get zone(){return ctr(zone)}},MS_BASE());
}
/* ---------- helpers for the new jobs: a hit box at least 110px (rules.bigAndFew), a tray card you can tap or drag ---------- */
const MINHIT=110;
const gd=fn=>{const t=L.tok;return(...a)=>{if(L.ok(t))fn(...a)}};   /* a callback that does nothing once the round was left */
function hitOf(el,e,min=MINHIT){const r=el.getBoundingClientRect(),mx=Math.max(8,(min-r.width)/2),my=Math.max(8,(min-r.height)/2);return e.clientX>=r.left-mx&&e.clientX<=r.right+mx&&e.clientY>=r.top-my&&e.clientY<=r.bottom+my}
function nearestOf(list,e,ok){let b=null,bd=1e9;list.forEach(x=>{if(ok&&!ok(x))return;if(!hitOf(x.el,e))return;const [cx,cy]=ctr(x.el),d=Math.hypot(cx-e.clientX,cy-e.clientY);if(d<bd){bd=d;b=x}});return b}
/* a tray card: tap = o.onTap(button), drag onto the stage = o.onDrop(event, float) → true when it was used (else the picture flies back) */
function cardDrag(o){
  let pd=null;
  MS.trayDown=(e,b)=>{pd={id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null,b};try{b.setPointerCapture(e.pointerId)}catch(_){}};
  MS.trayMove=e=>{if(!pd||e.pointerId!==pd.id)return;const sz=o.size||100;
    if(!pd.moved&&Math.hypot(e.clientX-pd.x0,e.clientY-pd.y0)>12){pd.moved=true;pd.f=floatHTML(o.icon(),e.clientX,e.clientY,sz);pd.b.classList.add('lift')}
    if(pd.f){const [x,y]=secXY(e.clientX,e.clientY);pd.f.style.left=(x-sz/2)+'px';pd.f.style.top=(y-sz/2)+'px'}};
  MS.trayUp=e=>{if(!pd||e.pointerId!==pd.id)return;const d=pd;pd=null;d.b.classList.remove('lift');
    if(!d.moved){G.touch();o.onTap(d.b);return}
    if(e.type!=='pointercancel'&&o.onDrop(e,d.f))return;
    if(d.f){const r=d.b.getBoundingClientRect();fly(d.f,r.left+r.width/2,r.top+r.height/2,r.width*.6,260,null,true)}};
}
const cardBtn=(act,html,extra)=>`<button class="jb-card" data-act="${act}"${extra||''} aria-label="${act}">${html}</button>`;
const trayCtr=()=>{const b=tray.querySelector('.jb-card');if(!b){const r=tray.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]}return ctr(b)};
const PET={cat:['고양이','kitty'],dog:['강아지','puppy'],bear:['곰','bear'],bunny:['토끼','bunny']};
const shake=el=>{try{el.animate([{transform:'translateX(0)'},{transform:'translateX(-7px) rotate(-2deg)'},{transform:'translateX(7px) rotate(2deg)'},{transform:'translateX(0)'}],{duration:450,easing:'ease-in-out'})}catch(_){}};
const squash=el=>{try{el.animate([{transform:'scale(1.08,.9)'},{transform:'scale(.96,1.05)'},{transform:'none'}],{duration:420,easing:'ease-out'})}catch(_){}};

/* ---------- mail carrier: (1) each letter into the mailbox with the same picture (2) ride the bike, the parcel to the door with the same picture ---------- */
function mMail(){
  const J=JOB.mail,R={sub:'sort'};
  const boxes=shuffle(SORT_KEYS.slice()).map((k,i)=>{const e=mk('jb-box',MAILBOX(k,false));Object.assign(e.style,{left:(2+i*33)+'%',top:'4%',width:'30%',aspectRatio:'100/150',zIndex:'1'});return{k,el:e,full:false}});
  const order=shuffle(SORT_KEYS.slice());   /* three letters for three mailboxes (made = used: none is left over) */
  const pile=mk('jb-pile',LETTER_PILE(2));Object.assign(pile.style,{right:'3%',bottom:'5%',width:'40%',aspectRatio:'120/90',zIndex:'1'});
  let cur=0,sending=false;
  L.later(()=>{speak(J.hello[0],J.hello[1])},400);
  const now=()=>order[cur];
  function showLetter(){if(cur>=order.length)return;setTray(cardBtn('letter',LETTER(now()),` data-pic="${now()}"`));pile.innerHTML=LETTER_PILE(order.length-cur-1);
    const b=tray.querySelector('.jb-card');try{b.animate([{transform:'translateY(110%)'},{transform:'none'}],{duration:380,easing:'cubic-bezier(.3,1.3,.5,1)'})}catch(_){}
    G.start({type:'tap',at:()=>{const x=boxes.find(q=>q.k===now());if(!x)return[0,0];const [cx,cy]=ctr(x.el);return secXY(cx,cy)}})}
  showLetter();
  function send(box,f){
    if(sending||!box)return false;G.touch();const k=now(),P=SORTP[k];
    if(box.k!==k){S.wrong++;LOG.push('mailwrong:'+box.k);shake(box.el);tone(330,.18,'sine',.12);const Q=SORTP[box.k];
      speak(`어? 여기는 ${Q.ko} 우체통이야. ${P.ko} 그림을 찾아 봐!`,`Oh? This is the ${Q.en} mailbox. Find the ${P.en}!`);if(al)al.play('oops');return false}
    sending=true;LOG.push('letter:'+k);const r=box.el.getBoundingClientRect(),tx=r.left+r.width*.5,ty=r.top+r.height*.26;
    if(!f){const [cx,cy]=trayCtr();f=floatHTML(LETTER(k),cx,cy,100)}setTray('');
    fly(f,tx,ty,30,420,gd(()=>{box.full=true;box.el.innerHTML=MAILBOX(box.k,false);requestAnimationFrame(()=>requestAnimationFrame(()=>{const fl=box.el.querySelector('.jb-flag');if(fl){fl.style.opacity='1';fl.style.transform='none'}}));
      squash(box.el);SND.stick();sparkles(tx,ty,.6);cur++;sending=false;
      if(cur<order.length){const p=praise();speak(`쏙! ${p[0]} 다음 편지는 ${SORTP[now()].ko}!`,`In it goes! ${p[1]} Next, the ${SORTP[now()].en}!`);showLetter()}
      else{G.stop();MS.tap=null;cardDrag({icon:()=>'',onTap:()=>{},onDrop:()=>false});L.later(()=>{speak('편지를 다 넣었어! 이제 자전거를 타고 소포를 배달해요. 자전거를 콕콕!','All the letters are in! Now ride the bike with the parcel. Tap the bike!');task2()},900)}}),true);
    return true;
  }
  MS.tap=e=>{if(R.sub!=='sort')return;const b=nearestOf(boxes,e,x=>!x.full);if(b)send(b,null);else miss()};
  cardDrag({icon:()=>LETTER(now()),size:100,onTap:()=>{const P=SORTP[now()];speak(`${P.ko} 편지! ${P.ko} 우체통은 어디 있지?`,`A ${P.en} letter! Where is the ${P.en} mailbox?`);G.nudge()},
    onDrop:(e,f)=>{const b=nearestOf(boxes,e,x=>!x.full);if(!b)return false;return send(b,f)}});
  /* task 2: ride and deliver */
  let bike=null,houses=[],pk=null,pos=0,riding=false,holdT=0,delivered=false,vest='#E0786F';
  function task2(){
    nextStep();R.sub='ride';bgEl.innerHTML=bgSVG(BG.village);world.innerHTML='';dollEl.style.opacity='0';
    const kinds=shuffle(['cat','dog','bear']);pk=pick(kinds);R.parcel=pk;
    houses=kinds.map((k,i)=>{const e=mk('jb-house2',friendHouse(k,false));Object.assign(e.style,{left:(1+i*33)+'%',top:'12%',width:'32%',aspectRatio:'120/150',zIndex:'1'});return{k,el:e}});
    vest=S.wear.top?pal(S.wear.top.col).vivid:'#E0786F';
    bike=mk('jb-bike',bikeSVG(headSVG(S.d,S.job,S.wear),vest,pk));Object.assign(bike.style,{left:'-4%',bottom:'3%',width:'58%',aspectRatio:'200/150',zIndex:'3'});
    try{bike.animate([{transform:'translateX(-60%)',opacity:0},{transform:'none',opacity:1}],{duration:600,easing:'ease-out'})}catch(_){}
    setTray(`<div class="jb-toolpic">${BIKE_ICON}</div>`);
    G.start({type:'tap',at:()=>{const [x,y]=ctr(bike);return secXY(x,y)}});
    MS.tap=e=>{if(R.sub==='ride'){if(hitOf(bike,e,140)){push();clearInterval(holdT);holdT=setInterval(()=>{if(R.sub==='ride')push();else clearInterval(holdT)},560)}else miss();return}
      if(R.sub==='deliver'){const h=nearestOf(houses,e);if(h)deliver(h,null);else miss()}};
    MS.up=()=>{clearInterval(holdT);holdT=0};L.onEnd(()=>clearInterval(holdT));
    MS.trayDown=null;MS.trayMove=null;MS.trayUp=null;
  }
  function push(){
    if(riding||pos>=1)return;riding=true;G.touch();pos=Math.min(1,pos+1/3);LOG.push('pedal');
    bike.style.left=(-4+pos*46)+'%';bike.classList.add('ride');SND.pedal();if(pos===1/3)SND.bell();
    const [x,y]=ctr(bike);spawn(PUFF,x-bike.offsetWidth*.45,y+bike.offsetHeight*.35,{dy:-10,dx:-30,sz:26,ms:700});
    L.later(()=>{bike.classList.remove('ride');riding=false;if(pos>=1&&R.sub==='ride')arrive()},650);
  }
  function arrive(){
    R.sub='deliver';clearInterval(holdT);SND.bell();G.stop();const P=PET[pk];
    speak(`도착! 소포에 ${P[0]} 그림이 있네. ${P[0]} 그림 집 문을 콕!`,`We're here! The parcel has a ${P[1]}. Tap the door with the ${P[1]}!`);
    setTray(cardBtn('parcel',PARCEL(pk),` data-pic="${pk}"`));
    G.start({type:'tap',at:()=>{const h=houses.find(q=>q.k===pk);const [x,y]=ctr(h.el);return secXY(x,y)}});
    cardDrag({icon:()=>PARCEL(pk),size:96,onTap:()=>{const P2=PET[pk];speak(`${P2[0]} 소포! ${P2[0]} 집은 어디 있지?`,`A parcel for the ${P2[1]}! Where does the ${P2[1]} live?`);G.nudge()},
      onDrop:(e,f)=>{const h=nearestOf(houses,e);if(!h)return false;return deliver(h,f)}});
  }
  function deliver(h,f){
    if(delivered)return false;G.touch();
    if(h.k!==pk){S.wrong++;LOG.push('doorwrong:'+h.k);shake(h.el);tone(330,.18,'sine',.12);const a=PET[h.k],b=PET[pk];
      speak(`어? 여기는 ${a[0]}네 집이야. ${b[0]} 그림을 찾아 봐!`,`Oh? The ${a[1]} lives here. Find the ${b[1]}!`);return false}
    delivered=true;R.sub='done';LOG.push('parcel');G.stop();MS.tap=null;const r=h.el.getBoundingClientRect(),tx=r.left+r.width*.65,ty=r.top+r.height*.78;
    if(!f){const r0=bike.getBoundingClientRect();f=floatHTML(PARCEL(pk),r0.left+r0.width*.8,r0.top+r0.height*.3,60)}setTray('');SND.knock();bike.innerHTML=bikeSVG(headSVG(S.d,S.job,S.wear),vest,null);
    fly(f,tx,ty,r.width*.32,520,gd(()=>{h.el.innerHTML=friendHouse(h.k,true);SND.stick();
      const fr=mk('jb-help',A.animal(h.k,'happy'));Object.assign(fr.style,{left:(parseFloat(h.el.style.left)+8)+'%',top:'26%',width:'26%',aspectRatio:'200/230',zIndex:'4'});
      try{fr.animate([{transform:'scale(.3) translateY(30%)',opacity:0},{transform:'scale(1.08)',opacity:1,offset:.7},{transform:'none'}],{duration:520,easing:'ease-out'})}catch(_){}
      const fa=attachHelp(fr,h.k);L.later(()=>thanks(fr,fa,J.thanks),700)}));
    return true;
  }
  return Object.assign({R,get sub(){return R.sub},get boxes(){return boxes.map(b=>({k:b.k,full:b.full,pt:ctr(b.el)}))},get letter(){return cur<order.length?now():null},get sorted(){return cur},
    get bike(){return bike?ctr(bike):null},get ride(){return pos},get parcel(){return pk},get houses(){return houses.map(h=>({k:h.k,pt:ctr(h.el)}))},get delivered(){return delivered}},MS_BASE());
}

/* ---------- farmer: (1) dig, plant, water (only the watered patch grows), pull three carrots for Toto (2) feed the hen, put the egg in the basket ---------- */
function mFarmer(){
  const J=JOB.farmer,R={sub:'dig'};
  const bunny=mk('jb-help',A.animal('bunny','sad'));Object.assign(bunny.style,{right:'1%',bottom:'3%',width:'40%',aspectRatio:'200/230',zIndex:'2'});
  const bAl=attachHelp(bunny,'bunny',{waiting:true});if(bAl)bAl.setMood('sad');
  const basket=mk('jb-basket',BASKET({c:0}));Object.assign(basket.style,{left:'40%',bottom:'3%',width:'24%',aspectRatio:'120/80',zIndex:'2'});
  const SP=[22,50,78];
  const spots=SP.map((x,i)=>{const e=mk('jb-soil',SOILP);Object.assign(e.style,{left:(x-14)+'%',top:'21%',width:'28%',aspectRatio:'100/110',zIndex:'1'});return{i,el:e,st:'flat',g:0}});
  const setSt=(s,st)=>{s.st=st;s.el.className='jb-soil '+st};
  const cellOf=s=>{const r=s.el.getBoundingClientRect(),sr=stR();return[(r.left-sr.left+r.width/2)/sr.width,(r.top-sr.top+r.height*.84)/sr.height]};
  let carrots=0;
  L.later(()=>{speak(J.hello[0],J.hello[1])},400);
  function tapStep(sub,card,want,act,next,guideKo){
    R.sub=sub;setTray(card);
    G.start({type:'tap',at:()=>{const s=spots.find(x=>x.st===want);if(!s)return[0,0];const [x,y]=ctr(s.el);return secXY(x,y+s.el.offsetHeight*.3)}});
    MS.tap=e=>{if(R.sub!==sub)return;const s=nearestOf(spots,e,x=>x.st===want);if(s)act(s);else miss()};
    cardDrag({icon:()=>card.replace(/^<button[^>]*>/,'').replace(/<\/button>$/,''),size:90,onTap:()=>{const s=spots.find(x=>x.st===want);if(s)act(s)},onDrop:(e,f)=>{const s=nearestOf(spots,e,x=>x.st===want);if(!s)return false;if(f)f.remove();act(s);return true}});
  }
  function dig(s){if(s.st!=='flat')return;G.touch();LOG.push('dig');const [x,y]=ctr(s.el),yy=y+s.el.offsetHeight*.3;
    const f=floatHTML(SHOVEL,x+20,yy-50,96);try{f.animate([{transform:'rotate(-20deg)'},{transform:'translate(-6px,22px) rotate(10deg)',offset:.45},{transform:'translate(10px,-10px) rotate(-30deg)'}],{duration:520,easing:'ease-in-out'}).onfinish=()=>f.remove()}catch(_){f.remove()}setTimeout(()=>f.remove(),700);
    L.later(()=>{setSt(s,'hole');SND.dig();for(let k=0;k<5;k++)spawn(`<circle r="${4+k%3}" fill="#9E7A5C"/>`,x+rnd(-10,30),yy,{dx:rnd(10,50),dy:-30-rnd(0,20),sz:20,ms:600});squash(s.el);
      if(spots.every(q=>q.st!=='flat')){speak('구멍 세 개! 이제 씨앗을 콕콕 심어요.','Three holes! Now plant the seeds.');tapStep('seed',cardBtn('seeds',SEEDS),'hole',plant)}},260)}
  function plant(s){if(s.st!=='hole')return;G.touch();LOG.push('seed');const [x,y]=ctr(s.el),yy=y+s.el.offsetHeight*.3;
    spawn(`<ellipse rx="5" ry="3.5" fill="#F0D58A" stroke="${OL}" stroke-width="1.5"/>`,x,yy-60,{dy:56,sz:22,ms:380,s0:1,s1:1});SND.seed();
    L.later(()=>{setSt(s,'seed');squash(s.el);
      if(spots.every(q=>q.st==='seed')){speak('씨앗을 다 심었어! 물뿌리개로 물을 줘요.','All planted! Water them with the watering can.');stepWater()}},380)}
  tapStep('dig',cardBtn('shovel',SHOVEL),'flat',dig);
  function stepWater(){
    R.sub='water';MS.tap=null;MS.trayDown=null;MS.trayMove=null;MS.trayUp=null;
    const cells=[],group=[];spots.forEach((s,k)=>{const [cx,cy]=cellOf(s);[[-.07,0],[0,-.02],[.07,0]].forEach(([dx,dy])=>{cells.push([cx+dx,cy+dy]);group.push(k)})});const cv=cells.map(()=>0);
    toolStep({icon:'can',effect:'water',anchor:[.12,.86],gap:.95,radius:.1,rate:.5,cells,target:()=>stR(),say:['물뿌리개! 쪼르르 물을 줘요.','The watering can! Water the seeds.'],
      guideAt:()=>{const s=spots.find(x=>x.g<1)||spots[0];const [x,y]=ctr(s.el);return secXY(x,y+s.el.offsetHeight*.3)},
      sound:()=>P.holdSound('shower'),
      onCell:(i,v)=>{cv[i]=v;const k=group[i],s=spots[k];const g=[0,1,2].map(q=>cv[k*3+q]).reduce((a,b)=>a+b,0)/3;s.g=g;
        if(s.st==='seed'&&g>0)setSt(s,'grow');const sp=s.el.querySelector('.g-sprout');if(sp)sp.style.transform=`scale(${(.2+.8*g).toFixed(2)})`;
        if(g>=1&&s.st==='grow'){setSt(s,'carrot');const [x,y]=ctr(s.el);sparkles(x,y,.6);sfx.pop()}},
      onDone:()=>{spots.forEach(s=>{if(s.st!=='carrot')setSt(s,'carrot')});L.later(()=>{speak('쑥쑥 자랐다! 당근을 쏙 뽑아요. 콕!','They grew! Pull up the carrots. Tap!');
        tapStep('pull',cardBtn('pull',PULL),'carrot',pull)},700)}});
  }
  function pull(s){if(s.st!=='carrot')return;G.touch();LOG.push('carrot');setSt(s,'pulled');const [x,y]=ctr(s.el);
    const f=floatHTML(CARROT,x,y,90),b=basket.getBoundingClientRect();sfx.pop();
    try{f.animate([{transform:'rotate(-8deg)'},{transform:'rotate(8deg)',offset:.15},{transform:'rotate(-6deg)',offset:.3},{transform:'translateY(-50px) rotate(0)',offset:.55},{transform:`translate(${b.left+b.width/2-x}px,${b.top+b.height*.3-y}px) scale(.45) rotate(30deg)`}],{duration:900,easing:'ease-in-out',fill:'forwards'}).onfinish=()=>f.remove()}catch(_){f.remove()}setTimeout(()=>f.remove(),1100);
    L.later(()=>{carrots++;basket.innerHTML=BASKET({c:carrots});squash(basket);SND.stick();
      if(carrots<3){speak(carrots===1?'하나!':'둘!',carrots===1?'One!':'Two!')}else{speak('셋! 당근 세 개!','Three! Three carrots!');feedBunny()}},900)}
  function feedBunny(){
    R.sub='munch';MS.tap=null;MS.trayDown=null;setTray('');G.stop();
    L.later(()=>{if(bAl){bAl.setMood('happy');bAl.play('hop',{n:2})}let n=0;const chomp=()=>{if(n++<3){SFX.chomp();const [x,y]=ctr(bunny);spawn(HEART,x,y-20,{dy:-50,sz:30});L.later(chomp,420)}};chomp();basket.innerHTML=BASKET({c:0});speak('토토가 냠냠! 고마워!','Toto says yum yum! Thank you!')},500);
    L.later(task2,3200);
  }
  /* task 2: the hen */
  let hen=null,hAl=null,feeds=0,egg=null,eggIn=false;
  function task2(){
    nextStep();R.sub='feed';
    try{bunny.animate([{transform:'none',opacity:1},{transform:'translate(40%,-10%) scale(.8)',opacity:0}],{duration:600,fill:'forwards'})}catch(_){bunny.style.opacity='0'}
    const nest=mk('jb-nest',NEST);Object.assign(nest.style,{right:'4%',bottom:'4%',width:'44%',aspectRatio:'160/50',zIndex:'1'});
    hen=mk('jb-help jb-hen',HEN);Object.assign(hen.style,{right:'6%',bottom:'6%',width:'40%',aspectRatio:'200/230',zIndex:'2'});
    try{hen.animate([{transform:'translateX(80%)',opacity:0},{transform:'none',opacity:1}],{duration:700,easing:'ease-out'})}catch(_){}
    L.later(()=>{helpAl=helpAl.filter(h=>{if(h===bAl){h.detach();return false}return true});hAl=attachHelp(hen,'hen')},700);
    speak('암탉이 배고프대요. 모이를 콕콕 주세요!','The hen is hungry. Give it some grain!');
    setTray(cardBtn('grain',GRAIN));
    G.start({type:'tap',at:()=>{const [x,y]=ctr(hen);return secXY(x,y+hen.offsetHeight*.2)}});
    MS.tap=e=>{if(R.sub==='feed'){if(hitOf(hen,e,140))feed();else miss()}else if(R.sub==='egg'){if(egg&&hitOf(egg,e))takeEgg();else miss()}};
    cardDrag({icon:()=>GRAIN,size:90,onTap:()=>{if(R.sub==='feed')feed();else if(R.sub==='egg')takeEgg()},onDrop:(e,f)=>{if(R.sub==='feed'&&hitOf(hen,e,160)){if(f)f.remove();feed();return true}if(R.sub==='egg'&&egg&&hitOf(basket,e,160)){if(f)f.remove();takeEgg();return true}return false}});
  }
  let pecking=false;
  function feed(){if(pecking||feeds>=3)return;pecking=true;G.touch();feeds++;LOG.push('feed');const r=hen.getBoundingClientRect();
    for(let k=0;k<6;k++)spawn(`<ellipse rx="3.4" ry="2.2" fill="#D6B565" stroke="${OL}" stroke-width="1"/>`,r.left+r.width*rnd(.05,.4),r.top+r.height*.9,{dy:-14,dx:rnd(-16,16),sz:16,ms:700,s0:1,s1:1});
    hen.classList.remove('peck');void hen.offsetWidth;hen.classList.add('peck');L.later(()=>{SND.peck();L.later(SND.peck,170)},180);
    L.later(()=>{pecking=false;if(feeds<3){speak('콕콕 냠냠!','Peck peck!')}else layEgg()},700)}
  function layEgg(){
    R.sub='egg';G.stop();SND.cluck();if(hAl)hAl.play('hop',{n:2});speak('꼬꼬댁! 달걀을 낳았어요! 달걀을 콕!','Cluck! The hen laid an egg! Tap the egg!');
    egg=mk('jb-egg',EGG);Object.assign(egg.style,{right:'21%',bottom:'3%',width:'16%',aspectRatio:'60/70',zIndex:'4'});
    try{egg.animate([{transform:'translateY(-30px) scale(.5)',opacity:0},{transform:'scale(1.1,.88)',opacity:1,offset:.7},{transform:'none'}],{duration:500,easing:'ease-out'})}catch(_){}
    setTray(cardBtn('egg',BASKET({c:0})));
    G.start({type:'tap',at:()=>{const [x,y]=ctr(egg);return secXY(x,y)}});
  }
  function takeEgg(){if(eggIn||!egg)return;eggIn=true;G.touch();G.stop();LOG.push('egg');MS.tap=null;MS.trayDown=null;setTray('');const b=basket.getBoundingClientRect();
    fly(egg,b.left+b.width/2,b.top+b.height*.35,b.width*.25,600,gd(()=>{basket.innerHTML=BASKET({c:0,e:true});squash(basket);SND.stick();sparkles(b.left+b.width/2,b.top,.6);L.later(()=>thanks(hen,hAl,J.thanks),500)}))}
  return Object.assign({R,get sub(){return R.sub},get spots(){return spots.map(s=>({st:s.st,g:+s.g.toFixed(2),pt:(()=>{const [x,y]=ctr(s.el);return[x,y+s.el.offsetHeight*.3]})()}))},get carrots(){return carrots},
    get hen(){return hen?ctr(hen):null},get feeds(){return feeds},get egg(){return egg&&!eggIn?ctr(egg):null},get eggIn(){return eggIn}},MS_BASE());
}

/* ---------- vet: (1) listen to the puppy, wrap the sore paw three times (2) three drops of medicine, the puppy jumps for joy ---------- */
function mVet(){
  const J=JOB.vet,R={sub:'listen'};
  const table=mk('',VTABLE);Object.assign(table.style,{right:'-4%',bottom:'5%',width:'84%',aspectRatio:'300/120',zIndex:'1'});
  const pup=mk('jb-help',A.animal('dog','sad'));Object.assign(pup.style,{right:'6%',bottom:'17%',width:'56%',aspectRatio:'200/230',zIndex:'2'});
  const pAl=attachHelp(pup,'dog');if(pAl)pAl.setMood('sad');
  const PAWXY=[156,197];
  const sore=document.createElement('div');sore.className='jb-spot';Object.assign(sore.style,{left:(PAWXY[0]/200*100)+'%',top:(PAWXY[1]/230*100)+'%',width:'20%',aspectRatio:'1'});sore.innerHTML=SOREPAW;pup.appendChild(sore);
  const wrapEl=document.createElement('div');wrapEl.className='jb-spot jb-wrap';Object.assign(wrapEl.style,{left:sore.style.left,top:sore.style.top,width:'24%',aspectRatio:'1'});pup.appendChild(wrapEl);
  let wraps=0,drops=0;
  L.later(()=>{speak(J.hello[0],J.hello[1]);tone(300,.3,'sine',.08)},400);
  const chestR=()=>{const r=pup.getBoundingClientRect();return{x:r.left+100/200*r.width,y:r.top+182/230*r.height,rx:42/200*r.width,ry:30/230*r.height}};
  const mouth=()=>{const r=pup.getBoundingClientRect();return[r.left+100/200*r.width,r.top+128/230*r.height]};
  let lastBeat=0,said=false;
  toolStep({icon:'vscope',anchor:[.5,.78],gap:.18,radius:.1,rate:.42,cells:CHEST.map(([x,y])=>[x/200,(y+8)/230]),target:()=>pup.getBoundingClientRect(),face:()=>{const r=pup.getBoundingClientRect();return{left:r.left+r.width*.15,right:r.right-r.width*.15,top:r.top+r.height*.1,bottom:r.top+r.height*.62,width:r.width*.7,height:r.height*.52}},say:['청진기! 강아지 가슴에 대 봐요.','The stethoscope! Listen to the puppy.'],
    guideAt:()=>{const c=chestR();return secXY(c.x,c.y)},
    onFrame:(F)=>{const s=stR(),c=chestR(),x=s.left+F.x,y=s.top+F.y;const on=((x-c.x)/c.rx)**2+((y-c.y)/c.ry)**2<=1.6;const n=performance.now();
      if(on&&n-lastBeat>700){lastBeat=n;SND.thump();LOG.push('beat');spawn(HEART,c.x+rnd(-10,10),c.y-10,{dy:-60,sz:34,ms:1000});if(pAl)pAl.setMood('wow');if(!said){said=true;speak('두근두근!','Thump thump!')}}},
    onRelease:()=>{if(pAl)pAl.setMood('sad')},
    onTap:()=>{const c=chestR();SND.thump();spawn(HEART,c.x,c.y-10,{dy:-60,sz:34,ms:1000})},
    onCell:()=>{},
    onDone:()=>{L.later(()=>{speak('튼튼한 소리! 이제 아픈 발에 붕대를 감아 줘. 콕콕!','A strong heart! Now wrap the sore paw. Tap tap!');stepWrap()},700)}});
  function stepWrap(){
    R.sub='wrap';nextStep();setTray(cardBtn('bandage',BANDAGE));
    G.start({type:'tap',at:()=>{const [x,y]=ctr(sore);return secXY(x,y)}});
    MS.tap=e=>{if(R.sub!=='wrap')return;if(hitOf(sore,e))wrap();else miss()};
    cardDrag({icon:()=>BANDAGE,size:90,onTap:wrap,onDrop:(e,f)=>{if(!hitOf(sore,e,140))return false;if(f)f.remove();wrap();return true}});
  }
  let wrapping=false;
  function wrap(){if(wrapping||wraps>=3||R.sub!=='wrap')return;wrapping=true;G.touch();wraps++;LOG.push('wrap');
    const [x,y]=ctr(sore),f=floatHTML(BANDAGE,x,y,70);try{f.animate([{transform:'translateX(-30px) rotate(0)'},{transform:'translateX(30px) rotate(200deg)',offset:.5},{transform:'translateX(-20px) rotate(360deg) scale(.6)',opacity:0}],{duration:520,easing:'ease-in-out'}).onfinish=()=>f.remove()}catch(_){f.remove()}setTimeout(()=>f.remove(),700);
    L.later(()=>{wrapEl.innerHTML=WRAP(wraps);if(wraps>=3)sore.style.opacity='0';SND.stick();squash(wrapEl);if(pAl)pAl.play('hop');wrapping=false;
      if(wraps<3)speak(wraps===1?'한 번!':'두 번!',wraps===1?'Once!':'Twice!');else{speak('붕대를 다 감았어! 이제 약을 먹여요. 스포이트로 세 방울!','All wrapped! Now the medicine. Three drops!');MS.tap=null;stepMeds()}},460)}
  function stepMeds(){
    R.sub='meds';setTray(cardBtn('meds',MEDS(3)));
    G.start({type:'tap',at:()=>{const [x,y]=mouth();return secXY(x,y)}});
    MS.tap=e=>{if(R.sub!=='meds')return;const [x,y]=mouth();if(Math.hypot(e.clientX-x,e.clientY-y)<Math.max(70,pup.offsetWidth*.32))drop();else miss()};
    cardDrag({icon:()=>DROPPER,size:90,onTap:drop,onDrop:(e,f)=>{const [x,y]=mouth();if(Math.hypot(e.clientX-x,e.clientY-y)>Math.max(90,pup.offsetWidth*.4))return false;if(f)f.remove();drop();return true}});
  }
  let dropping=false;
  function drop(){if(dropping||drops>=3||R.sub!=='meds')return;dropping=true;G.touch();LOG.push('drop');const [mx,my]=mouth(),[cx,cy]=trayCtr();
    const f=floatHTML(DROPPER,cx,cy,80);fly(f,mx+8,my-46,80,420,()=>{});
    L.later(()=>{drops++;spawn(DROP_PINK,mx+8,my-14,{dy:14,sz:22,ms:400,s0:1,s1:.6});SND.slurp();if(pAl){pAl.setMood('wow')}const b=tray.querySelector('.jb-card');if(b)b.innerHTML=MEDS(3-drops);
      L.later(()=>{if(pAl)pAl.setMood('sad');dropping=false;if(drops<3){speak(drops===1?'한 방울!':'두 방울!',drops===1?'One drop!':'Two drops!')}else healed()},480)},460)}
  function healed(){R.sub='done';G.stop();MS.tap=null;MS.trayDown=null;setTray('');
    if(pAl){pAl.setMood('happy');pAl.play('hop',{n:3})}SFX.ding&&SFX.ding();const [x,y]=ctr(pup);celebrate(x,y);speak('다 나았다! 폴짝폴짝!','All better! Jump jump!');
    try{pup.animate([{transform:'none'},{transform:'translateY(-18%)'},{transform:'none'},{transform:'translateY(-14%)'},{transform:'none'},{transform:'translateY(-10%)'},{transform:'none'}],{duration:1500,easing:'ease-in-out'})}catch(_){}
    L.later(()=>thanks(pup,pAl,J.thanks),1600)}
  return Object.assign({R,get sub(){return R.sub},get chest(){const c=chestR();return[c.x,c.y]},get paw(){return ctr(sore)},get mouth(){return mouth()},get wraps(){return wraps},get drops(){return drops}},MS_BASE());
}
const MISSION={firefighter:mFire,doctor:mDoctor,chef:mChef,police:mPolice,mail:mMail,farmer:mFarmer,vet:mVet};

/* ---------- touches on the stage ---------- */
stage.addEventListener('pointerdown',e=>{
  actx();if(!S)return;
  if(phase==='dress'){dressDown(e);return}
  if(phase==='car'){const r=carEl.getBoundingClientRect();if(inRect(e,r,10)){e.preventDefault();G.touch();tryGo()}else miss();return}
  if(phase==='mission'&&MS&&MS.tap){e.preventDefault();MS.tap(e);return}
  if(phase==='pick'){G.nudge()}
});
const upMS=e=>{if(phase==='mission'&&MS&&MS.up)MS.up(e)};window.addEventListener('pointerup',upMS);window.addEventListener('pointercancel',upMS);
backBtn.addEventListener('click',()=>{if(phase==='pick')return;actx();sfx.pop();showPick()});

/* ============================== test hooks ============================== */
M.__jbLevel=n=>{DATA.level=Math.max(1,Math.min(MADE,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)showPick();return levelNo()};
M.__jbGo=()=>tryGo();
M.__jb=()=>{
  const cards=[...tray.querySelectorAll('.jb-card:not(.out)')].map(b=>{const r=b.getBoundingClientRect();return{job:b.dataset.job||null,slot:b.dataset.slot||null,decoy:!!b.dataset.decoy,act:b.dataset.act||null,pt:[r.left+r.width/2,r.top+r.height/2],w:r.width,h:r.height}});
  const cr=carEl.getBoundingClientRect(),carOn=!!carEl.innerHTML&&carEl.classList.contains('in')&&!carEl.classList.contains('out');
  const ms={};if(MS){['fires','cat','spots','bear','chest','pot','potAim','stir','scoops','bowl','cars','ducks','zone','sub','boxes','letter','sorted','bike','ride','parcel','houses','delivered','carrots','hen','feeds','egg','eggIn','paw','mouth','wraps','drops'].forEach(k=>{try{const v=MS[k];if(v!==undefined)ms[k]=v}catch(_){}})}
  return{phase,mstep:S?S.mstep||0:0,level:lv.level,levelJobs:lv.jobs.slice(),decoyLevel:lv.decoy,job:S?S.job:null,shown:shown.slice(),wear:S?Object.fromEntries(Object.entries(S.wear).map(([k,w])=>[k,pal(w.col).en])):{},
    cards,slotPts:S&&S.job?{hat:dpt(...SLOT_PT.hat),top:dpt(...SLOT_PT.top),tool:dpt(...toolPt(S.job))}:{},doll:(()=>{const r=dR();return[r.left,r.top,r.width,r.height]})(),
    car:carOn?[cr.left+cr.width/2,cr.top+cr.height/2,cr.width,cr.height]:null,canGo,allWorn:allWorn(),busy,misses,tool:!!tool,toolDone:tool?tool.done:null,ms,said:SAID,log:LOG.slice(),
    alive:al?al.state():null,helpers:helpAl.length,photo:!photoEl.hidden,guide:G.state(),
    ask:S?S.ask:null,askLevel:lv.ask,family:lv.family,fam:S&&S.d&&S.d.fam?S.d.fam.id:null,famName:famKo()||null,photoFace:!!dollEl.querySelector('image.jb-photo-face'),made:MADE,fresh:lv.fresh.slice()};
};
/* rules.depth: what each made level has (the steps of one round, the hand actions, the friend, the choice, the ending) */
M.__jbDepth=()=>LEVELS.slice(0,MADE).map((l,i)=>{const v=levelInfo(i+1);const steps=[v.ask?'friend asks · pick the job':'job card','dress ×3','mirror · ride','task 1','task 2','thanks · photo · stamp'];
  if(v.fresh.some(j=>['mail','farmer'].includes(j))||v.two)steps.splice(4,0,'task 1 · more steps');
  return{level:i+1,jobs:v.jobs,fresh:v.fresh,processes:steps.length-1,steps,hands:['tap','drag','tool(makeTool)','card'],someone:!!M.Alive,choice:true,decoy:v.decoy,two:v.two,ask:v.ask,family:v.family,ending:'고마워 · 사진 카드 · 도장'}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)showPick()})},
  exit:()=>{L.begin();gen++;G.stop();clearTool();helpOff();fxEl.innerHTML='';if(al){al.detach();al=null}dd=null;cd=null;busy=false;phase='';MS=null;canGo=false;sec.querySelectorAll('.jb-float').forEach(f=>f.remove())},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* home tile picture: a child in the firefighter's helmet and suit (drawn, no emoji) */
document.querySelectorAll('.tile[data-go="jobs"] .ic').forEach(ic=>{ic.classList.add('jb-ic');ic.innerHTML=doll(DOLLS[1],'firefighter',fullWear('firefighter'),{vb:'20 8 200 250'});const s=ic.querySelector('svg');if(s){s.style.width='1.6em';s.style.height='2em'}});
})();
