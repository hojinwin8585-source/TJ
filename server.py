#!/usr/bin/env python3
"""
MSDP 로컬 프록시 서버 (포트 8765)
- 셀러픽 API 요청을 CORS 없이 중계
- 이미지 URL → base64 변환 → 셀러픽 이미지 검색 자동화

실행 방법:
  1. 셀러픽 쿠키 설정:  SELLERPICK_COOKIE=<쿠키값> python server.py
  2. 또는 실행 후 MSDP에서 쿠키 저장 버튼 사용

필요 패키지: pip install requests
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json, base64, urllib.parse, os, sys

try:
    import requests
except ImportError:
    print("requests 패키지가 필요합니다: pip install requests")
    sys.exit(1)

SELLERPICK_BASE = 'https://www.sellerpick.co.kr/shopAdmin/'
SELLERPICK_COOKIE = os.environ.get('SELLERPICK_COOKIE', '')


class Handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/sellerpick/config':
            self._json({'set': bool(SELLERPICK_COOKIE), 'length': len(SELLERPICK_COOKIE)})
        else:
            self._json({'error': 'not found'}, 404)

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')

        if self.path == '/sellerpick/proxy':
            self._proxy(body)
        elif self.path == '/sellerpick/img-search':
            self._img_search(body)
        elif self.path == '/sellerpick/set-cookie':
            self._set_cookie(body)
        else:
            self._json({'error': 'not found'}, 404)

    # ── 셀러픽 소싱 프록시 ───────────────────────────────────
    def _proxy(self, body):
        url = SELLERPICK_BASE + '?menuType=prodStock&mode=json&act=excelPrdSourcing'
        try:
            r = requests.post(url, data=body, headers=self._sp_headers(), timeout=30)
            try:
                self._json(r.json())
            except Exception:
                self._json({'ok': r.ok, 'raw': r.text[:300]})
        except Exception as e:
            self._json({'error': str(e)}, 500)

    # ── 셀러픽 이미지 자동검색 ──────────────────────────────
    def _img_search(self, body):
        global SELLERPICK_COOKIE
        params = dict(urllib.parse.parse_qsl(body))
        image_url = params.get('imageUrl', '')
        count = int(params.get('count', 5))

        if not image_url:
            self._json({'error': 'imageUrl 파라미터 필요'}, 400)
            return

        # 1. 이미지 fetch → base64 변환
        try:
            img_resp = requests.get(image_url, timeout=15,
                                    headers={'User-Agent': 'Mozilla/5.0'})
            img_resp.raise_for_status()
            content_type = img_resp.headers.get('Content-Type', 'image/jpeg').split(';')[0]
            img_b64 = f'data:{content_type};base64,' + base64.b64encode(img_resp.content).decode()
        except Exception as e:
            self._json({'error': f'이미지 로드 실패: {e}'}, 500)
            return

        # 2. 셀러픽 이미지 검색 API 호출
        url = SELLERPICK_BASE + '?menuType=prodStock&mode=json&act=getListNewTaobao'
        payload = urllib.parse.urlencode({
            'menuType': 'prodStock',
            'mode': 'json',
            'act': 'getListNewTaobao',
            'image': img_b64,
            'type': 'imgSearch',
        })
        try:
            r = requests.post(url, data=payload, headers=self._sp_headers(), timeout=40)
            try:
                self._json(r.json())
            except Exception:
                self._json({'error': '셀러픽 응답 파싱 실패', 'raw': r.text[:300]}, 500)
        except Exception as e:
            self._json({'error': f'셀러픽 요청 실패: {e}'}, 500)

    # ── 쿠키 저장 ────────────────────────────────────────────
    def _set_cookie(self, body):
        global SELLERPICK_COOKIE
        params = dict(urllib.parse.parse_qsl(body))
        SELLERPICK_COOKIE = params.get('cookie', '')
        print(f'[쿠키 저장됨] {len(SELLERPICK_COOKIE)}자')
        self._json({'ok': True, 'length': len(SELLERPICK_COOKIE)})

    # ── 공통 헬퍼 ────────────────────────────────────────────
    def _sp_headers(self):
        return {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Cookie': f'sellerpick={SELLERPICK_COOKIE}',
            'Referer': 'https://www.sellerpick.co.kr/',
            'Origin': 'https://www.sellerpick.co.kr',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
        }

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f'[{self.address_string()}] {fmt % args}')


if __name__ == '__main__':
    print('=' * 50)
    print('MSDP 로컬 서버 시작: http://localhost:8765')
    print(f'셀러픽 쿠키: {"✅ 설정됨 " + str(len(SELLERPICK_COOKIE)) + "자" if SELLERPICK_COOKIE else "❌ 미설정 (MSDP에서 쿠키 저장 필요)"}')
    print('=' * 50)
    server = HTTPServer(('localhost', 8765), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n서버 종료')
