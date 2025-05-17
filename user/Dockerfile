FROM node:20.19.2-alpine3.20

WORKDIR /app
COPY package.json .
RUN npm install --only=prod
COPY . .

CMD ["npm", "run", "prod"]