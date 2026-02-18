# Nestled Documentation Plan

This plan covers the complete restructure of nestledjs.com to document the **Nestled Template Starter Kit** and the underlying generators. Each section below maps to a page on the site. Checkboxes track completion.

---

## Site Structure

```
Navigation (left sidebar):
  Documentation
    Getting started          /
    Installation             /docs/installation
    Commands                 /docs/commands           (NEW)
    Architecture             /docs/architecture
    Generators               /docs/generators
    Deployment               /docs/deployment         (NEW)
```

**Homepage quick-link cards** (4):
- Installation → `/docs/installation`
- Architecture → `/docs/architecture`
- Generators → `/docs/generators`
- Forms → `https://nestledforms.com` (external)

---

## Page-by-Page Plan

### Page 1: Getting Started (Homepage) `/`

- [ ] **Status**: Needs rewrite

**Purpose**: The "wow" page. Communicate what Nestled gives you in 30 seconds.

**Content**:
- Lead: "Clone a repo. Design your Prisma schema. Run one command. You have a production-ready full-stack app with auth, organizations, teams, roles, permissions, billing, admin dashboard, and a fully generated GraphQL API — instantly."
- Quick-link cards (Installation, Architecture, Generators, Forms)
- **Quick start** (the 5-minute version):
  1. `git clone https://github.com/nickvdyck/nestled-starter.git my-app && cd my-app`
  2. `cp .env.example .env`
  3. `pnpm install`
  4. `docker compose -f .dev/docker-compose.yml -p nestled up -d`
  5. Design your Prisma schema at `libs/api/prisma/src/lib/schemas/schema.prisma`
  6. `pnpm db-update` — generates your entire API, SDK, and admin CRUD
  7. `pnpm prisma db push` — applies schema to database
  8. Start dev: `nx serve api`, `nx serve web`, `pnpm sdk watch`
  9. Visit `http://localhost:4200` — you have a working app
- **What you get out of the box** (brief feature list):
  - Authentication (register, login, password reset, email verification)
  - Multi-tenant organizations with teams
  - Role-based access control (RBAC)
  - Stripe billing integration
  - Generated CRUD API for every model
  - Admin dashboard for managing data
  - GraphQL SDK with full TypeScript types
  - E2E testing infrastructure
  - Docker + CI/CD ready
- **The key insight**: Explain `pnpm db-update` — design your schema, run one command, everything regenerates. The more time you spend on your Prisma schema, the less code you write.
- Key features section (keep existing: code gen, monorepo, full-stack integration)
- Getting help section (keep existing: GitHub, community)

---

### Page 2: Installation `/docs/installation`

- [ ] **Status**: Needs rewrite

**Purpose**: Detailed setup guide from zero to running app.

**Content**:
- **Prerequisites**:
  - Node.js 20+ (template uses Node 22)
  - pnpm (`npm install -g pnpm`)
  - Git
  - Docker (required for PostgreSQL, Redis, Mailhog)
- **Clone the template**:
  ```
  git clone https://github.com/nickvdyck/nestled-starter.git my-app
  cd my-app
  ```
- **Environment setup**:
  ```
  cp .env.example .env
  ```
  - Document every env var group from `.env.example`:
    - Core: APP_NAME, NODE_ENV, PORT, JWT_SECRET, API_URL, SITE_URL
    - Database: DATABASE_URL
    - Email: SMTP_HOST, SMTP_PORT, EMAIL_PROVIDER (smtp|mock)
    - 2FA: TWO_FACTOR_ISSUER, TWO_FACTOR_WINDOW, TWO_FACTOR_ENCRYPTION_KEY
    - OAuth: GOOGLE_OAUTH_*, GITHUB_OAUTH_*
    - Stripe: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CURRENCY
    - Storage: STORAGE_PROVIDER, S3/Cloudinary/ImageKit/GCS keys
  - Note: For local dev, defaults work — just need JWT_SECRET and DATABASE_URL
