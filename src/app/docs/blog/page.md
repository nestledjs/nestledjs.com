---
title: Blog Publishing
nextjs:
  metadata:
    title: Blog Publishing
    description: AI-ready feature spec for adding a production blog to Nestled Template, including Prisma schema, generated CRUD, custom public GraphQL resolvers, authoring workflow, SDK operations, and React Router pages.
---

{% callout type="note" %}
This is an [add-on idea](/docs/add-ons) -- a detailed AI-ready spec you can copy into your coding assistant to implement this feature. See [Add-On Ideas](/docs/add-ons) for how these work.
{% /callout %}

## What this add-on provides

- **Public blog pages** -- `/blog` index, `/blog/:slug` post detail, RSS, sitemap entries, SEO metadata, and Open Graph images
- **Authoring workflow** -- draft, review, scheduled, published, archived states with preview links
- **Admin publishing tools** -- admin-only CRUD through generated resolvers plus optional custom editorial mutations
- **Content taxonomy** -- categories, tags, excerpts, featured posts, reading time, canonical URLs, and hero images
- **Safe public reads** -- custom GraphQL queries that only return published content and never expose drafts

## Who needs this

- SaaS teams that want content marketing inside their main app instead of a separate CMS
- Product teams publishing changelogs, guides, customer stories, or SEO landing content
- Projects that need a simple editorial workflow without introducing a headless CMS dependency
- Teams that want blog content to share auth, storage, admin, audit, and deployment infrastructure with the app

## What already exists

The base Nestled template has the pieces a blog should build on:

- **Prisma schema and codegen** in `libs/api/prisma/src/lib/schemas/schema.prisma`
- **Generated admin CRUD** from normal Prisma models; do not edit `libs/api/generated-crud/*`
- **Custom plugin resolvers** under `libs/api/custom/src/lib/plugins/*`
- **Safe plugin exports** from `libs/api/custom/src/lib/plugins/index.ts`
- **App module wiring** in `apps/api/src/app.module.ts`
- **Application-owned GraphQL SDK operations** in `libs/shared/sdk/src/graphql/*`
- **React Router v7 routes** registered manually in `apps/web/app/routes.tsx`
- **Storage integration** through `StoredFile` for post hero images and future inline media

## Full implementation spec

Copy the specification below and paste it into your AI coding assistant. It contains the architecture, schema, backend services, resolvers, SDK operations, frontend pages, tests, and implementation checklist needed to build a production-ready blog in Nestled Template.

````markdown
# Blog Publishing Add-On for Nestled Template

Implement a production blog for Nestled Template. The blog must support public published content, admin authoring, SEO metadata, categories, tags, hero images, preview links, RSS, sitemap entries, and tests.

Do not build a file-system markdown blog. Store posts in PostgreSQL through Prisma so the existing admin, auth, generated CRUD, audit, and GraphQL infrastructure can manage the content.

---

## Goals

- Add a public `/blog` route listing published posts.
- Add a public `/blog/:slug` route for published post details.
- Add admin authoring through generated admin CRUD and focused custom editorial operations.
- Keep drafts, review posts, scheduled posts, and archived posts private.
- Make blog content SEO-ready with title, description, canonical URL, Open Graph image, structured dates, RSS, and sitemap entries.
- Reuse existing Nestled patterns instead of introducing a CMS or separate backend.

## Non-goals

- Do not add comments, reactions, or newsletter subscriptions in the first pass.
- Do not add WYSIWYG editing unless the project already has a rich-text editor dependency.
- Do not use direct `@prisma/client` imports. Always import Prisma types from `@nestled-template/api/prisma`.
- Do not override generated CRUD resolver method names such as `blogPost`, `blogPosts`, `createBlogPost`, `updateBlogPost`, or `deleteBlogPost`.
- Do not edit `libs/api/generated-crud/*` manually.

---

## Existing Architecture to Respect

Nestled Template uses:

