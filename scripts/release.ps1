$ErrorActionPreference = 'Stop'

Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $taskBranch = git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $taskBranch -ne 'master') {
        throw 'Release from master after merging the version update'
    }
    $taskStatus = git status --porcelain
    if ($LASTEXITCODE -ne 0 -or $taskStatus) {
        throw 'The release checkout must be clean'
    }
    git fetch origin master
    if ($LASTEXITCODE -ne 0) { throw 'Could not fetch origin/master' }
    $taskHead = git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the release commit' }
    $taskRemoteHead = git rev-parse origin/master
    if ($LASTEXITCODE -ne 0 -or $taskHead -ne $taskRemoteHead) {
        throw 'Synchronize master with origin/master before releasing'
    }
    $taskPackage = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    $taskLock = Get-Content -LiteralPath 'package-lock.json' -Raw | ConvertFrom-Json -AsHashtable
    if ($taskPackage.version -ne $taskLock['version'] -or
        $taskPackage.version -ne $taskLock['packages']['']['version']) {
        throw 'Package and lockfile versions must match'
    }
    $taskTag = 'v' + $taskPackage.version
    gh release create $taskTag --target $taskHead --title $taskTag --generate-notes
    if ($LASTEXITCODE -ne 0) { throw 'GitHub release creation failed' }
    Write-Output 'The release workflow will publish the package to npm with provenance.'
} finally {
    Pop-Location
}
