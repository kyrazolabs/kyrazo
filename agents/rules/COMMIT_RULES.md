# Commit Message Rules (Conventional + Our Scopes)

We use this format:  
`type(scope): short description (max 72 chars)`

## Allowed Types

- **feat** → new feature
- **fix** → bug fix
- **refactor** → code change, no behavior change
- **perf** → performance improvement
- **style** → formatting, missing semi-colons, etc
- **test** → adding or fixing tests
- **docs** → documentation only
- **chore** → maintenance tasks, deps, config
- **build** → build system, docker, ci scripts
- **ci** → ci/cd pipeline changes
- **revert** → revert previous commit

## Backend Repo Scopes

dashboard • integration • ingest • ingestor • orchestrator • agent • worker • core • auth • payment • notification

## Client Repo Scopes (Angular SSR/CSR)

ui • api • server • components • services • shared • layout • auth • dashboard

## Docs Repo Scopes

api • guide • sdk • changelog • faq

## SDKs Repo Scopes

node • go • python • ruby • java • php • deno • browser

## Examples

feat(dashboard): add revenue trend chart with zoom
fix(ingest): handle 429 rate limit from payment provider
refactor(agent): extract retry logic to shared util
test(worker): add integration test for failed job recovery
docs(api): update webhook payload examples
chore(deps): bump typescript 5.6 → 5.7
ci(pipeline): add parallel e2e matrix strategy

Keep it imperative: "add" not "added", "fix" not "fixed"
