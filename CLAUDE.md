# Liverry 소싱 자동화 프로젝트 메모리

## 규칙 (매 세션 필독)
- 매 작업 전 반드시 코드 검토 후 진행
- 더 좋은 방법 있으면 먼저 제안
- 토큰 80% 도달 시 사용자에게 알림
- 비개발자 눈높이로 설명
- 검토·버그·테스트 완료 후 "완료 알림" 발송

---

## 프로젝트 개요
한국 크로스보더 셀러(타오바오/티몰 → 국내 판매)의 셀러픽 업로드 자동화
Chrome Extension (Manifest V3) 기반

---

## 현재 상태 (2026-03-31 기준)
**브랜치:** `claude/liverry-sourcing-automation-XUi6r`
**서버 버전:** 크롬확장 v7 (`/home/user/TJ/크롬확장/`)
**로컬 버전:** 크롬확장 v10 (`D:\발구지\FINAL MONEY DIGGER\scraper_v10`)

### 완료된 작업
- [x] 이미지/슬라이드 관련 코드 전체 제거
- [x] 셀러픽 무게 자동조회 기능만 유지 (sidepanel.html, sidepanel.js)
- [x] `SP_GET_SOURCE_URL` 버튼 대응 강화 (data-url, onclick, hidden input 포함)
- [x] `spNotice` 시그니처 통일 (`type, txt` 2인수)
- [x] 커밋·푸시 완료

### 남은 작업
- [ ] 로컬 v10에 변경파일 4개 적용 (사용자 직접)
- [ ] 실제 셀러픽 + 타오바오 페이지에서 무게 자동조회 테스트
- [ ] 테스트 결과에 따라 selector/파싱 로직 보완

---

## 핵심 파일 구조

```
크롬확장/
├── manifest.json
├── background.js     ← CMD_SP_AUTO_WEIGHT 핸들러
├── content.js        ← SP_GET_SOURCE_URL, SP_SCRAPE_WEIGHT, SP_SET_WEIGHT_FIELD
├── sidepanel.html    ← 무게 자동조회 UI
└── sidepanel.js      ← SP 모드 감지 + 버튼 이벤트
```

---

## 무게 자동조회 플로우

```
[셀러픽 편집 탭]
  ↓ SP_GET_SOURCE_URL
원본 타오바오/티몰 URL 추출
  ↓
백그라운드 탭으로 열기 (active:false)
  ↓ SP_SCRAPE_WEIGHT
중국어 스펙표 파싱
  - 실무게: 商品重量/重量/克重 등 → kg 변환
  - 치수: 商品尺寸/尺寸/规格 등 → L×W×H
  ↓
부피무게 = (L×W×H) ÷ 6000
청구무게 = max(실무게, 부피무게)
  ↓ SP_SET_WEIGHT_FIELD
input[name="r_mpsmWeight"] 에 자동 입력
```

---

## 주요 셀렉터 (실제 검증 필요)

| 목적 | 셀렉터 |
|------|--------|
| 무게 입력 필드 | `input[name="r_mpsmWeight"]` |
| 원본 링크 | `<a>` href에 taobao/tmall/1688 포함 |
| 원본 버튼 | "원본" 텍스트 포함 요소 → data-url/onclick/hidden input |

---

## 타오바오 무게 키워드 (중국어)

| 종류 | 키워드 |
|------|--------|
| 실무게 | 商品重量, 重量, 克重, 净重, 毛重, 产品重量 |
| 치수 | 商品尺寸, 尺寸, 规格, 包装尺寸, 产品尺寸 |

---

## 알려진 이슈 / 주의사항
1. **타오바오 SPA**: 페이지 로드 후 1.5초 대기로 동적 콘텐츠 기다림 → 느린 경우 파싱 실패 가능
2. **봇 감지**: 사용자 브라우저 세션(로그인 상태)으로 탭 열기 → 비교적 안전
3. **버전 불일치**: 서버 v7 수정 → 로컬 v10에 수동 적용 필요 (4개 파일)
4. **Konva iframe**: 슬라이드 편집은 iframe 격리 문제로 제외 (현재 스코프 밖)

---

## 미래 고려 사항 (지금 하지 않음)
- Oracle Cloud 서버 이전 + SQLite3 DB
- 쇼핑몰 자동업로드
- 상세페이지 이미지 자동 편집 (Claude API 불가 → 별도 inpainting API 필요)
