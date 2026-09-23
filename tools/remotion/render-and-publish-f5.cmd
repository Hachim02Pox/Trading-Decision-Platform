@echo off
rem Renders F5 in 4 video chunks (fresh browser each: a single 22k-frame run crashed Chrome twice
rem around frame 11 500 from memory build-up), renders the audio once, stitches everything with
rem ffmpeg, then compresses and publishes to apps/frontend/public/videos.
rem Runs detached so it survives a VS Code / Claude Code restart. --port avoids the Next dev server on :3000.
setlocal
set ROOT=C:\Users\hachi\Downloads\jarvis-starter-kit\livrable\terminal\trading-decision-platform
set FF=%ROOT%\tools\remotion\f5\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe
set SITE=%ROOT%\apps\frontend\public\videos
set LOG=%ROOT%\tools\remotion\render-pipeline.log

echo [%date% %time%] START F5 chunked render >> "%LOG%"
cd /d "%ROOT%\tools\remotion\f5"
if exist out\chunks rmdir /s /q out\chunks
mkdir out\chunks
if exist out\f5-emploi-croissance.mp4 del out\f5-emploi-croissance.mp4
type nul > out\render.log

call :chunk 1 0-5699
call :chunk 2 5700-11399
call :chunk 3 11400-17099
call :chunk 4 17100-22628
for %%i in (1 2 3 4) do if not exist out\chunks\part%%i.mp4 (
  echo [%date% %time%] F5 CHUNK %%i FAILED - see f5\out\render.log >> "%LOG%"
  goto end
)
echo [%date% %time%] F5 video chunks OK >> "%LOG%"

call npx remotion render src/index.ts F5Video out/chunks/audio.wav --codec=wav --port=3190 >> out\render.log 2>&1
if not exist out\chunks\audio.wav (
  echo [%date% %time%] F5 AUDIO FAILED - see f5\out\render.log >> "%LOG%"
  goto end
)

(for %%i in (1 2 3 4) do @echo file 'part%%i.mp4') > out\chunks\list.txt
"%FF%" -v error -y -f concat -safe 0 -i out\chunks\list.txt -i out\chunks\audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out\f5-emploi-croissance.mp4 >> "%LOG%" 2>&1
if not exist out\f5-emploi-croissance.mp4 (
  echo [%date% %time%] F5 STITCH FAILED >> "%LOG%"
  goto end
)
"%FF%" -v error -y -i out\f5-emploi-croissance.mp4 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k -movflags +faststart "%SITE%\f5-emploi-croissance.mp4" >> "%LOG%" 2>&1
"%FF%" -v error -y -ss 5 -i out\f5-emploi-croissance.mp4 -frames:v 1 -q:v 3 "%SITE%\f5-emploi-croissance-poster.jpg" >> "%LOG%" 2>&1
echo [%date% %time%] F5 PUBLISHED >> "%LOG%"
goto end

:chunk
echo [%date% %time%] F5 chunk %1 frames %2 >> "%LOG%"
call npx remotion render src/index.ts F5Video out/chunks/part%1.mp4 --frames=%2 --codec h264 --crf 17 --concurrency=6 --muted --port=3190 >> out\render.log 2>&1
exit /b 0

:end
echo [%date% %time%] DONE F5 >> "%LOG%"
endlocal
