FROM node:14.15.3@sha256:bac289a6f393990e759c672d5f567553c697255d1fb858e2c62d086a2dfae44a AS build

WORKDIR /app

COPY package.json yarn.lock ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:14.15.3-slim@sha256:ddc3c66e079c9725b54cea772b568b461fcfe58db0429f9d90e2b23d4006f3ef

ENV PORT 4000

WORKDIR /app

COPY package.json yarn.lock ./
COPY --from=build /app/dist ./dist

RUN yarn install --frozen-lockfile --production

EXPOSE $PORT

CMD ["node", "dist/main.js"]
