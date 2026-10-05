# Independent verification record

Review date: **2026-10-05**. Reviewer: independent verifier/security reviewer. Scope: [ZET-101, ZET-103 and ZET-105 acceptance slices](implementation-brief.md), against [ADR 0001](decisions/0001-local-first-runtime.md) and the full [capability ledger](research/capability-ledger.md). This review does not establish full product completion, enterprise readiness, a security certification or platform release approval.

Repository base: `f2ebeea5d0688330933c7c0ebb72b24b24bc00eb`. Reviewed implementation is an uncommitted working tree being edited concurrently. Results below attach to the observed files and must be refreshed after relevant changes. The reviewer did not modify implementation files.

## Independently exercised evidence

| Check | Observed result | Scope and limitation |
| --- | --- | --- |
| `npm test` | **15 tests passed**, no failures after fixes | Executed on Node **22.12.0** with `--experimental-sqlite`; below package-declared Node >=22.13.0. Repeat on a supported release runtime before claiming runtime support |
| `npm run typecheck` | **Passed** after the independent tests were added | Compile-time consistency only; does not establish runtime behavior |
| Independent browser adapter suite | **8 tests passed** using `fake-indexeddb` **6.2.5** | Atomic initialization, persistence through independent connection/reopen, competing writes, invalid import preservation, valid restore/recovery, numbering after deletion/older restore, injected quota rollback and exact 5 MB post-commit boundary. This is an IndexedDB emulator, not a rendered browser or process-restart test |
| Shared validation suite | Invalid schema version, duplicate identifiers, dangling references and parent/dependency cycles rejected; new identifier bounds and retained allocation tested | Tests establish these cases, not exhaustive input coverage |
| SQLite suite | Saved ticket survived close/reopen; stale revision and invalid-save attempts preserved committed data | Reopening a database connection is verified; a complete packaged-desktop restart and previous-version migration remain separate checks |
| Concurrent writers | Two SQLite connections reject a stale write; two parallel HTTP writes returned one 200 and one 409 | Proves compare-and-swap storage for these scenarios; does not prove the UI safely reconciles an open stale draft |
| HTTP auth/origin suite | Missing bearer denied; session bootstrap header required; foreign Origin/Host and cross-site metadata rejected | Loopback service boundary only; not multi-user or tenant authorization |
| Additional independent HTTP probes | Wrong bearer 401; `Origin: null`, a different loopback port Origin, and cross-site metadata 403; wrong content type and >5 MB body 400 | Oversized request left original workspace unchanged at revision 0. Tests used only the reviewer's disposable local server |
| Real MCP stdio client | Protocol handshake, tool discovery, ticket creation/update and persisted `MCP agent` activity passed | No external AI client account or production connection used; no claim of retry-idempotent creation or granular project-scoped tokens |
| Additional independent MCP probes | Read-only mode exposed three read tools, rejected create and left issue count at zero; foreign connection origin rejected | Read-only mode limits the bridge's exposed tools. Local processes with the service connection credentials remain inside the trust boundary |
| AI contract suite | Explicit configuration, no redirects, validated draft structure and invalid-provider-output rejection passed | Provider response was stubbed. No paid/real provider request, model-quality evaluation or cost-metering verification occurred |
| Production dependency audit | `npm audit --omit=dev --json` reported **0 vulnerabilities** in its current database | Registry advisory result only; does not cover unknown defects or dev/packaging dependencies |

The suites are [tests/server.test.ts](../tests/server.test.ts) and the independently authored [tests/browser-storage.test.ts](../tests/browser-storage.test.ts). Additional HTTP/MCP checks were disposable Node scripts invoking the same exported service, SQLite store and official MCP SDK; temporary databases and connection files were removed. Browser-adapter tests used in-memory IndexedDB emulation. No user workspace was read or changed.

## Review findings and resolution tracking