- Nx with pnpm.
- NestJS GraphQL API.
- Prisma schema at `libs/api/prisma/src/lib/schemas/schema.prisma`.
- Generated Prisma client wrapper exported from `@nestled-template/api/prisma`.
- Generated GraphQL models in `libs/api/core/models`.
- Generated admin CRUD in `libs/api/generated-crud`.
- Custom API plugins in `libs/api/custom/src/lib/plugins`.
- React Router v7 web app in `apps/web`.
- Manual route registration in `apps/web/app/routes.tsx`.
- Application-owned GraphQL SDK operations in `libs/shared/sdk/src/graphql`.
- Storage through `StoredFile`.
- Auth guards from `@nestled-template/api/utils`.

After editing the Prisma schema, run:

```bash
pnpm db-update
```

This regenerates Prisma, generated CRUD, models, schema, and SDK types.

---

## Data Model

Add blog models near the other alphabetical Prisma models in `libs/api/prisma/src/lib/schemas/schema.prisma`.

Use normal generated CRUD for these models as the admin management surface, so do not add `@skipCrud`. Generated CRUD is unconditionally admin-only in generators 3. Public reads must go through custom resolvers that explicitly filter to published posts.

### Prisma Schema

```prisma
model BlogCategory {
  id          String     @id @default(uuid())
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  name        String
  slug        String     @unique
  description String?
  posts       BlogPost[]

  @@index([slug])
}

model BlogTag {
  id        String     @id @default(uuid())
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  name      String
  slug      String     @unique
  posts     BlogPost[] @relation("BlogPostTags")

  @@index([slug])
}

model BlogPost {
  id              String         @id @default(uuid())
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  title           String
  slug            String         @unique
  excerpt         String?
  body            String
  bodyFormat      BlogBodyFormat @default(MARKDOWN)
  status          BlogPostStatus @default(DRAFT)
  publishedAt     DateTime?
  scheduledFor    DateTime?
  archivedAt      DateTime?
  featured        Boolean        @default(false)
  readingTimeMin  Int?
  seoTitle        String?
  seoDescription  String?
  canonicalUrl    String?
  ogImageId       String?
  ogImage         StoredFile?    @relation("BlogPost_ogImage", fields: [ogImageId], references: [id], onDelete: SetNull)
  authorId        String
  author          User           @relation("BlogPost_author", fields: [authorId], references: [id])
  categoryId      String?
  category        BlogCategory?  @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags            BlogTag[]      @relation("BlogPostTags")

  @@index([status, publishedAt])
  @@index([featured, publishedAt])
  @@index([authorId])
  @@index([categoryId])
}

enum BlogBodyFormat {
  MARKDOWN
  HTML
}

enum BlogPostStatus {
  DRAFT
  REVIEW
  SCHEDULED
  PUBLISHED
  ARCHIVED
}
```

Update existing relation models:

```prisma
model User {
  // existing fields...
  blogPosts BlogPost[] @relation("BlogPost_author")
}

model StoredFile {
  // existing fields...
  blogPostOgImages BlogPost[] @relation("BlogPost_ogImage")
}
```

### Schema Rules

- `slug` is globally unique. If the project needs per-organization blogs later, add `organizationId` and decide whether public URLs include organization slugs.
- `status = PUBLISHED` and `publishedAt <= now()` are both required for public visibility.
- `status = SCHEDULED` requires `scheduledFor` and must not appear publicly until an explicit publish job or resolver logic promotes it.
- `body` stores Markdown by default. Sanitize rendered HTML on the frontend or render Markdown through a safe renderer.
- `seoTitle` falls back to `title`.
- `seoDescription` falls back to `excerpt`.
- `ogImage` reuses the existing storage model.

---

## Backend Plugin

Create a custom plugin at:

```text
libs/api/custom/src/lib/plugins/blog/
```

Files:

```text
blog.module.ts
blog.resolver.ts
blog.service.ts
dto/blog-posts.input.ts
dto/index.ts
models/blog-post-page.output.ts
models/index.ts
index.ts
```

Export the plugin from `libs/api/custom/src/lib/plugins/index.ts`:

```typescript
export * from './blog'
```

Add `BlogModule` to `pluginModules` in `apps/api/src/app.module.ts`.

Generated `BlogPostModule`, `BlogCategoryModule`, and `BlogTagModule` should be added to `defaultModules` after `pnpm db-update` generates them.

### DTOs

Create `dto/blog-posts.input.ts`:

```typescript
import { Field, InputType, Int } from '@nestjs/graphql'

@InputType()
export class BlogPostsInput {
  @Field(() => Int, { nullable: true })
  take?: number

  @Field(() => String, { nullable: true })
  cursor?: string

  @Field(() => String, { nullable: true })
  categorySlug?: string

  @Field(() => String, { nullable: true })
  tagSlug?: string

  @Field(() => Boolean, { nullable: true })
  featuredOnly?: boolean
}
```

Create `models/blog-post-page.output.ts`:

```typescript
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { BlogPost } from '@nestled-template/api/core/models'

@ObjectType()
export class BlogPostPage {
  @Field(() => [BlogPost])
  nodes!: BlogPost[]

  @Field(() => String, { nullable: true })
  nextCursor?: string | null

  @Field(() => Int)
  totalCount!: number
}
```

### Service

Create `blog.service.ts`. Use `ApiCoreDataAccessService` and import Prisma types only from `@nestled-template/api/prisma` if needed.

Required service behavior:

- `listPublishedPosts(input?: BlogPostsInput): Promise<BlogPostPage>`
- `getPublishedPostBySlug(slug: string): Promise<BlogPost | null>`
- `getFeaturedPublishedPosts(limit?: number): Promise<BlogPost[]>`
- `getPublishedCategories(): Promise<BlogCategory[]>`
- `getPublishedTags(): Promise<BlogTag[]>`
- `previewPost(id: string, user: User): Promise<BlogPost>` guarded for super admins only in the first implementation
- `publishScheduledPosts(now = new Date()): Promise<number>` optional helper for later cron wiring

Public queries must include this invariant:

```typescript
const publishedWhere = {
  status: 'PUBLISHED',
  publishedAt: { lte: new Date() },
}
```

Use a helper so the filter is not duplicated incorrectly:

```typescript
private publishedPostWhere(now = new Date()) {
  return {
    status: 'PUBLISHED' as const,
    publishedAt: { lte: now },
  }
}
```

When returning posts, include:

```typescript
include: {
  author: true,
  category: true,
  tags: true,
  ogImage: true,
}
```

For pagination:

- Default `take` to 12.
- Cap `take` at 50.
- Use cursor pagination on `id`.
- Order by `publishedAt desc`, then `createdAt desc`.
- Return `nextCursor` when more records exist.

For slug lookup:

- Trim and lowercase slug input.
- Return `null` for unpublished, future-scheduled, draft, review, or archived posts.
- Resolver should convert `null` to `NotFoundException` for GraphQL clients.

For category/tag lists:

- Only return categories/tags that have at least one currently published post.
- Order by `name asc`.

### Resolver

Create additive custom resolver names that cannot collide with generated CRUD:

```typescript
import { Args, Query, Resolver } from '@nestjs/graphql'
import { NotFoundException, UseGuards } from '@nestjs/common'
import {
  BlogCategory,
  BlogPost,
  BlogTag,
  User,
} from '@nestled-template/api/core/models'
import { CtxUser, GqlAuthAdminGuard } from '@nestled-template/api/utils'
import { BlogPostsInput } from './dto'
import { BlogPostPage } from './models'
import { BlogService } from './blog.service'

@Resolver(() => BlogPost)
export class BlogResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query(() => BlogPostPage)
  publishedBlogPosts(
    @Args({ name: 'input', type: () => BlogPostsInput, nullable: true })
    input?: BlogPostsInput,
  ): Promise<BlogPostPage> {
    return this.blogService.listPublishedPosts(input)
  }

  @Query(() => BlogPost)
  async publishedBlogPostBySlug(@Args('slug') slug: string): Promise<BlogPost> {
    const post = await this.blogService.getPublishedPostBySlug(slug)
    if (!post) throw new NotFoundException('Blog post not found')
    return post
  }

  @Query(() => [BlogPost])
  featuredBlogPosts(
    @Args('limit', { nullable: true }) limit?: number,
  ): Promise<BlogPost[]> {
    return this.blogService.getFeaturedPublishedPosts(limit)
  }

  @Query(() => [BlogCategory])
  publishedBlogCategories(): Promise<BlogCategory[]> {
    return this.blogService.getPublishedCategories()
  }

  @Query(() => [BlogTag])
  publishedBlogTags(): Promise<BlogTag[]> {
    return this.blogService.getPublishedTags()
  }

  @Query(() => BlogPost)
  @UseGuards(GqlAuthAdminGuard)
  adminPreviewBlogPost(
    @CtxUser() user: User,
    @Args('id') id: string,
  ): Promise<BlogPost> {
    return this.blogService.previewPost(id, user)
  }
}
```

