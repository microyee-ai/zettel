# Independent verification record

Review date: **2026-10-05**. Reviewer: independent verifier/security reviewer. Scope: [ZET-101, ZET-103 and ZET-105 acceptance slices](implementation-brief.md), against [ADR 0001](decisions/0001-local-first-runtime.md) and the full [capability ledger](research/capability-ledger.md). This review does not establish full product completion, enterprise readiness, a security certification or platform release approval.

Repository base: `f2ebeea5d0688330933c7c0ebb72b24b24bc00eb`. Reviewed implementation is a working tree being edited concurrently. Results below attach to the observed files and live deployment on the review date and must be refreshed after relevant changes. The reviewer did not modify implementation files.

## Independently exercised evidence

| Check | Observed result | Scope and limitation |
| --- | --- | --- |
| Supported-runtime storage/protocol suite | **15 tests passed**, no failures on Node **24.21.0** | Executed using `npx --yes node@24 --experimental-sqlite --import tsx --test tests/*.test.ts`; runtime version independently checked. Supersedes the earlier Node 22.12.0 run, which was below the package-declared minimum |
| `npm run typecheck` | **Passed** after the independent tests were added | Compile-time consistency only; does not establish runtime behavior |
| Independent browser adapter suite | **8 tests passed** using `fake-indexeddb` **6.2.5** | Atomic initialization, persistence through independent connection/reopen, competing writes, invalid import preservation, valid restore/recovery, numbering after deletion/older restore, injected quota rollback and exact 5 MB post-commit boundary. This is an IndexedDB emulator, not a rendered browser or process-restart test |
| Shared validation suite | Invalid schema version, duplicate identifiers, dangling references and parent/dependency cycles rejected; new identifier bounds and retained allocation tested | Tests establish these cases, not exhaustive input coverage |
| SQLite suite | Saved ticket survived close/reopen; stale revision and invalid-save attempts preserved committed data | Reopening a database connection is verified; a complete packaged-desktop restart and previous-version migration remain separate checks |
| Concurrent writers | Two SQLite connections reject a stale write; two parallel HTTP writes returned one 200 and one 409 | Storage conflict protection for these scenarios; separate production browser evidence below exercises an open stale draft |
| HTTP auth/origin suite | Missing bearer denied; session bootstrap header required; foreign Origin/Host and cross-site metadata rejected | Loopback service boundary only; not multi-user or tenant authorization |
| Additional independent HTTP probes | Wrong bearer 401; `Origin: null`, a different loopback port Origin, and cross-site metadata 403; wrong content type and >5 MB body 400 | Oversized request left original workspace unchanged at revision 0. Tests used only the reviewer's disposable local server |
| Real MCP stdio client | Protocol handshake, tool discovery, ticket creation/update and persisted `MCP agent` activity passed | No external AI client account or production connection used; no claim of retry-idempotent creation or granular project-scoped tokens |
| Additional independent MCP probes | Read-only mode exposed three read tools, rejected create and left issue count at zero; foreign connection origin rejected | Read-only mode limits the bridge's exposed tools. Local processes with the service connection credentials remain inside the trust boundary |
| AI contract suite | Explicit configuration, no redirects, validated draft structure and invalid-provider-output rejection passed | Provider response was stubbed. No paid/real provider request, model-quality evaluation or cost-metering verification occurred |
| Production dependency audit | `npm audit --omit=dev --json` reported **0 vulnerabilities** in its current database | Registry advisory result only; does not cover unknown defects or dev/packaging dependencies |

The suites are [tests/server.test.ts](../tests/server.test.ts) and the independently authored [tests/browser-storage.test.ts](../tests/browser-storage.test.ts). Additional HTTP/MCP checks were disposable Node scripts invoking the same exported service, SQLite store and official MCP SDK; temporary databases and connection files were removed. Browser-adapter tests used in-memory IndexedDB emulation. No user workspace was read or changed.

## Published web verification

