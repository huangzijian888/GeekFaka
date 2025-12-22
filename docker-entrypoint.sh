#!/bin/sh
set -e

echo "🚀 Starting GeekFaka Docker Entrypoint..."

# 1. 等待数据库准备就绪 (可选，Prisma migrate 默认会有一定的重试)
# echo "⏳ Waiting for database connection..."

# 2. 执行数据库迁移 (部署模式)
# 因为镜像已经预装了 prisma，这里直接调用，无需 npx
echo "📦 Running database migrations..."
prisma migrate deploy

# 3. 启动 Next.js 服务
echo "✅ Starting Next.js server..."
exec node server.js