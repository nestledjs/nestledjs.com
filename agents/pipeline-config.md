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
handles it) → set Linear `Done` **last**, only after cleanup succeeds.
