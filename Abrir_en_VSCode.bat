@echo off
cd /d "%~dp0"
where code >nul 2>nul
if %errorlevel%==0 (
  code "MatrizSolve.code-workspace"
) else (
  echo No se encontro "code". Abre VS Code y usa Archivo ^> Abrir area de trabajo desde archivo ^> MatrizSolve.code-workspace
  pause
)
