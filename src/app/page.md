---
title: Getting started
---

Clone a repo. Design your Prisma schema. Run one command. You have a production-ready full-stack app with authentication, organizations, teams, roles, permissions, billing, an admin dashboard, and a fully generated GraphQL API — instantly. {% .lead %}

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/installation" description="Step-by-step guide to cloning the template, configuring your environment, and starting development." /%}

{% quick-link title="Architecture" icon="presets" href="/docs/architecture" description="Understand how Nestled structures your app — monorepo layout, code generation, auth, and multi-tenancy." /%}

{% quick-link title="Generators" icon="plugins" href="/docs/generators" description="Reference for every Nestled generator and what it creates under the hood." /%}

{% quick-link title="Forms" icon="theming" href="https://nestledforms.com" description="Nestled's standalone forms library for building type-safe, validated forms with ease." /%}

{% /quick-links %}

Nestled is a template starter kit for building production-ready full-stack applications. It gives you a complete Nx monorepo with a NestJS GraphQL API, a React frontend with React Router 7, Prisma for your database, Stripe for billing, and a full authentication system — all wired together and ready to go. The more time you spend designing your Prisma schema, the less code you'll ever need to write.

---

## Quick start

Get a fully working application in five minutes.

### Clone the template and set up

```shell
git clone https://github.com/nestledjs/nestled_template.git my-app
cd my-app
cp .env.example .env
pnpm install
```

### Name your project and start infrastructure

```shell
nx g @nestledjs/generators:workspace-setup --name my-app
```

This single command renames the workspace throughout the project, spins up Docker (PostgreSQL, Redis, Mailhog), runs database migrations, and seeds your database. The `--name` becomes your workspace namespace — all your imports will use `@my-app/...`, so keep it short, lowercase, with dashes for spaces.

### Design your schema

Open `libs/api/prisma/src/lib/schemas/schema.prisma` and define your data models. The template comes with a comprehensive schema including users, organizations, teams, roles, permissions, and billing — but you can modify it to fit your needs.

### Generate everything

```shell
pnpm db-update
pnpm prisma db push
```

`pnpm db-update` is the single most important command in Nestled. It reads your Prisma schema and regenerates your entire API — CRUD resolvers, GraphQL types, TypeScript models, and a frontend SDK with typed queries and mutations. Every time you change your schema, run this command and everything updates automatically.

### Start development

Run these in separate terminals:

```shell
nx serve api       # API on http://localhost:3000
nx serve web       # Web app on http://localhost:4200
pnpm sdk watch     # Auto-regenerate types on changes
```

Visit `http://localhost:4200` and register your first account — the first user to register automatically becomes the super admin with full access to the admin dashboard and all management features.

{% callout title="What just happened?" %}
With one command, `pnpm db-update` ran four steps: generated CRUD resolvers for every model, built GraphQL types from your schema, created custom module boilerplate, and generated a typed SDK for your frontend. [Learn more about how this works →](/docs/architecture)
{% /callout %}

---

## What you get out of the box

Nestled is a proven foundation used in live production applications serving hundreds of thousands of users. Here's what's included and working from day one:

### Authentication

Complete auth system with registration, login, password reset, and email verification. JWT tokens with session tracking, cookie-based persistence, and admin emulation for debugging user issues. OAuth (Google, GitHub) and two-factor authentication infrastructure included.

### Organizations, teams, and members

Multi-tenant architecture where users belong to organizations through memberships. Organizations have teams, and a tenancy middleware automatically scopes all queries to the active organization. Invite system for adding members with role assignment.

### Role-based access control

Roles and permissions model with guard-based authorization. Generated CRUD endpoints use `@crudAuth` comments in your Prisma schema to declaratively set access levels — no manual guard wiring needed.

### Stripe billing

Full Stripe integration with subscription management, webhook handling, product and price syncing, and a checkout flow. Test mode works out of the box with Stripe CLI.

### Generated GraphQL API

Every model in your Prisma schema gets a complete CRUD API — queries for reading one, reading many with pagination, and counting records, plus mutations for creating, updating, and deleting. All with appropriate auth guards applied automatically.

### Admin dashboard

Built-in admin area for managing users, organizations, and data. Every model gets admin CRUD in the web frontend through the generated SDK.

### Code generation pipeline

The `pnpm db-update` command regenerates your entire stack from your Prisma schema — API resolvers, GraphQL types, TypeScript models, and a fully-typed frontend SDK. Change your schema, run one command, everything stays in sync.

### Production infrastructure

Docker configuration, GitHub Actions CI/CD, E2E testing with Vitest, email testing with Mailhog, multi-provider file storage (S3, Cloudinary, ImageKit, GCS), and deployment-ready Docker builds.

---

## Getting help

### Submit an issue

Found a bug or have a feature request? Visit our [GitHub repository](https://github.com/nestledjs/nestled) to report bugs, request features, or submit pull requests.

### Join the community

Connect with other Nestled developers through GitHub Discussions, browse real-world examples, and stay up to date with the latest releases.
