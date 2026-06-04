# TaskFlow Infrastructure Documentation

This directory contains Infrastructure as Code (IaC) for deploying the TaskFlow application using **Terraform** (AWS) and **Kubernetes** manifests for container orchestration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud (Terraform)                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │     VPC     │───▶│     EKS     │───▶│     RDS     │───▶│     ECR     │  │
│  │  (Network)  │    │ (Kubernetes)│    │ (Postgres)  │    │ (Registry)  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                           │                                                 │
│                           ▼                                                 │
│                  ┌─────────────────┐                                       │
│                  │  TaskFlow Pods  │                                       │
│                  │  ┌───┐ ┌───┐   │                                       │
│                  │  │FE │ │BE │   │                                       │
│                  │  └───┘ └───┘   │                                       │
│                  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Local / On-Premises                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │  Minikube   │ or │    Kind     │ or │  K3s/k3d    │                   │
│  │  (VM-based) │    │(Docker-based)│   │ (Lightweight)│                  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                   │
│         │                  │                  │                           │
│         └──────────────────┴──────────────────┘                             │
│                            │                                                │
│                  ┌─────────────────┐                                       │
│                  │  TaskFlow Pods  │                                       │
│                  │  ┌───┐ ┌───┐ ┌─┴─┐ │                                    │
│                  │  │FE │ │BE │ │DB │ │  (Includes in-cluster PostgreSQL)  │
│                  │  └───┘ └───┘ └───┘ │                                    │
│                  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
infrastructure/
├── terraform/                    # AWS Infrastructure (Terraform)
│   ├── main.tf                   # Main configuration, providers, modules
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Output values
│   └── modules/
│       ├── vpc/                  # Network infrastructure
│       ├── eks/                  # Kubernetes cluster
│       ├── rds/                  # Managed PostgreSQL
│       └── ecr/                  # Container registries
│
└── kubernetes/                   # Kubernetes manifests
    ├── namespace.yaml            # Logical isolation
    ├── configmap.yaml            # Non-sensitive config
    ├── secret.yaml               # Sensitive data (base64 encoded)
    ├── pvc.yaml                  # Persistent storage claim
    ├── backend-deployment.yaml   # Backend app (2 replicas)
    ├── backend-service.yaml      # Backend service (ClusterIP)
    ├── frontend-deployment.yaml  # Frontend app (2 replicas)
    ├── frontend-service.yaml     # Frontend service (ClusterIP)
    ├── db-deployment.yaml        # PostgreSQL (for local dev)
    ├── db-service.yaml           # Database service
    └── ingress.yaml              # HTTP routing rules
```

---

## Part 1: AWS Cloud Deployment (Terraform)

### Prerequisites

- AWS CLI installed and configured (`aws configure`)
- Terraform >= 1.0 installed
- kubectl installed
- AWS account with appropriate permissions

### Resources Created

| Module | Purpose | Key Resources |
|--------|---------|---------------|
| **VPC** | Network foundation | VPC, 2 public subnets, 2 private subnets, NAT Gateway, Internet Gateway, Route tables |
| **EKS** | Kubernetes cluster | EKS control plane, Managed node group (t3.medium), IAM roles |
| **RDS** | Managed database | PostgreSQL 15.4, Multi-AZ (prod), Encrypted storage, 7-day backups |
| **ECR** | Container registry | 2 repositories (frontend/backend), Image scanning, Lifecycle policies |

### Deployment Steps

#### 1. Configure Variables

Create a `terraform.tfvars` file:

```hcl
aws_region          = "us-east-1"
environment         = "dev"
project_name        = "taskflow"
vpc_cidr            = "10.0.0.0/16"
kubernetes_version  = "1.28"
node_instance_types = ["t3.medium"]
node_desired_size   = 2
node_max_size       = 3
node_min_size       = 1
db_instance_class   = "db.t3.micro"
db_allocated_storage = 20
db_username         = "taskflow_admin"
db_password         = "your-secure-password-here"
db_name             = "taskflow"
```

**Note:** Never commit `terraform.tfvars` to version control. Add it to `.gitignore`.

#### 2. Initialize and Deploy

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Note: Deployment takes 15-20 minutes (EKS cluster creation is slow)
```

#### 3. Configure kubectl

```bash
# Update kubeconfig to use the new EKS cluster
aws eks update-kubeconfig --region us-east-1 --name taskflow-dev-cluster

# Verify connection
kubectl get nodes
```

#### 4. Deploy Application to EKS

```bash
cd infrastructure/kubernetes

# Update the ConfigMap with RDS endpoint
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml

# IMPORTANT: Update secret.yaml with actual base64-encoded credentials
# echo -n "your-password" | base64
kubectl apply -f secret.yaml

# Skip db-deployment.yaml and db-service.yaml (using RDS instead)
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# For ingress, install an Ingress Controller first (see below)
```

#### 5. Configure Database Connection

Update `configmap.yaml` to use RDS:

```yaml
data:
  DB_HOST: "<terraform-output-db-endpoint>"  # From terraform output
  DB_PORT: "5432"
  DB_NAME: "taskflow"
```

