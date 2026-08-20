@echo off
title LEGENDAS ANIMADAS STUDIO PRO
color 0B
cls

echo ================================================================
echo           LEGENDAS ANIMADAS STUDIO - PRO VERSION
echo     Edicao e Renderizacao de Legendas Animadas (Estilo CapCut)
echo ================================================================
echo.
echo [1/3] Iniciando o Servidor Backend (Node.js + FFmpeg)...
echo [2/3] Iniciando o Frontend (React + Vite + Canvas)...
echo [3/3] Abrindo o Navegador em http://localhost:5173 ...
echo.

:: Open the browser in parallel after a 2-second pause
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"

:: Run the fullstack development servers concurrently
npm run dev

pause
