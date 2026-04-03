# Kyrazo SDKs

Welcome to the Kyrazo SDKs repository! This directory hosts the official server-side software development kits (SDKs) used to interact with the Kyrazo API.

## Available SDKs

We officially support the following languages and runtimes:

- 🟨 **[JavaScript / TypeScript](./javascript/)**

  ```bash
  npm install @kyrazolabs/kyrazo
  # or
  bun add @kyrazolabs/kyrazo
  ```

- 🟦 **[Python](./python/)**

  ```bash
  pip install kyrazo
  # or
  poetry add kyrazo
  ```

- 🟦 **[Go](./go/)**
  ```bash
  go get github.com/kyrazolabs/sdks/go
  ```

## Development and Architecture

Our SDKs rely heavily on code generation. The core logic, models, and endpoints are derived directly from the OpenAPI spec.

### CI/CD Pipelines

Our SDKs contain robust continuous integration pipelines located under `.github/workflows/`:

- **JavaScript & Python CI**: Automatically type-check, lint (ESLint, Ruff, Mypy), and run unit tests (Vitest, Pytest) on the `develop` branch before merging.
- **Go CI**: Compiles, runs tests with race detection, and ensures the codebase complies with `golangci-lint` on the `develop` branch.
- **Publishing**: Dedicated publish workflow files manage the deployment of the SDKs to their respective package managers (npm, PyPI) upon tagging/releasing.

### Testing

Each SDK implements specialized tests:

- **Client Mocking**: We mock our own HTTP interactions to reliably test SDK logic (like Retries, API error parsing, and rate limiting) without needing a live backend.

## Contributing

We welcome community feedback! If you find a bug, please create an issue.

For more detailed language-specific instructions, please refer to the `CONTRIBUTING.md` files located within each language's directory.
