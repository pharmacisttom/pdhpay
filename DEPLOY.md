# 🚀 PDHPAY - Hostinger VPS & Docker Deployment Guide

เอกสารคู่มือสำหรับการ Deploy โปรเจกต์ **PDHPAY (Next.js 16 + TypeScript + MySQL 8.0 + Nginx SSL)** บนเซิร์ฟเวอร์ **VPS Hostinger (Ubuntu)** โดยใช้ **Docker & Docker Compose Multi-stage Build** เพื่อความเหมือนกัน 100% ระหว่าง Localhost และ Production

---

## 📋 สารบัญ
1. [ส่วนที่ 1: การเตรียมการบน Localhost](#ส่วนที่-1-การเตรียมการบน-localhost)
2. [ส่วนที่ 2: การเตรียมเซิร์ฟเวอร์ VPS Hostinger](#ส่วนที่-2-การเตรียมเซิร์ฟเวอร์-vps-hostinger)
3. [ส่วนที่ 3: ขั้นตอนการ Deploy ขึ้น VPS](#ส่วนที่-3-ขั้นตอนการ-deploy-ขึ้น-vps)
4. [ส่วนที่ 4: Pre-Deployment Checklist](#ส่วนที่-4-pre-deployment-checklist)
5. [ส่วนที่ 5: การ Backup & Monitoring](#ส่วนที่-5-การ-backup--monitoring)

---

## 💻 ส่วนที่ 1: การเตรียมการบน Localhost

### 1.1 ทดสอบ Build Docker Image บน Localhost
```bash
# Build Docker Image ด้วย Multi-stage Dockerfile
npm run docker:build

# หรือใช้คำสั่ง Docker โดยตรง
docker build -t pdhpay:latest .
```

### 1.2 รันระบบ Web + MySQL บน Localhost ด้วย Docker Compose
```bash
# รัน Containers (Web + MySQL 8.0)
npm run docker:up

# ตรวจสอบการทำงานของ Containers
docker compose ps

# ดู Logs การทำงานแบบ Real-time
npm run docker:logs

# หยุดการทำงานของ Containers
npm run docker:down
```

---

## ☁️ ส่วนที่ 2: การเตรียมเซิร์ฟเวอร์ VPS Hostinger (Ubuntu)

เข้าสู่เซิร์ฟเวอร์ VPS ผ่าน SSH:
```bash
ssh root@your-vps-ip
```

### 2.1 ติดตั้ง Docker & Docker Compose
```bash
# อัปเดตแพ็กเกจระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker Engine และ Docker Compose Plugin
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เปิดใช้งาน Docker Service
sudo systemctl enable docker
sudo systemctl start docker
```

### 2.2 ติดตั้ง Nginx & Certbot (Let's Encrypt SSL)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.3 ตั้งค่า Firewall (UFW)
เปิดเฉพาะพอร์ตที่จำเป็นสำหรับการใช้งานเพื่อความปลอดภัยสูงสุด:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 🚀 ส่วนที่ 3: ขั้นตอนการ Deploy ขึ้น VPS Hostinger

### 3.1 สร้าง Docker Network ภายนอกสำหรับ Nginx
```bash
docker network create web-network
```

### 3.2 Clone โปรเจกต์ หรือ คัดลอกไฟล์ขึ้น VPS
```bash
cd /var/www
git clone https://github.com/pharmacisttom/pdhpay.git
cd pdhpay
```

### 3.3 สร้างไฟล์ `.env.production` บน VPS (ห้าม Commit ขึ้น Git)
```bash
cp .env.example .env.production
nano .env.production
```
*ระบุค่ารหัสผ่าน MySQL, JWT_SECRET, และ URL โดเมนจริง เช่น:*
```env
NEXT_PUBLIC_APP_URL="https://pdhpay.pluakdaenghospital.cloud"
NEXT_PUBLIC_API_URL="https://pdhpay.pluakdaenghospital.cloud/api/v1"
DATABASE_URL="mysql://pdh_user:YourStrongSecurePassword123!@mysql:3306/pdhpay"
AUTH_SECRET="CHANGE_ME_MIN_32_CHAR_RANDOM_SECRET_STRING"
JWT_SECRET="CHANGE_ME_MIN_32_CHAR_RANDOM_SECRET_STRING"
TOTP_ENCRYPTION_KEY="CHANGE_ME_BASE64_32_BYTES_KEY=="
```

### 3.4 รัน Production Containers
```bash
# รัน Production Docker Compose
docker compose -f docker-compose.prod.yml up -d --build

# รัน Migration ฐานข้อมูลครั้งแรก
docker compose -f docker-compose.prod.yml exec web sh scripts/migrate.sh
```

### 3.5 ตั้งค่า Nginx Reverse Proxy & ออกใบรับรอง SSL
```bash
# คัดลอกไฟล์คอนฟิก Nginx ไปยังเซิร์ฟเวอร์
sudo cp nginx/hostinger.conf /etc/nginx/sites-available/pdhpay.conf
sudo ln -s /etc/nginx/sites-available/pdhpay.conf /etc/nginx/sites-enabled/

# ทดสอบไวยากรณ์ Nginx และ Reload
sudo nginx -t
sudo systemctl reload nginx

# ออกใบรับรอง SSL ฟรีด้วย Certbot
sudo certbot --nginx -d pdhpay.pluakdaenghospital.cloud
```

---

## ✅ ส่วนที่ 4: Pre-Deployment Checklist

ก่อนทำการเปิดใช้งาน Production กรุณาตรวจสอบรายการต่อไปนี้:
- [x] **`NEXT_PUBLIC_APP_URL`** ตั้งค่าเป็นโดเมนจริง (`https://...`)
- [x] **รหัสผ่าน MySQL** เปลี่ยนเป็นรหัสผ่านที่คาดเดายากและไม่มีอยู่ในโค้ด
- [x] **Secret Keys** สร้าง `AUTH_SECRET` และ `JWT_SECRET` ใหม่
- [x] **`.env` files** ปรากฏอยู่ใน `.gitignore` และไม่ถูกอัปโหลดขึ้น GitHub
- [x] **Healthcheck** ปลายทาง `/api/health` คืนค่า `{"status":"ok"}`
- [x] **SSL Certificate** ทำงานสมบูรณ์บน HTTPS (443)

---

## 🛠️ ส่วนที่ 5: การ Backup และ Monitoring

### 5.1 การ Backup ฐานข้อมูล MySQL ประจำวัน
```bash
# สำรองข้อมูลด้วยสคริปต์ db:backup
npm run db:backup

# หรือรันคำสั่ง mysqldump จาก Docker Container โดยตรง
docker exec pdhpay-mysql-prod mysqldump -u pdh_user -p"YourPassword" pdhpay > backups/backup_$(date +%Y%m%m_%H%M%S).sql
```

### 5.2 การตรวจสอบ Logs Container
```bash
# ดู logs ของ Container Web
docker compose -f docker-compose.prod.yml logs -f web

# ดู logs ของ Container MySQL
docker compose -f docker-compose.prod.yml logs -f mysql
```

### 5.3 ขั้นตอนการอัปเดตเวอร์ชันใหม่ (Zero-Downtime Update)
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build --no-deps web
```
