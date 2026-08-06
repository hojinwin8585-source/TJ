# JJS eBay Bridge 독립 코드 감사 보고서

- 감사일: 2026-08-06
- 대상 패키지: `JJS_EBAY_CLAUDE_FULL_AUDIT_20260806.zip`
- ZIP SHA-256: `e6471a4b2c425e55fc619e64cef4e8803ac7d548b4d203ad4654c75fffd0365f` (재계산 일치)
- 방식: 읽기 전용 정적 감사. 운영 8010/18012 미접촉, n8n 미기동, DB·OneDrive·eBay API 무변경.
- 라인 번호는 모두 패키지 `source/` 스냅샷 기준입니다.

> 판정 원칙: 과거 인계 문서의 "완료" 표현은 근거로 채택하지 않았고, 소스·테스트·실제 n8n export·런타임 집계만으로 판정했습니다. 파일 근거가 없는 항목은 **확인 불가**로 명시했습니다.

---

## 요약 (먼저 읽을 3가지)

1. **eBay sandbox는 구현되어 있지 않습니다.** `publisher.py`와 `secrets_provider.py`가 production 엔드포인트를 하드코딩합니다. 로드맵의 "sandbox 1건" 단계는 현재 코드로 실행 자체가 불가능하며, 실등록 경로를 여는 순간 바로 production입니다.
2. **1,559건 실패는 재시도 폭주가 아닙니다.** 후보당 3회 재시도 상한이 정확히 설계대로 작동한 결과입니다(519×3=1,557). lease/fencing 누수 증거는 없습니다. 다만 **서킷 브레이커가 없어** TLS가 고쳐지지 않은 채 재개하면 남은 승인 후보 전체가 같은 방식으로 소진됩니다.
3. **운영 중인 n8n 워크플로는 현재 코드와 상태 계약이 어긋나 있습니다.** n8n은 성공 상태로 `CONTENT_READY`를 기대하는데 서버는 `CONTENT_VERIFIED`를 반환합니다. 즉 **성공한 9건도 n8n 실행 이력에서는 전부 실패로 기록**됐습니다.

---

## A. Findings

### Critical

#### C-1. 이미지 원본 다운로드의 호스트 허용목록이 사실상 무효 (SSRF)

- **근거**
  - `integrations/ebay_bridge/ebay_bridge/app.py:480` — `allowed_hosts={parsed.hostname}`
  - `integrations/ebay_bridge/ebay_bridge/app.py:457` — `image_source` 라우트에 인증 없음
  - `integrations/ebay_bridge/server_integration/image_pipeline.py:44-56` — `_validate_remote_url`
  - `integrations/ebay_bridge/server_integration/image_pipeline.py:97-98` — 검증 후 재해석(TOCTOU)
- **현재 상태**: 허용 호스트 집합을 **요청자가 보낸 URL의 hostname에서 그대로 파생**합니다. 따라서 `_host_allowed()` 검사는 항상 통과하며, 남은 방어선은 `is_global` DNS 검사 하나뿐입니다.
- **재현 조건**: `POST /api/batches/{batch_id}/image-source`에 `image_url=https://<임의의-공개-HTTPS-호스트>/...`. 인증 헤더 불필요.
- **실제 영향**
  - 서버에서 도달 가능한 임의 HTTPS 엔드포인트로 요청이 나갑니다(blind SSRF).
  - `image_pipeline.py:110`이 `Image download failed with HTTP {status}`로 **원격 상태 코드를 그대로 노출**해 내부 호스트/포트 스캐닝 오라클이 됩니다.
  - `_validate_remote_url`이 `getaddrinfo`로 검사한 뒤 `requests.get(url)`이 **다시 이름을 해석**하므로, TTL 0 DNS로 검사와 접속 사이에 사설 IP로 전환하는 rebinding이 성립합니다.
  - 런타임이 Python 3.9(`runtime_status.txt`)이므로 `ipaddress.IPv6Address.is_global`이 IPv4-mapped 주소(`::ffff:127.0.0.1`)를 언랩하지 않습니다. AAAA 레코드 하나로 `is_global` 검사를 우회할 수 있습니다.
- **최소 수정안**
  1. 허용 호스트를 **설정 파일 기반 상수**로 옮기고 요청 URL에서 파생하지 않습니다.
  2. `_validate_remote_url`이 검증한 IP를 반환하고, 그 IP로 직접 연결(`Host` 헤더 고정)해 재해석을 제거합니다.
  3. `is_global` 검사 전에 `ipv4_mapped`를 언랩합니다.
  4. 실패 메시지에서 원격 HTTP 상태 코드를 제거하고 단일 일반 메시지로 통일합니다.
- **회귀 테스트**: 비허용 호스트 거부 / rebinding(1차 공인 IP, 2차 사설 IP) 거부 / `::ffff:127.0.0.1` 거부 / 오류 메시지에 상태 코드 미포함.

#### C-2. eBay sandbox 경로가 존재하지 않음 — 모든 실등록 코드가 production 직결

- **근거**
  - `integrations/ebay_bridge/ebay_bridge/publisher.py:17-18` — `INVENTORY_BASE = "https://api.ebay.com/..."`, `TRADING_URL = "https://api.ebay.com/ws/api.dll"`
  - `integrations/ebay_bridge/ebay_bridge/secrets_provider.py:16` — `TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"`
  - `integrations/ebay_bridge/ebay_bridge/secrets_provider.py:13` — `KEYCHAIN_SERVICE = "com.jjs.ebay-bridge.production"`
  - 전체 소스에서 `api.sandbox.ebay.com` 문자열 0건 (유일한 `--sandbox`는 Codex CLI 플래그, `content_worker.py:129`)
- **현재 상태**: sandbox/production 분기가 **코드에 없습니다**. `config.py`에도 환경 스위치가 없습니다.
- **실제 영향**: 인계 문서와 로드맵의 "eBay sandbox 1건" 단계는 **현재 코드로 수행 불가**합니다. 이 단계를 건너뛰고 실등록으로 가면, 등록·이미지 업로드·정책 ID 매핑이 한 번도 실제 API에 검증된 적 없는 상태로 production에 처음 나갑니다.
- **최소 수정안**: `Settings`에 `ebay_environment`(SANDBOX/PRODUCTION)를 추가하고 `INVENTORY_BASE`/`TRADING_URL`/`TOKEN_URL`/`KEYCHAIN_SERVICE`를 환경별로 분리합니다. `live_test_one` 응답과 `registrations`에 사용 환경을 기록해 사후 구분이 가능해야 합니다.
- **회귀 테스트**: 환경별 base URL 선택 테스트, sandbox 설정에서 production 호스트가 절대 호출되지 않음을 검증하는 테스트.

#### C-3. Bridge 제어 API 전체가 무인증이며 CORS/Host 방어가 없음

- **근거**
  - `integrations/ebay_bridge/ebay_bridge/app.py:274-281` — `_require_automation`은 `/api/automation/*`와 `retry-writeback`에만 적용
  - 무인증 라우트: `import_jjs:359`, `image_source:457`, `prompt_result:1762`, `content_verification:1776`, `review:2025`, `dry_run:2058`, **`live_precheck_one:2144`**, **`live_test_one:2218`**
  - `ebay_bridge/app.py`에 `CORSMiddleware`/`TrustedHostMiddleware` 없음 (JJS 메인 서버 `app/main.py:119-121`에만 CORS 존재)
- **현재 상태**: 127.0.0.1 바인딩이 유일한 경계입니다. 같은 머신의 모든 프로세스가 전체 워크플로를 구동할 수 있고, Host 검증이 없어 DNS rebinding이 성립합니다.
- **실제 영향**: `JJS_EBAY_LIVE_ENABLED=ENABLED`인 세션에서는 `precheck-one → test-one`이 모두 무인증이므로, **브라우저를 통한 rebinding만으로 실등록 체인을 완주**할 수 있습니다. 현재는 `live_enabled=false`라 잠겨 있지만, 실등록을 여는 순간 이 경로가 함께 열립니다.
- **최소 수정안**: 모든 변경 라우트에 `_require_automation`(또는 별도 운영자 토큰) 적용, `TrustedHostMiddleware`로 `127.0.0.1`/`localhost`만 허용, CORS는 명시적으로 비활성.
- **회귀 테스트**: 토큰 없는 `live_precheck_one`/`live_test_one`/`image_source` 401, `Host: evil.com` 400.

#### C-4. 운영 n8n 워크플로와 서버의 상태 계약 불일치 — 성공이 실패로 기록됨

- **근거**
  - `runtime/n8n/eBayContentJJS01_runtime_20260806.json` 3번 노드 `jsCode`의 `messages` 맵: `CONTENT_READY`, `CONTENT_REVIEW_REQUIRED`, `CONTENT_RETRY_SCHEDULED`, `RETRY_WAIT`, `WORKER_BUSY`, `HUMAN_REQUIRED`, `NO_WORK`
  - 같은 노드: `if (!messages[result.status]) { throw new Error(...) }`
  - `integrations/ebay_bridge/ebay_bridge/app.py:1911-1916` — 성공 시 반환 상태는 `CONTENT_VERIFIED`
  - `integrations/ebay_bridge/ebay_bridge/app.py:1422` — `CONTENT_VERIFICATION_RETRY` 역시 맵에 없음
  - `CONTENT_READY`는 `storage.py:1102,1239`의 **후보 행 status**일 뿐, HTTP 응답 status로 반환되는 곳이 없음
- **실제 영향**: 콘텐츠 생성·검증이 **정상 성공한 9건 전부** n8n 실행에서는 예외로 끝났습니다. 즉 n8n 실행 이력은 Bridge의 실제 성공/실패와 다른 값을 보여주며, 이를 근거로 운영 판단을 하면 안 됩니다. `STATE_CONFLICT`는 HTTP 409로 나가 HTTP 노드에서 먼저 실패합니다.
- **최소 수정안**: n8n Code 노드의 상태 맵을 서버가 실제 반환하는 집합(`CONTENT_VERIFIED`, `CONTENT_REVIEW_REQUIRED`, `CONTENT_VERIFICATION_RETRY`, `CONTENT_RETRY_SCHEDULED`, `RETRY_WAIT`, `WORKER_BUSY`, `NO_WORK`, `HUMAN_REQUIRED`, `CONTENT_PACKAGE_READY`)으로 교체하고, 미지의 상태는 예외 대신 경고 기록으로 처리합니다.
- **회귀 테스트**: 서버가 반환할 수 있는 모든 status 리터럴을 열거하고 n8n 맵과 대조하는 계약 테스트(저장소에 status 상수를 단일 소스로 분리).

### High

#### H-1. Graph Excel writeback 미구현 — `PENDING_EXCEL` 영구 고착

- **근거**: `app/routes_ebay.py:648-654`, `:698-705` — `/api/ebay-result`가 모든 경로에서 `"excel_saved": False, "verified": False` 반환
- **영향**: `app.py:2280-2290`이 `excel_saved and verified`일 때만 `SUCCESS`로 기록하므로 **`writeback_status`는 구조적으로 절대 `SUCCESS`가 될 수 없습니다.** `retry_registration_writeback`(app.py:2083)을 몇 번 호출해도 `PENDING_EXCEL`로 되돌아옵니다.
- **최소 수정안**: 단기적으로 `PENDING_EXCEL`을 "정상 종료 상태"로 명시하고 재시도 버튼을 비활성화, 장기적으로 Graph writeback 구현 전까지 이 단계를 로드맵에서 NO-GO로 고정.

#### H-2. 마켓별 사이트 ID·리스팅 URL이 US로 하드코딩

- **근거**: `publisher.py:57`, `publisher.py:109` — `"X-EBAY-API-SITEID": "0"` / `publisher.py:223` — `f"https://www.ebay.com/itm/{listing_id}"`
- **영향**: `EBAY_AU` 후보도 GetUser와 이미지 업로드가 US 사이트로 나가고, 원장·JJS 회신·Excel에 **US URL이 기록**됩니다. `app/routes_ebay.py:44-53`은 `ebay.com.au`를 허용하므로 잘못된 URL이 검증을 통과해 그대로 저장됩니다.
- **최소 수정안**: marketplace→SiteID/도메인 매핑 테이블을 추가하고 `listing_url`을 마켓 기준으로 생성.

#### H-3. lease/fencing 검사가 조건부라 빈 토큰으로 우회 가능

- **근거**: `storage.py:1480`, `storage.py:1551` — `if lease_token.strip() or prompt_hash.strip():`
- **영향**: `lease_token`과 `prompt_hash`를 **둘 다 비워 보내면 fencing 검사 전체가 건너뛰어집니다.** `set_candidate_content_submission`/`set_candidate_content_error`가 임대 소유와 무관하게 상태를 덮어씁니다. 현재 Codex 경로는 항상 토큰을 채워 호출하므로(app.py:1494-1499) 실제 악용은 관측되지 않았지만, 방어선이 호출자 선의에 의존합니다.
- **최소 수정안**: 두 값을 필수 인자로 승격하고, 비어 있으면 `StateConflictError`.
- **추가**: `set_candidate_content_error`는 `set_candidate_content_submission`(1486)과 달리 `_lease_is_active` 검사가 없습니다(1557). 만료 임대로도 ERROR 기록이 가능합니다.

#### H-4. `operation_resumable`이 자신의 계약을 무시 — 실등록 재개 판정이 이중 진실

