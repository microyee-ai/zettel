# Zettel brand and interface direction

Status: original identity and first website direction, October 2026. Product availability is tracked separately from brand intent.

## Position

Zettel gives independent makers and software teams a calm place to turn an idea into shipped work. The first experience is a local workspace. Optional AI and future shared hosting extend the workspace; they do not replace understandable tickets, projects, and data ownership. Keep the wider programmable-workspace and enterprise ambition visible in the product roadmap without presenting it as implemented.

The homepage promise is **“Less managing. More making.”** Supporting copy names concrete work: capture a ticket, plan a project, and follow it through. The voice is direct, warm, and precise. Use sentence case, ordinary verbs, and honest availability labels. Avoid fictitious testimonials, customer logos, performance claims, and assertions that planned functionality has shipped.

## Identity

The original mark is a folded ticket that forms a Z. Two horizontal paper strips and a diagonal join suggest a note becoming forward motion. The clipped upper-right and lower-left corners echo a folded paper slip without relying on a literal checkbox. The mark must stay legible at 20 pixels. The monochrome mark is the source of truth; the app icon adds a violet tile.

Assets live in `public/brand/`:

- `zettel-mark.svg`: violet mark on transparent background.
- `zettel-mark-ink.svg`: ink mark for plain backgrounds.
- `zettel-icon.svg`: rounded violet app icon with white mark.
- `icon.svg`: canonical app/favicon copy of the rounded icon.
- `zettel-wordmark.svg`: horizontal wordmark for non-HTML placements.

All vector geometry is original to this repository. The wordmark uses text with a Manrope fallback, so installations requiring identical raster output should render with the bundled Manrope font or convert the text to paths in a design export. Do not claim trademark clearance; the public name remains subject to a naming review.

## Design tokens

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#f7f8fc` | Quiet page background |
| White | `#ffffff` | Work surfaces and tickets |
| Ink | `#202337` | Primary text and navigation |
| Violet | `#635bdb` | Brand, primary actions, selected state |
| Lavender | `#ecebfb` | Selected surfaces and illustration ground |
| Sage | `#708b7c` | Completion and local-storage accents |

Secondary text uses a darker slate to retain contrast on the light page. Borders are cool gray. Status colors always accompany text or a distinct symbol. Use small shadows only for overlapping ticket layers and the hero workbench, not every content block.

Manrope is the single type family, locally bundled by the application. Headlines use medium or semibold weight with tight but readable tracking; body copy uses regular weight with comfortable line height. Headlines are left-aligned. Body lines remain below roughly 75 characters. No monospace styling for decorative metadata and no tracked uppercase eyebrows.

## Page composition

The folded ticket is the memorable device. The page pairs an editorial headline with a carefully composed sample workbench. The preview shows recognizable project work rather than invented metrics. An offset lavender plane gives the workbench a physical place on the page without a decorative gradient.

```text
mark + wordmark      product / local / pricing       open workspace

Less managing.       ┌───────────────────────────────────────────┐
More making.        ┌┤ sample project: tickets moving toward done │
clear promise       │└───────────────────────────────────────────┘
open / desktop      └ lavender work surface

audience line       independent makers / small teams / side projects

project story       ticket detail alongside workflow explanation
local ownership     oversized folded note, practical portability copy
optional AI         explicit current / planned availability
pricing             free / proposed desktop license / planned teams
downloads           actual release or source-build availability
footer              simple closing invitation and useful links
```

Avoid interchangeable icon grids. Product sections should explain real workflow decisions with ticket-shaped artifacts, clear text, and different proportions. Empty space is part of the identity. Animation is limited to one subtle hero entrance and responses to user actions; reduced-motion preferences disable the entrance.

## Availability and commercial language

The browser CTA opens an actual local workspace without requiring registration. Explain that data is stored in that browser and that users should export backups. Do not imply hosted synchronization, shared permissions, encrypted storage, or verified enterprise readiness.

Until signed release artifacts exist, desktop access links to source-build instructions and says so explicitly. Never present a source archive as a ready-to-install desktop download. A proposed $49 desktop purchase is a pricing hypothesis, inspired by paid personal-productivity software. It is not a live checkout, and an open-source license is not a paid feature entitlement. Explain what a commercial offer includes before taking payment.

Cloud teams, hosted collaboration, licensed desktop upgrades, and agent capabilities must be labeled according to their actual implementation evidence. Availability copy should be updated when an end-to-end verification establishes the feature, not when a mockup or scaffold exists.

## Accessibility and responsive behavior

Every action has visible keyboard focus. Navigation remains usable without hover. The hero preview is labeled as sample data. Decorative illustrations are hidden from assistive technology when adjacent text gives their meaning. Content flows into a single column on narrow screens; the preview is simplified rather than making the page horizontally scroll. Touch targets are comfortably sized. Information is never conveyed by color alone.
