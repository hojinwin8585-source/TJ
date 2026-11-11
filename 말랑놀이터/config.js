window.MLCFG = {
  "_설명": "말랑 놀이터의 모든 숫자·문구·단계를 여기 한 곳에 둡니다. 코드에 숫자를 직접 쓰지 말고 이 파일 값을 읽어 쓰세요. 값을 바꾸면 놀이가 바뀌어야 합니다.",
  "version": "3.3",
  "child": {
    "ageMonths": 29,
    "birthYear": 2024,
    "targetRange": "24~42개월",
    "note": "말이 빠른 편. 3세용 내용도 가능하지만 조작은 2세 기준"
  },
  "calm": {
    "_설명": "시각 자극을 줄이는 기본 모드. 색·배경·효과는 차분하게. 단, 캐릭터는 살아 있게 부드럽게 계속 움직임(characterLife).",
    "enabled": true,
    "palette": {
      "bg": "#F6F1EA",
      "surface": "#FFFDF9",
      "ink": "#5B4A42",
      "outline": "#5B3A29",
      "rose": "#E8A0AE",
      "peach": "#F2B48C",
      "butter": "#F0D58A",
      "sage": "#A9CFA0",
      "sky": "#A7CFE8",
      "lilac": "#C3B4E6"
    },
    "choiceColors": [
      {
        "ko": "분홍",
        "en": "pink",
        "hex": "#E89AAE",
        "light": "#F6D3DB",
        "vivid": "#FF6F91"
      },
      {
        "ko": "빨강",
        "en": "red",
        "hex": "#E0786F",
        "light": "#F3C6C1",
        "vivid": "#FF5A5F"
      },
      {
        "ko": "주황",
        "en": "orange",
        "hex": "#EDA468",
        "light": "#F8D9BD",
        "vivid": "#FF9A3C"
      },
      {
        "ko": "노랑",
        "en": "yellow",
        "hex": "#EBCB6B",
        "light": "#F7E8B8",
        "vivid": "#FFC93C"
      },
      {
        "ko": "초록",
        "en": "green",
        "hex": "#8FC48A",
        "light": "#CFE6CB",
        "vivid": "#5CC76B"
      },
      {
        "ko": "민트",
        "en": "mint",
        "hex": "#86CDBE",
        "light": "#CBEBE4",
        "vivid": "#3FCFB4"
      },
      {
        "ko": "하늘",
        "en": "sky blue",
        "hex": "#8FC3E6",
        "light": "#CFE5F4",
        "vivid": "#5EC2FF"
      },
      {
        "ko": "파랑",
        "en": "blue",
        "hex": "#7D9BE0",
        "light": "#C8D4F3",
        "vivid": "#4E7BFF"
      },
      {
        "ko": "보라",
        "en": "purple",
        "hex": "#AE9BE0",
        "light": "#DCD4F3",
        "vivid": "#9A7BFF"
      },
      {
        "ko": "자주",
        "en": "magenta",
        "hex": "#CF86BE",
        "light": "#EBCDE4",
        "vivid": "#D946B8"
      }
    ],
    "background": "단색 또는 아주 옅은 그라데이션. 물방울·줄무늬 같은 반복 무늬 금지",
    "maxMovingThings": 2,
    "noInfiniteAnimationExcept": [
      "안내 손",
      "지금 눌러야 할 대상 하나",
      "캐릭터의 살아 있는 움직임(characterLife)"
    ],
    "transitionMs": [
      300,
      500
    ],
    "minMsBetweenSceneChanges": 4000,
    "noFlashing": true,
    "celebration": {
      "pieces": 6,
      "durationMs": 1200,
      "style": "천천히 떠오르는 별·하트. 화면 가득한 색종이 금지"
    },
    "shadow": "부드럽고 옅게. 두꺼운 색 그림자 금지",
    "colorPolicy": {
      "_설명": "고르는 카드와 배경, 버튼은 차분한 색(hex). 아이가 고른 결과물(칠한 그림, 달아 준 장식, 완성된 요리)만 또렷한 색(vivid).",
      "choosing": "hex",
      "result": "vivid",
      "bloomMs": 600,
      "note": "고른 순간 차분한 색에서 또렷한 색으로 0.6초 동안 피어나듯 바뀜. 또렷한 것은 화면에 결과물 하나뿐"
    },
    "maxMovingThingsNote": "배경·효과·버튼에만 적용. 캐릭터 몸의 부드러운 움직임은 세지 않음",
    "characterLife": {
      "_설명": "사용 후기: 캐릭터가 너무 가만히 있음. 다른 유아 앱처럼 캐릭터가 계속 살아 있어야 함. 차분함은 색과 효과로 지키고, 캐릭터는 느리고 작게, 끊임없이 움직임. 번쩍임·빠른 흔들림은 여전히 금지.",
      "idle": {
        "breathe": "몸이 3초 주기로 살짝 커졌다 작아짐(1.00↔1.025)",
        "blink": "3~5초마다 눈 깜빡(0.15초), 가끔 두 번",
        "earsTail": "귀·꼬리가 4~6초마다 한 번 살랑(토끼 귀 한쪽 까딱, 강아지 꼬리 흔들, 고양이 꼬리 느릿)",
        "sway": "머리가 5초 주기로 좌우 2도 갸웃",
        "lookAround": "6~9초마다 눈동자가 옆을 봤다가 돌아옴"
      },
      "followFinger": "손가락(도구)을 대고 있으면 눈동자와 머리가 그쪽을 살짝 따라봄(최대 6px, 3도)",
      "whileTool": {
        "sponge": "간지러운 듯 어깨를 들썩, 문지르는 쪽 눈을 찡긋, 가끔 키득",
        "shower": "눈을 꼭 감고 고개를 살짝 들고, 물이 닿는 쪽 귀가 축 처짐, 입은 '아~'",
        "dryer": "털과 귀가 바람 반대쪽으로 날림, 눈을 가늘게 뜨고 기분 좋은 표정",
        "brush": "눈을 감고 고개를 빗 쪽으로 기댐",
        "nailBrush": "손님이 손톱을 내려다보며 눈이 커짐, 칠할 때마다 손가락을 살짝 꼼지락",
        "lamp": "손님이 램프 안을 들여다보며 기대하는 표정, 발을 까딱"
      },
      "moods": "상태마다 표정이 다름: 더러움=시무룩(귀 처짐, 눈썹 八자) → 씻는 중=간질간질 → 젖음=부르르 → 보송=활짝. 표정은 0.3초에 걸쳐 부드럽게 바뀜",
      "bigMoments": [
        "들어올 때 깡충깡충 2번 뛰며 손 흔들기",
        "단계가 끝날 때마다 제자리 폴짝 + 박수",
        "새 장식을 달면 거울 쪽으로 고개를 돌려 보고 빙글",
        "싫지 않은 장난: 장식을 떼면 '어?' 하고 머리를 만짐",
        "끝나면 춤(좌우 흔들 4박) 후 인사"
      ],
      "waiting": "가게 앞에서 기다리는 손님도 다리를 흔들고, 옆을 보고, 가끔 손을 흔들어 '나 골라 줘' (한 번에 한 마리씩 차례로)",
      "voiceSounds": "말(TTS) 말고 짧은 소리도: 키득, '아~', '히히', '우와', 에취. WebAudio로 부드럽게",
      "limits": {
        "minCycleMs": 600,
        "maxRotateDeg": 8,
        "maxMovePx": 14,
        "noFlashing": true,
        "onlyOneBigMomentAtATime": true
      },
      "engine": "art.js의 animal()이 몸·머리·귀·꼬리·눈·눈꺼풀·눈동자·팔을 각각 <g class>로 묶어 CSS 변수와 클래스로 움직이게. 새 파일 alive.js의 ML.Alive.attach(el,{kind})가 깜빡임·둘러보기 타이머와 손가락 따라보기, 표정 바꾸기(setMood), 큰 동작(play('hop'|'clap'|'twirl'|'dance'|'wave'|'shiver'))을 맡음. 화면을 떠나면 모두 멈춤"
    }
  },
  "art": {
    "_설명": "그림체 두 가지. 놀이 속 친구와 물건은 기존 말랑 그림체(갈색 외곽선), 홈의 문·단계 지도·배경은 종이 공예 그림체. 숫자마스터 화면을 참고했지만 그림은 새로 그림(따라 그리지 않음).",
    "characters": "말랑 그림체: 갈색 외곽선 #5B3A29, 큰 눈, 발그레한 볼 (스타일견본.html 1~6)",
    "papercraft": {
      "use": [
        "홈의 둥근 문",
        "문 안의 단계 지도",
        "놀이 배경(선택)"
      ],
      "function": "ART.paper(kind, {grow:0~3})",
      "kinds": [
        "forest",
        "sea",
        "kitchen",
        "christmas"
      ],
      "rules": [
        "외곽선 없음",
        "차분한 색 종이 3~4겹",
        "겹마다 그림자 하나(아래로 2~3px, 흐림 2, 갈색 22%)",
        "종이 결은 아주 옅게(9%)",
        "둥근 테두리는 크림색 흰 테",
        "한 그림에 움직이는 것 없음"
      ],
      "sample": "스타일견본.html 7번"
    }
  },
  "touch": {
    "_설명": "만 2세 조작 기준. 콕(누르기)과 쓱쓱(문지르기), 카드 고르기만 사용.",
    "minTargetPx": 110,
    "maxChoicesPerScreen": 3,
    "tapLockMs": 1200,
    "rub": {
      "_설명": "문지르기를 더 쉽게: 대상에 손가락이 닿는 순간부터 진행. 조금만 움직여도, 가만히 누르고만 있어도 천천히 진행.",
      "startOnTargetThenAnywhere": true,
      "targetMargin": 0.25,
      "tapChunk": 0.08,
      "needStageWidths": 2.0,
      "holdProgressPerSec": 0.12,
      "minMovePx": 0.5,
      "effectFollowsFinger": true,
      "neverLoseProgress": true,
      "effectRadiusRatio": 0.16
    },
    "banned": [
      "길게 누르기(1초 초과)를 조건으로 삼기",
      "두 번 누르기",
      "두 손가락",
      "정해진 선을 정확히 따라 긋기",
      "가로 스크롤 메뉴",
      "탭 메뉴",
      "정확한 자리에 놓는 끌기"
    ],
    "tool": {
      "_설명": "사용 후기: 도구가 더 큼직했으면. 도구 그림은 무대 폭의 45%(최소 180px, 최대 300px).",
      "stageWidthRatio": 0.45,
      "minPx": 180,
      "followsFinger": true,
      "offsetAboveFinger": "도구가 손가락에 가려지지 않게 손가락 위쪽에 보임",
      "maxPx": 300,
      "nailToolRatio": "네일숍 도구(붓·줄·스포이트)는 손 그림 폭의 55%, 확대 화면에서는 무대 폭의 50%",
      "intro": "단계가 시작되면 도구가 아래 도구 칸에서 통통 튀어 올라와 이름을 말함('샤워기! Shower!'). 도구 칸의 도구 그림도 150px 이상",
      "face": "도구에도 작은 얼굴(눈과 웃는 입). 쓰는 동안 눈을 깜빡이고 신난 표정"
    },
    "trace": {
      "_설명": "선 긋기는 천천히, 끝까지 갈 수 있게 돕습니다. 실패 없음.",
      "pathWidthRatio": 0.18,
      "countsWithinRatio": 0.4,
      "creepWhileTouchingPerSec": 0.05,
      "maxSpeedPerSec": 0.35,
      "tapAlsoAdvances": 0.12,
      "showHandAfterIdleMs": 2000,
      "autoFinishAt": 0.9,
      "neverFail": true
    }
  },
  "guide": {
    "showAtStart": true,
    "showAgainAfterIdleMs": 2000,
    "repeatVoiceAfterIdleMs": 7000,
    "cheerEveryMs": 9000,
    "maxCheersPerStep": 3,
    "neverAutoComplete": true
  },
  "voice": {
    "_설명": "말은 항상 한국어 다음 영어. 칭찬은 아래에서 돌아가며.",
    "praise": [
      {
        "ko": "예쁘다!",
        "en": "Beautiful!"
      },
      {
        "ko": "멋지다!",
        "en": "Awesome!"
      },
      {
        "ko": "잘했어!",
        "en": "Good job!"
      },
      {
        "ko": "최고야!",
        "en": "Amazing!"
      },
      {
        "ko": "우와!",
        "en": "Wow!"
      },
      {
        "ko": "사랑스러워!",
        "en": "Lovely!"
      },
      {
        "ko": "정말 잘하네!",
        "en": "Wonderful!"
      },
      {
        "ko": "반짝반짝!",
        "en": "So shiny!"
      },
      {
        "ko": "아주 좋아!",
        "en": "Fantastic!"
      }
    ],
    "onWrongPlace": [
      {
        "ko": "여기야, 여기! 할 수 있어!",
        "en": "Right here! You can do it!"
      },
      {
        "ko": "괜찮아! 손이 가리키는 곳을 눌러 봐!",
        "en": "It's okay! Tap where the hand points!"
      }
    ],
    "actionWords": {
      "rub": {
        "ko": "쓱쓱!",
        "en": "Rub rub!"
      },
      "bubbles": {
        "ko": "뽀글뽀글!",
        "en": "Bubbles!"
      },
      "water": {
        "ko": "쏴아~",
        "en": "Splash!"
      },
      "dry": {
        "ko": "윙~ 따뜻해!",
        "en": "Whoosh! So warm!"
      },
      "clean": {
        "ko": "깨끗해!",
        "en": "All clean!"
      },
      "fluffy": {
        "ko": "보송보송!",
        "en": "So fluffy!"
      }
    },
    "namePattern": "고른 것은 '색 + 이름'으로 두 언어 모두: 예) 분홍 리본! Pink ribbon!",
    "animalNames": [
      {
        "id": "bunny",
        "ko": "토끼",
        "en": "bunny",
        "name": "토토"
      },
      {
        "id": "bear",
        "ko": "곰",
        "en": "bear",
        "name": "보리"
      },
      {
        "id": "cat",
        "ko": "고양이",
        "en": "kitty",
        "name": "모모"
      },
      {
        "id": "dog",
        "ko": "강아지",
        "en": "puppy",
        "name": "콩이"
      }
    ],
    "tts": {
      "_설명": "사용 후기: 음성이 기계 같다. 지금은 그 언어의 첫 번째 목소리를 쓰고 음 높이를 1.15로 올려서 더 어색함. → 기기에서 가장 자연스러운 목소리를 점수로 골라 쓰고, 어른이 들어 보고 바꿀 수 있게.",
      "pick": "getVoices()에서 언어가 맞는 목소리마다 점수를 매겨 가장 높은 것. 목소리 목록은 늦게 오므로 voiceschanged 뒤에 다시 고름",
      "score": {
        "nameContains+5": [
          "Natural",
          "Neural",
          "Online",
          "Premium",
          "Enhanced",
          "프리미엄",
          "향상됨",
          "고품질"
        ],
        "nameContains+3": [
          "Google",
          "Yuna",
          "유나",
          "SunHi",
          "선히",
          "InJoon",
          "Heami",
          "Ava",
          "Samantha",
          "Aria",
          "Jenny",
          "Allison",
          "Zoe"
        ],
        "localService+1": true,
        "nameContains-10": [
          "Compact",
          "compact",
          "eSpeak",
          "espeak",
          "Grandpa",
          "Grandma",
          "Bad News",
          "Good News",
          "Bells",
          "Bubbles",
          "Jester",
          "Whisper",
          "Zarvox",
          "Trinoids",
          "Cellos",
          "Organ",
          "Boing",
          "Albert",
          "Fred",
          "Junior",
          "Ralph",
          "Bahh",
          "Superstar",
          "Wobble",
          "Hysterical",
          "Deranged"
        ]
      },
      "enPreferLangs": [
        "en-US",
        "en-GB",
        "en-AU"
      ],
      "rate": {
        "ko": 0.95,
        "en": 0.9
      },
      "pitch": 1.0,
      "gapBetweenLangsMs": 250,
      "parentPicker": {
        "where": "어른 설정 > 목소리",
        "what": "한국어 목소리와 영어 목소리를 각각 목록에서 고름(점수 높은 순, 위 5개만 먼저 보이고 '더 보기'). 고르면 바로 예시 문장을 들려줌. 빠르기 '천천히 / 보통' 두 가지",
        "sample": {
          "ko": "안녕! 나는 토토야. 같이 놀자!",
          "en": "Hi! I'm Toto. Let's play!"
        },
        "storageKey": "mallang_voice",
        "help": "기기에 좋은 목소리를 내려받는 방법을 한 줄씩 보여 줌(아래 installHelp)"
      },
      "installHelp": {
        "iPhone": "설정 > 손쉬운 사용 > 읽기 및 말하기 > 음성 > 한국어 > '유나(향상됨)' 또는 '프리미엄' 내려받기, 영어도 같은 곳에서 'Ava(향상됨)'",
        "Android": "설정 > 일반(또는 접근성) > 텍스트 음성 변환 > 기본 엔진 'Google 음성 서비스' > 음성 데이터 설치 > 한국어·영어(미국) 내려받기",
        "note": "내려받은 뒤 앱을 다시 열면 목록에 나옴. 기기와 브라우저마다 보이는 목소리가 다름"
      },
      "slowFactor": 0.8
    },
    "recordings": {
      "_설명": "가장 자연스러운 방법: 엄마(가족)가 자주 나오는 말을 직접 녹음. 녹음이 있는 말은 녹음을 틀고, 없는 말은 기기 목소리.",
      "where": "어른 설정 > 엄마 목소리 녹음 (어른 확인 뒤)",
      "how": "문장 카드 하나씩: 문장을 보여 주고 큰 녹음 버튼(누르는 동안 녹음, 최대 4초) → 바로 들어 보기 → 저장 / 다시. MediaRecorder 사용, 지원 안 되면 이 메뉴를 숨김",
      "bothLanguages": "카드에 한국어와 영어가 함께 적혀 있고, 한 번에 둘 다 말하면 '영어도 함께' 표시를 켬(그러면 영어 기기 목소리는 생략). 영어가 어려우면 한국어만 녹음하고 영어는 기기 목소리",
      "phrases": "앱에서 가장 자주 나오는 말 30개 정도: voice.praise 9개, voice.onWrongPlace 2개, voice.actionWords 6개, 동물 이름 부르기 4개('토끼야, 들어와!' 등), 미용실 안내(거품, 물, 바람 예고, 거울, 고마워), 홈 인사. 실제 문장은 코드에서 찾아 같은 글자로",
      "match": "say(ko, en)의 ko 문장과 글자가 같으면 녹음을 틈(앞뒤 공백·문장부호 차이는 무시)",
      "storage": "IndexedDB 'mallang_voice_rec' (기기에만 저장)",
      "playback": "배경음은 녹음을 트는 동안 작아짐(sound.bgm.duckWhileSpeaking). 녹음 소리 크기는 자동으로 고르게(최대 음량 기준 맞춤)",
      "manage": "문장마다 녹음됨 표시, 지우기, 전체 지우기",
      "maxSeconds": 4
    }
  },
  "progress": {
    "_설명": "같은 단계를 3번 끝내면 다음 단계가 열립니다. 별 3칸이 차는 것이 보여야 합니다.",
    "clearsToLevelUp": 3,
    "starsShown": 3,
    "levelUpMoment": "새로 생긴 것을 하나 보여 주고 이름을 말해 줌. 조용하고 짧게(3초)",
    "struggle": {
      "idleMs": 20000,
      "wrongTouches": 6
    },
    "stepDownAfterStruggles": 2,
    "stepDownIsSilent": true,
    "parentCanSetLevel": true,
    "storageKey": "mallang_progress",
    "rewards": {
      "_설명": "숫자마스터는 금화와 당근 두 가지를 모으지만, 2살에게는 하나만. 숫자 대신 그림 개수로.",
      "item": "당근",
      "en": "carrot",
      "earn": "한 판을 끝내면 당근 1개가 토토 옆 바구니로 톡 들어감",
      "show": "바구니 속 당근 그림, 최대 5개까지 보임(숫자 표시 없음)",
      "spend": "내 방에서 토토에게 당근 주기: 당근 콕 → 토토가 냠냠(2초). 5개를 다 주면 작은 선물 1개",
      "noShop": true,
      "noLoss": "당근은 줄어들거나 빼앗기지 않음"
    },
    "parentView": {
      "_설명": "숫자마스터의 '단계 고르기' 칸(한 주제 안 놀이 9개, 각각 Lv와 막대)은 아이 화면이 아니라 어른 화면에.",
      "where": "어른 설정 > 아이 기록",
      "layout": "문(요리·꾸미기·배움·노래)마다 놀이 칸을 3열로. 칸마다 놀이 그림, 단계 숫자, 별 3칸 막대, 마지막으로 한 날",
      "actions": [
        "단계 직접 바꾸기(parentCanSetLevel)",
        "오늘 논 시간"
      ]
    }
  },
  "games": {
    "petsalon": {
      "levels": [
        {
          "level": 1,
          "customers": [
            "bunny",
            "dog"
          ],
          "steps": [
            "foam",
            "rinse"
          ],
          "choose": [
            "head"
          ],
          "optionsPerChoice": 2,
          "colors": 4,
          "new": "거품 내고 물 뿌리기, 머리 장식 2개 중 하나"
        },
        {
          "level": 2,
          "customers": [
            "bunny",
            "dog",
            "cat"
          ],
          "steps": [
            "foam",
            "rinse",
            "dry"
          ],
          "choose": [
            "head",
            "neck"
          ],
          "optionsPerChoice": 3,
          "colors": 6,
          "new": "드라이기와 목 장식"
        },
        {
          "level": 3,
          "customers": [
            "bunny",
            "dog",
            "cat",
            "bear"
          ],
          "steps": [
            "foam",
            "rinse",
            "dry"
          ],
          "choose": [
            "head",
            "neck",
            "face"
          ],
          "optionsPerChoice": 3,
          "colors": 10,
          "new": "얼굴 장식, 색 10가지"
        },
        {
          "level": 4,
          "customers": [
            "가족 얼굴"
          ],
          "steps": [
            "foam",
            "rinse",
            "dry"
          ],
          "choose": [
            "head",
            "neck",
            "face"
          ],
          "optionsPerChoice": 3,
          "colors": 10,
          "new": "엄마·할머니·삼촌이 손님으로"
        },
        {
          "level": 5,
          "customers": [
            "모두"
          ],
          "steps": [
            "foam",
            "rinse",
            "dry"
          ],
          "choose": [
            "head",
            "neck",
            "face",
            "우리 집 물건"
          ],
          "optionsPerChoice": 3,
          "colors": 10,
          "new": "손님 모두, 사진 장식이 많아짐 (사진 장식 자체는 P6 이후 언제든 나옴)"
        }
      ],
      "petStates": [
        {
          "id": "muddy",
          "look": "진흙 얼룩 7곳, 풀이 죽은 표정"
        },
        {
          "id": "foamy",
          "look": "문지른 곳부터 거품, 진흙이 옅어짐"
        },
        {
          "id": "rinse1",
          "look": "거품이 위에서부터 3분의 1씩 사라짐. 누를 때마다 한 칸"
        },
        {
          "id": "wet",
          "look": "털이 축 처지고 물방울, 귀가 살짝 내려감"
        },
        {
          "id": "dry1",
          "look": "머리부터 보송해짐. 누를 때마다 물방울이 줄고 털 뭉치가 생김"
        },
        {
          "id": "fluffy",
          "look": "털이 풍성하고 은은한 윤기, 활짝 웃음"
        }
      ],
      "_피드백": "2026-11 사용 후기: 터치는 쉬워졌지만 도구가 움직이지 않아 단조롭고, 손님을 고를 수 없고, 장식을 붙이면 바로 끝남. → 가게 앞에서 손님 고르기, 손가락을 따라 움직이는 도구와 효과, 떼었다 붙였다 하는 자유 꾸미기, 아이가 끝낼 때 끝남.",
      "lobby": {
        "_설명": "가게 앞 화면. 미용실에 들어오면 먼저 여기. 손님을 아이가 고름.",
        "scene": "미용실 문과 유리창, 기다리는 의자. 종이 공예 배경(ART.paper 느낌, 외곽선 없는 겹) 위에 말랑 그림체 동물",
        "waiting": 3,
        "needBubble": "손님 머리 위 작은 말풍선에 원하는 것을 그림으로(진흙 얼룩=씻기, 나뭇잎=헹구고 말리기, 엉킨 털=빗질, 리본=꾸미기만). 글자 없음",
        "pick": "손님을 콕 → '토끼야, 들어와! Come in, bunny!' → 깡충깡충 문 안으로(0.5초) → 미용실 의자",
        "arrive": "한 손님이 나가면 새 손님이 천천히 걸어와 빈 의자에 앉음(한 번에 한 마리, 2초)",
        "photoWall": "가게 벽에 꾸며 준 손님 액자 최근 3개(그림으로 다시 그림, 사진 파일 아님)",
        "back": "미용실 화면의 뒤로 가기는 가게 앞으로. 가게 앞의 집 버튼은 홈으로"
      },
      "needs": [
        {
          "id": "muddy",
          "bubble": "진흙",
          "steps": [
            "foam",
            "rinse",
            "dry"
          ],
          "from": 1
        },
        {
          "id": "leaves",
          "bubble": "나뭇잎",
          "steps": [
            "rinse",
            "dry"
          ],
          "from": 2
        },
        {
          "id": "tangled",
          "bubble": "엉킨 털",
          "steps": [
            "brush"
          ],
          "from": 3
        },
        {
          "id": "party",
          "bubble": "리본",
          "steps": [],
          "from": 1,
          "say": [
            "파티에 가요! 예쁘게 해 주세요",
            "I'm going to a party!"
          ]
        }
      ],
      "tools": {
        "_설명": "세 도구 모두 손가락을 따라 움직이고, 닿는 곳에 효과가 생김. 동물 아무 데나 손가락을 대면 도구가 손가락 위로 붙음(따로 집을 필요 없음).",
        "followFinger": true,
        "offsetAboveFingerRatio": 0.55,
        "coverage": {
          "grid": [
            6,
            6
          ],
          "insidePetOnly": true,
          "radiusRatio": 0.16,
          "doneAt": 0.85,
          "autoFinishRest": "나머지는 반짝이며 저절로 깨끗해짐",
          "holdStillCleansNearest": true,
          "neverGoesBack": true
        },
        "sponge": {
          "effect": "손가락 아래 거품이 몽글몽글 생김. 진흙이 그 자리부터 옅어짐"
        },
        "shower": {
          "effect": "샤워기 머리에서 손가락 지점까지 물줄기(연한 하늘색 물방울이 떨어짐). 물이 닿은 자리의 거품과 진흙만 지워짐",
          "sound": "손가락을 대고 있는 동안만 부드러운 물소리(150ms 서서히 켜짐/꺼짐)"
        },
        "dryer": {
          "effect": "드라이기 입에서 손가락 지점까지 부드러운 바람 줄 3개. 바람이 닿은 자리의 물방울이 날아가고 털이 보송하게 부풀어 오름. 귀가 살랑",
          "sound": "대고 있는 동안만, 사용 횟수에 따라 작게 시작(sound.dryer)"
        },
        "brush": {
          "from": 3,
          "effect": "빗이 지나간 자리의 엉킨 털 뭉치가 풀려 매끈해짐"
        },
        "toolSize": "touch.tool 값 그대로(무대 폭 32%, 최소 130px)"
      },
      "reactions": {
        "_설명": "동물이 살아 있는 느낌. 한 손님에 각각 최대 1번, 짧게.",
        "tickle": "배 근처를 문지르면 키득키득 웃음(1초)",
        "sneeze": "코 근처에 거품이 닿으면 작게 '에취!'(거품 몇 개가 퐁)",
        "shake": "헹굼이 끝나면 강아지처럼 몸을 부르르 털어 물방울이 튐(0.8초)",
        "lookAtMirror": "꾸미는 동안 가끔 거울을 보며 웃음"
      },
      "dressing": {
        "_설명": "자유 꾸미기. 붙였다 떼었다, 바꿔 달기, 색 바꾸기. 아이가 거울을 누를 때 끝남.",
        "slotByTouch": "동물의 머리·목·얼굴을 콕 하면 그 자리 장식 카드 3장이 아래에 나옴. 같은 자리를 다시 콕 하면 다른 3장",
        "slotHint": "처음엔 머리·목·얼굴 자리에 반짝이 하나씩(움직이지 않는 은은한 점)",
        "putOn": "카드를 콕 하거나 동물에게 끌어다 놓으면 날아가 붙음. 붙는 순간 또렷한 색으로 피어남(calm.colorPolicy)",
        "swap": "같은 자리에 다른 카드를 고르면 원래 것이 카드로 날아 돌아가고 새것이 붙음",
        "takeOff": "동물에 붙은 장식을 끌어서 밖으로 빼면 떨어짐(카드로 날아 돌아감, '퐁'). 붙은 장식을 콕 하면 떨어지지 않고 색이 다음 색으로 바뀜",
        "colorTap": "붙은 장식을 콕 → 그 단계의 색 중 다음 색으로(색 이름을 한국어·영어로)",
        "finishButton": "장식이 1개 이상 붙고 8초가 지나면 오른쪽 아래에 큰 거울 버튼(110px 이상)이 조용히 나타남. 아이가 누를 때만 끝남",
        "idleHintMs": 30000,
        "idleHint": "30초 동안 아무것도 안 하면 안내 손이 거울 버튼을 가리킴(자동으로 끝나지 않음)",
        "mirrorMoment": "거울 앞에서 동물이 빙글 돌고 웃음 → 부드러운 찰칵 → 액자가 되어 가게 벽으로(3초)",
        "leave": "'고마워! Thank you!' 하고 손 흔들며 문 밖으로 → 가게 앞 화면"
      },
      "progressBar": "막대는 빗금 없는 단색(차분한 색), 채워질 때만 부드럽게 늘어남",
      "itemUnlock": {
        "_설명": "자주 할수록 장식이 늘어남. 단계(꾸밀 자리)와 따로, 손님 수로 늘어남.",
        "start": {
          "head": [
            "ribbon",
            "flower"
          ],
          "neck": [
            "bow tie"
          ],
          "face": [
            "round glasses"
          ]
        },
        "everyCustomers": 3,
        "order": [
          "crown",
          "necklace",
          "party hat",
          "sunglasses",
          "scarf",
          "star clip",
          "bell collar",
          "heart clip",
          "cheek stickers",
          "headband",
          "sun hat",
          "flower lei",
          "pearl necklace",
          "heart glasses",
          "star stickers"
        ],
        "toDraw": {
          "headband": "머리띠",
          "sun hat": "밀짚모자",
          "flower lei": "꽃목걸이",
          "pearl necklace": "진주 목걸이",
          "heart glasses": "하트 안경",
          "star stickers": "별 스티커"
        },
        "slotOf": {
          "crown": "head",
          "party hat": "head",
          "star clip": "head",
          "heart clip": "head",
          "headband": "head",
          "sun hat": "head",
          "necklace": "neck",
          "scarf": "neck",
          "bell collar": "neck",
          "flower lei": "neck",
          "pearl necklace": "neck",
          "sunglasses": "face",
          "cheek stickers": "face",
          "heart glasses": "face",
          "star stickers": "face"
        },
        "newBadge": "새 장식 카드에 작은 리본 표시. 처음 나올 때 그 자리의 카드 3장 중 맨 앞",
        "newVoice": [
          "새 {ko}이(가) 생겼어요!",
          "A new {en}!"
        ],
        "whenSlotClosed": "아직 열리지 않은 자리(단계)의 장식은 모아 두었다가 그 자리가 열리면 함께 나옴",
        "storage": "mallang_salon.items"
      },
      "photoItems": {
        "_설명": "엄마가 사진으로 넣은 아이의 진짜 장식(P6). 단계와 상관없이, 그 자리가 열려 있으면 바로 꾸미기 카드에 섞여 나옴.",
        "fromWardrobe": {
          "머리띠·모자": "head",
          "목걸이·목도리": "neck",
          "안경": "face"
        },
        "mix": "카드 3장 중 최대 1장이 사진 장식. 새로 들어온 것은 다음 손님 때 꼭 1번 나옴",
        "badge": "카드 모서리에 작은 하트 액자 표시(글자 없음)",
        "voice": [
          "엄마가 넣어 준 {ko}!",
          "Mommy's {en}!"
        ],
        "colorTap": "사진 장식은 색을 바꾸지 않고, 콕 하면 반짝이며 살랑 흔들림",
        "sameRules": "붙이기·바꾸기·끌어서 떼기는 그림 장식과 똑같이"
      }
    },
    "coloring": {
      "_설명": "새 놀이. 큰 그림의 칸을 색칠. 처음엔 콕 누르면 한 칸이 채워지고, 단계가 오르면 칸과 색이 늘어남.",
      "levels": [
        {
          "level": 1,
          "areas": 1,
          "colors": 2,
          "fill": "콕 누르면 채워짐",
          "pictures": [
            "사과",
            "풍선"
          ]
        },
        {
          "level": 2,
          "areas": 3,
          "colors": 3,
          "fill": "콕",
          "pictures": [
            "꽃",
            "물고기",
            "집"
          ]
        },
        {
          "level": 3,
          "areas": 5,
          "colors": 5,
          "fill": "콕 또는 쓱쓱",
          "pictures": [
            "나비",
            "자동차",
            "케이크"
          ]
        },
        {
          "level": 4,
          "areas": 8,
          "colors": 8,
          "fill": "쓱쓱 + 무늬 도장",
          "pictures": [
            "공주 드레스",
            "동물 친구",
            "우리 가족"
          ]
        }
      ]
    },
    "pizza": {
      "_설명": "요리는 단계가 오르면 장면과 재료가 늘어남. 조작은 개선명세.md 4-4의 콕·쓱쓱 방식.",
      "levels": [
        {
          "level": 1,
          "scenes": [
            "소스 쓱쓱",
            "토핑 콕",
            "굽기 콕"
          ],
          "toppings": [
            "tomato"
          ],
          "new": "소스 바르고 토마토 올리기"
        },
        {
          "level": 2,
          "scenes": [
            "가루와 물 콕",
            "소스 쓱쓱",
            "치즈 콕",
            "토핑 콕",
            "굽기 콕"
          ],
          "toppings": [
            "tomato",
            "mushroom"
          ],
          "new": "반죽부터, 버섯"
        },
        {
          "level": 3,
          "scenes": [
            "가루와 물 콕",
            "반죽 쓱쓱",
            "소스",
            "치즈",
            "토핑 고르기",
            "굽기",
            "자르기 콕"
          ],
          "toppings": [
            "tomato",
            "mushroom",
            "pepper",
            "corn"
          ],
          "new": "토핑을 3개 중에 고르기, 자르기"
        },
        {
          "level": 4,
          "scenes": [
            "같음"
          ],
          "toppings": [
            "모두"
          ],
          "new": "손님 주문대로 만들기. 이후 빵과 케이크 열림"
        }
      ],
      "_고칠것": "rules.madeEqualsUsed, rules.everyIngredientPrepared, rules.noReading. P5-나에서."
    },
    "xmasHouse": {
      "_설명": "새 놀이: 크리스마스 집 꾸미기. 꾸미기 문 안에 넣고, 크리스마스 테마일 때 홈에도 보임.",
      "levels": [
        {
          "level": 1,
          "new": "트리에 방울 달기: 카드 2장 중 골라 3개"
        },
        {
          "level": 2,
          "new": "꼭대기 별, 콕 하면 꼬마전구가 한 줄씩 켜짐"
        },
        {
          "level": 3,
          "new": "벽난로에 양말 걸기, 트리 아래 선물 놓기"
        },
        {
          "level": 4,
          "new": "문에 리스, 창문에 눈, 액자에 가족 얼굴. 사진으로 넣은 우리 집 장식"
        }
      ],
      "foundInReview": "통합판: 방 그림(트리, 벽난로, 창문, 문)은 좋음 → 그대로 씀. 고칠 것: 글자 탭 4개(1 방울·2 별과 전구·3 양말과 선물·4 우리 집), 글자 안내 두 줄. 탭은 없애고 단계가 오르면 저절로 다음 꾸밈으로"
    },
    "animals": {
      "levels": [
        {
          "level": 1,
          "new": "동물 2마리 이름과 소리"
        },
        {
          "level": 2,
          "new": "찾기: 2마리 중 하나"
        },
        {
          "level": 3,
          "new": "찾기: 3마리 중 하나, 아기와 엄마 짝"
        },
        {
          "level": 4,
          "new": "사는 곳 맞추기"
        }
      ]
    },
    "counting": {
      "levels": [
        {
          "level": 1,
          "new": "1~2 세기 (큰 젤리)"
        },
        {
          "level": 2,
          "new": "1~3"
        },
        {
          "level": 3,
          "new": "1~5"
        },
        {
          "level": 4,
          "new": "수와 숫자 짝짓기"
        }
      ]
    },
    "shapes": {
      "levels": [
        {
          "level": 1,
          "new": "동그라미 하나 넣기"
        },
        {
          "level": 2,
          "new": "동그라미·네모"
        },
        {
          "level": 3,
          "new": "세모 추가"
        },
        {
          "level": 4,
          "new": "별·하트 추가"
        }
      ]
    },
    "trace": {
      "levels": [
        {
          "level": 1,
          "new": "짧은 직선"
        },
        {
          "level": 2,
          "new": "긴 직선"
        },
        {
          "level": 3,
          "new": "물결"
        },
        {
          "level": 4,
          "new": "동그라미"
        }
      ]
    },
    "words": {
      "levels": [
        {
          "level": 1,
          "new": "그림 2장 듣기"
        },
        {
          "level": 2,
          "new": "3장 중 찾기"
        },
        {
          "level": 3,
          "new": "첫소리 같은 것"
        },
        {
          "level": 4,
          "new": "영어 낱말 찾기"
        }
      ]
    },
    "dishes": {
      "_설명": "설거지 다시 만들기. 지금은 접시 하나를 문지르고 수도꼭지를 누르면 끝.",
      "flow": [
        "손님이 먹고 간 식탁에서 그릇 걷기(접시·컵·숟가락을 콕 하면 싱크대로 날아감)",
        "남은 음식을 주걱으로 쓱 긁어 음식물 통에",
        "세제를 꾹 짜기(콕, 방울이 톡)",
        "수세미를 움직여 거품 내기(닿은 곳만 얼룩이 지워짐)",
        "수도꼭지를 콕 해서 물을 틀고, 그릇을 물줄기 아래에서 헹구기(거품이 흘러내림)",
        "행주로 닦아 반짝",
        "선반의 맞는 자리에 꽂기(큰 접시는 큰 칸: 2~3칸 중 고르기)"
      ],
      "variety": "그릇이 판마다 다름(접시, 컵, 밥그릇, 냄비). 냄비의 탄 자국은 더 오래 문질러야 함. 컵은 안쪽까지",
      "someone": "토토가 옆에서 행주를 들고 기다리다 받아서 닦는 것을 도와줌, 끝나면 반짝이는 그릇에 얼굴이 비침",
      "levels": [
        {
          "level": 1,
          "new": "접시 2개: 세제, 거품, 헹굼"
        },
        {
          "level": 2,
          "new": "그릇 걷기와 컵, 행주로 닦기"
        },
        {
          "level": 3,
          "new": "남은 음식 긁기, 선반에 꽂기"
        },
        {
          "level": 4,
          "new": "냄비의 탄 자국, 그릇 4개"
        }
      ]
    },
    "chores": {
      "_설명": "집안일 다시 만들기. 지금은 이모지 장난감을 상자에 넣는 것과 이모지 탭 4개. 일마다 가게 놀이처럼 과정이 있게.",
      "pick": "토토네 집 그림에서 어지러운 곳이 반짝임(장난감 방, 빨래 바구니, 먼지 낀 거실, 시든 화분). 그림 카드 3장 중 고르기",
      "jobs": {
        "toys": [
          "장난감을 콕 하면 상자로 날아감",
          "상자가 2개: 인형 상자와 자동차 상자(그림 딱지). 맞는 상자에 넣기(틀리면 '이건 자동차야!' 하고 다시)",
          "상자 뚜껑 닫고 선반에 올리기",
          "러그 털기(쓱쓱)"
        ],
        "laundry": [
          "빨래 바구니의 옷을 세탁기에 쏙쏙",
          "세제 한 컵(콕)",
          "시작 단추 콕 → 빙글빙글 도는 것 보기(5초, 거품이 보임)",
          "젖은 옷을 빨랫줄에 널고 집게 콕",
          "마른 옷을 반으로 접기(쓱) → 서랍에"
        ],
        "vacuum": [
          "청소기를 움직여 먼지 뭉치 빨아들이기(닿은 곳만 깨끗)",
          "소파 밑에서 나온 양말 줍기",
          "걸레로 얼룩 닦기"
        ],
        "plants": [
          "물뿌리개에 물 받기(수도 콕)",
          "물뿌리개를 움직여 화분마다 물 주기(닿은 화분만 고개를 듦)",
          "시든 잎 떼기(콕)",
          "햇빛 드는 창가로 옮기기"
        ]
      },
      "levels": [
        {
          "level": 1,
          "new": "장난감 정리(상자 1개), 화분 물 주기"
        },
        {
          "level": 2,
          "new": "상자 2개로 나누기, 빨래 넣고 돌리기"
        },
        {
          "level": 3,
          "new": "청소기, 빨래 널기"
        },
        {
          "level": 4,
          "new": "빨래 개기, 일 두 가지를 이어서"
        }
      ]
    },
    "routine": {
      "levels": [
        {
          "level": 1,
          "new": "일어나기와 양치"
        },
        {
          "level": 2,
          "new": "밥 먹기 추가"
        },
        {
          "level": 3,
          "new": "옷 입기 추가"
        },
        {
          "level": 4,
          "new": "잠자기까지 4장면"
        }
      ]
    },
    "dressup": {
      "levels": [
        {
          "level": 1,
          "new": "옷 2벌 중 하나"
        },
        {
          "level": 2,
          "new": "옷 3벌 + 머리 장식"
        },
        {
          "level": 3,
          "new": "신발과 소품"
        },
        {
          "level": 4,
          "new": "우리 집 옷"
        }
      ],
      "_다듬기": "통합판 후기: 허술함. 미용실 꾸미기와 같은 규칙으로: 몸의 자리(머리·윗옷·아래옷·신발)를 콕 하면 그 자리 카드 3장, 붙이기·바꾸기·끌어서 떼기·콕 해서 색 바꾸기, 끝내기는 거울 버튼. 캐릭터는 ML.Alive로 살아 있고 새 옷마다 빙글. 날씨·장소 손님(비 오는 날 → 우산과 장화)이 3단계부터."
    },
    "makeup": {
      "levels": [
        {
          "level": 1,
          "new": "립스틱만"
        },
        {
          "level": 2,
          "new": "볼터치 추가"
        },
        {
          "level": 3,
          "new": "눈 화장 추가"
        },
        {
          "level": 4,
          "new": "색 고르기와 장식"
        }
      ]
    },
    "nails": {
      "levels": [
        {
          "level": 1,
          "new": "손톱 1개 한 색"
        },
        {
          "level": 2,
          "new": "손톱 3개"
        },
        {
          "level": 3,
          "new": "5개와 색 3가지"
        },
        {
          "level": 4,
          "new": "스티커"
        }
      ],
      "_대체": "nailshop으로 바뀜. 홈 타일 '손톱'은 nailshop으로 연결. 예전 nails 코드는 지우지 않고 둠"
    },
    "jobs": {
      "_설명": "직업 놀이(통합판의 직업 옷 입히기를 다듬기). 옷만 입히고 끝나지 않고, 옷을 입으면 그 일을 직접 해 봄. 가게 놀이 뼈대(flow.beats)를 따름.",
      "flow": [
        "직업 카드 3장 중 고르기(그림, 누르면 이름)",
        "옷 입히기: 모자·옷·도구 3가지를 하나씩. 카드를 콕 하거나 끌어서 붙임, 떼기·바꾸기 가능(미용실 꾸미기와 같은 규칙), 붙일 때마다 이름을 두 언어로",
        "거울 앞에서 빙글 → '출동!'",
        "일 해 보기(도구가 손가락을 따라옴, ML.P2.makeTool)",
        "고마워하는 장면 → 진짜 사진 카드('진짜 소방관! A real firefighter!') → 도장"
      ],
      "jobs": [
        {
          "id": "firefighter",
          "ko": "소방관",
          "en": "firefighter",
          "wear": [
            "헬멧",
            "방화복",
            "호스"
          ],
          "mission": "호스를 움직여 물줄기로 불 3곳 끄기(닿은 불만 작아짐)"
        },
        {
          "id": "doctor",
          "ko": "의사",
          "en": "doctor",
          "wear": [
            "머리 거울",
            "가운",
            "청진기"
          ],
          "mission": "청진기를 가슴에 대면 두근두근 소리, 아픈 곳에 반창고 붙이기"
        },
        {
          "id": "chef",
          "ko": "요리사",
          "en": "chef",
          "wear": [
            "요리 모자",
            "앞치마",
            "국자"
          ],
          "mission": "국자로 수프 젓기, 그릇에 담아 주기"
        },
        {
          "id": "police",
          "ko": "경찰관",
          "en": "police officer",
          "wear": [
            "모자",
            "제복",
            "호루라기"
          ],
          "mission": "건널목에서 손 표지판을 들어 오리 가족이 건너게 하기"
        },
        {
          "id": "mail",
          "ko": "집배원",
          "en": "mail carrier",
          "wear": [
            "모자",
            "조끼",
            "가방"
          ],
          "mission": "편지의 그림과 같은 그림의 집에 배달(2집 중 고르기)"
        },
        {
          "id": "farmer",
          "ko": "농부",
          "en": "farmer",
          "wear": [
            "밀짚모자",
            "멜빵바지",
            "물뿌리개"
          ],
          "mission": "물뿌리개를 움직여 싹 키우고 당근 뽑기"
        },
        {
          "id": "vet",
          "ko": "수의사",
          "en": "vet",
          "wear": [
            "머리띠",
            "가운",
            "돋보기"
          ],
          "mission": "강아지 발의 가시를 콕 빼고 붕대 감기"
        }
      ],
      "levels": [
        {
          "level": 1,
          "new": "소방관·의사, 옷 3가지가 맞는 것만 나옴"
        },
        {
          "level": 2,
          "new": "요리사·경찰관, 옷 카드 3장 중 하나는 다른 직업의 것(골라내기)"
        },
        {
          "level": 3,
          "new": "집배원·농부, 일 해 보기가 두 가지"
        },
        {
          "level": 4,
          "new": "수의사, 손님이 '도와주세요' 하면 알맞은 직업 고르기(불이 났어요 → 소방관)"
        },
        {
          "level": 5,
          "new": "가족 얼굴이 직업 옷을 입음(P4)"
        }
      ],
      "foundInReview": "통합판: 직업 옷 입기(노란 이모지 얼굴 + 세모 몸, 아래에 직업 동그라미가 가로로 밀림, 누르면 옷이 한 번에 바뀜), 짝 맞추기(끌기만 됨, 짝이 틀림), 출동 놀이(흐린 이모지 집과 불) → 셋을 직업 놀이 하나로"
    },
    "bread": {
      "levels": [
        {
          "level": 1,
          "new": "반죽 문지르기와 굽기"
        },
        {
          "level": 2,
          "new": "동글동글 만들기"
        },
        {
          "level": 3,
          "new": "재료 넣기"
        },
        {
          "level": 4,
          "new": "손님 주문"
        }
      ]
    },
    "cake": {
      "levels": [
        {
          "level": 1,
          "new": "크림 바르고 과일"
        },
        {
          "level": 2,
          "new": "초 꽂고 불기"
        },
        {
          "level": 3,
          "new": "굽기부터"
        },
        {
          "level": 4,
          "new": "손님 주문"
        }
      ]
    },
    "quest": {
      "levels": [
        {
          "level": 1,
          "new": "장소마다 미션 1개"
        },
        {
          "level": 2,
          "new": "세균 잡기 추가"
        },
        {
          "level": 3,
          "new": "새 장소"
        },
        {
          "level": 4,
          "new": "대왕"
        }
      ]
    },
    "music": {
      "levels": [
        {
          "level": 1,
          "new": "건반 3개"
        },
        {
          "level": 2,
          "new": "5개"
        },
        {
          "level": 3,
          "new": "8개"
        },
        {
          "level": 4,
          "new": "따라 치기"
        }
      ]
    },
    "_규칙": "모든 놀이는 같은 방식: 1단계는 한 가지 동작과 2개 중 고르기, 3판 끝내면 다음 단계에서 재료·색·장면이 하나씩 늘어남",
    "nailshop": {
      "_설명": "진짜 네일숍처럼: 손톱 갈기 → 베이스 젤 → 색 젤 칠하기 → 램프에 굽기 → 그림 그리기·도장 → 파츠(보석) → 탑젤 → 굽기 → 오일 → 거울. 단계가 오를수록 과정이 하나씩 늘어남. 날카로운 도구(니퍼, 큐티클 가위)는 넣지 않음.",
      "screenId": "nailshop",
      "file": "nailshop.js",
      "portal": "꾸미기",
      "customers": [
        {
          "id": "mom",
          "ko": "엄마 손",
          "en": "Mommy's hand",
          "from": 1
        },
        {
          "id": "bunnyPaw",
          "ko": "토토 발",
          "en": "Toto's paw",
          "from": 1,
          "look": "말랑한 발바닥 젤리와 작은 둥근 발톱 4개"
        },
        {
          "id": "baby",
          "ko": "아기 손",
          "en": "Baby's hand",
          "from": 2
        },
        {
          "id": "family",
          "ko": "가족 손님",
          "en": "Family",
          "from": 5,
          "note": "P4의 가족 얼굴이 손님 의자에 앉아 손을 내밂"
        }
      ],
      "lobby": "동물 미용실의 가게 앞과 같은 방식: 손님 3명, 머리 위 말풍선에 원하는 색 물방울 하나(예: 분홍). 다른 색으로 칠해도 '이것도 예쁘다!'로 기뻐함(틀림 없음)",
      "view": {
        "hand": "손 전체가 무대 가운데. 손톱은 크게(손톱 하나 최소 56px 폭). 아무 손톱이나 아이가 고름",
        "zoom": "그리기·도장·파츠 단계에서는 손톱을 콕 하면 그 손톱이 무대를 가득 채우게 확대(0.4초). 아래 '손 전체' 큰 버튼(손 그림)으로 돌아감",
        "nailState": "손톱마다 따로 저장: filed, base, color, cured, art[], parts[], top, oiled"
      },
      "steps": {
        "file": {
          "ko": "손톱 갈기",
          "en": "File",
          "tool": "손톱 줄(파일)",
          "how": "줄을 손톱 끝에 대고 쓱쓱. 손톱 끝의 울퉁불퉁한 선이 문지른 만큼 매끈한 둥근 선으로 바뀜. 고운 가루가 살짝 떨어지고 '스슥' 작은 소리. 끝나면 '후~' 하고 가루를 불어 날림(콕)",
          "engine": "ML.P2.makeTool 칸 방식(손톱 끝 부분만), 가만히 대고 있어도 끝남"
        },
        "base": {
          "ko": "베이스 젤",
          "en": "Base gel",
          "how": "투명한 젤 붓으로 손톱을 쓱 칠함. 칠한 곳만 은은하게 촉촉해짐"
        },
        "color": {
          "ko": "색 젤 칠하기",
          "en": "Color gel",
          "how": "색 병 카드 3장 중 하나 콕(차분한 색) → 붓을 손톱에 대고 칠함. 붓이 지나간 자리만 색이 칠해짐(또렷한 색). 칠한 결이 0.5초 뒤 스르르 퍼져 매끈해짐(젤이 펴지는 느낌). 손톱마다 다른 색 가능. 손톱을 콕만 해도 붓이 천천히 알아서 칠해 줌",
          "engine": "칸 방식, 손톱 모양 안에서만, 다 칠하면 손톱 테두리가 반짝"
        },
        "cure": {
          "ko": "램프에 굽기",
          "en": "Cure",
          "tool": "젤 램프(둥근 지붕 모양, 웃는 얼굴)",
          "how": "큰 램프 버튼을 콕 → 손이 램프 안으로 쏙 → 램프가 부드러운 연보라빛으로 켜짐(깜빡이지 않음) → '하나, 둘, 셋, 넷, 다섯! One, two, three, four, five!' 천천히 셈(점 5개가 하나씩 참) → '띵' → 손을 빼면 손톱에 윤기가 생김",
          "seconds": 5,
          "sound": "낮고 부드러운 웅 소리(작게), 끝에 맑은 띵"
        },
        "art": {
          "ko": "그림 그리기",
          "en": "Nail art",
          "how": "확대한 손톱에 손가락으로 그림. 가는 붓 색 3개 중 하나. 선이 손톱 밖으로 나가면 손톱 안에만 남음. 손톱 모양 밖은 칠해지지 않음"
        },
        "stamp": {
          "ko": "모양 도장",
          "en": "Stamp",
          "how": "모양 카드 3장(하트, 별, 꽃, 물방울 점, 줄무늬 중) 콕 → 확대한 손톱을 콕 하면 그 자리에 쿡. 도장 색은 지금 고른 색",
          "shapes": [
            "heart",
            "star",
            "flower",
            "dots",
            "stripes",
            "moon"
          ]
        },
        "parts": {
          "ko": "파츠 붙이기",
          "en": "Gems",
          "how": "보석·진주·리본·별 파츠 카드 3장. 카드를 콕 하거나 손톱에 끌어다 놓으면 붙음. 붙은 파츠를 끌어서 빼면 떨어짐, 콕 하면 색이 바뀜(동물 미용실 꾸미기와 같은 규칙)",
          "items": [
            "round gem",
            "heart gem",
            "pearl",
            "tiny ribbon",
            "star stud",
            "flower part"
          ]
        },
        "top": {
          "ko": "탑젤",
          "en": "Top gel",
          "how": "투명한 탑젤을 쓱 칠하고 다시 램프에 굽기 → 아주 반짝이는 윤기(하이라이트 두 줄)"
        },
        "oil": {
          "ko": "오일",
          "en": "Oil",
          "how": "스포이트를 콕 → 손톱 뿌리에 한 방울 톡 → 문지르면 촉촉. 마지막에 손을 쓰다듬듯 쓱쓱 핸드크림(선택)"
        }
      },
      "flow": "갈기·베이스·색·굽기는 차례대로(손톱 5개 모두가 아니라 아이가 칠한 손톱만 해도 다음으로 갈 수 있게: 손톱 3개 이상 하면 다음 버튼이 조용히 나타남). 굽기 뒤 그림·도장·파츠는 아이가 마음대로 고름(도구 칸에서 큰 그림 버튼 3개). 끝내기는 아이가 거울 버튼",
      "toolRail": "무대 아래 도구 칸: 지금 단계의 도구 하나가 크게. 꾸미기 단계에서만 붓·도장·보석 버튼 3개(110px 이상)",
      "finish": {
        "button": "거울 버튼, 꾸밈이 1개 이상이면 8초 뒤 나타남",
        "moment": "손님이 손을 들어 손톱을 보며 '우와! 예쁘다! Wow, so pretty!' → 찰칵 → 손톱 액자가 가게 벽으로(최근 3개)",
        "leave": "손 흔들며 문 밖으로 → 가게 앞"
      },
      "colors": "calm.choiceColors 사용(고를 땐 hex, 칠해진 손톱은 vivid). 단계별 색 수는 levels",
      "special": {
        "glitter": "반짝이 젤: 차분한 펄(작은 흰 점이 은은하게, 반짝이지 않음)",
        "french": "프렌치: 손톱 끝만 흰색 곡선(끝을 쓱 칠하면 곡선 안만)",
        "gradient": "그라데이션: 스펀지로 톡톡, 두 색이 부드럽게 섞임"
      },
      "levels": [
        {
          "level": 1,
          "steps": [
            "color",
            "cure",
            "parts"
          ],
          "colors": 3,
          "parts": 3,
          "customers": [
            "mom",
            "bunnyPaw"
          ],
          "new": "색 젤 칠하고 램프에 굽고 보석 붙이기"
        },
        {
          "level": 2,
          "steps": [
            "file",
            "color",
            "cure",
            "stamp",
            "parts"
          ],
          "colors": 5,
          "stamps": 3,
          "parts": 4,
          "customers": [
            "mom",
            "bunnyPaw",
            "baby"
          ],
          "new": "손톱 갈기, 모양 도장"
        },
        {
          "level": 3,
          "steps": [
            "file",
            "base",
            "color",
            "cure",
            "stamp",
            "parts",
            "top",
            "cure"
          ],
          "colors": 7,
          "stamps": 4,
          "parts": 5,
          "new": "베이스 젤과 탑젤, 반짝이는 윤기"
        },
        {
          "level": 4,
          "steps": [
            "file",
            "base",
            "color",
            "cure",
            "art",
            "stamp",
            "parts",
            "top",
            "cure",
            "oil"
          ],
          "colors": 10,
          "stamps": 6,
          "parts": 6,
          "special": [
            "glitter"
          ],
          "new": "손가락으로 그림 그리기, 반짝이 젤, 오일"
        },
        {
          "level": 5,
          "steps": [
            "file",
            "base",
            "color",
            "cure",
            "art",
            "stamp",
            "parts",
            "top",
            "cure",
            "oil"
          ],
          "colors": 10,
          "special": [
            "glitter",
            "french",
            "gradient"
          ],
          "customers": [
            "모두",
            "family"
          ],
          "new": "프렌치와 그라데이션, 가족 손님"
        }
      ],
      "itemUnlock": "동물 미용실의 itemUnlock과 같은 규칙: 손님 3명마다 도장이나 파츠 1개가 새로 생김(리본 표시, 이름 음성)",
      "photoItems": "P6에서 엄마가 넣은 '반지'나 '네일 스티커' 사진이 있으면 파츠 카드에 섞여 나옴(카드 3장 중 최대 1장)",
      "voice": {
        "enter": [
          "네일숍에 어서 오세요!",
          "Welcome to the nail shop!"
        ],
        "file": [
          "쓱쓱, 손톱을 예쁘게 갈아요",
          "File file, nice and smooth"
        ],
        "color": [
          "무슨 색을 칠할까?",
          "Which color?"
        ],
        "cure": [
          "램프에 넣고 구워요! 하나, 둘, 셋, 넷, 다섯!",
          "Into the lamp! One, two, three, four, five!"
        ],
        "shiny": [
          "반짝반짝 윤기가 나요!",
          "So shiny!"
        ],
        "top": [
          "탑젤을 바르고 한 번 더!",
          "Top gel, one more time!"
        ]
      },
      "calmRules": [
        "램프 빛은 깜빡이지 않고 서서히 켜지고 꺼짐",
        "반짝이 효과는 정지된 하이라이트 위주, 반복 반짝임 금지",
        "한 번에 움직이는 것은 지금 도구와 안내 손뿐"
      ],
      "allNailsObvious": {
        "_설명": "사용 후기: '네일은 손가락 하나만 돼요?' 기능은 모든 손톱에서 되지만(터치로 확인), 화면이 하나만 되는 것처럼 보임.",
        "why": [
          "손톱 3개를 칠하면 큰 다음 버튼이 손 위(넷째·다섯째 손톱 옆)에 나타나 나머지를 가리고 넘어가게 만듦",
          "굽기 뒤 안내 손이 손톱 하나만 계속 가리킴",
          "꾸미기는 손톱 하나를 확대한 화면에서만 됨. 돌아가는 손 그림 버튼의 뜻을 알기 어려움"
        ],
        "fix": {
          "nextButton": "다음 그림 버튼은 손을 가리지 않게 항상 아래 칸 오른쪽 끝에. 손톱을 모두 칠하기 전에는 작고 흐리게(누를 수는 있음), 모두 칠하면 크게",
          "remaining": "아직 안 한 손톱은 테두리가 은은하게 빛남. 안내 손은 한 손톱에 머물지 않고 안 한 손톱을 차례로 가리킴",
          "decorateOnWholeHand": "도장과 파츠는 확대하지 않고 손 전체 화면에서 바로: 카드를 고른 뒤 아무 손톱이나 콕 하면 그 손톱에 붙음(가운데에 자동으로 자리 잡음). 손톱마다 다른 것을 붙일 수 있음",
          "zoomOnlyForDrawing": "확대는 손가락 그림 그리기에서만. 확대 화면 양옆에 큰 화살표 그림으로 옆 손톱으로 바로 넘어감(손 전체로 돌아가지 않아도 됨)",
          "allAtOnceHelper": "토토 도우미: 한 손톱을 다 하면 '다음 손톱도 해 볼까? Next one!' 하고 다음 손톱이 살짝 들썩임",
          "finishRule": "거울 버튼은 지금처럼 아이가 누를 때만. 다만 꾸민 손톱이 1개뿐이면 누르기 전에 나머지 손톱이 한 번 반짝여 알려 줌(막지는 않음)"
        }
      }
    },
    "maze": {
      "_설명": "길 찾기 미로(통합판에 있음, 다듬기). 2살은 막다른 길에서 헤매는 것을 싫어하므로 '눈으로 보고 고르는' 미로.",
      "control": "토토가 서 있고, 갈 수 있는 다음 자리에 큰 발자국 그림(110px)이 빛남. 발자국을 콕 하면 토토가 그 구간을 통통 걸어감. 길을 손가락으로 따라가도 됨(touch.trace 규칙: 굵은 길, 근처만 가도 인정, 천천히 도와줌)",
      "noDeadEndWandering": "틀린 길에는 이유가 보임(자고 있는 고양이, 물웅덩이, 닫힌 문). 그래도 가면 친구가 '이쪽이 아니야, 이쪽!' 하고 토토가 스스로 돌아옴. 실패·시간 제한 없음",
      "view": "미로 전체가 한 화면에(밀지 않음). 길 폭은 화면 폭의 18% 이상",
      "goal": "목적이 있는 길: 토토를 집으로, 피자를 손님에게, 숨은 친구 찾기. 도착하면 친구가 반겨 줌",
      "levels": [
        {
          "level": 1,
          "new": "갈림길 없는 구불구불한 길, 발자국 4개"
        },
        {
          "level": 2,
          "new": "갈림길 1개(두 갈래), 틀린 길에 고양이가 자고 있음"
        },
        {
          "level": 3,
          "new": "갈림길 2개, 당근 3개 줍기"
        },
        {
          "level": 4,
          "new": "듣고 고르기: 갈림길에 사진 표지 2개 '사과가 있는 길로 가자! Go to the apple!'(photoCards와 연결)"
        },
        {
          "level": 5,
          "new": "열쇠를 주워 문 열기, 갈림길 3개"
        }
      ],
      "foundInReview": "통합판: 단계 탭(1단계★·2단계·3단계 자물쇠), 글자 안내 두 줄, 점무늬 배경, 길 위의 작은 점(약 40px)을 눌러 한 칸씩 이동, 막다른 길 여러 곳, '출발' 글자 딱지",
      "keepFromCodex": "칸으로 된 길과 '점을 콕 하면 한 칸 이동' 방식은 좋음. 점을 110px 발자국으로 키우고 나머지를 고침"
    },
    "rhythmClap": {
      "_설명": "리듬 박수(통합판에 있음). 다듬기: 글자 없이, 토토가 먼저 박수 2~4번을 보여 주고 아이가 큰 북(화면 가운데 200px)을 같은 수만큼 콕. 틀려도 '한 번 더 같이!' 하고 토토가 같이 침.",
      "levels": [
        {
          "level": 1,
          "new": "박수 2번"
        },
        {
          "level": 2,
          "new": "3번"
        },
        {
          "level": 3,
          "new": "빠르게-느리게 섞기"
        },
        {
          "level": 4,
          "new": "동요 한 소절에 맞춰"
        }
      ],
      "_다듬기": "지금은 북 그림을 누르면 소리만 남. 토토가 지휘하는 작은 음악회로: 악기 카드 3장 중 고르기(북·탬버린·종) → 토토가 먼저 2~4번 치는 것을 보여 줌 → 아이가 큰 악기(200px)를 같은 수만큼 콕 → 맞으면 친구들이 춤, 틀려도 '한 번 더 같이!' → 3번 하면 동요 한 소절에 맞춰 마음대로 치는 자유 연주로 끝"
    },
    "restaurant": {
      "_설명": "식당(통합판의 셰프 도전을 다시). 손님이 주문하고, 재료를 고른 뒤 **직접 요리**함. 메뉴마다 3~4과정.",
      "foundInReview": "지금은 카드 2장 중 고르면 그림이 나타나고 '다음 →'을 누르는 것이 전부",
      "flow": "가게 앞 손님 고르기(말풍선에 음식 그림) → 주문 그림이 화면 위 과정 줄에 → 과정마다: 재료 카드 2~3장 중 고르기(틀리면 '이건 스파게티야!' 하고 다시) → 그 재료로 손동작 → 다 되면 손님에게 건네기 → 냠냠 → 하트",
      "menus": [
        {
          "id": "toast",
          "ko": "호텔 아침 식사",
          "en": "breakfast",
          "steps": [
            "빵을 토스터에 쏙(콕) → 통! 튀어나오면 접시에",
            "달걀을 톡 깨서(콕 2번) 프라이팬에 → 지글지글 → 뒤집개 도구로 뒤집기",
            "딸기나 포도를 물에 씻어(쓱쓱) 접시에 올리기"
          ]
        },
        {
          "id": "chicken",
          "ko": "바삭 치킨",
          "en": "fried chicken",
          "steps": [
            "닭 조각에 튀김가루 묻히기(쓱쓱 굴리기)",
            "기름 냄비에 하나씩 퐁당(조각 4개를 다 넣어야 다음)",
            "지글지글, 노릇해지면 집게로 건지기",
            "바구니에 4조각 담기"
          ]
        },
        {
          "id": "burger",
          "ko": "버거",
          "en": "burger",
          "steps": [
            "패티 굽기(뒤집기)",
            "빵 위에 차례로 쌓기: 상추, 패티, 치즈, 토마토(썬 만큼)",
            "뚜껑 빵 덮고 꾹"
          ]
        },
        {
          "id": "pasta",
          "ko": "파스타",
          "en": "pasta",
          "steps": [
            "냄비에 면 넣고 젓기",
            "소스 국자로 붓기",
            "치즈 갈아 뿌리기"
          ]
        }
      ],
      "rules": [
        "만든 만큼 쓰기(조각 4개면 4개 다)",
        "과정은 버튼이 아니라 동작으로 끝남",
        "손님은 ML.Alive로 기다리며 반응",
        "재료가 처음 나올 때 진짜 사진 잠깐(photoCards.linkToGames)"
      ],
      "levels": [
        {
          "level": 1,
          "new": "호텔 아침 식사, 재료 카드 2장"
        },
        {
          "level": 2,
          "new": "바삭 치킨"
        },
        {
          "level": 3,
          "new": "버거, 재료 카드 3장"
        },
        {
          "level": 4,
          "new": "파스타, 손님이 두 가지를 주문"
        }
      ]
    },
    "icecream": {
      "_설명": "아이스크림 가게 다시 만들기. 지금은 화면 대부분이 비어 있고 이모지 펭귄과 세모·네모 도형뿐.",
      "flow": "가게 앞 손님(말풍선에 맛 색깔) → 콘/컵 카드 2장 중 고르기 → 스쿱 도구로 아이스크림 통을 쓱쓱 긁으면 동그란 공이 만들어짐(makeTool) → 콘 위에 톡 올리기 → 토핑 통을 흔들어 뿌리기(쓱쓱) → 손님에게 건네기 → 냠냠, 코에 아이스크림 묻음",
      "levels": [
        {
          "level": 1,
          "new": "한 스쿱, 맛 2가지"
        },
        {
          "level": 2,
          "new": "두 스쿱 쌓기, 맛 3가지"
        },
        {
          "level": 3,
          "new": "토핑(스프링클, 체리)"
        },
        {
          "level": 4,
          "new": "손님이 고른 맛과 같은 색 고르기"
        }
      ]
    },
    "clothes": {
      "_설명": "옷 가게(공주 왕자 옷 입기를 다시). 지금은 노란 이모지 얼굴에 세모 몸, 글자 탭 6개, 가로로 밀리는 얼굴 줄.",
      "doll": "말랑 그림체로 그린 아이 캐릭터(몸·팔·다리가 있는 진짜 인형 그림), ML.Alive로 살아 있음. 가족 얼굴(P4)을 넣으면 그 얼굴로",
      "how": "미용실 꾸미기 방식: 머리·윗옷·아래옷(치마)·신발 자리를 콕 하면 그 자리 카드 3장. 붙이기·바꾸기·끌어서 떼기·콕 해서 색 바꾸기. 거울 버튼으로 끝 → 빙글 → 찰칵",
      "themes": [
        "공주·왕자",
        "잠옷",
        "비 오는 날(우산·장화)",
        "눈 오는 날",
        "수영장"
      ],
      "levels": [
        {
          "level": 1,
          "new": "옷 2벌 중 하나"
        },
        {
          "level": 2,
          "new": "옷 3벌 + 머리 장식"
        },
        {
          "level": 3,
          "new": "신발과 소품"
        },
        {
          "level": 4,
          "new": "우리 집 옷"
        }
      ]
    }
  },
  "sound": {
    "_설명": "소리는 부드럽게 시작하고(어택 30ms 이상) 크지 않게. 무서워하는 소리는 미리 알려 주고 작은 소리부터.",
    "master": 0.8,
    "dryer": {
      "character": "눈과 웃는 입이 있는 드라이기 친구 '윙윙이'",
      "warnBefore": {
        "ko": "이제 윙~ 소리가 날 거야. 따뜻한 바람이야!",
        "en": "Here comes a warm whoosh!"
      },
      "childControls": "아이가 눌렀을 때만 켜지고 1.2초 뒤 스스로 꺼짐",
      "volumeByUse": [
        0.15,
        0.25,
        0.35,
        0.45
      ],
      "recipe": "낮은 모터 음(약 180Hz) + 부드러운 바람(저역 통과 잡음). 날카로운 고음 금지",
      "petReaction": {
        "ko": "아이 따뜻해~",
        "en": "So warm!"
      },
      "parentVolume": [
        0,
        0.5,
        1
      ]
    },
    "shower": {
      "recipe": "빗소리 같은 잡음(대역 통과) + 가끔 물방울 '똑'",
      "volume": 0.3,
      "warnBefore": {
        "ko": "물이 나와요, 쏴아~",
        "en": "Here comes the water!"
      }
    },
    "bgm": {
      "_설명": "앱을 쓰는 동안 조용한 동요 가락이 차례로 흐릅니다. 가사 없이 가락만, 모두 저작권이 끝난 전래·외국 민요 가락입니다. 산토끼·학교 종·곰 세 마리는 권리 확인이 안 되어 넣지 않습니다.",
      "volume": 0.12,
      "tempoBpm": 84,
      "instrument": "오르골 같은 부드러운 음",
      "gapBetweenSongsMs": 6000,
      "duckWhileSpeaking": 0.3,
      "pauseIn": [
        "music",
        "rhythm",
        "sounds",
        "videos"
      ],
      "notation": "숫자는 계이름(1=도 … 7=시, 8=높은 도, 9=높은 레, 10=높은 미, 11=높은 파). 앞에 점이 있으면 낮은 음(.5=낮은 솔, .6=낮은 라, .7=낮은 시). 0은 쉼, 뒤의 '-' 하나마다 길이 2배. 가락은 대략이니 들어 보고 다듬을 것",
      "selected": "everyday",
      "sets": {
        "everyday": {
          "ko": "동요",
          "songs": [
            {
              "ko": "작은 별",
              "notes": "1 1 5 5 6 6 5- 4 4 3 3 2 2 1- 5 5 4 4 3 3 2- 5 5 4 4 3 3 2- 1 1 5 5 6 6 5- 4 4 3 3 2 2 1-"
            },
            {
              "ko": "나비야",
              "notes": "5 3 3- 4 2 2- 1 2 3 4 5 5 5- 5 3 3- 4 2 2- 1 3 5 5 3 3 3- 2 2 2 2 2 3 4- 3 3 3 3 3 4 5- 5 3 3- 4 2 2- 1 3 5 5 1 1 1-"
            },
            {
              "ko": "비행기",
              "notes": "3 2 1 2 3 3 3- 2 2 2- 3 5 5- 3 2 1 2 3 3 3 3 2 2 3 2 1--"
            },
            {
              "ko": "런던 다리",
              "notes": "5 6 5 4 3 4 5- 2 3 4- 3 4 5- 5 6 5 4 3 4 5- 2- 5- 3 1--"
            },
            {
              "ko": "주먹 쥐고",
              "notes": "3- 3 2 1- 1- 2- 2 4 3 2 1- 5- 5 4 3- 3- 2 1 2 3 1--"
            },
            {
              "ko": "동네 한 바퀴(프레르 자크)",
              "notes": "1 2 3 1 1 2 3 1 3 4 5- 3 4 5- 5 6 5 4 3 1 5 6 5 4 3 1 1 .5 1- 1 .5 1-"
            },
            {
              "ko": "노를 저어라",
              "notes": "1- 1- 1 2 3- 3 2 3 4 5-- 8 8 8 5 5 5 3 3 3 1 1 1 5 4 3 2 1--"
            },
            {
              "ko": "맥도날드 아저씨 농장",
              "notes": "1 1 1 .5 .6 .6 .5- 3 3 2 2 1--"
            },
            {
              "ko": "생일 축하",
              "notes": ".5 .5 .6 .5 1 .7- .5 .5 .6 .5 2 1- .5 .5 5 3 1 .7 .6 4 4 3 1 2 1-"
            },
            {
              "ko": "아리랑",
              "notes": ".5- .6 .5 .6 1- 2 1 2 3 2 3 2 1 .6 .5 .6 .5 .6 1- 2 1 2 3 2 1 .6 .5 .6 1 1--"
            }
          ],
          "more": [
            "거미가 줄을 타고",
            "열 꼬마",
            "브람스 자장가",
            "새야 새야",
            "두껍아 두껍아"
          ]
        },
        "christmas": {
          "ko": "크리스마스",
          "theme": "christmas",
          "instrument": "오르골 + 작은 종소리",
          "songs": [
            {
              "ko": "징글벨",
              "notes": "3 3 3- 3 3 3- 3 5 1 2 3-- 4 4 4 4 4 3 3 3 3 2 2 3 2- 5- 3 3 3- 3 3 3- 3 5 1 2 3-- 4 4 4 4 4 3 3 3 5 5 4 2 1--"
            },
            {
              "ko": "고요한 밤",
              "notes": "5 6 5 3-- 5 6 5 3-- 9- 9 7-- 8- 8 5-- 6- 6 8 7 6 5 6 5 3-- 6- 6 8 7 6 5 6 5 3-- 9- 9 11 9 7 8-- 10-- 8 5 3 5 4 2 1--"
            },
            {
              "ko": "기쁘다 구주 오셨네",
              "notes": "8- 7 6 5- 4 3- 2- 1-- 5 6- 6 7- 7 8--"
            },
            {
              "ko": "위 위시 유 어 메리 크리스마스",
              "notes": "5 8 8 9 8 7 6 6 6 9 9 10 9 8 7 5 5 10 10 11 10 9 8 6 5 5 6 9 7 8--"
            },
            {
              "ko": "덱 더 홀",
              "notes": "5- 4 3- 2- 1- 2- 3- 1- 2 3 4 2 3- 2 1- .7- 1--"
            },
            {
              "ko": "소나무야",
              "notes": ".5 1 1 1- 2 3 3 3- 3 2 3 4- .7 2- 1-"
            }
          ],
          "more": [
            "저 들 밖에 한밤중에",
            "징글벨 1절"
          ]
        },
        "off": {
          "ko": "끔"
        }
      },
      "neverUse": [
        "루돌프 사슴코",
        "울면 안 돼",
        "창밖을 보라",
        "화이트 크리스마스",
        "산토끼",
        "학교 종",
        "곰 세 마리",
        "다른 앱이나 만화의 노래"
      ],
      "whereToChoose": "어른 설정의 '배경음'. 크리스마스를 고르면 홈 화면도 크리스마스 테마로 바뀜(themes.christmas)"
    }
  },
  "gate": {
    "_설명": "10분마다 '엄마한테 허락 받아요'. 아이를 벌주는 화면이 아니라 차분한 쉬는 화면.",
    "everyMinutes": 15,
    "warnAtMinutes": 9,
    "warnVoice": {
      "ko": "조금 있으면 쉬는 시간이야. 이것만 하고 엄마한테 가자!",
      "en": "Almost break time!"
    },
    "finishCurrentStepFirst": true,
    "screen": {
      "voice": {
        "ko": "엄마한테 허락 받아요!",
        "en": "Let's ask Mommy!"
      },
      "look": "토토가 손을 흔드는 조용한 화면. 음악 멈춤"
    },
    "mode": "mission_then_parent",
    "modes": {
      "parent_only": "어른이 풀어 주면 끝",
      "mission_then_parent": "엄마와 같이 하는 짧은 미션 1개(선 긋기 1줄 또는 낱말 2개)를 하고 나면 어른 확인 버튼이 나옴"
    },
    "mission": {
      "types": [
        "trace_line",
        "word_cards"
      ],
      "useChildLevel": true,
      "alwaysCompletable": true,
      "note": "미션은 벌이 아니라 엄마와 함께 하는 시간. 실패 없음, 도움 충분히",
      "traceUses": "touch.trace (천천히, 끝까지 가게 도움)"
    },
    "parentCheck": {
      "type": "말로 불러 준 두 자리 숫자를 누르기 + 2초 누르기",
      "example": "칠십삼 → 7, 3"
    },
    "extendMinutes": "everyMinutes 와 같음",
    "afterMax": {
      "ko": "오늘 놀이는 끝! 내일 또 만나요.",
      "en": "All done for today! See you tomorrow."
    },
    "offlineIdea": "끝 화면에 '화면 밖 놀이' 한 가지를 어른에게 제안 (예: 진짜 수건으로 인형 말려 주기)",
    "intervalOptions": [
      10,
      15,
      20,
      30
    ],
    "dailyMaxMinutes": 60,
    "dailyMaxOptions": [
      30,
      45,
      60
    ],
    "_권장": "29개월에는 15분을 권합니다. 한 놀이가 1~2분이라 10분은 조금 짧고, 30분은 길 수 있어요. 하루 합계는 WHO 권고(2~4세 1시간 이하)에 맞춰 60분"
  },
  "cast": {
    "_설명": "가족 얼굴 사진을 동그랗게 잘라 캐릭터 얼굴로 씁니다. 사진은 기기 안에만 저장.",
    "slots": [
      {
        "id": "baby",
        "ko": "우리 아기",
        "en": "baby",
        "role": "주인공"
      },
      {
        "id": "mom",
        "ko": "엄마",
        "en": "Mommy"
      },
      {
        "id": "dad",
        "ko": "아빠",
        "en": "Daddy"
      },
      {
        "id": "uncle",
        "ko": "삼촌",
        "en": "Uncle"
      },
      {
        "id": "grandma",
        "ko": "할머니",
        "en": "Grandma"
      }
    ],
    "usedIn": [
      "미용실 손님(4단계)",
      "옷 입히기 인형",
      "화장 놀이 얼굴",
      "칭찬 화면"
    ],
    "photoSizePx": 256,
    "unlimited": true,
    "addButton": "어른용 얼굴 화면 맨 끝에 '+ 얼굴 추가'. 이름과 영어 이름을 직접 적음",
    "faceCut": {
      "_설명": "동그라미가 아니라 얼굴만 오려냅니다.",
      "steps": [
        "사진 고르기",
        "얼굴 타원 틀을 손가락으로 맞추기(위치·크기)",
        "턱선과 머리카락은 기존 지우개·되살리기로 손보기",
        "가장자리를 부드럽게"
      ],
      "auto": "기기가 얼굴 찾기를 지원하면 틀을 자동으로 맞춰 줌. 지원하지 않으면 손으로"
    },
    "emoticon": {
      "_설명": "오려낸 얼굴이 살아 있는 이모티콘처럼 움직입니다.",
      "motions": [
        "왼쪽 보기",
        "오른쪽 보기",
        "위로 끄덕",
        "아래로 끄덕",
        "갸웃",
        "통통 뛰기",
        "부르르"
      ],
      "overlays": [
        "볼 빨개짐",
        "하트",
        "반짝이",
        "땀방울",
        "쿨쿨(잠)",
        "박수 손"
      ],
      "howItWorks": "사진을 살짝 기울이고 늘이고 옮겨서 고개를 돌리는 것처럼 보이게 함 + 그린 효과를 얹음",
      "limit": "사진 한 장으로 웃는 얼굴을 놀란 얼굴로 바꾸지는 못함",
      "expressionPhotos": {
        "optional": true,
        "max": 3,
        "kinds": [
          "기본",
          "웃는 얼굴",
          "놀란 얼굴"
        ],
        "note": "표정 사진을 더 넣으면 상황에 맞게 바꿔 보여 줌"
      }
    },
    "storage": "사진이 많아지므로 IndexedDB에 저장. 기존 localStorage 데이터는 처음 한 번 옮김"
  },
  "wardrobe": {
    "_설명": "단계를 올리면 '옷 선물 티켓'이 생기고, 아이가 엄마에게 부탁하면 엄마가 사진을 찍어 배경을 지워 넣어 줍니다.",
    "ticketOnLevelUp": true,
    "askScreenVoice": {
      "ko": "엄마, 내 옷 넣어 주세요!",
      "en": "Mommy, add my dress please!"
    },
    "parentFlow": [
      "어른 확인",
      "사진 찍기 또는 고르기",
      "자동 배경 지우기 + 손보기",
      "종류 고르기(categories)",
      "저장"
    ],
    "reuse": "play3.js 의 openCutout 과 옷장 저장을 그대로 사용",
    "maxItems": 30,
    "categories": [
      {
        "id": "dress",
        "ko": "드레스·옷",
        "en": "dress",
        "goes": "몸"
      },
      {
        "id": "shoes",
        "ko": "신발",
        "en": "shoes",
        "goes": "발"
      },
      {
        "id": "headband",
        "ko": "머리띠·모자",
        "en": "headband",
        "goes": "머리"
      },
      {
        "id": "neck",
        "ko": "목걸이·목도리",
        "en": "necklace",
        "goes": "목"
      },
      {
        "id": "glasses",
        "ko": "안경",
        "en": "glasses",
        "goes": "얼굴"
      },
      {
        "id": "bag",
        "ko": "가방",
        "en": "bag",
        "goes": "손"
      },
      {
        "id": "toy",
        "ko": "애착 인형·장난감",
        "en": "toy",
        "goes": "옆"
      }
    ],
    "fit": "종류마다 정해진 자리와 크기에 자동으로 맞춤. 어른이 한 번 위치·크기를 손볼 수 있음"
  },
  "themes": {
    "_설명": "배경음 묶음과 연결된 화면 테마. 차분함 규칙(calm)은 그대로 지킵니다.",
    "default": {
      "home": "봄 마을"
    },
    "christmas": {
      "linkedBgm": "christmas",
      "suggestBetween": [
        "12-01",
        "01-05"
      ],
      "suggestHow": "이 기간에 어른 설정을 열면 한 번 권함. 자동으로 바꾸지 않음",
      "palette": {
        "pine": "#6FA58A",
        "berry": "#C96A63",
        "snow": "#FBF8F2",
        "gold": "#E3C46A",
        "night": "#C9D6EA"
      },
      "home": [
        "지붕과 나무 위에 눈",
        "집 옆에 작은 트리",
        "처마에 꼬마전구 (천천히 은은하게, 깜빡임 금지)",
        "토토가 빨간 목도리",
        "눈송이 최대 10개가 천천히 내림"
      ],
      "voice": {
        "ko": "메리 크리스마스!",
        "en": "Merry Christmas!"
      }
    }
  },
  "home": {
    "_설명": "통합판의 '놀이 마을' 그림(종이 공예 원 4개 + 가운데 집)을 살리되 한 화면으로. 지금 통합판 홈은 세로로 3화면 길이에 진입 방식이 5가지(오늘의 놀이 배너, 놀이 목록, 실사진 카드 줄, 놀이 마을, 바로 놀기, 탐험대)라 뒤죽박죽.",
    "layout": [
      "위: 토토와 큰 시작 버튼(오늘의 놀이)",
      "가운데: 우리 집 그림",
      "둘레: 둥근 문 4개 (각 130px 이상)",
      "아래: 내 방"
    ],
    "portals": [
      {
        "id": "cook",
        "ko": "요리",
        "en": "Cooking"
      },
      {
        "id": "salon",
        "ko": "꾸미기",
        "en": "Dress up"
      },
      {
        "id": "learn",
        "ko": "배움",
        "en": "Learning"
      },
      {
        "id": "music",
        "ko": "노래",
        "en": "Music"
      }
    ],
    "mySpace": {
      "ko": "내 방",
      "what": "별을 모아 받은 선물(스티커, 가구, 장식)을 아이가 놓아 꾸미는 방. 사진으로 넣은 옷과 가족 얼굴 액자도 여기에 보임",
      "reward": "단계가 오를 때마다 선물 1개"
    },
    "inside": "문 안에는 놀이 그림 타일을 한 번에 4개까지. 더 있으면 큰 화살표로 다음 장",
    "portalStyle": "문은 종이 공예 그림의 큰 원(지름 150px 이상). 문 안의 세계를 그림으로 보여 줌(요리=부엌, 꾸미기=숲 속 미용실, 배움=바닷가, 노래=언덕). 크리스마스 테마에서는 christmas 그림으로 바뀜. 글자는 원 아래에 작게, 소리로 이름을 말함.",
    "portalGrowth": "문 안 놀이들의 단계가 오르면 문 그림이 자람(grow 0→3: 나무·꽃·집이 하나씩 늘어남). 숫자마스터의 'Lv. 합계' 글자를 그림으로 바꾼 것.",
    "oneScreen": [
      "위(화면의 28%): 토토와 큰 그림 시작 버튼. 오늘의 놀이는 글자('리듬 박수') 대신 그 놀이 그림. 진행은 '0/3 완료' 대신 별 3칸",
      "가운데와 아래(72%): 놀이 마을. 원 4개(각 140px 이상)와 가운데 집(내 방)",
      "어른 버튼은 오른쪽 위 작은 톱니(2초 누르기) 그대로"
    ],
    "remove": [
      "오늘 놀이 목록 접기 줄",
      "실사진 낱말 카드 가로 줄(배움 학교 안 첫 타일로)",
      "바로 놀기 이모지 카드 3개(각 장소 안으로)",
      "말랑 마을 탐험대 가로 넘김(각 장소 안으로)",
      "같은 놀이가 두 군데 나오는 것(요리 마을이 원과 탐험대에 둘 다 있음)"
    ],
    "places": {
      "cook": {
        "ko": "요리 마을",
        "en": "Cooking town",
        "games": [
          "pizza",
          "bread",
          "cake",
          "chef(셰프 도전)",
          "dishes"
        ]
      },
      "salon": {
        "ko": "꾸미기 살롱",
        "en": "Salon",
        "games": [
          "petsalon",
          "nailshop",
          "dressup",
          "makeup",
          "coloring",
          "xmasHouse(12월에는 맨 앞)"
        ]
      },
      "learn": {
        "ko": "배움 학교",
        "en": "School",
        "games": [
          "photoCards(맨 앞)",
          "maze",
          "jobs",
          "animals",
          "counting",
          "shapes",
          "trace",
          "words",
          "quest(공주 모험)"
        ]
      },
      "music": {
        "ko": "노래 극장",
        "en": "Music hall",
        "games": [
          "rhythmClap",
          "music",
          "songs"
        ]
      },
      "myroom": {
        "ko": "내 방",
        "en": "My room",
        "games": [
          "선물 놓기",
          "가족",
          "도장",
          "chores",
          "routine"
        ]
      }
    },
    "insidePlace": "장소 안은 그 장소의 종이 공예 배경 위에 놀이 그림 타일을 한 번에 4개(2×2, 각 150px 이상). 더 있으면 오른쪽 아래 큰 화살표 그림으로 다음 장. 타일은 직접 그린 그림(이모지 금지), 누르면 이름을 두 언어로",
    "labels": "글자 이름표는 작게 남겨도 됨(어른용). 누르면 항상 음성"
  },
  "language": {
    "_설명": "AI플레도 키즈처럼 한국어와 영어를 함께.",
    "modes": [
      "한국어+영어",
      "한국어",
      "English"
    ],
    "default": "한국어+영어"
  },
  "flow": {
    "_설명": "사용 후기: 최소한 다른 유아 역할놀이 앱처럼 진행되게. 놀이 한 판의 뼈대를 모든 가게 놀이(미용실, 네일숍, 이후 요리)에 똑같이.",
    "beats": [
      "1. 가게 앞: 손님이 걸어와 기다림 → 아이가 고름",
      "2. 손님이 들어와 인사하고, 원하는 것을 그림 말풍선과 몸짓으로 보여 줌(진흙을 가리키며 시무룩)",
      "3. 도구가 하나씩 튀어나옴 → 아이가 씀 → 손님이 계속 반응 → 단계 끝에 폴짝·박수",
      "4. 단계 사이 짧은 이음 장면(1.5초): 욕조에 퐁당, 수건 쓱, 의자가 빙글 등",
      "5. 꾸미기: 자유롭게, 손님이 거울을 보며 반응",
      "6. 마무리: 춤 → 찰칵 → 하트(당근) 하나 건네줌 → 손 흔들며 나감",
      "7. 다음 손님이 걸어옴"
    ],
    "stepStrip": "화면 위에 이번 손님의 과정 그림 2~4개(작은 동그라미). 지금 과정만 크게, 끝난 과정은 체크 대신 별. 누르는 것이 아니라 보여 주기만",
    "extraSteps": {
      "pickLeaves": "나뭇잎·잔가지를 콕콕 떼기(잎 5개, 콕 하면 톡 떨어짐). 나뭇잎 손님의 첫 과정",
      "towel": "말리기 전에 수건으로 톡톡(콕 3번, 수건이 동물을 폭 감쌌다 풀림)",
      "perfume": "꾸미기 뒤 향수 칙(콕 1번, 하트 구름이 천천히 퍼짐)"
    },
    "reward": "손님이 나갈 때 하트(또는 당근) 1개를 건네줌 → 화면 위 바구니로(P9의 당근 바구니와 연결)",
    "stepLengthSec": [
      5,
      12
    ],
    "neverFail": true
  },
  "rules": {
    "_설명": "사용 후기에서 나온 잘못을 다시 하지 않기 위한 쇠규칙. 모든 놀이 화면에 적용하고 tests/rules.js로 자동 검사. 하나라도 어기면 그 단계는 끝난 것이 아님.",
    "found": [
      "피자: 5번 썰면 10조각이 보이는데 4조각만 올리면 다음으로 넘어감(만든 수와 쓰는 수가 다름)",
      "피자: 옥수수는 써는 과정 없이 작은 덩어리로 올라감(준비 과정 없음, 조각이 너무 작음)",
      "손톱·케이크·빵·집안일: '후~ 말리기', '식히기', '촛불 켜기', '다음 ▶' 같은 글자 버튼(글을 못 읽는 아이)",
      "화면마다 버튼과 도구 위치가 다름(홈 12개 타일, 요리 구역 6개 등 중구난방)"
    ],
    "noReading": {
      "rule": "아이 화면에 글자를 읽어야 누를 수 있는 것이 없음. 모든 버튼은 큰 그림 + 눌렀을 때와 나타날 때 음성. 글자는 넣더라도 그림 아래 작은 보조(어른용)",
      "banned": [
        "글자만 있는 버튼",
        "이모지를 그림 대신 쓰는 버튼",
        "글자 안내 줄(hint)"
      ],
      "test": "아이 화면의 모든 button/누를 수 있는 요소는 svg 그림을 포함하고 그림이 버튼 넓이의 50% 이상. 글자만 있거나 이모지만 있으면 실패"
    },
    "doNotPressToSkip": {
      "rule": "과정은 '다음' 버튼이 아니라 **직접 해서** 끝남. 후~ 불기는 대상을 콕콕(입김 그림이 나감), 물 주기는 물뿌리개를 움직여서, 식히기는 부채를 흔들어서. 자유 꾸미기처럼 아이가 끝을 정하는 곳만 그림 버튼(거울, 종) 하나",
      "replace": {
        "후~ 말리기 버튼": "손톱 위를 콕콕 3번 → 입김 구름이 지나가며 마름(또는 네일숍 램프)",
        "식히기 버튼": "부채 도구를 움직여 김이 사라질 때까지",
        "촛불 켜기 버튼": "성냥(불씨) 도구를 초에 대면 켜짐",
        "물 주기": "물뿌리개 도구를 화분 위로 움직이면 물줄기, 꽃이 닿은 만큼 자람",
        "다음 ▶": "과정이 끝나면 저절로 다음으로(1.5초 이음 장면)"
      }
    },
    "madeEqualsUsed": {
      "rule": "만든 만큼 쓴다. 썬 조각 수 = 올릴 조각 수. 만든 것이 남은 채로 다음으로 넘어가지 않음. 조각을 다 올려야 끝나고, 화면에 남은 조각이 보임",
      "pizza": "한 재료를 4번 썰면 4조각. 접시에 4조각이 그대로 놓이고, 아이가 4조각을 다 올려야 다음 재료. (단계가 오르면 5, 6조각)",
      "test": "자르기 뒤 조각 수 == 올리기에서 요구하는 수 == 올리기가 끝났을 때 피자 위의 수, 접시에 남은 조각 0"
    },
    "everyIngredientPrepared": {
      "rule": "모든 재료는 통째 그림에서 시작해 준비 과정을 거친 뒤 올라감. 그냥 나타나지 않음",
      "prep": {
        "토마토·버섯·피망·페퍼로니·파인애플": "칼로 썰기(콕 하면 한 번씩)",
        "올리브": "병에서 톡톡 꺼내기(콕 하면 한 알)",
        "옥수수": "옥수수 자루를 쓱쓱 문질러 알 떼기(makeTool)",
        "치즈": "강판에 쓱쓱 갈기(makeTool)",
        "소스": "국자로 떠서 바르기"
      },
      "minPieceSize": "피자 위 조각 하나는 피자 지름의 16% 이상(무엇인지 알아볼 수 있게). 옥수수 알은 4알 묶음을 한 조각으로",
      "test": "cut:false 재료 없음 또는 다른 prep가 있음. 조각 크기 검사"
    },
    "sameLayoutEverywhere": {
      "rule": "모든 놀이 화면이 같은 세 구역: 위(왼쪽 위 뒤로 가기 + 가운데 과정 그림 줄) / 가운데 무대(캐릭터와 대상) / 아래 도구 칸(지금 도구 하나 또는 카드 3장). 끝내기·다음 그림 버튼은 항상 오른쪽 아래",
      "sizes": {
        "back": "64px 이상",
        "toolRail": "화면 높이의 18~22%",
        "cards": "110px 이상, 3장까지"
      },
      "homeAndZones": "홈과 구역 화면도 한 화면에 큰 그림 4~5개(P9). 스크롤 없음",
      "test": "각 화면에서 뒤로 가기·무대·도구 칸의 위치와 크기가 기준 범위 안. tests/audit.js에 추가"
    },
    "bigAndFew": "누를 것 110px 이상, 한 화면 선택지 3개 이하, 도구는 touch.tool 크기 (기존 규칙 재확인)",
    "checkBeforeDone": "단계를 끝냈다고 하기 전에: tests/rules.js + audit + monkey + 그 놀이 테스트. 그리고 실제 화면 캡처를 과정마다 한 장씩 보고에 붙임",
    "noEmojiArt": {
      "rule": "아이 화면의 그림에 이모지를 쓰지 않음(키우면 흐려지고, 기기마다 다르게 보이고, 그림체가 제각각). 모든 그림은 말랑 그림체로 직접 그린 것 또는 실사진",
      "found": "통합판 화면 20장 중 15장이 이모지 그림(소리 놀이, 출동 놀이의 흐린 집, 직업 옷의 노란 얼굴, 아이스크림 펭귄 등)",
      "test": "아이 화면의 글자 노드에 이모지 문자가 있으면 실패"
    },
    "oneShell": {
      "rule": "모든 놀이 화면은 공통 뼈대(shell)로만 만듦. 화면마다 머리줄·버튼·글꼴을 따로 만들지 않음",
      "found": "머리줄이 화면마다 다름: 집 그림/← 화살표/↩ 화살표가 섞여 있고, 소리 버튼 자리와 글꼴도 제각각. 오른쪽 위에 글자 전환 버튼(1~5·1~10, 북·박수·종, 엄마 손·아기 손, 얼굴·옷·색깔·머리·소품·옷장, 1단계·2단계·3단계)",
      "test": "놀이 화면이 ML.Shell.screen으로 등록됐는지, 머리줄 요소의 위치·크기가 모든 화면에서 같은지"
    },
    "dataMakesSense": {
      "rule": "묶음과 짝은 사람이 한 번 확인한 것만. 틀린 분류·없는 짝 금지",
      "found": [
        "실사진 카드 '몸·건강' 묶음에 나뭇잎과 뼈가 들어 있음(분류가 틀림)",
        "짝 맞추기에 버스·구급차·트랙터와 농부·조종사·의사가 나옴(조종사와 버스는 짝이 아님)"
      ],
      "test": "cards.json의 묶음마다 허용 낱말 목록과 대조, 짝 맞추기 표는 config에 적힌 짝만"
    },
    "realPlayNotQuiz": {
      "rule": "가게 놀이는 '두 장 중 고르고 다음 버튼'으로 끝나지 않음. 고른 재료로 **손으로 하는 동작**(넣기, 젓기, 뒤집기, 담기)이 반드시 이어짐",
      "found": "셰프 도전(바삭 치킨, 호텔 아침 식사): 카드 2장 중 고르면 그림이 나타나고 '다음 →' 글자 버튼. 요리하는 동작이 없음",
      "test": "가게 놀이의 각 과정에 도구 동작(makeTool 또는 콕 동작)이 1개 이상"
    },
    "noDeadSpace": "무대의 15% 넘는 빈 공간 금지. 캐릭터와 대상은 무대 높이의 45% 이상(젤리 세기, 아이스크림 가게는 화면 대부분이 비어 있고 캐릭터가 작음)",
    "depth": {
      "_설명": "사용 후기: '많이 단순해요.' 지금 놀이 대부분은 한 가지 동작(콕 누르기, 둘 중 고르기)을 몇 번 하면 끝남. 놀이 하나가 되려면 아래를 모두 갖춰야 함.",
      "found": [
        "집안일: 이모지 장난감 6개를 상자에 넣으면 끝",
        "설거지: 문지르기 → 수도꼭지 누르기 2과정, 아래 칸은 비어 있음",
        "셰프 도전: 둘 중 고르기 + 다음 버튼",
        "리듬 박수: 북 그림을 누르면 소리만",
        "아이스크림: 콘·컵 고르기부터 화면이 거의 비어 있음",
        "직업 옷: 누르면 옷이 한 번에 바뀜"
      ],
      "must": {
        "processes": "한 판에 서로 다른 과정 4개 이상(1단계는 3개부터 시작해 단계가 오르며 늘어남)",
        "handActions": "손동작 2가지 이상을 섞음: 콕(넣기, 깨기, 뿌리기) / 쓱쓱(문지르기, 젓기, 닦기) / 도구 움직이기(물줄기, 바람, 붓) / 끌어 놓기(쌓기, 담기) / 고르기",
        "visibleChange": "과정마다 대상의 모습이 눈에 보이게 달라짐(더러움 → 거품 → 반짝). 닿은 곳만 바뀜",
        "someone": "누군가를 위해 함: 살아 움직이는 손님이나 친구가 부탁하고, 기다리며 반응하고, 끝나면 기뻐함",
        "childChoice": "아이가 고르는 순간이 1번 이상(색, 맛, 장식, 손님). 틀린 답이 없는 고르기",
        "ending": "아이가 끝내는 순간과 결과물을 보여 주는 장면(건네주기, 거울, 사진)",
        "variety": "판마다 달라짐: 손님, 부탁, 재료, 그릇이 바뀜. 같은 판이 연달아 나오지 않음",
        "growth": "단계가 오르면 과정·재료·도구가 늘어남(games.*.levels)",
        "length": "한 판 1~3분"
      },
      "test": "놀이마다 과정 수, 손동작 종류 수, 손님(Alive) 유무, 고르기 유무, 끝내기 장면 유무를 표로 출력(tests/rules.js). 하나라도 없으면 '고칠 것'"
    }
  },
  "merge": {
    "_설명": "앱이 두 갈래로 갈라져 있음. (가) 이 저장소: 규칙·설정·검사와 미용실·네일숍·목소리·살아 있는 캐릭터. (나) 코덱스로 만든 '종이마을 통합판'(125MB html 한 파일): 놀이 마을 홈, 실사진 낱말 카드, 셰프 도전, 길 찾기 미로, 크리스마스 집, 리듬 박수, 직업 옷 입히기. 하나로 합쳐 저장소를 유일한 기준으로.",
    "base": "이 저장소(검사와 규칙이 여기 있음). 통합판의 화면과 사진을 이쪽으로 옮김",
    "noSingleHugeHtml": "사진을 html 안에 넣지 않음(125MB라 느리고 열기 어려움). 사진은 파일로 따로, 필요할 때만 불러옴",
    "afterMerge": "옮긴 화면마다 tests/rules.js와 audit을 돌려 통과/고칠 것 목록을 만듦. 고칠 것은 해당 단계(P13~P15, P8, P9)에서"
  },
  "photoCards": {
    "_설명": "실사진 낱말 카드(통합판에 있고 마음에 드는 기능). 살리면서 2살이 혼자 쓸 수 있게, 그리고 다른 놀이와 이어지게.",
    "foundInReview": [
      "묶음을 고르는 것이 글자 목록(드롭다운)",
      "한 묶음이 109장으로 너무 많고 순서대로 넘기기만 함",
      "'다시 듣기'가 글자 버튼, 넘기는 화살표가 작음",
      "'26 / 109' 숫자 표시",
      "아이 화면에 '사진 출처' 링크(앱 밖으로 나감)",
      "2살에게 맞지 않는 사진이 섞임(예: 뼈 표본 사진)",
      "묶음 분류가 틀림: '몸·건강'에 나뭇잎이 들어 있음 → 전체 다시 분류"
    ],
    "curation": {
      "age2Categories": [
        "동물",
        "과일·채소",
        "탈것",
        "우리 집 물건",
        "음식",
        "몸(아이 얼굴·손·발 사진)",
        "옷",
        "자연(꽃·나무·해·달)",
        "놀이터·장난감"
      ],
      "exclude": [
        "해부·표본·뼈·장기",
        "의료 기구·주사",
        "상처·피",
        "무서운 표정",
        "어두운 배경의 박물관 사진"
      ],
      "photoRule": "밝은 배경, 물건 하나가 크게, 가로 4:3으로 자름, 아이 눈높이에서 본 모습",
      "setSize": 8,
      "license": "저작권이 자유로운 사진만(CC0·퍼블릭 도메인 우선, 출처 표시가 필요한 것은 어른 화면의 '사진 출처'에 모아 표시). 아이 화면에는 링크 없음"
    },
    "choose": "묶음 고르기는 사진 카드 3장(그 묶음의 대표 사진, 150px 이상)과 다음 장 화살표. 누르면 묶음 이름을 두 언어로",
    "card": {
      "layout": "사진이 화면의 60% 이상. 아래에 낱말(한글, 영어)은 그대로 보여 줌(글자와 친해지기용, 읽을 필요는 없음)",
      "hear": "카드가 나오면 한국어 → 영어로 말함. **사진을 콕 하면 다시 들림**(다시 듣기 글자 버튼 삭제)",
      "next": "오른쪽 아래 큰 화살표 그림(110px 이상), 왼쪽 아래 이전. 넘길 때 카드가 부드럽게 넘어감(0.4초)",
      "progress": "숫자 대신 점 8개(본 카드는 채워짐)",
      "react": "사진을 콕 하면 살짝 통통(1.04배) + 토토가 옆에서 따라 말하는 몸짓(ML.Alive)"
    },
    "levels": [
      {
        "level": 1,
        "mode": "보고 듣기",
        "how": "한 묶음 8장을 넘겨 보며 듣기"
      },
      {
        "level": 2,
        "mode": "어디 있지?",
        "how": "사진 2장 중 '사과 어디 있지? Where is the apple?' 고르기. 틀려도 그 사진의 이름을 말해 주고 다시"
      },
      {
        "level": 3,
        "mode": "셋 중에",
        "how": "사진 3장 중 고르기. 가끔 영어로만 물음"
      },
      {
        "level": 4,
        "mode": "그림과 사진 짝",
        "how": "그린 그림 1장을 보고 같은 것의 사진을 2~3장 중 고르기"
      },
      {
        "level": 5,
        "mode": "조금만 보고",
        "how": "사진의 일부(코끼리 코)만 크게 보여 주고 무엇인지 3장 중 고르기 → 전체 사진이 펼쳐짐"
      }
    ],
    "linkToGames": {
      "_설명": "놀이에서 새 물건이 처음 나올 때 진짜 사진을 잠깐 보여 줌.",
      "photoMoment": "놀이 화면 구석에서 사진 카드가 쏙 올라와 2초(예: 피자에 토마토가 처음 나오면 진짜 토마토 사진, '토마토! Tomato!'). 같은 것은 하루에 한 번만",
      "where": [
        "pizza·bread·cake의 재료",
        "petsalon의 동물과 도구",
        "jobs의 직업과 탈것",
        "maze의 갈림길 표지"
      ]
    },
    "familyCards": "'우리 가족·내 물건' 묶음: 엄마가 사진을 찍어 넣고(P6 방식) 이름을 녹음(P10 엄마 목소리). 할머니, 우리 집 강아지, 내 신발이 카드가 됨",
    "tech": {
      "files": "photos/<묶음>/<id>.webp, 긴 변 800px, 한 장 80KB 이하",
      "manifest": "photos/cards.json: id, ko, en, file, set, credit, license, age2(true/false)",
      "load": "묶음을 열 때 그 8장만 불러오고 기기에 저장(오프라인). html 안에 사진을 넣지 않음",
      "alt": "사진이 안 불러와지면 그린 그림으로 대신"
    },
    "voice": "낱말은 수가 정해져 있으므로, 원하면 나중에 자연스러운 음성 파일로 미리 만들어 넣을 수 있게 cards.json에 audioKo/audioEn 칸을 비워 둠",
    "soundCards": {
      "_설명": "소리 놀이(이모지 12칸)를 '소리 카드'로: 실사진 3장씩, 콕 하면 그 소리와 이름. 단계가 오르면 '무슨 소리일까?' 소리를 듣고 사진 2~3장 중 고르기",
      "sets": [
        "탈것(소방차, 경찰차, 구급차, 기차, 자동차, 비행기)",
        "악기(북, 종, 나팔)",
        "동물 울음",
        "집 안 소리(물, 초인종, 시계)"
      ],
      "place": "노래 극장"
    },
    "findPicture": "탐험대의 '그림 찾기'(이모지 3장 중 상어 찾기)는 실사진 카드의 '어디 있지?' 방식을 그대로 쓰고 사진 또는 직접 그린 그림으로"
  },
  "shell": {
    "_설명": "모든 놀이 화면이 쓰는 하나의 틀. 이걸로만 화면을 만들면 배치가 제각각이 될 수 없음. ML.Shell.screen(id, opts).",
    "header": {
      "heightPx": 72,
      "left": "뒤로 가기: 항상 같은 그림(둥근 화살표 64px), 한 단계 위로(놀이 → 장소 → 홈). 집 그림은 쓰지 않음",
      "center": "과정 그림 줄(이번 판의 과정 2~5개, 지금 것만 크게). 글자 제목은 넣지 않거나 아주 작게",
      "right": "그림 버튼 하나까지(다시 듣기). 그 밖의 설정은 어른 설정으로"
    },
    "stage": {
      "heightRatio": [
        0.6,
        0.66
      ],
      "content": "캐릭터와 대상이 크게. 배경은 그 장소의 종이 공예 배경",
      "noRepeatingPattern": true
    },
    "tray": {
      "heightRatio": [
        0.18,
        0.22
      ],
      "content": "지금 도구 하나, 또는 카드 3장까지(110px 이상). 가로로 밀지 않음. 더 있으면 오른쪽 끝 화살표 그림으로 다음 3장",
      "finish": "끝내기·다음 그림 버튼은 항상 오른쪽 아래"
    },
    "banned": [
      "오른쪽 위 글자 전환 버튼(1~5·1~10, 북·박수·종, 엄마 손·아기 손 등)",
      "단계 고르기 탭(1단계·2단계·3단계 자물쇠)",
      "여섯 칸 글자 탭(얼굴·옷·색깔·머리·소품·옷장)",
      "가로로 밀리는 동그라미 줄",
      "글자 안내 줄과 글자 '다음' 버튼",
      "'도장 3개에 열려요' 같은 글자 자물쇠",
      "출발·도착 같은 글자 딱지"
    ],
    "insteadOfTabs": {
      "난이도(1~5·1~10, 단계 탭)": "단계 엔진이 알아서(progress). 어른만 어른 설정에서 바꿈",
      "종류 고르기(북·박수·종, 엄마 손·아기 손)": "시작할 때 그림 카드 3장 중 고르기, 또는 가게 앞 손님 고르기",
      "여러 갈래(얼굴·옷·머리·소품)": "캐릭터의 그 자리를 콕 하면 그 자리 카드 3장(미용실 꾸미기 방식)",
      "잠긴 것": "아직 안 열린 것은 보여 주지 않음. 열리는 순간에 새로 나타나며 알려 줌"
    },
    "font": "제목 글꼴은 한 가지(둥근 글꼴). 화면마다 다른 글꼴 금지",
    "placeScreen": "장소 화면(요리 마을 등)도 같은 틀: 머리줄 + 그 장소 배경 위 그림 타일 4개(2×2) + 다음 장 화살표"
  },
  "catalog": {
    "_설명": "적게, 깊게. 통합판에는 놀이가 30개쯤 있지만 대부분 얕음. 비슷한 것은 합치고, 남기는 것은 가게 놀이 뼈대(flow)로 깊게 다시 만듦.",
    "cook": [
      {
        "id": "pizza",
        "ko": "피자가게",
        "phase": "P5-나"
      },
      {
        "id": "restaurant",
        "ko": "식당(셰프 도전을 진짜 요리로)",
        "phase": "P17"
      },
      {
        "id": "icecream",
        "ko": "아이스크림 가게",
        "phase": "P17"
      },
      {
        "id": "bakery",
        "ko": "빵집(빵과 케이크를 하나로)",
        "phase": "P8-나"
      },
      {
        "id": "dishes",
        "ko": "설거지",
        "phase": "P8-나"
      }
    ],
    "salon": [
      {
        "id": "petsalon",
        "ko": "동물 미용실",
        "phase": "끝"
      },
      {
        "id": "nailshop",
        "ko": "네일숍",
        "phase": "끝"
      },
      {
        "id": "clothes",
        "ko": "옷 가게(공주 왕자 옷 입기를 다시)",
        "phase": "P8-가"
      },
      {
        "id": "makeup",
        "ko": "화장",
        "phase": "P8-가"
      },
      {
        "id": "drawing",
        "ko": "그림 그리기와 색칠",
        "phase": "P5-가"
      },
      {
        "id": "xmasHouse",
        "ko": "크리스마스 집",
        "phase": "P7"
      }
    ],
    "learn": [
      {
        "id": "photoCards",
        "ko": "실사진 카드(낱말, 소리 카드, 그림 찾기 포함)",
        "phase": "P13"
      },
      {
        "id": "maze",
        "ko": "길 찾기 미로",
        "phase": "P14"
      },
      {
        "id": "jobs",
        "ko": "직업 놀이",
        "phase": "P15"
      },
      {
        "id": "counting",
        "ko": "젤리 세기",
        "phase": "P8-다"
      },
      {
        "id": "shapes",
        "ko": "모양",
        "phase": "P8-다"
      },
      {
        "id": "trace",
        "ko": "선 긋기",
        "phase": "P8-다"
      },
      {
        "id": "explore",
        "ko": "탐험대(바다, 산, 우주, 공주 모험)",
        "phase": "P8-라"
      }
    ],
    "music": [
      {
        "id": "rhythmClap",
        "ko": "리듬 박수",
        "phase": "P8-라"
      },
      {
        "id": "instruments",
        "ko": "악기",
        "phase": "P8-라"
      },
      {
        "id": "songs",
        "ko": "노래 영상",
        "phase": "P8-라"
      }
    ],
    "myroom": [
      {
        "id": "gifts",
        "ko": "선물 놓기"
      },
      {
        "id": "chores",
        "ko": "집안일"
      },
      {
        "id": "routine",
        "ko": "하루 일과"
      }
    ],
    "retired": {
      "손톱 꾸미기(nails)": "네일숍으로 대체",
      "직업 옷 입기 + 짝 맞추기 + 출동 놀이": "직업 놀이 하나로(옷 입고 → 탈것 타고 → 일하기)",
      "공주 왕자 옷 입기": "옷 가게로 다시 만듦",
      "낱말(words), 소리 놀이(sounds)": "실사진 카드의 묶음과 '소리 카드'로",
      "바로 놀기, 탐험대 줄(홈)": "각 장소 안으로"
    }
  }
};