- **근거**: `storage.py:1785-1790` — `stale_after_seconds` 인자를 받지만 사용하지 않고 `status == 'FAILED'`만 반환. `storage.py:1772-1783`의 `_operation_resumable_row`는 STARTED+1시간 경과도 재개 가능으로 판정.
- **영향**: 같은 질문에 두 개의 답이 존재합니다. 이 값이 `live_test_one:2247`의 `allow_existing`과 `live_precheck_one:2183`의 충돌 판정에 쓰이므로, **원격에 SKU가 이미 존재할 때 기존 리스팅을 덮어쓸지 여부**가 이 불일치에 걸려 있습니다.
- **최소 수정안**: 두 판정을 `_operation_resumable_row` 하나로 통일하고, 실등록 경로는 명시적으로 보수적인(FAILED만) 규칙을 쓰도록 별도 이름으로 분리.

#### H-5. payload JSON read-modify-write 경합 — lost update

- **근거**: `BEGIN IMMEDIATE` 없이 SELECT 후 UPDATE 하는 메서드 — `queue_images:705`, `set_candidate_background_submission:807`, `set_candidate_content_submission:1470`, `set_candidate_content_error:1541`
- **영향**: Python `sqlite3` 기본 격리에서 SELECT는 트랜잭션 밖에서 실행되므로, 두 요청이 같은 `payload_json`을 읽고 각자 쓰면 뒤쪽이 앞쪽을 통째로 덮습니다. `version` 증가분과 다른 필드 변경이 함께 사라집니다.
- **최소 수정안**: 위 4개 메서드에 `BEGIN IMMEDIATE` 추가(나머지 변경 메서드는 이미 적용됨: 641, 754, 851, 974, 1158, 1277, 1377, 1679).

#### H-6. 콘텐츠 적용과 operation 완료가 별도 트랜잭션

- **근거**: `app.py:1516-1529` — Codex 경로의 `_apply_prompt_result` 호출이 `operation_key`/`operation_owner_token`/`operation_result`를 전달하지 않음. 원자적 완료 기능은 `storage.py:1128-1135`에 이미 존재.
- **영향**: `replace_candidate_contents` 커밋 직후 프로세스가 죽으면 콘텐츠는 반영됐는데 operation은 `STARTED`로 남습니다. 해당 `request_id`는 이후 영원히 `WORKER_BUSY`를 반환합니다(app.py:1341-1347). DB와 작업 원장이 어긋납니다.
- **최소 수정안**: Codex 경로도 원자적 완료 인자를 전달.

#### H-7. n8n `request_id = $execution.id` — n8n 재구축 시 과거 결과 replay

- **근거**: `runtime/n8n/eBayContentJJS01_runtime_20260806.json` 2번 노드 `request_id: "={{ $execution.id }}"` / `app.py:1334-1343`
- **영향**: n8n 실행 ID는 인스턴스 내 증가 정수입니다. 컨테이너 볼륨을 새로 만들면 1부터 다시 시작하고, `content-worker:1` 같은 키가 이미 SUCCESS/FAILED로 존재하면 **서버가 아무 작업도 하지 않고 과거 결과 JSON을 그대로 반환**합니다. 운영자는 정상 처리로 오인합니다.
- **최소 수정안**: `request_id`를 `{{$execution.id}}-{{$workflow.id}}-{{Date.now()}}` 등 전역 고유 값으로 교체하거나 UUID 생성 노드를 추가.

#### H-8. TLS 실패에 대한 서킷 브레이커 부재

- **근거**: `content_worker.py:159-166` (CodexWorkerError) → `app.py:1554-1566` → `storage.py:1571-1576` (후보당 `retry_limit=3`)
- **현재 상태**: 재시도 상한은 **후보 단위**로만 존재하고 전역 연속 실패 감지가 없습니다.
- **영향**: TLS `UnknownIssuer`가 남은 상태로 재개하면 승인 후보 전체가 각각 3회씩 소진되며, 매 회 최대 900초 Codex 호출·operation 행·이벤트 행이 쌓입니다.
- **최소 수정안**: 최근 N회 연속 실패 시 `codex_worker_enabled`를 런타임에서 잠그고 관리자 알림을 남기는 브레이커 추가. 즉시 조치로는 `SSL_CERT_FILE`/`SSL_CERT_DIR`을 설정(둘 다 `content_worker.py:30-31`의 `SAFE_ENV_NAMES`에 이미 허용됨).

#### H-9. Bridge `candidates` 테이블에 (batch_id, sku) 고유 제약 없음

- **근거**: `storage.py:136-145` — 제약 없음. 반면 JJS 측은 `app/db.py:497`의 `UNIQUE(batch_id, marketplace, sku)`와 `:503`의 batch+asin 고유 인덱스를 가짐.
- **영향**: 상태 변경 메서드가 전부 `WHERE batch_id = ? AND sku = ?` + `fetchone()`이므로, 중복 행이 생기면 **일부는 갱신되고 일부는 낡은 상태로 남습니다.** 현재 `import_batch:259-265`가 입력 단계에서 막고 있지만 DB 레벨 보증이 없습니다.
- **최소 수정안**: `CREATE UNIQUE INDEX IF NOT EXISTS ... ON candidates(batch_id, marketplace, sku)` 추가(마이그레이션 전 중복 점검 필요).

### Medium

| ID | 항목 | 근거 | 영향 |
|---|---|---|---|
| M-1 | `OFFICIAL` 출처가 단일 URL로 통과 | `prompts.py:751-764` | 모델이 아무 공개 URL에 `source_type=OFFICIAL`을 붙이면 공식 근거로 승격. 브랜드 도메인 대조 없음 |
| M-2 | 동일 피드 복제본이 독립 근거 2개로 계산 | `prompts.py:745-756` | `WEB_MATCH`는 **호스트명 개수**만 셈. 같은 유통사 피드를 미러링한 두 사이트가 교차검증으로 인정 |
| M-3 | `.example/.invalid/.test` 호스트가 공개 URL로 통과 | `prompts.py:19`, `:258` | 테스트 편의가 운영 경로에 남아, 존재하지 않는 도메인이 근거 URL로 승인 |
| M-4 | 팩 수량·색상·전압·사이즈가 자동수정 대상 | `prompts.py:76-88` vs `:30-52` | `HUMAN_ONLY_REPAIR_TERMS`에 `quantity`/`pack count`/`piece count`/`color`/`voltage`/`size` 없음 → CRITICAL인데 자동 CORRECT 가능 |
| M-5 | 생성과 검증이 동일 모델·동일 계정 | `content_worker.py:186-201` (`settings.codex_model` 공유) | 같은 환각을 스스로 승인할 상관 오류. 독립성 없음 |
| M-6 | 승인이 batch 전체 해시에 결속 | `app.py:2185`, `:2237` (`batch["candidate_sha256"]`) | `_refresh_batch_locked`가 거의 모든 쓰기에서 해시를 재계산하므로, n8n 가동 중에는 15분 승인이 1분 내 무효화되어 실등록 완주가 사실상 불가 |
| M-7 | 이미지 권리 승인이 단순 boolean | `app.py:461`, `storage.py:786-796` | 승인자·시각·license 근거 없음. `IMAGE_SOURCE_SAVED` 이벤트에도 `source_url`/`rights`/`status`만 기록 |
| M-8 | 감사 원장이 batch CASCADE로 삭제됨 | `storage.py:179` (`REFERENCES batches(id) ON DELETE CASCADE`) | batch 삭제 시 `candidate_events` 전체 소실. 해시 체인·불변성 없음 |
| M-9 | `blocked_count`와 `status='BLOCKED'`의 정의 불일치 | `storage.py:1653-1657` vs `:1610` | 전자는 `DEFERRED_WORKFLOW_ISSUES` 제외, 후자는 이슈 유무. `CONTENT_ERROR` 등은 `_refresh_batch_locked`의 재조정 대상(`{"BLOCKED","IMPORTED"}`)이 아니라 영구히 어긋남 |
| M-10 | 토큰 갱신이 승인을 무효화 | `app.py:2243-2245` | `access_token_hash` 결속 때문에, 15분 창 안에서 캐시 토큰이 만료·갱신되면 정상 승인이 403 |
| M-11 | Bridge `registrations`에 `listing_id` 고유 제약 없음 | `storage.py:146-162` vs `app/db.py:521` | JJS는 `UNIQUE(listing_id)`를 강제하는데 Bridge는 없음. 두 원장이 서로 다른 중복 정책 |
| M-12 | 리다이렉트 6회 소진 시 3xx를 성공으로 취급 | `image_pipeline.py:96-112` | `requests`의 `.ok`는 302에서 True. 본문을 이미지로 읽으려다 매직바이트에서 실패해 안전하게 끝나지만 오류 메시지가 오도적 |
| M-13 | schema migration 버전·롤백 절차 없음 | `storage.py:201-226` | `PRAGMA table_info` 기반 ad-hoc `ALTER`만 존재. 버전 테이블·다운그레이드 경로 없음 |

### Low

- **L-1** `content_worker.py:78-80` — 출력 파일이 비면 `stdout`을 결과로 파싱. 모델의 대화 출력이 결과로 오인될 여지.
- **L-2** `content_worker.py:145-147` — `model_reasoning_effort="{effort}"`에 환경변수 값을 검증 없이 보간. 운영자 통제 값이라 위험은 낮으나 TOML 주입 여지.
- **L-3** `quality.py:344-348` — `_compact("".join(visible_parts))`가 구분자 없이 이어붙여 경계를 넘는 오탐 가능(`UNVERIFIED_DESCRIPTION_CLAIM`, `DESCRIPTION_AMAZON_REFERENCE`).
- **L-4** `quality.py:16-18` — `NON_ENGLISH_TITLE_RE`에 그리스·태국·데바나가리 문자 미포함.
- **L-5** `quality.py:66-161` — `handle_comment`/`unknown_decl` 미구현. HTML 주석·CDATA가 검사 없이 통과(HTML에서는 무해하나 검증 사각).
- **L-6** `image_pipeline.py:98-127` — `response.close()`가 `finally`에 없어 예외 시 연결 누수.

### 확인된 양호 사항 (되돌리지 말 것)

- `static/index.html:242` — HTML 미리보기가 `sandbox=""` iframe. 스크립트·동일 출처 모두 차단되어 **운영자 콘솔 저장형 XSS 없음**. 코드 전반에 `innerHTML` 사용 0건.
- `content_worker.py:154-158` — 프롬프트를 stdin으로 전달(`command.append("-")`)해 명령 주입 없음. `--ephemeral`, `--sandbox read-only`, 다수 도구 비활성화.
- `storage.py:935-1135` — `replace_candidate_contents`가 `BEGIN IMMEDIATE` + expected_version CAS + (request_id, lease_token, prompt_hash) 3중 fencing + 전부 아니면 전무 적용. 자동수정 1회 상한도 DB 레벨에서 재확인(`:1017-1022`).
- `app/db.py:516-521` — JJS 원장의 `request_hash UNIQUE`, `UNIQUE(marketplace,sku)`, `UNIQUE(marketplace,asin)`, `UNIQUE(listing_id)`.
- `image_pipeline.py:59-71` — 매직바이트 판정 + 선언 MIME 교차검증. `quality.py:200-220` — DecompressionBomb 경고를 오류로 승격, 픽셀 상한 4천만.
- `planner.py:77-83` — `request_hash`가 가격·수량·정책·제목·HTML·`image_sha256`을 모두 포함. 따라서 dry-run 이후 이들이 바뀌면 승인이 반드시 무효화됩니다(Q15 충족).
- `app.py:173-183` — 승인·리포트 JSON이 `mkstemp`+`fsync`+`os.replace` 원자적 기록, 승인 파일 `chmod 0o600`.

---

## B. Runtime drift

### B-1. 디스크 소스 ↔ 8010 프로세스

- 8010은 2026-07-25 08:09 KST 기동(`evidence/runtime_status.txt`), 작업 트리에는 이후 변경이 있습니다(`evidence/git_status.txt`에 `ebay_bridge/app.py`, `storage.py`, `quality.py`, `prompts.py`, `config.py`, `schemas.py` 모두 `M`).
- 특히 `content_worker.py`, `sku_semantics.py`, `contracts/*.schema.json`은 **추적되지 않은 신규 파일(`??`)**입니다. 8010이 이들을 로드한 상태인지 디스크만으로는 판정할 수 없습니다.
- **판정: 확인 불가.** 다만 8010 health가 `codex_worker_available: true`를 반환하므로 `content_worker.py`가 로드된 빌드인 것은 확실합니다.
- **안전한 증명 방법(재시작 없이)**: 읽기 전용 엔드포인트의 응답 지문을 비교합니다. `GET /` 는 `version`만 반환하므로 부족하고, 대신 `POST /api/automation/content/codex/run-one`에 `dry_run: true`로 호출해 반환되는 `prompt` 본문의 SHA-256과, 디스크 소스로 별도 임시 인스턴스를 띄워 같은 후보로 만든 프롬프트 해시를 비교하십시오. 프롬프트는 `prompts.py`+`sku_semantics.py`+`schemas.py`를 모두 경유하므로 사실상 이 세 모듈의 지문 역할을 합니다. `dry_run`은 `app.py:1367-1376`/`:1288-1294`에서 DB를 변경하지 않습니다.

### B-2. 저장소 n8n JSON ↔ 실제 설치본

