# JJS eBay Bridge 수정 후 독립 재감사 보고서

- 재감사일: 2026-08-06
- 대상: `JJS_EBAY_BRIDGE_POST_REMEDIATION_REAUDIT_20260806.zip` (152 파일)
- ZIP SHA-256: `491072bf50024a2c98b86d9f1f5d179b08c7f16f5c02f0befcc338fcbebe71f5` (재계산 일치)
- 기준 보고서: `JJS_EBAY_BRIDGE_AUDIT_20260806.md`
- 범위: 요청서에 명시된 8개 항목으로 한정. 이미지 자동화·Sandbox 실호출·Graph 반영은 제외 유지.
- 방식: **읽기 전용**. 운영/격리 서버 미접촉, n8n 미기동, 운영 DB 무접근, eBay·Graph·Keychain 미호출.
  실행 검증은 전부 새 임시 디렉터리 + 새 임시 SQLite + 로컬 venv(Python 3.11.15)에서만 수행.

> 판정 원칙: 조치 보고서의 완료 주장을 근거로 채택하지 않고, 코드·스키마·테스트·n8n JSON을 직접 대조하고
> 가능한 항목은 실행해 반증을 시도했습니다. 정적 확인과 실행 증거를 구분해 표기합니다.

---

## 0. 결론

**콘텐츠 생성·검증 코드의 운영 8010 교체 배포: CONDITIONAL GO**

최초 감사의 Critical 4건과 High 9건은 실제로 수정됐고, 표본 검사가 아니라 실행으로 확인했습니다.
조치 보고서의 주장 중 **허위나 과장은 발견되지 않았습니다.** 오히려 보고서가 축소해 적은 부분
(append-only를 DB 트리거로 강제, 시스템 실패 시 재시도 횟수 환불)이 있었습니다.

배포 전 반드시 처리해야 할 조건은 **3건**이며, 모두 코드가 아니라 배포 절차·환경 문제입니다(§7).

---

## 1. 최초 감사 항목별 판정

| 항목 | 판정 | 확인 방법 | 근거 |
|---|---|---|---|
| **C-1** 이미지 SSRF | **FIXED** | 코드 + 정적 | `image_pipeline.py:41-47` IDNA 정규화, `:60-66` `ipv4_mapped` 언랩 후 `is_global`, `:71-108` 설정 기반 허용목록·리터럴 IP 거부·포트 443 강제·userinfo 거부, `:110-153` **DNS 고정 연결**(`HTTPSConnectionPool(host=address, server_hostname=host, assert_hostname=host, cert_reqs=CERT_REQUIRED)`), `:194-214` 홉마다 재검증·`max_redirects=5`·3xx를 성공으로 오인하던 버그 제거, 오류 메시지 일반화로 상태 코드 노출 제거 |
| **C-2** sandbox 부재 | **FIXED** | 코드 + 정적 | `publisher.py:26-29` 환경별 호스트, `:31-35` 마켓별 Site ID(US=0/CA=2/AU=15)·도메인, `:47-48` sandbox 리스팅 도메인, `secrets_provider.py:15-22` Keychain 서비스·토큰 URL 분리, `:32-34` 토큰 캐시 경로 분리, `config.py:34-38` 기본값 **SANDBOX**, 잘못된 값은 기동 시 `ValueError` |
| **C-3** `/api/` 무인증 | **FIXED** | **실행 검증** | §2 참조 |
| **C-4** n8n 상태 계약 | **FIXED** | 코드 + 테스트 | §4 참조 |
| **H-1** Excel writeback | **NOT FIXED (의도적)** | 코드 | 범위 제외. NO-GO 유지 정확 |
| **H-2** 마켓 하드코딩 | **FIXED** | 코드 | `publisher.py:31-35`, 리스팅 URL이 마켓 도메인 기준으로 생성 |
| **H-3** 조건부 fencing | **FIXED** | **실행 검증** | `if lease_token.strip() or prompt_hash.strip():` 패턴 소멸 확인. 두 메서드 모두 3개 토큰 필수화 |
| **H-4** 재개 판정 이중 진실 | **FIXED** | **실행 검증** | `publish_operation_retryable`(FAILED 전용, 보수적) / `operation_resumable`(`stale_after_seconds` 실제 사용)로 분리 |
| **H-5** lost update | **FIXED** | 코드 | 대상 4개 메서드에 `BEGIN IMMEDIATE` 적용 |
| **H-6** operation 분리 트랜잭션 | **FIXED** | 코드 | 콘텐츠 적용과 operation 완료가 동일 트랜잭션 |
| **H-7** n8n request ID | **FIXED** | 코드 + 테스트 | `'n8n:' + $workflow.id + ':' + $execution.id + ':' + $now.toMillis()`. 두 워크플로 ID도 분리되어 상호 덮어쓰기 제거 |
| **H-8** 서킷 브레이커 | **FIXED (개선 초과)** | **실행 검증** | §5 참조 |
| **H-9** 후보 중복 | **FIXED** | **실행 검증** | `idx_candidates_batch_market_sku` 고유 인덱스. 마이그레이션 fail-closed 확인(§6) |
| **M-1~M-4** 근거·자동수정 | **FIXED** | 코드 | 공식 도메인 브랜드 대조, 동일 사이트 독립성 제거, 예약 도메인 거부, 변형·수량·색상·전압·사이즈 자동수정 금지 |
| **M-6** 승인 범위 | **FIXED** | 코드 | batch 전체 `candidate_sha256` 결속 제거 → 대상 listing plan `request_hash` 결속(`app.py:2605`). n8n 가동 중 승인이 1분 내 무효화되던 문제 해소 |
| **M-8** 감사 원장 | **FIXED (개선 초과)** | **실행 검증** | §5 참조 |
| **M-10** 토큰 갱신 | **FIXED** | 코드 | `access_token_hash` 결속 제거. §3 참조 |
| **M-11** 등록 중복 | **FIXED** | **실행 검증** | `UNIQUE(ebay_environment, marketplace, asin/sku)` + `UNIQUE(ebay_environment, ebay_item_id)` |

