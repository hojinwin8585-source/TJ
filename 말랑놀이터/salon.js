/* 동물 미용실 v2 — 가게 앞에서 손님을 골라 데려오고, 손가락을 따라오는 도구로 씻기고, 마음대로 꾸며 줘요 (만 2세 기준)
   동작은 콕, 쓱쓱, 카드 고르기(동물에게 끌어다 놓아도 됨, 자리는 대충이어도 붙음). 꾸미기는 아이가 거울을 눌러야 끝나요.
   숫자는 MLCFG.games.petsalon (lobby, needs, tools, reactions, dressing, progressBar), touch, calm, sound 에서 읽습니다. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!P||!A||!M.Guide||!P.makeTool)return;
const {say,sfx,tone,pick,rand,shuffle,cap,games,actx,store,batchim}=M;
const {life,noise,SFX}=P;
const id='petsalon',L=life(id),OL=A.OL,S=`stroke="${OL}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const cur=()=>M.current();
const CF=M.CFG,CALM=CF.calm,PAL=CALM.palette,VO=CF.voice,BLOOM=(CALM.colorPolicy||{}).bloomMs||600;
const PS=(CF.games||{}).petsalon||{},NEEDS=PS.needs||[],TOOLS=PS.tools||{},COV=TOOLS.coverage||{},DRS=PS.dressing||{},LOB=PS.lobby||{};
const WAITING=LOB.waiting||3,IDLE_HINT=DRS.idleHintMs||30000,MIRROR_AFTER=8000;
const LOG=[];
const praise=(ko,en)=>{const p=M.nextPraise();return[ko?ko+' '+p[0]:p[0],en?en+' '+p[1]:p[1]]};
const word=k=>{const w=VO.actionWords[k];if(w)say(w.ko,w.en)};
/* 2-가: 만든 도구는 거품·헹굼·말림. 단계표(levels)는 2-나에서 붙이므로, 지금은 from 2 까지의 요구(muddy, leaves, party)가 나옴 */
const STEPS_READY=['foam','rinse','dry'],NEED_FROM_MAX=2;
const NEED_POOL=NEEDS.filter(n=>(n.from||1)<=NEED_FROM_MAX&&(n.steps||[]).every(s=>STEPS_READY.includes(s)));
const KINDS=VO.animalNames;   // [{id,ko,en,name}]
const kindOf=k=>KINDS.find(a=>a.id===k)||{id:k,ko:'친구',en:'friend',name:'친구'};
const ya=w=>w+(batchim(w)?'아':'야'),iya=w=>w+(batchim(w)?'이야':'야');
const LINE={
  lobby:['누구를 데려올까? 친구를 콕 눌러 봐!','Who comes in next? Tap a friend!'],
  comeIn:a=>[`${ya(a.ko)}, 들어와!`,`Come in, ${a.en}!`],
  muddy:n=>[`안녕! 나는 ${iya(n)}. 진흙에서 놀았어. 깨끗하게 씻겨 줄래?`,`Hi! I'm ${n}. I played in the mud. Can you wash me?`],
  leaves:n=>[`안녕! 나는 ${iya(n)}. 나뭇잎이 잔뜩 붙었어. 씻고 말려 줄래?`,`Hi! I'm ${n}. Leaves all over me! Can you wash and dry me?`],
  foam:['손가락으로 쓱쓱! 거품을 내 줘!','Rub rub to make bubbles!'],
  rinse:['손가락을 대면 샤워기가 따라가요. 거품을 씻어 줘!','The shower follows your finger. Wash the bubbles away!'],
  dry:['손가락을 대면 드라이기가 따라가요. 보송보송 말려 줘!','The dryer follows your finger. Blow dry!'],
  dress:['머리나 목이나 얼굴을 콕 눌러 봐! 예쁘게 꾸며 줘!','Tap the head, neck or face to dress up!'],
  tickle:['히히, 간지러워!','Hee hee, that tickles!'],
  sneeze:['에취!','Achoo!'],
  shake:['부르르!','Shake shake!'],
  mirror:['다 꾸몄으면 거울을 콕!','All done? Tap the mirror!'],
  thanks:['고마워!','Thank you!']
};

/* ---------- colours: calm for choosing (hex, light), vivid for the finished result ---------- */
const COLORS=CALM.choiceColors.map(c=>[c.ko,c.en,c.hex,c.light,c.vivid]);
/* ---------- things to wear. Each is drawn around (0,0) and takes (colour, light colour) ---------- */
const WEAR={
  head:[
    {ko:'리본',en:'ribbon',d:(c,l)=>`<path d="M-6 6L-20 34L-2 26Z" fill="${l}" ${S}/><path d="M6 6L20 34L2 26Z" fill="${l}" ${S}/><path d="M0 0L-40 -24Q-50 0 -40 24Z" fill="${c}" ${S}/><path d="M0 0L40 -24Q50 0 40 24Z" fill="${c}" ${S}/><circle r="11" fill="${l}" ${S}/><path d="M-32 -12q6 -2 10 2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" fill="none"/>`},
    {ko:'왕관',en:'crown',d:(c,l)=>`<path d="M-36 20L-42 -18L-18 2L0 -30L18 2L42 -18L36 20Z" fill="#FFD23F" ${S}/><rect x="-37" y="14" width="74" height="13" rx="5" fill="#FFB800" ${S}/><circle cy="-30" r="6.5" fill="${c}" ${S}/><circle cx="-42" cy="-18" r="5.5" fill="${l}" ${S}/><circle cx="42" cy="-18" r="5.5" fill="${l}" ${S}/><circle cy="3" r="6" fill="${c}"/>`},
    {ko:'꽃',en:'flower',d:(c,l)=>`${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*Math.PI*2/5;return `<circle cx="${(22*Math.cos(a)).toFixed(1)}" cy="${(22*Math.sin(a)).toFixed(1)}" r="16" fill="${c}" ${S}/>`}).join('')}<circle r="13" fill="#FFE066" ${S}/><circle cx="-4" cy="-4" r="3.5" fill="#fff" opacity=".8"/>`},
    {ko:'고깔모자',en:'party hat',d:(c,l)=>`<path d="M0 -44L30 24H-30Z" fill="${c}" ${S}/><path d="M-13 -14L17 -6M-21 4L25 14" stroke="${l}" stroke-width="7" stroke-linecap="round"/><circle cy="-46" r="10" fill="${l}" ${S}/><path d="M-34 24Q0 36 34 24" stroke="${OL}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M-34 24Q0 36 34 24" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>`},
    {ko:'별 머리핀',en:'star clip',d:(c,l)=>A.star(0,0,36,c,S)+`<circle cx="-10" cy="-8" r="4" fill="#fff" opacity=".8"/>`},
    {ko:'하트 머리핀',en:'heart clip',d:(c,l)=>`<path d="M0 30C-44 0 -38 -34 -18 -34C-8 -34 -2 -28 0 -20C2 -28 8 -34 18 -34C38 -34 44 0 0 30Z" fill="${c}" ${S}/><ellipse cx="-16" cy="-18" rx="7" ry="4.5" fill="#fff" opacity=".7" transform="rotate(-30 -16 -18)"/>`}
  ],
  neck:[
    {ko:'나비넥타이',en:'bow tie',d:(c,l)=>`<path d="M0 0L-34 -18Q-40 0 -34 18Z" fill="${c}" ${S}/><path d="M0 0L34 -18Q40 0 34 18Z" fill="${c}" ${S}/><rect x="-8" y="-9" width="16" height="18" rx="6" fill="${l}" ${S}/>`},
    {ko:'목도리',en:'scarf',d:(c,l)=>`<path d="M12 6L26 44L8 46L2 12Z" fill="${c}" ${S}/><path d="M-48 -10Q0 14 48 -10L46 8Q0 32 -46 8Z" fill="${c}" ${S}/><path d="M-30 2l4 12M-8 8l2 12M14 8l-2 12M34 0l-4 12" stroke="${l}" stroke-width="5" stroke-linecap="round"/>`},
    {ko:'목걸이',en:'necklace',d:(c,l)=>`${[-40,-28,-15,0,15,28,40].map((x,i)=>`<circle cx="${x}" cy="${(-6+14*(1-Math.pow(x/40,2))).toFixed(1)}" r="7" fill="${i%2?l:c}" ${S}/>`).join('')}<path d="M0 34C-18 22 -16 8 -8 8C-4 8 -1 11 0 14C1 11 4 8 8 8C16 8 18 22 0 34Z" fill="${c}" ${S}/>`},
    {ko:'방울 목걸이',en:'bell collar',d:(c,l)=>`<path d="M-46 -8Q0 14 46 -8L45 4Q0 26 -45 4Z" fill="${c}" ${S}/><circle cy="20" r="13" fill="#FFD23F" ${S}/><path d="M-8 22h16M0 22v8" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><circle cx="-4" cy="14" r="3" fill="#fff" opacity=".8"/>`}
  ],
  face:[
    {ko:'동그란 안경',en:'round glasses',d:(c,l)=>`<circle cx="-26" r="20" fill="rgba(255,255,255,.35)" stroke="${OL}" stroke-width="9"/><circle cx="26" r="20" fill="rgba(255,255,255,.35)" stroke="${OL}" stroke-width="9"/><path d="M-7 -2Q0 -8 7 -2" stroke="${OL}" stroke-width="9" fill="none"/><circle cx="-26" r="20" fill="none" stroke="${c}" stroke-width="4.5"/><circle cx="26" r="20" fill="none" stroke="${c}" stroke-width="4.5"/><path d="M-7 -2Q0 -8 7 -2" stroke="${c}" stroke-width="4.5" fill="none"/>`},
    {ko:'선글라스',en:'sunglasses',d:(c,l)=>`<path d="M-46 -12H-8Q-6 16 -27 16Q-46 16 -46 -12Z" fill="#4A3F6B" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M46 -12H8Q6 16 27 16Q46 16 46 -12Z" fill="#4A3F6B" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M-8 -8H8" stroke="${c}" stroke-width="5"/><path d="M-40 -6l8 10M14 -6l8 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`},
    {ko:'볼 스티커',en:'cheek stickers',card:'translate(0 -44) scale(1.7)',d:(c,l)=>`<g transform="translate(-48 26) scale(.36)"><path d="M0 30C-44 0 -38 -34 -18 -34C-8 -34 -2 -28 0 -20C2 -28 8 -34 18 -34C38 -34 44 0 0 30Z" fill="${c}" ${S}/></g><g transform="translate(48 26)">${A.star(0,0,13,c,S)}</g>`}
  ]
};
const SLOTS=['head','neck','face'];
const SLOT={head:'translate(100 24) scale(.8)',neck:'translate(100 168) scale(.86)',face:'translate(100 100)'};
const SLOT_PT={head:[100,24],neck:[100,168],face:[100,100]},SLOT_SCALE={head:.8,neck:.86,face:1};
const HINT_PT={head:[100,20],neck:[100,164],face:[146,86]};
const ASK={head:['머리에 뭘 달아 줄까? 하나 골라 봐!','What goes on the head? Pick one!'],neck:['목에는 뭘 걸어 줄까?','What goes around the neck?'],face:['얼굴에는 뭘 해 줄까?','What goes on the face?']};

