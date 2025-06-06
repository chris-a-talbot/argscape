# Multi-stage Dockerfile for ARGscape frontend
# Supports both development and production builds

FROM node:20-alpine AS base

# Install dumb-init for better signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --progress=false

# Development stage
FROM base AS development

# Copy source code for development (with hot reload)
COPY . .

# Expose development port
EXPOSE 5173

# Use dumb-init for better signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Production build stage
FROM base AS build

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose production port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]