| 항목 | 실제 런타임 | `JJS_EBAY_CONTENT_ONE_ITEM.json` | `..._PRODUCTION.json` |
|---|---|---|---|
| active | **True** | False | False |
| 호출 URL | `:8010` | `:18010` | `:8010` |
| updatedAt | 2026-07-22T09:19:11Z | 없음 | 없음 |

- 세 파일 모두 `id=eBayContentJJS01`로 동일해, **어느 것을 import해도 실제 워크플로를 덮어씁니다.** 배포 원본이 무엇인지 파일만으로 판별 불가합니다.
- 추가로 실제 런타임 노드는 C-4의 상태 계약 불일치를 가지고 있으며, 저장소의 두 JSON도 같은 `messages` 맵을 씁니다(즉 이 결함은 저장소본에도 존재).

### B-3. 지금 재시작하면 생길 수 있는 위험

1. **디스크 코드가 곧바로 활성화됩니다.** 위 `M` 파일들의 변경이 검증 없이 운영에 반영됩니다. 특히 `storage.py`/`quality.py` 변경은 상태 판정과 차단 규칙을 바꿀 수 있습니다.
2. **`BridgeStore.__init__`가 기동 시 전체 batch를 재계산합니다**(`storage.py:227-230` → `_refresh_batch_locked`). 25,763개 후보의 `payload_json` 파싱 + `candidate_digest` 계산 + 모든 `image_sha256` 디스크 읽기가 발생합니다(`quality.py:248-255`). 기동 지연과 I/O 급증이 예상되며, 이 과정에서 `candidate_sha256`이 갱신되어 **기존 승인·dry-run 보고서가 전부 무효화**됩니다.
3. 만료 lease 회수와 n8n 재호출 순서 문제(D절 참조).

### B-4. 안전한 배포·롤백 순서

```
0) n8n 정지 유지 (현재 상태). live_enabled=false 유지.
1) 스냅샷: DB(.backup), bridge_data/{approvals,runs,image_sources}, 소스 tar, n8n 워크플로 export
2) 격리 인스턴스(18012)를 복사본 DB + 현재 디스크 소스로 기동해 재현 (C절 참조)
3) 격리에서 합격 기준 충족 확인
4) 8010 정지 → 소스 배포 → 기동 → health + 읽기 전용 집계 대조
5) n8n 상태 맵 수정본 import (C-4) → 수동 1회 실행으로 확인 → 그 다음에만 스케줄 활성화
롤백: 4)에서 실패 시 이전 소스 tar 복원 + DB 스냅샷 복원. 5)에서 실패 시 n8n 비활성화만으로 즉시 중단 가능.
```

---

## C. Unexecuted paths

### C-1. 구현됐지만 실제 검증되지 않은 항목

| 항목 | 근거 | 검증 방법 | 합격 기준 |
|---|---|---|---|
| 유효 복사본 DB에서 최신 코드 18012 전체 재현 | `runtime_status.txt`에 18012 `database=false` | 아래 C-4 절차 | health `database=true`, 배치 목록·후보 집계가 운영 읽기 전용 집계와 일치 |
| Codex 실제 10건 생성·검증·1회 자동수정 | `CONTENT_RESULT_APPLIED` 9건, `CONTENT_AUTO_REVISED` **0건** | TLS 해결 후 격리에서 10건 순차 실행 | 10/10 생성 성공, 검증 완료, 자동수정 발생 건은 `content_auto_revise_count=1`에서 정확히 멈춤 |
| 자동수정 1회 경로 | 이벤트 집계에 `CONTENT_AUTO_REVISED` 없음 → **한 번도 실행된 적 없음** | `AUTO_REVISE` 판정을 강제하는 고정 입력으로 재현 | 1회 수정 후 재검증, 2회차는 `_mark_auto_revise_exhausted`로 사람검수 전환 |
| 만료 lease 회수 일관성 | 운영 데이터로 미검증 | D절 시나리오 테이블 전체를 격리에서 실행 | 고착 0건, 중복 부작용 0건 |
| 관리자 승인 ↔ 계정/세션 결속 | `APPROVED_FOR_ONE_TEST` 발급 이력 확인 불가 | 격리에서 승인 발급 후 seller/token/remote_state를 각각 바꿔 4가지 실패 케이스 확인 | 4/4 모두 403 또는 409 |
| 부분 등록 실패 후 복구 | 미실행 | 격리에서 `ensure_published` 각 단계 실패 주입 | 각 단계 실패 후 재실행이 중복 리스팅을 만들지 않음 |
| 대량 이미지 매칭 정확도 | `IMAGE_MATCH_REFRESH` 1,098건이나 정확도 판정 근거 없음 | 표본 100건 육안 대조 | 오매칭 0건 |

### C-2. 미구현 항목 (코드에 없음)

1. **eBay sandbox 경로** — C-2 참조. 로드맵 단계 자체가 실행 불가.
2. **Graph Excel writeback** — H-1 참조. `/api/ebay-result`가 원장 저장까지만 수행.
3. **전역 서킷 브레이커** — H-8 참조.
4. **schema migration 버전 관리·롤백** — M-13 참조.
5. **전체 마켓 변형 중복 정책** — `registrations`의 `UNIQUE(marketplace, asin)`(`storage.py:160`)은 **하나의 ASIN에 두 SKU 변형이 있으면 두 번째 등록을 차단**합니다. 변형(팩 수량·색상 등)을 별도 리스팅으로 올리는 정책이라면 이 제약과 충돌합니다. 현재 코드에는 변형 정책이 없습니다.
6. **eBay 측 조회 기반 복구 절차** — `client.inventory_item`/`offers` 조회 함수는 있으나(`publisher.py:72-93`), 원장 유실 후 원격 상태로부터 원장을 복구하는 명령·라우트가 없습니다.

### C-3. 외부 환경 때문에 차단된 항목

- **Codex CLI TLS `UnknownIssuer`** — 콘텐츠 생성·검증 전체가 차단됨. `SAFE_ENV_NAMES`에 `SSL_CERT_FILE`/`SSL_CERT_DIR`이 이미 허용되어 있으므로(`content_worker.py:30-31`) 서비스 계정 환경에 인증서 번들 경로를 주입하는 것으로 해결 가능성이 높습니다.
- **macOS 시스템 Python 3.9 + LibreSSL 2.8.3 / urllib3 v2** — 경고 자체는 무해하지만, C-1의 `is_global` IPv4-mapped 문제는 **Python 3.9라서 발생**합니다. 별도 런타임 고정이 보안상 실익이 있습니다.
- **18012 임시 DB 유실** — 재현 환경 부재.

### C-4. 격리 18012 재구성 절차 (제안)

```bash
# 1. 운영을 건드리지 않는 일관 스냅샷 (WAL 포함, 온라인 백업 API)
sqlite3 <운영DB> ".backup '/tmp/ebay_audit/ebay_bridge.sqlite3'"

# 2. 별도 데이터 디렉터리 구성
mkdir -p /tmp/ebay_audit/data && mv /tmp/ebay_audit/ebay_bridge.sqlite3 /tmp/ebay_audit/data/
cp -R <운영 bridge_data>/image_sources /tmp/ebay_audit/data/   # 이미지 해시 재현에 필요

# 3. 현재 디스크 소스로 기동 (실등록·자동화 모두 잠금)
JJS_EBAY_BRIDGE_DATA=/tmp/ebay_audit/data \
JJS_EBAY_LIVE_ENABLED= \
JJS_EBAY_CODEX_WORKER= \
JJS_EBAY_AUTOMATION_TOKEN= \
JJS_SERVER_URL= \
python -m uvicorn ebay_bridge.app:app --host 127.0.0.1 --port 18012
```

- `JJS_EBAY_LIVE_ENABLED`를 비우면 `config.py:37`의 `== "ENABLED"` 비교가 거짓이 되어 실등록이 잠깁니다.
- `JJS_EBAY_AUTOMATION_TOKEN`을 비우면 `_require_automation`이 503을 반환해(`app.py:276`) n8n 경로가 차단됩니다.
- `JJS_SERVER_URL`을 비우면 JJS writeback이 `SKIPPED`가 됩니다(`app.py:2270`).
- **주의**: 기동 시 `_refresh_batch_locked`가 전체 배치를 재계산하므로(B-3) 첫 기동이 오래 걸립니다. 이는 정상입니다.
- **합격 기준**: health `database=true`, `GET /api/batches`의 배치 7건, 후보 상태 집계가 `evidence/production_db_aggregates_no_rows.txt`와 일치.

---

## D. State-machine audit

### D-1. 후보 콘텐츠 상태 전이표

`payload.content_status` (권위 필드) / `candidates.status` (파생 필드)

| 전이 | 트리거 | 코드 | 가드 |
|---|---|---|---|
| `PENDING` → `PREPARED` | 콘텐츠 패키지 청구 | `storage.py:1331-1347` | expected_version CAS, 활성 임대 없음, title+html 미존재 |
| `PREPARED` → `PREPARED` (멱등) | 같은 request_id+prompt_hash 재호출 | `storage.py:1329-1330` | 임대 활성 |
| `PREPARED` → `SUBMITTED` | worker 제출 | `storage.py:1490-1508` | 3중 fencing (**H-3 조건부**) |
| `SUBMITTED`/`PREPARED` → `READY` | 결과 적용 | `storage.py:1044-1060` | CAS + 3중 fencing + 임대 활성 |
| `SUBMITTED`/`PREPARED` → `ERROR` | worker 실패 | `storage.py:1563-1585` | fencing (**임대 만료 미검사**) |
| `ERROR` → `PREPARED` | 재시도 시각 도달 후 재청구 | `app.py:859-865` → `storage.py:1331` | `content_next_retry_at` 경과, 시도 < 3 |
| `ERROR` → (고착) | 시도 3회 소진 | `storage.py:1575-1576` | `content_next_retry_at=""` → `_content_pending` 거짓 |
| `READY` → 검증 완료 | Codex 검증 | `storage.py:1136` | expected_version CAS |
| 검증 `AUTO_REVISE` → 1회 수정 | `app.py:1849-1875` | `content_auto_revise_count < 1` (DB 재확인 `storage.py:1017-1022`) |
| 검증 `AUTO_APPROVE` → 이미지 매칭 | `app.py:1417-1421` | — |

### D-2. 도달 불가·고착·우회 경로

**고착 상태 (설계상 의도된 것 포함)**

1. **`ERROR` + 재시도 소진 = 519건의 현재 상태.** `_content_pending`(`app.py:859-865`)이 거짓이 되어 자동 경로에서 영구 제외됩니다. **사람이 개입하지 않으면 절대 벗어나지 못합니다.** 이것이 "복구 명령이 필요한가"(Q39)의 답입니다 — 필요합니다.
2. **operation `STARTED` 영구 잔류.** H-6 시나리오 또는 실등록 중 프로세스 사망 시. `begin_operation`(`storage.py:1690-1694`)은 `FAILED`만 재개 허용하므로 해당 idempotency_key는 영구 차단됩니다. **실등록에서는 이것이 안전 장치입니다**(중복 등록 방지) — Q10의 답: 중복 등록은 발생하지 않고, 대신 수동 개입이 필요한 고착이 됩니다.
3. **`writeback_status = PENDING_EXCEL` 영구 고착.** H-1.

**우회 경로**

4. **H-3의 빈 토큰 fencing 우회** — 유일하게 발견된 상태 머신 우회입니다.
5. `set_candidate_content_error`가 임대 만료를 검사하지 않아(`storage.py:1557`), 임대가 만료됐지만 아직 재청구되지 않은 후보에 대해 오래된 worker가 ERROR를 기록할 수 있습니다. 재청구가 일어났다면 `content_lease_token`이 새로 발급되어(`storage.py:1335`) 토큰 불일치로 막힙니다.

**중복 부작용**

6. **콘텐츠 적용은 중복되지 않습니다.** `claim_candidate_content_package`(`storage.py:1319-1320`)가 `title`과 `description_html`이 모두 있으면 `None`을 반환해 재청구를 차단하고, `replace_candidate_contents`가 CAS+fencing으로 재확인합니다.
7. **실등록도 중복되지 않습니다.** 방어선이 겹칩니다 — `begin_operation` 멱등성, `ensure_published`의 원격 상태 확인(`publisher.py:174-177`), `registrations`의 `UNIQUE(marketplace, asin)`/`UNIQUE(marketplace, sku)`, JJS 측 4개 UNIQUE 제약.

**도달 불가 상태**

8. `writeback_status = "SUCCESS"` — H-1로 인해 구조적으로 도달 불가.
9. n8n의 `CONTENT_READY` 분기(`stage: 4`) — C-4로 인해 도달 불가.

### D-3. 실패·재시도·lease 만료·재시작 시나리오

