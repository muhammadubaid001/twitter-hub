## Phase 1 Architecture & Implementation Plan

### 1. Purpose & Scope
- **Objective:** Deliver the complete Phase 1 experience for a multi-tenant SaaS platform for education providers. All features listed below must ship production-ready.
- **Tenants:** Each college/provider operates autonomously under its own subdomain with configurable branding, settings, and feature toggles.
- **Users & Roles:** Global Site Super Admin + tenant-level roles (Admin, Academic, Accounts, Student Services, Student). Future roles (Marketing, Agent, etc.) remain extensible.
- **Phase 1 Modules (full build):**
  1. Multi-tenant foundation (auth, RLS, onboarding, subdomains)
  2. Admin overview dashboard
  3. Student management
  4. Courses & units
  5. Grades & attendance (incl. CSV import flows)
  6. Accounts & finance (Stripe deferred)
  7. Communications (email only)
  8. Student portal
  9. Admin & settings

### 2. Tech Stack & Hosting
- **Frontend:** React 18 + Vite + TypeScript + Tailwind. Routing via React Router. State/data via React Query, Zustand (for UI state), Recharts/Visx for analytics widgets.
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage). Supabase handles RLS, SQL functions, scheduled jobs (pg_cron) and file storage (student documents, invoices).
- **Email:** SendGrid (Phase 1) via Supabase Edge Function calling SendGrid API using tenant-specific API key stored in encrypted config table.
- **File Storage:** Supabase Storage buckets with per-tenant prefixes. Signed URLs for sensitive docs.
- **Deployment:**
  - Frontend → Vercel (or Netlify). Configure wildcard subdomain `*.appdomain.com` pointing to Vercel project. Use middleware to detect tenant slug from host.
  - Supabase hosts database + auth + storage. Edge Functions used for secure server-side logic (invoice PDFs, SendGrid, CSV import processing).
  - Staging + production Supabase projects + Vercel environments with environment-based `VITE_SUPABASE_URL`/`ANON_KEY`.

### 3. Multi-Tenant Architecture
#### 3.1 Tenancy model
- `tenants` table: `id` (uuid), `slug`, `name`, `timezone`, `status`, `logo_url`, `branding_palette`, `primary_domain`, `subscription_tier`, `created_at`, `suspended_at`.
- `tenant_settings`: JSONB columns for module toggles (portal, payments, agents), SendGrid API key (encrypted), default remarks, grade mappings, etc.
- `tenant_features`: per tier enabling/disabling modules. Managed by Site Super Admin.
- `tenant_domains`: supports multiple domains/subdomains per tenant (e.g., vanity domain) to allow future custom domains.

#### 3.2 User & role model
- Supabase Auth stores primary identity.
- `profiles`: extends `auth.users` with display name, avatar, phone, locale, default tenant.
- `tenant_user_roles`: `tenant_id`, `user_id`, `role` (enum), `invited_by`, `status`, `last_login`.
- `role_permissions`: maps roles to granular actions for RBAC enforcement in UI + RLS policies.
- **RLS** binds every table with `tenant_id`; policies ensure:
  - Site Super Admin (flag on profile) bypasses tenant filter.
  - Tenant users can only read/write rows where `tenant_id = auth.jwt() -> tenant_id`.
  - Students (portal users) limited to their own student profile via `student_user_links`.

#### 3.3 Subdomain routing
- Wildcard DNS `*.appdomain.com` → Vercel.
- Middleware (Vercel Edge) inspects `request.headers.host`, resolves tenant slug (strip base domain). If root domain → marketing site.
- Tenant slug injected into app via initial loader (Router loader + context provider) and passed to Supabase queries (stored in JWT custom claim).
- Tenant metadata cached in Supabase table; Vercel middleware can call Supabase Edge function to fetch tenant config (logo, colors, toggles).

#### 3.4 Onboarding flow
1. **Site Super Admin** logs into Site Control Panel (root domain) and runs `Create Tenant` wizard: input org info, slug, timezone, subscription tier, module toggles.
2. System provisions:
   - Tenant row + defaults in `tenant_settings`.
   - Default remark options, grade scales, role templates.
   - Storage prefixes for documents/invoices.
3. Super Admin invites first Tenant Admin (email). Invitation stored in `tenant_invitations`; email includes token.
4. Tenant Admin accepts invite → completes tenant setup (branding, SendGrid key, roles). No repeated onboarding necessary; wizard enforces completion before portal opens.

### 4. Supabase Data Model (Phase 1 Core)

