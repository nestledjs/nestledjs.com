---
title: Architecture
nextjs:
  metadata:
    title: Architecture
    description: How Nestled structures your full-stack application — monorepo layout, code generation, authentication, and multi-tenancy.
---

Nestled uses an Nx monorepo with a library-based architecture. Applications live in `apps/`, shared code lives in `libs/`, and a code generation pipeline keeps everything in sync with your Prisma schema.

---

## Project structure

```text
my-app/
├── apps/
│   ├── api/                  # NestJS GraphQL API
│   ├── web/                  # React + React Router 7 frontend
│   └── api-e2e/              # E2E tests (Vitest)
├── libs/
│   ├── api/                  # Backend libraries
│   │   ├── config/           # Environment & app configuration
│   │   ├── core/             # Core framework (4 layers)
│   │   ├── custom/           # Your business logic
│   │   ├── generated-crud/   # Auto-generated CRUD (don't edit)
│   │   ├── integrations/     # Email, SMS, storage, Stripe
│   │   ├── prisma/           # Schema, seeds, migrations
│   │   └── utils/            # Guards, decorators, types
│   ├── shared/               # Code shared between API and web
│   │   ├── apollo/           # Apollo Client configuration
│   │   ├── sdk/              # Auto-generated GraphQL SDK
│   │   ├── styles/           # Tailwind CSS
│   │   └── utils/            # Shared utilities
│   ├── web/                  # Web-specific utilities
│   └── web-ui/               # Component library (Storybook)
├── .dev/                     # Docker Compose, Dockerfile
├── scripts/                  # Test DB management, E2E runner
└── tools/                    # Migration guides
```

Every library uses the `@nestled-template/` path alias prefix, so imports are clean:

```typescript
import { CoreService } from '@nestled-template/api/core/data-access'
import { UserDocument } from '@nestled-template/shared/sdk'
```

---

## Library layers

Backend libraries follow a consistent layering pattern:

- **data-access** — Services, database queries, business logic
- **feature** — GraphQL resolvers, modules, controllers (the public API surface)
- **models** — TypeScript types and GraphQL object types
- **helpers** — Utility functions specific to that library

For example, `libs/api/core/` contains `core/data-access`, `core/feature`, `core/helpers`, and `core/models`. This separation keeps concerns clean and enables Nx to cache and rebuild only what changed.

---

## Generated vs custom code

This is the most important concept in Nestled. There are two types of code in your project:

### Generated code (overwritten every time)

These files are completely regenerated every time you run `pnpm db-update`. Never edit them — your changes will be lost.

**`libs/api/generated-crud/`** — CRUD resolvers for every Prisma model (findOne, findMany, create, update, delete, count), input/output DTOs, auth guards based on `@crudAuth` comments, and database model metadata. This drives the admin tool's data management.

**`libs/shared/sdk/src/__admin/`** — Admin GraphQL fragments, queries, and mutations for every model. Always overwritten to stay in exact sync with your schema. These power the built-in admin dashboard.

**`libs/shared/sdk/src/generated/`** — Auto-generated TypeScript types for all GraphQL operations (both admin and user-facing).

**`libs/api/core/models/`** — TypeScript models generated from the Prisma DMMF.

### Custom code (yours, never overwritten)

These files are generated once as empty templates and then **never touched again** by the generators. This is where you build your application.

### `libs/api/custom/` — your API logic

The custom library has three folders, each with a distinct purpose:

**`custom/src/lib/default/`** — One module per Prisma model, organized by model name. Each contains a service, resolver, and module file. If your schema has an `Invoice` model, all API logic directly related to invoices goes in `default/invoice/`. On first generation, these extend the admin CRUD so the admin tool works immediately. Your job is to write your own user-facing resolvers and business logic here. Everything your end users interact with — including logged-in admin users using the actual app (as opposed to the admin tool) — should be custom-written in these modules.

**`custom/src/lib/plugins/`** — Feature modules for cross-cutting concerns that span multiple models or handle complex features. Auth touches users, sessions, tokens, and emails — so it's a plugin, not a default module. The template includes:

| Plugin            | Purpose                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| `auth/`           | Authentication — register, login, password reset, email verification, JWT, OAuth, 2FA |
| `admin/`          | Admin operations — user emulation, management queries                                 |
| `billing/`        | Stripe subscriptions, checkout, webhook handling                                      |
| `security/`       | Security event tracking, audit logging                                                |
| `storage/`        | Multi-provider file uploads (S3, Cloudinary, ImageKit, GCS, local)                    |
| `api-tokens/`     | Bearer token authentication                                                           |
| `contact-mailer/` | Email sending with templates                                                          |
| `tenancy/`        | Organization context middleware                                                       |

