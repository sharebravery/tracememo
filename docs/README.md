# TraceMemo Development Specification

> Reference documentation for the TraceMemo Chrome Extension project.

## 1. Product

**Public working name:** TraceMemo  
**Repository slug:** `tracememo`  
**Tagline:** Private context for every onchain address.

TraceMemo is a local-first Chrome extension for Web3 researchers. It lets a user attach private labels, tags, a global note, and independent chain context (chain-level note, confidence level, and source links) to EVM addresses across block explorers and web pages, and restores that context when the address appears again.

## 2. Core Principles & Architecture

- **Single Global Record**: One unified record per canonical address key (`evm:<address>`) holding a shared label, tags, and global note.
- **Independent Chain Contexts**: Known block explorers provide chain-specific context (note, confidence, sources) without assuming contracts or addresses behave identically across chains.
- **Supported Explorers**:
  - Etherscan (`etherscan.io`, Ethereum Mainnet, chain id 1)
  - BaseScan (`basescan.org`, Base, chain id 8453)
  - PolygonScan (`polygonscan.com`, Polygon, chain id 137)
  - BscScan (`bscscan.com`, BNB Smart Chain, chain id 56)
  - Arbiscan (`arbiscan.io`, Arbitrum One, chain id 42161)
- **Generic Page Scanning**: On-demand EVM address scanning via toolbar action (`activeTab` + `scripting`). Generic pages display global records without guessing a chain.
- **Always-Scan Permissions**: Explicit per-origin opt-in via optional host permissions.
- **Local-First**: All data is stored in IndexedDB on the device. No servers, no accounts, no cloud sync, no telemetry.
- **No Wallet Interaction**: No `window.ethereum`, no private keys or seed phrases, no signatures, and no RPC calls.

## 3. Documentation Structure

1. `01-PRD.md` — Product requirements, user flows, and scope boundaries.
2. `02-TECHNICAL-ARCHITECTURE.md` — Technical architecture, monorepo structure, message protocols, and security rules.
3. `03-IMPLEMENTATION-PLAN.md` — Implementation milestones and development history.
4. `RELEASE-CHECKLIST.md` — Release hardening and manual verification checklist.
5. `privacy.md` — Privacy policy and permission disclosures.
6. `store-listing.md` — Chrome Web Store listing metadata and store disclosures.
