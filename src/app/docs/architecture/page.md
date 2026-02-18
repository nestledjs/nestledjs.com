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

### Generated code (auto-managed)

**`libs/api/generated-crud/`** — Completely regenerated every time you run `pnpm db-update`. Never edit files here. They contain:

- A CRUD resolver for every Prisma model (findOne, findMany, create, update, delete, count)
- Input/output DTOs
- Auth guards based on `@crudAuth` Prisma comments
- Database model metadata

**`libs/shared/sdk/src/generated/`** — Auto-generated TypeScript types for all GraphQL operations.

**`libs/api/core/models/`** — TypeScript models generated from the Prisma DMMF.

### Custom code (hand-maintained)

**`libs/api/custom/`** has two areas:

**`custom/src/lib/default/`** — One module per Prisma model, each with a service, resolver, and module file. These are created once by `pnpm db-update` but **never overwritten**. This is where you add model-specific business logic that goes beyond basic CRUD.

**`custom/src/lib/plugins/`** — Feature modules that are fully hand-maintained. The template includes:

| Plugin | Purpose |
|---|---|
| `auth/` | Authentication — register, login, password reset, email verification, JWT, OAuth, 2FA |
| `admin/` | Admin operations — user emulation, management queries |
| `billing/` | Stripe subscriptions, checkout, webhook handling |
| `security/` | Security event tracking, audit logging |
| `storage/` | Multi-provider file uploads (S3, Cloudinary, ImageKit, GCS, local) |
| `api-tokens/` | Bearer token authentication |
| `contact-mailer/` | Email sending with templates |
| `tenancy/` | Organization context middleware |

{% callout title="The golden rule" %}
Never edit generated code. Put your business logic in `custom/src/lib/default/` (per-model customizations) or `custom/src/lib/plugins/` (feature modules). Generated code gets overwritten; custom code never does.
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

`nx g @nestledjs/shared:sdk` reads your Prisma schema and generates GraphQL operation documents for every model:

- **Fragments** with all scalar fields (no relations)
- **Queries** for reading one, reading many, and counting
- **Mutations** for creating, updating, and deleting
- **Admin fragments** with nested relation IDs and count fields

These `.graphql` files are then processed by GraphQL Code Generator to produce `libs/shared/sdk/src/generated/graphql.ts` — fully typed TypeScript operations ready to use with Apollo Client.

### Step 4: Generate custom modules

`nx g @nestledjs/api:custom` creates a custom module (service + resolver + NestJS module) for any Prisma model that doesn't already have one. Existing custom modules are never overwritten.

---

## Authentication

The auth system lives in `libs/api/custom/src/lib/plugins/auth/` and provides:

- **Registration** with email verification
- **Login/logout** with JWT tokens stored in HTTP-only cookies
- **Password reset** via email with expiring tokens
- **Session tracking** — every login creates a `UserSession` record with device info and IP address
- **Session validation** — the JWT strategy validates the session is still active on every request
- **Admin emulation** — super admins can impersonate users for debugging

### How auth works

1. User logs in — API validates credentials, creates a `UserSession`, returns a JWT
2. JWT is stored in an HTTP-only cookie (or Authorization header)
3. On every request, the `JwtStrategy` extracts the JWT, verifies the session is still valid in the database, and attaches the user to the request context
4. GraphQL resolvers use `@UseGuards(GqlAuthGuard)` to require authentication or `@UseGuards(GqlAuthAdminGuard)` to require admin access
5. The `@CtxUser()` decorator provides the authenticated user in resolver methods

### OAuth and 2FA

The template includes infrastructure for Google and GitHub OAuth, plus TOTP-based two-factor authentication using Speakeasy. Set the appropriate environment variables to enable these features.

---

## Multi-tenancy

Nestled uses an organization-based multi-tenancy model:

```text
User → OrganizationMember → Organization
                               ├── Teams → TeamMembers
                               ├── Roles → Permissions
                               ├── Invites
                               └── Subscription (Stripe)
```

### Tenancy middleware

A middleware on the GraphQL endpoint sets the organization context for every request:

1. Reads the user's `activeOrganizationId` (or a `$organizationId` GraphQL variable)
2. Validates the user is a member of that organization
3. Makes the organization ID available to all resolvers

This means your queries are automatically scoped — users can only access data belonging to their active organization.

### Invites

Organizations add members through an invite system. An admin sends an invite email, the recipient clicks a link, and they're added as a member with a specified role.

---

## Role-based access control

The RBAC system uses three models:

- **Role** — Named roles (e.g., "Owner", "Admin", "Member") scoped to an organization
- **Permission** — Action/subject pairs (e.g., `create`/`Team`, `read`/`AuditLog`)
- **OrganizationMember** — Links a user to an organization with a specific role

Roles have many permissions. Members have a role. Guards check the role's permissions to authorize operations.

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

Multi-provider email with templates:

- **SMTP** for production (SendGrid, AWS SES, Mailtrap, etc.)
- **Mock** for CI/testing (logs to console)
- **Mailhog** for local development (SMTP on port 1025, UI at [localhost:8025](http://localhost:8025))

### File storage

Multi-provider file uploads:

| Provider | Config |
|---|---|
| Local | Files stored in `./uploads` directory |
| S3 | AWS S3 or S3-compatible storage |
| Cloudinary | Image transformation service |
| ImageKit | Image optimization CDN |
| GCS | Google Cloud Storage |

Set `STORAGE_PROVIDER` in your `.env` and configure the provider-specific keys.

### SMS

Twilio integration for SMS-based two-factor authentication.

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Monorepo | Nx | 22.5 |
| API framework | NestJS | 11.x |
| API protocol | GraphQL (Apollo Server) | 5.x |
| Database ORM | Prisma | 7.x |
| Database | PostgreSQL | 15 |
| Frontend | React | 19 |
| Routing | React Router | 7.x |
| GraphQL client | Apollo Client | 4.x |
| Styling | Tailwind CSS | 4.x |
| Build (API) | Webpack | 5.x |
| Build (Web) | Vite | 7.x |
| Testing | Vitest | 4.x |
| Auth | Passport JWT | — |
| Billing | Stripe | 19.x |
| Email | Nodemailer | 7.x |
| Caching | Redis (ioredis) | — |
| Component library | Storybook | 10.x |
