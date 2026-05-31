# Dockerfile for MDit
# Multi-stage build: frontend + backend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY package.json package-lock.json vite.config.ts tsconfig.* ./
COPY src/ ./src/
COPY index.html ./
COPY public/ ./public/

# Install dependencies
RUN npm install --legacy-peer-deps

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Copy server files
COPY server/package.json server/package-lock.json ./
COPY server/src/ ./src/

# Install server dependencies
RUN npm install --legacy-peer-deps

# Build TypeScript
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./frontend-dist

# Copy built backend from stage 2
COPY --from=backend-builder /app/server/dist ./server-dist
COPY --from=backend-builder /app/server/package.json ./server/package.json
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# Copy server entry point
COPY server/src/index.ts ./server-dist/index.ts

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Start the server
CMD ["node", "./server-dist/index.js"]