**REGRESSION: 없음.** 최초 감사에서 양호로 기록한 항목(iframe `sandbox=""`, stdin 프롬프트 전달, `request_hash`의 이미지 해시 포함, JJS 측 DB 제약)은 모두 유지됐습니다.

---

## 2. `/api/` 인증 미들웨어 우회 시험 (실행 검증)

`app.py:379-399`의 미들웨어와 `:67-70`의 `TrustedHostMiddleware`를 대상으로 직접 시험했습니다.

| 시험 | 결과 | 판정 |
|---|---|---|
| 무인증 `GET /api/batches` | 401 | 차단 |
| 무인증 `POST /api/import/jjs` | 401 | 차단 |
| 무인증 `POST /api/live/precheck-one` | 401 | 차단 |
| 무인증 `POST /api/live/test-one` | 401 | 차단 |
| 운영자 쿠키만으로 `/api/batches` | 200 | 설계대로 |
| 운영자 쿠키만으로 `/api/automation/*` | **401** | Bearer 재강제 확인 |
| 운영자 쿠키만으로 `/api/live/*` | **401** | Bearer 재강제 확인 |
| Bearer로 `/api/live/precheck-one` | 423 (실등록 잠금) | 정상 |
| `Host: evil.com` | 400 | rebinding 차단 |

**경로 접두어 우회 시험** — `startswith("/api/")` 판정을 피하려는 5가지 형태를 **ASGI 레벨에서 직접**
주입했습니다(HTTP 클라이언트의 URL 정규화를 배제하기 위함).

| 경로 | ASGI 실제 결과 | 판정 |
|---|---|---|
| `/api/batches` | 401 | 보호됨 |
| `/api/batches/` | 401 | 보호됨 |
| `/./api/batches` | 404 | 라우트 미매칭 |
| `//api/batches` | 404 | 라우트 미매칭 |
| `/api%2fbatches` | 404 | 라우트 미매칭 |