- **Start infrastructure**:
  ```
  docker compose -f .dev/docker-compose.yml -p nestled up -d
  ```
  - Explain what this starts: PostgreSQL (5432), Redis (6379), Mailhog (SMTP 1025, UI 8025)
- **Install dependencies**:
  ```
  pnpm install
  pnpm approve --builds
  ```
- **Initialize database**:
  ```
  pnpm prisma db push
  pnpm prisma:seed
  ```
  - Explain what seed creates (admin user, sample data)
- **Start development**:
  ```
  nx serve api      # API on http://localhost:3000
  nx serve web      # Web on http://localhost:4200
  pnpm sdk watch    # Auto-generate types on schema changes
  ```
- **Verify it works**:
  - Visit http://localhost:4200 — should see login page
  - Visit http://localhost:3000/graphql — GraphQL playground
  - Visit http://localhost:8025 — Mailhog (catch emails)
- **Callout**: Link to Commands page for full script reference

---

### Page 3: Commands `/docs/commands` (NEW)

- [ ] **Status**: New page

**Purpose**: Reference page for every npm script and common nx command.

**Content**:
- **Development commands**:
  - `nx serve api` — Start API dev server (port 3000)
  - `nx serve web` — Start web dev server (port 4200)
  - `pnpm sdk watch` — Watch GraphQL operations and regenerate types
  - `pnpm dev:api` — Alias for nx serve api
  - `pnpm dev:web` — Alias for nx serve web
