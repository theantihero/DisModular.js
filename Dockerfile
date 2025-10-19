# Multi-stage Dockerfile with optimal layer caching
# Stage 1: Base dependencies
FROM node:20-alpine AS base

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/bot/package.json ./packages/bot/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (needed for workspaces to work properly)
RUN npm ci

# Stage 2: Prisma generation
FROM base AS prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Stage 3: Dashboard build
FROM base AS dashboard-builder
COPY packages/dashboard ./packages/dashboard/
COPY packages/shared ./packages/shared/
# Pass environment variables for Vite build
ARG VITE_API_URL
ARG VITE_DISCORD_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DISCORD_CLIENT_ID=$VITE_DISCORD_CLIENT_ID
RUN npm run build --workspace=@dismodular/dashboard

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init and OpenSSL for proper signal handling and Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and lock file
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/bot/package.json ./packages/bot/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma client from prisma stage and ensure proper permissions
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Fix permissions for node_modules to ensure Prisma can write to it
RUN chown -R nodejs:nodejs /app/node_modules

# Copy built dashboard from dashboard-builder stage
COPY --from=dashboard-builder --chown=nodejs:nodejs /app/packages/dashboard/dist ./packages/dashboard/dist

# Copy source code
COPY --chown=nodejs:nodejs packages/api ./packages/api/
COPY --chown=nodejs:nodejs packages/bot ./packages/bot/
COPY --chown=nodejs:nodejs packages/shared ./packages/shared/
COPY --chown=nodejs:nodejs prisma ./prisma/
COPY --chown=nodejs:nodejs plugins ./plugins/
COPY --chown=nodejs:nodejs scripts ./scripts/
COPY --chown=nodejs:nodejs assets ./assets/

# Create necessary directories
RUN mkdir -p data && chown nodejs:nodejs data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with database initialization
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "scripts/docker-startup.js"]