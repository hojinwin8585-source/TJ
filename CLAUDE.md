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

## 현재 상태 (2026-04-03 기준)
**브랜치:** `claude/liverry-sourcing-automation-XUi6r`
**로컬 설치 경로:** `D:\발구지\FINAL MONEY DIGGER\크롬확장`
**GitHub:** `https://github.com/hojinwin8585-source/TJ`

### 완료된 작업
- [x] 이미지/슬라이드 관련 코드 전체 제거
- [x] 셀러픽 무게 자동조회 기능만 유지
- [x] `SP_GET_SOURCE_URL` - `input[name="targetUrl"]` 1순위 URL 추출
- [x] `checkSellerpickMode()` 초기 실행 추가
- [x] **셀러픽 감지 버그 수정**: `currentWindow:true` → `lastFocusedWindow:true`
- [x] `parseWeight` 버그 수정: kg를 g로 오판하던 버그 (`/^(g|克|그램)$/`)
- [x] 옵션별 무게 리스트 표시 (optWeights)
- [x] 마켓속성 탭 DOM 직접 파싱 + sharedProdNewView fetch fallback

### 현재 문제
- [ ] **무게 파싱 실패**: 많은 상품이 스펙을 HTML이 아닌 **이미지 안에** 넣어둠
- [ ] 마켓속성 탭 클릭 후 DOM 파싱 성공 사례 미확인
- [ ] `sharedProdNewView` fetch는 JS 동적 로딩이라 raw HTML에 데이터 없음

---

## 다음 세션 최우선 과제

### 1. 무게 파싱 근본 해결
**핵심 발견**: 셀러픽 편집 패널 → 마켓속성 탭 → AI필터/속성추천 클릭하면 무게/중량/사이즈 표시됨
→ 이 데이터를 DOM에서 직접 읽는 게 가장 확실

**구현 방향:**
```
상품정보수정 패널 열림 확인
→ 마켓속성 탭 클릭
→ AI필터 또는 속성추천 클릭 (데이터 로드 트리거)
→ 1~2초 대기
→ 무게/중량/사이즈 DOM 파싱
→ 실패시 수동 입력창 표시
```

**무게 없을 때 폴백 순서:**
1. 마켓속성 탭 DOM 파싱
2. 셀트키 API 연동 (미래)
3. **수동 입력창** (반드시 구현)

### 2. 마진 계산 대쉬보드 (MSDP 탭 추가)
| 항목 | 방식 |
|------|------|
| 원가(CNY) | 직접 입력 |
| 환율 | 공통 설정 자동 |
| 실무게/부피무게 | 자동 or 수동 |
| 배송비 | 설정값 |
| 카드수수료(%) | 설정 |
| 셀러픽 이용료 | 설정 |
| 최소마진 | 설정 |
| **판매가** | **자동 계산** |

- 셀러픽 전송과 별개로 우리 파일에도 기록
- 일별/월별 누적, 지난달 접기/펼치기
- 세금정산용 대장

---

## 셀트키 조사 결과 (2026-04-03)
- 정식명: **selltkey.com** / 크롬 확장 ID: `abhfplldpkhgjdebnddpnhnmonfcooid`
- "무게버튼" 기능 존재 확인
- 크라우드소싱 DB인지 단순 계산기인지 **불명확** (사이트 403 차단)
- 연동 방법: 셀트키 설치 후 Network 탭 분석 → API 엔드포인트 확인
- **지금 당장 연동 불가, 추후 과제**

---

## 핵심 파일 구조

```
크롬확장/
├── manifest.json
├── background.js     ← CMD_SP_AUTO_WEIGHT 핸들러
├── content.js        ← SP_GET_SOURCE_URL, SP_FETCH_SPECS, SP_SET_WEIGHT_FIELD
├── sidepanel.html    ← 무게 자동조회 UI + 옵션별 무게 테이블
└── sidepanel.js      ← SP 모드 감지(lastFocusedWindow) + 버튼 이벤트
```

---

## 주요 셀렉터

| 목적 | 셀렉터 |
|------|--------|
| 무게 입력 필드 | `input[name="r_mpsmWeight"]` |
| 원본 URL 필드 | `input[name="targetUrl"]` |
| SP모드 감지 | URL에 `sellerpick` + `shopAdmin` (lastFocusedWindow) |

---

## 타오바오 무게 키워드

| 종류 | 키워드 |
|------|--------|
| 실무게 | 净重毛重, 商品重量, 重量, 克重, 净重, 毛重, 产品重量, 무게, 중량 |
| 치수 | 商品尺寸, 尺寸, 规格, 包装尺寸, 产品尺寸, 长宽高, 외관, 가로, 세로, 높이, 치수 |

---

## 알려진 이슈
1. **이미지 기반 스펙**: 무게/치수를 이미지에만 기재한 상품 → 파싱 불가
2. **sharedProdNewView 동적 로딩**: fetch() HTML은 JS 실행 전 껍데기
3. **마켓속성 탭 셀렉터**: 정확한 셀렉터 미확인, 다음 세션에서 실제 HTML 분석 필요
4. **GitHub 파일 다운**: github.com/hojinwin8585-source/TJ → 브랜치 → 파일 → Download raw file

---

## MSDP 연동
- MSDP 파일: `/home/user/TJ/MSDP/MSDP_v4.html`
- 타오바오 URL 파싱: `parseTaobaoUrl()`
- 셀러픽 전송: `buildPayload()` → `doSellerpickRequest()`

---

## 미래 과제
- 셀트키 API 연동 (무게 DB)
- 마진 계산 대쉬보드 (MSDP 탭)
- Oracle Cloud + SQLite3 (무게 크라우드소싱 DB)
- 셀러픽 풀 자동화: 마켓속성 → 무게 → 판매가관리 → 삭제 판단
- 텔레그램 봇 시작프로그램 등록 + 명령어 핸들러 점검
