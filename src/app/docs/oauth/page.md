---
title: OAuth
nextjs:
  metadata:
    title: OAuth
    description: Google and GitHub OAuth integration in Nestled — provider setup, authentication flow, account linking, and frontend integration.
---

Nestled supports OAuth authentication with Google and GitHub out of the box. Users can sign in with their existing accounts or link OAuth accounts to their existing profiles.

---

## Configuration

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your-github-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-client-secret

# Required for OAuth redirects
API_URL=http://localhost:3000
SITE_URL=http://localhost:4200
```

OAuth providers are automatically enabled when both client ID and secret are provided. If credentials are missing, that provider is silently disabled.

---

## Google OAuth setup

### 1. Create credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the **Google Identity** API
4. Go to **Credentials** then **Create Credentials** then **OAuth 2.0 Client ID**
5. Configure the consent screen if prompted
6. Select **Web application** as the application type
7. Add the authorized redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

For production:

```text
https://your-domain.com/api/auth/google/callback
```

### 2. Configure environment

```env
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-your-client-secret
```

---

## GitHub OAuth setup

### 1. Create an OAuth app

1. Go to [GitHub Settings - Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: Your App Name
   - **Homepage URL**: `http://localhost:4200`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`

For production, use your real domain for the callback URL:

```text
https://your-domain.com/api/auth/github/callback
```

4. Click **Register application** and generate a client secret

### 2. Configure environment

```env
GITHUB_OAUTH_CLIENT_ID=Iv1.your-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-client-secret
```

---

## How it works

### OAuth flow

```text
User clicks "Sign in with Google/GitHub"
  -> Redirect to: /api/auth/{provider}/authorize
  -> Provider authentication page
  -> Callback to: /api/auth/{provider}/callback?code=...
  -> Backend exchanges code for user profile
  -> Find or create user account
  -> Set authentication cookie
  -> Redirect to: {SITE_URL}/auth/oauth-success
```

### New user registration via OAuth

When a user signs in with OAuth for the first time:

1. Email, name, and avatar are fetched from the provider
2. A new user account is created with the OAuth email
3. Email is marked as verified (OAuth providers verify emails)
4. No password is set (OAuth-only account)
5. An `OAuthAccount` record links the user to the provider
6. If invited via an organization invite, the user is added to that organization
7. A JWT token is generated and set as an httpOnly cookie

### Existing user linking

Logged-in users can link an OAuth account to their profile. The system verifies the token with the provider and ensures the OAuth account is not already linked to another user.

---

## GraphQL API

### Get available providers

```graphql
query AvailableOAuthProviders {
  availableOAuthProviders {
    provider
    enabled
    name
  }
}
```

Returns which providers are configured and enabled.

### Link an OAuth account

```graphql
mutation LinkOAuthAccount($input: LinkOAuthInput!) {
  linkOAuthAccount(input: $input)
}
```

Input:

```typescript
{
  provider: OAuthProvider // GOOGLE | GITHUB
  token: string // OAuth access token or ID token
}
```

### Unlink an OAuth account

```graphql
mutation UnlinkOAuthAccount($input: UnlinkOAuthInput!) {
  unlinkOAuthAccount(input: $input)
}
```

{% callout type="warning" title="Account safety" %}
Users cannot unlink their only authentication method. They must have a password or another linked OAuth account before unlinking.
{% /callout %}

---

## Frontend integration

### OAuth sign-in buttons

```typescript
function signInWithGoogle() {
  window.location.href = `${API_URL}/api/auth/google/authorize`
}

function signInWithGitHub() {
  window.location.href = `${API_URL}/api/auth/github/authorize`
}
```

### Success and error handling

Create redirect handlers in your frontend:

**Success page** (`/auth/oauth-success`):

```typescript
useEffect(() => {
  // Cookie is automatically set by the backend
  navigate('/dashboard')
}, [])
```

**Error page** (`/auth/oauth-error`):

```typescript
const searchParams = new URLSearchParams(window.location.search)
const provider = searchParams.get('provider')
const error = searchParams.get('error')
```

### Linking an OAuth account

```typescript
const [linkOAuth] = useMutation(LINK_OAUTH_ACCOUNT)

const handleLinkGoogle = async () => {
  const googleToken = await getGoogleTokenViaPopup()

  await linkOAuth({
    variables: {
      input: {
        provider: 'GOOGLE',
        token: googleToken,
      },
    },
  })
}
```

### Check available providers

```typescript
const { data } = useQuery(AVAILABLE_OAUTH_PROVIDERS)

return (
  <div>
    {data?.availableOAuthProviders?.map(
      provider =>
        provider.enabled && (
          <button key={provider.provider}>Sign in with {provider.name}</button>
        ),
    )}
  </div>
)
```

---

## Database schema

```prisma
model OAuthAccount {
  id             String   @id @default(uuid())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  provider       String
  providerUserId String
  userId         String
  user           User     @relation("User_hasMany_OAuthAccounts", fields: [userId], references: [id])

  @@unique([provider, providerUserId])
}
```

---

## Security features

- **Email verification** -- OAuth providers verify emails, so users created via OAuth are automatically verified
- **Account protection** -- users cannot unlink their only authentication method
- **Secure token storage** -- JWT tokens are stored in httpOnly cookies with SameSite=lax
- **Provider verification** -- Google ID tokens and GitHub authorization codes are verified server-side
- **Duplicate prevention** -- unique constraint on `[provider, providerUserId]` prevents the same OAuth account from linking to multiple users

---

## Troubleshooting

### "OAuth is not configured"

Missing environment variables. Check that both client ID and secret are set for the provider.

### "Redirect URI mismatch"

The OAuth app redirect URI does not match the actual callback URL. Verify:

- Google: `{API_URL}/api/auth/google/callback`
- GitHub: `{API_URL}/api/auth/github/callback`
- `API_URL` in `.env` matches your actual API URL

### "Invalid token" errors

- For Google: ensure you are passing the `id_token`, not the `access_token`
- For GitHub: ensure you are passing the authorization `code`, not the access token
- Check that redirect URIs match exactly (including http vs https)

### "GitHub account must have a verified email address"

The GitHub user has no verified email or their email is private. Go to GitHub Settings then Emails and verify at least one email address.

### "This OAuth account is already linked"

The OAuth account is already connected to another user. Sign in with that OAuth provider instead, or unlink from the other account first.

---

## Adding custom providers

To add a new OAuth provider (e.g., Microsoft, Apple):

1. Create a provider verification method in `oauth.service.ts`
2. Add the provider to the `OAuthProvider` enum
3. Create controller endpoints for authorize and callback
4. Add environment variables for the client ID and secret

See the existing Google and GitHub implementations for reference.
