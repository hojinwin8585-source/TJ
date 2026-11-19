/* 말랑 놀이터 공통 뼈대 ML.Shell (P16) — 모든 놀이 화면이 같은 틀 하나로.
   세 구역: 머리줄(왼쪽 위 같은 뒤로 가기 그림 · 가운데 과정 그림 줄 · 오른쪽 그림 버튼 하나까지) / 무대 / 아래 칸.
   숫자는 MLCFG.shell(header.heightPx, stage.heightRatio, tray.heightRatio, placeScreen), rules.sameLayoutEverywhere.sizes(back, cards),
   touch(minTargetPx, tool), home(places, insidePlace), catalog(retired) 에서 읽습니다.
   Shell.screen(id, {place, steps, tray, right, …}) → {sec, head, back, strip, right, stage, tray}
   Shell.adopt(id)            예전 화면(index.html · play2.js · play3.js)의 머리줄만 같은 틀로 갈아 끼움(놀이 내용은 그대로)
   Shell.cards(items, onPick) 카드 3장 + 다음 장 화살표 · Shell.tool(svg) 지금 도구 하나 · Shell.finish(svg, fn) 오른쪽 아래 끝내기 그림 버튼
   Shell.start(sec, items, onPick) 시작 카드(종류 고르기 탭 대신, shell.insteadOfTabs)
   Shell.place(key)           장소 화면: 머리줄 + 장소 배경 위 그림 타일 2×2 + 다음 장 화살표
   뒤로 가기는 한 단계 위로: 놀이 → 장소 → 홈. 아이 화면에 글자·이모지를 넣지 않음. */
