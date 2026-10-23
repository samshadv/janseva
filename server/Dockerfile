# Stage 1: Dependencies installation
FROM node:20-alpine AS dependencies
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for graceful signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules from dependencies stage and copy source code
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Run as non-privileged node user for security
USER node

EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
