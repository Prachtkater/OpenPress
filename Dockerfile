# ── Stage 1: Install dependencies ─────────────────────────────
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app
COPY package.json bun.lock ./
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/feature-contact-form/package.json packages/feature-contact-form/package.json
COPY packages/feature-booking/package.json packages/feature-booking/package.json
COPY packages/feature-gallery/package.json packages/feature-gallery/package.json
COPY packages/feature-media/package.json packages/feature-media/package.json
COPY packages/theme-tailwind-plus/package.json packages/theme-tailwind-plus/package.json
COPY packages/theme-material-expressive/package.json packages/theme-material-expressive/package.json
COPY playground/package.json playground/package.json

RUN bun install --frozen-lockfile --production

# ── Stage 2: Build ───────────────────────────────────────────
FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the playground (production Nuxt app)
RUN cd playground && bun x nuxi build

# ── Stage 3: Production runtime ──────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Nuxt production server runs on Node.js (Nitro)
COPY --from=builder /app/playground/.output ./.output
COPY --from=builder /app/playground/content ./content

# Git is needed for the git-backed storage engine
RUN apk add --no-cache git && \
    git config --global user.name "OpenPress" && \
    git config --global user.email "openpress@openpress.dev" && \
    git config --global init.defaultBranch main

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
