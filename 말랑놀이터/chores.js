/* 말랑 집안일 (P8-나) — 토토네 집에서 어지러운 곳을 골라, 일마다 진짜 과정으로 치워 줘요.
   장난감(담기·뚜껑·선반·러그 털기) · 화분(물 받기·물 주기·시든 잎 떼기·햇빛 자리로) · 빨래(넣기·세제·돌리기·널기·개기) · 청소기(먼지·양말·걸레).
   쇠규칙(MLCFG.rules): 글자 없음 · '다음' 버튼 없음(과정이 끝나면 1.5초 이음 장면 뒤 저절로) · 만든 만큼 쓰기(치운 장난감 = 상자 안 장난감) ·
   세 구역(위 과정 그림 줄, 가운데 무대, 아래 도구 칸) · 이모지 없음(그림은 모두 여기서 직접 그림).
   동작: 콕, 쓱쓱(손가락을 따라오는 도구 ML.P2.makeTool: 러그 털개, 물뿌리개, 청소기, 걸레), 옷 접기(쓱), 고르기(어디부터 치울까 카드 3장).
   숫자와 단계는 MLCFG.games.chores(levels, jobs), rules, shell, touch, voice 에서 읽습니다. 단계: ML.Progress.get('chores').level, 없으면 1단계 고정(ML.__choreLevel). */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store}=M;