| Table | Purpose | Key Fields / Notes |
| --- | --- | --- |
| `tenants` | Tenancy master | `id`, `slug`, `name`, `status`, `timezone`, `subscription_tier` |
| `tenant_settings` | Per-tenant config | `tenant_id` FK, `settings` JSONB (logo, colors, grade_mapping, email_config, feature_toggles) |
| `tenant_invitations` | Onboarding invites | `token`, `email`, `role`, `expires_at`, `accepted_at` |
| `profiles` | User metadata | `user_id` PK, `full_name`, `phone`, `default_tenant`, `is_site_admin` |
| `tenant_user_roles` | RBAC membership | composite PK (`tenant_id`, `user_id`), `role`, `status`, `last_seen_at` |
| `students` | Student master | `id`, `tenant_id`, `student_code`, `first_name`, `last_name`, `dob`, `status`, `current_course_id`, `agent_id`, `contact info` |
| `student_status_history` | Tracks status changes | `student_id`, `status`, `changed_by`, `changed_at` |
| `courses` | Course definitions | `tenant_id`, `code`, `name`, `campus_id`, `level`, `moodle_course_id`, `active` |
| `units` | Units/modules | `tenant_id`, `code`, `name`, `competency_type`, `moodle_unit_id`, `active` |
| `course_units` | Assign units to courses | `course_id`, `unit_id`, `sequence`, `credit_points` |
| `enrolments` | Student-course linkage | `student_id`, `course_id`, `start_date`, `end_date`, `status`, `agent_id`, `attendance_requirement` |
| `student_units` | Student-unit progression | `student_id`, `unit_id`, `status`, `grade`, `attempt`, `last_synced_from_moodle` |
| `grades` | Detailed grade entries | `student_id`, `unit_id`, `score`, `grade_scale`, `status (Pass/NYC/Reassessment)`, `graded_at`, `source (CSV/manual)` |
| `attendance_records` | Attendance snapshots | `student_id`, `course_id`, `unit_id?`, `date`, `status`, `hours`, `source` |
| `attendance_snapshots` | Aggregated % | `student_id`, `course_id`, `percentage`, `evaluated_at`, `alert_flag` |
| `tasks` | Tasks & follow-ups | `tenant_id`, `title`, `description`, `status`, `due_date`, `priority`, `created_by`, `student_id?` |
| `task_assignees` | Multi-assignee tasks | `task_id`, `user_id`, `role`, `completed_at` |
| `remarks` | Static dropdown options | `tenant_id`, `type (General/Academic/Financial)`, `label`, `value`, `active` |
| `student_notes` | Three-column notes | `tenant_id`, `student_id`, `note_type`, `content`, `created_by`, `visibility` |
| `files` | File metadata | `tenant_id`, `entity_type (student, invoice)`, `entity_id`, `storage_path`, `label`, `uploaded_by`, `version`, `visibility` |
| `communications` | Emails/SMS logs | `tenant_id`, `student_id?`, `channel`, `template_id`, `subject`, `body_preview`, `status`, `sent_at`, `metadata` |
| `email_templates` | Tenant templates | `id`, `tenant_id`, `name`, `html`, `variables`, `category` |
| `invoices` | Billing | `tenant_id`, `student_id`, `number`, `status`, `issue_date`, `due_date`, `amount`, `currency`, `pdf_url` |
| `invoice_line_items` | Line detail | `invoice_id`, `description`, `qty`, `unit_price`, `tax_rate`, `account_code` |
| `payments` | Manual payments | `invoice_id`, `amount`, `paid_on`, `method`, `receipt_url`, `entered_by` |
| `transactions` | Accounting log | `tenant_id`, `student_id`, `type`, `amount`, `reference`, `notes` |
| `announcements` | Portal notices | `tenant_id`, `title`, `body`, `audience`, `publish_at`, `expires_at` |
| `support_tickets` | Student portal tickets | `tenant_id`, `student_id`, `category`, `status`, `assigned_to`, `messages` (JSONB) |
| `audit_log` | Change history | `tenant_id`, `actor_id`, `entity_type`, `entity_id`, `action`, `before`, `after`, `created_at` |

Supporting tables: `campuses`, `agents`, `api_sync_logs`, `csv_imports`, `attendance_alerts`, `grade_mappings`, `feature_flags`, etc.

