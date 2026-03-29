$SkipDbDeploy = $false
if ($args -contains "-SkipDbDeploy") {
  $SkipDbDeploy = $true
}

$ErrorActionPreference = "Stop"

$root = "D:\git\content-ops-platform"
Set-Location $root

function Ensure-NodeInPath {
  $nodeInPath = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeInPath) {
    return
  }

  $fallback = "C:\Users\lc\AppData\Local\ms-playwright-go\1.50.1"
  if (Test-Path (Join-Path $fallback "node.exe")) {
    $env:PATH = "$fallback;$env:PATH"
    return
  }

  throw "node.exe not found in PATH and fallback path is unavailable."
}

function Ensure-DatabaseReachable {
  $result = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
  if (-not $result.TcpTestSucceeded) {
    throw "PostgreSQL is not reachable on localhost:5432"
  }
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Write-Host $Name
  & powershell -NoProfile -Command $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name"
  }
}

Write-Host "[1/5] Ensuring Node runtime..."
Ensure-NodeInPath
node -v | Out-Host

Write-Host "[2/5] Checking PostgreSQL connectivity..."
Ensure-DatabaseReachable
Write-Host "PostgreSQL is reachable."

Write-Host "[3/5] Generating Prisma client..."
Invoke-Step -Name "Running db:generate..." -Command "pnpm.cmd --dir '$root' db:generate"

if (-not $SkipDbDeploy) {
  Write-Host "[4/5] Applying existing migrations (deploy mode)..."
  Invoke-Step -Name "Running db:deploy..." -Command "pnpm.cmd --dir '$root' db:deploy"
} else {
  Write-Host "[4/5] Skipped db:deploy by flag."
}

Write-Host "[5/5] Seeding base data..."
Invoke-Step -Name "Running db:seed..." -Command "pnpm.cmd --dir '$root' db:seed"

Write-Host "Starting API on http://127.0.0.1:3000 ..."
pnpm.cmd --dir $root dev:api