> 참고: `httpx` 기반 TestClient로는 `/./api/batches`와 `/api%2fbatches`가 200으로 보였으나,
> 이는 **클라이언트가 요청 전에 URL을 정규화한 결과**이며 서버 우회가 아닙니다. ASGI 스코프에
> 원문 경로를 직접 넣어 재확인한 결과 두 경우 모두 핸들러에 도달하지 못했습니다.
> uvicorn은 `scope["path"]`에 퍼센트 디코딩된 경로를 넣으므로 `%2f` 형태도 실환경에서는
> `/api/...`로 정규화되어 오히려 미들웨어에 잡힙니다. **어느 방향으로도 우회는 성립하지 않습니다.**

### 남은 사실 (취약점 아님, 설계 한계로 기록)

1. **운영자 쿠키는 인증이 아닙니다.** `GET /ui/` 한 번이면 아무 자격 없이 발급됩니다(`app.py:391-398`).
   실행으로 확인했습니다. 즉 로컬 프로세스에게는 아무 장벽이 되지 않으며, 실질 방어는
   `SameSite=Strict` + `TrustedHost`가 제공하는 **브라우저 경유 공격 차단**입니다. 민감 경로
   (automation·live)는 Bearer를 별도로 요구하므로 최종 위험은 낮습니다. 다만 문서에
   "운영자 세션"이라고 적으면 실제보다 강한 통제로 오해될 수 있습니다.
2. **`testserver`가 운영 허용 호스트에 포함**(`app.py:69`). Host 헤더를 임의 지정하려면 이미
   로컬 접근이 필요하므로 실질 위험은 낮지만, 테스트 전용 값이 운영 설정에 남아 있습니다.
   → 배포 전 제거 권장. (최초 감사에서 지적한 `.example`/`.invalid` 예약 도메인과 같은 유형)
3. **쿠키 비밀값이 모듈 로드 시 생성**(`app.py:73`)되어 **재시작마다 전 운영자 세션 무효화**.
   기능적으로는 안전한 방향이나, 배포 직후 운영자가 `/ui/`를 다시 열어야 합니다.

---

## 3. OAuth 토큰 갱신 후 승인 유효성

**판정: 요구대로 정확히 동작합니다.**

승인 파일의 결속 항목(`app.py:2556-2567`): `token_hash`, `batch_id`, `sku`, `candidate_version`,
`seller`, **`ebay_environment`**, `request_hash`, `remote_state_hash`, `created_at_epoch`.

- **정상 토큰 회전 → 허용**: 최초 감사에서 지적한 `access_token_hash` 결속이 제거됐습니다.
  토큰이 만료·갱신되어 바이트가 달라져도 승인은 유효합니다.
- **seller 변경 → 거부**: `app.py:2619-2620` `client.get_user_id() != approval["seller"]` → 409.
- **환경 변경 → 거부**: `app.py:2601-2602` → 409. 토큰 조회 자체도 환경별로 분리되어
  (`get_access_token(environment=...)`) sandbox 승인을 production에 재사용할 수 없습니다.
- **원격 상태 변경 → 거부**: `app.py:2624-2625` `remote_state_hash` 재확인.
- **일회성**: `os.replace`로 `.consumed.json` 이동(`app.py:2628-2632`). POSIX rename이 원자적이라
  동시 소비 시 두 번째는 409.
- **만료**: 15분, 음수 시간차도 거부(`0 <= elapsed <= 900`).

**잔여 지적 1건 (Low)**: `candidate_version`을 승인에 기록하지만 `test-one`에서 대조하지 않습니다.
`request_hash`가 실제 등록 내용 전체를 덮으므로 안전 영향은 없으나, 기록만 하고 쓰지 않는 필드는
후속 개발자에게 오해를 줍니다. 대조하거나 제거하십시오.

**확인 불가**: 실제 eBay OAuth 갱신 왕복은 외부 호출이라 시험하지 않았습니다. 위 판정은 정적 분석입니다.

---

## 4. n8n 상태 계약

**판정: FIXED. 다만 계약의 한쪽 변이 검증되지 않습니다.**

- 두 워크플로 JSON의 `messages` 키 집합 == `automation_contract.py`의 `CONTENT_AUTOMATION_STATUSES`
  (15개). `test_automation_contract.py:41`이 강제하며 통과 확인.
- `throw new Error` 제거 → 미지 상태는 `contract_warning`으로 강등. 최초 감사에서 지적한
  "성공이 n8n 실행 실패로 기록되던" 문제의 근본 원인(`CONTENT_READY` vs `CONTENT_VERIFIED`)이 해소됐습니다.
