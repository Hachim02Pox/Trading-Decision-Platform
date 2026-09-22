@echo off
rem Renders F3 then re-renders F2 (factual fixes), compresses both for the web and publishes them
rem to apps/frontend/public/videos. Runs detached so it survives a Claude Code session restart.
set ROOT=C:\Users\hachi\Downloads\jarvis-starter-kit\livrable\terminal\trading-decision-platform
set FF=%ROOT%\tools\remotion\f2\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe
set SITE=%ROOT%\apps\frontend\public\videos
set LOG=%ROOT%\tools\remotion\render-pipeline.log

echo [%date% %time%] START F3 render > "%LOG%"
cd /d "%ROOT%\tools\remotion\f3"
call npx remotion render src/index.ts F3Video out/f3-fed-anticipations.mp4 --codec h264 --crf 17 --concurrency=6 > out\render.log 2>&1
if errorlevel 1 (
  echo [%date% %time%] F3 RENDER FAILED - see f3\out\render.log >> "%LOG%"
  goto f2
)
"%FF%" -v error -y -i out\f3-fed-anticipations.mp4 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k -movflags +faststart "%SITE%\f3-fed-anticipations.mp4" >> "%LOG%" 2>&1
"%FF%" -v error -y -ss 20 -i out\f3-fed-anticipations.mp4 -frames:v 1 -q:v 3 "%SITE%\f3-fed-anticipations-poster.jpg" >> "%LOG%" 2>&1
echo [%date% %time%] F3 PUBLISHED >> "%LOG%"

:f2
echo [%date% %time%] START F2 fix render >> "%LOG%"
cd /d "%ROOT%\tools\remotion\f2"
call npx remotion render src/index.ts F2Video out/f2-taux-reels-fixed.mp4 --codec h264 --crf 17 --concurrency=6 > out\render-fixed.log 2>&1
if errorlevel 1 (
  echo [%date% %time%] F2 RENDER FAILED - see f2\out\render-fixed.log >> "%LOG%"
  goto end
)
"%FF%" -v error -y -i out\f2-taux-reels-fixed.mp4 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k -movflags +faststart "%SITE%\f2-taux-reels.mp4" >> "%LOG%" 2>&1
echo [%date% %time%] F2 FIXED PUBLISHED >> "%LOG%"

:end
echo [%date% %time%] DONE >> "%LOG%"
