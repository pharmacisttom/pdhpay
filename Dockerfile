# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lock files and package definitions
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# STAGE 2: Build Application
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client & Build Next.js Application
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 3: Production Runner (Minimal Container)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user "nextjs" (UID 1001) for enterprise security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure upload directory permissions
RUN mkdir -p /app/public/uploads/slips && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

# Container Healthcheck targeting /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