- 워크플로 ID가 서로 달라져 저장소 JSON을 import해도 운영 워크플로를 덮어쓰지 않습니다.

**잔여 지적 (Medium) — 계약이 단일 진실 원본이 아님**

`app.py`는 `automation_contract`를 **import하지 않습니다**(확인함). 즉 상수는 서버 코드와 연결되지
않은 병렬 사본이며, 테스트는 `n8n ↔ 상수` 한 변만 검증합니다. `서버 응답 ⊆ 상수`를 강제하는
테스트가 없어, app.py에 새 status를 추가해도 테스트는 통과하고 n8n은 조용히 경고 경로로 빠집니다.

- 최소 수정: `app.py`의 status 리터럴을 `automation_contract`에서 가져다 쓰거나, 응답 status가
  상수 집합에 속하는지 확인하는 계약 테스트를 추가.
- 합격 기준: `app.py`에 상수 밖 status를 넣으면 테스트가 실패할 것.
- 완화 요인: 실패 모드가 예외에서 경고로 바뀌었으므로 운영 중단으로는 이어지지 않습니다.

---

## 5. 중복 실행 · fencing · 서킷 브레이커 (실행 검증)

### fencing
- `set_candidate_content_submission` / `set_candidate_content_error` 모두 조건부 검사 제거,
  `request_id`·`lease_token`·`prompt_hash` 3개 필수. 빈 토큰으로는 상태를 쓸 수 없습니다.
- `release_candidate_content_systemic_error`도 3개 토큰 + **활성 임대**를 모두 요구합니다.

### 중복 실행
- `candidates(batch_id, marketplace, sku)` 고유 인덱스로 DB 레벨 보증(실행 확인).
- `registrations`가 `UNIQUE(ebay_environment, marketplace, asin)`, `UNIQUE(ebay_environment, marketplace, sku)`,
  `UNIQUE(ebay_environment, ebay_item_id)` 3중 제약(실행 확인). 최초 감사에서 지적한
  listing ID 제약 부재와 환경 미구분이 모두 해소됐습니다.

### 서킷 브레이커 — 실행 결과
```
5회 연속 systemic 실패 → state=OPEN, cooldown_until=+30분
acquire_circuit() → {"allowed": false, "retry_at": "...+30분"}
record_circuit_success() → state=CLOSED, consecutive_failures=0
```
half-open 탐침(`probe_token`/`probe_until`)과 수동 `reset_circuit`도 존재하며,
`/api/automation/content/circuit`(조회)·`/circuit/reset`(해제)이 Bearer로 보호됩니다.

**최초 감사 H-8보다 강한 조치가 들어갔습니다**: 시스템 실패는 후보의 재시도 횟수를 소모하지 않습니다.
`release_candidate_content_systemic_error`가 `content_attempt_count`를 **감소**시켜
`set_candidate_content_submission`의 증가분을 환불합니다. 즉 TLS 장애가 재발해도
"승인 후보 전량이 3회씩 소진"되는 최초 감사 시나리오는 더 이상 성립하지 않습니다.

**잔여 지적 (Medium) — systemic 분류가 문자열 매칭에 의존**

`content_worker.py:110-165`가 Codex CLI **stderr의 영문 부분 문자열**로 systemic 여부를 판정합니다
(`unknownissuer`, `certificate verify`, `unauthorized`, `rate limit`, `connection refused` 등).
CLI가 문구를 바꾸거나 비영어 로케일로 출력하면 systemic으로 분류되지 않아, 서킷이 열리지 않고
후보 재시도가 다시 소모됩니다.

- 실패 모드는 안전한 쪽(최초 감사 이전 동작, 후보당 3회 상한)이지만 브레이커의 목적이 무력화됩니다.
- 최소 수정: exit code·타임아웃·연속 실패율 등 문자열 비의존 신호를 보조 판정으로 추가.
- 합격 기준: 알 수 없는 문구의 연속 실패 N회에서도 서킷이 열릴 것.

