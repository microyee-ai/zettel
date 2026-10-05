# ADR 0001: one work model across browser, localhost and desktop

Date: 2026-10-05. Status: accepted for the first implementation by the coordinator; release gates remain unverified. This decision specifies architecture, not delivered capability.

## Context and decision

The repository initially contains planning documents and no application. The requested product adds a usable web app, downloadable desktop app, local hosting, optional AI/MCP, a brand and landing page, and a freemium/paid distribution strategy for independent operators and growing teams. The [existing brief](../product-research.md) retains the longer-term Linear/Coda and self-hosted enterprise ambition. Local single-user storage does not satisfy that enterprise ambition.

Implement an original TypeScript work model and React UI built with Vite. Deploy static assets to Vercel. Browser mode persists in IndexedDB. A Node local service persists the same validated model in SQLite; Electron packages the same UI and service. Browser storage and desktop/local storage are distinct workspaces with explicit JSON transfer. Do not label them synchronized. The browser version must identify its storage mode and explain that clearing site data removes local work.

Use Node's built-in `node:sqlite`, requiring Node >=22.13 for the standalone service. The module remains experimental in Node 22; its synchronous API requires bounded operations. The development host was observed at Node 22.12, so tests must use an explicit supported Node runtime or its documented experimental flag. [Node 22 SQLite documentation](https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html)

Pin a supported Electron release and test `node:sqlite` inside that exact binary. Electron historically omitted the SQLite builtin despite embedding a sufficiently new Node; upstream fixed that defect in 36.7.3 and 37.2.3. Desktop must run with bundled Node and require no user's system Node. Run the shared service in the privileged main process for this bounded first release; move synchronous storage into an Electron utility process when measured stalls or workload growth warrant it. Do not silently fall back to an in-memory store on runtime failure. [Electron SQLite fix](https://releases.electronjs.org/pr/47706), [utility process API](https://www.electronjs.org/docs/latest/api/utility-process)

## Options and consequences