/* ---------- little drawings ---------- */
const ICON={
  sponge:`<svg viewBox="0 0 100 100"><rect x="14" y="26" width="72" height="50" rx="16" fill="${PAL.butter}" ${S}/><circle cx="26" cy="40" r="4" fill="#DDBB60"/><circle cx="74" cy="38" r="4" fill="#DDBB60"/><circle cx="72" cy="62" r="5" fill="#DDBB60"/><circle cx="28" cy="64" r="4.5" fill="#DDBB60"/><g class="tf"><circle class="tf-eye" cx="42" cy="47" r="3.8" fill="${OL}"/><circle class="tf-eye" cx="58" cy="47" r="3.8" fill="${OL}"/><path class="tf-smile" d="M44 55Q50 61 56 55" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><path class="tf-grin" opacity="0" d="M43 54Q50 65 57 54Z" fill="#B8474B" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g><circle cx="22" cy="24" r="9" fill="#fff" ${S}/><circle cx="80" cy="76" r="7" fill="#fff" ${S}/></svg>`,
  shower:`<svg viewBox="0 0 100 100"><path d="M86 6Q88 28 62 36" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M86 6Q88 28 62 36" fill="none" stroke="#C8CDD6" stroke-width="6.5" stroke-linecap="round"/><path d="M22 60Q22 34 52 34Q82 34 82 60Z" fill="${PAL.sky}" ${S}/><g class="tf"><circle class="tf-eye" cx="44" cy="47" r="3.6" fill="${OL}"/><circle class="tf-eye" cx="60" cy="47" r="3.6" fill="${OL}"/><path class="tf-smile" d="M47 53Q52 57 57 53" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><path class="tf-grin" opacity="0" d="M46 52Q52 60 58 52Z" fill="#B8474B" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/></g><rect x="18" y="58" width="68" height="11" rx="5.5" fill="#CFE5F4" ${S}/>${[28,40,52,64,76].map(x=>`<circle cx="${x}" cy="63.5" r="2.2" fill="#8FC3E6"/>`).join('')}</svg>`,
  dryer:`<svg viewBox="0 0 100 100"><path d="M52 52L60 90H44L40 54Z" fill="${PAL.lilac}" ${S}/><path d="M16 24H62Q84 24 84 40Q84 56 62 56H16Z" fill="${PAL.rose}" ${S}/><rect x="8" y="26" width="12" height="28" rx="4" fill="#8F7F9C" ${S}/><g class="tf"><g class="tf-eye"><circle cx="40" cy="36" r="4.5" fill="${OL}"/><circle cx="41.5" cy="34.5" r="1.5" fill="#fff"/></g><g class="tf-eye"><circle cx="58" cy="36" r="4.5" fill="${OL}"/><circle cx="59.5" cy="34.5" r="1.5" fill="#fff"/></g><path class="tf-smile" d="M42 44Q49 52 56 44" fill="none" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/><path class="tf-grin" opacity="0" d="M41 43Q49 55 57 43Z" fill="#B8474B" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/></g></svg>`,
  mirror:`<svg viewBox="0 0 100 100"><ellipse cx="50" cy="44" rx="30" ry="36" fill="${PAL.butter}" ${S}/><ellipse cx="50" cy="44" rx="21" ry="27" fill="#EAF3F6" ${S}/><path d="M38 30Q43 22 53 21" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${OL}" stroke-width="9" stroke-linecap="round"/><path d="M50 81V92M36 94H64" stroke="${PAL.butter}" stroke-width="3.5" stroke-linecap="round"/>${A.twinkle(82,16,7,'#F0D58A')}</svg>`,
  /* rules.sameLayoutEverywhere / shell.header.left: back is always the same round arrow (64px), one level up (salon → shop front → town) */
  back:`<svg viewBox="0 0 48 48"><path d="M17 13H29Q40 13 40 25Q40 37 29 37H16" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round"/><path d="M19 4L8 13L19 22" fill="none" stroke="${OL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:'<svg viewBox="0 0 20 20"><path d="M10 1l2.6 5.6 6 .7-4.5 4.1 1.2 6L10 14.5 4.7 17.4l1.2-6L1.4 7.3l6-.7z" fill="#F0D58A" stroke="#5B3A29" stroke-width="1.2"/></svg>'
};
/* P12 touch.tool.intro: the name the tool says when it jumps out of the tray */
const TOOL_NAME={foam:['수세미!','Sponge!'],rinse:['샤워기!','Shower!'],dry:['드라이기!','Dryer!']};
/* tool pictures and their working point (sponge bottom, shower head, dryer mouth) */
const TOOL_OF={
  foam:{icon:ICON.sponge,effect:'foam',anchor:[.5,.86],gapScale:.35,log:'rub',alive:'sponge'}   /* 수세미는 문지르는 도구라 손가락에 더 가깝게 */,
  rinse:{icon:ICON.shower,effect:'water',anchor:[.52,.69],log:'water',alive:'shower'},
  dry:{icon:ICON.dryer,effect:'wind',anchor:[.08,.4],log:'dry',alive:'dryer'}
};
/* need bubbles: what the customer wants, as a picture (no letters) */
const NEED_ICON={
  muddy:`<path d="${A.blob(30,23,12,.55,8,5)}" fill="#8A5A36"/><circle cx="45" cy="13" r="3.2" fill="#8A5A36"/><circle cx="16" cy="33" r="2.6" fill="#8A5A36"/>`,
  leaves:`<g transform="translate(26 24) rotate(-30)"><path d="M0 -14Q12 -4 0 14Q-12 -4 0 -14Z" fill="#9CC48F" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -10V11" stroke="#6E9E66" stroke-width="1.8"/></g><g transform="translate(40 22) rotate(35) scale(.7)"><path d="M0 -14Q12 -4 0 14Q-12 -4 0 -14Z" fill="#C9D98A" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/></g>`,
  tangled:`<path d="M15 28q4-10 8 0t8 0t8 0t6 0M17 18q4-8 8 0t8 0t8 0" stroke="#B98154" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  party:`<g transform="translate(30 23) scale(.34)">${WEAR.head[0].d(PAL.rose,'#F6D3DB')}</g>`
};
const bubble=need=>`<svg viewBox="0 0 60 56"><path d="M10 4H50Q58 4 58 12V34Q58 42 50 42H26L15 52L17 42H10Q2 42 2 34V12Q2 4 10 4Z" fill="#FFFDF9" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>${NEED_ICON[need]||''}</svg>`;
const LEAF=(x,y,r,s)=>`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r}) scale(${s.toFixed(2)})"><path d="M0 -13Q12 -3 0 13Q-12 -3 0 -13Z" fill="#9CC48F" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -9V10" stroke="#6E9E66" stroke-width="1.6"/></g>`;
/* fluffed fur: a soft tuft on the outline, a little curl inside */
const TUFT=(x,y,s,rot,body)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${s.toFixed(2)})" d="M-14 8Q-18 -2 -9 -5Q-7 -14 0 -11Q7 -14 9 -5Q18 -2 14 8Z" fill="${body}" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>`;
const CURL=(x,y,s,col)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M-8 3q4 -7 8 0q4 -7 8 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>`;
const DROP=(x,y,s)=>`<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" d="M0 -9Q8 3 0 7Q-8 3 0 -9Z" fill="#9FD0F0" stroke="#6FB2DC" stroke-width="1.5"/>`;
const FOAM=(x,y,s)=>`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})"><g fill="#fff" stroke="#CDE9FA" stroke-width="2"><circle r="14"/><circle cx="12" cy="8" r="9.5"/><circle cx="-10" cy="9" r="8"/></g><circle cx="-5" cy="-5" r="3.5" fill="#E8F6FF"/></g>`;

