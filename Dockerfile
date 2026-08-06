# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Dual-Port Production Environment (8084 Frontend + 8085 Backend)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8085

COPY package.json package-lock.json ./
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/vite.config.js ./vite.config.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.js ./tailwind.config.js

RUN mkdir -p storage/uploads

# Expose 8084 for Frontend and 8085 for Backend API
EXPOSE 8084
EXPOSE 8085

# Container health check on frontend port 8084
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8085/api/health || exit 1

# Start both Frontend (8084) and Backend (8085)
CMD ["npm", "start"]
