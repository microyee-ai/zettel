# Zettel visual direction

Research date: **2026-10-05**. Scope: a bounded visual study for the explicitly requested modern restyle. This document separates current reference observations from proposed Zettel choices. It does not establish competitor feature parity or change the [full product ambition](../product-research.md).

## Requirements and method

The user requested a complete, more modern and visually distinctive restyle, referring to Linear. The coordinator selected charcoal `#08090b` / `#111215`, gray-white text, subtle neutral borders, blue-indigo as the brand accent, Inter Variable typography, and a monochrome refresh of the original Zettel identity. These are project decisions, not findings that users have validated.

Reviewed primary pages: [Linear homepage](https://linear.app/), [Linear features](https://linear.app/features), [Raycast homepage](https://www.raycast.com/), and [Resend homepage](https://resend.com/). All rendered successfully in new isolated Chromium contexts on the research date. The application Playwright runner was used because the browser plugin had already been found unavailable; no personal browser or account was accessed. Screenshots were viewed, not merely saved. Linear/Raycast captures use 1440 × 1000; Resend uses 1440 × 1050. Some computed typography/color values were sampled from the rendered DOM. They describe those viewports and that visit, not a complete competitor design specification.

README, the product research brief, and the umbrella registry were also read. The sibling registry checkout was absent; authenticated GitHub API access retrieved [the registry](https://github.com/zinnoberHaus/zinnober-haus/blob/main/registry/repos.json), whose entries are dated 2026-09-14. No portfolio scope or repository was changed.

## Observed references

| Reference | Concrete observations | Useful implication |
| --- | --- | --- |
| [Linear homepage](https://linear.app/) | Left-aligned hero with approximately 78 px gutters at 1440 px. Rendered heading: Inter Variable, 64 px / 64 px, weight 510, tracking −1.408 px. Background `rgb(8,9,10)` and primary text `rgb(247,248,248)`. Large product panel starts around y=528. Its compact navigation, issue metadata and activity establish detail; separators and small tonal differences organize the interface. Secondary copy is gray; vivid color mostly identifies state. | Make a substantial, recognizable Zettel workspace the visual centerpiece. Use measured typography and information density; give the surrounding page more space than the application controls. |
| [Linear features](https://linear.app/features) | Centered 976 px content region, with a 64 px medium heading. The opening icon composition is mostly monochrome. Later sections combine full-width proof panels and two-column panels rather than uniform repeated cards. Diagrams and interface fragments occupy most of each panel, with concise labels beneath. Thin outlines separate dark surfaces. | Vary section proportions. Explain each existing capability using relevant product detail, rather than a repeated icon/title/paragraph card pattern. |
| [Raycast homepage](https://www.raycast.com/) | Background `rgb(7,8,10)`; centered Inter 64 px / 70.4 px, weight 600. A large red atmospheric composition carries its identity. The light download button has an 8 px radius and compact 14 px label. A later large product composition shows dense list/detail organization and a clear selected row. | Borrow command-interface clarity, compact controls and strong action contrast. Its dramatic red artwork is a brand-specific choice; it is not a reason to add large decorative gradients to Zettel. |
| [Resend homepage](https://resend.com/) | Black background, primary text `#f0f0f0`, secondary `#a1a4a5`. A 96 px regular serif heading contrasts with Inter 18 px / 27 px supporting copy in a roughly 480 px column. Generous space surrounds the hero. The integration demonstration uses a broad outlined panel, quiet tabs and a single divider. | Establish hierarchy through scale, space and alignment while retaining Zettel's chosen Inter. A single coherent demonstration can do more than many small feature cards. |

Motion observations are limited. Linear's rendered pages had active CSS animations, including repeating 20–30 second feature-page loops; Raycast had active short transitions. Static screenshots do not establish their full sequence, trigger behavior, reduced-motion support or performance. Resend motion was not sufficiently examined. The animation recommendations below are Zettel proposals, not claims about measured competitor interaction quality.

## Proposed Zettel composition

**Landing page.** Use a broad, left-aligned opening with a concise headline, one short supporting paragraph and a clearly dominant action. Follow it with one large, original workspace composition showing real ticket titles, status, project context and useful relationships. Give the product panel most of the visual weight. Arrange later sections around a few specific workflows: capture and organize, plan and finish, retain control of work. Use a mix of wide and split sections so the page has a deliberate rhythm. Keep availability and pricing explanations clear and visually quieter than the product story.

**Workspace.** Reduce decorative spacing around repeated controls. Use a compact navigation rail, consistent toolbar, aligned list rows and quiet grouping labels. Align identifiers, titles and metadata in stable columns; reserve lighter surface tones for selection, hover and overlays. Treat empty states as useful next actions. Keep project/cycle/note views recognizable within the same shell. A beautiful landing page does not satisfy the requested restyle if the working application still uses a separate, softer card system.

| Proposed token or rule | Starting target |
| --- | --- |
| Base / raised surfaces | `#08090b` / `#111215`; an additional slightly lighter overlay surface only where needed |
| Primary / secondary text | Gray-white for primary content; readable cool gray for supporting content. Verify actual contrast rather than reducing opacity by eye |
| Brand accent | One blue-indigo family for primary emphasis, selected navigation and keyboard focus. Retain distinct accessible semantic colors for errors/status where needed |
| Borders | One-pixel neutral separators; stronger outline only for focus or meaningful emphasis |
| Typography | Inter Variable throughout; hero 64–76 px at desktop, 40–48 px on narrow screens; section titles 36–44 px; workspace titles 20–28 px; ordinary controls 13–14 px |
| Weight and tracking | Medium headings around 500–550; semibold for compact labels only where useful. Slightly tight large-display tracking; ordinary body tracking stays natural |
| Control geometry | Approximately 6–8 px radii on controls, 12–16 px on major product panels; consistent row rhythm around 36–44 px, adjusted for touch targets |
| Spacing | Desktop page gutters approximately 64–80 px; mobile 20–24 px. Spacious storytelling outside the app, compact repeated controls inside it |
| Motion | Short 140–200 ms color/opacity/position feedback; small travel distances. Respect reduced motion. Never delay data entry, saving or navigation for an entrance effect |

These values are a coherent starting system, not a requirement to reproduce another site's exact dimensions. Fine-tune them against Zettel's actual content at desktop and mobile widths.

Avoid an all-purpose glow behind every section, gradient text as the primary hierarchy, equal-sized cards for unrelated content, oversized pill treatments on ordinary controls, faint gray essential labels, excessive rounded nesting, invented customer logos and fabricated product metrics. Keep the original Zettel mark and wording. Render only capabilities that exist or label future concepts as proposed; visual ambition does not authorize claims of collaboration, programmable documents, included AI or active paid licensing.

## Acceptance scenarios

1. At 1440 px, the headline and primary action are immediately identifiable, and the first workspace composition demonstrates useful product detail without competing decorative elements.
2. At 390 px, landing text wraps intentionally; navigation, actions and product preview fit without horizontal overflow. Editing dialogs remain operable within the viewport.
3. In the example workspace, a user can scan ticket identifier, title, status and project without decoding color. Hover, active selection, keyboard focus and disabled controls have distinct visible states.
4. A user can create a project/cycle/ticket, comment, finish work and restore an export after the restyle. Existing persistence and stale-draft protections still pass their regressions.
5. Keyboard focus remains visible on charcoal; modal focus behavior survives; required text/control contrast is checked. Run accessibility checks after final colors, not only against the old design.
6. With reduced motion enabled, all information and actions remain available without decorative movement. Reloading into the app does not produce a flash of the earlier visual theme.

## Evidence files and reuse boundary

Reference screenshots are session review evidence under ignored `test-results/`, not shipped application assets:

- `test-results/reference-linear-home-desktop.png`
- `test-results/reference-linear-home-detail.png`
- `test-results/reference-linear-features-desktop.png`
- `test-results/reference-linear-features-detail.png`
- `test-results/reference-raycast-desktop.png`
- `test-results/reference-raycast-detail.png`
- `test-results/reference-resend-desktop.png`
- `test-results/reference-resend-detail.png`

No competitor source code, font files, artwork, logos or other assets were copied into the application. Screenshots naturally contain their source brands and are for internal visual comparison. Zettel's implementation, artwork and identity should remain original, with its own dependency/font notices maintained. This study does not grant rights to redistribute competitor materials.
