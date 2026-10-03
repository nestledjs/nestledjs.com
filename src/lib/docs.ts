import fs from 'fs'
import path from 'path'
import { glob } from 'fast-glob'

import { navigation } from './navigation'

const SITE_URL = 'https://nestledjs.com'
const APP_DIR = path.join(process.cwd(), 'src', 'app')

export interface DocPage {
  title: string
  href: string
  url: string
  content: string
}

function parseFrontmatter(raw: string): { title: string; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { title: '', content: raw }

  const titleMatch = match[1].match(/^title:\s*(.+)$/m)
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    content: match[2],
  }
}

export async function getDocPages(): Promise<DocPage[]> {
  const files = await glob('**/page.md', { cwd: APP_DIR })

  const pages = files.map((file) => {
    const raw = fs.readFileSync(path.join(APP_DIR, file), 'utf-8')
    const { title, content } = parseFrontmatter(raw)
    const dir = path.dirname(file)
    const href = dir === '.' ? '/' : `/${dir}`

    return { title, href, url: `${SITE_URL}${href}`, content }
  })

  // Use navigation.ts order; pages not in navigation sort to the end alphabetically
  const navOrder = navigation.flatMap((g) => g.links.map((l) => l.href))
  return pages.sort((a, b) => {
    const ai = navOrder.indexOf(a.href)
    const bi = navOrder.indexOf(b.href)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.href.localeCompare(b.href)
  })
}

export { SITE_URL }
