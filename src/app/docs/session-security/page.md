---
title: Session Security
nextjs:
  metadata:
    title: Session Security
    description: Session tracking and management in Nestled — device detection, IP tracking, concurrent session limits, and logout everywhere.
---

Nestled tracks every login as a database-backed session with device and IP information. This enables features like "view active sessions", "logout from a specific device", and "logout everywhere".

---

## How it works

Every time a user logs in, registers, or authenticates via OAuth, the system creates a `UserSession` record. The session ID is embedded in the JWT payload so the API can validate or revoke sessions on every request.

---

## Session service

Located at `libs/api/custom/src/lib/plugins/auth/session.service.ts`, the session service provides:

| Method                                                  | Purpose                                         |
| ------------------------------------------------------- | ----------------------------------------------- |
| `createSession(userId, sessionInfo, twoFactorVerified)` | Create a new session with device/IP tracking    |
| `validateSession(sessionId)`                            | Check if a session exists and is valid          |
| `invalidateSession(sessionId)`                          | Invalidate a specific session                   |
| `invalidateAllUserSessions(userId, exceptSessionId?)`   | Logout everywhere                               |
| `getUserActiveSessions(userId)`                         | Get all active sessions for a user              |
| `detectNewLocationOrDevice(userId, sessionInfo)`        | Anomaly detection for new devices/IPs           |
| `extractSessionInfo(request)`                           | Extract device and IP info from an HTTP request |
| `cleanupOldSessions(daysOld)`                           | Remove old invalid sessions                     |

---

## Security features

### Concurrent session limits

Each user can have a configurable maximum number of active sessions (default: 5). When the limit is exceeded, the oldest session is automatically invalidated.

```env
SESSION_MAX_CONCURRENT=5
```

### Device detection

The session service parses the `User-Agent` header to identify the browser and operating system for each session.

### IP tracking

IP addresses are extracted with proxy support via `X-Forwarded-For` and `X-Real-IP` headers.

### New location detection

The system compares the current IP and device against the user's sessions from the last 30 days to flag logins from unfamiliar locations or devices.

---

## GraphQL API

### Query active sessions

```graphql
query GetUserSessions {
  getUserSessions {
    id
    createdAt
    lastActiveAt
    deviceInfo
    ipAddress
    isValid
    twoFactorVerified
    isCurrent
  }
}
```

The `isCurrent` field indicates which session belongs to the current request.

### Invalidate a specific session

```graphql
mutation InvalidateSession($sessionId: String!) {
  invalidateSession(sessionId: $sessionId)
}
```

### Logout everywhere

```graphql
mutation LogoutEverywhere {
  invalidateAllSessions
}
```

Returns the count of invalidated sessions.

---

## Frontend integration

### Display active sessions

```typescript
const { data } = useQuery(GET_USER_SESSIONS)

return (
  <div>
    <h2>Active Sessions</h2>
    {data?.getUserSessions.map(session => (
      <div key={session.id}>
        <div>{session.deviceInfo}</div>
        <div>{session.ipAddress}</div>
        <div>{session.isCurrent ? 'Current Session' :
          <button onClick={() => invalidateSession(session.id)}>
            Logout This Device
          </button>
        }</div>
      </div>
    ))}
  </div>
)
```

### Logout everywhere button

```typescript
const [logoutEverywhere] = useMutation(INVALIDATE_ALL_SESSIONS)

const handleLogoutEverywhere = async () => {
  const { data } = await logoutEverywhere()
  alert(`Logged out from ${data.invalidateAllSessions} devices`)
}
```

---

## Database schema

```prisma
model UserSession {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceInfo        String?
  ipAddress         String?
  twoFactorVerified Boolean   @default(false)
  isValid           Boolean   @default(true)
  lastActiveAt      DateTime  @default(now())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId, isValid])
  @@index([lastActiveAt])
}
```

---

## Security considerations

- **Audit trail** -- sessions are marked invalid but not deleted, preserving a history of login activity
- **IP privacy** -- IP addresses are stored for security and should be handled according to your privacy policy
- **Session rotation** -- session IDs are unique per login and are not rotated during an active session
- **2FA integration** -- the `twoFactorVerified` flag is updated after successful two-factor verification
- **Concurrent limits** -- prevents resource exhaustion from unlimited sessions

---

## Integration with authentication

Sessions are automatically created during login, registration, and OAuth flows. The JWT strategy validates the session on every request:

```typescript
const sessionInfo = this.sessionService.extractSessionInfo(context.req)
const userToken = await this.service.login(input, sessionInfo)
```

See [Authentication & RBAC](/docs/authentication) for the full auth flow and [Two-Factor Auth](/docs/two-factor-auth) for 2FA integration.
