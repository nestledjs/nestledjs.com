---
title: Generators
nextjs:
  metadata:
    title: Generators
    description: Reference for every Nestled generator — what it does, what it creates, and when to use it.
---

Nestled uses Nx generators to scaffold your application. The template you cloned was built by running these generators in sequence — and the `pnpm db-update` command continues to run key generators every time you change your schema.

{% callout title="You usually don't need these directly" %}
In day-to-day development, `pnpm db-update` runs the generators that matter (`generate-crud`, `generate:models`, `shared:sdk`, `api:custom`). This page is a reference for understanding what each generator does and for advanced customization.
{% /callout %}

---

## @nestledjs/config

Configuration and workspace setup generators.

### config:setup

```shell
nx g @nestledjs/config:setup
```

Updates `tsconfig.base.json` with required compiler options (decorator metadata, ESNext modules, node module resolution). Installs base dev dependencies including Prisma, Prettier, and ESLint.

### config:init

```shell
nx g @nestledjs/config:init
```

Creates the project configuration files:

- `.prettierrc` and `.prettierignore`
- `.env.example` and `.env`
- `.dev/Dockerfile` and `.dev/docker-compose.yml` (PostgreSQL, Redis, Mailhog)
- `pnpm-workspace.yaml`
- Adds all npm scripts to `package.json` (docker, prisma, build, dev, format, lint, test, etc.)

---

## @nestledjs/api

API-side generators for NestJS + GraphQL.

### api:setup

```shell
nx g @nestledjs/api:setup
```

Installs all API dependencies — NestJS, Apollo Server, GraphQL, Prisma, Passport, bcrypt, nodemailer, Redis, and many more. This is the foundation that all other API generators depend on.

### api:app

```shell
nx g @nestledjs/api:app
```

Scaffolds the NestJS application in `apps/api/` with:

- `main.ts` with security middleware (Helmet, CORS, cookie parsing)
- `app.module.ts` with module composition
- Webpack configuration for Node builds
- `dev:api` script in `package.json`

### api:prisma

```shell
nx g @nestledjs/api:prisma
```

Creates the Prisma library at `libs/api/prisma/` with:

- `schema.prisma` template
- `prisma.config.ts` at workspace root
- Seed files with initial data and ISO 3166 countries
- All `prisma:*` scripts in `package.json`
- The `db-update` script that orchestrates the full code generation pipeline

**Options**: `--overwrite` (default: false) — overwrite existing files

### api:config

```shell
nx g @nestledjs/api:config
```

Creates the API configuration library at `libs/api/config/` with data-access and feature layers for environment variable management and app settings.

**Options**: `--overwrite` (default: false)

### api:core

```shell
nx g @nestledjs/api:core
```

Creates the core framework libraries at `libs/api/core/` with four layers:

- **data-access** — `CoreService` extending Prisma, PubSub setup, shared DTOs (paging, multi-select)
- **feature** — `CoreResolver` and module, Apollo Server configuration
- **models** — GraphQL type generation from Prisma schema (via `generate-models.ts`)
- **helpers** — GraphQL utility functions

Also installs GraphQL plugins for query complexity analysis, no-cache directives, and request logging.

**Options**: `--overwrite` (default: false), `--cookieName` (default: `"__session"`)

### api:generate-crud

```shell
nx g @nestledjs/api:generate-crud
```

**This is the key generator.** Reads your Prisma schema via DMMF and generates a complete CRUD API:

- **Data access module** at `libs/api/generated-crud/data-access/` — model metadata, pagination config
- **Feature module** at `libs/api/generated-crud/feature/` — one resolver per model with full CRUD operations

For each model, generates:

- `{model}` query (read one)
- `{models}` query (read many with pagination)
- `{models}Count` query
- `create{Model}`, `update{Model}`, `delete{Model}` mutations

Reads `@crudAuth` comments from Prisma models to apply auth guards. Handles BigInt IDs with the `GraphQLBigInt` scalar.

### api:custom

```shell
nx g @nestledjs/api:custom
```

Reads your Prisma schema and creates a custom module for each model at `libs/api/custom/src/lib/default/`. Each module contains:

- `{model}.service.ts` — Injectable service for business logic
- `{model}.resolver.ts` — Extends the generated resolver
- `{model}.module.ts` — NestJS module

**Existing files are never overwritten.** This is safe to run repeatedly — it only creates modules for models that don't have one yet. Also registers new modules in `apps/api/src/app.module.ts`.

**Options**: `--name` (default: "custom"), `--directory`, `--overwrite` (default: false)

### api:utils

```shell
nx g @nestledjs/api:utils
```

Creates the utility library at `libs/api/utils/` with:

- `@CtxUser()` decorator — extracts the authenticated user from WebSocket or HTTP context
- `GqlAuthGuard` — requires any authenticated user
- `GqlAuthAdminGuard` — requires a super admin user
- `NestContext` type definition

### api:smtp-mailer

```shell
nx g @nestledjs/api:smtp-mailer
```

