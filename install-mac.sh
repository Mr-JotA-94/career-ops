#!/bin/bash

# ─────────────────────────────────────────────
#  Career Ops — Installer (Mac / Linux)
#  https://careerops.com.au
# ─────────────────────────────────────────────

set -e

REPO_ZIP="https://github.com/Mr-JotA-94/career-ops/archive/refs/heads/main.zip"
INSTALL_DIR="$HOME/career-ops"

# ── Colours ───────────────────────────────────
GREEN='\033[0;32m'
TEAL='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

print_banner() {
  echo ""
  echo -e "${TEAL}${BOLD}"
  echo "  ██████╗ █████╗ ██████╗ ███████╗███████╗██████╗      ██████╗ ██████╗ ███████╗"
  echo " ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗    ██╔═══██╗██╔══██╗██╔════╝"
  echo " ██║     ███████║██████╔╝█████╗  █████╗  ██████╔╝    ██║   ██║██████╔╝███████╗"
  echo " ██║     ██╔══██║██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗    ██║   ██║██╔═══╝ ╚════██║"
  echo " ╚██████╗██║  ██║██║  ██║███████╗███████╗██║  ██║    ╚██████╔╝██║     ███████║"
  echo "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚═╝     ╚══════╝"
  echo -e "${RESET}"
  echo -e "  ${BOLD}AI-powered job search toolkit${RESET}"
  echo ""
}

step() {
  echo -e "\n${TEAL}▸ $1${RESET}"
}

success() {
  echo -e "${GREEN}  ✓ $1${RESET}"
}

warn() {
  echo -e "${YELLOW}  ⚠ $1${RESET}"
}

fail() {
  echo -e "${RED}  ✗ $1${RESET}"
  exit 1
}

# ── Banner ────────────────────────────────────
print_banner

echo -e "  This installer will set up Career Ops on your computer."
echo -e "  It will be installed to: ${BOLD}$INSTALL_DIR${RESET}"
echo ""
read -p "  Press Enter to continue, or Ctrl+C to cancel..." _

# ── Check: curl ───────────────────────────────
step "Checking requirements..."

if ! command -v curl &>/dev/null; then
  fail "curl is not installed. Please install it and re-run this script."
fi
success "curl found"

# ── Check: Node.js ───────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    success "Node.js $(node -v) found"
  else
    warn "Node.js $(node -v) is too old (need v18+). Attempting to install latest..."
    INSTALL_NODE=true
  fi
else
  warn "Node.js not found. Installing now..."
  INSTALL_NODE=true
fi

# ── Install Node.js if needed ─────────────────
if [ "$INSTALL_NODE" = true ]; then
  step "Installing Node.js..."

  if command -v brew &>/dev/null; then
    brew install node
    success "Node.js installed via Homebrew"

  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Use NodeSource for Linux
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    success "Node.js installed via NodeSource"

  else
    echo ""
    echo -e "  ${YELLOW}Could not auto-install Node.js on your system.${RESET}"
    echo -e "  Please install it manually from: ${BOLD}https://nodejs.org${RESET}"
    echo -e "  Then re-run this installer."
    echo ""
    exit 1
  fi
fi

# ── Check: unzip ──────────────────────────────
if ! command -v unzip &>/dev/null; then
  fail "unzip is not installed. Run: sudo apt install unzip  (or brew install unzip)"
fi
success "unzip found"

# ── Download Career Ops ───────────────────────
step "Downloading Career Ops..."

if [ -d "$INSTALL_DIR" ]; then
  warn "Folder already exists at $INSTALL_DIR"
  echo ""
  read -p "  Re-download and update? Your config and pipeline data will be preserved. (y/n): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo ""
    echo -e "  ${BOLD}Skipping download. Starting existing installation...${RESET}"
    cd "$INSTALL_DIR"
    npm install --silent
    echo ""
    echo -e "  ${GREEN}${BOLD}Career Ops is already installed.${RESET}"
    echo -e "  Starting server... open ${BOLD}http://localhost:3131${RESET} in your browser."
    echo ""
    node server.mjs &
    sleep 2
    open "http://localhost:3131" 2>/dev/null || xdg-open "http://localhost:3131" 2>/dev/null || true
    exit 0
  fi

  # Back up user data before re-downloading
  step "Backing up your data..."
  [ -f "$INSTALL_DIR/config.json" ]   && cp "$INSTALL_DIR/config.json"   /tmp/career-ops-config-backup.json   && success "config.json backed up"
  [ -f "$INSTALL_DIR/pipeline.json" ] && cp "$INSTALL_DIR/pipeline.json" /tmp/career-ops-pipeline-backup.json && success "pipeline.json backed up"
  [ -d "$INSTALL_DIR/resumes" ]       && cp -r "$INSTALL_DIR/resumes"    /tmp/career-ops-resumes-backup       && success "resumes folder backed up"

  rm -rf "$INSTALL_DIR"
