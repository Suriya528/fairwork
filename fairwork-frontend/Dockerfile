# --- Production Multi-Stage Dockerfile for FairWork Frontend ---
# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
ARG VITE_API_URL
ARG VITE_CHAIN_ID
ARG VITE_ESCROW_ADDRESS
ARG VITE_USDC_ADDRESS
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CHAIN_ID=${VITE_CHAIN_ID}
ENV VITE_ESCROW_ADDRESS=${VITE_ESCROW_ADDRESS}
ENV VITE_USDC_ADDRESS=${VITE_USDC_ADDRESS}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runtime

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
