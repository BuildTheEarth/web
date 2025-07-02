FROM node:22-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Run turbo (will prune the lockfile to only include target dependencies)
RUN yarn global add turbo@^2.1.1
COPY . .
RUN turbo prune api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY --from=builder /app/out/json/ .
# Enable corepack to use the correct Yarn version
RUN corepack enable
RUN corepack prepare yarn@4.9.1 --activate
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
RUN yarn turbo run build --filter=api...

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

EXPOSE 8899
CMD ["node", "apps/api/dist/index.js"]