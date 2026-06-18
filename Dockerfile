# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder

ARG DATABASE_URL=postgresql://user:password@localhost:5432/badmin
ARG DATABASE_URL_UNPOOLED=postgresql://user:password@localhost:5432/badmin

ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_URL_UNPOOLED=$DATABASE_URL_UNPOOLED

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
