FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

ENV HUSKY=0
ENV CI=true

RUN npm install -g pnpm

RUN pnpm install --ignore-scripts

EXPOSE 3000

CMD ["pnpm", "start:dev"]