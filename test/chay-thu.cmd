@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Giang duong Hoa hoc - ban thu tai may

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Chua co Node.js tren may. Tai tai https://nodejs.org  roi chay lai file nay.
  echo.
  pause
  exit /b 1
)

echo.
echo   Dang dung hai ban thu (trang hoc + quan tri) ...
node ra-soat.js
if errorlevel 1 echo   (co canh bao o tren, van chay tiep)
node tao-phieu-thu.js
node tao-ban-thu.js
if errorlevel 1 goto :loi
node tao-ban-thu-qt.js
if errorlevel 1 goto :loi
goto :chay
:loi
echo.
echo   Dung ban thu that bai. Chup man hinh nay gui lai.
echo.
pause
exit /b 1
:chay

node may-chu.js
pause
