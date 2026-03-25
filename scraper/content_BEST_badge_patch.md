# content.js BEST 뱃지 패치 가이드

## 변경 위치
`content.js` 파일에서 아래 부분을 찾아서 수정하세요.

## 수정 전 (찾기)
```js
    '판매처': ['[class*="mall"]','[class*="brand"]','[class*="seller"]'],
  }
},
'smartstore.naver.com': {
```

## 수정 후 (바꾸기)
```js
    '판매처': ['[class*="mall"]','[class*="brand"]','[class*="seller"]'],
    '뱃지':   [
      'em[class*="best"]',
      'span[class*="best"]',
      '[class*="bestRank"]',
      '[class*="rankBadge"]',
      '[class*="best_badge"]',
      '[class*="bestBadge"]',
      '[class*="badge_best"]',
      '[class*="label_best"]',
      'em[class*="badge"]',
    ],
  }
},
'smartstore.naver.com': {
```

## 확인 방법
1. 네이버 쇼핑에서 BEST 표시된 상품 검색
2. 크롤러 🚀 자동 감지 실행
3. 수집된 데이터에 `뱃지` 컬럼 확인 → `BEST` 값이 들어오면 성공
