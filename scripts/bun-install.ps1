# Bun install with explicit HTTP(S)_PROXY for polluted DNS / proxy mismatch.
# Run from repo root: bun run install:env
# Optional: copy doge-install.env.example -> doge-install.env

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root

function Import-DogeInstallEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Get-Content -LiteralPath $Path | ForEach-Object {
    $t = $_.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { return }
    $i = $t.IndexOf('=')
    if ($i -lt 1) { return }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim()
    [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
  }
}

function Test-LocalPortListen {
  param([int] $Port)
  try {
    $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $c
  } catch {
    return $false
  }
}

$envFile = Join-Path $Root 'doge-install.env'
$hadEnvFile = Test-Path -LiteralPath $envFile
Import-DogeInstallEnv -Path $envFile

# IDE / parent shells may inject HTTP_PROXY to an ephemeral port (not a real proxy).
# Without doge-install.env, drop inherited proxy unless TRUST_SYSTEM_PROXY=1.
if (-not $hadEnvFile -and $env:TRUST_SYSTEM_PROXY -ne '1') {
  Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
  Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
  Remove-Item Env:ALL_PROXY -ErrorAction SilentlyContinue
}

$autodetect = $true
if ($env:PROXY_AUTODETECT -eq '0') { $autodetect = $false }

$hasHttp = (-not [string]::IsNullOrWhiteSpace($env:HTTP_PROXY)) -or (-not [string]::IsNullOrWhiteSpace($env:HTTPS_PROXY))

if ((-not $hasHttp) -and $autodetect) {
  # Clash Verge 常见：混合 7898、HTTP(S) 7899；Clash 7890；部分 7897；V2RayN 等 10809
  $ports = @(7898, 7899, 7890, 7897, 10809)
  foreach ($p in $ports) {
    if (Test-LocalPortListen -Port $p) {
      $u = "http://127.0.0.1:$p"
      $env:HTTP_PROXY = $u
      $env:HTTPS_PROXY = $u
      Write-Host "bun-install: using HTTP_PROXY/HTTPS_PROXY=$u (port $p listening)"
      Write-Host "bun-install: if wrong, copy doge-install.env.example to doge-install.env"
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($env:NO_PROXY)) {
  $env:NO_PROXY = '127.0.0.1,localhost'
}

if ($env:BUN_INSTALL_PROBE_DNS -eq '1') {
  Write-Host '--- DNS probe registry.npmmirror.com via 223.5.5.5 ---'
  try {
    Resolve-DnsName -Name 'registry.npmmirror.com' -Server 223.5.5.5 -ErrorAction Stop |
      Select-Object -First 3 Name, Type, IPAddress |
      Format-Table -AutoSize
  } catch {
    Write-Host "Resolve-DnsName failed: $_"
  }
  Write-Host '---'
}

$bun = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bun) {
  Write-Error 'bun not found in PATH'
  exit 1
}

Write-Host "bun-install: running bun install (HTTP_PROXY=$($env:HTTP_PROXY))"
$bunArgs = @('install') + $args
& bun @bunArgs
exit $LASTEXITCODE
