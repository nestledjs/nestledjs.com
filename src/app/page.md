---
title: Getting started
---

Learn how to get Nestled set up in your project and generate a full-stack application in under thirty minutes. {% .lead %}

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/installation" description="Step-by-step guides to setting up Nestled and installing the generators." /%}

{% quick-link title="Architecture guide" icon="presets" href="/docs/architecture-guide" description="Learn how Nestled generates scalable applications and how the internals work." /%}

{% quick-link title="Generators" icon="plugins" href="/docs/writing-plugins" description="Explore the available generators and learn to write your own." /%}

{% quick-link title="Forms" icon="theming" href="/" description="Nestled's standalone forms library for building type-safe, validated forms with ease." /%}

{% /quick-links %}

Nestled is a powerful collection of Nx generators that helps you build scalable, production-ready full-stack applications from a single schema. Built on top of the Nx monorepo toolkit, Nestled generates everything you need for modern web development including APIs, web apps, mobile apps, and shared libraries.

---

## Quick start

Get up and running with Nestled in just a few steps:

### Create an Nx workspace

```shell
npx create-nx-workspace@latest my-app --preset=none --cli=nx --packageManager=pnpm
cd my-app
```

### Install Nestled packages

Choose what you need for your project:

```shell
# For full-stack code generation
npm install @nestledjs/generators

# For form handling (ready to use)
npm install @nestledjs/forms

# For utility functions
npm install @nestledjs/helpers
```

{% callout title="Ready to build?" %}
[Create your first project →](/docs/installation) with step-by-step instructions for generating a complete full-stack application.
{% /callout %}

---

## Key features

Nestled provides everything you need to build modern, scalable applications with best practices built-in.

### Code generation

Generate complete applications, libraries, and components with a single command. All generated code follows industry best practices and includes:

- TypeScript throughout
- Comprehensive testing setup
- Linting and formatting rules
- Docker configurations
- CI/CD workflows

### Monorepo architecture

Built on Nx, Nestled gives you powerful monorepo capabilities:

- Incremental builds and testing
- Smart dependency tracking
- Code sharing between projects
- Workspace-wide refactoring
- Distributed task execution

### Full-stack integration

Seamless integration between frontend and backend:

- Automatic type generation
- Shared validation schemas
- End-to-end type safety
- Consistent authentication
- Real-time updates

## Getting help

Need assistance or want to contribute? Here's how to connect with the Nestled community.

### Submit an issue

Found a bug or have a feature request? Visit our [GitHub repository](https://github.com/nestledjs/nestled) to:

- Report bugs with detailed reproduction steps
- Request new features or generators
- Submit pull requests with improvements
- Browse existing issues and discussions

### Join the community

Connect with other Nestled developers and get help:

- **GitHub Discussions**: Ask questions and share experiences
- **Documentation**: Comprehensive guides and API reference
- **Examples**: Real-world applications built with Nestled
- **Blog**: Latest updates and best practices

The Nestled project is open source and welcomes contributions from developers of all skill levels.
