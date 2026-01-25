# 1. Configuration
REGION="ap-southeast-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_BASE="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# --- CONFIGURATION ---
CLERK_KEY="pk_test_your_actual_key_here"
# ---------------------

echo "------------------------------------------"
echo "🚀 AWS DEPLOYMENT MENU ($REGION)"
echo "------------------------------------------"
echo "1) Deploy Everything"
echo "2) Deploy Frontend Only"
echo "3) Deploy Backend Only"
read -p "Choose an option (1-3): " OPTION

# Function for Backend
deploy_backend() {
    echo "📦 Building Backend..."
    docker build -t saas-backend ./saas-manager
    echo "🏷️ Tagging Backend..."
    # Matches: name = "saas-backend" in main.tf
    docker tag saas-backend:latest ${REPO_BASE}/saas-backend:latest
    echo "⬆️ Pushing Backend to ECR..."
    docker push ${REPO_BASE}/saas-backend:latest
}

# Function for Frontend
deploy_frontend() {
    echo "📦 Building Frontend..."
    docker build -t saas-frontend \
      --build-arg VITE_CLERK_PUBLISHABLE_KEY="pk_test_bm9ibGUtbXVzdGFuZy0zNS5jbGVyay5hY2NvdW50cy5kZXYk" \
      ./frontend

    echo "🏷️ Tagging Frontend..."
    docker tag saas-frontend:latest ${REPO_BASE}/saas-frontend:latest
    echo "⬆️ Pushing Frontend to ECR..."
    docker push ${REPO_BASE}/saas-frontend:latest
}

# Login to ECR
echo "🔐 Logging into Amazon ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO_BASE

case $OPTION in
    1)
        deploy_backend
        deploy_frontend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend
        ;;
    *)
        echo "❌ Invalid option selected."
        exit 1
        ;;
esac

echo "✅ Task Finished! Go to App Runner console and click 'Deploy' if the status is 'Create Failed'."