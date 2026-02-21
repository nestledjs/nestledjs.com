---
title: Tenant Isolation
nextjs:
  metadata:
    title: Tenant Isolation
    description: Enterprise multi-tenant data isolation in Nestled — Prisma extensions, tenancy middleware, permission guards, and organization setup.
---

Nestled implements enterprise-grade multi-tenant data isolation using a layered security approach. Every piece of organization data is automatically protected at multiple levels, ensuring complete separation between tenants.

---

## Architecture

### Layer 1: Prisma Client Extension (database layer)

A Prisma extension automatically injects `organizationId` filters into all queries for organization-scoped models.

```typescript
// Without extension:
await prisma.team.findMany()
// Returns ALL teams from ALL organizations

// With extension (organizationId: "org-123"):
await prisma.team.findMany()
// Automatically filtered to org-123 only
```

**Protected models**: `organization`, `organizationMember`, `invite`, `team`, `teamMember`, `auditLog`, `subscription`.

### Layer 2: Tenancy Middleware (request layer)

Validates organization context on every GraphQL request:

1. Extract organization ID from `X-Organization-ID` header or user's `activeOrganizationId`
2. Validate the user is a member of the organization
3. Load the user's role and permissions for that organization
4. Attach `OrganizationContext` to the request

### Layer 3: Permission Guards (authorization layer)

Declarative permission checking using decorators:

```typescript
@Mutation(() => Boolean)
@UseGuards(GqlAuthGuard, PermissionsGuard)
@RequirePermissions({ subject: 'organization', action: 'update' })
async updateOrganization(
  @CtxUser() user: User,
  @CtxOrganization() org: OrganizationContext,
) {
  // Only executes if user has organization:update permission
}
```

### Layer 4: Context Decorators (developer experience)

Easy access to organization context in resolvers:

```typescript
@CtxOrganization()     // Full organization context with permissions
@CtxOrganizationId()   // Just the organization ID
@CtxUser()             // Authenticated user
```

---

## How to use

### Automatic isolation (recommended)

The system is active by default. Every authenticated GraphQL request automatically runs through authentication, tenancy validation, and organization context loading.

```typescript
@Query(() => [Team])
@UseGuards(GqlAuthGuard)
async myTeams(@CtxOrganization() org: OrganizationContext) {
  // Prisma extension automatically filters to org.organizationId
  return this.data.team.findMany()
}
```

### With permission checks

```typescript
@Mutation(() => Team)
@UseGuards(GqlAuthGuard, PermissionsGuard)
@RequirePermissions({ subject: 'team', action: 'create' })
async createTeam(
  @CtxOrganization() org: OrganizationContext,
  @Args('input') input: CreateTeamInput,
) {
  return this.data.team.create({
    data: {
      name: input.name,
      // organizationId automatically added by extension
    },
  })
}
```

### Manual permission check (in services)

```typescript
import { requirePermission } from '@nestled-template/api/utils'

async someServiceMethod(organizationContext: OrganizationContext) {
  requirePermission(organizationContext, 'billing', 'manage')
  // Throws ForbiddenException if user lacks permission
}
```

---

## Frontend integration

Set the active organization in your GraphQL requests:

```graphql
mutation {
  switchActiveOrganization(input: { organizationId: "org-123" }) {
    id
    activeOrganizationId
  }
}
```

Or override per-request with a header:

```typescript
const client = new ApolloClient({
  link: new HttpLink({
    headers: {
      'X-Organization-ID': 'org-123',
    },
  }),
})
```

---

## Important considerations

### Models without automatic isolation

Some models are intentionally not scoped to organizations:

- **User** -- users can belong to multiple organizations
- **Email**, **PhoneNumber**, **Address** -- can belong to a user or an organization
- **Country** -- global reference data
- **Permission**, **Plan** -- system-level data

For dual-ownership models, check both `userId` and `organizationId` explicitly.

{% callout type="warning" title="Do not bypass the extension" %}
Always use the injected `ApiCoreDataAccessService` for database queries. Creating a raw `PrismaClient` instance bypasses tenant isolation entirely.
{% /callout %}

---

## Adding new models

1. Add the model to your Prisma schema with an `organizationId` field
2. Add the model name to the `ORGANIZATION_SCOPED_MODELS` array in the tenant isolation extension
3. Run `pnpm db-update` -- automatic isolation is applied immediately

---

## Debugging

### Enable query logging

```shell
LOG_PRISMA_QUERIES=true npm run dev:api
```

You will see the automatic `organizationId` injection:

```sql
-- Before extension:
SELECT * FROM "Team" WHERE "id" = $1

-- After extension:
SELECT * FROM "Team" WHERE "id" = $1 AND "organizationId" = $2
```

### Check organization context

```typescript
@Query(() => String)
@UseGuards(GqlAuthGuard)
async debugContext(@CtxOrganization() org: OrganizationContext) {
  return JSON.stringify(org, null, 2)
}
```

Returns:

```json
{
  "organizationId": "org-123",
  "userId": "user-456",
  "roleId": "role-789",
  "roleName": "Owner",
  "permissions": [
    { "subject": "organization", "action": "update" },
    { "subject": "member", "action": "invite" }
  ]
}
```

---

## Performance

The Prisma extension adds roughly 0.1ms per query. For high-traffic applications, the tenancy middleware supports:

- Redis caching of organization memberships
- JWT tokens with embedded organization context
- Request-scoped caching

See [Authentication & RBAC](/docs/authentication) for details on the three-tier caching strategy.

---

## Migrating existing users to organizations

If you have user accounts that were created before multi-tenancy was implemented, those users will not have organizations. Run the migration script to fix this:

```shell
pnpm migrate:add-orgs
```

This script:

- Finds all users without any organization memberships
- Creates a default organization for each user
- Creates default roles (Owner, Admin, Member) for each organization
- Adds the user as the Owner
- Sets the new organization as the user's active organization

### After running the migration

1. Log out and log back in to refresh your session
2. Check the organization switcher in the top navigation
3. Verify you are the Owner of your organization with full permissions

{% callout title="Production" %}
Back up your database before running this migration in production. Test on a staging environment first and consider running during a maintenance window.
{% /callout %}

### Registration flow

When a new user registers, the backend automatically creates a default organization with three roles (Owner, Admin, Member), assigns the user as Owner, and sets it as their active organization. No manual migration is needed for newly registered users.
