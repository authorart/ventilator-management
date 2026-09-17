# Scaffold Task List — Mahasarakham Ventilator Database Management

Tracks the scaffold build against the decisions locked in during grilling (see `CONTEXT.md` and `docs/adr/`). Updated live as work completes.

## Planning
- [x] Grill session — architecture, DB, auth, roles, seed strategy all confirmed with user
- [x] `CONTEXT.md` — domain glossary (roles, ward categories, statuses, actions)
- [x] `docs/adr/0001-nextjs-fullstack.md`
- [x] `docs/adr/0002-postgres-from-day-one.md`
- [x] `docs/adr/0003-always-current-on-load.md`

## App scaffold
- [x] Next.js 16 (TypeScript, Tailwind v4, App Router, ESLint) generated
- [x] shadcn/ui initialized (Base UI primitives) + components: card, badge, table, input, label, select, dialog, dropdown-menu, sonner, separator, tabs, textarea, avatar
- [x] Theme: Sarabun (Thai+Latin) font, clinical blue primary color, neutral grayscale base
- [x] Git repository initialized
- [x] `middleware.ts` migrated to Next.js 16's `proxy.ts` convention

## Data layer
- [x] `prisma/schema.prisma` — all 9 entities from `ventilator-database.md` modeled (Building, Ward, Vendor, User, Ventilator, LocationHistory, StatusHistory, MaintenanceRecord, DisposalRecord) + enums for status/role/move type/etc.
- [x] Pinned `prisma`/`@prisma/client` to stable `6.19.3` (avoided Prisma 7's breaking driver-adapter requirement — not worth the churn for this scaffold)
- [x] `prisma/seed.ts` — seeds all 6 buildings, all dedicated wards + one reserve pool per building, 3 demo user accounts (admin/equipment-center/ward-staff), 10 `DEMO-` prefixed ventilators across varied statuses
- [x] PostgreSQL 16 installed locally (service `postgresql-x64-16` running; superuser password reset to match `.env`)
- [x] `npm run db:migrate` — applied `20260917083823_init`
- [x] `npm run db:seed` — buildings, wards, demo ventilators, demo users all seeded

## Auth & permissions
- [x] NextAuth v5 (Credentials provider, JWT sessions — no OAuth, matches offline-intranet target)
- [x] `src/lib/permissions.ts` — role capability matrix from the grill session
- [x] Route protection via `proxy.ts` (redirect unauthenticated → `/login`)
- [x] Login page (`/login`) with server action + inline error handling

## Dashboard (v1 scope)
- [x] Status summary cards (count per ventilator status)
- [x] Ventilator table, scoped to own ward for `WARD_STAFF`, all wards for `ADMIN`/`EQUIPMENT_CENTER`
- [x] Action: "แจ้งปัญหา" (report problem) — any role, own ward only for ward staff
- [x] Action: "เปลี่ยนสถานะ" (update status) — admin/equipment center only
- [x] Action: "ย้ายเครื่อง" (move ventilator) — admin/equipment center only

## Verification
- [x] `npm run build` — passes (typecheck + compile clean)
- [x] `npm run lint` — passes, no warnings
- [x] `README.md` rewritten with real setup instructions
- [x] End-to-end manual test in browser — verified: admin login, dashboard fleet view, status update (with Thai label fix in `SelectValue`), move dialog, sign-out, ward-staff login scoped to own ward only, ward-staff report-problem flow moving a ventilator to "รอซ่อม"
- [ ] First git commit — pending user's go-ahead (not committing without being asked)

## Bugs found & fixed during testing
- Status/move/ward `<SelectValue>` displayed raw enum keys (`AVAILABLE`) instead of Thai labels — Base UI's `Select.Value` needs its label mapping passed as a function child (`{(v) => LABEL[v]}`), not derived automatically. Fixed in all three selects in `ventilator-table.tsx`.

## Deferred (per grill session, not in v1 scope)
- Live-push (WebSocket/SSE) dashboard updates
- On-prem deployment mechanics (reverse proxy, TLS, backups)
- Automated test suite
- Disposal workflow UI (schema exists; no page yet — add when equipment center is ready to use it)
- Ventilator master-data create/edit UI (schema + seed exist; no add/edit form yet)
