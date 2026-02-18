---
title: Commands
nextjs:
  metadata:
    title: Commands
    description: Reference for every npm script and Nx command available in the Nestled template.
---

A complete reference for every command available in your Nestled project.

---

## The most important command

### `pnpm db-update`

This is the command you'll run most often. After any change to your Prisma schema, run this to regenerate your entire stack:

```shell
pnpm db-update
```

Under the hood, it runs four steps in sequence:

1. **`nx g @nestledjs/api:generate-crud`** — Reads your Prisma schema and regenerates CRUD resolvers for every model, with auth guards applied based on `@crudAuth` comments
2. **`pnpm generate:models`** — Generates TypeScript models from the Prisma DMMF (Data Model Meta Format)
3. **`nx g @nestledjs/shared:sdk`** — Generates GraphQL fragments, queries, and mutations for every model, then runs codegen to produce typed TypeScript operations
4. **`nx g @nestledjs/api:custom`** — Creates custom module boilerplate for any new models (never overwrites existing custom code)

After running `db-update`, you'll typically also want to push your schema changes to the database:

```shell
pnpm prisma db push
```

{% callout title="This is the workflow" %}
Design your Prisma schema → `pnpm db-update` → `pnpm prisma db push` → your app is updated. That's it. The more thought you put into your schema, the less manual code you write.
{% /callout %}

---

## Development

| Command | Description |
|---|---|
| `nx serve api` | Start the API dev server on port 3000 |
| `nx serve web` | Start the web dev server on port 4200 |
| `pnpm sdk watch` | Watch GraphQL operations and auto-regenerate types |
| `pnpm dev:api` | Alias for `nx serve api` |
| `pnpm dev:web` | Alias for `nx serve web` |
| `pnpm typecheck` | Run React Router typegen + TypeScript type checking |
| `pnpm typecheck:watch` | Watch mode for React Router typegen |
| `pnpm storybook:web-ui` | Launch Storybook for the component library |

---

## Database

| Command | Description |
|---|---|
| `pnpm prisma db push` | Apply schema changes to the database (no migration files) |
| `pnpm prisma:apply` | Format schema + push (convenience combo) |
| `pnpm prisma:format` | Format the Prisma schema file |
| `pnpm prisma:generate` | Regenerate the Prisma client |
| `pnpm prisma:migrate` | Create and run database migrations |
| `pnpm prisma:seed` | Seed the database with initial data |
| `pnpm prisma:studio` | Open Prisma Studio — a visual database browser |
| `pnpm prisma:reset` | Reset the database and re-seed (destructive) |

{% callout type="warning" title="db push vs migrate" %}
During development, `pnpm prisma db push` is the fastest way to apply schema changes — it syncs your schema directly without creating migration files. For production deployments, use `pnpm prisma:migrate` to create versioned migration files that can be reviewed and applied consistently.
{% /callout %}

---

## Code generation

| Command | Description |
|---|---|
| `pnpm db-update` | Full pipeline: CRUD + models + SDK + custom modules |
| `pnpm generate:models` | Generate TypeScript models from Prisma schema |
| `pnpm sdk` | Run GraphQL codegen once |
| `pnpm sdk watch` | Run GraphQL codegen in watch mode |

---

## Building for production

| Command | Description |
|---|---|
| `pnpm build:api` | Build the API (generates Prisma client + webpack production build) |
| `pnpm build:web` | Build the web app (React Router production build) |
| `pnpm start:api` | Start the production API server (`node dist/apps/api/main.js`) |
| `pnpm start:web` | Start the production web server (`node apps/web/server.js`) |

---

## Docker

| Command | Description |
|---|---|
| `pnpm docker:up` | Start dev services (PostgreSQL, Redis, Mailhog) |
| `pnpm docker:down` | Stop dev services |
| `pnpm docker:logs` | View last 50 lines of service logs |
| `pnpm docker:build` | Build a production Docker image |
| `pnpm docker:run` | Run the production Docker image (maps port 8000 → 3000) |
| `pnpm docker:push` | Push the Docker image to a registry |

The Docker Compose file is at `.dev/docker-compose.yml`. It starts:

- **PostgreSQL 15** on port 5432 (user: `prisma`, password: `prisma`, database: `prisma`)
- **Redis** on port 6379
- **Mailhog** with SMTP on port 1025 and web UI on port 8025

---

## Testing

| Command | Description |
|---|---|
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run the full E2E test suite (manages test DB automatically) |
| `pnpm test:e2e:auth` | Run only auth-related E2E tests |
| `pnpm test:db:start` | Start the test database container (port 5433) |
| `pnpm test:db:stop` | Stop the test database container |
| `pnpm test:db:reset` | Reset the test database (destructive) |

The E2E test runner (`scripts/run-e2e-tests.sh`) automatically starts the test database, runs migrations, executes tests, and cleans up. The test database runs on port 5433 so it doesn't interfere with your development database.

---

## Nx workspace

| Command | Description |
|---|---|
| `npx nx graph` | Visualize the workspace dependency graph |
| `npx nx affected -t test` | Run tests only for projects affected by your changes |
| `npx nx affected -t lint` | Lint only affected projects |
| `npx nx affected -t build` | Build only affected projects |
| `pnpm lint` | Lint the workspace |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting without writing changes |

---

## Utility

| Command | Description |
|---|---|
| `pnpm clean` | Nuclear option — hard reset git, delete node_modules/dist/tmp, reinstall |
| `pnpm vite:clean` | Clear Vite cache and dist folder |
| `pnpm user:delete` | Delete a user by running `tsx scripts/delete-user.ts` |