| Option | Reuse and license | Self-hosting, isolation and migration | Cost and decision |
| --- | --- | --- | --- |
| Original TypeScript core + Electron | Preserve repository Apache-2.0; retain all dependency notices and verify exact lockfile versions | Same model in local HTTP service and desktop; UI sandbox separated from privileged storage; export is the migration boundary | Small initial operational footprint; product functionality must be built and maintained. Selected. |
| Fork Plane Community | Community is AGPL-3.0; commercial editions have distinct rights | Existing work-management concepts and self-hosting; must audit edition-specific isolation and migration behavior | Faster existing breadth, substantially different stack/operations and licensing strategy. Do not copy implementation into this Apache repository. Rejected for this slice. [Plane editions](https://developers.plane.so/self-hosting/editions-and-versions) |
| Embed/fork Grist | Core includes Apache-2.0 licensing; inspect exact reused paths and dependencies first | Strong structured-document starting point and self-managed deployments; issue workflow and desktop bridge still require design | Useful future reference for programmable tables; would introduce a second substantial engine before the issue model is proven. Deferred. [Grist license](https://github.com/gristlabs/grist-core/blob/main/LICENSE.txt), [self-managed guide](https://support.getgrist.com/self-managed/) |
| Tauri desktop shell | Dual MIT/Apache framework; recheck pinned dependency notices | Rust backend and OS webviews; Node service would need a packaged sidecar or separate storage implementation | Potentially smaller packages but additional Rust/sidecar lifecycle and cross-webview validation. Reconsider only against measured Electron cost. [Tauri overview](https://v2.tauri.app/start/) |
| Hosted multi-tenant API first | Original application with a separate identity/database stack | Requires tenancy, access control, migration, backups and incident operations from launch | Appropriate for future collaboration; unnecessary dependency for an offline solo workflow. Deferred, not removed from scope. |

IndexedDB offers asynchronous transactional browser storage, but does not create a remote account, backup or synchronization service. Its adapter must report failures rather than pretend a save succeeded. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## Contract and invariants

`shared/schema.ts` is the source of truth. `WorkspaceData` contains `schemaVersion: 1`, monotonically increasing `revision`, `workspace: {id,name,key,nextIssueNumber?}`, and arrays `projects`, `issues`, `cycles`, `notes`, `activities`. IDs remain stable across exports. `nextIssueNumber` persists a high-water mark so deleted ticket numbers are not reused; validation fills it for older snapshots, and saves preserve the previous mark for the same workspace identity. Identifiers have a bounded positive numeric suffix (maximum 999,999,999); exhausted workspaces require export and a new workspace. UTC timestamps use ISO 8601; user dates use `YYYY-MM-DD` or an empty string. Empty optional references use `""`, arrays use `[]`; no UI-specific duplicate work model.

Issue fields: `id`, `identifier`, `title`, `description`, `status`, `priority`, `projectId`, `cycleId`, `assignee`, `labels`, `estimate`, `dueDate`, `parentId`, `blockedBy`, `comments`, `createdAt`, `updatedAt`. Status keys are `backlog`, `todo`, `in_progress`, `in_review`, `done`, `canceled`; priorities are `urgent`, `high`, `medium`, `low`, `none`. Projects have `id,name,description,color,status,targetDate`, with status `planned|active|completed`. Cycles have `id,name,startDate,endDate,goal`. Notes have `id,title,body,projectId`. Activity has `id,at,actor,action,issueId?`. Comment has `id,body,author,createdAt`.

Reject invalid schema versions, duplicate IDs/identifiers, invalid enum/date/size values, dangling references, self relationships and cycles in parent/dependency graphs. These checks apply to HTTP, IPC, MCP and import. Treat imported strings as text; never execute imported HTML, formulas or scripts. Human-readable identifiers are workspace-key plus monotonic ticket number; stable object IDs are the real relationship keys.

Storage interface is `load(): Promise<WorkspaceData>` and `save(next, expectedRevision): Promise<WorkspaceData>`. Every save validates and atomically compares stored revision; success increments revision, conflict returns an explicit reload/retry error. No silent last-write-wins. Initially SQLite stores one bounded JSON aggregate in a transactional row. This reduces divergent migrations while the model evolves, but limits query scalability; normalize into tables behind the interface when size/latency measurements justify it. Preserve IDs and exports through that migration.

`GET /api/workspace` reads the snapshot. `PUT /api/workspace` accepts `{data, expectedRevision}` and returns the committed snapshot. `GET /api/health` exposes only availability and schema version. Imports validate completely before replacing anything and use expected revision. Export excludes service tokens, provider credentials and entitlement credentials. Persisted user activity is useful history, not a tamper-proof enterprise audit log.

## Trust boundaries and AI

The localhost HTTP server binds `127.0.0.1`, validates Host and browser Origin, rejects unsupported content types and oversized requests, and requires an unpredictable bearer token for workspace reads/writes. Its same-origin local page can bootstrap a session token; unrelated origins cannot. It must never return that token in a URL, log or export. The Vercel site cannot automatically discover or operate a local service. Local process access is not a multi-user authorization boundary.

Electron loads packaged assets, uses `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, restricts navigation/new windows and validates IPC senders. Preload exposes only named workspace/AI methods, never generic IPC, shell, filesystem or arbitrary fetch. Use a restrictive CSP. Electron recommends these boundaries and ongoing framework updates; configuration alone does not prove security. [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)

MCP runs as a stdio bridge to the authenticated local service, using the official SDK and the same model validation. Initial tools read projects/issues, create projects/issues, and update issues. Credentials remain in local environment/config, never tool arguments. Record an agent actor for mutations. Tool capabilities are bounded; ticket content cannot grant a tool more permissions. A configured MCP client can execute allowed writes; do not imply every MCP write has a separate application confirmation dialog.

Optional BYOK AI lives in the local service only. Provider URL/model/key are explicit operator settings; none are shipped to browser bundles or exported. Send only the user-selected planning prompt/context. Validate returned proposed ticket structure and show a review step before committing. No shell execution, autonomous purchasing, or arbitrary URL tools. With no key configured, explain setup and preserve normal work features. Static browser mode must not simulate provider generation. Custom endpoints require explicit operator configuration, HTTPS except loopback development, bounded timeout, response size and error handling.

## Portability, distribution and commercial boundaries

JSON backups contain an envelope version and the complete work model. Before any destructive import or schema upgrade, retain a recoverable backup. A supported upgrade must restore real previous-version fixtures and reject newer schemas clearly. SQLite files live in the user's application data directory; document the path and export procedure. No database encryption is implied; OS account/disk protection is the initial boundary.

Downloadable releases require actual per-platform artifacts, checksums, install/launch/restart evidence, and supported architecture labels. A build script is not a download. Apple signing/notarization, Windows signing, update delivery and platform verification remain separate release gates. Mark unsigned previews accurately. Do not ship an installer for an architecture that was not built and checked.

Keep the Apache-2.0 source license. A paid official desktop distribution, update/support entitlement, optional managed collaboration and services can form a business model; users' existing open-source rights remain. A price card or mock checkout does not implement licensing or payments. Final prices, merchant account, renewal/refund policy and signing identities remain coordinator/maintainer decisions. Expiration must never trap user data: reading and export remain available. Licensing must not be falsely represented as activated before payment verification exists.

## Verification gates

1. Shared validation tests reject corrupt imports, dangling/cyclic relationships and oversized input; browser and SQLite adapters round-trip the same fixture.
2. SQLite persists across process restart; concurrent writes with the same expected revision yield one success and one conflict; failed validation leaves previous data intact.
3. A real browser creates and edits issues/projects/cycles/notes, reloads, exports, restores, and demonstrates conflict handling. Keyboard and responsive layouts receive rendered verification.
4. HTTP rejects foreign Origin/Host, missing/invalid tokens, malformed and oversized bodies; tests prove no provider key is in responses or static assets.
5. A real MCP client handshake lists and executes tools against that same local service; changes appear after UI reload. No protocol logs pollute stdout.
6. Provider call failures remain recoverable; structured proposal validation and human review precede creation. A stub proves contract only; record separately whether a real provider call was exercised.
7. The packaged Electron runtime proves SQLite availability, creates data, restarts and restores it; preload access and blocked navigation are inspected. Check macOS/Windows/Linux individually before advertising them.
8. The deployed Vercel landing page and app have verified routes, working CTAs, accurate download links and persistent browser edits. Deployment does not prove desktop readiness, collaboration, payments or enterprise parity.
9. Lockfile license inventory, dependency/security review, artifact checksums and release notes accompany a distributable release. Apply the full enterprise gates from the brief before enterprise claims.
