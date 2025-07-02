FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat openssl
WORKDIR /app

# Run turbo (will prune the lockfile to only include target dependencies)
RUN yarn global add turbo@^2.1.1
COPY . .
RUN turbo prune dashboard --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat openssl 
# This is only for prisma v5 because it only looks in /lib for openssl libaries
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3 
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
# RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/apps/dashboard/.env ./apps/dashboard/.env

ENV NEXT_TELEMETRY_DISABLED 1
RUN yarn turbo run build --filter=dashboard...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a runner user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD node apps/dashboard/server.js