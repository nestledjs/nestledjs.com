---
title: Authentication & RBAC
nextjs:
  metadata:
    title: Authentication & RBAC
    description: How Nestled handles authentication, role-based access control, organization-scoped permissions, guards, and frontend integration.
---

Nestled implements multi-tenant authentication with role-based access control. Every user belongs to one or more organizations, and their permissions are determined by their role within each organization.

---

## Architecture overview

The system is built on these core principles:

1. **Organization-scoped security** -- all user data is scoped to organizations
2. **Role-based permissions** -- roles grant specific permissions within an organization
3. **Permission granularity** -- permissions follow a `subject:action` pattern (e.g., `member:invite`, `organization:update`)
4. **Three-tier caching** -- request-level, Redis, and DataLoader caching for performance
5. **Session-based JWT** -- JWTs contain session IDs for revocable tokens

### Data model

```text
User
  -> activeOrganizationId -> Organization
  -> OrganizationMember[] (many-to-many via membership)
       -> organizationId -> Organization
       -> roleId -> Role
              -> permissions[] -> Permission (many-to-many)
```

---

## Authentication flow

### Login process

1. User submits `login` mutation with email/password
2. `AuthService.login()` validates credentials with bcrypt (cost factor 10) and adds a 100-200ms random delay to prevent timing attacks
3. Creates a `UserSession` with device/IP info
4. Signs a JWT with the payload:

```typescript
{
  userId: string
  sessionId: string
  isEmulating?: boolean
  originalAdminId?: string
}
```

5. Sets an HTTP-only cookie with the JWT token

### JWT strategy

The JWT strategy extracts tokens from both the Authorization header and cookies (priority to header). On every request, it validates the session is still active in the database and attaches the user to `req.user`.

```typescript
async validate(payload: JwtPayload): Promise<User> {
  const user = await this.auth.validateUserForJWT(payload.userId)

  if (payload.sessionId) {
    const isSessionValid = await this.auth.isSessionValid(payload.sessionId)
    if (!isSessionValid) {
      throw new UnauthorizedException('Session has been invalidated.')
    }
  }

  return user
}
```

This allows both API clients (Authorization header) and web browsers (cookies) to authenticate.

---

## Organization context

In a multi-tenant system, every request must be scoped to an organization. The `GqlAuthGuard` pre-loads organization context using a three-tier strategy:

1. **Header override** -- `X-Organization-ID` header for explicit selection
2. **Active organization** -- the user's `activeOrganizationId` field
3. **Redis cache** -- cached active organization from a previous request

The loaded context includes the organization ID, user ID, role, and permissions. Super admins automatically receive an `all:manage` permission that grants full access.

### OrganizationContext type

```typescript
interface OrganizationContext {
  organizationId: string
  userId: string
  roleId: string
  roleName: string
  permissions: Array<{ subject: string; action: string }>
}
```

### Me query

The `me` query returns user data with embedded organization context:

```graphql
query Me {
  me {
    id
    firstName
    activeOrganizationId
    myOrganizations {
      id
      name
      userMembership {
        role {
          name
          permissions {
            subject
            action
          }
        }
      }
    }
  }
}
```

---

## Permission system

### Permission model

```prisma
model Permission {
  id          String  @id @default(uuid())
  action      String
  subject     String
  description String?
  roles       Role[]  @relation("RolePermissions")

  @@unique([action, subject])
}
```

Permissions follow the `subject:action` pattern where **subject** is the resource (e.g., `member`, `billing`, `organization`) and **action** is the operation (e.g., `read`, `create`, `update`, `delete`, `manage`).

### Permission checking

```typescript
export function hasPermission(
  organizationContext: OrganizationContext | undefined,
  subject: string,
  action: string,
): boolean {
  if (!organizationContext) return false

  return organizationContext.permissions.some(
    (p) =>
      (p.subject === subject && p.action === action) ||
      (p.subject === 'all' && p.action === 'manage'),
  )
}
```

### Usage in resolvers

```typescript
@Mutation(() => Invite)
@UseGuards(GqlOrganizationScopedGuard, PermissionsGuard)
@RequirePermissions({ subject: 'member', action: 'invite' })
async inviteMember(
  @CtxOrganization() orgContext: OrganizationContext,
  @Args('input') input: InviteMemberInput
): Promise<Invite> {
  return this.service.createInvitation(orgContext.organizationId, input)
}
```

---

## Role definitions

Three default roles are created for each organization:

### Organization Owner

Has `all:manage` permission (super permission that grants everything). Can delete the organization and transfer ownership. Cannot be removed from the organization.