/* ---------- backgrounds ---------- */
const TUB=`<svg viewBox="0 0 300 150"><ellipse cx="150" cy="142" rx="130" ry="8" fill="rgba(91,58,41,.16)"/><rect x="52" y="118" width="22" height="24" rx="8" fill="${PAL.butter}" ${S}/><rect x="226" y="118" width="22" height="24" rx="8" fill="${PAL.butter}" ${S}/>
  <path d="M22 34H278Q282 108 240 126H60Q18 108 22 34Z" fill="${PAL.rose}" ${S}/><path d="M44 54Q46 96 70 110" stroke="#fff" stroke-width="9" opacity=".5" fill="none" stroke-linecap="round"/>
  <rect x="10" y="22" width="280" height="24" rx="12" fill="#F6D3DB" ${S}/>${[[40,20,13],[66,12,10],[250,18,14],[224,10,9],[150,16,11],[110,10,8],[190,12,9]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#CDE9FA" stroke-width="2"/>`).join('')}</svg>`;
const BG=`<svg class="ps-mirror" viewBox="0 0 200 220"><ellipse cx="100" cy="110" rx="92" ry="102" fill="${PAL.butter}" ${S}/><ellipse cx="100" cy="110" rx="76" ry="86" fill="#EAF3F6" ${S}/><path d="M56 62Q78 40 110 40" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/></svg>
  <div class="ps-shelf"><span>${A.polish(PAL.rose)}</span><span>${A.lipstick(PAL.lilac)}</span><span>${A.polish(PAL.sky)}</span></div>
  <svg class="ps-win" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="18" fill="${PAL.sky}" ${S}/><path d="M50 6V94M6 50H94" stroke="${OL}" stroke-width="3.5"/><circle cx="72" cy="28" r="10" fill="${PAL.butter}"/></svg>
  <div class="ps-rug"></div>`;
/* shop front: papercraft layers without outlines (ART.paper style), calm colours, one soft shadow per layer */
const PF='filter="url(#psPaper)"';
const PAPER_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="psPaper" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#5B3A29" flood-opacity=".22"/></filter></defs></svg>`;
const LB_WALL=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100" fill="#F3E7DC"/><rect y="58" width="100" height="16" fill="#EEDFD1"/><path d="M0 72Q50 70 100 72V100H0Z" fill="#E7D8C6"/><path d="M0 91Q50 89.5 100 91V100H0Z" fill="#DDCBB5"/></svg>`;
const LB_AWN=`<svg viewBox="0 0 200 40" preserveAspectRatio="none"><g ${PF}><path d="M0 0H200V22${Array.from({length:10},(_,i)=>`Q${195-i*20} 36 ${190-i*20} 22`).join('').replace(/^/,'')}Q5 36 0 22Z" fill="#E8A0AE"/></g><rect width="200" height="9" fill="#F2C4CC"/></svg>`;
const LB_WIN=`<svg viewBox="0 0 160 124" preserveAspectRatio="xMidYMid meet"><g ${PF}><rect x="4" y="4" width="152" height="96" rx="16" fill="#D9BFA6"/></g><g ${PF}><rect x="14" y="14" width="132" height="76" rx="10" fill="#DCEBF0"/></g>
  <g ${PF}><ellipse cx="62" cy="54" rx="22" ry="27" fill="#F0D58A"/><ellipse cx="62" cy="54" rx="15" ry="20" fill="#EEF5F7"/></g><g ${PF}><path d="M100 90V64Q100 54 112 54H122Q134 54 134 64V90Z" fill="#E8A0AE"/><rect x="96" y="74" width="42" height="9" rx="4.5" fill="#F2C4CC"/></g>
  <path d="M24 84L52 18H66L38 84Z" fill="#fff" opacity=".35"/><rect x="78" y="14" width="5" height="76" fill="#D9BFA6"/>
  <g ${PF}><rect x="10" y="98" width="140" height="16" rx="6" fill="#C9A98A"/></g><g ${PF}><circle cx="30" cy="98" r="10" fill="#A9CFA0"/><circle cx="52" cy="95" r="12" fill="#9CC293"/><circle cx="108" cy="96" r="11" fill="#A9CFA0"/><circle cx="130" cy="98" r="9" fill="#9CC293"/></g>
  <circle cx="40" cy="90" r="4" fill="#E8A0AE"/><circle cx="56" cy="86" r="4" fill="#F0D58A"/><circle cx="116" cy="88" r="4" fill="#E8A0AE"/></svg>`;
const PAW=`<g fill="#E8A0AE"><ellipse cx="0" cy="5" rx="8" ry="6.5"/><circle cx="-8" cy="-5" r="3.4"/><circle cx="-2.8" cy="-9" r="3.4"/><circle cx="2.8" cy="-9" r="3.4"/><circle cx="8" cy="-5" r="3.4"/></g>`;
const LB_DOOR=`<svg viewBox="0 0 120 172" preserveAspectRatio="xMidYMax meet"><g ${PF}><path d="M6 166V52Q6 6 60 6Q114 6 114 52V166Z" fill="#C9A98A"/></g><g ${PF}><path d="M17 166V56Q17 18 60 18Q103 18 103 56V166Z" fill="#A9CFA0"/></g>
  <g ${PF}><circle cx="60" cy="60" r="21" fill="#DCEBF0"/></g><g transform="translate(60 61)">${PAW}</g><path d="M46 52Q52 44 60 43" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>
  <g ${PF}><rect x="28" y="96" width="64" height="58" rx="8" fill="#B8D9AF"/></g><g ${PF}><circle cx="90" cy="112" r="5.5" fill="#F0D58A"/></g><g ${PF}><rect x="0" y="162" width="120" height="10" rx="4" fill="#DCCBB6"/></g></svg>`;
const LB_CHAIR=`<svg viewBox="0 0 120 84" preserveAspectRatio="xMidYMax meet"><g ${PF}><rect x="20" y="2" width="80" height="50" rx="18" fill="#E3BE98"/></g><g ${PF}><rect x="12" y="68" width="9" height="16" rx="3" fill="#B88A66"/><rect x="99" y="68" width="9" height="16" rx="3" fill="#B88A66"/></g><g ${PF}><rect x="6" y="48" width="108" height="20" rx="9" fill="#D2A582"/></g></svg>`;
const FRAME=(inner)=>`<svg viewBox="0 0 100 112"><g ${PF}><rect x="3" y="3" width="94" height="104" rx="12" fill="#E3BE98"/></g><g ${PF}><rect x="11" y="11" width="78" height="88" rx="7" fill="${inner?'#EEF5F7':'#EFE4D8'}"/></g>${inner?`<g transform="translate(16 18) scale(.34)">${inner}</g>`:''}</svg>`;

