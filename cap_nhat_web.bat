@echo off
chcp 65001 >nul
echo ===================================================
echo   ĐANG TỰ ĐỘNG ĐỒNG BỘ & CẬP NHẬT LÊN WEB...
echo ===================================================

git add .
git commit -m "Auto update: %date% %time%"
git push origin main

echo.
echo ===================================================
echo   ✓ ĐÃ ĐẨY LÊN GITHUB THÀNH CÔNG!
echo   Web của bạn sẽ tự động cập nhật sau 10-15 giây.
echo ===================================================
pause
