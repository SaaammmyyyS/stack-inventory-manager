# 📦 stack-inventory-manager

A professional, full-stack SaaS inventory management system. This monorepo contains a high-performance **Spring Boot** backend, a modern **React (Vite)** frontend, and **Terraform** infrastructure code for AWS deployment.

---

## 🚀 Tech Stack

### Frontend
* **Framework:** React 19+ (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Auth:** Clerk (Identity & User Management)

### Backend (`saas-manager`)
* **Framework:** Spring Boot 4
* **Language:** Java 21 (Amazon Corretto)
* **Database:** Supabase (PostgreSQL)
* **Security:** Spring Security + JWT Validation

### Infrastructure & DevOps
* **Cloud:** AWS (ap-southeast-1)
* **Compute:** AWS App Runner
* **IaC:** Terraform
* **Containerization:** Docker (Multi-stage builds)


## 🛠️ Getting Started

### Prerequisites
* **Docker Desktop** installed.
* **Java 21** & **Maven** (for local backend dev).
* **Node.js 20+** (for local frontend dev).
* **AWS CLI** configured for `ap-southeast-1`.

### Local Development (Docker Compose)
The easiest way to run the entire stack locally:

```bash
# From the root directory
docker-compose up --build
```

---

### Deployment & Environment
This final section covers the ECR/App Runner flow you are using.

```markdown
##  Deployment (AWS)

### 1. Build and Push to ECR
Ensure you are authenticated with AWS ECR, then run the build commands:
```

```bash
# Build Backend
docker build -t saas-backend ./saas-manager
docker tag saas-backend:latest YOUR_ACCOUNT_[ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-backend:latest](https://ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-backend:latest)
docker push YOUR_ACCOUNT_[ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-backend:latest](https://ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-backend:latest)

# Build Frontend
docker build -t saas-frontend ./frontend
docker tag saas-frontend:latest YOUR_ACCOUNT_[ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-frontend:latest](https://ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-frontend:latest)
docker push YOUR_ACCOUNT_[ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-frontend:latest](https://ID.dkr.ecr.ap-southeast-1.amazonaws.com/saas-frontend:latest)
```
