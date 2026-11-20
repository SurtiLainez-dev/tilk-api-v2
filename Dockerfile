
FROM node:24-alpine AS development

WORKDIR /app

# Chromium para generar PDF con Puppeteer
RUN apk add --no-cache chromium fontconfig ttf-dejavu

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]


FROM node:24-alpine AS builder

WORKDIR /app

# Evitar descargar Chromium durante npm ci
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:24-alpine AS production

ENV NODE_ENV=production
ENV PORT=3001

# Chromium para generar PDF con Puppeteer
RUN apk add --no-cache chromium fontconfig ttf-dejavu

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]