### 5. Security & RLS Strategy
- **JWT Claims:** Custom claims include `tenant_id`, `roles`, `is_site_admin`. Supabase Auth hook (Edge Function) sets claims post-login based on `tenant_user_roles`.
- **Row-Level Security:** Enforced on every tenant-bound table. Sample policy:
  ```sql
  create policy "tenant scoped access"
    on public.students
    for select using (
      (auth.jwt()->>'is_site_admin')::boolean
      or tenant_id = (auth.jwt()->>'tenant_id')::uuid
    );
  ```
- **Students:** Portal accounts stored in `auth.users` as well; `student_user_links` ensures they can only read/update their own record.
- **File Access:** Supabase Storage policies mirror RLS using folder naming convention `tenant_id/entity/...` and signed URLs for downloads.
- **Audit Trail:** Triggers write JSON before/after states to `audit_log`. Critical actions (CSV imports, invoice status changes) require reason + actor.

### 6. Frontend Architecture
- **App Shells:**
  - `SiteAdminApp` (root domain) for Site Super Admin tasks.
  - `TenantApp` (subdomains) – houses admin dashboards, modules, and student portal (separate route tree).
- **Routing Strategy:**
  - `/` marketing site (Phase 2).
  - `/site-admin/*` for platform operator.
  - `/app/*` for tenant admin/staff, using loader to fetch tenant + role-specific permissions before rendering.
  - `/student/*` for portal (or `/portal`), accessible by Student role.
- **State/Data:**
  - React Query for Supabase data; queries keyed by `{tenantId, resource}`.
  - Zustand store for UI filters (e.g., student list filters, dashboard widget state).
  - Suspense + lazy imports for role-based widget bundles.
- **Design System:**
  - Tailwind + Radix UI primitives for modals, dropdowns.
  - Widget components accept data + config; easily reused across dashboards.
- **File Uploads & CSV Imports:**
  - Use Supabase Storage client for uploads.
  - CSV import UI uploads file → Supabase Edge Function to parse/validate → records saved + `csv_imports` audit entry.

### 7. Module Specifications

#### 7.1 Multi-Tenant Foundation
- **Features:** Tenant CRUD, subscription tiers, status toggles, RLS policies, onboarding wizard, tenant-level settings UI, subdomain detection.
- **API:** Supabase RPC functions for `create_tenant`, `suspend_tenant`, `invite_user`.
- **UI:** Site Super Admin panel with cards (Active tenants, Suspended, MRR). Tenant wizard multi-step form with validations.

#### 7.2 Admin Overview Dashboard
- **Widgets:** Derived from `students`, `enrolments`, `grades`, `attendance_snapshots`, `invoices`, `tasks`, `alerts`.
- **Data flow:** React Query fetch for aggregated stats via Supabase views (`dashboard_summary_view`, `attendance_overview_view`). Use Postgres materialized views refreshed via cron for heavy aggregations.
- **Quick Actions:** Buttons linking to Student form, Email center, CSV import wizard.

#### 7.3 Student Management
- **Student List:** Data grid with column filters, saved views, bulk actions (export CSV, send email, assign tasks). Use virtualization for performance.
- **Manage Student Tabs:**
  - Profile & enrolments
  - Academic progress (grades, GPA computation formula configurable via grade mapping)
  - Attendance (sparkline + alerts)
  - Remarks dropdown (persist selection + history)
  - Notes (three-type columns) with permissions per role
  - Tasks & follow-ups (kanban + timeline)
  - File manager (upload/view/delete; track version + type)
  - Communication log (email history from `communications`)
  - Audit log (filtered view)
- **GPA Logic:** grade scale mapping table defines point value per grade; SQL view calculates GPA per enrolment.

#### 7.4 Courses & Units
- Manage courses (CRUD, activate/deactivate, assign campuses). Manage unit catalog with competency codes. Relationship UI to link units to courses; bulk assign units to students/enrolments. Moodle ID fields stored but integration deferred.

#### 7.5 Grades & Attendance
- **Grades Table:** Inline editing with workflow (Pass / NYC / Reassessment). Import CSV with mapping UI (fields -> columns) + validation results. Manual overrides tracked via audit log.
- **Attendance:** CSV import (per course/campus). Attendance percentage logic stored in SQL function computing `attended_hours / total_hours`. Alerts generated when < threshold; displayed in dashboards.

#### 7.6 Accounts & Finance
- Invoice lifecycle management with statuses (draft/sent/paid/overdue). Manual payments recorded; outstanding vs collected metrics feed dashboards. Generate PDF using Edge Function + pdfkit; files stored in storage bucket. CSV export/import for transactions.