| 시나리오 | 현재 동작 | 판정 |
|---|---|---|
| 같은 SKU에 동시 2요청 | 두 번째는 `claim` 단계에서 `None` → `StateConflictError` (`storage.py:1327-1328`, `:1453`) | 안전 |
| 임대 만료 직전 완료 | `replace_candidate_contents:1021-1026`이 `_lease_is_active` 재확인 → 만료면 거부 | 안전 (단 작업 손실) |
| 오래된 worker 결과 도착 | 3중 fencing 불일치 → 거부 (`storage.py:1029-1034`) | 안전 |
| 프로세스 재시작 (콘텐츠 적용 후, operation 완료 전) | 콘텐츠 반영됨, operation `STARTED` 잔류 | **H-6, 원장 불일치** |
| 프로세스 재시작 (eBay 등록 후, 원장 기록 전) | operation `STARTED` 잔류 → 이후 모든 재시도 409 | 안전하지만 고착. **eBay 조회 기반 복구 절차 없음(C-2/6)** |
| 서버 재시작 직후 n8n 재호출 | `BridgeStore.__init__`의 배치 재계산과 첫 n8n 호출이 경합 가능 | **경합 존재** — 재계산은 `BEGIN IMMEDIATE` 없이 UPDATE만 수행(`storage.py:1666-1667`)하고, n8n 호출은 `BEGIN IMMEDIATE`를 잡음. SQLite 락으로 직렬화되므로 손상은 없으나 첫 호출이 `busy_timeout=5000`을 넘겨 500으로 실패할 수 있음 |
| n8n 다중 재시작 | `request_id=$execution.id` 재사용 시 **과거 결과 replay** | **H-7** |
| 중복 worker 프로세스 | `_content_worker_lock`(`app.py:211-224`)은 `fcntl` 파일 락 — 같은 `data_dir`을 공유하는 프로세스 간에는 유효. 다른 `data_dir`이면 무효 | 조건부 안전 |

### D-4. 현재 운영 집계의 정합성 분석

`evidence/production_db_aggregates_no_rows.txt` 기준:

- `CONTENT_PACKAGE_PREPARE SUCCESS = 1,568` = `CONTENT_PACKAGE_PREPARED` 이벤트 1,568 = `CONTENT_WORKER_SUBMITTED` 1,568 → **준비·제출이 1:1로 정확히 대응.** 누수 없음.
- `CODEX_CONTENT_ONE_ITEM`: SUCCESS 9 + FAILED 1,559 = 1,568 → **제출 대비 결과가 정확히 1:1.** 유실된 작업 없음.
- `CONTENT_RESULT_APPLIED = 9` = SUCCESS 9 → 적용 누락 없음.
- `CONTENT_WORKER_FAILED = 1,559` ÷ `CONTENT_ERROR` 후보 519 ≈ **3.00** → 후보당 정확히 3회. `storage.py:1571`의 `retry_limit=3`과 일치.
- **결론: 재시도 폭주도, lease/fencing 누수도 아닙니다.** 설계된 상한이 정상 작동한 결과이며, 전량이 TLS라는 단일 외부 원인으로 소진됐습니다.
- `CONTENT_FACT_VERIFIED = 10` vs `CONTENT_RESULT_APPLIED = 9` → 검증이 1건 더 많음. 적용 없이 검증만 수행된 건(`_next_content_verification_candidate` 경로)이 1건 존재. 정합적.
- `CONTENT_AUTO_REVISED = 0` → **자동수정 경로는 운영에서 한 번도 실행된 적이 없습니다.**
- `BLOCKED 25,243 + CONTENT_ERROR 519 + CONTENT_SUBMITTED 1 = 25,763` (총 후보). 배치 7건이 전부 `REVIEW_REQUIRED`인 것은 `storage.py:1656`이 **모든 후보가 ready일 때만** `READY`로 두기 때문으로, 정합적입니다.
- 각 배치의 `blocked_count` 합계와 `BLOCKED` 25,243의 일치 여부는 **패키지에 배치별 수치가 없어 확인 불가**입니다. M-9 때문에 불일치가 예상되며, 아래 쿼리로 확인하십시오.

```sql
SELECT b.id, b.blocked_count,
       (SELECT COUNT(*) FROM candidates c WHERE c.batch_id=b.id AND c.status='BLOCKED') AS status_blocked,
       (SELECT COUNT(*) FROM candidates c WHERE c.batch_id=b.id
          AND EXISTS (SELECT 1 FROM json_each(c.issues_json) j
                      WHERE j.value NOT IN ('IMAGE_RIGHTS_NOT_APPROVED','MISSING_IMAGE_SOURCE_URL','MISSING_OR_ZERO_QUANTITY'))) AS true_blocked
FROM batches b;
```
`blocked_count = true_blocked`이면 정상이고, `status_blocked`와의 차이는 M-9로 설명되는 정상 차이입니다.

---

## E. Test gaps

### E-1. 143 통과 (Bridge) 분석

`evidence/test_results.txt:12` — `143 passed`. `ebay_bridge/tests` + `server_integration/tests`. Bridge 자체 회귀는 없습니다.

**그러나 143개가 덮지 못하는 영역이 A절 Critical과 정확히 겹칩니다.**

- `image_source`의 `allowed_hosts` 파생 로직(C-1)에 대한 테스트 없음 — `test_app.py`에 `allowed_hosts` 문자열 0건.
- sandbox/production 분기 테스트 없음(기능 자체가 없으므로 당연).
- n8n 상태 맵과 서버 status 리터럴의 계약 테스트 없음(C-4).
- `live_precheck_one`/`live_test_one`의 인증 부재를 검증하는 테스트 없음(C-3).
- `set_candidate_content_submission`/`_error`를 **빈 토큰으로** 호출하는 테스트 없음(H-3).

### E-2. 266 → 260 통과 / 11 실패 분석

**결론: 11건은 eBay 범위와 무관한 동시 작업의 회귀이며, 공유 계약에 영향을 주지 않습니다.**

근거:

1. 실패 테스트 전부가 DeWalt 사전점검·카탈로그·Codex 리뷰 도메인입니다 (`test_results.txt:397-407`).
2. `app/routes_ebay.py`는 `sourcing_preflight`/`sourcing_batches`를 **import하지 않습니다** (import 목록 `routes_ebay.py:1-34`). 역방향도 없습니다 — `app/sourcing_preflight.py`와 `app/routes_sourcing_preflight.py`에 `ebay` 문자열 0건.
3. `routes_ebay.py`의 외부 의존은 `candidate_builder`, `auth`, `db`, `routes_onedrive_excel` 뿐이며, 이들 중 변경된 파일은 `routes_onedrive_excel.py`입니다 — **다만 실패한 11개 테스트는 이 모듈을 통과하지 않습니다.**

**11건의 실제 근본 원인은 2개로 보입니다** (증거 기반 추정):

- **원인 A — 브랜드 인식 회귀**: `assert '미인식' == 'DeWalt'` (`test_results.txt:43-44`). `test_dewalt_preflight_preserves_explicit_model_numbers`, `test_dewalt_preflight_excludes_all_battery_related_products`, `test_catalog_preflight_automatically_excludes_uncertain_translation`의 `execution_allowed is True` 실패가 여기서 파생됩니다.
- **원인 B — `source_key` 포맷 변경**: `assert 'dewalt_kr_of...575d9bfa4:181' == 'dewalt_kr_official:181'` (`test_results.txt:93-94`). 프로필 식별자에 해시 접미어가 추가됐고 테스트가 갱신되지 않았습니다. 이로 인해 중복/불일치 판정이 바뀌어 `execution_allowed=False` → 승인 API가 409를 반환(`test_results.txt:176-177`, `:213-214`, `:256-257`)하며, `test_admin_dewalt_preflight_download_and_approval` 이하 6건이 연쇄 실패합니다.

**따라서**: 이 11건은 eBay 배포를 막는 사유가 **아닙니다.** 다만 `sourcing_preflight` 변경 자체가 미완이므로, 해당 모듈 담당자가 테스트를 갱신하거나 변경을 되돌리기 전까지 **메인 서버 전체 배포는 보류**해야 합니다. eBay Bridge는 별도 프로세스(8010)이므로 독립적으로 다룰 수 있습니다.

### E-3. 우선 추가할 테스트

**P0 (실등록을 열기 전 반드시)**

| # | 테스트 | 대상 |
|---|---|---|
| P0-1 | `image_source`가 비허용 호스트를 거부 / rebinding 거부 / `::ffff:127.0.0.1` 거부 | C-1 |
| P0-2 | 인증 없는 `live_precheck_one`·`live_test_one`·`image_source`가 401 | C-3 |
| P0-3 | 서버가 반환하는 모든 status 리터럴 집합 == n8n 맵 키 집합 | C-4 |
| P0-4 | `set_candidate_content_submission`/`_error`를 빈 `lease_token`+`prompt_hash`로 호출 시 `StateConflictError` | H-3 |
| P0-5 | `EBAY_AU` 후보의 SiteID와 `listing_url`이 AU여야 함 | H-2 |
| P0-6 | 승인 후 가격·수량·정책·이미지 바이트를 각각 변경 시 `test-one`이 409 (5 케이스) | Q15 확증 |
| P0-7 | `operation_resumable`과 `_operation_resumable_row`가 STARTED+2시간 행에 대해 같은 답 | H-4 |

**P1**

| # | 테스트 | 대상 |
|---|---|---|
| P1-1 | 콘텐츠 적용 직후 프로세스 중단 시뮬레이션 → operation이 `STARTED`로 남지 않음 | H-6 |
| P1-2 | 동일 `request_id` 재사용 시 replay가 아니라 거부 | H-7 |
| P1-3 | 두 스레드가 `set_candidate_content_error`를 동시 호출해도 version 손실 없음 | H-5 |
| P1-4 | `source_type=OFFICIAL` + 브랜드 무관 도메인 → `UNVERIFIED` | M-1 |
| P1-5 | `.example` 호스트가 근거 URL로 거부됨 | M-3 |
| P1-6 | `listing: pack quantity` CRITICAL 항목이 자동수정 대상에서 제외 | M-4 |
| P1-7 | N회 연속 Codex 실패 후 worker가 자동 잠김 | H-8 |
| P1-8 | `candidates(batch_id, marketplace, sku)` 중복 삽입 시 IntegrityError | H-9 |

**P2**

- 배치별 `blocked_count` == 비-deferred 이슈 보유 후보 수 (M-9 smoke test)
- 리다이렉트 6회 소진 시 명확한 오류 (M-12)
- `image_sha256`가 `request_hash`에 반영됨을 확인하는 속성 테스트
- 25,000건 규모에서 `BridgeStore.__init__` 기동 시간 측정 (B-3)

---

## F. Go/No-Go

| 단계 | 판정 | 근거 |
|---|---|---|
| **콘텐츠 자동화** | **CONDITIONAL GO** | 상태 머신·CAS·fencing·멱등성이 실제로 견고합니다(D-2/6, D-4의 1:1 정합성). 다만 **선결 3건**: ① TLS 해결(C-3절), ② n8n 상태 맵 수정(C-4), ③ 서킷 브레이커(H-8). 이 3건 없이 재개하면 남은 승인 후보가 같은 방식으로 전량 소진됩니다. |
| **이미지 자동화** | **NO-GO** | C-1(SSRF)이 미수정 상태입니다. 추가로 M-7(권리 승인 근거 부재)은 법적 리스크이고, 생성형 배경 제거의 형상·로고 변경을 자동 탐지하는 수단이 없습니다(Q30). |
| **eBay sandbox 1건** | **NO-GO (실행 불가)** | C-2. 코드에 sandbox 경로가 없습니다. 먼저 환경 분기를 구현해야 이 단계가 존재할 수 있습니다. |
| **eBay 실등록 1건** | **NO-GO** | C-2(sandbox 미경유) + C-3(실등록 API 무인증) + H-2(AU 오배송) + M-6(승인이 1분 내 무효화되어 완주 불가). 네 가지 중 어느 하나만으로도 보류 사유입니다. |
| **Graph Excel writeback** | **NO-GO (미구현)** | H-1. `/api/ebay-result`가 원장 저장까지만 수행하며 `verified=true`가 될 경로가 없습니다. |
| **전체 무인 운영** | **NO-GO** | 위 전부에 더해, 관측성 부재(D-2의 고착 3종을 감지할 자동 수단 없음)와 감사 원장의 CASCADE 삭제(M-8)로 사후 추적이 보장되지 않습니다. |

**현재 `live_enabled=false` 유지는 올바른 판단입니다.** 이를 여는 전제 조건은 G절 1~4단계 완료입니다.

---

## G. Patch plan

위험 감소 크기 순입니다(변경량 순이 아님).

### 1단계 — 실등록 경로를 구조적으로 잠금 (위험 감소 최대)

| 파일 | 변경 |
|---|---|
| `ebay_bridge/app.py:2144,2218` | `live_precheck_one`/`live_test_one`에 `_require_automation(request)` 추가 |
| `ebay_bridge/app.py` (앱 생성부, `:63` 부근) | `TrustedHostMiddleware(allowed_hosts=["127.0.0.1","localhost"])` 추가 |
| `ebay_bridge/config.py` | `ebay_environment` 설정 추가 (기본 `SANDBOX`) |
| `ebay_bridge/publisher.py:17-18,57,109,223` | base URL·SiteID·리스팅 도메인을 환경/마켓별 매핑으로 교체 |
| `ebay_bridge/secrets_provider.py:13,16` | Keychain 서비스명·토큰 URL을 환경별 분리 |

- 배포 전: P0-2, P0-5 통과. 배포 후: `GET /health`에 `ebay_environment` 노출 확인.
- 롤백: 이 단계는 기능을 잠그기만 하므로 롤백 위험 없음. 소스 tar 복원으로 즉시 원복.

### 2단계 — SSRF 차단