### Organization Admin

Can manage most features except billing and deletion:

- `organization:read`, `organization:update`
- `member:read`, `member:invite`, `member:update`, `member:remove`
- `role:read`, `role:create`, `role:update`, `role:delete`
- `api_keys:read`, `api_keys:manage`
- `team:read`, `team:create`, `team:update`, `team:delete`
- `billing:read`, `audit:read`

### Organization Member

Read-only access: `organization:read`, `member:read`, `role:read`, `api_keys:read`, `team:read`, `billing:read`.

### Super admin

Users with `isSuperAdmin: true` automatically receive `all:manage` for every organization, bypassing normal permission checks.

---

## Guards and decorators

### Available guards

| Guard                        | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `GqlAuthGuard`               | JWT authentication + organization context loading |
| `GqlAuthAdminGuard`          | Requires `all:manage` permission                  |
| `GqlOrganizationScopedGuard` | Requires organization context                     |
| `PermissionsGuard`           | Checks `@RequirePermissions` decorator            |

### Available decorators

| Decorator               | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `@CtxUser()`            | Extract authenticated user from request |
| `@CtxOrganization()`    | Extract full organization context       |
| `@CtxOrganizationId()`  | Extract just the organization ID        |
| `@RequirePermissions()` | Declare required permissions            |

### Guard ordering

Guards execute in order. For organization-scoped resolvers:

```typescript
@UseGuards(GqlAuthGuard, PermissionsGuard)
// or
@UseGuards(GqlOrganizationScopedGuard, PermissionsGuard)
```

1. Auth guard runs first -- validates JWT, loads organization context
2. Permissions guard runs second -- checks permissions against organization context, throws `ForbiddenException` if denied

---

## Frontend integration

### Global context provider

The frontend stores authentication and organization state in React Context:

```typescript
interface GlobalProviderContextValue {
  user?: MeQuery['me'] | null
  organizations?: AuthOrganization[]
  activeOrganization?: AuthOrganization | null
  activeOrganizationMember?: AuthOrganizationMember | null
}

export function useGlobalCtx() {
  const context = React.useContext(GlobalContext)
  if (!context) {
    throw new Error('useGlobalCtx must be used within a GlobalContextProvider')
  }
  return context
}
```

### Permission component

The `RequirePermission` component conditionally renders children based on the user's permissions:

```typescript
<RequirePermission permission="member:invite">
  <InviteButton />
</RequirePermission>

// Any of multiple permissions
<RequirePermission anyOf={["member:invite", "member:update"]}>
  <ManageMembers />
</RequirePermission>

// All of multiple permissions
<RequirePermission allOf={["member:invite", "member:update"]}>
  <FullMemberManagement />
</RequirePermission>
```

### Apollo Client organization header

The Apollo client automatically includes the active organization ID with every GraphQL request via the `X-Organization-ID` header. The `activeOrganizationId` is synced to localStorage whenever the user switches organizations.

---

## Caching strategy

### Three-tier architecture

```text
Request arrives
    -> TIER 1: Request-level cache (req.organizationContext)
    -> TIER 2: Redis cache (10-min TTL)
    -> TIER 3: DataLoader (batches DB queries)
    -> Database
```

**Tier 1** -- attached to the Express request by `GqlAuthGuard`, available throughout the single request.

**Tier 2** -- Redis with key-specific TTLs:

- `auth:session:{sessionId}` -- 15 min
- `auth:membership:{userId}:{organizationId}` -- 10 min
- `auth:user-active-org:{userId}` -- 15 min

**Tier 3** -- DataLoader batches multiple membership lookups into a single database query per request tick.

Cache invalidation methods are available for role changes, user departures, and permission updates.

---

## Security event tracking

All security-relevant operations are logged to the `SecurityEvent` table:

```typescript
enum SecurityEventType {
  PASSWORD_CHANGED
  EMAIL_CHANGED
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  RECOVERY_CODES_GENERATED
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  SUSPICIOUS_LOGIN_ATTEMPT
  PASSWORD_RESET_REQUESTED
  LOGIN_LOCATION_CHANGE
  API_TOKEN_CREATED
  API_TOKEN_REVOKED
  API_TOKEN_ROTATED
}
```

---

## Seed data

Permissions are seeded globally (not organization-specific) using `upsert` to safely re-run. Roles are created per organization when a new organization is registered, linking the appropriate permissions.

See the [Architecture](/docs/architecture) page for how the seed pipeline fits into the overall code generation flow.
