FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --production=false --force

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 오픈
EXPOSE 80

# 서버 실행
CMD ["nginx", "-g", "daemon off;"]