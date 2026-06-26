# Stylus CRM

AI-assisted conversational CRM for WhatsApp vendors. Customers order in chat; Stylus drafts replies from your catalog and waits for your approval before anything is sent.

## Stack

- **Next.js** — webhook API + dashboard + marketing site
- **PostgreSQL + Prisma** — customers, products, orders, suggestions
- **Redis + BullMQ** — async AI processing
- **OpenWA** — WhatsApp gateway (Docker)
- **OpenAI / OpenRouter** — intent analysis and reply drafts

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (for Postgres, Redis, OpenWA)

## Local setup

### 1. Environment

```bash
cp .env.example .env
# Edit .env — set your AI key and VENDOR_PHONE_NUMBER
```

**OpenRouter (recommended if you don't have a direct OpenAI key):**

```env
OPENROUTER_API_KEY="sk-or-..."
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MODEL="openai/gpt-4o-mini"
```

**Direct OpenAI:**

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

### 2. Start infrastructure

```bash
pnpm docker:up
```

Services:

| Service    | Port  |
|------------|-------|
| PostgreSQL | 5432  |
| Redis      | 6379  |
| OpenWA     | 2785  |

### 3. Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Link WhatsApp (OpenWA)

1. Open `http://localhost:2785` in your browser
2. Scan the QR code with the vendor's WhatsApp (use the phone matching `VENDOR_PHONE_NUMBER`)
3. Wait for session status: connected

### 5. Run the app

```bash
pnpm dev
```

- Marketing site: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Webhook: `http://localhost:3000/api/webhook` (auto-registered on startup)

## Testing the order flow

1. Send a WhatsApp message to the vendor number from a customer phone
2. Worker analyzes the message and pings the **vendor** with a draft + `[1] [2] [3] edit` options
3. Vendor replies `1` to approve and send
4. Order is created, stock decremented, customer receives confirmation

## Useful commands

```bash
pnpm docker:up      # start Postgres, Redis, OpenWA
pnpm docker:down    # stop containers
pnpm db:migrate     # run Prisma migrations
pnpm db:seed        # seed vendor + sample products
pnpm db:studio      # open Prisma Studio
pnpm typecheck      # TypeScript check
```

## Monorepo — adding UI components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Components land in `packages/ui/src/components`.

```tsx
import { Button } from "@workspace/ui/components/button";
```
