$ErrorActionPreference = 'Stop'

$taskRepoRoot = Split-Path -Parent $PSScriptRoot
$taskLock = Get-Content -LiteralPath (Join-Path $taskRepoRoot 'package-lock.json') -Raw | ConvertFrom-Json -AsHashtable
$taskVersions = @('7.0.0', $taskLock['packages']['node_modules/prisma']['version']) | Select-Object -Unique
$taskTempParent = [System.IO.Path]::GetTempPath()
$taskTempRoot = Join-Path $taskTempParent ('prisma-markdown-peers-' + [guid]::NewGuid().ToString('N'))
$taskFailures = @()
New-Item -ItemType Directory -Path $taskTempRoot | Out-Null

try {
    Push-Location $taskRepoRoot
    try {
        $taskPackage = npm pack --pack-destination $taskTempRoot --json | ConvertFrom-Json
        if ($LASTEXITCODE -ne 0) { throw 'Packaging failed' }
    } finally {
        Pop-Location
    }
    $taskArchive = Join-Path $taskTempRoot $taskPackage.filename
    $taskExpected = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'links/links.md')).Replace("`r`n", "`n")
    $taskSchema = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'links/links.prisma')).Replace(
        'provider = "node ../../lib/executable/markdown"',
        'provider = "prisma-markdown"'
    )

    foreach ($taskVersion in $taskVersions) {
        try {
            Write-Output "Testing published package with Prisma $taskVersion and no Prisma Client"
            $taskConsumer = Join-Path $taskTempRoot $taskVersion
            New-Item -ItemType Directory -Path $taskConsumer | Out-Null
            [System.IO.File]::WriteAllText(
                (Join-Path $taskConsumer 'package.json'),
                '{"name":"prisma-markdown-peer-test","private":true}'
            )
            & npm install --prefix $taskConsumer --strict-peer-deps --no-audit --no-fund "prisma@$taskVersion" $taskArchive
            if ($LASTEXITCODE -ne 0) { throw 'Consumer installation failed' }
            if (Test-Path -LiteralPath (Join-Path $taskConsumer 'node_modules/@prisma/client')) {
                throw 'Prisma Client was unexpectedly installed'
            }
            [System.IO.File]::WriteAllText((Join-Path $taskConsumer 'links.prisma'), $taskSchema)
            Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'links/prisma.config.ts') -Destination $taskConsumer

            $taskOriginalPath = $env:PATH
            Push-Location $taskConsumer
            try {
                $env:PATH = (Join-Path $taskConsumer 'node_modules/.bin') + [System.IO.Path]::PathSeparator + $taskOriginalPath
                & node (Join-Path $taskConsumer 'node_modules/prisma/build/index.js') generate
                if ($LASTEXITCODE -ne 0) { throw 'Consumer generation failed' }
            } finally {
                $env:PATH = $taskOriginalPath
                Pop-Location
            }
            $taskActual = [System.IO.File]::ReadAllText((Join-Path $taskConsumer 'links.md')).Replace("`r`n", "`n")
            if ($taskActual -ne $taskExpected) { throw 'Generated Markdown differs from the links fixture' }
            Write-Output "PASS: Prisma $taskVersion"
        } catch {
            $taskFailures += "Prisma ${taskVersion}: $($_.Exception.Message)"
            Write-Output $taskFailures[-1]
        }
    }
} finally {
    $taskResolvedRoot = [System.IO.Path]::GetFullPath($taskTempRoot)
    $taskResolvedParent = [System.IO.Path]::GetFullPath($taskTempParent)
    if (-not $taskResolvedParent.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $taskResolvedParent += [System.IO.Path]::DirectorySeparatorChar
    }
    if (-not $taskResolvedRoot.StartsWith($taskResolvedParent, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not ([System.IO.Path]::GetFileName($taskResolvedRoot).StartsWith('prisma-markdown-peers-'))) {
        throw 'Unexpected peer-test cleanup target'
    }
    if ($IsWindows) {
        Remove-Item -LiteralPath $taskResolvedRoot -Recurse
    } else {
        # Unix npm trees contain dotfiles that PowerShell treats as hidden.
        Remove-Item -LiteralPath $taskResolvedRoot -Recurse -Force
    }
}

if ($taskFailures.Count -gt 0) { throw ($taskFailures -join "`n") }
