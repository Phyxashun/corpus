// TYPE     : .PS1
// PATH     : ALL_REBUILT/log-tests.ps1
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .PS1
// PATH     : log-tests.ps1
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-< START >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
# FILE-PATH: ./log-tests.ps1

# ---------------------------------------------------------------------------------------
# Configuration
$scriptFolder = if ($PSScriptRoot) { $PSScriptRoot } else { "." }

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$logDir = "$scriptFolder/logs"
$logFile = "${timestamp}_tests.results.log"
$logFilePath = "$logDir/$logfile"
$testsPath = "$scriptFolder/tests"

╭
─
╮
│
╰
╯
# ---------------------------------------------------------------------------------------
# Ensure the logs directory exists
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# ---------------------------------------------------------------------------------------
# LOOK AND COUNT (Before creating the new log)
$existingLogs = Get-ChildItem -Path $logDir -Filter "*_tests.results.log" | Sort-Object Name
$initialCount = $existingLogs.Count

Write-Host
Write-Host "Running tests and logging output to:" -ForegroundColor Cyan
Write-Host "╭──────────────────────────────────────────────╮"
Write-Host "│    $logFile...    │"
Write-Host "╰──────────────────────────────────────────────╯"
Write-Host

# ---------------------------------------------------------------------------------------
# CREATE THE NEW LOG (Runs the test)
& bun test --coverage "$testsPath" > "$logFilePath" 2>&1

# ---------------------------------------------------------------------------------------
# CHECK IF THE NEW TOTAL EQUALS 11
# If it was 10 before, adding 1 makes the total exactly 11
if ($initialCount -eq 10) {
    # 4. DELETE THE OLDEST LOG FILE
    $existingLogs | Select-Object -First 1 | Remove-Item -Force
    Write-Host "Oldest log file has been removed." -ForegroundColor Cyan
}

# ---------------------------------------------------------------------------------------
# Check the exit code of the cmd wrapper
if ($LASTEXITCODE -eq 0) {
    Write-Host
    Write-Host "Tests completed successfully. All tests passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host
    Write-Host "An error occurred. See log for details : $logFilePath" -ForegroundColor Red
    exit $LASTEXITCODE
}
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .PS1
// PATH     : log-tests.ps1
//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■-<  END  >-■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
// TYPE     : .PS1
// PATH     : ALL_REBUILT/log-tests.ps1