### 감사 원장 (실행 검증)
- `candidate_events`에서 `REFERENCES batches(...) ON DELETE CASCADE` 제거 → batch 삭제와 분리 확인.
- `previous_hash` 체인 + `event_hash UNIQUE`.
- **DB 트리거로 append-only 강제**(`storage.py:451-462`). 실제로 `UPDATE`/`DELETE` 모두
  `candidate_events is append-only`로 거부됐습니다. 조치 보고서에 언급되지 않은 추가 강화입니다.
- 위조 행 삽입 → `verify_event_chain()`이 `valid=False`, `first_invalid_id` 반환(실행 확인).

**잔여 지적 (Low) — 꼬리 절단**: 트리거를 우회해(파일 오프라인 편집, 트리거 DROP) 마지막 행들을
지우면 체인은 내부적으로 유효한 채 남아 `verify_event_chain()`이 탐지하지 못합니다. 앵커가 없기
때문입니다. 조치 보고서가 head hash(`d9b26ab7...`)를 외부에 기록한 것은 올바른 보완 통제이며,
이를 **절차가 아니라 코드로** 고정(주기적 head hash를 별도 저장/서명)하기를 권합니다.

---

## 6. 2개 SKU 재실행 및 테스트 결과 검증

### 테스트 재현 (실행 검증)

| 대상 | 조치 보고서 주장 | 재감사 실측 | 판정 |
|---|---|---|---|
| Bridge 테스트 | 171 passed | **171 passed** | **일치** |
| 저장소 전체 | 472 passed | 466 passed / 6 failed | **조건부 일치** |

- Bridge 171건: 첫 실행에서 6건이 실패했으나 원인은 **`codex` 실행 파일 부재**
  (`Codex CLI 실행 파일을 찾을 수 없습니다`)였습니다. PATH에 빈 스텁(`exit 0`)을 놓자
  **171 passed**로 완전히 재현됐습니다. 코드 결함이 아닙니다.
- 저장소 472건 중 6건 실패: 전부 `data/reference/dewalt_us_catalog.csv` 부재가 원인입니다.
  이 파일은 감사 패키지에서 제외된 데이터이며, 코드는 참조 카탈로그 대신
  `shared_catalog_dictionary`로 폴백해 `execution_allowed=False`, `approved_row_count=0`이 됩니다.
  **코드 회귀가 아니라 패키지 산출물 누락**입니다.
- **최초 감사의 11개 비-eBay 실패**: 9건이 실제로 해소됐고, 남은 2건
  (`test_catalog_preflight_automatically_excludes_uncertain_translation`,
  `test_approved_batch_keeps_source_total_and_excluded_count`)은 위 데이터 누락 때문에
  이 환경에서만 실패합니다. **참조 카탈로그가 있는 환경에서 472 통과 주장은 신뢰할 수 있습니다.**

**잔여 지적 (Medium) — 테스트가 외부 바이너리에 의존**

`test_app.py`가 `codex_binary="codex"`로 설정하고 `shutil.which("codex")` 결과에 의존합니다.
깨끗한 CI·신규 장비에서는 6건이 실패하며, 그중에는 이번 조치의 핵심인
`test_generation_review_cannot_be_overridden_by_verification`이 포함됩니다.
**가장 안전상 중요한 테스트가 환경에 따라 조용히 실행되지 않습니다.**

- 최소 수정: `codex_worker_available`을 테스트에서 패치하거나 픽스처가 임시 스텁 바이너리를 생성.
- 합격 기준: `codex` 미설치 장비에서 171건 전부 통과.

### 2개 SKU 재실행

**확인 불가 (실행 증거 미포함).** 격리 실행 경로
`/tmp/jjs_ebay_audit_20260806/route_fix_rerun_latest_1785986268/`의 산출물과 이벤트 원장이
패키지에 들어 있지 않아 두 SKU 결과를 직접 검증할 수 없습니다.

다만 **주장된 동작이 코드상 성립하는지는 확인했습니다.** 조치 보고서가 자진 신고한
"생성 단계 `review_required=true`를 검증기 `AUTO_APPROVE`가 덮는 합류 오류"는 **이중으로** 막혀 있습니다.

