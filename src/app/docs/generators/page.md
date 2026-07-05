---
title: Generators
nextjs:
  metadata:
    title: Generators
    description: Reference for the Nestled generators you use in day-to-day development.
---

`@nestledjs/generators` contains the generators you use during normal development. They handle workspace setup, code generation from your Prisma schema, and additive scaffolding for new models.

The active 1.1.x package exposes five generators:

- `workspace-setup`
- `crud`
- `models`
- `custom`
- `sdk`

{% callout title="You rarely run these individually" %}
In day-to-day development, `pnpm db-update` runs the schema-driven generators automatically. The full pipeline is: `prisma:generate → @nestledjs/generators:crud → @nestledjs/generators:models → @nestledjs/generators:custom → @nestledjs/generators:sdk`. You usually run generators directly only for first-time workspace setup or when regenerating one layer while debugging.
{% /callout %}

{% callout title="Upgrading from 1.0.0" %}
Upgrade straight to the 1.1.x generator line, then regenerate models so Json fields use the correct GraphQL scalar and `@graphqlOmit` fields are dropped from the schema:

```shell
pnpm add -E @nestledjs/generators@1.1.3
nx g @nestledjs/generators:models
git diff
```

For the models regeneration, expect GraphQL model changes only. See the [changelog](/docs/generators-changelog) for the full version history and per-release upgrade steps.
{% /callout %}

{% callout type="warning" title="Security fix in 1.1.3 — action required for deployed workspaces" %}
Before 1.1.3 the `models` generator ignored `@graphqlOmit`, so annotated fields (commonly secrets like `encryptedAccessToken`) stayed queryable through the GraphQL API. Upgrade to `@nestledjs/generators@1.1.3`, regenerate models, and follow the [security audit steps](/docs/generators-changelog#1-1-3) — including rotating any exposed secrets.
{% /callout %}

---

## @nestledjs/generators:workspace-setup

```shell
nx g @nestledjs/generators:workspace-setup --name my-app
```

Run this once, immediately after cloning the starter template. It bootstraps a fresh workspace in order:

1. **Renames the project** — replaces `nestled-template` with your `--name` across every file
2. **Preserves updater metadata** — deliberately skips `.nestled/` and `.nestled-updates/` so upgrade and doctor workflows keep working
3. **Ensures `.env` exists** — copies `.env.example` if `.env` is missing
4. **Validates `DATABASE_URL`** — refuses non-localhost database URLs as a safety guard
5. **Starts infrastructure** — ensures Docker and Docker Compose are running, then waits for the database
6. **Applies Prisma migrations** — runs the template's Prisma apply command
7. **Generates the Prisma client** — runs `pnpm prisma:generate` before anything imports Prisma
8. **Generates GraphQL types** — runs the template's GraphQL generation command
9. **Seeds the database** — creates initial development data

**Options**: `--name` (required) — your project name. It must match `^[a-z][a-z0-9-]*$`, for example `my-app`, `acme-saas`, or `todo-pro`. This becomes the `@name/` namespace for all imports, so keep it short.

Requires Docker and a local database. The generator intentionally refuses production or hosted database URLs.

---

## @nestledjs/generators:crud {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/generators:crud
```

Reads your Prisma schema via DMMF and generates a complete CRUD API:

- **Data access module** at `libs/api/generated-crud/data-access/` — model metadata and pagination config
- **Feature module** at `libs/api/generated-crud/feature/` — one resolver per model with full CRUD operations

For each model, generates:

- `{model}` query (read one)
- `{models}` query (read many with pagination)
- `{models}Count` query
- `create{Model}`, `update{Model}`, `delete{Model}` mutations

Reads `@crudAuth` comments from Prisma models to apply auth guards. Handles BigInt IDs with the `GraphQLBigInt` scalar.

---

## @nestledjs/generators:models {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/generators:models
```

Reads your Prisma schema and generates TypeScript classes with GraphQL decorators at `libs/api/core/models/`. These models are used by generated CRUD resolvers and by your custom API code.

This generator replaces the older template-local model generation script. Keeping model generation in `@nestledjs/generators` means fixes ship with the generator package instead of requiring template file changes.

Prisma `Json` fields are emitted as `GraphQLJSON`, which supports objects, arrays, and scalar JSON values. If you upgraded from a version that emitted `GraphQLJSONObject`, regenerate models after installing `@nestledjs/generators@1.1.2`.

Fields annotated with `@graphqlOmit` in the Prisma schema are dropped from the generated models (both the `@Field()` decorator and the property). Because the emitted `@ObjectType()` **is** the server GraphQL schema, this makes `models.ts` the single authoritative enforcement point — an omitted field never reaches `api-schema.graphql` and is not queryable through the API. This behavior was fixed in 1.1.3; see the [changelog](/docs/generators-changelog#1-1-3) for the security audit steps if you built with an earlier version.

```prisma
model OAuthAccount {
  id                   String @id
  /// @graphqlOmit
  encryptedAccessToken String   // not emitted to the GraphQL schema
}
```

---

## @nestledjs/generators:custom {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/generators:custom
```

Reads your Prisma schema and creates a custom module for each model at `libs/api/custom/src/lib/default/`. Each module contains:

- `{model}.service.ts` — injectable service for business logic
- `{model}.resolver.ts` — resolver shell for user-facing operations
- `{model}.module.ts` — NestJS module

**Existing files are never overwritten.** This is safe to run repeatedly because it only creates modules for models that do not have one yet. It also registers new modules in `apps/api/src/app.module.ts`.

**Options**: `--name` (default: `custom`), `--directory`, `--overwrite` (default: false)

---

## @nestledjs/generators:sdk {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/generators:sdk
```

Reads your Prisma schema and generates GraphQL operation documents for every model:

- **Fragments** — scalar fields for each model
- **Queries** — read one, read many, count
- **Mutations** — create, update, delete
- **Admin fragments** — includes nested relation IDs and `_count` fields

Also generates `codegen.yml` for GraphQL Code Generator and adds `sdk` / `sdk:watch` scripts.

**Options**: `--forceCodegen` (default: false) — overwrite `codegen.yml` even if it exists

{% callout title="Looking for older scaffolders?" %}
The old split-package commands such as `@nestledjs/api:plugin`, `@nestledjs/api:integrations`, and `@nestledjs/shared:sdk` are legacy template-build commands, not active `@nestledjs/generators` 1.1.x commands. See [Generators (Legacy)](/docs/generators-legacy) only if you are studying how the template was originally assembled.
{% /callout %}
