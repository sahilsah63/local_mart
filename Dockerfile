FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/artifacts/api-server

RUN pnpm run build

EXPOSE 5000

CMD ["node", "dist/index.mjs"]