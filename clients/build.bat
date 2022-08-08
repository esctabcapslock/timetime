echo 122
xcopy ".\src\asset\" ".\dist\asset\" /y
tsc

npm run start
