---
title: Installation
nextjs:
  metadata:
    title: Installation
    description: Clone the Nestled template, configure your environment, and start building your full-stack application.
---

This guide walks you through every step from a blank machine to a running Nestled application.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 20+** — Download from [nodejs.org](https://nodejs.org/). The template uses Node 22.
- **pnpm** — Install with `npm install -g pnpm`
- **Git** — For cloning the template
- **Docker** — Required for PostgreSQL, Redis, and Mailhog. [Get Docker](https://docs.docker.com/engine/install/).

{% callout title="Why pnpm?" %}
Nestled uses pnpm for package management. Its efficient disk usage and strict dependency resolution make it ideal for monorepos with many packages.
{% /callout %}

---

## Clone the template

```shell
git clone https://github.com/nestledjs/nestled_template.git my-app
cd my-app
```

Remove the existing git history and start fresh:

```shell
rm -rf .git
git init
```

---

## Configure your environment

Copy the example environment file:

```shell
cp .env.example .env
```

For local development, the defaults work out of the box — you just need to install dependencies first:

```shell
pnpm install
```

{% callout title="Build approvals" %}
You may need to run `pnpm approve --builds` to approve libraries that require native compilation (Prisma, SWC, etc.).
{% /callout %}

---

## Set up your workspace

Run the workspace setup generator to name your project and initialize everything:

```shell
nx g @nestledjs/generators:workspace-setup --name my-app
```

This does several things:

1. **Renames the workspace** — finds and replaces `nestled-template` throughout the project with your chosen name. All your imports will use `@my-app/...` going forward.
2. **Starts Docker services** — spins up PostgreSQL, Redis, and Mailhog
3. **Runs database migrations** — pushes the Prisma schema to your database
4. **Seeds the database** — creates an admin user and initial data

{% callout title="Choosing a name" %}
Use lowercase with dashes for spaces (e.g., `my-app`, `acme-saas`, `todo-pro`). Keep it short — this becomes the `@name/` prefix for every import in your project, so shorter means less typing during development.
{% /callout %}

---

## Environment variables

The key variables you may want to customize in `.env`:

### Core settings

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `your-app-name` | Application name, used in emails and 2FA |
| `PORT` | `3000` | API server port |
| `JWT_SECRET` | `JWT_SECRET` | **Change this** — secret for signing auth tokens |
| `API_URL` | `http://localhost:3000` | API base URL |
| `SITE_URL` | `http://localhost:4200` | Frontend base URL |

### Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://prisma:prisma@localhost:5432/prisma` | PostgreSQL connection string |

### Email

| Variable | Default | Description |
|---|---|---|
| `EMAIL_PROVIDER` | Not set (uses SMTP) | Set to `mock` to skip real emails in CI/testing |
| `SMTP_HOST` | `localhost` | SMTP server host (Mailhog in local dev) |
| `SMTP_PORT` | `1025` | SMTP server port |

### Stripe billing (optional)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Your Stripe secret key (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |
| `STRIPE_CURRENCY` | Currency code (default: `usd`) |

### OAuth providers (optional)

| Variable | Description |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth client secret |

### File storage (optional)

| Variable | Description |
|---|---|
| `STORAGE_PROVIDER` | `local`, `s3`, `cloudinary`, `imagekit`, or `gcs` |

Each provider has its own set of keys (AWS keys for S3, Cloudinary API key/secret, etc.). See `.env.example` for the full list.

---

## Start development

Run these three commands in separate terminals:

```shell
# Terminal 1 — API server
nx serve api

# Terminal 2 — Web application
nx serve web

# Terminal 3 — SDK type generation (watches for changes)
pnpm sdk watch
```

### Verify everything works

- **Web app**: [http://localhost:4200](http://localhost:4200) — you should see the login page
- **GraphQL playground**: [http://localhost:3000/graphql](http://localhost:3000/graphql)
- **Mailhog**: [http://localhost:8025](http://localhost:8025) — emails sent during registration/password reset appear here
- **Prisma Studio**: Run `pnpm prisma:studio` to browse your database visually

---

## Your first schema change

The real power of Nestled is the code generation pipeline. Try adding a model to your schema:

1. Edit `libs/api/prisma/src/lib/schemas/schema.prisma`
2. Run `pnpm db-update` — regenerates your entire API, types, and SDK
3. Run `pnpm prisma db push` — applies schema changes to the database
4. Your API now has full CRUD for the new model, and your frontend has typed queries ready to use

See the [Commands reference](/docs/commands) for details on every available script, or read about the [Architecture](/docs/architecture) to understand how all the pieces fit together.
