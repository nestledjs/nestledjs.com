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

### Quick setup

1. **Create a Railway project** from the Nestled Railway template (link coming soon) or create a new project manually
2. **Add services**: PostgreSQL and Redis from the Railway marketplace
3. **Connect your repository**: Point Railway at your GitHub repo
4. **Configure environment variables** (see below)
5. **Deploy** — Railway builds and deploys automatically on push

### Required environment variables

Set these in your Railway service settings:

| Variable       | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| `NODE_ENV`     | `production`                                                  |
| `PORT`         | `3000` (Railway sets this automatically)                      |
| `JWT_SECRET`   | A strong random string — generate with `openssl rand -hex 64` |
| `API_URL`      | Your Railway API URL (e.g., `https://api.yourdomain.com`)     |
| `SITE_URL`     | Your Railway web URL (e.g., `https://yourdomain.com`)         |
| `DATABASE_URL` | Railway provides this from the PostgreSQL addon               |
| `REDIS_URL`    | Railway provides this from the Redis addon                    |

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

After your first deploy, run the database setup:

```shell
# Via Railway CLI or Railway shell
pnpm prisma db push
pnpm prisma:seed
```

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
