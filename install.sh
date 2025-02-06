#!/bin/bash

set -e

SERVICE_NAME="icoclient"
INSTALL_DIR="/etc/icoclient"
SERVICE_PATH="/etc/systemd/system"
NODE_VERSION="18.19.0"

echo "Stopping and removing old files..."
sudo systemctl stop $SERVICE_NAME.service || true
sudo rm -rf $INSTALL_DIR

echo "Creating installation directory..."
sudo mkdir -p $INSTALL_DIR
sudo chown $USER:$USER $INSTALL_DIR

echo "Copying application files..."
FILES_AND_DIRS=(".env" "*.ts" "*.js" "*.json" "*.html" "src" "public")

for ITEM in "${FILES_AND_DIRS[@]}"; do
  cp -r $ITEM "$INSTALL_DIR"
done
cd $INSTALL_DIR

echo "Setting up Node.js virtual environment with nodeenv..."
if ! command -v nodeenv &> /dev/null; then
  echo "Installing python venv..."
  python3 -m venv venv
  source venv/bin/activate
  echo "Installing nodeenv..."
  pip install nodeenv
fi

nodeenv --node=$NODE_VERSION env
source env/bin/activate

echo "Installing Node.js dependencies..."
npm install

echo "Deactivating virtual environment..."
deactivate

echo "Creating systemd service..."
sudo bash -c "cat << EOF > $SERVICE_PATH/$SERVICE_NAME.service
[Unit]
Description=ICOclient Node.js Service
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

echo "Reloading systemd and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl start $SERVICE_NAME.service

echo "Checking service status..."
sudo systemctl status $SERVICE_NAME.service

