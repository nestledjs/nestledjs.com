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
