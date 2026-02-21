import { getDocPages } from '@/lib/docs'

export async function GET() {
  const pages = await getDocPages()

  const lines = [
    '# Nestled',
    '',
    '> Nestled is a production-ready SaaS starter template built as an Nx monorepo with NestJS GraphQL API, React frontend, Prisma ORM, and code generation. It provides auth, profiles, organizations/teams, RBAC, billing/subscriptions, admin area, and audit logging out of the box.',
    '',
    '## Docs',
    '',
    ...pages.map((page) => `- [${page.title}](${page.url})`),
    '',
    '## Optional',
    '',
    '- [llms-full.txt](https://nestledjs.com/llms-full.txt): Full documentation in a single file',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
