# Desktop candidate verification

The distribution contract is a macOS ZIP and drag-to-Applications DMG for arm64 and x64, a per-user assisted Windows x64 NSIS installer, and a Linux x64 AppImage. These are candidate targets, not an announcement that every platform is supported. The existing public alpha.2 macOS release remains unchanged. [Issue #12](https://github.com/microyee-ai/zettel/issues/12) owns the candidate verification gate; [ADR 0001](decisions/0001-local-first-runtime.md) defines the runtime boundaries.

## Build and check an artifact

Use Node 24 and the locked dependencies on the matching operating system and architecture. The packaged GUI and its bundled MCP bridge use Electron's own Node runtime; the verification harness uses the development Node installation.

```sh
npm ci
npm run build
npm run desktop:build
node scripts/license-notices.mjs
# Choose the command matching the host:
npx --no-install electron-builder --mac dmg zip --arm64 --publish never
# npx --no-install electron-builder --mac dmg zip --x64 --publish never
# npx --no-install electron-builder --win nsis --x64 --publish never
# npx --no-install electron-builder --linux AppImage --x64 --publish never
node scripts/verify-desktop-candidate.mjs
node scripts/record-desktop-candidate.mjs
```

The default verifier selects current-version host artifacts in `release/` and requires all distribution formats for that host. Set `--dir /path/to/candidates` to change that directory. `--artifact /path/to/file` can be repeated to test specific artifacts; this narrower invocation does not prove other formats passed. Run candidates one at a time on a given host. `--output-dir` overrides where reports are written; the manifest command expects reports under its candidate directory's `verification/`.

The verifier does not launch `release/mac-*`, `win-unpacked`, or `linux-unpacked`. It calculates a SHA-256 digest of the distribution and installs or extracts those exact bytes into a disposable directory:

| Format | Automated procedure | Limits |
| --- | --- | --- |
| macOS ZIP | `ditto -x -k`, verify app signature integrity, launch extracted app | Signature integrity can pass with an ad-hoc identity; this does not prove Developer ID or notarization |
| macOS DMG | `hdiutil verify`, read-only mount, copy `Zettel.app` out, detach image, check and launch the copy | Does not automate Finder drag-and-drop, quarantine, or Gatekeeper approval |
| Windows NSIS | Refuse an existing registered Zettel install; run the actual installer with `/S /currentuser /D=...`; launch installed executable; uninstall afterward | Silent install does not cover interactive wizard or SmartScreen |
| Linux AppImage | Execute the artifact's `--appimage-extract` entrypoint; launch its shipped Electron executable from the resulting AppDir | Does not prove FUSE mounting, desktop integration, or compatibility with other distributions |

Windows verification is allowed automatically on the disposable GitHub Actions runner. Locally it requires `--allow-nsis-install` in a disposable Windows account; NSIS creates normal per-user installation registration even with an isolated installation directory. The verifier refuses a pre-existing Zettel registration to avoid upgrading or uninstalling the user's installed copy.

Linux needs a display. CI uses Xvfb. The optional `--linux-sandbox-helper` configures only the extracted artifact's `chrome-sandbox` as root-owned mode `4755` using noninteractive `sudo`, then removes that setuid bit before cleanup. No sysctl, AppArmor, or global security policy is disabled. This is an explicit runner setup requirement and is recorded in evidence; it is not proof that a freshly downloaded AppImage works without configuration on every Linux desktop. If the host refuses sandbox creation, verification fails. Do not add `--no-sandbox` to make the run pass.

```sh
# Headless Linux runner with permission to configure the bundled helper:
xvfb-run -a node scripts/verify-desktop-candidate.mjs --linux-sandbox-helper
```

## What the packaged smoke proves

Every artifact receives its own disposable SQLite data directory and Chromium profile. AI provider environment values are removed from that run. The packaged executable is started from outside the repository, and its resource path supplies the MCP bridge. The harness asserts packaged status, expected product version and runtime architecture. It reads the embedded `dist-desktop/build-info.json` from the installed application archive, verifies its source commit and version, and includes it in the report. CI rejects a build marked as coming from a dirty source tree; local development candidates may be dirty and are labeled explicitly.

The app must render its workspace, create a ticket through the UI, keep a single process when launched again, fully quit, and recover the exact data after restart. On macOS it also closes the last window and relaunches the app to verify reopening. An actual MCP SDK client starts the bridge using the packaged Electron runtime, creates a second ticket in the same database, and the GUI shows it after reload.

The backup check performs the real Electron download. It supplies a temporary save path and waits for the download completion event; it does not manually operate the native file dialog. It checks that the backup excludes the actual service token, resets the workspace, imports that JSON through the UI, compares the restored tickets, and fully quits/restarts again to verify restored persistence.

The security check explicitly enables Playwright's Chromium sandbox and rejects sandbox-disabling command-line flags. It checks `sandbox`, `contextIsolation`, `webSecurity`, disabled Node integration, the exact four-method preload surface, absent renderer `require`/`process`, and blocked external navigation/popups. It checks the approved documentation link's native browser handoff with a stubbed OS opener; this does not claim the external browser was manually exercised. This is focused regression evidence, not a complete penetration test or proof of enterprise security.

Launch, UI, MCP, download, installer, shutdown, and cleanup operations have bounded timeouts. A failure produces a failed report with its stage and completed checks. A failed cleanup is a failed verification, with the retained temporary path identified. An overall subprocess failure without smoke output is never inferred to have passed.

## Evidence and release gates

`scripts/record-desktop-candidate.mjs` copies the notices/SBOM and writes `artifact-manifest.json` plus `SHA256SUMS`. It records each artifact's report path, report digest, source commit, distribution digest, and automated verification status. Missing reports produce `not-run`; mismatched artifact digests, versions or commits are rejected. Reports distinguish the verifier's modified working tree from the embedded build provenance. The tracked-diff fingerprint excludes untracked files and is supplemental diagnostics, not a reproducible-build claim. The manifest also checks the embedded provenance of passing reports. The manifest command exits nonzero if any selected artifact has incomplete or failed verification.

The desktop workflow uploads the distributions, manifest, checksums, license notices, SBOM, restored-workspace screenshots and per-artifact JSON reports even when verification fails. Nothing is published by this workflow. The uploaded directory name identifies platform, architecture and source revision. Review the report itself before treating an uploaded artifact as usable; upload completion does not mean installation passed.

The following remain separate gates and must not be represented as satisfied by automation:

- Manual installation on a clean machine, native file-dialog behavior and OS trust prompts.
- Publisher signing, Apple notarization and supported Windows signing.
- Upgrade from each supported previous version and preservation/recovery of existing work.
- Automatic update delivery, rollback policy, and the commercial license/support offer.
- Platform-specific usability/accessibility checks and real configured AI provider calls.

Do not add a public platform download until that candidate's evidence has been reviewed. A failed or untested platform stays a candidate, and a successful local macOS run says nothing about the Windows or Linux runner result.

## Primary references reviewed 2026-10-07

- [electron-builder NSIS options](https://www.electron.build/docs/nsis/): assisted/per-user installer configuration and upgrade identity.
- [NSIS command-line parameters](https://nsis.sourceforge.io/Which_command_line_parameters_can_be_used_to_configure_installers): silent installation and the last, unquoted `/D=` argument.
- [AppImage extraction](https://docs.appimage.org/user-guide/run-appimages.html#extract-the-contents-of-an-appimage): the distribution's extraction entrypoint and AppDir behavior.
- [Playwright Electron launch](https://playwright.dev/docs/api/class-electron#electron-launch-option-chromium-sandbox): the Chromium sandbox option defaults to disabled in the automation API.
- [Electron sandbox behavior](https://www.electronjs.org/docs/latest/tutorial/sandbox): global sandbox-disabling switches are different from renderer preference checks.
- [Chromium SUID helper documentation](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/linux/suid_sandbox_development.md): scoped helper ownership/mode. Upstream marks this documentation partly obsolete, so the real runtime smoke remains authoritative; it is not a universal Linux installation recommendation.
