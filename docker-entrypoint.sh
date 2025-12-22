#!/bin/sh
set -e

echo "🚀 Starting GeekFaka Docker Entrypoint..."

# 1. 强制切换 Prisma Provider 为 MySQL
# 这一步非常关键，因为源码默认是 SQLite，但 Docker 部署我们强制用 MySQL
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
    echo "🔄 Switching database provider from SQLite to MySQL..."
    sed -i 's/provider = "sqlite"/provider = "mysql"/g' prisma/schema.prisma
    
    echo "🔧 Patching schema for MySQL compatibility (Long Text)..."
    # Convert Product.description to @db.Text
    sed -i 's/description String?/description String? @db.Text/g' prisma/schema.prisma
    # Convert SystemSetting.value to @db.Text (for RSA keys)
    sed -i 's/value       String/value       String   @db.Text/g' prisma/schema.prisma
fi

# 2. 重新生成 Prisma Client
# 因为 provider 变了，必须重新生成 client 才能让代码识别 mysql 语法
echo "🛠️ Generating Prisma Client..."
npx prisma generate

# 3. 等待数据库准备就绪 (简单的重试机制)
# 生产环境建议使用 docker-compose 的 healthcheck 或 wait-for-it.sh
echo "⏳ Waiting for database connection..."
# 这里我们直接尝试迁移，失败会自动退出（依赖 restart: always 重试）

# 4. 执行数据库迁移 (部署模式)
echo "📦 Running database migrations..."
npx prisma migrate deploy

# 5. 启动 Next.js 服务
echo "✅ Starting Next.js server..."
exec node server.js
