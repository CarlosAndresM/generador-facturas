@echo off
cd /d "%~dp0"

rem Verifica si ya hay una instancia del servidor en ejecución
tasklist | find "node.exe" > nul
if %ERRORLEVEL% equ 0 (
    echo El servidor ya está en ejecución. Cierre la ventana anterior para iniciar uno nuevo.
    exit /b
)

rem Inicia el servidor directamente con node server/server.js y guarda el PID
start "Servidor" cmd /c "node server/server.js"
set "NODE_PID=%!"

rem Detectar navegadores instalados
set chromePath=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
set firefoxPath=C:\Program Files\Mozilla Firefox\firefox.exe
set edgePath=%windir%\SystemApps\Microsoft.MicrosoftEdge_8wekyb3d8bbwe\MicrosoftEdge.exe
set operaPath=C:\Program Files\Opera\launcher.exe
set bravePath=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

echo Detectando navegadores instalados...

set navegadores=""
if exist "%chromePath%" (
    echo 1. Google Chrome
    set navegadores=%navegadores%1
)
if exist "%firefoxPath%" (
    echo 2. Mozilla Firefox
    set navegadores=%navegadores%2
)
if exist "%edgePath%" (
    echo 3. Microsoft Edge
    set navegadores=%navegadores%3
)
if exist "%operaPath%" (
    echo 4. Opera
    set navegadores=%navegadores%4
)
if exist "%bravePath%" (
    echo 5. Brave
    set navegadores=%navegadores%5
)

if "%navegadores%"=="" (
    echo No se ha detectado ningún navegador compatible.
    exit /b
)

rem Menú para seleccionar el navegador disponible
set /p navegador="Ingrese el número del navegador que desea usar: "

rem Definir la URL
set URL=http://localhost:3000

rem Abrir la URL en el navegador seleccionado
if "%navegador%"=="1" (
    start "" "%chromePath%" %URL%
) else if "%navegador%"=="2" (
    start "" "%firefoxPath%" %URL%
) else if "%navegador%"=="3" (
    start "" "microsoft-edge:%URL%"
) else if "%navegador%"=="4" (
    start "" "%operaPath%" %URL%
) else if "%navegador%"=="5" (
    start "" "%bravePath%" %URL%
) else (
    echo Opción inválida. No se abrirá ningún navegador.
)

rem Espera a que se cierre la ventana de la terminal
:loop
timeout /t 1 > nul
tasklist | find "node.exe" > nul
if %ERRORLEVEL% neq 0 (
    echo El servidor ha terminado.
    exit /b
)
goto loop

rem Este bloque se usa para limpiar al salir
:cleanup
taskkill /PID %NODE_PID% /F
exit /b
