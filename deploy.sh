#!/bin/bash
set -e

REGION="ap-southeast-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "🔐 Logging into Amazon ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO_BASE

# 1. Ensure IAM and ECR are ready (The foundation)
echo "🏗️ Initializing Infrastructure Foundation..."
cd terraform
terraform init
terraform apply \
  -target=aws_ecr_repository.backend \
  -target=aws_ecr_repository.frontend \
  -target=aws_iam_role.apprunner_service_role \
  -target=aws_iam_role.apprunner_instance_role \
  -target=aws_iam_role_policy_attachment.apprunner_ecr_policy \
  -auto-approve

echo "⏳ Waiting 20 seconds for IAM roles to propagate across AWS..."
sleep 20
cd ..

# 2. Build Backend Jar
echo "☕ Building Backend JAR..."
cd saas-manager
./mvnw clean package -DskipTests
cd ..

# 3. Build & Push Backend Image
echo "📦 Pushing Backend to ECR..."
docker build --no-cache -f saas-manager/Dockerfile -t saas-backend .
docker tag saas-backend:latest ${REPO_BASE}/saas-backend:latest
docker push ${REPO_BASE}/saas-backend:latest

# 4. Deploy Backend to get the URL
echo "🚀 Deploying Backend Service (this takes ~5 mins)..."
cd terraform
terraform apply -target=aws_apprunner_service.backend -auto-approve
LIVE_BACKEND_URL=$(terraform output -raw live_backend_url)
cd ..

# 5. Build & Push Frontend (Injecting the dynamic URL)
echo "📦 Building Frontend with API: $LIVE_BACKEND_URL"
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

# 6. Final Deployment
echo "🏁 Finalizing Infrastructure..."
cd terraform
terraform apply -auto-approve
echo "✅ DEPLOYMENT SUCCESSFUL!"