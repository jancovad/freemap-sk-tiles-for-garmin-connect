[CmdletBinding()]
param(
  [string]$ProjectRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
  $scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
  $ProjectRoot = Split-Path -Parent $scriptDirectory
}

function Assert-Condition {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw "Release validation failed: $Message"
  }
}

$projectRootPath = [IO.Path]::GetFullPath($ProjectRoot)
$manifestPath = Join-Path $projectRootPath "manifest.json"
Assert-Condition (Test-Path -LiteralPath $manifestPath -PathType Leaf) "manifest.json is missing"

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
Assert-Condition ($manifest.manifest_version -eq 3) "manifest_version must be 3"
Assert-Condition ($manifest.version -match '^\d+\.\d+\.\d+$') "manifest version is invalid"

$permissions = @($manifest.permissions)
Assert-Condition (
  $permissions.Count -eq 1 -and $permissions[0] -eq "storage"
) "only the storage permission is allowed"

$hostPermissions = @()
if ($manifest.PSObject.Properties.Name -contains "host_permissions") {
  $hostPermissions = @($manifest.host_permissions)
}
Assert-Condition ($hostPermissions.Count -eq 0) "host_permissions must stay empty"

foreach ($contentScript in @($manifest.content_scripts)) {
  $matches = @($contentScript.matches)
  Assert-Condition (
    $matches.Count -eq 1 -and $matches[0] -eq "https://connect.garmin.com/*"
  ) "content scripts must only match Garmin Connect"
}

$releaseFiles = @(
  "manifest.json"
  "src/tile-url.js"
  "src/page-main.js"
  "src/ui.js"
  "src/content.css"
  "assets/icon16.png"
  "assets/icon32.png"
  "assets/icon48.png"
  "assets/icon128.png"
)

$declaredFiles = @()
foreach ($contentScript in @($manifest.content_scripts)) {
  $declaredFiles += @($contentScript.js)
  if ($contentScript.PSObject.Properties.Name -contains "css") {
    $declaredFiles += @($contentScript.css)
  }
}
$declaredFiles += @(
  $manifest.icons.PSObject.Properties | ForEach-Object { [string]$_.Value }
)

foreach ($declaredFile in $declaredFiles) {
  Assert-Condition (-not ($declaredFile -match '^(?:https?:)?//')) "remote executable assets are forbidden"
  Assert-Condition ($releaseFiles -contains $declaredFile) "manifest asset is not in the release allowlist: $declaredFile"
}

foreach ($relativePath in $releaseFiles) {
  $sourcePath = [IO.Path]::GetFullPath((Join-Path $projectRootPath $relativePath))
  Assert-Condition (
    $sourcePath.StartsWith($projectRootPath + [IO.Path]::DirectorySeparatorChar)
  ) "release path escapes the project root: $relativePath"
  Assert-Condition (Test-Path -LiteralPath $sourcePath -PathType Leaf) "missing release file: $relativePath"
}

$distPath = Join-Path $projectRootPath "dist"
[IO.Directory]::CreateDirectory($distPath) | Out-Null
$archiveName = "freemap-sk-tiles-for-garmin-connect-v$($manifest.version).zip"
$archivePath = Join-Path $distPath $archiveName
$checksumPath = "$archivePath.sha256"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archiveStream = [IO.File]::Open(
  $archivePath,
  [IO.FileMode]::Create,
  [IO.FileAccess]::Write,
  [IO.FileShare]::None
)
try {
  $archive = [IO.Compression.ZipArchive]::new(
    $archiveStream,
    [IO.Compression.ZipArchiveMode]::Create,
    $false
  )
  try {
    foreach ($relativePath in ($releaseFiles | Sort-Object)) {
      $entryName = $relativePath.Replace('\', '/')
      $entry = $archive.CreateEntry(
        $entryName,
        [IO.Compression.CompressionLevel]::Optimal
      )
      $entry.LastWriteTime = [DateTimeOffset]::new(
        2000, 1, 1, 0, 0, 0, [TimeSpan]::Zero
      )
      $sourceStream = [IO.File]::OpenRead((Join-Path $projectRootPath $relativePath))
      try {
        $entryStream = $entry.Open()
        try {
          $sourceStream.CopyTo($entryStream)
        } finally {
          $entryStream.Dispose()
        }
      } finally {
        $sourceStream.Dispose()
      }
    }
  } finally {
    $archive.Dispose()
  }
} finally {
  $archiveStream.Dispose()
}

$readStream = [IO.File]::OpenRead($archivePath)
try {
  $readArchive = [IO.Compression.ZipArchive]::new(
    $readStream,
    [IO.Compression.ZipArchiveMode]::Read,
    $false
  )
  try {
    $actualEntries = @($readArchive.Entries | ForEach-Object { $_.FullName } | Sort-Object)
    $expectedEntries = @($releaseFiles | ForEach-Object { $_.Replace('\', '/') } | Sort-Object)
    Assert-Condition (
      [string]::Join('|', $actualEntries) -eq [string]::Join('|', $expectedEntries)
    ) "archive content differs from the release allowlist"
  } finally {
    $readArchive.Dispose()
  }
} finally {
  $readStream.Dispose()
}

$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
$utf8WithoutBom = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText(
  $checksumPath,
  "$hash  $archiveName$([Environment]::NewLine)",
  $utf8WithoutBom
)

[PSCustomObject]@{
  Version = $manifest.version
  Archive = $archivePath
  Sha256 = $hash
  Files = $releaseFiles.Count
}
