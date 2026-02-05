variable "supabase_password" {
  type      = string
  sensitive = true
}

variable "db_url" {
  type = string
}

variable "db_username" {
  type = string
}

variable "clerk_issuer_uri" {
  type = string
}

variable "clerk_secret_key" {
  type      = string
  sensitive = true
}

variable "redis_host" {
  type = string
}

variable "redis_port" {
  type = string
}

variable "redis_password" {
  type      = string
  sensitive = true
}

# 1. ECR Repositories
resource "aws_ecr_repository" "backend" {
  name         = "saas-backend"
  force_delete = true
}

resource "aws_ecr_repository" "frontend" {
  name         = "saas-frontend"
  force_delete = true
}

# 2. Access Role (ECR Access) - UPDATED TRUST POLICY
resource "aws_iam_role" "apprunner_service_role" {
  name = "apprunner-ecr-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = [
          "build.apprunner.amazonaws.com",
          "tasks.apprunner.amazonaws.com"
        ]
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_policy" {
  role       = aws_iam_role.apprunner_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# 3. Instance Role (Runtime Bedrock Access)
resource "aws_iam_role" "apprunner_instance_role" {
  name = "apprunner-instance-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "tasks.apprunner.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "bedrock_access" {
  name = "BedrockInvokeAccess"
  role = aws_iam_role.apprunner_instance_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream", "bedrock:ListFoundationModels"]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# 4. Backend Service
resource "aws_apprunner_service" "backend" {
  service_name = "inventory-backend"

  source_configuration {
    authentication_configuration {
        access_role_arn = aws_iam_role.apprunner_service_role.arn
    }
    image_repository {
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = "8080"
        runtime_environment_variables = {
          DB_URL           = var.db_url
          DB_USERNAME      = var.db_username
          DB_PASSWORD      = var.supabase_password
          CLERK_ISSUER_URI = var.clerk_issuer_uri
          CLERK_SECRET_KEY = var.clerk_secret_key
          REDIS_HOST       = var.redis_host
          REDIS_PORT       = var.redis_port
          REDIS_PASSWORD   = var.redis_password
          REDIS_SSL         = "true"
          SPRING_AI_BEDROCK_AWS_REGION = "ap-southeast-1"
          AWS_REGION                  = "ap-southeast-1"
        }
      }
    }
  }

  instance_configuration {
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn
    cpu    = "1024"
    memory = "2048"
  }
}

# 5. Frontend Service
resource "aws_apprunner_service" "frontend" {
  service_name = "inventory-frontend"
  source_configuration {
    authentication_configuration {
        access_role_arn = aws_iam_role.apprunner_service_role.arn
    }
    image_repository {
      image_identifier      = "${aws_ecr_repository.frontend.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration { port = "80" }
    }
  }
}

output "live_backend_url" {
  value = "https://${aws_apprunner_service.backend.service_url}"
}