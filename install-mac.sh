#!/usr/bin/env bash
# ---------------------------------------------
#  Career Ops — Installer (Mac)
#  https://careerops.com.au
#
#  Usage: bash install-mac.sh
# ---------------------------------------------

set -euo pipefail

REPO_ZIP="https://github.com/Mr-JotA-94/career-ops/archive/refs/heads/main.zip"
INSTALL_DIR="$HOME/career-ops"
TMP_ZIP="/tmp/career-ops-main.zip"
TMP_EXTRACT="/tmp/career-ops-extract"
DESKTOP="$HOME/Desktop"

# -- Colours ---
step() { echo; echo "  > $1"; }
ok()   { echo "  [OK] $1"; }
warn() { echo "  [!]  $1"; }
fail() { echo "  [X]  $1"; exit 1; }

# -- Banner ---
clear
cat <<'BANNER'

  ===========================================
   CAREER OPS  -  Installer for Mac
   AI-powered job search toolkit
  ===========================================

BANNER
echo "  This installer will set up Career Ops on your computer."
echo "  It will be installed to: $INSTALL_DIR"
echo
read -rp "  Press Enter to continue — or Ctrl+C to cancel: "

# -- Check Node.js ---
step "Checking Node.js..."
NODE_INSTALL_NEEDED=false
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VERSION" | tr -d 'v' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js $NODE_VERSION found"
  else
    warn "Node.js $NODE_VERSION is too old (need v18+). Will install latest."
    NODE_INSTALL_NEEDED=true
  fi
else
  warn "Node.js not found. Installing..."
  NODE_INSTALL_NEEDED=true
fi

if [ "$NODE_INSTALL_NEEDED" = "true" ]; then
  if command -v brew &>/dev/null; then
    brew install node
    ok "Node.js installed via Homebrew"
  else
    fail "Homebrew not found. Install Node.js manually from https://nodejs.org then re-run this script."
  fi
fi

# -- Download Career Ops ---
step "Downloading Career Ops..."
if [ -d "$INSTALL_DIR" ]; then
  warn "Folder already exists at $INSTALL_DIR"
  read -rp "  Re-download and update? Config and pipeline data will be preserved. (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "  Skipping download. Starting existing installation..."
    cd "$INSTALL_DIR"
    npm install --silent
    nohup node server.mjs >/dev/null 2>&1 &
    sleep 2
    open "http://localhost:3131"
    exit 0
  fi

  step "Backing up your data..."
  [ -f "$INSTALL_DIR/config.json" ]   && cp "$INSTALL_DIR/config.json"   /tmp/career-ops-config-backup.json   && ok "config.json backed up"
  [ -f "$INSTALL_DIR/pipeline.json" ] && cp "$INSTALL_DIR/pipeline.json" /tmp/career-ops-pipeline-backup.json && ok "pipeline.json backed up"
  [ -d "$INSTALL_DIR/resumes" ]       && cp -r "$INSTALL_DIR/resumes"    /tmp/career-ops-resumes-backup       && ok "resumes folder backed up"

  rm -rf "$INSTALL_DIR"
fi

curl -fsSL "$REPO_ZIP" -o "$TMP_ZIP"
ok "Downloaded"

step "Extracting files..."
rm -rf "$TMP_EXTRACT"
mkdir -p "$TMP_EXTRACT"
unzip -q "$TMP_ZIP" -d "$TMP_EXTRACT"
mv "$TMP_EXTRACT/career-ops-main" "$INSTALL_DIR"
rm -rf "$TMP_ZIP" "$TMP_EXTRACT"
ok "Extracted to $INSTALL_DIR"

[ -f /tmp/career-ops-config-backup.json ]   && cp /tmp/career-ops-config-backup.json   "$INSTALL_DIR/config.json"   && ok "config.json restored"
[ -f /tmp/career-ops-pipeline-backup.json ] && cp /tmp/career-ops-pipeline-backup.json "$INSTALL_DIR/pipeline.json" && ok "pipeline.json restored"
[ -d /tmp/career-ops-resumes-backup ]       && cp -r /tmp/career-ops-resumes-backup    "$INSTALL_DIR/resumes"       && ok "resumes folder restored"

# -- Install dependencies ---
step "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent
ok "Dependencies installed"

