FROM --platform=linux/arm/v7 node:18

WORKDIR /usr/src/taxamibackend/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]