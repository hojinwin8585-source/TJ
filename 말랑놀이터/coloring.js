/* 색칠 놀이 (P5-가) — 꾸미기 살롱의 새 놀이. 화면 id `coloring`. 공통 틀(ML.Shell)과 단계 엔진(ML.Progress)을 씁니다.
   흐름: 토토가 "무슨 색으로 칠할까?" → 아래 물감 카드(한 번에 3장까지) 하나 콕 → 색 이름을 한국어 다음 영어로 → 그림에서 반짝이는 칸을 콕
         → 그 칸이 콕 한 자리부터 부드럽게 채워지고(0.8초) 차분한 색에서 또렷한 색으로 피어남(calm.colorPolicy.bloomMs) → 칭찬 → 다음 칸.
   칸 밖을 누르면 응원만(틀림 없음). 칸 둘레를 조금 벗어나 눌러도 그 칸으로 인정. 3단계부터는 쓱쓱 문질러도 칠해짐(P1 makeRub).
   4단계는 칸 8개 + 무늬 도장(다 칠한 뒤 별·하트 도장을 콕콕), 가족 얼굴이 저장돼 있으면(ML.Faces) '우리 가족' 그림도 나옴.
   다 칠하면 아이가 그림(또는 오른쪽 아래 액자 그림)을 콕 → 그림이 살짝 움직임(풍선이 떠오름 등) → 조용한 축하 → 별 1칸.
   그림은 이 파일의 ART.COLORING(굵은 갈색 선, 큰 칸, P19 입체감: ART.vol 그라데이션·림 라이트·접지 그림자, 흐림 없음). 글자·이모지 없음.
   숫자는 MLCFG.games.coloring.levels(areas, colors, fill, pictures), calm(choiceColors, colorPolicy, celebration, palette), touch(minTargetPx, rub, tool), progress 에서 읽어요. */
