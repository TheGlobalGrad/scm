# Production readiness and deployment

The application is currently a static prototype. It has no backend, authentication, database, production roles, secure file storage, GPS tracking, SMS/push delivery, email delivery, or real partners. Its Google Map is an optional browser-side demonstration that requires a restricted Google Maps JavaScript API key; it is not connected to live partner or vehicle data. The role selector only changes the interface and must never be treated as access control. All sample records are fictional.

The contribution-enquiry form is also a prototype-only interaction: it writes submitted values to the current browser's localStorage, exposes them to anyone using that browser profile, and creates an alert only in that same local dataset. It does not securely store, share, or notify an operations team. Never submit real contact information through this version.

## Services to add before real operations

1. Build an API service and relational PostgreSQL database. Railway or a managed PostgreSQL service such as Aiven can host these; compare current region, backup, networking and pricing options before choosing. A managed Supabase project is another option if its authentication, PostgreSQL, storage and row-level security model suits the team. No provider has been selected or created, and no pricing is quoted because plans and usage prices change.
2. Add verified user identities, organisation membership, server-side role/tenant authorization, approval flows for vendors and startups, password recovery, session security, audit events, database migrations, backups and restore tests. Enforce access in the API/database, not with frontend role visibility.
3. Add private evidence upload storage, malware/content validation, access expiry and retention rules. Add server-side validation and rate limits to every write endpoint.
4. For actual route maps, geocoding or ETA, configure Google Maps (or another selected provider) with a restricted browser key for the public/map SDK plus a separately protected server key where required. Apply allowed-origin and API restrictions. No live vehicle position can be claimed until authorised devices actually send location updates.
5. For email, SMS or push reminders, create provider accounts and server-side credentials, configure sender/domain verification and consent/opt-out behavior, and persist provider delivery results. Do not report a notification as delivered until the provider confirms it.
6. Define operational policies with the participating organisations: source approval, handling windows, accepted material, measurement equipment, quality limits, dispute ownership, retention, safety, and legal/privacy terms. The prototype's generic policy labels are not legal advice.
7. Add an enquiry table and authenticated API endpoints for public submission and operations review/status updates. Validate and normalize all fields server-side, restrict access to authorized operations memberships, rate-limit and spam-protect the public endpoint, minimize personal-data retention, record status changes in the audit log, and configure backups and deletion/access-request procedures. Connect new submissions to the shared in-app notification system (for example, a database-backed notification queue surfaced to authenticated operations users); configure a notification provider only if email, SMS or push delivery is also required.

## Environment configuration

`.env.example` documents placeholders only; the static app does not read it. No backend, database, authentication or notification service is present or configured in this repository, so a production enquiry workflow cannot be enabled by adding frontend code alone. Before it can accept real enquiries, choose and deploy an API and PostgreSQL/authentication provider, create and apply the enquiry and notification migrations, configure authenticated operations memberships and server-side authorization, and connect the frontend to the API. Store the database connection string and signing/authentication secrets only in the API host's server-side environment. For email/SMS/push, additionally configure a notification provider, server-only credentials, sender verification, and consent/opt-out handling. Provider-specific variable names and keys depend on those choices; none are provisioned here.

## Deployment

The current demo can be deployed as static files to any static host (for example, Cloudflare Pages, Netlify or a static bucket/CDN). Publish the project root so `index.html`, `frontend/` and `docs/` remain at their relative paths. This does not turn browser storage into shared or durable production storage. For a real multi-role system, deploy a secured API and managed database, apply migrations, configure backups and secret variables, and publish the frontend only after authorization and tenant-isolation tests pass.

## Release gates

- Test each organisation/role against cross-tenant reads and writes, including direct API requests.
- Test inventory concurrency, reservation release, partial receipts, disputes and audit retention.
- Test backups/restores, upload authorization, notification failures and expired sessions.
- Verify accessibility, mobile driver workflows, offline behavior if implemented, and real-device route/GPS permissions.
- Validate reporting definitions and source data with operational owners before publishing public impact figures.