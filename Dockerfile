# Development stage
FROM oven/bun:1-alpine AS development

WORKDIR /usr/src/app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 3030

# Development command
CMD ["bun", "run", "start:dev"]

# Production stage
FROM oven/bun:1-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json bun.lock ./

# Install all dependencies (needed for build)
RUN bun install

COPY . .

# Build the application
RUN bun run build

# Install only production dependencies
RUN rm -rf node_modules && bun install --production

EXPOSE 3030

CMD ["bun", "dist/main.js"]
