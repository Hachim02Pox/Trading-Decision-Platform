@echo off
rem Renders F4, compresses it for the web and publishes it to apps/frontend/public/videos.
rem Runs detached so it survives a Claude Code session restart.
set ROOT=C:\Users\hachi\Downloads\jarvis-starter-kit\livrable\terminal\trading-decision-platform
set FF=%ROOT%\tools\remotion\f2\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe
set SITE=%ROOT%\apps\frontend\public\videos
set LOG=%ROOT%\tools\remotion\render-pipeline.log

echo [%date% %time%] START F4 render >> "%LOG%"
cd /d "%ROOT%\tools\remotion\f4"
if exist out\f4-inflation.mp4 del out\f4-inflation.mp4
call npx remotion render src/index.ts F4Video out/f4-inflation.mp4 --codec h264 --crf 17 --concurrency=6 > out\render.log 2>&1
if not exist out\f4-inflation.mp4 (
  echo [%date% %time%] F4 RENDER FAILED - see f4\out\render.log >> "%LOG%"
  goto end
)
"%FF%" -v error -y -i out\f4-inflation.mp4 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k -movflags +faststart "%SITE%\f4-inflation.mp4" >> "%LOG%" 2>&1
"%FF%" -v error -y -ss 5 -i out\f4-inflation.mp4 -frames:v 1 -q:v 3 "%SITE%\f4-inflation-poster.jpg" >> "%LOG%" 2>&1
echo [%date% %time%] F4 PUBLISHED >> "%LOG%"

:end
echo [%date% %time%] DONE F4 >> "%LOG%"
