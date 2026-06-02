# AWS region for all resources
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

# Environment name (dev, staging, prod)
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Project name prefix for all resources
variable "project_name" {
  description = "Project name used as prefix for resource names"
  type        = string
  default     = "taskflow"
}

# VPC CIDR block
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# EKS cluster version
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

# Node group instance types
variable "node_instance_types" {
  description = "EC2 instance types for EKS node group"
  type        = list(string)
  default     = ["t3.medium"]
}

# Desired number of worker nodes
variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

# Maximum number of worker nodes
variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 3
}

# Minimum number of worker nodes
variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

# RDS instance class
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# RDS allocated storage in GB
variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# Database master username
variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "taskflow_admin"
  sensitive   = true
}

# Database master password
variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Database name
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "taskflow"
}
