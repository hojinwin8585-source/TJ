window.MLCFG = {
  "_설명": "말랑 놀이터의 모든 숫자·문구·단계를 여기 한 곳에 둡니다. 코드에 숫자를 직접 쓰지 말고 이 파일 값을 읽어 쓰세요. 값을 바꾸면 놀이가 바뀌어야 합니다.",
  "version": "2.6",
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
      ]
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
      ]
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
      "levels": [
        {
          "level": 1,
          "new": "접시 1개 문지르기"
        },
        {
          "level": 2,
          "new": "접시 2개"
        },
        {
          "level": 3,
          "new": "컵 추가"
        },
        {
          "level": 4,
          "new": "물 뿌리기와 정리"
        }
      ]
    },
    "chores": {
      "levels": [
        {
          "level": 1,
          "new": "장난감 3개 상자에"
        },
        {
          "level": 2,
          "new": "빨래 바구니"
        },
        {
          "level": 3,
          "new": "빗자루"
        },
        {
          "level": 4,
          "new": "화분 물 주기"
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
      ]
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
      "levels": [
        {
          "level": 1,
          "new": "소방관"
        },
        {
          "level": 2,
          "new": "경찰관·의사"
        },
        {
          "level": 3,
          "new": "탈것 짝짓기 2개 중"
        },
        {
          "level": 4,
          "new": "출동 놀이"
        }
      ]
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
    "_설명": "숫자마스터처럼 가운데 집 + 둥근 문 4개 + 내 방. 밀지 않아도 한 화면에 다 보임.",
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
    "portalGrowth": "문 안 놀이들의 단계가 오르면 문 그림이 자람(grow 0→3: 나무·꽃·집이 하나씩 늘어남). 숫자마스터의 'Lv. 합계' 글자를 그림으로 바꾼 것."
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
  }
};
