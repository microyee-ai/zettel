# Zettel delivery plan

Date: 2026-10-05. Implementation coordination: [GitHub issue #9](https://github.com/microyee-ai/zettel/issues/9). Local IDs below are scoped work items, not assertions that corresponding external issues have been created. The coordinator owns integration; specialist roles own bounded paths. No milestone dates are promised before independent verification.

The first deliverable is a usable branded local work app, reachable on the web and downloadable as a desktop preview. The original full enterprise and programmable-workspace ambition in [the product brief](product-research.md) and the [capability ledger](research/capability-ledger.md) remains visible scope. Completing the first milestone does not establish full product completion.

## Immediate delivery work

| ID | Outcome and acceptance | Owner / dependencies | Required evidence |
| --- | --- | --- | --- |
| ZET-ARCH-01 | Original implementation/runtime/reuse decision precedes framework commitment; one model and explicit browser/local separation | architect | [ADR 0001](decisions/0001-local-first-runtime.md); current source matches interfaces |
| ZET-BRAND-01 | Original wordmark, icon and visual system; coherent responsive landing page with accurate claims | design implementer; ARCH-01 | Brand source assets, rendered desktop/mobile review, no copied competitor marks |
| ZET-WEB-01 | Create/edit/search tickets; board/list; projects, cycles, notes, dependencies/comments; refresh preserves work | app implementer; ARCH-01 | Real browser workflow and persistence evidence, keyboard/mobile checks, meaningful error states |
| ZET-LOCAL-01 | Localhost serves same app with durable SQLite, validated full snapshot, revision conflicts and no silent data fallback | runtime implementer; ARCH-01 | `tests/server.test.ts`, clean startup/restart, documented data path |
| ZET-PORTABLE-01 | Export and restore the full workspace between browser and local modes; corrupt imports leave existing data untouched | app/runtime implementers; WEB-01, LOCAL-01 | Cross-adapter fixture round trip and UI import/export exercise |
| ZET-MCP-01 | AI clients list/read/create/update tickets and projects against the same local store with traceable actor | runtime implementer; LOCAL-01 | SDK client handshake and resulting persisted UI-visible records; read-only mode removes writes |
| ZET-AI-01 | BYOK provider proposes valid tickets; review precedes save; disabled/error mode preserves normal work | app/runtime implementers; LOCAL-01 | Stub contract tests plus separately recorded real-provider test, secret scan, review UI exercise |
| ZET-DESKTOP-01 | Electron package runs without system Node; narrow preload, sandbox, SQLite persistence; actual downloadable artifact | runtime implementer/release manager; WEB-01, LOCAL-01 | Exact Electron SQLite probe; artifact hash; launch, create, restart and export evidence; signing state |
| ZET-DEPLOY-01 | Public Vercel landing/app routes work, browser saves persist, CTAs resolve to real artifacts or truthful planned status | coordinator/release manager; WEB-01, BRAND-01 | Public URL and rendered route checks, persistence test, download HTTP/checksum checks |
| ZET-COMMERCE-01 | Freemium/paid distribution model is truthful; purchase, entitlement activation, renewal/refund and expiry behavior exist before charging | coordinator; market research, DESKTOP-01 | Maintainer's pricing/merchant policy, sandbox transaction and signed entitlement tests; never lock export on expiry |
| ZET-RELEASE-01 | Independent reviewer checks actual app/security/recovery and reconciles every completion claim | verifier/security reviewer; preceding deliverables | Per-criterion verified/contradicted/unverified report, notices/SBOM, release limitations |

Runtime unit/integration evidence currently proves seven backend scenarios and successful runtime bundling. It does not prove desktop installation, real AI credentials, live payments, web UX or Vercel availability. Update evidence as those owners finish; keep incomplete gates open.

## Follow-on milestones preserving full scope

| Milestone | Scoped work families | Exit gate |
| --- | --- | --- |
| Reliable solo release | Per-platform signing/installers and tested updates; repeatable imports; automatic backup scheduling; keyboard/accessibility polish; richer project health/milestones; calendar/time-zone correctness | New user downloads, installs, completes a real project workflow, upgrades and restores without source tools |
| Small team collaboration | Server authority, identity, workspace/team membership, roles and invites; tested conflict resolution and realtime delivery; notifications; scoped agent credentials; background job retries | Multiple users collaborate across clients with server-enforced authorization and recoverable offline behavior |
| Delivery management | Initiatives, milestones, roadmap/timeline, dependencies, cycle rollover/capacity, intake/triage, estimates, delivery reporting, GitHub/GitLab reconciliation | Deterministic fixtures and complete planning-to-release scenarios across roles and teams |
| Programmable workspace | Collaborative rich documents, relational tables, linked views, formulas, forms/buttons, automations and connector policy | One spec drives live work records; permission-safe computation; bounded formula runtime; retry-safe external actions |
| Enterprise self-hosting | Container install, TLS/admin bootstrap, SSO/OIDC/SAML, SCIM, granular access, audit export, retention, backup/restore and upgrades | Independent isolation/security review plus a customer-controlled pilot with measured resource use and recovery |
| Full parity program | Every remaining Linear/Coda feature-family scenario in the versioned ledger, advanced analytics/intake, client coverage and integrations | Each ledger row verified or still explicitly open; no full-parity claim while items remain unverified/deferred |

Hosted team plans, managed AI and paid support create ongoing operational responsibilities: tenant database/backups, mail, auth, observability, rate limits, billing reconciliation, incident handling and customer support. Static Vercel hosting proves none of those services. Single-user local HTTP tokens do not become team authorization merely by exposing the port.

## Handoffs and guardrails

1. Product researcher maintains dated primary-source comparisons and proposed pricing; architecture records consequential engine decisions before implementation.
2. Coordinator assigns file ownership and accepted criteria. Implementers provide changed paths, commands/results, migration effects and remaining work.
3. Security review covers Electron privilege boundaries, localhost Origin/Host/token checks, AI secrets and MCP write scope. Verifier tests artifact/runtime behavior independently of implementation assertions.
4. Release manager prepares per-platform artifacts and truthful notes. Coordinator handles authorized publication/deployment; delegated architecture work does not publish releases or change repository access.
5. Outstanding commercial choices return to the maintainer: price validation, merchant of record, license/update terms, refund/tax handling, signing identities and supported platforms. Apache-2.0 source rights remain in force; a paid official distribution/support offer must describe the actual entitlement.
