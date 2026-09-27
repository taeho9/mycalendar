# Multi-stage Dockerfile for NestJS backend with Prisma ORM
FROM node:20-alpine AS builder

# Install tzdata and openssl for Prisma support on Alpine
RUN apk add --no-cache tzdata openssl

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Runtime
FROM node:20-alpine AS runner

# Install tzdata and openssl, set timezone
RUN apk add --no-cache tzdata openssl
ENV TZ=Asia/Seoul

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
