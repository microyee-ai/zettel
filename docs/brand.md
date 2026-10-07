# Zettel brand and interface direction

Reviewed direction: 5 October 2026. This replaces the pastel launch treatment in response to the user's request for a modern, Linear-inspired product. Availability is tracked separately from visual design.

## Position and voice

Zettel is a local-first workbench for turning ideas into shipped work. The homepage promise is **“A sharper way to move work forward.”** Copy names concrete capabilities: tickets, projects, cycles, notes, local storage, and optional AI. Prefer useful workspace information over motivational greetings. The broader programmable-workspace and team ambitions remain on the roadmap, with availability stated honestly.

## Reference review and decision

Current primary references are [Linear](https://linear.app/), [Linear features](https://linear.app/features), [Raycast](https://www.raycast.com/), and [Resend](https://resend.com/). See [rendered reference observations](research/visual-direction-2026-10-05.md). Adopt their clear hierarchy, substantial product views, crisp compact rows, quiet borders, and generous editorial spacing. Do not reproduce their brand assets, layouts, content, or decorative effects.

The UI/UX skill's two design-system searches were reviewed. Its dark contrast and interaction guidance fits; its documentation layout, generic SaaS sales pattern, pastel palette, motion-heavy suggestions, and decorative monospace do not fit this brief. The explicit product decisions below take precedence.

## Design plan

- Personality: precise, quiet, confident; a useful working instrument.
- Typography: locally bundled Inter Variable. Marketing headline 72–76px at desktop and 42px on mobile, medium weight with tight tracking. App text 13–14px, readable secondary metadata. System monospace only for actual identifiers or code.
- Palette: near-black background, charcoal surfaces, almost-white type. Restrained periwinkle for actions and active state; semantic color for status.
- Composition: left-aligned editorial hero over one substantial interactive sample workspace. Full-width rules and alternating product explanations replace small floating mockups and repeated rounded feature cards.
- Product density: 216px navigation, 52px app header, compact rows, clear sections. Overview shows real counts, projects, active tickets, and attention conditions. Modals and settings share the same surfaces and hierarchy.
- Motion: 140–180ms color/border/opacity feedback. No ambient glow, gratuitous parallax, rotating mockups, or scroll choreography. Respect reduced motion.

```text
Zettel                  Product / Local / Pricing          Open workspace

A sharper way
 to move work forward.        Short capability-led copy
Start workspace / Desktop

┌──────────────────────────────────────────────────────────────────────┐
│ Sample workspace                                                     │
│ Navigation │ Compact ticket list / board       │ Selected ticket      │
│            │ Status, ID, title, project        │ Context & properties │
└──────────────────────────────────────────────────────────────────────┘

Tickets / Projects / Cycles + notes: concise workflow descriptions

Your device. Your workspace.   Local data flow and explicit boundaries
AI with a review step.         Prompt → proposed tickets → your approval

Simple pricing rows           Free / proposed Desktop / planned Teams
Desktop availability          Actual versioned release + source guide
Useful details                Native disclosure rows

Start your next project.      Open workspace
```

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| Canvas | `#08090b` | Marketing and app background |
| Navigation | `#0f1012` | Sidebar, subdued panels |
| Surface | `#141518` | Work surfaces and dialogs |
| Elevated | `#1c1d22` | Hover and selected neutral surfaces |
| Border | `#292a30` | One-pixel structure |
| Primary text | `#f4f4f5` | Headings and primary content |
| Secondary text | `#a0a1ab` | Descriptions and metadata |
| Accent | `#8b94ff` | Interactive emphasis and selected state |
| Success | `#80c6a2` | Completed and local status |

Use 4.5:1 minimum body text contrast, visible focus, distinct symbols alongside status color, and 44px targets for primary/touch controls. Marketing uses a 1200px maximum content width and generous vertical space. Tight application density must preserve legibility. Corners are typically 5–8px, reserved for bounded controls and surfaces rather than every row.

## Identity

The original folded-ticket Z remains. Monochrome is the source of truth; app icon is a charcoal tile with a white mark and subtle gray fold. Assets in `public/brand/` contain original vector geometry. The SVG wordmark references Inter and system sans-serif. The name still needs a formal naming review; do not claim trademark clearance.

## Availability

The browser workspace opens without registration and stores data in that browser. Export backups, and say plainly that automatic sync and hosted teams are not implemented. The macOS Apple Silicon alpha is an actual downloadable developer preview; it is ad-hoc signed for integrity but is not Developer ID signed or notarized. Link its release notes rather than implying a trusted commercial installer. Free source builds remain available under Apache-2.0.

The source landing page now presents the free desktop preview. The earlier $49 official update/support proposal remains one option in the [October 7 pricing research](research/2026-10-07-desktop-market.md), alongside free desktop with optional services. No paid checkout is live. Final terms, official signing, support, and payment readiness require separate implementation and verification. Local AI requires the user's configured provider and has an explicit review step. MCP clients can make real local changes through tools. Never imply included AI credits or a hosted AI service.

The [launch playbook](launch-playbook.md) adds an independent-builder audience, a context-recovery message experiment, and measured launch/discovery steps. Its proposed alternative headline is a test candidate, not a validated reason to discard this visual direction.

## Validation

Inspect rendered landing and app views at desktop and mobile sizes. Verify navigation, buttons, sample preview tabs, keyboard focus, and no horizontal document overflow. Run the existing persistence/recovery workflows after restyling and automated accessibility checks; do not call a passing screenshot or scaffold validation product readiness.
