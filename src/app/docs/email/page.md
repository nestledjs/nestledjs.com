---
title: Email
nextjs:
  metadata:
    title: Email
    description: Configure SMTP email for development and production — Mailhog, Mailtrap, SendGrid, AWS SES, and custom templates.
---

Nestled includes a built-in email service that supports multiple providers. In development, use a local mail catcher to preview emails without sending them. In production, plug in your SMTP provider of choice.

---

## Development setup

### Option A: Mailhog (recommended)

Mailhog is already included in the Docker Compose stack. When you run `pnpm dev`, it starts automatically.

```shell
# If running standalone:
brew install mailhog
mailhog
```

Then in your `.env` file:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
```

Access the Mailhog UI at [http://localhost:8025](http://localhost:8025) to view captured emails.

### Option B: Mailtrap

[Mailtrap](https://mailtrap.io) is a cloud-based email testing service. Sign up for a free account, copy your SMTP credentials from the inbox settings, and update your `.env` file.

### Option C: Disable email

The application still works without email, but users will not receive verification or password reset emails.

---

## Production setup

Configure your `.env` file with real SMTP credentials:

```env
# SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

```env
# AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
```

{% callout title="Restart required" %}
After changing `.env` variables, restart the API server for the changes to take effect.
{% /callout %}

---

## Email templates

Templates are located in `libs/api/integrations/src/lib/email/templates/`. Each template is a TypeScript file that exports a `TemplateDefinition` object containing template metadata, subject line (with Handlebars variables), HTML template, plain text fallback, and required/optional variables.

The built-in templates:

| Template                         | Purpose                      |
| -------------------------------- | ---------------------------- |
| `email-verification.template.ts` | Verify email addresses       |
| `password-reset.template.ts`     | Password reset requests      |
| `password-changed.template.ts`   | Password change notification |
| `welcome.template.ts`            | Welcome email for new users  |

### Creating a new template

1. Create a new file in `libs/api/integrations/src/lib/email/templates/`
2. Import the `TemplateDefinition` interface
3. Export your template following the existing pattern
4. Import and add it to the `EMAIL_TEMPLATES` map in `index.ts`

Templates are compiled into the JavaScript bundle -- no file copying or runtime file reading needed.

---

## Troubleshooting

- **Check API logs** -- the API logs template loading and any errors
- **Test SMTP connection** -- the email service has a `testConnection()` method
- **Use Mailhog for development** -- captures all emails locally without sending them
- **Rebuild after template changes** -- templates are part of the compiled code, so run `npx nx build api` after modifying them
