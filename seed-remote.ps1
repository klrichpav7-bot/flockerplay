# Push schema + seed FlockerPlay demo data to a remote DB (Neon / Render Postgres)
# Usage:
#   .\seed-remote.ps1 -DatabaseUrl "postgresql://user:pass@host/db?sslmode=require"
param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"
$env:DATABASE_URL = $DatabaseUrl

Write-Host "==> prisma db push (create tables)..."
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> prisma db seed (admin, buyer, sellers, products)..."
npx prisma db seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "DONE. DB is seeded. Your local .env was not touched."