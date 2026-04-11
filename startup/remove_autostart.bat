@echo off
chcp 65001 >nul
:: =====================================================
:: 텔레그램 봇 자동 시작 해제
:: =====================================================

net session >nul 2>&1
if errorlevel 1 (
    echo [오류] 관리자 권한으로 실행해주세요.
    pause
    exit /b 1
)

set TASK_NAME=TelegramBot_FinalMoneyDigger

schtasks /delete /tn "%TASK_NAME%" /f
if errorlevel 1 (
    echo [경고] 등록된 작업을 찾을 수 없거나 이미 삭제됨
) else (
    echo [완료] 자동 시작 해제 완료: %TASK_NAME%
)
pause
