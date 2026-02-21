import { getDocPages } from '@/lib/docs'

function stripMarkdocTags(content: string): string {
  return content
    .replace(/\{%\s*\/[\w-]+\s*%\}/g, '') // closing tags {% /tag %}
    .replace(/\{%\s*[\w-]+\s*[^%]*?\/%\}/g, '') // self-closing {% tag /%}
    .replace(/\{%\s*[\w-]+[^%]*?%\}/g, '') // opening tags {% tag %}
    .replace(/\{\.\w+\}/g, '') // attribute annotations {.lead}
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim()
}

export async function GET() {
  const pages = await getDocPages()

  const sections = pages.map(
    (page) =>
      `# ${page.title}\n\nURL: ${page.url}\n\n${stripMarkdocTags(page.content)}`,
  )

  const output = [
    '# Nestled — Complete Documentation',
    '',
    '> Nestled is a production-ready SaaS starter template built as an Nx monorepo with NestJS GraphQL API, React frontend, Prisma ORM, and code generation. It provides auth, profiles, organizations/teams, RBAC, billing/subscriptions, admin area, and audit logging out of the box.',
    '',
    '---',
    '',
    sections.join('\n\n---\n\n'),
  ].join('\n')

  return new Response(output, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
