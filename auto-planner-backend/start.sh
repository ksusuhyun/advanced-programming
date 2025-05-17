#!/bin/sh

echo "✅ Current working dir: $(pwd)"
echo "✅ Prisma schema path: ./prisma/schema.prisma"
echo "✅ DATABASE_URL from env: $DATABASE_URL"
echo "✅ Checking if .env exists..."
ls -la .env

echo "📦 [1/3] Prisma Client 생성 시도..."
npx prisma generate

echo "🚀 [2/3] NestJS 서버 실행"
npm run start:prod
