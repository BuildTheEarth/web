FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY . .
RUN yarn dlx turbo@^2 prune dashboard --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat openssl 
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3 
WORKDIR /app

ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_ID
ARG NEXTAUTH_URL

ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_ID=$NEXT_PUBLIC_KEYCLOAK_ID
ENV NEXTAUTH_URL=$NEXTAUTH_URL

COPY --from=builder /app/out/json/ .
RUN yarn install

COPY --from=builder /app/out/full/ .
RUN --mount=type=secret,id=database_url \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    yarn turbo run build --filter=dashboard...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
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