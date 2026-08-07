---
title: Generators Changelog
nextjs:
  metadata:
    title: Generators Changelog
    description: Version history for the @nestledjs/generators package, including breaking changes, security fixes, and upgrade steps.
---

Version history for `@nestledjs/generators`. Entries are newest first. Anything that requires action on an already-generated workspace calls it out explicitly, with the upgrade commands to run.

For what each generator does, see the [Generators reference](/docs/generators). For changes to the starter template itself, see [Upgrade Notes](/docs/upgrade-notes).

---

## 2.0.0 {% .no-toc %}

**Major — breaking.** Changes how generated CRUD resolvers are registered, and removes the per-model shells the `custom` generator used to emit.

{% callout type="warning" title="Upgrading requires ordered steps" %}
This is not a drop-in bump. The template wiring and your custom resolvers must move together — follow the [Migrating to 2.0 guide](/docs/migrating-to-2) rather than the summary below.
{% /callout %}

### Changed

**`crud` registers generated resolvers through one canonical feature module.** The populated module is now written to `api-generated-crud-feature.module.ts`, imported into the API's `coreModules`, and exported from the generated feature barrel. The legacy `api-admin-crud-feature.module.ts` is deleted during generation. This removes the duplicate `ApiGeneratedCrudFeatureModule` class that the old scaffold-plus-alternate-file flow produced.

**`custom` no longer generates a resolver/service/module shell per Prisma model.** Generated CRUD previously reached the schema only because each custom resolver extended its generated counterpart — inheritance was load-bearing wiring, so every model needed a shell whether or not it had custom behavior. With registration now explicit, the generator maintains only the custom API library and its stable barrels, preserving every extension already present.

### Added

**New `model-extension` generator.**

```shell
nx g @nestledjs/generators:model-extension Post
```

