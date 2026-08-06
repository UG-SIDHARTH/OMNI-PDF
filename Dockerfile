# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for vite build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend bundle
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8085

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built dist from builder stage
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server ./server

# Create uploads storage directory
RUN mkdir -p storage/uploads

# Expose port 8085
EXPOSE 8085

# Container health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8085/api/health || exit 1

# Start Express server
CMD ["node", "server/index.js"]
