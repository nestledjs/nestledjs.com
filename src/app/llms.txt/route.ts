export async function GET() {
  const content = `# Nestled

> Nestled is a production-ready SaaS starter template built as an Nx monorepo with NestJS GraphQL API, React frontend, Prisma ORM, and code generation. It provides auth, profiles, organizations/teams, RBAC, billing/subscriptions, admin area, and audit logging out of the box.

## Docs

- [Getting Started](https://nestledjs.com)
- [Installation](https://nestledjs.com/docs/installation)
- [Commands](https://nestledjs.com/docs/commands)
- [Architecture](https://nestledjs.com/docs/architecture)
- [Generators](https://nestledjs.com/docs/generators)
- [Deployment](https://nestledjs.com/docs/deployment)
- [Resources](https://nestledjs.com/docs/resources)

## Optional

- [llms-full.txt](https://nestledjs.com/llms-full.txt): Full documentation in a single file
`

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