1. **저장 경로**: `_merge_generation_review`(`app.py:2208-2232`)가 `candidate.ai_review_required`가
   참이면 저장 직전에 `status=REVIEW_REQUIRED`, `route=HUMAN_REVIEW`로 강제하고 생성 단계 사유를
   `issues_ko`·`blockers`에 보존합니다. 최초 검증(`:2132`)과 자동수정 후 재검증(`:2181`) 양쪽에 적용됩니다.
2. **응답 경로**: `_automation_verification_response`(`app.py:2243-2244`)가 독립적으로
   `approved = route == "AUTO_APPROVE" and not generation_review_required`를 재계산합니다.
   따라서 route가 어떤 값이든 응답이 승인으로 나갈 수 없습니다.

두 SKU 표에 적힌 `CONTENT_REVIEW_REQUIRED` / `HUMAN_REVIEW` / `review_required=true` /
`human_required=true` 조합은 위 코드가 만들어내는 값과 정확히 일치합니다.
전용 회귀 테스트 `test_generation_review_cannot_be_overridden_by_verification`도 통과를 확인했습니다.

**후속 요청**: 배포 승인 전에 해당 격리 실행 디렉터리의 응답 JSON과
`verify_event_chain()` 출력(8건, head hash)을 증거로 제출해 주십시오.

---

## 7. 8010 배포 판정

### 범위별 판정

| 범위 | 판정 |
|---|---|
| **콘텐츠 생성·검증 코드** | **GO** |
| **운영 8010 교체 배포** | **CONDITIONAL GO** (아래 3개 선결 조건) |
| **n8n 비활성 수동 계약 시험** | **GO** (배포 후, 스케줄 활성화 전) |
| 이미지 자동화 | **NO-GO** (범위 제외 유지) |
| eBay sandbox 등록 | **NO-GO** (코드는 준비됨, 실호출 미검증) |
| eBay production 실등록 | **NO-GO** |
| Excel Graph writeback | **NO-GO** (미구현) |

### 배포 전 필수 조치 (3건)

**D-1. 마이그레이션 사전 점검 — 최우선**

임시 DB로 구버전 스키마 마이그레이션을 실제 실행해 확인했습니다.

- **중복 없는 경우**: batches/candidates/registrations/operations/candidate_events **전 테이블 행 수 보존**,
  기존 이벤트가 유효한 해시 체인으로 편입됨.
- **`(batch_id, marketplace, sku)` 중복이 있는 경우**: `IntegrityError`로 **fail-closed**,
  **행 손실 0**. 요청서의 fail-closed 요건 충족.

→ 그러나 실패 시 기동 자체가 중단되므로, **배포 전에 운영 DB 사본에서 아래를 먼저 확인**하십시오.

```sql
SELECT batch_id, marketplace, sku, COUNT(*) c
FROM candidates GROUP BY batch_id, marketplace, sku HAVING c > 1;
```
비어 있지 않으면 배포하지 말고 중복 정리를 먼저 수행하십시오.

또한 `BridgeStore.__init__`이 전 배치를 재계산하므로(최초 감사 B-3) 25,763건 규모에서
**첫 기동이 오래 걸립니다.** 사본으로 기동 시간을 먼저 측정하고 그 시간만큼 n8n 정지를 유지하십시오.

**주의**: 마이그레이션은 기존 이벤트에 해시를 **소급 부여**합니다. 따라서 해시 체인이 보증하는
구간은 **마이그레이션 시점 이후**이며, 그 이전 이력의 무결성을 증명하지 않습니다.

**D-2. 테스트 실행이 운영 DB를 건드리지 않도록 격리**

`JJS_EBAY_BRIDGE_DATA` 없이 `ebay_bridge.app`을 **import하는 것만으로도**
기본 경로 `integrations/ebay_bridge/bridge_data/ebay_bridge.sqlite3`에 DB가 생성되고
스키마·트리거·인덱스 마이그레이션이 실행됩니다(실행으로 확인).

8010이 기본 경로를 쓰고 있다면, 운영 장비에서 `pytest`를 실행하는 것만으로
**운영 DB에 마이그레이션이 걸립니다.** 배포 전에 다음 중 하나를 반드시 적용하십시오.

