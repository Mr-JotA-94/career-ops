# ---------------------------------------------
#  Career Ops - Installer (Windows)
#  https://careerops.com.au
#
#  Run this in PowerShell as Administrator:
#  Right-click → "Run with PowerShell"
# ---------------------------------------------

$ErrorActionPreference = "Stop"

$REPO_ZIP    = "https://github.com/Mr-JotA-94/career-ops/archive/refs/heads/main.zip"
$INSTALL_DIR = "$env:USERPROFILE\career-ops"
$TMP_ZIP     = "$env:TEMP\career-ops-main.zip"
$TMP_EXTRACT = "$env:TEMP\career-ops-extract"

# -- Colours -----------------------------------
function Write-Step  { param($msg) Write-Host "`n  > $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  [X]  $msg" -ForegroundColor Red; exit 1 }

# -- Banner ------------------------------------
Clear-Host
Write-Host ""
Write-Host "  ===========================================" -ForegroundColor Cyan
Write-Host "   CAREER OPS  -  Installer for Windows     " -ForegroundColor Cyan
Write-Host "   AI-powered job search toolkit             " -ForegroundColor Cyan
Write-Host "  ===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This installer will set up Career Ops on your computer."
Write-Host "  It will be installed to: $INSTALL_DIR"
Write-Host ""
Read-Host -Prompt "  Press Enter to continue - or close this window to cancel"

# -- Check execution policy --------------------
Write-Step "Checking PowerShell execution policy..."
$policy = Get-ExecutionPolicy -Scope CurrentUser
if ($policy -eq "Restricted") {
  Write-Warn "Execution policy is Restricted. Updating to RemoteSigned for current user..."
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
  Write-OK "Execution policy updated"
} else {
  Write-OK "Execution policy OK ($policy)"
}

# -- Check / Install Node.js -------------------
Write-Step "Checking Node.js..."

$nodeInstalled = $false
try {
  $nodeVersion = node -v 2>$null
  if ($nodeVersion) {
    $nodeMajor = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
    if ($nodeMajor -ge 18) {
      Write-OK "Node.js $nodeVersion found"
      $nodeInstalled = $true
    } else {
      Write-Warn "Node.js $nodeVersion is too old (need v18+). Will install latest."
    }
  }
} catch {}

if (-not $nodeInstalled) {
  Write-Warn "Node.js not found or too old. Installing now..."

  # Try winget first (Windows 11 / updated Windows 10)
  $wingetAvailable = $false
  try {
    $null = winget --version 2>$null
    $wingetAvailable = $true
  } catch {}

  if ($wingetAvailable) {
    Write-Host "  Installing via winget..." -ForegroundColor Cyan
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    Write-OK "Node.js installed via winget"

  } else {
    # Fall back: download Node.js MSI installer directly
    Write-Host "  Downloading Node.js installer..." -ForegroundColor Cyan
    $nodeMsi = "$env:TEMP\nodejs-installer.msi"
    $nodeUrl  = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"

    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
    Write-Host "  Running Node.js installer (follow the prompts)..." -ForegroundColor Yellow
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeMsi`" /quiet /norestart"
    Remove-Item $nodeMsi -Force
    Write-OK "Node.js installed"
  }

  # Refresh PATH so node is available in this session
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# -- Download Career Ops -----------------------
Write-Step "Downloading Career Ops..."

if (Test-Path $INSTALL_DIR) {
  Write-Warn "Folder already exists at $INSTALL_DIR"
  $confirm = Read-Host "  Re-download and update? Your config and pipeline data will be preserved. (y/n)"

  if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "`n  Skipping download. Starting existing installation..." -ForegroundColor White
    Set-Location $INSTALL_DIR
    npm install --silent
    Write-Host ""
    Write-Host "  Career Ops is already installed." -ForegroundColor Green
    Write-Host "  Starting server... open http://localhost:3131 in your browser."
    Start-Process "node" -ArgumentList "server.mjs" -WorkingDirectory $INSTALL_DIR
    Start-Sleep 2
    Start-Process "http://localhost:3131"
    exit 0
  }

  # Back up user data
  Write-Step "Backing up your data..."
  if (Test-Path "$INSTALL_DIR\config.json")   { Copy-Item "$INSTALL_DIR\config.json"   "$env:TEMP\career-ops-config-backup.json"   -Force; Write-OK "config.json backed up" }
  if (Test-Path "$INSTALL_DIR\pipeline.json") { Copy-Item "$INSTALL_DIR\pipeline.json" "$env:TEMP\career-ops-pipeline-backup.json" -Force; Write-OK "pipeline.json backed up" }
  if (Test-Path "$INSTALL_DIR\resumes")       { Copy-Item "$INSTALL_DIR\resumes"       "$env:TEMP\career-ops-resumes-backup"       -Recurse -Force; Write-OK "resumes folder backed up" }

  Set-Location $env:TEMP
  Remove-Item $INSTALL_DIR -Recurse -Force
}

