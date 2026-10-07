# Zettel

**A sharper way to move work forward.** A local-first workspace for tickets, projects, and the next thing you want to ship.

**Status: early runnable preview; this branch contains verified `0.1.0-alpha.3` installer candidates.** The published preview remains `0.1.0-alpha.2`. The repository contains a React web application, a SQLite localhost service, an Electron desktop build, and an MCP bridge. See the [alpha.3 installer evidence and remaining gates](docs/releases/0.1.0-alpha.3.md), [published preview record](docs/release-preview.md), [installer guide](docs/desktop-installers.md), and [verification record](docs/verification.md). This is not an enterprise-ready release or a full Linear/Coda alternative.

## What the preview contains

- Tickets with a list and board, search and filters, priorities, labels, dates, estimates, assignees, parent tickets, dependencies, and comments.
- Projects, cycles, linked text notes, an overview, and basic delivery progress.
- Browser storage on this device, or SQLite storage through the local service and desktop app; validated JSON backup import/export.
- Optional local AI ticket proposals with review before saving, and MCP tools for reading and updating local work. Provider contracts are tested with a stub; actual provider setup remains your choice.
- An original visual identity and public landing page with explicit availability and proposed pricing.

The preview is a **single-user local workspace**. Assignee names are descriptive fields, not accounts or permissions. Browser and SQLite workspaces are separate; export/import moves data between them. There is no automatic cloud sync, team collaboration, or included AI service. Keep regular exports: clearing browser site data removes browser work.

## Run the web app from source

Use **Node 24 LTS** (see `.nvmrc`) and npm. From this checkout:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`, and choose **Start your workspace**. Start fresh or load the clearly labeled example workspace. Create a project, add a ticket, and move it through the workflow. **Settings & backups** contains export and import controls.

This development server uses browser storage unless the same origin exposes the Zettel local API. A different browser, hostname, or port has a different browser workspace. A production web deployment also has its own browser storage context. The published web preview is [zettel-iota.vercel.app](https://zettel-iota.vercel.app/), with the workspace at [/app](https://zettel-iota.vercel.app/app). Dated verification results are in the release record.

## Run with local SQLite storage

```sh
npm ci
npm run build
npm start
```

Open the workspace URL printed in the terminal, normally `http://127.0.0.1:4589/app`. The service binds to this computer only and stores the workspace under `~/.zettel/` by default. It is not a shared team server.

For paths, configuration, backup/recovery, optional AI, and MCP client setup, read the [local runtime guide](docs/local-runtime.md). Never commit provider keys or service connection files.

## Run or package the desktop app

With dependencies installed:

```sh
npm run desktop
```

This builds the web app and desktop runtime, then launches Electron. Source development requires Node and npm; a successfully packaged GUI includes its own runtime. Desktop and the standalone service share the default SQLite location on this computer. Export before experimenting with another build or data directory.

The convenience packaging command produces a **macOS Apple silicon DMG and ZIP**:

```sh
node scripts/license-notices.mjs
npm run desktop:package
```

Artifacts are written under `release/`. Run `npm run desktop:verify`, then `node scripts/record-desktop-candidate.mjs` to exercise the actual packaged bytes and record checksums. The [desktop workflow](.github/workflows/desktop.yml) also builds and verifies macOS Intel, Windows x64 NSIS, and Linux x64 AppImage candidates. The [installer guide](docs/desktop-installers.md) describes exact coverage, commands and platform prerequisites. Configuration alone does not establish platform support. Only advertise a download after reviewing its installation evidence. Publisher signing and notarization remain unavailable; these are developer candidates.

## Development checks

```sh
npm run build
npm test
npx --no-install playwright install chromium
npm run test:e2e
npm run desktop:build
python3 scripts/validate.py
```

`npm run build` typechecks and builds the web app. `npm test` exercises schema validation, browser storage contracts, SQLite persistence/conflicts, localhost boundaries, AI proposal validation, and an actual MCP SDK client handshake. `test:e2e` runs the current browser workflow suite in Chromium; Linux hosts may need Playwright's `--with-deps` installation option. `desktop:build` bundles the Electron main/preload and standalone service/MCP entries; it does not package or launch them. The Python check validates repository conventions, not application behavior. Use Python 3.11 or newer for that separate check.

The [application workflow](.github/workflows/app.yml) runs application checks on Node 24. The desktop workflow produces candidates without publishing releases. Passing these checks does not replace rendered workflow, installation, recovery, or security verification.

Browser tests start their own server and refuse to reuse an occupied port. Set `ZETTEL_TEST_PORT=4187` (or another free port) if another checkout is using the default 4173.

## Product direction and business model

The first experience is a useful local workspace for independent makers and small software teams. The full ambition remains a work operating system with collaborative documents, relational tables, automation, advanced delivery planning, and customer-controlled enterprise deployment. [Product research](docs/product-research.md), the [capability ledger](docs/research/capability-ledger.md), and the [delivery plan](docs/delivery-plan.md) preserve that broader scope.

The preview and local core are free. **No paid offer or checkout is active.** This branch's landing page presents the available free desktop preview; the earlier $49 official update/support idea remains a research hypothesis. The [updated research](docs/research/2026-10-07-desktop-market.md) and [launch playbook](docs/launch-playbook.md) compare optional paid services against that one-time offer, with explicit discovery and economic tests. Payments, activation, terms, signing, hosted collaboration, and recurring services need separate implementation and validation. Existing [Apache-2.0](LICENSE) source rights remain unchanged. The [market strategy](docs/market-strategy.md) retains the full product ambition.

## Contribute

Work in scoped issues with a user outcome, acceptance criteria, and verification steps. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [AGENTS.md](AGENTS.md), and [ADR 0001](docs/decisions/0001-local-first-runtime.md). Current implementation coordination is [issue #9](https://github.com/microyee-ai/zettel/issues/9).

The authoritative repository for this implementation is [microyee-ai/zettel](https://github.com/microyee-ai/zettel). Shared governance and agent roles live in [zinnober-haus](https://github.com/zinnoberHaus/zinnober-haus); product decisions remain here. The [brand guide](docs/brand.md) covers the original visual system.

Licensed under [Apache-2.0](LICENSE).