| 파일 | 변경 |
|---|---|
| `ebay_bridge/app.py:457,480` | `_require_automation` 추가. `allowed_hosts`를 설정 상수(`settings.image_allowed_hosts`)에서 읽도록 변경 |
| `server_integration/image_pipeline.py:44-56,97-98` | 검증된 IP를 반환해 그 IP로 직접 연결. `ipv4_mapped` 언랩 후 `is_global` 검사 |
| `server_integration/image_pipeline.py:110` | 원격 HTTP 상태 코드를 오류 메시지에서 제거 |

- 배포 전: P0-1 통과. 롤백: 이미지 등록 기능만 영향. 기존 이미지·DB 무변경이므로 소스 원복으로 완결.

### 3단계 — 자동화 재개 안전장치

| 파일 | 변경 |
|---|---|
| n8n `eBayContentJJS01` 3번 노드 | `messages` 맵을 서버 실제 status 집합으로 교체. 미지 status는 경고 처리 |
| n8n 2번 노드 | `request_id`를 전역 고유 값으로 교체 |
| `ebay_bridge/app.py` (`storage.py`에 status 상수 모듈 신설) | 응답 status 리터럴을 단일 소스로 분리해 계약 테스트 가능하게 |
| `ebay_bridge/app.py:1326` 부근 | 연속 실패 카운터 + 임계 초과 시 worker 자동 잠금 |
| 서비스 환경 | `SSL_CERT_FILE`/`SSL_CERT_DIR` 주입 |

- 배포 전: P0-3, P1-7 통과. 격리 18012에서 10건 실행해 전건 성공.
- 배포 후: n8n을 **수동 1회 실행**으로 검증한 뒤에만 스케줄 활성화.
- 롤백: n8n 워크플로를 비활성화하는 것만으로 즉시 중단. DB 변경 없음.

### 4단계 — 상태 머신 결함 정리

| 파일 | 변경 |
|---|---|
| `storage.py:1480,1551` | `lease_token`/`prompt_hash` 필수화 |
| `storage.py:1557` | `_lease_is_active` 검사 추가 |
| `storage.py:1785-1790` | `_operation_resumable_row`로 통일 |
| `storage.py:705,807,1470,1541` | `BEGIN IMMEDIATE` 추가 |
| `app.py:1516-1529` | 원자적 operation 완료 인자 전달 |
| `storage.py` 스키마 | `candidates(batch_id, marketplace, sku)` 고유 인덱스 (중복 점검 후) |

- 배포 전: P0-4, P0-7, P1-1, P1-3, P1-8 통과 + 기존 143건 유지.
- 롤백: 고유 인덱스는 `DROP INDEX`로 원복 가능. 나머지는 소스 원복.

### 5단계 — 1,559건 복구

- 복구 명령 신설: `CONTENT_ERROR` + 재시도 소진 후보를 실패 사유별로 분류하고, TLS 계열만 `content_attempt_count`/`content_next_retry_at`을 초기화해 큐로 되돌리는 배치 스크립트.
- **반드시 dry-run 모드를 먼저 제공**하고, 복구 대상 SKU 목록과 사유 분포를 출력한 뒤 사람이 승인해야 실행되도록 합니다.
- 실행 전 DB 스냅샷 필수.

### 6단계 — 근거·품질 강화 (실등록 전 마지막)

- `prompts.py:19,258` — `RESERVED_TEST_HOST_SUFFIXES`를 운영 빌드에서 제거.
- `prompts.py:751-764` — `OFFICIAL`에 브랜드 도메인 대조 추가.
- `prompts.py:745-756` — 독립 근거 판정에 호스트명 외 조건(등록 도메인 기관, 본문 유사도) 추가.
- `prompts.py:76-88` — `HUMAN_ONLY_REPAIR_TERMS`에 `quantity`, `pack count`, `piece count`, `color`, `voltage`, `size`, `capacity` 추가.
- `storage.py:179` — 감사 원장을 CASCADE 대상에서 분리하거나 별도 append-only 파일로 이중 기록.
- 검증 모델을 생성 모델과 분리(M-5).

### 7단계 — Excel writeback 구현

- H-1. 위 6단계가 모두 완료되고 실등록 1건이 성공한 뒤에 착수합니다.


---

## 부록. 55개 질문 답변

표기: **상태** / **위험** / **근거** / **수정** / **테스트** / **합격 기준**

### P0. 지금 즉시 확인할 운영 위험

**1. 8010 메모리 코드와 디스크 코드 차이를 안전하게 증명하는 방법**
- 상태: 차이 존재 여부 **확인 불가**. `git_status.txt`에 Bridge 핵심 6개 파일이 `M`, `content_worker.py` 등 3개가 `??`.
- 위험: 재시작 시 미검증 코드가 즉시 활성화(B-3).
- 근거: `evidence/git_status.txt`, `evidence/runtime_status.txt`(기동 2026-07-25 08:09).
- 수정/방법: B-1의 프롬프트 지문 대조법. `dry_run: true`는 DB를 변경하지 않습니다(`app.py:1288-1294`, `:1367-1376`).
- 합격 기준: 8010의 dry-run 프롬프트 SHA-256 == 디스크 소스로 띄운 격리 인스턴스의 동일 후보 프롬프트 SHA-256.

**2. 배포 원본 고정과 drift 차단**
- 상태: 저장소 JSON 2개와 런타임본이 모두 `id=eBayContentJJS01`, active 값만 다름(B-2).
- 위험: 어느 파일을 import해도 실제 워크플로를 덮어씀. 무엇이 정본인지 판별 불가.
- 근거: `evidence/n8n_runtime_vs_repository.txt`.
- 수정: 정본을 `JJS_EBAY_CONTENT_ONE_ITEM_PRODUCTION.json` 하나로 정하고, 나머지는 삭제하거나 `id`를 분리. 파일에 `updatedAt`/`versionId`를 커밋하고, CI에서 런타임 export와 diff.
- 합격 기준: 런타임 export와 저장소 정본의 노드 파라미터 diff가 `active`를 제외하고 0.

**3. 실패 1,559건의 성격 판별**
- 상태: **후보당 3회 재시도 상한이 정상 작동한 결과.** 재시도 폭주도 lease/fencing 누수도 아닙니다.
- 근거: D-4의 정합성 분석 — 준비 1,568 = 제출 1,568 = (성공 9 + 실패 1,559), 1,559÷519 ≈ 3.00, `storage.py:1571` `retry_limit=3`.
- 판별 방법(재확인용): `SELECT sku, COUNT(*) FROM operations WHERE operation='CODEX_CONTENT_ONE_ITEM' AND status='FAILED' GROUP BY sku HAVING COUNT(*) > 3;` — 결과가 비어 있으면 폭주 아님.
- 합격 기준: 위 쿼리 0행, `SELECT COUNT(*) FROM operations WHERE status='STARTED'` 0행.

**4. 배치 blocked_count와 후보 상태의 일관성**
- 상태: **두 값은 서로 다른 정의를 씁니다**(M-9). 질문서의 518/2와 실제 집계 519/1의 차이는 감사 중 n8n 1회 호출로 `CONTENT_SUBMITTED` 1건이 `CONTENT_ERROR`로 전환된 것으로 정확히 설명됩니다.
- 근거: `storage.py:1653-1657`(deferred 제외) vs `:1610`(이슈 유무), `DEFERRED_WORKFLOW_ISSUES` = `storage.py:16-20`.
- 위험: UI와 자동화가 "차단 아님"으로 표시된 후보를 대상에 포함할 수 있음.
- 테스트: D-4 말미의 SQL. 합격 기준: `blocked_count == true_blocked` 전 배치.

**5. `CONTENT_SUBMITTED` 4시간 lease 회수 보장**
- 상태: **보장됩니다.** `_lease_is_active`(`storage.py:97-116`)가 `content_lease_until`을 우선 보고, 없으면 `content_requested_at + 4h`로 폴백합니다. 만료 후 `claim_candidate_content_package`가 재청구하며 새 `lease_token`을 발급(`storage.py:1335`)해 이전 worker를 차단합니다.
- 위험: 영구 고착은 lease가 아니라 **operation `STARTED` 잔류**에서 발생합니다(D-2/2, H-6).
- 중복 worker: `_content_worker_lock`(`app.py:211-224`)이 같은 `data_dir` 공유 시 유효. 다른 `data_dir`이면 무효.
- 테스트: P1-1. 합격 기준: 재시작 10회 반복 후 `STARTED` operation 0행, `CONTENT_SUBMITTED` 후보 0건.

**6. TLS 미해결 상태로 재개 시 부작용 / 서킷 브레이커 필요성**
- 상태: **필요합니다**(H-8).
- 위험: 승인 후보당 3회 × 최대 900초 Codex 호출, operation·event 행 누적. `candidate_events`는 1,559건 실패로 이미 크게 증가한 상태.
- 근거: `content_worker.py:159-166`, `app.py:1554-1566`, `storage.py:1571-1576`.
- 즉시 조치: `SSL_CERT_FILE`/`SSL_CERT_DIR` 주입(`content_worker.py:30-31`에서 이미 허용).
- 합격 기준: 연속 N회(권장 5) 실패 시 worker 자동 잠금 + 알림, 격리에서 인위적 실패 주입으로 재현.

### P0. 중복 등록과 데이터 손실

**7. 동시 요청·만료 직전 완료·오래된 worker·재시작이 겹쳐도 1회만 적용되는가**
- 상태: **콘텐츠·실등록 모두 1회만 적용됩니다.** D-2/6, D-2/7 참조. 이미지도 `_candidate_image_lock` + expected_version CAS로 보호(`app.py:489-527`).
- 예외: H-3(빈 토큰 우회), H-7(n8n ID 재사용 replay).
- 합격 기준: P0-4, P1-2 통과.

**8. 최종 부작용의 유일 키는 무엇이며 서로 모순될 수 있는가**
- 상태: **계층이 다릅니다.**
  - `idempotency_key`(`planner.py:80-82`) = sha256(marketplace|asin|sku|request_hash) — **데이터가 바뀌면 값이 바뀌므로 SKU의 안정적 유일 키가 아닙니다.** 같은 SKU를 가격만 바꿔 다시 시도하면 새 operation이 생성됩니다.
  - **실제 최종 유일 키는 `registrations`의 `UNIQUE(marketplace, sku)`와 원격 eBay 상태 확인**(`publisher.py:174-177`)입니다.
  - `request_hash`는 "승인 당시 데이터 동일성"의 키, `owner_token`은 operation 완료 권한의 키, `lease_token`은 콘텐츠 임대 소유의 키, 후보 `version`은 CAS의 키입니다.
- 모순 가능성: `idempotency_key`만 보면 "새 작업"인데 `registrations` 제약으로는 "중복"인 상황이 발생합니다. 이때 `record_registration`이 `ValueError`를 던지고(`storage.py:1811-1815`) 그 예외가 등록 성공 **이후에** 발생하므로, eBay에는 올라갔는데 원장 기록이 실패합니다 — 다만 operation은 `FAILED`로 남고 재시도 시 `allow_existing`으로 기존 리스팅을 재사용하므로 중복 등록은 되지 않습니다.
- 수정: `record_registration`을 `ensure_published` **이전에** 예약 행으로 선삽입(`status='PUBLISHING'`)하고 성공 시 갱신하는 2단계로 바꾸면 이 창이 사라집니다.

**9. 트랜잭션 밖의 파일 저장·이미지 다운로드·eBay 호출로 DB와 파일이 어긋날 수 있는가**
- 상태: **부분적으로 방어되어 있습니다.**
  - 이미지: `app.py:503-528`이 기존 파일을 백업으로 이동 → 새 파일 배치 → DB 기록 순서이고, 예외 시 백업을 되돌립니다. 양호.
  - 승인·dry-run·review JSON: `_atomic_json`(`app.py:173-183`)로 원자적 기록. 양호.
  - **eBay 호출**: 8번 참조. 등록 성공 후 원장 기록 실패 창이 존재.
  - **콘텐츠**: H-6의 operation 분리 트랜잭션.
- 합격 기준: P1-1 통과 + 8번 수정 적용.

**10. 등록 성공 후 프로세스 사망 시 재등록 가능성 / eBay 조회 복구 절차**
- 상태: **재등록되지 않습니다.** operation이 `STARTED`로 남고 `begin_operation`(`storage.py:1690-1694`)이 `FAILED`만 재개하므로 이후 모든 시도가 409입니다. `live_precheck_one:2181-2187`도 원격에 SKU가 있으면 409를 반환합니다.
- 위험: **영구 고착**이며, **eBay 조회로 원장을 복구하는 절차가 코드에 없습니다**(C-2/6). `publisher.py:72-93`의 조회 함수는 있으나 이를 원장 복구에 쓰는 라우트·명령이 없습니다.
- 수정: `POST /api/registrations/reconcile-one`(관리자 인증 + 승인 토큰)을 신설해 원격 offer/listing을 읽어 `registrations`에 기록하고 operation을 `SUCCESS`로 마감.
- 합격 기준: 격리에서 "등록 성공 직후 프로세스 kill" 재현 후 복구 명령으로 원장이 정확히 1행 생성되고 재등록이 발생하지 않음.

**11. `/api/ebay-result`와 Bridge registration 고유 제약의 마켓·변형 처리**
- 상태: **비대칭이며 변형 정책이 없습니다.**
  - JJS: `request_hash UNIQUE`, `UNIQUE(marketplace,sku)`, `UNIQUE(marketplace,asin)`, `UNIQUE(listing_id)` (`app/db.py:516-521`) — DB 레벨 강제.
  - Bridge: `UNIQUE(marketplace,asin)`, `UNIQUE(marketplace,sku)`만 존재, **`listing_id` 제약 없음**(M-11).
  - `UNIQUE(marketplace, asin)`은 **한 ASIN의 여러 SKU 변형을 구조적으로 금지**합니다(C-2/5).
