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

## 현재 상태 (2026-04-01 기준)
**브랜치:** `claude/liverry-sourcing-automation-XUi6r`
**서버 버전:** 크롬확장 v7 (`/home/user/TJ/크롬확장/`)
**로컬 버전:** 크롬확장 v10 (`D:\발구지\FINAL MONEY DIGGER\scraper_v10`)

### 완료된 작업
- [x] 이미지/슬라이드 관련 코드 전체 제거
- [x] 셀러픽 무게 자동조회 기능만 유지 (sidepanel.html, sidepanel.js)
- [x] `SP_GET_SOURCE_URL` 버튼 대응 강화 (data-url, onclick, hidden input 포함)
- [x] `spNotice` 시그니처 통일 (`type, txt` 2인수)
- [x] `checkSellerpickMode()` 초기 실행 추가
- [x] **셀러픽 API 방식으로 전환** (탭 열지 않음, 봇차단 완전 해소)
  - `sharedProdNewController` API 사용
  - content script에서 fetch()로 같은 도메인 호출 (쿠키 자동)
- [x] 커밋·푸시 완료

### 남은 작업
- [ ] 실제 셀러픽 편집 페이지에서 무게 자동조회 테스트
- [ ] `sharedProdNewController` API 응답에 무게 데이터 있는 상품 확인
- [ ] `SP_GET_SOURCE_URL`이 편집 페이지에서 타오바오 URL 정상 추출하는지 확인
- [ ] `SP_SET_WEIGHT_FIELD`로 `r_mpsmWeight` 필드 입력 확인
- [ ] 테스트 결과에 따라 API 엔드포인트/파싱 로직 보완

---

## 핵심 파일 구조

```
크롬확장/
├── manifest.json
├── background.js     ← CMD_SP_AUTO_WEIGHT 핸들러 (탭 없이 API 방식)
├── content.js        ← SP_GET_SOURCE_URL, SP_FETCH_SPECS, SP_SET_WEIGHT_FIELD
├── sidepanel.html    ← 무게 자동조회 UI
└── sidepanel.js      ← SP 모드 감지 + 버튼 이벤트
```

---

## 무게 자동조회 플로우 (v2 — API 방식)

```
[셀러픽 편집 탭]
  ↓ SP_GET_SOURCE_URL
원본 타오바오/티몰 URL 추출 → itemId 파싱
  ↓ SP_FETCH_SPECS
셀러픽 API (sharedProdNewController) 호출
  - 탭 안 열고, 같은 도메인 fetch()로 호출
  - 셀러픽이 타오바오 데이터 대신 가져옴 (봇차단 없음)
  ↓
응답 HTML 파싱
  - 1차: prod-properties 테이블에서 중국어 키워드 검색
  - 2차: 전체 HTML에서 무게/치수 패턴 스캔
  ↓
부피무게 = (L×W×H) ÷ 6000
청구무게 = max(실무게, 부피무게)
  ↓ SP_SET_WEIGHT_FIELD
input[name="r_mpsmWeight"] 에 자동 입력
```

---

## 셀러픽 API 엔드포인트

| 용도 | URL | 메서드 |
|------|-----|--------|
| 상품 상세 | `?menuType=prodStock&mode=json&act=sharedProdNewController` | POST |
| 상품 목록 | `?menuType=prodStock&mode=json&act=getListNewTaobao` | GET |
| 소싱 업로드 | `?menuType=prodStock&mode=json&act=excelPrdSourcing` | POST |

**상품 상세 API 파라미터:** `nat=taobao&prodNo={itemId}`
**응답:** `{ success, html, html2, data }`

---

## 주요 셀렉터

| 목적 | 셀렉터 |
|------|--------|
| 무게 입력 필드 | `input[name="r_mpsmWeight"]` |
| 원본 링크 | `<a>` href에 taobao/tmall/1688 포함 |
| 원본 버튼 | "원본" 텍스트 포함 요소 → data-url/onclick/hidden input |
| 셀러픽 SP모드 감지 | URL에 `sellerpick` + `shopAdmin` 포함 |

---

## 타오바오 무게 키워드 (중국어)

| 종류 | 키워드 |
|------|--------|
| 실무게 | 商品重量, 重量, 克重, 净重, 毛重, 产品重量, 包装重量 |
| 치수 | 商品尺寸, 尺寸, 规格, 包装尺寸, 产品尺寸, 长宽高 |

---

## 알려진 이슈 / 주의사항
1. **셀러픽 API 스펙 테이블**: `prod-properties` 테이블이 비어있는 상품 있음 → 2차 패턴 스캔으로 보완
2. **버전 불일치**: 서버 v7 수정 → 로컬 v10에 수동 적용 필요 (zip 다운로드)
3. **Konva iframe**: 슬라이드 편집은 iframe 격리 문제로 제외 (현재 스코프 밖)
4. **셀러픽 편집 페이지 구조**: 원본 링크가 어떤 형태(a/button/data-url)인지 실제 검증 필요

---

## MSDP 연동 정보
- MSDP 파일: `/home/user/TJ/MSDP/MSDP_v4.html`
- 타오바오 URL 파싱: `parseTaobaoUrl()` — provider/itemId/cleanUrl 추출
- 셀러픽 전송: `buildPayload()` → `doSellerpickRequest()`

---

## 미래 고려 사항 (지금 하지 않음)
- Oracle Cloud 서버 이전 + SQLite3 DB
- 쇼핑몰 자동업로드
- 상세페이지 이미지 자동 편집 (Claude API 불가 → 별도 inpainting API 필요)