The reviewer exercised [the production landing page](https://zettel-iota.vercel.app/) and [the browser workspace](https://zettel-iota.vercel.app/app) on **2026-10-05**. The browser plugin was unavailable after coordinator troubleshooting, so verification used the application's installed Playwright runner with new isolated Chromium contexts. Only test-created, browser-local workspaces were changed; there was no account, shared workspace, deployment change or publication action.

HTTP checks returned **200** for `/`, `/app`, the referenced JavaScript and CSS assets, and `/brand/icon.svg`. The inspected responses included CSP with `object-src 'none'`, `frame-ancestors 'none'` and `connect-src 'self'`, HSTS, `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`. The initial HTML check at **16:37:40 UTC** had ETag `8a482954aa0dd8075dc41051530072e9`; it is a dated observation, not a guarantee about later deployments.

| Rendered scenario | Observed result | Limits |
| --- | --- | --- |
| Landing and workspace entry | **Passed** on desktop and at 390 × 844; primary action opens workspace, no horizontal overflow, no observed page errors | Narrow-screen checks cover landing and fresh workspace, not every dialog and editing flow |
| Project → cycle → issue → completion → linked note | **Passed** against production, including labels, assignment, estimate, status and comment persistence after reload | This is a single local browser workspace, not collaboration or synchronization |
| Export → invalid import → reset → actual exported-file restore | **Passed** against production; exported JSON contained the saved comment, malformed schema showed an error, restored ticket retained completed status and appeared in board view | Restore uses a downloaded file in the same browser profile; clean-host migration remains a separate scenario |
| Independent recovery download and restore | **Passed** in a fresh production browser context: created `ZET-1`, reloaded, completed/commented, downloaded and parsed JSON, reset and verified removal, downloaded the previous saved snapshot and verified its ticket/status/comment, restored the original export, reloaded again and reopened the preserved comment; zero observed page errors | Verifies the real download and restore UI in addition to adapter tests; no simulated quota failure in real Chromium |
| Concurrent stale draft | **Passed** with two pages sharing the same browser store; stale save was rejected both before and after reloading the workspace, the unsaved title remained in the dialog, and reopening showed the other page's committed description | Conflict is prevented; field-level merge is not provided or claimed |
| Accessibility scan | **Passed with zero serious or critical findings** for landing and example workspace using axe WCAG 2 A/AA and 2.1 AA tags | The test filters to these severities. It is not a full accessibility certification and does not cover all dialogs, keyboard flows or assistive-technology use |

The coordinator's [workbench tests](../e2e/workbench.spec.ts) and [accessibility test](../e2e/accessibility.spec.ts) were inspected, then run against production. The initial run passed three of four tests; the workflow test interacted with the background search field before asynchronous ticket save closed its modal. Repeating that original test reproduced the timing failure. A temporary copy adding only explicit dialog-closure waits after saves, reset and restore passed the complete workflow with all original assertions intact (**1/1**, 4.1 seconds). This is a test synchronization correction, not removal or weakening of a product assertion; the coordinator was asked to retain the waits in the source tests. A separately authored production persistence/recovery/export/restore scenario also passed (**1/1**, 4.5 seconds).

Temporary traces, screenshots and the production-only runner configuration were retained under `/tmp/zettel-production-review-7x4adnm4/` for this session. They are not versioned release artifacts.

## Review findings and resolution tracking

| ID | Priority | Finding and evidence | Required verification / state |
| --- | --- | --- | --- |
| V-01 | P1 | An open ticket draft can outlive a workspace reload. Initial `App.tsx` reload replaced current data while the editor retained its original object, and save replaced the complete issue against the refreshed revision | **Resolved for the reproduced rendered scenario.** Production two-page regression rejected stale saves before and after reload, retained the unsaved title, and preserved the other page's description. Source captures the opening revision for the entire modal lifetime |
| V-02 | P2 | Identifier allocation used the maximum surviving issue number. Independent probe created two issues, removed the second, and observed the third reuse `ZET-2` | **Resolved for tested paths.** Persisted high-water allocation and preservation during same-workspace restores now pass both SQLite and independent browser-adapter regressions |
| V-03 | P1 | A schema-valid imported identifier with an oversized numeric suffix was accepted but made subsequent `createIssue` fail during numeric allocation | **Resolved for reproduced input.** Identifier bounds reject the oversized import; independent browser regression confirms existing main/recovery data remain unchanged |
| V-04 | P2 | Browser storage initially retained only the main snapshot. Import triggered a download and immediately replaced work, although a programmatic download request does not prove a retained backup | **Resolved for tested adapter and rendered paths.** Atomic main/recovery writes pass restore and injected-failure tests. The independent production UI test downloaded the previous saved snapshot after reset and parsed its original ticket/status/comment, then restored the actual original export successfully |
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
| Browser persistence, restart, invalid import and multi-tab behavior | **Verified for reload, invalid-import rejection, actual file restore and stale-draft scenarios above** in production Chromium. Full browser process restart and other browser engines remain unverified |
| Web issue/project/cycle/note creation, keyboard and narrow-screen behavior | **Verified for the creation workflow, landing and fresh workspace at 390 px**. Full keyboard-only operation, all narrow-screen editing states and manual screen-reader testing remain unverified |
| SQLite persistence/concurrency and local HTTP/MCP basic boundary | **Proven for the narrow scenarios above**, subject to re-run after fixes |
| Offline web reopening / service worker behavior | **Unverified**; IndexedDB persistence alone does not establish offline app loading |
| Packaged desktop launch, SQLite runtime, reopen, backup import and process lifecycle | **Unverified**; build scripts and Electron settings do not establish a working download |
| macOS signing/notarization, Windows/Linux packages and supported architectures | **Unverified**; advertise only independently built and exercised artifacts, with unsigned previews clearly labeled |
| Published Vercel landing/app and all download destinations | **Landing and browser app independently verified above**. Desktop download destinations and packaged behavior remain separate release evidence |
| Real AI provider and claimed client integrations | **Unverified** beyond a stub and local SDK MCP client |
| Paid checkout, license/entitlement, refunds, support terms and recurring services | **Not demonstrated**; pricing remains a hypothesis, now consistently **$49 once** for the proposed Desktop offer |
| Collaboration, identity/tenancy, SSO/SCIM, programmable formulas/tables, advanced planning and full Linear parity | **Not demonstrated by this slice**; preserved in the capability ledger |
| Clean-host backup restore, supported upgrades, SBOM/notices/provenance and operational runbooks | **Not fully demonstrated**; required release evidence remains outstanding |

Do not mark the original user goal complete from this review. Passing local storage/protocol tests substantiates those mechanisms only.


## Alpha.2 visual refresh — coordinator checks

After the user requested a modern Linear-inspired restyle, the coordinator reran the entire Chromium suite against the revised local app on 2026-10-05: **4/4 passed**, including the new interactive sample list/board and selected-ticket behavior, desktop/mobile entry, full planning-to-delivery/export/restore flow, concurrent stale drafts, and axe WCAG2/2.1 A/AA scans with no serious or critical findings. The Node **24.21.0** storage/protocol suite passed **15/15**. These are coordinator results, separate from the independent production review above.

The landing-only independent visual review covered 1440×1000, 768×1024, and 390×844: no document overflow, no page errors, and no serious/critical axe findings. The reviewer exercised both sample views and selected-ticket detail. Screenshots are session-local under `test-results/style-review-*`. Final publication/package evidence belongs in [the release record](release-preview.md).


After publication, an independent reviewer exercised the new production deployment `dpl_EBSPEMswzyWPZuubNkAJtMR45L3E`: the new hero and Inter font were present, landing and app rendered dark, both 1440px/390px layouts stayed within the document width, workspace entry and direct `/app` worked, and an actual ticket/status survived reload in a fresh isolated browser context. No script/network failures or serious/critical axe violations were observed. The coordinator separately verified the actual alpha.2 packaged Mac executable through restart, bundled MCP, export/reset/import, isolation and navigation protections; these do not change the earlier independent reviewer's explicitly unverified platform scope. [The release record](release-preview.md) contains source SHA, CI link, published asset checksum, signing status and runtime versions.
