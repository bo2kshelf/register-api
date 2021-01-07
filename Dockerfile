FROM node:14.15.3@sha256:bac289a6f393990e759c672d5f567553c697255d1fb858e2c62d086a2dfae44a AS build

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:14.15.3-slim@sha256:2a9c12b10d34bcf880d303500a9262359b6ee096f08aa73215c865b3df3a23a3

ENV PORT 4000

WORKDIR /app

COPY package.json yarn.lock ./
COPY --from=build /app/dist ./dist

RUN yarn install --frozen-lockfile --production

EXPOSE $PORT

CMD ["node", "dist/main.js"]
