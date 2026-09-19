# BIO PALLET CRM — Windows Server deploy skripti
# Bu skript GitHub Actions tomonidan serverga yuklab, SSH orqali ishga tushiriladi.
$ErrorActionPreference = "Stop"

$AppDir = "C:\apps\bio-pallet"
$ZipPath = "C:\deploy\bio-pallet.zip"
$TaskName = "BioPalletApp"
$Port = 3000

function Resolve-Cmd($name, $hint) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "$name topilmadi. $hint"
    }
    return $cmd.Source
}

$npmCmd = Resolve-Cmd "npm.cmd" "Node.js (LTS) ni https://nodejs.org dan o'rnating va serverni qayta ishga tushiring."
$npxCmd = Resolve-Cmd "npx.cmd" "Node.js (LTS) ni https://nodejs.org dan o'rnating."

Write-Host "== Eski jarayonni to'xtatish =="
schtasks /End /TN $TaskName 2>$null | Out-Null
Start-Sleep -Seconds 2

if (-not (Test-Path $AppDir)) {
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
}

Write-Host "== Fayllarni yoyish =="
Expand-Archive -Path $ZipPath -DestinationPath $AppDir -Force

Set-Location $AppDir

if (-not (Test-Path ".env")) {
    Write-Host "== .env yaratilmoqda =="
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $jwt = [Convert]::ToBase64String($bytes)
    $envContent = "DATABASE_URL=`"file:./prisma/dev.db`"`nJWT_SECRET=`"$jwt`"`n"
    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
}

Write-Host "== Paketlar o'rnatilmoqda (npm ci) =="
& $npmCmd ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci muvaffaqiyatsiz tugadi (kod $LASTEXITCODE)" }

Write-Host "== Baza migratsiyasi =="
& $npxCmd prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "prisma migrate deploy muvaffaqiyatsiz tugadi (kod $LASTEXITCODE)" }

Write-Host "== Boshlang'ich ma'lumotlar (seed) =="
& $npmCmd run seed
if ($LASTEXITCODE -ne 0) { throw "seed muvaffaqiyatsiz tugadi (kod $LASTEXITCODE)" }

Write-Host "== Build qilinmoqda =="
& $npmCmd run build
if ($LASTEXITCODE -ne 0) { throw "build muvaffaqiyatsiz tugadi (kod $LASTEXITCODE)" }

Write-Host "== Firewall qoidasi =="
if (-not (Get-NetFirewallRule -DisplayName "BioPalletApp$Port" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "BioPalletApp$Port" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
}

Write-Host "== Scheduled Task sozlash =="
$action = "cmd.exe /c cd /d `"$AppDir`" && `"$npmCmd`" run start"
$existing = schtasks /Query /TN $TaskName 2>$null
if (-not $existing) {
    schtasks /Create /TN $TaskName /TR $action /SC ONSTART /RU SYSTEM /RL HIGHEST /F | Out-Null
} else {
    schtasks /Change /TN $TaskName /TR $action | Out-Null
}

Write-Host "== Ilovani ishga tushirish =="
schtasks /Run /TN $TaskName | Out-Null
Start-Sleep -Seconds 5

Write-Host "== Deploy yakunlandi =="
Write-Host "Sayt http://<server-ip>:$Port manzilida ochiladi"
