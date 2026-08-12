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

# Remove default content
RUN rm -rf /usr/share/nginx/html/*

# Install wget for health checks
RUN apk add --no-cache wget

# Copy dist to /quiz subpath (for non-stripped proxy)
RUN mkdir -p /usr/share/nginx/html/quiz
COPY --from=build /app/dist /usr/share/nginx/html/quiz

# Also copy dist to root (for stripped proxy)
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