(()=>{
'use strict';
const M=window.ML,P=M&&M.P2,A=window.ART;if(!M||!P||!A||!A.vol||!M.Guide||!M.Shell||!M.Progress)return;
const {say,sfx,tone,games,actx,rand}=M;
const {life,makeRub}=P;
const CF=M.CFG,CALM=CF.calm||{},PAL=CALM.palette||{},POL=CALM.colorPolicy||{},CEL=CALM.celebration||{pieces:6,durationMs:1200};
const CHOICE=(CALM.choiceColors||[]).filter(c=>c&&c.hex&&c.vivid);
const GC=(CF.games||{}).coloring||{},LVS=GC.levels||[];
const TC=CF.touch||{},FOOT=TC.minTargetPx||110;
const PRG=M.Progress,MAXLV=Math.max(1,LVS.length||4);
const OL=A.OL,V=A.vol;
const BLOOM_MS=POL.bloomMs||600;
/* not in config: how long a region takes to fill from the tapped spot (P5 "부드럽게 채워짐(0.8초)"), the outline width in the 300×300 picture,
   how far beside a region a tap still counts (px), what a "tap" is on the rub levels (shorter and smaller than this) */
const FILL_MS=800,LINE=5.5,NEAR_PX=34,TAP_MS=420,TAP_MOVE=14;
const BLANK=PAL.surface||'#FFFDF9';
const cur=()=>M.current();
const id='coloring',L=life(id);
const inner=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const mix=(a,b,t)=>{const p=h=>{if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))},x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const STK=(w)=>`stroke="${OL}" stroke-width="${w||LINE}" stroke-linejoin="round" stroke-linecap="round"`;
const circ=(cx,cy,r)=>`M${cx-r} ${cy}A${r} ${r} 0 1 0 ${cx+r} ${cy}A${r} ${r} 0 1 0 ${cx-r} ${cy}Z`;
const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`;
const SKIN='#F6D5BE',LEAF=PAL.sage||'#A9CFA0',WOOD='#C99A6B',GLASS='#DDEBF0';

/* ============================== ART.COLORING: the pictures ==============================
   Each picture is drawn in a 300×300 box. build(R) returns the markup; R(d) draws one region to colour (its outline, its paper-white
   fill, the paint that grows inside it, the soft light-and-shade overlay and the glow) and returns it in place. Everything else is
   already coloured (calm colours) and never takes a touch. Regions are numbered in the order R is called (= drawing order). */
const face=(cx,cy,s=1,o={})=>{const e=7*s,dx=(o.dx||20)*s;return `<g class="co-face">
  <ellipse cx="${cx-dx-9*s}" cy="${cy+12*s}" rx="${9*s}" ry="${6*s}" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/><ellipse cx="${cx+dx+9*s}" cy="${cy+12*s}" rx="${9*s}" ry="${6*s}" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/>
  <circle cx="${cx-dx}" cy="${cy}" r="${e}" fill="${OL}"/><circle cx="${cx+dx}" cy="${cy}" r="${e}" fill="${OL}"/>
  <circle cx="${cx-dx+2.4*s}" cy="${cy-2.6*s}" r="${2.6*s}" fill="#fff"/><circle cx="${cx+dx+2.4*s}" cy="${cy-2.6*s}" r="${2.6*s}" fill="#fff"/>
  <circle cx="${cx-dx-2*s}" cy="${cy+2.6*s}" r="${1.1*s}" fill="#fff" opacity=".7"/><circle cx="${cx+dx-2*s}" cy="${cy+2.6*s}" r="${1.1*s}" fill="#fff" opacity=".7"/>
  <path d="M${cx-9*s} ${cy+12*s}Q${cx} ${cy+21*s} ${cx+9*s} ${cy+12*s}" fill="none" stroke="${OL}" stroke-width="${3.4*s}" stroke-linecap="round"/></g>`};
const tw=(x,y,r,c)=>`<path d="M${x} ${y-r}Q${x+r*.18} ${y-r*.18} ${x+r} ${y}Q${x+r*.18} ${y+r*.18} ${x} ${y+r}Q${x-r*.18} ${y+r*.18} ${x-r} ${y}Q${x-r*.18} ${y-r*.18} ${x} ${y-r}Z" fill="${c||'#fff'}"/>`;
/* a scalloped flower outline (6 round petals) */
const petals=(cx,cy,r0,r1,n=6)=>{let d='';for(let k=0;k<n;k++){const a0=(k/n)*Math.PI*2-Math.PI/2,a1=((k+1)/n)*Math.PI*2-Math.PI/2,
  p=(a,r)=>(cx+Math.cos(a)*r).toFixed(1)+' '+(cy+Math.sin(a)*r).toFixed(1),c0=a0+(a1-a0)*.1,c1=a0+(a1-a0)*.9;
  d+=(k?'':'M'+p(a0,r0))+'C'+p(c0,r1)+' '+p(c1,r1)+' '+p(a1,r0)}return d+'Z'};

const PICS={
  apple:{ko:'사과',en:'apple',motion:'bounce',build:R=>`${V.ground(150,266,86,10)}<g class="co-move">
    ${R('M150 92C128 70 80 68 62 106C44 144 58 198 90 230C110 250 132 252 150 242C168 252 190 250 210 230C242 198 256 144 238 106C220 68 172 70 150 92Z')}
    <path d="M150 96Q146 66 160 42" fill="none" stroke="${OL}" stroke-width="11" stroke-linecap="round"/><path d="M150 96Q146 66 160 42" fill="none" stroke="#9B6B45" stroke-width="5" stroke-linecap="round"/>
    <path d="M160 66Q188 32 226 46Q200 86 160 66Z" fill="${V.ball(LEAF)}" ${STK(4.5)}/><path d="M168 64Q192 54 214 50" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>
    ${face(150,164,1.15)}${V.shine(98,124,20,11,-35)}${V.rim(150,166,92,78,0,3)}</g>`},
  balloon:{ko:'풍선',en:'balloon',motion:'float',build:R=>`${V.ground(150,290,34,5)}<g class="co-move">
    <path d="M150 228C138 248 164 262 150 286" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
    ${R('M150 30C208 30 240 74 240 120C240 172 198 212 150 216C102 212 60 172 60 120C60 74 92 30 150 30ZM138 230L150 214L162 230Q150 236 138 230Z')}
    ${face(150,122,1.2)}${V.shine(106,78,22,13,-35)}<path d="M92 104Q98 72 124 58" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".5"/>${V.rim(150,122,90,92,0,3)}</g>`},
  flower:{ko:'꽃',en:'flower',motion:'sway',build:R=>`${V.ground(150,288,70,8)}<g class="co-move">
    <path d="M150 150Q144 186 150 222" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M150 150Q144 186 150 222" fill="none" stroke="${mix(LEAF,'#4A2C1E',.12)}" stroke-width="6" stroke-linecap="round"/>
    <path d="M148 196Q118 168 90 182Q116 214 148 202Z" fill="${V.ball(LEAF)}" ${STK(4)}/><path d="M152 184Q182 158 210 170Q186 202 152 192Z" fill="${V.ball(LEAF)}" ${STK(4)}/>
    ${R(petals(150,104,40,104))}
    ${R(circ(150,104,36))}${face(150,100,.95)}
    ${R('M80 198Q80 192 88 192H212Q220 192 220 198V210Q220 216 212 216H88Q80 216 80 210ZM96 216H204L192 276Q190 286 180 286H120Q110 286 108 276Z')}
    ${V.shine(118,60,16,9,-35)}</g>`},
  fish:{ko:'물고기',en:'fish',motion:'swim',build:R=>`<g class="co-move">
    <circle cx="38" cy="96" r="10" fill="#EAF5FC" ${STK(3)}/><circle cx="24" cy="64" r="7" fill="#EAF5FC" ${STK(3)}/><circle cx="44" cy="38" r="5" fill="#EAF5FC" ${STK(2.6)}/>
    ${R('M200 150C220 124 244 98 268 90Q282 88 280 102C274 126 268 140 262 150C268 160 274 174 280 198Q282 212 268 210C244 202 220 176 200 150Z')}
    ${R('M104 96C108 62 146 46 184 58Q194 62 188 72C178 84 170 92 166 96Z')}
    ${R('M48 150C52 104 108 80 156 84C196 88 222 118 224 150C222 182 196 212 156 216C108 220 52 196 48 150Z')}
    <path d="M150 112Q164 150 150 188M178 116Q190 150 178 184" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
    <path d="M120 168Q136 158 150 172Q138 190 120 168Z" fill="#fff" opacity=".5" ${STK(3)}/>
    <circle cx="96" cy="136" r="17" fill="#fff" ${STK(4)}/><circle cx="92" cy="138" r="9" fill="${OL}"/><circle cx="95" cy="134" r="3.2" fill="#fff"/>
    <ellipse cx="96" cy="166" rx="10" ry="6" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/><path d="M62 160Q70 168 78 160" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
    ${V.shine(96,104,22,10,-20)}</g>`},
  house:{ko:'집',en:'house',motion:'hop',build:R=>`${V.ground(150,278,112,9)}<g class="co-move">
    <g class="co-smoke"><circle cx="204" cy="56" r="10" fill="#fff" ${STK(3)}/><circle cx="218" cy="36" r="13" fill="#fff" ${STK(3)}/><circle cx="238" cy="18" r="9" fill="#fff" ${STK(3)}/></g>
    <path d="M190 68H216V128L190 110Z" fill="${V.ball('#D9A18A')}" ${STK(4.5)}/><path d="M184 60H222V72H184Z" fill="${V.ball('#C98C76')}" ${STK(4.5)}/>
    ${R('M76 144H224V262Q224 272 214 272H86Q76 272 76 262Z')}
    ${R('M54 150L150 62L246 150Q250 158 240 160H60Q50 158 54 150Z')}
    ${R('M126 200Q126 178 150 178Q174 178 174 200V272H126Z')}
    <circle cx="164" cy="228" r="4.6" fill="${OL}"/>
    <rect x="88" y="176" width="30" height="30" rx="6" fill="${V.ball(GLASS)}" ${STK(4)}/><path d="M103 176V206M88 191H118" stroke="${OL}" stroke-width="3"/>
    <rect x="182" y="176" width="30" height="30" rx="6" fill="${V.ball(GLASS)}" ${STK(4)}/><path d="M197 176V206M182 191H212" stroke="${OL}" stroke-width="3"/>
    <path d="M150 104c-6-8-17 0-8 8l8 7 8-7c9-8-2-16-8-8z" fill="${PAL.rose||'#E8A0AE'}" ${STK(3)}/>
    <path d="M40 276Q46 262 52 276M248 276Q254 262 260 276M60 278Q64 268 68 278" fill="none" stroke="${mix(LEAF,'#4A2C1E',.2)}" stroke-width="4" stroke-linecap="round"/></g>`},
  butterfly:{ko:'나비',en:'butterfly',motion:'flap',build:R=>`${V.ground(150,262,70,7)}<g class="co-move">
    <path d="M144 80Q128 46 108 40M156 80Q172 46 192 40" fill="none" stroke="${OL}" stroke-width="4" stroke-linecap="round"/><circle cx="106" cy="40" r="7" fill="${PAL.butter||'#F0D58A'}" ${STK(3.5)}/><circle cx="194" cy="40" r="7" fill="${PAL.butter||'#F0D58A'}" ${STK(3.5)}/>
    <g class="co-wl">${R('M144 134C120 82 78 50 46 60C22 68 24 110 40 134C56 154 100 158 144 148Z')}${R('M144 156C114 160 74 172 66 206C62 232 90 242 112 232C132 220 144 190 148 164Z')}
      <circle cx="80" cy="102" r="13" fill="#fff" opacity=".55" ${STK(3)}/><circle cx="104" cy="196" r="10" fill="#fff" opacity=".55" ${STK(3)}/></g>
    <g class="co-wr">${R('M156 134C180 82 222 50 254 60C278 68 276 110 260 134C244 154 200 158 156 148Z')}${R('M156 156C186 160 226 172 234 206C238 232 210 242 188 232C168 220 156 190 152 164Z')}
      <circle cx="220" cy="102" r="13" fill="#fff" opacity=".55" ${STK(3)}/><circle cx="196" cy="196" r="10" fill="#fff" opacity=".55" ${STK(3)}/></g>
    ${R('M150 100C164 100 166 118 164 136C164 176 160 214 150 228C140 214 136 176 136 136C134 118 136 100 150 100Z'+circ(150,88,22))}
    ${face(150,86,.62,{dx:12})}${V.shine(140,74,8,5,-30)}</g>`},
  car:{ko:'자동차',en:'car',motion:'drive',build:R=>`${V.ground(150,244,124,8)}<g class="co-move">
    <path d="M14 254H286" stroke="${OL}" stroke-width="3" stroke-linecap="round" opacity=".25" stroke-dasharray="20 16"/>
    ${R('M86 132Q96 76 128 74H180Q208 76 220 132Z')}
    ${R('M106 128Q114 92 134 90H174Q194 92 202 128Z')}
    ${R('M34 178Q34 134 76 130H230Q268 134 270 176V196Q270 212 254 212H50Q34 212 34 196Z')}
    <circle cx="258" cy="160" r="9" fill="${PAL.butter||'#F0D58A'}" ${STK(3.5)}/><rect x="34" y="158" width="12" height="16" rx="4" fill="${PAL.rose||'#E8A0AE'}" ${STK(3)}/>
    <path d="M152 136V200" stroke="${OL}" stroke-width="3" opacity=".4"/><path d="M164 152H178" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
    <g class="co-wh">${R(circ(92,212,32))}<circle cx="92" cy="212" r="11" fill="#F3EDE6" ${STK(3.5)}/><path d="M92 190V201M92 223V234M70 212H81M103 212H114" stroke="${OL}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
    <g class="co-wh">${R(circ(214,212,32))}<circle cx="214" cy="212" r="11" fill="#F3EDE6" ${STK(3.5)}/><path d="M214 190V201M214 223V234M192 212H203M225 212H236" stroke="${OL}" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>
    ${face(154,108,.6,{dx:14})}${V.shine(120,92,12,6,-20)}</g>`},
  cake:{ko:'케이크',en:'cake',motion:'glow',build:R=>`${V.ground(150,272,120,8)}<g class="co-move">
    ${R('M36 254Q36 242 58 240H242Q264 242 264 254Q264 268 242 270H58Q36 268 36 254Z')}
    <g class="co-flame"><path d="M150 18Q164 34 158 44Q154 50 150 50Q140 48 142 38Q144 28 150 18Z" fill="${PAL.butter||'#F0D58A'}" ${STK(3.5)}/><path d="M150 32Q156 40 150 46Q145 42 150 32Z" fill="#fff" opacity=".8"/></g>
    <path d="M150 52V60" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
    ${R('M136 64Q136 58 142 58H158Q164 58 164 64V112H136Z')}
    <path d="M136 80L164 70M136 98L164 88" stroke="#fff" stroke-width="5" opacity=".6"/>
    ${R('M88 122Q88 108 104 108H196Q212 108 212 122V172H88Z')}
    <path d="M88 124Q88 108 104 108H196Q212 108 212 124Q204 138 196 126Q186 140 174 126Q162 142 150 126Q138 142 126 126Q114 140 104 126Q96 136 88 124Z" fill="#FFF8EE" ${STK(4)}/>
    ${R('M58 186Q58 170 76 170H224Q242 170 242 186V236Q242 248 228 248H72Q58 248 58 236Z')}
    <path d="M58 188Q58 170 76 170H224Q242 170 242 188Q232 204 220 190Q208 206 194 190Q180 208 164 190Q150 208 136 190Q120 208 106 190Q92 206 80 190Q68 202 58 188Z" fill="#FFF8EE" ${STK(4)}/>
    ${R('M150 240C118 222 108 206 118 194C126 184 142 186 150 198C158 186 174 184 182 194C192 206 182 222 150 240Z')}
    ${V.shine(110,128,10,6,-20)}</g>`},
  dress:{ko:'공주 드레스',en:'princess dress',motion:'twirl',build:R=>`${V.ground(150,290,86,7)}<g class="co-move">
    ${R('M104 88C100 42 128 26 150 26C172 26 200 42 196 88C200 116 194 136 182 142H118C106 136 100 116 104 88Z')}
    <path d="M140 104H160V120H140Z" fill="${V.ball(SKIN)}" ${STK(4)}/>
    <path d="M106 150Q92 176 96 198" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M106 150Q92 176 96 198" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/><circle cx="96" cy="202" r="8" fill="${V.ball(SKIN)}" ${STK(3.5)}/>
    <path d="M194 150Q208 176 204 198" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M194 150Q208 176 204 198" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/><circle cx="204" cy="202" r="8" fill="${V.ball(SKIN)}" ${STK(3.5)}/>
    <ellipse cx="150" cy="80" rx="32" ry="34" fill="${V.ball(SKIN,'#E9B49A')}" ${STK(4.5)}/>
    ${face(150,84,.72,{dx:13})}
    <g class="co-skirt">${R('M120 164Q150 176 180 164C206 196 222 220 232 240Q150 258 68 240C78 220 94 196 120 164Z')}
      ${R('M68 240Q150 258 232 240C246 254 246 270 234 278Q214 290 194 284Q172 294 150 286Q128 294 106 284Q86 290 66 278Q54 270 68 240Z')}</g>
    ${R('M126 116Q150 108 174 116L182 166Q150 176 118 166Z')}
    ${R('M130 116C102 98 80 118 84 142C88 164 114 164 128 150Z')}
    ${R('M170 116C198 98 220 118 216 142C212 164 186 164 172 150Z')}
    ${R('M150 180C130 142 100 144 102 180C104 216 134 214 150 192C166 214 196 216 198 180C200 144 170 142 150 180Z')}<circle cx="150" cy="181" r="8" fill="${V.ball('#FFF8EE')}" ${STK(3)}/>
    ${R('M120 52L124 24L138 40L150 16L162 40L176 24L180 52Q150 60 120 52Z')}
    ${V.shine(132,62,10,6,-25)}</g>`},
  bear:{ko:'동물 친구',en:'animal friend',motion:'wave',build:R=>`${V.ground(140,282,96,8)}<g class="co-move">
    <g class="co-bal"><path d="M236 118Q226 146 206 166" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
      ${R(ell(238,72,38,44)+'M228 122L238 112L248 122Q238 127 228 122Z')}${V.shine(222,52,10,7,-30)}</g>
    ${R(circ(94,60,23)+circ(186,60,23))}<circle cx="94" cy="60" r="11" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/><circle cx="186" cy="60" r="11" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/>
    ${R('M90 180C90 154 110 146 140 146C170 146 190 154 190 180V228C190 252 170 262 140 262C110 262 90 252 90 228Z')}
    ${R('M96 170C74 174 62 196 72 208C82 218 98 210 106 196ZM184 168C200 156 210 140 206 128C202 118 190 120 184 132C178 142 176 152 176 160Z')}
    ${R(ell(108,262,28,21)+ell(172,262,28,21))}
    ${R(ell(140,214,32,34))}
    ${R(circ(140,104,56))}
    ${R(ell(140,128,25,19))}
    <ellipse cx="140" cy="118" rx="8" ry="6" fill="${OL}"/><path d="M140 124V132M132 134Q140 140 148 134" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="118" cy="96" r="7" fill="${OL}"/><circle cx="162" cy="96" r="7" fill="${OL}"/><circle cx="120.6" cy="93.4" r="2.6" fill="#fff"/><circle cx="164.6" cy="93.4" r="2.6" fill="#fff"/>
    <ellipse cx="102" cy="122" rx="10" ry="6.5" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/><ellipse cx="178" cy="122" rx="10" ry="6.5" fill="${V.cheek(PAL.rose||'#E8A0AE')}"/>
    ${V.shine(112,72,16,9,-30)}${V.rim(140,104,56,56,0,3)}</g>`},
  /* our family: only when family faces are saved (P4, ML.Faces). One or two photo faces, each in a shirt and trousers to colour */
  family:{ko:'우리 가족',en:'our family',motion:'wave',needs:'faces',build:(R,o)=>{
    const ppl=(o.faces||[]).slice(0,2),two=ppl.length>1,xs=two?[100,200]:[150];
    const person=(f,cx)=>{const sk=(f.look&&f.look.skin)||SKIN;return `
      <path d="M${cx-34} 196Q${cx-52} 212 ${cx-50} 230M${cx+34} 196Q${cx+52} 212 ${cx+50} 230" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/>
      <path d="M${cx-34} 196Q${cx-52} 212 ${cx-50} 230M${cx+34} 196Q${cx+52} 212 ${cx+50} 230" fill="none" stroke="${sk}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="${cx-18}" cy="268" rx="15" ry="8" fill="${V.ball('#8A6A5A')}" ${STK(3.5)}/><ellipse cx="${cx+18}" cy="268" rx="15" ry="8" fill="${V.ball('#8A6A5A')}" ${STK(3.5)}/>
      ${R(`M${cx-34} 216H${cx+34}V258Q${cx+34} 264 ${cx+28} 264H${cx+6}V240H${cx-6}V264H${cx-28}Q${cx-34} 264 ${cx-34} 258Z`)}
      ${R(`M${cx-38} 198C${cx-38} 170 ${cx-22} 160 ${cx} 160C${cx+22} 160 ${cx+38} 170 ${cx+38} 198V224H${cx-38}Z`)}
      <ellipse cx="${cx}" cy="120" rx="32" ry="38" fill="${V.ball(sk)}"/>
      <clipPath id="${o.uid}f${cx}"><ellipse cx="${cx}" cy="120" rx="32" ry="38"/></clipPath>
      <image href="${f.photo}" x="${cx-32}" y="82" width="64" height="76" preserveAspectRatio="xMidYMid slice" clip-path="url(#${o.uid}f${cx})"/>
      <ellipse cx="${cx}" cy="120" rx="32" ry="38" fill="none" ${STK(4)}/>`};
    /* a heart balloon: tip at (x, y+56), 64 wide */
    const heart=(x,y)=>`M${x} ${y+56}C${x-32} ${y+36} ${x-36} ${y+12} ${x-22} ${y}C${x-12} ${y-8} ${x-2} ${y-2} ${x} ${y+6}C${x+2} ${y-2} ${x+12} ${y-8} ${x+22} ${y}C${x+36} ${y+12} ${x+32} ${y+36} ${x} ${y+56}Z`;
    const flower=(x,y)=>`M${x} ${y+30}Q${x-12} ${y+8} ${x} ${y-4}Q${x+12} ${y-12} ${x+18} ${y+2}Q${x+26} ${y-14} ${x+38} ${y-4}Q${x+46} ${y+10} ${x+32} ${y+26}Q${x+18} ${y+40} ${x} ${y+30}Z`;
    const hx=two?150:236,hy=two?18:102;
    return `<g class="co-move">
      ${R('M18 252Q80 236 150 246Q220 236 282 252V280Q282 290 272 290H28Q18 290 18 280Z')}
      <g>${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180;return `<path d="M${(46+Math.cos(r)*33).toFixed(1)} ${(46+Math.sin(r)*33).toFixed(1)}L${(46+Math.cos(r)*44).toFixed(1)} ${(46+Math.sin(r)*44).toFixed(1)}" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`}).join('')}</g>
      ${R(circ(46,46,26))}
      ${R('M214 50Q214 30 234 30Q242 16 260 22Q280 20 282 40Q296 44 292 60Q290 72 276 72H226Q212 70 214 50Z')}
      ${ppl.map((f,i)=>person(f,xs[i])).join('')}
      <g class="co-bal"><path d="M${hx} ${hy+58}Q${two?146:228} ${two?140:170} ${two?136:200} ${two?200:228}" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>
        ${R(heart(hx,hy))}${V.shine(hx-14,hy+12,7,5,-30)}</g>
      ${two?'':R(flower(246,226))+R(flower(14,226))}</g>`}}
};
window.ART.COLORING=PICS;

/* which drawing each picture name in games.coloring.levels[].pictures means (config holds the Korean names; drawings are code) */
const KEY_OF={'사과':'apple','풍선':'balloon','꽃':'flower','물고기':'fish','집':'house','나비':'butterfly','자동차':'car','케이크':'cake','공주 드레스':'dress','동물 친구':'bear','우리 가족':'family'};
const LVL=n=>{const c=LVS[n-1]||{};return{areas:c.areas||[1,3,5,8][n-1]||1,colors:c.colors||[2,3,5,8][n-1]||2,fill:String(c.fill||''),pictures:(c.pictures||[]).map(p=>KEY_OF[p]).filter(k=>PICS[k])}};
const facesOK=()=>{try{return !!(A.person&&M.Faces&&typeof M.Faces.list==='function'&&M.Faces.list().length)}catch(e){return false}};
const faceRecs=()=>{try{return M.Faces.list().slice(0,2).map(r=>({photo:r.photo,look:M.Faces.look?M.Faces.look(r):{}}))}catch(e){return[]}};

/* render a picture: o.pre = colours for a finished preview (level-up moment, tile) */
let UID=0;
function render(key,o={}){
  const pic=PICS[key],uid='co'+(++UID),regs=[];let defs='';
  const R=(d)=>{const i=regs.length;regs.push({d});defs+=`<clipPath id="${uid}c${i}"><path d="${d}"/></clipPath>`;
    const pre=o.pre?o.pre[i%o.pre.length]:null;
    return `<g class="co-reg" data-i="${i}"><path class="co-base" d="${d}" fill="${pre?V.ball(pre):BLANK}"/>
      <g class="co-dabs" clip-path="url(#${uid}c${i})"></g><g class="co-paint" clip-path="url(#${uid}c${i})"></g><g class="co-stamps" clip-path="url(#${uid}c${i})"></g>
      <g class="co-lit">${V.lit(`<path d="${d}" fill="#000"/>`)}</g><path class="co-glow" d="${d}" fill="${PAL.butter||'#F0D58A'}"/>
      <path class="co-line" d="${d}" fill="none" ${STK()}/></g>`};
  const body=pic.build(R,Object.assign({uid},o));
  return{svg:`<svg class="co-pic co-k-${key}" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><defs>${defs}</defs>${body}</svg>`,n:regs.length,regs};
}

/* ============================== small drawn pieces ============================== */
/* a paint pot (card): calm colour (colorPolicy.choosing) */
const potSVG=c=>{const top='M20 42Q22 24 50 24Q78 24 80 42Q82 52 72 50Q70 62 63 52Q56 60 50 50Q41 62 36 50Q26 54 20 42Z',body='M24 46Q22 82 30 88Q50 98 70 88Q78 82 76 46Z',paint='M25 56Q50 64 75 56Q76 82 70 88Q50 98 30 88Q24 82 25 56Z';
  return `<svg viewBox="0 0 100 100">${V.ground(50,95,32,4)}<path d="${body}" fill="#FFF8EE" ${STK(3.5)}/><path d="${paint}" fill="${V.ball(c)}"/>${V.lit(`<path d="${paint}" fill="#000"/>`)}
  <path d="${top}" fill="${V.ball(c)}" ${STK(3.5)}/>${V.lit(`<path d="${top}" fill="#000"/>`)}<path d="${body}" fill="none" ${STK(3.5)}/>
  <circle cx="41" cy="72" r="3.4" fill="${OL}"/><circle cx="59" cy="72" r="3.4" fill="${OL}"/><circle cx="42.2" cy="70.8" r="1.2" fill="#fff"/><circle cx="60.2" cy="70.8" r="1.2" fill="#fff"/>
  <path d="M45 79Q50 83 55 79" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>${V.shine(36,34,9,5,-20)}<path d="M30 58Q30 76 34 84" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".55"/></svg>`};
/* a brush (tip colour = the chosen paint), tip at the bottom middle */
const brushSVG=c=>`<svg viewBox="0 0 60 140"><path d="M24 6Q30 2 36 6L34 70H26Z" fill="${V.ball(WOOD)}" ${STK(3.5)}/><path d="M23 70H37L38 90H22Z" fill="${V.ball('#D8D2CC')}" ${STK(3.5)}/>
  <path d="M22 90H38Q44 112 30 134Q16 112 22 90Z" fill="${c?V.ball(c):'#F3EBDD'}" ${STK(3.5)}/><path d="M27 96Q24 110 28 122" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".55"/></svg>`;
/* a jar of water with two brushes (beside Toto); the front brush shows the chosen paint */
const jarSVG=c=>`<svg viewBox="0 0 120 150" style="overflow:visible">${V.ground(60,146,46,5)}
  <g transform="translate(16 2) rotate(-14 30 70)">${inner(brushSVG(mix(PAL.sky||'#A7CFE8','#fff',.2)))}</g>
  <g class="co-jbrush" transform="translate(48 -6) rotate(12 30 70)">${inner(brushSVG(c))}</g>
  <path d="M18 70Q16 132 26 140Q60 152 94 140Q104 132 102 70Z" fill="#EAF5FC" opacity=".85" ${STK(3.5)}/><path d="M20 96Q60 104 100 96Q102 132 94 140Q60 152 26 140Q18 132 20 96Z" fill="#CFE5F4" opacity=".8"/>
  <ellipse cx="60" cy="70" rx="42" ry="9" fill="#F6FBFE" ${STK(3.5)}/><path d="M30 86Q28 116 34 132" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`;
const frameSVG=`<svg viewBox="0 0 100 100"><rect x="12" y="14" width="76" height="70" rx="9" fill="${V.ball(PAL.butter||'#F0D58A')}" ${STK(3.5)}/><rect x="24" y="26" width="52" height="46" rx="5" fill="#FFFDF9" ${STK(3)}/>
  <path d="M30 66L44 48L54 58L62 50L72 66Z" fill="${PAL.sage||'#A9CFA0'}" ${STK(2.6)}/><circle cx="62" cy="38" r="6" fill="${PAL.rose||'#E8A0AE'}" ${STK(2.6)}/>
  <path d="M80 6l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="${PAL.butter||'#F0D58A'}" ${STK(2.4)}/></svg>`;
