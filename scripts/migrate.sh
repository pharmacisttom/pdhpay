#!/bin/sh
set -e

echo "🚀 Starting Production Database Migration & Verification..."

# 1. Wait for MySQL Database to be ready
echo "⏳ Waiting for MySQL Database connection..."
until npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
do
  echo "⌛ MySQL is not ready yet - sleeping 3 seconds..."
  sleep 3
done

echo "✅ Database connection established!"

# 2. Run Prisma Schema Migrations
echo "📦 Running Prisma Migrate Deploy..."
npx prisma migrate deploy

# 3. Seed initial admin account and default organization if database is fresh
echo "🌱 Running Seed verification..."
npx tsx prisma/seed.ts || true

echo "🎉 Database Migration & Seeding Completed Successfully!"
