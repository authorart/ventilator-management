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
- [x] First git commit — `136c651`

## Ventilator master-data create/edit (next step, done)
- [x] `src/lib/validation.ts` — zod schema for ventilator form fields
- [x] `createVentilator` / `updateVentilator` server actions in `src/app/actions.ts`, with unique-constraint (P2002) error handling mapped to Thai field names
- [x] `/ventilators/new` page — admin/equipment-center only (server-side redirect for others), sets initial ward + derives `isReserveUnit` from ward category
- [x] `/ventilators/[id]/edit` page — master data only; deliberately excludes ward/location (location changes must go through the audited "ย้ายเครื่อง" move action, never a silent edit)
- [x] "เพิ่มเครื่องใหม่" button on dashboard, "แก้ไข" link per row — both gated by `permissions.canEditFleet`
- [x] Build + lint clean; end-to-end tested: created `AST-2026-001` (Medtronic PB980, CCU), edited its brand, confirmed ward-staff is redirected away from `/ventilators/new` when hitting it directly

## User management + UX fixes (from user feedback, done)
- [x] Fixed: no way back from "เพิ่มเครื่องใหม่"/"แก้ไข" ventilator pages — added a `BackLink` header link plus a "ยกเลิก" cancel button next to submit on both pages
- [x] Fixed: admin had no way to manage users — built full CRUD:
  - `src/lib/validation.ts` — `userCreateSchema`/`userUpdateSchema`
  - `src/app/users/actions.ts` — `createUser`/`updateUser`, admin-only, bcrypt-hashed passwords, unique-username (P2002) handling, self-lockout guards (can't deactivate own account, can't demote own account out of Admin)
  - `/users` list, `/users/new`, `/users/[id]/edit` pages — admin-only (redirect otherwise)
  - "จัดการผู้ใช้งาน" header link, visible only to Admin
  - Username is immutable after creation (shown read-only on edit) to avoid login confusion
- [x] Build + lint clean; end-to-end tested: created user `somchaitest` (ward staff, หอผู้ป่วยชาย2), confirmed self-lockout guard blocks deactivating the currently-logged-in admin, confirmed ward-staff redirected away from `/users` when hitting it directly and sees no nav link

## Bugs found & fixed during testing
- Status/move/ward `<SelectValue>` displayed raw enum keys (`AVAILABLE`) instead of Thai labels — Base UI's `Select.Value` needs its label mapping passed as a function child (`{(v) => LABEL[v]}`), not derived automatically. Fixed in all three selects in `ventilator-table.tsx`.
- `<Button render={<Link .../>}>` triggered a Base UI console error ("expected a native `<button>`") — Base UI's `Button` defaults `nativeButton={true}`; needs `nativeButton={false}` whenever `render` targets a non-button element like `next/link`'s `<a>`. Fixed on both the dashboard "เพิ่มเครื่องใหม่" button and the table's "แก้ไข" link.

## Deployment — awaiting decisions (see chat)
- User asked to "up this work to a web host" once finished. Open questions before acting: public cloud demo vs. the on-prem intranet target from ADR-0002; which host; whether demo-only data is acceptable there; who manages the resulting secrets/URL long-term.

## Deferred (per grill session, not in v1 scope)
- Live-push (WebSocket/SSE) dashboard updates
- On-prem deployment mechanics (reverse proxy, TLS, backups)
- Automated test suite
- Disposal workflow UI (schema exists; no page yet — add when equipment center is ready to use it)

## UX/UI overhaul (from user feedback, done)
- [x] Header: brand links to `/`, tab-style nav with active state (แดชบอร์ด / เครื่องช่วยหายใจ / จัดการสถานที่ / จัดการผู้ใช้งาน)
- [x] `/` is now a dashboard: per-ward status bars grouped by building, red alert banner when a ward has no available machine ("ใช้งานเต็ม" = all working machines in use; "ไม่มีเครื่องพร้อมใช้" = only broken ones), "ใกล้เต็ม" at >=80% utilization (`src/lib/fleet.ts`)
- [x] `/ventilators`: status boxes are filters; building / ward / search filters live in the URL; current location only; disposed hidden unless filtered; pagination (20/page)
- [x] `/locations` (Admin + Equipment center): CRUD for buildings and wards, with delete guards and category-change guard when a ward holds machines

## User onboarding & password policy (from user feedback, done)
- [x] Add-user form now only asks: ชื่อ-สกุล, ชื่อผู้ใช้, บทบาท, หอผู้ป่วยต้นสังกัด (shown + required only for เจ้าหน้าที่หอผู้ป่วย; enforced server-side)
- [x] New accounts get default password `Ventilator07` (`DEFAULT_PASSWORD` in `src/lib/validation.ts`) with `User.mustChangePassword = true` (migration `user_must_change_password`)
- [x] `proxy.ts` forces `/change-password` until changed; after saving, session ends and user logs in with the new password
- [x] Password policy: >= 8 chars, lowercase + uppercase + digit, must differ from the old one
- [x] Admin edit form: password field replaced by "reset to default" checkbox (sets the flag again); "เปลี่ยนรหัสผ่าน" link in header for voluntary changes
- Verified: tsc + lint clean; validation rules checked by script; add-user form renders and blocks ward staff without a ward. Not yet clicked through end-to-end in the browser (browser automation kept failing on typing).

## Password visibility toggle + DB note (done)
- [x] `PasswordInput` (eye icon, masked by default) used on login and change-password forms
- Gotcha: `.env.local` (Neon, from Vercel) overrides `.env` (local Postgres) for `next dev`. Prisma CLI / `tsx` scripts only read `.env`. Migrations must be applied to BOTH (Neon: `DATABASE_URL=$DATABASE_URL_UNPOOLED npx prisma migrate deploy`). `user_must_change_password` applied to both on 2026-09-30.

## Ventilator detail + repair workflow (done)
- [x] `/ventilators/[id]`: machine info + repair jobs, location history, status history. Ward staff can only open machines currently in their own ward (404 otherwise). Purchase price / repair cost shown to Admin + Equipment center only. Asset number in the list links here.
- [x] `/maintenance` (Admin + Equipment center, nav "งานซ่อม"): queue of reported problems -> "เริ่มซ่อม" (vendor/technician; machine -> กำลังซ่อมบำรุง) -> "บันทึกผลซ่อม":
  - ซ่อมเสร็จ: job closed, machine -> พร้อมใช้งาน (stays under maintenance if another job is still open on it)
  - รออะไหล่: job stays open, machine stays under maintenance
  - ซ่อมไม่ได้: job closed, machine -> ชำรุด/รอพิจารณาจำหน่าย
  Every transition writes a StatusHistory row. Tabs: งานค้าง / ปิดงานแล้ว.
- Verified: tsc + lint; pages over HTTP with real sessions (admin, ward staff scoping); action state machine via a stubbed-auth script on the LOCAL db (double start / double close / negative cost rejected). Not clicked through in the browser (Chrome autofill kept interfering with login).
- Note: local test data changed (DEMO-001 available, DEMO-004 damaged, 2 test repair records). Neon untouched. Vendor list in the dialog comes from Vendors of type REPAIR_SERVICE/BOTH; no vendor management UI yet.
