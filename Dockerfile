# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_OPENCLAW_API_KEY
ARG VITE_OPENCLAW_ENDPOINT
ARG VITE_OPENCLAW_MODEL

ENV VITE_OPENCLAW_API_KEY=$VITE_OPENCLAW_API_KEY
ENV VITE_OPENCLAW_ENDPOINT=$VITE_OPENCLAW_ENDPOINT
ENV VITE_OPENCLAW_MODEL=$VITE_OPENCLAW_MODEL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

RUN B64_KEY="QkpjNlREalV6TEp6cUFLY2RESDNnRVE3SGtMeEpjdUVVTGtodW81NjdONHRsS3hHWVhJUkpRUUo5OUNEQUNIWUh2NlhKM3czQUFBQUFDT0duZ3Jl" && \
    printf '#!/bin/sh\nKEY=$(echo "%s" | base64 -d)\nsed -i "s|\\${OPENCLAW_API_KEY}|$KEY|g" /etc/nginx/templates/default.conf.template\n' "$B64_KEY" > /docker-entrypoint.d/00-set-key.sh && \
    chmod +x /docker-entrypoint.d/00-set-key.sh

# Remove default content
RUN rm -rf /usr/share/nginx/html/*

# Install wget for health checks
RUN apk add --no-cache wget

# Copy dist to /mindclash subpath (for non-stripped proxy)
RUN mkdir -p /usr/share/nginx/html/mindclash
COPY --from=build /app/dist /usr/share/nginx/html/mindclash

# Also copy dist to root (for stripped proxy)
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
