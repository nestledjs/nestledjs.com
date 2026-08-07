---
title: Generators
nextjs:
  metadata:
    title: Generators
    description: Reference for the Nestled generators you use in day-to-day development.
---

`@nestledjs/generators` contains the generators you use during normal development. They handle workspace setup, code generation from your Prisma schema, and additive scaffolding for new models.

The current 2.x package exposes six generators:

- `workspace-setup`
- `crud`
- `models`
- `custom`
- `model-extension` {% version added="2.0.0" /%}
- `sdk`

{% callout title="This page documents the latest release" %}
Nestled keeps one always-current documentation set rather than a separate copy per version. Anything whose behavior depends on which version you are on carries an inline badge — {% version added="2.0.0" /%} or {% version changed="2.0.0" /%} — so you can tell at a glance whether a section applies to your workspace. Full history lives in the [changelog](/docs/generators-changelog).
{% /callout %}

{% callout title="You rarely run these individually" %}
In day-to-day development, `pnpm db-update` runs the schema-driven generators automatically. The full pipeline is: `prisma:generate → @nestledjs/generators:crud → @nestledjs/generators:models → @nestledjs/generators:custom → @nestledjs/generators:sdk`. You usually run generators directly only for first-time workspace setup or when regenerating one layer while debugging.

`model-extension` is intentionally not part of that pipeline — you run it by hand when you want a resolver module for a specific model.
{% /callout %}

{% callout type="warning" title="Upgrading to 2.0.0 — action required" %}
2.0.0 changes how generated resolvers are registered and removes the per-model shells the `custom` generator used to emit. Upgrading is not a drop-in bump: the template wiring and your custom resolvers have to move together, in order.

Follow the [Migrating to 2.0 guide](/docs/migrating-to-2) before running `pnpm db-update`.
{% /callout %}

{% callout type="warning" title="Security fixes in 1.1.3 and 1.1.5 — audit required for deployed workspaces" %}
If you are upgrading from an older line, two releases carry exposure that upgrading alone does not resolve:

- **Before 1.1.3**, the `models` generator ignored `@graphqlOmit`, so annotated fields (commonly secrets like `encryptedAccessToken`) stayed queryable. See the [1.1.3 audit steps](/docs/generators-changelog#1-1-3).
- **Before 1.1.5**, generated list queries accepted an untyped `filters` blob that reached Prisma's `where` clause verbatim, making every database column filterable — including `@graphqlOmit` columns — and usable as an oracle to recover tokens. See the [1.1.5 audit steps](/docs/generators-changelog#1-1-5).

Both require rotating affected secrets, not just regenerating.
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

### How generated resolvers get registered {% .no-toc %}

{% version changed="2.0.0" /%}

The feature library exports a single module, `ApiGeneratedCrudFeatureModule`, written to `api-generated-crud-feature.module.ts`. The generator imports it into `coreModules` in `apps/api/src/app.module.ts`, and that import **is** the registration — it's what puts every generated resolver into the running schema. Re-running the generator is safe: the module is only added if it isn't already listed.

Before 2.0.0, generated resolvers reached the schema indirectly, by having each per-model custom resolver `extend` its generated counterpart. That's gone. If you are upgrading, see [Migrating to 2.0](/docs/migrating-to-2) — importing this module while inherited custom resolvers are still registered will register every generated field twice.

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

{% version changed="2.0.0" note="No longer generates a module per model." /%}

Creates and maintains the custom API library at `libs/api/custom/` — the library itself plus its stable barrel files:

- `src/index.ts` — the library barrel, re-exporting the two below
- `src/lib/default/index.ts` — created empty if missing; where your model-specific modules are exported from
- `src/lib/plugins/index.ts` — created with `export const customPlugins = []` if missing or empty

**It does not read your Prisma schema and does not create per-model code.** Running it is safe and effectively idempotent: existing extensions under `src/lib/default/` are left untouched.

{% callout type="warning" title="Changed in 2.0.0" %}
Through 1.1.x this generator emitted a `{model}.service.ts` / `{model}.resolver.ts` / `{model}.module.ts` shell for every Prisma model, because generated CRUD relied on those custom resolvers inheriting from the generated ones in order to be registered at all. 2.0.0 registers generated CRUD directly through `ApiGeneratedCrudFeatureModule`, so the shells are no longer needed and are no longer produced.

To add a module for one specific model, use [`model-extension`](#nestledjs-generators-model-extension) — it is explicit and on-demand rather than blanket-generated. See [Migrating to 2.0](/docs/migrating-to-2) for what to do with shells you already have.
{% /callout %}

**Options**: `--name` (default: `custom`), `--directory`, `--overwrite` (default: false)

`--overwrite` removes and recreates the library. It is destructive — everything under `libs/api/custom/` goes, including your own extensions — so it is only for rebuilding a broken library from scratch.

---

## @nestledjs/generators:model-extension {% .no-toc %}

{% version added="2.0.0" /%}

_Run on demand — not part of `pnpm db-update`_

```shell
nx g @nestledjs/generators:model-extension Post
```

Scaffolds an additive, model-specific resolver module for a single Prisma model. Use it when a model needs behavior beyond generated CRUD — a computed field, a domain-specific mutation, an extra guard.

This is the deliberate replacement for the blanket per-model shells that `custom` used to emit: you get a module for the models that actually need one, when they need one, instead of a directory of empty classes for every model in the schema.

It writes two files to `libs/api/custom/src/lib/default/{name}/`:

- `{name}.resolver.ts` — an empty `@Resolver(() => Model)` class for you to fill in
- `{name}.module.ts` — a NestJS module providing and exporting that resolver

It then adds the export to `libs/api/custom/src/lib/default/index.ts` and registers the module in the `defaultModules` array in `apps/api/src/app.module.ts`. No service is generated — inject what you need.

**Options**:

- `model` (required, first positional) — the Prisma model to target. Matched case-insensitively; an unknown name fails listing the available models.
- `--name` — artifact name; defaults to the model name

`--name` changes what the generated files and class are called **without** changing the GraphQL type they target — the resolver is always `@Resolver(() => Model)` for the `model` you passed. So `Post` can carry a `PostPublishing` extension alongside a plain `Post` one, both resolving `Post` fields:

```shell
nx g @nestledjs/generators:model-extension Post --name PostPublishing
```

**It refuses rather than overwrites.** If the target folder already exists and is non-empty, the generator errors instead of touching your code. It also requires the custom library to exist first — run `@nestledjs/generators:custom` if you see _"The custom API library is not initialized"_ — and rejects models marked `@skipCrud`, since those have no generated GraphQL model to target.

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
The old split-package commands such as `@nestledjs/api:plugin`, `@nestledjs/api:integrations`, and `@nestledjs/shared:sdk` are legacy template-build commands, not active `@nestledjs/generators` commands. See [Generators (Legacy)](/docs/generators-legacy) only if you are studying how the template was originally assembled.
{% /callout %}
