#!/usr/bin/env node

/**
 * Checks that all internal links in Markdoc .md files resolve to actual pages.
 * Scans for:
 *   - href="/some/path" (Markdoc tag attributes)
 *   - [text](/some/path) (standard markdown links)
 * Ignores external URLs and anchor-only links.
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const APP_DIR = new URL('../src/app', import.meta.url).pathname

// Build set of valid routes from src/app/**/page.md
function discoverRoutes(dir, routes = new Set()) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      discoverRoutes(full, routes)
    } else if (entry === 'page.md' || entry === 'page.tsx') {
      const rel = relative(APP_DIR, dir)
      const route = rel === '' ? '/' : `/${rel}`
      routes.add(route)
    }
  }
  return routes
}

// Extract internal links from a file's contents
function extractLinks(content) {
  const links = []
  // href="/path"
  for (const m of content.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)) {
    links.push(m[1])
  }
  // [text](/path) or [text](/path#anchor)
  for (const m of content.matchAll(/\]\((\/[^)#\s]*)(?:#[^)]*)?\)/g)) {
    links.push(m[1])
  }
  return links
}

// Collect all .md files
function collectMdFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      collectMdFiles(full, files)
    } else if (entry.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

const routes = discoverRoutes(APP_DIR)
const mdFiles = collectMdFiles(APP_DIR)
let errors = 0

for (const file of mdFiles) {
  const content = readFileSync(file, 'utf-8')
  const links = extractLinks(content)
  for (const link of links) {
    // Strip trailing slash for comparison
    const normalized = link === '/' ? '/' : link.replace(/\/$/, '')
    if (!routes.has(normalized)) {
      const rel = relative(APP_DIR, file)
      console.error(`Broken link: "${link}" in src/app/${rel}`)
      errors++
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} broken internal link(s) found.`)
  process.exit(1)
} else {
  console.log('All internal links OK.')
}