- 위험: 변형 상품 등록 시 두 번째가 원인 불명의 `ValueError`로 실패. 마켓별 URL 오류(H-2)까지 겹치면 잘못된 URL이 JJS 검증을 통과합니다.
- 수정: 변형 정책을 먼저 문서로 확정한 뒤 제약을 맞추고, Bridge에 `UNIQUE(listing_id)` 추가.
- 합격 기준: 변형 2건 등록 시나리오가 정책대로 동작(허용이면 둘 다 성공, 금지면 명확한 409).

### P0. 실등록 잠금과 승인

**12. `live_enabled=false` 외 독립 방어선 수**
- 상태: **9개**(정상 경로 기준).
  1. `_live_locked` — `JJS_EBAY_LIVE_ENABLED=ENABLED` (`app.py:2116-2122`)
  2. `review_decision == APPROVED` + workflow 미차단 (`app.py:2147-2148`)
  3. `listing_plan`의 `live_issues` 전부 통과 (`planner.py:19-33`)
  4. dry-run 보고서 존재 + 해당 SKU `request_hash` 일치 (`app.py:2151-2168`)
  5. 원격 eBay에 동일 SKU 부재 (`app.py:2181-2187`)
  6. 15분 승인 토큰 해시 비교 + 파일 소비 (`app.py:2226-2233`, `:2255-2259`)
  7. seller ID + `access_token_hash` 재확인 (`app.py:2243-2248`)
  8. `remote_state_hash` 재확인 (`app.py:2249-2253`)
  9. `begin_operation` 멱등성 + `registrations` UNIQUE
- **다만 인증이 없어**(C-3) 이 체인 전체를 로컬 호출자가 자유롭게 구동할 수 있습니다. "방어선"은 오조작 방지이지 접근 통제가 아닙니다.

**13. 환경변수 오설정 하나만으로 실등록이 열리는가**
- 상태: **열리지 않습니다.** `JJS_EBAY_LIVE_ENABLED=ENABLED` 단독으로는 precheck→approval→test-one 3단계와 eBay 자격증명(`EBAY_CLIENT_ID`/`SECRET`/`REFRESH_TOKEN` 또는 Keychain)이 추가로 필요합니다(`secrets_provider.py:65-74`).
- **그러나 위험 조합이 있습니다**: `credential()`이 **환경변수를 Keychain보다 우선**하므로(`secrets_provider.py:66`), 환경변수 3개 주입만으로 Keychain을 우회해 임의 eBay 계정으로 전환할 수 있습니다. `settings`는 모듈 로드 시 1회만 읽으므로(`app.py:60`) 실등록 플래그는 재시작이 필요하지만, 자격증명은 매 호출 시 읽습니다.
- 수정: production에서는 Keychain을 우선하고 환경변수 경로를 명시적 opt-in으로 제한.

**14. 15분 승인 토큰의 결속 범위와 재사용·탈취·동시 소비 방어**
- 상태: **결속: batch_id, sku, batch 전체 candidate_hash, seller, access_token_hash, request_hash, remote_state_hash, 발급 시각** (`app.py:2189-2201`).
  - **marketplace는 직접 결속되지 않지만** `request_hash`가 `offer_payload.marketplaceId`를 포함하므로(`planner.py:56`, `:77-79`) 간접 결속됩니다. eBay 계정은 `seller` + `access_token_hash`로 결속됩니다.
  - 재사용 방지: `os.replace`로 승인 파일을 `.consumed.json`으로 이동(`app.py:2255-2259`). POSIX rename은 원자적이라 동시 소비 시 두 번째는 `FileNotFoundError` → 409. **양호**.
  - 탈취: 토큰은 해시로만 저장되고 `secrets.compare_digest` 비교, 파일 권한 0600. **양호**.
- 위험: M-6(batch 전체 해시 결속으로 1분 내 무효화), M-10(토큰 갱신 시 403).
- 합격 기준: P0-6 + 동시 2요청 중 1건만 성공.

**15. dry-run 이후 가격·수량·정책·이미지·콘텐츠 변경 시 승인 무효화**
- 상태: **전부 무효화됩니다. 확인 완료.** `request_hash`(`planner.py:77-79`)가 `inventory_payload`(제목·HTML·수량·condition·aspects), `offer_payload`(가격·통화·카테고리·3개 정책 ID·수량), `image_sha256`(이미지 바이트)를 모두 포함합니다. `live_test_one:2238-2239`가 이를 재계산해 비교합니다.
- 추가로 batch 전체 `candidate_sha256`도 비교하므로 오히려 과도하게 엄격합니다(M-6).
- 테스트: P0-6(5개 케이스). 합격 기준: 5/5 409.

**16. sandbox/production 자격증명 구분**
- 상태: **구분하지 않습니다. 실등록은 전부 production입니다.** C-2 참조.
- 위험: 최고 수준. sandbox 검증 단계 자체가 존재하지 않습니다.
- 합격 기준: `ebay_environment` 도입 후, sandbox 설정에서 production 호스트 호출 0건을 네트워크 모킹으로 증명.

### P1. 콘텐츠 사실성과 품질

**17. Fact Packet의 운영 DB 저장 여부(버전·출처 hash)**
- 상태: **부분 저장. 버전은 있고 출처 hash는 없습니다.**
  - 저장됨: `content_verification_checks`(field/value/status/importance/evidence_ko/source_type/source_url/corroborating_urls)가 후보 payload에 기록(`storage.py:1136` 계열, 필드 목록 `storage.py:55-62`).
  - **없음**: 근거 페이지의 내용 hash나 스냅샷. URL만 남으므로 페이지가 바뀌면 근거를 재현할 수 없습니다.
  - **가변**: `replace_candidate_contents`가 재작성 시 검증 필드를 전부 초기화합니다(`storage.py:1055-1063`).
- 수정: 근거 URL별 본문 sha256과 취득 시각을 별도 append-only 테이블에 기록.
- 합격 기준: 임의 후보 1건에 대해 검증 시점의 근거를 6개월 후에도 재현 가능.

**18. 두 URL이 같은 판매 피드를 복제한 경우 독립 근거 2개로 계산되는가**
- 상태: **네, 잘못 계산됩니다.** `WEB_MATCH` 판정은 **호스트명 집합 크기 ≥ 2**만 확인합니다(`prompts.py:745-756`). 본문 유사도·피드 출처·등록 기관 대조가 없습니다.
- 수정: 근거 본문의 정규화 후 유사도(예: shingle Jaccard ≥ 0.8)면 동일 출처로 간주해 1개로 계산.
- 합격 기준: 미러 사이트 2곳을 근거로 준 표본이 `UNVERIFIED` 판정.

**19. 검색 스니펫·리디렉션·마켓 판매자 문구가 공식 사실로 승격될 수 있는가**
- 상태: **가능합니다.** `source_type=OFFICIAL`은 **URL 존재만 확인**하고 브랜드 공식 도메인인지 대조하지 않습니다(`prompts.py:751-756`). `AMAZON`만 `"amazon." in hostname`을 확인합니다(`prompts.py:760-762`).
- 추가 위험: `.example`/`.invalid`/`.test` 호스트가 공개 URL로 통과합니다(M-3, `prompts.py:19`, `:258`).
- 수정: 브랜드별 공식 도메인 목록을 유지하고 `OFFICIAL`은 그 목록에 대해서만 인정. 예약 테스트 접미어는 운영에서 제거.
- 합격 기준: P1-4, P1-5 통과.

**20. SKU의 `1Pack`, `Red Switch`, 지역 접미어가 근거 확인 전 사실로 출력되는가**
- 상태: **방어되어 있습니다.** `parse_sku_semantics`(`sku_semantics.py`)로 파싱한 내부 토큰은 `is_internal_token_check`로 검증 체크에서 제외되고(`prompts.py:718-724`), 남은 체크가 하나도 없으면 `ValueError`로 거부합니다(`prompts.py:788-789`). 제목 쪽은 `_title_has_exact_model`이 `XJ`/`QW` 지역 접미어를 모델 일치에서 배제합니다(`quality.py:172-181`, `REGION_SUFFIX_TERMS` `:23`).
- 남은 위험: `REGION_SUFFIX_TERMS`가 `XJ`, `QW` 2개뿐이라 다른 지역 코드는 커버되지 않습니다.
- 합격 기준: 20건 표본에서 SKU 내부 토큰이 근거 없이 제목·HTML에 등장한 건 0.

**21. 공식 자료와 ASIN 자료 충돌 시 자동수정이 잘못된 쪽을 선택할 수 있는가**
- 상태: **선택 자체를 하지 않습니다.** 충돌(`CONFLICT`) 상태의 체크가 하나라도 있으면 `status`가 `REVIEW_REQUIRED`가 되고(`prompts.py:791-792`), CRITICAL 식별 항목은 `HUMAN_ONLY_REPAIR_TERMS`로 자동수정에서 배제됩니다(`prompts.py:76-88`).
- 남은 위험: M-4 — 팩 수량·색상·전압·사이즈·용량이 CRITICAL 목록(`prompts.py:30-52`)에는 있으나 HUMAN_ONLY 목록에는 없어 자동수정 대상입니다.
- 합격 기준: P1-6 통과.

**22. 1회 자동수정의 범위와 사람검수 분기**
- 상태: `_is_safe_content_repair`(`prompts.py:110-132`)가 결정합니다.
  - 항상 허용: importance ≠ CRITICAL인 `REMOVE`.
  - 조건부 허용: 필드가 `listing:` 또는 `content:` 접두어를 가지고, `HUMAN_ONLY_REPAIR_TERMS`(asin/identity/brand/model/product type/generation/compatibility/certification/origin/package contents/kit·bare) 미포함이며, `CORRECT`는 출처가 WEB_MATCH/OFFICIAL/AMAZON일 때.
  - **제품 식별·호환성은 반드시 사람검수로 갑니다. 그러나 "팩 수량"은 `package contents`로 표현될 때만 배제되고 `quantity`/`pack count`/`piece count`로 표현되면 자동수정됩니다**(M-4).
- 1회 상한: `content_auto_revise_count >= 1`을 앱(`app.py:1834-1839`)과 DB(`storage.py:1017-1022`) 두 곳에서 확인. 견고합니다.
- **운영 실적 0건** — `CONTENT_AUTO_REVISED` 이벤트가 없습니다(C-1 표).

**23. 생성과 검증이 같은 모델·프롬프트에 의존하는 위험**
- 상태: **동일 모델·동일 계정입니다.** `run_codex_content`와 `run_codex_verification`이 같은 `settings.codex_model`/`codex_binary`를 씁니다(`content_worker.py:186-201`). 프롬프트만 다릅니다(`make_prompt_batch` vs `make_content_verification_prompt`).
- 완화 수단: 결정적 규칙 검증(`quality.py:258-351`)이 별도로 존재하고, `parse_content_verification`의 출처 규칙이 모델 자기선언을 일부 반증합니다. 이 두 가지는 모델 독립적입니다.
- 수정: 검증 모델을 다른 계열로 분리하거나, 최소한 `codex_verification_model` 설정을 별도로 두어 교차 검증.
- 합격 기준: 20건 표본에서 생성-검증 모델을 분리했을 때와 동일했을 때의 사람검수 전환율 차이를 측정하고, 분리 시 놓친 오류가 유의미하게 줄어드는지 확인.

**24. 20건 표본의 "오인 0건, 근거 없는 사실 0건" 판정 재현 방법**
- 상태: 판정 절차가 코드·문서에 **없습니다**.
- 제안: ① 표본은 브랜드 5종 × 변형 유형 4종(팩 수량/색상/전압/지역 접미어)으로 층화 추출, 시드 고정. ② 판정자는 eBay 운영 담당 1명 + 제품 지식 보유자 1명, 독립 판정 후 불일치는 3인째가 중재. ③ 판정 항목은 `content_verification_checks`의 각 field에 대해 "근거 URL이 실제로 그 값을 지지하는가"를 예/아니오로 기록. ④ 판정 원본(스크린샷 포함)을 근거 원장에 보관.
- 합격 기준: 20건 전체에서 CRITICAL 항목 오인 0, 근거 URL이 값을 지지하지 않는 건 0, 판정자 간 초기 불일치율 ≤ 10%.

### P1. 웹·HTML·이미지 보안

**25. source/image URL이 SSRF 방어를 우회할 수 있는가**
- 상태: **우회 가능합니다.** C-1 참조.
  - 호스트 허용목록: 요청 URL에서 파생되어 **무효**(`app.py:480`).
  - DNS rebinding: 검증(`image_pipeline.py:52-56`)과 접속(`:98`)이 각각 이름을 해석 → **성립**.
  - IPv6: Python 3.9의 `is_global`이 `::ffff:127.0.0.1`을 언랩하지 않음 → **성립**.
  - redirect chain: 매 홉마다 재검증하므로 **차단됨**(`image_pipeline.py:96-108`). 다만 6홉 소진 시 3xx를 성공 취급(M-12).
  - localhost 변형: `is_global`이 `127.0.0.1`/`0.0.0.0`/사설 대역을 차단. `.local`/`.internal` 문자열 차단은 근거 URL 경로(`prompts.py:294-296`)에만 있고 이미지 경로에는 없음 — 다만 이름 해석 결과가 사설이면 차단됨.
