@echo off
cd /d "E:\AI Suno gen"
echo.
echo [Suno Studio] Pushing update...
git add .
git commit -m "Update %date% %time%"
git push
echo.
echo Done! Site will be live in ~30 seconds.
echo.
pause
