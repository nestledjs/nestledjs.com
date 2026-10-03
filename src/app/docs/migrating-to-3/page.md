---
title: Migrating to 3.0
nextjs:
  metadata:
    title: Migrating to generators 3.0
    description: Step-by-step upgrade to @nestledjs/generators 3.0.3, including admin-only generated CRUD, removal of @crudAuth, and application-owned public SDK documents.
---

`@nestledjs/generators` 3.0.0 makes generated CRUD an admin-only management surface. Every generated resolver now carries `@AdminOnly()` and `@UseGuards(GqlAuthAdminGuard)` at class level, and `@crudAuth` no longer exists.

This is a security-driven breaking change. The old annotation let broad, schema-derived CRUD operations become user-facing by changing a guard. Generator 3 requires lower-privilege workflows to be modeled as explicit application resolvers with their own inputs, authorization, tenant scope, and database query.

This page is the ordered migration checklist. For the release notes, see the [3.0.0 changelog](/docs/generators-changelog#3-0-0).

Use 3.0.3 or newer when following it. The patch releases restore bounded filter composition, add strict TypeScript compatibility, and complete the SDK ownership boundary introduced by the major release.

{% callout type="warning" title="Generator 3 fails closed" %}
The `crud`, `sdk`, `models`, and `model-extension` generators stop before writing output if any Prisma model still contains `@crudAuth`. The error lists the affected models. The annotation is not silently ignored.
{% /callout %}

---

## Why the boundary changed

Generated CRUD is deliberately broad because it powers the admin data browser:

- create and update inputs are derived from the database model;
- list operations expose generated administrative filters;
- requested GraphQL relations are recursively compiled into Prisma `select` trees; and
- every model receives the same six read, count, create, update, and delete operations.

That is appropriate behind a super-admin boundary. It is not enough for an end-user workflow, where access usually depends on the authenticated user, active organization, record ownership, lifecycle state, allowed fields, and business rules.

In 2.x, `@crudAuth` could lower individual generated operations to `user`, `public`, or a custom guard. That made authentication configurable, but it did not make the generated input or query specific to the workflow. In 3.0.0 the generated surface cannot be lowered at all.

{% callout title="The migration is intentionally access-restricting" %}
If you upgrade without replacing a formerly lower-privilege operation, it becomes admin-only. That breaks the affected workflow, but it does not make the operation public. Build and test the replacement before switching clients.
{% /callout %}

---

## Step 1: Inventory the old policy

Find every annotation before editing the schema:

```shell
rg -n '@crudAuth' --glob '*.prisma'
```

For each model, record the operations that were not `admin`:

| Annotation key | Generated root operation              |
| -------------- | ------------------------------------- |
| `readOne`      | singular query, such as `post`        |
| `readMany`     | plural query, such as `posts`         |
| `count`        | count query, such as `postsCount`     |
| `create`       | create mutation, such as `createPost` |
| `update`       | update mutation, such as `updatePost` |
| `delete`       | delete mutation, such as `deletePost` |

Also search your user-facing SDK operations and application code for those root field names. The goal is a small migration table connecting each old permission to its callers, replacement operation, required scope, and tests.

An all-admin annotation needs no replacement; remove it in step 3 because admin is now unconditional. A partial annotation still matters: any omitted key defaulted to admin, while the explicitly lowered keys need replacements.

---

## Step 2: Build explicit application resolvers

For each lower-privilege workflow, add a custom resolver rather than re-exposing generated CRUD. Scaffold a model-specific module when useful:

```shell
nx g @nestledjs/generators:model-extension Post --name PostPublishing
```

Do this while still on generators 2.x if the schema contains `@crudAuth`; the 3.0.0 `model-extension` generator rejects the annotation along with the other schema-reading generators.

Each replacement should:

1. Use a new, descriptive GraphQL operation name that does not collide with generated admin roots — for example, `publishedPosts`, `myOrganizations`, or `updateMyProfile`.
2. Define a purpose-built input containing only fields the workflow is allowed to accept. Do not import generated CRUD create/update/filter inputs.
3. Declare the intended access level and guard explicitly.
4. Derive user, organization, or tenant scope from authenticated server context — never from a client-supplied owner ID alone.
5. Build an explicit Prisma `where` clause that combines the requested record with that scope.
6. Use an explicit `select` appropriate to the operation. Do not call the generated recursive selection compiler.
7. Apply the business rules the generic administrative operation could not express.

{% callout type="warning" title="Do not compose user-facing code from admin CRUD" %}
Keep `ApiCrudDataAccessService`, generated CRUD DTOs and filters, and recursive GraphQL-to-Prisma selection compilation out of user-facing resolver libraries. If you intentionally compose generated CRUD for an internal tool, put that code in a separate admin-only library and keep the same `AdminOnly`/admin-guard boundary.
{% /callout %}

Update the user-facing GraphQL documents under `libs/shared/sdk/src/graphql/` to call these new operations. Those documents are preserved by generation, so changing the server schema does not rewrite them for you.

---

## Step 3: Remove the legacy annotation

Only after the replacements exist, delete every `@crudAuth` declaration from the Prisma schema. Confirm that none remain:

```shell
rg -n '@crudAuth' --glob '*.prisma'
```

No output is the expected result. Do not replace the annotation with a new generator setting; version 3 intentionally has no authorization override for generated CRUD.

---

## Step 4: Retire the old selection-policy plumbing

Generated CRUD no longer imports `createSelect` from your core-helper barrel. Its administrative selection compiler is generated as a private helper inside `ApiCrudDataAccessService`, and generated `database-models.ts` files no longer carry per-model `auth` metadata.

Search the consumer workspace for the old machinery:

```shell
rg -n 'createSelect|viewerContext|viewer\.context|DATABASE_MODELS.*auth' apps libs
```

Remove the exported `createSelect` and viewer-context relation-authorization code that existed only for generated CRUD, including its barrel export and unused dependencies. Review any remaining application use instead of deleting it mechanically. User-facing resolvers should end with explicit, scoped Prisma queries; intentional administrative composition belongs behind the admin boundary.

---

## Step 5: Upgrade and regenerate

Upgrade the package only after the schema is clean:

```shell
pnpm add -E @nestledjs/generators@3.0.3
pnpm db-update
```

The full pipeline is important. It regenerates CRUD resolvers and data access, GraphQL models, database model metadata, admin SDK operations, and typed SDK output together.

If generation reports `Remove @crudAuth from: ...`, return to steps 1–3. Do not bypass the check: it exists to prevent a stale annotation from looking like an active policy.

If application code imported the removed programmatic helpers — `parseCrudAuth`, `getCrudAuthForModel`, `getGuardForAuthLevel`, or `getAccessLevelDecoratorForAuthLevel` — replace that design rather than copying those helpers locally.

### Audit the application SDK tree {% .no-toc %}

3.0.3 stops scaffolding public copies of the generated admin CRUD operations. It recreates only the per-model operations under `libs/shared/sdk/src/__admin/`; feature and per-model documents under `libs/shared/sdk/src/graphql/` are application-owned and preserved. The shared `graphql/core/core.graphql` document remains generator-maintained.

Because preservation is intentional, the upgrade does not delete legacy per-model documents created by earlier generators. Review that tree and remove files that merely call the generated roots `<model>`, `<models>`, `<models>Count`, `create<Model>`, `update<Model>`, or `delete<Model>`. Keep the purpose-built documents that call your explicit application resolvers.

Do not leave empty `.graphql` placeholders. The generated core document already establishes the public source tree and provides shared paging fields. Organize real documents by feature or model, then run:

```shell
pnpm sdk
```

If your application builds filter variables at runtime, also audit uses of `AND`, `OR`, `NOT`, scalar `not`, and relation `is`/`isNot`. Those fields are supported in 3.0.1 and later, but were absent from the typed GraphQL inputs in generators 1.1.5 through 3.0.0.

---

## Step 6: Verify the boundary and the replacements

Before deploying, check both sides of the change.

**Generated admin CRUD:**

- Every generated resolver class under `libs/api/generated-crud/feature/` declares `@AdminOnly()` and `@UseGuards(GqlAuthAdminGuard)`.
- No generated resolver contains `@Public()`, `@Authenticated()`, or a custom guard.
- The regenerated GraphQL schema still contains one copy of each expected admin root field.
- The admin data browser can still read, filter, create, update, and delete as a super admin.
- Anonymous and ordinary authenticated users are denied those generated roots.

**Replacement application operations:**

- The intended user can complete each migrated workflow.
- Anonymous, wrong-role, and cross-tenant requests are denied.
- Supplying another user's or organization's ID cannot escape server-derived scope.
- Extra or sensitive input fields are rejected.
- List filters and relation traversal are limited to what the workflow explicitly supports.
- No application-owned SDK document calls a generated admin CRUD root.
- Updated SDK documents pass `pnpm sdk`, type-checking, and the relevant API tests.

Deploy the new server operations and their client callers together, or stage the new operation names first and switch clients before removing any temporary compatibility path.

---

## Coming from 1.x

Take the earlier major migration into account as well: 2.0.0 changed resolver registration and removed generated custom shells. Follow [Migrating to 2.0](/docs/migrating-to-2) before applying this guide.

If you are coming from before 1.1.6, also review the historical 1.1.6 template-ordering requirement. Releases 1.1.5 and 1.1.3 fixed separate data-exposure bugs that require an audit and possible secret rotation; upgrading straight to 3.0.3 does not perform that incident response for you. See the [generators changelog](/docs/generators-changelog).
