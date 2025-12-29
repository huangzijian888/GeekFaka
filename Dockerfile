# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl
RUN yarn install --frozen-lockfile

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# [NEW] Perform MySQL transformation during build time
RUN if grep -q 'provider = "sqlite"' prisma/schema.prisma; then \
    sed -i 's/provider = "sqlite"/provider = "mysql"/g' prisma/schema.prisma && \
    sed -i 's/\(description[[:space:]]\+String?\)/\1 @db.LongText/g' prisma/schema.prisma && \
    sed -i 's/\(value[[:space:]]\+String\)/\1 @db.LongText/g' prisma/schema.prisma && \
    sed -i 's/\(content[[:space:]]\+String?\)/\1 @db.LongText/g' prisma/schema.prisma; \
    fi

# Ensure openssl is available for Prisma generation and build
RUN apk add --no-cache openssl

RUN npx prisma generate
RUN yarn build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL and PRISMA CLI for migrations
RUN apk add --no-cache openssl && \
    npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for runtime deployment
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./

# Allow entrypoint to write/modify prisma schema
RUN chmod -R 755 prisma
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Use the custom entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
