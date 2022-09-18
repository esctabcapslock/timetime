echo 122
@REM xcopy ".\src\asset\" ".\dist\asset\" /y
xcopy ".\src\asset\chart.js" ".\dist\asset\chart.js" /y
xcopy ".\src\asset\index.html" ".\dist\asset\index.html" /y
xcopy ".\src\asset\main.js" ".\dist\asset\main.js" /y
xcopy ".\src\asset\preload.js" ".\dist\asset\preload.js" /y
xcopy ".\src\asset\timeline.js" ".\dist\asset\timeline.js" /y

tsc

npm run start