# -- Create launcher script ---
step "Creating launcher..."
LAUNCHER="$INSTALL_DIR/career-ops-launcher.command"
cat > "$LAUNCHER" <<'LAUNCHER_SCRIPT'
#!/usr/bin/env bash
INSTALL_DIR="$HOME/career-ops"
PORT=3131

# Already running — just open the browser
if lsof -i :"$PORT" -sTCP:LISTEN -t &>/dev/null; then
  open "http://localhost:$PORT/hub.html"
  exit 0
fi

# Start server silently in background
cd "$INSTALL_DIR"
nohup node server.mjs >/dev/null 2>&1 &

# Poll up to 15 seconds
for i in $(seq 1 15); do
  if lsof -i :"$PORT" -sTCP:LISTEN -t &>/dev/null; then
    open "http://localhost:$PORT/hub.html"
    exit 0
  fi
  sleep 1
done

echo "Career Ops did not start in time. Check $INSTALL_DIR for errors."
LAUNCHER_SCRIPT
chmod +x "$LAUNCHER"
ok "Launcher script created"

# -- Create .app via osacompile (no terminal window) ---
APP_PATH="$DESKTOP/Career Ops.app"
APPLESCRIPT_TMP="/tmp/career-ops-launcher.applescript"
cat > "$APPLESCRIPT_TMP" <<APPLESCRIPT
do shell script "bash '" & (POSIX path of (path to home folder)) & "career-ops/career-ops-launcher.command' > /dev/null 2>&1 &"
APPLESCRIPT
osacompile -o "$APP_PATH" "$APPLESCRIPT_TMP"
rm -f "$APPLESCRIPT_TMP"
ok ".app bundle created: Career Ops.app"

# -- Apply icon ---
ICON_SRC="$INSTALL_DIR/assets/icon.icns"
if [ -f "$ICON_SRC" ]; then
  step "Applying icon..."

  # Inject icns into the .app bundle — no extra tools required
  APP_RESOURCES="$APP_PATH/Contents/Resources"
  cp "$ICON_SRC" "$APP_RESOURCES/applet.icns"
  PLIST="$APP_PATH/Contents/Info.plist"
  if [ -x /usr/libexec/PlistBuddy ]; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile applet" "$PLIST" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string applet" "$PLIST" 2>/dev/null || true
  fi
  # Touch so Finder refreshes icon cache
  touch "$APP_PATH"
  ok "Icon applied to Career Ops.app"

  # Also try to apply icon to the .command file
  if command -v fileicon &>/dev/null; then
    fileicon set "$LAUNCHER" "$ICON_SRC" 2>/dev/null && ok "Icon applied to launcher script (fileicon)" || true
  elif command -v Rez &>/dev/null && command -v DeRez &>/dev/null && command -v SetFile &>/dev/null; then
    # Xcode CLT approach: embed icon as resource fork
    TMP_RSRC="/tmp/career-ops-icon.rsrc"
    sips -i "$ICON_SRC" 2>/dev/null || true
    if DeRez -only icns "$ICON_SRC" > "$TMP_RSRC" 2>/dev/null; then
      Rez -append "$TMP_RSRC" -o "$LAUNCHER" 2>/dev/null && \
      SetFile -a C "$LAUNCHER" 2>/dev/null && \
      ok "Icon applied to launcher script (Rez)" || true
    fi
    rm -f "$TMP_RSRC"
  else
    # Known limitation — skip silently, app icon is already set above
    warn "No icon tooling found (fileicon / Xcode CLT) — launcher script icon skipped"
  fi
else
  warn "No icon file at assets/icon.icns — using default app icon"
fi

# -- Done ---
echo
echo "  =========================================="
echo "   Career Ops installed successfully!       "
echo "  =========================================="
echo
echo "  Starting Career Ops now..."
echo "  Your browser will open automatically."
echo "  The setup wizard will guide you from there."
echo
echo "  Next time: double-click 'Career Ops' on your Desktop."
echo

cd "$INSTALL_DIR"
nohup node server.mjs >/dev/null 2>&1 &
sleep 3

open "http://localhost:3131/hub.html"

echo "  Browser opened. Follow the setup wizard to complete installation."
echo
read -rp "  Press Enter to close this window (Career Ops will keep running): "
