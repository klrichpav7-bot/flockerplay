# Заливка схемы + демо-данных FlockerPlay на удалённую БД (Neon / Render Postgres)
# Использование:
#   .\seed-remote.ps1 -DatabaseUrl "postgresql://user:pass@host/db?sslmode=require"
param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$env:DATABASE_URL = $DatabaseUrl

Write-Host "==> db push (создание таблиц) на удалённую БД..."
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> seed (демо-данные: админ, покупатель, продавцы, товары)..."
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Готово! БД заполнена. Строка используется только в этой сессии, .env не тронут."