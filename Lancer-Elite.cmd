@echo off
title Elite Football Academy - Serveur
setlocal
set "NODE=%USERPROFILE%\nodejs-portable"
set "HERE=%~dp0"
if not exist "%NODE%\node.exe" ( echo [ERREUR] Node introuvable dans %NODE% & pause & exit /b 1 )
powershell -NoProfile -Command "try{$null=Invoke-WebRequest 'http://localhost:5600' -UseBasicParsing -TimeoutSec 2;exit 0}catch{exit 1}"
if %errorlevel%==0 ( start "" "http://localhost:5600" & exit /b 0 )
echo Demarrage du serveur Elite Football Academy...
start "Elite - Serveur" cmd /k "set PATH=%NODE%;%PATH% && cd /d "%HERE%" && node --no-warnings server.js"
:wait
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try{$null=Invoke-WebRequest 'http://localhost:5600' -UseBasicParsing -TimeoutSec 2;exit 0}catch{exit 1}"
if %errorlevel% neq 0 goto wait
start "" "http://localhost:5600"
exit /b 0