Creates an additive, model-specific resolver module on demand — the deliberate replacement for blanket shells. The artifact name defaults to the Prisma model; `--name` gives it a more specific name without changing the GraphQL type it targets, so one model can carry several extension modules. See the [reference](/docs/generators#nestledjs-generators-model-extension).

### Upgrading

```shell
pnpm add -E @nestledjs/generators@2.0.0
```

Then work through [Migrating to 2.0](/docs/migrating-to-2): upgrade the template wiring, de-inherit your custom resolvers **in the same change**, delete the empty shells, then `pnpm db-update` and verify your root fields and guards.

{% callout type="warning" title="Do not run these steps separately" %}
NestJS scans inherited resolver methods. Importing `ApiGeneratedCrudFeatureModule` while inheriting custom resolvers are still registered registers duplicate callbacks for **every** generated GraphQL field. Never deploy an intermediate state where both are live.
{% /callout %}

---

## 1.1.6 {% .no-toc %}

**Minor — authorization hardening.**

### Added

**`crud` emits an explicit access-level decorator on every generated operation.** The template registers a global `APP_GUARD` that refuses any operation which has not declared an access level. NestJS applies no guard unless one is asked for, so previously an operation missing `@UseGuards` was reachable anonymously — and a missing decorator was indistinguishable from an oversight.

Hand-written resolvers could always declare themselves with `@Public()` / `@Authenticated()` / `@AdminOnly()`; generated ones could not, so the template carried an interim bridge that accepted an attached auth guard as a declaration — a loophole any hand-written resolver could lean on too. Generated operations now declare their own level, so that bridge can be deleted.

Levels map as follows, from the resolved `@crudAuth` config:

| Level                                       | Emitted                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `admin` (also the default when unannotated) | `@AdminOnly()` + `@UseGuards(GqlAuthAdminGuard)`            |
| `user`                                      | `@Authenticated()` + `@UseGuards(GqlAuthGuard)`             |
| `public`                                    | `@Public()`, no guard                                       |
| custom, e.g. `billingAdmin`                 | `@Authenticated()` + `@UseGuards(GqlAuthBillingAdminGuard)` |

A custom level's decorator declares only that a level exists; the custom guard stays authoritative about what it means, so a `noaccess` guard still denies everyone. No stricter level is inferred from the name.

This also fixes an older reporting problem: `@crudAuth: { "readMany": "public" }` previously emitted **no decorator at all**, leaving a blank line where the guard would go — output byte-identical to a dropped decorator, a bad merge, or a generator bug. `public` is now positive and auditable, and absence is unambiguously a defect.

### Upgrading

{% callout type="warning" title="Ordering is a hard dependency" %}
Generated output imports `AdminOnly`, `Authenticated`, and `Public` from `@<scope>/api/utils`. Those symbols exist only in a template that has taken the global-guard change.

**First** apply the template upgrade note that adds the access-level decorators and `GlobalAuthGuard`, **then** bump to 1.1.6 and regenerate. Reversing the order produces generated code that does not compile, with an unresolved-import error that says nothing about ordering.
{% /callout %}

```shell
# after applying the template upgrade note
pnpm add -E @nestledjs/generators@1.1.6
nx g @nestledjs/generators:crud
```

---

## 1.1.5 {% .no-toc %}

**Patch — two fixes, one with critical security impact.**

### Fixed

**`crud` replaces the opaque `filters` blob with typed filter inputs (security).** Generated list queries inherited an untyped `filters` field (`GraphQLJSONObject`) from the template's `CorePagingInput`, and consuming template code merged it straight into Prisma's `where` clause.

Three properties combined into an anonymously exploitable read primitive: the blob was opaque, so GraphQL could not validate it; it reached `where` verbatim, so a caller controlled the full Prisma filter grammar (`AND`/`OR`/`NOT`, `contains`/`startsWith`/`gt`/`in`, and relation filters at arbitrary depth); and Prisma's `where` is built from the **database** model rather than the GraphQL model, so every column was filterable whether or not it was queryable.

That last point meant `@graphqlOmit` offered no protection here. Credential columns removed from the GraphQL layer stayed filterable, and result presence acts as an oracle — roughly 60 requests per character — so password-reset and invite tokens could be recovered and used for account takeover with no cracking step.

Each model now gets a typed `<Model>FilterInput` containing only its filterable columns, with operator sub-inputs chosen per scalar type. It is built from the same field list the CRUD generator already filters with `@graphqlOmit`, so an omitted column is unfilterable by construction rather than by a second list that could drift. `Json` columns and scalar lists are not filterable, and `AND`/`OR`/`NOT` are not emitted. Relation nesting is bounded by generating a distinct type per level (default 3, configurable with `--filterDepth`).

**`sdk` carries per-model `auth` into the SDK copy of `database-models.ts`.** Two generated copies of that file are produced by two different model loaders. The `sdk` copy did `auth: parseCrudAuth(doc) || undefined`, and because `JSON.stringify` drops undefined values, the `auth` key vanished entirely for any model without an annotation. Consumers that enforce per-model auth while compiling relation traversals import the **SDK** copy, so they had nothing to enforce against. Both loaders now share one resolver, so every model in both copies carries a complete `auth` object.

### Upgrading

```shell
pnpm add -E @nestledjs/generators@1.1.5
nx g @nestledjs/generators:crud
nx g @nestledjs/generators:sdk
```

Commit the updated `libs/shared/sdk/src/lib/database-models.ts`, then redeploy.

This is a **breaking schema change** for any caller that passed raw `filters` JSON — which is the vulnerability, so the break is intended:

- Generated `__admin` SDK operations are deleted and rebuilt on every run, so they pick up the new schema automatically.
- Public SDK operations under `libs/shared/sdk/src/graphql/<model>` are **preserved** across runs to protect hand edits. Any that pass raw `filters` JSON keep their old shape, so `pnpm sdk` will **fail** validation against the new schema. That failure is correct and expected — hand-edit those operations to the typed shape, along with any codegen'd hook or component built on them.
- The admin data browser needs no changes; the operators it emits are all covered.

{% callout type="warning" title="Security audit for existing deployments" %}
Any column present in the database was filterable through this blob in deployed clones built with `@nestledjs/generators` < 1.1.5, **including `@graphqlOmit` columns**. Presence of results acts as an oracle, so values could be recovered character by character.

Treat secrets held in those columns as potentially exposed anywhere the API was reachable, and rotate them — password-reset tokens and invite tokens in particular.
{% /callout %}

---

## 1.1.4 {% .no-toc %}

**Patch — `@crudAuth` resolution fixes.** One can silently weaken a model's guard; see the audit note.

### Fixed

**`crud` resolves `@crudAuth` from the DMMF model instead of scanning schema text.** The lookup searched for a line starting with `model <Name>` with no word boundary, so resolving `User` also matched `model UserSessionProgress`, `model UserAddress`, or any other model whose name merely starts with those characters. It took the first match, so a model that should have defaulted to `admin` could silently inherit a neighbour's `user` or `public` level.

Multi-file schema directories made this easy to hit, since the files are concatenated alphabetically and the hijacking model only has to sort earlier. Prisma already associates each `///` doc comment with its own model, so the annotation is now read from `model.documentation`.

**`crud` preserves custom `@crudAuth` level casing when building guard names.** The level was fully lowercased before building the guard symbol, so a custom level like `billingAdmin` produced `GqlAuthBillingadminGuard` — a symbol that does not exist — and consumers had to alias their real guard to the mangled name to make generated code compile. Only the first character is normalised now, so `billingAdmin` resolves to `GqlAuthBillingAdminGuard`.

### Upgrading

```shell
pnpm add -E @nestledjs/generators@1.1.4
nx g @nestledjs/generators:crud
```

{% callout type="warning" title="Audit models whose name prefixes another" %}
If any model's name is a prefix of another model's — `User` and `UserAddress`, `Post` and `PostRevision` — its generated resolvers may have been built with a weaker guard than intended.

Review the regenerated resolvers for those models and confirm the guard matches the `@crudAuth` level you declared.
{% /callout %}

---

## 1.1.3 {% .no-toc %}

**Patch — bug fixes.** One carries a security impact; see the audit note below.

### Fixed

**`models` generator now honors `@graphqlOmit` (security).** The `models` generator previously ignored the `@graphqlOmit` field annotation, even though the `sdk` and `crud` generators already respect it.

Why this matters: in code-first NestJS the `@ObjectType()` / `@Field()` emitted into `models.ts` **is** the server GraphQL schema. So a field marked `@graphqlOmit` still received a `@Field()`, landed in `api-schema.graphql`, and stayed queryable through the API. The annotation was only being enforced in generated client operations (a convenience) — never on the server (the security boundary).

As of 1.1.3 the generator drops any field whose documentation includes `@graphqlOmit` — both the decorator and the property — so `models.ts` is the single authoritative enforcement point. No post-generation "omit" scripting is needed.

```prisma
model OAuthAccount {
  id                   String @id
  /// @graphqlOmit
  encryptedAccessToken String   // no longer emitted to the GraphQL schema
}
```

**`models` generator imports `JsonValue` from your project's Prisma wrapper.** The generator hard-coded `import type { JsonValue } from '@prisma/client/runtime/client'`, reaching into Prisma runtime internals and bypassing your workspace's Prisma wrapper — the exact webpack module-resolution risk that wrapper exists to avoid.

It now imports `JsonValue` from your project's resolved wrapper alias (the same `tsconfig.base.json` path alias already used for generated enum imports), so the emitted import is correct for every workspace regardless of scope.

### Upgrading

```shell
# in your workspace
pnpm add -D @nestledjs/generators@1.1.3   # or npm/yarn equivalent
nx g @nestledjs/generators:models          # regenerate + commit models
```

The regenerated `models.ts` diff should show only:

- `@graphqlOmit` fields removed, and
- the `JsonValue` import repointed to your project's Prisma wrapper alias.

Regenerate and redeploy so the corrected schema reaches your running API.

{% callout type="warning" title="Security audit for existing deployments" %}
Any field marked `@graphqlOmit` has been server-queryable in deployed workspaces built with `@nestledjs/generators` < 1.1.3, despite the annotation. Before or immediately after upgrading:

1. List every `@graphqlOmit` field in your Prisma schema (commonly secrets such as `encryptedAccessToken`, `encryptedRefreshToken`).
2. Treat those values as potentially exposed anywhere the GraphQL API was reachable.
3. Rotate the affected secrets/credentials.
4. Regenerate models (above) and redeploy to close the exposure.
   {% /callout %}

---

## 1.1.2 {% .no-toc %}

**Patch — GraphQL scalar fix.**

### Fixed

Prisma `Json` fields are now emitted as `GraphQLJSON` (supports objects, arrays, and scalar JSON values) instead of `GraphQLJSONObject` (objects only). Fields holding JSON arrays or scalars no longer fail schema validation.

### Upgrading

```shell
pnpm add -E @nestledjs/generators@1.1.2
nx g @nestledjs/generators:models
git diff
```

Expect GraphQL model changes only in the regenerated `models.ts`.

---

## 1.1.0 {% .no-toc %}

**Baseline for the active generator line.**

The 1.1.x package exposes the five generators used in day-to-day development — `workspace-setup`, `crud`, `models`, `custom`, and `sdk`. See the [Generators reference](/docs/generators) for what each one does.

Model generation moved into `@nestledjs/generators:models`, replacing the older template-local model generation script. Keeping model generation in the generator package means fixes ship with the package instead of requiring template file changes.

The older split-package scaffolders (`@nestledjs/api:plugin`, `@nestledjs/api:integrations`, `@nestledjs/shared:sdk`) are legacy template-build commands. See [Generators (Legacy)](/docs/generators-legacy) if you are studying how the template was originally assembled.
