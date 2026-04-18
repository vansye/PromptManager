$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "dist")) {
    Write-Host "dist folder not found. Run npm run build first."
    exit 1
}

$manifestRaw = Get-Content "public/manifest.json" -Raw -Encoding UTF8
$versionMatch = [regex]::Match($manifestRaw, '"version"\s*:\s*"([^"]+)"')
if (-not $versionMatch.Success) {
    Write-Host "Cannot parse version from public/manifest.json"
    exit 1
}
$version = $versionMatch.Groups[1].Value

$releaseDir = Join-Path $root "release"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

$zipName = "PromptManager-v$version-edge.zip"
$zipPath = Join-Path $releaseDir $zipName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path "dist/*" -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Package created: $zipPath"
