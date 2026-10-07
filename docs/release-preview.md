# Preview release record: 0.1.0-alpha.2

The subsequent [alpha.3 candidate record](releases/0.1.0-alpha.3.md) contains verified DMG/ZIP, Windows installer and Linux runtime evidence. It is not a public release and does not alter the alpha.2 availability below.

**Evidence correction, 2026-10-07:** The old Electron smoke checked sandbox preferences but omitted Playwright's `chromiumSandbox: true`; its launcher implicitly disabled the Chromium sandbox. Historical sandbox assertions below therefore establish configuration only. The new candidate harness checks both preferences and launch flags. See the [independent review](research/2026-10-07-desktop-review.md) and [installer verification guide](desktop-installers.md). Published alpha.2 artifacts remain unchanged.

Prepared 2026-10-05. **Status: alpha.2 web and macOS Apple Silicon developer preview published and exercised.** The web preview is [zettel-iota.vercel.app](https://zettel-iota.vercel.app/). Publication and packaged-runtime evidence is recorded separately below; neither this document nor configured CI establishes product readiness.

## User-visible changes

Alpha.2 replaces the pastel visual system with a charcoal interface, locally bundled Inter Variable, compact navigation and rows, restrained status colors, and a more useful overview with overdue/blocked counts and current-cycle progress. The landing page now centers a substantial interactive sample workspace with list/board switching and ticket selection. Mobile navigation gains a dismissible backdrop and Escape handling. Existing storage and backup formats are preserved. [Design rationale](brand.md) and [current reference evidence](research/visual-direction-2026-10-05.md) explain the choices.

This is Zettel's first runnable local-work preview. It adds a branded landing page; a browser workspace with tickets, projects, cycles, notes, and basic delivery views; a shared work model; SQLite persistence for localhost and desktop; backup transfer; optional AI proposal review; and a stdio MCP bridge. The product is intended to begin with independent makers and small software teams while retaining the full [enterprise and programmable-workspace ambition](product-research.md).

The workflow starts with an empty workspace or an explicitly chosen sample project. Tickets can capture a status, priority, project, cycle, assignee name, due date, estimate, labels, dependencies, parent ticket, and comments. These are local work records. They do not imply shared accounts, permission enforcement between team members, realtime collaboration, or automatic device sync.

## Availability record

| Deliverable | Current evidence/status | Publication requirement |
| --- | --- | --- |
| Source checkout | Implementation exists in this repository; source-run commands are in [README](../README.md) | Record the exact source revision for any release |
| Web deployment | [Landing](https://zettel-iota.vercel.app/) and [app](https://zettel-iota.vercel.app/app) published; alpha.2 deployment `dpl_EBSPEMswzyWPZuubNkAJtMR45L3E` verified below | Preserve dated evidence for subsequent deployments |
| macOS Apple silicon ZIP | [Alpha.2 published](https://github.com/microyee-ai/zettel/releases/tag/v0.1.0-alpha.2), exact artifact evidence below | Launch/create/restart/MCP/export/reset/restore passed; trusted signing remains a separate gate |
| macOS Intel ZIP | Candidate CI matrix configured; no successful run or install claimed | Run URL and independently exercised install/launch/restart evidence |
| Windows x64 installer | Candidate CI matrix configured; no successful run or install claimed | Run URL, installer behavior, launch/restart, data paths, signing state |
| Linux x64 AppImage | Candidate CI matrix configured; no successful run or install claimed | Run URL, tested distribution/prerequisites, launch/restart, desktop integration behavior |
| Signed official desktop distribution | Not established | Publisher signing, macOS notarization where applicable, update and recovery verification |
| Paid desktop license / hosted teams | Not available | Payment, entitlement, policy and service gates in the delivery plan |

Do not add speculative download URLs. A temporary Actions artifact is a build candidate with retention limits; it is not automatically a supported public release. Candidate builds are produced without publisher signing credentials. An ad-hoc platform signature, if produced by the packager, is not a verified publisher signature or macOS notarization.

## Published alpha.2 evidence

- Source runtime/UI/build revision: `bb55d65b6bfcd4164ccbecb79fc86d425bd96a8f`. The SBOM build timestamp/serial are regenerated, so binary reproducibility is not claimed.
- [Application CI](https://github.com/microyee-ai/zettel/actions/runs/37345848932) passed on this revision: clean Node 24 install, build, 15 storage/protocol tests, 4 Chromium workflow tests, and runtime bundle checks. Repository validation also passed.
- Production deployment: `dpl_EBSPEMswzyWPZuubNkAJtMR45L3E`, [deployment URL](https://zettel-4cvwocdxc-my-team-ae70891f.vercel.app), aliased to [zettel-iota.vercel.app](https://zettel-iota.vercel.app/). Built with Vercel CLI 62.2.0. Independent post-deployment checks confirmed the new headline/Inter/dark surfaces, desktop/mobile no overflow, `/app`, workspace entry, actual ticket creation/status/reload persistence, no observed script/network failures, and zero serious/critical axe findings.
- Published ZIP: [`Zettel-0.1.0-alpha.2-arm64-mac.zip`](https://github.com/microyee-ai/zettel/releases/download/v0.1.0-alpha.2/Zettel-0.1.0-alpha.2-arm64-mac.zip), **127,184,343 bytes**, SHA-256 **`b6a0f33add8860afdf42485b0cf07a59091bf93038f7f9409399ace1347ae8e1`**. All seven release asset digests were compared with the local bytes after upload.
- Packaged Electron **44.5.1**, embedded Node **24.21.0**, macOS **25.5.0**, **arm64**. The actual packaged executable passed create, complete quit/restart persistence, bundled MCP writes visible in the GUI, actual export/reset/import with exact ticket equality, sandbox/context isolation, narrow preload, blocked external navigation and popups. The automated download supplies a temporary save path; manual native save-dialog coverage is not claimed.
- `unzip -tq` and `codesign --verify --deep --strict` passed. `spctl --assess --type execute` exited **3**, rejecting publisher trust as expected for this ad-hoc signed, unnotarized build. No operating-system protection was disabled.
- [Release assets](https://github.com/microyee-ai/zettel/releases/tag/v0.1.0-alpha.2) include `SHA256SUMS`, `artifact-manifest.json`, `desktop-smoke.json`, notices, SBOM and ZIP blockmap. Alpha.1 remains immutable and available separately.

These establish a scoped developer preview, not trusted commercial distribution, real-provider AI verification, paid licensing, collaboration, or full product readiness.

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
