---
title: Deployment
nextjs:
  metadata:
    title: Deployment
    description: Deploy your Nestled application to Railway, Docker, or any cloud provider.
---

Nestled applications are ready to deploy with Docker out of the box. This guide covers Railway (the recommended path), manual Docker deployment, CI/CD with GitHub Actions, and a production checklist.

---

## Railway (recommended)

Railway is the fastest way to deploy a Nestled application. It provides managed PostgreSQL, Redis, and automatic deployments from your Git repository.

### Plan your domains first

Before setting up Railway, decide on your final domain names. This matters because **auth cookies are scoped to the root domain** — both your API and web app must share the same root domain for authentication to work correctly.

The standard pattern is:

- **Web app**: `yourdomain.com` (or `app.yourdomain.com`)
- **API**: `api.yourdomain.com`

Both share `yourdomain.com` as the root, so cookies set by the API are readable by the web app. Using entirely different domains (e.g., `myapp.com` and `myapi.net`) will break authentication.

{% callout title="Use placeholder values to get started" %}
Railway requires `API_URL` and `SITE_URL` to be set before your first deploy. If your custom domain isn't ready yet, use any valid HTTPS URL as a placeholder (e.g., `https://api.example.com`). The app will deploy and you can update these values once your real domains are configured.
{% /callout %}

### Quick setup

1. **Deploy from the Nestled Railway template** — clone the pre-configured template to get Railway services, environment variables, and build commands wired up automatically
2. **Configure environment variables** (see below) — set `API_URL` and `SITE_URL` to your planned domain names (or placeholders)
3. **Configure build settings** (see below) — Railway templates can't set build commands or build environment, so you must do this manually before deploying
4. **Set up custom domains** (see below) — point your real domains at your Railway services
5. **Deploy** — once build settings and domains are configured, trigger a deploy from each service
6. **Update `API_URL` and `SITE_URL`** — replace any placeholder values with your real domains and redeploy

### Build settings (required after template deploy)

Railway templates cannot pre-configure build commands or the build environment, so you need to set these manually for each service.

**For the API service** — go to the service → **Settings** → **Build**:

- Enable **Use Metal build environment**
- Set **Build command** to: `npm run build:api`

**For the web service** — go to the service → **Settings** → **Build**:

- Enable **Use Metal build environment**
- Set **Build command** to: `npm run build:web`

{% callout title="Batch your changes" %}
You can configure build settings and custom domains at the same time before triggering a deploy — no need to deploy between steps. Make all your changes across both services, then hit **Deploy** once on each.
{% /callout %}

### Required environment variables

Set these in your Railway service settings:

