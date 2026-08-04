# TraceMemo Development Specification

> Start here. This directory is the single handoff package for an AI coding agent.

## 1. Product

**Public working name:** TraceMemo  
**Repository slug:** `tracememo`  
**Tagline:** Private context for every onchain address.

TraceMemo is a local-first Chrome extension for Web3 researchers. It lets a user attach a private label, note, confidence level, and source to an EVM address, then restores that context when the address appears again on supported block explorers.

The name is a working public name, not a completed trademark clearance. Before Chrome Web Store submission, repeat checks for product names, domains, social handles, and relevant trademarks.

## 2. Required project base

Use this repository as the codebase template:

- Repository: `Jonghakseo/chrome-extension-boilerplate-react-vite`
- Pinned commit: `6fde1ace754505c3dc7b7df48d1a619e12aa42c4`
- Template version: `0.5.0`

The upstream repository is archived. Fork or copy the pinned commit into the TraceMemo repository. Do not track upstream `main` automatically. Use the Node.js and pnpm versions already available in the local development environment; do not install, switch, or pin toolchain versions as part of this project.

## 3. Source-of-truth order

Read and follow the files in this exact order:

1. `01-PRD.md` — what to build and what not to build.
2. `02-TECHNICAL-ARCHITECTURE.md` — exact architecture, packages, paths, permissions, and data flow.
3. `03-IMPLEMENTATION-PLAN.md` — the only approved implementation sequence.

When documents conflict, use this priority:

1. MVP exclusions and security rules in the PRD;
2. exact technical decisions in the architecture document;
3. milestone details in the implementation plan.

Do not invent a fourth architecture.

## 4. Non-negotiable MVP rules

- Chrome and Chromium only.
- EVM addresses only.
- Etherscan and BaseScan only.
- Local-first; no account and no backend.
- No wallet connection.
- No private keys, seed phrases, signatures, transactions, balances, or RPC calls.
- No `<all_urls>`.
- No remote JavaScript.
- No analytics.
- No payment system.
- No generic scanning of arbitrary websites.
- No team, graph, monitoring, AI attribution, or public label database.

## 5. Required development order

Implement one milestone at a time:

1. Template cleanup and build baseline.
2. Local record CRUD in the side panel.
3. Etherscan detection and inline context.
4. BaseScan support plus source and confidence workflow.
5. Import/export, privacy copy, tests, and release ZIP.

Do not start the next milestone until the current milestone acceptance criteria pass.

## 6. Required AI completion report

At the end of every coding task, report only:

1. Scope completed;
2. files changed;
3. commands and test results;
4. acceptance criteria status;
5. permission changes;
6. known limitation;
7. next smallest task.

## 7. Package contents

- `01-PRD.md`
- `02-TECHNICAL-ARCHITECTURE.md`
- `03-IMPLEMENTATION-PLAN.md`

