# Pipeline Config — nestledjs.com

## Repo

| Field                   | Value                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo_name`             | `nestledjs.com`                                                                                                                                   |
| `framework`             | `nextjs`                                                                                                                                          |
| `github_slug`           | `nestledjs/nestledjs.com`                                                                                                                         |
| `base_branch`           | `develop`                                                                                                                                         |
| `repo_path`             | resolve at runtime with `git rev-parse --show-toplevel` — portable across Mac (`~/IdeaProjects`) and Linux (`~/workspaces`) hosts; never hardcode |
| `flightdesk_project_id` | `443ad943-56e7-4aab-a480-17f3d1c3bd12`                                                                                                            |
| `sdk_command`           | `none`                                                                                                                                            |

## Deployment

| Field            | Value                                                                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto_merge`     | `true` — the adversarial verifier `MERGE` verdict is the approval — pipeline merges + deploys directly (`In Progress` → merge → `Done`), no `In Review` / human `Approved` gate (dangerous mode); see `linear-pipeline.md` → Merge Policy |
| `deploy_command` | `none` — site deploys from develop — merging IS the deploy                                                                                                                                                                                |
| `merge_command`  | `gh pr merge <prNumber> --repo nestledjs/nestledjs.com --merge --delete-branch`                                                                                                                                                           |

## Host — Railway (for Deploy Fixer mapping)

| Field                      | Value                                  |
| -------------------------- | -------------------------------------- |
| `host`                     | `railway`                              |
| `railway_project_name`     | `nestledjs.com`                        |
| `railway_project_id`       | `576400f5-7287-405c-a769-59e171d97c00` |
| `railway_environment_name` | `production`                           |
| `railway_environment_id`   | `e4ed23b3-6524-485c-a592-3d00ce6fdcaf` |

Git-backed services in this project — Deploy Fixer checks **each** one's latest deployment.
Managed plugins (Postgres, Redis) are not git-backed and are not scanned.

| Service         | ID                                     |
| --------------- | -------------------------------------- |
| `nestledjs.com` | `347938c8-608f-41e0-85b0-624d56a48340` |

## Quality Gates

No SonarCloud on this repo — quality gates are the Intelligence Check plus canonical checks only.

## Source System — Linear (Pirate & Fox team)

| Field               | Value                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `source_system`     | `linear`                                                                                                                                         |
| Canonical lifecycle | `https://raw.githubusercontent.com/pirateandfox/qalatra-prompts/develop/linear-pipeline.md` — state IDs, GraphQL patterns, turn-taking, identity |
| `linear_project_id` | `d9676041-30d2-4d01-83db-b87eac96b374` (Nestledjs.com)                                                                                           |
| API token           | `secret get SHI_LINEAR` (authors as Shi)                                                                                                         |
| FD task reference   | the issue's `FlightDesk` attachment                                                                                                              |

This pipeline only processes issues whose Linear project is `d9676041-30d2-4d01-83db-b87eac96b374`. Never mutate issues
routed to other repos.

## Closeout

Approved → merge (= deploy) → archive cloud session → archive FlightDesk task (webhook usually
handles it) → **post the closing comment** → set Linear `Done` **last**, only after cleanup succeeds.

The closing comment is a **required** step and must come **before** `Done` — see _Closeout sequence_
in `linear-pipeline.md`. Observed skipped twice (cashcast PIR-265 2026-08-11, flightdesk PIR-259
2026-08-12): the handler merged, archived, and set `Done` while leaving the issue's last word as the
pipeline's own "I need a decision from you" question, so from Linear alone it read as abandoned. On
PIR-259 it was skipped even though the dispatch prompt named it explicitly — ordering it before
`Done` is the fix, asking for it is not. Verify it landed.
