FROM node:23.11.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETTEER_EXECUTABLE=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build
RUN npm prune --omit=dev


ENV NODE_ENV=production

CMD ["npm", "run", "start"]
