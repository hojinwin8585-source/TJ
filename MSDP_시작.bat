@echo off
chcp 65001 > nul
title MSDP 자동화 런처

echo.
echo  ================================
echo   MSDP 자동화 시작 중...
echo  ================================
echo.

:: server.py 백그라운드 실행
echo  [1/2] 로컬 서버 시작...
start /min cmd /c "python %~dp0server.py"

:: 서버 뜰 때까지 잠깐 대기
timeout /t 2 /nobreak > nul

:: MSDP HTML 크롬으로 열기
echo  [2/2] MSDP 열기...
start chrome "%~dp0MSDP\MSDP_v4.html"

echo.
echo  완료! MSDP가 열립니다.
echo  (서버 창은 백그라운드에서 실행 중)
echo.
timeout /t 2 /nobreak > nul