Creates the SMTP mailer service library at `libs/api/smtp-mailer/data-access/` for sending emails via Nodemailer.

### api:user

```shell
nx g @nestledjs/api:user
```

Creates user management libraries with data-access and feature layers for user operations.

### api:account

```shell
nx g @nestledjs/api:account
```

Creates account management libraries with:

- **data-access** — account service, DTOs for profile updates, password changes, email management
- **feature** — account resolver and module

### api:plugin

```shell
nx g @nestledjs/api:plugin --name my-feature
```

Creates a new plugin module at `libs/api/custom/src/lib/plugins/{name}/` with service, resolver, and module files. Registers the module in `app.module.ts` under `pluginModules`.

**Options**: `--name` (required), `--directory`

### generators:workspace-setup

```shell
nx g @nestledjs/generators:workspace-setup --name my-app
```

The first command you run after cloning the template. It:

1. **Renames the workspace** — finds and replaces `nestled-template` with your project name throughout all files (package.json, tsconfig paths, imports, Docker config, etc.)
2. Ensures Docker is running
3. Starts Docker Compose services (PostgreSQL, Redis, Mailhog)
4. Runs Prisma migrations (`pnpm prisma db push`)
5. Generates GraphQL models (`pnpm generate:models`)
6. Seeds the database (`pnpm prisma:seed`)

**Options**: `--name` (required) — your project name. Use lowercase with dashes (e.g., `my-app`). This becomes the `@name/` namespace for all imports. Keep it short.

Only runs against localhost databases for safety.

---

## @nestledjs/web

Frontend generators for React + React Router 7.

### web:setup

```shell
nx g @nestledjs/web:setup
```

Installs frontend dependencies — React 19, React Router 7, Vite, Tailwind CSS 4, Apollo Client 4, and related packages.

### web:app

```shell
nx g @nestledjs/web:app
```

Scaffolds the React application at `apps/web/` with:

- Vite development server
- React Router 7 with SSR and file-based routing
- Vitest for unit testing
- `dev:web`, `typecheck`, and `typecheck:watch` scripts

---

## @nestledjs/shared

Generators for code shared between API and web.

### shared:apollo

```shell
nx g @nestledjs/shared:apollo
```

Creates the Apollo Client configuration library at `libs/shared/apollo/` with client setup, auth middleware, and cache configuration.

### shared:sdk

```shell
nx g @nestledjs/shared:sdk
```

**Another key generator.** Reads your Prisma schema and generates GraphQL operation documents for every model:

- **Fragments** — scalar fields (no relations, no IDs) for each model
- **Queries** — read one, read many, count
- **Mutations** — create, update, delete
- **Admin fragments** — includes nested relation IDs and `_count` fields

Also generates `codegen.yml` for GraphQL Code Generator and adds `sdk` / `sdk:watch` scripts.

**Options**: `--forceCodegen` (default: false) — overwrite `codegen.yml` even if it exists

### shared:styles

```shell
nx g @nestledjs/shared:styles
```

Creates the shared styles library at `libs/shared/styles/` with the Tailwind CSS import.

---

## @nestledjs/plugins

Plugin generators for complex features.

### plugins:auth

```shell
nx g @nestledjs/plugins:auth --name auth
```

Creates a complete authentication system at `libs/api/custom/src/lib/plugins/auth/`:

- **Services** — auth service, session service, OAuth service, 2FA helper
- **Resolver** — GraphQL mutations for register, login, logout, password reset, email verification
- **JWT strategy** — Passport JWT with session validation
- **DTOs** — register, login, forgot-password, reset-password, verify-email, invite-user
- **Email templates** — verification, password reset, organization invite

Registers `AuthModule` in `app.module.ts`.

### plugins:integration

```shell
nx g @nestledjs/plugins:integration --name smtp-mailer
```

Creates an integration module at `libs/api/integrations/` for external service connections.

---

## Generator execution order

For reference, this is the full order used to build the template from scratch. You don't need to run these — they've already been run for you.

```shell
# 1. Configuration
nx g @nestledjs/config:setup
nx g @nestledjs/config:init

# 2. API infrastructure
nx g @nestledjs/api:setup
nx g @nestledjs/api:app
nx g @nestledjs/api:prisma
nx g @nestledjs/api:config
nx g @nestledjs/api:core
nx g @nestledjs/api:custom

# 3. API services
nx g @nestledjs/api:smtp-mailer
nx g @nestledjs/api:generate-crud
nx g @nestledjs/api:utils
nx g @nestledjs/api:custom          # Run again to pick up generated models

# 4. Shared libraries
nx g @nestledjs/shared:sdk
nx g @nestledjs/shared:styles

# 5. Authentication
nx g @nestledjs/plugins:auth

# 6. Post-generation setup
nx g @nestledjs/api:workspace-setup

# 7. Frontend
nx g @nestledjs/web:setup
nx g @nestledjs/web:app
nx g @nestledjs/shared:apollo
```