Do not use these generated names for custom operations:

- `blogPost`
- `blogPosts`
- `blogPostsCount`
- `createBlogPost`
- `updateBlogPost`
- `deleteBlogPost`
- `blogCategory`
- `blogCategories`
- `blogTag`
- `blogTags`

### Module

```typescript
import { Module } from '@nestjs/common'
import { ApiCoreDataAccessModule } from '@nestled-template/api/core/data-access'
import { BlogResolver } from './blog.resolver'
import { BlogService } from './blog.service'

@Module({
  imports: [ApiCoreDataAccessModule],
  providers: [BlogResolver, BlogService],
  exports: [BlogService],
})
export class BlogModule {}
```

### Optional Editorial Mutations

Generated admin CRUD can create and update posts, but optional custom mutations can enforce publishing invariants:

- `adminPublishBlogPost(id: string)`
- `adminUnpublishBlogPost(id: string)`
- `adminScheduleBlogPost(id: string, scheduledFor: Date)`
- `adminArchiveBlogPost(id: string)`

Guard them with `GqlAuthAdminGuard` in the first pass. If the project implements granular RBAC later, change these to a blog-specific permission guard.

Publishing validation:

- Require `title`, `slug`, `body`, `excerpt`, `authorId`.
- Set `publishedAt` when publishing if it is missing.
- Clear `scheduledFor` when publishing immediately.
- Reject duplicate slug through the schema unique constraint and return a friendly `BadRequestException`.

---

## SDK Operations

Add GraphQL operations under:

```text
libs/shared/sdk/src/graphql/blog/
```

Create:

```text
blog-fragments.graphql
blog-queries.graphql
```

Example fragment:

```graphql
fragment BlogPostCardFields on BlogPost {
  id
  title
  slug
  excerpt
  publishedAt
  featured
  readingTimeMin
  seoTitle
  seoDescription
  author {
    id
    firstName
    lastName
    displayName
    avatar {
      id
      publicUrl
      url
    }
  }
  category {
    id
    name
    slug
  }
  tags {
    id
    name
    slug
  }
  ogImage {
    id
    publicUrl
    url
    width
    height
  }
}
```

Example queries:

```graphql
query PublishedBlogPosts($input: BlogPostsInput) {
  publishedBlogPosts(input: $input) {
    nodes {
      ...BlogPostCardFields
    }
    nextCursor
    totalCount
  }
}

query PublishedBlogPostBySlug($slug: String!) {
  publishedBlogPostBySlug(slug: $slug) {
    ...BlogPostCardFields
    body
    bodyFormat
    canonicalUrl
    createdAt
    updatedAt
  }
}

query PublishedBlogTaxonomy {
  publishedBlogCategories {
    id
    name
    slug
    description
  }
  publishedBlogTags {
    id
    name
    slug
  }
}
```

Run:

```bash
pnpm sdk
```

or rely on `pnpm db-update` if it regenerates the SDK in the current workflow.

---

## Frontend Routes

React Router routes are not auto-discovered. Register every page in `apps/web/app/routes.tsx`.

Add the public blog routes under the public layout:

```typescript
route('', './routes/_public/_layout.tsx', [
  index('./routes/_public/_index.tsx'),
  route('login', './routes/_public/login.tsx'),
  route('register', './routes/_public/register.tsx'),
  route('forgot-password', './routes/_public/forgot-password.tsx'),
  route('resend-verification', './routes/_public/resend-verification.tsx'),
  route('reset-password', './routes/_public/reset-password.tsx'),
  route('verify-email', './routes/_public/verify-email.tsx'),
  route('pricing', './routes/pricing.tsx'),
  route('blog', './routes/_public/blog/_index.tsx'),
  route('blog/:slug', './routes/_public/blog/$slug.tsx'),
])
```