| Variable           | Value                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                                                                                                                                                                                                                                                            |
| `PORT`             | `3000` (Railway sets this automatically)                                                                                                                                                                                                                                                                                |
| `JWT_SECRET`       | A strong random string — generate with `openssl rand -hex 64`                                                                                                                                                                                                                                                           |
| `API_URL`          | Your Railway API **origin** (e.g., `https://api.yourdomain.com`) — scheme + host + optional port only. Do **not** include a path or the `/api` suffix; the app appends `/api` itself. An invalid value (a path, or a bare `localhost:undefined`) fails the API at startup rather than producing broken URLs at runtime. |
| `SITE_URL`         | Your Railway web URL (e.g., `https://yourdomain.com`)                                                                                                                                                                                                                                                                   |
| `DATABASE_URL`     | Railway provides this from the PostgreSQL addon — the **pooled** connection your running app queries through                                                                                                                                                                                                            |
| `DIRECT_URL`       | Optional. The **direct** (non-pooled) Postgres URL used by the Prisma CLI for migrations. Not needed by the running app; set it wherever you run `prisma migrate deploy`. See [Database initialization](#database-initialization)                                                                                       |
| `REDIS_URL`        | Railway provides this from the Redis addon                                                                                                                                                                                                                                                                              |
| `TRUST_PROXY_HOPS` | `1` on Railway (Heroku/Fly too), on the **api** service only — number of proxies in front of the API. Required for correct client-IP handling; see [Signup abuse protection](#signup-abuse-protection)                                                                                                                  |

### Email configuration

| Variable            | Value                           |
| ------------------- | ------------------------------- |
| `EMAIL_PROVIDER`    | `smtp`                          |
| `SMTP_HOST`         | Your email provider's SMTP host |
| `SMTP_PORT`         | Usually `587` for TLS           |
| `SMTP_USER`         | Your SMTP username              |
| `SMTP_PASS`         | Your SMTP password              |
| `APP_EMAIL`         | Your app's "from" email address |
| `APP_SUPPORT_EMAIL` | Support email address           |

### Stripe configuration (if using billing)

| Variable                 | Value                                        |
| ------------------------ | -------------------------------------------- |
| `STRIPE_SECRET_KEY`      | Your live Stripe secret key (`sk_live_...`)  |
| `STRIPE_PUBLISHABLE_KEY` | Your live publishable key (`pk_live_...`)    |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signing secret from Stripe dashboard |
| `STRIPE_CURRENCY`        | `usd` (or your currency)                     |

Set up the Stripe webhook endpoint in your Stripe dashboard pointing to `{API_URL}/webhooks/stripe`.

### OAuth configuration (if using social login)

| Variable                     | Value                          |
| ---------------------------- | ------------------------------ |
| `GOOGLE_OAUTH_CLIENT_ID`     | From Google Cloud Console      |
| `GOOGLE_OAUTH_CLIENT_SECRET` | From Google Cloud Console      |
| `GITHUB_OAUTH_CLIENT_ID`     | From GitHub Developer Settings |
| `GITHUB_OAUTH_CLIENT_SECRET` | From GitHub Developer Settings |

Set callback URLs to `{API_URL}/api/auth/google/callback` and `{API_URL}/api/auth/github/callback`.

### Signup abuse protection

The template ships an abuse gate on the **unauthenticated signup surface** — registration, forgot-password, and resend-verification. It combines a per-IP rate limit, optional Cloudflare Turnstile (CAPTCHA), MX-record validation, and disposable-domain blocking. It does **not** affect login or OAuth/SSO sign-in — only the account-creation and password-recovery forms.

#### Trust the proxy (required on Railway)

The rate limit keys on the client IP. Behind Railway's proxy, `TRUST_PROXY_HOPS` **must** be set to `1` on the **api** service — otherwise every visitor appears to share Railway's router IP, and the limit throttles all users together, locking everyone out of register / forgot-password / resend after a few requests. The API logs `[TrustProxy] Trusting 1 proxy hop(s)` at boot; if instead it warns `TRUST_PROXY_HOPS is 0 in production`, it isn't set. (Railway, Heroku, and Fly each put exactly one proxy in front of the API, so `1` is correct.)

#### Cloudflare Turnstile (recommended before opening public signups)

Turnstile is optional — like Stripe, with no key configured it is simply disabled and the widget renders nothing. To enable it, create a widget in the Cloudflare dashboard (**Turnstile → Add widget**, mode **Managed**, and leave **pre-clearance off**) for your web app's hostname, then set **both** keys together:

| Variable                  | Service | Value                                         |
| ------------------------- | ------- | --------------------------------------------- |
| `TURNSTILE_SECRET_KEY`    | api     | Turnstile secret key (server-side siteverify) |
| `VITE_TURNSTILE_SITE_KEY` | web     | Turnstile site key (public)                   |

⚠️ `VITE_TURNSTILE_SITE_KEY` is **build-time** — it is baked into the web bundle via `import.meta.env`, so the web service must **rebuild** to pick it up (Railway rebuilds automatically when the variable changes). If you set the secret on `api` but not the site key on `web` (or the web app hasn't rebuilt), the widget never renders, no token is sent, and **every signup fails validation**. Always set both together.

#### Optional tuning

Sane defaults — leave these unless you need to change them. All on the **api** service:

| Variable                  | Default        | Purpose                                           |
| ------------------------- | -------------- | ------------------------------------------------- |
| `SIGNUP_THROTTLE_ENABLED` | `true` in prod | Master switch for the signup rate limit           |
| `SIGNUP_THROTTLE_LIMIT`   | `3`            | Max signup-surface attempts per window, per IP    |
| `SIGNUP_THROTTLE_TTL`     | `3600`         | Rate-limit window, in seconds                     |
| `SIGNUP_REQUIRE_MX`       | `true` in prod | Reject emails whose domain publishes no MX record |
| `SIGNUP_MX_TIMEOUT_MS`    | `3000`         | MX lookup timeout, in milliseconds                |
| `SIGNUP_BLOCK_DISPOSABLE` | `true`         | Block known disposable-email domains              |

The boolean vars (`SIGNUP_THROTTLE_ENABLED`, `SIGNUP_REQUIRE_MX`, `SIGNUP_BLOCK_DISPOSABLE`) are set with `true` or `false`. "`true` in prod" means the default is on only when `NODE_ENV=production`; set the variable explicitly to override in either direction.

### Storage configuration (if using file uploads)

| Variable           | Value                                    |
| ------------------ | ---------------------------------------- |
| `STORAGE_PROVIDER` | `s3`, `cloudinary`, `imagekit`, or `gcs` |

Then set the provider-specific keys (AWS keys for S3, etc.). Don't use `local` in production — files would be lost on redeploy.

### Build and start commands

Configure Railway to use:

- **Build**: `pnpm install && pnpm build:api && pnpm build:web`
- **Start**: `pnpm start:api` (for the API service) or `pnpm start:web` (for the web service)

### Database initialization

Nestled uses versioned Prisma migrations — not `prisma db push`. This gives you a full audit trail, safe deploys, and a migration history that's committed to git. The setup is a two-phase process: create your first migration locally, then deploy it to production.

**Step 1 — Bootstrap your local database**

Make sure Docker is running, then run the workspace setup generator:

```shell
npx nx g @nestledjs/generators:workspace-setup --name my-app
```

This spins up a local PostgreSQL container and prepares your development environment. The generator refuses non-localhost `DATABASE_URL` values, so do not point `.env` at your Railway database for this step.

**Step 2 — Create your initial migration**

With your local database running, generate your first migration:

```shell
npx prisma migrate dev --name init
```

This creates a versioned migration file under `prisma/migrations/` and applies it to your local database. Commit this file to git — it's the source of truth for your schema history.

**Step 3 — Enable the Railway TCP proxy**

Railway's PostgreSQL database is private by default. To connect from your local machine:

1. Open your PostgreSQL service in Railway
2. Go to the **Settings** tab
3. Under **Networking**, enable the **TCP Proxy**
4. Go to the **Connect** tab and copy the **External** connection URL — it has the TCP proxy host and port pre-filled

**Step 4 — Deploy migrations to production**

Migrations are **not** run automatically on deploy — the Railway build and start commands (`build:api`, `start:api`) only generate the Prisma client and boot the server. Applying migrations is a deliberate step you run whenever your schema changes.

You no longer swap `DATABASE_URL` for this. Instead, set `DIRECT_URL` to the Railway external URL from Step 3 and leave `DATABASE_URL` pointing at your local database:

```text
# .env — DATABASE_URL stays as-is (your local app keeps using it); just add DIRECT_URL
DATABASE_URL="postgresql://prisma:prisma@localhost:5432/prisma"
DIRECT_URL="postgresql://postgres:<PASSWORD>@<TCP_HOST>:<TCP_PORT>/railway"
```

The Prisma CLI prefers `DIRECT_URL` when it's set (see `prisma.config.ts`), so migration commands target Railway while your app keeps using the local `DATABASE_URL`. Apply all pending migrations:

```shell
npx prisma migrate deploy
```

This is the only step you repeat on future schema changes — no more commenting URLs in and out.

Seeding is a one-time bootstrap for a brand-new production database. Unlike the migrate commands, the seed script connects through `DATABASE_URL` directly, so point it at Railway for just that one command:

```shell
DATABASE_URL="postgresql://postgres:<PASSWORD>@<TCP_HOST>:<TCP_PORT>/railway" pnpm prisma:seed
```

{% callout type="warning" title="Never run migrate dev or migrate reset against production" %}
`prisma migrate dev` and `prisma migrate reset` are destructive — they can drop and recreate your database. The template guards against this: `prisma.config.ts` blocks `migrate dev` and `migrate reset` whenever the resolved connection (`DIRECT_URL` if set, otherwise `DATABASE_URL`) is not localhost. Only `prisma migrate deploy` is meant to run against production.
{% /callout %}

You can unset `DIRECT_URL` when you're done — it only affects Prisma CLI commands, never your running app. You can also disable the TCP proxy after running migrations to reduce the attack surface, and re-enable it whenever you need to apply future migrations.

### Custom domains

After deploying, attach your real domains to each Railway service:

1. Open the service in Railway and go to the **Settings** tab
2. Click **Add Custom Domain** under the Custom Domains section
3. Enter your domain (e.g., `api.yourdomain.com`) and set the port to **3000**
4. Railway will show you DNS records to add to your domain registrar

Repeat this for both your API service and your web service.

{% callout title="Cloudflare users" %}
When adding Railway's DNS records in Cloudflare, **do not proxy** (orange cloud) the records for Railway custom domains — set them to DNS-only (grey cloud). Proxying can interfere with Railway's TLS certificate provisioning.
{% /callout %}

Once your domains are live, update `API_URL` and `SITE_URL` in your Railway environment variables to match. Redeploy both services for the change to take effect.

---

## Docker deployment

The template includes a Dockerfile at `.dev/Dockerfile` for containerized deployment.

### Build the image

```shell
docker build -f .dev/Dockerfile -t my-app .
```

### Run the container

```shell
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret-here \
  -e API_URL=https://api.yourdomain.com \
  -e SITE_URL=https://yourdomain.com \
  my-app
```

### Required external services

Your Docker container needs access to:

- **PostgreSQL 15** — the application database
- **Redis** — for GraphQL subscriptions and caching

These should be provisioned separately (managed database services, or your own Docker Compose in production).

---

## CI/CD with GitHub Actions

The template includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs on pushes and PRs to the `develop` branch.

### What the CI pipeline does

1. Checks out code with full git history
2. Sets up pnpm and Node.js with caching
3. Installs dependencies
4. Runs `nx affected -t lint test build` — only tests what changed

An optional SonarCloud scan runs at the end **only when a `SONAR_TOKEN` secret is configured** on the repository. Fresh clones without it pass CI unchanged (the workflow logs that the scan was skipped); add a `SONAR_TOKEN` repository secret to enable code-quality analysis automatically — no workflow edit needed.

### Services

The workflow spins up a PostgreSQL 15 service container for testing with these credentials:

```text
Host: localhost
Port: 5432
User: prisma
Password: prisma
Database: nestled_template_test
```

### Extending for deployment

To add automatic deployment, add a step after the test job:

```yaml
- name: Deploy to Railway
  if: github.ref == 'refs/heads/main'
  run: railway up
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Or for Docker-based deployments:

```yaml
- name: Build and push Docker image
  run: |
    docker build -f .dev/Dockerfile -t registry.example.com/my-app:${{ github.sha }} .
    docker push registry.example.com/my-app:${{ github.sha }}
```

### Stay current with the template in CI

You can also run the [automatic updater](/docs/updates) on a schedule so template security patches and dependency bumps reach you as reviewable pull requests instead of manual work:

```yaml
- name: Check for Nestled template updates
  run: npx @nestledjs/upgrades apply --pr
```

Because `apply` works on a dedicated branch, runs your tests, and opens a PR (rolling back anything that collides with your customizations), it's safe to wire into a scheduled workflow. See [Automatic Updates](/docs/updates) for the full flow.

---

## Production checklist

Before going live, verify each of these:

### Security

- [ ] Set a strong, unique `JWT_SECRET` (at least 64 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS origins to only allow your domain (`SITE_URL`)
- [ ] Set `TWO_FACTOR_ENCRYPTION_KEY` if using 2FA (generate with `openssl rand -hex 32`)
- [ ] Remove or change default seed user credentials

### Database

- [ ] Use a managed PostgreSQL service (not a local container)
- [ ] Run `pnpm prisma db push` or `pnpm prisma:migrate` to initialize the schema
- [ ] Run `pnpm prisma:seed` for initial data (admin user, countries)
- [ ] Set up database backups

### Email

- [ ] Configure a real SMTP provider (SendGrid, AWS SES, Postmark, etc.)
- [ ] Set `EMAIL_PROVIDER=smtp` (not `mock`)
- [ ] Set `APP_EMAIL` and `APP_SUPPORT_EMAIL` to real addresses
- [ ] Verify email deliverability (SPF, DKIM, DMARC records)

### Billing (if using Stripe)

- [ ] Switch to live Stripe keys (`sk_live_...`, `pk_live_...`)
- [ ] Set up the Stripe webhook endpoint: `{API_URL}/webhooks/stripe`
- [ ] Configure webhook events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- [ ] Test the full checkout flow with Stripe test mode first

### Storage (if using file uploads)

- [ ] Use a cloud storage provider (not `local`)
- [ ] Set provider-specific keys and bucket/container names
- [ ] Configure CORS on your storage bucket to allow uploads from `SITE_URL`

### Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor the `/api/uptime` health check endpoint
- [ ] Set up log aggregation
- [ ] Configure alerts for failed deployments and error spikes