fi

# Download zip
TMP_ZIP="/tmp/career-ops-main.zip"
curl -L --progress-bar "$REPO_ZIP" -o "$TMP_ZIP"
success "Downloaded"

# Extract
step "Extracting files..."
unzip -q "$TMP_ZIP" -d /tmp/career-ops-extract
mv /tmp/career-ops-extract/career-ops-main "$INSTALL_DIR"
rm -rf "$TMP_ZIP" /tmp/career-ops-extract
success "Extracted to $INSTALL_DIR"

# Restore user data if it existed
if [ -f /tmp/career-ops-config-backup.json ]; then
  cp /tmp/career-ops-config-backup.json "$INSTALL_DIR/config.json"
  success "config.json restored"
fi
if [ -f /tmp/career-ops-pipeline-backup.json ]; then
  cp /tmp/career-ops-pipeline-backup.json "$INSTALL_DIR/pipeline.json"
  success "pipeline.json restored"
fi
if [ -d /tmp/career-ops-resumes-backup ]; then
  cp -r /tmp/career-ops-resumes-backup "$INSTALL_DIR/resumes"
  success "resumes folder restored"
fi

# ── Install dependencies ──────────────────────
step "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent
success "Dependencies installed"

# ── Create desktop launcher ───────────────────
step "Creating desktop launcher..."

# Write the launcher shell script into the app folder
LAUNCHER_SH="$HOME/career-ops/career-ops-launcher.sh"
cat > "$LAUNCHER_SH" << 'LAUNCHER_EOF'
#!/bin/bash
APP_DIR="$HOME/career-ops"
SERVER_URL="http://localhost:3131/api/config"

STATUS=$(curl -s --max-time 2 -o /dev/null -w "%{http_code}" "$SERVER_URL" 2>/dev/null)
if [ "$STATUS" = "200" ]; then
  open "http://localhost:3131/hub.html"
  exit 0
fi

cd "$APP_DIR"
nohup node server.mjs > /dev/null 2>&1 &

attempts=0
while [ $attempts -lt 15 ]; do
  STATUS=$(curl -s --max-time 1 -o /dev/null -w "%{http_code}" "$SERVER_URL" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    break
  fi
  sleep 1
  attempts=$((attempts + 1))
done

open "http://localhost:3131/hub.html"
LAUNCHER_EOF
chmod +x "$LAUNCHER_SH"

# Create a silent .app wrapper via AppleScript (no terminal window)
APP_PATH="$HOME/Desktop/Career Ops.app"
rm -rf "$APP_PATH"
osacompile -o "$APP_PATH" -e "do shell script \"/bin/bash '$LAUNCHER_SH'\""
success "Desktop launcher created: \"Career Ops\""

# ── Done ──────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Career Ops installed successfully!${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}Starting Career Ops now...${RESET}"
echo -e "  Your browser will open automatically."
echo -e "  The setup wizard will guide you from there."
echo ""
echo -e "  ${YELLOW}Next time:${RESET} double-click ${BOLD}\"Career Ops\"${RESET} on your Desktop."
echo ""

# Start server and open browser
node server.mjs &
SERVER_PID=$!
sleep 2

# Open browser
open "http://localhost:3131/setup.html" 2>/dev/null || \
xdg-open "http://localhost:3131/setup.html" 2>/dev/null || \
echo -e "  Open this in your browser: ${BOLD}http://localhost:3131/setup.html${RESET}"

echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop the server when done."
echo ""

wait $SERVER_PID