- 합격 기준: P0-1의 4개 케이스 전부 거부.

**26. HTML sanitizer의 차단 범위**
- 상태: **sanitizer가 아니라 validator입니다.** 위반을 `UNSAFE_DESCRIPTION_HTML` 이슈로 표시할 뿐 HTML을 정화하지 않습니다(`quality.py:309-318`). 다만 이 이슈는 차단성이므로(`DEFERRED_WORKFLOW_ISSUES` 미포함) `listing_plan`이 등록을 막습니다.
- 차단 확인:
  - 태그: 허용목록 외 전부 unsafe → `script`/`iframe`/`form`/`svg`/`math` 차단(`quality.py:84-85`, 허용목록 `:24-27`).
  - 속성: `style` 외 **모든 속성**이 unsafe → `onerror`/`href`/`src` 차단(`quality.py:97-99`).
  - CSS: `url(`/`@import`/`expression(`/`javascript:`/`image-set(`/`http:`/`https:`/`data:`/`//` 차단(`quality.py:100-109`). 속성 허용목록 + background 색상 정규식(`:120-128`).
  - malformed nesting: `tag_stack` 불일치 시 `malformed`(`quality.py:144-146`), 미닫힘도 검사(`:317`).
  - entity/encoding: `HTMLParser`가 속성값의 문자 참조를 디코드한 뒤 검사하므로 `&#106;avascript:` 우회 불가.
- **사각지대**: `handle_comment`/`unknown_decl` 미구현(L-5) — HTML 주석·CDATA가 무검사 통과. HTML에서는 무해합니다.
- **양호**: 운영자 UI 미리보기가 `sandbox=""` iframe(`static/index.html:242`)이라 저장형 XSS 없음.

**27. 이미지 다운로드의 MIME 위장·압축 폭탄·초대형 픽셀·EXIF·경로 탈출·심볼릭 링크 방어**
- MIME 위장: **방어됨.** 매직바이트 판정 + 선언 Content-Type 교차검증(`image_pipeline.py:59-71`).
- 압축 폭탄: **방어됨.** `Image.DecompressionBombWarning`을 오류로 승격(`quality.py:201-202`, `:219`).
- 초대형 픽셀: **방어됨.** `max_side=12000`, `max_pixels=40,000,000`(`quality.py:187-189`, `:212-213`).
- 크기: **방어됨.** Content-Length 사전 검사 + 스트리밍 누적 검사, 12MB 상한(`image_pipeline.py:114-127`).
- 경로 탈출: **방어됨.** 파일명이 `_validate_asin` 통과한 ASIN + 확장자 화이트리스트로만 구성(`image_pipeline.py:32-36`, `:133`), 디렉터리는 `_safe_brand`로 정규화(`:28-30`). 추가로 `_managed_image_path`가 루트 종속성을 재확인(`app.py:186-196`).
- 심볼릭 링크: **방어됨.** `os.replace`는 심볼릭 링크를 따라가지 않고 링크 자체를 교체.
- **EXIF: 처리 없음.** GPS·기기 정보가 그대로 eBay에 업로드됩니다. 상품 이미지라 위험은 낮으나 제거를 권장합니다.

**28. 이미지 파일과 DB 후보 version 사이 TOCTOU**
- 상태: **대부분 닫혀 있고, 한 곳이 남아 있습니다.**
  - 닫힘: `image_source`가 `_candidate_image_lock` 안에서 version을 **다시** 확인(`app.py:490-496`)하고, 실패 시 백업 롤백(`app.py:521-527`). `set_candidate_image`도 `BEGIN IMMEDIATE` + CAS(`storage.py:850-864`).
  - 닫힘: `request_hash`가 `image_sha256`을 포함하므로 dry-run↔test-one 사이 파일 교체는 409로 잡힙니다.
  - **남음**: `live_test_one`에서 `listing_plan`(해시 계산, `app.py:2237`)과 `ensure_published` 내부 `upload_image`(파일 재읽기, `publisher.py:189`) 사이의 창. 이 구간에 파일이 바뀌면 해시와 다른 이미지가 업로드됩니다. 창이 좁고 로컬 파일 쓰기 권한이 필요합니다.
- 수정: `listing_plan` 시점에 파일 바이트를 메모리로 읽어 그대로 업로드.

**29. 이미지 사용 권리 승인의 이력**
- 상태: **단순 boolean입니다.** 요청 본문의 `rights_approved: bool`(`app.py:110`, 검사 `:459-460`)이 참이면 `image_rights="APPROVED"` 문자열을 payload에 씁니다(`storage.py:781`).
- 기록되는 것: `IMAGE_SOURCE_SAVED` 이벤트에 `source_url`, `rights`, `status`(`storage.py:788-796`).
- **기록되지 않는 것: 승인자 신원, 승인 시각(이벤트의 `created_at`은 저장 시각), license 근거, 원본 페이지 스냅샷.** 게다가 `image_rights`는 후속 호출로 덮어쓸 수 있는 가변 필드이고, `candidate_events`는 batch CASCADE로 삭제됩니다(M-8).
- 수정: 승인자 ID·시각·license 유형·근거 URL을 append-only 테이블에 기록하고 `image_rights` 변경 시마다 행 추가.
- 합격 기준: 임의 등록 건에 대해 "누가 언제 어떤 근거로 승인했는가"를 DB만으로 답할 수 있을 것.

**30. 생성형 배경 제거가 로고·구성품·색상·형상을 바꾼 경우 탐지**
- 상태: **자동 탐지 수단이 없습니다.** `image_file_issues`(`quality.py:184-221`)는 포맷·크기·해상도만 봅니다. 픽셀 수준 비교나 구조적 유사도 검사가 없습니다.
- 프롬프트에 보존 규칙은 있으나(`app.py:254-272`) 결과 검증은 사람에게 의존합니다.
- UI: `openDetail`이 이미지를 개별 표시하지만 **원본/편집본 나란히 비교 UI는 확인되지 않습니다** — `static/index.html`에 before/after 대조 컴포넌트 없음.
- 수정: 원본과 결과의 SSIM 또는 지각 해시 차이를 계산해 임계 초과 시 자동 차단, UI에 좌우 대조 뷰 추가.
- 합격 기준: 인위적으로 로고를 지운 표본이 자동 차단됨.

### P1. Excel writeback과 외부 시스템

**31. `PENDING_EXCEL`에서 재시도·검증·멱등성 구현 방법**
- 상태: **writeback 자체가 미구현**입니다(H-1).
- 제안 설계: ① `/api/ebay-result`가 Graph API로 대상 시트의 마지막 행을 찾아 append, ② 쓰기 직후 같은 범위를 **다시 읽어** 셀 값이 기대와 일치하면 `verified=true`, ③ 멱등 키는 `request_hash`로 두고 시트에 숨김 열로 기록해 재실행 시 기존 행을 찾아 갱신(중복 append 금지), ④ 실패는 `PENDING_EXCEL`로 남기고 백오프 재시도.
- 합격 기준: 같은 `request_hash`로 10회 호출해도 시트 행이 정확히 1개.

**32. eBay 등록 성공 + Excel 저장 실패 시 운영자 판단 기준**
- 상태: 현재는 `registrations.writeback_status`가 유일한 신호이며 항상 `PENDING_EXCEL`이라 신호로 쓸 수 없습니다(H-1).
- 기준(수정 후): **eBay 등록의 진실 원본은 `registrations` + JJS `ebay_listing_results`이고, Excel은 파생물**입니다. 따라서 재실행은 **Excel writeback만** 재시도해야 하며 등록 자체를 재시도해서는 안 됩니다. `retry_registration_writeback`(`app.py:2083`)이 등록을 다시 호출하지 않고 원장만 다시 보내는 구조인 점은 올바릅니다.
- 합격 기준: 운영 문서에 "PENDING_EXCEL은 등록 완료를 의미한다"를 명시하고, UI에서 등록 재시도 버튼이 이 상태에서 비활성.

**33. 직원 공동 편집 중 범위 쓰기·수식 복제·마지막 행 재확인의 충돌**
- 상태: **확인 불가.** writeback 미구현이라 검증 대상 코드가 없습니다. `app/workbook_graph.py`와 `app/xlsx_preserving.py`가 존재하나 eBay 경로에 연결되어 있지 않습니다(`routes_ebay.py`의 import 목록에 없음).
- 필요한 테스트: ① 동시 편집 중 append 시 ETag/`If-Match` 충돌 처리, ② 수식 열이 새 행에 자동 복제되는지, ③ 마지막 행 탐색이 필터·빈 행에 영향받지 않는지, ④ 표(Table) 객체 사용 시 범위 자동 확장 동작.
- 합격 기준: 3명이 동시 편집하는 상태에서 100회 append 시 유실·중복 0.

**34. eBay US/CA/AU 시트의 schema drift 탐지·중지**
- 상태: **미구현.** `REGISTRY_SHEETS`/`GLOBAL_REGISTRY_SHEETS`(`routes_ebay.py:61-65`)에 시트명 상수는 있으나 컬럼·수식·조건부 서식 변화를 감지하는 코드가 없습니다. `MARKETPLACE_RULES`에 `EBAY_CA` 항목이 없어 CA는 절반만 배선되어 있습니다.
- 제안: 시트 헤더 행의 정규화 후 sha256을 기대값과 대조하고, 불일치 시 writeback 전체를 중지(fail-closed).
- 합격 기준: 컬럼 1개를 추가·삭제·재배치한 각 케이스에서 writeback이 실행되지 않고 명확한 오류를 남김.

**35. Excel 반영 후 재읽기 검증 계약**
- 상태: 계약 형식은 이미 정의되어 있습니다 — `{"excel_saved": bool, "verified": bool}`(`app.py:2280-2290`, `:2109-2112`). **구현만 없습니다.**
- 계약 제안: `verified=true`는 "쓰기 후 같은 범위를 다시 읽어 SKU·ASIN·listing_id·listing_url 4개 셀이 전부 일치"로 정의. 부분 일치는 `verified=false`.
- 합격 기준: 쓰기 직후 셀을 인위적으로 변경한 표본에서 `verified=false`가 반환됨.

### P1. 상태 머신과 복구

**36. 문서 상태 모델 / `candidates.status` / payload 상태 / operation·event 원장이 서로 다른 진실 원본을 만드는가**
- 상태: **진실 원본은 `payload_json`의 `content_status`/`image_status` 하나이고, 나머지는 파생입니다.** 다만 파생이 어긋나는 지점이 3곳 있습니다.
  1. `candidates.status`는 `_refresh_batch_locked`가 `{"BLOCKED","IMPORTED"}`인 행만 재조정하므로(`storage.py:1657-1663`) `CONTENT_ERROR`/`CONTENT_SUBMITTED` 행은 영구히 재조정되지 않습니다.
  2. `batches.blocked_count`와 `candidates.status='BLOCKED'`의 정의 차이(M-9).
  3. operation 원장이 콘텐츠 적용과 별도 트랜잭션(H-6).
- 수정: 파생 값은 항상 payload에서 재계산하도록 `_refresh_batch_locked`의 재조정 대상을 전체 상태로 확대.

**37. batch status·blocked_count 미갱신 시 UI·자동화의 오판**
- 상태: **갱신은 됩니다.** 거의 모든 변경 메서드가 `_refresh_batch_locked`를 호출합니다(641/754/851/974/1158/1289/1454/1525/1605/1615/1638).
- 위험은 "미갱신"이 아니라 **정의 불일치**(M-9)와 **갱신 비용**입니다. 25,763개 후보에 대해 매 쓰기마다 전체 배치를 다시 읽고 모든 `image_sha256`를 디스크에서 계산합니다(`storage.py:1640-1667` → `quality.py:248-255`). **이것이 현재 시스템의 가장 큰 성능 병목입니다.**
- 수정: `candidate_digest` 계산을 증분화하거나 `image_sha256`를 payload에 캐시.
- 합격 기준: 후보 1건 변경의 p95 지연 < 200ms.

**38. 서버 재시작 직후 만료 lease 회수와 n8n 재호출의 race**
- 상태: **race가 존재하나 손상은 없습니다.** `BridgeStore.__init__`의 전체 배치 재계산(`storage.py:227-230`)이 `BEGIN IMMEDIATE` 없이 UPDATE를 수행하고, 동시에 도착한 n8n 호출은 `BEGIN IMMEDIATE`를 잡습니다. SQLite가 직렬화하므로 데이터 손상은 없지만, `busy_timeout=5000`(`storage.py:236`)을 넘기면 첫 호출이 500으로 실패합니다. 25,763건 재계산은 5초를 넘길 가능성이 큽니다.
- 수정: 기동 시 재계산을 백그라운드로 분리하거나, 준비 완료 전까지 `/health`가 `database=false`를 반환해 n8n이 대기하도록.
- 합격 기준: 재시작 직후 60초 내 n8n 호출이 500을 반환하지 않음.

**39. 실패 1,559건의 안전한 분류·정리·재시도 — migration/recovery 명령 필요성**
- 상태: **필요합니다.** 519개 후보가 `content_next_retry_at=""`로 자동 경로에서 영구 제외된 상태입니다(D-2/1).
- 제안 절차: G절 5단계. 반드시 dry-run 우선.
- 분류 쿼리:
```sql
SELECT json_extract(payload_json,'$.content_error') AS err, COUNT(*)
FROM candidates WHERE status='CONTENT_ERROR' GROUP BY err ORDER BY 2 DESC LIMIT 20;
```
- 합격 기준: TLS 계열로 분류된 건만 큐로 복귀하고, 복귀 후 10건 표본이 전부 성공.

