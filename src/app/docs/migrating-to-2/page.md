---
title: Migrating to 2.0
nextjs:
  metadata:
    title: Migrating to generators 2.0
    description: Step-by-step upgrade from @nestledjs/generators 1.1.x to 2.0.0, covering the change in how generated CRUD resolvers are registered.
---

`@nestledjs/generators` 2.0.0 changes how generated CRUD resolvers reach your GraphQL schema. It was the first breaking release in the active generator line, and it is not a drop-in bump — the template wiring and your custom resolvers have to move together.

This page is the ordered checklist. For the release notes themselves, see the [changelog](/docs/generators-changelog#2-0-0).

---

## What changed

Through 1.1.x, generated resolvers were **not** registered directly. The `custom` generator emitted a resolver shell for every Prisma model, each one extending its generated counterpart:

```ts
// libs/api/custom/src/lib/default/post/post.resolver.ts — the 1.1.x shape
@Resolver(() => Post)
export class PostResolver extends GeneratedPostResolver {
  constructor(protected readonly data: ApiCrudDataAccessService) {
    super(data)
  }
}
```

Registering _that_ class is what put the generated queries and mutations into the schema. Inheritance was load-bearing wiring, which meant every model needed a shell whether or not you had anything custom to put in it.

In 2.0.0, the generated feature library exports one module, `ApiGeneratedCrudFeatureModule`, and the `crud` generator imports it into `coreModules` in `apps/api/src/app.module.ts`. That import is now the registration. Custom resolvers no longer need to inherit from anything, and the per-model shells are no longer generated.

{% callout type="warning" title="Do not do these steps out of order" %}
NestJS scans **inherited** resolver methods. If you import `ApiGeneratedCrudFeatureModule` while your inheriting custom resolvers are still registered, every generated GraphQL field is registered twice — once from the module, once through inheritance.

That is why step 1 and step 2 belong in a single change. Do not deploy an intermediate state where both are live.
{% /callout %}

---

## Step 1: Upgrade the template wiring

Apply the template upgrade note that puts `ApiGeneratedCrudFeatureModule` into `coreModules` in `apps/api/src/app.module.ts`.

```ts
import { ApiGeneratedCrudFeatureModule } from '@your-scope/api/generated-crud/feature'

const coreModules = [
  // ...
  ApiGeneratedCrudFeatureModule,
]
```

If you are running the automatic updater, this arrives as an upgrade note — see [Automatic Updates](/docs/updates). Applying it by hand is fine too.

## Step 2: De-inherit your custom resolvers

In the same change, strip the inheritance from every custom resolver under `libs/api/custom/src/lib/default/`. For each one remove:

- `extends Generated<Model>Resolver`
- the import of the generated resolver
- the generated data-access constructor injection that existed only to feed `super(...)`
- the `super(...)` call

A resolver that had no custom behavior becomes empty; one that did keeps only its own methods:

```ts
// after — no inheritance, only what you actually wrote
@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly posts: PostService) {}

  @Query(() => [Post])
  featuredPosts() {
    return this.posts.featured()
  }
}
```

## Step 3: Delete the empty shells

Any default-model module that contained nothing but the inherited wiring is now dead weight — delete the folder under `libs/api/custom/src/lib/default/` and its export from that directory's `index.ts`.

**Keep every module that holds real custom behavior.** The `custom` generator no longer creates or touches these, so nothing will regenerate a module you delete by mistake.

A quick way to find the candidates: a shell is deletable if, after step 2, its resolver class body is empty and its service (if any) is unused.

## Step 4: Regenerate and verify

```shell
pnpm db-update
```

Then check the result before deploying:

- **Root fields** — your GraphQL schema should have exactly one of each generated query and mutation. Duplicates mean an inheriting resolver is still registered; go back to step 2.
- **Authorization guards** — if you are stopping on 2.0.0, confirm each operation still carries the access level resolved from `@crudAuth`. Generators 3.0.0 supersedes this behavior by making every generated operation admin-only; continue with [Migrating to 3.0](/docs/migrating-to-3).

---

## Adding custom behavior after the upgrade

Now that shells are not generated for you, scaffold a module for a specific model on demand:

```shell
nx g @nestledjs/generators:model-extension Post
```

See the [`model-extension` reference](/docs/generators#nestledjs-generators-model-extension) for options, including `--name` for giving one model more than one extension module.

---

## Coming from older than 1.1.6

If you are jumping several versions, take them in order — two intermediate releases have their own requirements that upgrading past them does not resolve:

- **1.1.6** has a hard ordering dependency of its own: the template's access-level decorators and `GlobalAuthGuard` must land **before** you regenerate, or generated code will not compile. See the [1.1.6 entry](/docs/generators-changelog#1-1-6).
- **1.1.5** and **1.1.3** are security fixes requiring an audit and secret rotation, not just a regenerate. See [1.1.5](/docs/generators-changelog#1-1-5) and [1.1.3](/docs/generators-changelog#1-1-3).
