# TechniConnect

Electronics technician & shop marketplace — book repair technicians, browse electronics shops, and manage the platform via an admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port varies, bound via `PORT` env var)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)
- Mobile: Expo SDK 54 + Expo Router (file-based routing)
- Admin Panel: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/mobile/app/` — Expo Router screens
- `artifacts/mobile/context/AuthContext.tsx` — auth state (token + user)
- `artifacts/admin-panel/src/` — React admin panel

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks used by both mobile and admin panel.
- JWT auth stored in AsyncStorage on mobile via `AuthContext`; admin uses localStorage.
- PostgreSQL used (not MySQL) — Replit native DB is Postgres; Drizzle handles schema migrations.
- Haversine formula for 50km radius location filtering in shop/technician queries.
- Single Expo app covers all roles (user, technician, shop_owner); role-based UI shown conditionally.

## Product

- **Customer flow**: Browse shops & technicians nearby → view details → book → track → review
- **Technician flow**: Set availability, location; accept bookings; manage services
- **Shop owner flow**: Register shop, list products, manage bookings
- **Admin panel**: Full CRUD for users, shops, technicians, bookings; revenue stats; map view

## Demo Credentials

- Admin: `admin@techniconnect.com` / `admin123`
- Customer: `rahul@example.com` / `admin123`
- Shop Owner: `priya@example.com` / `admin123`
- Technicians: `amit@example.com`, `suresh@example.com` / `admin123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `react-native-maps` must be pinned to exactly `1.18.0`. Do NOT add it to `app.json` plugins.
- Admin panel uses `react-leaflet` for maps. Do NOT install it in the mobile workspace.
- Routes `/shops/my` and `/technicians/my` must be registered BEFORE `/:id` routes.
- Never use `console.log` in server code — use `req.log` in route handlers, `logger` elsewhere.
- Mobile workflow uses HMR — only restart when changing dependencies or hitting Metro errors.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