Apply the updated ConfigMap:
```bash
kubectl apply -f configmap.yaml+
```

#### 6. Setup Ingress Controller (Choose one)

**Option A: AWS ALB Controller (Recommended for AWS)**

```bash
# Install ALB Controller using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --set clusterName=taskflow-dev-cluster \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --namespace kube-system

# Update ingress.yaml - uncomment AWS annotations
# Apply ingress
kubectl apply -f ingress.yaml
```

**Option B: NGINX Ingress Controller**

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# Apply ingress
kubectl apply -f ingress.yaml
```

### Useful Terraform Commands

```bash
# View outputs
terraform output

# View specific output
terraform output db_endpoint

# Destroy all resources (Caution: deletes everything!)
terraform destroy

# Format code
terraform fmt

# Validate configuration
terraform validate

# Refresh state
terraform refresh
```

### Cost Optimization Tips

- Use `t3.micro` for dev environments (instead of `t3.medium`)
- Set `node_desired_size = 1` for single-node dev clusters
- Use Spot instances for non-critical workloads
- Enable S3 backend for state to avoid local state loss

---

## Part 2: Local / On-Premises Deployment

For local development, testing, or small on-premise clusters, use the Kubernetes manifests with a local Kubernetes distribution.

### Prerequisites

- Docker installed
- kubectl installed
- One of: Minikube, Kind, K3s, or k3d

### Option A: Minikube (VM-based, most realistic)

#### Installation

```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# macOS
brew install minikube

# Windows (using Chocolatey)
choco install minikube
```

#### Start Cluster

```bash
# Start with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=kvm2  # Linux KVM
# OR
minikube start --cpus=4 --memory=8192 --driver=hyperkit  # macOS
# OR
minikube start --cpus=4 --memory=8192 --driver=hyperv   # Windows

# Enable ingress addon
minikube addons enable ingress

# Verify
minikube status
kubectl get nodes
```

#### Deploy TaskFlow

```bash
cd infrastructure/kubernetes

# Apply all manifests in order
kubectl apply -f namespace.yaml
kubectl apply -f pvc.yaml          # Storage for PostgreSQL
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml       # Update with real credentials first!
kubectl apply -f db-deployment.yaml
kubectl apply -f db-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f ingress.yaml
```

#### Access Application

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts (Linux/macOS) or C:\Windows\System32\drivers\etc\hosts (Windows)
# <minikube-ip> taskflow.example.com

# Access via browser
# http://taskflow.example.com

# Or use minikube tunnel for LoadBalancer
minikube tunnel
```

### Option B: Kind (Docker-based, lightweight)

Best for CI/CD pipelines and quick testing.

#### Installation

```bash
# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# macOS
brew install kind
```

#### Create Cluster with Ingress Support

```bash
# Create config file for Kind with ingress ports
cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
- role: worker
EOF

# Create cluster
kind create cluster --config kind-config.yaml --name taskflow

# Verify
kubectl cluster-info --context kind-taskflow
```

#### Install NGINX Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

#### Deploy TaskFlow

Same steps as Minikube (see above).

#### Access Application

```bash
# Kind exposes ports directly on localhost
# http://localhost (after adding '127.0.0.1 taskflow.example.com' to hosts)

# Or port-forward for quick access
kubectl port-forward -n taskflow svc/taskflow-frontend 8080:80
# Access: http://localhost:8080
```

### Option C: K3s / k3d (Production-grade lightweight)

K3s is a certified Kubernetes distribution for edge/IoT/CI. k3d runs K3s in Docker.

#### Using k3d (Recommended for local)

```bash
# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Create cluster with LoadBalancer support
k3d cluster create taskflow \
  --servers 1 \
  --agents 2 \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer" \
  --wait

# Verify
kubectl get nodes

# Deploy TaskFlow (same manifests as above)
# Access via http://localhost
```

#### Using K3s (Bare metal/VM)

```bash
# Install K3s on a VM or bare metal server
curl -sfL https://get.k3s.io | sh -

# For high availability (3 servers)
curl -sfL https://get.k3s.io | sh -s - server --cluster-init

# Get kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml

# Deploy TaskFlow using the same manifests
```

### Option D: VM or Small On-Premise Cluster

For deploying on a single VM or small cluster without cloud dependencies:

#### Single Node Setup

```bash
# On a VM with Ubuntu 22.04+
# 1. Install container runtime (containerd)
sudo apt update
sudo apt install -y containerd
sudo systemctl enable containerd

# 2. Install kubeadm, kubelet, kubectl
sudo apt install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# 3. Initialize cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# 4. Configure kubectl
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 5. Install CNI (Flannel)
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# 6. Remove taint to allow pods on control plane (single node only)
kubectl taint nodes --all node-role.kubernetes.io/control-plane-

# 7. Deploy TaskFlow
kubectl apply -f infrastructure/kubernetes/
```

#### Small Multi-Node Cluster

```bash
# On master node
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Get join command
kubeadm token create --print-join-command

# On each worker node
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# On master, deploy CNI and TaskFlow
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl apply -f infrastructure/kubernetes/
```

