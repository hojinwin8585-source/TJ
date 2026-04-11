@echo off
chcp 65001 >nul
:: =====================================================
:: 텔레그램 봇 자동 시작 등록 (관리자 권한 필요)
:: 최초 1번만 실행하면 됩니다.
:: =====================================================

:: 관리자 권한 확인
net session >nul 2>&1
if errorlevel 1 (
    echo [오류] 이 스크립트는 관리자 권한으로 실행해야 합니다.
    echo 마우스 우클릭 후 "관리자 권한으로 실행"을 선택하세요.
    pause
    exit /b 1
)

set TASK_NAME=TelegramBot_FinalMoneyDigger
set SCRIPT_PATH=%~dp0start_bot.bat

echo [설정] 작업 스케줄러에 봇 자동 시작 등록 중...
echo 스크립트 경로: %SCRIPT_PATH%

:: 기존 작업 삭제 (있을 경우)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: 로그인 시 자동 실행 작업 등록 (숨김 창으로 실행)
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd /c start \"\" /min \"%SCRIPT_PATH%\"" ^
    /sc onlogon ^
    /rl highest ^
    /f

if errorlevel 1 (
    echo [오류] 작업 스케줄러 등록 실패
    pause
    exit /b 1
)

echo.
echo [완료] 자동 시작 등록 성공!
echo 작업 이름: %TASK_NAME%
echo 실행 조건: Windows 로그인 시 자동 시작
echo.
echo * 바로 실행하려면 start_bot.bat 을 더블클릭하세요.
echo * 자동 시작 해제하려면 remove_autostart.bat 을 실행하세요.
echo.
pause
