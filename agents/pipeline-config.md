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

| Field            | Value                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auto_merge`     | `true` — the adversarial verifier `MERGE` verdict is the approval; the pipeline merges + deploys directly with no human approval gate (dangerous mode) |
| `deploy_command` | `none` — site deploys from develop — merging IS the deploy                                                                                             |
| `merge_command`  | `gh pr merge <prNumber> --repo nestledjs/nestledjs.com --merge --delete-branch`                                                                        |

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

## Source System

FlightDesk is the source of truth for task state (D23). This folder's agent never writes status,
comments or state changes to Linear; the FlightDesk turn (`flightdesk turn end`) reports the
outcome and FlightDesk advances the task. The Linear project for this repo
(`d9676041-30d2-4d01-83db-b87eac96b374`, Nestledjs.com) is read-only context.
