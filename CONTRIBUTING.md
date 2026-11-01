# Contributing

Thanks for helping out with BuildTheEarth's web projects. If you are unsure about anything, ask on the [Discord](https://go.buildtheearth.net/dc) first.

For local setup (Node, Yarn, env files, database), see the [README](README.md).

## Branches

- `main` is the only long-lived branch and is in a releasable state
- Create a short-lived branch from `main` for each piece of work:

  ```
  <type>/<app>-<short-description>[-<issue>]
  ```

  Examples: `fix/dashboard-apply-errors-123`, `feat/frontend-legal-pages-87`, `chore/worker-deps`

- `<type>` is one of the commit types below. `<app>` is one of `dashboard`, `frontend`, `api`, `worker`, `db`, `shared` or `mono`.
- Urgent fixes use the `hotfix/` prefix instead of `fix/`. See [Hotfixes](#hotfixes).
- Delete the branch after it is merged.

## Commits and pull request titles

We use [Conventional Commits](https://www.conventionalcommits.org/) with an emoji after the colon:

```
type(scope): emoji description
```

- **type**: `feat`, `fix`, `chore`, `ci`, `build`, `docs`, `refactor`
- **scope**: the app or package being changed, e.g. `dashboard`, `frontend/db`, `api/claims`, or `mono` for changes across several apps
- Examples: `fix(dashboard/apply): 🐛 Return application errors instead of throwing`, `ci(api): 💚 Fix wrong env var in api build`

Pull requests are **squash-merged**, so the **PR title** becomes the commit message on `main`. Write the PR title in this format, even if your individual commits are messier.

## Issues

Use the issue forms.

- **Bug report**: something is broken or behaves unexpectedly.
- **Feature request**: something new you would like to see.

Every new issue gets `needs-triage`.

| Label             | Meaning                                             |
| ----------------- | --------------------------------------------------- |
| `needs-info`      | Waiting for the reporter to add details             |
| `ready-for-agent` | Fully specified; can be picked up by an AI or human |
| `ready-for-human` | Needs a person to implement it                      |
| `wontfix`         | Will not be actioned (a reason is always given)     |

To work on an issue, comment or assign yourself so others know it is taken.

## Pull requests

1. Open the PR as a **draft** while it is still in progress.
2. Fill in the PR template. Link the issue with `Closes #<number>` so it closes on merge.
3. Describe how a reviewer can check the change. We do not require automated tests for every change, so a short manual "how to verify" is important.
4. Mark the PR ready for review. One approving review is required before merging.
5. Address review comments. Force-pushing your own branch is fine.

Keep PRs small. One issue, one branch, one PR is the goal.

## Hotfixes

Use a hotfix for a bug that is breaking a released app and cannot wait for the normal flow.

1. Branch from `main`: `git switch -c hotfix/<app>-<short-description>`. Keep the change as small as possible.
2. Open the PR as usual, with a `fix(<app>): 🐛 …` title and the word "Hotfix" at the top of the description.
3. One approving review is still the default. If no reviewer is available in time, a maintainer with bypass rights may merge without one. Say so in the PR.
4. After the merge, release a patch from an up-to-date `main` (see [Releases](#releases)).

Because `main` is always releasable, a hotfix can be released straight from `main`. If `main` has unreleased work that is not ready to ship, ask on Discord before hotfixing.

## Working with AI agents

AI coding agents are welcome if a human stays responsible for the result. The detailed rules for agents are in [`AGENTS.md`](AGENTS.md) and [`docs/agents/`](docs/agents/). In short:

- Agents only pick up issues labelled `ready-for-agent`.
- An agent claims its issue by assigning itself before starting work.
- Changes are left uncommitted until a human has checked them.
- Agent-authored PRs are opened as drafts, and a human reviews and merges them.
- Agents do not write automated tests in this repository. Verification is done by a person, described in the PR.

## Releases

Releases are per app. Only version tags (`dashboard-vX.Y.Z`, `frontend-vX.Y.Z`, `worker-vX.Y.Z`, `api-vX.Y.Z`) trigger the Docker image builds in `.github/workflows/`. Merging to `main` builds and deploys nothing on its own.

```bash
yarn app:release dashboard patch --push
```

This bumps the app's version, commits it as `chore(<app>/release): bump …` and creates a tag such as `dashboard-v1.3.2`. Only tag from a clean working tree on an up-to-date `main`.

## Code style

- TypeScript only.
- Formatting is done with Prettier (`yarn prettier`). Match the style of the code around your change.
- Follow the existing structure of the apps.

## Security

Please do not report security vulnerabilities in public issues. Use GitHub's private vulnerability reporting (the "Report a vulnerability" button under the repository's **Security** tab).
