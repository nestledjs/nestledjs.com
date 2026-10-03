---
title: AI Docs
nextjs:
  metadata:
    title: AI Docs
    description: The ai-docs folder contains AI-readable references — style guide, Storybook best practices, and more — that help coding assistants follow your project's conventions.
---

Nestled includes an `ai-docs/` folder at the root of your project. This folder contains reference documents written specifically for AI coding assistants — style conventions, best practices, and patterns that help tools like Claude Code, Cursor, and Copilot produce code that matches your project's standards.

---

## Why a dedicated folder

AI coding assistants work best when they have access to clear, structured guidelines. Rather than scattering these across README files or inline comments, the `ai-docs/` folder gives you a single place to maintain all the context your AI tools need.

You should reference these files from your `CLAUDE.md`, `agents.md`, `.cursorrules`, or whatever configuration your AI tool uses. For example, in a `CLAUDE.md`:

```markdown
## References

Read these files for project conventions:

- `ai-docs/STYLEGUIDE.md` — UI design system and Tailwind conventions
- `ai-docs/STORYBOOK_STORIES_BEST_PRACTICES.md` — how to write Storybook stories
```

This way, every AI session starts with the right context without you having to repeat instructions.

---

## Included files

### STYLEGUIDE.md

Describes your UI conventions — colors, typography, spacing, surfaces, components — using Tailwind class names the AI can copy directly into code. Ships with sensible defaults (dark UI, emerald brand color, zinc neutrals).

| Element       | Default                                                 |
| ------------- | ------------------------------------------------------- |
| Base palette  | `zinc` (dark backgrounds, light text)                   |
| Brand color   | `emerald` (primary actions and accents)                 |
| Accent colors | `sky`, `fuchsia` (hero gradients, sparingly)            |
| Surfaces      | `bg-white/5` with `border-white/10` and `backdrop-blur` |
| Headlines     | `font-extrabold tracking-tight`                         |
| Body text     | `text-zinc-300`                                         |

The style guide covers:

- **Color system** — brand color, neutrals, accent colors, state colors
- **Surfaces and elevation** — panel styles, card styles, backdrop blur
- **Typography** — headline sizing, body text, small/meta text
- **Layout and spacing** — page containers, content widths, padding
- **Motion** — transition preferences, animation guidelines
- **Components** — button styles, badges, cards
- **Accessibility** — contrast and focus requirements

### STORYBOOK_STORIES_BEST_PRACTICES.md

Captures conventions for writing Storybook 9 stories with Vitest. Covers import patterns, typing, file naming, the `play` function for interaction tests, and a full example template. When an AI assistant writes or updates a story, this file ensures it follows the same patterns as the rest of the project.

---

## Customizing the style guide

Open `ai-docs/STYLEGUIDE.md` and edit it to match your brand. For example, to switch from a dark theme with emerald accents to a light theme with blue accents:

```markdown
## Color System (Tailwind classes)

- Neutral (base): `slate`
  - Backgrounds: `bg-white`, panels: `bg-slate-50`, borders: `border-slate-200`
  - Text: primary `text-slate-900`, body `text-slate-600`, muted `text-slate-400`
- Brand (primary): `blue`
  - Primary actions: `bg-blue-600 hover:bg-blue-700`
  - Emphasis text/accents: `text-blue-600`
```

Then ask your AI assistant to apply the changes:

> "Update all components to follow the new style guide"

Or target specific areas:

> "Apply the style guide colors to the settings pages"

---

## Adding your own docs

You can add any Markdown file to `ai-docs/` that would help an AI assistant write better code for your project. Good candidates:

- API conventions (naming, error handling, response shapes)
- Testing patterns beyond Storybook
- Code review standards
- Domain-specific terminology

Keep each file concise and scannable — AI assistants work best with clear, structured guidelines. After adding a file, update your `CLAUDE.md` or equivalent to reference it.
