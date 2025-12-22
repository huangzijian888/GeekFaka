# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN yarn install --frozen-lockfile

# Stage 2: Build the app
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Client (Default SQLite for build check, will be overwritten in entrypoint)
RUN npx prisma generate
RUN yarn build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

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
ENV PORT 3000

# Use the custom entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