/* pattern stamps (level 4) */
const STAMP={
  star:{ko:'별 도장',en:'Star stamp',mark:(x,y,s)=>`<path d="M${x} ${y-9*s}L${x+2.7*s} ${y-2.8*s}L${x+9*s} ${y-2.2*s}L${x+4.2*s} ${y+2.2*s}L${x+5.6*s} ${y+8.6*s}L${x} ${y+5.2*s}L${x-5.6*s} ${y+8.6*s}L${x-4.2*s} ${y+2.2*s}L${x-9*s} ${y-2.2*s}L${x-2.7*s} ${y-2.8*s}Z" fill="#FFFDF9" stroke="${OL}" stroke-width="${1.6*s}" stroke-linejoin="round"/>`},
  heart:{ko:'하트 도장',en:'Heart stamp',mark:(x,y,s)=>`<path d="M${x} ${y+8*s}C${x-12*s} ${y} ${x-9*s} ${y-9*s} ${x} ${y-4*s}C${x+9*s} ${y-9*s} ${x+12*s} ${y} ${x} ${y+8*s}Z" fill="#FFFDF9" stroke="${OL}" stroke-width="${1.6*s}" stroke-linejoin="round"/>`},
  dot:{ko:'동글 도장',en:'Dot stamp',mark:(x,y,s)=>`<circle cx="${x}" cy="${y}" r="${6.5*s}" fill="#FFFDF9" stroke="${OL}" stroke-width="${1.6*s}"/>`}
};
const stampCardSVG=k=>`<svg viewBox="0 0 100 100">${V.ground(50,95,30,4)}<path d="M36 12Q50 4 64 12L60 44H40Z" fill="${V.ball(WOOD)}" ${STK(3.5)}/><path d="M22 46H78Q84 46 84 52V60H16V52Q16 46 22 46Z" fill="${V.ball('#E9D3B0')}" ${STK(3.5)}/>
  <g transform="translate(50 76) scale(1.5)">${STAMP[k].mark(0,0,1.6).replace(/#FFFDF9/,PAL.lilac||'#C3B4E6')}</g>${V.shine(44,14,6,3,-20)}</svg>`;
