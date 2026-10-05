# Preview release record: 0.1.0-alpha.2

Prepared 2026-10-05. **Status: alpha.1 published; alpha.2 visual refresh verified locally and being packaged.** The web preview is [zettel-iota.vercel.app](https://zettel-iota.vercel.app/). Publication and packaged-runtime evidence is recorded separately below; neither this document nor configured CI establishes product readiness.

## User-visible changes

Alpha.2 replaces the pastel visual system with a charcoal interface, locally bundled Inter Variable, compact navigation and rows, restrained status colors, and a more useful overview with overdue/blocked counts and current-cycle progress. The landing page now centers a substantial interactive sample workspace with list/board switching and ticket selection. Mobile navigation gains a dismissible backdrop and Escape handling. Existing storage and backup formats are preserved. [Design rationale](brand.md) and [current reference evidence](research/visual-direction-2026-10-05.md) explain the choices.

This is Zettel's first runnable local-work preview. It adds a branded landing page; a browser workspace with tickets, projects, cycles, notes, and basic delivery views; a shared work model; SQLite persistence for localhost and desktop; backup transfer; optional AI proposal review; and a stdio MCP bridge. The product is intended to begin with independent makers and small software teams while retaining the full [enterprise and programmable-workspace ambition](product-research.md).

The workflow starts with an empty workspace or an explicitly chosen sample project. Tickets can capture a status, priority, project, cycle, assignee name, due date, estimate, labels, dependencies, parent ticket, and comments. These are local work records. They do not imply shared accounts, permission enforcement between team members, realtime collaboration, or automatic device sync.

## Availability record

| Deliverable | Current evidence/status | Publication requirement |
| --- | --- | --- |
| Source checkout | Implementation exists in this repository; source-run commands are in [README](../README.md) | Record the exact source revision for any release |
| Web deployment | [Landing](https://zettel-iota.vercel.app/) and [app](https://zettel-iota.vercel.app/app) published; alpha.1 independently verified, alpha.2 publication pending | Record deployment revision and repeat live smoke after restyle |
| macOS Apple silicon ZIP | [Alpha.1 published](https://github.com/microyee-ai/zettel/releases/tag/v0.1.0-alpha.1); alpha.2 packaging pending | Alpha.1 launch/create/restart/MCP/export/reset/restore passed; new artifact must repeat checks |
| macOS Intel ZIP | Candidate CI matrix configured; no successful run or install claimed | Run URL and independently exercised install/launch/restart evidence |
| Windows x64 installer | Candidate CI matrix configured; no successful run or install claimed | Run URL, installer behavior, launch/restart, data paths, signing state |
| Linux x64 AppImage | Candidate CI matrix configured; no successful run or install claimed | Run URL, tested distribution/prerequisites, launch/restart, desktop integration behavior |
| Signed official desktop distribution | Not established | Publisher signing, macOS notarization where applicable, update and recovery verification |
| Paid desktop license / hosted teams | Not available | Payment, entitlement, policy and service gates in the delivery plan |

Do not add speculative download URLs. A temporary Actions artifact is a build candidate with retention limits; it is not automatically a supported public release. Candidate builds are produced without publisher signing credentials. An ad-hoc platform signature, if produced by the packager, is not a verified publisher signature or macOS notarization.

## Reproduce the builds

Use Node 24 LTS and the committed npm lockfile:

```sh
npm ci
npm run build
npm test
npm run desktop:build
node scripts/license-notices.mjs
```

Outputs:

| Path | Purpose |
| --- | --- |
| `dist/` | Built web assets served by Vercel or the local runtime |
| `dist-desktop/main.cjs` | Bundled Electron main process |
| `dist-desktop/preload.cjs` | Narrow Electron preload bridge |
| `dist-server/index.mjs` | Bundled standalone local server |
| `dist-server/mcp.mjs` | Bundled stdio MCP bridge; requires a Node runtime |
| `build/THIRD_PARTY_NOTICES.txt` | Generated notices from installed production dependencies |
| `build/sbom.cdx.json` | Generated CycloneDX production dependency inventory |
| `release/` | Packaged platform artifacts and generated release metadata |

After generating the required notices and SBOM, the convenience command `npm run desktop:package` builds a macOS arm64 ZIP. To prepare another candidate on a compatible host, run the setup/build/check commands above and then the matching command:

```sh
npx --no-install electron-builder --mac zip --arm64 --publish never
npx --no-install electron-builder --mac zip --x64 --publish never
npx --no-install electron-builder --win nsis --x64 --publish never
npx --no-install electron-builder --linux AppImage --x64 --publish never
```

These are alternatives, not a promise that every host can cross-build every package. The CI matrix uses separate macOS, Windows, and Linux runners. It does not publish a GitHub release, deploy Vercel, activate a license, or install and exercise each packaged GUI.

## CI and candidate artifacts

[Application CI](../.github/workflows/app.yml) runs `npm ci`, `npm run build`, `npm test`, Chromium installation, `npm run test:e2e`, and `npm run desktop:build` on Node 24 for pull requests and pushes to `main`. It also syntax-checks the four bundled runtime entries and retains available browser failure evidence. Existing Python repository validation stays in its own workflow.

[Desktop candidates](../.github/workflows/desktop.yml) runs manually or for version tags, with four intended matrix entries: macOS arm64, macOS x64, Windows x64, and Linux x64. Each job runs the application build and local integration tests, generates bundled dependency notices and an SBOM, and produces only its platform candidate. Checksums cover packages and the accompanying notices/SBOM. An artifact manifest records the source SHA, run URL, architecture, file bytes, Node/Electron versions, and the explicit absence of install verification. Artifacts are retained for 14 days. No signing secrets or publishing permissions are configured.

Runner labels follow the current [GitHub-hosted runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). Node setup and artifact uploads use commit-pinned official [setup-node](https://github.com/actions/setup-node) and [upload-artifact](https://github.com/actions/upload-artifact) actions. A workflow's presence is not a successful run; attach actual run links to the availability record after execution.

## Installation and smoke-test record to complete per platform

Record the exact artifact filename, SHA-256, source commit, build run, OS version, CPU architecture, and tester. Then exercise these outcomes on a disposable workspace:

1. Obtain the stated artifact and compare its checksum with the published manifest. Install or extract using the platform's normal flow; record any signing or trust prompts accurately.
2. Launch the packaged app without relying on the source checkout or a separately installed Node for the GUI. Confirm the packaged Electron runtime can open SQLite and the workspace displays a usable UI.
3. Create a project, cycle, note, and ticket. Set status, priority, assignee, date, estimate, label, and a relationship; add a comment. Verify list/board and project filtering.
4. Quit the application fully, restart it, and verify the saved work. On macOS, closing a window alone does not prove process termination.
5. Export a backup. Restore it into a separate disposable data directory and compare records. Reject an invalid backup while preserving existing work. Retain a recoverable prior snapshot for replacement imports.
6. Exercise a stale-write conflict and ensure an open draft cannot silently overwrite a newer edit. Check keyboard navigation, dialogs, visible focus, and an appropriate narrow layout.
7. Connect an actual MCP client to the running local service; verify read and authorized write behavior in the same persisted workspace. Verify read-only mode separately.
8. Verify that ordinary work remains usable without AI configuration. For a real-provider AI claim, record the provider/model and test success/error/review flow without exposing keys. Stub tests alone do not meet that claim.

Do not disable operating-system protections as a substitute for signing a broadly distributed release. Unsigned developer previews need clear availability and limitations, and signed distribution remains a separate gate.

## Data and recovery notes

Browser work lives in IndexedDB for the current origin; clearing site data removes it. SQLite work defaults to `~/.zettel/workspace.sqlite`. Desktop and the standalone server use that same default location, while the browser-only workspace is separate. Use a distinct `ZETTEL_DATA_DIR` for installation experiments or clean restore verification. Export before upgrading. See [the runtime guide](local-runtime.md) for service credentials, provider settings, the recovery table, and file-level backup precautions.

This first preview does not have a prior released-version migration fixture. Stable upgrade/rollback and unattended update claims require additional evidence. The data is not claimed to be encrypted at rest, and local activity records are not a tamper-proof audit trail.

## Remaining release and product work

- Repeat relevant rendered and packaged checks for each new artifact; resolve open findings in [the independent verification record](verification.md).
- Verify each advertised platform separately, signing/notarization, actual public download links and checksums, and app update/recovery behavior.
- Attach dependency notices, an SBOM, vulnerability review, and build provenance to a published release; identify exact scope rather than treating a clean registry audit as a full security review.
- Repeat live Vercel route and storage checks after each material release; alpha.1 has independent production evidence.
- Validate a real AI provider and the intended client integrations. Current provider tests exercise a stub contract; MCP protocol tests exercise a local SDK client.
- Implement paid checkout, entitlements, refunds/support terms, and signed official distribution before offering a paid license. The proposed $49 desktop offer grants no current purchase entitlement and does not restrict Apache-2.0 rights.
- Continue shared workspaces, identity, collaboration, team permissions, advanced planning, programmable documents/tables, automation, and enterprise deployment in the [delivery plan](delivery-plan.md) and [capability ledger](research/capability-ledger.md).

Passing the first local preview gates does not complete that larger product scope.
