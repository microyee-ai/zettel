# ADR 0003: installable desktop candidates and artifact verification

Date: 2026-10-07. Status: accepted for implementation; platform results are recorded separately from this decision. Scope: the local desktop preview and [issue #12](https://github.com/microyee-ai/zettel/issues/12). This extends ADR 0001 without changing workspace format or commercial terms.

## Decision

Retain Electron and the existing bundled SQLite runtime. Package macOS as a drag-to-Applications DMG plus the existing ZIP, Windows as a per-user assisted NSIS installer, and Linux as an AppImage. Produce candidates on their matching operating systems and architectures. Keep source, dependencies, and the final artifact digest traceable in a candidate manifest.

The macOS DMG contains the application and an Applications shortcut; it requires no separately installed Node runtime. Retain ZIP for portable extraction and future update research. Use an assisted Windows installer so users can see and choose the installation directory; default to their own account, with no elevation required. Uninstall removes application files and shortcuts, while retaining workspace data. The Linux AppImage remains a portable executable; automatic desktop integration is not implied.

Use electron-builder already pinned in this repository rather than introducing a separate installer engine. Its [DMG configuration](https://www.electron.build/dmg/) and [NSIS configuration](https://www.electron.build/nsis/) describe these targets. Preserve the project license, bundled dependency notices and SBOM alongside the runtime. Compare with the actual Anttable desktop implementation in microyee-ai, but retain Zettel's independent local service rather than adopting Anttable's hosted-origin architecture.

## Verification contract

Verify the bytes intended for delivery, not the unpackaged development directory. On macOS, extract ZIPs and mount DMGs read-only, copy the app to a disposable installation directory, detach the volume, and then run the copy. On Windows, install the NSIS executable into a disposable directory. On Linux, extract the AppImage distribution for an automated runtime check, while keeping normal FUSE launch and desktop integration separate manual checks.

Each installed copy must create a ticket, fully terminate and reopen, retain data, share writes with the bundled MCP bridge, and export/reset/restore through the GUI. Verify the renderer sandbox, context isolation, narrow preload and navigation restrictions. Associate machine-readable results with the artifact SHA-256, OS/architecture, source revision, and runner. A failed platform gate must fail that candidate job and retain useful failure evidence.

Preserve OS protections and Chromium sandboxing. Do not add `--no-sandbox`, disable system AppArmor/Gatekeeper/SmartScreen, or treat an extracted-app smoke as proof of every native installation prompt. Follow the [Electron security recommendations](https://www.electronjs.org/docs/latest/tutorial/security) for renderer and IPC boundaries.

## Signing and release boundaries

The available machine has no valid publisher signing identity (checked with `security find-identity -v -p codesigning`). Local macOS candidates therefore use an ad-hoc integrity signature. It is not Apple Developer ID trust or notarization. Windows signing is also not configured. A candidate manifest must report that accurately. No automatic update feed is configured; upgrades remain deliberate replacement installs with a backup first.

Keep existing published alpha artifacts immutable. Prepare the new work as `0.1.0-alpha.3`, an unpublished candidate until its evidence is reviewed. A public paid offer additionally depends on publisher credentials, supported upgrade/recovery verification, and the separate commercial gates in ADR 0002. Preparing installers does not authorize taking payments or claiming enterprise readiness.

## Alternatives and consequences

- Continue ZIP-only on macOS: simpler packaging, but misses the requested familiar installation flow. Retain it as an additional format.
- Replace Electron with Tauri: a new runtime, SQLite bridge, and webview compatibility program with no demonstrated benefit sufficient to justify discarding the working implementation.
- Hosted-site shell like Anttable: useful for a hosted product, but changes Zettel's offline/local ownership contract and creates a service prerequisite for launch.
- Automatically update unsigned previews: rejected. Upgrade trust, recovery, compatibility, and distribution credentials need explicit verification first.

The result is a more usable installation path with reproducible candidate checks. It does not prove publisher trust, customer demand, team collaboration, full parity, or that every supported machine has passed a manual clean-install test.
