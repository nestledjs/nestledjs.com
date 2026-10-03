# Output Summary — PIR-134

**Task:** Resolve open Dependabot vulnerabilities (1 critical, 7 high, 5 moderate, 2 low)
**Linear:** https://linear.app/pirate-and-fox/issue/PIR-134
**Plan file:** `agents/plan/plans/2026-07-13-resolve-dependabot-vulnerabilities.md`
**Date:** 2026-07-13

## What the plan does

Drives the 16 open Dependabot alerts (13 `next`, 1 critical `shell-quote`, 1 `postcss`,
1 `js-yaml`) to zero via a lockfile-safe dependency refresh — **no major-version jumps**.

## Key decisions

1. **Next stays on major 15.** Bump `next` `15.5.12 → 15.5.20` (latest 15.x `backport` tag).
   All 13 next alerts are patched at ≤ 15.5.18, so 15.5.20 clears them. Next 16 deliberately
   avoided per the acceptance criteria. `@markdoc/next.js` peer is `next: "*"` → safe.
2. **Transitive fixes via `pnpm.overrides`** (existing repo pattern): add
   `"shell-quote": ">=1.8.4"` (critical; via `concurrently` devDep) and
   `"postcss": ">=8.5.10"` (via next's bundled copy + `@tailwindcss/postcss`).
3. **Raise declared floors** on the two direct deps so vulns can't reappear:
   `next → ^15.5.20`, `js-yaml → ^4.2.0` (4.2.0 already satisfies the old `^4.1.1`), plus
   `eslint-config-next → ^15.5.20` in lockstep.

## Verification

`pnpm build`, `pnpm type-check`, `pnpm lint`, `pnpm audit --audit-level=high`, plus dev-server
spot-check of the docs home, a `/docs/<slug>` page, Markdoc fences, and search.

## No open questions

Acceptance criteria are explicit; no material decisions require human input. Ready for execution.
