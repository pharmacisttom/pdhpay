#!/bin/bash
# ==============================================================================
# PDHPAY - Automated One-Click VPS Production Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS (Hostinger VPS)
# ==============================================================================

set -e

echo "🚀 ========================================================"
echo "   PDHPAY Production Deployment Script (VPS Server)"
echo "   ========================================================"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ กรุณารันสคริปต์นี้ด้วยสิทธิ์ root (เช่น: sudo bash scripts/setup-vps.sh)"
  exit 1
fi

# 2. System Packages & Docker Installation Check
echo "📦 1/6 Checking and Installing Dependencies (Docker & Nginx)..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw nginx certbot python3-certbot-nginx

if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

# 3. Setup Firewall (UFW)
echo "🔒 2/6 Configuring Firewall (UFW)..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Create Docker External Network
echo "🌐 3/6 Creating Docker External Network (web-network)..."
docker network inspect web-network >/dev/null 2>&1 || docker network create web-network

# 5. Production Environment Configuration
echo "⚙️  4/6 Checking Environment Configuration (.env.production)..."
if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production from template..."
    cp .env.example .env.production
    
    # Generate random secrets for Production Security
    AUTH_SEC=$(openssl rand -base64 32 | tr -d '\n')
    JWT_SEC=$(openssl rand -base64 32 | tr -d '\n')
    TOTP_KEY=$(openssl rand -base64 32 | tr -d '\n')
    DB_PASS=$(openssl rand -hex 16 | tr -d '\n')
    
    sed -i "s|CHANGE_ME_MIN_32_CHAR_RANDOM_SECRET_STRING_32_BYTES|${AUTH_SEC}|g" .env.production
    sed -i "s|CHANGE_ME_MIN_32_CHAR_RANDOM_SECRET_STRING_32_BYTES|${JWT_SEC}|g" .env.production
    sed -i "s|CHANGE_ME_BASE64_32_BYTES_KEY==|${TOTP_KEY}|g" .env.production
    sed -i "s|YourStrongSecurePassword123!|${DB_PASS}|g" .env.production
    
    echo "✅ .env.production created with unique generated secure secrets!"
    echo "⚠️  กรุณาตรวจสอบและแก้ไขโดเมนใน .env.production หากจำเป็น"
fi

# 6. Build and Launch Containers
echo "🐳 5/6 Building and Launching Docker Production Containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for MySQL database initialization..."
sleep 15

echo "🌱 Running Database Migration & Seeding..."
docker compose -f docker-compose.prod.yml exec -T web sh scripts/migrate.sh

# 7. Configure Nginx Reverse Proxy
echo "🌐 6/6 Configuring Nginx Reverse Proxy..."
if [ -f "nginx/hostinger.conf" ]; then
    cp nginx/hostinger.conf /etc/nginx/sites-available/pdhpay.conf
    ln -sf /etc/nginx/sites-available/pdhpay.conf /etc/nginx/sites-enabled/pdhpay.conf
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "✅ Nginx reverse proxy configured successfully!"
fi

echo "========================================================"
echo "🎉 FULL PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================================"
echo "📌 Next Steps:"
echo "1. Verify container status: docker compose -f docker-compose.prod.yml ps"
echo "2. Issues SSL Cert: certbot --nginx -d pdhpay.pluakdaenghospital.cloud"
echo "3. Test Health endpoint: curl http://localhost:3000/api/health"
echo "========================================================"