(()=>{
'use strict';
const M=window.ML,A=window.ART;if(!M)return;
const CF=M.CFG||window.MLCFG||{},SH=CF.shell||{},RULES=CF.rules||{},TOUCH=CF.touch||{},HOME=CF.home||{},CAT=CF.catalog||{},PAL=(CF.calm||{}).palette||{};
const num=(s,i,d)=>{const m=String(s==null?'':s).match(/\d+(?:\.\d+)?/g);return m&&m[i]!=null?+m[i]:d};
const px=(s,d)=>{const m=String(s==null?'':s).match(/(\d+)\s*px/);return m?+m[1]:d};
const SIZES=(RULES.sameLayoutEverywhere||{}).sizes||{};
const HEAD_PX=(SH.header||{}).heightPx||72;
const BACK_PX=Math.max(64,px(SIZES.back,64));
const CARD_PX=Math.max(110,px(SIZES.cards,110),TOUCH.minTargetPx||110);
const MAX_CARDS=Math.max(1,num(SIZES.cards,1,3)||(TOUCH.maxChoicesPerScreen||3));
const TRAY_R=(SH.tray||{}).heightRatio||[.18,.22];
const TOOL_PX=Math.max(150,px((TOUCH.tool||{}).intro,150));          // '도구 칸의 도구 그림도 150px 이상'
const TILE_PX=Math.max(150,px(HOME.insidePlace,150));               // '타일을 한 번에 4개(2×2, 각 150px 이상)'
const PER_PAGE=Math.max(1,num(HOME.inside,0,4));                        // '놀이 그림 타일을 한 번에 4개까지'
const OL=(A&&A.OL)||PAL.outline||'#5B3A29',S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const C={rose:PAL.rose||'#E8A0AE',peach:PAL.peach||'#F2B48C',butter:PAL.butter||'#F0D58A',sage:PAL.sage||'#A9CFA0',sky:PAL.sky||'#A7CFE8',lilac:PAL.lilac||'#C3B4E6',paper:PAL.surface||'#FFFDF9',bg:PAL.bg||'#F6F1EA'};
const say=(ko,en)=>{try{M.say(ko,en)}catch(e){}};
const pop=()=>{try{M.sfx.pop()}catch(e){}};
const bounce=el=>{try{M.bounce(el)}catch(e){}};

/* ============================== drawn pictures (말랑 그림체, brown outline, no emoji) ============================== */
const I={
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  next:`<svg viewBox="0 0 100 100"><path d="M14 38H52V18L88 50L52 82V62H14Z" fill="${C.butter}" ${S}/><path d="M22 46H58V36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`,
  play:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${C.sage}" ${S}/><path d="M40 30L72 50L40 70Z" fill="#fff" ${S}/></svg>`,
  pencil:`<svg viewBox="0 0 100 100"><path d="M24 76L30 56L68 18Q74 12 80 18L82 20Q88 26 82 32L44 70Z" fill="${C.butter}" ${S}/><path d="M24 76L30 56L44 70Z" fill="#F6E3C8" ${S}/><path d="M24 76L27 66L34 73Z" fill="${OL}"/><path d="M62 24L76 38" ${S}/></svg>`,
  dog:()=>A?A.animal('dog','happy',{}):'',
  paw:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="62" rx="22" ry="18" fill="${C.peach}" ${S}/><ellipse cx="26" cy="40" rx="9" ry="11" fill="${C.peach}" ${S}/><ellipse cx="42" cy="26" rx="9" ry="11" fill="${C.peach}" ${S}/><ellipse cx="60" cy="26" rx="9" ry="11" fill="${C.peach}" ${S}/><ellipse cx="76" cy="40" rx="9" ry="11" fill="${C.peach}" ${S}/><ellipse cx="44" cy="58" rx="5" ry="3" fill="#fff" opacity=".6"/></svg>`,
  find:`<svg viewBox="0 0 100 100"><circle cx="42" cy="42" r="26" fill="#EAF5FC" ${S}/><path d="M30 34Q36 24 46 26" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M61 61L84 84" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M61 61L84 84" stroke="${C.lilac}" stroke-width="7" stroke-linecap="round"/><circle cx="36" cy="44" r="4" fill="${OL}"/><circle cx="50" cy="44" r="4" fill="${OL}"/><path d="M38 54Q43 58 48 54" fill="none" ${S}/></svg>`,
  trace:`<svg viewBox="0 0 100 100"><path d="M10 74Q26 44 44 64T80 34" fill="none" stroke="${C.sky}" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 12"/><path d="M80 34l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="${C.butter}" ${S} transform="translate(-6 -18)"/><path d="M14 88L18 74L46 46Q50 42 54 46L55 47Q59 51 55 55L27 83Z" fill="${C.rose}" ${S}/><path d="M14 88L18 74L27 83Z" fill="#F6E3C8" ${S}/></svg>`,
  shapes:`<svg viewBox="0 0 100 100"><circle cx="30" cy="34" r="18" fill="${C.rose}" ${S}/><path d="M70 14L90 48H50Z" fill="${C.butter}" ${S}/><rect x="34" y="56" width="32" height="32" rx="5" fill="${C.sky}" ${S}/></svg>`,
  jelly:`<svg viewBox="0 0 100 100">${[[28,58,C.rose],[50,46,C.sage],[72,58,C.butter]].map(([x,y,c])=>`<g transform="translate(${x} ${y})"><path d="M-14 22Q-16 -2 -10 -12Q-6 -20 0 -20Q6 -20 10 -12Q16 -2 14 22Q0 28 -14 22Z" fill="${c}" ${S}/><circle cx="-5" cy="-6" r="2.6" fill="${OL}"/><circle cx="5" cy="-6" r="2.6" fill="${OL}"/><path d="M-4 2Q0 5 4 2" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 -12Q-6 -16 -2 -16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></g>`).join('')}</svg>`,
  keys:`<svg viewBox="0 0 100 100"><rect x="8" y="26" width="84" height="56" rx="10" fill="${C.lilac}" ${S}/>${[0,1,2,3,4].map(i=>`<rect x="${16+i*14}" y="36" width="12" height="38" rx="3" fill="#fff" ${S}/>`).join('')}${[0,1,3].map(i=>`<rect x="${25+i*14}" y="36" width="7" height="22" rx="2" fill="${OL}"/>`).join('')}<path d="M70 10V22" ${S}/><ellipse cx="66" cy="22" rx="5" ry="4" fill="${OL}"/></svg>`,
  song:`<svg viewBox="0 0 100 100"><path d="M50 12l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" fill="${C.butter}" ${S}/><circle cx="42" cy="46" r="3" fill="${OL}"/><circle cx="58" cy="46" r="3" fill="${OL}"/><path d="M44 56Q50 61 56 56" fill="none" ${S}/><path d="M82 70V88" ${S}/><ellipse cx="78" cy="88" rx="6" ry="4.5" fill="${OL}"/><path d="M82 70L92 74" ${S}/></svg>`,
  drum:`<svg viewBox="0 0 100 100"><path d="M18 40V70Q50 88 82 70V40Z" fill="${C.rose}" ${S}/><path d="M18 46L34 76M50 50L50 82M82 46L66 76M34 48L50 80M66 48L50 80" stroke="#fff" stroke-width="3" opacity=".7"/><ellipse cx="50" cy="40" rx="32" ry="12" fill="#FFF6EC" ${S}/><path d="M26 12L46 34" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="10" r="6" fill="${C.butter}" ${S}/><path d="M78 14L58 34" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="12" r="6" fill="${C.butter}" ${S}/></svg>`,
  clap:`<svg viewBox="0 0 100 100"><g transform="rotate(-14 40 56)"><path d="M26 86V40Q26 32 32 32Q38 32 38 40V30Q38 22 44 22Q50 22 50 30V86Z" fill="#FFE4D0" ${S}/></g><g transform="rotate(14 60 56)"><path d="M50 86V30Q50 22 56 22Q62 22 62 30V40Q62 32 68 32Q74 32 74 40V86Z" fill="#FFEADB" ${S}/></g><path d="M50 8V16M38 12L42 18M62 12L58 18" ${S}/></svg>`,
  bell:`<svg viewBox="0 0 100 100"><path d="M50 12Q74 14 76 44V64L86 74H14L24 64V44Q26 14 50 12Z" fill="${C.butter}" ${S}/><circle cx="50" cy="82" r="8" fill="${C.peach}" ${S}/><circle cx="50" cy="10" r="5" fill="${C.peach}" ${S}/><path d="M36 30Q38 22 46 20" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  palette:`<svg viewBox="0 0 100 100"><path d="M50 12Q88 12 90 46Q90 64 72 62Q60 60 60 72Q62 88 46 88Q12 86 10 52Q10 14 50 12Z" fill="#F6E3C8" ${S}/><circle cx="32" cy="36" r="7" fill="${C.rose}" ${S}/><circle cx="52" cy="28" r="7" fill="${C.butter}" ${S}/><circle cx="72" cy="38" r="7" fill="${C.sky}" ${S}/><circle cx="28" cy="58" r="7" fill="${C.sage}" ${S}/><circle cx="46" cy="70" r="7" fill="#fff" ${S}/></svg>`,
  apple:`<svg viewBox="0 0 100 100"><rect x="14" y="8" width="72" height="86" rx="12" fill="#fff" ${S}/><path d="M50 36Q40 26 30 32Q18 40 24 60Q30 80 44 80Q48 78 50 78Q52 78 56 80Q70 80 76 60Q82 40 70 32Q60 26 50 36Z" fill="${C.rose}" ${S}/><path d="M50 36Q50 26 56 20" ${S}/><path d="M56 26Q66 18 72 24Q64 32 56 26Z" fill="${C.sage}" ${S}/><path d="M32 46Q34 40 40 38" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  car:`<svg viewBox="0 0 100 100"><path d="M12 66V54Q12 46 22 44L32 28Q36 22 44 22H62Q70 22 74 30L80 44Q90 46 90 56V66Z" fill="${C.sky}" ${S}/><path d="M38 30H50V44H30Z" fill="#EAF5FC" ${S}/><path d="M56 30H66L72 44H56Z" fill="#EAF5FC" ${S}/><circle cx="30" cy="68" r="10" fill="#7A6A62" ${S}/><circle cx="72" cy="68" r="10" fill="#7A6A62" ${S}/><circle cx="30" cy="68" r="4" fill="#fff"/><circle cx="72" cy="68" r="4" fill="#fff"/></svg>`,
  teddy:`<svg viewBox="0 0 100 100"><circle cx="30" cy="22" r="10" fill="#D9A877" ${S}/><circle cx="70" cy="22" r="10" fill="#D9A877" ${S}/><ellipse cx="50" cy="72" rx="24" ry="22" fill="#D9A877" ${S}/><circle cx="50" cy="38" r="22" fill="#D9A877" ${S}/><ellipse cx="50" cy="46" rx="10" ry="7" fill="#F6E3C8" ${S}/><circle cx="42" cy="34" r="3" fill="${OL}"/><circle cx="58" cy="34" r="3" fill="${OL}"/><circle cx="50" cy="43" r="3" fill="${OL}"/><ellipse cx="50" cy="74" rx="11" ry="10" fill="#F6E3C8"/></svg>`,
  sounds:()=>`<svg viewBox="0 0 100 100"><g transform="translate(-2 18) scale(.36)">${A?A.animal('cat','happy',{}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,''):''}</g><path d="M74 34Q82 50 74 66M84 26Q96 50 84 74" fill="none" ${S}/></svg>`,
  tv:`<svg viewBox="0 0 100 100"><path d="M36 10L50 24L64 10" ${S} fill="none"/><rect x="10" y="24" width="80" height="58" rx="12" fill="${C.lilac}" ${S}/><rect x="18" y="32" width="64" height="42" rx="7" fill="#EAF5FC" ${S}/><path d="M44 42L60 53L44 64Z" fill="${C.rose}" ${S}/><path d="M28 82L24 92M72 82L76 92" ${S}/></svg>`,
  castle:()=>A&&A.BUILD?A.BUILD.castle:'',
  stamp:()=>A&&A.BUILD?A.BUILD.stamp:'',
  house:`<svg viewBox="0 0 200 160"><rect x="40" y="70" width="120" height="82" rx="8" fill="#FFF3DF" ${S}/><path d="M28 74L100 22L172 74Z" fill="${C.sage}" ${S}/><rect x="86" y="104" width="30" height="48" rx="6" fill="#C98C5C" ${S}/><circle cx="62" cy="100" r="13" fill="#BDE8FF" ${S}/><circle cx="140" cy="100" r="13" fill="#BDE8FF" ${S}/><path d="M100 62c-7-9-18 0-9 9l9 8 9-8c9-9-2-18-9-9z" fill="${C.rose}"/></svg>`,
  friends:`<svg viewBox="0 0 100 100">${[[30,C.peach],[70,C.sky]].map(([x,c])=>`<g transform="translate(${x} 0)"><path d="M-20 92Q-20 62 0 62Q20 62 20 92Z" fill="${c}" ${S}/><circle cx="0" cy="42" r="18" fill="#FFE4D0" ${S}/><circle cx="-6" cy="40" r="2.6" fill="${OL}"/><circle cx="6" cy="40" r="2.6" fill="${OL}"/><path d="M-5 48Q0 52 5 48" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/></g>`).join('')}<path d="M50 18c-4-6-12 0-6 6l6 5 6-5c6-6-2-12-6-6z" fill="${C.rose}" ${S}/></svg>`,
  basket:`<svg viewBox="0 0 100 100"><path d="M28 34Q50 8 72 34" fill="none" stroke="${OL}" stroke-width="5"/><path d="M12 38H88L80 88H20Z" fill="#E3C79E" ${S}/><path d="M16 54H84M18 70H82M36 38L38 88M50 38V88M64 38L62 88" stroke="${OL}" stroke-width="2.4" opacity=".55"/><path d="M30 38Q36 26 46 32Q54 22 64 34" fill="${C.sky}" ${S}/></svg>`,
  broom:`<svg viewBox="0 0 100 100"><path d="M64 8L46 56" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M64 8L46 56" stroke="#D9A877" stroke-width="4" stroke-linecap="round"/><path d="M38 52L58 60L60 66Q54 90 22 92Q26 70 34 58Z" fill="${C.butter}" ${S}/><path d="M30 74L50 64M28 84L54 70" stroke="${OL}" stroke-width="2.4" opacity=".55"/></svg>`,
  plant:`<svg viewBox="0 0 100 100"><path d="M28 60H72L66 92H34Z" fill="${C.peach}" ${S}/><rect x="24" y="54" width="52" height="10" rx="4" fill="#E9A07A" ${S}/><path d="M50 54V30" ${S}/><path d="M50 40Q34 40 30 26Q46 24 50 40Z" fill="${C.sage}" ${S}/><path d="M50 34Q64 34 70 20Q54 18 50 34Z" fill="${C.sage}" ${S}/>${[0,72,144,216,288].map(a=>`<circle cx="${50+Math.cos(a*Math.PI/180)*7}" cy="${18+Math.sin(a*Math.PI/180)*7}" r="5.5" fill="${C.rose}" ${S}/>`).join('')}<circle cx="50" cy="18" r="4" fill="${C.butter}"/></svg>`,
  brushThick:`<svg viewBox="0 0 100 100"><path d="M70 10L48 52" stroke="${OL}" stroke-width="12" stroke-linecap="round"/><path d="M70 10L48 52" stroke="#D9A877" stroke-width="6" stroke-linecap="round"/><path d="M40 48L56 56Q54 80 26 88Q30 62 40 48Z" fill="${C.rose}" ${S}/></svg>`,
  brushThin:`<svg viewBox="0 0 100 100"><path d="M74 10L52 56" stroke="${OL}" stroke-width="8" stroke-linecap="round"/><path d="M74 10L52 56" stroke="#D9A877" stroke-width="3" stroke-linecap="round"/><path d="M48 54L56 58Q54 76 38 86Q40 66 48 54Z" fill="${C.rose}" ${S}/></svg>`,
  paper:`<svg viewBox="0 0 100 100"><path d="M22 10H62L80 28V90H22Z" fill="#fff" ${S}/><path d="M62 10V28H80" fill="#F2EAE0" ${S}/><path d="M34 44H66M34 58H66M34 72H54" stroke="${C.sky}" stroke-width="4" stroke-linecap="round"/><path d="M78 62l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="${C.butter}" ${S}/></svg>`,
  replay:`<svg viewBox="0 0 100 100"><path d="M78 50A28 28 0 1 1 64 26" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M78 50A28 28 0 1 1 64 26" fill="none" stroke="${C.sky}" stroke-width="6" stroke-linecap="round"/><path d="M56 12L76 24L58 38Z" fill="${C.sky}" ${S}/></svg>`,
  ear:`<svg viewBox="0 0 100 100"><path d="M34 46Q34 14 58 14Q82 14 82 40Q82 56 70 64Q62 70 62 80Q60 92 48 90Q40 88 40 80" fill="#FFE4D0" ${S}/><path d="M48 44Q48 30 60 30Q70 30 70 42Q70 50 62 52" fill="none" ${S}/><path d="M20 34Q12 46 20 58M10 28Q0 46 10 64" fill="none" ${S}/></svg>`,
  sun:`<svg viewBox="0 0 100 100">${[0,45,90,135,180,225,270,315].map(a=>`<path d="M${50+Math.cos(a*Math.PI/180)*30} ${50+Math.sin(a*Math.PI/180)*30}L${50+Math.cos(a*Math.PI/180)*42} ${50+Math.sin(a*Math.PI/180)*42}" ${S}/>`).join('')}<circle cx="50" cy="50" r="22" fill="${C.butter}" ${S}/><circle cx="43" cy="47" r="2.6" fill="${OL}"/><circle cx="57" cy="47" r="2.6" fill="${OL}"/><path d="M44 56Q50 61 56 56" fill="none" ${S}/></svg>`,
  wind:`<svg viewBox="0 0 100 100"><path d="M10 40H62Q76 40 76 28Q76 18 66 18Q58 18 58 26" fill="none" stroke="${C.sky}" stroke-width="8" stroke-linecap="round"/><path d="M10 60H74Q88 60 88 72Q88 82 78 82Q70 82 70 74" fill="none" stroke="${C.sky}" stroke-width="8" stroke-linecap="round"/><path d="M10 40H62Q76 40 76 28Q76 18 66 18Q58 18 58 26M10 60H74Q88 60 88 72Q88 82 78 82Q70 82 70 74" fill="none" stroke="${OL}" stroke-width="2" opacity=".5"/></svg>`,
  candle:`<svg viewBox="0 0 100 100"><rect x="38" y="40" width="24" height="50" rx="6" fill="${C.rose}" ${S}/><path d="M38 54L62 46M38 70L62 62M38 86L62 78" stroke="#fff" stroke-width="4" opacity=".7"/><path d="M50 40V32" ${S}/><path d="M50 8Q62 20 56 28Q52 34 50 34Q42 32 44 24Q46 16 50 8Z" fill="${C.butter}" ${S}/></svg>`,
  gift:`<svg viewBox="0 0 100 100"><rect x="16" y="40" width="68" height="48" rx="8" fill="${C.rose}" ${S}/><rect x="10" y="28" width="80" height="16" rx="6" fill="#F3B7C2" ${S}/><path d="M50 28V88" stroke="${C.butter}" stroke-width="10"/><path d="M50 28Q30 6 26 20Q24 30 50 28Q70 6 74 20Q76 30 50 28Z" fill="${C.butter}" ${S}/></svg>`,
  xmtree:()=>A&&A.XMAS?A.XMAS.icon():'',
  maze:`<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="12" fill="${C.sage}" ${S}/><path d="M26 10V58H48M74 90V44H50V26" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="80" r="6" fill="${C.rose}" ${S}/><path d="M80 14l2 5 5 .5-4 3.5 1 5-4-3-4 3 1-5-4-3.5 5-.5z" fill="${C.butter}" ${S}/></svg>`
};
const art=k=>{const v=I[k];return typeof v==='function'?v():(v||'')};

/* ============================== places: config home.places + catalog → screen ids ==============================
   not in config: which screen each game name in home.places / catalog opens (screen ids are code) */
const SCREEN_OF={pizza:'pizza',bread:'bakery',cake:'bakery',bakery:'bakery',chef:'restaurant',restaurant:'restaurant',icecream:'icecream2',dishes:'dishes2',
  petsalon:'petsalon',nailshop:'nailshop',dressup:'clothes',clothes:'clothes',makeup:'makeup2',coloring:'draw',drawing:'draw',
  photoCards:'words',words:'words',maze:'maze',jobs:'jobs',animals:'animals',counting:'jelly',shapes:'shapes',trace:'trace',quest:'map',explore:'explore',
  xmasHouse:'xmashouse',rhythmClap:'rhythm',music:'music',instruments:'music',songs:'videos',chores:'chores2',routine:'routine2','가족':'friends','도장':'stamps'};
/* not in config: the place screen ids (kept from the earlier building screens so old links still work) and their pictures */
const PLACE_ID={cook:'zone-cook',salon:'zone-salon',learn:'zone-school',music:'zone-music',myroom:'zone-myroom'};
const PLACE_BG={cook:'kitchen',salon:'forest',learn:'sea',music:'hill',myroom:'room'};
/* not in config: old screens that only a home mission still opens, sounds (retired into photo cards, which live in the school) */
const EXTRA_PLACE={sounds:'learn',dishes:'cook',bread:'cook',chores:'myroom',routine:'myroom',jobmatch:'learn',ice:'cook',cake:'cook',nails:'salon',dressup:'salon',makeup:'salon',jobdress:'learn',dispatch:'learn'};
const PLACES={};
Object.keys(PLACE_ID).forEach(k=>{
  const P=(HOME.places||{})[k]||{},list=[];
  /* home.places 의 '(12월에는 맨 앞)': in December that game comes first in its place */
  const add=n=>{const key=String(n||'').split('(')[0].trim(),s=SCREEN_OF[key];if(!s||list.includes(s))return;if(/12월에는 맨 앞/.test(String(n))&&new Date().getMonth()===11)list.unshift(s);else list.push(s)};
  (P.games||[]).forEach(add);(CAT[k]||[]).forEach(c=>add(c&&c.id));
  Object.keys(EXTRA_PLACE).forEach(s=>{if(EXTRA_PLACE[s]===k&&s==='sounds')list.push(s)});
  PLACES[k]={key:k,id:PLACE_ID[k],ko:P.ko||k,en:P.en||k,games:list};
});
const PLACE_OF={};
Object.keys(PLACES).forEach(k=>PLACES[k].games.forEach(s=>{if(!PLACE_OF[s])PLACE_OF[s]=k}));
Object.keys(EXTRA_PLACE).forEach(s=>{if(!PLACE_OF[s])PLACE_OF[s]=EXTRA_PLACE[s]});
/* catalog.retired: old screens that a newer game replaced. Nothing on the home screen opens them any more; going there opens the new game */
const RETIRED={map:'explore',nails:'nailshop',dressup:'clothes',jobdress:'jobs',dispatch:'jobs',makeup:'makeup2',ice:'icecream2',cake:'bakery'};
const route=id=>RETIRED[id]&&document.getElementById(RETIRED[id])?RETIRED[id]:id;
const backOf=id=>{if(/^zone-/.test(id))return 'home';const k=PLACE_OF[id];return k?PLACE_ID[k]:'home'};

/* ============================== styles ============================== */
const css=`
.sh-head{flex:none;height:${HEAD_PX}px;display:flex;align-items:center;gap:8px;position:relative}
.sh-head .sh-back{width:${BACK_PX}px;height:${BACK_PX}px;padding:10px;flex:none;border-radius:50%}
.sh-head .sh-back svg{width:100%;height:100%;display:block}
.sh-strip{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px}
.sh-strip.sh-dots i{width:16px;height:16px;border-radius:50%;background:var(--hole,#EADFD3);border:3px solid var(--paper);display:block;flex:none;transition:width .3s,height .3s}
.sh-strip.sh-dots i.on{width:26px;height:26px;background:${C.rose}}
.sh-strip.sh-dots i.done{background:${C.sage}}
.sh-right{flex:none;display:flex;align-items:center;gap:6px}
.sh-right:empty{display:none}
.sh-head .sh-right .round{width:${BACK_PX}px;height:${BACK_PX}px;padding:11px}
.sh-head .sh-right .round svg{width:100%;height:100%;display:block}
.sh-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;box-shadow:0 6px 14px rgba(91,74,66,.12)}
.sh-tray{flex:none;height:${Math.round((TRAY_R[0]+TRAY_R[1])/2*100)}%;position:relative;display:flex;align-items:center;justify-content:center;gap:10px}
/* tray parts */
.sh-cards{display:flex;align-items:center;justify-content:center;gap:12px;width:100%}
.sh-card{flex:0 1 150px;min-width:${CARD_PX}px;aspect-ratio:1;border:0;border-radius:24px;background:var(--paper);padding:12px;display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 -4px 0 rgba(91,74,66,.08),0 5px 0 rgba(91,74,66,.14),0 8px 14px rgba(91,74,66,.1);animation:shcard .35s ease-out backwards}
.sh-card:nth-child(2){animation-delay:.06s}.sh-card:nth-child(3){animation-delay:.12s}
.sh-card svg{width:100%;height:auto;aspect-ratio:1;display:block;overflow:visible}
.sh-card:active{transform:translateY(4px) scale(.97)}
.sh-cards .sh-next{flex:none;width:${CARD_PX}px;height:${CARD_PX}px;border:0;border-radius:50%;background:var(--paper);padding:18px;box-shadow:0 5px 0 rgba(91,74,66,.14)}
.sh-cards .sh-next svg{width:100%;height:100%;display:block}
@keyframes shcard{from{transform:translateY(22px);opacity:0}}
.sh-tool{flex:none;width:${TOOL_PX}px;height:${TOOL_PX}px;display:grid;place-items:center;pointer-events:none}
.sh-tool svg{width:100%;height:100%;display:block;overflow:visible}
.sh-finish{position:absolute;right:4px;bottom:6px;width:${Math.max(CARD_PX,96)}px;height:${Math.max(CARD_PX,96)}px;border:0;border-radius:50%;background:var(--paper);padding:20px;z-index:5;
  box-shadow:inset 0 -4px 0 rgba(91,74,66,.08),0 5px 0 rgba(91,74,66,.16),0 8px 14px rgba(91,74,66,.12)}
.sh-finish svg{width:100%;height:100%;display:block}
.sh-finish:active{transform:translateY(4px)}
/* start cards over an old screen (instead of kind tabs) */
.sh-start{position:absolute;left:16px;right:16px;bottom:10px;top:${10+HEAD_PX+8}px;z-index:40;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:0 8px;border-radius:30px;overflow:hidden}
.sh-start>.sh-bg{position:absolute;inset:0;pointer-events:none;opacity:.9}
.sh-start>.sh-bg svg{width:100%;height:100%;display:block}
.sh-start .sh-cards{position:relative}
.sh-start .sh-card{flex:1 1 0;max-width:170px}
/* place screens */
.sh-place{background:#EDE3D6}
.sh-place>.sh-bg{position:absolute;inset:0;pointer-events:none}
.sh-place>.sh-bg svg{width:100%;height:100%;display:block}
.sh-tiles{position:absolute;left:8px;right:8px;top:10px;bottom:${Math.max(CARD_PX,96)+22}px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;align-content:center}
.sh-tiles .tile{aspect-ratio:auto;width:100%;height:100%;min-width:${TILE_PX}px;min-height:${TILE_PX}px;max-height:250px;align-self:center;padding:6px;gap:4px;border-radius:26px}
.sh-tiles .tile .ic{font-size:clamp(58px,17vw,86px);display:grid;place-items:center}
.sh-tiles .tile .ic>svg{width:1.45em;height:1.45em;display:block;overflow:visible}
.sh-tiles .tile .ic{max-height:72%;max-width:92%}
.sh-tiles .tile .ic.jb-ic>svg,.sh-tiles .tile .ic.cl-ic>svg{width:1.3em;height:1.6em}
.sh-tiles .tile b{font-size:clamp(13px,3.6vw,16px);opacity:.92}
.sh-tiles .tile[hidden]{display:none}
.sh-place .sh-finish{right:12px;bottom:12px}
/* old big text buttons (play2.js bigBtn) are picture buttons now */
.btn.sh-picbtn{width:${CARD_PX}px;height:${CARD_PX}px;padding:20px;border-radius:50%;background:var(--paper);box-shadow:inset 0 -4px 0 rgba(91,74,66,.08),0 5px 0 rgba(91,74,66,.16)}
.btn.sh-picbtn svg{width:100%;height:100%;display:block}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ============================== place backgrounds: paper layers, no outline, one soft shadow each ============================== */
let _bg=0;
function placeBG(kind){
  const id='shbg'+(++_bg),L=d=>`<g filter="url(#${id})">${d}</g>`;
  const cloud=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="#FBF9F4"><circle cx="-8" cy="0" r="7"/><circle cx="3" cy="-4" r="9"/><circle cx="13" cy="0" r="7"/><rect x="-15" y="0" width="34" height="6" rx="3"/></g>`;
  const tree=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2.5" y="-4" width="5" height="14" rx="2" fill="#B89878"/><path d="M0-30L14-4H-14Z" fill="${c||'#8DB585'}"/><path d="M0-40L10-20H-10Z" fill="${c||'#8DB585'}" opacity=".9"/></g>`;
  const flower=(x,y,c)=>`<g transform="translate(${x} ${y})"><rect x="-.8" y="0" width="1.6" height="7" fill="#7FA978"/>${[0,72,144,216,288].map(a=>`<circle cx="${(Math.cos(a*Math.PI/180)*3).toFixed(1)}" cy="${(Math.sin(a*Math.PI/180)*3).toFixed(1)}" r="2.6" fill="${c}"/>`).join('')}<circle r="1.8" fill="#F4D58A"/></g>`;
  let s='';
  if(kind==='kitchen'){
    s=`<rect width="100" height="160" fill="#F3E6DA"/>`+L(`<rect x="0" y="0" width="100" height="104" fill="#EEDCCB"/><rect x="12" y="12" width="30" height="24" rx="4" fill="#DDEBF0"/><rect x="58" y="10" width="32" height="12" rx="3" fill="#E3CDB6"/>`)
      +L(`<rect x="0" y="104" width="100" height="56" fill="#E2C9AE"/><rect x="0" y="100" width="100" height="8" rx="2" fill="#EFE2D0"/>`)
      +L(`<circle cx="22" cy="134" r="9" fill="#E3A79A"/><rect x="62" y="124" width="24" height="16" rx="5" fill="#F6EEE2"/><path d="M66 124Q74 112 82 124" fill="none" stroke="#F6EEE2" stroke-width="3"/>`);
  }else if(kind==='forest'){
    s=`<rect width="100" height="160" fill="#DCEBF0"/>`+L(cloud(24,22,1)+cloud(74,14,.8))
      +L(`<path d="M0 70Q26 54 52 64T100 58V160H0Z" fill="#B9D3B0"/>`)
      +L(`<path d="M0 96Q30 82 60 92T100 88V160H0Z" fill="#9CC293"/>`+tree(14,92,1)+tree(88,88,1.1,'#7FA978'))
      +L(`<path d="M0 128Q34 118 66 126T100 124V160H0Z" fill="#86B27E"/>`+flower(30,134,'#E9B7A6')+flower(46,140,'#EBC9A0')+flower(76,138,'#E9B7A6'));
  }else if(kind==='sea'){
    s=`<rect width="100" height="160" fill="#DDEBF2"/>`+L(cloud(70,20,.9)+`<circle cx="22" cy="22" r="9" fill="#F2DDA0"/>`)
      +L(`<path d="M0 72Q26 66 50 72T100 70V160H0Z" fill="#A9CBDA"/>`)
      +L(`<path d="M0 96Q22 90 44 96T88 94T100 96V160H0Z" fill="#8EBBCF"/><path d="M66 84L76 84L71 70Z" fill="#FBF9F4"/><path d="M62 86H82L78 92H66Z" fill="#D9928A"/>`)
      +L(`<path d="M0 126Q34 116 66 124T100 120V160H0Z" fill="#EADCC2"/><path d="M18 134l5-9 5 9z" fill="#E3B48A"/><circle cx="82" cy="138" r="4" fill="#E8C7B8"/><path d="M52 146q5-8 10 0q-5 4-10 0z" fill="#E9B7A6"/>`);
  }else if(kind==='hill'){
    s=`<rect width="100" height="160" fill="#E4E4F2"/>`+L(cloud(30,18,.9)+cloud(80,28,.7))
      +L(`<path d="M0 86Q50 40 100 86V160H0Z" fill="#C9D8B4"/>`)
      +L(`<path d="M30 90Q50 70 70 90V100H30Z" fill="#E7C9A8"/><path d="M28 90H72L66 84H34Z" fill="#D9928A"/>`)
      +L(`<path d="M0 118Q30 104 62 114T100 110V160H0Z" fill="#A9C79A"/>`+flower(16,124,'#C3B4E6')+flower(84,120,'#E9B7A6'))
      +L(`<g fill="#B6A5DA"><path d="M14 52V40L22 38V50"/><ellipse cx="12" cy="52" rx="3" ry="2.2"/><ellipse cx="20" cy="50" rx="3" ry="2.2"/><path d="M84 46V34"/><ellipse cx="82" cy="46" rx="3" ry="2.2"/></g><path d="M84 34V46M14 40V52M22 38V50" stroke="#B6A5DA" stroke-width="1.4"/>`);
  }else{ // room
    s=`<rect width="100" height="160" fill="#F3E9E4"/>`+L(`<rect x="0" y="0" width="100" height="108" fill="#EFE0EA"/><rect x="58" y="14" width="30" height="30" rx="5" fill="#DDEBF0"/><path d="M73 14V44M58 29H88" stroke="#F3E9E4" stroke-width="2"/><rect x="12" y="22" width="20" height="16" rx="3" fill="#F2DDA0"/>`)
      +L(`<rect x="0" y="108" width="100" height="52" fill="#E3CDB6"/>`)
      +L(`<ellipse cx="50" cy="138" rx="36" ry="10" fill="#E9B7A6" opacity=".85"/><rect x="8" y="88" width="22" height="22" rx="4" fill="#C3B4E6"/><circle cx="86" cy="100" r="8" fill="#A9CFA0"/>`);
  }
  return `<svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="#5B3A29" flood-opacity=".18"/></filter></defs>${s}</svg>`;
}

/* ============================== the registry ============================== */
const REG={};
function register(id,o){REG[id]=Object.assign({id,place:PLACE_OF[id]||null},REG[id]||{},o||{})}
const has=id=>!!REG[id];

/* ============================== Shell.screen: header + stage + tray ============================== */
function backBtn(o){
  const b=document.createElement('button');b.type='button';b.className='round sh-back'+(o.cls?' '+o.cls:'');
  if(o.id)b.id=o.id;if(o.go)b.dataset.go=o.go;b.setAttribute('aria-label',o.label||'뒤로');b.innerHTML=I.back;if(o.hidden)b.hidden=true;return b;
}
function head(id,o){
  const h=document.createElement('div');h.className='bar sh-head'+(o.headClass?' '+o.headClass:'');
  const back=backBtn({id:o.backId,cls:o.backClass,go:o.backGo||backOf(id),label:o.backLabel});h.appendChild(back);
  (o.backs||[]).forEach(x=>h.appendChild(backBtn({id:x.id,cls:x.cls||o.backClass,label:x.label,hidden:x.hidden!==false})));
  const strip=document.createElement('div');strip.className='sh-strip'+(o.stripClass?' '+o.stripClass:'');if(o.stripId)strip.id=o.stripId;
  if(o.steps)strip.innerHTML=o.steps;h.appendChild(strip);
  if(o.after)h.insertAdjacentHTML('beforeend',o.after);
  const right=document.createElement('div');right.className='sh-right';if(o.right)right.innerHTML=o.right;h.appendChild(right);
  return{h,back,strip,right};
}
function screen(id,o={}){
  const sec=document.createElement('section');sec.id=id;sec.className='screen sh-screen'+(o.cls?' '+o.cls:'');sec.hidden=true;
  if(o.title){sec.setAttribute('aria-label',o.title);if(M.NAMES)M.NAMES[id]=o.title}
  if(o.place&&!PLACE_OF[id])PLACE_OF[id]=o.place;
  if(o.pre)sec.insertAdjacentHTML('beforeend',o.pre);
  const hd=head(id,o);sec.appendChild(hd.h);
  let stage=null,tray=null;
  if(o.body!=null)sec.insertAdjacentHTML('beforeend',o.body);
  else{
    stage=document.createElement('div');stage.className='sh-stage'+(o.stageClass?' '+o.stageClass:'');if(o.stageId)stage.id=o.stageId;if(o.stage)stage.innerHTML=o.stage;sec.appendChild(stage);
    if(o.tray!==false){tray=document.createElement('div');tray.className='sh-tray'+(o.trayClass?' '+o.trayClass:'');if(o.trayId)tray.id=o.trayId;if(typeof o.tray==='string')tray.innerHTML=o.tray;sec.appendChild(tray)}
  }
  (o.parent||document.getElementById('app')).appendChild(sec);
  register(id,{title:o.title||'',kind:o.kind||'game'});
  return{sec,head:hd.h,back:hd.back,strip:hd.strip,right:hd.right,stage,tray};
}

/* ============================== Shell.adopt: an old screen keeps its content, gets the same header ============================== */
const RIGHT_ICON={editHold:I.pencil,musicListen:I.play};
function adopt(id,o={}){
  const sec=document.getElementById(id);if(!sec||has(id))return null;
  const bar=sec.querySelector(':scope > .bar');if(!bar)return null;
  const h2=bar.querySelector(':scope > h2'),title=h2?h2.textContent.trim():'';
  if(title){sec.setAttribute('aria-label',title);if(M.NAMES&&!M.NAMES[id])M.NAMES[id]=title}
  const kids=[...bar.children];
  const old=kids.find(e=>e.matches('button.round'));
  const back=old||backBtn({});
  back.className='round sh-back';back.innerHTML=I.back;back.setAttribute('aria-label','뒤로');
  if(back.dataset.go||!old)back.dataset.go=o.back||backOf(id);
  const strip=document.createElement('div');strip.className='sh-strip';
  const right=document.createElement('div');right.className='sh-right';
  kids.forEach(e=>{if(e===old)return;
    if(e.matches('h1,h2,.seg')){e.remove();return}  // the title, text toggles and level tabs leave the child screen (shell.banned)
    if(e.matches('button.round')){if(RIGHT_ICON[e.id])e.innerHTML=RIGHT_ICON[e.id];right.appendChild(e);return}
    strip.appendChild(e)});                         // progress dots, the routine clock: the picture strip in the middle
  bar.className='bar sh-head';bar.innerHTML='';bar.append(back,strip,right);
  register(id,{title,kind:'old',adopted:true});
  return{sec,head:bar,back,strip,right};
}

/* ============================== tray parts ============================== */
function el(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild}
/* cards: up to MAX_CARDS picture cards (CARD_PX+). More → an arrow picture at the right end shows the next ones; the arrow counts as one of the
   MAX_CARDS things to press (rules.bigAndFew: 한 화면 선택지 3개 이하), so then MAX_CARDS-1 cards show at a time. Never scrolls sideways */
function cards(items,onPick,o={}){
  const box=document.createElement('div');box.className='sh-cards'+(o.cls?' '+o.cls:'');let page=0;const max=Math.min(MAX_CARDS,o.per||MAX_CARDS),per=items.length>max?Math.max(1,max-1):max;
  function render(){
    box.innerHTML='';const pages=Math.max(1,Math.ceil(items.length/per));page%=pages;
    items.slice(page*per,page*per+per).forEach(it=>{
      const b=document.createElement('button');b.type='button';b.className='sh-card'+(it.cls?' '+it.cls:'');b.setAttribute('aria-label',it.ko||'');b.innerHTML=it.svg||'';
      if(it.v!=null)b.dataset.v=it.v;
      b.onclick=()=>{bounce(b);pop();if(it.ko)say(it.ko,it.en||'');onPick&&onPick(it,b)};box.appendChild(b)});
    if(pages>1){const n=document.createElement('button');n.type='button';n.className='sh-next';n.setAttribute('aria-label','다음 카드');n.innerHTML=I.next;
      n.onclick=()=>{pop();page++;render()};box.appendChild(n)}
  }
  render();box.refresh=render;return box;
}
/* the tool of this step, big (touch.tool: 도구 칸의 도구 그림도 150px 이상) */
function tool(svg,o={}){const d=document.createElement('div');d.className='sh-tool'+(o.cls?' '+o.cls:'');d.innerHTML=svg||'';return d}
/* finish / next picture button: always bottom right */
function finish(svg,fn,o={}){
  const b=document.createElement('button');b.type='button';b.className='sh-finish'+(o.cls?' '+o.cls:'');b.setAttribute('aria-label',o.ko||'끝');b.innerHTML=svg||I.next;
  b.onclick=()=>{bounce(b);pop();if(o.ko)say(o.ko,o.en||'');fn&&fn()};return b;
}
/* start cards over a screen: the kind is picked with picture cards when the play starts (shell.insteadOfTabs) */
function start(sec,items,onPick,o={}){
  const host=typeof sec==='string'?document.getElementById(sec):sec;if(!host)return{close(){}};
  host.querySelectorAll(':scope > .sh-start').forEach(x=>x.remove());
  const ov=document.createElement('div');ov.className='sh-start';
  const pk=PLACE_OF[host.id];if(pk&&PLACE_BG[pk])ov.innerHTML=`<div class="sh-bg">${placeBG(PLACE_BG[pk])}</div>`;
  const close=()=>ov.remove();
  ov.appendChild(cards(items,(it,b)=>{setTimeout(()=>{close();onPick&&onPick(it)},260)},{}));
  host.appendChild(ov);
  if(o.ko)say(o.ko,o.en||'');
  return{close,el:ov};
}

/* ============================== Shell.place: a place screen (2×2 drawn tiles, big next-page arrow) ============================== */
const TILE_ART={animals:'dog',trace:'trace',shapes:'shapes',jelly:'jelly',music:'keys',rhythm:'drum',draw:'palette',words:'apple',sounds:'sounds',videos:'tv',
  explore:'find',map:'castle',friends:'friends',stamps:'stamp',maze:'maze',xmashouse:'xmtree'};
const TILE_NAME={explore:['탐험대','Explorers'],map:['공주 모험','Princess adventure'],friends:['우리 가족','Our family'],stamps:['칭찬 도장','Praise stamps'],sounds:['소리 놀이','Sounds'],videos:['노래 영상','Songs'],xmashouse:['크리스마스 집','Christmas house']};
const TILE_COL={map:'var(--berry)',friends:'var(--peach)',stamps:'var(--banana)',xmashouse:'var(--lime)'};
const EMO=/\p{Extended_Pictographic}/u;
function tileFor(gid){
  let t=document.querySelector(`#home .tile[data-go="${gid}"]`);
  if(!t){const nm=TILE_NAME[gid]||[M.NAMES&&M.NAMES[gid]||gid,''];
    t=el(`<button class="tile" data-go="${gid}" data-en="${nm[1]}" style="--c:${TILE_COL[gid]||'var(--soda)'}"><span class="ic"></span><b>${nm[0]}</b></button>`)}
  const ic=t.querySelector('.ic');
  if(ic&&(!ic.querySelector('svg')||EMO.test(ic.textContent))&&TILE_ART[gid])ic.innerHTML=art(TILE_ART[gid]);
  if(ic){const s=ic.querySelector(':scope > svg');if(s){s.style.removeProperty('width');s.style.removeProperty('height')}}
  return t;
}
function place(key,o={}){
  const P=PLACES[key];if(!P)return null;const id=P.id;
  const games=(o.games||P.games).filter(g=>document.getElementById(g)&&!RETIRED[g]);
  const pages=Math.max(1,Math.ceil(games.length/PER_PAGE));
  const S2=screen(id,{title:P.ko,kind:'place',backGo:'home',stageClass:'sh-place',stageId:id+'Stage',tray:false,
    steps:pages>1?Array.from({length:pages},(_,i)=>`<i class="${i?'':'on'}"></i>`).join(''):'',stripClass:'sh-dots'});
  register(id,{kind:'place',place:key});
  const stage=S2.stage;stage.innerHTML=`<div class="sh-bg">${placeBG(PLACE_BG[key])}</div><div class="sh-tiles"></div>`;
  const grid=stage.querySelector('.sh-tiles');
  games.forEach(g=>grid.appendChild(tileFor(g)));
  let page=0;
  function show(){
    [...grid.children].forEach((t,i)=>{t.hidden=Math.floor(i/PER_PAGE)!==page});
    S2.strip.querySelectorAll('i').forEach((d,i)=>d.classList.toggle('on',i===page));
  }
  if(pages>1)stage.appendChild(finish(I.next,()=>{page=(page+1)%pages;show()},{cls:'sh-pagearrow'}));
  show();
  M.games[id]={enter:()=>{page=0;show();say(`${P.ko}에 왔어요! 무엇을 할까?`,`Welcome to the ${P.en}!`)}};
  if(M.NAMES)M.NAMES[id]=P.ko;
  return S2;
}

/* ============================== old screens: same header now ============================== */
document.querySelectorAll('#app > .screen').forEach(s=>{if(s.id!=='home')adopt(s.id)});


/* ============================== P12-나 flow: step strip, the basket at the top, the reward flying into it ==============================
   flow.stepStrip: "화면 위에 이번 손님의 과정 그림 2~4개(작은 동그라미). 지금 과정만 크게, 끝난 과정은 별. 누르는 것이 아니라 보여 주기만"
   flow.reward:    "손님이 나갈 때 하트(또는 당근) 1개를 건네줌 → 화면 위 바구니로(P9의 당근 바구니와 연결)" — the same basket as home (ML.Room) */
const FLOW=CF.flow||{};
const STRIP_MAX=Math.max(2,num(FLOW.stepStrip,1,4));
const STAR_SM=`<svg viewBox="0 0 20 20"><path d="M10 1.6l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.6l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z" fill="#F0D58A" stroke="${OL}" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
stEl.textContent+=`
.sh-strip.sh-steps{gap:6px;pointer-events:none}
.sh-strip.sh-steps>span{flex:none;width:38px;height:38px;border-radius:50%;background:var(--paper);display:grid;place-items:center;position:relative;opacity:.6;
  transition:width .35s ease-out,height .35s ease-out,opacity .35s;box-shadow:0 2px 6px rgba(91,74,66,.12)}
.sh-strip.sh-steps>span>svg{width:74%;height:74%;display:block;overflow:visible}
.sh-strip.sh-steps>span.on{width:56px;height:56px;opacity:1;box-shadow:0 0 0 4px color-mix(in srgb,${C.rose} 55%,#fff),0 2px 6px rgba(91,74,66,.14)}
.sh-strip.sh-steps>span.done{opacity:.92}
.sh-strip.sh-steps>span .sh-st{position:absolute;right:-5px;top:-5px;width:20px;height:20px}
.sh-strip.sh-steps>span .sh-st svg{width:100%;height:100%;display:block}
.sh-strip .sh-basket{flex:none;width:66px;height:62px;display:block;pointer-events:none}
.sh-strip .sh-basket svg{width:100%;height:100%;display:block;overflow:visible}
.sh-strip .sh-basket.got{animation:shgot .6s cubic-bezier(.3,1.5,.5,1)}
@keyframes shgot{0%{transform:scale(1)}35%{transform:scale(1.14,.9)}70%{transform:scale(.96,1.05)}100%{transform:scale(1)}}
.sh-fly{position:fixed;z-index:80;width:34px;height:68px;margin:-34px 0 0 -17px;pointer-events:none}
.sh-fly svg{width:100%;height:100%;display:block;overflow:visible}
`;
/* the steps of this customer: icons (svg strings), at = index of the current step (>= length: all done).
   More than STRIP_MAX steps: a window of STRIP_MAX around the current one. Returns what is shown (for tests). */
function steps(strip,icons,at){
  if(!strip)return null;strip.classList.remove('sh-dots');icons=icons||[];
  if(!icons.length){strip.classList.remove('sh-steps');strip.innerHTML='';strip.dataset.n='0';strip.dataset.at='';return{n:0,shown:0,at:-1}}
  strip.classList.add('sh-steps');const n=icons.length,a=Math.max(0,at|0);
  const from=n<=STRIP_MAX?0:Math.max(0,Math.min(n-STRIP_MAX,a-1)),to=Math.min(n,from+STRIP_MAX);
  let h='';for(let i=from;i<to;i++)h+=`<span class="${i<a?'done':i===a?'on':''}" data-i="${i}">${icons[i]||''}${i<a?`<i class="sh-st">${STAR_SM}</i>`:''}</span>`;
  strip.innerHTML=h;strip.dataset.n=String(n);strip.dataset.at=String(a);
  return{n,shown:to-from,at:a};
}
/* the carrot basket (the same one as on the home screen and in My Room) in the header strip; n defaults to the saved count */
function basket(strip,n){
  if(!strip)return null;const R=M.Room;strip.classList.remove('sh-steps','sh-dots');
  strip.innerHTML=R?`<span class="sh-basket" aria-label="당근 바구니">${R.basketSVG(n==null?R.carrots():n)}</span>`:'';strip.dataset.n='0';strip.dataset.at='';
  return strip.querySelector('.sh-basket');
}
/* reward: one carrot flies from (x,y) (client px) into the basket in the strip (0.9 s); the basket shows one less until it lands.
   The carrot itself was counted when the round ended (ML.Progress.clear → 'ml-round' → ML.Room), so this only shows it. */
function reward(strip,x,y,then){
  const R=M.Room;let el=strip&&strip.querySelector('.sh-basket');
  if(!R){then&&then();return()=>{}}
  const have=R.carrots();if(!el)el=basket(strip,Math.max(0,have-1));else el.innerHTML=R.basketSVG(Math.max(0,have-1));
  const br=el.getBoundingClientRect(),tx=br.left+br.width/2,ty=br.top+br.height*.35;
  const f=document.createElement('div');f.className='sh-fly';f.innerHTML=R.carrotSVG();f.style.left=x+'px';f.style.top=y+'px';document.body.appendChild(f);
  let done=false,t=0;
  const land=()=>{if(done)return;done=true;clearTimeout(t);f.remove();const e=strip&&strip.querySelector('.sh-basket');
    if(e){e.innerHTML=R.basketSVG(R.carrots());e.classList.remove('got');void e.offsetWidth;e.classList.add('got')}
    try{M.tone(784,.14,'sine',.08);M.tone(1046,.2,'sine',.07,.12)}catch(_){}then&&then()};
  try{const a=f.animate([{transform:'translate(0,0) rotate(0) scale(1)'},{transform:`translate(${(tx-x)*.5}px,${(ty-y)*.5-70}px) rotate(-30deg) scale(1.1)`,offset:.5},
    {transform:`translate(${tx-x}px,${ty-y}px) rotate(-10deg) scale(.7)`}],{duration:900,easing:'ease-in-out',fill:'forwards'});a.onfinish=land}catch(_){}
  t=setTimeout(land,1300);   // lands even if the animation never runs (hidden tab)
  return()=>{if(done)return;done=true;clearTimeout(t);f.remove()};
}

M.Shell={steps,basket,reward,STRIP_MAX,screen,adopt,cards,tool,finish,start,place,has,route,backOf,art,ICON:I,placeBG,
  get places(){return PLACES},get placeOf(){return Object.assign({},PLACE_OF)},get retired(){return Object.assign({},RETIRED)},
  get screens(){return Object.keys(REG).map(k=>Object.assign({},REG[k]))},
  sizes:{head:HEAD_PX,back:BACK_PX,card:CARD_PX,tool:TOOL_PX,tile:TILE_PX,perPage:PER_PAGE,maxCards:MAX_CARDS}};
})();
