# Base
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

# Dependencies (with dev deps, needed for build)
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build
FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Production dependencies only
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

# Final runtime image
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Create logs dir and give the nodejs user ownership of /app
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE ${PORT}

CMD ["node", "dist/main.js"]