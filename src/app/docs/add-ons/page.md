---
title: Add-On Ideas
nextjs:
  metadata:
    title: Add-On Ideas
    description: AI-ready feature specifications for extending Nestled beyond the core template. Each add-on includes a detailed prompt you can paste into an AI coding assistant to get a working implementation.
---

Add-on ideas are feature specifications for capabilities that go beyond the core Nestled template. Rather than shipping every possible feature, we've documented advanced capabilities as self-contained specs that teams can implement when their specific needs require them.

---

## Why add-ons instead of built-in features

The Nestled template is designed to be a solid, focused foundation. Every feature in the base template is something most projects will use. Add-ons cover the 20--30% use cases -- features that are great for some projects but not universal enough to include by default.

Each add-on has been designed, researched, or battle-tested in production projects. They're not hypothetical -- they're proven patterns extracted into reusable specs.

---

## What's in each add-on

Every add-on specification includes:

- **Problem statement** -- what need does this address and who benefits
- **Architecture overview** -- how the feature fits into the existing Nestled system
- **Implementation specification** -- detailed enough for a developer or AI assistant to build it, including database schema, backend services, resolvers, GraphQL operations, and frontend pages
- **Implementation checklist** -- step-by-step tasks to track your progress
- **Considerations** -- trade-offs, alternatives, and things to watch out for

---

## How to use these specs

The key idea: each spec is a detailed AI prompt. Here's the workflow:

1. **Read the add-on page** to understand what the feature does and whether you need it
2. **Copy the full specification** from the expandable section on the add-on page
3. **Paste it into your AI coding assistant** (Claude Code, Cursor, Copilot, etc.) and let it implement the feature in your Nestled project
4. **Review and adapt** -- the generated code will follow Nestled conventions, but you may want to customize it for your specific needs

{% callout type="note" %}
These specs are written to give an AI assistant all the context it needs: existing architecture, database models, service patterns, and frontend conventions. You should get a working implementation that fits naturally into your codebase with minimal manual adjustment.
{% /callout %}

---

## Available add-ons

{% quick-links %}

{% quick-link title="Granular RBAC Management" icon="presets" href="/docs/granular-rbac" description="Custom role creation, permission assignment UI, super admin dashboard, and user permission auditing." /%}

{% /quick-links %}

---

## Contributing

If you've built something interesting on top of the Nestled template in a production project, consider documenting it as an add-on. Good candidates are:

- Features that some projects need but aren't universal
- Patterns that took significant design work to get right
- Integrations with popular services that others would benefit from
