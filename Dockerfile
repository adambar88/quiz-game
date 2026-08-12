# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Remove default content
RUN rm -rf /usr/share/nginx/html/*

# Install wget for health checks
RUN apk add --no-cache wget

# Copy dist to /quiz subpath (for non-stripped proxy)
RUN mkdir -p /usr/share/nginx/html/quiz
COPY --from=build /app/dist /usr/share/nginx/html/quiz

# Also copy dist to root (for stripped proxy)
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
