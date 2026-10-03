---
title: Upgrade Notes
nextjs:
  metadata:
    title: Upgrade Notes
    description: How the Nestled starter template tracks upstream changes — intent-based upgrade notes that ship inside every clone, where to find them, and how to read them.
---

The starter template does not ship a traditional changelog. Instead, every upstream change that downstream projects should review is recorded as an **upgrade note** — a small YAML file that describes the _intent_ of a change, not just its diff. Because your cloned project will diverge from the template over time, intent-based notes let you (and coding agents) decide whether to adapt a change, bump a dependency, skip it, or supersede it — rather than blindly applying a patch.

This is separate from the [generators changelog](/docs/generators-changelog), which tracks published versions of the `@nestledjs/generators` npm package. Upgrade notes track changes to the **template itself**.

## Where to find them

Upgrade notes live in your project at:

```text
.nestled-updates/upgrade-notes/*.yaml
```

Each file is date-prefixed with a stable slug, so the directory reads as a chronological history:

```text
.nestled-updates/upgrade-notes/
  2026-05-17-auth-delay-csprng.yaml
  2026-05-25-api-token-mcp-settings.yaml
  2026-06-21-auth-redirect-loop-circuit-breaker.yaml
  2026-07-04-consolidate-generators.yaml
  README.md
```

The `workspace-setup` generator deliberately preserves `.nestled/` and `.nestled-updates/` when it renames a fresh clone, so this history stays intact for the life of your project. To see what has changed since you last upgraded, sort the directory by date and read forward from your last-applied note.

## Anatomy of a note

Every propagating note carries the same core fields:

| Field      | Purpose                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `id`       | Matches the filename without `.yaml`.                                    |
| `title`    | One-line summary of the change.                                          |
| `priority` | `high` / `normal` / `ignore` (see below).                                |
| `area`     | Subsystem touched — `auth`, `api`, `admin`, etc.                         |
| `type`     | `security`, `feature`, `deps`, `fix`, …                                  |
| `delivery` | How the change should propagate — see [Delivery modes](#delivery-modes). |
| `intent`   | What the change should accomplish in your project.                       |
| `why`      | The reasoning, so you can judge whether it applies to you.               |

Recommended fields sharpen how a note is applied:

- **`affectedPaths`** — hints at which files are involved (treat as pointers, not exact patch targets, since your project may have diverged).
- **`skipIf`** — conditions under which the note does not apply to you (e.g. "project has custom auth with documented expiry enforcement").
- **`verification`** — commands to run after applying, such as `pnpm lint`, `pnpm test`, or `pnpm build:api`.
- **`agentHints`** — guidance for a coding agent adapting the change.

## Delivery modes {% #delivery-modes %}

The `delivery` field tells you _how_ to bring a change into your project:

- **`code-patch`** — Adapt files in your own repository to match the note's `intent`. Use the described behavior as the target; don't assume your files are byte-identical to the template.
- **`package-release`** — The change lives in a published Nestled package (`@nestledjs/data-browser`, `@nestledjs/shared-components`). Update the dependency version in `package.json` and your lockfile; **do not** copy source out of the package.
- **`hybrid`** — Do the package update first, then adapt local source. Used when a published package changed _and_ template app usage around it changed.

{% callout title="priority: ignore" %}
A note marked `priority: ignore` is a historical or decision record, not an actionable update. It exists for context — do not apply a patch, bump packages, or block your upgrade on it.
{% /callout %}

## Applying an upgrade

The fastest path is the automated updater — see [Automatic Updates](/docs/updates). Run `npx @nestledjs/upgrades apply` and it pulls every change that's new to your project onto a branch, applies clean patches with a 3-way merge, runs your tests, and commits (or opens a pull request). Anything that collides with code you've customized is rolled back and reported as **blocked**, with the note's `intent` as your guide to adapting it by hand or handing it to a coding agent.

You can also apply notes manually: read forward from your last-applied note, apply or adapt each one per its `delivery` mode, honor any `skipIf`, and run the listed `verification` commands. Either way, the notes themselves are the contract — they carry everything you need to apply a change.

The full authoring contract for these notes lives in your project at `.nestled-updates/UPGRADER-CONTRACT.md`.
