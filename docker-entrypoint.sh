#!/bin/sh
set -e

echo "🚀 Starting GeekFaka Docker Entrypoint..."

# Extract host and port from DATABASE_URL
# Assuming format mysql://user:pass@host:port/db
DB_HOST=$(echo $DATABASE_URL | awk -F@ '{print $2}' | awk -F: '{print $1}')
DB_PORT=$(echo $DATABASE_URL | awk -F: '{print $4}' | awk -F/ '{print $1}')

echo "⏳ Waiting for database at $DB_HOST:$DB_PORT..."

# Wait loop
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done

echo "✅ Database is up! Syncing schema..."
# Use db push instead of migrate deploy because we switched providers dynamically
# and don't have native MySQL migration files pre-generated.
prisma db push --accept-data-loss --skip-generate

# 3. 启动 Next.js 服务
echo "✅ Starting Next.js server..."
exec node server.js