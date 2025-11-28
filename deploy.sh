#!/bin/bash

# =============================================================================
# Deploy to DigitalOcean Kubernetes
# This script replicates the GitHub Actions deploy.yml workflow
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DO_K8S_DIR="$SCRIPT_DIR/do-k8s"

# =============================================================================
# Load environment variables
# =============================================================================
echo -e "${BLUE}📦 Loading environment variables...${NC}"


# Override with deploy-specific .env if it exists
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    echo -e "${GREEN}  ✓ Loading from .env.deploy${NC}"
    export $(grep -v '^#' "$SCRIPT_DIR/.env.deploy" | xargs)
fi

# =============================================================================
# Required environment variables (can be set in .env.deploy or exported)
# =============================================================================
# DIGITALOCEAN_ACCESS_TOKEN - Your DigitalOcean API token
# DO_REGISTRY_NAME - Your container registry name
# DO_CLUSTER_ID - Your Kubernetes cluster ID (or name)
# POSTGRES_PASSWORD - Database password
# JWT_SECRET - JWT signing secret

# Set defaults if not provided
DO_CLUSTER_ID="${DO_CLUSTER_ID:-6875f660-de8c-427a-a59f-34ac3407d4a3}"
# Always use a unique tag with timestamp to ensure fresh image pulls
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')-$(date +%s)}"

# =============================================================================
# Validate required variables
# =============================================================================
echo -e "${BLUE}🔍 Validating required environment variables...${NC}"

validate_var() {
    local var_name=$1
    local var_value="${!var_name}"
    if [ -z "$var_value" ]; then
        echo -e "${RED}  ✗ ERROR: $var_name is not set${NC}"
        echo -e "${YELLOW}    Set it in .env.deploy or export it before running this script${NC}"
        return 1
    else
        echo -e "${GREEN}  ✓ $var_name is set${NC}"
        return 0
    fi
}

VALIDATION_FAILED=0
validate_var "DIGITALOCEAN_ACCESS_TOKEN" || VALIDATION_FAILED=1
validate_var "DO_REGISTRY_NAME" || VALIDATION_FAILED=1
validate_var "POSTGRES_PASSWORD" || VALIDATION_FAILED=1
validate_var "JWT_SECRET" || VALIDATION_FAILED=1

if [ $VALIDATION_FAILED -eq 1 ]; then
    echo -e "${RED}❌ Validation failed. Please set the required environment variables.${NC}"
    echo ""
    echo "You can create a .env.deploy file with:"
    echo "  DIGITALOCEAN_ACCESS_TOKEN=your_token"
    echo "  DO_REGISTRY_NAME=your_registry"
    echo "  DO_CLUSTER_ID=your_cluster_id"
    echo "  POSTGRES_PASSWORD=your_password"
    echo "  JWT_SECRET=your_jwt_secret"
    exit 1
fi

echo -e "${GREEN}  ✓ All required variables are set${NC}"
echo -e "${BLUE}  ℹ Using image tag: ${TAG}${NC}"

# =============================================================================
# Install/Configure doctl
# =============================================================================
echo -e "\n${BLUE}🔧 Configuring doctl...${NC}"

if ! command -v doctl &> /dev/null; then
    echo -e "${RED}  ✗ doctl is not installed. Please install it first.${NC}"
    echo "    See: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Authenticate doctl
doctl auth init -t "$DIGITALOCEAN_ACCESS_TOKEN" --context deploy-script 2>/dev/null || true
doctl auth switch --context deploy-script 2>/dev/null || true
echo -e "${GREEN}  ✓ doctl configured${NC}"

# =============================================================================
# Log in to DigitalOcean Container Registry
# =============================================================================
echo -e "\n${BLUE}🔐 Logging in to DigitalOcean Container Registry...${NC}"
doctl registry login --expiry-seconds 1200
echo -e "${GREEN}  ✓ Logged in to registry${NC}"

