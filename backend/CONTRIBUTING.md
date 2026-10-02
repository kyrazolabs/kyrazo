# Contributing to `backend`

This folder is part of Kyrazo, proprietary software owned by Kyrazo LLC. The [repository license](../LICENSE) and the [repository contributing guide](../CONTRIBUTING.md) apply here.

Do not use, copy, or change anything in this folder unless Kyrazo LLC has given you written permission. That rule covers commercial use and non-commercial use. A pull request is not permission, and it does not give you a license to the code. Write to [legal@kyrazo.com](mailto:legal@kyrazo.com).

## This folder

The Kyrazo backend receives webhooks, stores them, and delivers them. It is split into HTTP APIs, long-running services, worker runtimes, a shared library, and infrastructure config.

- Branch from `develop` and open the pull request against `develop`.
- Keep the diff inside `backend` unless the change cannot work without a neighboring folder.
- Match the style of the files already in this folder.
- Do not commit secrets, credentials, or `.env` files.

## Checks

This folder has no package script of its own. Run the checks for the package that owns the change.

## Nearby docs

- [README for this folder](README.md)
- [Repository README](README.md)
- [Repository contributing guide](../CONTRIBUTING.md)