**`custom/src/lib/middleware/`** — NestJS middleware like the tenancy middleware that sets organization context on every request.

### `libs/api/integrations/` — external service providers

A separate library for third-party API integrations. Each integration is a NestJS provider that wraps an external service:

| Integration | Purpose                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `email/`    | SMTP email sending (SendGrid, AWS SES, Mailtrap, etc.) with mock mode for testing |
| `sms/`      | Twilio SMS for 2FA delivery                                                       |
| `storage/`  | File storage providers (S3, Cloudinary, ImageKit, GCS, local)                     |
| `stripe/`   | Stripe API client, webhook handling, product/price syncing                        |

When you need to integrate with a new external API (HubSpot, a CRM, a payment processor, etc.), create a new provider in this library.

### `libs/shared/sdk/src/graphql/` — your frontend queries

User-facing GraphQL fragments, queries, and mutations. Generated once as empty templates for each model. You write your own queries here for your frontend — don't rely on the admin operations for production user-facing features.

{% callout title="The golden rule" %}
Never edit generated code — it gets overwritten. All your business logic goes in `custom/` (API) and `sdk/src/graphql/` (frontend). These are only ever additive: when you add a new model, the generators create new empty templates but never touch your existing files. If you delete a model from your schema, you need to manually remove its custom and SDK folders.
{% /callout %}

{% callout title="Think about your schema first" %}
Because custom code is never overwritten, the more thought you put into your Prisma schema upfront, the less cleanup you'll need later. Adding models is effortless — the generators create everything for you. Removing models means manually deleting the custom API module and SDK folder for that model.
{% /callout %}

---

## The code generation pipeline

When you run `pnpm db-update`, four things happen:

### Step 1: Generate CRUD resolvers

`nx g @nestledjs/api:generate-crud` reads your Prisma schema and generates a complete GraphQL CRUD API for every model. For each model, you get:

- `{model}` query — read one by ID
- `{models}` query — read many with pagination
- `{models}Count` query — count with filters
- `create{Model}` mutation
- `update{Model}` mutation
- `delete{Model}` mutation

Auth guards are applied automatically based on `@crudAuth` comments in your schema:

```prisma
/// @crudAuth: { "readOne": "user", "readMany": "user", "create": "admin", "update": "user", "delete": "admin" }
model UserPreference {
  id     String @id @default(uuid())
  userId String
  key    String
  value  String
  @@unique([userId, key])
}
```

Auth levels:

- **`"admin"`** (default) — Requires `GqlAuthAdminGuard` (super admin only)
- **`"user"`** — Requires `GqlAuthGuard` (any authenticated user)

### Step 2: Generate TypeScript models

`pnpm generate:models` uses `@prisma/internals` to parse the Prisma DMMF and generate TypeScript classes with GraphQL decorators. These live in `libs/api/core/models/` and are used throughout the API for type-safe resolvers.

### Step 3: Generate the GraphQL SDK

`nx g @nestledjs/shared:sdk` generates two sets of GraphQL operations:

- **Admin SDK** (`sdk/src/__admin/`) — Overwritten every time. Complete fragments, queries, and mutations for every model with nested relation IDs and count fields. Powers the admin dashboard.
- **User SDK** (`sdk/src/graphql/`) — Generated once as empty templates. Created for new models only, never overwrites existing files. This is where you write your own frontend queries.

Both sets are processed by GraphQL Code Generator to produce `libs/shared/sdk/src/generated/graphql.ts` — fully typed TypeScript operations for Apollo Client.

### Step 4: Generate custom API modules

`nx g @nestledjs/api:custom` creates a custom module (service + resolver + NestJS module) for any Prisma model that doesn't already have one. Existing modules are never overwritten — this step is purely additive.

---

## Authentication

The auth system lives in `libs/api/custom/src/lib/plugins/auth/` and provides registration with email verification, login/logout with JWT tokens in HTTP-only cookies, password reset via email, session tracking with device/IP info, and admin emulation for debugging.

On every request, the JWT strategy validates the session is still active in the database, enabling features like session revocation and "logout everywhere". The template also includes Google and GitHub OAuth plus TOTP-based two-factor authentication.

For the full authentication flow, permission system, guards, and frontend integration, see [Authentication & RBAC](/docs/authentication). For session management details, see [Session Security](/docs/session-security). For OAuth setup, see [OAuth](/docs/oauth). For 2FA configuration, see [Two-Factor Auth](/docs/two-factor-auth).

---

## Multi-tenancy