Create:

```text
apps/web/app/routes/_public/blog/_index.tsx
apps/web/app/routes/_public/blog/$slug.tsx
apps/web/app/routes/_public/blog/_components.tsx
apps/web/app/routes/_public/blog/_markdown.tsx
```

### Navigation

Only add `Blog` back to the public header once the routes above exist and tests pass.

Update `apps/web/app/routes/_public/_layout.tsx`:

```typescript
navigation={[
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Sign Up', href: '/register' },
]}
```

The current base template intentionally does not show a Blog link until this add-on is implemented.

### Blog Index Page

The `/blog` page should:

- Load `PublishedBlogPosts` and `PublishedBlogTaxonomy`.
- Render featured posts first when available.
- Render category and tag filters as links with query params.
- Support `?category=slug` and `?tag=slug`.
- Include a load-more pattern using `nextCursor`.
- Show a helpful empty state when no published posts exist.
- Use real links to `/blog/:slug`.
- Set page metadata to "Blog" and a configurable description.

Use a quiet SaaS content layout rather than a decorative marketing hero. It should feel like a professional product blog with clear scanning, dates, categories, and excerpts.

### Blog Detail Page

The `/blog/:slug` page should:

- Load `PublishedBlogPostBySlug`.
- Return a 404 response when the GraphQL resolver returns not found.
- Render title, excerpt, author, published date, reading time, category, tags, hero image, and body.
- Render Markdown safely.
- Set SEO metadata:
  - title: `seoTitle ?? title`
  - description: `seoDescription ?? excerpt`
  - canonical: `canonicalUrl ?? current URL`
  - Open Graph image from `ogImage.publicUrl ?? ogImage.url`
- Include JSON-LD `BlogPosting` structured data.
- Include links back to the blog index and related category/tag filters.

### Markdown Rendering

Preferred first pass:

- Add a small Markdown renderer dependency only if the project already accepts it.
- Sanitize HTML output if rendering Markdown to HTML.
- Keep code blocks readable.
- Do not allow arbitrary script tags or event handler attributes.

If avoiding a dependency in the first pass, render `body` as plain text paragraphs and leave a TODO in the add-on PR to add a safe Markdown renderer before production publishing.

---

## RSS and Sitemap

### RSS

Add route:

```typescript
route('blog/rss.xml', './routes/_public/blog/rss.xml.ts')
```

The RSS loader should:

- Query latest published posts.
- Set `Content-Type: application/rss+xml; charset=utf-8`.
- Escape XML values.
- Include title, link, guid, pubDate, description, and author.
- Use `SITE_URL` or request origin to create absolute URLs.

### Sitemap

Update `apps/web/app/routes/sitemap.xml.ts` so published blog posts are included.

Rules:

- Only include `PUBLISHED` posts with `publishedAt <= now`.
- Use canonical blog URLs.
- Use `updatedAt` for `lastmod`.
- Do not include drafts, scheduled posts, review posts, archived posts, admin preview URLs, or unpublished categories/tags.

---

## Admin UX

First pass:

- Rely on generated admin CRUD and the existing admin data browser for `BlogPost`, `BlogCategory`, and `BlogTag`.
- Ensure generated admin CRUD exists by not using `@skipCrud`.
- Verify the admin data browser can create and update blog records.

Recommended second pass:

- Add `/admin/blog` with a purpose-built editorial dashboard.
- Add list tabs for Draft, Review, Scheduled, Published, Archived.
- Add actions for Publish, Schedule, Archive, Duplicate, Preview.
- Add slug generation from title with manual override.
- Add reading-time calculation from body.
- Add validation warnings before publish.

Admin dashboard route registration:

```typescript
route('blog', './routes/admin/blog/_index.tsx')
route('blog/new', './routes/admin/blog/new.tsx')
route('blog/:id', './routes/admin/blog/$id.tsx')
```

---

## Validation and Invariants

Enforce these rules in service methods and tests:

- Public queries never return non-published posts.
- Public queries never return posts with future `publishedAt`.
- Public queries never return archived posts.
- Slugs are unique and URL-safe.
- `publishedAt` is set when a post is published.
- Scheduled posts are not visible until promoted to published.
- Preview queries require admin auth.
- `take` is capped to avoid large public queries.
- Category and tag filters only match published posts.
- XML output is escaped in RSS and sitemap.

Slug helper:

```typescript
export function normalizeBlogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

Reject empty slugs after normalization.

Reading time helper:

```typescript
export function estimateReadingTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}
```

---

## Tests

Add focused tests. Do not only rely on generated CRUD tests.

Backend:

```text
libs/api/custom/src/lib/plugins/blog/blog.service.spec.ts
libs/api/custom/src/lib/plugins/blog/blog.resolver.spec.ts
```

Cover:

- Published list returns only `PUBLISHED` posts with `publishedAt <= now`.
- Draft, review, scheduled future, and archived posts are excluded.
- Slug lookup returns published post by slug.
- Slug lookup returns null for unpublished posts.
- Pagination returns `nextCursor`.
- `take` is capped at 50.
- Category and tag filters only count published posts.
- Preview requires admin guard at resolver level.

Frontend:

```text
apps/web/tests/routes/_public/blog/_index.spec.tsx
apps/web/tests/routes/_public/blog/$slug.spec.tsx
apps/web/tests/routes/_public/blog/rss.spec.ts
```

Cover:

- Blog index renders posts, categories, tags, and empty state.
- Blog index links to post detail pages.
- Category/tag query params call the SDK with the right input.
- Blog detail renders metadata, author, tags, hero image, and body.
- Blog detail handles not found.
- RSS escapes XML and excludes unpublished posts.

Route registration:

- Add a test or assertion that `/blog` and `/blog/:slug` are registered.
- Update public layout tests to expect `Blog` only after the blog routes exist.

---

## Implementation Checklist

1. Update `schema.prisma` with `BlogPost`, `BlogCategory`, `BlogTag`, `BlogBodyFormat`, and `BlogPostStatus`.
2. Add `User.blogPosts` and `StoredFile.blogPostOgImages` relations.
3. Run `pnpm db-update`.
4. Confirm generated modules and resolvers exist for blog models.
5. Add `BlogModule`, `BlogResolver`, `BlogService`, DTOs, and output models under `libs/api/custom/src/lib/plugins/blog`.
6. Export the plugin from `libs/api/custom/src/lib/plugins/index.ts`.
7. Add `BlogModule` to `pluginModules` in `apps/api/src/app.module.ts`.
8. Add generated blog modules to `defaultModules` if codegen does not wire them automatically.
9. Add SDK GraphQL fragments and queries under `libs/shared/sdk/src/graphql/blog`.
10. Run `pnpm sdk` if needed.
11. Register `/blog`, `/blog/:slug`, and `/blog/rss.xml` in `apps/web/app/routes.tsx`.
12. Add blog index, detail, RSS, and shared blog components.
13. Update `sitemap.xml.ts` to include published posts.
14. Add `Blog` to the public header only after the routes are implemented.
15. Add backend and frontend tests.
16. Run:

```bash
pnpm format:check
pnpm nx test api-custom
pnpm nx test web
pnpm nx build api
pnpm nx build web
```

If project names differ, use `pnpm nx show projects --withTarget test` and `pnpm nx show projects --withTarget build` to pick the exact targets.

17. Decide downstream propagation:
    - This is a template feature add-on, so create an upgrade note if adding it to the template.
    - Use `pnpm template:create-upgrade-note --id YYYY-MM-DD-blog-publishing`.
    - Validate with `pnpm template:validate-upgrade-notes`.

---

## Acceptance Criteria

- `/blog` loads successfully and shows only currently published posts.
- `/blog/:slug` loads a published post and returns not found for drafts or future posts.
- Admins can create and edit posts through generated admin CRUD.
- Public GraphQL operations cannot expose drafts, review posts, scheduled future posts, or archived posts.
- RSS and sitemap include only public posts.
- Header includes Blog only when blog routes are present.
- Tests cover visibility rules, slug lookup, pagination, filtering, route rendering, and RSS escaping.
- No custom resolver method collides with generated CRUD names.
- No imports come directly from `@prisma/client`.
````
