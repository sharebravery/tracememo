# Contributing to TraceMemo

Thank you for your interest in contributing to TraceMemo.

## Development Environment

- **Node.js**: 22+
- **pnpm**: 10+

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Development watch build (dist/)
pnpm lint             # ESLint checks
pnpm type-check       # TypeScript type checking
pnpm test             # Run unit and adapter test suite
pnpm e2e              # Run WebdriverIO extension smoke test
pnpm build            # Production build
pnpm zip              # Build production ZIP package
```

## Contribution Principles

- **Small and Focused PRs**: Each pull request should address a single logical change or bug fix.
- **Architectural Integrity**: Preserve the local-first, minimal-permission architecture (Global Record + Chain Context).
- **Test Coverage**: Any changes to domain models, scanners, parsers, or permission behaviors must include corresponding unit/integration tests.
- **No Private Keys / Secrets**: TraceMemo is strictly a research notebook and never touches private keys, seed phrases, or RPC credentials.