Nestled uses an organization-based multi-tenancy model where every piece of data is scoped to an organization. A Prisma client extension automatically injects `organizationId` filters into all queries for organization-scoped models, and a tenancy middleware validates organization membership on every request.

Organizations add members through an invite system with role-based permissions. Three default roles (Owner, Admin, Member) are created for each organization.

For the full tenant isolation architecture, Prisma extension details, and migration guide, see [Tenant Isolation](/docs/tenant-isolation). For role and permission details, see [Authentication & RBAC](/docs/authentication).

---

## API architecture

### NestJS + GraphQL

The API is a NestJS application using Apollo Server 5 with GraphQL. Key architectural decisions:

- **Webpack build** with `ts-loader` (transpileOnly for speed)
- **Express 5** as the HTTP platform
- **GraphQL subscriptions** via `graphql-ws` + Redis PubSub
- **Query complexity analysis** to prevent expensive queries (configurable limit)

### Module composition

The app module composes three tiers:

1. **Core modules** — Framework-level: Apollo config, Prisma service, PubSub
2. **Generated CRUD modules** — One per Prisma model, auto-generated
3. **Plugin modules** — Hand-maintained business logic (auth, billing, admin, etc.)

### Security middleware

The API bootstraps with a security middleware stack:

- **Helmet** — HTTP security headers (CSP disabled for GraphQL playground)
- **CORS** — Configurable origin validation
- **Cookie parser** — For JWT token extraction
- **HTTPS redirect** — Redirects HTTP to HTTPS in production (via X-Forwarded-Proto)
- **Raw body parsing** — For Stripe webhook signature verification

---

## Web architecture

### React Router 7

The frontend uses React Router 7 with server-side rendering and file-based routing:

```text
apps/web/app/routes/
├── _layout.tsx                    # Root shell
├── _authenticated/                # Protected routes
│   ├── settings/
│   │   ├── profile.tsx
│   │   ├── security.tsx
│   │   ├── billing.tsx
│   │   └── organization.tsx
│   ├── admin/
│   │   ├── users.tsx
│   │   ├── organizations.tsx
│   │   └── audit-logs.tsx
│   └── members/
├── _public/                       # Auth pages
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── verify-email.tsx
├── pricing.tsx
├── checkout/
└── logout.tsx
```

Route groups (`_authenticated/`, `_public/`) apply layout wrappers — the authenticated layout checks for a valid session, and the public layout provides the auth page shell.

### State management

- **Apollo Client 4** for server state (GraphQL queries and mutations)
- **Jotai** for client-side state (atoms)
- **React Router loaders** for route-level data fetching with SSR

### Styling

Tailwind CSS 4 with the Vite plugin for zero-config setup. The shared styles library at `libs/shared/styles/` provides the base Tailwind import.

---

## Integrations

### Stripe billing

Full subscription lifecycle management:

- Product and price syncing from Stripe
- Checkout session creation
- Webhook handling for subscription events (created, updated, deleted, invoice paid/failed)
- Subscription status tracking per organization
- Test mode works with `stripe listen --forward-to localhost:3000/webhooks/stripe`

### Email

Multi-provider email with templates — SMTP for production (SendGrid, AWS SES, Mailtrap), mock mode for CI/testing, and Mailhog for local development. See [Email](/docs/email) for setup and template customization.

### File storage

Multi-provider file uploads with S3, Cloudinary, ImageKit, GCS, and local storage. Set `STORAGE_PROVIDER` in your `.env` and configure the provider-specific keys. See [Storage](/docs/storage) for provider comparison and configuration.

### SMS

Twilio integration for SMS-based two-factor authentication.

---

## Tech stack

| Layer             | Technology              | Version |
| ----------------- | ----------------------- | ------- |
| Monorepo          | Nx                      | 22.5    |
| API framework     | NestJS                  | 11.x    |
| API protocol      | GraphQL (Apollo Server) | 5.x     |
| Database ORM      | Prisma                  | 7.x     |
| Database          | PostgreSQL              | 15      |
| Frontend          | React                   | 19      |
| Routing           | React Router            | 7.x     |
| GraphQL client    | Apollo Client           | 4.x     |
| Styling           | Tailwind CSS            | 4.x     |
| Build (API)       | Webpack                 | 5.x     |
| Build (Web)       | Vite                    | 7.x     |
| Testing           | Vitest                  | 4.x     |
| Auth              | Passport JWT            | —       |
| Billing           | Stripe                  | 19.x    |
| Email             | Nodemailer              | 7.x     |
| Caching           | Redis (ioredis)         | —       |
| Component library | Storybook               | 10.x    |