# =============================================================================
# Configure kubectl (needed to get Node IP before building frontend)
# =============================================================================
echo -e "\n${BLUE}⚙️  Configuring kubectl...${NC}"
doctl kubernetes cluster kubeconfig save "$DO_CLUSTER_ID" --expiry-seconds 600
echo -e "${GREEN}  ✓ kubectl configured${NC}"

# =============================================================================
# Integrate registry with Kubernetes cluster
# =============================================================================
echo -e "\n${BLUE}🔗 Integrating registry with Kubernetes cluster...${NC}"
CLUSTER_NAME=$(doctl kubernetes cluster list --format Name --no-header | head -1)
doctl kubernetes cluster registry add "$CLUSTER_NAME" 2>/dev/null || true
echo -e "${GREEN}  ✓ Registry integrated with cluster${NC}"

# =============================================================================
# Get Kubernetes Node Public IP
# =============================================================================
echo -e "\n${BLUE}🌐 Getting Kubernetes Node Public IP...${NC}"

NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

# Fallback: If ExternalIP is not available, try to get it from DigitalOcean API
if [ -z "$NODE_IP" ]; then
    echo -e "${YELLOW}  ⚠ ExternalIP not found via kubectl, trying doctl...${NC}"
    NODE_NAME=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
    NODE_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "$NODE_NAME" | awk '{print $2}')
fi

if [ -z "$NODE_IP" ]; then
    echo -e "${RED}  ✗ Could not determine Node IP${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Detected Node IP: $NODE_IP${NC}"

# =============================================================================
# Build and Push Docker Images
# =============================================================================
REGISTRY="registry.digitalocean.com/$DO_REGISTRY_NAME"

echo -e "\n${BLUE}🏗️  Building and pushing Backend image...${NC}"
docker build -t "$REGISTRY/cash-or-card-backend:$TAG" "$SCRIPT_DIR/backend"
docker push "$REGISTRY/cash-or-card-backend:$TAG"
echo -e "${GREEN}  ✓ Backend image pushed: $REGISTRY/cash-or-card-backend:$TAG${NC}"

echo -e "\n${BLUE}🏗️  Building and pushing Frontend image...${NC}"
# Pass the API URL as a build argument so React can call the correct backend
docker build \
    --build-arg REACT_APP_API_BASE="http://$NODE_IP:30001/api" \
    -t "$REGISTRY/cash-or-card-frontend:$TAG" \
    "$SCRIPT_DIR/frontend"
docker push "$REGISTRY/cash-or-card-frontend:$TAG"
echo -e "${GREEN}  ✓ Frontend image pushed: $REGISTRY/cash-or-card-frontend:$TAG${NC}"

echo -e "\n${BLUE}🏗️  Building and pushing DB image...${NC}"
docker build -t "$REGISTRY/cash-or-card-db:$TAG" "$SCRIPT_DIR/backend/database"
docker push "$REGISTRY/cash-or-card-db:$TAG"
echo -e "${GREEN}  ✓ DB image pushed: $REGISTRY/cash-or-card-db:$TAG${NC}"

# =============================================================================
# Create temporary deployment files
# =============================================================================
echo -e "\n${BLUE}📝 Preparing deployment files...${NC}"

