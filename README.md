# ระบบฐานข้อมูลเครื่องช่วยหายใจ — โรงพยาบาลมหาสารคาม

Ventilator fleet tracking, repair, and disposal management for Mahasarakham Hospital's equipment center.

- Data model: [`ventilator-database.md`](./ventilator-database.md)
- Domain glossary: [`CONTEXT.md`](./CONTEXT.md)
- Architecture decisions: [`docs/adr/`](./docs/adr/)
- Build progress: [`task.md`](./task.md)

## Stack

Next.js 16 (TypeScript, App Router) · Tailwind CSS v4 + shadcn/ui · PostgreSQL + Prisma 6 · NextAuth v5 (Credentials, JWT sessions)

## Local setup

1. **Install PostgreSQL 16** (native install, matches the eventual on-prem deployment target):
   ```powershell
   choco install postgresql16 -y --params '/Password:devpassword123'
   ```
2. **Copy environment config**: `.env` is already set up for local dev (see `.env.example` for the reference). Adjust `DATABASE_URL` if you used a different password.
3. **Install dependencies** (already done if you're continuing this scaffold): `npm install`
4. **Create the database schema**:
   ```bash
   npm run db:migrate
   ```
5. **Seed reference + demo data** (buildings, wards, demo ventilators, demo accounts):
   ```bash
   npm run db:seed
   ```
6. **Run the dev server**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you'll be redirected to `/login`.

### Demo accounts (seeded, change after first login)

| Username | Password | Role |
|---|---|---|
| `admin` (or `SEED_ADMIN_USERNAME`) | from `.env` `SEED_ADMIN_PASSWORD` | ผู้ดูแลระบบ |
| `equipment_center_demo` | `ChangeMe123!` | เจ้าหน้าที่ศูนย์เครื่องมือ |
| `ward_staff_demo` | `ChangeMe123!` | เจ้าหน้าที่หอผู้ป่วย (MICU1) |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Run `prisma/seed.ts` |
| `npm run db:studio` | Open Prisma Studio (browse/edit DB directly) |
