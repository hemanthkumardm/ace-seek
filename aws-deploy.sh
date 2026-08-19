#!/usr/bin/env bash
# ==========================================
# AIC — one-shot deploy on AWS EC2 (or any Linux VPS)
# Run from the repository root:
#   sudo bash aws-deploy.sh
# ==========================================
set -euo pipefail

echo "=========================================="
echo " AIC AWS EC2 / VPS deployment"
echo "=========================================="

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Please run as root:  sudo bash aws-deploy.sh"
  exit 1
fi

# Detect OS family
. /etc/os-release 2>/dev/null || true
ID_LIKE_LOWER="$(echo "${ID_LIKE:-$ID}" | tr '[:upper:]' '[:lower:]')"
echo "→ OS: ${PRETTY_NAME:-unknown} ($ID_LIKE_LOWER)"

# ---- swap space ----
echo "[0/5] Creating 4GB Swap File (critical for AWS t2.micro)..."
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo "  Swap created."
else
  echo "  Swapfile already exists."
fi

# ---- packages ----
echo "[1/5] Installing packages (curl, git, firewall tools)..."
if echo "$ID_LIKE_LOWER" | grep -Eq 'debian|ubuntu'; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release git iptables-persistent wget
elif echo "$ID_LIKE_LOWER" | grep -Eq 'rhel|fedora|centos|ol|oracle'; then
  if command -v dnf >/dev/null 2>&1; then
    dnf -y install curl git wget firewalld iptables
  else
    yum -y install curl git wget firewalld iptables
  fi
  systemctl enable --now firewalld 2>/dev/null || true
else
  echo "Unknown distro — install curl git docker yourself, then re-run."
  exit 1
fi

# ---- host firewall (port 80) ----
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active --quiet firewalld 2>/dev/null; then
  firewall-cmd --permanent --add-service=http || firewall-cmd --permanent --add-port=80/tcp
  firewall-cmd --permanent --add-service=https || firewall-cmd --permanent --add-port=443/tcp
  firewall-cmd --reload
  echo "  firewalld: HTTP/HTTPS allowed"
elif command -v iptables >/dev/null 2>&1; then
  if ! iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
  fi
  if ! iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
    iptables -I INPUT 1 -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT
  fi
  if command -v netfilter-persistent >/dev/null 2>&1; then
    netfilter-persistent save || true
  elif [[ -d /etc/iptables ]]; then
    iptables-save > /etc/iptables/rules.v4 || true
  fi
  echo "  iptables: ACCEPT tcp/80 and tcp/443"
else
  echo "  WARN: no firewall-cmd/iptables found — open port 80 in cloud console only"
fi

echo "  Also open port 80 in AWS EC2 Console → Security Groups → Inbound Rules."

# ---- Docker ----
echo "[3/5] Installing Docker (if needed)..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  rm -f /tmp/get-docker.sh
else
  echo "  Docker already installed: $(docker --version)"
fi

# docker compose plugin
if ! docker compose version >/dev/null 2>&1; then
  echo "  Installing docker compose plugin..."
  if echo "$ID_LIKE_LOWER" | grep -Eq 'debian|ubuntu'; then
    apt-get install -y docker-compose-plugin || true
  elif command -v dnf >/dev/null 2>&1; then
    dnf -y install docker-compose-plugin || true
  fi
fi

systemctl enable --now docker 2>/dev/null || service docker start || true

# Allow common cloud users to use docker without sudo later
for u in opc ubuntu ec2-user admin azureuser; do
  if id "$u" &>/dev/null; then
    usermod -aG docker "$u" || true
    echo "  added $u to docker group"
  fi
done

# ---- OpenROAD durable storage & PDKs ----
echo "[3.5/5] Setting up OpenROAD durable storage and Sky130 PDK..."
mkdir -p /data/ace-openroad-jobs /data/volare
for u in opc ubuntu ec2-user admin azureuser; do
  if id "$u" &>/dev/null; then
    chown -R "$u:$u" /data 2>/dev/null || true
  fi
done
chmod -R 777 /data/ace-openroad-jobs /data/volare 2>/dev/null || true

# Install Python & Volare if available
if command -v python3 >/dev/null 2>&1; then
  if ! command -v volare >/dev/null 2>&1; then
    echo "  Installing Volare PDK manager..."
    python3 -m pip install --quiet volare || pip3 install --quiet volare || true
  fi
  if command -v volare >/dev/null 2>&1 && [ ! -d /data/volare/sky130A ]; then
    echo "  Downloading Sky130 PDK into /data/volare (this may take a couple minutes)..."
    volare enable --pdk sky130 --pdk-root /data/volare 2>/dev/null || echo "  Note: run 'volare enable --pdk sky130 --pdk-root /data/volare' after deploy"
  fi
fi

# Pre-pull OpenLane Docker image
echo "  Pulling OpenLane Docker image in background..."
docker pull efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a 2>/dev/null || true

# ---- repo root ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
if [[ ! -f docker-compose.yml || ! -f Dockerfile.web ]]; then
  echo "error: run this script from the AIC repository root (missing docker-compose.yml / Dockerfile.web)"
  exit 1
fi

# ---- build & run ----
echo "[4/5] Building and starting AIC (this may take several minutes first time)..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo "[5/5] Waiting for health..."
sleep 5
if curl -fsS --max-time 15 http://127.0.0.1/api/compile >/dev/null 2>&1; then
  echo "  health OK on http://127.0.0.1/api/compile"
else
  echo "  WARN: health check failed — see: docker compose logs -f aic-web"
fi

# Public IP guess
PUB_IP="$(curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null || curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || echo '<your-public-ip>')"

echo "=========================================="
echo " Deployment complete"
echo " Open:  https://ace-seek.com"
echo " Logs:  docker compose logs -f caddy aic-web"
echo " Stop:  docker compose down"
echo "=========================================="
echo "Remember: AWS EC2 Console must allow ingress TCP 80 and 443"
echo "  Security Groups → Edit Inbound Rules → Add: 0.0.0.0/0 port 80 and 443"
echo "=========================================="
