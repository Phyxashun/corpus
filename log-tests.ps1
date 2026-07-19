# ==========================================
# 1. PRESENTATION LAYER (UI Functions)
# ==========================================

function Get-Padding {
    param (
        [int]$Width,
        [int]$MaxWidth
    )

    # Calculate padding splits
    $TotalPad = $MaxWidth - $Width
    $LeftPadWidth = [math]::Floor($TotalPad / 2)
    $RightPadWidth = $TotalPad - $LeftPadWidth

    # Generate the space strings safely using string constructors
    $LeftSpaces = New-Object System.String(' ', $LeftPadWidth)
    $RightSpaces = New-Object System.String(' ', $RightPadWidth)

    # Return as an object containing both padding blocks to prevent character collapse
    return [PSCustomObject]@{
        Left  = $LeftSpaces
        Right = $RightSpaces
    }
}

function Draw-Box {
    param (
        [string]$RawText,
        [int]$MaxWidth = 60
    )

    # Trim leading/trailing spaces
    $TrimmedText = $RawText.Trim()

    # Frame text padding structure
    $Text = " $TrimmedText "
    $Width = $Text.Length

    # Guard clause against column boundary overflow
    if ($Width -gt $MaxWidth) {
        $Text = $Text.Substring(0, $MaxWidth)
        $Width = $MaxWidth
    }

    # Call padding function and extract properties safely
    $Padding = Get-Padding -Width $Width -MaxWidth $MaxWidth
    $LeftSpaces  = $Padding.Left
    $RightSpaces = $Padding.Right

    # Render out borders matching the MaxWidth container size
    $TopBottom = New-Object System.String('─', $MaxWidth)

    # Output text frame using host coloring
    Write-Host "╭$TopBottom╮"
    Write-Host "│$LeftSpaces" -NoNewline
    Write-Host $Text -ForegroundColor Magenta -NoNewline
    Write-Host "$RightSpaces│"
    Write-Host "╰$TopBottom╯"
}

function Show-Header {
    param ([string]$LogFile)

    Write-Host ""
    Write-Host "Running tests and logging output to:" -ForegroundColor Cyan
    Draw-Box -RawText $LogFile -MaxWidth 60
    Write-Host ""
}

function Show-Success {
    Write-Host "Tests completed successfully. All tests passed." -ForegroundColor Green
}

function Show-Failure {
    param ([string]$LogFilePath)
    Write-Host "An error occurred. See log for details: $LogFilePath" -ForegroundColor Red
}

# ==========================================
# 2. BUSINESS LOGIC LAYER (Log Management)
# ==========================================

function Rotate-Logs {
    param ([string]$LogDir)

    # Ensure directory exists
    if (-not (Test-Path -Path $LogDir)) { [void](New-Item -ItemType Directory -Path $LogDir) }

    # Securely collect matching files sorted by creation date
    $ExistingLogs = Get-ChildItem -Path $LogDir -Filter "*_tests.results.log" | Sort-Object CreationTime

    if ($ExistingLogs.Count -ge 10) {
        # Select the oldest file (index 0) and remove it safely
        Remove-Item -Path $ExistingLogs[0].FullName -Force
        Write-Host "Oldest log file has been removed." -ForegroundColor Cyan
    }
}

# ==========================================
# 3. CORE EXECUTION LAYER (Test Orchestration)
# ==========================================

function Run-Test-Suite {
    param (
        [string]$TestsPath,
        [string]$LogFilePath
    )

    # Execute external process and stream both stdout and stderr directly to file
    & bun test --coverage $TestsPath > $LogFilePath 2>&1
    return $LASTEXITCODE
}

# ==========================================
# 4. CONFIGURATION & RUNTIME ENGINE
# ==========================================

# Resolve parent directory cleanly across all PowerShell host environments
$ScriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$Timestamp = (Get-Date).ToString("yyyy-MM-dd_HHmmss")

$LogDir      = Join-Path -Path $ScriptDir -ChildPath "logs"
$LogFile     = "${Timestamp}_tests.results.log"
$LogFilePath = Join-Path -Path $LogDir -ChildPath $LogFile
$TestsPath   = Join-Path -Path $ScriptDir -ChildPath "tests"

# Pipeline execution lifecycle
Rotate-Logs -LogDir $LogDir
Show-Header -LogFile $LogFile
$ExitCode = Run-Test-Suite -TestsPath $TestsPath -LogFilePath $LogFilePath

if ($ExitCode -eq 0) {
    Show-Success
    Exit 0
} else {
    Show-Failure -LogFilePath $LogFilePath
    Exit $ExitCode
}
