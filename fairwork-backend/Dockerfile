# --- Production Dockerfile for FairWork Backend ---
FROM node:20-alpine AS base

WORKDIR /app

# Install curl for container healthchecks
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Security: Run as non-root user
USER node

# Expose HTTP port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Health check matching FairWork /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]