#### 7.7 Communications
- Email center with template selector, variable preview, recipient filters (students, agents, staff). Sends via SendGrid Edge Function (queue via `communications` table). Delivery status stored (sent/failed). Student profile displays communication log.

#### 7.8 Student Portal
- Student sees personalized dashboard: progress summary, attendance %, grades table, invoices (with manual payment acknowledgement + future Stripe placeholder), announcements, support tickets. Portal theme uses tenant branding. Support tickets route to staff tasks.

#### 7.9 Admin & Settings
- Screens: User & Role management (invite, deactivate, MFA toggle placeholder), College profile (logo upload, address, timezone), Email config (SendGrid API key test), Remarks editor, Grade mapping, Feature toggles (portal, payments, agents). Also includes API keys + webhooks monitor, backup/restore view (download CSV, request backup).

### 8. Integrations & Services
- **SendGrid:** Supabase Edge Function `send-email` accepts payload `{tenantId, templateId, recipients, variables}`; uses tenant-specific API key stored encrypted. Logs to `communications`.
- **PDF Generation:** Edge Function `generate-invoice` uses tenant branding to create invoice PDFs, saves to Storage, updates `invoices.pdf_url`.
- **CSV Processing:** Edge Function `import-csv` for grades/attendance/invoices to avoid large payloads from browser. Steps: upload file → call function → function writes to `csv_imports` with status + error report accessible in UI.
- **Backups:** Nightly `pg_dump` (Supabase backup + custom S3). UI surfaces backup logs via `backups` table that mirrors Supabase backup metadata.

### 9. Implementation Roadmap (Phase 1)

1. **Foundation & Tooling (Week 1)**
   - Set up monorepo structure or expand current repo (create `/apps/site-admin`, `/apps/tenant-app`, `/apps/student-portal` or single app with route splits).
   - Configure environment management, shared UI kit, linting, testing (Vitest + Playwright).
   - Establish Supabase schema migrations via `supabase` CLI, seed data, RLS policies template.
2. **Multi-Tenant Core (Weeks 1–2)**
   - Implement `tenants`, `tenant_settings`, `profiles`, `tenant_user_roles`.
   - Add custom JWT claims via Supabase functions.
   - Build Site Super Admin panel + tenant onboarding wizard + invitation flow.
   - Set up subdomain detection + context provider.
3. **Core Modules (Weeks 2–4)**
   - Student management (list, profile, notes, tasks, files, comms).
   - Courses & units + grade mapping + GPA logic.
   - Grades & attendance UI + CSV import pipeline.
4. **Operational Modules (Weeks 4–5)**
   - Accounts & finance (invoices, payments, PDF, exports).
   - Communications center + SendGrid integration.
   - Admin overview dashboard widgets + alerts engine.
5. **Student Portal & Settings (Weeks 5–6)**
   - Student portal routes + data fetching + support tickets.
   - Admin & Settings screens (logo upload, feature toggles, remarks editor).
   - Feature flag enforcement across app.
6. **Hardening & QA (Week 6)**
   - Automated tests (unit + integration + E2E).
   - Performance validation for multi-tenant queries, load testing for CSV imports.
   - Security review (RLS, storage policies, audit log coverage).
   - Documentation (setup, API schema, admin guide) + staging/prod deployment runbook.

### 10. Deliverables Checklist
- Supabase schema + migrations, seeded reference data, RLS policies.
- React front-end implementing all Phase 1 modules with role-based dashboards.
- Site Super Admin panel + onboarding workflow.
- SendGrid-powered email pipeline + logging.
- Invoice PDF generation + storage.
- CSV import/export workflows with error reporting.
- Student portal with dashboards, invoices, announcements, support tickets.
- Documentation set: architecture (this doc), setup guide, API reference, admin handbook.
- Deployment scripts + environment configs for staging and production.
- 30-day maintenance plan (bug triage, monitoring dashboards).

### 11. Open Questions / Next Decisions
- Confirm final domain + DNS strategy for wildcard subdomains.
- Clarify whether marketing site lives in same repo or separate.
- Decide on analytics library (Metabase integration Phase 2 vs. built-in charts now).
- Approve grade scale + GPA formula baseline for MVP.
- Provide SendGrid account + API key handling strategy (per tenant vs. shared).

This document serves as the blueprint for implementing the Phase 1 requirements end-to-end. Next step: lock schema + onboarding UX designs, then begin Supabase migrations and front-end scaffolding following the roadmap above.
