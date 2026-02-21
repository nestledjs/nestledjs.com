import fs from 'fs'
import path from 'path'
import glob from 'fast-glob'

const BASE_URL = 'https://nestledjs.com'

// Order pages should appear in the concatenated output
const PAGE_ORDER = [
  'page.md', // root = Getting Started
  'docs/installation/page.md',
  'docs/commands/page.md',
  'docs/architecture/page.md',
  'docs/generators/page.md',
  'docs/deployment/page.md',
  'docs/resources/page.md',
]

function stripFrontmatter(content: string): string {
  return content.replace(/^---[\s\S]*?---\n*/, '')
}

function stripMarkdocTags(content: string): string {
  // Remove block-level Markdoc tags like {% callout %}, {% quick-links %}, etc.
  // Keep the inner content of block tags where possible
  let result = content

  // Remove self-closing tags: {% tag ... /%}
  result = result.replace(/\{%\s*\w[\w-]*\s[^%]*\/%\}/g, '')

  // Remove opening tags: {% tag ... %}
  result = result.replace(/\{%\s*\/?\s*[\w-]+(?:\s[^%]*)?\s*%\}/g, '')

  // Remove inline attribute annotations like {% .lead %}
  result = result.replace(/\{%\s*\.[^%]*%\}/g, '')

  // Clean up excessive blank lines
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

function fileToUrl(file: string): string {
  if (file === 'page.md') return BASE_URL
  const dir = path.dirname(file)
  return `${BASE_URL}/${dir}`
}

function fileToTitle(file: string, content: string): string {
  // Extract title from frontmatter
  const match = content.match(/^---[\s\S]*?title:\s*(.+)/m)
  return match ? match[1].trim() : path.dirname(file)
}

export async function GET() {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const allFiles = await glob('**/page.md', { cwd: appDir })

  // Sort by defined order, then any remaining files alphabetically
  const orderedFiles = [
    ...PAGE_ORDER.filter((f) => allFiles.includes(f)),
    ...allFiles.filter((f) => !PAGE_ORDER.includes(f)).sort(),
  ]

  const sections: string[] = [
    '# Nestled — Full Documentation\n',
    '> Nestled is a production-ready SaaS starter template built as an Nx monorepo with NestJS GraphQL API, React frontend, Prisma ORM, and code generation. It provides auth, profiles, organizations/teams, RBAC, billing/subscriptions, admin area, and audit logging out of the box.\n',
  ]

  for (const file of orderedFiles) {
    const fullPath = path.join(appDir, file)
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const title = fileToTitle(file, raw)
    const url = fileToUrl(file)
    const cleaned = stripMarkdocTags(stripFrontmatter(raw))

    sections.push(`---\n\n## ${title}\n\nSource: ${url}\n\n${cleaned}`)
  }

  const body = sections.join('\n\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
