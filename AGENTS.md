## Agent skills

### Issue tracker

GitHub issues tracked via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role triage labels (`needs-triage`, `needs-info`, `ready-for-dev`, `ready-for-ai`, `wontfix`). See `docs/agents/triage-labels.md`.

### Version Control

GitHub repository via `git`. Also using GitHub issues, see `docs/agents/issue-tracker.md`.
Commit messages must use conventional commits with emojis (`type(scope): emoji description`).

### Domain docs

Single-context (`GLOSSARY.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.

### Tests

Never write tests for any code. Instead, let the user verify changes before commiting them.
