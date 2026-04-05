# Development stage
FROM node:22-alpine AS development

WORKDIR /usr/src/app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (use npm for compatibility)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json bun.lock ./

# Install production dependencies only
RUN npm install --only=production

COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/main"]
