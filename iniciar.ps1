Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          LEGENDAS ANIMADAS STUDIO - PRO VERSION" -ForegroundColor Yellow
Write-Host "    Edicao e Renderizacao de Legendas Animadas (Estilo CapCut)" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[*] Iniciando Servidor e Abrindo Navegador..." -ForegroundColor Green

Start-Process -FilePath "cmd.exe" -ArgumentList "/c timeout /t 2 /nobreak >nul & start http://localhost:5173" -WindowStyle Hidden

npm run dev
