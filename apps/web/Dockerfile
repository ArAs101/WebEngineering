# Stage 1: Build the React application
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

ENV HUSKY=0
RUN npm ci

COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/vite.config.mjs ./apps/web/vite.config.mjs
COPY apps/web/src ./apps/web/src

RUN npm run build -w apps/web

# Stage 2: Serve the built files with nginx
FROM nginx:stable-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