const css=`
#petsalon{gap:8px}
.psstars{display:flex;gap:2px;flex:none}
.psstars svg{width:20px;height:20px}
#petsalon .bar .round{width:64px;height:64px;padding:10px}
#petsalon .bar .round svg{display:block;width:100%;height:100%}
.ps-salon{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
.ps-stage{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;touch-action:none;box-shadow:0 6px 14px rgba(91,74,66,.12);
  background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 88%,var(--berry)),color-mix(in srgb,var(--bg) 72%,var(--peach)))}
.ps-mirror{position:absolute;left:50%;top:15%;width:62%;max-width:300px;transform:translateX(-50%);pointer-events:none;opacity:.95}
.ps-shelf{position:absolute;right:3%;top:16%;width:22%;display:flex;align-items:flex-end;justify-content:center;gap:2px;padding-bottom:4px;border-bottom:8px solid #D2A582;border-radius:0 0 6px 6px;pointer-events:none}
.ps-shelf span{width:30%}.ps-shelf svg{width:100%;height:auto;display:block}
.ps-win{position:absolute;left:3%;top:16%;width:20%;pointer-events:none}
.ps-rug{transition:bottom .45s ease-in-out;position:absolute;left:50%;bottom:5%;width:78%;height:10%;transform:translateX(-50%);border-radius:50%;background:color-mix(in srgb,var(--paper) 70%,var(--berry));border:3px solid ${OL};opacity:.8;pointer-events:none}
.ps-pet{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);z-index:3;pointer-events:none;transition:bottom .45s ease-in-out}
.ps-pet.up{bottom:24%}
.ps-stage.up .ps-rug{bottom:19%}
.ps-pet .psbase svg,.ps-pet .over{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ps-pet .ears{transform-box:fill-box;transform-origin:50% 100%}
.ps-pet.enter{animation:psin .9s cubic-bezier(.3,1.3,.5,1)}
@keyframes psin{from{transform:translateX(120%)}to{transform:translateX(-50%)}}
.ps-pet.leave{animation:psout .8s ease-in forwards}
@keyframes psout{to{transform:translateX(-220%)}}
.ps-pet.callme{animation:pscall .7s ease-in-out}
@keyframes pscall{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.05)}}
.ps-pet .pop{animation:pspop .5s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:center}
@keyframes pspop{from{opacity:0}}
.ps-tub{position:absolute;left:50%;bottom:3%;transform:translateX(-50%) translateY(130%);z-index:4;pointer-events:none;transition:transform .7s cubic-bezier(.3,1.2,.5,1)}
.ps-tub.on{transform:translateX(-50%)}
.ps-tub svg{width:100%;height:auto;display:block}
.ps-pfx{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden}
.ps-pfx .pf{position:absolute;width:0;height:0}
.ps-pfx .pf svg{position:absolute;left:-15px;top:-15px;width:30px;height:30px;overflow:visible}
.ps-pfx .pf.pop{animation:pfpop ease-out forwards}
@keyframes pfpop{from{transform:scale(.6);opacity:1}to{transform:scale(1.7);opacity:0}}
.ps-pfx .pf.fly{animation:pffly ease-out forwards}
@keyframes pffly{from{transform:translate(0,0) rotate(0);opacity:1}to{transform:translate(var(--dx),var(--dy)) rotate(var(--rot,0deg));opacity:0}}
#petsalon .ani-idle .eyes,#petsalon .wave{animation:none}
@keyframes psbloom{from{opacity:0}to{opacity:1}}
.ps-pet .bloom{animation:psbloom .6s ease-out both}
.ps-panel{flex:none;height:170px;display:flex;gap:10px;align-items:center;justify-content:center;padding:6px 0;touch-action:none}
.ps-panel .pzmeter .mi{width:150px;height:150px;padding:10px}
.ps-panel .pzmeter{background:color-mix(in srgb,var(--paper) 80%,transparent);border-radius:28px;padding:12px 10px;box-shadow:0 3px 10px rgba(91,74,66,.1)}
.ps-panel .pzmeter .mbar i{background:${PAL.rose};box-shadow:none;border-radius:0 12px 12px 0;transition:width .3s ease-out}
.ps-card{flex:1;min-width:0;max-width:200px;height:124px;border-radius:28px;border:0;padding:8px;background:var(--paper);display:grid;place-items:center;touch-action:none;
  box-shadow:0 4px 12px rgba(91,74,66,.16);transition:transform .15s,opacity .2s}
.ps-card svg{width:100%;height:100%;display:block;pointer-events:none}
.ps-card:active{transform:translateY(5px)}
.ps-card.worn{box-shadow:0 0 0 4px color-mix(in srgb,var(--berry) 70%,#fff),0 4px 12px rgba(91,74,66,.16)}
.ps-card.lift{opacity:.4}
.ps-card.in{animation:pscard .3s ease-out both}
@keyframes pscard{from{transform:translateY(24px);opacity:0}}
.ps-mirbtn{position:absolute;right:10px;bottom:10px;width:116px;height:116px;border-radius:50%;border:0;padding:12px;background:var(--paper);z-index:9;opacity:0;transition:opacity .8s ease-out;
  box-shadow:0 5px 0 rgba(46,42,79,.14),0 8px 14px rgba(91,74,66,.14);display:grid;place-items:center}
.ps-mirbtn.on{opacity:1}
.ps-mirbtn svg{width:100%;height:100%;display:block;pointer-events:none}
.ps-mirbtn:active{transform:translateY(4px)}
.ps-float{position:absolute;z-index:60;pointer-events:none;will-change:transform}
.ps-float svg{width:100%;height:100%;display:block;overflow:visible}
.ps-photo{position:absolute;z-index:8;pointer-events:none;opacity:0;transition:opacity .35s}
.ps-photo.on{opacity:1}
.ps-photo svg{width:100%;height:100%;display:block}
/* shop front */
.ps-lobby{flex:1;min-height:0;position:relative;border-radius:30px;overflow:hidden;box-shadow:0 6px 14px rgba(91,74,66,.12);background:#F3E7DC;touch-action:manipulation}
.ps-lobby>div{position:absolute;pointer-events:none}
.ps-lobby svg{display:block;width:100%;height:100%}
.lb-bg{inset:0}
.lb-awn{left:0;right:0;top:0;height:9%}
.lb-frames{left:4%;right:4%;top:11%;height:16%;display:flex;justify-content:center;gap:4%}
.lb-frame{height:100%;aspect-ratio:100/112;position:relative}
.lb-frame.new{animation:lbnew .6s ease-out}
@keyframes lbnew{from{transform:scale(.6);opacity:0}}
.lb-win{left:4%;width:44%;top:37%;height:26%}
.lb-door{left:53%;width:40%;top:28%;height:44.5%}
.lb-seats{inset:0}
.lb-slot{position:absolute}
.lb-chair{position:absolute;left:0;right:0;bottom:0;height:46%}
.lb-cust{position:absolute;left:0;bottom:0;width:100%;height:100%;border:0;padding:0;background:none;pointer-events:auto;touch-action:manipulation;transition:transform 2s linear}
.lb-cust .lb-ani{position:absolute;left:3%;right:3%;bottom:19%;aspect-ratio:200/230}
.lb-cust .lb-bub{position:absolute;right:-2%;top:0;width:42%;aspect-ratio:60/56}
.lb-cust.walk .lb-ani{animation:lbwalk .66s ease-in-out 3}
.lb-cust.arriving{pointer-events:none}
.lb-cust:active .lb-ani{transform:translateY(3px)}
@keyframes lbwalk{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.lb-walker{position:absolute;z-index:5;pointer-events:none}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

const sec=document.createElement('section');sec.id=id;sec.className='screen';sec.hidden=true;
sec.innerHTML=`${PAPER_DEFS}<div class="bar"><button class="round" data-go="home" id="psHome" aria-label="뒤로">${ICON.back}</button><button class="round" id="psBack" aria-label="가게 앞으로" hidden>${ICON.back}</button><h2>동물 미용실</h2><div class="psstars" id="psStars"></div></div>
<div class="ps-lobby" id="psLobby"><div class="lb-bg">${LB_WALL}</div><div class="lb-awn">${LB_AWN}</div><div class="lb-frames" id="psFrames"></div><div class="lb-win">${LB_WIN}</div><div class="lb-door" id="psDoor">${LB_DOOR}</div><div class="lb-seats" id="psSeats"></div></div>
<div class="ps-salon" id="psSalon" hidden><div class="ps-stage" id="psStage">${BG}<div class="ps-pet" id="psPet"><div class="psbase"></div><svg class="over" viewBox="0 0 200 230">${A.animalOverlay()}</svg></div>
<div class="ps-tub" id="psTub">${TUB}</div><div class="ps-pfx" id="psPfx"></div><button class="ps-mirbtn" id="psMirBtn" aria-label="거울" hidden>${ICON.mirror}</button></div>
<div class="ps-panel" id="psPanel"></div></div>`;
document.getElementById('app').appendChild(sec);M.NAMES[id]='동물 미용실';
const $=s=>sec.querySelector(s);
const stage=$('#psStage'),petEl=$('#psPet'),baseEl=petEl.querySelector('.psbase'),overEl=petEl.querySelector('.over'),ovBody=overEl.querySelector('.ov-body'),ovHead=overEl.querySelector('.ov-head'),tub=$('#psTub'),panel=$('#psPanel'),pfx=$('#psPfx'),mirBtn=$('#psMirBtn');
const lobbyEl=$('#psLobby'),salonEl=$('#psSalon'),seatsEl=$('#psSeats'),framesEl=$('#psFrames'),doorEl=$('#psDoor'),homeBtn=$('#psHome'),backBtn=$('#psBack');
const G=M.Guide.make(sec,{say});
const DATA=Object.assign({served:0,wall:[]},store.get('mallang_salon',{}));if(!Array.isArray(DATA.wall))DATA.wall=[];
const save=()=>store.set('mallang_salon',DATA);
/* P12: living characters (alive.js). al = the customer in the salon, lobbyAl = the three waiting outside */
const AL=M.Alive||null;let al=null,lobbyAl=[],turns=null,lastTickle=0;
const alPlay=(n,o)=>{if(al&&al.play(n,o))LOG.push('play:'+n)};   // started now or right after the current one
const alMood=m=>{if(al)al.setMood(m)};
function lobbyAlive(){
  if(!AL)return;lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns)turns.stop();
  seatsEl.querySelectorAll('.lb-cust .lb-ani').forEach(e=>{const b=e.closest('.lb-cust'),c=lobby[+b.dataset.i];lobbyAl.push(AL.attach(e,{kind:c?c.kind:'bunny',waiting:true}))});
  turns=AL.takeTurns(lobbyAl);
}
function lobbyAliveOff(){lobbyAl.forEach(h=>h.detach());lobbyAl=[];if(turns){turns.stop();turns=null}}
let view='lobby',phase='',mood='idle',raf=0,lastMiss=0,misses=0,toolE=null,st=null,lobby=[],seatIdx=-1,cards=null,mirrorShown=false,mirrorT=0,dd=null,cd=null,flying=0;
const killTool=()=>{if(toolE){toolE.destroy();toolE=null}};
const clearFloats=()=>{sec.querySelectorAll('.ps-float,.ps-photo').forEach(f=>f.remove());pfx.innerHTML=''};

/* ---------- coverage cells over the pet picture (viewBox 0 0 200 230), grid from tools.coverage ---------- */
const GR=COV.grid||[6,6];
const inSil=(x,y)=>y<=192&&   /* 발 쪽은 욕조에 가려서 칸에서 뺌 */(Math.hypot(x-100,y-100)<=72||((x-100)/50)**2+((y-188)/40)**2<=1);
const EYES=[[74,100],[126,100]];
const CELLS=[];
for(let r=0;r<GR[1];r++)for(let c=0;c<GR[0];c++){
  const w=200/GR[0],h=230/GR[1],x0=c*w,y0=r*h;let n=0,sx=0,sy=0;
  for(let a=0;a<5;a++)for(let b=0;b<5;b++){const x=x0+(a+.5)*w/5,y=y0+(b+.5)*h/5;if(inSil(x,y)){n++;sx+=x;sy+=y}}
  if(COV.insidePetOnly===false){if(!n){sx=x0+w/2;sy=y0+h/2;n=1}}else if(n<3)continue;
  const cx=sx/n,cy=sy/n;let dx=cx,dy=cy;
  EYES.forEach(([ex,ey])=>{const d=Math.hypot(dx-ex,dy-ey);if(d<24){const k=26/(d||1);dx=ex+(dx-ex)*k;dy=ey+(dy-ey)*k}});
  const face=((cx-100)/54)**2+((cy-112)/36)**2<=1;let edge=null;
  if(cy<160){const d=Math.hypot(cx-100,cy-100);if(d>40)edge=[100+(cx-100)/d*70,100+(cy-100)/d*70,Math.atan2(cy-100,cx-100)*180/Math.PI+90]}
  else if(Math.abs(cx-100)>26){const an=Math.atan2((cy-188)/40,(cx-100)/50);edge=[100+50*Math.cos(an),188+40*Math.sin(an),an*180/Math.PI+90]}
  CELLS.push({col:c,row:r,cx,cy,dx,dy,fx:cx/200,fy:cy/230,face,edge});
}

/* ---------- drawing ---------- */
/* cells on the head go into the head group of the overlay, so mud, foam and head wear move with the head (P12) */
const HEAD_Y=158,onHead=P0=>P0.cy<HEAD_Y;
function drawOver(popSlot){
  if(!st)return;const out={b:'',h:''},K=A.KINDS[st.kind]||A.KINDS.bunny,put=(P0,x)=>{out[onHead(P0)?'h':'b']+=x};
  st.cells.forEach((c,i)=>{const P0=CELLS[i];
    const mud=c.mud*(1-.6*c.foam)*(1-c.rinse);if(mud>.02)put(P0,`<path d="${A.blob(P0.dx,P0.dy,c.mr,.5,7,i+11)}" fill="#8A5A36" opacity="${(mud*.85).toFixed(2)}"/>`);
    const lf=c.leaf*(1-c.rinse);if(lf>.02)put(P0,LEAF(P0.dx,P0.dy,c.lr,.6+.4*lf))});
  st.cells.forEach((c,i)=>{const P0=CELLS[i],f=c.foam*(1-c.rinse);if(f>.02)put(P0,FOAM(P0.dx,P0.dy,(P0.face?.6:.85)*(.35+.65*f)))});
  st.cells.forEach((c,i)=>{const P0=CELLS[i],w=c.rinse*(1-c.dry);if(w>.04)put(P0,DROP(P0.dx+6,P0.dy-4,.5+.5*w))});
  st.cells.forEach((c,i)=>{const P0=CELLS[i],d=c.dry;if(d<=.02)return;
    if(P0.edge)put(P0,TUFT(P0.edge[0],P0.edge[1],.35+.45*d,P0.edge[2],K.body));
    if(P0.face)put(P0,A.twinkle(P0.dx,P0.dy-6,2+3*d,'#fff'));else put(P0,CURL(P0.dx,P0.dy,.5+.5*d,K.dark))});
  ['neck','face','head'].forEach(k=>{const w=st.wear[k];if(!w||st.drag===k)return;const it=WEAR[k][w.idx],col=COLORS[w.col],viv=it.d(col[4],col[3]);
    const b=st.bloom&&st.bloom.slot===k?performance.now()-st.bloom.t:1e9;
    out[k==='neck'?'b':'h']+=`<g data-slot="${k}" transform="${SLOT[k]}">`+(b<BLOOM?`<g class="${popSlot===k?'pop':''}"><g>${it.d(col[2],col[3])}</g><g class="bloom" style="animation-duration:${BLOOM}ms;animation-delay:${-Math.round(b)}ms">${viv}</g></g>`:`<g>${viv}</g>`)+`</g>`});
  if(phase==='dress'&&!st.hintOff)SLOTS.forEach(k=>{if(!st.wear[k])out[k==='neck'?'b':'h']+=A.twinkle(HINT_PT[k][0],HINT_PT[k][1],10,'#F0D58A')});
  ovBody.innerHTML=out.b;ovHead.innerHTML=out.h;
}
function drawPet(m,extra){mood=m||mood;if(!st)return;baseEl.innerHTML=A.animal(st.kind,mood,Object.assign({lash:true},extra||{}));if(al)al.refresh()}
/* the face area on screen (head circle of the picture), so a big tool turns see-through over it */
const faceRect=()=>{const r=petEl.getBoundingClientRect(),u=r.width/200,v=r.height/230;return{left:r.left+40*u,right:r.left+160*u,top:r.top+48*v,bottom:r.top+150*v,width:120*u,height:102*v}};
function rd(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawOver()})}
const svgInner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
function wearSVG(wear){return['neck','face','head'].map(k=>{const w=wear[k];if(!w||!WEAR[k][w.idx])return'';const col=COLORS[w.col]||COLORS[0];return `<g transform="${SLOT[k]}">${WEAR[k][w.idx].d(col[4],col[3])}</g>`}).join('')}
function portrait(kind,wear,m){return svgInner(A.animal(kind,m||'happy',{lash:true}))+wearSVG(wear||{})}
function size(){
  const r=stage.getBoundingClientRect();if(!r.width)return;
  const w=Math.round(Math.max(150,Math.min(r.width*.74,r.height*.66*200/230))),h=Math.round(w*230/200);petEl.style.width=w+'px';petEl.style.height=h+'px';
  const tw=Math.round(w*1.28),th=tw*150/300,petBottom=r.height*.09,rimY=r.height-petBottom-h*(28/230);
  tub.style.width=tw+'px';tub.style.bottom=Math.round(r.height-(rimY-th*(22/150))-th)+'px';
}
function stars(){$('#psStars').innerHTML=Array.from({length:Math.min(8,DATA.served)},()=>ICON.star).join('')}
function meter(icon){panel.innerHTML=`<div class="pzmeter"><span class="mi">${icon}</span><div class="mbar"><i></i></div><span class="mstar">${ICON.star}</span></div>`}
function prog(p){p=Math.max(0,Math.min(1,p));const b=panel.querySelector('.mbar i');if(b)b.style.width=(p*100)+'%';const s=panel.querySelector('.mstar');if(s)s.classList.toggle('full',p>=1)}
function anim(cls){petEl.classList.remove('enter','callme','leave');void petEl.offsetWidth;if(cls)petEl.classList.add(cls)}
const secXY=(x,y)=>{const sr=sec.getBoundingClientRect();return[x-sr.left,y-sr.top]};
const petXY=(fx,fy)=>{const r=petEl.getBoundingClientRect();return secXY(r.left+r.width*fx,r.top+r.height*fy)};
const petPt=(sx,sy)=>{const r=petEl.getBoundingClientRect();return[r.left+r.width*sx/200,r.top+r.height*sy/230]};   // pet units → client
const toPet=e=>{const r=petEl.getBoundingClientRect();return[(e.clientX-r.left)/r.width*200,(e.clientY-r.top)/r.height*230]};
const inPet=e=>{const r=petEl.getBoundingClientRect(),px=r.width*.12,py=r.height*.06;return e.clientX>r.left-px&&e.clientX<r.right+px&&e.clientY>r.top-py&&e.clientY<r.bottom+py};
const MISS=VO.onWrongPlace.map(m=>[m.ko,m.en]);
function miss(){misses++;G.nudge();if(['foam','rinse','dry'].includes(phase))anim('callme');const n=performance.now();if(n-lastMiss<2400)return;lastMiss=n;const c=pick(MISS);say(c[0],c[1])}
function spawn(html,x,y,cls,o={}){
  if(pfx.childElementCount>18)return;const e=document.createElement('i');e.className='pf '+cls;e.innerHTML=`<svg viewBox="-15 -15 30 30">${html}</svg>`;
  e.style.left=x+'px';e.style.top=y+'px';e.style.setProperty('--dx',(o.dx||0)+'px');e.style.setProperty('--dy',(o.dy||0)+'px');e.style.setProperty('--rot',(o.rot||0)+'deg');
  const ms=o.ms||700;e.style.animationDuration=ms+'ms';pfx.appendChild(e);setTimeout(()=>e.remove(),ms+60);
}
const cellXY=i=>{const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect(),c=CELLS[i];return[r.left-s.left+r.width*c.dx/200,r.top-s.top+r.height*c.dy/230]};
const unitPx=()=>petEl.getBoundingClientRect().width/200;

/* ============================== shop front (가게 앞) ============================== */
function newCustomer(avoidKinds,wantNeed){
  const kinds=KINDS.filter(k=>!avoidKinds.includes(k.id)),k=pick(kinds.length?kinds:KINDS);
  const need=NEED_POOL.find(n=>n.id===wantNeed)||pick(NEED_POOL)||{id:'party',steps:[]};
  return{kind:k.id,need:need.id,name:k.name||k.ko,inside:false};
}
function fillLobby(avoid){
  while(lobby.length<WAITING)lobby.push(null);
  lobby.forEach((c,i)=>{if(c)return;const others=lobby.filter(Boolean),missing=NEED_POOL.map(n=>n.id).filter(n=>!others.some(o=>o.need===n));lobby[i]=newCustomer(others.map(o=>o.kind).concat(avoid||[]),pick(missing.length?missing:NEED_POOL.map(n=>n.id)))});
}
function seatBox(i){const r=lobbyEl.getBoundingClientRect(),W=r.width,H=r.height,bw=Math.round(Math.max(112,Math.min(W*.3,H*.26,210))),gap=(W-3*bw)/4,bh=Math.round(bw*1.32);return{left:gap+i*(bw+gap),bottom:Math.round(H*.03),w:bw,h:bh,W,H}}
function custHTML(c,i){const a=kindOf(c.kind);return `<button class="lb-cust" data-i="${i}" aria-label="${a.ko}"><span class="lb-ani">${A.animal(c.kind,'idle',{lash:true})}</span><span class="lb-bub">${bubble(c.need)}</span></button>`}
function renderSeats(skip){
  seatsEl.innerHTML='';
  for(let i=0;i<WAITING;i++){const b=seatBox(i),slot=document.createElement('div');slot.className='lb-slot';slot.dataset.i=i;
    Object.assign(slot.style,{left:b.left+'px',bottom:b.bottom+'px',width:b.w+'px',height:b.h+'px'});
    slot.innerHTML=`<div class="lb-chair">${LB_CHAIR}</div>`+(lobby[i]&&!lobby[i].inside&&i!==skip?custHTML(lobby[i],i):'');seatsEl.appendChild(slot)}
  lobbyAlive();
}
function layoutLobby(){if(view!=='lobby'||!lobbyEl.getBoundingClientRect().width)return;seatsEl.querySelectorAll('.lb-slot').forEach(sl=>{const b=seatBox(+sl.dataset.i);Object.assign(sl.style,{left:b.left+'px',bottom:b.bottom+'px',width:b.w+'px',height:b.h+'px'})})}
function renderFrames(fresh){
  framesEl.innerHTML=[0,1,2].map(i=>{const w=DATA.wall[i];return `<div class="lb-frame${w?' full':''}${w&&fresh&&i===0?' new':''}">${FRAME(w?portrait(w.kind,w.wear):'')}</div>`}).join('');
}
seatsEl.addEventListener('click',e=>{const b=e.target.closest('.lb-cust');if(!b||b.classList.contains('arriving'))return;pickCustomer(+b.dataset.i,b)});
lobbyEl.addEventListener('pointerdown',e=>{actx();if(phase!=='lobby'||e.target.closest('.lb-cust'))return;miss()});
function showLobby(o={}){
  L.begin();killTool();G.stop();clearFloats();
  view='lobby';phase='lobby';st=null;seatIdx=-1;cards=null;dd=null;cd=null;L.onEnd(lobbyAliveOff);
  lobbyEl.hidden=false;salonEl.hidden=true;homeBtn.hidden=false;backBtn.hidden=true;
  lobby.forEach(c=>{if(c)c.inside=false});fillLobby();
  renderFrames(!!o.served);
  if(o.served){
    phase='arrive';renderSeats(o.slot);walkOut(o.served,()=>arrive(o.slot));
  }else{renderSeats();greet()}
  stars();
}
function greet(){phase='lobby';say(LINE.lobby[0],LINE.lobby[1],true);
  G.start({type:'tap',at:()=>{const b=seatsEl.querySelector('.lb-slot:nth-child(2) .lb-cust')||seatsEl.querySelector('.lb-cust');if(!b)return[sec.clientWidth/2,sec.clientHeight/2];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height*.55)},ko:LINE.lobby[0],en:LINE.lobby[1]})}
/* the served customer walks out of the door and away */
function walkOut(c,then){
  const lr=lobbyEl.getBoundingClientRect(),dr=doorEl.getBoundingClientRect(),w=Math.round(seatBox(0).w*.92),h=Math.round(w*230/200);
  const wk=document.createElement('div');wk.className='lb-walker';wk.innerHTML=`<svg viewBox="0 0 200 230" style="overflow:visible">${portrait(c.kind,c.wear,'happy')}</svg>`;
  Object.assign(wk.style,{width:w+'px',height:h+'px',left:(dr.left-lr.left+dr.width/2-w/2)+'px',top:(dr.bottom-lr.top-h)+'px'});lobbyEl.appendChild(wk);
  const dist=lr.right-dr.left+w;
  wk.animate([{transform:'translate(0,0)'},{transform:`translate(${dist*.25}px,-8px)`},{transform:`translate(${dist*.5}px,0)`},{transform:`translate(${dist*.75}px,-8px)`},{transform:`translate(${dist}px,0)`}],{duration:1500,easing:'linear',fill:'forwards'});
  L.later(()=>{wk.remove();then&&then()},1550);L.onEnd(()=>wk.remove());
}
/* a new customer walks in slowly and sits on the empty chair (one at a time, lobby.arrive) */
function arrive(i){
  const gone=lobby[i]&&lobby[i].kind;lobby[i]=null;fillLobby([gone]);const c=lobby[i],slot=seatsEl.querySelector(`.lb-slot[data-i="${i}"]`);if(!slot||!c){greet();return}
  slot.insertAdjacentHTML('beforeend',custHTML(c,i));const b=slot.lastElementChild,lr=lobbyEl.getBoundingClientRect(),sr=slot.getBoundingClientRect();
  const fromLeft=i<WAITING-1,dx=fromLeft?-(sr.right-lr.left+10):(lr.right-sr.left+10);
  b.classList.add('arriving');b.style.transition='none';b.style.transform=`translateX(${dx}px)`;void b.offsetWidth;b.style.transition='';b.classList.add('walk');b.style.transform='translateX(0)';
  tone(523,.12,'sine',.08);tone(659,.12,'sine',.08,.25);
  L.later(()=>{b.classList.remove('arriving','walk');const a=kindOf(c.kind);say(a.ko+'!',cap(a.en)+'!');lobbyAlive();greet()},2050);
}
function pickCustomer(i,btn){
  if(phase!=='lobby'||view!=='lobby')return;const c=lobby[i];if(!c)return;
  phase='pick';G.touch();G.stop();actx();sfx.pop();
  const a=kindOf(c.kind),l=LINE.comeIn(a);say(l[0],l[1]);LOG.push('pick:'+c.kind);
  const lr=lobbyEl.getBoundingClientRect(),dr=doorEl.getBoundingClientRect(),br=btn.getBoundingClientRect();
  const dx=dr.left+dr.width/2-(br.left+br.width/2),dy=dr.bottom-dr.height*.25-(br.top+br.height/2);
  btn.style.transition='none';
  btn.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-40}px) scale(.85)`,opacity:1,offset:.55},{transform:`translate(${dx}px,${dy}px) scale(.55)`,opacity:0}],{duration:500,easing:'ease-in-out',fill:'forwards'});
  L.later(()=>enterSalon(i),560);
}
backBtn.addEventListener('click',()=>{if(view!=='salon')return;actx();sfx.pop();showLobby()});

