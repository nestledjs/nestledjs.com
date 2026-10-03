import type { MetadataRoute } from 'next'

import { getDocPages } from '@/lib/docs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getDocPages()

  return pages.map((page) => ({
    url: page.url,
    lastModified: new Date(),
    priority:
      page.href === '/' ? 1.0 : page.href.split('/').length <= 3 ? 0.8 : 0.6,
  }))
}
