$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$venvActivate = Join-Path $backendPath ".venv\Scripts\Activate.ps1"

if (-not (Test-Path $backendPath)) {
    throw "Backend directory not found: $backendPath"
}

if (-not (Test-Path $frontendPath)) {
    throw "Frontend directory not found: $frontendPath"
}

if (-not (Test-Path $venvActivate)) {
    throw "Backend virtual environment not found: $venvActivate"
}

$backendCommand = @"
Set-Location '$backendPath'
& '$venvActivate'
python manage.py migrate
python manage.py seed_store
python manage.py runserver
"@

$frontendCommand = @"
Set-Location '$frontendPath'
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null

Write-Host ""
Write-Host "Backend starting in a new window: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend starting in a new window: http://localhost:3000" -ForegroundColor Green
Write-Host "Admin: http://127.0.0.1:8000/admin" -ForegroundColor Cyan
Write-Host ""
