# Multi-stage build for React frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Delete package-lock.json and do fresh install for Linux compatibility
RUN npm install

# Copy source and build
COPY . .

# Accept API URL as build argument
ARG REACT_APP_API_BASE
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

RUN npm run build

# Production image
FROM nginx:stable-alpine

# Remove default nginx config, static content, and entrypoint script that regenerates config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port used by nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
