# Contributing to `dashboard/src/app/components/launchpad/namespaces`

This folder is part of Kyrazo, proprietary software owned by Kyrazo LLC. The [repository license](../../../../../../LICENSE) and the [repository contributing guide](../../../../../../CONTRIBUTING.md) apply here.

Do not use, copy, or change anything in this folder unless Kyrazo LLC has given you written permission. That rule covers commercial use and non-commercial use. A pull request is not permission, and it does not give you a license to the code. Write to [legal@kyrazo.com](mailto:legal@kyrazo.com).

## This folder

This folder holds namespaces, the routing boundary a customer's events belong to for the Angular dashboard.

- Branch from `develop` and open the pull request against `develop`.
- Keep the diff inside `dashboard/src/app/components/launchpad/namespaces` unless the change cannot work without a neighboring folder.
- Match the style of the files already in this folder.
- Do not commit secrets, credentials, or `.env` files.

## Checks

This folder has no script of its own. From `dashboard`:

```bash
bun run test
bun run build
```

## Nearby docs

- [README for this folder](README.md)
- [Parent folder](../README.md)
- [Repository contributing guide](../../../../../../CONTRIBUTING.md)