# Download zip
Write-Host "  Downloading from GitHub..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $REPO_ZIP -OutFile $TMP_ZIP -UseBasicParsing
Write-OK "Downloaded"

# Extract
Write-Step "Extracting files..."
if (Test-Path $TMP_EXTRACT) { Remove-Item $TMP_EXTRACT -Recurse -Force }
Expand-Archive -Path $TMP_ZIP -DestinationPath $TMP_EXTRACT -Force
Move-Item "$TMP_EXTRACT\career-ops-main" $INSTALL_DIR
Remove-Item $TMP_ZIP, $TMP_EXTRACT -Recurse -Force -ErrorAction SilentlyContinue
Write-OK "Extracted to $INSTALL_DIR"

# Restore user data if it existed
if (Test-Path "$env:TEMP\career-ops-config-backup.json")   { Copy-Item "$env:TEMP\career-ops-config-backup.json"   "$INSTALL_DIR\config.json"   -Force; Write-OK "config.json restored" }
if (Test-Path "$env:TEMP\career-ops-pipeline-backup.json") { Copy-Item "$env:TEMP\career-ops-pipeline-backup.json" "$INSTALL_DIR\pipeline.json" -Force; Write-OK "pipeline.json restored" }
if (Test-Path "$env:TEMP\career-ops-resumes-backup")       { Copy-Item "$env:TEMP\career-ops-resumes-backup"       "$INSTALL_DIR\resumes"       -Recurse -Force; Write-OK "resumes folder restored" }

# -- Install dependencies ----------------------
Write-Step "Installing dependencies..."
Set-Location $INSTALL_DIR
npm install --silent
Write-OK "Dependencies installed"

# -- Create VBS launcher + Desktop shortcut ---
Write-Step "Creating desktop shortcut..."

# Write the VBScript launcher — checks port, starts Node hidden, opens browser
$vbsPath = "$INSTALL_DIR\career-ops-launcher.vbs"
$vbsContent = @"
Dim port, url, shell, http, i
port = 3131
url  = "http://localhost:" & port & "/hub.html"
Set shell = CreateObject("WScript.Shell")
Set http  = CreateObject("MSXML2.XMLHTTP")

' Check if server already running
Dim running : running = False
On Error Resume Next
http.Open "GET", "http://localhost:" & port & "/api/key-status", False
http.Send
If Err.Number = 0 And http.Status > 0 Then running = True
On Error GoTo 0

If Not running Then
  ' Start node silently (hidden window)
  shell.Run "cmd /c cd /d """ & "$INSTALL_DIR" & """ && node server.mjs", 0, False
  ' Poll up to 15 seconds
  For i = 1 To 15
    WScript.Sleep 1000
    On Error Resume Next
    http.Open "GET", "http://localhost:" & port & "/api/key-status", False
    http.Send
    If Err.Number = 0 And http.Status > 0 Then running = True : Exit For
    On Error GoTo 0
  Next
End If

shell.Run url
"@
Set-Content -Path $vbsPath -Value $vbsContent -Encoding ASCII
Write-OK "Launcher script created"

$desktop  = [System.Environment]::GetFolderPath("Desktop")
$lnkPath  = "$desktop\Career Ops.lnk"

# Locate node.exe for icon fallback
$nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if (-not $nodePath) { $nodePath = "$env:ProgramFiles\nodejs\node.exe" }

$WshShell  = New-Object -ComObject WScript.Shell
$shortcut  = $WshShell.CreateShortcut($lnkPath)
$shortcut.TargetPath       = "wscript.exe"
$shortcut.Arguments        = "`"$vbsPath`""
$shortcut.WorkingDirectory = $INSTALL_DIR
$shortcut.Description      = "Launch Career Ops"
$shortcut.WindowStyle      = 1

# Icon: prefer assets/icon.ico in the install dir, fall back to node.exe
$iconPath = "$INSTALL_DIR\assets\icon.ico"
if (Test-Path $iconPath) {
  $shortcut.IconLocation = "$iconPath,0"
} elseif ($nodePath -and (Test-Path $nodePath)) {
  $shortcut.IconLocation = "$nodePath,0"
}

$shortcut.Save()
Write-OK "Desktop shortcut created: `"Career Ops`""

# -- Done --------------------------------------
Write-Host ""
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host "   Career Ops installed successfully!       " -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Starting Career Ops now..." -ForegroundColor White
Write-Host "  Your browser will open automatically." -ForegroundColor White
Write-Host "  The setup wizard will guide you from there." -ForegroundColor White
Write-Host ""
Write-Host "  Next time: double-click 'Career Ops' on your Desktop." -ForegroundColor Yellow
Write-Host ""

# Start server
Start-Process "node" -ArgumentList "server.mjs" -WorkingDirectory $INSTALL_DIR -WindowStyle Normal
Start-Sleep 3

# Open browser
Start-Process "http://localhost:3131/hub.html"

Write-Host "  Browser opened. Follow the setup wizard to complete installation." -ForegroundColor Cyan
Write-Host ""
Read-Host "  Press Enter to close this window (Career Ops will keep running)"
