@echo off
title Khoi dong He thong Canh bao Xoi mon Dat
echo ======================================================================
echo   KHOI DONG HE THONG GIAM SAT & CANH BAO XOI MON DAT TREN DIA HINH DOC
echo ======================================================================
echo.

:: 1. Chuyen huong vao thu muc chua file .bat nay
cd /d "%~dp0"

:: 2. Khoi dong local server (http-server) o cua so moi de chay Web Serial API
echo [BUOC 1] Dang khoi dong Local Web Server tai cong 8080...
start "Web Server - Canh bao Xoi mon" cmd /k "npm run dev"
echo.

:: 3. Cho 2 giay de HTTP server kip khoi dong hoan toan
echo [BUOC 2] Dang cho he thong khoi dong trong 2 giay...
timeout /t 2 >nul
echo.

:: 4. Mo trinh duyet mac dinh o dia chi localhost:8080
echo [BUOC 3] Dang mo giao dien giam sat tren trinh duyet...
echo (Luu y: Trinh duyet phai la Google Chrome hoac Microsoft Edge)
start http://localhost:8080
echo.

echo ======================================================================
echo KHOI DONG HOAN TAT!
echo Cua so nay se tu dong dong sau 3 giay.
echo ======================================================================
timeout /t 3 >nul
exit
