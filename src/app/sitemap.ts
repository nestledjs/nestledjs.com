import type { MetadataRoute } from 'next'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const mdFiles = await glob('**/page.md', { cwd: appDir })

  const pages: MetadataRoute.Sitemap = mdFiles.map((file) => {
    const dir = path.dirname(file)
    const slug = dir === '.' ? '' : `/${dir.replace(/\/page\.md$/, '')}`
    const url = `https://nestledjs.com${slug}`
    const fullPath = path.join(appDir, file)
    const stat = fs.statSync(fullPath)

    return {
      url,
      lastModified: stat.mtime,
      priority: slug === '' ? 1.0 : slug.split('/').length <= 2 ? 0.8 : 0.6,
    }
  })

  return pages.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
