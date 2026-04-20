FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
RUN apk update && apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY . .
RUN yarn dlx turbo@^2 prune frontend --docker
# ---
FROM base AS installer
RUN apk update && apk add --no-cache libc6-compat openssl 
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3 
WORKDIR /app

ARG CMS_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_MAP_STYLE_URL


COPY --from=builder /app/out/json/ .
RUN yarn install

COPY --from=builder /app/out/full/ .
RUN --mount=type=secret,id=database_url \
    CMS_URL="$CMS_URL" \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    NEXT_PUBLIC_FRONTEND_URL="$NEXT_PUBLIC_FRONTEND_URL" \
    NEXT_PUBLIC_CDN_URL="$NEXT_PUBLIC_CDN_URL" \
    NEXT_PUBLIC_MAP_STYLE_URL="$NEXT_PUBLIC_MAP_STYLE_URL" \
    yarn turbo run build --filter=frontend...

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Don't run production as root for security reasons
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/frontend/server.js"]