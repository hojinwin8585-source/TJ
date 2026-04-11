@echo off
chcp 65001 >nul
title Telegram Bot - FINAL MONEY DIGGER

:: =====================================================
:: 텔레그램 봇 자동 시작 스크립트
:: 봇 폴더: D:\발구지\FINAL MONEY DIGGER
:: =====================================================

set BOT_DIR=D:\발구지\FINAL MONEY DIGGER

:: 봇 폴더 이동
cd /d "%BOT_DIR%"
if errorlevel 1 (
    echo [오류] 봇 폴더를 찾을 수 없습니다: %BOT_DIR%
    pause
    exit /b 1
)

:: Python 경로 설정 (venv 우선, 없으면 시스템 Python)
set PYTHON_EXE=python
if exist "%BOT_DIR%\venv\Scripts\python.exe" (
    set PYTHON_EXE=%BOT_DIR%\venv\Scripts\python.exe
    echo [정보] 가상환경 Python 사용: %PYTHON_EXE%
) else if exist "%BOT_DIR%\.venv\Scripts\python.exe" (
    set PYTHON_EXE=%BOT_DIR%\.venv\Scripts\python.exe
    echo [정보] 가상환경 Python 사용: %PYTHON_EXE%
) else (
    echo [정보] 시스템 Python 사용
)

:: 메인 봇 파일 탐색 (bot.py -> main.py -> app.py 순서)
set BOT_FILE=
if exist "%BOT_DIR%\bot.py" (
    set BOT_FILE=bot.py
) else if exist "%BOT_DIR%\main.py" (
    set BOT_FILE=main.py
) else if exist "%BOT_DIR%\app.py" (
    set BOT_FILE=app.py
)

if "%BOT_FILE%"=="" (
    echo [오류] bot.py / main.py / app.py 를 찾을 수 없습니다.
    pause
    exit /b 1
)

echo [시작] %BOT_FILE% 실행 중...
echo 시작 시간: %date% %time%
echo =====================================================

:: 봇 실행 (오류 시 5초 후 재시작)
:RUN_BOT
"%PYTHON_EXE%" "%BOT_DIR%\%BOT_FILE%"
echo.
echo [경고] 봇이 종료됨. 5초 후 재시작합니다...
timeout /t 5 /nobreak >nul
goto RUN_BOT