const {life,noise,sweepTone,SFX}=P;
const id='chores2',GID='chores',L=life(id),OL=A.OL,S3=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`,S2=`stroke="${OL}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG||{},CG=(CF.games||{}).chores||{},RULES=CF.rules||{},SHELL=CF.shell||{},TOUCH=CF.touch||{},VO=CF.voice||{},PAL=(CF.calm||{}).palette||{},CC=(CF.calm||{}).choiceColors||[];
const num=(s,i,d)=>{const m=String(s||'').match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const HEAD_PX=(SHELL.header||{}).heightPx||72,BACK_PX=Math.max(64,num(((RULES.sameLayoutEverywhere||{}).sizes||{}).back,0,64));
const TRAY_R=(SHELL.tray||{}).heightRatio||[.18,.22],STAGE_R=(SHELL.stage||{}).heightRatio||[.6,.66];
const BRIDGE_MS=Math.round(num(((RULES.doNotPressToSkip||{}).replace||{})['다음 ▶'],0,1.5)*1000);
const TAP_LOCK=TOUCH.tapLockMs||1200;
const COV=Object.assign({doneAt:.85,radiusRatio:.16},(((CF.games||{}).petsalon||{}).tools||{}).coverage||{});
const MISS=(VO.onWrongPlace||[{ko:'여기야, 여기!',en:'Right here!'}]).map(m=>[m.ko,m.en]);
const LV=CG.levels&&CG.levels.length?CG.levels:[{level:1,new:'장난감 정리(상자 1개), 화분 물 주기'}];
const LOG=[];
/* not in config: names of the toys and of the jobs' rooms, number of toys / pots / clothes, spin time of the washer */
const TOYS={bear:{ko:'곰인형',en:'teddy bear',cat:'doll'},bunny:{ko:'토끼인형',en:'bunny doll',cat:'doll'},kitty:{ko:'고양이인형',en:'kitty doll',cat:'doll'},doll:{ko:'공주인형',en:'princess doll',cat:'doll'},
  car:{ko:'자동차',en:'car',cat:'car'},bus:{ko:'버스',en:'bus',cat:'car'},truck:{ko:'트럭',en:'truck',cat:'car'},train:{ko:'기차',en:'train',cat:'car'}};
const CATS={doll:{ko:'인형',en:'doll'},car:{ko:'자동차',en:'car'}};
const JOBS=['toys','plants','laundry','vacuum'],JOB_KO={toys:'장난감 방',plants:'화분',laundry:'빨래',vacuum:'거실'};
const STEPS={toys:['sort','lid','shelf','rug'],plants:['fill','water','pluck','sun'],laundry:['load','soap','start'],vacuum:['vac','socks','mop']};
const POTS=[2,3,3,3],CLOTHES=3,SPIN_MS=5000;

/* ============================== pictures (말랑 그림체, brown outline) ============================== */
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const mk3=(c,f)=>`<svg viewBox="0 0 100 100">${f(c)}</svg>`;
const eyes=(y,dx=10,x=50)=>`<circle cx="${x-dx}" cy="${y}" r="3.4" fill="#4A2E20"/><circle cx="${x+dx}" cy="${y}" r="3.4" fill="#4A2E20"/>`;
const TOY_ART={
  bear:c=>`<circle cx="22" cy="26" r="13" fill="${c}" ${S3}/><circle cx="78" cy="26" r="13" fill="${c}" ${S3}/><ellipse cx="50" cy="88" rx="28" ry="12" fill="${c}" ${S3}/><circle cx="50" cy="52" r="34" fill="${c}" ${S3}/><ellipse cx="50" cy="64" rx="15" ry="11" fill="#FFF3E3" ${S2}/>${eyes(46)}<ellipse cx="50" cy="60" rx="4.5" ry="3.2" fill="${OL}"/>`,
  bunny:c=>`<ellipse cx="36" cy="22" rx="9" ry="22" fill="${c}" ${S3}/><ellipse cx="64" cy="22" rx="9" ry="22" fill="${c}" ${S3}/><ellipse cx="36" cy="24" rx="4" ry="14" fill="#FFB3C6"/><ellipse cx="64" cy="24" rx="4" ry="14" fill="#FFB3C6"/><ellipse cx="50" cy="88" rx="26" ry="11" fill="${c}" ${S3}/><circle cx="50" cy="62" r="30" fill="${c}" ${S3}/>${eyes(58,11)}<path d="M45 68Q50 73 55 68" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/><circle cx="35" cy="68" r="4.5" fill="#FF9FB6" opacity=".6"/><circle cx="65" cy="68" r="4.5" fill="#FF9FB6" opacity=".6"/>`,
  kitty:c=>`<path d="M20 44L24 12L50 30Z" fill="${c}" ${S3}/><path d="M80 44L76 12L50 30Z" fill="${c}" ${S3}/><ellipse cx="50" cy="88" rx="26" ry="11" fill="${c}" ${S3}/><circle cx="50" cy="58" r="33" fill="${c}" ${S3}/>${eyes(54,12)}<path d="M44 66Q50 72 56 66M30 62H18M30 68H18M70 62H82M70 68H82" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`,
  doll:c=>`<circle cx="50" cy="38" r="31" fill="#7A4A2A" ${S3}/><path d="M26 98L36 62H64L74 98Z" fill="${c}" ${S3}/><circle cx="50" cy="42" r="23" fill="#FFE4D0" ${S3}/>${eyes(42,9)}<path d="M45 52Q50 57 55 52" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/><circle cx="37" cy="50" r="4" fill="#FF9FB6" opacity=".6"/><circle cx="63" cy="50" r="4" fill="#FF9FB6" opacity=".6"/><path d="M36 22Q50 8 64 22Q50 18 36 22Z" fill="${c}" ${S2}/>`,
  car:c=>`<path d="M8 64Q8 50 22 48L34 30H66L80 48Q94 50 92 64V74H8Z" fill="${c}" ${S3}/><path d="M38 35H49V48H30ZM54 35H63L73 48H54Z" fill="#DCEBF0" ${S2}/><circle cx="28" cy="76" r="12" fill="#5A5A66" ${S3}/><circle cx="72" cy="76" r="12" fill="#5A5A66" ${S3}/><circle cx="28" cy="76" r="4" fill="#fff"/><circle cx="72" cy="76" r="4" fill="#fff"/>`,
  bus:c=>`<rect x="6" y="24" width="88" height="52" rx="12" fill="${c}" ${S3}/>${[0,1,2,3].map(i=>`<rect x="${13+i*20}" y="32" width="15" height="16" rx="3" fill="#DCEBF0" ${S2}/>`).join('')}<path d="M6 58H94" stroke="${OL}" stroke-width="2.4"/><circle cx="28" cy="78" r="11" fill="#5A5A66" ${S3}/><circle cx="72" cy="78" r="11" fill="#5A5A66" ${S3}/><circle cx="28" cy="78" r="3.6" fill="#fff"/><circle cx="72" cy="78" r="3.6" fill="#fff"/>`,
  truck:c=>`<rect x="6" y="30" width="54" height="42" rx="6" fill="#DDE3EA" ${S3}/><path d="M60 42H80L94 58V72H60Z" fill="${c}" ${S3}/><path d="M66 46H78L86 56H66Z" fill="#DCEBF0" ${S2}/><circle cx="26" cy="76" r="11" fill="#5A5A66" ${S3}/><circle cx="76" cy="76" r="11" fill="#5A5A66" ${S3}/><circle cx="26" cy="76" r="3.6" fill="#fff"/><circle cx="76" cy="76" r="3.6" fill="#fff"/>`,
  train:c=>`<rect x="8" y="38" width="56" height="34" rx="8" fill="${c}" ${S3}/><rect x="52" y="22" width="34" height="50" rx="7" fill="#DDE3EA" ${S3}/><rect x="58" y="28" width="22" height="16" rx="3" fill="#DCEBF0" ${S2}/><rect x="16" y="22" width="14" height="18" rx="4" fill="#5A5A66" ${S3}/><circle cx="24" cy="76" r="9" fill="#5A5A66" ${S3}/><circle cx="48" cy="76" r="9" fill="#5A5A66" ${S3}/><circle cx="72" cy="76" r="9" fill="#5A5A66" ${S3}/>`
};
const toySVG=t=>mk3(t.col,TOY_ART[t.name]);
const tee=(c)=>`<svg viewBox="0 0 100 100"><path d="M30 16L10 32L22 48L30 42V86H70V42L78 48L90 32L70 16Q50 30 30 16Z" fill="${c}" ${S3}/></svg>`;
const pants=c=>`<svg viewBox="0 0 100 100"><path d="M26 12H74L80 90H56L50 44L44 90H20Z" fill="${c}" ${S3}/><path d="M26 22H74" stroke="${OL}" stroke-width="2.4"/></svg>`;
const dress=c=>`<svg viewBox="0 0 100 100"><path d="M36 10H46Q50 22 54 10H64L62 36L84 90H16L38 36Z" fill="${c}" ${S3}/><path d="M38 36H62" stroke="${OL}" stroke-width="2.4"/></svg>`;
const CLOTH={tee,pants,dress};
const clothSVG=(c,wet,folded)=>{
  if(folded)return `<svg viewBox="0 0 100 100"><rect x="14" y="30" width="72" height="44" rx="9" fill="${c.col}" ${S3}/><path d="M14 52H86" stroke="${OL}" stroke-width="2.4" opacity=".6"/><ellipse cx="34" cy="40" rx="9" ry="3.4" fill="#fff" opacity=".4"/></svg>`;
  let s=svgInner(CLOTH[c.kind](c.col));if(wet)s+=[[34,70],[58,60],[46,84]].map(([x,y])=>`<path d="M${x} ${y-6}Q${x+5} ${y+1} ${x} ${y+4}Q${x-5} ${y+1} ${x} ${y-6}Z" fill="#A7CFE8" stroke="#8FC3E6" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 100 100">${s}</svg>`;
};
const basketSVG=()=>`<svg viewBox="0 0 100 100"><path d="M10 40H90L82 90Q81 94 77 94H23Q19 94 18 90Z" fill="#E7C99C" ${S3}/><path d="M16 56H84M18 72H82M34 40L38 94M50 40V94M66 40L62 94" stroke="#C9A06A" stroke-width="2.6" fill="none"/><rect x="6" y="34" width="88" height="10" rx="5" fill="#D9B48A" ${S3}/></svg>`;
const cupSVG=()=>`<svg viewBox="0 0 100 100"><path d="M22 28H78L70 90Q50 98 30 90Z" fill="#CFE5F4" ${S3}/><path d="M26 50H74L68 88Q50 94 32 88Z" fill="#A7CFE8"/><circle cx="42" cy="68" r="4" fill="#fff" opacity=".8"/><circle cx="58" cy="76" r="3" fill="#fff" opacity=".8"/><path d="M76 40Q94 42 92 58Q90 70 72 70" fill="none" ${S3}/></svg>`;
const startSVG=()=>`<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="42" fill="#8FC48A" ${S3}/><circle cx="50" cy="50" r="32" fill="#A9CFA0" stroke="#fff" stroke-width="3"/><path d="M50 26V50" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M34 40A24 24 0 1 0 66 40" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
function machineSVG(st){   // st: 'open' | 'closed' | 'spin'
  const inner=st==='open'?`<circle cx="50" cy="64" r="25" fill="#5B6573" ${S3}/><ellipse cx="50" cy="70" rx="18" ry="12" fill="#434B58"/>`
    :`<circle cx="50" cy="64" r="27" fill="#DCEBF0" ${S3}/><g class="${st==='spin'?'ch-spin':''}"><circle cx="50" cy="64" r="20" fill="#CFE5F4"/>${[[40,56,7],[58,60,9],[48,72,6],[60,74,5],[38,70,4]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#A7CFE8" stroke-width="1.6"/>`).join('')}<path d="M34 64Q44 52 56 60T68 62" fill="none" stroke="#F4A7B9" stroke-width="5" stroke-linecap="round"/></g>`;
  return `<svg viewBox="0 0 100 110"><rect x="8" y="6" width="84" height="100" rx="14" fill="#F4F6F8" ${S3}/><rect x="14" y="12" width="72" height="18" rx="7" fill="#DDE3EA"/><circle cx="26" cy="21" r="5" fill="#8FC3E6" ${S2}/><circle cx="42" cy="21" r="5" fill="#EBCB6B" ${S2}/>${inner}</svg>`;
}
const lineSVG=()=>`<svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M2 10Q50 18 98 10" fill="none" stroke="${OL}" stroke-width="2.6"/><rect x="0" y="0" width="5" height="24" rx="2" fill="#D9B48A" ${S2}/><rect x="95" y="0" width="5" height="24" rx="2" fill="#D9B48A" ${S2}/></svg>`;
const pegSVG=()=>`<svg viewBox="0 0 40 60"><rect x="8" y="4" width="24" height="52" rx="8" fill="#F2B48C" ${S3}/><path d="M20 4V56" stroke="${OL}" stroke-width="2.6"/></svg>`;
const drawerSVG=()=>`<svg viewBox="0 0 100 90"><rect x="8" y="6" width="84" height="80" rx="10" fill="#E7C99C" ${S3}/><rect x="16" y="14" width="68" height="30" rx="6" fill="#F3DFC0" ${S2}/><rect x="16" y="50" width="68" height="30" rx="6" fill="#F3DFC0" ${S2}/><circle cx="50" cy="29" r="4.5" fill="#8E96A6" ${S2}/><circle cx="50" cy="65" r="4.5" fill="#8E96A6" ${S2}/></svg>`;
const sofaSVG=()=>`<svg viewBox="0 0 100 56"><rect x="14" y="4" width="72" height="30" rx="12" fill="#C3B4E6" ${S3}/><rect x="4" y="20" width="22" height="30" rx="10" fill="#AE9BE0" ${S3}/><rect x="74" y="20" width="22" height="30" rx="10" fill="#AE9BE0" ${S3}/><rect x="22" y="28" width="56" height="20" rx="8" fill="#D6CAF0" ${S3}/><rect x="14" y="48" width="8" height="6" rx="2" fill="#7A5A3C"/><rect x="78" y="48" width="8" height="6" rx="2" fill="#7A5A3C"/></svg>`;
const dustSVG=()=>`<svg viewBox="0 0 100 100"><g fill="#CFCAD4" stroke="#A9A2B4" stroke-width="2"><circle cx="34" cy="58" r="20"/><circle cx="58" cy="50" r="24"/><circle cx="68" cy="68" r="16"/><circle cx="46" cy="72" r="16"/></g><circle cx="46" cy="56" r="3" fill="#6B6475"/><circle cx="60" cy="56" r="3" fill="#6B6475"/></svg>`;
const stainSVG=()=>`<svg viewBox="0 0 100 100"><path d="M18 52Q14 28 40 24Q66 16 82 38Q94 60 70 76Q46 90 26 74Q18 66 18 52Z" fill="#B58A5E" opacity=".8" stroke="#8A6440" stroke-width="2"/><ellipse cx="40" cy="42" rx="10" ry="5" fill="#fff" opacity=".35"/></svg>`;
const sockSVG=c=>`<svg viewBox="0 0 100 100"><path d="M34 8H62V54Q62 62 74 68Q92 78 86 90Q80 98 62 92Q34 84 34 56Z" fill="${c}" ${S3}/><path d="M34 22H62M34 36H62" stroke="#fff" stroke-width="5" opacity=".7"/></svg>`;
const rugSVG=()=>`<svg viewBox="0 0 100 60" preserveAspectRatio="none"><rect x="2" y="2" width="96" height="56" rx="10" fill="#E8A0AE" ${S3}/><rect x="9" y="9" width="82" height="42" rx="6" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 5" opacity=".8"/><rect x="18" y="18" width="64" height="24" rx="5" fill="#F6D3DB"/></svg>`;
const sunPatch=()=>`<svg viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M10 0H90L100 60H0Z" fill="#FFF1B8" opacity=".75"/></svg>`;
function boxSVG(b){
  const sticker=b.cat==='doll'?`<g transform="translate(34 56) scale(.32)">${svgInner(toySVG({name:'bear',col:'#DDA574'}))}</g>`:b.cat==='car'?`<g transform="translate(32 60) scale(.36)">${svgInner(toySVG({name:'car',col:'#E0786F'}))}</g>`:`<path d="M60 70l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#EBCB6B" ${S2} transform="translate(-10 -14) scale(.9)"/>`;
  let s=`<path d="M10 40H110L102 100Q101 104 97 104H23Q19 104 18 100Z" fill="#F2B48C" ${S3}/>`;
  b.toys.slice(-3).forEach((t,i)=>{s+=`<g transform="translate(${22+i*28} ${10+(i%2)*4}) scale(.34)">${svgInner(toySVG(t))}</g>`});
  s+=`<path d="M10 40H110L102 100Q101 104 97 104H23Q19 104 18 100Z" fill="#F2B48C" ${S3}/><path d="M12 44H108" stroke="#fff" stroke-width="3" opacity=".5"/><rect x="26" y="52" width="68" height="40" rx="8" fill="#FFFDF9" ${S2}/>${sticker}`;
  if(b.lid)s+=`<rect x="4" y="22" width="112" height="24" rx="9" fill="#E89F72" ${S3}/><rect x="46" y="14" width="28" height="10" rx="5" fill="#E89F72" ${S3}/>`;
  return `<svg viewBox="0 0 120 112" style="overflow:visible">${s}</svg>`;
}
function potSVG(p){
  const w=p.water,droop=1-w,tx=50+droop*30,ty=32+droop*30,lc=w>=.5?'#7FB86A':'#B8A860';
  let s=`<path d="M50 78Q50 ${50-droop*10} ${tx} ${ty}" fill="none" stroke="#5E9A50" stroke-width="5" stroke-linecap="round"/>`;
  [[.35,-1],[.62,1]].forEach(([t,sd])=>{const x=50+(tx-50)*t*t*1.2+sd*0,y=78-(78-ty)*t;s+=`<ellipse cx="${(x+sd*13).toFixed(1)}" cy="${y.toFixed(1)}" rx="13" ry="6.5" fill="${lc}" ${S2} transform="rotate(${(sd*(25+droop*40)).toFixed(0)} ${(x+sd*13).toFixed(1)} ${y.toFixed(1)})"/>`});
  s+=p.leaves.map(l=>l.gone?'':`<ellipse cx="${l.x}" cy="${l.y}" rx="12" ry="6" fill="#9A6A3C" ${S2} transform="rotate(${l.r} ${l.x} ${l.y})"/>`).join('');
  if(p.bloom)s+=`<g transform="translate(${tx} ${ty})">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-9" rx="6.5" ry="9" fill="${p.col}" ${S2} transform="rotate(${a})"/>`).join('')}<circle r="6" fill="#FFD23F" ${S2}/></g>`;
  else s+=`<circle cx="${tx}" cy="${ty}" r="6" fill="${w>=1?'#F6D3DB':'#C8C2B0'}" ${S2}/>`;
  s+=`<path d="M26 78H74L68 114Q67 118 63 118H37Q33 118 32 114Z" fill="#E89F72" ${S3}/><rect x="22" y="72" width="56" height="12" rx="6" fill="#F2B48C" ${S3}/>`;
  return `<svg viewBox="0 0 100 120" style="overflow:visible">${s}</svg>`;
}
const canSVG=(lvl)=>`<svg viewBox="0 0 100 100"><path d="M14 36L2 24" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M14 36L2 24" stroke="#8FC3E6" stroke-width="4" stroke-linecap="round"/><path d="M20 38H76L72 90Q50 98 28 90Z" fill="#8FC3E6" ${S3}/><path d="M${24+(1-lvl)*0} ${90-lvl*44}H74L72 90Q50 98 28 90Z" fill="#CFE5F4" opacity="${lvl>0?.95:0}"/><path d="M76 46Q96 46 94 62Q92 74 72 74" fill="none" ${S3}/><path d="M28 32Q50 14 72 32" fill="none" ${S3}/><g class="tf"><ellipse class="tf-eye" cx="42" cy="58" rx="3" ry="4.4" fill="${OL}"/><ellipse class="tf-eye" cx="58" cy="58" rx="3" ry="4.4" fill="${OL}"/><path class="tf-grin" d="M44 66Q50 73 56 66Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`;
const faucetSVG=()=>`<svg viewBox="0 0 110 110"><rect x="8" y="98" width="94" height="10" rx="5" fill="#C8CDD6" ${S3}/><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="${OL}" stroke-width="20" stroke-linecap="round"/><path d="M24 100V40Q24 14 52 14Q80 14 80 40V66" fill="none" stroke="#DDE3EA" stroke-width="12" stroke-linecap="round"/><rect x="68" y="62" width="24" height="12" rx="4" fill="#9AA2B1" ${S3}/><circle cx="24" cy="46" r="13" fill="#8FC3E6" ${S3}/><path d="M24 36V56M14 46H34" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/></svg>`;
const T={
  beater:`<svg viewBox="0 0 100 100"><path d="M48 52L86 90" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><path d="M48 52L86 90" stroke="#D9A066" stroke-width="8" stroke-linecap="round"/><circle cx="36" cy="38" r="26" fill="#F2B48C" ${S3}/><path d="M22 28Q36 18 50 28M20 44Q36 34 52 44" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round" opacity=".5"/><g class="tf"><ellipse class="tf-eye" cx="28" cy="38" rx="3" ry="4.4" fill="${OL}"/><ellipse class="tf-eye" cx="44" cy="38" rx="3" ry="4.4" fill="${OL}"/><path class="tf-grin" d="M30 46Q36 53 42 46Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  vacuum:`<svg viewBox="0 0 100 100"><path d="M60 14Q92 14 90 50Q88 70 70 70" fill="none" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M60 14Q92 14 90 50Q88 70 70 70" fill="none" stroke="#9AA2B1" stroke-width="6" stroke-linecap="round"/><rect x="30" y="6" width="36" height="34" rx="10" fill="#8FC3E6" ${S3}/><path d="M22 56H58L52 40H28Z" fill="#9AA2B1" ${S3}/><rect x="14" y="56" width="52" height="14" rx="6" fill="#5A5A66" ${S3}/><circle cx="24" cy="78" r="8" fill="#8E96A6" ${S3}/><circle cx="56" cy="78" r="8" fill="#8E96A6" ${S3}/><g class="tf"><ellipse class="tf-eye" cx="42" cy="20" rx="2.8" ry="4" fill="${OL}"/><ellipse class="tf-eye" cx="56" cy="20" rx="2.8" ry="4" fill="${OL}"/><path class="tf-grin" d="M43 27Q49 33 55 27Z" fill="#B5473A" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g></svg>`,
  mop:`<svg viewBox="0 0 100 100"><path d="M64 6L52 56" stroke="${OL}" stroke-width="10" stroke-linecap="round"/><path d="M64 6L52 56" stroke="#D9A066" stroke-width="5" stroke-linecap="round"/><path d="M18 58H84L78 74H24Z" fill="#8FC3E6" ${S3}/><path d="M22 74V92M34 74V94M46 74V92M58 74V94M70 74V92" stroke="#CFE5F4" stroke-width="6" stroke-linecap="round"/><g class="tf"><ellipse class="tf-eye" cx="40" cy="64" rx="2.8" ry="3.6" fill="${OL}"/><ellipse class="tf-eye" cx="62" cy="64" rx="2.8" ry="3.6" fill="${OL}"/></g></svg>`
};
function roomSVG(job,messy){
  let s=`<rect x="4" y="4" width="162" height="142" rx="18" fill="${{toys:'#F6E6D2',plants:'#E4F0DC',laundry:'#DCEBF4',vacuum:'#EDE4F6'}[job]}" ${S3}/><rect x="4" y="100" width="162" height="46" rx="18" fill="#E7C99C" opacity=".7"/>`;
  const g=(svg,x,y,k,r)=>`<g transform="translate(${x} ${y}) scale(${k}) rotate(${r||0} 50 50)">${svgInner(svg)}</g>`;
  if(job==='toys'){if(messy)s+=g(toySVG({name:'bear',col:'#DDA574'}),18,56,.5,-14)+g(toySVG({name:'car',col:'#E0786F'}),88,60,.5,10)+g(toySVG({name:'bunny',col:'#FFF9F2'}),56,22,.46,6)+g(toySVG({name:'train',col:'#8FC3E6'}),86,18,.4,-8)+g(toySVG({name:'doll',col:'#E89AAE'}),14,14,.38,12);
    else s+=g(boxSVG({cat:'any',toys:[],lid:true}),36,34,.9,0)}
  else if(job==='laundry'){s+=g(basketSVG(),38,52,.9,0);if(messy)s+=g(clothSVG({kind:'tee',col:'#E89AAE'}),30,10,.55,-14)+g(clothSVG({kind:'pants',col:'#7D9BE0'}),70,6,.55,12)+g(clothSVG({kind:'dress',col:'#EBCB6B'}),62,34,.5,-6)}
  else if(job==='vacuum'){s+=g(sofaSVG(),20,22,1.3,0);if(messy)s+=g(dustSVG(),14,84,.34,0)+g(dustSVG(),66,92,.3,0)+g(dustSVG(),110,84,.34,0)+g(stainSVG(),100,106,.3,0)}
  else s+=g(potSVG({water:messy?0:1,leaves:messy?[{x:30,y:78,r:-20},{x:72,y:76,r:20}]:[],bloom:!messy,col:'#E89AAE'}),42,22,.8,0);
  if(messy)s+=[[16,22],[140,26],[136,106]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M0 -12Q1 -1 12 0Q1 1 0 12Q-1 1 -12 0Q-1 -1 0 -12Z" fill="#FFF6C8" ${S2} transform="scale(.9)"/></g>`).join('');
  return `<svg viewBox="0 0 170 150" style="overflow:visible">${s}</svg>`;
}
const ICON={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:`<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="${PAL.butter||'#F0D58A'}" stroke="${OL}" stroke-width="1.2"/></svg>`,
  heart:`<svg viewBox="-20 -20 40 40"><path d="M0 14C-20 0 -17 -15 -8 -15C-4 -15 -1 -12 0 -9C1 -12 4 -15 8 -15C17 -15 20 0 0 14Z" fill="${PAL.rose||'#E8A0AE'}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="-7" cy="-8" rx="3.5" ry="2.2" fill="#fff" opacity=".7" transform="rotate(-30 -7 -8)"/></svg>`,
  glint:`<svg viewBox="-20 -20 40 40"><path d="M0 -18Q2 -2 18 0Q2 2 0 18Q-2 2 -18 0Q-2 -2 0 -18Z" fill="#FFF6C8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
};
const STEP_ICON={pick:()=>roomSVG('toys',true),sort:()=>toySVG({name:'bear',col:'#DDA574'}),lid:()=>boxSVG({cat:'any',toys:[],lid:true}),shelf:()=>boxSVG({cat:'car',toys:[],lid:false}),rug:()=>T.beater,
  fill:()=>faucetSVG(),water:()=>canSVG(1),pluck:()=>potSVG({water:.4,leaves:[{x:28,y:78,r:-20}],bloom:false}),sun:()=>potSVG({water:1,leaves:[],bloom:true,col:'#E89AAE'}),
  load:()=>basketSVG(),soap:()=>cupSVG(),start:()=>startSVG(),hang:()=>pegSVG(),fold:()=>clothSVG({col:'#8FC3E6'},false,true),vac:()=>T.vacuum,socks:()=>sockSVG('#E89AAE'),mop:()=>T.mop};
const stepIcon=k=>(STEP_ICON[k]||(()=>''))();

/* ============================== screen: the three zones (same structure as pizzashop.js) ============================== */
const css=`
#chores2{gap:6px}
#chores2 .ch-head{flex:none;height:${HEAD_PX}px;gap:8px}
#chores2 .ch-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px}
#chores2 .ch-back svg{width:100%;height:100%;display:block}
.ch-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;pointer-events:none;padding-right:8px}
.ch-strip span{flex:none;width:40px;height:40px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.55;transition:width .3s,height .3s,opacity .3s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.ch-strip span svg{width:72%;height:72%;display:block}
.ch-strip span.on{width:58px;height:58px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.ch-strip span.done{opacity:.9}
.ch-strip span .st{position:absolute;right:-5px;top:-5px;width:22px;height:22px}
.ch-strip span .st svg{width:100%;height:100%}
.ch-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC}
.ch-stage>div{position:absolute}
.ch-wall{left:0;right:0;top:0;height:34%;pointer-events:none}
.ch-wall svg,.ch-floor svg{width:100%;height:100%;display:block}
.ch-floor{left:0;right:0;top:34%;bottom:0;pointer-events:none;background:linear-gradient(180deg,#EBD9BF,#E3CBA9);border-top:4px solid ${OL}}
.ch-win,.ch-plank{pointer-events:none;z-index:1}
.ch-win svg,.ch-plank svg{width:100%;height:100%;display:block}
.ch-cust{z-index:3;pointer-events:none}
.ch-cust svg{width:100%;height:100%;display:block;overflow:visible}
.ch-cust.enter{animation:chin 1.2s cubic-bezier(.3,1.1,.5,1)}
@keyframes chin{from{transform:translateX(120%)}to{transform:none}}
.ch-cust.leave{animation:chout 1.1s ease-in forwards}
@keyframes chout{to{transform:translateX(130%)}}
.ch-cust.callme{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}
.ch-bub{z-index:4;pointer-events:none;background:var(--paper);border:3px solid ${OL};border-radius:22px;padding:6px 8px;display:flex;align-items:center;gap:2px;box-shadow:0 3px 8px rgba(91,74,66,.14)}
.ch-bub::after{content:"";position:absolute;right:-14px;bottom:14px;border:8px solid transparent;border-left-color:${OL}}
.ch-main{z-index:2;pointer-events:none}
.ch-it{position:absolute;pointer-events:none;transition:left .55s ease-in-out,top .55s ease-in-out,width .55s ease-in-out,height .55s ease-in-out,transform .25s,opacity .4s}
.ch-it svg{width:100%;height:100%;display:block;overflow:visible}
.ch-it.sel{transform:translateY(-10px) scale(1.12);filter:drop-shadow(0 0 10px ${PAL.butter||'#F0D58A'})}
.ch-it.nope{animation:chnope .45s}
.ch-it.callme svg{animation:chcall .8s ease-in-out}
.ch-it.back{z-index:0}
@keyframes chnope{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes chcall{0%,100%{filter:none}50%{filter:drop-shadow(0 0 12px ${PAL.butter||'#F0D58A'})}}
.ch-spin{transform-origin:50px 64px;animation:chspin 1.4s linear infinite}
@keyframes chspin{to{transform:rotate(360deg)}}
.ch-glint{animation:chtw 2.2s ease-in-out infinite}
@keyframes chtw{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
.ch-water{z-index:5;pointer-events:none;width:16px;border-radius:8px;background:repeating-linear-gradient(180deg,#CFE5F4 0 10px,#A7CFE8 10px 18px);background-size:100% 36px;animation:chflow .8s linear infinite;opacity:.85;display:none}
.ch-water.on{display:block}
@keyframes chflow{to{background-position:0 36px}}
.ch-fx{inset:0;z-index:20;pointer-events:none;overflow:hidden}
.ch-float{position:absolute;pointer-events:none;will-change:transform}
.ch-float svg{width:100%;height:100%;display:block;overflow:visible}
.ch-tray{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;touch-action:none;position:relative}
.ch-tool{height:min(150px,92%);aspect-ratio:1;border-radius:32px;background:var(--paper);padding:10px;box-shadow:0 3px 10px rgba(91,74,66,.12);pointer-events:none}
.ch-tool svg{width:100%;height:100%;display:block}
.ch-tool.in{animation:chcard .3s ease-out both}
.ch-card{flex:1;min-width:110px;max-width:200px;height:min(150px,92%);border-radius:28px;border:0;padding:10px;background:var(--paper);display:grid;place-items:center;touch-action:none;box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .3s}
.ch-card svg{width:100%;height:100%;display:block;pointer-events:none}
.ch-card.in{animation:chcard .3s ease-out both}
.ch-card.sel{box-shadow:0 0 0 5px color-mix(in srgb,var(--berry) 60%,#fff),0 4px 12px rgba(91,74,66,.16);transform:translateY(-6px)}
.ch-card.fade{opacity:.35}
@keyframes chcard{from{transform:translateY(24px);opacity:0}}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);
const WALL=`<svg viewBox="0 0 100 34" preserveAspectRatio="none"><rect width="100" height="34" fill="#F3EADD"/>${Array.from({length:14},(_,i)=>`<path d="M${i*8} 0V34" stroke="#EADFCE" stroke-width="1"/>`).join('')}<rect y="26" width="100" height="8" fill="#E8DAC5"/></svg>`;
const WIN=`<svg viewBox="0 0 100 70"><rect x="4" y="4" width="92" height="62" rx="6" fill="#DCEBF0" ${S3}/><path d="M50 4V66M4 35H96" stroke="${OL}" stroke-width="3"/><path d="M10 10L40 30M60 42L90 60" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/></svg>`;
const PLANK=`<svg viewBox="0 0 100 14" preserveAspectRatio="none"><rect x="0" y="0" width="100" height="14" rx="4" fill="#D9B48A" ${S3}/></svg>`;
const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`<div class="bar ch-head"><button class="round ch-back" data-go="home" aria-label="뒤로">${ICON.back}</button><div class="ch-strip" id="ch2Strip"></div></div>
<div class="ch-stage" id="ch2Stage"><div class="ch-wall">${WALL}</div><div class="ch-floor"></div><div class="ch-win" id="ch2Win">${WIN}</div><div class="ch-plank" id="ch2Plank">${PLANK}</div>
<div class="ch-cust" id="ch2Cust"></div><div class="ch-bub" id="ch2Bub" hidden></div><div class="ch-main" id="ch2Main"></div><div class="ch-water" id="ch2Water"></div><div class="ch-fx" id="ch2Fx"></div></div>
<div class="ch-tray" id="ch2Tray"></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='집안일';
const $=s=>sec.querySelector(s);
const stage=$('#ch2Stage'),stripEl=$('#ch2Strip'),custEl=$('#ch2Cust'),bubEl=$('#ch2Bub'),mainEl=$('#ch2Main'),waterEl=$('#ch2Water'),plankEl=$('#ch2Plank'),winEl=$('#ch2Win'),fxEl=$('#ch2Fx'),tray=$('#ch2Tray');
const G=M.Guide.make(stage,{say});
const DATA=Object.assign({level:1,served:0,last:''},store.get('mallang_chores2',{}));
const save=()=>store.set('mallang_chores2',DATA);
const PRG=()=>M.Progress&&typeof M.Progress.get==='function'?M.Progress:null;
function levelNo(){const pr=PRG();let n=pr?pr.get(GID).level:DATA.level;n=Math.round(+n||1);return Math.max(1,Math.min(LV.length,n))}
function levelInfo(n){
  const f={level:n,boxes:1,plants:false,laundry:false,vacuum:false,hang:false,fold:false,chain:false};
  LV.slice(0,n).forEach(l=>{const t=l.new||'',m=t.match(/상자\s*(\d)개/);if(m)f.boxes=+m[1];
    if(/화분/.test(t))f.plants=true;if(/빨래 넣|돌리기/.test(t))f.laundry=true;if(/청소기/.test(t))f.vacuum=true;if(/널기/.test(t))f.hang=true;if(/개기/.test(t))f.fold=true;if(/두 가지/.test(t))f.chain=true});
  f.jobs=['toys'].concat(f.plants?['plants']:[],f.laundry?['laundry']:[],f.vacuum?['vacuum']:[]);return f;
}
const stepsOf=job=>STEPS[job].concat(job==='laundry'&&lv.hang?['hang']:[],job==='laundry'&&lv.fold?['fold']:[]);

/* ---------- state ---------- */
let lv=null,plan=[],pi=0,S=null,al=null,H={},act=null,tool=null,gen=0,misses=0,lastMiss=0,flying=0,busy=false,lastTap=0,phase='',kind='wait',AIM=null;
const killTool=()=>{if(tool){tool.destroy();tool=null}};
const M0={x:0,y:0,w:0,h:0};
const stR=()=>stage.getBoundingClientRect();
const stXY=(cx,cy)=>{const s=stR();return[cx-s.left,cy-s.top]};
const ctr=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
const inRect=(e,r,m=0)=>e.clientX>=r.left-m&&e.clientX<=r.right+m&&e.clientY>=r.top-m&&e.clientY<=r.bottom+m;

/* ---------- layout: header 72px · stage · tray 18~22% of the screen ---------- */
function size(){
  const sh=sec.clientHeight;if(!sh)return;
  const pad=20,gaps=12,trMin=sh*TRAY_R[0],trMax=sh*TRAY_R[1],want=sh*(TRAY_R[0]+(TRAY_R[1]-TRAY_R[0])*.75);
  tray.style.height=Math.round(Math.min(trMax,Math.max(trMin,want,sh-pad-HEAD_PX-gaps-sh*STAGE_R[1])))+'px';
  const r=stR(),W=r.width,Hh=r.height;if(!W)return;const wallH=Hh*.34;
  const ch=Math.min(wallH*.98,W*.34*230/200),cw=ch*200/230;
  Object.assign(custEl.style,{width:cw+'px',height:ch+'px',right:(W*.03)+'px',top:(wallH-ch*.93)+'px'});
  Object.assign(bubEl.style,{right:(W*.03+cw+10)+'px',top:(wallH*.12)+'px'});
  const ww=W*.36,wh=wallH*.58;Object.assign(winEl.style,{left:(W*.04)+'px',top:(wallH*.06)+'px',width:ww+'px',height:wh+'px'});
  Object.assign(plankEl.style,{left:(W*.02)+'px',top:(wallH*.06+wh+2)+'px',width:(W*.44)+'px',height:'14px'});
  const top=wallH+6,hh=Hh-top-8;Object.assign(M0,{x:W*.03,y:top,w:W*.94,h:hh});
  Object.assign(mainEl.style,{left:M0.x+'px',top:M0.y+'px',width:M0.w+'px',height:M0.h+'px'});
  Object.assign(waterEl.style,{});
  if(S)S.items.forEach(pos);
}
function pos(it){const w=M0.w,h=M0.h,g=it.g,s=g.s*w,sh=s*(g.ar||1);Object.assign(it.el.style,{left:(g.x*w-s/2)+'px',top:(g.y*h-sh/2)+'px',width:s+'px',height:sh+'px'})}
function mkItem(cls,g,svg,extra){
  const el=document.createElement('div');el.className='ch-it '+(cls||'');mainEl.appendChild(el);
  const it=Object.assign({el,g,svg},extra||{});it.draw=()=>{el.innerHTML=it.svg(it)};S.items.push(it);it.draw();pos(it);return it;
}
function dropItem(it){const i=S.items.indexOf(it);if(i>=0)S.items.splice(i,1);it.el.remove()}
const itC=it=>ctr(it.el);
const nearest=(e,list,rad)=>{let best=null,bd=1e9;list.forEach(it=>{const [x,y]=itC(it),d=Math.hypot(e.clientX-x,e.clientY-y);if(d<bd&&d<=rad){bd=d;best=it}});return best};

/* ---------- common bits ---------- */
function drawCust(mood){custEl.innerHTML=A.animal('bunny',mood||'idle',{apron:'#E3A79A'});if(al)al.refresh()}
function strip(){
  const items=plan.map((k,i)=>({k,i})).filter(o=>o.k!=='serve');const idx=items.findIndex(o=>o.i>=pi),c=idx<0?items.length-1:idx;
  const from=Math.max(0,Math.min(items.length-5,c-2)),win=items.slice(from,from+5);
  stripEl.innerHTML=win.map(o=>`<span class="${o.i<pi?'done':o.i===pi?'on':''}">${stepIcon(o.k)}${o.i<pi?`<i class="st">${ICON.star}</i>`:''}</span>`).join('');
}
function toolTray(html){tray.innerHTML=`<div class="ch-tool in">${html}</div>`;return tray.querySelector('.ch-tool')}
function miss(){misses++;G.nudge();custEl.classList.remove('callme');void custEl.offsetWidth;custEl.classList.add('callme');setTimeout(()=>custEl.classList.remove('callme'),700);
  const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
stage.addEventListener('pointerdown',e=>{
  actx();if(!H.down)return;e.preventDefault();G.touch();
  const r=H.down(e);if(r===false){miss();return}
  if(H.move||H.up){try{stage.setPointerCapture(e.pointerId)}catch(_){}act=e.pointerId}
});
stage.addEventListener('pointermove',e=>{if(act===e.pointerId&&H.move)H.move(e)});
const endP=e=>{G.release();if(act!==e.pointerId)return;act=null;if(H.up)H.up(e)};
['pointerup','pointercancel'].forEach(t=>stage.addEventListener(t,endP));
const alMood=(m,ms)=>{if(!al)return;al.setMood(m);if(ms){const g=gen;L.later(()=>{if(g===gen&&al&&phase!=='serve')al.setMood('')},ms)}};
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};
const tapOk=()=>{const n=performance.now();if(n-lastTap<260)return false;lastTap=n;return true};
function intro(html,ko,en){const t=toolTray(html);let stop=P.toolIntro?P.toolIntro(stage,t,html,{ko,en}):null;L.onEnd(()=>{if(stop)stop()});return()=>{if(stop){stop();stop=null}}}
function fly(html,from,to,s0,s1,ms,then){
  const f=document.createElement('div');f.className='ch-float';f.innerHTML=html;const [x,y]=stXY(from[0],from[1]);
  Object.assign(f.style,{width:s0+'px',height:s0+'px',left:(x-s0/2)+'px',top:(y-s0/2)+'px'});fxEl.appendChild(f);
  const dx=to[0]-from[0],dy=to[1]-from[1],k=s1/s0;let done=false;const fin=()=>{if(done)return;done=true;f.remove();if(then)then()};
  try{const a=f.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx/2}px,${dy/2-40}px) scale(${(1+k)/2})`,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(${k})`}],{duration:ms,easing:'ease-in-out',fill:'forwards'});a.onfinish=fin}
  catch(e){setTimeout(fin,ms)}
  setTimeout(fin,ms+400);
}
const guideAt=(fn,type,ko,en)=>G.start({type:type||'tap',at:()=>{const [x,y]=fn();return stXY(x,y)},ko,en});
const guideRub=()=>G.start({type:'scrub',at:()=>stXY(...ctr(mainEl)),ko:'쓱쓱 문질러 봐!',en:'Rub rub!'});
function rubTool(o){
  killTool();const w=M0.w,h=M0.h,sp=o.sp||26;
  tool=P.makeTool(stage,{tool:o.icon,effect:o.effect||'foam',anchor:o.anchor,gapScale:o.gap,cells:o.cells.map(c=>[c.fx,c.fy]),target:()=>mainEl.getBoundingClientRect(),rub:o.rub,
    cfg:()=>({offsetAboveFingerRatio:.55,coverage:Object.assign({},COV,{grid:[Math.max(3,Math.round(w/sp)),Math.max(3,Math.round(h/sp))],radiusRatio:o.rad||.1},o.cov||{})}),
    fx:o.fx,onMiss:miss,sound:o.hold?()=>P.holdSound(o.hold):null,
    onTouch:()=>{G.touch();if(o.stopIntro)o.stopIntro();LOG.push('press:'+o.log)},onRelease:()=>G.release(),
    onCell:(i,v)=>{o.cell(o.cells[i],v)},
    onProgress:(p,ratio,why)=>{if(!o.hold&&(why==='move'||why==='hold')){const n=performance.now();if(n-(o._s||0)>150){o._s=n;(o.sound||SFX.scrub)()}}},
    onDone:()=>{killTool();G.stop();o.done()}});
  L.onEnd(killTool);
}
const spark=(x,y,n=3)=>{for(let k=0;k<n;k++){const g=document.createElement('div');g.className='ch-float';g.innerHTML=ICON.glint;const sz=22+rand(12);Object.assign(g.style,{width:sz+'px',height:sz+'px',left:(x-sz/2+rand(50)-25)+'px',top:(y-sz/2+rand(40)-20)+'px'});fxEl.appendChild(g);
  try{g.animate([{transform:'scale(.3)',opacity:0},{transform:'scale(1)',opacity:1,offset:.4},{transform:'scale(.5) translateY(-20px)',opacity:0}],{duration:1100,delay:k*120,fill:'forwards'})}catch(e){}setTimeout(()=>g.remove(),1500)}};
const sparkAt=it=>{const [x,y]=itC(it);spark(...stXY(x,y),2)};
const plankSlot=i=>{const r=plankEl.getBoundingClientRect();return[r.left+r.width*(.26+.46*i),r.top-18]};
function drawShelf(){plankEl.querySelectorAll('.ch-shelved').forEach(e=>e.remove());
  S.items.filter(it=>it.box&&it.shelved).forEach((b,i)=>{const r=plankEl.getBoundingClientRect(),sr=stR(),d=document.createElement('div');d.className='ch-shelved';const sz=r.width*.3;
    d.style.cssText=`position:absolute;left:${r.width*(.26+.46*b.si)-sz/2}px;top:${-sz*.9}px;width:${sz}px;height:${sz}px;pointer-events:none`;d.innerHTML=boxSVG(b.box);plankEl.appendChild(d);void sr;void i})}
plankEl.style.overflow='visible';

/* ============================== building the rooms ============================== */
function clearMain(){mainEl.innerHTML='';S.items=[];plankEl.querySelectorAll('.ch-shelved').forEach(e=>e.remove());waterEl.classList.remove('on');killTool()}
const nameToy=t=>TOYS[t.toy.name];
function buildToys(){
  clearMain();const pools={doll:shuffle(['bear','bunny','kitty','doll']).slice(0,3),car:shuffle(['car','bus','truck','train']).slice(0,3)};
  const cols=shuffle(CC.slice()).map(c=>c.hex);let ci=0;
  S.rug=mkItem('back',{x:.5,y:.36,s:.9,ar:.52},rugSVG,{});
  const toys=[];['doll','car'].forEach(cat=>pools[cat].forEach(n=>toys.push({name:n,cat,col:cols[ci++%cols.length]})));
  const spots=shuffle([[.16,.12],[.5,.1],[.84,.12],[.16,.4],[.5,.42],[.84,.4]]);
  S.toys=shuffle(toys).map((t,i)=>mkItem('toy',{x:spots[i][0]+(Math.random()-.5)*.05,y:spots[i][1]+(Math.random()-.5)*.04,s:.2},it=>toySVG(it.toy),{toy:t,done:false}));
  S.boxes=(lv.boxes>=2?['doll','car']:['any']).map((cat,i,a)=>{const b={cat,toys:[],lid:false};
    return mkItem('box',{x:a.length===1?.5:(i?.74:.26),y:.82,s:a.length===1?.4:.34,ar:.93},it=>boxSVG(it.box),{box:b,shelved:false,si:i})});
}
function buildPlants(){
  clearMain();const n=POTS[Math.min(POTS.length,lv.level)-1],cols=shuffle(CC.slice()).map(c=>c.vivid);
  const xs=n===2?[.3,.7]:n===3?[.18,.5,.82]:[.14,.38,.62,.86];
  S.pots=xs.map((x,i)=>mkItem('pot',{x,y:.2,s:.27,ar:1.2},potSVG,{water:0,bloom:false,col:cols[i%cols.length],sunX:x,
    leaves:[{x:26+rand(6),y:78,r:-20,gone:false},{x:72-rand(6),y:77,r:20,gone:false}],moved:false,wc:0}));
  S.beam=mkItem('back',{x:.5,y:.74,s:.94,ar:.5},sunPatch,{});S.beam.el.style.opacity='0';
  S.faucet=mkItem('',{x:.28,y:.74,s:.36},faucetSVG,{});
  S.can=mkItem('',{x:.7,y:.76,s:.3},it=>canSVG(it.lvl),{lvl:0});
}
function buildLaundry(){
  clearMain();const cols=shuffle(CC.slice()).map(c=>c.vivid),kinds=shuffle(['tee','pants','dress']);
  S.machine=mkItem('',{x:.62,y:.38,s:.5,ar:1.1},it=>machineSVG(it.st),{st:'open'});
  S.basket=mkItem('',{x:.18,y:.75,s:.3},basketSVG,{});
  S.cloth=kinds.map((k,i)=>mkItem('cloth',{x:.1+i*.09,y:.64-(i%2)*.04,s:.2},it=>clothSVG(it.c,it.wet,it.folded),{c:{kind:k,col:cols[i%cols.length]},state:'basket',wet:false,folded:false}));
  S.cup=mkItem('',{x:.5,y:.86,s:.25},cupSVG,{done:false});
  S.start=mkItem('',{x:.84,y:.84,s:.3},startSVG,{});S.start.el.style.opacity='0';
}
function buildVacuum(){
  clearMain();S.sofa=mkItem('',{x:.5,y:.2,s:.82,ar:.56},sofaSVG,{});
  S.dust=[];for(let r=0;r<3;r++)for(let c=0;c<6;c++)S.dust.push(mkItem('dust',{x:.12+c*.152+(r%2)*.03,y:.52+r*.15,s:.13},dustSVG,{v:0}));
  S.stains=[[.22,.72],[.55,.84],[.82,.62]].map(([x,y])=>mkItem('stain',{x,y,s:.2},stainSVG,{v:0}));
  S.socks=['#E89AAE','#8FC3E6'].map((c,i)=>{const it=mkItem('sock',{x:.34+i*.3,y:.4,s:.17},()=>sockSVG(c),{col:c,out:false,got:false});it.el.style.opacity='0';return it});
  S.sbasket=mkItem('',{x:.86,y:.45,s:.24},basketSVG,{});S.sbasket.el.style.opacity='0';
}
function buildHouse(offer){
  clearMain();const spots=[[.27,.25],[.73,.25],[.27,.75],[.73,.75]];
  S.rooms=JOBS.map((job,i)=>{const messy=offer.includes(job);const it=mkItem('room',{x:spots[i][0],y:spots[i][1],s:.46,ar:.88},it=>roomSVG(job,it.messy),{job,messy});return it});
}

/* ============================== processes ============================== */
const STEP={
  /* 어디부터 치울까: 집 그림(반짝이는 곳)과 카드 3장 */
  pick(){
    const left=S.jobs.filter(j=>!S.doneJobs.includes(j)&&lv.jobs.includes(j));let offer=shuffle(left.filter(j=>j!==DATA.last||S.doneJobs.length)).slice(0,3);if(offer.length<Math.min(3,left.length))offer=shuffle(left).slice(0,3);
    kind='cards';S.offer=offer;buildHouse(offer);bubEl.hidden=false;bubEl.innerHTML=`<svg viewBox="-20 -20 40 40" width="44" height="44">${svgInner(ICON.glint)}</svg>`;
    tray.innerHTML=offer.map((j,k)=>`<button class="ch-card in" data-j="${j}" aria-label="${JOB_KO[j]}" style="animation-delay:${k*60}ms">${roomSVG(j,true)}</button>`).join('');
    say(S.doneJobs.length?'이번엔 어디를 치울까?':'어디부터 치울까? 반짝이는 곳을 골라 봐!',S.doneJobs.length?'Where next?':'Where shall we tidy first? Pick a sparkly spot!',true);
    G.start({type:'tap',wait:true,at:()=>{const b=tray.querySelector('.ch-card');if(!b)return[0,0];return stXY(...ctr(b))}});
    let lock=0;
    const choose=j=>{if(phase!=='pick'||S.chosen)return;const n=performance.now();if(n-lock<TAP_LOCK)return;lock=n;actx();G.touch();S.chosen=j;LOG.push('pick:'+j);sfx.pop();
      tray.querySelectorAll('.ch-card').forEach(x=>{x.classList.toggle('sel',x.dataset.j===j);x.classList.toggle('fade',x.dataset.j!==j)});
      S.rooms.forEach(r=>r.el.classList.toggle('sel',r.job===j));
      const nm={toys:['장난감 방!','Toy room!'],plants:['화분!','Plants!'],laundry:['빨래!','Laundry!'],vacuum:['거실!','Living room!']}[j];say(nm[0],nm[1]);alMood('wow',900);
      tray.onpointerdown=null;H={};G.stop();kind='wait';AIM=null;const g=gen;
      L.later(()=>{if(g!==gen)return;S.job=j;S.doneJobs.push(j);if(S.doneJobs.length===1){DATA.first=j}
        const steps=stepsOf(j).concat(lv.chain&&S.doneJobs.length<2?['pick']:[]);plan.splice(pi+1,0,...steps);
        ({toys:buildToys,plants:buildPlants,laundry:buildLaundry,vacuum:buildVacuum})[j]();bubEl.innerHTML=roomSVG(j,true).replace('<svg ','<svg width="50" height="44" ');S.chosen=null;finish()},900)};
    tray.onpointerdown=e=>{const b=e.target.closest('.ch-card');if(!b)return;e.preventDefault();choose(b.dataset.j)};
    H={down:e=>{const r=nearest(e,S.rooms.filter(x=>x.messy),110);if(!r)return false;choose(r.job)}};
    AIM=()=>ctr(tray.querySelector('.ch-card')||tray);
  },
  /* 장난감 담기: 콕 하면 상자로 날아감 (상자 2개면 맞는 상자) */
  sort(){
    kind='sort';S.sel=null;const multi=S.boxes.length>1;S.landed=S.landed||0;
    toolTray(boxSVG({cat:'any',toys:[],lid:false}));
    say(multi?'장난감을 콕! 인형은 인형 상자, 자동차는 자동차 상자!':'장난감을 콕 누르면 상자로 날아가요!',multi?'Tap a toy! Dolls go in the doll box, cars in the car box!':'Tap a toy and it flies into the box!',true);
    const left=()=>S.toys.filter(t=>!t.done);
    const boxFor=t=>S.boxes.find(b=>b.box.cat===t.toy.cat)||S.boxes[0];
    AIM=()=>{const t=S.sel||left()[0];return t?itC(t):[0,0]};
    const land=(t,b)=>{busy=true;t.done=true;S.sel=null;t.el.classList.remove('sel');const from=itC(t),to=itC(b),sz=t.el.getBoundingClientRect().width;t.el.style.opacity='0';LOG.push('toy:'+t.toy.name+'>'+b.box.cat);
      fly(toySVG(t.toy),from,[to[0],to[1]-12],sz,sz*.5,520,()=>{b.box.toys.push(t.toy);b.draw();busy=false;S.landed++;sfx.pop();tone(500+S.landed*50,.09,'sine',.12);alPlay('hop');
        const k=S.landed;say(M.CNT_KO[k-1]+'!',cap(M.CNT_EN[k-1])+'!');
        if(!left().length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('장난감을 다 담았어요!','All the toys are in!');finish()},600)}})};
    const wrong=(t,b)=>{b.el.classList.remove('nope');void b.el.offsetWidth;b.el.classList.add('nope');t.el.classList.remove('nope');void t.el.offsetWidth;t.el.classList.add('nope');S.wrongBox=(S.wrongBox||0)+1;LOG.push('wrong:'+t.toy.name+'>'+b.box.cat);
      const n=nameToy(t);say(`이건 ${n.ko}이야! 다른 상자에 넣어 보자!`,`This is a ${n.en}! Try the other box!`)};
    const select=t=>{S.toys.forEach(x=>x.el.classList.toggle('sel',x===t));S.sel=t;if(t){const n=nameToy(t);LOG.push('select:'+t.toy.name);tone(620,.08,'triangle',.14);say(`${n.ko}!`,`${cap(n.en)}!`,true)}};
    H={down:e=>{if(busy)return;
      const b=nearest(e,S.boxes,Math.max(60,S.boxes[0].el.getBoundingClientRect().width*.55));
      if(b&&(!multi||Math.hypot(e.clientX-itC(b)[0],e.clientY-itC(b)[1])<=Math.max(b.el.getBoundingClientRect().width*.55,60))){
        const t=S.sel||left()[0];if(!t||!tapOk())return;if(!multi)return land(t,b);if(b.box.cat===t.toy.cat)return land(t,b);return wrong(t,b)}
      const t=nearest(e,left(),70);if(!t)return false;if(!tapOk())return;
      if(!multi)return land(t,boxFor(t));select(S.sel===t?null:t)}};
    guideAt(AIM,'tap','장난감을 콕 눌러 봐!','Tap a toy!');
  },
  /* 뚜껑 닫기: 상자를 콕 */
  lid(){
    kind='tap';toolTray(boxSVG({cat:'any',toys:[],lid:true}));say('상자 뚜껑을 닫아요! 상자를 콕!','Close the lids! Tap the box!',true);
    const open=()=>S.boxes.filter(b=>!b.box.lid);AIM=()=>{const b=open()[0];return b?itC(b):[0,0]};
    H={down:e=>{const b=nearest(e,open(),90);if(!b)return false;if(busy||!tapOk())return;b.box.lid=true;b.draw();LOG.push('lid');sfx.pop();noise(.1,{freq:700,vol:.2});alPlay('hop');
      if(!open().length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('뚜껑 꽝!','Lids on!');finish()},600)}}};
    guideAt(AIM,'tap','상자를 콕 눌러 봐!','Tap the box!');
  },
  /* 선반: 상자를 콕 하면 선반으로 */
  shelf(){
    kind='tap';toolTray(boxSVG({cat:'car',toys:[],lid:true}));say('상자를 선반에 올려요! 상자를 콕!','Put the boxes on the shelf! Tap a box!',true);
    const on=()=>S.boxes.filter(b=>!b.shelved);AIM=()=>{const b=on()[0];return b?itC(b):[0,0]};
    H={down:e=>{const b=nearest(e,on(),90);if(!b)return false;if(busy||!tapOk())return;busy=true;b.shelved=true;LOG.push('shelve');const from=itC(b),to=plankSlot(b.si),sz=b.el.getBoundingClientRect().width;b.el.style.opacity='0';
      fly(boxSVG(b.box),from,to,sz,plankEl.getBoundingClientRect().width*.3,650,()=>{busy=false;drawShelf();sfx.pop();alPlay('clap');
        if(!on().length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('선반에 쏙!','On the shelf!');finish()},500)}})}};
    guideAt(AIM,'tap','상자를 콕 눌러 봐!','Tap a box!');
  },
  /* 러그 털기: 털개를 쓱쓱 */
  rug(){
    kind='rub';S.rug.g={x:.5,y:.5,s:.94,ar:.8};pos(S.rug);S.rug.draw=()=>{S.rug.el.innerHTML=rugSVG()};
    const cells=[];for(let r=0;r<4;r++)for(let c=0;c<5;c++)cells.push({fx:.17+c*.165,fy:.2+r*.2,it:null});
    cells.forEach(c=>{c.it=mkItem('dust',{x:c.fx,y:c.fy,s:.12},dustSVG,{})});
    const stopI=intro(T.beater,'털개!','Beater!');say('러그를 털개로 쓱쓱 털어요!','Beat the rug to shake the dust out!',true);
    rubTool({icon:T.beater,anchor:[.36,.38],gap:.4,cells,effect:'rub',log:'rug',stopIntro:stopI,rad:.1,sp:50,
      fx:({x,y})=>[0,1,2].map(k=>`<circle cx="${(x+(k-1)*16+Math.sin(performance.now()/180+k)*6).toFixed(1)}" cy="${(y-6-((performance.now()/20+k*20)%30)).toFixed(1)}" r="${6+k*2}" fill="#CFCAD4" opacity=".6"/>`).join(''),
      cell:(c,v)=>{c.it.el.style.opacity=(1-v).toFixed(2);c.it.el.style.transform=`scale(${(1-v*.5).toFixed(2)})`},
      done:()=>{S.items.filter(i=>i.el.classList.contains('dust')).forEach(i=>i.el.style.opacity='0');SFX.sparkle();say('먼지가 쏙 빠졌어요!','No more dust!');spark(...stXY(...ctr(mainEl)),3);finish()}});
    guideRub();
  },
  /* 물 받기: 수도꼭지를 콕 */
  fill(){
    kind='tap';toolTray(faucetSVG());say('물뿌리개에 물을 받아요! 수도꼭지를 콕!','Fill the can! Tap the faucet!',true);
    AIM=()=>itC(S.faucet);
    H={down:e=>{if(!inRect(e,S.faucet.el.getBoundingClientRect(),10))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();LOG.push('faucet');
      const fr=S.faucet.el.getBoundingClientRect(),sr=stR(),cr=S.can.el.getBoundingClientRect();
      Object.assign(waterEl.style,{left:(fr.left-sr.left+fr.width*.72-8)+'px',top:(fr.top-sr.top+fr.height*.6)+'px',height:Math.max(20,cr.top-fr.top-fr.height*.6+cr.height*.3)+'px'});waterEl.classList.add('on');
      noise(1.2,{type:'lowpass',freq:1600,vol:.18,sweep:-600});say('쏴아~','Splash!');const g=gen;let t=0;
      const iv=setInterval(()=>{if(g!==gen){clearInterval(iv);return}t+=.12;S.can.lvl=Math.min(1,t);S.can.draw();if(t>=1){clearInterval(iv);waterEl.classList.remove('on');busy=false;kind='wait';SFX.sparkle();say('물이 가득!','Full of water!');S.canFull=true;finish()}},150);L.onEnd(()=>clearInterval(iv))}};
    guideAt(AIM,'tap','수도꼭지를 콕 눌러 봐!','Tap the faucet!');
  },
  /* 물 주기: 물뿌리개를 움직이면 닿은 화분만 고개를 듦 */
  water(){
    kind='rub';S.can.el.style.opacity='.3';const cells=[];
    S.pots.forEach(p=>{[[-.3,-.2],[.3,-.2],[0,-.1],[-.2,.1],[.2,.1],[0,.2]].forEach(([dx,dy])=>cells.push({fx:p.g.x+dx*p.g.s,fy:p.g.y+dy*p.g.s*1.2,p}))});
    const stopI=intro(canSVG(1),'물뿌리개!','Watering can!');say('물뿌리개를 움직여서 화분마다 물을 줘요!','Move the can over each plant!',true);
    const n={};
    rubTool({icon:canSVG(1),effect:'water',anchor:[.04,.28],gap:.5,cells,log:'water',stopIntro:stopI,hold:'shower',rad:.075,sp:30,
      cell:(c,v)=>{c.v=v;const p=c.p,mine=cells.filter(x=>x.p===p);p.water=mine.reduce((a,x)=>a+(x.v||0),0)/mine.length;p.draw();if(v>=1){n[S.pots.indexOf(p)]=(n[S.pots.indexOf(p)]||0)+1;if(n[S.pots.indexOf(p)]===mine.length){LOG.push('watered');sfx.pop();alPlay('hop')}}},
      done:()=>{S.pots.forEach(p=>{p.water=1;p.draw()});SFX.sparkle();say('고개를 번쩍! 물을 마셨어요!','They drank the water!');alMood('happy',1200);finish()}});
    guideRub();
  },
  /* 시든 잎 떼기: 콕 하면 톡 */
  pluck(){
    kind='tap';toolTray(potSVG({water:.4,leaves:[{x:28,y:78,r:-20}],bloom:false}));S.plucked=0;
    const total=S.pots.reduce((a,p)=>a+p.leaves.length,0);say('시든 잎을 콕 눌러서 떼요!','Tap the dry leaves to pick them off!',true);
    const leafXY=(p,l)=>{const r=p.el.getBoundingClientRect();return[r.left+r.width*l.x/100,r.top+r.height*l.y/120]};
    const all=()=>{const o=[];S.pots.forEach(p=>p.leaves.forEach(l=>{if(!l.gone)o.push({p,l,xy:leafXY(p,l)})}));return o};
    AIM=()=>{const a=all()[0];return a?a.xy:[0,0]};
    H={down:e=>{let best=null,bd=1e9;all().forEach(o=>{const d=Math.hypot(e.clientX-o.xy[0],e.clientY-o.xy[1]);if(d<bd){bd=d;best=o}});if(!best||bd>60)return false;if(busy||!tapOk())return;
      best.l.gone=true;S.plucked++;LOG.push('pluck');best.p.draw();sfx.pop();
      fly(`<svg viewBox="-14 -14 28 28"><ellipse rx="12" ry="6" fill="#9A6A3C" ${S2}/></svg>`,best.xy,[best.xy[0]+rand(60)-30,best.xy[1]+110],26,18,600);
      say(M.CNT_KO[S.plucked-1]+'!',cap(M.CNT_EN[S.plucked-1])+'!');
      if(S.plucked>=total){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('시든 잎이 없어졌어요!','No more dry leaves!');finish()},700)}}};
    guideAt(AIM,'tap','시든 잎을 콕 눌러 봐!','Tap a dry leaf!');
  },
  /* 햇빛 자리로: 화분을 콕 하면 햇빛 아래로 폴짝 */
  sun(){
    kind='tap';toolTray(potSVG({water:1,leaves:[],bloom:true,col:'#E89AAE'}));S.beam.el.style.opacity='1';S.faucet.el.style.opacity='0';S.can.el.style.opacity='0';S.moved=0;say('화분을 햇빛 아래로 옮겨요! 화분을 콕!','Move the plants into the sun! Tap a plant!',true);
    const rest=()=>S.pots.filter(p=>!p.moved);AIM=()=>{const p=rest()[0];return p?itC(p):[0,0]};
    H={down:e=>{const p=nearest(e,rest(),80);if(!p)return false;if(busy||!tapOk())return;p.moved=true;p.g={x:p.sunX,y:.72,s:.3,ar:1.2};pos(p);LOG.push('sun');sfx.pop();alPlay('hop');S.moved++;
      const g=gen;L.later(()=>{if(g!==gen)return;p.bloom=true;p.draw();sparkAt(p);tone(900,.12,'sine',.14)},650);
      if(!rest().length){H={};G.stop();kind='wait';L.later(()=>{if(g!==gen)return;SFX.sparkle();say('꽃이 활짝 피었어요!','The flowers are blooming!');finish()},1500)}}};
    guideAt(AIM,'tap','화분을 콕 눌러 봐!','Tap a plant!');
  },
  /* 빨래 넣기: 바구니의 옷을 콕 → 세탁기로 쏙 */
  load(){
    kind='tap';toolTray(basketSVG());S.loaded=0;say('빨래를 콕 누르면 세탁기로 쏙!','Tap the clothes to put them in the washer!',true);
    const rest=()=>S.cloth.filter(c=>c.state==='basket');AIM=()=>{const c=rest()[0];return c?itC(c):[0,0]};
    H={down:e=>{const c=nearest(e,rest(),70);if(!c)return false;if(busy||!tapOk())return;busy=true;c.state='machine';S.loaded++;LOG.push('load');const from=itC(c),to=itC(S.machine),sz=c.el.getBoundingClientRect().width;c.el.style.opacity='0';
      fly(clothSVG(c.c),from,[to[0],to[1]+10],sz,sz*.5,520,()=>{busy=false;sfx.pop();alPlay('hop');say(M.CNT_KO[S.loaded-1]+'!',cap(M.CNT_EN[S.loaded-1])+'!');
        if(!rest().length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('빨래를 다 넣었어요!','All the clothes are in!');finish()},600)}})}};
    guideAt(AIM,'tap','빨래를 콕 눌러 봐!','Tap the clothes!');
  },
  /* 세제 한 컵: 콕 */
  soap(){
    kind='tap';toolTray(cupSVG());say('세제를 한 컵 넣어요! 컵을 콕!','Add a cup of soap! Tap the cup!',true);AIM=()=>itC(S.cup);
    H={down:e=>{if(!inRect(e,S.cup.el.getBoundingClientRect(),14))return false;if(busy||!tapOk())return;busy=true;H={};G.stop();LOG.push('detergent');
      const from=itC(S.cup),to=itC(S.machine);S.cup.el.classList.add('sel');
      fly(`<svg viewBox="-10 -10 20 20"><circle r="8" fill="#A7CFE8" ${S2}/></svg>`,[from[0],from[1]-30],[to[0]-20,to[1]-30],26,18,600,()=>{S.cup.el.classList.remove('sel');busy=false;S.cup.done=true;sfx.pop();noise(.3,{type:'lowpass',freq:800,vol:.12});kind='wait';say('세제 한 컵!','One cup of soap!');const g=gen;L.later(()=>{if(g===gen)finish()},500)})}};
    guideAt(AIM,'tap','컵을 콕 눌러 봐!','Tap the cup!');
  },
  /* 시작: 단추를 콕 → 빙글빙글 도는 것을 봄 */
  start(){
    kind='tap';S.start.el.style.opacity='1';toolTray(startSVG());say('시작 단추를 콕!','Tap the start button!',true);AIM=()=>itC(S.start);
    H={down:e=>{if(!inRect(e,S.start.el.getBoundingClientRect(),14))return false;if(busy||!tapOk())return;H={};G.stop();kind='wait';LOG.push('start');S.start.el.style.opacity='0.35';
      S.machine.st='spin';S.machine.draw();sweepTone(180,260,.5,'sine',.12);say('빙글빙글! 거품이 보글보글!','Round and round! Bubbles!');alMood('wow',2000);const g=gen;
      L.later(()=>{if(g!==gen)return;S.machine.st='closed';S.machine.draw();S.spun=true;SFX.ding();LOG.push('spin-done');S.cloth.forEach(c=>{c.wet=true});say('띵! 빨래가 다 됐어요!','Ding! The laundry is done!');alPlay('clap');finish(()=>{S.start.el.style.opacity='0'})},SPIN_MS)}};
    guideAt(AIM,'tap','단추를 콕 눌러 봐!','Tap the button!');
  },
  /* 널기: 젖은 옷을 콕 → 빨랫줄, 다시 콕 → 집게 */
  hang(){
    kind='tap';clearMain();S.hung=0;S.clip=0;
    S.line=mkItem('back',{x:.5,y:.28,s:.96,ar:.2},lineSVG,{});S.basket=mkItem('',{x:.5,y:.8,s:.4},basketSVG,{});
    const xs=[.2,.5,.8];S.cloth.forEach((c,i)=>{c.state='basket';c.wet=true;c.folded=false;const old=c;S.cloth[i]=mkItem('cloth',{x:.4+i*.1,y:.7,s:.24},it=>clothSVG(it.c,it.wet,it.folded),{c:old.c,state:'basket',wet:true,folded:false,slot:xs[i],peg:null})});
    toolTray(pegSVG());say('젖은 옷을 콕 눌러 빨랫줄에 널고, 집게를 콕!','Hang the wet clothes up, then tap the clip!',true);
    const next=()=>S.cloth.find(c=>c.state==='basket')||S.cloth.find(c=>c.state==='hung');
    AIM=()=>{const c=next();return c?itC(c):[0,0]};
    H={down:e=>{const c=nearest(e,S.cloth.filter(c=>c.state!=='clipped'),70);if(!c)return false;if(busy||!tapOk())return;
      if(c.state==='basket'){c.state='hung';S.hung++;c.g={x:c.slot,y:.46,s:.26};pos(c);LOG.push('hang');sfx.pop();alPlay('hop');
        c.peg=mkItem('peg',{x:c.slot,y:.3,s:.07,ar:1.5},pegSVG,{});c.peg.el.classList.add('callme');say('집게를 콕!','Tap the clip!')}
      else if(c.state==='hung'){c.state='clipped';S.clip++;LOG.push('clip');if(c.peg){c.peg.g.y=.325;pos(c.peg);c.peg.el.classList.remove('callme')}tone(760,.07,'square',.08);sfx.pop();
        if(S.clip>=S.cloth.length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('빨래가 나란히 널렸어요!','All hung up!');finish()},700)}}}};
    guideAt(AIM,'tap','옷을 콕 눌러 봐!','Tap a cloth!');
  },
  /* 개기: 옷을 쓱 쓸면 반으로 접힘 → 콕 하면 서랍으로 */
  fold(){
    kind='fold';S.folded=0;S.stored=0;S.cloth.forEach(c=>{if(c.peg)dropItem(c.peg)});
    S.line.el.style.opacity='0';S.drawer=mkItem('',{x:.5,y:.2,s:.34,ar:.9},drawerSVG,{});
    S.cloth.forEach((c,i)=>{c.wet=false;c.state='dry';c.folded=false;c.g={x:.2+i*.3,y:.62,s:.3};c.draw();pos(c)});
    toolTray(clothSVG({col:'#8FC3E6'},false,true));say('마른 옷을 쓱 쓸어서 반으로 접어요! 접은 옷은 콕 하면 서랍으로!','Swipe a cloth to fold it! Tap it to put it away!',true);
    const todo=()=>S.cloth.find(c=>c.state==='dry')||S.cloth.find(c=>c.state==='folded');
    AIM=()=>{const c=todo();return c?itC(c):[0,0]};let sw=null;
    const store1=c=>{busy=true;c.state='stored';S.stored++;LOG.push('drawer');const from=itC(c),to=itC(S.drawer),sz=c.el.getBoundingClientRect().width;c.el.style.opacity='0';
      fly(clothSVG(c.c,false,true),from,to,sz,sz*.4,520,()=>{busy=false;sfx.pop();alPlay('hop');say(M.CNT_KO[S.stored-1]+'!',cap(M.CNT_EN[S.stored-1])+'!');
        if(S.stored>=S.cloth.length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('서랍에 쏙쏙!','All put away!');finish()},600)}})};
    const doFold=c=>{c.state='folded';c.folded=true;c.draw();S.folded++;LOG.push('fold');noise(.15,{type:'lowpass',freq:900,vol:.14});sfx.pop()};
    H={down:e=>{const c=nearest(e,S.cloth.filter(c=>c.state==='dry'||c.state==='folded'),75);if(!c)return false;if(busy)return;
      if(c.state==='folded'){if(tapOk())store1(c);return}sw={c,x:e.clientX,y:e.clientY}},
      move:e=>{if(sw&&Math.hypot(e.clientX-sw.x,e.clientY-sw.y)>36){const c=sw.c;sw=null;doFold(c)}},up:()=>{sw=null}};
    guideAt(AIM,'swipe','옷을 쓱 쓸어 봐!','Swipe the cloth!');
  },
  /* 청소기: 먼지 뭉치를 쓱쓱 */
  vac(){
    kind='rub';const stopI=intro(T.vacuum,'청소기!','Vacuum!');say('청소기로 먼지 뭉치를 쓱쓱 빨아들여요!','Vacuum up the dust bunnies!',true);
    const cells=S.dust.map(it=>({fx:it.g.x,fy:it.g.y,it}));
    rubTool({icon:T.vacuum,anchor:[.26,.7],gap:.4,cells,effect:'rub',log:'vac',stopIntro:stopI,hold:'dryer',rad:.085,sp:44,
      fx:({wx,wy,x,y})=>[0,1,2,3].map(k=>{const t=((performance.now()/500)+k/4)%1;return `<circle cx="${(x+(wx-x)*t).toFixed(1)}" cy="${(y+(wy-y)*t).toFixed(1)}" r="${(7-4*t).toFixed(1)}" fill="#CFCAD4" opacity="${(1-t*.5).toFixed(2)}"/>`}).join(''),
      cell:(c,v)=>{c.it.v=v;c.it.el.style.opacity=(1-v).toFixed(2);c.it.el.style.transform=`scale(${(1-v*.6).toFixed(2)})`},
      done:()=>{S.dust.forEach(i=>{i.v=1;i.el.style.opacity='0'});SFX.sparkle();say('먼지가 쏙!','All sucked up!');alMood('happy',1000);finish()}});
    guideRub();
  },
  /* 양말 줍기: 소파 밑에서 나온 양말을 콕 */
  socks(){
    kind='tap';toolTray(sockSVG('#E89AAE'));S.picked=0;S.sbasket.el.style.opacity='1';say('소파 밑에서 양말이 나왔어요! 콕 눌러 바구니에!','Socks under the sofa! Tap them into the basket!',true);
    S.socks.forEach((s,i)=>{s.out=true;s.g={x:.34+i*.3,y:.4+.14,s:.17};pos(s);s.el.style.opacity='1'});
    const rest=()=>S.socks.filter(s=>!s.got);AIM=()=>{const s=rest()[0];return s?itC(s):[0,0]};
    H={down:e=>{const s=nearest(e,rest(),80);if(!s)return false;if(busy||!tapOk())return;busy=true;s.got=true;S.picked++;LOG.push('sock');const from=itC(s),to=itC(S.sbasket),sz=s.el.getBoundingClientRect().width;s.el.style.opacity='0';
      fly(sockSVG(s.col),from,to,sz,sz*.6,520,()=>{busy=false;sfx.pop();alPlay('hop');say(M.CNT_KO[S.picked-1]+'!',cap(M.CNT_EN[S.picked-1])+'!');
        if(!rest().length){H={};G.stop();kind='wait';const g=gen;L.later(()=>{if(g!==gen)return;SFX.sparkle();say('양말을 다 주웠어요!','Got all the socks!');finish()},600)}})}};
    guideAt(AIM,'tap','양말을 콕 눌러 봐!','Tap a sock!');
  },
  /* 걸레: 얼룩을 쓱쓱 */
  mop(){
    kind='rub';const stopI=intro(T.mop,'걸레!','Mop!');say('걸레로 얼룩을 쓱쓱 닦아요!','Wipe the stains with the mop!',true);
    const cells=[];S.stains.forEach(it=>{[[-.25,-.2],[.25,-.15],[0,.05],[-.2,.25],[.25,.25]].forEach(([dx,dy])=>cells.push({fx:it.g.x+dx*it.g.s,fy:it.g.y+dy*it.g.s,it}))});
    rubTool({icon:T.mop,anchor:[.5,.84],gap:.4,cells,effect:'foam',log:'mop',stopIntro:stopI,rad:.075,sp:30,
      cell:(c,v)=>{const mine=cells.filter(x=>x.it===c.it);c.v=v;c.it.v=mine.reduce((a,x)=>a+(x.v||0),0)/mine.length;c.it.el.style.opacity=(1-c.it.v).toFixed(2)},
      done:()=>{S.stains.forEach(i=>{i.v=1;i.el.style.opacity='0'});SFX.sparkle();say('반짝반짝 마루!','Sparkling floor!');spark(...stXY(...ctr(mainEl)),3);finish()}});
    guideRub();
  },
  /* 끝내기: 토토를 콕 → 박수 → 하트 */
  serve(){
    kind='tap';toolTray(ICON.heart);AIM=()=>ctr(custEl);bubEl.hidden=true;
    say('다 치웠어요! 토토를 콕 눌러 줘요!','All tidy! Tap Toto!',true);
    H={down:e=>{if(!inRect(e,custEl.getBoundingClientRect(),10))return false;H={};G.stop();kind='wait';give()}};
    guideAt(AIM,'tap','토토를 콕 눌러 봐!','Tap Toto!');
  }
};
function finish(between){
  H={};kind='wait';AIM=null;const g=gen;LOG.push('done:'+plan[pi]);alPlay('hop');
  L.later(()=>{if(g!==gen)return;if(between)between();tray.innerHTML='';
    L.later(()=>{if(g!==gen)return;pi++;run()},Math.round(BRIDGE_MS*.45))},Math.round(BRIDGE_MS*.55));
}
function run(){
  H={};act=null;killTool();G.stop();busy=false;tray.onpointerdown=null;
  const k=plan[pi];if(!k)return;phase=k;strip();size();G.place();STEP[k]();
}

/* ---------- ending ---------- */
function give(){
  phase='serve';LOG.push('serve');const g=gen;drawCust('happy');alPlay('dance');const p=pick(VO.praise||[{ko:'깨끗해!',en:'So clean!'}]);say(p.ko+' 고마워!',p.en+' Thank you!');SFX.sparkle();
  spark(...stXY(...ctr(mainEl)),4);
  L.later(()=>{if(g!==gen)return;heart()},2400);
}
function heart(){
  const cr=custEl.getBoundingClientRect(),g=gen;
  fly(ICON.heart,[cr.left+cr.width*.3,cr.top+cr.height*.6],[cr.left+cr.width*.3,cr.top-60],50,40,1000,()=>{if(g!==gen)return;DATA.served++;DATA.last=S.doneJobs[0]||'';save();SFX.sparkle()});
  LOG.push('clear');if(PRG())try{PRG().clear(GID)}catch(e){}
  L.later(()=>{if(g!==gen)return;alPlay('wave');say('안녕! 또 도와줘!','Bye! Help me again!');
    L.later(()=>{if(g!==gen)return;custEl.classList.remove('enter');void custEl.offsetWidth;custEl.classList.add('leave');bubEl.hidden=true;
      L.later(()=>{if(g===gen)newRound()},1400)},1500)},1100);
}

/* ---------- a new round ---------- */
function newRound(){
  L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.innerHTML='';tray.onpointerdown=null;busy=false;flying=0;waterEl.classList.remove('on');
  lv=levelInfo(levelNo());
  S={items:[],jobs:lv.jobs.slice(),doneJobs:[],chosen:null,job:null};mainEl.innerHTML='';
  plan=['pick','serve'];pi=0;phase='enter';kind='wait';LOG.push('level:'+lv.level);
  size();strip();
  if(al){al.detach();al=null}drawCust('idle');
  if(M.Alive){al=M.Alive.attach(custEl,{kind:'bunny'});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  custEl.classList.remove('leave','enter');void custEl.offsetWidth;custEl.classList.add('enter');
  bubEl.innerHTML=`<svg viewBox="-20 -20 40 40" width="44" height="44">${svgInner(ICON.glint)}</svg>`;bubEl.hidden=true;
  buildHouse([]);S.rooms.forEach(r=>{r.messy=false;r.draw()});
  const g=gen;
  L.later(()=>{if(g!==gen)return;alPlay('hop',{n:2,wave:true});bubEl.hidden=false;say('안녕! 나는 토토야. 집이 어질러졌어. 도와줘!',"Hi! I'm Toto. My house is messy. Please help!")},1200);
  L.later(()=>{if(g!==gen)return;run()},3600);
}

/* ---------- test hooks ---------- */
M.__choreLevel=n=>{DATA.level=Math.max(1,Math.min(LV.length,n|0));save();const pr=PRG();if(pr&&pr.set)pr.set(GID,DATA.level);if(cur()===id)newRound();return levelNo()};
M.__chore=()=>{
  const k=plan[pi]||null,mr=mainEl.getBoundingClientRect();let aim=null;try{aim=AIM?AIM():null}catch(e){}
  const xy=it=>itC(it);
  return{level:lv?lv.level:levelNo(),plan:plan.slice(),pi,phase,step:k,kind,busy,aim,rect:{x:mr.left,y:mr.top,w:mr.width,h:mr.height},job:S&&S.job,doneJobs:S?S.doneJobs.slice():[],
    cards:[...tray.querySelectorAll('.ch-card')].map(b=>b.dataset.j),offer:S&&S.offer,
    toys:S&&S.toys?S.toys.map(t=>({name:t.toy.name,cat:t.toy.cat,done:t.done,xy:xy(t)})):[],
    boxes:S&&S.boxes?S.boxes.map(b=>({cat:b.box.cat,count:b.box.toys.length,lid:b.box.lid,shelved:b.shelved,xy:xy(b)})):[],
    sel:S&&S.sel?S.toys.indexOf(S.sel):-1,wrongBox:S&&S.wrongBox||0,landed:S&&S.landed||0,
    pots:S&&S.pots?S.pots.map(p=>({water:+p.water.toFixed(2),leaves:p.leaves.filter(l=>!l.gone).length,moved:p.moved,bloom:p.bloom})):[],
    cloth:S&&S.cloth?S.cloth.map(c=>({state:c.state,wet:c.wet,folded:c.folded})):[],spun:!!(S&&S.spun),hung:S&&S.hung,clipped:S&&S.clip,folded:S&&S.folded,stored:S&&S.stored,
    dust:S&&S.dust?+(S.dust.reduce((a,d)=>a+d.v,0)/S.dust.length).toFixed(2):null,socks:S&&S.picked||0,
    cellPts:tool?tool.cellPts():[],toolOn:!!tool,alive:al?al.state():null,misses,guide:G.state(),served:DATA.served,log:LOG.slice()};
};
M.__choreDepth=()=>LV.map((l,i)=>{const v=levelInfo(i+1),H2={sort:'tap',lid:'tap',shelf:'tap',rug:'rub',fill:'tap',water:'rub',pluck:'tap',sun:'tap',load:'tap',soap:'tap',start:'tap',hang:'tap',fold:'rub',vac:'rub',socks:'tap',mop:'rub'};
  lv=v;const per=v.jobs.map(j=>stepsOf(j));const all=new Set(['pick'].concat(...per));const hands=new Set(['choose']);per.forEach(a=>a.forEach(k=>hands.add(H2[k])));
  return{level:i+1,jobs:v.jobs,processesPerJob:per.map(a=>a.length+1),processes:all.size,hands:[...hands],someone:!!M.Alive,choice:true,ending:true,chain:v.chain}});
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();gen++;H={};act=null;killTool();G.stop();fxEl.innerHTML='';tray.onpointerdown=null;if(al){al.detach();al=null}phase='';kind='wait'},resize:size};
window.addEventListener('resize',()=>{if(cur()===id)size()});
/* tile picture on the home screen */
document.querySelectorAll('.tile[data-go="chores2"] .ic').forEach(ic=>{
  ic.innerHTML=`<svg viewBox="0 0 100 100" style="width:1.5em;height:1.5em;overflow:visible">${svgInner(T.vacuum)}<g transform="translate(80 20) scale(.6)">${svgInner(ICON.glint)}</g></svg>`;
});
})();
