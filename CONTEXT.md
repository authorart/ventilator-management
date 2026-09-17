# CONTEXT — Mahasarakham Ventilator Database Management

Glossary of domain terms. No implementation details here — see `ventilator-database.md` for the data model and `docs/adr/` for architecture decisions.

## Terms

**Ventilator (เครื่องช่วยหายใจ)**
A single physical machine, uniquely identified by its `asset_number` (เลขครุภัณฑ์), `serial_number`, and `device_code` (the simple ID label physically stuck on the machine). Has exactly one current location (a Ward) and one current status at any point in time.

**Building (อาคาร)**
A hospital building. Owns one or more Wards. Six exist: ศูนย์เครื่องมือ, อาคารบำบัดรักษา, อาคารอายุรกรรม, อาคารอุบัติเหตุฉุกเฉิน, อาคารทองดี, อาคาร 60 ปี.

**Ward (หอผู้ป่วย / จุดวาง)**
A location a Ventilator can sit at. Two kinds, distinguished by `ward_category`:
- **ประจำ (dedicated)** — a real patient-care ward with a fixed number of beds, each expected to have its own ventilator (e.g. MICU1, PICU, หอผู้ป่วยชาย1).
- **สำรอง (reserve)** — a building-level pool of spare machines not assigned to a specific bed (one per building, including ศูนย์เครื่องมือ's own central reserve).

A Ward staff account's access is scoped to exactly one dedicated Ward (their `home_ward_id`); they cannot see or act on other wards' machines.

**Equipment center (ศูนย์เครื่องมือ)**
The hospital department that owns the ventilator registry end-to-end: adds new machines, moves them between wards/reserve, processes repairs, and approves disposal. Functionally equivalent in permissions to Admin, minus user-account management.

**Status (สถานะ)**
The current operational state of a Ventilator. Exactly one of:
- `พร้อมใช้งาน` (Available)
- `กำลังใช้งานกับผู้ป่วย` (In use)
- `รอซ่อม` (Awaiting repair)
- `กำลังซ่อมบำรุง` (Under maintenance)
- `ชำรุด/รอพิจารณาจำหน่าย` (Damaged / pending disposal review)
- `จำหน่ายแล้ว` (Disposed) — terminal; a Ventilator in this state cannot change status or location again.

**Report a problem / request repair**
An action any Ward staff member can take on a Ventilator currently at their own ward, creating a `MAINTENANCE_RECORD` and moving the Ventilator's status toward `รอซ่อม`. They cannot themselves assign a vendor, log a result, or close out the repair — only the Equipment center or Admin can process the record from there.

**Move (เคลื่อนย้าย)**
Transferring a Ventilator from one Ward to another (dedicated ↔ reserve, or reserve ↔ reserve across buildings). Only Equipment center / Admin can perform this. Every move is recorded in `VENTILATOR_LOCATION_HISTORY`, never overwritten.

**Disposal (จำหน่าย)**
The formal write-off of a Ventilator, requiring a committee approval number and a recorded reason. Terminal — once disposed, a Ventilator is excluded from active-fleet views but its full history remains queryable. Only Equipment center / Admin can initiate or approve.

**Role (บทบาท)** — see `docs/adr/0003-admin-only-account-provisioning.md` for how accounts are created.
- **Admin (ผู้ดูแลระบบ)** — everything Equipment center can do, plus user account management. Does not itself imply clinical or equipment expertise; it's the systems-administration role.
- **Equipment center (เจ้าหน้าที่ศูนย์เครื่องมือ)** — full operational control over the fleet: master data, moves, repairs, disposal. Cannot manage user accounts.
- **Ward staff (พยาบาล/เจ้าหน้าที่หอผู้ป่วย)** — read-only over their own ward's machines, plus the ability to report a problem. No access to other wards, no edit rights on master data, moves, or disposal.
