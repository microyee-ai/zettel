# Independent desktop runtime review — 2026-10-07

Reviewed Zettel at base revision `70e3797bb27a950218e11b59dc3a7aac9ce32c9c` plus the coordinator's current local corrections. This review covers desktop lifecycle, renderer/IPC boundaries, localhost HTTP, SQLite persistence and recovery, and build/release configuration. It does not certify the product or an installer. Packaging and installation evidence belongs to the installer owner and the release record.

Read the product AGENTS, SECURITY, README, product research, issue #9, ADR 0001, local runtime guide, previous release evidence, and shared release-readiness guidance. Shared governance was read from the existing `zinnober-haus/zinnober` checkout. No sibling repository, user workspace, signing identity, or production credential was modified or used. All runtime writes used disposable directories and Electron profiles; those directories were removed.

## Evidence and corrections

| Scenario | Independent result | Scope and limits |
| --- | --- | --- |
| SQLite reopen and invalid save | Passed: saved records survive a close/reopen, and invalid schema input leaves the complete committed snapshot unchanged | Local Node 24.11.1 probe; no disk corruption recovery claim |
| Local storage file permissions | Passed after coordinator correction: database and live WAL/SHM files have owner-only modes on macOS | POSIX permission check; Windows ACL behavior remains unverified |
| Newer schema rejection | Original startup changed journal configuration before refusal; corrected startup rejects `user_version=2` with exact database bytes unchanged | A disposable newer-schema fixture with existing records; not a future migration compatibility guarantee |
| Shutdown with an incomplete request | Original HTTP close waited for the request; corrected close completed in **1,001 ms**, and repeated calls share the same completion promise | One unfinished authenticated request. The regression also confirms no partial save occurred |
| Second process after closing the macOS window | Passed after correction: raw second process exits **0**, original process recreates the usable window, and discovery-file bytes remain identical | Development Electron with a private `--user-data-dir`; not Finder/DMG installation evidence |
| IPC from an unrelated renderer | Passed: a second hidden BrowserWindow, loaded from the same local origin with the same preload, receives `Untrusted IPC sender` | Tests the webContents identity boundary through actual IPC; no generic filesystem or shell bridge is exposed |
| Invalid IPC save | Passed: a schema-version-2 save is rejected and the complete prior snapshot remains equal | Actual sandboxed Electron renderer invoking the preload |
| Complete quit | Passed: `app.close()` calls Electron `app.quit()`, launch process exits, discovery file disappears, and the previous loopback port becomes unreachable | Direct process and HTTP evidence, rather than closing only a window |
| External navigation and documentation | Passed: external navigation remains blocked; only the pinned HTTPS runtime guide, optionally with an anchor, is dispatched to the system-browser adapter | `shell.openExternal` was intercepted for the test. No real browser was opened; native OS dispatch is not claimed |

The documentation change fixes previously inert Settings/AI setup links while preserving denial of arbitrary destinations, file URLs, credential-bearing URLs, query variations and new app windows. The URL allowlist has focused regression coverage in `tests/desktop-navigation.test.ts`. Local HTTP/storage regressions are in `tests/server.test.ts`.

Source inspection confirms loopback binding, Host/Origin checks, no-store API responses, bounded JSON bodies, bearer-protected workspace operations, schema validation at storage entry, revision compare-and-swap, and transactional retention of ten previous SQLite snapshots. The session bootstrap is intentionally usable by trusted local processes; this is a single-user local service, not a multi-user permission boundary. The narrow preload, sender/frame checks, denied permissions/webviews, context isolation and disabled renderer Node integration remain intact.

## Sandbox evidence correction

The original smoke runner omitted Playwright's `chromiumSandbox: true`. The installed Playwright Electron launcher adds `--no-sandbox` by default when that option is absent. Consequently, a historical assertion that `webPreferences.sandbox` equals true proves configuration, not the absence of a process-wide disabling flag.

The revised smoke explicitly enables the sandbox and asserts that disabling flags are absent. This reviewer independently launched Electron with `chromiumSandbox: true` and observed both sandbox preference enabled and `--no-sandbox` absent. Earlier alpha.2 claims should be interpreted within the old test's limits; this review does not retroactively validate the old binary under the revised harness. Electron recommends keeping sandboxing and context isolation enabled and validating IPC senders. [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security)

## Dependency and release trust

An independent `npm audit --omit=dev --json` returned **0 known vulnerabilities** on 2026-10-07. The full build dependency audit has the publicly disclosed `sprintf-js` advisory **GHSA-hp3w-g68c-fv3c / CVE-2026-97058** through `roarr`, `global-agent` and Electron download/build tooling. The upstream report identifies out-of-range, attacker-controlled formatting precision as the trigger; a local bounded probe reproduced its `RangeError`. The inspected `global-agent` logging call sites use fixed messages and context objects. Application sources and emitted runtime bundles do not reference these packages, so no shipped-workspace execution path was established. [Upstream disclosure and consumer workaround](https://github.com/alexei/sprintf.js/issues/237)

The advisory currently lists no patched `sprintf-js` release. Track an explicit temporary build-tool exception and upstream resolution, avoid untrusted format strings in tooling, and reassess after lockfile changes. A forced downgrade of Electron or an untested major override is not justified by this evidence. This is a scoped reachability assessment, not dismissal of development dependency risk or a security certification. [Reviewed advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)

Reviewed Actions workflows use read-only `contents` permission and commit-pinned actions. Application and desktop workflows disable checkout credential persistence; no release signing or publish credential was observed in the reviewed workflow definitions. No `pull_request_target` execution was found. A candidate manifest must identify dirty source honestly; its base commit alone cannot identify uncommitted fixes.

## Candidate identity and remaining gates

The lifecycle/IPC probe exercised bundled main SHA-256 `8d7760090f29b261e816ecc273ade4cb5252e6de9dc891a103f0d64db447f914`. After the documentation change, the reviewer rebuilt and tested navigation/system-browser dispatch against main SHA-256 `6ee9137b911e00407ee4d90c50797341409f18daa9a71e5901b995199f1c8442`.

Final inspected source hashes:

| File | SHA-256 |
| --- | --- |
| `desktop/main.ts` | `2931704439d94a31198d0fdc60534252716e0c23f617c89193b59146520b0ac7` |
| `desktop/navigation.ts` | `56b82d26aefdf141397b54fed426406ec236dae74217bfdf52bc8b4d77678ab0` |
| `desktop/preload.ts` | `4daa74f0bc3fbc0a8a490bbdada876239776d5ee048a31e33cf500aec679c85f` |
| `server/http.ts` | `0514ce123a57b2234bfbced1e35eeb0e0d768ac689d6dab4f48e780c0ab5a429` |
| `server/storage.ts` | `99517a8b3fbbb4e1394145494935430cd0d224c156bc3837928251755c0d45e7` |

Recheck relevant scenarios when these files or their bundles change. Independent native installer execution, publisher signing/notarization, Windows/Linux behavior, native save-dialog cancellation, clean-host restore, unattended updates, previous-release upgrades and renderer-crash recovery are not established by this review. SQLite's ten in-file snapshots are short-term recovery, not independent backups; the documented manual recovery path still requires technical knowledge. Enterprise permissions, collaborative workspaces and paid services remain outside this local runtime's capabilities.

The corrected runtime has direct evidence for the scenarios above. The full desktop/installer and commercial goal remains open until its separate platform, distribution and product gates are met.
