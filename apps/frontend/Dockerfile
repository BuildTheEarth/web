FROM node:22-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Run turbo (will prune the lockfile to only include target dependencies)
RUN yarn global add turbo@^2.1.1
COPY . .
RUN turbo prune frontend --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN corepack enable
RUN yarn install

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/apps/frontend/.env ./apps/frontend/.env
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/next.config.js
COPY --from=builder /app/apps/frontend/next-seo.config.ts ./apps/frontend/next-seo.config.ts
COPY --from=builder /app/apps/frontend/postcss.config.js ./apps/frontend/postcss.config.js
COPY --from=builder /app/apps/frontend/next-i18next.config.js ./apps/frontend/next-i18next.config.js
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
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD node apps/frontend/server.js