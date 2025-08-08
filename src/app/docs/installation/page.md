---
title: Create a project
nextjs:
  metadata:
    title: Create a project
    description: Learn how to create a complete full-stack application with Nestled generators.
---

Create a complete full-stack application with Nestled in minutes. This guide walks you through setting up a new workspace and generating all the necessary components for a modern web application.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **pnpm**: Install with `npm install -g pnpm`
- **Git**: For version control

{% callout title="Why pnpm?" %}
Nestled works best with pnpm for package management in monorepos due to its efficient disk space usage and fast installation times.
{% /callout %}

---

## Create a new workspace

Start by creating a new Nx workspace that will house your full-stack application:

```shell
npx create-nx-workspace@latest my-app --preset=none --cli=nx --packageManager=pnpm
cd my-app
```

Next, install the Nestled generators:

```shell
npm install @nestledjs/generators
```

---

## Generate your API

Create a complete NestJS API with database integration, authentication, and more by running these generators in order:

```shell
# Set up configuration
nx g @nestledjs/config:setup
nx g @nestledjs/config:init

# Generate API
nx g @nestledjs/api:setup
nx g @nestledjs/api:app
nx g @nestledjs/api:prisma
nx g @nestledjs/api:config
nx g @nestledjs/api:core
nx g @nestledjs/api:custom
nx g @nestledjs/api:smtp-mailer
nx g @nestledjs/api:generate-crud
nx g @nestledjs/api:utils
nx g @nestledjs/api:workspace-setup
```

This generates a fully-featured API with:
- Configuration management
- NestJS application structure
- Prisma database integration
- Authentication and authorization
- CRUD operations
- Email services
- Custom utilities

---

## Generate your web application

Once you have your API, generate a modern web frontend that automatically connects to your backend:

```shell
# Generate web frontend and shared libraries
nx g @nestledjs/web:setup
nx g @nestledjs/web:app
nx g @nestledjs/shared:sdk
nx g @nestledjs/shared:styles
nx g @nestledjs/shared:apollo
nx g @nestledjs/plugins:auth
```

This creates a complete frontend application with:
- Server-side rendered React Router 7 application
- TypeScript configuration
- Tailwind CSS for styling
- Apollo Client for GraphQL
- Automatic type generation from your API
- Authentication components
- Shared libraries and utilities

---

## Start development

Start your full development environment with these three commands:

```shell
# Start the API server
npm run dev:api

# Start the web application
npm run dev:web

# Watch SDK for real-time type generation
npm run sdk:watch
```

Your API will be running on `http://localhost:3333` and your web app on `http://localhost:4200`, with hot reloading enabled for both. The SDK watcher will automatically generate types as you make changes to your API.

{% callout title="Pro tip!" %}
Use `npx nx graph` to visualize your generated workspace structure and see how all the pieces fit together.
{% /callout %}

---

## Next steps

Now that you have a complete full-stack application, you can:

- **Customize your schema**: Modify the Prisma schema to fit your data model
- **Add more pages**: Generate additional routes and components
- **Configure authentication**: Set up your preferred auth provider
- **Deploy**: Use the generated Docker files and CI/CD workflows

Check out our other guides to learn more about working with your generated application.