const STAR_FX=c=>`<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.2 6.6.6-5 4.4 1.5 6.6L12 16.4 6.3 19.8l1.5-6.6-5-4.4 6.6-.6z" fill="${c}" stroke="${OL}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const HEART_FX=c=>`<svg viewBox="0 0 24 24"><path d="M12 21C-4 10 4 1 12 7C20 1 28 10 12 21Z" fill="${c}" stroke="${OL}" stroke-width="1.4"/></svg>`;
const dropSVG=c=>`<svg viewBox="0 0 40 40"><path d="M20 4Q32 18 32 26Q32 36 20 36Q8 36 8 26Q8 18 20 4Z" fill="${c?V.ball(c):'#F3EBDD'}" ${STK(3)}/>${c?'<path d="M14 24Q14 18 18 14" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>':''}</svg>`;

/* ============================== styles ============================== */
const css=`
.co-screen .sh-head .co-stars{display:flex;flex:none;margin-left:auto}
.co-stage{background:#F7EEE3;touch-action:none;user-select:none;-webkit-user-select:none}
.co-stage>svg.co-bg{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.co-paper{position:absolute;z-index:2;background:#FFFDF9;border-radius:22px;pointer-events:none;box-shadow:0 5px 0 rgba(91,74,66,.1),0 9px 16px rgba(91,74,66,.1);transition:box-shadow .4s}
.co-paper>svg.co-pic{position:absolute;left:4%;top:4%;width:92%;height:92%;display:block}
.co-paper .co-tape{position:absolute;top:-10px;width:62px;height:24px;border-radius:5px;background:color-mix(in srgb,${PAL.butter||'#F0D58A'} 70%,#fff);opacity:.9;box-shadow:0 2px 0 rgba(91,74,66,.08)}
.co-paper.co-ready{animation:coready 1.6s ease-in-out infinite}
@keyframes coready{0%,100%{box-shadow:0 5px 0 rgba(91,74,66,.1),0 0 0 0 rgba(240,213,138,0)}50%{box-shadow:0 5px 0 rgba(91,74,66,.1),0 0 0 9px color-mix(in srgb,${PAL.butter||'#F0D58A'} 75%,transparent)}}
.co-pic *{pointer-events:none}
.co-pic .co-glow{opacity:0}
.co-pic .co-reg.next .co-glow{animation:coglow 1.4s ease-in-out infinite}
@keyframes coglow{0%,100%{opacity:.1}50%{opacity:.62}}
.co-pic .co-reg.done .co-lit{opacity:1}
.co-pic .co-lit{opacity:.55}
.co-pic .co-flame{opacity:0}
.co-pic .co-smoke{opacity:0}
.co-tw{position:absolute;z-index:6;width:34px;height:34px;margin:-17px 0 0 -17px;pointer-events:none;animation:cotw 1.4s ease-in-out infinite}
.co-tw svg{width:100%;height:100%;display:block}
@keyframes cotw{0%,100%{transform:scale(.7) rotate(0);opacity:.75}50%{transform:scale(1.1) rotate(18deg);opacity:1}}
.co-toto{position:absolute;z-index:4;pointer-events:none}
.co-toto>div{width:100%;height:100%}.co-toto svg{width:100%;height:100%;display:block;overflow:visible}
.co-jar{position:absolute;z-index:3;pointer-events:none}
.co-jar svg{width:100%;height:100%;display:block;overflow:visible}
.co-tray{display:flex;align-items:center;justify-content:center;gap:12px}
.co-tray .sh-cards{transition:padding .2s}
.co-tray.co-st .sh-cards{justify-content:flex-start;padding-right:${Math.max(FOOT,96)+10}px;box-sizing:border-box}
.co-tray .sh-card{transition:transform .2s,box-shadow .2s}
.co-tray .sh-card.co-sel{transform:translateY(-8px);box-shadow:0 10px 0 rgba(91,74,66,.12),0 0 0 6px color-mix(in srgb,${PAL.butter||'#F0D58A'} 85%,#fff)}
.co-tray .sh-card.co-wig{animation:cowig .6s ease-in-out}
@keyframes cowig{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}60%{transform:rotate(5deg)}}
.co-fx{position:absolute;z-index:30;pointer-events:none;width:30px;height:30px;margin:-15px 0 0 -15px}
.co-fx svg{display:block;width:100%;height:100%}
/* the finished picture moves a little (calm: under 14px, under 8°) */
.co-pic .co-move,.co-pic .co-wl,.co-pic .co-wr,.co-pic .co-skirt,.co-pic .co-bal{transform-box:view-box}
.co-pic .co-move{transform-origin:150px 270px}
.co-fin-bounce .co-move,.co-fin-hop .co-move,.co-fin-glow .co-move,.co-fin-wave .co-move{animation:cobounce .9s ease-in-out 3}
@keyframes cobounce{0%,100%{transform:translateY(0) scale(1,1)}30%{transform:translateY(-13px) scale(.97,1.03)}62%{transform:translateY(0) scale(1.04,.96)}}
.co-fin-float .co-move{animation:cofloat 3.2s ease-in-out forwards}
@keyframes cofloat{0%{transform:translateY(0) rotate(0)}25%{transform:translateY(-7px) rotate(-4deg)}50%{transform:translateY(-13px) rotate(3deg)}75%{transform:translateY(-11px) rotate(-2deg)}100%{transform:translateY(-13px) rotate(0)}}
.co-fin-sway .co-move{animation:cosway 1.5s ease-in-out 2}
@keyframes cosway{0%,100%{transform:rotate(0)}30%{transform:rotate(-6deg)}70%{transform:rotate(6deg)}}
.co-fin-swim .co-move{transform-origin:150px 150px;animation:coswim 1.6s ease-in-out 2}
@keyframes coswim{0%,100%{transform:translateX(0) rotate(0)}30%{transform:translateX(-13px) rotate(-4deg)}70%{transform:translateX(13px) rotate(4deg)}}
.co-fin-hop .co-smoke,.co-fin-glow .co-flame{animation:cofade 2.7s ease-in-out forwards}
@keyframes cofade{0%{opacity:0}20%,80%{opacity:1}100%{opacity:1}}
.co-fin-glow .co-flame{transform-box:fill-box;transform-origin:50% 100%;animation:cofade 2.7s ease-in-out forwards,coflick .5s ease-in-out 6}
@keyframes coflick{0%,100%{transform:scale(1,1)}50%{transform:scale(.9,1.1)}}
.co-pic .co-wl,.co-pic .co-wr{transform-origin:150px 150px}
.co-fin-flap .co-wl,.co-fin-flap .co-wr{animation:coflap .5s ease-in-out 6}
@keyframes coflap{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.62)}}
.co-fin-flap .co-move{animation:cohover 3s ease-in-out}
@keyframes cohover{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.co-fin-drive .co-move{animation:codrive 1.6s ease-in-out 2}
@keyframes codrive{0%,100%{transform:translateX(0)}35%{transform:translateX(-13px)}75%{transform:translateX(13px)}}
.co-pic .co-wh{transform-box:fill-box;transform-origin:50% 50%}
.co-fin-drive .co-wh{animation:cospin .8s linear 4}
@keyframes cospin{to{transform:rotate(360deg)}}
.co-pic .co-skirt{transform-origin:150px 166px}
.co-fin-twirl .co-skirt{animation:coskirt .75s ease-in-out 4}
@keyframes coskirt{0%,100%{transform:skewX(0)}30%{transform:skewX(-6deg)}70%{transform:skewX(6deg)}}
.co-fin-twirl .co-move{animation:cobounce 1s ease-in-out 3}
.co-pic .co-bal{transform-origin:206px 170px}
.co-fin-wave .co-bal{animation:cosway 1.2s ease-in-out 2}
.co-pic .co-stamp{transform-box:fill-box;transform-origin:50% 50%;animation:costamp .35s cubic-bezier(.3,1.5,.5,1)}
@keyframes costamp{from{transform:scale(.3)}}
`;
const stEl=document.createElement('style');stEl.textContent=css;document.head.appendChild(stEl);

/* ============================== the screen ============================== */
PRG.register(id,{max:MAXLV,name:'색칠 놀이'});
const S=M.Shell.screen(id,{title:'색칠 놀이',place:'salon',cls:'co-screen',stageClass:'co-stage',trayClass:'co-tray',after:'<div class="co-stars"></div>'});
const {sec,stage,tray,strip}=S,starsEl=sec.querySelector('.co-stars');
const G=M.Guide.make(sec,{say});
const lvOf=()=>Math.max(1,Math.min(MAXLV,(PRG.get(id).level|0)||1));
let st=null,first=true,lastPic='',forcePic='',al=null,rubs=[];
const LOG=[];
const PRAISE=[['예쁘다!','Beautiful!'],['우와, 멋지다!','Wow, so nice!'],['색이 참 곱다!','What a lovely color!'],['예쁘게 칠했네!','You painted it so well!']];
let praiseI=0;
const CHEER=[['반짝이는 곳을 콕 해 볼까?','Tap the sparkly spot!'],['여기 반짝반짝! 콕!','It is sparkly here! Tap!'],['괜찮아, 반짝이는 칸을 콕!','That is okay! Tap the sparkly part!']];
let cheerI=0;

function bgSVG(W,H,fy){return `<svg class="co-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="cowall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF2E6"/><stop offset="1" stop-color="#F4E4D2"/></linearGradient>
  <linearGradient id="cofloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBD3B2"/><stop offset="1" stop-color="#E0C29B"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#cowall)"/><rect x="0" y="${fy}" width="${W}" height="${H-fy}" fill="url(#cofloor)"/><rect x="0" y="${fy}" width="${W}" height="6" fill="#D6B98F"/>
  <ellipse cx="${W*.5}" cy="${fy+(H-fy)*.6}" rx="${W*.46}" ry="${(H-fy)*.32}" fill="${mix(PAL.lilac||'#C3B4E6','#fff',.45)}" opacity=".55"/></svg>`}

/* layout: a big square paper at the top, Toto and the brush jar on the floor below */
function geo(){
  const W=stage.clientWidth,H=stage.clientHeight,side=Math.round(Math.max(200,Math.min(W-12,H-128))),px=Math.round((W-side)/2),py=8;
  const floor=py+side-24,th=Math.round(Math.min(190,Math.max(120,H-(py+side)+52))),tw=Math.round(th*200/230);
  const jh=Math.round(Math.min(150,th*.82)),jw=Math.round(jh*120/150);
  return{W,H,side,px,py,floor,toto:{x:4,y:H-th-2,w:tw,h:th},jar:{x:W-jw-10,y:H-jh-6,w:jw,h:jh}};
}
function place(){
  const g=st.g=geo();
  stage.querySelector('svg.co-bg').outerHTML=bgSVG(g.W,g.H,g.floor);
  Object.assign(st.paper.style,{left:g.px+'px',top:g.py+'px',width:g.side+'px',height:g.side+'px'});
  Object.assign(st.toto.style,{left:g.toto.x+'px',top:g.toto.y+'px',width:g.toto.w+'px',height:g.toto.h+'px'});
  Object.assign(st.jar.style,{left:g.jar.x+'px',top:g.jar.y+'px',width:g.jar.w+'px',height:g.jar.h+'px'});
  st.regs.forEach(r=>{r.anchor=null});anchors();twinkle();
}
function build(){
  stage.innerHTML=`<svg class="co-bg"></svg>`;
  const paper=document.createElement('div');paper.className='co-paper';paper.innerHTML=`<i class="co-tape" style="left:14%;transform:rotate(-6deg)"></i><i class="co-tape" style="right:14%;transform:rotate(5deg)"></i>`+st.view.svg;
  stage.appendChild(paper);st.paper=paper;st.svg=paper.querySelector('svg.co-pic');
  st.regs=[...st.svg.querySelectorAll('.co-reg')].map((g,i)=>({i,g,base:g.querySelector('.co-base'),paint:g.querySelector('.co-paint'),dabs:g.querySelector('.co-dabs'),stamps:g.querySelector('.co-stamps'),
    done:false,color:null,anchor:null,pre:i>=st.areas}));
  /* a picture with more regions than this level's areas: the extra ones come already painted (calm colour) */
  st.regs.forEach(r=>{if(r.pre){const c=st.colors[r.i%st.colors.length];r.base.setAttribute('fill',V.ball(c.hex));r.g.classList.add('done');r.done=true;r.color=c}});
  const toto=document.createElement('div');toto.className='co-toto';toto.innerHTML=`<div>${A.animal('bunny','happy')}</div>`;stage.appendChild(toto);st.toto=toto;
  if(al){try{al.detach()}catch(e){}al=null}
  try{al=M.Alive.attach(toto.firstChild,{kind:'bunny'})}catch(e){al=null}
  const jar=document.createElement('div');jar.className='co-jar';jar.innerHTML=jarSVG(null);stage.appendChild(jar);st.jar=jar;
  const t=document.createElement('div');t.className='co-tw';t.innerHTML=STAR_FX(PAL.butter||'#F0D58A');t.hidden=true;stage.appendChild(t);st.tw=t;
  place();
}

/* ---------- geometry: client ↔ picture ---------- */
function toLocal(el,cx,cy){const m=el.getScreenCTM();if(!m)return null;const p=st.svg.createSVGPoint();p.x=cx;p.y=cy;return p.matrixTransform(m.inverse())}
function toClient(el,x,y){const m=el.getScreenCTM();if(!m)return null;const p=st.svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(m);return{x:q.x,y:q.y}}
let CTM=null;   // inverse screen matrices, kept only during one long look (anchors)
function inFill(r,cx,cy){let q;if(CTM){let m=CTM[r.i];if(m===undefined){const s=r.base.getScreenCTM();m=CTM[r.i]=s?s.inverse():null}if(!m)return false;const p=st.svg.createSVGPoint();p.x=cx;p.y=cy;q=p.matrixTransform(m)}else q=toLocal(r.base,cx,cy);
  if(!q)return false;try{return r.base.isPointInFill(q)}catch(e){return false}}
/* the region drawn on top at this point (-1: none) */
function hitAt(cx,cy){for(let i=st.regs.length-1;i>=0;i--)if(inFill(st.regs[i],cx,cy))return i;return -1}
/* forgiving: right on a region, else around the finger (votes), else beside an undone region's box (NEAR_PX) */
function regionAt(cx,cy){
  const h=hitAt(cx,cy);if(h>=0)return h;
  const votes={},rad=22;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;for(const f of [.5,1]){const j=hitAt(cx+Math.cos(a)*rad*f,cy+Math.sin(a)*rad*f);if(j>=0&&!st.regs[j].done)votes[j]=(votes[j]||0)+1}}
  const best=Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0];if(best!=null)return +best;
  let bi=-1,bd=1e9;st.regs.forEach((r,i)=>{if(r.done)return;const b=r.base.getBoundingClientRect(),dx=Math.max(b.left-cx,0,cx-b.right),dy=Math.max(b.top-cy,0,cy-b.bottom),d=Math.hypot(dx,dy);if(d<bd){bd=d;bi=i}});
  return bd<=NEAR_PX?bi:-1;
}
/* a point surely inside each region (for the guide hand, the twinkle and the tests) */
function anchors(){
  CTM={};
  st.regs.forEach(r=>{
    let bb;try{bb=r.base.getBBox()}catch(e){return}
    const pts=[];for(let a=1;a<12;a++)for(let b=1;b<12;b++){const x=bb.x+bb.width*a/12,y=bb.y+bb.height*b/12,c=toClient(r.base,x,y);if(c&&hitAt(c.x,c.y)===r.i)pts.push([x,y])}
    if(!pts.length){r.anchor=[bb.x+bb.width/2,bb.y+bb.height/2];return}
    const mx=pts.reduce((s,p)=>s+p[0],0)/pts.length,my=pts.reduce((s,p)=>s+p[1],0)/pts.length;
    pts.sort((p,q)=>Math.hypot(p[0]-mx,p[1]-my)-Math.hypot(q[0]-mx,q[1]-my));r.anchor=pts[0];
  });
  CTM=null;
}
const anchorClient=r=>{if(!r.anchor)anchors();return toClient(r.base,r.anchor[0],r.anchor[1])||{x:0,y:0}};
const secXY=(x,y)=>{const sr=sec.getBoundingClientRect();return[x-sr.left,y-sr.top]};
const stageXY=(x,y)=>{const r=stage.getBoundingClientRect();return[x-r.left,y-r.top]};

/* ---------- which region glows: the first undone one in drawing order (big ones first in each picture) ---------- */
const nextReg=()=>st.regs.find(r=>!r.done);
function glow(){
  st.regs.forEach(r=>r.g.classList.remove('next'));
  const r=nextReg();if(r&&(st.phase==='paint'||st.phase==='pick'))r.g.classList.add('next');twinkle();
}
function twinkle(){
  if(!st||!st.tw)return;const r=nextReg();
  if(!r||st.phase!=='paint'){st.tw.hidden=true;return}
  const c=anchorClient(r),[x,y]=stageXY(c.x,c.y);st.tw.style.left=(x+16)+'px';st.tw.style.top=(y-18)+'px';st.tw.hidden=false;
}
function renderStrip(){
  const icons=st.regs.filter(r=>!r.pre).map(r=>dropSVG(r.done&&r.color?r.color.vivid:null)).concat([frameSVG]);
  M.Shell.steps(strip,icons,st.regs.filter(r=>!r.pre&&r.done).length+(st.phase==='done'?1:0));
}

/* ---------- the paint cards: up to 3 at a time; with more colours the next 3 come after each region (no sideways scroll) ---------- */
function cardSet(){
  const n=st.colors.length;if(n<=3)return st.colors.map((c,i)=>i);
  const out=[];for(let k=0;k<3;k++)out.push((st.rot*3+k)%n);return out;
}
function renderCards(){
  tray.classList.remove('co-st');tray.innerHTML='';
  const items=cardSet().map(i=>{const c=st.colors[i];return{svg:potSVG(c.hex),ko:c.ko,en:c.en,v:i}});
  const box=M.Shell.cards(items,(it,b)=>pick(it.v,b));tray.appendChild(box);
}
function pick(i,b){
  if(!st||(st.phase!=='pick'&&st.phase!=='paint'))return;
  actx();G.touch();G.release();
  st.sel=i;st.phase='paint';LOG.push('pick:'+st.colors[i].en);
  tray.querySelectorAll('.sh-card').forEach(x=>x.classList.toggle('co-sel',x===b));
  st.jar.innerHTML=jarSVG(st.colors[i].hex);
  stage.querySelectorAll('.rub-tool').forEach(t=>{t.innerHTML=brushSVG(st.colors[i].hex)});
  if(al){try{al.setMood('happy')}catch(e){}}
  if(st.firstPick){st.firstPick=false;say('반짝이는 곳을 콕!','Tap the sparkly spot!',true)}
  glow();aimPaint();
}
function aimPick(){
  G.start({type:'tap',after:2000,ko:st.firstAsk?'무슨 색으로 칠할까?':'다음은 무슨 색?',en:st.firstAsk?'What color?':'What color next?',
    at:()=>{const cs=tray.querySelectorAll('.sh-card'),b=cs[Math.floor(cs.length/2)];if(!b)return[0,0];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2-8,r.top+r.height/2-10)}});
}
function aimPaint(){
  const r=nextReg();if(!r){G.stop();return}
  G.start({type:'tap',after:2000,ko:'반짝이는 곳을 콕!',en:'Tap the sparkly spot!',at:()=>{const n=nextReg();if(!n)return[0,0];const c=anchorClient(n);return secXY(c.x-8,c.y-10)}});
}

/* ---------- painting ---------- */
function fill(i,cx,cy,quick){
  const r=st.regs[i];if(!r||r.done)return;
  const c=st.colors[st.sel];if(!c)return;
  r.done=true;r.color=c;st.phase='filling';st.busy=true;G.stop();LOG.push('fill:'+i+':'+c.en);
  if(r.rub)try{r.rub.stop()}catch(e){}
  r.g.classList.remove('next');r.g.classList.add('done');st.tw.hidden=true;
  let q=toLocal(r.base,cx,cy);let bb;try{bb=r.base.getBBox()}catch(e){bb={x:0,y:0,width:300,height:300}}
  if(!q||!isFinite(q.x))q={x:bb.x+bb.width/2,y:bb.y+bb.height/2};
  const far=Math.max(...[[bb.x,bb.y],[bb.x+bb.width,bb.y],[bb.x,bb.y+bb.height],[bb.x+bb.width,bb.y+bb.height]].map(p=>Math.hypot(p[0]-q.x,p[1]-q.y)))+8;
  const NS='http://www.w3.org/2000/svg',ci=document.createElementNS(NS,'circle');
  ci.setAttribute('cx',q.x.toFixed(1));ci.setAttribute('cy',q.y.toFixed(1));ci.setAttribute('r','0');ci.setAttribute('fill',c.hex);r.paint.appendChild(ci);
  /* the soft fill (FILL_MS) in the calm colour, then it blooms to the vivid colour (calm.colorPolicy.bloomMs) */
  const T=quick?FILL_MS*.55:FILL_MS,t0=performance.now(),my=st;let fin=false;
  const end=()=>{if(fin)return;fin=true;if(st!==my)return;ci.setAttribute('r',far.toFixed(1));ci.setAttribute('fill',c.vivid);r.base.setAttribute('fill',c.vivid);
    ci.remove();r.base.setAttribute('fill',V.ball(c.vivid));r.dabs.innerHTML='';afterFill(r)};
  const step=t=>{if(fin)return;if(st!==my){fin=true;return}const k=Math.max(0,Math.min(1,(t-t0)/T)),e=1-Math.pow(1-k,3);ci.setAttribute('r',(far*e).toFixed(1));
    const kb=Math.max(0,Math.min(1,(t-t0-T*.55)/BLOOM_MS));ci.setAttribute('fill',mix(c.hex,c.vivid,kb));
    if(t-t0>=T*.55+BLOOM_MS)end();else requestAnimationFrame(step)};
  requestAnimationFrame(step);L.later(end,T*.55+BLOOM_MS+400);
  tone(523,.16,'sine',.12);tone(659,.18,'sine',.1,.12);tone(784,.22,'sine',.09,.26);
}
function afterFill(r){
  if(!st)return;
  st.busy=false;st.sel=null;renderStrip();
  if(al){try{al.setMood('happy');al.play('hop',{n:1})}catch(e){}}
  const left=st.regs.filter(x=>!x.done).length,p=PRAISE[praiseI++%PRAISE.length];
  if(!left){say(p[0],p[1]);L.later(st.stamps?toStamp:toShow,900);return}
  st.rot++;st.phase='pick';glow();renderCards();say(p[0],p[1]);say('다음은 무슨 색으로 칠할까?','What color next?',true);st.firstAsk=false;aimPick();
}
function cheer(){
  st.wrong++;const c=CHEER[cheerI++%CHEER.length];say(c[0],c[1]);LOG.push('cheer');
  if(al){try{al.play('wave')}catch(e){}}
  G.nudge();
}

/* rub levels (fill: '콕 또는 쓱쓱'): every region has its own makeRub (P1). The region under the finger at touch-down is the one that hears it */
function makeRubs(){
  rubs.forEach(x=>{try{x.destroy()}catch(e){}});rubs=[];
  if(!st.rub)return;
  st.regs.forEach(r=>{if(r.done)return;
    const cfg={needStageWidths:1};
    r.rub=makeRub(stage,{host:stage,tool:brushSVG(null),cfg,
      target:()=>{if(!st||st.phase!=='paint'||st.cur!==r.i||r.done)return{left:-9e4,top:-9e4,right:-9e4,bottom:-9e4,width:0,height:0};
        const b=r.base.getBoundingClientRect(),sw=stage.clientWidth||1;cfg.needStageWidths=Math.max(.45,Math.min(1.5,Math.hypot(b.width,b.height)/sw*1.15));return b},
      onProgress:(p,why)=>{if(!st||r.done||st.sel==null)return;dab(r,why)},
      onDone:()=>{if(!st||r.done||st.sel==null)return;LOG.push('rub:'+r.i);const pt=st.last||anchorClient(r);fill(r.i,pt.x,pt.y,true)}});
    rubs.push(r.rub);
  });
}
function dab(r,why){
  const pt=st.last;if(!pt||r.dabs.childElementCount>140)return;if(why==='hold'&&Math.random()>.12)return;const q=toLocal(r.base,pt.x,pt.y);if(!q)return;
  const NS='http://www.w3.org/2000/svg',d=document.createElementNS(NS,'circle');d.setAttribute('cx',(q.x+(Math.random()-.5)*6).toFixed(1));d.setAttribute('cy',(q.y+(Math.random()-.5)*6).toFixed(1));
  d.setAttribute('r',(13+Math.random()*7).toFixed(1));d.setAttribute('fill',st.colors[st.sel].hex);d.setAttribute('opacity','.92');r.dabs.appendChild(d);
  if(why!=='hold'&&Math.random()<.3)tone(380+Math.random()*120,.06,'sine',.05);
  st.rubbed=true;
}

/* ---------- level 4: pattern stamps, then the child finishes with the frame ---------- */
function toStamp(){
  if(!st)return;st.phase='stamp';st.stamp=null;glow();twinkle();renderStrip();
  const kinds=Object.keys(STAMP).sort(()=>Math.random()-.5).slice(0,2);
  tray.innerHTML='';tray.classList.add('co-st');
  tray.appendChild(M.Shell.cards(kinds.map(k=>({svg:stampCardSVG(k),ko:STAMP[k].ko,en:STAMP[k].en,v:k})),(it,b)=>{st.stamp=it.v;LOG.push('stampPick:'+it.v);tray.querySelectorAll('.sh-card').forEach(x=>x.classList.toggle('co-sel',x===b));
    G.start({type:'tap',after:2200,ko:'그림에 콕콕!',en:'Stamp on your picture!',at:()=>{const r=st.regs[0];const c=anchorClient(r);return secXY(c.x-8,c.y-10)}})}));
  tray.appendChild(M.Shell.finish(frameSVG,()=>finale(),{ko:'다 됐다!',en:'All done!',cls:'co-fin'}));
  say('무늬 도장을 콕콕 찍어 볼까?','Shall we stamp some patterns?');
  G.start({type:'tap',after:2200,ko:'도장을 골라 봐!',en:'Pick a stamp!',at:()=>{const b=tray.querySelector('.sh-card');if(!b)return[0,0];const r=b.getBoundingClientRect();return secXY(r.left+r.width/2-8,r.top+r.height/2-10)}});
}
function stampAt(cx,cy){
  if(!st.stamp){const b=tray.querySelector('.sh-card');if(b){b.classList.remove('co-wig');void b.offsetWidth;b.classList.add('co-wig')}say('도장을 먼저 골라 볼까?','Pick a stamp first!');G.nudge();return}
  let i=hitAt(cx,cy);if(i<0){const b=st.svg.getBoundingClientRect();if(cx<b.left||cx>b.right||cy<b.top||cy>b.bottom){cheer();return}
    let bd=1e9;st.regs.forEach((r,k)=>{const a=anchorClient(r),d=Math.hypot(a.x-cx,a.y-cy);if(d<bd){bd=d;i=k}});if(bd>NEAR_PX*2.5){cheer();return}}
  const r=st.regs[i],q=toLocal(r.base,cx,cy);if(!q)return;
  if(r.stamps.childElementCount>30)return;
  const mk=STAMP[st.stamp].mark,g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','co-stamp');
  g.innerHTML=[[0,0,1.25],[-17,12,.85],[16,13,.85]].map(([dx,dy,s])=>mk(q.x+dx,q.y+dy,s)).join('');r.stamps.appendChild(g);
  st.nStamp++;LOG.push('stamp:'+i);tone(700+rand(5)*60,.12,'triangle',.14);
  if(st.nStamp===1)say('콕! 예쁜 무늬!','Pop! A pretty pattern!');
  G.touch();G.release();
}

/* ---------- the end: the child taps the picture (or the frame) and it moves ---------- */
function toShow(){
  if(!st)return;st.phase='show';glow();twinkle();renderStrip();
  st.paper.classList.add('co-ready');
  tray.innerHTML='';tray.classList.add('co-st');
  tray.appendChild(M.Shell.finish(frameSVG,()=>finale(),{ko:'다 됐다!',en:'All done!',cls:'co-fin'}));
  say('다 칠했다! 그림을 콕 해 볼까?','All painted! Tap your picture!');
  G.start({type:'tap',after:2200,ko:'그림을 콕!',en:'Tap your picture!',at:()=>{const b=st.paper.getBoundingClientRect();return secXY(b.left+b.width/2-8,b.top+b.height/2-10)}});
}
function burst(x,y){const n=CEL.pieces||6;for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.55;L.later(()=>{
  const f=document.createElement('div');f.className='co-fx';f.style.left=(x+(i-(n-1)/2)*20)+'px';f.style.top=y+'px';f.innerHTML=i%2?HEART_FX(PAL.rose||'#E8A0AE'):STAR_FX(PAL.butter||'#F0D58A');stage.appendChild(f);
  const ms=CEL.durationMs||1200;try{const an=f.animate([{transform:'translate(0,0) scale(.4)',opacity:0},{opacity:1,offset:.2},{transform:`translate(${Math.cos(a)*34}px,${-60-(i%3)*18}px) scale(1)`,opacity:0}],{duration:ms,easing:'ease-out',fill:'forwards'});an.onfinish=()=>f.remove()}catch(e){}
  setTimeout(()=>f.remove(),ms+200)},i*80)}}
function finale(){
  if(!st||st.phase==='done')return;
  st.phase='done';st.busy=true;G.stop();LOG.push('win');st.paper.classList.remove('co-ready');st.tw.hidden=true;
  tray.querySelectorAll('.co-fin').forEach(b=>{b.disabled=true});
  renderStrip();
  st.svg.classList.add('co-fin-'+PICS[st.key].motion);
  sfx.ding();
  if(al){try{al.setMood('happy');al.play('clap')}catch(e){}}
  const g=st.g;burst(g.px+g.side/2,g.py+g.side*.4);
  const pic=PICS[st.key];say(`${pic.ko} 그림 완성! 정말 예쁘다!`,`Your ${pic.en} is finished! So pretty!`);
  if(st.wrong>=6){try{PRG.struggle(id,{wrong:st.wrong,idleMs:0})}catch(e){}}
  const R=PRG.clear(id);
  const stop=PRG.after(id,R,{starsEl,host:stage,thing,momentAfter:3000,then:()=>L.later(newRound,R.up?400:3200)});
  L.onEnd(stop);
}
/* the level-up moment: a finished picture of the new level, its name */
function thing(lv){
  const l=LVL(lv),k=l.pictures[0]||'apple',cs=CHOICE.slice(0,l.colors).map(c=>c.vivid);
  const words={2:['꽃도 칠해요! 칸이 셋!','Now a flower! Three parts!'],3:['나비 그림! 쓱쓱 칠해도 돼요!','A butterfly! You can rub to paint!'],4:['드레스 그림! 무늬 도장도 있어요!','A dress! And pattern stamps!']}[lv]||[PICS[k].ko+'!',PICS[k].en+'!'];
  return{art:render(k,{pre:cs.length?cs:['#FF6F91']}).svg,ko:words[0],en:words[1]};
}

/* ---------- a round ---------- */
function newRound(){
  L.begin();G.stop();
  const lv=lvOf(),l=LVL(lv);
  let list=l.pictures.filter(k=>PICS[k].needs!=='faces'||facesOK());if(!list.length)list=['apple'];
  let key;if(forcePic&&PICS[forcePic]&&(PICS[forcePic].needs!=='faces'||facesOK())){key=forcePic;forcePic=''}else{const pool=list.length>1?list.filter(k=>k!==lastPic):list;key=pool[rand(pool.length)]}
  lastPic=key;
  const cs=CHOICE.slice().sort(()=>Math.random()-.5).slice(0,Math.max(1,Math.min(CHOICE.length,l.colors)));
  const view=render(key,{faces:key==='family'?faceRecs():[]});
  st={lv,key,view,areas:Math.min(l.areas,view.n),colors:cs,sel:null,rot:0,phase:'pick',busy:false,wrong:0,regs:[],cur:-1,last:null,down:null,
    rub:/쓱쓱/.test(l.fill),stamps:/도장/.test(l.fill),stamp:null,nStamp:0,firstPick:first,firstAsk:true,rubbed:false};
  LOG.push('round:'+lv+':'+key);
  starsEl.innerHTML=PRG.stars(id);
  build();renderCards();renderStrip();glow();makeRubs();
  if(first){say('토토랑 색칠하자! 무슨 색으로 칠할까?','Let us color with Toto! What color?');first=false}else say('무슨 색으로 칠할까?','What color?');
  aimPick();
}

/* ---------- touch on the stage (capture: before the rub helpers hear it) ---------- */
stage.addEventListener('pointerdown',e=>{
  if(!st||cur()!==id)return;
  const x=e.clientX,y=e.clientY;st.last={x,y};
  if(st.phase==='show'){actx();G.touch();finale();return}
  if(st.phase==='stamp'){actx();stampAt(x,y);return}
  if(st.phase==='pick'){
    actx();const i=regionAt(x,y);
    if(i>=0||st.paper.contains(e.target)||inPaper(x,y)){tray.querySelectorAll('.sh-card').forEach((b,k)=>{b.classList.remove('co-wig');void b.offsetWidth;setTimeout(()=>b.classList.add('co-wig'),k*90)});
      say('먼저 물감을 골라 볼까?','Pick a paint first!');G.nudge()}
    else if(inToto(x,y)){if(al)try{al.play('hop',{n:1});al.sound('giggle')}catch(_){}}
    return;
  }
  if(st.phase!=='paint')return;
  actx();G.touch();
  const i=regionAt(x,y);st.cur=i;
  if(i<0||st.regs[i].done){st.cur=-1;
    if(inToto(x,y)&&al){try{al.play('hop',{n:1})}catch(_){}}
    cheer();return}
  if(!st.rub){fill(i,x,y);return}
  st.down={x,y,t:performance.now(),i,moved:0};
},{capture:true});
stage.addEventListener('pointermove',e=>{if(!st)return;if(st.down){st.down.moved=Math.max(st.down.moved,Math.hypot(e.clientX-st.down.x,e.clientY-st.down.y))}st.last={x:e.clientX,y:e.clientY}},{capture:true});
const up=e=>{
  if(!st)return;const d=st.down;st.down=null;G.release();
  if(!d||st.phase!=='paint')return;
  const r=st.regs[d.i];if(!r||r.done)return;
  if(performance.now()-d.t<=TAP_MS&&d.moved<=TAP_MOVE){LOG.push('tapfill:'+d.i);fill(d.i,d.x,d.y)}
};
['pointerup','pointercancel'].forEach(ev=>stage.addEventListener(ev,up,{capture:true}));
function inPaper(x,y){const b=st.paper.getBoundingClientRect();return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom}
function inToto(x,y){const b=st.toto.getBoundingClientRect();return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom}

games[id]={enter:()=>{first=true;requestAnimationFrame(()=>{if(cur()===id)newRound()})},
  exit:()=>{L.begin();G.stop();rubs.forEach(x=>{try{x.destroy()}catch(e){}});rubs=[];if(al){try{al.detach()}catch(e){}al=null}st=null}};
window.addEventListener('resize',()=>{if(cur()===id&&st&&st.g&&!st.busy&&st.phase!=='done')place()});

/* home tile picture (no emoji): a painted apple and a brush */
document.querySelectorAll('.tile[data-go="coloring"] .ic').forEach(ic=>{
  const ap=render('apple',{pre:[(CHOICE[1]||{}).vivid||'#FF5A5F']}).svg;
  ic.innerHTML=`<svg class="co-pic" viewBox="0 0 300 300" style="overflow:visible"><g transform="translate(-6 6) scale(.9)">${inner(ap)}</g><g transform="translate(206 70) rotate(28 30 70) scale(1.3)">${inner(brushSVG(PAL.sky||'#A7CFE8'))}</g></svg>`;
});

/* ---------- test and parent hooks ---------- */
M.__coLevel=n=>{PRG.set(id,Math.max(1,Math.min(MAXLV,n|0)));return lvOf()};
M.__coPic=k=>{forcePic=PICS[k]?k:''};
M.__co=()=>{
  if(!st)return{lv:lvOf(),phase:'',log:LOG.slice(-40),progress:PRG.get(id)};
  const rr=e=>{const b=e.getBoundingClientRect();return{left:b.left,top:b.top,width:b.width,height:b.height,x:b.left+b.width/2,y:b.top+b.height/2}};
  return{lv:st.lv,key:st.key,phase:st.phase,busy:st.busy,sel:st.sel==null?null:st.colors[st.sel].en,rub:st.rub,stamps:st.stamps,nStamp:st.nStamp,wrong:st.wrong,
    colors:st.colors.map(c=>c.en),
    regions:st.regs.map(r=>{const a=anchorClient(r),b=r.base.getBoundingClientRect();return{i:r.i,done:r.done,pre:r.pre,color:r.color?r.color.en:null,fill:r.base.getAttribute('fill'),
      x:a.x,y:a.y,w:b.width,h:b.height,next:r.g.classList.contains('next'),dabs:r.dabs.childElementCount,stamps:r.stamps.childElementCount}}),
    cards:[...tray.querySelectorAll('.sh-card')].map(b=>Object.assign(rr(b),{ko:b.getAttribute('aria-label'),sel:b.classList.contains('co-sel')})),
    finish:(()=>{const f=tray.querySelector('.co-fin');return f?rr(f):null})(),
    stage:rr(stage),paper:rr(st.paper),pic:rr(st.svg),toto:rr(st.toto),jar:rr(st.jar),tray:rr(tray),
    starsOn:sec.querySelectorAll('.co-stars .mlp-star.on').length,starsN:sec.querySelectorAll('.co-stars .mlp-star').length,moment:!!stage.querySelector('.mlp-moment'),
    progress:PRG.get(id),log:LOG.slice(-60),faces:facesOK()};
};
M.__coDepth=()=>[1,2,3,4].map(lv=>{const l=LVL(lv),rub=/쓱쓱/.test(l.fill),stp=/도장/.test(l.fill);
  const steps=['물감 카드 고르기','색 이름 듣기(한국어·영어)','반짝이는 칸 콕 → 부드럽게 채워짐'].concat(rub?['쓱쓱 문질러 칠하기']:[]).concat(stp?['무늬 도장 콕콕']:[]).concat(['다 칠한 그림 콕 → 그림이 움직임']);
  return{level:lv,processes:steps.length,steps,areas:l.areas,colors:l.colors,pictures:l.pictures,hands:['card','tap'].concat(rub?['rub']:[]),someone:true,choice:true,ending:'그림이 움직임 · 조용한 축하 · 별'}});
})();
