---
title: Generators
nextjs:
  metadata:
    title: Generators
    description: Reference for the Nestled generators you use in day-to-day development.
---

These are the generators you use during normal development. They handle workspace setup, code generation from your Prisma schema, and scaffolding new modules.

{% callout title="You rarely run these individually" %}
In day-to-day development, `pnpm db-update` runs the key generators automatically. The full pipeline is: `prisma:generate → generate-crud → generate:models → custom → sdk`. You only need to run generators directly for workspace setup, adding plugins, or adding integrations.
{% /callout %}

---

## @nestledjs/api:workspace-setup

```shell
nx g @nestledjs/api:workspace-setup --name my-app
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

## @nestledjs/api:generate-crud {% .no-toc %}

_Part of `pnpm db-update`_

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

---

## @nestledjs/api:custom {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/api:custom
```

Reads your Prisma schema and creates a custom module for each model at `libs/api/custom/src/lib/default/`. Each module contains:

- `{model}.service.ts` — Injectable service for business logic
- `{model}.resolver.ts` — Extends the generated resolver
- `{model}.module.ts` — NestJS module

**Existing files are never overwritten.** This is safe to run repeatedly — it only creates modules for models that don't have one yet. Also registers new modules in `apps/api/src/app.module.ts`.

**Options**: `--name` (default: "custom"), `--directory`, `--overwrite` (default: false)

---

## @nestledjs/shared:sdk {% .no-toc %}

_Part of `pnpm db-update`_

```shell
nx g @nestledjs/shared:sdk
```

Reads your Prisma schema and generates GraphQL operation documents for every model:

- **Fragments** — scalar fields (no relations, no IDs) for each model
- **Queries** — read one, read many, count
- **Mutations** — create, update, delete
- **Admin fragments** — includes nested relation IDs and `_count` fields

Also generates `codegen.yml` for GraphQL Code Generator and adds `sdk` / `sdk:watch` scripts.

**Options**: `--forceCodegen` (default: false) — overwrite `codegen.yml` even if it exists

---

## @nestledjs/api:plugin

```shell
nx g @nestledjs/api:plugin --name my-feature
```

Creates a new plugin module at `libs/api/custom/src/lib/plugins/{name}/` with service, resolver, and module files. Registers the module in `app.module.ts` under `pluginModules`.

Use this when you want to add a new feature that isn't tied to a specific Prisma model — things like webhooks, notifications, or scheduled tasks.

**Options**: `--name` (required), `--directory`

---

## @nestledjs/api:integrations

```shell
nx g @nestledjs/api:integrations
```

Creates the integrations library at `libs/api/integrations/` for housing external service connection modules (email, SMS, storage, payments, etc.). This sets up the NestJS library structure that individual integration modules are added to.
