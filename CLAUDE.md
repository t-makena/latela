# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build

# AI Scraper (latela-ai-scrapers/)
npm run test         # Run scraper test
npm run test:single  # Test single product scrape
npm run test:url     # Test URL scrape
```

## Architecture

**Latela** is a South African personal finance management app built with React + Vite on the frontend and Supabase as the backend. It is a desktop-only web app (blocks viewports < 768px) that also ships as a native mobile app via Capacitor.

### Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI / shadcn-ui
- **Routing:** React Router DOM v6 (client-side SPA)
- **Server state:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Database/Auth:** Supabase (PostgreSQL + built-in auth)
- **AI:** `@anthropic-ai/sdk` — Claude Haiku 4.5 for WhatsApp chatbot; Claude used in price scrapers
- **Mobile:** Capacitor (iOS/Android wrapper around the web build)
- **i18n:** i18next with 11 South African languages (`src/locales/`)

### Key Directories
- `src/pages/` — One file per route (Index, Accounts, Budget, Compare, Scan, Goals, Chat, etc.)
- `src/components/` — Feature-grouped UI components; `src/components/ui/` contains shadcn base components
- `src/contexts/` — AuthContext, ColorPaletteContext, FloatingChatContext
- `src/hooks/` — Custom React hooks (data fetching, UI utilities)
- `src/lib/` — Pure utilities: validation schemas (`validationSchemas.ts`), `statementParser.ts`, `whatsapp.ts`, `i18n.ts`
- `src/integrations/supabase/` — Supabase client (`client.ts`) and auto-generated DB types (`types.ts`)
- `api/webhook/whatsapp/` — Next.js API route for the WhatsApp chatbot webhook
- `latela-ai-scrapers/` — Standalone Node project using Puppeteer + Claude to scrape grocery store prices

### Routing & Auth
`App.tsx` defines all routes wrapped in `ProtectedRoute`. `AuthContext` reads the Supabase session from localStorage and exposes it via context. Unauthenticated users are redirected to `/auth`.

Public routes: `/auth`, `/landing`, `/admin/waitlist`

### Database
Direct Supabase JS client — no ORM. Core tables: `profiles`, `transactions`, `budgets`, `savings_goals`, `accounts`, `calendar_events`, `whatsapp_sessions`, `whatsapp_messages`, `product_offers`, `current_specials`.

Use `src/integrations/supabase/types.ts` for type-safe DB access. Regenerate types via the Supabase CLI when the schema changes.

### WhatsApp Chatbot
`api/webhook/whatsapp/` handles Meta webhook calls:
- `GET` — webhook verification token check
- `POST` — message routing: predetermined command responses OR Claude Haiku for free-form Budget Buddy questions
- Webhook security: HMAC-SHA256 signature verified against `META_APP_SECRET`
- Session state stored in `whatsapp_sessions` table

### Price Scraper
`latela-ai-scrapers/` is a separate npm project. `fullStoreScraper.ts` uses Puppeteer (with stealth plugin) to scrape South African grocery stores and Claude AI to interpret page content. Results are written to Supabase. A GitHub Actions workflow (`scrape-prices.yml`) runs it daily.

### Environment Variables
| Variable | Used in |
|---|---|
| `VITE_SUPABASE_URL` | Frontend Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client |
| `VITE_SENTRY_DSN` | Sentry error tracking |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook API route |
| `ANTHROPIC_API_KEY` | Webhook AI responses + scrapers |
| `WHATSAPP_VERIFY_TOKEN` | Webhook GET verification |
| `META_APP_SECRET` | Webhook POST signature check |

### Path Alias
`@/*` resolves to `src/*` (configured in `tsconfig.json` and `vite.config.ts`).