---

## Kubernetes Manifest Reference

| File | Purpose | Key Configuration |
|------|---------|-----------------|
| `namespace.yaml` | Resource isolation | `name: taskflow` |
| `configmap.yaml` | App configuration | `NODE_ENV`, `DB_HOST`, `API_URL` |
| `secret.yaml` | Sensitive data | Base64-encoded `DB_USERNAME`, `DB_PASSWORD` |
| `pvc.yaml` | Storage request | `storage: 10Gi`, `storageClassName: gp2` |
| `db-deployment.yaml` | PostgreSQL pod | `image: postgres:15-alpine`, `replicas: 1` |
| `db-service.yaml` | DB networking | `port: 5432`, `type: ClusterIP` |
| `backend-deployment.yaml` | Backend API | `replicas: 2`, `image: bertrand/taskflow-backend:latest` |
| `backend-service.yaml` | Backend networking | `port: 3000` |
| `frontend-deployment.yaml` | Frontend UI | `replicas: 2`, `image: bertrand/taskflow-frontend:latest` |
| `frontend-service.yaml` | Frontend networking | `port: 80` |
| `ingress.yaml` | HTTP routing | Routes `/api` to backend, `/` to frontend |

### Customization Guide

#### Update Container Images

Edit deployment files:

```yaml
# backend-deployment.yaml and frontend-deployment.yaml
spec:
  template:
    spec:
      containers:
        - name: backend
          image: your-registry/taskflow-backend:v1.2.3  # Update tag
```

#### Scale Replicas

```bash
# Scale via kubectl
kubectl scale deployment taskflow-backend --replicas=3 -n taskflow

# Or edit deployment file and reapply
kubectl apply -f backend-deployment.yaml
```

#### Update Secrets

```bash
# Generate base64 values
echo -n "new-password" | base64

# Edit secret.yaml with new values
kubectl apply -f secret.yaml

# Restart deployments to pick up new secrets
kubectl rollout restart deployment/taskflow-backend -n taskflow
```

#### Resource Limits

Current limits (suitable for small clusters):

| Component | Request CPU | Request Memory | Limit CPU | Limit Memory |
|-----------|-------------|----------------|-----------|--------------|
| Frontend | 50m | 64Mi | 250m | 128Mi |
| Backend | 100m | 128Mi | 500m | 256Mi |
| Database | 250m | 256Mi | 500m | 512Mi |

Adjust in deployment files based on your environment.

---

## Troubleshooting

### Terraform Issues

```bash
# State lock issues
terraform force-unlock <lock-id>

# Refresh state
terraform refresh

# Target specific resource
terraform apply -target=module.vpc

# Debug logs
export TF_LOG=DEBUG
terraform apply
```

### Kubernetes Issues

```bash
# Check pod status
kubectl get pods -n taskflow -o wide

# Check events
kubectl get events -n taskflow --sort-by='.lastTimestamp'

# Pod logs
kubectl logs -n taskflow deployment/taskflow-backend --tail=100

# Describe pod for details
kubectl describe pod -n taskflow <pod-name>

# Exec into container
kubectl exec -it -n taskflow deployment/taskflow-backend -- /bin/sh

# Check ingress
kubectl get ingress -n taskflow
kubectl describe ingress -n taskflow taskflow-ingress
```

### Common Problems

**Pod stuck in Pending:**
- Check resource requests vs available cluster resources
- Verify PVC is bound: `kubectl get pvc -n taskflow`

**ImagePullBackOff:**
- Verify image name and tag
- For private registries, add imagePullSecret

**CrashLoopBackOff:**
- Check logs: `kubectl logs -n taskflow <pod-name>`
- Verify ConfigMap/Secret values

**Ingress not working:**
- Verify Ingress Controller is installed
- Check ingress class name matches controller

---

## Security Considerations

1. **Secrets Management:**
   - Never commit real secrets to git
   - Use AWS Secrets Manager / Azure Key Vault / HashiCorp Vault for production
   - Consider Sealed Secrets or External Secrets Operator

2. **Network Security:**
   - Use private subnets for databases and worker nodes
   - Enable encryption in transit (TLS/HTTPS)
   - Restrict security group rules

3. **Pod Security:**
   - Run containers as non-root (already configured)
   - Use read-only root filesystems where possible
   - Enable Pod Security Standards

4. **Terraform State:**
   - Use remote state (S3 with DynamoDB locking) for team environments
   - Encrypt state at rest

---

## Next Steps

1. **CI/CD Integration:**
   - Automate Terraform deployments with GitHub Actions/GitLab CI
   - Implement GitOps with ArgoCD or Flux

2. **Monitoring:**
   - Install Prometheus + Grafana for metrics
   - Configure alerting rules

3. **Logging:**
   - Deploy ELK stack or Loki for log aggregation

4. **Scaling:**
   - Configure Horizontal Pod Autoscaler (HPA)
   - Setup Cluster Autoscaler for EKS

---

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Amazon EKS Documentation](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)
- [K3s Documentation](https://docs.k3s.io/)
