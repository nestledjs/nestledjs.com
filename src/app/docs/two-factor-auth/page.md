---
title: Two-Factor Auth
nextjs:
  metadata:
    title: Two-Factor Auth
    description: TOTP-based two-factor authentication in Nestled — setup flow, backup codes, GraphQL API, and frontend integration.
---

Nestled includes a complete two-factor authentication system using TOTP (Time-based One-Time Passwords), compatible with Google Authenticator, Authy, Microsoft Authenticator, and 1Password.

---

## Configuration

Add these to your `.env` file:

```env
TWO_FACTOR_ISSUER=your-app-name
TWO_FACTOR_WINDOW=2
TWO_FACTOR_ENCRYPTION_KEY=your-32-char-key
```

| Variable                    | Default      | Description                                                  |
| --------------------------- | ------------ | ------------------------------------------------------------ |
| `TWO_FACTOR_ISSUER`         | `APP_NAME`   | Name shown in authenticator apps                             |
| `TWO_FACTOR_WINDOW`         | `2`          | Time drift tolerance (2 = 60 seconds)                        |
| `TWO_FACTOR_ENCRYPTION_KEY` | `JWT_SECRET` | Must be 32+ characters. Generate with `openssl rand -hex 32` |

{% callout type="warning" title="Security" %}
Use a separate `TWO_FACTOR_ENCRYPTION_KEY` rather than reusing your `JWT_SECRET`. Never commit these keys to version control.
{% /callout %}

---

## How it works

### Setup flow

1. User calls `setup2FA` mutation
2. Server generates a TOTP secret and QR code
3. User scans QR code with their authenticator app
4. User enters the code from the app to verify setup
5. Server enables 2FA and generates 10 backup codes
6. User saves backup codes securely (shown only once)

### Login flow (when 2FA is enabled)

1. User enters email and password
2. Password is validated
3. User is prompted for a 6-digit TOTP code
4. Code is verified (or a backup code is used)
5. Login succeeds

---

## GraphQL API

### Setup 2FA

```graphql
mutation {
  setup2FA {
    secret
    qrCode
    otpauthUrl
  }
}
```

Returns a base64 data URL for the QR code. Display it for the user to scan with their authenticator app.

### Enable 2FA (verify and complete setup)

```graphql
mutation {
  enable2FA(input: { code: "123456" }) {
    success
    backupCodes
  }
}
```

{% callout type="warning" title="Backup codes shown once" %}
The `backupCodes` array is returned only at this step. The user must save them immediately -- they cannot be retrieved again.
{% /callout %}

### Verify 2FA code

```graphql
mutation {
  verify2FACode(input: { code: "123456" })
}
```

Accepts either a TOTP code or a backup code. Backup codes are single-use and deleted after verification.

### Disable 2FA

```graphql
mutation {
  disable2FA(input: { password: "user-password" })
}
```

Requires the user's current password. Clears all 2FA secrets and backup codes.

---

## Frontend integration

### Step 1: Setup 2FA

```typescript
const { data } = await client.mutate({
  mutation: SETUP_2FA_MUTATION,
})

// Display QR code
<img src={data.setup2FA.qrCode} alt="Scan with authenticator app" />

// Or show secret for manual entry
<p>Manual entry: {data.setup2FA.secret}</p>
```

### Step 2: Enable 2FA

```typescript
const code = getUserInputCode()

const { data } = await client.mutate({
  mutation: ENABLE_2FA_MUTATION,
  variables: { input: { code } },
})

if (data.enable2FA.success) {
  // Show backup codes to user
  alert('Save these backup codes:\n' + data.enable2FA.backupCodes.join('\n'))
}
```

### Step 3: Enhanced login flow

```typescript
if (user.twoFactorEnabled) {
  const code = await prompt2FACode()

  const { data } = await client.mutate({
    mutation: VERIFY_2FA_CODE_MUTATION,
    variables: { input: { code } },
  })

  if (data.verify2FACode) {
    // Login complete
  }
}
```

---

## Backup codes

- 10 single-use recovery codes, each 8 hexadecimal characters
- Used when the user loses access to their authenticator app
- Hashed before storage (like passwords)
- Immediately invalidated after use

Encourage users to save backup codes in a password manager or print a physical copy.

---

## Security features

### Encrypted storage

TOTP secrets are encrypted with AES-256-CBC using `TWO_FACTOR_ENCRYPTION_KEY`. Secrets are never stored in plain text.

### Time drift tolerance

The `TWO_FACTOR_WINDOW` setting (default: 2) allows a time drift of plus or minus 60 seconds to account for clock synchronization issues between the server and the user's device.

### Security event logging

All 2FA operations (enable, disable, backup code usage) are logged to the `SecurityEvent` table with IP address and user agent when available.

---

## Database schema

```prisma
model User {
  twoFactorEnabled          Boolean              @default(false)
  twoFactorSecret           String?
  twoFactorRecoveryCodes    String[]
  twoFactorMethod           TwoFactorMethod      @default(NONE)
}

enum TwoFactorMethod {
  NONE
  AUTHENTICATOR
  SMS
  EMAIL
}
```

---

## Troubleshooting

### "Invalid 2FA code" errors

- Check that the server time is synchronized (NTP)
- Increase `TWO_FACTOR_WINDOW` if clocks drift
- Ensure the user enters the current code (refreshes every 30 seconds)

### Lost authenticator access

- Use backup codes for recovery
- An admin can disable 2FA directly in the database if needed

### QR code not scanning

- Ensure the QR code image is large enough
- Check that the `otpauthUrl` format is correct
- Try manual entry of the secret instead