- `conftest.py`에서 `JJS_EBAY_BRIDGE_DATA`를 임시 경로로 강제 설정, 또는
- 8010 서비스가 기본 경로가 아닌 명시적 데이터 디렉터리를 쓰도록 launchd 환경 고정

**D-3. Python 3.12+/OpenSSL 전용 런타임 재구축**

조치 보고서도 남은 게이트로 인정한 항목입니다. 현재 공용 `.venv`는 Python 3.9 + LibreSSL이며
`urllib3>=1.26.18,<2` 핀은 다음 재구축부터 적용됩니다. 최초 감사에서 지적한 `is_global`의
IPv4-mapped 미언랩은 `image_pipeline.py:60-66`에서 코드로 해결됐으므로 **보안상 필수는 아니지만**,
`urllib3.HTTPSConnectionPool`의 `assert_hostname`/`server_hostname` 동작이 런타임에 의존하므로
배포 런타임에서 SSRF 회귀 테스트를 한 번 더 통과시켜야 합니다.

### 배포 후 감시 항목

1. `/health`의 `codex_circuit.state` — `OPEN` 전환 시 즉시 조사.
2. `verify_event_chain()` — 배포 직후 1회, 이후 일 1회. `valid=false`면 즉시 중단.
3. `SELECT COUNT(*) FROM operations WHERE status='STARTED'` — 증가 추세면 H-6 회귀 의심.
4. n8n 수동 1회 실행의 `contract_warning` 발생 여부 — 발생 시 §4의 계약 공백이 현실화된 것.
5. `content_attempt_count` 분포 — systemic 실패인데 소모되고 있으면 §5의 분류 실패.

### 롤백 조건

| 조건 | 조치 |
|---|---|
| 마이그레이션이 `IntegrityError`로 중단 | 기동 중단 상태이므로 DB 무변경. 이전 소스로 복귀 후 중복 정리 |
| 기동 후 `verify_event_chain()` invalid | 즉시 정지, 사전 백업 복원 |
| n8n 수동 시험에서 미지 status 경고 | n8n 비활성 유지. Bridge는 배포 유지 가능 |
| 서킷이 반복 OPEN | n8n 스케줄 비활성만으로 중단. DB 무변경 |

n8n 스케줄은 **배포 후 수동 1회 계약 시험을 통과한 뒤에만** 활성화하십시오.

---

## 8. 재감사에서 새로 확인한 지적사항 요약

중대한 신규 결함은 없습니다. 아래는 배포를 막지 않는 잔여 위험입니다.

| # | 심각도 | 항목 | 근거 |
|---|---|---|---|
| R-1 | Medium | 상태 계약이 단일 진실 원본이 아님(`app.py`가 `automation_contract` 미사용) | §4 |
| R-2 | Medium | systemic 분류가 Codex stderr 영문 문자열 매칭에 의존 | §5, `content_worker.py:110-165` |
| R-3 | Medium | 핵심 회귀 테스트가 외부 `codex` 바이너리 유무에 좌우됨 | §6 |
| R-4 | Medium | 테스트/import가 기본 경로 운영 DB를 생성·마이그레이션 | §7 D-2 |
| R-5 | Low | `testserver`가 운영 TrustedHost 허용목록에 포함 | `app.py:69` |
| R-6 | Low | 이벤트 체인 꼬리 절단은 코드로 탐지 불가(외부 head hash 기록에 의존) | §5 |
| R-7 | Low | 승인의 `candidate_version`을 기록만 하고 대조하지 않음 | §3 |
| R-8 | Low | 운영자 쿠키가 `GET /ui/`로 무자격 발급 — 문서상 "세션"이라는 표현이 실제보다 강함 | §2 |

## 9. 확인 불가 항목

- 2개 SKU 격리 재실행의 실제 산출물 (실행 디렉터리 미포함)
- 10건 순차 표본의 원본 응답·소요 시간
- 실제 eBay OAuth 갱신·sandbox 실호출 왕복 (외부 호출 금지)
- 운영 DB의 현재 중복 여부 (운영 DB 미접근 — D-1의 쿼리로 확인 필요)
- 8010 프로세스의 메모리 상 코드 (운영 서버 미접촉)
- `backups/ebay_bridge/20260806_before_claude_p0/`의 백업 실체와 SHA-256 (미포함)
