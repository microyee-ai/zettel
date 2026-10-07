# Zettel desktop market and pricing evidence

Reviewed **7 October 2026**. This is research and a proposed commercial decision, not an active offer, customer study, or release verification. Public sources were opened on this date; publication/update dates are recorded only when the source supplies them. USD amounts below are reference prices, not quotes or tax-inclusive totals. Local source inspection did not exercise competitor binaries or checkout.

**Recommendation:** keep the desktop preview free. Test a free official desktop with optional paid services as the preferred long-term model, with the existing **$49 once, 12 months of updates/support** concept as a serious challenger. An installer alone is a weak reason to pay in this market. Neither model is validated, and the preferred services do not exist yet. Do not start charging or promise their delivery based on this research.

The near-term customer is an independent software builder coordinating a real release across notes and tasks on one computer. The destination remains the full [Linear plus programmable-document work OS](../product-research.md), including collaboration, enterprise administration and customer-controlled hosting. A focused desktop launch does not remove those requirements.

## Scope and corrections to earlier evidence

- The user's **Graphite means `microyee-ai/graphite`, the notebook**, not graphite.com, the code-review business. Remove the latter from decision-making based on the user's requested comparables. Its October 5 entry in [market strategy](../market-strategy.md) and [market evidence](2026-10-05-market-evidence.md) is an entity-identification error, not evidence about the requested app.
- The existing [brand guide](../brand.md) remains the visual direction: original folded-ticket Z, near-black surfaces, restrained periwinkle, precise language. The proposal here refines audience, proof and copy; it does not replace the visual identity or establish name clearance.
- [Paid-launch](../paid-launch.md) and [ADR 0002](../decisions/0002-desktop-licensing.md) describe a possible paid distribution. This report challenges its commercial priority, not its engineering safeguards. A coordinator decision must reconcile public pricing, README and ADR before any new offer is presented as settled.
- The requested `../zinnober-haus` checkout was absent. The [registry URL](https://github.com/zinnoberHaus/zinnober-haus/blob/main/registry/repos.json) could not be read through public web access. Its local portfolio checkout at `/Users/xiuyangguan/Documents/Git/zinnober-haus/zinnober/registry/repos.json` and the adjacent governance files were inspected. That registry was last verified September 14 and still describes planning/unreleased Zettel; it is not evidence of today's release state. The coordinator explicitly authorized this Zettel checkout despite its stale owner exclusion. No sibling files were changed.

## The requested Microyee comparables

These are **observations of repository documents/configuration**, not independently verified install or revenue results. The main `Documents/Git/.../graphite` checkout was old, so `git worktree list` was used to locate the current worktrees. No competitor source is proposed for copying.

| Reference and inspected revision | What the source establishes | What it does not establish | Useful lesson for Zettel |
| --- | --- | --- | --- |
| Anttable, `353839aae648c70dfc4f33cb17a181c755464bd0`; [desktop guide](https://github.com/microyee-ai/anttable/blob/353839aae648c70dfc4f33cb17a181c755464bd0/desktop/README.md) | Electron shell loads its hosted application, with native menu/tray, window state, links, notification and key-vault work; macOS and Windows packaging is documented. Its guide identifies unsigned/ad-hoc limitations and an update feed dependent on setup. | A hosted shell is not proof of offline-first execution or local Zettel storage. Documentation is not a fresh install test. | Match installation ergonomics and honest availability disclosure; choose Zettel's storage/runtime on Zettel's own requirements. |
| Anttable, [launch plan](https://github.com/microyee-ai/anttable/blob/353839aae648c70dfc4f33cb17a181c755464bd0/docs/launch/README.md), dated October 3 | Draft billing plan: Plus $12 for 90 credits and packs $5/30 or $15/90; billing held pending implementation/setup/review. Launch depends on quality gates and repeat use. | These are neither verified live offers nor evidence users will buy a desktop installer. Costs of research credits do not transfer to local ticket management. | Put a real outcome and measured repeat use ahead of traffic; bound hosted AI costs separately. |
| Graphite, `cuttlefish` main `8431ddc` and `bonnethead` `308b495`; [README](https://github.com/microyee-ai/graphite/blob/8431ddc/README.md), [desktop guide](https://github.com/microyee-ai/graphite/blob/8431ddc/docs/desktop.md) | Local Markdown vault, Electron/Next desktop packaging, app menu and signed update-manifest design; Mac code signing/notarization remains a separately identified dependency. | Its update manifest signature is not an Apple publisher signature. This research did not install its artifacts. | Preserve local work through restarts/upgrades; explain publisher trust separately from artifact integrity. |
| Graphite, [October 7 direction](https://github.com/microyee-ai/graphite/blob/8431ddc/docs/direction.md), [price constants](https://github.com/microyee-ai/graphite/blob/8431ddc/src/account/plan.ts), [go-to-market](https://github.com/microyee-ai/graphite/blob/8431ddc/docs/go-to-market.md) | Direction proposes $4.99/month or $39.99/year after 30 days without a card, with the user's AI key. Inspected code still says $8/month, $72/year, 14-day trial; README says billing is off. | The proposed prices are not observed sales. Do not reuse either number as a current public subscription benchmark. | One product can have conflicting proposal/code state. Keep Zettel's offer copy, entitlement and release evidence in agreement; explain who pays for AI. |

## Public competitor evidence

Confidence is about what the source says: **high** means an explicit current first-party statement; **medium** flags a retrieval/display ambiguity. It never means Zettel demand has been validated. Competitor apps were not tested. These products solve overlapping jobs, rather than all being interchangeable issue trackers.

| Product / source | Offer and billing evidence | Relevant capability and competitive implication | Confidence / date |
| --- | --- | --- | --- |
| [Linear pricing](https://linear.app/pricing) | Free; Basic $10/user/month billed yearly; Business $16/user/month billed yearly; Enterprise custom. Free lists two teams and 250 issues. | Software-delivery reference. Current inventory includes projects, cycles, initiatives, agent platform and MCP. “Has tickets and AI” does not establish parity or uniqueness. | High; undated page, accessed Oct 7 |
| [Things Mac, US App Store](https://apps.apple.com/us/app/things-3/id904280696?mt=12), [purchase terms](https://culturedcode.com/things/support/articles/2803552/) | Mac $49.99; one-time purchase separately by Apple platform, with sync included. Mac trial 15 days. | Supports testing a polished one-time personal app. It does not demonstrate demand for an unfinished $49 Zettel package. No Windows/Linux/web client in the purchase guide. | High; undated offer, accessed Oct 7 |
| [Todoist Pro](https://www.todoist.com/help/account-and-billing/plans/todoist-pro-pricing-update-in-2025-bxBvHZuJZ), [Business](https://www.todoist.com/help/account-and-billing/plans/todoist-business-plan-pricing-update-dF5in65YM), [plans](https://www.todoist.com/pricing) | Pro $7/month or $60/year; Business $10/user/month or $96/user/year. Free has five personal projects. | Strong daily task capture and an established team upgrade. Zettel needs a specific project-context advantage, not just a lower nominal price. | High for headline/currency tables; both articles updated Sep 18, 2026, effective Dec 10, 2025. Business FAQ has an inconsistent seat-addition phrase; use its main tables. |
| [Obsidian pricing](https://obsidian.md/pricing) | Core free without signup; Sync $5/user/month or $4/month billed yearly; Publish $10/site/month or $8/month billed yearly. Optional Catalyst $25 once; optional Commercial $50/user/year. | Clear example of free local use plus optional services/support. Its optional commercial contribution is not a required work-use license. Zettel would still need to build and operate its own services. | High; undated page, accessed Oct 7 |
| [Super Productivity pricing](https://super-productivity.com/pricing/), [product](https://super-productivity.com/) | Free app, no premium app tiers; voluntary sponsorship. | Account-free local tasks, desktop clients, time tracking, issue integrations and optional sync already exist. Do not pitch “the first private offline task app.” External sync/service costs were not established here. | High for app terms; undated pages, accessed Oct 7 |
| [Notion pricing](https://www.notion.com/en-gb/pricing) | Free; USD view displays Plus $10/member/month and Business $20/member/month, with monthly/yearly toggles. Extraction does not identify the selected billing toggle reliably; **do not annualize these numbers**. | Documents/databases, collaboration and offline downloaded pages weaken blanket claims that hosted alternatives cannot work offline. Offline availability is not the same as an account-free local runtime. | High for displayed amounts/features; medium for billing basis. Undated page, accessed Oct 7 |

The Notion default URL returned EUR in one extraction; the English UK URL returned USD. The Things homepage omitted dynamic prices, so its US App Store supplied the amount. Todoist's pricing extraction omitted numeric amounts; dated help articles supplied them. These limitations are recorded instead of silently guessing a billing interval or exchange rate.

## Offer comparison and proposed decision

| Dimension | $49 once + optional annual updates | Free official desktop + paid services |
| --- | --- | --- |
| Immediate deliverable | Supported official package with 12 months of updates/support; keep acquired versions. Challenger renewal: $29 for another year, manually chosen, not automatic. | Useful desktop with local records and export; later services must have independently valuable, delivered benefits. |
| Reason to pay | Installation confidence, reliable upgrades, support, and a demonstrably better daily workflow. The binary by itself is easy to compare against free alternatives. | Managed sync/backups, actual collaboration, or scoped deployment/support. Users who need none can stay free. |
| Funding | Earlier cash per purchaser, but every new sale adds a coverage obligation; old buyers need not renew. | Revenue aligns with ongoing service expense, but free users create costs and service implementation is substantial. |
| Adoption friction | Purchase before an unknown product earns trust; a working no-card evaluation would help. | Easier trial and developer distribution; a large free audience does not guarantee paid attachment. |
| Open-source fit | Can sell official services/distribution while preserving Apache rights; cannot imply payment is required for commercial use of the covered source. | Straightforward adoption message; charging for convenience must not mean hiding export or customer-hosted capability. |
| Principal risk | Support cost erases a small purchase; users interpret “once” as every future OS/update forever. | Build an expensive cloud before demonstrating demand, or subsidize free users with too few paying users. |

**Proposed sequence:** distribute the accurately labeled free preview, establish repeat solo use, then compare the two offers with retained users. Prefer free official desktop unless the paid-app challenger produces materially stronger evidence. This is a reversible research recommendation, not a silent reversal of ADR 0002.

Future **interview price cards**, all explicitly unavailable: personal managed sync/backup **$5/month or $48/year**, and real team hosting **$10/member/month or $96/member/year**. These are test anchors, not approved tiers, forecasts or introductory discounts. Do not advertise team hosting before shared identity, permissions, conflict handling and restore are verified. Do not bundle unbounded hosted AI. User-configured AI has its own provider bill; a future managed AI add-on needs measured cost, a visible cap and a separate price.

## Unit economics: explicit assumptions and sensitivity

This is a planning model, not observed revenue, margin or a forecast. Price is revenue before any applicable tax. Assume US domestic cards at Stripe's displayed **2.9% + $0.30**, and an additional **0.7% of Billing volume** for the hypothetical subscription. Other countries, international cards, currency conversion, tax products, merchant-of-record services and commercial agreements can change fees. [Stripe pricing, accessed Oct 7](https://stripe.com/pricing)

All other inputs are **assumptions**: $60/hour labor; a 5% revenue reserve for refunds/fraud; $0.50 delivery/entitlement cost per desktop purchase; and a $1,000/month maintenance budget for illustrating break-even. The budget excludes general feature development, marketing and founder compensation; it is not a provider quote or signing budget. Replace each input with pilot records and actual vendor invoices before a pricing decision.

`desktop contribution = P − (0.029P + 0.30) − 0.05P − 0.50 − support minutes × 1.00`

| $49 purchase, first 12-month coverage | Contribution before fixed costs and acquisition | New sales/month to fund an illustrative $1,000 maintenance budget |
| --- | ---: | ---: |
| 5 support minutes per purchaser | $39.33 | 26 |
| 15 minutes, base assumption | $29.33 | 35 |
| 45 minutes | −$0.67 | No positive break-even |

At the base assumption, $5,000/month needs **171 new purchases/month**. A proposed $29 renewal with 10 support minutes contributes **$15.91**. At 25% or 50% renewal, that is only **$3.98 or $7.95** in expected second-year contribution per original buyer, before fixed costs. Renewal propensity is unknown. Do not treat $49 sales as recurring revenue or use an assumed lifetime value to justify paid ads.

For a future $48/year service, allocate revenue and fee across 12 months, reserve 5%, and assume $0.50 hosting plus 0.5 support minutes per paying user/month:

`monthly service contribution = 48/12 − (0.036×48 + 0.30)/12 − 0.05×48/12 − hosting − support minutes`

Base contribution is **$2.631/paying user/month**, or 65.8% of revenue. At $1.50 hosting and two support minutes it falls to **$0.131**, or 3.3%. Annual collection improves payment efficiency, but receiving cash upfront does not remove a year of service obligations. These calculations exclude AI, acquisition and fixed engineering.

The free population also costs money. With $0.05/month blended delivery/community-support cost per free active user, the following active population funds the same $1,000/month fixed budget:

| Paid share of active users | Net monthly contribution per active user, including free users | Active users required |
| --- | ---: | ---: |
| 5% | $0.08405 | 11,898 |
| 10% | $0.21810 | 4,586 |
| 20% | $0.48620 | 2,057 |

Formula: `active users = ceil(fixed budget / (paid share × 2.631 − free share × free cost))`. If free-user cost is $0.25 instead, 5% paid attachment is contribution-negative; 10% needs **26,247** active users. At 10% paid attachment, the stressed paid-service cost above is also contribution-negative even with $0.05 free-user cost. Free distribution is an adoption hypothesis, not free economics.

**Decision rule proposal:** retain the free preview while learning. Before commercializing either model, require no unresolved data-loss issue, repeated real-project usage, measured support cost and explicit price/term comprehension. For a service, target at least 60% contribution after measured service/support expense as an initial planning bar; revise price or scope if the conservative case fails. For the $49 app, keep fully loaded acquisition below the first-year contribution rather than guessing future renewals. Compare channel and retention quality as well as purchase intent. The [launch playbook](../launch-playbook.md) specifies the experiment and its limitations.

## Capability gaps, licensing and acceptance scenarios

The current [README](../../README.md) describes single-user local tickets/projects/cycles/notes, browser and SQLite storage, exports and optional AI/MCP. This research did not re-run these workflows. Release claims must use [release evidence](../release-preview.md), not this table.

| Requirement or proposed promise | Current evidence gap | Acceptance scenario / owner |
| --- | --- | --- |
| Requirement: useful installer | An archive or packaging target does not prove a clean install, trusted publisher, persistence or upgrade. | Release manager/verifier: download on each supported OS/architecture, install without source tools, create real work, quit/relaunch, update, export and restore; record artifact/version/checksum and signature status. |
| Requirement: local continuity | Browser and desktop storage are separate; “your device” does not imply encryption, backup or synchronization. | Implementer/verifier: explain the active storage location, disconnect network, create/edit/restart, restore into a fresh location and compare records; disclose any externally configured AI traffic. |
| Proposal: better solo project context | No observed switching or repeat-use study. | Product researcher: user creates a project, linked note and actionable tickets, returns on a different day, advances work and retrieves the decision without researcher direction. |
| Proposal: $49 coverage | No validated demand, settled terms or live commerce. | Product/release owners: user can state what expires, retain acquired local version/data, retrieve purchase, obtain eligible update, and exercise refund/support flow. Apply paid-launch gates before sale. |
| Proposal: managed service | No cloud sync or team service today. | Architect/implementer/verifier: independent clients edit concurrently, resolve offline conflicts, isolate permissions, recover backups and cancel service while retaining local data/export. |
| Requirement: full work OS | Current notes are not collaborative programmable documents; descriptive assignees are not members/roles. | Preserve [capability ledger](capability-ledger.md): one shared specification/table controls real issues with formulas/actions, permission-safe references, audited automation, team planning and enterprise identity/recovery. Each family needs its own verified scenarios. |
| Proposal: credible brand | No customer language study or name/trademark clearance. | Product/design owner: five target users identify audience/job/storage/availability from the page; naming owner reviews exact-name, domain and relevant market conflicts before major promotion. No claim of legal clearance. |

The existing [Apache-2.0 license](../../LICENSE) remains authoritative. Its grants and notice requirements permit commercial use and distribution subject to the license, while trademarks are separate. Official support, hosting and updates can be sold without recharacterizing existing source rights. [Apache license text](https://www.apache.org/licenses/LICENSE-2.0)

No competitor code or artwork is imported by this research. Any future reuse needs the exact source/license/version review; a sibling checkout is not a license grant. A separate proprietary module would need an explicit boundary and compatibility decision. Do not make free export or existing local work depend on a new subscription. Keep source/dependency notices with the actual packaged release.

## Evidence still required

No customer interview, willingness-to-pay response, market-size estimate, adoption benchmark, conversion result, paid purchase, creator agreement or trademark clearance was produced. Public vendor claims were not independently exercised. Revenue and conversion cannot be inferred from a competitor's advertised price. The next evidence is observed real-project use and the pre-registered offer comparison, not a broader list of competitors.
