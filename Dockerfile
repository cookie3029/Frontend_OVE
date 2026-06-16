FROM node:latest

RUN mkdir -p /opt/app

WORKDIR /opt/app

RUN npm install -g yarn

COPY package.json yarn.lock ./

COPY . .

RUN yarn

EXPOSE 5173  

CMD [ "yarn", "start"]