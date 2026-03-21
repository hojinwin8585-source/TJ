# TJ - n8n 자동화

n8n 워크플로우 자동화 프로젝트입니다.

## 시작하기

### 1. 환경 설정

```bash
cp .env.example .env
```

### 2. n8n 실행

```bash
docker-compose up -d
```

### 3. 접속

브라우저에서 `http://localhost:5678` 접속

## 워크플로우

`workflows/` 폴더에 워크플로우 JSON 파일을 저장합니다.

## 종료

```bash
docker-compose down
```
