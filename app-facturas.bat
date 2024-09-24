@echo off
cd /d "%~dp0"

rem Verifica si ya hay una instancia del servidor en ejecución
tasklist | find "node.exe" > nul
if %ERRORLEVEL% equ 0 (
    echo El servidor ya está en ejecución. Cierre la ventana anterior para iniciar uno nuevo.
    exit /b
)

rem Inicia el servidor en un nuevo proceso y guarda el PID
start "Servidor" cmd /c "npm start"

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