**40. operation/result JSON 증가에 따른 SQLite·WAL 문제**
- 상태: operations 3,157행 + candidate_events 약 6,900행. `result_json`에 전체 응답이 들어가고(`app.py:1519-1529`) `payload_json`에는 후보 전체(제목·HTML 포함)가 들어갑니다.
- 위험: ① `_refresh_batch_locked`가 매 쓰기마다 전 후보 payload를 파싱하므로 DB 크기 증가가 지연에 직결(37번), ② WAL은 체크포인트되면 재사용되나 장시간 읽기 트랜잭션이 있으면 무한 증가, ③ 백업 일관성(46번).
- 수정: 오래된 `operations.result_json`을 요약으로 대체하는 보존 정책, 주기적 `PRAGMA wal_checkpoint(TRUNCATE)`.
- 합격 기준: 30일 운영 시뮬레이션에서 DB+WAL 증가율이 선형이고 p95 쓰기 지연이 목표 내.

**41. schema migration 버전·롤백 절차**
- 상태: **불충분합니다.** `PRAGMA table_info` 기반 조건부 `ALTER TABLE`만 존재하고(`storage.py:201-226`) 버전 테이블·다운그레이드 경로·마이그레이션 이력이 없습니다.
- 위험: 구버전 코드로 롤백하면 새 컬럼을 모르는 채 동작하거나(대체로 무해), 반대로 인덱스·제약 추가는 되돌릴 표준 절차가 없습니다.
- 수정: `schema_migrations(version, applied_at)` 테이블 도입, 각 마이그레이션에 up/down 스크립트.
- 합격 기준: N→N+1→N 왕복이 데이터 손실 없이 성공.

### P2. 운영성·관측성·성능

**42. 1건씩 처리 시 처리 시간·실패율·재시도 지연·사람검수량 지표**
- 상태: **원자료는 있으나 집계 지표가 없습니다.** `operations`에 상태·시도수·시각, payload에 `content_duration_seconds`가 있습니다(`storage.py:1078-1081`).
- 산출 가능한 추정: n8n 1분 주기 × 1건, Codex 타임아웃 900초. 성공 9건의 실제 `duration_seconds`는 패키지에 없어 **확인 불가**. 승인 후보 ~528건 기준으로 건당 5분 가정 시 약 44시간, 건당 15분 가정 시 약 132시간.
- 수정: `GET /api/metrics`를 신설해 상태별 개수, 최근 24시간 성공률, 평균·p95 소요, 사람검수 대기 수를 반환.
- 합격 기준: 대시보드에서 위 5개 지표를 조회 가능.

**43. 동일 오류 연속 시 자동 일시정지·알림·재개 버튼**
- 상태: **없습니다.** H-8과 동일 사안. 1,559건 실패가 이를 실증합니다.
- 수정: 브레이커 + 관리자 알림 + 수동 재개 엔드포인트.
- 합격 기준: 인위적 연속 실패 5회 후 자동 잠금, 재개 버튼으로만 해제.

**44. 상태별 필터 수와 실제 DB 집계 일치 smoke test**
- 상태: **없습니다.** `_batch_workflow_summary`(`app.py:993-1029`)가 UI용 집계를 만들지만 DB 집계와 대조하는 테스트가 없습니다.
- 수정: P2 테스트 항목(E-3).
- 합격 기준: UI 필터 수 == 동등한 SQL 집계, 전 배치.

**45. 구조화 로그의 식별자 포함 / 민감정보 미노출**
- 상태: **로깅이 사실상 없습니다.** `logger = logging.getLogger(__name__)`가 선언되어 있으나(`app.py:64`) `logger.*` 호출이 확인되지 않습니다. 따라서 "토큰·전체 프롬프트 노출" 위험은 현재 없지만, **batch/request/sku 추적성도 없습니다.**
- 주의할 지점(구현 시): `CodexWorkerError`가 Codex stderr 마지막 1,200자를 그대로 담고(`content_worker.py:164-166`) 이 문자열이 `content_error`로 DB에 저장됩니다(`storage.py:1540`). stderr에 토큰이 포함되면 DB에 남습니다.
- 수정: 구조화 로거 도입 시 batch_id/request_id/sku만 기록하고 프롬프트·결과 본문은 해시로. `content_error` 저장 전 알려진 비밀 패턴 마스킹.
- 합격 기준: 로그·DB 오류 필드에서 비밀 패턴 스캔 0건.

**46. DB 백업의 WAL 일관성 / 복구 drill 수행 여부**
- 상태: `scripts/backup_daily.sh`가 존재하나(374바이트) **eBay Bridge DB를 대상으로 하는지, `.backup` API를 쓰는지 확인 필요**. 복구 drill 수행 기록은 패키지에 없어 **확인 불가**.
- 위험: `cp`로 SQLite 파일만 복사하면 WAL과 불일치해 복구 시 데이터 손실.
- 수정: `sqlite3 ... ".backup"` 또는 `VACUUM INTO` 사용(C-4 절차 참조).
- 합격 기준: 백업본을 별도 디렉터리에서 기동해 후보 집계가 원본과 일치함을 분기마다 확인.

**47. macOS LibreSSL 경고 — 별도 Python/OpenSSL 런타임 고정 필요성**
- 상태: **필요합니다.** 경고 자체보다 **C-1의 `is_global` IPv4-mapped 미언랩이 Python 3.9 고유 문제**라는 점이 실질적 이유입니다. 현재 `/Library/Developer/CommandLineTools/.../Python3.framework/Versions/3.9`로 실행 중입니다(`runtime_status.txt`).
- 수정: OpenSSL 기반 Python 3.12+ 런타임을 고정하고 venv를 그 위에 재구성.
- 합격 기준: `ssl.OPENSSL_VERSION`이 OpenSSL, `ipaddress.ip_address('::ffff:127.0.0.1').is_global is False`, 기존 143건 테스트 전부 통과.

**48. n8n 내부 Python runner 경고·deprecated 설정의 실제 영향**
- 상태: 이 워크플로는 노드 3개가 scheduleTrigger + httpRequest + **JavaScript** Code 노드입니다(런타임 export 확인). Python runner를 사용하지 않으므로 **해당 경고의 직접 영향은 없습니다.**
- 실제 영향이 있는 것은 C-4의 상태 맵 불일치이며, 이는 deprecated 설정과 무관한 논리 결함입니다.
- 합격 기준: 상태 맵 수정 후 수동 1회 실행에서 예외 없이 완료.

### 반드시 제안받을 최종 계획

**49. 지금 먼저 멈추거나 잠가야 할 기능**
1. **`image_source`(이미지 원본 다운로드)** — C-1. 즉시 잠글 것. 현재 유일하게 활성이면서 외부로 요청을 내보내는 무인증 경로입니다.
2. **실등록 관련 전부** — 이미 `live_enabled=false`. **유지하십시오.**
3. **n8n 스케줄** — 이미 정지. C-4와 H-8 수정 전까지 유지.
4. `retry-writeback` — H-1로 인해 의미 없는 재시도이므로 UI에서 비활성.

**50. 코드 수정 전 보존할 snapshot 목록**
- DB: 운영 SQLite를 `.backup`으로(WAL 포함 일관 스냅샷). 18012용 복사본도 별도.
- `bridge_data/`: `approvals/`, `approvals/*.consumed.json`, `runs/`(dry-run·review 보고서), `image_sources/`, `image_backups/`, `content_worker.lock` 제외.
- 소스: 현재 작업 트리 전체를 tar (커밋되지 않은 변경 포함 — `git stash`나 `checkout` 금지).
- n8n: 워크플로 export(현재 런타임본), 자격증명 참조 ID 목록, 컨테이너 볼륨.
- 설정: `.env` 원본(패키지 제외분), Keychain 항목 목록(값 제외), launchd plist.
- 이 감사 보고서와 패키지 ZIP 자체.

**51. 격리 18012 재구성 순서** → C-4 절 참조.

**52. 10건 재검증 / 20건 품질 표본 / 100건 재시작·중복 dry-run의 데이터와 합격 기준**

| 항목 | 데이터 | 합격 기준 |
|---|---|---|
| 10건 실제 콘텐츠 재검증 | TLS 해결 후, 현재 `CONTENT_ERROR` 519건 중 오류 사유가 TLS인 것에서 무작위 10건(시드 고정) | 10/10 생성 성공, 결정적 검증 이슈 0, `content_verification_route`가 AUTO_APPROVE 또는 HUMAN_REVIEW로 명확히 갈림. AUTO_REVISE 발생 시 정확히 1회에서 멈춤 |
| 20건 품질 표본 | 24번의 층화 추출 절차 | CRITICAL 오인 0, 근거 미지지 0, 판정자 초기 불일치율 ≤ 10% |
| 100건 재시작/중복 dry-run | 격리 DB에서 승인 후보 100건, `dry_run: true`로 반복 호출 + 무작위 시점에 프로세스 kill 20회 | DB 상태 변화 0(dry-run은 무변경), 재시작 후 `STARTED` operation 0행, 중복 `CONTENT_PACKAGE_PREPARED` 이벤트 0, 동일 `request_id` 재사용 시 replay 아닌 거부 |

**53. 단계별 개방 순서와 승인 게이트**

```
1. 콘텐츠 자동화   ← 게이트: TLS 해결 + C-4 수정 + H-8 브레이커 + 10건 재검증 합격
2. 이미지 자동화   ← 게이트: C-1 수정 + M-7 권리 이력 + 30번 자동 탐지 + 100건 표본 오매칭 0
3. eBay sandbox   ← 게이트: C-2 구현(선행 필수) + C-3 인증 + H-2 마켓 매핑
4. 실등록 1건     ← 게이트: 3단계 성공 + M-6 승인 범위 축소 + 10번 복구 명령 + 관리자 대면 승인
5. Excel writeback ← 게이트: H-1 구현 + 33·34·35번 테스트 합격
6. 전체 무인 운영  ← 게이트: 42~46번 관측성·백업 drill 전부 + 1~5단계 30일 무사고
```
각 게이트는 **이전 단계를 되돌릴 수 있는 상태에서만** 통과시키십시오.

**54. 단계별 즉시 rollback 지점**

| 단계 | 롤백 방법 | 소요 |
|---|---|---|
| 콘텐츠 자동화 | n8n 워크플로 비활성화 | 즉시, DB 무변경 |
| 이미지 자동화 | `image_source` 라우트 잠금(410 반환) + `image_backups/`에서 파일 복원 | 분 단위 |
| sandbox | `ebay_environment` 설정만 되돌림 | 즉시 |
| 실등록 1건 | `JJS_EBAY_LIVE_ENABLED` 해제 + 재시작. **이미 등록된 리스팅은 eBay에서 수동 종료 필요** | 등록분은 되돌릴 수 없음 — 그래서 1건 |
| Excel writeback | writeback 비활성 + 시트를 스냅샷에서 복원 | 시트 백업 필수 |
| 전체 자동화 | 위 전부 역순 | — |

**55. 운영 가능 판정에 반드시 남아야 하는 증거 파일·감사 로그**
1. 각 단계 게이트 통과 시점의 **DB 스냅샷**과 그 sha256.
2. `bridge_data/runs/{batch}_review.json`, `{batch}_dry_run.json` — 승인 근거.
3. `bridge_data/approvals/*.consumed.json` — 실등록 승인 소비 기록(현재 삭제되지 않고 보존되는 구조. **유지하십시오**).
4. `candidate_events` 전체 export — **batch CASCADE로 삭제되므로 배치 삭제 전 반드시 export**(M-8).
5. `operations` 전체 export — idempotency_key·owner_token·attempt_count 포함.
6. JJS `ebay_listing_results` — 등록의 최종 원장.
7. 근거 원장(17번 수정 후): 검증 시점의 근거 URL별 본문 sha256과 취득 시각.
8. 권리 승인 원장(29번 수정 후): 승인자·시각·license·근거.
9. 사용된 n8n 워크플로 export와 그 sha256 (배포 시점별).
10. 20건 품질 표본의 사람 판정 원본(스크린샷 포함).
11. 각 배포의 소스 tar와 `git rev-parse HEAD` + `git status` 출력.
12. 복구 drill 실행 기록(46번).

> 4번과 7·8번은 현재 구조에서 **소실 가능**합니다. 실등록을 열기 전에 append-only 보관으로 바꾸는 것을 강하게 권합니다.

---

## 감사 범위의 한계 (확인 불가 항목)

- 8010 프로세스의 메모리 상 코드 (B-1 — 제시한 지문 대조법으로 확인 필요)
- 배치별 `blocked_count` 실제 값 (패키지에 배치별 수치 없음 — D-4의 SQL로 확인)
- 성공 9건의 실제 `content_duration_seconds` (패키지에 결과 원문 제외됨)
- `scripts/backup_daily.sh`의 대상 DB와 백업 방식 (파일은 있으나 내용 미확인 — 46번)
- 복구 drill 수행 이력
- Excel 시트의 실제 컬럼 구조 (OneDrive 파일 제외됨)
- 이미지 매칭 1,098건의 실제 정확도 (이미지 제외됨)
