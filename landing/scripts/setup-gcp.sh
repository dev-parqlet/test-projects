#!/bin/bash
# Run this ONCE on the GCP instance to set up Docker + clone the repo
set -e

echo "=== Installing Docker ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repo
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add yaros to docker group
sudo usermod -aG docker yaros

echo "=== Cloning repo ==="
cd /home/yaros
git clone git@github.com:dev-parqlet/landing.git parqlet-landing || echo "Repo already cloned"
cd parqlet-landing

echo "=== Creating .env from example ==="
cp .env.production.example .env
echo ">>> EDIT /home/yaros/parqlet-landing/.env AND ADD YOUR RESEND_API_KEY <<<"

echo "=== Pulling images and starting containers ==="
docker compose pull
docker compose up -d

echo "=== Setup complete ==="
echo "Check status: docker compose -f /home/yaros/parqlet-landing/docker-compose.yml ps"
echo "View logs:    docker compose -f /home/yaros/parqlet-landing/docker-compose.yml logs -f"