/* ============================== in the salon ============================== */
function freshState(c){
  const R=A.rng((Date.now()&0xffff)+c.kind.length*97);
  const cells=CELLS.map(()=>({mud:0,mr:10,leaf:0,lr:0,foam:0,rinse:0,dry:0}));
  if(c.need==='muddy'){cells.forEach(x=>{x.mud=R()<.7?1:0;x.mr=9+R()*6});let k=0;while(cells.filter(x=>x.mud).length<7&&k<99)cells[(R()*cells.length)|0].mud=1,k++}
  if(c.need==='leaves'){cells.forEach(x=>{x.leaf=R()<.4?1:0;x.lr=Math.round(R()*360)});let k=0;while(cells.filter(x=>x.leaf).length<6&&k<99)cells[(R()*cells.length)|0].leaf=1,k++}
  const need=NEEDS.find(n=>n.id===c.need)||{steps:[]};
  return{kind:c.kind,need:c.need,name:c.name,steps:(need.steps||[]).filter(s=>STEPS_READY.includes(s)),cells,wear:{},used:{},drag:null,bloom:null,hintOff:false,doneRatio:{}};
}
function enterSalon(i){
  L.begin();killTool();G.stop();clearFloats();
  const c=lobby[i];if(!c){showLobby();return}
  view='salon';phase='enter';seatIdx=i;c.inside=true;st=freshState(c);cards=null;mirrorShown=false;
  lobbyEl.hidden=true;salonEl.hidden=false;homeBtn.hidden=true;backBtn.hidden=false;
  panel.innerHTML='';tub.classList.remove('on');mirBtn.hidden=true;mirBtn.classList.remove('on');petEl.classList.remove('up');stage.classList.remove('up');
  if(AL){al=AL.attach(petEl,{kind:st.kind});const me=al;L.onEnd(()=>{me.detach();if(al===me)al=null})}
  size();drawPet('idle');drawOver();stars();anim('enter');
  /* bigMoments: comes in with two hops and a wave; moods: dirty = sad, party = happy */
  alMood(c.need==='party'?'happy':'sad');L.later(()=>{alPlay('hop',{n:2,wave:true});if(al)al.sound('hehe')},900);
  const need=NEEDS.find(n=>n.id===c.need)||{},hello=c.need==='party'&&need.say?need.say:(LINE[c.need]||LINE.muddy)(c.name);
  L.later(()=>say(hello[0],hello[1],true),500);
  if(!st.steps.length){L.later(()=>{drawPet('idle');dress()},2600);return}
  L.later(()=>{tub.classList.add('on');noise(.4,{type:'lowpass',freq:900,vol:.2})},2400);
  L.later(()=>nextStep(),3200);
}
function nextStep(){
  const k=st.steps.shift();
  if(!k){tub.classList.remove('on');dress();return}
  toolStep(k);
}
function toolStep(key){
  phase=key;H.dress=false;const T=TOOL_OF[key],lk=T.log;meter(T.icon);prog(0);
  if(key==='foam')alMood('ticklish');else if(key==='dry')alMood('shiver');   // moods: 씻는 중 = 간질간질, 젖음 = 부르르
  /* touch.tool.intro: the tool jumps out of the tray and says its name */
  const nm=TOOL_NAME[key];let introStop=P.toolIntro?P.toolIntro(stage,panel.querySelector('.mi'),T.icon,{ko:nm[0],en:nm[1]}):null;L.onEnd(()=>{if(introStop)introStop()});
  if(key==='foam'){const w=VO.actionWords.rub;say(w.ko,w.en,true);say(LINE.foam[0],LINE.foam[1],true)}   // queued after the tool's name
  else{const w=(key==='rinse'?CF.sound.shower:CF.sound.dryer).warnBefore;LOG.push('warn:'+lk);say(w.ko,w.en,true);say(LINE[key][0],LINE[key][1],true)}
  let lastS=0,lastPop=0,qk=0,belly=0,nose=0,lastF=null,lastT=0;killTool();
  const side=F=>{const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect();return F.x+s.left<r.left+r.width/2?'l':'r'};
  toolE=P.makeTool(stage,{tool:T.icon,effect:T.effect,anchor:T.anchor,gapScale:T.gapScale,cells:CELLS.map(c=>[c.fx,c.fy]),cfg:()=>TOOLS,target:()=>petEl.getBoundingClientRect(),face:faceRect,
    onMiss:miss,
    onTouch:()=>{G.touch();LOG.push('press:'+lk);if(introStop){introStop();introStop=null}if(al)al.setTool(T.alive)},
    onRelease:()=>{G.release();lastF=null;if(al)al.setTool(null)},
    sound:n=>{if(key==='foam')return null;const h=P.holdSound(key==='dry'?'dryer':'shower',{count:key==='dry'&&n===1});LOG.push('sound:'+lk);return h},
    onCell:(i,v,pv,why)=>{const c=st.cells[i];c[key]=v;
      const n=performance.now();
      if(key==='rinse'&&v>=1&&pv<1){const [x,y]=cellXY(i);if(c.foam>.2)spawn(`<circle r="9" fill="none" stroke="#CDE9FA" stroke-width="3"/><circle r="4" fill="#fff"/>`,x,y,'pop',{ms:450});
        if(c.leaf)spawn(LEAF(0,0,c.lr,.9),x,y,'fly',{dx:(Math.random()-.5)*60,dy:90,rot:120,ms:900});
        if(why!=='auto'&&n-lastPop>90){lastPop=n;tone(900+rand(500),.05,'sine',.06)}}
      if(key==='dry'&&v>=.5&&pv<.5&&st.cells[i].rinse>0){const [x,y]=cellXY(i),dir=lastF&&lastF.x>x?-1:1;spawn(DROP(0,0,1),x+6,y-4,'fly',{dx:dir*70,dy:-30,rot:dir*60,ms:650})}
      if(key==='foam'&&v>=1&&pv<1&&why!=='auto'&&n-lastPop>110){lastPop=n;tone(700+rand(600),.05,'sine',.06)}
      rd()},
    onProgress:(p,ratio,why)=>{prog(p);if(key==='foam'&&why==='move'){const n=performance.now();if(n-lastS>130){lastS=n;SFX.scrub()}}
      const k=Math.floor(ratio*3);if(k>qk&&k<3){qk=k;word(key==='foam'?'bubbles':key==='rinse'?'water':'dry')}},
    onMove:(pt,d)=>{lastF=pt;const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect(),px=(pt.x+s.left-r.left)/r.width*200,py=(pt.y+s.top-r.top)/r.height*230;
      if(Math.hypot(px-100,py-196)<34){belly+=d;if(belly>r.width*.9){belly=0;tickle()}}},
    onFrame:(F,t)=>{lastF=F;const dt=lastT?Math.min(.1,(t-lastT)/1000):0;lastT=t;
      /* the side the tool works on (wink, wet ear) and the wind direction (the dryer sits on the other side of the finger) */
      if(al){const sd=side(F);al.setTool(T.alive,{side:sd,wind:key==='dry'?(F.x>stage.clientWidth/2?1:-1):0})}
      if(key==='foam'&&!st.used.sneeze){const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect(),px=(F.x+s.left-r.left)/r.width*200,py=(F.y+s.top-r.top)/r.height*230;
        if(Math.hypot(px-100,py-116)<30){nose+=dt;if(nose>.5)sneeze()}}},
    onAutoFinish:rest=>{rest.slice(0,6).forEach((i,k)=>L.later(()=>{const [x,y]=cellXY(i);spawn(A.twinkle(0,0,10,'#F0D58A'),x,y,'pop',{ms:600})},k*90))},
    onDone:()=>{st.doneRatio[key]=toolE?toolE.doneRatio:0;killTool();if(al)al.setTool(null);G.stop();prog(1);drawPet('happy');drawOver();SFX.sparkle();
      const w=VO.actionWords[key==='foam'?'bubbles':key==='rinse'?'clean':'fluffy'],t=praise(w.ko,w.en);say(t[0],t[1]);
      /* bigMoments: each step ends with a hop and a clap; after rinsing it shakes the water off first */
      if(key==='rinse')L.later(shake,700);else alPlay('clap');
      if(key==='dry')alMood('happy');   // 보송 = 활짝
      L.later(()=>{drawPet('idle');nextStep()},key==='rinse'?2400:1800)}});
  L.onEnd(killTool);
  G.start({type:'scrub',at:()=>petXY(.5,.5),ko:LINE[key][0],en:LINE[key][1]});
}
/* reactions: each at most once per customer (games.petsalon.reactions) */
/* reactions (P12: through Alive). Only the sneeze stays once per customer; giggles and faces keep coming (a few seconds apart) */
function tickle(){const n=performance.now();if(n-lastTickle<4000)return;lastTickle=n;st.used.tickle=1;LOG.push('react:tickle');const m=mood;drawPet('happy');if(al)al.sound('giggle');say(LINE.tickle[0],LINE.tickle[1]);L.later(()=>{if(st)drawPet(m==='happy'?'idle':m)},1000)}
function sneeze(){if(st.used.sneeze)return;st.used.sneeze=1;LOG.push('react:sneeze');drawPet('wow');alPlay('sneeze');say(LINE.sneeze[0],LINE.sneeze[1]);noise(.18,{type:'lowpass',freq:1200,vol:.12});
  const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect(),x=r.left-s.left+r.width/2,y=r.top-s.top+r.height*116/230;
  [-1,0,1].forEach(k=>spawn('<circle r="7" fill="#fff" stroke="#CDE9FA" stroke-width="2"/>',x,y,'fly',{dx:k*40,dy:-40-Math.abs(k)*10,ms:700}));L.later(()=>drawPet('idle'),700)}
