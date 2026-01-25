# Variables (Values will be read from terraform.tfvars)
variable "supabase_password" { type = string, sensitive = true }
variable "db_url"            { type = string }
variable "db_username"       { type = string }
variable "clerk_issuer_uri"  { type = string }

provider "aws" {
  region = "ap-southeast-1"
}

# 1. ECR Repositories
resource "aws_ecr_repository" "backend" {
  name = "saas-backend"
  force_delete = true
}

resource "aws_ecr_repository" "frontend" {
  name = "saas-frontend"
  force_delete = true
}

# 2. IAM Role for App Runner
resource "aws_iam_role" "apprunner_role" {
  name = "apprunner-ecr-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "build.apprunner.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_policy" {
  role       = aws_iam_role.apprunner_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# 3. Backend Service
resource "aws_apprunner_service" "backend" {
  service_name = "inventory-backend"
  source_configuration {
    authentication_configuration { access_role_arn = aws_iam_role.apprunner_role.arn }
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
        }
      }
    }
  }
}

# 4. Frontend Service
resource "aws_apprunner_service" "frontend" {
  service_name = "inventory-frontend"
  source_configuration {
    authentication_configuration { access_role_arn = aws_iam_role.apprunner_role.arn }
    image_repository {
      image_identifier      = "${aws_ecr_repository.frontend.repository_url}:latest"
      image_repository_type = "ECR"
      image_configuration { port = "80" }
    }
  }
}