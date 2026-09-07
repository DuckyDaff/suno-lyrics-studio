@echo off
cd /d "E:\AI Suno gen"
echo.
echo ============================================
echo  SUNO STUDIO - DEPLOY SETUP
echo ============================================
echo.

echo [1/3] Logging into GitHub...
"C:\Program Files\GitHub CLI\gh.exe" auth login --web --git-protocol https
if %errorlevel% neq 0 (
  echo ERROR: GitHub login failed
  pause
  exit /b 1
)

echo.
echo [2/3] Creating GitHub repository...
"C:\Program Files\GitHub CLI\gh.exe" repo create suno-lyrics-studio --public --source=. --remote=origin --push
if %errorlevel% neq 0 (
  echo ERROR: Could not create repo
  pause
  exit /b 1
)

echo.
echo [3/3] Deploying to Vercel...
call npx vercel --yes --prod
if %errorlevel% neq 0 (
  echo ERROR: Vercel deploy failed
  pause
  exit /b 1
)

echo.
echo ============================================
echo  SUCCESS! Your site is live!
echo  Future updates: just run update.bat
echo ============================================
pause
