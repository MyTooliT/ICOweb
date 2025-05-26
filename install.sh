#!/bin/bash

set -e

SERVICE_NAME="icoweb"
INSTALL_DIR="/etc/icoweb"
SERVICE_PATH="/etc/systemd/system"
NODE_VERSION="18.19.0"
FORCE_REINSTALL=false

# Check for --force flag
if [[ "$1" == "--force" ]]; then
  FORCE_REINSTALL=true
  echo "Forcing reinstallation: Deleting existing installation..."
fi

echo "Stopping service..."
sudo systemctl stop $SERVICE_NAME.service || true

# Handle force reinstallation
if [ "$FORCE_REINSTALL" = true ]; then
  sudo rm -rf $INSTALL_DIR
fi

echo "Creating installation directory if not exists..."
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

echo "Copying application files..."
FILES_AND_DIRS=(".env" "*.ts" "*.js" "*.json" "*.html" "src" "public")

for ITEM in "${FILES_AND_DIRS[@]}"; do
  cp -r $ITEM "$INSTALL_DIR"
done
cd $INSTALL_DIR

echo "Checking for existing Node.js virtual environment..."
if [ "$FORCE_REINSTALL" = true ] || [ ! -d "env" ]; then
  echo "Setting up Node.js virtual environment with nodeenv..."
  
  if ! command -v nodeenv &> /dev/null; then
    echo "Installing python venv..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing nodeenv..."
    pip install nodeenv
  fi

  # Remove existing env if forcing reinstallation
  if [ "$FORCE_REINSTALL" = true ]; then
    rm -rf env
  fi

  nodeenv --node=$NODE_VERSION env
fi

source env/bin/activate

echo "Installing Node.js dependencies..."
npm install

echo "Ensuring systemd service exists..."
sudo bash -c "cat << EOF > $SERVICE_PATH/$SERVICE_NAME.service
[Unit]
Description=ICOweb Node.js Service
After=network.target

[Service]
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/env/bin/node $INSTALL_DIR/env/bin/npm run start
RestartSec=5
Restart=always
User=$USER
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF"

echo "Reloading systemd and restarting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl start $SERVICE_NAME.service

echo "Checking service status..."
sudo systemctl status $SERVICE_NAME.service



