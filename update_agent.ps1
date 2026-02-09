$repoPath = "C:\Users\Jorge\Documents\projects\ai-agent-ide-context-sync"
Set-Location $repoPath

try {
    Write-Host "Checking for updates..."
    git fetch origin main
    $localHash = git rev-parse HEAD
    $remoteHash = git rev-parse origin/main

    if ($localHash -ne $remoteHash) {
        Write-Host "Updates found. Pulling..."
        git pull origin main
        Write-Host "Reinstalling globally..."
        npm install -g .\packages\cli
        Write-Host "Update complete."
    } else {
        Write-Host "No updates found. Already up to date."
    }
} catch {
    Write-Error "An error occurred during update: $_"
}
