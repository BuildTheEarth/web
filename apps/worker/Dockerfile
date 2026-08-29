FROM node:22-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat ca-certificates
WORKDIR /app

# Run turbo
RUN corepack enable
RUN corepack prepare yarn@4.9.1 --activate
COPY . .
RUN yarn dlx turbo@2.1.1 prune worker --docker

# Add lockfile and package.json
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat ca-certificates
WORKDIR /app

# Install dependencies
COPY --from=builder /app/out/json/ .
# Enable corepack to use the correct Yarn version
RUN corepack enable
RUN corepack prepare yarn@4.9.1 --activate
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
RUN --mount=type=secret,id=database_url \
  sh -c 'export DATABASE_URL=$(cat /run/secrets/database_url) && yarn turbo run build --filter=worker...'
RUN rm -rf .turbo apps/*/.turbo packages/*/.turbo

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

CMD ["npx", "tsx", "--tsconfig", "apps/worker/tsconfig.runtime.json", "apps/worker/src/main.ts"]
