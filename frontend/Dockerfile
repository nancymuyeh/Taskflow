## Multi-stage build for Vite + React static site
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY src ./src
COPY index.html ./
RUN npm ci --silent && npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