# Create temp directory for modified manifests
TEMP_DIR=$(mktemp -d)
cp -r "$DO_K8S_DIR"/* "$TEMP_DIR/"

# Update image tags
sed -i "s|<BACKEND_IMAGE>|$REGISTRY/cash-or-card-backend:$TAG|g" "$TEMP_DIR/backend.yaml"
sed -i "s|<FRONTEND_IMAGE>|$REGISTRY/cash-or-card-frontend:$TAG|g" "$TEMP_DIR/frontend.yaml"
sed -i "s|<DB_IMAGE>|$REGISTRY/cash-or-card-db:$TAG|g" "$TEMP_DIR/postgres.yaml"

# Auto-configure CORS and API URL using node IP
# CORS_ORIGIN should be the frontend URL (port 30000), not the backend
sed -i "s|<CORS_ORIGIN>|http://$NODE_IP:30000|g" "$TEMP_DIR/configmap.yaml"
sed -i "s|<REACT_APP_API_URL>|http://$NODE_IP:30001|g" "$TEMP_DIR/configmap.yaml"

# Get the cluster ID for monitoring
CLUSTER_ID=$(doctl kubernetes cluster list --format ID --no-header | head -1)
sed -i "s|<DO_CLUSTER_ID>|$CLUSTER_ID|g" "$TEMP_DIR/configmap.yaml"

# Set secrets
sed -i "s|<POSTGRES_PASSWORD>|$POSTGRES_PASSWORD|g" "$TEMP_DIR/secrets.yaml"
sed -i "s|<JWT_SECRET>|$JWT_SECRET|g" "$TEMP_DIR/secrets.yaml"
sed -i "s|<DO_API_TOKEN>|$DIGITALOCEAN_ACCESS_TOKEN|g" "$TEMP_DIR/secrets.yaml"

echo -e "${GREEN}  ✓ Deployment files prepared in $TEMP_DIR${NC}"

# =============================================================================
# Deploy to Kubernetes
# =============================================================================
echo -e "\n${BLUE}🚀 Deploying to Kubernetes...${NC}"

echo -e "${YELLOW}  → Applying configmap...${NC}"
kubectl apply -f "$TEMP_DIR/configmap.yaml"

echo -e "${YELLOW}  → Applying secrets...${NC}"
kubectl apply -f "$TEMP_DIR/secrets.yaml"

echo -e "${YELLOW}  → Applying restaurant-images-pvc...${NC}"
kubectl apply -f "$TEMP_DIR/restaurant-images-pvc.yaml"

echo -e "${YELLOW}  → Applying postgres...${NC}"
kubectl apply -f "$TEMP_DIR/postgres.yaml"
kubectl rollout status deployment/postgres --timeout=120s

echo -e "${YELLOW}  → Applying backend...${NC}"
kubectl apply -f "$TEMP_DIR/backend.yaml"
kubectl rollout status deployment/backend --timeout=120s

# =============================================================================
# Seed restaurant images
# =============================================================================
echo -e "\n${BLUE}🖼️  Seeding restaurant images...${NC}"

IMAGES_DIR="$SCRIPT_DIR/backend/uploads/restaurants"
if [ -d "$IMAGES_DIR" ] && [ "$(ls -A "$IMAGES_DIR" 2>/dev/null | grep -v README)" ]; then
    # Wait a moment for pod to be fully ready, then get the running pod name
    sleep 2
    BACKEND_POD=$(kubectl get pods -l app=backend --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$BACKEND_POD" ]; then
        echo -e "${YELLOW}  → Copying images to backend pod: $BACKEND_POD${NC}"
        kubectl cp "$IMAGES_DIR/." "$BACKEND_POD:/app/uploads/restaurants/"
        echo -e "${GREEN}  ✓ Restaurant images seeded${NC}"
    else
        echo -e "${YELLOW}  ⚠ No backend pod found, skipping image seeding${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ No restaurant images found in $IMAGES_DIR, skipping${NC}"
fi

echo -e "${YELLOW}  → Applying frontend...${NC}"
kubectl apply -f "$TEMP_DIR/frontend.yaml"
kubectl rollout status deployment/frontend --timeout=120s

# =============================================================================
# Cleanup
# =============================================================================
echo -e "\n${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"
echo -e "${GREEN}  ✓ Cleanup complete${NC}"

# =============================================================================
# Summary
# =============================================================================
echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "   Image Tag:    $TAG"
echo "   Node IP:      $NODE_IP"
echo "   Frontend:     http://$NODE_IP:30000"
echo "   Backend API:  http://$NODE_IP:30001"
echo ""
echo -e "${BLUE}📋 Pod Status:${NC}"
kubectl get pods

echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "   kubectl get pods              - Check pod status"
echo "   kubectl logs <pod-name>       - View pod logs"
echo "   kubectl describe pod <name>   - Debug pod issues"
