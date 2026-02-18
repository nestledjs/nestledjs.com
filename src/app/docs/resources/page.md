---
title: Resources
nextjs:
  metadata:
    title: Resources
    description: Official documentation and learning resources for the technologies that power your Nestled application.
---

Official documentation for the technologies in your Nestled stack. If you're new to any of these, start with the ones marked as essential — they'll have the most impact on your day-to-day workflow.

---

## Schema and database

### Prisma {% .lead %}

Your Prisma schema is the single source of truth for your entire application. Everything Nestled generates — the API, the types, the SDK — comes from this file. Time spent learning Prisma's data modeling pays off more than anything else.

- [Prisma schema reference](https://www.prisma.io/docs/orm/prisma-schema/overview) — Models, fields, relations, attributes, and comments
- [Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) — One-to-one, one-to-many, many-to-many, and self-relations
- [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) — Querying your database in custom services
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate) — Production-safe database migrations

{% callout title="Start here" %}
If you only read one external doc, make it the Prisma schema reference. Your schema drives everything in Nestled — the better you understand Prisma's data modeling, the less code you'll write.
{% /callout %}

### PostgreSQL

Nestled uses PostgreSQL as its database. You rarely interact with it directly (Prisma handles that), but understanding its capabilities helps you design better schemas.

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/) — Official reference
- [PostgreSQL tutorial](https://www.postgresqltutorial.com/) — Beginner-friendly guide

---

## API

### NestJS

The API is built on NestJS — a TypeScript framework for building server-side applications with modules, dependency injection, and decorators. Your custom resolvers, services, and middleware all use NestJS patterns.

- [NestJS documentation](https://docs.nestjs.com/) — Modules, providers, guards, interceptors, and middleware
- [GraphQL with NestJS](https://docs.nestjs.com/graphql/quick-start) — How NestJS integrates with Apollo Server
- [Guards](https://docs.nestjs.com/guards) — How auth guards work (used throughout Nestled's CRUD and custom resolvers)

### GraphQL

Nestled generates a GraphQL API, and your custom resolvers extend it. Understanding GraphQL helps you write efficient queries and design your custom API surface.

- [GraphQL documentation](https://graphql.org/learn/) — Core concepts: queries, mutations, subscriptions, and schema design
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) — The GraphQL server Nestled uses under the hood

---

## Frontend

### React Router 7

The web application uses React Router 7 in framework mode — with server-side rendering, file-based routing, loaders, and actions. Routes and layouts all follow React Router conventions.

- [Framework mode](https://reactrouter.com/explanation/frameworks) — How Nestled uses React Router as a full-stack framework
- [React Router documentation](https://reactrouter.com/) — Routing, loaders, actions, and SSR
- [File-based routing](https://reactrouter.com/how-to/file-route-conventions) — How file names map to routes

### Apollo Client

Server state (GraphQL data) is managed with Apollo Client. The generated SDK gives you typed queries and mutations — Apollo Client handles caching, loading states, and refetching.

- [Apollo Client documentation](https://www.apollographql.com/docs/react/) — Queries, mutations, caching, and subscriptions
- [useQuery](https://www.apollographql.com/docs/react/data/queries) — Fetching data in React components
- [useMutation](https://www.apollographql.com/docs/react/data/mutations) — Writing data from React components

### Tailwind CSS

All styling uses Tailwind CSS 4 with utility classes. The shared styles library provides the base configuration.

- [Tailwind CSS documentation](https://tailwindcss.com/docs) — Utility classes, responsive design, and customization

---

## Infrastructure

### Nx

The monorepo is managed by Nx, which handles project structure, task running, caching, and dependency graphs. You use Nx commands to serve, build, and test your applications.

- [Nx documentation](https://nx.dev/getting-started/intro) — Workspace structure, task running, and caching
- [Nx CLI reference](https://nx.dev/nx-api/nx) — All available commands

### Docker

Development services (PostgreSQL, Redis, Mailhog) run in Docker containers. Production builds use a multi-stage Dockerfile.

- [Docker documentation](https://docs.docker.com/) — Containers, Compose, and Dockerfiles
- [Docker Compose](https://docs.docker.com/compose/) — Multi-container applications

---

## Integrations

### Stripe

Subscription billing uses Stripe. The template includes checkout, webhooks, and subscription management — but you'll need to understand Stripe's concepts to customize your billing flow.

- [Stripe documentation](https://docs.stripe.com/) — Products, prices, subscriptions, and webhooks
- [Stripe CLI](https://docs.stripe.com/stripe-cli) — Local webhook testing with `stripe listen`
- [Stripe Testing](https://docs.stripe.com/testing) — Test card numbers and sandbox environment

### Passport

Authentication uses Passport with JWT strategy. The template handles this for you, but understanding Passport helps if you need to add custom auth strategies (like additional OAuth providers).

- [Passport documentation](https://www.passportjs.org/) — Authentication strategies
- [Passport JWT](https://www.passportjs.org/packages/passport-jwt/) — JWT token strategy used by Nestled
