#!/bin/bash
set -e

REGION="ap-southeast-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "🔐 Logging into Amazon ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO_BASE

# 1. Ensure Infrastructure is partially ready (ECR)
echo "🏗️ Setting up ECR repositories..."
cd terraform
terraform apply -target=aws_ecr_repository.backend -target=aws_ecr_repository.frontend -auto-approve
cd ..

# 2. REBUILD BACKEND JAR
echo "☕ Compiling latest Java code..."
cd saas-manager
./mvnw clean package -DskipTests
cd ..

# 3. Build and Push Backend
echo "📦 Building & Pushing Backend Image..."
docker build --no-cache \
  -f saas-manager/Dockerfile \
  -t saas-backend \
  .
docker tag saas-backend:latest ${REPO_BASE}/saas-backend:latest
docker push ${REPO_BASE}/saas-backend:latest

# 4. Update Backend Service to get the URL
echo "🚀 Deploying Backend Service..."
cd terraform
terraform apply -target=aws_apprunner_service.backend -auto-approve
# Grab the live URL for the frontend build
LIVE_BACKEND_URL=$(terraform output -raw live_backend_url)
cd ..

# 5. Build and Push Frontend
echo "📦 Building Frontend with API URL: $LIVE_BACKEND_URL"
docker build --no-cache \
  -f frontend/Dockerfile \
  -t saas-frontend \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="pk_test_bm9ibGUtbXVzdGFuZy0zNS5jbGVyay5hY2NvdW50cy5kZXYk" \
  --build-arg VITE_API_BASE_URL="$LIVE_BACKEND_URL" \
  --build-arg VITE_UPSTASH_REDIS_REST_URL="https://eminent-panther-44363.upstash.io" \
  --build-arg VITE_UPSTASH_REDIS_REST_TOKEN="Aa1LAAIncDI5N2ZiODMzZmU0MDI0Mjc4YjFmNDlkYWQ4ZDZhZjliZHAyNDQzNjM" \
  .

docker tag saas-frontend:latest ${REPO_BASE}/saas-frontend:latest
docker push ${REPO_BASE}/saas-frontend:latest

# 6. Final Apply (Deploys Frontend + connects everything)
echo "🏁 Finalizing Deployment..."
cd terraform
terraform apply -auto-approve
echo "✅ Deployment Complete!"