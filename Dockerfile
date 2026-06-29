# Base image with pnpm support
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Builder stage
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies (cached)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN pnpm --filter web exec prisma generate

# Build the workspace
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
RUN pnpm build


# 2. Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy workspace build artifacts and dependencies
COPY --from=builder /app /app

EXPOSE 3000

# Run Next.js start command
CMD ["pnpm", "--filter", "web", "start"]
