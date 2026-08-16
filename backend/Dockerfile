FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx tsc

EXPOSE 3001

CMD ["npm", "start"]