- **The most important command — `pnpm db-update`**:
  - Explain this is the single command you run after any Prisma schema change
  - What it does under the hood:
    1. `nx g @nestledjs/api:generate-crud` — Regenerates CRUD resolvers for all models
    2. `pnpm generate:models` — Regenerates GraphQL/TypeScript models from Prisma DMMF
    3. `nx g @nestledjs/api:custom` — Regenerates custom module boilerplate (won't overwrite existing)
    4. `nx g @nestledjs/shared:sdk` — Regenerates GraphQL fragments, queries, mutations for frontend
  - After running db-update, also run: `pnpm prisma db push` to apply schema to database
- **Database commands**:
  - `pnpm prisma db push` — Apply schema changes to database
  - `pnpm prisma:migrate` — Create and run migrations
  - `pnpm prisma:format` — Format Prisma schema
  - `pnpm prisma:generate` — Generate Prisma client
  - `pnpm prisma:seed` — Seed database with initial data
  - `pnpm prisma:studio` — Open Prisma Studio (database GUI)
  - `pnpm prisma:reset` — Reset database and re-seed
  - `pnpm prisma:apply` — Format + push (convenience)
- **Code generation commands**:
  - `pnpm generate:models` — Generate TypeScript models from Prisma schema
  - `pnpm sdk` — Run GraphQL codegen once
  - `pnpm sdk watch` — Watch mode for GraphQL codegen
- **Build commands**:
  - `pnpm build:api` — Build API for production
  - `pnpm build:web` — Build web for production (if aliased, otherwise `nx build web`)
- **Docker commands**:
  - `pnpm docker:up` — Start dev services (Postgres, Redis, Mailhog)
  - `pnpm docker:down` — Stop dev services
  - `pnpm docker:logs` — View service logs
  - `pnpm docker:build` — Build production Docker image
  - `pnpm docker:run` — Run production Docker container
  - `pnpm docker:push` — Push Docker image
- **Testing commands**:
  - `pnpm test` — Run unit tests
  - `pnpm e2e` — Run E2E tests
  - `pnpm lint` — Lint all projects
  - `pnpm typecheck` — TypeScript type checking + React Router typegen
  - Document the test-db.sh script: start, reset, migrate, stop, logs
- **Nx commands**:
  - `npx nx graph` — Visualize workspace dependency graph
  - `npx nx affected -t test` — Run tests only for affected projects
  - `npx nx affected -t lint` — Lint only affected projects
- **Utility commands**:
  - `pnpm clean` — Hard reset and reinstall (nuclear option)
  - `pnpm format` — Format code with Prettier

---

### Page 4: Architecture `/docs/architecture` (rename from architecture-guide)

- [ ] **Status**: Needs full content (currently lorem ipsum)

**Purpose**: Explain how Nestled structures your application and why.

**Content**:
- **Overview**: Nestled uses an Nx monorepo with a library-based architecture. Everything is organized into apps (deployable) and libs (shared code).
- **Project structure**:
  ```
  my-app/
  ├── apps/
  │   ├── api/          # NestJS GraphQL API
  │   ├── web/          # React + React Router frontend
  │   └── api-e2e/      # E2E tests
  ├── libs/
  │   ├── api/          # Backend libraries
  │   │   ├── config/
  │   │   ├── core/     (data-access, feature, helpers, models)
  │   │   ├── custom/   (your business logic lives here)
  │   │   ├── generated-crud/ (auto-generated, don't edit)
  │   │   ├── integrations/   (email, SMS, storage, Stripe)
  │   │   ├── prisma/   (schema, seeds, migrations)
  │   │   └── utils/    (guards, decorators)
  │   ├── shared/       # Isomorphic code
  │   │   ├── apollo/   (GraphQL client config)
  │   │   ├── sdk/      (auto-generated types + operations)
  │   │   ├── styles/   (Tailwind)
  │   │   └── utils/
  │   ├── web/          # Web-specific utilities
  │   └── web-ui/       # Component library (Storybook)
  └── .dev/             # Docker, local dev config
  ```
- **Library layers pattern**: Explain data-access / feature / models / helpers convention
- **Generated vs custom code**:
  - `generated-crud/` — Auto-generated by `pnpm db-update`. Never edit directly. Regenerated on every schema change.
  - `custom/` — Your business logic. Has two sub-areas:
    - `default/` — One module per Prisma model with service, resolver, module. Auto-created but never overwritten. Extend generated CRUD here.
    - `plugins/` — Feature modules (auth, billing, admin, storage, etc.). Fully hand-maintained.
  - Key rule: Don't extend generated resolvers. Create separate custom resolvers for user-facing operations.
- **Authentication system**:
  - JWT + session-based auth
  - Cookie-based token persistence
  - Registration, login, logout, password reset, email verification
  - Admin emulation (impersonation)
  - JWT strategy validates session is still active in database
  - Located in `libs/api/custom/src/lib/plugins/auth/`
- **Multi-tenancy (Organizations)**:
  - Organization → Members → Teams structure
  - Tenancy middleware sets organization context from user's active org or GraphQL variable
  - Queries automatically scoped to organization
  - Invite system for adding members
- **Role-based access control (RBAC)**:
  - Role and Permission models
  - Guard-based authorization: `GqlAuthGuard` (user), `GqlAuthAdminGuard` (admin)
  - `@crudAuth` Prisma comments for declarative security on generated CRUD:
    ```prisma
    /// @crudAuth: { "readOne": "user", "readMany": "user", "create": "admin", "update": "user", "delete": "admin" }
    model UserPreference { ... }
    ```
- **The code generation pipeline** (`pnpm db-update`):
  - Diagram/explanation of the flow: Prisma schema → DMMF parser → CRUD resolvers + GraphQL models + SDK fragments/queries/mutations
  - What gets regenerated vs what's preserved
- **API architecture**:
  - NestJS with Apollo Server + GraphQL
  - Module composition: core → generated-crud → custom → plugins
  - Middleware: Logger, Tenancy
  - Security: Helmet, CORS, cookie security, HTTPS redirect
  - Webhook handling (Stripe) with raw body parsing
- **Web architecture**:
  - React 19 + React Router v7 with SSR
  - File-based routing with route groups: `_authenticated/`, `_public/`
  - Apollo Client 4 with auth middleware
  - Jotai for local state
  - Tailwind CSS 4
- **Integrations**:
  - **Stripe billing**: Subscription management, webhook handling, product/price sync
  - **Email**: SMTP provider with mock mode for testing, Mailhog for local dev
  - **File storage**: Multi-provider (Local, S3, Cloudinary, ImageKit, GCS)
  - **SMS**: Twilio for 2FA
- **Testing**:
  - Unit tests: Vitest
  - E2E tests: Vitest + custom test factories
  - Test database: Separate PostgreSQL on port 5433
  - CI: GitHub Actions with PostgreSQL service container
- **Tech stack summary table**:
  | Layer | Technology |
  |---|---|
  | Monorepo | Nx 22 |
  | API | NestJS 11 |
  | Database | Prisma 7 + PostgreSQL 15 |
  | API Protocol | GraphQL (Apollo Server 5) |
  | Frontend | React 19 + React Router 7 |
  | Styling | Tailwind CSS 4 |
  | Build | Vite + Webpack (API) |
  | Testing | Vitest |
  | Auth | Passport JWT + Sessions |
  | Billing | Stripe |
  | Email | Nodemailer |
  | Storage | Multi-provider (S3, etc.) |

---

### Page 5: Generators `/docs/generators`

- [ ] **Status**: Needs rewrite

**Purpose**: Reference for all available generators. Frame as "under the hood" — most users just run `pnpm db-update`.

**Content**:
- **Important note at top**: Callout explaining that generators are the building blocks that created your template. In day-to-day development, you'll mostly use `pnpm db-update` which runs the right generators automatically. This page documents the underlying commands for reference and advanced customization.
- **Generator namespaces**: @nestledjs/config, @nestledjs/api, @nestledjs/web, @nestledjs/shared, @nestledjs/plugins
- **For each generator**, document:
  - What it does (1-2 sentences)
  - The command: `nx g @nestledjs/namespace:generator`
  - Options (if any)
  - What files/directories it creates
  - Dependencies on other generators

#### @nestledjs/config generators:
- **config:setup** — Updates TypeScript config, installs base dev dependencies (Prisma, Prettier, ESLint)
- **config:init** — Creates .env, .prettierrc, Docker config, adds all npm scripts to package.json

#### @nestledjs/api generators:
- **api:setup** — Installs all API dependencies (NestJS, GraphQL, Prisma, auth, etc.)
- **api:app** — Scaffolds the NestJS application in `apps/api/` with webpack config
- **api:prisma** — Creates Prisma library with schema, seed files, all prisma:* scripts, and the `db-update` script
- **api:config** — Creates API configuration library (env vars, settings)
- **api:core** — Creates core libraries (data-access, feature, models, helpers) with Apollo Server config, PubSub, GraphQL plugins
- **api:custom** — Reads Prisma schema, creates one module per model in `libs/api/custom/` with service, resolver, module. Won't overwrite existing files.
- **api:generate-crud** — Reads Prisma schema via DMMF, generates full CRUD resolvers with auth guards based on `@crudAuth` comments. Creates `libs/api/generated-crud/`.
- **api:utils** — Creates utility library with decorators (@CtxUser), guards (GqlAuthGuard, GqlAuthAdminGuard), types
- **api:smtp-mailer** — Creates email service library
- **api:user** — Creates user management library (service + resolver)
- **api:account** — Creates account management library (profile, password, email operations)
- **api:plugin** — Creates a new plugin module in `libs/api/custom/src/lib/plugins/`. Options: `--name`
- **api:workspace-setup** — Post-generation: ensures Docker, runs migrations, generates models, seeds database

#### @nestledjs/web generators:
- **web:setup** — Installs React 19, React Router 7, Vite, Tailwind, Apollo Client
- **web:app** — Scaffolds React application in `apps/web/` with file-based routing, adds typecheck scripts

#### @nestledjs/shared generators:
- **shared:apollo** — Creates Apollo Client configuration library
- **shared:sdk** — Reads Prisma schema, generates GraphQL fragments/queries/mutations per model, sets up codegen.yml. Options: `--forceCodegen`
- **shared:styles** — Creates shared Tailwind CSS library

#### @nestledjs/plugins generators:
- **plugins:auth** — Creates complete authentication plugin (register, login, password reset, email verification, JWT strategy, email templates). Added to app.module.ts automatically.
- **plugins:integration --name smtp-mailer** — Creates SMTP integration module

#### Generator execution order (for reference):
Document the full order as listed in the nestled README, with a note that this has already been run for you in the template.

---

### Page 6: Deployment `/docs/deployment` (NEW)

- [ ] **Status**: New page

**Purpose**: How to deploy your Nestled app to production.

**Content**:
- **Railway deployment** (primary path):
  - Clone the Railway template (link TBD — user will provide)
  - Connect to your repo
  - Set environment variables (document each required one):
    - DATABASE_URL (Railway PostgreSQL addon)
    - REDIS_URL (Railway Redis addon)
    - JWT_SECRET
    - API_URL (your Railway API URL)
    - SITE_URL (your Railway web URL or custom domain)
    - EMAIL_PROVIDER + SMTP settings
    - STRIPE keys (if using billing)
    - STORAGE_PROVIDER + provider keys (if using file uploads)
    - TWO_FACTOR_ENCRYPTION_KEY (if using 2FA)
  - Deploy
- **Docker deployment** (manual):
  - The Dockerfile at `.dev/Dockerfile` (Node 22-slim, pnpm)
  - Build: `docker build -f .dev/Dockerfile -t my-app .`
  - Required services: PostgreSQL 15, Redis
  - Environment variables (same as above)
- **CI/CD with GitHub Actions**:
  - Explain the existing `.github/workflows/ci.yml`
  - Triggered on push/PR to develop
  - Runs affected tests with PostgreSQL service container
  - How to extend for deployment
- **Production checklist**:
  - [ ] Set NODE_ENV=production
  - [ ] Set strong JWT_SECRET
  - [ ] Configure real SMTP (not mock)
  - [ ] Set up Stripe webhook endpoint
  - [ ] Configure CORS origins for your domain
  - [ ] Set up file storage provider (S3/etc. instead of local)
  - [ ] Run database migrations
  - [ ] Seed initial admin user
  - [ ] Set up monitoring/logging

---

## Navigation Update

When all pages are done, update `src/lib/navigation.ts`:

```ts
export const navigation = [
  {
    title: 'Documentation',
    links: [
      { title: 'Getting started', href: '/' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Commands', href: '/docs/commands' },
      { title: 'Architecture', href: '/docs/architecture' },
      { title: 'Generators', href: '/docs/generators' },
      { title: 'Deployment', href: '/docs/deployment' },
    ],
  },
]
```

Also rename `architecture-guide/` directory to `architecture/` for cleaner URLs.

---

## Implementation Order

Work through pages in this order (each can be done in one session):

1. **Getting started (homepage)** — Most impactful, sets the tone
2. **Installation** — Users need this immediately after the homepage
3. **Commands** — Quick reference, straightforward to write
4. **Architecture** — Deep dive, biggest page, most research needed
5. **Generators** — Reference docs, can pull heavily from generator schemas
6. **Deployment** — Depends on Railway template being ready (user to provide details)

---

## Style Guidelines

- Write for developers who know TypeScript/React/Node but are new to Nestled
- Lead with the "what" and "why", not just the "how"
- Use callout boxes for important notes, tips, and warnings
- Show real commands from the actual template, not abstract examples
- Keep code blocks practical — show the actual file paths and commands
- Link between pages liberally (e.g., Installation links to Commands, Architecture links to Generators)
- Don't document Forms — it's a separate project with its own site
