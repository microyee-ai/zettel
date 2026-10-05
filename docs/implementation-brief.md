# Local workbench release: scoped implementation brief

Requested outcome: a distinctive Zettel brand and public landing page; a useful local-first web and downloadable desktop work tracker; optional AI and MCP ticket workflows; a credible freemium/desktop license model; deployment on Vercel. The existing full product and enterprise scope remains in `product-research.md`.

## Acceptance slices

- **ZET-101 / coordinator:** web workspace can create, edit, search, filter, group and move tickets; manage projects, cycles, dependencies, comments, due dates, estimates and linked notes; derive delivery progress; survive reload; export and restore validated backups. Keyboard and narrow-screen use are verified.
- **ZET-102 / design implementer:** original brand/icon assets and responsive landing page with accurate product preview, usable open-app action, pricing proposals and honest download availability. No fabricated testimonials or unsupported product claims.
- **ZET-103 / runtime implementer:** one localhost SQLite workspace shared by browser/desktop and MCP, optimistic concurrency, scoped local access, explicit audit events; standalone desktop bundle with no external Node requirement; reproducible builds and persistence tests.
- **ZET-104 / research:** refreshed competitor/pricing primary sources, differentiation, license/monetization separation, and full roadmap with release gates. Proposed pricing is not represented as established demand.
- **ZET-105 / verifier:** independent functional/security review and installation evidence. Publish verified web build to the explicitly named Vercel Zettel project; document release/signing/payment/collaboration gaps rather than claim general readiness.

## Scope and dependencies

Record ADR before introducing engines. Schema and storage contract precede UI/runtime integration. Browser IndexedDB and localhost SQLite are distinct locations; backup portability does not imply synchronization. Pricing and billing must preserve existing Apache-2.0 rights. Do not publish a paid checkout or promise licensed features before payment, entitlement, refund and support paths are implemented and verified.

Verification includes restart/restore, stale-write rejection, invalid import preservation, dependency validation, MCP tool lifecycle, localhost origin/token boundaries, desktop runtime probe, app build, desktop package, responsive UI inspection and production HTTP checks. Existing planning validation remains separate from application tests.