function shake(){st.used.shake=1;LOG.push('react:shake');alPlay('shiver');say(LINE.shake[0],LINE.shake[1]);noise(.6,{type:'bandpass',freq:700,q:.8,vol:.08});
  const r=petEl.getBoundingClientRect(),s=stage.getBoundingClientRect(),cx=r.left-s.left+r.width/2,cy=r.top-s.top+r.height*.45;
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;spawn(DROP(0,0,1.1),cx+Math.cos(a)*r.width*.3,cy+Math.sin(a)*r.height*.3,'fly',{dx:Math.cos(a)*70,dy:Math.sin(a)*70,rot:a*57,ms:750})}}
/* a new decoration: turns to look in the mirror and twirls (bigMoments) */
function peek(){if(!st||phase!=='dress')return;st.used.peek=1;LOG.push('react:peek');drawPet('happy');alPlay('peekMirror');tone(1046,.12,'sine',.06);L.later(()=>{if(phase==='dress'&&mood==='happy')drawPet('idle')},2400)}

/* ============================== free dressing (자유 꾸미기) ============================== */
const H={dress:false};
function dress(){
  phase='dress';H.dress=true;killTool();if(al)al.setTool(null);alMood('happy');panel.innerHTML='';tub.classList.remove('on');petEl.classList.add('up');stage.classList.add('up');st.hintOff=false;drawPet('idle');drawOver();
  say(LINE.dress[0],LINE.dress[1],true);
  G.start({type:'tap',at:()=>{const [x,y]=petPt(...SLOT_PT.head);return secXY(x,y)},ko:LINE.dress[0],en:LINE.dress[1]});
}
const wornCount=()=>Object.keys(st?st.wear:{}).length;
function slotAt(e){const [,y]=toPet(e);return y<62?'head':y<142?'face':'neck'}
function itemAt(e){
  for(const k of ['face','head','neck']){if(!st.wear[k]||st.drag===k)continue;const g=overEl.querySelector(`g[data-slot="${k}"]`);if(!g)continue;const r=g.getBoundingClientRect(),m=6;
    if(e.clientX>r.left-m&&e.clientX<r.right+m&&e.clientY>r.top-m&&e.clientY<r.bottom+m)return k}
  return null;
}
/* cards: 3 for the tapped slot; tapping the same slot again shows 3 others */
function openCards(slot,keep){
  if(!st)return;st.hintOff=true;
  if(!(keep&&cards&&cards.slot===slot)){
    const list=WEAR[slot],rot=cards&&cards.slot===slot?cards.rot+1:(st['rot_'+slot]||0);st['rot_'+slot]=rot;
    const start=(rot*3)%list.length,idx=[0,1,2].map(k=>(start+k)%list.length),cols=shuffle(COLORS.map((c,i)=>i)).slice(0,3);
    cards={slot,rot,items:idx.map((ix,k)=>({idx:ix,col:cols[k]}))};
    panel.innerHTML='';say(ASK[slot][0],ASK[slot][1]);
    cards.items.forEach((c,k)=>{const it=WEAR[slot][c.idx],col=COLORS[c.col],b=document.createElement('button');b.className='ps-card in';b.style.animationDelay=(k*60)+'ms';
      b.setAttribute('aria-label',`${col[0]} ${it.ko}`);b.dataset.hex=col[2];b.dataset.k=k;b.innerHTML=`<svg viewBox="-58 -56 116 112"><g transform="${it.card||''}">${it.d(col[2],col[3])}</g></svg>`;panel.appendChild(b)});
  }
  markWorn();drawOver();
}
function markWorn(){if(!cards)return;const w=st.wear[cards.slot];panel.querySelectorAll('.ps-card').forEach((b,k)=>{const c=cards.items[k];b.classList.toggle('worn',!!(w&&c&&w.idx===c.idx&&w.col===c.col))})}
function floatItem(slot,idx,col,vivid,cx,cy,px){
  const it=WEAR[slot][idx],c=COLORS[col],f=document.createElement('div');f.className='ps-float';
  f.innerHTML=`<svg viewBox="-58 -56 116 112">${vivid?it.d(c[4],c[3]):it.d(c[2],c[3])}</svg>`;
  const [x,y]=secXY(cx,cy);Object.assign(f.style,{width:px+'px',height:(px*112/116)+'px',left:(x-px/2)+'px',top:(y-px*112/116/2)+'px'});sec.appendChild(f);return f;
}
function flyTo(f,cx,cy,px,ms,then,fade){
  const r=f.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2),s=px/r.width;
  const a=f.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${s})`,opacity:fade?0:1}],{duration:ms,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'});
  const done=()=>{f.remove();then&&then()};a.onfinish=done;a.oncancel=()=>f.remove();
}
const slotPx=slot=>unitPx()*116*SLOT_SCALE[slot];
const panelPt=()=>{const r=panel.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
/* put an item on (from a card tap or a drop), swapping out what was there */
function putOn(slot,idx,col,fromEl){
  if(!st||phase!=='dress')return;const old=st.wear[slot];
  if(old&&old.idx===idx&&old.col===col){alPlay('hop');sfx.pop();return}
  const [tx,ty]=petPt(...SLOT_PT[slot]);
  if(old){const f=floatItem(slot,old.idx,old.col,true,tx,ty,slotPx(slot)),[px,py]=panelPt();delete st.wear[slot];drawOver();flyTo(f,px,py,80,450,null,true)}
  flying++;
  const done=()=>{flying=Math.max(0,flying-1);if(!st||phase!=='dress')return;
    st.wear[slot]={idx,col};st.bloom={slot,t:performance.now()};LOG.push('wear:'+slot);
    drawPet('happy');drawOver(slot);L.later(()=>{if(st&&st.bloom&&performance.now()-st.bloom.t>=BLOOM){st.bloom=null;drawOver()}},BLOOM+60);
    sfx.pop();SFX.sparkle();const it=WEAR[slot][idx],c=COLORS[col];say(`${c[0]} ${it.ko}!`,`${cap(c[1])} ${it.en}!`);markWorn();if(al)al.sound('wow');
    peek();if(mirBtn.hidden)G.stop();armMirror();
  };
  if(fromEl){flyTo(fromEl,tx,ty,slotPx(slot),350,done)}else done();
}
function takeOff(slot,f){
  if(!st)return;delete st.wear[slot];st.drag=null;LOG.push('off:'+slot);drawOver();markWorn();
  sfx.pop();tone(520,.08,'sine',.1,.05);alPlay('oops');say('어?','Oh?');   // bigMoments: '어?' and touches its head
  const [px,py]=panelPt();if(f)flyTo(f,px,py,70,420,null,true);
  if(!wornCount())hideMirror();
}
function colorNext(slot){
  const w=st.wear[slot];if(!w)return;w.col=(w.col+1)%COLORS.length;st.bloom={slot,t:performance.now()};LOG.push('color:'+slot);
  drawOver(slot);L.later(()=>{if(st&&st.bloom&&performance.now()-st.bloom.t>=BLOOM){st.bloom=null;drawOver()}},BLOOM+60);
  const c=COLORS[w.col];say(c[0]+'!',cap(c[1])+'!');tone(880,.1,'sine',.1);openCards(slot,true);
}
/* the mirror button: shows quietly 8 s after the first item, ends only when pressed */
function armMirror(){if(mirrorShown){showMirror();return}if(mirrorT)return;mirrorT=1;L.later(()=>{mirrorT=0;if(phase!=='dress')return;mirrorShown=true;if(wornCount())showMirror()},MIRROR_AFTER)}
function showMirror(){if(!mirBtn.hidden||phase!=='dress')return;mirBtn.hidden=false;requestAnimationFrame(()=>mirBtn.classList.add('on'));
  G.start({type:'tap',wait:true,quiet:true,after:IDLE_HINT,at:()=>{const r=mirBtn.getBoundingClientRect();return secXY(r.left+r.width/2,r.top+r.height/2)}})}
function hideMirror(){mirBtn.classList.remove('on');mirBtn.hidden=true;G.stop()}

stage.addEventListener('pointerdown',e=>{
  if(view!=='salon')return;e.preventDefault();actx();
  if(phase!=='dress'||!st||e.target.closest('.ps-mirbtn'))return;
  G.touch();
  const k=itemAt(e);
  if(k){dd={slot:k,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{stage.setPointerCapture(e.pointerId)}catch(_){}return}
  if(inPet(e)){const s=slotAt(e);openCards(s);sfx.pop();return}
  miss();
});
stage.addEventListener('pointermove',e=>{
  if(!dd||e.pointerId!==dd.id||!st)return;
  if(!dd.moved&&Math.hypot(e.clientX-dd.x0,e.clientY-dd.y0)>12){dd.moved=true;const w=st.wear[dd.slot];if(!w){dd=null;return}st.drag=dd.slot;drawOver();
    dd.f=floatItem(dd.slot,w.idx,w.col,true,e.clientX,e.clientY,slotPx(dd.slot));tone(520,.06,'triangle',.1)}
  if(dd.moved&&dd.f){const [x,y]=secXY(e.clientX,e.clientY),w=dd.f.offsetWidth,h=dd.f.offsetHeight;dd.f.style.left=(x-w/2)+'px';dd.f.style.top=(y-h/2)+'px'}
});
const endItemDrag=e=>{
  G.release();if(!dd||(e&&e.pointerId!==dd.id))return;const d=dd;dd=null;if(!st||phase!=='dress'){if(d.f)d.f.remove();return}
  if(!d.moved){colorNext(d.slot);return}
  const r=petEl.getBoundingClientRect(),[sx,sy]=petPt(...SLOT_PT[d.slot]),out=e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom||Math.hypot(e.clientX-sx,e.clientY-sy)>r.width*.5;
  if(out)takeOff(d.slot,d.f);
  else flyTo(d.f,sx,sy,slotPx(d.slot),200,()=>{if(st){st.drag=null;drawOver()}});
};
stage.addEventListener('pointerup',endItemDrag);stage.addEventListener('pointercancel',e=>{if(dd&&dd.f){const d=dd;dd=null;d.f.remove();if(st){st.drag=null;drawOver()}}G.release()});
/* cards: tap = put on; drag onto the pet (anywhere on it) = put on; drop elsewhere = goes back */
panel.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.ps-card');if(!b||!cards||phase!=='dress'||cd)return;e.preventDefault();actx();G.touch();
  cd={b,k:+b.dataset.k,slot:cards.slot,id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:false,f:null};try{b.setPointerCapture(e.pointerId)}catch(_){}
});
panel.addEventListener('pointermove',e=>{
  if(!cd||e.pointerId!==cd.id)return;
  if(!cd.moved&&Math.hypot(e.clientX-cd.x0,e.clientY-cd.y0)>12){cd.moved=true;const c=cards&&cards.items[cd.k];if(!c){cd=null;return}cd.item=c;
    cd.f=floatItem(cd.slot,c.idx,c.col,false,e.clientX,e.clientY,cd.b.getBoundingClientRect().width*.9);cd.b.classList.add('lift');tone(520,.06,'triangle',.1)}
  if(cd.moved&&cd.f){const [x,y]=secXY(e.clientX,e.clientY),w=cd.f.offsetWidth,h=cd.f.offsetHeight;cd.f.style.left=(x-w/2)+'px';cd.f.style.top=(y-h/2)+'px'}
});
const endCard=e=>{
  G.release();if(!cd||(e&&e.pointerId!==cd.id))return;const d=cd;cd=null;d.b.classList.remove('lift');
  if(!st||phase!=='dress'||!cards||cards.slot!==d.slot){if(d.f)d.f.remove();return}
  const c=cards.items[d.k];if(!c){if(d.f)d.f.remove();return}
  if(flying){if(d.f)d.f.remove();return}
  if(!d.moved){const r=d.b.getBoundingClientRect();const f=floatItem(d.slot,c.idx,c.col,false,r.left+r.width/2,r.top+r.height/2,r.width*.85);putOn(d.slot,c.idx,c.col,f);return}
  const pr=petEl.getBoundingClientRect(),over=e.clientX>pr.left&&e.clientX<pr.right&&e.clientY>pr.top&&e.clientY<pr.bottom;
  if(over&&e.type!=='pointercancel')putOn(d.slot,c.idx,c.col,d.f);
  else{const r=d.b.getBoundingClientRect();flyTo(d.f,r.left+r.width/2,r.top+r.height/2,r.width*.85,250)}
};
panel.addEventListener('pointerup',endCard);panel.addEventListener('pointercancel',endCard);

/* ---------- mirror moment: spin and smile → soft click → becomes a frame on the shop wall → thank you, wave, out ---------- */
mirBtn.addEventListener('click',()=>{
  if(phase!=='dress'||!st||mirBtn.hidden)return;actx();
  phase='mirror';H.dress=false;G.stop();cards=null;panel.innerHTML='';mirBtn.classList.remove('on');mirBtn.hidden=true;st.hintOff=true;LOG.push('mirror');
  petEl.classList.remove('up');stage.classList.remove('up');drawPet('happy');drawOver();sfx.pop();
  L.later(()=>{alPlay('dance');sweep()},450);   // bigMoments: dance (4 beats), then thanks and a wave
  L.later(()=>{noise(.05,{type:'lowpass',freq:2200,vol:.12});noise(.07,{type:'lowpass',freq:1400,vol:.1,when:.07});photo()},2900);   // the photo after the dance
  L.later(()=>{
    const rec={kind:st.kind,wear:JSON.parse(JSON.stringify(st.wear))};DATA.wall.unshift(rec);DATA.wall=DATA.wall.slice(0,3);DATA.served++;save();stars();
    drawPet('happy');alPlay('wave');say(LINE.thanks[0],LINE.thanks[1]);tone(1318,.4,'sine',.12);tone(1046,.6,'sine',.12,.3)},4300);
  L.later(()=>{anim('leave')},5900);
  L.later(()=>{const c=lobby[seatIdx]||{kind:st.kind};const served={kind:st.kind,wear:st.wear};const i=seatIdx;lobby[i]=c;showLobby({served,slot:i})},6700);
});
function sweep(){[1318,1568,2093].forEach((f,i)=>tone(f,.25,'sine',.06,i*.12))}
function photo(){
  const r=petEl.getBoundingClientRect(),sr=stage.getBoundingClientRect(),w=r.width*.92,h=w*112/100;
  const f=document.createElement('div');f.className='ps-photo';f.innerHTML=FRAME(portrait(st.kind,st.wear));
  Object.assign(f.style,{width:w+'px',height:h+'px',left:(r.left-sr.left+r.width/2-w/2)+'px',top:(r.top-sr.top+r.height*.5-h/2)+'px'});stage.appendChild(f);
  requestAnimationFrame(()=>f.classList.add('on'));
  L.later(()=>{const a=f.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${-(r.left-sr.left)-w*.2}px,${-(r.top-sr.top)-h*.25}px) scale(.3)`,opacity:.2}],{duration:1000,easing:'ease-in',fill:'forwards'});a.onfinish=()=>f.remove()},500);
  L.onEnd(()=>f.remove());
}

