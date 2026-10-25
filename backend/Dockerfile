FROM node:26-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies to build
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:26-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
# npm is only needed to install; remove it so its bundled packages are not in the runtime image
RUN npm ci --only=production && npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY scripts/start.sh ./start.sh
RUN chmod +x start.sh && \
    sed -i 's/\r$//' start.sh

# Create uploads directory
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    let data = ''; \
    res.on('data', chunk => data += chunk); \
    res.on('end', () => { \
      try { \
        const health = JSON.parse(data); \
        process.exit(health.status === 'OK' ? 0 : 1); \
      } catch (e) { \
        process.exit(1); \
      } \
    }); \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["./start.sh"]
