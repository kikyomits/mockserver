FROM node:13-alpine

RUN mkdir -p /usr/app

WORKDIR /usr/app

COPY . /usr/app

RUN npm install --production && npm audit fix

EXPOSE 3000

CMD ["npm", "start"]