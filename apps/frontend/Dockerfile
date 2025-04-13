FROM node:21-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Run turbo (will prune the lockfile to only include target dependencies)
RUN yarn global add turbo@^2.1.1
COPY . .
RUN turbo prune dashboard --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN yarn install
RUN yarn list postcss

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/apps/frontend/.env ./apps/frontend/.env
COPY --from=builder /app/apps/frontend/next.config.ts ./apps/frontend/next.config.ts
COPY --from=builder /app/apps/frontend/postcss.config.cjs ./apps/frontend/postcss.config.cjs
ENV NEXT_TELEMETRY_DISABLED 1


RUN yarn turbo run build --filter=frontend...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a runner user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD node apps/dashboard/server.js