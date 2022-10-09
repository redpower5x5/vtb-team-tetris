FROM node:16-alpine3.12
WORKDIR /usr/src/app
COPY src ./src
COPY assets ./assets
COPY package.json ./package.json
COPY .babelrc ./.babelrc
COPY webpack.config.js ./webpack.config.js

ARG APP_HOST_IP_ADDRESS

ENV APP_HOST_IP_ADDRESS $APP_HOST_IP_ADDRESS

RUN npm install && npm run build

ENTRYPOINT ["npm", "run", "serve"]