| ID | Priority | Finding and evidence | Required verification / state |
| --- | --- | --- | --- |
| V-01 | P1 | An open ticket draft can outlive a workspace reload. Initial `App.tsx` reload replaced current data while the editor retained its original object, and save replaced the complete issue against the refreshed revision | **Implementation corrected; rendered regression pending.** Source now captures the opening revision for the whole modal lifetime and keeps using it after reload. Verify title-only draft plus concurrent status/comment edits cannot silently erase either side |
| V-02 | P2 | Identifier allocation used the maximum surviving issue number. Independent probe created two issues, removed the second, and observed the third reuse `ZET-2` | **Resolved for tested paths.** Persisted high-water allocation and preservation during same-workspace restores now pass both SQLite and independent browser-adapter regressions |
| V-03 | P1 | A schema-valid imported identifier with an oversized numeric suffix was accepted but made subsequent `createIssue` fail during numeric allocation | **Resolved for reproduced input.** Identifier bounds reject the oversized import; independent browser regression confirms existing main/recovery data remain unchanged |
| V-04 | P2 | Browser storage initially retained only the main snapshot. Import triggered a download and immediately replaced work, although a programmatic download request does not prove a retained backup | **Resolved at adapter layer.** Transactional recovery snapshot and recovery helper now pass valid-restore and injected-storage-failure tests. Settings download UX remains a rendered check |
| V-05 | P2 | UI described `ZETTEL_AI_API_KEY` while the server initially read `ZETTEL_AI_KEY` | **Corrected by implementation owner during review.** A subsequent source read and passing test run show server configuration uses `ZETTEL_AI_API_KEY`; rendered setup remains to be exercised |
| V-06 | — | Initial local-setup links differed from the older umbrella registry | **Withdrawn.** The coordinator verified the actual repository origin through `gh repo view` as `microyee-ai/zettel`; the current repository origin is authoritative over the older registry. Live documentation navigation remains a release check |
| V-07 | P1 | Initial package main/files paths used `desktop-dist/`, while the build script emitted `dist-desktop/` | **Configuration corrected.** Manifest and script now agree on `dist-desktop/`; packaging and launch remain separate evidence |
| V-08 | P1 | Input validation alone did not ensure the final browser snapshot stayed within its size limit after revision/high-water updates | **Resolved.** Final snapshot is revalidated before either write; an exact-5-MB input that would overflow after revision replacement is rejected, preserving both main and recovery |

These findings were sent directly to the coordinator and owning implementer. “Corrected” is not equivalent to independently reproduced end-to-end resolution. Re-run the relevant scenario and update this table when the implementation stabilizes.

## Reviewed trust boundaries

Source inspection found loopback-only binding, host/origin checks, bearer authentication for workspace operations, strict imported object schemas, no generic shell tool in MCP, provider keys held outside the renderer, provider redirect rejection, bounded response handling, and explicit AI draft review before UI creation. Electron declares context isolation, a sandbox, disabled Node integration, sender checks, denied window opens/navigation outside the service origin, and narrow preload methods. These are inspected controls; packaged runtime enforcement is still unverified by this reviewer.

Data in tickets and notes is rendered as text in the inspected components. The reviewer did not find use of `dangerouslySetInnerHTML`, arbitrary JavaScript evaluation, a generic filesystem bridge or generic shell execution in the inspected application paths. This targeted read is not a complete security audit.

The current service is a single-user local workspace. Activity is user-editable workspace data, not a tamper-evident enterprise audit trail. Browser and SQLite workspaces are distinct; export/import is not synchronization. MCP writes can execute when the configured client invokes an exposed write tool; the application does not provide a separate approval dialog for each MCP write. AI-provider drafts follow a different UI review path.

## Release gaps and completion status

| Acceptance area | Review status |
| --- | --- |
| Browser persistence, restart, invalid import and multi-tab behavior | **Unverified in a real browser by this reviewer**; root/coordinator owns rendered verification. The coordinator reports the browser plugin unavailable and is using an isolated application test runner as fallback |
| Web issue/project/cycle/note creation, keyboard and narrow-screen behavior | **Unverified by this reviewer**; source alone does not prove usability |
| SQLite persistence/concurrency and local HTTP/MCP basic boundary | **Proven for the narrow scenarios above**, subject to re-run after fixes |
| Offline web reopening / service worker behavior | **Unverified**; IndexedDB persistence alone does not establish offline app loading |
| Packaged desktop launch, SQLite runtime, reopen, backup import and process lifecycle | **Unverified**; build scripts and Electron settings do not establish a working download |
| macOS signing/notarization, Windows/Linux packages and supported architectures | **Unverified**; advertise only independently built and exercised artifacts, with unsigned previews clearly labeled |
| Published Vercel landing/app and all download destinations | **Unverified by this reviewer**; require live navigation and persistence evidence |
| Real AI provider and claimed client integrations | **Unverified** beyond a stub and local SDK MCP client |
| Paid checkout, license/entitlement, refunds, support terms and recurring services | **Not demonstrated**; pricing remains a hypothesis, now consistently **$49 once** for the proposed Desktop offer |
| Collaboration, identity/tenancy, SSO/SCIM, programmable formulas/tables, advanced planning and full Linear parity | **Not demonstrated by this slice**; preserved in the capability ledger |
| Clean-host backup restore, supported upgrades, SBOM/notices/provenance and operational runbooks | **Not fully demonstrated**; required release evidence remains outstanding |

Do not mark the original user goal complete from this review. Passing local storage/protocol tests substantiates those mechanisms only.
