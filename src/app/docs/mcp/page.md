---
title: MCP Server
nextjs:
  metadata:
    title: MCP Server
    description: Connect AI assistants to your Nestled app over the Model Context Protocol — server URL, personal API tokens, Claude/Cursor configuration, and OAuth.
---

Nestled ships a built-in [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server, so AI assistants like Claude and Cursor can call your app's tools directly. It runs inside the API service — there is nothing extra to deploy.

---

## Server URL

The MCP server is mounted at `/api/mcp` on your API origin:

```text
{API_URL}/api/mcp
```

- **Local:** `http://localhost:3000/api/mcp`
- **Production:** `https://api.yourdomain.com/api/mcp`

`{API_URL}` is your `API_URL` environment variable (origin only — see [Deployment](/docs/deployment#required-environment-variables)).

---

## Authentication with a personal API token

MCP requests authenticate with a personal API token sent as a bearer token:

```text
Authorization: Bearer <your-token>
```

Any signed-in user can create their own token — it is scoped to that user, not the whole workspace.

**To generate one:**

1. Open **Settings → API Tokens** in the web app.
2. Create a token and give it a name.
3. Copy it immediately — the token is shown **only once** and cannot be retrieved later. If you lose it, revoke it and generate a new one.

Tokens can be given an expiry and revoked at any time from the same page; each token shows when it was last used.

{% callout title="Where the setup snippet comes from" %}
The **Settings → API Tokens** page renders a ready-to-paste MCP config with your server URL already filled in the moment you create a token — the JSON below is exactly what it produces.
{% /callout %}

---

## Connecting Claude

Add the server to your Claude MCP configuration:

```json
{
  "mcpServers": {
    "nestled": {
      "type": "http",
      "url": "https://api.yourdomain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

Replace the `url` with your own `API_URL` origin plus `/api/mcp`, and paste your token into the `Authorization` header. Cursor and other HTTP-based MCP clients use the same URL and bearer-token pattern.

---

## OAuth-capable clients

MCP clients that support OAuth can connect through the built-in OAuth flow instead of a static token — they discover the authorize endpoint under `/api/mcp` and obtain an access token per user. If a user belongs to more than one organization, they are prompted to choose which one the session should act on before the connection completes.

---

## Managing AI & MCP access

Whether AI & MCP features are enabled for an organization is controlled on the **Settings → AI & MCP** page, which is limited to organization **Owners and Admins**. Generating a personal token (above) is available to any member; the org-level settings gate what those connections can reach.
