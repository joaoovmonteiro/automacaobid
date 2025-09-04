FROM node:23.11.0

FROM node:23.11.0-bookworm-slim

# Instala Chromium compatível com ARM (funciona no Mac M1/M2 e ARM servers)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Define caminho para o Chromium do sistema
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build
RUN npm prune --omit=dev


ENV NODE_ENV=production

CMD ["npm", "run", "start"]