/* debug hook for tests */
M.__ps=()=>{
  const grid=Array.from({length:GR[1]},()=>Array(GR[0]).fill(null));const v=toolE?toolE.grid:null;
  if(v)CELLS.forEach((c,i)=>{grid[c.row][c.col]=+v[i].toFixed(3)});
  const tl=stage.querySelector('.tl-tool'),fxs=stage.querySelector('.tl-fx');
  return{view,phase,misses,bar:(panel.querySelector('.mbar i')||{style:{}}).style.width,
    lobby:lobby.map(c=>c&&{kind:c.kind,need:c.need,inside:c.inside}),customer:st?{kind:st.kind,need:st.need,steps:st.steps.slice()}:null,
    grid,cells:toolE?toolE.cellPts().map((p,i)=>({col:CELLS[i].col,row:CELLS[i].row,x:p[0],y:p[1],v:toolE.grid[i]})):[],
    ratio:toolE?toolE.ratio:null,doneRatio:st?Object.assign({},st.doneRatio):{},rub:toolE?toolE.progress:null,
    tool:tl&&tl.style.display==='block'?(r=>({x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,bottom:r.bottom}))(tl.getBoundingClientRect()):null,
    fx:fxs&&fxs.style.display==='block'?{kind:fxs.getAttribute('class'),parts:fxs.childElementCount}:null,
    wear:st?Object.keys(st.wear):[],worn:st?Object.fromEntries(Object.entries(st.wear).map(([k,w])=>[k,{item:WEAR[k][w.idx].en,color:COLORS[w.col][1]}])):{},
    wearCol:st?Object.fromEntries(Object.entries(st.wear).map(([k,w])=>[k,{hex:COLORS[w.col][2],vivid:COLORS[w.col][4]}])):{},
    slotPts:st?Object.fromEntries(SLOTS.map(k=>[k,petPt(...SLOT_PT[k])])):{},
    itemPts:st?Object.fromEntries(Object.keys(st.wear).map(k=>{const g=overEl.querySelector(`g[data-slot="${k}"]`);if(!g)return[k,null];const r=g.getBoundingClientRect();return[k,[r.left+r.width/2,r.top+r.height/2]]})):{},
    cards:cards?{slot:cards.slot,items:cards.items.map(c=>WEAR[cards.slot][c.idx].en)}:null,
    mirror:!mirBtn.hidden,served:DATA.served,wall:DATA.wall.length,frames:framesEl.querySelectorAll('.lb-frame.full').length,
    used:st?Object.keys(st.used):[],guide:G.state(),log:LOG.slice(),alive:al?al.state():null,lobbyAlive:lobbyAl.map(h=>h.state())};
};
function exitAll(){L.begin();killTool();G.stop();clearFloats();lobbyAliveOff();if(al){al.detach();al=null}dd=null;cd=null;cards=null;lobby.forEach(c=>{if(c)c.inside=false})}
games[id]={enter:()=>{requestAnimationFrame(()=>{if(cur()===id)showLobby()})},exit:()=>{exitAll();view='lobby';phase=''},resize:()=>{size();layoutLobby()}};
window.addEventListener('resize',()=>{if(cur()===id){size();layoutLobby()}});

/* tile icon in the salon building */
document.querySelectorAll('.tile[data-go="petsalon"] .ic').forEach(ic=>{ic.innerHTML=A.animal('cat','happy',{bow:'#FF6F91'});const s=ic.querySelector('svg');if(s){s.style.width='1.5em';s.style.height='1.6em'}});
})();
