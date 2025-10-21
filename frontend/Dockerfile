# Multi-stage build for React frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install
COPY package*.json ./
# Use npm ci if package-lock.json exists, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then \
			npm ci --only=production; \
		else \
			npm install --production --no-audit --no-fund; \
		fi

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM nginx:stable-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port used by nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
