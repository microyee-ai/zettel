# Zettel market evidence

**Correction, 2026-10-07:** The Graphite entry below identifies an unrelated company. The user meant Microyee's Graphite. Retain this dated record as history; use the [corrected comparison](2026-10-07-desktop-market.md) for decisions.

Researcher: product_researcher. Accessed: **2026-10-05**. Scope: primary-source desk research for the coordinator; no competitor application was exercised. An observation below means a vendor document was inspected, not that its behavior was independently tested. Undated pages carry an access date rather than an invented publication date. Recommendations are in [market strategy](../market-strategy.md); product scenarios are in the [capability ledger](capability-ledger.md).

## What do current competitors establish?

### Takeaway

Task capture, software delivery, agent access and self-hosting already have strong comparators. Zettel needs a coherent experience across these jobs; adding an MCP endpoint alone does not establish differentiation.

### Cited Findings

- **Linear:** the inspected annual-billing display lists Free, Basic at **US$10/user/month**, Business at **US$16/user/month**, and custom Enterprise. Free includes 250 issues and two teams. Its feature inventory extends through issues, projects, cycles, initiatives, intake, analytics, agents and enterprise administration. Undated page, accessed October 5. [Pricing](https://linear.app/pricing)
- **Linear MCP:** its hosted service supports finding, creating and updating issues, projects and comments; uses Streamable HTTP; documents OAuth and token authentication; provides a read-only endpoint and scope. Undated page, accessed October 5. [MCP documentation](https://linear.app/docs/mcp)
- **Linear delivery semantics:** cycles have automated schedules and rollover rules; initiatives connect projects to higher-level goals and health updates. These are behavioral requirements to investigate, beyond matching sidebar names. Undated pages, accessed October 5. [Cycles](https://linear.app/docs/use-cycles), [initiatives](https://linear.app/docs/initiatives)
- **Todoist:** its free plan includes five personal projects, quick capture and list/board views; its Business plan adds shared team workspace and roles. Undated page, accessed October 5. [Plans](https://www.todoist.com/pricing)
- **Todoist pricing:** the Pro help article, updated **September 18, 2026**, gives **US$7/month or US$60/year**. The Business article, also updated **September 18, 2026**, gives **US$10/user/month or US$96/user/year**, effective from December 10, 2025. The Business article contains a conflicting phrase in its seat-addition FAQ (“$8 USD/user/year”); its main table and currency table agree on $96/year, so those tables are the basis here. Store, legacy and local-currency terms may differ. [Pro update](https://www.todoist.com/help/account-and-billing/plans/todoist-pro-pricing-update-in-2025-bxBvHZuJZ), [Business update](https://www.todoist.com/help/account-and-billing/plans/todoist-business-plan-pricing-update-dF5in65YM)
- **Todoist offline and agents:** the offline article, updated **September 4, 2026**, describes offline edits with later sync, requires previous login and warns against closing/logging out before unsynced changes have synchronized. Its developer documentation offers an official hosted MCP for reading and changing tasks/projects. These sources establish offline support, not an account-free local ownership model. [Offline](https://www.todoist.com/help/todoist/features/use-todoist-while-offline-4rbaZw), [official API/MCP](https://developer.todoist.com/api/v1/)
- **Graphite:** the developer code-review product at graphite.com offers free Hobby, **US$20/user/month Starter** and **US$40/user/month Team**, both displayed with annual billing, plus custom Enterprise. Hobby includes CLI, editor extension and MCP; paid tiers expand organizational repositories and review workflow. It is a subscription reference, not evidence for a perpetual desktop license. Undated page, accessed October 5. [Pricing](https://graphite.com/pricing)
- **Things:** Cultured Code explicitly describes one-time purchases separately for Mac, iPhone, iPad and Vision, with sync included. It excludes web, Windows, Linux and Android, and says shared realtime lists are unsupported. Its main site displayed **US$49.99 for Mac** when inspected; local App Store prices vary. Undated pages, accessed October 5. [Purchase/support](https://culturedcode.com/things/support/articles/2803552/), [Things](https://culturedcode.com/things/)
- **Plane:** its current pricing inventory includes work items, cycles, modules, pages, intake, initiatives, AI, approvals and enterprise controls. Its edition documentation distinguishes **AGPL-3.0 Community** from closed-source Commercial and Airgapped; marketed cloud capabilities must not all be attributed to Community. No self-hosted quote or seat minimum was independently established. Undated pages, accessed October 5. [Pricing/features](https://plane.so/pricing), [editions](https://developers.plane.so/self-hosting/editions-and-versions)
- **Plane One:** the historical one-time-license explanation remains online but now prominently states that One is sunset and unavailable, directing buyers to subscriptions. It must not appear in a table of active perpetual-license offers. Undated page, accessed October 5. [Plane One notice](https://plane.so/one/why-plane-one)
- **Super Productivity:** its official site offers account-free offline work, desktop/web/mobile clients, time tracking, task planning, optional sync and issue integrations. Its source license is MIT. This establishes an existing free local task-management alternative, not measured team-delivery parity. Undated pages, accessed October 5. [Product](https://super-productivity.com/), [license](https://github.com/super-productivity/super-productivity/blob/master/LICENSE)
- **Obsidian:** the founder’s **February 20, 2025** announcement makes commercial licenses optional, with local Markdown and paid optional services. This is a relevant ownership-and-services business model, not a software-ticketing benchmark. [Free for work](https://obsidian.md/blog/free-for-work/)

### Inferences

- The useful comparison set spans different categories: Linear for engineering execution, Todoist/Things for daily usability, Graphite for developer distribution and paid team workflows, Plane for deployment control, and Super Productivity/Obsidian for durable local use.
- A free local core needs superior project delivery and integrated context to persuade users to switch from already-free tools. Neither “offline” nor “AI-native” alone is a defensible claim of uniqueness.
- One-time payments should fund bounded app delivery/support; recurring operational costs need a separate offer. This is a business hypothesis, not a claim that the cited vendors disclose their unit economics.

### Gaps

- No user interviews, conversion data, retention study or willingness-to-pay evidence was gathered. Vendor pages are not proof of Zettel demand.
- Height’s first-party homepage and attempted shutdown article could not be retrieved. Secondary coverage reports a shutdown, but the date and cause were not verified from an accessible primary source. Height is excluded from active pricing/availability comparisons. [Attempted official site](https://height.app/)
- The user’s word “Graphite” is interpreted as the developer product at graphite.com. No evidence established that they intended a different product with that name.
- Todoist’s fresh pricing-page extraction omitted dynamic amounts; its dated official price-update articles supply the numeric benchmark instead. Plane’s cloud/self-hosted toggle and billing selection need interactive verification before quoting a specific self-hosted price.

## What does the programmable workspace need to preserve?

### Takeaway

The existing Zettel brief requires full software-work management plus programmable documents. A rich-text editor attached to tickets would satisfy only a small part of that ambition.

### Cited Findings

- The local brief explicitly preserves all Linear feature families alongside Coda-style documents and tables, with separate enterprise, installation and release gates. This is a **repository requirement**, not a competitor fact. [Product research, snapshot September 8, 2026](../product-research.md)
- Coda documents structured tables, connected views and relations; changes in one view propagate to its underlying table and other views. Undated page, accessed October 5. [Tables](https://help.coda.io/hc/en-us/articles/39555768266893-Overview-Tables)
- Coda Packs extend documents through sync tables, buttons, column formats and formulas. Undated page, accessed October 5. [Packs overview](https://help.coda.io/hc/en-us/articles/39555769996429-Overview-Use-Packs-in-Coda)
- Coda automations document scheduled, row-change, form and webhook triggers. Formula-column changes have specific exclusions, illustrating why a named feature is insufficient as a parity test. Undated page, accessed October 5. [Automations](https://help.coda.io/hc/en-us/articles/39555778179853-Automations-in-Coda)
- Grist documents an Apache-2.0 Community edition, an offline desktop application without an online-account dependency, and a separately licensed full edition. Its deployment guidance addresses persistent storage and formula sandboxing. Undated page, accessed October 5. [Self-managed Grist](https://support.getgrist.com/self-managed/)
- Linear documents shared security responsibilities, SCIM and audit logging. These are buyer-expectation references; no competitor certification or assurance transfers to Zettel. Undated pages, accessed October 5. [Security](https://linear.app/docs/security), [SCIM](https://linear.app/docs/scim), [audit log](https://linear.app/docs/audit-log)

### Inferences

- Model a ticket as a stable work object that documents can reference and edit through live views. Separate copies of a task in a document and tracker would undermine traceability.
- Project-management proposals should include scope/WBS, accountable owners, milestones, dependencies, capacity, risks, change decisions, release evidence and retrospectives. These are product proposals, not a claim of PMI certification or complete PMBOK conformance.
- AI should prepare a reviewable plan and propose changes against that same data model. Permission checks, provenance, idempotency and a visible action history belong to the core workflow.

### Gaps

- No execution, concurrency, security or restore tests of Zettel were conducted by this researcher. [Capability ledger](capability-ledger.md) rows are research/specification work, not implementation completion.
- The entire current Linear surface has not been enumerated at individual-control level. The ledger preserves all baseline families and calls out additional current families; major releases need a versioned, executable parity audit.
- Collaboration, conflict resolution, formula runtime, indexing and identity need architecture decisions and implementation evidence. A Vercel deployment of a landing page does not establish these capabilities.

## What licensing and commercial constraints follow?

### Takeaway

Keep the repository’s existing Apache-2.0 rights intact. A paid desktop offer can fund official distribution, updates and support; it cannot retroactively make commercial use of Apache-licensed source conditional on payment.

### Cited Findings

- The local README identifies Apache-2.0. The portfolio registry retrieved through authenticated GitHub API on **October 5, 2026** lists Zettel as planning/unreleased, Apache-2.0, last verified **September 14, 2026**. Public browser access returned 404 and the expected sibling checkout was absent; authenticated read recovered the source. [Local README](../../README.md), [portfolio registry](https://github.com/zinnoberHaus/zinnober-haus/blob/main/registry/repos.json)
- Apache-2.0 grants broad use/distribution rights subject to its conditions, includes patent provisions, requires specified notices, distinguishes trademarks, and permits charging for support or additional liability obligations. The license text is the controlling source. [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
- Plane’s Community and Commercial editions have different rights and source availability. The existence of a self-hosted binary does not itself confer open-source redistribution rights. [Plane editions](https://developers.plane.so/self-hosting/editions-and-versions)
- The shared workflow requires product ADRs, scoped issues, independent review and release evidence; the portfolio scope excludes sibling/other-owner modifications. These are local governance requirements. [Portfolio workflow](https://github.com/zinnoberHaus/zinnober-haus/blob/main/docs/operations/workflow.md), [portfolio agent context](https://github.com/zinnoberHaus/zinnober-haus/blob/main/AGENTS.md)

### Inferences

- Recommended packaging: open local/self-hosted core, optional official Desktop entitlement, optional hosted team service, and separately priced managed AI. Do not gate export, access to existing local records or Apache source rights behind a subscription.
- Any proprietary add-on needs a separately reviewed boundary, dependency audit and clear license. Do not import AGPL Plane implementation into a permissive distribution without an explicit compatibility decision.
- Brand assets should be independently designed. Comparator behavior is inspiration, not permission to copy icons, product names or implementation.

### Gaps

- No trademark search or legal clearance was performed for “Zettel.” Brand clearance is an outstanding release task.
- Final desktop support duration, update rights, refund terms, tax handling, checkout/entitlement supplier and pricing need accepted product decisions and working customer flows.
- No competitor source code is proposed for reuse by this research. A dependency notice inventory must follow actual pinned implementation dependencies.
