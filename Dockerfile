FROM node:23.11.0-alpine


WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build
RUN npm prune --omit=dev


ENV NODE_ENV=production

CMD ["npm", "run", "start"]