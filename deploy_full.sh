#!/bin/bash
set -e

# Configuration
DROPLET_IP="165.227.35.55"
BACKEND_PORT="30001"
API_URL="http://${DROPLET_IP}:${BACKEND_PORT}/api"
REMOTE_DIR="/home/cash-or-card-on-dev"

echo "============================================"
echo "Starting Full Deployment to $DROPLET_IP"
echo "============================================"

# 1. Build Frontend
echo "[1/7] Building Frontend (API_URL=$API_URL)..."
docker build \
  --platform linux/amd64 \
  --build-arg REACT_APP_API_BASE="$API_URL" \
  -t cash-or-card-frontend:latest \
  ./frontend
docker save cash-or-card-frontend:latest | gzip > frontend.tar.gz

# 2. Build Backend
echo "[2/7] Building Backend..."
docker build \
  --platform linux/amd64 \
  -t cash-or-card-backend:latest \
  ./backend
docker save cash-or-card-backend:latest | gzip > backend.tar.gz

# 3. Build Database
echo "[3/7] Building Database..."
docker build \
  --platform linux/amd64 \
  -t cash-or-card-db:latest \
  ./backend/database
docker save cash-or-card-db:latest | gzip > db.tar.gz

# 4. Transfer Images & Configs
echo "[4/7] Transferring images and k8s configs to Droplet..."
# Ensure remote directory exists
ssh root@$DROPLET_IP "mkdir -p $REMOTE_DIR"
scp frontend.tar.gz backend.tar.gz db.tar.gz root@$DROPLET_IP:$REMOTE_DIR/
scp -r k8s root@$DROPLET_IP:$REMOTE_DIR/

# 5. Import Images on Droplet
echo "[5/7] Importing images into K3s..."
ssh root@$DROPLET_IP "
  cd $REMOTE_DIR
  
  echo 'Importing Frontend...';
  gunzip -c frontend.tar.gz | k3s ctr images import -;
  
  echo 'Importing Backend...';
  gunzip -c backend.tar.gz | k3s ctr images import -;
  
  echo 'Importing Database...';
  gunzip -c db.tar.gz | k3s ctr images import -;
"

# 6. Apply Kubernetes Manifests
echo "[6/7] Applying Kubernetes Manifests..."
ssh root@$DROPLET_IP "kubectl apply -f $REMOTE_DIR/k8s/"

# 7. Restart Deployments
echo "[7/7] Restarting Deployments..."
ssh root@$DROPLET_IP "
  kubectl rollout restart deployment frontend;
  kubectl rollout restart deployment backend;
  kubectl rollout restart deployment postgres;
"

echo "============================================"
echo "Deployment Complete!"
echo "Frontend: http://$DROPLET_IP:30000"
echo "Backend:  http://$DROPLET_IP:30001"
echo "============================================"
